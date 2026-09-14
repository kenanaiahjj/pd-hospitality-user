# Experiment flows

Candidate flows, iterated in isolation and built to be promoted into the guest
app once they are judged good. They are not a sandbox for throwaway ideas —
separation exists so the real flow's logic cannot be broken while a candidate
is being pulled apart, not because the work is disposable.

## Opening one

By URL — `/?flow=qr-scan`, `/?flow=explore` — which is the way to send someone
a candidate without a sentence explaining which panel to open. `/` with no
parameter, or `?flow=guest`, is the real app.

Or from prototype controls → **Flow**. Switching there writes the parameter
back, so the address bar is always a link to what is on screen. The guest-flow
controls (stay state, gates, lookup) hide while an experiment is showing,
since they have nothing to act on.

A new experiment is addressable for free: add a row to `EXPERIMENT_FLOWS` and
its id becomes a valid `?flow=` value.

## The shape that makes promotion cheap

Each experiment splits in two.

**Candidates** are presentational components written to a props contract the
guest app can already satisfy. `RoomScanner` takes `onDetected` / `onCancel` /
`roomNumber`, which the app already has as `scanRoomCode`, `back` and
`primaryBooking?.roomNumber`. Promotion is an import and four props.

**The harness** — `*Experiment.tsx` — stands in for the app while a candidate
is being worked on. It owns the stage and hands the candidate demo callbacks.
It is the file that gets deleted on promotion, never moved.

## Rules that keep them separable

- No `GuestSession`, no `session-storage`, no `ActiveScreen`, no `setSession`.
  Reading `prototype-model` catalogue data is fine — that is data, not flow.
- The guest app imports `./experiments` and nothing deeper.
- Same tokens, same components, own stylesheet (`experiments.css`).

Both rules are enforced by `experiments.test.tsx`, which fails on a deep
import or a session reference.

## Promoting one

1. Move the candidate out of `experiments/` into the guest app's components.
2. Replace the harness's demo callbacks with the app's real handlers.
3. Delete the harness and its registry row.
4. Point the relevant screen at the new component.

## Assets

`RoomUnlocked` reads `UNLOCKED_ART` — one path constant at the top of
`room-unlocked.tsx`. Drop a file in `public/illustrations/` and change that
line.
