# Session Persistence and Booking-Reference Re-entry Implementation Plan

| | |
|---|---|
| **Status** | `Complete` |
| **Created** | 2026-09-11 |
| **Updated** | 2026-09-11 |
| **Owner** | Kenanaiah Jo |
| **Branch / worktree** | `feat/session-persistence-and-reentry` — branched in place, see Decision Log |
| **Spec** | n/a — bounded change |
| **Ledger** | `.superpowers/sdd/2026-09-11-session-persistence-and-reentry/progress.md` |

**Goal:** A guest who checked out months ago can get back into their own stay
history by entering any booking reference they hold and verifying a code sent
to the contact on that reservation — and the session survives a page reload.

**Architecture:** Three independent pieces. (1) A versioned `localStorage`
record behind `GuestSession`, read once on mount and written on every change,
in a new browser-only sibling to the pure model. (2) A re-entry path reached
from the ordinary `identify` lookup — a reference that names no live reservation
is checked against the whole profile, then a masked-contact code step, then full
profile restore. It is additive: a live reference still goes to `booking-found`
exactly as before. (3) The existing
floating `PrototypeControls` panel gains a stay-state switcher so any of the
four states can be demonstrated without replaying a flow.

**Tech Stack:** Next.js 16 (App Router) · React 19 · TypeScript (strict) · Tailwind v4

---

## Progress

| # | Task | Status | Started | Completed | Commit |
|---|---|---|---|---|---|
| 1 | Session persistence | ✅ Complete | 2026-09-11 | 2026-09-11 | uncommitted |
| 2 | Profile lookup + masked contact (model) | ✅ Complete | 2026-09-11 | 2026-09-11 | uncommitted |
| 3 | Re-entry screens | ✅ Complete | 2026-09-11 | 2026-09-11 | uncommitted |
| 4 | Stay-state presets (model) | ✅ Complete | 2026-09-11 | 2026-09-11 | uncommitted |
| 5 | Prototype control switcher | ✅ Complete | 2026-09-11 | 2026-09-11 | uncommitted |

Legend: ⬜ Not started · 🔄 In progress · 🔁 Fix round *R*/5 · ✅ Complete · ⛔ Blocked · ⏭️ Descoped

---

## Global Constraints

- Verification gate: `npm run typecheck && npm run lint && npm run build && npm test`
  must pass with fresh output before the work is claimed complete.
- `prototype-model.ts` stays pure — no React, no browser APIs, no network. All
  `localStorage` access lives in the new `session-storage.ts`.
- `react-hooks` compiler rules are lint errors: no ref writes during render, no
  `setState` in an effect body. Hydration must not read storage during render
  either — that is a server/client mismatch on a prerendered route.
- The prototype renders under `next build` prerendering. Every storage access is
  wrapped so that a server pass, a private window, or a browser with site data
  blocked renders the anonymous session rather than throwing.
- Tests stay deterministic: when `initialSession` is passed, persistence is
  bypassed end to end.
- No new dependencies.

---

## File Structure

**Create**
- `src/components/features/guest-app/session-storage.ts` — versioned read/write/clear
  for `GuestSession`, with a structural guard on the parsed record.
- `src/components/features/guest-app/session-storage.test.ts` — round-trip, corrupt
  record, version mismatch, throwing storage.

**Modify**
- `src/components/features/guest-app/prototype-model.ts` — tighten
  `findBookingByLookup`; add `GUEST_PROFILE`, `maskEmail`, `maskMobile`,
  `findProfileByLookup`, `restoreProfileSession`, `PrototypeStayState`,
  `getPrototypeStayState`, `applyPrototypeStayState`.
- `src/components/features/guest-app/guest-app-prototype.tsx` — hydrate and persist
  the session; add `identify-returning` and `verify-contact` screens; always render
  `PrototypeControls` and give it the state switcher.
- `src/components/features/guest-app/guest-app-prototype.css` — styles for the
  switcher rows and the masked-contact choice.
- `src/components/features/guest-app/prototype-model.test.ts` — update the
  surname-only assertion; cover the new model functions.
- `src/components/features/guest-app/guest-app-prototype.test.tsx` — cover re-entry
  and the finished-stay switch.
- `docs/llm-context.md` — document the re-entry flow, persistence, and the switcher.

---

## Task 1: Session persistence

**Status:** ✅ Complete

Create `session-storage.ts` with `STORAGE_KEY = 'cabana.guest-session.v1'`,
`readStoredSession()`, `writeStoredSession()`, `clearStoredSession()`. Every
entry point wrapped in try/catch — a private window throws on access, not just
on write. `readStoredSession` returns `undefined` unless the parsed record passes
a structural guard (the fields the app actually dereferences: `auth`,
`accountStatus`, the four arrays, `roomPreferences`).

In the component: hydrate once on mount, then persist on change. Both in effects,
with no `setState` in an effect body — the read applies through the same deferred
shape `src/lib/hooks/use-debounce.ts` uses if the compiler rule rejects a direct
call. Skip both effects entirely when `initialSession` is passed.

The landing screen is re-derived with `getPostAuthScreen`, not persisted — a
stored screen id can strand the guest on a dead-end, a derived one is
self-correcting.

- [x] Storage module + tests
- [x] Hydrate/persist in the component, `initialSession` bypass
- [x] `npm run typecheck && npm run lint && npm test`

---

## Task 2: Profile lookup and masked contact

**Status:** ✅ Complete

Tighten `findBookingByLookup` to require the reference (surname becomes a
confirming field, not a key). Update the assertion at
`prototype-model.test.ts:944`.

