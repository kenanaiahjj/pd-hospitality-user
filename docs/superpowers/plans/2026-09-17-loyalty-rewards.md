# Loyalty Rewards Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

| | |
|---|---|
| **Status** | `Complete` |
| **Created** | 2026-09-17 |
| **Updated** | 2026-09-17 |
| **Owner** | Kenanaiah Jo |
| **Branch / worktree** | `main` — see the branch-collision note in the ledger |
| **Spec** | `docs/superpowers/specs/2026-09-17-loyalty-rewards-design.md` |
| **Ledger** | `.superpowers/sdd/2026-09-17-loyalty-rewards/progress.md` |

**Status values:** `Draft` → `Approved` → `In Progress` → `Complete`.
Off-ramps: `Blocked` (say what unblocks it in Decision Log) · `Abandoned`.

**Goal:** Ship a points programme and a 42-badge collection directly into the
guest app, both derived from stay history, with badge artwork optional.

**Architecture:** Two pure model files (`points-model.ts`, `badge-model.ts`)
derive everything earned from data the session already holds; only redemptions
and muted badges persist. Presentational components take props and render
against the existing design system, with a CSS medal fallback so the build never
waits on artwork.

**Tech Stack:** Next.js 16 (App Router) · React 19 · TypeScript (strict) · zod · Tailwind v4 · `@phosphor-icons/react@2.1.10`

---

## Progress

| # | Task | Status | Started | Completed | Commit |
|---|---|---|---|---|---|
| 0 | Restore the green baseline (precondition, not loyalty work) | ⬜ Not started | — | — | — |
| 1 | Model additions and the rewards session slice | ✅ Complete | 2026-09-17 | 2026-09-17 | `5d724ac` |
| 2 | Points model | ✅ Complete | 2026-09-17 | 2026-09-17 | `d8cd450` |
| 3 | Badge model | ✅ Complete | 2026-09-17 | 2026-09-17 | `b6b9b99` |
| 4 | BadgeMedal and the artwork fallback | ✅ Complete | 2026-09-17 | 2026-09-17 | `cb5aa68` |
| 5 | Rewards hub, and the door from Profile | ✅ Complete | 2026-09-17 | 2026-09-17 | `e35e5d5` |
| 6 | Badge sheet and the mute control | ✅ Complete | 2026-09-17 | 2026-09-17 | `a82c69b` |
| 7 | Reward menu, reward detail, redeem | ✅ Complete | 2026-09-17 | 2026-09-17 | `e5df5e6` |
| 8 | Apply points to a booking, earn on confirmation | ✅ Complete | 2026-09-17 | 2026-09-17 | `2efa6b8` |
| 9 | Folio line, scan earn, OTA counterfactual | ✅ Complete | 2026-09-17 | 2026-09-17 | `26e9ace` |

Legend: ⬜ Not started · 🔄 In progress · 🔁 Fix round *R*/5 · ✅ Complete · ⛔ Blocked · ⏭️ Descoped

---

## Global Constraints

Copied verbatim from the spec. Every task's requirements implicitly include this
section.

- Verification gate: `npm run typecheck && npm run lint && npm run build && npm test`
  passes with fresh output before any task is claimed complete. **`npm test` is
  red on `main` as of `f0b53b8` — 72 failures unrelated to this work. Task 0
  clears them; until it lands, no task can honestly claim the gate.**
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

---

## File Structure

**Create**
- `src/components/features/guest-app/rewards/points-model.ts` — earn rules, ledger, balance, reward menu, redemption
- `src/components/features/guest-app/rewards/points-model.test.ts` — the arithmetic
- `src/components/features/guest-app/rewards/badge-model.ts` — 42 definitions, evidence derivation, progress, muting
- `src/components/features/guest-app/rewards/badge-model.test.ts` — derivation and the definition-integrity guard
- `src/components/features/guest-app/rewards/badge-medal.tsx` — artwork when present, CSS medal when not
- `src/components/features/guest-app/rewards/badge-shelf.tsx` — held wrap, in-progress rows
- `src/components/features/guest-app/rewards/badge-sheet.tsx` — one badge: evidence and mute
- `src/components/features/guest-app/rewards/points-wallet.tsx` — balance, what it buys, ledger, expiry
- `src/components/features/guest-app/rewards/reward-menu.tsx` — the reward list and one reward's detail
- `src/components/features/guest-app/rewards/points-apply.tsx` — the redeem control for a booking
- `src/components/features/guest-app/rewards/estate-map.tsx` — 13 properties, visited lit
- `src/components/features/guest-app/rewards/rewards.css`
- `src/components/features/guest-app/rewards/index.ts`
- `src/components/features/guest-app/rewards/rewards-flow.test.tsx` — the screen seams

**Modify**
- `src/components/features/guest-app/prototype-model.ts` — six fixture fields, `PointsRedemption`, `RewardsState`, `getRewards`, two `ScreenId`s, two `SCREENS` rows
- `src/components/features/guest-app/session-storage.ts` — guard a malformed `rewards`
- `src/components/features/guest-app/guest-app-prototype.tsx` — Profile row, two screen cases, booking/folio/scan/receipt integration
- `src/components/features/guest-app/index.ts` — re-export the rewards barrel

---

## Task 0: Restore the green baseline

**Status:** ⬜ Not started · **Started:** — · **Completed:** —

Not loyalty work. It is here because every task below claims a verification gate
that `npm test` cannot currently pass, and a plan whose gate is already red
teaches its executor to ignore the gate.

