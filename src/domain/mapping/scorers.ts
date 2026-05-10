import { GoalType, type Scorer } from '@/domain/types';
import type { ResByRscH2H, ResPbpaActionT, ResTeamItemT } from '@/data/api/schemas';
import { PbpaAction, PbpatRole, PeriodCode } from '@/data/api/codes';
import { formatPersonName } from './name';
import { TranslatableError } from '@/domain/errors';

/**
 * Walks `playByPlay[].actions[]`, skipping PSO entries, and emits one
 * `Scorer` per goal. Sorted by `(minute, pbpa_order)` ASC.
 *
 * Own goals (`pbpa_Action === "OG"`) take a dedicated branch — the player
 * is on his OWN team in `competitors[]` (no `SCR` role), but per FIFA
 * convention the goal is credited to the opposing team. See
 * `buildOwnGoalScorer`.
 *
 * Header detection isn't possible — Atos doesn't carry body-part data. So
 * `type` only ever emits `"penalty"` or `"open_play"`.
 */
export function buildScorers(res: ResByRscH2H): Scorer[] {
  const teamsMeta = buildTeamMeta(res.results.items);

  type Intermediate = Scorer & { _order: number };
  const collected: Intermediate[] = [];

  for (const block of res.results.playByPlay ?? []) {
    if (block.subcode === PeriodCode.PENALTY_SHOOTOUT) continue;
    for (const action of block.actions) {
      if (action.pbpa_period === PeriodCode.PENALTY_SHOOTOUT) continue;

      const competitors = action.competitors ?? [];

      if (action.pbpa_Action === PbpaAction.OWN_GOAL) {
        const ogScorer = buildOwnGoalScorer(action, teamsMeta);
        if (ogScorer) collected.push(ogScorer);
        continue;
      }

      const scoringComp = competitors.find((c) =>
        (c.athletes ?? []).some((a) => a.pbpat_role === PbpatRole.SCORER),
      );
      if (!scoringComp) continue;

      const scoringAthletes = scoringComp.athletes ?? [];
      // Defensive: schema allows only one player + one assist per action.
      // Filter + length-check (instead of `.find()`) so multi-cardinality
      // surfaces as a per-match error rather than silent first-wins drop.
      const scorerEntries = scoringAthletes.filter((a) => a.pbpat_role === PbpatRole.SCORER);
      if (scorerEntries.length > 1) {
        throw new TranslatableError('errors.scorers.tooManyScorers', {
          actionId: action.pbpa_id,
          count: scorerEntries.length,
        });
      }
      const scorerEntry = scorerEntries[0];
      if (!scorerEntry) continue;

      const assistEntries = scoringAthletes.filter((a) => a.pbpat_role === PbpatRole.ASSIST);
      if (assistEntries.length > 1) {
        throw new TranslatableError('errors.scorers.tooManyAssists', {
          actionId: action.pbpa_id,
          count: assistEntries.length,
        });
      }
      const assistEntry = assistEntries[0];

      const minute = parseMinute(action.pbpa_When);
      if (minute === null) continue;

      const team = teamsMeta.byTeamCode[scoringComp.pbpc_code];
      if (!team) {
        throw new TranslatableError('errors.scorers.unknownTeamCode', {
          teamCode: scoringComp.pbpc_code,
        });
      }
      const scorerName = team.bibToName[scorerEntry.pbpat_bib];
      if (!scorerName) {
        throw new TranslatableError('errors.scorers.scorerNotInRoster', {
          bib: scorerEntry.pbpat_bib,
          team: team.name,
        });
      }

      const goal: Intermediate = {
        team: team.name,
        player: scorerName,
        minute,
        type: classifyGoalType(action.pbpa_Action),
        _order: action.pbpa_order,
      };
      if (assistEntry) {
        const assistName = team.bibToName[assistEntry.pbpat_bib];
        if (assistName) goal.assist = assistName;
      }
      collected.push(goal);
    }
  }

  return collected
    .sort((a, b) => a.minute - b.minute || a._order - b._order)
    .map(({ _order, ...rest }) => rest);
}

interface TeamMeta {
  name: string;
  bibToName: Record<string, string>;
}
interface TeamsMeta {
  byTeamCode: Record<string, TeamMeta>;
}

function buildTeamMeta(items: ResTeamItemT[]): TeamsMeta {
  const byTeamCode: Record<string, TeamMeta> = {};
  for (const item of items) {
    const bibToName: Record<string, string> = {};
    for (const a of item.teamAthletes) {
      bibToName[a.bib] = formatPersonName({
        givenName: a.athlete.givenName,
        familyName: a.athlete.familyName,
      });
    }
    byTeamCode[item.teamCode] = {
      name: item.participant.name,
      bibToName,
    };
  }
  return { byTeamCode };
}

/**
 * The API attaches an own-goal scorer to his OWN team in `competitors[]`
 * without an `SCR` role; the goal counts for the opposing side. Returns
 * `null` when the action is unattributable (no athlete recorded or
 * unparseable minute) so the caller can skip it.
 */
function buildOwnGoalScorer(
  action: ResPbpaActionT,
  teamsMeta: TeamsMeta,
): (Scorer & { _order: number }) | null {
  const ownComp = action.competitors?.[0];
  if (!ownComp) return null;
  const ownAthlete = ownComp.athletes?.[0];
  if (!ownAthlete) return null;

  const ownTeam = teamsMeta.byTeamCode[ownComp.pbpc_code];
  if (!ownTeam) {
    throw new TranslatableError('errors.scorers.ownGoalUnknownTeam', {
      teamCode: ownComp.pbpc_code,
    });
  }
  const scorerName = ownTeam.bibToName[ownAthlete.pbpat_bib];
  if (!scorerName) {
    throw new TranslatableError('errors.scorers.ownGoalNotInRoster', {
      bib: ownAthlete.pbpat_bib,
      team: ownTeam.name,
    });
  }

  const beneficiaryEntry = Object.entries(teamsMeta.byTeamCode).find(
    ([code]) => code !== ownComp.pbpc_code,
  );
  if (!beneficiaryEntry) {
    throw new TranslatableError('errors.scorers.ownGoalNoOpponent', { scorer: scorerName });
  }

  const minute = parseMinute(action.pbpa_When);
  if (minute === null) return null;

  return {
    team: beneficiaryEntry[1].name,
    player: scorerName,
    minute,
    type: GoalType.OPEN_PLAY,
    _order: action.pbpa_order,
  };
}

/**
 * Take the base minute, drop the `+X` stoppage suffix. Atos uses continuous
 * numbering (ET-H1 starts at 91), so `"99'"` is minute 99 of the match,
 * `"90' +3"` collapses to 90. Returns `null` for undefined input (PSO) or
 * non-numeric forms — caller skips.
 */
export function parseMinute(when: string | undefined): number | null {
  if (!when) return null;
  const m = /^\s*(\d+)'/.exec(when);
  if (!m || !m[1]) return null;
  const n = parseInt(m[1], 10);
  return Number.isNaN(n) ? null : n;
}

export function classifyGoalType(pbpaAction: string): GoalType {
  if (pbpaAction === PbpaAction.PENALTY) return GoalType.PENALTY;
  return GoalType.OPEN_PLAY;
}
