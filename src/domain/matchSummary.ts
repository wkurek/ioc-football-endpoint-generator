import type { SchSchedule, ResByRscH2H } from '@/data/api/schemas';
import { parseCityFromLocation } from '@/domain/mapping/venue';
import { mapStatus } from '@/domain/mapping/status';
import { buildScore } from '@/domain/mapping/score';
import { computeMatchNumberInPhase } from '@/domain/mapping/round';
import { buildRound } from '@/domain/mapping/competition';

export type Tournament = 'men' | 'women';
export type Phase = 'group' | 'qf' | 'sf' | 'bronze' | 'gold';

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
  /** Group letter for `phase === 'group'` (A/B/C/D), undefined otherwise. */
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
  status: string;
}

interface BuildMatchSummaryInput {
  sch: SchSchedule;
  allMatches: readonly SchSchedule[];
  /** When provided, refines homeTeam/awayTeam by `HOME_AWAY` and adds `scoreText`. */
  res?: ResByRscH2H;
}

export function buildMatchSummary({ sch, allMatches, res }: BuildMatchSummaryInput): MatchSummary {
  const tournament = detectTournament(sch.eventUnit.code);
  const phase = detectPhase(sch.eventUnit.code);
  const groupLetter = phase === 'group' ? detectGroupLetter(sch.eventUnit.code) : undefined;
  const matchNumber = computeMatchNumberInPhase(allMatches, sch.eventUnit.code);
  const round = buildRound(sch.eventUnit.longDescription, matchNumber);

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

export function detectTournament(eventUnitCode: string): Tournament {
  // FBLM... = Men's, FBLW... = Women's
  if (eventUnitCode.startsWith('FBLM')) return 'men';
  if (eventUnitCode.startsWith('FBLW')) return 'women';
  throw new Error(`detectTournament: cannot detect tournament from "${eventUnitCode}"`);
}

export function detectPhase(eventUnitCode: string): Phase {
  if (eventUnitCode.includes('FNL-000100--')) return 'gold';
  if (eventUnitCode.includes('FNL-000200--')) return 'bronze';
  if (eventUnitCode.includes('SFNL')) return 'sf';
  if (eventUnitCode.includes('QFNL')) return 'qf';
  if (/GP[A-Z]-/.test(eventUnitCode)) return 'group';
  throw new Error(`detectPhase: cannot detect phase from "${eventUnitCode}"`);
}

export function detectGroupLetter(eventUnitCode: string): string {
  const m = /GP([A-Z])-/.exec(eventUnitCode);
  if (!m || !m[1]) {
    throw new Error(`detectGroupLetter: no group letter in "${eventUnitCode}"`);
  }
  return m[1];
}

function pickTeams(sch: SchSchedule, res?: ResByRscH2H): { homeTeam: string; awayTeam: string } {
  if (res) {
    let home: string | undefined;
    let away: string | undefined;
    for (const item of res.results.items) {
      const ha = item.eventUnitEntries.find((e) => e.eue_code === 'HOME_AWAY')?.eue_value;
      if (ha === 'HOME') home = item.participant.name;
      else if (ha === 'AWAY') away = item.participant.name;
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
