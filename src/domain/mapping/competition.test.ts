import { describe, expect, it } from 'vitest';
import { buildCompetition, buildRound } from './competition';

describe('buildCompetition', () => {
  it('uses constants for name and season (CONVENTIONS.md #3, #4)', () => {
    const c = buildCompetition("Men's Group A", 1);
    expect(c.name).toBe('Olympic Games');
    expect(c.season).toBe('Paris 2024');
  });

  it('produces a `round` derived from longDescription + match number', () => {
    expect(buildCompetition("Men's Group A", 1).round).toBe("Men's Group A — Match 1");
    expect(buildCompetition("Women's Quarter-final", 3).round).toBe("Women's Quarter-final 3");
  });
});

describe('buildRound', () => {
  it('appends "— Match N" for group stage', () => {
    expect(buildRound("Men's Group A", 1)).toBe("Men's Group A — Match 1");
    expect(buildRound("Men's Group D", 6)).toBe("Men's Group D — Match 6");
    expect(buildRound("Women's Group C", 3)).toBe("Women's Group C — Match 3");
  });

  it('appends " N" for Quarter-final', () => {
    expect(buildRound("Men's Quarter-final", 1)).toBe("Men's Quarter-final 1");
    expect(buildRound("Women's Quarter-final", 4)).toBe("Women's Quarter-final 4");
  });

  it('appends " N" for Semi-final', () => {
    expect(buildRound("Men's Semi-final", 1)).toBe("Men's Semi-final 1");
    expect(buildRound("Women's Semi-final", 2)).toBe("Women's Semi-final 2");
  });

  it('keeps medal matches without numeric suffix (only one of each)', () => {
    expect(buildRound("Men's Bronze Medal Match", 1)).toBe("Men's Bronze Medal Match");
    expect(buildRound("Men's Gold Medal Match", 1)).toBe("Men's Gold Medal Match");
    expect(buildRound("Women's Bronze Medal Match", 1)).toBe("Women's Bronze Medal Match");
    expect(buildRound("Women's Gold Medal Match", 1)).toBe("Women's Gold Medal Match");
  });

  it('falls through unknown phases as-is (defensive)', () => {
    expect(buildRound("Men's Some Future Phase", 1)).toBe("Men's Some Future Phase");
  });
});
