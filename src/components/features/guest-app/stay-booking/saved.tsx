'use client';

import { Check, Heart, ShareNetwork } from '@phosphor-icons/react';
import { useMemo, useState, useSyncExternalStore } from 'react';
import type { StayHotel, StaySearch } from './model';
import { ANYWHERE, fromPrice, peso, searchHotels } from './model';
import { stayDatesLabel } from './format';
import { HotelResultCard } from './results';

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

/**
 * Sends the hotel and its dates through the phone's share sheet -- to a
 * partner, a parent, the group chat -- or copies it where there is none.
 */
export function ShareHotelButton({ hotel, search }: { hotel: StayHotel; search: StaySearch }) {
  const [done, setDone] = useState(false);
  const from = fromPrice(hotel, search);
  const text = `${hotel.name}, ${hotel.area} · ${stayDatesLabel(search.checkIn, search.checkOut)}${from !== undefined ? ` · from ${peso(from)} a night` : ''}`;
  const share = async () => {
    // The prototype has no page per hotel yet; the real app links to the hotel itself.
    const url = typeof window !== 'undefined' ? window.location.origin : '';
    try {
      if (navigator.share) await navigator.share({ title: hotel.name, text, url });
      else await navigator.clipboard?.writeText(`${text}\n${url}`);
      setDone(true);
    } catch {
      // Share sheet closed: nothing to report.
    }
  };
  return (
    <button type="button" className="sb-save sb-save--labelled" onClick={() => { void share(); }} aria-label={done ? `${hotel.name} shared` : `Share ${hotel.name}`}>
      {done ? <Check weight="bold" aria-hidden="true" /> : <ShareNetwork weight="bold" aria-hidden="true" />}
      <span>{done ? 'Shared' : 'Share'}</span>
    </button>
  );
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

/**
 * Every saved hotel, from Profile -- reachable with or without a booking,
 * since Home only shows them while there is no stay to show instead.
 */
export function SavedHotelsScreen({ search, onOpenHotel, onBrowse, onDevice }: {
  search: StaySearch;
  onOpenHotel: (id: string) => void;
  onBrowse: () => void;
  /** A guest's list is kept on this phone only, and is told so. */
  onDevice?: boolean;
}) {
  const ids = useSavedHotels();
  const priced = { ...search, location: ANYWHERE };
  const results = searchHotels(priced);
  const saved = ids.flatMap((id) => results.filter((result) => result.hotel.id === id));
  return (
    <div className="guest-stack">
      <div className="guest-page-title">
        <h1>Saved hotels</h1>
        {saved.length || onDevice ? <p>{saved.length ? `Priced for ${stayDatesLabel(search.checkIn, search.checkOut)}.` : ''}{onDevice ? `${saved.length ? ' ' : ''}Kept on this phone.` : ''}</p> : null}
      </div>
      {saved.length ? (
        <div className="sb-results__list">
          {saved.map((result) => <HotelResultCard key={result.hotel.id} result={result} search={priced} onOpen={() => onOpenHotel(result.hotel.id)} />)}
        </div>
      ) : (
        <div className="sb-saved-empty">
          <Heart weight="duotone" aria-hidden="true" />
          <b>Nothing saved yet</b>
          <small>Hotels you heart show up here, with today’s prices for your dates.</small>
          <button type="button" className="guest-button guest-button--secondary" onClick={onBrowse}>Browse partner hotels</button>
        </div>
      )}
    </div>
  );
}