Add to the model:
- `GUEST_PROFILE` — the name, email and mobile the estate holds for Ana Santos,
  so the contact is stated in one place instead of hardcoded on `guest-details`.
- `maskEmail` / `maskMobile` — `a•••@example.com`, `+63 917 ••• 0142`.
- `findProfileByLookup(reference)` → `ProfileMatch | undefined`,
  searching the live bookings *and* `PAST_STAYS`.
- `restoreProfileSession()` → the full authenticated profile.

- [x] Model functions + tests
- [x] `npm run typecheck && npm run lint && npm test`

---

## Task 3: Re-entry screens

**Status:** ✅ Complete

Two new screens, reached from `identify` (a past reference falls through to
them), from `no-booking`, and deliberately from `sign-in`:
- `identify-returning` — reference + surname, "Log in with a booking reference".
- `verify-contact` — names the matched stay, offers the masked email and mobile,
  takes a 6-digit code. Reuses the existing `code` state and the `verify-code`
  visual pattern.

Verifying restores the whole profile and lands on `stay-overview` — not
`getPostAuthScreen`, which routes through `welcome-back`, a step in *creating*
an account. A miss goes to the existing `no-booking`.

- [x] Screens, wiring, and the `identify` + `sign-in` entry points
- [x] Component tests
- [x] `npm run typecheck && npm run lint && npm test`

---

## Task 4: Stay-state presets

**Status:** ✅ Complete

`PrototypeStayState = 'signed-out' | 'pre-arrival' | 'live' | 'finished'`, with
`getPrototypeStayState(session)` to derive the current one and
`applyPrototypeStayState(state)` to build it. `finished` sets the stay completed
so the existing `isStayUnderWay` gates block room charging, dining orders and
room-ready reporting through the already-built `booking-blocked` screen.

- [x] Presets + derivation + tests
- [x] `npm run typecheck && npm run lint && npm test`

---

## Task 5: Prototype control switcher

**Status:** ✅ Complete

`PrototypeControls` currently renders only when `eligibleRoomReadyBooking` is
truthy, so it disappears in exactly the states worth switching to. Render it
always; move that condition onto the room-ready button's `disabled`.

Add a four-way state switcher and a "Reset saved session" that clears storage
and returns to anonymous. Keeps the collapsed-by-default wrench trigger.

- [x] Switcher UI + CSS
- [x] Component tests
- [x] Full gate: `npm run typecheck && npm run lint && npm run build && npm test`
- [x] Update `docs/llm-context.md`

---

## Decision Log

| Date | Decision | Why | Cost if wrong |
|---|---|---|---|
| 2026-09-11 | Branch in place rather than a worktree | Three uncommitted files in `guest-app-prototype.tsx/.css/.test.tsx` are the exact component this extends; a separate worktree strands them and guarantees a merge conflict. Nothing is committed without the owner asking. | A dirty tree on the branch if the work is abandoned; `git stash` recovers it. |
| 2026-09-11 | Structural guard on the stored record, not a zod schema | `CLAUDE.md` invariant 5 governs the API layer, where types are inferred from `src/lib/validators/`. The prototype model hand-writes its types and uses no zod; mirroring `GuestSession` and its four nested collections in zod would either duplicate every type (breaking the same invariant from the other side) or force a model-wide refactor well outside this request. The version key carries shape changes. | A malformed record shaped enough to pass the guard reaches the UI. Bounded — bump the key and it is discarded. |
| 2026-09-11 | Re-entry hangs off `sign-in`, not off `identify` | `identify → booking-found → create-account` is the tested first-timer path; rerouting it through a code step would rewrite working onboarding for no gain. "Find my booking" (attach a stay) and "log in" (recover an account) are genuinely different intents. | Two lookup doors to keep consistent if the copy diverges. |
| 2026-09-11 | Re-entry's main door is `identify`, not a login link on the welcome screen | A `Log in` button was added to the welcome screen and broke two tests that assert it is booking-first with no account chrome — a deliberate decision matching the zero-CAC positioning, not an oversight. Routing a past reference from the lookup the guest already uses is both less intrusive and better: they type what they hold and the app decides which door it is. | None; the dedicated screen still exists behind `sign-in`. |
| 2026-09-11 | `getPrototypeStayState` reads `describeStayStatus`, not `Booking.status` | The first version read `status` and reported "Pre-arrival" for a session the home screen was badging "Checked in" — the reference stay runs 9-12 November against a clock of the 11th while still calling itself `upcoming`. A switch that disagrees with the screen is worse than none. | None found; round-trip covered by tests. |
| 2026-09-11 | `booking-blocked` gained a third reason, `checked-out` | Surfacing the finished state exposed that one reason covered both ends of a stay, so a departed guest was told their stay "starts" on a date behind them and pointed at a room they had left. | Small; the branch is additive. |
| 2026-09-11 | The plan records design and tasks; it does not restate the implementation as code | The template targets subagent execution, where the plan must stand alone. This is executed in-session by one agent, so verbatim code in the plan would be written twice and drift on the first revision. Steps stay checkable. | A future subagent picking this up needs the diff as well as the plan. |

---

## Before marking this plan Approved

- [x] **Spec coverage** — no spec; goal and constraints stated here.
- [x] **Placeholder scan** — no `<...>`/TBD left in the task bodies.
- [x] **Type consistency** — names produced in Tasks 2 and 4 are the ones Tasks 3 and 5 consume.
- [x] **Right-sized tasks** — each ends in something independently rejectable.
- [x] **Status block filled**
