import type { MatchSummary } from '@/domain/matchSummary';

/**
 * Default deterministic order for the matches list and bulk export
 * (CONVENTIONS.md #15): `(kickoff ASC, eventUnit.code ASC)`.
 *
 * Tie-breaker on code is critical for parallel kickoffs — group stage Olympic
 * matches frequently kick off simultaneously across venues.
 */
export function compareMatchSummary(a: MatchSummary, b: MatchSummary): number {
  if (a.kickoff !== b.kickoff) return a.kickoff < b.kickoff ? -1 : 1;
  return a.eventUnitCode < b.eventUnitCode ? -1 : 1;
}

/**
 * Returns a new array with matches sorted in default order.
 * Doesn't mutate the input.
 */
export function sortMatchSummaries(matches: readonly MatchSummary[]): MatchSummary[] {
  return [...matches].sort(compareMatchSummary);
}
