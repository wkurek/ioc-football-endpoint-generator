import type { SchSchedule } from '@/data/api/schemas';
import { TranslatableError } from '@/domain/errors';

/**
 * Computes the 1-based match number within a phase (CONVENTIONS.md #6).
 *
 *   - Group stage: 1-6 per group (e.g. "Men's Group A — Match 1")
 *   - Quarter-finals: 1-4 (per gender)
 *   - Semi-finals: 1-2 (per gender)
 *   - Bronze/Gold: not used (a single match per gender)
 *
 * Sorting key for determinism (CONVENTIONS.md #15): (startDate ASC, eventUnit.code ASC).
 *
 * @param allMatches — full list of HTEAM matches for the tournament.
 *                      Will be filtered to those sharing the same `eventUnit.longDescription`.
 * @param eventUnitCode — the match for which to compute the index.
 * @returns 1-based index, or 1 for medal matches (single-instance phases).
 */
export function computeMatchNumberInPhase(
  allMatches: readonly SchSchedule[],
  eventUnitCode: string,
): number {
  const target = allMatches.find((m) => m.eventUnit.code === eventUnitCode);
  if (!target) {
    throw new TranslatableError('errors.round.noMatchWithCode', { code: eventUnitCode });
  }
  const samePhase = allMatches
    .filter((m) => m.eventUnit.longDescription === target.eventUnit.longDescription)
    .sort(matchSortComparator);
  const idx = samePhase.findIndex((m) => m.eventUnit.code === eventUnitCode);
  return idx + 1; // 1-based
}

/**
 * Default deterministic sort: (startDate ASC, eventUnit.code ASC).
 * CONVENTIONS.md #15.
 */
export function matchSortComparator(a: SchSchedule, b: SchSchedule): number {
  if (a.startDate !== b.startDate) return a.startDate < b.startDate ? -1 : 1;
  return a.eventUnit.code < b.eventUnit.code ? -1 : 1;
}
