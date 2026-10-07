# Pilot Booking Payment Chat Simulation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

| | |
|---|---|
| **Status** | `Complete` |
| **Created** | 2026-10-07 |
| **Updated** | 2026-10-07 |
| **Owner** | Ken |
| **Branch / worktree** | `chat` — created by Ken from `main` at `95e4513`; never merged or pushed to main |
| **Spec** | `docs/superpowers/specs/2026-10-07-pilot-booking-payment-chat-simulation-design.md` |
| **Ledger** | `.superpowers/sdd/2026-10-07-pilot-booking-payment-chat-simulation/progress.md` |

**Goal:** Add a pilot simulation of bookings, payments and chat to the Cabana guest app, proven by 78 scenarios and nine invariants, with a report that can be opened and re-run.

**Architecture:** A pure, deterministic engine (`pilot/`) holds every rule; the UI and the scenarios drive the same actions. Scenarios and invariants are written first and fail first. The vendor and front desk are simulated by triggers in the prototype controls; the app shows the guest's point of view only.

**Tech Stack:** Next.js 16 · React 19 · TypeScript (strict) · Vitest (existing). No new dependencies.

---

## Progress

| # | Task | Status | Started | Completed | Commit |
|---|---|---|---|---|---|
| 1 | Contract: types, config, catalog | ✅ Complete | 2026-10-07 | 2026-10-07 | edc9fea |
| 2 | Scenarios and invariants, written first (red) | ✅ Complete | 2026-10-07 | 2026-10-07 | edc9fea, 637921d |
| 3 | Engine: clock, holds, bookings, payments, PMS, gateway | ✅ Complete | 2026-10-07 | 2026-10-07 | 637921d |
| 4 | Engine: vendors, desk queue, cancellations, threads, cards | ✅ Complete | 2026-10-07 | 2026-10-07 | 637921d |
| 5 | Green: 78 scenarios, invariants, chaos | ✅ Complete | 2026-10-07 | 2026-10-07 | 637921d |
| 6 | Report: `pilot:report`, `pilot:replay` | ✅ Complete | 2026-10-07 | 2026-10-07 | daa6c42 |
| 7 | Guest UI: cards, messages, thread, catalogue, request form | ✅ Complete | 2026-10-07 | 2026-10-07 | 880e3cb |
| 8 | Prototype controls: vendor, desk, fault and clock triggers | ✅ Complete | 2026-10-07 | 2026-10-07 | 880e3cb |
| 9 | Verification: gate, preview walk-through, final report | ✅ Complete | 2026-10-07 | 2026-10-07 | see git log |

Legend: ⬜ Not started · 🔄 In progress · 🔁 Fix round *R*/5 · ✅ Complete · ⛔ Blocked · ⏭️ Descoped

---

## Global Constraints

Copied from the spec.

- Verification gate: `npm run typecheck && npm run lint && npm run build && npm test`
  passes with fresh output before any task is claimed complete.
- The architecture invariants in `CLAUDE.md` are binding.
- Work only on branch `chat`; do not merge or push to main.
- App spelled Cabana. No hover states. One front desk chat that looks the same from
  every entry point. Rooms are assigned on arrival day. Checkout is done by the
  front desk.
- Engine code is pure and deterministic; no `Date.now()` or `Math.random()`.
- The point of view is always the guest; the vendor and desk are simulated by controls.

---

## File Structure

**Create** (all under `src/components/features/guest-app/pilot/` unless noted)
- `config.ts` — every setting, one place.
- `types.ts` — domain types and the `Pilot` interface (the contract scenarios use).
- `catalog.ts` — vendors, listings, capacities, hours, confirm mode.
- `engine.ts` — `createPilot`.
- `invariants.ts` — `checkInvariants` for I1 to I9.
- `scenarios/*.ts` — 78 scenarios; `run.ts` runs them with invariants after every step.
- `scenarios.test.ts`, `chaos.test.ts`, `report.test.ts` — vitest entry points.
- `report.ts` — HTML and JSON report writer.
- `use-pilot.ts`, `booking-card.tsx`, `messages.tsx`, `thread.tsx`, `catalogue.tsx`,
  `request-form.tsx`, `console.tsx`, `pilot.css` — guest screens and the controls tab.
- `public/pilot/menus/*.pdf` — placeholder menus.
- `reports/pilot/` — generated report (committed).

**Modify**
- `guest-app-prototype.tsx` — Pilot state, new screens, cards in the front desk chat (small hooks only).
- `prototype-controls.tsx` — a "Pilot" tab.
- `package.json` — `pilot:report`, `pilot:replay`.

---

## Task 1: Contract

- [ ] types, config, catalog compile; the `Pilot` interface is complete enough to write every scenario against.

## Task 2: Scenarios first

- [ ] All 78 scenarios and nine invariants written against the interface; the suite runs and fails.

## Tasks 3 and 4: Engine

- [ ] Each group of scenarios (happy, timing, payment, PMS, cancellations, vendors, restaurants and goods, chat) turned green in turn.

## Task 5: Green

- [ ] 78/78 pass; chaos run (10,000 steps, fixed seed) holds all invariants.

## Task 6: Report

- [ ] `npm run pilot:report` writes `reports/pilot/index.html` and `results.json` with one line per scenario, invariant results, totals, the seed and the changed-from-pages list.

## Task 7: Guest UI

- [ ] Booking card (8 states), Messages list, booking thread, pilot catalogue, request form, cards in the front desk chat; reachable from a "Pilot" prototype state.

## Task 8: Controls

- [ ] Clock, vendor triggers (open, accept, decline, message, scan, extra charge, no-show, cancel, cancel slot, offline, quiet, away), front desk triggers (message, approve, decline, attach, book for guest, private note, ready, move room, shorten or cancel stay, checkout, resolve), fault triggers (hotel system, gateway, notifications), race triggers (double-tap, withdraw with accept, two guests one slot), the desk queue and the log.

## Task 9: Verification

- [ ] Gate passes; each of the four booking kinds walked in the preview; report regenerated and opened.

---

## Decision Log

| Date | Decision | Why | Cost if wrong |
|---|---|---|---|
| 2026-10-07 | See the spec's Decision Log | — | — |
