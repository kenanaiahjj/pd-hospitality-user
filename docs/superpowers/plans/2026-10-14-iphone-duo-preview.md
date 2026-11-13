# iPhone Duo preview Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let presenters switch the guest-app prototype between its current iPhone view and the iPhone Duo outer and inner display views.

**Architecture:** `GuestAppPrototype` owns preview selection as presentation state and passes it to `PrototypeControls`. The existing guest app renders once; `data-device` and `data-pose` attributes on `.guest-device` select its frame proportions and open-pose layout through CSS.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, CSS.

## Global Constraints

- Read the relevant guide in `node_modules/next/dist/docs/` before changing application code, as required by the repository’s Next.js agent rules.
- Keep the existing iPhone view as the initial selection.
- Preserve the active screen, booking, and prototype state when presenters switch devices or poses.
- Use 1398 × 2034 as the outer-display ratio and 2670 × 1878 as the open inner-display ratio; do not use these pixel values as CSS pixel sizes.
- Keep the fold region clear of primary interactive content and provide primary navigation in a vertical rail in the open pose.
- Preserve all unrelated dirty files and stage only files listed in the task being committed.
- Do not add or run tests unless the user requests testing or verification.

## File map

- `src/components/features/guest-app/prototype-controls.tsx` adds accessible device and Duo-pose choices to the existing controls panel.
- `src/components/features/guest-app/guest-app-prototype.tsx` owns preview state, connects control callbacks, and marks the active preview on `.guest-device`.
- `src/components/features/guest-app/guest-app-prototype.css` sizes the selected preview, adds the open-pose fold treatment, and adapts primary navigation and screen insets for the inner display.

---

### Task 1: Add device and pose controls

**Files:**
- Modify: `src/components/features/guest-app/prototype-controls.tsx`
- Modify: `src/components/features/guest-app/guest-app-prototype.tsx`

**Interfaces:**
- `PrototypeControls` consumes `device: PrototypeDevice`, `duoPose: PrototypeDuoPose`, `onDeviceChange: (device: PrototypeDevice) => void`, and `onDuoPoseChange: (pose: PrototypeDuoPose) => void`.
- Define `PrototypeDevice` as `'iphone' | 'iphone-duo'` and `PrototypeDuoPose` as `'closed' | 'open'` in `prototype-controls.tsx`, then import those types in `guest-app-prototype.tsx`.
- `GuestAppPrototype` produces the active values and callbacks for `PrototypeControls` and the matching `data-device` and `data-pose` attributes on its existing `.guest-device` section.

```ts
export type PrototypeDevice = 'iphone' | 'iphone-duo';
export type PrototypeDuoPose = 'closed' | 'open';
```

- [ ] Read `node_modules/next/dist/docs/01-app/01-getting-started/11-css.md` and `node_modules/next/dist/docs/01-app/01-getting-started/05-server-and-client-components.md` before changing application code.
- [ ] Add the two preview types and the four typed control props.
- [ ] Add `device` and `duoPose` state to `GuestAppPrototype`:

```tsx
const [device, setDevice] = useState<PrototypeDevice>('iphone');
const [duoPose, setDuoPose] = useState<PrototypeDuoPose>('closed');
```

- [ ] Pass preview state and setters to `PrototypeControls` without changing the existing state or navigation callbacks.
- [ ] Add a **Device** tab with native radio controls for **iPhone** and **iPhone Duo**. Show native radio controls for **Closed** and **Open** only while **iPhone Duo** is selected.
- [ ] Keep the chosen Duo pose when the presenter switches back to iPhone and later returns to Duo.
- [ ] Add `data-device={device}` and `data-pose={duoPose}` to the current `.guest-device` section. Keep the standard iPhone selection as the existing default rendering.

**Acceptance criteria:** The Device tab appears in Prototype controls; device and pose selections are labelled, keyboard-operable, and touch-operable; changing them leaves the current guest-app screen and booking intact.

### Task 2: Add the Duo frame and open-pose layout

**Files:**
- Modify: `src/components/features/guest-app/guest-app-prototype.css`

**Interfaces:**
- CSS selects the existing `.guest-device` using its `data-device` and `data-pose` attributes.
- The existing `.guest-bottom-nav` remains the primary navigation control; in the open pose it moves to a vertical rail, while the screen reserves inline space for the rail and the center fold region.

- [ ] Add a closed-pose frame using `aspect-ratio: 1398 / 2034` and an open-pose frame using `aspect-ratio: 2670 / 1878`:

```css
.guest-device[data-device='iphone-duo'][data-pose='closed'] {
  aspect-ratio: 1398 / 2034;
}

.guest-device[data-device='iphone-duo'][data-pose='open'] {
  aspect-ratio: 2670 / 1878;
}
```

- [ ] Bound both Duo frames by the available browser width and height while preserving their aspect ratios.
- [ ] Add a narrow visual fold region centered on the open display. Keep the primary controls and content outside that region.
- [ ] In the open pose, position `.guest-bottom-nav` on the device’s vertical edge, keep its current navigation actions available, and update `.guest-screen.has-nav` and dependent floating content insets so they do not sit under the rail.
- [ ] Keep the closed pose compact and retain the existing bottom navigation and compact content layout.
- [ ] Review the final source diff without running tests. Confirm no unrelated files were modified by this implementation.

**Acceptance criteria:** Standard iPhone mode retains its existing frame and layout. Duo Closed uses the outer-display proportions and compact navigation. Duo Open uses the inner-display proportions, a visible central fold region, vertical primary navigation, and enough content inset to keep interactive elements reachable.
