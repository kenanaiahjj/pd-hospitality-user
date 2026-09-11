export type ScreenGroup = 'Entry' | 'Pre-arrival' | 'Stay' | 'Account';

export type ScreenId =
  | 'connect-booking'
  | 'room-qr-landing'
  | 'wifi-landing'
  | 'identify'
  | 'book-stay'
  | 'book-stay-dates'
  | 'book-stay-rooms'
  | 'book-stay-checkout'
  | 'book-stay-confirmation'
  | 'identify-returning'
  | 'verify-contact'
  | 'lookup-fallback'
  | 'front-desk-assist'
  | 'no-booking'
  | 'booking-found'
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
  | 'stay-entry'
  | 'pre-arrival-services'
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
  screen(3, 'Entry', 'connect-booking', 'Find your booking'),
  screen(4, 'Entry', 'room-qr-landing', 'Room QR detected'),
  screen(5, 'Entry', 'wifi-landing', 'Hotel Wi-Fi'),
  screen(6, 'Entry', 'identify', 'Find your booking'),
  screen(7, 'Entry', 'lookup-fallback', 'Try another way'),
  screen(8, 'Entry', 'front-desk-assist', 'Front desk assist'),
  screen(9, 'Entry', 'no-booking', 'No booking found'),
  screen(10, 'Entry', 'booking-found', 'Booking found'),
  screen(11, 'Entry', 'welcome-back', 'Welcome back'),
  screen(12, 'Pre-arrival', 'stay-overview', 'Your stay'),
  screen(13, 'Pre-arrival', 'guest-details', 'Guest details'),
  screen(14, 'Pre-arrival', 'id-capture', 'ID or passport'),
  screen(15, 'Account', 'room-preferences', 'Room preferences'),
  screen(16, 'Pre-arrival', 'additional-guests', 'Additional guests'),
  screen(17, 'Pre-arrival', 'repeat-review', 'Review your details'),
  screen(18, 'Pre-arrival', 'rate-detail', 'Room and rate'),
  screen(19, 'Pre-arrival', 'early-check-in', 'Early check-in'),
  screen(20, 'Pre-arrival', 'arrival-handoff', 'Arrival handoff'),
  screen(21, 'Pre-arrival', 'prereg-complete', 'Pre-registration complete'),
  screen(22, 'Pre-arrival', 'prereg-queued', 'Ready to send'),
  screen(23, 'Stay', 'marketplace', 'Explore'),
  screen(24, 'Stay', 'category-listing', 'Explore services'),
  screen(25, 'Stay', 'hotel-service', 'In-room dining'),
  screen(26, 'Stay', 'vendor-service', 'Hilom signature massage'),
  screen(27, 'Stay', 'restaurant-menu', 'Menu & Dining'),
  screen(28, 'Stay', 'service-booking', 'Choose a time'),
  screen(29, 'Stay', 'booking-confirmation', 'Service confirmed'),
  screen(30, 'Stay', 'booking-blocked', 'Connect to book'),
  screen(31, 'Stay', 'my-stay', 'My stay'),
  screen(32, 'Stay', 'cancel-before-cutoff', 'Cancel service'),
  screen(33, 'Stay', 'cancel-after-cutoff', 'Contact front desk'),
  screen(34, 'Stay', 'folio', 'Room charges'),
  screen(35, 'Stay', 'chat', 'Front desk chat'),
  screen(36, 'Stay', 'chat-after-hours', 'Chat after hours'),
  screen(37, 'Stay', 'room-qr-midstay', 'You are checked in'),
  screen(38, 'Account', 'profile', 'Guest profile'),
  screen(39, 'Account', 'stay-history', 'Stay history'),
  screen(40, 'Stay', 'restaurant-cart', 'Review dining order'),
  screen(41, 'Stay', 'dining-order-confirmation', 'Dining order confirmed'),
  screen(42, 'Stay', 'notifications', 'Notifications'),
  screen(43, 'Account', 'stay-detail', 'Stay detail'),
  screen(44, 'Stay', 'stay-entry', 'Booking receipt'),
  screen(45, 'Entry', 'identify-returning', 'Log in with a booking'),
  screen(46, 'Entry', 'verify-contact', 'Verify it is you'),
  screen(47, 'Stay', 'book-stay', 'Book another stay'),
  screen(48, 'Stay', 'book-stay-dates', 'Dates and guests'),
  screen(49, 'Stay', 'book-stay-rooms', 'Choose a room'),
  screen(50, 'Stay', 'book-stay-checkout', 'Confirm and pay'),
  screen(51, 'Stay', 'book-stay-confirmation', 'Stay booked'),
  screen(52, 'Pre-arrival', 'pre-arrival-services', 'Arrange your arrival'),
];

export type BookingStatus = 'upcoming' | 'active' | 'completed';

