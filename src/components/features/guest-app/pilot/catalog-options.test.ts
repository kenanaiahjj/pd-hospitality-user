import { describe, expect, it } from 'vitest';
import { createPilot } from './engine';
import type { Listing, Vendor } from './types';

/*
  The engine run on a catalogue it was handed, the way the app runs it: one
  price per booking, hotel-run services that take the room only, free items,
  a goods order ready soon after it is placed, and a rental due back by a fixed hour.
*/

const vendors: Vendor[] = [{ id: 'hotel', name: 'The Henry Manila', simulated: false, open: 0, close: 1440 }, { id: 'shop', name: 'Bike shop', simulated: false, open: 480, close: 1200 }];
const base = { vendorId: 'hotel', capacity: 6, freeCancelHours: 2, durationMin: 60, times: ['10:00'] };
const listings: Listing[] = [
  { ...base, id: 'spa', kind: 'service', title: 'Massage', confirm: 'instant', unitPrice: 2400, priceBasis: 'booking', payModes: ['room'] },
  { ...base, id: 'film', kind: 'service', title: 'Film night', confirm: 'instant', unitPrice: 0 },
  { ...base, id: 'bike', vendorId: 'shop', kind: 'rental', title: 'City bicycle', confirm: 'vendor', unitPrice: 350, times: ['10:00', '13:30'], returnBy: '20:00' },
  { ...base, id: 'charter', kind: 'service', title: 'Charter', confirm: 'instant', unitPrice: 3000, priceBasis: 'unit', payModes: ['room'] },
  { ...base, id: 'gift', kind: 'goods', title: 'Gift', confirm: 'instant', unitPrice: 300, times: [], leadMin: 30 },
];
const start = Date.UTC(2026, 10, 11, 14, 0);
const make = () => createPilot({ catalog: { vendors, listings }, guestName: 'Ana', start, mariaStay: { checkIn: '2026-11-09', checkOut: '2026-11-12', room: '304', status: 'in-house' } });

