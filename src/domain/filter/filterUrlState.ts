import {
  EMPTY_FILTER,
  type FilterCriteria,
  type TournamentFilter,
} from './matchFilters';
import type { Phase } from '@/domain/matchSummary';

/**
 * Pure (de)serializers between FilterCriteria and URL search params.
 *
 * URL params used:
 *   - `t`     — tournament: "men" | "women" (omitted = all)
 *   - `r`     — phases: comma-separated subset of "group,qf,sf,bronze,gold"
 *               (omitted = all phases included)
 *   - `from`  — date inclusive lower bound (YYYY-MM-DD)
 *   - `to`    — date inclusive upper bound (YYYY-MM-DD)
 *   - `q`     — team name search substring
 *
 * Round-trip: `parseSearchParams(stringify(c)) ≡ c` for any valid criteria.
 */

const ALL_PHASES: readonly Phase[] = ['group', 'qf', 'sf', 'bronze', 'gold'];
const PHASE_SET = new Set<string>(ALL_PHASES);

export function criteriaToParams(c: FilterCriteria): URLSearchParams {
  const p = new URLSearchParams();
  if (c.tournament !== 'all') p.set('t', c.tournament);
  if (c.phases !== undefined) {
    p.set('r', [...c.phases].sort().join(','));
  }
  if (c.dateFrom) p.set('from', c.dateFrom);
  if (c.dateTo) p.set('to', c.dateTo);
  const search = c.search.trim();
  if (search) p.set('q', search);
  return p;
}

export function paramsToCriteria(params: URLSearchParams): FilterCriteria {
  const t = params.get('t');
  const tournament: TournamentFilter =
    t === 'men' || t === 'women' ? t : 'all';

  const r = params.get('r');
  let phases: ReadonlySet<Phase> | undefined;
  if (r !== null) {
    const list = r
      .split(',')
      .map((s) => s.trim())
      .filter((s): s is Phase => PHASE_SET.has(s));
    phases = new Set(list);
  }

  const from = params.get('from') ?? undefined;
  const to = params.get('to') ?? undefined;
  const search = params.get('q') ?? '';

  return {
    ...EMPTY_FILTER,
    tournament,
    ...(phases !== undefined ? { phases } : {}),
    ...(from ? { dateFrom: from } : {}),
    ...(to ? { dateTo: to } : {}),
    search,
  };
}
