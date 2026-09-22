# Hugeicons migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove Phosphor from the repository and render every product UI icon through the existing Hugeicons stroke-rounded set.

**Architecture:** Add one typed local catalog at src/components/ui/huge-icons.tsx. The catalog wraps HugeiconsIcon, explicitly imports only the data objects needed by the app, and exports semantic React components. Redirect the 17 current consumers to that catalog, replace the two CSS-drawn affordances with catalog icons, remove the Phosphor dependency, and verify the complete app.

**Tech Stack:** Next.js 16.3.4, React 19, TypeScript, @hugeicons/react, @hugeicons-pro/core-stroke-rounded, Vitest, Testing Library, ESLint.

## Global Constraints

- Verification gate: npm run typecheck && npm run lint && npm run build passes with fresh output before any task is claimed complete.
- Preserve unrelated dirty-worktree files. At the start of this migration the worktree is clean and main is synchronized with origin/main.
- Use only the existing Hugeicons dependencies for application icons.
- Do not change application state, routing, copy, product boundaries, or screen behavior while changing icon rendering.
- Keep tree-shaking explicit by importing only the icon data objects used by the catalog.

---

## File map

- Create src/components/ui/huge-icons.tsx: typed Hugeicons adapter and semantic catalog.
- Create src/components/ui/huge-icons.test.tsx: focused adapter rendering contract.
- Modify src/components/ui/index.ts: export the catalog.
- Modify shared UI files: source-controls.tsx, source-overlays.tsx, and source-views.tsx.
- Modify the design-system gallery and all guest app, promoted, composer, and rewards consumers.
- Modify package.json and package-lock.json: remove @phosphor-icons/react.
- Modify the migration spec: keep status and plan link current.

## Icon mapping contract

Use explicit imports from @hugeicons-pro/core-stroke-rounded. Keep the application-facing names on the left.

| App name | Hugeicons data object |
|---|---|
| AirplaneTilt | Airplane01Icon |
| AppleLogo | AppleIcon |
| ArrowDown | ArrowDown01Icon |
| ArrowLeft | ArrowLeft01Icon |
| ArrowRight | ArrowRight01Icon |
| ArrowUp | ArrowUp01Icon |
| ArrowUpRight | ArrowUpRight01Icon |
| Baby | Baby01Icon |
| Bank | BankIcon |
| Barbell | EquipmentGym01Icon |
| Bed | BedSingle02Icon |
| Bell | BellIcon |
| BellRinging | BellRingIcon |
| BookmarkSimple | Bookmark01Icon |
| Briefcase | Briefcase01Icon |
| CalendarCheck | CalendarCheckIcon |
| CalendarPlus | CalendarAdd01Icon |
| Camera | Camera01Icon |
| CaretDown | ChevronDownIcon |
| CaretLeft | ChevronLeftIcon |
| CaretRight | ChevronRightIcon |
| ChartLineUp | ChartLineIcon |
| ChatCircleDots | MessageCircleMoreIcon |
| ChatText | ChatIcon |
| Check | CheckIcon |
| CheckCircle | CheckmarkCircle02Icon |
| Clock | Clock01Icon |
| ClockCountdown | HourglassIcon |
| Compass | CompassIcon |
| Confetti | PartyPopperIcon |
| CookingPot | CookingPotIcon |
| Coffee | Coffee01Icon |
| CreditCard | CreditCardIcon |
| DeviceMobile | SmartphoneIcon |
| Door | DoorIcon |
| Eye | EyeIcon |
| Flower | FlowerIcon |
| ForkKnife | SpoonAndForkIcon |
| Gear | GearsIcon |
| Gift | GiftIcon |
| Globe | GlobeIcon |
| GoogleLogo | GoogleIcon |
| Hammer | HammerIcon |
| Handshake | HandshakeIcon |
| House | Home04Icon |
| IdentificationCard | IdentityCardIcon |
| ImageIcon | Image01Icon |
| Images | ImagesIcon |
| Island | IslandIcon |
| Lightning | FlashIcon |
| Lock | LockIcon |
| LockKey | LockKeyIcon |
| MagnifyingGlass | Search01Icon |
| MapPin | MapPinIcon |
| MapTrifold | MapIcon |
| Megaphone | Megaphone01Icon |
| Microphone | Mic01Icon |
| Minus | MinusSignIcon |
| MoonStars | Moon01Icon |
| Mountains | MountainIcon |
| NavigationArrow | Navigation01Icon |
| Pause | PauseIcon |
| Person | PersonStandingIcon |
| Play | PlayIcon |
| Plus | PlusSignIcon |
| QrCode | QrCodeIcon |
| Receipt | ReceiptIcon |
| Repeat | RepeatIcon |
| Scissors | ScissorsIcon |
| SealCheck | BadgeCheckIcon |
| ShieldCheck | ShieldCheckIcon |
| SignOut | Logout01Icon |
| Sparkle | SparkleIcon |
| Star | StarIcon |
| Stop | StopIcon |
| Storefront | Store01Icon |
| SuitcaseRolling | Luggage01Icon |
| SunHorizon | Sun01Icon |
| Ticket | Ticket01Icon |
| TrashSimple | TrashIcon |
| TrendUp | TrendingUpIcon |
| Tray | InboxIcon |
| User | UserIcon |
| UserCircle | UserCircleIcon |
| Users | UserGroupIcon |
| UsersThree | UsersIcon |
| Wallet | Wallet01Icon |
| Waveform | AudioWaveformIcon |
| Waves | WavesIcon |
| WifiHigh | WifiHighIcon |
| WifiSlash | WifiDisconnected01Icon |
| Wrench | Wrench01Icon |
| X | XIcon |

