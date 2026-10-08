import { SCENE as S } from '../catalog';
import { draft, type Scenario } from './kit';

const G = 'Chat and cards' as const;
const trip = (extra = {}) => draft('apo-island-trip', S.fri, 2, { time: '07:30', payMode: 'room', ...extra });
const bike = (extra = {}) => draft('bike-rental', S.sat, 2, { time: '08:00', days: 1, payMode: 'room', ...extra });

export const CHAT: Scenario[] = [
  {
    id: 'Q1',
    group: G,
    title: 'One booking, the same on both sides of its chat',
    run(c) {
      const { p } = c;
      let id = '';
      const states = () => [p.threads('guest', p.maria.guestId), p.threads('vendor', 'boat-operator')].map((rows) => rows.find((t) => t.bookingId === id)?.cardState);
      c.step('The booking shows the same state to the guest and the vendor', () => {
        id = c.ask(trip());
        c.eq(states().join(','), 'for-confirmation,for-confirmation', 'both agree');
      });
      c.step('It changes state: both show it at once, with no stale copy', () => {
        c.must(p.vendor('boat-operator').confirm(id));
        c.eq(states().join(','), 'confirmed,confirmed', 'both show Confirmed');
        const thread = c.must(p.thread(p.booking(id).threadId, 'guest'));
        c.ok(thread.messages.filter((m) => m.kind === 'card').every((m) => m.bookingId === id), 'a card is a view of the record, not a copy');
      });
    },
  },
  {
    id: 'Q2',
    group: G,
    title: 'Thread closes 48 hours after the service',
    run(c) {
      const { p } = c;
      let id = '';
      c.step('A rental completed 49 hours ago', () => {
        id = c.ask(bike());
        c.must(p.vendor('bike-shop').confirm(id));
        p.advanceTo(p.at(S.sat, '08:05'));
        c.must(p.vendor('bike-shop').scan(id));
        c.must(p.vendor('bike-shop').complete(id));
        p.advanceTo(p.booking(id).end + 49 * 3_600_000);
      });
      c.step('She opens the thread: cards visible, a question goes to the desk', () => {
        const t = c.must(p.thread(p.booking(id).threadId, 'guest'));
        c.eq(t.readOnly, true, 'read-only');
        c.ok(t.messages.some((m) => m.kind === 'card'), 'cards still visible');
        const sent = c.must(p.guest().send(p.booking(id).threadId, 'Did I leave my lock there?'));
        c.eq(sent.redirectedTo, p.deskThreadId(p.maria.stayId), 'the question goes to the desk thread');
        const desk = c.must(p.thread(p.deskThreadId(p.maria.stayId), 'desk'));
        c.ok(desk.messages.some((m) => /lock/.test(m.text)), 'the desk has it');
      });
    },
  },
  {
    id: 'Q3',
    group: G,
    title: 'Vendor types "ok" instead of tapping Confirm',
    run(c) {
      const { p } = c;
      c.step('Only the buttons change a status', () => {
        const id = c.ask(trip());
        const threadId = p.booking(id).threadId;
        c.must(p.vendor('boat-operator').message(threadId, 'ok'));
        c.eq(p.booking(id).status, 'requested', 'status unchanged');
        const vendorView = c.must(p.thread(threadId, 'vendor'));
        c.ok(vendorView.messages.some((m) => m.kind === 'system' && /tap confirm/i.test(m.text)), 'the card reminds the vendor to tap Confirm');
        const guestView = c.must(p.thread(threadId, 'guest'));
        c.ok(!guestView.messages.some((m) => /tap confirm/i.test(m.text)), 'the reminder is for the vendor');
      });
    },
  },
  {
    id: 'Q4',
    group: G,
    title: 'Desk books for a guest who asked in person',
    run(c) {
      const { p } = c;
      c.step('The desk records that she asked, with the staff name, before the charge', () => {
        const id = c.must(p.desk.bookFor(p.maria.guestId, draft('yoga-class', S.fri, 1, { time: '06:30', payMode: 'room' }), { staffName: 'Ana', asked: 'in-person' })).bookingId;
        const log = p.log();
        const noted = log.findIndex((l) => l.kind === 'desk-booked' && l.detail.includes('Ana') && l.detail.includes('in-person') && l.detail.includes(id));
        const charged = log.findIndex((l) => l.entity === 'payment' && l.detail.includes(id));
        c.ok(noted >= 0 && charged >= 0 && noted < charged, 'the note comes before the charge');
        const desk = c.must(p.thread(p.deskThreadId(p.maria.stayId), 'guest'));
        c.ok(desk.messages.some((m) => m.kind === 'card' && m.bookingId === id), 'she sees the card');
      });
    },
  },
  {
    id: 'Q5',
    group: G,
    title: 'Guest has notifications off',
    run(c) {
      const { p } = c;
      let id = '';
      c.step('Push is not delivered when the vendor cancels', () => {
        id = c.ask(trip());
        c.must(p.vendor('boat-operator').confirm(id));
        p.setGuestNotifications(p.maria.guestId, false);
        c.must(p.vendor('boat-operator').cancel(id, 'Boat out of service'));
        const push = p.outbox().find((n) => n.to === 'guest' && n.channel === 'push' && n.topic === 'vendor-cancelled' && n.bookingId === id)!;
        c.eq(push.delivered, false, 'not delivered');
      });
      c.step('10 minutes later an SMS goes out, and the thread list shows an unread badge', () => {
        p.advanceMinutes(10);
        c.ok(p.outbox().some((n) => n.to === 'guest' && n.channel === 'sms' && n.topic === 'vendor-cancelled' && n.bookingId === id), 'SMS sent');
        const row = p.threads('guest', p.maria.guestId).find((t) => t.bookingId === id)!;
        c.ok(row.unread > 0, 'unread badge');
      });
    },
  },
  {
    id: 'Q6',
    group: G,
    title: 'A booking chat is the guest and the vendor, one to one',
    run(c) {
      const { p } = c;
      c.step('She requests the Apo Island trip', () => {
        const id = c.ask(trip());
        const row = p.threads('guest', p.maria.guestId).find((t) => t.bookingId === id)!;
        c.eq(row.kind, 'booking', 'a booking thread');
        for (const viewer of ['guest', 'vendor'] as const) {
          const t = c.must(p.thread(p.booking(id).threadId, viewer));
          c.ok(t.messages.length > 0, `${viewer} can read it`);
          c.ok(t.messages.every((m) => m.from.name.length > 0), 'every message names its sender');
          c.ok(t.messages.some((m) => m.kind === 'card' && m.bookingId === id), `${viewer} sees the same booking card`);
        }
        c.refused(p.thread(p.booking(id).threadId, 'desk'), 'not-a-participant');
        c.ok(!p.threads('desk').some((t) => t.bookingId === id && t.kind === 'booking'), 'the desk does not have the chat in its list');
      });
    },
  },
  {
    id: 'Q7',
    group: G,
    title: 'Desk talks to the vendor privately',
    run(c) {
      const { p } = c;
      c.step('A private note never reaches the guest or the booking thread', () => {
        const id = c.ask(trip());
        const before = c.must(p.thread(p.booking(id).threadId, 'guest')).messages.length;
        c.must(p.desk.privateNote('boat-operator', 'Guest is a regular, hold the front seats', id));
        c.refused(p.thread(p.privateThreadId('boat-operator'), 'guest'), 'not-a-participant');
        const after = c.must(p.thread(p.booking(id).threadId, 'guest')).messages;
        c.eq(after.length, before, 'the booking thread is unchanged');
        c.ok(!after.some((m) => /front seats/.test(m.text)), 'the note is not in it');
        c.ok(c.must(p.thread(p.privateThreadId('boat-operator'), 'vendor')).messages.some((m) => /front seats/.test(m.text)), 'the vendor has it');
      });
    },
  },
  {
    id: 'Q8',
    group: G,
    title: 'Vendor answers a guest question',
    run(c) {
      const { p } = c;
      c.step('The vendor answers in the chat; the desk says its part in its own chat with her', () => {
        const id = c.ask(trip());
        c.must(p.vendor('boat-operator').confirm(id));
        const t = p.booking(id).threadId;
        c.must(p.guest().send(t, 'Can we bring a child seat? Our son is 4.'));
        c.must(p.vendor('boat-operator').message(t, 'Yes, we have one. No extra charge.'));
        c.must(p.desk.messageBooking(t, 'Noted. I added the child seat to the booking.'));
        const texts = c.must(p.thread(t, 'guest')).messages.filter((m) => m.kind === 'text');
        c.eq(texts.map((m) => m.from.role).join(','), 'guest,vendor', 'only the two of them, in order');
        const desk = c.must(p.thread(p.deskThreadId(p.maria.stayId), 'guest')).messages;
        c.ok(desk.some((m) => m.from.role === 'desk' && /child seat/.test(m.text) && m.bookingId === id), 'the desk note is in the desk chat, tied to the booking');
        c.eq(p.booking(id).status, 'confirmed', 'the booking status is unchanged');
      });
    },
  },
  {
    id: 'Q9',
    group: G,
    title: 'Booking thread after a cancel',
    run(c) {
      const { p } = c;
      c.step('49 hours after the cancel the thread is read-only; the Cancelled card stays', () => {
        const id = c.ask(trip());
        c.must(p.vendor('boat-operator').confirm(id));
        c.must(p.guest().cancel(id));
        p.advanceHours(47);
        c.eq(c.must(p.thread(p.booking(id).threadId, 'guest')).readOnly, false, 'still open at 47 hours');
        p.advanceHours(2);
        const t = c.must(p.thread(p.booking(id).threadId, 'guest'));
        c.eq(t.readOnly, true, 'read-only at 49 hours');
        c.ok(t.messages.length > 0, 'still readable');
        c.eq(p.threads('guest', p.maria.guestId).find((x) => x.bookingId === id)!.cardState, 'cancelled', 'the Cancelled card stays on top');
      });
    },
  },
];
