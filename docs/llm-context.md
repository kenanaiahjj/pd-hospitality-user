# Hospitality guest app context

> This file is the handoff context for another LLM working in this repository.
> Use the current source code as the authority when this document and the
> implementation disagree.

Last verified: 2026-09-11
Last Mobbin reference review: 2026-09-11
Base implementation commit: `0eac181` on `main`; later uncommitted guest-app
refinements are present in the working tree
Local preview: `http://localhost:3001/`

## Product definition

Hospitality is a stay companion for guests with a confirmed hotel booking. The
first step is an account gate with one `Get started` action. That action opens
an Apple or Google SSO bottom sheet. After SSO, both providers take the guest
straight to the booking lookup form for a reference number and last name. A
room QR action appears on the active-stay Home only after arrival. It is not a
hotel-discovery, flight, package, transport, or rewards product.

### The four lifecycle gates

Every question about what a screen may offer is a question about which gate
the guest is in. All four resolve through `describeGuestGate`, and the third
is the one that carries state.

| Gate | Opened by | What it gives |
|---|---|---|
| Entry | SSO, then a booking reference and last name | the app itself |
| Pre-arrival | a connected booking | transfers, private car, luggage, celebration setup, early check-in — paid by card — and the front desk |
| In-stay | the guest scans the in-room QR | the full on-property catalogue and charge-to-room |
| Post-stay | checkout | the settled receipt; the desk for 24 hours, then a private stay rating |

The in-stay gate is `canUseOnPropertyServices(booking)` — the stay window is
open, a room is allocated, and `booking.roomVerification` is set. Dates alone
do not open anything: a guest whose calendar covers today could otherwise book
a massage from an airport lounge in another city.

**Cabana never checks anyone in.** The front desk does that, against the
property's own PMS. The scan records only that the guest is in the room, which
is all the app needs before it will charge to it. Copy must never say
otherwise.

**The scan has no self-serve bypass.** `I can't scan` calls
`requestFrontDeskUnlock`, which files a request and deliberately does not set
`roomVerification`; only the desk's reply grants it. A test asserts exactly
that, and it is the test to leave alone.

The verification lives on the `Booking`, never the session: a session holds
several bookings across properties, and a scan in Manila says nothing about
Cebu.

The core commerce rule is non-negotiable:

- Approved on-property services are added to the active room folio.
- The guest pays the hotel at the end of the stay.
- The service flow must not ask for a card, GCash, Maya, insurance, coupon,
  rewards, or another payment method.
- Confirmation must identify the property, guest, room, service, amount, and
  `Charge at checkout` settlement timing.

The prototype is intentionally self-contained. It uses typed in-memory data,
local screen state, realistic mock content, and deterministic SSO fixtures. It
does not connect to Apple or Google OAuth, a booking API, a payment gateway,
document upload, or QR validation.

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

- First render at `/` is an account gate, not an active-stay home.
- The account gate offers one `Get started` action. It opens an accessible SSO
  bottom sheet; Apple and Google both lead directly to the booking lookup
  form, which asks for a reference number and last name.
- Signing in lands on Home, never on a bare lookup form, and it shows the
  guest's previous stays under one `Add a booking` card. SSO matches an
  identity the estate has seen, so a signed-in session carries history; a
  genuinely first-time account is reached from the prototype controls.
- No scan is offered to a guest with no booking — not on Home, not in the app
  bar. No booking means no allocated room and therefore no code to scan.
- A signed-in guest with no booking sees a two-slot tab bar: Home and Profile.
  Explore and My Stay both describe a stay, so without one they are doors onto
  nothing; they return permanently once a booking is connected.
- Stay history is `session.pastStays`, not a global. A new account has none;
  `PAST_STAYS` is the seed for the demo profile only.
- Home shows at most three previous stays and links to `stay-history` for the
  full list. Do not duplicate the full list on Home.
- Guest-app CSS may only use custom properties the stylesheets define. Five
  rules once referenced `--guest-primary`, which does not exist (it is
  `--guest-accent`); CSS fails silently on an undefined variable, so those
  rules simply rendered as nothing. A test now asserts this.
