# Explore Reels Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

| | |
|---|---|
| **Status** | `In Progress` |
| **Created** | 2026-09-25 |
| **Updated** | 2026-09-25 |
| **Owner** | Kenanaiah Jo |
| **Branch / worktree** | `main` — the owner's standing rule for this prototype is to land verified work on `main` directly (no PRs); each push is confirmed with the owner |
| **Spec** | `docs/superpowers/specs/2026-09-25-explore-reels-design.md` |
| **Ledger** | `.superpowers/sdd/2026-09-25-explore-reels/progress.md` |

**Status values:** `Draft` → `Approved` → `In Progress` → `Complete`.
Off-ramps: `Blocked` (say what unblocks it in Decision Log) · `Abandoned`.

**Goal:** Replace Explore's rail-and-deck page with a stay-aware, full-screen reel feed, keep category browsing and search one tap away, and (phase 2) give the home per-venue story rings.

**Architecture:** A pure ranking model (`feed-model.ts`) scores tagged story candidates against a stay context built from the session and a prototype clock. A vertical scroll-snap `ReelFeed` renders the ranked entries with a `ReelView` per reel; search and browse are sheets over it. Every reel resolves to an explicit `FeedAction` that the prototype maps onto routes it already has.

**Tech Stack:** Next.js 16 (App Router) · React 19 · TypeScript (strict) · Vitest + Testing Library · plain CSS modules-by-file

---

## Progress

| # | Task | Status | Started | Completed | Commit |
|---|---|---|---|---|---|
| 1 | Ranking model (`feed-model.ts`) | ✅ Complete | 2026-09-25 | 2026-09-25 | `a625564` |
| 2 | Feed content: tags, new stories, actions | ✅ Complete | 2026-09-25 | 2026-09-25 | `ed85850` |
| 3 | Reel player: `ReelView` + `ReelFeed` | ✅ Complete | 2026-09-25 | 2026-09-25 | `62d1a4e` |
| 4 | Search and Browse sheets | ✅ Complete | 2026-09-25 | 2026-09-25 | `ee0a93e` |
| 5 | Wire Explore to the feed; prototype clock | ✅ Complete | 2026-09-25 | 2026-09-25 | `5eb3aec` |
| 6 | Verification walkthrough and artifact | ⬜ Not started | — | — | — |
| 7 | Phase 2: home venue rings | ⬜ Not started | — | — | — |

Legend: ⬜ Not started · 🔄 In progress · 🔁 Fix round *R*/5 · ✅ Complete · ⛔ Blocked · ⏭️ Descoped

---

## Global Constraints

Copied from the spec.

- Verification gate: `npm run typecheck && npm run lint && npm run build && npm
  test` passes with fresh output before any task is claimed complete.
- The architecture invariants in `CLAUDE.md` are binding; this work adds no
  HTTP, route handlers or query factories.
- `feed-model.ts` is pure: no React, no browser APIs, no `Date.now()`.
- React Compiler rules are errors: no ref reads or writes during render, no
  `setState` in an effect body.
- No pink: plum, pearl, champagne gold and the neutral ramp only. Guest-facing
  copy says "room" and "room bill", never "folio"; the scan never "checks in"
  a guest.
- Reduced motion: no auto-advance, no video, no parallax.
- Commits to `main` with conventional prefixes and the repo's co-author trailer;
  each push confirmed with the owner.

---

## File Structure

**Create**
- `src/components/features/guest-app/promoted/feed-model.ts` — stay context, candidate types, `rankFeed`.
- `src/components/features/guest-app/promoted/feed-model.test.ts` — ranking failure modes.
- `src/components/features/guest-app/promoted/feed-content.ts` — feed tags per story, the new stories, `buildFeedCandidates`.
- `src/components/features/guest-app/promoted/reel-view.tsx` — one reel.
- `src/components/features/guest-app/promoted/reel-feed.tsx` — the feed, floating bar, end card.
- `src/components/features/guest-app/promoted/feed-sheets.tsx` — Search and Browse sheets.
- `src/components/features/guest-app/promoted/reels.css` — styles for all of the above.
- `src/components/features/guest-app/promoted/venue-rings.tsx` — phase 2 home rings.

