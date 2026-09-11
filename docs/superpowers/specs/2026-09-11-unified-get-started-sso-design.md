# Unified Get started SSO entry

## Goal

Make the guest app's account entry a single `Get started` action. Guests use
Apple or Google SSO without choosing between account creation and login. The
SSO identity service determines whether the identity is new or returning; the
prototype sends both provider choices through the same booking-connection
step.

## Scope

- The welcome screen has one primary `Get started` button.
- A new `get-started` screen presents Apple and Google SSO with neutral account
  copy and the existing offline behavior.
- Both SSO providers create an authenticated session with no attached booking
  and navigate to `Find your booking`.
- Existing booking-reference recovery, room QR, front-desk assistance, and
  stay flows remain available and unchanged.
- Former account-type links and labels are removed or retargeted to
  `get-started`.
- The prototype screen model, focused tests, and `docs/llm-context.md` are
  updated to describe the unified flow.

## Flow

```text
entry-hub --Get started--> get-started --Apple/Google SSO--> connect-booking
                                      |
                                      +-- booking-reference recovery remains
                                          available from its existing lookup paths
```

The SSO buttons share one completion handler. A successful provider callback
sets `auth: 'authenticated'`, records the provider, clears any pending intent,
and calls the existing post-auth routing. Because the prototype session starts
without a booking, that routing resolves to `connect-booking`. No provider is
treated as “new” or “returning.”

## UI and accessibility

- `WelcomeScreen` exposes exactly one account action named `Get started`.
- `get-started` uses a stable heading named `Get started`, concise supporting
  copy, and the existing labeled Apple and Google buttons.
- The offline notice and disabled SSO controls remain available when the app is
  offline.
- The screen contains no `Create account`, `Log in`, or account-switch link.
- Existing minimum hit targets, focus behavior, and app-shell semantics remain
  intact.

## Implementation boundaries

- Replace the `sign-in` and `create-account` entry presentation with
  `get-started`; update all entry links that previously targeted either screen.
- Add one provider-neutral session factory or handler in the prototype model;
  retain existing session helpers only where existing tests or non-entry flows
  still need them.
- Do not change booking matching, session persistence, navigation history, or
  authenticated stay screens.

## Verification

Add or update tests for:

1. The root and guest welcome screens showing only `Get started`.
2. The unified screen rendering both SSO providers and no account-type copy.
3. Apple and Google both reaching `Find your booking`.
4. Offline SSO controls being disabled with the connection notice visible.
5. Existing booking-reference and stay-flow tests continuing to pass.

Run the full test suite, typecheck, lint, production build with the configured
`API_BASE_URL`, and `git diff --check` after implementation.