describe('the engine on the app’s catalogue', () => {
  it('prices a service once per booking, whatever the party', () => {
    const p = make();
    const r = p.guest().quote({ listingId: 'spa', date: '2026-11-12', time: '10:00', qty: 3 });
    expect(r.ok && r.options.price).toBe(2400);
  });

  it('offers a hotel-run service on the room only', () => {
    const p = make();
    const r = p.guest().quote({ listingId: 'spa', date: '2026-11-12', time: '10:00', qty: 1 });
    expect(r.ok && r.options.card.offered).toBe(false);
    expect(p.guest().request({ listingId: 'spa', date: '2026-11-12', time: '10:00', qty: 1, payMode: 'card' }).ok).toBe(false);
  });

  it('confirms a free item at once with nothing to pay', () => {
    const p = make();
    const r = p.guest().request({ listingId: 'film', date: '2026-11-12', time: '10:00', qty: 2 });
    expect(r.ok).toBe(true);
    const id = (r as { bookingId: string }).bookingId;
    expect(p.booking(id).status).toBe('confirmed');
    expect(p.payments(id)).toHaveLength(0);
  });

  it('runs a rental to a fixed return hour, and charges only after the vendor accepts', () => {
    const p = make();
    const id = (p.guest().request({ listingId: 'bike', date: '2026-11-12', time: '10:00', qty: 2, payMode: 'room' }) as { bookingId: string }).bookingId;
    expect(p.booking(id).status).toBe('requested');
    expect(new Date(p.booking(id).end).toISOString()).toBe('2026-11-12T20:00:00.000Z');
    expect(p.payments(id)).toHaveLength(0);
    p.vendor('shop').confirm(id);
    expect(p.booking(id).status).toBe('confirmed');
    expect(p.payments(id)[0]?.amount).toBe(700);
  });

  it('has a goods order for today ready after the lead time', () => {
    const p = make();
    const id = (p.guest().request({ listingId: 'gift', date: '2026-11-11', qty: 1, payMode: 'room' }) as { bookingId: string }).bookingId;
    expect(p.booking(id).start).toBe(start + 30 * 60_000);
  });

  it('follows the hotel system when the stay moves', () => {
    const p = make();
    p.desk.syncStay(p.maria.stayId, { checkOut: '2026-11-11' });
    const r = p.guest().quote({ listingId: 'spa', date: '2026-11-12', time: '10:00', qty: 1 });
    expect(r.ok && r.options.room.offered).toBe(false);
  });

  it('posts a room charge held for check-in when the stay becomes in-house', () => {
    const p = createPilot({ catalog: { vendors, listings }, guestName: 'Ana', start, mariaStay: { checkIn: '2026-11-11', checkOut: '2026-11-13', room: '', status: 'booked' } });
    const id = (p.guest().request({ listingId: 'spa', date: '2026-11-12', time: '10:00', qty: 1, payMode: 'room' }) as { bookingId: string }).bookingId;
    expect(p.payments(id)[0]?.state).toBe('pending');
    // The app learns the guest has scanned in: the stay is in-house, with a room.
    p.desk.syncStay(p.maria.stayId, { status: 'in-house', room: '304' });
    expect(p.payments(id)[0]?.state).toBe('posted');
    expect(p.foliosTotal(p.maria.stayId)).toBe(2400);
  });

  it('does not call two rentals at different pickup times the same booking', () => {
    const p = make();
    const a = p.guest().request({ listingId: 'bike', date: '2026-11-12', time: '10:00', qty: 1, payMode: 'room' }) as { bookingId: string; duplicate?: boolean };
    const b = p.guest().request({ listingId: 'bike', date: '2026-11-12', time: '13:30', qty: 1, payMode: 'room' }) as { bookingId: string; duplicate?: boolean };
    expect(b.duplicate).toBeUndefined();
    expect(b.bookingId).not.toBe(a.bookingId);
  });

  it('shows a late cancellation as asked, offers no second ask, and says the free time has passed', () => {
    const p = make();
    const id = (p.guest().request({ listingId: 'gift', date: '2026-11-11', qty: 1, payMode: 'room' }) as { bookingId: string }).bookingId;
    const first = p.guest().cancel(id);
    expect(first.ok && first.outcome).toBe('requested');
    expect(p.card(id).actions).not.toContain('cancel');
    expect(p.card(id).facts.some((f) => f.label === 'Cancellation')).toBe(true);
    const again = p.guest().cancel(id);
    expect(again.ok).toBe(false);
    expect(p.outbox().filter((n) => n.to === 'vendor' && n.topic === 'cancel-requested')).toHaveLength(1);
  });

  it('carries a stay change through a request still waiting for the vendor', () => {
    const p = make();
    const id = (p.guest().request({ listingId: 'bike', date: '2026-11-12', time: '10:00', qty: 1, payMode: 'room' }) as { bookingId: string }).bookingId;
    p.desk.shortenStay(p.maria.stayId, '2026-11-11');
    expect(p.booking(id).needsPayChange).toBe(true);
    expect(p.card(id).actions).toContain('pay-in-full');
    // The vendor accepts without the guest having chosen: it is paid by card, never put on a room that cannot take it.
    p.vendor('shop').confirm(id);
    expect(p.booking(id).status).toBe('awaiting-payment');
    expect(p.booking(id).payMode).toBe('card');
    expect(p.payments(id).some((x) => x.mode === 'room')).toBe(false);
  });

  it('will not turn a room-only vendor into a card payment', () => {
    const p = make();
    // Two charters is ₱6,000: over the room limit, so it waits for the desk; the desk says no.
    const big = p.guest().request({ listingId: 'charter', date: '2026-11-12', time: '10:00', qty: 2, payMode: 'room' }) as { bookingId: string };
    expect(p.booking(big.bookingId).status).toBe('needs-approval');
    p.desk.declineApproval(big.bookingId);
    expect(p.guest().choosePayInFull(big.bookingId).ok).toBe(false);
  });

  it('forgets a late cancellation once the booking moves on, and will not answer it then', () => {
    const p = make();
    const id = (p.guest().request({ listingId: 'gift', date: '2026-11-11', qty: 1, payMode: 'room' }) as { bookingId: string }).bookingId;
    p.guest().cancel(id);
    expect(p.booking(id).cancelRequested).toBe(true);
    p.desk.markReady(id);
    expect(p.booking(id).cancelRequested).toBe(false);
    expect(p.vendor('hotel').answerCancel(id, true).ok).toBe(false);
  });

  it('refuses a draft with no day instead of throwing', () => {
    const p = make();
    expect(p.guest().quote({ listingId: 'spa', date: '', time: '10:00', qty: 1 }).ok).toBe(false);
  });
});

