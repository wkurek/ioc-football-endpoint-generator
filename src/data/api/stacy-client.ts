import { z } from 'zod';
import {
  ByDisciplineH2HSchema,
  DaysByDisciplineSchema,
  ResByRscH2HSchema,
  type ByDisciplineH2H,
  type DaysByDiscipline,
  type ResByRscH2H,
} from './schemas';
import { TranslatableError, type ErrorParams } from '@/domain/errors';

const STACY_BASE_URL = 'https://stacy.olympics.com/OG2024/data';

/** Fixed query-string segments shared by every Stacy endpoint we hit. */
const STACY_QUERY = {
  COMPETITION: 'OG2024',
  DISCIPLINE: 'FBL',
  LANGUAGE: 'ENG',
} as const;

/** Endpoint stems on the Stacy CDN (CONVENTIONS.md #45). */
const STACY_ENDPOINT = {
  DAYS: 'SCH_DaysByDiscipline',
  H2H: 'SCH_ByDisciplineH2H',
  RES: 'RES_ByRSC_H2H',
} as const;

const ACCEPT_JSON = 'application/json';

/**
 * Lower-level fetch + Zod parse with consistent error semantics.
 * CONVENTIONS.md #45 — we use this CDN's JSON endpoints directly.
 */
async function fetchJson<T>(url: string, schema: z.ZodType<T>): Promise<T> {
  const res = await fetch(url, {
    method: 'GET',
    headers: { Accept: ACCEPT_JSON },
    // CORS verified open (CONVENTIONS.md #22, #45). No special mode needed.
  });

  if (!res.ok) {
    throw new StacyApiError(
      'errors.stacy.http',
      { status: res.status, statusText: res.statusText },
      res.status,
      url,
    );
  }

  // Read as text + parse manually so a 200 with a non-JSON body (e.g. a CDN
  // redirect/404 page returning HTML) surfaces as a precise StacyApiError
  // instead of a raw SyntaxError from `res.json()`.
  const text = await res.text();
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    const preview = text.slice(0, 80).replace(/\s+/g, ' ').trim();
    throw new StacyApiError('errors.stacy.invalidJson', { preview }, res.status, url);
  }

  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    const detail = parsed.error.issues
      .map((i) => `${i.path.join('.')}: ${i.message}`)
      .join('; ');
    throw new StacyApiError('errors.stacy.schema', { detail }, undefined, url);
  }
  return parsed.data;
}

export class StacyApiError extends TranslatableError {
  constructor(
    key: string,
    params: ErrorParams | undefined,
    public readonly status: number | undefined,
    public readonly url: string | undefined,
  ) {
    super(key, params);
    this.name = 'StacyApiError';
  }
}

// ─── Endpoint URLs ────────────────────────────────────────────────────────

const COMMON_QS = `comp=${STACY_QUERY.COMPETITION}~disc=${STACY_QUERY.DISCIPLINE}~lang=${STACY_QUERY.LANGUAGE}`;

export function urlForDays(): string {
  return `${STACY_BASE_URL}/${STACY_ENDPOINT.DAYS}~${COMMON_QS}.json`;
}

export function urlForH2HOnDate(date: string): string {
  return `${STACY_BASE_URL}/${STACY_ENDPOINT.H2H}~${COMMON_QS}~date=${date}.json`;
}

export function urlForRes(eventUnitCode: string): string {
  return `${STACY_BASE_URL}/${STACY_ENDPOINT.RES}~comp=${STACY_QUERY.COMPETITION}~disc=${STACY_QUERY.DISCIPLINE}~rscResult=${eventUnitCode}~lang=${STACY_QUERY.LANGUAGE}.json`;
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
