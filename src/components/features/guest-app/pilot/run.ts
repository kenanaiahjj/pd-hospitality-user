import { createPilot, InvariantViolation, makeRng } from './engine';
import { SCENARIOS } from './scenarios';
import type { Ctx, Scenario } from './scenarios/kit';
import type { Pilot, PilotOptions, Refusal, Result } from './types';

/*
  Runs scenarios and says what happened. Each scenario gets its own simulation
  with `paranoid` on, which checks all nine invariants after every action and
  stops at the first break. The same function feeds the test suite and the
  report, so a pass in one is a pass in the other.
*/

export type ScenarioResult = {
  id: string;
  group: string;
  title: string;
  adapted?: string;
  pass: boolean;
  ms: number;
  /** The states the scenario's bookings and payments went through. */
  states: string[];
  steps: number;
  stepNames: string[];
  error?: string;
  /** I1 to I9: held, or the first step at which it broke. */
  invariants: Record<string, string>;
};

export type RunSummary = {
  seed: number;
  chaosSteps: number;
  results: ScenarioResult[];
  total: number;
  passed: number;
  failed: number;
  /** Invariant checks: one set of nine per action, summed. */
  invariantChecks: number;
  ranAt: string;
};

export const DEFAULT_SEED = 20261007;
export const INVARIANT_IDS = ['I1', 'I2', 'I3', 'I4', 'I5', 'I6', 'I7', 'I8', 'I9'];

const hash = (text: string) => [...text].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) >>> 0, 7);

function lineage(p: Pilot): string[] {
  const chains = new Map<string, string[]>();
  for (const entry of p.log()) {
    if (!entry.entity || !entry.entityId || !entry.to) continue;
    const key = `${entry.entity} ${entry.entityId}`;
    const chain = chains.get(key) ?? [];
    if (chain[chain.length - 1] !== entry.to) chain.push(entry.to);
    chains.set(key, chain);
  }
  const lines = [...chains.entries()].map(([key, chain]) => `${key.split(' ')[0]}: ${chain.join(' > ')}`);
  if (lines.length <= 12) return lines;
  const counts = new Map<string, number>();
  for (const chain of chains.values()) for (const state of chain) counts.set(state, (counts.get(state) ?? 0) + 1);
  return [`${chains.size} records, states reached: ` + [...counts.entries()].map(([s, n]) => `${s} ×${n}`).join(', ')];
}

export function runScenario(scenario: Scenario, seed = DEFAULT_SEED, chaosSteps = 10_000): ScenarioResult {
  const started = performance.now();
  const rng = makeRng(seed + hash(scenario.id));
  const stepNames: string[] = [];
  const options: PilotOptions = { seed, paranoid: true, ...scenario.options };
  const p = createPilot(options);
  const lastStep = { name: '' };

  const fail = (message: string): never => {
    throw new Error(`${message}${lastStep.name ? ` (in step: ${lastStep.name})` : ''}`);
  };
  const c: Ctx = {
    p,
    chaosSteps,
    rng,
    step(name, fn) {
      lastStep.name = name;
      stepNames.push(name);
      fn();
      const broken = p.invariants();
      if (broken.length) throw new Error(`Invariants broke after "${name}": ${broken.join('; ')}`);
    },
    ok(cond, message) {
      if (!cond) fail(`Expected: ${message}`);
    },
    eq(actual, expected, message) {
      if (actual !== expected) fail(`${message}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
    },
    must<T extends object>(result: Result<T>, message?: string): T {
      if (!result.ok) fail(`${message ?? 'Expected it to work'}: refused (${result.reason}) ${result.message}`);
      return result as T;
    },
    refused(result: Result<object>, reason?: Refusal, contains?: string) {
      if (result.ok) return fail(`Expected a refusal${reason ? ` (${reason})` : ''} but it worked`);
      if (reason && result.reason !== reason) fail(`Expected refusal ${reason}, got ${result.reason}: ${result.message}`);
      if (contains && !result.message.toLowerCase().includes(contains.toLowerCase())) fail(`Expected the message to mention "${contains}", got "${result.message}"`);
    },
    fresh(extra) {
      return createPilot({ ...options, ...extra });
    },
    ask(draft, guestId) {
      const r = p.guest(guestId).request(draft);
      if (!r.ok) return fail(`Asking for ${draft.listingId} was refused (${r.reason}): ${r.message}`);
      return r.bookingId;
    },
    states(bookingId) {
      return p.log().filter((l) => l.entity === 'booking' && l.entityId === bookingId && l.to).map((l) => l.to!);
    },
    paymentStates(paymentId) {
      return p.log().filter((l) => l.entity === 'payment' && l.entityId === paymentId && l.to).map((l) => l.to!);
    },
  };

  const invariants: Record<string, string> = Object.fromEntries(INVARIANT_IDS.map((id) => [id, 'held']));
  let error: string | undefined;
  try {
    scenario.run(c);
    const broken = p.invariants();
    if (broken.length) throw new Error(`Invariants broke at the end: ${broken.join('; ')}`);
  } catch (e) {
    error = e instanceof Error ? e.message : String(e);
    if (e instanceof InvariantViolation) {
      for (const id of e.ids) invariants[id] = `broke at step ${e.step} (seed ${e.seed}): ${e.message}`;
      error = `${e.message} [seed ${e.seed}, step ${e.step}]`;
    }
  }
  return {
    id: scenario.id,
    group: scenario.group,
    title: scenario.title,
    adapted: scenario.adapted,
    pass: !error,
    ms: Math.round((performance.now() - started) * 10) / 10,
    states: error && !p ? [] : lineage(p),
    steps: p.steps(),
    stepNames,
    error,
    invariants,
  };
}

export function runAll(seed = DEFAULT_SEED, chaosSteps = 10_000): RunSummary {
  const results = SCENARIOS.map((s) => runScenario(s, seed, chaosSteps));
  return {
    seed,
    chaosSteps,
    results,
    total: results.length,
    passed: results.filter((r) => r.pass).length,
    failed: results.filter((r) => !r.pass).length,
    invariantChecks: results.reduce((sum, r) => sum + r.steps, 0) * INVARIANT_IDS.length,
    ranAt: new Date().toISOString(),
  };
}
