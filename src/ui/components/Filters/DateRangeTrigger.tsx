import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { Calendar as CalendarIcon, X } from 'lucide-react';

interface DateRangeTriggerProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  hasValue: boolean;
  onClear?: () => void;
}

/**
 * Anchored to a Radix Popover.Trigger with `asChild`. Shows the active range
 * (or "All dates") and a small clear button when there's a selection.
 */
export const DateRangeTrigger = forwardRef<HTMLButtonElement, DateRangeTriggerProps>(
  function DateRangeTrigger({ label, hasValue, onClear, ...rest }, ref) {
    return (
      <button
        ref={ref}
        type="button"
        className="inline-flex w-full min-w-[16rem] items-center gap-2 rounded-md border border-slate-200 bg-white px-2 py-1 text-sm text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 sm:w-auto dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
        {...rest}
      >
        <CalendarIcon className="h-4 w-4 flex-shrink-0 text-slate-400" aria-hidden="true" />
        <span className="flex-1 whitespace-nowrap text-left tabular-nums">{label}</span>
        {hasValue && onClear && (
          <span
            role="button"
            tabIndex={0}
            aria-label="Clear date range"
            onClick={(e) => {
              e.stopPropagation();
              onClear();
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                e.stopPropagation();
                onClear();
              }
            }}
            className="ml-1 flex-shrink-0 rounded p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-700 dark:hover:text-slate-100"
          >
            <X className="h-3 w-3" aria-hidden="true" />
          </span>
        )}
      </button>
    );
  },
);
