import { GoalType, type Scorer } from '@/domain/types';
import type { ResByRscH2H, ResPbpaActionT, ResTeamItemT } from '@/data/api/schemas';
import { PbpaAction, PbpatRole, PeriodCode } from '@/data/api/codes';
import { formatPersonName } from './name';

/**
 * Build the `scorers` array (CONVENTIONS.md #7, #9, #11, #29).
 *
 * Algorithm:
 *   1. Iterate over `playByPlay[].actions[]`.
 *   2. Skip PSO actions entirely (CONVENTIONS.md #7).
 *   3. `pbpa_Action === "OG"` (own goal) takes a dedicated branch — the player
 *      is on his OWN team in `competitors[]` (no `SCR` role) but the goal is
 *      credited to the opposing team. See `buildOwnGoalScorer` below.
 *   4. Otherwise look at `competitors[].athletes[]` for `pbpat_role === "SCR"`.
 *      The owning competitor's `pbpc_code` gives the scoring team.
 *   5. Skip actions whose `pbpa_When` doesn't match `^\d+'(?: ?\+\d+)?$` (defensive).
 *   6. Type:
 *      - `pbpa_Action === "PEN"` (and not PSO) → "penalty"
 *      - `OG` and everything else → "open_play"
 *      (header undetectable in source — CONVENTIONS.md #10)
 *   7. Assist: if same competitor's athletes contains `pbpat_role === "ASSIST"`,
 *      include `assist`; otherwise omit the key (CONVENTIONS.md #29). OG never
 *      carries an assist.
 *   8. Sort by `minute` ASC, tie-break by source `pbpa_order` (chronological).
 */
export function buildScorers(res: ResByRscH2H): Scorer[] {
  // Build team helpers: pbpc_code → name + bib → player name.
  const teamsMeta = buildTeamMeta(res.results.items);

  type Intermediate = Scorer & { _order: number };
  const collected: Intermediate[] = [];

  for (const block of res.results.playByPlay ?? []) {
    if (block.subcode === PeriodCode.PENALTY_SHOOTOUT) continue;
    for (const action of block.actions) {
      if (action.pbpa_period === PeriodCode.PENALTY_SHOOTOUT) continue;

      const competitors = action.competitors ?? [];

      // Own goal (CONVENTIONS.md #11): API marks it with pbpa_Action === "OG",
      // lists the player on his OWN team in competitors[] (no "SCR" role) and
      // moves the score to the opposing side. Per FIFA convention we credit the
      // goal to the beneficiary (opposing) team while keeping the player's name.
      if (action.pbpa_Action === PbpaAction.OWN_GOAL) {
        const ogScorer = buildOwnGoalScorer(action, teamsMeta);
        if (ogScorer) collected.push(ogScorer);
        continue;
      }

      // Find the scoring competitor (the one whose athletes[] has SCR).
      const scoringComp = competitors.find((c) =>
        (c.athletes ?? []).some((a) => a.pbpat_role === PbpatRole.SCORER),
      );
      if (!scoringComp) continue;

      const scoringAthletes = scoringComp.athletes ?? [];
      // OG2024 always carries ≤1 SCR and ≤1 ASSIST per action, and the output
      // schema (`Scorer.player` / `Scorer.assist`) only has room for one of
      // each. Throw on multi-cardinality so schema drift surfaces as a
      // per-match error (CONVENTIONS.md §11c, §27) instead of silently dropping
      // the extras via `.find()` first-wins.
      const scorerEntries = scoringAthletes.filter((a) => a.pbpat_role === PbpatRole.SCORER);
      if (scorerEntries.length > 1) {
        throw new Error(
          `buildScorers: action ${action.pbpa_id} has ${scorerEntries.length} SCR athletes (expected ≤1) — schema drift?`,
        );
      }
      const scorerEntry = scorerEntries[0];
      if (!scorerEntry) continue;

      const assistEntries = scoringAthletes.filter((a) => a.pbpat_role === PbpatRole.ASSIST);
      if (assistEntries.length > 1) {
        throw new Error(
          `buildScorers: action ${action.pbpa_id} has ${assistEntries.length} ASSIST athletes (expected ≤1) — schema drift?`,
        );
      }
      const assistEntry = assistEntries[0];

      const minute = parseMinute(action.pbpa_When);
      if (minute === null) continue; // skip if minute can't be parsed

      const team = teamsMeta.byTeamCode[scoringComp.pbpc_code];
      if (!team) {
        throw new Error(
          `buildScorers: unknown pbpc_code "${scoringComp.pbpc_code}" — not present in items[]`,
        );
      }
      const scorerName = team.bibToName[scorerEntry.pbpat_bib];
      if (!scorerName) {
        throw new Error(
          `buildScorers: scorer bib "${scorerEntry.pbpat_bib}" not in team "${team.name}" roster`,
        );
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
 * Maps an `OG` (own goal) action to a scorer entry. The API attaches the
 * player to his OWN team in `competitors[]` (without an `SCR` role), while the
 * goal counts for the opposing side (visible in `pbpa_ScoreH/A`). Per FIFA
 * convention we keep the player's name and credit the goal to the opposing
 * team. Returns `null` when the action is unattributable (no athlete recorded
 * or unparseable minute) so the caller can skip it.
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
    throw new Error(
      `buildScorers: unknown OG pbpc_code "${ownComp.pbpc_code}" — not present in items[]`,
    );
  }
  const scorerName = ownTeam.bibToName[ownAthlete.pbpat_bib];
  if (!scorerName) {
    throw new Error(
      `buildScorers: OG scorer bib "${ownAthlete.pbpat_bib}" not in team "${ownTeam.name}" roster`,
    );
  }

  const beneficiaryEntry = Object.entries(teamsMeta.byTeamCode).find(
    ([code]) => code !== ownComp.pbpc_code,
  );
  if (!beneficiaryEntry) {
    throw new Error(
      `buildScorers: cannot find opposing team for OG by ${scorerName} (only one team in items[])`,
    );
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
 * Parses `pbpa_When` to integer minute (CONVENTIONS.md #9 — base minute, ignore `+X`).
 *
 *   "11'"        → 11
 *   "45' +2"     → 45
 *   "90' +3"     → 90
 *   "99'"        → 99   (ET-H1 — continuous numbering)
 *   "120' +1"    → 120
 *   undefined    → null (e.g. PSO; caller skips)
 *   "ET-HT"      → null (defensive)
 */
export function parseMinute(when: string | undefined): number | null {
  if (!when) return null;
  const m = /^\s*(\d+)'/.exec(when);
  if (!m || !m[1]) return null;
  const n = parseInt(m[1], 10);
  return Number.isNaN(n) ? null : n;
}

/**
 * Maps `pbpa_Action` to our enum (CONVENTIONS.md #11).
 *   "PEN"  (and not in PSO context) → "penalty"
 *   anything else                    → "open_play"
 */
export function classifyGoalType(pbpaAction: string): GoalType {
  if (pbpaAction === PbpaAction.PENALTY) return GoalType.PENALTY;
  return GoalType.OPEN_PLAY;
}
