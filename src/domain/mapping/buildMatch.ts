import type { Match } from '@/domain/types';
import type { ResByRscH2H, SchSchedule } from '@/data/api/schemas';
import { buildCompetition } from './competition';
import { buildVenue } from './venue';
import { buildScore } from './score';
import { mapStatus } from './status';
import { buildLineups } from './lineups';
import { buildScorers } from './scorers';
import { buildTeams } from './teams';
import { parseUnitNum } from './round';
import { MatchSchema } from '@/domain/matchSchema';

interface BuildMatchInput {
  /** The single match's SCH entry (kickoff, venue, eventUnit, unitNum, etc.). */
  sch: SchSchedule;
  /** The match's RES entry (score, lineups, playByPlay). */
  res: ResByRscH2H;
}

/**
 * Compose a full Match record from SCH + RES, per CONVENTIONS.md §2
 * (SCH wins for pre-match fields; RES used only for post-match).
 *
 * Throws on any required field missing — defensive (CONVENTIONS.md §7).
 *
 * In dev mode (`import.meta.env.DEV`), validates the result against
 * `MatchSchema` to catch shape drift early — no cost in production.
 */
export function buildMatch({ sch, res }: BuildMatchInput): Match {
  const out: Match = {
    competition: buildCompetition(sch.eventUnit.longDescription, parseUnitNum(sch)),
    venue: buildVenue({
      venueDescription: sch.venue?.description,
      locationLongDescription: sch.location?.longDescription,
    }),
    kickoff: sch.startDate,
    status: mapStatus(sch.status.code),
    teams: buildTeams(res.results.items),
    score: buildScore(res.results.periods),
    scorers: buildScorers(res),
    lineups: buildLineups(res.results.items),
  };
  if (import.meta.env.DEV) MatchSchema.parse(out);
  return out;
}
