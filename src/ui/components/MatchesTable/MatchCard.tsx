import { ChevronRight, Download, GitCompare } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { MatchEntry } from '@/ui/hooks/usePipeline';
import { routes } from '@/ui/routes';
import { splitKickoff } from './formatKickoff';

interface MatchCardProps {
  entry: MatchEntry;
  selected: boolean;
  onToggle: (code: string) => void;
  onDownload: (entry: MatchEntry) => void;
}

export function MatchCard({ entry, selected, onToggle, onDownload }: MatchCardProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const s = entry.summary;
  const { date, time } = splitKickoff(s.kickoff);

  return (
    <div
      onClick={() => navigate(routes.matchDetail(entry.code))}
      className="cursor-pointer rounded-md border border-slate-200 bg-white p-3 shadow-sm hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-900/60"
    >
      <div className="flex items-start gap-2">
        <input
          type="checkbox"
          checked={selected}
          onChange={() => onToggle(entry.code)}
          onClick={(e) => e.stopPropagation()}
          aria-label={`${t('actions.addToSelection')} (${s.homeTeam} vs ${s.awayTeam})`}
          className="mt-1 h-4 w-4 cursor-pointer rounded border-slate-300 text-blue-600 dark:border-slate-600 dark:bg-slate-800"
        />

        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <div className="truncate font-semibold">
              {s.homeTeam}
              <span className="mx-2 text-slate-400">vs</span>
              {s.awayTeam}
            </div>
            <div className="shrink-0 tabular-nums text-slate-700 dark:text-slate-300">
              {s.scoreText ?? '—'}
            </div>
          </div>
          <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">{s.round}</div>
          <div className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            {date} · {time} ·{' '}
            <span className="inline-flex items-center rounded bg-slate-100 px-1.5 text-[10px] dark:bg-slate-800">
              {s.status}
            </span>
          </div>
          <div className="truncate text-xs text-slate-500 dark:text-slate-400">{s.venue}</div>

          <div className="mt-2 flex items-center justify-end gap-1">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDownload(entry);
              }}
              disabled={!entry.match}
              aria-label={t('actions.downloadSingle')}
              title={t('actions.downloadSingle')}
              className="rounded p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-40 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
            >
              <Download className="h-4 w-4" aria-hidden="true" />
            </button>
            <Link
              to={routes.compareWithMatch(entry.code)}
              onClick={(e) => e.stopPropagation()}
              aria-label={t('actions.compareThisMatch')}
              title={t('actions.compareThisMatch')}
              aria-disabled={!entry.match}
              className="rounded p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 aria-disabled:pointer-events-none aria-disabled:opacity-40 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
            >
              <GitCompare className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Link
              to={routes.matchDetail(entry.code)}
              onClick={(e) => e.stopPropagation()}
              aria-label={t('actions.viewDetails')}
              title={t('actions.viewDetails')}
              className="rounded p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
            >
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
