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

  // Pair each code with its result so callers can build matches in a stable order.
  const byCode: Record<string, ResByRscH2H | undefined> = {};
  const errorByCode: Record<string, Error | undefined> = {};
  const errors: Array<{ code: string; error: Error }> = [];
  const failedCodes: string[] = [];
  eventUnitCodes.forEach((code, i) => {
    const r = results[i];
    byCode[code] = r?.data;
    if (r?.isError && r.error instanceof Error) {
      errorByCode[code] = r.error;
      errors.push({ code, error: r.error });
      failedCodes.push(code);
    }
  });

  return {
    byCode,
    errorByCode,
    isLoading,
    loadedCount,
    totalCount,
    errors,
    failedCodes,
  };
}
