import type { MatchSummary } from '@/domain/matchSummary';

/**
 * Default deterministic order for the matches list and bulk export
 * (CONVENTIONS.md §9): `(kickoff ASC, eventUnit.code ASC)`.
 *
 * Compares kickoff by parsed timestamp, not by string — so a hypothetical
 * mixed-offset corpus (e.g. one match in `+02:00`, another in `+01:00`)
 * sorts by actual time-of-event. Today every Paris 2024 kickoff is `+02:00`,
 * but lex compare would silently break the moment that changed.
 *
 * Tie-breaker on code is critical for parallel kickoffs — group stage Olympic
 * matches frequently kick off simultaneously across venues.
 */
export function compareMatchSummary(a: MatchSummary, b: MatchSummary): number {
  const dt = Date.parse(a.kickoff) - Date.parse(b.kickoff);
  if (dt !== 0) return dt;
  return a.eventUnitCode < b.eventUnitCode ? -1 : 1;
}

/**
 * Returns a new array with matches sorted in default order.
 * Doesn't mutate the input.
 */
export function sortMatchSummaries(matches: readonly MatchSummary[]): MatchSummary[] {
  return [...matches].sort(compareMatchSummary);
}
