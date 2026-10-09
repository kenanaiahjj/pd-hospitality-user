import type { Settings } from './config';

/*
  The pilot simulation's domain types, and the `Pilot` interface that the
  scenarios, the guest screens and the prototype controls all drive.

  Pure, like `prototype-model.ts`: no React, no browser APIs, no network. Times
  are hotel-local milliseconds (the property's time zone), never `Date.now()`.
*/

export type Kind = 'rental' | 'service' | 'goods' | 'table';
export type Role = 'guest' | 'desk' | 'vendor' | 'system';
export type PayMode = 'room' | 'card';
/** `vendor`: the vendor confirms availability before any charge. `instant`: charged as the guest confirms. */
export type ConfirmMode = 'vendor' | 'instant';

/** Diagram H, one record per booking. */
export type BookingStatus =
  | 'needs-approval'
  | 'pay-or-cancel'
  | 'requested'
  | 'awaiting-payment'
  | 'confirmed'
  | 'reserved'
  | 'in-progress'
  | 'ready'
  | 'completed'
  | 'collected'
  | 'seated'
  | 'withdrawn'
  | 'declined'
  | 'lapsed'
  | 'payment-expired'
  | 'cancelled'
  | 'no-show';

/** Diagram I, one record per payment. */
export type RoomPayState = 'pending' | 'posting' | 'posted' | 'settled' | 'voided' | 'reversed' | 'failed' | 'refund-due';
export type CardPayState = 'awaiting' | 'paid' | 'expired' | 'refund-pending' | 'refunded' | 'refund-failed';
export type PayState = RoomPayState | CardPayState;

/** The eight states a booking card can show. */
export type CardState = 'for-confirmation' | 'pay-to-confirm' | 'confirmed' | 'reserved' | 'ready' | 'lapsed' | 'cancelled' | 'extra-charge';

export type Vendor = {
  id: string;
  name: string;
  /** A placeholder, not a real business. */
  simulated: boolean;
  /** Minutes after midnight, hotel time. */
  open: number;
  close: number;
  /** How a guest reaches them before there is a chat: shown on the listing and the booking. Demo numbers. */
  phone?: string;
};

export type Listing = {
  id: string;
  vendorId: string;
  kind: Kind;
  title: string;
  /** What one is called, for rentals: a bike, a scooter, a car. Defaults to a bike. */
  unit?: { one: string; many: string };
  confirm: ConfirmMode;
  /** Pesos per unit: per bike per day, per guest, per box. Zero for a table. */
  unitPrice: number;
  /** Per slot: bikes a day, seats on a trip, boxes in stock, tables at a time. */
  capacity: number;
  /** Published start times, "HH:MM". */
  times: string[];
  maxParty?: number;
  /** Most units in one order. */
  orderCap?: number;
  /** Hours before the start up to which a guest may cancel at once. Tables: always. */
  freeCancelHours: number;
  durationMin: number;
  menuPdf?: string;
  /** `unit` (default): price x quantity x days. `booking`: one price for the booking, whatever the party. */
  priceBasis?: 'unit' | 'booking';
  /** Which ways the vendor takes payment. Default both. A hotel-run service is room only. */
  payModes?: PayMode[];
  /** Rentals: the time the same-day return is due, "HH:MM". Replaces start plus duration. */
  returnBy?: string;
  /** Goods: ready this many minutes after the order when the date is today, instead of a fixed evening. */
  leadMin?: number;
  /** Goods: when the order is ready on a later date, "HH:MM". Default 17:00. */
  readyAt?: string;
};

export type StayStatus = 'booked' | 'in-house' | 'checked-out' | 'cancelled';

export type Stay = {
  id: string;
  guestId: string;
  room: string;
  /** ISO dates. */
  checkIn: string;
  checkOut: string;
  status: StayStatus;
  checkedOutAt?: number;
};

export type Guest = {
  id: string;
  firstName: string;
  notificationsOff: boolean;
};

/** What a guest asks for. */
export type Draft = {
  listingId: string;
  /** ISO date of the service, or the first day of a rental. */
  date: string;
  /** "HH:MM". Rentals: the pickup time. Goods: ignored. */
  time?: string;
  /** Bikes, guests, boxes or party size. */
  qty: number;
  /** Rental days. */
  days?: number;
  payMode?: PayMode;
  note?: string;
  origin?: 'app' | 'guest-chat' | 'desk';
  /** Pesos off the price, from points. The booking costs that much less. */
  discount?: number;
};