- The scan lives in the app bar's end slot, beside the bell, on every
  authenticated screen — actions go there, places go in the tab bar. It carries
  a dot while the room is unverified. As a list row on Home it was unfindable:
  a guest holding the code had to scroll past the stay card to reach it.
  Home repeats it as a primary button only while the room is still unverified.
- Scanning opens the `scan-room-code` viewfinder, which auto-detects after
  `SCAN_DETECT_MS` and carries a marked prototype trigger.
- The prototype controls panel grows with every feature that has a state worth
  reaching directly. Add a row rather than making a tester replay a journey.
- On-property booking and charge-to-room are gated on
  `canUseOnPropertyServices`, never on dates alone. Do not re-derive the gate
  at a call site.
- The second tab slot is resolved by `describeBookingSlot`: Arrival before the
  stay window opens, Explore once it does, Book again after checkout. Four
  slots always, in fixed order. Explore is locked only for a guest who has
  arrived and not scanned.
- The front desk is reachable in every gate except a stay whose 24-hour
  post-checkout window has closed.
- Reviews are private to the property. Nothing publishes a score.
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

### First-time guest: SSO, then booking-linked onboarding

```text
entry-hub
  -> Get started bottom sheet
  -> Apple or Google SSO
  -> identify (booking reference + last name)
  -> booking-found
  -> guest-details
  -> id-capture
  -> room-preferences
  -> additional-guests
  -> early-check-in
  -> prereg-complete or prereg-queued
  -> stay-overview
```

The root screen has one visible account action:

- `Get started` opens the provider-neutral SSO bottom sheet. Apple and Google
  both create an authenticated identity and continue directly to `identify`;
  the identity service determines whether that identity is new or returning.
- `Use a booking reference instead` in the sheet opens the returning-guest
  verification path without creating a second account screen.

The booking lookup takes a booking or confirmation number and last name, and
matches on the reference alone. The surname is a confirming field, not a key:
matching on it let anyone read a stranger's reservation off a guessed last
name. The current fixture path uses `HEN-241109`, then shows `The Henry
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

### Returning guest: SSO or booking-reference re-entry

The main door is the account gate. A returning guest can use the same
provider-neutral Google or Apple SSO entry, or use a booking reference when
re-entering a stay from a confirmation.

```text
entry-hub -> Get started bottom sheet -> Google or Apple SSO -> identify (new or unlinked stay)
entry-hub -> identify-returning -> verify-contact -> stay-overview (past reference)
entry-hub -> identify -> booking-found -> ...                     (live reservation)
```

`identify` tries `findBookingByLookup` first; a reference that names no live
reservation then goes to `findProfileByLookup` before falling through to
`no-booking`, which itself offers `Stayed with us before? Use a booking
reference`. The dedicated `identify-returning` screen is the same thing
reached deliberately from the SSO sheet's `Use a booking reference instead`
action.

`findProfileByLookup` matches against the whole profile — the live reservations
*and* `PAST_STAYS` — so a guest whose last stay ended long ago can get in on a
receipt. It is deliberately separate from `findBookingByLookup`, which answers
the different question "is there a stay to attach".

`verify-contact` is the reason the reference is not itself a login. A booking
number appears in confirmation emails and on printouts, so it proves nothing
on its own; the code goes to the contact the property holds for that
reservation, shown masked (`a•••@example.com`, `+63 917 ••• 0142`) until it is
entered.

Verifying calls `restoreProfileSession()`, which returns the **whole profile**,
not the single stay whose reference opened the door — otherwise a guest would
re-enter a reference per stay to reassemble their own history. It lands on
`stay-overview`, not `getPostAuthScreen`: that routes through `welcome-back`,
which is a step in *creating* an account, and this guest already has one.

### Returning guest

`welcome-back` shows the recognized guest, the new booking, and saved details.
`Review saved details` goes to `repeat-review`, where the guest can confirm
the profile, room preferences, and additional guest before returning to the
stay flow.

### Room QR from the arrived-stay Home

```text
stay-overview (active) -> Room QR -> room-qr-landing -> Link my stay -> room-qr-midstay -> stay-overview
```

The Room QR action is shown on Home only when the stay is active, after the
guest has arrived. The room QR path links the active booking and uses the
current prototype fixture's Room 304. The linking mutation keeps the booking
`active` and initializes the room folio at `₱3,050` when needed.

A guest who already holds the booking sees a shorter screen — `Scan the code`,
which calls `verifyRoomPresence(… 'scan')` and lands on `room-qr-midstay`.
Asking for their surname again would be a form for its own sake. A stranger
scanning the same code still has to identify which booking is theirs.

`I can't scan` files a desk request and opens the thread. The prototype stands
in for the desk's own tool with a marked control inside the chat; in
production that grant happens on the property's side.

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

