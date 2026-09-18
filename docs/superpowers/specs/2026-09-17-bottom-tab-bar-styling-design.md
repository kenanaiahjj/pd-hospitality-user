# Bottom tab bar styling Design

> Produced by `superpowers:brainstorming` (architectural path). Once this
> document is `Approved`, the only next skill is `superpowers:writing-plans`.

| | |
|---|---|
| **Status** | `Implemented` |
| **Created** | 2026-09-17 |
| **Updated** | 2026-09-17 |
| **Owner** | human partner |
| **Plan** | `n/a — implemented directly per human partner instruction` |
| **Supersedes** | `n/a` |
| **Superseded by** | `n/a` |

## Summary

Restyle Cabana's existing bottom navigation into the centered, floating white
capsule shown in the supplied mobile references. The change is visual: it keeps
the current navigation destinations, lifecycle-dependent second slot, keyboard
behavior, accessibility semantics, and device shell intact while replacing the
flat full-width bar with an icon-led elevated dock. The dock overlays the
device's scrolling content, so the content viewport continues behind it
instead of ending at a separate bottom row.

## Context

The guest app shell is implemented in
`src/components/features/guest-app/guest-app-prototype.tsx`, with the bottom
navigation rendered by `NavButton` inside `.guest-bottom-nav`. Its current
styling lives in
`src/components/features/guest-app/guest-app-prototype.css` as a full-width,
flat row inside the `.guest-device` flex frame. The final treatment keeps the
device as the containing block, removes the nav from flex layout, and gives
`.guest-screen.has-nav` the bottom scroll inset needed to reach its last item.

The existing navigation contract is deliberate:

- The bar is hidden during onboarding and appears after the guest can use the
  app shell.
- The current source and tests preserve Home, Chat, and Profile when no booking
  exists, and add the booking-dependent slot and My Stay once a booking exists.
- The booking-dependent slot keeps its position while its label changes between
  Arrival, Explore, and Book again according to the stay lifecycle.
- `NavButton` exposes the active destination with `aria-current="page"`.

The three supplied screenshots are visual references for an icon-only,
rounded, floating navigation capsule with white surface, soft elevation, and a
quiet active state. They do not change Hospitality's stay-only information
architecture or add a separate action button.

## Non-goals

- Do not change the number, order, label, or lifecycle rules of navigation
  destinations.
- Do not add or remove routes, tab state, persistence, booking gates, or
  navigation actions.
- Do not introduce a separate floating action button for the booking slot.
- Do not change the app bar, prototype controls, device frame, or unrelated
  dirty-worktree work.
- Do not add external imagery, brand marks, new dependencies, or a new icon
  library; the existing Phosphor icons remain the source for tab glyphs.

## Success criteria

- [x] The guest-facing bottom navigation renders as a centered white capsule
      with large corner radius, soft shadow, and safe-area-aware bottom spacing
      at mobile widths.
- [x] Tab labels are visually hidden but remain available as accessible names;
      the existing `aria-label` on the navigation and `aria-current="page"`
      state remain intact.
- [x] Active and inactive states match the supplied references: active glyphs
      use Cabana ink, inactive glyphs use muted gray, and the active destination
      has a small Cabana-pink indicator instead of a full colored tab pill.
- [x] The capsule distributes three, four, or five destinations evenly without
      empty tracks, reflowing destinations, or reducing any interactive target
      below 44px.
- [x] Home, booking-dependent navigation, My Stay, Chat, and Profile continue
      to route exactly as they do before the styling change, including the
      no-booking and lifecycle variants.
- [x] The screen continues behind the overlay, with no separate full-width
      bottom strip; the final content remains reachable above the capsule.
- [x] `npm run typecheck`, `npm run lint`, and the production build pass with
      fresh output. Focused navigation tests and a browser check confirm the
      capsule at narrow and wide app-frame widths, with content visible around
      it.

## Approaches considered

### Recommended: Floating capsule overlay within the device frame

