import { describe, expect, it } from 'vitest';
import { exportSingleAsJson } from './single';
import { exportBulkAsJson, BULK_SCHEMA_VERSION, BulkExportSchema } from './bulk';
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

const FIXED_TS = '2026-05-10T12:00:00.000Z';

describe('exportSingleAsJson', () => {
  it('emits the match in pure example.json shape (no wrapper)', () => {
    const json = exportSingleAsJson(fakeMatch());
    const parsed = JSON.parse(json) as Match;
    expect(parsed.competition.name).toBe('Olympic Games');
    expect(parsed.score.home).toBe(1);
    // No extra top-level keys (id, __metadata__, etc.)
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

  it('emits keys in canonical example.json order (NOT alphabetical)', () => {
    const json = exportSingleAsJson(fakeMatch());
    const parsed = JSON.parse(json) as Match;
    expect(Object.keys(parsed)).toEqual([
      'competition',
      'venue',
      'kickoff',
      'status',
      'teams',
      'score',
      'scorers',
      'lineups',
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

  it('is independent of the input object literal key order', () => {
    // If we shuffle the input keys, the output should still be byte-identical
    // to the canonical form.
    const canonical = fakeMatch();
    const shuffled: Match = {
      lineups: canonical.lineups,
      scorers: canonical.scorers,
      score: canonical.score,
      teams: canonical.teams,
      status: canonical.status,
      kickoff: canonical.kickoff,
      venue: canonical.venue,
      competition: canonical.competition,
    };
    expect(exportSingleAsJson(shuffled)).toBe(exportSingleAsJson(canonical));
  });
});

describe('exportBulkAsJson', () => {
  const codeA = 'FBLMTEAM11------------GPA-000100--';
  const codeB = 'FBLMTEAM11------------GPA-000200--';

  it('produces a map keyed by eventUnit.code, with __metadata__ first', () => {
    const json = exportBulkAsJson(
      [
        { code: codeA, match: fakeMatch({ teams: { home: 'X', away: 'Y' } }) },
        { code: codeB, match: fakeMatch({ teams: { home: 'P', away: 'Q' } }) },
      ],
      { generatedAt: FIXED_TS },
    );
    const parsed = JSON.parse(json) as Record<string, unknown>;
    expect(Object.keys(parsed)).toEqual(['__metadata__', codeA, codeB]);
    expect((parsed[codeA] as Match).teams).toEqual({ home: 'X', away: 'Y' });
    expect((parsed[codeB] as Match).teams).toEqual({ home: 'P', away: 'Q' });
  });

  it('preserves match insertion order (deterministic) after __metadata__', () => {
    const json = exportBulkAsJson(
      [
        { code: codeB, match: fakeMatch() },
        { code: codeA, match: fakeMatch() },
      ],
      { generatedAt: FIXED_TS },
    );
    const parsed = JSON.parse(json) as Record<string, unknown>;
    expect(Object.keys(parsed)).toEqual(['__metadata__', codeB, codeA]);
  });

  it('match values stay in pure example.json shape (no metadata leaks in)', () => {
    const json = exportBulkAsJson([{ code: codeA, match: fakeMatch() }], {
      generatedAt: FIXED_TS,
    });
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

  it('__metadata__ has generatedAt, schemaVersion, source.{pageUrl,apiBase}, count', () => {
    const json = exportBulkAsJson(
      [
        { code: codeA, match: fakeMatch() },
        { code: codeB, match: fakeMatch() },
      ],
      {
        generatedAt: FIXED_TS,
        pageUrl: 'https://example.test/page',
        apiBase: 'https://example.test/api',
      },
    );
    const parsed = JSON.parse(json) as { __metadata__: unknown };
    expect(parsed.__metadata__).toEqual({
      generatedAt: FIXED_TS,
      schemaVersion: BULK_SCHEMA_VERSION,
      source: {
        pageUrl: 'https://example.test/page',
        apiBase: 'https://example.test/api',
      },
      count: 2,
    });
  });

  it('default __metadata__.source URLs reference the official page and Stacy CDN', () => {
    const json = exportBulkAsJson([{ code: codeA, match: fakeMatch() }], {
      generatedAt: FIXED_TS,
    });
    const parsed = JSON.parse(json) as { __metadata__: { source: Record<string, string> } };
    expect(parsed.__metadata__.source.pageUrl).toBe(
      'https://stacy.olympics.com/en/paris-2024/competition-schedule',
    );
    expect(parsed.__metadata__.source.apiBase).toBe('https://stacy.olympics.com/OG2024/data');
  });

  it('BulkExportSchema round-trips its own output', () => {
    const json = exportBulkAsJson(
      [
        { code: codeA, match: fakeMatch() },
        { code: codeB, match: fakeMatch() },
      ],
      { generatedAt: FIXED_TS },
    );
    const parsed = JSON.parse(json);
    const result = BulkExportSchema.safeParse(parsed);
    if (!result.success) {
      throw new Error(
        result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
      );
    }
    expect(result.success).toBe(true);
  });

  it('BulkExportSchema rejects payloads missing __metadata__', () => {
    const result = BulkExportSchema.safeParse({ [codeA]: fakeMatch() });
    expect(result.success).toBe(false);
  });

  it('BulkExportSchema rejects bad schemaVersion', () => {
    const json = exportBulkAsJson([{ code: codeA, match: fakeMatch() }], {
      generatedAt: FIXED_TS,
    });
    const parsed = JSON.parse(json) as { __metadata__: { schemaVersion: string } };
    parsed.__metadata__.schemaVersion = 'not-semver';
    expect(BulkExportSchema.safeParse(parsed).success).toBe(false);
  });

  it('throws on duplicate codes', () => {
    expect(() =>
      exportBulkAsJson(
        [
          { code: codeA, match: fakeMatch() },
          { code: codeA, match: fakeMatch() },
        ],
        { generatedAt: FIXED_TS },
      ),
    ).toThrow(/duplicate/);
  });

  it('handles an empty list — emits __metadata__ with count: 0', () => {
    const json = exportBulkAsJson([], { generatedAt: FIXED_TS });
    const parsed = JSON.parse(json) as { __metadata__: { count: number } };
    expect(Object.keys(parsed)).toEqual(['__metadata__']);
    expect(parsed.__metadata__.count).toBe(0);
  });

  it('defaults generatedAt to a fresh ISO timestamp when not provided', () => {
    const before = Date.now();
    const json = exportBulkAsJson([{ code: codeA, match: fakeMatch() }]);
    const after = Date.now();
    const parsed = JSON.parse(json) as { __metadata__: { generatedAt: string } };
    const ts = Date.parse(parsed.__metadata__.generatedAt);
    expect(ts).toBeGreaterThanOrEqual(before);
    expect(ts).toBeLessThanOrEqual(after);
  });
});
