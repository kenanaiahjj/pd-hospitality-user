# Guest Lifecycle Gates Design

> Produced by `superpowers:brainstorming` (architectural path). Once this
> document is `Approved`, the only next skill is `superpowers:writing-plans`.
> File naming: `docs/superpowers/specs/YYYY-MM-DD-<topic>-design.md`.

| | |
|---|---|
| **Status** | `Approved` |
| **Created** | 2026-09-11 |
| **Updated** | 2026-09-11 |
| **Owner** | Kenanaiah Jo |
| **Plan** | `docs/superpowers/plans/2026-09-11-guest-lifecycle-gates.md` |
| **Supersedes** | `n/a` |
| **Superseded by** | `n/a` |

**Status values:** `Draft` → `In Review` (user reading it) → `Approved` (plan may
be written) → `Implemented`. Off-ramps: `Superseded` (link the replacement) ·
`Abandoned` (say why in the Decision Log).

This spec is the binding authority during execution: when a plan and this
document disagree, this document wins. Keep **Status** and **Updated** current —
an executor reads both files and rules against this one.

---

## Summary

The guest app becomes an explicit four-gate lifecycle — **Entry**,
**Pre-arrival**, **In-stay**, **Post-stay** — where each gate decides what the
app will let a guest do, and one fact opens each one. The gate that does not
exist today is the one that matters most: scanning the QR code in the room is
how a guest proves to the property that they are in it, and only that proof
unlocks the on-property catalogue and charge-to-room. Before arrival the same
tab slot offers a narrower surface — transfers, early check-in, luggage,
celebration setup — paid by card. After checkout, the front desk stays
reachable for 24 hours, then the stay closes into a settled summary with a
review.

The second tab is one slot with three contents, never a locked dead end except
at the single moment a guest can act on it: **Arrival** before the stay window
opens, **Explore** once it does, **Book again** once the stay is over.

## Context

The prototype already implements most of the surfaces; what it lacks is a
coherent gate model. Today the in-stay gate is arithmetic over dates in
`isStayUnderWay` ([prototype-model.ts:548](../../../src/components/features/guest-app/prototype-model.ts)):

```ts
if (booking.status === 'completed') return false;
return now >= dayIndex(booking.checkIn) && now <= dayIndex(booking.checkOut);
```

Two call sites — `openServiceBooking` and `confirmService`
([guest-app-prototype.tsx:1242](../../../src/components/features/guest-app/guest-app-prototype.tsx),
`:1253`) — pair that with `booking.roomNumber` and route failures to
`booking-blocked`. So a guest whose calendar says today is within their stay
window can book a massage from an airport lounge in another city. The QR
screens that exist (`room-qr-landing`, `room-qr-midstay`) are decorative:
`room-qr-midstay` asserts "You're checked in" without anything having been
verified.

What each gate looks like now:

| Gate | State today |
|---|---|
| 1 · Entry | **Done.** `Get started` → SSO sheet → `identify` (reference + last name). Shipped in `8a54f2b`, `9281648`. |
| 2 · Pre-arrival | **Partial.** Screens exist. No pre-arrival booking of any kind; `openServiceBooking` blocks with `not-checked-in`. Chat is classified Stay-only in `MY_STAY_SCREENS`. No Arrival surface. |
| 3 · In-stay | **Missing.** Gated on dates, not on presence. Nothing records that a scan happened. |
| 4 · Post-stay | **Partial.** The settled-stay summary landed 2026-09-11. No 24-hour chat window, no review. |

What forces this now: the four gates are the product's spine. Every remaining
question about what a screen should show — can this button work, is this price
chargeable, is the desk reachable — is a question about which gate the guest is
in, and the app currently cannot answer it.

## Non-goals

- **Cabana never writes check-in upstream.** The scan proves presence; the
  front desk still performs check-in against the PMS. No middleware write is
  designed here. A future spec would be needed if a property wants true digital
  check-in.
- **No real QR camera.** The prototype simulates the scan with a button, as
  `room-qr-landing` does today. Camera access, deep links, and QR payload
  signing are out of scope.
