/**
 * Output interfaces — strictly mirror `example.json` shape (CONVENTIONS.md #1).
 * Each `Match` instance is a single endpoint response.
 */

import type { GoalType, Position, MatchStatus } from './enums';

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
  /** Always `MatchStatus.FULL_TIME` ("FT") today (CONVENTIONS.md #12). */
  status: MatchStatus;
  teams: Teams;
  score: Score;
  scorers: Scorer[];
  lineups: Lineups;
}
