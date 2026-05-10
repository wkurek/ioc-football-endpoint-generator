import type { Venue } from '@/domain/types';
import { TranslatableError } from '@/domain/errors';

/**
 * `name` ← `SCH.venue.description`. `city` ← last segment of
 * `SCH.location.longDescription` after `, ` (e.g. "Marseille Stadium, Marseille"
 * → "Marseille"). Throws if either field is missing — schema surprise should
 * surface as a per-match error.
 */
export function buildVenue(input: {
  venueDescription: string | undefined;
  locationLongDescription: string | undefined;
}): Venue {
  if (!input.venueDescription) {
    throw new TranslatableError('errors.venue.missingDescription');
  }
  if (!input.locationLongDescription) {
    throw new TranslatableError('errors.venue.missingLongDescription');
  }
  return {
    name: input.venueDescription,
    city: parseCityFromLocation(input.locationLongDescription),
  };
}

export function parseCityFromLocation(longDescription: string): string {
  const idx = longDescription.lastIndexOf(', ');
  if (idx === -1) return longDescription.trim();
  return longDescription.slice(idx + 2).trim();
}
