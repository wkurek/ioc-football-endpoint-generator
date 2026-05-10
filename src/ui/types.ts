/**
 * UI-layer enums (theme, toast, banner, pipeline phase). Domain enums live
 * in `@/domain/types`; API source codes in `@/data/api/codes`.
 */

export const Theme = {
  LIGHT: 'light',
  DARK: 'dark',
  SYSTEM: 'system',
} as const;
export type Theme = (typeof Theme)[keyof typeof Theme];

/** `Theme` minus `SYSTEM` — the value actually applied to the DOM. */
export type ResolvedTheme = typeof Theme.LIGHT | typeof Theme.DARK;

export const ToastKind = {
  SUCCESS: 'success',
  ERROR: 'error',
  INFO: 'info',
} as const;
export type ToastKind = (typeof ToastKind)[keyof typeof ToastKind];

export const BannerKind = {
  INFO: 'info',
  SUCCESS: 'success',
  WARN: 'warn',
  ERROR: 'error',
} as const;
export type BannerKind = (typeof BannerKind)[keyof typeof BannerKind];

export const PipelinePhase = {
  IDLE: 'idle',
  DAYS: 'days',
  H2H: 'h2h',
  RES: 'res',
  READY: 'ready',
} as const;
export type PipelinePhase = (typeof PipelinePhase)[keyof typeof PipelinePhase];
