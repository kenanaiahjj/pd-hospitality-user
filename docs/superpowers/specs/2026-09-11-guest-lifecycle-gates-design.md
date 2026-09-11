# Guest Lifecycle Gates Design

> Produced by `superpowers:brainstorming` (architectural path). Once this
> document is `Approved`, the only next skill is `superpowers:writing-plans`.
> File naming: `docs/superpowers/specs/YYYY-MM-DD-<topic>-design.md`.

| | |
|---|---|
| **Status** | `In Review` |
| **Created** | 2026-09-11 |
| **Updated** | 2026-09-11 |
| **Owner** | Kenanaiah Jo |
| **Plan** | `docs/superpowers/plans/YYYY-MM-DD-<feature>.md` (once written) |
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
what proves a guest is physically on property, and only that scan unlocks the
Explore catalogue and charge-to-room. Before it, the app offers a narrow arrival
surface — transfers, early check-in, luggage, celebration setup — paid by card.
After checkout, the front desk stays reachable for 24 hours, then the stay
closes into a settled summary with a review.

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
| 2 · Pre-arrival | **Partial.** Screens exist. No pre-arrival booking of any kind; `openServiceBooking` blocks with `not-checked-in`. Chat is classified Stay-only in `MY_STAY_SCREENS`. |
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
- [ ] A guest who taps "Can't scan?" reaches the front desk, and a front-desk
      unlock opens the same surfaces the scan would have.
- [ ] Front-desk chat is reachable in every gate except a stay closed more than
      24 hours.
- [ ] The Explore tab is present in the tab bar in all four gates; pre-arrival
      it renders a locked state naming the scan as the key.
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

Against the `CLAUDE.md` invariants: this work is entirely inside
`src/components/features/guest-app/`. `prototype-model.ts` stays pure — the
gate predicates are functions of a `Booking` and a clock, with no React and no
browser API. Persistence stays in `session-storage.ts`. No new HTTP client, no
new route handler, no new dependency. The one invariant this touches is
DESIGN.md's "four stable destinations" rule, and it upholds it: the Explore tab
stays in the bar in every gate and renders a locked state rather than
disappearing.

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

The front-desk unlock is the same call with `method: 'front-desk'`, reached from
the "Can't scan?" row on the locked Explore state and on `room-qr-landing`. The
two methods differ only in what the confirmation screen says; every downstream
gate reads the presence of the fact, not its method.

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

/** Records presence against one booking. Returns a new session. */
export function verifyRoomPresence(
  session: GuestSession,
  bookingId: string,
  method: RoomVerification['method'],
  today?: string,
): GuestSession;

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

`GuestSession` gains `reviews: StayReview[]`. `Booking` gains
`roomVerification?: RoomVerification` and `checkedOutAt?: string` — the latter
because the 24-hour window needs a timestamp and `checkOut` is a date with no
time of day.

No HTTP boundary is crossed, so the `{ data }` / `{ error }` envelope in
`src/types/api.ts` does not apply. Everything here is in-memory prototype state.

### Error handling

The failures are interaction states, not thrown errors. `booking-blocked` grows
from three reasons to five:

| Failure | Reason | Surfaced as |
|---|---|---|
| Offline | `offline` | existing screen, unchanged |
| Stay has not started | `not-arrived` | "Your stay starts <date>" + the arrival services that *are* available + message the desk |
| Arrived, not verified | `not-verified` | "Scan the code in your room" + `room-qr-landing` + "Can't scan?" → front desk |
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

Component tests in `guest-app-prototype.test.tsx`:

6. An arrived-unverified guest tapping a spa service lands on `booking-blocked`
   with the scan prompt, not the offline or the not-yet copy.
7. The same guest tapping Airport transfer reaches a booking form that settles
   by card and never offers charge-to-room.
8. The Explore tab is present pre-arrival and renders the locked state.
9. Simulating a scan unlocks Explore, and the unlock survives a re-render from
   stored session.
10. "Can't scan?" → front-desk unlock reaches the same unlocked surface.
11. Chat is reachable pre-arrival.
12. A stay closed more than 24 hours shows the summary and the review form, and
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
- The tab bar keeps four stable destinations in every gate (DESIGN.md).
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
| 2026-09-11 | Pre-arrival is arrival services only; Explore stays locked | Makes the scan mean something. A guest who can book everything before arriving has no reason to scan | If pre-arrival booking is under-served, widen `PRE_ARRIVAL_SERVICE_IDS` — a one-line change by design |
| 2026-09-11 | Roster: transfer, private car, luggage, celebration, early check-in | Each is either about getting to the property or about something waiting in the room | Same as above — the roster is one constant |
| 2026-09-11 | "Can't scan?" routes to a front-desk unlock | A damaged QR or a guest already checked in at the desk must not be stranded, and the desk is the authority on who is in which room | If unlocks are abused, the method is recorded on the fact and can be audited or rate-limited later |
| 2026-09-11 | Explore tab visible but locked, never hidden | DESIGN.md's four stable destinations; and a locked tab teaches the mechanic before arrival, where a missing tab teaches nothing | If the dead tab frustrates, the fallback is the "becomes Arrival" variant — same slot, different content |
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
