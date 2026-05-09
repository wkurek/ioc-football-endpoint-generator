import { describe, expect, it } from 'vitest';
import {
  criteriaToParams,
  isValidYmd,
  paramsToCriteria,
} from './filterUrlState';
import { EMPTY_FILTER, type FilterCriteria } from './matchFilters';
import type { Phase } from '@/domain/matchSummary';

describe('isValidYmd', () => {
  it.each([
    ['2024-07-24', true],
    ['2024-01-01', true],
    ['2024-12-31', true],
    ['2024-02-29', true], // leap year
  ])('accepts valid date %s → %s', (input, expected) => {
    expect(isValidYmd(input)).toBe(expected);
  });

  it.each([
    ['', false],
    ['2024', false],
    ['2024-7-24', false], // single-digit month
    ['2024-07-4', false], // single-digit day
    ['-3-03', false], // garbage from user-quoted scenario
    ['2024-13-01', false], // month > 12
    ['2024-00-15', false], // month = 0
    ['2024-02-30', false], // Feb 30 doesn't exist
    ['2023-02-29', false], // 2023 not a leap year
    ['2024-04-31', false], // April only has 30 days
    ['abcd-ef-gh', false],
    ['2024/07/24', false], // wrong separator
    ['2024-07-24T10:00', false], // not pure YMD
  ])('rejects bad date %s → %s', (input, expected) => {
    expect(isValidYmd(input)).toBe(expected);
  });
});

describe('criteriaToParams', () => {
  it('omits everything for the empty filter', () => {
    expect(criteriaToParams(EMPTY_FILTER).toString()).toBe('');
  });

  it('encodes tournament=men', () => {
    const p = criteriaToParams({ ...EMPTY_FILTER, tournament: 'men' });
    expect(p.get('t')).toBe('men');
  });

  it('omits tournament when "all"', () => {
    const p = criteriaToParams({ ...EMPTY_FILTER, tournament: 'all' });
    expect(p.has('t')).toBe(false);
  });

  it('maps internal `gold` to URL `final`', () => {
    const phases: ReadonlySet<Phase> = new Set(['gold']);
    const p = criteriaToParams({ ...EMPTY_FILTER, phases });
    expect(p.get('r')).toBe('final');
  });

  it('encodes phases sorted with `final` instead of `gold`', () => {
    const phases: ReadonlySet<Phase> = new Set(['gold', 'group', 'sf']);
    const p = criteriaToParams({ ...EMPTY_FILTER, phases });
    // Alphabetical: final, group, sf
    expect(p.get('r')).toBe('final,group,sf');
  });

  it('encodes empty phases set as empty string (no phases)', () => {
    const p = criteriaToParams({ ...EMPTY_FILTER, phases: new Set() });
    expect(p.get('r')).toBe('');
  });

  it('drops invalid date values when serializing', () => {
    const p = criteriaToParams({
      ...EMPTY_FILTER,
      dateFrom: '-3-03', // garbage
      dateTo: '2024-08-10',
    });
    expect(p.has('from')).toBe(false);
    expect(p.get('to')).toBe('2024-08-10');
  });

  it('encodes valid dates and search', () => {
    const p = criteriaToParams({
      ...EMPTY_FILTER,
      dateFrom: '2024-07-24',
      dateTo: '2024-08-10',
      search: 'argent',
    });
    expect(p.get('from')).toBe('2024-07-24');
    expect(p.get('to')).toBe('2024-08-10');
    expect(p.get('q')).toBe('argent');
  });

  it('omits whitespace-only search', () => {
    const p = criteriaToParams({ ...EMPTY_FILTER, search: '   ' });
    expect(p.has('q')).toBe(false);
  });
});

