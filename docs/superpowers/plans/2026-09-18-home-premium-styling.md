# Home premium styling Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (\`- [ ]\`) syntax for tracking.

**Goal:** Apply the approved quiet-boutique visual treatment to the guest Home screen while preserving its existing prototype states, routes, fixtures, actions, and floating navigation.

**Architecture:** Keep StayOverviewHome as the Home source and add only local presentation hooks for the active hero and discovery region. Implement the treatment in the existing guest stylesheet with current tokens, responsive editorial card sizing, transform/opacity-only entrance motion, and reduced-motion overrides. Extend the existing guest-app test file with focused visual-contract assertions.

**Tech Stack:** React, TypeScript, Next.js, CSS custom properties, Vitest, Testing Library, existing local images, and existing Phosphor icons.

## Global Constraints

- Preserve the current Home route and active/upcoming/completed/empty variants.
- Preserve all current Home actions and destinations: booking details, front desk chat, room upgrade, room-code scan, Next up, category cards, and announcements.
- Keep the floating frosted bottom navigation as its own overlay; content must remain visible around it and scroll above it.
- Keep Cabana's neutral canvas, white surfaces, Asbir Sans, restrained pink, accessible names, focus states, and 44px effective targets.
- Do not add live data, authentication, CMS behavior, vendor behavior, payment behavior, new dependencies, or fake content.
- Preserve unrelated dirty-worktree changes in guest-app-prototype.tsx, guest-app-prototype.test.tsx, .npmrc, and design-qa.md.

---

### Task 1: Add Home visual-contract tests

**Files:**
- Modify: src/components/features/guest-app/guest-app-prototype.test.tsx beside the existing Home and design-token suites.

**Interfaces:**
- Consumes: Existing verified, activeSession, render, and guestStyles fixtures.
- Produces: Assertions for stable Home presentation hooks and the approved CSS treatment.

- [ ] **Step 1: Add the markup contract test**

Add this test beside the existing Home category tests. Use the fixture that renders a confirmed active service if verified does not include one:

~~~tsx
it('exposes premium Home presentation regions without changing guest actions', () => {
  render(<GuestAppPrototype initialScreen="stay-overview" initialSession={verified} />);

  expect(screen.getByTestId('guest-home-active')).toBeInTheDocument();
  expect(document.querySelector('.guest-home-active-hero')).toBeInTheDocument();
  expect(document.querySelector('.guest-home-discovery')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'View booking' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Food & Drinks' })).toBeInTheDocument();
});
~~~

- [ ] **Step 2: Add the stylesheet contract test**

Add this test in the existing visual-contract area:

~~~tsx
it('gives Home a quiet-boutique editorial treatment', () => {
  expect(guestStyles).toMatch(/\.guest-home-discovery\s*\{[^}]*display:\s*grid/);
  expect(guestStyles).toMatch(/\.guest-category-banner--featured\s*\{[^}]*grid-column:\s*1\s*\/\s*-1/);
  expect(guestStyles).toMatch(/\.guest-home-active-hero[^}]*animation:\s*guest-home-rise/);
  expect(guestStyles).toMatch(/@media \(prefers-reduced-motion:\s*reduce\)[\s\S]*\.guest-home-active-hero/);
});
~~~

- [ ] **Step 3: Run the new tests before implementation**

Run:

~~~bash
npx vitest run src/components/features/guest-app/guest-app-prototype.test.tsx -t "premium Home presentation|quiet-boutique editorial"
~~~

Expected: the tests fail because the hooks and CSS rules do not exist yet.

---

### Task 2: Add presentation hooks to the active Home markup

**Files:**
- Modify: src/components/features/guest-app/guest-app-prototype.tsx around lines 4663-4718 inside StayOverviewHome.

**Interfaces:**
- Consumes: Existing booking data, service data, category data, handlers, and announcement rendering.
- Produces: guest-home-active-hero, guest-home-discovery, and guest-category-banner--featured hooks used only by CSS and tests.

- [ ] **Step 1: Mark the active hero**

