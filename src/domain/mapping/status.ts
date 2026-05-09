/**
 * Maps OG2024 `status.code` to our output `status` string (CONVENTIONS.md #12).
 *
 * - `FINISHED` → `"FT"` (full time, matches example.json convention)
 * - everything else → raw passthrough (preserves any future status untouched)
 */
export function mapStatus(statusCode: string): string {
  if (statusCode === 'FINISHED') return 'FT';
  return statusCode;
}
