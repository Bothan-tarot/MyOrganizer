import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useRef, useState } from 'react';

/**
 * useState backed by AsyncStorage. Stored objects are merged over `initial`
 * so that settings added in a later version get their default value;
 * `migrate` can upgrade older stored shapes.
 */
export function usePersistedState<T>(key: string, initial: T, migrate?: (stored: T) => T) {
  const initialRef = useRef(initial);
  const migrateRef = useRef(migrate);
  const [value, setValue] = useState<T>(initial);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(key)
      .then((raw) => {
        if (!raw) return;
        const stored = JSON.parse(raw);
        const base = initialRef.current;
        const isObject = typeof base === 'object' && base !== null && !Array.isArray(base);
        const value = isObject ? { ...base, ...stored } : stored;
        setValue(migrateRef.current ? migrateRef.current(value) : value);
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, [key]);

  useEffect(() => {
    if (loaded) AsyncStorage.setItem(key, JSON.stringify(value)).catch(() => {});
  }, [key, value, loaded]);

  return [value, setValue, loaded] as const;
}
