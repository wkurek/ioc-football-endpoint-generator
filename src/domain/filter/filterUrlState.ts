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
 *   - `r`     — phases: comma-separated subset of "group,qf,sf,bronze,final"
 *               (omitted = all phases included; empty string = none)
 *   - `from`  — date inclusive lower bound (YYYY-MM-DD, validated)
 *   - `to`    — date inclusive upper bound (YYYY-MM-DD, validated)
 *   - `q`     — team name search substring
 *
 * Defensive behavior on bad input:
 *   - Unknown tournament values fall back to "all".
 *   - Unknown phase tokens are silently dropped.
 *   - Malformed `from`/`to` (e.g. `-3-03`, `2024-13-40`, `2024-02-30`) → undefined.
 *
 * Round-trip: `paramsToCriteria(criteriaToParams(c)) ≡ c` for any valid criteria.
 */

const ALL_PHASES: readonly Phase[] = ['group', 'qf', 'sf', 'bronze', 'gold'];

/** Internal Phase → URL token. We surface `gold` as `final` to match the UI label. */
const PHASE_TO_URL: Record<Phase, string> = {
  group: 'group',
  qf: 'qf',
  sf: 'sf',
  bronze: 'bronze',
  gold: 'final',
};

/** URL token → internal Phase. Reverse of PHASE_TO_URL. */
const URL_TO_PHASE: Record<string, Phase> = Object.fromEntries(
  ALL_PHASES.map((p) => [PHASE_TO_URL[p], p]),
);

const YMD_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

export function criteriaToParams(c: FilterCriteria): URLSearchParams {
  const p = new URLSearchParams();
  if (c.tournament !== 'all') p.set('t', c.tournament);
  if (c.phases !== undefined) {
    p.set(
      'r',
      [...c.phases]
        .map((phase) => PHASE_TO_URL[phase])
        .sort()
        .join(','),
    );
  }
  if (c.dateFrom && isValidYmd(c.dateFrom)) p.set('from', c.dateFrom);
  if (c.dateTo && isValidYmd(c.dateTo)) p.set('to', c.dateTo);
  const search = c.search.trim();
  if (search) p.set('q', search);
  return p;
}

export function paramsToCriteria(params: URLSearchParams): FilterCriteria {
  const t = params.get('t');
  const tournament: TournamentFilter = t === 'men' || t === 'women' ? t : 'all';

  const r = params.get('r');
  let phases: ReadonlySet<Phase> | undefined;
  if (r !== null) {
    const list = r
      .split(',')
      .map((s) => s.trim())
      .map((token) => URL_TO_PHASE[token])
      .filter((phase): phase is Phase => phase !== undefined);
    phases = new Set(list);
  }

  const fromRaw = params.get('from');
  const toRaw = params.get('to');
  const from = fromRaw && isValidYmd(fromRaw) ? fromRaw : undefined;
  const to = toRaw && isValidYmd(toRaw) ? toRaw : undefined;
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

/**
 * Strict YYYY-MM-DD validation: regex shape + actual calendar validity
 * (rejects 2024-13-01, 2024-02-30, garbage like `-3-03`, etc.).
 */
export function isValidYmd(value: string): boolean {
  const m = YMD_RE.exec(value);
  if (!m) return false;
  const year = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);
  if (year < 1 || month < 1 || month > 12 || day < 1 || day > 31) return false;
  // Round-trip via Date to catch impossible dates like 2024-02-30.
  const d = new Date(year, month - 1, day);
  return d.getFullYear() === year && d.getMonth() === month - 1 && d.getDate() === day;
}
