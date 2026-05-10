import type { Competition } from '@/domain/types';

/** Constant per CONVENTIONS.md sections 3 and 4 — same for every Match in this dataset. */
export const COMPETITION_NAME = 'Olympic Games';
export const COMPETITION_SEASON = 'Paris 2024';

/** Round-name patterns (compared against `eventUnit.longDescription`). */
const ROUND_BRONZE_RE = /Bronze Medal Match$/i;
const ROUND_GOLD_RE = /Gold Medal Match$/i;
const ROUND_GROUP_RE = /Group [A-Z]$/i;
const ROUND_QF_RE = /Quarter-final$/i;
const ROUND_SF_RE = /Semi-final$/i;

/**
 * Build the `competition` block (CONVENTIONS.md sections 3, 4, 5, 6).
 *
 * - `name`   = constant "Olympic Games"
 * - `season` = constant "Paris 2024"
 * - `round`  = `eventUnit.longDescription` + match-number suffix
 *              (Group A — Match N / Quarter-final N / Semi-final N / no suffix for medal matches).
 *
 * @param eventUnitLongDescription e.g. "Men's Group A", "Men's Quarter-final", "Women's Gold Medal Match"
 * @param matchNumberInPhase 1-based index within this phase for the same gender.
 *                           Used for Group/QF/SF rounds. Ignored for medal matches.
 */
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
 * Examples (CONVENTIONS.md #6):
 *   "Men's Group A", 1                 → "Men's Group A — Match 1"
 *   "Men's Group D", 6                 → "Men's Group D — Match 6"
 *   "Men's Quarter-final", 1           → "Men's Quarter-final 1"
 *   "Women's Quarter-final", 4         → "Women's Quarter-final 4"
 *   "Men's Semi-final", 2              → "Men's Semi-final 2"
 *   "Men's Bronze Medal Match", *      → "Men's Bronze Medal Match"
 *   "Women's Gold Medal Match", *      → "Women's Gold Medal Match"
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
  // Fallback — return as-is rather than throw; never observed in 58 Paris 2024 matches
  // but defensive against API additions.
  return longDescription;
}
