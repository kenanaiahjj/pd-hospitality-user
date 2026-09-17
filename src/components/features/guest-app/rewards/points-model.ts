import {
  PROTOTYPE_TODAY,
  formatPesoAmount,
  getRewards,
  parsePesoAmount,
} from '../prototype-model';
import type { GuestSession, PastStay } from '../prototype-model';

/*
  The points ledger.

  Pure by the same contract `prototype-model.ts` holds -- no React, no browser
  API, no clock. Nothing a guest has earned is stored: the balance is derived
  from the stays and bookings that earned it every time it is read, so it
  cannot drift from the history it claims to summarise and it follows the
  prototype's stay-state switch instead of surviving it.

  What is stored is what derivation cannot recover -- redemptions -- and that
  lives on the session under `rewards`.
*/

export type PointsEarnSource =
  | 'stay-direct'
  | 'stay-ota'
  | 'in-app-booking'
  | 'room-scan'
  | 'pre-registration'
  | 'stay-survey';

export type PointsEntry = {
  id: string;
  /** ISO date, so the ledger can be ordered without parsing prose. */
  date: string;
  title: string;
  detail: string;
  source: PointsEarnSource | 'redemption';
  /** Negative for a redemption. */
  points: number;
};

export type Reward = {
  id: string;
  title: string;
  detail: string;
  points: number;
  /**
   * What it costs in money, where it has a price at all. The gap between this
   * and what the floor would charge is the entire reason the currency is
   * points: a room upgrade costs the property an empty night, not its rate.
   */
  cashPrice?: string;
};

/**
 * Points per ₱100 of spend, so the rate and the percentage are the same number.
 *
 * The differential is the whole commercial point: a direct booking pays more
 * than three times what an OTA one does, and that gap is still a fraction of
 * the commission an OTA takes.
 */
export const POINTS_PER_100 = {
  'stay-direct': 70,
  'stay-ota': 20,
  'in-app-booking': 50,
} as const;

/** Flat earns that cost the property no cash and save it real desk time. */
export const BEHAVIOUR_POINTS = {
  'room-scan': 1000,
  'pre-registration': 1500,
  'stay-survey': 1000,
} as const;

/** The floor: 1,000 points is ₱100 off anything, and spends in whole blocks. */
export const POINTS_FLOOR_BLOCK = 1000;
export const POINTS_FLOOR_PESOS = 100;

export const POINTS_EXPIRY_MONTHS = 24;

/**
 * Priced below what the floor would charge, because these cost the property
 * inventory rather than money. `points-model.test.ts` holds that line.
 */
export const REWARD_MENU: Reward[] = [
  { id: 'late-checkout', title: 'Late checkout to 2 PM', detail: 'Subject to availability', points: 4000 },
  { id: 'breakfast-two', title: 'Breakfast for two', detail: 'Kape Manila Café', points: 5000, cashPrice: '₱1,160' },
  { id: 'airport-transfer', title: 'Airport transfer', detail: 'Hotel arranged', points: 8000, cashPrice: '₱1,200' },
  { id: 'room-upgrade', title: 'Room upgrade, one night', detail: 'Subject to availability', points: 12000 },
  { id: 'hilom-massage', title: 'Hilom signature massage', detail: '60 minutes', points: 16000, cashPrice: '₱2,400' },
  { id: 'couples-suite', title: 'Couples massage suite', detail: '90 minutes, two guests', points: 32000, cashPrice: '₱4,600' },
];

/**
 * Floored per line, never on a total.
 *
 * A guest earns on each transaction. Summing first and flooring once quietly
 * pays out the fractions of every line at the same time, which is both wrong
 * and impossible to reconcile against a receipt.
 */
const pointsFor = (amount: string, rate: number): number =>
  Math.floor(parsePesoAmount(amount) / 100) * rate;

/** Only a booking the property sold itself earns the direct rate. */
const isDirect = (source: string): boolean => source === 'Direct booking';

/**
 * Narrower than `PointsEarnSource` on purpose: a room is sold one of two ways,
 * and the wider type let `POINTS_PER_100[...]` be indexed with `room-scan`,
 * which has no rate at all.
 */
type RoomEarnSource = Extract<PointsEarnSource, 'stay-direct' | 'stay-ota'>;

const roomRateFor = (stay: PastStay): RoomEarnSource =>
  isDirect(stay.source) ? 'stay-direct' : 'stay-ota';

/** What one settled stay earned: its room at its own rate, then everything on it. */
export function earnedForStay(stay: PastStay): number {
  const room = pointsFor(stay.roomRate, POINTS_PER_100[roomRateFor(stay)]);
  /*
    Every charge earns at the in-app rate. A settled stay does not record how
    each line was booked, so this credits a few the property posted itself --
    a shipped ledger carries the origin per charge and pays 0 for those.
  */
  const extras = stay.charges.reduce(
    (sum, charge) => sum + pointsFor(charge.amount, POINTS_PER_100['in-app-booking']),
    0,
  );
  return room + extras;
}

/**
 * What the same stay would have earned booked direct, or nothing to say if it
 * already was.
 *
 * Stated on a receipt for a stay already taken, where it cannot be argued
 * with -- not as a prompt before one.
 */
