export type ScreenGroup = 'Entry' | 'Pre-arrival' | 'Stay' | 'Travel' | 'Account';

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
  | 'arrival-handoff'
  | 'prereg-complete'
  | 'prereg-queued'
  | 'marketplace'
  | 'category-listing'
  | 'hotel-service'
  | 'vendor-service'
  | 'restaurant-menu'
  | 'restaurant-cart'
  | 'dining-order-confirmation'
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
  | 'stay-history'
  | 'travel'
  | 'travel-search'
  | 'travel-checkout'
  | 'travel-confirmation';

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
  screen(16, 'Account', 'room-preferences', 'Room preferences'),
  screen(17, 'Pre-arrival', 'additional-guests', 'Additional guests'),
  screen(18, 'Pre-arrival', 'repeat-review', 'Review your details'),
  screen(19, 'Pre-arrival', 'rate-detail', 'Room and rate'),
  screen(20, 'Pre-arrival', 'early-check-in', 'Early check-in'),
  screen(21, 'Pre-arrival', 'arrival-handoff', 'Arrival handoff'),
  screen(22, 'Pre-arrival', 'prereg-complete', 'Pre-registration complete'),
  screen(23, 'Pre-arrival', 'prereg-queued', 'Ready to send'),
  screen(24, 'Stay', 'marketplace', 'Bookings Hub'),
  screen(25, 'Stay', 'category-listing', 'Explore services'),
  screen(26, 'Stay', 'hotel-service', 'In-room dining'),
  screen(27, 'Stay', 'vendor-service', 'Hilom signature massage'),
  screen(28, 'Stay', 'restaurant-menu', 'Menu & Dining'),
  screen(29, 'Stay', 'service-booking', 'Choose a time'),
  screen(30, 'Stay', 'booking-confirmation', 'Service confirmed'),
  screen(31, 'Stay', 'booking-blocked', 'Connect to book'),
  screen(32, 'Stay', 'my-bookings', 'My bookings'),
  screen(33, 'Stay', 'cancel-before-cutoff', 'Cancel service'),
  screen(34, 'Stay', 'cancel-after-cutoff', 'Contact front desk'),
  screen(35, 'Stay', 'folio', 'Room charges'),
  screen(36, 'Stay', 'chat', 'Front desk chat'),
  screen(37, 'Stay', 'chat-after-hours', 'Chat after hours'),
  screen(38, 'Stay', 'room-qr-midstay', 'You are checked in'),
  screen(39, 'Account', 'profile', 'Guest profile'),
  screen(40, 'Account', 'stay-history', 'Stay history'),
  screen(41, 'Stay', 'restaurant-cart', 'Review dining order'),
  screen(42, 'Stay', 'dining-order-confirmation', 'Dining order confirmed'),
  screen(43, 'Travel', 'travel', 'Travel'),
  screen(44, 'Travel', 'travel-search', 'Travel search'),
  screen(45, 'Travel', 'travel-checkout', 'Travel checkout'),
  screen(46, 'Travel', 'travel-confirmation', 'Travel confirmed'),
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
  /**
   * The single home for the room number. Known from `assigned` onward; the
   * assignment state below describes it rather than restating it, so the two
   * cannot drift.
   */
  roomNumber?: string;
  /** Defaults are derived in `describeRoomAssignment` -- see its doc. */
  roomAssignment?: RoomAssignmentState;
  /** When housekeeping released the room. Only meaningful once `ready`. */
  roomReadyAt?: string;
  /**
   * Whether this property's PMS reports housekeeping status at all. Legacy
   * on-premise systems in the estate can report an allocated room but nothing
   * about whether it is clean, so those stays sit in `assigned` and never
   * advance. Defaults to true; set false and the app stops promising a
   * readiness moment that will never arrive.
   */
  reportsRoomReadiness?: boolean;
  /** Preferences the property could honour, echoed back after allocation. */
  honouredPreferences?: string[];
  guestCount: number;
  source: string;
  preArrivalCompleted: number;
  preArrivalTotal: number;
  nextPreArrivalStep?: string;
  folioTotal?: string;
};

/**
 * How far the property's PMS has got with allocating a specific room.
 *
 * Cabana never assigns a room: allocation is the property's operation, run
 * against its own inventory. These states only reflect what the middleware can
 * read back.
 */
export type RoomAssignmentState = 'pending' | 'assigned' | 'ready';