export type Booking = {
  id: string;
  listingId: string;
  stayId: string;
  guestId: string;
  kind: Kind;
  status: BookingStatus;
  qty: number;
  days: number;
  /** Start and end, hotel-local ms. */
  start: number;
  end: number;
  amount: number;
  payMode: PayMode | null;
  paymentIds: string[];
  /**
   * The guest and vendor chat's id. The chat itself exists only once the
   * vendor has committed: at booking for an instant listing or a table, when
   * the vendor accepts for a confirm-first one. A request that never gets a yes
   * never gets a chat.
   */
  threadId: string;
  /** How the request was put, said again as the chat's first line when the chat opens. */
  requestLine?: string;
  createdAt: number;
  /** When a vendor's silence turns the request into a lapse. */
  deadline?: number;
  note?: string;
  origin: 'app' | 'guest-chat' | 'desk';
  staffName?: string;
  reason?: string;
  cancelRequested?: boolean;
  /** Who cancelled it, so a guest can dispute a vendor's cancellation and no one else's. */
  cancelledBy?: 'guest' | 'vendor' | 'desk' | 'system' | 'accepted';
  vendorOpened: boolean;
  /** Goods: the day the order is ready for. */
  readyFor?: string;
  /** Goods quantity the vendor could not supply. */
  shortBy?: number;
  /** Which slot holds this booking uses. */
  slotKeys: string[];
  /** Until when this booking's hold is good for: a timer, a payment window or a desk answer. */
  holdUntil?: number;
  /** For a vendor-confirm booking: when the vendor accepted it. */
  acceptedAt?: number;
  /** The stay changed under a room-paid booking: the guest pays in full or cancels. */
  needsPayChange?: boolean;
  /** Goods: the vendor has packed it and sent it to the desk. */
  packed?: boolean;
  /** How many times the status has changed: a guard for simultaneous actions. */
  version: number;
  lastActor?: { name: string; at: number; action: string };
};

export type Payment = {
  id: string;
  bookingId: string;
  stayId: string;
  purpose: 'booking' | 'extra';
  mode: PayMode;
  amount: number;
  state: PayState;
  /** Unique reference; the PMS folio is checked for it before any retry. */
  ref: string;
  tries: number;
  windowEnd?: number;
  inQuestion: boolean;
  reason?: string;
  createdAt: number;
  /** The posting is waiting for check-in. */
  holdUntilCheckIn?: boolean;
  /** Extra charges the vendor may still correct until this time. */
  correctUntil?: number;
  voidedBy?: string;
  /** The room the charge was addressed to when it was made; refreshed if the PMS refuses it. */
  roomHint?: string;
  /** A second payment for something already paid: refunded automatically. */
  duplicate?: boolean;
};

/**
 * A disagreement the front desk has to decide. While one is open the desk may
 * read the guest and vendor chat, read only; deciding it ends that access.
 */
export type DisputeKind = 'charge' | 'no-show' | 'vendor-cancel' | 'damage';
export type Dispute = {
  id: string;
  bookingId: string;
  /** The charge in question, for every kind but a disputed cancellation. */
  paymentId?: string;
  kind: DisputeKind;
  openedBy: 'guest' | 'vendor';
  openedAt: number;
  decidedAt?: number;
  outcome?: string;
  /** Each time the desk opened the chat to read it. */
  reads: number[];
};

export type Task = {
  id: string;
  kind:
    | 'over-limit-approval'
    | 'vendor-nudge'
    | 'pms-failure'
    | 'pms-alert'
    | 'failed-refund'
    | 'questioned-charge'
    | 'disputed-cancel'
    | 'damage-claim'
    | 'checkout-blocker'
    | 'lapsed-reinstate'
    | 'refund-due'
    | 'batch-cancel'
    | 'uncollected-goods'
    | 'stay-conflict'
    | 'vendor-cancel-declined'
    | 'booking-request';
  owner: 'front-desk';
  dueAt: number;
  openedAt: number;
  status: 'open' | 'done';
  bookingId?: string;
  paymentId?: string;
  detail: string;
  doneBy?: string;
  doneHow?: string;
};

