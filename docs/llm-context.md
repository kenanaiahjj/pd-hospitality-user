# Hospitality guest app context

> This file is the handoff context for another LLM working in this repository.
> Use the current source code as the authority when this document and the
> implementation disagree.

Last verified: 2026-09-09
Last Mobbin reference review: 2026-09-11
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
- [Marriott Bonvoy iOS screens and flows](https://mobbin.com/apps/marriott-bonvoy-ios-a67650c4-0098-4634-b8db-fcb3bd0bb33c/_/screens)

Use the references for patterns, not for adding unrelated product scope:

- Shangri-La informed the stay-first relationship between the guest, the
  property, the room, on-property services, and a folio settled later.
- Expedia informed booking-centric entry, clear reservation context, modular
  trip or booking cards, grouped actions, and explicit confirmation states.
- Marriott Bonvoy adds a useful hospitality information architecture reference:
  onboarding, Home, Trips, Account, and login are separated into named flows.
  The reviewed Mobbin page contains 204 screens and 53 flows, including a
  13-screen onboarding flow and a 7-screen Home flow.
- The Hospitality adaptation keeps the guest inside an existing stay. It does
  not add a public booking engine or Expedia-style hotel marketplace.

### Marriott Bonvoy patterns to carry forward

Use Marriott as a structural reference, while keeping Hospitality's stay-only
scope and current visual system:

- Onboarding uses a clear sequence: brand introduction, value proposition,
  optional `Skip`, a strong `Join Now` / `Sign In` choice, and grouped account
  fields. It also shows a focused field and keyboard state, which is useful for
  validating mobile form ergonomics.
- Home leads with a large destination or stay context, a single prominent
  search or next-action control, a greeting and trip status, then supporting
  cards such as recently viewed, promotions, recommendations, and destinations.
  Hospitality should adapt that hierarchy to property, dates, room, and the
  next stay action rather than adding destination discovery.
- Trips is a dedicated reservation hub with Trip detail, Trip updates, and
  Canceling a trip. This supports keeping the active Stay home separate from
  service bookings and folio details.
- Account groups member benefits, activity, rewards, profile, member card,
  preferences, feedback, and logout. Hospitality should keep identity,
  preferences, and stay history in Profile; loyalty and rewards remain out of
  scope for the current phase.
- Marriott's search flows include list/map switching, hotel detail, road-trip
  search, guest count, special rates, and filtering/sorting. These are useful
  patterns to remember for a future booking product, but they must not leak
  into the current guest-companion flow.

### Travel marketplace and activity references to carry forward

Mobbin MCP was connected and reviewed on 2026-09-11. Use these references for
source-backed structure and interaction patterns, not for importing their
branding, public marketplace scope, loyalty programs, or consumer checkout:

- Trip.com has [My trips](https://mobbin.com/flows/db91a094-bea5-4355-9abd-d36d36ac4358),
  [Adding a stay](https://mobbin.com/flows/366ecb8b-24cb-4b5a-a0a6-9c13f7047f0b),
  and [Plan an entire trip](https://mobbin.com/flows/94014eb5-84cb-436c-882c-8cc2c3ac4a2e)
  flows. Its trip hub groups bookings into a timeline, exposes confirmation and
  property-contact actions, supports manually adding an external stay, and
  separates booking, exploration, and packing progress. Hospitality can adapt
  that structure to Stay, service bookings, folio details, and pre-arrival
  tasks without adding a public trip planner.
- Agoda has [Hotels](https://mobbin.com/flows/8a1bd2a1-0e47-4abf-87a3-3c7714d5962a),
  [Booking detail (hotel)](https://mobbin.com/flows/75bce5b9-9c34-4318-a2b5-70a993229015),
  and [Home](https://mobbin.com/flows/e611310b-e1bc-4f46-add0-81c5d51eafbd)
  flows. Useful patterns include explicit overnight/day-use search states,
  upcoming/completed/cancelled booking groups, property/room/guest detail
  sections, and contextual support. Hospitality should adapt those patterns to
  the connected stay and service detail; deals, coupons, VIP status, card
  payment, and transport upsells remain out of scope.
- Klook has [Activity detail](https://mobbin.com/flows/7c0268ab-7a42-4604-b05c-2848ac3433ad),
  [Adding an activity to cart](https://mobbin.com/flows/be206518-a4e5-48ad-98be-3e3034f805c8),
  and [Trips](https://mobbin.com/flows/7a17eda1-cfed-4b78-bbf2-f24af6369d7d)
  flows. Useful patterns include category-led discovery, package and date
  selection, reviews, redemption and arrival guidance, FAQs, and a persistent
  booking action. Hospitality can adapt that detail-page hierarchy to an
  on-property service with live availability, a time slot, location, cutoff,
  and room-folio settlement; public activities, carts, and consumer checkout
  do not belong in the guest companion.
- Traveloka is a requested future reference. The Mobbin MCP searches on
  2026-09-11 did not return an exact Traveloka iOS or web catalog result, so it
  is not a verified source in this context. Keep it on the watchlist until a
  canonical Mobbin reference is available.
- Adjacent references available for future comparison include [Booking.com —
  Booking a property](https://mobbin.com/flows/4b416fa8-669a-410e-a2d5-f76b3e588874)
  and [Viator — Booking an activity](https://mobbin.com/flows/61f6fd86-acdc-4fec-ae44-7e649633afa0).
  Review them only when a task needs an additional OTA or activity-marketplace
  comparison.

For future source review, use the connected Mobbin MCP flow or screen search,
name the exact app and one journey, and inspect the returned previews before
recording a pattern. A search result that matches a neighboring app is not
evidence that the requested app is covered.

## Non-negotiable UX rules

- First render at `/` is `entry-hub`, not an active-stay home.
- Entry offers booking confirmation, room QR, and hotel Wi-Fi paths.
- Bottom navigation is hidden during onboarding and appears only after a
  booking is connected.
- A connected guest can reach Stay, Services, Chat, and Profile.
- Home content is derived from booking state. Do not hard-code one active
  Manila stay into every branch.
- An upcoming booking can show a room type and `Assigned at arrival`; do not
  fabricate a room number before arrival.
- An active booking can show its room, services, and front-desk support. Room
  charges and the running bill live under My Stay, which links to the detailed
  folio.
- Services are on-property only. Live availability and price are required
  before a service can be confirmed.
- A service confirmation is a reservation and a folio mutation, not a payment
  confirmation.
- Offline behavior must remain explicit. Cached stay details can be viewed;
  chat and pre-arrival edits can queue; live service capacity and booking
  confirmation are blocked.
- Preserve the current Asbir Sans, light source-aligned visual language and
  existing `.guest-*` component contracts. The current shell displays
  `Cabana`; inspect the uncommitted refinements before changing the brand.

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
- `Continue with room QR` goes to `room-qr-landing`.
- `Open hotel Wi-Fi entry` goes to `wifi-landing`.

The booking lookup accepts a booking or confirmation number and last name.
The current fixture path uses `HEN-241109` and `Santos`, then shows `The Henry
Manila`. The lookup fallback offers alternate stay details and front-desk
help. `no-booking` says `You’ll need a booking first` and explains: `Cabana
looks after your stay once your hotel booking is confirmed. It isn’t a place
to search for or compare hotels.`

Pre-arrival collects profile details, ID or passport details, room
preferences, and additional guest names. Early check-in is a room-folio
request: the hotel confirms availability first, then an approved `₱1,500`
charge settles at checkout. It never opens a payment form.

The prototype-only `arrival-handoff` screen names the `You’re ready for
arrival` handoff. The connected onboarding path currently proceeds from early
check-in directly to the pre-registration completion state.

When pre-arrival is complete for an upcoming booking, the primary action is
`View my stay`, which returns to the upcoming home. Identity is verified at the
front desk against an original ID; the app issues no credential of its own.

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
linking mutation marks the booking `active` and initializes the room folio at
`₱3,050` when needed.

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
| `active` | Any active booking exists or is selected | Property, dates, room, stay services, next service, room charges, My bookings, front desk |
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
  for entry, onboarding, Home, Stay, Services, Chat, and Profile.
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

- Asbir Sans and the existing light source-aligned visual system.
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
| `cached-stay` | `available` | Show cached stay details |
| `chat` / `pre-registration` / `preferences` | `queued` | Keep edits or messages on device and explain delivery status |
| `service-booking` / `payment` / `live-rates` | `blocked` | Do not reserve or imply current price/capacity; offer reconnection or chat |

Offline, the app can still display the cached itinerary, booking details,
last-known folio, and chat history. It must say plainly which actions are
waiting to send and which are unavailable.

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
