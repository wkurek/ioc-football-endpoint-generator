import { splitKickoff } from './formatKickoff';

interface KickoffCellProps {
  iso: string;
}

export function KickoffCell({ iso }: KickoffCellProps) {
  const { date, time } = splitKickoff(iso);
  return (
    <span className="whitespace-nowrap tabular-nums">
      {date}
      <span className="ml-2 text-slate-500 dark:text-slate-400">{time}</span>
    </span>
  );
}
