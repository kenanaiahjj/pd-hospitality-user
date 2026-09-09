# Guest Account Auth Design

> Produced by `superpowers:brainstorming` (architectural path). Once this
> document is `Approved`, the only next skill is `superpowers:writing-plans`.
> File naming: `docs/superpowers/specs/YYYY-MM-DD-<topic>-design.md`.

| | |
|---|---|
| **Status** | `In Review` |
| **Created** | 2026-09-09 |
| **Updated** | 2026-09-09 |
| **Owner** | kenanaiah@lmf.ventures |
| **Plan** | `docs/superpowers/plans/2026-09-09-guest-account-auth.md` (once written) |
| **Supersedes** | `n/a` |
| **Superseded by** | `n/a` |

**Status values:** `Draft` → `In Review` (user reading it) → `Approved` (plan may
be written) → `Implemented`. Off-ramps: `Superseded` (link the replacement) ·
`Abandoned` (say why in the Decision Log).

This spec is the binding authority during execution: when a plan and this
document disagree, this document wins. Keep **Status** and **Updated** current —
an executor reads both files and rules against this one.

---

## Summary

The guest app has no account. `/` opens straight into a booking-lookup hub and
the app behaves as though it is permanently signed in as Ana Santos. This adds a
real account layer: `/` becomes a welcome screen whose primary actions are
**Create account** and **Log in**, authentication is email + one-time code with
Apple and Google alternatives, and a brand-new account is routed into pre-arrival
onboarding while a returning account lands on its stays. Booking-first arrivals
(confirmation link, room QR, hotel Wi-Fi) stay reachable from the same screen and
converge on the same account gate once a booking is matched.

## Context

Today, in the working tree at `60cbf79` plus uncommitted guest-app refinements:

- `src/components/features/guest-app/guest-app-prototype.tsx:137` initialises
  `activeScreen` to `'entry-hub'` and `session` to `MOCK_SESSION`. Every render
  of `/` is already an identified guest with two bookings.
- `entry-hub` (`:244`) offers three booking-entry cards and an "Open confirmation
  link" primary. No account, no sign-in, no sign-out.
- `create-account` (`:283`) is *not* authentication. It is a "step 1 of 5"
  profile form (full name, email, mobile) reached only after `booking-found`, and
  it duplicates `guest-details` (`:292`), which asks for the same fields again.
- `welcome-back` (`:286`) is orphaned. Nothing in the live flow navigates to it;
  it is reachable only as `SCENARIOS` entry `B` in
  `src/components/features/guest-app/prototype-model.ts:238`. The
  returning-guest journey described in the handoff doc therefore does not exist
  as a journey.
- `GuestSession` (`prototype-model.ts:127`) has no auth dimension at all.
- `showPrimaryNav` (`:176`) gates the tab bar on `session.bookings.length > 0`.

What forces this now: the product charges on-property services to a room folio
that settles at departure. A folio line is an unsecured extension of credit
against a named guest, and the prototype currently attaches those lines to an
identity nobody ever proved. The account layer is the missing half of the
commerce premise, not a login veneer.

The user selected the shape on 2026-09-09: a hybrid where the account is
first-class on the home screen and the guest can add their booking from there,
email + one-time code with Apple and Google, and sign-in unlocking the app shell.

## Non-goals

- **No real authentication.** No password hashing, session cookies, JWTs, OAuth
  redirects, email delivery, or rate limiting. Apple and Google are buttons that
  advance the prototype, consistent with how QR scanning and ID capture are
  already simulated. Real auth arrives with the data boundary noted in the
  handoff doc's follow-ups.
- **No password path.** Email + one-time code only. This removes password,
  show/hide, forgot-password, and reset screens from scope. Triggered later only
  if the pilot property requires password parity.
- **No account deletion, email change, or multi-device management.** Sign-out is
  in scope; account lifecycle management is not.
- **No route additions.** This stays one client component behind
  `src/app/(marketing)/page.tsx`. No `/login` or `/signup` route.
- **No change to the folio settlement rule.** Nothing in this work asks for a
  card, wallet, coupon, or rewards balance.
- **No change to the five home variants.** `getHomeVariant` and its `active`,
  `upcoming`, `multiple-upcoming`, `completed`, `empty` contracts are untouched.
- **No hotel discovery or search.** Unchanged product boundary.

## Success criteria

- [ ] First render at `/` shows **Create account** and **Log in** as the two
      account actions, and no primary navigation.
- [ ] The three booking-entry paths (confirmation link, room QR, hotel Wi-Fi)
      remain reachable from that first render.
