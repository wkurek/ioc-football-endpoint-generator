import { describe, expect, it } from 'vitest';
import { detectGroupLetter, detectPhase, detectTournament } from './matchSummary';

describe('detectTournament', () => {
  it.each([
    ['FBLMTEAM11------------GPA-000100--', 'men'],
    ['FBLMTEAM11------------FNL-000100--', 'men'],
    ['FBLWTEAM11------------QFNL000200--', 'women'],
    ['FBLWTEAM11------------FNL-000200--', 'women'],
  ] as const)('"%s" → "%s"', (code, expected) => {
    expect(detectTournament(code)).toBe(expected);
  });

  it('throws on unrecognized code', () => {
    expect(() => detectTournament('XYZ')).toThrow();
  });
});

describe('detectPhase', () => {
  it.each([
    ['FBLMTEAM11------------GPA-000100--', 'group'],
    ['FBLMTEAM11------------GPD-000600--', 'group'],
    ['FBLWTEAM11------------GPC-000400--', 'group'],
    ['FBLMTEAM11------------QFNL000100--', 'qf'],
    ['FBLWTEAM11------------QFNL000400--', 'qf'],
    ['FBLMTEAM11------------SFNL000100--', 'sf'],
    ['FBLWTEAM11------------SFNL000200--', 'sf'],
    ['FBLMTEAM11------------FNL-000100--', 'gold'],
    ['FBLWTEAM11------------FNL-000100--', 'gold'],
    ['FBLMTEAM11------------FNL-000200--', 'bronze'],
    ['FBLWTEAM11------------FNL-000200--', 'bronze'],
  ] as const)('"%s" → "%s"', (code, expected) => {
    expect(detectPhase(code)).toBe(expected);
  });

  it('throws on unrecognized code', () => {
    expect(() => detectPhase('FBLMSOMETHING')).toThrow();
  });
});

describe('detectGroupLetter', () => {
  it.each([
    ['FBLMTEAM11------------GPA-000100--', 'A'],
    ['FBLMTEAM11------------GPB-000200--', 'B'],
    ['FBLMTEAM11------------GPC-000300--', 'C'],
    ['FBLMTEAM11------------GPD-000400--', 'D'],
    ['FBLWTEAM11------------GPA-000500--', 'A'],
  ])('"%s" → "%s"', (code, expected) => {
    expect(detectGroupLetter(code)).toBe(expected);
  });

  it('throws on knockout codes', () => {
    expect(() => detectGroupLetter('FBLMTEAM11------------QFNL000100--')).toThrow();
  });
});
