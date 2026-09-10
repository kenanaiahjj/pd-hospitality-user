import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import userEvent from '@testing-library/user-event';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { GuestAppPrototype } from './guest-app-prototype';
import {
  MOCK_SESSION,
  RESTAURANTS,
  SERVICES,
  TRAVEL_CATEGORIES,
  createAccountSession,
  verifyPendingSession,
} from './prototype-model';
import type { Booking, GuestSession } from './prototype-model';

const globalStyles = readFileSync(resolve(process.cwd(), 'src/app/globals.css'), 'utf8');
const guestStyles = readFileSync(resolve(process.cwd(), 'src/components/features/guest-app/guest-app-prototype.css'), 'utf8');

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

const sessionFor = (
  bookings: Booking[],
  overrides: Partial<GuestSession> = {},
): GuestSession => ({
  guestName: 'Ana Santos',
  email: 'ana@example.com',
  bookings,
  serviceBookings: [],
  folioTotal: '₱0',
  auth: 'authenticated',
  accountStatus: 'returning',
  roomPreferences: {
    floor: 'Higher floor',
    bed: 'King bed',
    accessibility: [],
  },
  travelBookings: [],
  additionalGuests: ['Marco Santos'],
  ...overrides,
});

const activeSession = sessionFor(
  [
    makeBooking({
      id: 'active',
      status: 'active',
      roomNumber: '304',
      folioTotal: '₱3,050',
    }),
  ],
  { activeBookingId: 'active', folioTotal: '₱3,050' },
);

const assignedSession = sessionFor([
  makeBooking({
    id: 'assigned',
    status: 'upcoming',
    preArrivalCompleted: 4,
    preArrivalTotal: 4,
    roomAssignment: 'assigned',
    roomNumber: '512',
  }),
]);

beforeAll(() => {
  Object.defineProperty(window, 'scrollTo', { value: vi.fn(), writable: true });
});

