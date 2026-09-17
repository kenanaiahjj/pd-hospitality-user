# Explore and QR promotion design

## Goal

Bring the approved interaction model from `experiment/qr-and-explore` into the
production guest app on `main`:

- Replace the unlocked Explore catalogue with the editorial discovery feed,
  story rail, swipe deck, search intent, and story viewer.
- Replace the production room scanner with the experiment scanner.
- Replace the production post-scan confirmation screen with the experiment
  unlock success state.

The production app remains the source of truth for booking, room verification,
folio charging, screen navigation, and access gates.

## Approved behavior

### Explore

The `marketplace` screen keeps its existing locked branches. A guest without an
active, room-assigned, verified stay still sees the existing room-code or desk
request flow.

After the room gate is open, `marketplace` renders the promoted discovery feed:

- “Ask anything about your stay” searches the promoted catalogue and resolves
  supported intents.
- The story rail opens the promoted swipe story viewer.
- Featured cards open the corresponding production restaurant, service, or
  category route.
- Category cards open the existing production `category-listing` route.
- “Browse all” opens the production category listing instead of becoming a
  dead-end control.
- Every booking action calls the existing production booking handler, so
  offline, pre-arrival, post-stay, and unverified-room rules remain enforced.

The story viewer can be opened from the QR success handoff as an introductory
story, then returns to the feed. Deliberately opening a story does not bypass
the room gate or create a booking.

### QR scan and success

The `scan-room-code` route renders the promoted `RoomScanner`:

- `onDetected` calls the production `scanRoomCode` handler.
- The production handler verifies the active booking with
  `verifyRoomPresence`, records the success toast, and routes to
  `room-qr-midstay`.
- The scanner keeps its automatic demo detection setting and reduced-motion
  behavior through props.
- The scanner remains a visual prototype. It does not claim to decode a real
  camera stream.

The `room-qr-midstay` route renders `RoomUnlocked`:

- `Explore` opens the promoted introductory story/feed handoff.
- `Back to my stay` opens the existing stay overview.
- Room, property, checkout, and charge-to-room copy comes from the active
  production booking.
- The success state confirms room presence; it does not claim that Cabana
  performed hotel check-in.

## Promotion boundary

Promote only components with explicit props contracts and pure catalogue
models. Do not promote `ExploreExperiment`, `QrScanExperiment`, or experiment
components that own their own fake screen state and navigation. Do not import
experiment code that reads `GuestSession`, session storage, `ActiveScreen`, or
calls `setSession`.

The promoted components will live in a production namespace and use the main
app stylesheet or a clearly scoped production stylesheet. The experiment
stylesheet remains isolated and is not imported by the main app.

The experiment’s local imagery is suitable for prototype review but is not
property-owned production art. Keep the existing local files only if the
promotion can trace every reference and document the remaining asset-replace
work; otherwise use the main app’s existing service-image fallback. No broken
remote image path or generated Vite/Vitest artifact may enter the production
bundle.

## Data and navigation seams

- Build the promoted feed from the existing `SERVICES`, `RESTAURANTS`, and
  `MINI_APP_CATEGORIES` data where possible.
- Map restaurant results to `restaurant-menu` and set the existing selected
  restaurant state.
- Map service results to the existing service route and selected service state,
  then reuse `openServiceBooking` for booking.
- Map categories to `selectedCategory` and `category-listing`.
- Map nearby actions to the existing nearby-establishment flow or its existing
  booking/chat handoff; do not create a second nearby state machine.
- Preserve the existing Explore/My Stay tab ownership and back-navigation.

## Verification requirements

Add or update tests for:

- The locked Explore gate and the unlocked promoted feed.
- Story, category, restaurant, service, nearby, search, and deck callbacks.
- Scanner auto-detection, cancellation, accessibility labels, and reduced
  motion.
- QR verification followed by the success state, plus both success actions.
- Correct cancellation settlement semantics in the folio model.
- The current screen registry count and all existing route contracts.

Run lint, typecheck, the focused guest-app tests, the full test suite, and the
production build. Report any unrelated baseline failures separately.

## Non-goals

- Implementing a real camera decoder or property backend.
- Changing hotel check-in authority or folio settlement rules.
- Adding a marketplace, loyalty, coupons, card checkout, travel-provider
  payment flow, or hotel discovery surface.
- Merging or pushing `experiment/qr-and-explore`.
