# Signed-in no-booking state and email OTP login design

> Produced by `superpowers:brainstorming` (architectural path). Once this
> document is `Approved`, the next skill is `superpowers:writing-plans`.

| | |
|---|---|
| **Status** | `In Review` |
| **Created** | 2026-09-18 |
| **Updated** | 2026-09-18 |
| **Owner** | kenana@lmf.ventures |
| **Plan** | `docs/superpowers/plans/2026-09-18-signed-in-no-booking-email-otp.md` (once written) |
| **Supersedes** | The entry and post-auth portions of `docs/superpowers/specs/2026-09-11-unified-get-started-sso-design.md` |
| **Superseded by** | `n/a` |

This spec is the binding authority for this change. Existing product rules about
booking-first access, room-folio settlement, and stay-only scope remain in force.

## Summary

Complete the account-entry prototype with an email-and-one-time-code login
path. A signed-in account with no booking must begin at the booking lookup form,
which asks for a booking or confirmation number and last name. The prototype
controls must expose that state directly, and the Chat destination must only
appear after the account has at least one booking.

## Context

The working tree already contains an `account-only` / `Signed in, no booking`
prototype state in `prototype-model.ts`. Its session shape is correct, but the
control currently opens `stay-overview`, so the first task for the guest is an
empty home rather than the booking lookup. The current `Get started` sheet has
Apple and Google actions only. The component has an older booking-reference
verification path, but it does not expose email entry followed by an OTP.

The current navigation condition shows Chat for every authenticated session,
including authenticated sessions with no bookings. The new behavior must keep
the authenticated shell available while removing Chat until a booking exists.

Relevant units are:

- `src/components/features/guest-app/prototype-model.ts`
- `src/components/features/guest-app/guest-app-prototype.tsx`
- `src/components/features/guest-app/guest-app-prototype.css`
- `src/components/features/guest-app/prototype-model.test.ts`
- `src/components/features/guest-app/guest-app-prototype.test.tsx`

## Non-goals

- Real authentication, email delivery, OTP generation, rate limiting, or
  credential storage.
- Password login, password recovery, or account creation changes.
- Changes to Apple or Google SSO behavior.
- Changes to booking matching, booking confirmation, or pre-arrival forms.
- A Chat screen for an account with no booking. A direct prototype deep link can
  still render existing screens unless the current product gate explicitly
  blocks that screen.
- Hotel discovery, flights, transport, rewards, marketplace, or card checkout.

## Success criteria

- [ ] The `Get started` sheet keeps Apple and Google and adds `Log in with
      email`.
- [ ] Selecting `Log in with email` opens a labeled email form.
- [ ] Submitting a valid email opens a labeled six-digit OTP form.
- [ ] Submitting a six-digit OTP creates an authenticated session with no
      booking and opens `Find your booking`.
- [ ] The `Signed in, no booking` prototype-control state opens
      `Find your booking`, with booking ID and last-name fields visible.
- [ ] The primary navigation contains Home and Profile, but not Chat, for an
      authenticated session with no booking.
- [ ] Connecting a booking restores the Chat destination while preserving the
      existing booking flow.
- [ ] Invalid OTP input remains on the OTP screen and exposes an inline,
      accessible error.
- [ ] Offline authentication remains blocked and does not create a session.
- [ ] Focus, labels, keyboard operation, and reduced-motion contracts remain
      valid for the dialog and both forms.
- [ ] Targeted tests, typecheck, lint, production build, full tests, and
      `git diff --check` pass.

## Approaches considered

### Recommended: dedicated email and OTP screens

Keep Apple and Google in the existing `Get started` dialog. Add a
`Log in with email` action that closes the dialog and navigates to dedicated
`sign-in` and `verify-code` screen IDs. Hold the pending email in the client
component, then create the authenticated no-booking session only after a valid
six-digit code is submitted.

**Why:** The two steps need their own reading order, validation messages, and
back-navigation. Dedicated screens reuse the existing form and screen-shell
contracts and keep the bottom sheet focused on provider choice.

**Costs:** The screen registry gains two entry screens and the component gains a
small pending-login state.

### Alternative: keep email and OTP inside the bottom sheet

Replace the provider list in the existing dialog with local email and OTP
substates. **Rejected because:** the dialog would become a mini-router with a
second focus-management path, and the user could not use the existing screen
history and back behavior consistently.

### Alternative: land authenticated email users on the empty Home screen

Keep the current post-auth destination and let the guest find the booking from
Home. **Rejected because:** a no-booking account's required next action is to
connect a booking, and the user explicitly asked for the booking ID and last
name form as the starting state.

## Design

### Architecture

Keep the existing single-client-component prototype boundary. Pure session
construction and post-auth routing remain in `prototype-model.ts`; React state,
form submission, focus restoration, and navigation remain in
`guest-app-prototype.tsx`.

Extend the auth vocabulary with an email method and a pure email-login session
factory. The resulting session is authenticated, has the entered email, keeps
the existing profile identity and history fixture for a recognizable account,
and has no current bookings. `getPostAuthScreen(session)` returns `identify`
when the authenticated session has no bookings and returns the existing home
destination for a session with a booking.

The existing `account-only` prototype state remains the canonical no-booking
fixture. Applying it resets navigation and selects `identify`, rather than
`stay-overview`. The primary nav remains available on authenticated screens,
but its Chat button is rendered only when `primaryBooking` exists. With no
booking, the shell therefore exposes Home and Profile only.

### Components

**`src/components/features/guest-app/prototype-model.ts`**

- **Does:** owns the email auth method, the authenticated no-booking session,
  and session-aware post-auth route.
