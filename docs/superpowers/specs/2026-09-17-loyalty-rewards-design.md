# Loyalty Rewards Design

> Produced by `superpowers:brainstorming` (architectural path). Once this
> document is `Approved`, the only next skill is `superpowers:writing-plans`.
> File naming: `docs/superpowers/specs/YYYY-MM-DD-<topic>-design.md`.

| | |
|---|---|
| **Status** | `Draft` |
| **Created** | 2026-09-17 |
| **Updated** | 2026-09-17 |
| **Owner** | Kenanaiah Jo |
| **Plan** | `docs/superpowers/plans/2026-09-17-loyalty-rewards.md` |
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

A points programme and a badge collection, wired directly into the guest app.
**Points** measure how much a guest spends and redeem against a reward menu
priced in inventory rather than cash. **Badges** measure what kind of traveller
they are, and are shown to the guest with the evidence that earned them and a
control to switch them off.

The two are separate axes and neither drives the other: points do not buy
badges, badges do not raise earn rates. Both are **derived** from data the
session already holds, so the only new persisted state is what cannot be
derived — points spent, and badges muted.

Commercially the programme has one job the rest of the app cannot do. Cabana is
zero-CAC and booking-gated, so there is no acquisition surface; loyalty is the
only mechanism that creates direct repeat demand. Two mechanics carry that:
earn rates that pay materially more for a direct booking than an OTA one, and a
**Switched** badge that fires once, on the stay where a guest stops being
Agoda's and starts being the property's.

## Context

The guest app has no loyalty surface of any kind. A grep for `loyalt`, `reward`,
`points` or `tier` across `src/` returns only unrelated matches — a `Rewards`
switch specimen in the design-system gallery and the word "points" inside CSS
comments.

What exists that this builds on:

| Already in the model | Used for |
|---|---|
| `PastStay.source` — `Direct booking` / `Agoda` / `Booking.com` | the direct-vs-OTA earn differential, and **Switched** |
| `PastStay.charges[].category` | the Taste badge family |
| `PastStay.nights`, `.guestCount`, `.city`, `.property` | Rhythm, Company and Place families |
| `ServiceBooking` on the session | in-app earn, and Taste badges during a live stay |
| `Booking.roomVerification` ([prototype-model.ts:197](../../../src/components/features/guest-app/prototype-model.ts)) | the room-scan earn and **Scanned in** |
| `markRoomReady` / `canReportRoomReady` | **First look** |
| `session.reviews` | **Good notes** |
| `ESTATE_PROPERTIES` | the estate map and the Place family |
| `Confetti` in `promoted/` | the earn moment |
| `@phosphor-icons/react@2.1.10` | badge glyph fallback before artwork lands |

The profile screen already opens with *"Recognized across all 13 participating
properties"* ([guest-app-prototype.tsx:3494](../../../src/components/features/guest-app/guest-app-prototype.tsx))
— a promise the app currently does not keep. This is what keeps it.

What forces this now: the estate opened its thirteenth property this month, and
the newest has no reviews and no history. A programme with a **New opening**
badge and estate-wide points is how demand gets seeded at a property that
cannot yet earn it on reputation.

Badge artwork is being produced separately against
[`docs/badge-art-prompts.md`](../../badge-art-prompts.md). **The build does not
block on it** — see *Artwork fallback* below.

## Non-goals

- **No tiers.** No status levels, no earn multipliers, no named thresholds. The
  reward menu does the job tiers would have done, and does it without a second
  scoring system the guest has to learn. Revisit only if real stay-frequency
  data shows the points ledger alone under-motivating.
- **No Explore feed re-ordering.** Badges will eventually order the discovery
  feed and the story rail. That is a personalisation engine with its own
  ranking, its own failure modes and its own spec. v1 ships the narrower
  version described under *What a badge does in v1*.
- **No cash value.** Points redeem against Cabana inventory only. They are never
  refundable, transferable or convertible to money, which is what keeps them
  outside gift-cheque rules and makes a 24-month expiry defensible.
- **No vendor-funded boosts.** A vendor paying for a raised earn rate on their
  own listing is the marketplace revenue story and a good one. It needs a
  funding model and a provider-side surface, neither of which exists.
