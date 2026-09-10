import { describe, expect, it } from 'vitest';
import {
  describeRoomAssignment,
  ANONYMOUS_SESSION,
  CHECK_IN_FROM,
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
  getOfflineAction,
  getPostAuthScreen,
  getVenueCartSummary,
  markRoomReady,
  parsePesoAmount,
  signInSession,
  signOutSession,
  verifyPendingSession,
} from './prototype-model';
import type { Booking } from './prototype-model';
import {
  getHomeVariant,
  getPrimaryBooking,
} from './prototype-model';

describe('guest app prototype model', () => {
  it('contains the complete 47-screen inventory including travel checkout', () => {
    expect(SCREENS).toHaveLength(47);
    expect(new Set(SCREENS.map((screen) => screen.id)).size).toBe(47);
    // My Stay subsumed the old `my-bookings` screen rather than sitting beside
    // it -- two screens listing the same service bookings was the duplication
    // the nav pass exists to remove.
    expect(SCREENS.find((s) => s.id === 'my-trip')?.title).toBe('My trip');
    expect(SCREENS.some((s) => (s.id as string) === 'my-bookings')).toBe(false);
    expect(SCREENS.find((s) => s.id === 'notifications')?.group).toBe('Stay');
    expect(SCREENS.find((s) => s.id === 'marketplace')?.title).toBe('Explore');
    expect(SCREENS.find((s) => s.id === 'travel')?.group).toBe('Travel');
    expect(SCREENS.find((s) => s.id === 'travel-search')?.group).toBe('Travel');
    expect(SCREENS.find((s) => s.id === 'travel-checkout')?.group).toBe('Travel');
    expect(SCREENS.find((s) => s.id === 'travel-confirmation')?.group).toBe('Travel');
    expect(SCREENS.find((s) => s.id === 'restaurant-menu')?.group).toBe('Stay');
    expect(SCREENS.find((s) => s.id === 'restaurant-cart')?.group).toBe('Stay');
    expect(SCREENS.find((s) => s.id === 'dining-order-confirmation')?.group).toBe('Stay');
    expect(SCREENS.find((s) => s.id === 'room-preferences')?.group).toBe('Account');
    expect(SCREENS.find((s) => s.number === 21)).toMatchObject({
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
      const capable = describeRoomAssignment({ ...base, roomAssignment: 'assigned', roomNumber: '512' });
      expect(capable.headline).toBe('Room 512 is yours');
      expect(capable.detail).toMatch(/we'll tell you the moment it is ready/i);
      expect(capable.canGoUp).toBe(false);

      // A legacy PMS can name the room but not its housekeeping status, so the
      // guest is sent to the desk instead of waiting on a signal never sent.
      const legacy = describeRoomAssignment({
        ...base, roomAssignment: 'assigned', roomNumber: '512', reportsRoomReadiness: false,
      });
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
      expect(describeRoomAssignment({ ...base, roomAssignment: undefined, roomNumber: '304' }).state).toBe('assigned');
      // Already in the room is the definition of released.
      expect(describeRoomAssignment({ ...base, roomAssignment: undefined, roomNumber: '304', status: 'active' }).state).toBe('ready');
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

  it('creates a new account pending verification and with no bookings', () => {
    const session = createAccountSession('Mara Cruz', 'mara@example.com', 'email-code');

    expect(session.auth).toBe('pending-verification');
    expect(session.accountStatus).toBe('new');
    expect(session.bookings).toHaveLength(0);
    expect(session.guestName).toBe('Mara Cruz');
    expect(session.email).toBe('mara@example.com');
    expect(session.authMethod).toBe('email-code');
  });

  it('signs a returning account in with its saved bookings', () => {
    const session = signInSession('email-code');

    expect(session.auth).toBe('pending-verification');
    expect(session.accountStatus).toBe('returning');
    expect(session.bookings.length).toBeGreaterThan(0);
  });

  it('promotes only a pending session, and is a no-op once authenticated', () => {
    const pending = createAccountSession('Mara Cruz', 'mara@example.com', 'apple');

    expect(verifyPendingSession(pending).auth).toBe('authenticated');
    expect(verifyPendingSession(ANONYMOUS_SESSION).auth).toBe('anonymous');
    expect(verifyPendingSession(verifyPendingSession(pending)).auth).toBe('authenticated');
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
    verifyPendingSession(createAccountSession('Mara Cruz', 'mara@example.com', 'email-code'));

  it('asks for a booking when the account has none', () => {
    expect(getPostAuthScreen(newAccount())).toBe('connect-booking');
  });

  it('welcomes a returning account back when pre-arrival is incomplete', () => {
    expect(getPostAuthScreen(verifyPendingSession(signInSession('email-code')))).toBe('welcome-back');
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
  it('exposes the 4 core experience categories', () => {
    expect(MINI_APP_CATEGORIES.map((c) => c.id)).toEqual([
      'dining',
      'spa',
      'entertainment',
      'services',
    ]);
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
    expect(bookings[0]).toMatchObject({ title: 'Hilom signature massage confirmed', screen: 'my-trip' });
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
    expect(order).toMatchObject({ tone: 'booking', screen: 'my-trip' });
  });

  it('raises a folio charge only for a stay that has started', () => {
    const charged = { ...MOCK_SESSION, folioTotal: '₱3,050' };
    const active = { ...UPCOMING_BOOKING_FIXTURE, status: 'active' as const, roomNumber: '304' };

    expect(getNotifications(charged, active).some((n) => n.tone === 'folio')).toBe(true);
    expect(getNotifications(charged, UPCOMING_BOOKING_FIXTURE).some((n) => n.tone === 'folio')).toBe(false);
    expect(getNotifications(MOCK_SESSION, active).some((n) => n.tone === 'folio')).toBe(false);
  });

  it('carries travel confirmations, which belong to the trip rather than the stay', () => {
    const session = {
      ...MOCK_SESSION,
      travelBookings: [{
        id: 'travel-1',
        reference: 'CBP-8842',
        categoryId: 'flights' as const,
        operator: 'Cebu Pacific',
        detail: '5J 561',
        meta: 'Mon, Nov 16 · 7:05 AM',
        route: 'Manila (MNL) → Cebu (CEB)',
        date: '2026-11-16',
        travellers: 2,
        amount: '₱4,280',
        status: 'confirmed' as const,
      }],
    };

    expect(getNotifications(session, UPCOMING_BOOKING_FIXTURE).find((n) => n.tone === 'travel')).toMatchObject({
      title: 'Cebu Pacific booking confirmed',
      screen: 'travel',
    });
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
