import { describe, expect, it } from 'vitest';

import { ANONYMOUS_SESSION, MOCK_SESSION, RESTAURANTS, SERVICES } from '../prototype-model';
import {
  BADGES,
  badgeProgress,
  earnedBadges,
  muteBadge,
  nearlyEarnedBadges,
} from './badge-model';

const progressFor = (id: string, session = MOCK_SESSION) =>
  badgeProgress(session).find((row) => row.definition.id === id)!;

describe('the badge set', () => {
  it('gives every badge a unique id', () => {
    expect(new Set(BADGES.map((badge) => badge.id)).size).toBe(BADGES.length);
  });

  it('gives every badge a positive threshold', () => {
    for (const badge of BADGES) {
      expect(badge.threshold, badge.id).toBeGreaterThan(0);
    }
  });

  /*
    The guard that stops a typo quietly making a badge unearnable. A badge
    pointing at a service that does not exist never counts, never errors, and
    looks to the guest exactly like one they simply have not earned.
  */
  it('names only ids the catalogue actually holds', () => {
    const known = new Set([
      ...SERVICES.map((service) => service.id),
      ...RESTAURANTS.map((venue) => venue.id),
    ]);

    for (const badge of BADGES) {
      for (const id of badge.qualifyingIds ?? []) {
        expect(known.has(id), `${badge.id} names unknown catalogue id "${id}"`).toBe(true);
      }
    }
  });

});

describe('derivation', () => {
  it('reports zero for a guest with no history, rather than throwing', () => {
    expect(() => badgeProgress(ANONYMOUS_SESSION)).not.toThrow();
    expect(badgeProgress(ANONYMOUS_SESSION).every((row) => row.count === 0)).toBe(true);
    expect(earnedBadges(ANONYMOUS_SESSION)).toEqual([]);
  });

  it('counts what the reference guest actually booked', () => {
    // Azotea, Kape Manila, Apartment 1B and the Poolside Bar.
    expect(progressFor('foodie').count).toBeGreaterThanOrEqual(3);
    expect(progressFor('foodie').earned).toBe(true);
  });

  /* She cancelled the café booking. It cannot earn her anything. */
  it('ignores a booking the guest cancelled', () => {
    const cancelled = MOCK_SESSION.serviceBookings.find((entry) => entry.status === 'cancelled')!;
    expect(cancelled.serviceId).toBe('cafe');

    const withOnlyTheCancelled = {
      ...MOCK_SESSION,
      pastStays: [],
      serviceBookings: [cancelled],
    };
    expect(progressFor('caffeine', withOnlyTheCancelled).count).toBe(0);
  });

  it('counts an evening booking by its hour, not by its prose', () => {
    expect(progressFor('night-owl').evidence.length).toBe(progressFor('night-owl').count);
    expect(progressFor('night-owl').count).toBeGreaterThan(0);
  });

  /*
    The estate is Manila (Luzon), Cebu and Dumaguete (both Visayas). There is
    no Mindanao property, so this sits at two of three by design -- a stretch
    goal, not a defect. It starts being earnable the day one opens.
  */
  it('leaves Luzon to Mindanao short, because no Mindanao property exists', () => {
    const row = progressFor('luzon-to-mindanao');
    expect(row.count).toBe(2);
    expect(row.earned).toBe(false);
  });

  it('holds thirteen badges for the reference guest', () => {
    expect(earnedBadges(MOCK_SESSION).map((row) => row.definition.id)).toEqual([
      'foodie', 'sundowner', 'night-owl', 'wellness', 'pair', 'weekender',
      'direct-booker', 'switched', 'regular', 'island-hopper', 'homecoming',
      'self-sufficient', 'venue-regular',
    ]);
  });

  it('puts six badges within one step, nearest first', () => {
    expect(nearlyEarnedBadges(MOCK_SESSION).map((row) => row.definition.id)).toEqual([
      // All six are one event away, so they hold their declaration order.
      'homegrown', 'culture', 'solo', 'spontaneous', 'pre-checked', 'luzon-to-mindanao',
    ]);
  });

  /*
    A badge worth a single event sits one event from earned the moment an
    account is opened. Eight of those would crowd out the six the guest is
    genuinely close to.
  */
  it('does not call an untouched badge nearly earned', () => {
    const host = progressFor('host');
    expect(host.count).toBe(0);
    expect(host.definition.threshold).toBe(1);
    expect(nearlyEarnedBadges(MOCK_SESSION).map((row) => row.definition.id)).not.toContain('host');
  });

  it('points an in-progress badge at something bookable', () => {
    for (const row of nearlyEarnedBadges(MOCK_SESSION)) {
      if (!row.definition.qualifyingIds) continue;
      expect(row.nextStep, `${row.definition.id} has nothing to suggest`).toBeDefined();
    }
  });

  it('never suggests something the guest already booked', () => {
    const wellness = progressFor('wellness');
    expect(wellness.nextStep).not.toBe('spa');
  });
});

describe('correction', () => {
  it('mutes once, however many times it is asked', () => {
    const twice = muteBadge(muteBadge(MOCK_SESSION, 'foodie'), 'foodie');
    expect(twice.rewards?.mutedBadges).toEqual(['foodie']);
  });
});
