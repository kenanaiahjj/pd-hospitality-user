# Navigation Information Architecture Design

| | |
|---|---|
| **Status** | `Implemented` |
| **Created** | 2026-09-10 |
| **Updated** | 2026-09-10 |
| **Owner** | <human partner> |
| **Plan** | `docs/superpowers/plans/2026-09-10-nav-information-architecture.md` |
| **Supersedes** | `n/a` |
| **Superseded by** | `n/a` |

This spec is the binding authority during execution: when a plan and this
document disagree, this document wins.

---

## Summary

The guest app's destinations are re-cut around what a guest is trying to do
rather than around which system supplies the data. `Stay | Bookings | Travel
| Chat` becomes **`Home | Explore | My Trip | Profile`**, a
notification bell takes the app bar's right slot, and a new **My Trip** screen
collects everything the guest has booked and owes across the whole journey —
room, folio, upcoming services, onward legs, activity, and the front desk — in
one place instead of four.

## Context

Today's tab bar is `Stay | Bookings | Travel | Chat`
([`guest-app-prototype.tsx:2759`](../../../src/components/features/guest-app/guest-app-prototype.tsx)),
and it has three problems the guest can feel:

- **"Bookings" means two things.** The `marketplace` screen ("Bookings Hub")
  is both the catalogue of what you *can* book and the list of what you *have*
  booked. Its own empty state has to send the guest back to Home to browse —
  a hub that cannot fulfil its own call to action.
- **The trip has no home of its own.** Room number lives on the Home hero,
  charges live in `folio`, service bookings live in `marketplace` *and* in a
  near-duplicate `my-bookings`, and travel legs live in a fourth place again.
  Nothing answers "what have I booked, and what do I owe" in one view.
