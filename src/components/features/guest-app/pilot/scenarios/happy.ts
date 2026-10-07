import { SCENE as S } from '../catalog';
import { draft, type Scenario } from './kit';

const G = 'Happy paths' as const;

export const HAPPY: Scenario[] = [
  {
    id: 'H1',
    group: G,
    title: 'Bike rental paid by room',
    run(c) {
      const { p } = c;
      p.setCapacity('bike-rental', 2);
      let id = '';
      c.step('Maria asks for 2 bikes on Saturday, paying by room', () => {
        id = c.ask(draft('bike-rental', S.sat, 2, { time: '08:00', days: 1, payMode: 'room' }));
        c.eq(p.booking(id).status, 'requested', 'asked, so Requested');
        c.eq(p.payments(id).length, 0, 'nothing charged before the shop accepts');
      });
      c.step('The shop accepts at minute 10', () => {
        p.advanceMinutes(10);
        c.must(p.vendor('bike-shop').confirm(id));
        c.eq(p.booking(id).status, 'confirmed', 'Confirmed');
        const pay = p.payments(id);
        c.eq(pay.length, 1, 'one room charge');
        c.eq(pay[0]!.state, 'posted', 'posted to the room');
        c.eq(pay[0]!.amount, 900, '2 bikes for a day');
      });
      c.step('Saturday 8:34 the shop scans her QR', () => {
        p.advanceTo(p.at(S.sat, '08:34'));
        c.must(p.vendor('bike-shop').scan(id));
        c.eq(p.booking(id).status, 'in-progress', 'In progress');
      });
      c.step('The bikes come back on time', () => {
        c.must(p.vendor('bike-shop').complete(id));
        c.eq(p.booking(id).status, 'completed', 'Completed');
        c.eq(p.payments(id).length, 1, 'no extra charge');
        const slot = p.slot('bike-rental', S.sat);
        c.eq(slot.held + slot.confirmed, 0, 'hold released at completion');
      });
    },
  },
  {
    id: 'H2',
    group: G,
    title: 'Bike rental paid in full',
    run(c) {
      const { p } = c;
      let id = '';
      c.step('Maria asks for 2 bikes and picks Pay in full', () => {
        id = c.ask(draft('bike-rental', S.sat, 2, { time: '08:00', days: 1, payMode: 'card' }));
        c.eq(p.payments(id).length, 0, 'nothing taken yet');
      });
      c.step('The shop accepts; she pays within 15 minutes', () => {
        p.advanceMinutes(10);
        c.must(p.vendor('bike-shop').confirm(id));
        c.eq(p.booking(id).status, 'awaiting-payment', 'Awaiting payment');
        const pay = p.payments(id)[0]!;
        c.eq(pay.mode, 'card', 'paid in full by card');
        c.eq(pay.state, 'awaiting', 'awaiting');
        p.advanceMinutes(4);
        const out = c.must(p.guest().payCard(id));
        c.eq(out.outcome, 'paid', 'paid');
      });
      c.step('Confirmed with one Paid payment and no room charge', () => {
        c.eq(p.booking(id).status, 'confirmed', 'Confirmed');
        const pays = p.payments(id);
        c.eq(pays.filter((x) => x.state === 'paid').length, 1, 'one Paid payment');
        c.eq(pays.filter((x) => x.mode === 'room').length, 0, 'no room charge');
      });
    },
  },
  {
    id: 'H3',
    group: G,
    title: 'Apo Island trip from the app, by room',
    run(c) {
      const { p } = c;
      p.setCapacity('apo-island-trip', 4, p.slotKeyFor('apo-island-trip', S.fri, '07:30'));
      let id = '';
      c.step('Maria requests 2 seats; the operator accepts', () => {
        id = c.ask(draft('apo-island-trip', S.fri, 2, { time: '07:30', payMode: 'room' }));
        c.must(p.vendor('boat-operator').confirm(id));
      });
      c.step('Confirmed with a QR, 2 seats left, one room charge posted', () => {
        c.eq(p.booking(id).status, 'confirmed', 'Confirmed');
        c.ok(p.card(id).actions.includes('show-qr'), 'the card offers the QR');
        const slot = p.slot('apo-island-trip', S.fri, '07:30');
        c.eq(slot.capacity - slot.held - slot.confirmed, 2, '2 seats left');
        const pays = p.payments(id);
        c.eq(pays.length, 1, 'one charge');
        c.eq(pays[0]!.state, 'posted', 'posted');
        c.eq(pays[0]!.amount, 3200, '₱3,200');
      });
    },
  },
  {
    id: 'H4',
    group: G,
    title: 'Apo Island trip asked through the desk',
    run(c) {
      const { p } = c;
      let id = '';
      c.step('Maria messages the front desk; the desk messages the operator privately', () => {
        c.must(p.guest().sendToDesk('Can you book us the Apo Island trip on Friday? Two of us.'));
        c.must(p.desk.privateNote('boat-operator', 'Booking for a guest: Maria, Villa 12. Two seats on the Friday 7:30 boat?'));
        c.must(p.vendor('boat-operator').replyPrivate('Yes. 7:30 AM, ₱1,600 a guest.'));
      });
      c.step('The desk attaches the booking', () => {
        id = c.must(p.desk.bookFor(p.maria.guestId, draft('apo-island-trip', S.fri, 2, { time: '07:30', payMode: 'room' }), { staffName: 'Ana', asked: 'chat' })).bookingId;
        const desk = c.must(p.thread(p.deskThreadId(p.maria.stayId), 'guest'));
        c.ok(desk.messages.some((m) => m.kind === 'card' && m.bookingId === id), 'the booking card is in the guest thread');
        c.refused(p.thread(p.privateThreadId('boat-operator'), 'guest'), 'not-a-participant');
        c.ok(p.log().some((l) => l.kind === 'pay-gate' && l.detail.includes(id)), 'the payment check ran');
      });
    },
  },
  {
    id: 'H5',
    group: G,
    title: 'Guest adds the tour card to the chat',
    run(c) {
      const { p } = c;
      let id = '';
      c.step('Maria adds the tour card in the front desk thread and sends it', () => {
        id = c.ask(draft('apo-island-trip', S.fri, 2, { time: '07:30', payMode: 'room', origin: 'guest-chat' }));
        c.eq(p.booking(id).status, 'requested', 'the request goes straight to the operator');
        c.ok(p.outbox().some((n) => n.to === 'vendor' && n.bookingId === id), 'the operator was told');
        c.must(p.thread(p.booking(id).threadId, 'desk'));
        const desk = c.must(p.thread(p.deskThreadId(p.maria.stayId), 'guest'));
        c.ok(desk.messages.some((m) => m.kind === 'card' && m.bookingId === id), 'the card is in the desk thread');
      });
      c.step('It ends on the same Confirmed card as H4', () => {
        c.must(p.vendor('boat-operator').confirm(id));
        c.eq(p.card(id).state, 'confirmed', 'Confirmed card');
      });
    },
  },
  {
    id: 'H6',
    group: G,
    title: 'Pasalubong from Cafe Sans Rival, 3 days ahead',
    adapted: 'Pasalubong charges as the guest confirms; there is no vendor accept step.',
    options: { mariaStay: { checkIn: '2026-10-05', checkOut: S.tue } },
    run(c) {
      const { p } = c;
      let id = '';
      c.step('Saturday Maria orders 3 boxes for her departure day, Tuesday', () => {
        p.advanceTo(p.at(S.sat, '10:00'));
        id = c.ask(draft('sans-rival-boxes', S.tue, 3, { payMode: 'room' }));
        c.eq(p.booking(id).status, 'confirmed', 'Confirmed as she confirms');
        const pay = p.payments(id)[0]!;
        c.eq(pay.state, 'posted', 'charge posted');
        c.eq(pay.amount, 1350, '₱1,350');
      });
      c.step('Cafe Sans Rival packs it and sends it to the desk; the desk holds it chilled', () => {
        c.must(p.vendor('cafe-sans-rival').sendToDesk(id));
        c.must(p.desk.markReady(id));
        c.eq(p.booking(id).status, 'ready', 'Ready');
        c.eq(p.card(id).state, 'ready', 'Ready card');
        c.ok(p.card(id).facts.some((f) => /departure/i.test(f.value)), 'the card says ready for the departure day');
      });
      c.step('Tuesday she collects it at the desk', () => {
        p.advanceTo(p.at(S.tue, '09:00'));
        c.must(p.desk.handOver(id));
        c.eq(p.booking(id).status, 'collected', 'Collected, order closed');
      });
    },
  },
  {
    id: 'H7',
    group: G,
    title: 'Table at Si Señor',
    run(c) {
      const { p } = c;
      let id = '';
      c.step('Maria reserves for 2 at 7:00 PM', () => {
        id = c.ask(draft('si-senor', S.today, 2, { time: '19:00' }));
        c.eq(p.booking(id).status, 'reserved', 'Reserved at once');
        c.eq(p.payments(id).length, 0, 'nothing charged');
        c.ok(p.card(id).actions.includes('open-menu'), 'PDF menu on the card');
        c.ok(p.threads('guest', p.maria.guestId).some((t) => t.bookingId === id), 'chat opens');
      });
      c.step('The venue marks Seated', () => {
        p.advanceTo(p.at(S.today, '19:05'));
        c.must(p.vendor('si-senor').seat(id));
        c.eq(p.booking(id).status, 'seated', 'Seated');
      });
    },
  },
  {
    id: 'H8',
    group: G,
    title: 'Table at The Red Kitchen at the party limit',
    run(c) {
      const { p } = c;
      c.step('8 reserves', () => {
        const id = c.ask(draft('the-red-kitchen', S.today, 8, { time: '19:00' }));
        c.eq(p.booking(id).status, 'reserved', '8 reserves');
      });
      c.step('9 is stopped with Message the restaurant', () => {
        c.refused(p.guest().request(draft('the-red-kitchen', S.today, 9, { time: '19:00' })), 'over-maximum', 'Message the restaurant');
      });
    },
  },
  {
    id: 'H9',
    group: G,
    title: "Henry's own yoga class",
    adapted: 'Henry’s own activities charge as the guest confirms; staff do not accept first.',
    run(c) {
      const { p } = c;
      let id = '';
      c.step('Maria books yoga; it is confirmed with the charge', () => {
        id = c.ask(draft('yoga-class', S.fri, 1, { time: '06:30', payMode: 'room' }));
        c.eq(p.booking(id).status, 'confirmed', 'Confirmed');
        c.eq(p.payments(id)[0]!.state, 'posted', 'charge posted');
      });
      c.step('Staff scan and complete it, in the same states as a partner service', () => {
        p.advanceTo(p.at(S.fri, '06:28'));
        c.must(p.vendor('henrys-activities').scan(id));
        c.must(p.vendor('henrys-activities').complete(id));
        c.eq(c.states(id).join(' > '), 'confirmed > in-progress > completed', 'Confirmed, In progress, Completed');
      });
    },
  },
  {
    id: 'H10',
    group: G,
    title: 'Room booking made before arrival',
    options: { mariaStay: { checkIn: S.mon, checkOut: '2026-10-15', status: 'booked', room: '' } },
    run(c) {
      const { p } = c;
      let id = '';
      c.step('Arrival is in 5 days; Maria picks room payment for a trip inside the stay', () => {
        id = c.ask(draft('apo-island-trip', S.tue, 2, { time: '07:30', payMode: 'room' }));
      });
      c.step('The vendor accepts today: the charge waits as Pending', () => {
        c.must(p.vendor('boat-operator').confirm(id));
        c.eq(p.booking(id).status, 'confirmed', 'Confirmed');
        c.eq(p.payments(id)[0]!.state, 'pending', 'Pending');
        c.eq(p.foliosTotal(p.maria.stayId), 0, 'nothing on the folio yet');
      });
      c.step('She checks in on arrival day: it posts, once', () => {
        p.advanceTo(p.at(S.mon, '14:00'));
        c.must(p.desk.checkIn(p.maria.stayId));
        c.eq(p.payments(id)[0]!.state, 'posted', 'Posted');
        c.eq(p.pms.folio.filter((f) => f.ref === p.payments(id)[0]!.ref).length, 1, 'posted once');
      });
    },
  },
];
