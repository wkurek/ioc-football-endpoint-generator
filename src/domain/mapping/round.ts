import type { SchSchedule } from '@/data/api/schemas';
import { TranslatableError } from '@/domain/errors';

/**
 * Per-match number used to suffix `competition.round`. Comes from SCH's
 * `unitNum` — same value the official schedule page renders as "Match N".
 * Cumulative per gender: group stage 1-24, QF 25-28, SF 29-30, Bronze 31,
 * Gold 32. Throws on missing/non-numeric input.
 */
export function parseUnitNum(sch: SchSchedule): number {
  const raw = sch.unitNum;
  if (!raw) {
    throw new TranslatableError('errors.round.missingUnitNum', { code: sch.eventUnit.code });
  }
  const n = parseInt(raw, 10);
  if (!Number.isFinite(n)) {
    throw new TranslatableError('errors.round.invalidUnitNum', {
      code: sch.eventUnit.code,
      raw,
    });
  }
  return n;
}
