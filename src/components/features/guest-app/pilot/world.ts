import type { Settings } from './config';
import type { Booking, Guest, GatewaySim, Listing, LogEntry, Notification, Payment, PmsSim, Stay, Task, Thread, Vendor } from './types';

/*
  Everything the engine knows, in one plain object, so the invariant checks can
  read it without going through the engine's own actions.
*/

export type GatewayTxn = { id: string; paymentId: string; amount: number; state: 'paid' | 'failed' | 'refunded'; seen: boolean };

export type VendorRuntime = {
  online: boolean;
  away: boolean;
  /** Taps made without signal, waiting to sync. */
  pendingTaps: { bookingId: string; action: 'confirm' | 'decline' | 'scan'; at: number; actor?: string; reason?: string }[];
  /** Booking ids cached on the phone when it was last opened online. */
  cache: Set<string> | null;
  blockedSlots: Set<string>;
  removedListings: Set<string>;
};

export type World = {
  settings: Settings;
  seed: number;
  now: number;
  steps: number;
  vendors: Vendor[];
  listings: Map<string, Listing>;
  guests: Map<string, Guest & { stayId: string }>;
  stays: Map<string, Stay>;
  bookings: Map<string, Booking>;
  payments: Map<string, Payment>;
  threads: Map<string, Thread>;
  tasks: Map<string, Task>;
  notifications: Notification[];
  log: LogEntry[];
  vendorRuntime: Map<string, VendorRuntime>;
  pms: PmsSim;
  gateway: GatewaySim;
  txns: GatewayTxn[];
  /** slot key to bookings' holds, kept as each booking changes. */
  load: Map<string, { held: number; confirmed: number }>;
  capacityOverride: Map<string, number>;
  /** Every failure the system could not settle, and the task that carries it. */
  failures: { kind: string; ref: string; taskId: string }[];
  /** Transitions as they were made, for the "only drawn transitions" check. */
  transitions: { entity: 'booking' | 'payment'; id: string; from: string | null; to: string; ok: boolean }[];
  transitionCount: Map<string, number>;
  races: { first: string; second: string; firstOk: boolean; secondOk: boolean }[];
  /** Timers fired, for "exactly once". */
  firedTimers: Set<number>;
  doubleFired: number[];
};
