/**
 * UI timing constants. Centralized so we can tune them in one place
 * (e.g. accessibility audit may bump the tooltip delay).
 */

/** Delay before a Radix tooltip appears on hover (ms). */
export const TOOLTIP_DELAY_MS = 150;

/** How long a toast notification stays on screen (ms). */
export const TOAST_DURATION_MS = 3_000;

/**
 * Defer object-URL revocation so the browser has time to start the
 * download before the URL becomes invalid (ms).
 */
export const OBJECT_URL_REVOKE_DELAY_MS = 1_000;
