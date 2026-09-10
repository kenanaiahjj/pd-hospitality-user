# Room Assignment States Design

| | |
|---|---|
| **Status** | `Implemented` |
| **Created** | 2026-09-09 |
| **Updated** | 2026-09-09 |
| **Owner** | <human partner> |
| **Plan** | direct increment — no separate plan file |
| **Supersedes** | `n/a` |
| **Superseded by** | `n/a` |

This spec is the binding authority during execution: when a plan and this
document disagree, this document wins.

---

## Summary

`Booking.roomNumber` was a binary — either the app knew a room or it did not —
which left no way to express the one window guests actually ask about: a room
allocated but not yet released by housekeeping. Room assignment is now a
three-state affair, with the copy for each state derived in one place.

## The constraint this is built around

**Cabana never assigns a room.** Allocation is the property's operation, run by
its PMS against its own inventory. These states only ever reflect what the
middleware can read back, which is why every string avoids implying the guest
can hurry it along.

## States

| State | Room number | Guest can go up | Means |
|---|---|---|---|
| `pending` | unknown | no | The property has not allocated yet |
| `assigned` | known | no | A specific room is held, housekeeping has not released it |
| `ready` | known | yes | Released; the guest can walk up |

`pending → assigned` happens when pre-registration reaches the property, since
that is what prompts allocation. `assigned → ready` happens on release.

## The heterogeneous-PMS problem

The estate runs legacy on-premise systems alongside cloud ones. **Some report
an allocated room but nothing about whether it is clean.** A state model that
assumed every property could report housekeeping status would leave those
stays sitting in `assigned` forever, waiting on a signal that is never sent,
while the app promised "we'll tell you when it's ready".

So `reportsRoomReadiness` is explicit, defaults to true, and when false the
`assigned` copy sends the guest to the desk instead of promising a moment that
will not arrive. **This flag is the assumption most worth checking against what
Cloudbeds and the legacy properties can actually report** — the states are
right, but which properties can fill them is an integration question.

## Design rules

- `roomNumber` stays the single home for the number. The state describes it
  rather than restating it, so the two cannot drift.
- All copy comes from `describeRoomAssignment`, so the home card, the stay
  screen and the arrival timeline cannot describe one room three ways.
- State is **inferred** when a booking carries none: a stay the guest is
  already in reads `ready`, a booking with a number reads `assigned`, anything
  else reads `pending`. Every pre-existing fixture stays valid unchanged.
- `ready` without a number is impossible: it degrades to `pending` rather than
  announcing a room it cannot name.
- Honoured preferences are echoed back after allocation. This is the payoff for
  moving preferences out of check-in and onto the profile — a step-free room is
  an allocation constraint, not a nice-to-have.

## Verification

Automated tests must confirm that:

- `pending` promises no number and states the hotel allocates from its own
  inventory;
- `assigned` promises a readiness moment **only** where the PMS reports one,
  and sends the guest to the desk where it does not;
- `ready` lets the guest go up, and names the release time when known;
- a booking carrying no state infers one, so old fixtures stay valid;
- `ready` with no room number degrades to `pending`;
- completing pre-registration moves the stay from `pending` to `assigned` and
  echoes the honoured preferences.

## Decision log

- **2026-09-09** — Flat fields on `Booking` rather than a nested
  `RoomAssignment` object, so the room number keeps exactly one home and
  cannot drift from a copy inside the state.
- **2026-09-09** — `reportsRoomReadiness` added rather than assuming universal
  housekeeping reporting. Built on the stated assumption that a capable PMS
  reports release; unverified against the legacy estate.
- **2026-09-09** — Copy lives in the deriver, not the components. Three
  surfaces describe the same room, and the codebase already treats drift
  between two descriptions of one thing as the failure mode to design out.
