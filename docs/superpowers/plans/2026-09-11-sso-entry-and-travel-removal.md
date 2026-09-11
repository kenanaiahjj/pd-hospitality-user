# SSO entry and travel removal implementation plan

## 1. Establish the contract

- Make the root account gate explicit in model and page/component tests.
- Add Apple and Google SSO fixture tests for new and returning guests.
- Set the screen inventory expectation to the 51 remaining stay-only screens.

## 2. Update the session and model

- Replace password/email-code auth states with `anonymous` and
  `authenticated` plus Apple/Google methods.
- Remove travel bookings, travel notifications, travel categories, travel
  screen IDs, and travel-only model helpers.
- Keep booking-reference verification and room-folio settlement unchanged.
- Version stored sessions so the old shape is ignored safely.

## 3. Update the UI and styling

- Make `WelcomeScreen` route to account creation or sign-in.
- Render Apple and Google SSO actions and keep the booking lookup fallback.
- Remove Explore travel tiles, travel screens, travel checkout, and related
  styles. Keep four on-property category tiles and existing navigation.

## 4. Remove obsolete assets and tests

- Delete carrier logos, route destination imagery, and the travel category
  illustration.
- Remove tests for travel destinations, categories, checkout, notifications,
  and password entry. Add session-version coverage and update the remaining
  Explore and persistence assertions.
- Update `docs/llm-context.md` to describe account-first SSO entry and the
  stay-only scope.

## 5. Verify and hand off

- Run focused model, component, page, storage, and image tests.
- Run the full Vitest suite and production build.
- Run `git diff --check` and inspect status to preserve unrelated changes.
- Commit the feature branch without merging or pushing unless requested.
