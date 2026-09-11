# Finished-Stay Summary and Rebooking Implementation Plan

| | |
|---|---|
| **Status** | `Complete` |
| **Created** | 2026-09-11 |
| **Updated** | 2026-09-11 |
| **Owner** | Kenanaiah Jo |
| **Branch / worktree** | `feat/session-persistence-and-reentry` — continues on the branch carrying the finished-stay work this builds on |
| **Spec** | n/a — bounded change |
| **Ledger** | `.superpowers/sdd/2026-09-11-finished-stay-summary-and-rebooking/progress.md` |

**Goal:** On a finished stay, My Stay reads as a settled receipt — the stay
summarised as a list — and its primary action books another Henry property,
through to payment and a real confirmed reservation.

**Architecture:** Three pieces. (1) An estate catalogue in the model: three
properties, each with room types and nightly rates, plus an optional `roomRate`
on `Booking` so a settled stay can state what the room itself cost. (2) My Stay
branches on a checked-out stay: a summary block replaces the running total, the
docked action becomes `Book another stay`, and the Upcoming/Past tabs stay put
because onward travel booked during the stay is still live. (3) A five-screen
booking flow reusing the existing payment-chip pattern from `travel-checkout`,
ending in a confirmed `Booking` added to the session.

**Tech Stack:** Next.js 16 (App Router) · React 19 · TypeScript (strict) · Tailwind v4

---

## Progress

| # | Task | Status | Started | Completed | Commit |
|---|---|---|---|---|---|
| 1 | Estate catalogue + `Booking.roomRate` | ✅ Complete | 2026-09-11 | 2026-09-11 | uncommitted |
| 2 | Finished-stay summary (model) | ✅ Complete | 2026-09-11 | 2026-09-11 | uncommitted |
| 3 | My Stay finished-stay treatment | ✅ Complete | 2026-09-11 | 2026-09-11 | uncommitted |
| 4 | Booking flow screens | ✅ Complete | 2026-09-11 | 2026-09-11 | uncommitted |
| 5 | Tests, copy reconciliation, docs | ✅ Complete | 2026-09-11 | 2026-09-11 | uncommitted |

Legend: ⬜ Not started · 🔄 In progress · 🔁 Fix round *R*/5 · ✅ Complete · ⛔ Blocked · ⏭️ Descoped

---

## Global Constraints

- Verification gate: `npm run typecheck && npm run lint && npm run build && npm test`
  with fresh output before the work is claimed complete.
- `prototype-model.ts` stays pure. Rates, room types and totals are derived
  there; screens only render.
- Money is formatted through the existing `parsePesoAmount` / `formatPesoAmount`
  pair — no ad-hoc peso strings built by hand in the component.
- A stay a guest booked in-app is theirs, not an OTA's: `source` reads
  `Direct booking`, which is the point of the feature commercially.
- Rebooking must not contradict the zero-CAC positioning. `no-booking` stays as
  it is — it answers a stranger with no reservation, and this flow is only
  reachable by a guest who already has a finished stay.
- No new dependencies.

---

## File Structure

**Modify**
- `prototype-model.ts` — `EstateProperty`, `PropertyRoomType`, `ESTATE_PROPERTIES`,
  `Booking.roomRate`, `countNightsBetween`, `quoteStay`, `toFinishedStay`,
  `deriveRoomRate`, `createStayBooking`, `addStayBooking`.
- `guest-app-prototype.tsx` — finished-stay branch in `my-stay`; five booking
  screens; draft state.
- `guest-app-prototype.css` — summary block, property cards, room-type rows.
- `prototype-model.test.ts` · `guest-app-prototype.test.tsx` — cover both.
- `docs/llm-context.md` — the flow and the positioning note.

---

## Task 1: Estate catalogue and room rate

**Status:** ✅ Complete

`ESTATE_PROPERTIES` — Manila, Cebu, Dumaguete — each with a city, a one-line
description, a `fromRate`, and two or three room types carrying a nightly rate
and a guest capacity. `getPropertyImage` already resolves artwork for all three
by name, so nothing new is needed for imagery.

`Booking` gains an optional `roomRate`. `PastStay` already has one; a live
`Booking` had nowhere to record what the room cost, which is why the finished
My Stay could only report charges and showed a ₱0 room.

- [x] Catalogue, type change, fixtures updated
- [x] `npm run typecheck && npm run lint && npm test`

---

## Task 2: Finished-stay summary

**Status:** ✅ Complete

