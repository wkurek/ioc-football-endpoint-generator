import { useQueries, useQuery, type UseQueryOptions } from '@tanstack/react-query';
import { fetchRes } from '@/data/api/stacy-client';
import type { ResByRscH2H } from '@/data/api/schemas';
import { queryKeys } from './queryKeys';

type SingleOptions = Omit<
  UseQueryOptions<ResByRscH2H, Error, ResByRscH2H>,
  'queryKey' | 'queryFn'
>;

/** Single match RES fetch (used on detail page when navigating directly). */
export function useResForCode(eventUnitCode: string, options?: SingleOptions) {
  return useQuery({
    queryKey: queryKeys.resByCode(eventUnitCode),
    queryFn: () => fetchRes(eventUnitCode),
    enabled: !!eventUnitCode,
    ...options,
  });
}

/** Bulk RES fetch — fires N parallel queries (TanStack handles dedup + cache). */
export function useResForCodes(eventUnitCodes: readonly string[]) {
  const results = useQueries({
    queries: eventUnitCodes.map((code) => ({
      queryKey: queryKeys.resByCode(code),
      queryFn: () => fetchRes(code),
    })),
  });

  const isLoading = results.some((r) => r.isLoading);
  const loadedCount = results.filter((r) => r.isSuccess).length;
  const totalCount = results.length;
  const errors = results.map((r) => r.error).filter((e): e is Error => e instanceof Error);

  // Pair each code with its result so callers can build matches in a stable order.
  const byCode: Record<string, ResByRscH2H | undefined> = {};
  eventUnitCodes.forEach((code, i) => {
    byCode[code] = results[i]?.data;
  });

  return {
    byCode,
    isLoading,
    loadedCount,
    totalCount,
    errors,
  };
}
