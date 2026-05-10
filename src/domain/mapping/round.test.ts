import { describe, expect, it } from 'vitest';
import { parseUnitNum } from './round';
import type { SchSchedule } from '@/data/api/schemas';

const fakeSchedule = (overrides: { code: string; unitNum: string }): SchSchedule =>
  ({
    code: overrides.code,
    startDate: '2024-07-24T15:00:00+02:00',
    endDate: '2024-07-24T15:00:00+02:00',
    unitNum: overrides.unitNum,
    start: [],
    status: { code: 'FINISHED', description: 'Finished' },
    eventUnit: {
      code: overrides.code,
      longDescription: "Men's Group A",
      shortDescription: '',
      type: 'HTEAM',
      phase: { type: '3' },
    },
  }) as SchSchedule;

describe('parseUnitNum', () => {
  it('parses the SCH unitNum string as int', () => {
    expect(parseUnitNum(fakeSchedule({ code: 'X', unitNum: '17' }))).toBe(17);
    expect(parseUnitNum(fakeSchedule({ code: 'X', unitNum: '1' }))).toBe(1);
    expect(parseUnitNum(fakeSchedule({ code: 'X', unitNum: '32' }))).toBe(32);
  });

  it('throws when unitNum is missing', () => {
    expect(() => parseUnitNum(fakeSchedule({ code: 'X', unitNum: '' }))).toThrow(
      /errors\.round\.missingUnitNum/,
    );
  });

  it('throws when unitNum is not numeric', () => {
    expect(() => parseUnitNum(fakeSchedule({ code: 'X', unitNum: 'foo' }))).toThrow(
      /errors\.round\.invalidUnitNum/,
    );
  });
});