export type DiningOrderItem = {
  id: string;
  name: string;
  unitPrice: string;
  quantity: number;
};

export type DiningFulfillment =
  | { method: 'delivery'; timing: 'asap' | 'scheduled'; scheduledFor: string }
  | { method: 'pickup'; timing: 'scheduled'; scheduledFor: string };

export type DiningOrderDetails = {
  venueId: string;
  venueName: string;
  items: DiningOrderItem[];
  fulfillment: DiningFulfillment;
};

export type ServiceBooking = {
  id: string;
  bookingId: string;
  title: string;
  scheduledFor: string;
  amount: string;
  status: 'confirmed' | 'cancelled' | 'completed';
  diningOrder?: DiningOrderDetails;
};

/**
 * Authentication is a three-state affair rather than a boolean because the
 * one-time code screen is a real place the guest can sit, back out of, or
 * abandon. A boolean would make that screen indistinguishable from being in.
 */
export type AuthState = 'anonymous' | 'pending-verification' | 'authenticated';

/** Drives the "onboarding if new" branch. `none` is the signed-out shape. */
export type AccountStatus = 'none' | 'new' | 'returning';

export type AuthMethod = 'password' | 'email-code' | 'apple' | 'google';

export type RoomPreferences = {
  floor: string;
  bed: string;
  accessibility: string[];
};

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
  roomPreferences: RoomPreferences;
  /**
   * Travel is not stay-scoped the way `serviceBookings` are -- a ferry between
   * two properties belongs to the trip, not to either stay -- so it has no
   * `bookingId` and lives in its own list.
   */
  travelBookings: TravelBooking[];
  /**
   * Companion names, persisted from the additional-guests step. Travel
   * checkout needs real traveller names; inventing them there would be a lie,
   * and Philippine carriers match passenger names against government ID.
   */
  additionalGuests: string[];
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
  preArrivalTotal: 4,
  nextPreArrivalStep: 'Add who else is staying',
  roomAssignment: 'pending',
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
  roomPreferences: {
    floor: 'Higher floor',
    bed: 'King bed',
    accessibility: [],
  },
  travelBookings: [],
  additionalGuests: [],
};

