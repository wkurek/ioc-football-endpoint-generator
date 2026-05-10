import { FieldSource, NEUTRAL, type LineSource } from '@/domain/types';

/**
 * Maps a JSON path (within the example.json shape) to its source-of-truth tag
 * (CONVENTIONS.md #31, #37). Used by the Generated view to color-code each
 * field by where its data came from.
 */
export function pathSource(path: readonly string[]): LineSource {
  if (path.length === 0) return NEUTRAL;
  const root = path[0];
  const sub = path[1];

  if (root === 'competition') {
    if (sub === 'name' || sub === 'season') return FieldSource.CONST;
    if (sub === 'round') return FieldSource.SCH;
    return NEUTRAL;
  }
  if (root === 'venue') return FieldSource.SCH;
  if (root === 'kickoff') return FieldSource.SCH;
  if (root === 'status') return FieldSource.CONST; // mapping FINISHED → "FT"
  if (root === 'teams') return FieldSource.RES;
  if (root === 'score') return FieldSource.RES;
  if (root === 'scorers') return FieldSource.RES;
  if (root === 'lineups') return FieldSource.RES;
  return NEUTRAL;
}