Confirm every export with TypeScript. If a listed export is unavailable, select the closest named stroke-rounded export before implementation continues; do not use a namespace import, runtime lookup, or Phosphor fallback.

## Implementation tasks

### Task 1: Add the failing Hugeicons adapter contract test

**Files:**
- Create: src/components/ui/huge-icons.test.tsx
- Test: src/components/ui/huge-icons.test.tsx

**Interfaces:**
- Consumes: not-yet-created exports ArrowRight and HugeIcon from ./huge-icons.
- Produces: the required SVG size, class, accessibility, and ref contract.

- [ ] **Step 1: Write the failing test**

~~~tsx
import { render } from '@testing-library/react';
import { createRef } from 'react';
import { describe, expect, it } from 'vitest';
import { ArrowRight, HugeIcon } from './huge-icons';
import { ArrowRight01Icon } from '@hugeicons-pro/core-stroke-rounded';

describe('Hugeicons catalog', () => {
  it('renders a semantic icon with requested SVG props', () => {
    const { container } = render(
      <ArrowRight size={20} className="test-icon" aria-hidden="true" focusable="false" />,
    );
    const svg = container.querySelector('svg');

    expect(svg).toBeTruthy();
    expect(svg).toHaveAttribute('width', '20');
    expect(svg).toHaveAttribute('height', '20');
    expect(svg).toHaveClass('test-icon');
    expect(svg).toHaveAttribute('aria-hidden', 'true');
    expect(svg).toHaveAttribute('focusable', 'false');
  });

  it('forwards a ref and supports direct Hugeicons data', () => {
    const ref = createRef<SVGSVGElement>();
    render(<HugeIcon ref={ref} icon={ArrowRight01Icon} aria-label="Continue" />);

    expect(ref.current).toBeInstanceOf(SVGSVGElement);
    expect(ref.current).toHaveAttribute('aria-label', 'Continue');
  });
});
~~~

- [ ] **Step 2: Run the focused test to verify it fails**

Run: npx vitest run src/components/ui/huge-icons.test.tsx

Expected: FAIL because src/components/ui/huge-icons.tsx does not exist.

- [ ] **Step 3: Commit the failing test**

~~~bash
git add src/components/ui/huge-icons.test.tsx
git commit -m "test: define Hugeicons catalog contract"
~~~

