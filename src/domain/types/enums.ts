/**
 * Domain enums — output vocabulary used in `Match`, `MatchSummary`,
 * `FilterCriteria`. Distinct from API source codes (`@/data/api/codes`).
 */

export const GoalType = {
  OPEN_PLAY: 'open_play',
  HEADER: 'header',
  PENALTY: 'penalty',
} as const;
export type GoalType = (typeof GoalType)[keyof typeof GoalType];

/**
 * Full position vocabulary from `example.json`. The mapper currently emits
 * only `{GK, CB, CM, FW}` — Atos broad codes don't reveal granular roles.
 * Type covers all 11 so a future granular mapper doesn't need a type change
 * and so it stays in sync with `MatchSchema.PositionSchema`.
 */
export const Position = {
  GK: 'GK',
  RB: 'RB',
  CB: 'CB',
  LB: 'LB',
  DM: 'DM',
  CM: 'CM',
  AM: 'AM',
  LW: 'LW',
  RW: 'RW',
  ST: 'ST',
  FW: 'FW',
} as const;
export type Position = (typeof Position)[keyof typeof Position];

/**
 * Team side. Uppercase to match `eue_value` for `HOME_AWAY` from the API —
 * NOT the lowercase `home`/`away` keys used in the output JSON.
 */
export const Side = {
  HOME: 'HOME',
  AWAY: 'AWAY',
} as const;
export type Side = (typeof Side)[keyof typeof Side];

export const Phase = {
  GROUP: 'group',
  QUARTER_FINAL: 'qf',
  SEMI_FINAL: 'sf',
  BRONZE: 'bronze',
  GOLD: 'gold',
} as const;
export type Phase = (typeof Phase)[keyof typeof Phase];

export const Tournament = {
  MEN: 'men',
  WOMEN: 'women',
} as const;
export type Tournament = (typeof Tournament)[keyof typeof Tournament];

/** Source-of-truth tag for per-field annotation in the Generated view. */
export const FieldSource = {
  SCH: 'sch',
  RES: 'res',
  CONST: 'const',
} as const;
export type FieldSource = (typeof FieldSource)[keyof typeof FieldSource];

/** Used by jsonLines for structural braces / mixed-source blocks. */
export const NEUTRAL = 'neutral';
export type LineSource = FieldSource | typeof NEUTRAL;

/** Output `Match.status`. Only `FT` is emitted today. */
export const MatchStatus = {
  FULL_TIME: 'FT',
} as const;
export type MatchStatus = (typeof MatchStatus)[keyof typeof MatchStatus];
