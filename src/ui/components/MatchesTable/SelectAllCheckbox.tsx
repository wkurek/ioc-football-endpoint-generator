import { useEffect, useMemo, useRef } from 'react';

interface SelectAllCheckboxProps {
  /** Codes of currently rendered (filtered) rows. */
  visibleCodes: readonly string[];
  selected: ReadonlySet<string>;
  onSelectMany: (codes: readonly string[]) => void;
  onDeselectMany: (codes: readonly string[]) => void;
  ariaLabel: string;
}

/**
 * Tri-state header checkbox. Reflects whether *visible* rows are
 * none / some / all selected, and toggles the visible set on change.
 * Hidden (filter-excluded) selections are unaffected.
 */
export function SelectAllCheckbox({
  visibleCodes,
  selected,
  onSelectMany,
  onDeselectMany,
  ariaLabel,
}: SelectAllCheckboxProps) {
  const ref = useRef<HTMLInputElement>(null);

  const visibleSelectedCount = useMemo(
    () => visibleCodes.reduce((n, c) => n + (selected.has(c) ? 1 : 0), 0),
    [visibleCodes, selected],
  );
  const allSelected = visibleCodes.length > 0 && visibleSelectedCount === visibleCodes.length;
  const isIndeterminate = visibleSelectedCount > 0 && !allSelected;

  // `indeterminate` is a DOM property only — not a React/HTML attribute.
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = isIndeterminate;
  }, [isIndeterminate]);

  const handleChange = () => {
    if (allSelected) onDeselectMany(visibleCodes);
    else onSelectMany(visibleCodes);
  };

  return (
    <input
      ref={ref}
      type="checkbox"
      checked={allSelected}
      onChange={handleChange}
      onClick={(e) => e.stopPropagation()}
      disabled={visibleCodes.length === 0}
      aria-label={ariaLabel}
      aria-checked={isIndeterminate ? 'mixed' : allSelected}
      className="h-4 w-4 cursor-pointer rounded border-slate-300 text-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-600 dark:bg-slate-800"
    />
  );
}
