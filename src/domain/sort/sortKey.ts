import type { MatchSummary } from '@/domain/matchSummary';

/**
 * Default deterministic order: `(kickoff ASC, eventUnit.code ASC)`.
 *
 * Compares kickoff by parsed timestamp, not by string — lex compare would
 * silently break for mixed-offset kickoffs. Tie-break on code is required
 * because Olympic group-stage matches run in parallel across venues.
 */
export function compareMatchSummary(a: MatchSummary, b: MatchSummary): number {
  const dt = Date.parse(a.kickoff) - Date.parse(b.kickoff);
  if (dt !== 0) return dt;
  return a.eventUnitCode < b.eventUnitCode ? -1 : 1;
}

/** Returns a new array — does not mutate the input. */
export function sortMatchSummaries(matches: readonly MatchSummary[]): MatchSummary[] {
  return [...matches].sort(compareMatchSummary);
}
