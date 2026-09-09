import { describe, expect, it } from 'vitest';
import {
  ANONYMOUS_SESSION,
  MINI_APP_CATEGORIES,
  MOCK_SESSION,
  RESTAURANTS,
  SCENARIOS,
  SCREENS,
  UPCOMING_BOOKING_FIXTURE,
  connectBooking,
  createAccountSession,
  getCancellationState,
  getOfflineAction,
  getPostAuthScreen,
  getVenueCartSummary,
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
  it('contains the complete 42-screen inventory including restaurant ordering', () => {
    expect(SCREENS).toHaveLength(42);
    expect(new Set(SCREENS.map((screen) => screen.id)).size).toBe(42);
    expect(SCREENS.find((s) => s.id === 'restaurant-menu')?.group).toBe('Stay');
    expect(SCREENS.find((s) => s.id === 'restaurant-cart')?.group).toBe('Stay');
    expect(SCREENS.find((s) => s.id === 'dining-order-confirmation')?.group).toBe('Stay');
    expect(SCREENS.find((s) => s.id === 'room-preferences')?.group).toBe('Account');
  });

  it('exposes every guided flow from A through I', () => {
    expect(SCENARIOS.map((scenario) => scenario.id)).toEqual([
      'A', 'B', 'D', 'E', 'F', 'G', 'H', 'I',
    ]);
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
    expect(UPCOMING_BOOKING_FIXTURE.preArrivalTotal).toBe(5);
  });
});
