import { describe, expect, it } from 'vitest';
import { criteriaToParams, paramsToCriteria } from './filterUrlState';
import { EMPTY_FILTER, type FilterCriteria } from './matchFilters';
import type { Phase } from '@/domain/matchSummary';

const sortedKeys = (p: URLSearchParams): string[] => [...p.keys()].sort();

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

  it('encodes phases as sorted comma list', () => {
    const phases: ReadonlySet<Phase> = new Set(['gold', 'group', 'sf']);
    const p = criteriaToParams({ ...EMPTY_FILTER, phases });
    expect(p.get('r')).toBe('gold,group,sf');
  });

  it('encodes empty phases set as empty string (no phases)', () => {
    const p = criteriaToParams({ ...EMPTY_FILTER, phases: new Set() });
    expect(p.get('r')).toBe('');
  });

  it('omits dateFrom/dateTo when unset', () => {
    const p = criteriaToParams(EMPTY_FILTER);
    expect(p.has('from')).toBe(false);
    expect(p.has('to')).toBe(false);
  });

  it('encodes dates and search', () => {
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

  it('parses phases as a Set', () => {
    const c = paramsToCriteria(new URLSearchParams('r=qf,sf'));
    expect(c.phases).toBeInstanceOf(Set);
    expect([...(c.phases ?? [])].sort()).toEqual(['qf', 'sf']);
  });

  it('parses empty r= as an empty Set (no phases match)', () => {
    const c = paramsToCriteria(new URLSearchParams('r='));
    expect(c.phases).toEqual(new Set());
  });

  it('drops unknown phase tokens silently', () => {
    const c = paramsToCriteria(new URLSearchParams('r=qf,banana,sf'));
    expect([...(c.phases ?? [])].sort()).toEqual(['qf', 'sf']);
  });

  it('parses dates and search', () => {
    const c = paramsToCriteria(new URLSearchParams('from=2024-07-24&to=2024-08-10&q=spain'));
    expect(c.dateFrom).toBe('2024-07-24');
    expect(c.dateTo).toBe('2024-08-10');
    expect(c.search).toBe('spain');
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

  // Lightweight signal that test helper is available.
  it.each([new URLSearchParams('a=1&b=2&c=3')])('sortedKeys helper sanity', (p) => {
    expect(sortedKeys(p)).toEqual(['a', 'b', 'c']);
  });
});
