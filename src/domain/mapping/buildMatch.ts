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
 * Compose a full Match from SCH + RES. SCH wins for pre-match fields,
 * RES is used only for post-match. Any missing required field throws so
 * the failure surfaces as a per-match error in the UI rather than silently
 * leaking through.
 *
 * In dev (`import.meta.env.DEV`), the result is also validated against
 * `MatchSchema` to catch shape drift early. No cost in production.
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