Measured on `main` at `f0b53b8` with a clean tree: **72 failed, 339 passed**
across 2 files. Three independent causes.

**Descope this task (⏭️) if the baseline is being fixed on its own branch** —
then Task 1 starts from whatever green that lands.

**Files:**
- Modify: `src/components/features/guest-app/prototype-model.test.ts`
- Modify: `src/components/features/guest-app/prototype-model.ts`
- Modify: `src/components/features/guest-app/guest-app-prototype.test.tsx`

- [ ] **Step 1: Correct the stale screen-inventory assertion**

`prototype-model.test.ts:72` asserts 53 screens; `SCREENS` holds 57.

```
AssertionError: expected [ …(57) ] to have a length of 53 but got 57
```

Confirm all 57 entries are intentional and their ids unique, then move the
assertion to 57. Do not relax it to `toBeGreaterThan` — the point of the
assertion is that adding a screen is a deliberate act someone notices.

- [ ] **Step 2: Fix the cancelled-booking settlement wording**

This is a real user-facing defect, not a stale test:

```
Expected: "Cancelled · not charged"
Received: "Completed · charged to room 512"
```

The app tells a guest that a service they cancelled was charged to their room.
The explore/QR promotion plan called this out and it was never fixed. Correct
the settlement description so a `cancelled` service never reports a charge, and
keep the existing test as the regression.

- [ ] **Step 3: Repair the home-screen test ids**

70 failures in `guest-app-prototype.test.tsx`, nearly all:

```
TestingLibraryElementError: Unable to find an element by: [data-testid="guest-home-upcoming"]
```

The home screen was reworked without its tests. For each failing id, decide
whether the *element* should exist or the *assertion* should move — a test id
that no longer describes anything on screen is deleted, not renamed to whatever
happens to be rendering.

- [ ] **Step 4: Verify the baseline is green**

Run: `npm run typecheck && npm run lint && npm run build && npm test`
Expected: exit 0, 411 passed, 0 failed

- [ ] **Step 5: Commit**

```bash
git add src/components/features/guest-app
git commit -m "fix: stop reporting a cancelled service as charged, and re-green the suite"
```

---

## Task 1: Model additions and the rewards session slice

**Status:** ✅ Complete · **Started:** 2026-09-17 · **Completed:** 2026-09-17 · **Commit:** `5d724ac`

> Verified per-file, not against the full suite: `prototype-model.test.ts` +
> `session-storage.test.ts` + `service-images.test.ts` → 2 failed, 149 passed,
> both failures the pre-existing Task 0 pair. `typecheck` and `lint` exit 0.

**Files:**
- Modify: `src/components/features/guest-app/prototype-model.ts`
- Modify: `src/components/features/guest-app/session-storage.ts`
- Test: `src/components/features/guest-app/session-storage.test.ts`

**Interfaces:**
- Produces: `PointsRedemption`, `RewardsState`, `getRewards(session): RewardsState`, and the six optional fixture fields.

- [x] **Step 1: Write the failing test**

Append to `session-storage.test.ts`:

```ts
it('restores a v5 record that predates rewards', () => {
  const stored = { ...MOCK_SESSION };
  delete (stored as Partial<GuestSession>).rewards;
  window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(stored));

  const restored = readStoredSession();
  expect(restored).toBeDefined();
  expect(getRewards(restored!)).toEqual({ redemptions: [], mutedBadges: [] });
});

it('rejects a record whose rewards slice is not an object', () => {
  window.localStorage.setItem(
    SESSION_STORAGE_KEY,
    JSON.stringify({ ...MOCK_SESSION, rewards: 'nope' }),
  );
  expect(readStoredSession()).toBeUndefined();
});
```

- [x] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/components/features/guest-app/session-storage.test.ts`
Expected: FAIL — `getRewards is not exported`

- [x] **Step 3: Write the minimal implementation**

In `prototype-model.ts`:

```ts
export type PointsRedemption = {
  id: string;
  rewardId: string;
  title: string;
  points: number;
  /** ISO date. */
  redeemedAt: string;
};

/**
 * The only rewards state worth persisting.
 *
 * Points earned and badges held are derived from the stay history every time
 * they are read -- a stored balance is a second source of truth that drifts
 * from the stays it is meant to summarise, and would survive the prototype's
 * stay-state switch incorrectly. What cannot be derived is what the guest
 * spent and what they told us to stop inferring, so that is what is kept.
 */
export type RewardsState = {
  redemptions: PointsRedemption[];
  mutedBadges: string[];
};

/** Absent on any session stored before rewards existed. Defaulted, not migrated. */
export function getRewards(session: GuestSession): RewardsState {
  return session.rewards ?? { redemptions: [], mutedBadges: [] };
}
```

Add to `GuestSession`:

```ts
  /** Redemptions and badge opt-outs. Everything else is derived. */
  rewards?: RewardsState;
```

Add the six fixture fields — `ServiceBooking.bookedAt?`, `ServiceBooking.scheduledHour?`,
`PastStayCharge.hour?`, `EstateProperty.openedOn?`,
`EstateProperty.islandGroup`, `RestaurantVenue.listedOn?` — and populate them
across `PAST_STAYS`, `MOCK_SESSION`, `ESTATE_PROPERTIES` and `RESTAURANTS`.
`islandGroup` is required: Manila → `luzon`, Cebu → `visayas`, and the newest
property → `mindanao`.

In `session-storage.ts`, extend `isStoredSession`:

```ts
    && (value.rewards === undefined || isObject(value.rewards))
