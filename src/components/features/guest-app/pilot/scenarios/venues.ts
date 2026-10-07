import { SCENE as S } from '../catalog';
import { draft, type Scenario } from './kit';

const G = "Restaurants and pasalubong at Henry's" as const;

export const VENUES: Scenario[] = [
  {
    id: 'R1',
    group: G,
    title: 'Party above the venue maximum',
    run(c) {
      const { p } = c;
      c.step('Popolo Pizzeria’s maximum is 10; she enters 12', () => {
        c.refused(p.guest().request(draft('popolo-pizzeria', S.today, 12, { time: '19:30' })), 'over-maximum', 'Message the restaurant');
        const ok = c.ask(draft('popolo-pizzeria', S.today, 10, { time: '19:30' }));
        c.eq(p.booking(ok).status, 'reserved', '10 reserves');
      });
    },
  },
  {
    id: 'R2',
    group: G,
    title: 'Running late for a table',
    run(c) {
      const { p } = c;
      let id = '';
      c.step('Reserved at 7:00 PM at The Dining Room; she taps Running late', () => {
        id = c.ask(draft('the-dining-room', S.today, 2, { time: '19:00' }));
        p.advanceTo(p.at(S.today, '18:55'));
        c.must(p.guest().runningLate(id));
        c.ok(p.outbox().some((n) => n.to === 'vendor' && n.topic === 'running-late' && n.bookingId === id), 'the restaurant is told');
      });
      c.step('The table is held until 7:15, then released and marked No-show', () => {
        p.advanceTo(p.at(S.today, '19:14'));
        c.eq(p.booking(id).status, 'reserved', 'still held at 7:14');
        p.advanceTo(p.at(S.today, '19:16'));
        c.eq(p.booking(id).status, 'no-show', 'No-show');
        c.eq(p.payments(id).length, 0, 'nothing charged, ever');
        const slot = p.slot('the-dining-room', S.today, '19:00');
        c.eq(slot.held + slot.confirmed, 0, 'released');
      });
    },
  },
  {
    id: 'R3',
    group: G,
    title: 'Cancel a reservation',
    run(c) {
      const { p } = c;
      c.step('Cancelling is free at any time, even a minute before', () => {
        const id = c.ask(draft('si-senor', S.today, 2, { time: '19:00' }));
        p.advanceTo(p.at(S.today, '18:59'));
        c.must(p.guest().cancel(id));
        c.eq(p.booking(id).status, 'cancelled', 'Cancelled');
        c.eq(p.payments(id).length, 0, 'nothing to refund');
        c.eq(p.slot('si-senor', S.today, '19:00').held + p.slot('si-senor', S.today, '19:00').confirmed, 0, 'table released');
        c.ok(p.outbox().some((n) => n.to === 'vendor' && n.topic === 'cancelled' && n.bookingId === id), 'the restaurant is told');
      });
    },
  },
  {
    id: 'R4',
    group: G,
    title: 'Restaurant closes a slot for an event',
    run(c) {
      const { p } = c;
      const key = p.slotKeyFor('si-senor', S.sat, '19:00');
      const ids: string[] = [];
      c.step('5 reservations at Si Señor for Saturday 7:00 PM', () => {
        for (let i = 0; i < 5; i++) {
          const g = i === 0 ? { guestId: p.maria.guestId } : p.addGuest({ firstName: `Guest ${i}`, room: `Villa ${40 + i}`, checkIn: '2026-10-05', checkOut: S.tue });
          ids.push((p.guest(g.guestId).request(draft('si-senor', S.sat, 2, { time: '19:00' })) as { ok: true; bookingId: string }).bookingId);
        }
      });
      c.step('The venue closes the slot: each is cancelled with a reason', () => {
        const r = c.must(p.vendor('si-senor').cancelSlot('si-senor', key, 'Private event'));
        c.eq(r.count, 5, 'all 5');
        c.ok(ids.every((id) => p.booking(id).status === 'cancelled' && p.booking(id).reason === 'Private event'), 'cancelled with a reason');
        c.ok(ids.every((id) => p.outbox().some((n) => n.to === 'guest' && n.topic === 'vendor-cancelled' && n.bookingId === id)), 'each guest is told');
        c.ok(p.tasks().some((t) => t.kind === 'batch-cancel'), 'the desk is told');
      });
    },
  },
  {
    id: 'R5',
    group: G,
    title: 'Order food ahead',
    run(c) {
      const { p } = c;
      c.step('Order ahead is not offered; the PDF menu is on the card and she can ask in chat', () => {
        const id = c.ask(draft('si-senor', S.today, 2, { time: '19:00' }));
        const actions = p.card(id).actions as string[];
        c.ok(!actions.includes('order-ahead'), 'Order ahead is not offered');
        c.ok(actions.includes('open-menu'), 'the menu is');
        c.must(p.guest().send(p.booking(id).threadId, 'Is the menu the same on weekends?'));
      });
    },
  },
  {
    id: 'R6',
    group: G,
    title: 'Meal charged to the room at the venue',
    run(c) {
      const { p } = c;
      c.step('Si Señor posts its bill through its own system; then she makes a Cabana booking', () => {
        p.externalCharge(p.maria.stayId, 4800, 'Si Señor dinner');
        const q = c.must(p.guest().quote(draft('apo-island-trip', S.fri, 2, { time: '07:30' })));
        c.eq(q.options.room.offered, true, 'the limit counts only Cabana charges');
        const id = c.ask(draft('apo-island-trip', S.fri, 2, { time: '07:30', payMode: 'room' }));
        c.must(p.vendor('boat-operator').confirm(id));
        c.eq(p.foliosTotal(p.maria.stayId), 4800 + 3200, 'the meal shows on the bill at checkout');
      });
    },
  },
  {
    id: 'R7',
    group: G,
    title: 'Checkout without collecting pasalubong',
    adapted: 'Pasalubong charges as the guest confirms, so the order is Confirmed with the charge posted before it is packed.',
    options: { mariaStay: { checkIn: '2026-10-05', checkOut: S.today } },
    run(c) {
      const { p } = c;
      let id = '';
      c.step('The order is Ready at the desk', () => {
        id = c.ask(draft('sans-rival-boxes', S.today, 2, { payMode: 'room' }));
        c.must(p.vendor('cafe-sans-rival').sendToDesk(id));
        c.must(p.desk.markReady(id));
      });
      c.step('The desk starts checkout: it is on the checklist and handed over', () => {
        const out = c.must(p.desk.checkout(p.maria.stayId));
        c.eq(out.checklist.length, 1, 'on the desk checklist');
        c.ok(p.tasks('open').some((t) => t.kind === 'uncollected-goods' && t.bookingId === id), 'a task');
        c.must(p.desk.handOver(id));
        c.eq(p.booking(id).status, 'collected', 'handed over at checkout');
      });
    },
  },
  {
    id: 'R8',
    group: G,
    title: 'Pasalubong above the vendor cap',
    adapted: 'The cap check happens as the guest confirms; there is no vendor to ask first.',
    run(c) {
      const { p } = c;
      c.step('The cap is 50 boxes; she orders 80', () => {
        c.refused(p.guest().request(draft('sans-rival-boxes', S.tue, 80, { payMode: 'room' })), 'over-cap', 'chat');
        const id = c.ask(draft('sans-rival-boxes', S.tue, 50, { payMode: 'card' }));
        c.ok(p.booking(id).qty === 50, '50 is fine');
      });
    },
  },
];
