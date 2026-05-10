import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { buildScorers, classifyGoalType, parseMinute } from './scorers';
import { ResByRscH2HSchema } from '@/data/api/schemas';

const RES_ALL = join(process.cwd(), 'test', 'fixtures', 'res-all');
const hasResAll = existsSync(RES_ALL);

function loadRes(file: string) {
  const json = JSON.parse(readFileSync(join(RES_ALL, file), 'utf8'));
  return ResByRscH2HSchema.parse(json);
}

describe('parseMinute', () => {
  it.each([
    ["11'", 11],
    ["45'", 45],
    ["45' +2", 45],
    ["49'", 49],
    ["90'", 90],
    ["90' +3", 90],
    ["99'", 99],
    ["108'", 108],
    ["120' +1", 120],
  ])('parses "%s" → %d', (input, expected) => {
    expect(parseMinute(input)).toBe(expected);
  });

  it('returns null for undefined (PSO actions)', () => {
    expect(parseMinute(undefined)).toBeNull();
  });

  it('returns null for non-numeric markers like "ET-HT"', () => {
    expect(parseMinute('ET-HT')).toBeNull();
  });

  it('handles leading whitespace', () => {
    expect(parseMinute("  45'")).toBe(45);
  });
});

describe('classifyGoalType', () => {
  it('maps PEN to "penalty"', () => {
    expect(classifyGoalType('PEN')).toBe('penalty');
  });

  it('maps SHOT to "open_play"', () => {
    expect(classifyGoalType('SHOT')).toBe('open_play');
  });

  it('maps FRD (free kick goal) to "open_play"', () => {
    expect(classifyGoalType('FRD')).toBe('open_play');
  });

  it('maps unknown actions to "open_play" defensively', () => {
    expect(classifyGoalType('NEW_ACTION_TYPE')).toBe('open_play');
  });
});

describe.skipIf(!hasResAll)('buildScorers — own goals', () => {
  it('credits OG to the opposing team and keeps the player name (Mali 0-1 Israel)', () => {
    // Sole goal of the match is Hamidou Diallo's own goal at 56' — counts for Israel.
    const res = loadRes('FBLMTEAM11------------GPD-000100--.json');
    const scorers = buildScorers(res);

    expect(scorers).toContainEqual({
      team: 'Israel',
      player: 'Hamidou Diallo',
      minute: 56,
      type: 'open_play',
    });
  });

  it('handles two OGs in the same match (Spain vs Brazil — Women SF)', () => {
    // Paredes (Spain) OG 6' → Brazil; Sampaio (Brazil) OG 85' → Spain.
    const res = loadRes('FBLWTEAM11------------SFNL000100--.json');
    const scorers = buildScorers(res);

    expect(scorers).toContainEqual(
      expect.objectContaining({ team: 'Brazil', player: 'Irene Paredes', minute: 6, type: 'open_play' }),
    );
    expect(scorers).toContainEqual(
      expect.objectContaining({ team: 'Spain', player: expect.stringMatching(/Sampaio/), minute: 85, type: 'open_play' }),
    );
  });

  it('OG entries never carry an assist', () => {
    const res = loadRes('FBLMTEAM11------------GPD-000100--.json');
    const og = buildScorers(res).find((s) => s.player === 'Hamidou Diallo');
    expect(og).toBeDefined();
    expect(og).not.toHaveProperty('assist');
  });
});

describe.skipIf(!hasResAll)('buildScorers — defensive cardinality', () => {
  function findGoalCompetitor(res: ReturnType<typeof loadRes>) {
    for (const block of res.results.playByPlay ?? []) {
      for (const action of block.actions) {
        if (action.pbpa_period === 'PSO') continue;
        if (action.pbpa_Action === 'OG') continue;
        const comp = (action.competitors ?? []).find((c) =>
          (c.athletes ?? []).some((a) => a.pbpat_role === 'SCR'),
        );
        if (comp?.athletes) return { action, comp };
      }
    }
    throw new Error('no SCR action in fixture');
  }

  it('throws when a single action carries multiple SCR athletes', () => {
    const res = loadRes('FBLWTEAM11------------SFNL000100--.json');
    const { action, comp } = findGoalCompetitor(res);
    comp.athletes!.push({ pbpat_role: 'SCR', pbpat_bib: 'X', pbpat_code: 'X', pbpat_order: '99' });

    expect(() => buildScorers(res)).toThrow(
      new RegExp(`errors\\.scorers\\.tooManyScorers.*actionId=${action.pbpa_id}`),
    );
  });

  it('throws when a single action carries multiple ASSIST athletes', () => {
    const res = loadRes('FBLWTEAM11------------SFNL000100--.json');
    const { action, comp } = findGoalCompetitor(res);
    comp.athletes!.push({ pbpat_role: 'ASSIST', pbpat_bib: 'X', pbpat_code: 'X', pbpat_order: '99' });

    expect(() => buildScorers(res)).toThrow(
      new RegExp(`errors\\.scorers\\.tooManyAssists.*actionId=${action.pbpa_id}`),
    );
  });
});