**Modify**
- `src/components/features/guest-app/promoted/story-model.ts` — export the story builders the content file needs; add `buildFeedStories()`.
- `src/components/features/guest-app/promoted/index.ts` — export the new modules.
- `src/components/features/guest-app/guest-app-prototype.tsx` — `marketplace` renders `ReelFeed`; `openExploreIntro` targets the feed; feed clock state and toolbar controls; action routing; phase 2 home rings.
- `src/components/features/guest-app/guest-app-prototype.test.tsx`, `promoted/promoted-flow.test.tsx` — rewrite rail/deck/tap-through assertions against the feed.

---

## Task 1: Ranking model

**Files:** create `feed-model.ts`, `feed-model.test.ts`.

**Produces** (exact, consumed by Tasks 2–5):

```ts
export type StayPhase = 'arrival-day' | 'first-night' | 'mid-stay' | 'last-day' | 'checkout-day';
export type Daypart = 'morning' | 'afternoon' | 'evening' | 'late';
export type FeedCategory = 'dining' | 'spa' | 'entertainment' | 'services' | 'gifts' | 'nearby';
export type FeedClock = { dayOfStay: number; hour: number };
export type StayContext = { phase: StayPhase; daypart: Daypart; booked: string[]; partySize: number; hasCompanions: boolean };
export type FeedAction =
  | { kind: 'item'; id: string }            // openExploreItem
  | { kind: 'nearby'; id: string }          // nearby-establishment
  | { kind: 'screen'; screen: 'gifts-souvenirs' }
  | { kind: 'departure-ride' }
  | { kind: 'late-checkout' };
export type FeedTags = { itemId: string; category: FeedCategory; phases?: StayPhase[]; dayparts?: Daypart[]; fits?: 'couple' | 'family' | 'group' | 'solo'; follows?: string[]; whenLabel?: string };
export type FeedCandidate = { story: Story; tags: FeedTags; action: FeedAction };
export type FeedEntry = { story: Story; action: FeedAction; itemId: string; why: string; score: number; tailored: boolean };
export function daypartFor(hour: number): Daypart;
export function phaseFor(dayOfStay: number, nights: number, hour: number): StayPhase;
export function stayContext(input: { nights: number; guestCount: number; companions: number; booked: string[] }, clock: FeedClock): StayContext;
export function rankFeed(context: StayContext, candidates: FeedCandidate[]): FeedEntry[];
```

`stayContext` takes plain numbers, not a session, so the model stays free of the
prototype's session shape; the prototype derives them.

**Failure modes, written before the code** (each becomes a test):
1. A booked item still leads the feed.
2. Two adjacent entries share a venue (`story.author.name`) or a category.
3. The last day does not surface a `last-day` candidate first.
4. An evening does not lead with an `evening` candidate.
5. A `follows` candidate does not rise once its trigger is booked.
6. `why` names a signal that did not match.
7. The tail repeats an entry already shown, or drops a candidate.
8. An empty candidate list throws.
9. Phase/daypart boundaries are off by one (17:59 vs 18:00 on day 1; 04:59 vs 05:00).

- [ ] Write the tests for 1–9 against the produced signatures.
- [ ] Run `npx vitest run src/components/features/guest-app/promoted/feed-model.test.ts` — FAIL (module missing).
- [ ] Implement the model per the spec's ranking rules (weights 3/3/4/2/1, tailored ≥ 3 capped at 12, diversity pull-forward, why from the top-weighted matched signal, tail by score then recency).
- [ ] Tests PASS; `npm run typecheck && npm run lint` clean.
- [ ] Commit `feat: stay-aware feed ranking model`.

## Task 2: Feed content

**Files:** create `feed-content.ts`; modify `story-model.ts`.

