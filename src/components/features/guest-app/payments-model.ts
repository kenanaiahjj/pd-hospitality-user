import type { GuestSession, PaymentRecord } from './prototype-model';

/*
  The payments ledger: money that went through the gateway, and what came back.

  It is a record of its own, not something read off the bookings, because the
  bookings do not outlive the money -- cancelling a stay removes it and the
  arrival services booked for it, and a guest still wants to see that they were
  charged and refunded. Room charges are not here: they settle at the front
  desk and live on My Stay.
*/

export const PAYMENT_METHOD_NAMES: Record<PaymentRecord['method'], string> = { card: 'Card', gcash: 'GCash', maya: 'Maya' };

export type PaymentStatus = 'paid' | 'partly-refunded' | 'refunded';

export function paymentStatus(payment: PaymentRecord): PaymentStatus {
  if (payment.refunded <= 0) return 'paid';
  return payment.refunded >= payment.amount ? 'refunded' : 'partly-refunded';
}

/** Newest first. Re-recording the same payment replaces it rather than doubling it. */
export function recordPayment(session: GuestSession, payment: PaymentRecord): GuestSession {
  return { ...session, payments: [payment, ...(session.payments ?? []).filter((item) => item.id !== payment.id)] };
}

const mapPayments = (session: GuestSession, change: (payment: PaymentRecord) => PaymentRecord): GuestSession =>
  session.payments ? { ...session, payments: session.payments.map(change) } : session;

/** A whole booking cancelled: everything paid for it, stay and services alike, goes back. */
export function refundBooking(session: GuestSession, bookingId: string): GuestSession {
  return mapPayments(session, (payment) => (payment.bookingId === bookingId
    ? { ...payment, refunded: payment.amount, items: payment.items.map((item) => ({ ...item, refunded: true })) }
    : payment));
}

/** Some of the rooms cancelled: the stay's payment is partly refunded, never past what was paid. */
export function refundStayAmount(session: GuestSession, bookingId: string, amount: number): GuestSession {
  return mapPayments(session, (payment) => (payment.bookingId === bookingId && payment.kind === 'stay'
    ? { ...payment, refunded: Math.min(payment.amount, payment.refunded + amount) }
    : payment));
}

/** One paid service cancelled, whether it was paid alone or as a line of a cart. */
export function refundServiceLine(session: GuestSession, serviceBookingId: string): GuestSession {
  return mapPayments(session, (payment) => {
    const line = payment.items.find((item) => item.id === serviceBookingId && !item.refunded);
    if (!line) return payment;
    return {
      ...payment,
      refunded: Math.min(payment.amount, payment.refunded + line.amount),
      items: payment.items.map((item) => (item.id === serviceBookingId ? { ...item, refunded: true } : item)),
    };
  });
}

/** What the guest has actually paid, net of refunds, and how many payments that was. */
export function paymentsSummary(session: GuestSession): { count: number; net: number } {
  const payments = session.payments ?? [];
  return { count: payments.length, net: payments.reduce((sum, payment) => sum + payment.amount - payment.refunded, 0) };
}

/** A short reference for the receipt, stable for a payment: "CBN-4F9K2X". Not the internal id, which names what was bought. */
export function paymentReference(payment: Pick<PaymentRecord, 'id'>): string {
  let hash = 5381;
  for (const char of payment.id) hash = (hash * 33 + char.charCodeAt(0)) >>> 0;
  return `CBN-${(hash % 36 ** 6).toString(36).toUpperCase().padStart(6, '0')}`;
}
