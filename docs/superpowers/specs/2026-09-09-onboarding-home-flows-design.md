# Hospitality onboarding and stay-aware home Design

> Produced by `superpowers:brainstorming` (architectural path). Once this
> document is `Approved`, the only next skill is `superpowers:writing-plans`.

| | |
|---|---|
| **Status** | `Implemented` |
| **Created** | 2026-09-09 |
| **Updated** | 2026-09-10 |
| **Owner** | Kenanaiah |
| **Plan** | `docs/superpowers/plans/2026-09-09-onboarding-home-flows.md` (once written) |
| **Supersedes** | `n/a` |
| **Superseded by** | `n/a` |

## Summary

Make the Hospitality guest app start with the confirmed-booking onboarding
journey instead of opening directly on an active stay. After the guest connects
the reservation, the home screen becomes a stay-aware control center that shows
upcoming bookings, active-stay access, service discovery, and front-desk
support. My Stay owns the running bill, room charges, service bookings, and
the detailed folio.

The prototype remains self-contained and uses realistic in-memory data. The
booking experience keeps the product rule explicit: approved on-property
services are charged to the active room folio and settled at the end of the
stay; the app does not collect a card payment when a service is booked.

## Context

The home route in `src/app/(marketing)/page.tsx` renders the interactive
`GuestAppPrototype`. The current prototype already contains entry, pre-arrival,
Stay QR, services, service booking, cancellation, folio, chat, and profile
screens, but it defaults to `stay-overview`, hard-codes one Manila stay, and
does not model the difference between upcoming, active, multiple, empty, and
completed booking states.

The implementation must build on the current Asbir Sans and light Klarna-source
design system in `DESIGN.md`, `src/app/globals.css`, and
`src/components/features/guest-app/guest-app-prototype.css`. The Shangri-La
Circle and Expedia Mobbin references in Product Design context provide the
flow patterns: booking-linked onboarding, a modular home, stay detail, service
discovery, trip or booking grouping, support, and clear confirmation states.

## Non-goals

- Do not build hotel discovery, hotel search, flights, packages, loyalty, or an
  Expedia-style marketplace.
- Do not add real authentication, booking APIs, payment gateways, document
  uploads, or QR validation.
- Do not create separate Next.js routes for each prototype screen. Keep the
  current in-memory screen state model.
- Do not collect card, GCash, Maya, insurance, coupon, or rewards payment for
  an on-property service. A future external booking integration can define its
  own settlement rules.
- Do not redesign the unrelated dashboard or design-system gallery.

## Success criteria

- [ ] A first-time guest opening `/` sees the booking-link or room/Wi-Fi QR
      entry screen, not an active-stay home screen.
- [ ] A guest can complete the connected-booking path: identify a booking,
      confirm its details, create or reuse a profile, complete required
      details, review pre-arrival information, and reach home.
- [ ] A returning guest and a room QR mid-stay guest can bypass unnecessary
      onboarding steps and reach the correct home or active-stay state.
- [ ] The home screen derives its content from mock booking data and renders
      upcoming, active, multiple-upcoming, completed-only, and empty states.
- [ ] Home exposes the necessary next actions: pre-arrival completion, booking
      details, Stay QR, services, front-desk chat, and profile. My Stay exposes
      My bookings, the running bill, and room charges.
- [ ] The service journey ends with `Confirm and charge to room`, identifies
      the active room and guest, and states that the charge is added to the
      folio and settled at checkout.
- [ ] Offline behavior remains explicit: cached stay and QR details remain
      available, chat and pre-arrival edits can queue, and live service
      capacity or price actions are blocked.
- [ ] Native controls, visible labels, named icon actions, focus states, live
      status messaging, and 44px minimum touch targets remain intact.
- [ ] `npm run typecheck`, `npm run lint`, `npm run build`, and `npm test` pass
      with fresh output.

## Approaches considered

### Recommended: State-driven single app shell

Keep `GuestAppPrototype` as the single interactive client surface, but replace
the hard-coded home values with a small typed guest-session model. The
`stay-overview` screen derives its sections from `bookings[]`, the active
booking, service bookings, folio, and connectivity. Existing screens remain
reachable through named transitions.

**Why:** This matches the current prototype architecture, keeps the flow easy
to demonstrate without an API, and lets one home implementation prove all
booking states without duplicating layouts.

**Costs:** The prototype continues to keep state in one client component. A
future production integration will need to move the same contracts behind API
and query boundaries.

### Alternative: Separate route per booking state

Create separate App Router pages for onboarding, upcoming stays, active stays,
and completed stays.

**Rejected because:** It would duplicate navigation and mock-data handling in a
throwaway prototype and would turn screen-state changes into route plumbing.

### Alternative: Keep the hard-coded active home and add only onboarding

Add an entry screen before the existing active-stay home without changing the
home data model.

**Rejected because:** It would not show whether a guest has upcoming bookings,
would make multiple bookings impossible to represent, and would leave the home
as a demo-only state.

