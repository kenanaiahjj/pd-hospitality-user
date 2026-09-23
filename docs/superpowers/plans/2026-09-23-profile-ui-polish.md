# Profile UI Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the guest Profile screen easier to scan while keeping its existing information and actions.

**Architecture:** Keep the existing Profile markup and signed-in Cabana shell. Refine the section heading and passport status markup in the guest-app prototype, then adjust only the Profile-specific rules in the prototype stylesheet.

**Tech Stack:** Next.js client component, React, TypeScript, Phosphor icons, CSS.

## Global Constraints

- Do not change profile data, authentication, or bottom navigation.
- Use existing `.guest-*` styles and theme tokens. Do not add gradients, stacked cards, or new animation.
- Preserve keyboard focus visibility, accessible names, and comfortable mobile touch targets.
- Preserve the existing Cabana light surface, restrained accent color, and hairline dividers.

---

### Task 1: Polish the Profile hierarchy and rows

**Files:**
- Modify: `src/components/features/guest-app/guest-app-prototype.tsx` — Profile screen JSX in the `profile` case.
- Modify: `src/components/features/guest-app/guest-app-prototype.css` — Profile section and signed-in shell overrides.

**Interfaces:**
- Consumes: Existing `GuestAppPrototype` session, navigation callbacks, row components, and `.guest-profile-*` classes.
- Produces: The same Profile destinations and sign-out behavior with clearer account hierarchy and passport status.

- [x] Replace the `Personal space` eyebrow and `Your account` label with a single `Account` heading. Keep the section heading ID and `aria-labelledby` relationship.
- [x] Replace the decorative green passport dot with the existing `IdentificationCard` icon, marked decorative, beside `Passport on file` and `Ends 4821`. Keep the existing `On file` status.
- [x] Keep Achievements and Stay history in the current single hairline list, preserve their counts and navigation handlers, and leave Sign out as its separate danger-colored row.
- [x] Refine only `.guest-profile-*` rules needed for hierarchy, spacing, icon alignment, row dividers, and mobile touch targets. Retain the existing flat light shell and focus styles.
- [x] Open the existing local preview at `http://localhost:3001/` in the Profile state and check a narrow mobile viewport. Confirm all four groups are visible, aligned, and free of horizontal overflow; keyboard-focus each action row.
- [x] Run `git diff --check` and inspect the diff to confirm only Profile-specific markup and CSS changed for this task.

**Manual verification:** The Profile keeps identity/contact details, passport status, Achievements, Stay history, and Sign out; the account rows and sign-out action remain operable.
