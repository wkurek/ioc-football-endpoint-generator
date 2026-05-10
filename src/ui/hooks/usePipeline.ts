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

export interface MatchEntry {
  /** eventUnit.code */
  code: string;
  summary: MatchSummary;
  /** undefined until RES has loaded for this match */
  match?: Match;
  /** populated when buildMatch threw for this code (CONVENTIONS.md #27) */
  buildError?: Error;
}

export interface PipelineState {
  phase: 'idle' | 'days' | 'h2h' | 'res' | 'ready';
  /** Sorted list of matches (CONVENTIONS.md #15). */
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
  h2hError?: Error;
  matchErrors: Array<{ code: string; error: Error }>;
  /**
   * Matches whose `buildMatchSummary` threw (e.g. unsupported `status.code`,
   * unrecognised `eventUnit.code`). These are excluded from `entries`
   * entirely — without a summary there's nothing to render in the table.
   */
  summaryErrors: Array<{ code: string; error: Error }>;
  /**
   * Re-runs the entire SCH→H2H→RES pipeline by invalidating all cached
   * queries. Used by the Retry button on error banners.
   */
  retry: () => void;
}

interface PipelineOptions {
  enabled?: boolean;
}

/**
 * Orchestrates the SCH→H2H→RES fetch pipeline (CONVENTIONS.md #40).
 */
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
        summary = buildMatchSummary({ sch, allMatches: allSchedules, res: resData });
      } catch (e) {
        summaryErrs.push({ code, error: e instanceof Error ? e : new Error(String(e)) });
        continue;
      }
      const entry: MatchEntry = { code, summary };
      if (resData) {
        try {
          entry.match = buildMatch({ sch, res: resData, allMatches: allSchedules });
        } catch (e) {
          entry.buildError = e instanceof Error ? e : new Error(String(e));
        }
      }
      built.push(entry);
    }
    built.sort((a, b) => compareMatchSummary(a.summary, b.summary));
    return { entries: built, summaryErrors: summaryErrs };
  }, [allSchedules, res.byCode]);

  const matchErrors = useMemo(
    () =>
      entries
        .filter((e): e is MatchEntry & { buildError: Error } => e.buildError !== undefined)
        .map((e) => ({ code: e.code, error: e.buildError })),
    [entries],
  );

  let phase: PipelineState['phase'] = 'idle';
  if (enabled) {
    if (daysQuery.isLoading) phase = 'days';
    else if (h2h.isLoading) phase = 'h2h';
    else if (res.isLoading) phase = 'res';
    else if (allSchedules.length > 0) phase = 'ready';
  }

  const retry = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: queryKeys.all });
  }, [queryClient]);

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
    h2hError: h2h.errors[0],
    matchErrors,
    summaryErrors,
    retry,
  };
}
