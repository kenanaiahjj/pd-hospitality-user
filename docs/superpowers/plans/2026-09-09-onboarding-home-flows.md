# Onboarding and stay-aware home flows Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (- [ ]) syntax for tracking.

| | |
|---|---|
| **Status** | Draft |
| **Created** | 2026-09-09 |
| **Updated** | 2026-09-09 |
| **Owner** | Kenanaiah |
| **Branch / worktree** | main — user-directed current checkout; no worktree |
| **Spec** | docs/superpowers/specs/2026-09-09-onboarding-home-flows-design.md |
| **Ledger** | .superpowers/sdd/onboarding-home-flows/progress.md |

**Goal:** Turn the existing Hospitality guest-app prototype into a connected-booking experience with first-time onboarding, state-driven home variants, room-charge service booking, and complete Stay, Services, Wallet, Chat, and Profile journeys.

**Architecture:** Keep the existing App Router entry and single GuestAppPrototype client component. Add typed in-memory booking and guest-session entities plus pure home derivation helpers to prototype-model.ts, then let the component derive its rendered home and mutate the session as the guest connects a stay or books a service. Extend the current Asbir Sans, light Klarna-source visual system in the existing guest-app CSS instead of adding routes, APIs, or a second design system.

**Tech Stack:** Next.js 16 App Router, React 19, strict TypeScript, Vitest, Testing Library, Phosphor icons, and the existing CSS token system.

## Progress

| # | Task | Status | Started | Completed | Commit |
|---|---|---|---|---|---|
| 1 | Add booking and guest-session model | ⬜ Not started | — | — | — |
| 2 | Start and complete booking-linked onboarding | ⬜ Not started | — | — | — |
| 3 | Render all state-driven home variants | ⬜ Not started | — | — | — |
| 4 | Connect room-charge services, bookings, and folio | ⬜ Not started | — | — | — |
| 5 | Polish visual states and accessibility contracts | ⬜ Not started | — | — | — |
| 6 | Run the full verification and preview pass | ⬜ Not started | — | — | — |

Legend: ⬜ Not started · 🔄 In progress · 🔁 Fix round R/5 · ✅ Complete · ⛔ Blocked · ⏭️ Descoped

## Global constraints

These requirements come from the approved spec and apply to every task:

- Verification gate: `npm run typecheck && npm run lint && npm run build` passes
  with fresh output before any task is claimed complete.
- The architecture invariants in `CLAUDE.md` are binding.
- Stay on `main` and stage only files belonging to this feature when committing;
  preserve unrelated dirty-worktree changes.
- Keep the current Next.js App Router route structure and single interactive
  guest-app client component.
- Use the existing Asbir Sans font, 4px spacing base, light Klarna-source
  palette, and `.guest-*` component contracts.
- Start first-time guests at `entry-hub`; hide bottom navigation until the
  booking is connected.
- Use realistic mock stay data, but do not invent a hotel-discovery or card
  payment product.
- Every approved on-property service must identify its booking, active room,
  guest, folio outcome, and checkout settlement timing.
- Keep offline behavior explicit and preserve the existing cached/queued/
  blocked capability rules.

Additional execution constraints:

- Before writing implementation code, locate and read the relevant Next.js
  guide under `node_modules/next/dist/docs/` as required by the repository
  instructions.
- Follow test-driven development for every behavior change: write the focused
  failing test, run it to record the expected red result, implement the
  smallest change, and run the focused test again.
- Use `git add --patch` for files that already contain unrelated user changes.
  Never stage the whole dirty guest-app file or reset unrelated work.
- Run `npm test` in addition to the three-command verification gate before the
  feature is reported complete.

## File structure

No new route or server module is needed.

**Modify**

- `src/components/features/guest-app/prototype-model.ts` — add booking,
  service-booking, guest-session, home-variant types, realistic fixtures, and
  pure booking-selection helpers while preserving existing screen and offline
  exports.
- `src/components/features/guest-app/guest-app-prototype.tsx` — accept
  deterministic session and initial-screen fixtures, begin at `entry-hub`,
  connect onboarding to session state, derive the home, and carry booking
  context through service, folio, QR, support, and profile destinations.
