import type { FieldSource } from '@/domain/types';

/**
 * Maps a JSON path (within the example.json shape) to its source-of-truth tag
 * (CONVENTIONS.md #31, #37). Used by the Generated view to color-code each
 * field by where its data came from.
 */
export function pathSource(path: readonly string[]): FieldSource | 'neutral' {
  if (path.length === 0) return 'neutral';
  const root = path[0];
  const sub = path[1];

  if (root === 'competition') {
    if (sub === 'name' || sub === 'season') return 'const';
    if (sub === 'round') return 'sch';
    return 'neutral';
  }
  if (root === 'venue') return 'sch';
  if (root === 'kickoff') return 'sch';
  if (root === 'status') return 'const'; // mapping FINISHED → "FT"
  if (root === 'teams') return 'res';
  if (root === 'score') return 'res';
  if (root === 'scorers') return 'res';
  if (root === 'lineups') return 'res';
  return 'neutral';
}