### Task 2: Implement and export the typed Hugeicons catalog

**Files:**
- Create: src/components/ui/huge-icons.tsx
- Modify: src/components/ui/index.ts
- Test: src/components/ui/huge-icons.test.tsx

**Interfaces:**
- Consumes: HugeiconsIconProps, IconSvgElement, and the explicit mapping table.
- Produces: HugeIcon, HugeIconProps, HugeIconComponent, and every semantic icon export.

- [ ] **Step 1: Add the adapter**

Use this implementation shape, then add one explicit import and one createHugeIcon call for each mapping:

~~~tsx
'use client';

import { forwardRef, type ForwardRefExoticComponent, type RefAttributes } from 'react';
import { HugeiconsIcon, type HugeiconsIconProps, type IconSvgElement } from '@hugeicons/react';

export type HugeIconProps = Omit<HugeiconsIconProps, 'icon'>;
export type HugeIconComponent = ForwardRefExoticComponent<
  HugeIconProps & RefAttributes<SVGSVGElement>
>;

export const HugeIcon = forwardRef<SVGSVGElement, HugeIconProps & { icon: IconSvgElement }>(
  function HugeIcon({ icon, strokeWidth = 1.75, ...props }, ref) {
    return <HugeiconsIcon ref={ref} icon={icon} strokeWidth={strokeWidth} {...props} />;
  },
);

function createHugeIcon(icon: IconSvgElement, displayName: string): HugeIconComponent {
  const Component = forwardRef<SVGSVGElement, HugeIconProps>(function HugeIconComponent(props, ref) {
    return <HugeIcon ref={ref} icon={icon} {...props} />;
  });
  Component.displayName = displayName;
  return Component;
}
~~~

Do not add a namespace import or a string-keyed lookup. The explicit imports keep unused data tree-shakable.

- [ ] **Step 2: Export the catalog through the UI barrel**

Add this line to src/components/ui/index.ts:

~~~ts
export * from './huge-icons';
~~~

- [ ] **Step 3: Run the focused test to verify it passes**

Run: npx vitest run src/components/ui/huge-icons.test.tsx

Expected: PASS with both catalog tests passing.

- [ ] **Step 4: Commit the catalog**

~~~bash
git add src/components/ui/huge-icons.tsx src/components/ui/huge-icons.test.tsx src/components/ui/index.ts
git commit -m "feat: add Hugeicons application catalog"
~~~

### Task 3: Migrate shared UI, gallery, and rewards consumers

**Files:**
- Modify: src/components/ui/source-controls.tsx
- Modify: src/components/ui/source-overlays.tsx
- Modify: src/components/ui/source-views.tsx
- Modify: src/components/features/design-system/design-system-gallery.tsx
- Modify: src/components/features/guest-app/rewards/badge-medal.tsx
- Modify: src/components/features/guest-app/rewards/badge-model.ts
- Modify: src/components/features/guest-app/rewards/badge-shelf.tsx
- Modify: src/components/features/guest-app/rewards/points-apply.tsx
- Modify: src/components/features/guest-app/rewards/reward-menu.tsx
- Test: existing shared UI, gallery, and rewards tests.

**Interfaces:**
- Consumes: the catalog from Task 2.
- Produces: unchanged public component props with no Phosphor imports.

- [ ] **Step 1: Redirect imports**

Replace each @phosphor-icons/react import with the local catalog. Use ./huge-icons from sibling UI files and @/components/ui/huge-icons from feature files. Keep existing JSX names and DOM structure.

- [ ] **Step 2: Remove Phosphor-only weight props**

Delete weight="fill", weight="duotone", and weight="regular". Replace intentional bold strokes with strokeWidth={2}, for example:

~~~tsx
<Check strokeWidth={2} aria-hidden="true" />
<Star strokeWidth={active ? 2 : 1.75} />
~~~

Do not add a weight compatibility prop to the catalog.

