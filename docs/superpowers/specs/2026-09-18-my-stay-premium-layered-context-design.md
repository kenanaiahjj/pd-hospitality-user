# My Stay premium layered context

## Objective

Give My Stay the same calm, premium, glassy feel as the refreshed Front desk chat while keeping My Stay’s existing content, state, navigation, and interaction contracts intact.

The result should make the active stay feel like one coherent context: who the guest is staying with, what is happening next, which stay actions are available, and where room charges can be reviewed.

## Existing contracts to preserve

- Keep the current My Stay route and page entry point.
- Keep the existing booking, stay, checkout, online/offline, empty-state, and checked-out state logic.
- Keep the existing handlers and destinations for late checkout, extending a stay, checkout when it is due, and the folio deep link.
- Keep the `started` gate for Room charges. Room charges remain a link to the detailed folio and do not become a new payment or checkout flow.
- Keep the Upcoming and Past tabs, their counts, ARIA tab semantics, and their existing stay-entry data.
- Keep the bottom navigation visible on My Stay. The focused-chat navigation exception applies only to Chat.
- Keep the established Cabana visual language: Asbir Sans, paper and white surfaces, black hierarchy and action contrast, saturated pink for high attention, lilac for discovery or support, and rounded mobile cards.

## Design direction

### 1. Stay identity as a calm context block

Treat the property name, room number, and active status as one deliberate identity block rather than unrelated lines. Use the existing hierarchy and copy, with more intentional spacing and alignment so the guest can scan the stay context immediately.

The block should feel connected to the checkout surface below it without becoming a large hero or introducing a new data point. Keep the current property, room, and status values exactly as supplied by the active booking.

### 2. Checkout surface as the primary glass/paper layer

Make the existing checkout card the main visual layer on the page. Apply the same restrained depth language used in Chat: a light paper/glass surface, subtle border, controlled blur where supported, and a soft shadow that separates the card from the page without making the whole screen glossy.

Keep the existing checkout timing semantics:

- Show the current “Checks out tomorrow” or date-specific state.
- Show “Check out now” only when the existing `checkoutIsDue` condition permits it.
- Do not add a new checkout CTA for a stay that is not yet due.
- Do not change checkout state, dates, or navigation behavior.

Group late checkout and extend stay as secondary request rows inside the same context surface. Use measured row height, clear separators, and a directional affordance. Preserve both existing handlers and their Front desk chat destinations.

### 3. Room charges as a folio deep link

Style Room charges as a clear continuation of the stay context, not as an unrelated promotional card. Keep it compact and scannable, with a strong label, the existing total when available, and a clear View affordance.

Room charges must continue to navigate to the existing `folio` destination and must remain hidden whenever the existing `started` condition is false. Do not move detailed charge lines, settlement semantics, or folio ownership into My Stay.

### 4. Upcoming and Past as a refined collection control

Keep the current tab structure and behavior, but give the selected tab a restrained light-pink selected treatment that aligns with the active chat and bottom-navigation states. Maintain readable contrast and a clear non-color distinction through weight, border, or surface treatment.

Refine the existing stay-entry cards with consistent radius, spacing, and hierarchy:

- Make property and date information easy to scan.
- Give status and pricing enough contrast without competing with the active stay context.
- Use either a quiet border or a soft shadow as the main card boundary; avoid decorative layering on every element.
- Keep all existing labels, counts, actions, and entry navigation unchanged.

## State and flow behavior

The visual treatment must adapt to the current rendered state without changing its behavior:

- Active stays retain their checkout context, request actions, and Room charges gate.
- Before-arrival or not-started stays retain the existing content and do not gain a folio action.
- Checked-out stays retain the existing post-stay message and do not regain active-stay actions.
- Offline states retain the existing notice and available navigation.
- Empty Upcoming and Past states retain their current copy and routes.
- The bottom navigation remains part of the My Stay layout.

No data model, state machine, route, booking, folio, payment, travel, marketplace, rewards, or persistent navigation behavior changes are included in this work.

## Responsive and accessibility requirements

- Preserve the current mobile-first layout and make the visual hierarchy work at the existing device preview size and at a narrow phone width.
- Keep interactive controls at least 44px in their effective hit area.
- Preserve visible keyboard focus states and semantic button/tab roles.
- Preserve accessible names for checkout, request, folio, tab, and navigation controls.
- Respect reduced-motion preferences. Any hover, press, or reveal treatment must remain subtle and must not be required to understand state.
- Keep contrast sufficient for body text, status text, selected tabs, and action labels on the new surfaces.

## Implementation boundaries

Implementation should be additive and scoped to the My Stay presentation layer. Prefer extending the existing My Stay selectors and components over broad shared-shell refactors. Do not modify the Chat flow, bottom-navigation behavior, or unrelated dirty-worktree changes as part of this design.

## Verification

Before considering the implementation complete:

1. Run the focused My Stay component and visual-contract tests.
2. Verify active, before-arrival, checked-out, offline, and empty tab states in the browser.
3. Capture the My Stay preview at the existing device viewport and a narrow phone width.
4. Check keyboard focus, tab semantics, touch target sizes, reduced motion, and text contrast.
5. Run lint, typecheck, and the project build, then run `git diff --check`.
6. Report any unrelated pre-existing suite failures separately instead of changing unrelated flows to make the full suite appear clean.
