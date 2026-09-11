# Unified Get started SSO Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the guest app's separate account-creation and login entry points with one `Get started` SSO flow that opens as a bottom sheet and sends both providers directly to the booking lookup form.

**Architecture:** Keep the existing `GuestAppPrototype` state machine and booking routing. Render provider-neutral SSO as local state on the welcome screen, route both callbacks through the existing `completeAuth`/`getPostAuthScreen` path, and make an account without a booking land directly on `identify`. Keep booking-reference re-entry as a separate recovery path and expose Room QR from active-stay Home only.

**Tech Stack:** Next.js 16.3.4, React 19, TypeScript, Vitest, Testing Library, ESLint.

## Global Constraints

- The welcome screen has one primary `Get started` action.
- Apple and Google SSO both navigate directly to `Find your booking` in the prototype.
- `Get started` opens a native bottom sheet instead of a full page.
- Room QR is an arrived-stay Home action, not a pre-arrival booking option.
- The screen contains no `Create account`, `Log in`, or account-switch link.
- Existing booking matching, session persistence, navigation history, and authenticated stay screens remain unchanged.
- Preserve existing minimum hit targets, focus behavior, `.guest-*` contracts, and offline behavior.
- Preserve unrelated dirty-worktree files; stage only files for this feature.

---

### Task 1: Lock the unified entry contract with failing tests

**Files:**
- Modify: `src/app/(marketing)/page.test.tsx`
- Modify: `src/components/features/guest-app/guest-app-prototype.test.tsx`
- Modify: `src/components/features/guest-app/prototype-model.test.ts`

**Interfaces:**
- Consumes: Existing `GuestAppPrototype`, `HomePage`, `ANONYMOUS_SESSION`, and Testing Library helpers.
- Produces: Failing assertions for the SSO bottom sheet, one welcome action, direct lookup routing, the active-Home Room QR action, and a 49-screen inventory.

- [ ] **Step 1: Update the root and welcome assertions.**

  In `src/app/(marketing)/page.test.tsx`, replace the separate button assertions with:

  ```tsx
  expect(screen.getByRole('button', { name: 'Get started' })).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Create account' })).toBeNull();
  expect(screen.queryByRole('button', { name: 'Log in' })).toBeNull();
  ```

  In the first `GuestAppPrototype` test, make the same replacement. Rename the test to `opens on a unified SSO account gate without app chrome or travel`.

- [ ] **Step 2: Add focused SSO behavior tests.**

  Replace the current account-creation and login tests with one screen test and two provider tests:

  ```tsx
  it('opens the unified SSO screen from Get started', async () => {
    const user = userEvent.setup();
    render(<GuestAppPrototype />);

    await user.click(screen.getByRole('button', { name: 'Get started' }));

    expect(screen.getByRole('heading', { name: 'Get started' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Continue with Apple' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Continue with Google' })).toBeInTheDocument();
    expect(screen.queryByText(/Create your account|Already have an account|Don't have an account|Log in/)).toBeNull();
  });

  it.each(['Apple', 'Google'] as const)('routes %s SSO to booking connection', async (provider) => {
    const user = userEvent.setup();
    render(<GuestAppPrototype />);

    await user.click(screen.getByRole('button', { name: 'Get started' }));
    await user.click(screen.getByRole('button', { name: `Continue with ${provider}` }));

    expect(screen.getByRole('heading', { name: 'Find your booking' })).toBeInTheDocument();
  });
  ```

  Update account-gate helpers and re-entry tests to open the sheet from the welcome action. Change the booking-reference action query to the provider-neutral label `Use a booking reference instead`.

- [ ] **Step 3: Update the model inventory assertion.**

  Change the screen inventory expectation from 50 to 49 and add an assertion that `get-started`, `sign-in`, and `create-account` are absent:

  ```ts
  expect(SCREENS).toHaveLength(49);
  expect(SCREENS.some((screen) => (screen.id as string) === 'get-started')).toBe(false);
  expect(SCREENS.some((screen) => (screen.id as string) === 'sign-in')).toBe(false);
  expect(SCREENS.some((screen) => (screen.id as string) === 'create-account')).toBe(false);
  ```

- [ ] **Step 4: Run the focused tests and confirm the expected RED state.**

  Run:

  ```bash
  npm test src/app/'(marketing)'/page.test.tsx src/components/features/guest-app/guest-app-prototype.test.tsx src/components/features/guest-app/prototype-model.test.ts
  ```

  Expected: FAIL because the bottom-sheet and direct-lookup behavior are not implemented yet, with no TypeScript or test-collection errors.

### Task 2: Implement one provider-neutral SSO entry screen

**Files:**
- Modify: `src/components/features/guest-app/prototype-model.ts`
- Modify: `src/components/features/guest-app/guest-app-prototype.tsx`

**Interfaces:**
- Consumes: Failing tests from Task 1, existing `AuthMethod`, `GuestSession`, `getPostAuthScreen`, and `completeAuth`.
- Produces: local SSO sheet routing and `ssoSession(method: AuthMethod)` returning an authenticated, booking-free session.

