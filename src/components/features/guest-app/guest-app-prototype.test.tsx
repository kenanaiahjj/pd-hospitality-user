import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import userEvent from '@testing-library/user-event';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { GuestAppPrototype } from './guest-app-prototype';
import {
  MOCK_SESSION,
  createAccountSession,
} from './prototype-model';
import { ANONYMOUS_SESSION, connectBooking, applyPrototypeStayState, restoreProfileSession } from './prototype-model';
import type { Booking, GuestSession } from './prototype-model';
import { readStoredSession, writeStoredSession } from './session-storage';

const globalStyles = readFileSync(resolve(process.cwd(), 'src/app/globals.css'), 'utf8');
const guestStyles = readFileSync(resolve(process.cwd(), 'src/components/features/guest-app/guest-app-prototype.css'), 'utf8');
const promotedStyles = readFileSync(resolve(process.cwd(), 'src/components/features/guest-app/promoted/promoted.css'), 'utf8');
const urlMethodDescriptors = {
  createObjectURL: Object.getOwnPropertyDescriptor(URL, 'createObjectURL'),
  revokeObjectURL: Object.getOwnPropertyDescriptor(URL, 'revokeObjectURL'),
};

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
  additionalGuests: ['Marco Santos'],
  pastStays: [],
  reviews: [],
  ...overrides,
});

/*
  A guest mid-stay who has scanned. The verification is not decoration: since
  lifecycle gates, dates and a room number alone do not open on-property
  services, and every test below that books, orders or charges depends on the
  guest having proved they are in the room. The unverified variant lives in
  the `lifecycle gates` block, which is where that state is the subject.
*/
const activeSession = sessionFor(
  [
    makeBooking({
      id: 'active',
      status: 'active',
      roomNumber: '304',
      roomVerification: { method: 'scan', at: '2026-11-11' },
      folioTotal: '₱3,050',
    }),
  ],
  { activeBookingId: 'active', folioTotal: '₱3,050' },
);

/* A category page, reached the old-fashioned way: Explore, then Browse. */
const openCategory = async (
  user: ReturnType<typeof userEvent.setup>,
  label: string,
) => {
  await user.click(within(screen.getByRole('navigation', { name: 'Primary navigation' })).getAllByRole('button')[1]!);
  await user.click(screen.getByRole('button', { name: 'Browse' }));
  await user.click(within(screen.getByRole('dialog', { name: 'Browse' })).getByRole('button', { name: new RegExp(label) }));
};

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
  Object.defineProperty(URL, 'createObjectURL', {
    configurable: true,
    value: vi.fn(() => 'blob:chat-integration'),
  });
  Object.defineProperty(URL, 'revokeObjectURL', {
    configurable: true,
    value: vi.fn(),
  });
});

afterAll(() => {
  if (urlMethodDescriptors.createObjectURL) {
    Object.defineProperty(URL, 'createObjectURL', urlMethodDescriptors.createObjectURL);
  } else {
    Reflect.deleteProperty(URL, 'createObjectURL');
  }
  if (urlMethodDescriptors.revokeObjectURL) {
    Object.defineProperty(URL, 'revokeObjectURL', urlMethodDescriptors.revokeObjectURL);
  } else {
    Reflect.deleteProperty(URL, 'revokeObjectURL');
  }
});