Position `.guest-bottom-nav` absolutely inside the relative `.guest-device`
frame. Keep the screen as the full-height flex child and add a
`.guest-screen.has-nav` bottom inset so the final content can be scrolled above
the capsule without creating an opaque row below it. Buttons become icon-only
visually while retaining their text for assistive technology and existing
tests.

**Why:** The supplied follow-up visual check made the relationship explicit:
content must remain visible around and behind the floating bar. A frame-local
overlay reproduces that treatment while preserving the dynamic slot count,
safe-area handling, and established navigation semantics.

**Costs:** The screen needs a matching bottom scroll inset, and any other
fixed in-app surface must continue to use the shared nav footprint.

### Earlier approach: Capsule as a bottom flex row

Keep `.guest-bottom-nav` in the `.guest-device` flex column and make only the
nav surface a centered capsule.

**Changed after visual check:** This left an empty full-width area below the
content and made the content stop above the capsule. It did not satisfy the
requirement that the content remain visible around the floating nav.

### Alternative: Viewport-level overlay dock

Position the nav against the browser viewport rather than the device frame.

**Rejected because:** The guest app is presented as a capped device on wide
screens. A viewport-level dock could detach from that frame and cover unrelated
page content; the device-local containing block provides the same overlay
relationship without that drift.

### Alternative: Reference-specific slot and action variants

Change the app's tab composition to mirror each screenshot, including a
separate plus action in one variant and a different number of destinations in
another.

**Rejected because:** It changes product behavior and would make the visual
reference dictate Hospitality's information architecture, contrary to the
approved styling-only scope.

## Design

### Architecture

The implementation changes only the existing `NavButton` presentation and
`.guest-bottom-nav` styling. No new navigation state or component boundary is
needed. `.guest-device` is the relative containing block, `.guest-screen` is
the full-height scrolling flex child, and `.guest-bottom-nav` is an absolute
overlay above the screen. `.guest-screen.has-nav` reserves only the scroll
inset needed to make the last item reachable; it does not create a bottom row.

The CSS must continue to use only custom properties defined by the guest app
stylesheets. The change may add local `.guest-bottom-nav` rules and a small
active-indicator pseudo-element, but it must not introduce undefined design
tokens or broad selectors that affect other buttons.

### Components

**`src/components/features/guest-app/guest-app-prototype.tsx`**
- **Does:** Renders the existing primary navigation and its lifecycle-aware
  destinations.
- **Used as:** The current `<nav className="guest-bottom-nav">` with one
  `NavButton` per available destination; `NavButton` continues to accept
  `{ label, icon, active, onClick }`.
- **Depends on:** `activeScreen`, `primaryBooking`, `bookingSlot`, current
  screen groups, and existing `go()`/`back()` behavior.

**`src/components/features/guest-app/guest-app-prototype.css`**
- **Does:** Defines the capsule geometry, distribution, states, elevation,
  safe-area spacing, focus ring, press feedback, and reduced-motion behavior.
- **Used as:** Existing `.guest-bottom-nav` and descendant selectors; no new
  runtime API.
- **Depends on:** `--guest-paper`, `--guest-canvas`, `--guest-ink`,
  `--guest-subtle`, `--guest-accent`, `--guest-accent-strong`, existing
  spacing variables, the `.guest-device` containing block, and its shared nav
  footprint.

**`src/components/features/guest-app/guest-app-prototype.test.tsx`**
- **Does:** Verifies the navigation contract and the CSS shape contract.
- **Used as:** Existing semantic navigation tests plus focused assertions for
  icon-only labels, capsule geometry, dynamic slot distribution, target size,
  and active indicator rules.
- **Depends on:** Testing Library's role/name queries and the stylesheet source
  read by the existing test file.

### Data flow

1. `GuestAppPrototype` derives the available destinations from the current
   session and lifecycle state.
2. The existing JSX renders each destination through `NavButton` and marks the
   active one with `aria-current="page"`.
3. CSS keeps the screen as the full-height scroll surface, distributes the
   rendered buttons across the overlay capsule, and exposes only their icons
   visually; the label text remains in the accessibility tree.
4. A pointer or keyboard activation calls the existing `go()` callback and
   changes `activeScreen`; no new state path is introduced.

### Interfaces and contracts