- [ ] **Step 1: Add the provider-neutral session factory.**

  In `prototype-model.ts`, add this function next to the existing session helpers:

  ```ts
  export function ssoSession(method: AuthMethod = 'apple'): GuestSession {
    const identity = method === 'apple'
      ? { guestName: 'Apple Guest', email: 'guest@privaterelay.appleid.com' }
      : { guestName: 'Google Guest', email: 'guest@gmail.com' };

    return {
      ...ANONYMOUS_SESSION,
      ...identity,
      auth: 'authenticated',
      accountStatus: 'new',
      authMethod: method,
    };
  }
  ```

  Keep `createAccountSession` and `signInSession` for model fixtures that explicitly test new-account and returning-account derivation; the app entry must use only `ssoSession`.

- [ ] **Step 2: Replace the screen inventory entries.**

  In `prototype-model.ts`, replace the two entry IDs with one:

  ```ts
  export type ScreenId =
    | 'connect-booking'
    | 'identify'
    // ...the remaining navigable guest screens
  ```

  Remove the former `get-started` entry; keep the existing remaining numbers to avoid changing the prototype's established screen references.

- [ ] **Step 3: Collapse the welcome actions.**

  Change `WelcomeScreen`'s props and replace its two-button action block with one primary button that opens local sheet state:

  ```tsx
  function WelcomeScreen({ onGetStarted }: { onGetStarted: () => void }) {
    const pager = useWelcomePager();

    return (
      <section className="guest-welcome" aria-labelledby="guest-welcome-title">
        {/* keep the existing splash, brand, artwork, dots, and step-copy markup */}
        <div className="guest-welcome__actions">
          <Button className="guest-button guest-button--primary guest-welcome__action" type="button" onClick={onGetStarted}>
            Get started<ArrowRight aria-hidden="true" />
          </Button>
        </div>
      </section>
    );
  }
  ```

  Route `entry-hub` with `onGetStarted={() => setSsoOpen(true)}` and render the native bottom sheet beside the welcome content.

- [ ] **Step 4: Add the SSO bottom sheet and direct lookup destination.**

  Add a native `<dialog>` bottom sheet containing the existing account header and SSO button styling, with this copy and behavior:

  ```tsx
  <div className="guest-page-title">
    <p className="guest-eyebrow">Your stay, all in one place</p>
    <h1>Get started</h1>
    <p>Use Apple or Google to access your stay and room services.</p>
  </div>
  {!online ? <Notice tone="offline" icon={<WifiSlash />} title="Getting started needs a connection">A connection is required to continue.</Notice> : null}
  <div className="guest-auth-actions">
    <Button className="guest-button guest-button--secondary guest-sso-button" type="button" disabled={!online} onClick={() => completeAuth(ssoSession('apple'))}>
      <AppleLogo size={20} aria-hidden="true" /> Continue with Apple
    </Button>
    <Button className="guest-button guest-button--secondary guest-sso-button" type="button" disabled={!online} onClick={() => completeAuth(ssoSession('google'))}>
      <GoogleLogo size={20} aria-hidden="true" /> Continue with Google
    </Button>
  </div>
  <TextButton onClick={() => go('identify-returning')}>Use a booking reference instead</TextButton>
  ```

  Preserve the existing `disabled={!online}` and `.guest-sso-button` classes. Remove the account-type switch link.

- [ ] **Step 5: Retarget remaining entry links and comments.**

  Update the `identify-returning` back link to `go('entry-hub')`. Route an account without a booking to `identify`, and update all other booking-entry links to the same direct form. Keep the `Stayed with us before? Use a booking reference` recovery action. Add a Room QR row to active Home and remove it from pre-arrival booking choices.

- [ ] **Step 6: Run focused tests and confirm GREEN.**

  Run the same focused command from Task 1. Expected: PASS for the updated root, guest-app, and model tests.

### Task 3: Align product context and finish verification

**Files:**
- Modify: `docs/llm-context.md`
- Modify: `src/components/features/guest-app/guest-app-prototype.test.tsx` (only if Task 2 exposes an uncovered copy or route assertion)

**Interfaces:**
- Consumes: The passing unified entry implementation.
- Produces: Durable product context and a verified working tree with no unrelated files staged.

- [ ] **Step 1: Update the durable guest journey copy.**

  In `docs/llm-context.md`, replace the root account-gate description with `Get started`, describe the SSO bottom sheet, update both first-time and returning journey diagrams so SSO leads directly to `identify`, and document Room QR as an active-Home action. Keep the existing booking-reference re-entry path and its security explanation.

- [ ] **Step 2: Run the complete test suite.**

  Run `npm test`. Expected: 21 test files pass and 325 tests pass, plus the new unified-entry assertions.

- [ ] **Step 3: Run static checks.**

  Run `npm run typecheck`, then `npm run lint`. Expected: both commands exit 0 with no lint warnings.

- [ ] **Step 4: Build the production app.**

  Run `API_BASE_URL=https://jsonplaceholder.typicode.com npm run build`. Expected: Next.js compiles and reports the existing `/`, `/components`, and `/dashboard` routes.

- [ ] **Step 5: Check the diff and status.**

  Run `git diff --check` and `git status --short --branch`. Expected: no whitespace errors; only the unrelated pre-existing untracked plan remains unstaged.

- [ ] **Step 6: Commit only the feature files.**

  ```bash
  git add -- docs/llm-context.md src/components/features/guest-app/guest-app-prototype.test.tsx src/components/features/guest-app/guest-app-prototype.tsx src/components/features/guest-app/prototype-model.test.ts src/components/features/guest-app/prototype-model.ts src/app/'(marketing)'/page.test.tsx
  git commit -m "feat: unify guest SSO entry as get started"
  ```
