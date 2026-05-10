import { z } from 'zod';
import type { Match } from '@/domain/types';
import { MatchSchema } from '@/domain/matchSchema';
import { TranslatableError } from '@/domain/errors';
import { STACY_BASE_URL } from '@/data/api/stacy-client';
import { canonicalizeMatch } from './single';

/**
 * One pair = one match in the bulk export. The `code` carries `eventUnit.code`,
 * which becomes the key in the resulting map.
 */
export interface MatchEntry {
  code: string;
  match: Match;
}

/** Schema version for the bulk wrapper. Bump when `__metadata__` shape changes. */
export const BULK_SCHEMA_VERSION = '1.0.0';

const DEFAULT_PAGE_URL =
  'https://stacy.olympics.com/en/paris-2024/competition-schedule';

/**
 * Provenance metadata embedded at the root of every bulk export under the
 * `__metadata__` key. `source` carries both URLs we care about: the official
 * page from the assignment AND the actual CDN base where we fetch the JSON.
 */
export const BulkExportMetadataSchema = z.object({
  generatedAt: z.string().datetime(),
  schemaVersion: z.string().regex(/^\d+\.\d+\.\d+$/),
  source: z.object({
    /** Official Olympic schedule page (the URL the assignment points at). */
    pageUrl: z.string().url(),
    /** CDN base where the data is actually fetched from (Atos JSON endpoints). */
    apiBase: z.string().url(),
  }),
  count: z.number().int().nonnegative(),
});
export type BulkExportMetadata = z.infer<typeof BulkExportMetadataSchema>;

/**
 * Zod schema for the full bulk export payload (consumer-side validation).
 * Accepts the `__metadata__` wrapper plus any number of match-keyed entries.
 *
 * `MatchSchema.passthrough()` would allow unknown keys per match — we want
 * strict shape there, but the top-level record is open by design (keys are
 * `eventUnit.code` strings).
 */
export const BulkExportSchema = z
  .object({ __metadata__: BulkExportMetadataSchema })
  .catchall(MatchSchema);

export interface BulkExportOptions {
  /** ISO timestamp for the export. Defaults to `new Date().toISOString()` at call time. */
  generatedAt?: string;
  /** Override the source page URL recorded in `__metadata__.source.pageUrl`. */
  pageUrl?: string;
  /** Override the API base recorded in `__metadata__.source.apiBase`. */
  apiBase?: string;
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
 *     "source": {
 *       "pageUrl": "https://stacy.olympics.com/en/paris-2024/competition-schedule",
 *       "apiBase": "https://stacy.olympics.com/OG2024/data"
 *     },
 *     "count": 58
 *   },
 *   "FBLM…GPA-000100--": { ...example.json shape },
 *   ...
 * }
 * ```
 *
 * Single-match export (`exportSingleAsJson`) intentionally does NOT add metadata
 * — it must remain byte-perfect against `example.json` so the file can be used
 * directly as a QA "expected" reference.
 *
 * `__metadata__` appears as the first key thanks to JS insertion order. A
 * consumer that re-serializes with alphabetical key sort will see it last
 * (`_` > letters in ASCII) — our determinism guarantee is insertion order.
 *
 * Throws on duplicate codes.
 */
export function exportBulkAsJson(
  entries: readonly MatchEntry[],
  options: BulkExportOptions = {},
): string {
  const metadata: BulkExportMetadata = {
    generatedAt: options.generatedAt ?? new Date().toISOString(),
    schemaVersion: BULK_SCHEMA_VERSION,
    source: {
      pageUrl: options.pageUrl ?? DEFAULT_PAGE_URL,
      apiBase: options.apiBase ?? STACY_BASE_URL,
    },
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