- **No rotating per-stay code.** A code printed in a room can be photographed
  and used off-property, so the scan is a presence ritual and a room binding,
  not an authentication boundary. Hardening it means the PMS issuing a token
  per stay and invalidating it at checkout — middleware and property ops, not
  app work. Recorded here as the upgrade path so it is not mistaken for a gap.
- **No live 24-hour countdown.** The post-stay window is computed from a
  timestamp and stated as a label, but the prototype reaches the closed state
  through the switcher rather than by elapsing. Nothing expires while a
  stakeholder is looking at it.
- **No public reviews.** The review is private to the property. There is no
  rating aggregation, no score on a property card, no discovery surface — that
  would contradict the zero-CAC positioning, where the app is only reachable at
  the point of booking.
- **No per-line service reviews.** One rating for the stay as a whole. Per-item
  review of each massage and dinner is deferred; it becomes worth building when
  an operator asks which vendor is dragging their score down.
- **No new payment rails.** Pre-arrival card payment reuses the existing payment
  chip pattern from `book-stay-checkout`.
- **No PMS capability flag for the scan.** Unlike `reportsRoomReadiness`, the
  gate is uniform across the estate: every property's guest scans, or the desk
  unlocks them.

## Success criteria

- [ ] A guest with a stay whose dates are live but who has not scanned cannot
      reach a booking form for any on-property service, and cannot charge
      anything to their room.
- [ ] The same guest can book an airport transfer, private car, luggage
      storage, celebration setup, or early check-in, paying by card.
- [ ] Scanning the in-room QR unlocks the full Explore catalogue and
      charge-to-room, and the unlock survives a page reload.
- [ ] Tapping "Can't scan?" unlocks nothing by itself: it files a request in
      the front-desk thread, and only the desk's reply grants access. No
      guest-side control sets the verification fact.
- [ ] Front-desk chat is reachable in every gate except a stay closed more than
      24 hours.
- [ ] The second tab holds a usable destination in every gate — Arrival,
      Explore, or Book again — and is locked only when the stay window is open
      and unverified, where its primary action is the scan.
- [ ] Within 24 hours of checkout, My Stay shows the settled summary and an open
      front-desk thread with time remaining.
- [ ] After 24 hours, the thread is replaced by the stay summary — all
      activities and all charges — and a stay-level review the guest can submit.
- [ ] The prototype switcher can reach all six states: signed-out, pre-arrival,
      arrived-unscanned, in-stay, just-checked-out, closed.
- [ ] `npm run typecheck && npm run lint && npm run build && npm test` passes.

---

## Approaches considered

### Recommended: a `roomVerification` fact on `Booking`, read through one predicate

Add an optional `roomVerification` to `Booking` recording *how* presence was
proven and *when*. Introduce one predicate, `canUseOnPropertyServices(booking)`,
that every gate reads. `isStayUnderWay` keeps its current meaning — the stay
window is open — and becomes one of the predicate's inputs rather than the whole
test.

**Why:** The fact belongs to the booking, not the session, because a session can
hold several bookings across properties and a scan in Manila says nothing about
Cebu. It mirrors how `roomAssignment` already models a PMS-side fact the app
only reads. And routing every gate through one predicate means the tab bar, the
booking buttons, the folio, and the charge-to-room affordance cannot disagree —
which is exactly the failure mode the `roomAssignment` comment in the model was
written to prevent.

**Costs:** `Booking` grows another optional field, and the session storage guard
version bumps to v4, discarding stored sessions. For a prototype that is the
intended behaviour of the version suffix, not a regression.

### Alternative: a session-level `checkedIn: boolean`

One flag on `GuestSession`. **Rejected because:** it cannot survive a
multi-property trip, which the model already supports —
`MOCK_SESSION` carries a Manila stay and a Cebu stay. A guest who scanned in
Manila would silently unlock room charging against a Cebu room they have not
seen.

### Alternative: derive presence from hotel Wi-Fi

The `wifi-landing` screen and the `online` toggle already exist; treat being on
the property network as proof of presence. **Rejected because:** it is not
proof — a guest can be on hotel Wi-Fi in the lobby a day early, and a guest in
their room can be on cellular. It also makes the gate invisible: nothing in the
interface would teach the guest what unlocked the app or why it re-locked.