- [ ] **Step 3: Update the rewards glyph type**

In badge-medal.tsx, import HugeIconComponent and Lock from the catalog. Use Record<string, HugeIconComponent> for GLYPHS and return HugeIconComponent | undefined from glyphFor. Render Glyph with aria-hidden="true" and no weight prop. Update badge-model.ts and nearby comments from Phosphor to Hugeicons.

- [ ] **Step 4: Run the focused consumer suite**

Run: npx vitest run src/components/ui src/components/features/design-system/design-system-gallery.test.tsx src/components/features/guest-app/rewards

Expected: all selected shared UI, gallery, and rewards tests pass.

- [ ] **Step 5: Commit the shared consumer migration**

~~~bash
git add src/components/ui/source-controls.tsx src/components/ui/source-overlays.tsx src/components/ui/source-views.tsx src/components/features/design-system/design-system-gallery.tsx src/components/features/guest-app/rewards
git commit -m "refactor: migrate shared UI and rewards icons"
~~~

### Task 4: Migrate the core guest app and CSS affordances

**Files:**
- Modify: src/components/features/guest-app/guest-app-prototype.tsx
- Modify: src/components/features/guest-app/guest-app-prototype.css
- Modify: src/components/features/guest-app/chat-composer.tsx
- Test: guest-app-prototype.test.tsx and chat-composer.test.tsx.

**Interfaces:**
- Consumes: the catalog from Task 2 and existing guest state.
- Produces: the same screens and interactions with Hugeicons-only UI icons.

- [ ] **Step 1: Redirect core and composer imports**

Replace both Phosphor imports with the catalog. Keep the existing navbar semantics, but use the catalog's HugeIcon wrapper for any direct icon-data rendering.

- [ ] **Step 2: Remove weight props**

Remove every remaining weight prop in these files. Use strokeWidth={2} only for controls that previously requested bold strokes. Keep size, className, aria-hidden, and focusable values unchanged.

- [ ] **Step 3: Replace the CSS select data URI**

Change SelectField to wrap the native select and render the catalog chevron:

~~~tsx
<span className="guest-select-wrap">
  <select
    id={name}
    name={name}
    {...(controlled
      ? { value, onChange: (event) => onValueChange(event.target.value) }
      : { defaultValue })}
  >
    {children}
  </select>
  <CaretDown className="guest-select-wrap__icon" aria-hidden="true" focusable="false" />
</span>
~~~

Add position: relative to the wrapper, remove background-image, background-repeat, background-position, and background-size from the select, and position the icon at the right edge with pointer-events: none.

- [ ] **Step 4: Remove the order-tray text close glyph**

Keep the close button's aria-label="Close" and onClick={onClose}, render X aria-hidden="true" focusable="false" inside it, and remove the guest-order-tray__header .guest-button::after content rule. Do not change the hit target or focus styles.

- [ ] **Step 5: Run the guest-flow suite**

Run: npx vitest run src/components/features/guest-app/guest-app-prototype.test.tsx src/components/features/guest-app/chat-composer.test.tsx src/components/features/guest-app/ordering-flow.test.tsx src/components/features/guest-app/promoted

Expected: all selected guest, composer, ordering, and promoted tests pass.

- [ ] **Step 6: Commit the core guest migration**

~~~bash
git add src/components/features/guest-app/guest-app-prototype.tsx src/components/features/guest-app/guest-app-prototype.css src/components/features/guest-app/chat-composer.tsx
git commit -m "refactor: migrate guest app icons to Hugeicons"
~~~

### Task 5: Migrate the remaining promoted-flow consumers

**Files:**
- Modify: src/components/features/guest-app/promoted/ask-panel.tsx
- Modify: src/components/features/guest-app/promoted/discover-feed.tsx
- Modify: src/components/features/guest-app/promoted/room-scanner.tsx
- Modify: src/components/features/guest-app/promoted/room-unlocked.tsx
- Modify: src/components/features/guest-app/promoted/story-viewer.tsx
- Modify: src/components/features/guest-app/promoted/swipe-deck.tsx
- Modify: src/components/features/guest-app/promoted/swipe-story-viewer.tsx
- Test: existing promoted-flow and ordering-flow tests.