export const MOCK_SESSION: GuestSession = {
  guestName: 'Ana Santos',
  email: 'ana@example.com',
  auth: 'authenticated',
  accountStatus: 'returning',
  authMethod: 'email-code',
  roomPreferences: {
    floor: 'Higher floor',
    bed: 'King bed',
    accessibility: [],
  },
  travelBookings: [],
  additionalGuests: ['Marco Santos'],
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
      preArrivalCompleted: 4,
      preArrivalTotal: 4,
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
  method: AuthMethod = 'password',
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

export function signInSession(method: AuthMethod = 'password'): GuestSession {
  return {
    ...MOCK_SESSION,
    auth: 'pending-verification',
    accountStatus: 'returning',
    authMethod: method,
  };
}

export function createAccountWithPassword(
  guestName: string,
  email: string,
): GuestSession {
  return {
    ...ANONYMOUS_SESSION,
    guestName,
    email,
    auth: 'authenticated',
    accountStatus: 'new',
    authMethod: 'password',
  };
}

export function signInWithPassword(email?: string): GuestSession {
  return {
    ...MOCK_SESSION,
    ...(email ? { email } : {}),
    auth: 'authenticated',
    accountStatus: 'returning',
    authMethod: 'password',
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

export type ScenarioId = 'A' | 'B' | 'D' | 'E' | 'F' | 'G' | 'H' | 'I';

export type Scenario = {
  id: ScenarioId;
  title: string;
  description: string;
  start: ScreenId;
  offline?: boolean;
};

export const SCENARIOS: Scenario[] = [
  { id: 'A', title: 'First-timer, pre-arrival', description: 'Confirmation link to pre-registration', start: 'identify' },
  { id: 'B', title: 'Repeat guest', description: 'Recognized and confirmed in under 30 seconds', start: 'welcome-back' },
  { id: 'D', title: 'Room QR, mid-stay', description: 'Skip pre-arrival and order dining', start: 'room-qr-midstay' },
  { id: 'E', title: 'Hotel Wi-Fi arrival', description: 'Identify and attach the booking', start: 'wifi-landing' },
  { id: 'F', title: 'Booking lookup fails', description: 'Three-tier fallback to human help', start: 'identify' },
  { id: 'G', title: 'Spa booking and cancellation', description: 'Third-party service charged to the room', start: 'marketplace' },
  { id: 'H', title: 'Request towels', description: 'Structured request in front desk chat', start: 'chat' },
  { id: 'I', title: 'Offline booking attempt', description: 'Capacity is blocked; chat queues', start: 'vendor-service', offline: true },
];

export type OfflineCapability = 'cached-stay' | 'chat' | 'pre-registration' | 'preferences' | 'service-booking' | 'payment' | 'live-rates' | 'authentication';
export type OfflineAction = 'available' | 'queued' | 'blocked';

export function getOfflineAction(capability: OfflineCapability): OfflineAction {
  if (capability === 'cached-stay') return 'available';
  if (capability === 'chat' || capability === 'pre-registration' || capability === 'preferences') return 'queued';
  return 'blocked';
}

/** Standard check-in across the estate. */
export const CHECK_IN_FROM = '3:00 PM';

export type RoomAssignmentView = {
  state: RoomAssignmentState;
  roomNumber?: string;
  /** The one line a card leads with. */
  headline: string;
  /** Supporting detail. Never speculative -- '' when there is nothing honest. */
  detail: string;
  /** True only when the guest can walk up to the room now. */
  canGoUp: boolean;
};

/**
 * Derives the assignment state and the copy for it in one place, so the home
 * card, the stay screen and the timeline cannot describe the same room
 * differently.
 *
 * The state is inferred when a booking does not carry one, which keeps every
 * existing fixture valid: a stay the guest is already in reads as `ready`, a
 * booking that has a number reads as `assigned`, and everything else is
 * `pending`.
 */
export function describeRoomAssignment(booking: Booking): RoomAssignmentView {
  const inferred: RoomAssignmentState = booking.roomAssignment
    ?? (booking.roomNumber ? (booking.status === 'active' ? 'ready' : 'assigned') : 'pending');
  const reportsReadiness = booking.reportsRoomReadiness ?? true;
  const room = booking.roomNumber;

  if (inferred === 'pending' || !room) {
    return {
      state: 'pending',
      headline: 'Room assigned on arrival day',
      detail: `The hotel allocates rooms from its own inventory. Yours appears here as soon as it does. Check-in from ${CHECK_IN_FROM}.`,
      canGoUp: false,
    };
  }

  if (inferred === 'assigned') {
    return {
      state: 'assigned',
      roomNumber: room,
      headline: `Room ${room} is yours`,
      detail: reportsReadiness
        ? `Housekeeping releases it before check-in, and we'll tell you the moment it is ready.`
        : `Collect your key at the desk from ${CHECK_IN_FROM}. This property does not report room readiness to the app.`,
      canGoUp: false,
    };
  }

  return {
    state: 'ready',
    roomNumber: room,
    headline: `Room ${room} is ready`,
    detail: booking.roomReadyAt ? `Released at ${booking.roomReadyAt}. Go straight up.` : 'Go straight up.',
    canGoUp: true,
  };
}

/** Applies a PMS room-release event only when this booking can report one. */
export function markRoomReady(booking: Booking, roomReadyAt: string): Booking {
  const assignment = describeRoomAssignment(booking);

  if (
    booking.status !== 'upcoming'
    || assignment.state !== 'assigned'
    || !booking.roomNumber
    || booking.reportsRoomReadiness === false
  ) {
    return booking;
  }

  return {
    ...booking,
    roomAssignment: 'ready',
    roomReadyAt,
  };
}

export type CancellationState = 'self-service' | 'front-desk';

export function getCancellationState(hoursUntilService: number, cutoffHours: number): CancellationState {
  return hoursUntilService >= cutoffHours ? 'self-service' : 'front-desk';
}

export type MiniAppCategoryId = 'dining' | 'spa' | 'entertainment' | 'services';

export type MiniAppCategory = {
  id: MiniAppCategoryId;
  /** Full name. Heads the category listing screen. */
  title: string;
  /**
   * One word for the home launcher row, where four labels share a phone width.
   * `title` would wrap to three lines there.
   */
  shortTitle: string;
  subtitle: string;
  badge: string;
  tone: 'sand' | 'sage' | 'sun' | 'blue';
};

export const MINI_APP_CATEGORIES: MiniAppCategory[] = [
  {
    id: 'dining',
    title: 'Food & Drink',
    shortTitle: 'Dining',
    subtitle: 'Restaurants, in-room dining, bars',
    badge: '3 venues',
    tone: 'sand',
  },
  {
    id: 'spa',
    title: 'Spa & Wellness',
    shortTitle: 'Spa',
    subtitle: 'Hilom massage, therapies & scrubs',
    badge: 'On property',
    tone: 'sage',
  },
  {
    id: 'entertainment',
    title: 'Entertainment & Tours',
    shortTitle: 'Tours',
    subtitle: 'Day tours, live music & walks',
    badge: 'Curated',
    tone: 'sun',
  },
  {
    id: 'services',
    title: 'Hotel Services',
    shortTitle: 'Services',
    subtitle: 'Transfers, rentals & amenities',
    badge: 'Front desk',
    tone: 'blue',
  },
];

/* --------------------------------------------------------------------------
   Travel: the bookings that move a guest between places.

   Kept apart from MINI_APP_CATEGORIES on purpose. Those are on-property --
   sourced from the hotel through the PMS middleware, consumed during one stay,
   settled on that stay's folio. These come from airlines, ferry operators and
   transport vendors, happen between stays, and cannot land on a room folio.
   See docs/superpowers/specs/2026-09-09-travel-booking-destination-design.md.
   -------------------------------------------------------------------------- */

export type TravelCategoryId = 'flights' | 'ferries' | 'transfers' | 'insurance';

export type TravelOption = {
  id: string;
  /** Airline, ferry line, transport vendor or insurer. */
  operator: string;
  /** The headline of the option: times, vehicle class, or cover tier. */
  detail: string;
  /** Supporting specifics -- flight number, hull, capacity, excess. */
  meta: string;
  price: string;
};

/**
 * A journey has two endpoints; insurance does not. `route: null` is what keeps
 * the shared search screen from inventing a from/to for a category that has
 * none.
 */
export type TravelRoute = {
  fromLabel: string;
  toLabel: string;
  places: string[];
  defaultFrom: string;
  defaultTo: string;
};

export type TravelCategory = {
  id: TravelCategoryId;
  title: string;
  /** Declared, not derived: stripping the "s" off "Ferries" gives "ferrie". */
  singular: string;
  subtitle: string;
  /** What this category calls the people travelling. */
  partyLabel: string;
  route: TravelRoute | null;
  options: TravelOption[];
};

const PH_AIRPORTS = [
  'Manila (MNL)',
  'Cebu (CEB)',
  'Davao (DVO)',
  'Cagayan de Oro (CGY)',
  'Dumaguete (DGT)',
  'Puerto Princesa (PPS)',
];

const PH_PORTS = [
  'Manila North Harbor',
  'Batangas',
  'Cebu Pier 1',
  'Tagbilaran',
  'Dumaguete',
  'Ozamiz',
];

const TRANSFER_POINTS = [
  'The Henry Manila',
  'The Henry Cebu',
  'The Henry Dumaguete',
  'Manila (MNL) Terminal 3',
  'Cebu (CEB) Terminal 2',
];

export const TRAVEL_CATEGORIES: TravelCategory[] = [
  {
    id: 'flights',
    title: 'Flights',
    singular: 'flight',
    subtitle: 'Domestic and inter-island',
    partyLabel: 'Passengers',
    route: {
      fromLabel: 'From',
      toLabel: 'To',
      places: PH_AIRPORTS,
      defaultFrom: 'Manila (MNL)',
      defaultTo: 'Cagayan de Oro (CGY)',
    },
    options: [
      { id: 'fl-1', operator: 'Philippine Airlines', detail: '05:50 → 07:35', meta: 'PR 2971 · Direct · Airbus A321', price: '₱4,780' },
      { id: 'fl-2', operator: 'Cebu Pacific', detail: '09:15 → 11:05', meta: '5J 921 · Direct · Airbus A320', price: '₱3,940' },
      { id: 'fl-3', operator: 'AirAsia Philippines', detail: '13:40 → 15:30', meta: 'Z2 837 · Direct · Airbus A320', price: '₱3,620' },
      { id: 'fl-4', operator: 'Philippine Airlines', detail: '18:05 → 19:55', meta: 'PR 2975 · Direct · Airbus A321', price: '₱5,310' },
    ],
  },
  {
    id: 'ferries',
    title: 'Ferries',
    singular: 'ferry',
    subtitle: 'Fast craft and RoRo sailings',
    partyLabel: 'Passengers',
    route: {
      fromLabel: 'Departure port',
      toLabel: 'Arrival port',
      places: PH_PORTS,
      defaultFrom: 'Cebu Pier 1',
      defaultTo: 'Tagbilaran',
    },
    options: [
      { id: 'fe-1', operator: '2GO Travel', detail: '06:00 → 08:00', meta: 'Fast craft · Tourist class', price: '₱1,250' },
      { id: 'fe-2', operator: 'OceanJet', detail: '08:20 → 10:10', meta: 'Fast craft · Business class', price: '₱1,690' },
      { id: 'fe-3', operator: 'Lite Ferries', detail: '12:00 → 15:30', meta: 'RoRo · Aircon berth', price: '₱980' },
      { id: 'fe-4', operator: 'OceanJet', detail: '16:40 → 18:30', meta: 'Fast craft · Tourist class', price: '₱1,250' },
    ],
  },
  {
    id: 'transfers',
    title: 'Transfers',
    singular: 'transfer',
    subtitle: 'Airports and hotel to hotel',
    partyLabel: 'Passengers',
    route: {
      fromLabel: 'Pick-up',
      toLabel: 'Drop-off',
      places: TRANSFER_POINTS,
      defaultFrom: 'The Henry Manila',
      defaultTo: 'Manila (MNL) Terminal 3',
    },
    options: [
      { id: 'tr-1', operator: 'Henry Fleet', detail: 'Sedan', meta: 'Up to 3 · 2 bags · Meet and greet', price: '₱1,450' },
      { id: 'tr-2', operator: 'Henry Fleet', detail: 'Premium van', meta: 'Up to 6 · 6 bags · Meet and greet', price: '₱2,300' },
      { id: 'tr-3', operator: 'Island Coach', detail: 'Shared shuttle', meta: 'Per seat · Departs hourly', price: '₱480' },
      { id: 'tr-4', operator: 'Henry Fleet', detail: 'Coaster', meta: 'Up to 18 · Group transfer', price: '₱5,900' },
    ],
  },
  {
    id: 'insurance',
    title: 'Travel insurance',
    singular: 'policy',
    subtitle: 'Cover for the whole trip',
    partyLabel: 'Travellers',
    route: null,
    options: [
      { id: 'in-1', operator: 'Pioneer', detail: 'Domestic Essential', meta: 'Medical ₱250,000 · Baggage ₱10,000', price: '₱390' },
      { id: 'in-2', operator: 'Pioneer', detail: 'Domestic Plus', meta: 'Medical ₱500,000 · Trip cancellation', price: '₱720' },
      { id: 'in-3', operator: 'Malayan', detail: 'Island Hopper', meta: 'Adds watercraft and diving cover', price: '₱1,150' },
    ],
  },
];

/**
 * A booked leg. No `bookingId`: travel spans stays, so tying it to one would
 * hide a ferry between two properties from both of them.
 */
export type TravelBooking = {
  id: string;
  reference: string;
  categoryId: TravelCategoryId;
  operator: string;
  detail: string;
  meta: string;
  /** "Manila (MNL) → Cagayan de Oro (CGY)", or null where there is no journey. */
  route: string | null;
  date: string;
  travellers: number;
  amount: string;
  status: 'confirmed' | 'cancelled' | 'completed';
};

/**
 * Per-traveller booking fee. Real carriers vary this by fare class and
 * channel; a single rate keeps the prototype honest that a fee exists without
 * pretending to model fare rules it does not have.
 */
export const TRAVEL_FEE_PER_TRAVELLER = 210;

export type TravelQuote = {
  fareEach: string;
  travellers: number;
  fareTotal: string;
  fees: string;
  total: string;
};

export function quoteTravel(option: TravelOption, travellers: number): TravelQuote {
  const each = parsePesoAmount(option.price);
  const fareTotal = each * travellers;
  const fees = TRAVEL_FEE_PER_TRAVELLER * travellers;
  return {
    fareEach: formatPesoAmount(each),
    travellers,
    fareTotal: formatPesoAmount(fareTotal),
    fees: formatPesoAmount(fees),
    total: formatPesoAmount(fareTotal + fees),
  };
}

/**
 * Books a leg and returns the next session. Travel is paid to the operator at
 * booking, so unlike a service booking this never touches `folioTotal` -- a
 * flight is not the hotel's to bill, and the guest may book it when no folio
 * is even open.
 */
export function bookTravel(
  session: GuestSession,
  input: {
    category: TravelCategory;
    option: TravelOption;
    travellers: number;
    route: string | null;
    date: string;
  },
): GuestSession {
  const sequence = session.travelBookings.length + 1;
  const booking: TravelBooking = {
    id: `travel-${input.option.id}-${sequence}`,
    reference: `CBN-${input.option.id.toUpperCase().replace('-', '')}-${1000 + sequence}`,
    categoryId: input.category.id,
    operator: input.option.operator,
    detail: input.option.detail,
    meta: input.option.meta,
    route: input.route,
    date: input.date,
    travellers: input.travellers,
    amount: quoteTravel(input.option, input.travellers).total,
    status: 'confirmed',
  };
  return { ...session, travelBookings: [...session.travelBookings, booking] };
}

export function getTravelCategory(id: TravelCategoryId): TravelCategory {
  const found = TRAVEL_CATEGORIES.find((category) => category.id === id);
  if (!found) throw new Error(`Unknown travel category: ${id}`);
  return found;
}

export type MenuItemCategory = 'all' | 'starters' | 'mains' | 'desserts' | 'drinks';

export type MenuItem = {
  id: string;
  name: string;
  description: string;
  price: string;
  category: 'starters' | 'mains' | 'desserts' | 'drinks';
  tag?: string;
};

export const parsePesoAmount = (amount: string) => Number(amount.replace(/[^\d]/g, '')) || 0;

export const formatPesoAmount = (amount: number) => `₱${amount.toLocaleString('en-US')}`;

export function getVenueCartSummary(menu: MenuItem[], quantities: Record<string, number>) {
  const items = menu.flatMap((item) => {
    const quantity = Math.max(0, quantities[item.id] ?? 0);
    return quantity > 0
      ? [{ id: item.id, name: item.name, unitPrice: item.price, quantity }]
      : [];
  });
  const itemCount = items.reduce((total, item) => total + item.quantity, 0);
  const total = items.reduce((sum, item) => sum + parsePesoAmount(item.unitPrice) * item.quantity, 0);

  return { items, itemCount, total, formattedTotal: formatPesoAmount(total) };
}

export type RestaurantVenue = {
  id: string;
  name: string;
  category: string;
  operator: string;
  priceRange: string;
  hours: string;
  location: string;
  description: string;
  cutoff: string;
  tone: string;
  menu: MenuItem[];
};

export const RESTAURANTS: RestaurantVenue[] = [
  {
    id: 'apartment-1b',
    name: 'Apartment 1B',
    category: 'Restaurant & Bar',
    operator: 'Hotel operated',
    priceRange: 'From ₱550',
    hours: '6:30 AM – 11:00 PM',
    location: 'Ground floor courtyard',
    description: 'Gourmet comfort food, artisan breakfast, and hand-crafted cocktails in a lush garden setting.',
    cutoff: 'Table reservation or walk-in',
    tone: 'clay',
    menu: [
      {
        id: 'a1b-calamari',
        name: 'Crispy Calamari',
        description: 'Crisp hand-cut squid, spiced sea salt, zesty calamansi garlic aioli.',
        price: '₱480',
        category: 'starters',
        tag: 'Popular',
      },
      {
        id: 'a1b-ribeye',
        name: 'Grilled Angus Ribeye',
        description: '300g Australian Angus ribeye, truffle butter, roasted garlic mashed potato.',
        price: '₱1,850',
        category: 'mains',
        tag: 'Chef’s Special',
      },
      {
        id: 'a1b-1',
        name: 'Truffle Parmesan Fries',
        description: 'Crisp hand-cut potatoes, white truffle oil, shaved 24-month parmesan, garlic aioli.',
        price: '₱380',
        category: 'starters',
        tag: 'Popular',
      },
      {
        id: 'a1b-2',
        name: 'Classic Caesar Salad',
        description: 'Romaine hearts, double-smoked bacon lardons, sourdough croutons, house dressing.',
        price: '₱440',
        category: 'starters',
      },
      {
        id: 'a1b-3',
        name: 'Wild Mushroom Bisque',
        description: 'Slow-simmered forest mushrooms, herb croutons, white truffle foam.',
        price: '₱360',
        category: 'starters',
        tag: 'Vegetarian',
      },
      {
        id: 'a1b-4',
        name: 'Henry Wagyu Burger',
        description: 'Custom brioche bun, 180g Australian wagyu patty, aged cheddar, tomato relish, fries.',
        price: '₱720',
        category: 'mains',
        tag: 'Chef’s Special',
      },
      {
        id: 'a1b-5',
        name: 'Crispy Pork Belly Adobo',
        description: 'Twice-cooked pork belly, sweet garlic soy reduction, pickled quail eggs, jasmine rice.',
        price: '₱650',
        category: 'mains',
        tag: 'Heritage',
      },
      {
        id: 'a1b-6',
        name: 'Truffle Mushroom Risotto',
        description: 'Carnaroli rice, wild porcini, white truffle oil, 24-month Parmigiano-Reggiano.',
        price: '₱680',
        category: 'mains',
        tag: 'Vegetarian',
      },
      {
        id: 'a1b-7',
        name: 'Pan-Roasted Sea Bass',
        description: 'Wild local sea bass, crushed potato purée, caper lemon butter emulsion.',
        price: '₱850',
        category: 'mains',
      },
      {
        id: 'a1b-8',
        name: 'Warm Calamansi Pie',
        description: 'Zesty Philippine calamansi curd, browned butter graham crust, toasted meringue.',
        price: '₱320',
        category: 'desserts',
        tag: 'Signature',
      },
      {
        id: 'a1b-9',
        name: 'Davao Chocolate Lava Cake',
        description: '70% single-origin dark chocolate, molten center, Madagascar vanilla bean gelato.',
        price: '₱380',
        category: 'desserts',
      },
      {
        id: 'a1b-10',
        name: 'Sampaguita Gin & Tonic',
        description: 'Locally distilled botanical gin, fresh calamansi, sampaguita floral mist.',
        price: '₱420',
        category: 'drinks',
        tag: 'Signature Cocktail',
      },
      {
        id: 'a1b-11',
        name: 'Fresh Guimaras Mango Shake',
        description: 'Sweet Guimaras mangoes, crushed ice, touch of honey.',
        price: '₱260',
        category: 'drinks',
      },
    ],
  },
  {
    id: 'dining',
    name: 'In-Room Dining',
    category: 'Dining',
    operator: 'Hotel operated',
    priceRange: 'From ₱450',
    hours: '24 hours daily',
    location: 'Delivered to your room',
    description: 'Comforting Filipino favorites, breakfast sets, and late-night cravings brought directly to your door.',
    cutoff: '2-hour cancellation cutoff',
    tone: 'sand',
    menu: [
      {
        id: 'ird-1',
        name: 'Filipino Breakfast Tocino Set',
        description: 'House-cured pork tocino, two free-range eggs, garlic fried rice, and house atchara.',
        price: '₱480',
        category: 'starters',
        tag: 'All Day',
      },
      {
        id: 'ird-2',
        name: 'Seasonal Tropical Fruit Platter',
        description: 'Sweet papaya, ripe mango, fresh pineapple, watermelon, and wild honey dip.',
        price: '₱320',
        category: 'starters',
        tag: 'Fresh',
      },
      {
        id: 'ird-3',
        name: 'Beef Shank Bulalo',
        description: 'Slow-cooked beef shank, bone marrow, sweet native corn, bok choy, rich bone broth.',
        price: '₱680',
        category: 'mains',
        tag: 'Comfort Classic',
      },
      {
        id: 'ird-4',
        name: 'Crispy Adobo Flakes',
        description: 'Toasted shredded chicken and pork adobo, garlic rice, soft-boiled egg, fresh tomatoes.',
        price: '₱520',
        category: 'mains',
      },
      {
        id: 'ird-5',
        name: 'Henry Club Sandwich',
        description: 'Smoked turkey breast, thick-cut bacon, avocado, cheddar, hand-cut potato chips.',
        price: '₱490',
        category: 'mains',
      },
      {
        id: 'ird-6',
        name: 'Chilled Mango Float',
        description: 'Layers of sweet mangoes, sweet cream, and crushed graham biscuit.',
        price: '₱280',
        category: 'desserts',
      },
      {
        id: 'ird-7',
        name: 'Fresh Young Buko',
        description: 'Chilled whole Philippine coconut with tender coconut meat.',
        price: '₱180',
        category: 'drinks',
      },
      {
        id: 'ird-8',
        name: 'Calamansi Iced Tea',
        description: 'House-brewed Ceylon tea, freshly squeezed calamansi, wildflower honey.',
        price: '₱190',
        category: 'drinks',
      },
    ],
  },
  {
    id: 'poolside-bar',
    name: 'The Poolside Bar',
    category: 'Bar & Lounge',
    operator: 'Hotel operated',
    priceRange: 'From ₱350',
    hours: '11:00 AM – 12:00 MN',
    location: 'Second floor pool deck',
    description: 'Tropical cocktails, artisanal spirits, local craft brews, and savory tapas by the pool.',
    cutoff: 'Walk-in or call front desk',
    tone: 'clay',
    menu: [
      {
        id: 'bar-1',
        name: 'Gambas al Ajillo',
        description: 'Tiger prawns sautéed in extra virgin olive oil, garlic slivers, and bird’s eye chili.',
        price: '₱460',
        category: 'starters',
        tag: 'Tapas',
      },
      {
        id: 'bar-2',
        name: 'Grilled Chicken Yakitori Skewers',
        description: 'Annatto-marinated chicken thighs, spicy dipping vinegar, sticky rice.',
        price: '₱420',
        category: 'mains',
      },
      {
        id: 'bar-3',
        name: 'Palawan Sunset Mojito',
        description: 'Aged Philippine rum, fresh mint, lime, crushed passionfruit, soda.',
        price: '₱380',
        category: 'drinks',
        tag: 'Cocktail',
      },
      {
        id: 'bar-4',
        name: 'Cebu Mango Sour',
        description: 'Bourbon, fresh mango purée, calamansi, egg white foam, bitters.',
        price: '₱410',
        category: 'drinks',
      },
    ],
  },
];

export const SERVICES = [
  { id: 'dining', name: 'In-room dining', category: 'Dining', categoryId: 'dining', operator: 'Hotel operated', price: 'From ₱450', cutoff: '2-hour cancellation cutoff', tone: 'sand' },
  { id: 'restaurant', name: 'Apartment 1B', category: 'Restaurant & bar', categoryId: 'dining', operator: 'Hotel operated', price: 'From ₱550', cutoff: '2-hour cancellation cutoff', tone: 'clay' },
  { id: 'poolside-bar', name: 'The Poolside Bar & Lounge', category: 'Bar & Lounge', categoryId: 'dining', operator: 'Hotel operated', price: 'From ₱350', cutoff: 'Walk-in & lounge', tone: 'clay' },
  { id: 'spa', name: 'Hilom signature massage', category: 'Spa & massage', categoryId: 'spa', operator: 'Third-party on property', price: '₱2,400', cutoff: '24-hour cancellation cutoff', tone: 'sage' },
  { id: 'scrub', name: 'Herbal body scrub & wrap', category: 'Spa & massage', categoryId: 'spa', operator: 'Third-party on property', price: '₱2,800', cutoff: '24-hour cancellation cutoff', tone: 'sage' },
  { id: 'reflexology', name: 'Express foot reflexology', category: 'Spa & massage', categoryId: 'spa', operator: 'Hotel operated', price: '₱1,200', cutoff: '2-hour cancellation cutoff', tone: 'sage' },
  { id: 'tour', name: 'Island day tour', category: 'Activities & tours', categoryId: 'entertainment', operator: 'Third-party on property', price: '₱3,800', cutoff: '24-hour cancellation cutoff', tone: 'sun' },
  { id: 'music', name: 'Sunset acoustic sessions', category: 'Live entertainment', categoryId: 'entertainment', operator: 'Hotel operated', price: 'Complimentary', cutoff: 'Friday–Sunday · 6 PM', tone: 'sun' },
  { id: 'heritage-walk', name: 'Old Manila cultural walk', category: 'Activities & tours', categoryId: 'entertainment', operator: 'Curated guide', price: '₱1,500', cutoff: '24-hour cancellation cutoff', tone: 'sun' },
  { id: 'transfer', name: 'Airport transfer', category: 'Transfers', categoryId: 'services', operator: 'Hotel arranged', price: '₱1,200', cutoff: '2-hour cancellation cutoff', tone: 'blue' },
  { id: 'rental', name: 'City bicycle', category: 'Vehicle & bike rental', categoryId: 'services', operator: 'Hotel operated', price: '₱350 / day', cutoff: '2-hour cancellation cutoff', tone: 'blue' },
  { id: 'laundry', name: 'Express laundry & pressing', category: 'Hotel services', categoryId: 'services', operator: 'Hotel operated', price: 'From ₱250', cutoff: 'Same-day service', tone: 'blue' },
] as const;

export const screenTitle = (id: ScreenId) => SCREENS.find((item) => item.id === id)?.title ?? 'Guest app';
