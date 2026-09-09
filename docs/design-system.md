# Cabana UI

Cabana UI is the component gallery at `/components`. It turns the guest app's
light interface language into reusable, interactive React components for
stakeholder approval.

The system is a neutral canvas, white surfaces, hairline separators, and a single
pink accent that only ever marks a primary action, the current selection, or a
live state. Asbir Sans is the project typeface.

## Component coverage

The gallery covers 36 reusable patterns across four groups:

- Controls: Accordion, Button, Checkbox, Color Picker, Date Picker, Floating Action Button, Radio Button, Search Bar, Segmented Control, Slider, Switch, Tab, Text Field, and Tile.
- Views: Badge, Banner, Card, Carousel, Chip, Divider, Gallery, Loading Indicator, Stacked List, Table, Tab Bar, Toolbar, and Top Navigation Bar.
- Overlay: Bottom Sheet, Dropdown Menu, Full-Screen Overlay, and Toast.
- Imagery: Avatar, Icon, Illustration, Logo, and Photo.

The components live in `src/components/ui/source-*.tsx`. They expose native
semantics, `data-slot` hooks, controlled or uncontrolled state where it matters,
and reduced-motion-safe CSS transitions.

## Token layers

The system uses three layers in `src/lib/design-system/tokens.ts` and
`src/app/globals.css`:

1. **Primitives** — the raw palette, spacing unit, radius scale, easing curves,
   and durations, all declared on `:root` as `--ds-*`.
2. **Semantics** — surfaces, ink ramp, status, elevation, and the z-index scale,
   mapped from the primitives.
3. **Component tokens** — consumed by the shared `source-*` classes and by the
   app's `guest-*` classes, never by page-specific markup.

The guest app scopes its own `--guest-*` layer to `.guest-app`, and every value
in it resolves back to a `--ds-*` primitive. Change a primitive and both the app
and the gallery move with it.

### The accent contract

`--ds-pink: oklch(0.79 0.18 345)` is a **light** surface colour. Two rules follow:

- Anything filled with the accent takes `--ds-on-pink` (ink) on top. White on
  this pink fails WCAG AA; ink clears it at 8.9:1.
- Pink used as text or an icon on a light surface uses `--ds-pink-strong`
  (`oklch(0.5 0.19 351)`, 6.7:1 on white), never the raw brand pink.

Body text is `--ds-ink-muted` (7.1:1 on white). `--ds-ink-subtle` (5.3:1) is the
floor and is still safe for placeholders. Status colours are their own hues and
never borrow the brand.

## Shape, spacing, and targets

Spacing uses a 4px base unit. Cards and grouped lists use the 16px radius,
elevated surfaces 20px, and interactive pills the full radius. Nested shapes are
concentric. Every interactive control clears a 44px target. A surface takes a
hairline **or** a shadow, never both.

## Typography

The app loads the Asbir Sans variable web font from
`public/fonts/AsbirSans-Variable.woff2` and its italic companion. The global
`--font-asbir-sans` token keeps Asbir Sans first in the stack. The scale is fixed
rather than fluid, one family carries every role, and any number that can change
is set in tabular figures.

## Motion

Durations are 140ms for press, 160ms for hover and colour, and 220ms for a screen
change; everything eases out on `cubic-bezier(0.23, 1, 0.32, 1)`. No transition is
declared on `all`. Hover states are gated behind
`(hover: hover) and (pointer: fine)`. Under `prefers-reduced-motion` the fades
stay and the movement goes.

## Interaction notes

- Category and search filters update the gallery in place.
- Accordions, segmented controls, switches, tabs, tiles, sliders, carousel, dropdown menus, and tab bar specimens are interactive.
- Bottom Sheet and Full-Screen Overlay close from their close button, Escape, or backdrop. Opening an overlay moves focus to the dialog and restores the previous focus target when it closes.
- Toast feedback is dismissible and announced through a polite live region.
