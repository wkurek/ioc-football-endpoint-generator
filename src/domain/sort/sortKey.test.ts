import { describe, expect, it } from 'vitest';
import { compareMatchSummary, sortMatchSummaries } from './sortKey';
import type { MatchSummary } from '@/domain/matchSummary';

const m = (over: Partial<MatchSummary>): MatchSummary => ({
  eventUnitCode: 'X',
  kickoff: '2024-07-24T15:00:00+02:00',
  date: '2024-07-24',
  tournament: 'men',
  phase: 'group',
  round: 'r',
  homeTeam: 'A',
  awayTeam: 'B',
  venue: 'V',
  city: 'C',
  status: 'FT',
  ...over,
});

describe('compareMatchSummary', () => {
  it('orders by kickoff ASC', () => {
    const earlier = m({
      eventUnitCode: 'X',
      kickoff: '2024-07-24T15:00:00+02:00',
    });
    const later = m({
      eventUnitCode: 'X',
      kickoff: '2024-07-24T17:00:00+02:00',
    });
    expect(compareMatchSummary(earlier, later)).toBeLessThan(0);
    expect(compareMatchSummary(later, earlier)).toBeGreaterThan(0);
  });

  it('breaks ties on code ASC for parallel kickoffs', () => {
    const a = m({
      eventUnitCode: 'FBLMTEAM11------------GPA-000100--',
      kickoff: '2024-07-24T15:00:00+02:00',
    });
    const b = m({
      eventUnitCode: 'FBLMTEAM11------------GPB-000100--',
      kickoff: '2024-07-24T15:00:00+02:00',
    });
    expect(compareMatchSummary(a, b)).toBeLessThan(0);
  });

  it('compares kickoffs by absolute time, not by string (mixed offsets)', () => {
    // Same instant in time, different offsets: 14:00+01:00 === 15:00+02:00.
    // Lex compare would order "14:00+01:00" before "15:00+02:00"; Date.parse
    // sees them as equal and falls through to the code tie-breaker.
    const earlierByLex = m({
      eventUnitCode: 'B',
      kickoff: '2024-07-24T14:00:00+01:00',
    });
    const equalAbsTime = m({
      eventUnitCode: 'A',
      kickoff: '2024-07-24T15:00:00+02:00',
    });
    // Tie on time → A before B by code.
    expect(compareMatchSummary(equalAbsTime, earlierByLex)).toBeLessThan(0);
  });
});

describe('sortMatchSummaries', () => {
  it('does not mutate the input array', () => {
    const input = [
      m({ eventUnitCode: 'B', kickoff: '2024-07-24T17:00:00+02:00' }),
      m({ eventUnitCode: 'A', kickoff: '2024-07-24T15:00:00+02:00' }),
    ];
    const before = [...input];
    sortMatchSummaries(input);
    expect(input).toEqual(before);
  });

  it('sorts by kickoff then code', () => {
    const result = sortMatchSummaries([
      m({ eventUnitCode: 'C', kickoff: '2024-07-25T15:00:00+02:00' }),
      m({ eventUnitCode: 'B', kickoff: '2024-07-24T17:00:00+02:00' }),
      m({ eventUnitCode: 'A', kickoff: '2024-07-24T15:00:00+02:00' }),
      m({ eventUnitCode: 'D', kickoff: '2024-07-24T15:00:00+02:00' }),
    ]);
    expect(result.map((x) => x.eventUnitCode)).toEqual(['A', 'D', 'B', 'C']);
  });
});
