# Guest App Prototype Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

| | |
|---|---|
| **Status** | `Complete` |
| **Updated** | 2026-09-09 |

**Goal:** Build the decision-complete guest-facing mobile prototype described in the v3 brief.

**Architecture:** A pure TypeScript model defines the screen inventory, scenarios, mock entities, and business rules. One React client component owns throwaway in-memory state and renders the active screen inside a responsive phone shell.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Phosphor Icons, CSS, Vitest, Testing Library.

## Global constraints

- Build only the guest-facing Phase 1 scope.
- Use mock data and neutral styling.
- Target a 390 x 844 mobile viewport with iOS and Android parity.
- Keep the Stay QR available offline.
- Queue only pre-registration, preferences, and chat; block capacity and payment actions offline.
- Never use the word prohibited by the cancellation brief in guest-facing copy.
- Keep all 38 screens and flows A-I reachable.

---

### Task 1: Prototype model

**Files:**
- Create: `src/components/features/guest-app/prototype-model.ts`
- Test: `src/components/features/guest-app/prototype-model.test.ts`

**Interfaces:**
- Produces: `SCREENS`, `SCENARIOS`, `getCancellationState()`, and `getOfflineAction()`.

- [x] Write tests for the inventory, guided-flow entry points, cancellation cutoffs, and offline rules.
- [x] Run the focused test and confirm it fails because the model is missing.
- [x] Implement the smallest typed model that satisfies the tests.
- [x] Run the focused test and confirm it passes.

### Task 2: Interactive app shell and flows

**Files:**
- Create: `src/components/features/guest-app/guest-app-prototype.tsx`
- Create: `src/components/features/guest-app/guest-app-prototype.test.tsx`
- Create: `src/components/features/guest-app/index.ts`
- Modify: `src/app/(marketing)/page.tsx`

**Interfaces:**
- Consumes: the model exports from Task 1.
- Produces: `GuestAppPrototype`, a complete in-memory clickable prototype.

- [x] Write component tests for the entry choices, scenario navigator, and offline wallet.
- [x] Run the focused test and confirm the missing component failure.
- [x] Implement the shared shell, all screen states, main navigation, scenario navigator, and state transitions.
- [x] Run the focused component test and confirm it passes.

### Task 3: Neutral mobile presentation

**Files:**
- Create: `src/components/features/guest-app/guest-app-prototype.css`
- Modify: `src/app/globals.css`
- Modify: `src/app/layout.tsx`

**Interfaces:**
- Consumes: semantic class names from Task 2.
- Produces: the 390 x 844 responsive layout, offline/status treatments, dialog, QR, cards, forms, and bottom navigation.

- [x] Add the neutral token set and responsive phone shell.
- [x] Add accessible focus, pressed, disabled, error, and live status treatments.
- [x] Update document metadata for the prototype.
- [x] Run the focused tests and type checker.

### Task 4: Final verification

**Files:**
- Review: all files changed by Tasks 1-3.

**Interfaces:**
- Consumes: the complete prototype.
- Produces: verified local prototype source.

- [x] Run `npm test` and confirm all tests pass.
- [x] Run `npm run typecheck` and confirm it exits successfully.
- [x] Run `npm run lint` and confirm it exits successfully.
- [x] Run `npm run build` and confirm the production build succeeds.
- [x] Start the local development server and open the compiled prototype preview.