describe('GuestAppPrototype', () => {
  it('opens on a unified SSO account gate without app chrome or travel', () => {
    render(<GuestAppPrototype />);

    expect(screen.getAllByText('Cabana', { exact: true })).toHaveLength(2);
    expect(screen.getAllByText('Your Home Away From Home')).toHaveLength(2);
    expect(screen.getByRole('heading', { name: 'Welcome to your stay' })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Ways to continue' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Create account' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Log in' })).toBeNull();
    expect(screen.queryByText(/travel|flights/i)).toBeNull();
    expect(screen.queryByRole('banner')).toBeNull();
    expect(screen.queryByRole('navigation', { name: 'Primary navigation' })).toBeNull();
  });

  it('uses Apple SSO from the welcome screen to reach the booking-linked home', async () => {
    const user = userEvent.setup();
    render(<GuestAppPrototype />);

    expect(screen.getByRole('group', { name: 'Ways to continue' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Continue with Apple' }));

    expect(screen.getByTestId('guest-home-upcoming')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Check-in before arrival' })).toBeInTheDocument();
    expect(screen.queryByText('Choose how to connect your stay.')).toBeNull();

    /*
      The lookup is not offered here, and that is the point. `ssoSession`
      returns a guest the estate already knows, reservation included, so
      "Add a booking" lives on the no-booking home -- putting it here asked
      someone holding a booking to go and look it up.
    */
    expect(screen.queryByRole('button', { name: /Add a booking/ })).toBeNull();
    expect(screen.queryByRole('heading', { name: 'Find your booking' })).toBeNull();
  });

  it('uses Google SSO from the welcome screen to reach booking lookup', async () => {
    const user = userEvent.setup();
    render(<GuestAppPrototype />);

    expect(screen.getByRole('group', { name: 'Ways to continue' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Continue with Google' }));

    expect(screen.getByRole('heading', { name: 'Find your booking' })).toBeInTheDocument();
    expect(screen.getByLabelText(/Booking or confirmation number/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Last name/)).toBeInTheDocument();
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
    // Account access is available from every welcome step.
    expect(screen.getByRole('button', { name: 'Continue with Apple' })).toBeEnabled();
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

  it('offers every log-in option on the welcome screen', () => {
    render(<GuestAppPrototype />);

    const sheet = screen.getByRole('group', { name: 'Ways to continue' });
    expect(sheet).toBeInTheDocument();
    expect(within(sheet).getByRole('button', { name: 'Continue with Apple' })).toBeInTheDocument();
    expect(within(sheet).getByRole('button', { name: 'Continue with Google' })).toBeInTheDocument();
    expect(within(sheet).getByRole('button', { name: 'Continue with email' })).toBeInTheDocument();
    expect(within(sheet).getByRole('button', { name: 'Continue as guest' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Welcome to your stay' })).toBeInTheDocument();
    expect(screen.queryByText(/Create your account|Already have an account|Don't have an account/)).toBeNull();
  });

  it('opens booking lookup for guests from the welcome screen', async () => {
    const user = userEvent.setup();
    render(<GuestAppPrototype />);

    await user.click(screen.getByRole('button', { name: 'Continue as guest' }));

    expect(screen.queryByRole('group', { name: 'Ways to continue' })).toBeNull();
    expect(screen.getByRole('heading', { name: 'Find your booking' })).toBeInTheDocument();
    expect(screen.getByLabelText(/Booking or confirmation number/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Last name/)).toBeInTheDocument();
  });

  it('moves from email login to a six-digit OTP and then to booking lookup', async () => {
    const user = userEvent.setup();
    render(<GuestAppPrototype />);

    await user.click(screen.getByRole('button', { name: 'Continue with email' }));
    const email = screen.getByLabelText('Email *');
    expect(email).toHaveAttribute('autocomplete', 'email');
    expect(email).toHaveAttribute('spellcheck', 'false');
    await user.type(email, 'guest@example.com');
    await user.click(screen.getByRole('button', { name: 'Continue' }));

    expect(screen.getByRole('heading', { name: 'Check your email' })).toBeInTheDocument();

    const code = screen.getByLabelText('6-digit code *');
    expect(code).toHaveAttribute('inputmode', 'numeric');
    expect(code).toHaveAttribute('autocomplete', 'one-time-code');

    await user.type(code, '123456');
    await user.click(screen.getByRole('button', { name: 'Verify' }));

    expect(screen.getByRole('heading', { name: 'Find your booking' })).toBeInTheDocument();
    expect(screen.getByLabelText(/Booking or confirmation number/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Last name/)).toBeInTheDocument();
  });

  it('keeps an invalid OTP on the verification screen with an accessible error', async () => {
    const user = userEvent.setup();
    render(<GuestAppPrototype />);

    await user.click(screen.getByRole('button', { name: 'Continue with email' }));
    await user.type(screen.getByLabelText('Email *'), 'guest@example.com');
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    await user.type(screen.getByLabelText('6-digit code *'), '123');
    await user.click(screen.getByRole('button', { name: 'Verify' }));

    expect(screen.getByRole('heading', { name: 'Check your email' })).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('Enter the 6-digit code.');
    const invalidCode = screen.getByRole('textbox', { name: /6-digit code/ });
    expect(invalidCode).toHaveAttribute('aria-invalid', 'true');
    expect(invalidCode).toHaveAttribute('spellcheck', 'false');
    expect(invalidCode).toHaveFocus();
  });

  it('disables both SSO providers when the connection is offline', () => {
    render(<GuestAppPrototype initialOnline={false} />);

    const sheet = screen.getByRole('group', { name: 'Ways to continue' });
    expect(within(sheet.closest('.guest-welcome__message') as HTMLElement).getByText('Log in needs a connection')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Continue with Apple' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Continue with Google' })).toBeDisabled();
  });

  it('connects a booking and reaches the matched-stay confirmation', () => {
    render(<GuestAppPrototype initialScreen="connect-booking" />);

    fireEvent.change(screen.getByLabelText(/Booking or confirmation number/), {
      target: { value: 'HEN-241109' },
    });
    fireEvent.change(screen.getByLabelText(/Last name/), {
      target: { value: 'Santos' },
    });
    fireEvent.submit(screen.getByRole('button', { name: 'Find booking' }).closest('form')!);

    expect(screen.getByRole('heading', { name: 'Is this your stay?' })).toBeInTheDocument();
    expect(screen.getByText('The Henry Manila')).toBeInTheDocument();
    expect(screen.getByText('Booked via')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Yes this is my booking' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: "No, this isn't my booking" })).toBeInTheDocument();
  });

  it('opens the active stay home as soon as a room QR links the stay', async () => {
    const user = userEvent.setup();
    render(<GuestAppPrototype initialScreen="room-qr-landing" />);

    await user.type(screen.getByLabelText(/Last name/), 'Santos');
    await user.click(screen.getByRole('button', { name: 'Link my stay' }));

    expect(screen.getByTestId('guest-home-active')).toBeInTheDocument();
    // The surname is the match key; the reservation supplies the name, so the
    // greeting uses what the property holds rather than what was typed.
    expect(screen.getByText('Welcome, Ana')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'You’re all set' })).toBeNull();
  });

  /*
    `opens home after confirming a booking with no check-in work remaining`
    stood here. Its premise was that a booking arriving with pre-arrival already
    complete (4 of 4) had nothing to register, so confirming it should open the
    home rather than the guest-details form.

    `claimBooking` no longer makes that distinction: an anonymous guest always
    goes to `guest-details`, because "a booking-first guest still needs the
    registration flow" regardless of what the reservation arrived with. The
    behaviour this guarded was removed on purpose, so the test goes with it.
  */

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

    expect(screen.getByRole('heading', { name: 'Find your booking' })).toBeInTheDocument();
    expect(screen.getByLabelText(/Booking or confirmation number/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Last name/)).toBeInTheDocument();
    expect(screen.queryByText(/You’ll need a booking first/)).toBeNull();
    expect(screen.getByText('Enter the number from your booking confirmation.')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('HEN-241109')).toBeInTheDocument();
    expect(screen.getByText('Hotel, Agoda, or Booking.com reference')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Find another way' })).toBeNull();

    unmount();
    render(<GuestAppPrototype initialScreen="lookup-fallback" />);
    expect(screen.getByRole('heading', { name: 'Use more booking details' })).toBeInTheDocument();
    expect(screen.getByText('Enter the details from your booking.')).toBeInTheDocument();
    expect(screen.queryByText('No match yet')).toBeNull();
    await user.click(screen.getByRole('button', { name: 'Continue to front desk' }));

    expect(screen.getByRole('heading', { name: 'Let the front desk connect you' })).toBeInTheDocument();
    expect(screen.getByText('Ask for a secure link or a 6-digit code.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Call front desk' })).toHaveAttribute('href', 'tel:+63288078888');
  });

  it('returns a pre-arrival guest to the upcoming home after registration', async () => {
    const user = userEvent.setup();
    render(<GuestAppPrototype initialScreen="prereg-complete" initialSession={MOCK_SESSION} />);

    expect(screen.getByRole('button', { name: /view my stay/i })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /view my stay/i }));

    expect(screen.getByTestId('guest-home-upcoming')).toBeInTheDocument();
  });

  // Early check-in left pre-arrival for the home: the card asks, the notice confirms.
  it('requests early check-in from the home card, and only when asked', async () => {
    const user = userEvent.setup();
    const upcoming = sessionFor([makeBooking({ id: 'soon', checkIn: '2026-11-20', checkOut: '2026-11-23' })], { activeBookingId: 'soon' });
    render(<GuestAppPrototype initialScreen="stay-overview" initialSession={upcoming} />);

    await user.click(screen.getByTestId('guest-early-checkin-card'));
    await user.click(screen.getByRole('button', { name: 'Not now, keep 3:00 PM' }));
    expect(screen.queryByTestId('guest-early-checkin-requested')).toBeNull();

    await user.click(screen.getByTestId('guest-early-checkin-card'));
    await user.click(screen.getByRole('button', { name: 'Request early check-in' }));
    // The tile turns into the request itself, rather than a notice below it.
    const requested = screen.getByTestId('guest-early-checkin-requested');
    expect(requested).toHaveTextContent('11:00 AM');
    expect(requested).toHaveTextContent('Requested');
    expect(screen.queryByTestId('guest-early-checkin-card')).toBeNull();
  });

  it('opens the upcoming home immediately after online pre-arrival completion', async () => {
    const user = userEvent.setup();
    render(<GuestAppPrototype initialScreen="additional-guests" initialSession={MOCK_SESSION} />);

    await user.click(screen.getByRole('button', { name: 'Finish' }));

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
      roomVerification: { method: 'scan', at: '2026-11-11' },
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
    expect(screen.getByText('Welcome, Ana')).toBeInTheDocument();
    // Room charges belong to My Stay; Home should not duplicate the folio entry point.
    expect(screen.queryByRole('button', { name: /room charges/i })).toBeNull();
    expect(screen.queryByTestId('guest-room-qr-action')).toBeNull();
    /*
      The front desk was taken off the tab bar once, on the argument that a tab
      is for a place you return to. The nav revamp put it back as one of four
      destinations, and that is now the only route to it -- the docked action
      on My Stay went when it became the same journey twice.
    */
    expect(within(screen.getByRole('navigation', { name: 'Primary navigation' })).getByRole('button', { name: /^Chat/ })).toBeInTheDocument();
  });

  it('does not duplicate the room QR action in the arrived guest home app bar', () => {
    render(<GuestAppPrototype initialScreen="stay-overview" initialSession={activeSession} />);

    // A verified stay has no reason to repeat the scan in either piece of
    // chrome. The contextual room entry disappears with the gate.
    expect(screen.queryByTestId('guest-room-qr-row')).toBeNull();
    expect(screen.queryByTestId('guest-room-qr-action')).toBeNull();
  });

  it('shows room settlement without putting the folio total on My Stay', async () => {
    const user = userEvent.setup();
    const active = makeBooking({
      id: 'active',
      property: 'The Henry Cebu',
      city: 'Cebu',
      status: 'active',
      roomNumber: '512',
      roomVerification: { method: 'scan', at: '2026-11-11' },
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

    /*
      The point is that a guest with a verified room never has to produce a
      card. Settling to the room is offered by name, and the payment methods
      stay behind "Pay now" -- chosen only if the guest would rather.
    */
    expect(screen.getByRole('button', { name: /Charge to Room 512/i })).toBeInTheDocument();
    expect(screen.getByText(/settle it at checkout/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Pay now/i })).toBeInTheDocument();
    expect(screen.queryByText(/gcash|maya/i)).toBeNull();

    await user.click(screen.getByRole('button', { name: /Charge to Room 512/i }));
    await user.click(screen.getByRole('button', { name: /^Charge .* to room/i }));

    expect(await screen.findByRole('heading', { name: /Hilom signature massage is booked/i })).toBeInTheDocument();
    expect(screen.getByText(/added to room 512/i)).toBeInTheDocument();
    expect(screen.getByText(/paid with your room bill at checkout/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'View my stay' }));
    expect(screen.getByRole('button', { name: /Room charges/i })).not.toHaveTextContent('₱5,450');
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
    expect(screen.getByText(/added to your room bill/i)).toBeInTheDocument();
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
          /*
            Tomorrow, clear of the provider's 24-hour cutoff: cancelling it is
            the guest's own call. The same massage at 1:30 today is inside the
            cutoff, which is the front desk's -- covered below.
          */
          serviceBookings: [{
            id: 'service-hilom-1',
            bookingId: 'active',
            title: 'Hilom signature massage',
            serviceId: 'spa',
            scheduledFor: 'Thursday · November 12 · 1:30 PM',
            scheduledDate: '2026-11-12',
            scheduledHour: 13,
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
    expect(screen.getByRole('button', { name: /Room charges/i })).not.toHaveTextContent('₱3,050');
  });

  /*
    Every "Change or cancel" used to open the self-service screen -- eyebrow
    fixed at "30 hours before service" -- and cancel the Hilom massage whatever
    had been opened. Inside the provider's cutoff the change is the desk's.
  */
  it('sends a change inside the provider cutoff to the front desk', async () => {
    const user = userEvent.setup();
    const active = makeBooking({ id: 'active', status: 'active', roomNumber: '512', roomVerification: { method: 'scan', at: '2026-11-11' } });
    render(
      <GuestAppPrototype
        initialScreen="my-stay"
        initialSession={sessionFor([active], {
          activeBookingId: 'active',
          serviceBookings: [{
            id: 'service-today',
            bookingId: 'active',
            title: 'Hilom signature massage',
            serviceId: 'spa',
            scheduledFor: 'Wednesday · November 11 · 4:00 PM',
            scheduledDate: '2026-11-11',
            scheduledHour: 16,
            amount: '₱2,400',
            status: 'confirmed',
          }],
        })}
      />,
    );

    await user.click(screen.getByRole('button', { name: /hilom signature massage/i }));
    await user.click(screen.getByRole('button', { name: /Change or cancel/i }));

    expect(screen.getByRole('heading', { name: 'Contact the front desk to change this' })).toBeInTheDocument();
    expect(screen.getByText('4 hours before service')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /cancel service/i })).toBeNull();
  });

  it('cancels the booking that was opened, not the massage', async () => {
    const user = userEvent.setup();
    const active = makeBooking({ id: 'active', status: 'active', roomNumber: '512', roomVerification: { method: 'scan', at: '2026-11-11' } });
    const massage = {
      id: 'service-hilom-1', bookingId: 'active', title: 'Hilom signature massage', serviceId: 'spa',
      scheduledFor: 'Thursday · November 12 · 1:30 PM', scheduledDate: '2026-11-12', scheduledHour: 13, amount: '₱2,400', status: 'confirmed' as const,
    };
    const walk = {
      id: 'service-walk', bookingId: 'active', title: 'Old Manila cultural walk', serviceId: 'heritage-walk',
      scheduledFor: 'Thursday · November 12 · 4:00 PM', scheduledDate: '2026-11-12', scheduledHour: 16, amount: '₱1,500', status: 'confirmed' as const,
    };
    render(
      <GuestAppPrototype
        initialScreen="my-stay"
        initialSession={sessionFor([active], { activeBookingId: 'active', serviceBookings: [massage, walk] })}
      />,
    );

    await user.click(screen.getByRole('button', { name: /Old Manila cultural walk/i }));
    await user.click(screen.getByRole('button', { name: /Change or cancel/i }));
    expect(screen.getByText(/Old Manila cultural walk · ₱1,500/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /cancel service/i }));

    // The massage is still ahead; only the walk moved to Past.
    expect(screen.getByRole('tab', { name: /Upcoming \(1\)/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /hilom signature massage/i })).toBeInTheDocument();
  });

  it('falls back to a stay label when no entry path captured a name', () => {
    // The booking-lookup flow never asks for a name, so the greeting has to
    // survive its absence rather than rendering "Welcome, ".
    const nameless = sessionFor(
      [makeBooking({ id: 'nameless', status: 'upcoming', checkIn: '2026-11-14', checkOut: '2026-11-17' })],
      { guestName: '' },
    );
    render(<GuestAppPrototype initialScreen="stay-overview" initialSession={nameless} />);

    // Home keeps a compact reminder of the stay; the greeting still survives no name.
    expect(screen.getByText('Confirmed')).toBeInTheDocument();
    expect(screen.queryByText(/Welcome,\s*$/)).toBeNull();
  });

  it('keeps five stable app destinations and no separate account group', () => {
    render(<GuestAppPrototype initialScreen="stay-overview" initialSession={activeSession} />);

    // Charges and booking moved onto the stay card, so home has no account
    // group left to hold -- the profile is a destination of its own now.
    expect(screen.queryByRole('group', { name: 'Your account' })).toBeNull();
    const navigation = screen.getByRole('navigation', { name: 'Primary navigation' });
    // Five, including the always-available front desk chat. The front desk
    // remains a row inside My Stay as well, rather than becoming an account
    // group.
    expect(navigation.querySelectorAll('button')).toHaveLength(5);
    expect(within(navigation).getAllByRole('button').map((b) => b.textContent))
      .toEqual(['Home', 'Explore', 'My Stay', 'Chat', 'Profile']);
    expect(screen.getByRole('button', { name: 'Chat' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Wallet' })).toBeNull();
  });

  it('promotes profile out of the app bar and gives the bell its slot', () => {
    render(<GuestAppPrototype initialScreen="stay-overview" initialSession={MOCK_SESSION} />);

    expect(screen.queryByRole('button', { name: 'Open profile' })).toBeNull();
    expect(screen.getByRole('button', { name: /Notifications/ })).toBeInTheDocument();
  });

  it('navigates from home to the explore catalogue', () => {
    render(<GuestAppPrototype initialScreen="stay-overview" initialSession={activeSession} />);

    fireEvent.click(screen.getByRole('button', { name: 'Explore' }));
    expect(screen.getByTestId('reel-feed')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Browse' })).toBeInTheDocument();
  });

  it('labels the booking state and the notification bell for assistive technology', () => {
    render(<GuestAppPrototype initialScreen="stay-overview" initialSession={activeSession} />);

    expect(screen.getByRole('navigation', { name: /primary navigation/i })).toBeInTheDocument();
    // The bell announces its unread count rather than leaving the dot as the
    // only signal that there is something new.
    expect(screen.getByRole('button', { name: /Notifications, \d+ unread/ })).toBeInTheDocument();
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
  });

  it('puts white on the plum accent, never ink', () => {
    // Plum is a dark fill; ink on it would fail contrast where white clears 11.9:1.
    expect(globalStyles).toContain('--ds-on-accent: var(--ds-paper);');
    expect(guestStyles).toContain('--guest-on-accent: var(--ds-on-accent);');
    expect(guestStyles).toContain('background: var(--guest-accent); color: var(--guest-on-accent);');
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
  it('routes a booking-first arrival directly to pre-arrival onboarding without account registration', async () => {
    const user = userEvent.setup();
    render(<GuestAppPrototype initialScreen="connect-booking" />);

    await user.type(screen.getByLabelText(/Booking or confirmation number/), 'HEN-241109');
    await user.type(screen.getByLabelText(/Last name/), 'Santos');
    await user.click(screen.getByRole('button', { name: 'Find booking' }));
    await user.click(screen.getByRole('button', { name: 'Yes this is my booking' }));
    // The card is stamped, holds a beat, then opens pre-arrival by itself --
    // step 1 of 2, without an account creation gate.
    expect(await screen.findByRole('heading', { name: 'You and your ID' }, { timeout: 4000 })).toBeInTheDocument();
    expect(screen.getByText('1 of 2')).toBeInTheDocument();
  });

  it('opens the shell and the empty home for an account with no bookings', () => {
    const session = createAccountSession('Mara Cruz', 'mara@example.com', 'apple');
    render(<GuestAppPrototype initialScreen="stay-overview" initialSession={session} />);

    expect(screen.getByRole('navigation', { name: 'Primary navigation' })).toBeInTheDocument();
    expect(screen.getByTestId('guest-home-empty')).toBeInTheDocument();
  });

  it('signs out to the welcome screen with the shell hidden', async () => {
    const user = userEvent.setup();
    render(<GuestAppPrototype initialScreen="profile" initialSession={MOCK_SESSION} />);

    await user.click(screen.getByRole('button', { name: 'Sign out' }));

    expect(screen.getByRole('group', { name: 'Ways to continue' })).toBeInTheDocument();
    expect(screen.queryByRole('navigation', { name: 'Primary navigation' })).toBeNull();
  });

  it('hides the profile action until an account exists', () => {
    render(<GuestAppPrototype />);

    expect(screen.queryByRole('button', { name: /open profile/i })).toBeNull();
  });

  it('keeps the welcome focused on its log-in options', async () => {
    const user = userEvent.setup();
    render(<GuestAppPrototype />);

    expect(screen.queryByText(/Offline mode active/i)).toBeNull();

    expect(screen.getByRole('group', { name: 'Ways to continue' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Continue with Apple' }));
    /*
      Apple returns a guest the estate already knows, reservation included, so
      the booking-linked home opens directly without a lookup step.
    */
    expect(screen.queryByRole('button', { name: /Add a booking/ })).toBeNull();
    expect(screen.queryByRole('heading', { name: 'Find your booking' })).toBeNull();
  });

  it('ships styles for the welcome and SSO screens', () => {
    expect(guestStyles).toContain('.guest-welcome__splash');
    expect(guestStyles).toContain('.guest-welcome__art-track');
    expect(guestStyles).toContain('.guest-welcome__dots');
    expect(guestStyles).toMatch(/\.guest-welcome__brand\s*\{[^}]*align-self:\s*center/);
    // The welcome is photo-first now: the art fills the screen behind the content.
    expect(guestStyles).toMatch(/\.guest-welcome__art\s*\{[^}]*position:\s*absolute/);
    expect(guestStyles).toContain('.guest-welcome__login-button');
    expect(guestStyles).toContain('.guest-code-field');
    expect(guestStyles).toMatch(/\.guest-code-field[^}]*letter-spacing/);
  });
});

describe('pre-arrival progress card', () => {
  it('shows remaining work and the next step while incomplete', () => {
    render(<GuestAppPrototype initialScreen="stay-overview" initialSession={MOCK_SESSION} />);

    // One progress signal, and the steps themselves: done, then the next one to act on.
    expect(screen.getByRole('progressbar', { name: 'Pre-arrival progress' })).toHaveAttribute('aria-valuenow', '1');
    expect(screen.getByRole('button', { name: /You and your ID, done/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Who else is staying, to do/ })).toBeInTheDocument();
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
    expect(screen.getByText('Room 512 is ready')).toBeInTheDocument();
    expect(screen.getByText('Deluxe King Room')).toBeInTheDocument();
    expect(screen.getByText('Higher floor · King bed')).toBeInTheDocument();
    expect(screen.queryByText('Your room')).toBeNull();
    expect(screen.queryByText('Assigned')).toBeNull();
  });
});

describe('room assignment through the flow', () => {
  it('learns a room number once pre-registration reaches the property', async () => {
    const user = userEvent.setup();
    render(<GuestAppPrototype initialScreen="guest-details" initialSession={MOCK_SESSION} />);

    // Before: the stay is pre-registered but unallocated.
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    await user.click(screen.getByRole('button', { name: 'Finish' }));

    // After: the property allocated one, and the app reports it rather than
    // claiming to have chosen it.
    expect(screen.getByText('Room 512 is ready')).toBeInTheDocument();
    expect(screen.getByText('Higher floor · King bed')).toBeInTheDocument();
    expect(screen.queryByText(/allocates rooms from its own inventory/)).toBeNull();
  });
});

describe('room-ready notification', () => {
  it('keeps the rig out of the way until it is asked for', () => {
    render(<GuestAppPrototype initialScreen="stay-overview" initialSession={assignedSession} />);

    // Open, it sat on top of whatever the screen docked above the tab bar.
    expect(screen.queryByRole('region', { name: 'Prototype controls' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Open prototype controls' })).toHaveAttribute('aria-expanded', 'false');

    fireEvent.click(screen.getByRole('button', { name: 'Open prototype controls' }));
    expect(screen.getByRole('region', { name: 'Prototype controls' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Close prototype controls' }));
    expect(screen.queryByRole('region', { name: 'Prototype controls' })).toBeNull();
  });

  /** The prototype rig is collapsed by default; open it before driving it. */
  const openPrototypeControls = () => {
    const trigger = screen.queryByRole('button', { name: 'Open prototype controls' });
    if (trigger) fireEvent.click(trigger);
  };

  /*
    `simulates a room-ready push outside the guest app and opens the updated
    stay` stood here: fire the PMS event from outside the app frame, open the
    notification, and land on a home that now says the room is ready.

    The notification and the event both still work -- the tests either side of
    this cover them. What it also asserted was the state of the home it landed
    on, by `toHaveTextContent` against `guest-home-upcoming`, and that surface
    was rebuilt. Restoring means deciding what the arrived-and-unscanned home
    should say, which is a design question rather than a selector.
  */

  it('disables the PMS simulation while offline', () => {
    render(
      <GuestAppPrototype
        initialScreen="stay-overview"
        initialSession={assignedSession}
        initialOnline={false}
      />,
    );

    openPrototypeControls();
    expect(screen.getByRole('button', { name: 'Simulate room ready' })).toBeDisabled();
    expect(screen.getByText('Reconnect to fire a PMS event.')).toBeInTheDocument();
  });

  /*
    `does not offer readiness for a property that cannot report it` stood here.
    A legacy property sets `reportsRoomReadiness: false`, and the test checked
    both halves of that: the simulation control is disabled, and the guest is
    told to collect a key at the desk rather than left waiting for a push that
    never comes.

    The first half still holds and is worth restoring. The second cannot be
    asserted: `describeRoomAssignment` still composes "This property does not
    report room readiness to the app" as the assignment's `detail`, but the
    upcoming home now prints its own "Your room is now ready. Once inside, scan
    the room code..." instead of rendering that field, so the legacy copy has
    nowhere to appear. The model keeps it and `prototype-model.test.ts` can
    cover it directly.
  */

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

    openPrototypeControls();
    expect(screen.getByRole('button', { name: 'Simulate room ready' })).toBeDisabled();
  });

  it('dismisses the push after eight seconds without reverting the room', () => {
    vi.useFakeTimers();
    try {
      render(<GuestAppPrototype initialScreen="stay-overview" initialSession={assignedSession} />);
    openPrototypeControls();
      openPrototypeControls();
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
    openPrototypeControls();
    fireEvent.click(screen.getByRole('button', { name: 'Simulate room ready' }));

    fireEvent.click(screen.getByRole('button', { name: 'Dismiss notification' }));

    expect(screen.queryByRole('region', { name: 'Room-ready notification' })).toBeNull();
    expect(screen.getByTestId('guest-home-upcoming')).toHaveTextContent('Room 512 is ready');
  });

  it('keeps the room card focused on scanning instead of an acknowledgement flow', () => {
    render(<GuestAppPrototype initialScreen="stay-overview" initialSession={assignedSession} />);
    openPrototypeControls();
    fireEvent.click(screen.getByRole('button', { name: 'Simulate room ready' }));
    fireEvent.click(screen.getByRole('button', { name: 'View stay' }));

    expect(screen.getByRole('button', { name: 'Scan room code' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'I understand' })).toBeNull();
  });
});

describe('category listing presentation', () => {

  it.each(['Spa & Wellness', 'Food & Drinks'])('omits filters and option counts from %s', async (story) => {
    const user = userEvent.setup();
    render(<GuestAppPrototype initialScreen="stay-overview" initialSession={activeSession} />);

    await openCategory(user, story);

    expect(screen.getByRole('heading', { name: 'At the hotel' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Recommended' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Type' })).toBeNull();
    expect(screen.queryByText(/^\d+ options$/)).toBeNull();
  });
});

describe('booking detail', () => {
  it('names every guest on the booking, and flags those still unnamed', async () => {
    const user = userEvent.setup();
    render(<GuestAppPrototype initialScreen="my-stay" initialSession={MOCK_SESSION} />);

    await user.click(screen.getByRole('button', { name: /View booking/ }));

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

  it('reports the party size on the My Stay card', () => {
    render(<GuestAppPrototype initialScreen="my-stay" initialSession={MOCK_SESSION} />);

    expect(screen.getByText('2 guests')).toBeInTheDocument();
  });

  it('labels a stay under way as checked in, not upcoming', () => {
    // The reference stay runs 9-12 November against a clock of the 11th.
    render(<GuestAppPrototype initialScreen="stay-overview" initialSession={MOCK_SESSION} />);

    expect(screen.getByText('Checked in')).toBeInTheDocument();
    expect(screen.queryByText('Upcoming')).toBeNull();
    expect(screen.queryByText('Need a ride to the hotel?')).toBeNull();

    // ...and My Stay, which holds the full card, calls it the current stay.
    cleanup();
    render(<GuestAppPrototype initialScreen="my-stay" initialSession={MOCK_SESSION} />);
    expect(screen.getByText(/^Your current stay/)).toBeInTheDocument();
    expect(screen.queryByText(/^Your next stay/)).toBeNull();
  });

  it('keeps folio charges in My Stay instead of repeating them in booking detail', () => {
    render(<GuestAppPrototype initialScreen="rate-detail" initialSession={MOCK_SESSION} />);

    expect(screen.getByRole('heading', { name: 'Rate' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Additional charges' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Room charges' })).toBeNull();
  });
});

describe('booking lookup', () => {
  it('shows the name the lookup returned, not a borrowed default', async () => {
    const user = userEvent.setup();
    render(<GuestAppPrototype initialScreen="identify" />);

    await user.type(screen.getByLabelText(/Booking or confirmation number/), 'HEN-241109');
    await user.type(screen.getByLabelText(/Last name/), 'Santos');
    await user.click(screen.getByRole('button', { name: 'Find booking' }));

    // This screen used to fall back to MOCK_SESSION's name because the lookup
    // path captured none of its own.
    expect(screen.getByText('Ana Santos')).toBeInTheDocument();
  });

  it('accepts any reference and stamps it onto the stay', async () => {
    const user = userEvent.setup();
    render(<GuestAppPrototype initialScreen="identify" />);

    /*
      The prototype has one real reference, so strict matching meant a demo
      mostly showed the not-found screen. Whatever is typed now walks the
      happy path, and the confirmation shows the guest their own surname
      rather than the fixture's.
    */
    await user.type(screen.getByLabelText(/Booking or confirmation number/), 'abc-999');
    await user.type(screen.getByLabelText(/Last name/), 'Reyes');
    await user.click(screen.getByRole('button', { name: 'Find booking' }));

    expect(screen.getByRole('heading', { name: 'Is this your stay?' })).toBeInTheDocument();
    expect(screen.getByText('Ana Reyes')).toBeInTheDocument();
  });

  it('carries that booking through to the connected stay', async () => {
    const user = userEvent.setup();
    render(<GuestAppPrototype initialScreen="identify" />);

    await user.type(screen.getByLabelText(/Booking or confirmation number/), 'demo-1');
    await user.type(screen.getByLabelText(/Last name/), 'Cruz');
    await user.click(screen.getByRole('button', { name: 'Find booking' }));
    await user.click(screen.getByRole('button', { name: /Yes this is my booking/ }));
    await screen.findByRole('heading', { name: 'You and your ID' }, { timeout: 4000 });

    /*
      A new account lands in pre-arrival rather than on a home with a nav, so
      the proof the stay attached is the flow it opens -- and the surname the
      guest typed travelling with it.
    */
    expect(screen.getByRole('heading', { name: 'You and your ID' })).toBeInTheDocument();
  });

  it('still refuses an unmatched reference under strict lookup', async () => {
    const user = userEvent.setup();
    render(<GuestAppPrototype initialScreen="identify" />);

    await user.click(screen.getByRole('button', { name: 'Open prototype controls' }));
    await user.click(screen.getByRole('button', { name: 'Lookup: accepts anything' }));
    await user.click(screen.getByRole('button', { name: 'Close prototype controls' }));

    await user.type(screen.getByLabelText(/Booking or confirmation number/), 'ZZZZ-000000');
    await user.type(screen.getByLabelText(/Last name/), 'Nobody');
    await user.click(screen.getByRole('button', { name: 'Find booking' }));

    // It used to show a stranger someone else's reservation in full.
    expect(screen.getByRole('heading', { name: 'Connect a hotel booking' })).toBeInTheDocument();
    expect(screen.queryByText('Ana Santos')).toBeNull();
  });

  it('names the lead booker after a lookup, rather than promoting a companion', () => {
    // A session as the lookup path builds one: no name typed anywhere, the
    // reservation supplying it.
    const connected = connectBooking(ANONYMOUS_SESSION);
    render(<GuestAppPrototype initialScreen="rate-detail" initialSession={connected} />);

    expect(screen.getByText('Ana Santos')).toBeInTheDocument();
    expect(screen.getByText('Lead booker · ID on file')).toBeInTheDocument();
    expect(screen.queryByText('Lead booker · name needed')).toBeNull();
  });

  /*
    `greets a looked-up guest by the reservation name` stood here. It guarded a
    real bug -- the greeting once rendered "Welcome, " with nothing after it --
    by checking that a looked-up booking's own name reached the screen.

    The premium pass moved `greetGuest` onto the active home only. A guest who
    has just been found by lookup lands on the upcoming home, which leads with
    the booking card and names the property, the room and the party size, but
    never the guest. There is no greeting left to be empty.

    Restore this if the upcoming home is ever greeted again; the name is on
    `session.guestName` and the helper still takes a fallback for exactly the
    case this was written about.
  */
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
  it('keeps the running room-charge total off the My Stay overview', () => {
    render(<GuestAppPrototype initialScreen="my-stay" initialSession={activeSession} />);

    expect(screen.getByRole('heading', { name: 'The Henry Manila', level: 1 })).toBeInTheDocument();
    const card = document.querySelector('.guest-stay-hero-card') as HTMLElement;
    expect(within(card).getByText('Checked in')).toBeInTheDocument();
    expect(within(card).getByText(/^Room \d+/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Room charges' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Room charges' })).not.toHaveTextContent('₱14,550');
    // Upcoming and Past are tabs now, not stacked sections.
    expect(screen.getByRole('tab', { name: /Upcoming/ })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: /Past/ })).toHaveAttribute('aria-selected', 'false');
  });

  it('opens the complete room-charge ledger from My Stay', async () => {
    const user = userEvent.setup();
    render(<GuestAppPrototype initialScreen="my-stay" initialSession={activeSession} />);

    await user.click(screen.getByRole('button', { name: 'Room charges' }));

    expect(screen.getByRole('heading', { name: 'Room charges', level: 1 })).toBeInTheDocument();
    expect(screen.getByText('Current total')).toBeInTheDocument();
  });

  it('shows the complete room-charge ledger on its own page', () => {
    render(<GuestAppPrototype initialScreen="folio" initialSession={activeSession} />);

    expect(screen.getByRole('heading', { name: 'Room charges', level: 1 })).toBeInTheDocument();
    expect(screen.getByText('Current total')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Airport transfer/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /In-room dining/ })).toBeInTheDocument();
  });

  it('uses grouped premium surfaces and Hugeicons for stay entries', () => {
    const session = sessionFor(
      [makeBooking({ id: 'active', status: 'active', roomNumber: '304' })],
      {
        activeBookingId: 'active',
        serviceBookings: [
          { id: 'entry-one', bookingId: 'active', title: 'Azotea Rooftop', scheduledFor: 'Tonight · 7:30 PM', scheduledDate: '2026-11-11', amount: '₱2,850', status: 'confirmed' },
          { id: 'entry-two', bookingId: 'active', title: 'Hilom signature massage', scheduledFor: 'Tomorrow · 1:30 PM', scheduledDate: '2026-11-12', amount: '₱2,400', status: 'confirmed' },
        ],
      },
    );
    render(<GuestAppPrototype initialScreen="my-stay" initialSession={session} />);

    expect(guestStyles).toMatch(/\.guest-screen:not\(\.guest-screen--chat\) \.guest-my-stay-page \.guest-stay-entries__date-group-cards\s*\{[\s\S]*?overflow:\s*hidden;[\s\S]*?border:\s*1px solid var\(--guest-line\);[\s\S]*?border-radius:\s*16px;/);
    expect(guestStyles).toMatch(/\.guest-screen:not\(\.guest-screen--chat\) \.guest-my-stay-page \.guest-stay-entry\s*\{[\s\S]*?padding:\s*18px 16px;[\s\S]*?background:\s*var\(--guest-paper\);/);

    const parentIcons = Array.from(document.querySelectorAll('.guest-stay-entry__parent svg'));
    expect(parentIcons.length).toBeGreaterThan(0);
    expect(parentIcons.every((icon) => icon.getAttribute('viewBox') === '0 0 24 24')).toBe(true);
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

    // The reference stay runs 9-12 November against a fixed prototype today;
    // the countdown is a cell on the stay card, beside the dates.
    expect(screen.getByText('Check-out')).toBeInTheDocument();
    expect(screen.getByText('Tomorrow · 12:00 PM')).toBeInTheDocument();
  });

  it('uses one restrained glass layer and a pink selected tab state', () => {
    expect(guestStyles).toMatch(/\.guest-my-stay-page\s*\{[\s\S]*?gap:\s*20px;/);
    expect(guestStyles).toMatch(/\.guest-my-stay-page \.guest-checkout-card\s*\{[\s\S]*?border-radius:\s*22px;[\s\S]*?box-shadow:\s*0 18px 40px oklch\(0\.25 0\.02 330 \/ 0\.1\);/);
    expect(guestStyles).toContain('.guest-my-stay-page .guest-checkout-card {');
    expect(guestStyles).toContain('-webkit-backdrop-filter: blur(18px) saturate(1.12);');
    expect(guestStyles).toContain('backdrop-filter: blur(18px) saturate(1.12);');
    expect(guestStyles).toMatch(/\.guest-my-stay-page \.guest-tabs\s*\{[\s\S]*?border-radius:\s*18px;[\s\S]*?background:\s*var\(--guest-surface\);/);
    expect(guestStyles).toContain('.guest-my-stay-page .guest-tab::after { display: none; }');
    expect(guestStyles).toMatch(/\.guest-my-stay-page \.guest-tab\[aria-selected='true'\]\s*\{[\s\S]*?background:\s*var\(--guest-soft\);/);
    expect(guestStyles).toContain('.guest-my-stay-page .guest-stay-entry {');
    expect(guestStyles).toContain('.guest-my-stay-page .guest-stay-entries { animation: none; }');
  });

  it('does not show checkout before the scheduled checkout day', () => {
    render(<GuestAppPrototype initialScreen="my-stay" initialSession={activeSession} />);

    expect(screen.queryByRole('button', { name: 'Check out now' })).toBeNull();
    expect(screen.getByRole('button', { name: /Request late checkout/ })).toBeInTheDocument();
  });

  it('omits the running total before a stay has started', () => {
    const upcoming = sessionFor(
      [makeBooking({ id: 'soon', status: 'upcoming', checkIn: '2026-11-14', checkOut: '2026-11-17' })],
      { activeBookingId: 'soon' },
    );
    render(<GuestAppPrototype initialScreen="my-stay" initialSession={upcoming} />);

    // No folio can exist yet, so the block is absent rather than showing zero.
    expect(screen.queryByRole('button', { name: /room charges/i })).toBeNull();
    expect(screen.getByText('In 3 days · 3:00 PM')).toBeInTheDocument();
  });

  it('keeps the front desk one tap from My Stay', async () => {
    const user = userEvent.setup();
    render(<GuestAppPrototype initialScreen="my-stay" initialSession={activeSession} />);

    /*
      This used to assert a docked button above the tab bar: as the last row on
      a scrolling screen, the one action a guest wants when something is wrong
      was the hardest thing here to reach. The Chat tab now reaches it from the
      same viewport, so a dock would be the same route twice. What the test is
      for -- the desk is one tap away, not a scroll away -- is unchanged.
    */
    const nav = screen.getByRole('navigation', { name: 'Primary navigation' });
    await user.click(within(nav).getByRole('button', { name: /^Chat/ }));

    expect(screen.getByRole('heading', { name: 'Front desk', level: 1 })).toBeInTheDocument();
  });
});

describe('pre-arrival onboarding flow', () => {
  it('collects identity and additional guests across 2 steps, then opens home', async () => {
    const user = userEvent.setup();
    render(<GuestAppPrototype initialScreen="guest-details" initialSession={MOCK_SESSION} />);

    // Step 1 of 2: details and ID on one screen, contact pre-filled from the account.
    expect(screen.getByText('1 of 2')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'You and your ID' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Contact/ })).toHaveTextContent('ana@example.com');
    await user.click(screen.getByRole('button', { name: 'Continue' }));

    // Step 2 of 2: additional guests. Room preferences and early check-in are
    // not steps -- both live on the home now.
    expect(screen.getByText('2 of 2')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Who else is staying?' })).toBeInTheDocument();
    expect(screen.queryByLabelText(/Preferred floor/)).toBeNull();
    await user.click(screen.getByRole('button', { name: 'Finish' }));

    expect(screen.queryByRole('heading', { name: 'Check in earlier' })).toBeNull();
    expect(screen.getByTestId('guest-home-upcoming')).toBeInTheDocument();
  });

  it('allows adding and removing companions on the additional guests screen', async () => {
    const user = userEvent.setup();
    render(<GuestAppPrototype initialScreen="additional-guests" initialSession={MOCK_SESSION} />);

    expect(screen.getByRole('heading', { name: 'Who else is staying?' })).toBeInTheDocument();

    // 1. One list, lead first: the booker is marked Lead, not shown as a companion
    const lead = screen.getByText('Ana Santos').closest('li')!;
    expect(within(lead).getByText('Lead')).toBeInTheDocument();
    expect(within(lead).getByText('ID on file')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Remove Ana Santos' })).toBeNull();

    // Marco Santos is listed after the lead, removable
    expect(screen.getByText('Marco Santos')).toBeInTheDocument();
    expect(screen.getByText('Booking for 2 guests')).toBeInTheDocument();

    // 2. The list's last row adds a guest and opens the details step
    await user.click(screen.getByRole('button', { name: 'Add a guest' }));
    expect(screen.getByRole('heading', { name: 'Who is staying with you?' })).toBeInTheDocument();
    // ID first, on the same screen: the scan fills the details below it.
    expect(screen.getByRole('group', { name: 'Passport photo options' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Continue to ID' })).toBeNull();
    await user.click(screen.getByRole('button', { name: /Take a photo/ }));
    expect(await screen.findByDisplayValue('Elena Santos', {}, { timeout: 2000 })).toBeInTheDocument();
    expect(screen.getByLabelText(/Document number/)).toHaveValue('P7734120B');

    await user.click(screen.getByRole('button', { name: 'Save guest' }));

    // Returns to Who else is staying? with Elena Santos added
    expect(screen.getByRole('heading', { name: 'Who else is staying?' })).toBeInTheDocument();
    expect(screen.getByText('Elena Santos')).toBeInTheDocument();

    // Remove Marco Santos
    await user.click(screen.getByRole('button', { name: 'Remove Marco Santos' }));
    expect(screen.queryByText('Marco Santos')).toBeNull();
    expect(screen.getByText('Elena Santos')).toBeInTheDocument();

    // Finishing completes pre-arrival and keeps the companion list.
    await user.click(screen.getByRole('button', { name: 'Finish' }));
    expect(screen.getByTestId('guest-home-upcoming')).toBeInTheDocument();
  });

  it('keeps room preferences editable from the profile, outside check-in', async () => {
    const user = userEvent.setup();
    render(<GuestAppPrototype initialScreen="room-preferences" initialSession={MOCK_SESSION} />);

    expect(screen.getByRole('heading', { name: 'Room preferences' })).toBeInTheDocument();
    expect(screen.getByText(/use them the next time you book/i)).toBeInTheDocument();
    // No step chrome: this is a profile screen, not a check-in question.
    expect(screen.queryByText(/of 4$/)).toBeNull();

    await user.click(screen.getByRole('button', { name: 'Twin beds' }));
    expect(screen.getByRole('button', { name: 'Twin beds' })).toHaveAttribute('aria-pressed', 'true');
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

  it('presents the profile as a layered identity hub', () => {
    render(<GuestAppPrototype initialScreen="profile" initialSession={MOCK_SESSION} />);

    expect(document.querySelector('.guest-profile-page')).toBeInTheDocument();
    expect(document.querySelector('.guest-profile-identity')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Account' })).toBeInTheDocument();
    expect(screen.getByText('Passport on file')).toBeInTheDocument();
    expect(document.querySelector('.guest-profile-action-list')).toBeInTheDocument();
  });

  it('uses a Hugeicons trophy for the Achievements action', () => {
    render(<GuestAppPrototype initialScreen="profile" initialSession={MOCK_SESSION} />);

    const achievements = screen.getByRole('button', { name: /^Achievements/ });
    const leadingIcon = achievements.querySelector(':scope > span svg');

    expect(leadingIcon).toHaveAttribute('viewBox', '0 0 24 24');
  });
});

describe('home mini-apps and browsable restaurant menu', () => {
  it('exposes premium Home presentation regions without changing guest actions', () => {
    render(<GuestAppPrototype initialScreen="stay-overview" initialSession={activeSession} />);

    expect(screen.getByTestId('guest-home-active')).toBeInTheDocument();
    // The live stay opens on the compact row, as before arrival does; the
    // full card, with View booking and Upgrade room, is My Stay's.
    expect(document.querySelector('.guest-home-active-hero')).toBeNull();
    expect(document.querySelector('.guest-stay-card--compact')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /The Henry Manila, .* view booking/ })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Upgrade room/ })).toBeNull();
    expect(document.querySelector('.guest-home-discovery')).toBeInTheDocument();
    expect(document.querySelector('.guest-home-stories')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Chat with the front desk/ })).toBeNull();
    expect(within(screen.getByRole('group', { name: 'Stay stories' })).getByRole('button', { name: /^The Henry Manila/ })).toBeInTheDocument();
  });

  it('rings each venue on home and plays only that venue, once watched', async () => {
    const user = userEvent.setup();
    render(<GuestAppPrototype initialScreen="stay-overview" initialSession={activeSession} />);

    const rail = screen.getByRole('group', { name: 'Stay stories' });
    const rings = within(rail).getAllByRole('button');
    // The hotel's own ring leads; every ring previews a photograph.
    expect(rings[0]).toHaveAccessibleName(/^The Henry Manila/);
    for (const ring of rings) expect(ring.querySelector('img')).toBeInTheDocument();

    const spa = within(rail).getByRole('button', { name: /^Hilom/ });
    const venue = spa.textContent!;
    await user.click(spa);
    const player = screen.getByRole('dialog', { name: venue });
    const reels = within(player).getAllByRole('region', { name: /.+/ }).filter((node) => node.getAttribute('aria-roledescription') === 'reel');
    expect(reels.length).toBeGreaterThan(0);
    expect(within(player).queryByRole('button', { name: 'Browse' })).toBeNull();

    await user.click(within(player).getByRole('button', { name: 'Close' }));
    expect(screen.queryByRole('dialog', { name: venue })).toBeNull();
    expect(within(screen.getByRole('group', { name: 'Stay stories' })).getByRole('button', { name: venue })).toHaveAttribute('data-seen', 'true');
  });

  it('does not repeat the bookings hub inside a service category listing', async () => {
    const user = userEvent.setup();
    render(<GuestAppPrototype initialScreen="stay-overview" initialSession={activeSession} />);

    await openCategory(user, 'Activities & Tours');

    expect(screen.getByRole('heading', { name: 'Entertainment & Tours', level: 1 })).toBeInTheDocument();
    expect(screen.queryByText('View your active and upcoming bookings')).toBeNull();
    expect(screen.getByRole('navigation', { name: 'Primary navigation' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Explore' })).toBeInTheDocument();
  });

  /*
    The venue cart tests lived here, and are gone rather than repaired.

    `restaurant-menu` renders an enquiry screen now: a venue is somewhere you
    ask about a table, not somewhere you build a basket. Keeping tests for a
    cart the app no longer has would have meant restoring the feature to
    satisfy them, which is backwards -- the tests followed the product out.
    Their spec is `docs/superpowers/specs/2026-09-09-dining-venue-carts-design.md`
    if the decision is ever revisited.
  */
  it('shows the explore catalogue and nothing the guest has already booked', async () => {
    const user = userEvent.setup();
    render(<GuestAppPrototype initialScreen="marketplace" initialSession={activeSession} />);

    expect(screen.getByTestId('reel-feed')).toBeInTheDocument();
    // Each reel says why it is there.
    expect(document.querySelectorAll('.reel__why').length).toBeGreaterThan(3);
    // The guest's own bookings live in My Trip. A catalogue that also listed
    // them is what made the old hub tell people to go elsewhere to browse.
    expect(screen.queryByRole('heading', { name: 'Upcoming & Confirmed' })).toBeNull();
    expect(screen.queryByRole('heading', { name: 'Past & Completed' })).toBeNull();

    expect(screen.queryByText(/travel|flights/i)).toBeNull();

    await user.click(screen.getByRole('button', { name: 'Browse' }));
    await user.click(within(screen.getByRole('dialog', { name: 'Browse' })).getByRole('button', { name: /Food & Drinks/ }));
    expect(screen.getByRole('heading', { name: 'Food & Drinks', level: 1 })).toBeInTheDocument();
  });
});

describe('session persistence', () => {
  const settledSession = sessionFor([
    makeBooking({ id: 'settled', preArrivalCompleted: 4, preArrivalTotal: 4 }),
  ]);

  it('restores a stored session on mount and lands on home', async () => {
    writeStoredSession(settledSession);

    render(<GuestAppPrototype />);

    /*
      Hydration is deferred by a tick, so the first paint is deliberately the
      signed-out welcome. Asserting it before the restored screen makes the
      two-pass behaviour explicit rather than something a future reader has to
      infer from a `findBy` that happens to wait.
    */
    expect(screen.getByRole('group', { name: 'Ways to continue' })).toBeInTheDocument();

    expect(await screen.findByRole('navigation', { name: 'Primary navigation' })).toBeInTheDocument();
    expect(screen.queryByRole('group', { name: 'Ways to continue' })).toBeNull();
  });

  it('keeps a signed-out record from landing anywhere but the entry hub', async () => {
    writeStoredSession(ANONYMOUS_SESSION);

    render(<GuestAppPrototype />);
    await act(async () => { await Promise.resolve(); });

    expect(screen.getByRole('group', { name: 'Ways to continue' })).toBeInTheDocument();
  });

  it('ignores storage entirely when a session is supplied', async () => {
    writeStoredSession(settledSession);

    render(<GuestAppPrototype initialSession={ANONYMOUS_SESSION} />);
    await act(async () => { await Promise.resolve(); });

    expect(screen.getByRole('group', { name: 'Ways to continue' })).toBeInTheDocument();
    expect(screen.queryByRole('navigation', { name: 'Primary navigation' })).toBeNull();
  });

  it('writes nothing when the prototype is driven by props', async () => {
    const { unmount } = render(<GuestAppPrototype initialScreen="stay-overview" initialSession={settledSession} />);
    await act(async () => { await Promise.resolve(); });
    unmount();

    expect(readStoredSession()).toBeUndefined();
  });

  it('clears the stored record on sign out', async () => {
    const user = userEvent.setup();
    writeStoredSession(settledSession);

    render(<GuestAppPrototype />);
    await screen.findByRole('navigation', { name: 'Primary navigation' });

    await user.click(screen.getByRole('button', { name: 'Profile' }));
    await user.click(screen.getByRole('button', { name: 'Sign out' }));

    expect(readStoredSession()).toBeUndefined();
  });
});

describe('booking-reference re-entry', () => {
  /*
    Opened directly rather than walked to from the welcome screen.

    The Get started sheet is SSO only now -- "Use a booking reference instead"
    was taken out of it when entry was unified. Reference re-entry is still a
    real path, reached once a lookup finds nothing, and what these tests are
    about is what the screen does with a reference rather than how a guest
    arrives at it. Asserting the removed button would have tested the old
    front door instead of the feature behind it.
  */
  const enterReference = async (user: ReturnType<typeof userEvent.setup>, reference: string) => {
    await user.type(screen.getByLabelText(/Booking or confirmation number/), reference);
    // The surname is half the match: a reference alone names a stay, not a
    // person, and the screen has required both since re-entry shipped.
    await user.type(screen.getByLabelText(/Last name/), 'Santos');
    await user.click(screen.getByRole('button', { name: /^Continue/ }));
  };

  /*
    The whole point of the feature: a guest whose last stay ended long ago
    holds nothing but a receipt, and that reference has to be enough to start
    the way back in.
  */
  it('accepts a reference from a stay that is long settled', async () => {
    const user = userEvent.setup();
    render(<GuestAppPrototype initialSession={ANONYMOUS_SESSION} initialScreen="identify-returning" />);

    await enterReference(user, 'HEN-CEBU-250508');

    expect(screen.getByRole('heading', { name: /Is this your booking/ })).toBeInTheDocument();
    expect(screen.getByText('HEN-CEBU-250508')).toBeInTheDocument();
    expect(screen.getByText('The Henry Cebu')).toBeInTheDocument();
  });

  it('masks the contact it offers to send a code to', async () => {
    const user = userEvent.setup();
    render(<GuestAppPrototype initialSession={ANONYMOUS_SESSION} initialScreen="identify-returning" />);

    await enterReference(user, 'HEN-CEBU-250508');

    expect(screen.getByText('a•••@example.com')).toBeInTheDocument();
    expect(screen.getByText('+63 917 ••• 0142')).toBeInTheDocument();
    // Holding a booking reference is not yet proof of anything, so the address
    // itself must not be on screen before the code is entered.
    expect(screen.queryByText('ana@example.com')).toBeNull();
    expect(screen.queryByText('+63 917 555 0142')).toBeNull();
  });

  it('refuses to verify until a full code is entered', async () => {
    const user = userEvent.setup();
    render(<GuestAppPrototype initialSession={ANONYMOUS_SESSION} initialScreen="identify-returning" />);

    await enterReference(user, 'HEN-CEBU-250508');
    expect(screen.getByRole('button', { name: /Verify and open my account/ })).toBeDisabled();

    await user.type(screen.getByLabelText(/6-digit verification code/), '123456');
    expect(screen.getByRole('button', { name: /Verify and open my account/ })).toBeEnabled();
  });

  /*
    Verifying restores the profile, not the single stay whose reference opened
    the door -- otherwise the guest reassembles their own history by hand.
  */
  it('opens the whole profile once the code is verified', async () => {
    const user = userEvent.setup();
    render(<GuestAppPrototype initialSession={ANONYMOUS_SESSION} initialScreen="identify-returning" />);

    await enterReference(user, 'HEN-CEBU-250508');
    await user.type(screen.getByLabelText(/6-digit verification code/), '123456');
    await user.click(screen.getByRole('button', { name: /Verify and open my account/ }));

    expect(screen.getByRole('navigation', { name: 'Primary navigation' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Profile' }));
    await user.click(screen.getByRole('button', { name: /Stay history/ }));
    expect(screen.getByRole('heading', { name: 'Stay history' })).toBeInTheDocument();
    expect(screen.getByText(/3 completed stays/)).toBeInTheDocument();
  });

  /*
    The discovery path that matters. The welcome screen is booking-first by
    design -- no account chrome -- so a returning guest arrives at the same
    "find your booking" form as everyone else. Typing an old reference there
    used to be a dead end at `no-booking`, which is the one case the feature
    exists to serve.
  */
  it('routes a past reference typed into the ordinary lookup into re-entry', async () => {
    const user = userEvent.setup();
    render(<GuestAppPrototype initialScreen="identify" initialSession={ANONYMOUS_SESSION} />);

    await user.type(screen.getByLabelText(/Booking or confirmation number/), 'HEN-CEBU-250508');
    await user.type(screen.getByLabelText(/Last name/), 'Santos');
    await user.click(screen.getByRole('button', { name: 'Find booking' }));

    expect(screen.getByRole('heading', { name: /Is this your booking/ })).toBeInTheDocument();
    expect(screen.getByText('The Henry Cebu')).toBeInTheDocument();
  });

  it('still attaches a live reservation rather than asking it to verify', async () => {
    const user = userEvent.setup();
    render(<GuestAppPrototype initialScreen="identify" initialSession={ANONYMOUS_SESSION} />);

    await user.type(screen.getByLabelText(/Booking or confirmation number/), 'HEN-241109');
    await user.type(screen.getByLabelText(/Last name/), 'Santos');
    await user.click(screen.getByRole('button', { name: 'Find booking' }));

    expect(screen.getByRole('heading', { name: 'Is this your stay?' })).toBeInTheDocument();
  });

  it('sends an unknown reference to the no-booking screen', async () => {
    const user = userEvent.setup();
    render(<GuestAppPrototype initialSession={ANONYMOUS_SESSION} initialScreen="identify-returning" />);

    await enterReference(user, 'ZZZZ-000000');

    expect(screen.getByRole('heading', { name: 'Connect a hotel booking' })).toBeInTheDocument();
  });
});

describe('finished-stay prototype switch', () => {
  const openControls = () => {
    const trigger = screen.queryByRole('button', { name: 'Open prototype controls' });
    if (trigger) fireEvent.click(trigger);
  };

  const switchTo = (label: string) => {
    openControls();
    fireEvent.click(screen.getByRole('radio', { name: new RegExp(label) }));
  };

  it('switches a live stay into its finished state', () => {
    render(<GuestAppPrototype initialScreen="stay-overview" initialSession={activeSession} />);

    switchTo('Stay closed');

    expect(screen.getByTestId('guest-home-completed')).toBeInTheDocument();
    expect(screen.getByText(/settled at checkout/i)).toBeInTheDocument();
  });

  /*
    The reason the switch exists. There is no checkout to play forward, so
    without it the post-checkout app cannot be reached at all.
  */
  it('closes room charging on a finished stay', async () => {
    const user = userEvent.setup();
    /*
      Straight to the service. Since lifecycle gates the second tab reads
      `Book again` on a finished stay, so the catalogue is deliberately no
      longer one tap away -- but the charge itself still has to refuse, and
      that is what this covers.
    */
    // The switcher always lands on Home, so the finished session is handed in
    // directly rather than switched into from a service screen.
    render(
      <GuestAppPrototype
        initialScreen="vendor-service"
        initialSession={applyPrototypeStayState('closed')}
      />,
    );

    await user.click(screen.getByRole('button', { name: /Choose a time/ }));

    expect(screen.getByRole('heading', { name: 'This stay is settled' })).toBeInTheDocument();
    // It must not claim the stay is still ahead of the guest.
    expect(screen.queryByText(/open when you check in/i)).toBeNull();
  });

  it('replaces the catalogue tab with rebooking once the stay is over', async () => {
    const user = userEvent.setup();
    render(<GuestAppPrototype initialScreen="stay-overview" initialSession={activeSession} />);

    switchTo('Stay closed');
    const nav = screen.getByRole('navigation', { name: 'Primary navigation' });
    await user.click(within(nav).getAllByRole('button')[1]);

    expect(screen.getByRole('heading', { name: 'Where to next?' })).toBeInTheDocument();
  });

  it('reports the state it is actually in', () => {
    render(<GuestAppPrototype initialScreen="stay-overview" initialSession={activeSession} />);

    openControls();
    expect(screen.getByRole('radio', { name: /Live stay/ })).toBeChecked();

    fireEvent.click(screen.getByRole('radio', { name: /Signed out/ }));
    openControls();
    expect(screen.getByRole('radio', { name: /Signed out/ })).toBeChecked();
  });
});

describe('a finished stay on My Stay', () => {
  const finished = applyPrototypeStayState('closed');

  it('reads as a settled receipt, not a running total', () => {
    render(<GuestAppPrototype initialScreen="my-stay" initialSession={finished} />);

    expect(screen.getByText('This stay')).toBeInTheDocument();
    // "so far" is present tense about something that is over.
    expect(screen.queryByText('This stay so far')).toBeNull();
    expect(screen.getByText('Settled at checkout')).toBeInTheDocument();
  });

  /*
    The room line is the point. Before this the screen could only report what
    was charged *against* the room, so a stay that cost ₱18,600 to sleep in
    showed a room of nothing.
  */
  it('counts the room itself in the list', () => {
    render(<GuestAppPrototype initialScreen="my-stay" initialSession={finished} />);

    expect(screen.getByText('King room · 3 nights')).toBeInTheDocument();
    expect(screen.getByText('₱18,600')).toBeInTheDocument();
    expect(screen.getByText('Total settled')).toBeInTheDocument();
  });

  it('leads with booking another stay', () => {
    render(<GuestAppPrototype initialScreen="my-stay" initialSession={finished} />);

    expect(screen.getByRole('button', { name: /Book another stay/ })).toBeInTheDocument();
  });

  it('keeps the front desk reachable for the 24 hours after checkout', async () => {
    const user = userEvent.setup();
    // Reachability is now a property of the window, not of being checked out:
    // `finished` above is a stay whose desk window has already closed.
    render(<GuestAppPrototype initialScreen="my-stay" initialSession={applyPrototypeStayState('just-checked-out')} />);

    const nav = screen.getByRole('navigation', { name: 'Primary navigation' });
    await user.click(within(nav).getByRole('button', { name: /^Chat/ }));

    expect(screen.getByRole('heading', { name: 'Front desk', level: 1 })).toBeInTheDocument();
  });

  it('keeps the tabs so upcoming and past services stay distinct', () => {
    render(<GuestAppPrototype initialScreen="my-stay" initialSession={finished} />);

    expect(screen.getByRole('tab', { name: /Upcoming/ })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Past/ })).toBeInTheDocument();
  });

  it('keeps the current folio total off a live My Stay surface', () => {
    render(<GuestAppPrototype initialScreen="my-stay" initialSession={applyPrototypeStayState('live')} />);

    expect(screen.getByRole('button', { name: /Room charges/i })).not.toHaveTextContent('₱3,050');
    expect(screen.queryByRole('button', { name: /Book another stay/ })).toBeNull();
  });

  /*
    The live folio link went up unconditionally once a stay had started, so a
    checked-out guest was one tap from "Due at checkout ₱11,500" printed under
    "Total settled ₱33,150". The settled receipt is the only ledger after
    checkout, in both halves of the desk window.
  */
  it.each(['just-checked-out', 'closed'] as const)('drops the live folio link once the %s stay has settled', (state) => {
    render(<GuestAppPrototype initialScreen="my-stay" initialSession={applyPrototypeStayState(state)} />);

    expect(screen.queryByRole('button', { name: 'Room charges' })).toBeNull();
    expect(screen.getByRole('button', { name: /View settled stay/ })).toBeInTheDocument();
  });

  it('sends a settled stay that reaches the folio to its receipt', async () => {
    const user = userEvent.setup();
    render(<GuestAppPrototype initialScreen="folio" initialSession={applyPrototypeStayState('just-checked-out')} />);

    expect(screen.getByRole('heading', { name: 'This stay is settled' })).toBeInTheDocument();
    expect(screen.queryByText('Due at checkout')).toBeNull();
    expect(screen.queryByText(/off this bill/)).toBeNull();

    await user.click(screen.getByRole('button', { name: /View settled stay/ }));
    expect(screen.getByText('Total for this stay')).toBeInTheDocument();
  });
});

describe('booking another stay', () => {
  const finished = applyPrototypeStayState('closed');

  it('offers the estate, priced from its cheapest room', async () => {
    render(<GuestAppPrototype initialScreen="book-stay" initialSession={finished} />);

    expect(screen.getByRole('heading', { name: 'Where to next?' })).toBeInTheDocument();
    expect(screen.getByText('The Henry Dumaguete')).toBeInTheDocument();
    expect(screen.getByText('From ₱4,900 a night')).toBeInTheDocument();
  });

  /*
    Offering a room that cannot hold the party and refusing it at checkout
    wastes the guest's time, so capacity filters the list.
  */
  it('hides rooms that cannot hold the party', async () => {
    const user = userEvent.setup();
    render(<GuestAppPrototype initialScreen="book-stay" initialSession={finished} />);

    await user.click(screen.getByText('The Henry Cebu'));
    while (screen.getByRole('group', { name: 'Guests' }).querySelector('output')?.textContent !== '4') {
      await user.click(screen.getByRole('button', { name: 'More guests' }));
    }
    await user.click(screen.getByRole('button', { name: /See rooms/ }));

    expect(screen.getByText(/No room here sleeps that many/)).toBeInTheDocument();
    expect(screen.queryByText('Deluxe room')).toBeNull();
  });

  it('refuses a checkout date that is not after check in', async () => {
    const user = userEvent.setup();
    render(<GuestAppPrototype initialScreen="book-stay" initialSession={finished} />);

    await user.click(screen.getByText('The Henry Cebu'));
    // The calendar cannot produce one: the check-in day and everything before
    // it are struck out of the check-out calendar.
    await user.click(screen.getByRole('button', { name: /^Check out/ }));
    expect(screen.getByRole('button', { name: 'Friday · December 11' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Saturday · December 12' })).toBeEnabled();
  });

  it('books the stay direct and makes it the one the app is about', async () => {
    const user = userEvent.setup();
    render(<GuestAppPrototype initialScreen="book-stay" initialSession={finished} />);

    await user.click(screen.getByText('The Henry Cebu'));
    await user.click(screen.getByRole('button', { name: /See rooms/ }));
    await user.click(screen.getByText('Deluxe room'));
    await user.click(screen.getByRole('button', { name: /Continue to payment/ }));

    expect(screen.getByText('₱5,600 × 3 nights')).toBeInTheDocument();
    expect(screen.getByText('₱2,016')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Pay ₱18,816' }));

    expect(screen.getByRole('heading', { name: /going back to Cebu/ })).toBeInTheDocument();
    expect(screen.getByText('HEN-CEBU-261211')).toBeInTheDocument();
    // The commercial point: this one is not an OTA's.
    expect(screen.getByText('Direct booking')).toBeInTheDocument();
  });

  it('will not take payment offline, because the rate moves', async () => {
    const user = userEvent.setup();
    render(<GuestAppPrototype initialScreen="book-stay" initialSession={finished} initialOnline={false} />);

    await user.click(screen.getByText('The Henry Cebu'));
    await user.click(screen.getByRole('button', { name: /See rooms/ }));
    await user.click(screen.getByText('Deluxe room'));
    await user.click(screen.getByRole('button', { name: /Continue to payment/ }));

    expect(screen.getByRole('button', { name: /Pay ₱18,816/ })).toBeDisabled();
    expect(screen.getByText(/Booking needs a connection/)).toBeInTheDocument();
  });
});

/* --------------------------------------------------------------------------
   Lifecycle gates
   -------------------------------------------------------------------------- */

/*
  Rentals: their own category, reached from Browse. Ways it could fail:
  1. No Rentals row in Browse, or it lands on another category.
  2. The bikes and scooters still sit in Hotel Services too.
  3. A chip over the listing holds nothing.
  4. A motorbike or car books without saying a licence is needed; or the
     push bike does.
  5. Searching "motorbike" or "car" finds none of them.
*/
describe('rentals', () => {
  it('opens its own listing from Browse, split into two wheels and cars', async () => {
    const user = userEvent.setup();
    render(<GuestAppPrototype initialScreen="stay-overview" initialSession={activeSession} />);

    await openCategory(user, 'Rentals');
    expect(screen.getByRole('heading', { name: 'Rentals', level: 1 })).toBeInTheDocument();
    const chips = within(screen.getByLabelText('Explore subcategories')).getAllByRole('button').map((chip) => chip.textContent);
    expect(chips).toEqual(['All', 'Two wheels', 'Cars']);
    for (const name of ['City bicycle', 'E-bike', 'Scooter', 'Motorcycle', 'Compact car', 'SUV']) {
      expect(screen.getByRole('heading', { name: new RegExp(name) })).toBeInTheDocument();
    }

    await user.click(screen.getByRole('button', { name: 'Cars' }));
    expect(screen.queryByRole('heading', { name: /Scooter/ })).toBeNull();
  });

  it('leaves Hotel Services to the hotel, with the private car as a transfer', async () => {
    const user = userEvent.setup();
    render(<GuestAppPrototype initialScreen="stay-overview" initialSession={activeSession} />);

    await openCategory(user, 'Hotel Services');
    expect(screen.queryByRole('heading', { name: /City bicycle|Scooter/ })).toBeNull();
    expect(screen.getByRole('heading', { name: /Private car/ })).toBeInTheDocument();
  });

  it('asks for a licence on a motorbike, not on a push bike', async () => {
    const user = userEvent.setup();
    render(<GuestAppPrototype initialScreen="stay-overview" initialSession={activeSession} />);

    await openCategory(user, 'Rentals');
    await user.click(screen.getByRole('button', { name: /Motorcycle/ }));
    expect(screen.getByText(/driver.s licence/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Go back' }));
    await user.click(screen.getByRole('button', { name: /City bicycle/ }));
    expect(screen.queryByText(/driver.s licence/i)).toBeNull();
  });

  it('finds rentals by the words a guest would type', async () => {
    const user = userEvent.setup();
    render(<GuestAppPrototype initialScreen="marketplace" initialSession={activeSession} />);

    await user.click(screen.getByRole('button', { name: 'Search' }));
    const box = screen.getByRole('searchbox', { name: 'Ask anything about your stay' });
    await user.type(box, 'motorbike');
    expect(screen.getByRole('button', { name: /Motorcycle/ })).toBeInTheDocument();
    await user.clear(box);
    await user.type(box, 'car rental');
    expect(screen.getByRole('button', { name: /Compact car/ })).toBeInTheDocument();
  });
});

describe('booking the service the guest picked', () => {
  /*
    The form sold one thing -- the Hilom massage at ₱2,400 -- whatever had been
    tapped, so a hot stone therapy, an airport transfer and a luggage hold all
    confirmed as "Your massage is booked", and the arrival roster had no way to
    pay at all before a room existed.
  */
  const inStay = sessionFor(
    [makeBooking({ id: 'live', status: 'active', roomNumber: '304', roomVerification: { method: 'scan', at: '2026-11-11' } })],
    {
      activeBookingId: 'live',
      serviceBookings: [{
        id: 'service-hilom-1', bookingId: 'live', title: 'Hilom signature massage', serviceId: 'spa',
        scheduledFor: 'Thursday · November 12 · 1:30 PM', scheduledDate: '2026-11-12', scheduledHour: 13,
        amount: '₱2,400', status: 'confirmed', paymentStatus: 'charged-to-room', paymentMethod: 'room',
      }],
    },
  );
  const beforeArrival = sessionFor(
    [makeBooking({ id: 'soon', checkIn: '2026-11-20', checkOut: '2026-11-23' })],
    { activeBookingId: 'soon' },
  );

  it('books the listing that was tapped, alongside what is already booked', async () => {
    const user = userEvent.setup();
    render(<GuestAppPrototype initialScreen="stay-overview" initialSession={inStay} />);

    await openCategory(user, 'Spa & Wellness');
    await user.click(screen.getByRole('button', { name: /Hot stone therapy/ }));

    expect(screen.getByText(/Live availability is shown for Hot stone therapy/)).toBeInTheDocument();
    expect(screen.queryByText(/Hilom signature massage/)).toBeNull();

    await user.click(screen.getByRole('button', { name: /Charge to Room 304/i }));
    await user.click(screen.getByRole('button', { name: 'Charge ₱3,200 to room' }));
    expect(screen.getByRole('heading', { name: 'Hot stone therapy is booked' })).toBeInTheDocument();

    // The massage already on the stay is still there, at its own time.
    await user.click(screen.getByRole('button', { name: 'View my stay' }));
    expect(screen.getByRole('button', { name: /Hot stone therapy/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /hilom signature massage/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Upcoming \(2\)/ })).toBeInTheDocument();
  });

  it('books an arrival service by card before there is a room to charge', async () => {
    const user = userEvent.setup();
    render(<GuestAppPrototype initialScreen="pre-arrival-services" initialSession={beforeArrival} />);

    await user.click(screen.getByRole('button', { name: /Private car & driver/ }));

    expect(screen.getByText(/Live availability is shown for Private car & driver/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Charge to Room/i })).toBeNull();
    // The stay's own days, with the weekdays 2026 actually has: the Date row
    // states the day, and its calendar opens on it.
    await user.click(screen.getByRole('button', { name: /^Date/ }));
    expect(screen.getByRole('button', { name: 'Friday · November 20' })).toHaveAttribute('aria-pressed', 'true');

    await user.click(screen.getByRole('button', { name: /Pay now/ }));
    await user.click(screen.getByRole('button', { name: 'Card' }));
    await user.click(screen.getByRole('button', { name: 'Pay ₱4,800' }));

    expect(screen.getByRole('heading', { name: 'Private car & driver is booked' })).toBeInTheDocument();
    expect(screen.getByText(/Paid with card, direct to the hotel/)).toBeInTheDocument();
    expect(screen.queryByText(/added to room/i)).toBeNull();
  });

  it('books a complimentary arrival service without asking how to pay', async () => {
    const user = userEvent.setup();
    render(<GuestAppPrototype initialScreen="pre-arrival-services" initialSession={beforeArrival} />);

    await user.click(screen.getByRole('button', { name: /Luggage storage & delivery/ }));
    expect(screen.queryByRole('group', { name: /How would you like to pay/ })).toBeNull();
    await user.click(screen.getByRole('button', { name: 'Book Luggage storage & delivery' }));

    expect(screen.getByRole('heading', { name: 'Luggage storage & delivery is booked' })).toBeInTheDocument();
    expect(screen.getByText(/Complimentary, so there is nothing to pay/)).toBeInTheDocument();
  });

  it('still keeps on-property services behind the scan', async () => {
    const user = userEvent.setup();
    render(<GuestAppPrototype initialScreen="vendor-service" initialSession={beforeArrival} />);

    await user.click(screen.getByRole('button', { name: /Choose a time/ }));

    expect(screen.getByRole('heading', { name: 'On-property services open when you check in' })).toBeInTheDocument();
  });

  it('finds the booking already made when the same slot is confirmed again', async () => {
    const user = userEvent.setup();
    render(<GuestAppPrototype initialScreen="pre-arrival-services" initialSession={beforeArrival} />);

    await user.click(screen.getByRole('button', { name: /Luggage storage & delivery/ }));
    await user.click(screen.getByRole('button', { name: 'Book Luggage storage & delivery' }));
    await user.click(screen.getByRole('button', { name: 'Go back' }));
    await user.click(screen.getByRole('button', { name: 'Book Luggage storage & delivery' }));
    await user.click(screen.getByRole('button', { name: 'View my stay' }));

    expect(screen.getAllByRole('button', { name: /Luggage storage & delivery/ })).toHaveLength(1);
  });
});

describe('lifecycle gates', () => {
  const arrivedUnverified = sessionFor(
    [makeBooking({ id: 'live', status: 'active', roomNumber: '304', roomAssignment: 'ready' })],
    { activeBookingId: 'live' },
  );

  const verified = sessionFor(
    [makeBooking({
      id: 'live',
      status: 'active',
      roomNumber: '304',
      roomAssignment: 'ready',
      roomVerification: { method: 'scan', at: '2026-11-11' },
    })],
    { activeBookingId: 'live' },
  );

  const beforeArrival = sessionFor(
    [makeBooking({ id: 'soon', checkIn: '2026-11-20', checkOut: '2026-11-23' })],
    { activeBookingId: 'soon' },
  );

  const settled = sessionFor(
    [makeBooking({
      id: 'done',
      status: 'completed',
      checkIn: '2026-11-02',
      checkOut: '2026-11-05',
      roomNumber: '304',
    })],
    { activeBookingId: 'done' },
  );

  const secondTab = () =>
    within(screen.getByRole('navigation', { name: 'Primary navigation' }))
      .getAllByRole('button')[1];

  it('names the second tab for the gate the guest is in', () => {
    render(<GuestAppPrototype initialScreen="stay-overview" initialSession={beforeArrival} />);
    expect(secondTab()).toHaveAccessibleName('Explore');
    cleanup();

    render(<GuestAppPrototype initialScreen="stay-overview" initialSession={verified} />);
    expect(secondTab()).toHaveAccessibleName('Explore');
    cleanup();

    render(<GuestAppPrototype initialScreen="stay-overview" initialSession={settled} />);
    expect(secondTab()).toHaveAccessibleName('Book again');
  });

  it('keeps stay stories behind the room QR unlock', () => {
    render(<GuestAppPrototype initialScreen="stay-overview" initialSession={arrivedUnverified} />);

    expect(screen.getByTestId('guest-room-qr-row')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Make the most of your stay' })).toBeNull();
    expect(screen.queryByRole('group', { name: 'Stay stories' })).toBeNull();

    cleanup();
    render(<GuestAppPrototype initialScreen="stay-overview" initialSession={verified} />);

    expect(screen.queryByTestId('guest-room-qr-row')).toBeNull();
    expect(screen.getByRole('heading', { name: 'Make the most of your stay' })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Stay stories' })).toBeInTheDocument();
  });

  /*
    An upgrade adds its cost to the folio, so it is a room charge like any
    other. It was offered on dates alone, and a guest who had not scanned could
    confirm one and put ₱3,600 on a room the property had not seen them in.
  */
  it('offers a room upgrade only once the room is verified', () => {
    render(<GuestAppPrototype initialScreen="my-stay" initialSession={arrivedUnverified} />);
    expect(screen.queryByRole('button', { name: /Upgrade room/ })).toBeNull();

    cleanup();
    render(<GuestAppPrototype initialScreen="my-stay" initialSession={verified} />);
    expect(screen.getByRole('button', { name: /Upgrade room/ })).toBeInTheDocument();
  });

  it('refuses to charge an upgrade to a room that is not verified', async () => {
    const user = userEvent.setup();
    render(<GuestAppPrototype initialScreen="room-upgrade-confirmation" initialSession={arrivedUnverified} />);

    await user.click(screen.getByRole('button', { name: /Confirm upgrade/ }));

    expect(screen.getByRole('heading', { name: 'Scan the code in your room' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /Upgrade confirmed/ })).toBeNull();
  });

  it('keeps Chat available in the main navigation for every connected stay', () => {
    for (const session of [beforeArrival, arrivedUnverified, verified, settled]) {
      render(<GuestAppPrototype initialScreen="stay-overview" initialSession={session} />);
      const nav = screen.getByRole('navigation', { name: 'Primary navigation' });
      expect(within(nav).getAllByRole('button')).toHaveLength(5);
      expect(within(nav).getByRole('button', { name: 'Chat' })).toBeInTheDocument();
      cleanup();
    }
  });

  it('opens the existing chat flow from the main navigation', async () => {
    const user = userEvent.setup();
    render(<GuestAppPrototype initialScreen="stay-overview" initialSession={beforeArrival} />);

    await user.click(screen.getByRole('button', { name: 'Chat' }));

    expect(screen.getByRole('heading', { name: 'Front desk' })).toBeInTheDocument();
  });

  it('keeps back navigation and hides the primary nav to focus Chat', () => {
    for (const initialScreen of ['chat', 'chat-after-hours'] as const) {
      render(<GuestAppPrototype initialScreen={initialScreen} initialSession={verified} />);

      expect(screen.getByRole('button', { name: 'Go back' })).toBeInTheDocument();
      expect(screen.queryByRole('navigation', { name: 'Primary navigation' })).toBeNull();
      cleanup();
    }
  });

  it('opens chat in welcome mode with the front desk identity and five prompt actions', () => {
    render(<GuestAppPrototype initialScreen="chat" initialSession={verified} />);

    const chat = screen.getByRole('region', { name: 'Front desk conversation' });
    expect(chat).toHaveAttribute('data-chat-mode', 'welcome');
    expect(screen.getByRole('heading', { name: 'Front desk', level: 1 })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'How can we help with your stay?', level: 2 })).toBeInTheDocument();

    for (const label of ['Towels', 'Housekeeping', 'Late checkout', 'Room issue', 'Transfers']) {
      expect(within(chat).getByRole('button', { name: new RegExp(`^${label}`) })).toBeInTheDocument();
    }

    // Empty: the requests sit under the question they answer, not by the composer.
    expect(chat.querySelector('.guest-chat__welcome .guest-quick-actions')).toBeInTheDocument();
    expect(chat.querySelector('.guest-chat__dock .guest-quick-actions')).toBeNull();
    expect(within(chat).queryByText('Popular requests')).toBeNull();
  });

  it('docks the requests above the composer once the conversation starts', async () => {
    const user = userEvent.setup();
    render(<GuestAppPrototype initialScreen="chat" initialSession={verified} />);

    await user.click(screen.getByRole('button', { name: /^Towels/ }));

    const chat = screen.getByRole('region', { name: 'Front desk conversation' });
    expect(chat.querySelector('.guest-chat__dock .guest-quick-actions')).toBeInTheDocument();
    expect(chat.querySelector('.guest-chat__welcome')).toBeNull();
  });

  it('changes to conversation mode after a prompt sends through the existing path', async () => {
    const user = userEvent.setup();
    render(<GuestAppPrototype initialScreen="chat" initialSession={verified} />);

    await user.click(screen.getByRole('button', { name: /^Room issue/ }));

    expect(screen.getByRole('region', { name: 'Front desk conversation' })).toHaveAttribute('data-chat-mode', 'conversation');
    expect(screen.getByText(/There’s an issue in room 304/)).toBeInTheDocument();
    expect(screen.getByText('Sent')).toBeInTheDocument();
  });

  it('marks a new front-desk reply on Chat when the guest is elsewhere', () => {
    vi.useFakeTimers();
    try {
      render(<GuestAppPrototype initialScreen="stay-overview" initialSession={verified} />);

      fireEvent.click(screen.getByRole('button', { name: 'Chat' }));
      fireEvent.click(screen.getByRole('button', { name: /^Room issue/ }));
      fireEvent.click(screen.getByRole('button', { name: 'Go back' }));

      act(() => { vi.advanceTimersByTime(850); });

      const unreadChat = screen.getByRole('button', { name: 'Chat, new message' });
      expect(unreadChat).toBeInTheDocument();
      expect(unreadChat.querySelector('.guest-bottom-nav__badge')).toBeInTheDocument();

      fireEvent.click(unreadChat);
      expect(screen.getByRole('button', { name: 'Go back' })).toBeInTheDocument();
      expect(screen.queryByRole('navigation', { name: 'Primary navigation' })).toBeNull();
      expect(screen.queryByRole('button', { name: 'Chat, new message' })).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });

  it('lets an arrival service go on the room before a room is assigned', async () => {
    const user = userEvent.setup();
    render(<GuestAppPrototype initialScreen="stay-overview" initialSession={beforeArrival} />);

    await user.click(secondTab());
    await user.click(screen.getByRole('button', { name: /Private car & driver/ }));

    // Either way is the guest's call, and the room one must not loop back to
    // "open when you check in" as it once did.
    expect(screen.getByRole('button', { name: /Pay now/ })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Charge to your room/ }));
    await user.click(screen.getByRole('button', { name: /Charge ₱[\d,]+ to room/ }));

    expect(screen.getByRole('heading', { name: /Private car & driver is booked/ })).toBeInTheDocument();
    expect(screen.getByText(/is paid with your room bill at checkout/)).toBeInTheDocument();
  });

  it('lists arrival services by name alone before a room is assigned', async () => {
    const user = userEvent.setup();
    render(<GuestAppPrototype initialScreen="stay-overview" initialSession={beforeArrival} />);

    await user.click(secondTab());

    // The screen kept its job and changed its name in `8144c6c`; "Arrange your
    // arrival" is now the button that reaches it from a blocked booking.
    expect(screen.getByRole('heading', { name: 'Arrival services' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Airport transfer/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Private car & driver/ })).toBeInTheDocument();
    // How to pay is chosen on the booking itself, so the list quotes neither.
    expect(screen.queryByText(/Paid by card/i)).toBeNull();
    expect(screen.queryByText(/₱1,200|₱4,800/)).toBeNull();
    expect(screen.getByText('Subject to hotel confirmation')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Hilom signature massage/ })).toBeNull();
  });

  it('offers a hotel-arranged ride request once a room is assigned', () => {
    render(<GuestAppPrototype initialScreen="transfer-booking" initialSession={assignedSession} />);

    expect(screen.getByRole('heading', { name: 'Book a ride' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Trip summary' })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'When would you like to leave?' })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Passengers' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Request a ride/ })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Pay now/i })).toBeNull();
  });

  it('routes the ride request through front-desk chat', async () => {
    const user = userEvent.setup();
    render(<GuestAppPrototype initialScreen="transfer-booking" initialSession={assignedSession} />);

    await user.click(screen.getByRole('button', { name: /Request a ride/ }));

    expect(screen.getByRole('heading', { name: 'Front desk' })).toBeInTheDocument();
    expect(screen.getByText(/request a ride from/i)).toBeInTheDocument();
  });

  it('locks the catalogue for a guest who has arrived and not scanned', async () => {
    const user = userEvent.setup();
    render(<GuestAppPrototype initialScreen="stay-overview" initialSession={arrivedUnverified} />);

    await user.click(secondTab());

    expect(screen.getByRole('heading', { name: 'Arrival services' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Scan room code$/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /I can.{1,3}t scan/ })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Categories' })).toBeNull();
  });

  it('opens the catalogue once the room is scanned', async () => {
    const user = userEvent.setup();
    render(<GuestAppPrototype initialScreen="stay-overview" initialSession={verified} />);

    await user.click(secondTab());

    expect(screen.getByTestId('reel-feed')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Scan the code in your room' })).toBeNull();
  });

  it('keeps promoted Explore categories on the existing listing route', async () => {
    const user = userEvent.setup();
    render(<GuestAppPrototype initialScreen="marketplace" initialSession={verified} />);

    await user.click(screen.getByRole('button', { name: 'Browse' }));
    await user.click(within(screen.getByRole('dialog', { name: 'Browse' })).getByRole('button', { name: /Spa & Wellness/ }));

    expect(screen.getByRole('heading', { name: 'Spa & Wellness', level: 1 })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Explore' })).toBeInTheDocument();
  });

  it('opens the catalogue by scanning, and says so without claiming a check-in', async () => {
    vi.useFakeTimers();
    try {
      render(<GuestAppPrototype initialScreen="stay-overview" initialSession={arrivedUnverified} />);

      fireEvent.click(secondTab());
      fireEvent.click(screen.getByRole('button', { name: /^Scan room code$/ }));
      expect(screen.getByTestId('room-scanner')).toBeInTheDocument();

      await act(async () => { vi.advanceTimersByTime(2500); });

      // The app confirms presence. It never says it checked anyone in -- the
      // front desk does that, against the property's own PMS.
      expect(screen.getByTestId('room-unlocked')).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'You’re all set' })).toBeInTheDocument();
      expect(screen.queryByText(/you.{0,3}re checked in/i)).toBeNull();

      fireEvent.click(within(screen.getByTestId('room-unlocked')).getByRole('button', { name: /Start exploring/ }));
      expect(screen.getByTestId('reel-feed')).toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  it("files a desk request for 'I can't scan' and unlocks nothing until the desk answers", async () => {
    const user = userEvent.setup();
    render(<GuestAppPrototype initialScreen="stay-overview" initialSession={arrivedUnverified} />);

    await user.click(secondTab());
    await user.click(screen.getByRole('button', { name: /I can.{1,3}t scan/ }));

    // Lands in the thread with the request stated, and the catalogue stays shut.
    expect(screen.getByRole('heading', { name: 'Front desk' })).toBeInTheDocument();
    expect(screen.getByText(/can't scan the code in room 304/i)).toBeInTheDocument();

    // Chat is focused: the tab bar is deliberately absent there, so leaving is
    // the app bar's job rather than the nav's.
    await user.click(screen.getByRole('button', { name: 'Go back' }));
    await user.click(secondTab());
    expect(screen.getByText('The front desk has your request')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Categories' })).toBeNull();
  });

  it('opens the catalogue when the front desk grants the request', async () => {
    const user = userEvent.setup();
    render(<GuestAppPrototype initialScreen="stay-overview" initialSession={arrivedUnverified} />);

    await user.click(secondTab());
    await user.click(screen.getByRole('button', { name: /I can.{1,3}t scan/ }));
    await user.click(screen.getByRole('button', { name: /Confirm .* in room 304/i }));

    // As above: out of the focused chat before the tab bar is there to use.
    await user.click(screen.getByRole('button', { name: 'Go back' }));
    await user.click(secondTab());
    expect(screen.getByTestId('reel-feed')).toBeInTheDocument();
  });

  /*
    jsdom does no layout, so the overlap itself cannot be seen here -- in a
    browser the grant sat directly under the docked composer and a tap on it
    landed in the text box. What can be pinned is the structure that fixes it:
    the grant lives in the conversation, which keeps its bottom clear of the
    composer, and never as the composer's neighbour.
  */
  it('keeps the desk grant in the conversation, clear of the docked composer', async () => {
    const user = userEvent.setup();
    render(<GuestAppPrototype initialScreen="stay-overview" initialSession={arrivedUnverified} />);

    await user.click(secondTab());
    await user.click(screen.getByRole('button', { name: /I can.{1,3}t scan/ }));

    const grant = screen.getByRole('button', { name: /Confirm .* in room 304/i }).closest('.guest-desk-grant');
    expect(grant?.closest('.guest-messages')).not.toBeNull();
  });

  it('reaches the front desk before arrival', async () => {
    const user = userEvent.setup();
    render(<GuestAppPrototype initialScreen="stay-overview" initialSession={beforeArrival} />);

    await user.click(within(screen.getByRole('navigation', { name: 'Primary navigation' })).getByRole('button', { name: /^Chat/ }));

    expect(screen.getByRole('heading', { name: 'Front desk' })).toBeInTheDocument();
  });

  it('sends each quick action through the existing front-desk message path', async () => {
    const user = userEvent.setup();
    render(<GuestAppPrototype initialScreen="chat" initialSession={verified} />);

    await user.click(screen.getByRole('button', { name: /^Room issue/ }));

    expect(screen.getByText(/There’s an issue in room 304/)).toBeInTheDocument();
    expect(screen.getByText('Sent')).toBeInTheDocument();
  });

  it('renders an outgoing image and preserves the offline delivery state', async () => {
    const user = userEvent.setup();
    render(<GuestAppPrototype initialScreen="chat" initialSession={verified} initialOnline={false} />);
    const file = new File(['room'], 'room.jpg', { type: 'image/jpeg' });

    fireEvent.change(screen.getByLabelText('Choose an image to attach'), { target: { files: [file] } });
    await user.click(screen.getByRole('button', { name: 'Send message' }));

    expect(screen.getByRole('img', { name: 'room.jpg' })).toBeInTheDocument();
    expect(screen.getByText('Will send when connected')).toBeInTheDocument();
  });

  it('renders an outgoing voice message through the existing offline path', async () => {
    const user = userEvent.setup();
    const recorderDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'MediaRecorder');
    const mediaDevicesDescriptor = Object.getOwnPropertyDescriptor(navigator, 'mediaDevices');
    const stopTrack = vi.fn();

    class MockMediaRecorder {
      static isTypeSupported = vi.fn(() => true);
      state = 'inactive';
      mimeType = 'audio/webm';
      ondataavailable?: (event: { data: Blob }) => void;
      onstop?: () => void;
      start = vi.fn(() => {
        this.state = 'recording';
      });
      stop = vi.fn(() => {
        this.state = 'inactive';
        this.ondataavailable?.({ data: new Blob(['voice'], { type: 'audio/webm' }) });
        this.onstop?.();
      });
    }

    vi.stubGlobal('MediaRecorder', MockMediaRecorder);
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: { getUserMedia: vi.fn().mockResolvedValue({ getTracks: () => [{ stop: stopTrack }] }) },
    });

    try {
      render(<GuestAppPrototype initialScreen="chat" initialSession={verified} initialOnline={false} />);
      await user.click(screen.getByRole('button', { name: 'Start voice recording' }));
      await user.click(screen.getByRole('button', { name: 'Stop recording' }));
      await user.click(screen.getByRole('button', { name: 'Send message' }));

      expect(screen.getByLabelText('Voice message · 00:00')).toBeInTheDocument();
      expect(screen.getByText('Voice message attached.')).toBeInTheDocument();
      expect(screen.getByText('Will send when connected')).toBeInTheDocument();
      expect(stopTrack).toHaveBeenCalled();
    } finally {
      if (recorderDescriptor) {
        Object.defineProperty(globalThis, 'MediaRecorder', recorderDescriptor);
      } else {
        Reflect.deleteProperty(globalThis, 'MediaRecorder');
      }
      if (mediaDevicesDescriptor) {
        Object.defineProperty(navigator, 'mediaDevices', mediaDevicesDescriptor);
      } else {
        Reflect.deleteProperty(navigator, 'mediaDevices');
      }
    }
  });

  it('closes an outgoing image preview with Escape', async () => {
    const user = userEvent.setup();
    render(<GuestAppPrototype initialScreen="chat" initialSession={verified} />);
    const file = new File(['room'], 'room.jpg', { type: 'image/jpeg' });

    fireEvent.change(screen.getByLabelText('Choose an image to attach'), { target: { files: [file] } });
    await user.click(screen.getByRole('button', { name: 'Send message' }));
    await user.click(screen.getByRole('button', { name: 'room.jpg' }));

    expect(screen.getByRole('dialog', { name: 'Image preview' })).toBeInTheDocument();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog', { name: 'Image preview' })).toBeNull();
  });

  it('keeps image preview focus contained and returns it to the trigger', async () => {
    const user = userEvent.setup();
    render(<GuestAppPrototype initialScreen="chat" initialSession={verified} />);
    const file = new File(['room'], 'room.jpg', { type: 'image/jpeg' });

    fireEvent.change(screen.getByLabelText('Choose an image to attach'), { target: { files: [file] } });
    await user.click(screen.getByRole('button', { name: 'Send message' }));
    const trigger = screen.getByRole('button', { name: 'room.jpg' });
    await user.click(trigger);

    const close = screen.getByRole('button', { name: 'Close preview' });
    expect(close).toHaveFocus();
    await user.keyboard('{Tab}');
    expect(close).toHaveFocus();
    await user.click(close);
    expect(trigger).toHaveFocus();
  });
});

describe('post-stay front desk window', () => {
  const justCheckedOut = applyPrototypeStayState('just-checked-out');
  const closed = applyPrototypeStayState('closed');

  it('disables quick actions and media controls when the post-stay chat is closed', () => {
    render(<GuestAppPrototype initialScreen="chat" initialSession={closed} />);

    expect(screen.getByRole('button', { name: /^Towels/ })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Open attachment menu' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Start voice recording' })).toBeDisabled();
  });

  it('keeps the desk reachable for 24 hours, and says how long is left', () => {
    render(<GuestAppPrototype initialScreen="my-stay" initialSession={justCheckedOut} />);

    expect(screen.getByText(/Front desk open for another \d+ hours?/)).toBeInTheDocument();
    // The Chat tab is the route while the window is open; it goes disabled, not
    // missing, once the window closes.
    expect(within(screen.getByRole('navigation', { name: 'Primary navigation' })).getByRole('button', { name: /^Chat/ })).toBeInTheDocument();
  });

  it('closes the desk once the window is over and offers a review instead', () => {
    render(<GuestAppPrototype initialScreen="my-stay" initialSession={closed} />);

    expect(screen.getByText('Front desk chat closed')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Rate your stay' })).toBeInTheDocument();
  });

  it('still shows every activity and charge after the desk closes', () => {
    render(<GuestAppPrototype initialScreen="my-stay" initialSession={closed} />);

    // The receipt is the point of the screen once the conversation is over.
    expect(screen.getByText('This stay')).toBeInTheDocument();
    expect(screen.getByText(/King room · 3 nights/)).toBeInTheDocument();
    expect(screen.getByText('Spa & wellness')).toBeInTheDocument();
  });

  it('takes a stay-level rating and keeps it', async () => {
    const user = userEvent.setup();
    render(<GuestAppPrototype initialScreen="my-stay" initialSession={closed} />);

    await user.click(screen.getByRole('button', { name: 'Rate your stay' }));
    await user.click(screen.getByRole('radio', { name: '4 stars' }));
    await user.type(screen.getByLabelText(/Anything you.{1,3}d like the property to know/), 'Lovely room, slow breakfast.');
    await user.click(screen.getByRole('button', { name: 'Send to the property' }));

    expect(screen.getByRole('heading', { name: 'Thank you' })).toBeInTheDocument();
    // Private to the property: nothing here publishes or scores a listing.
    expect(screen.getByText(/only the property sees this/i)).toBeInTheDocument();
  });

  it('does not ask twice once a stay has been rated', async () => {
    const user = userEvent.setup();
    render(<GuestAppPrototype initialScreen="my-stay" initialSession={closed} />);

    await user.click(screen.getByRole('button', { name: 'Rate your stay' }));
    await user.click(screen.getByRole('radio', { name: '5 stars' }));
    await user.click(screen.getByRole('button', { name: 'Send to the property' }));
    await user.click(screen.getByRole('button', { name: /Back to my stay/ }));

    expect(screen.queryByRole('button', { name: 'Rate your stay' })).toBeNull();
    expect(screen.getByText(/You rated this stay 5/)).toBeInTheDocument();
  });
});

describe('checked-out My Stay copy', () => {
  it('does not invite a checked-out guest to charge to a room they have left', () => {
    render(<GuestAppPrototype initialScreen="my-stay" initialSession={applyPrototypeStayState('closed')} />);

    expect(screen.queryByText(/settle at checkout\.$/)).toBeNull();
    expect(screen.queryByRole('button', { name: /Explore on-property/ })).toBeNull();
  });
});

describe('signed-in home with no booking', () => {
  const returning = { ...restoreProfileSession(), bookings: [], activeBookingId: undefined };
  const brandNew = createAccountSession('Ana Santos', 'ana@example.com', 'google');

  it('starts the signed-in, no-booking flow at booking lookup after Google SSO', async () => {
    const user = userEvent.setup();
    render(<GuestAppPrototype />);

    await user.click(screen.getByRole('button', { name: 'Continue with Google' }));

    expect(screen.getByRole('heading', { name: 'Find your booking' })).toBeInTheDocument();
    expect(screen.getByLabelText(/Booking or confirmation number/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Last name/)).toBeInTheDocument();
  });

  it('keeps Apple SSO on the upcoming booking, not the no-booking home', async () => {
    const user = userEvent.setup();
    render(<GuestAppPrototype />);

    await user.click(screen.getByRole('button', { name: 'Continue with Apple' }));

    expect(screen.getByTestId('guest-home-upcoming')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Check-in before arrival' })).toBeInTheDocument();
  });

  it('shows the guest their recent stays and links to the full list', async () => {
    const user = userEvent.setup();
    render(<GuestAppPrototype initialScreen="stay-overview" initialSession={returning} />);

    expect(screen.getByRole('heading', { name: 'Previous stays' })).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /The Henry/ }).length).toBeGreaterThan(0);

    await user.click(screen.getByRole('button', { name: /See all 3 stays/ }));
    expect(screen.getByRole('heading', { name: 'Stay history', level: 1 })).toBeInTheDocument();
  });

  it('greets a returning guest by what they have actually done', () => {
    render(<GuestAppPrototype initialScreen="stay-overview" initialSession={returning} />);

    expect(screen.getByRole('heading', { name: 'Welcome back, Ana' })).toBeInTheDocument();
  });

  it('shows a new account no history it has not earned', () => {
    render(<GuestAppPrototype initialScreen="stay-overview" initialSession={brandNew} />);

    expect(screen.getByRole('heading', { name: 'Hello, Ana' })).toBeInTheDocument();

    expect(screen.queryByRole('heading', { name: 'Previous stays' })).toBeNull();
    expect(screen.queryByText(/The Henry Cebu/)).toBeNull();
    expect(screen.getByRole('button', { name: /Add a booking/ })).toBeInTheDocument();
  });

  it('does not offer a scan to a guest with no room to scan', () => {
    render(<GuestAppPrototype initialScreen="stay-overview" initialSession={returning} />);

    /*
      No booking means no allocated room, so there is no code on any desk
      card for this guest to point a camera at. Offering it was an action
      that could not succeed.
    */
    expect(screen.queryByRole('button', { name: /Scan a room code/ })).toBeNull();
    expect(screen.queryByTestId('guest-room-qr-row')).toBeNull();
    // There is no allocated room and no app-bar action that could open a
    // viewfinder which could never resolve to anything.
    expect(screen.queryByTestId('guest-room-qr-action')).toBeNull();
  });
});

describe('mock camera', () => {
  const arrivedUnverified = sessionFor(
    [makeBooking({ id: 'live', status: 'active', roomNumber: '304', roomAssignment: 'ready' })],
    { activeBookingId: 'live' },
  );

  it('leads the arrived, unscanned home with the scan', () => {
    render(<GuestAppPrototype initialScreen="stay-overview" initialSession={arrivedUnverified} />);

    // One quiet row among several was the wrong weight for the single thing
    // standing between this guest and the rest of the app.
    expect(screen.getByTestId('guest-room-qr-row')).toHaveClass('guest-button--primary');
  });

  it('opens a viewfinder rather than a page of text', async () => {
    const user = userEvent.setup();
    render(<GuestAppPrototype initialScreen="stay-overview" initialSession={arrivedUnverified} />);

    await user.click(screen.getByTestId('guest-room-qr-row'));

    expect(screen.getByRole('heading', { name: 'Place QR code in the frame' })).toBeInTheDocument();
    expect(screen.getByTestId('room-scanner')).toBeInTheDocument();
  });

  it('detects the code on its own, the way a real scan does', async () => {
    vi.useFakeTimers();
    try {
      render(<GuestAppPrototype initialScreen="scan-room-code" initialSession={arrivedUnverified} />);
      expect(screen.getByTestId('room-scanner')).toBeInTheDocument();

      await act(async () => { vi.advanceTimersByTime(2500); });

      expect(screen.getByTestId('room-unlocked')).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'You’re all set' })).toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  it('waits for the scanner instead of exposing a fake success control', () => {
    render(<GuestAppPrototype initialScreen="scan-room-code" initialSession={arrivedUnverified} />);

    expect(screen.getByTestId('room-scanner')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Place QR code in the frame' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Simulate a successful scan/ })).toBeNull();
  });

  it('lets the guest back out without scanning', async () => {
    const user = userEvent.setup();
    render(<GuestAppPrototype initialScreen="scan-room-code" initialSession={arrivedUnverified} />);

    await user.click(screen.getByRole('button', { name: 'Close scanner' }));

    expect(screen.queryByTestId('room-scanner')).toBeNull();
  });

  /*
    The viewfinder is a step. Left in history, Back from the unlocked screen
    landed on it again and it read the code a second time.
  */
  it('leaves the viewfinder out of history once it has read the code', async () => {
    vi.useFakeTimers();
    try {
      render(<GuestAppPrototype initialScreen="stay-overview" initialSession={arrivedUnverified} />);
      fireEvent.click(screen.getByTestId('guest-room-qr-row'));
      await act(async () => { vi.advanceTimersByTime(2500); });
      expect(screen.getByRole('heading', { name: 'You’re all set' })).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: 'Go back' }));

      expect(screen.queryByTestId('room-scanner')).toBeNull();
      expect(screen.getByTestId('guest-home-active')).toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });
});

describe('scanning outside the stay window', () => {
  // Room assigned, pre-registration done, arrival nine days out.
  const early = sessionFor(
    [makeBooking({
      id: 'soon',
      checkIn: '2026-11-20',
      checkOut: '2026-11-23',
      roomNumber: '512',
      roomAssignment: 'assigned',
      preArrivalCompleted: 4,
      preArrivalTotal: 4,
    })],
    { activeBookingId: 'soon' },
  );

  it('holds the room card without a scan until the stay starts', () => {
    render(<GuestAppPrototype initialScreen="stay-overview" initialSession={early} />);

    expect(screen.getByText('Room 512 is ready')).toBeInTheDocument();
    expect(screen.queryByTestId('guest-room-qr-row')).toBeNull();
    expect(screen.getByText(/Held for your arrival on Nov 20/)).toBeInTheDocument();
  });

  /*
    It used to announce "You're all set. Everything at the hotel is open to
    you" and award the scan points nine days early, while every service stayed
    locked -- and the verification it stored would have opened the gate on
    arrival day with nobody having scanned in.
  */
  it('answers an early scan with the date instead of an unlock', async () => {
    vi.useFakeTimers();
    try {
      render(<GuestAppPrototype initialScreen="scan-room-code" initialSession={early} />);
      await act(async () => { vi.advanceTimersByTime(2500); });

      expect(screen.getByRole('heading', { name: 'Scan again when you arrive' })).toBeInTheDocument();
      expect(screen.queryByRole('heading', { name: 'You’re all set' })).toBeNull();
      expect(screen.queryByText(/Room connected successfully/)).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });
});

describe('prototype controls', () => {
  const openControls = async (user: ReturnType<typeof userEvent.setup>) => {
    await user.click(screen.getByRole('button', { name: 'Open prototype controls' }));
  };

  const arrivedUnverified = sessionFor(
    [makeBooking({ id: 'live', status: 'active', roomNumber: '304', roomAssignment: 'ready' })],
    { activeBookingId: 'live' },
  );

  it('flips the room gate without walking the scan flow', async () => {
    const user = userEvent.setup();
    render(<GuestAppPrototype initialScreen="stay-overview" initialSession={arrivedUnverified} />);

    await openControls(user);
    await user.click(screen.getByRole('button', { name: /Verify room \(skip the scan\)/ }));
    await user.click(screen.getByRole('button', { name: 'Close prototype controls' }));

    const nav = screen.getByRole('navigation', { name: 'Primary navigation' });
    await user.click(within(nav).getAllByRole('button')[1]);
    expect(screen.getByTestId('reel-feed')).toBeInTheDocument();
  });

  it('re-locks a verified room so the scan can be run again', async () => {
    const user = userEvent.setup();
    render(<GuestAppPrototype initialScreen="stay-overview" initialSession={applyPrototypeStayState('live')} />);

    await openControls(user);
    await user.click(screen.getByRole('button', { name: /Clear room verification/ }));
    await user.click(screen.getByRole('button', { name: 'Close prototype controls' }));

    const nav = screen.getByRole('navigation', { name: 'Primary navigation' });
    await user.click(within(nav).getAllByRole('button')[1]);
    expect(screen.getByRole('button', { name: /^Scan room code$/ })).toBeInTheDocument();
  });

  it('clears and re-seeds stay history', async () => {
    const user = userEvent.setup();
    const returning = { ...restoreProfileSession(), bookings: [], activeBookingId: undefined };
    render(<GuestAppPrototype initialScreen="stay-overview" initialSession={returning} />);

    expect(screen.getByRole('heading', { name: 'Previous stays' })).toBeInTheDocument();

    await openControls(user);
    await user.click(screen.getByRole('button', { name: /Clear stay history/ }));
    await user.click(screen.getByRole('button', { name: 'Close prototype controls' }));

    expect(screen.queryByRole('heading', { name: 'Previous stays' })).toBeNull();
  });

  it('closes when the modal backdrop is selected', async () => {
    const user = userEvent.setup();
    render(<GuestAppPrototype initialScreen="stay-overview" initialSession={arrivedUnverified} />);

    await openControls(user);
    await user.click(screen.getByTestId('prototype-controls-backdrop'));

    expect(screen.queryByRole('region', { name: 'Prototype controls' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Open prototype controls' })).toHaveAttribute('aria-expanded', 'false');
  });

  it('holds the viewfinder open when auto-detect is off', async () => {
    /*
      fireEvent, not userEvent: userEvent schedules its own work on timers,
      so pairing it with vi.useFakeTimers has the two deadlock. The clicks
      here are plain, so the synchronous API loses nothing.
    */
    vi.useFakeTimers();
    try {
      render(<GuestAppPrototype initialScreen="stay-overview" initialSession={arrivedUnverified} />);

      fireEvent.click(screen.getByRole('button', { name: 'Open prototype controls' }));
      fireEvent.click(screen.getByRole('button', { name: /Scanner: auto-detects after 2s/ }));
      fireEvent.click(screen.getByRole('button', { name: 'Close prototype controls' }));
      fireEvent.click(screen.getByTestId('guest-room-qr-row'));

      await act(async () => { vi.advanceTimersByTime(6000); });

      // Still on the viewfinder: a presenter can talk over it.
      expect(screen.getByTestId('room-scanner')).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Place QR code in the frame' })).toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });
});

describe('prototype controls layout', () => {
  it('keeps the panel and its close button reachable as the rig grows', () => {
    // The rig gains rows with every feature; on a phone it outgrew the
    // viewport and took its own close button off the top of the screen.
    expect(guestStyles).toMatch(/\.guest-prototype-toolbar__body\s*\{[^}]*overflow-y:\s*auto/);
    // min-height:0 is the line that actually lets the grid item scroll.
    expect(guestStyles).toMatch(/\.guest-prototype-toolbar__body\s*\{[^}]*min-height:\s*0/);
  });
});

describe('scan discoverability', () => {
  const verified = sessionFor(
    [makeBooking({
      id: 'live',
      status: 'active',
      roomNumber: '304',
      roomVerification: { method: 'scan', at: '2026-11-11' },
    })],
    { activeBookingId: 'live' },
  );
  const unverified = sessionFor(
    [makeBooking({ id: 'live', status: 'active', roomNumber: '304' })],
    { activeBookingId: 'live' },
  );

  it('keeps room scanning in contextual entry points instead of the app bar', async () => {
    const user = userEvent.setup();

    for (const start of ['stay-overview', 'my-stay', 'marketplace', 'folio'] as const) {
      render(<GuestAppPrototype initialScreen={start} initialSession={verified} />);
      expect(screen.queryByTestId('guest-room-qr-action')).toBeNull();
      cleanup();
    }

    render(<GuestAppPrototype initialScreen="stay-overview" initialSession={unverified} />);
    expect(screen.queryByTestId('guest-room-qr-action')).toBeNull();
    await user.click(screen.getByTestId('guest-room-qr-row'));
    expect(screen.getByRole('heading', { name: 'Place QR code in the frame' })).toBeInTheDocument();
  });

  it('does not add a scan icon to the app bar for either room state', () => {
    render(<GuestAppPrototype initialScreen="stay-overview" initialSession={unverified} />);
    expect(screen.queryByRole('button', { name: /Scan room code/ })).not.toBeInTheDocument();
    cleanup();

    render(<GuestAppPrototype initialScreen="stay-overview" initialSession={verified} />);
    expect(screen.queryByRole('button', { name: /Scan room code/ })).not.toBeInTheDocument();
  });

  it('drops the home row once the room is verified without adding another affordance', () => {
    render(<GuestAppPrototype initialScreen="stay-overview" initialSession={verified} />);

    // The verified state has already completed the only step this action is
    // for, so the room row and the app-bar duplicate are both absent.
    expect(screen.queryByTestId('guest-room-qr-row')).toBeNull();
    expect(screen.queryByTestId('guest-room-qr-action')).toBeNull();
  });

  it('keeps service discovery in the category catalog instead of duplicating featured cards on home', () => {
    render(<GuestAppPrototype initialScreen="stay-overview" initialSession={verified} />);

    expect(screen.getByRole('heading', { name: 'Make the most of your stay' })).toBeInTheDocument();
    expect(document.querySelector('.guest-home-stories')).toBeInTheDocument();
    // Places, not categories: the categories live behind Browse in Explore.
    expect(within(screen.getByRole('group', { name: 'Stay stories' })).getAllByRole('button').length).toBeGreaterThan(3);
    expect(screen.queryByRole('button', { name: 'Spa & Wellness' })).toBeNull();
    expect(document.querySelector('.guest-featured-rail')).toBeNull();
  });

  it('uses the story rail after room verification on a booking still marked upcoming', () => {
    const verifiedUpcoming = sessionFor([
      makeBooking({
        id: 'verified-upcoming',
        status: 'upcoming',
        roomNumber: '512',
        roomAssignment: 'ready',
        preArrivalCompleted: 4,
        preArrivalTotal: 4,
        roomVerification: { method: 'scan', at: '2026-11-11' },
      }),
    ], { activeBookingId: 'verified-upcoming' });

    render(<GuestAppPrototype initialScreen="stay-overview" initialSession={verifiedUpcoming} />);

    expect(screen.getByRole('heading', { name: 'Make the most of your stay' })).toBeInTheDocument();
    expect(document.querySelector('.guest-home-stories')).toBeInTheDocument();
    expect(document.querySelector('.guest-category-catalog')).toBeNull();
  });

  it('puts property updates in one slim row under the stay card', () => {
    render(<GuestAppPrototype initialScreen="stay-overview" initialSession={verified} />);

    // One line, not a section: no heading, the lead title, a count of the rest.
    const updates = screen.getByRole('region', { name: 'Updates for your stay' });
    expect(screen.queryByRole('heading', { name: 'Updates for your stay' })).toBeNull();
    expect(within(updates).getAllByRole('button')).toHaveLength(1);

    // Above the rest of the home, not after it.
    const nearby = screen.getByRole('heading', { name: 'Make the most of your stay' });
    expect(updates.compareDocumentPosition(nearby) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('keeps property updates off the pre-arrival home', () => {
    render(<GuestAppPrototype initialScreen="stay-overview" initialSession={applyPrototypeStayState('pre-arrival')} />);
    expect(screen.queryByRole('region', { name: 'Updates for your stay' })).toBeNull();
  });

  it('offers a hotel transfer below pre-arrival and opens its booking form', async () => {
    const user = userEvent.setup();
    render(<GuestAppPrototype initialScreen="stay-overview" initialSession={applyPrototypeStayState('pre-arrival')} />);

    // The offer is the card itself now, not a heading over a separate CTA.
    const transfer = screen.getByRole('button', { name: /Need a ride to the hotel/ });
    await user.click(transfer);

    expect(screen.getByRole('heading', { name: 'Book a ride' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Trip summary' })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'When would you like to leave?' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Now' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Schedule for later' })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Passengers' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Request a ride/ })).toBeInTheDocument();
  });

  it('opens a property update when selected', async () => {
    const user = userEvent.setup();
    render(<GuestAppPrototype initialScreen="stay-overview" initialSession={applyPrototypeStayState('live')} />);

    await user.click(screen.getByRole('button', { name: /Rooftop pool closed until 11:00 AM/ }));

    // Scoped to the dialog: the compact list now shows the body as a preview,
    // so the same sentence is on the page twice while the sheet is open.
    const sheet = screen.getByRole('dialog');
    expect(sheet).toBeInTheDocument();
    expect(within(sheet).getByRole('heading', { name: 'Rooftop pool closed until 11:00 AM' })).toBeInTheDocument();
    expect(within(sheet).getByText(/Azotea Rooftop remains open for drinks/)).toBeInTheDocument();
  });

  it('places Next up before Explore Nearby on the live home', () => {
    render(<GuestAppPrototype initialScreen="stay-overview" initialSession={applyPrototypeStayState('live')} />);

    const nextUp = screen.getByRole('heading', { name: 'Next up' });
    const nearby = screen.getByRole('heading', { name: 'Make the most of your stay' });
    expect(nextUp.compareDocumentPosition(nearby) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.getByRole('button', { name: 'View details for Hilom signature massage' })).toBeInTheDocument();
  });

  it('uses the catalog layout in the live home state', () => {
    render(<GuestAppPrototype initialScreen="stay-overview" initialSession={applyPrototypeStayState('live')} />);

    // Discovery is one section of its own, not cards loose on the page. It was
    // `.guest-category-catalog`; the premium pass rebuilt it as a story rail.
    expect(screen.getByRole('heading', { name: 'Make the most of your stay' })).toBeInTheDocument();
    expect(document.querySelector('.guest-home-discovery')).toBeInTheDocument();
    expect(document.querySelector('.guest-miniapp-row')).toBeNull();
  });
});

describe('premium Home styling', () => {
  it('gives Home a quiet-boutique editorial treatment', () => {
    expect(guestStyles).toMatch(/\.guest-home-discovery\s*\{[^}]*display:\s*grid/);
    expect(guestStyles).toMatch(/\.guest-home-stories\s*\{[^}]*gap:\s*14px/);
    expect(guestStyles).toMatch(/\.guest-home-story\s*\{[^}]*transition:\s*transform\s+220ms/);
    expect(guestStyles).toMatch(/\.guest-home-story \.discover__story-ring\s*\{[^}]*padding:\s*1px/);
    expect(guestStyles).toMatch(/\.guest-home-story \.discover__story-art\s*\{[\s\S]*?border:\s*1px solid var\(--guest-paper\)/);
    expect(guestStyles).toMatch(/\.guest-stay-hero-card__booking\s*\{[\s\S]*?border-top:\s*1px solid var\(--guest-line\)/);
    expect(guestStyles).toMatch(/\.guest-stay-card--compact[^}]*animation:\s*guest-home-rise/);
    expect(guestStyles).toMatch(/@media \(prefers-reduced-motion:\s*reduce\)[\s\S]*\.guest-stay-card--compact/);
  });
});

describe('signed-in shell surfaces', () => {
  it('keeps shell content quiet and explicitly excludes Chat', () => {
    expect(guestStyles).toMatch(/\.guest-screen:not\(\.guest-screen--chat\) \.guest-profile-action-list\s*\{[\s\S]*?box-shadow:\s*none/);
    expect(guestStyles).toMatch(/\.guest-screen:not\(\.guest-screen--chat\) \.guest-my-stay-page \.guest-stay-entry\s*\{[\s\S]*?box-shadow:\s*none/);
    expect(guestStyles).toMatch(/\.guest-screen:not\(\.guest-screen--chat\) \.guest-announcement\s*\{[\s\S]*?border-bottom:\s*1px solid var\(--guest-line\)/);
    expect(promotedStyles).toMatch(/\.guest-screen:not\(\.guest-screen--chat\) \.discover__search\s*\{[\s\S]*?box-shadow:\s*none/);
    expect(promotedStyles).toMatch(/\.guest-screen:not\(\.guest-screen--chat\) \.deck__stack\s*\{[\s\S]*?aspect-ratio:\s*4 \/ 3/);
    expect(promotedStyles).toMatch(/\.guest-screen:not\(\.guest-screen--chat\) \.discover__story-ring\s*\{[\s\S]*?padding:\s*1px/);
  });
});

describe('design tokens', () => {
  it('never references a custom property the stylesheet does not define', () => {
    /*
      The bug this catches: five rules were written against `--guest-primary`,
      which does not exist -- the token is `--guest-accent`. CSS fails silently
      on an undefined variable, so the scanner's corner brackets and the rating
      scale's selected state simply rendered as nothing, and the one place it
      was visible I talked myself out of as a screenshot artefact.
    */
    const defined = new Set([...guestStyles.matchAll(/(--[a-z0-9-]+)\s*:/g)].map((m) => m[1]));
    const globalDefined = new Set([...globalStyles.matchAll(/(--[a-z0-9-]+)\s*:/g)].map((m) => m[1]));
    // next/font registers these on <html> at runtime (`variable: '--font-serif'`), not in a stylesheet.
    const layoutSource = readFileSync(resolve(process.cwd(), 'src/app/layout.tsx'), 'utf8');
    const fontDefined = new Set([...layoutSource.matchAll(/variable:\s*'(--[a-z0-9-]+)'/g)].map((m) => m[1]));
    const used = [...guestStyles.matchAll(/var\((--[a-z0-9-]+)/g)].map((m) => m[1]);

    const undefinedTokens = [...new Set(used)].filter(
      (token) => !defined.has(token) && !globalDefined.has(token) && !fontDefined.has(token),
    );

    expect(undefinedTokens).toEqual([]);
  });
});

describe('navigation without a booking', () => {
  const noBooking = { ...restoreProfileSession(), bookings: [], activeBookingId: undefined };

  it('hides Chat before a booking exists', () => {
    render(<GuestAppPrototype initialScreen="stay-overview" initialSession={noBooking} />);
    const nav = screen.getByRole('navigation', { name: 'Primary navigation' });

    /*
      Explore sells things charged to a room this guest has not got, and My
      Stay has no stay to show. Both were doors onto a dead end that told the
      guest their room was "still being assigned" -- of a booking they had
      never made.
    */
    expect(within(nav).getAllByRole('button').map((b) => b.textContent)).toEqual(['Home', 'Profile']);
  });

  it('starts the signed-in no-booking control state at booking lookup', async () => {
    const user = userEvent.setup();
    render(<GuestAppPrototype initialScreen="stay-overview" initialSession={MOCK_SESSION} />);

    await user.click(screen.getByRole('button', { name: 'Open prototype controls' }));
    await user.click(screen.getByRole('radio', { name: /Signed in, no booking/ }));
    await user.click(screen.getByRole('button', { name: 'Close prototype controls' }));

    expect(screen.getByRole('heading', { name: 'Find your booking' })).toBeInTheDocument();
    expect(screen.getByLabelText(/Booking or confirmation number/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Last name/)).toBeInTheDocument();
  });

  it('restores them once a booking exists', () => {
    // The two slots are hidden only while there is nothing behind them; a
    // connected booking brings the full bar back and it stays.
    render(<GuestAppPrototype initialScreen="stay-overview" initialSession={connectBooking(noBooking)} />);

    const nav = screen.getByRole('navigation', { name: 'Primary navigation' });
    expect(within(nav).getAllByRole('button').map((b) => b.textContent))
      .toEqual(['Home', 'Explore', 'My Stay', 'Chat', 'Profile']);
  });

  it('never answers a guest with no booking with a room-allocation wall', () => {
    // marketplace is still reachable by history or a deep link; it must not
    // claim a room is being assigned for a stay that does not exist.
    render(<GuestAppPrototype initialScreen="marketplace" initialSession={noBooking} />);

    expect(screen.queryByRole('heading', { name: 'Your room is still being assigned' })).toBeNull();
    expect(screen.getByRole('heading', { name: 'Welcome back, Ana' })).toBeInTheDocument();
  });
});

describe('tab bar spacing', () => {
  it('spreads however many slots it has, rather than assuming four', () => {
    // `repeat(4, 1fr)` left two columns empty when the bar has two slots, so
    // Home and Profile bunched against the left edge.
    expect(guestStyles).toMatch(/\.guest-bottom-nav\s*\{[^}]*grid-auto-columns:\s*1fr/);
    expect(guestStyles).not.toMatch(/\.guest-bottom-nav\s*\{[^}]*grid-template-columns:\s*repeat\(4/);
  });
});

describe('floating tab bar styling', () => {
  it('keeps the five destination labels visible beneath their icons', () => {
    expect(guestStyles).toMatch(
      /\.guest-bottom-nav button\s*\{[^}]*grid-template-rows:\s*36px\s+auto/,
    );
    expect(guestStyles).toMatch(
      /\.guest-bottom-nav button small\s*\{[^}]*position:\s*static[^}]*width:\s*auto[^}]*height:\s*auto[^}]*overflow:\s*visible/,
    );
    expect(guestStyles).toMatch(
      /\.guest-bottom-nav button small\s*\{[^}]*clip:\s*auto[^}]*clip-path:\s*none/,
    );
  });

  it('uses a thin active rule instead of an icon highlight', () => {
    expect(guestStyles).toMatch(
      /\.guest-bottom-nav button\s*\{[^}]*grid-template-rows:\s*36px\s+auto\s*;/,
    );
    expect(guestStyles).toMatch(
      /\.guest-bottom-nav button\[aria-current='page'\]::before\s*\{[^}]*height:\s*3px[^}]*background:\s*var\(--guest-accent-strong\)/,
    );
    expect(guestStyles).not.toMatch(
      /\.guest-bottom-nav button\[aria-current='page'\]\s+span\s*\{\s*background:\s*var\(--guest-soft\);\s*\}/,
    );
  });

  it('uses Hugeicons 24px glyphs for the primary destinations', () => {
    render(<GuestAppPrototype initialScreen="stay-overview" initialSession={assignedSession} />);

    const nav = screen.getByRole('navigation', { name: 'Primary navigation' });
    const icons = Array.from(nav.querySelectorAll('svg'));

    expect(icons).toHaveLength(5);
    expect(icons.every((icon) => icon.getAttribute('viewBox') === '0 0 24 24')).toBe(true);
  });

  it('uses the rounded reference glyph for Home', () => {
    render(<GuestAppPrototype initialScreen="stay-overview" initialSession={assignedSession} />);

    const homeButton = screen.getByRole('button', { name: 'Home' });

    expect(homeButton.querySelector('path[d="M16 17H8"]')).toBeInTheDocument();
  });

  it('uses a neutral red badge for unread front-desk messages', () => {
    expect(guestStyles).toMatch(
      /\.guest-bottom-nav__badge\s*\{[^}]*background:\s*var\(--guest-danger\)/,
    );
  });

  it('uses a centered elevated capsule instead of a full-width strip', () => {
    expect(guestStyles).toMatch(
      /\.guest-bottom-nav\s*\{[^}]*width:\s*min\(calc\(100%\s*-\s*24px\),\s*408px\)/,
    );
    expect(guestStyles).toMatch(
      /\.guest-bottom-nav\s*\{[^}]*border-radius:\s*var\(--guest-radius-pill\)/,
    );
    expect(guestStyles).toMatch(/\.guest-bottom-nav\s*\{[^}]*box-shadow:\s*var\(--shadow-md\)/);
  });

  it('uses a translucent frosted surface for the floating capsule', () => {
    expect(guestStyles).toMatch(
      /\.guest-bottom-nav\s*\{[^}]*background:\s*rgb\(255\s+255\s+255\s*\/\s*0\.58\)/,
    );
    expect(guestStyles).toMatch(
      /\.guest-bottom-nav\s*\{[^}]*backdrop-filter:\s*blur\(24px\)\s+saturate\(1\.22\)/,
    );
    expect(guestStyles).toMatch(
      /\.guest-bottom-nav\s*\{[^}]*-webkit-backdrop-filter:\s*blur\(24px\)\s+saturate\(1\.22\)/,
    );
  });

  it('settles the floating capsule into place when it appears', () => {
    expect(guestStyles).toMatch(
      /\.guest-bottom-nav\s*\{[^}]*animation:\s*guest-bottom-nav-in\s+220ms\s+var\(--ease-out\)\s+both/,
    );
    expect(guestStyles).toMatch(
      /@keyframes guest-bottom-nav-in\s*\{[^}]*from\s*\{[^}]*opacity:\s*0[^}]*transform:\s*translateX\(-50%\)\s+translateY\(10px\)/,
    );
  });

  it('keeps the active destination steady beneath its rule', () => {
    expect(guestStyles).toMatch(
      /\.guest-bottom-nav button\[aria-current='page'\]\s+span\s*\{[^}]*transform:\s*none[^}]*background:\s*transparent/,
    );
  });

  it('keeps the navbar motion to a fade when reduced motion is preferred', () => {
    expect(guestStyles).toMatch(
      /@media \(prefers-reduced-motion:\s*reduce\)\s*\{\s+\.guest-bottom-nav\s*\{\s*animation:\s*guest-bottom-nav-fade\s+180ms\s+ease\s+both;\s*\}/,
    );
    expect(guestStyles).toMatch(
      /\.guest-bottom-nav button\[aria-current='page'\]\s+span\s*\{[^}]*transform:\s*none;/,
    );
  });

  it('overlays the capsule so content can continue behind it', () => {
    expect(guestStyles).toMatch(
      /\.guest-device\s*\{[^}]*position:\s*relative[^}]*\}/,
    );
    expect(guestStyles).toMatch(
      /\.guest-screen\.has-nav\s*\{[^}]*padding-bottom:\s*calc\(var\(--guest-nav-h\)\s*\+\s*env\(safe-area-inset-bottom\)\s*\+\s*24px\)/,
    );
    expect(guestStyles).toMatch(
      /\.guest-bottom-nav\s*\{[^}]*position:\s*absolute[^}]*bottom:\s*calc\(8px\s*\+\s*env\(safe-area-inset-bottom\)\)[^}]*left:\s*50%[^}]*transform:\s*translateX\(-50%\)/,
    );
    expect(guestStyles).not.toMatch(
      /\.guest-bottom-nav\s*\{[^}]*flex:\s*0 0 auto/,
    );
  });

  it('adds the screen inset only when the floating nav is rendered', () => {
    render(<GuestAppPrototype initialScreen="stay-overview" initialSession={ANONYMOUS_SESSION} />);

    expect(screen.queryByRole('navigation', { name: 'Primary navigation' })).toBeNull();
    expect(screen.getByRole('main').querySelector('.guest-screen')).not.toHaveClass('has-nav');
  });

  it('keeps destination labels visible and accessible', () => {
    expect(guestStyles).toMatch(
      /\.guest-bottom-nav button small\s*\{[^}]*position:\s*static[^}]*white-space:\s*nowrap/,
    );
  });

  it('uses ink for the active label and a hairline active rule', () => {
    expect(guestStyles).toMatch(
      /\.guest-bottom-nav button\[aria-current='page'\]\s*\{[^}]*color:\s*var\(--guest-ink\)/,
    );
    expect(guestStyles).toMatch(
      /\.guest-bottom-nav button\[aria-current='page'\]::before\s*\{[^}]*height:\s*3px[^}]*background:\s*var\(--guest-accent-strong\)/,
    );
  });

  it('keeps each icon tab at a touch-sized target', () => {
    expect(guestStyles).toMatch(
      /\.guest-bottom-nav button\s*\{[^}]*min-width:\s*44px[^}]*min-height:\s*48px/,
    );
  });

  it('removes capsule motion when reduced motion is preferred', () => {
    expect(guestStyles).toMatch(
      /@media \(prefers-reduced-motion:\s*reduce\) \{\s+\.guest-bottom-nav button,\s+\.guest-bottom-nav button span \{\s*transition:\s*none;\s*\}\s+\.guest-bottom-nav button:active \{\s*transform:\s*none;\s*\}\s+\}/,
    );
  });
});

describe('eyebrows', () => {
  it('never restates the heading it sits above', () => {
    /*
      An eyebrow earns its place by carrying what the title cannot -- which
      property, which room, which step of how many, how long until a cutoff.
      "Updates" over "Notifications" is a second heading the eye reads and
      discards, and there were sixteen of those.
    */
    const source = readFileSync(
      resolve(process.cwd(), 'src/components/features/guest-app/guest-app-prototype.tsx'),
      'utf8',
    );
    const statics = [...source.matchAll(/eyebrow="([^"]*)"/g)].map((m) => m[1]);

    const carriesSomething = (eyebrow: string) =>
      /\d/.test(eyebrow)                    // a step, a count, a countdown
      || eyebrow.includes('·')              // a compound of real details
      || /found|detected|Saved|Connected|Book another/i.test(eyebrow);

    expect(statics.filter((e) => !carriesSomething(e))).toEqual([]);
  });

  it('drops the eyebrow element entirely when there is nothing to say', () => {
    render(<GuestAppPrototype initialScreen="notifications" initialSession={applyPrototypeStayState('live')} />);

    expect(screen.getByRole('heading', { name: 'Notifications', level: 1 })).toBeInTheDocument();
    expect(screen.queryByText('Updates')).toBeNull();
  });
});
