'use client';

import { Heart } from '@phosphor-icons/react';
import { useMemo, useSyncExternalStore } from 'react';
import type { StayHotel } from './model';

/*
  Saved hotels: a heart on every hotel card and page, and a row of them on
  Home for coming back to. Kept on this device, like recent searches -- in a
  real account it would sync -- and read through one small store, so every
  heart on screen agrees the moment one is tapped. A blocked store keeps the
  list in memory for the visit.
*/

const KEY = 'cabana.saved-hotels.v1';
const listeners = new Set<() => void>();
let memory: string | null = null;

function snapshot(): string {
  if (memory !== null) return memory;
  try {
    return window.localStorage.getItem(KEY) ?? '[]';
  } catch {
    return '[]';
  }
}

function parse(raw: string): string[] {
  try {
    const value: unknown = JSON.parse(raw);
    return Array.isArray(value) ? value.filter((id): id is string => typeof id === 'string') : [];
  } catch {
    return [];
  }
}

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  const fromOtherTab = (event: StorageEvent) => { if (event.key === KEY) onChange(); };
  window.addEventListener('storage', fromOtherTab);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener('storage', fromOtherTab);
  };
}

/** Newest first. */
export function toggleSavedHotel(id: string) {
  const ids = parse(snapshot());
  seedSavedHotels(ids.includes(id) ? ids.filter((value) => value !== id) : [id, ...ids]);
}

/** Replaces the list outright: prototype controls seed it, and an empty list clears it. */
export function seedSavedHotels(ids: string[]) {
  const next = JSON.stringify(ids);
  try {
    window.localStorage.setItem(KEY, next);
    memory = null;
  } catch {
    memory = next;
  }
  listeners.forEach((listener) => listener());
}

export function useSavedHotels(): string[] {
  const raw = useSyncExternalStore(subscribe, snapshot, () => '[]');
  return useMemo(() => parse(raw), [raw]);
}

export function SaveHotelButton({ hotel, labelled }: { hotel: StayHotel; labelled?: boolean }) {
  const saved = useSavedHotels().includes(hotel.id);
  return (
    <button
      type="button"
      className={`sb-save${labelled ? ' sb-save--labelled' : ''}${saved ? ' is-saved' : ''}`}
      aria-pressed={saved}
      aria-label={saved ? `Remove ${hotel.name} from saved` : `Save ${hotel.name}`}
      onClick={() => toggleSavedHotel(hotel.id)}
    >
      <Heart weight={saved ? 'fill' : 'bold'} aria-hidden="true" />
      {labelled ? <span>{saved ? 'Saved' : 'Save'}</span> : null}
    </button>
  );
}