- [ ] Creating an account with an email advances to a one-time-code screen, and a
      submitted code lands on **Add your booking** — not on a fabricated active
      stay.
- [ ] Logging in as a returning account lands on that account's stays, and
      reaches `welcome-back` when an upcoming booking still needs pre-arrival.
      `welcome-back` is reachable from the live flow, not only from `SCENARIOS`.
- [ ] A booking-first arrival (`identify` → `booking-found`) reaches the same
      account gate before pre-arrival, and completing it continues into
      `guest-details`.
- [ ] An authenticated guest with zero bookings sees the tab bar and the existing
      `empty` home variant, and its primary action goes to **Add your booking**.
- [ ] Sign-out from `profile` returns to `/`'s welcome screen with the tab bar
      hidden.
- [ ] Offline at the welcome screen states that sign-in needs a connection and
      does not pretend to authenticate; `getOfflineAction('authentication')`
      returns `'blocked'`.
- [ ] `npx vitest run src/components/features/guest-app/prototype-model.test.ts src/components/features/guest-app/guest-app-prototype.test.tsx src/app/\(marketing\)/page.test.tsx` passes.
- [ ] `API_BASE_URL=https://jsonplaceholder.typicode.com npm run typecheck && … npm run lint && … npm run build && … npm test` passes with fresh output.

---

## Approaches considered

### Recommended: hybrid welcome with a convergent account gate

`entry-hub` keeps its identity as the root screen and its "Your stay starts
here" headline, and gains an account block above the booking-entry cards:
**Create account** (primary), **Log in** (text button), then a divider and the
three existing entry cards under "Already have a booking?".

Two orders are then reachable and they converge on one gate:

- *Account-led* — create account → verify code → **Add your booking** → the
  existing `identify` → `booking-found` → pre-arrival.
- *Booking-led* — booking link / room QR / Wi-Fi → `identify` → `booking-found`
  → **account gate** → verify code → pre-arrival.

**Why:** it is what the user asked for — the account is the headline on the home
screen, and adding a booking is the step right after it — without breaking the
two arrival cases the product is actually defined by. A guest standing in room
304 scanning the QR, or landing on the hotel's captive portal, still gets a path
that starts from where they physically are. It also converges: there is exactly
one place where identity becomes real, so the folio can never be attached to an
unproven guest. And it repairs two existing defects on the way — the
`create-account`/`guest-details` duplication, and the orphaned `welcome-back`.

**Costs:** the home screen carries more than one decision, so it needs careful
hierarchy to avoid reading as a wall of options. Room-QR walk-ups gain one step
(the account gate lands after the stay is linked, before the shell). We accept
that step: the shell is where charges get made.

### Alternative: auth-first hard gate (Shangri-La Circle)

`/` is a pure sign-in/join screen; the booking-entry hub moves behind it.

**Rejected because:** it forces a guest already inside the room to register
before the app will show them anything at all, and it strands the hotel Wi-Fi
captive-portal case, which is an arrival-day context where the guest has not
necessarily heard of the app. Shangri-La can do this because it is a loyalty
programme first; this product is defined as starting from an existing booking.

### Alternative: gate only after a booking match (Expedia)

Keep `entry-hub` exactly as it is and put the account gate at `booking-found`.

**Rejected because:** the home screen still has no account or login on it, which
is the actual request. It is the smallest change but it does not do the job.

---

## Design

### Architecture

This feature lives entirely in the guest-app prototype: the pure model, the
single client component, its stylesheet, and their tests. It adds no route, no
resource, and no network call.

The `CLAUDE.md` API invariants (single HTTP client, thin routes, BFF handlers,
one envelope, validators as source of truth, `ApiError` currency, query
factories) **do not apply here and are not bent** — the guest app is deliberately
in-memory and touches none of those layers. `src/app/(marketing)/page.tsx` stays
a thin route that renders one component, satisfying invariant 2.

Two documented contracts do change, deliberately, and both are approved above:

1. The handoff doc's "first render at `/` is `entry-hub`" survives in letter —
   `entry-hub` is still the initial screen id — but its **content** changes from
   a booking-entry hub to a welcome-and-account screen. The regression test in
   `src/app/(marketing)/page.test.tsx` is updated accordingly: brand, headline
   and hidden-nav assertions all survive; the `Open confirmation link` button
   assertion becomes `Create account`.
2. Nav gating moves from "has a booking" to "is authenticated"
   (`showPrimaryNav`), per the user's decision that signing in unlocks the shell.

The division of labour holds the existing line: every branching rule is a pure
function in `prototype-model.ts` with a unit test, and the component only holds
screen state and renders.

### Components

