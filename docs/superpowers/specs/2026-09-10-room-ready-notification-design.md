# Room-ready notification design

> Produced by `superpowers:brainstorming` (architectural path). Once this
> document is `Approved`, the only next skill is `superpowers:writing-plans`.

| | |
|---|---|
| **Status** | `Implemented` |
| **Created** | 2026-09-10 |
| **Updated** | 2026-09-10 |
| **Owner** | Kenanaiah |
| **Plan** | `docs/superpowers/plans/2026-09-10-room-ready-notification.md` (once written) |
| **Supersedes** | `n/a` |
| **Superseded by** | `n/a` |

**Status values:** `Draft` → `In Review` (user reading it) → `Approved` (plan
may be written) → `Implemented`. Off-ramps: `Superseded` (link the replacement)
and `Abandoned` (say why in the Decision Log).

This spec is the binding authority during execution. It extends
`2026-09-09-room-assignment-states-design.md`; that spec remains authoritative
for room-state meaning and copy.

---

## Summary

Add a visible prototype control that simulates a capable property reporting
that an assigned room is ready. The event updates the booking, shows a
push-style notification, and leaves every in-app room surface synchronized
through `describeRoomAssignment`.

The control belongs to a global prototype toolbar outside the Cabana mobile
shell. It must never look like a guest-facing action or imply that Cabana
assigns or releases rooms.

## Context

`Booking` and `describeRoomAssignment` already model
`pending → assigned → ready`, including the `reportsRoomReadiness` capability
boundary. The current prototype advances to `ready` only when the guest enters
through a room QR, where arrival itself proves that the room was released.
There is no way to demonstrate the earlier and more valuable event: the PMS
reports that housekeeping has released the room and Cabana tells the guest.

The property capability remains an integration assumption. Some legacy
on-premise PMSs report allocation but not housekeeping status. The prototype
must preserve the existing behavior for those properties instead of promising
a notification that cannot arrive.

## Non-goals

- Do not request browser notification permission or use a service worker.
- Do not claim that the prototype sends a real operating-system push.
- Do not poll a PMS, add an API, or add background synchronization.
- Do not let a guest request, accelerate, assign, or release a room.
- Do not infer that every property supports readiness reporting.
- Do not redesign room-assignment copy or the stay overview.

## Success criteria

- [x] A global `Prototype controls` toolbar appears outside the guest-app shell
      when the primary booking is assigned and readiness-capable.
- [x] Selecting `Simulate room ready` changes only that eligible booking to
      `ready` and records the deterministic prototype release time `2:15 PM`.
- [x] The simulated event shows a push-style notification containing the room
      number and a clear `View stay` action.
- [x] Selecting the notification opens the stay overview and dismisses the
      notification.
- [x] The stay overview immediately renders the existing derived ready copy,
      including the assigned room number and `Released at 2:15 PM. Go straight
      up.`
- [x] The notification dismisses automatically after 8 seconds of inactivity
      without reverting the booking to `assigned`; keyboard focus pauses the
      timer until focus leaves the notification.
- [x] No simulation action appears for completed, `pending`, `ready`,
      missing-room, or `reportsRoomReadiness: false` bookings.
- [x] The action is disabled while offline and explains that a new PMS event
      requires a connection.
- [x] The toolbar, notification action, and dismiss action each clear a
      44-CSS-pixel target.
- [x] `npm run typecheck && npm run lint && npm run build && npm test` exits
      successfully with fresh output.

---

## Approaches considered

### Selected: Simulated push with a global prototype toolbar

Place the simulation control outside the mobile shell. Activating it changes
the booking state and surfaces a push-style notification that links back to the
stay.

**Why:** The control is always easy to find during a demo while remaining
visually separate from Cabana's guest-facing interface. The simulated push
demonstrates the notification moment and the synchronized in-app result.

**Costs:** The toolbar is prototype infrastructure that must not ship as
product UI. The push is an in-page representation, not proof that browser or
native notification delivery works.

### Alternative: Automatic simulated event

Advance an eligible booking after a timer. **Rejected because:** Timing makes
demos and tests less controllable, and an automatic release can interrupt a
guest flow without explaining that it is simulated.

### Alternative: Put the control in the room card

Add `Simulate room ready` beside the assigned-room copy. **Rejected because:**
It makes a prototype mechanism look like a guest can influence housekeeping.

---

## Design

### Architecture

