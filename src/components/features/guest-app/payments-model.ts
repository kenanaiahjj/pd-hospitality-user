import type { GuestSession, PaymentRecord } from './prototype-model';

/*
  The payments ledger: money that went through the gateway, and what came back.

  It is a record of its own, not something read off the bookings, because the
  bookings do not outlive the money -- cancelling a stay removes it and the
  arrival services booked for it, and a guest still wants to see that they were
  charged and refunded. Direct-booking room charges are itemized here because
  they are paid through the gateway. Folio room charges still settle at the
  front desk.
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
    ? { ...payment, refunded: payment.amount, items: payment.items.map((item) => ({ ...item, refunded: true, refundedAmount: item.amount })) }
    : payment));
}

export type StayPaymentItemUpdate = { id: string; refundAmount: number; cancelled?: boolean };

/** Some rooms or services changed: refund the matching payment lines without losing their source. */
export function refundBookingItems(session: GuestSession, bookingId: string, updates: StayPaymentItemUpdate[]): GuestSession {
  const unmatched = new Map(updates.map((update) => [update.id, update]));
  const payments = (session.payments ?? []).map((payment) => {
    if (payment.bookingId !== bookingId) return payment;
    let itemRefund = 0;
    const items = payment.items.map((item) => {
      const update = item.id ? unmatched.get(item.id) : undefined;
      if (!update) return item;
      unmatched.delete(update.id);
      const previous = item.refundedAmount ?? (item.refunded ? item.amount : 0);
      const refundedAmount = Math.min(item.amount, previous + Math.max(0, update.refundAmount));
      const accepted = refundedAmount - previous;
      itemRefund += accepted;
      return {
        ...item,
        refundedAmount,
        refunded: refundedAmount >= item.amount && refundedAmount > 0,
        cancelled: item.cancelled || update.cancelled,
      };
    });
    return itemRefund
      ? { ...payment, refunded: Math.min(payment.amount, payment.refunded + itemRefund), items }
      : items.some((item, index) => item !== payment.items[index]) ? { ...payment, items } : payment;
  });

  // Older receipts have one aggregate room line with no ID. Keep their payment total accurate.
  const unmatchedRefund = [...unmatched.values()].reduce((sum, update) => sum + Math.max(0, update.refundAmount), 0);
  if (unmatchedRefund > 0) {
    const stayIndex = payments.findIndex((payment) => payment.bookingId === bookingId && payment.kind === 'stay');
    if (stayIndex >= 0) {
      const payment = payments[stayIndex]!;
      payments[stayIndex] = { ...payment, refunded: Math.min(payment.amount, payment.refunded + unmatchedRefund) };
    }
  }
  return session.payments ? { ...session, payments } : session;
}

/** A full stay cancellation refunds eligible room value plus every linked payment that is still outstanding. */
export function refundRemainingLinkedPayments(session: GuestSession, bookingId: string, serviceBookingIds: string[]): GuestSession {
  const ids = new Set(serviceBookingIds);
  return mapPayments(session, (payment) => {
    if (payment.bookingId !== bookingId || payment.kind === 'stay') return payment;
    let increment = 0;
    const items = payment.items.map((item) => {
      if (!item.id || !ids.has(item.id)) return item;
      const previous = item.refundedAmount ?? (item.refunded ? item.amount : 0);
      const refundedAmount = item.amount;
      increment += Math.max(0, refundedAmount - previous);
      return { ...item, refunded: true, refundedAmount, cancelled: true };
    });
    return increment
      ? { ...payment, refunded: Math.min(payment.amount, payment.refunded + increment), items }
      : items.some((item, index) => item !== payment.items[index]) ? { ...payment, items } : payment;
  });
}

/** One paid service cancelled, whether it was paid alone or as a line of a cart. */
export function refundServiceLine(session: GuestSession, serviceBookingId: string): GuestSession {
  return mapPayments(session, (payment) => {
    const line = payment.items.find((item) => item.id === serviceBookingId && !item.refunded);
    if (!line) return payment;
    const alreadyRefunded = line.refundedAmount ?? 0;
    const refund = Math.max(0, line.amount - alreadyRefunded);
    return {
      ...payment,
      refunded: Math.min(payment.amount, payment.refunded + refund),
      items: payment.items.map((item) => (item.id === serviceBookingId ? { ...item, refunded: true, refundedAmount: item.amount, cancelled: true } : item)),
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
