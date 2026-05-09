import { useTranslation } from 'react-i18next';
import type { TeamLineup } from '@/domain/types';
import { PlayerListTable } from './PlayerListTable';

interface TeamLineupCardProps {
  lineup: TeamLineup;
}

export function TeamLineupCard({ lineup }: TeamLineupCardProps) {
  const { t } = useTranslation();
  return (
    <div className="rounded-md border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/40">
      <header className="border-b border-slate-200 p-3 dark:border-slate-800">
        <h3 className="text-sm font-semibold">{lineup.team}</h3>
        <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-slate-500 dark:text-slate-400">
          <span>
            <span className="font-medium">Formation:</span>{' '}
            <span className="tabular-nums">{lineup.formation}</span>
          </span>
          <span>
            <span className="font-medium">Coach:</span> {lineup.coach}
          </span>
        </p>
      </header>
      <div className="p-2">
        <h4 className="px-2 pt-2 pb-1 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          {t('match.sections.starting')} ({lineup.startingXI.length})
        </h4>
        <PlayerListTable players={lineup.startingXI} />
        <h4 className="px-2 pt-3 pb-1 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          {t('match.sections.bench')} ({lineup.bench.length})
        </h4>
        <PlayerListTable players={lineup.bench} />
      </div>
    </div>
  );
}
