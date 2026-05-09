import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import {
  EMPTY_FILTER,
  isEmptyFilter,
  type FilterCriteria,
} from '@/domain/filter/matchFilters';
import type { Phase } from '@/domain/matchSummary';
import { TournamentToggle } from './TournamentToggle';
import { PhaseFilter } from './PhaseFilter';
import { DateRangeFilter } from './DateRangeFilter';
import { TeamSearch } from './TeamSearch';

interface FiltersToolbarProps {
  criteria: FilterCriteria;
  onChange: (next: FilterCriteria) => void;
  /** Outer date bounds — first / last match date from API. */
  dateMin?: string;
  dateMax?: string;
  /** Days from API that contain at least one match (rest days disabled in picker). */
  matchDays?: readonly string[];
}

export function FiltersToolbar({
  criteria,
  onChange,
  dateMin,
  dateMax,
  matchDays,
}: FiltersToolbarProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-wrap items-end gap-3 rounded-md border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900/40">
      <TournamentToggle
        value={criteria.tournament}
        onChange={(tournament) => onChange({ ...criteria, tournament })}
      />
      <PhaseFilter
        value={criteria.phases}
        onChange={(phases: ReadonlySet<Phase> | undefined) => onChange({ ...criteria, phases })}
      />
      <DateRangeFilter
        from={criteria.dateFrom}
        to={criteria.dateTo}
        onChange={(dateFrom, dateTo) => onChange({ ...criteria, dateFrom, dateTo })}
        min={dateMin}
        max={dateMax}
        {...(matchDays ? { matchDays } : {})}
      />
      <TeamSearch
        value={criteria.search}
        onChange={(search) => onChange({ ...criteria, search })}
      />

      {!isEmptyFilter(criteria) && (
        <button
          type="button"
          onClick={() => onChange(EMPTY_FILTER)}
          className="flex items-center gap-1 self-end rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
        >
          <X className="h-3 w-3" aria-hidden="true" />
          {t('actions.clearFilters')}
        </button>
      )}
    </div>
  );
}