```

- [x] **Step 4: Run the test to verify it passes**

Run: `npx vitest run src/components/features/guest-app/session-storage.test.ts`
Expected: PASS

- [x] **Step 5: Verify the repo is clean**

Run: `npm run typecheck && npm run lint`
Expected: exit 0, no output from eslint

- [x] **Step 6: Commit**

```bash
git add src/components/features/guest-app/prototype-model.ts src/components/features/guest-app/session-storage.ts src/components/features/guest-app/session-storage.test.ts
git commit -m "feat: carry rewards state and the fixtures badges derive from"
```

---

## Task 2: Points model

**Status:** ✅ Complete · **Started:** 2026-09-17 · **Completed:** 2026-09-17 · **Commit:** `d8cd450`

> Verified: `rewards/` 14/14 · `typecheck` exit 0 · `lint` exit 0. The reference
> guest lands at **37,220 points**, not the 30,100 estimated in brainstorming.

**Files:**
- Create: `src/components/features/guest-app/rewards/points-model.ts`
- Test: `src/components/features/guest-app/rewards/points-model.test.ts`

**Interfaces:**
- Consumes: `getRewards`, `PointsRedemption`, `PastStay`, `GuestSession`, `parsePesoAmount`, `formatPesoAmount`.
- Produces: `POINTS_PER_100`, `POINTS_FLOOR_BLOCK`, `REWARD_MENU`, `PointsEntry`, `Reward`, `buildPointsLedger`, `pointsBalance`, `pointsAsPesos`, `affordableRewards`, `pointsExpiry`, `redeemReward`, `earnedForStay`, `directCounterfactual`.

- [x] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest';
import { MOCK_SESSION, PAST_STAYS } from '../prototype-model';
import { earnedForStay, pointsBalance, pointsAsPesos, redeemReward, REWARD_MENU, directCounterfactual } from './points-model';

describe('points-model', () => {
  it('pays 70 per ₱100 on a direct room and 50 on app bookings', () => {
    // ₱18,600 direct room = 13,020 · ₱18,790 charges = 9,395
    expect(earnedForStay(PAST_STAYS[0]!)).toBe(22415);
  });

  it('pays 20 per ₱100 on an OTA room', () => {
    // ₱9,800 Agoda room = 1,960 · ₱4,350 charges = 2,175
    expect(earnedForStay(PAST_STAYS[1]!)).toBe(4135);
  });

  it('totals the reference guest at 30,100', () => {
    expect(pointsBalance(MOCK_SESSION)).toBe(30100);
  });

  it('states the floor value alongside the balance', () => {
    expect(pointsAsPesos(30100)).toBe('₱3,010');
  });

  it('says what an OTA stay would have earned booked direct', () => {
    expect(directCounterfactual(PAST_STAYS[1]!)).toBe(6860);
  });

  it('reduces the balance on redemption and earns nothing back', () => {
    const massage = REWARD_MENU.find((reward) => reward.id === 'hilom-massage')!;
    const after = redeemReward(MOCK_SESSION, massage);
    expect(pointsBalance(after)).toBe(30100 - massage.points);
  });

  it('refuses a redemption the balance cannot cover', () => {
    const broke = { ...MOCK_SESSION, pastStays: [] };
    const massage = REWARD_MENU.find((reward) => reward.id === 'hilom-massage')!;
    expect(redeemReward(broke, massage)).toBe(broke);
  });
});
```

- [x] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/components/features/guest-app/rewards/points-model.test.ts`
Expected: FAIL — `Cannot find module './points-model'`

- [x] **Step 3: Write the minimal implementation**

```ts
/** Points per ₱100 of spend. The rate and the percentage are the same number. */
export const POINTS_PER_100 = {
  'stay-direct': 70,
  'stay-ota': 20,
  'in-app-booking': 50,
} as const;

/** Flat earns that cost the property no cash and save it operational time. */
export const BEHAVIOUR_POINTS = {
  'room-scan': 1000,
  'pre-registration': 1500,
  'stay-survey': 1000,
} as const;

/** The floor: what points are always worth, so they are never worth nothing. */
export const POINTS_FLOOR_BLOCK = 1000;
export const POINTS_FLOOR_PESOS = 100;

