/**
 * Extracts `YYYY-MM-DD` and `HH:mm` directly from the ISO 8601 kickoff string
 * without going through `Date` — preserves the original Paris timezone
 * regardless of the browser's local zone (CONVENTIONS.md #17).
 */
export interface KickoffParts {
  date: string; // "2024-07-24"
  time: string; // "15:00"
}

export function splitKickoff(iso: string): KickoffParts {
  const dateMatch = /^(\d{4}-\d{2}-\d{2})/.exec(iso);
  const timeMatch = /T(\d{2}:\d{2})/.exec(iso);
  return {
    date: dateMatch?.[1] ?? '',
    time: timeMatch?.[1] ?? '',
  };
}
