# Room-ready notification implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

| | |
|---|---|
| **Status** | `Complete` |
| **Created** | 2026-09-10 |
| **Updated** | 2026-09-10 |
| **Owner** | Kenanaiah |
| **Branch / worktree** | `codex/room-ready-notification` — created via `superpowers:using-git-worktrees` |
| **Spec** | `docs/superpowers/specs/2026-09-10-room-ready-notification-design.md` |
| **Ledger** | `.superpowers/sdd/2026-09-10-room-ready-notification/progress.md` |

**Goal:** Simulate a PMS room-release event through a global prototype toolbar, show a push-style notification, and keep every room surface synchronized.

**Architecture:** Add one pure model helper for the guarded `assigned → ready` transition. Keep temporary notification state and navigation inside `GuestAppPrototype`, with prototype-only toolbar and notification surfaces outside the guest-app shell.

**Tech Stack:** Next.js 16.3.4 App Router, React 19.2.8, TypeScript, CSS, Vitest, Testing Library

## Global constraints

- Run `npm run typecheck && npm run lint && npm run build && npm test` with fresh successful output before claiming completion.
- Keep `2026-09-09-room-assignment-states-design.md` authoritative for room-state meaning and copy.
- Cabana never assigns or releases a room; the simulation represents a PMS event.
- Do not assume all properties support `reportsRoomReadiness`.
- Keep the toolbar outside `.guest-app`.
- Use pink only for a primary action, current selection, or live state.
- Give the floating notification a shadow and no hairline.
- Keep every interactive target at least 44 CSS pixels.
- Do not call `setState` directly in an effect body or write refs during render.
- Preserve unrelated working-tree changes.
- Do not commit unless the human partner explicitly asks.

## Progress

| # | Task | Status | Started | Completed | Commit |
|---|---|---|---|---|---|
| 1 | Guarded room-ready transition | ✅ Complete | 2026-09-10 | 2026-09-10 | not requested |
| 2 | Prototype toolbar and simulated push | ✅ Complete | 2026-09-10 | 2026-09-10 | not requested |
| 3 | Verification and documentation | ✅ Complete | 2026-09-10 | 2026-09-10 | not requested |

---

### Task 1: Guarded room-ready transition

**Files:**
- Modify: `src/components/features/guest-app/prototype-model.ts`
- Test: `src/components/features/guest-app/prototype-model.test.ts`

**Interfaces:**
- Consumes: `Booking` and `describeRoomAssignment(booking: Booking): RoomAssignmentView`.
- Produces: `markRoomReady(booking: Booking, roomReadyAt: string): Booking`.

- [x] **Step 1: Write the failing model tests**

Add `markRoomReady` to the imports and add these cases to the room-assignment suite:

```ts
it('marks only an assigned, readiness-capable room as ready', () => {
  const assigned = { ...base, roomAssignment: 'assigned' as const, roomNumber: '512' };
  expect(markRoomReady(assigned, '2:15 PM')).toEqual({
    ...assigned,
    roomAssignment: 'ready',
    roomReadyAt: '2:15 PM',
  });
});

it('does not invent readiness for an ineligible booking', () => {
  const pending = { ...base, roomAssignment: 'pending' as const, roomNumber: undefined };
  const legacy = { ...base, roomAssignment: 'assigned' as const, roomNumber: '512', reportsRoomReadiness: false };
  const ready = { ...base, roomAssignment: 'ready' as const, roomNumber: '512' };
  expect(markRoomReady(pending, '2:15 PM')).toBe(pending);
  expect(markRoomReady(legacy, '2:15 PM')).toBe(legacy);
  expect(markRoomReady(ready, '2:15 PM')).toBe(ready);
});
```

- [x] **Step 2: Run the focused test and verify it fails**

Run `npm test -- --run src/components/features/guest-app/prototype-model.test.ts`.

Expected: FAIL because `markRoomReady` is not exported.

- [x] **Step 3: Implement the pure transition**

Add this function after `describeRoomAssignment`:

```ts
export function markRoomReady(booking: Booking, roomReadyAt: string): Booking {
  const assignment = describeRoomAssignment(booking);
  if (
    booking.status !== 'upcoming'
    || assignment.state !== 'assigned'
    || !booking.roomNumber
    || booking.reportsRoomReadiness === false
  ) {
    return booking;
  }
  return { ...booking, roomAssignment: 'ready', roomReadyAt };
}
```

- [x] **Step 4: Verify the model task**

Run:

```bash
npm test -- --run src/components/features/guest-app/prototype-model.test.ts
git diff --check -- src/components/features/guest-app/prototype-model.ts src/components/features/guest-app/prototype-model.test.ts
```

Expected: PASS and no whitespace errors. Do not commit.

---

### Task 2: Prototype toolbar and simulated push

**Files:**
- Modify: `src/components/features/guest-app/guest-app-prototype.tsx`
- Modify: `src/components/features/guest-app/guest-app-prototype.css`
- Test: `src/components/features/guest-app/guest-app-prototype.test.tsx`

**Interfaces:**
- Consumes: `markRoomReady`, `describeRoomAssignment`, the primary booking, connection state, and `go('stay-overview')`.
- Produces: internal prototype toolbar and room-ready notification surfaces.

- [x] **Step 1: Write the failing eligible-journey test**

Create an upcoming assigned booking with completed pre-arrival work. Assert that
the toolbar is outside `.guest-app`, activate the simulation, and verify the
push and synchronized stay copy:

