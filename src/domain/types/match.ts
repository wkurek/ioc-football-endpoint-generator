/** Output interfaces — strictly mirror `example.json` shape. */

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
  /** Omit the key when no assist (do not emit `null`). */
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
  /** ISO 8601 with timezone, preserved as-is from SCH. */
  kickoff: string;
  status: MatchStatus;
  teams: Teams;
  score: Score;
  scorers: Scorer[];
  lineups: Lineups;
}
