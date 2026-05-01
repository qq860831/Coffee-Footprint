import { useState, useEffect } from 'react';

export function useLocalStorage<T>(key: string, initialValue: T) {
  // State to store our value
  // Pass initial state function to useState so logic is only executed once
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === "undefined") {
      return initialValue;
    }
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  // Cloud-first sync: always pull from cloud on mount
  // Cloud is the source of truth. Local storage is just a cache for instant render.
  useEffect(() => {
    const fetchCloudData = async () => {
      try {
        const response = await fetch(`/api/sync?key=${key}`, { cache: 'no-store' });
        if (!response.ok) return;

        const data = await response.json();

        if (data && data.value !== null && Array.isArray(data.value)) {
          // Cloud has data → always update local with the latest cloud version
          setStoredValue(data.value as T);
          window.localStorage.setItem(key, JSON.stringify(data.value));
        } else if (!data.value || (Array.isArray(data.value) && data.value.length === 0)) {
          // Cloud is empty → push local data up to initialize
          const localItem = window.localStorage.getItem(key);
          if (localItem && localItem !== '[]') {
            await fetch('/api/sync', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ key, value: JSON.parse(localItem) }),
            });
          }
        }
      } catch (error) {
        console.error('Cloud sync failed:', error);
      }
    };
    fetchCloudData();
  }, [key]);

  // Return a wrapped version of useState's setter function that ...
  // ... persists the new value to localStorage and the cloud.
  const setValue = async (value: T | ((val: T) => T)) => {
    try {
      // Allow value to be a function so we have same API as useState
      const valueToStore =
        value instanceof Function ? value(storedValue) : value;
      
      setStoredValue(valueToStore);
      
      if (typeof window !== "undefined") {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }

      // Sync to cloud database asynchronously
      await fetch('/api/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ key, value: valueToStore }),
      }).catch(err => console.error('Failed to save to cloud:', err));

    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error);
    }
  };

  return [storedValue, setValue] as const;
}
