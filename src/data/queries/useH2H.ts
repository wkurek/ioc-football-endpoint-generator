import { useQueries } from '@tanstack/react-query';
import { fetchH2HOnDate } from '@/data/api/stacy-client';
import type { SchSchedule } from '@/data/api/schemas';
import { queryKeys } from './queryKeys';

/**
 * Fetches H2H for each of the given dates in parallel; returns the merged
 * list of HTEAM-only schedules (medal ceremonies are filtered out — they have
 * `eventUnit.type === "NONE"`).
 */
export function useH2HForDates(dates: readonly string[]) {
  const results = useQueries({
    queries: dates.map((date) => ({
      queryKey: queryKeys.h2hByDate(date),
      queryFn: () => fetchH2HOnDate(date),
    })),
  });

  const isLoading = results.some((r) => r.isLoading);
  const errors: Array<{ date: string; error: Error }> = [];
  const failedDates: string[] = [];
  results.forEach((r, i) => {
    if (r.isError && r.error instanceof Error) {
      const date = dates[i];
      if (date !== undefined) {
        errors.push({ date, error: r.error });
        failedDates.push(date);
      }
    }
  });
  const isError = errors.length > 0;
  const loadedCount = results.filter((r) => r.isSuccess).length;
  const totalCount = results.length;

  const matches: SchSchedule[] = results.flatMap((r) =>
    (r.data?.schedules ?? []).filter((s) => s.eventUnit.type === 'HTEAM'),
  );

  return {
    matches,
    isLoading,
    isError,
    errors,
    failedDates,
    loadedCount,
    totalCount,
  };
}