`toFinishedStay(session, booking)` renders the finished `Booking` as the
`PastStay` it has become, so the existing `summarisePastStay` groups it and the
receipt on My Stay is the same object `stay-detail` renders. Composing the two
beat writing a second summariser that could drift from the first.

Deliberately not `getRoomCharges`: that answers "what is running up against the
room right now". This answers "what did the stay come to", which includes the
room itself and is closed.

- [x] Function + tests
- [x] `npm run typecheck && npm run lint && npm test`

---

## Task 3: My Stay on a finished stay

**Status:** ✅ Complete

Branch on `describeStayStatus(...).status === 'checked-out'`:

- The live dot goes. A green pulse beside "Checked out" reads as present tense.
- The running total ("This stay so far") is replaced by the summary list with a
  settled total.
- The docked action becomes `Book another stay`; the front desk moves to a
  secondary row rather than disappearing — a guest still chases a lost item or a
  billing query after checkout.
- Upcoming/Past tabs stay. The Nov 14 flight leg booked during the stay is
  genuinely still ahead.

- [x] Screen branch + CSS
- [x] Component tests
- [x] `npm run typecheck && npm run lint && npm test`

---

## Task 4: Booking flow

**Status:** ✅ Complete

```text
book-stay -> book-stay-dates -> book-stay-rooms -> book-stay-checkout -> book-stay-confirmation
```

- `book-stay` — the three properties as cards, each with `fromRate`.
- `book-stay-dates` — check-in, check-out, guests. Nights derived and shown.
- `book-stay-rooms` — room types for the chosen property, nightly rate, and the
  total for the chosen nights; capacity filters what is offered.
- `book-stay-checkout` — rate, taxes, total, and the `guest-payment-chip`
  card/GCash/Maya pattern from `travel-checkout`. Blocked offline, like every
  other live-price surface in the app.
- `book-stay-confirmation` — the new reservation, then into it.

`createStayBooking` mints the `Booking`: `Direct booking` source, `upcoming`
status, pre-arrival reset so the guest is walked through it again for the new
property, and a reference in the estate's own format.

- [x] Screens, draft state, `createStayBooking`
- [x] Component tests
- [x] `npm run typecheck && npm run lint && npm test`

---

## Task 5: Tests, copy, docs

**Status:** ✅ Complete

- [x] Full gate including `npm run build`
- [x] Browser pass at 375×812
- [x] `docs/llm-context.md`

---

## Decision Log

| Date | Decision | Why | Cost if wrong |
|---|---|---|---|
| 2026-09-11 | Rebooking is a full booking with payment, not an enquiry | Owner's call when asked. The app already takes payment for travel through `travel-checkout`, so a room booking is not a new kind of surface, and a confirmed reservation lets the guest drop straight back into pre-arrival. | Four screens of rework if it should have been a hand-off to the property. |
| 2026-09-11 | The Upcoming/Past tabs stay on a finished stay | Owner's call. Onward travel booked during a stay outlives it — the reference stay's Nov 14 flight is after its own checkout — so removing the tabs would hide a live booking. | None; the summary sits above them. |
| 2026-09-11 | `no-booking`'s "not a place to search for or compare hotels" stays | It answers a stranger with no reservation, which is the zero-CAC position. Rebooking is reachable only from a finished stay, so it is retention rather than acquisition, and a direct booking displaces OTA commission. | If the estate later wants open search, the line needs revisiting. |
| 2026-09-11 | `deriveRoomRate` prices off the catalogue; it must never fall back to `folioTotal` | The first fallback did, and it is wrong in a way that looks right: `folioTotal` is the total charged *against* the room, so it both understated the room and counted every extra twice — the browser showed a ₱18,600 room as ₱3,050 and a total ₱15,550 short. | A booking outside the estate list shows a ₱0 room, which is the honest answer. |
| 2026-09-11 | Session storage key bumped to v2 | `Booking.roomRate` is new, so a v1 record restored a finished stay whose receipt had no room in it. That is exactly what the version suffix is for. | Anyone mid-demo loses their saved session once. |
| 2026-09-11 | Continues on `feat/session-persistence-and-reentry` | That branch carries the uncommitted finished-stay work this builds directly on. A new branch would need it as a base anyway. | The branch name undersells its contents; rename before any PR. |

---

## Before marking this plan Approved

- [x] **Spec coverage** — no spec; goal and constraints stated here.
- [x] **Placeholder scan** — no `<...>`/TBD in the task bodies.
- [x] **Type consistency** — names produced in Tasks 1–2 are what Tasks 3–4 consume.
- [x] **Right-sized tasks** — each ends in something independently rejectable.
- [x] **Status block filled**