export type Booking = {
  id: string;
  /**
   * The name on the reservation, as the property holds it.
   *
   * A lookup is a match, not a form: the guest offers a surname to prove the
   * booking is theirs and the middleware returns the reservation, name
   * included. Without this the booking-lookup path had no name to carry into
   * the session at all, so the app showed an empty greeting, promoted an
   * additional guest into the lead booker's row, and attributed a passport to
   * the wrong person on the account.
   */
  guestName: string;
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
  /**
   * That the guest proved they are in the room. Absent until they scan the
   * in-room code or the desk grants their request -- and it is this, not the
   * calendar, that opens on-property services. See `canUseOnPropertyServices`.
   */
  roomVerification?: RoomVerification;
  /**
   * When checkout completed, as a full timestamp.
   *
   * `checkOut` is a date, and the post-checkout front-desk window is measured
   * in hours, so the window has nothing to count from without this.
   */
  checkedOutAt?: string;
  /**
   * What the room itself came to, before anything charged against it.
   *
   * `PastStay` has carried this from the start; a live `Booking` had nowhere to
   * record it, which is why a settled stay could only report its extras and
   * showed a room of zero.
   */
  roomRate?: string;
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

export type AuthState = 'anonymous' | 'authenticated';

/** Drives the "onboarding if new" branch. `none` is the signed-out shape. */
export type AccountStatus = 'none' | 'new' | 'returning';

export type AuthMethod = 'apple' | 'google';

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
  /** Companion names are persisted from the additional-guests step. */
  additionalGuests: string[];
  /** Stay-level ratings the guest has submitted. Private to the property. */
  reviews: StayReview[];
  /**
   * A pending "I can't scan" request awaiting the front desk. At most one:
   * a guest is in one room at a time, and a second request would be the same
   * request again.
   */
  unlockRequest?: UnlockRequest;
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
  guestName: 'Ana Santos',
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
  additionalGuests: [],
  reviews: [],
};

