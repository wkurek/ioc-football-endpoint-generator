import { useQueries } from '@tanstack/react-query';
import { fetchH2HOnDate } from '@/data/api/stacy-client';
import type { SchSchedule } from '@/data/api/schemas';
import { queryKeys } from './queryKeys';

/**
 * Fetches H2H for each of the given dates in parallel and returns the merged
 * list of HTEAM-only schedules (CONVENTIONS.md #16).
 */
export function useH2HForDates(dates: readonly string[]) {
  const results = useQueries({
    queries: dates.map((date) => ({
      queryKey: queryKeys.h2hByDate(date),
      queryFn: () => fetchH2HOnDate(date),
    })),
  });

  const isLoading = results.some((r) => r.isLoading);
  const isError = results.some((r) => r.isError);
  const errors = results.map((r) => r.error).filter((e): e is Error => e instanceof Error);
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
    loadedCount,
    totalCount,
  };
}
