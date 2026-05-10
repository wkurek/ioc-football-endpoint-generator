import type { Competition } from '@/domain/types';

/** Constants — same for every match in the dataset. Not derivable from the API. */
export const COMPETITION_NAME = 'Olympic Games';
export const COMPETITION_SEASON = 'Paris 2024';

const ROUND_BRONZE_RE = /Bronze Medal Match$/i;
const ROUND_GOLD_RE = /Gold Medal Match$/i;
const ROUND_GROUP_RE = /Group [A-Z]$/i;
const ROUND_QF_RE = /Quarter-final$/i;
const ROUND_SF_RE = /Semi-final$/i;

export function buildCompetition(
  eventUnitLongDescription: string,
  matchNumberInPhase: number,
): Competition {
  return {
    name: COMPETITION_NAME,
    season: COMPETITION_SEASON,
    round: buildRound(eventUnitLongDescription, matchNumberInPhase),
  };
}

/**
 * Group → "{long} — Match N"; QF/SF → "{long} N"; medal matches → no suffix.
 * Unknown phase descriptions pass through as-is — defensive against API
 * additions; not observed in 58 Paris 2024 matches.
 */
export function buildRound(longDescription: string, matchNumberInPhase: number): string {
  if (ROUND_BRONZE_RE.test(longDescription) || ROUND_GOLD_RE.test(longDescription)) {
    return longDescription;
  }
  if (ROUND_GROUP_RE.test(longDescription)) {
    return `${longDescription} — Match ${matchNumberInPhase}`;
  }
  if (ROUND_QF_RE.test(longDescription) || ROUND_SF_RE.test(longDescription)) {
    return `${longDescription} ${matchNumberInPhase}`;
  }
  return longDescription;
}
