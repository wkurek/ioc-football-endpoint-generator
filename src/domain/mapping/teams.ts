import type { Teams } from '@/domain/types';
import type { ResTeamItemT } from '@/data/api/schemas';

/**
 * Build the `teams` block (CONVENTIONS.md #31).
 *
 * Source: RES.results.items[]. `HOME_AWAY` from each item's eventUnitEntries
 * tells us which is which. Names from `participant.name`.
 */
export function buildTeams(items: ResTeamItemT[]): Teams {
  let home: string | undefined;
  let away: string | undefined;
  for (const item of items) {
    const ha = item.eventUnitEntries.find((e) => e.eue_code === 'HOME_AWAY')?.eue_value;
    if (ha === 'HOME') home = item.participant.name;
    else if (ha === 'AWAY') away = item.participant.name;
  }
  if (!home) throw new Error('buildTeams: no item with HOME_AWAY=HOME');
  if (!away) throw new Error('buildTeams: no item with HOME_AWAY=AWAY');
  return { home, away };
}
