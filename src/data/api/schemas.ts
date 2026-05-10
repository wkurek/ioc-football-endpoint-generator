import { z } from 'zod';

/**
 * Zod schemas for the Atos OG2024 endpoints. Permissive on optional fields
 * (Atos sometimes omits keys, e.g. `pbpa_When` for PSO actions); required
 * fields are the ones the mappers depend on.
 */

// ─── SCH_DaysByDiscipline ──────────────────────────────────────────────────

export const DaysByDisciplineSchema = z.object({
  competition_schedule: z.array(
    z.object({
      discipline: z.object({ code: z.string(), description: z.string() }),
      date: z.string(),
      eventCount: z.number(),
      medalEventCount: z.number(),
    }),
  ),
});
export type DaysByDiscipline = z.infer<typeof DaysByDisciplineSchema>;

// ─── SCH_ByDisciplineH2H ───────────────────────────────────────────────────

const SchTeamParticipant = z.object({
  code: z.string(),
  name: z.string(),
  shortName: z.string(),
  teamType: z.string(),
  organisation: z.object({
    code: z.string(),
    description: z.string(),
  }),
});

const SchEventUnit = z.object({
  code: z.string(),
  longDescription: z.string(),
  shortDescription: z.string(),
  type: z.string(),
  phase: z.object({
    type: z.string(),
    shortDescription: z.string().optional(),
    event: z.object({ code: z.string(), description: z.string() }).optional(),
  }),
});

const SchPeriodScore = z.object({
  p_code: z.string(),
  home: z.object({ score: z.string() }),
  away: z.object({ score: z.string() }),
});

export const SchScheduleSchema = z.object({
  code: z.string(),
  nocs: z.array(z.string()).optional(),
  startDate: z.string(),
  endDate: z.string(),
  unitNum: z.string().optional(),
  start: z
    .array(
      z.object({
        sortOrder: z.number(),
        teamCode: z.string(),
        participant: SchTeamParticipant,
      }),
    )
    .optional(),
  status: z.object({ code: z.string(), description: z.string() }),
  venue: z
    .object({
      description: z.string(),
      longDescription: z.string(),
    })
    .optional(),
  location: z
    .object({
      description: z.string(),
      longDescription: z.string(),
      shortDescription: z.string(),
    })
    .optional(),
  eventUnit: SchEventUnit,
  result: z
    .object({
      periods: z.array(SchPeriodScore).optional(),
    })
    .optional(),
});
export type SchSchedule = z.infer<typeof SchScheduleSchema>;

export const ByDisciplineH2HSchema = z.object({
  schedules: z.array(SchScheduleSchema),
});
export type ByDisciplineH2H = z.infer<typeof ByDisciplineH2HSchema>;

// ─── RES_ByRSC_H2H ────────────────────────────────────────────────────────

const ResEventUnitEntry = z.object({
  eue_code: z.string(),
  eue_value: z.string(),
  eue_pos: z.string().optional(),
  eue_type: z.string().optional(),
});

const ResEventEntry = z.object({
  ee_code: z.string(),
  ee_value: z.string(),
});

const ResAthlete = z.object({
  code: z.string(),
  name: z.string(),
  givenName: z.string().optional(),
  familyName: z.string(),
  TVName: z.string().optional(),
  registeredEvents: z
    .array(
      z.object({
        code: z.string(),
        eventEntries: z.array(ResEventEntry),
      }),
    )
    .optional(),
});

const ResTeamAthlete = z.object({
  order: z.number(),
  startSortOrder: z.number(),
  bib: z.string(),
  participantCode: z.string(),
  athlete: ResAthlete,
  eventUnitEntries: z.array(ResEventUnitEntry).optional(),
});

const ResTeamCoach = z.object({
  order: z.number(),
  function: z.object({ functionCode: z.string(), description: z.string() }),
  coach: z.object({
    code: z.string(),
    givenName: z.string().optional(),
    familyName: z.string(),
    name: z.string(),
    TVName: z.string().optional(),
  }),
});

const ResTeamItem = z.object({
  itemType: z.literal('T'),
  teamCode: z.string(),
  participant: SchTeamParticipant,
  resultData: z.string().optional(),
  resultWLT: z.string().optional(),
  eventUnitEntries: z.array(ResEventUnitEntry),
  teamAthletes: z.array(ResTeamAthlete),
  teamCoaches: z.array(ResTeamCoach),
});

const ResPbpaAthlete = z.object({
  pbpat_code: z.string(),
  pbpat_order: z.string(),
  pbpat_bib: z.string(),
  pbpat_role: z.string().optional(),
});

const ResPbpaCompetitor = z.object({
  pbpc_code: z.string(),
  pbpc_order: z.number(),
  pbpc_type: z.string(),
  athletes: z.array(ResPbpaAthlete).optional(),
});

const ResPbpaAction = z.object({
  pbpa_id: z.string(),
  pbpa_order: z.number(),
  pbpa_period: z.string(),
  pbpa_Action: z.string(),
  pbpa_When: z.string().optional(),
  pbpa_Result: z.string().optional(),
  pbpa_ScoreH: z.string().optional(),
  pbpa_ScoreA: z.string().optional(),
  pbpa_Comment: z.string().optional(),
  pbpa_Loc: z.string().optional(),
  competitors: z.array(ResPbpaCompetitor).optional(),
});

const ResPbpaBlock = z.object({
  subcode: z.string(),
  actions: z.array(ResPbpaAction),
});

export const ResByRscH2HSchema = z.object({
  positions: z.array(z.object({ code: z.string(), description: z.string() })).optional(),
  results: z.object({
    eventUnitCode: z.string(),
    status: z.object({ code: z.string(), description: z.string() }),
    periods: z.array(SchPeriodScore),
    items: z.array(ResTeamItem),
    playByPlay: z.array(ResPbpaBlock).optional(),
    schedule: z
      .object({
        startDate: z.string(),
        endDate: z.string(),
      })
      .optional(),
  }),
});
export type ResByRscH2H = z.infer<typeof ResByRscH2HSchema>;
export type ResTeamItemT = z.infer<typeof ResTeamItem>;
export type ResTeamAthleteT = z.infer<typeof ResTeamAthlete>;
export type ResTeamCoachT = z.infer<typeof ResTeamCoach>;
export type ResPbpaActionT = z.infer<typeof ResPbpaAction>;