describe('GuestAppPrototype', () => {
  it('opens on a focused booking-first welcome screen without app chrome', () => {
    render(<GuestAppPrototype />);

    expect(screen.getAllByText('Cabana', { exact: true })).toHaveLength(2);
    expect(screen.getAllByText('Your Home Away From Home')).toHaveLength(2);
    expect(screen.getByRole('heading', { name: 'Welcome to your stay' })).toBeInTheDocument();
    expect(screen.getByText('Check in before arrival')).toBeInTheDocument();
    expect(screen.getByText('Skip the front desk paperwork')).toBeInTheDocument();
    expect(screen.getByText('View charges and hotel services')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Get started' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /create account/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /log in/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /room qr/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /hotel wi-fi/i })).toBeNull();
    expect(screen.queryByText(/13 destinations/i)).toBeNull();
    expect(screen.queryByRole('region', { name: /experience showcase/i })).toBeNull();
    expect(screen.queryByRole('banner')).toBeNull();
    expect(screen.queryByRole('navigation', { name: 'Primary navigation' })).toBeNull();
  });

  it('pages the welcome steps one at a time from the dots', async () => {
    const user = userEvent.setup();
    render(<GuestAppPrototype />);

    const dots = screen.getAllByRole('button', { name: /^Step 0\d:/ });
    expect(dots).toHaveLength(3);
    expect(dots[0]).toHaveAttribute('aria-current', 'step');

    await user.click(dots[2]);

    expect(dots[2]).toHaveAttribute('aria-current', 'step');
    expect(dots[0]).not.toHaveAttribute('aria-current');
    // Get started is never gated behind reaching the last step.
    expect(screen.getByRole('button', { name: 'Get started' })).toBeEnabled();
  });

  it('exposes only the current welcome step to assistive tech', async () => {
    const user = userEvent.setup();
    render(<GuestAppPrototype />);

    const stepOf = (title: string) => screen.getByText(title).closest('li');
    expect(stepOf('Check in before arrival')).toHaveAttribute('aria-hidden', 'false');
    expect(stepOf('Skip the front desk paperwork')).toHaveAttribute('aria-hidden', 'true');

    await user.click(screen.getByRole('button', { name: /^Step 02:/ }));

    expect(stepOf('Check in before arrival')).toHaveAttribute('aria-hidden', 'true');
    expect(stepOf('Skip the front desk paperwork')).toHaveAttribute('aria-hidden', 'false');
  });

  it('opens booking identification directly from the welcome action', async () => {
    const user = userEvent.setup();
    render(<GuestAppPrototype />);

    await user.click(screen.getByRole('button', { name: 'Get started' }));

    expect(screen.getByRole('heading', { name: 'Find your booking' })).toBeInTheDocument();
    expect(screen.getByLabelText(/Booking or confirmation number/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Last name/)).toBeInTheDocument();
  });

  it('connects a booking and reaches the matched-stay confirmation', () => {
    render(<GuestAppPrototype initialScreen="connect-booking" />);

    fireEvent.click(screen.getByRole('button', { name: 'Confirmation number' }));
    fireEvent.change(screen.getByLabelText(/Booking or confirmation number/), {
      target: { value: 'HEN-241109' },
    });
    fireEvent.change(screen.getByLabelText(/Last name/), {
      target: { value: 'Santos' },
    });
    fireEvent.submit(screen.getByRole('button', { name: 'Find booking' }).closest('form')!);

    expect(screen.getByRole('heading', { name: 'Is this your stay?' })).toBeInTheDocument();
    expect(screen.getByText('The Henry Manila')).toBeInTheDocument();
    expect(screen.getByText('Booking HEN-241109')).toBeInTheDocument();
    expect(screen.getByText('Booked through')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Use this booking' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Use a different booking' })).toBeInTheDocument();
  });

  it('opens the active stay home as soon as a room QR links the stay', async () => {
    const user = userEvent.setup();
    render(<GuestAppPrototype initialScreen="room-qr-landing" />);

    await user.type(screen.getByLabelText(/Last name/), 'Santos');
    await user.click(screen.getByRole('button', { name: 'Link my stay' }));

    expect(screen.getByTestId('guest-home-active')).toBeInTheDocument();
    expect(screen.getByText(/Welcome, Santos · Room 304/)).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'You’re checked in' })).toBeNull();
  });

  it('opens home after confirming a booking with no check-in work remaining', async () => {
    const user = userEvent.setup();
    const readyBooking = makeBooking({
      id: 'HEN-241109',
      preArrivalCompleted: 4,
      preArrivalTotal: 4,
    });
    render(
      <GuestAppPrototype
        initialScreen="booking-found"
        initialSession={sessionFor([readyBooking], { auth: 'anonymous', accountStatus: 'none' })}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Use this booking' }));

    expect(screen.getByTestId('guest-home-upcoming')).toBeInTheDocument();
  });

  it('names the pre-arrival handoff for the screen it renders', () => {
    render(
      <GuestAppPrototype
        initialScreen="arrival-handoff"
        initialSession={MOCK_SESSION}
      />,
    );

    expect(screen.getByRole('heading', { name: 'You’re ready for arrival' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Continue to arrival' })).toBeInTheDocument();
  });

  it('uses the booking-first voice when no stay is attached', () => {
    render(<GuestAppPrototype initialScreen="no-booking" />);

    expect(screen.getByRole('heading', { name: 'Connect a hotel booking' })).toBeInTheDocument();
    expect(screen.getByText('Cabana connects to confirmed hotel bookings.')).toBeInTheDocument();
    expect(screen.getByText('Try your confirmation number or ask the front desk for a link.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Contact front desk' })).toBeInTheDocument();
  });

  it('keeps the booking connection copy concise and destination-specific', async () => {
    const user = userEvent.setup();
    const { unmount } = render(<GuestAppPrototype initialScreen="connect-booking" />);

    expect(screen.getByText('Choose how to connect your stay.')).toBeInTheDocument();
    expect(screen.queryByText(/You’ll need a booking first/)).toBeNull();
    await user.click(screen.getByRole('button', { name: 'Confirmation number' }));

    expect(screen.getByText('Enter the number from your booking confirmation.')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('HEN-241109')).toBeInTheDocument();
    expect(screen.getByText('Hotel, Agoda, or Booking.com reference')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Find another way' })).toBeInTheDocument();

    unmount();
    render(<GuestAppPrototype initialScreen="lookup-fallback" />);
    expect(screen.getByRole('heading', { name: 'Use more booking details' })).toBeInTheDocument();
    expect(screen.getByText('Enter the details from your booking.')).toBeInTheDocument();
    expect(screen.queryByText('No match yet')).toBeNull();
    await user.click(screen.getByRole('button', { name: 'Continue to front desk' }));

    expect(screen.getByRole('heading', { name: 'Let the front desk connect you' })).toBeInTheDocument();
    expect(screen.getByText('Ask for a secure link or a 6-digit code.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Call front desk' })).toBeInTheDocument();
  });

  it('returns a pre-arrival guest to the upcoming home after registration', async () => {
    const user = userEvent.setup();
    render(<GuestAppPrototype initialScreen="prereg-complete" initialSession={MOCK_SESSION} />);

    expect(screen.getByRole('button', { name: /view my stay/i })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /view my stay/i }));

    expect(screen.getByTestId('guest-home-upcoming')).toBeInTheDocument();
  });

  it('opens the upcoming home immediately after online pre-arrival completion', async () => {
    const user = userEvent.setup();
    render(<GuestAppPrototype initialScreen="early-check-in" initialSession={MOCK_SESSION} />);

    await user.click(screen.getByRole('button', { name: 'Keep standard 3:00 PM' }));

    expect(screen.getByTestId('guest-home-upcoming')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'You’re ready for arrival' })).toBeNull();
  });

  it.each([
    ['upcoming', [makeBooking({ status: 'upcoming' })]],
    [
      'multiple-upcoming',
      [
        makeBooking({ id: 'near', checkIn: '2026-10-01' }),
        makeBooking({ id: 'far', checkIn: '2026-12-01' }),
      ],
    ],
    ['completed', [makeBooking({ status: 'completed', checkIn: '2026-05-01' })]],
    ['empty', []],
  ])('renders the %s home state', (variant, bookings) => {
    render(
      <GuestAppPrototype
        initialScreen="stay-overview"
        initialSession={sessionFor(bookings)}
      />,
    );

    expect(screen.getByTestId('guest-home-' + variant)).toBeInTheDocument();
  });

  it('renders active stay actions and booking-linked room context', () => {
    const active = makeBooking({
      id: 'active',
      status: 'active',
      roomNumber: '304',
      folioTotal: '₱3,050',
    });
    render(
      <GuestAppPrototype
        initialScreen="stay-overview"
        initialSession={sessionFor([active], {
          activeBookingId: 'active',
          folioTotal: '₱3,050',
        })}
      />,
    );

    expect(screen.getByTestId('guest-home-active')).toBeInTheDocument();
    expect(screen.getByText(/Welcome, Ana · Room 304/)).toBeInTheDocument();
    // Room charges belong to My Stay; Home should not duplicate the folio entry point.
    expect(screen.queryByRole('button', { name: /room charges/i })).toBeNull();
    // The front desk moved off the tab bar and into My Trip.
    expect(screen.queryByRole('button', { name: 'Chat' })).toBeNull();
  });

  it('shows room settlement and confirms a service without a payment method', async () => {
    const user = userEvent.setup();
    const active = makeBooking({
      id: 'active',
      property: 'The Henry Cebu',
      city: 'Cebu',
      status: 'active',
      roomNumber: '512',
      folioTotal: '₱3,050',
    });
    render(
      <GuestAppPrototype
        initialScreen="service-booking"
        initialSession={sessionFor([active], {
          activeBookingId: 'active',
          folioTotal: '₱3,050',
        })}
      />,
    );

    expect(screen.getByText(/room 512/i)).toBeInTheDocument();
    expect(screen.getByText(/charge at checkout/i)).toBeInTheDocument();
    expect(screen.queryByText(/gcash|maya|card/i)).toBeNull();

    await user.click(screen.getByRole('button', { name: /confirm and charge to room/i }));

    expect(await screen.findByRole('heading', { name: /your massage is booked/i })).toBeInTheDocument();
    expect(screen.getByText(/added to room 512/i)).toBeInTheDocument();
    expect(screen.getByText(/hotel folio at checkout/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'View my stay' }));
    await user.click(screen.getByRole('button', { name: /room charges/i }));
    expect(screen.getByText('₱5,450')).toBeInTheDocument();
  });

  it('turns early check-in into a room-charge request without payment choices', () => {
    render(
      <GuestAppPrototype
        initialScreen="early-check-in"
        initialSession={sessionFor([makeBooking({ status: 'upcoming' })])}
      />,
    );

    expect(screen.getByRole('button', { name: /request early check-in/i })).toBeInTheDocument();
    expect(screen.queryByText(/gcash|maya|card|insurance/i)).toBeNull();
    expect(screen.getByText(/charged to your room folio/i)).toBeInTheDocument();
  });

  it('keeps confirmed services and cancellation status in the active stay', async () => {
    const user = userEvent.setup();
    const active = makeBooking({
      id: 'active',
      property: 'The Henry Cebu',
      city: 'Cebu',
      status: 'active',
      roomNumber: '512',
      folioTotal: '₱3,050',
    });
    render(
      <GuestAppPrototype
        initialScreen="my-stay"
        initialSession={sessionFor([active], {
          activeBookingId: 'active',
          folioTotal: '₱5,450',
          serviceBookings: [{
            id: 'service-hilom-1',
            bookingId: 'active',
            title: 'Hilom signature massage',
            scheduledFor: 'Tuesday · November 11 · 1:30 PM',
            scheduledDate: '2026-11-11',
            amount: '₱2,400',
            status: 'confirmed',
          }],
        })}
      />,
    );

    // My Trip names the room in its eyebrow and again in each booking's note.
    expect(screen.getAllByText(/room 512/i).length).toBeGreaterThan(0);
    await user.click(screen.getByRole('button', { name: /hilom signature massage/i }));
    await user.click(screen.getByRole('button', { name: /Change or cancel/i }));
    await user.click(screen.getByRole('button', { name: /cancel service/i }));
    // Cancelling moves the booking out of Upcoming and into Past, where the
    // settlement line reports the state now that the chip is gone.
    await user.click(screen.getByRole('tab', { name: /Past/ }));
    expect(screen.getByText('Cancelled · not charged')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Home' }));
    await user.click(screen.getByRole('button', { name: 'My Stay' }));
    await user.click(screen.getByRole('button', { name: /room charges/i }));
    expect(screen.getByText('₱3,050')).toBeInTheDocument();
  });

  it('falls back to a stay label when no entry path captured a name', () => {
    // The booking-lookup flow never asks for a name, so the greeting has to
    // survive its absence rather than rendering "Welcome, ".
    const nameless = sessionFor(
      [makeBooking({ id: 'nameless', status: 'upcoming', checkIn: '2026-11-14', checkOut: '2026-11-17' })],
      { guestName: '' },
    );
    render(<GuestAppPrototype initialScreen="stay-overview" initialSession={nameless} />);

    expect(screen.getByText('Your next stay')).toBeInTheDocument();
    expect(screen.queryByText(/Welcome,\s*$/)).toBeNull();
  });

  it('keeps four stable app destinations and no separate account group', () => {
    render(<GuestAppPrototype initialScreen="stay-overview" initialSession={activeSession} />);

    // Charges and booking moved onto the stay card, so home has no account
    // group left to hold -- the profile is a destination of its own now.
    expect(screen.queryByRole('group', { name: 'Your account' })).toBeNull();
    const navigation = screen.getByRole('navigation', { name: 'Primary navigation' });
    // Four, as DESIGN.md specifies. Travel is inventory inside Explore rather
    // than a destination, and the front desk is a row inside My Trip.
    expect(navigation.querySelectorAll('button')).toHaveLength(4);
    expect(within(navigation).getAllByRole('button').map((b) => b.textContent))
      .toEqual(['Home', 'Explore', 'My Stay', 'Profile']);
    expect(screen.queryByRole('button', { name: 'Chat' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Wallet' })).toBeNull();
  });

  it('promotes profile out of the app bar and gives the bell its slot', () => {
    render(<GuestAppPrototype initialScreen="stay-overview" initialSession={MOCK_SESSION} />);

    expect(screen.queryByRole('button', { name: 'Open profile' })).toBeNull();
    expect(screen.getByRole('button', { name: /Notifications/ })).toBeInTheDocument();
  });

  it('navigates from home to the explore catalogue', () => {
    render(<GuestAppPrototype initialScreen="stay-overview" initialSession={MOCK_SESSION} />);

    fireEvent.click(screen.getByRole('button', { name: 'Explore' }));
    expect(screen.getByRole('heading', { name: 'Explore', level: 1 })).toBeInTheDocument();
  });

  it('carries the room QR last name into the stay greeting', async () => {
    const user = userEvent.setup();
    render(<GuestAppPrototype initialScreen="room-qr-landing" />);

    await user.type(screen.getByLabelText(/Last name/), 'Santos');
    await user.click(screen.getByRole('button', { name: 'Link my stay' }));

    expect(screen.getByTestId('guest-home-active')).toBeInTheDocument();
    expect(screen.getByText(/Welcome, Santos/)).toBeInTheDocument();
  });

  it('labels the booking state and the notification bell for assistive technology', () => {
    render(<GuestAppPrototype initialScreen="stay-overview" initialSession={activeSession} />);

    expect(screen.getByRole('navigation', { name: /primary navigation/i })).toBeInTheDocument();
    // The bell announces its unread count rather than leaving the dot as the
    // only signal that there is something new.
    expect(screen.getByRole('button', { name: /Notifications, \d+ unread/ })).toBeInTheDocument();
    expect(screen.getByTestId('guest-home-active')).toHaveClass('guest-home-booking', 'guest-home-booking--active');
  });

  it('shows the Cabana logo and the notification bell in the Home app bar', async () => {
    const user = userEvent.setup();
    render(<GuestAppPrototype initialScreen="profile" initialSession={activeSession} />);

    await user.click(screen.getByRole('button', { name: 'Home' }));

    const appBar = screen.getByRole('banner');
    expect(within(appBar).queryByRole('button', { name: 'Go back' })).toBeNull();
    expect(within(appBar).getByText('Cabana', { exact: true })).toBeInTheDocument();
    expect(within(appBar).getByRole('button', { name: /Notifications/ })).toBeInTheDocument();
  });

  it('keeps the back button on non-Home screens', () => {
    render(<GuestAppPrototype initialScreen="profile" initialSession={activeSession} />);

    const backButton = screen.getByRole('button', { name: 'Go back' });
    expect(screen.getByRole('banner')).toContainElement(backButton);
    expect(backButton).toHaveClass('guest-icon-button--back');
    expect(guestStyles).toMatch(
      /\.guest-icon-button--back\s*\{[^}]*background:\s*var\(--guest-soft\)/,
    );
  });

  it('renders a contextual spa image with a resilient fallback', () => {
    render(<GuestAppPrototype initialScreen="stay-overview" initialSession={MOCK_SESSION} />);

    fireEvent.click(screen.getByRole('button', { name: 'Explore' }));
    const image = screen.getByRole('img', { name: /spa treatment/i });

    expect(image).toBeInTheDocument();
    fireEvent.error(image);
    expect(image.closest('.guest-service-image')).toHaveClass('is-error');
    expect(screen.getByRole('button', { name: /View service/i })).toBeEnabled();
  });

  it('keeps the brand colour intact across the shared token layers', () => {
    // The brand primitives are a product contract: the app may be restyled,
    // but Cabana pink, Cabana plum, the ink, and the white surface do not move.
    // The ink sits on hue 351 -- the logo's own hue -- so the neutral ramp
    // reads warm against the plum mark instead of fighting it with a cool grey.
    expect(globalStyles).toContain('--ds-ink: oklch(0.16 0.016 351);');
    expect(globalStyles).toContain('--ds-paper: oklch(1 0 0);');
    expect(globalStyles).toContain('--ds-pink: oklch(0.79 0.18 345);');
    expect(globalStyles).toContain('--ds-plum: oklch(0.305 0.062 351);');
    expect(globalStyles).toContain('--primitive-ink: var(--ds-ink);');
    expect(globalStyles).toContain('--primitive-pink: var(--ds-pink);');

    // The app derives every surface from those primitives rather than
    // hard-coding its own copies.
    expect(guestStyles).toContain('--guest-ink: var(--ds-ink);');
    expect(guestStyles).toContain('--guest-paper: var(--ds-paper);');
    expect(guestStyles).toContain('--guest-brand: var(--ds-plum);');
    expect(guestStyles).toContain('--guest-accent: var(--ds-pink);');
    expect(guestStyles).toContain('--guest-soft: var(--ds-pink-soft);');
  });

  it('puts ink on the accent instead of white, which the pink cannot carry', () => {
    // oklch(0.79 …) pink is a light surface: white text on it fails WCAG AA,
    // ink clears it at 8.9:1. Everything filled with the accent takes ink.
    expect(globalStyles).toContain('--ds-on-pink: var(--ds-ink);');
    expect(guestStyles).toContain('--guest-on-accent: var(--ds-on-pink);');
    expect(guestStyles).toContain('background: var(--guest-accent); color: var(--guest-on-accent); }');
  });

  it('keeps status colours separate from the brand palette', () => {
    for (const token of ['--ds-positive:', '--ds-warning:', '--ds-danger:']) {
      expect(globalStyles).toContain(token);
    }
    expect(guestStyles).toContain('--guest-positive: var(--ds-positive);');
    expect(guestStyles).toContain('--guest-warning: var(--ds-warning);');
    expect(guestStyles).toContain('--guest-danger: var(--ds-danger);');
  });

  it('respects reduced motion and never animates with an unscoped transition', () => {
    expect(guestStyles).toContain('@media (prefers-reduced-motion: reduce)');
    expect(guestStyles).toMatch(
      /\.guest-room-ready-notification\s*\{[^}]*animation:\s*guest-room-ready-fade/,
    );
    expect(guestStyles).toContain('@keyframes guest-room-ready-fade');
    expect(guestStyles).not.toMatch(/transition:\s*all/);
    expect(globalStyles).not.toMatch(/transition:\s*all/);
  });

  it('keeps every room-ready control at least 44 CSS pixels tall', () => {
    expect(guestStyles).toMatch(/\.guest-prototype-toolbar button\s*\{[^}]*min-height:\s*44px/);
    expect(guestStyles).toMatch(/\.guest-room-ready-notification__content button\s*\{[^}]*min-height:\s*44px/);
    expect(guestStyles).toMatch(/\.guest-room-ready-notification__dismiss\s*\{[^}]*height:\s*44px/);
  });
});

describe('guest account and entry flows', () => {
  it('allows optional account creation with no stay invented', async () => {
    const user = userEvent.setup();
    render(<GuestAppPrototype initialScreen="create-account" />);

    await user.type(screen.getByLabelText(/Full name/), 'Mara Cruz');
    await user.type(screen.getByLabelText(/Email/), 'mara@example.com');
    await user.type(screen.getByLabelText(/Password/), 'password123');
    await user.click(screen.getByRole('button', { name: 'Create account' }));

    expect(screen.getByRole('heading', { name: 'Find your booking' })).toBeInTheDocument();
    expect(screen.queryByTestId('guest-home-active')).toBeNull();
  });

  it('routes a returning account to its saved stay', async () => {
    const user = userEvent.setup();
    render(<GuestAppPrototype initialScreen="sign-in" />);

    await user.type(screen.getByLabelText(/Email/), 'ana@example.com');
    await user.type(screen.getByLabelText(/Password/), 'password123');
    await user.click(screen.getByRole('button', { name: 'Log in' }));

    expect(screen.getByRole('heading', { name: /Welcome back/ })).toBeInTheDocument();
  });

  it('routes a booking-first arrival directly to pre-arrival onboarding without account registration', async () => {
    const user = userEvent.setup();
    render(<GuestAppPrototype initialScreen="connect-booking" />);

    await user.click(screen.getByRole('button', { name: 'Confirmation number' }));
    await user.type(screen.getByLabelText(/Booking or confirmation number/), 'HEN-241109');
    await user.type(screen.getByLabelText(/Last name/), 'Santos');
    await user.click(screen.getByRole('button', { name: 'Find booking' }));
    await user.click(screen.getByRole('button', { name: 'Use this booking' }));

    // Directly reaches pre-arrival Step 1 of 4 without an account creation gate
    expect(screen.getByRole('heading', { name: 'Your details' })).toBeInTheDocument();
    expect(screen.getByText('1 of 4')).toBeInTheDocument();
  });

  it('opens the shell and the empty home for an account with no bookings', () => {
    const session = verifyPendingSession(
      createAccountSession('Mara Cruz', 'mara@example.com', 'email-code'),
    );
    render(<GuestAppPrototype initialScreen="stay-overview" initialSession={session} />);

    expect(screen.getByRole('navigation', { name: 'Primary navigation' })).toBeInTheDocument();
    expect(screen.getByTestId('guest-home-empty')).toBeInTheDocument();
  });

  it('signs out to the welcome screen with the shell hidden', async () => {
    const user = userEvent.setup();
    render(<GuestAppPrototype initialScreen="profile" initialSession={MOCK_SESSION} />);

    await user.click(screen.getByRole('button', { name: 'Sign out' }));

    expect(screen.getByRole('button', { name: 'Get started' })).toBeInTheDocument();
    expect(screen.queryByRole('navigation', { name: 'Primary navigation' })).toBeNull();
  });

  it('hides the profile action until an account exists', () => {
    render(<GuestAppPrototype />);

    expect(screen.queryByRole('button', { name: /open profile/i })).toBeNull();
  });

  it('keeps the welcome focused and navigates straight to booking lookup', async () => {
    const user = userEvent.setup();
    render(<GuestAppPrototype initialOnline={false} />);

    expect(screen.queryByText(/Offline mode active/i)).toBeNull();
    await user.click(screen.getByRole('button', { name: 'Get started' }));

    expect(screen.getByRole('heading', { name: 'Find your booking' })).toBeInTheDocument();
    expect(screen.getByLabelText(/Booking or confirmation number/)).toBeInTheDocument();
  });

  it('labels the code field for assistive technology and autofill', () => {
    render(<GuestAppPrototype initialScreen="verify-code" />);

    const code = screen.getByLabelText(/verification code/i);
    expect(code).toHaveAttribute('autocomplete', 'one-time-code');
    expect(code).toHaveAttribute('inputmode', 'numeric');
    expect(screen.getByRole('button', { name: 'Verify' })).toBeDisabled();
  });

  it('toggles password visibility with accessible labeling', async () => {
    const user = userEvent.setup();
    render(<GuestAppPrototype initialScreen="sign-in" />);

    const passwordInput = screen.getByLabelText(/Password/);
    expect(passwordInput).toHaveAttribute('type', 'password');

    const toggleBtn = screen.getByRole('button', { name: 'Show password' });
    await user.click(toggleBtn);
    expect(passwordInput).toHaveAttribute('type', 'text');
    expect(screen.getByRole('button', { name: 'Hide password' })).toBeInTheDocument();
  });

  it('ships styles for the auth screens and password fields', () => {
    expect(guestStyles).toContain('.guest-welcome__splash');
    expect(guestStyles).toContain('.guest-welcome__art-track');
    expect(guestStyles).toContain('.guest-welcome__dots');
    expect(guestStyles).toMatch(/\.guest-welcome[^}]*background: #fff/);
    expect(guestStyles).toContain('.guest-password-wrapper');
    expect(guestStyles).toContain('.guest-password-toggle');
    expect(guestStyles).toContain('.guest-code-field');
    expect(guestStyles).toMatch(/\.guest-code-field[^}]*letter-spacing/);
  });
});

describe('pre-arrival progress card', () => {
  it('shows remaining work and the next step while incomplete', () => {
    render(<GuestAppPrototype initialScreen="stay-overview" initialSession={MOCK_SESSION} />);

    expect(screen.getByText('2 of 4 steps complete')).toBeInTheDocument();
    expect(screen.getByRole('progressbar', { name: 'Pre-arrival progress' })).toBeInTheDocument();
    expect(screen.getByText('Add who else is staying')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Complete pre-arrival/ })).toBeInTheDocument();
  });

  it('drops the progress framing once every step is done', () => {
    const done = sessionFor([
      makeBooking({ id: 'done', status: 'upcoming', preArrivalCompleted: 4, preArrivalTotal: 4 }),
    ]);
    render(<GuestAppPrototype initialScreen="stay-overview" initialSession={done} />);

    // No progress bar, no percentage, and above all no stale "next step".
    expect(screen.queryByRole('progressbar', { name: 'Pre-arrival progress' })).toBeNull();
    expect(screen.queryByText('4 of 4 steps complete')).toBeNull();
    expect(screen.queryByText('Add who else is staying')).toBeNull();
    // The card's job becomes the room instead.
    expect(screen.getByText('Your room')).toBeInTheDocument();
    // Nothing is allocated yet, so the way out stays quiet rather than
    // offering a full-width button for a state the guest cannot act on.
    expect(screen.getByRole('button', { name: /Review stay/ })).toHaveClass('guest-text-button');
  });

  it('says where room assignment stands rather than implying the app can hurry it', () => {
    const unassigned = sessionFor([
      makeBooking({ id: 'u', status: 'upcoming', preArrivalCompleted: 4, preArrivalTotal: 4, roomNumber: undefined }),
    ]);
    render(<GuestAppPrototype initialScreen="stay-overview" initialSession={unassigned} />);
    expect(screen.getByText('Room assigned on arrival day')).toBeInTheDocument();
    expect(screen.getByText(/allocates rooms from its own inventory/)).toBeInTheDocument();

    cleanup();

    const assigned = sessionFor([
      makeBooking({
        id: 'a',
        status: 'upcoming',
        checkIn: '2026-11-14',
        checkOut: '2026-11-17',
        preArrivalCompleted: 4,
        preArrivalTotal: 4,
        roomNumber: '512',
      }),
    ]);
    render(<GuestAppPrototype initialScreen="stay-overview" initialSession={assigned} />);
    expect(screen.getByText('Room 512 is yours')).toBeInTheDocument();
    expect(screen.getByText(/moment it is ready/)).toBeInTheDocument();
  });
});