export const REWARD_MENU: Reward[] = [
  { id: 'late-checkout', title: 'Late checkout to 2 PM', detail: 'Subject to availability', points: 4000 },
  { id: 'breakfast-two', title: 'Breakfast for two', detail: 'Kape Manila Café', points: 5000, cashPrice: '₱1,160' },
  { id: 'airport-transfer', title: 'Airport transfer', detail: 'Hotel arranged', points: 8000, cashPrice: '₱1,200' },
  { id: 'room-upgrade', title: 'Room upgrade, one night', detail: 'Subject to availability', points: 12000 },
  { id: 'hilom-massage', title: 'Hilom signature massage', detail: '60 minutes', points: 16000, cashPrice: '₱2,400' },
  { id: 'couples-suite', title: 'Couples massage suite', detail: '90 minutes, two guests', points: 32000, cashPrice: '₱4,600' },
];
```

`earnedForStay` reads `stay.source` to pick `stay-direct` or `stay-ota` for the
room rate, applies `in-app-booking` to every charge, and floors each product.
`buildPointsLedger` maps stays and behaviour events into `PointsEntry[]`, then
appends redemptions as negative entries. `pointsBalance` sums the ledger.
`redeemReward` returns the session unchanged when the balance cannot cover it.

- [x] **Step 4: Run the test to verify it passes**

Run: `npx vitest run src/components/features/guest-app/rewards/points-model.test.ts`
Expected: PASS — 7 passed

- [x] **Step 5: Verify the repo is clean**

Run: `npm run typecheck && npm run lint`
Expected: exit 0

- [x] **Step 6: Commit**

```bash
git add src/components/features/guest-app/rewards/points-model.ts src/components/features/guest-app/rewards/points-model.test.ts
git commit -m "feat: derive a points balance from the stays that earned it"
```

---

## Task 3: Badge model

**Status:** ✅ Complete · **Started:** 2026-09-17 · **Completed:** 2026-09-17 · **Commit:** `b6b9b99`

> **Real figures: 13 held, 6 within one step.** Not the estimated 8 and 7.
> Verified: `rewards/` 33/33 · `typecheck` exit 0 · `lint` exit 0.

> **Two findings from Task 1 that change this task's tests.**
>
> 1. **The "8 held / 7 one-away" figures below are illustrative, not binding.**
>    They were computed from `PAST_STAYS` alone, before
>    `MOCK_SESSION.serviceBookings` was read. Those five live bookings — Hilom,
>    Azotea, Binondo, Apartment 1B and a cancelled Kape Manila — add qualifying
>    events and shift both tallies. **Compute the real figures, assert those,
>    and amend the spec's success criterion to match.**
> 2. **Cancelled bookings must not count.** `service-cafe-cancelled` sits in
>    `MOCK_SESSION` at status `cancelled`. Filter on status or Ana earns badges
>    for things she called off.
>
> Also note `luzon-to-mindanao` cannot currently be earned: `ESTATE_PROPERTIES`
> holds manila (luzon), cebu (visayas) and dumaguete (visayas), and no Mindanao
> property exists. It should read as a stretch goal at 2 of 3, not as broken.

**Files:**
- Create: `src/components/features/guest-app/rewards/badge-model.ts`
- Test: `src/components/features/guest-app/rewards/badge-model.test.ts`

**Interfaces:**
- Consumes: `getRewards`, `GuestSession`, `SERVICES`, `RESTAURANTS`, `ESTATE_PROPERTIES`.
- Produces: `BadgeFamily`, `BadgeId`, `BadgeDefinition`, `BadgeProgress`, `BADGES`, `BADGE_FAMILIES`, `badgeProgress`, `earnedBadges`, `nearlyEarnedBadges`, `muteBadge`.

All 42 definitions come from `docs/badge-art-prompts.md` — name, family,
threshold, glyph and earn criteria. Encode them; do not paraphrase them.

- [x] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest';
import { RESTAURANTS, SERVICES, MOCK_SESSION } from '../prototype-model';
import { BADGES, badgeProgress, earnedBadges, nearlyEarnedBadges, muteBadge } from './badge-model';

const EXPECTED_HELD = [
  'foodie', 'caffeine', 'early-riser', 'pair',
  'weekender', 'switched', 'island-hopper', 'venue-regular-cafe',
];

describe('badge-model', () => {
  it('defines 42 authored badges', () => {
    expect(BADGES.filter((badge) => badge.family !== 'venue')).toHaveLength(39);
  });

  it('holds exactly the expected badges for the reference guest', () => {
    expect(earnedBadges(MOCK_SESSION).map((row) => row.definition.id).sort())
      .toEqual([...EXPECTED_HELD].sort());
  });

  it('puts seven badges one step from completion', () => {
    const nearly = nearlyEarnedBadges(MOCK_SESSION);
    expect(nearly).toHaveLength(7);
    expect(nearly.every((row) => row.definition.threshold - row.count === 1)).toBe(true);
  });

  it('points every in-progress badge at something bookable', () => {
    for (const row of nearlyEarnedBadges(MOCK_SESSION)) {
      expect(row.nextStep).toBeDefined();
    }
  });

  it('drops a muted badge from every surface', () => {
    const muted = muteBadge(MOCK_SESSION, 'foodie');
    expect(earnedBadges(muted).map((row) => row.definition.id)).not.toContain('foodie');
  });

  it('reports zero rather than throwing when the data is absent', () => {
    const bare = { ...MOCK_SESSION, pastStays: [], serviceBookings: [] };
    expect(() => badgeProgress(bare)).not.toThrow();
    expect(badgeProgress(bare).every((row) => row.count === 0)).toBe(true);
  });

  /* The guard that stops a typo silently making a badge unearnable. */
  it('names only catalogue ids in every evidence set', () => {
    const known = new Set([
      ...SERVICES.map((service) => service.id),
      ...RESTAURANTS.map((venue) => venue.id),
    ]);
    for (const badge of BADGES) {
      for (const id of badge.qualifyingIds ?? []) {
        expect(known.has(id), `${badge.id} names unknown id ${id}`).toBe(true);
      }
    }
  });
});
```

- [x] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/components/features/guest-app/rewards/badge-model.test.ts`
Expected: FAIL — `Cannot find module './badge-model'`

- [x] **Step 3: Write the minimal implementation**

```ts
export type BadgeFamily = 'taste' | 'company' | 'rhythm' | 'place' | 'house' | 'venue';

export type BadgeDefinition = {
  id: string;
  name: string;
  family: BadgeFamily;
  /** How many qualifying events earn it. */
  threshold: number;
  /** One line, as it reads on an in-progress row. */
  requirement: string;
  /** Phosphor icon name, for the medal that renders before artwork exists. */
  glyph: string;
  /**
   * Catalogue ids that count toward it.
   *
   * Handwritten per badge, for the same reason `story-model.ts` handwrites
   * STORY_FRAMES: which booking makes someone a Foodie is a judgement about
   * what it meant, not something a category rule picks well.
   */
  qualifyingIds?: string[];
  /** Artwork, once generated. Absent until then -- the medal falls back. */
  art?: string;
};

