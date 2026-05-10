import { useEffect, useState } from 'react';

/**
 * Returns a debounced copy of `value` that only updates after `delayMs` of
 * no further changes. Used by the Compare page to avoid re-running the
 * heavy diff computation on every keystroke when pasting/typing JSON.
 *
 * Pending updates are cancelled if `value` changes again before the timer
 * fires; cleanup is handled by the effect's cleanup function.
 */
export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(id);
  }, [value, delayMs]);
  return debounced;
}
