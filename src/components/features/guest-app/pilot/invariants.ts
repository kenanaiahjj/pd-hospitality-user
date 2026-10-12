import { bookingMoveAllowed, EXIT_STATUSES, holdKind, paymentMoveAllowed } from './rules';
import type { Booking, Payment } from './types';
import type { World } from './world';

/*
  The nine rules that must hold after every step of every scenario.

  I1 No overbooking · I2 No double charge · I3 Nothing charged without
  acceptance · I4 Every hold is released · I5 Ledger matches the bill · I6 Only
  drawn transitions · I7 Nothing is silent · I8 One answer per request · I9
  Checkout is clean.

  Each check reads the world directly and answers with a sentence naming what
  broke, so a failing run says which rule and where.
*/

export type Violation = { id: string; message: string };

const SETTLED_ROOM = ['posted', 'settled'];
const LIVE_ROOM = ['pending', 'posting', 'failed'];
const MONEY_CARD = ['paid', 'refund-pending', 'refund-failed'];

const slotCapacity = (w: World, key: string): number => {
  const [listingId] = key.split('@');
  return w.capacityOverride.get(key) ?? w.capacityOverride.get(listingId!) ?? w.listings.get(listingId!)?.capacity ?? 0;
};

const holdQty = (b: Booking) => (b.kind === 'table' ? 1 : b.qty);

/** A payment that blocks checkout. */
export const blocksCheckout = (p: Payment): boolean =>
  p.inQuestion || (p.mode === 'room' && ['pending', 'posting', 'failed'].includes(p.state) && !p.holdUntilCheckIn) || (p.mode === 'card' && p.purpose === 'extra' && p.state === 'awaiting');

