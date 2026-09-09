export type ScreenGroup = 'Entry' | 'Pre-arrival' | 'Stay' | 'Account';

export type ScreenId =
  | 'sign-in'
  | 'verify-code'
  | 'connect-booking'
  | 'room-qr-landing'
  | 'wifi-landing'
  | 'identify'
  | 'lookup-fallback'
  | 'front-desk-assist'
  | 'no-booking'
  | 'booking-found'
  | 'create-account'
  | 'welcome-back'
  | 'stay-overview'
  | 'guest-details'
  | 'id-capture'
  | 'room-preferences'
  | 'additional-guests'
  | 'repeat-review'
  | 'rate-detail'
  | 'early-check-in'
  | 'insurance-offer'
  | 'prereg-complete'
  | 'prereg-queued'
  | 'wallet'
  | 'wallet-offline'
  | 'marketplace'
  | 'category-listing'
  | 'hotel-service'
  | 'vendor-service'
  | 'service-booking'
  | 'booking-confirmation'
  | 'booking-blocked'
  | 'my-bookings'
  | 'cancel-before-cutoff'
  | 'cancel-after-cutoff'
  | 'folio'
  | 'chat'
  | 'chat-after-hours'
  | 'room-qr-midstay'
  | 'profile'
  | 'stay-history';

export type PrototypeScreen = {
  id: ScreenId;
  number: number;
  group: ScreenGroup;
  title: string;
};

const screen = (number: number, group: ScreenGroup, id: ScreenId, title: string): PrototypeScreen => ({
  id,
  number,
  group,
  title,
});

export const SCREENS: PrototypeScreen[] = [
  screen(1, 'Entry', 'sign-in', 'Log in'),
  screen(2, 'Entry', 'create-account', 'Create your account'),
  screen(3, 'Entry', 'verify-code', 'Check your email'),
  screen(4, 'Entry', 'connect-booking', 'Add your booking'),
  screen(5, 'Entry', 'room-qr-landing', 'Room QR detected'),
  screen(6, 'Entry', 'wifi-landing', 'Hotel Wi-Fi'),
  screen(7, 'Entry', 'identify', 'Find your booking'),
  screen(8, 'Entry', 'lookup-fallback', 'Try another way'),
  screen(9, 'Entry', 'front-desk-assist', 'Front desk assist'),
  screen(10, 'Entry', 'no-booking', 'No booking found'),
  screen(11, 'Entry', 'booking-found', 'Booking found'),
  screen(12, 'Entry', 'welcome-back', 'Welcome back'),
  screen(13, 'Pre-arrival', 'stay-overview', 'Your stay'),
  screen(14, 'Pre-arrival', 'guest-details', 'Guest details'),
  screen(15, 'Pre-arrival', 'id-capture', 'ID or passport'),
  screen(16, 'Pre-arrival', 'room-preferences', 'Room preferences'),
  screen(17, 'Pre-arrival', 'additional-guests', 'Additional guests'),
  screen(18, 'Pre-arrival', 'repeat-review', 'Review your details'),
  screen(19, 'Pre-arrival', 'rate-detail', 'Room and rate'),
  screen(20, 'Pre-arrival', 'early-check-in', 'Early check-in'),
  screen(21, 'Pre-arrival', 'insurance-offer', 'Travel insurance'),
  screen(22, 'Pre-arrival', 'prereg-complete', 'Pre-registration complete'),
  screen(23, 'Pre-arrival', 'prereg-queued', 'Ready to send'),
  screen(24, 'Stay', 'wallet', 'Stay QR'),
  screen(25, 'Stay', 'wallet-offline', 'Stay QR offline'),
  screen(26, 'Stay', 'marketplace', 'Services'),
  screen(27, 'Stay', 'category-listing', 'Spa and massage'),
  screen(28, 'Stay', 'hotel-service', 'In-room dining'),
  screen(29, 'Stay', 'vendor-service', 'Hilom signature massage'),
  screen(30, 'Stay', 'service-booking', 'Choose a time'),
  screen(31, 'Stay', 'booking-confirmation', 'Service confirmed'),
  screen(32, 'Stay', 'booking-blocked', 'Connect to book'),
  screen(33, 'Stay', 'my-bookings', 'My bookings'),
  screen(34, 'Stay', 'cancel-before-cutoff', 'Cancel service'),
  screen(35, 'Stay', 'cancel-after-cutoff', 'Contact front desk'),
  screen(36, 'Stay', 'folio', 'Room charges'),
  screen(37, 'Stay', 'chat', 'Front desk chat'),
  screen(38, 'Stay', 'chat-after-hours', 'Chat after hours'),
  screen(39, 'Stay', 'room-qr-midstay', 'You are checked in'),
  screen(40, 'Account', 'profile', 'Profile and preferences'),
  screen(41, 'Account', 'stay-history', 'Stay history'),
];

export type BookingStatus = 'upcoming' | 'active' | 'completed';

