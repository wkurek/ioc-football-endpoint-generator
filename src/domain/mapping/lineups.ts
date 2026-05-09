import type { Lineups, Player, TeamLineup } from '@/domain/types';
import type { ResTeamAthleteT, ResTeamCoachT, ResTeamItemT } from '@/data/api/schemas';
import { formatPersonName } from './name';
import { mapPosition } from './position';

/**
 * Build the `lineups` block (CONVENTIONS.md #19, #24, #25, #26, #30).
 *
 * Source: RES.results.items[]. Each team item has:
 *   - eventUnitEntries[HOME_AWAY] → identifies home vs away
 *   - eventUnitEntries[FORMATION] → e.g. "4-2-3-1"
 *   - teamCoaches[] → head coach (function.functionCode === "COACH")
 *   - teamAthletes[] → 18 players, with eventUnitEntries[STARTER=Y] flag for the 11
 *
 * Sorting: by `startSortOrder` ASC. Starters → startingXI (filtered by STARTER=Y),
 * rest → bench. Both lists naturally come out in GK→DF→MF→FW order.
 */
export function buildLineups(items: ResTeamItemT[]): Lineups {
  const homeItem = findTeamByHomeAway(items, 'HOME');
  const awayItem = findTeamByHomeAway(items, 'AWAY');
  return {
    home: buildTeamLineup(homeItem),
    away: buildTeamLineup(awayItem),
  };
}

function findTeamByHomeAway(items: ResTeamItemT[], target: 'HOME' | 'AWAY'): ResTeamItemT {
  const found = items.find((it) =>
    it.eventUnitEntries.some((e) => e.eue_code === 'HOME_AWAY' && e.eue_value === target),
  );
  if (!found) {
    throw new Error(`buildLineups: no team item with HOME_AWAY=${target}`);
  }
  return found;
}

export function buildTeamLineup(item: ResTeamItemT): TeamLineup {
  const formation = item.eventUnitEntries.find((e) => e.eue_code === 'FORMATION')?.eue_value;
  if (!formation) {
    throw new Error(`buildTeamLineup: missing FORMATION for team ${item.participant.name}`);
  }
  const coachName = pickHeadCoachName(item.teamCoaches);
  if (!coachName) {
    throw new Error(`buildTeamLineup: no head coach for team ${item.participant.name}`);
  }
  const athletesSorted = [...item.teamAthletes].sort(
    (a, b) => a.startSortOrder - b.startSortOrder,
  );
  const startingXI = athletesSorted.filter(isStarter).map(toPlayer);
  const bench = athletesSorted.filter((a) => !isStarter(a)).map(toPlayer);

  return {
    team: item.participant.name,
    formation,
    coach: coachName,
    startingXI,
    bench,
  };
}

/**
 * Function codes that designate a "head coach" for the purpose of the
 * `lineups.*.coach` field, in precedence order:
 *
 *   - `COACH`    — regular head coach (most matches)
 *   - `SI_COA`   — stand-in coach (e.g. Canada at Paris 2024 W: Andy Spence
 *                  deputizing for the suspended Bev Priestman)
 *   - `INT_COA`  — interim coach (defensive — not yet observed in OG2024)
 *
 * Falls back to the first non-assistant coach if no precedence match is found.
 */
const HEAD_COACH_FUNCTION_CODES = ['COACH', 'SI_COA', 'INT_COA'] as const;
const ASSISTANT_COACH_FUNCTION_CODES = new Set(['AST_COA']);

function pickHeadCoachName(coaches: ResTeamCoachT[]): string | undefined {
  for (const fc of HEAD_COACH_FUNCTION_CODES) {
    const match = coaches.find((c) => c.function.functionCode === fc);
    if (match) return formatPersonName(match.coach);
  }
  // Defensive fallback: any coach that isn't explicitly an assistant.
  const fallback = coaches.find(
    (c) => !ASSISTANT_COACH_FUNCTION_CODES.has(c.function.functionCode),
  );
  return fallback ? formatPersonName(fallback.coach) : undefined;
}

export function isStarter(athlete: ResTeamAthleteT): boolean {
  return (
    athlete.eventUnitEntries?.some(
      (e) => e.eue_code === 'STARTER' && e.eue_value === 'Y',
    ) ?? false
  );
}

export function toPlayer(athlete: ResTeamAthleteT): Player {
  const number = parseInt(athlete.bib, 10);
  if (Number.isNaN(number)) {
    throw new Error(`toPlayer: bib "${athlete.bib}" is not a valid integer`);
  }
  const broadPos = athlete.athlete.registeredEvents
    ?.[0]?.eventEntries.find((e) => e.ee_code === 'POSITION')?.ee_value;
  if (!broadPos) {
    throw new Error(
      `toPlayer: missing POSITION for athlete ${athlete.athlete.name} (bib ${athlete.bib})`,
    );
  }
  return {
    name: formatPersonName({
      givenName: athlete.athlete.givenName,
      familyName: athlete.athlete.familyName,
    }),
    number,
    position: mapPosition(broadPos),
  };
}
