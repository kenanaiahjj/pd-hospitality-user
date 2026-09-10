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
  | 'my-stay'
  | 'cancel-before-cutoff'
  | 'cancel-after-cutoff'
  | 'folio'
  | 'chat'
  | 'chat-after-hours'
  | 'room-qr-midstay'
  | 'profile'
  | 'stay-history'
  | 'stay-detail'
  | 'travel'
  | 'travel-search'
  | 'travel-checkout'
  | 'travel-confirmation'
  | 'notifications';

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
  screen(24, 'Stay', 'marketplace', 'Explore'),
  screen(25, 'Stay', 'category-listing', 'Explore services'),
  screen(26, 'Stay', 'hotel-service', 'In-room dining'),
  screen(27, 'Stay', 'vendor-service', 'Hilom signature massage'),
  screen(28, 'Stay', 'restaurant-menu', 'Menu & Dining'),
  screen(29, 'Stay', 'service-booking', 'Choose a time'),
  screen(30, 'Stay', 'booking-confirmation', 'Service confirmed'),
  screen(31, 'Stay', 'booking-blocked', 'Connect to book'),
  screen(32, 'Stay', 'my-stay', 'My stay'),
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
  screen(47, 'Stay', 'notifications', 'Notifications'),
  screen(48, 'Account', 'stay-detail', 'Stay detail'),
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
  /** Human-readable, for display: "Tuesday · November 11 · 1:30 PM". */
  scheduledFor: string;
  /**
   * The same moment, sortable. `scheduledFor` is prose and cannot be compared,
   * so whether a booking is still ahead was previously inferred from its
   * status -- which left a confirmed booking sitting in Upcoming long after it
   * had happened.
   */
  scheduledDate: string;
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
  travelBookings: [
    {
      id: 'travel-seed-1',
      reference: 'CBP-8842',
      categoryId: 'flights',
      operator: 'Cebu Pacific',
      detail: '09:15 → 11:05',
      meta: '5J 561 · Direct · Airbus A320',
      route: 'Manila (MNL) → Cebu (CEB)',
      date: '2026-11-14',
      travellers: 2,
      amount: '₱8,560',
      status: 'confirmed',
    },
  ],
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
  /*
    A populated stay, so the relationships are visible without having to book
    five things by hand first. Read as a set these say: two venues and a spa
    inside The Henry Manila, one tour the hotel arranged, one leg from a
    carrier that is not the hotel's, and one order already delivered. Every
    on-property line settles on room 512's folio; the flight never touches it.

    Dates straddle PROTOTYPE_TODAY (2026-11-11) on purpose, so Upcoming and
    Past both have something in them.
  */
  serviceBookings: [
    {
      id: 'service-hilom-1',
      bookingId: 'HEN-241109',
      title: 'Hilom signature massage',
      scheduledFor: 'Wednesday · November 12 · 1:30 PM',
      scheduledDate: '2026-11-12',
      amount: '₱2,400',
      status: 'confirmed',
    },
    {
      id: 'service-rooftop-1',
      bookingId: 'HEN-241109',
      title: 'Azotea Rooftop',
      scheduledFor: 'Tonight · November 11 · 7:30 PM',
      scheduledDate: '2026-11-11',
      amount: '₱2,850',
      status: 'confirmed',
      diningOrder: {
        venueId: 'rooftop',
        venueName: 'Azotea Rooftop',
        items: [
          { id: 'tasting', name: 'Chef\u2019s tasting menu', unitPrice: '₱1,200', quantity: 2 },
          { id: 'wine', name: 'Wine pairing', unitPrice: '₱450', quantity: 1 },
        ],
        fulfillment: { method: 'pickup', timing: 'scheduled', scheduledFor: 'November 11 · 7:30 PM' },
      },
    },
    {
      id: 'service-tour-1',
      bookingId: 'HEN-241109',
      title: 'Binondo food crawl',
      scheduledFor: 'Thursday · November 13 · 9:00 AM',
      scheduledDate: '2026-11-13',
      amount: '₱4,400',
      status: 'confirmed',
    },
    {
      id: 'service-dining-past',
      bookingId: 'HEN-241109',
      title: 'Apartment 1B',
      scheduledFor: 'Yesterday · November 10 · 8:00 PM',
      scheduledDate: '2026-11-10',
      amount: '₱1,850',
      status: 'completed',
      diningOrder: {
        venueId: 'apartment-1b',
        venueName: 'Apartment 1B',
        items: [{ id: 'ribeye', name: 'Grilled Angus Ribeye', unitPrice: '₱1,850', quantity: 1 }],
        fulfillment: { method: 'delivery', timing: 'asap', scheduledFor: 'November 10 · 8:00 PM' },
      },
    },
    {
      id: 'service-cafe-cancelled',
      bookingId: 'HEN-241109',
      title: 'Kape Manila Café',
      scheduledFor: 'Monday · November 9 · 7:00 AM',
      scheduledDate: '2026-11-09',
      amount: '₱480',
      status: 'cancelled',
    },
  ],
  folioTotal: '₱12,730',
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
  /*
    Connecting a booking brings what is already attached to it, not a blank
    stay. The middleware reads a reservation and everything posted against it
    -- the spa slot, last night's dining order, the folio -- so a guest who
    connects mid-stay sees their stay as it stands rather than as if they had
    just booked it. Anything the guest already has is kept ahead of the
    fixture's.
  */
  return {
    ...session,
    bookings: [...session.bookings, UPCOMING_BOOKING_FIXTURE],
    serviceBookings: [...session.serviceBookings, ...MOCK_SESSION.serviceBookings],
    travelBookings: [...session.travelBookings, ...MOCK_SESSION.travelBookings],
    folioTotal: parsePesoAmount(session.folioTotal) > 0 ? session.folioTotal : MOCK_SESSION.folioTotal,
    additionalGuests: session.additionalGuests.length ? session.additionalGuests : MOCK_SESSION.additionalGuests,
  };
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

/** Is the guest inside the stay's window right now? */
export function isStayUnderWay(booking: Booking, today: string = PROTOTYPE_TODAY): boolean {
  if (booking.status === 'completed') return false;
  const now = dayIndex(today);
  return now >= dayIndex(booking.checkIn) && now <= dayIndex(booking.checkOut);
}

export type StayStatus = 'upcoming' | 'room-ready' | 'checked-in' | 'checked-out';

/**
 * The badge on a stay, and the one place its wording is decided.
 *
 * "Upcoming" was read straight off `Booking.status`, so a stay whose own dates
 * had it mid-flight still announced itself as upcoming. Three states matter to
 * a guest and `status` distinguishes none of them: the stay is ahead, the room
 * is released and waiting, or they are in it.
 */
export function describeStayStatus(
  booking: Booking,
  today: string = PROTOTYPE_TODAY,
): { status: StayStatus; label: string } {
  const now = dayIndex(today);

  if (booking.status === 'completed' || now > dayIndex(booking.checkOut)) {
    return { status: 'checked-out', label: 'Checked out' };
  }

  if (isStayUnderWay(booking, today)) {
    return { status: 'checked-in', label: 'Checked in' };
  }

  // Still ahead. A released room is the one thing worth saying before arrival.
  return describeRoomAssignment(booking, today).state === 'ready'
    ? { status: 'room-ready', label: 'Room ready' }
    : { status: 'upcoming', label: 'Upcoming' };
}

