import type { TFunction } from 'i18next';
import { TranslatableError } from '@/domain/errors';

/**
 * Renders an error for display. `TranslatableError` is translated via i18next;
 * any other Error keeps its raw `.message` (covers programmer invariants and
 * native browser errors like "Failed to fetch"). Non-Error values fall back to
 * a generic localized label.
 */
export function translateError(err: unknown, t: TFunction): string {
  if (err instanceof TranslatableError) {
    return t(err.key, err.params ?? {});
  }
  if (err instanceof Error) {
    return err.message;
  }
  return t('states.unknownError');
}
