# Guest Account Auth Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

| | |
|---|---|
| **Status** | `Complete` |
| **Created** | 2026-09-09 |
| **Updated** | 2026-09-09 |
| **Owner** | kenanaiah@lmf.ventures |
| **Branch / worktree** | `main` — the user's standing instruction for this project is to commit on `main`; no worktree |
| **Spec** | `docs/superpowers/specs/2026-09-09-guest-account-auth-design.md` |
| **Ledger** | `.superpowers/sdd/2026-09-09-guest-account-auth/progress.md` |

**Status values:** `Draft` → `Approved` → `In Progress` → `Complete`.
Off-ramps: `Blocked` (say what unblocks it in Decision Log) · `Abandoned`.

**Goal:** Give the guest app a real account layer — `/` opens on Create account /
Log in, auth is email + one-time code with Apple and Google, a new account is
routed into pre-arrival and a returning one onto its stays, and booking-first
arrivals converge on the same gate.

**Architecture:** Every branching rule is a pure function in `prototype-model.ts`
with a unit test, mirroring the existing `getHomeVariant` / `getOfflineAction`
split. The component holds screen state and renders; three new screens plus a
rewritten `entry-hub` and a repurposed `create-account`. No route, no resource,
no network call.

**Tech Stack:** Next.js 16 (App Router) · React 19 · TypeScript (strict) · Vitest + Testing Library · Tailwind v4 · Phosphor icons

The spec's *Interfaces and contracts* section carries the exact exported
signatures; this plan does not re-paste implementation bodies. Test steps carry
real assertions, because those are the load-bearing part.

---

## Progress

| # | Task | Status | Started | Completed | Commit |
|---|---|---|---|---|---|
| 1 | Auth vocabulary, fixtures and pure functions | ✅ Complete | 2026-09-09 | 2026-09-09 | `feat: add guest account auth model` |
| 2 | Welcome screen, auth screens and shell gating | ✅ Complete | 2026-09-09 | 2026-09-09 | `feat: open the guest app on an account gate` |
| 3 | Auth screen styles | ✅ Complete | 2026-09-09 | 2026-09-09 | `feat: open the guest app on an account gate` (same commit — the CSS contract test lives in the component test file) |
| 4 | Root-route contract and full verification | ✅ Complete | 2026-09-09 | 2026-09-09 | `fix: hide the profile action until an account exists` |

Legend: ⬜ Not started · 🔄 In progress · 🔁 Fix round *R*/5 · ✅ Complete · ⛔ Blocked · ⏭️ Descoped

---

## Global Constraints

Copied verbatim from the spec.

- Verification gate: `npm run typecheck && npm run lint && npm run build` passes
  with fresh output before any task is claimed complete. In this repo `build`
  requires `API_BASE_URL` — use the `.env.example` value
  (`API_BASE_URL=https://jsonplaceholder.typicode.com`) in the command
  environment. Do not modify unrelated dashboard configuration to bypass it.
- The architecture invariants in `CLAUDE.md` are binding. The API-layer
  invariants (1–8) are not engaged by this feature; invariant 2 (thin routes) is.
- `react-hooks` compiler rules are lint errors: no ref writes during render, no
  `setState` in an effect body.
- The room-folio settlement rule is binding: no card, GCash, Maya, insurance,
  coupon, or rewards surface may appear anywhere in these screens.
- Services stay on-property only; the product boundary (no hotel discovery,
  search, flights, packages, or rewards) is unchanged.
- One route, one client component. No route per screen.
- Preserve the existing Asbir Sans / light Klarna-source visual language, the
  Phosphor icon set, and the `.guest-*` class contracts. At most three new class
  families: `.guest-auth-methods`, `.guest-auth-divider`, `.guest-code-field`.
- Accessibility contracts already tested in this suite hold for new screens:
  semantic labels on every field, named icon buttons, visible `:focus-visible`,
  `role="status"` live messaging, 44px minimum interactive targets, responsive
  containment, reduced-motion handling.
- No real authentication, credential storage, or network call.
- The working tree carries unrelated uncommitted changes. Stage only the files
  this feature touches. No broad `reset`, `checkout`, `stash`, or `git add .`.
- Commit on `main`; no branch, no push, no deploy without a new explicit request.

---

## File Structure

**Modify**
- `src/components/features/guest-app/prototype-model.ts` — auth types,
  `ANONYMOUS_SESSION`, `UPCOMING_BOOKING_FIXTURE`, the five session mutations,
  `getPostAuthScreen`, `'authentication'` on `OfflineCapability`, three new
  `ScreenId`s, renumbered `SCREENS`.
