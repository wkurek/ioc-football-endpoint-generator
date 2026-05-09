import * as ToggleGroup from '@radix-ui/react-toggle-group';
import { useTranslation } from 'react-i18next';
import type { TournamentFilter } from '@/domain/filter/matchFilters';

interface TournamentToggleProps {
  value: TournamentFilter;
  onChange: (value: TournamentFilter) => void;
}

export function TournamentToggle({ value, onChange }: TournamentToggleProps) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
        {t('filters.tournament.label')}
      </label>
      <ToggleGroup.Root
        type="single"
        value={value}
        onValueChange={(v) => v && onChange(v as TournamentFilter)}
        aria-label={t('filters.tournament.label')}
        className="inline-flex rounded-md border border-slate-200 bg-white p-0.5 dark:border-slate-700 dark:bg-slate-900"
      >
        <ToggleGroup.Item
          value="all"
          className="rounded-sm px-3 py-1 text-sm text-slate-600 hover:text-slate-900 data-[state=on]:bg-slate-100 data-[state=on]:font-medium data-[state=on]:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 dark:data-[state=on]:bg-slate-700 dark:data-[state=on]:text-slate-100"
        >
          {t('filters.tournament.all')}
        </ToggleGroup.Item>
        <ToggleGroup.Item
          value="men"
          className="rounded-sm px-3 py-1 text-sm text-slate-600 hover:text-slate-900 data-[state=on]:bg-slate-100 data-[state=on]:font-medium data-[state=on]:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 dark:data-[state=on]:bg-slate-700 dark:data-[state=on]:text-slate-100"
        >
          {t('filters.tournament.men')}
        </ToggleGroup.Item>
        <ToggleGroup.Item
          value="women"
          className="rounded-sm px-3 py-1 text-sm text-slate-600 hover:text-slate-900 data-[state=on]:bg-slate-100 data-[state=on]:font-medium data-[state=on]:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 dark:data-[state=on]:bg-slate-700 dark:data-[state=on]:text-slate-100"
        >
          {t('filters.tournament.women')}
        </ToggleGroup.Item>
      </ToggleGroup.Root>
    </div>
  );
}
