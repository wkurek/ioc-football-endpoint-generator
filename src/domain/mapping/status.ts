/**
 * Maps OG2024 `status.code` to our output `status` string (CONVENTIONS.md #12).
 *
 * `FINISHED` → `"FT"`. Anything else throws — example.json only specifies "FT"
 * and OG2024 is a closed historical archive (all 58 matches FINISHED), so an
 * unknown code means a schema surprise that needs human attention rather than
 * a silent passthrough.
 */
export function mapStatus(statusCode: string): string {
  if (statusCode === 'FINISHED') return 'FT';
  throw new Error(`mapStatus: unsupported status.code "${statusCode}" (only FINISHED is mapped)`);
}
