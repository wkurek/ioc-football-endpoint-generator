import { describe, expect, it } from 'vitest';
import { buildVenue, parseCityFromLocation } from './venue';

describe('parseCityFromLocation', () => {
  it.each([
    ['Marseille Stadium, Marseille', 'Marseille'],
    ['Geoffroy-Guichard Stadium, Saint-Etienne', 'Saint-Etienne'],
    ['Parc des Princes, Paris', 'Paris'],
    ['La Beaujoire Stadium, Nantes', 'Nantes'],
    ['Lyon Stadium, Lyon', 'Lyon'],
    ['Nice Stadium, Nice', 'Nice'],
    ['Bordeaux Stadium, Bordeaux', 'Bordeaux'],
  ])('"%s" → "%s"', (input, expected) => {
    expect(parseCityFromLocation(input)).toBe(expected);
  });

  it('returns the whole string when no comma is present', () => {
    expect(parseCityFromLocation('SoloVenue')).toBe('SoloVenue');
  });

  it('handles trailing whitespace', () => {
    expect(parseCityFromLocation('Stadium,  Paris  ')).toBe('Paris');
  });
});

describe('buildVenue', () => {
  it('combines name and parsed city', () => {
    expect(
      buildVenue({
        venueDescription: 'Marseille Stadium',
        locationLongDescription: 'Marseille Stadium, Marseille',
      }),
    ).toEqual({ name: 'Marseille Stadium', city: 'Marseille' });
  });

  it('throws when venue.description is missing', () => {
    expect(() =>
      buildVenue({
        venueDescription: undefined,
        locationLongDescription: 'X, Y',
      }),
    ).toThrow(/errors\.venue\.missingDescription/);
  });

  it('throws when location.longDescription is missing', () => {
    expect(() =>
      buildVenue({
        venueDescription: 'X',
        locationLongDescription: undefined,
      }),
    ).toThrow(/errors\.venue\.missingLongDescription/);
  });
});
