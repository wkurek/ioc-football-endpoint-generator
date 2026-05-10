/**
 * Extracts `YYYY-MM-DD` and `HH:mm` directly from the ISO 8601 kickoff string
 * without going through `Date` — preserves the original Paris timezone
 * regardless of the browser's local zone (CONVENTIONS.md #17).
 */
export interface KickoffParts {
  date: string; // "2024-07-24"
  time: string; // "15:00"
}

const ISO_DATE_PREFIX_RE = /^(\d{4}-\d{2}-\d{2})/;
const ISO_TIME_PREFIX_RE = /T(\d{2}:\d{2})/;

export function splitKickoff(iso: string): KickoffParts {
  const dateMatch = ISO_DATE_PREFIX_RE.exec(iso);
  const timeMatch = ISO_TIME_PREFIX_RE.exec(iso);
  return {
    date: dateMatch?.[1] ?? '',
    time: timeMatch?.[1] ?? '',
  };
}
