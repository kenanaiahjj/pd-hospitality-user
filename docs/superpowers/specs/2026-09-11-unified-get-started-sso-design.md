# Unified Get started SSO entry

## Goal

Make the guest app's account entry a single `Get started` action. Guests use
Apple or Google SSO without choosing between account creation and login. The
SSO identity service determines whether the identity is new or returning; the
prototype presents the SSO controls in a bottom sheet and sends both provider
choices directly to the booking lookup form.

## Scope

- The welcome screen has one primary `Get started` button.
- `Get started` opens an accessible native bottom sheet over the welcome
  screen. There is no navigable `get-started` page.
- Both SSO providers create an authenticated session with no attached booking
  and navigate directly to `Find your booking`, which asks for a reference
  number and last name.
- Room QR is removed from pre-arrival booking choices and appears on Home only
  for an arrived, active stay.
- Existing booking-reference recovery, front-desk assistance, and stay flows
  remain available.
- Former account-type links and labels are removed or retargeted to the
  welcome screen.
- The prototype screen model, focused tests, and `docs/llm-context.md` are
  updated to describe the unified flow.

## Flow

```text
entry-hub --Get started--> SSO bottom sheet --Apple/Google SSO--> identify
                                      |
                                      +-- booking-reference recovery remains
                                          available from the sheet
```

The SSO buttons share one completion handler. A successful provider callback
sets `auth: 'authenticated'`, records the provider, clears any pending intent,
and calls the existing post-auth routing. Because the prototype session starts
without a booking, that routing resolves to `identify`, the direct lookup form.
No provider is treated as “new” or “returning.”

## UI and accessibility

- `WelcomeScreen` exposes exactly one account action named `Get started`.
- The bottom sheet uses a stable heading named `Get started`, concise
  supporting copy, and the existing labeled Apple and Google buttons.
- The offline notice and disabled SSO controls remain available when the app is
  offline.
- The sheet contains no `Create account`, `Log in`, or account-switch link.
- The native dialog closes from its close button, Escape, or backdrop and
  returns focus to the `Get started` trigger.
- Existing minimum hit targets, focus behavior, and app-shell semantics remain
  intact.

## Implementation boundaries

- Replace the `sign-in` and `create-account` entry presentation with a local
  SSO bottom-sheet state; do not add a new screen ID.
- Add one provider-neutral session factory or handler in the prototype model;
  retain existing session helpers only where existing tests or non-entry flows
  still need them.
- Route an account with no booking to `identify` and keep its reference and
  last-name form as the first post-auth page.
- Keep room QR available from the active Home only; do not expose it as a
  pre-arrival choice.
- Do not otherwise change booking matching, session persistence, navigation
  history, or authenticated stay screens.

## Verification

Add or update tests for:

1. The root and guest welcome screens showing only `Get started`.
2. The bottom sheet rendering both SSO providers and no account-type copy.
3. Apple and Google both reaching the direct `Find your booking` form with
   reference and last-name fields.
4. Offline SSO controls being disabled with the connection notice visible.
5. Escape closing the sheet and restoring focus to `Get started`.
6. Room QR appearing on active Home and not in the pre-arrival booking entry.
7. Existing booking-reference and stay-flow tests continuing to pass.

Run the full test suite, typecheck, lint, production build with the configured
`API_BASE_URL`, and `git diff --check` after implementation.