export function getHomeVariant(
  bookings: Booking[],
  activeBookingId?: string,
): HomeVariant {
  const selectedBooking = activeBookingId
    ? bookings.find((booking) => booking.id === activeBookingId)
    : undefined;
  /*
    Status, not dates, and deliberately so -- unlike the badge, the countdown
    and the folio block, which all read the window. Which home a guest lands
    on decides whether they see pre-arrival progress and the room-release
    card, and the reference stay carries `upcoming` with a window that already
    contains the prototype clock. Deriving this from dates would take both
    surfaces off the demo path. `describeStayStatus` resolves the
    contradiction where a guest can actually see it: in the label.
  */
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

/** Standard check-out across the estate. */
export const CHECK_OUT_BY = '12:00 PM';

/**
 * The prototype's notion of "now". Every date in this file is fixed -- the
 * folio posts on `NOV 11`, the reference stay runs 9-12 November -- so a
 * countdown read off the wall clock would drift away from the copy around it
 * within a day of writing. Anchoring to the mid-stay date keeps the whole
 * demo internally consistent, and makes every derivation here a pure function
 * of its arguments.
 */
export const PROTOTYPE_TODAY = '2026-11-11';

const dayIndex = (isoDate: string) => Math.floor(Date.parse(`${isoDate}T00:00:00Z`) / 86_400_000);

const countdown = (days: number, today: string, tomorrow: string, future: (days: number) => string) => {
  if (days === 0) return today;
  if (days === 1) return tomorrow;
  return future(days);
};

/**
 * The one line that says where a stay sits in time. Named for check-out
 * because that is the question during a stay; before arrival it counts to
 * check-in instead, since a guest who has not arrived cannot leave.
 */
export function describeCheckoutCountdown(booking: Booking, today: string = PROTOTYPE_TODAY): string {
  /*
    Dates only. This used to branch on `booking.status === 'upcoming'`, which
    the reference stay asserts while its own dates put it mid-stay -- so a stay
    that began two days ago announced "Checks in today from 3:00 PM" directly
    above the dates that contradicted it. `status` is whoever built the
    booking's claim; the window is the booking's own account of itself. Only
    `completed` is taken on trust, because a stay can be closed early.
  */
  if (booking.status === 'completed') return 'Checked out';

  const now = dayIndex(today);
  const untilCheckIn = dayIndex(booking.checkIn) - now;

  if (untilCheckIn > 0) {
    return untilCheckIn === 1
      ? 'Checks in tomorrow'
      : `Checks in in ${untilCheckIn} days`;
  }

  if (untilCheckIn === 0) return `Checks in today from ${CHECK_IN_FROM}`;

  const untilCheckOut = dayIndex(booking.checkOut) - now;
  if (untilCheckOut < 0) return 'Checked out';
  return countdown(
    untilCheckOut,
    `Checks out today at ${CHECK_OUT_BY}`,
    'Checks out tomorrow',
    (n) => `Checks out in ${n} days`,
  );
}

/**
 * Property-wide broadcasts. Static on purpose: these are the same for every
 * guest in the building, which is exactly what separates them from a
 * notification.
 */
export type PropertyAnnouncement = {
  id: string;
  title: string;
  body: string;
  tone: 'neutral' | 'positive' | 'warning';
};

export const PROPERTY_ANNOUNCEMENTS: PropertyAnnouncement[] = [
  {
    id: 'announcement-pool',
    title: 'Rooftop pool closed until 11:00 AM',
    body: 'Weekly maintenance. Azotea Rooftop stays open for drinks throughout.',
    tone: 'warning',
  },
  {
    id: 'announcement-breakfast',
    title: 'Kape Manila Café now opens at 6:00 AM',
    body: 'Earlier breakfast service for guests with morning departures.',
    tone: 'neutral',
  },
];

/**
 * A stay the guest has finished, with enough detail to answer "what did that
 * trip actually cost me, and what did I do?" long after checkout.
 *
 * Held separately from `Booking` on purpose. A `Booking` is a live thing the
 * middleware keeps refreshing -- room assignment, folio total, pre-arrival
 * progress -- while a past stay is settled and immutable. Modelling history as
 * a `Booking` with `status: 'completed'` would leave every one of those live
 * fields hanging around meaning nothing.
 */
export type PastStayCharge = {
  id: string;
  /** What it belonged to: the venue, the spa, the operator. */
  parent: string;
  title: string;
  detail: string;
  amount: string;
  category: 'Dining' | 'Spa & wellness' | 'Tours' | 'Hotel services' | 'Travel';
};

export type PastStay = {
  id: string;
  property: string;
  city: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  roomType: string;
  roomNumber: string;
  guestCount: number;
  source: string;
  /** What the room rate came to, before anything was added to it. */
  roomRate: string;
  /** Everything charged to the room on top of the rate. */
  charges: PastStayCharge[];
  /** Room rate plus charges: what the stay cost in total. */
  total: string;
};

export const PAST_STAYS: PastStay[] = [
  {
    id: 'HEN-CEBU-260314',
    property: 'The Henry Cebu',
    city: 'Cebu',
    checkIn: '2026-03-14',
    checkOut: '2026-03-17',
    nights: 3,
    roomType: 'Garden suite',
    roomNumber: '211',
    guestCount: 2,
    source: 'Direct booking',
    roomRate: '₱18,600',
    charges: [
      { id: 'c1', parent: 'The Henry Cebu', title: 'Hilom signature massage', detail: 'Mar 15 · 2:00 PM · 2 guests', amount: '₱4,800', category: 'Spa & wellness' },
      { id: 'c2', parent: 'Azotea Rooftop', title: 'Dinner for two', detail: 'Mar 15 · 7:30 PM · Ninth floor terrace', amount: '₱3,450', category: 'Dining' },
      { id: 'c3', parent: 'The Henry Cebu', title: 'Island day tour', detail: 'Mar 16 · 8:00 AM · 2 guests', amount: '₱7,600', category: 'Tours' },
      { id: 'c4', parent: 'Kape Manila Café', title: 'Breakfast · 3 mornings', detail: 'Lobby, beside reception', amount: '₱1,740', category: 'Dining' },
      { id: 'c5', parent: 'The Henry Cebu', title: 'Airport transfer', detail: 'Mar 17 · 11:00 AM', amount: '₱1,200', category: 'Hotel services' },
    ],
    total: '₱37,390',
  },
  {
    id: 'HEN-MNL-251002',
    property: 'The Henry Manila',
    city: 'Manila',
    checkIn: '2025-10-02',
    checkOut: '2025-10-04',
    nights: 2,
    roomType: 'King room',
    roomNumber: '406',
    guestCount: 1,
    source: 'Agoda',
    roomRate: '₱9,800',
    charges: [
      { id: 'd1', parent: 'Apartment 1B', title: 'Dinner', detail: 'Oct 2 · 8:00 PM · Ground floor courtyard', amount: '₱1,850', category: 'Dining' },
      { id: 'd2', parent: 'The Henry Manila', title: 'Laundry service', detail: 'Oct 3 · Same-day', amount: '₱1,000', category: 'Hotel services' },
      { id: 'd3', parent: 'The Henry Manila', title: 'Old Manila cultural walk', detail: 'Oct 3 · 9:00 AM', amount: '₱1,500', category: 'Tours' },
    ],
    total: '₱14,150',
  },
  {
    id: 'HEN-CEBU-250508',
    property: 'The Henry Cebu',
    city: 'Cebu',
    checkIn: '2025-05-08',
    checkOut: '2025-05-10',
    nights: 2,
    roomType: 'Deluxe room',
    roomNumber: '108',
    guestCount: 2,
    source: 'Booking.com',
    roomRate: '₱11,200',
    charges: [
      { id: 'e1', parent: 'The Poolside Bar', title: 'Drinks and snacks', detail: 'May 8 · Second floor pool deck', amount: '₱1,420', category: 'Dining' },
      { id: 'e2', parent: 'The Henry Cebu', title: 'Express foot reflexology', detail: 'May 9 · 4:00 PM', amount: '₱1,200', category: 'Spa & wellness' },
    ],
    total: '₱13,820',
  },
];

export const findPastStay = (id: string) => PAST_STAYS.find((stay) => stay.id === id);

/**
 * Groups a past stay's charges by the category that sold them, so the detail
 * screen can show where the money went rather than one flat ledger.
 */
export function summarisePastStay(stay: PastStay) {
  const byCategory = new Map<PastStayCharge['category'], { category: PastStayCharge['category']; total: number; charges: PastStayCharge[] }>();

  for (const charge of stay.charges) {
    const group = byCategory.get(charge.category)
      ?? { category: charge.category, total: 0, charges: [] };
    group.total += parsePesoAmount(charge.amount);
    group.charges.push(charge);
    byCategory.set(charge.category, group);
  }

  const groups = [...byCategory.values()]
    .sort((a, b) => b.total - a.total)
    .map((group) => ({ ...group, formattedTotal: formatPesoAmount(group.total) }));

  const extras = groups.reduce((sum, group) => sum + group.total, 0);

  return {
    groups,
    extras: formatPesoAmount(extras),
    /** Nightly average of the room rate alone -- the extras are not per-night. */
    perNight: formatPesoAmount(Math.round(parsePesoAmount(stay.roomRate) / Math.max(stay.nights, 1))),
  };
}

/**
 * One row of My Stay, whatever it started life as -- a spa booking, a dining
 * order, a ferry.
 *
 * The `parent` pair is the point. Every bookable thing in Cabana belongs to
 * something larger: a restaurant belongs to a hotel, a massage belongs to a
 * spa inside a hotel, a sailing belongs to an operator. A card that names only
 * the thing ("Azotea Rooftop") makes the guest remember which building it was
 * in -- and across a multi-property trip they cannot. So the card leads with
 * the parent and treats the booking as the child.
 */
export type StayEntryKind = 'service' | 'dining' | 'travel';

export type StayEntry = {
  id: string;
  kind: StayEntryKind;
  title: string;
  /** When it happens, and what it costs. */
  detail: string;
  amount: string;
  status: 'confirmed' | 'cancelled' | 'completed';
  /** What this belongs to: the hotel, or the carrier for a leg. */
  parent: string;
  /** Where inside the parent, or the route for a leg. */
  parentDetail?: string;
  /**
   * How it settles, in the guest's terms -- and only when that is news.
   * Absent while a booking is still ahead: the running total above the list
   * already says the room is settling at checkout, so repeating it on every
   * card said nothing per-card.
   */
  settlement?: string;
  /**
   * Which category sold it, for the card's glyph. `kind` was standing in for
   * this and could not tell a massage from a food crawl -- both are
   * `'service'`, so both drew a sparkle.
   */
  category: MiniAppCategoryId;
  /** ISO date of the booking, for ordering and for the upcoming/past split. */
  date: string;
  /** Where tapping it goes, when it goes anywhere. */
  screen?: ScreenId;
};

/**
 * Whether the guest is actually in the stay, read off the dates rather than
 * off `Booking.status`.
 *
 * The two can disagree. `status` is asserted by whoever built the booking --
 * a fixture, or a PMS that has not caught up -- while the dates are the
 * booking's own account of when it happens. The reference stay runs 9-12
 * November against a prototype clock of the 11th and still calls itself
 * `upcoming`, which had My Stay reporting a trip total of travel only while a
 * populated room folio sat one screen away. Where the question is "can this
 * stay have charges yet", the dates answer it.
 */
export function hasStayStarted(booking: Booking, today: string = PROTOTYPE_TODAY): boolean {
  if (booking.status === 'completed') return true;
  return dayIndex(today) >= dayIndex(booking.checkIn);
}

/**
 * Splits everything the guest has booked into what is still ahead and what is
 * behind. Travel legs sit alongside on-property bookings rather than in a
 * section of their own: on this screen the question is "what have I booked",
 * and the answer does not care which system supplied it.
 */
const describeServiceSettlement = (
  status: ServiceBooking['status'],
  roomNumber?: string,
): string | undefined => {
  const room = roomNumber ? `room ${roomNumber}` : 'your room';
  if (status === 'cancelled') return 'Cancelled · not charged';
  if (status === 'completed') return `Completed · charged to ${room}`;
  // Still ahead: the running total already says where this lands.
  return undefined;
};

export function getStayEntries(
  session: GuestSession,
  booking?: Booking,
): { upcoming: StayEntry[]; past: StayEntry[] } {
  if (!booking) return { upcoming: [], past: [] };

  const venueProperty = (venueName: string) =>
    RESTAURANTS.find((venue) => venue.name === venueName);

  /* The catalogue knows which category a booking came from; its title is the
     only link back to it, since a `ServiceBooking` records what was booked
     rather than where it sat. */
  const categoryOf = (title: string): MiniAppCategoryId =>
    SERVICES.find((service) => service.name === title)?.categoryId
      ?? (RESTAURANTS.some((venue) => venue.name === title) ? 'dining' : 'services');

  const entries: StayEntry[] = [];

  for (const service of session.serviceBookings) {
    if (service.bookingId !== booking.id) continue;

    const venue = service.diningOrder ? venueProperty(service.diningOrder.venueName) : undefined;
    const itemCount = service.diningOrder
      ? service.diningOrder.items.reduce((sum, item) => sum + item.quantity, 0)
      : 0;

    entries.push({
      id: service.id,
      kind: service.diningOrder ? 'dining' : 'service',
      title: service.title,
      detail: service.diningOrder
        ? `${itemCount} ${itemCount === 1 ? 'item' : 'items'} · ${service.scheduledFor}`
        : service.scheduledFor,
      amount: service.amount,
      status: service.status,
      // The hotel is the parent whether or not the venue is in the catalogue:
      // an on-property booking belongs to the property it was made at.
      parent: booking.property,
      parentDetail: venue?.location,
      settlement: describeServiceSettlement(service.status, booking.roomNumber),
      category: service.diningOrder ? 'dining' : categoryOf(service.title),
      date: service.scheduledDate,
      screen: service.status === 'confirmed' ? 'cancel-before-cutoff' : undefined,
    });
  }

  for (const leg of session.travelBookings) {
    entries.push({
      id: leg.id,
      kind: 'travel',
      title: leg.detail,
      detail: leg.meta,
      amount: leg.amount,
      status: leg.status,
      // A carrier, not a hotel. Travel is the one thing here whose parent is
      // outside the estate, and the card should not imply the hotel sold it.
      parent: leg.operator,
      parentDetail: leg.route ?? undefined,
      settlement: `${leg.reference} · paid to the operator`,
      category: 'travel',
      date: leg.date,
      screen: undefined,
    });
  }

  /*
    Time decides this, not status. A confirmed booking whose slot has already
    passed is history the guest cannot act on -- leaving it in Upcoming meant
    yesterday's massage sat above tomorrow's flight, and the tab stopped
    meaning "what is still ahead". Cancelled and completed are past whatever
    their date says.
  */
  const today = dayIndex(PROTOTYPE_TODAY);
  const isAhead = (entry: StayEntry) =>
    entry.status === 'confirmed' && dayIndex(entry.date) >= today;

  const byDateAscending = (a: StayEntry, b: StayEntry) => a.date.localeCompare(b.date);

  return {
    upcoming: entries.filter(isAhead).sort(byDateAscending),
    // Most recent first: history is read backwards from now.
    past: entries.filter((entry) => !isAhead(entry)).sort((a, b) => byDateAscending(b, a)),
  };
}

/**
 * What the bell has to say. Derived rather than stored: every fact here
 * already lives in the session, and a second copy would be a second thing to
 * keep in sync. Read state is the one part that cannot be derived, so it lives
 * with the component instead.
 */
export type NotificationTone = 'room' | 'booking' | 'folio' | 'desk' | 'travel';

export type GuestNotification = {
  id: string;
  tone: NotificationTone;
  title: string;
  body: string;
  /** Display-only relative time. The prototype has no clock to compute one. */
  time: string;
  /** Where tapping the notification takes the guest. */
  screen: ScreenId;
};

export function getNotifications(session: GuestSession, booking?: Booking): GuestNotification[] {
  if (!booking) return [];

  const notifications: GuestNotification[] = [];
  const room = booking.roomNumber ? `Room ${booking.roomNumber}` : 'your room';

  if (describeRoomAssignment(booking).state === 'ready') {
    notifications.push({
      id: `notification-room-${booking.id}`,
      tone: 'room',
      title: `Room ${booking.roomNumber} is ready`,
      body: 'Collect your key at the front desk and go straight up.',
      time: 'Just now',
      screen: 'stay-overview',
    });
  }

  for (const service of session.serviceBookings) {
    if (service.bookingId !== booking.id || service.status !== 'confirmed') continue;

    notifications.push(service.diningOrder ? {
      id: `notification-order-${service.id}`,
      tone: 'booking',
      title: 'Your order is being prepared',
      body: `${service.diningOrder.venueName} · ${service.diningOrder.fulfillment.scheduledFor}`,
      time: '10m ago',
      screen: 'my-stay',
    } : {
      id: `notification-service-${service.id}`,
      tone: 'booking',
      title: `${service.title} confirmed`,
      body: `${service.scheduledFor} · added to ${room.toLowerCase()}`,
      time: '1h ago',
      screen: 'my-stay',
    });
  }

  // A stay that has not started cannot have run anything up, and a zero total
  // is not news.
  if (booking.status !== 'upcoming' && parsePesoAmount(session.folioTotal || booking.folioTotal || '₱0') > 0) {
    notifications.push({
      id: `notification-folio-${booking.id}`,
      tone: 'folio',
      title: 'New charge on your room',
      body: `${room} now stands at ${session.folioTotal || booking.folioTotal}. It settles at checkout.`,
      time: '2h ago',
      screen: 'folio',
    });
  }

  for (const leg of session.travelBookings) {
    if (leg.status !== 'confirmed') continue;
    notifications.push({
      id: `notification-travel-${leg.id}`,
      tone: 'travel',
      title: `${leg.operator} booking confirmed`,
      body: `${leg.route ?? leg.detail} · ${leg.meta} · ${leg.reference}`,
      time: 'Yesterday',
      screen: 'travel',
    });
  }

  // Mirrors the message the front desk seeds into every chat, so tapping
  // through lands on the message the notification is about.
  if (booking.status === 'active') {
    notifications.push({
      id: `notification-desk-${booking.id}`,
      tone: 'desk',
      title: 'Front desk',
      body: `Good afternoon, ${session.guestName.split(' ')[0] || 'there'}. How can we help with your stay?`,
      time: 'Yesterday',
      screen: 'chat',
    });
  }

  return notifications;
}

export type RoomAssignmentView = {
  state: RoomAssignmentState;
  roomNumber?: string;
  /** The one line a card leads with. */
  headline: string;
  /** Supporting detail. Never speculative -- '' when there is nothing honest. */
  detail: string;
  /** True only when the guest can walk up to the room now. */
  canGoUp: boolean;
  /** Tag copy, derived here so a tag cannot contradict the headline above it. */
  statusLabel: string;
  /**
   * What the card offers next.
   *
   * `primary` earns the full-width button; `quiet` demotes it to a text link.
   * Only `ready` is a state the guest can act on -- while the property has yet
   * to allocate or release, there is nothing to do but wait, and a loud button
   * there implies the app can hurry an operation it does not control.
   */
  action: { label: string; screen: ScreenId; tone: 'primary' | 'quiet' };
};

/** Waiting states share one quiet way out: look over the stay in the meantime. */
const WAITING_ACTION = { label: 'Review stay', screen: 'repeat-review', tone: 'quiet' } as const;

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
export function describeRoomAssignment(
  booking: Booking,
  today: string = PROTOTYPE_TODAY,
): RoomAssignmentView {
  /*
    Where the middleware told us nothing, the dates answer it: a room the guest
    is already in has been released, one allocated for a stay that has not
    begun has not. `status` used to decide this, and it is the one field a
    fixture or a lagging PMS can assert against the booking's own window.
  */
  const inferred: RoomAssignmentState = booking.roomAssignment
    ?? (booking.roomNumber ? (hasStayStarted(booking, today) ? 'ready' : 'assigned') : 'pending');
  const reportsReadiness = booking.reportsRoomReadiness ?? true;
  const room = booking.roomNumber;

  if (inferred === 'pending' || !room) {
    return {
      state: 'pending',
      headline: 'Room assigned on arrival day',
      detail: `The hotel allocates rooms from its own inventory. Yours appears here as soon as it does. Check-in from ${CHECK_IN_FROM}.`,
      canGoUp: false,
      statusLabel: 'Pre-registered',
      action: WAITING_ACTION,
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
      statusLabel: 'Assigned',
      action: WAITING_ACTION,
    };
  }

  return {
    state: 'ready',
    roomNumber: room,
    headline: `Room ${room} is ready`,
    detail: booking.roomReadyAt ? `Released at ${booking.roomReadyAt}. Go straight up.` : 'Go straight up.',
    canGoUp: true,
    statusLabel: 'Ready',
    // The only state with somewhere to go: the arrival handoff.
    action: { label: 'Head to your room', screen: 'arrival-handoff', tone: 'primary' },
  };
}

/**
 * Whether a room-release event could still arrive for this booking.
 *
 * Housekeeping releases a room around arrival, so the window runs until
 * check-out -- after that there is nothing left to release. Read off the
 * dates rather than `status`, so a booking whose status lags its own window
 * does not silently drop out of the flow.
 */
export function canReportRoomReady(booking: Booking, today: string = PROTOTYPE_TODAY): boolean {
  // A stay the guest has checked out of has no room left to release, and
  // checkout can happen before the date says -- so this one status is taken on
  // trust where the rest are not.
  if (booking.status === 'completed') return false;

  return Boolean(booking.roomNumber)
    && booking.reportsRoomReadiness !== false
    && describeRoomAssignment(booking, today).state === 'assigned'
    && dayIndex(today) <= dayIndex(booking.checkOut);
}

/** Applies a PMS room-release event only when this booking can report one. */
export function markRoomReady(
  booking: Booking,
  roomReadyAt: string,
  today: string = PROTOTYPE_TODAY,
): Booking {
  if (!canReportRoomReady(booking, today)) {
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

export type MiniAppCategoryId = 'dining' | 'spa' | 'entertainment' | 'services' | 'travel';

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
  /**
   * Where the tile goes. Declared per category rather than assumed, because
   * travel does not land on `category-listing`: that screen filters `SERVICES`
   * by `categoryId`, and travel's inventory is carriers and sailings held in
   * `TRAVEL_CATEGORIES`, with its own search and its own checkout.
   */
  screen: ScreenId;
};

export const MINI_APP_CATEGORIES: MiniAppCategory[] = [
  {
    id: 'dining',
    screen: 'category-listing',
    title: 'Food & Drink',
    shortTitle: 'Dining',
    subtitle: 'Restaurants, in-room dining, bars',
    badge: '3 venues',
    tone: 'sand',
  },
  {
    id: 'spa',
    screen: 'category-listing',
    title: 'Spa & Wellness',
    shortTitle: 'Spa',
    subtitle: 'Hilom massage, therapies & scrubs',
    badge: 'On property',
    tone: 'sage',
  },
  {
    id: 'entertainment',
    screen: 'category-listing',
    title: 'Entertainment & Tours',
    shortTitle: 'Tours',
    subtitle: 'Day tours, live music & walks',
    badge: 'Curated',
    tone: 'sun',
  },
  {
    id: 'services',
    screen: 'category-listing',
    title: 'Hotel Services',
    shortTitle: 'Services',
    subtitle: 'Transfers, rentals & amenities',
    badge: 'Front desk',
    tone: 'blue',
  },
  /*
    Travel sits in the grid as a peer, but it is not on-property and the rest
    of this file still knows that: its inventory comes from carriers rather
    than the property's PMS, and it is paid to the operator at booking instead
    of joining a room folio. The guest gets one place to look for everything
    bookable; the model keeps the boundary. See
    docs/superpowers/specs/2026-09-09-travel-booking-destination-design.md.
  */
  {
    id: 'travel',
    screen: 'travel',
    title: 'Travel',
    shortTitle: 'Travel',
    subtitle: 'Flights, ferries, transfers & cover',
    badge: 'Onward',
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

export type TravelCategoryId = 'flights' | 'ferries' | 'transfers';

export type TravelOption = {
  id: string;
  /** Airline, ferry line, transport vendor or insurer. */
  operator: string;
  /** The headline of the option: times, vehicle class, or cover tier. */
  detail: string;
  /** Supporting specifics -- flight number, hull, capacity, excess. */
  meta: string;
  price: string;
  departureTime?: string;
  arrivalTime?: string;
  duration?: string;
  carrierCode?: string;
  vesselOrVehicle?: string;
  badge?: string;
  inclusions?: string[];
  terminal?: string;
  gate?: string;
  baggageBelt?: string;
  onTimeRate?: string;
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

export type PopularRoute = {
  id: string;
  category: TravelCategoryId;
  title: string;
  origin: string;
  destination: string;
  originCode: string;
  destCode: string;
  duration: string;
  startingPrice: string;
  operators: string[];
  tag: string;
  flightNumber?: string;
  departureTime?: string;
  arrivalTime?: string;
  originCity?: string;
  destCity?: string;
  originTerminal?: string;
  destTerminal?: string;
  gate?: string;
  aircraft?: string;
  cabinClass?: string;
  onTimeRate?: string;
  inclusions?: string[];
};

export const POPULAR_ROUTES: PopularRoute[] = [
  {
    id: 'pr-1',
    category: 'flights',
    title: 'Manila ⇄ Boracay (Caticlan)',
    origin: 'Manila (MNL)',
    destination: 'Caticlan (MPH)',
    originCode: 'MNL',
    destCode: 'MPH',
    duration: '1h 05m',
    startingPrice: '₱3,620',
    operators: ['AirAsia Philippines', 'Cebu Pacific', 'Philippine Airlines'],
    tag: 'Top island hop',
    flightNumber: 'Z2 837',
    departureTime: '07:15',
    arrivalTime: '08:20',
    originCity: 'Manila',
    destCity: 'Boracay (Caticlan)',
    originTerminal: 'Terminal 2',
    destTerminal: 'MPH Main',
    gate: 'Gate 22',
    aircraft: 'Airbus A320neo',
    cabinClass: 'Economy Lite',
    onTimeRate: '98% on-time',
    inclusions: ['7kg carry-on', 'Web check-in', 'Instant confirmation'],
  },
  {
    id: 'pr-2',
    category: 'ferries',
    title: 'Cebu Pier 1 ⇄ Bohol (Tagbilaran)',
    origin: 'Cebu Pier 1',
    destination: 'Tagbilaran',
    originCode: 'CEB',
    destCode: 'TAG',
    duration: '1h 50m',
    startingPrice: '₱1,250',
    operators: ['OceanJet', '2GO Travel'],
    tag: 'Daily fastcraft',
    flightNumber: 'OJ 702',
    departureTime: '08:20',
    arrivalTime: '10:10',
    originCity: 'Cebu Pier 1',
    destCity: 'Tagbilaran (Bohol)',
    originTerminal: 'Pier 1',
    destTerminal: 'Tagbilaran Port',
    gate: 'Berth 3',
    aircraft: 'Twin-Hull Fastcraft',
    cabinClass: 'Tourist Aircon',
    onTimeRate: '97% on-schedule',
    inclusions: ['Aircon cabin', '15kg luggage check', 'Instant boarding pass'],
  },
  {
    id: 'pr-3',
    category: 'flights',
    title: 'Manila ⇄ Cebu City',
    origin: 'Manila (MNL)',
    destination: 'Cebu (CEB)',
    originCode: 'MNL',
    destCode: 'CEB',
    duration: '1h 25m',
    startingPrice: '₱2,850',
    operators: ['Cebu Pacific', 'Philippine Airlines'],
    tag: 'Most frequent',
    flightNumber: '5J 563',
    departureTime: '10:45',
    arrivalTime: '12:10',
    originCity: 'Manila',
    destCity: 'Cebu City',
    originTerminal: 'Terminal 3',
    destTerminal: 'Terminal 2',
    gate: 'Gate 118',
    aircraft: 'Airbus A321neo',
    cabinClass: 'Economy Flex',
    onTimeRate: '96% on-time',
    inclusions: ['7kg carry-on', 'Complimentary snack', 'In-flight Wi-Fi'],
  },
  {
    id: 'pr-4',
    category: 'transfers',
    title: 'The Henry Manila ⇄ NAIA Terminal 3',
    origin: 'The Henry Manila',
    destination: 'Manila (MNL) Terminal 3',
    originCode: 'HEN',
    destCode: 'MNL',
    duration: '25–40m',
    startingPrice: '₱1,450',
    operators: ['Henry Fleet'],
    tag: 'Private chauffeur',
    flightNumber: 'HF 101',
    departureTime: '13:30',
    arrivalTime: '14:10',
    originCity: 'The Henry Manila',
    destCity: 'NAIA Terminal 3',
    originTerminal: 'Hotel Front Lobby',
    destTerminal: 'Departure Curbside',
    gate: 'Chauffeur Placed',
    aircraft: 'Camry / Grandia',
    cabinClass: 'Executive Chauffeur',
    onTimeRate: '100% on-schedule',
    inclusions: ['Flight tracking', 'Meet & greet', 'Chilled water & towels'],
  },
];

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
      {
        id: 'fl-1',
        operator: 'Philippine Airlines',
        detail: '05:50 → 07:35',
        meta: 'PR 2971 · Direct · Airbus A321',
        price: '₱4,780',
        departureTime: '05:50',
        arrivalTime: '07:35',
        duration: '1h 45m',
        carrierCode: 'PR 2971',
        vesselOrVehicle: 'Airbus A321-200',
        badge: 'Fastest',
        terminal: 'Terminal 2',
        gate: 'Gate 44',
        baggageBelt: 'Belt 3',
        onTimeRate: '98% on-time',
        inclusions: ['20kg checked baggage', 'Cabin carry-on 7kg', 'Complimentary snack'],
      },
      {
        id: 'fl-2',
        operator: 'Cebu Pacific',
        detail: '09:15 → 11:05',
        meta: '5J 921 · Direct · Airbus A320',
        price: '₱3,940',
        departureTime: '09:15',
        arrivalTime: '11:05',
        duration: '1h 50m',
        carrierCode: '5J 921',
        vesselOrVehicle: 'Airbus A320neo',
        badge: 'Popular',
        terminal: 'Terminal 3',
        gate: 'Gate 118',
        baggageBelt: 'Belt 4',
        onTimeRate: '95% on-time',
        inclusions: ['Cabin carry-on 7kg', 'Direct connection', 'Web check-in ready'],
      },
      {
        id: 'fl-3',
        operator: 'AirAsia Philippines',
        detail: '13:40 → 15:30',
        meta: 'Z2 837 · Direct · Airbus A320',
        price: '₱3,620',
        departureTime: '13:40',
        arrivalTime: '15:30',
        duration: '1h 50m',
        carrierCode: 'Z2 837',
        vesselOrVehicle: 'Airbus A320-200',
        badge: 'Best value',
        terminal: 'Terminal 2',
        gate: 'Gate 22',
        baggageBelt: 'Belt 1',
        onTimeRate: '92% on-time',
        inclusions: ['Cabin carry-on 7kg', 'Direct connection'],
      },
      {
        id: 'fl-4',
        operator: 'Philippine Airlines',
        detail: '18:05 → 19:55',
        meta: 'PR 2975 · Direct · Airbus A321',
        price: '₱5,310',
        departureTime: '18:05',
        arrivalTime: '19:55',
        duration: '1h 50m',
        carrierCode: 'PR 2975',
        vesselOrVehicle: 'Airbus A321-200',
        badge: 'Evening flight',
        terminal: 'Terminal 2',
        gate: 'Gate 46',
        baggageBelt: 'Belt 5',
        onTimeRate: '96% on-time',
        inclusions: ['20kg checked baggage', 'Cabin carry-on 7kg', 'Complimentary snack'],
      },
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
      {
        id: 'fe-1',
        operator: '2GO Travel',
        detail: '06:00 → 08:00',
        meta: 'Fast craft · Tourist class',
        price: '₱1,250',
        departureTime: '06:00',
        arrivalTime: '08:00',
        duration: '2h 00m',
        carrierCode: '2GO Express',
        vesselOrVehicle: 'Tourist class aircon',
        badge: 'Early sailing',
        terminal: 'Pier 1',
        gate: 'Berth 3',
        baggageBelt: 'Luggage Deck',
        onTimeRate: '99% on-schedule',
        inclusions: ['Aircon cabin', 'Standard seat', '15kg luggage check-in'],
      },
      {
        id: 'fe-2',
        operator: 'OceanJet',
        detail: '08:20 → 10:10',
        meta: 'Fast craft · Business class',
        price: '₱1,690',
        departureTime: '08:20',
        arrivalTime: '10:10',
        duration: '1h 50m',
        carrierCode: 'OceanJet 88',
        vesselOrVehicle: 'Business class upper deck',
        badge: 'Recommended',
        terminal: 'Pier 1',
        gate: 'Gate 2A',
        baggageBelt: 'Fast Claim',
        onTimeRate: '97% on-schedule',
        inclusions: ['Reclining leather seats', 'Priority boarding', '20kg baggage'],
      },
      {
        id: 'fe-3',
        operator: 'Lite Ferries',
        detail: '12:00 → 15:30',
        meta: 'RoRo · Aircon berth',
        price: '₱980',
        departureTime: '12:00',
        arrivalTime: '15:30',
        duration: '3h 30m',
        carrierCode: 'Lite Cat 1',
        vesselOrVehicle: 'Aircon berth',
        badge: 'Vehicle & RoRo',
        terminal: 'Pier 3',
        gate: 'Vehicle Ramp 1',
        baggageBelt: 'Vehicle Deck',
        onTimeRate: '94% on-schedule',
        inclusions: ['Berth access', 'Vehicle deck transport available'],
      },
      {
        id: 'fe-4',
        operator: 'OceanJet',
        detail: '16:40 → 18:30',
        meta: 'Fast craft · Tourist class',
        price: '₱1,250',
        departureTime: '16:40',
        arrivalTime: '18:30',
        duration: '1h 50m',
        carrierCode: 'OceanJet 15',
        vesselOrVehicle: 'Tourist class aircon',
        badge: 'Sunset trip',
        terminal: 'Pier 1',
        gate: 'Gate 2B',
        baggageBelt: 'Fast Claim',
        onTimeRate: '96% on-schedule',
        inclusions: ['Aircon cabin', '15kg baggage allowance'],
      },
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
      {
        id: 'tr-1',
        operator: 'Henry Fleet',
        detail: 'Sedan',
        meta: 'Up to 3 · 2 bags · Meet and greet',
        price: '₱1,450',
        duration: '35m',
        carrierCode: 'Executive Sedan',
        vesselOrVehicle: 'Toyota Camry / Corolla Altis',
        badge: 'Private',
        inclusions: ['Up to 3 guests', '2 suitcases', 'Flight tracking', 'Meet & greet with placard'],
      },
      {
        id: 'tr-2',
        operator: 'Henry Fleet',
        detail: 'Premium van',
        meta: 'Up to 6 · 6 bags · Meet and greet',
        price: '₱2,300',
        duration: '35m',
        carrierCode: 'Luxury Van',
        vesselOrVehicle: 'Toyota HiAce Super Grandia',
        badge: 'Family & Group',
        inclusions: ['Up to 6 guests', '6 suitcases', 'Chilled water & cold towels', 'Captain chairs'],
      },
      {
        id: 'tr-3',
        operator: 'Island Coach',
        detail: 'Shared shuttle',
        meta: 'Per seat · Departs hourly',
        price: '₱480',
        duration: '50m',
        carrierCode: 'Hourly Express',
        vesselOrVehicle: 'Shared AC Minibus',
        badge: 'Best value',
        inclusions: ['Guaranteed departure', '1 bag + 1 personal item'],
      },
      {
        id: 'tr-4',
        operator: 'Henry Fleet',
        detail: 'Coaster',
        meta: 'Up to 18 · Group transfer',
        price: '₱5,900',
        duration: '40m',
        carrierCode: 'Executive Coaster',
        vesselOrVehicle: 'Toyota Coaster Deluxe',
        badge: 'Large party',
        inclusions: ['Up to 18 guests', 'Dedicated luggage compartment', 'Private coordinator'],
      },
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

/**
 * Optional cover, offered on the leg rather than sold as its own mode.
 *
 * It used to be a fourth travel category, which put "book a flight" and "buy
 * a policy" on one row as peers -- but cover has no route, no departure and no
 * seat, and a guest shopping for it has already chosen the thing it covers.
 * It belongs on the checkout for that thing.
 */
export type TravelCover = {
  id: string;
  operator: string;
  name: string;
  detail: string;
  pricePerTraveller: number;
};

export const TRAVEL_COVER: TravelCover = {
  id: 'cover-domestic-plus',
  operator: 'Pioneer',
  name: 'Trip cover',
  detail: '₱500,000 medical · cancellation · delay',
  pricePerTraveller: 720,
};

export type TravelQuote = {
  fareEach: string;
  travellers: number;
  fareTotal: string;
  fees: string;
  /** Present only when the guest added cover. */
  cover?: string;
  total: string;
};

/**
 * What a mode starts at, read off its own inventory.
 *
 * These were four hardcoded strings keyed by category id, which is a second
 * copy of a price the options already carry -- the kind that goes stale the
 * first time a fare changes and nobody notices.
 */
export function travelStartingPrice(category: TravelCategory): string {
  const cheapest = category.options.reduce(
    (low, option) => Math.min(low, parsePesoAmount(option.price)),
    Number.POSITIVE_INFINITY,
  );
  return Number.isFinite(cheapest) ? `From ${formatPesoAmount(cheapest)}` : 'Price on request';
}

export function quoteTravel(
  option: TravelOption,
  travellers: number,
  withCover = false,
): TravelQuote {
  const each = parsePesoAmount(option.price);
  const fareTotal = each * travellers;
  const fees = TRAVEL_FEE_PER_TRAVELLER * travellers;
  const cover = withCover ? TRAVEL_COVER.pricePerTraveller * travellers : 0;
  return {
    fareEach: formatPesoAmount(each),
    travellers,
    fareTotal: formatPesoAmount(fareTotal),
    fees: formatPesoAmount(fees),
    cover: cover > 0 ? formatPesoAmount(cover) : undefined,
    total: formatPesoAmount(fareTotal + fees + cover),
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

/**
 * Diet facts about a dish, kept apart from `tag`.
 *
 * `tag` is merchandising ("Popular", "Chef's Special") and dish type
 * ("Tapas", "Cocktail"); filtering on it mixes three axes in one row. This
 * field answers one question only: can the guest eat it. `vegan` always
 * carries `vegetarian` too, so the broader filter catches the narrower dish.
 *
 * No nut facet: nothing on any menu contains them, and a filter that can
 * never match is worse than no filter.
 */
export type DietaryTag = 'vegetarian' | 'vegan' | 'seafood';

export const DIETARY_LABELS: Record<DietaryTag, string> = {
  vegetarian: 'Vegetarian',
  vegan: 'Vegan',
  seafood: 'Seafood',
};

export type MenuItem = {
  id: string;
  name: string;
  description: string;
  price: string;
  category: 'starters' | 'mains' | 'desserts' | 'drinks';
  /** Merchandising and dish type. Never filtered on -- see DietaryTag. */
  tag?: string;
  dietary?: DietaryTag[];
};

/** Shared by both listings, so the two surfaces cannot offer different sorts. */
export type ListingSort = 'recommended' | 'price-asc' | 'price-desc';

export const LISTING_SORTS: { id: ListingSort; label: string }[] = [
  { id: 'recommended', label: 'Recommended' },
  { id: 'price-asc', label: 'Lowest price' },
  { id: 'price-desc', label: 'Highest price' },
];

export const parsePesoAmount = (amount: string) => Number(amount.replace(/[^\d]/g, '')) || 0;

export const formatPesoAmount = (amount: number) => `₱${amount.toLocaleString('en-US')}`;

/* --------------------------------------------------------------------------
   Room charges

   One list, read by every screen that shows what the stay has run up. The
   folio and the booking screen used to hold their own copies of these lines;
   two copies of one stay's money is how they end up disagreeing.
   -------------------------------------------------------------------------- */

export type RoomCharge = {
  id: string;
  /** Short stamp for the folio gutter, e.g. "NOV 9". */
  date: string;
  title: string;
  /** Which venue, amenity or vendor -- plus anything the guest chose. */
  detail: string;
  amount: string;
};

/**
 * Charges the property posted itself: amenities and hotel-operated services
 * the guest never booked through the app. They arrive over the middleware, so
 * the app reports them rather than creating them.
 */
const POSTED_ROOM_CHARGES: RoomCharge[] = [
  { id: 'posted-transfer', date: 'NOV 9', title: 'Airport transfer', detail: 'Hotel arranged', amount: '₱1,200' },
  { id: 'posted-dining', date: 'NOV 10', title: 'In-room dining', detail: 'Dinner · 2 guests', amount: '₱850' },
  { id: 'posted-laundry', date: 'NOV 10', title: 'Laundry service', detail: 'Hotel operated', amount: '₱1,000' },
];

/**
 * Every charge sitting on one booking's room: what the property posted, then
 * what the guest booked in the app. Travel is deliberately absent -- it is
 * paid to the operator and never reaches a folio.
 */
export function getRoomCharges(
  session: GuestSession,
  booking: Booking,
  roomLabel: string,
): RoomCharge[] {
  // A stay that has not started cannot have run anything up yet.
  const posted = booking.status === 'upcoming' ? [] : POSTED_ROOM_CHARGES;
  const booked = session.serviceBookings
    .filter((service) => service.bookingId === booking.id && service.status === 'confirmed')
    .map((service) => ({
      id: service.id,
      date: 'NOV 11',
      title: service.title,
      detail: service.diningOrder
        ? `${service.diningOrder.items.reduce((sum, item) => sum + item.quantity, 0)} items · ${service.scheduledFor} · settles at checkout`
        : `${service.scheduledFor} · Added to ${roomLabel.toLowerCase()} · settles at checkout`,
      amount: service.amount,
    }));
  return [...posted, ...booked];
}

export const sumRoomCharges = (charges: RoomCharge[]) =>
  formatPesoAmount(charges.reduce((sum, charge) => sum + parsePesoAmount(charge.amount), 0));

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
  /** The hotel this venue sits inside. Its parent in the estate. */
  property: string;
  /** Where inside that hotel -- "Ninth floor terrace". Not a substitute. */
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
    property: 'The Henry Manila',
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
        dietary: ['seafood'],
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
        dietary: ['vegetarian'],
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
        dietary: ['vegetarian'],
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
        dietary: ['vegetarian'],
      },
      {
        id: 'a1b-7',
        name: 'Pan-Roasted Sea Bass',
        description: 'Wild local sea bass, crushed potato purée, caper lemon butter emulsion.',
        price: '₱850',
        category: 'mains',
        dietary: ['seafood'],
      },
      {
        id: 'a1b-8',
        name: 'Warm Calamansi Pie',
        description: 'Zesty Philippine calamansi curd, browned butter graham crust, toasted meringue.',
        price: '₱320',
        category: 'desserts',
        tag: 'Signature',
        dietary: ['vegetarian'],
      },
      {
        id: 'a1b-9',
        name: 'Davao Chocolate Lava Cake',
        description: '70% single-origin dark chocolate, molten center, Madagascar vanilla bean gelato.',
        price: '₱380',
        category: 'desserts',
        dietary: ['vegetarian'],
      },
      {
        id: 'a1b-10',
        name: 'Sampaguita Gin & Tonic',
        description: 'Locally distilled botanical gin, fresh calamansi, sampaguita floral mist.',
        price: '₱420',
        category: 'drinks',
        tag: 'Signature Cocktail',
        dietary: ['vegetarian', 'vegan'],
      },
      {
        id: 'a1b-11',
        name: 'Fresh Guimaras Mango Shake',
        description: 'Sweet Guimaras mangoes, crushed ice, touch of honey.',
        price: '₱260',
        category: 'drinks',
        dietary: ['vegetarian'],
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
    property: 'The Henry Manila',
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
        dietary: ['vegetarian'],
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
        dietary: ['vegetarian'],
      },
      {
        id: 'ird-7',
        name: 'Fresh Young Buko',
        description: 'Chilled whole Philippine coconut with tender coconut meat.',
        price: '₱180',
        category: 'drinks',
        dietary: ['vegetarian', 'vegan'],
      },
      {
        id: 'ird-8',
        name: 'Calamansi Iced Tea',
        description: 'House-brewed Ceylon tea, freshly squeezed calamansi, wildflower honey.',
        price: '₱190',
        category: 'drinks',
        dietary: ['vegetarian'],
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
    property: 'The Henry Manila',
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
        dietary: ['seafood'],
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
        dietary: ['vegetarian', 'vegan'],
      },
      {
        id: 'bar-4',
        name: 'Cebu Mango Sour',
        description: 'Bourbon, fresh mango purée, calamansi, egg white foam, bitters.',
        price: '₱410',
        category: 'drinks',
        dietary: ['vegetarian'],
      },
    ],
  },
  {
    id: 'cafe',
    name: 'Kape Manila Café',
    category: 'Café & Bakery',
    operator: 'Hotel operated',
    priceRange: 'From ₱180',
    hours: '6:00 AM – 8:00 PM',
    property: 'The Henry Manila',
    location: 'Lobby, beside reception',
    description: 'Single-origin Philippine coffee, morning pastries, and all-day light plates by the lobby garden.',
    cutoff: 'Walk-in & takeaway',
    tone: 'sand',
    menu: [
      {
        id: 'cafe-1',
        name: 'Pandesal & Kesong Puti',
        description: 'Warm stone-baked pandesal, fresh carabao milk cheese, calamansi marmalade.',
        price: '₱220',
        category: 'starters',
        tag: 'Heritage',
        dietary: ['vegetarian'],
      },
      {
        id: 'cafe-2',
        name: 'Longganisa Breakfast Bowl',
        description: 'Vigan longganisa, garlic rice, sunny egg, pickled papaya.',
        price: '₱420',
        category: 'mains',
        tag: 'All Day',
      },
      {
        id: 'cafe-3',
        name: 'Smoked Tuna Panini',
        description: 'General Santos smoked tuna, gruyère, caramelised onion on sourdough.',
        price: '₱390',
        category: 'mains',
        dietary: ['seafood'],
      },
      {
        id: 'cafe-4',
        name: 'Ube Cheese Croissant',
        description: 'Laminated croissant, purple yam custard, salted cheese crumble.',
        price: '₱280',
        category: 'desserts',
        tag: 'Popular',
        dietary: ['vegetarian'],
      },
      {
        id: 'cafe-5',
        name: 'Bibingka Waffles',
        description: 'Rice flour waffles, salted duck egg, coconut caramel, queso de bola.',
        price: '₱320',
        category: 'desserts',
        dietary: ['vegetarian'],
      },
      {
        id: 'cafe-6',
        name: 'Barako Cold Brew',
        description: 'Sixteen-hour cold brew from Batangas barako beans, over clear ice.',
        price: '₱210',
        category: 'drinks',
        tag: 'Signature',
        dietary: ['vegetarian', 'vegan'],
      },
      {
        id: 'cafe-7',
        name: 'Tsokolate de Batirol',
        description: 'Stone-ground tablea whisked to a froth, toasted pinipig on the side.',
        price: '₱240',
        category: 'drinks',
        dietary: ['vegetarian'],
      },
    ],
  },
  {
    id: 'rooftop',
    name: 'Azotea Rooftop',
    category: 'Fine Dining',
    operator: 'Hotel operated',
    priceRange: 'From ₱1,200',
    hours: '5:30 PM – 12:00 MN',
    property: 'The Henry Manila',
    location: 'Ninth floor terrace',
    description: 'A tasting-led rooftop kitchen working Philippine produce over live fire, with the bay on three sides.',
    cutoff: '24-hour cancellation cutoff',
    tone: 'clay',
    menu: [
      {
        id: 'roof-1',
        name: 'Kinilaw na Tanigue',
        description: 'Line-caught mackerel cured in coconut vinegar, ginger, chili, and burnt coconut cream.',
        price: '₱520',
        category: 'starters',
        tag: 'Signature',
        dietary: ['seafood'],
      },
      {
        id: 'roof-2',
        name: 'Charred Octopus',
        description: 'Live-fire octopus, smoked paprika oil, adlai grain, pickled shallot.',
        price: '₱680',
        category: 'starters',
        dietary: ['seafood'],
      },
      {
        id: 'roof-3',
        name: 'Heirloom Tomato & Kamias',
        description: 'Benguet heirloom tomatoes, kamias granita, basil oil, toasted pili nut crumb.',
        price: '₱420',
        category: 'starters',
        dietary: ['vegetarian', 'vegan'],
      },
      {
        id: 'roof-4',
        name: 'Slow-Roast Lamb Belly',
        description: 'Twelve-hour lamb belly, burnt eggplant purée, pickled mustard seed, jus.',
        price: '₱1,450',
        category: 'mains',
        tag: 'Chef’s Special',
      },
      {
        id: 'roof-5',
        name: 'Seared Palawan Scallops',
        description: 'Day-boat scallops, brown butter, cauliflower cream, calamansi beurre blanc.',
        price: '₱1,280',
        category: 'mains',
        dietary: ['seafood'],
      },
      {
        id: 'roof-6',
        name: 'Kalabasa Gnocchi',
        description: 'Squash gnocchi, sage brown butter, aged kesong puti, crisp malunggay.',
        price: '₱780',
        category: 'mains',
        dietary: ['vegetarian'],
      },
      {
        id: 'roof-7',
        name: 'Calamansi Sorbet',
        description: 'Sharp calamansi sorbet, basil syrup, candied zest.',
        price: '₱280',
        category: 'desserts',
        dietary: ['vegetarian', 'vegan'],
      },
      {
        id: 'roof-8',
        name: 'Lambanog Negroni',
        description: 'Coconut lambanog, Philippine bitter aperitivo, sweet vermouth, orange oil.',
        price: '₱480',
        category: 'drinks',
        tag: 'Cocktail',
        dietary: ['vegetarian', 'vegan'],
      },
    ],
  },
];

export const SERVICES = [
  /* Dining -- the venues themselves live in RESTAURANTS; these are the rows
     the Home rail and cross-category search read. */
  { id: 'dining', name: 'In-room dining', category: 'Dining', categoryId: 'dining', operator: 'Hotel operated', price: 'From ₱450', cutoff: '2-hour cancellation cutoff', tone: 'sand' },
  { id: 'restaurant', name: 'Apartment 1B', category: 'Restaurant & bar', categoryId: 'dining', operator: 'Hotel operated', price: 'From ₱550', cutoff: '2-hour cancellation cutoff', tone: 'clay' },
  { id: 'poolside-bar', name: 'The Poolside Bar & Lounge', category: 'Bar & Lounge', categoryId: 'dining', operator: 'Hotel operated', price: 'From ₱350', cutoff: 'Walk-in & lounge', tone: 'clay' },
  { id: 'cafe', name: 'Kape Manila Café', category: 'Café & bakery', categoryId: 'dining', operator: 'Hotel operated', price: 'From ₱180', cutoff: 'Walk-in & takeaway', tone: 'sand' },
  { id: 'rooftop', name: 'Azotea Rooftop', category: 'Fine dining', categoryId: 'dining', operator: 'Hotel operated', price: 'From ₱1,200', cutoff: '24-hour cancellation cutoff', tone: 'clay' },

  /* Spa & wellness */
  { id: 'spa', name: 'Hilom signature massage', category: 'Spa & massage', categoryId: 'spa', operator: 'Third-party on property', price: '₱2,400', cutoff: '24-hour cancellation cutoff', tone: 'sage' },
  { id: 'scrub', name: 'Herbal body scrub & wrap', category: 'Spa & massage', categoryId: 'spa', operator: 'Third-party on property', price: '₱2,800', cutoff: '24-hour cancellation cutoff', tone: 'sage' },
  { id: 'hot-stone', name: 'Hot stone therapy', category: 'Spa & massage', categoryId: 'spa', operator: 'Third-party on property', price: '₱3,200', cutoff: '24-hour cancellation cutoff', tone: 'sage' },
  { id: 'couples-massage', name: 'Couples massage suite', category: 'Spa & massage', categoryId: 'spa', operator: 'Third-party on property', price: '₱4,600', cutoff: '24-hour cancellation cutoff', tone: 'sage' },
  { id: 'reflexology', name: 'Express foot reflexology', category: 'Spa & massage', categoryId: 'spa', operator: 'Hotel operated', price: '₱1,200', cutoff: '2-hour cancellation cutoff', tone: 'sage' },
  { id: 'facial', name: 'Calamansi brightening facial', category: 'Facial & skin', categoryId: 'spa', operator: 'Third-party on property', price: '₱1,950', cutoff: '24-hour cancellation cutoff', tone: 'sage' },
  { id: 'mani-pedi', name: 'Manicure & pedicure', category: 'Nails & grooming', categoryId: 'spa', operator: 'Curated guide', price: '₱900', cutoff: '2-hour cancellation cutoff', tone: 'sage' },
  { id: 'barber', name: 'Barber & blow-dry bar', category: 'Nails & grooming', categoryId: 'spa', operator: 'Curated guide', price: '₱1,100', cutoff: '2-hour cancellation cutoff', tone: 'sage' },

  /* Entertainment & tours */
  { id: 'tour', name: 'Island day tour', category: 'Activities & tours', categoryId: 'entertainment', operator: 'Third-party on property', price: '₱3,800', cutoff: '24-hour cancellation cutoff', tone: 'sun' },
  { id: 'heritage-walk', name: 'Old Manila cultural walk', category: 'Activities & tours', categoryId: 'entertainment', operator: 'Curated guide', price: '₱1,500', cutoff: '24-hour cancellation cutoff', tone: 'sun' },
  { id: 'food-crawl', name: 'Binondo food crawl', category: 'Activities & tours', categoryId: 'entertainment', operator: 'Curated guide', price: '₱2,200', cutoff: '24-hour cancellation cutoff', tone: 'sun' },
  { id: 'sunset-cruise', name: 'Manila Bay sunset cruise', category: 'Activities & tours', categoryId: 'entertainment', operator: 'Third-party on property', price: '₱2,600', cutoff: '24-hour cancellation cutoff', tone: 'sun' },
  { id: 'diving', name: 'Discover scuba session', category: 'Activities & tours', categoryId: 'entertainment', operator: 'Third-party on property', price: '₱4,500', cutoff: '24-hour cancellation cutoff', tone: 'sun' },
  { id: 'museum-pass', name: 'Museum & gallery pass', category: 'Activities & tours', categoryId: 'entertainment', operator: 'Curated guide', price: '₱850', cutoff: 'Same-day service', tone: 'sun' },
  { id: 'cooking-class', name: 'Filipino cooking class', category: 'Workshops', categoryId: 'entertainment', operator: 'Hotel operated', price: '₱1,800', cutoff: '24-hour cancellation cutoff', tone: 'sun' },
  { id: 'music', name: 'Sunset acoustic sessions', category: 'Live entertainment', categoryId: 'entertainment', operator: 'Hotel operated', price: 'Complimentary', cutoff: 'Friday–Sunday · 6 PM', tone: 'sun' },
  { id: 'film-night', name: 'Poolside film night', category: 'Live entertainment', categoryId: 'entertainment', operator: 'Hotel operated', price: 'Complimentary', cutoff: 'Saturday · 8 PM', tone: 'sun' },

  /* Hotel services */
  { id: 'transfer', name: 'Airport transfer', category: 'Transfers', categoryId: 'services', operator: 'Hotel arranged', price: '₱1,200', cutoff: '2-hour cancellation cutoff', tone: 'blue' },
  { id: 'private-car', name: 'Private car & driver', category: 'Transfers', categoryId: 'services', operator: 'Hotel arranged', price: '₱4,800 / day', cutoff: '24-hour cancellation cutoff', tone: 'blue' },
  { id: 'rental', name: 'City bicycle', category: 'Vehicle & bike rental', categoryId: 'services', operator: 'Hotel operated', price: '₱350 / day', cutoff: '2-hour cancellation cutoff', tone: 'blue' },
  { id: 'scooter', name: 'Scooter rental', category: 'Vehicle & bike rental', categoryId: 'services', operator: 'Third-party on property', price: '₱900 / day', cutoff: '2-hour cancellation cutoff', tone: 'blue' },
  { id: 'laundry', name: 'Express laundry & pressing', category: 'Hotel services', categoryId: 'services', operator: 'Hotel operated', price: 'From ₱250', cutoff: 'Same-day service', tone: 'blue' },
  { id: 'luggage', name: 'Luggage storage & delivery', category: 'Hotel services', categoryId: 'services', operator: 'Hotel operated', price: 'Complimentary', cutoff: 'Same-day service', tone: 'blue' },
  { id: 'celebration', name: 'Flowers & celebration setup', category: 'Hotel services', categoryId: 'services', operator: 'Curated guide', price: 'From ₱1,600', cutoff: '24-hour cancellation cutoff', tone: 'blue' },
  { id: 'trainer', name: 'Personal training session', category: 'Fitness & wellness', categoryId: 'services', operator: 'Hotel operated', price: '₱1,400', cutoff: '2-hour cancellation cutoff', tone: 'blue' },
  { id: 'babysitting', name: 'Babysitting & childcare', category: 'Family services', categoryId: 'services', operator: 'Third-party on property', price: '₱600 / hour', cutoff: '24-hour cancellation cutoff', tone: 'blue' },
  { id: 'meeting-room', name: 'Meeting room hire', category: 'Business services', categoryId: 'services', operator: 'Hotel operated', price: '₱2,500 / half day', cutoff: '24-hour cancellation cutoff', tone: 'blue' },
  { id: 'doctor', name: 'On-call doctor visit', category: 'Health & medical', categoryId: 'services', operator: 'Third-party on property', price: '₱3,500', cutoff: 'Same-day service', tone: 'blue' },
] as const;

/* --------------------------------------------------------------------------
   Listing controls

   Both listings sort and filter through here, so the menu and the services
   list cannot drift into offering different controls for the same job.

   Facets are DERIVED from the rows on screen, never hardcoded. A venue with
   no seafood shows no Seafood pill, and a category whose services all share
   one operator shows no operator row at all -- a filter with one option, or
   with none that match, is noise pretending to be a control.
   -------------------------------------------------------------------------- */

const DIETARY_ORDER: DietaryTag[] = ['vegetarian', 'vegan', 'seafood'];

/** Only the diets actually present on this menu, in a stable order. */
export function availableDietaryTags(menu: MenuItem[]): DietaryTag[] {
  const present = new Set(menu.flatMap((item) => item.dietary ?? []));
  return DIETARY_ORDER.filter((tag) => present.has(tag));
}

/** Distinct operators in a service list. Fewer than two means no useful cut. */
export function availableOperators(services: readonly { operator: string }[]): string[] {
  const seen = [...new Set(services.map((service) => service.operator))];
  return seen.length > 1 ? seen : [];
}

/**
 * Distinct types -- "Spa & massage", "Transfers", "Fine Dining". This is the
 * catalogue's answer to a food app's cuisine filter, and the same
 * fewer-than-two rule applies.
 */
export function availableTypes(rows: readonly { category: string }[]): string[] {
  const seen = [...new Set(rows.map((row) => row.category))].sort((a, b) => a.localeCompare(b));
  return seen.length > 1 ? seen : [];
}

function bySort<T extends { price: string }>(rows: T[], sort: ListingSort): T[] {
  if (sort === 'recommended') return rows;
  // A stable copy: `recommended` is the authored order, and sorting in place
  // would destroy it for every later render.
  const direction = sort === 'price-asc' ? 1 : -1;
  return [...rows].sort((a, b) => (parsePesoAmount(a.price) - parsePesoAmount(b.price)) * direction);
}

export function filterMenu(
  menu: MenuItem[],
  { category, dietary, sort }: { category: MenuItemCategory; dietary: DietaryTag[]; sort: ListingSort },
): MenuItem[] {
  const rows = menu.filter((item) => {
    if (category !== 'all' && item.category !== category) return false;
    // Every selected diet must hold: two pills narrow, they do not widen.
    return dietary.every((tag) => item.dietary?.includes(tag));
  });
  return bySort(rows, sort);
}

export function filterServices<T extends { operator: string; category: string; price: string }>(
  services: readonly T[],
  { operators, types, sort }: { operators: string[]; types: string[]; sort: ListingSort },
): T[] {
  const rows = services.filter((service) => (
    (!operators.length || operators.includes(service.operator))
    // Within one facet the selections widen; across facets they narrow. Two
    // spa types means "either type", but a type plus an operator means both.
    && (!types.length || types.includes(service.category))
  ));
  return bySort(rows, sort);
}

/**
 * The Home discovery rail: one pick from each category, curated by id and
 * resolved against SERVICES so a featured card can never name or price a
 * service differently from its own listing.
 */
export const FEATURED_SERVICE_IDS = ['spa', 'restaurant', 'tour', 'transfer'] as const;

export const getFeaturedServices = () =>
  FEATURED_SERVICE_IDS.map((id) => SERVICES.find((service) => service.id === id)!);

export const screenTitle = (id: ScreenId) => SCREENS.find((item) => item.id === id)?.title ?? 'Guest app';
