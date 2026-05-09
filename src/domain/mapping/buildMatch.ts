import type { Match } from '@/domain/types';
import type { ResByRscH2H, SchSchedule } from '@/data/api/schemas';
import { buildCompetition } from './competition';
import { buildVenue } from './venue';
import { buildScore } from './score';
import { mapStatus } from './status';
import { buildLineups } from './lineups';
import { buildScorers } from './scorers';
import { buildTeams } from './teams';
import { computeMatchNumberInPhase } from './round';

interface BuildMatchInput {
  /** The single match's SCH entry (kickoff, venue, eventUnit, etc.). */
  sch: SchSchedule;
  /** The match's RES entry (score, lineups, playByPlay). */
  res: ResByRscH2H;
  /**
   * All HTEAM matches across the tournament (used to compute the local
   * `match-N-in-phase` index for `competition.round`).
   */
  allMatches: readonly SchSchedule[];
}

/**
 * Compose a full Match record from SCH + RES, per CONVENTIONS.md #31
 * (SCH wins for pre-match fields; RES used only for post-match).
 *
 * Throws on any required field missing — defensive (CONVENTIONS.md #27).
 */
export function buildMatch({ sch, res, allMatches }: BuildMatchInput): Match {
  const matchNumber = computeMatchNumberInPhase(allMatches, sch.eventUnit.code);

  return {
    competition: buildCompetition(sch.eventUnit.longDescription, matchNumber),
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
}
