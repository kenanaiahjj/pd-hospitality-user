import { afterEach, describe, expect, it, vi } from 'vitest';

import { MOCK_SESSION } from './prototype-model';
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
    A private window throws on access rather than returning null, so every entry
    point has to survive the store itself being hostile.
  */
  it('survives a store that throws on every access', () => {
    vi.spyOn(window.localStorage, 'getItem').mockImplementation(() => {
      throw new Error('access denied');
    });
    vi.spyOn(window.localStorage, 'setItem').mockImplementation(() => {
      throw new Error('access denied');
    });
    vi.spyOn(window.localStorage, 'removeItem').mockImplementation(() => {
      throw new Error('access denied');
    });

    expect(() => writeStoredSession(MOCK_SESSION)).not.toThrow();
    expect(readStoredSession()).toBeUndefined();
    expect(() => clearStoredSession()).not.toThrow();
  });
});