- `src/components/features/guest-app/guest-app-prototype.tsx` — rewritten
  `entry-hub`, new `sign-in` / `verify-code` / `connect-booking`, repurposed
  `create-account`, `BookingEntryOptions`, pending-email state, auth-gated
  `showPrimaryNav`, sign-out on `profile`, gate on the room-QR path.
- `src/components/features/guest-app/guest-app-prototype.css` — the three new
  class families.
- `src/app/(marketing)/page.test.tsx` — first-render contract.

**Test**
- `src/components/features/guest-app/prototype-model.test.ts` — the pure rules.
- `src/components/features/guest-app/guest-app-prototype.test.tsx` — the visible
  journeys.

---

## Task 1: Auth vocabulary, fixtures and pure functions

**Status:** ✅ Complete · **Started:** 2026-09-09 · **Completed:** 2026-09-09

**Files:**
- Modify: `src/components/features/guest-app/prototype-model.ts`
- Test: `src/components/features/guest-app/prototype-model.test.ts`

**Interfaces:**
- Consumes: existing `Booking`, `GuestSession`, `ScreenId`, `getPrimaryBooking`.
- Produces: `AuthState`, `AccountStatus`, `AuthMethod`, `ANONYMOUS_SESSION`,
  `UPCOMING_BOOKING_FIXTURE`, `createAccountSession`, `signInSession`,
  `verifyPendingSession`, `signOutSession`, `connectBooking`,
  `getPostAuthScreen` — exact signatures in the spec.

- [x] **Step 1: Write the failing tests**

```ts
describe('account sessions', () => {
  it('starts anonymous with no bookings', () => {
    expect(ANONYMOUS_SESSION.auth).toBe('anonymous');
    expect(ANONYMOUS_SESSION.accountStatus).toBe('none');
    expect(ANONYMOUS_SESSION.bookings).toHaveLength(0);
  });

  it('treats the mock session as an authenticated returning account', () => {
    expect(MOCK_SESSION.auth).toBe('authenticated');
    expect(MOCK_SESSION.accountStatus).toBe('returning');
  });

  it('creates a new account pending verification and with no bookings', () => {
    const session = createAccountSession('Mara Cruz', 'mara@example.com', 'email-code');
    expect(session.auth).toBe('pending-verification');
    expect(session.accountStatus).toBe('new');
    expect(session.bookings).toHaveLength(0);
    expect(session.guestName).toBe('Mara Cruz');
  });

  it('signs a returning account in with its saved bookings', () => {
    const session = signInSession('email-code');
    expect(session.auth).toBe('pending-verification');
    expect(session.accountStatus).toBe('returning');
    expect(session.bookings.length).toBeGreaterThan(0);
  });

  it('promotes only a pending session, and is a no-op once authenticated', () => {
    const pending = createAccountSession('Mara Cruz', 'mara@example.com', 'apple');
    expect(verifyPendingSession(pending).auth).toBe('authenticated');
    expect(verifyPendingSession(ANONYMOUS_SESSION).auth).toBe('anonymous');
    const already = verifyPendingSession(verifyPendingSession(pending));
    expect(already.auth).toBe('authenticated');
  });

  it('signs out back to the anonymous shape', () => {
    expect(signOutSession()).toEqual(ANONYMOUS_SESSION);
  });

  it('connects the upcoming booking once and is idempotent', () => {
    const once = connectBooking(ANONYMOUS_SESSION);
    expect(once.bookings).toHaveLength(1);
    expect(once.bookings[0]!.id).toBe(UPCOMING_BOOKING_FIXTURE.id);
    expect(connectBooking(once).bookings).toHaveLength(1);
  });
});

describe('getPostAuthScreen', () => {
  it('asks for a booking when the account has none', () => {
    const session = verifyPendingSession(createAccountSession('Mara Cruz', 'mara@example.com', 'email-code'));
    expect(getPostAuthScreen(session)).toBe('connect-booking');
  });

  it('welcomes a returning account back when pre-arrival is incomplete', () => {
    const session = verifyPendingSession(signInSession('email-code'));
    expect(getPostAuthScreen(session)).toBe('welcome-back');
  });

  it('sends a new account into pre-arrival once a booking is connected', () => {
    const session = connectBooking(verifyPendingSession(createAccountSession('Mara Cruz', 'mara@example.com', 'email-code')));
    expect(getPostAuthScreen(session)).toBe('guest-details');
  });

  it('sends a completed pre-arrival to the stay overview', () => {
    const base = connectBooking(verifyPendingSession(createAccountSession('Mara Cruz', 'mara@example.com', 'email-code')));
    const session = {
      ...base,
      bookings: base.bookings.map((booking) => ({ ...booking, preArrivalCompleted: booking.preArrivalTotal })),
    };
    expect(getPostAuthScreen(session)).toBe('stay-overview');
  });
});

it('blocks authentication offline', () => {
  expect(getOfflineAction('authentication')).toBe('blocked');
});
```

