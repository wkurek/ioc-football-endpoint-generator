import type { Scorer, GoalType } from '@/domain/types';
import type { ResByRscH2H, ResTeamItemT } from '@/data/api/schemas';
import { formatPersonName } from './name';

/**
 * Build the `scorers` array (CONVENTIONS.md #7, #9, #11, #29).
 *
 * Algorithm:
 *   1. Iterate over `playByPlay[].actions[]`.
 *   2. For each action, look at `competitors[].athletes[]` for `pbpat_role === "SCR"`.
 *      The owning competitor's `pbpc_code` gives the scoring team.
 *   3. Skip PSO actions entirely (CONVENTIONS.md #7).
 *   4. Skip actions whose `pbpa_When` doesn't match `^\d+'(?: ?\+\d+)?$` (defensive).
 *   5. Type:
 *      - `pbpa_Action === "PEN"` (and not PSO) → "penalty"
 *      - everything else → "open_play"
 *      (header undetectable in source — CONVENTIONS.md #10)
 *   6. Assist: if same competitor's athletes contains `pbpat_role === "ASSIST"`,
 *      include `assist`; otherwise omit the key (CONVENTIONS.md #29).
 *   7. Sort by `minute` ASC, tie-break by source `pbpa_order` (chronological).
 */
export function buildScorers(res: ResByRscH2H): Scorer[] {
  // Build team helpers: pbpc_code → name + bib → player name.
  const teamsMeta = buildTeamMeta(res.results.items);

  type Intermediate = Scorer & { _order: number };
  const collected: Intermediate[] = [];

  for (const block of res.results.playByPlay ?? []) {
    if (block.subcode === 'PSO') continue;
    for (const action of block.actions) {
      if (action.pbpa_period === 'PSO') continue;

      // Find the scoring competitor (the one whose athletes[] has SCR).
      const competitors = action.competitors ?? [];
      const scoringComp = competitors.find((c) =>
        (c.athletes ?? []).some((a) => a.pbpat_role === 'SCR'),
      );
      if (!scoringComp) continue;

      const scoringAthletes = scoringComp.athletes ?? [];
      const scorerEntry = scoringAthletes.find((a) => a.pbpat_role === 'SCR');
      const assistEntry = scoringAthletes.find((a) => a.pbpat_role === 'ASSIST');
      if (!scorerEntry) continue;

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
  if (pbpaAction === 'PEN') return 'penalty';
  return 'open_play';
}
