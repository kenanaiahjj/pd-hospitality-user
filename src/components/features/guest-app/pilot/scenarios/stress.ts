import { SCENE as S, PILOT_LISTINGS } from '../catalog';
import type { Booking, Draft, Pilot } from '../types';
import { draft, type Ctx, type Scenario } from './kit';

const G = 'Stress and chaos' as const;
const trip = (extra = {}) => draft('apo-island-trip', S.fri, 1, { time: '07:30', payMode: 'room', ...extra });

const pick = <T,>(c: Ctx, list: T[]): T => list[Math.floor(c.rng() * list.length)]!;

const randomDraft = (c: Ctx): Draft => {
  const listing = pick(c, PILOT_LISTINGS);
  const date = pick(c, [S.today, S.thu, S.fri, S.sat, S.sun, S.mon]);
  const qtyMax = listing.kind === 'goods' ? 5 : listing.kind === 'rental' ? 3 : listing.kind === 'table' ? 6 : 3;
  return {
    listingId: listing.id,
    date,
    time: listing.times.length ? pick(c, listing.times) : undefined,
    qty: 1 + Math.floor(c.rng() * qtyMax),
    days: listing.kind === 'rental' ? 1 + Math.floor(c.rng() * 2) : undefined,
    payMode: c.rng() < 0.6 ? 'room' : 'card',
    origin: pick(c, ['app', 'app', 'guest-chat'] as const),
  };
};

/** A booking is finished, or something is still going to happen to it, or the desk has it. */
const settled = (p: Pilot, b: Booking): boolean => {
  const terminal = ['completed', 'collected', 'seated', 'withdrawn', 'declined', 'lapsed', 'payment-expired', 'cancelled', 'no-show'];
  if (terminal.includes(b.status)) return true;
  if (b.status === 'requested' && b.deadline && b.deadline >= p.now()) return true;
  if (['confirmed', 'reserved', 'in-progress', 'ready'].includes(b.status)) return true;
  if (['needs-approval', 'pay-or-cancel'].includes(b.status) && b.holdUntil !== undefined && b.holdUntil >= p.now()) return true;
  if (b.status === 'awaiting-payment' && p.payments(b.id).some((x) => x.windowEnd && x.windowEnd >= p.now())) return true;
  return p.tasks('open').some((t) => t.bookingId === b.id);
};