export const BADGE_FAMILIES: Record<BadgeFamily, { label: string; shape: string; enamel: string }> = {
  taste: { label: 'How you eat and unwind', shape: 'circle', enamel: '#FF7EB3' },
  company: { label: 'Who you travel with', shape: 'shield', enamel: '#E8B44F' },
  rhythm: { label: 'How you book', shape: 'hexagon', enamel: '#2FA8A0' },
  place: { label: 'Where you have been', shape: 'pentagon', enamel: '#3D7BD6' },
  house: { label: 'Good guest', shape: 'square', enamel: '#6FAE7C' },
  venue: { label: 'Your regulars', shape: 'capsule', enamel: '#B92159' },
};
```

`badgeProgress` walks every definition, counts qualifying events across
`pastStays`, `serviceBookings`, `bookings` and `reviews`, and excludes anything
in `getRewards(session).mutedBadges`. A badge whose data is absent counts zero.
`nextStep` resolves to the cheapest unbooked `qualifyingIds` entry.

- [x] **Step 4: Run the test to verify it passes**

Run: `npx vitest run src/components/features/guest-app/rewards/badge-model.test.ts`
Expected: PASS — 7 passed

- [x] **Step 5: Verify the repo is clean**

Run: `npm run typecheck && npm run lint`
Expected: exit 0

- [x] **Step 6: Commit**

```bash
git add src/components/features/guest-app/rewards/badge-model.ts src/components/features/guest-app/rewards/badge-model.test.ts
git commit -m "feat: derive 42 traveller badges from the bookings that earned them"
```

---

## Task 4: BadgeMedal and the artwork fallback

**Status:** ✅ Complete · **Started:** 2026-09-17 · **Completed:** 2026-09-17 · **Commit:** `cb5aa68`

> Verified: `rewards/` 39/39 · `typecheck` exit 0 · `lint` exit 0.
> **Visually unverified** — the medal is not reachable in the app until Task 5
> mounts it. Screenshot the shelf there before claiming the fallback looks
> deliberate.

**Files:**
- Create: `src/components/features/guest-app/rewards/badge-medal.tsx`
- Create: `src/components/features/guest-app/rewards/rewards.css`
- Test: `src/components/features/guest-app/rewards/rewards-flow.test.tsx`

**Interfaces:**
- Consumes: `BadgeDefinition`, `BADGE_FAMILIES`.
- Produces: `BadgeMedal`, `BadgeMedalProps { badge: BadgeDefinition; earned: boolean; size?: 28 | 48 | 64 }`.

The fallback is a deliverable, not a placeholder — it is what the flow demos
with until the 42 PNGs land, so it has to look deliberate.

- [x] **Step 1: Write the failing test**

```ts
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { BADGES } from './badge-model';
import { BadgeMedal } from './badge-medal';

describe('BadgeMedal', () => {
  it('renders every badge with no artwork present', () => {
    for (const badge of BADGES) {
      const { unmount } = render(<BadgeMedal badge={{ ...badge, art: undefined }} earned />);
      expect(screen.getByRole('img', { name: badge.name })).toBeInTheDocument();
      unmount();
    }
  });

  it('marks an unearned medal as locked for assistive technology', () => {
    render(<BadgeMedal badge={{ ...BADGES[0]!, art: undefined }} earned={false} />);
    expect(screen.getByRole('img', { name: /not yet earned/i })).toBeInTheDocument();
  });
});
```

- [x] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/components/features/guest-app/rewards/rewards-flow.test.tsx`
Expected: FAIL — `Cannot find module './badge-medal'`

- [x] **Step 3: Write the minimal implementation**

`BadgeMedal` renders `next/image` when `badge.art` is set. Otherwise it composes
the medal from the family's shape and enamel colour with the Phosphor glyph
centred, resolved dynamically from `@phosphor-icons/react`. Both paths carry
`role="img"` and an accessible name; the unearned name ends in "not yet earned".

In `rewards.css`, the locked treatment applies to whichever path rendered:

```css
.badge-medal--locked {
  filter: grayscale(1) brightness(0.45);
  opacity: 0.55;
}
```

Shapes come from `clip-path` per family. No shadow on a medal — a surface takes
a hairline or a shadow, never both.

- [x] **Step 4: Run the test to verify it passes**

Run: `npx vitest run src/components/features/guest-app/rewards/rewards-flow.test.tsx`
Expected: PASS — 2 passed

- [x] **Step 5: Verify the repo is clean**

Run: `npm run typecheck && npm run lint`
Expected: exit 0

- [x] **Step 6: Commit**

```bash
git add src/components/features/guest-app/rewards/badge-medal.tsx src/components/features/guest-app/rewards/rewards.css src/components/features/guest-app/rewards/rewards-flow.test.tsx
git commit -m "feat: render a badge before its artwork exists"
```

---

## Task 5: Rewards hub, and the door from Profile

**Status:** ✅ Complete · **Started:** 2026-09-17 · **Completed:** 2026-09-17 · **Commits:** `1b078c1`, `e35e5d5`