- **No real ledger.** Balances derive from fixtures in the browser. A shipped
  programme holds the ledger in the middleware, because the PMS estate is too
  heterogeneous to hold it and a folio is not an account.
- **No badge sharing or public profile.** Badges are shown to the guest and to
  the property, not to other guests.

## Success criteria

- [ ] A guest opening Profile → Rewards sees a points balance, the reward menu,
      badges held, and badges in progress — all derived from their own history,
      with no hand-written balance fixture anywhere in the codebase.
- [ ] The reference guest (Ana Santos, `MOCK_SESSION`) shows a points balance,
      several badges held and several one step from completion — every figure
      derived, none hand-written. *(The brainstorming figures — 30,100 points,
      8 held, 7 one away — were computed from `PAST_STAYS` alone.
      `MOCK_SESSION.serviceBookings` adds five further qualifying events, so
      Task 3 computes the true counts and amends this line. Do not assert the
      illustrative numbers.)*
- [ ] Redeeming a reward reduces the balance, appears in the ledger, and earns
      nothing back.
- [ ] Every in-progress badge row links to a specific bookable thing that would
      complete it.
- [ ] Opening a badge shows the actual bookings that earned it, and muting it
      removes it from every surface and survives a reload.
- [ ] A stay booked through an OTA shows, on its receipt, what it would have
      earned booked direct.
- [ ] Badges render correctly with **zero** artwork files present, and adopt
      real artwork per badge as PNGs land, with no code change beyond the asset
      path.
- [ ] `npm run typecheck && npm run lint && npm run build && npm test` passes
      with fresh output.

---

## Approaches considered

### Recommended: derived ledger, minimal persisted state

Points and badges are pure functions of `session.pastStays`,
`session.serviceBookings`, `session.bookings` and `session.reviews`. Nothing
about what a guest has *earned* is stored. The session gains one optional slice
holding only what cannot be derived:

```ts
rewards?: { redemptions: PointsRedemption[]; mutedBadges: BadgeId[] };
```

**Why:** a stored balance is a second source of truth that drifts from the stay
history it is supposed to summarise — the exact failure `prototype-model.ts`
already documents about `roomNumber` and room assignment state. Deriving also
means the switch fixtures in `applyPrototypeStayState` produce correct balances
for free, with no per-scenario points to maintain.

**Costs:** every render recomputes the ledger. At three stays and a few dozen
charges this is trivially cheap; a real implementation memoises or moves the
derivation server-side.

### Alternative: points balance stored on the session

A `points: number` field, incremented at each earn event.

**Rejected because:** it requires every earn site to remember to increment,
survives incorrectly across the prototype's stay-state switch, and makes the
demo's balance a fixture rather than a consequence. The first time a stakeholder
flips stay states and the balance does not move, the programme stops being
believable.

### Alternative: peso-denominated credit instead of points

A `₱3,010` balance spending 1:1 against anything.

**Rejected because:** at 1:1 it is cash with extra words, and it forfeits the
one thing points can do that money cannot — be priced against *inventory*. A
room upgrade costs the property an empty night, not ₱3,000, so points can buy it
below its cash value. That gap is the whole product. Cash credit also invites
the gift-cheque question that points sidestep.

---

## Design

### Architecture

Rewards is a new leaf directory under the guest app, mirroring how `promoted/`
is organised: pure model files with no React, and presentational components that
take props.

```
src/components/features/guest-app/rewards/
  points-model.ts    pure — earn rules, ledger, balance, reward menu
  badge-model.ts     pure — 42 definitions, evidence, progress
  badge-medal.tsx    the artefact: artwork when present, CSS medal when not
  badge-shelf.tsx    held badges + in-progress rows
  badge-sheet.tsx    one badge — evidence, and the mute control
  points-wallet.tsx  balance, what it buys, ledger, expiry
  reward-menu.tsx    the reward list and one reward's detail
  points-apply.tsx   the redeem control used by service-booking
  rewards.css
  index.ts
```

Both model files are pure by the same contract `prototype-model.ts` holds — no
React, no browser API — so the derivation is testable without rendering and
could move to a server unchanged.

