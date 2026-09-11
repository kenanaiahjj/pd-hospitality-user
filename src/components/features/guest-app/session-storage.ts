import type { GuestSession } from './prototype-model';

/*
  Browser-only sibling to `prototype-model.ts`, which is pure by contract --
  no React, no browser APIs, no network. Persistence needs `localStorage`, so
  it lives here rather than bending that rule.
*/

/**
 * Versioned on purpose. `GuestSession` gains fields as the prototype grows, and
 * a record written by an older shape is not worth migrating for a demo -- bump
 * the suffix and every stale record is silently discarded on read.
 *
 * v3: SSO replaces legacy credential entry and the session shape is reset.
 */
export const SESSION_STORAGE_KEY = 'cabana.guest-session.v3';

/**
 * Every entry point is wrapped, because `localStorage` is not merely absent on
 * the server: a browser with site data blocked, a Safari private window, or an
 * iframe with third-party storage partitioned all *throw* on property access,
 * not on the read. A prototype that white-screens because someone opened it in
 * a private tab is worse than one that forgets who they are.
 */
function getStore(): Storage | undefined {
  try {
    return typeof window === 'undefined' ? undefined : window.localStorage;
  } catch {
    return undefined;
  }
}

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/**
 * A structural guard rather than a schema.
 *
 * This checks the fields the app actually dereferences -- the four collections
 * it maps over, the two enums it branches on, the preferences object it reads
 * through. It does not validate a `Booking`'s interior. The point is to keep a
 * corrupt or half-written record from reaching a `.map()` and white-screening
 * the demo, not to prove the record is true.
 */
function isStoredSession(value: unknown): value is GuestSession {
  if (!isObject(value)) return false;

  const authStates = ['anonymous', 'authenticated'];
  const accountStates = ['none', 'new', 'returning'];

  return (
    typeof value.guestName === 'string'
    && typeof value.email === 'string'
    && typeof value.folioTotal === 'string'
    && typeof value.auth === 'string'
    && authStates.includes(value.auth)
    && typeof value.accountStatus === 'string'
    && accountStates.includes(value.accountStatus)
    && Array.isArray(value.bookings)
    && Array.isArray(value.serviceBookings)
    && Array.isArray(value.additionalGuests)
    && isObject(value.roomPreferences)
    && Array.isArray((value.roomPreferences as Record<string, unknown>).accessibility)
  );
}

/** The stored session, or `undefined` for anything this cannot trust. */
export function readStoredSession(): GuestSession | undefined {
  const store = getStore();
  if (!store) return undefined;

  try {
    const raw = store.getItem(SESSION_STORAGE_KEY);
    if (!raw) return undefined;

    const parsed: unknown = JSON.parse(raw);
    return isStoredSession(parsed) ? parsed : undefined;
  } catch {
    // Unparseable JSON, or a store that threw on read. Either way: start fresh.
    return undefined;
  }
}

export function writeStoredSession(session: GuestSession): void {
  const store = getStore();
  if (!store) return;

  try {
    store.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
  } catch {
    // Quota exceeded, or a store that refuses writes. The session still lives
    // in React state for this visit; only its survival of a reload is lost.
  }
}

export function clearStoredSession(): void {
  const store = getStore();
  if (!store) return;

  try {
    store.removeItem(SESSION_STORAGE_KEY);
  } catch {
    // Nothing to do -- there is no way to clear a store that will not be written.
  }
}
