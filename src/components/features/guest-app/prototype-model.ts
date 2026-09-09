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
  screen(16, 'Account', 'room-preferences', 'Room preferences'),
  screen(17, 'Pre-arrival', 'additional-guests', 'Additional guests'),
  screen(18, 'Pre-arrival', 'repeat-review', 'Review your details'),
  screen(19, 'Pre-arrival', 'rate-detail', 'Room and rate'),
  screen(20, 'Pre-arrival', 'early-check-in', 'Early check-in'),
  screen(21, 'Pre-arrival', 'insurance-offer', 'Travel insurance'),
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
};

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
  nextPreArrivalStep: 'Select room preferences',
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

export type CancellationState = 'self-service' | 'front-desk';

export function getCancellationState(hoursUntilService: number, cutoffHours: number): CancellationState {
  return hoursUntilService >= cutoffHours ? 'self-service' : 'front-desk';
}

export type MiniAppCategoryId = 'dining' | 'spa' | 'entertainment' | 'services';

export type MiniAppCategory = {
  id: MiniAppCategoryId;
  title: string;
  subtitle: string;
  badge: string;
  tone: 'sand' | 'sage' | 'sun' | 'blue';
};

export const MINI_APP_CATEGORIES: MiniAppCategory[] = [
  {
    id: 'dining',
    title: 'Food & Drink',
    subtitle: 'Restaurants, in-room dining, bars',
    badge: '3 venues',
    tone: 'sand',
  },
  {
    id: 'spa',
    title: 'Spa & Wellness',
    subtitle: 'Hilom massage, therapies & scrubs',
    badge: 'On property',
    tone: 'sage',
  },
  {
    id: 'entertainment',
    title: 'Entertainment & Tours',
    subtitle: 'Day tours, live music & walks',
    badge: 'Curated',
    tone: 'sun',
  },
  {
    id: 'services',
    title: 'Hotel Services',
    subtitle: 'Transfers, rentals & amenities',
    badge: 'Front desk',
    tone: 'blue',
  },
];

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