The existing component interface remains unchanged:

```tsx
function NavButton({
  label,
  icon,
  active,
  onClick,
}: {
  label: string;
  icon: ReactNode;
  active: boolean;
  onClick: () => void;
})
```

The nav continues to expose:

```html
<nav class="guest-bottom-nav" aria-label="Primary navigation">
  <button aria-current="page">
    <span><!-- existing Phosphor icon --></span>
    <small><!-- accessible destination label --></small>
  </button>
</nav>
```

The `aria-current` attribute is present only on the active destination. The
existing visible button labels are converted to a visually hidden treatment;
they are not removed or replaced with an icon-only accessible name.

### Error handling

This is a presentation-only change and introduces no new error boundary,
network request, or user-data failure mode. If a destination is unavailable,
the existing conditional rendering remains the source of truth. If CSS fails
to load, the semantic buttons and their existing click handlers still provide
the underlying navigation behavior.

### Testing

Add or update focused tests to prove:

- the navigation still exposes the expected labels and destination order with
  and without a booking;
- only the active destination has `aria-current="page"`;
- labels remain present while the stylesheet visually hides them;
- the capsule uses a centered radius/background/shadow treatment;
- the capsule is removed from flex flow and the screen continues behind it with
  a reachable bottom scroll inset;
- button targets remain at least 44px and the grid distributes any rendered
  number of slots;
- reduced-motion rules still disable press transforms and transitions for the
  capsule.

Run the full project verification commands after the focused tests pass. A
browser check must inspect the rendered app at a narrow mobile viewport and a
wide viewport where the device frame is capped, and must activate at least one
tab to confirm that styling did not change navigation.

Verification note: `npm run typecheck`, `npm run lint`, and
`API_BASE_URL=https://jsonplaceholder.typicode.com npm run build` pass. The
focused navigation and overlay suite passes. The repository-wide `npm test`
command remains red at the known unrelated baseline failures across the
guest-app and prototype-model suites; the tab-bar-focused coverage passes.

## Global Constraints

- Verification gate: `npm run typecheck && npm run lint && npm run build` passes
  with fresh output before any task is claimed complete.
- The architecture invariants in `CLAUDE.md` are binding.
- Preserve unrelated user changes and do not stage unrelated files.
- Keep the app stay-only and booking-first; do not add discovery, travel,
  marketplace, loyalty, or consumer payment semantics.
- Keep all interactive targets at least 44px and keep labels available to
  assistive technology.
- Use existing Asbir Sans, design tokens, Phosphor icons, `.guest-*` contracts,
  and reduced-motion conventions.

## Open questions

None. The styling-only scope, device-local overlay capsule, icon-only visual
treatment, active-state treatment, and preserved navigation contracts are
approved by the human partner.

## Decision Log

| Date | Decision | Why | Cost if wrong |
|---|---|---|---|
| 2026-09-17 | Preserve all existing destinations and lifecycle rules; change only the bottom bar presentation. | The request targets styling, and the current navigation contract is already deliberate and tested. | A later information-architecture change would need a separate navigation spec. |
| 2026-09-17 | Use a centered capsule as an absolute overlay inside the device frame, with a screen scroll inset. | The follow-up screenshot requires content to remain visible around and behind the floating bar while keeping it attached to the capped app frame. | The screen and any other fixed in-app surface must stay aligned with the shared nav footprint. |
| 2026-09-17 | Hide labels visually, retain them in the DOM, and use ink plus a small pink indicator for the active state. | The references are icon-led, while accessible names and current tests require destination labels. | A future visual review might choose a different active marker without changing the nav contract. |

## Before marking this spec In Review

- [x] **Placeholder scan** — no placeholders, `TBD`, `TODO`, or incomplete
      sections remain.
- [x] **Internal consistency** — the device-local overlay capsule, component
      list, data flow, and success criteria agree.
- [x] **Scope check** — this is one focused styling implementation plan.
- [x] **Ambiguity check** — active treatment, slot behavior, accessibility, and
      responsive ownership are explicit.
- [x] **Status block filled** — status, dates, owner, and plan path are set.