- `src/components/features/guest-app/guest-app-prototype.css` — style
  booking-state cards, pre-arrival progress, empty and completed states,
  folio summaries, room-charge notices, and focus-visible states within the
  existing mobile shell.

**Test**

- `src/components/features/guest-app/prototype-model.test.ts` — cover booking
  priority, home-state derivation, and existing cancellation/offline rules.
- `src/components/features/guest-app/guest-app-prototype.test.tsx` — cover
  first render, connected onboarding, home variants, room QR, services,
  room-charge confirmation, folio continuity, and offline behavior.

**Do not modify**

- `src/app/(marketing)/page.tsx` — it already renders the correct prototype
  boundary.
- Dashboard, design-system gallery, marketing layout, and unrelated dirty
  files in the current checkout.

## Task 1: Add the booking and guest-session model

**Status:** ⬜ Not started · **Started:** — · **Completed:** —

**Files**

- Modify: `src/components/features/guest-app/prototype-model.ts`
- Test: `src/components/features/guest-app/prototype-model.test.ts`

**Interfaces**

- Consumes: the existing `ScreenId`, `Scenario`, `OfflineCapability`,
  `CancellationState`, and `SERVICES` exports.
- Produces: `BookingStatus`, `Booking`, `ServiceBooking`, `GuestSession`,
  `HomeVariant`, `MOCK_SESSION`, `getHomeVariant(bookings, activeBookingId?)`,
  and `getPrimaryBooking(bookings, activeBookingId?)`.

- [ ] **Step 1: Write the failing model tests**

Append a focused describe block to the existing model test file. Keep the
fixture dates ISO-sortable and vary only the fields needed by each assertion.

~~~ts
import {
  Booking,
  getHomeVariant,
  getPrimaryBooking,
} from './prototype-model';

