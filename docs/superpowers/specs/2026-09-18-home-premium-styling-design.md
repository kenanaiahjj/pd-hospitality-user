# Home premium styling

> Produced by `superpowers:brainstorming`. This document records the
> approved quiet-boutique direction before implementation.

| | |
|---|---|
| **Status** | `Approved for implementation` |
| **Created** | 2026-09-18 |
| **Owner** | human partner |
| **Scope** | Guest-facing Home presentation only |
| **Plan** | `pending — create after design review` |

## Objective

Give Cabana Home a more premium, boutique-hospitality feel while keeping the
existing stay-first prototype behavior intact. The screen should make the
active stay feel considered and useful at a glance, then lead naturally into
the next service and the broader on-property catalogue.

This is a presentation pass for the local prototype. It does not add live
data, authentication, a CMS, vendor management, payment processing, or new
guest-facing product behavior.

## Existing contracts to preserve

- Keep the current Home route, active/upcoming/completed/empty variants, and
  local fixture data.
- Keep the existing booking, room, date, guest, service, room-upgrade, and
  room-code values and their current conditional rendering.
- Keep every current Home action and destination: View booking, front desk
  chat, room upgrade, room-code scan, Next up, category cards, and
  announcements.
- Keep the floating frosted bottom navigation as its own overlay. Home content
  must remain visible around it and scroll to its final item above it.
- Keep the Cabana design language from `DESIGN.md`: neutral canvas, white
  surfaces, Asbir Sans, restrained pink for primary/live/selected states, and
  one primary visual focus per screen.
- Keep the current accessibility names, button semantics, focus states, and
  minimum effective touch targets.

## Design direction: quiet boutique

Premium comes from proportion, material, hierarchy, and feedback rather than
from adding more decoration. The Home screen remains light and calm, with the
property image carrying the emotional weight.

### 1. Make the active stay the visual anchor

Refine the existing hero card into a confident stay context block:

- Give the property image a more deliberate crop, stronger aspect ratio, and
  quiet image treatment without changing its source or data.
- Keep `Checked in` and the room label as compact status pills over the image.
- Increase separation between the welcome line, property name, stay facts, and
  action rows so the guest can scan them in that order.
- Use a restrained surface treatment: one boundary system per surface, with a
  hairline or soft shadow, not both.
- Keep the room-code action visually primary only when the current room
  verification gate requires it.

### 2. Turn “Next up” into a concierge moment

Keep the existing confirmed service and route, but give it more presence:

- Use a compact service context row with a small category cue, service title,
  scheduled time, room-charge detail, and a clear View details affordance.
- Preserve `See all` and the existing My Stay destination.
- Treat the card as an actionable continuation of the stay, not a promotional
  banner.

### 3. Make discovery feel editorial

Refine “Make the most of your stay” without adding a feed or CMS:

- Keep the existing five local category destinations and labels.
- Present the image cards with a more art-directed aspect ratio, quieter
  overlay, stronger label placement, and consistent inner spacing.
- Use a compact two-column editorial grid where the available width supports
  it, with a full-width featured card for the first category on narrow mobile
  widths if that improves scan order.
- Avoid introducing additional badges, ratings, vendor prices, or fake content.

### 4. Add purposeful motion

Motion should clarify hierarchy and confirm interaction:

- Use a short ease-out entrance for the Home anchor content when the screen is
  first rendered.
- Use subtle image scale on pointer hover and a 0.97–0.98 press scale on
  actionable cards.
- Use a small opacity/translate reveal for the Next up and category sections
  only if the existing rendering path supports it without layout shift.
- Keep durations below 300ms and use the existing custom ease-out curve.
- Respect `prefers-reduced-motion`: retain readable state changes while
  removing movement and image zoom.
- Do not add looping ambient animation, parallax, or motion that competes with
  the floating navigation.

## Responsive behavior

- Preserve the current capped mobile device frame and narrow-phone behavior.
- Keep the primary hero readable at the existing preview size and at a narrow
  320–393px content width.
- Let discovery cards use the available content width rather than forcing
  desktop proportions into the phone frame.
- Reserve enough bottom scroll space for the existing floating nav so the final
  announcement content remains visible around the capsule.

## Accessibility

- Keep category cards as buttons with their current accessible names.
- Keep the hero actions as semantic buttons with visible focus rings.
- Keep status text readable against image treatments; do not rely on color
  alone for checked-in or room state.
- Keep all actionable controls at least 44px in their effective hit area.
- Ensure the premium treatment does not reduce text contrast or hide content
  beneath the floating nav.

## Implementation boundaries

Implementation should be limited to the Home presentation layer in
`guest-app-prototype.tsx` and `guest-app-prototype.css`, plus focused tests for
the visual contract. Prefer existing components, images, icons, tokens, and
handlers. Do not refactor the navigation state, fixture model, route map, or
unrelated dirty-worktree changes.

## Verification

1. Run the focused Home and navigation tests.
2. Verify active, upcoming, completed, empty, and room-code-gated Home states
   in the browser.
3. Capture the Home screen at the existing device viewport and a narrow mobile
   width, checking that content remains visible around the floating nav.
4. Check keyboard focus, reduced motion, image fallback behavior, text
   contrast, and touch target sizes.
5. Run `git diff --check`, then report any unrelated baseline typecheck or
   suite failures separately.
