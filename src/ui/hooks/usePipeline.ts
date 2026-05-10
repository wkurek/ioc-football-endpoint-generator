import { useCallback, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useDays } from '@/data/queries/useDays';
import { useH2HForDates } from '@/data/queries/useH2H';
import { useResForCodes } from '@/data/queries/useRes';
import { queryKeys } from '@/data/queries/queryKeys';
import { buildMatch } from '@/domain/mapping/buildMatch';
import { buildMatchSummary, type MatchSummary } from '@/domain/matchSummary';
import { compareMatchSummary } from '@/domain/sort/sortKey';
import type { Match } from '@/domain/types';
import type { SchSchedule } from '@/data/api/schemas';
import { PipelinePhase } from '@/ui/types';

export { PipelinePhase } from '@/ui/types';

export interface MatchEntry {
  /** eventUnit.code */
  code: string;
  summary: MatchSummary;
  /** Undefined until RES has loaded for this match. */
  match?: Match;
  /** Populated when buildMatch threw for this code. */
  buildError?: Error;
  /** Populated when the RES network request for this code failed. */
  resError?: Error;
}

export interface PipelineState {
  phase: PipelinePhase;
  /** Sorted list of matches. */
  entries: MatchEntry[];
  /**
   * Tournament match dates from `SCH_DaysByDiscipline` (sorted ASC, YYYY-MM-DD).
   * Available as soon as the first request resolves, before H2H/RES — used by the
   * date-range filter to derive its outer bounds and disabled days from API data.
   */
  dates: string[];
  daysLoaded: number;
  daysTotal: number;
  h2hLoaded: number;
  h2hTotal: number;
  resLoaded: number;
  resTotal: number;
  daysError?: Error;
  /** Per-date H2H fetch failures. Empty if every date succeeded. */
  h2hErrors: Array<{ date: string; error: Error }>;
  /** Per-code RES fetch failures. Empty if every match RES succeeded. */
  resErrors: Array<{ code: string; error: Error }>;
  matchErrors: Array<{ code: string; error: Error }>;
  /**
   * Matches whose `buildMatchSummary` threw (e.g. unsupported `status.code`,
   * unrecognised `eventUnit.code`). These are excluded from `entries`
   * entirely — without a summary there's nothing to render in the table.
   */
  summaryErrors: Array<{ code: string; error: Error }>;
  /**
   * Re-fetches only the queries that errored (days + failed H2H dates +
   * failed RES codes). Successful queries stay in cache. Used by the
   * Retry button on error/warning banners.
   */
  retry: () => void;
  /**
   * Re-fetches RES for a single match. Used by the Retry button on the
   * detail page when a specific match's RES request failed.
   */
  retryMatch: (eventUnitCode: string) => void;
}

interface PipelineOptions {
  enabled?: boolean;
}

/** Orchestrates the SCH-Days → H2H → RES fetch pipeline. */
export function usePipeline(options: PipelineOptions = {}): PipelineState {
  const enabled = options.enabled ?? false;
  const queryClient = useQueryClient();

  const daysQuery = useDays({ enabled });
  const dates: readonly string[] = daysQuery.data ?? [];

  const h2h = useH2HForDates(dates);
  const allSchedules: SchSchedule[] = h2h.matches;

  const codes: string[] = useMemo(
    () => allSchedules.map((s) => s.eventUnit.code),
    [allSchedules],
  );
  const res = useResForCodes(codes);

  const { entries, summaryErrors } = useMemo<{
    entries: MatchEntry[];
    summaryErrors: Array<{ code: string; error: Error }>;
  }>(() => {
    if (allSchedules.length === 0) return { entries: [], summaryErrors: [] };
    const built: MatchEntry[] = [];
    const summaryErrs: Array<{ code: string; error: Error }> = [];
    for (const sch of allSchedules) {
      const code = sch.eventUnit.code;
      const resData = res.byCode[code];
      let summary: MatchSummary;
      try {
        summary = buildMatchSummary({ sch, res: resData });
      } catch (e) {
        summaryErrs.push({ code, error: e instanceof Error ? e : new Error(String(e)) });
        continue;
      }
      const entry: MatchEntry = { code, summary };
      if (resData) {
        try {
          entry.match = buildMatch({ sch, res: resData });
        } catch (e) {
          entry.buildError = e instanceof Error ? e : new Error(String(e));
        }
      } else {
        const resErr = res.errorByCode[code];
        if (resErr) entry.resError = resErr;
      }
      built.push(entry);
    }
    built.sort((a, b) => compareMatchSummary(a.summary, b.summary));
    return { entries: built, summaryErrors: summaryErrs };
  }, [allSchedules, res.byCode, res.errorByCode]);

  const matchErrors = useMemo(
    () =>
      entries
        .filter((e): e is MatchEntry & { buildError: Error } => e.buildError !== undefined)
        .map((e) => ({ code: e.code, error: e.buildError })),
    [entries],
  );

  let phase: PipelinePhase = PipelinePhase.IDLE;
  if (enabled) {
    if (daysQuery.isLoading) phase = PipelinePhase.DAYS;
    else if (h2h.isLoading) phase = PipelinePhase.H2H;
    else if (res.isLoading) phase = PipelinePhase.RES;
    else if (allSchedules.length > 0) phase = PipelinePhase.READY;
  }

  const daysIsError = daysQuery.isError;
  const h2hFailedKey = h2h.failedDates.join(',');
  const resFailedKey = res.failedCodes.join(',');

  const retry = useCallback(() => {
    if (daysIsError) {
      queryClient.invalidateQueries({ queryKey: queryKeys.days() });
    }
    for (const date of h2hFailedKey ? h2hFailedKey.split(',') : []) {
      queryClient.invalidateQueries({ queryKey: queryKeys.h2hByDate(date) });
    }
    for (const code of resFailedKey ? resFailedKey.split(',') : []) {
      queryClient.invalidateQueries({ queryKey: queryKeys.resByCode(code) });
    }
  }, [queryClient, daysIsError, h2hFailedKey, resFailedKey]);

  const retryMatch = useCallback(
    (eventUnitCode: string) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.resByCode(eventUnitCode) });
    },
    [queryClient],
  );

  return {
    phase,
    entries,
    dates: [...dates],
    daysLoaded: daysQuery.isSuccess ? 1 : 0,
    daysTotal: 1,
    h2hLoaded: h2h.loadedCount,
    h2hTotal: h2h.totalCount,
    resLoaded: res.loadedCount,
    resTotal: res.totalCount,
    daysError: daysQuery.error ?? undefined,
    h2hErrors: h2h.errors,
    resErrors: res.errors,
    matchErrors,
    summaryErrors,
    retry,
    retryMatch,
  };
}