const makeBooking = (
  overrides: Partial<Booking> = {},
): Booking => ({
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
~~~

- [ ] **Step 2: Run the focused test and verify the expected red result**

Run: `npx vitest run src/components/features/guest-app/prototype-model.test.ts`

Expected: FAIL because the new booking types and derivation exports do not yet
exist.

- [ ] **Step 3: Add the typed entities, fixture, and pure helpers**

Add the following contracts without removing any existing exports:

~~~ts
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
  stayQrAvailable: boolean;
};

export type ServiceBooking = {
  id: string;
  bookingId: string;
  title: string;
  scheduledFor: string;
  amount: string;
  status: 'confirmed' | 'cancelled' | 'completed';
};

export type GuestSession = {
  guestName: string;
  email: string;
  bookings: Booking[];
  activeBookingId?: string;
  serviceBookings: ServiceBooking[];
  folioTotal: string;
};

export type HomeVariant =
  | 'active'
  | 'upcoming'
  | 'multiple-upcoming'
  | 'completed'
  | 'empty';
~~~

Implement `getPrimaryBooking` with this exact priority: a valid
`activeBookingId`, any active booking, the nearest upcoming check-in, and the
most recent completed check-in. Implement `getHomeVariant` with this priority:
active, multiple upcoming, one upcoming, completed-only, and empty. Use
`localeCompare` on the ISO date strings so the helpers remain deterministic
without a date library.

Set `MOCK_SESSION` to a realistic returning-guest fixture with one upcoming
Manila booking, one completed Cebu booking, and no service bookings. The
upcoming Manila booking must have a partial pre-arrival count and no room
number; the active-state tests will provide a fixture with room 304 and a
folio total.

- [ ] **Step 4: Run the focused test and the existing model coverage**

Run: `npx vitest run src/components/features/guest-app/prototype-model.test.ts`

Expected: PASS for the new booking cases and every existing model test.

- [ ] **Step 5: Run the type and lint checks**

Run: `npm run typecheck && npm run lint`

Expected: exit code 0. Resolve only errors caused by the new model exports.

- [ ] **Step 6: Commit the model deliverable**

Stage only the model file and its test hunks. Preserve any unrelated changes
already present in either file.

~~~bash
git add --patch src/components/features/guest-app/prototype-model.ts
git add --patch src/components/features/guest-app/prototype-model.test.ts
git diff --cached --check
git commit -m "feat: add booking-aware guest session model"
~~~

## Task 2: Start and complete booking-linked onboarding

**Status:** ⬜ Not started · **Started:** — · **Completed:** —

**Files**

- Modify: `src/components/features/guest-app/guest-app-prototype.tsx`
- Test: `src/components/features/guest-app/guest-app-prototype.test.tsx`

**Interfaces**

- Consumes: `GuestSession`, `MOCK_SESSION`, `Booking`, and the existing
  `ScreenId` transitions.
- Produces: `GuestAppPrototype({ initialSession?, initialScreen? })`, where
  `initialScreen` is a deterministic test fixture and the route default is
  `entry-hub`.

- [ ] **Step 1: Read the repository’s current Next.js guide**

Run: `rg -l "use client|Client Components|App Router" node_modules/next/dist/docs | head -20`

Read the relevant returned guide before editing the client component. Apply its
current client-component and event-handler rules to the implementation.

- [ ] **Step 2: Write failing component tests for entry and connection**

Add tests that assert the visible labels and navigation contract. Use
`initialScreen="entry-hub"` only where a test needs to reset explicitly.

~~~tsx
it('starts first-time guests at booking-linked onboarding without primary navigation', () => {
  render(<GuestAppPrototype />);

  expect(
    screen.getByRole('heading', { name: /bring your stay with you/i }),
  ).toBeInTheDocument();
  expect(
    screen.getByRole('button', { name: /open confirmation link/i }),
  ).toBeInTheDocument();
  expect(screen.queryByRole('navigation', { name: /primary navigation/i })).toBeNull();
});

it('connects a booking and reaches the matched-stay confirmation', async () => {
  const user = userEvent.setup();
  render(<GuestAppPrototype />);

  await user.click(screen.getByRole('button', { name: /open confirmation link/i }));
  await user.type(
    screen.getByLabelText(/booking or confirmation number/i),
    'HEN-241109',
  );
  await user.type(screen.getByLabelText(/^last name$/i), 'Santos');
  await user.click(screen.getByRole('button', { name: /find booking/i }));

  expect(
    await screen.findByRole('heading', { name: /is this your stay/i }),
  ).toBeInTheDocument();
  expect(screen.getByText(/the henry manila/i)).toBeInTheDocument();
  expect(screen.getByText(/booking hen-241109/i)).toBeInTheDocument();
});
~~~

- [ ] **Step 3: Run the focused component tests and verify the expected red result**

Run: `npx vitest run src/components/features/guest-app/guest-app-prototype.test.tsx`

Expected: FAIL because the default screen is currently `stay-overview`, the
entry heading does not match the onboarding contract, and the component does
not yet accept the fixture props.

- [ ] **Step 4: Move the default to entry-hub and make onboarding session-aware**

Change the component signature to accept the optional fixtures and initialize
the session from `initialSession ?? MOCK_SESSION`. Initialize the screen from
`initialScreen ?? 'entry-hub'`. Keep the current history-based `go` and `back`
behavior, but use `entry-hub` as the fallback when no previous screen exists.

Keep bottom navigation hidden for all onboarding screens. Preserve these
entry paths and their named actions:

- Booking email or confirmation link goes to `identify`.
- Hotel Wi-Fi goes to `wifi-landing`, then `identify`.
- Room QR goes through `room-qr-landing` and `room-qr-midstay`, then active
  stay home.
- Lookup fallback keeps `lookup-fallback`, `front-desk-assist`, and
  `no-booking` reachable.
- Returning guest keeps `welcome-back` available and bypasses new profile
  creation.

Replace the hard-coded `StayCard` values with the connected booking fixture,
but keep the existing booking-found copy and source labels. On successful
`prereg-complete`, set the connected booking as active only when the fixture
represents arrival; otherwise return to the derived upcoming home. Keep
`prereg-queued` as the offline completion result.

- [ ] **Step 5: Run the focused component tests and the onboarding journey**

Run: `npx vitest run src/components/features/guest-app/guest-app-prototype.test.tsx`

Expected: PASS for first render and booking connection, plus all existing
stable navigation tests. Confirm the completed path reaches a home screen with
primary navigation and that every onboarding screen remains free of bottom
navigation.

- [ ] **Step 6: Commit the onboarding deliverable**

Stage only the onboarding-related hunks in the component and its test.

~~~bash
git add --patch src/components/features/guest-app/guest-app-prototype.tsx
git add --patch src/components/features/guest-app/guest-app-prototype.test.tsx
git diff --cached --check
git commit -m "feat: start guest app with booking onboarding"
~~~

## Task 3: Render every state-driven home variant

**Status:** ⬜ Not started · **Started:** — · **Completed:** —

**Files**

- Modify: `src/components/features/guest-app/guest-app-prototype.tsx`
- Test: `src/components/features/guest-app/guest-app-prototype.test.tsx`
- Modify: `src/components/features/guest-app/prototype-model.ts` only if a
  fixture adjustment is required by the tests

**Interfaces**

- Consumes: `GuestSession`, `Booking`, `HomeVariant`,
  `getHomeVariant`, and `getPrimaryBooking`.
- Produces: rendered active, upcoming, multiple-upcoming, completed-only, and
  empty home variants with booking context carried to each action.

- [ ] **Step 1: Write failing home-state component tests**

Add fixture helpers that create complete `GuestSession` values, then render the
same component with different sessions and `initialScreen="stay-overview"`.

~~~tsx
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

it.each([
  ['upcoming', [makeBooking({ status: 'upcoming' })]],
  [
    'multiple-upcoming',
    [
      makeBooking({ id: 'near', checkIn: '2026-10-01' }),
      makeBooking({ id: 'far', checkIn: '2026-12-01' }),
    ],
  ],
  [
    'completed',
    [makeBooking({ status: 'completed', checkIn: '2026-05-01' })],
  ],
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
~~~

- [ ] **Step 2: Run the focused tests and verify the expected red result**

Run: `npx vitest run src/components/features/guest-app/guest-app-prototype.test.tsx`

Expected: FAIL because the current home is a single hard-coded active Manila
layout and does not expose variant test identifiers or derived booking content.

- [ ] **Step 3: Implement the five home render branches**

Compute `homeVariant` and `primaryBooking` from the current session on every
render. Keep one `stay-overview` screen and branch its content into these
small render functions:

- `ActiveStayHome`: greet the guest, show property and active room, Stay QR,
  service shortcuts, next service, room-charge total, and front-desk action.
- `UpcomingStayHome`: show property, city, check-in and check-out, room type,
  pre-arrival progress, the next required step, booking details, and a
  `Complete pre-arrival` action when progress is incomplete.
- `UpcomingStaysHome`: use the nearest upcoming booking as the focal card and
  render remaining upcoming bookings as compact cards with `View booking`
  actions.
- `CompletedStayHome`: show the latest completed stay, its dates and room
  type, and `Connect another stay`.
- `EmptyHome`: explain that a connected booking is required and provide
  `Connect a booking`, which returns to `entry-hub`.

Use `data-testid` values `guest-home-active`, `guest-home-upcoming`,
`guest-home-multiple-upcoming`, `guest-home-completed`, and
`guest-home-empty` only for deterministic tests. Use buttons and headings with
visible labels for the real interface. Keep profile reachable from every home
variant.

Update `wallet`, `folio`, `chat`, `my-bookings`, and booking details to read
the current primary booking and guest session rather than hard-coded Room 304
or a single property. If an upcoming booking has no room number, say that the
room is assigned at arrival instead of showing a fabricated room.

- [ ] **Step 4: Run the focused home tests and existing component coverage**

Run: `npx vitest run src/components/features/guest-app/guest-app-prototype.test.tsx`

Expected: PASS for all five home variants, active actions, upcoming progress,
and the existing Stay, Services, Wallet, Chat, QR, imagery, and token tests.

- [ ] **Step 5: Run typecheck and lint**

Run: `npm run typecheck && npm run lint`

Expected: exit code 0 with no new lint diagnostics.

- [ ] **Step 6: Commit the home deliverable**

Stage only the home-state hunks in the component, model fixture, and tests.

~~~bash
git add --patch src/components/features/guest-app/guest-app-prototype.tsx
git add --patch src/components/features/guest-app/prototype-model.ts
git add --patch src/components/features/guest-app/guest-app-prototype.test.tsx
git diff --cached --check
git commit -m "feat: add stay-aware home states"
~~~

## Task 4: Connect room-charge services, bookings, and folio

**Status:** ⬜ Not started · **Started:** — · **Completed:** —

**Files**

- Modify: `src/components/features/guest-app/guest-app-prototype.tsx`
- Test: `src/components/features/guest-app/guest-app-prototype.test.tsx`

**Interfaces**

- Consumes: the active booking from `getPrimaryBooking`, `GuestSession`,
  `ServiceBooking`, and existing offline/cancellation helpers.
- Produces: a service confirmation mutation that appends a confirmed service,
  updates the folio total display, and preserves cancellation status.

- [ ] **Step 1: Write failing room-charge and early-arrival tests**

Use an active Room 304 fixture and start at `marketplace` or
`service-booking` so the tests remain focused.

~~~tsx
it('shows room settlement and confirms a service without a payment method', async () => {
  const user = userEvent.setup();
  const active = makeBooking({
    id: 'active',
    status: 'active',
    roomNumber: '304',
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

  expect(screen.getByText(/room 304/i)).toBeInTheDocument();
  expect(screen.getByText(/charge at checkout/i)).toBeInTheDocument();
  expect(screen.queryByText(/gcash|maya|card/i)).toBeNull();

  await user.click(
    screen.getByRole('button', { name: /confirm and charge to room/i }),
  );

  expect(
    await screen.findByRole('heading', { name: /your massage is booked/i }),
  ).toBeInTheDocument();
  expect(screen.getByText(/added to room 304/i)).toBeInTheDocument();
  expect(screen.getByText(/hotel folio at checkout/i)).toBeInTheDocument();
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
~~~

- [ ] **Step 2: Run the focused tests and verify the expected red result**

Run: `npx vitest run src/components/features/guest-app/guest-app-prototype.test.tsx`

Expected: FAIL because the current early check-in screen renders gateway
choices, the service confirmation does not mutate the session, and the
booking list remains hard-coded.

- [ ] **Step 3: Implement the session mutation and room-charge copy**

Add a `confirmService` callback in the component that:

1. Reads the active booking and refuses to confirm when no active room exists.
2. Creates a `ServiceBooking` with a stable prototype id, the active booking
   id, the selected service title, scheduled time, amount, and `confirmed`
   status.
3. Appends the service to `session.serviceBookings`.
4. Keeps the folio display explicit by updating `session.folioTotal` to the
   fixture’s post-booking total.
5. Navigates to `booking-confirmation`.

Render the service summary with the property, active room, guest, service
amount, `Charge at checkout`, and `Total added to folio`. Render confirmation
with the same room and folio settlement statement. Render `my-bookings` from
the session array, including confirmed, cancelled, and completed sections.
Render `folio` with the active booking property, room, current total, and each
confirmed service line.

Replace `GatewayChoices` in `early-check-in` with a room-charge preview and
`Request early check-in` action. Route the request to `prereg-complete` or an
equivalent queued state that says the front desk will confirm availability.
Remove the insurance screen from the connected onboarding path; leave no
insurance, GCash, Maya, or card payment labels in the Hospitality flow.

Preserve the existing offline behavior: cached services may be viewed, but
live capacity, live price, and live booking confirmation go to
`booking-blocked`; chat remains the recovery path.

- [ ] **Step 4: Run service, cancellation, folio, and offline tests**

Run: `npx vitest run src/components/features/guest-app/guest-app-prototype.test.tsx src/components/features/guest-app/prototype-model.test.ts`

Expected: PASS for room-charge confirmation, session-backed My bookings and
folio, cancellation status, `booking-blocked`, cached QR access, and queued
pre-arrival/chat behavior.

- [ ] **Step 5: Commit the service and folio deliverable**

Stage only service, early-arrival, folio, booking-list, and related test hunks.

~~~bash
git add --patch src/components/features/guest-app/guest-app-prototype.tsx
git add --patch src/components/features/guest-app/guest-app-prototype.test.tsx
git diff --cached --check
git commit -m "feat: keep on-property services on the room folio"
~~~

## Task 5: Polish visual states and accessibility contracts

**Status:** ⬜ Not started · **Started:** — · **Completed:** —

**Files**

- Modify: `src/components/features/guest-app/guest-app-prototype.css`
- Modify: `src/components/features/guest-app/guest-app-prototype.tsx`
- Test: `src/components/features/guest-app/guest-app-prototype.test.tsx`

**Interfaces**

- Consumes: the current `.guest-*` CSS contracts, existing light palette, and
  semantic UI primitives.
- Produces: a consistent responsive presentation for every home variant and
  accessible controls for booking, room, service, folio, QR, chat, and profile
  actions.

- [ ] **Step 1: Write focused accessibility and CSS contract tests**

Add assertions for named navigation, named icon actions, visible active state,
and the new class names. Keep the current source-token assertions intact.

~~~tsx
it('labels the booking state and profile action for assistive technology', () => {
  const active = makeBooking({
    id: 'active',
    status: 'active',
    roomNumber: '304',
    stayQrAvailable: true,
  });
  render(
    <GuestAppPrototype
      initialScreen="stay-overview"
      initialSession={sessionFor([active], { activeBookingId: 'active' })}
    />,
  );

  expect(screen.getByRole('navigation', { name: /primary navigation/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /open profile/i })).toBeInTheDocument();
  expect(screen.getByTestId('guest-home-active')).toHaveClass('guest-home-booking');
});
~~~

- [ ] **Step 2: Run the focused test and verify the expected red result**

Run: `npx vitest run src/components/features/guest-app/guest-app-prototype.test.tsx`

Expected: FAIL only for the new booking-state class assertion if the
component wiring is complete; otherwise fix the specific missing semantic
label before changing CSS.

- [ ] **Step 3: Add the visual states and interaction contracts**

Add styles for `.guest-home-booking`, `.guest-home-booking--primary`,
`.guest-home-progress`, `.guest-home-empty`, compact upcoming cards, room
charge summaries, and inline status notices. Use existing semantic tokens,
the 4px spacing base, the Asbir Sans stack, and the current lilac, white, and
black palette. Do not add gradients, a marketing hero, or new brand colors.

Complete the interface-design checkpoint while styling:

1. Intent: make the home an arrival and stay control center, not a hotel
   discovery landing page.
2. Hierarchy: property and dates first, the next required action second, then
   Stay QR or service and folio actions.
3. Palette: retain lilac as the app canvas, white as the primary surface, and
   black as the high-contrast action color; use existing semantic status colors.
4. Depth: use the current border, radius, and shadow language; reserve strong
   contrast for primary actions and active-stay identity.
5. Typography and spacing: keep the existing Asbir Sans scale and 4px
   increments; prevent dense booking cards from collapsing on small screens.

Ensure every icon-only action has an accessible name, every form field keeps a
visible label, buttons retain visible focus styles, status changes use the
existing live-message pattern, and interactive targets remain at least 44px.
Honor reduced-motion preferences already established by the stylesheet.

- [ ] **Step 4: Run component tests and inspect responsive output**

Run: `npx vitest run src/components/features/guest-app/guest-app-prototype.test.tsx`

Expected: PASS with no regressions in existing token, imagery, navigation, and
status assertions. Use the local preview at 390 by 844 and a desktop width to
check that cards, bottom navigation, and action rows stay contained.

- [ ] **Step 5: Commit the visual and accessibility deliverable**

Stage only the new state styles and accessibility-related component/test
hunks.

~~~bash
git add --patch src/components/features/guest-app/guest-app-prototype.css
git add --patch src/components/features/guest-app/guest-app-prototype.tsx
git add --patch src/components/features/guest-app/guest-app-prototype.test.tsx
git diff --cached --check
git commit -m "refine: polish booking state accessibility"
~~~

## Task 6: Run the full verification and preview pass

**Status:** ⬜ Not started · **Started:** — · **Completed:** —

**Files**

- Inspect all feature diffs and the preserved dirty-worktree status.
- Update this plan’s Progress table and Decision Log as execution completes.

- [ ] **Step 1: Inspect the final feature diff**

Run:

~~~bash
git status --short
git diff --check
git diff --stat
git diff -- src/components/features/guest-app/prototype-model.ts
git diff -- src/components/features/guest-app/guest-app-prototype.tsx
git diff -- src/components/features/guest-app/guest-app-prototype.css
~~~

Expected: only intended feature changes are in the feature commits, the
previous unrelated dirty files remain uncommitted, and no whitespace errors
appear.

- [ ] **Step 2: Run the required verification gate with fresh output**

Run:

~~~bash
npm run typecheck && npm run lint && npm run build && npm test
~~~

Expected: all four commands exit with code 0. Record any pre-existing browser
console warnings separately from test failures; do not call a build a
substitute for the browser journey.

- [ ] **Step 3: Verify the five user journeys in the local preview**

Start the local server with `npm run dev` and open the preview in the selected
Chrome session. Exercise these journeys at a mobile viewport and once at
desktop width:

1. New guest: entry-hub, booking email, matched booking, account, details,
   review, pre-arrival completion, upcoming home.
2. Returning guest: welcome-back, existing profile, upcoming or active home.
3. Room QR: room QR landing, last-name link, active home, offline Stay QR.
4. Active service: Services, service detail, time selection, room/guest
   summary, `Confirm and charge to room`, My bookings, folio.
5. No-booking and offline recovery: failed lookup, front-desk help, empty
   home, cached state, blocked live service, chat recovery.

Expected: every named action reaches a real screen, no onboarding state shows
primary navigation before connection, no service state asks for a payment
method, and active booking data remains consistent across home, QR, service,
My bookings, and folio.

- [ ] **Step 4: Update the plan ledger and completion status**

Create or update `.superpowers/sdd/onboarding-home-flows/progress.md` with one
line per task containing the task number, focused test command, verification
result, and commit hash. Update this plan’s Progress table, set Status to
Complete only after the full gate and browser journeys pass, and append any
new decisions to the Decision Log.

- [ ] **Step 5: Commit the final execution record**

Stage only the plan ledger and this plan’s progress/status edits. Leave all
unrelated dirty-worktree files unstaged.

~~~bash
git add -- .superpowers/sdd/onboarding-home-flows/progress.md docs/superpowers/plans/2026-09-09-onboarding-home-flows.md
git diff --cached --check
git commit -m "docs: record onboarding and home flow verification"
~~~

## Decision Log

| Date | Decision | Why | Cost if wrong |
|---|---|---|---|
| 2026-09-09 | Use booking-link or room/Wi-Fi QR onboarding for first-time guests. | Hospitality begins after a hotel booking and does not need a public booking engine. | A later direct-booking product would need an additional discovery entry flow. |
| 2026-09-09 | Keep one state-driven home screen with derived booking variants. | It models upcoming and active stays without duplicating the shell. | A production API integration will need to preserve these contracts behind a data boundary. |
| 2026-09-09 | Charge approved services to the room folio and settle at checkout. | This is the core Hospitality commerce rule and differentiates the app from Expedia. | External services that require prepayment need an explicit future settlement exception. |
| 2026-09-09 | Stay on `main` and commit only feature files. | The user explicitly chose the current branch and asked to preserve the existing checkout context. | Unrelated dirty changes must remain unstaged and uncommitted. |
| 2026-09-09 | Add `initialScreen` alongside the approved `initialSession` fixture. | Component tests need to exercise onboarding, home variants, and service states without changing the route default. | The prop must remain test-only in usage; the production route uses defaults. |

## Before marking this plan Approved

- [x] Spec coverage — every approved requirement maps to Tasks 1 through 6.
- [x] Placeholder scan — the plan contains concrete paths, commands, tests,
      interfaces, and implementation actions.
- [x] Type consistency — model exports are listed before the component tasks
      that consume them, with exact names and signatures.
- [x] Right-sized tasks — each task ends with focused tests, verification, and
      an explicit commit boundary.
- [x] Status block filled — status, dates, owner, branch, spec, and ledger are
      set.

Plan complete and saved to docs/superpowers/plans/2026-09-09-onboarding-home-flows.md.

Two execution options:

1. Subagent-Driven (recommended) — dispatch a fresh subagent per task and
   review each task before continuing.
2. Inline Execution — execute the tasks in this session using the executing
   plans workflow.

Which approach?
