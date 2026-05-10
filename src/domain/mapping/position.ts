import { Position } from '@/domain/types';
import { BroadPosition } from '@/data/api/codes';
import { TranslatableError } from '@/domain/errors';

/**
 * OG2024 broad 4-letter codes → `example.json` position enum:
 *   `GK → GK`, `DF → CB`, `MF → CM`, `FW → FW`.
 *
 * `DF` collapses to `CB` and `MF` to `CM` because `example.json` has no
 * generic defender/midfielder code. Granular Atos codes (D01-D07, M11-M44,
 * F02-F06) are formation-slot indices, not roles, so don't help. Throws on
 * unknown codes — schema surprise should surface, not silently leak through.
 */
export function mapPosition(broad: string): Position {
  switch (broad) {
    case BroadPosition.GK:
      return Position.GK;
    case BroadPosition.DF:
      return Position.CB;
    case BroadPosition.MF:
      return Position.CM;
    case BroadPosition.FW:
      return Position.FW;
    default:
      throw new TranslatableError('errors.position.unknownBroad', { code: broad });
  }
}
