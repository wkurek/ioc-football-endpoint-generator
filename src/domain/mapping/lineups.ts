import { Side, type Lineups, type Player, type TeamLineup } from '@/domain/types';
import type { ResTeamAthleteT, ResTeamCoachT, ResTeamItemT } from '@/data/api/schemas';
import {
  EeCode,
  EueCode,
  FunctionCode,
  StarterFlag,
  type FunctionCode as FunctionCodeT,
} from '@/data/api/codes';
import { formatPersonName } from './name';
import { mapPosition } from './position';
import { TranslatableError } from '@/domain/errors';

/**
 * Source: `RES.results.items[]` cross-referenced by `HOME_AWAY`. For each
 * side: formation from `eventUnitEntries[FORMATION]`, coach picked by
 * function-code precedence, players sorted by `startSortOrder` ASC and
 * partitioned by `STARTER=Y` into startingXI/bench (the order naturally
 * comes out GK→DF→MF→FW).
 */
export function buildLineups(items: ResTeamItemT[]): Lineups {
  const homeItem = findTeamByHomeAway(items, Side.HOME);
  const awayItem = findTeamByHomeAway(items, Side.AWAY);
  return {
    home: buildTeamLineup(homeItem),
    away: buildTeamLineup(awayItem),
  };
}

function findTeamByHomeAway(items: ResTeamItemT[], target: Side): ResTeamItemT {
  const found = items.find((it) =>
    it.eventUnitEntries.some((e) => e.eue_code === EueCode.HOME_AWAY && e.eue_value === target),
  );
  if (!found) {
    throw new TranslatableError('errors.lineups.noTeamItem', { target });
  }
  return found;
}

export function buildTeamLineup(item: ResTeamItemT): TeamLineup {
  const formation = item.eventUnitEntries.find((e) => e.eue_code === EueCode.FORMATION)?.eue_value;
  if (!formation) {
    throw new TranslatableError('errors.lineups.missingFormation', { team: item.participant.name });
  }
  const coachName = pickHeadCoachName(item.teamCoaches);
  if (!coachName) {
    throw new TranslatableError('errors.lineups.noHeadCoach', { team: item.participant.name });
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
 * Head coach precedence: regular `COACH` first, then stand-in (Canada W
 * 2024: Spence for the suspended Priestman — covered here), then interim
 * (defensive). Final fallback is any non-assistant coach.
 */
const HEAD_COACH_FUNCTION_CODES: readonly FunctionCodeT[] = [
  FunctionCode.COACH,
  FunctionCode.STAND_IN_COACH,
  FunctionCode.INTERIM_COACH,
];
const ASSISTANT_COACH_FUNCTION_CODES: ReadonlySet<FunctionCodeT> = new Set([
  FunctionCode.ASSISTANT_COACH,
]);

function pickHeadCoachName(coaches: ResTeamCoachT[]): string | undefined {
  for (const fc of HEAD_COACH_FUNCTION_CODES) {
    const match = coaches.find((c) => c.function.functionCode === fc);
    if (match) return formatPersonName(match.coach);
  }
  const fallback = coaches.find(
    (c) => !ASSISTANT_COACH_FUNCTION_CODES.has(c.function.functionCode as FunctionCodeT),
  );
  return fallback ? formatPersonName(fallback.coach) : undefined;
}

export function isStarter(athlete: ResTeamAthleteT): boolean {
  return (
    athlete.eventUnitEntries?.some(
      (e) => e.eue_code === EueCode.STARTER && e.eue_value === StarterFlag.YES,
    ) ?? false
  );
}

export function toPlayer(athlete: ResTeamAthleteT): Player {
  const number = parseInt(athlete.bib, 10);
  if (Number.isNaN(number)) {
    throw new TranslatableError('errors.lineups.invalidBib', { bib: athlete.bib });
  }
  const broadPos = athlete.athlete.registeredEvents
    ?.[0]?.eventEntries.find((e) => e.ee_code === EeCode.POSITION)?.ee_value;
  if (!broadPos) {
    throw new TranslatableError('errors.lineups.missingPosition', {
      name: athlete.athlete.name,
      bib: athlete.bib,
    });
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
