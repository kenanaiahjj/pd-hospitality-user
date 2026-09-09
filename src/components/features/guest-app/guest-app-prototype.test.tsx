import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import userEvent from '@testing-library/user-event';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { GuestAppPrototype } from './guest-app-prototype';
import {
  MOCK_SESSION,
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

beforeAll(() => {
  Object.defineProperty(window, 'scrollTo', { value: vi.fn(), writable: true });
});

describe('GuestAppPrototype', () => {
  it('opens on a focused booking-first welcome screen without app chrome', () => {
    render(<GuestAppPrototype />);

    expect(screen.getAllByText('Cabana', { exact: true })).toHaveLength(2);
    expect(screen.getAllByText('Your Home Away From Home')).toHaveLength(2);
    expect(screen.getByRole('heading', { name: 'Welcome to your stay' })).toBeInTheDocument();
    expect(screen.getByText('Find your booking to check in and access everything you need during your stay.')).toBeInTheDocument();
    expect(screen.getByText('Check in before arrival')).toBeInTheDocument();
    expect(screen.getByText('Skip the front desk paperwork')).toBeInTheDocument();
    expect(screen.getByText('View charges and hotel services')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Find my booking' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /create account/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /log in/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /room qr/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /hotel wi-fi/i })).toBeNull();
    expect(screen.queryByText(/13 destinations/i)).toBeNull();
    expect(screen.queryByRole('region', { name: /experience showcase/i })).toBeNull();
    expect(screen.queryByRole('banner')).toBeNull();
    expect(screen.queryByRole('navigation', { name: 'Primary navigation' })).toBeNull();
  });

  it('opens the booking access methods from the welcome action', async () => {
    const user = userEvent.setup();
    render(<GuestAppPrototype />);

    await user.click(screen.getByRole('button', { name: 'Find my booking' }));

    expect(screen.getByRole('heading', { name: 'Find your booking' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Booking email' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Continue with room QR' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Open hotel Wi-Fi entry' })).toBeInTheDocument();
  });

  it('connects a booking and reaches the matched-stay confirmation', () => {
    render(<GuestAppPrototype initialScreen="connect-booking" />);

    fireEvent.click(screen.getByRole('button', { name: 'Booking email' }));
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
  });

  it('opens the active stay home as soon as a room QR links the stay', async () => {
    const user = userEvent.setup();
    render(<GuestAppPrototype initialScreen="room-qr-landing" />);

    await user.type(screen.getByLabelText(/Last name/), 'Santos');
    await user.click(screen.getByRole('button', { name: 'Link my stay' }));

    expect(screen.getByTestId('guest-home-active')).toBeInTheDocument();
    expect(screen.getByText(/room 304/i)).toBeInTheDocument();
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

    await user.click(screen.getByRole('button', { name: 'Yes, this is my stay' }));

    expect(screen.getByTestId('guest-home-upcoming')).toBeInTheDocument();
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
    expect(screen.getByText(/room 304/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /room charges/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /chat/i })).toBeInTheDocument();
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

    await user.click(screen.getByRole('button', { name: 'View my bookings' }));
    await user.click(screen.getByRole('button', { name: 'Stay' }));
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
        initialScreen="my-bookings"
        initialSession={sessionFor([active], {
          activeBookingId: 'active',
          folioTotal: '₱5,450',
          serviceBookings: [{
            id: 'service-hilom-1',
            bookingId: 'active',
            title: 'Hilom signature massage',
            scheduledFor: 'Tuesday · November 11 · 1:30 PM',
            amount: '₱2,400',
            status: 'confirmed',
          }],
        })}
      />,
    );

    expect(screen.getByText(/room 512/i)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /hilom signature massage/i }));
    await user.click(screen.getByRole('button', { name: /cancel service/i }));
    expect(screen.getByText('Cancelled')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Stay' }));
    await user.click(screen.getByRole('button', { name: /room charges/i }));
    expect(screen.getByText('₱3,050')).toBeInTheDocument();
  });

  it('groups account actions and keeps three stable app destinations', () => {
    render(<GuestAppPrototype initialScreen="stay-overview" initialSession={activeSession} />);

    expect(screen.getByRole('group', { name: 'Your account' })).toBeInTheDocument();
    const navigation = screen.getByRole('navigation', { name: 'Primary navigation' });
    expect(navigation.querySelectorAll('button')).toHaveLength(3);
    for (const label of ['Stay', 'Bookings', 'Chat']) {
      expect(screen.getByRole('button', { name: label })).toBeInTheDocument();
    }
    expect(screen.queryByRole('button', { name: 'Wallet' })).toBeNull();
  });

  it('navigates from home to the bookings hub section', () => {
    render(<GuestAppPrototype initialScreen="stay-overview" initialSession={MOCK_SESSION} />);

    fireEvent.click(screen.getByRole('button', { name: 'Bookings' }));
    expect(screen.getByRole('heading', { name: 'Bookings Hub' })).toBeInTheDocument();
  });

  it('carries the room QR last name into the stay greeting', async () => {
    const user = userEvent.setup();
    render(<GuestAppPrototype initialScreen="room-qr-landing" />);

    await user.type(screen.getByLabelText(/Last name/), 'Santos');
    await user.click(screen.getByRole('button', { name: 'Link my stay' }));

    expect(screen.getByTestId('guest-home-active')).toBeInTheDocument();
    expect(screen.getByText(/Good (morning|afternoon|evening), Santos/)).toBeInTheDocument();
  });

  it('labels the booking state and profile action for assistive technology', () => {
    render(<GuestAppPrototype initialScreen="stay-overview" initialSession={activeSession} />);

    expect(screen.getByRole('navigation', { name: /primary navigation/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /open profile/i })).toBeInTheDocument();
    expect(screen.getByTestId('guest-home-active')).toHaveClass('guest-home-booking', 'guest-home-booking--active');
  });

  it('renders a contextual spa image with a resilient fallback', () => {
    render(<GuestAppPrototype initialScreen="stay-overview" initialSession={MOCK_SESSION} />);

    fireEvent.click(screen.getByRole('button', { name: 'Bookings' }));
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
    expect(guestStyles).not.toMatch(/transition:\s*all/);
    expect(globalStyles).not.toMatch(/transition:\s*all/);
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

    await user.click(screen.getByRole('button', { name: 'Booking email' }));
    await user.type(screen.getByLabelText(/Booking or confirmation number/), 'HEN-241109');
    await user.type(screen.getByLabelText(/Last name/), 'Santos');
    await user.click(screen.getByRole('button', { name: 'Find booking' }));
    await user.click(screen.getByRole('button', { name: 'Yes, this is my stay' }));

    // Directly reaches pre-arrival Step 1 of 5 without an account creation gate
    expect(screen.getByRole('heading', { name: 'Your details' })).toBeInTheDocument();
    expect(screen.getByText('1 of 5')).toBeInTheDocument();
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

    expect(screen.getByRole('button', { name: 'Find my booking' })).toBeInTheDocument();
    expect(screen.queryByRole('navigation', { name: 'Primary navigation' })).toBeNull();
  });

  it('hides the profile action until an account exists', () => {
    render(<GuestAppPrototype />);

    expect(screen.queryByRole('button', { name: /open profile/i })).toBeNull();
  });

  it('keeps the welcome focused and exposes local booking options offline', async () => {
    const user = userEvent.setup();
    render(<GuestAppPrototype initialOnline={false} />);

    expect(screen.queryByText(/Offline mode active/i)).toBeNull();
    await user.click(screen.getByRole('button', { name: 'Find my booking' }));

    expect(screen.getByRole('button', { name: 'Continue with room QR' })).toBeEnabled();
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
    expect(guestStyles).toContain('.guest-welcome__proof-card');
    expect(guestStyles).toMatch(/\.guest-welcome[^}]*background: #fff/);
    expect(guestStyles).toContain('.guest-password-wrapper');
    expect(guestStyles).toContain('.guest-password-toggle');
    expect(guestStyles).toContain('.guest-code-field');
    expect(guestStyles).toMatch(/\.guest-code-field[^}]*letter-spacing/);
  });
});

describe('pre-arrival onboarding flow', () => {
  it('collects details, ID, room preferences, additional guests, and early check-in across 5 steps', async () => {
    const user = userEvent.setup();
    render(<GuestAppPrototype initialScreen="guest-details" initialSession={MOCK_SESSION} />);

    // Step 1 of 5: Your details
    expect(screen.getByText('1 of 5')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Your details' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Continue to ID' }));

    // Step 2 of 5: ID capture
    expect(screen.getByText('2 of 5')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'ID or passport' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Save and continue' }));

    // Step 3 of 5: Room preferences (floor, bed type, accessibility needs)
    expect(screen.getByText('3 of 5')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Room preferences' })).toBeInTheDocument();
    expect(screen.getByLabelText(/Preferred floor/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Bed type/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Step-free room access/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Save and continue' }));

    // Step 4 of 5: Additional guests
    expect(screen.getByText('4 of 5')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Who else is staying?' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Continue' }));

    // Step 5 of 5: Early check-in
    expect(screen.getByRole('heading', { name: 'Check in earlier' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Request early check-in' }));

    // Completion opens the booking home.
    expect(screen.getByTestId('guest-home-upcoming')).toBeInTheDocument();
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

    expect(screen.getByRole('group', { name: 'Experience categories' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Food & Drink' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Spa & Wellness' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Entertainment & Tours' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Hotel Services' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Food & Drink/i }));

    expect(screen.getByRole('heading', { name: 'Food & Drink', level: 1 })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Apartment 1B' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'In-Room Dining' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'The Poolside Bar' })).toBeInTheDocument();
  });

  it('does not repeat the bookings hub inside a service category listing', async () => {
    const user = userEvent.setup();
    render(<GuestAppPrototype initialScreen="stay-overview" initialSession={activeSession} />);

    await user.click(screen.getByRole('button', { name: /Entertainment & Tours/i }));

    expect(screen.getByRole('heading', { name: 'Entertainment & Tours', level: 1 })).toBeInTheDocument();
    expect(screen.queryByText('View your active and upcoming bookings')).toBeNull();
    expect(screen.getByRole('navigation', { name: 'Primary navigation' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Bookings' })).toBeInTheDocument();
  });

  it('navigates to browsable restaurant menu with item details, prices, and room charge notice', async () => {
    const user = userEvent.setup();
    render(<GuestAppPrototype initialScreen="stay-overview" initialSession={activeSession} />);

    await user.click(screen.getByRole('button', { name: /Food & Drink/i }));
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

  it('displays bookings hub with categories and past activities', async () => {
    const user = userEvent.setup();
    render(<GuestAppPrototype initialScreen="marketplace" initialSession={activeSession} />);

    expect(screen.getByRole('heading', { name: 'Bookings Hub' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Hilom signature massage' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Explore categories' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Food & drink' }));
    expect(screen.getByRole('heading', { name: 'Food & Drink', level: 1 })).toBeInTheDocument();
  });
});
