# Profile polish and pre-arrival passport autofill

**Status:** Profile polish approved by the user on 2026-09-23. Passport simulation details are ready for review.

## Goal

Make the guest Profile screen easier to scan while adding a clear, simulated passport capture and autofill step to pre-arrival. Preserve the existing Cabana light surface, restrained accent color, and hairline dividers.

## Current screen

The screen presents the guest name and recognition message, contact details, passport status, Achievements, Stay history, and Sign out. The signed-in shell uses a flat layout rather than stacked cards.

## Design

- Keep the guest name as the page heading and retain the recognition message.
- Remove the redundant “Personal space” eyebrow and shorten “Your account” to “Account.”
- Keep the identity block flat. Align the avatar, email, and phone as one compact group.
- Make passport status easier to identify with a document icon, clear “Passport on file” text, the existing last four digits, and the existing “On file” status.
- Keep Achievements and Stay history in one list. Align their icons, labels, supporting counts, and chevrons consistently; preserve the existing actions and data.
- Keep Sign out separate from account navigation, with its existing sign-out action and danger-colored icon.

## Constraints

- Do not add profile fields, settings, destinations, or new behavior.
- Do not change profile data, authentication, or bottom navigation.
- Use existing `.guest-*` styles and theme tokens. Do not add gradients, stacked cards, or new animation.
- Preserve keyboard focus visibility, accessible names, and comfortable mobile touch targets.

## Acceptance criteria

- The Profile screen keeps the current information and actions.
- A guest can scan identity, passport status, account destinations, and Sign out as distinct groups.
- The layout fits narrow mobile widths without horizontal overflow.
- Existing navigation and sign-out behavior remain unchanged.

## Pre-arrival passport capture

### Current flow

Pre-arrival has a guest-details step, an ID step with a no-op “Capture or upload ID” button and editable document-number and expiry-date fields, then additional guests and early check-in. Companion guests have a separate ID subflow with the same no-op capture control and manual fields.

### Design

- Keep the current step order and use the ID step for passport capture.
- Replace the no-op capture control on both the primary guest and companion ID flows with two choices: take a passport photo or upload a photo.
- Simulate both choices in the prototype. Do not request camera or file access, send data to a service, or persist an image.
- Show a passport preview and a brief “Reading passport details” state, followed by a clear success state that identifies the result as a demo simulation.
- Autofill the existing document number and expiry date fields with deterministic sample data. Keep the fields editable and retain manual entry as a fallback.
- For companions, associate the same simulated document result with the selected companion; do not copy the primary guest’s personal details.
- Preserve the current Continue and Save and continue transitions, validation, and completion behavior.
- Make progress and completion perceivable to assistive technology with status announcements. Keep controls keyboard-operable and honor reduced-motion preferences.

### Acceptance criteria

- The primary guest and companion ID flows each offer photo and upload choices that lead through the simulated recognition state.
- Successful simulation fills the existing document-number and expiry-date fields, which remain editable.
- Guests can complete the existing manual-entry path without running the simulation.
- The prototype does not invoke actual device capture, file selection, network OCR, or image persistence.
- Existing pre-arrival navigation, validation, and completion behavior remain unchanged.