**Interfaces:**
- Consumes: the catalog from Task 2.
- Produces: unchanged promoted props, gestures, playback, and navigation behavior.

- [ ] **Step 1: Redirect promoted imports**

Replace each promoted file's Phosphor import with corresponding catalog names. Retain ImageIcon as the local alias in room-scanner.tsx if needed.

- [ ] **Step 2: Remove weight props**

Remove fill and bold weight props; use strokeWidth={2} only where emphasis is intentional. Keep button labels and aria-hidden behavior unchanged.

- [ ] **Step 3: Run the promoted suite**

Run: npx vitest run src/components/features/guest-app/promoted src/components/features/guest-app/ordering-flow.test.tsx

Expected: all promoted-flow tests pass.

- [ ] **Step 4: Commit the promoted migration**

~~~bash
git add src/components/features/guest-app/promoted
git commit -m "refactor: migrate promoted flow icons"
~~~

### Task 6: Remove Phosphor and verify the complete repository

**Files:**
- Modify: package.json
- Modify: package-lock.json
- Modify: docs/superpowers/specs/2026-09-22-hugeicons-migration-design.md
- Test: full repository suite and static scans.

**Interfaces:**
- Consumes: all migrated consumers from Tasks 3–5.
- Produces: no Phosphor dependency or source reference and an implementation-linked spec.

- [ ] **Step 1: Remove the dependency**

Run:

~~~bash
npm uninstall @phosphor-icons/react
~~~

Expected: package.json and package-lock.json no longer list the package.

- [ ] **Step 2: Update the spec**

Set the spec Plan field to docs/superpowers/plans/2026-09-22-hugeicons-migration.md. Set Status to Implemented only after the verification gate passes.

- [ ] **Step 3: Run static no-Phosphor scans**

Run:

~~~bash
rg -n --glob '!node_modules/**' '@phosphor-icons/react|Phosphor' src package.json package-lock.json docs
rg -n --glob '!node_modules/**' 'data:image/svg|guest-order-tray__header \.guest-button::after' src/components/features/guest-app
~~~

Expected: both commands return no matches.

- [ ] **Step 4: Run the full test suite**

Run: npm test

Expected: all existing tests and the new Hugeicons catalog tests pass.

- [ ] **Step 5: Run typecheck, lint, and build**

Run: npm run typecheck && npm run lint && npm run build

Expected: all three commands exit 0. Record pre-existing lint warnings separately from failures.

- [ ] **Step 6: Review and commit**

Run:

~~~bash
git diff --check
git status --short --branch
git diff --stat HEAD~5..HEAD
~~~

Confirm that only the spec, plan, catalog, icon consumers, CSS affordances, tests, and dependency manifests changed. Then commit the final metadata and dependency removal:

~~~bash
git add docs/superpowers/specs/2026-09-22-hugeicons-migration-design.md docs/superpowers/plans/2026-09-22-hugeicons-migration.md package.json package-lock.json src
git commit -m "chore: remove Phosphor icon dependency"
~~~

- [ ] **Step 7: Push and verify main**

Run:

~~~bash
git branch --show-current
git rev-parse HEAD
git push origin main
git ls-remote origin refs/heads/main
git status --short --branch
~~~

Expected: current branch is main, remote main matches local HEAD, and the worktree is clean.

## Plan self-review

- [x] Spec coverage: catalog, explicit mapping, consumer migration, CSS affordances, asset boundary, dependency removal, tests, and push verification each have a task.
- [x] Placeholder scan: no unfinished-marker text, generic test instruction, or unresolved path remains.
- [x] Type consistency: Task 1 consumes ArrowRight and HugeIcon; Task 2 produces both; Task 3 consumes HugeIconComponent; Task 2 produces it; Task 6 updates the exact spec and package paths named earlier.
