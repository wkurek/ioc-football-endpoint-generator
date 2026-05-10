import type { Score } from '@/domain/types';
import { PeriodCode } from '@/data/api/codes';
import { TranslatableError } from '@/domain/errors';
import type { z } from 'zod';

interface PeriodLike {
  p_code: string;
  home: { score: string };
  away: { score: string };
}

/**
 * `score.home/away` ← TOT period (regulation+ET, excluding PSO).
 * `score.halfTime.home/away` ← H1 period.
 *
 * For PSO matches, TOT is the score after regulation+ET (e.g. EGY-PAR TOT
 * = 1-1, Egypt won on penalties); the shootout outcome is dropped because
 * `example.json` has no field for it.
 */
export function buildScore(periods: PeriodLike[]): Score {
  const tot = periods.find((p) => p.p_code === PeriodCode.TOTAL);
  const h1 = periods.find((p) => p.p_code === PeriodCode.FIRST_HALF);

  if (!tot) throw new TranslatableError('errors.score.missingTOT');
  if (!h1) throw new TranslatableError('errors.score.missingH1');

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
    throw new TranslatableError('errors.score.cannotParseInt', { label, raw });
  }
  return n;
}

export type { z };
