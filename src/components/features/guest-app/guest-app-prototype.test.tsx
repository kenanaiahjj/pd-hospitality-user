import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import userEvent from '@testing-library/user-event';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { GuestAppPrototype } from './guest-app-prototype';
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
  preArrivalTotal: 5,
  stayQrAvailable: false,
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
  ...overrides,
});

const activeSession = sessionFor(
  [
    makeBooking({
      id: 'active',
      status: 'active',
      roomNumber: '304',
      stayQrAvailable: true,
      folioTotal: '₱3,050',
    }),
  ],
  { activeBookingId: 'active', folioTotal: '₱3,050' },
);

beforeAll(() => {
  Object.defineProperty(window, 'scrollTo', { value: vi.fn(), writable: true });
});

describe('GuestAppPrototype', () => {
  it('starts first-time guests at booking-linked onboarding without primary navigation', () => {
    render(<GuestAppPrototype />);

    expect(screen.getByText('Klarna', { exact: true })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Your stay starts here' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Open confirmation link' })).toBeInTheDocument();
    expect(screen.queryByRole('navigation', { name: 'Primary navigation' })).toBeNull();
  });

  it('connects a booking and reaches the matched-stay confirmation', () => {
    render(<GuestAppPrototype />);

    fireEvent.click(screen.getByRole('button', { name: 'Open confirmation link' }));
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

  it('turns a room QR link into an active stay home', async () => {
    const user = userEvent.setup();
    render(<GuestAppPrototype />);

    await user.click(screen.getByRole('button', { name: 'Simulate Room QR' }));
    await user.click(screen.getByRole('button', { name: 'Link my stay' }));
    await user.click(screen.getByRole('button', { name: 'Open stay overview' }));

    expect(screen.getByTestId('guest-home-active')).toBeInTheDocument();
    expect(screen.getByText(/room 304/i)).toBeInTheDocument();
  });

  it('returns a pre-arrival guest to the upcoming home after registration', async () => {
    const user = userEvent.setup();
    render(<GuestAppPrototype initialScreen="prereg-complete" />);

    expect(screen.getByRole('button', { name: /view my stay/i })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /view my stay/i }));

    expect(screen.getByTestId('guest-home-upcoming')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /your stay qr/i })).toBeNull();
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
      stayQrAvailable: true,
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
    expect(screen.getByText(/stay qr/i)).toBeInTheDocument();
    expect(screen.getByText(/room 304/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /room charges/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /ask front desk/i })).toBeInTheDocument();
  });

  it('shows room settlement and confirms a service without a payment method', async () => {
    const user = userEvent.setup();
    const active = makeBooking({
      id: 'active',
      property: 'The Henry Cebu',
      city: 'Cebu',
      status: 'active',
      roomNumber: '512',
      stayQrAvailable: true,
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
      stayQrAvailable: true,
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

  it('groups account actions and keeps four stable app destinations', () => {
    render(<GuestAppPrototype initialScreen="stay-overview" initialSession={activeSession} />);

    expect(screen.getByRole('group', { name: 'Your account' })).toBeInTheDocument();
    const navigation = screen.getByRole('navigation', { name: 'Primary navigation' });
    expect(navigation.querySelectorAll('button')).toHaveLength(4);
    for (const label of ['Stay', 'Services', 'Wallet', 'Chat']) {
      expect(screen.getByRole('button', { name: label })).toBeInTheDocument();
    }
  });

  it('navigates from home to the services app section', () => {
    render(<GuestAppPrototype initialScreen="stay-overview" />);

    fireEvent.click(screen.getByRole('button', { name: 'Services' }));
    expect(screen.getByRole('heading', { name: 'Make the most of your stay' })).toBeInTheDocument();
  });

  it('keeps the Stay QR feature connected to the wallet', () => {
    render(<GuestAppPrototype initialScreen="stay-overview" initialSession={activeSession} />);

    fireEvent.click(screen.getByRole('button', { name: /Stay QR/i }));
    expect(screen.getByRole('heading', { name: 'Your Stay QR' })).toBeInTheDocument();
  });

  it('labels the booking state and profile action for assistive technology', () => {
    render(<GuestAppPrototype initialScreen="stay-overview" initialSession={activeSession} />);

    expect(screen.getByRole('navigation', { name: /primary navigation/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /open profile/i })).toBeInTheDocument();
    expect(screen.getByTestId('guest-home-active')).toHaveClass('guest-home-booking', 'guest-home-booking--active');
    expect(guestStyles).toContain('.guest-home-booking--active {');
  });

  it('renders a contextual spa image with a resilient fallback', () => {
    render(<GuestAppPrototype initialScreen="stay-overview" />);

    fireEvent.click(screen.getByRole('button', { name: 'Services' }));
    const image = screen.getByRole('img', { name: /spa treatment/i });

    expect(image).toBeInTheDocument();
    fireEvent.error(image);
    expect(image.closest('.guest-service-image')).toHaveClass('is-error');
    expect(screen.getByRole('button', { name: /View service/i })).toBeEnabled();
  });

  it('consumes the shared pink, white, and black color system', () => {
    expect(globalStyles).toContain('--ds-ink: oklch(0.16 0.012 275);');
    expect(globalStyles).toContain('--ds-paper: oklch(1 0 0);');
    expect(globalStyles).toContain('--ds-pink: oklch(0.79 0.18 345);');
    expect(globalStyles).toContain('--primitive-ink: var(--ds-ink);');
    expect(globalStyles).toContain('--primitive-pink: var(--ds-pink);');
    expect(guestStyles).toContain('--guest-ink: var(--ds-ink);');
    expect(guestStyles).toContain('--guest-paper: var(--ds-paper);');
    expect(guestStyles).toContain('--guest-soft: var(--ds-pink-soft);');
    expect(guestStyles).toContain('--guest-blue: var(--ds-pink);');
    expect(guestStyles).toContain('.guest-app--focus-dark .guest-notice {');
    expect(guestStyles).toContain('color: var(--guest-ink);');
    expect(guestStyles).toContain('background: var(--guest-blue); color: var(--guest-ink) !important; text-align: left;');
    expect(guestStyles).toContain('.guest-stay-card__art { display: grid; height: 106px; place-items: center; background: var(--guest-accent-gradient);');
    for (const tone of ['sage', 'sand', 'clay', 'blue', 'sun']) {
      expect(guestStyles).toContain(`.guest-service-visual--${tone} { background: var(--guest-accent-gradient); }`);
    }
  });

  it('keeps status colors separate from the decorative palette', () => {
    expect(guestStyles).toContain('--guest-positive: oklch(0.56 0.105 150);');
    expect(guestStyles).toContain('--guest-warning: oklch(0.64 0.12 73);');
    expect(guestStyles).toContain('--guest-danger: oklch(0.54 0.17 25);');
  });
});
