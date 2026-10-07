import { SCENE as S } from '../catalog';
import { draft, type Scenario } from './kit';

const G = 'PMS and the bill' as const;
const trip = (extra = {}) => draft('apo-island-trip', S.fri, 2, { time: '07:30', payMode: 'room', ...extra });

export const PMS: Scenario[] = [
  {
    id: 'M1',
    group: G,
    title: 'PMS is down when posting',
    run(c) {
      const { p } = c;
      let id = '';
      c.step('The hotel system is down; the booking is accepted', () => {
        p.setPms({ mode: 'down' });
        id = c.ask(trip());
        c.must(p.vendor('boat-operator').confirm(id));
        c.eq(p.payments(id)[0]!.state, 'pending', 'the charge stays Pending in Cabana’s ledger');
        c.ok(p.card(id).cost.line.toLowerCase().includes('charged to your room'), 'the guest sees Charged to room');
      });
      c.step('It retries every 5 minutes; the desk is alerted at 30', () => {
        p.advanceMinutes(29);
        c.ok(!p.tasks('open').some((t) => t.kind === 'pms-alert'), 'no alert before 30 minutes');
        p.advanceMinutes(1);
        c.ok(p.tasks('open').some((t) => t.kind === 'pms-alert'), 'the desk is alerted at 30 minutes');
        const tries = p.log().filter((l) => l.kind === 'pms-retry').length;
        c.eq(tries, 6, 'six retries in 30 minutes');
        c.ok(p.card(id).cost.line.toLowerCase().includes('charged to your room'), 'still Charged to room for the guest');
      });
      c.step('After 24 hours it stops retrying and becomes a desk task', () => {
        p.advanceHours(24);
        c.eq(p.payments(id)[0]!.state, 'failed', 'Failed');
        c.ok(p.tasks('open').some((t) => t.kind === 'pms-failure' && t.paymentId === p.payments(id)[0]!.id), 'a desk task');
        c.ok(p.card(id).cost.line.toLowerCase().includes('charged to your room'), 'the guest sees nothing change');
      });
    },
  },
  {
    id: 'M2',
    group: G,
    title: 'PMS rejects the room',
    run(c) {
      const setup = () => {
        const q = c.fresh();
        q.setPms({ mode: 'down' });
        const id = (q.guest().request(trip()) as { ok: true; bookingId: string }).bookingId;
        q.vendor('boat-operator').confirm(id);
        q.desk.moveRoom(q.maria.stayId, 'Villa 14');
        return { q, id };
      };
      c.step('The old room is refused: the current room is looked up and tried once more', () => {
        const { q, id } = setup();
        q.setPms({ mode: 'reject', staleRoomRefused: true });
        q.advanceMinutes(5);
        const pay = q.payments(id)[0]!;
        c.eq(pay.state, 'posted', 'posted');
        c.eq(q.pms.folio.find((f) => f.ref === pay.ref)!.room, 'Villa 14', 'to the current room');
        c.ok(q.log().some((l) => l.kind === 'pms-room-refreshed'), 'the room was refreshed once');
      });
      c.step('Still refused: a desk task', () => {
        const { q, id } = setup();
        q.setPms({ mode: 'reject', staleRoomRefused: false });
        q.advanceMinutes(5);
        const pay = q.payments(id)[0]!;
        c.eq(pay.state, 'failed', 'Failed');
        c.ok(q.tasks('open').some((t) => t.kind === 'pms-failure' && t.paymentId === pay.id), 'a desk task');
      });
    },
  },
  {
    id: 'M3',
    group: G,
    title: 'A retry could post the charge twice',
    run(c) {
      const { p } = c;
      c.step('The PMS posts the charge but drops the reply', () => {
        p.setPms({ dropNextReply: true });
        const id = c.ask(trip());
        c.must(p.vendor('boat-operator').confirm(id));
        const pay = p.payments(id)[0]!;
        c.eq(p.pms.folio.filter((f) => f.ref === pay.ref).length, 1, 'the PMS has it');
        c.eq(p.payment(pay.id).state, 'pending', 'Cabana does not know yet');
        p.advanceMinutes(5);
        c.eq(p.payment(pay.id).state, 'posted', 'the retry found the reference on the folio');
        c.eq(p.pms.folio.filter((f) => f.ref === pay.ref).length, 1, 'posted once');
      });
    },
  },
  {
    id: 'M4',
    group: G,
    title: 'Guest moves rooms mid-stay',
    run(c) {
      const { p } = c;
      let posted = '';
      let open = '';
      c.step('One posted charge and two open bookings', () => {
        const a = c.ask(trip());
        c.must(p.vendor('boat-operator').confirm(a));
        posted = p.payments(a)[0]!.ref;
        open = c.ask(draft('bike-rental', S.sat, 1, { time: '08:00', days: 1, payMode: 'room' }));
        c.ask(draft('apo-island-trip', S.sun, 1, { time: '13:30', payMode: 'room' }));
      });
      c.step('The desk moves Maria from Villa 12 to Villa 14', () => {
        c.must(p.desk.moveRoom(p.maria.stayId, 'Villa 14'));
        c.eq(p.pms.folio.find((f) => f.ref === posted)!.room, 'Villa 14', 'the posted charge moves with the folio');
        c.eq(p.stay(p.maria.stayId).room, 'Villa 14', 'vendors see Villa 14 on open bookings');
        c.ok(c.must(p.thread(p.booking(open).threadId, 'vendor')).messages.some((m) => /Villa 14/.test(m.text)), 'the vendor is told');
      });
      c.step('New charges post to Villa 14', () => {
        c.must(p.vendor('bike-shop').confirm(open));
        c.eq(p.pms.folio.find((f) => f.ref === p.payments(open)[0]!.ref)!.room, 'Villa 14', 'posted to Villa 14');
      });
    },
  },
  {
    id: 'M5',
    group: G,
    title: 'Cancel after posting, before checkout',
    run(c) {
      const run = (refuse: boolean) => {
        const q = c.fresh();
        const id = (q.guest().request(trip()) as { ok: true; bookingId: string }).bookingId;
        q.vendor('boat-operator').confirm(id);
        q.setPms({ refuseReversal: refuse });
        q.guest().cancel(id);
        return { q, id };
      };
      c.step('The PMS accepts the reversal', () => {
        const { q, id } = run(false);
        c.eq(q.payments(id)[0]!.state, 'reversed', 'Reversed');
        c.ok(q.pms.folio.find((f) => f.ref === q.payments(id)[0]!.ref)!.reversed, 'removed from the folio');
      });
      c.step('The PMS refuses the reversal: a desk task', () => {
        const { q, id } = run(true);
        c.ok(q.tasks('open').some((t) => t.kind === 'pms-failure' && t.bookingId === id), 'a desk task');
      });
    },
  },
  {
    id: 'M6',
    group: G,
    title: 'Cancel after checkout',
    run(c) {
      const { p } = c;
      c.step('The stay is settled; she tries to cancel', () => {
        const id = c.ask(trip());
        c.must(p.vendor('boat-operator').confirm(id));
        c.must(p.desk.checkout(p.maria.stayId));
        const r = p.guest().cancel(id);
        c.refused(r, 'not-possible', 'not possible');
        c.eq(p.payments(id)[0]!.state, 'refund-due', 'marked Refund due');
        c.ok(p.tasks('open').some((t) => t.kind === 'refund-due' && t.bookingId === id), 'the desk settles it');
      });
    },
  },
  {
    id: 'M7',
    group: G,
    title: 'Checkout with open items',
    run(c) {
      const { p } = c;
      let pending = '';
      let question = '';
      c.step('One Pending charge and one In question', () => {
        const a = c.ask(trip());
        c.must(p.vendor('boat-operator').confirm(a));
        const b = c.ask(draft('bike-rental', S.sat, 2, { time: '08:00', days: 1, payMode: 'room' }));
        c.must(p.vendor('bike-shop').confirm(b));
        p.advanceTo(p.at(S.sat, '08:05'));
        c.must(p.vendor('bike-shop').scan(b));
        question = c.must(p.vendor('bike-shop').addExtra(b, 150, 'Late return fee')).paymentId;
        c.must(p.guest().question(question));
        p.setPms({ mode: 'down' });
        const d = c.ask(draft('apo-island-trip', S.sun, 1, { time: '13:30', payMode: 'room' }));
        c.must(p.vendor('boat-operator').confirm(d));
        pending = p.payments(d)[0]!.id;
      });
      c.step('Checkout lists both and cannot finish', () => {
        const out = p.desk.checkout(p.maria.stayId);
        c.ok(!out.ok, 'blocked');
        c.ok(p.tasks('open').filter((t) => t.kind === 'checkout-blocker').length >= 2, 'both are listed for the desk');
      });
      c.step('Each is posted, voided or collected; then checkout finishes', () => {
        p.setPms({ mode: 'up' });
        c.must(p.desk.postByHand(pending));
        c.must(p.desk.resolveCharge(question, 'waive'));
        c.must(p.desk.checkout(p.maria.stayId));
        c.eq(p.stay(p.maria.stayId).status, 'checked-out', 'checked out');
      });
    },
  },
];
