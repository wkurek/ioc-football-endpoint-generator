/**
 * Output types — strictly mirror example.json shape (CONVENTIONS.md #1).
 * Each Match instance is a single endpoint response.
 */

export type GoalType = 'open_play' | 'header' | 'penalty';

export type Position = 'GK' | 'CB' | 'CM' | 'FW';
// example.json uses 11 granular position codes; we emit only 4 (CONVENTIONS.md #26).

export interface Player {
  name: string;
  number: number;
  position: Position;
}

export interface TeamLineup {
  team: string;
  formation: string;
  coach: string;
  startingXI: Player[];
  bench: Player[];
}

export interface Lineups {
  home: TeamLineup;
  away: TeamLineup;
}

export interface Scorer {
  team: string;
  player: string;
  minute: number;
  /** Optional — omit when there's no assist (CONVENTIONS.md #29). */
  assist?: string;
  type: GoalType;
}

export interface HalfTimeScore {
  home: number;
  away: number;
}

export interface Score {
  home: number;
  away: number;
  halfTime: HalfTimeScore;
}

export interface Teams {
  home: string;
  away: string;
}

export interface Venue {
  name: string;
  city: string;
}

export interface Competition {
  name: string;
  season: string;
  round: string;
}

export interface Match {
  competition: Competition;
  venue: Venue;
  /** ISO 8601 with timezone, preserved as-is (CONVENTIONS.md #17). */
  kickoff: string;
  /** "FT" for FINISHED; raw passthrough otherwise (CONVENTIONS.md #12). */
  status: string;
  teams: Teams;
  score: Score;
  scorers: Scorer[];
  lineups: Lineups;
}

/** Source-of-truth tag for per-field annotation in the Generated view (CONVENTIONS.md #37). */
export type FieldSource = 'sch' | 'res' | 'const';
