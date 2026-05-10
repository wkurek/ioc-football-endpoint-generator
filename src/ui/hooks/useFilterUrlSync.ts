import { useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  criteriaToParams,
  paramsToCriteria,
} from '@/domain/filter/filterUrlState';
import type { FilterCriteria } from '@/domain/filter/matchFilters';

/**
 * Two-way sync between matches filter criteria and the URL search params.
 * Mount this only on the matches list route — other routes shouldn't write
 * filter params to their URLs. Subsequent in-memory criteria survive
 * navigation away and back via NavLink (we don't reset to EMPTY when the
 * URL is bare).
 */
export function useFilterUrlSync(
  criteria: FilterCriteria,
  setCriteria: (next: FilterCriteria) => void,
): void {
  const [searchParams, setSearchParams] = useSearchParams();
  const initializedRef = useRef(false);

  // Hydrate from URL once on mount (deep-link case). Subsequent URL writes
  // come from the second effect below.
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    if (searchParams.toString()) {
      const fromUrl = paramsToCriteria(searchParams);
      setCriteria(fromUrl);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reflect criteria changes to the URL (replace, not push — filter changes
  // shouldn't pile up in browser history).
  useEffect(() => {
    if (!initializedRef.current) return;
    const next = criteriaToParams(criteria);
    if (next.toString() !== searchParams.toString()) {
      setSearchParams(next, { replace: true });
    }
  }, [criteria, searchParams, setSearchParams]);
}
