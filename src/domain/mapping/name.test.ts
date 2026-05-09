import { describe, expect, it } from 'vitest';
import { formatPersonName } from './name';

describe('formatPersonName', () => {
  it('joins given + family name with a space', () => {
    expect(formatPersonName({ givenName: 'Javier', familyName: 'Mascherano' })).toBe(
      'Javier Mascherano',
    );
  });

  it('preserves hyphens in given name', () => {
    expect(formatPersonName({ givenName: 'Jean-Philippe', familyName: 'Mateta' })).toBe(
      'Jean-Philippe Mateta',
    );
    expect(formatPersonName({ givenName: 'Ann-Katrin', familyName: 'Berger' })).toBe(
      'Ann-Katrin Berger',
    );
  });

  it("preserves apostrophes (e.g. D'Angelo)", () => {
    expect(formatPersonName({ givenName: 'Sabrina', familyName: "D'Angelo" })).toBe(
      "Sabrina D'Angelo",
    );
  });

  it('preserves accented characters (Vinícius, En-Nesyri, Júnior)', () => {
    expect(formatPersonName({ givenName: 'Vinícius', familyName: 'Júnior' })).toBe(
      'Vinícius Júnior',
    );
    expect(formatPersonName({ givenName: 'Youssef', familyName: 'En-Nesyri' })).toBe(
      'Youssef En-Nesyri',
    );
  });

  it('trims leading/trailing whitespace', () => {
    expect(formatPersonName({ givenName: '  Lucas  ', familyName: 'Beltran' })).toMatch(
      /Lucas/,
    );
  });
});
