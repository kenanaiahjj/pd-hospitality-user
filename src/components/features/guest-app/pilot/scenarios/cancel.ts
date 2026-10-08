import { SCENE as S } from '../catalog';
import { draft, type Scenario } from './kit';

const G = 'Cancellations' as const;
const trip = (extra = {}) => draft('apo-island-trip', S.fri, 2, { time: '07:30', payMode: 'room', ...extra });

export const CANCEL: Scenario[] = [
  {
    id: 'C1',
    group: G,
    title: 'Cancel inside the free window, room',
    run(c) {
      const { p } = c;
      c.step('The window is 24 hours; the trip is in 2 days; she cancels', () => {
        const id = c.ask(trip());
        c.must(p.vendor('boat-operator').confirm(id));
        c.must(p.guest().cancel(id));
        c.eq(p.booking(id).status, 'cancelled', 'Cancelled');
        c.ok(['voided', 'reversed'].includes(p.payments(id)[0]!.state), 'the room charge is Voided or Reversed');
        const slot = p.slot('apo-island-trip', S.fri, '07:30');
        c.eq(slot.held + slot.confirmed, 0, 'slot released');
        c.ok(p.outbox().some((n) => n.to === 'vendor' && n.topic === 'cancelled' && n.bookingId === id), 'the vendor sees it');
        // The desk is not in the booking's chat; it sees the booking itself change.
        c.ok(p.log().some((l) => l.kind === 'booking-state' && l.entityId === id && l.to === 'cancelled'), 'the desk sees it on the booking');
      });
    },
  },
  {
    id: 'C2',
    group: G,
    title: 'Cancel inside the free window, card',
    run(c) {
      const { p } = c;
      c.step('Paid in full; she cancels', () => {
        const id = c.ask(trip({ payMode: 'card' }));
        c.must(p.vendor('boat-operator').confirm(id));
        c.must(p.guest().payCard(id));
        c.must(p.guest().cancel(id));
        p.advanceMinutes(5);
        c.eq(p.payments(id)[0]!.state, 'refunded', 'Refunded to the same method');
        c.eq(p.gateway.net, 0, 'the gateway holds nothing');
      });
    },
  },
  {
    id: 'C3',
    group: G,
    title: 'Cancel outside the window, vendor accepts',
    run(c) {
      const { p } = c;
      let id = '';
      c.step('The trip is tomorrow; she asks to cancel', () => {
        id = c.ask(draft('apo-island-trip', S.thu, 2, { time: '07:30', payMode: 'room' }));
        c.must(p.vendor('boat-operator').confirm(id));
        const r = c.must(p.guest().cancel(id));
        c.eq(r.outcome, 'requested', 'the vendor must answer');
        c.eq(p.booking(id).status, 'confirmed', 'still Confirmed until then');
      });
      c.step('The operator accepts', () => {
        c.must(p.vendor('boat-operator').answerCancel(id, true));
        c.eq(p.booking(id).status, 'cancelled', 'Cancelled');
        c.ok(['voided', 'reversed'].includes(p.payments(id)[0]!.state), 'the charge is undone');
      });
    },
  },
  {
    id: 'C4',
    group: G,
    title: 'Cancel outside the window, vendor declines',
    run(c) {
      const { p } = c;
      c.step('The operator declines', () => {
        const id = c.ask(draft('apo-island-trip', S.thu, 2, { time: '07:30', payMode: 'room' }));
        c.must(p.vendor('boat-operator').confirm(id));
        c.must(p.guest().cancel(id));
        c.must(p.vendor('boat-operator').answerCancel(id, false));
        c.eq(p.booking(id).status, 'confirmed', 'the booking stands');
        c.eq(p.payments(id)[0]!.amount, 3200, 'no part fee');
        c.ok(p.tasks('open').some((t) => t.kind === 'vendor-cancel-declined' && t.bookingId === id), 'the desk can step in');
      });
    },
  },
  {
    id: 'C5',
    group: G,
    title: 'Vendor cancels with a reason',
    run(c) {
      const { p } = c;
      c.step('The bike shop has a breakdown and cancels before the service', () => {
        const id = c.ask(draft('bike-rental', S.sat, 2, { time: '08:00', days: 1, payMode: 'room' }));
        c.must(p.vendor('bike-shop').confirm(id));
        c.refused(p.vendor('bike-shop').cancel(id, ''), 'not-possible', 'reason');
        c.must(p.vendor('bike-shop').cancel(id, 'Bike breakdown'));
        c.eq(p.booking(id).status, 'cancelled', 'Cancelled');
        c.ok(['voided', 'reversed'].includes(p.payments(id)[0]!.state), 'everything undone automatically');
        const told = p.outbox().filter((n) => n.to === 'guest' && n.topic === 'vendor-cancelled' && n.bookingId === id);
        c.ok(told.some((n) => n.channel === 'push') && told.some((n) => n.channel === 'sms'), 'push and SMS');
        c.ok(p.card(id).actions.includes('pick-another'), 'a rebook offer');
        c.ok(p.outbox().some((n) => n.to === 'desk' && n.bookingId === id), 'the desk is told');
      });
    },
  },
  {
    id: 'C6',
    group: G,
    title: 'Weather cancels the boat',
    run(c) {
      const { p } = c;
      const key = p.slotKeyFor('apo-island-trip', S.fri, '07:30');
      p.setCapacity('apo-island-trip', 12, key);
      const ids: string[] = [];
      c.step('12 bookings on the Friday 7:30 trip, mixed room and card', () => {
        for (let i = 0; i < 12; i++) {
          const g = i === 0 ? { guestId: p.maria.guestId } : p.addGuest({ firstName: `Guest ${i}`, room: `Villa ${20 + i}`, checkIn: '2026-10-05', checkOut: S.tue });
          const mode = i % 2 === 0 ? 'room' : 'card';
          const id = (p.guest(g.guestId).request(trip({ qty: 1, payMode: mode })) as { ok: true; bookingId: string }).bookingId;
          p.vendor('boat-operator').confirm(id);
          if (mode === 'card') p.guest(g.guestId).payCard(id);
          ids.push(id);
        }
        c.eq(ids.filter((id) => p.booking(id).status === 'confirmed').length, 12, 'all confirmed');
      });
      c.step('The operator taps Cancel all for this slot', () => {
        const r = c.must(p.vendor('boat-operator').cancelSlot('apo-island-trip', key, 'Weather'));
        c.eq(r.count, 12, 'all 12');
        c.ok(ids.every((id) => p.booking(id).status === 'cancelled' && p.booking(id).reason === 'Weather'), 'cancelled with one reason');
        c.ok(ids.every((id) => p.outbox().filter((n) => n.to === 'guest' && n.topic === 'vendor-cancelled' && n.bookingId === id && n.channel === 'push').length === 1), 'each guest is told once');
        c.eq(p.tasks().filter((t) => t.kind === 'batch-cancel').length, 1, 'the desk sees one batch');
        const slot = p.slot('apo-island-trip', S.fri, '07:30');
        c.eq(slot.held + slot.confirmed, 0, 'every hold released');
      });
    },
  },
  {
    id: 'C7',
    group: G,
    title: 'Guest does not show up',
    run(c) {
      const { p } = c;
      let id = '';
      c.step('The trip starts at 7:30; the operator cannot mark a no-show early', () => {
        id = c.ask(trip());
        c.must(p.vendor('boat-operator').confirm(id));
        p.advanceTo(p.at(S.fri, '07:59'));
        c.refused(p.vendor('boat-operator').markNoShow(id), 'too-early');
      });
      c.step('At 8:00 it is marked: the charge stands', () => {
        p.advanceTo(p.at(S.fri, '08:00'));
        c.must(p.vendor('boat-operator').markNoShow(id));
        c.eq(p.booking(id).status, 'no-show', 'No-show');
        c.eq(p.payments(id)[0]!.state, 'posted', 'the charge stands');
        c.ok(p.outbox().some((n) => n.to === 'desk' && n.bookingId === id), 'the desk is told');
        c.must(p.guest().question(p.payments(id)[0]!.id, 'I was ill'));
      });
    },
  },
  {
    id: 'C8',
    group: G,
    title: 'Guest asks to change the date',
    run(c) {
      const { p } = c;
      c.step('There is no Change date: cancel and rebook is offered, free inside the window', () => {
        const id = c.ask(trip());
        c.must(p.vendor('boat-operator').confirm(id));
        const actions = p.card(id).actions as string[];
        c.ok(!actions.includes('change-date'), 'Change date is not offered');
        c.ok(actions.includes('cancel'), 'Cancel is');
        c.must(p.guest().cancel(id));
        const again = c.ask(trip({ date: S.sat }));
        c.eq(p.booking(again).status, 'requested', 'rebooked');
      });
    },
  },
  {
    id: 'C9',
    group: G,
    title: 'Stay shortened below a booking',
    run(c) {
      const { p } = c;
      let id = '';
      c.step('A trip on the last day; the stay is shortened by 2 days', () => {
        id = c.ask(draft('apo-island-trip', S.tue, 2, { time: '07:30', payMode: 'room' }));
        c.must(p.vendor('boat-operator').confirm(id));
        c.must(p.desk.shortenStay(p.maria.stayId, S.sun));
      });
      c.step('The desk sees the conflict; the guest is asked to pay in full or cancel', () => {
        const task = p.tasks('open').find((t) => t.kind === 'stay-conflict' && t.bookingId === id);
        c.ok(Boolean(task), 'the desk sees the conflict');
        c.eq(task!.dueAt, p.booking(id).start - 24 * 3_600_000, 'due 24 hours before the service');
        const actions = p.card(id).actions;
        c.ok(actions.includes('pay-in-full') && actions.includes('cancel'), 'pay in full or cancel');
      });
      c.step('Paying in full keeps the booking: one payment, no refund, nothing left to resolve', () => {
        const q = c.fresh();
        const bk = (q.guest().request(draft('apo-island-trip', S.tue, 2, { time: '07:30', payMode: 'room' })) as { ok: true; bookingId: string }).bookingId;
        q.vendor('boat-operator').confirm(bk);
        q.desk.shortenStay(q.maria.stayId, S.sun);
        c.must(q.guest().choosePayInFull(bk));
        // Asking again does not open a second window.
        c.must(q.guest().choosePayInFull(bk));
        c.eq(q.payments(bk).filter((x) => x.mode === 'card').length, 1, 'one card payment');
        c.ok(q.card(bk).actions.includes('pay') && !q.card(bk).actions.includes('pay-in-full'), 'the card offers Pay now with its timer');
        c.ok(Boolean(q.card(bk).timer), 'and shows the time left');
        c.must(q.guest().payCard(bk));
        c.eq(q.booking(bk).status, 'confirmed', 'still confirmed');
        c.eq(q.booking(bk).needsPayChange, false, 'the conflict is cleared');
        c.eq(q.payments(bk).filter((x) => x.mode === 'card')[0]!.state, 'paid', 'paid, not refunded');
        c.ok(!q.tasks('open').some((t) => t.kind === 'stay-conflict'), 'nothing left for the desk');
        q.advanceMinutes(30);
        c.eq(q.booking(bk).status, 'confirmed', 'and the old window does not cancel it');
      });
      c.step('Unresolved 24 hours before, the desk handles it', () => {
        p.advanceTo(p.booking(id).start - 24 * 3_600_000);
        const task = p.tasks('open').find((t) => t.kind === 'stay-conflict' && t.bookingId === id)!;
        c.ok(/desk handles/i.test(task.detail), 'now the desk’s to handle');
      });
    },
  },
  {
    id: 'C10',
    group: G,
    title: 'Stay cancelled',
    options: { mariaStay: { checkIn: S.mon, checkOut: '2026-10-15', status: 'booked', room: '' } },
    run(c) {
      const { p } = c;
      const ids: string[] = [];
      c.step('Three room bookings are pending before arrival', () => {
        ids.push(c.ask(draft('apo-island-trip', S.tue, 2, { time: '07:30', payMode: 'room' })));
        ids.push(c.ask(draft('bike-rental', S.tue, 1, { time: '08:00', days: 1, payMode: 'room' })));
        ids.push(c.ask(draft('yoga-class', S.wed, 1, { time: '06:30', payMode: 'room' })));
        c.must(p.vendor('boat-operator').confirm(ids[0]!));
        c.must(p.vendor('bike-shop').confirm(ids[1]!));
      });
      c.step('The stay is cancelled: all three are cancelled and released', () => {
        c.must(p.desk.cancelStay(p.maria.stayId));
        c.ok(ids.every((id) => p.booking(id).status === 'cancelled'), 'all cancelled automatically');
        c.ok(ids.every((id) => p.payments(id).every((x) => x.state === 'voided')), 'the pending charges are voided, never sent');
        c.ok(p.outbox().some((n) => n.to === 'vendor' && n.bookingId === ids[0]), 'vendors told');
        const slot = p.slot('apo-island-trip', S.tue, '07:30');
        c.eq(slot.held + slot.confirmed, 0, 'holds released');
      });
    },
  },
];
