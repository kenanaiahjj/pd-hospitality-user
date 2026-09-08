# Guest App Klarna-Light Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restyle the interactive guest prototype as a light, Klarna-inspired consumer mobile app with contextual hospitality photography and unchanged product flows.

**Architecture:** Keep `GuestAppPrototype` as the in-memory flow controller. Add a small typed image catalog and one reusable image component with a local pink fallback, then apply the shared visual language through the existing guest stylesheet and component catalog rather than introducing another UI framework.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, CSS, `next/image`, Phosphor Icons, Vitest, Testing Library.

## Global Constraints

- The root route remains the interactive consumer mobile app.
- The `/components` route remains the design-system catalog.
- The main palette remains pink, white, and black.
- Dark surfaces are limited to focused identity and wallet moments.
- Existing guest journeys, offline behavior, form outcomes, and navigation destinations remain unchanged.
- Do not add Klarna trademarks, logos, copy, product names, or payment-specific content.
- Remote images must retain a visible pink fallback and must not block navigation.
- Preserve unrelated worktree changes.

---

### Task 1: Add the typed hospitality image catalog

**Files:**
- Create: `src/components/features/guest-app/service-images.ts`
- Create: `src/components/features/guest-app/service-images.test.ts`
- Modify: `next.config.ts`

**Interfaces:**
- Produces: `ServiceImageKey`, `ServiceImageDefinition`, `SERVICE_IMAGES`, and `getServiceImage(key)`.
- Produces: a `next/image` remote pattern restricted to `https://images.unsplash.com/**`.

- [ ] **Step 1: Write the failing catalog test**

```ts
import { describe, expect, it } from 'vitest';
import { SERVICE_IMAGES, getServiceImage } from './service-images';

describe('service images', () => {
  it('provides stable Unsplash images for every service context', () => {
    expect(Object.keys(SERVICE_IMAGES)).toEqual([
      'dining', 'spa', 'restaurant', 'tour', 'transfer', 'amenity',
    ]);
    expect(getServiceImage('spa').src).toMatch(/^https:\/\/images\.unsplash\.com\//);
    expect(getServiceImage('spa').alt).toContain('treatment');
  });
});
```

- [ ] **Step 2: Run the test and confirm it fails**

Run: `npm test -- src/components/features/guest-app/service-images.test.ts`

Expected: FAIL because `service-images.ts` does not exist.

- [ ] **Step 3: Add the typed catalog and remote image allowlist**

Create six stable `images.unsplash.com` definitions with `src`, `alt`, and `focalPoint` fields. Export a direct lookup function. Add this exact hostname and HTTPS protocol to `images.remotePatterns` in `next.config.ts`.

- [ ] **Step 4: Run the focused test**

Run: `npm test -- src/components/features/guest-app/service-images.test.ts`

Expected: PASS.

### Task 2: Add image rendering and preserve guest-app behavior

**Files:**
- Modify: `src/components/features/guest-app/guest-app-prototype.tsx`
- Modify: `src/components/features/guest-app/guest-app-prototype.test.tsx`

**Interfaces:**
- Consumes: `getServiceImage(key)` from Task 1.
- Produces: `ServiceImage({ imageKey, className, decorative })`, which renders `next/image` with `fill`, responsive `sizes`, and an error-controlled fallback state.

- [ ] **Step 1: Add failing component tests**

Add assertions that Home retains its Stay QR destination, Services renders the spa image, and dispatching an image error applies the fallback class while leaving the service action available.

- [ ] **Step 2: Run the focused guest test**

Run: `npm test -- src/components/features/guest-app/guest-app-prototype.test.tsx`

Expected: FAIL on the missing service image and fallback behavior.

- [ ] **Step 3: Implement the reusable image component and map images to surfaces**

Import `Image` from `next/image`. Replace abstract service visuals on the featured service, category listing, and hotel/vendor detail screens with `ServiceImage`. Keep existing icons as the fallback layer. Use empty alt text only when the adjacent service title repeats the same meaning.

- [ ] **Step 4: Run the focused guest test**

Run: `npm test -- src/components/features/guest-app/guest-app-prototype.test.tsx`

Expected: PASS with unchanged navigation and offline assertions.

### Task 3: Apply the light Klarna-inspired component language

**Files:**
- Modify: `src/components/features/guest-app/guest-app-prototype.css`
- Modify: `src/components/features/guest-app/guest-app-prototype.tsx`

**Interfaces:**
- Consumes: existing guest class names and the image component from Task 2.
- Produces: a full-height, single-column app surface with shared grouped rows, flat feature cards, circular utilities, and four-item bottom navigation.

- [ ] **Step 1: Add structural assertions for grouped consumer-app components**

Assert that Home exposes a labeled account row group, the Stay QR feature remains a button, and the bottom navigation contains Stay, Services, Wallet, and Chat.

- [ ] **Step 2: Run the focused test and confirm the new assertions fail**

Run: `npm test -- src/components/features/guest-app/guest-app-prototype.test.tsx`

Expected: FAIL until the grouped list semantics are present.

- [ ] **Step 3: Update markup and CSS**

Use 16 px mobile gutters, 32–36 px titles, 16 px primary body text, 44 px circular icon targets, 14–16 px cards, flat grouped list surfaces with internal dividers, a pink Stay QR feature card, black full-width primary actions, and a quiet white bottom bar. Remove card-per-row borders and desktop prototype framing. Keep wallet and QR detail surfaces dark with inverted actions.

- [ ] **Step 4: Run focused tests and CSS checks**

Run: `npm test -- src/components/features/guest-app/guest-app-prototype.test.tsx`

Expected: PASS.

Run: `npm run lint -- src/components/features/guest-app/guest-app-prototype.tsx`

Expected: PASS.

### Task 4: Align the component catalog and verify the connected experience

**Files:**
- Modify: `src/app/globals.css`
- Modify: `src/components/features/design-system/design-system-gallery.tsx`
- Modify: `src/components/features/design-system/design-system-gallery.test.tsx`

**Interfaces:**
- Consumes: shared `--ds-*` color tokens and documented radii.
- Produces: `/components` examples that match the app's light component treatment without becoming a product screen.

- [ ] **Step 1: Add a failing catalog regression test**

Assert that the catalog names the light consumer-app treatment and retains Button, Card, Stacked List, Photo, and Tab Bar specimens.

- [ ] **Step 2: Run the catalog test and confirm it fails**

Run: `npm test -- src/components/features/design-system/design-system-gallery.test.tsx`

Expected: FAIL on the missing consumer-app treatment label.

- [ ] **Step 3: Align the catalog copy and shared visual tokens**

Update only the shared presentation needed by the app: pink, white, black, 14–16 px card rounding, circular icon actions, grouped lists, black primary buttons, and restrained borders. Keep the catalog route and its complete component inventory.

- [ ] **Step 4: Run all automated verification**

Run: `npm test`

Expected: all tests pass.

Run: `npm run typecheck`

Expected: exit 0.

Run: `npm run lint`

Expected: exit 0.

Run: `npm run build`

Expected: the production build succeeds and includes `/` and `/components`.

- [ ] **Step 5: Verify the live app in the browser**

Inspect Home, Services, a service listing, both service details, Wallet, Chat, and `/components` at a mobile viewport. Confirm pink/white/black hierarchy, visible photographs, fallback resilience, correct navigation, readable text, and no Klarna branding.

