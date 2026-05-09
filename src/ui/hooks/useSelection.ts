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

  const replace = useCallback((codes: readonly string[]) => {
    setSelected(new Set(codes));
  }, []);

  const clear = useCallback(() => setSelected(new Set()), []);

  const has = useCallback((code: string) => selected.has(code), [selected]);

  return useMemo(
    () => ({ selected, toggle, replace, clear, has, count: selected.size }),
    [selected, toggle, replace, clear, has],
  );
}
