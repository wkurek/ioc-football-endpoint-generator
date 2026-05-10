import { FieldSource, NEUTRAL, type LineSource } from '@/domain/types';

/**
 * JSON path → source-of-truth tag (sch/res/const/neutral). Drives the
 * per-field color highlight on the Generated view.
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
