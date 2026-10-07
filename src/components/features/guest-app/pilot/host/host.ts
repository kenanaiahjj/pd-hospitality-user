import { createPilot } from '../engine';
import type { Pilot, StayStatus } from '../types';
import { buildCatalog, CATALOG_VERSION } from './catalog';

/*
  One engine for the signed-in guest. Every action that changes it goes through
  `call`, which records it, so a reload (or a step back in time on the prototype
  clock) rebuilds exactly the same state by playing the record again. The engine
  is deterministic and has no clock or randomness of its own, which is what
  makes that safe.

  The app never mutates the engine behind this file's back, and never stores a
  copy of its state: it asks, and projects what it needs onto its own records.
*/

type Op = { path: string; args: unknown[]; t0: number };
type Stored = { v: 1; catalog: string; start: number; ops: Op[]; guests: Record<string, { guestId: string; stayId: string }>; meta?: Record<string, string> };

export type StayInput = {
  /** The app's booking id: the stay this guest is on. */
  id: string;
  firstName: string;
  room: string;
  checkIn: string;
  checkOut: string;
  status: StayStatus;
};

const STORAGE_KEY = 'cabana.pilot-host.v1';
const HOUR = 3_600_000;
export const hostClock = (date: string, hour: number) => Date.parse(`${date}T00:00:00Z`) + hour * HOUR;

type Callable = Record<string, (...args: unknown[]) => unknown>;

function exec(pilot: Pilot, path: string, args: unknown[]): unknown {
  const [scope, method] = path.split('.') as [string, string];
  if (scope === 'race') {
    // The guest withdraws as the vendor confirms, in the same instant.
    const [guestId, vendorId, bookingId] = args as [string, string, string];
    return pilot.together(() => pilot.guest(guestId).cancel(bookingId), () => pilot.vendor(vendorId).confirm(bookingId));
  }
  if (scope === 'desk') return (pilot.desk as unknown as Callable)[method]!(...args);
  if (scope === 'pilot') return (pilot as unknown as Callable)[method]!(...args);
  const [id, ...rest] = args as [string, ...unknown[]];
  const target = (scope === 'guest' ? pilot.guest(id) : pilot.vendor(id)) as unknown as Callable;
  return target[method]!(...rest);
}

const read = (): Stored | null => {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as Stored) : null;
    return parsed && parsed.v === 1 && parsed.catalog === CATALOG_VERSION ? parsed : null;
  } catch {
    return null;
  }
};
const write = (stored: Stored) => {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
  } catch {
    /* the host still works for this visit */
  }
};
const forget = () => {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* nothing kept */
  }
};

function makePilot(start: number): Pilot {
  return createPilot({
    catalog: buildCatalog(),
    start,
    // The engine always seeds one guest; this one is parked in the past and never used.
    guestName: 'Placeholder',
    mariaStay: { checkIn: '2026-01-01', checkOut: '2026-01-02', status: 'checked-out', room: '' },
  });
}

export class Host {
  pilot: Pilot;
  version = 0;
  private listeners = new Set<() => void>();
  private ops: Op[] = [];
  private guests: Stored['guests'] = {};
  /** What the engine does not know: the wallet a card payment used. */
  meta: Record<string, string> = {};
  private start: number;

  constructor(start: number, stored?: Stored | null, private persistent = false) {
    this.start = stored?.start ?? start;
    this.pilot = makePilot(this.start);
    if (stored) {
      this.guests = stored.guests;
      this.meta = stored.meta ?? {};
      for (const op of stored.ops) {
        exec(this.pilot, op.path, op.args);
        this.ops.push(op);
      }
    }
  }

