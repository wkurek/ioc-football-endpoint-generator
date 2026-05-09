import { useTranslation } from 'react-i18next';
import * as ToggleGroup from '@radix-ui/react-toggle-group';
import type { Phase } from '@/domain/matchSummary';

interface PhaseFilterProps {
  /** undefined = all phases included */
  value: ReadonlySet<Phase> | undefined;
  onChange: (next: ReadonlySet<Phase> | undefined) => void;
}

const PHASES: Phase[] = ['group', 'qf', 'sf', 'bronze', 'gold'];

const LABEL_KEYS: Record<Phase, string> = {
  group: 'Group',
  qf: 'QF',
  sf: 'SF',
  bronze: 'Bronze',
  gold: 'Final',
};

export function PhaseFilter({ value, onChange }: PhaseFilterProps) {
  const { t } = useTranslation();
  // Treat undefined as "all" — convert to a Set for the ToggleGroup, then back.
  const valueArray = value ? [...value] : PHASES;

  const handleChange = (next: string[]) => {
    if (next.length === PHASES.length) {
      onChange(undefined); // all selected = "no filter"
    } else if (next.length === 0) {
      onChange(new Set());
    } else {
      onChange(new Set(next as Phase[]));
    }
  };

  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
        {t('filters.round.label')}
      </label>
      <ToggleGroup.Root
        type="multiple"
        value={valueArray}
        onValueChange={handleChange}
        aria-label={t('filters.round.label')}
        className="inline-flex flex-wrap gap-1 rounded-md border border-slate-200 bg-white p-0.5 dark:border-slate-700 dark:bg-slate-900"
      >
        {PHASES.map((p) => (
          <ToggleGroup.Item
            key={p}
            value={p}
            className="rounded-sm px-2.5 py-1 text-xs text-slate-600 hover:text-slate-900 data-[state=on]:bg-slate-100 data-[state=on]:font-medium data-[state=on]:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 dark:data-[state=on]:bg-slate-700 dark:data-[state=on]:text-slate-100"
          >
            {LABEL_KEYS[p]}
          </ToggleGroup.Item>
        ))}
      </ToggleGroup.Root>
    </div>
  );
}