**Consumes:** Task 1 types. **Produces:** `buildFeedCandidates(input: { nearby: NearbyStoryInput[] }): FeedCandidate[]`, `nearbyStory(place: NearbyStoryInput): Story`, where `NearbyStoryInput = { id: string; name: string; type: string; distance?: string; image: ServiceImageDefinition }`.

- [ ] Export `restaurantStory`, `serviceStory`, `postingFor`, `framesFor` from `story-model.ts` (no behaviour change), add `buildFeedStories()` returning every live story (no one-per-account dedupe).
- [ ] Tag every existing restaurant and spa/entertainment service: category, phases, dayparts, fits, follows (e.g. `facial` follows `spa`; `rooftop` evening; `cafe` morning; `couples-massage` fits couple).
- [ ] Add stories for the gaps, each with an explicit action: first-night welcome drink (property, `first-night`, evening → `item: poolside-bar`), breakfast (property, morning → `item: cafe`), pasalubong centre (property, `last-day`/`checkout-day` → `screen: gifts-souvenirs`), airport transfer home (`last-day`/`checkout-day` → `departure-ride`), late checkout (`last-day` → `late-checkout`), and nearby partners from the prototype's nearby list (`nearby` → `nearby:<id>`).
- [ ] A content test: every candidate has frames with distinct images and an action; ids are unique.
- [ ] Gate, commit `feat: tagged feed content with explicit actions`.

## Task 3: Reel player

**Files:** create `reel-view.tsx`, `reel-feed.tsx`, `reels.css`.

**Consumes:** `FeedEntry`, `FeedAction`. **Produces:**
`<ReelView entry={FeedEntry} active={boolean} onAction={(entry: FeedEntry) => void} />`,
`<ReelFeed entries={FeedEntry[]} onAction onSearch={() => void} onBrowse={() => void} onSeeEverything={() => void} startIndex?={number} />`.

- [ ] `ReelView`: stills always rendered, optional video only while `active` and not reduced motion; progress segments; left/right tap zones step frames; frames auto-advance every 4 s while active (timer armed by frame index, as `StoryViewer` does, never setState in an effect body); footer with why line, title, author (with the property badge), price and one action button.
- [ ] `ReelFeed`: a full-height `scroll-snap-type: y mandatory` column; an `IntersectionObserver` sets the active index (first reel active when unavailable); floating bar with Search and Browse; an end card after the last entry (Browse categories · See everything).
- [ ] Styles in `reels.css`: full-bleed within the app column, bottom nav stays visible, text over a bottom scrim, no pink.
- [ ] Gate, commit `feat: full-screen reel player and feed`.

## Task 4: Search and Browse sheets

**Files:** create `feed-sheets.tsx`; extend `reels.css`.

**Produces:** `<SearchSheet index={SearchableItem[]} onOpenItem={(id: string) => void} onClose />`, `<BrowseSheet categories={{ id: string; label: string; image: ServiceImageDefinition }[]} onOpen={(id: string) => void} onClose />`.

- [ ] Search: a full-screen sheet with the field, intent suggestions (`AskSuggestions` / `AskAnswer`) and `searchCatalogue` results.
- [ ] Browse: a bottom sheet listing Food & Drinks, Spa & Wellness, Activities & Tours, Hotel Services, Gifts & Souvenirs, Nearby.
- [ ] Gate, commit `feat: search and browse sheets over the feed`.

## Task 5: Wire Explore to the feed; prototype clock

**Files:** modify `guest-app-prototype.tsx`, tests.