export type Message = {
  id: string;
  at: number;
  from: { role: Role; name: string };
  text: string;
  kind: 'text' | 'system' | 'card';
  /** For a card: the booking it shows. A card is a view, never a copy. */
  bookingId?: string;
  /** For an extra-charge card: the payment it shows. */
  paymentId?: string;
  visibleTo: Role[];
};

export type Thread = {
  id: string;
  /** `booking`: guest, desk and vendor. `desk`: guest and desk. `desk-vendor`: private. */
  kind: 'booking' | 'desk' | 'desk-vendor';
  stayId: string;
  bookingId?: string;
  vendorId?: string;
  participants: Role[];
  messages: Message[];
  openedAt: number;
  /** After this the thread is read-only. */
  readOnlyAt?: number;
  /** Per viewer, the count of messages not yet read. */
  unread: Record<Role, number>;
};

export type Notification = {
  id: string;
  to: Role;
  channel: 'push' | 'sms';
  topic: string;
  bookingId?: string;
  at: number;
  delivered: boolean;
  opened: boolean;
};

export type LogEntry = {
  at: number;
  seq: number;
  kind: string;
  detail: string;
  /** For state changes. */
  entity?: 'booking' | 'payment';
  entityId?: string;
  from?: string | null;
  to?: string;
  actor?: string;
};

export type FolioEntry = { ref: string; stayId: string; room: string; amount: number; reversed: boolean; postedAt: number; /** Posted by a venue's own system, not through Cabana. */ external?: boolean; label?: string };

export type Card = {
  bookingId: string;
  state: CardState;
  /** The label on the card, e.g. "Waiting for the front desk". */
  label: string;
  kindLabel: string;
  title: string;
  facts: { label: string; value: string }[];
  cost: { amount: number; line: string };
  timer?: { text: string; endsAt: number; progress: number };
  note?: string;
  actions: CardAction[];
};

export type CardAction =
  | 'cancel'
  | 'withdraw'
  | 'pay'
  | 'pay-in-full'
  | 'show-qr'
  | 'open-menu'
  | 'view-booking'
  | 'pick-another'
  | 'message-desk'
  | 'call-vendor'
  | 'question'
  | 'dispute-cancel'
  | 'running-late';

export type Refusal =
  | 'invalid-state'
  | 'already-actioned'
  | 'lapsed'
  | 'not-offered'
  | 'unavailable'
  | 'over-maximum'
  | 'over-cap'
  | 'not-a-participant'
  | 'thread-closed'
  | 'too-early'
  | 'no-cache'
  | 'blocked'
  | 'not-found'
  | 'not-possible'
  /** The desk asked to read a guest and vendor chat with no dispute open. */
  | 'no-dispute';

export type Result<T = object> = ({ ok: true } & T) | { ok: false; reason: Refusal; message: string; by?: string; at?: number };

export type PayOptions = {
  price: number;
  /** Room is pre-selected when offered. */
  defaultMode: PayMode;
  room: { offered: boolean; why?: string; needsApproval: boolean };
  card: { offered: boolean };
};

export type PmsSim = {
  mode: 'up' | 'down' | 'reject';
  /** With `reject`: refuse a posting to a room the guest has left. */
  staleRoomRefused: boolean;
  /** Post the charge but lose the reply, once. */
  dropNextReply: boolean;
  /** Refuse the next reversal. */
  refuseReversal: boolean;
  folio: FolioEntry[];
};

export type GatewaySim = {
  mode: 'ok' | 'fail' | 'abandon';
  loseCallbacks: boolean;
  duplicateCallbacks: number;
  failRefunds: boolean;
  allowDoublePay: boolean;
  /** Money taken minus refunded, per the gateway. */
  net: number;
};

export type Actor = { name: string; role: 'owner' | 'staff' | 'hotel' };