## Design

### Architecture

The existing route and client boundary remain unchanged:

```text
src/app/(marketing)/page.tsx
  └── GuestAppPrototype (client)
        ├── onboarding screens
        ├── state-driven stay-overview home
        └── connected Stay / Services / Wallet / Chat / Profile screens
```

`prototype-model.ts` owns typed mock entities and pure derivation helpers.
`guest-app-prototype.tsx` owns the current screen, navigation history, session
mutations, connection state, and rendered transitions. CSS continues to own the
mobile shell and visual states. No HTTP client, API route, query factory, or
server-only module is needed for this prototype.

The first render starts at `entry-hub`. Onboarding screens do not show bottom
navigation. After a booking is connected, the home and its connected surfaces
show the stable Stay, Services, Wallet, and Chat navigation already present in
the prototype.

### Components

**`src/components/features/guest-app/prototype-model.ts`**
- **Does:** Define mock booking/session entities, home-state derivation, and
  existing service and offline rules.
- **Used as:** Export `BookingStatus`, `Booking`, `GuestSession`, `HomeVariant`,
  `MOCK_SESSION`, `getHomeVariant(bookings, activeBookingId?)`, and
  `getPrimaryBooking(bookings, activeBookingId?)`.
- **Depends on:** No React, browser APIs, network, or environment values.

**`src/components/features/guest-app/guest-app-prototype.tsx`**
- **Does:** Render the onboarding journey, state-driven home, and all connected
  service, folio, QR, support, and profile transitions.
- **Used as:** Export `GuestAppPrototype({ initialSession? })`; the optional
  session fixture is for deterministic component tests and defaults to
  `MOCK_SESSION` in the route.
- **Depends on:** Model exports, existing UI primitives, Phosphor icons, and
  service imagery.

**`src/components/features/guest-app/guest-app-prototype.css`**
- **Does:** Style onboarding, booking-state cards, home sections, notices, and
  existing mobile controls within the current light source-aligned system.
- **Used as:** Existing `.guest-*` classes plus focused classes for booking
  status, pre-arrival progress, and empty-state actions.
- **Depends on:** Semantic tokens from `src/app/globals.css` and the existing
  Asbir Sans font stack.

**`src/components/features/guest-app/prototype-model.test.ts`**
- **Does:** Verify pure booking-state and home-state decisions.
- **Used as:** Vitest coverage for empty, completed-only, upcoming, multiple,
  and active booking fixtures.
- **Depends on:** `prototype-model.ts` only.

**`src/components/features/guest-app/guest-app-prototype.test.tsx`**
- **Does:** Verify the user-visible onboarding and home journeys.
- **Used as:** Testing Library coverage for first render, booking connection,
  onboarding completion, state-driven home actions, room-charge confirmation,
  and offline behavior.
- **Depends on:** `GuestAppPrototype`, existing CSS source assertions, and the
  existing test setup.

### Data flow

The first-time path is:

```text
entry-hub
  └── identify
        └── booking-found
              └── create-account or welcome-back
                    └── guest-details
                          └── id-capture when required
                                └── room-preferences
                                      └── additional-guests (optional)
                                            └── repeat-review
                                                  └── prereg-complete
                                                        └── stay-overview
```

The alternate entry paths are:

```text
room-qr-landing ──► room-qr-midstay ──► stay-overview
wifi-landing ─────► identify
lookup-fallback ──► front-desk-assist or no-booking
```

From home, the core service path is:

```text
stay-overview
  └── marketplace
        └── service detail
              └── service-booking
                    └── booking-confirmation
                          └── my-bookings
                                ├── cancellation
                                └── folio
```

The home must carry the selected booking context into each destination. The
service booking summary shows the property, active room, guest, service price,
and `Charge at checkout` before confirmation. The confirmation repeats the
room and folio outcome so the guest never confuses a booking confirmation with
a payment confirmation.

### Interfaces and contracts

The prototype model will use these concrete contracts:

```ts
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

export type GuestSession = {
  guestName: string;
  email: string;
  bookings: Booking[];
  activeBookingId?: string;
  serviceBookings: Array<{
    id: string;
    bookingId: string;
    title: string;
    scheduledFor: string;
    amount: string;
    status: 'confirmed' | 'cancelled' | 'completed';
  }>;
  folioTotal: string;
};

export type HomeVariant =
  | 'active'
  | 'upcoming'
  | 'multiple-upcoming'
  | 'completed'
  | 'empty';

export function getHomeVariant(
  bookings: Booking[],
  activeBookingId?: string,
): HomeVariant;

export function getPrimaryBooking(
  bookings: Booking[],
  activeBookingId?: string,
): Booking | undefined;
```

`getPrimaryBooking` prioritizes a valid `activeBookingId`, then any booking with
`status: 'active'`, then the nearest upcoming booking, then the most recent
completed booking. `getHomeVariant` prioritizes an active booking, then
multiple upcoming, then one upcoming, then completed-only, and finally empty.
Date ordering uses the ISO date values in the mock entities.

