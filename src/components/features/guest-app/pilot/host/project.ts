import { formatPesoAmount, formatServiceDay, PROTOTYPE_TODAY, type GuestSession, type PaymentRecord, type ServiceBooking } from '../../prototype-model';
import { PAYMENT_METHOD_NAMES } from '../../payments-model';
import { returnPoints } from '../../rewards/points-model';
import type { Booking as EngineBooking, BookingStatus, Payment, Pilot } from '../types';
import type { Host } from './host';

/*
  The engine decides; the app's own records present. After any engine action
  this puts the engine's answer onto the `ServiceBooking`s and `PaymentRecord`s
  that My Stay, the room bill, Payments, badges and the bell already read, so
  none of them had to learn a new vocabulary.

  Pure and idempotent: it returns the very same session when nothing changed,
  which is what keeps a state update from looping.
*/

const CANCELLED: BookingStatus[] = ['cancelled', 'declined', 'lapsed', 'withdrawn', 'payment-expired'];
const DONE: BookingStatus[] = ['completed', 'collected', 'seated', 'no-show'];
const WAITING_FOR_DESK: BookingStatus[] = ['needs-approval', 'pay-or-cancel'];

const time12 = (ms: number) => {
  const d = new Date(ms);
  const h = d.getUTCHours();
  return `${((h + 11) % 12) + 1}:${String(d.getUTCMinutes()).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
};
const isoOf = (ms: number) => new Date(ms).toISOString().slice(0, 10);

const roomLive = (p: Payment) => p.mode === 'room' && !['voided', 'reversed', 'refund-due', 'failed'].includes(p.state);

/** What the guest is told about where a booking stands, in the receipt's own words. */
export function engineStatusLine(eb: EngineBooking): string {
  switch (eb.status) {
    case 'needs-approval': return 'Waiting for the front desk to approve';
    case 'pay-or-cancel': return 'Pay in full or cancel';
    case 'requested': return 'Waiting for the vendor to confirm';
    case 'awaiting-payment': return 'Confirmed once paid';
    case 'confirmed': return 'Confirmed';
    case 'reserved': return 'Reserved';
    case 'ready': return 'Ready at the front desk';
    case 'in-progress': return 'In progress';
    case 'completed': case 'collected': case 'seated': return 'Done';
    case 'no-show': return 'No-show';
    case 'withdrawn': return 'Withdrawn';
    case 'declined': return 'The vendor is not available';
    case 'lapsed': return 'The vendor did not answer in time';
    case 'payment-expired': return 'Payment expired';
    case 'cancelled': return 'Cancelled';
  }
}

/** What the guest may do about cancelling, in the engine's own rule: free in the window, the vendor's say after it. */
export function engineCancelLine(pilot: Pilot, eb: EngineBooking): string {
  const listing = pilot.listing(eb.listingId);
  if (eb.kind === 'table') return 'Free to cancel any time before you are seated. The table is held 15 minutes past your time.';
  if (['requested', 'needs-approval', 'pay-or-cancel', 'awaiting-payment'].includes(eb.status)) return 'Withdraw any time before it is confirmed. Nothing is charged until then.';
  const until = eb.start - listing.freeCancelHours * 3_600_000;
  const d = new Date(until);
  const h = d.getUTCHours();
  const clock = `${((h + 11) % 12) + 1}:${String(d.getUTCMinutes()).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
  return `Free to cancel until ${clock} on ${formatServiceDay(isoOf(until)).short}. After that the vendor has to accept the cancellation.`;
}

function present(pilot: Pilot, host: Host, eb: EngineBooking, appBookingId: string, existing: ServiceBooking | undefined): ServiceBooking {
  const listing = pilot.listing(eb.listingId);
  const vendor = pilot.vendors().find((v) => v.id === listing.vendorId);
  const pays = pilot.payments(eb.id).filter((p) => p.purpose === 'booking' && !p.duplicate);
  const room = pays.find(roomLive);
  const card = pays.filter((p) => p.mode === 'card').at(-1);
  const refunded = pays.some((p) => p.mode === 'card' && ['refunded', 'refund-pending', 'refund-failed'].includes(p.state));
  const method = card ? (host.meta[`method:${card.id}`] as ServiceBooking['paymentMethod'] | undefined) ?? 'card' : undefined;

  let status: ServiceBooking['status'] = 'confirmed';
  if (CANCELLED.includes(eb.status)) status = 'cancelled';
  else if (DONE.includes(eb.status)) status = 'completed';

  let paymentStatus: ServiceBooking['paymentStatus'];
  let bookingConfirmation: ServiceBooking['bookingConfirmation'];
  if (WAITING_FOR_DESK.includes(eb.status)) paymentStatus = 'pending-confirmation';
  else if (eb.status === 'requested') {
    paymentStatus = 'pending-confirmation';
    bookingConfirmation = 'awaiting-provider';
  } else if (eb.status === 'awaiting-payment') paymentStatus = 'payment-pending';
  else if (refunded) paymentStatus = 'refunded';
  else if (card?.state === 'paid') paymentStatus = 'paid';
  else if (room) paymentStatus = 'charged-to-room';
  else if (eb.amount === 0 || eb.kind === 'table') paymentStatus = 'complimentary';
  else paymentStatus = existing?.paymentStatus ?? 'complimentary';

  const day = isoOf(eb.start);
  const when = `${formatServiceDay(day).long} · ${time12(eb.start)}`;
  const statusFact = { label: 'Status', value: engineStatusLine(eb) };
  const paymentLine = paymentStatus === 'paid' ? `Paid · ${PAYMENT_METHOD_NAMES[(method ?? 'card') as 'card' | 'gcash' | 'maya']}`
    : paymentStatus === 'charged-to-room' ? 'Charged to your room'
    : paymentStatus === 'refunded' ? 'Refunded'
    : undefined;
  const facts = [...(existing?.facts ?? []).filter((fact) => fact.label !== 'Status' && fact.label !== 'Payment'), ...(paymentLine ? [{ label: 'Payment', value: paymentLine }] : []), statusFact];

  const unit = eb.kind === 'rental' ? (eb.qty === 1 ? 'bike' : 'bikes') : eb.kind === 'goods' ? (eb.qty === 1 ? 'item' : 'items') : eb.kind === 'table' ? 'guests' : 'guests';
  const summary = existing?.summary
    ?? (eb.kind === 'table' ? `${time12(eb.start)} · Table for ${eb.qty} · order at the venue`
      : eb.kind === 'rental' ? `${time12(eb.start)} · return by ${time12(eb.end)} · ${eb.qty} ${unit}`
      : eb.kind === 'goods' ? `${eb.qty} ${unit} · collect at the front desk`
      : undefined);

  const base: ServiceBooking = existing ?? {
    id: `engine-${eb.id}`,
    bookingId: appBookingId,
    title: listing.title,
    scheduledFor: when,
    scheduledDate: day,
    scheduledHour: new Date(eb.start).getUTCHours(),
    bookedAt: PROTOTYPE_TODAY,
    serviceId: listing.id,
    amount: '',
    status: 'confirmed',
    provider: vendor?.name,
    ...(eb.kind === 'rental' ? { rentalQuantity: eb.qty } : { partySize: eb.qty }),
    ...(summary ? { summary } : {}),
    ...(eb.note ? { facts: [{ label: 'Your note', value: eb.note }] } : {}),
  };

  const next: ServiceBooking = {
    ...base,
    engineId: eb.id,
    status,
    paymentStatus,
    paymentMethod: paymentStatus === 'paid' ? method : paymentStatus === 'charged-to-room' ? 'room' : undefined,
    bookingConfirmation,
    amount: eb.kind === 'table' || eb.amount === 0 ? '' : formatPesoAmount(eb.amount),
    facts,
  };
  if (!bookingConfirmation) delete next.bookingConfirmation;
  if (!next.paymentMethod) delete next.paymentMethod;
  return next;
}

function presentExtra(pilot: Pilot, eb: EngineBooking, p: Payment, appBookingId: string, existing: ServiceBooking | undefined): ServiceBooking {
  const listing = pilot.listing(eb.listingId);
  const undone = ['voided', 'reversed', 'expired', 'refunded'].includes(p.state);
  const paymentStatus: ServiceBooking['paymentStatus'] = undone ? 'refunded' : p.mode === 'room' ? 'charged-to-room' : p.state === 'paid' ? 'paid' : 'payment-pending';
  const day = isoOf(eb.start);
  return {
    ...(existing ?? {
      id: `engine-extra-${p.id}`,
      bookingId: appBookingId,
      title: `${p.reason ?? 'Extra charge'}`,
      scheduledFor: `${formatServiceDay(day).long} · ${time12(eb.start)}`,
      scheduledDate: day,
      scheduledHour: new Date(eb.start).getUTCHours(),
      bookedAt: PROTOTYPE_TODAY,
      provider: pilot.vendors().find((v) => v.id === listing.vendorId)?.name,
      categoryId: 'services' as const,
      summary: `Added to ${listing.title}`,
    }),
    amount: formatPesoAmount(p.amount),
    status: undone ? 'cancelled' : 'confirmed',
    paymentStatus,
    ...(paymentStatus === 'charged-to-room' ? { paymentMethod: 'room' as const } : {}),
    engineExtraId: p.id,
  };
}

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

export function applyEngine(session: GuestSession, host: Host): GuestSession {
  const pilot = host.pilot;
  const bookings = [...session.serviceBookings];
  let payments = session.payments ? [...session.payments] : [];
  let changed = false;

  const upsert = (record: ServiceBooking, matches: (s: ServiceBooking) => boolean) => {
    const at = bookings.findIndex(matches);
    if (at < 0) {
      bookings.push(record);
      changed = true;
    } else if (!same(bookings[at], record)) {
      bookings[at] = record;
      changed = true;
    }
  };

  // Only stays this session holds: signed out, or on another account, the engine's guests are not shown.
  const heldStays = new Set(session.bookings.map((booking) => booking.id));
  for (const [appBookingId, { guestId }] of host.stays()) {
    if (!heldStays.has(appBookingId)) continue;
    for (const eb of pilot.bookings().filter((b) => b.guestId === guestId)) {
      const existing = bookings.find((s) => s.engineId === eb.id);
      upsert(present(pilot, host, eb, appBookingId, existing), (s) => s.engineId === eb.id);
      for (const p of pilot.payments(eb.id)) {
        if (p.purpose === 'extra') {
          upsert(presentExtra(pilot, eb, p, appBookingId, bookings.find((s) => s.engineExtraId === p.id)), (s) => s.engineExtraId === p.id);
        }
        if (p.mode === 'card' && ['paid', 'refund-pending', 'refund-failed', 'refunded'].includes(p.state) && !p.duplicate) {
          const owner = bookings.find((s) => s.engineId === eb.id)!;
          const method = (host.meta[`method:${p.id}`] as PaymentRecord['method'] | undefined) ?? 'card';
          const back = p.state === 'refunded' ? p.amount : 0;
          const record: PaymentRecord = {
            id: `pay-${p.id}`,
            paidAt: PROTOTYPE_TODAY,
            kind: 'service',
            title: p.purpose === 'extra' ? `${p.reason ?? 'Extra charge'}` : owner.title,
            detail: owner.provider ?? '',
            amount: p.amount,
            method,
            bookingId: appBookingId,
            items: [{ id: p.purpose === 'extra' ? `engine-extra-${p.id}` : owner.id, title: p.purpose === 'extra' ? `${p.reason ?? 'Extra charge'}` : owner.title, amount: p.amount, ...(back ? { refunded: true, refundedAmount: back } : {}) }],
            refunded: back,
          };
          const at = payments.findIndex((x) => x.id === record.id);
          if (at < 0) {
            payments = [record, ...payments];
            changed = true;
          } else if (!same(payments[at], record)) {
            payments[at] = record;
            changed = true;
          }
        }
      }
    }
  }
  const projected = changed ? { ...session, serviceBookings: bookings, payments } : session;
  // Points staged against a booking come back when it does not happen. Returning is a no-op the second time.
  const ended = bookings.filter((service) => service.engineId && service.status === 'cancelled').map((service) => service.id);
  return ended.length ? returnPoints(projected, ended) : projected;
}
