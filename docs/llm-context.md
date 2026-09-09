# Hospitality guest app context

> This file is the handoff context for another LLM working in this repository.
> Use the current source code as the authority when this document and the
> implementation disagree.

Last verified: 2026-09-09
Base implementation commit: `0eac181` on `main`; later uncommitted guest-app
refinements are present in the working tree
Local preview: `http://localhost:3001/`

## Product definition

Hospitality is a guest companion for people who already have a hotel booking.
It starts when a guest opens a booking link, scans a room QR code, or connects
through hotel Wi-Fi. It is not a hotel-discovery, hotel-search, flights,
packages, or rewards product.

The core commerce rule is non-negotiable:

- Approved on-property services are added to the active room folio.
- The guest pays the hotel at the end of the stay.
- The service flow must not ask for a card, GCash, Maya, insurance, coupon,
  rewards, or another payment method.
- Confirmation must identify the property, guest, room, service, amount, and
  `Charge at checkout` settlement timing.

The prototype is intentionally self-contained. It uses typed in-memory data,
local screen state, realistic mock content, and no real authentication,
booking API, payment gateway, document upload, or QR validation.

## Reference context

The user supplied these Mobbin references as flow and interaction context:

- [Shangri-La Circle iOS UI elements](https://mobbin.com/apps/shangri-la-circle-ios-fcf8602c-4b77-4871-8d1a-b196647b013e/f6706627-77ff-45c0-8ee8-03c8825cf315/ui-elements)
- [Expedia iOS screens](https://mobbin.com/apps/expedia-ios-d74936eb-9c7c-47e3-b9dc-e4905935bf46/ad35c0d0-588e-405a-ab54-6c001117b4ed/screens)

Use the references for patterns, not for adding unrelated product scope:

- Shangri-La informed the stay-first relationship between the guest, the
  property, the room, on-property services, and a folio settled later.
- Expedia informed booking-centric entry, clear reservation context, modular
  trip or booking cards, grouped actions, and explicit confirmation states.
- The Hospitality adaptation keeps the guest inside an existing stay. It does
  not add a public booking engine or Expedia-style hotel marketplace.

## Non-negotiable UX rules

- First render at `/` is `entry-hub`, not an active-stay home.
- Entry offers booking confirmation, room QR, and hotel Wi-Fi paths.
- Bottom navigation is hidden during onboarding and appears only after a
  booking is connected.
- A connected guest can reach Stay, Services, Wallet, Chat, and Profile.
- Home content is derived from booking state. Do not hard-code one active
  Manila stay into every branch.
- An upcoming booking can show a room type and `Assigned at arrival`; do not
  fabricate a room number before arrival.
- An active booking can show its room, Stay QR, services, room charges, and
  front-desk support.
- Services are on-property only. Live availability and price are required
  before a service can be confirmed.
- A service confirmation is a reservation and a folio mutation, not a payment
  confirmation.
- Offline behavior must remain explicit. Cached stay and QR details can be
  viewed; chat and pre-arrival edits can queue; live service capacity and
  booking confirmation are blocked.
- Preserve the current Asbir Sans, light Klarna-source visual language and
  existing `.guest-*` component contracts.

## Current user journeys

### First-time guest: booking-linked onboarding

```text
entry-hub
  -> identify
  -> booking-found
  -> create-account or welcome-back
  -> guest-details
  -> id-capture
  -> room-preferences
  -> additional-guests
  -> early-check-in
  -> prereg-complete or prereg-queued
  -> stay-overview
```

The root screen uses these visible entry actions:

- `Open confirmation link` / `Booking email` goes to `identify`.
- `Simulate Room QR` goes to `room-qr-landing`.
- `Open hotel Wi-Fi entry` goes to `wifi-landing`.

The booking lookup accepts a booking or confirmation number and last name.
The current fixture path uses `HEN-241109` and `Santos`, then shows `The Henry
Manila`. The lookup fallback offers alternate stay details and front-desk
help. `no-booking` explains that a confirmed booking is required.

Pre-arrival collects profile details, ID or passport details, room
preferences, and additional guest names. Early check-in is a room-folio
request: the hotel confirms availability first, then an approved `₱1,500`
charge settles at checkout. It never opens a payment form.

When pre-arrival is complete for an upcoming booking, the primary action is
`View my stay`, which returns to the upcoming home. It must not show an active
Stay QR before the room is activated. If the booking is already active, the
primary action can open `Your Stay QR`.

### Returning guest

`welcome-back` shows the recognized guest, the new booking, and saved details.
`Review saved details` goes to `repeat-review`, where the guest can confirm
the profile, room preferences, and additional guest before returning to the
stay flow.

### Room QR arrival

```text
entry-hub -> room-qr-landing -> Link my stay -> room-qr-midstay -> stay-overview
```

The room QR path links the active booking, or the nearest upcoming booking if
there is no active booking. The current prototype fixture uses Room 304. The
linking mutation marks the booking `active`, enables `stayQrAvailable`, and
initializes the room folio at `₱3,050` when needed.

### Active stay services

```text
stay-overview
  -> marketplace
  -> vendor-service or hotel-service
  -> service-booking
  -> booking-confirmation
  -> my-bookings
  -> folio
```

The primary demo service is `Hilom signature massage`:

- Property: the current active booking property.
- Guest: the current session guest.
- Room: the current active room, such as `Room 304`.
- Time: `Tuesday · November 11 · 1:30 PM`.
- Amount: `₱2,400`.
- CTA: `Confirm and charge to room`.
- Result: a confirmed `ServiceBooking` is appended and the session folio
  becomes `₱5,450`.

The confirmation repeats that the charge was added to the room and settles
with the hotel folio at checkout. `My bookings` shows the confirmed service
and its property, room, and settlement context. `Room charges` shows the
service as a folio line.

### Cancellation and support

- Before the service cutoff, `cancel-before-cutoff` allows self-service
  cancellation and removes the provisional folio line.
- After the cutoff, `cancel-after-cutoff` routes the guest to the front desk.
- Chat is the recovery path for blocked booking, late cancellation, offline
  requests, towels, housekeeping, transfers, and late checkout.

## Home state model

`prototype-model.ts` derives one `stay-overview` shell into five variants:

| Variant | When it appears | Main content and actions |
|---|---|---|
| `active` | Any active booking exists or is selected | Property, dates, room, Stay QR, stay services, next service, room charges, My bookings, front desk |
| `upcoming` | Exactly one upcoming booking and no active booking | Property, dates, room type, pre-arrival progress, next required step, booking details |
| `multiple-upcoming` | More than one upcoming booking and no active booking | Nearest arrival as the focal card, remaining upcoming bookings as compact cards |
| `completed` | No active/upcoming booking, but a completed booking exists | Latest completed stay, settled-charge notice, connect another stay, stay history |
| `empty` | No bookings | Connect a booking and front-desk help |

Selection priority is important:

1. `getPrimaryBooking` uses a valid `activeBookingId`.
2. Otherwise it uses any booking with `status: 'active'`.
3. Otherwise it uses the nearest upcoming booking by ISO `checkIn` date.
4. Otherwise it uses the latest completed booking.

`getHomeVariant` prioritizes `active`, then `multiple-upcoming`, then
`upcoming`, then `completed`, then `empty`.

## Data model

The main contracts in `src/components/features/guest-app/prototype-model.ts`
are:

```ts
type BookingStatus = 'upcoming' | 'active' | 'completed';

type Booking = {
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

type ServiceBooking = {
  id: string;
  bookingId: string;
  title: string;
  scheduledFor: string;
  amount: string;
  status: 'confirmed' | 'cancelled' | 'completed';
};

type GuestSession = {
  guestName: string;
  email: string;
  bookings: Booking[];
  activeBookingId?: string;
  serviceBookings: ServiceBooking[];
  folioTotal: string;
};
```

`MOCK_SESSION` currently contains:

- Guest: `Ana Santos`, `ana@example.com`.
- Upcoming booking: `HEN-241109`, The Henry Manila, November 9–12, 2026,
  King room, Agoda, two of five pre-arrival steps complete.
- Completed booking: `HEN-CEBU-240615`, The Henry Cebu, June 15–18, 2026,
  Garden suite, Room 208, Direct booking.
- Service bookings: none initially.
- Session folio: `₱0`; an active room QR path initializes the active room at
  `₱3,050`.

Component tests can supply `initialSession` and `initialScreen` to exercise a
deterministic branch without changing the production route default.

## Architecture and file map

Keep the existing App Router entry and single client component. Do not add a
route per prototype screen.

- `src/app/(marketing)/page.tsx` — root route that renders the guest prototype.
- `src/components/features/guest-app/prototype-model.ts` — pure types,
  fixtures, booking selection, home derivation, scenarios, cancellation, and
  offline rules. No React, browser APIs, or network calls.
- `src/components/features/guest-app/guest-app-prototype.tsx` — screen state,
  navigation history, connectivity state, session mutations, and rendering
  for entry, onboarding, Home, Stay, Services, Wallet, Chat, and Profile.
- `src/components/features/guest-app/guest-app-prototype.css` — existing
  mobile shell and the booking-state, progress, folio, notice, focus, and
  reduced-motion styles.
- `src/components/features/guest-app/service-images.ts` — current service
  imagery sources and focal points, with runtime image-error fallback in the
  component.
- `src/components/features/guest-app/prototype-model.test.ts` — pure model and
  offline/cancellation tests.
- `src/components/features/guest-app/guest-app-prototype.test.tsx` — visible
  flow, home state, room QR, service, folio, accessibility, imagery, and CSS
  contract tests.
- `src/app/(marketing)/page.test.tsx` — root-route regression test ensuring
  onboarding is the first render and primary navigation is hidden.
- `docs/superpowers/specs/2026-09-09-onboarding-home-flows-design.md` —
  approved design specification.
- `docs/superpowers/plans/2026-09-09-onboarding-home-flows.md` — completed
  inline execution plan.
- `.superpowers/sdd/onboarding-home-flows/progress.md` — focused verification
  ledger.

## Visual and interaction language

The current guest app uses:

- Asbir Sans and the existing light Klarna-source visual system.
- A lilac and pink canvas with white layered surfaces and black action color.
- Existing Phosphor icon primitives and `.guest-*` class contracts.
- A 4px spacing base, restrained borders, soft depth, and a calm arrival
  companion rather than a discovery feed.
- State-specific booking cards: the same card pattern changes meaning for
  active, upcoming, multiple-upcoming, completed, and empty states.
- Semantic labels, named icon buttons, visible `:focus-visible` styles,
  live status messaging, 44px minimum interactive targets, responsive card
  containment, and reduced-motion handling.

Do not replace the existing visual system with a generic travel landing page,
new icon set, new route structure, or card-payment checkout.

## Offline behavior

`getOfflineAction` is the source of truth for capability behavior:

| Capability | Offline result | UI expectation |
|---|---|---|
| `wallet` / `cached-stay` | `available` | Show cached Stay QR and stay details |
| `chat` / `pre-registration` / `preferences` | `queued` | Keep edits or messages on device and explain delivery status |
| `service-booking` / `payment` / `live-rates` | `blocked` | Do not reserve or imply current price/capacity; offer reconnection or chat |

`wallet-offline` can display the cached QR, itinerary, booking details,
last-known folio, and chat history. It must explain that the QR is for
identity and does not authorize charges or unlock the room.

## Verification and local development

Start the local preview with:

```bash
npm run dev
```

The last verified preview used port `3001` because another local process held
port `3000`. Check the actual port before handing it off.

Run the normal checks with:

```bash
npm run typecheck
npm run lint
API_BASE_URL=https://jsonplaceholder.typicode.com npm run build
npm test
```

The full scoped gate passed on 2026-09-09. The latest test result was 19 test
files and 94 tests passed. A bare `npm run build` currently fails before the
unrelated dashboard prerender because `src/config/env.ts` requires
`API_BASE_URL`. Use the documented `.env.example` value in the command
environment; do not modify unrelated dashboard configuration to bypass this.

The local Chrome preview was checked through onboarding, room QR linking,
active Home, Services, room-charge confirmation, My bookings, and Room
charges. Keep the preview local unless the user explicitly asks to deploy or
share it.

## Git and worktree safety

The user explicitly requested committing on `main`. The feature is committed
through `0eac181`; do not create a branch or push unless the user asks.

The working tree contains changes that must be preserved. Some are unrelated
to this feature, and later guest-app refinements are also uncommitted:

- `.openai/hosting.json` is deleted.
- `DESIGN.md`, `README.md`, `docs/design-system.md`, `next.config.ts`, the
  marketing and app layouts, global CSS, design-system gallery, source-image
  components, constants, and design-system tokens are modified.
- `.codex/`, `src/app/components/`, and `src/app/globals 2.css` are untracked.
- `src/components/features/guest-app/guest-app-prototype.tsx`,
  `guest-app-prototype.css`, `guest-app-prototype.test.tsx`, and
  `src/app/(marketing)/page.test.tsx` also have uncommitted changes relative
  to `0eac181`. Inspect and preserve them before making further edits.

Do not run a broad reset, checkout, stash, or `git add .`. Stage explicit files
and inspect `git status --short` before and after any commit.

## Known follow-up notes

- The prototype is intentionally in-memory. Production work will need a data
  boundary for bookings, services, folio entries, identity, and connectivity.
- QR linking, booking lookup, ID capture, and hotel availability are simulated.
- Recheck responsive behavior at the requested mobile viewport before making
  a visual release claim. The last verified browser pass was primarily a
  desktop-width Chrome inspection supplemented by responsive CSS and
  component contracts.

## Instructions for the next LLM

1. Read this file and the relevant source before changing behavior.
2. Preserve the room-folio settlement rule and the five home-state contracts.
3. Keep the current route and client-component architecture unless the user
   explicitly changes scope.
4. Use test-first changes for new behavior and run the focused test before the
   full verification gate.
5. Preserve unrelated dirty-worktree changes and stage only intended files.
6. Verify the real browser journey after UI changes; a passing build is not
   enough evidence for navigation or stateful flow correctness.
