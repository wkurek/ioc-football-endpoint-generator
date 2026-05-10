import type { Match } from '@/domain/types';
import { TranslatableError } from '@/domain/errors';
import { canonicalizeMatch } from './single';

/**
 * One pair = one match in the bulk export. The `code` carries `eventUnit.code`,
 * which becomes the key in the resulting map.
 */
export interface MatchEntry {
  code: string;
  match: Match;
}

/** Schema version for the bulk wrapper. Bumps when `__metadata__` shape changes. */
export const BULK_SCHEMA_VERSION = '1.0.0';

const DEFAULT_SOURCE_URL =
  'https://stacy.olympics.com/en/paris-2024/competition-schedule';

export interface BulkExportMetadata {
  generatedAt: string;
  schemaVersion: string;
  source: { url: string };
  count: number;
}

export interface BulkExportOptions {
  /** ISO timestamp for the export. Defaults to `new Date().toISOString()` at call time. */
  generatedAt?: string;
  /** Source-of-truth URL recorded in `__metadata__.source.url`. */
  sourceUrl?: string;
}

/**
 * Serialize a list of matches as a map keyed by `eventUnit.code`, plus a
 * `__metadata__` wrapper at the root with provenance info.
 *
 * Output shape:
 * ```json
 * {
 *   "__metadata__": {
 *     "generatedAt": "2026-05-10T12:34:56.000Z",
 *     "schemaVersion": "1.0.0",
 *     "source": { "url": "https://stacy.olympics.com/..." },
 *     "count": 58
 *   },
 *   "FBLM…GPA-000100--": { ...example.json shape },
 *   "FBLM…GPA-000200--": { ...example.json shape },
 *   ...
 * }
 * ```
 *
 * Single-match export (`exportSingleAsJson`) intentionally does NOT add metadata
 * — it must remain byte-perfect against `example.json` so the file can be used
 * directly as a QA "expected" reference.
 *
 * Insertion order: `__metadata__` first, then matches in caller-provided order
 * (which is sort order — CONVENTIONS.md §9). Throws on duplicate codes.
 */
export function exportBulkAsJson(
  entries: readonly MatchEntry[],
  options: BulkExportOptions = {},
): string {
  const metadata: BulkExportMetadata = {
    generatedAt: options.generatedAt ?? new Date().toISOString(),
    schemaVersion: BULK_SCHEMA_VERSION,
    source: { url: options.sourceUrl ?? DEFAULT_SOURCE_URL },
    count: entries.length,
  };

  const out: Record<string, BulkExportMetadata | Match> = { __metadata__: metadata };
  for (const entry of entries) {
    if (entry.code in out) {
      throw new TranslatableError('errors.export.duplicateCode', { code: entry.code });
    }
    out[entry.code] = canonicalizeMatch(entry.match);
  }
  return JSON.stringify(out, null, 2);
}
