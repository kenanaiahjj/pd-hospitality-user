# Asbir Source UI

Asbir Source UI is the component gallery on `/`. It turns the shared visual language observed in the Klarna and Wise UI-element references into reusable, interactive React components.

Reference sources:

- [Klarna UI elements on Mobbin](https://mobbin.com/apps/klarna-ios-4b439dad-1b14-41ba-9aff-888decc7020c/4272c5f7-b724-43c7-a760-2956bb417fdb/ui-elements)
- [Wise UI elements on Mobbin](https://mobbin.com/apps/wise-ios-a404c62e-8829-423d-b5db-451c644a119f/1a41961f-70f1-4454-b1fe-7446227825da/ui-elements)

The implementation uses those references for taxonomy, hierarchy, color behavior, and mobile-finance interaction patterns. It does not ship Mobbin screenshots or remote source assets.

The gallery is light-first by default. It uses cool white surfaces, black ink, soft lilac supporting panels, and source accents applied to the same reusable component contracts.

## Component coverage

The gallery covers 36 reusable patterns across four groups:

- Controls: Accordion, Button, Checkbox, Color Picker, Date Picker, Floating Action Button, Radio Button, Search Bar, Segmented Control, Slider, Switch, Tab, Text Field, and Tile.
- Views: Badge, Banner, Card, Carousel, Chip, Divider, Gallery, Loading Indicator, Stacked List, Table, Tab Bar, Toolbar, and Top Navigation Bar.
- Overlay: Bottom Sheet, Dropdown Menu, Full-Screen Overlay, and Toast.
- Imagery: Avatar, Icon, Illustration, Logo, and Photo.

The components live in `src/components/ui/source-*.tsx`. They expose native semantics, `data-slot` hooks, controlled or uncontrolled state where it matters, and reduced-motion-safe CSS transitions.

## Token layers

The system uses three layers in `src/lib/design-system/tokens.ts` and `src/app/globals.css`:

1. Primitive tokens define the raw palette, spacing unit, and radius scale.
2. Semantic tokens map those primitives to source accents, surfaces, ink, status, and borders.
3. Component tokens are consumed by the shared `source-*` classes rather than by page-specific markup.

The theme control on the gallery changes the semantic accent without changing component contracts:

- Klarna uses a soft pink accent.
- Wise uses an acid green accent.
- System uses a quiet lilac accent for neutral comparison.

Spacing uses a 4px base unit. The default surface radius is 14px, the large overlay radius is 24px, and interactive controls target at least 44px where the control is a full field or action.

## Typography

The app loads the Asbir Sans variable web font from `public/fonts/AsbirSans-Variable.woff2` and its italic companion. The global `--font-asbir-sans` token keeps Asbir Sans first in the stack. The display italic is reserved for emphasis; labels and controls use the same family with tighter tracking.

## Interaction notes

- Theme, category, and search filters update the gallery in place.
- Accordions, segmented controls, switches, tabs, tiles, sliders, carousel, dropdown menus, and tab bar specimens are interactive.
- Bottom Sheet and Full-Screen Overlay close from their close button, Escape, or backdrop. Opening an overlay moves focus to the dialog and restores the previous focus target when it closes.
- Toast feedback is dismissible and announced through a polite live region.
