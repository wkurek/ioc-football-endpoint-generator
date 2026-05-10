/**
 * Extracts date/time from the ISO 8601 kickoff string by regex, without going
 * through `Date` — preserves the original Paris kickoff regardless of the
 * browser's local timezone.
 */
export interface KickoffParts {
  date: string;
  time: string;
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
