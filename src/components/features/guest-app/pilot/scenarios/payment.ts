import { SCENE as S } from '../catalog';
import { draft, type Scenario } from './kit';

const G = 'Payment' as const;
const trip = (extra = {}) => draft('apo-island-trip', S.fri, 2, { time: '07:30', payMode: 'room', ...extra });
const bike = (extra = {}) => draft('bike-rental', S.sat, 2, { time: '08:00', days: 1, payMode: 'room', ...extra });

export const PAYMENT: Scenario[] = [
  {
    id: 'P1',
    group: G,
    title: 'Over the limit, desk approves',
    run(c) {
      const { p } = c;
      let id = '';
      c.step('A ₱6,400 order against a ₱5,000 limit waits for the desk', () => {
        id = c.ask(draft('apo-island-trip', S.fri, 4, { time: '07:30', payMode: 'room' }));
        c.eq(p.booking(id).status, 'needs-approval', 'Needs desk approval');
        c.eq(p.booking(id).amount, 6400, '₱6,400');
        c.ok(p.tasks('open').some((t) => t.kind === 'over-limit-approval' && t.bookingId === id), 'a desk task');
        c.ok(p.outbox().every((n) => !(n.to === 'vendor' && n.bookingId === id)), 'the vendor sees nothing yet');
        const slot = p.slot('apo-island-trip', S.fri, '07:30');
        c.eq(slot.held, 4, 'the slot is held');
      });
      c.step('The desk approves in 4 minutes', () => {
        p.advanceMinutes(4);
        c.must(p.desk.approve(id));
        c.eq(p.booking(id).status, 'requested', 'Requested');
        c.eq(p.slot('apo-island-trip', S.fri, '07:30').held, 4, 'held throughout');
        c.ok(p.outbox().some((n) => n.to === 'vendor' && n.bookingId === id), 'now the vendor is told');
      });
    },
  },
  {
    id: 'P2',
    group: G,
    title: 'Over the limit, desk is silent',
    run(c) {
      const { p } = c;
      let id = '';
      c.step('10 minutes pass with no answer: the guest is asked to pay in full or cancel', () => {
        id = c.ask(draft('apo-island-trip', S.fri, 4, { time: '07:30', payMode: 'room' }));
        p.advanceMinutes(10);
        c.eq(p.booking(id).status, 'pay-or-cancel', 'Pay in full or cancel');
        const actions = p.card(id).actions;
        c.ok(actions.includes('pay-in-full') && actions.includes('cancel'), 'the card offers both');
        c.eq(p.slot('apo-island-trip', S.fri, '07:30').held, 4, 'the slot stays held');
      });
      c.step('She chooses to pay in full: it goes to the vendor first', () => {
        c.must(p.guest().choosePayInFull(id));
        c.eq(p.booking(id).status, 'requested', 'Requested');
        c.eq(p.booking(id).payMode, 'card', 'paid in full');
      });
      c.step('Left undecided, the hold is released', () => {
        const q = c.fresh();
        const other = (q.guest().request(draft('apo-island-trip', S.fri, 4, { time: '07:30', payMode: 'room' })) as { ok: true; bookingId: string }).bookingId;
        q.advanceMinutes(10 + q.settings.payOrCancelMin);
        c.eq(q.booking(other).status, 'lapsed', 'timed out');
        const slot = q.slot('apo-island-trip', S.fri, '07:30');
        c.eq(slot.held + slot.confirmed, 0, 'hold released');
      });
    },
  },
  {
    id: 'P3',
    group: G,
    title: 'Service date outside the stay',
    options: { mariaStay: { checkIn: '2026-10-05', checkOut: S.mon } },
    run(c) {
      const { p } = c;
      c.step('She checks out Monday; the trip is Tuesday', () => {
        const q = c.must(p.guest().quote(trip({ date: S.tue })));
        c.eq(q.options.room.offered, false, 'Charge to room is not offered');
        c.ok(/stay/i.test(q.options.room.why ?? ''), 'she is told why');
        c.eq(q.options.defaultMode, 'card', 'only Pay in full');
        c.refused(p.guest().request(trip({ date: S.tue, payMode: 'room' })), 'not-offered');
        c.must(p.guest().request(trip({ date: S.tue, payMode: 'card' })));
      });
    },
  },
  {
    id: 'P4',
    group: G,
    title: 'Card payment fails three times',
    run(c) {
      const { p } = c;
      let id = '';
      c.step('The vendor accepted; the gateway is set to fail', () => {
        id = c.ask(trip({ payMode: 'card' }));
        c.must(p.vendor('boat-operator').confirm(id));
        p.setGateway({ mode: 'fail' });
      });
      c.step('She tries three times', () => {
        const left = [1, 2, 3].map(() => c.must(p.guest().payCard(id)).triesLeft);
        c.eq(left.join(','), '2,1,0', 'tries left');
        c.eq(p.booking(id).status, 'payment-expired', 'Payment expired');
        c.eq(p.payments(id)[0]!.state, 'expired', 'expired');
        const slot = p.slot('apo-island-trip', S.fri, '07:30');
        c.eq(slot.held + slot.confirmed, 0, 'slot released');
        c.ok(p.outbox().some((n) => n.to === 'vendor' && n.topic === 'slot-free' && n.bookingId === id), 'the vendor is told it is free');
      });
    },
  },
  {
    id: 'P5',
    group: G,
    title: 'Guest never pays',
    run(c) {
      const { p } = c;
      let id = '';
      c.step('The vendor accepted; 15 minutes pass', () => {
        id = c.ask(trip({ payMode: 'card' }));
        c.must(p.vendor('boat-operator').confirm(id));
        p.advanceMinutes(15);
        c.eq(p.booking(id).status, 'payment-expired', 'Payment expired');
        c.eq(p.payments(id)[0]!.state, 'expired', 'expired');
        c.eq(p.slot('apo-island-trip', S.fri, '07:30').held, 0, 'slot released');
      });
      c.step('She can send a new request', () => {
        const again = c.ask(trip({ payMode: 'card' }));
        c.ok(again !== id, 'a new booking');
        c.eq(p.booking(again).status, 'requested', 'Requested');
      });
    },
  },
  {
    id: 'P6',
    group: G,
    title: 'Gateway took the money, callback lost',
    run(c) {
      c.step('Run 1: she pays; two minutes pass', () => {
        const q = c.fresh();
        const id = (q.guest().request(trip({ payMode: 'card' })) as { ok: true; bookingId: string }).bookingId;
        q.vendor('boat-operator').confirm(id);
        q.setGateway({ loseCallbacks: true });
        q.guest().payCard(id);
        c.eq(q.booking(id).status, 'awaiting-payment', 'the app has not heard');
        q.advanceMinutes(2);
        c.eq(q.booking(id).status, 'confirmed', 'reconciliation found it paid; the slot was held');
      });
      c.step('Run 2: she pays at minute 14, after which the slot is released', () => {
        const q = c.fresh();
        const id = (q.guest().request(trip({ payMode: 'card' })) as { ok: true; bookingId: string }).bookingId;
        q.vendor('boat-operator').confirm(id);
        q.setGateway({ loseCallbacks: true });
        q.advanceMinutes(14);
        q.guest().payCard(id);
        q.advanceMinutes(4);
        c.eq(q.booking(id).status, 'payment-expired', 'the slot was already released');
        c.ok(q.payments(id).every((x) => x.state === 'refunded' || x.state === 'expired'), 'refunded automatically');
        c.eq(q.gateway.net, 0, 'the gateway holds nothing');
      });
    },
  },
  {
    id: 'P7',
    group: G,
    title: 'Guest pays twice',
    run(c) {
      const { p } = c;
      c.step('The gateway lets a second payment through', () => {
        const id = c.ask(trip({ payMode: 'card' }));
        c.must(p.vendor('boat-operator').confirm(id));
        p.setGateway({ allowDoublePay: true });
        c.must(p.guest().payCard(id));
        p.guest().payCard(id);
        const pays = p.payments(id);
        c.eq(pays.filter((x) => x.state === 'paid').length, 1, 'one Paid payment remains');
        c.ok(pays.some((x) => x.state === 'refunded' || x.state === 'refund-pending'), 'the second is refunded automatically');
        p.advanceMinutes(5);
        c.eq(p.gateway.net, 3200, 'the gateway holds one payment');
      });
    },
  },
  {
    id: 'P8',
    group: G,
    title: 'Refund fails',
    run(c) {
      const { p } = c;
      c.step('The gateway fails refunds; she cancels a paid booking', () => {
        const id = c.ask(trip({ payMode: 'card' }));
        c.must(p.vendor('boat-operator').confirm(id));
        c.must(p.guest().payCard(id));
        p.setGateway({ failRefunds: true });
        c.must(p.guest().cancel(id));
        c.eq(p.payments(id)[0]!.state, 'refund-failed', 'Refund failed');
        const task = p.tasks('open').find((t) => t.kind === 'failed-refund' && t.bookingId === id);
        c.ok(task && task.detail.includes('3,200') && /card/i.test(task.detail), 'a desk task with the amount and method');
        const thread = c.must(p.thread(p.booking(id).threadId, 'guest'));
        c.ok(thread.messages.some((m) => /hotel is handling/i.test(m.text)), 'she is told the hotel is handling it');
      });
    },
  },
  {
    id: 'P9',
    group: G,
    title: 'Extra charge by room',
    run(c) {
      const { p } = c;
      let id = '';
      c.step('The bike comes back 70 minutes late', () => {
        id = c.ask(bike());
        c.must(p.vendor('bike-shop').confirm(id));
        p.advanceTo(p.at(S.sat, '08:05'));
        c.must(p.vendor('bike-shop').scan(id));
        p.advanceTo(p.at(S.sat, '18:10'));
      });
      c.step('The shop adds ₱150 with a reason', () => {
        const extra = c.must(p.vendor('bike-shop').addExtra(id, 150, 'Late return fee'));
        const pay = p.payment(extra.paymentId);
        c.eq(pay.mode, 'room', 'by room, her booking’s method');
        c.eq(pay.state, 'posted', 'posts to the room');
        c.eq(pay.reason, 'Late return fee', 'a reason');
        c.ok(c.must(p.thread(p.booking(id).threadId, 'guest')).messages.some((m) => /150/.test(m.text)), 'she sees it at once');
        c.must(p.vendor('bike-shop').complete(id));
        c.eq(p.booking(id).status, 'completed', 'Completed');
      });
    },
  },
  {
    id: 'P10',
    group: G,
    title: 'Extra charge on a card booking, unpaid',
    run(c) {
      const { p } = c;
      let extraId = '';
      c.step('The booking was paid in full; an extra charge is added', () => {
        const id = c.ask(bike({ payMode: 'card' }));
        c.must(p.vendor('bike-shop').confirm(id));
        c.must(p.guest().payCard(id));
        p.advanceTo(p.at(S.sat, '08:05'));
        c.must(p.vendor('bike-shop').scan(id));
        extraId = c.must(p.vendor('bike-shop').addExtra(id, 150, 'Late return fee')).paymentId;
        c.eq(p.payment(extraId).state, 'awaiting', 'open, card');
        c.must(p.vendor('bike-shop').complete(id));
      });
      c.step('She ignores it until checkout: checkout is blocked', () => {
        const out = p.desk.checkout(p.maria.stayId);
        c.ok(!out.ok, 'checkout is blocked');
        if (out.ok) return;
        c.ok(out.message.includes('150') || out.message.toLowerCase().includes('unpaid'), 'the unpaid extra is named');
      });
      c.step('The desk collects or waives it; checkout then goes through', () => {
        c.must(p.desk.resolveCharge(extraId, 'waive'));
        c.must(p.desk.checkout(p.maria.stayId));
      });
    },
  },
  {
    id: 'P11',
    group: G,
    title: 'Guest questions an extra charge',
    run(c) {
      const setup = () => {
        const q = c.fresh();
        const id = (q.guest().request(bike()) as { ok: true; bookingId: string }).bookingId;
        q.vendor('bike-shop').confirm(id);
        q.advanceTo(q.at(S.sat, '08:05'));
        q.vendor('bike-shop').scan(id);
        const extra = (q.vendor('bike-shop').addExtra(id, 150, 'Late return fee') as { ok: true; paymentId: string }).paymentId;
        q.vendor('bike-shop').complete(id);
        q.guest().question(extra, 'I returned it on time');
        return { q, id, extra };
      };
      c.step('In question blocks checkout', () => {
        const { q, extra } = setup();
        c.eq(q.payment(extra).inQuestion, true, 'In question');
        c.ok(!q.desk.checkout(q.maria.stayId).ok, 'checkout blocked');
      });
      c.step('The desk upholds it', () => {
        const { q, extra } = setup();
        c.must(q.desk.resolveCharge(extra, 'uphold'));
        c.eq(q.payment(extra).inQuestion, false, 'no longer in question');
        c.eq(q.payment(extra).state, 'posted', 'the charge stands');
      });
      c.step('The desk adjusts it: the old one is voided and a new one posted', () => {
        const { q, id, extra } = setup();
        c.must(q.desk.resolveCharge(extra, 'adjust', 100));
        c.ok(['voided', 'reversed'].includes(q.payment(extra).state), 'old charge undone');
        const live = q.payments(id).filter((x) => x.purpose === 'extra' && x.state === 'posted');
        c.eq(live.length, 1, 'one new charge');
        c.eq(live[0]!.amount, 100, 'at the adjusted amount');
      });
      c.step('The desk waives it', () => {
        const { q, extra } = setup();
        c.must(q.desk.resolveCharge(extra, 'waive'));
        c.ok(['voided', 'reversed'].includes(q.payment(extra).state), 'charge undone');
        c.ok(q.desk.checkout(q.maria.stayId).ok, 'checkout goes through');
      });
    },
  },
  {
    id: 'P12',
    group: G,
    title: 'Vendor corrects a wrong amount',
    run(c) {
      const setup = () => {
        const q = c.fresh();
        const id = (q.guest().request(bike()) as { ok: true; bookingId: string }).bookingId;
        q.vendor('bike-shop').confirm(id);
        q.advanceTo(q.at(S.sat, '08:05'));
        q.vendor('bike-shop').scan(id);
        const extra = (q.vendor('bike-shop').addExtra(id, 1500, 'Late return fee') as { ok: true; paymentId: string }).paymentId;
        return { q, id, extra };
      };
      c.step('At minute 40 the shop corrects ₱1,500 to ₱150', () => {
        const { q, id, extra } = setup();
        q.advanceMinutes(40);
        const fix = c.must(q.vendor('bike-shop').correctExtra(extra, 150));
        c.ok(['voided', 'reversed'].includes(q.payment(extra).state), 'old charge undone');
        c.eq(q.payment(fix.paymentId).amount, 150, 'new posted');
        c.ok(q.payments(id).filter((x) => x.purpose === 'extra').length >= 2, 'both visible');
      });
      c.step('At minute 70 the shop is refused: only the desk can', () => {
        const { q, extra } = setup();
        q.advanceMinutes(70);
        c.refused(q.vendor('bike-shop').correctExtra(extra, 150), 'not-possible', 'desk');
      });
    },
  },
];