export type Booking = {
  id: string;
  property: string;
  city: string;
  status: BookingStatus;
  checkIn: string;
  checkOut: string;
  roomType: string;
  roomNumber?: string;
  guestCount: number;
  source: string;
  preArrivalCompleted: number;
  preArrivalTotal: number;
  nextPreArrivalStep?: string;
  folioTotal?: string;
  stayQrAvailable: boolean;
};

export type ServiceBooking = {
  id: string;
  bookingId: string;
  title: string;
  scheduledFor: string;
  amount: string;
  status: 'confirmed' | 'cancelled' | 'completed';
};

/**
 * Authentication is a three-state affair rather than a boolean because the
 * one-time code screen is a real place the guest can sit, back out of, or
 * abandon. A boolean would make that screen indistinguishable from being in.
 */
export type AuthState = 'anonymous' | 'pending-verification' | 'authenticated';

/** Drives the "onboarding if new" branch. `none` is the signed-out shape. */
export type AccountStatus = 'none' | 'new' | 'returning';

export type AuthMethod = 'email-code' | 'apple' | 'google';

export type GuestSession = {
  guestName: string;
  email: string;
  bookings: Booking[];
  activeBookingId?: string;
  serviceBookings: ServiceBooking[];
  folioTotal: string;
  auth: AuthState;
  accountStatus: AccountStatus;
  authMethod?: AuthMethod;
};

export type HomeVariant =
  | 'active'
  | 'upcoming'
  | 'multiple-upcoming'
  | 'completed'
  | 'empty';

/**
 * The booking `identify` matches. Extracted so `connectBooking` and
 * `MOCK_SESSION` cannot drift into describing two different stays.
 */
export const UPCOMING_BOOKING_FIXTURE: Booking = {
  id: 'HEN-241109',
  property: 'The Henry Manila',
  city: 'Manila',
  status: 'upcoming',
  checkIn: '2026-11-09',
  checkOut: '2026-11-12',
  roomType: 'King room',
  guestCount: 2,
  source: 'Agoda',
  preArrivalCompleted: 2,
  preArrivalTotal: 5,
  nextPreArrivalStep: 'Add your ID details',
  stayQrAvailable: false,
};

/** The signed-out default: what the app renders before anyone identifies. */
export const ANONYMOUS_SESSION: GuestSession = {
  guestName: '',
  email: '',
  bookings: [],
  serviceBookings: [],
  folioTotal: '₱0',
  auth: 'anonymous',
  accountStatus: 'none',
};

export const MOCK_SESSION: GuestSession = {
  guestName: 'Ana Santos',
  email: 'ana@example.com',
  auth: 'authenticated',
  accountStatus: 'returning',
  authMethod: 'email-code',
  bookings: [
    UPCOMING_BOOKING_FIXTURE,
    {
      id: 'HEN-CEBU-240615',
      property: 'The Henry Cebu',
      city: 'Cebu',
      status: 'completed',
      checkIn: '2026-06-15',
      checkOut: '2026-06-18',
      roomType: 'Garden suite',
      roomNumber: '208',
      guestCount: 2,
      source: 'Direct booking',
      preArrivalCompleted: 5,
      preArrivalTotal: 5,
      stayQrAvailable: false,
    },
  ],
  serviceBookings: [],
  folioTotal: '₱0',
};

/**
 * Creating an account and signing in both land on the code screen. They differ
 * only in what they carry: a new account has no stays, a returning one arrives
 * with everything already on file.
 */
export function createAccountSession(
  guestName: string,
  email: string,
  method: AuthMethod,
): GuestSession {
  return {
    ...ANONYMOUS_SESSION,
    guestName,
    email,
    auth: 'pending-verification',
    accountStatus: 'new',
    authMethod: method,
  };
}

export function signInSession(method: AuthMethod): GuestSession {
  return {
    ...MOCK_SESSION,
    auth: 'pending-verification',
    accountStatus: 'returning',
    authMethod: method,
  };
}

/** Only a pending session can be promoted; every other state passes through. */
export function verifyPendingSession(session: GuestSession): GuestSession {
  if (session.auth !== 'pending-verification') return session;
  return { ...session, auth: 'authenticated' };
}

export function signOutSession(): GuestSession {
  return { ...ANONYMOUS_SESSION };
}

/** Idempotent: connecting an already-connected booking is not a second stay. */
export function connectBooking(session: GuestSession): GuestSession {
  if (session.bookings.some((booking) => booking.id === UPCOMING_BOOKING_FIXTURE.id)) {
    return session;
  }
  return { ...session, bookings: [...session.bookings, UPCOMING_BOOKING_FIXTURE] };
}

/**
 * Where a guest lands the moment their code is accepted. Ordered and total, so
 * the component never has to guess. A returning guest gets the short
 * `welcome-back` review; a new one goes through pre-arrival properly.
 */
export function getPostAuthScreen(session: GuestSession): ScreenId {
  const booking = getPrimaryBooking(session.bookings, session.activeBookingId);
  if (!booking) return 'connect-booking';

  const preArrivalIncomplete = booking.preArrivalCompleted < booking.preArrivalTotal;
  if (!preArrivalIncomplete) return 'stay-overview';

  return session.accountStatus === 'returning' ? 'welcome-back' : 'guest-details';
}

