# Guest App Color System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

| | |
|---|---|
| **Status** | `Complete` |
| **Updated** | 2026-09-09 |

**Goal:** Connect the guest app to the existing pink, white, and black design-system palette without adding hotel branding.

**Architecture:** Define shared color primitives at the document root, keep the gallery's current semantic aliases, and remap the guest app's local aliases to those shared primitives. Functional success, warning, and danger colors remain independent.

**Tech Stack:** Next.js 16, React 19, CSS custom properties, Vitest, Testing Library

## Global Constraints

- Use the existing design system's pink, white, and black primitives.
- Do not add a logo, official hotel brand colors, or a new palette.
- Keep green, amber, and red restricted to functional status feedback.
- Do not change navigation, content, screen structure, behavior, or mock data.

---

### Task 1: Share and consume the design-system color primitives

**Files:**
- Modify: `src/app/globals.css`
- Modify: `src/components/features/guest-app/guest-app-prototype.css`
- Test: `src/components/features/guest-app/guest-app-prototype.test.tsx`

**Interfaces:**
- Consumes: CSS custom-property inheritance from `:root`.
- Produces: `--ds-ink`, `--ds-paper`, `--ds-background`, `--ds-line`, `--ds-pink`, and `--ds-pink-soft` shared color tokens.

- [x] **Step 1: Write the failing token-contract test**

Read both stylesheets and assert that the shared tokens exist in `globals.css`, that the guest aliases consume them, and that status aliases retain their semantic hues.

- [x] **Step 2: Run the focused test and verify it fails**

Run `npm test -- --run src/components/features/guest-app/guest-app-prototype.test.tsx`.

Expected: FAIL because `--ds-pink` and the guest token aliases do not exist.

- [x] **Step 3: Add the shared primitives and guest aliases**

Add this shared contract to `:root` in `src/app/globals.css`:

```css
--ds-ink: oklch(0.16 0.012 275);
--ds-paper: oklch(1 0 0);
--ds-background: oklch(0.985 0.005 285);
--ds-line: oklch(0.88 0.018 285);
--ds-pink: oklch(0.82 0.15 345);
--ds-pink-soft: color-mix(in oklch, var(--ds-pink) 12%, var(--ds-paper));
```

Change the guest aliases to consume the shared contract:

```css
--guest-ink: var(--ds-ink);
--guest-muted: oklch(0.35 0.015 275);
--guest-subtle: oklch(0.44 0.015 275);
--guest-line: var(--ds-line);
--guest-paper: var(--ds-paper);
--guest-bg: var(--ds-background);
--guest-soft: var(--ds-pink-soft);
--guest-blue: var(--ds-pink);
```

Keep `--guest-positive`, `--guest-warning`, and `--guest-danger` as functional status colors.

- [x] **Step 4: Run the focused test and verify it passes**

Run `npm test -- --run src/components/features/guest-app/guest-app-prototype.test.tsx`.

Expected: PASS.

- [x] **Step 5: Run the complete verification gate**

Run `npm test`, `npm run typecheck`, `npm run lint`, and the production build with the repository's documented environment variables.

Expected: all commands exit with status 0.

- [x] **Step 6: Verify the routes visually**

Inspect `/` and `/components` in the browser. Confirm that the guest app uses white surfaces, black primary actions, and pink accents, while the gallery remains visually unchanged.
