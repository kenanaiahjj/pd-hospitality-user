import type { ScreenId } from './prototype-model';

/*
  Small shared pieces the guest app's screen modules all use: the screen id
  type and the early check-in request's fixed terms.
*/

export type ActiveScreen = ScreenId | 'entry-hub';

/** The one early check-in slot the prototype offers. */
export const EARLY_CHECK_IN = { time: '11:00 AM', fee: '₱1,500' };

export const earlyCheckInBookingId = (bookingId: string) => `service-early-check-in-${bookingId}`;
