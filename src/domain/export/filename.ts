/**
 * Filename conventions for downloads (CONVENTIONS.md #13).
 *
 * - Single match: `<eventUnit.code>.json` (the code IS the unique ID, ready for QA wiring).
 * - Bulk all:     `og2024-fbl-all.json`
 * - Bulk subset:  `og2024-fbl-selected-<count>.json`
 *
 * `eventUnit.code` from OG2024 contains hyphens (`---...---`) which are
 * legal in filenames on every common OS.
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
