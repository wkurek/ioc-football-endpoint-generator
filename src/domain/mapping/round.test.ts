import { describe, expect, it } from 'vitest';
import { computeMatchNumberInPhase, matchSortComparator } from './round';
import type { SchSchedule } from '@/data/api/schemas';

const fakeSchedule = (overrides: {
  code: string;
  longDescription: string;
  startDate: string;
}): SchSchedule =>
  ({
    code: overrides.code,
    startDate: overrides.startDate,
    endDate: overrides.startDate,
    unitNum: '1',
    start: [],
    status: { code: 'FINISHED', description: 'Finished' },
    eventUnit: {
      code: overrides.code,
      longDescription: overrides.longDescription,
      shortDescription: '',
      type: 'HTEAM',
      phase: { type: '3' },
    },
  }) as SchSchedule;

describe('matchSortComparator', () => {
  it('sorts by startDate ASC then eventUnit.code ASC', () => {
    const a = fakeSchedule({
      code: 'FBLMTEAM11------------GPB-000100--',
      longDescription: "Men's Group B",
      startDate: '2024-07-24T15:00:00+02:00',
    });
    const b = fakeSchedule({
      code: 'FBLMTEAM11------------GPC-000100--',
      longDescription: "Men's Group C",
      startDate: '2024-07-24T15:00:00+02:00',
    });
    const c = fakeSchedule({
      code: 'FBLMTEAM11------------GPA-000100--',
      longDescription: "Men's Group A",
      startDate: '2024-07-24T21:00:00+02:00',
    });
    const sorted = [c, b, a].sort(matchSortComparator);
    // a, b same date — code GPB < GPC. c later date → after both.
    expect(sorted.map((s) => s.eventUnit.code)).toEqual([
      'FBLMTEAM11------------GPB-000100--',
      'FBLMTEAM11------------GPC-000100--',
      'FBLMTEAM11------------GPA-000100--',
    ]);
  });
});

describe('computeMatchNumberInPhase', () => {
  it('numbers 6 group-stage matches 1..6 by chronological order', () => {
    const matches = [
      fakeSchedule({
        code: 'FBLMTEAM11------------GPA-000100--',
        longDescription: "Men's Group A",
        startDate: '2024-07-24T21:00:00+02:00',
      }),
      fakeSchedule({
        code: 'FBLMTEAM11------------GPA-000200--',
        longDescription: "Men's Group A",
        startDate: '2024-07-24T17:00:00+02:00',
      }),
      fakeSchedule({
        code: 'FBLMTEAM11------------GPA-000300--',
        longDescription: "Men's Group A",
        startDate: '2024-07-27T19:00:00+02:00',
      }),
    ];
    expect(
      computeMatchNumberInPhase(matches, 'FBLMTEAM11------------GPA-000200--'),
    ).toBe(1); // earliest kickoff
    expect(
      computeMatchNumberInPhase(matches, 'FBLMTEAM11------------GPA-000100--'),
    ).toBe(2);
    expect(
      computeMatchNumberInPhase(matches, 'FBLMTEAM11------------GPA-000300--'),
    ).toBe(3);
  });

  it('throws when target code is not in the list', () => {
    expect(() => computeMatchNumberInPhase([], 'X')).toThrow(/errors\.round\.noMatchWithCode/);
  });

  it('isolates phases (Men\'s Group A vs Women\'s Group A)', () => {
    const matches = [
      fakeSchedule({
        code: 'FBLMTEAM11------------GPA-000100--',
        longDescription: "Men's Group A",
        startDate: '2024-07-24',
      }),
      fakeSchedule({
        code: 'FBLWTEAM11------------GPA-000100--',
        longDescription: "Women's Group A",
        startDate: '2024-07-25',
      }),
    ];
    expect(
      computeMatchNumberInPhase(matches, 'FBLWTEAM11------------GPA-000100--'),
    ).toBe(1);
    expect(
      computeMatchNumberInPhase(matches, 'FBLMTEAM11------------GPA-000100--'),
    ).toBe(1);
  });
});