describe('room assignment through the flow', () => {
  it('learns a room number once pre-registration reaches the property', async () => {
    const user = userEvent.setup();
    render(<GuestAppPrototype initialScreen="guest-details" initialSession={MOCK_SESSION} />);

    // Before: the stay is pre-registered but unallocated.
    await user.click(screen.getByRole('button', { name: 'Continue to ID' }));
    await user.click(screen.getByRole('button', { name: 'Save and continue' }));
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    await user.click(screen.getByRole('button', { name: 'Request early check-in' }));

    // After: the property allocated one, and the app reports it rather than
    // claiming to have chosen it.
    expect(screen.getByText('Room 512 is yours')).toBeInTheDocument();
    expect(screen.getByText(/Honoured: Higher floor · King bed/)).toBeInTheDocument();
    expect(screen.queryByText(/allocates rooms from its own inventory/)).toBeNull();
  });
});

describe('room-ready notification', () => {
  it('simulates a room-ready push outside the guest app and opens the updated stay', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <GuestAppPrototype initialScreen="stay-overview" initialSession={assignedSession} />,
    );

    const toolbar = screen.getByRole('region', { name: 'Prototype controls' });
    expect(container.querySelector('.guest-app')?.contains(toolbar)).toBe(false);

    await user.click(screen.getByRole('button', { name: 'Simulate room ready' }));

    const notification = screen.getByRole('region', { name: 'Room-ready notification' });
    expect(within(notification).getByText('Room 512 is ready')).toBeInTheDocument();
    expect(within(notification).getByText('Released at 2:15 PM. Go straight up.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Simulate room ready' })).toBeNull();

    await user.click(within(notification).getByRole('button', { name: 'View stay' }));

    expect(screen.queryByRole('region', { name: 'Room-ready notification' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Go back' })).toBeNull();
    expect(screen.getByTestId('guest-home-upcoming')).toHaveTextContent('Room 512 is ready');
    expect(screen.getByTestId('guest-home-upcoming')).toHaveTextContent(
      'Please proceed to the front desk to collect your key and check in to your room.',
    );
    expect(screen.getByRole('button', { name: 'I understand' })).toBeInTheDocument();
  });

  it('disables the PMS simulation while offline', () => {
    render(
      <GuestAppPrototype
        initialScreen="stay-overview"
        initialSession={assignedSession}
        initialOnline={false}
      />,
    );

    expect(screen.getByRole('button', { name: 'Simulate room ready' })).toBeDisabled();
    expect(screen.getByText('Reconnect to receive a new PMS event.')).toBeInTheDocument();
  });

  it('does not offer readiness for a property that cannot report it', () => {
    const legacy = sessionFor([
      makeBooking({
        id: 'legacy',
        status: 'upcoming',
        preArrivalCompleted: 4,
        preArrivalTotal: 4,
        roomAssignment: 'assigned',
        roomNumber: '512',
        reportsRoomReadiness: false,
      }),
    ]);

    render(<GuestAppPrototype initialScreen="stay-overview" initialSession={legacy} />);

    expect(screen.queryByRole('button', { name: 'Simulate room ready' })).toBeNull();
    expect(screen.getByText(/does not report room readiness/i)).toBeInTheDocument();
  });

  it.each([
    ['pending', makeBooking({ roomAssignment: 'pending', roomNumber: undefined })],
    ['missing-room', makeBooking({ roomAssignment: 'assigned', roomNumber: undefined })],
    ['ready', makeBooking({ roomAssignment: 'ready', roomNumber: '512' })],
    ['completed', makeBooking({ status: 'completed', roomAssignment: 'assigned', roomNumber: '512' })],
  ])('does not offer readiness for a %s booking', (_label, booking) => {
    render(
      <GuestAppPrototype
        initialScreen="stay-overview"
        initialSession={sessionFor([{ ...booking, preArrivalCompleted: 4, preArrivalTotal: 4 }])}
      />,
    );

    expect(screen.queryByRole('button', { name: 'Simulate room ready' })).toBeNull();
  });

  it('dismisses the push after eight seconds without reverting the room', () => {
    vi.useFakeTimers();
    try {
      render(<GuestAppPrototype initialScreen="stay-overview" initialSession={assignedSession} />);
      fireEvent.click(screen.getByRole('button', { name: 'Simulate room ready' }));

      expect(screen.getByRole('region', { name: 'Room-ready notification' })).toBeInTheDocument();
      act(() => vi.advanceTimersByTime(8_000));

      expect(screen.queryByRole('region', { name: 'Room-ready notification' })).toBeNull();
      expect(screen.getByTestId('guest-home-upcoming')).toHaveTextContent('Room 512 is ready');
    } finally {
      vi.useRealTimers();
    }
  });

  it('dismisses the push on request without reverting the room', () => {
    render(<GuestAppPrototype initialScreen="stay-overview" initialSession={assignedSession} />);
    fireEvent.click(screen.getByRole('button', { name: 'Simulate room ready' }));

    fireEvent.click(screen.getByRole('button', { name: 'Dismiss notification' }));

    expect(screen.queryByRole('region', { name: 'Room-ready notification' })).toBeNull();
    expect(screen.getByTestId('guest-home-upcoming')).toHaveTextContent('Room 512 is ready');
  });

  it('pauses automatic dismissal while focus is inside the push', () => {
    vi.useFakeTimers();
    try {
      render(<GuestAppPrototype initialScreen="stay-overview" initialSession={assignedSession} />);
      fireEvent.click(screen.getByRole('button', { name: 'Simulate room ready' }));

      const notification = screen.getByRole('region', { name: 'Room-ready notification' });
      const viewStay = within(notification).getByRole('button', { name: 'View stay' });
      fireEvent.focus(viewStay);
      act(() => vi.advanceTimersByTime(8_000));

      expect(screen.getByRole('region', { name: 'Room-ready notification' })).toBeInTheDocument();

      const roomAction = screen.getByRole('button', { name: /I understand/ });
      expect(screen.getByText(/Please proceed to the front desk to collect your key/)).toBeInTheDocument();
      fireEvent.blur(viewStay, { relatedTarget: roomAction });
      fireEvent.focus(roomAction);
      act(() => vi.advanceTimersByTime(8_000));

      expect(screen.queryByRole('region', { name: 'Room-ready notification' })).toBeNull();

      // Dismisses the room ready card on home
      fireEvent.click(roomAction);
      expect(screen.queryByRole('button', { name: /I understand/ })).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });
});

describe('menu and service listing controls', () => {
  /** Facets live behind the filter bar now: open the pill, choose, Apply. */
  const choose = async (
    user: ReturnType<typeof userEvent.setup>,
    pill: RegExp | string,
    option: { role: 'radio' | 'checkbox'; name: string }[],
  ) => {
    await user.click(screen.getByRole('button', { name: pill }));
    for (const item of option) await user.click(screen.getByRole(item.role, { name: item.name }));
    await user.click(screen.getByRole('button', { name: 'Apply' }));
  };

  it('narrows a menu by diet and reports how much is left', async () => {
    const user = userEvent.setup();
    render(<GuestAppPrototype initialScreen="stay-overview" initialSession={activeSession} />);

    await user.click(screen.getByRole('button', { name: 'Dining' }));
    await user.click(screen.getByRole('button', { name: /Apartment 1B/i }));

    expect(screen.getByText('13 dishes')).toBeInTheDocument();
    // Seafood is on this menu, so the facet offers it.
    await choose(user, 'Dietary', [{ role: 'checkbox', name: 'Seafood' }]);

    expect(screen.getByText('2 dishes')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Crispy Calamari' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Grilled Angus Ribeye' })).toBeNull();

    // Two diets narrow rather than widen, and nothing is both.
    await choose(user, /Seafood/, [{ role: 'checkbox', name: 'Vegetarian' }]);
    expect(screen.getByText('0 dishes')).toBeInTheDocument();
    expect(screen.getByText('No dishes match those filters')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Clear' }));
    expect(screen.getByText('13 dishes')).toBeInTheDocument();
  });

  it('sorts a menu by price without losing the category tab', async () => {
    const user = userEvent.setup();
    render(<GuestAppPrototype initialScreen="stay-overview" initialSession={activeSession} />);

    await user.click(screen.getByRole('button', { name: 'Dining' }));
    await user.click(screen.getByRole('button', { name: /Apartment 1B/i }));
    await user.click(screen.getByRole('tab', { name: 'Mains' }));
    await choose(user, 'Recommended', [{ role: 'radio', name: 'Lowest price' }]);

    const prices = screen.getAllByText(/^₱[\d,]+$/).map((el) => Number(el.textContent!.replace(/[^\d]/g, '')));
    expect(prices).toEqual([...prices].sort((a, b) => a - b));
    expect(screen.getByText('5 dishes')).toBeInTheDocument();
  });

  it('announces which filter sheet is open', async () => {
    const user = userEvent.setup();
    render(<GuestAppPrototype initialScreen="stay-overview" initialSession={activeSession} />);

    await user.click(screen.getByRole('button', { name: 'Dining' }));
    await user.click(screen.getByRole('button', { name: /Apartment 1B/i }));

    const sortButton = screen.getByRole('button', { name: 'Recommended' });
    expect(sortButton).toHaveAttribute('aria-expanded', 'false');

    await user.click(sortButton);

    expect(sortButton).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('dialog', { name: 'Sort by' })).toBeInTheDocument();
  });

  it('lets guests clear a changed sort before applying it', async () => {
    const user = userEvent.setup();
    render(<GuestAppPrototype initialScreen="stay-overview" initialSession={activeSession} />);

    await user.click(screen.getByRole('button', { name: 'Dining' }));
    await user.click(screen.getByRole('button', { name: /Apartment 1B/i }));
    await user.click(screen.getByRole('button', { name: 'Recommended' }));

    const clearAll = screen.getByRole('button', { name: 'Clear all' });
    expect(clearAll).toBeDisabled();

    await user.click(screen.getByRole('radio', { name: 'Lowest price' }));

    expect(clearAll).toBeEnabled();
    await user.click(clearAll);
    expect(clearAll).toBeDisabled();
    expect(screen.getByRole('radio', { name: 'Recommended' })).toBeChecked();

    await user.click(screen.getByRole('button', { name: 'Apply' }));
    expect(screen.getByRole('button', { name: 'Recommended' })).toHaveAttribute('aria-expanded', 'false');
  });

  it('filters a service category by operator', async () => {
    const user = userEvent.setup();
    render(<GuestAppPrototype initialScreen="stay-overview" initialSession={activeSession} />);

    const spa = SERVICES.filter((service) => service.categoryId === 'spa');
    const hotelRun = spa.filter((service) => service.operator === 'Hotel operated');

    await user.click(screen.getByRole('button', { name: 'Spa' }));
    expect(screen.getByText(`${spa.length} services`)).toBeInTheDocument();

    await choose(user, 'Operator', [{ role: 'checkbox', name: 'Hotel operated' }]);
    // Derived, not pinned: the catalogue will keep growing.
    expect(screen.getByText(`${hotelRun.length} ${hotelRun.length === 1 ? 'service' : 'services'}`)).toBeInTheDocument();
  });

  it('gives the dining venue list the same controls', async () => {
    const user = userEvent.setup();
    render(<GuestAppPrototype initialScreen="stay-overview" initialSession={activeSession} />);

    await user.click(screen.getByRole('button', { name: 'Dining' }));
    expect(screen.getByText(`${RESTAURANTS.length} venues`)).toBeInTheDocument();

    await choose(user, 'Recommended', [{ role: 'radio', name: 'Lowest price' }]);
    const names = screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent);
    expect(names[0]).toBe('Kape Manila Café');
  });
});

