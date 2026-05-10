import { useCallback, useMemo, useState } from 'react';

/**
 * Selection state for table rows / cards. Identifies entries by their
 * `eventUnit.code`.
 */
export function useSelection() {
  const [selected, setSelected] = useState<ReadonlySet<string>>(() => new Set());

  const toggle = useCallback((code: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  }, []);

  const addMany = useCallback((codes: readonly string[]) => {
    setSelected((prev) => {
      const next = new Set(prev);
      for (const code of codes) next.add(code);
      return next;
    });
  }, []);

  const removeMany = useCallback((codes: readonly string[]) => {
    setSelected((prev) => {
      const next = new Set(prev);
      for (const code of codes) next.delete(code);
      return next;
    });
  }, []);

  const has = useCallback((code: string) => selected.has(code), [selected]);

  return useMemo(
    () => ({ selected, toggle, addMany, removeMany, has }),
    [selected, toggle, addMany, removeMany, has],
  );
}