```tsx
const toolbar = screen.getByRole('region', { name: 'Prototype controls' });
expect(container.querySelector('.guest-app')?.contains(toolbar)).toBe(false);
await user.click(screen.getByRole('button', { name: 'Simulate room ready' }));
expect(screen.getByRole('region', { name: 'Room-ready notification' })).toBeInTheDocument();
expect(screen.getByText('Room 512 is ready')).toBeInTheDocument();
expect(screen.getByText('Released at 2:15 PM. Go straight up.')).toBeInTheDocument();
expect(screen.queryByRole('button', { name: 'Simulate room ready' })).toBeNull();
await user.click(screen.getByRole('button', { name: 'View stay' }));
expect(screen.queryByRole('region', { name: 'Room-ready notification' })).toBeNull();
expect(screen.getByTestId('guest-home-upcoming')).toHaveTextContent('Room 512 is ready');
```

- [x] **Step 2: Write failing boundary and dismissal tests**

Add cases that prove:

- Offline keeps `Simulate room ready` disabled and shows `Reconnect to receive a new PMS event.`
- `reportsRoomReadiness: false` exposes no simulation action and retains the front-desk copy.
- Advancing fake timers by 8,000 milliseconds dismisses only the notification; the booking remains ready.
- Focus inside the notification pauses the timer until focus leaves.
- Completed, pending, missing-room, and already-ready fixtures expose no simulation action.
- `View stay` does not add a duplicate history entry when the overview is already active.

- [x] **Step 3: Run the focused component test and verify it fails**

Run `npm test -- --run src/components/features/guest-app/guest-app-prototype.test.tsx`.

Expected: FAIL because the prototype toolbar and notification do not exist.

- [x] **Step 4: Implement state and event handling**

Import `BellRinging`, `X`, and `markRoomReady`. Store
`roomReadyNotificationBookingId: string | null`. Derive eligibility from the
primary booking: its derived state must be `assigned`, it must have a room
number, and `reportsRoomReadiness` must not be false.

Use this transition:

```ts
const simulateRoomReady = () => {
  if (!eligibleRoomReadyBooking || !online) return;
  setSession((current) => ({
    ...current,
    bookings: current.bookings.map((booking) =>
      booking.id === eligibleRoomReadyBooking.id
        ? markRoomReady(booking, '2:15 PM')
        : booking,
    ),
  }));
  setRoomReadyNotificationBookingId(eligibleRoomReadyBooking.id);
};
```

Dismiss after eight seconds from a timer callback, not from the effect body:

```ts
useEffect(() => {
  if (!roomReadyNotificationBookingId || roomReadyNotificationFocused) return;
  const timeout = window.setTimeout(
    () => setRoomReadyNotificationBookingId(null),
    8_000,
  );
  return () => window.clearTimeout(timeout);
}, [roomReadyNotificationBookingId, roomReadyNotificationFocused]);
```

The notification reports focus changes to the parent. Its timer restarts only
after focus leaves the notification, which preserves the approved automatic
dismissal without removing a control that a keyboard user is operating.

- [x] **Step 5: Render the surfaces outside `.guest-app`**

Wrap the existing main element in `.guest-prototype-stage`. Render the
`Prototype controls` region and the `Room-ready notification` region as siblings
of the main element. The push contains `Cabana · now`, the derived headline and
detail, `View stay`, and `Dismiss notification`. `View stay` dismisses the push
and calls `go('stay-overview')` only when that screen is not already active.

- [x] **Step 6: Style the two prototype surfaces**

Use fixed positioning and `transform: translateX(-50%)`, never standalone
`translate`. The toolbar has a dashed boundary to identify prototype
infrastructure. The floating push has a shadow and no border. Buttons have a
minimum height of 44px. Reduced motion removes movement but keeps opacity.

- [x] **Step 7: Verify the component task**

Run:

```bash
npm test -- --run src/components/features/guest-app/guest-app-prototype.test.tsx
npm run typecheck
npm run lint -- src/components/features/guest-app/guest-app-prototype.tsx
git diff --check -- src/components/features/guest-app/guest-app-prototype.tsx src/components/features/guest-app/guest-app-prototype.css src/components/features/guest-app/guest-app-prototype.test.tsx
```

Expected: every command exits successfully. Do not commit.

---

### Task 3: Verification and documentation

**Files:**
- Update: `docs/superpowers/plans/2026-09-10-room-ready-notification.md`
- Update: `docs/superpowers/specs/2026-09-10-room-ready-notification-design.md`
- Review: every file changed by Tasks 1 and 2.

**Interfaces:**
- Consumes: the complete room-ready simulation.
- Produces: fresh verification evidence and accurate document status.

- [x] **Step 1: Run the complete verification gate**

Run `npm run typecheck && npm run lint && npm run build && npm test`.

Expected: every command exits successfully and the 162-test baseline increases
by the new room-ready tests.

- [x] **Step 2: Verify the mobile browser journey**

At 390 × 844, open an assigned upcoming stay, select `Simulate room ready`,
confirm that the push names Room 512 and `2:15 PM`, select `View stay`, and
confirm that the home shows the same ready copy. Measure 44-pixel targets and
confirm no horizontal overflow.

- [x] **Step 3: Inspect the final diff**

Run `git diff --check`, `git status --short`, and `git diff --stat`.

Expected: no whitespace errors, no unrelated paths altered by this feature,
and no commit created.

- [x] **Step 4: Close the documents**

Mark every implemented checkbox and progress row complete. Set this plan to
`Complete` and the spec to `Implemented`, with `Updated` set to `2026-09-10`.
