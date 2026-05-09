import { describe, expect, it } from 'vitest';
import { exportSingleAsJson } from './single';
import { exportBulkAsJson } from './bulk';
import type { Match } from '@/domain/types';

const fakeMatch = (override: Partial<Match> = {}): Match => ({
  competition: { name: 'Olympic Games', season: 'Paris 2024', round: 'X' },
  venue: { name: 'V', city: 'C' },
  kickoff: '2024-07-24T15:00:00+02:00',
  status: 'FT',
  teams: { home: 'A', away: 'B' },
  score: { home: 1, away: 2, halfTime: { home: 0, away: 1 } },
  scorers: [],
  lineups: {
    home: { team: 'A', formation: '4-4-2', coach: 'Coach A', startingXI: [], bench: [] },
    away: { team: 'B', formation: '4-2-3-1', coach: 'Coach B', startingXI: [], bench: [] },
  },
  ...override,
});

describe('exportSingleAsJson', () => {
  it('emits the match in pure example.json shape (no wrapper)', () => {
    const json = exportSingleAsJson(fakeMatch());
    const parsed = JSON.parse(json) as Match;
    expect(parsed.competition.name).toBe('Olympic Games');
    expect(parsed.score.home).toBe(1);
    // No extra top-level keys (id, etc.)
    expect(Object.keys(parsed).sort()).toEqual([
      'competition',
      'kickoff',
      'lineups',
      'score',
      'scorers',
      'status',
      'teams',
      'venue',
    ]);
  });

  it('is pretty-printed with 2-space indent', () => {
    const json = exportSingleAsJson(fakeMatch());
    expect(json.includes('\n  "competition"')).toBe(true);
  });

  it('is deterministic — same input → same output', () => {
    const a = exportSingleAsJson(fakeMatch());
    const b = exportSingleAsJson(fakeMatch());
    expect(a).toBe(b);
  });
});

describe('exportBulkAsJson', () => {
  const codeA = 'FBLMTEAM11------------GPA-000100--';
  const codeB = 'FBLMTEAM11------------GPA-000200--';

  it('produces a map keyed by eventUnit.code', () => {
    const json = exportBulkAsJson([
      { code: codeA, match: fakeMatch({ teams: { home: 'X', away: 'Y' } }) },
      { code: codeB, match: fakeMatch({ teams: { home: 'P', away: 'Q' } }) },
    ]);
    const parsed = JSON.parse(json) as Record<string, Match>;
    expect(Object.keys(parsed)).toEqual([codeA, codeB]);
    expect(parsed[codeA]?.teams).toEqual({ home: 'X', away: 'Y' });
    expect(parsed[codeB]?.teams).toEqual({ home: 'P', away: 'Q' });
  });

  it('preserves insertion order (deterministic)', () => {
    // Reverse order should yield reverse keys.
    const json = exportBulkAsJson([
      { code: codeB, match: fakeMatch() },
      { code: codeA, match: fakeMatch() },
    ]);
    const parsed = JSON.parse(json) as Record<string, Match>;
    expect(Object.keys(parsed)).toEqual([codeB, codeA]);
  });

  it('values are pure example.json shape (no extra id key inside)', () => {
    const json = exportBulkAsJson([{ code: codeA, match: fakeMatch() }]);
    const parsed = JSON.parse(json) as Record<string, Match>;
    const entry = parsed[codeA];
    expect(entry).toBeDefined();
    expect(Object.keys(entry!).sort()).toEqual([
      'competition',
      'kickoff',
      'lineups',
      'score',
      'scorers',
      'status',
      'teams',
      'venue',
    ]);
  });

  it('throws on duplicate codes', () => {
    expect(() =>
      exportBulkAsJson([
        { code: codeA, match: fakeMatch() },
        { code: codeA, match: fakeMatch() },
      ]),
    ).toThrow(/duplicate/);
  });

  it('handles an empty list — emits "{}"', () => {
    expect(exportBulkAsJson([])).toBe('{}');
  });
});
