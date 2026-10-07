import type { BookingStatus, CardPayState, PayState, RoomPayState } from './types';

/*
  The only moves a booking or a payment may make: the arrows in diagrams H and
  I. The engine refuses anything else, and the invariant check reads the same
  tables to prove no other move was ever made.
*/

export const BOOKING_TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  'needs-approval': ['requested', 'confirmed', 'pay-or-cancel', 'withdrawn', 'cancelled'],
  'pay-or-cancel': ['requested', 'awaiting-payment', 'withdrawn', 'lapsed', 'cancelled'],
  requested: ['confirmed', 'awaiting-payment', 'declined', 'lapsed', 'withdrawn', 'cancelled'],
  'awaiting-payment': ['confirmed', 'payment-expired', 'withdrawn', 'cancelled'],
  confirmed: ['in-progress', 'ready', 'cancelled', 'no-show'],
  reserved: ['seated', 'no-show', 'cancelled'],
  'in-progress': ['completed'],
  ready: ['collected', 'cancelled'],
  lapsed: ['requested'],
  completed: [],
  collected: [],
  seated: [],
  withdrawn: [],
  declined: [],
  'payment-expired': [],
  cancelled: [],
  'no-show': [],
};

/** Where a booking may begin. */
export const BOOKING_INITIAL: BookingStatus[] = ['requested', 'needs-approval', 'confirmed', 'awaiting-payment', 'reserved'];

export const ROOM_TRANSITIONS: Record<RoomPayState, RoomPayState[]> = {
  pending: ['posting', 'posted', 'voided', 'failed'],
  posting: ['posted', 'pending', 'failed', 'voided'],
  posted: ['settled', 'reversed'],
  failed: ['posted', 'voided', 'pending'],
  settled: ['refund-due'],
  'refund-due': ['reversed'],
  voided: [],
  reversed: [],
};

export const CARD_TRANSITIONS: Record<CardPayState, CardPayState[]> = {
  awaiting: ['paid', 'expired'],
  paid: ['refund-pending'],
  expired: ['paid'],
  'refund-pending': ['refunded', 'refund-failed'],
  'refund-failed': ['refunded'],
  refunded: [],
};

export const ROOM_STATES: PayState[] = ['pending', 'posting', 'posted', 'settled', 'voided', 'reversed', 'failed', 'refund-due'];

export const paymentMoveAllowed = (mode: 'room' | 'card', from: string | null, to: string): boolean => {
  if (from === null) return mode === 'room' ? to === 'pending' : to === 'awaiting' || to === 'paid';
  const table = (mode === 'room' ? ROOM_TRANSITIONS : CARD_TRANSITIONS) as Record<string, string[]>;
  return Boolean(table[from]?.includes(to));
};

export const bookingMoveAllowed = (from: BookingStatus | null, to: BookingStatus): boolean =>
  from === null ? BOOKING_INITIAL.includes(to) : BOOKING_TRANSITIONS[from].includes(to);

/** Does a booking in this status hold part of a slot or stock line? */
export const holdKind = (status: BookingStatus): 'held' | 'confirmed' | null => {
  if (['needs-approval', 'pay-or-cancel', 'requested', 'awaiting-payment'].includes(status)) return 'held';
  if (['confirmed', 'reserved', 'in-progress', 'ready'].includes(status)) return 'confirmed';
  return null;
};

export const EXIT_STATUSES: BookingStatus[] = ['withdrawn', 'declined', 'lapsed', 'payment-expired', 'cancelled', 'no-show'];
export const DONE_STATUSES: BookingStatus[] = ['completed', 'collected', 'seated'];