- **`Chat` spends a permanent destination on one action.** A tab is for a place
  you return to; messaging the front desk is a thing you do, usually from
  somewhere specific (a charge you don't recognise, a booking past its cutoff).

There is also no notification surface at all. The room-ready work
([`2026-09-10-room-ready-notification-design.md`](2026-09-10-room-ready-notification-design.md))
shipped a single bespoke toast with an 8-second timer and no inbox, so a guest
who looks away loses the message permanently.

Profile is currently reachable only through an avatar in the app bar, which
makes it the one destination with no label anywhere in the interface.

## Non-goals

- **Real notification delivery.** No push, no service worker, no server. The
  inbox is derived from session state, the way every other list in this
  prototype is.
- **Per-notification read state persisted across reloads.** Read state is
  component state; a remount starts clean.
- **Notification preferences or muting.** No settings screen for this pass.
- **Reworking Travel's internals.** Travel keeps its hub, search, checkout and
  confirmation screens exactly as
  [`2026-09-09-travel-booking-destination-design.md`](2026-09-09-travel-booking-destination-design.md)
  built them. Only where they are entered from changes.
- **A combined bill the guest can settle in one action.** My Trip states the
  trip total and splits it by settlement; it does not offer to pay it. Travel is
  already paid to the operator and the room folio settles at the desk.
- **Search inside Explore.** Explore keeps the existing category grid, filter
  bar and rails. A cross-category search field is a later pass.

## Success criteria

- [x] The tab bar renders exactly `Home`, `Explore`, `My Trip`, `Profile`, in
      that order, and marks the current destination with the accent.
- [x] Travel inventory is reachable from `Explore`, under its own heading, and a
      travel screen lights the `Explore` tab.
- [x] `My Trip` shows a running total for the whole trip, with the room-folio
      and paid-to-operator halves stated separately.
- [x] The app bar's right slot holds a notification bell on every in-app screen;
      it carries a dot when unread items exist and none when they do not.
- [x] Tapping the bell opens a notification list; opening it clears the dot.
- [x] Tapping a notification navigates to the screen that notification is about.
- [x] `My Trip` shows, for an active stay: room and reservation, a check-out
      countdown, the running total, confirmed upcoming services and travel
      legs, an activity history of past orders, and a row that opens the front
      desk chat.
- [x] `Explore` contains no list of the guest's own bookings — only what is
      bookable.
- [x] The room-ready toast still appears, and its message is also retrievable
      from the notification list after the toast has gone.
- [x] `npm run typecheck && npm run lint && npm run build && npm test` passes.

---

## Approaches considered

### Recommended: four destinations, travel folded into Explore

`Home | Explore | My Trip | Profile`. Explore holds the whole catalogue — the
property's own services *and* the onward legs. My Trip holds every booking and
the running bill for the trip. Front-desk chat is a row inside My Trip, and
notifications are the bell in the app bar.

**Why:** Each tab answers one question a guest actually asks — *what's happening
now*, *what can I book*, *what have I booked and what do I owe*, *who am I*. It
resolves the "Bookings means two things" collision without inventing a
destination: the catalogue half stays put and is renamed, the my-bookings half
moves to My Trip, and the duplicate `my-bookings` screen disappears into it.

Naming the third tab for the **trip** rather than the stay is the load-bearing
choice. The product's goal is the whole journey — hotel to hotel, island to
island — so a transfer booked to the next property belongs in the same list as
the room folio, not in a separate tab that reads as a different app. A tab
called "My Stay" could not hold a ferry without lying about its own name.

Travel keeps every separation the travel spec argued for — its own screens, its
own checkout, its own heading, and copy that says it is paid to the operator
rather than charged to the room — but carries it with a section boundary instead
of a tab.

**Costs:** Onward travel is one level deeper than it was, and Explore now has to
hold two kinds of inventory without letting them blur. Contacting the front desk
from Home is two taps rather than one. The travel spec needs amending in the same
commit rather than being left to contradict the interface.

### Alternative: five destinations, keeping Travel

`Home | Explore | My Trip | Travel | Profile`.

**Rejected because:** it spends a permanent destination on inventory the guest
books once or twice a trip, and it splits "what have I booked" across two tabs —
the ferry in Travel, the massage in My Trip — which is exactly the fragmentation
the reshuffle exists to remove. Five tabs also leaves 96px per destination at the
480px cap, with no room to grow.

### Alternative: keep four tabs, merge Home and My Trip

`Home/Stay | Explore | Travel | Profile`, with the folio and activity folded
back into the Home hero.

**Rejected because:** it recreates the problem the reshuffle is meant to fix.
Home is a browse-and-discover surface that changes with promotions and featured
inventory; the folio and reservations are reference data a guest returns to
deliberately. One screen serving both means the reference data keeps moving as
the marketing content around it changes.

---

## Design

### Architecture

Everything here lives inside the existing prototype boundary. `GuestAppPrototype`
stays a single Client Component driving a `switch` over `ActiveScreen`;
`prototype-model.ts` stays the pure data-and-derivation module with no React in
it. No new route, no new API surface, so the `CLAUDE.md` invariants about the
HTTP client, the BFF and the response envelope are untouched.

Two new screens (`my-trip`, `notifications`) are added to `ScreenId`, and
`my-bookings` is removed — My Trip subsumes it entirely, so keeping both would
reintroduce the duplication this pass exists to remove. `SCREENS` therefore goes
from 46 entries to 47.

Notification derivation follows the same shape as `getRoomCharges` and
`describeRoomAssignment`: a pure function of session state, unit-testable
without rendering. Read state is the one piece that cannot be derived, so it
lives in the component as a `Set` of ids.

### Components

**`src/components/features/guest-app/prototype-model.ts`**
- **Does:** gains a notification type and a pure derivation of the guest's
  notification list from session state.
- **Used as:** `export type GuestNotification`, `export function
  getNotifications(session: GuestSession, booking?: Booking): GuestNotification[]`
- **Depends on:** `GuestSession`, `Booking`, `ServiceBooking`,
  `describeRoomAssignment`, `getRoomCharges`.

**`src/components/features/guest-app/guest-app-prototype.tsx`**
- **Does:** renders the four-destination tab bar, the bell in the app bar, the
  `my-trip` and `notifications` screens, and Explore's `Onward travel` section;
  tracks seen and read state.
- **Used as:** unchanged public surface — `<GuestAppPrototype />` with the same
  three optional props.
- **Depends on:** `getNotifications`, plus the existing model exports.

**`src/components/features/guest-app/guest-app-prototype.css`**
- **Does:** styles the bell's unread dot, the notification list rows, the My
  Trip countdown and summary blocks, and the Home announcement cards. The tab
  grid stays at four columns.
- **Used as:** imported once by the prototype component.
- **Depends on:** the existing `--guest-*` token set; no new tokens.

### Destinations

| Tab | Opens | Also active on |
|---|---|---|
| Home | `stay-overview` | — |
| Explore | `marketplace` | `travel`, `travel-search`, `category-listing`, `hotel-service`, `vendor-service`, `restaurant-menu`, `restaurant-cart`, `dining-order-confirmation`, `service-booking`, `booking-confirmation`, `booking-blocked` |
| My Trip | `my-trip` | `folio`, `chat`, `chat-after-hours`, `cancel-before-cutoff`, `cancel-after-cutoff`, `room-qr-midstay`, `notifications` |
| Profile | `profile` | `stay-history` |

Icons: `House`, `Compass`, `Receipt`, `UserCircle`.

The app bar's right slot changes from the guest avatar to the bell. The avatar
is removed rather than moved: Profile is now a labelled destination, and two
routes to the same screen from the same viewport is the duplication this pass
is removing elsewhere. The back button, brand lockup and offline chip are
unchanged.

### Screen content

**Home (`stay-overview`)** keeps its structure. Two changes:

1. The active-stay greeting becomes `Welcome, <first name> · Room <n>` in the
   eyebrow, with the property name remaining the `h1`. When no room is
   allocated yet, the room clause is dropped rather than replaced with a
   placeholder — the room card below already explains why.
2. A new **announcements** section sits between the hero and the category row,
   holding property notices (pool maintenance, a restaurant's new hours). Two
   entries, seeded in the model as `PROPERTY_ANNOUNCEMENTS`, static for this
   pass.

**Explore (`marketplace`)** loses both booking lists — `Upcoming & Confirmed`
and `Past & Completed` move to My Trip — and its "No bookings yet" empty state,
which has nothing left to be empty about. It keeps the offline notice, the
featured service and the category grid, gains the page title `Explore`, and
gains an **Onward travel** section: one tile per `TRAVEL_CATEGORIES` entry
jumping straight into `travel-search`, a `See all` action opening the travel
hub, and a note under the heading saying the legs are paid to the operator
rather than added to the room. Its `SCREENS` title changes from `Bookings Hub`
to `Explore`.

**My Trip (`my-trip`)**, in order:

1. **Reservation card** — property, dates, room type and number, and a
   check-out countdown (`Checks out in 2 days` / `Checks out tomorrow` /
   `Checks out today at 12:00 PM`), derived from `booking.checkOut`.
2. **Running total** — the trip total as a `guest-total-card`, with a row
   opening `folio` for the full ledger.
3. **Upcoming** — confirmed travel legs first, then confirmed service bookings
   for this stay, each service opening its cancellation flow. The legs lead
   because they are time-critical and off-property.
4. **Activity** — past and cancelled services as static cards. Orders and
   activity live here rather than in a tab of their own, because they are the
   same objects as the folio lines above them.
5. **Front desk** — a `guest-list-row` opening `chat`.

The running total is one figure with its settlements named beneath it:
`<folio> on your room · <travel> paid to operators`. Adding the two without
saying so would misstate what the guest still owes, since travel is already
paid and the folio is not.

For a stay that has not started, the countdown reads `Checks in <n> days` and
the folio row is omitted — an upcoming stay has no room charges — though the
total still appears if travel has been booked. With no booking at all, My Trip
shows the same connect-a-booking empty state Home uses.

The prototype clock is fixed at `PROTOTYPE_TODAY` (`2026-11-11`, the date the
seeded folio posts on) and clamped into the booking's own window for an
upcoming stay: one fixed date has to serve fixtures describing both a mid-stay
and a pre-arrival moment, and an unclamped subtraction would tell a guest who
has not arrived that their check-in was two days ago.

**Notifications (`notifications`)** is a list of `GuestNotification` rows: icon,
title, body, relative time, and an unread dot. Two pieces of state, because
"the bell has stopped nagging me" and "I have read this one" are different
facts: opening the screen marks everything **seen**, which clears the dot on the
bell, while a row keeps its own dot until it is actually opened. Tapping a row
navigates to its `screen`. Empty state: *You're all caught up.*

### Interfaces and contracts

```ts
// src/components/features/guest-app/prototype-model.ts

export type NotificationTone = 'room' | 'booking' | 'folio' | 'desk' | 'travel';

export type GuestNotification = {
  id: string;
  tone: NotificationTone;
  title: string;
  body: string;
  /** Display-only relative time, e.g. "2h ago". */
  time: string;
  /** Where tapping the notification takes the guest. */
  screen: ScreenId;
};

export function getNotifications(
  session: GuestSession,
  booking?: Booking,
): GuestNotification[];

export type PropertyAnnouncement = {
  id: string;
  title: string;
  body: string;
  tone: 'neutral' | 'positive' | 'warning';
};

export const PROPERTY_ANNOUNCEMENTS: PropertyAnnouncement[];

export function describeCheckoutCountdown(booking: Booking): string;
```

`getNotifications` returns newest first and derives entries from state that
already exists:

| Source | Notification |
|---|---|
| `describeRoomAssignment(booking).state === 'ready'` | *Room \<n\> is ready* → `stay-overview` |
| each confirmed `ServiceBooking` | *\<title\> confirmed* → `my-trip` |
| a confirmed `ServiceBooking` with a `diningOrder` | *Your order is being prepared* → `my-trip` |
| `session.folioTotal` non-zero | *New charge on your room* → `folio` |
| each confirmed `TravelBooking` | *\<operator\> booking confirmed* → `travel` |
| an active stay | *Front desk* — mirroring the seeded desk message → `chat` |

No new response shape: this pass adds no route handler and no fetch.

### Error handling

No new failure modes. The screens added here read session state that is always
present in some form, and both handle the empty case explicitly (My Trip with no
booking, Notifications with nothing to show) rather than by guarding a render.
The existing offline behaviour is unchanged: My Trip shows the last-known folio
under the existing `offline` notice, matching `folio`.

### Testing

Vitest + Testing Library, in the existing files.

`prototype-model.test.ts`:
- `SCREENS` has 47 unique entries and no `my-bookings`.
- `getNotifications` returns a room-ready entry only when the room is ready.
- `getNotifications` returns one entry per confirmed service booking.
- `describeCheckoutCountdown` covers today, tomorrow, multi-day, the pre-arrival
  direction, and a completed stay.
- `getNotifications` gives every entry a unique id, so read state cannot
  collide, and returns nothing before a booking is connected.

`guest-app-prototype.test.tsx`:
- The tab bar renders exactly the four labels in order, and no `Chat` tab.
- A travel screen lights the `Explore` tab.
- The bell is present, opens `notifications`, and its dot clears once opened
  while the rows keep their own unread marks.
- Tapping a notification navigates to that notification's screen and marks only
  that one read.
- My Trip shows the running total, the folio row, the countdown, and Activity.
- A booked travel leg lands in My Trip's Upcoming beside the on-property
  bookings.
- The running total is absent before a stay starts.
- The front desk row opens the chat.
- Explore renders `Onward travel` and no `Upcoming & Confirmed` section.
- Existing tests that assert the old destinations or click `Bookings` are
  updated, not deleted — the assertions move to the new labels.

---

## Global Constraints

- Verification gate: `npm run typecheck && npm run lint && npm run build && npm
  test` passes with fresh output before any task is claimed complete.
- The architecture invariants in `CLAUDE.md` are binding.
- No new dependency. Icons come from the `@phosphor-icons/react` set already in
  use; no `clsx` or `tailwind-merge`.
- No new CSS custom property. The notification list, the My Trip summary and the
  announcement cards are built from the existing `--guest-*` tokens.
- Every interactive element clears a 44px target, ships default, hover, focus,
  active and disabled states, and gates hover behind
  `(hover: hover) and (pointer: fine)`, per `DESIGN.md`.
- `DESIGN.md` is updated in the same commit as the tab bar change, so the
  document and the interface never disagree about how many destinations exist.

## Open questions

None.

## Decision Log

| Date | Decision | Why | Cost if wrong |
|---|---|---|---|
| 2026-09-10 | Five destinations, keeping Travel as a peer | Travel is `Implemented` as a peer destination on source, timing and settlement grounds | Superseded the same day — see the row below |
| 2026-09-10 | **Reversed: four destinations, Travel folded into Explore** | The product is the whole journey, so the tab that lists bookings has to hold a ferry as naturally as a massage. Splitting "what have I booked" across a Travel tab and a My Trip tab was the fragmentation the pass exists to remove | Restoring Travel as a tab is an additive change: the screens, the section heading and the active-tab mapping all survive |
| 2026-09-10 | "My Trip", not "My Stay" | A tab named for one stay cannot hold the leg to the next property without lying about its own name | A rename plus the `ScreenId`; no structural rework |
| 2026-09-10 | The trip total states its two settlements rather than merging them | Room charges settle at checkout, travel is already paid to the operator; one undifferentiated figure would misstate what the guest still owes | If guests read the split as clutter, the breakdown collapses behind a tap |
| 2026-09-10 | Chat demoted from a tab to a My Trip row | A tab is a place you return to; messaging the desk is an action, and its contextual entries already carry most of the traffic | If desk contact drops, chat returns as a persistent app bar icon beside the bell — an additive change |
| 2026-09-10 | `my-bookings` removed rather than kept alongside `my-trip` | Two screens listing the same service bookings is the duplication this pass exists to remove | Restoring it is a screen re-add plus redirecting the two cancel flows back |
| 2026-09-10 | Profile avatar removed from the app bar | Profile is now a labelled tab; two routes to one screen in one viewport is the duplication being removed elsewhere | Guests who learned the avatar lose a shortcut; re-adding it is a one-line app bar change |
| 2026-09-10 | Notifications derived from session state, not stored | Matches every other list in the prototype and needs no persistence layer | A real inbox needs a store; the derivation becomes the seed for it |
| 2026-09-10 | Orders/activity inside My Trip (brief's Option A) rather than a sixth tab | They are the same objects as the folio lines beside them | Splitting them out later is a section extraction, not a rewrite |
