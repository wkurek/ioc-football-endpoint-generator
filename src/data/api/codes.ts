/**
 * Atos OG2024 API vocabulary — string codes that appear in raw API responses.
 * Distinct from our domain enums (in `@/domain/types`). Keys are descriptive
 * (e.g. `STAND_IN_COACH`); values are the wire codes (`'SI_COA'`).
 */

export const EueCode = {
  HOME_AWAY: 'HOME_AWAY',
  FORMATION: 'FORMATION',
  STARTER: 'STARTER',
  POSITION: 'POSITION',
} as const;
export type EueCode = (typeof EueCode)[keyof typeof EueCode];

/** `eue_value` flag value paired with `eue_code === STARTER`. */
export const StarterFlag = {
  YES: 'Y',
} as const;
export type StarterFlag = (typeof StarterFlag)[keyof typeof StarterFlag];

/** `ee_code` values inside `athlete.registeredEvents.eventEntries`. */
export const EeCode = {
  POSITION: 'POSITION',
} as const;
export type EeCode = (typeof EeCode)[keyof typeof EeCode];

/** Coach/staff function codes (precedence order documented in lineups.ts). */
export const FunctionCode = {
  COACH: 'COACH',
  STAND_IN_COACH: 'SI_COA',
  INTERIM_COACH: 'INT_COA',
  ASSISTANT_COACH: 'AST_COA',
} as const;
export type FunctionCode = (typeof FunctionCode)[keyof typeof FunctionCode];

/** play-by-play action codes (`pbpa_Action`). */
export const PbpaAction = {
  OWN_GOAL: 'OG',
  PENALTY: 'PEN',
} as const;
export type PbpaAction = (typeof PbpaAction)[keyof typeof PbpaAction];

/** play-by-play athlete role inside an action's competitor block (`pbpat_role`). */
export const PbpatRole = {
  SCORER: 'SCR',
  ASSIST: 'ASSIST',
} as const;
export type PbpatRole = (typeof PbpatRole)[keyof typeof PbpatRole];

/** Period codes — used by `p_code`, `pbpa_period`, and play-by-play `block.subcode`. */
export const PeriodCode = {
  TOTAL: 'TOT',
  FIRST_HALF: 'H1',
  PENALTY_SHOOTOUT: 'PSO',
} as const;
export type PeriodCode = (typeof PeriodCode)[keyof typeof PeriodCode];

/** API `status.code` values. Distinct from our output `MatchStatus`. */
export const ApiStatusCode = {
  FINISHED: 'FINISHED',
} as const;
export type ApiStatusCode = (typeof ApiStatusCode)[keyof typeof ApiStatusCode];

/** Broad position codes — input to `mapPosition()`. Different from our output `Position`. */
export const BroadPosition = {
  GK: 'GK',
  DF: 'DF',
  MF: 'MF',
  FW: 'FW',
} as const;
export type BroadPosition = (typeof BroadPosition)[keyof typeof BroadPosition];
