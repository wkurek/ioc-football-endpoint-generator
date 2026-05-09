import { describe, expect, it } from 'vitest';
import {
  EMPTY_FILTER,
  filterMatches,
  isEmptyFilter,
  type FilterCriteria,
} from './matchFilters';
import type { MatchSummary } from '@/domain/matchSummary';

const make = (over: Partial<MatchSummary>): MatchSummary => ({
  eventUnitCode: 'X',
  kickoff: '2024-07-24T15:00:00+02:00',
  date: '2024-07-24',
  tournament: 'men',
  phase: 'group',
  round: "Men's Group A — Match 1",
  homeTeam: 'Argentina',
  awayTeam: 'Morocco',
  venue: 'Geoffroy-Guichard Stadium',
  city: 'Saint-Etienne',
  status: 'FT',
  ...over,
});

const FIXTURE: MatchSummary[] = [
  make({
    eventUnitCode: 'M1',
    tournament: 'men',
    phase: 'group',
    date: '2024-07-24',
    homeTeam: 'Argentina',
    awayTeam: 'Morocco',
  }),
  make({
    eventUnitCode: 'M2',
    tournament: 'men',
    phase: 'qf',
    date: '2024-08-02',
    homeTeam: 'France',
    awayTeam: 'Argentina',
  }),
  make({
    eventUnitCode: 'M3',
    tournament: 'men',
    phase: 'gold',
    date: '2024-08-09',
    homeTeam: 'France',
    awayTeam: 'Spain',
  }),
  make({
    eventUnitCode: 'W1',
    tournament: 'women',
    phase: 'group',
    date: '2024-07-25',
    homeTeam: 'Spain',
    awayTeam: 'Japan',
  }),
  make({
    eventUnitCode: 'W2',
    tournament: 'women',
    phase: 'gold',
    date: '2024-08-10',
    homeTeam: 'Brazil',
    awayTeam: 'United States of America',
  }),
];

describe('filterMatches', () => {
  it('returns all when filter is empty', () => {
    expect(filterMatches(FIXTURE, EMPTY_FILTER)).toEqual(FIXTURE);
  });

  it('filters by tournament=men', () => {
    const result = filterMatches(FIXTURE, { ...EMPTY_FILTER, tournament: 'men' });
    expect(result.map((m) => m.eventUnitCode)).toEqual(['M1', 'M2', 'M3']);
  });

  it('filters by tournament=women', () => {
    const result = filterMatches(FIXTURE, { ...EMPTY_FILTER, tournament: 'women' });
    expect(result.map((m) => m.eventUnitCode)).toEqual(['W1', 'W2']);
  });

  it('filters by single phase', () => {
    const result = filterMatches(FIXTURE, {
      ...EMPTY_FILTER,
      phases: new Set(['gold']),
    });
    expect(result.map((m) => m.eventUnitCode)).toEqual(['M3', 'W2']);
  });

  it('filters by multiple phases (knockouts only)', () => {
    const result = filterMatches(FIXTURE, {
      ...EMPTY_FILTER,
      phases: new Set(['qf', 'sf', 'bronze', 'gold']),
    });
    expect(result.map((m) => m.eventUnitCode)).toEqual(['M2', 'M3', 'W2']);
  });

  it('returns nothing when phases is an empty set', () => {
    const result = filterMatches(FIXTURE, {
      ...EMPTY_FILTER,
      phases: new Set(),
    });
    expect(result).toEqual([]);
  });

  it('filters by date range (inclusive)', () => {
    const result = filterMatches(FIXTURE, {
      ...EMPTY_FILTER,
      dateFrom: '2024-08-01',
      dateTo: '2024-08-09',
    });
    expect(result.map((m) => m.eventUnitCode)).toEqual(['M2', 'M3']);
  });

  it('filters by dateFrom only (open-ended upper)', () => {
    const result = filterMatches(FIXTURE, {
      ...EMPTY_FILTER,
      dateFrom: '2024-08-01',
    });
    expect(result.map((m) => m.eventUnitCode)).toEqual(['M2', 'M3', 'W2']);
  });

  it('filters by dateTo only (open-ended lower)', () => {
    const result = filterMatches(FIXTURE, {
      ...EMPTY_FILTER,
      dateTo: '2024-07-31',
    });
    expect(result.map((m) => m.eventUnitCode)).toEqual(['M1', 'W1']);
  });

  it('filters by team name search (case-insensitive substring)', () => {
    expect(
      filterMatches(FIXTURE, { ...EMPTY_FILTER, search: 'argent' }).map(
        (m) => m.eventUnitCode,
      ),
    ).toEqual(['M1', 'M2']);
    expect(
      filterMatches(FIXTURE, { ...EMPTY_FILTER, search: 'SPAIN' }).map(
        (m) => m.eventUnitCode,
      ),
    ).toEqual(['M3', 'W1']);
    expect(
      filterMatches(FIXTURE, { ...EMPTY_FILTER, search: 'united states' }).map(
        (m) => m.eventUnitCode,
      ),
    ).toEqual(['W2']);
  });

  it('combines filters with AND', () => {
    const result = filterMatches(FIXTURE, {
      ...EMPTY_FILTER,
      tournament: 'men',
      phases: new Set(['gold']),
    });
    expect(result.map((m) => m.eventUnitCode)).toEqual(['M3']);
  });

  it('returns empty when search has no matches', () => {
    const result = filterMatches(FIXTURE, { ...EMPTY_FILTER, search: 'germany' });
    expect(result).toEqual([]);
  });
});

describe('isEmptyFilter', () => {
  it('detects empty filter', () => {
    expect(isEmptyFilter(EMPTY_FILTER)).toBe(true);
  });

  it.each([
    { tournament: 'men' } as Partial<FilterCriteria>,
    { phases: new Set(['group' as const]) } as Partial<FilterCriteria>,
    { dateFrom: '2024-07-24' } as Partial<FilterCriteria>,
    { dateTo: '2024-08-10' } as Partial<FilterCriteria>,
    { search: 'arg' } as Partial<FilterCriteria>,
  ])('detects non-empty filter when %j is set', (override) => {
    expect(isEmptyFilter({ ...EMPTY_FILTER, ...override })).toBe(false);
  });

  it('treats whitespace-only search as empty', () => {
    expect(isEmptyFilter({ ...EMPTY_FILTER, search: '   ' })).toBe(true);
  });
});