describe('travel destination', () => {
  it('keeps travel inside Explore rather than giving it a destination', () => {
    render(<GuestAppPrototype initialScreen="travel" initialSession={MOCK_SESSION} />);

    const nav = screen.getByRole('navigation', { name: 'Primary navigation' });
    const destinations = within(nav).getAllByRole('button').map((b) => b.textContent);
    expect(destinations).toEqual(['Home', 'Explore', 'My Stay', 'Profile']);
    // A travel screen still lights Explore: that is where the guest found it.
    expect(screen.getByRole('button', { name: 'Explore' })).toHaveAttribute('aria-current', 'page');
  });

  it('lists every travel category on the hub', () => {
    render(<GuestAppPrototype initialScreen="travel" initialSession={MOCK_SESSION} />);

    expect(screen.getByRole('heading', { name: 'Get there, and onward' })).toBeInTheDocument();
    for (const category of TRAVEL_CATEGORIES) {
      expect(screen.getByText(category.title)).toBeInTheDocument();
    }
  });

  it('opens a category with its own route labels, party label and inventory', async () => {
    const user = userEvent.setup();
    render(<GuestAppPrototype initialScreen="travel" initialSession={MOCK_SESSION} />);

    await user.click(screen.getByText('Ferries'));

    expect(screen.getByLabelText('Departure port')).toBeInTheDocument();
    expect(screen.getByLabelText('Arrival port')).toBeInTheDocument();
    expect(screen.getByLabelText('Passengers')).toBeInTheDocument();
    expect(screen.getByText('2GO Travel')).toBeInTheDocument();
    expect(screen.getAllByText('OceanJet')).toHaveLength(2);
    // Flight inventory must not leak into the ferry category.
    expect(screen.queryByText('Cebu Pacific')).toBeNull();
  });

  it('offers only the three ways of travelling, cover no longer among them', () => {
    render(<GuestAppPrototype initialScreen="travel" initialSession={MOCK_SESSION} />);

    // Cover has no route, departure or seat, so it stopped being a mode.
    expect(TRAVEL_CATEGORIES.map((category) => category.id)).toEqual(['flights', 'ferries', 'transfers']);
    expect(screen.queryByText('Travel insurance')).toBeNull();
  });

  it('marks one fare as selected and totals it against the operator', async () => {
    const user = userEvent.setup();
    render(<GuestAppPrototype initialScreen="travel" initialSession={MOCK_SESSION} />);

    await user.click(screen.getByText('Flights'));
    const fares = screen.getAllByRole('button', { pressed: false });
    await user.click(screen.getByText('₱3,940').closest('button') as HTMLElement);

    expect(screen.getAllByRole('button', { pressed: true })).toHaveLength(1);
    expect(fares.length).toBeGreaterThan(1);
    // Selecting a fare summarises it and opens the way to checkout.
    expect(screen.getByText('Fare each')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Continue to checkout/ })).toBeInTheDocument();
  });
});

