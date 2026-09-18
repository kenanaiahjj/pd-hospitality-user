# Explore and QR promotion implementation plan

> **Execution note:** Follow this plan task by task. Use the test-driven
> development workflow: write each focused regression first, run it red, make
> the smallest implementation change, then rerun the focused test before
> continuing.

## Outcome

Promote the approved Explore and QR interactions from
`experiment/qr-and-explore` into `main` without promoting the experiment
harnesses or moving ownership of production session and booking state.

## Task 1: Add red tests for the production promotion seams

Files:

- Add `src/components/features/guest-app/promoted/promoted-flow.test.tsx`.
- Update `src/components/features/guest-app/guest-app-prototype.test.tsx`.
- Update `src/components/features/guest-app/prototype-model.test.ts` only where
  an existing assertion describes the intended current contract.

Tests to write first:

1. Render the promoted `RoomScanner` with a finite auto-detect delay and
   verify that detection calls the supplied callback; verify cancel and the
   accessible close label.
2. Render `RoomScanner` with `autoDetectMs={null}` and verify it does not
   detect by itself; verify the photo action is optional.
3. Render `RoomUnlocked` with booking values and verify the Explore and Back
   actions call their supplied callbacks.
4. Render the promoted `DiscoverFeed` with small fixture data and verify the
   story, banner, item, category, browse-all, search, and deck callback seams.
5. Render `GuestAppPrototype` in an unlocked active session and verify the
   `marketplace` route exposes the promoted feed, not the old catalogue.
6. Verify the locked active-session marketplace still exposes “Scan room code”
   and does not render the feed.
7. Verify a successful scan lands on the promoted unlock state, and verify
   both unlock actions route to Explore and My Stay.
8. Verify the existing cancellation model preserves “Cancelled · not charged”
   for a cancelled service instead of treating it as a completed charge.
9. Update the screen-registry assertion to the current 57-entry inventory only
   after confirming the entries are intentional and unique.

Run the new focused test file and the affected existing tests. The expected
initial result is red because the production promotion modules and wiring do
not exist yet.

## Task 2: Promote the experiment’s prop-driven building blocks

Create `src/components/features/guest-app/promoted/` and copy the reviewed
prop-driven candidates from the experiment branch into that namespace. Keep
the files client-compatible and use the Next 16 client-boundary and image
rules.

Promote and adapt:

- `discover-feed.tsx`
- `ask-panel.tsx`
- `intent-model.ts`
- `story-model.ts`
- `story-viewer.tsx`
- `swipe-story-viewer.tsx`
- `swipe-story-viewer.css`
- `swipe-deck.tsx`
- `room-scanner.tsx`
- `qr-code-graphic.tsx`
- `room-unlocked.tsx`
- `confetti.tsx`
- the required story/nearby pure model helpers

Do not copy `ExploreExperiment`, `QrScanExperiment`, the experiment flow
registry, or experiment-only route components that recreate category, nearby,
service, venue, cart, or session state. Replace their callbacks with explicit
production seams.

Adapt imports so the promoted model reads the production catalogue and image
definitions. Keep the story/feed components reusable through props rather than
having them import `GuestAppPrototype`.

Use the local experiment art only where every file exists and the production
bundle can load it. Keep an explicit asset note for property-owned replacement;
do not add generated `.vite` or Vitest result files.

Run `promoted-flow.test.tsx` after each component group. The tests should move
from collection failures to behavioral failures, then pass as each contract is
implemented.

## Task 3: Wire Explore into the main app

Files:

- `src/components/features/guest-app/guest-app-prototype.tsx`
- `src/components/features/guest-app/guest-app-prototype.css`
- `src/components/features/guest-app/promoted/*` as needed

Implementation steps:

1. Import only the promoted components and pure builders from the production
   namespace.
2. Build stable feed constants from the existing services, restaurants, and
   categories.
3. Replace only the unlocked `marketplace` return branch with `DiscoverFeed`
   and its featured `SwipeDeck`.
4. Keep the existing locked branches, offline notice, tab ownership, and
   active-stay gate unchanged.
5. Route category callbacks through `setSelectedCategory` and
   `go('category-listing')`.
6. Route restaurant callbacks through `setSelectedRestaurantId` and
   `go('restaurant-menu')`.
7. Route service callbacks through the existing selected-service state and
   production service route/booking handler.
8. Route nearby callbacks into the existing nearby-establishment flow or its
   existing transfer/chat handoff. Do not add a second nearby state machine.
9. Route “Browse all” to the production category listing with a deterministic
   category selection.
10. Open deliberate story taps with `SwipeStoryViewer`; use the timed
    `StoryViewer` only for the QR success introduction.
11. Add the promoted stylesheet rules without importing the experiment-wide
    harness stylesheet.

Run the focused guest-app tests after the wiring changes. Confirm that every
Explore action either opens an existing production screen or calls the existing
booking gate.

## Task 4: Wire the scanner and success state into the main app

Files:

- `src/components/features/guest-app/guest-app-prototype.tsx`
- `src/components/features/guest-app/guest-app-prototype.css`
- `src/components/features/guest-app/promoted/room-scanner.tsx`
- `src/components/features/guest-app/promoted/room-unlocked.tsx`

Implementation steps:

1. Replace the `RoomCodeScanner` render in `scan-room-code` with `RoomScanner`.
2. Map `autoDetectScans` to `autoDetectMs`, preserving the existing demo
   toggle and reduced-motion behavior.
3. Change the successful `scanRoomCode` destination to `room-qr-midstay`
   after `verifyRoomPresence` and the toast update.
4. Replace the `room-qr-midstay` intro with `RoomUnlocked`, passing the active
   booking’s room, property, and checkout values.
5. Make Explore open the introductory story/feed handoff and make Back to my
   stay open `stay-overview`.
6. Remove the obsolete scanner implementation only after no route or test
   references it.

Run the focused QR tests with fake timers and the lifecycle gate tests. Confirm
that no scan path opens services for a guest without an active booking.

## Task 5: Repair model regressions exposed by the current suite

Files:

- `src/components/features/guest-app/prototype-model.ts`
- `src/components/features/guest-app/prototype-model.test.ts`
- affected guest-app tests

Make the smallest model fixes required by the existing contract:

- Preserve cancelled service status and the no-charge settlement text for
  cancelled entries.
- Keep the screen registry aligned with the actual intentional 57 screens.
- Update stale assertions only where the approved promotion intentionally
  changes the visible surface or QR success destination.

Do not delete tests to make the suite green. Keep failures that identify a
real unresolved behavior.

## Task 6: Remove production-facing experiment residue and verify assets

Files and checks:

- Production promoted namespace and stylesheet.
- `public/experiments/*` only for referenced prototype art.
- Existing experiment branch remains unmerged.

Check that:

- No production import references `experiments/*` harness modules.
- No generated `.vite`/Vitest results are copied into `main`.
- Every local image and video referenced by the promoted story model exists.
- No experiment-only URL flow or fake navigation state is reachable from the
  main app.
- `experiment/qr-and-explore` itself is not merged or pushed.

## Task 7: Run verification before completion

Run sequentially:

1. Focused promoted and guest-app tests.
2. Full `npm test -- --reporter=json --outputFile=/tmp/hospitality-vitest.json`.
3. `npm run lint`.
4. `npm run typecheck`.
5. `API_BASE_URL=https://jsonplaceholder.typicode.com npm run build`.
6. `git diff --check` and `git status --short --branch`.

If a command fails, diagnose the failure before changing code. Report the
exact status of tests, lint, typecheck, build, local `main`, and
`origin/main`; do not imply that pushing occurred.
