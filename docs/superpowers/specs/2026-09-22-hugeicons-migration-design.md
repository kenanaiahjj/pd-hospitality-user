# Hugeicons migration design

> Produced by `superpowers:brainstorming` (architectural path).

| | |
|---|---|
| **Status** | `Approved` |
| **Created** | 2026-09-22 |
| **Updated** | 2026-09-22 |
| **Owner** | Ken |
| **Plan** | `docs/superpowers/plans/2026-09-22-hugeicons-migration.md` (once written) |
| **Supersedes** | `n/a` |
| **Superseded by** | `n/a` |

## Summary

Replace every Phosphor UI icon in the Hospitality app with the existing
Hugeicons stroke-rounded set. A shared local catalog will keep icon semantics,
accessibility attributes, and sizing consistent while removing the second icon
library from the application.

## Context

The navbar in `src/components/features/guest-app/guest-app-prototype.tsx`
already renders Hugeicons, but 17 source files still import
`@phosphor-icons/react`. Those files cover the main guest flow, shared source
components, the design-system gallery, promoted flows, and rewards. The guest
stylesheet also draws a select chevron from an inline SVG data URI and draws an
order-tray close mark from a text pseudo-element.

The repository already depends on `@hugeicons/react` and
`@hugeicons-pro/core-stroke-rounded`, so this work standardizes the existing
icon source instead of adding a new package or changing product behavior.

## Non-goals

- Change guest navigation, booking, chat, explore, stay, folio, or rewards behavior.
- Replace Cabana logos, photographs, generated illustrations, QR artwork, or badge artwork.
- Redesign the iconography or change the product color, spacing, or typography system.
- Add a runtime icon-name registry or load the entire Hugeicons package dynamically.

## Success criteria

- [ ] Every UI icon component in `src/` renders through Hugeicons.
- [ ] No source, package manifest, or lockfile reference to `@phosphor-icons/react` remains.
- [ ] The select chevron and order-tray close affordance render as Hugeicons rather than CSS-drawn glyphs.
- [ ] Existing icon sizes, labels, focus behavior, and decorative `aria-hidden` behavior remain intact.
- [ ] `npm test` passes with all existing tests plus the new icon-catalog coverage.
- [ ] `npm run typecheck`, `npm run lint`, and `npm run build` pass with fresh output.

## Approaches considered

### Recommended: typed local Hugeicons catalog

Create `src/components/ui/huge-icons.tsx` as the only application-facing icon
catalog. It will wrap `HugeiconsIcon`, set the shared stroke treatment, and
export semantic component names such as `ArrowRight`, `House`, and
`CheckCircle`, each backed by one explicitly imported Hugeicons data object.
All current consumers will switch their imports to this catalog. The rewards
glyph map will use the catalog's component type instead of the removed
Phosphor `Icon` type.

The adapter will preserve standard SVG props, including `className`, `size`,
`color`, `aria-*`, `focusable`, and `ref`. Phosphor-only `weight` props will be
removed from call sites; where a heavier visual is intentional, the call site
will use Hugeicons `strokeWidth` instead.

**Why:** It gives the app one tree-shakable, typed boundary and keeps the
existing JSX readable without duplicating wrapper configuration in 17 files.
It also makes a future icon replacement a catalog change rather than another
repository-wide migration.

**Costs:** The catalog needs an explicit mapping for every current icon, and
stroke-rounded icons cannot reproduce Phosphor's filled or duotone variants
exactly. The migration will use the closest Hugeicons stroke treatment while
preserving meaning and hierarchy.

### Alternative: direct Hugeicons imports in every consumer

Replace each Phosphor import with direct imports from
`@hugeicons-pro/core-stroke-rounded` and render `HugeiconsIcon` at every call
site.

**Rejected because:** It repeats adapter props and stroke decisions across the
same 17 files, makes the rewards glyph typing more difficult, and increases
the risk of inconsistent icon sizing.

### Alternative: string-based runtime icon registry

Store Hugeicons data objects in a string-keyed registry and resolve icons by
name at render time.

**Rejected because:** It weakens type safety, makes missing icons runtime-only
failures, and encourages importing a broad namespace that undermines
tree-shaking.

## Design

### Architecture

The component path will be:

```text
UI consumer
  -> src/components/ui/huge-icons.tsx
  -> HugeiconsIcon from @hugeicons/react
  -> explicitly imported stroke-rounded icon data
  -> inline SVG
```

`src/components/ui/huge-icons.tsx` is a client-safe presentational module. It
does not own application state and does not change event handling. The catalog
will use `forwardRef` so icon buttons and focus-aware consumers continue to
work. It will default to the same 24px size and approximately 1.75 stroke
width already used by the navbar's `GuestNavIcon`.

The main guest prototype will use the catalog for its existing icons and will
retain the navbar's current navigation semantics. The select field will gain a
positioned Hugeicons chevron inside a non-interactive wrapper. The order tray
close control will render the catalog's `X` component directly and lose its
text pseudo-element.

### Components

**`src/components/ui/huge-icons.tsx`**
- **Does:** Adapt Hugeicons data objects into the semantic icon components used by the app.
- **Used as:** `import { ArrowRight, HugeIcon, type HugeIconComponent } from '@/components/ui/huge-icons'`.
- **Depends on:** `HugeiconsIcon` and explicitly selected exports from `@hugeicons-pro/core-stroke-rounded`.

