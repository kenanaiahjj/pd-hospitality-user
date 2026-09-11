# Guest Lifecycle Gates Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

| | |
|---|---|
| **Status** | `In Progress` |
| **Created** | 2026-09-11 |
| **Updated** | 2026-09-11 |
| **Owner** | Kenanaiah Jo |
| **Branch / worktree** | `feat/guest-lifecycle-gates` |
| **Spec** | `docs/superpowers/specs/2026-09-11-guest-lifecycle-gates-design.md` |
| **Ledger** | `.superpowers/sdd/2026-09-11-guest-lifecycle-gates/progress.md` |

**Goal:** Make the guest app's four lifecycle gates explicit, with in-room QR
presence — not calendar arithmetic — as what unlocks the on-property catalogue
and charge-to-room.

**Architecture:** One fact (`Booking.roomVerification`) and one predicate
(`canUseOnPropertyServices`) that every gate reads, so the tab bar, the booking
buttons and the folio cannot disagree. The second tab becomes one slot with
three contents resolved by `describeBookingSlot`. The "Can't scan?" path files
a request the desk grants; no guest control writes the fact.

**Tech Stack:** Next.js 16 (App Router) · React 19 · TypeScript (strict) · Tailwind v4

---

## Progress

| # | Task | Status | Started | Completed | Commit |
|---|---|---|---|---|---|
| 1 | Model: gate vocabulary, predicates, fixtures | ⬜ Not started | — | — | — |
| 2 | Session storage v4 | ⬜ Not started | — | — | — |
| 3 | Tab slot + Arrival surface + locked Explore | ⬜ Not started | — | — | — |
| 4 | Scan, desk request, and the gate at every call site | ⬜ Not started | — | — | — |
| 5 | Post-stay: 24-hour desk window, summary, review | ⬜ Not started | — | — | — |
| 6 | Switcher states, DESIGN.md, docs, full verification | ⬜ Not started | — | — | — |

Legend: ⬜ Not started · 🔄 In progress · 🔁 Fix round *R*/5 · ✅ Complete · ⛔ Blocked · ⏭️ Descoped

---

## Global Constraints

Copied verbatim from the spec's Global Constraints.

- Verification gate: `npm run typecheck && npm run lint && npm run build && npm test`
  passes with fresh output before any task is claimed complete.
- The architecture invariants in `CLAUDE.md` are binding.
- `prototype-model.ts` stays pure — no React, no browser APIs, no network. The
  gate predicates are functions of a `Booking` and a clock.
- Money is formatted through `parsePesoAmount` / `formatPesoAmount`. No peso
  strings built by hand in the component.
- Cabana never writes check-in to the PMS. Copy must never claim the app
  checked the guest in; the desk does that.
- The tab bar keeps four slots in fixed order in every gate. Slot two's label
  and content change by gate; no slot is ever removed or reordered.
- Pink stays restrained: primary action, current selection, live state. A
  locked state is not an error state and takes no red.
- `SESSION_STORAGE_KEY` bumps to `cabana.guest-session.v4`.
- No new dependencies.
- `react-hooks` compiler rules are lint errors: no ref writes during render, no
  `setState` in an effect body.

---

## File Structure

**Modify**
- `src/components/features/guest-app/prototype-model.ts` — gate types and
  predicates; `roomVerification` / `checkedOutAt` on `Booking`; `reviews` /
  `unlockRequest` on `GuestSession`; `pre-arrival-services` screen; six
  switcher states.
- `src/components/features/guest-app/session-storage.ts` — key to v4.
- `src/components/features/guest-app/guest-app-prototype.tsx` — tab slot,
  Arrival screen, locked Explore branch, scan and desk-request flows, five
  blocked reasons, post-stay review.
- `src/components/features/guest-app/guest-app-prototype.css` — locked state,
  Arrival surface, review control.
- `DESIGN.md` — describe tab slots by question, not by fixed label.
- `docs/llm-context.md` — the four gates.

**Test**
- `src/components/features/guest-app/prototype-model.test.ts` — spec tests 1–7.
- `src/components/features/guest-app/guest-app-prototype.test.tsx` — spec
  tests 8–14.
- `src/components/features/guest-app/session-storage.test.ts` — v4 key.

---

## Task 1: Model — gate vocabulary, predicates, fixtures

**Status:** ⬜ Not started