describe('booking detail', () => {
  it('names every guest on the booking, and flags those still unnamed', async () => {
    const user = userEvent.setup();
    render(<GuestAppPrototype initialScreen="my-stay" initialSession={MOCK_SESSION} />);

    await user.click(screen.getByRole('button', { name: /Checks out|Checks in/ }));

    expect(screen.getByRole('heading', { name: 'Guests' })).toBeInTheDocument();
    expect(screen.getByText('Ana Santos')).toBeInTheDocument();
    expect(screen.getByText('Marco Santos')).toBeInTheDocument();
    expect(screen.getByText('Lead booker · ID on file')).toBeInTheDocument();
    // The reference booking reserves two and names two, so nothing is pending.
    expect(screen.queryByText(/not yet named/)).toBeNull();
  });

  it('holds the lead slot open rather than promoting an additional guest', () => {
    // The booking-lookup path never captures a name. Collapsing the list here
    // showed the first additional guest as "Lead booker · ID on file".
    const nameless = sessionFor(
      [makeBooking({ id: 'n', status: 'active', roomNumber: '304', guestCount: 2 })],
      { guestName: '', additionalGuests: ['Marco Santos'] },
    );
    render(<GuestAppPrototype initialScreen="rate-detail" initialSession={nameless} />);

    expect(screen.getByText('Lead booker · name needed')).toBeInTheDocument();
    expect(screen.getByText('Marco Santos')).toBeInTheDocument();
    expect(screen.getByText('Additional guest')).toBeInTheDocument();
    // Two rows for a party of two: nothing is missing, one name is.
    expect(screen.queryByText(/not yet named/)).toBeNull();
  });

  it('says how many guests are unnamed when the booking reserves more', () => {
    const party = sessionFor(
      [makeBooking({ id: 'party', status: 'active', roomNumber: '304', guestCount: 4 })],
      { activeBookingId: 'party', additionalGuests: ['Marco Santos'] },
    );
    render(<GuestAppPrototype initialScreen="rate-detail" initialSession={party} />);

    expect(screen.getByText('2 guests not yet named')).toBeInTheDocument();
    expect(screen.getByText('4 guests')).toBeInTheDocument();
  });

  it('reports the party size on the home stay card', () => {
    render(<GuestAppPrototype initialScreen="stay-overview" initialSession={MOCK_SESSION} />);

    expect(screen.getByText('2 guests')).toBeInTheDocument();
  });

  it('labels a stay under way as checked in, not upcoming', () => {
    // The reference stay runs 9-12 November against a clock of the 11th.
    render(<GuestAppPrototype initialScreen="stay-overview" initialSession={MOCK_SESSION} />);

    expect(screen.getByText('Checked in')).toBeInTheDocument();
    expect(screen.queryByText('Upcoming')).toBeNull();
  });
});