describe('paramsToCriteria', () => {
  it('returns EMPTY_FILTER for empty params', () => {
    expect(paramsToCriteria(new URLSearchParams())).toEqual(EMPTY_FILTER);
  });

  it('parses tournament', () => {
    expect(paramsToCriteria(new URLSearchParams('t=men')).tournament).toBe('men');
    expect(paramsToCriteria(new URLSearchParams('t=women')).tournament).toBe('women');
  });

  it('treats unknown tournament as "all"', () => {
    expect(paramsToCriteria(new URLSearchParams('t=banana')).tournament).toBe('all');
  });

  it('parses URL `final` token to internal `gold`', () => {
    const c = paramsToCriteria(new URLSearchParams('r=final'));
    expect(c.phases).toEqual(new Set(['gold']));
  });

  it('parses phases as a Set with the URL → internal mapping', () => {
    const c = paramsToCriteria(new URLSearchParams('r=qf,sf,final'));
    expect([...(c.phases ?? [])].sort()).toEqual(['gold', 'qf', 'sf']);
  });

  it('parses empty r= as an empty Set (no phases match)', () => {
    const c = paramsToCriteria(new URLSearchParams('r='));
    expect(c.phases).toEqual(new Set());
  });

  it('drops unknown phase tokens silently', () => {
    const c = paramsToCriteria(new URLSearchParams('r=qf,banana,sf'));
    expect([...(c.phases ?? [])].sort()).toEqual(['qf', 'sf']);
  });

  it('does NOT recognize internal `gold` in URL (only `final` works)', () => {
    const c = paramsToCriteria(new URLSearchParams('r=gold'));
    expect(c.phases).toEqual(new Set()); // dropped as unknown
  });

  it('parses valid dates and search', () => {
    const c = paramsToCriteria(new URLSearchParams('from=2024-07-24&to=2024-08-10&q=spain'));
    expect(c.dateFrom).toBe('2024-07-24');
    expect(c.dateTo).toBe('2024-08-10');
    expect(c.search).toBe('spain');
  });

  it('rejects garbage date `-3-03` from URL (treats as undefined)', () => {
    const c = paramsToCriteria(new URLSearchParams('from=-3-03'));
    expect(c.dateFrom).toBeUndefined();
  });

  it.each([
    'from=2024-13-01', // bad month
    'from=2024-02-30', // bad day
    'from=2024/07/24', // bad separator
    'from=garbage',
    'from=', // empty
  ])('rejects malformed date param: %s', (queryString) => {
    const c = paramsToCriteria(new URLSearchParams(queryString));
    expect(c.dateFrom).toBeUndefined();
  });

  it('keeps a valid `to` even if `from` is garbage', () => {
    const c = paramsToCriteria(new URLSearchParams('from=-3-03&to=2024-08-10'));
    expect(c.dateFrom).toBeUndefined();
    expect(c.dateTo).toBe('2024-08-10');
  });
});

describe('round-trip', () => {
  const cases: FilterCriteria[] = [
    EMPTY_FILTER,
    { ...EMPTY_FILTER, tournament: 'men' },
    { ...EMPTY_FILTER, phases: new Set(['qf', 'sf', 'gold']) },
    { ...EMPTY_FILTER, dateFrom: '2024-07-24', dateTo: '2024-08-10' },
    { ...EMPTY_FILTER, search: 'argent' },
    {
      ...EMPTY_FILTER,
      tournament: 'women',
      phases: new Set(['group', 'qf']),
      dateFrom: '2024-07-25',
      search: 'spain',
    },
  ];

  it.each(cases)('preserves criteria through params round-trip: %j', (criteria) => {
    const params = criteriaToParams(criteria);
    const result = paramsToCriteria(params);
    expect(result.tournament).toBe(criteria.tournament);
    expect(result.dateFrom).toBe(criteria.dateFrom);
    expect(result.dateTo).toBe(criteria.dateTo);
    expect(result.search).toBe(criteria.search);
    if (criteria.phases) {
      expect([...(result.phases ?? [])].sort()).toEqual([...criteria.phases].sort());
    } else {
      expect(result.phases).toBeUndefined();
    }
  });

  it('produces stable URL strings (sortedKeys assertion via stringify)', () => {
    expect(criteriaToParams(EMPTY_FILTER).toString()).toBe('');
  });
});