---

## Design

### Architecture

Four gates, each opened by one fact, each with one predicate:

```
Gate 1  Entry          auth === 'authenticated' && bookings.length > 0
Gate 2  Pre-arrival    a booking exists; stay window not yet open, or open but unverified
Gate 3  In-stay        isStayUnderWay(booking) && roomVerification !== undefined
Gate 4  Post-stay      status 'completed' or the window has closed
```

Gate 3 is the new one and the only one that introduces state. Gates 2 and 4 are
computed from facts the model already holds.

The lifecycle resolves through one exported function, `describeGuestGate`, so
that no screen re-derives it. This follows the pattern `describeStayStatus`
already established, and for the same stated reason: the badge and the surfaces
must not be able to disagree.

#### The second tab: one slot, three contents

The tab bar's second slot answers one stable question — *what can I book right
now* — and the honest answer differs by gate. It is never a dead tap, and it is
locked in exactly one situation.

| Gate | Label | Opens | Locked |
|---|---|---|---|
| Pre-arrival (window not open) | **Arrival** | `pre-arrival-services` | no |
| Window open, unverified | **Explore** | `marketplace`, behind the scan | **yes** |
| Window open, verified | **Explore** | `marketplace` | no |
| Post-stay | **Book again** | `book-stay` | no |

The locked row is placed deliberately. A wall shown to a guest three days out
teaches them the app is closed; the same wall shown to a guest standing in
their room, with the code on the desk in front of them, is the one moment the
prompt is actionable. So the lock lives there and nowhere else. Post-stay the
slot reaches the estate rebooking flow that already exists (`book-stay`,
screens 47–51), which is the only thing a checked-out guest can still buy.

Against the `CLAUDE.md` invariants: this work is entirely inside
`src/components/features/guest-app/`. `prototype-model.ts` stays pure — the
gate predicates are functions of a `Booking` and a clock, with no React and no
browser API. Persistence stays in `session-storage.ts`. No new HTTP client, no
new route handler, no new dependency.

DESIGN.md's "four stable destinations" rule is the one this bends, and
deliberately. Four slots remain, in fixed order, each owning one question; what
changes is slot two's label and content as the gate changes. The rule's purpose
— that the bar never reflows and a destination never vanishes — is upheld. Its
current wording names the four by fixed label and also says "My Trip" where the
code says "My Stay", so DESIGN.md's Components section is updated in the same
work to describe slots by question rather than by label.

### Components

**`src/components/features/guest-app/prototype-model.ts`**
- **Does:** owns the gate vocabulary, the predicates, the pre-arrival service
  roster, and the post-stay window arithmetic. Stays pure.
- **Used as:** `GuestGate`, `RoomVerification`, `describeGuestGate`,
  `canUseOnPropertyServices`, `isPreArrivalService`,
  `PRE_ARRIVAL_SERVICE_IDS`, `describePostStayWindow`, `verifyRoomPresence`,
  `StayReview`, `summariseCompletedStay`.
- **Depends on:** existing `Booking`, `GuestSession`, `isStayUnderWay`,
  `describeStayStatus`, `PROTOTYPE_TODAY`, `MINI_APPS`.

**`src/components/features/guest-app/guest-app-prototype.tsx`**
- **Does:** renders each gate. Replaces the two ad-hoc gate checks in
  `openServiceBooking` / `confirmService` with the shared predicate; adds the
  locked-Explore state, the pre-arrival arrival surface, the scan/unlock flow,
  and the post-stay review.
- **Used as:** the single exported prototype component, unchanged.
- **Depends on:** the model exports above.

**`src/components/features/guest-app/session-storage.ts`**
- **Does:** persists the session, including the verification fact, so an unlock
  survives a reload.
- **Used as:** `SESSION_STORAGE_KEY` bumped to `cabana.guest-session.v4`;
  `isStoredSession` unchanged in shape — it deliberately does not validate a
  `Booking`'s interior, and `roomVerification` lives there.
