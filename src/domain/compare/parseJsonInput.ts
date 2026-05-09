/**
 * Parses a JSON string and returns either the parsed value (any) or a
 * human-readable error. Used by the Compare page to validate the textarea
 * contents before running the diff.
 */
export type ParseResult =
  | { ok: true; value: unknown }
  | { ok: false; error: string };

export function parseJsonInput(raw: string): ParseResult {
  const trimmed = raw.trim();
  if (!trimmed) return { ok: false, error: 'Empty input' };
  try {
    return { ok: true, value: JSON.parse(trimmed) };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}
