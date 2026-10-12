import { describe, expect, it } from 'vitest';
import { createPilot, makeRng } from '../engine';
import type { Booking } from '../types';
import { buildCatalog } from './catalog';
import { hostClock } from './host';

/*
  The nine rules, held on the app's own catalogue: free items, per-booking
  prices, room-only vendors, goods that are ready in half an hour, discounts.
  `paranoid` checks every rule after every action, so the first break stops it.
*/

const MIN = 60_000;
const LISTINGS = ['bike-rental', 'scooter-rental', 'coffee-collective', 'si-senor', 'spa', 'hot-stone', 'tour', 'sunset-cruise', 'laundry', 'luggage', 'music', 'film-night', 'calindagan-car-hire', 'hilot-studio-daro', 'boulevard-seafood-grill', 'gift-0', 'gift-5', 'trainer', 'car-rental'];

describe('the engine on the app’s catalogue, every rule checked after every action', () => {
  for (const seed of [3, 11, 99, 1234]) {
    it(`holds for 600 random actions (seed ${seed})`, () => {
      const rng = makeRng(seed);
      const pick = <T,>(xs: T[]) => xs[Math.floor(rng() * xs.length)]!;
      const p = createPilot({ catalog: buildCatalog(), paranoid: true, seed, start: hostClock('2026-11-11', 14), guestName: 'Placeholder', mariaStay: { checkIn: '2026-01-01', checkOut: '2026-01-02', status: 'checked-out', room: '' } });
      const guests = [
        p.addGuest({ firstName: 'Ana', room: '304', checkIn: '2026-11-09', checkOut: '2026-11-12', status: 'in-house' }),
        p.addGuest({ firstName: 'Ben', room: '', checkIn: '2026-11-20', checkOut: '2026-11-23', status: 'booked' }),
      ];
      for (let i = 0; i < 600; i += 1) {
        const roll = rng();
        const g = pick(guests);
        const list = p.bookings();
        const b: Booking | undefined = list.length ? pick(list) : undefined;
        const vendor = (x: Booking) => p.listing(x.listingId).vendorId;
        if (roll < 0.2) {
          const id = pick(LISTINGS);
          const l = p.listing(id);
          p.guest(g.guestId).request({ listingId: id, date: pick(['2026-11-11', '2026-11-12', '2026-11-13', '2026-11-21']), time: l.times.length ? pick(l.times) : undefined, qty: 1 + Math.floor(rng() * 4), days: l.kind === 'rental' ? 1 : undefined, payMode: pick(['room', 'card', undefined]), discount: rng() < 0.1 ? 200 : undefined, origin: 'app' });
        } else if (b && roll < 0.3) p.vendor(vendor(b)).confirm(b.id);
        else if (b && roll < 0.34) p.vendor(vendor(b)).decline(b.id, 'No');
        else if (b && roll < 0.42) p.guest(b.guestId).payCard(b.id);
        else if (b && roll < 0.48) p.guest(b.guestId).cancel(b.id);
        else if (b && roll < 0.52) p.vendor(vendor(b)).scan(b.id);
        else if (b && roll < 0.55) p.vendor(vendor(b)).addExtra(b.id, 100 + Math.floor(rng() * 400), 'Fee');
        else if (b && roll < 0.58) p.vendor(vendor(b)).complete(b.id);
        else if (b && roll < 0.6) p.vendor(vendor(b)).markNoShow(b.id);
        else if (b && roll < 0.63) p.vendor(vendor(b)).cancel(b.id, 'Breakdown');
        else if (b && roll < 0.66) p.desk.approve(b.id);
        else if (b && roll < 0.68) p.desk.declineApproval(b.id);
        else if (b && roll < 0.7) p.desk.reinstate(b.id);
        else if (b && roll < 0.72) p.desk.markReady(b.id);
        else if (b && roll < 0.74) p.desk.handOver(b.id);
        else if (b && roll < 0.76) p.guest(b.guestId).question(b.paymentIds[0] ?? 'none', 'why');
        else if (roll < 0.78) p.setPms({ mode: pick(['up', 'down', 'reject']), dropNextReply: rng() < 0.2, refuseReversal: rng() < 0.2 });
        else if (roll < 0.8) p.setGateway({ mode: pick(['ok', 'fail', 'abandon']), loseCallbacks: rng() < 0.2, failRefunds: rng() < 0.2 });
        else if (roll < 0.82) p.desk.syncStay(g.stayId, { status: pick(['booked', 'in-house']), room: pick(['', '304', '512']) });
        else if (roll < 0.83) p.desk.shortenStay(g.stayId, pick(['2026-11-10', '2026-11-11']));
        else if (roll < 0.85) p.desk.resolveTask(p.tasks('open')[0]?.id ?? 'none');
        else p.advanceTo(p.now() + (1 + Math.floor(rng() * 120)) * MIN);
      }
      expect(p.bookings().length).toBeGreaterThan(10);
      expect(p.invariants()).toEqual([]);
    });
  }
});
