import { describe, expect, it } from 'vitest';
import {
  describeRoomAssignment,
  ANONYMOUS_SESSION,
  CHECK_IN_FROM,
  PAST_STAYS,
  CHECK_OUT_BY,
  MINI_APP_CATEGORIES,
  MOCK_SESSION,
  RESTAURANTS,
  SERVICES,
  availableDietaryTags,
  availableOperators,
  availableTypes,
  filterMenu,
  filterServices,
  SCENARIOS,
  SCREENS,
  UPCOMING_BOOKING_FIXTURE,
  connectBooking,
  createAccountSession,
  describeCheckoutCountdown,
  getCancellationState,
  getNotifications,
  canReportRoomReady,
  applyPrototypeStayState,
  getPrototypeStayState,
  ESTATE_PROPERTIES,
  findEstateProperty,
  propertyFromRate,
  countNightsBetween,
  quoteStay,
  createStayBooking,
  addStayBooking,
  toFinishedStay,
  findBookingByLookup,
  findProfileByLookup,
  restoreProfileSession,
  maskEmail,
  maskMobile,
  GUEST_PROFILE,
  describeStayStatus,
  getStayEntries,
  hasStayStarted,
  isStayUnderWay,
  summarisePastStay,
  getOfflineAction,
  getPostAuthScreen,
  getVenueCartSummary,
  markRoomReady,
  parsePesoAmount,
  signInSession,
  signOutSession,
} from './prototype-model';
import type { Booking } from './prototype-model';
import {
  getHomeVariant,
  getPrimaryBooking,
} from './prototype-model';

