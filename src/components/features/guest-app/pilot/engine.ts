import type { Pilot, PilotOptions } from './types';

/** Placeholder until the engine is built: every scenario fails on it. */
export function createPilot(_options?: PilotOptions): Pilot {
  throw new Error('The pilot engine is not built yet');
}

export class InvariantViolation extends Error {
  constructor(
    public ids: string[],
    public step: number,
    public seed: number,
    message: string,
  ) {
    super(message);
  }
}

/** A small seeded random source: the same seed gives the same numbers. */
export function makeRng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