/** The chaos driver: random guests, vendors, desk, clock and faults, until the engine has taken `steps` steps. */
function chaos(c: Ctx, steps: number): { steps: number } {
  const { p } = c;
  const guests = [p.maria.guestId];
  for (let i = 0; i < 11; i++) guests.push(p.addGuest({ firstName: `Guest ${i + 1}`, room: `Villa ${50 + i}`, checkIn: '2026-10-05', checkOut: pick(c, [S.mon, S.tue, S.wed]) }).guestId);
  const stays = () => guests.map((g) => p.bookings().find((b) => b.guestId === g)?.stayId).filter(Boolean) as string[];
  const vendors = ['boat-operator', 'bike-shop', 'cafe-sans-rival', 'henrys-activities', 'si-senor', 'the-dining-room'];
  const some = (filter: (b: Booking) => boolean) => {
    const all = p.bookings().filter(filter);
    return all.length ? pick(c, all) : undefined;
  };
  while (p.steps() < steps) {
    const roll = c.rng();
    const g = pick(c, guests);
    const v = pick(c, vendors);
    if (roll < 0.22) p.guest(g).request(randomDraft(c));
    else if (roll < 0.3) { const b = some((x) => x.status === 'requested'); if (b) p.vendor(PILOT_LISTINGS.find((l) => l.id === b.listingId)!.vendorId).confirm(b.id); }
    else if (roll < 0.33) { const b = some((x) => x.status === 'requested'); if (b) p.vendor(PILOT_LISTINGS.find((l) => l.id === b.listingId)!.vendorId).decline(b.id, 'Not available'); }
    else if (roll < 0.4) { const b = some((x) => x.status === 'awaiting-payment'); if (b) p.guest(b.guestId).payCard(b.id); }
    else if (roll < 0.45) { const b = some((x) => ['requested', 'confirmed', 'reserved', 'awaiting-payment', 'needs-approval', 'pay-or-cancel'].includes(x.status)); if (b) p.guest(b.guestId).cancel(b.id); }
    else if (roll < 0.5) { const b = some((x) => x.status === 'confirmed'); if (b) p.vendor(PILOT_LISTINGS.find((l) => l.id === b.listingId)!.vendorId).scan(b.id); }
    else if (roll < 0.54) { const b = some((x) => x.status === 'in-progress'); if (b) { const vid = PILOT_LISTINGS.find((l) => l.id === b.listingId)!.vendorId; if (c.rng() < 0.4) p.vendor(vid).addExtra(b.id, 100 + Math.floor(c.rng() * 400), 'Extra'); else p.vendor(vid).complete(b.id); } }
    else if (roll < 0.57) { const b = some((x) => x.status === 'confirmed' || x.status === 'reserved'); if (b) p.vendor(PILOT_LISTINGS.find((l) => l.id === b.listingId)!.vendorId).markNoShow(b.id); }
    else if (roll < 0.6) { const b = some((x) => ['confirmed', 'reserved', 'awaiting-payment'].includes(x.status)); if (b) p.vendor(PILOT_LISTINGS.find((l) => l.id === b.listingId)!.vendorId).cancel(b.id, 'Chaos'); }
    else if (roll < 0.62) { const b = some((x) => x.status === 'needs-approval'); if (b) { if (c.rng() < 0.5) p.desk.approve(b.id); else p.desk.declineApproval(b.id); } }
    else if (roll < 0.66) { const t = pick(c, [...p.tasks('open'), undefined as never]); if (t) p.desk.resolveTask(t.id); }
    else if (roll < 0.68) { const b = some((x) => x.status === 'confirmed' && x.kind === 'goods'); if (b) { p.vendor('cafe-sans-rival').sendToDesk(b.id); p.desk.markReady(b.id); if (c.rng() < 0.5) p.desk.handOver(b.id); } }
    else if (roll < 0.7) { const s = stays(); if (s.length) void pick(c, [() => p.desk.checkIn(pick(c, s)), () => p.desk.moveRoom(pick(c, s), `Villa ${60 + Math.floor(c.rng() * 20)}`), () => p.desk.checkout(pick(c, s))])(); }
    else if (roll < 0.72) p.setPms({ mode: pick(c, ['up', 'up', 'down', 'reject'] as const), staleRoomRefused: c.rng() < 0.5, dropNextReply: c.rng() < 0.2, refuseReversal: c.rng() < 0.2 });
    else if (roll < 0.74) p.setGateway({ mode: pick(c, ['ok', 'ok', 'fail', 'abandon'] as const), loseCallbacks: c.rng() < 0.2, duplicateCallbacks: c.rng() < 0.2 ? 3 : 0, failRefunds: c.rng() < 0.15, allowDoublePay: c.rng() < 0.2 });
    else if (roll < 0.77) { const vs = p.vendor(v); const r = c.rng(); if (r < 0.4) vs.setOnline(c.rng() < 0.5); else if (r < 0.6) vs.setAway(c.rng() < 0.3); else vs.cacheBookings(); }
    else if (roll < 0.79) { const b = some((x) => x.status === 'requested'); if (b) { const vid = PILOT_LISTINGS.find((l) => l.id === b.listingId)!.vendorId; p.together(() => p.guest(b.guestId).cancel(b.id), () => p.vendor(vid).confirm(b.id)); } }
    else if (roll < 0.82) { const pay = some((x) => x.paymentIds.length > 0); if (pay) { const pid = pay.paymentIds[0]!; if (c.rng() < 0.5) p.guest(pay.guestId).question(pid); else p.desk.resolveCharge(pid, pick(c, ['uphold', 'waive'] as const)); } }
    else if (roll < 0.85) { const b = some((x) => x.status === 'confirmed' && x.kind !== 'table'); if (b) p.vendor(PILOT_LISTINGS.find((l) => l.id === b.listingId)!.vendorId).addExtra(b.id, 150, 'Extra'); }
    else p.advanceMinutes(1 + Math.floor(c.rng() * (roll > 0.97 ? 600 : 60)));
  }
  return { steps: p.steps() };
}

