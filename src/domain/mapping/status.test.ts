import { describe, expect, it } from 'vitest';
import { mapStatus } from './status';

describe('mapStatus', () => {
  it('maps FINISHED to "FT"', () => {
    expect(mapStatus('FINISHED')).toBe('FT');
  });

  it.each(['SCHEDULED', 'LIVE', 'POSTPONED', 'CANCELLED', 'RESCHEDULED', 'ABANDONED'])(
    'passes through %s as-is',
    (code) => {
      expect(mapStatus(code)).toBe(code);
    },
  );

  it('passes through unknown codes (defensive)', () => {
    expect(mapStatus('SOME_NEW_CODE')).toBe('SOME_NEW_CODE');
  });
});
