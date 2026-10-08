import { describe, expect, it } from 'vitest';
import { DEFAULT_SEED, runScenario } from './run';
import { SCENARIOS } from './scenarios';

/*
  The 80 pilot scenarios, one test each. Every action inside a scenario is
  followed by a check of all nine invariants, so a pass here means the rules held
  at every step, not just at the end.

  Replay a chaos failure:  PILOT_SEED=<seed> PILOT_STEPS=<step> npm run pilot:replay
*/

const seed = Number(process.env.PILOT_SEED ?? DEFAULT_SEED);
const chaosSteps = Number(process.env.PILOT_STEPS ?? 10_000);

describe('pilot scenarios', () => {
  it('has the 80 scenarios, each once', () => {
    expect(SCENARIOS).toHaveLength(80);
    expect(new Set(SCENARIOS.map((s) => s.id)).size).toBe(80);
  });

  for (const scenario of SCENARIOS) {
    it(`${scenario.id} ${scenario.title}`, () => {
      const result = runScenario(scenario, seed, chaosSteps);
      expect(result.error ?? 'passed').toBe('passed');
    }, 120_000);
  }
});
