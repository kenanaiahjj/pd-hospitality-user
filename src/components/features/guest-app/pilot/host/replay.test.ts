import { beforeEach, describe, expect, it } from 'vitest';
import { makeRng } from '../engine';
import type { Booking, Pilot } from '../types';
import { Host, hostClock } from './host';

/*
  The record is the only thing a reload has. This plays a long random session
  through the host, then rebuilds from what it stored (after the JSON round
  trip a browser gives it) and demands the same world: bookings, payments,
  threads, desk tasks, notifications and the clock.
*/

const STORAGE_KEY = 'cabana.pilot-host.v1';
const start = hostClock('2026-11-11', 14);
const MIN = 60_000;

const snapshot = (p: Pilot) => ({
  now: p.now(),
  bookings: p.bookings().map((b) => ({ id: b.id, status: b.status, amount: b.amount, qty: b.qty, start: b.start, payMode: b.payMode, payments: b.paymentIds })),
  payments: p.payments().map((x) => ({ id: x.id, state: x.state, amount: x.amount, tries: x.tries })),
  threads: p.threads('guest', p.bookings()[0]?.guestId ?? 'none').map((t) => `${t.id}:${t.unread}:${t.cardState}`),
  messages: p.bookings().map((b) => (p.thread(b.threadId, 'desk').ok ? (p.thread(b.threadId, 'desk') as { messages: { text: string }[] }).messages.map((m) => m.text).join('|') : '')),
  tasks: p.tasks().map((t) => `${t.id}:${t.kind}:${t.status}`),
  outbox: p.outbox().map((n) => `${n.to}:${n.channel}:${n.topic}:${n.delivered}`),
  folio: p.bookings().map((b) => p.foliosTotal(b.stayId)),
});

const LISTINGS = ['rental', 'cafe', 'rooftop', 'spa', 'tour', 'laundry', 'city-bike-rentals', 'gift-0', 'trainer', 'music'];

function session(seed: number, steps: number) {
  const rng = makeRng(seed);
  const pick = <T,>(xs: T[]) => xs[Math.floor(rng() * xs.length)]!;
  const host = new Host(start, null, true);
  const stays = [
    host.ensureGuest({ id: 'a', firstName: 'Ana', room: '304', checkIn: '2026-11-09', checkOut: '2026-11-12', status: 'in-house' }),
    host.ensureGuest({ id: 'b', firstName: 'Ben', room: '', checkIn: '2026-11-20', checkOut: '2026-11-23', status: 'booked' }),
  ];
  for (let i = 0; i < steps; i += 1) {
    const roll = rng();
    const p = host.pilot;
    const stay = pick(stays);
    const live = p.bookings();
    const b: Booking | undefined = live.length ? pick(live) : undefined;
    const vendorOf = (x: Booking) => p.listing(x.listingId).vendorId;
    if (roll < 0.22) {
      const id = pick(LISTINGS);
      const listing = p.listing(id);
      const date = pick(['2026-11-11', '2026-11-12', '2026-11-13', '2026-11-21']);
      host.call('guest.request', stay.guestId, { listingId: id, date, time: listing.times.length ? pick(listing.times) : undefined, qty: 1 + Math.floor(rng() * 3), days: listing.kind === 'rental' ? 1 : undefined, payMode: pick(['room', 'card', undefined]), note: rng() < 0.3 ? 'a note' : undefined, discount: rng() < 0.1 ? 100 : undefined, origin: 'app' });
    } else if (b && roll < 0.34) host.call('vendor.confirm', vendorOf(b), b.id);
    else if (b && roll < 0.38) host.call('vendor.decline', vendorOf(b), b.id, 'Fully booked');
    else if (b && roll < 0.46) { host.setMeta(`method:${b.paymentIds[0] ?? 'x'}`, pick(['card', 'gcash', 'maya'])); host.call('guest.payCard', b.guestId, b.id); }
    else if (b && roll < 0.52) host.call('guest.cancel', b.guestId, b.id);
    else if (b && roll < 0.56) host.call('vendor.scan', vendorOf(b), b.id);
    else if (b && roll < 0.6) host.call('vendor.addExtra', vendorOf(b), b.id, 100 + Math.floor(rng() * 400), 'Late fee');
    else if (b && roll < 0.64) host.call('vendor.message', vendorOf(b), b.threadId, 'hello');
    else if (b && roll < 0.67) host.call('desk.messageBooking', b.threadId, 'noted');
    else if (b && roll < 0.7) host.call('desk.privateNote', vendorOf(b), 'be nice', b.id);
    else if (b && roll < 0.73) host.call('guest.send', b.guestId, b.threadId, 'a question');
    else if (b && roll < 0.76) host.call('desk.approve', b.id);
    else if (b && roll < 0.78) host.call('vendor.cancel', vendorOf(b), b.id, 'Breakdown');
    else if (b && roll < 0.8) host.call('race.withdrawAndConfirm', b.guestId, vendorOf(b), b.id);
    else if (roll < 0.82) host.call('pilot.setPms', { mode: pick(['up', 'down', 'reject']), dropNextReply: rng() < 0.2 });
    else if (roll < 0.84) host.call('pilot.setGateway', { mode: pick(['ok', 'fail', 'abandon']), loseCallbacks: rng() < 0.2 });
    else if (roll < 0.86) host.call('pilot.setGuestNotifications', stay.guestId, rng() < 0.5);
    else if (roll < 0.88) host.call('desk.resolveTask', p.tasks('open')[0]?.id ?? 'none');
    else if (b && roll < 0.9) host.call('pilot.thread', b.threadId, 'guest');
    else host.call('pilot.advanceTo', p.now() + (1 + Math.floor(rng() * 90)) * MIN);
  }
  return host;
}

describe('rebuilding from the record', () => {
  beforeEach(() => window.localStorage.clear());

  for (const seed of [1, 7, 42, 2026, 31337]) {
    it(`matches the live engine after 250 random actions (seed ${seed})`, () => {
      const host = session(seed, 250);
      const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY)!);
      // Not vacuous: the session has to have booked, paid and been answered.
      expect(host.pilot.bookings().length).toBeGreaterThan(8);
      expect(host.pilot.payments().length).toBeGreaterThan(3);
      const again = new Host(start, stored, false);
      expect(snapshot(again.pilot)).toEqual(snapshot(host.pilot));
      expect(again.pilot.invariants()).toEqual([]);
    });
  }
});