**Against the `CLAUDE.md` invariants:** this adds no HTTP, no route handler, no
validator and no envelope. It is prototype-model and component work only, so
invariants 1–8 are untouched rather than bent. The one convention it leans on is
the pure-model rule, which it follows.

### The points model

Earn is expressed per ₱100 of spend, which makes the rate and the percentage the
same number:

| Source | Points per ₱100 |
|---|---|
| Room, booked direct | 70 |
| Room, booked through an OTA | 20 |
| Anything booked in the app | 50 |
| Charges the property posted itself | 0 |

Flat behaviour earns, which cost the property no cash and save it real
operational time: **room code scanned 1,000** · **pre-registration completed
1,500** · **stay survey completed 1,000**.

Redemption has two rates, and the gap between them is the product:

- **The floor** — `1,000 points = ₱100`, against anything Cabana sells, in ₱100
  blocks, always available. This is what makes points trustworthy: they are
  never worth nothing.
- **The reward menu** — whole-item only, priced at roughly 60–75% of what the
  floor would charge, because these cost the property inventory rather than
  cash.

| Reward | Points | At the floor | Cash price |
|---|---|---|---|
| Late checkout to 2 PM | 4,000 | ₱400 | an empty morning |
| Breakfast for two, Kape Manila | 5,000 | ₱500 | ~₱1,160 |
| Airport transfer | 8,000 | ₱800 | ₱1,200 |
| Room upgrade, one night | 12,000 | ₱1,200 | ~₱3,000 gap |
| Hilom signature massage | 16,000 | ₱1,600 | ₱2,400 |
| Couples massage suite | 32,000 | ₱3,200 | ₱4,600 |

Rules: a redemption earns nothing back · points expire 24 months after the
earn, and any new stay resets the clock on the whole balance · the balance is
shown with its floor value alongside it, always, so the conversion is never
something the guest has to perform.

Against the reference guest this yields **30,100 points** — the massage
outright with 14,100 left, and the couples suite 1,900 away.

### The badge model

42 authored badges in six families, plus three templates generated per venue.
The full list, earn criteria, glyph and artwork direction live in
[`docs/badge-art-prompts.md`](../../badge-art-prompts.md), which is the
single source for badge identity; `badge-model.ts` must not restate the criteria
in prose, only encode them.

| Family | What it tracks | Count | Shape | Enamel |
|---|---|---|---|---|
| Taste | what they book | 14 | circle | `#FF7EB3` |
| Company | who they travel with | 6 | rounded shield | `#E8B44F` |
| Rhythm | how and when they book | 8 | hexagon | `#2FA8A0` |
| Place | where they have stayed | 7 | pentagon | `#3D7BD6` |
| House | behaviours the property values | 4 | rounded square | `#6FAE7C` |
| Venue | per-venue recognition | 3 × venues | capsule | `#B92159` |

Which services count toward which badge is **handwritten per badge**, for the
same reason `story-model.ts` handwrites `STORY_FRAMES`: it is a judgement about
what a booking means, not something a category rule picks well.

**What a badge does in v1.** A badge is a preference the guest can see and
correct, not a trophy. v1 ships three consequences:

1. Every in-progress badge links to the specific bookable thing that completes
   it — a merchandising surface driven by taste rather than by category.
2. Opening a badge shows the actual bookings that earned it, and a mute control
   that removes it everywhere.
3. Muted badges are excluded from derivation, so the guest's correction is real
   rather than cosmetic.

Feed re-ordering is explicitly a non-goal; it is the fourth consequence and it
gets its own spec.

### Artwork fallback

The 42 PNGs do not exist yet and the build must not wait for them.
`BadgeDefinition.art` is optional. `BadgeMedal` renders `next/image` when it is
set, and otherwise composes a medal in CSS from the badge's family shape, the
family enamel colour and its Phosphor glyph.

The fallback is a deliverable, not a placeholder: it must look deliberate on
screen, because it is what the flow demos with until artwork lands. Adopting a
real asset is then one field on one badge, with no code change.

### Model additions

