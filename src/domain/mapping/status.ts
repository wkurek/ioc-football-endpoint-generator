import { MatchStatus } from '@/domain/types';
import { ApiStatusCode } from '@/data/api/codes';

/**
 * Maps OG2024 `status.code` to our output `status` value (CONVENTIONS.md #12).
 *
 * `FINISHED` → `"FT"`. Anything else throws — example.json only specifies "FT"
 * and OG2024 is a closed historical archive (all 58 matches FINISHED), so an
 * unknown code means a schema surprise that needs human attention rather than
 * a silent passthrough.
 */
export function mapStatus(statusCode: string): MatchStatus {
  if (statusCode === ApiStatusCode.FINISHED) return MatchStatus.FULL_TIME;
  throw new Error(`mapStatus: unsupported status.code "${statusCode}" (only FINISHED is mapped)`);
}
