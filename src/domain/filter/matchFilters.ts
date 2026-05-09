import type { MatchSummary, Phase, Tournament } from '@/domain/matchSummary';

export type TournamentFilter = 'all' | Tournament;

export interface FilterCriteria {
  /** "all" | "men" | "women" — single-select toggle. */
  tournament: TournamentFilter;
  /** Phases to include. Empty set = no phases match (= no rows). undefined = all included. */
  phases: ReadonlySet<Phase> | undefined;
  /** Inclusive start date (YYYY-MM-DD). Undefined = no lower bound. */
  dateFrom: string | undefined;
  /** Inclusive end date (YYYY-MM-DD). Undefined = no upper bound. */
  dateTo: string | undefined;
  /** Case-insensitive substring search on home or away team name. Empty string = no filter. */
  search: string;
}

export const EMPTY_FILTER: FilterCriteria = {
  tournament: 'all',
  phases: undefined,
  dateFrom: undefined,
  dateTo: undefined,
  search: '',
};

/**
 * Apply all filters (AND-combined) to the matches list.
 * Pure function — same input always produces same output (CONVENTIONS.md acceptance).
 */
export function filterMatches(
  matches: readonly MatchSummary[],
  criteria: FilterCriteria,
): MatchSummary[] {
  const search = criteria.search.trim().toLowerCase();

  return matches.filter((m) => {
    if (criteria.tournament !== 'all' && m.tournament !== criteria.tournament) return false;

    if (criteria.phases && !criteria.phases.has(m.phase)) return false;

    if (criteria.dateFrom && m.date < criteria.dateFrom) return false;
    if (criteria.dateTo && m.date > criteria.dateTo) return false;

    if (search) {
      const home = m.homeTeam.toLowerCase();
      const away = m.awayTeam.toLowerCase();
      if (!home.includes(search) && !away.includes(search)) return false;
    }

    return true;
  });
}

/** Returns true if no filter is active (all matches pass through). */
export function isEmptyFilter(c: FilterCriteria): boolean {
  return (
    c.tournament === 'all' &&
    !c.phases &&
    !c.dateFrom &&
    !c.dateTo &&
    c.search.trim() === ''
  );
}
