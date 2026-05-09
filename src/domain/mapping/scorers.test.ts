import { describe, expect, it } from 'vitest';
import { classifyGoalType, parseMinute } from './scorers';

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

  it('maps FRD (free kick goal) to "open_play" (CONVENTIONS.md #11)', () => {
    expect(classifyGoalType('FRD')).toBe('open_play');
  });

  it('maps unknown actions to "open_play" defensively', () => {
    expect(classifyGoalType('NEW_ACTION_TYPE')).toBe('open_play');
  });
});
