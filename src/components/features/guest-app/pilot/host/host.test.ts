import { beforeEach, describe, expect, it } from 'vitest';
import { Host, hostClock } from './host';

/*
  The host's promise: the record it keeps rebuilds the same world. That is what
  lets a reload keep a guest's bookings, and the prototype clock step backward.
*/

const stay = { id: 'bk-1', firstName: 'Ana', room: '304', checkIn: '2026-11-09', checkOut: '2026-11-12', status: 'in-house' as const };
const start = hostClock('2026-11-11', 14);
const STORAGE_KEY = 'cabana.pilot-host.v1';

const stored = () => JSON.parse(window.localStorage.getItem(STORAGE_KEY)!);

describe('the pilot host', () => {
  beforeEach(() => window.localStorage.clear());

  it('rebuilds the same bookings from its record', () => {
    const host = new Host(start, null, true);
    const { guestId } = host.ensureGuest(stay);
    const made = host.call<{ ok: true; bookingId: string }>('guest.request', guestId, { listingId: 'rental', date: '2026-11-12', time: '10:00', qty: 2, payMode: 'room' });
    expect(made.ok).toBe(true);
    host.call('vendor.confirm', host.pilot.listing('rental').vendorId, made.bookingId);
    host.setTime(hostClock('2026-11-11', 15));

    const again = new Host(start, stored(), false);
    expect(again.pilot.booking(made.bookingId).status).toBe(host.pilot.booking(made.bookingId).status);
    expect(again.pilot.payments(made.bookingId).map((p) => `${p.id}:${p.state}:${p.amount}`)).toEqual(host.pilot.payments(made.bookingId).map((p) => `${p.id}:${p.state}:${p.amount}`));
    expect(again.now()).toBe(host.now());
  });

  it('steps back in time, dropping what happened after', () => {
    const host = new Host(start, null, true);
    const { guestId } = host.ensureGuest(stay);
    const early = host.call<{ bookingId: string }>('guest.request', guestId, { listingId: 'cafe', date: '2026-11-12', time: '09:00', qty: 2 });
    host.setTime(hostClock('2026-11-11', 18));
    const late = host.call<{ bookingId: string }>('guest.request', guestId, { listingId: 'rooftop', date: '2026-11-12', time: '19:30', qty: 2 });
    expect(host.pilot.bookings()).toHaveLength(2);
    host.setTime(hostClock('2026-11-11', 16));
    expect(host.pilot.bookings().map((b) => b.id)).toEqual([early.bookingId]);
    expect(host.pilot.bookings().some((b) => b.id === late.bookingId)).toBe(false);
    expect(host.now()).toBe(hostClock('2026-11-11', 16));
  });

  it('keeps the stay in step with the app', () => {
    const host = new Host(start, null, true);
    const { stayId } = host.ensureGuest(stay);
    host.ensureGuest({ ...stay, checkOut: '2026-11-13', room: '512' });
    expect(host.pilot.stay(stayId)).toMatchObject({ checkOut: '2026-11-13', room: '512' });
  });
});