export function checkInvariants(w: World): Violation[] {
  const out: Violation[] = [];
  const add = (id: string, message: string) => out.push({ id, message });

  // I1 + I4: holds recomputed from the bookings, compared with the ones the engine keeps.
  const recomputed = new Map<string, { held: number; confirmed: number }>();
  for (const b of w.bookings.values()) {
    const kind = holdKind(b.status);
    if (!kind) continue;
    for (const key of b.slotKeys) {
      const cell = recomputed.get(key) ?? { held: 0, confirmed: 0 };
      cell[kind] += holdQty(b);
      recomputed.set(key, cell);
    }
  }
  for (const [key, cell] of recomputed) {
    const cap = slotCapacity(w, key);
    if (cell.held + cell.confirmed > cap) add('I1', `${key} holds ${cell.held + cell.confirmed} against a capacity of ${cap}`);
  }
  const keys = new Set([...recomputed.keys(), ...w.load.keys()]);
  for (const key of keys) {
    const a = recomputed.get(key) ?? { held: 0, confirmed: 0 };
    const b = w.load.get(key) ?? { held: 0, confirmed: 0 };
    if (a.held !== b.held || a.confirmed !== b.confirmed) add('I4', `${key} keeps ${b.held + b.confirmed} held but the bookings say ${a.held + a.confirmed}: a hold outlived its booking`);
  }
  for (const b of w.bookings.values()) {
    if (['needs-approval', 'pay-or-cancel', 'requested', 'awaiting-payment'].includes(b.status) && b.holdUntil !== undefined && b.holdUntil < w.now) {
      add('I4', `${b.id} (${b.status}) still holds its slot ${Math.round((w.now - b.holdUntil) / 60000)} minutes after its timer`);
    }
    if (EXIT_STATUSES.includes(b.status) && b.slotKeys.some((k) => (w.load.get(k)?.held ?? 0) < 0)) add('I4', `${b.id} released a hold twice`);
  }

  // I2: a charge reaches the folio at most once; the gateway holds at most one live payment per payment record.
  const seen = new Set<string>();
  for (const f of w.pms.folio) {
    if (f.external) continue;
    if (seen.has(f.ref)) add('I2', `${f.ref} is on the folio twice`);
    seen.add(f.ref);
  }
  const live = new Map<string, number>();
  for (const t of w.txns) if (t.state === 'paid') live.set(t.paymentId, (live.get(t.paymentId) ?? 0) + 1);
  for (const [paymentId, n] of live) if (n > 1) add('I2', `${paymentId} has ${n} live gateway payments`);

  // I3: nothing is charged for a confirm-first booking the vendor has not accepted.
  for (const b of w.bookings.values()) {
    const listing = w.listings.get(b.listingId);
    if (!listing || listing.confirm !== 'vendor') continue;
    const pays = b.paymentIds.map((id) => w.payments.get(id)!).filter(Boolean);
    // A hold is not a charge: before the vendor answers, a hold booking may carry a card payment that is waiting, held, released or expired, and nothing else.
    const beforeYes = pays.filter((p) => !(b.hold && p.mode === 'card' && ['awaiting', 'held', 'released', 'expired'].includes(p.state)));
    if (['needs-approval', 'pay-or-cancel', 'requested'].includes(b.status) && beforeYes.length > 0 && b.acceptedAt === undefined) add('I3', `${b.id} has ${beforeYes.length} payment record(s) before the vendor accepted`);
    if (['confirmed', 'in-progress', 'ready', 'completed'].includes(b.status) && b.acceptedAt === undefined) add('I3', `${b.id} is ${b.status} but the vendor never accepted it`);
    if (b.status === 'awaiting-payment' && b.acceptedAt === undefined && !b.hold) add('I3', `${b.id} is awaiting payment but the vendor never accepted it`);
    if (b.acceptedAt === undefined && pays.some((p) => ['posted', 'settled', 'paid'].includes(p.state))) add('I3', `${b.id} was charged without acceptance`);
  }

  // I5: the ledger matches the bill and the gateway.
  const byStay = new Map<string, number>();
  const folioBy = new Map<string, number>();
  for (const f of w.pms.folio) {
    if (f.external || f.reversed) continue;
    folioBy.set(f.stayId, (folioBy.get(f.stayId) ?? 0) + f.amount);
  }
  const folioRefs = new Map(w.pms.folio.filter((f) => !f.external).map((f) => [f.ref, f]));
  for (const p of w.payments.values()) {
    if (p.mode !== 'room') continue;
    const entry = folioRefs.get(p.ref);
    const onFolio = Boolean(entry && !entry.reversed);
    if (SETTLED_ROOM.includes(p.state)) {
      if (!onFolio) add('I5', `${p.id} is ${p.state} but is not on the folio`);
      byStay.set(p.stayId, (byStay.get(p.stayId) ?? 0) + p.amount);
    } else if (LIVE_ROOM.includes(p.state) || p.state === 'refund-due') {
      if (onFolio) byStay.set(p.stayId, (byStay.get(p.stayId) ?? 0) + p.amount);
      if (p.state === 'refund-due' && !onFolio) add('I5', `${p.id} is refund-due but is not on the folio`);
    } else if (p.state === 'voided' || p.state === 'reversed') {
      if (onFolio) add('I5', `${p.id} is ${p.state} but is still on the folio`);
    }
  }
  for (const stayId of new Set([...byStay.keys(), ...folioBy.keys()])) {
    const ledger = byStay.get(stayId) ?? 0;
    const bill = folioBy.get(stayId) ?? 0;
    if (ledger !== bill) add('I5', `stay ${stayId}: the ledger says ${ledger} but the folio has ${bill}`);
  }
  const heldFor = new Map<string, number>();
  let netTxn = 0;
  for (const t of w.txns) {
    if (t.state === 'paid') {
      heldFor.set(t.paymentId, (heldFor.get(t.paymentId) ?? 0) + t.amount);
      netTxn += t.amount;
    }
  }
  if (netTxn !== w.gateway.net) add('I5', `the gateway says ${w.gateway.net} but its payments add up to ${netTxn}`);
  for (const p of w.payments.values()) {
    if (p.mode !== 'card') continue;
    const unseen = w.txns.filter((t) => t.paymentId === p.id && t.state === 'paid' && !t.seen).reduce((s, t) => s + t.amount, 0);
    const expected = (MONEY_CARD.includes(p.state) ? p.amount : 0) + unseen;
    const held = heldFor.get(p.id) ?? 0;
    if (held !== expected) add('I5', `${p.id} (${p.state}) should hold ${expected} at the gateway but holds ${held}`);
  }

  // I6: every move so far is a drawn arrow.
  for (const t of w.transitions) {
    if (!t.ok) {
      add('I6', `${t.entity} ${t.id}: ${t.from ?? 'start'} to ${t.to} is not a drawn transition`);
      continue;
    }
    if (t.entity === 'booking' ? !bookingMoveAllowed(t.from as never, t.to as never) : false) add('I6', `booking ${t.id}: ${t.from ?? 'start'} to ${t.to} is not a drawn transition`);
    if (t.entity === 'payment') {
      const mode = w.payments.get(t.id)?.mode;
      if (mode && !paymentMoveAllowed(mode, t.from, t.to)) add('I6', `payment ${t.id}: ${t.from ?? 'start'} to ${t.to} is not a drawn transition`);
    }
  }

  // I7: every failure has a desk task with an owner and a due time; every stuck payment too.
  for (const f of w.failures) {
    const task = w.tasks.get(f.taskId);
    if (!task) add('I7', `${f.kind} (${f.ref}) has no desk task`);
    else if (task.owner !== 'front-desk' || !Number.isFinite(task.dueAt)) add('I7', `task ${task.id} has no owner or due time`);
  }
  for (const p of w.payments.values()) {
    if (['failed', 'refund-failed', 'refund-due'].includes(p.state)) {
      const task = [...w.tasks.values()].find((t) => t.paymentId === p.id);
      if (!task) add('I7', `${p.id} is ${p.state} with no desk task`);
    }
  }

  // I8: one winner per request: a booking's version is exactly its number of recorded moves.
  for (const b of w.bookings.values()) {
    const moves = w.transitionCount.get(b.id) ?? 0;
    if (b.version !== moves) add('I8', `${b.id} has version ${b.version} but ${moves} recorded moves`);
  }
  for (const r of w.races) if (r.firstOk === false && r.secondOk === true) add('I8', `race ${r.first} / ${r.second}: the loser won`);
  if (w.doubleFired.length) add('I8', `timer ${w.doubleFired[0]} fired twice`);

  // I9: a checked-out stay has nothing pending, failed, in question or unpaid.
  for (const p of w.payments.values()) {
    const stay = w.stays.get(p.stayId);
    if (stay?.status === 'checked-out' && blocksCheckout(p)) add('I9', `${p.id} (${p.state}${p.inQuestion ? ', in question' : ''}) is open on a checked-out stay`);
  }
  return out;
}
