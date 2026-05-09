import type { ColumnDef } from '@tanstack/react-table';
import { ChevronRight, Download } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { TFunction } from 'i18next';
import type { MatchEntry } from '@/ui/hooks/usePipeline';
import { KickoffCell } from './KickoffCell';

export interface ColumnFactoryArgs {
  t: TFunction;
  selected: ReadonlySet<string>;
  onToggle: (code: string) => void;
  onDownloadSingle: (entry: MatchEntry) => void;
}

export function buildColumns({
  t,
  selected,
  onToggle,
  onDownloadSingle,
}: ColumnFactoryArgs): ColumnDef<MatchEntry>[] {
  return [
    {
      id: 'select',
      header: () => <span className="sr-only">{t('table.columns.select')}</span>,
      cell: ({ row }) => {
        const code = row.original.code;
        const isSelected = selected.has(code);
        return (
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onToggle(code)}
            onClick={(e) => e.stopPropagation()}
            aria-label={`${t('actions.addToSelection')} (${row.original.summary.homeTeam} vs ${row.original.summary.awayTeam})`}
            className="h-4 w-4 cursor-pointer rounded border-slate-300 text-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-slate-600 dark:bg-slate-800"
          />
        );
      },
      enableSorting: false,
      size: 40,
    },
    {
      id: 'kickoff',
      accessorFn: (row) => row.summary.kickoff,
      header: t('table.columns.kickoff'),
      cell: ({ row }) => <KickoffCell iso={row.original.summary.kickoff} />,
    },
    {
      id: 'round',
      accessorFn: (row) => row.summary.round,
      header: t('table.columns.round'),
      cell: ({ row }) => (
        <span className="whitespace-nowrap">{row.original.summary.round}</span>
      ),
    },
    {
      id: 'home',
      accessorFn: (row) => row.summary.homeTeam,
      header: t('table.columns.home'),
      cell: ({ row }) => (
        <span className="font-medium">{row.original.summary.homeTeam}</span>
      ),
    },
    {
      id: 'score',
      accessorFn: (row) => row.summary.scoreText ?? '',
      header: t('table.columns.score'),
      cell: ({ row }) => (
        <span className="tabular-nums text-slate-700 dark:text-slate-300">
          {row.original.summary.scoreText ?? '—'}
        </span>
      ),
      enableSorting: false,
    },
    {
      id: 'away',
      accessorFn: (row) => row.summary.awayTeam,
      header: t('table.columns.away'),
      cell: ({ row }) => (
        <span className="font-medium">{row.original.summary.awayTeam}</span>
      ),
    },
    {
      id: 'venue',
      accessorFn: (row) => row.summary.venue,
      header: t('table.columns.venue'),
      cell: ({ row }) => (
        <span className="truncate text-slate-600 dark:text-slate-400">
          {row.original.summary.venue}
        </span>
      ),
    },
    {
      id: 'status',
      accessorFn: (row) => row.summary.status,
      header: t('table.columns.status'),
      cell: ({ row }) => (
        <span className="inline-flex items-center rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-700 dark:bg-slate-800 dark:text-slate-300">
          {row.original.summary.status}
        </span>
      ),
    },
    {
      id: 'actions',
      header: () => <span className="sr-only">{t('table.columns.actions')}</span>,
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-1">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDownloadSingle(row.original);
            }}
            disabled={!row.original.match}
            aria-label={t('actions.downloadSingle')}
            title={t('actions.downloadSingle')}
            className="rounded p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-40 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
          >
            <Download className="h-4 w-4" aria-hidden="true" />
          </button>
          <Link
            to={`/match/${encodeURIComponent(row.original.code)}`}
            onClick={(e) => e.stopPropagation()}
            aria-label={t('actions.viewDetails')}
            title={t('actions.viewDetails')}
            className="rounded p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
          >
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      ),
      enableSorting: false,
      size: 80,
    },
  ];
}
