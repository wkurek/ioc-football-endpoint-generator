/**
 * Link builders for in-app navigation. Route patterns themselves
 * (`/match/:eventUnitCode`) live inline in [App.tsx](src/app/App.tsx) — they're
 * declared once and don't benefit from a separate constant.
 */
export const routes = {
  matches: () => '/',
  matchDetail: (eventUnitCode: string) => `/match/${encodeURIComponent(eventUnitCode)}`,
  compare: () => '/compare',
  compareWithMatch: (eventUnitCode: string) =>
    `/compare/${encodeURIComponent(eventUnitCode)}`,
} as const;
