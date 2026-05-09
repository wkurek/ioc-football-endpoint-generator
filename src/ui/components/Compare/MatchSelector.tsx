import { useTranslation } from 'react-i18next';
import type { MatchEntry } from '@/ui/hooks/usePipeline';

interface MatchSelectorProps {
  entries: MatchEntry[];
  value: string | undefined;
  onChange: (code: string) => void;
}

export function MatchSelector({ entries, value, onChange }: MatchSelectorProps) {
  const { t } = useTranslation();
  const ready = entries.filter((e) => !!e.match);

  return (
    <div className="flex flex-col gap-1">
      <label
        htmlFor="compare-match-select"
        className="text-xs font-medium text-slate-600 dark:text-slate-400"
      >
        {t('compare.selectMatch')}
      </label>
      <select
        id="compare-match-select"
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        className="w-full max-w-md rounded-md border border-slate-200 bg-white px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-900"
      >
        <option value="" disabled>
          —
        </option>
        {ready.map((e) => (
          <option key={e.code} value={e.code}>
            {e.summary.date} {e.summary.homeTeam} {e.summary.scoreText ?? '—'}{' '}
            {e.summary.awayTeam} ({e.summary.round})
          </option>
        ))}
      </select>
    </div>
  );
}
