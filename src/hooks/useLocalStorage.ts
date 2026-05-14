import { useState, useEffect } from 'react';

const SYNC_API = '/api/sync';

async function fetchFromCloud<T>(key: string): Promise<T | null> {
  try {
    const res = await fetch(`${SYNC_API}?key=${encodeURIComponent(key)}`, {
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.value ?? null;
  } catch {
    return null;
  }
}

async function pushToCloud<T>(key: string, value: T): Promise<void> {
  try {
    await fetch(`${SYNC_API}?key=${encodeURIComponent(key)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(value),
    });
  } catch (err) {
    console.warn('Cloud sync push failed:', err);
  }
}

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') return initialValue;
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  // On mount: pull from cloud, cloud wins
  useEffect(() => {
    fetchFromCloud<T>(key).then((cloudValue) => {
      if (cloudValue !== null) {
        setStoredValue(cloudValue);
        try {
          window.localStorage.setItem(key, JSON.stringify(cloudValue));
        } catch {}
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore =
        value instanceof Function ? value(storedValue) : value;

      setStoredValue(valueToStore);

      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }

      // Push to cloud in background
      pushToCloud(key, valueToStore);
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error);
    }
  };

  return [storedValue, setValue] as const;
}