**Produces:** `GuestGate`, `RoomVerification`, `UnlockRequest`, `BookingSlot`,
`StayReview`, `describeGuestGate`, `canUseOnPropertyServices`,
`verifyRoomPresence`, `requestFrontDeskUnlock`, `describeBookingSlot`,
`PRE_ARRIVAL_SERVICE_IDS`, `isPreArrivalService`, `describePostStayWindow`.

- [ ] Write model tests 1–7 from the spec; run and watch them fail.
- [ ] Add `roomVerification?` and `checkedOutAt?` to `Booking`; `reviews` and
      `unlockRequest?` to `GuestSession`; `pre-arrival-services` to `ScreenId`
      as screen 52.
- [ ] Implement the predicates. `canUseOnPropertyServices` =
      `isStayUnderWay && roomNumber && roomVerification`.
- [ ] `verifyRoomPresence` maps only the named booking — the two-property test
      is the one that matters.
- [ ] `requestFrontDeskUnlock` sets `unlockRequest` and nothing else.
- [ ] Run tests: PASS.

## Task 2: Session storage v4

**Status:** ⬜ Not started

- [ ] Bump `SESSION_STORAGE_KEY` to `cabana.guest-session.v4` with a version
      note saying why (gates add facts older records cannot carry).
- [ ] `isStoredSession` gains an `Array.isArray(value.reviews)` check, matching
      its existing "guard the collections we map over" contract.
- [ ] Update `session-storage.test.ts`; run.

## Task 3: Tab slot, Arrival surface, locked Explore

**Status:** ⬜ Not started

**Consumes:** `describeBookingSlot`, `PRE_ARRIVAL_SERVICE_IDS`.

- [ ] Write component tests 10 and 8 (slot label per gate; blocked copy).
- [ ] Tab bar slot two reads `describeBookingSlot` for label, destination and
      icon (Compass for Explore, a Car/Suitcase for Arrival, Plus for Book
      again).
- [ ] New `pre-arrival-services` screen: the four roster mini-apps plus an
      early check-in row, each stating card payment.
- [ ] `marketplace` gains a locked branch when `slot.locked`: the scan as
      primary action, "Can't scan?" as the secondary.
- [ ] Run tests: PASS.

## Task 4: The gate at every call site

**Status:** ⬜ Not started

- [ ] Write component tests 9, 11, 12.
- [ ] Replace the two ad-hoc checks in `openServiceBooking` and
      `confirmService` with `canUseOnPropertyServices`, plus
      `isPreArrivalService` for the pre-arrival exception.
- [ ] Widen `bookingBlockedReason` to the five reasons; write the two new
      screens.
- [ ] `room-qr-landing` scan calls `verifyRoomPresence(… 'scan')`.
- [ ] "Can't scan?" calls `requestFrontDeskUnlock` and opens chat with the
      request seeded; the scripted desk reply grants it.
- [ ] Chat reachable pre-arrival: add `chat` to the pre-arrival surfaces.
- [ ] Dining order and charge-to-room read the same predicate.
- [ ] Run tests: PASS.

## Task 5: Post-stay — 24-hour window, summary, review

**Status:** ⬜ Not started

- [ ] Write component test 14 and model test 5.
- [ ] `checkedOutAt` on the finished fixture; `describePostStayWindow` renders
      the remaining-hours label.
- [ ] Within the window: existing settled summary plus an open thread.
- [ ] Outside it: summary of all activities and charges, plus a stay-level
      review (1–5 plus comment) writing to `session.reviews`. No composer.
- [ ] Run tests: PASS.

## Task 6: Switcher, docs, full verification

**Status:** ⬜ Not started

- [ ] `PrototypeStayState` gains `arrived-unverified`; `finished` splits into
      `just-checked-out` and `closed`. Six rows in `PROTOTYPE_STAY_STATES`.
- [ ] `getPrototypeStayState` resolves all six.
- [ ] DESIGN.md: describe the four slots by the question each answers; fix the
      existing "My Trip" / "My Stay" drift.
- [ ] `docs/llm-context.md`: the four gates.
- [ ] Run the full gate: `npm run typecheck && npm run lint && npm run build && npm test`.

---

## Decision Log

| Date | Decision | Why | Cost if wrong |
|---|---|---|---|
| 2026-09-11 | Locked Explore is a branch inside `marketplace`, not its own screen | The tab must not change destination when it locks, or back-navigation and the active-tab highlight both fork | A separate screen id would need adding to `EXPLORE_SCREENS` and every history path |