Update the existing registry test from 38 to 41.

- [x] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run src/components/features/guest-app/prototype-model.test.ts`
Expected: FAIL — the new exports do not exist.

- [x] **Step 3: Write the implementation**

Per the spec's *Interfaces and contracts*. `getPostAuthScreen` follows its five
ordered rules. `MOCK_SESSION` gains `auth: 'authenticated'` and
`accountStatus: 'returning'`; `UPCOMING_BOOKING_FIXTURE` is extracted from its
first booking so `connectBooking` and `MOCK_SESSION` cannot disagree.

- [x] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run src/components/features/guest-app/prototype-model.test.ts`
Expected: PASS.

- [x] **Step 5: Verify the repo is clean**

Run: `API_BASE_URL=https://jsonplaceholder.typicode.com npm run typecheck && API_BASE_URL=https://jsonplaceholder.typicode.com npm run lint`
Expected: exit 0. Type errors in the component are expected at this point only
if `GuestSession` gained required fields — if so, they are fixed here by giving
the component's `MOCK_SESSION` default the new fields, not by loosening the type.

- [x] **Step 6: Commit**

```bash
git add src/components/features/guest-app/prototype-model.ts src/components/features/guest-app/prototype-model.test.ts
git commit -m "feat: add guest account auth model"
```

---

## Task 2: Welcome screen, auth screens and shell gating

**Status:** ✅ Complete · **Started:** 2026-09-09 · **Completed:** 2026-09-09

**Files:**
- Modify: `src/components/features/guest-app/guest-app-prototype.tsx`
- Test: `src/components/features/guest-app/guest-app-prototype.test.tsx`

**Interfaces:**
- Consumes: everything Task 1 produced.
- Produces: `BookingEntryOptions` (internal); `GuestAppPrototype`'s
  `initialSession` / `initialScreen` signature unchanged.

- [x] **Step 1: Write the failing tests**

```ts
it('opens on the account welcome screen', () => {
  render(<GuestAppPrototype />);
  expect(screen.getByRole('button', { name: 'Create account' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Log in' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Booking email' })).toBeInTheDocument();
  expect(screen.queryByRole('navigation', { name: 'Primary navigation' })).toBeNull();
});

it('routes a new account to add a booking, with no stay invented', async () => {
  render(<GuestAppPrototype />);
  await userEvent.click(screen.getByRole('button', { name: 'Create account' }));
  await userEvent.type(screen.getByLabelText(/Full name/), 'Mara Cruz');
  await userEvent.type(screen.getByLabelText(/Email/), 'mara@example.com');
  await userEvent.click(screen.getByRole('button', { name: 'Send my code' }));
  await userEvent.type(screen.getByLabelText(/verification code/i), '123456');
  await userEvent.click(screen.getByRole('button', { name: 'Verify' }));
  expect(screen.getByRole('heading', { name: 'Add your booking' })).toBeInTheDocument();
  expect(screen.queryByText('Stay QR')).toBeNull();
});

it('routes a returning account to welcome back', async () => {
  render(<GuestAppPrototype />);
  await userEvent.click(screen.getByRole('button', { name: 'Log in' }));
  await userEvent.type(screen.getByLabelText(/Email/), 'ana@example.com');
  await userEvent.click(screen.getByRole('button', { name: 'Send my code' }));
  await userEvent.type(screen.getByLabelText(/verification code/i), '123456');
  await userEvent.click(screen.getByRole('button', { name: 'Verify' }));
  expect(screen.getByRole('heading', { name: /Welcome back/ })).toBeInTheDocument();
});

it('gates a booking-first arrival on an account before pre-arrival', async () => {
  render(<GuestAppPrototype />);
  await userEvent.click(screen.getByRole('button', { name: 'Booking email' }));
  await userEvent.type(screen.getByLabelText(/Booking or confirmation number/), 'HEN-241109');
  await userEvent.type(screen.getByLabelText(/Last name/), 'Santos');
  await userEvent.click(screen.getByRole('button', { name: 'Find booking' }));
  await userEvent.click(screen.getByRole('button', { name: 'Yes, this is my stay' }));
  expect(screen.getByRole('heading', { name: 'Create your account' })).toBeInTheDocument();
});

it('shows the shell and the empty home to an account with no bookings', () => {
  const session = verifyPendingSession(createAccountSession('Mara Cruz', 'mara@example.com', 'email-code'));
  render(<GuestAppPrototype initialSession={session} initialScreen="stay-overview" />);
  expect(screen.getByRole('navigation', { name: 'Primary navigation' })).toBeInTheDocument();
  expect(screen.getByTestId('guest-home-empty')).toBeInTheDocument();
});

it('signs out to the welcome screen with the shell hidden', async () => {
  render(<GuestAppPrototype initialSession={MOCK_SESSION} initialScreen="profile" />);
  await userEvent.click(screen.getByRole('button', { name: 'Sign out' }));
  expect(screen.getByRole('button', { name: 'Create account' })).toBeInTheDocument();
  expect(screen.queryByRole('navigation', { name: 'Primary navigation' })).toBeNull();
});

it('does not pretend to authenticate offline', async () => {
  render(<GuestAppPrototype />);
  await userEvent.click(screen.getByRole('button', { name: 'Go offline' }));
  expect(screen.getByText(/needs a connection/i)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Create account' })).toBeDisabled();
});

it('labels the code field for assistive tech and autofill', async () => {
  render(<GuestAppPrototype />);
  await userEvent.click(screen.getByRole('button', { name: 'Log in' }));
  await userEvent.type(screen.getByLabelText(/Email/), 'ana@example.com');
  await userEvent.click(screen.getByRole('button', { name: 'Send my code' }));
  const code = screen.getByLabelText(/verification code/i);
  expect(code).toHaveAttribute('autocomplete', 'one-time-code');
  expect(code).toHaveAttribute('inputmode', 'numeric');
});
```