Five badges need data the fixtures do not carry. All additions are optional
except `islandGroup`, which has three properties to fill:

| Field | On | Unblocks |
|---|---|---|
| `bookedAt?: string` | `ServiceBooking` | Planner, Spontaneous |
| `scheduledHour?: number` | `ServiceBooking` | Night owl, Early riser |
| `hour?: number` | `PastStayCharge` | Night owl, Early riser, historic |
| `openedOn?: string` | `EstateProperty` | New opening |
| `islandGroup: 'luzon' \| 'visayas' \| 'mindanao'` | `EstateProperty` | Luzon to Mindanao |
| `listedOn?: string` | `RestaurantVenue` | Venue opener |

A badge whose data is absent reports **zero progress**; it never throws and
never guesses. Parsing times out of `PastStayCharge.detail` free text was
considered and rejected — a regex over prose is a silent-wrong-answer machine.

### Session shape and persistence

```ts
export type PointsRedemption = {
  id: string;
  rewardId: string;
  title: string;
  points: number;
  /** ISO date. */
  redeemedAt: string;
};

// on GuestSession
rewards?: {
  redemptions: PointsRedemption[];
  mutedBadges: BadgeId[];
};
```

**`SESSION_STORAGE_KEY` stays at `v5`.** The file's own doc comment says to bump
rather than migrate, and that rule is right for a shape change that would leave
the app reading a field that is not there. This is the first addition that is
purely additive: `rewards` is optional, every read goes through a
`getRewards(session)` helper returning `{ redemptions: [], mutedBadges: [] }`
when absent, and a v5 record therefore restores correctly as a guest who has
redeemed nothing and muted nothing. Bumping would discard every stored session
to gain nothing — worse for the demo, and a migration cost paid for no
correctness.

`isStoredSession` is extended to reject a `rewards` value that is present but
not an object, which is the only new way a stored record can be malformed.

### Screens and integration

Two new `ScreenId`s, both in the `Account` group, numbered from the current
maximum of 59:

- `rewards` (60) — the hub: balance, reward menu, badge shelf, estate map
- `reward-detail` (61) — one reward, what it costs, what remains after

Badge detail is a **sheet** within `rewards`, not a screen: it floats, so it
takes the 20px radius and a shadow per the design system.

Integration points, in dependency order:

| # | Surface | Change |
|---|---|---|
| 1 | `profile` | a row into `rewards`, showing the balance |
| 2 | `rewards` | the hub |
| 3 | `rewards` sheet | badge evidence and mute |
| 4 | `reward-detail` | redeem |
| 5 | `service-booking` | apply points to a booking |
| 6 | `booking-confirmation` | points earned, and any badge earned |
| 7 | `folio` | points as a line against the total |
| 8 | room scan success | 1,000 points |
| 9 | `stay-entry` | the OTA counterfactual line |

### Visual direction

The screen obeys the design system exactly; the badge artwork deliberately does
not. `DESIGN.md` governs chrome — surfaces, controls, type, the canvas. A badge
is content, the same category as the full-bleed story photography already in
`promoted/`, none of which obeys the restrained palette either. A badge has to
stand out from the regular UI or it is not a reward, and the quiet everywhere
else is what lets it.

So: the artwork goes maximal and nothing around it moves. No tile, no card, no
frame — the medal sits on the neutral canvas with its name beneath it in Asbir
Sans. Earned badges are a compact wrap; in-progress badges are rows inside one
inset surface per family, per the grouped-rows rule. The locked state is
`filter: grayscale(1) brightness(0.45); opacity: 0.55` over the same asset, so
there is one file per badge and not two.

Pink appears **only** on the progress track of the nearest one or two badges —
2px, at the medal's base, filled to the fraction earned. That is live state, one
of pink's three documented jobs. Counts are tabular. The earn moment scales
`0.96 → 1` over 220ms on `cubic-bezier(0.23, 1, 0.32, 1)` with the existing
`Confetti`; reduced motion keeps the fade and drops both.

### Error handling

No network boundary, so no `ApiError` and no envelope. The failure modes are
local:

