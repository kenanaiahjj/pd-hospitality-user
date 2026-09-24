import { describe, expect, it } from 'vitest';

import { MOCK_SESSION, PAST_STAYS } from '../prototype-model';
import {
  REWARD_MENU,
  affordableRewards,
  buildPointsLedger,
  earnedForStay,
  pointsAsPesos,
  pointsBalance,
  pointsExpiry,
  redeemReward,
} from './points-model';

const reward = (id: string) => REWARD_MENU.find((entry) => entry.id === id)!;

describe('earning', () => {
  it('does not pay points for a charge posted by the property', () => {
    const [posted, ...booked] = PAST_STAYS[0]!.charges;
    const stay = {
      ...PAST_STAYS[0]!,
      charges: [
        { ...posted!, pointsSource: 'property-posted' as const },
        ...booked,
      ],
    };

    // The direct room rate and the remaining four in-app charges still earn.
    expect(earnedForStay(stay)).toBe(22370 - 2400);
  });

  it('pays points for room upgrades and extensions booked in the app', () => {
    const booking = {
      ...MOCK_SESSION.bookings[0]!,
      roomVerification: undefined,
      preArrivalCompleted: 0,
      preArrivalTotal: 0,
      inAppCharges: [
        { id: 'upgrade-1', title: 'Room upgrade', detail: 'Deluxe King Room', amount: '₱3,600', date: '2026-11-11' },
        { id: 'extension-1', title: 'Stay extension', detail: '1 additional night', amount: '₱5,000', date: '2026-11-11' },
      ],
    };
    const session = {
      ...MOCK_SESSION,
      bookings: [booking],
      pastStays: [],
      serviceBookings: [],
    };

    expect(pointsBalance(session)).toBe(4_300);
  });

});

describe('the ledger', () => {
  it('pays nothing for a booking the guest cancelled', () => {
    const cancelled = MOCK_SESSION.serviceBookings.find((entry) => entry.status === 'cancelled');
    expect(cancelled).toBeDefined();
    expect(buildPointsLedger(MOCK_SESSION).some((entry) => entry.id.includes(cancelled!.id)))
      .toBe(false);
  });

  /*
    `toFinishedStay` copies service bookings into the settled stay's charges
    without removing them from the session, so a stay that has settled would
    otherwise be paid for twice -- once as a booking and again as a charge.
  */
  it('pays once for a service whose stay has already settled', () => {
    const settled = {
      ...MOCK_SESSION,
      serviceBookings: [{
        ...MOCK_SESSION.serviceBookings[0]!,
        bookingId: PAST_STAYS[0]!.id,
      }],
    };
    expect(pointsBalance(settled)).toBe(pointsBalance({ ...settled, serviceBookings: [] }));
  });

  it('expires the balance two years past the latest stay', () => {
    expect(pointsExpiry(MOCK_SESSION)).toBe('2028-11-12');
  });
});

describe('spending', () => {
  it('states the floor value in whole ₱100 blocks, never more than is spendable', () => {
    expect(pointsAsPesos(37220)).toBe('₱3,700');
    expect(pointsAsPesos(30000)).toBe('₱3,000');
    expect(pointsAsPesos(900)).toBe('₱0');
  });

  it('refuses a redemption the balance cannot cover, rather than going negative', () => {
    const broke = { ...MOCK_SESSION, pastStays: [], serviceBookings: [], bookings: [] };
    expect(pointsBalance(broke)).toBe(0);
    expect(redeemReward(broke, reward('hilom-massage'))).toBe(broke);
  });

  it('offers only what the balance covers', () => {
    expect(affordableRewards(5000).map((entry) => entry.id))
      .toEqual(['late-checkout', 'breakfast-two']);
    expect(affordableRewards(0)).toEqual([]);
  });

  it('prices every reward below what the floor would charge for it', () => {
    for (const entry of REWARD_MENU) {
      if (!entry.cashPrice) continue;
      const atFloor = entry.points / 10;
      expect(atFloor, `${entry.id} is not worth more than cash`)
        .toBeLessThan(Number(entry.cashPrice.replace(/[^\d]/g, '')));
    }
  });
});
