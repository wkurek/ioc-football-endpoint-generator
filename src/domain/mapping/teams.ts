import { Side, type Teams } from '@/domain/types';
import type { ResTeamItemT } from '@/data/api/schemas';
import { EueCode } from '@/data/api/codes';
import { TranslatableError } from '@/domain/errors';

export function buildTeams(items: ResTeamItemT[]): Teams {
  let home: string | undefined;
  let away: string | undefined;
  for (const item of items) {
    const ha = item.eventUnitEntries.find((e) => e.eue_code === EueCode.HOME_AWAY)?.eue_value;
    if (ha === Side.HOME) home = item.participant.name;
    else if (ha === Side.AWAY) away = item.participant.name;
  }
  if (!home) throw new TranslatableError('errors.teams.noHome');
  if (!away) throw new TranslatableError('errors.teams.noAway');
  return { home, away };
}
