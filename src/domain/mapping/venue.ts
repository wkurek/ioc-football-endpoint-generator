import type { Venue } from '@/domain/types';
import { TranslatableError } from '@/domain/errors';

/**
 * Build the `venue` block (CONVENTIONS.md #18, #31).
 *
 * Source-of-truth: SCH (#31). RES has the same data but SCH wins for pre-match fields.
 *
 * - `name` ← `SCH.venue.description` (e.g. "Marseille Stadium")
 * - `city` ← parsed from `SCH.location.longDescription` (e.g. "Marseille Stadium, Marseille")
 *           via split on `, ` and taking the last segment.
 *
 * Throws if either field is missing (CONVENTIONS.md #27 — defensive).
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

/**
 * Take the segment after the last `, `.
 * Examples:
 *   "Marseille Stadium, Marseille"               → "Marseille"
 *   "Geoffroy-Guichard Stadium, Saint-Etienne"   → "Saint-Etienne"
 *   "Parc des Princes, Paris"                    → "Paris"
 *   "La Beaujoire Stadium, Nantes"               → "Nantes"
 */
export function parseCityFromLocation(longDescription: string): string {
  const idx = longDescription.lastIndexOf(', ');
  if (idx === -1) return longDescription.trim();
  return longDescription.slice(idx + 2).trim();
}
