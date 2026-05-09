import type { Competition } from '@/domain/types';

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
    name: 'Olympic Games',
    season: 'Paris 2024',
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
  if (/Bronze Medal Match$/i.test(longDescription) || /Gold Medal Match$/i.test(longDescription)) {
    return longDescription;
  }
  if (/Group [A-Z]$/i.test(longDescription)) {
    return `${longDescription} — Match ${matchNumberInPhase}`;
  }
  if (/Quarter-final$/i.test(longDescription) || /Semi-final$/i.test(longDescription)) {
    return `${longDescription} ${matchNumberInPhase}`;
  }
  // Fallback — return as-is rather than throw; never observed in 58 Paris 2024 matches
  // but defensive against API additions.
  return longDescription;
}
