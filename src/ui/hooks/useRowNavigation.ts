import { useCallback, type KeyboardEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { routes } from '@/ui/routes';

/**
 * Keyboard + mouse navigation for "row-as-button" patterns (matches table row,
 * mobile match card). Returns props that turn a generic container into a
 * focusable, screen-reader-friendly pseudo-button which navigates to
 * `/match/:eventUnitCode` on click, Enter, or Space.
 *
 * Children that handle their own click (checkbox, action buttons, links) must
 * `stopPropagation` on their own onClick — this hook intentionally trusts
 * event bubbling.
 */
export function useRowNavigation(eventUnitCode: string) {
  const navigate = useNavigate();

  const onClick = useCallback(() => {
    navigate(routes.matchDetail(eventUnitCode));
  }, [navigate, eventUnitCode]);

  const onKeyDown = useCallback(
    (e: KeyboardEvent<HTMLElement>) => {
      // Only react to direct activations on the row itself, not child controls
      // that bubble up Enter (e.g. native button / link default behavior).
      if (e.target !== e.currentTarget) return;
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        navigate(routes.matchDetail(eventUnitCode));
      }
    },
    [navigate, eventUnitCode],
  );

  return { onClick, onKeyDown, tabIndex: 0, role: 'button' as const };
}