describe('guest app prototype model', () => {
  it('contains the complete stay-only screen inventory', () => {
    expect(SCREENS).toHaveLength(51);
    expect(new Set(SCREENS.map((screen) => screen.id)).size).toBe(51);
    expect(SCREENS.find((s) => s.id === 'stay-entry')?.title).toBe('Booking receipt');
    expect(SCREENS.find((s) => s.id === 'stay-detail')?.group).toBe('Account');
    // My Stay subsumed the old `my-bookings` screen rather than sitting beside
    // it -- two screens listing the same service bookings was the duplication
    // the nav pass exists to remove.
    expect(SCREENS.find((s) => s.id === 'my-stay')?.title).toBe('My stay');
    expect(SCREENS.some((s) => (s.id as string) === 'my-bookings')).toBe(false);
    expect(SCREENS.find((s) => s.id === 'notifications')?.group).toBe('Stay');
    expect(SCREENS.find((s) => s.id === 'marketplace')?.title).toBe('Explore');
    expect(SCREENS.find((s) => s.id === 'restaurant-menu')?.group).toBe('Stay');
    expect(SCREENS.find((s) => s.id === 'restaurant-cart')?.group).toBe('Stay');
    expect(SCREENS.find((s) => s.id === 'dining-order-confirmation')?.group).toBe('Stay');
    expect(SCREENS.find((s) => s.id === 'room-preferences')?.group).toBe('Account');
    expect(SCREENS.find((s) => s.number === 20)).toMatchObject({
      id: 'arrival-handoff',
      title: 'Arrival handoff',
    });
  });

  it('exposes every guided flow from A through I', () => {
    expect(SCENARIOS.map((scenario) => scenario.id)).toEqual([
      'A', 'B', 'D', 'E', 'F', 'G', 'H', 'I',
    ]);
  });

  describe('room assignment', () => {
    const base = { ...UPCOMING_BOOKING_FIXTURE };

    it('reads as pending with no room, and does not promise a number', () => {
      const view = describeRoomAssignment({ ...base, roomAssignment: 'pending', roomNumber: undefined });
      expect(view.state).toBe('pending');
      expect(view.roomNumber).toBeUndefined();
      expect(view.canGoUp).toBe(false);
      expect(view.detail).toMatch(/allocates rooms from its own inventory/);
    });

    it('promises a readiness moment only where the PMS reports one', () => {
      const capable = describeRoomAssignment({ ...base, roomAssignment: 'assigned', roomNumber: '512' }, '2026-11-08');
      expect(capable.headline).toBe('Room 512 is yours');
      expect(capable.detail).toMatch(/we'll tell you the moment it is ready/i);
      expect(capable.canGoUp).toBe(false);

      // A legacy PMS can name the room but not its housekeeping status, so the
      // guest is sent to the desk instead of waiting on a signal never sent.
      const legacy = describeRoomAssignment({
        ...base, roomAssignment: 'assigned', roomNumber: '512', reportsRoomReadiness: false,
      }, '2026-11-08');
      expect(legacy.detail).toMatch(/Collect your key at the desk/);
      expect(legacy.detail).not.toMatch(/we'll tell you/i);
      expect(legacy.canGoUp).toBe(false);
    });

    it('lets the guest go up once ready, and names the release time when known', () => {
      const timed = describeRoomAssignment({
        ...base, roomAssignment: 'ready', roomNumber: '512', roomReadyAt: '2:15 PM',
      });
      expect(timed.headline).toBe('Room 512 is ready');
      expect(timed.detail).toBe('Released at 2:15 PM. Go straight up.');
      expect(timed.canGoUp).toBe(true);

      const untimed = describeRoomAssignment({ ...base, roomAssignment: 'ready', roomNumber: '512' });
      expect(untimed.detail).toBe('Go straight up.');
    });

    it('offers a real action only where the guest has one, and stays quiet otherwise', () => {
      // Waiting on the property: a full-width button would imply the app can
      // hurry an allocation it does not control.
      for (const waiting of [
        describeRoomAssignment({ ...base, roomAssignment: 'pending', roomNumber: undefined }),
        describeRoomAssignment({ ...base, roomAssignment: 'assigned', roomNumber: '512' }),
      ]) {
        expect(waiting.action.tone).toBe('quiet');
        expect(waiting.action.screen).toBe('repeat-review');
      }

      const ready = describeRoomAssignment({ ...base, roomAssignment: 'ready', roomNumber: '512' });
      expect(ready.action.tone).toBe('primary');
      expect(ready.action.screen).toBe('arrival-handoff');
      expect(ready.action.label).toBe('Head to your room');
    });

    it('labels the status tag from the same place as the headline', () => {
      expect(describeRoomAssignment({ ...base, roomAssignment: 'pending', roomNumber: undefined }).statusLabel).toBe('Pre-registered');
      expect(describeRoomAssignment({ ...base, roomAssignment: 'assigned', roomNumber: '512' }).statusLabel).toBe('Assigned');
      expect(describeRoomAssignment({ ...base, roomAssignment: 'ready', roomNumber: '512' }).statusLabel).toBe('Ready');
    });

    it('infers a state for bookings that carry none, so old fixtures stay valid', () => {
      expect(describeRoomAssignment({ ...base, roomAssignment: undefined, roomNumber: undefined }).state).toBe('pending');
      // Allocated for a stay that has not begun: assigned, not released. The
      // dates decide this now, so the reference window is stated explicitly.
      expect(describeRoomAssignment({ ...base, roomAssignment: undefined, roomNumber: '304' }, '2026-11-08').state).toBe('assigned');
      // Already in the room is the definition of released.
      expect(describeRoomAssignment({ ...base, roomAssignment: undefined, roomNumber: '304' }, '2026-11-11').state).toBe('ready');
    });

    it('never reports a room as ready without a number to report', () => {
      const view = describeRoomAssignment({ ...base, roomAssignment: 'ready', roomNumber: undefined });
      expect(view.state).toBe('pending');
      expect(view.canGoUp).toBe(false);
    });

    it('marks only an assigned, readiness-capable room as ready', () => {
      const assigned = { ...base, roomAssignment: 'assigned' as const, roomNumber: '512' };

      expect(markRoomReady(assigned, '2:15 PM')).toEqual({
        ...assigned,
        roomAssignment: 'ready',
        roomReadyAt: '2:15 PM',
      });
    });

    it('does not invent readiness for an ineligible booking', () => {
      const pending = { ...base, roomAssignment: 'pending' as const, roomNumber: undefined };
      const legacy = {
        ...base,
        roomAssignment: 'assigned' as const,
        roomNumber: '512',
        reportsRoomReadiness: false,
      };
      const ready = { ...base, roomAssignment: 'ready' as const, roomNumber: '512' };
      const completed = {
        ...base,
        status: 'completed' as const,
        roomAssignment: 'assigned' as const,
        roomNumber: '512',
      };

      expect(markRoomReady(pending, '2:15 PM')).toBe(pending);
      expect(markRoomReady(legacy, '2:15 PM')).toBe(legacy);
      expect(markRoomReady(ready, '2:15 PM')).toBe(ready);
      expect(markRoomReady(completed, '2:15 PM')).toBe(completed);
    });
  });

  it('allows self-service cancellation before a service cutoff', () => {
    expect(getCancellationState(30, 24)).toBe('self-service');
  });

  it('routes cancellation to the front desk after a service cutoff', () => {
    expect(getCancellationState(4, 24)).toBe('front-desk');
  });

  it('queues communication offline but blocks capacity and money actions', () => {
    expect(getOfflineAction('chat')).toBe('queued');
    expect(getOfflineAction('pre-registration')).toBe('queued');
    expect(getOfflineAction('service-booking')).toBe('blocked');
    expect(getOfflineAction('payment')).toBe('blocked');
    expect(getOfflineAction('cached-stay')).toBe('available');
    expect(getOfflineAction('authentication')).toBe('blocked');
  });

  it('calculates a venue cart from menu item quantities', () => {
    const menu = RESTAURANTS[0]!.menu;
    const summary = getVenueCartSummary(menu, {
      'a1b-calamari': 2,
      'a1b-ribeye': 1,
      'a1b-1': 0,
    });

    expect(parsePesoAmount('₱1,850')).toBe(1850);
    expect(summary.itemCount).toBe(3);
    expect(summary.total).toBe(2810);
    expect(summary.formattedTotal).toBe('₱2,810');
    expect(summary.items).toEqual([
      expect.objectContaining({ id: 'a1b-calamari', quantity: 2 }),
      expect.objectContaining({ id: 'a1b-ribeye', quantity: 1 }),
    ]);
  });
});

const makeBooking = (overrides: Partial<Booking> = {}): Booking => ({
  id: 'booking-default',
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
  ...overrides,
});

describe('booking-aware home derivation', () => {
  it('selects an explicitly active booking before an earlier upcoming booking', () => {
    const upcoming = makeBooking({
      id: 'upcoming',
      checkIn: '2026-10-01',
    });
    const active = makeBooking({
      id: 'active',
      status: 'active',
      roomNumber: '304',
    });

    expect(getPrimaryBooking([upcoming, active], 'active')?.id).toBe('active');
    expect(getHomeVariant([upcoming, active], 'active')).toBe('active');
  });

  it('selects the nearest upcoming booking when no active booking exists', () => {
    const later = makeBooking({
      id: 'later',
      checkIn: '2026-12-01',
    });
    const nearest = makeBooking({
      id: 'nearest',
      checkIn: '2026-10-01',
    });

    expect(getPrimaryBooking([later, nearest])?.id).toBe('nearest');
    expect(getHomeVariant([nearest])).toBe('upcoming');
    expect(getHomeVariant([later, nearest])).toBe('multiple-upcoming');
  });

  it('selects the latest completed booking and distinguishes completed and empty states', () => {
    const older = makeBooking({
      id: 'older',
      status: 'completed',
      checkIn: '2026-01-01',
      checkOut: '2026-01-04',
    });
    const latest = makeBooking({
      id: 'latest',
      status: 'completed',
      checkIn: '2026-05-01',
      checkOut: '2026-05-04',
    });

    expect(getPrimaryBooking([older, latest])?.id).toBe('latest');
    expect(getHomeVariant([older, latest])).toBe('completed');
    expect(getPrimaryBooking([])).toBeUndefined();
    expect(getHomeVariant([])).toBe('empty');
  });
});

describe('account sessions', () => {
  it('starts anonymous with no bookings', () => {
    expect(ANONYMOUS_SESSION.auth).toBe('anonymous');
    expect(ANONYMOUS_SESSION.accountStatus).toBe('none');
    expect(ANONYMOUS_SESSION.bookings).toHaveLength(0);
  });

  it('treats the mock session as an authenticated returning account', () => {
    expect(MOCK_SESSION.auth).toBe('authenticated');
    expect(MOCK_SESSION.accountStatus).toBe('returning');
  });

  it('creates an authenticated new account with Apple SSO and no bookings', () => {
    const session = createAccountSession('Mara Cruz', 'mara@example.com', 'apple');

    expect(session.auth).toBe('authenticated');
    expect(session.accountStatus).toBe('new');
    expect(session.bookings).toHaveLength(0);
    expect(session.guestName).toBe('Mara Cruz');
    expect(session.email).toBe('mara@example.com');
    expect(session.authMethod).toBe('apple');
  });

  it('signs a returning account in with Google SSO and saved bookings', () => {
    const session = signInSession('google');

    expect(session.auth).toBe('authenticated');
    expect(session.accountStatus).toBe('returning');
    expect(session.bookings.length).toBeGreaterThan(0);
  });

  it('signs out back to the anonymous shape', () => {
    expect(signOutSession()).toEqual(ANONYMOUS_SESSION);
  });

  it('connects the upcoming booking once and is idempotent', () => {
    const once = connectBooking(ANONYMOUS_SESSION);

    expect(once.bookings).toHaveLength(1);
    expect(once.bookings[0]!.id).toBe(UPCOMING_BOOKING_FIXTURE.id);
    expect(connectBooking(once).bookings).toHaveLength(1);
  });
});

describe('getPostAuthScreen', () => {
  const newAccount = () =>
    createAccountSession('Mara Cruz', 'mara@example.com', 'apple');

  it('asks for a booking when the account has none', () => {
    expect(getPostAuthScreen(newAccount())).toBe('connect-booking');
  });

  it('welcomes a returning account back when pre-arrival is incomplete', () => {
    expect(getPostAuthScreen(signInSession('google'))).toBe('welcome-back');
  });

  it('sends a new account into pre-arrival once a booking is connected', () => {
    expect(getPostAuthScreen(connectBooking(newAccount()))).toBe('guest-details');
  });

  it('sends a completed pre-arrival to the stay overview', () => {
    const base = connectBooking(newAccount());
    const session = {
      ...base,
      bookings: base.bookings.map((booking) => ({
        ...booking,
        preArrivalCompleted: booking.preArrivalTotal,
      })),
    };

    expect(getPostAuthScreen(session)).toBe('stay-overview');
  });
});

describe('mini-app categories and restaurant menus', () => {
  it('exposes only on-property bookable categories', () => {
    expect(MINI_APP_CATEGORIES.map((c) => c.id)).toEqual([
      'dining',
      'spa',
      'entertainment',
      'services',
    ]);
  });

  it('sends every category to the on-property listing', () => {
    const byId = new Map(MINI_APP_CATEGORIES.map((c) => [c.id, c.screen]));

    for (const id of ['dining', 'spa', 'entertainment', 'services'] as const) {
      expect(byId.get(id)).toBe('category-listing');
    }
  });

  it('provides browsable restaurant menus with structured items and pricing', () => {
    expect(RESTAURANTS.length).toBeGreaterThanOrEqual(3);
    const apt1b = RESTAURANTS.find((r) => r.id === 'apartment-1b');
    expect(apt1b).toBeDefined();
    expect(apt1b?.menu.length).toBeGreaterThan(0);

    const categories = new Set(apt1b?.menu.map((item) => item.category));
    expect(categories.has('starters')).toBe(true);
    expect(categories.has('mains')).toBe(true);
    expect(categories.has('desserts')).toBe(true);
    expect(categories.has('drinks')).toBe(true);

    for (const item of apt1b!.menu) {
      expect(item.price).toMatch(/^₱\d/);
      expect(item.name.length).toBeGreaterThan(0);
      expect(item.description.length).toBeGreaterThan(0);
    }
  });

  it('defaults room preferences in anonymous and mock sessions', () => {
    expect(ANONYMOUS_SESSION.roomPreferences).toEqual({
      floor: 'Higher floor',
      bed: 'King bed',
      accessibility: [],
    });
    expect(MOCK_SESSION.roomPreferences.bed).toBe('King bed');
    // Four steps since room preferences left check-in for the profile.
    expect(UPCOMING_BOOKING_FIXTURE.preArrivalTotal).toBe(4);
  });
});

describe('listing controls', () => {
  const menu = RESTAURANTS[0]!.menu;

  it('derives dietary facets from the menu, so no pill can match nothing', () => {
    expect(availableDietaryTags(menu)).toEqual(['vegetarian', 'vegan', 'seafood']);
    // In-Room Dining carries no seafood; offering the pill there would be a lie.
    const inRoom = RESTAURANTS.find((venue) => venue.id === 'dining')!.menu;
    expect(availableDietaryTags(inRoom)).not.toContain('seafood');
    expect(availableDietaryTags([])).toEqual([]);
  });

  it('treats vegan dishes as vegetarian, so the broader filter catches them', () => {
    const vegan = menu.filter((item) => item.dietary?.includes('vegan'));
    expect(vegan.length).toBeGreaterThan(0);
    for (const dish of vegan) expect(dish.dietary).toContain('vegetarian');
  });

  it('narrows on every selected diet rather than widening', () => {
    const both = filterMenu(menu, { category: 'all', dietary: ['vegetarian', 'seafood'], sort: 'recommended' });
    // Nothing is both, so two pills must return nothing -- not the union.
    expect(both).toEqual([]);
  });

  it('combines the category tab with the dietary filter', () => {
    const rows = filterMenu(menu, { category: 'mains', dietary: ['vegetarian'], sort: 'recommended' });
    expect(rows.length).toBeGreaterThan(0);
    for (const dish of rows) {
      expect(dish.category).toBe('mains');
      expect(dish.dietary).toContain('vegetarian');
    }
  });

  it('sorts by price without disturbing the authored order', () => {
    const authored = filterMenu(menu, { category: 'all', dietary: [], sort: 'recommended' });
    expect(authored.map((item) => item.id)).toEqual(menu.map((item) => item.id));

    const asc = filterMenu(menu, { category: 'all', dietary: [], sort: 'price-asc' }).map((i) => parsePesoAmount(i.price));
    expect(asc).toEqual([...asc].sort((a, b) => a - b));

    const desc = filterMenu(menu, { category: 'all', dietary: [], sort: 'price-desc' }).map((i) => parsePesoAmount(i.price));
    expect(desc).toEqual([...desc].sort((a, b) => b - a));

    // Sorting must not mutate the source menu.
    expect(menu.map((item) => item.id)).toEqual(authored.map((item) => item.id));
  });

  it('offers an operator cut only where there is more than one operator', () => {
    // The contract, stated against a synthetic list so it survives the
    // catalogue growing: one distinct operator is a pill that changes nothing.
    expect(availableOperators([{ operator: 'Hotel operated' }])).toEqual([]);
    expect(availableOperators([
      { operator: 'Hotel operated' },
      { operator: 'Hotel operated' },
    ])).toEqual([]);
    expect(availableOperators([
      { operator: 'Hotel operated' },
      { operator: 'Third-party on property' },
      { operator: 'Hotel operated' },
    ])).toEqual(['Hotel operated', 'Third-party on property']);

    // And it holds over the real catalogue.
    for (const categoryId of ['spa', 'entertainment', 'services'] as const) {
      const rows = SERVICES.filter((service) => service.categoryId === categoryId);
      expect(availableOperators(rows).length).toBeGreaterThan(1);
    }
  });

  it('cuts a category by type, the catalogue answer to a cuisine filter', () => {
    const spa = SERVICES.filter((service) => service.categoryId === 'spa');
    const types = availableTypes(spa);
    expect(types.length).toBeGreaterThan(1);

    const massage = filterServices(spa, { operators: [], types: ['Spa & massage'], sort: 'recommended' });
    expect(massage.length).toBeGreaterThan(0);
    for (const service of massage) expect(service.category).toBe('Spa & massage');

    // Within one facet the selections widen; across facets they narrow.
    const twoTypes = filterServices(spa, { operators: [], types: ['Spa & massage', 'Facial & skin'], sort: 'recommended' });
    expect(twoTypes.length).toBeGreaterThan(massage.length);

    const crossed = filterServices(spa, { operators: ['Hotel operated'], types: ['Facial & skin'], sort: 'recommended' });
    expect(crossed).toEqual([]);
  });

  it('sorts service prices across their mixed formats', () => {
    const entertainment = SERVICES.filter((service) => service.categoryId === 'entertainment');
    const asc = filterServices(entertainment, { operators: [], types: [], sort: 'price-asc' });
    // "Complimentary" has no digits and must read as free, landing first.
    expect(asc[0]!.price).toBe('Complimentary');
    expect(asc.map((s) => parsePesoAmount(s.price))).toEqual([...asc.map((s) => parsePesoAmount(s.price))].sort((a, b) => a - b));
  });

  it('filters services by operator', () => {
    const spa = SERVICES.filter((service) => service.categoryId === 'spa');
    const hotel = filterServices(spa, { operators: ['Hotel operated'], types: [], sort: 'recommended' });
    expect(hotel.length).toBeGreaterThan(0);
    for (const service of hotel) expect(service.operator).toBe('Hotel operated');
    // No selection means no narrowing.
    expect(filterServices(spa, { operators: [], types: [], sort: 'recommended' })).toHaveLength(spa.length);
  });
});

describe('check-out countdown', () => {
  const stay = (overrides: Partial<Booking>): Booking => ({
    ...UPCOMING_BOOKING_FIXTURE,
    status: 'active',
    roomNumber: '304',
    ...overrides,
  });

  it('counts the nights left in an active stay', () => {
    expect(describeCheckoutCountdown(stay({ checkOut: '2026-11-14' }), '2026-11-11')).toBe('Checks out in 3 days');
  });

  it('names tomorrow rather than counting to one', () => {
    expect(describeCheckoutCountdown(stay({ checkOut: '2026-11-12' }), '2026-11-11')).toBe('Checks out tomorrow');
  });

  it('gives the hour once check-out is today', () => {
    expect(describeCheckoutCountdown(stay({ checkOut: '2026-11-11' }), '2026-11-11')).toBe(`Checks out today at ${CHECK_OUT_BY}`);
  });

  it('counts down to arrival for a stay that has not started', () => {
    expect(describeCheckoutCountdown(stay({ status: 'upcoming', checkIn: '2026-11-14' }), '2026-11-11')).toBe('Checks in in 3 days');
    expect(describeCheckoutCountdown(stay({ status: 'upcoming', checkIn: '2026-11-12' }), '2026-11-11')).toBe('Checks in tomorrow');
    expect(describeCheckoutCountdown(stay({ status: 'upcoming', checkIn: '2026-11-11' }), '2026-11-11')).toBe(`Checks in today from ${CHECK_IN_FROM}`);
  });

  it('ignores a status that its own dates contradict', () => {
    // The reference stay runs 9-12 November and asserts `upcoming`. Branching
    // on status announced "Checks in today from 3:00 PM" directly above the
    // dates saying the stay began two days earlier.
    const midStay = stay({ status: 'upcoming', checkIn: '2026-11-09', checkOut: '2026-11-12' });

    expect(describeCheckoutCountdown(midStay, '2026-11-11')).toBe('Checks out tomorrow');
  });

  it('still names arrival day for a stay checking in today', () => {
    const arriving = stay({ status: 'upcoming', checkIn: '2026-11-11', checkOut: '2026-11-14' });

    expect(describeCheckoutCountdown(arriving, '2026-11-11')).toBe(`Checks in today from ${CHECK_IN_FROM}`);
  });

  it('reports a finished stay rather than a negative countdown', () => {
    expect(describeCheckoutCountdown(stay({ status: 'completed', checkOut: '2026-06-18' }), '2026-11-11')).toBe('Checked out');
  });
});

describe('notifications', () => {
  const confirmedMassage = {
    id: 'service-hilom-1',
    bookingId: 'HEN-241109',
    title: 'Hilom signature massage',
    scheduledFor: 'Tuesday · November 11 · 1:30 PM',
    scheduledDate: '2026-11-11',
    amount: '₱2,400',
    status: 'confirmed' as const,
  };

  it('announces a ready room, and only once it is ready', () => {
    const assigned = { ...UPCOMING_BOOKING_FIXTURE, roomNumber: '304', roomAssignment: 'assigned' as const };
    const ready = { ...assigned, roomAssignment: 'ready' as const };

    expect(getNotifications(MOCK_SESSION, assigned).some((n) => n.tone === 'room')).toBe(false);

    const roomReady = getNotifications(MOCK_SESSION, ready).find((n) => n.tone === 'room');
    expect(roomReady).toMatchObject({ title: 'Room 304 is ready', screen: 'stay-overview' });
  });

  it('raises one entry per confirmed service and none for a cancelled one', () => {
    const session = {
      ...MOCK_SESSION,
      serviceBookings: [
        confirmedMassage,
        { ...confirmedMassage, id: 'service-tour-1', title: 'Intramuros walking tour', status: 'cancelled' as const },
      ],
    };

    const bookings = getNotifications(session, UPCOMING_BOOKING_FIXTURE).filter((n) => n.tone === 'booking');
    expect(bookings).toHaveLength(1);
    expect(bookings[0]).toMatchObject({ title: 'Hilom signature massage confirmed', screen: 'my-stay' });
  });

  it('reports a dining order as in preparation rather than as a booking', () => {
    const session = {
      ...MOCK_SESSION,
      serviceBookings: [{
        ...confirmedMassage,
        id: 'service-dining-1',
        title: 'Apartment 1B',
        diningOrder: {
          venueId: 'apartment-1b',
          venueName: 'Apartment 1B',
          items: [{ id: 'ribeye', name: 'Grilled Angus Ribeye', unitPrice: '₱1,850', quantity: 1 }],
          fulfillment: { method: 'delivery' as const, timing: 'asap' as const, scheduledFor: 'As soon as possible' },
        },
      }],
    };

    const order = getNotifications(session, UPCOMING_BOOKING_FIXTURE).find((n) => n.title === 'Your order is being prepared');
    expect(order).toMatchObject({ tone: 'booking', screen: 'my-stay' });
  });

  it('raises a folio charge only for a stay that has started', () => {
    const charged = { ...MOCK_SESSION, folioTotal: '₱3,050' };
    const active = { ...UPCOMING_BOOKING_FIXTURE, status: 'active' as const, roomNumber: '304' };

    expect(getNotifications(charged, active).some((n) => n.tone === 'folio')).toBe(true);
    expect(getNotifications(charged, UPCOMING_BOOKING_FIXTURE).some((n) => n.tone === 'folio')).toBe(false);
    const unspent = { ...MOCK_SESSION, folioTotal: '₱0' };
    expect(getNotifications(unspent, { ...active, folioTotal: undefined }).some((n) => n.tone === 'folio')).toBe(false);
  });

  it('gives every entry a unique id so read state cannot collide', () => {
    const session = {
      ...MOCK_SESSION,
      folioTotal: '₱3,050',
      serviceBookings: [confirmedMassage, { ...confirmedMassage, id: 'service-tour-1', title: 'Intramuros walking tour' }],
    };
    const active = { ...UPCOMING_BOOKING_FIXTURE, status: 'active' as const, roomNumber: '304', roomAssignment: 'ready' as const };

    const ids = getNotifications(session, active).map((n) => n.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('has nothing to show before a booking is connected', () => {
    expect(getNotifications(ANONYMOUS_SESSION, undefined)).toEqual([]);
  });
});

describe('upcoming and past', () => {
  const stay: Booking = { ...UPCOMING_BOOKING_FIXTURE, status: 'active', roomNumber: '512' };

  const service = (id: string, scheduledDate: string, status: 'confirmed' | 'cancelled' | 'completed') => ({
    id,
    bookingId: stay.id,
    title: id,
    scheduledFor: scheduledDate,
    scheduledDate,
    amount: '₱1,000',
    status,
  });

  it('puts a confirmed booking whose date has passed into past', () => {
    // PROTOTYPE_TODAY is 2026-11-11. Status alone would have left this in
    // Upcoming forever, above bookings that had not happened yet.
    const session = { ...MOCK_SESSION, serviceBookings: [service('yesterday', '2026-11-10', 'confirmed')] };
    const { upcoming, past } = getStayEntries(session, stay);

    expect(upcoming).toHaveLength(0);
    expect(past.map((entry) => entry.id)).toEqual(['yesterday']);
  });

  it('keeps today and later in upcoming', () => {
    const session = {
      ...MOCK_SESSION,
      serviceBookings: [service('today', '2026-11-11', 'confirmed'), service('later', '2026-11-14', 'confirmed')],
    };

    expect(getStayEntries(session, stay).upcoming.map((e) => e.id)).toEqual(['today', 'later']);
  });

  it('treats cancelled and completed as past whatever their date says', () => {
    const session = {
      ...MOCK_SESSION,
      serviceBookings: [service('scrapped', '2026-11-20', 'cancelled'), service('done', '2026-11-20', 'completed')],
    };
    const { upcoming, past } = getStayEntries(session, stay);

    expect(upcoming).toHaveLength(0);
    expect(past).toHaveLength(2);
  });

  it('orders upcoming soonest first and past most recent first', () => {
    const session = {
      ...MOCK_SESSION,
      serviceBookings: [
        service('far', '2026-11-20', 'confirmed'),
        service('near', '2026-11-12', 'confirmed'),
        service('old', '2026-11-02', 'completed'),
        service('recent', '2026-11-09', 'completed'),
      ],
    };
    const { upcoming, past } = getStayEntries(session, stay);

    expect(upcoming.map((e) => e.id)).toEqual(['near', 'far']);
    expect(past.map((e) => e.id)).toEqual(['recent', 'old']);
  });
});

describe('past stays', () => {
  it('totals each stay to its room rate plus its charges', () => {
    for (const stay of PAST_STAYS) {
      const charges = stay.charges.reduce((sum, charge) => sum + parsePesoAmount(charge.amount), 0);
      expect(parsePesoAmount(stay.total)).toBe(parsePesoAmount(stay.roomRate) + charges);
    }
  });

  it('groups charges by category, largest spend first', () => {
    const summary = summarisePastStay(PAST_STAYS[0]!);
    const totals = summary.groups.map((group) => group.total);

    expect(totals).toEqual([...totals].sort((a, b) => b - a));
    expect(summary.groups.flatMap((g) => g.charges)).toHaveLength(PAST_STAYS[0]!.charges.length);
    expect(parsePesoAmount(summary.extras)).toBe(totals.reduce((a, b) => a + b, 0));
  });

  it('averages the room rate over the nights, not the extras', () => {
    const stay = PAST_STAYS[0]!;
    const summary = summarisePastStay(stay);

    expect(parsePesoAmount(summary.perNight)).toBe(Math.round(parsePesoAmount(stay.roomRate) / stay.nights));
  });
});

describe('has the stay started', () => {
  it('reads the dates, not an asserted status', () => {
    // The reference stay runs 9-12 November and still calls itself `upcoming`.
    // Mid-window it has charges, whatever its status field claims.
    const midStay: Booking = { ...UPCOMING_BOOKING_FIXTURE, status: 'upcoming' };

    expect(hasStayStarted(midStay, '2026-11-11')).toBe(true);
    expect(hasStayStarted(midStay, '2026-11-09')).toBe(true);
    expect(hasStayStarted(midStay, '2026-11-08')).toBe(false);
  });

  it('treats a completed stay as started whatever the clock says', () => {
    const done: Booking = { ...UPCOMING_BOOKING_FIXTURE, status: 'completed' };
    expect(hasStayStarted(done, '2020-01-01')).toBe(true);
  });
});

describe('room release eligibility', () => {
  const assigned: Booking = {
    ...UPCOMING_BOOKING_FIXTURE,
    roomNumber: '512',
    roomAssignment: 'assigned',
    checkIn: '2026-11-12',
    checkOut: '2026-11-15',
  };

  it('accepts a release up to check-out, regardless of an asserted status', () => {
    // `status` stays 'upcoming' throughout; only the clock moves.
    expect(canReportRoomReady(assigned, '2026-11-11')).toBe(true);
    expect(canReportRoomReady(assigned, '2026-11-12')).toBe(true);
    expect(canReportRoomReady(assigned, '2026-11-15')).toBe(true);
    // Past check-out there is no room left to release.
    expect(canReportRoomReady(assigned, '2026-11-16')).toBe(false);
  });

  it('refuses a stay already checked out of, since checkout can come early', () => {
    expect(canReportRoomReady({ ...assigned, status: 'completed' }, '2026-11-12')).toBe(false);
  });

  it('refuses a property that does not report housekeeping, and a room-less booking', () => {
    expect(canReportRoomReady({ ...assigned, reportsRoomReadiness: false }, '2026-11-12')).toBe(false);
    expect(canReportRoomReady({ ...assigned, roomNumber: undefined, roomAssignment: 'pending' }, '2026-11-12')).toBe(false);
  });

  it('refuses a room already released', () => {
    expect(canReportRoomReady({ ...assigned, roomAssignment: 'ready' }, '2026-11-12')).toBe(false);
  });

  it('only writes a release where one could arrive', () => {
    expect(markRoomReady(assigned, '2:15 PM', '2026-11-12').roomAssignment).toBe('ready');
    const late = markRoomReady(assigned, '2:15 PM', '2026-11-16');
    expect(late).toBe(assigned);
  });
});

describe('settlement wording', () => {
  const stay: Booking = { ...UPCOMING_BOOKING_FIXTURE, status: 'active', roomNumber: '512' };
  const service = (status: 'confirmed' | 'cancelled' | 'completed') => ({
    id: status,
    bookingId: stay.id,
    title: status,
    scheduledFor: 'x',
    scheduledDate: '2026-11-10',
    amount: '₱480',
    status,
  });

  it('never tells a guest a cancelled booking will be charged', () => {
    const session = { ...MOCK_SESSION, serviceBookings: [service('cancelled')] };
    const [entry] = getStayEntries(session, stay).past;

    expect(entry!.settlement).toBe('Cancelled · not charged');
  });

  it('uses past tense once the booking has happened', () => {
    const session = { ...MOCK_SESSION, serviceBookings: [service('completed')] };
    const [entry] = getStayEntries(session, stay).past;

    expect(entry!.settlement).toBe('Completed · charged to room 512');
  });

  it('says nothing while the booking is still ahead', () => {
    // The running total above the list already says the room settles at
    // checkout, so repeating it per card carried no per-card information.
    const session = { ...MOCK_SESSION, serviceBookings: [{ ...service('confirmed'), scheduledDate: '2026-11-14' }] };
    const [entry] = getStayEntries(session, stay).upcoming;

    expect(entry!.settlement).toBeUndefined();
  });
});

describe('stay status label', () => {
  const stay = (overrides: Partial<Booking> = {}): Booking => ({
    ...UPCOMING_BOOKING_FIXTURE,
    checkIn: '2026-11-12',
    checkOut: '2026-11-15',
    ...overrides,
  });

  it('says checked in once the guest is inside the window', () => {
    // `status` stays 'upcoming'; only the clock moves. This is the label that
    // announced "Upcoming" over a stay its own dates had under way.
    expect(describeStayStatus(stay(), '2026-11-12').label).toBe('Checked in');
    expect(describeStayStatus(stay(), '2026-11-14').label).toBe('Checked in');
  });

  it('says upcoming while the stay is still ahead', () => {
    expect(describeStayStatus(stay(), '2026-11-10')).toEqual({ status: 'upcoming', label: 'Upcoming' });
  });

  it('promotes a released room ahead of arrival', () => {
    const released = stay({ roomNumber: '512', roomAssignment: 'ready' });
    expect(describeStayStatus(released, '2026-11-10')).toEqual({ status: 'room-ready', label: 'Room ready' });
  });

  it('says checked out past the window, and for a closed stay', () => {
    expect(describeStayStatus(stay(), '2026-11-16').label).toBe('Checked out');
    expect(describeStayStatus(stay({ status: 'completed' }), '2026-11-12').label).toBe('Checked out');
  });
});

describe('connecting a booking', () => {
  it('takes the guest name from the reservation', () => {
    // The lookup path asks for a surname to match on and never stored it, so
    // the session came away with no name at all.
    expect(ANONYMOUS_SESSION.guestName).toBe('');
    expect(connectBooking(ANONYMOUS_SESSION).guestName).toBe('Ana Santos');
  });

  it('keeps a name the session already had', () => {
    // The room-QR path collects a surname before it connects anything.
    const typed = { ...ANONYMOUS_SESSION, guestName: 'Reyes' };
    expect(connectBooking(typed).guestName).toBe('Reyes');
  });

  it('is idempotent, so reconnecting does not duplicate the stay', () => {
    const once = connectBooking(ANONYMOUS_SESSION);
    expect(connectBooking(once)).toBe(once);
  });
});

describe('room card copy once the stay has started', () => {
  it('stops promising a pre-arrival release to a guest already in the building', () => {
    // The card sat directly under a "Checked in" badge telling the guest
    // housekeeping would release the room "before check-in".
    const midStay: Booking = { ...UPCOMING_BOOKING_FIXTURE, roomAssignment: 'assigned', roomNumber: '512' };

    expect(describeRoomAssignment(midStay, '2026-11-11').detail).toMatch(/Collect your key/i);
    expect(describeRoomAssignment(midStay, '2026-11-11').detail).not.toMatch(/before check-in/i);
    // Before arrival it still promises the signal.
    expect(describeRoomAssignment(midStay, '2026-11-08').detail).toMatch(/before check-in/i);
  });
});

describe('booking lookup matching', () => {
  it('refuses details that match no reservation', () => {
    // It used to answer anything, so a stranger's reference returned Ana
    // Santos's name, dates, room and booking source.
    expect(findBookingByLookup('ZZZZ-000000')).toBeUndefined();
    expect(findBookingByLookup('')).toBeUndefined();
  });

  it('accepts the confirmation number, however it is punctuated', () => {
    expect(findBookingByLookup('HEN-241109')?.id).toBe('HEN-241109');
    expect(findBookingByLookup('hen 241109')?.id).toBe('HEN-241109');
    expect(findBookingByLookup('HEN241109')?.id).toBe('HEN-241109');
  });

  /*
    Reversed deliberately, and the surname is no longer even an argument. It
    used to be a key of its own, which made this screen a way for anyone to
    read a stranger's reservation off a guessed last name. It stays on the form
    as something the guest recognises, not as something the lookup trusts.
  */
  it('has no way in without the reference', () => {
    expect(findBookingByLookup('')).toBeUndefined();
    expect(findBookingByLookup('Santos')).toBeUndefined();
    expect(findBookingByLookup('unknown-ref')).toBeUndefined();
  });
});

describe('profile lookup and re-entry', () => {
  it('matches a reference the guest still has a live reservation for', () => {
    const match = findProfileByLookup('HEN-241109');

    expect(match?.property).toBe('The Henry Manila');
    expect(match?.booking?.id).toBe('HEN-241109');
    expect(match?.pastStay).toBeUndefined();
  });

  /*
    The point of the whole feature: a guest whose last stay ended eighteen
    months ago holds nothing but a receipt, and that reference has to be enough
    to start the way back in.
  */
  it('matches a reference from a stay that is long settled', () => {
    const match = findProfileByLookup('HEN-CEBU-250508');

    expect(match?.property).toBe('The Henry Cebu');
    expect(match?.pastStay?.id).toBe('HEN-CEBU-250508');
    expect(match?.booking).toBeUndefined();
  });

  it('matches a completed booking the session still carries', () => {
    expect(findProfileByLookup('HEN-CEBU-240615')?.booking?.status).toBe('completed');
  });

  it('normalises punctuation the same way the booking lookup does', () => {
    expect(findProfileByLookup('hen cebu 260314')?.reference).toBe('HEN-CEBU-260314');
  });

  it('refuses a reference that belongs to nobody', () => {
    expect(findProfileByLookup('ZZZZ-000000')).toBeUndefined();
    expect(findProfileByLookup('')).toBeUndefined();
  });

  it('masks the contact so the screen proves reach without disclosing it', () => {
    expect(maskEmail(GUEST_PROFILE.email)).toBe('a\u2022\u2022\u2022@example.com');
    expect(maskMobile(GUEST_PROFILE.mobile)).toBe('+63 917 \u2022\u2022\u2022 0142');
  });

  it('leaves a contact it cannot parse alone rather than mangling it', () => {
    expect(maskEmail('not-an-address')).toBe('not-an-address');
    expect(maskMobile('09175550142')).toBe('09175550142');
  });

  /*
    Verifying restores the profile, not the one stay that was looked up --
    otherwise a returning guest would have to enter a reference per stay to
    reassemble their own history.
  */
  it('restores the whole profile once the code is verified', () => {
    const session = restoreProfileSession();

    expect(session.auth).toBe('authenticated');
    expect(session.accountStatus).toBe('returning');
    expect(session.guestName).toBe('Ana Santos');
    expect(session.bookings.map((booking) => booking.id)).toEqual([
      'HEN-241109',
      'HEN-CEBU-240615',
    ]);
  });
});


describe('prototype stay-state switch', () => {
  const states = ['signed-out', 'pre-arrival', 'live', 'finished'] as const;

  it('round-trips every state it can build', () => {
    for (const state of states) {
      expect(getPrototypeStayState(applyPrototypeStayState(state))).toBe(state);
    }
  });

  it('puts a pre-arrival stay clear of the prototype clock', () => {
    const session = applyPrototypeStayState('pre-arrival');
    const booking = session.bookings[0]!;

    // A stay whose dates straddle today would render as checked in however its
    // status reads, which is the trap the reference fixture falls into.
    expect(isStayUnderWay(booking)).toBe(false);
    expect(getHomeVariant(session.bookings)).toBe('upcoming');
  });

  it('opens the live surface on a live stay', () => {
    const session = applyPrototypeStayState('live');
    const booking = session.bookings[0]!;

    expect(isStayUnderWay(booking)).toBe(true);
    expect(getHomeVariant(session.bookings)).toBe('active');
    expect(booking.roomNumber).toBe('304');
  });

  /*
    The point of the finished state: everything that posts to a room the guest
    has left is closed, while the stay itself stays readable.
  */
  it('closes the live surface on a finished stay', () => {
    const session = applyPrototypeStayState('finished');
    const booking = session.bookings[0]!;

    expect(isStayUnderWay(booking)).toBe(false);
    expect(canReportRoomReady(booking)).toBe(false);
    expect(session.folioTotal).toBe('₱0');
    expect(session.serviceBookings.every((service) => service.status !== 'confirmed')).toBe(true);
  });

  it('keeps a finished stay legible rather than hiding it', () => {
    const session = applyPrototypeStayState('finished');

    expect(getHomeVariant(session.bookings)).toBe('completed');
    expect(session.bookings[0]!.property).toBe('The Henry Manila');
    expect(session.auth).toBe('authenticated');
  });

  it('signs the guest out with nothing left behind', () => {
    const session = applyPrototypeStayState('signed-out');

    expect(session.auth).toBe('anonymous');
    expect(session.bookings).toEqual([]);
    expect(session.serviceBookings).toEqual([]);
  });
});


describe('the estate and booking another stay', () => {
  const manila = findEstateProperty('manila')!;
  const king = manila.roomTypes.find((room) => room.id === 'manila-king')!;

  it('offers the three properties a guest can come back to', () => {
    expect(ESTATE_PROPERTIES.map((property) => property.name)).toEqual([
      'The Henry Manila',
      'The Henry Cebu',
      'The Henry Dumaguete',
    ]);
  });

  it('quotes "from" off the cheapest room, not the first listed', () => {
    expect(propertyFromRate(manila)).toBe('₱6,200');
  });

  it('counts nights, and refuses to count backwards', () => {
    expect(countNightsBetween('2026-12-01', '2026-12-04')).toBe(3);
    expect(countNightsBetween('2026-12-04', '2026-12-01')).toBe(0);
    expect(countNightsBetween('2026-12-01', '2026-12-01')).toBe(0);
  });

  /*
    12% matches the tax already shown on `rate-detail` for an OTA booking. A
    direct booking that appeared to be taxed differently would read as a bug.
  */
  it('quotes room, tax and total at the same rate the app already shows', () => {
    const quote = quoteStay(king, 3);

    expect(quote.roomTotal).toBe('₱18,600');
    expect(quote.taxes).toBe('₱2,232');
    expect(quote.total).toBe('₱20,832');
  });

  it('mints a direct booking the guest has to pre-register for again', () => {
    const booking = createStayBooking({
      property: manila,
      roomType: king,
      checkIn: '2026-12-01',
      checkOut: '2026-12-04',
      guests: 2,
      guestName: 'Ana Santos',
    });

    expect(booking.id).toBe('HEN-MNL-261201');
    expect(booking.source).toBe('Direct booking');
    expect(booking.status).toBe('upcoming');
    expect(booking.roomRate).toBe('₱18,600');
    // A different property holds its own registration record and has never
    // seen this guest's ID.
    expect(booking.preArrivalCompleted).toBe(0);
    expect(booking.roomNumber).toBeUndefined();
  });

  it('makes the new booking the one the app is about', () => {
    const booking = createStayBooking({
      property: manila,
      roomType: king,
      checkIn: '2026-12-01',
      checkOut: '2026-12-04',
      guests: 2,
      guestName: 'Ana Santos',
    });
    const session = addStayBooking(applyPrototypeStayState('finished'), booking);

    expect(session.activeBookingId).toBe(booking.id);
    expect(getPrimaryBooking(session.bookings, session.activeBookingId)?.id).toBe(booking.id);
  });
});

describe('a finished stay read as a receipt', () => {
  const session = applyPrototypeStayState('finished');
  const booking = session.bookings[0]!;

  it('counts the room itself, not only what was charged against it', () => {
    const stay = toFinishedStay(session, booking);

    expect(stay.roomRate).toBe('₱18,600');
    // ₱18,600 room + ₱14,550 charged against it: what the property posted plus
    // everything the guest booked in the app during the stay.
    expect(stay.total).toBe('₱33,150');
    expect(stay.nights).toBe(3);
  });

  /*
    `getRoomCharges` drops anything not `confirmed`, which is every service on a
    stay that is over. A receipt built from it would report a stay with nothing
    in it.
  */
  it('keeps services that have since completed', () => {
    const withService = {
      ...session,
      serviceBookings: [{
        id: 'svc-1',
        bookingId: booking.id,
        title: 'Hilom signature massage',
        scheduledFor: 'Nov 3 · 2:00 PM',
        scheduledDate: '2026-11-03',
        amount: '₱2,400',
        status: 'completed' as const,
      }],
    };

    const stay = toFinishedStay(withService, booking);
    const titles = stay.charges.map((charge) => charge.title);

    expect(titles).toContain('Hilom signature massage');
    expect(stay.charges.find((c) => c.id === 'svc-1')?.category).toBe('Spa & wellness');
    expect(stay.total).toBe('₱24,050');
  });

  it('leaves a cancelled service off the receipt', () => {
    const withCancelled = {
      ...session,
      serviceBookings: [{
        id: 'svc-2',
        bookingId: booking.id,
        title: 'Hilom signature massage',
        scheduledFor: 'Nov 3 · 2:00 PM',
        scheduledDate: '2026-11-03',
        amount: '₱2,400',
        status: 'cancelled' as const,
      }],
    };

    expect(toFinishedStay(withCancelled, booking).total).toBe('₱21,650');
  });

  it('groups the way the stay-detail receipt already does', () => {
    const summary = summarisePastStay(toFinishedStay(session, booking));

    expect(summary.groups.map((group) => group.category)).toContain('Hotel services');
    expect(summary.extras).toBe('₱14,550');
  });
});
