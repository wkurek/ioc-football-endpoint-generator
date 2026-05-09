/**
 * Format a person's name as `givenName + " " + familyName` (CONVENTIONS.md #19).
 *
 * Some athletes in OG2024 data (e.g. several Egyptian, US Women's roster entries)
 * have `givenName: undefined` and the full name pre-composed in `familyName`
 * (e.g. `familyName: "Ibrahim Adel"`). For those, we fall back to `familyName`
 * alone — output stays in the same Title Case "Given Family" convention.
 *
 * Preserves hyphens, apostrophes, and accents.
 *
 * Examples:
 *   { given: "Jean-Philippe", family: "Mateta" }   → "Jean-Philippe Mateta"
 *   { given: "Sabrina",       family: "D'Angelo" } → "Sabrina D'Angelo"
 *   { given: "Vinícius",      family: "Júnior"   } → "Vinícius Júnior"
 *   { given: undefined,       family: "Ibrahim Adel" } → "Ibrahim Adel"
 */
export function formatPersonName(input: {
  givenName?: string | undefined;
  familyName: string;
}): string {
  const given = (input.givenName ?? '').trim();
  const family = input.familyName.trim();
  if (!given) return family;
  return `${given} ${family}`;
}
