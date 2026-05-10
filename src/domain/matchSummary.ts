import { Phase, Side, Tournament, type MatchStatus } from '@/domain/types';
import { EueCode } from '@/data/api/codes';
import type { SchSchedule, ResByRscH2H } from '@/data/api/schemas';
import { parseCityFromLocation } from '@/domain/mapping/venue';
import { mapStatus } from '@/domain/mapping/status';
import { buildScore } from '@/domain/mapping/score';
import { buildRound } from '@/domain/mapping/competition';
import { parseUnitNum } from '@/domain/mapping/round';
import { TranslatableError } from '@/domain/errors';

// Re-exported for backwards-compat with existing imports of `@/domain/matchSummary`.
export { Phase, Tournament } from '@/domain/types';

/**
 * Light-weight per-match record used to drive the matches table and the
 * filter UI. Built from SCH alone (pre-RES) and refined when RES becomes
 * available (score becomes defined).
 */
export interface MatchSummary {
  /** `eventUnit.code` — globally unique match ID. */
  eventUnitCode: string;
  /** ISO 8601 kickoff with timezone (preserved as-is, CONVENTIONS.md #17). */
  kickoff: string;
  /** YYYY-MM-DD slice of kickoff (for filtering / grouping). */
  date: string;
  tournament: Tournament;
  phase: Phase;
  /** Group letter for `phase === Phase.GROUP` (A/B/C/D), undefined otherwise. */
  groupLetter?: string;
  /** Human-readable round label (`competition.round`). */
  round: string;
  /** Home team name (resolved from SCH.start[] sortOrder=1 pre-RES, RES HOME_AWAY post-RES). */
  homeTeam: string;
  /** Away team name (resolved analogously). */
  awayTeam: string;
  /** "1-2" when RES loaded; `undefined` while we only have SCH. */
  scoreText?: string;
  venue: string;
  city: string;
  status: MatchStatus;
}

interface BuildMatchSummaryInput {
  sch: SchSchedule;
  /** When provided, refines homeTeam/awayTeam by `HOME_AWAY` and adds `scoreText`. */
  res?: ResByRscH2H;
}

export function buildMatchSummary({ sch, res }: BuildMatchSummaryInput): MatchSummary {
  const tournament = detectTournament(sch.eventUnit.code);
  const phase = detectPhase(sch.eventUnit.code);
  const groupLetter = phase === Phase.GROUP ? detectGroupLetter(sch.eventUnit.code) : undefined;
  const round = buildRound(sch.eventUnit.longDescription, parseUnitNum(sch));

  const { homeTeam, awayTeam } = pickTeams(sch, res);
  const scoreText = res ? formatScoreText(res) : undefined;

  return {
    eventUnitCode: sch.eventUnit.code,
    kickoff: sch.startDate,
    date: sch.startDate.slice(0, 10),
    tournament,
    phase,
    ...(groupLetter ? { groupLetter } : {}),
    round,
    homeTeam,
    awayTeam,
    ...(scoreText ? { scoreText } : {}),
    venue: sch.venue?.description ?? '',
    city: sch.location?.longDescription ? parseCityFromLocation(sch.location.longDescription) : '',
    status: mapStatus(sch.status.code),
  };
}

/** Tournament detection patterns keyed off `eventUnit.code` prefix. */
const TOURNAMENT_PREFIX: Readonly<Record<Tournament, string>> = {
  [Tournament.MEN]: 'FBLM',
  [Tournament.WOMEN]: 'FBLW',
};

export function detectTournament(eventUnitCode: string): Tournament {
  for (const [tournament, prefix] of Object.entries(TOURNAMENT_PREFIX) as [Tournament, string][]) {
    if (eventUnitCode.startsWith(prefix)) return tournament;
  }
  throw new TranslatableError('errors.matchSummary.detectTournament', { code: eventUnitCode });
}

/**
 * Markers embedded in `eventUnit.code` that reveal the phase.
 * Order matters: GOLD/BRONZE share the `FNL-` prefix and must be checked before
 * generic finals; GROUP uses a regex because the group letter varies.
 */
const EVENT_CODE_MARKER = {
  GOLD_FINAL: 'FNL-000100--',
  BRONZE_FINAL: 'FNL-000200--',
  SEMI_FINAL: 'SFNL',
  QUARTER_FINAL: 'QFNL',
  GROUP: /GP[A-Z]-/,
} as const;

const PHASE_PATTERNS: ReadonlyArray<readonly [Phase, string | RegExp]> = [
  [Phase.GOLD, EVENT_CODE_MARKER.GOLD_FINAL],
  [Phase.BRONZE, EVENT_CODE_MARKER.BRONZE_FINAL],
  [Phase.SEMI_FINAL, EVENT_CODE_MARKER.SEMI_FINAL],
  [Phase.QUARTER_FINAL, EVENT_CODE_MARKER.QUARTER_FINAL],
  [Phase.GROUP, EVENT_CODE_MARKER.GROUP],
];

const GROUP_LETTER_RE = /GP([A-Z])-/;

export function detectPhase(eventUnitCode: string): Phase {
  for (const [phase, pattern] of PHASE_PATTERNS) {
    const matches =
      typeof pattern === 'string' ? eventUnitCode.includes(pattern) : pattern.test(eventUnitCode);
    if (matches) return phase;
  }
  throw new TranslatableError('errors.matchSummary.detectPhase', { code: eventUnitCode });
}

export function detectGroupLetter(eventUnitCode: string): string {
  const m = GROUP_LETTER_RE.exec(eventUnitCode);
  if (!m || !m[1]) {
    throw new TranslatableError('errors.matchSummary.detectGroupLetter', { code: eventUnitCode });
  }
  return m[1];
}

function pickTeams(sch: SchSchedule, res?: ResByRscH2H): { homeTeam: string; awayTeam: string } {
  if (res) {
    let home: string | undefined;
    let away: string | undefined;
    for (const item of res.results.items) {
      const ha = item.eventUnitEntries.find((e) => e.eue_code === EueCode.HOME_AWAY)?.eue_value;
      if (ha === Side.HOME) home = item.participant.name;
      else if (ha === Side.AWAY) away = item.participant.name;
    }
    if (home && away) return { homeTeam: home, awayTeam: away };
  }
  // Pre-RES fallback: SCH.start[] sortOrder=1 → first team, sortOrder=2 → second.
  // We don't know home/away yet — use sort order; UI can label as "Team A / Team B"
  // until RES loads.
  const start = sch.start ?? [];
  const sorted = [...start].sort((a, b) => a.sortOrder - b.sortOrder);
  return {
    homeTeam: sorted[0]?.participant.name ?? '',
    awayTeam: sorted[1]?.participant.name ?? '',
  };
}

function formatScoreText(res: ResByRscH2H): string {
  try {
    const score = buildScore(res.results.periods);
    return `${score.home}-${score.away}`;
  } catch {
    return '';
  }
}