Keep the feature inside the existing in-memory prototype boundary. A pure
model helper validates and applies the room-state transition. The React
component owns the temporary notification state, its dismissal timer, and
navigation. CSS renders the toolbar outside `.guest-app` and the simulated
push above the app without changing Cabana's design tokens or screen layout.

No HTTP client, API route, query factory, service worker, or browser permission
is involved.

### Components

**`src/components/features/guest-app/prototype-model.ts`**
- **Does:** Apply an eligible `assigned → ready` transition without weakening
  the PMS capability boundary.
- **Used as:** Export
  `markRoomReady(booking: Booking, roomReadyAt: string): Booking`.
- **Depends on:** `Booking`, `RoomAssignmentState`, and the existing inference
  rules used by `describeRoomAssignment`.

**`src/components/features/guest-app/guest-app-prototype.tsx`**
- **Does:** Render the prototype toolbar and push-style notification, update
  the selected booking, dismiss the notification, and open the stay overview.
- **Used as:** Internal `PrototypeControls` and `RoomReadyNotification`
  components within `GuestAppPrototype`; no new public component export.
- **Depends on:** `markRoomReady`, `describeRoomAssignment`, the current
  session, current connection state, and existing screen navigation.

**`src/components/features/guest-app/guest-app-prototype.css`**
- **Does:** Visually separate prototype infrastructure from the Cabana shell
  and style the notification as a temporary system-like surface.
- **Used as:** `.guest-prototype-toolbar` and `.guest-room-ready-notification`
  classes with focused descendants.
- **Depends on:** Existing neutral tokens, motion durations, focus styles, and
  mobile breakpoints. The push floats with a shadow and no hairline.

**`src/components/features/guest-app/prototype-model.test.ts`**
- **Does:** Prove the transition accepts only assigned, readiness-capable
  bookings with a room number.
- **Used as:** Vitest unit coverage for `markRoomReady`.
- **Depends on:** `prototype-model.ts` only.

**`src/components/features/guest-app/guest-app-prototype.test.tsx`**
- **Does:** Prove the visible toolbar, simulated push, navigation, offline
  state, automatic dismissal, and unsupported-property behavior.
- **Used as:** Testing Library coverage with fake timers only for the
  eight-second dismissal.
- **Depends on:** `GuestAppPrototype`, deterministic session fixtures, and the
  existing `matchMedia` shim.

### Data flow

```text
Assigned, readiness-capable booking
  └── Prototype controls: Simulate room ready
        └── markRoomReady(booking, "2:15 PM")
              ├── session booking becomes ready
              └── notification stores that booking ID
                    ├── describeRoomAssignment supplies notification copy
                    ├── 8-second timer dismisses the notification only
                    └── View stay dismisses it and opens stay-overview
                          └── describeRoomAssignment supplies ready-state copy
```

The toolbar chooses the primary booking only when it is `upcoming`, its derived
room state is `assigned`, it has a room number, and
`reportsRoomReadiness !== false`. The prototype does not search for another
eligible booking behind the guest's current booking context.

### Interfaces and contracts

```ts
export function markRoomReady(
  booking: Booking,
  roomReadyAt: string,
): Booking;
```

The helper returns the original booking unchanged unless all conditions are
true:

- `booking.status === 'upcoming'`;
- `describeRoomAssignment(booking).state === 'assigned'`;
- `booking.roomNumber` exists;
- `booking.reportsRoomReadiness !== false`.

For an eligible booking, the helper returns a copy with
`roomAssignment: 'ready'` and the supplied `roomReadyAt`. It does not change
the stay status, room number, preferences, folio, or any other booking.

The component stores only the notified booking ID. It derives the room number,
headline, and detail from the updated session and `describeRoomAssignment`, so
the simulated push and stay screen cannot drift into different room copy.

### Interaction and presentation

The toolbar is labeled `Prototype controls` and sits outside the app's mobile
frame. Its action is `Simulate room ready`. The action remains visible but
disabled while offline, with the supporting text `Reconnect to receive a new
PMS event.` Once the simulation succeeds, the readiness action disappears
because the booking is no longer eligible.

The push-style notification appears above the guest shell and contains:

- `Cabana · now`;
- the derived headline, for example `Room 512 is ready`;
- the derived detail, `Released at 2:15 PM. Go straight up.`;
- a `View stay` action;
- a separately labeled `Dismiss notification` action.

