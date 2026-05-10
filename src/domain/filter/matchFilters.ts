import { Tournament, type Phase } from '@/domain/types';
import type { MatchSummary } from '@/domain/matchSummary';

/** Filter mode for tournament — `'all'` means no filter applied. */
export const ALL_TOURNAMENTS = 'all';
export type TournamentFilter = typeof ALL_TOURNAMENTS | Tournament;

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
  tournament: ALL_TOURNAMENTS,
  phases: undefined,
  dateFrom: undefined,
  dateTo: undefined,
  search: '',
};

/** AND-combined filter — pure, same input → same output. */
export function filterMatches(
  matches: readonly MatchSummary[],
  criteria: FilterCriteria,
): MatchSummary[] {
  const search = criteria.search.trim().toLowerCase();

  return matches.filter((m) => {
    if (criteria.tournament !== ALL_TOURNAMENTS && m.tournament !== criteria.tournament)
      return false;

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
    c.tournament === ALL_TOURNAMENTS &&
    !c.phases &&
    !c.dateFrom &&
    !c.dateTo &&
    c.search.trim() === ''
  );
}

/** Type guard: is the value a non-`'all'` tournament filter? */
export function isTournament(value: TournamentFilter): value is Tournament {
  return value === Tournament.MEN || value === Tournament.WOMEN;
}
