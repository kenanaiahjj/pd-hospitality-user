# Pre-arrival Passport Simulation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a transparent demo passport photo/upload and OCR-style autofill interaction to the primary guest and companion pre-arrival ID steps.

**Architecture:** Add one local React capture panel to the existing client-side guest-app prototype. It presents simulated photo and upload choices, a demo passport preview, a brief reading state, and a success state; the existing editable document-number and expiry-date fields receive deterministic sample values through controlled state.

**Tech Stack:** Next.js client component, React state/effects, TypeScript, existing Phosphor icons, CSS.

## Global Constraints

- Simulate both choices in the prototype. Do not request camera or file access, send data to a service, or persist an image.
- Autofill the existing document number and expiry date fields with deterministic sample data. Keep the fields editable and retain manual entry as a fallback.
- For companions, associate the same simulated document result with the selected companion; do not copy the primary guest’s personal details.
- Preserve the current Continue and Save and continue transitions, validation, and completion behavior.
- Make progress and completion perceivable to assistive technology with status announcements. Keep controls keyboard-operable and honor reduced-motion preferences.
- Do not add dependencies, actual image assets, camera APIs, file inputs, network OCR, or persistence.

---

### Task 1: Build the reusable simulated passport panel

**Files:**
- Modify: `src/components/features/guest-app/guest-app-prototype.tsx` — Add `PassportCapturePanel` near the pre-arrival guest form components.
- Modify: `src/components/features/guest-app/guest-app-prototype.css` — Add scoped `.guest-passport-capture*` presentation.

**Interfaces:**
- Consumes: `Field`-compatible document data, existing icon package, theme variables, and the selected guest name.
- Produces: `PassportCapturePanel({ subjectName, onAutofill })`, where `onAutofill` receives `{ documentNumber: string; expiry: string }` after the simulated read finishes.

- [x] Define the exact data contract and deterministic demo result:

```tsx
type PassportFields = { documentNumber: string; expiry: string };

const DEMO_PASSPORT_FIELDS: PassportFields = {
  documentNumber: 'P1234567A',
  expiry: '2030-05-20',
};
```

- [x] Add local states `idle`, `preview`, `reading`, and `complete`; choosing either photo or upload enters the same clearly labeled demo preview without calling a browser device or file API.
- [x] From the preview, let the guest start the simulated read. Announce `Reading passport details` with `role="status"` and `aria-live="polite"`; after a short timer, call `onAutofill(DEMO_PASSPORT_FIELDS)` and announce that the demo filled the editable fields.
- [x] Clean up the reading timer when the panel unmounts. Keep the preview and reading visuals static so reduced-motion settings need no extra animation path.
- [x] Style the choice buttons, preview, and status using existing `.guest-*` colors, spacing, borders, and focus treatment; keep each control at least 44px tall.
- [x] Run `git diff --check` and inspect the component for any `getUserMedia`, file input, fetch, upload, or persistence path; none should exist.

### Task 2: Wire autofill into both ID forms

**Files:**
- Modify: `src/components/features/guest-app/guest-app-prototype.tsx` — `AdditionalGuestsScreen`, primary `id-capture` state, and the `id-capture` screen case.
- Modify: `src/components/features/guest-app/guest-app-prototype.test.tsx` — Update the existing companion ID-flow assertion for the replaced capture control.

**Interfaces:**
- Consumes: `PassportFields` and `PassportCapturePanel` from Task 1; existing `Field` supports controlled `value` and `onValueChange` props.
- Produces: Controlled but editable primary and companion document-number/expiry fields whose values remain attached to the correct guest.

- [x] Add primary guest passport-field state inside `GuestAppPrototype`; pass its stable update callback to `PassportCapturePanel` with the current primary guest name.
- [x] Bind the primary guest’s existing `document-number` and `expiry` fields to that state. Manual typing updates the same state, and the existing `Save and continue` navigation remains unchanged.
- [x] In `AdditionalGuestsScreen`, bind `companion-document` and `companion-expiry` to `draft.documentNumber` and `draft.expiry`; pass the selected `draft.name` and a stable draft update callback to `PassportCapturePanel`.
- [x] Keep the existing Save guest handler reading the controlled input values from `FormData`; retain the current details/list/back navigation and avoid overwriting companion name, nationality, email, or mobile with primary-guest data.
- [x] Update the existing companion flow assertion to check the accessible `Passport photo options` group; do not add a new test case.
- [x] Confirm each flow can use photo simulation, upload simulation, or manual entry; OCR populates the two fields and both remain editable after recognition.
- [x] Run `git diff --check` and inspect both transitions. Use the existing local preview at `http://localhost:3001/` for both ID steps, including the companion ID subflow.

**Manual verification:** The primary and companion flows show a demo image preview, reading status, and demo-complete status; a successful read fills the intended guest’s document number and expiry; no actual device access occurs.