- **Depends on:** nothing new.

### Data flow

The scan, end to end:

```
room-qr-landing  ──Simulate scan──►  verifyRoomPresence(session, bookingId, 'scan')
                                              │
                                     Booking.roomVerification = { method, at }
                                              │
                          setSession ──► writeStoredSession (survives reload)
                                              │
                     describeGuestGate(booking) ──► 'in-stay'
                                              │
        ┌─────────────────────┬───────────────┴────────────┬──────────────────┐
   Explore unlocks      charge-to-room        my-stay folio block      room-qr-midstay
```

The desk path reaches the same call, but never directly from the guest:

```
"Can't scan?"  ──►  requestFrontDeskUnlock  ──►  session.unlockRequest set
                                                        │
                                          chat opens, request seeded in thread
                                                        │
                                      scripted desk reply grants it (prototype:
                                      the reply's action, or the controls panel)
                                                        │
                             verifyRoomPresence(… 'front-desk')  ──►  unlocked
```

The two methods differ only in what the confirmation says; every downstream
gate reads the presence of the fact, not its method. What matters is that no
control the guest can press writes it — that is the whole reason the desk path
is a request rather than a button.

### Interfaces and contracts

```ts
// src/components/features/guest-app/prototype-model.ts

/** Which of the four gates a booking currently sits in. */
export type GuestGate = 'entry' | 'pre-arrival' | 'in-stay' | 'post-stay';

/**
 * How presence in the room was proven, and when.
 *
 * Cabana never checks a guest in -- that is the property's operation against
 * its own PMS. This records only that the guest demonstrated they are in the
 * room, which is what the app needs before it will charge anything to it.
 */
export type RoomVerification = {
  method: 'scan' | 'front-desk';
  /** ISO date. The prototype clock has no time of day. */
  at: string;
};

export function describeGuestGate(
  booking: Booking | undefined,
  today?: string,
): { gate: GuestGate; label: string };

/** The single gate every on-property booking and room charge reads. */
export function canUseOnPropertyServices(
  booking: Booking,
  today?: string,
): boolean;

/**
 * The only path that sets the verification fact, whichever way presence was
 * proven. `'front-desk'` is reachable solely from the scripted desk reply --
 * never from a control the guest can press -- so that the gate keeps meaning
 * "the property confirmed this guest is in this room".
 */
export function verifyRoomPresence(
  session: GuestSession,
  bookingId: string,
  method: RoomVerification['method'],
  today?: string,
): GuestSession;

/**
 * A guest saying "I can't scan". It unlocks nothing on its own: it files a
 * structured request in the front-desk thread and waits for the desk to
 * grant it, which is what keeps the QR from having a self-serve bypass.
 */
export type UnlockRequest = { bookingId: string; requestedAt: string };

export function requestFrontDeskUnlock(
  session: GuestSession,
  bookingId: string,
  today?: string,
): GuestSession;

/** What the second tab is in this gate. Read by the bar and by the screen. */
export type BookingSlot = {
  label: 'Arrival' | 'Explore' | 'Book again';
  screen: 'pre-arrival-services' | 'marketplace' | 'book-stay';
  /** True only when the stay window is open and presence is unproven. */
  locked: boolean;
};

export function describeBookingSlot(
  booking: Booking | undefined,
  today?: string,
): BookingSlot;

/**
 * The catalogue entries a guest can book before they are in the room, because
 * each is either about getting there or waiting for them when they arrive.
 * Early check-in is the fifth arrival affordance but is not a mini-app -- it
 * keeps its existing `early-check-in` screen.
 */
export const PRE_ARRIVAL_SERVICE_IDS = [
  'transfer',       // Airport transfer
  'private-car',    // Private car & driver
  'luggage',        // Luggage storage & delivery
  'celebration',    // Flowers & celebration setup
] as const;

export function isPreArrivalService(miniAppId: string): boolean;

/** Where a finished stay sits against the 24-hour front-desk window. */
export function describePostStayWindow(
  booking: Booking,
  today?: string,
): { deskOpen: boolean; hoursRemaining: number; label: string };

export type StayReview = {
  bookingId: string;
  rating: 1 | 2 | 3 | 4 | 5;
  comment: string;
  submittedAt: string;
};
```

