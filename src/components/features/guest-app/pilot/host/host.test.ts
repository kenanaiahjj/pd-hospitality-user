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

  it('lets the day begin earlier while nothing is booked, and keeps guests and faults', () => {
    const host = new Host(start, null, true);
    const { stayId } = host.ensureGuest(stay);
    host.call('pilot.setGateway', { mode: 'fail' });
    host.setTime(hostClock('2026-11-11', 8));
    expect(host.now()).toBe(hostClock('2026-11-11', 8));
    expect(host.pilot.stay(stayId).room).toBe('304');
    expect(host.pilot.gateway.mode).toBe('fail');
  });

  it('does not rewrite the past once something is booked', () => {
    const host = new Host(start, null, true);
    const { guestId } = host.ensureGuest(stay);
    host.call('guest.request', guestId, { listingId: 'cafe', date: '2026-11-12', time: '09:00', qty: 2 });
    host.setTime(hostClock('2026-11-11', 8));
    expect(host.now()).toBe(start);
    expect(host.pilot.bookings()).toHaveLength(1);
  });

  it('lets go of a record it cannot replay instead of breaking', () => {
    const bad = { v: 1 as const, catalog: 'x', start, guests: {}, ops: [{ path: 'vendor.confirm', args: ['nobody', 'BK-9'], t0: start }, { path: 'pilot.thisDoesNotExist', args: [], t0: start }] };
    const host = new Host(start, bad, true);
    expect(host.pilot.bookings()).toHaveLength(0);
    expect(host.now()).toBe(start);
  });

  it('keeps the stay in step with the app', () => {
    const host = new Host(start, null, true);
    const { stayId } = host.ensureGuest(stay);
    host.ensureGuest({ ...stay, checkOut: '2026-11-13', room: '512' });
    expect(host.pilot.stay(stayId)).toMatchObject({ checkOut: '2026-11-13', room: '512' });
  });
});
