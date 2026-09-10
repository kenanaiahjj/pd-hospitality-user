# Booking lookup copy refinement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the connected booking flow concise and human without changing its routes, state behavior, layout system, or booking semantics.

**Architecture:** Keep the copy in the existing GuestAppPrototype render switch and shared BOOKING_ENTRY_OPTIONS data. Update the existing guest-app test file to assert the new labels and preserve the lookup-to-confirmation-to-stay journey. No new abstraction or component is needed.

**Tech Stack:** Next.js 16.3.4, React 19, TypeScript, Vitest, Testing Library, Asbir Sans, and the existing Cabana guest-app CSS.

## Global Constraints

- Keep the current visual system, route structure, fixture data, and state behavior unchanged.
- Do not add booking search, validation, network behavior, screens, components, or design tokens.
- Keep the prototype fallback transition to front-desk-assist; the label must describe that existing destination.
- Use sentence case, direct verbs, consistent booking terminology, and plain language.
- Keep hotel, Agoda, and Booking.com reference guidance without using OTA as user-facing jargon.
- Preserve the stay-only product scope: the guest already has a hotel booking.

## File map

- Modify: src/components/features/guest-app/guest-app-prototype.tsx — shared entry-option labels and copy for the six connected booking states.
- Modify: src/components/features/guest-app/guest-app-prototype.test.tsx — updated copy assertions and journey coverage.
- Reference: docs/superpowers/specs/2026-09-10-booking-lookup-copy-design.md — approved copy and scope.

### Task 1: Add failing assertions for the approved copy

Files:
- Modify: src/components/features/guest-app/guest-app-prototype.test.tsx:134-212,529-542

Interfaces:
- Consumes: GuestAppPrototype and the existing Testing Library helpers.
- Produces: regression coverage for the approved copy and existing lookup journey.

- [ ] Step 1: Replace the shared entry role name Booking email with Confirmation number in the two existing booking journeys.
- [ ] Step 2: Replace the matched-booking role name Yes, this is my stay with Use this booking in the two existing confirmation journeys.
- [ ] Step 3: Replace the no-booking test assertions with Connect a hotel booking, Cabana connects to confirmed hotel bookings., Try your confirmation number or ask the front desk for a link., and Contact front desk.
- [ ] Step 4: Add a test that renders connect-booking, asserts Choose how to connect your stay. and the absence of You’ll need a booking first, opens Confirmation number, and asserts the new lookup lead, HEN-241109 example, Hotel, Agoda, or Booking.com reference helper, and Find another way.
- [ ] Step 5: In the same test, unmount, render lookup-fallback, assert Use more booking details and Enter the details from your booking., assert No match yet is absent, click Continue to front desk, and assert Let the front desk connect you, Ask for a secure link or a 6-digit code., and the Call front desk accessible label.
- [ ] Step 6: Add matched-booking assertions for Booked through and Use a different booking.

The new state-coverage test must use the existing helpers:

```tsx
const { unmount } = render(<GuestAppPrototype initialScreen='connect-booking' />);
unmount();
render(<GuestAppPrototype initialScreen='lookup-fallback' />);
await user.click(screen.getByRole('button', { name: 'Continue to front desk' }));
```

- [ ] Step 7: Run the focused test file before implementation.

```bash
npx vitest run src/components/features/guest-app/guest-app-prototype.test.tsx --maxWorkers=1
```

Expected: the updated assertions fail on old labels such as Booking email, Yes, this is my stay, and You’ll need a booking first. Existing unrelated tests must not introduce a new failure.

### Task 2: Implement the approved copy

Files:
- Modify: src/components/features/guest-app/guest-app-prototype.tsx:348-362,1245-1276

Interfaces:
- Consumes: BOOKING_ENTRY_OPTIONS, ScreenIntro, Notice, Field, TextButton, and primary.
- Produces: the same screen transitions with the approved visible and accessible copy.

- [ ] Step 1: Update BOOKING_ENTRY_OPTIONS without changing destinations or artwork.

```tsx
const BOOKING_ENTRY_OPTIONS = [
  {
    screen: 'identify' as const,
    label: 'Confirmation number',
    title: 'Confirmation number',
    detail: 'From your hotel or booking site',
    art: ENTRY_ILLUSTRATIONS.bookingEmail,
  },
  {
    screen: 'room-qr-landing' as const,
    label: 'Room QR',
    title: 'Room QR',
    detail: 'Scan the code in your room',
    art: ENTRY_ILLUSTRATIONS.roomQr,
  },
];
```

- [ ] Step 2: Update the six existing render branches using the copy below, preserving each branch’s existing JSX structure and handlers.

| State | Exact copy changes |
| --- | --- |
| connect-booking | Lead: Choose how to connect your stay. Remove the booking-required Notice. |
| identify | Lead: Enter the number from your booking confirmation. Example: HEN-241109. Helper: Hotel, Agoda, or Booking.com reference. Last-name example: Santos. Secondary action: Find another way. |
| lookup-fallback | Eyebrow: Try another way. Title: Use more booking details. Lead: Enter the details from your booking. Remove the No match yet Notice. Primary action: Continue to front desk. |
| front-desk-assist | Eyebrow: Front desk help. Title: Let the front desk connect you. Lead: Ask for a secure link or a 6-digit code. Icon-button label: Call front desk. |
| no-booking | Eyebrow: No booking found. Title: Connect a hotel booking. Lead: Cabana connects to confirmed hotel bookings. Notice body: Try your confirmation number or ask the front desk for a link. Secondary action: Contact front desk. |
| booking-found | Eyebrow: Booking found. Lead: Check the details, then continue. Summary label: Booked through. Primary action: Use this booking. Secondary action: Use a different booking. |

The fallback action must still navigate to front-desk-assist. The matched-booking action must still call claimBooking, and the alternate-booking action must still return to identify.

- [ ] Step 3: Run the focused test file after implementation.

```bash
npx vitest run src/components/features/guest-app/guest-app-prototype.test.tsx --maxWorkers=1
```

Expected: the full guest-app test file passes, including room QR, account, pre-arrival, and existing navigation coverage.

### Task 3: Verify the full surface and clean handoff

Files:
- Verify: src/components/features/guest-app/guest-app-prototype.tsx
- Verify: src/components/features/guest-app/guest-app-prototype.test.tsx
- Verify: docs/superpowers/specs/2026-09-10-booking-lookup-copy-design.md

Interfaces:
- Consumes: the implemented connection copy and existing guest-app tests.
- Produces: a verified, minimal working-tree diff with no stale copy in the scoped states.

- [ ] Step 1: Scan both source files for the stale scoped strings listed in the approved spec. Expected: no stale user-facing matches in the refined states.
- [ ] Step 2: Run npm test -- --maxWorkers=1, npm run lint, npm run typecheck, npm run build, and git diff --check. Expected: every command exits with status 0.
- [ ] Step 3: Inspect git status --short, git diff --stat, and the two-file diff. Expected: only the component and test file contain implementation changes; no route, data-model, or unrelated worktree changes appear.
- [ ] Step 4: Commit the implementation with git add -- src/components/features/guest-app/guest-app-prototype.tsx src/components/features/guest-app/guest-app-prototype.test.tsx followed by git commit -m 'refine booking lookup copy'. Expected: one scoped implementation commit.
