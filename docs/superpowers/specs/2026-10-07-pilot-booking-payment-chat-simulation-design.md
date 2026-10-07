# Pilot Booking Payment Chat Simulation Design

> Produced by `superpowers:brainstorming` (architectural path). Once this
> document is `Approved`, the only next skill is `superpowers:writing-plans`.
> File naming: `docs/superpowers/specs/YYYY-MM-DD-<topic>-design.md`.

| | |
|---|---|
| **Status** | `Approved` |
| **Created** | 2026-10-07 |
| **Updated** | 2026-10-07 |
| **Owner** | Ken |
| **Plan** | `docs/superpowers/plans/2026-10-07-pilot-booking-payment-chat-simulation.md` |
| **Supersedes** | `n/a` |
| **Superseded by** | `n/a` |

This spec is the binding authority during execution: when a plan and this
document disagree, this document wins.

**Sources of truth.** Two pages (read with the Artifact tool):
*Cabana tri-party flows* (`claude.ai/artifact/34GfCHGgdW63ip5cq3MpXF`) and
*Cabana chat cards and test scenarios* (`claude.ai/artifact/8zMuPjhW45Zwy77z7mVpR1`).
Their flows A to I, the every-case table, the nine invariants and the 78
scenarios are the requirements. **Where this document differs from the pages,
this document wins** (see "Changes from the pages").

---

## Summary

A pilot simulation of bookings, payments and chat for The Henry Resort Dumaguete,
inside the Cabana guest app. The guest always sees the guest app; the vendor and
the front desk are simulated by triggers in the prototype controls. One booking
thread joins the guest, the front desk and the vendor. A headless engine
holds every rule, and 78 scenarios plus nine invariants prove it, with a report
that can be opened and re-run.

## Context

The app has a guest to front desk chat (`renderChatScreen` in
`src/components/features/guest-app/guest-app-prototype.tsx`) and the front desk
and vendor never share a conversation with the guest. Current Manila booking
flows charge at once and have no vendor step. Prototype controls
(`prototype-controls.tsx`) already carry demo triggers for hotel events.

## Non-goals

- Restructuring the app or changing the existing Manila flows.
- Real PMS, gateway or SMS: all three are in-process simulators.
- Pre-orders or any POS for restaurants, room-to-room chat, date changes (cancel
  and rebook only), part-payments or deposits.
- A real vendor or front desk app: they are control-panel triggers and a queue
  view, shown from the guest's point of view.

## Success criteria

- [ ] All 78 scenarios pass, and all nine invariants hold after every step.
- [ ] `npm run pilot:report` writes `reports/pilot/index.html` and `results.json`
      and can be re-run; a failing chaos run prints its seed and step, and
      `npm run pilot:replay` repeats it.
- [ ] `npm run typecheck && npm run lint && npm run build && npm test` pass.
- [ ] From the guest app, a booking of each of the four kinds can be made, paid
      one way, and followed in its thread, with the vendor and desk simulated from
      prototype controls.

---

## Approaches considered

### Recommended: pure engine + UI on top

A deterministic, pure TypeScript engine (clock, ledger, state machines,
simulated PMS, gateway, vendors, notifications, desk queue, threads) in
`src/components/features/guest-app/pilot/`. The UI and the scenarios both drive
the same engine through the same actions.

**Why:** the scenarios need time travel, fault injection and seeded chaos, none of
which the UI can give. The repo already keeps `prototype-model.ts` pure.
**Costs:** the UI needs a thin subscription layer to a mutable engine.

### Alternative: put the rules in the React state

**Rejected because:** nine invariants checked after every step and a 10,000-step
chaos run cannot run against component state.

### Alternative: scenarios as browser end-to-end tests only

**Rejected because:** the repo has no browser test runner, 78 scenarios with
clock jumps and failing gateways would be slow and flaky, and replay by seed
needs a deterministic engine. A few browser checks are done by hand through the
preview and recorded in the plan.

---

## Design

### Architecture