**`src/components/features/guest-app/prototype-model.ts`**
- **Does:** owns the auth vocabulary, the session fixtures for each auth state,
  the pure session mutations for signing in / creating an account / connecting a
  booking / signing out, and the post-auth routing rule.
- **Used as:** the exported names in *Interfaces and contracts* below, added
  alongside the existing `getPrimaryBooking`, `getHomeVariant`,
  `getOfflineAction`, `getCancellationState`.
- **Depends on:** nothing. Stays free of React, browser APIs, and network calls.

**`src/components/features/guest-app/guest-app-prototype.tsx`**
- **Does:** renders the reworked `entry-hub`, the four new auth screens, and the
  repurposed `create-account`; holds the pending-verification email in local
  state; applies the model's session mutations; gates the tab bar on auth.
- **Used as:** `<GuestAppPrototype initialSession? initialScreen? />` —
  signature unchanged, so existing tests keep their injection seam.
- **Depends on:** `prototype-model.ts`, the existing `ui/` primitives, Phosphor
  icons, `guest-app-prototype.css`.

**`src/components/features/guest-app/guest-app-prototype.css`**
- **Does:** adds three class families for the auth screens and leaves the rest
  of the sheet alone.
- **Used as:** `.guest-auth-methods` (the Apple/Google row),
  `.guest-auth-divider` (the "or" rule with a label), `.guest-code-field` (the
  one-time-code input).
- **Depends on:** the existing token layer and `.guest-*` contracts.

### Screens

Four new `ScreenId`s, one repurposed, one rewritten. All join the `'Entry'`
group; `SCREENS` is renumbered so the array still reads in journey order, which
is safe because its only consumer is its own test.

| Screen | Status | Content |
|---|---|---|
| `entry-hub` | rewritten | "Your stay starts here". **Create account** primary, **Log in** text button, Apple/Google row, divider, then the three existing entry cards under "Already have a booking?". Offline: a notice that sign-in needs a connection, entry cards and front-desk help still shown. |
| `sign-in` | new | "Log in". Email field, **Continue**, Apple/Google row, "Create an account instead". |
| `create-account` | repurposed | "Create your account". Full name, email, Apple/Google row, a plain-language line that the account carries stays across all 13 properties. No mobile field — that belongs to `guest-details`, which removes the current duplication. |
| `verify-code` | new | "Check your email". One `<input inputMode="numeric" autoComplete="one-time-code" maxLength={6}>` with a visible label, the destination email, **Verify**, resend, and "Use a different email". |
| `code-expired` | new | "That code expired". Resend, or back to the email step. |
| `connect-booking` | new | "Add your booking". The post-auth booking hub: the same three entry routes plus "I'll do this later", which goes to `stay-overview`'s `empty` variant. |

`welcome-back` and `repeat-review` are unchanged in content but become reachable:
`getPostAuthScreen` routes a returning account with incomplete pre-arrival there.

### Data flow

Account-led, end to end:

```
entry-hub ─Create account─► create-account ─submit─► verify-code
   └─► createAccountSession(name, email, method)   [auth: 'pending-verification']
verify-code ─Verify─► verifyPendingSession(session) [auth: 'authenticated', accountStatus: 'new']
   └─► getPostAuthScreen(session) ─► connect-booking       (no bookings yet)
connect-booking ─Booking email─► identify ─► booking-found
   └─► connectBooking(session)  [appends UPCOMING_BOOKING_FIXTURE]
   └─► getPostAuthScreen(session) ─► guest-details          (new account, pre-arrival incomplete)
```

Booking-led, end to end:

```
entry-hub ─Booking email─► identify ─► booking-found
   └─► connectBooking(session)
   └─► session.auth !== 'authenticated' ─► create-account ─► verify-code
                                            └─► getPostAuthScreen ─► guest-details
```

Log-in:

```
entry-hub ─Log in─► sign-in ─submit─► verify-code
   └─► signInSession(method)  [MOCK_SESSION + auth: 'pending-verification']
verify-code ─Verify─► verifyPendingSession
   └─► getPostAuthScreen ─► welcome-back   (returning, upcoming stay, pre-arrival incomplete)
```

Room QR keeps its existing shape and gains the gate after linking:

```
entry-hub ─Room QR─► room-qr-landing ─Link my stay─► linkRoomStay()
   └─► authenticated ? room-qr-midstay : create-account ─► verify-code ─► room-qr-midstay
```

### Interfaces and contracts