Change only the existing class list:

~~~tsx
<section className="guest-stay-hero-card guest-home-active-hero">
~~~

Keep the image, status pills, facts, action rows, QR action, upgrade states,
handlers, and conditionals unchanged.

- [ ] **Step 2: Mark the discovery section**

Change the existing anonymous category section to:

~~~tsx
<section className="guest-home-discovery">
  <SectionHeading title="Make the most of your stay" />
  <div className="guest-category-banners" role="group" aria-label="Experience categories">
~~~

Keep the five local category entries, labels, image sources, click handlers,
button semantics, and image alt behavior unchanged.

- [ ] **Step 3: Mark the first category as featured**

Use the existing map index and add a deterministic modifier without changing
the accessible name:

~~~tsx
{items.map((item, index) => (
  <button
    key={item.id}
    type="button"
    className={index === 0 ? 'guest-category-banner guest-category-banner--featured' : 'guest-category-banner'}
~~~

If the array is currently inline, assign the same five entries to a local
constant before mapping. Do not change the entries or their order.

- [ ] **Step 4: Run the markup test**

Run:

~~~bash
npx vitest run src/components/features/guest-app/guest-app-prototype.test.tsx -t "premium Home presentation"
~~~

Expected: the markup test passes; the stylesheet test remains failing.

---

### Task 3: Implement quiet-boutique Home styling and motion

**Files:**
- Modify: src/components/features/guest-app/guest-app-prototype.css in the existing Home category rules around lines 2363-2400 and stay-hero rules around lines 2493-2610.

**Interfaces:**
- Consumes: Existing guest tokens, duration tokens, ease-out, and guest-screen.has-nav.
- Produces: Responsive premium visuals with no data, route, or navigation changes.

- [ ] **Step 1: Refine the active stay anchor**

Add these local overrides after the existing stay-hero rules:

~~~css
.guest-home-active-hero {
  border-color: color-mix(in oklch, var(--guest-line) 76%, var(--guest-paper));
  border-radius: 20px;
  box-shadow: var(--shadow-sm);
}
.guest-home-active-hero .guest-stay-hero-card__media { aspect-ratio: 1.72; }
.guest-home-active-hero .guest-stay-hero-card__media img { transform: scale(1.015); }
.guest-home-active-hero .guest-stay-hero-card__body { gap: 6px; padding: 16px; }
.guest-home-active-hero .guest-stay-hero-card__body h1 {
  font-size: 23px;
  letter-spacing: -0.026em;
}
.guest-home-active-hero .guest-stay-hero-card__stats {
  margin-top: 14px;
  padding-top: 14px;
  border-top: 1px solid var(--guest-line);
}
.guest-home-active-hero .guest-stay-hero-card__actions .guest-list-row {
  min-height: 60px;
  padding-inline: 16px;
}
~~~

Keep the existing primary room-code action and all status colors. Do not add a
second colored panel behind the hero.

- [ ] **Step 2: Refine Next up as an action surface**

Add the following rules without changing its copy or route:

~~~css
.guest-home-next-service { display: grid; gap: 10px; }
.guest-next-service-card {
  min-height: 92px;
  border-radius: 16px;
  box-shadow: none;
  transition: transform var(--duration-press) var(--ease-out),
    background-color var(--duration-fast) ease,
    border-color var(--duration-fast) ease;
}
.guest-next-service-card:active { transform: scale(0.98); }
~~~

Keep hover behavior inside the existing fine-pointer media query.

- [ ] **Step 3: Make discovery editorial and responsive**

Add these rules after the existing category-banner rules:

~~~css
.guest-home-discovery { display: grid; gap: 12px; }
.guest-home-discovery .guest-category-banners {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}
.guest-home-discovery .guest-category-banner {
  min-height: 138px;
  height: auto;
  border-radius: 16px;
}
.guest-home-discovery .guest-category-banner--featured {
  grid-column: 1 / -1;
  min-height: 178px;
}
.guest-home-discovery .guest-category-banner__label {
  right: 14px;
  bottom: 13px;
  left: 14px;
  font-size: 15px;
}
@media (max-width: 360px) {
  .guest-home-discovery .guest-category-banners { grid-template-columns: 1fr; }
  .guest-home-discovery .guest-category-banner,
  .guest-home-discovery .guest-category-banner--featured {
    grid-column: auto;
    min-height: 132px;
  }
}
~~~

Retain the existing scrim, focus ring, image object-fit, and local image
sources.

- [ ] **Step 4: Add purposeful entrance and interaction motion**

Add the following scoped motion rules. They animate only opacity and transform,
stay below 300ms, and remove movement under reduced motion:

~~~css
@media (prefers-reduced-motion: no-preference) {
  .guest-home-booking--active > .guest-home-active-hero,
  .guest-home-booking--active > .guest-home-next-service,
  .guest-home-booking--active > .guest-home-discovery {
    animation: guest-home-rise 260ms var(--ease-out) both;
  }
  .guest-home-booking--active > .guest-home-next-service { animation-delay: 35ms; }
  .guest-home-booking--active > .guest-home-discovery { animation-delay: 70ms; }
  .guest-home-discovery .guest-category-banner img {
    transition: transform 220ms var(--ease-out);
  }
}
@keyframes guest-home-rise {
  from { opacity: 0; transform: translateY(6px); }
  to { opacity: 1; transform: translateY(0); }
}
@media (hover: hover) and (pointer: fine) {
  .guest-home-discovery .guest-category-banner:hover img { transform: scale(1.025); }
}
@media (prefers-reduced-motion: reduce) {
  .guest-home-booking--active > .guest-home-active-hero,
  .guest-home-booking--active > .guest-home-next-service,
  .guest-home-booking--active > .guest-home-discovery { animation: none; }
  .guest-home-discovery .guest-category-banner img { transition: none; }
}
~~~

- [ ] **Step 5: Run the focused visual-contract tests**

Run:

~~~bash
npx vitest run src/components/features/guest-app/guest-app-prototype.test.tsx -t "premium Home presentation|quiet-boutique editorial|home mini-apps|floating capsule|frosted surface"
~~~

Expected: the new Home tests and existing Home/navigation visual-contract
tests pass.

---

### Task 4: Verify the scoped result in the live preview

**Files:**
- Read: src/components/features/guest-app/guest-app-prototype.tsx
- Read: src/components/features/guest-app/guest-app-prototype.css
- Read: docs/superpowers/specs/2026-09-18-home-premium-styling-design.md

**Interfaces:**
- Consumes: The implementation from Tasks 1–3 and http://localhost:3001/.
- Produces: Fresh test, visual, accessibility, and diff evidence.

- [ ] **Step 1: Run hygiene and scoped tests**

Run git diff --check and:

~~~bash
npx vitest run src/components/features/guest-app/guest-app-prototype.test.tsx -t "home|navigation|design tokens"
~~~

Expected: no whitespace errors and the scoped assertions pass. Report any
unrelated baseline failures separately.

- [ ] **Step 2: Check the live Home at two widths**

Use the open local preview and verify the active Home at the existing device
width and a narrow 320–360px width. Confirm that the hero actions work, Next up
still opens My Stay, category buttons still open their listings, the first
category is featured, and the floating nav remains separate with final content
reachable above it.

- [ ] **Step 3: Check motion and accessibility states**

Verify keyboard focus for hero, Next up, and category buttons; press feedback;
fine-pointer-only image hover; reduced-motion behavior; readable status text;
and effective 44px targets.

- [ ] **Step 4: Run project checks and inspect the final diff**

Run npm run lint, npm run typecheck, API_BASE_URL=https://jsonplaceholder.typicode.com npm run build, git diff --stat, and git status --short --branch. Report generated .next/types duplicate failures separately if they remain, do not delete unrelated user files to hide them, and confirm the final diff contains no data, route, authentication, CMS, vendor, payment, or navigation behavior changes.
