import { describe, expect, it } from 'vitest';
import { buildScore } from './score';

const periods = (entries: Array<[code: string, h: string, a: string]>) =>
  entries.map(([p_code, h, a]) => ({ p_code, home: { score: h }, away: { score: a } }));

describe('buildScore', () => {
  it('extracts TOT for full-time and H1 for halftime (regulation 90)', () => {
    // ARG 1-2 MAR (HT 0-1) — group stage
    const score = buildScore(
      periods([
        ['H1', '0', '1'],
        ['H2', '1', '1'],
        ['TOT', '1', '2'],
      ]),
    );
    expect(score).toEqual({ home: 1, away: 2, halfTime: { home: 0, away: 1 } });
  });

  it('returns score after extra time when match went to ET (without PSO)', () => {
    // FRA 3-5 ESP — Men's Gold final, 3-3 after 90, 3-5 after ET
    const score = buildScore(
      periods([
        ['H1', '1', '1'],
        ['H2', '3', '3'],
        ['ET-H1', '3', '4'],
        ['ET-H2', '3', '5'],
        ['TOT', '3', '5'],
      ]),
    );
    expect(score.home).toBe(3);
    expect(score.away).toBe(5);
    expect(score.halfTime).toEqual({ home: 1, away: 1 });
  });

  it('reports score after regulation+ET for PSO matches (shootout outcome dropped)', () => {
    // EGY 1-1 PAR — Men's QF, 1-1 after ET, Egypt won on penalties.
    // PSO winner is intentionally dropped; score reflects regulation+ET only.
    const score = buildScore(
      periods([
        ['H1', '0', '1'],
        ['H2', '1', '1'],
        ['ET-H1', '1', '1'],
        ['ET-H2', '1', '1'],
        ['PSO', '5', '4'],
        ['TOT', '1', '1'],
      ]),
    );
    expect(score).toEqual({ home: 1, away: 1, halfTime: { home: 0, away: 1 } });
  });

  it('returns 0-0 for goalless matches', () => {
    const score = buildScore(
      periods([
        ['H1', '0', '0'],
        ['H2', '0', '0'],
        ['TOT', '0', '0'],
      ]),
    );
    expect(score).toEqual({ home: 0, away: 0, halfTime: { home: 0, away: 0 } });
  });

  it('throws if TOT period is missing', () => {
    expect(() => buildScore(periods([['H1', '0', '0']]))).toThrow(/TOT/);
  });

  it('throws if H1 period is missing', () => {
    expect(() => buildScore(periods([['TOT', '1', '0']]))).toThrow(/H1/);
  });

  it('throws if a score value is not parseable as integer', () => {
    expect(() =>
      buildScore(
        periods([
          ['H1', '0', 'X'],
          ['TOT', '1', '0'],
        ]),
      ),
    ).toThrow(/errors\.score\.cannotParseInt/);
  });
});