**`src/components/features/guest-app/rewards/badge-medal.tsx`**
- **Does:** Render reward glyphs using the Hugeicons component type and catalog.
- **Used as:** The existing `GLYPHS` map and `glyphFor` helper, with no change to badge state or accessibility labels.
- **Depends on:** `HugeIconComponent` from the local catalog and the existing badge model.

**`src/components/features/guest-app/guest-app-prototype.tsx`**
- **Does:** Use the catalog for guest-flow icons, the navbar, the select affordance, and order-tray close controls.
- **Used as:** Existing screen and interaction components with icon imports redirected to the catalog.
- **Depends on:** The local catalog and existing guest state transitions.

**`src/components/ui/source-controls.tsx`, `src/components/ui/source-overlays.tsx`, and `src/components/ui/source-views.tsx`**
- **Does:** Use the same catalog for shared design-system controls and views.
- **Used as:** Existing public component APIs; only icon imports and Phosphor-only props change.
- **Depends on:** The local catalog and existing `ReactNode` icon slots.

**`src/components/features/guest-app/promoted/**` and `src/components/features/guest-app/rewards/**`**
- **Does:** Replace their direct Phosphor imports with semantic Hugeicons catalog components.
- **Used as:** Existing promoted and rewards flows without state or copy changes.
- **Depends on:** The local catalog and existing props contracts.

### Data flow

An icon click will keep the existing interaction path. For example, the order
tray close button remains owned by the order-tray component and still invokes
`onClose`; only its visual child changes:

```text
Order tray JSX
  -> X from huge-icons.tsx
  -> HugeiconsIcon
  -> Cancel01Icon data
  -> SVG with aria-hidden=true
```

The select chevron is decorative and follows the same path, but its wrapper
uses `pointer-events: none` so the native select remains the interactive
control.

### Interfaces and contracts

```ts
// src/components/ui/huge-icons.tsx
export type HugeIconProps = Omit<HugeiconsIconProps, 'icon'>;
export type HugeIconComponent = ForwardRefExoticComponent<
  HugeIconProps & RefAttributes<SVGSVGElement>
>;

export function HugeIcon(
  props: HugeIconProps & { icon: IconSvgElement },
): ReactElement;

export const ArrowRight: HugeIconComponent;
export const House: HugeIconComponent;
// ...one typed export for every semantic icon currently used by src/.
```

The catalog will not expose Phosphor's `weight` prop. Every consumer will use
Hugeicons-compatible SVG props. Existing `aria-hidden`, `aria-label`,
`focusable`, `className`, `size`, and `strokeWidth` values remain valid.

### Error handling

Icon data is statically imported. There is no runtime lookup or network path,
so missing mappings are compile-time failures. The rewards map remains
explicit; an unknown badge glyph continues to render no glyph rather than
throwing during render, matching its existing behavior.

### Testing

- Add `src/components/ui/huge-icons.test.tsx` to render representative catalog
  icons and verify they produce SVG output with the requested size, class, and
  accessibility attributes.
- Keep the existing guest, promoted, rewards, and design-system tests as the
  regression suite for consumer compatibility.
- Add a repository-level static verification step in the implementation
  checklist that confirms no Phosphor import or dependency remains.
- Run `npm test`, `npm run typecheck`, `npm run lint`, and
  `npm run build` after the migration.

## Global Constraints

- Verification gate: `npm run typecheck && npm run lint && npm run build` passes
  with fresh output before any task is claimed complete.
- Preserve unrelated dirty-worktree files. At the start of this migration the
  worktree is clean and `main` is synchronized with `origin/main`.
- Use only the existing `@hugeicons/react` and
  `@hugeicons-pro/core-stroke-rounded` dependencies for application icons.
- Do not change application state, routing, copy, product boundaries, or
  screen behavior while changing icon rendering.
- Keep tree-shaking explicit by importing only the icon data objects used by
  the catalog.

## Open questions

None. The scope, library, stroke-rounded variant, asset exclusions, and
verification gate are approved for implementation.

## Decision Log

| Date | Decision | Why | Cost if wrong |
|---|---|---|---|
| 2026-09-22 | Migrate every product UI icon under `src/` and remove Phosphor entirely. | The user explicitly requested that no other icon library remain. | A later design request for a different icon family would require a new catalog migration. |
| 2026-09-22 | Use a typed local Hugeicons catalog backed by explicit stroke-rounded imports. | It centralizes rendering semantics and preserves tree-shaking. | The catalog must be maintained as new semantic icons are added. |
| 2026-09-22 | Leave logos, photos, illustrations, QR artwork, and badge artwork unchanged. | They are visual assets, not UI icon components. | An asset that later becomes interactive may need a separate icon treatment. |

## Before marking this spec In Review

- [x] **Placeholder scan** — no unresolved placeholders or TODO requirements remain.
- [x] **Internal consistency** — the catalog, consumer changes, CSS changes, and tests describe the same migration.
- [x] **Scope check** — the work is one dependency and icon-rendering migration; product behavior remains out of scope.
- [x] **Ambiguity check** — the icon-library boundary and asset exclusions are explicit.
- [x] **Status block filled** — status, dates, owner, and plan path are present.

The spec is ready for review before the implementation plan is written.
