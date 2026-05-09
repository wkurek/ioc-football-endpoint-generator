import type { Match } from '@/domain/types';
import { splitKickoff } from '@/ui/components/MatchesTable/formatKickoff';

interface MatchHeaderProps {
  match: Match;
}

export function MatchHeader({ match }: MatchHeaderProps) {
  const { date, time } = splitKickoff(match.kickoff);
  return (
    <header className="space-y-1">
      <h1 className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-2xl font-semibold tracking-tight">
        <span>{match.teams.home}</span>
        <span className="rounded bg-slate-100 px-3 py-0.5 text-xl tabular-nums dark:bg-slate-800">
          {match.score.home} – {match.score.away}
        </span>
        <span>{match.teams.away}</span>
      </h1>
      <p className="text-sm text-slate-500 dark:text-slate-400">
        {match.competition.round} · <span className="tabular-nums">{date} {time}</span> ·{' '}
        {match.venue.name}
        {match.venue.city ? ` · ${match.venue.city}` : ''} ·{' '}
        <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs dark:bg-slate-800">
          {match.status}
        </span>
      </p>
    </header>
  );
}
