/**
 * Convert between calendar-day strings (`YYYY-MM-DD`) and JS `Date` objects
 * **without** going through ISO parsing — that would interpret the value as
 * UTC midnight and shift the day in non-UTC timezones. Instead we construct
 * Date with explicit local components, which is exactly what react-day-picker
 * expects.
 */
export function parseYmd(s: string | undefined): Date | undefined {
  if (!s) return undefined;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) return undefined;
  const year = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);
  return new Date(year, month - 1, day);
}

export function formatYmd(d: Date | undefined): string | undefined {
  if (!d) return undefined;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