The offline test depends on how the existing suite toggles connectivity — match
whatever control that suite already uses rather than inventing a new one.

- [x] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run src/components/features/guest-app/guest-app-prototype.test.tsx`
Expected: FAIL — no Create account button on first render.

- [x] **Step 3: Write the implementation**

`entry-hub`, `sign-in`, `create-account`, `verify-code`, `connect-booking` per
the spec's screen table; `BookingEntryOptions` shared by `entry-hub` and
`connect-booking`; `pendingEmail` in component state; `showPrimaryNav` gated on
`session.auth === 'authenticated'`; `Sign out` on `profile`; the room-QR path
gated after `linkRoomStay`; `EmptyStayHome`'s primary action pointed at
`connect-booking`.

- [x] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run src/components/features/guest-app/guest-app-prototype.test.tsx`
Expected: PASS.

- [x] **Step 5: Verify the repo is clean**

Run: `API_BASE_URL=https://jsonplaceholder.typicode.com npm run typecheck && API_BASE_URL=https://jsonplaceholder.typicode.com npm run lint`
Expected: exit 0.

- [x] **Step 6: Commit**

```bash
git add src/components/features/guest-app/guest-app-prototype.tsx src/components/features/guest-app/guest-app-prototype.test.tsx
git commit -m "feat: open the guest app on an account gate"
```

---

## Task 3: Auth screen styles

**Status:** ✅ Complete · **Started:** 2026-09-09 · **Completed:** 2026-09-09

**Files:**
- Modify: `src/components/features/guest-app/guest-app-prototype.css`
- Test: `src/components/features/guest-app/guest-app-prototype.test.tsx`

**Interfaces:**
- Consumes: the class names Task 2 renders.
- Produces: `.guest-auth-methods`, `.guest-auth-divider`, `.guest-code-field`.

- [x] **Step 1: Write the failing test**

The existing suite asserts CSS contracts by reading the stylesheet. Follow that
pattern:

```ts
it('ships styles for the auth screens', () => {
  const css = readFileSync(new URL('./guest-app-prototype.css', import.meta.url), 'utf8');
  expect(css).toContain('.guest-auth-methods');
  expect(css).toContain('.guest-auth-divider');
  expect(css).toContain('.guest-code-field');
  expect(css).toMatch(/\.guest-code-field[^}]*letter-spacing/);
});
```

- [x] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/components/features/guest-app/guest-app-prototype.test.tsx -t 'auth screens'`
Expected: FAIL — the classes are absent.

- [x] **Step 3: Write the implementation**

Three class families only, using the existing token layer. The code field gets
tabular numerals and letter-spacing so a six-digit code reads as six digits; the
divider is a labelled rule; the methods row is a two-up grid of secondary
buttons that collapses to one column under the existing narrow breakpoint. 44px
minimum target height on every new control.

- [x] **Step 4: Run the test to verify it passes**

Run: `npx vitest run src/components/features/guest-app/guest-app-prototype.test.tsx`
Expected: PASS.

- [x] **Step 5: Verify the repo is clean**

Run: `API_BASE_URL=https://jsonplaceholder.typicode.com npm run typecheck && API_BASE_URL=https://jsonplaceholder.typicode.com npm run lint`
Expected: exit 0.

