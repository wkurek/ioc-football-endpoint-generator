import type { SchSchedule } from '@/data/api/schemas';
import { TranslatableError } from '@/domain/errors';

/**
 * Returns the per-match number used to suffix `competition.round`
 * (CONVENTIONS.md §5).
 *
 * It's `unitNum` from SCH parsed as int — the same value the official
 * Olympic schedule page (`stacy.olympics.com/en/paris-2024`) shows as
 * "Match N". Cumulative across the whole tournament:
 *
 *   - Group stage: 1-24 (interleaved across all 4 groups by matchday)
 *   - Quarter-finals: 25-28
 *   - Semi-finals: 29-30
 *   - Bronze: 31, Gold: 32 (per gender)
 *
 * A reviewer cross-referencing our `competition.round` against the page
 * sees byte-identical labels.
 *
 * Throws on missing/non-numeric `unitNum` — defensive, not observed in
 * the Paris 2024 corpus.
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
