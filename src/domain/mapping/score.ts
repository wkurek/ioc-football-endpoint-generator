import type { Score } from '@/domain/types';
import { PeriodCode } from '@/data/api/codes';
import type { z } from 'zod';

interface PeriodLike {
  p_code: string;
  home: { score: string };
  away: { score: string };
}

/**
 * Build the `score` block (CONVENTIONS.md #28).
 *
 * - `score.home/away`           ← TOT period (after regulation+ET, NOT including PSO).
 * - `score.halfTime.home/away`  ← H1 period.
 *
 * Throws if either TOT or H1 period is missing — defensive per CONVENTIONS.md #27.
 *
 * Note on PSO: matches that went to penalties have TOT representing the score
 * after regulation+ET (e.g. EGY-PAR TOT = 1-1, Egypt won on penalties). The
 * PSO winner is intentionally not encoded — see CONVENTIONS.md #8.
 */
export function buildScore(periods: PeriodLike[]): Score {
  const tot = periods.find((p) => p.p_code === PeriodCode.TOTAL);
  const h1 = periods.find((p) => p.p_code === PeriodCode.FIRST_HALF);

  if (!tot) throw new Error('buildScore: missing TOT period');
  if (!h1) throw new Error('buildScore: missing H1 period');

  return {
    home: parseScoreValue(tot.home.score, 'TOT.home'),
    away: parseScoreValue(tot.away.score, 'TOT.away'),
    halfTime: {
      home: parseScoreValue(h1.home.score, 'H1.home'),
      away: parseScoreValue(h1.away.score, 'H1.away'),
    },
  };
}

function parseScoreValue(raw: string, label: string): number {
  const n = parseInt(raw, 10);
  if (Number.isNaN(n)) {
    throw new Error(`buildScore: cannot parse ${label}="${raw}" as integer`);
  }
  return n;
}

/** Re-exported for convenience in tests. */
export type { z };
