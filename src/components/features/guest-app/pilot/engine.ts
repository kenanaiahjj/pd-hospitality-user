import { PILOT_LISTINGS, PILOT_VENDORS, SCENE } from './catalog';
import { PILOT_SETTINGS, type Settings } from './config';
import { checkInvariants, blocksCheckout } from './invariants';
import { bookingMoveAllowed, EXIT_STATUSES, holdKind, paymentMoveAllowed } from './rules';
import type {
  Actor, Booking, BookingStatus, Card, CardAction, CardState, Draft, GuestActions, Kind, Listing, Message, Notification, PayMode, PayOptions, Payment, PayState, Pilot,
  PilotOptions, Refusal, Result, Role, Stay, Task, Thread, ThreadSummary, VendorActions, DeskActions,
} from './types';
import type { GatewayTxn, VendorRuntime, World } from './world';

/*
  The pilot engine: a deterministic simulation of bookings, payments and chat for
  The Henry Resort Dumaguete. Pure: no React, no browser, no network, no
  `Date.now()` and no `Math.random()`. Its only inputs are its own clock, one
  seed, and the actions it is given.
*/

export class InvariantViolation extends Error {
  constructor(
    public ids: string[],
    public step: number,
    public seed: number,
    message: string,
  ) {
    super(message);
  }
}

