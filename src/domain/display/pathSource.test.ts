import { describe, expect, it } from 'vitest';
import { pathSource } from './pathSource';

describe('pathSource', () => {
  it.each([
    [['competition', 'name'], 'const'],
    [['competition', 'season'], 'const'],
    [['competition', 'round'], 'sch'],
    [['competition'], 'neutral'],
    [['venue', 'name'], 'sch'],
    [['venue', 'city'], 'sch'],
    [['kickoff'], 'sch'],
    [['status'], 'const'],
    [['teams', 'home'], 'res'],
    [['teams', 'away'], 'res'],
    [['score', 'home'], 'res'],
    [['score', 'halfTime', 'home'], 'res'],
    [['scorers', '0', 'minute'], 'res'],
    [['lineups', 'home', 'formation'], 'res'],
    [['lineups', 'home', 'startingXI', '0', 'name'], 'res'],
    [['unknown'], 'neutral'],
    [[], 'neutral'],
  ] as const)('path %j → %s', (path, expected) => {
    expect(pathSource(path)).toBe(expected);
  });
});
