import { describe, expect, it } from 'vitest';
import { parseJsonInput } from './parseJsonInput';

describe('parseJsonInput', () => {
  it('parses valid object JSON', () => {
    const result = parseJsonInput('{"a": 1}');
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toEqual({ a: 1 });
  });

  it('parses valid array JSON', () => {
    const result = parseJsonInput('[1, 2, 3]');
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toEqual([1, 2, 3]);
  });

  it('reports error on empty input', () => {
    expect(parseJsonInput('   ')).toEqual({ ok: false, error: 'Empty input' });
    expect(parseJsonInput('')).toEqual({ ok: false, error: 'Empty input' });
  });

  it('reports error on malformed JSON', () => {
    const result = parseJsonInput('{"a":');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/JSON|Unexpected/i);
  });

  it('trims whitespace before parse', () => {
    const result = parseJsonInput('   \n  {"a":1}\n  ');
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toEqual({ a: 1 });
  });
});
