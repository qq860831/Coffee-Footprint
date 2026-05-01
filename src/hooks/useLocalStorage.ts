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

  // Sync with cloud database on component mount
  useEffect(() => {
    const fetchCloudData = async () => {
      try {
        const response = await fetch(`/api/sync?key=${key}`);
        if (response.ok) {
          const data = await response.json();
          if (data && data.value !== null) {
            // Cloud has data, sync it down to local
            setStoredValue(data.value);
            window.localStorage.setItem(key, JSON.stringify(data.value));
          } else if (data && data.value === null) {
            // Cloud is empty. If we have local data, push it UP to initialize the cloud database!
            const localItem = window.localStorage.getItem(key);
            if (localItem && localItem !== '[]') {
              console.log('Pushing existing local data to empty cloud database...');
              await fetch('/api/sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key, value: JSON.parse(localItem) }),
              }).catch(err => console.error('Failed to initialize cloud data:', err));
            }
          }
        }
      } catch (error) {
        console.error('Failed to sync from cloud:', error);
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