The notification uses a shadow without a hairline because it floats. Cabana
pink marks only the live notification indicator or action focus, not the
notification background. Reduced motion removes translation while retaining a
brief opacity transition. The eight-second dismissal timer pauses while focus
is inside the notification and restarts when focus leaves, so a keyboard or
assistive-technology user does not lose an action while using it.

If `View stay` is selected while the stay overview is already active, the
notification closes without adding a duplicate screen to navigation history.

### Error handling

| Condition | Result |
|---|---|
| Offline | Keep the action disabled and show the reconnect explanation. |
| `reportsRoomReadiness: false` | Do not render the simulation action; retain the existing front-desk room copy. |
| Pending assignment | Do not render the simulation action because no room can be announced. |
| Missing room number | Do not render the simulation action; `describeRoomAssignment` continues to degrade the booking to `pending`. |
| Already ready | Do not render the simulation action and do not enqueue another notification. |
| Completed stay | Do not render the simulation action or mutate historical room state. |
| Focus inside the notification | Pause automatic dismissal; restart the eight-second timer after focus leaves. |
| Notification times out | Dismiss the push only; keep the booking `ready`. |

### Testing

Model tests must cover a successful transition and unchanged returns for
completed, pending, unsupported, missing-room, and already-ready bookings.

Component tests must confirm that:

- the toolbar sits outside `.guest-app` and appears for an eligible fixture;
- the control disappears after activation;
- the push names the correct room and release time;
- `View stay` opens the synchronized ready state;
- `View stay` does not duplicate an already-active stay overview in history;
- dismiss and the eight-second timeout remove only the push;
- focus inside the push pauses automatic dismissal;
- offline disables the action and preserves `assigned`;
- an unsupported property exposes neither the action nor a readiness promise;
- all new interactive targets meet the 44-pixel CSS contract.

Browser verification must use a 390 × 844 viewport. Start from an assigned
upcoming stay, activate the global control, select the push, and confirm that
the stay overview shows the same ready copy without horizontal overflow.

---

## Global constraints

- The verification gate is `npm run typecheck && npm run lint && npm run build && npm test` with fresh successful output before completion is claimed.
- The architecture invariants in `CLAUDE.md` are binding.
- `2026-09-09-room-assignment-states-design.md` remains authoritative for room-state meaning and copy.
- Cabana never assigns or releases a room; the simulation represents a PMS event.
- `reportsRoomReadiness` remains an unverified integration assumption and must not default into a universal product promise.
- The toolbar must remain outside the guest-facing `.guest-app` shell.
- Pink remains limited to a primary action, current selection, or live state.
- A floating notification takes a shadow and no hairline.
- Every interactive element must clear a 44-CSS-pixel target.
- React Compiler rules are errors: do not call `setState` directly in an effect body and do not write refs during render.
- Preserve unrelated working-tree changes.
- Do not commit unless the human partner explicitly asks; if asked, create a branch before committing.

## Open questions

None for the prototype implementation. Property-by-property support for
`reportsRoomReadiness` remains a production integration validation, not an
implementation decision for this prototype.

## Decision log

| Date | Decision | Why | Cost if wrong |
|---|---|---|---|
| 2026-09-10 | Show a simulated push and synchronize the stay state. | The notification moment is the feature's value; a state-only change is too easy to miss. | Replace the push component while retaining the model transition. |
| 2026-09-10 | Trigger readiness through a visible prototype control. | The human partner selected a deterministic manual event instead of timing-dependent automation. | Replace the toolbar action with another event source. |
| 2026-09-10 | Place the control in a global toolbar outside `.guest-app`. | This keeps simulation infrastructure distinct from guest actions. | Move the trigger surface without changing room-state logic. |
| 2026-09-10 | Use a deterministic `2:15 PM` release time and an eight-second dismissal. | Stable fixtures keep demos and tests repeatable while leaving enough time to read and act. | Change test fixtures and timing constants. |
| 2026-09-10 | Keep unsupported properties out of the simulation. | Legacy PMSs might never emit a housekeeping release event. | Add properties only after their capability is verified. |

---

## Before marking this spec In Review

- [x] **Placeholder scan** — no `TBD`, `TODO`, empty sections, or vague requirements.
- [x] **Internal consistency** — the architecture, components, data flow, and tests describe the same event.
- [x] **Scope check** — the feature remains one in-memory prototype increment.
- [x] **Ambiguity check** — trigger, eligibility, copy source, timing, navigation, and unsupported states are explicit.
- [x] **Status block filled** — status, dates, owner, and plan path are set.
