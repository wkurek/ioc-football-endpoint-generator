/**
 * `givenName + " " + familyName`. Some Atos entries have `givenName: undefined`
 * and the full name pre-composed in `familyName` (e.g. "Ibrahim Adel") — for
 * those, fall back to `familyName` alone. Hyphens, apostrophes, and accents
 * pass through untouched.
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