describe('travel as a category', () => {
  it('opens the travel hub from the Explore grid', async () => {
    const user = userEvent.setup();
    render(<GuestAppPrototype initialScreen="marketplace" initialSession={MOCK_SESSION} />);

    await user.click(screen.getByRole('button', { name: 'Travel' }));

    // Its own hub, not the on-property listing.
    expect(screen.getByRole('heading', { name: 'Get there, and onward' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Explore' })).toHaveAttribute('aria-current', 'page');
  });

  it('opens the travel hub from the Home category row too', async () => {
    const user = userEvent.setup();
    render(<GuestAppPrototype initialScreen="stay-overview" initialSession={MOCK_SESSION} />);

    // Home's row is driven by the same list, so it must route the same way --
    // this tile used to send every category to `category-listing`.
    await user.click(screen.getByRole('button', { name: 'Travel' }));

    expect(screen.getByRole('heading', { name: 'Get there, and onward' })).toBeInTheDocument();
  });

  it('reaches flights, ferries, transfers and cover inside it', async () => {
    const user = userEvent.setup();
    render(<GuestAppPrototype initialScreen="marketplace" initialSession={MOCK_SESSION} />);

    await user.click(screen.getByRole('button', { name: 'Travel' }));

    for (const category of TRAVEL_CATEGORIES) {
      expect(screen.getByText(category.title)).toBeInTheDocument();
    }
  });
});

describe('booking receipt', () => {
  it('itemises a dining order rather than only counting it', async () => {
    const user = userEvent.setup();
    render(<GuestAppPrototype initialScreen="my-stay" initialSession={MOCK_SESSION} />);

    // The card can only say "3 items"; a guest checking what a charge was for
    // needs the order read back.
    await user.click(screen.getByRole('button', { name: /Azotea Rooftop/ }));

    expect(screen.getByRole('heading', { name: 'Azotea Rooftop', level: 1 })).toBeInTheDocument();
    expect(screen.getByText(/Chef.s tasting menu · 2 × ₱1,200/)).toBeInTheDocument();
    expect(screen.getByText('Wine pairing')).toBeInTheDocument();
    expect(screen.getByText('₱2,400')).toBeInTheDocument();
    expect(screen.getByText('Total')).toBeInTheDocument();
  });

  it('opens past entries too, which used not to be tappable', async () => {
    const user = userEvent.setup();
    render(<GuestAppPrototype initialScreen="my-stay" initialSession={MOCK_SESSION} />);

    await user.click(screen.getByRole('tab', { name: /Past/ }));
    await user.click(screen.getByRole('button', { name: /Kape Manila Caf/ }));

    expect(screen.getByRole('heading', { name: /Kape Manila Caf/, level: 1 })).toBeInTheDocument();
    expect(screen.getByText('Cancelled · not charged')).toBeInTheDocument();
    // Nothing to cancel on a cancelled booking.
    expect(screen.queryByRole('button', { name: /Change or cancel/ })).toBeNull();
  });

  it('does not put the cancel flow behind an ordinary tap', async () => {
    const user = userEvent.setup();
    render(<GuestAppPrototype initialScreen="my-stay" initialSession={MOCK_SESSION} />);

    await user.click(screen.getByRole('button', { name: /Hilom signature massage/ }));

    // The receipt, not the destructive screen.
    expect(screen.queryByRole('heading', { name: /Cancel this booking/ })).toBeNull();
    expect(screen.getByRole('button', { name: /Change or cancel/ })).toBeInTheDocument();
  });

  it('shows a travel leg as paid to the operator, with no cancel action', async () => {
    const user = userEvent.setup();
    render(<GuestAppPrototype initialScreen="my-stay" initialSession={MOCK_SESSION} />);

    await user.click(screen.getByRole('button', { name: /Cebu Pacific/ }));

    expect(screen.getByText(/paid to the operator/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Change or cancel/ })).toBeNull();
  });
});

describe('stay history', () => {
  it('opens a finished stay and shows what it cost and what was booked', async () => {
    const user = userEvent.setup();
    render(<GuestAppPrototype initialScreen="stay-history" initialSession={MOCK_SESSION} />);

    // The card was inert before, which made the spend it represents
    // unreachable -- a guest could see they stayed somewhere and nothing else.
    await user.click(screen.getByRole('button', { name: /March 14–17, 2026/ }));

    expect(screen.getByRole('heading', { name: 'The Henry Cebu', level: 1 })).toBeInTheDocument();
    expect(screen.getByText('₱37,390')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Hilom signature massage' })).toBeInTheDocument();
    // Grouped by what sold it, each group carrying its own total.
    expect(screen.getByRole('heading', { name: 'Spa & wellness' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Dining' })).toBeInTheDocument();
  });

  it('names the venue that sold each charge, not just the hotel', async () => {
    const user = userEvent.setup();
    render(<GuestAppPrototype initialScreen="stay-history" initialSession={MOCK_SESSION} />);

    await user.click(screen.getByRole('button', { name: /March 14–17, 2026/ }));

    expect(screen.getByText('Azotea Rooftop')).toBeInTheDocument();
    expect(screen.getByText('Kape Manila Café')).toBeInTheDocument();
  });
});

describe('notifications', () => {
  it('opens the inbox from the bell and clears its dot', async () => {
    const user = userEvent.setup();
    render(<GuestAppPrototype initialScreen="stay-overview" initialSession={activeSession} />);

    const bell = screen.getByRole('button', { name: /Notifications, \d+ unread/ });
    expect(bell.querySelector('.guest-bell__dot')).not.toBeNull();

    await user.click(bell);

    expect(screen.getByRole('heading', { name: 'Notifications', level: 1 })).toBeInTheDocument();
    // Seen, so the bell stops nagging -- but the rows keep their own unread
    // marks until they are actually opened.
    const seenBell = screen.getByRole('button', { name: 'Notifications' });
    expect(seenBell.querySelector('.guest-bell__dot')).toBeNull();
    expect(document.querySelectorAll('.guest-notification[data-unread="true"]').length).toBeGreaterThan(0);
  });

  it('takes the guest to the screen a notification is about', async () => {
    const user = userEvent.setup();
    render(<GuestAppPrototype initialScreen="notifications" initialSession={activeSession} />);

    await user.click(screen.getByRole('button', { name: /New charge on your room/ }));

    expect(screen.getByRole('heading', { name: 'Room charges', level: 1 })).toBeInTheDocument();
  });

  it('marks only the opened notification as read', async () => {
    const user = userEvent.setup();
    render(<GuestAppPrototype initialScreen="notifications" initialSession={activeSession} />);

    const before = document.querySelectorAll('.guest-notification[data-unread="true"]').length;
    await user.click(screen.getByRole('button', { name: /New charge on your room/ }));
    await user.click(screen.getByRole('button', { name: 'Go back' }));

    expect(document.querySelectorAll('.guest-notification[data-unread="true"]')).toHaveLength(before - 1);
  });

  it('says so plainly when there is nothing to show', () => {
    const session = sessionFor([makeBooking({ status: 'upcoming' })]);
    render(<GuestAppPrototype initialScreen="notifications" initialSession={session} />);

    expect(screen.getByRole('heading', { name: /all caught up/ })).toBeInTheDocument();
  });
});

describe('my stay', () => {
  it('answers what is booked and what is owed for the whole trip', () => {
    render(<GuestAppPrototype initialScreen="my-stay" initialSession={activeSession} />);

    expect(screen.getByRole('heading', { name: 'The Henry Manila', level: 1 })).toBeInTheDocument();
    expect(screen.getByText(/Checked in · Room/)).toBeInTheDocument();
    expect(screen.getByText('₱3,050')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /room charges/i })).toBeInTheDocument();
    // Upcoming and Past are tabs now, not stacked sections.
    expect(screen.getByRole('tab', { name: /Upcoming/ })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: /Past/ })).toHaveAttribute('aria-selected', 'false');
  });

  it('names the parent property on each booking card', () => {
    const session = sessionFor(
      [makeBooking({ id: 'active', property: 'The Henry Manila', status: 'active', roomNumber: '304', folioTotal: '₱3,050' })],
      {
        activeBookingId: 'active',
        folioTotal: '₱3,050',
        serviceBookings: [{
          id: 'service-dining-1',
          bookingId: 'active',
          title: 'Azotea Rooftop',
          scheduledFor: 'Tonight · 7:30 PM',
          scheduledDate: '2026-11-11',
          amount: '₱2,400',
          status: 'confirmed',
          diningOrder: {
            venueId: 'rooftop',
            venueName: 'Azotea Rooftop',
            items: [{ id: 'x', name: 'Tasting menu', unitPrice: '₱2,400', quantity: 1 }],
            fulfillment: { method: 'pickup', timing: 'scheduled', scheduledFor: '7:30 PM' },
          },
        }],
      },
    );
    render(<GuestAppPrototype initialScreen="my-stay" initialSession={session} />);

    // A guest moving between properties cannot be asked to remember which
    // building a venue was in, so the card says so before they ask.
    const card = document.querySelector('.guest-stay-entry__parent');
    expect(card?.textContent).toContain('The Henry Manila');
    expect(card?.textContent).toContain('Ninth floor terrace');
  });

  it('switches between upcoming and past without losing either', async () => {
    const user = userEvent.setup();
    const session = sessionFor(
      [makeBooking({ id: 'active', status: 'active', roomNumber: '304' })],
      {
        activeBookingId: 'active',
        serviceBookings: [
          { id: 'a', bookingId: 'active', title: 'Hilom signature massage', scheduledFor: 'Tue · 1:30 PM', scheduledDate: '2026-11-12', amount: '₱2,400', status: 'confirmed' },
          { id: 'b', bookingId: 'active', title: 'Island day tour', scheduledFor: 'Mon · 8:00 AM', scheduledDate: '2026-11-09', amount: '₱3,800', status: 'completed' },
        ],
      },
    );
    render(<GuestAppPrototype initialScreen="my-stay" initialSession={session} />);

    expect(screen.getByRole('heading', { name: 'Hilom signature massage' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Island day tour' })).toBeNull();

    await user.click(screen.getByRole('tab', { name: /Past/ }));

    expect(screen.getByRole('heading', { name: 'Island day tour' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Hilom signature massage' })).toBeNull();
  });

  it('leads with where the stay sits in time', () => {
    render(<GuestAppPrototype initialScreen="my-stay" initialSession={activeSession} />);

    // The reference stay runs 9-12 November against a fixed prototype today.
    expect(screen.getByText('Checks out tomorrow')).toBeInTheDocument();
  });

  it('omits the running total before a stay has started', () => {
    const upcoming = sessionFor(
      [makeBooking({ id: 'soon', status: 'upcoming', checkIn: '2026-11-14', checkOut: '2026-11-17' })],
      { activeBookingId: 'soon' },
    );
    render(<GuestAppPrototype initialScreen="my-stay" initialSession={upcoming} />);

    // No folio can exist yet, so the block is absent rather than showing zero.
    expect(screen.queryByRole('heading', { name: 'Running total' })).toBeNull();
    expect(screen.getByText('Checks in in 3 days')).toBeInTheDocument();
  });

  it('docks the front desk above the tab bar rather than burying it', async () => {
    const user = userEvent.setup();
    render(<GuestAppPrototype initialScreen="my-stay" initialSession={activeSession} />);

    // It was the last row on a scrolling screen, so the one action a guest
    // wants when something is wrong was the hardest thing here to reach.
    const desk = screen.getByRole('button', { name: /Message the front desk/ });
    expect(desk.closest('.guest-dock')).not.toBeNull();

    await user.click(desk);

    expect(screen.getByRole('heading', { name: 'Front desk', level: 1 })).toBeInTheDocument();
  });
});

describe('travel checkout', () => {
  const travelSession = { ...MOCK_SESSION, activeBookingId: MOCK_SESSION.bookings[0]!.id };

  async function pickFlight(user: ReturnType<typeof userEvent.setup>) {
    await user.click(screen.getByText('Flights'));
    await user.click(screen.getByText('₱3,940').closest('button') as HTMLElement);
    await user.click(screen.getByRole('button', { name: /Continue to checkout/ }));
  }

  it('totals the fare per traveller and charges the operator, not the folio', async () => {
    const user = userEvent.setup();
    render(<GuestAppPrototype initialScreen="travel" initialSession={travelSession} />);
    await pickFlight(user);

    expect(screen.getByRole('heading', { name: 'Confirm and pay' })).toBeInTheDocument();
    // 3,940 x 2 fare, plus a 210 per-traveller fee.
    expect(screen.getByText('Fare × 2')).toBeInTheDocument();
    expect(screen.getByText('₱7,880')).toBeInTheDocument();
    expect(screen.getByText('₱420')).toBeInTheDocument();
    expect(screen.getByText('₱8,300')).toBeInTheDocument();
    expect(screen.getByText(/Not charged to your room/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Pay ₱8,300/ })).toBeInTheDocument();
  });

  it('confirms the traveller Cabana already holds ID for', async () => {
    const user = userEvent.setup();
    render(<GuestAppPrototype initialScreen="travel" initialSession={travelSession} />);
    await pickFlight(user);

    expect(screen.getByText('Ana Santos')).toBeInTheDocument();
    expect(screen.getByText('ID on file from check-in')).toBeInTheDocument();
    expect(screen.getByText('Marco Santos')).toBeInTheDocument();
  });

  it('adds cover on the leg being paid for, off by default', async () => {
    const user = userEvent.setup();
    render(<GuestAppPrototype initialScreen="travel" initialSession={MOCK_SESSION} />);
    await pickFlight(user);

    // ₱4,150 fare x2 + ₱210 fee x2 = ₱8,720 before cover.
    const before = screen.getByRole('button', { name: /^Pay / }).textContent;
    expect(screen.queryByText(/Trip cover ×/)).toBeNull();

    await user.click(screen.getByRole('checkbox'));

    expect(screen.getByText('Trip cover × 2')).toBeInTheDocument();
    // ₱720 each, so the total moves by ₱1,440.
    expect(screen.getByRole('button', { name: /^Pay / }).textContent).not.toBe(before);
  });

  it('books the leg and lands it in my stay', async () => {
    const user = userEvent.setup();
    render(<GuestAppPrototype initialScreen="travel" initialSession={travelSession} />);
    await pickFlight(user);
    await user.click(screen.getByRole('button', { name: /Pay ₱8,300/ }));

    expect(screen.getByRole('heading', { name: 'Your flight is booked' })).toBeInTheDocument();
    expect(screen.getByText(/Bring government ID/)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'View my stay' }));
    // The leg lands beside the on-property bookings rather than in a Travel
    // section of its own: My Stay is the one place the whole trip is listed.
    expect(screen.getByRole('heading', { name: 'The Henry Manila', level: 1 })).toBeInTheDocument();
    expect(screen.getByText(/Checked in · Room/)).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Upcoming/ })).toHaveAttribute('aria-selected', 'true');
    // The carrier is the card's parent, since the carrier is who gets paid.
    expect(screen.getByText('Cebu Pacific')).toBeInTheDocument();
    expect(screen.getByText(/paid to the operator/)).toBeInTheDocument();
  });

  it('names the booked leg correctly for an irregular plural', async () => {
    const user = userEvent.setup();
    render(<GuestAppPrototype initialScreen="travel" initialSession={travelSession} />);

    await user.click(screen.getByText('Ferries'));
    // Two sailings share the ₱1,250 fare, so pick by the unique operator.
    await user.click(screen.getByText('2GO Travel').closest('button') as HTMLElement);
    await user.click(screen.getByRole('button', { name: /Continue to checkout/ }));
    await user.click(screen.getByRole('button', { name: /^Pay / }));

    // "Ferries" must not become "ferrie".
    expect(screen.getByRole('heading', { name: 'Your ferry is booked' })).toBeInTheDocument();
  });

  it('refuses to hold a fare while offline instead of queueing it', async () => {
    const user = userEvent.setup();
    render(<GuestAppPrototype initialScreen="travel" initialSession={travelSession} initialOnline={false} />);
    await pickFlight(user);

    expect(screen.getByText(/Nothing was booked/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^Pay / })).toBeNull();
  });
});

describe('pre-arrival onboarding flow', () => {
  it('collects details, ID, additional guests, and early check-in across 4 steps', async () => {
    const user = userEvent.setup();
    render(<GuestAppPrototype initialScreen="guest-details" initialSession={MOCK_SESSION} />);

    // Step 1 of 4: Your details
    expect(screen.getByText('1 of 4')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Your details' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Continue to ID' }));

    // Step 2 of 4: ID capture
    expect(screen.getByText('2 of 4')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'ID or passport' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Save and continue' }));

    // Step 3 of 4: Additional guests -- room preferences no longer interrupt
    // check-in, so ID hands straight to this step.
    expect(screen.getByText('3 of 4')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Who else is staying?' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Room preferences' })).toBeNull();
    expect(screen.queryByLabelText(/Preferred floor/)).toBeNull();
    await user.click(screen.getByRole('button', { name: 'Continue' }));

    // Step 4 of 4: Early check-in
    expect(screen.getByRole('heading', { name: 'Check in earlier' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Request early check-in' }));

    // Completion opens the booking home.
    expect(screen.getByTestId('guest-home-upcoming')).toBeInTheDocument();
  });

  it('allows adding and removing companions on the additional guests screen', async () => {
    const user = userEvent.setup();
    render(<GuestAppPrototype initialScreen="additional-guests" initialSession={MOCK_SESSION} />);

    expect(screen.getByRole('heading', { name: 'Who else is staying?' })).toBeInTheDocument();

    // 1. Shows the main person as Primary guest, not as additional
    expect(screen.getByText('Primary guest')).toBeInTheDocument();
    expect(screen.getByText('Ana Santos')).toBeInTheDocument();
    expect(screen.getByText(/Lead booker/)).toBeInTheDocument();
    expect(screen.getByText(/Details & ID verified/)).toBeInTheDocument();

    // Marco Santos is listed under Additional guests
    expect(screen.getByText('Marco Santos')).toBeInTheDocument();

    // 2. Tapping "Add another guest" triggers form fill up step
    await user.click(screen.getByRole('button', { name: 'Add another guest' }));
    expect(screen.getByRole('heading', { name: 'Who is staying with you?' })).toBeInTheDocument();
    expect(screen.getByLabelText(/Full name/)).toBeInTheDocument();

    await user.type(screen.getByLabelText(/Full name/), 'Elena Santos');

    // Continuing triggers ID upload step
    await user.click(screen.getByRole('button', { name: 'Continue to ID' }));
    expect(screen.getByRole('heading', { name: 'ID or passport for Elena Santos' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Capture or upload ID/ })).toBeInTheDocument();

    await user.type(screen.getByLabelText(/Document number/), 'P9823411A');
    await user.click(screen.getByRole('button', { name: 'Save guest' }));

    // Returns to Who else is staying? with Elena Santos added
    expect(screen.getByRole('heading', { name: 'Who else is staying?' })).toBeInTheDocument();
    expect(screen.getByText('Elena Santos')).toBeInTheDocument();

    // Remove Marco Santos
    await user.click(screen.getByRole('button', { name: 'Remove Marco Santos' }));
    expect(screen.queryByText('Marco Santos')).toBeNull();
    expect(screen.getByText('Elena Santos')).toBeInTheDocument();

    // Continue to next pre-arrival step
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    expect(screen.getByRole('heading', { name: 'Check in earlier' })).toBeInTheDocument();
  });

  it('keeps room preferences editable from the profile, outside check-in', async () => {
    const user = userEvent.setup();
    render(<GuestAppPrototype initialScreen="room-preferences" initialSession={MOCK_SESSION} />);

    expect(screen.getByRole('heading', { name: 'Room preferences' })).toBeInTheDocument();
    expect(screen.getByText(/use them the next time you book/i)).toBeInTheDocument();
    // No step chrome: this is a profile screen, not a check-in question.
    expect(screen.queryByText(/of 4$/)).toBeNull();

    await user.selectOptions(screen.getByLabelText(/Bed type/), 'Twin beds');
    await user.click(screen.getByRole('button', { name: 'Save preferences' }));

    // The profile screen titles itself with the guest's name.
    expect(screen.getByRole('heading', { name: 'Ana Santos' })).toBeInTheDocument();
  });

  it('pre-fills room preferences for repeat guests and allows 1-tap confirmation', async () => {
    const user = userEvent.setup();
    render(<GuestAppPrototype initialScreen="repeat-review" initialSession={MOCK_SESSION} />);

    expect(screen.getByText(/Saved from your Cebu stay/i)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Review, then confirm' })).toBeInTheDocument();
    expect(screen.getByText(/Passport on file/)).toBeInTheDocument();
    expect(screen.getByText(/Higher floor · King bed/)).toBeInTheDocument();
    expect(screen.getByText('Marco Santos')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Confirm everything' }));
    expect(screen.getByTestId('guest-home-upcoming')).toBeInTheDocument();
  });
});

describe('guest profile', () => {
  it('displays guest identity without preferences section', () => {
    render(<GuestAppPrototype initialScreen="profile" initialSession={MOCK_SESSION} />);

    expect(screen.getByRole('heading', { name: 'Ana Santos' })).toBeInTheDocument();
    expect(screen.getByText('ana@example.com')).toBeInTheDocument();
    expect(screen.queryByText('Saved preferences')).toBeNull();
    expect(screen.queryByText('Higher floor')).toBeNull();
    expect(screen.queryByText('King bed')).toBeNull();
    expect(screen.getByText('Stay history')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign out' })).toBeInTheDocument();
  });
});

describe('home mini-apps and browsable restaurant menu', () => {
  it('renders mini-app categories on home and opens category listing', async () => {
    const user = userEvent.setup();
    render(<GuestAppPrototype initialScreen="stay-overview" initialSession={activeSession} />);

    const diningBtn = screen.getByRole('button', { name: 'Dining' });
    const spaBtn = screen.getByRole('button', { name: 'Spa' });
    const toursBtn = screen.getByRole('button', { name: 'Tours' });
    const servicesBtn = screen.getByRole('button', { name: 'Services' });

    expect(diningBtn).toBeInTheDocument();
    expect(spaBtn).toBeInTheDocument();
    expect(toursBtn).toBeInTheDocument();
    expect(servicesBtn).toBeInTheDocument();

    expect(diningBtn.querySelector('img')).toHaveAttribute('src', expect.stringContaining('category-dining'));
    expect(spaBtn.querySelector('img')).toHaveAttribute('src', expect.stringContaining('category-spa'));
    expect(toursBtn.querySelector('img')).toHaveAttribute('src', expect.stringContaining('category-tours'));
    expect(servicesBtn.querySelector('img')).toHaveAttribute('src', expect.stringContaining('category-services'));

    await user.click(diningBtn);

    expect(screen.getByRole('heading', { name: 'Food & Drink', level: 1 })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Apartment 1B' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'In-Room Dining' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'The Poolside Bar' })).toBeInTheDocument();
  });

  it('does not repeat the bookings hub inside a service category listing', async () => {
    const user = userEvent.setup();
    render(<GuestAppPrototype initialScreen="stay-overview" initialSession={activeSession} />);

    await user.click(screen.getByRole('button', { name: 'Tours' }));

    expect(screen.getByRole('heading', { name: 'Entertainment & Tours', level: 1 })).toBeInTheDocument();
    expect(screen.queryByText('View your active and upcoming bookings')).toBeNull();
    expect(screen.getByRole('navigation', { name: 'Primary navigation' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Explore' })).toBeInTheDocument();
  });

  it('navigates to browsable restaurant menu with item details, prices, and room charge notice', async () => {
    const user = userEvent.setup();
    render(<GuestAppPrototype initialScreen="stay-overview" initialSession={activeSession} />);

    await user.click(screen.getByRole('button', { name: 'Dining' }));
    await user.click(screen.getByRole('button', { name: /Apartment 1B/i }));

    // Restaurant menu view
    expect(screen.getByRole('heading', { name: 'Apartment 1B' })).toBeInTheDocument();
    expect(screen.getByText(/Gourmet comfort food/i)).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'All Items' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Starters' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Mains' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Desserts' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Drinks' })).toBeInTheDocument();

    // Menu items
    expect(screen.getByRole('heading', { name: 'Crispy Calamari' })).toBeInTheDocument();
    expect(screen.getByText('₱480')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Grilled Angus Ribeye' })).toBeInTheDocument();
    expect(screen.getByText('₱1,850')).toBeInTheDocument();

    // Filter by Mains tab
    await user.click(screen.getByRole('tab', { name: 'Mains' }));
    expect(screen.queryByRole('heading', { name: 'Crispy Calamari' })).toBeNull();
    expect(screen.getByRole('heading', { name: 'Grilled Angus Ribeye' })).toBeInTheDocument();

    // Items enter a venue cart before anything reaches the folio.
    await user.click(screen.getByRole('button', { name: 'Add Grilled Angus Ribeye' }));
    expect(screen.getByRole('button', { name: /View Apartment 1B cart · 1 item · ₱1,850/ })).toBeInTheDocument();
    expect(screen.queryByText('Order added to room')).toBeNull();
  });

  it('builds and edits a venue cart before opening order review', async () => {
    const user = userEvent.setup();
    render(<GuestAppPrototype initialScreen="restaurant-menu" initialSession={activeSession} />);

    await user.click(screen.getByRole('button', { name: 'Add Crispy Calamari' }));
    await user.click(screen.getByRole('button', { name: 'Add Grilled Angus Ribeye' }));
    expect(screen.getByRole('button', { name: /View Apartment 1B cart · 2 items · ₱2,330/ })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Increase Crispy Calamari quantity' }));
    expect(screen.getByRole('button', { name: /View Apartment 1B cart · 3 items · ₱2,810/ })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /View Apartment 1B cart/ }));
    expect(screen.getByRole('heading', { name: 'Your Apartment 1B order' })).toBeInTheDocument();
    expect(screen.getByText('3 items')).toBeInTheDocument();
  });

  it('keeps independent carts for each dining establishment', async () => {
    const user = userEvent.setup();
    render(<GuestAppPrototype initialScreen="restaurant-menu" initialSession={activeSession} />);

    await user.click(screen.getByRole('button', { name: 'Add Crispy Calamari' }));
    await user.click(screen.getByRole('button', { name: 'Back to Food & Drink' }));
    await user.click(screen.getByRole('button', { name: /In-Room Dining/i }));
    await user.click(screen.getByRole('button', { name: 'Add Filipino Breakfast Tocino Set' }));
    expect(screen.getByRole('button', { name: /View In-Room Dining cart · 1 item · ₱480/ })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Back to Food & Drink' }));
    await user.click(screen.getByRole('button', { name: /Apartment 1B/i }));
    expect(screen.getByRole('button', { name: /View Apartment 1B cart · 1 item · ₱480/ })).toBeInTheDocument();
  });

  it('clears only the establishment cart that was confirmed', async () => {
    const user = userEvent.setup();
    render(<GuestAppPrototype initialScreen="restaurant-menu" initialSession={activeSession} />);

    await user.click(screen.getByRole('button', { name: 'Add Crispy Calamari' }));
    await user.click(screen.getByRole('button', { name: 'Back to Food & Drink' }));
    await user.click(screen.getByRole('button', { name: /In-Room Dining/i }));
    await user.click(screen.getByRole('button', { name: 'Add Filipino Breakfast Tocino Set' }));
    await user.click(screen.getByRole('button', { name: /View In-Room Dining cart/ }));
    await user.click(screen.getByRole('button', { name: 'Place order and charge to room' }));
    await user.click(screen.getByRole('button', { name: 'Order from another establishment' }));

    await user.click(screen.getByRole('button', { name: /In-Room Dining/i }));
    expect(screen.queryByRole('button', { name: /View In-Room Dining cart/ })).toBeNull();
    await user.click(screen.getByRole('button', { name: 'Back to Food & Drink' }));
    await user.click(screen.getByRole('button', { name: /Apartment 1B/i }));
    expect(screen.getByRole('button', { name: /View Apartment 1B cart · 1 item · ₱480/ })).toBeInTheDocument();
  });

  it('confirms a dining order once and adds its grouped total to the room folio', async () => {
    const user = userEvent.setup();
    render(<GuestAppPrototype initialScreen="restaurant-menu" initialSession={activeSession} />);

    await user.click(screen.getByRole('button', { name: 'Add Crispy Calamari' }));
    await user.click(screen.getByRole('button', { name: 'Increase Crispy Calamari quantity' }));
    await user.click(screen.getByRole('button', { name: 'Add Grilled Angus Ribeye' }));
    await user.click(screen.getByRole('button', { name: /View Apartment 1B cart/ }));

    expect(screen.getByRole('button', { name: 'Deliver to room' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'As soon as possible' })).toHaveAttribute('aria-pressed', 'true');
    await user.click(screen.getByRole('button', { name: 'Place order and charge to room' }));

    expect(screen.getByRole('heading', { name: 'Your order is on its way' })).toBeInTheDocument();
    expect(screen.getByText('Deliver to Room 304 · As soon as possible')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'View room charges' }));

    expect(screen.getByRole('heading', { name: 'Room charges' })).toBeInTheDocument();
    expect(screen.getByText('₱5,860')).toBeInTheDocument();
    expect(screen.getByText('Apartment 1B')).toBeInTheDocument();
    expect(screen.getByText(/3 items · Deliver to Room 304 · As soon as possible/)).toBeInTheDocument();
  });

  it('supports scheduled pickup for a dining order', async () => {
    const user = userEvent.setup();
    render(<GuestAppPrototype initialScreen="restaurant-menu" initialSession={activeSession} />);

    await user.click(screen.getByRole('button', { name: 'Add Crispy Calamari' }));
    await user.click(screen.getByRole('button', { name: /View Apartment 1B cart/ }));
    await user.click(screen.getByRole('button', { name: 'Pick up' }));
    await user.click(screen.getByRole('button', { name: '7:00 PM' }));
    await user.click(screen.getByRole('button', { name: 'Place order and charge to room' }));

    expect(screen.getByText('Pick up at Apartment 1B · Today, 7:00 PM')).toBeInTheDocument();
  });

  it('preserves an offline dining cart and blocks submission', async () => {
    const user = userEvent.setup();
    render(<GuestAppPrototype initialScreen="restaurant-menu" initialSession={activeSession} initialOnline={false} />);

    await user.click(screen.getByRole('button', { name: 'Add Crispy Calamari' }));
    await user.click(screen.getByRole('button', { name: /View Apartment 1B cart/ }));
    await user.click(screen.getByRole('button', { name: 'Place order and charge to room' }));

    expect(screen.getByText('Connect to place this order')).toBeInTheDocument();
    expect(screen.getByText('Crispy Calamari')).toBeInTheDocument();
    expect(screen.getByText('1 item')).toBeInTheDocument();
  });

  it('disables room delivery until a room is assigned', async () => {
    const user = userEvent.setup();
    const noRoomSession = sessionFor([makeBooking({ id: 'active', status: 'active' })], { activeBookingId: 'active' });
    render(<GuestAppPrototype initialScreen="restaurant-menu" initialSession={noRoomSession} />);

    await user.click(screen.getByRole('button', { name: 'Add Crispy Calamari' }));
    await user.click(screen.getByRole('button', { name: /View Apartment 1B cart/ }));

    expect(screen.getByRole('button', { name: 'Deliver to room' })).toBeDisabled();
    expect(screen.getByText('Room delivery is available after your room is assigned.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Pick up' })).toBeEnabled();
  });

  it('shows the explore catalogue and nothing the guest has already booked', async () => {
    const user = userEvent.setup();
    render(<GuestAppPrototype initialScreen="marketplace" initialSession={activeSession} />);

    expect(screen.getByRole('heading', { name: 'Explore', level: 1 })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Categories' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Hilom signature massage' })).toBeInTheDocument();
    // The guest's own bookings live in My Trip. A catalogue that also listed
    // them is what made the old hub tell people to go elsewhere to browse.
    expect(screen.queryByRole('heading', { name: 'Upcoming & Confirmed' })).toBeNull();
    expect(screen.queryByRole('heading', { name: 'Past & Completed' })).toBeNull();

    // Travel is a category in the grid now, not a section of its own.
    expect(screen.queryByRole('heading', { name: 'Onward travel' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Travel' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Food & Drink' }));
    expect(screen.getByRole('heading', { name: 'Food & Drink', level: 1 })).toBeInTheDocument();
  });
});