/** A small seeded random source: the same seed gives the same numbers. */
export function makeRng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const MIN = 60_000;
const HOUR = 3_600_000;
const DAY = 86_400_000;
const WD = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const at = (date: string, time = '00:00'): number => {
  const [y, m, d] = date.split('-').map(Number);
  const [h, mi] = time.split(':').map(Number);
  return Date.UTC(y!, m! - 1, d!, h ?? 0, mi ?? 0);
};
const dateOf = (ms: number) => new Date(ms).toISOString().slice(0, 10);
const addDays = (date: string, n: number) => dateOf(at(date) + n * DAY);
const peso = (n: number) => `₱${n.toLocaleString('en-US')}`;
const clock12 = (ms: number) => {
  const d = new Date(ms);
  const h = d.getUTCHours();
  return `${((h + 11) % 12) + 1}:${String(d.getUTCMinutes()).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
};
const when = (ms: number) => {
  const d = new Date(ms);
  return `${WD[d.getUTCDay()]} ${d.getUTCDate()} ${MON[d.getUTCMonth()]}, ${clock12(ms)}`;
};
const weekday = (date: string) => WD[new Date(at(date)).getUTCDay()]!;

const ok = <T extends object>(extra?: T): { ok: true } & T => ({ ok: true, ...(extra ?? ({} as T)) });
const refuse = (reason: Refusal, message: string, more: { by?: string; at?: number } = {}) => ({ ok: false as const, reason, message, ...more });

type Timer = { id: number; at: number; kind: string; key: string; fire: () => void; entity?: string; cancelled: boolean };

export function createPilot(options: PilotOptions = {}): Pilot {
  const settings: Settings = { ...PILOT_SETTINGS, ...options.settings };
  const seed = options.seed ?? 20261007;
  const paranoid = options.paranoid ?? false;

  const w: World = {
    settings,
    seed,
    now: options.start ?? SCENE.start,
    steps: 0,
    vendors: (options.catalog?.vendors ?? PILOT_VENDORS).map((v) => ({ ...v })),
    listings: new Map((options.catalog?.listings ?? PILOT_LISTINGS).map((l) => [l.id, { ...l, times: [...l.times] }])),
    guests: new Map(),
    stays: new Map(),
    bookings: new Map(),
    payments: new Map(),
    threads: new Map(),
    tasks: new Map(),
    notifications: [],
    log: [],
    vendorRuntime: new Map((options.catalog?.vendors ?? PILOT_VENDORS).map((v) => [v.id, { online: true, away: false, pendingTaps: [], cache: null, blockedSlots: new Set(), removedListings: new Set() } as VendorRuntime])),
    pms: { mode: 'up', staleRoomRefused: false, dropNextReply: false, refuseReversal: false, folio: [] },
    gateway: { mode: 'ok', loseCallbacks: false, duplicateCallbacks: 0, failRefunds: false, allowDoublePay: false, net: 0 },
    txns: [],
    load: new Map(),
    capacityOverride: new Map(),
    failures: [],
    transitions: [],
    transitionCount: new Map(),
    races: [],
    firedTimers: new Set(),
    doubleFired: [],
  };

  const counters: Record<string, number> = {};
  const nextId = (prefix: string) => `${prefix}-${(counters[prefix] = (counters[prefix] ?? 0) + 1)}`;
  let seq = 0;
  let timerSeq = 0;
  const timers: Timer[] = [];
  const graceUsed = new Set<string>();

  // ---------------------------------------------------------------- basics

  const log = (kind: string, detail: string, extra: Partial<{ entity: 'booking' | 'payment'; entityId: string; from: string | null; to: string; actor: string }> = {}) => {
    w.log.push({ at: w.now, seq: ++seq, kind, detail, ...extra });
  };
  const must = <T,>(value: T | undefined, what: string): T => {
    if (value === undefined) throw new Error(`pilot: missing ${what}`);
    return value;
  };
  const runtime = (vendorId: string) => must(w.vendorRuntime.get(vendorId), `vendor ${vendorId}`);
  const vendorOf = (listing: Listing) => must(w.vendors.find((v) => v.id === listing.vendorId), `vendor of ${listing.id}`);

  // ---------------------------------------------------------------- timers

  const sched = (when_: number, kind: string, key: string, fire: () => void, entity?: string): number => {
    const t: Timer = { id: ++timerSeq, at: when_, kind, key, fire, entity, cancelled: false };
    let lo = 0;
    let hi = timers.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      const m = timers[mid]!;
      if (m.at < t.at || (m.at === t.at && m.id < t.id)) lo = mid + 1;
      else hi = mid;
    }
    timers.splice(lo, 0, t);
    return t.id;
  };
  const cancelTimers = (entity: string, kinds?: string[]) => {
    for (const t of timers) if (t.entity === entity && !t.cancelled && (!kinds || kinds.includes(t.kind))) t.cancelled = true;
  };
  const advanceTo_ = (target: number) => {
    if (target < w.now) return;
    while (timers.length && timers[0]!.at <= target) {
      const t = timers.shift()!;
      if (t.cancelled) continue;
      w.now = Math.max(w.now, t.at);
      if (w.firedTimers.has(t.id)) w.doubleFired.push(t.id);
      w.firedTimers.add(t.id);
      log('timer', `${t.kind}:${t.key}#${t.id}`);
      t.fire();
    }
    w.now = target;
  };

  // ---------------------------------------------------------------- holds

  const holdQty = (b: Booking) => (b.kind === 'table' ? 1 : b.qty);
  const applyLoad = (b: Booking, status: BookingStatus, sign: 1 | -1) => {
    const kind = holdKind(status);
    if (!kind) return;
    for (const key of b.slotKeys) {
      const cell = w.load.get(key) ?? { held: 0, confirmed: 0 };
      cell[kind] += sign * holdQty(b);
      w.load.set(key, cell);
    }
  };
  const capacityFor = (key: string): number => {
    const [listingId] = key.split('@');
    return w.capacityOverride.get(key) ?? w.capacityOverride.get(listingId!) ?? w.listings.get(listingId!)?.capacity ?? 0;
  };
  const slotKeyFor = (listing: Listing, date: string, time?: string) => (listing.kind === 'table' || listing.kind === 'service' ? `${listing.id}@${date}T${time ?? listing.times[0] ?? '00:00'}` : `${listing.id}@${date}`);

  // ---------------------------------------------------------------- state changes

  const move = (b: Booking, to: BookingStatus, who: string, action: string) => {
    const from = b.status;
    const allowed = bookingMoveAllowed(from, to);
    w.transitions.push({ entity: 'booking', id: b.id, from, to, ok: allowed });
    if (!allowed) throw new InvariantViolation(['I6'], w.steps, seed, `booking ${b.id}: ${from} to ${to} is not a drawn transition`);
    applyLoad(b, from, -1);
    b.status = to;
    applyLoad(b, to, 1);
    b.version += 1;
    w.transitionCount.set(b.id, (w.transitionCount.get(b.id) ?? 0) + 1);
    b.lastActor = { name: who, at: w.now, action };
    log('booking-state', `${b.id} ${from} to ${to} (${action})`, { entity: 'booking', entityId: b.id, from, to, actor: who });
    refreshReadOnly(b);
    if (EXIT_STATUSES.includes(to) || ['completed', 'collected', 'seated'].includes(to)) {
      b.holdUntil = undefined;
      cancelTimers(b.id);
    }
  };
  const movePay = (p: Payment, to: PayState) => {
    const from = p.state;
    const allowed = paymentMoveAllowed(p.mode, from, to);
    w.transitions.push({ entity: 'payment', id: p.id, from, to, ok: allowed });
    if (!allowed) throw new InvariantViolation(['I6'], w.steps, seed, `payment ${p.id}: ${from} to ${to} is not a drawn transition`);
    p.state = to;
    log('payment-state', `${p.id} ${p.bookingId} ${from} to ${to}`, { entity: 'payment', entityId: p.id, from, to });
  };

  // ---------------------------------------------------------------- tasks and notifications

  const openTask = (kind: Task['kind'], detail: string, dueAt: number, ids: { bookingId?: string; paymentId?: string } = {}): Task => {
    for (const t of w.tasks.values()) if (t.status === 'open' && t.kind === kind && t.bookingId === ids.bookingId && t.paymentId === ids.paymentId) return t;
    const task: Task = { id: nextId('TASK'), kind, owner: 'front-desk', dueAt, openedAt: w.now, status: 'open', detail, ...ids };
    w.tasks.set(task.id, task);
    log('task', `${task.id} ${kind}: ${detail}`);
    return task;
  };
  /** A failure the system cannot settle itself: it always becomes a desk task. */
  const raise = (kind: Task['kind'], ref: string, detail: string, dueAt: number, ids: { bookingId?: string; paymentId?: string } = {}): Task => {
    const task = openTask(kind, detail, dueAt, ids);
    if (!w.failures.some((f) => f.taskId === task.id)) w.failures.push({ kind, ref, taskId: task.id });
    log('failure', `${kind} ${ref}: ${detail}`);
    return task;
  };
  const notify = (to: Role, channel: Notification['channel'], topic: string, bookingId?: string, delivered = true): Notification => {
    const n: Notification = { id: nextId('N'), to, channel, topic, bookingId, at: w.now, delivered, opened: false };
    w.notifications.push(n);
    return n;
  };
  const guestRecord = (guestId: string) => must(w.guests.get(guestId), `guest ${guestId}`);
  /** A critical update to the guest: push now, and an SMS if it is not opened in 10 minutes. */
  const tellGuest = (b: Booking, topic: string, immediateSms = false) => {
    const g = guestRecord(b.guestId);
    const push = notify('guest', 'push', topic, b.id, !g.notificationsOff);
    if (immediateSms) notify('guest', 'sms', topic, b.id, true);
    else sched(w.now + settings.guestSmsUnopenedMin * MIN, 'guest-sms', `${b.id}:${topic}`, () => { if (!push.opened) notify('guest', 'sms', topic, b.id, true); }, b.id);
  };

  // ---------------------------------------------------------------- threads

  const makeThread = (t: Omit<Thread, 'unread'>): Thread => {
    const thread: Thread = { ...t, unread: { guest: 0, desk: 0, vendor: 0, system: 0 } };
    w.threads.set(thread.id, thread);
    return thread;
  };
  const deskThreadId = (stayId: string) => `desk-${stayId}`;
  const privateThreadId = (vendorId: string) => `private-${vendorId}`;
  const ensureDeskThread = (stayId: string) => w.threads.get(deskThreadId(stayId)) ?? makeThread({ id: deskThreadId(stayId), kind: 'desk', stayId, participants: ['guest', 'desk'], messages: [], openedAt: w.now });
  const ensurePrivateThread = (vendorId: string) => w.threads.get(privateThreadId(vendorId)) ?? makeThread({ id: privateThreadId(vendorId), kind: 'desk-vendor', stayId: '', vendorId, participants: ['desk', 'vendor'], messages: [], openedAt: w.now });
  const post = (thread: Thread, from: Message['from'], text: string, kind: Message['kind'] = 'text', visibleTo: Role[] = thread.participants, extra: Partial<Message> = {}): Message => {
    const m: Message = { id: nextId('MSG'), at: w.now, from, text, kind, visibleTo, ...extra };
    thread.messages.push(m);
    for (const role of visibleTo) if (role !== from.role) thread.unread[role] += 1;
    return m;
  };
  const SYSTEM = { role: 'system' as const, name: 'Cabana' };
  const announce = (b: Booking, text: string, visibleTo: Role[] = ['guest', 'desk', 'vendor']) => post(must(w.threads.get(b.threadId), `thread ${b.threadId}`), SYSTEM, text, 'system', visibleTo);
  const refreshReadOnly = (b: Booking) => {
    const t = w.threads.get(b.threadId);
    if (!t) return;
    const done = EXIT_STATUSES.includes(b.status) || ['completed', 'collected', 'seated'].includes(b.status);
    t.readOnlyAt = done ? w.now + settings.threadOpenHoursAfterService * HOUR : b.end + settings.threadOpenHoursAfterService * HOUR;
  };

  // ---------------------------------------------------------------- views

  const guestName = (b: Booking) => guestRecord(b.guestId).firstName;
  const listingOf = (b: Booking) => must(w.listings.get(b.listingId), `listing ${b.listingId}`);
  const stayOf = (b: Booking) => must(w.stays.get(b.stayId), `stay ${b.stayId}`);
  const paysOf = (b: Booking) => b.paymentIds.map((id) => must(w.payments.get(id), id));
  const mainPay = (b: Booking) => paysOf(b).filter((p) => p.purpose === 'booking' && !p.duplicate).at(-1);

  const costLine = (b: Booking): { amount: number; line: string } => {
    if (b.kind === 'table') return { amount: 0, line: 'Bill settled at the restaurant' };
    const pays = paysOf(b).filter((p) => p.purpose === 'booking' && !p.duplicate);
    const pay = pays.at(-1);
    if (['needs-approval'].includes(b.status)) return { amount: b.amount, line: 'Waiting for the front desk' };
    if (b.status === 'pay-or-cancel') return { amount: b.amount, line: 'Pay in full or cancel' };
    if (b.status === 'requested') return { amount: b.amount, line: b.payMode === 'room' ? 'Charged once confirmed' : 'Paid in full once confirmed' };
    if (b.status === 'awaiting-payment') return { amount: b.amount, line: 'Paid in full, by card or e-wallet' };
    if (b.status === 'no-show') return { amount: b.amount, line: 'No-show: the charge stands' };
    if (['withdrawn', 'declined', 'lapsed', 'payment-expired'].includes(b.status)) return { amount: 0, line: 'Nothing was charged' };
    if (b.status === 'cancelled') {
      if (!pay) return { amount: 0, line: 'Nothing was charged' };
      if (pay.mode === 'room') return { amount: 0, line: pay.state === 'refund-due' ? 'Refund due: the desk settles it' : 'Room charge reversed' };
      return { amount: 0, line: pay.state === 'refunded' ? 'Refunded to the same method' : 'Refund on its way' };
    }
    if (!pay) return { amount: b.amount, line: b.payMode === 'room' ? 'Charged to your room' : 'Paid in full' };
    return { amount: b.amount, line: pay.mode === 'room' ? 'Charged to your room' : 'Paid in full' };
  };
  const cardState = (b: Booking): { state: CardState; label: string } => {
    switch (b.status) {
      case 'needs-approval': return { state: 'for-confirmation', label: 'Waiting for the front desk' };
      case 'pay-or-cancel': return { state: 'for-confirmation', label: 'Pay in full or cancel' };
      case 'requested': return { state: 'for-confirmation', label: 'For confirmation' };
      case 'awaiting-payment': return { state: 'pay-to-confirm', label: 'Pay to confirm' };
      case 'confirmed': return { state: 'confirmed', label: 'Confirmed' };
      case 'in-progress': return { state: 'confirmed', label: 'In progress' };
      case 'completed': return { state: 'confirmed', label: 'Completed' };
      case 'collected': return { state: 'confirmed', label: 'Collected' };
      case 'seated': return { state: 'confirmed', label: 'Seated' };
      case 'reserved': return { state: 'reserved', label: 'Reserved' };
      case 'ready': return { state: 'ready', label: 'Ready' };
      case 'withdrawn': return { state: 'lapsed', label: 'Withdrawn' };
      case 'declined': return { state: 'lapsed', label: 'Not available' };
      case 'lapsed': return { state: 'lapsed', label: 'Lapsed' };
      case 'payment-expired': return { state: 'lapsed', label: 'Payment expired' };
      case 'cancelled': return { state: 'cancelled', label: 'Cancelled' };
      case 'no-show': return { state: 'cancelled', label: 'No-show' };
    }
  };
  const unitWord = (b: Booking) => (b.kind === 'rental' ? (b.qty === 1 ? 'bike' : 'bikes') : b.kind === 'goods' ? (b.qty === 1 ? 'box' : 'boxes') : b.kind === 'table' ? 'party of' : b.qty === 1 ? 'guest' : 'guests');
  const cardOf = (b: Booking): Card => {
    const listing = listingOf(b);
    const vendor = vendorOf(listing);
    const { state, label } = cardState(b);
    const facts: { label: string; value: string }[] = [];
    if (b.kind === 'goods') {
      facts.push({ label: 'Collect at', value: 'Front desk, chilled' });
      facts.push({ label: 'Ready for', value: `${stayOf(b).checkOut === b.readyFor ? 'Departure day, ' : ''}${weekday(b.readyFor ?? dateOf(b.start))}` });
      facts.push({ label: 'Boxes', value: String(b.qty) });
    } else {
      facts.push({ label: 'When', value: when(b.start) });
      facts.push({ label: b.kind === 'rental' ? 'Bikes' : b.kind === 'table' ? 'Party' : 'Guests', value: String(b.qty) });
      if (b.kind === 'rental') facts.push({ label: 'Return', value: clock12(b.end) });
      if (b.kind === 'table') facts.push({ label: 'Held until', value: clock12(b.start + settings.tableHoldMin * MIN) });
      facts.push({ label: 'Vendor', value: vendor.name });
    }
    const cost = costLine(b);
    const actions: CardAction[] = [];
    let timer: Card['timer'];
    const left = (until?: number) => Math.max(0, Math.ceil(((until ?? w.now) - w.now) / MIN));
    switch (b.status) {
      case 'needs-approval':
        actions.push('withdraw');
        if (b.holdUntil) timer = { text: `The front desk has ${left(b.holdUntil)} min to answer`, endsAt: b.holdUntil, progress: Math.max(0, (b.holdUntil - w.now) / (settings.deskApprovalMin * MIN)) };
        break;
      case 'pay-or-cancel': actions.push('pay-in-full', 'cancel'); break;
      case 'requested':
        actions.push('withdraw');
        if (b.deadline) timer = { text: `Vendor has ${left(b.deadline)} min to confirm`, endsAt: b.deadline, progress: Math.max(0, Math.min(1, (b.deadline - w.now) / Math.max(1, b.deadline - b.createdAt))) };
        break;
      case 'awaiting-payment': {
        actions.push('cancel', 'pay');
        const p = mainPay(b);
        if (p?.windowEnd) timer = { text: `Pay within ${left(p.windowEnd)} min to keep the slot`, endsAt: p.windowEnd, progress: Math.max(0, (p.windowEnd - w.now) / (settings.cardWindowMin * MIN)) };
        break;
      }
      case 'confirmed':
        actions.push('cancel');
        if (b.kind === 'goods') actions.push('message-desk');
        else actions.push('show-qr');
        if (b.needsPayChange) actions.push('pay-in-full');
        break;
      case 'reserved': actions.push('cancel', 'open-menu', 'running-late'); break;
      case 'ready': actions.push('message-desk'); break;
      case 'in-progress': actions.push('question'); break;
      case 'withdrawn': case 'declined': case 'lapsed': case 'payment-expired': case 'cancelled': actions.push('pick-another'); break;
      case 'no-show': actions.push('question'); break;
      default: break;
    }
    if (b.kind === 'table' && b.status === 'seated') actions.push('open-menu');
    return { bookingId: b.id, state, label, kindLabel: `${{ rental: 'Rental', service: 'Service', goods: 'Goods', table: 'Restaurant' }[b.kind]} · ${listing.title}`, title: listing.title, facts, cost, timer, note: b.note, actions };
  };

  // ---------------------------------------------------------------- payments

  const cabanaCommitted = (stayId: string) =>
    [...w.payments.values()].filter((p) => p.stayId === stayId && p.mode === 'room' && !['voided', 'reversed'].includes(p.state)).reduce((s, p) => s + p.amount, 0);

  const payOptionsFor = (stay: Stay, date: string, amount: number, listing?: Listing): PayOptions => {
    const modes = listing?.payModes ?? ['room', 'card'];
    const inStay = modes.includes('room') && date >= stay.checkIn && date <= stay.checkOut && (stay.status === 'booked' || stay.status === 'in-house');
    const within = amount <= settings.perOrderLimit && cabanaCommitted(stay.id) + amount <= settings.perStayLimit;
    const needsApproval = inStay && !within;
    return {
      price: amount,
      defaultMode: inStay || !modes.includes('card') ? 'room' : 'card',
      room: {
        offered: inStay,
        needsApproval,
        why: !modes.includes('room') ? 'This vendor takes payment by card or e-wallet only.' : !inStay ? 'That date is outside your stay, so it cannot be charged to your room.' : needsApproval ? 'This is over the limit, so the front desk approves it first.' : undefined,
      },
      card: { offered: modes.includes('card') },
    };
  };

  const newPayment = (b: Booking, mode: PayMode, amount: number, purpose: Payment['purpose'], reason?: string, dup = false): Payment => {
    const id = nextId('PAY');
    const stay = stayOf(b);
    const p: Payment = {
      id, bookingId: b.id, stayId: b.stayId, purpose, mode, amount, state: (mode === 'room' ? 'pending' : 'awaiting') as PayState, ref: `CAB-${id}`, tries: 0, inQuestion: false, reason, createdAt: w.now,
      roomHint: stay.room, holdUntilCheckIn: mode === 'room' && stay.status === 'booked', duplicate: dup || undefined,
    };
    w.payments.set(id, p);
    b.paymentIds.push(id);
    w.transitions.push({ entity: 'payment', id, from: null, to: p.state, ok: true });
    log('payment-state', `${id} ${b.id} created ${p.state} ${mode} ${amount}`, { entity: 'payment', entityId: id, from: null, to: p.state });
    return p;
  };

  const markPosted = (p: Payment) => {
    movePay(p, 'posted');
    cancelTimers(p.id);
  };
  const failPayment = (p: Payment, why: string) => {
    movePay(p, 'failed');
    cancelTimers(p.id);
    raise('pms-failure', p.id, why, w.now + HOUR, { bookingId: p.bookingId, paymentId: p.id });
  };
  const attemptPost = (p: Payment) => {
    if (p.state !== 'pending') return;
    const stay = must(w.stays.get(p.stayId), 'stay');
    const onFolio = w.pms.folio.find((f) => f.ref === p.ref && !f.external);
    if (onFolio && !onFolio.reversed) {
      log('pms-found', `${p.id} already on the folio`);
      markPosted(p);
      return;
    }
    if (!stay.room) return;
    movePay(p, 'posting');
    if (w.pms.mode === 'down') {
      movePay(p, 'pending');
      return;
    }
    const post_ = (room: string) => {
      w.pms.folio.push({ ref: p.ref, stayId: p.stayId, room, amount: p.amount, reversed: false, postedAt: w.now });
      if (w.pms.dropNextReply) {
        w.pms.dropNextReply = false;
        log('pms-reply-lost', p.id);
        movePay(p, 'pending');
        return;
      }
      markPosted(p);
    };
    if (w.pms.mode === 'reject') {
      const stale = w.pms.staleRoomRefused && (p.roomHint ?? stay.room) !== stay.room;
      if (stale) {
        log('pms-refused', `${p.id} to ${p.roomHint}`);
        p.roomHint = stay.room;
        log('pms-room-refreshed', p.id);
        post_(stay.room);
        return;
      }
      if (p.roomHint !== stay.room) {
        p.roomHint = stay.room;
        log('pms-room-refreshed', p.id);
      }
      failPayment(p, 'The hotel system refused the charge');
      return;
    }
    post_(stay.room);
  };
  const raisePmsAlert = (p: Payment) => {
    const stuck = [...w.payments.values()].filter((x) => x.mode === 'room' && x.state === 'pending' && !x.holdUntilCheckIn).length;
    raise('pms-alert', 'pms', `The hotel system has not taken ${stuck} charge(s) for 30 minutes. They are queued and retrying.`, w.now + HOUR);
    void p;
  };
  const watchPosting = (p: Payment) => {
    const retry = () => {
      if (p.state !== 'pending') return;
      if (w.now - p.createdAt >= settings.pmsRetryForHours * HOUR) {
        failPayment(p, 'The hotel system has not answered in 24 hours');
        return;
      }
      log('pms-retry', p.id);
      attemptPost(p);
      if (p.state === 'pending') sched(w.now + settings.pmsRetryMin * MIN, 'pms-retry', p.id, retry, p.id);
    };
    sched(w.now + settings.pmsRetryMin * MIN, 'pms-retry', p.id, retry, p.id);
    sched(w.now + settings.pmsDeskAlertMin * MIN, 'pms-alert', p.id, () => { if (p.state === 'pending') raisePmsAlert(p); }, p.id);
  };
  const roomCharge = (b: Booking, amount: number, purpose: Payment['purpose'], reason?: string): Payment => {
    const p = newPayment(b, 'room', amount, purpose, reason);
    if (purpose === 'extra') p.correctUntil = w.now + settings.vendorCorrectionMin * MIN;
    if (!p.holdUntilCheckIn) {
      attemptPost(p);
      if (p.state === 'pending') watchPosting(p);
    }
    return p;
  };
  /** Undo a room charge: void it if the PMS never had it, reverse it if it did, hand it to the desk if it is settled. */
  const undoRoom = (p: Payment): void => {
    if (['voided', 'reversed', 'refund-due'].includes(p.state)) return;
    if (p.state === 'posted') {
      if (w.pms.refuseReversal || w.pms.mode === 'down') {
        raise('pms-failure', p.id, 'The reversal was refused: take the charge off the folio by hand', w.now + HOUR, { bookingId: p.bookingId, paymentId: p.id });
        return;
      }
      const entry = w.pms.folio.find((f) => f.ref === p.ref);
      if (entry) entry.reversed = true;
      movePay(p, 'reversed');
      return;
    }
    if (p.state === 'settled') {
      movePay(p, 'refund-due');
      raise('refund-due', p.id, `Refund ${peso(p.amount)} to the guest: the stay is already settled`, w.now + HOUR, { bookingId: p.bookingId, paymentId: p.id });
      return;
    }
    const entry = w.pms.folio.find((f) => f.ref === p.ref && !f.external);
    if (entry && !entry.reversed) entry.reversed = true;
    movePay(p, 'voided');
    cancelTimers(p.id);
  };

  // card and gateway
  const reconcile = (p: Payment) => {
    const txn = w.txns.find((t) => t.paymentId === p.id && t.state === 'paid' && !t.seen);
    if (txn) {
      txn.seen = true;
      log('reconciled', `${p.id} found paid at the gateway`);
      if (p.state === 'expired') {
        movePay(p, 'paid');
        refundCard(p);
        const b = w.bookings.get(p.bookingId);
        if (b) announce(b, 'Your payment arrived after the slot was released, so it is being refunded.', ['guest', 'desk']);
        return;
      }
      if (p.state === 'awaiting') applyPaid(p);
    }
    if (p.state === 'awaiting' || w.txns.some((t) => t.paymentId === p.id && t.state === 'paid' && !t.seen)) sched(w.now + settings.gatewayReconcileMin * MIN, 'reconcile', p.id, () => reconcile(p), p.id);
  };
  const refundCard = (p: Payment) => {
    if (p.state !== 'paid') return;
    movePay(p, 'refund-pending');
    if (w.gateway.failRefunds) {
      movePay(p, 'refund-failed');
      raise('failed-refund', p.id, `Refund ${peso(p.amount)} by card: the gateway refused it`, w.now + HOUR, { bookingId: p.bookingId, paymentId: p.id });
      const b = w.bookings.get(p.bookingId);
      if (b) announce(b, 'The hotel is handling your refund.', ['guest', 'desk']);
      return;
    }
    sched(w.now + MIN, 'refund-done', p.id, () => finishRefund(p), p.id);
  };
  const finishRefund = (p: Payment) => {
    const txn = w.txns.find((t) => t.paymentId === p.id && t.state === 'paid');
    if (txn) {
      txn.state = 'refunded';
      w.gateway.net -= txn.amount;
    }
    movePay(p, 'refunded');
  };
  const applyPaid = (p: Payment) => {
    const b = must(w.bookings.get(p.bookingId), 'booking');
    movePay(p, 'paid');
    if (p.purpose === 'extra') {
      announce(b, `${peso(p.amount)} paid for ${p.reason ?? 'an extra charge'}.`);
      return;
    }
    if (b.status === 'awaiting-payment') {
      b.holdUntil = undefined;
      move(b, 'confirmed', guestName(b), 'paid');
      b.needsPayChange = false;
      announce(b, `Paid ${peso(p.amount)}. Confirmed.`);
      tellGuest(b, 'confirmed');
      notify('vendor', 'push', 'paid', b.id);
    } else {
      refundCard(p);
    }
  };
  /** A payment the gateway took but whose callback was lost: apply it before anything else touches the payment. */
  const absorbUnseen = (p: Payment) => {
    const txn = w.txns.find((t) => t.paymentId === p.id && t.state === 'paid' && !t.seen);
    if (!txn) return;
    txn.seen = true;
    log('reconciled', `${p.id} found paid at the gateway`);
    if (p.state === 'awaiting') applyPaid(p);
    else if (p.state === 'expired') {
      movePay(p, 'paid');
      refundCard(p);
    }
  };
  const expireCard = (p: Payment, why: string) => {
    if (p.state !== 'awaiting') return;
    movePay(p, 'expired');
    cancelTimers(p.id, ['card-expiry']);
    const b = w.bookings.get(p.bookingId);
    if (!b || p.purpose === 'extra') return;
    if (b.status === 'awaiting-payment') {
      move(b, 'payment-expired', 'Cabana', why);
      announce(b, `${why}. The slot was released.`);
      tellGuest(b, 'payment-expired');
      notify('vendor', 'push', 'slot-free', b.id);
    } else if (b.status === 'confirmed' && b.needsPayChange) {
      cancelBooking(b, 'Cabana', 'Payment not made after the stay changed', 'system');
    }
  };
  const startCardWindow = (b: Booking, p: Payment) => {
    p.windowEnd = w.now + settings.cardWindowMin * MIN;
    b.holdUntil = p.windowEnd;
    sched(p.windowEnd, 'card-expiry', p.id, () => expireCard(p, 'The payment window closed'), p.id);
    sched(w.now + settings.gatewayReconcileMin * MIN, 'reconcile', p.id, () => reconcile(p), p.id);
  };
  const gatewayAttempt = (p: Payment): { outcome: 'paid' | 'failed' | 'abandoned'; triesLeft: number } => {
    const left = () => Math.max(0, settings.cardTries - p.tries);
    if (w.gateway.mode === 'abandon') return { outcome: 'abandoned', triesLeft: left() };
    const txn: GatewayTxn = { id: nextId('TXN'), paymentId: p.id, amount: p.amount, state: w.gateway.mode === 'ok' ? 'paid' : 'failed', seen: false };
    w.txns.push(txn);
    if (txn.state === 'failed') {
      p.tries += 1;
      if (p.purpose === 'booking' && p.tries >= settings.cardTries) expireCard(p, 'Three payment tries failed');
      return { outcome: 'failed', triesLeft: left() };
    }
    w.gateway.net += p.amount;
    if (w.gateway.loseCallbacks) return { outcome: 'abandoned', triesLeft: left() };
    for (let i = 0; i < 1 + w.gateway.duplicateCallbacks; i++) {
      if (i === 0) {
        txn.seen = true;
        if (p.state === 'awaiting') applyPaid(p);
      } else {
        log('duplicate-callback-ignored', `${p.id} ${txn.id}`);
      }
    }
    return { outcome: 'paid', triesLeft: left() };
  };
  const undoPayments = (b: Booking) => {
    for (const p of paysOf(b)) {
      if (p.mode === 'room') undoRoom(p);
      else if (p.state === 'paid') refundCard(p);
      else if (p.state === 'awaiting') {
        movePay(p, 'expired');
        cancelTimers(p.id, ['card-expiry']);
      }
    }
  };

  // ---------------------------------------------------------------- vendor timer

  const addOpenMinutes = (from: number, minutes: number, open: number, close: number): number => {
    let cur = from;
    let remaining = minutes;
    for (let i = 0; i < 14; i++) {
      const dayStart = at(dateOf(cur));
      const openAt = dayStart + open * MIN;
      const closeAt = dayStart + close * MIN;
      if (cur < openAt) cur = openAt;
      if (cur < closeAt) {
        const use = Math.min(remaining * MIN, closeAt - cur);
        cur += use;
        remaining -= use / MIN;
        if (remaining <= 0) return cur;
      }
      cur = dayStart + DAY;
    }
    return cur;
  };
  const deadlineFor = (listingId: string, requestedAt: number, startMs: number): number => {
    const listing = must(w.listings.get(listingId), listingId);
    const vendor = vendorOf(listing);
    const near = startMs - requestedAt <= settings.nearServiceHours * HOUR;
    const timerEnd = near
      ? requestedAt + settings.vendorTimerNearMin * MIN
      : Math.min(addOpenMinutes(requestedAt, settings.vendorTimerFarOpenMin, vendor.open, vendor.close), requestedAt + settings.vendorTimerMaxHours * HOUR);
    return Math.min(timerEnd, startMs - settings.lapseBeforeStartMin * MIN);
  };

  const lapse = (b: Booking) => {
    if (b.status !== 'requested') return;
    const rt = runtime(listingOf(b).vendorId);
    if (!rt.online && !graceUsed.has(b.id)) {
      graceUsed.add(b.id);
      b.holdUntil = w.now + settings.offlineGraceMin * MIN;
      sched(b.holdUntil, 'vendor-lapse', b.id, () => lapse(b), b.id);
      log('lapse-deferred', `${b.id}: the vendor has no signal, ${settings.offlineGraceMin} minutes of grace`);
      return;
    }
    move(b, 'lapsed', 'Cabana', 'vendor did not answer in time');
    announce(b, 'The vendor did not answer in time. Nothing was charged.');
    tellGuest(b, 'lapsed');
    if (b.start - b.createdAt <= settings.nearServiceHours * HOUR || b.origin === 'desk') {
      raise('vendor-nudge', b.id, `Lapsed: ${vendorOf(listingOf(b)).name} did not answer. The service is within 24 hours.`, w.now + HOUR, { bookingId: b.id });
    }
  };
  const startVendorTimer = (b: Booking) => {
    b.deadline = deadlineFor(b.listingId, w.now, b.start);
    b.holdUntil = b.deadline;
    b.vendorOpened = false;
    graceUsed.delete(b.id);
    const listing = listingOf(b);
    notify('vendor', 'push', 'request', b.id);
    const t0 = w.now;
    const mid = t0 + (b.deadline - t0) / 2;
    if (t0 + settings.vendorSmsUnopenedMin * MIN < b.deadline) sched(t0 + settings.vendorSmsUnopenedMin * MIN, 'vendor-sms', b.id, () => { if (b.status === 'requested' && !b.vendorOpened) notify('vendor', 'sms', 'request-unopened', b.id); }, b.id);
    sched(mid, 'vendor-reminder', b.id, () => {
      if (b.status !== 'requested') return;
      notify('vendor', 'push', 'reminder', b.id);
      if (b.origin === 'desk') raise('vendor-nudge', b.id, `${vendorOf(listing).name} has not answered the desk's request`, b.deadline!, { bookingId: b.id });
    }, b.id);
    sched(b.deadline, 'vendor-lapse', b.id, () => lapse(b), b.id);
  };

  // ---------------------------------------------------------------- creating a booking

  type Plan = { listing: Listing; stay: Stay; start: number; end: number; days: number; amount: number; slotKeys: string[]; options: PayOptions };
  const plan = (guestId: string, draft: Draft): Result<{ plan: Plan }> => {
    const guest = w.guests.get(guestId);
    if (!guest) return refuse('not-found', 'That guest is not on a stay.');
    const stay = must(w.stays.get(guest.stayId), 'stay');
    const listing = w.listings.get(draft.listingId);
    if (!listing) return refuse('not-found', 'That is not on offer.');
    const rt = runtime(listing.vendorId);
    const vendor = vendorOf(listing);
    if (rt.removedListings.has(listing.id)) return refuse('unavailable', `${listing.title} is no longer offered.`);
    if (rt.away) return refuse('unavailable', `${vendor.name} is not taking requests right now.`);
    if (stay.status === 'checked-out' || stay.status === 'cancelled') return refuse('not-possible', 'Your stay is over, so this cannot be booked.');
    if (!Number.isInteger(draft.qty) || draft.qty < 1) return refuse('not-possible', 'Choose at least one.');
    if (listing.kind === 'table') {
      if (!draft.time || !listing.times.includes(draft.time)) return refuse('not-possible', `${listing.title} does not take reservations at that time.`);
      if (draft.qty > (listing.maxParty ?? 10)) return refuse('over-maximum', `${listing.title} takes up to ${listing.maxParty ?? 10} guests. Message the restaurant for a larger party.`);
    }
    if (listing.kind === 'goods' && draft.qty > (listing.orderCap ?? Infinity)) return refuse('over-cap', `The most for one order is ${listing.orderCap}. Ask the vendor in chat for more.`);
    if ((listing.kind === 'service' || listing.kind === 'rental') && (!draft.time || !listing.times.includes(draft.time))) return refuse('not-possible', 'That start time is not offered.');
    const days = listing.kind === 'rental' ? Math.max(1, draft.days ?? 1) : 1;
    const time = listing.kind === 'goods' ? listing.readyAt ?? '17:00' : draft.time ?? '00:00';
    let start = at(draft.date, time);
    // A goods order for today is ready a little after it is placed, not at a fixed evening hour.
    if (listing.kind === 'goods' && listing.leadMin !== undefined && draft.date === dateOf(w.now)) start = w.now + listing.leadMin * MIN;
    const end = listing.kind === 'rental'
      ? (listing.returnBy ? at(addDays(draft.date, days - 1), listing.returnBy) : at(addDays(draft.date, days - 1), time) + listing.durationMin * MIN)
      : start + listing.durationMin * MIN;
    if (start <= w.now) return refuse('not-possible', 'That time has already passed.');
    const slotKeys = listing.kind === 'rental' ? Array.from({ length: days }, (_, i) => slotKeyFor(listing, addDays(draft.date, i))) : [slotKeyFor(listing, draft.date, draft.time)];
    if (slotKeys.some((k) => rt.blockedSlots.has(k))) return refuse('unavailable', 'That slot is not taking bookings.');
    const amount = Math.max(0, (listing.priceBasis === 'booking' ? listing.unitPrice : listing.unitPrice * draft.qty * days) - (draft.discount ?? 0));
    return ok({ plan: { listing, stay, start, end, days, amount, slotKeys, options: payOptionsFor(stay, draft.date, amount, listing) } });
  };

  const holdOpen = (slotKeys: string[], qty: number): boolean =>
    slotKeys.every((k) => {
      const cell = w.load.get(k) ?? { held: 0, confirmed: 0 };
      return cell.held + cell.confirmed + qty <= capacityFor(k);
    });

  const createBooking = (guestId: string, draft: Draft, how: { origin: Booking['origin']; staffName?: string; preId?: string }): Result<{ bookingId: string; duplicate?: boolean }> => {
    const pl = plan(guestId, draft);
    if (!pl.ok) return pl;
    const { listing, stay, start, end, days, amount, slotKeys, options: opts } = pl.plan;
    const quantity = listing.kind === 'table' ? 1 : draft.qty;
    const dup = [...w.bookings.values()].find((x) => x.guestId === guestId && x.listingId === listing.id && x.slotKeys.join() === slotKeys.join() && x.qty === draft.qty && !EXIT_STATUSES.includes(x.status) && (['needs-approval', 'pay-or-cancel', 'requested', 'awaiting-payment'].includes(x.status) || w.now - x.createdAt < MIN));
    if (dup) return ok({ bookingId: dup.id, duplicate: true });
    if (!holdOpen(slotKeys, quantity)) return refuse('unavailable', 'Just booked. Pick another time.');
    let payMode: PayMode | null = null;
    const free = listing.kind !== 'table' && amount === 0;
    if (listing.kind !== 'table' && !free) {
      payMode = draft.payMode ?? opts.defaultMode;
      if (payMode === 'room' && !opts.room.offered) return refuse('not-offered', opts.room.why ?? 'Charge to room is not offered.');
      if (payMode === 'card' && !opts.card.offered) return refuse('not-offered', 'This vendor does not take card payment.');
    }
    let deadline: number | undefined;
    if (listing.confirm === 'vendor') {
      deadline = deadlineFor(listing.id, w.now, start);
      if (deadline <= w.now) return refuse('unavailable', 'That is too close to the start for the vendor to answer. Message the front desk.');
    }
    log('pay-gate', `${how.preId ?? 'new'} ${listing.id}: mode ${payMode ?? 'none'}, room offered ${opts.room.offered}, needs approval ${opts.room.needsApproval}`);
    const id = how.preId ?? nextId('BK');
    const guest = guestRecord(guestId);
    const needsApproval = payMode === 'room' && opts.room.needsApproval;
    const initial: BookingStatus = listing.kind === 'table' ? 'reserved' : needsApproval ? 'needs-approval' : listing.confirm === 'vendor' ? 'requested' : free || payMode === 'room' ? 'confirmed' : 'awaiting-payment';
    const b: Booking = {
      id, listingId: listing.id, stayId: stay.id, guestId, kind: listing.kind, status: initial, qty: draft.qty, days, start, end, amount, payMode, paymentIds: [], threadId: `thread-${id}`, createdAt: w.now,
      note: draft.note, origin: how.origin, staffName: how.staffName, vendorOpened: false, slotKeys, version: 1, readyFor: listing.kind === 'goods' ? draft.date : undefined,
    };
    w.bookings.set(id, b);
    applyLoad(b, initial, 1);
    w.transitions.push({ entity: 'booking', id, from: null, to: initial, ok: true });
    w.transitionCount.set(id, 1);
    log('booking-state', `${id} created ${initial}`, { entity: 'booking', entityId: id, from: null, to: initial, actor: guest.firstName });
    b.lastActor = { name: guest.firstName, at: w.now, action: 'asked' };
    const thread = makeThread({ id: b.threadId, kind: 'booking', stayId: stay.id, bookingId: id, vendorId: listing.vendorId, participants: ['guest', 'desk', 'vendor'], messages: [], openedAt: w.now });
    refreshReadOnly(b);
    const asker = how.origin === 'desk' ? `The front desk (${how.staffName ?? 'staff'})` : guest.firstName;
    post(thread, SYSTEM, `${asker} ${listing.confirm === 'vendor' ? 'asked for' : 'booked'} ${draft.qty} ${unitWord(b)} ${listing.title}, ${when(start)}.`, 'system');
    post(thread, SYSTEM, '', 'card', undefined, { bookingId: id });
    if (how.origin !== 'app') post(ensureDeskThread(stay.id), SYSTEM, '', 'card', ['guest', 'desk'], { bookingId: id });
    if (draft.note) post(thread, { role: 'guest', name: guest.firstName }, draft.note);
    if (initial === 'needs-approval') {
      b.holdUntil = w.now + settings.deskApprovalMin * MIN;
      raise('over-limit-approval', id, `${guest.firstName} wants ${peso(amount)} charged to the room, over the ${peso(settings.perOrderLimit)} limit. Approve, or ask them to pay in full.`, b.holdUntil, { bookingId: id });
      announce(b, 'Waiting for the front desk to approve charging this to your room.', ['guest', 'desk']);
      sched(b.holdUntil, 'approval-timeout', id, () => approvalTimeout(b), id);
    } else if (initial === 'requested') {
      startVendorTimer(b);
    } else if (initial === 'confirmed') {
      if (!free) roomCharge(b, amount, 'booking');
      notify('vendor', 'push', 'new-booking', id);
      announce(b, free ? 'Confirmed. Nothing to pay.' : `Confirmed. ${peso(amount)} is charged to the room.`);
    } else if (initial === 'awaiting-payment') {
      const p = newPayment(b, 'card', amount, 'booking');
      startCardWindow(b, p);
      notify('vendor', 'push', 'new-booking', id);
      announce(b, `Pay ${peso(amount)} within ${settings.cardWindowMin} minutes to confirm.`, ['guest', 'desk']);
    } else {
      notify('vendor', 'push', 'new-booking', id);
      announce(b, 'Reserved. Nothing is charged: the bill is settled at the restaurant.');
      sched(b.start + settings.tableHoldMin * MIN, 'table-hold', id, () => { if (b.status === 'reserved') { move(b, 'no-show', 'Cabana', 'table not taken'); announce(b, `The table was held ${settings.tableHoldMin} minutes and released.`); notify('vendor', 'push', 'no-show', id); } }, id);
    }
    return ok({ bookingId: id });
  };

  const approvalTimeout = (b: Booking) => {
    if (b.status !== 'needs-approval') return;
    move(b, 'pay-or-cancel', 'Cabana', 'the desk did not answer in time');
    b.holdUntil = w.now + settings.payOrCancelMin * MIN;
    announce(b, 'The front desk has not answered. Pay in full instead, or cancel.', ['guest', 'desk']);
    tellGuest(b, 'pay-or-cancel');
    sched(b.holdUntil, 'pay-or-cancel-timeout', b.id, () => {
      if (b.status !== 'pay-or-cancel') return;
      move(b, 'lapsed', 'Cabana', 'no choice made');
      announce(b, 'No choice was made, so the request lapsed.', ['guest', 'desk']);
    }, b.id);
  };

  // ---------------------------------------------------------------- vendor accepts, declines

  const refusedStale = (b: Booking, action: string): Result<object> => {
    const last = b.lastActor;
    if (last && last.at === w.now) return refuse('already-actioned', `${last.name} already ${last.action} this.`, { by: last.name, at: last.at });
    if (b.status === 'lapsed') {
      const mins = Math.max(0, Math.round((w.now - (b.deadline ?? w.now)) / MIN));
      raise('lapsed-reinstate', b.id, `${vendorOf(listingOf(b)).name} tried to ${action} a lapsed request. Reinstate it if the slot is free.`, w.now + HOUR, { bookingId: b.id });
      return refuse('lapsed', `This request lapsed ${mins} minutes ago. Ask the desk.`);
    }
    return refuse('invalid-state', `This booking is ${b.status}, so it cannot be ${action}ed.`);
  };

  const acceptBooking = (b: Booking, who: string): Result<object> => {
    if (b.status !== 'requested') return refusedStale(b, 'confirm');
    cancelTimers(b.id);
    b.acceptedAt = w.now;
    if (b.amount === 0 && b.kind !== 'table') {
      move(b, 'confirmed', who, 'accepted');
      announce(b, `${who} confirmed. Nothing to pay.`);
    } else if (b.payMode === 'room') {
      move(b, 'confirmed', who, 'accepted');
      roomCharge(b, b.amount, 'booking');
      announce(b, `${who} confirmed. ${peso(b.amount)} is charged to your room.`);
    } else {
      move(b, 'awaiting-payment', who, 'accepted');
      const p = newPayment(b, 'card', b.amount, 'booking');
      startCardWindow(b, p);
      announce(b, `${who} confirmed. Pay ${peso(b.amount)} within ${settings.cardWindowMin} minutes to keep the slot.`, ['guest', 'desk']);
    }
    tellGuest(b, 'accepted');
    return ok();
  };
  const declineBooking = (b: Booking, who: string, reason?: string): Result<object> => {
    if (b.status !== 'requested') return refusedStale(b, 'decline');
    move(b, 'declined', who, 'declined');
    b.reason = reason;
    announce(b, `${who} is not available${reason ? `: ${reason}` : ''}. Nothing was charged.`);
    tellGuest(b, 'declined');
    return ok();
  };

  // ---------------------------------------------------------------- cancelling

  const cancelBooking = (b: Booking, who: string, reason: string, by: 'guest' | 'vendor' | 'desk' | 'system', batch = false): void => {
    undoPayments(b);
    b.reason = reason;
    move(b, 'cancelled', who, 'cancelled');
    b.needsPayChange = false;
    announce(b, `Cancelled${reason ? `: ${reason}` : ''}. ${costLine(b).line}.`);
    if (by === 'vendor') {
      tellGuest(b, 'vendor-cancelled', true);
      notify('desk', 'push', 'vendor-cancelled', b.id);
    } else {
      notify('vendor', 'push', 'cancelled', b.id);
    }
    void batch;
  };

  const withdrawBooking = (b: Booking, who: string, action: string) => {
    for (const p of paysOf(b)) if (p.mode === 'card' && p.state === 'awaiting') { movePay(p, 'expired'); cancelTimers(p.id, ['card-expiry']); }
    move(b, 'withdrawn', who, action);
    announce(b, `${who} withdrew the request. Nothing was charged.`);
    notify('vendor', 'push', 'withdrawn', b.id);
  };

  const guestCancel = (b: Booking, who: string): Result<{ outcome: 'withdrawn' | 'cancelled' | 'requested' }> => {
    const listing = listingOf(b);
    if (['needs-approval', 'pay-or-cancel', 'requested', 'awaiting-payment'].includes(b.status)) {
      withdrawBooking(b, who, 'withdrew');
      return ok({ outcome: 'withdrawn' as const });
    }
    if (!['confirmed', 'reserved', 'ready'].includes(b.status)) return b.lastActor?.at === w.now ? refuse('already-actioned', `${b.lastActor.name} already ${b.lastActor.action} this.`, { by: b.lastActor.name, at: b.lastActor.at }) : refuse('invalid-state', `This booking is ${b.status}, so it cannot be cancelled.`);
    const stay = stayOf(b);
    if (stay.status === 'checked-out') {
      for (const p of paysOf(b)) if (p.mode === 'room' && p.state === 'settled') undoRoom(p);
      return refuse('not-possible', 'Not possible in the app after checkout. The front desk settles the refund with you.');
    }
    const free = b.kind === 'table' || b.start - w.now >= listing.freeCancelHours * HOUR;
    if (free) {
      cancelBooking(b, who, '', 'guest');
      return ok({ outcome: 'cancelled' as const });
    }
    b.cancelRequested = true;
    announce(b, `${who} asked to cancel. It is inside the free-cancel window, so ${vendorOf(listing).name} has to accept.`);
    notify('vendor', 'push', 'cancel-requested', b.id);
    return ok({ outcome: 'requested' as const });
  };

  // ---------------------------------------------------------------- the engine's public face

  /** One public action: counted, followed by task housekeeping and, in paranoid mode, all nine checks. */
  const act = <T,>(fn: () => T): T => {
    w.steps += 1;
    const result = fn();
    reconcileTasks();
    if (paranoid) assertInvariants();
    return result;
  };
  const assertInvariants = () => {
    const found = checkInvariants(w);
    if (found.length) throw new InvariantViolation([...new Set(found.map((f) => f.id))], w.steps, seed, found.map((f) => `${f.id}: ${f.message}`).join('; '));
  };
  const closeTask = (t: Task, how: string, by = 'system') => {
    t.status = 'done';
    t.doneBy = by;
    t.doneHow = how;
  };
  const reconcileTasks = () => {
    for (const t of w.tasks.values()) {
      if (t.status !== 'open') continue;
      const b = t.bookingId ? w.bookings.get(t.bookingId) : undefined;
      const p = t.paymentId ? w.payments.get(t.paymentId) : undefined;
      switch (t.kind) {
        case 'over-limit-approval': if (b && b.status !== 'needs-approval') closeTask(t, 'answered'); break;
        case 'vendor-nudge': if (b && b.status !== 'requested' && !t.detail.startsWith('Lapsed')) closeTask(t, 'answered'); break;
        case 'pms-failure':
          if (p && (t.detail.startsWith('The reversal') ? ['reversed', 'voided', 'refund-due'].includes(p.state) : ['posted', 'voided', 'reversed', 'settled'].includes(p.state))) closeTask(t, 'resolved');
          break;
        case 'pms-alert': if (![...w.payments.values()].some((x) => x.mode === 'room' && x.state === 'pending' && !x.holdUntilCheckIn)) closeTask(t, 'the hotel system took the queued charges'); break;
        case 'failed-refund': if (p?.state === 'refunded') closeTask(t, 'refunded'); break;
        case 'questioned-charge': if (p && !p.inQuestion) closeTask(t, 'answered'); break;
        case 'checkout-blocker': if (p && !blocksCheckout(p)) closeTask(t, 'cleared'); break;
        case 'lapsed-reinstate': if (b && b.status !== 'lapsed') closeTask(t, 'reinstated'); break;
        case 'refund-due': if (p && ['reversed', 'refunded'].includes(p.state)) closeTask(t, 'settled'); break;
        case 'stay-conflict': if (b && (!b.needsPayChange || EXIT_STATUSES.includes(b.status))) closeTask(t, 'resolved'); break;
        case 'uncollected-goods': if (b && ['collected', 'cancelled'].includes(b.status)) closeTask(t, 'collected'); break;
        case 'vendor-cancel-declined': if (b && EXIT_STATUSES.includes(b.status)) closeTask(t, 'booking ended'); break;
        default: break;
      }
    }
  };

  const heardFrom = (viewer: Role): Role[] => (viewer === 'system' ? [] : [viewer]);
  void heardFrom;

  // ------------------------------------------------------- guest actions

  const guestActions = (guestId: string): GuestActions => {
    const mine = (bookingId: string): Booking | undefined => {
      const b = w.bookings.get(bookingId);
      return b && b.guestId === guestId ? b : undefined;
    };
    const who = () => guestRecord(guestId).firstName;
    return {
      quote(draft) {
        const pl = plan(guestId, draft);
        if (!pl.ok) return pl;
        return ok({ options: pl.plan.options });
      },
      request(draft) {
        return act(() => createBooking(guestId, draft, { origin: draft.origin ?? 'app' }));
      },
      choosePayInFull(bookingId) {
        return act(() => {
          const b = mine(bookingId);
          if (!b) return refuse('not-found', 'That booking is not yours.');
          if (b.status === 'confirmed' && b.needsPayChange) {
            for (const p of paysOf(b)) if (p.mode === 'room') undoRoom(p);
            b.payMode = 'card';
            const p = newPayment(b, 'card', b.amount, 'booking');
            startCardWindow(b, p);
            announce(b, `Pay ${peso(b.amount)} within ${settings.cardWindowMin} minutes to keep this booking.`, ['guest', 'desk']);
            return ok();
          }
          if (b.status !== 'pay-or-cancel') return refuse('invalid-state', 'There is nothing to choose.');
          cancelTimers(b.id);
          b.payMode = 'card';
          if (listingOf(b).confirm === 'vendor') {
            move(b, 'requested', who(), 'chose to pay in full');
            startVendorTimer(b);
            announce(b, `${who()} will pay in full. Waiting for the vendor.`);
          } else {
            move(b, 'awaiting-payment', who(), 'chose to pay in full');
            startCardWindow(b, newPayment(b, 'card', b.amount, 'booking'));
            announce(b, `Pay ${peso(b.amount)} within ${settings.cardWindowMin} minutes to confirm.`, ['guest', 'desk']);
          }
          return ok();
        });
      },
      payCard(bookingId) {
        return act(() => {
          const b = mine(bookingId);
          if (!b) return refuse('not-found', 'That booking is not yours.');
          const pay = paysOf(b).filter((p) => p.mode === 'card' && p.purpose === 'booking' && !p.duplicate).at(-1);
          if (!pay) return refuse('invalid-state', 'There is nothing to pay.');
          absorbUnseen(pay);
          if (pay.state === 'paid') {
            if (!w.gateway.allowDoublePay || w.gateway.mode !== 'ok') return refuse('invalid-state', 'This is already paid.');
            const dupe = newPayment(b, 'card', pay.amount, 'booking', 'Paid twice', true);
            movePay(dupe, 'paid');
            w.txns.push({ id: nextId('TXN'), paymentId: dupe.id, amount: dupe.amount, state: 'paid', seen: true });
            w.gateway.net += dupe.amount;
            log('double-payment', `${dupe.id} duplicates ${pay.id}`);
            refundCard(dupe);
            announce(b, 'You paid twice. The second payment is being refunded.', ['guest', 'desk']);
            return ok({ outcome: 'paid' as const, triesLeft: Math.max(0, settings.cardTries - pay.tries) });
          }
          if (pay.state !== 'awaiting' || (pay.windowEnd && w.now >= pay.windowEnd)) return refuse('invalid-state', 'The payment window closed.');
          return ok(gatewayAttempt(pay));
        });
      },
      cancel(bookingId) {
        return act(() => {
          const b = mine(bookingId);
          if (!b) return refuse('not-found', 'That booking is not yours.');
          return guestCancel(b, who());
        });
      },
      question(paymentId, text) {
        return act(() => {
          const p = w.payments.get(paymentId);
          const b = p ? w.bookings.get(p.bookingId) : undefined;
          if (!p || !b || b.guestId !== guestId) return refuse('not-found', 'That charge is not yours.');
          if (['voided', 'reversed', 'refunded', 'expired'].includes(p.state)) return refuse('invalid-state', 'That charge is already undone.');
          if (stayOf(b).status === 'checked-out') {
            post(ensureDeskThread(b.stayId), { role: 'guest', name: who() }, text ?? `I have a question about the ${peso(p.amount)} charge.`);
            return refuse('not-possible', 'Your stay is settled, so the app cannot reopen this charge. Your message went to the front desk.');
          }
          p.inQuestion = true;
          const stay = stayOf(b);
          raise('questioned-charge', p.id, `${who()} questions ${peso(p.amount)}${p.reason ? ` (${p.reason})` : ''}${text ? `: "${text}"` : ''}`, at(stay.checkOut, '12:00'), { bookingId: b.id, paymentId: p.id });
          announce(b, `${who()} questioned the ${peso(p.amount)} charge. The front desk will settle it before checkout.`);
          return ok();
        });
      },
      payExtra(paymentId) {
        return act(() => {
          const p = w.payments.get(paymentId);
          const b = p ? w.bookings.get(p.bookingId) : undefined;
          if (!p || !b || b.guestId !== guestId) return refuse('not-found', 'That charge is not yours.');
          absorbUnseen(p);
          if (p.mode !== 'card' || p.state !== 'awaiting') return refuse('invalid-state', 'There is nothing to pay.');
          return ok(gatewayAttempt(p));
        });
      },
      send(threadId, text) {
        return act(() => {
          const t = w.threads.get(threadId);
          if (!t || !t.participants.includes('guest')) return refuse('not-a-participant', 'That thread is not yours.');
          const stay = must(w.stays.get(guestRecord(guestId).stayId), 'stay');
          if (t.stayId !== stay.id) return refuse('not-a-participant', 'That thread is not yours.');
          const closed = t.readOnlyAt !== undefined && w.now >= t.readOnlyAt;
          const target = closed ? ensureDeskThread(stay.id) : t;
          post(target, { role: 'guest', name: who() }, text);
          return ok(closed ? { redirectedTo: target.id } : {});
        });
      },
      sendToDesk(text) {
        return act(() => {
          const stay = must(w.stays.get(guestRecord(guestId).stayId), 'stay');
          post(ensureDeskThread(stay.id), { role: 'guest', name: who() }, text);
          return ok();
        });
      },
      runningLate(bookingId) {
        return act(() => {
          const b = mine(bookingId);
          if (!b) return refuse('not-found', 'That booking is not yours.');
          if (!['reserved', 'confirmed'].includes(b.status)) return refuse('invalid-state', 'There is nothing to be late for.');
          announce(b, `${who()} is running late. ${b.kind === 'table' ? `The table is held until ${clock12(b.start + settings.tableHoldMin * MIN)}.` : ''}`.trim());
          notify('vendor', 'push', 'running-late', b.id);
          return ok();
        });
      },
    };
  };

  // ------------------------------------------------------- vendor actions

  const vendorActions = (vendorId: string): VendorActions => {
    const rt = runtime(vendorId);
    const vendor = must(w.vendors.find((v) => v.id === vendorId), vendorId);
    const owns = (bookingId: string): Booking | undefined => {
      const b = w.bookings.get(bookingId);
      return b && listingOf(b).vendorId === vendorId ? b : undefined;
    };
    const offline = () => refuse('not-possible', 'No signal. Try again when you are back online.');
    const nameOf = (actor?: Actor) => actor?.name ?? vendor.name;
    const syncTaps = () => {
      const taps = rt.pendingTaps.splice(0);
      for (const tap of taps) {
        const b = w.bookings.get(tap.bookingId);
        if (!b) continue;
        if (tap.action === 'scan') {
          if (b.status === 'confirmed') move(b, 'in-progress', vendor.name, 'scanned (synced)');
          continue;
        }
        const limit = (b.deadline ?? 0) + settings.offlineGraceMin * MIN;
        if (b.status === 'requested' && tap.at <= limit) {
          if (tap.action === 'confirm') acceptBooking(b, tap.actor ?? vendor.name);
          else declineBooking(b, tap.actor ?? vendor.name, tap.reason);
        } else {
          log('tap-too-late', `${b.id}: made at ${clock12(tap.at)}, the request was ${b.status}`);
          announce(b, `${vendor.name}'s ${tap.action} was made offline too late: the request is ${b.status}.`, ['desk', 'vendor']);
        }
      }
    };
    return {
      open(bookingId) {
        return act(() => {
          const b = owns(bookingId);
          if (!b) return refuse('not-found', 'That booking is not yours.');
          b.vendorOpened = true;
          for (const n of w.notifications) if (n.to === 'vendor' && n.bookingId === b.id) n.opened = true;
          return ok();
        });
      },
      confirm(bookingId, actor) {
        return act(() => {
          const b = owns(bookingId);
          if (!b) return refuse('not-found', 'That booking is not yours.');
          if (!rt.online) {
            if (b.status !== 'requested') return refusedStale(b, 'confirm');
            rt.pendingTaps.push({ bookingId, action: 'confirm', at: w.now, actor: actor?.name });
            log('queued-offline', `${b.id} confirm`);
            return ok({ queued: true });
          }
          b.vendorOpened = true;
          return acceptBooking(b, nameOf(actor));
        });
      },
      decline(bookingId, reason, actor) {
        return act(() => {
          const b = owns(bookingId);
          if (!b) return refuse('not-found', 'That booking is not yours.');
          if (!rt.online) {
            rt.pendingTaps.push({ bookingId, action: 'decline', at: w.now, actor: actor?.name, reason });
            return ok({ queued: true });
          }
          return declineBooking(b, nameOf(actor), reason);
        });
      },
      scan(bookingId) {
        return act(() => {
          const b = owns(bookingId);
          if (!b) return refuse('not-found', 'That booking is not yours.');
          if (b.kind === 'goods') return refuse('not-possible', 'Goods are collected at the front desk, not scanned.');
          if (b.status !== 'confirmed') return b.status === 'in-progress' ? refuse('already-actioned', 'Already scanned.') : refuse('invalid-state', `This booking is ${b.status}, so it cannot start.`);
          if (!rt.online) {
            if (!rt.cache?.has(b.id)) return refuse('no-cache', 'No signal and no saved bookings on this phone. Look the guest up by name and room, or call the desk.');
            rt.pendingTaps.push({ bookingId, action: 'scan', at: w.now });
            log('queued-offline', `${b.id} scan`);
            return ok({ queued: true });
          }
          move(b, 'in-progress', vendor.name, 'scanned');
          announce(b, `${vendor.name} scanned the QR. In progress.`);
          return ok();
        });
      },
      lookup(name, room) {
        return act(() => {
          const found = [...w.bookings.values()].reverse().find((b) => listingOf(b).vendorId === vendorId && guestName(b).toLowerCase() === name.toLowerCase() && stayOf(b).room === room && !EXIT_STATUSES.includes(b.status));
          return found ? ok({ bookingId: found.id }) : refuse('not-found', 'No booking for that name and room.');
        });
      },
      complete(bookingId) {
        return act(() => {
          const b = owns(bookingId);
          if (!b) return refuse('not-found', 'That booking is not yours.');
          if (!rt.online) return offline();
          if (b.status !== 'in-progress') return refuse('invalid-state', 'It has not started.');
          move(b, 'completed', vendor.name, 'completed');
          announce(b, 'Completed.');
          return ok();
        });
      },
      seat(bookingId) {
        return act(() => {
          const b = owns(bookingId);
          if (!b || b.kind !== 'table') return refuse('not-found', 'That is not a reservation.');
          if (b.status !== 'reserved') return refuse('invalid-state', `This reservation is ${b.status}.`);
          move(b, 'seated', vendor.name, 'seated');
          announce(b, 'Seated. Enjoy your meal.');
          return ok();
        });
      },
      sendToDesk(bookingId) {
        return act(() => {
          const b = owns(bookingId);
          if (!b || b.kind !== 'goods') return refuse('not-found', 'That is not an order.');
          if (b.status !== 'confirmed') return refuse('invalid-state', `This order is ${b.status}.`);
          b.packed = true;
          announce(b, `${vendor.name} packed the order and sent it to the front desk.`);
          return ok();
        });
      },
      markShort(bookingId, shortBy) {
        return act(() => {
          const b = owns(bookingId);
          if (!b || b.kind !== 'goods') return refuse('not-found', 'That is not an order.');
          if (!['confirmed', 'ready'].includes(b.status) || shortBy < 1 || shortBy >= b.qty) return refuse('not-possible', 'Mark between 1 and the whole order less one.');
          const unit = listingOf(b).unitPrice;
          const was = mainPay(b);
          applyLoad(b, b.status, -1);
          b.qty -= shortBy;
          b.shortBy = (b.shortBy ?? 0) + shortBy;
          applyLoad(b, b.status, 1);
          b.amount = unit * b.qty;
          if (was) {
            if (was.mode === 'room') {
              undoRoom(was);
              if (was.state === 'reversed' || was.state === 'voided') roomCharge(b, b.amount, 'booking', 'Adjusted: item short');
            } else if (was.state === 'paid') {
              refundCard(was);
              const next = newPayment(b, 'card', b.amount, 'booking', 'Adjusted: item short');
              startCardWindow(b, next);
            }
          }
          announce(b, `${shortBy} ${shortBy === 1 ? 'box was' : 'boxes were'} short. The charge is now ${peso(b.amount)}.`);
          return ok();
        });
      },
      addExtra(bookingId, amount, reason) {
        return act(() => {
          const b = owns(bookingId);
          if (!b) return refuse('not-found', 'That booking is not yours.');
          if (!rt.online) return offline();
          if (b.kind === 'goods' || b.kind === 'table') return refuse('not-possible', 'Extra charges are for rentals and services.');
          if (!['confirmed', 'in-progress', 'completed'].includes(b.status)) return refuse('invalid-state', 'There is nothing to add to.');
          if (stayOf(b).status === 'checked-out') return refuse('not-possible', 'The stay is settled.');
          if (!reason.trim() || amount <= 0) return refuse('not-possible', 'An extra charge needs a reason and an amount.');
          const stay = stayOf(b);
          const inStay = dateOf(b.end) <= stay.checkOut && (stay.status === 'in-house' || stay.status === 'booked');
          const room = b.payMode === 'room' && inStay && amount <= settings.perOrderLimit && cabanaCommitted(b.stayId) + amount <= settings.perStayLimit;
          let p: Payment;
          if (room) p = roomCharge(b, amount, 'extra', reason);
          else {
            p = newPayment(b, 'card', amount, 'extra', reason);
            p.correctUntil = w.now + settings.vendorCorrectionMin * MIN;
          }
          post(must(w.threads.get(b.threadId), 'thread'), SYSTEM, `Extra charge ${peso(amount)}: ${reason}. ${room ? 'Charged to your room.' : 'Pay in full to settle it.'}`, 'card', ['guest', 'desk', 'vendor'], { bookingId: b.id, paymentId: p.id });
          post(must(w.threads.get(b.threadId), 'thread'), SYSTEM, `Extra charge ${peso(amount)}: ${reason}.`, 'system');
          return ok({ paymentId: p.id });
        });
      },
      correctExtra(paymentId, amount) {
        return act(() => {
          const p = w.payments.get(paymentId);
          const b = p ? owns(p.bookingId) : undefined;
          if (!p || !b || p.purpose !== 'extra') return refuse('not-found', 'That is not one of your extra charges.');
          if (p.correctUntil === undefined || w.now > p.correctUntil) return refuse('not-possible', 'The correction window closed. Only the front desk can change it now.');
          if (['voided', 'reversed', 'expired'].includes(p.state)) return refuse('invalid-state', 'That charge is already undone.');
          if (p.mode === 'room') undoRoom(p);
          else if (p.state === 'awaiting') { movePay(p, 'expired'); }
          const next = p.mode === 'room' ? roomCharge(b, amount, 'extra', `${p.reason} (corrected)`) : newPayment(b, 'card', amount, 'extra', `${p.reason} (corrected)`);
          announce(b, `The extra charge was corrected from ${peso(p.amount)} to ${peso(amount)}.`);
          return ok({ paymentId: next.id });
        });
      },
      markNoShow(bookingId) {
        return act(() => {
          const b = owns(bookingId);
          if (!b) return refuse('not-found', 'That booking is not yours.');
          if (!['confirmed', 'reserved'].includes(b.status)) return refuse('invalid-state', `This booking is ${b.status}.`);
          const after = b.kind === 'table' ? settings.tableHoldMin : settings.noShowAfterStartMin;
          if (w.now < b.start + after * MIN) return refuse('too-early', `A no-show can be marked ${after} minutes after the start.`);
          move(b, 'no-show', vendor.name, 'no-show');
          announce(b, 'Marked a no-show. The charge stands.', ['guest', 'desk', 'vendor']);
          notify('desk', 'push', 'no-show', b.id);
          return ok();
        });
      },
      cancel(bookingId, reason) {
        return act(() => {
          const b = owns(bookingId);
          if (!b) return refuse('not-found', 'That booking is not yours.');
          if (!rt.online) return offline();
          if (!reason.trim()) return refuse('not-possible', 'A cancellation needs a reason.');
          if (w.now >= b.start && b.status !== 'ready') return refuse('not-possible', 'The service has started, so it can no longer be cancelled.');
          if (b.status === 'requested') {
            const out = declineBooking(b, vendor.name, reason);
            if (out.ok) { tellGuest(b, 'vendor-cancelled', true); notify('desk', 'push', 'vendor-cancelled', b.id); }
            return out;
          }
          if (!['awaiting-payment', 'confirmed', 'reserved', 'ready'].includes(b.status)) return refusedStale(b, 'cancel');
          cancelBooking(b, vendor.name, reason, 'vendor');
          return ok();
        });
      },
      cancelSlot(listingId, slotKey, reason) {
        return act(() => {
          if (!reason.trim()) return refuse('not-possible', 'A cancellation needs a reason.');
          const hit = [...w.bookings.values()].filter((b) => b.listingId === listingId && b.slotKeys.includes(slotKey) && ['requested', 'awaiting-payment', 'confirmed', 'reserved', 'ready'].includes(b.status));
          const batchId = nextId('BATCH');
          for (const b of hit) {
            if (b.status === 'requested') {
              declineBooking(b, vendor.name, reason);
              tellGuest(b, 'vendor-cancelled', true);
              b.reason = reason;
            } else cancelBooking(b, vendor.name, reason, 'vendor', true);
          }
          if (hit.length) raise('batch-cancel', batchId, `${vendor.name} cancelled ${hit.length} booking(s) on one slot: ${reason}`, w.now + 2 * HOUR);
          return ok({ count: hit.length, batchId });
        });
      },
      answerCancel(bookingId, accept) {
        return act(() => {
          const b = owns(bookingId);
          if (!b || !b.cancelRequested) return refuse('invalid-state', 'There is no cancellation to answer.');
          b.cancelRequested = false;
          if (accept) {
            cancelBooking(b, vendor.name, 'Cancelled with the vendor’s agreement', 'vendor');
            return ok();
          }
          raise('vendor-cancel-declined', b.id, `${vendor.name} declined the guest's cancellation. The booking stands, with no part fee.`, w.now + HOUR, { bookingId: b.id });
          announce(b, `${vendor.name} could not cancel this. The booking stands. The front desk can step in.`);
          tellGuest(b, 'cancel-declined');
          return ok();
        });
      },
      blockSlot(listingId, slotKey) {
        return act(() => {
          const n = [...w.bookings.values()].filter((b) => b.listingId === listingId && b.slotKeys.includes(slotKey) && holdKind(b.status)).length;
          if (n) return refuse('blocked', `${n} booking${n === 1 ? '' : 's'} are on this slot. Cancel ${n === 1 ? 'it' : 'them'} first.`);
          rt.blockedSlots.add(slotKey);
          return ok();
        });
      },
      removeListing(listingId) {
        return act(() => {
          const n = [...w.bookings.values()].filter((b) => b.listingId === listingId && holdKind(b.status)).length;
          if (n) return refuse('blocked', `${n} booking${n === 1 ? ' is' : 's are'} still open on this listing. Cancel ${n === 1 ? 'it' : 'them'} first.`);
          rt.removedListings.add(listingId);
          return ok();
        });
      },
      setAway(on) { act(() => { rt.away = on; }); },
      setOnline(on) {
        act(() => {
          const was = rt.online;
          rt.online = on;
          if (on && !was) syncTaps();
        });
      },
      cacheBookings() {
        act(() => {
          if (!rt.online) return;
          const today = dateOf(w.now);
          const tomorrow = addDays(today, 1);
          rt.cache = new Set([...w.bookings.values()].filter((b) => listingOf(b).vendorId === vendorId && [today, tomorrow].includes(dateOf(b.start))).map((b) => b.id));
        });
      },
      message(threadId, text) {
        return act(() => {
          const t = w.threads.get(threadId);
          if (!t || !t.participants.includes('vendor') || t.vendorId !== vendorId) return refuse('not-a-participant', 'That thread is not yours.');
          if (t.readOnlyAt !== undefined && w.now >= t.readOnlyAt) return refuse('thread-closed', 'That thread is closed.');
          post(t, { role: 'vendor', name: vendor.name }, text);
          const b = t.bookingId ? w.bookings.get(t.bookingId) : undefined;
          if (b && b.status === 'requested' && /^\s*(ok|okay|yes|sure|confirmed?)\W*$/i.test(text)) {
            post(t, SYSTEM, 'A message does not confirm the booking. Tap Confirm on the card to accept it.', 'system', ['vendor']);
          }
          return ok();
        });
      },
      replyPrivate(text, bookingId) {
        return act(() => {
          post(ensurePrivateThread(vendorId), { role: 'vendor', name: vendor.name }, text, 'text', ['desk', 'vendor'], bookingId ? { bookingId } : {});
          return ok();
        });
      },
    };
  };

  // ------------------------------------------------------- desk actions

  const deskName = 'Front desk';
  const deskActions: DeskActions = {
    approve(bookingId) {
      return act(() => {
        const b = w.bookings.get(bookingId);
        if (!b) return refuse('not-found', 'No such booking.');
        if (b.status !== 'needs-approval') return refusedStale(b, 'approve');
        cancelTimers(b.id);
        b.holdUntil = undefined;
        if (listingOf(b).confirm === 'vendor') {
          move(b, 'requested', deskName, 'approved');
          startVendorTimer(b);
          announce(b, 'The front desk approved charging this to your room. Waiting for the vendor.');
        } else {
          move(b, 'confirmed', deskName, 'approved');
          roomCharge(b, b.amount, 'booking');
          notify('vendor', 'push', 'new-booking', b.id);
          announce(b, `The front desk approved it. Confirmed, ${peso(b.amount)} charged to your room.`);
        }
        tellGuest(b, 'approved');
        return ok();
      });
    },
    declineApproval(bookingId) {
      return act(() => {
        const b = w.bookings.get(bookingId);
        if (!b) return refuse('not-found', 'No such booking.');
        if (b.status !== 'needs-approval') return refusedStale(b, 'decline');
        cancelTimers(b.id);
        approvalTimeoutNow(b);
        return ok();
      });
    },
    message(text) {
      act(() => {
        const stay = must(w.stays.get(w.guests.get(maria.guestId)!.stayId), 'stay');
        post(ensureDeskThread(stay.id), { role: 'desk', name: deskName }, text);
      });
    },
    messageBooking(threadId, text) {
      return act(() => {
        const t = w.threads.get(threadId);
        if (!t || t.kind !== 'booking') return refuse('not-found', 'No such thread.');
        if (t.readOnlyAt !== undefined && w.now >= t.readOnlyAt) return refuse('thread-closed', 'That thread is closed.');
        post(t, { role: 'desk', name: deskName }, text);
        return ok();
      });
    },
    privateNote(vendorId, text, bookingId) {
      return act(() => {
        if (!w.vendorRuntime.has(vendorId)) return refuse('not-found', 'No such vendor.');
        post(ensurePrivateThread(vendorId), { role: 'desk', name: deskName }, text, 'text', ['desk', 'vendor'], bookingId ? { bookingId } : {});
        return ok();
      });
    },
    bookFor(guestId, draft, how) {
      return act(() => {
        const id = nextId('BK');
        log('desk-booked', `${id}: ${how.staffName} booked for ${guestId}, who asked ${how.asked}`);
        const r = createBooking(guestId, draft, { origin: 'desk', staffName: how.staffName, preId: id });
        if (!r.ok) return r;
        return ok({ bookingId: r.bookingId });
      });
    },
    cancelFor(bookingId, staffName) {
      return act(() => {
        const b = w.bookings.get(bookingId);
        if (!b) return refuse('not-found', 'No such booking.');
        return guestCancel(b, staffName);
      });
    },
    markReady(bookingId) {
      return act(() => {
        const b = w.bookings.get(bookingId);
        if (!b || b.kind !== 'goods') return refuse('not-found', 'That is not an order.');
        if (b.status !== 'confirmed') return refuse('invalid-state', `This order is ${b.status}.`);
        move(b, 'ready', deskName, 'marked ready');
        announce(b, 'Your order is at the front desk, held chilled and ready for your departure day.');
        tellGuest(b, 'ready');
        return ok();
      });
    },
    handOver(bookingId) {
      return act(() => {
        const b = w.bookings.get(bookingId);
        if (!b || b.kind !== 'goods') return refuse('not-found', 'That is not an order.');
        if (b.status !== 'ready') return refuse('invalid-state', 'The order is not ready yet.');
        move(b, 'collected', deskName, 'handed over');
        announce(b, 'Handed over. Thank you.');
        return ok();
      });
    },
    checkIn(stayId) {
      return act(() => {
        const stay = w.stays.get(stayId);
        if (!stay) return refuse('not-found', 'No such stay.');
        if (stay.status !== 'booked') return refuse('invalid-state', 'The guest has already checked in.');
        stay.status = 'in-house';
        if (!stay.room) stay.room = 'Villa 12';
        log('check-in', `${stayId} into ${stay.room}`);
        for (const p of [...w.payments.values()].filter((x) => x.stayId === stayId && x.holdUntilCheckIn && x.state === 'pending')) {
          p.holdUntilCheckIn = false;
          p.roomHint = stay.room;
          attemptPost(p);
          if (p.state === 'pending') watchPosting(p);
        }
        return ok();
      });
    },
    moveRoom(stayId, room) {
      return act(() => {
        const stay = w.stays.get(stayId);
        if (!stay) return refuse('not-found', 'No such stay.');
        stay.room = room;
        for (const f of w.pms.folio) if (f.stayId === stayId) f.room = room;
        for (const b of w.bookings.values()) if (b.stayId === stayId && holdKind(b.status)) announce(b, `The guest moved to ${room}.`, ['desk', 'vendor']);
        log('room-move', `${stayId} to ${room}`);
        return ok();
      });
    },
    shortenStay(stayId, newCheckOut) {
      return act(() => {
        const stay = w.stays.get(stayId);
        if (!stay) return refuse('not-found', 'No such stay.');
        stay.checkOut = newCheckOut;
        for (const b of w.bookings.values()) {
          if (b.stayId !== stayId || !['confirmed', 'requested', 'awaiting-payment'].includes(b.status) || dateOf(b.start) <= newCheckOut) continue;
          if (b.payMode === 'room' && ['confirmed'].includes(b.status)) {
            b.needsPayChange = true;
            const due = b.start - settings.stayConflictDeskHours * HOUR;
            raise('stay-conflict', b.id, `The stay now ends ${newCheckOut}, before this booking. The guest was asked to pay in full or cancel.`, due, { bookingId: b.id });
            announce(b, 'Your stay changed, so this can no longer be charged to your room. Pay in full or cancel.', ['guest', 'desk']);
            tellGuest(b, 'stay-changed');
            const task = [...w.tasks.values()].find((t) => t.kind === 'stay-conflict' && t.bookingId === b.id)!;
            sched(Math.max(due, w.now), 'stay-conflict', b.id, () => { if (b.needsPayChange && !EXIT_STATUSES.includes(b.status)) task.detail = `Unresolved 24 hours before the service: the desk handles it. ${task.detail}`; }, b.id);
          }
        }
        return ok();
      });
    },
    syncStay(stayId, patch) {
      return act(() => {
        const stay = w.stays.get(stayId);
        if (!stay) return refuse('not-found', 'No such stay.');
        if (patch.room !== undefined) stay.room = patch.room;
        if (patch.checkIn !== undefined) stay.checkIn = patch.checkIn;
        if (patch.checkOut !== undefined) stay.checkOut = patch.checkOut;
        if (patch.status !== undefined) stay.status = patch.status;
        return ok();
      });
    },
    cancelStay(stayId) {
      return act(() => {
        const stay = w.stays.get(stayId);
        if (!stay) return refuse('not-found', 'No such stay.');
        stay.status = 'cancelled';
        for (const b of [...w.bookings.values()].filter((x) => x.stayId === stayId && !EXIT_STATUSES.includes(x.status) && !['completed', 'collected', 'seated'].includes(x.status))) {
          if (['needs-approval', 'pay-or-cancel', 'requested', 'awaiting-payment'].includes(b.status)) withdrawBooking(b, deskName, 'stay cancelled');
          else if (['confirmed', 'reserved', 'ready'].includes(b.status)) cancelBooking(b, deskName, 'The stay was cancelled', 'desk');
        }
        return ok();
      });
    },
    checkout(stayId) {
      return act(() => {
        const stay = w.stays.get(stayId);
        if (!stay) return refuse('not-found', 'No such stay.');
        if (stay.status === 'checked-out') return refuse('invalid-state', 'Already checked out.');
        const blockers = [...w.payments.values()].filter((p) => p.stayId === stayId && blocksCheckout(p));
        if (blockers.length) {
          for (const p of blockers) raise('checkout-blocker', p.id, `${peso(p.amount)} ${p.reason ?? 'charge'} is ${p.inQuestion ? 'in question' : p.state === 'awaiting' ? 'unpaid' : p.state}. Post, void or collect it first.`, w.now + HOUR, { bookingId: p.bookingId, paymentId: p.id });
          return refuse('blocked', `Cannot check out: ${blockers.map((p) => `${peso(p.amount)} ${p.reason ?? 'charge'} is ${p.inQuestion ? 'in question' : p.state === 'awaiting' ? 'unpaid' : p.state}`).join('; ')}.`);
        }
        const checklist: string[] = [];
        for (const b of w.bookings.values()) {
          if (b.stayId === stayId && b.status === 'ready') {
            checklist.push(`${listingOf(b).title}: ${b.qty} ${unitWord(b)} to hand over`);
            openTask('uncollected-goods', `Hand over ${b.qty} boxes to the guest at checkout`, w.now + HOUR, { bookingId: b.id });
          }
        }
        for (const p of w.payments.values()) if (p.stayId === stayId && p.state === 'posted') movePay(p, 'settled');
        stay.status = 'checked-out';
        stay.checkedOutAt = w.now;
        log('check-out', `${stayId}`);
        return ok({ blockers: [] as string[], checklist });
      });
    },
    resolveCharge(paymentId, how, newAmount) {
      return act(() => {
        const p = w.payments.get(paymentId);
        const b = p ? w.bookings.get(p.bookingId) : undefined;
        if (!p || !b) return refuse('not-found', 'No such charge.');
        const undo = () => {
          if (p.mode === 'room') undoRoom(p);
          else if (p.state === 'paid') refundCard(p);
          else if (p.state === 'awaiting') { movePay(p, 'expired'); cancelTimers(p.id); }
        };
        if (how === 'uphold') {
          p.inQuestion = false;
          announce(b, `The front desk upheld the ${peso(p.amount)} charge.`);
          return ok();
        }
        p.inQuestion = false;
        if (how === 'waive') {
          undo();
          announce(b, `The front desk waived the ${peso(p.amount)} charge.`);
          return ok();
        }
        if (newAmount === undefined || newAmount <= 0) return refuse('not-possible', 'Say what the charge should be.');
        undo();
        const next = p.mode === 'room' ? roomCharge(b, newAmount, p.purpose, `${p.reason ?? 'Charge'} (adjusted)`) : newPayment(b, 'card', newAmount, p.purpose, `${p.reason ?? 'Charge'} (adjusted)`);
        announce(b, `The front desk adjusted the charge from ${peso(p.amount)} to ${peso(newAmount)}.`);
        void next;
        return ok();
      });
    },
    reinstate(bookingId) {
      return act(() => {
        const b = w.bookings.get(bookingId);
        if (!b) return refuse('not-found', 'No such booking.');
        if (b.status !== 'lapsed') return refuse('invalid-state', 'It is not lapsed.');
        if (!holdOpen(b.slotKeys, b.kind === 'table' ? 1 : b.qty)) return refuse('unavailable', 'The slot has been taken.');
        const fresh = deadlineFor(b.listingId, w.now, b.start);
        if (fresh <= w.now) return refuse('unavailable', 'It is too close to the start to ask the vendor again.');
        move(b, 'requested', deskName, 'reinstated');
        startVendorTimer(b);
        announce(b, 'The front desk reinstated this request and sent it back to the vendor.');
        return ok();
      });
    },
    postByHand(paymentId) {
      return act(() => {
        const p = w.payments.get(paymentId);
        if (!p || p.mode !== 'room') return refuse('not-found', 'No such room charge.');
        if (!['pending', 'failed'].includes(p.state)) return refuse('invalid-state', `This charge is ${p.state}.`);
        const stay = must(w.stays.get(p.stayId), 'stay');
        if (!w.pms.folio.some((f) => f.ref === p.ref)) w.pms.folio.push({ ref: p.ref, stayId: p.stayId, room: stay.room || 'Villa 12', amount: p.amount, reversed: false, postedAt: w.now });
        markPosted(p);
        return ok();
      });
    },
    voidCharge(paymentId) {
      return act(() => {
        const p = w.payments.get(paymentId);
        if (!p) return refuse('not-found', 'No such charge.');
        if (p.mode === 'room') undoRoom(p);
        else if (p.state === 'awaiting') movePay(p, 'expired');
        else if (p.state === 'paid') refundCard(p);
        return ok();
      });
    },
    collectInFull(paymentId) {
      return act(() => {
        const p = w.payments.get(paymentId);
        if (p) absorbUnseen(p);
        if (!p || p.mode !== 'card' || p.state !== 'awaiting') return refuse('invalid-state', 'There is nothing to collect.');
        w.txns.push({ id: nextId('TXN'), paymentId: p.id, amount: p.amount, state: 'paid', seen: true });
        w.gateway.net += p.amount;
        applyPaid(p);
        return ok();
      });
    },
    settleRefund(paymentId) {
      return act(() => {
        const p = w.payments.get(paymentId);
        if (!p) return refuse('not-found', 'No such charge.');
        if (p.state === 'refund-failed') {
          finishRefund(p);
          return ok();
        }
        if (p.state === 'refund-due') {
          const entry = w.pms.folio.find((f) => f.ref === p.ref);
          if (entry) entry.reversed = true;
          movePay(p, 'reversed');
          return ok();
        }
        return refuse('invalid-state', 'Nothing to settle.');
      });
    },
    resolveTask(taskId, how) {
      return act(() => {
        const t = w.tasks.get(taskId);
        if (!t) return refuse('not-found', 'No such task.');
        if (t.status === 'done') return ok();
        const b = t.bookingId ? w.bookings.get(t.bookingId) : undefined;
        const p = t.paymentId ? w.payments.get(t.paymentId) : undefined;
        switch (t.kind) {
          case 'over-limit-approval': if (b?.status === 'needs-approval') { if (how === 'decline') deskActions.declineApproval(b.id); else deskActions.approve(b.id); } break;
          case 'lapsed-reinstate': if (b?.status === 'lapsed') deskActions.reinstate(b.id); break;
          case 'pms-failure': if (p && ['pending', 'failed'].includes(p.state)) deskActions.postByHand(p.id); break;
          case 'failed-refund': case 'refund-due': if (p) deskActions.settleRefund(p.id); break;
          case 'questioned-charge': if (p) deskActions.resolveCharge(p.id, how === 'waive' ? 'waive' : 'uphold'); break;
          case 'checkout-blocker': if (p?.inQuestion) deskActions.resolveCharge(p.id, 'uphold'); else if (p?.state === 'awaiting') deskActions.collectInFull(p.id); else if (p && ['pending', 'failed'].includes(p.state)) deskActions.postByHand(p.id); break;
          default: break;
        }
        closeTask(t, how ?? 'handled', deskName);
        return ok();
      });
    },
  };
  // declining an approval ends the desk's turn at once rather than after the timer
  const approvalTimeoutNow = (b: Booking) => approvalTimeout(b);

  // ------------------------------------------------------- fixture

  const makeGuest = (firstName: string, room: string, checkIn: string, checkOut: string, status: Stay['status']) => {
    const guestId = nextId('guest');
    const stayId = nextId('stay');
    w.guests.set(guestId, { id: guestId, firstName, notificationsOff: false, stayId });
    w.stays.set(stayId, { id: stayId, guestId, room, checkIn, checkOut, status });
    ensureDeskThread(stayId);
    return { guestId, stayId };
  };
  const ms = options.mariaStay;
  const mariaIn = ms?.checkIn ?? '2026-10-05';
  const maria = makeGuest(options.guestName ?? 'Maria', ms?.room ?? 'Villa 12', mariaIn, ms?.checkOut ?? SCENE.tue, ms?.status ?? (mariaIn <= dateOf(w.now) ? 'in-house' : 'booked'));

  // ------------------------------------------------------- the Pilot

  const toSummary = (t: Thread, viewer: Role): ThreadSummary => {
    const visible = t.messages.filter((m) => m.visibleTo.includes(viewer));
    const b = t.bookingId ? w.bookings.get(t.bookingId) : undefined;
    const card = b ? cardState(b) : undefined;
    const titleFor = () => {
      if (t.kind === 'desk') return 'Front desk';
      if (t.kind === 'desk-vendor') return must(w.vendors.find((v) => v.id === t.vendorId), 'vendor').name;
      return b ? listingOf(b).title : 'Booking';
    };
    return { id: t.id, kind: t.kind, title: titleFor(), last: visible.at(-1), unread: t.unread[viewer], cardState: card?.state, cardLabel: card?.label, readOnly: t.readOnlyAt !== undefined && w.now >= t.readOnlyAt, bookingId: t.bookingId };
  };

  const pilot: Pilot = {
    settings,
    seed,
    now: () => w.now,
    advanceMinutes: (n) => act(() => advanceTo_(w.now + n * MIN)),
    advanceHours: (n) => act(() => advanceTo_(w.now + n * HOUR)),
    advanceDays: (n) => act(() => advanceTo_(w.now + n * DAY)),
    advanceTo: (ts) => act(() => advanceTo_(ts)),
    maria,
    addGuest: (input) => act(() => makeGuest(input.firstName, input.room ?? '', input.checkIn, input.checkOut, input.status ?? (input.checkIn <= dateOf(w.now) ? 'in-house' : 'booked'))),
    setCapacity: (listingId, capacity, slotKey) => act(() => { w.capacityOverride.set(slotKey ?? listingId, capacity); }),
    setGuestNotifications: (guestId, on) => act(() => { guestRecord(guestId).notificationsOff = !on; }),
    openNotification: (id) => act(() => { const n = w.notifications.find((x) => x.id === id); if (n) n.opened = true; }),
    pms: w.pms,
    setPms: (patch) => act(() => { Object.assign(w.pms, patch); }),
    gateway: w.gateway,
    setGateway: (patch) => act(() => { Object.assign(w.gateway, patch); }),
    guest: (guestId = maria.guestId) => guestActions(guestId),
    vendor: (vendorId) => vendorActions(vendorId),
    desk: deskActions,
    together(first, second) {
      const a = first();
      const b = second();
      w.races.push({ first: 'first', second: 'second', firstOk: a.ok, secondOk: b.ok });
      log('race', `first ${a.ok ? 'won' : 'refused'}, second ${b.ok ? 'worked' : `refused (${b.ok ? '' : b.reason})`}`);
      return [a, b];
    },
    listing: (id) => must(w.listings.get(id), id),
    listings: () => [...w.listings.values()],
    vendors: () => w.vendors,
    stay: (id) => must(w.stays.get(id), id),
    booking: (id) => must(w.bookings.get(id), id),
    bookings: () => [...w.bookings.values()],
    payment: (id) => must(w.payments.get(id), id),
    payments: (bookingId) => [...w.payments.values()].filter((p) => !bookingId || p.bookingId === bookingId),
    card: (bookingId) => cardOf(must(w.bookings.get(bookingId), bookingId)),
    extraCard(paymentId) {
      const p = must(w.payments.get(paymentId), paymentId);
      const b = must(w.bookings.get(p.bookingId), p.bookingId);
      const actions: CardAction[] = p.inQuestion || ['voided', 'reversed', 'expired', 'refunded'].includes(p.state) ? [] : ['question'];
      if (p.mode === 'card' && p.state === 'awaiting') actions.unshift('pay');
      return { bookingId: b.id, state: 'extra-charge', label: p.state === 'voided' || p.state === 'reversed' ? 'Removed' : 'Added', kindLabel: 'Extra charge', title: p.reason ?? 'Extra charge', facts: [{ label: 'Reason', value: p.reason ?? '' }], cost: { amount: p.amount, line: p.mode === 'room' ? 'Charged to your room' : p.state === 'awaiting' ? 'Pay in full' : 'Paid in full' }, actions };
    },
    threads(viewer, viewerId) {
      const all = [...w.threads.values()].filter((t) => t.participants.includes(viewer));
      const rows = all.filter((t) => {
        if (viewer === 'guest') return t.stayId === (viewerId ? w.guests.get(viewerId)?.stayId : maria.stayId);
        if (viewer === 'vendor') return t.vendorId === viewerId;
        return true;
      });
      const order = (t: Thread) => (t.kind === 'desk' ? 0 : 1);
      return rows.sort((a, b) => order(a) - order(b) || (b.messages.at(-1)?.at ?? 0) - (a.messages.at(-1)?.at ?? 0)).map((t) => toSummary(t, viewer));
    },
    thread(threadId, viewer) {
      const t = w.threads.get(threadId);
      if (!t) return refuse('not-found', 'No such thread.');
      if (!t.participants.includes(viewer)) return refuse('not-a-participant', 'That thread is not yours.');
      t.unread[viewer] = 0;
      return ok({ messages: t.messages.filter((m) => m.visibleTo.includes(viewer)), readOnly: t.readOnlyAt !== undefined && w.now >= t.readOnlyAt });
    },
    deskThreadId,
    privateThreadId,
    tasks: (status) => [...w.tasks.values()].filter((t) => !status || t.status === status),
    outbox: () => w.notifications,
    log: () => w.log,
    slot(listingId, date, time) {
      const key = slotKeyFor(must(w.listings.get(listingId), listingId), date, time);
      const cell = w.load.get(key) ?? { held: 0, confirmed: 0 };
      return { key, capacity: capacityFor(key), held: cell.held, confirmed: cell.confirmed };
    },
    slotKeyFor: (listingId, date, time) => slotKeyFor(must(w.listings.get(listingId), listingId), date, time),
    at,
    deadlineFor,
    vendorState: (vendorId) => { const rt = runtime(vendorId); return { online: rt.online, away: rt.away, pendingTaps: rt.pendingTaps.length }; },
    foliosTotal: (stayId) => w.pms.folio.filter((f) => f.stayId === stayId && !f.reversed).reduce((s, f) => s + f.amount, 0),
    externalCharge: (stayId, amount, label) => act(() => {
      const stay = must(w.stays.get(stayId), stayId);
      w.pms.folio.push({ ref: nextId('EXT'), stayId, room: stay.room, amount, reversed: false, postedAt: w.now, external: true, label });
    }),
    invariants: () => checkInvariants(w).map((v) => `${v.id}: ${v.message}`),
    steps: () => w.steps,
  };
  return pilot;
}

export type { Kind };