> Verified: 53/53 in `rewards/`, 193 passed across the touched files (the only
> 2 failures are the pre-existing Task 0 pair), typecheck and lint exit 0, and
> **the hub confirmed on screen at 900×1000** — wallet, shelf, estate map and
> the Profile tab staying current.
>
> One `ScreenId` only: `rewards` (60). `reward-detail` belongs to Task 7, and a
> screen id with no case is a dead entry.
>
> `guest-app-prototype.tsx` was dirty with a second session's work throughout.
> Its hunks were staged surgically (`git apply --cached -R`), so their
> `showNav`/`showPrimaryNav` split and `MY_STAY_SCREENS` change are still
> uncommitted in the working tree, untouched.

> **Mount `rewards.css` and screenshot the badge shelf.** Task 4's CSS medal has
> never been on screen — clip-path shapes, the sunburst field and the glyph
> gloss are all unverified. Check all six family shapes render, and that a
> locked medal still reads as the same object rather than as a hole.
>
> Real figures to build against: **37,220 points · 13 held · 6 within one step**.

**Files:**
- Create: `points-wallet.tsx`, `badge-shelf.tsx`, `estate-map.tsx`, `index.ts`
- Modify: `prototype-model.ts` (two `ScreenId`s, two `SCREENS` rows), `guest-app-prototype.tsx`
- Test: `rewards-flow.test.tsx`

**Interfaces:**
- Consumes: everything from Tasks 2–4.
- Produces: `PointsWallet`, `BadgeShelf`, `EstateMap`, and the `rewards` screen case.

`rewards` is screen 60, `reward-detail` is 61 — the current maximum is 59. Both
sit in the `Account` group and must be added to the `showNav` list so the bars
stay on.

- [x] **Step 1: Write the failing test**

```ts
it('opens rewards from profile and states the balance with its floor value', async () => {
  const user = userEvent.setup();
  render(<GuestAppPrototype initialSession={MOCK_SESSION} />);

  await user.click(screen.getByRole('button', { name: /profile/i }));
  await user.click(screen.getByRole('button', { name: /points and badges/i }));

  expect(screen.getByText('30,100')).toBeInTheDocument();
  expect(screen.getByText(/₱3,010/)).toBeInTheDocument();
});

it('links every in-progress badge to something bookable', async () => {
  /* … render, navigate to rewards … */
  const rows = screen.getAllByTestId('badge-progress-row');
  expect(rows).toHaveLength(7);
  for (const row of rows) {
    expect(within(row).getByRole('button')).toBeEnabled();
  }
});
```

- [x] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/components/features/guest-app/rewards/rewards-flow.test.tsx`
Expected: FAIL — no `points and badges` control on Profile

- [x] **Step 3: Write the minimal implementation**

`PointsWallet` shows the balance in tabular figures with its floor value beside
it, then what it buys named from `REWARD_MENU`, then the ledger and the expiry.
`BadgeShelf` renders earned badges as a compact wrap and in-progress badges as
rows grouped into one inset surface per family, each row carrying the medal,
name, `count of threshold`, requirement and a control routing to `nextStep`. The
pink progress track appears on the nearest two rows only.

In `guest-app-prototype.tsx`, add a Profile row into `rewards` showing the
balance, and the `case 'rewards':` branch composing the three components.

- [x] **Step 4: Run the test to verify it passes**

Run: `npx vitest run src/components/features/guest-app/rewards/rewards-flow.test.tsx`
Expected: PASS

- [x] **Step 5: Verify the repo is clean**

Run: `npm run typecheck && npm run lint && npm test`
Expected: exit 0, full suite green

- [x] **Step 6: Commit**

```bash
git add src/components/features/guest-app/rewards src/components/features/guest-app/prototype-model.ts src/components/features/guest-app/guest-app-prototype.tsx
git commit -m "feat: give the profile a rewards hub that shows what the points buy"
```

---

## Task 6: Badge sheet and the mute control

**Status:** ✅ Complete · **Started:** 2026-09-17 · **Completed:** 2026-09-17 · **Commit:** `a82c69b`

> Verified: `rewards/` 58/58 · 198 passed across touched files (the 2 failures
> remain the Task 0 pair) · typecheck and lint exit 0 · **sheet confirmed on
> screen** with all six evidence lines and the correction control.
>
> `PointsWallet`'s `onOpenReward` is still optional and unpassed — Task 7 wires
> it the same way, and the stylesheet already targets the child whatever its tag.

**Files:**
- Create: `badge-sheet.tsx`
- Modify: `badge-shelf.tsx`, `guest-app-prototype.tsx`
- Test: `rewards-flow.test.tsx`

**Interfaces:**
- Consumes: `BadgeProgress`, `muteBadge`.
- Produces: `BadgeSheet`, `BadgeSheetProps { row: BadgeProgress; onMute: () => void; onClose: () => void }`.

A badge derived from spend is a profile, and an unannounced one reads as
surveillance. The correction affordance lives on the badge itself, not in
settings.

- [x] **Step 1: Write the failing test**

```ts
it('shows the bookings that earned a badge, and lets the guest deny it', async () => {
  const user = userEvent.setup();
  /* … navigate to rewards … */

  await user.click(screen.getByRole('button', { name: /foodie/i }));
  expect(screen.getByText('Azotea Rooftop')).toBeInTheDocument();

  await user.click(screen.getByRole('button', { name: /not right/i }));
  expect(screen.queryByRole('button', { name: /foodie/i })).not.toBeInTheDocument();
});
```

- [x] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/components/features/guest-app/rewards/rewards-flow.test.tsx`
Expected: FAIL — opening a badge does nothing

- [x] **Step 3: Write the minimal implementation**

