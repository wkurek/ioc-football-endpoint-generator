import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { buildMatch } from './buildMatch';
import {
  ByDisciplineH2HSchema,
  ResByRscH2HSchema,
  type SchSchedule,
} from '@/data/api/schemas';

const FIXTURES = join(process.cwd(), 'test', 'fixtures');

function loadAllSchedules(): SchSchedule[] {
  const dir = join(FIXTURES, 'sch');
  const files = readdirSync(dir).filter((f) => f.endsWith('.json'));
  const all: SchSchedule[] = [];
  for (const f of files) {
    const json = JSON.parse(readFileSync(join(dir, f), 'utf8'));
    const parsed = ByDisciplineH2HSchema.parse(json);
    for (const s of parsed.schedules) {
      if (s.eventUnit.type === 'HTEAM') all.push(s);
    }
  }
  return all;
}

function loadRes(eventUnitCode: string) {
  const filename = `${eventUnitCode}.json`;
  const json = JSON.parse(readFileSync(join(FIXTURES, 'res', filename), 'utf8'));
  return ResByRscH2HSchema.parse(json);
}

describe('buildMatch (integration with fixtures)', () => {
  const allMatches = loadAllSchedules();

  it('produces 58 unique HTEAM matches across the tournament', () => {
    expect(allMatches.length).toBe(58);
    const codes = new Set(allMatches.map((m) => m.eventUnit.code));
    expect(codes.size).toBe(58);
  });

  it('builds ARG 1-2 MAR (Men\'s Group B — Match 3) end-to-end', () => {
    const code = 'FBLMTEAM11------------GPB-000100--';
    const sch = allMatches.find((m) => m.eventUnit.code === code)!;
    const res = loadRes(code);

    const match = buildMatch({ sch, res });

    expect(match.competition).toEqual({
      name: 'Olympic Games',
      season: 'Paris 2024',
      // unitNum=3 from the API — same numbering as the official page (CONVENTIONS §5).
      round: "Men's Group B — Match 3",
    });
    expect(match.kickoff).toBe('2024-07-24T15:00:00+02:00');
    expect(match.status).toBe('FT');
    expect(match.venue).toEqual({
      name: 'Geoffroy-Guichard Stadium',
      city: 'Saint-Etienne',
    });
    expect(match.teams).toEqual({ home: 'Argentina', away: 'Morocco' });
    expect(match.score).toEqual({
      home: 1,
      away: 2,
      halfTime: { home: 0, away: 1 },
    });

    // 3 goals in this match (1 ARG, 2 MAR)
    expect(match.scorers.length).toBe(3);
    // Sorted chronologically
    const minutes = match.scorers.map((s) => s.minute);
    expect([...minutes].sort((a, b) => a - b)).toEqual(minutes);

    // All goals attribute to Argentina or Morocco
    for (const g of match.scorers) {
      expect(['Argentina', 'Morocco']).toContain(g.team);
      expect(['open_play', 'penalty']).toContain(g.type);
    }

    // Lineups: 11+7 each
    expect(match.lineups.home.team).toBe('Argentina');
    expect(match.lineups.home.formation).toBe('4-4-2');
    expect(match.lineups.home.coach).toBe('Javier Mascherano');
    expect(match.lineups.home.startingXI).toHaveLength(11);
    expect(match.lineups.home.bench).toHaveLength(7);
    expect(match.lineups.away.team).toBe('Morocco');
    expect(match.lineups.away.startingXI).toHaveLength(11);
    expect(match.lineups.away.bench).toHaveLength(7);

    // Mapper currently emits only GK/CB/CM/FW (subset of the 11-value vocab —
    // CONVENTIONS.md §3). The wider Position type accepts all 11.
    const allPositions = [
      ...match.lineups.home.startingXI,
      ...match.lineups.home.bench,
      ...match.lineups.away.startingXI,
      ...match.lineups.away.bench,
    ].map((p) => p.position);
    for (const p of allPositions) {
      expect(['GK', 'CB', 'CM', 'FW']).toContain(p);
    }
  });

  it('builds Men\'s Gold final FRA 3-5 ESP with extra-time goals', () => {
    const code = 'FBLMTEAM11------------FNL-000100--';
    const sch = allMatches.find((m) => m.eventUnit.code === code)!;
    const res = loadRes(code);

    const match = buildMatch({ sch, res });

    expect(match.competition.round).toBe("Men's Gold Medal Match");
    // Spain led 1-3 at halftime (Lopez, Lopez, Baena vs Millot). 3-3 after 90, 3-5 in ET.
    expect(match.score).toEqual({
      home: 3,
      away: 5,
      halfTime: { home: 1, away: 3 },
    });
    expect(match.teams).toEqual({ home: 'France', away: 'Spain' });
    // 8 goals total in this final
    expect(match.scorers.length).toBe(8);
    // At least one goal in extra time (minute >= 91)
    const hasETGoal = match.scorers.some((s) => s.minute >= 91);
    expect(hasETGoal).toBe(true);
    // At least one penalty
    expect(match.scorers.some((s) => s.type === 'penalty')).toBe(true);
  });

  it('builds Men\'s QF EGY-PAR (1-1, PSO won by Egypt) without PSO scorers', () => {
    const code = 'FBLMTEAM11------------QFNL000200--';
    const sch = allMatches.find((m) => m.eventUnit.code === code)!;
    const res = loadRes(code);

    const match = buildMatch({ sch, res });

    // unitNum=27 in the source API. The Men's tournament uses a cumulative counter
    // 1-32: group stage 1-24, QF 25-28, SF 29-30, Bronze 31, Gold 32.
    expect(match.competition.round).toBe("Men's Quarter-final 27");
    // Score after regulation+ET (without PSO) — CONVENTIONS.md #8
    expect(match.score.home).toBe(1);
    expect(match.score.away).toBe(1);
    // PSO scorers excluded — should be exactly 2 goals (1-1 in regulation/ET)
    expect(match.scorers.length).toBe(2);
    // No undefined/null minutes (PSO would have those)
    for (const s of match.scorers) {
      expect(typeof s.minute).toBe('number');
      expect(Number.isFinite(s.minute)).toBe(true);
    }
  });

  it('builds Men\'s Bronze EGY-MAR (0-6) — different round naming', () => {
    const code = 'FBLMTEAM11------------FNL-000200--';
    const sch = allMatches.find((m) => m.eventUnit.code === code)!;
    const res = loadRes(code);

    const match = buildMatch({ sch, res });

    expect(match.competition.round).toBe("Men's Bronze Medal Match");
    expect(match.score.home + match.score.away).toBe(6);
    expect(match.scorers.length).toBe(6);
  });

  it('builds Women\'s Gold final BRA 0-1 USA', () => {
    const code = 'FBLWTEAM11------------FNL-000100--';
    const sch = allMatches.find((m) => m.eventUnit.code === code)!;
    const res = loadRes(code);

    const match = buildMatch({ sch, res });

    expect(match.competition.round).toBe("Women's Gold Medal Match");
    expect(match.teams.home).toBe('Brazil');
    expect(match.teams.away).toBe('United States of America');
    expect(match.score).toEqual({ home: 0, away: 1, halfTime: { home: 0, away: 0 } });
    expect(match.scorers.length).toBe(1);
    expect(match.scorers[0]?.team).toBe('United States of America');
  });

  it('builds Men\'s SF FRA-EGY (3-1 in ET) — extra-time goals counted', () => {
    const code = 'FBLMTEAM11------------SFNL000100--';
    const sch = allMatches.find((m) => m.eventUnit.code === code)!;
    const res = loadRes(code);

    const match = buildMatch({ sch, res });

    // unitNum=29. SF slots 29 + 30 in the cumulative Men's tournament counter.
    expect(match.competition.round).toBe("Men's Semi-final 29");
    expect(match.score).toEqual({ home: 3, away: 1, halfTime: { home: 0, away: 0 } });
    expect(match.scorers.length).toBe(4);
  });
});