The home UI uses these derived contracts:

- `active`: show the active room, Stay QR, service shortcuts, next service,
  room-charge total, and front-desk action.
- `upcoming`: show the next property, dates, room type, pre-arrival progress,
  and the next required action.
- `multiple-upcoming`: show the nearest booking as the focal card and the
  remaining upcoming bookings as compact cards.
- `completed`: show the latest completed stay and a `Connect another stay`
  action.
- `empty`: show `Connect a booking` and the same booking-link entry path.

### Error handling

This is an in-memory prototype, so errors are represented as explicit screens
or notices rather than API error envelopes.

| Failure | Status | `code` | Surfaced as |
|---|---:|---|---|
| Required booking fields are empty | n/a | `validation_error` | Native required-field validation keeps the guest on `identify`. |
| Booking reference does not match | n/a | `booking_not_found` | `lookup-fallback` offers alternate details and front-desk help. |
| Guest has no connected booking | n/a | `no_booking` | `no-booking` says `You’ll need a booking first`, explains that Cabana starts after hotel confirmation, and offers retry or support. |
| Connection is unavailable | n/a | `offline` | Cached stay/QR details remain visible; queued chat and pre-arrival notices explain what has not been sent. |
| Live service capacity or price is unavailable | n/a | `live_data_required` | `booking-blocked` prevents a false reservation and offers reconnection or chat. |
| Service is past its cancellation cutoff | n/a | `front_desk_required` | `cancel-after-cutoff` routes the guest to the front desk and keeps the folio status clear. |

No card or gateway form appears in the on-property service flow. Early
check-in, if retained in the prototype, becomes a request or room-charge
preview and does not use the existing mock payment choices. Travel insurance
belongs to the separate Travel destination. The prototype-only
`arrival-handoff` screen is not part of the connected onboarding path.

### Testing

Model tests must cover:

- active booking priority over upcoming bookings;
- nearest upcoming booking selection;
- multiple-upcoming detection;
- completed-only and empty states;
- stable existing cancellation and offline action rules.

Component tests must cover:

- first render shows booking-linked onboarding without primary navigation;
- booking-link submission reaches booking confirmation;
- onboarding completion reaches the upcoming home state;
- returning-guest and room-QR entry points reach their shortcuts;
- upcoming home exposes pre-arrival progress and booking details;
- active home exposes room context, services, and front-desk actions;
- My Stay exposes the running total, service bookings, and the room-charge
  entry point to the folio;
- empty home returns to booking connection;
- service booking uses `Confirm and charge to room` and no payment method;
- confirmed service appears under My bookings and in the folio context;
- offline state preserves cached stay/QR access and blocks live booking.

## Global Constraints

- Verification gate: `npm run typecheck && npm run lint && npm run build` passes
  with fresh output before any task is claimed complete.
- The architecture invariants in `CLAUDE.md` are binding.
- Stay on the existing `main` checkout and stage only files belonging to this
  feature when committing; preserve unrelated dirty-worktree changes.
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

## Open questions

## Decision Log

| Date | Decision | Why | Cost if wrong |
|---|---|---|---|
| 2026-09-09 | Use booking-link or room/Wi-Fi QR onboarding for first-time guests. | Hospitality begins after a booking and does not need a public booking engine. | A later direct-booking product would need an additional discovery entry flow. |
| 2026-09-09 | Keep one state-driven home screen with derived booking variants. | It models upcoming and active stays without duplicating the shell. | A production API integration will need to preserve these contracts behind a data boundary. |
| 2026-09-09 | Charge approved services to the room folio and settle at checkout. | This is the core Hospitality commerce rule and differentiates the app from Expedia. | External services that require prepayment need an explicit future settlement exception. |
| 2026-09-10 | Keep room charges under My Stay instead of duplicating the folio entry point on Home. | My Stay already owns the running bill and detailed folio; Home stays focused on orientation, service discovery, and next actions. | A new charge may need a notification or other transient signal if it requires immediate attention. |
| 2026-09-09 | Stay on `main` and commit only the spec now. | The user explicitly chose to commit on the current branch. | Unrelated dirty changes must remain unstaged and uncommitted. |

## Before marking this spec In Review

- [x] **Placeholder scan** — no unresolved placeholders or task markers remain.
- [x] **Internal consistency** — the state-driven architecture matches the
      component list, data flow, and tests.
- [x] **Scope check** — onboarding, home state, and their connected service /
      folio paths form one bounded prototype change; discovery and external
      commerce remain non-goals.
- [x] **Ambiguity check** — first-time entry, home state priority, offline
      behavior, and room-charge settlement are explicit.
- [x] **Status block filled** — status, dates, owner, and plan path are set.

Please review this spec before implementation. The next step is to mark it
`Approved`, write the implementation plan, and then execute the plan.