- [x] **Step 6: Commit**

```bash
git add src/components/features/guest-app/guest-app-prototype.css src/components/features/guest-app/guest-app-prototype.test.tsx
git commit -m "feat: style the guest account auth screens"
```

---

## Task 4: Root-route contract and full verification

**Status:** ✅ Complete · **Started:** 2026-09-09 · **Completed:** 2026-09-09

**Files:**
- Modify: `src/app/(marketing)/page.test.tsx`

**Interfaces:**
- Consumes: the first render Task 2 produced.
- Produces: nothing; this task closes the contract and the gate.

- [x] **Step 1: Update the first-render contract**

```ts
it('renders the account gate at the root route', () => {
  render(<HomePage />);

  expect(screen.getByText('Cabana', { exact: true })).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: 'Your stay starts here' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Create account' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Log in' })).toBeInTheDocument();
  expect(screen.queryByRole('navigation', { name: 'Primary navigation' })).toBeNull();
});
```

- [x] **Step 2: Run the focused tests**

Run: `npx vitest run src/app/\(marketing\)/page.test.tsx`
Expected: PASS.

- [x] **Step 3: Run the full gate**

Run each with `API_BASE_URL=https://jsonplaceholder.typicode.com`:
`npm run typecheck`, `npm run lint`, `npm run build`, `npm test`.
Expected: all exit 0; test count at or above the prior 94.

- [x] **Step 4: Verify the journey in a real browser**

The dev server is already running on port 3000. Walk and capture: welcome →
create account → code → add booking → identify → booking-found → pre-arrival;
then welcome → log in → code → welcome back; then sign-out. Confirm the tab bar
is absent on every pre-auth screen and present after verification, and that no
payment surface appears anywhere.

- [x] **Step 5: Commit**

```bash
git add src/app/\(marketing\)/page.test.tsx docs/superpowers/plans/2026-09-09-guest-account-auth.md docs/superpowers/specs/2026-09-09-guest-account-auth-design.md
git commit -m "test: lock the account gate as the first render"
```

---

## Decision Log

| Date | Decision | Why | Cost if wrong |
|---|---|---|---|
| 2026-09-09 | Execute on `main`, no worktree | The user's standing instruction for this project, and the working tree carries unrelated uncommitted work a worktree would not carry | Harder to abandon the change wholesale; mitigated by per-task commits |
| 2026-09-09 | The plan cites the spec's signatures instead of re-pasting implementation bodies | The spec already states them exactly, and the executor is the same session | A different executor would need to read the spec alongside this plan |
| 2026-09-09 | Tasks 2 and 3 landed in one commit | The CSS contract test lives in `guest-app-prototype.test.tsx`, so splitting them would have committed a knowingly failing test | None; both are covered by the same suite |
| 2026-09-09 | Added `initialOnline` to the component props | The prototype has no user-facing connectivity toggle, so offline was untestable from the outside; this matches the existing `initialSession` / `initialScreen` seam | If a visible toggle is added later, the prop stays useful for tests |
| 2026-09-09 | `PendingIntent` lives in the component, not the model | It is screen-flow state — what the gate interrupted — not session data; putting it in `GuestSession` would persist a transient across sign-out | If it ever needs to survive a reload it moves to the session |
| 2026-09-09 | `withActiveRoom` is a component-local pure helper rather than a model export | It is the room-QR screen's own mutation and is covered by the room-QR journey test; the model keeps the vocabulary, not every screen's mechanics | If a second caller appears it moves to the model with its own unit test |
| 2026-09-09 | Apple and Google resolve to the recognized account on both auth screens | With one mock account, a provider that "already knows you" is the honest simulation; inventing a second identity would be fiction | Real provider wiring replaces both handlers |

---

## Before marking this plan Approved

- [x] **Spec coverage** — the spec's nine success criteria map to Tasks 1–4;
      offline and a11y criteria are covered inside Tasks 1 and 2.
- [x] **Placeholder scan** — no `<...>`, `TBD`, or "similar to Task N"; every
      test step carries real assertions.
- [x] **Type consistency** — the names produced in Task 1 are the names Task 2
      consumes, and both match the spec.
- [x] **Right-sized tasks** — model, component, styles, contract; each is
      independently rejectable.
- [x] **Status block filled** — Status, Created, Updated, Spec, Branch.
