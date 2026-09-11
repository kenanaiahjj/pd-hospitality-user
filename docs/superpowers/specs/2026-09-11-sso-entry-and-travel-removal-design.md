# SSO entry and travel removal design

## Decision

Make account access the first visible step in the guest app. The root screen
shows `Create account` and `Log in`; each account screen offers `Continue with
Apple` and `Continue with Google`, in that order. The prototype simulates an
immediate successful SSO response with deterministic fixture identities. It
does not add provider SDKs, callbacks, tokens, or backend authentication.

After SSO, a new guest lands on `Find your booking`. A returning guest lands on
`Welcome back` with the saved fixture stay. Booking-reference re-entry remains
available as a separate, verified path.

Remove the Travel category and all flight, ferry, carrier, route, transport
checkout, travel notification, travel folio, and travel asset paths. Explore
contains only on-property dining, spa and wellness, activities and tours, and
hotel services. Existing stays, services, dining, folio, chat, profile, and
booking lookup behavior remain in scope.

## Scope

- Update auth state and session persistence to use only `anonymous` and
  `authenticated`, with Apple and Google methods.
- Remove travel screen IDs, model data, state, notifications, UI branches,
  styles, route imagery, carrier logos, and obsolete tests.
- Keep booking confirmation, room QR, and hotel Wi-Fi entry after account
  access. Keep room charges on the active room folio and settled at checkout.
- Update the source context and tests so the root entry and four Explore
  categories are explicit.

## Acceptance criteria

1. `/` renders `Create account` and `Log in` with no app navigation chrome.
2. Create-account and sign-in screens expose Apple and Google SSO controls.
3. Apple create and Google sign-in produce authenticated sessions and route to
   the expected post-auth screens.
4. No Travel category, travel screen, flight/ferry/transport checkout, carrier
   logo, travel notification, or travel asset remains reachable or referenced
   by the app.
5. Booking lookup, room QR, Wi-Fi, services, dining, folio, chat, profile, and
   stay history continue to work.
6. Focused and full test suites, `git diff --check`, and the production build
   pass.