Do not replace the existing visual system with a generic discovery landing page,
new icon set, new route structure, or card-payment checkout.

## Offline behavior

`getOfflineAction` is the source of truth for capability behavior:

| Capability | Offline result | UI expectation |
|---|---|---|
| `cached-stay` | `available` | Show cached stay details |
| `chat` / `pre-registration` / `preferences` | `queued` | Keep edits or messages on device and explain delivery status |
| `service-booking` / `payment` / `live-rates` | `blocked` | Do not reserve or imply current price/capacity; offer reconnection or chat |

Offline, the app can still display cached stay details,
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

- The session now survives a reload: `session-storage.ts` keeps a versioned
  `localStorage` record (`cabana.guest-session.v3`) behind `GuestSession`.
  Everything else is still in-memory, and production work will need a data
  boundary for bookings, services, folio entries, identity, and connectivity.
  Hydration runs from a deferred effect, never during render — reading storage
  in a `useState` initialiser mismatches the prerendered `/` route, and a
  synchronous `setState` in an effect is a lint error here. Passing
  `initialSession` disables persistence at both ends, which is what keeps the
  test suite deterministic.
- QR linking, booking lookup, ID capture, and hotel availability are simulated.
  So is the verification code on `verify-contact`: any six digits pass.
### Finished stay: receipt, and booking another

My Stay branches on `describeStayStatus(...).status === 'checked-out'`. A stay
that is over is a receipt, not a running total: the live dot goes, "This stay so
far" is replaced by the settled summary, and the docked action becomes `Book
another stay` with the front desk demoted to a quiet row beneath it. The
Upcoming/Past tabs stay so guests can distinguish future services from
completed or cancelled bookings.

`toFinishedStay(session, booking)` renders the finished `Booking` as the
`PastStay` it has become, so the receipt on My Stay and the one on `stay-detail`
are the same object. It is deliberately not `getRoomCharges`, which answers
"what is running up against the room right now" and drops anything not
`confirmed` — every service on a stay that is over.

`Booking.roomRate` is what the room itself cost. Where a booking has none,
`deriveRoomRate` prices it off `ESTATE_PROPERTIES`. It must never fall back to
`folioTotal`: that is the total charged *against* the room, so using it as the
room's own price understates the room and counts every extra twice.

```text
my-stay -> book-stay -> book-stay-dates -> book-stay-rooms
        -> book-stay-checkout -> book-stay-confirmation
```

`ESTATE_PROPERTIES` holds the three properties with their room types and nightly
rates. `quoteStay` applies 12% — the same rate `rate-detail` already shows for an
OTA booking, so a direct booking does not appear to be taxed differently.
`createStayBooking` mints the reservation with `source: 'Direct booking'` and
pre-arrival reset to zero: a different property holds its own registration
record and has not seen this guest's ID.

This is not hotel search, and `no-booking` keeps its line about Cabana not being
a place to compare hotels. The flow is reachable only from a stay the guest has
already finished — retention, not acquisition — and a direct booking displaces
an OTA's commission.

- The floating `PrototypeControls` panel (collapsed behind a wrench, bottom
  right) switches the stay between `signed-out`, `pre-arrival`, `live` and
  `finished`, and clears the stored session. It renders on every screen; it
  used to render only when a room-ready event was available, which hid it in
  exactly the states worth switching away from. The finished state is otherwise
  unreachable — there is no checkout to play forward — and it is what closes
  room charging, dining orders and room-ready reporting through
  `isStayUnderWay`. `booking-blocked` has a third reason, `checked-out`, so a
  departed guest is no longer told their stay *starts* on a date behind them.
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
