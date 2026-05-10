import { describe, expect, it } from 'vitest';
import { mapStatus } from './status';

describe('mapStatus', () => {
  it('maps FINISHED to "FT"', () => {
    expect(mapStatus('FINISHED')).toBe('FT');
  });

  it.each(['SCHEDULED', 'LIVE', 'POSTPONED', 'CANCELLED', 'RESCHEDULED', 'ABANDONED', ''])(
    'throws on unsupported code %j',
    (code) => {
      expect(() => mapStatus(code)).toThrow(/unsupported status\.code/);
    },
  );

  it('throws on unknown codes (defensive)', () => {
    expect(() => mapStatus('SOME_NEW_CODE')).toThrow(/unsupported status\.code/);
  });
});
