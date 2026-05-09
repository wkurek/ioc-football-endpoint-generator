import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import * as Popover from '@radix-ui/react-popover';
import { DayPicker, type DateRange } from 'react-day-picker';
// rdp stylesheet imported globally in src/main.tsx (cascade order matters).
import { parseYmd, formatYmd } from './ymdDate';
import { DateRangeTrigger } from './DateRangeTrigger';

interface DateRangeFilterProps {
  /** YYYY-MM-DD inclusive lower bound, or undefined for none. */
  from: string | undefined;
  /** YYYY-MM-DD inclusive upper bound, or undefined for none. */
  to: string | undefined;
  /**
   * Single atomic update. Both endpoints must be set in one call to avoid the
   * stale-closure bug where two separate setters overwrite each other in the
   * same render cycle.
   */
  onChange: (from: string | undefined, to: string | undefined) => void;
  /** Outermost selectable date (tournament start, from API). */
  min?: string;
  /** Outermost selectable date (tournament end, from API). */
  max?: string;
  /**
   * Days that have at least one match (from API). When provided, days OUTSIDE
   * this set inside the [min, max] window are visually disabled in the picker
   * — Paris 2024 had non-consecutive match days (rest days like 2024-07-26,
   * 29, 08-01, 04, 07).
   */
  matchDays?: readonly string[];
}

export function DateRangeFilter({
  from,
  to,
  onChange,
  min,
  max,
  matchDays,
}: DateRangeFilterProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  const fromDate = parseYmd(from);
  const toDate = parseYmd(to);
  const minDate = parseYmd(min);
  const maxDate = parseYmd(max);

  const matchDaySet = matchDays ? new Set(matchDays) : undefined;
  const isNonMatchDay = (date: Date) => {
    if (!matchDaySet) return false;
    const ymd = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    return !matchDaySet.has(ymd);
  };

  const range: DateRange | undefined = fromDate ? { from: fromDate, to: toDate } : undefined;

  const handleSelect = (next: DateRange | undefined) => {
    onChange(formatYmd(next?.from), formatYmd(next?.to));
  };

  const handleClear = () => {
    onChange(undefined, undefined);
  };

  const triggerLabel = formatTriggerLabel(from, to, t('filters.dateRange.allDates'));

  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
        {t('filters.dateRange.label')}
      </label>
      <Popover.Root open={open} onOpenChange={setOpen}>
        <Popover.Trigger asChild>
          <DateRangeTrigger
            label={triggerLabel}
            hasValue={!!from || !!to}
            onClear={handleClear}
            aria-label={t('filters.dateRange.label')}
          />
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Content
            align="start"
            sideOffset={6}
            className="z-50 rounded-md border border-slate-200 bg-white p-2 shadow-lg dark:border-slate-700 dark:bg-slate-900"
          >
            <DayPicker
              mode="range"
              selected={range}
              onSelect={handleSelect}
              {...(minDate ? { defaultMonth: minDate } : {})}
              disabled={[
                ...(minDate ? [{ before: minDate }] : []),
                ...(maxDate ? [{ after: maxDate }] : []),
                ...(matchDaySet ? [isNonMatchDay] : []),
              ]}
              numberOfMonths={1}
              showOutsideDays
            />
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
    </div>
  );
}

function formatTriggerLabel(
  from: string | undefined,
  to: string | undefined,
  emptyLabel: string,
): string {
  if (!from && !to) return emptyLabel;
  if (from && to) return from === to ? from : `${from} – ${to}`;
  // Mid-selection: show whichever endpoint is set, no placeholder.
  return (from ?? to)!;
}
