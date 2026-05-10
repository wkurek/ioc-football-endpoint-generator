import { flexRender, type Row } from '@tanstack/react-table';
import { useTranslation } from 'react-i18next';
import { useRowNavigation } from '@/ui/hooks/useRowNavigation';
import type { MatchEntry } from '@/ui/hooks/usePipeline';

interface TableRowProps {
  row: Row<MatchEntry>;
}

/**
 * Match-list row rendered as a focusable pseudo-button. Click, Enter, and
 * Space all navigate to `/match/:eventUnitCode`. Child controls (checkbox,
 * action buttons, links) must `stopPropagation` to avoid double-handling.
 */
export function TableRow({ row }: TableRowProps) {
  const { t } = useTranslation();
  const nav = useRowNavigation(row.original.code);
  const s = row.original.summary;
  const ariaLabel = t('table.row.openMatch', {
    home: s.homeTeam,
    away: s.awayTeam,
    round: s.round,
  });

  return (
    <tr
      {...nav}
      aria-label={ariaLabel}
      className="cursor-pointer border-t border-slate-100 hover:bg-slate-50 focus-visible:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-900/60 dark:focus-visible:bg-slate-900/60"
    >
      {row.getVisibleCells().map((cell) => (
        <td key={cell.id} className="px-3 py-2 align-middle">
          {flexRender(cell.column.columnDef.cell, cell.getContext())}
        </td>
      ))}
    </tr>
  );
}