export type GuestActions = {
  quote(draft: Draft): Result<{ options: PayOptions }>;
  /** Ask, or book. A second identical request while one is live is ignored. */
  request(draft: Draft): Result<{ bookingId: string; duplicate?: boolean }>;
  /** After the desk declined or stayed silent on an over-limit room payment. */
  choosePayInFull(bookingId: string): Result;
  payCard(bookingId: string, method?: 'card' | 'gcash' | 'maya'): Result<{ outcome: 'paid' | 'failed' | 'abandoned'; triesLeft: number }>;
  /** Withdraw before it is answered, or cancel after. */
  cancel(bookingId: string): Result<{ outcome: 'withdrawn' | 'cancelled' | 'requested' }>;
  question(paymentId: string, text?: string): Result;
  /** Dispute a cancellation the vendor made. */
  disputeCancel(bookingId: string, text?: string): Result;
  payExtra(paymentId: string, mode?: PayMode): Result<{ outcome?: 'paid' | 'failed' | 'abandoned'; triesLeft?: number }>;
  send(threadId: string, text: string): Result<{ redirectedTo?: string }>;
  sendToDesk(text: string): Result;
  runningLate(bookingId: string): Result;
};

export type VendorActions = {
  open(bookingId: string): Result;
  confirm(bookingId: string, actor?: Actor): Result;
  decline(bookingId: string, reason?: string, actor?: Actor): Result;
  /** The guest's QR, or name and room. */
  scan(bookingId: string): Result;
  lookup(name: string, room: string): Result<{ bookingId: string }>;
  complete(bookingId: string): Result;
  seat(bookingId: string): Result;
  sendToDesk(bookingId: string): Result;
  markShort(bookingId: string, shortBy: number): Result;
  addExtra(bookingId: string, amount: number, reason: string): Result<{ paymentId: string }>;
  /** Claim for damage: added as a charge already in question, decided by the front desk. */
  claimDamage(bookingId: string, amount: number, reason: string): Result<{ paymentId: string }>;
  correctExtra(paymentId: string, amount: number): Result<{ paymentId: string }>;
  markNoShow(bookingId: string): Result;
  cancel(bookingId: string, reason: string): Result;
  cancelSlot(listingId: string, slotKey: string, reason: string): Result<{ count: number; batchId: string }>;
  answerCancel(bookingId: string, accept: boolean): Result;
  blockSlot(listingId: string, slotKey: string): Result;
  removeListing(listingId: string): Result;
  setAway(on: boolean): void;
  setOnline(on: boolean): void;
  /** Open the app while online so today's and tomorrow's bookings are cached on the phone. */
  cacheBookings(): void;
  message(threadId: string, text: string): Result;
  replyPrivate(text: string, bookingId?: string): Result;
};

export type DeskActions = {
  approve(bookingId: string): Result;
  declineApproval(bookingId: string): Result;
  message(text: string): void;
  /** The desk says something about a booking. Booking chats are the guest's and the vendor's, so it goes to the desk's own chat with the guest. */
  messageBooking(threadId: string, text: string): Result;
  privateNote(vendorId: string, text: string, bookingId?: string): Result;
  bookFor(guestId: string, draft: Draft, how: { staffName: string; asked: 'in-person' | 'chat' }): Result<{ bookingId: string }>;
  cancelFor(bookingId: string, staffName: string): Result<{ outcome: 'withdrawn' | 'cancelled' | 'requested' }>;
  markReady(bookingId: string): Result;
  handOver(bookingId: string): Result;
  checkIn(stayId: string): Result;
  moveRoom(stayId: string, room: string): Result;
  shortenStay(stayId: string, newCheckOut: string): Result;
  /** The hotel system's view of the stay changed: dates, room or status. Applies no side effects of its own. */
  syncStay(stayId: string, patch: { room?: string; checkIn?: string; checkOut?: string; status?: StayStatus }): Result;
  cancelStay(stayId: string): Result;
  /** Lists what blocks it; finishes only when nothing does. */
  checkout(stayId: string): Result<{ blockers: string[]; checklist: string[] }>;
  resolveCharge(paymentId: string, how: 'uphold' | 'adjust' | 'waive', newAmount?: number): Result;
  /**
   * Read the guest and vendor chat of a booking with an open dispute. Read only:
   * the desk is never a member of that chat. Both sides are told, and it is logged.
   */
  readDispute(bookingId: string): Result<{ dispute: Dispute; messages: Message[] }>;
  /** Decide a disputed vendor cancellation: it stands, or a fresh request goes back to the vendor. */
  decideCancelDispute(bookingId: string, outcome: 'stands' | 'reinstate'): Result<{ bookingId?: string }>;
  reinstate(bookingId: string): Result;
  postByHand(paymentId: string): Result;
  voidCharge(paymentId: string): Result;
  collectInFull(paymentId: string): Result;
  settleRefund(paymentId: string): Result;
  resolveTask(taskId: string, how?: string): Result;
};

