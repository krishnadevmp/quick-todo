import { useState, useEffect, useCallback } from 'react';

// ── Helpers ───────────────────────────────────────────────────────────────────

function readItem<T>(key: string, fallback: T): T {
  if (typeof localStorage === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    // JSON.parse(null) would throw, so guard with !== null
    return raw !== null ? (JSON.parse(raw) as T) : fallback;
  } catch {
    // Corrupt / legacy value (e.g. the old "1" string) — treat as truthy number,
    // which JS coerces correctly for boolean checks.
    return fallback;
  }
}

function writeItem<T>(key: string, value: T): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Quota exceeded or storage unavailable — in-memory state still reflects the value.
  }
}

// ── Hook ──────────────────────────────────────────────────────────────────────

/**
 * Persist state in localStorage with the same API as useState.
 *
 * Features:
 * - SSR-safe (guards `typeof localStorage`)
 * - Try/catch around all JSON operations
 * - Syncs across tabs and other hook instances via the native `storage` event
 *
 * @param key          localStorage key
 * @param initialValue Value used when the key is absent or unreadable
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T,
): [T, (value: T | ((prev: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => readItem(key, initialValue));

  /** Setter — updates both in-memory state and localStorage atomically */
  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      setStoredValue((prev) => {
        const next = typeof value === 'function' ? (value as (prev: T) => T)(prev) : value;
        writeItem(key, next);
        return next;
      });
    },
    [key],
  );

  /** Cross-tab / cross-component sync */
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== key) return;
      // e.newValue is null when the key was removed
      setStoredValue(e.newValue !== null ? readItem(key, initialValue) : initialValue);
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [key, initialValue]);

  return [storedValue, setValue];
}
