import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { MatchSchema } from './matchSchema';

describe('MatchSchema', () => {
  it('accepts example.json verbatim', () => {
    const exampleJson = JSON.parse(
      readFileSync(join(process.cwd(), 'example.json'), 'utf8'),
    );
    const result = MatchSchema.safeParse(exampleJson);
    if (!result.success) {
      throw new Error(
        'example.json does not conform to MatchSchema:\n' +
          result.error.issues
            .map((i) => `  ${i.path.join('.')}: ${i.message}`)
            .join('\n'),
      );
    }
    expect(result.success).toBe(true);
  });

  it('rejects unknown top-level keys (strict)', () => {
    const exampleJson = JSON.parse(
      readFileSync(join(process.cwd(), 'example.json'), 'utf8'),
    );
    const polluted = { ...exampleJson, extraField: 'nope' };
    expect(MatchSchema.safeParse(polluted).success).toBe(false);
  });

  it('rejects unknown position codes', () => {
    const exampleJson = JSON.parse(
      readFileSync(join(process.cwd(), 'example.json'), 'utf8'),
    );
    const broken = structuredClone(exampleJson) as {
      lineups: { home: { startingXI: Array<{ position: string }> } };
    };
    broken.lineups.home.startingXI[0]!.position = 'XYZ';
    expect(MatchSchema.safeParse(broken).success).toBe(false);
  });

  it('rejects non-ISO kickoff', () => {
    const exampleJson = JSON.parse(
      readFileSync(join(process.cwd(), 'example.json'), 'utf8'),
    );
    const broken = { ...exampleJson, kickoff: '2024-07-24 15:00' };
    expect(MatchSchema.safeParse(broken).success).toBe(false);
  });
});
