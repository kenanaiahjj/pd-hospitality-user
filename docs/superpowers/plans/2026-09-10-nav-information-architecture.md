# Navigation Information Architecture Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

| | |
|---|---|
| **Status** | `Complete` |
| **Created** | 2026-09-10 |
| **Updated** | 2026-09-10 |
| **Owner** | <human partner> |
| **Branch / worktree** | `feat/nav-revamp` — `.worktrees/nav-revamp` |
| **Spec** | `docs/superpowers/specs/2026-09-10-nav-information-architecture-design.md` |
| **Ledger** | `.superpowers/sdd/2026-09-10-nav-information-architecture/progress.md` |

**Goal:** Re-cut the guest app's destinations to `Home | Explore | My Trip |
Profile`, add a notification bell and inbox to the app bar, and give
the reservation a screen of its own.

**Architecture:** All changes stay inside the existing prototype boundary —
`prototype-model.ts` gains pure derivations (notifications, announcements,
check-out countdown), `guest-app-prototype.tsx` gains two screens and loses one,
and the CSS styles the new surfaces. No new route, no new dependency, no change
to the API layer.

**Tech Stack:** Next.js 16 (App Router) · React 19 · TypeScript (strict) · zod · Tailwind v4

---

## Progress

| # | Task | Status | Started | Completed | Commit |
|---|---|---|---|---|---|
| 1 | Notification, announcement and countdown model | ✅ Complete | 2026-09-10 | 2026-09-10 | see branch |
| 2 | Screen catalogue: add `my-trip` and `notifications` | ✅ Complete | 2026-09-10 | 2026-09-10 | see branch |
| 3 | App bar bell and the notification inbox | ✅ Complete | 2026-09-10 | 2026-09-10 | see branch |
| 4 | The My Trip screen | ✅ Complete | 2026-09-10 | 2026-09-10 | see branch |
| 5 | Four-destination tab bar, Explore cleanup, Home greeting | ✅ Complete | 2026-09-10 | 2026-09-10 | see branch |

Legend: ⬜ Not started · 🔄 In progress · 🔁 Fix round *R*/5 · ✅ Complete · ⛔ Blocked · ⏭️ Descoped

---

## Global Constraints

- Verification gate: `npm run typecheck && npm run lint && npm run build && npm
  test` passes with fresh output before any task is claimed complete.
- Architecture invariants in `CLAUDE.md` are binding — in particular: only
  `src/lib/api/client.ts` calls `fetch`; route handlers stay thin and wrapped in
  `route()`; shared types are inferred from zod schemas, never hand-written.
- `react-hooks` compiler rules are lint errors: no ref writes during render, no
  `setState` in an effect body.
- No new dependency. Icons come from `@phosphor-icons/react`, already in use.
- No new CSS custom property; build from the existing `--guest-*` tokens.
- Every interactive element clears a 44px target, ships default, hover, focus,
  active and disabled states, and gates hover behind
  `(hover: hover) and (pointer: fine)`, per `DESIGN.md`.
- `DESIGN.md` and the travel spec are updated in the same commit as the tab
  bar change, so no document contradicts the interface.

---

## File Structure

**Modify**
- `src/components/features/guest-app/prototype-model.ts` — `GuestNotification`,
  `getNotifications`, `PROPERTY_ANNOUNCEMENTS`, `describeCheckoutCountdown`;
  `ScreenId` gains `my-trip` and `notifications` and loses `my-bookings`.
- `src/components/features/guest-app/guest-app-prototype.tsx` — bell in the app
  bar, `my-trip` and `notifications` screens, five-tab bar, Explore cleanup,
  Home greeting and announcements.
- `src/components/features/guest-app/guest-app-prototype.css` — unread dot,
  notification rows, My Trip countdown and summary, announcement cards.
- `DESIGN.md` — names the four destinations and says what stays off the bar.

**Test**
- `src/components/features/guest-app/prototype-model.test.ts` — screen
  catalogue, notification derivation, countdown copy.
- `src/components/features/guest-app/guest-app-prototype.test.tsx` — tab bar,
  bell, inbox, My Trip, Explore.

---

## Task 1: Notification, announcement and countdown model

**Status:** ✅ Complete · **Started:** 2026-09-10 · **Completed:** 2026-09-10

**Files:**
- Modify: `src/components/features/guest-app/prototype-model.ts`
- Test: `src/components/features/guest-app/prototype-model.test.ts`

**Interfaces:**
- Consumes: `GuestSession`, `Booking`, `ServiceBooking`, `describeRoomAssignment`.
- Produces:

```ts
export type NotificationTone = 'room' | 'booking' | 'folio' | 'desk' | 'travel';

