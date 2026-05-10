/**
 * Single: `<eventUnit.code>.json` — the code is the unique ID and stays
 * intact in filenames on every common OS (the embedded hyphens are legal).
 * Bulk: `og2024-fbl-all.json` / `og2024-fbl-selected-<count>.json`.
 */
export function filenameSingle(eventUnitCode: string): string {
  return `${eventUnitCode}.json`;
}

export function filenameBulkAll(): string {
  return 'og2024-fbl-all.json';
}

export function filenameBulkSelected(count: number): string {
  return `og2024-fbl-selected-${count}.json`;
}
