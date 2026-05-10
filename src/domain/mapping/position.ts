import { Position } from '@/domain/types';
import { BroadPosition } from '@/data/api/codes';

/**
 * Maps OG2024's broad 4-letter position code to example.json's enum
 * (CONVENTIONS.md #26).
 *
 * - `GK` → `"GK"`
 * - `DF` → `"CB"`  (default — example.json doesn't have a generic "DF")
 * - `MF` → `"CM"`  (default — example.json doesn't have a generic "MF")
 * - `FW` → `"FW"`
 *
 * Throws on unknown broad codes — defensive per CONVENTIONS.md #27.
 *
 * Note: OG2024 also exposes per-match granular codes (D01-D07, M11-M44, F02-F06)
 * but these are formation-relative slot indices, not positional roles. Mapping
 * them to RB/CB/LB/etc. requires team-specific knowledge that isn't in the
 * source data — see CONVENTIONS.md #26 for the empirical proof.
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
      throw new Error(`mapPosition: unknown broad position code "${broad}"`);
  }
}
