import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { toHtml, toJson } from './report';
import { DEFAULT_SEED, runAll } from './run';

/*
  Writes reports/pilot/index.html and results.json. It only runs when asked:
  `npm run pilot:report` sets PILOT_REPORT=1. The plain `npm test` skips it.
*/

const wanted = process.env.PILOT_REPORT === '1';

describe.skipIf(!wanted)('pilot report', () => {
  it('runs every scenario and writes the report', () => {
    const run = runAll(Number(process.env.PILOT_SEED ?? DEFAULT_SEED), Number(process.env.PILOT_STEPS ?? 10_000));
    const dir = join(process.cwd(), 'reports', 'pilot');
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, 'results.json'), `${JSON.stringify(toJson(run), null, 2)}\n`);
    writeFileSync(join(dir, 'index.html'), toHtml(run));
    expect(run.failed).toBe(0);
  }, 600_000);
});