export type ThreadSummary = {
  id: string;
  kind: Thread['kind'];
  title: string;
  last?: Message;
  unread: number;
  /** Booking threads: the card state to show in the row. */
  cardState?: CardState;
  cardLabel?: string;
  readOnly: boolean;
  bookingId?: string;
};

export type Pilot = {
  settings: Settings;
  seed: number;
  now(): number;
  advanceMinutes(minutes: number): void;
  advanceHours(hours: number): void;
  advanceDays(days: number): void;
  advanceTo(ts: number): void;

  /** Maria, in house at Villa 12. */
  maria: { guestId: string; stayId: string };
  addGuest(input: { firstName: string; room?: string; checkIn: string; checkOut: string; status?: StayStatus }): { guestId: string; stayId: string };
  setCapacity(listingId: string, capacity: number, slotKey?: string): void;
  setGuestNotifications(guestId: string, on: boolean): void;
  /** The guest or vendor opens a notification. */
  openNotification(id: string): void;

  pms: PmsSim;
  setPms(patch: Partial<Omit<PmsSim, 'folio'>>): void;
  gateway: GatewaySim;
  setGateway(patch: Partial<Omit<GatewaySim, 'net'>>): void;

  guest(guestId?: string): GuestActions;
  vendor(vendorId: string): VendorActions;
  desk: DeskActions;
  /** Two actions arriving together: the first recorded wins; the other is told. */
  together(first: () => Result<object>, second: () => Result<object>): [Result<object>, Result<object>];

  listing(id: string): Listing;
  listings(): Listing[];
  vendors(): Vendor[];
  stay(id: string): Stay;
  booking(id: string): Booking;
  bookings(): Booking[];
  payment(id: string): Payment;
  payments(bookingId?: string): Payment[];
  card(bookingId: string): Card;
  /** The card for one extra charge. */
  extraCard(paymentId: string): Card;
  /** The threads a guest (by guest id), a vendor (by vendor id) or the desk can see. */
  threads(viewer: Role, viewerId?: string): ThreadSummary[];
  thread(threadId: string, viewer: Role, markRead?: boolean): Result<{ messages: Message[]; readOnly: boolean }>;
  deskThreadId(stayId: string): string;
  privateThreadId(vendorId: string): string;
  tasks(status?: 'open' | 'done'): Task[];
  /** Disputes, open and decided, optionally for one booking. */
  disputes(bookingId?: string): Dispute[];
  outbox(): Notification[];
  log(): LogEntry[];
  slot(listingId: string, date: string, time?: string): { key: string; capacity: number; held: number; confirmed: number };
  slotKeyFor(listingId: string, date: string, time?: string): string;
  /** Hotel-local ms for an ISO date and "HH:MM". */
  at(date: string, time?: string): number;
  /** Vendor timer: when this request lapses if nobody answers. */
  deadlineFor(listingId: string, requestedAt: number, startMs: number): number;
  vendorState(vendorId: string): { online: boolean; away: boolean; pendingTaps: number };
  foliosTotal(stayId: string): number;
  /** A venue posts a bill to the folio through its own system. Cabana's limits do not count it. */
  externalCharge(stayId: string, amount: number, label: string): void;
  /** I1 to I9. Empty when everything holds. */
  invariants(): string[];
  /** Number of public actions applied so far: the step in a replay. */
  steps(): number;
};

export type PilotOptions = {
  seed?: number;
  settings?: Partial<Settings>;
  /** Check every invariant after every action and throw on the first break. */
  paranoid?: boolean;
  /** Start of the simulation, hotel-local ms. Default: Wednesday 7 Oct 2026, 10:00. */
  start?: number;
  /** Maria's stay, ISO dates. */
  mariaStay?: { checkIn: string; checkOut: string; status?: StayStatus; room?: string };
  /** The guest's first name. Default Maria. */
  guestName?: string;
  /** Vendors and listings to offer instead of the Dumaguete pilot's own. */
  catalog?: { vendors: Vendor[]; listings: Listing[] };
};