`GuestSession` gains `reviews: StayReview[]` and `unlockRequest?:
UnlockRequest`. `Booking` gains `roomVerification?: RoomVerification` and
`checkedOutAt?: string` — the latter because the 24-hour window needs a
timestamp and `checkOut` is a date with no time of day.

One new screen id, `pre-arrival-services` (screen 52, group `Pre-arrival`),
holds the Arrival surface. No other screen ids are added; the locked Explore
state is a branch inside `marketplace`, not a screen of its own, so the tab
does not change destination when it locks.

No HTTP boundary is crossed, so the `{ data }` / `{ error }` envelope in
`src/types/api.ts` does not apply. Everything here is in-memory prototype state.

### Error handling

The failures are interaction states, not thrown errors. `booking-blocked` grows
from three reasons to five:

| Failure | Reason | Surfaced as |
|---|---|---|
| Offline | `offline` | existing screen, unchanged |
| Stay has not started | `not-arrived` | "Your stay starts on <date>" + a link to the Arrival services that *are* available + message the desk |
| Arrived, not verified | `not-verified` | "Scan the code in your room" + `room-qr-landing` + "Can't scan?" → files a desk request |
| Desk request pending | `unlock-pending` | "The front desk has your request" + the thread; no retry loop, nothing to press |
| Stay is over | `checked-out` | existing screen, unchanged |
| Desk window closed | `desk-closed` | stay summary + review, no composer |

The `not-arrived` / `not-verified` split matters for the same reason the
existing comment gives for splitting `checked-out` out of `not-checked-in`: one
message covering both ends tells a guest standing in their room that their stay
"starts" on a date already behind them.

### Testing

Model tests in `prototype-model.test.ts`:

1. `canUseOnPropertyServices` is false for a live stay with no
   `roomVerification`, true once one is recorded, false again once the stay
   completes.
2. `verifyRoomPresence` marks only the named booking — a two-property session
   verified in Manila leaves Cebu locked. This is the failure the rejected
   session-flag approach would have shipped.
3. `describeGuestGate` returns each of the four gates for the corresponding
   fixture, and agrees with `describeStayStatus` where they overlap.
4. `isPreArrivalService` admits exactly the four roster ids and rejects `spa`
   and `dining`.
5. `describePostStayWindow` reports the desk open inside 24 hours and closed
   outside it.
6. `describeBookingSlot` returns each of the four rows in the slot table, and
   `locked` is true in exactly one of them.
7. `requestFrontDeskUnlock` leaves `roomVerification` unset. This is the test
   that holds the gate: it fails the moment someone wires the "Can't scan?"
   control straight to `verifyRoomPresence`.

Component tests in `guest-app-prototype.test.tsx`:

8. An arrived-unverified guest tapping a spa service lands on `booking-blocked`
   with the scan prompt, not the offline or the not-yet copy.
9. A pre-arrival guest tapping Airport transfer reaches a booking form that
   settles by card and never offers charge-to-room.
10. The second tab reads Arrival pre-arrival, Explore once the window opens,
    and Book again after checkout, and is present in all three.
11. Simulating a scan unlocks Explore, and the unlock survives a re-render from
    stored session.
12. "Can't scan?" seeds the request in the thread and leaves Explore locked;
    the scripted desk grant then opens the same surface the scan would have.
13. Chat is reachable pre-arrival.
14. A stay closed more than 24 hours shows the summary and the review form, and
    no message composer.

---

## Global Constraints

- Verification gate: `npm run typecheck && npm run lint && npm run build && npm test`
  passes with fresh output before any task is claimed complete.
- The architecture invariants in `CLAUDE.md` are binding.
- `prototype-model.ts` stays pure — no React, no browser APIs, no network. The
  gate predicates are functions of a `Booking` and a clock.
- Money is formatted through `parsePesoAmount` / `formatPesoAmount`. No peso
  strings built by hand in the component.
- Cabana never writes check-in to the PMS. Copy must never claim the app
  checked the guest in; the desk does that.