`BadgeSheet` floats at the 20px radius with a shadow: the 64px medal, the name,
one line of meaning, the evidence list from `row.evidence`, and the mute
control. For an unearned badge it shows what remains and the completing booking
as the primary action. Muting calls `muteBadge` and writes the session, so the
correction survives a reload.

- [x] **Step 4: Run the test to verify it passes**

Run: `npx vitest run src/components/features/guest-app/rewards/rewards-flow.test.tsx`
Expected: PASS

- [x] **Step 5: Verify the repo is clean**

Run: `npm run typecheck && npm run lint`
Expected: exit 0

- [x] **Step 6: Commit**

```bash
git add src/components/features/guest-app/rewards src/components/features/guest-app/guest-app-prototype.tsx
git commit -m "feat: show why a badge was given, and let the guest deny it"
```

---

## Task 7: Reward menu, reward detail, redeem

**Status:** ✅ Complete · **Started:** 2026-09-17 · **Completed:** 2026-09-17 · **Commit:** `e5df5e6`

> Verified: `rewards/` 65/65 · 205 passed across touched files (2 failures remain
> the Task 0 pair) · typecheck and lint exit 0 · **redeem confirmed on screen**,
> balance 38,220 → 22,220 with the menu re-ranking behind it.
>
> The stretch reward is `free-night` at 55,000, not the couples suite — see the
> resolved note below.

> ~~**The "1,900 away" test below cannot pass as written.**~~ *(Resolved: a free
> night at 55,000 was added in `75da13c`, so the assertion now targets it.)* At the real balance of
> 37,220 every reward on the menu is affordable, including the couples suite at
> 32,000, so there is no out-of-reach row to disable. Either drop that
> assertion, or add a genuine stretch reward first — a free night at ~55,000
> points against a ₱9,400 rate is the natural top of a hotel menu and stays
> well under the floor. **Owner's call; raised 2026-09-17.**

**Files:**
- Create: `reward-menu.tsx`
- Modify: `prototype-model.ts`, `guest-app-prototype.tsx`
- Test: `rewards-flow.test.tsx`

**Interfaces:**
- Consumes: `REWARD_MENU`, `affordableRewards`, `redeemReward`, `pointsBalance`.
- Produces: `RewardMenu`, `RewardDetail`, and the `reward-detail` screen case.

- [x] **Step 1: Write the failing test**

```ts
it('redeems a reward, moves the balance, and earns nothing back', async () => {
  const user = userEvent.setup();
  /* … navigate to rewards … */

  await user.click(screen.getByRole('button', { name: /hilom signature massage/i }));
  await user.click(screen.getByRole('button', { name: /redeem/i }));

  expect(screen.getByText('14,100')).toBeInTheDocument();
});

it('disables a reward the balance cannot cover', async () => {
  /* … navigate to rewards … */
  const couples = screen.getByRole('button', { name: /couples massage suite/i });
  expect(couples).toBeDisabled();
  expect(within(couples).getByText(/1,900 away/i)).toBeInTheDocument();
});
```

- [x] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/components/features/guest-app/rewards/rewards-flow.test.tsx`
Expected: FAIL — no reward controls

- [x] **Step 3: Write the minimal implementation**

`RewardMenu` lists `REWARD_MENU` with each item's points, its floor value, and
its cash price where one exists — the gap is the point. Unaffordable rows are
disabled and state the shortfall. `reward-detail` shows one reward and what the
balance would be afterwards; redeeming calls `redeemReward` and returns to the
hub with the ledger updated.

- [x] **Step 4: Run the test to verify it passes**

Run: `npx vitest run src/components/features/guest-app/rewards/rewards-flow.test.tsx`
Expected: PASS

- [x] **Step 5: Verify the repo is clean**

Run: `npm run typecheck && npm run lint && npm test`
Expected: exit 0, full suite green

- [x] **Step 6: Commit**

```bash
git add src/components/features/guest-app/rewards src/components/features/guest-app/prototype-model.ts src/components/features/guest-app/guest-app-prototype.tsx
git commit -m "feat: spend points on inventory rather than on a discount"
```

---

## Task 8: Apply points to a booking, earn on confirmation

**Status:** ✅ Complete · **Started:** 2026-09-17 · **Completed:** 2026-09-17 · **Commit:** `2efa6b8`

> Verified: `rewards/` 71/71 · 211 passed across touched files (2 failures remain
> the Task 0 pair) · typecheck and lint exit 0 · **confirmed on screen** —
> 10,000 points took a ₱2,400 treatment to ₱1,400, and the confirmation earned
> +700 on what was actually paid alongside "You're now Spontaneous".
>
> Booking tests run against `applyPrototypeStayState('live')`, not
> `MOCK_SESSION`: confirming needs a verified room, and the fixture already
> holds the massage so a re-book could earn nothing.

**Files:**
- Create: `points-apply.tsx`
- Modify: `guest-app-prototype.tsx`
- Test: `rewards-flow.test.tsx`

**Interfaces:**
- Consumes: `pointsBalance`, `POINTS_FLOOR_BLOCK`, `badgeProgress`.
- Produces: `PointsApply`, `PointsApplyProps { balance: number; amount: string; applied: number; onChange: (points: number) => void }`.

The floor spends in ₱100 blocks against any booking. The confirmation is where
both earns land — points, and any badge the booking just completed.

- [x] **Step 1: Write the failing test**

```ts
it('applies points in ₱100 blocks and drops the total', async () => {
  /* … open a service booking … */
  await user.click(screen.getByRole('button', { name: /use points/i }));
  expect(screen.getByText(/₱1,400/)).toBeInTheDocument();
});

