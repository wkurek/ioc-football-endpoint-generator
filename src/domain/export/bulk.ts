import type { Match } from '@/domain/types';

/**
 * One pair = one match in the bulk export. The `code` carries `eventUnit.code`,
 * which becomes the key in the resulting map.
 */
export interface MatchEntry {
  code: string;
  match: Match;
}

/**
 * Serialize a list of matches as a map keyed by `eventUnit.code`
 * (CONVENTIONS.md #14 — option B).
 *
 * Output shape:
 * ```json
 * {
 *   "FBLM…GPA-000100--": { ...match shape from example.json },
 *   "FBLM…GPA-000200--": { ...match shape },
 *   ...
 * }
 * ```
 *
 * Insertion order of keys follows the input array (deterministic per
 * CONVENTIONS.md #15 — caller is expected to pass entries in sort order).
 *
 * Throws on duplicate codes (defensive — would silently overwrite otherwise).
 */
export function exportBulkAsJson(entries: readonly MatchEntry[]): string {
  const map: Record<string, Match> = {};
  for (const entry of entries) {
    if (entry.code in map) {
      throw new Error(`exportBulkAsJson: duplicate eventUnit.code "${entry.code}"`);
    }
    map[entry.code] = entry.match;
  }
  return JSON.stringify(map, null, 2);
}
