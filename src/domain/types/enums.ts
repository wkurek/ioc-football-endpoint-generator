/**
 * Domain enums — output vocabulary (values that appear in `Match`,
 * `MatchSummary`, `FilterCriteria`, etc.). Distinct from API source codes,
 * which live in `@/data/api/codes`.
 *
 * Style: `as const` objects with a derived string-literal union type so
 * `Position.GK` and `'GK'` are interchangeable, and TypeScript narrows
 * exhaustively.
 */

export const GoalType = {
  OPEN_PLAY: 'open_play',
  HEADER: 'header',
  PENALTY: 'penalty',
} as const;
export type GoalType = (typeof GoalType)[keyof typeof GoalType];

/**
 * 4-value subset of example.json's 11 position codes (CONVENTIONS.md #26).
 * Source schema (`PositionSchema`) accepts the full enum for forward-compat.
 */
export const Position = {
  GK: 'GK',
  CB: 'CB',
  CM: 'CM',
  FW: 'FW',
} as const;
export type Position = (typeof Position)[keyof typeof Position];

/**
 * Team side designation. Values match `eue_value` for `HOME_AWAY` (uppercase),
 * NOT the lowercase `home`/`away` keys used in the output JSON shape.
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

/** Tag used by jsonLines for structural braces / mixed-source blocks. */
export const NEUTRAL = 'neutral';
export type LineSource = FieldSource | typeof NEUTRAL;

/** Output `Match.status`. Today only `FT` is emitted (CONVENTIONS.md #12). */
export const MatchStatus = {
  FULL_TIME: 'FT',
} as const;
export type MatchStatus = (typeof MatchStatus)[keyof typeof MatchStatus];
