# Front desk chat reference layout design

| | |
|---|---|
| **Status** | `Approved direction; awaiting spec review` |
| **Created** | 2026-09-24 |
| **Owner** | human partner |
| **Reference** | User-supplied Places chat screenshots |

## Summary

Restyle the existing Hospitality front-desk chat to follow the reference's
quiet, centered welcome and generous composer layout. Keep the screen's
meaning clear: guests are messaging the property's front desk.

## User-approved direction

- Keep the current front-desk and property identity, message behavior, quick
  request actions, back path, and focused full-screen chat navigation.
- Use a warm, light neutral canvas with generous open space.
- Center the welcome content in the empty conversation state.
- Present the existing five requests in a horizontally scrollable rail of
  larger, clearer cards.
- Restyle the composer as a large rounded surface anchored at the bottom of
  the chat screen, with a visible attachment control, voice recording, text
  entry, and send action.
- Keep the conversation thread, desk responses, and composer usable after a
  message is sent.
- Reuse the current design tokens, app assets, and icon set. Let the app frame
  provide device chrome.

## Behavior to preserve

Keep the existing chat and after-hours routes, front-desk relationship,
booking context, quick request messages, message delivery state, offline
behavior, attachment menu, local image attachments, voice recording, typing
state, unread indicator, and post-stay closure rules. Keep the current
full-screen chat navigation behavior and safe-area handling.

## Reference boundaries

Use the supplied images as visual references for the neutral palette, generous
spacing, centered empty state, horizontal request cards, rounded composer, and
separate voice and send controls. Keep Hospitality's own labels and
navigation. Do not copy the reference app's product identity or attribution
footer.

## Scope

Modify the existing guest chat presentation and its composer styling. Do not
change booking, folio, payments, Explore, shared navigation, or server-backed
behavior. Do not create a new route or introduce an automated concierge.

## Acceptance criteria

- The initial front-desk chat reads as a warm, open prompt surface with
  centered welcome content, horizontally browsable request cards, and a large
  bottom composer.
- The same front-desk conversation remains clear after the guest sends a
  message; messages remain readable above the anchored composer.
- The layout fits the mobile guest-app viewport and respects the existing
  safe-area behavior.
- Existing chat states and actions remain connected to their current
  handlers.
