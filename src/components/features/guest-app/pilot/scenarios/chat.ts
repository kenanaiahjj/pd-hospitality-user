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
  {
    id: 'Q10',
    group: G,
    title: 'The front desk reads a dispute, read only',
    run(c) {
      const { p } = c;
      let rental = '';
      let extra = '';
      const thread = () => p.booking(rental).threadId;
      c.step('She questions a late-return charge: a dispute opens', () => {
        rental = c.ask(bike());
        c.must(p.vendor('bike-shop').confirm(rental));
        p.advanceTo(p.at(S.sat, '08:05'));
        c.must(p.vendor('bike-shop').scan(rental));
        c.must(p.guest().send(thread(), 'We will bring them back by six.'));
        c.must(p.vendor('bike-shop').message(thread(), 'Thank you. Back by six is fine.'));
        extra = c.must(p.vendor('bike-shop').addExtra(rental, 300, 'Late return')).paymentId;
        c.must(p.guest().question(extra, 'We were back on time.'));
        c.eq(p.disputes(rental).filter((d) => d.decidedAt === undefined).length, 1, 'one open dispute');
        c.ok(p.tasks('open').some((t) => t.kind === 'questioned-charge' && t.paymentId === extra), 'a desk task');
      });
      c.step('The desk reads the chat: read only, both sides told, logged', () => {
        const read = c.must(p.desk.readDispute(rental));
        c.ok(read.messages.some((m) => /back by six/i.test(m.text) && m.from.role === 'guest'), 'the desk sees what she said');
        c.ok(read.messages.some((m) => /six is fine/i.test(m.text) && m.from.role === 'vendor'), 'and what the shop said');
        c.refused(p.thread(thread(), 'desk'), 'not-a-participant');
        c.ok(!p.threads('desk').some((t) => t.id === thread()), 'the chat is not in the desk list: it is never a member');
        for (const viewer of ['guest', 'vendor'] as const) {
          c.ok(c.must(p.thread(thread(), viewer)).messages.some((m) => m.kind === 'system' && /front desk read this chat/i.test(m.text)), `the ${viewer} is told`);
        }
        c.ok(p.log().some((l) => l.kind === 'dispute-read' && l.entityId === rental), 'the open is logged');
        c.eq(p.disputes(rental)[0]!.reads.length, 1, 'one read on record');
      });
      c.step('The desk cannot write in it: what it says goes to its own chat with her', () => {
        const before = c.must(p.thread(thread(), 'guest')).messages.length;
        c.must(p.desk.messageBooking(thread(), 'I am looking into the late return.'));
        c.eq(c.must(p.thread(thread(), 'guest')).messages.length, before, 'nothing new in the guest and vendor chat');
        c.ok(c.must(p.thread(p.deskThreadId(p.maria.stayId), 'guest')).messages.some((m) => /looking into the late return/.test(m.text)), 'it is in the desk chat');
      });
      c.step('Deciding ends the access, and is logged', () => {
        c.must(p.desk.resolveCharge(extra, 'waive'));
        c.ok(p.disputes(rental).every((d) => d.decidedAt !== undefined), 'the dispute is decided');
        c.refused(p.desk.readDispute(rental), 'no-dispute');
        c.ok(p.log().some((l) => l.kind === 'dispute-decided' && l.entityId === rental), 'the decision is logged');
      });
      c.step('A vendor claims damage: added, held in question, readable until decided', () => {
        const claim = c.must(p.vendor('bike-shop').claimDamage(rental, 500, 'Bent wheel')).paymentId;
        c.eq(p.payment(claim).inQuestion, true, 'held in question');
        c.ok(p.disputes(rental).some((d) => d.kind === 'damage' && d.decidedAt === undefined), 'a damage dispute');
        c.must(p.desk.readDispute(rental));
        c.must(p.desk.resolveCharge(claim, 'uphold'));
        c.refused(p.desk.readDispute(rental), 'no-dispute');
      });
      c.step('A disputed vendor cancellation blocks checkout; reinstating sends a new request back', () => {
        // Sunday's boat: the clock is already past Friday's.
        const boat = c.ask(draft('apo-island-trip', S.sun, 2, { time: '07:30', payMode: 'room' }));
        c.must(p.vendor('boat-operator').confirm(boat));
        c.must(p.vendor('boat-operator').cancel(boat, 'Engine trouble'));
        c.must(p.guest().disputeCancel(boat, 'We were told the boat was fine.'));
        c.refused(p.desk.checkout(p.maria.stayId), 'blocked');
        c.must(p.desk.readDispute(boat));
        const again = c.must(p.desk.decideCancelDispute(boat, 'reinstate'));
        c.eq(p.booking(boat).status, 'cancelled', 'the cancellation stays on record');
        c.eq(p.booking(again.bookingId!).status, 'requested', 'a fresh request is back with the operator');
        c.refused(p.desk.readDispute(boat), 'no-dispute');
      });
    },
  },
  {
    id: 'Q11',
    group: G,
    title: 'The front desk is refused with no dispute open',
    run(c) {
      const { p } = c;
      c.step('A booking with a chat, nothing in question', () => {
        const id = c.ask(trip());
        c.must(p.vendor('boat-operator').confirm(id));
        c.must(p.guest().send(p.booking(id).threadId, 'Is there shade on the boat?'));
        c.refused(p.desk.readDispute(id), 'no-dispute');
        c.refused(p.thread(p.booking(id).threadId, 'desk'), 'not-a-participant');
        c.ok(!p.log().some((l) => l.kind === 'dispute-read'), 'nothing was read');
        const guestView = c.must(p.thread(p.booking(id).threadId, 'guest')).messages;
        c.ok(!guestView.some((m) => /front desk read/i.test(m.text)), 'no notice, because nothing was read');
        c.ok(p.tasks('open').every((t) => t.bookingId !== id || !['questioned-charge', 'disputed-cancel', 'damage-claim'].includes(t.kind)), 'the desk sees the booking and its tasks only');
      });
    },
  },
];
