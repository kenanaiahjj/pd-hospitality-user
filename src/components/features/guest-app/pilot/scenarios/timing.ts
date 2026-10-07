import { SCENE as S } from '../catalog';
import { draft, type Scenario } from './kit';

const G = 'Timing and races' as const;
const trip = (extra = {}) => draft('apo-island-trip', S.fri, 2, { time: '07:30', payMode: 'room', ...extra });

export const TIMING: Scenario[] = [
  {
    id: 'T1',
    group: G,
    title: 'Withdraw and accept at the same instant',
    run(c) {
      const { p } = c;
      c.step('Run 1: the withdraw is recorded first', () => {
        const id = c.ask(trip());
        const [a, b] = p.together(
          () => p.guest().cancel(id),
          () => p.vendor('boat-operator').confirm(id),
        );
        c.must(a);
        c.refused(b, 'already-actioned');
        c.eq(p.booking(id).status, 'withdrawn', 'the withdraw won');
        c.ok(p.log().some((l) => l.kind === 'race'), 'both can see which came first');
      });
      c.step('Run 2: the vendor accept is recorded first', () => {
        const q = c.fresh();
        const id = q.guest().request(trip()) as { ok: true; bookingId: string };
        const [a, b] = q.together(
          () => q.vendor('boat-operator').confirm(id.bookingId),
          () => q.guest().cancel(id.bookingId),
        );
        c.must(a);
        const out = c.must(b as never) as { outcome: string };
        c.eq(out.outcome, 'cancelled', 'the withdraw became a normal cancel');
        c.eq(q.booking(id.bookingId).status, 'cancelled', 'Cancelled');
        const pays = q.payments(id.bookingId);
        c.ok(pays.every((x) => x.state === 'reversed' || x.state === 'voided'), 'the charge is undone');
      });
    },
  },
  {
    id: 'T2',
    group: G,
    title: 'Vendor taps Confirm after the request lapsed',
    run(c) {
      const { p } = c;
      let id = '';
      c.step('The request lapses 2 minutes before the vendor taps Confirm', () => {
        id = c.ask(trip());
        const lapseAt = p.booking(id).deadline!;
        p.advanceTo(lapseAt + 2 * 60_000);
        c.eq(p.booking(id).status, 'lapsed', 'Lapsed');
        const r = p.vendor('boat-operator').confirm(id);
        c.refused(r, 'lapsed', 'lapsed 2 minutes ago');
        c.ok(p.tasks('open').some((t) => t.kind === 'lapsed-reinstate' && t.bookingId === id), 'the desk gets a task');
      });
      c.step('The desk reinstates it; it goes back to the vendor', () => {
        c.must(p.desk.reinstate(id));
        c.eq(p.booking(id).status, 'requested', 'Requested again');
        c.must(p.vendor('boat-operator').confirm(id));
      });
    },
  },
  {
    id: 'T3',
    group: G,
    title: 'Same request sent twice',
    run(c) {
      const { p } = c;
      c.step('Maria double taps Send', () => {
        const a = c.must(p.guest().request(trip()));
        const b = c.must(p.guest().request(trip()));
        c.eq(b.bookingId, a.bookingId, 'one active request');
        c.eq(b.duplicate, true, 'the second is ignored');
        c.eq(p.bookings().length, 1, 'one booking');
        c.eq(p.threads('guest', p.maria.guestId).filter((t) => t.kind === 'booking').length, 1, 'one card in one thread');
      });
    },
  },
  {
    id: 'T4',
    group: G,
    title: 'Two guests, one slot left',
    run(c) {
      const { p } = c;
      p.setCapacity('apo-island-trip', 1, p.slotKeyFor('apo-island-trip', S.fri, '07:30'));
      const ben = p.addGuest({ firstName: 'Ben', room: 'Villa 14', checkIn: '2026-10-05', checkOut: S.tue });
      c.step('Both request in the same second', () => {
        const one = p.guest(p.maria.guestId).request(trip({ qty: 1 }));
        const two = p.guest(ben.guestId).request(trip({ qty: 1 }));
        c.must(one);
        c.refused(two, 'unavailable', 'Just booked');
        const slot = p.slot('apo-island-trip', S.fri, '07:30');
        c.eq(slot.held + slot.confirmed, 1, 'one hold');
      });
    },
  },
  {
    id: 'T5',
    group: G,
    title: 'Vendor never opens a request',
    run(c) {
      const { p } = c;
      let id = '';
      c.step('A request for tomorrow morning; nobody opens it', () => {
        id = c.ask(draft('apo-island-trip', S.thu, 2, { time: '07:30', payMode: 'room' }));
        c.eq(p.booking(id).deadline! - p.now(), 30 * 60_000, 'a 30 minute timer');
        c.ok(p.outbox().some((n) => n.to === 'vendor' && n.channel === 'push' && n.bookingId === id), 'push at 0');
      });
      c.step('SMS at 5, reminder at 15, lapse at 30', () => {
        const t0 = p.now();
        p.advanceMinutes(5);
        c.ok(p.outbox().some((n) => n.channel === 'sms' && n.to === 'vendor' && n.bookingId === id && n.at === t0 + 5 * 60_000), 'SMS at 5');
        p.advanceMinutes(10);
        c.ok(p.outbox().some((n) => n.topic === 'reminder' && n.to === 'vendor' && n.bookingId === id && n.at === t0 + 15 * 60_000), 'reminder at 15');
        c.eq(p.booking(id).status, 'requested', 'still waiting');
        p.advanceMinutes(15);
        c.eq(p.booking(id).status, 'lapsed', 'lapsed at 30');
        const slot = p.slot('apo-island-trip', S.thu, '07:30');
        c.eq(slot.held + slot.confirmed, 0, 'hold released');
        c.ok(p.outbox().some((n) => n.to === 'guest' && n.topic === 'lapsed' && n.bookingId === id), 'the guest is told');
        c.ok(p.tasks().some((t) => t.kind === 'vendor-nudge' && t.bookingId === id), 'the desk is told: the service is within 24 hours');
      });
    },
  },
  {
    id: 'T6',
    group: G,
    title: 'Vendor has no signal at the deadline',
    run(c) {
      const ask = (q: ReturnType<typeof c.fresh>) => (q.guest().request(draft('apo-island-trip', S.thu, 2, { time: '07:30', payMode: 'room' })) as { ok: true; bookingId: string }).bookingId;
      c.step('Run 1: the vendor taps Confirm at minute 28 offline; the phone reconnects at minute 33', () => {
        const q = c.fresh();
        const id = ask(q);
        q.vendor('boat-operator').setOnline(false);
        q.advanceMinutes(28);
        q.vendor('boat-operator').confirm(id);
        q.advanceMinutes(5);
        q.vendor('boat-operator').setOnline(true);
        c.eq(q.booking(id).status, 'confirmed', 'it counts: within 5 minutes of grace and the slot is still held');
      });
      c.step('Run 2: it reconnects at minute 40', () => {
        const q = c.fresh();
        const id = ask(q);
        q.vendor('boat-operator').setOnline(false);
        q.advanceMinutes(28);
        q.vendor('boat-operator').confirm(id);
        q.advanceMinutes(12);
        q.vendor('boat-operator').setOnline(true);
        c.eq(q.booking(id).status, 'lapsed', 'lapsed as normal');
      });
    },
  },
  {
    id: 'T7',
    group: G,
    title: 'Request arrives while the vendor is closed',
    run(c) {
      const { p } = c;
      let id = '';
      c.step('11 PM, the boat office is closed; the trip is the day after tomorrow', () => {
        p.advanceTo(p.at(S.today, '23:00'));
        id = c.ask(draft('apo-island-trip', S.fri, 2, { time: '13:30', payMode: 'room' }));
        c.eq(p.booking(id).deadline, p.at(S.thu, '10:00'), 'the timer pauses overnight and ends 4 open hours after opening');
        c.ok(p.booking(id).deadline! - p.booking(id).createdAt <= 24 * 3_600_000, 'never longer than 24 hours');
      });
      c.step('It waits through the night and lapses once the open hours run out', () => {
        p.advanceTo(p.at(S.thu, '09:59'));
        c.eq(p.booking(id).status, 'requested', 'still waiting');
        p.advanceTo(p.at(S.thu, '10:00'));
        c.eq(p.booking(id).status, 'lapsed', 'lapsed at 10:00');
      });
    },
  },
  {
    id: 'T8',
    group: G,
    title: 'Service start is near',
    run(c) {
      const { p } = c;
      let id = '';
      c.step('A same-day trip at 7:30; the request is made at 7:00', () => {
        p.advanceTo(p.at(S.thu, '07:00'));
        id = c.ask(draft('apo-island-trip', S.thu, 2, { time: '07:30', payMode: 'room' }));
      });
      c.step('It lapses at 7:15, 15 minutes before the start', () => {
        p.advanceTo(p.at(S.thu, '07:14'));
        c.eq(p.booking(id).status, 'requested', 'still waiting at 7:14');
        p.advanceTo(p.at(S.thu, '07:15'));
        c.eq(p.booking(id).status, 'lapsed', 'lapsed at 7:15');
      });
    },
  },
];
