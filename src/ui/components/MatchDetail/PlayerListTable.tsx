import type { Player } from '@/domain/types';

interface PlayerListTableProps {
  players: readonly Player[];
}

export function PlayerListTable({ players }: PlayerListTableProps) {
  if (players.length === 0) {
    return (
      <p className="px-2 py-1 text-xs italic text-slate-500 dark:text-slate-400">—</p>
    );
  }
  return (
    <table className="w-full text-sm">
      <tbody>
        {players.map((p) => (
          <tr
            key={p.number}
            className="border-t border-slate-100 first:border-t-0 dark:border-slate-800"
          >
            <td className="w-10 px-2 py-1 text-right text-slate-500 tabular-nums dark:text-slate-400">
              {p.number}
            </td>
            <td className="w-12 px-2 py-1">
              <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] uppercase text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                {p.position}
              </span>
            </td>
            <td className="px-2 py-1">{p.name}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