export type GuestNotification = {
  id: string;
  tone: NotificationTone;
  title: string;
  body: string;
  time: string;
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

- [x] **Step 1: Write the failing tests** in `prototype-model.test.ts` — a
      room-ready notification appears only when the room is ready; one entry per
      confirmed service booking; countdown copy for an active stay and an
      upcoming one.
- [x] **Step 2: Run them and watch them fail** —
      `npx vitest run src/components/features/guest-app/prototype-model.test.ts`
- [x] **Step 3: Implement** the three exports as pure functions beside
      `describeRoomAssignment`, newest notification first.
- [x] **Step 4: Run the tests to green.**
- [x] **Step 5: `npm run typecheck && npm run lint`.**

---

## Task 2: Screen catalogue

**Status:** ✅ Complete · **Started:** 2026-09-10 · **Completed:** 2026-09-10

**Files:**
- Modify: `src/components/features/guest-app/prototype-model.ts`
- Test: `src/components/features/guest-app/prototype-model.test.ts`

**Interfaces:**
- Produces: `ScreenId` with `'my-stay'` and `'notifications'` and without
  `'my-bookings'`; `SCREENS` at 47 entries; `marketplace` retitled `Explore`.

- [x] **Step 1: Update the test** — `SCREENS` has 47 unique ids, includes
      `my-trip` and `notifications`, excludes `my-bookings`.
- [x] **Step 2: Run it and watch it fail.**
- [x] **Step 3: Edit `ScreenId` and `SCREENS`** — `my-bookings` (32) becomes
      `my-trip`, titled `My stay`; `notifications` joins as 47 in the `Stay`
      group; `marketplace`'s title changes to `Explore`.
- [x] **Step 4: Run the tests to green.** The prototype will not typecheck until
      Task 4 removes the last `my-bookings` reference; that is expected here.

---

## Task 3: App bar bell and the notification inbox

**Status:** ✅ Complete · **Started:** 2026-09-10 · **Completed:** 2026-09-10

**Files:**
- Modify: `guest-app-prototype.tsx`, `guest-app-prototype.css`
- Test: `guest-app-prototype.test.tsx`

**Interfaces:**
- Consumes: `getNotifications` from Task 1, `'notifications'` from Task 2.
- Produces: a `readNotificationIds` state set and an `openNotifications`
  handler used by the app bar.

- [x] **Step 1: Write the failing tests** — the bell exists and is labelled; it
      opens the inbox; the dot clears once opened; tapping an entry navigates.
- [x] **Step 2: Run them and watch them fail.**
- [x] **Step 3: Implement.** The app bar's end slot becomes a bell button
      (`aria-label="Notifications"`, dot rendered only when unread items exist,
      announced via a visually hidden count). The avatar is removed. The
      `notifications` case renders the list, with an empty state.
- [x] **Step 4: Style** the dot and the rows from existing tokens.
- [x] **Step 5: Run the tests to green.**

---

## Task 4: The My Trip screen

**Status:** ✅ Complete · **Started:** 2026-09-10 · **Completed:** 2026-09-10

**Files:**
- Modify: `guest-app-prototype.tsx`, `guest-app-prototype.css`
- Test: `guest-app-prototype.test.tsx`

**Interfaces:**
- Consumes: `describeCheckoutCountdown` from Task 1, `'my-stay'` from Task 2,
  `getRoomCharges`, `getPrimaryBooking`.

- [x] **Step 1: Write the failing tests** — My Trip shows the folio total, a
      confirmed service, the activity section and the front desk row; the row
      opens the chat.
- [x] **Step 2: Run them and watch them fail.**
- [x] **Step 3: Implement** the `my-trip` case: reservation card with countdown,
      folio block (active stays only), upcoming services, activity, front desk
      row. Empty state matches Home's when there is no booking.
- [x] **Step 4: Retire `my-bookings`** — both cancel flows return to `my-trip`;
      `room-qr-midstay` and any other reference follow.
- [x] **Step 5: Run the tests to green, then `npm run typecheck && npm run lint`.**

---

## Task 5: Four-destination tab bar, Explore cleanup, Home greeting

**Status:** ✅ Complete · **Started:** 2026-09-10 · **Completed:** 2026-09-10

**Files:**
- Modify: `guest-app-prototype.tsx`, `guest-app-prototype.css`, `DESIGN.md`
- Test: `guest-app-prototype.test.tsx`

- [x] **Step 1: Update the failing tests** — the two suites asserting four
      destinations now assert `['Home', 'Explore', 'My Trip', 'Profile']`;
      clicks on `Bookings` become clicks on `Explore`; Explore renders
      `Onward travel` and no `Upcoming & Confirmed` section.
- [x] **Step 2: Run them and watch them fail.**
- [x] **Step 3: Implement the tab bar** — four `NavButton`s with the active-set
      mapping from the spec's Destinations table; `showNav` gains `my-trip` and
      `notifications`.
- [x] **Step 4: Clean up Explore** — remove both booking lists and the empty
      state; retitle to `Explore`; add the `Onward travel` section.
- [x] **Step 5: Home** — greeting becomes `Welcome, <first name> · Room <n>`;
      add the announcements section.
- [x] **Step 6: CSS** — the bell dot, notification rows, My Trip summary and
      announcement cards; the tab grid stays at four columns.
- [x] **Step 7: `DESIGN.md`** — four stable destinations becomes five.
- [x] **Step 8: Full gate** — `npm run typecheck && npm run lint && npm run
      build && npm test`.

---

## Decision Log

| Date | Decision | Why | Cost if wrong |
|---|---|---|---|
| 2026-09-10 | Tasks 2 and 4 land in one commit | Removing `my-bookings` from `ScreenId` breaks the typecheck until its render case is replaced; splitting them would commit a red tree | None — the tasks stay separately reviewable in the diff |
| 2026-09-10 | Notification read state is a `Set` in component state | Nothing in the prototype persists across reloads; a store would be the only such thing | A real inbox needs persistence; this becomes its seed |
| 2026-09-10 | Announcements are static seed data, not derived | They are property broadcasts, unrelated to session state | If they need targeting, they become a derivation like `getNotifications` |
| 2026-09-10 | Re-cut mid-execution from five destinations to four, Travel into Explore, My Stay renamed My Trip | Partner direction: the app is the whole journey, so the bookings tab must hold a ferry as naturally as a massage | Tasks 1-4 carried over unchanged; Task 5 absorbed the change |
| 2026-09-10 | Two notification state sets (`seen` for the bell, `read` for the rows) | Opening the inbox should stop the bell nagging without silently marking every row as read | Collapsing to one set loses the per-row unread mark |
| 2026-09-10 | `PROTOTYPE_TODAY` clamped into an upcoming booking's window | One fixed clock serves fixtures describing both mid-stay and pre-arrival; unclamped, a pre-arrival guest was told check-in was two days ago | A real clock removes the need for the clamp entirely |
