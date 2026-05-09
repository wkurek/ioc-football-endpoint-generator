import { z } from 'zod';

/**
 * Runtime schema for the Match record we emit, locked to the shape of
 * `example.json` (assignment §"Endpoint Response Generation"). Used by tests
 * to guarantee that the generator never drifts from the contract.
 *
 * Notes about value-domain:
 * - `position` includes all 11 codes from example.json (GK, RB, CB, LB, DM,
 *   CM, AM, LW, RW, ST, FW). Our mapper currently emits a subset (CONVENTIONS
 *   #26) — the schema accepts the full enum so no future granular mapping
 *   needs a schema change.
 * - `goalType` includes all three values from example.json (open_play,
 *   header, penalty). The mapper emits only `open_play` / `penalty` today
 *   (CONVENTIONS #1).
 * - `assist` is optional — example.json includes scorers without it.
 */

export const PositionSchema = z.enum([
  'GK',
  'RB',
  'CB',
  'LB',
  'DM',
  'CM',
  'AM',
  'LW',
  'RW',
  'ST',
  'FW',
]);

export const GoalTypeSchema = z.enum(['open_play', 'header', 'penalty']);

export const PlayerSchema = z.object({
  name: z.string().min(1),
  number: z.number().int().nonnegative(),
  position: PositionSchema,
});

export const TeamLineupSchema = z.object({
  team: z.string().min(1),
  formation: z.string().min(1),
  coach: z.string().min(1),
  startingXI: z.array(PlayerSchema),
  bench: z.array(PlayerSchema),
});

export const ScorerSchema = z.object({
  team: z.string().min(1),
  player: z.string().min(1),
  minute: z.number().int().nonnegative(),
  assist: z.string().min(1).optional(),
  type: GoalTypeSchema,
});

export const HalfTimeScoreSchema = z.object({
  home: z.number().int().nonnegative(),
  away: z.number().int().nonnegative(),
});

export const ScoreSchema = z.object({
  home: z.number().int().nonnegative(),
  away: z.number().int().nonnegative(),
  halfTime: HalfTimeScoreSchema,
});

export const TeamsSchema = z.object({
  home: z.string().min(1),
  away: z.string().min(1),
});

export const VenueSchema = z.object({
  name: z.string().min(1),
  city: z.string().min(1),
});

export const CompetitionSchema = z.object({
  name: z.string().min(1),
  season: z.string().min(1),
  round: z.string().min(1),
});

export const MatchSchema = z
  .object({
    competition: CompetitionSchema,
    venue: VenueSchema,
    kickoff: z.string().regex(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}([+-]\d{2}:\d{2}|Z)$/,
      'kickoff must be ISO 8601 with timezone',
    ),
    status: z.string().min(1),
    teams: TeamsSchema,
    score: ScoreSchema,
    scorers: z.array(ScorerSchema),
    lineups: z.object({
      home: TeamLineupSchema,
      away: TeamLineupSchema,
    }),
  })
  .strict();