it('announces a badge the booking completed', async () => {
  /* … book a spa treatment, which is Wellness 3 of 3 … */
  expect(await screen.findByText(/you're now wellness/i)).toBeInTheDocument();
});
```

- [x] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/components/features/guest-app/rewards/rewards-flow.test.tsx`
Expected: FAIL — no points control on the booking screen

- [x] **Step 3: Write the minimal implementation**

`PointsApply` sits on `service-booking` above the total: the balance, a control
stepping in `POINTS_FLOOR_BLOCK` units up to the lesser of the balance and the
booking amount, and the revised total. On `booking-confirmation`, compare
`badgeProgress` before and after: any badge that crossed its threshold gets the
earn moment — medal scaling `0.96 → 1` over 220ms with `Confetti`, and the
consequence stated in the same breath. Reduced motion keeps the fade and drops
the confetti.

- [x] **Step 4: Run the test to verify it passes**

Run: `npx vitest run src/components/features/guest-app/rewards/rewards-flow.test.tsx`
Expected: PASS

- [x] **Step 5: Verify the repo is clean**

Run: `npm run typecheck && npm run lint && npm test`
Expected: exit 0, full suite green

- [x] **Step 6: Commit**

```bash
git add src/components/features/guest-app/rewards src/components/features/guest-app/guest-app-prototype.tsx
git commit -m "feat: spend points at the moment of booking, and award what it earned"
```

---

## Task 9: Folio line, scan earn, OTA counterfactual

**Status:** ✅ Complete · **Started:** 2026-09-17 · **Completed:** 2026-09-17 · **Commit:** `26e9ace`

> Verified: `rewards/` 75/75 · 220 passed across touched files (2 failures remain
> the pre-existing Task 0 pair) · typecheck, lint and **`npm run build`** all
> exit 0 · **all three confirmed on screen**, including the Agoda receipt
> reading "6,860 points instead of 1,960 on the room" and the direct stay
> correctly saying nothing of the kind.

**Files:**
- Modify: `guest-app-prototype.tsx`, `rewards.css`
- Test: `rewards-flow.test.tsx`

**Interfaces:**
- Consumes: `pointsBalance`, `directCounterfactual`, `BEHAVIOUR_POINTS`.
- Produces: no new exports — three integrations into existing screens.

- [x] **Step 1: Write the failing test**

```ts
it('offers points against the folio total', async () => {
  /* … open the folio … */
  expect(screen.getByText(/30,100 points · ₱3,010 off this bill/i)).toBeInTheDocument();
});

it('pays 1,000 points for scanning the room code', async () => {
  /* … complete a scan … */
  expect(await screen.findByText(/\+1,000 points/i)).toBeInTheDocument();
});

it('says what an OTA stay would have earned booked direct', async () => {
  /* … open the Agoda stay's receipt … */
  expect(screen.getByText(/6,860 points instead of 1,960/i)).toBeInTheDocument();
});
```

- [x] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/components/features/guest-app/rewards/rewards-flow.test.tsx`
Expected: FAIL — none of the three lines exist

- [x] **Step 3: Write the minimal implementation**

On `folio`, a row above the inverted total offering the balance against the
bill. On the room-scan success path, `+1,000 points` inside the existing
`RoomUnlocked` success state rather than as a second screen. On `stay-entry`,
for a stay whose `source` is not `Direct booking`, one line from
`directCounterfactual` — stated as fact on a stay already taken, never as a
prompt.

- [x] **Step 4: Run the test to verify it passes**

Run: `npx vitest run src/components/features/guest-app/rewards/rewards-flow.test.tsx`
Expected: PASS

- [x] **Step 5: Verify the repo is clean**

Run: `npm run typecheck && npm run lint && npm run build && npm test`
Expected: exit 0, full suite green, build succeeds

- [x] **Step 6: Commit**

```bash
git add src/components/features/guest-app
git commit -m "feat: put points on the folio, the scan, and the OTA receipt"
```

---

## Decision Log

| Date | Decision | Why | Cost if wrong |
|---|---|---|---|
| 2026-09-17 | Branch `feat/loyalty-rewards` off `main`, not off `experiment/qr-and-explore` | The experiment harness was retired from main by `4257752`; the owner chose direct integration over reviving it | Production screens change without an incubation stage |
| 2026-09-17 | Task 0 added for the red baseline | 72 tests fail on `main` at `f0b53b8`; a plan whose gate is already red teaches its executor to ignore the gate | Loyalty work carries an unrelated fix, or the gate stays meaningless |
| 2026-09-17 | Task 1 lands the fixture fields before either model | Both models read them; splitting the additions across tasks would leave two tasks red for reasons unrelated to their own work | One larger foundation commit |
| 2026-09-17 | Badge sheet, not a badge screen | It floats, so the design system gives it the 20px radius and a shadow | Rework if badges later need deep-linking |
| 2026-09-17 | Explore feed re-ordering excluded | Deferred by the spec to its own document | Badges do less in v1 than the premise implies |

---

## Before marking this plan Approved

- [x] **Spec coverage** — all nine integration points map to tasks; the two spec
      non-goals (feed re-ordering, vendor boosts) are absent by design.
- [x] **Placeholder scan** — no `<...>`, `TBD` or "similar to Task N".
- [x] **Type consistency** — `getRewards`, `pointsBalance`, `badgeProgress`,
      `muteBadge` and `redeemReward` are produced in Tasks 1–3 and consumed under
      the same names in Tasks 5–9.
- [x] **Right-sized tasks** — each ends in an independently reviewable deliverable.
- [x] **Status block filled.**