- [x] Feed clock state `{ dayOfStay, hour }`, defaulted from the booking and `PROTOTYPE_TODAY` with hour 19; toolbar fieldset "Feed clock" with Stay day (Day 1…N) and Time of day (Morning 8 · Afternoon 14 · Evening 19 · Late 23).
- [x] Derive `stayContext` input from the primary booking and session (nights, guest count, companions, booked non-cancelled service ids); `rankFeed(context, buildFeedCandidates(...))` memoised on those inputs.
- [x] `marketplace` after the scan renders `ReelFeed` + sheets; before the scan, unchanged. `openExploreIntro` goes to `marketplace` with the feed at its first reel (no tap-through viewer).
- [x] `onAction` maps `FeedAction` → `openExploreItem` / nearby-establishment / `go('gifts-souvenirs')` / `openDepartureRide` / `openLateCheckoutChat`. Browse ids → `setSelectedCategory` + `go('category-listing')`, gifts → `gifts-souvenirs`, nearby → `nearby-recommendations`.
- [x] Remove the Explore use of `DiscoverFeed`, `SwipeStoryViewer` and the intro `StoryViewer`; keep the modules if other surfaces still import them, otherwise delete them and their CSS.
- [x] Rewrite the tests that asserted the rail, deck or tap-through against the feed.
- [x] Gate, commit `feat: Explore is a stay-aware reel feed`.

## Task 6: Verification walkthrough

- [ ] In the browser: set the clock to Day 1 · Evening and record the first three reels and their why lines; then Last day · Morning; swipe, step frames, book from a reel, open Browse and Search.
- [ ] Save the screenshots under `.superpowers/sdd/2026-09-25-explore-reels/artifacts/` and record the observed order in the ledger.

## Task 7: Phase 2 — home venue rings

**Files:** create `venue-rings.tsx`; modify `guest-app-prototype.tsx`, `reels.css`, tests.

- [ ] One ring per author with live stories (hotel first, then partners by recency); unseen rings get a gold ring, seen ones go neutral.
- [ ] Tapping a ring opens that venue's stories in the reel player as a modal (`ReelFeed` with a close button, entries limited to that author).
- [ ] Replace the home's "Make the most of your stay" category circles with the rings (after the scan, as today).
- [ ] Gate, commit `feat: per-venue story rings on the home`.

---

## Decision Log

| Date | Decision | Why | Cost if wrong |
|---|---|---|---|
| 2026-09-25 | Execute on `main`, not a worktree | The owner's standing rule for this prototype (commit directly to main, confirm each push) | A bad task lands on main; each task is its own commit and revertible |
| 2026-09-25 | Explicit `FeedAction` per reel instead of deriving from the story id | New reels (pasalubong, transfer home, late checkout, nearby) route to screens that are not catalogue items | Another action kind needs adding to the union and the router |
| 2026-09-25 | `stayContext` takes plain numbers, not a session | Keeps the model pure and independent of the session shape | The prototype does the derivation; one extra function |
| 2026-09-25 | Plan steps carry interfaces and checks, not full code | The same session writes and executes it; the commits hold the code | A later executor has to read the commits for detail |
| 2026-09-25 | Mixing beats strict grouping: a lower reel may sit between two top picks | An evening's top picks can all be dinner; three dinners in a row breaks the no-adjacent rule | The "tailored first" block is not contiguous; `tailored` stays per entry |
| 2026-09-25 | A mid-stay match weighs 2, not 3, and yields to the time of day on a tie | Mid-stay is true all week; at 7 PM dinner should lead over a generic tour | Mid-stay-only content ranks lower; retune the weight |
| 2026-09-25 | Follow-up weight 6, not 4 | With 4, a couples massage (fit + afternoon = 5) out-ranked the facial after a booked massage; a follow-up is the most specific signal | Follow-ups can crowd the top; lower toward 5 |
| 2026-09-25 | Delete `DiscoverFeed`, `SwipeDeck` and `SwipeStoryViewer` | Nothing outside their own tests imported them once Explore moved to the feed; the search test moved to `SearchSheet` | Reinstating the card deck means restoring them from git |
| 2026-09-25 | Feed reels play stills, not the three bundled clips | The clips' baked-in push-in steps in whole pixels and juddered full screen (the welcome-screen fault) | No motion in the feed until smooth footage exists; `ReelView` still supports video |