export const MOCK_SESSION: GuestSession = {
  guestName: 'Ana Santos',
  email: 'ana@example.com',
  auth: 'authenticated',
  accountStatus: 'returning',
  authMethod: 'google',
  roomPreferences: {
    floor: 'Higher floor',
    bed: 'King bed',
    accessibility: [],
  },
  additionalGuests: ['Marco Santos'],
  reviews: [],
  bookings: [
    UPCOMING_BOOKING_FIXTURE,
    {
      id: 'HEN-CEBU-240615',
      guestName: 'Ana Santos',
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
    inside The Henry Manila, one hotel-arranged activity, and one order already
    delivered. Every line settles on room 512's folio at hotel checkout.

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
 * Creating an account and signing in both complete immediately in the
 * prototype. They differ only in what they carry: a new account has no stays,
 * and a returning one arrives with everything already on file.
 */
export function createAccountSession(
  guestName: string,
  email: string,
  method: AuthMethod = 'apple',
): GuestSession {
  return {
    ...ANONYMOUS_SESSION,
    guestName,
    email,
    auth: 'authenticated',
    accountStatus: 'new',
    authMethod: method,
  };
}

/**
 * Both SSO providers enter through the same prototype account state. The
 * identity service decides whether the account is new or returning; this
 * fixture represents the unlinked state that needs a booking next.
 */
export function ssoSession(method: AuthMethod = 'apple'): GuestSession {
  const identity = method === 'apple'
    ? { guestName: 'Apple Guest', email: 'guest@privaterelay.appleid.com' }
    : { guestName: 'Google Guest', email: 'guest@gmail.com' };

  return {
    ...ANONYMOUS_SESSION,
    ...identity,
    auth: 'authenticated',
    accountStatus: 'new',
    authMethod: method,
  };
}

export function signInSession(method: AuthMethod = 'google'): GuestSession {
  return {
    ...MOCK_SESSION,
    auth: 'authenticated',
    accountStatus: 'returning',
    authMethod: method,
  };
}

export function signOutSession(): GuestSession {
  return { ...ANONYMOUS_SESSION };
}

/** Idempotent: connecting an already-connected booking is not a second stay. */
/**
 * Match what the guest typed against the reservations Cabana can see.
 *
 * The lookup used to succeed unconditionally, so any reference at all returned
 * the reference stay -- `ZZZZ-000000` / `Nobody` was answered with Ana
 * Santos's name, dates, room and booking source. That is somebody else's
 * reservation shown to a stranger, and it left the `no-booking` screen
 * unreachable from the only flow that should produce it.
 *
 * The reference is required, and it is the only thing matched on.
 *
 * A surname alone used to be accepted, so `Santos` with any reference at all
 * returned Ana Santos's property, dates, room type and booking source to
 * whoever typed it. Surnames are not secrets -- they are on the luggage tag --
 * and this screen is reachable by anyone. The field stays on the form because
 * it confirms to the *guest* that they matched the stay they meant, but it is
 * not a key. A guest who does not have their reference has the
 * `lookup-fallback` → `front-desk-assist` path, which is what human
 * verification is for.
 */
const normalise = (value: string) => value.trim().toLowerCase().replace(/[^a-z0-9]/g, '');

export function findBookingByLookup(reference: string): Booking | undefined {
  const ref = normalise(reference);
  if (!ref) return undefined;

  return [UPCOMING_BOOKING_FIXTURE].find((booking) => normalise(booking.id) === ref);
}

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
    /*
      The reservation supplies the name. A session that already has one keeps
      it -- the room-QR path collects a surname before it ever connects a
      booking, and what the guest typed should win over the record.
    */
    guestName: session.guestName || UPCOMING_BOOKING_FIXTURE.guestName,
    bookings: [...session.bookings, UPCOMING_BOOKING_FIXTURE],
    serviceBookings: [...session.serviceBookings, ...MOCK_SESSION.serviceBookings],
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
  // SSO has already established identity. Ask for the one missing piece—the
  // reservation reference and surname—without an intermediate action hub.
  if (!booking) return 'identify';

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
 * had it already under way still announced itself as upcoming. Three states matter to
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

/* --------------------------------------------------------------------------
   Lifecycle gates

   Four gates, each opened by one fact, all read through the predicates below
   so the tab bar, the booking buttons and the folio cannot disagree about
   what a guest is allowed to do. This is the same discipline
   `describeStayStatus` applies to the badge, for the same reason.
   -------------------------------------------------------------------------- */

export type GuestGate = 'entry' | 'pre-arrival' | 'in-stay' | 'post-stay';

/**
 * How the guest proved to the property that they are in the room, and when.
 *
 * Cabana never checks anyone in -- that is the property's own operation
 * against its own PMS, and the estate runs a mix of legacy and cloud systems
 * that cannot all accept the write. This records only the presence, which is
 * all the app needs before it will charge anything to a room.
 *
 * `'front-desk'` is reachable solely from the desk granting a request. No
 * control the guest can press writes this, or the QR would be decorative.
 */
export type RoomVerification = {
  method: 'scan' | 'front-desk';
  /** ISO date. The prototype clock has no time of day. */
  at: string;
};

/** A guest saying "I can't scan". It unlocks nothing; the desk grants it. */
export type UnlockRequest = { bookingId: string; requestedAt: string };

/**
 * The gate a booking sits in, which is the question every screen is really
 * asking when it decides what to render.
 */
export function describeGuestGate(
  booking: Booking | undefined,
  today: string = PROTOTYPE_TODAY,
): { gate: GuestGate; label: string } {
  if (!booking) return { gate: 'entry', label: 'No booking connected' };

  const { status } = describeStayStatus(booking, today);
  if (status === 'checked-out') return { gate: 'post-stay', label: 'Stay complete' };
  if (status === 'checked-in') {
    return canUseOnPropertyServices(booking, today)
      ? { gate: 'in-stay', label: 'In your room' }
      : { gate: 'in-stay', label: 'Scan to unlock' };
  }

  return { gate: 'pre-arrival', label: 'Before you arrive' };
}

/**
 * The single gate every on-property booking and every room charge reads.
 *
 * Three conditions, and the third is the new one. Dates alone let a guest
 * book a massage from an airport lounge in another city on a day their
 * calendar happens to cover; a room number alone says the property allocated
 * something, not that anyone is standing in it.
 */
export function canUseOnPropertyServices(
  booking: Booking,
  today: string = PROTOTYPE_TODAY,
): boolean {
  return isStayUnderWay(booking, today)
    && Boolean(booking.roomNumber)
    && Boolean(booking.roomVerification);
}

/**
 * The only path that writes the verification fact.
 *
 * Maps one booking, never the session. A session holds several bookings
 * across properties -- `MOCK_SESSION` carries Manila and Cebu -- and a scan
 * in one says nothing about the other. A session-level flag here would unlock
 * room charging against a room the guest has never seen.
 */
export function verifyRoomPresence(
  session: GuestSession,
  bookingId: string,
  method: RoomVerification['method'],
  today: string = PROTOTYPE_TODAY,
): GuestSession {
  return {
    ...session,
    bookings: session.bookings.map((booking) => (
      booking.id === bookingId
        ? { ...booking, roomVerification: { method, at: today } }
        : booking
    )),
    // The request, if there was one, has been answered.
    unlockRequest: session.unlockRequest?.bookingId === bookingId
      ? undefined
      : session.unlockRequest,
  };
}

/**
 * Files a request the front desk has to grant. Deliberately does not touch
 * `roomVerification`: a guest-side unlock button would make the gate
 * decorative, and the point of the gate is that the property confirmed it.
 */
export function requestFrontDeskUnlock(
  session: GuestSession,
  bookingId: string,
  today: string = PROTOTYPE_TODAY,
): GuestSession {
  return { ...session, unlockRequest: { bookingId, requestedAt: today } };
}

/**
 * The second tab: one slot, three contents.
 *
 * The slot always answers the same question -- what can I book right now --
 * and the honest answer differs by gate. It is locked in exactly one
 * situation, and the placement is the whole point: a wall shown to a guest
 * three days out teaches them the app is closed, where the same wall shown to
 * a guest standing in their room with the code in front of them is the one
 * moment the prompt can be acted on.
 */
export type BookingSlot = {
  label: 'Arrival' | 'Explore' | 'Book again';
  screen: Extract<ScreenId, 'pre-arrival-services' | 'marketplace' | 'book-stay'>;
  locked: boolean;
};

export function describeBookingSlot(
  booking: Booking | undefined,
  today: string = PROTOTYPE_TODAY,
): BookingSlot {
  const { gate } = describeGuestGate(booking, today);

  if (gate === 'post-stay') {
    return { label: 'Book again', screen: 'book-stay', locked: false };
  }

  if (gate === 'in-stay' && booking) {
    return {
      label: 'Explore',
      screen: 'marketplace',
      locked: !canUseOnPropertyServices(booking, today),
    };
  }

  // Pre-arrival, and the signed-out case, which never renders the bar anyway.
  return { label: 'Arrival', screen: 'pre-arrival-services', locked: false };
}

/**
 * What a guest can book before they are in the room: getting there, and what
 * should be waiting when they arrive. Everything else on the property needs a
 * room to charge to and a guest standing in it.
 *
 * Early check-in is the fifth arrival affordance but is not a catalogue item;
 * it keeps its own `early-check-in` screen.
 */
export const PRE_ARRIVAL_SERVICE_IDS = [
  'transfer',
  'private-car',
  'luggage',
  'celebration',
] as const;

export function isPreArrivalService(miniAppId: string): boolean {
  return (PRE_ARRIVAL_SERVICE_IDS as readonly string[]).includes(miniAppId);
}

/**
 * Where a finished stay sits against the 24-hour front-desk window.
 *
 * Reads `checkedOutAt` rather than `checkOut`, because the window is measured
 * in hours and `checkOut` is a date with no time of day. A stay with no
 * timestamp reports closed: nothing to count from is a reason to say so, not
 * a reason to leave a window open forever.
 */
export function describePostStayWindow(
  booking: Booking,
  now: string = `${PROTOTYPE_TODAY}T12:00:00Z`,
): { deskOpen: boolean; hoursRemaining: number; label: string } {
  const closed = { deskOpen: false, hoursRemaining: 0, label: 'Front desk chat closed' };
  if (!booking.checkedOutAt) return closed;

  const elapsed = Date.parse(now) - Date.parse(booking.checkedOutAt);
  if (!Number.isFinite(elapsed)) return closed;

  const hoursRemaining = Math.ceil((POST_STAY_DESK_HOURS * 3_600_000 - elapsed) / 3_600_000);
  if (hoursRemaining <= 0) return closed;

  return {
    deskOpen: true,
    hoursRemaining,
    label: hoursRemaining === 1
      ? 'Front desk open for another hour'
      : `Front desk open for another ${hoursRemaining} hours`,
  };
}

/** How long the desk stays reachable after checkout. */
export const POST_STAY_DESK_HOURS = 24;

/** One rating for the stay as a whole, private to the property. */
export type StayReview = {
  bookingId: string;
  rating: 1 | 2 | 3 | 4 | 5;
  comment: string;
  submittedAt: string;
};

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

/**
 * What the rebooking date fields open on. Far enough ahead of the prototype
 * clock to be plainly a future trip rather than an edit of the current one.
 */
export const DEFAULT_REBOOK_CHECK_IN = '2026-12-11';
export const DEFAULT_REBOOK_CHECK_OUT = '2026-12-14';

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
  category: 'Dining' | 'Spa & wellness' | 'Tours' | 'Hotel services';
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
 * The contact the estate holds for this guest, in one place.
 *
 * The mobile used to exist only as a default value on the `guest-details`
 * form, which made it impossible to say "we sent a code to the number on your
 * reservation" without restating it and letting the two drift.
 */
export const GUEST_PROFILE = {
  name: 'Ana Santos',
  email: 'ana@example.com',
  mobile: '+63 917 555 0142',
} as const;

/**
 * Masked for display *before* verification.
 *
 * The re-entry screen has to prove to the guest that it reached the right
 * person without telling an unknown party what that address is -- the whole
 * point of the code step is that holding a booking reference is not yet proof
 * of anything.
 */
export function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!local || !domain) return email;

  return `${local.slice(0, 1)}•••@${domain}`;
}

export function maskMobile(mobile: string): string {
  const parts = mobile.trim().split(/\s+/);
  if (parts.length < 3) return mobile;

  // Country code and prefix stay, the subscriber block goes, the last block
  // stays -- enough for the guest to recognise their own number and no more.
  return parts.map((part, index) => (index === parts.length - 2 ? '•••' : part)).join(' ');
}

/**
 * A reference matched against everything the estate holds for this guest --
 * the live reservations *and* the settled stays.
 *
 * Distinct from `findBookingByLookup`, which answers "is there a stay to
 * attach". This answers "is whoever typed this plausibly the guest", which is
 * a different question with a different set to search: a guest coming back
 * eighteen months later has no live reservation at all, only the reference on
 * a receipt.
 */
export type ProfileMatch = {
  reference: string;
  guestName: string;
  property: string;
  /** Set when the reference names a reservation the middleware still tracks. */
  booking?: Booking;
  /** Set when the reference names a stay that is settled and immutable. */
  pastStay?: PastStay;
};

export function findProfileByLookup(reference: string): ProfileMatch | undefined {
  const ref = normalise(reference);
  if (!ref) return undefined;

  const booking = MOCK_SESSION.bookings.find((entry) => normalise(entry.id) === ref);
  if (booking) {
    return {
      reference: booking.id,
      guestName: booking.guestName,
      property: booking.property,
      booking,
    };
  }

  const pastStay = PAST_STAYS.find((stay) => normalise(stay.id) === ref);
  if (pastStay) {
    return {
      reference: pastStay.id,
      guestName: GUEST_PROFILE.name,
      property: pastStay.property,
      pastStay,
    };
  }

  return undefined;
}

/**
 * What a verified code buys: the whole profile, not the one stay that was
 * looked up.
 *
 * This is the answer to "can I log in with an old booking ID and see
 * everything?" -- the reference is the way in, the guest profile is what is
 * behind the door. Restoring only the matched reservation would make a guest
 * re-enter a reference per stay to assemble their own history.
 */
export function restoreProfileSession(): GuestSession {
  return {
    ...MOCK_SESSION,
    auth: 'authenticated',
    accountStatus: 'returning',
    authMethod: 'google',
  };
}

/**
 * The four states of a stay worth demonstrating, for the prototype control.
 *
 * Reaching the finished state by playing the app forward is impossible -- there
 * is no checkout to perform -- so without a switch the post-checkout app is
 * unreachable and effectively undesigned.
 */
export type PrototypeStayState =
  | 'signed-out'
  | 'pre-arrival'
  | 'arrived-unverified'
  | 'live'
  | 'just-checked-out'
  | 'closed';

/**
 * Read through `describeStayStatus`, which is the badge the guest is looking at
 * while they use the switch.
 *
 * Reading `status` directly is what the first version did, and the reference
 * stay breaks it: it runs 9-12 November against a clock of the 11th while still
 * calling itself `upcoming`, so the panel reported `pre-arrival` for a stay the
 * home screen was badging "Checked in". Whatever the switch says has to be what
 * is on screen, or it is worse than no switch at all.
 */
export function getPrototypeStayState(session: GuestSession): PrototypeStayState {
  const booking = getPrimaryBooking(session.bookings, session.activeBookingId);
  if (!booking) return 'signed-out';

  const { status } = describeStayStatus(booking);
  if (status === 'checked-out') {
    // Which side of the front-desk window, since the two post-stay screens
    // are different surfaces rather than one screen with a banner.
    return describePostStayWindow(booking).deskOpen ? 'just-checked-out' : 'closed';
  }
  if (status === 'checked-in') {
    return canUseOnPropertyServices(booking) ? 'live' : 'arrived-unverified';
  }
  return 'pre-arrival';
}

/* ==========================================================================
   The estate, and booking another stay in it
   ========================================================================== */

export type PropertyRoomType = {
  id: string;
  name: string;
  detail: string;
  /** Per night, before taxes. */
  nightlyRate: string;
  maxGuests: number;
};

export type EstateProperty = {
  id: string;
  name: string;
  city: string;
  /**
   * Part of the reference the property issues: `HEN-MNL-251002`,
   * `HEN-CEBU-260314`. Both forms already exist in the fixtures, so this is
   * read off the property rather than inferred from the city.
   */
  referenceCode: string;
  tagline: string;
  roomTypes: PropertyRoomType[];
};

/**
 * The three properties a returning guest can book into.
 *
 * This is not hotel search. It is the estate a guest who has already stayed can
 * come back to, reachable only from a finished stay -- `no-booking` still tells
 * anyone without a reservation that Cabana is not a place to compare hotels,
 * and that stays true. A direct booking here displaces an OTA's commission
 * rather than buying a new guest.
 */
export const ESTATE_PROPERTIES: EstateProperty[] = [
  {
    id: 'manila',
    name: 'The Henry Manila',
    city: 'Manila',
    referenceCode: 'MNL',
    tagline: 'Post-war villas and garden courtyards in Pasay',
    roomTypes: [
      { id: 'manila-king', name: 'King room', detail: '32 sqm · Courtyard view · Sleeps 2', nightlyRate: '₱6,200', maxGuests: 2 },
      { id: 'manila-suite', name: 'Garden suite', detail: '48 sqm · Private terrace · Sleeps 3', nightlyRate: '₱9,400', maxGuests: 3 },
      { id: 'manila-family', name: 'Two-bedroom villa', detail: '76 sqm · Separate living room · Sleeps 5', nightlyRate: '₱14,800', maxGuests: 5 },
    ],
  },
  {
    id: 'cebu',
    name: 'The Henry Cebu',
    city: 'Cebu',
    referenceCode: 'CEBU',
    tagline: 'Pool deck, Azotea rooftop, ten minutes from Mactan',
    roomTypes: [
      { id: 'cebu-deluxe', name: 'Deluxe room', detail: '28 sqm · Pool view · Sleeps 2', nightlyRate: '₱5,600', maxGuests: 2 },
      { id: 'cebu-suite', name: 'Garden suite', detail: '44 sqm · Ground floor garden · Sleeps 3', nightlyRate: '₱8,800', maxGuests: 3 },
    ],
  },
  {
    id: 'dumaguete',
    name: 'The Henry Dumaguete',
    city: 'Dumaguete',
    referenceCode: 'DGTE',
    tagline: 'Quiet sea-facing wing, walking distance to Rizal Boulevard',
    roomTypes: [
      { id: 'dumaguete-deluxe', name: 'Deluxe room', detail: '26 sqm · Sea view · Sleeps 2', nightlyRate: '₱4,900', maxGuests: 2 },
      { id: 'dumaguete-suite', name: 'Corner suite', detail: '40 sqm · Balcony · Sleeps 4', nightlyRate: '₱7,600', maxGuests: 4 },
    ],
  },
];

export const findEstateProperty = (id: string) =>
  ESTATE_PROPERTIES.find((property) => property.id === id);

/** The lowest nightly rate on offer, so a property card can say "from". */
export function propertyFromRate(property: EstateProperty): string {
  return formatPesoAmount(
    Math.min(...property.roomTypes.map((room) => parsePesoAmount(room.nightlyRate))),
  );
}

/** Nights between two dates, never negative -- a date picker can invert them. */
export function countNightsBetween(checkIn: string, checkOut: string): number {
  const nights = dayIndex(checkOut) - dayIndex(checkIn);
  return nights > 0 ? nights : 0;
}

/**
 * 12% VAT. The figure matches the rate already shown on `rate-detail`
 * (₱18,000 room, ₱2,160 tax), so a booking made in the app and one made
 * through an OTA do not appear to be taxed differently.
 */
const STAY_TAX_RATE = 0.12;

export type StayQuote = {
  nights: number;
  roomTotal: string;
  taxes: string;
  total: string;
};

export function quoteStay(roomType: PropertyRoomType, nights: number): StayQuote {
  const room = parsePesoAmount(roomType.nightlyRate) * nights;
  const taxes = Math.round(room * STAY_TAX_RATE);

  return {
    nights,
    roomTotal: formatPesoAmount(room),
    taxes: formatPesoAmount(taxes),
    total: formatPesoAmount(room + taxes),
  };
}

/**
 * Mints the reservation a direct booking produces.
 *
 * Pre-arrival starts at zero however many times this guest has stayed: the
 * details go to a different property, which holds its own registration record
 * and has not seen their ID.
 */
export function createStayBooking(input: {
  property: EstateProperty;
  roomType: PropertyRoomType;
  checkIn: string;
  checkOut: string;
  guests: number;
  guestName: string;
}): Booking {
  const { property, roomType, checkIn, checkOut, guests, guestName } = input;
  const quote = quoteStay(roomType, countNightsBetween(checkIn, checkOut));
  const stamp = checkIn.replaceAll('-', '').slice(2);

  return {
    id: `HEN-${property.referenceCode}-${stamp}`,
    guestName,
    property: property.name,
    city: property.city,
    status: 'upcoming',
    checkIn,
    checkOut,
    roomType: roomType.name,
    roomAssignment: 'pending',
    guestCount: guests,
    // The commercial point of the feature: this one is not an OTA's.
    source: 'Direct booking',
    preArrivalCompleted: 0,
    preArrivalTotal: 4,
    nextPreArrivalStep: 'Add your details',
    roomRate: quote.roomTotal,
  };
}

/** Adds a booking and makes it the one the app is about. */
export function addStayBooking(session: GuestSession, booking: Booking): GuestSession {
  return {
    ...session,
    bookings: [...session.bookings, booking],
    activeBookingId: booking.id,
  };
}

/**
 * A finished `Booking` rendered as the `PastStay` it has become, so the receipt
 * on My Stay and the one on `stay-detail` are the same object and read alike.
 *
 * Deliberately not `getRoomCharges`, which answers "what is running up against
 * the room right now" and drops anything not `confirmed`. This answers "what
 * did the stay come to", which is closed, includes the room itself, and counts
 * services that have since completed.
 */
export function toFinishedStay(session: GuestSession, booking: Booking): PastStay {
  const charges: PastStayCharge[] = [];

  for (const posted of POSTED_ROOM_CHARGES) {
    charges.push({
      id: posted.id,
      parent: booking.property,
      title: posted.title,
      detail: posted.detail,
      amount: posted.amount,
      category: posted.category ?? 'Hotel services',
    });
  }

  for (const service of session.serviceBookings) {
    if (service.bookingId !== booking.id || service.status === 'cancelled') continue;

    charges.push({
      id: service.id,
      parent: service.diningOrder?.venueName ?? booking.property,
      title: service.title,
      detail: service.scheduledFor,
      category: categoryLabelFor(service.title),
      amount: service.amount,
    });
  }

  const roomRate = booking.roomRate ?? deriveRoomRate(booking);
  const extras = charges.reduce((sum, charge) => sum + parsePesoAmount(charge.amount), 0);

  return {
    id: booking.id,
    property: booking.property,
    city: booking.city,
    checkIn: booking.checkIn,
    checkOut: booking.checkOut,
    nights: countNightsBetween(booking.checkIn, booking.checkOut),
    roomType: booking.roomType,
    roomNumber: booking.roomNumber ?? '—',
    guestCount: booking.guestCount,
    source: booking.source,
    roomRate,
    charges,
    total: formatPesoAmount(parsePesoAmount(roomRate) + extras),
  };
}

/**
 * What the room cost, for a booking that never recorded it.
 *
 * Emphatically not `folioTotal`, which was the first fallback here and is
 * wrong in a way that looks right: it is the total *charged against* the room,
 * so using it as the room's own price both understates the room and counts
 * every extra twice -- once on the room line and again in its own group.
 *
 * The catalogue knows what that room goes for. Where it does not -- a property
 * or room type outside the estate list -- the honest answer is nothing, not a
 * borrowed number.
 */
function deriveRoomRate(booking: Booking): string {
  const property = ESTATE_PROPERTIES.find((entry) => entry.name === booking.property);
  const room = property?.roomTypes.find((entry) => entry.name === booking.roomType);
  if (!room) return '₱0';

  return quoteStay(room, countNightsBetween(booking.checkIn, booking.checkOut)).roomTotal;
}

/** Maps a booked item back to the receipt heading it belongs under. */
function categoryLabelFor(title: string): PastStayCharge['category'] {
  const categoryId = SERVICES.find((service) => service.name === title)?.categoryId
    ?? (RESTAURANTS.some((venue) => venue.name === title) ? 'dining' : 'services');

  if (categoryId === 'dining') return 'Dining';
  if (categoryId === 'spa') return 'Spa & wellness';
  if (categoryId === 'entertainment') return 'Tours';
  return 'Hotel services';
}

/** The switcher's rows, so the panel and the model cannot disagree on wording. */
export const PROTOTYPE_STAY_STATES: Array<{
  id: PrototypeStayState;
  label: string;
  detail: string;
}> = [
  { id: 'signed-out', label: 'Signed out', detail: 'Welcome screen, nothing connected' },
  { id: 'pre-arrival', label: 'Pre-arrival', detail: 'Booked, arrival services only' },
  { id: 'arrived-unverified', label: 'Arrived, not scanned', detail: 'In the room, catalogue still shut' },
  { id: 'live', label: 'Live stay', detail: 'Scanned, charging to the folio' },
  { id: 'just-checked-out', label: 'Just checked out', detail: 'Settled, front desk open 24 hours' },
  { id: 'closed', label: 'Stay closed', detail: 'Desk window over, summary and review' },
];

export function applyPrototypeStayState(state: PrototypeStayState): GuestSession {
  if (state === 'signed-out') return { ...ANONYMOUS_SESSION };

  const profile = restoreProfileSession();

  if (state === 'pre-arrival') {
    const booking: Booking = {
      ...UPCOMING_BOOKING_FIXTURE,
      status: 'upcoming',
      // Clear of the prototype clock, so nothing about this stay reads as
      // under way.
      checkIn: '2026-11-20',
      checkOut: '2026-11-23',
      roomNumber: undefined,
      roomAssignment: 'pending',
      preArrivalCompleted: 2,
      preArrivalTotal: 4,
      folioTotal: undefined,
    };

    return {
      ...profile,
      bookings: [booking],
      activeBookingId: booking.id,
      serviceBookings: [],
      folioTotal: '₱0',
    };
  }

  if (state === 'arrived-unverified') {
    /*
      On property, in the room, and nothing scanned yet. The one state the
      old switcher could not reach, and the only one where the catalogue is
      shut to a guest whose dates say the stay is under way.
    */
    const booking: Booking = {
      ...UPCOMING_BOOKING_FIXTURE,
      status: 'active',
      roomNumber: '304',
      roomAssignment: 'ready',
      roomReadyAt: '2:15 PM',
      preArrivalCompleted: 4,
      preArrivalTotal: 4,
      nextPreArrivalStep: undefined,
      folioTotal: undefined,
    };

    return {
      ...profile,
      bookings: [booking],
      activeBookingId: booking.id,
      serviceBookings: [],
      folioTotal: '₱0',
    };
  }

  if (state === 'live') {
    const booking: Booking = {
      ...UPCOMING_BOOKING_FIXTURE,
      status: 'active',
      roomNumber: '304',
      roomAssignment: 'ready',
      roomReadyAt: '2:15 PM',
      roomVerification: { method: 'scan', at: PROTOTYPE_TODAY },
      preArrivalCompleted: 4,
      preArrivalTotal: 4,
      nextPreArrivalStep: undefined,
      folioTotal: '₱3,050',
      // Three nights of the Manila king room at the catalogue's own rate, so
      // the receipt and `ESTATE_PROPERTIES` cannot quote different numbers.
      roomRate: '₱18,600',
    };

    return {
      ...profile,
      bookings: [booking],
      activeBookingId: booking.id,
      folioTotal: '₱3,050',
    };
  }

  /*
    Finished. `status: 'completed'` is what closes the live surface -- every
    gate that guards room charging, dining orders and room-ready reporting runs
    through `isStayUnderWay`, which reads completed as false. The stay stays
    legible; only the things that post to a room the guest has left go away.
  */
  /*
    Both post-stay states share one settled booking and differ only in when
    checkout happened, because that is the only thing the 24-hour front-desk
    window reads. `just-checked-out` puts it an hour ago, `closed` two days
    -- the window is real arithmetic, it simply never has to elapse in front
    of anyone watching a demo.
  */
  const booking: Booking = {
    ...UPCOMING_BOOKING_FIXTURE,
    status: 'completed',
    checkIn: '2026-11-02',
    checkOut: '2026-11-05',
    checkedOutAt: state === 'just-checked-out'
      ? `${PROTOTYPE_TODAY}T11:00:00Z`
      : '2026-11-05T11:00:00Z',
    roomNumber: '304',
    roomAssignment: 'ready',
    roomVerification: { method: 'scan', at: '2026-11-05' },
    preArrivalCompleted: 4,
    preArrivalTotal: 4,
    nextPreArrivalStep: undefined,
    folioTotal: '₱3,050',
    roomRate: '₱18,600',
  };

  return {
    ...profile,
    bookings: [booking],
    activeBookingId: booking.id,
    // Settled at checkout: nothing is owing on a stay that is over.
    folioTotal: '₱0',
    serviceBookings: profile.serviceBookings.map((service) => ({
      ...service,
      bookingId: booking.id,
      status: service.status === 'cancelled' ? 'cancelled' : 'completed',
    })),
  };
}

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
 * One row of My Stay, whether it began as a spa booking or a dining order.
 *
 * The `parent` pair is the point. Every bookable thing in Cabana belongs to
 * something larger: a restaurant belongs to a hotel, a massage belongs to a
 * spa inside a hotel. A card that names only the thing ("Azotea Rooftop")
 * makes the guest remember which building it was
 * in -- and across a multi-property trip they cannot. So the card leads with
 * the parent and treats the booking as the child.
 */
export type StayEntryKind = 'service' | 'dining';

/** One priced line on a booking's receipt. */
export type StayReceiptLine = {
  id: string;
  label: string;
  /** Unit price and quantity, where there is more than one of something. */
  detail?: string;
  amount: string;
};

export type StayEntry = {
  id: string;
  kind: StayEntryKind;
  title: string;
  /** When it happens, and what it costs. */
  detail: string;
  amount: string;
  status: 'confirmed' | 'cancelled' | 'completed';
  /** The hotel this on-property booking belongs to. */
  parent: string;
  /** Where inside the property the booking takes place. */
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
  /**
   * What was actually bought, itemised. The card can only say "3 items", which
   * is a count rather than an answer -- a guest checking what a ₱2,850 line on
   * their room was for has to be able to open it and read the order back.
   */
  lines: StayReceiptLine[];
  /** Whether the guest can still cancel this themselves. */
  canCancel: boolean;
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
 * `upcoming`, which had My Stay reporting no activity while a
 * populated room folio sat one screen away. Where the question is "can this
 * stay have charges yet", the dates answer it.
 */
export function hasStayStarted(booking: Booking, today: string = PROTOTYPE_TODAY): boolean {
  if (booking.status === 'completed') return true;
  return dayIndex(today) >= dayIndex(booking.checkIn);
}

/**
 * Splits on-property bookings into what is still ahead and what is behind.
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

    const lines: StayReceiptLine[] = service.diningOrder
      ? service.diningOrder.items.map((item) => ({
          id: item.id,
          label: item.name,
          detail: item.quantity > 1 ? `${item.quantity} × ${item.unitPrice}` : undefined,
          amount: formatPesoAmount(parsePesoAmount(item.unitPrice) * item.quantity),
        }))
      // A service is one thing at one price; the receipt still shows a line so
      // every booking reads the same way when opened.
      : [{ id: service.id, label: service.title, amount: service.amount }];

    entries.push({
      id: service.id,
      kind: service.diningOrder ? 'dining' : 'service',
      lines,
      canCancel: service.status === 'confirmed' && !service.diningOrder,
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
      /*
        Every entry opens its receipt, past ones included. Confirmed bookings
        used to jump straight into the cancel flow, which made "what was this?"
        unanswerable and put a destructive screen behind an ordinary tap.
      */
      screen: 'stay-entry',
    });
  }

  /*
    Time decides this, not status. A confirmed booking whose slot has already
    passed is history the guest cannot act on -- leaving it in Upcoming meant
    yesterday's massage sat above a later service, and the tab stopped
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
export type NotificationTone = 'room' | 'booking' | 'folio' | 'desk';

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
      detail: hasStayStarted(booking, today)
        ? `Collect your key at the front desk if you have not already.`
        : reportsReadiness
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
  /** Where the tile goes. */
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
];

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
  /** Where it belongs once the stay is settled and grouped into a receipt. */
  category?: PastStayCharge['category'];
};

/**
 * Charges the property posted itself: amenities and hotel-operated services
 * the guest never booked through the app. They arrive over the middleware, so
 * the app reports them rather than creating them.
 */
const POSTED_ROOM_CHARGES: RoomCharge[] = [
  { id: 'posted-transfer', date: 'NOV 9', title: 'Airport transfer', detail: 'Hotel arranged', amount: '₱1,200', category: 'Hotel services' },
  { id: 'posted-dining', date: 'NOV 10', title: 'In-room dining', detail: 'Dinner · 2 guests', amount: '₱850', category: 'Dining' },
  { id: 'posted-laundry', date: 'NOV 10', title: 'Laundry service', detail: 'Hotel operated', amount: '₱1,000', category: 'Hotel services' },
];

/**
 * Every charge sitting on one booking's room: what the property posted, then
 * what the guest booked in the app.
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