export function directCounterfactual(stay: PastStay): number | undefined {
  if (isDirect(stay.source)) return undefined;
  return pointsFor(stay.roomRate, POINTS_PER_100['stay-direct']);
}

/** Every earn and every spend, newest first. */
export function buildPointsLedger(session: GuestSession): PointsEntry[] {
  const entries: PointsEntry[] = [];

  for (const stay of session.pastStays) {
    entries.push({
      id: `stay-${stay.id}`,
      date: stay.checkOut,
      title: stay.property,
      detail: `${stay.nights} ${stay.nights === 1 ? 'night' : 'nights'} · ${stay.source}`,
      source: roomRateFor(stay),
      points: earnedForStay(stay),
    });
  }

  /*
    A stay that has settled already counted its services as charges:
    `toFinishedStay` copies them across and leaves them on the session, so
    paying for both would pay twice for one massage.
  */
  const settled = new Set(session.pastStays.map((stay) => stay.id));

  for (const service of session.serviceBookings) {
    // Nothing is owed for something the guest called off.
    if (service.status === 'cancelled') continue;
    if (settled.has(service.bookingId)) continue;

    entries.push({
      id: `service-${service.id}`,
      date: service.scheduledDate,
      title: service.title,
      detail: service.scheduledFor,
      source: 'in-app-booking',
      points: pointsFor(service.amount, POINTS_PER_100['in-app-booking']),
    });
  }

  for (const booking of session.bookings) {
    if (booking.roomVerification) {
      entries.push({
        id: `scan-${booking.id}`,
        date: booking.roomVerification.at,
        title: 'Room code scanned',
        detail: booking.property,
        source: 'room-scan',
        points: BEHAVIOUR_POINTS['room-scan'],
      });
    }

    if (booking.preArrivalTotal > 0 && booking.preArrivalCompleted >= booking.preArrivalTotal) {
      entries.push({
        id: `prereg-${booking.id}`,
        date: booking.checkIn,
        title: 'Checked in before arriving',
        detail: booking.property,
        source: 'pre-registration',
        points: BEHAVIOUR_POINTS['pre-registration'],
      });
    }
  }

  for (const review of session.reviews) {
    entries.push({
      id: `survey-${review.bookingId}`,
      date: review.submittedAt,
      title: 'Stay survey',
      detail: 'Thank you for the notes',
      source: 'stay-survey',
      points: BEHAVIOUR_POINTS['stay-survey'],
    });
  }

  for (const redemption of getRewards(session).redemptions) {
    entries.push({
      id: `redemption-${redemption.id}`,
      date: redemption.redeemedAt,
      title: redemption.title,
      detail: 'Redeemed',
      source: 'redemption',
      points: -redemption.points,
    });
  }

  return entries.sort((a, b) => b.date.localeCompare(a.date));
}

export function pointsBalance(session: GuestSession): number {
  return buildPointsLedger(session).reduce((sum, entry) => sum + entry.points, 0);
}

/**
 * What the balance is worth against a bill, in whole ₱100 blocks.
 *
 * Deliberately not the proportional value: 37,220 points spends ₱3,700, and
 * showing ₱3,722 would promise ₱22 the guest cannot actually take off
 * anything.
 */
export function pointsAsPesos(points: number): string {
  return formatPesoAmount(Math.floor(points / POINTS_FLOOR_BLOCK) * POINTS_FLOOR_PESOS);
}

export function affordableRewards(balance: number): Reward[] {
  return REWARD_MENU.filter((reward) => reward.points <= balance);
}

/**
 * Two years past the latest stay on file, so the clock restarts every time a
 * guest travels: a balance only expires once someone has actually stopped.
 */
export function pointsExpiry(session: GuestSession): string {
  const dates = [
    ...session.pastStays.map((stay) => stay.checkOut),
    ...session.bookings.map((booking) => booking.checkOut),
  ].sort();
  const latest = dates[dates.length - 1] ?? PROTOTYPE_TODAY;

  const [year, month, day] = latest.split('-').map(Number) as [number, number, number];
  const shifted = month - 1 + POINTS_EXPIRY_MONTHS;
  const pad = (value: number) => String(value).padStart(2, '0');

  return `${year + Math.floor(shifted / 12)}-${pad((shifted % 12) + 1)}-${pad(day)}`;
}

/**
 * Takes a reward off the menu, or returns the session untouched.
 *
 * The guard lives here and not only on the control that calls it: a view that
 * forgets to disable a button should not be able to drive the balance
 * negative.
 */
export function redeemReward(
  session: GuestSession,
  reward: Reward,
  today: string = PROTOTYPE_TODAY,
): GuestSession {
  if (pointsBalance(session) < reward.points) return session;

  const rewards = getRewards(session);

  return {
    ...session,
    rewards: {
      ...rewards,
      redemptions: [
        ...rewards.redemptions,
        {
          id: `${reward.id}-${rewards.redemptions.length + 1}`,
          rewardId: reward.id,
          title: reward.title,
          points: reward.points,
          redeemedAt: today,
        },
      ],
    },
  };
}
