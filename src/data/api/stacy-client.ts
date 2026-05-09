import { z } from 'zod';
import {
  ByDisciplineH2HSchema,
  DaysByDisciplineSchema,
  ResByRscH2HSchema,
  type ByDisciplineH2H,
  type DaysByDiscipline,
  type ResByRscH2H,
} from './schemas';

const BASE = 'https://stacy.olympics.com/OG2024/data';

/**
 * Lower-level fetch + Zod parse with consistent error semantics.
 * CONVENTIONS.md #45 — we use this CDN's JSON endpoints directly.
 */
async function fetchJson<T>(url: string, schema: z.ZodType<T>): Promise<T> {
  const res = await fetch(url, {
    method: 'GET',
    headers: { Accept: 'application/json' },
    // CORS verified open (CONVENTIONS.md #22, #45). No special mode needed.
  });

  if (!res.ok) {
    throw new StacyApiError(`HTTP ${res.status} ${res.statusText} for ${url}`, res.status, url);
  }

  const json = (await res.json()) as unknown;
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    throw new StacyApiError(
      `Schema validation failed for ${url}: ${parsed.error.issues
        .map((i) => `${i.path.join('.')}: ${i.message}`)
        .join('; ')}`,
      undefined,
      url,
    );
  }
  return parsed.data;
}

export class StacyApiError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
    public readonly url?: string,
  ) {
    super(message);
    this.name = 'StacyApiError';
  }
}

// ─── Endpoint URLs ────────────────────────────────────────────────────────

export function urlForDays(): string {
  return `${BASE}/SCH_DaysByDiscipline~comp=OG2024~disc=FBL~lang=ENG.json`;
}

export function urlForH2HOnDate(date: string): string {
  return `${BASE}/SCH_ByDisciplineH2H~comp=OG2024~disc=FBL~lang=ENG~date=${date}.json`;
}

export function urlForRes(eventUnitCode: string): string {
  return `${BASE}/RES_ByRSC_H2H~comp=OG2024~disc=FBL~rscResult=${eventUnitCode}~lang=ENG.json`;
}

// ─── Public fetchers ──────────────────────────────────────────────────────

export function fetchDays(): Promise<DaysByDiscipline> {
  return fetchJson(urlForDays(), DaysByDisciplineSchema);
}

export function fetchH2HOnDate(date: string): Promise<ByDisciplineH2H> {
  return fetchJson(urlForH2HOnDate(date), ByDisciplineH2HSchema);
}

export function fetchRes(eventUnitCode: string): Promise<ResByRscH2H> {
  return fetchJson(urlForRes(eventUnitCode), ResByRscH2HSchema);
}
