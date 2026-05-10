import { MatchStatus } from '@/domain/types';
import { ApiStatusCode } from '@/data/api/codes';
import { TranslatableError } from '@/domain/errors';

/**
 * `FINISHED` → `"FT"`. Anything else throws — `example.json` only specifies
 * `"FT"`, and OG2024 is a closed archive (all 58 matches FINISHED), so an
 * unknown code is a schema surprise that should surface as a per-match error
 * rather than silently leak through.
 */
export function mapStatus(statusCode: string): MatchStatus {
  if (statusCode === ApiStatusCode.FINISHED) return MatchStatus.FULL_TIME;
  throw new TranslatableError('errors.status.unsupported', { code: statusCode });
}