  now = () => this.pilot.now();

  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };
  getVersion = () => this.version;

  private touch() {
    this.version += 1;
    if (this.persistent) write({ v: 1, catalog: CATALOG_VERSION, start: this.start, ops: this.ops, guests: this.guests, meta: this.meta });
    this.listeners.forEach((l) => l());
  }

  /** Run one engine action and keep it on the record. */
  call<T = unknown>(path: string, ...args: unknown[]): T {
    const op: Op = { path, args, t0: this.pilot.now() };
    const result = exec(this.pilot, path, args) as T;
    this.ops.push(op);
    this.touch();
    return result;
  }

  /** The engine guest for an app stay: made the first time it is asked for, kept in step with the stay after that. */
  ensureGuest(stay: StayInput): { guestId: string; stayId: string } {
    let known = this.guests[stay.id];
    if (!known) {
      const made = this.call<{ guestId: string; stayId: string }>('pilot.addGuest', { firstName: stay.firstName, room: stay.room, checkIn: stay.checkIn, checkOut: stay.checkOut, status: stay.status });
      known = made;
      this.guests[stay.id] = made;
      this.touch();
      return made;
    }
    const current = this.pilot.stay(known.stayId);
    if (current.room !== stay.room || current.checkIn !== stay.checkIn || current.checkOut !== stay.checkOut || current.status !== stay.status) {
      this.call('desk.syncStay', known.stayId, { room: stay.room, checkIn: stay.checkIn, checkOut: stay.checkOut, status: stay.status });
    }
    return known;
  }

  setMeta(key: string, value: string) {
    this.meta[key] = value;
    this.touch();
  }

  /** Every app stay the engine knows a guest for. */
  stays(): Array<[string, { guestId: string; stayId: string }]> {
    return Object.entries(this.guests);
  }

  guestOf(appBookingId: string): { guestId: string; stayId: string } | undefined {
    return this.guests[appBookingId];
  }

  /** Move the clock. Forward plays the timers; backward replays the record up to that moment. */
  setTime(ms: number) {
    if (ms === this.pilot.now()) return;
    if (ms > this.pilot.now()) {
      this.call('pilot.advanceTo', ms);
      return;
    }
    if (this.pilot.bookings().length === 0) {
      // Nothing booked yet, so nothing to lose: begin the day at that hour, keeping only who is on which stay.
      this.start = ms;
      const fresh = makePilot(ms);
      const kept = this.ops.filter((op) => op.path === 'pilot.addGuest' || op.path === 'desk.syncStay');
      for (const op of kept) exec(fresh, op.path, op.args);
      this.pilot = fresh;
      this.ops = kept;
      this.touch();
      return;
    }
    const keep: Op[] = [];
    const fresh = makePilot(this.start);
    for (const op of this.ops) {
      const target = op.path === 'pilot.advanceTo' ? (op.args[0] as number) : op.t0;
      if (target > ms) break;
      exec(fresh, op.path, op.args);
      keep.push(op);
    }
    if (fresh.now() < ms) {
      keep.push({ path: 'pilot.advanceTo', args: [ms], t0: fresh.now() });
      exec(fresh, 'pilot.advanceTo', [ms]);
    }
    this.pilot = fresh;
    this.ops = keep;
    this.touch();
  }

  /** Start over: every booking, thread and charge is gone. */
  reset(start: number) {
    this.start = start;
    this.pilot = makePilot(start);
    this.ops = [];
    this.guests = {};
    this.meta = {};
    if (this.persistent) forget();
    this.version += 1;
    this.listeners.forEach((l) => l());
  }
}

/**
  The host a component owns: nothing exists until `ensure` is called from an
  event handler or an effect, so rendering stays pure and a prerendered page
  never sees one. `persistent` follows the app's own storage switch, so tests
  and previews that opt out of storage cannot leak bookings into each other.
*/
export class HostStore {
  host: Host | null = null;
  version = 0;
  private listeners = new Set<() => void>();
  constructor(private persistent: boolean) {}

  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };
  getVersion = () => this.version + (this.host?.version ?? 0);

  private emit() {
    this.version += 1;
    this.listeners.forEach((l) => l());
  }

  ensure(startAt: number): Host {
    if (!this.host) {
      this.host = new Host(startAt, this.persistent && typeof window !== 'undefined' ? read() : null, this.persistent);
      this.host.subscribe(() => this.listeners.forEach((l) => l()));
      this.emit();
    }
    return this.host;
  }

  /** Forget every booking, thread and charge: signing out, a fresh account, a different demo state. */
  reset(startAt: number) {
    if (this.host) this.host.reset(startAt);
    else if (this.persistent) forget();
  }
}
