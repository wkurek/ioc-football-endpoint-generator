import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { SortingState } from '@tanstack/react-table';
import { usePipeline, type PipelineState } from '@/ui/hooks/usePipeline';
import { useSelection } from '@/ui/hooks/useSelection';
import { EMPTY_FILTER, type FilterCriteria } from '@/domain/filter/matchFilters';

interface MatchesStateContextValue {
  /** True once the user has clicked "Load matches" — pipeline keeps running across navigation. */
  enabled: boolean;
  setEnabled: (value: boolean) => void;
  pipeline: PipelineState;
  selection: ReturnType<typeof useSelection>;
  criteria: FilterCriteria;
  setCriteria: (next: FilterCriteria) => void;
  sorting: SortingState;
  setSorting: (next: SortingState) => void;
}

const MatchesStateContext = createContext<MatchesStateContextValue | null>(null);

interface MatchesStateProviderProps {
  children: ReactNode;
}

/**
 * Holds the matches feature's UI state at the Router level so that navigating
 * between `/`, `/match/:code`, and `/compare` doesn't unmount the pipeline,
 * filters, sort, or selection.
 *
 * TanStack Query already caches the underlying SCH/RES responses; this provider
 * keeps the *consumer* state alive too — without it, returning to `/` shows the
 * "Load matches" empty state again because `usePipeline({ enabled: false })`
 * gates the queries.
 */
export function MatchesStateProvider({ children }: MatchesStateProviderProps) {
  const [enabled, setEnabled] = useState(false);
  const pipeline = usePipeline({ enabled });
  const selection = useSelection();
  const [criteria, setCriteria] = useState<FilterCriteria>(EMPTY_FILTER);
  // Default order from `compareMatchSummary` (CONVENTIONS.md #15): `kickoff ASC`,
  // tie-broken on `eventUnit.code`. We surface the primary key as the sort indicator;
  // the pipeline pre-sorts the data, and TanStack's stable sort preserves the
  // tiebreaker ordering for matches sharing the same kickoff.
  const [sorting, setSorting] = useState<SortingState>([{ id: 'kickoff', desc: false }]);

  const value = useMemo<MatchesStateContextValue>(
    () => ({
      enabled,
      setEnabled,
      pipeline,
      selection,
      criteria,
      setCriteria,
      sorting,
      setSorting,
    }),
    [enabled, pipeline, selection, criteria, sorting],
  );

  return <MatchesStateContext.Provider value={value}>{children}</MatchesStateContext.Provider>;
}

export function useMatchesState(): MatchesStateContextValue {
  const ctx = useContext(MatchesStateContext);
  if (!ctx) {
    throw new Error('useMatchesState must be used within <MatchesStateProvider>');
  }
  return ctx;
}
