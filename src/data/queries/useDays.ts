import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import { fetchDays } from '@/data/api/stacy-client';
import type { DaysByDiscipline } from '@/data/api/schemas';
import { queryKeys } from './queryKeys';

type Options = Omit<
  UseQueryOptions<DaysByDiscipline, Error, string[]>,
  'queryKey' | 'queryFn' | 'select'
>;

/**
 * Returns the list of football match dates (`YYYY-MM-DD`) sorted ASC.
 * Filters HTEAM only is not needed here — DaysByDiscipline already gives match-bearing dates.
 */
export function useDays(options?: Options) {
  return useQuery({
    queryKey: queryKeys.days(),
    queryFn: fetchDays,
    select: (data) => data.competition_schedule.map((d) => d.date).sort(),
    ...options,
  });
}