```
prototype controls ─► pilot console (vendor / desk / faults / clock) ─┐
guest app screens  ─► guest actions ──────────────────────────────────┼─► PilotEngine
scenarios (vitest) ─► same actions + invariants after every step ─────┘     │
                                                                            ├─ clock + timers
                                                                            ├─ bookings + holds
                                                                            ├─ payments + folio (PMS sim) + gateway sim
                                                                            ├─ threads + cards (derived)
                                                                            └─ desk queue + outbox + log
```

The engine is pure: no React, no browser APIs, no network, no `Date.now()` or
`Math.random()`. Its only inputs are its clock and one seeded random source.
The existing app is touched in small places: a "Pilot" prototype state, new
screens (messages, thread, pilot catalogue, request form), booking cards in the
front desk chat, and one tab in the prototype controls.

### Rules (binding)

**Pay one way.** Every payment is `room` or `card` (paid in full), never split, no
deposits. Room is pre-selected. Room is offered only when the service date is
inside the stay and the order is within the limits (per order ₱5,000, per stay
₱20,000, both counting Cabana's own pending and posted charges). Over a limit,
the slot is held and the front desk approves or declines within 10 minutes;
declined or no answer means the guest pays in full or cancels. Outside the stay
only card is offered.

**Two booking paths.**
- *Confirm first*: rentals and the Apo Island boat trip. The guest asks, the slot
  is held, the vendor accepts or lapses on a timer. Only after accepting is the
  room charged, or the card payment window opened (15 minutes, 3 tries).
- *Charge at once*: Henry's own activities, Cafe Sans Rival pasalubong. The
  charge is taken as the guest confirms (room charge queued to the PMS, or card
  paid through the gateway in a 15 minute, 3 try window with the slot held) and the
  booking is Confirmed. Stock and capacity are checked and held atomically.
- *Tables* (six restaurants): free to hold, Reserved at once, nothing charged.

**Settings (test values, not agreed with Henry's)** — in `pilot/config.ts`:
vendor timer 30 min for a service within 24 h, otherwise 4 h counting only while
the vendor is open, never over 24 h; reminder at half time; vendor SMS if unopened
after 5 min; lapse at the earlier of timer end or 15 min before the start; offline
vendor taps count up to 5 min after the deadline; card window 15 min, 3 tries;
desk approval 10 min; per-order limit ₱5,000; per-stay limit ₱20,000; extra charge
correctable by the vendor for 1 h; no-show 30 min after the start; table held 15
min past its time; gateway reconciliation every 2 min; PMS retry every 5 min for
24 h, desk alert at 30 min; guest SMS if a critical push is unopened 10 min; booking
thread open until 48 h after the service.

**Venues.** Real names only for The Dining Room, Si Señor, Popolo Pizzeria, The Red
Kitchen, Noelle's Brunch Bar, Coffee Collective (tables, PDF menu) and Cafe Sans
Rival (pasalubong). Placeholders: "Boat operator (simulated)", "Bike shop
(simulated)", "Henry's activities (simulated)". Menu PDFs are placeholders marked as
samples; no invented dishes or prices.

### Components

**`pilot/config.ts`** — **Does:** every setting. **Used as:** `PILOT_SETTINGS`.
**`pilot/types.ts`** — **Does:** the engine's domain types and `Pilot` interface.
**`pilot/catalog.ts`** — **Does:** vendors, listings, capacities, hours, confirm mode.
**`pilot/engine.ts`** — **Does:** `createPilot(options): Pilot`.
**`pilot/invariants.ts`** — **Does:** `checkInvariants(pilot): string[]` for I1 to I9.
**`pilot/scenarios/*.ts`** — **Does:** the 78 scenarios as data and scripts.
**`pilot/run.ts`** — **Does:** runs scenarios with invariants after every step.
**`pilot/report.ts`** — **Does:** writes the HTML and JSON report.
**`pilot/use-pilot.ts`** — **Does:** React subscription to the engine.
**`pilot/booking-card.tsx`**, **`messages.tsx`**, **`thread.tsx`**, **`catalogue.tsx`**,
**`request-form.tsx`**, **`console.tsx`** — the guest screens and the controls tab.

### Interfaces and contracts

Booking states (one record per booking, drawn in H): `needs-approval`,
`pay-or-cancel`, `requested`, `awaiting-payment`, `confirmed`, `reserved`,
`in-progress`, `ready`, `completed`, `collected`, `seated`; exits `withdrawn`,
`declined`, `lapsed`, `payment-expired`, `cancelled`, `no-show`.
Payment states (drawn in I): room `pending`, `posting`, `posted`, `settled`,
`voided`, `reversed`, `failed`, `refund-due`; card `awaiting`, `paid`, `expired`,
`refund-pending`, `refunded`, `refund-failed`; `inQuestion` is a flag. Only drawn
transitions are allowed; anything else is refused and logged.

A card is a view derived from the booking record, never stored, so it cannot be stale.

### Error handling

Nothing fails silently: every failure the system cannot settle opens a desk task with
an owner and a due time. A refused action returns `{ ok: false, reason }` and
changes nothing. When two actions arrive together, the first recorded wins and the
other is told who acted first.

### Testing

The 78 scenarios and nine invariants are written **before** the engine and fail
first. Every scenario action goes through one dispatcher that checks all nine
invariants after each step. The chaos run (S6) takes a seed and 10,000 steps and
prints both on failure. `npm run pilot:report` re-runs everything and writes the
report. UI is checked by hand in the preview, recorded in the plan.

### Changes from the pages (Ken, 7 Oct)

The pages say every non-table booking asks the vendor first. Ken's rule: **charge at
once, except rentals and the Apo Island boat trip** which confirm availability first.
Consequences, each adapted and listed by ID in the report:

- I3 now reads: no charge is taken for a *confirm-first* booking the vendor has not
  accepted; charge-at-once bookings charge as they are confirmed.
- Scenarios for Henry's own activities (H9) and pasalubong (H6, R7, R8) run the
  charge-at-once path: the booking is Confirmed with the charge as the guest
  confirms; there is no vendor accept step, timer or lapse.
- Vendor-timer scenarios (T1 to T8, V4) use the Apo Island trip or the bike shop,
  never pasalubong or activities.
- A card payment for a charge-at-once booking has the same 15 minute, 3 try window
  but starts at booking, not at vendor acceptance.
- Pasalubong "short item after the order" adjusts the charge (void and repost, or a
  partial refund); there is no out-of-stock decline because stock is checked as the
  guest confirms.

## Global Constraints

- Verification gate: `npm run typecheck && npm run lint && npm run build && npm test`
  passes with fresh output before any task is claimed complete.
- The architecture invariants in `CLAUDE.md` are binding.
- Work only on branch `chat`; do not merge or push to main.
- App spelled Cabana. No hover states. One front desk chat that looks the same from
  every entry point. Rooms are assigned on arrival day. Checkout is done by the
  front desk.
- Engine code is pure and deterministic; no `Date.now()` or `Math.random()`.
- The point of view is always the guest; the vendor and desk are simulated by controls.

## Open questions

None.

## Decision Log

| Date | Decision | Why | Cost if wrong |
|---|---|---|---|
| 2026-10-07 | Charge at once, except rentals and the Apo Island boat trip | Ken's instruction | Move a listing's `confirm` flag in `catalog.ts` |
| 2026-10-07 | Adapt the pages' scenarios and list changes, keep the 78 IDs | Ken chose it | Re-map IDs if the pages are updated |
| 2026-10-07 | Vendor and desk are control-panel triggers; the app shows the guest only | Ken's instruction | Real vendor and desk screens would be a separate piece of work |
| 2026-10-07 | Per-stay limit ₱20,000 | Pages give only ₱5,000 per order | One config line |
| 2026-10-07 | Vendor hours: boat 6 AM to 6 PM; bike shop, Cafe Sans Rival 8 AM to 6 PM; restaurants 10 AM to 10 PM; activities 6 AM to 8 PM | Pages give none; only T7 uses it | One config line each |
| 2026-10-07 | Pay-in-full-or-cancel choice times out after 15 min | Pages say "times out" without a value | One config line |
| 2026-10-07 | Run `npm run pilot:report` through vitest with `PILOT_REPORT=1` | No TS runner in the repo; avoids adding a dependency | Swap the script if a runner is added |
