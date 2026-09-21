# Bottom tab bar design QA

## Source visual truth

- `/var/folders/8l/htjpvn2d29dgr67rglqg5ft80000gn/T/codex-clipboard-bebdd60a-b527-416e-8d32-f6a565b270e0.png` (Mesh reference; original 1179 x 2676)
- `/var/folders/8l/htjpvn2d29dgr67rglqg5ft80000gn/T/codex-clipboard-c65aeb4f-e54f-4875-a8f6-13c6df7c124c.png` (Corner reference; original 1180 x 2676)
- `/var/folders/8l/htjpvn2d29dgr67rglqg5ft80000gn/T/codex-clipboard-100cf779-5ffb-49dc-b15f-cf27d0f0c908.png` (Shop reference; original 1179 x 2676)

The references are visual inputs only. The implementation keeps Cabana's
existing destinations and navigation behavior.

## Implementation captures

- `http://localhost:3001/`, Cua in-app browser capture at 390 x 844 CSS px, connected active-stay Home state.
- `http://localhost:3001/`, Cua in-app browser capture at 1280 x 720 CSS px, capped device-frame Home state.
- `http://localhost:3001/`, Cua in-app browser capture at 390 x 844 CSS px, Chat state after activating Chat.

The in-app browser API emitted these captures for visual inspection but did not
expose a persisted local screenshot path.

## Focused comparison

| Surface | Reference expectation | Implementation result |
|---|---|---|
| Capsule geometry | Centered, rounded white dock | Passed: `.guest-bottom-nav` is centered with a pill radius and a 24px side gutter, capped at 408px |
| Content relationship | Content remains visible around and behind the floating dock | Passed: the capsule is removed from flex flow, `.guest-screen` reaches the device bottom, and the final content gets a scroll inset instead of a blank full-width strip |
| Elevation | Soft separation from the screen | Passed: existing `--shadow-md` token is applied to the capsule |
| Icon treatment | Quiet muted inactive icons and darker active icon | Passed: inactive icons use `--guest-subtle`; the active icon uses `--guest-ink` |
| Active state | Small accent indicator instead of a full colored tab | Passed: the active tab uses a 16px pink underline indicator |
| Distribution | Even slots for the rendered destinations | Passed: the existing one-fraction-per-button grid remains in place |
| Accessibility | Icon-led presentation without losing destination names | Passed: labels remain in the accessibility tree and each target is at least 44px wide and 48px high |
| Responsive behavior | Compact mobile dock and centered wide-screen dock | Passed at 390 x 844 and 1280 x 720 |

## Comparison history

1. Initial visual pass: the capsule geometry, elevation, icon-only treatment,
   and dynamic slot distribution matched the requested direction.
2. Interaction pass: Chat exposed two current tabs because the existing screen
   group included Chat in both My Stay and Chat. The focused regression test
   caught this as a state-semantic mismatch; removing Chat from the My Stay
   group restored one active destination without changing routing.
3. Final pass: Home, Explore, My Stay, Chat, and Profile were activated with
   keyboard input in the browser. Only the selected tab receives the ink color
   and pink indicator. No P0, P1, or P2 visual or interaction issues remain.
4. Overlay correction: the device-local capsule now sits above the scrolling
   content. Live DOM measurements show the screen and device share the same
   bottom edge while the capsule ends 8px above it; the screenshot shows the
   service imagery continuing behind the capsule.

## Final result

final result: passed