| Failure | Handling |
|---|---|
| Redemption exceeding the balance | the control is disabled below the threshold; `redeemReward` also returns the session unchanged, so the guard is not only in the view |
| Badge data absent (`bookedAt` etc.) | zero progress, never a throw |
| Artwork PNG missing | CSS medal fallback |
| `rewards` absent on a restored v5 session | `getRewards()` default |
| `rewards` present but malformed | `isStoredSession` rejects the record; the guest starts fresh |

### Testing

Vitest, at the model layer for arithmetic and at the component layer for the
seams:

- `points-model.test.ts` — earn per source; that the reference guest totals
  30,100; that a redemption reduces the balance and earns nothing; that expiry
  reads off the most recent stay.
- `badge-model.test.ts` — that the reference guest holds exactly the 8 expected
  badges and has the 7 expected in progress; that a muted badge disappears from
  both; that a badge with absent data reports zero rather than throwing; that
  every definition's evidence set names ids that exist in `SERVICES` or
  `RESTAURANTS` — the guard that stops a typo silently making a badge
  unearnable.
- `rewards-flow.test.tsx` — profile opens rewards; redeeming moves the balance;
  the mute control persists; a badge renders with no artwork present.

---

## Global Constraints

- Verification gate: `npm run typecheck && npm run lint && npm run build && npm test`
  passes with fresh output before any task is claimed complete.
- The architecture invariants in `CLAUDE.md` are binding.
- `react-hooks` compiler rules are lint errors: no ref writes during render, no
  `setState` in an effect body.
- `points-model.ts` and `badge-model.ts` are pure — no React, no browser API, no
  network — matching the contract `prototype-model.ts` holds.
- Badge identity (name, criteria, glyph, family, artwork) has exactly one source:
  `docs/badge-art-prompts.md`. Code encodes it; code does not restate it.
- Points earned and badges held are **derived**. The only persisted rewards state
  is `redemptions` and `mutedBadges`.
- `SESSION_STORAGE_KEY` stays `cabana.guest-session.v5`.
- No badge count, points balance or streak appears in the navigation bar.
- Currency renders through `formatPesoAmount`; every changing number is tabular.

## Open questions

- [ ] None. Currency (points), tiers (none), scope (full loop) and placement
      (direct into the app, no experiment harness) were settled with the owner
      on 2026-09-17.

## Decision Log

| Date | Decision | Why | Cost if wrong |
|---|---|---|---|
| 2026-09-17 | Points, not peso credit | Points can be priced against inventory, which is the product; cash at 1:1 is cash with extra words | Re-denominating the ledger and every reward price |
| 2026-09-17 | No tiers in v1 | The reward menu does the job without a second scoring system | Additive later; no rework |
| 2026-09-17 | Built directly into the app, no experiment harness | The experiment registry was retired from `main` by `4257752`; reviving it for one flow buys isolation the owner does not want | Touching production screens without an incubation stage |
| 2026-09-17 | Points and badges derived, not stored | A stored balance drifts from the history it summarises, and breaks under the stay-state switch | Rewriting every earn site to increment |
| 2026-09-17 | `SESSION_STORAGE_KEY` stays `v5` | `rewards` is purely additive with a safe default; bumping discards every stored session for no correctness | A v5 record restoring with an unreadable `rewards` — guarded structurally |
| 2026-09-17 | Artwork optional, CSS medal fallback | 42 PNGs are being produced separately and the build must not block | Building a fallback that is never used |
| 2026-09-17 | No time parsing from `PastStayCharge.detail` | A regex over prose silently returns wrong answers; an explicit optional field reports zero honestly | Six fixture fields to fill |
| 2026-09-17 | Explore feed re-ordering deferred | It is a ranking engine with its own failure modes | Badges do less in v1 than the premise implies |

---

## Before marking this spec In Review

- [x] **Placeholder scan** — no `<...>`, `TBD`, `TODO` or vague requirements.
- [x] **Internal consistency** — architecture, components and integration table agree.
- [x] **Scope check** — one plan's worth: two models, one hub screen, one detail
      screen, one sheet and seven integration points. Feed re-ordering is split out.
- [x] **Ambiguity check** — every rate, threshold and price is a number.
- [x] **Status block filled.**
