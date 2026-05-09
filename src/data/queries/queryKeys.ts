/**
 * Centralized TanStack Query keys. Hierarchical for invalidation symmetry.
 */
export const queryKeys = {
  all: ['og2024'] as const,
  days: () => [...queryKeys.all, 'days'] as const,
  h2hByDate: (date: string) => [...queryKeys.all, 'h2h', date] as const,
  resByCode: (eventUnitCode: string) => [...queryKeys.all, 'res', eventUnitCode] as const,
};
