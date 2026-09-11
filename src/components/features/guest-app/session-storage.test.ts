import { afterEach, describe, expect, it, vi } from 'vitest';

import { MOCK_SESSION, verifyRoomPresence } from './prototype-model';
import {
  SESSION_STORAGE_KEY,
  clearStoredSession,
  readStoredSession,
  writeStoredSession,
} from './session-storage';

afterEach(() => {
  window.localStorage.clear();
  vi.restoreAllMocks();
});

describe('session storage', () => {
  it('round-trips a session', () => {
    writeStoredSession(MOCK_SESSION);

    const restored = readStoredSession();

    expect(restored?.guestName).toBe('Ana Santos');
    expect(restored?.auth).toBe('authenticated');
    expect(restored?.bookings.map((booking) => booking.id)).toEqual([
      'HEN-241109',
      'HEN-CEBU-240615',
    ]);
  });

  it('reads nothing when nothing was written', () => {
    expect(readStoredSession()).toBeUndefined();
  });

  it('ignores records written by the previous session shape', () => {
    window.localStorage.setItem('cabana.guest-session.v2', JSON.stringify(MOCK_SESSION));

    expect(readStoredSession()).toBeUndefined();
  });

  it('discards a record that is not JSON', () => {
    window.localStorage.setItem(SESSION_STORAGE_KEY, 'not-json{');

    expect(readStoredSession()).toBeUndefined();
  });

  /*
    The guard earns its place here: a record shaped like a session but missing
    the collections the app maps over would otherwise reach a `.map()` on a
    screen and take the whole prototype down.
  */
  it('discards a record missing the collections the app maps over', () => {
    window.localStorage.setItem(
      SESSION_STORAGE_KEY,
      JSON.stringify({ ...MOCK_SESSION, serviceBookings: undefined }),
    );

    expect(readStoredSession()).toBeUndefined();
  });

  it('discards a record missing a collection a later version added', () => {
    // Each bump exists because a screen now maps over something the old
    // shape does not carry -- reviews at v4, stay history at v5.
    for (const field of ['reviews', 'pastStays']) {
      const stale: Record<string, unknown> = { ...MOCK_SESSION };
      delete stale[field];
      window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(stale));

      expect(readStoredSession()).toBeUndefined();
    }
  });

  it('round-trips a room verification, so an unlock survives a reload', () => {
    const scanned = verifyRoomPresence(MOCK_SESSION, 'HEN-241109', 'scan', '2026-11-11');
    writeStoredSession(scanned);

    const restored = readStoredSession();

    expect(restored?.bookings.find((booking) => booking.id === 'HEN-241109')?.roomVerification)
      .toEqual({ method: 'scan', at: '2026-11-11' });
  });

  it('discards a record whose auth state is not one the app branches on', () => {
    window.localStorage.setItem(
      SESSION_STORAGE_KEY,
      JSON.stringify({ ...MOCK_SESSION, auth: 'superuser' }),
    );

    expect(readStoredSession()).toBeUndefined();
  });

  it('clears what it wrote', () => {
    writeStoredSession(MOCK_SESSION);
    clearStoredSession();

    expect(readStoredSession()).toBeUndefined();
  });

  /*
    Two different hostile stores, because they fail at different depths and only
    one of them is caught by wrapping the calls.

    A browser with site data blocked throws on the *property* -- `window.
    localStorage` itself is a SecurityError -- which is why `getStore()` has a
    try/catch of its own rather than only the call sites.

    Note these stub `Storage.prototype`, not the instance: jsdom's localStorage
    is a Proxy, so an own-property spy on it is silently never consulted.
  */
  it('survives a store whose methods throw', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('quota');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota');
    });
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw new Error('quota');
    });

    expect(() => writeStoredSession(MOCK_SESSION)).not.toThrow();
    expect(readStoredSession()).toBeUndefined();
    expect(() => clearStoredSession()).not.toThrow();
  });

  it('survives a browser that throws on reaching localStorage at all', () => {
    const original = Object.getOwnPropertyDescriptor(window, 'localStorage');

    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      get() {
        throw new Error('site data blocked');
      },
    });

    try {
      expect(() => writeStoredSession(MOCK_SESSION)).not.toThrow();
      expect(readStoredSession()).toBeUndefined();
      expect(() => clearStoredSession()).not.toThrow();
    } finally {
      if (original) Object.defineProperty(window, 'localStorage', original);
    }
  });
});
