import type { CartLine, GuestSession, ServiceBooking } from './prototype-model';
import { formatPesoAmount, parsePesoAmount } from './prototype-model';

/*
  The pre-arrival cart: everything a guest arranges before arriving, paid in
  one gateway payment. Pure -- the session in, the session out -- so the
  checkout cannot half-happen: a booking exists only if its money moved.

  Only what is paid now touches the gateway. Early check-in is the exception,
  because its fee is a room charge and there is no room yet; it rides in the
  cart so the guest still checks out once, and settles on the room later.
*/

export type CartPaymentMethod = Exclude<NonNullable<ServiceBooking['paymentMethod']>, 'room'>;

/** This stay's lines. The cart is per booking: a second trip's cart is its own. */
export function cartFor(session: GuestSession, bookingId: string): CartLine[] {
  return (session.cart ?? []).filter((line) => line.booking.bookingId === bookingId);
}

/** One line per slot: adding the same slot again replaces it, never doubles it. */
export function addToCart(session: GuestSession, line: CartLine): GuestSession {
  return { ...session, cart: [...(session.cart ?? []).filter((item) => item.booking.id !== line.booking.id), line] };
}

export function removeFromCart(session: GuestSession, lineId: string): GuestSession {
  return { ...session, cart: (session.cart ?? []).filter((item) => item.booking.id !== lineId) };
}

export type CartTotals = { count: number; payNow: number; roomLater: number };

export function cartTotals(lines: CartLine[]): CartTotals {
  return lines.reduce<CartTotals>((totals, line) => {
    const amount = parsePesoAmount(line.booking.amount);
    return {
      count: totals.count + 1,
      payNow: totals.payNow + (line.settle === 'pay-now' ? amount : 0),
      roomLater: totals.roomLater + (line.settle === 'room-later' ? amount : 0),
    };
  }, { count: 0, payNow: 0, roomLater: 0 });
}

/**
 * Turns the cart into bookings. `method` is what the gateway took the pay-now
 * total with; it is required only when there is one.
 */
export function settleCart(
  session: GuestSession,
  bookingId: string,
  method?: CartPaymentMethod,
): { session: GuestSession; bookingIds: string[] } {
  const lines = cartFor(session, bookingId);
  const held = new Set(session.serviceBookings.filter((service) => service.status === 'confirmed').map((service) => service.id));

  const bookings = lines.filter((line) => !held.has(line.booking.id)).map((line): ServiceBooking => {
    if (line.settle === 'free') return { ...line.booking, paymentStatus: 'complimentary', paymentMethod: undefined };
    if (line.settle === 'pay-now') return { ...line.booking, paymentStatus: 'paid', paymentMethod: method ?? 'card' };
    return { ...line.booking, paymentStatus: 'pending-confirmation', paymentMethod: 'room' };
  });
  const earlyCheckIn = lines.find((line) => line.earlyCheckIn)?.earlyCheckIn;
  const ids = new Set(lines.map((line) => line.booking.id));

  return {
    bookingIds: lines.map((line) => line.booking.id),
    session: {
      ...session,
      cart: (session.cart ?? []).filter((line) => !ids.has(line.booking.id)),
      bookings: earlyCheckIn
        ? session.bookings.map((booking) => (booking.id === bookingId ? { ...booking, earlyCheckIn } : booking))
        : session.bookings,
      serviceBookings: [...bookings, ...session.serviceBookings.filter((service) => !bookings.some((booked) => booked.id === service.id))],
    },
  };
}

export const cartAmountLabel = (amount: number) => formatPesoAmount(amount);
