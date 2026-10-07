# Pilot Into The App Implementation Plan

> **For agentic workers:** work task by task; tick steps as they land; the ledger at `.superpowers/sdd/2026-10-07-pilot-into-app/progress.md` outranks memory after a compaction.

| | |
|---|---|
| **Status** | `In Progress` |
| **Created** | 2026-10-07 |
| **Updated** | 2026-10-07 |
| **Owner** | Ken |
| **Branch / worktree** | `chat` (local; no merge or push to main) |
| **Spec** | `docs/superpowers/specs/2026-10-07-pilot-booking-payment-chat-simulation-design.md` (rules); decisions below |
| **Ledger** | `.superpowers/sdd/2026-10-07-pilot-into-app/progress.md` |

**Goal:** the pilot's booking, payment and chat rules run the real app's flows for tables, services, rentals and goods, replacing the old forms, the old chat-order path and the old cancel path, instead of sitting in an overlay.

**Architecture:** the pure pilot engine stays the system of record for the decisions (confirm or lapse, room or card, windows, holds, threads, desk tasks). A thin host binds it to the signed-in guest and stay, feeds it the app's own Manila catalogue, and records every action in a replay log so a reload rebuilds the same state. The existing `ServiceBooking` record stays what My Stay, the bill, Payments, badges and notifications read; the engine's state is projected onto it after every action.

**Decisions (Ken, 7 Oct):** replace the existing flows (not an overlay). Keep The Henry Manila and the app's own catalogue; the real Dumaguete venues stay in the engine for the 78 scenarios. Confirm-first: rentals and boat-style tours. Everything else charges at once. Transfers, early check-in, stay changes and the arrival cart for them stay as they are.

---

## Progress

| # | Task | Status | Started | Completed | Commit |
|---|---|---|---|---|---|
| 1 | Engine: injectable catalogue, per-booking price, free items, pay modes, stay sync | ✅ Complete | 2026-10-07 | 2026-10-07 | eb7ebff |
| 2 | Host: catalogue adapter, replay log, clock bridge, projection onto `ServiceBooking` | ✅ Complete | 2026-10-07 | 2026-10-07 | see git log |
| 3 | Book: service/rental/table form and pay step through the engine | 🔄 In progress | 2026-10-07 | — | — |
| 4 | Book: nearby places and the lobby shop (goods) through the engine | ⬜ Not started | — | — | — |
| 5 | Chat: Messages list, three-way booking thread, cards in the desk chat | ⬜ Not started | — | — | — |
| 6 | After booking: receipt, cancel, bell, bill and Payments read the engine | ⬜ Not started | — | — | — |
| 7 | Controls: vendor, desk, fault and clock triggers in the real controls; remove the overlay | ⬜ Not started | — | — | — |
| 8 | Tests: rewrite the old assertions, add app-level flows, final gate and walk-through | ⬜ Not started | — | — | — |

Legend: ⬜ Not started · 🔄 In progress · ✅ Complete · ⛔ Blocked

---

## Global Constraints

- Verification gate: `npm run typecheck && npm run lint && npm run build && npm test`, fresh output, before a task is called complete. UI tests are slow under load: use `--maxWorkers=2` if the machine is busy.
- The 78 scenarios and the nine rules must stay green after every engine change (`npx vitest run src/components/features/guest-app/pilot`).
- No hover states; the app is spelled Cabana; rooms are assigned on arrival day; checkout is staff-driven; front desk chat looks the same from every entry point.
- `react-hooks` compiler rules are errors: no `setState` in an effect body, no ref writes during render. Project engine state into the session from event handlers, not effects.
- Work on `chat`; commit per task; never merge or push to main.

## File Structure

**Create** (under `src/components/features/guest-app/pilot/host/`)
- `catalog.ts` — builds engine vendors and listings from `SERVICES`, `RESTAURANTS`, nearby places and gift products
- `host.ts` — one engine per session, replay log, `dispatch`, clock bridge, `subscribe`
- `project.ts` — pure: `applyEngine(session, host)` mapping engine bookings and payments to `ServiceBooking` and `PaymentRecord`
- `messages.tsx`, `booking-thread.tsx`, `booking-card.tsx` — the Messages list, the three-way thread and the card

**Modify**
- `pilot/types.ts`, `pilot/engine.ts` — task 1
- `guest-app-prototype.tsx` — service-booking submit and payment, nearby, cancel, chat routing, controls wiring
- `places.tsx`, `dining.tsx`, `prototype-controls.tsx`, `prototype-model.ts` (projection helpers only)
- `ordering-flow.test.tsx`, `guest-app-prototype.test.tsx` — rewrite assertions for replaced behaviour

**Remove at the end**
- `pilot/ui/pilot-app.tsx` overlay and the "Open the pilot" button (the trigger panel stays, now bound to the app's engine)

## Tasks

Each task lists its own tests first (tests before code, per AGENTS.md), then the change, then the gate. Detailed step lists live in the ledger as work proceeds.
