import { useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  criteriaToParams,
  paramsToCriteria,
} from '@/domain/filter/filterUrlState';
import type { FilterCriteria } from '@/domain/filter/matchFilters';

/**
 * Two-way sync between matches filter criteria and the URL search params.
 *
 * Behavior:
 *   - On mount: if the URL has any filter params, parse them and apply.
 *   - On criteria change: write back to the URL via `replace` so that filter
 *     changes don't bloat browser history.
 *   - On navigation away and back via NavLink (URL params already empty),
 *     the in-memory criteria from the provider context is preserved
 *     (we don't reset to EMPTY when the URL is bare).
 *
 * Use this hook inside a component mounted ONLY on the matches list route
 * (not detail/compare), so other routes don't pollute the URL.
 */
export function useFilterUrlSync(
  criteria: FilterCriteria,
  setCriteria: (next: FilterCriteria) => void,
): void {
  const [searchParams, setSearchParams] = useSearchParams();
  const initializedRef = useRef(false);

  // 1. On mount: hydrate from URL if it has params (deep-link case).
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    if (searchParams.toString()) {
      const fromUrl = paramsToCriteria(searchParams);
      setCriteria(fromUrl);
    }
    // Run once. Subsequent URL changes come from this same hook (point 2)
    // or from external navigation, both already handled.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 2. On criteria change: reflect to URL.
  useEffect(() => {
    if (!initializedRef.current) return;
    const next = criteriaToParams(criteria);
    // Avoid a no-op write that re-renders
    if (next.toString() !== searchParams.toString()) {
      setSearchParams(next, { replace: true });
    }
  }, [criteria, searchParams, setSearchParams]);
}
