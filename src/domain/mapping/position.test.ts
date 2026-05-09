import { describe, expect, it } from 'vitest';
import { mapPosition } from './position';

describe('mapPosition', () => {
  it('maps GK identity', () => {
    expect(mapPosition('GK')).toBe('GK');
  });

  it('maps DF to CB (default centre back)', () => {
    expect(mapPosition('DF')).toBe('CB');
  });

  it('maps MF to CM (default centre mid)', () => {
    expect(mapPosition('MF')).toBe('CM');
  });

  it('maps FW identity', () => {
    expect(mapPosition('FW')).toBe('FW');
  });

  it('throws on unknown codes', () => {
    expect(() => mapPosition('XX')).toThrow(/unknown broad position code/);
    expect(() => mapPosition('')).toThrow();
    expect(() => mapPosition('D01')).toThrow();
  });
});