```ts
// src/components/features/guest-app/prototype-model.ts

export type AuthState = 'anonymous' | 'pending-verification' | 'authenticated';
export type AccountStatus = 'none' | 'new' | 'returning';
export type AuthMethod = 'email-code' | 'apple' | 'google';

// added to the existing GuestSession
export type GuestSession = {
  guestName: string;
  email: string;
  bookings: Booking[];
  activeBookingId?: string;
  serviceBookings: ServiceBooking[];
  folioTotal: string;
  auth: AuthState;
  accountStatus: AccountStatus;
  authMethod?: AuthMethod;
};

/** The signed-out default. Replaces MOCK_SESSION as the component's initial state. */
export const ANONYMOUS_SESSION: GuestSession;

/** The booking `identify` matches: HEN-241109, The Henry Manila. */
export const UPCOMING_BOOKING_FIXTURE: Booking;

export function createAccountSession(
  guestName: string,
  email: string,
  method: AuthMethod,
): GuestSession;                                  // accountStatus 'new', no bookings

export function signInSession(method: AuthMethod): GuestSession;
                                                  // accountStatus 'returning', MOCK_SESSION bookings

export function verifyPendingSession(session: GuestSession): GuestSession;
                                                  // 'pending-verification' -> 'authenticated'

export function signOutSession(): GuestSession;   // -> ANONYMOUS_SESSION

export function connectBooking(session: GuestSession): GuestSession;
                                                  // appends UPCOMING_BOOKING_FIXTURE if absent

export function getPostAuthScreen(session: GuestSession): ScreenId;
```

`getPostAuthScreen` rules, in order:

1. Not `authenticated` → `'entry-hub'` is never returned; the caller must not
   call it before verification. Guarded by returning `'connect-booking'` for a
   session with no bookings, which is also the anonymous shape.
2. No bookings → `'connect-booking'`.
3. `accountStatus === 'returning'` and the primary booking has
   `preArrivalCompleted < preArrivalTotal` → `'welcome-back'`.
4. `accountStatus === 'new'` and the primary booking has
   `preArrivalCompleted < preArrivalTotal` → `'guest-details'`.
5. Otherwise → `'stay-overview'`.

`MOCK_SESSION` keeps its current bookings and guest and gains
`auth: 'authenticated'`, `accountStatus: 'returning'`, so every test that already
injects it keeps working and lands in the shell.

`OfflineCapability` gains `'authentication'`. It needs no change to
`getOfflineAction`'s body — it falls through to the existing `return 'blocked'` —
but it is named in the union and covered by a test so the contract is explicit.

No API envelope, validator, or `ApiError` is involved: this feature never leaves
the client component.

### Error handling

There is no server, so "errors" here are prototype states, surfaced in-screen.

| Failure | Surfaced as |
|---|---|
| Empty or malformed email | native `required` / `type="email"` validation on the field, consistent with every other form in the prototype |
| Code not 6 digits | `Verify` stays disabled until `maxLength` is met |
| Expired code | `code-expired` screen with resend |
| Offline at any auth step | `getOfflineAction('authentication') === 'blocked'`; the screen shows an offline `Notice` and the submit is disabled — never a fake success |
| Booking lookup failure | unchanged: existing `lookup-fallback` → `front-desk-assist` → `no-booking` chain |

### Testing

Model tests in `prototype-model.test.ts`:

- `ANONYMOUS_SESSION` is signed out with no bookings; `MOCK_SESSION` is an
  authenticated returning account.
- `createAccountSession` yields `pending-verification` + `accountStatus: 'new'`
  + zero bookings; `signInSession` yields `returning` with bookings.
- `verifyPendingSession` promotes only from `pending-verification`, and is a
  no-op on an already-authenticated session.
- `connectBooking` appends the fixture once and is idempotent on a second call.
- `signOutSession` returns the anonymous shape.
- `getPostAuthScreen` covers all five rules above.
- `getOfflineAction('authentication') === 'blocked'`.
- `SCREENS` length and uniqueness updated from 38 to 42.

Component tests in `guest-app-prototype.test.tsx`, driven through visible text
and roles as the existing suite is:

- First render shows Create account and Log in; no primary navigation.
- Create-account → verify → lands on Add your booking, and does **not** show a
  Stay QR or an active stay.
- Log-in → verify → lands on Welcome back for the returning fixture.
- Booking-led entry from `entry-hub` reaches the account gate before
  `guest-details`.
- Authenticated with zero bookings shows the tab bar and the `empty` home
  variant, whose primary action goes to Add your booking.
- Sign-out from `profile` returns to the welcome screen with the tab bar hidden.
- Offline welcome screen states that sign-in needs a connection and disables the
  account submit.
- The code input carries an accessible label and `autoComplete="one-time-code"`;
  new interactive targets meet the existing 44px contract.

