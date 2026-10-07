'use client';

import { useSyncExternalStore } from 'react';
import { createPilot } from '../engine';
import type { Pilot } from '../types';

/*
  The pilot as the browser sees it: one live engine, a version number that goes
  up after every action, and a hook that re-renders when it does. The engine is
  not paranoid here; the invariant checks belong to the scenario runs.
*/

type Store = {
  pilot: Pilot;
  version: number;
  listeners: Set<() => void>;
  /** The booking the vendor and desk triggers act on. */
  target: string | null;
};

let store: Store | null = null;

function ensure(): Store {
  if (!store) store = { pilot: createPilot({ paranoid: false }), version: 0, listeners: new Set(), target: null };
  return store;
}
const emit = () => {
  const s = ensure();
  s.version += 1;
  s.listeners.forEach((l) => l());
};

/** Run something against the engine, then tell every screen. */
export function act<T>(fn: (p: Pilot) => T): T {
  const result = fn(ensure().pilot);
  emit();
  return result;
}

export function resetPilot() {
  const s = ensure();
  s.pilot = createPilot({ paranoid: false });
  s.target = null;
  emit();
}

export function setTarget(bookingId: string | null) {
  ensure().target = bookingId;
  emit();
}

export function usePilot(): { pilot: Pilot; target: string | null; version: number } {
  const s = ensure();
  useSyncExternalStore(
    (l) => {
      s.listeners.add(l);
      return () => s.listeners.delete(l);
    },
    () => s.version,
    () => 0,
  );
  return { pilot: s.pilot, target: s.target, version: s.version };
}