export const STRESS: Scenario[] = [
  {
    id: 'S1',
    group: G,
    title: 'A busy afternoon',
    run(c) {
      const { p } = c;
      const guests = [p.maria.guestId];
      for (let i = 0; i < 49; i++) guests.push(p.addGuest({ firstName: `Guest ${i + 1}`, room: `Room ${100 + i}`, checkIn: '2026-10-05', checkOut: S.wed }).guestId);
      for (const l of PILOT_LISTINGS) p.setCapacity(l.id, 60);
      c.step('200 requests across all types in 10 simulated minutes, with random accepts, declines and lapses', () => {
        for (let i = 0; i < 200; i++) {
          p.guest(pick(c, guests)).request(randomDraft(c));
          p.advanceTo(p.now() + 3_000);
          if (c.rng() < 0.4) {
            const b = pick(c, p.bookings().filter((x) => x.status === 'requested').concat([undefined as never]));
            if (b) {
              const vid = PILOT_LISTINGS.find((l) => l.id === b.listingId)!.vendorId;
              if (c.rng() < 0.75) p.vendor(vid).confirm(b.id);
              else p.vendor(vid).decline(b.id, 'Not available');
            }
          }
        }
      });
      c.step('Every request ends in a terminal state or has a live timer or desk task', () => {
        p.advanceMinutes(5);
        const loose = p.bookings().filter((b) => !settled(p, b));
        c.eq(loose.length, 0, `${loose.length} requests are neither finished nor live: ${loose.slice(0, 3).map((b) => `${b.id} ${b.status} ${b.listingId} deadline ${b.deadline ? new Date(b.deadline).toISOString() : '-'} now ${new Date(p.now()).toISOString()} hold ${b.holdUntil ?? '-'}`).join('; ')}`);
        p.advanceDays(3);
        const after = p.bookings().filter((b) => !settled(p, b));
        c.eq(after.length, 0, 'still true three days on');
      });
    },
  },
  {
    id: 'S2',
    group: G,
    title: 'One slot, many guests',
    run(c) {
      const { p } = c;
      const key = p.slotKeyFor('apo-island-trip', S.fri, '07:30');
      p.setCapacity('apo-island-trip', 8, key);
      const guests = [p.maria.guestId];
      for (let i = 0; i < 29; i++) guests.push(p.addGuest({ firstName: `Guest ${i + 1}`, room: `Villa ${70 + i}`, checkIn: '2026-10-05', checkOut: S.tue }).guestId);
      c.step('30 guests request together', () => {
        const results = guests.map((g) => p.guest(g).request(trip({ qty: 1 })));
        c.eq(results.filter((r) => r.ok).length, 8, 'exactly 8 holds');
        c.eq(results.filter((r) => !r.ok && r.reason === 'unavailable').length, 22, '22 refused cleanly');
        const slot = p.slot('apo-island-trip', S.fri, '07:30');
        c.ok(slot.held + slot.confirmed <= slot.capacity, 'never over capacity');
      });
    },
  },
  {
    id: 'S3',
    group: G,
    title: 'PMS down for 24 hours',
    adapted: 'The 300 charges are yoga bookings, which charge as the guest confirms.',
    run(c) {
      const { p } = c;
      p.setCapacity('yoga-class', 300);
      p.setPms({ mode: 'down' });
      const ids: { id: string; guestId: string }[] = [];
      c.step('300 charges are pending while the PMS is down', () => {
        for (let i = 0; i < 300; i++) {
          const g = p.addGuest({ firstName: `Guest ${i + 1}`, room: `Room ${200 + i}`, checkIn: '2026-10-05', checkOut: S.wed });
          const r = p.guest(g.guestId).request(draft('yoga-class', S.sat, 1, { time: '06:30', payMode: 'room' }));
          if (r.ok) ids.push({ id: r.bookingId, guestId: g.guestId });
        }
        c.eq(ids.length, 300, '300 bookings');
        c.eq(ids.filter((x) => p.payments(x.id)[0]!.state === 'pending').length, 300, 'all pending');
      });
      c.step('40 are cancelled meanwhile; the PMS comes back', () => {
        p.advanceHours(12);
        for (const x of ids.slice(0, 40)) c.must(p.guest(x.guestId).cancel(x.id));
        p.advanceHours(11);
        p.setPms({ mode: 'up' });
        p.advanceMinutes(10);
      });
      c.step('Each live charge posts once; cancelled ones never post', () => {
        const live = ids.slice(40);
        c.ok(live.every((x) => p.payments(x.id)[0]!.state === 'posted'), 'live charges posted');
        c.ok(ids.slice(0, 40).every((x) => p.payments(x.id)[0]!.state === 'voided'), 'cancelled ones voided');
        const posted = p.pms.folio.filter((f) => !f.external);
        c.eq(posted.length, 260, 'one entry per live charge');
        c.eq(new Set(posted.map((f) => f.ref)).size, 260, 'no reference twice');
        c.eq(p.tasks('open').filter((t) => t.kind === 'pms-alert').length, 0, 'desk tasks cleared');
      });
    },
  },
  {
    id: 'S4',
    group: G,
    title: 'Duplicate gateway callbacks',
    run(c) {
      const { p } = c;
      c.step('The same callback arrives 5 times', () => {
        p.setGateway({ duplicateCallbacks: 5 });
        const id = c.ask(trip({ qty: 2, payMode: 'card' }));
        c.must(p.vendor('boat-operator').confirm(id));
        c.must(p.guest().payCard(id));
        const pays = p.payments(id);
        c.eq(pays.filter((x) => x.state === 'paid').length, 1, 'one Paid payment');
        c.eq(pays.length, 1, 'no extra payment records');
        c.eq(p.gateway.net, 3200, 'no extra refund');
      });
    },
  },
  {
    id: 'S5',
    group: G,
    title: 'Clock jumps three days',
    run(c) {
      const { p } = c;
      let open = '';
      let awaiting = '';
      let table = '';
      c.step('Open requests, payment windows, a table waiting and a charge being retried', () => {
        open = c.ask(draft('apo-island-trip', S.fri, 1, { time: '07:30', payMode: 'room' }));
        awaiting = c.ask(draft('bike-rental', S.sat, 1, { time: '08:00', days: 1, payMode: 'card' }));
        c.must(p.vendor('bike-shop').confirm(awaiting));
        table = c.ask(draft('si-senor', S.today, 2, { time: '19:00' }));
        p.setPms({ mode: 'down' });
        const y = c.ask(draft('yoga-class', S.sat, 1, { time: '06:30', payMode: 'room' }));
        c.eq(p.payments(y)[0]!.state, 'pending', 'retrying');
      });
      c.step('Advance 3 days in one step: every timer fires once, in order', () => {
        p.advanceDays(3);
        c.eq(p.booking(open).status, 'lapsed', 'the request lapsed');
        c.eq(p.booking(awaiting).status, 'payment-expired', 'the payment window closed');
        c.eq(p.booking(table).status, 'no-show', 'the table was released');
        const fired = p.log().filter((l) => l.kind === 'timer');
        c.ok(fired.every((l, i) => i === 0 || fired[i - 1]!.at <= l.at), 'in order');
        c.eq(new Set(fired.map((l) => l.detail)).size, fired.length, 'none fired twice');
      });
    },
  },
  {
    id: 'S6',
    group: G,
    title: 'Seeded chaos run',
    run(c) {
      return chaos(c, c.chaosSteps);
    },
  },
  {
    id: 'S7',
    group: G,
    title: 'A big weather cancellation',
    run(c) {
      const { p } = c;
      const key = p.slotKeyFor('apo-island-trip', S.fri, '07:30');
      p.setCapacity('apo-island-trip', 40, key);
      const made: { id: string; guestId: string }[] = [];
      c.step('40 bookings on one slot', () => {
        for (let i = 0; i < 40; i++) {
          const g = i === 0 ? { guestId: p.maria.guestId } : p.addGuest({ firstName: `Guest ${i}`, room: `Room ${300 + i}`, checkIn: '2026-10-05', checkOut: S.tue });
          const mode = i % 2 === 0 ? 'room' : 'card';
          const r = p.guest(g.guestId).request(trip({ payMode: mode }));
          if (!r.ok) continue;
          p.vendor('boat-operator').confirm(r.bookingId);
          if (mode === 'card') p.guest(g.guestId).payCard(r.bookingId);
          made.push({ id: r.bookingId, guestId: g.guestId });
        }
        c.eq(made.length, 40, '40 bookings');
      });
      c.step('The operator cancels the slot', () => {
        const r = c.must(p.vendor('boat-operator').cancelSlot('apo-island-trip', key, 'Weather'));
        c.eq(r.count, 40, '40 cancellations');
        p.advanceMinutes(5);
        const states = made.map((x) => p.payments(x.id)[0]!.state);
        c.eq(states.filter((s) => s === 'reversed' || s === 'voided' || s === 'refunded').length, 40, '40 reversals or refunds');
        c.ok(made.every((x) => p.outbox().filter((n) => n.to === 'guest' && n.topic === 'vendor-cancelled' && n.channel === 'push' && n.bookingId === x.id).length === 1), 'one notification each');
        c.eq(p.tasks().filter((t) => t.kind === 'batch-cancel').length, 1, 'one batch on the desk screen');
      });
    },
  },
];