- **Used as:** `emailLoginSession(email: string): GuestSession` and
  `getPostAuthScreen(session: GuestSession): ScreenId`.
- **Depends on:** existing session fixtures, `ANONYMOUS_SESSION`, and the
  booking collection on `GuestSession`.

**`src/components/features/guest-app/guest-app-prototype.tsx`**

- **Does:** exposes the email-login action, renders the email and OTP screens,
  owns pending email and OTP error state, starts the no-booking control state on
  booking lookup, and conditionally renders Chat.
- **Used as:** unchanged `<GuestAppPrototype initialSession? initialScreen?
  initialOnline? />`.
- **Depends on:** the model helpers, existing `Field`, `Button`, `Notice`, and
  screen navigation functions.

**`src/components/features/guest-app/guest-app-prototype.css`**

- **Does:** provides the small layout additions needed for the email and OTP
  forms while reusing existing `.guest-form` and `.guest-code-field` styles.
- **Used as:** styles imported by the prototype component.
- **Depends on:** existing guest tokens and the current responsive contracts.

### Data flow

```text
Get started
  └─ Log in with email
       └─ sign-in: email
            └─ verify-code: six-digit OTP
                 └─ emailLoginSession(email)
                      └─ getPostAuthScreen(session)
                           └─ identify: booking ID + last name
                                └─ existing booking-found flow
```

The prototype accepts any six-digit numeric code as a simulated verification.
It does not claim to send or validate a real code. A non-six-digit value stays
on `verify-code` and shows an inline error connected to the input.

### Interfaces and contracts

```ts
// src/components/features/guest-app/prototype-model.ts
export type AuthMethod = 'apple' | 'google' | 'email';

export function emailLoginSession(email: string): GuestSession;

export function getPostAuthScreen(session: GuestSession): ScreenId;
```

The email-login session must satisfy:

```ts
{
  auth: 'authenticated',
  accountStatus: 'returning',
  authMethod: 'email',
  email: enteredEmail,
  bookings: [],
  activeBookingId: undefined,
}
```

The control state must satisfy:

```ts
applyPrototypeStayState('account-only').auth === 'authenticated'
applyPrototypeStayState('account-only').bookings.length === 0
```

and selecting that state in the component must set the active screen to
`identify`.

### Error handling and accessibility

- The email field uses native email semantics, a visible label, `required`,
  and the existing online gate. Offline login controls are disabled and the
  connection notice remains visible.
- The OTP field uses `inputMode="numeric"`,
  `autoComplete="one-time-code"`, `maxLength={6}`, a visible label, and a
  numeric pattern. The error uses `role="alert"` or an equivalent live status,
  and the input references it with `aria-describedby` and `aria-invalid` while
  invalid.
- The existing dialog close behavior and focus restoration to `Get started`
  remain unchanged. Moving from the dialog to `sign-in` closes the dialog
  before navigation.
- The Chat button is absent, not merely disabled, when the session has no
  booking. A booking connected through the existing lookup path makes the
  button render normally.

## Testing

Add or update focused tests for:

1. `emailLoginSession` and `getPostAuthScreen` in
   `prototype-model.test.ts`.
2. The email action in the `Get started` dialog.
3. Email submission moving to OTP, including the labeled one-time-code input.
4. Invalid OTP staying on the screen, then a six-digit OTP opening booking
   lookup with booking ID and last-name fields.
5. The `account-only` control state opening booking lookup.
6. No Chat button for authenticated no-booking sessions and Chat returning once
   a booking is connected.
7. Existing Apple/Google, booking lookup, SSO focus, and navigation tests.

## Global constraints

- Preserve unrelated dirty-worktree changes. Stage only files required by this
  feature and its spec/plan.
- Keep the guest app in-memory. Do not add an API, credentials, delivery
  integration, or route.
- Keep Hospitality booking-first and stay-only. Do not add hotel discovery,
  flights, transport, rewards, marketplace, or consumer card-payment flows.
- Follow the current Next.js guidance in `node_modules/next/dist/docs/` before
  writing source code.
- Use the existing `.guest-*` contracts and accessible native form elements.
- Verification must include:
  `API_BASE_URL=https://jsonplaceholder.typicode.com npm run typecheck`,
  `API_BASE_URL=https://jsonplaceholder.typicode.com npm run lint`,
  `API_BASE_URL=https://jsonplaceholder.typicode.com npm run build`,
  `npm test`, and `git diff --check`.

## Open questions

None. The user approved the email action in the existing `Get started` sheet,
the email-to-OTP sequence, the lookup-first no-booking state, and the booking-
gated Chat tab.

## Decision log

| Date | Decision | Why | Cost if wrong |
|---|---|---|---|
| 2026-09-18 | Use dedicated `sign-in` and `verify-code` screens behind the existing provider sheet | Keeps provider choice, form validation, history, and focus behavior separate | Two entry screen IDs and a small pending-email state must be maintained |
| 2026-09-18 | Email OTP verifies into an authenticated session with no current booking | The requested signed-in state must lead with booking ID and last name | Returning email users are represented by the prototype's no-booking fixture until real identity data exists |
| 2026-09-18 | Render Chat only when a booking exists | Chat is a stay service and has no valid context without a booking | Guests without a booking cannot use front-desk Chat from the shell |

## Self-review

- No placeholders or unresolved questions remain.
- The model, component, CSS, and tests agree on the same screen IDs and session
  contract.
- The scope is one focused prototype-entry and navigation change.
- The no-booking routing and Chat condition are explicit rather than inferred
  from visual state.