export function getPrimaryBooking(
  bookings: Booking[],
  activeBookingId?: string,
): Booking | undefined {
  const selected = activeBookingId
    ? bookings.find((booking) => booking.id === activeBookingId)
    : undefined;
  if (selected) return selected;

  const active = bookings.find((booking) => booking.status === 'active');
  if (active) return active;

  const upcoming = bookings
    .filter((booking) => booking.status === 'upcoming')
    .sort((a, b) => a.checkIn.localeCompare(b.checkIn));
  if (upcoming[0]) return upcoming[0];

  return bookings
    .filter((booking) => booking.status === 'completed')
    .sort((a, b) => b.checkIn.localeCompare(a.checkIn))[0];
}

export function getHomeVariant(
  bookings: Booking[],
  activeBookingId?: string,
): HomeVariant {
  const selectedBooking = activeBookingId
    ? bookings.find((booking) => booking.id === activeBookingId)
    : undefined;
  if (
    selectedBooking?.status === 'active' ||
    bookings.some((booking) => booking.status === 'active')
  ) {
    return 'active';
  }

  const upcomingCount = bookings.filter(
    (booking) => booking.status === 'upcoming',
  ).length;
  if (upcomingCount > 1) return 'multiple-upcoming';
  if (upcomingCount === 1) return 'upcoming';
  if (bookings.some((booking) => booking.status === 'completed')) return 'completed';
  return 'empty';
}

export type ScenarioId = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H' | 'I';

export type Scenario = {
  id: ScenarioId;
  title: string;
  description: string;
  start: ScreenId;
  offline?: boolean;
};

export const SCENARIOS: Scenario[] = [
  { id: 'A', title: 'First-timer, pre-arrival', description: 'Confirmation link to Stay QR', start: 'identify' },
  { id: 'B', title: 'Repeat guest', description: 'Recognized and confirmed in under 30 seconds', start: 'welcome-back' },
  { id: 'C', title: 'Arrival without signal', description: 'Cached Stay QR at the desk', start: 'wallet-offline', offline: true },
  { id: 'D', title: 'Room QR, mid-stay', description: 'Skip pre-arrival and order dining', start: 'room-qr-midstay' },
  { id: 'E', title: 'Hotel Wi-Fi arrival', description: 'Identify and attach the booking', start: 'wifi-landing' },
  { id: 'F', title: 'Booking lookup fails', description: 'Three-tier fallback to human help', start: 'identify' },
  { id: 'G', title: 'Spa booking and cancellation', description: 'Third-party service charged to the room', start: 'marketplace' },
  { id: 'H', title: 'Request towels', description: 'Structured request in front desk chat', start: 'chat' },
  { id: 'I', title: 'Offline booking attempt', description: 'Capacity is blocked; chat queues', start: 'vendor-service', offline: true },
];

export type OfflineCapability = 'wallet' | 'cached-stay' | 'chat' | 'pre-registration' | 'preferences' | 'service-booking' | 'payment' | 'live-rates' | 'authentication';
export type OfflineAction = 'available' | 'queued' | 'blocked';

export function getOfflineAction(capability: OfflineCapability): OfflineAction {
  if (capability === 'wallet' || capability === 'cached-stay') return 'available';
  if (capability === 'chat' || capability === 'pre-registration' || capability === 'preferences') return 'queued';
  return 'blocked';
}

export type CancellationState = 'self-service' | 'front-desk';

export function getCancellationState(hoursUntilService: number, cutoffHours: number): CancellationState {
  return hoursUntilService >= cutoffHours ? 'self-service' : 'front-desk';
}

export const SERVICES = [
  { id: 'dining', name: 'In-room dining', category: 'Dining', operator: 'Hotel operated', price: 'From ₱450', cutoff: '2-hour cancellation cutoff', tone: 'sand' },
  { id: 'spa', name: 'Hilom signature massage', category: 'Spa & massage', operator: 'Third-party on property', price: '₱2,400', cutoff: '24-hour cancellation cutoff', tone: 'sage' },
  { id: 'restaurant', name: 'Apartment 1B', category: 'Restaurant & bar', operator: 'Hotel operated', price: 'From ₱600', cutoff: '2-hour cancellation cutoff', tone: 'clay' },
  { id: 'transfer', name: 'Airport transfer', category: 'Transfers', operator: 'Hotel arranged', price: '₱1,200', cutoff: '2-hour cancellation cutoff', tone: 'blue' },
  { id: 'tour', name: 'Island day tour', category: 'Activities & tours', operator: 'Third-party on property', price: '₱3,800', cutoff: '24-hour cancellation cutoff', tone: 'sun' },
  { id: 'rental', name: 'City bicycle', category: 'Vehicle & bike rental', operator: 'Hotel operated', price: '₱350 / day', cutoff: '2-hour cancellation cutoff', tone: 'ink' },
] as const;

export const screenTitle = (id: ScreenId) => SCREENS.find((item) => item.id === id)?.title ?? 'Guest app';
