import type { Match } from '@/domain/types';

/**
 * Serialize a single match to a JSON string.
 *
 * Output is exactly the `example.json` shape — no wrapper, no `id` field
 * (CONVENTIONS.md #1, #13, #14). The filename carries the ID separately.
 *
 * Pretty-printed with 2-space indent for human review of `Download single` files.
 */
export function exportSingleAsJson(match: Match): string {
  return JSON.stringify(match, null, 2);
}
