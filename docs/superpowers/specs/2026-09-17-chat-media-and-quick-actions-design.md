# Front desk chat media and quick actions

## Outcome

Improve the existing front-desk chat view so a guest can start common requests quickly and send local image or voice attachments. The change must preserve the existing chat route, front-desk reply simulation, offline queue behavior, post-stay availability window, and navigation wiring.

This remains a browser-only prototype. Media is selected or recorded locally and is not uploaded to a server or persisted across reloads.

## Scope

### In scope

- Replace the current ad hoc quick-request array with a small, explicit set of request actions:
  - Towels
  - Housekeeping
  - Late checkout
  - Room issue
  - Transfers
- Keep the actions horizontally scrollable, keyboard reachable, and available before arrival when chat is available.
- Add an image attachment control that accepts one image, shows a preview, and allows removal before sending.
- Add a microphone control that records up to 30 seconds with `MediaRecorder`, shows elapsed time, and supports cancel, playback, and send.
- Render sent image and voice attachments in the conversation with text and delivery state.
- Provide clear status feedback for microphone permission denial, unsupported recording, invalid image type, and oversized images.
- Keep the composer and media controls disabled when the existing chat window is closed.

### Out of scope

- Server uploads, authentication changes, message persistence, push notifications, transcription, image editing, multi-image galleries, or a new chat route.
- Changes to booking, room verification, folio, payment, service booking, or Explore behavior.

## Interaction design

The screen keeps the front-desk status and property context at the top. Quick actions sit below the introduction as pill buttons and send the same kind of guest message as typed text. The conversation remains the primary content area and grows toward the composer.

The composer becomes a compact two-level surface:

1. A selected-media strip appears only when an image or recording is ready. It includes a thumbnail or audio player, a descriptive label, and a remove button.
2. The input row contains an attachment button, the existing text field, and a trailing action. The trailing action sends when text or media exists; otherwise it starts voice recording. The attachment button opens a native image picker.

Recording replaces the trailing action with a visible recording state: elapsed time, a stop button, and a cancel action. Stopping creates a local audio preview. Sending adds the attachment to the guest message and returns the composer to its idle state.

Use the existing neutral, pink, and surface tokens. Keep controls at least 44 pixels high, use native buttons and inputs, and respect reduced motion. The existing received-image lightbox remains available; local image attachments use the same visual language.

## State and data flow

`GuestAppPrototype` remains the owner of chat state. Extend the in-memory message shape with an attachment list whose entries contain:

- `kind`: `image` or `audio`
- `url`: a browser object URL for local media
- `name`: the selected filename or a generated voice label
- `duration`: seconds for audio when available

Use separate draft state for a pending image and recording. Create object URLs only after a file or recording exists. Revoke URLs when a pending attachment is removed, after a sent message is no longer reachable, and when the component unmounts. Do not write object URLs to session storage.

Typed text and quick actions continue through the existing send path. The media send path uses the same delivery state (`Sent` or `Will send when connected`) and the same simulated desk reply timer. Offline sends remain queued on the device; closed chat does not create a message.

Image handling accepts `image/*` and rejects files larger than 10 MB with an accessible status message. Voice handling requests microphone permission only after the guest activates recording. If `MediaRecorder`, `navigator.mediaDevices`, or the microphone permission is unavailable, keep the text and image controls usable and announce the fallback.

## Accessibility and failure states

- Give image, microphone, stop, cancel, remove, and send controls explicit accessible names.
- Associate the file input with its button and keep the native input visually hidden but keyboard operable through the button.
- Use a polite live region for recording status, attachment validation, permission errors, and delivery state.
- Make the recording timer supplemental; the stop button and `Recording` label must communicate the state without relying on motion.
- Provide visible focus styles and Escape-to-close behavior for the existing image preview.
- Mark the composer as unavailable when the post-stay chat window is closed, and keep the existing explanatory message.

## Verification

Add component tests for:

- Every quick action producing the expected guest message.
- Image selection, preview, removal, send, and invalid/oversized file feedback.
- Recording start, stop, cancel, send, and permission-denied fallback with a mocked `MediaRecorder`.
- Offline media delivery state and closed-chat disabled controls.
- Existing typed-message, catalog-image, front-desk reply, and chat navigation behavior.

Run the focused chat tests, the full test suite, lint, typecheck, `git diff --check`, and the production build. Report any pre-existing baseline failures separately from the new chat checks.

## Decisions

- Use real local browser interactions for the prototype because they demonstrate the intended user flow without adding a backend contract.
- Limit each outgoing message to one image or one voice recording to keep the prototype state small and the composer legible.
- Keep message delivery semantics unchanged so the feature does not alter the existing stay and front-desk flows.