Root-route test in `src/app/(marketing)/page.test.tsx`: brand, headline, hidden
nav, and Create account.

---

## Global Constraints

- Verification gate: `npm run typecheck && npm run lint && npm run build` passes
  with fresh output before any task is claimed complete. In this repo `build`
  requires `API_BASE_URL` — use the `.env.example` value
  (`API_BASE_URL=https://jsonplaceholder.typicode.com`) in the command
  environment. Do not modify unrelated dashboard configuration to bypass it.
- The architecture invariants in `CLAUDE.md` are binding. The API-layer
  invariants (1–8) are not engaged by this feature; invariant 2 (thin routes) is.
- The room-folio settlement rule is binding: no card, GCash, Maya, insurance,
  coupon, or rewards surface may appear anywhere in these screens.
- Services stay on-property only; the product boundary (no hotel discovery,
  search, flights, packages, or rewards) is unchanged.
- One route, one client component. No route per screen.
- Preserve the existing Asbir Sans / light Klarna-source visual language, the
  Phosphor icon set, and the `.guest-*` class contracts. At most three new class
  families, listed in *Components*.
- Accessibility contracts already tested in this suite hold for new screens:
  semantic labels on every field, named icon buttons, visible `:focus-visible`,
  `role="status"` live messaging, 44px minimum interactive targets, responsive
  containment, and reduced-motion handling.
- No real authentication, credential storage, or network call. Apple and Google
  are simulated exactly as QR scanning and ID capture already are.
- The working tree carries unrelated uncommitted changes (`DESIGN.md`,
  `README.md`, `next.config.ts`, layouts, `globals.css`, design-system gallery
  and tokens, `source-imagery`, `source-overlays`, `constants`, plus untracked
  `.codex/`, `.claude/launch.json`, `public/cabana-logo.svg`,
  `src/components/ui/cabana-logo.tsx`, `src/app/components/`). Stage only the
  files this feature touches. No broad `reset`, `checkout`, `stash`, or
  `git add .`.
- Commit on `main` per the user's standing instruction for this project; no
  branch, no push, no deploy without a new explicit request.

## Open questions

None. The three shape decisions were settled by the user on 2026-09-09 and are
recorded in the Decision Log.

## Decision Log

| Date | Decision | Why | Cost if wrong |
|---|---|---|---|
| 2026-09-09 | Hybrid welcome at `/`: account actions plus the three booking-entry paths, converging on one account gate | User's answer, and it preserves the room-QR and captive-portal arrival cases the product is defined by | Rework of `entry-hub` hierarchy and the gate's placement; the model functions and new screens survive either way |
| 2026-09-09 | Email + one-time code, with Apple and Google | User's choice; no fake password to store, and it matches the "secure code" path in the Expedia reference | Adding a password path later means new screens, not a model change |
| 2026-09-09 | Authentication unlocks the shell; nav gating moves from "has a booking" to "is authenticated" | User's choice; the `empty` home variant already exists for exactly this state | If nav should have stayed booking-gated, it is a one-line revert of `showPrimaryNav` plus its test |
| 2026-09-09 | The room-QR path gets the account gate *after* linking the stay, not before | A guest in the room should see their stay context first, but the shell is where folio charges are made, so identity must be real before it opens | One extra step for walk-ups; if it proves hostile, the gate can move to a soft prompt on `room-qr-midstay` |
| 2026-09-09 | `create-account` is repurposed from profile form to account creation; the mobile field moves to `guest-details` | The two screens currently ask for the same fields; making one of them auth removes the duplication rather than adding a fourth form | If the property needs mobile at account creation, add the field back to `create-account` |
| 2026-09-09 | `entry-hub` stays the initial screen id and keeps its headline; only its content changes | Keeps `ActiveScreen`, the `back()` fallback, and most of the root-route test intact | None material |
| 2026-09-09 | `ANONYMOUS_SESSION` becomes the component default; `MOCK_SESSION` gains authenticated/returning fields | Existing tests inject `MOCK_SESSION` and must keep landing in the shell | If any test depended on the anonymous default having bookings, it fails loudly at once |

---

## Before marking this spec In Review

- [x] **Placeholder scan** — no `<...>`, `TBD`, `TODO`, empty sections, or vague
      requirements.
- [x] **Internal consistency** — architecture, component list, screen table, data
      flow, and contracts agree.
- [x] **Scope check** — one plan's worth: one model file, one component, one
      stylesheet, three test files.
- [x] **Ambiguity check** — `getPostAuthScreen`'s rules are ordered and total;
      each new screen's content is stated.
- [x] **Status block filled** — Status, Created, Updated, Owner.
