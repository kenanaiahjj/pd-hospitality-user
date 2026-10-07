import type { Booking, Draft, Pilot, PilotOptions, Refusal, Result } from '../types';

/*
  What a scenario can use: the engine, a few named dates, and assertions that
  throw. Scenarios never import the engine itself, only its types, so they read
  as a script of what the guest, the vendor and the front desk do.
*/

export type Ctx = {
  p: Pilot;
  /** Name a step. Every action inside it is followed by a check of all nine invariants. */
  step(name: string, fn: () => void): void;
  ok(cond: unknown, message: string): void;
  eq(actual: unknown, expected: unknown, message: string): void;
  /** The result must be ok; returns it with its payload. */
  must<T extends object>(result: Result<T>, message?: string): T;
  refused(result: Result<object>, reason?: Refusal, contains?: string): void;
  /** Another independent simulation, for "run it twice" scenarios. */
  fresh(options?: PilotOptions): Pilot;
  /** Seeded, repeatable. */
  rng(): number;
  /** How many steps the chaos run takes (10,000 unless a replay asks for fewer). */
  chaosSteps: number;
  /** Ask or book as a guest and require that it worked. */
  ask(draft: Draft, guestId?: string): string;
  /** The statuses a booking has been through, in order. */
  states(bookingId: string): string[];
  paymentStates(paymentId: string): string[];
};

export type Group = 'Happy paths' | 'Timing and races' | 'Payment' | 'PMS and the bill' | 'Cancellations' | 'Vendors and listings' | "Restaurants and pasalubong at Henry's" | 'Chat and cards' | 'Stress and chaos';

export type Scenario = {
  id: string;
  group: Group;
  title: string;
  /** Changed from the pages because charge-at-once bookings have no vendor step. */
  adapted?: string;
  options?: PilotOptions;
  /** The chaos run reports its step count. */
  run(c: Ctx): void | { steps: number };
};

export const draft = (listingId: string, date: string, qty: number, extra: Partial<Draft> = {}): Draft => ({ listingId, date, qty, ...extra });

export const lastBooking = (p: Pilot): Booking => {
  const all = p.bookings();
  return all[all.length - 1]!;
};

export const money = (n: number) => `₱${n.toLocaleString('en-US')}`;
