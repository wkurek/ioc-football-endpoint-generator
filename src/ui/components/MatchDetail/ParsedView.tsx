import type { Match } from '@/domain/types';
import { MatchInfoCard } from './MatchInfoCard';
import { ScoreCard } from './ScoreCard';
import { GoalsTimeline } from './GoalsTimeline';
import { LineupsSection } from './LineupsSection';

interface ParsedViewProps {
  match: Match;
}

export function ParsedView({ match }: ParsedViewProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <MatchInfoCard match={match} />
        <ScoreCard match={match} />
      </div>
      <GoalsTimeline match={match} />
      <LineupsSection match={match} />
    </div>
  );
}
