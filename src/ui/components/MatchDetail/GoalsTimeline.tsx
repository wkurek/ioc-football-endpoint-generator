import { useTranslation } from 'react-i18next';
import type { Match } from '@/domain/types';

interface GoalsTimelineProps {
  match: Match;
}

const TYPE_LABEL: Record<string, string> = {
  open_play: 'Open play',
  penalty: 'Penalty',
  header: 'Header',
};

export function GoalsTimeline({ match }: GoalsTimelineProps) {
  const { t } = useTranslation();
  if (match.scorers.length === 0) return null;

  return (
    <section className="rounded-md border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/40">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {t('match.sections.goalsTimeline')}
      </h2>
      <ol className="space-y-2 text-sm">
        {match.scorers.map((g, i) => (
          <li
            key={`${g.team}-${g.minute}-${g.player}-${i}`}
            className="flex items-baseline gap-3"
          >
            <span className="w-12 shrink-0 text-right font-mono tabular-nums text-slate-500 dark:text-slate-400">
              {g.minute}'
            </span>
            <span className="flex-1">
              <span className="font-medium">{g.player}</span>
              <span className="ml-2 text-slate-500 dark:text-slate-400">({g.team})</span>
              {g.assist && (
                <span className="ml-2 text-xs text-slate-500 dark:text-slate-400">
                  · assist: {g.assist}
                </span>
              )}
            </span>
            <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-700 dark:bg-slate-800 dark:text-slate-300">
              {TYPE_LABEL[g.type] ?? g.type}
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}
