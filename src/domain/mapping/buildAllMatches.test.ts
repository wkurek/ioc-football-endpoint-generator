/**
 * Smoke test: runs buildMatch over all 58 Paris 2024 football matches.
 * Catches regressions in the mappers when run against the full corpus
 * (the small `fixtures/res/` set covers only 6 representative matches).
 *
 * Fixtures live in `test/fixtures/res-all/`.
 */
import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { buildMatch } from './buildMatch';
import {
  ByDisciplineH2HSchema,
  ResByRscH2HSchema,
  type SchSchedule,
} from '@/data/api/schemas';
import { MatchSchema } from '@/domain/matchSchema';

const FIXTURES = join(process.cwd(), 'test', 'fixtures');
const RES_ALL_DIR = join(FIXTURES, 'res-all');

const schedules: SchSchedule[] = (() => {
  const dir = join(FIXTURES, 'sch');
  const files = readdirSync(dir).filter((f) => f.endsWith('.json'));
  const all: SchSchedule[] = [];
  for (const f of files) {
    const json = JSON.parse(readFileSync(join(dir, f), 'utf8'));
    const parsed = ByDisciplineH2HSchema.parse(json);
    for (const s of parsed.schedules) {
      if (s.eventUnit.type === 'HTEAM') all.push(s);
    }
  }
  return all;
})();

const hasResAll = existsSync(RES_ALL_DIR);

describe.skipIf(!hasResAll)('buildMatch — full 58-match corpus', () => {
  it('builds all 58 matches without errors', () => {
    const errors: Array<{ code: string; error: string }> = [];
    let ok = 0;
    for (const sch of schedules) {
      const code = sch.eventUnit.code;
      const path = join(RES_ALL_DIR, `${code}.json`);
      if (!existsSync(path)) {
        errors.push({ code, error: 'RES fixture file missing' });
        continue;
      }
      try {
        const resJson = JSON.parse(readFileSync(path, 'utf8'));
        const res = ResByRscH2HSchema.parse(resJson);
        buildMatch({ sch, res, allMatches: schedules });
        ok++;
      } catch (e) {
        errors.push({ code, error: e instanceof Error ? e.message : String(e) });
      }
    }
    if (errors.length > 0) {
      const summary = errors.map((e) => `  ${e.code}\n    ${e.error}`).join('\n');
      throw new Error(`${ok}/${schedules.length} succeeded, ${errors.length} failed:\n${summary}`);
    }
    expect(ok).toBe(58);
  });

  it('every generated match conforms to the example.json schema', () => {
    const errors: Array<{ code: string; error: string }> = [];
    for (const sch of schedules) {
      const code = sch.eventUnit.code;
      const path = join(RES_ALL_DIR, `${code}.json`);
      if (!existsSync(path)) continue;
      const resJson = JSON.parse(readFileSync(path, 'utf8'));
      const res = ResByRscH2HSchema.parse(resJson);
      const match = buildMatch({ sch, res, allMatches: schedules });
      const result = MatchSchema.safeParse(match);
      if (!result.success) {
        errors.push({
          code,
          error: result.error.issues
            .map((i) => `${i.path.join('.')}: ${i.message}`)
            .join('; '),
        });
      }
    }
    if (errors.length > 0) {
      const summary = errors.map((e) => `  ${e.code}\n    ${e.error}`).join('\n');
      throw new Error(`Schema-conformance failed for ${errors.length} matches:\n${summary}`);
    }
    expect(errors).toHaveLength(0);
  });
});