- The tab bar keeps four slots in fixed order in every gate. Slot two's
  label and content change by gate; no slot is ever removed or reordered.
- Pink stays restrained: primary action, current selection, live state. A
  locked state is not an error state and takes no red.
- `SESSION_STORAGE_KEY` bumps to `cabana.guest-session.v4`.
- No new dependencies.

## Open questions

None. All four gate decisions were settled with the owner on 2026-09-11 and are
recorded below.

## Decision Log

| Date | Decision | Why | Cost if wrong |
|---|---|---|---|
| 2026-09-11 | QR proves presence only; the front desk still checks in | The estate is a mixed legacy/cloud PMS behind middleware; a check-in write cannot be assumed available, and Cabana's role is to read | If properties want true digital check-in, a new spec and a middleware write path — the gate itself survives |
| 2026-09-11 | Pre-arrival offers arrival services only; the on-property catalogue waits for the scan | Makes the scan mean something. A guest who can book everything before arriving has no reason to scan | If pre-arrival booking is under-served, widen `PRE_ARRIVAL_SERVICE_IDS` — a one-line change by design |
| 2026-09-11 | Roster: transfer, private car, luggage, celebration, early check-in | Each is either about getting to the property or about something waiting in the room | Same as above — the roster is one constant |
| 2026-09-11 | "Can't scan?" files a desk request; it never unlocks by itself | A damaged QR must not strand anyone, but a guest-side unlock button makes the gate decorative. Routing it through the desk keeps the gate meaning "the property confirmed presence" — two ways to satisfy it, neither self-serve | If desk requests swamp the front desk, the answer is triage in their tooling, not a guest-side bypass |
| 2026-09-11 | The QR is a presence ritual and room binding, not an authentication boundary | A printed code can be photographed. The protection on charge-to-room is the folio settling at checkout against a card on file, with desk visibility | If stakeholders need a real boundary, the lever is a per-stay PMS-issued token invalidated at checkout — middleware work, named in Non-goals |
| 2026-09-11 | Second tab is one slot with three contents; locked only when arrived-unverified | A wall shown three days out teaches the app is closed; the same wall shown to a guest holding the code is the one place the prompt is actionable | If the changing label disorients, revert to a fixed "Explore" label with the same three contents |
| 2026-09-11 | Post-stay the slot becomes Book again, reaching `book-stay` | It is the only thing a checked-out guest can still buy, and it keeps the slot alive in the fourth gate rather than reintroducing the dead tab elsewhere | Extends the owner's choice by one gate; if unwanted, the slot hides post-stay and the bar carries three destinations there |
| 2026-09-11 | The 24-hour window is computed but does not elapse in the prototype | Demoability: a stakeholder must be able to see both sides of the boundary without waiting a day | A real product needs the timer; the arithmetic is already there, only the switcher stands in for the clock |
| 2026-09-11 | Front desk open 24h post-checkout, then summary + stay-level review | A guest disputing a charge needs the desk; past that, the stay is a receipt | Per-line vendor reviews would need a new shape on `StayReview` and a per-service surface |
| 2026-09-11 | Review is private to the property, never published | Zero-CAC: the app has no discovery surface for a public rating to influence | A public rating would need a property-card surface that does not exist |
| 2026-09-11 | Verification is a fact on `Booking`, not a flag on `GuestSession` | A session holds multiple bookings across properties; a scan in Manila says nothing about Cebu | A session flag would unlock room charging against a room the guest has never seen |

---

## Before marking this spec In Review

- [x] **Placeholder scan** — no `<...>`, `TBD`, `TODO`, empty sections, or vague
      requirements.
- [x] **Internal consistency** — architecture, component list, and data flow
      agree; the roster appears once and is referenced elsewhere.
- [x] **Scope check** — one plan's worth: one model change, one component's
      gates, one storage bump. Gate 1 is already shipped and is not re-opened.
- [x] **Ambiguity check** — the scan/desk split, the roster, and the 24-hour
      boundary are each stated once, explicitly.
- [x] **Status block filled** — Status, Created, Updated, Owner.
