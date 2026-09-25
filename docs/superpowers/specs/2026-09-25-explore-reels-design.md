# Explore Reels Design

> Produced by `superpowers:brainstorming` (architectural path). Once this
> document is `Approved`, the only next skill is `superpowers:writing-plans`.
> File naming: `docs/superpowers/specs/YYYY-MM-DD-<topic>-design.md`.

| | |
|---|---|
| **Status** | `Approved` |
| **Created** | 2026-09-25 |
| **Updated** | 2026-09-25 |
| **Owner** | Kenanaiah Jo |
| **Plan** | `docs/superpowers/plans/2026-09-25-explore-reels.md` (once written) |
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

Explore stops being a page of rails, decks and category cards and becomes
**For you**: a full-screen, vertically scrolling feed of reels, ordered by what
fits this guest right now — the day of their stay, the time of day, what they
have already done and who they are travelling with. Category browsing and search
stay one tap away in a floating bar over the feed, and every existing category,
nearby and booking screen is kept. A second phase gives the home screen
per-venue story rings that play in the same reel player.

## Context

Explore today (`activeScreen === 'marketplace'`, after the room scan) renders
`DiscoverFeed` (`src/components/features/guest-app/promoted/discover-feed.tsx`):
a story rail, a featured swipe deck (`swipe-deck.tsx`), banners and category
cards. Opening a story plays it in `StoryViewer` (`story-viewer.tsx`), a
tap-to-advance viewer; after the room scan, "Start exploring"
(`openExploreIntro` in `guest-app-prototype.tsx`) auto-plays the first story in
that viewer, and other stories open in `SwipeStoryViewer`.

The content model is already rich (`promoted/story-model.ts`): `Story` carries
`slides` (2–3 frames, each an image with an optional `video`), an `author`
(`kind: 'property' | 'venue'`), `price`, `cta`, and a posting window
(`postedHoursAgo`, `livesForHours`). `buildStories()` builds one story per
account from `RESTAURANTS` and the spa/entertainment `SERVICES`.
`buildSearchIndex()` + `searchCatalogue()` search everything bookable, and
`intent-model.ts` answers situations ("somewhere for dinner tonight", "it's
raining"). None of it knows anything about the guest's stay: order is newest
post first.

The home screen's "Make the most of your stay" rail (`HomeStoryRail`,
`HOME_CATEGORY_STORIES`) shows one circle per category, each opening a single
category story in `StoryViewer`. The owner finds the home thin, and wants
real per-venue stories there instead.

The pre-scan gate stays as it is: before the room scan, Explore
(`bookingSlot.locked`) renders the arrival-services list.

## Non-goals

- **No change to the pre-scan gate.** Before the scan, Explore is still the
  arrival-services list; the reels appear only after the scan.
- **No change to the category, nearby, venue, gifts or booking screens.**
  `category-listing`, `nearby-recommendations`, `nearby-establishment`,
  `gifts-souvenirs`, `restaurant-menu`, `service-booking` and the checkout flows
  are reached from the feed exactly as they are today.
- **No real recommendation service or model.** Ranking is a deterministic,
  pure function over fixtures, so the demo always answers the same way. A
  production version would put a service behind the same interface.
- **No real clock.** Time of day and stay day come from prototype state, not
  `Date.now()`, so prerender and hydration agree and a demo can move time.
- **No user-generated content, likes, comments or follows.**
- **No new video assets.** Frames reuse the existing image set; `video` stays
  optional per frame, exactly as today.
- **No payments or promoted-slot billing.** `author.kind` already separates the
  property from partner venues; charging for placement is a later spec.

## Success criteria

- [ ] After the room scan, the Explore tab opens on full-screen reels that snap
      one per screen on vertical swipe; "Start exploring" lands on the first
      reel of the same feed.
- [ ] Inside a reel, a tap on the right/left third steps its frames forward/
      back, frames auto-advance while the reel is on screen, and progress
      segments show which frame is current; reduced motion shows the first
      frame only and never auto-advances.
- [ ] Each reel shows a "why" line, the title, the author (hotel or partner),
      the price and one action; the action opens the same screen the current
      story's Book action opens.
- [ ] The first reels change when the prototype's stay day or time of day
      changes: an evening on the first night leads with dinner; the last day
      leads with pasalubong and the airport transfer; a booked service's reel
      is replaced by its follow-up.
- [ ] Two reels from the same venue, or the same category, are never adjacent.
- [ ] After the tailored reels the feed continues through the rest of the
      catalogue in falling relevance and ends on a card offering "Browse
      categories" and "See everything".
- [ ] The floating bar's Search opens catalogue search and intents; Browse
      opens a sheet of categories that lands on the existing category screens.
- [ ] Before the scan, Explore is the arrival-services list (unchanged).
- [ ] Phase 2: home shows one ring per venue with live stories; tapping a ring
      plays that venue's stories in the reel player.
- [ ] `npm run typecheck && npm run lint && npm run build && npm test` passes.

---

## Approaches considered

### Recommended: one reel player, a pure ranking model, content as data

A single `ReelFeed` component renders a vertically snapping list of `ReelView`s.
What to show and in what order comes from `rankFeed(context, candidates)` — a
pure function in a new `feed-model.ts` — over a candidate list built from the
existing `Story` data plus new stay-context tags. The same player plays a
venue's stories on the home screen in phase 2.

**Why:** the ordering logic is the part that must be right and demonstrable, and
as a pure function it is testable in isolation and swappable for a service
later. Reusing `Story` keeps every existing content decision (frames, authors,
posting windows) and every booking route. One player means one set of
gestures across the app.
**Costs:** candidates need new tags (`phases`, `dayparts`, `fits`, `follows`) —
handwritten per story, like `STORY_FRAMES` is today.

### Alternative: extend `SwipeStoryViewer` into the feed

Turn the existing horizontal swipe viewer vertical and keep its state.
**Rejected because:** it is built around tap-to-advance between stories, the
exact behaviour being replaced, and it has no notion of order beyond the input
array; bending it would keep the old model's assumptions in the new surface.

### Alternative: rules embedded in the component

Sort stories inline in the feed with a handful of `if`s on the hour and day.
**Rejected because:** the rules are the product here; buried in a component
they cannot be tested, explained ("why this") or replaced by a service.

---

## Design

### Architecture

Everything lives in `src/components/features/guest-app/`, alongside the
existing promoted flow. It is prototype UI over fixtures: no HTTP, no route
handlers, so the `lib/api` / `lib/queries` invariants in `CLAUDE.md` are not
engaged. The ranking model is pure (no React, no browser APIs), matching the
contract `prototype-model.ts` already holds.

```
guest-app-prototype.tsx  (screen 'marketplace', after the scan)
  └─ ReelFeed ──────────────── rankFeed(StayContext, candidates) ─► FeedEntry[]
       ├─ FeedBar (Search · Browse)      feed-model.ts (pure)
       ├─ ReelView × n  (frames, why, action)      ▲
       └─ FeedEndCard                               │
                                        buildCandidates() ◄── story-model.ts (Story + tags)
                                        stayContext(session, clock) ◄── prototype-model.ts
```

### Components

**`src/components/features/guest-app/promoted/feed-model.ts`** (new, pure)
- **Does:** builds the stay context and ranks candidates into the feed order,
  each with the reason it was chosen.
- **Used as:** `stayContext`, `buildCandidates`, `rankFeed` (signatures below).
- **Depends on:** `Story` from `story-model.ts`; `Booking`, `GuestSession`,
  `ServiceBooking` types and `countNightsBetween` from `prototype-model.ts`.

**`src/components/features/guest-app/promoted/story-model.ts`** (extended)
- **Does:** adds context tags to stories and the new stories the feed needs
  (first-night welcome, breakfast, pasalubong centre, airport transfer home,
  late checkout, nearby partners).
- **Used as:** `buildStories()` unchanged for callers; new `buildFeedStories()`
  returns every live story, not one per account (the feed wants all of them).
- **Depends on:** `RESTAURANTS`, `SERVICES` (`prototype-model.ts`) and `NEARBY_PLACES` (`promoted/nearby-model.ts`), all already exported.

**`src/components/features/guest-app/promoted/reel-feed.tsx`** (new)
- **Does:** the For you screen: a vertical `scroll-snap` list of reels, the
  floating bar, the end card; tracks which reel is on screen.
- **Used as:** `<ReelFeed entries onAction onSearch onBrowse onSeeEverything />`.
- **Depends on:** `ReelView`, `FeedBar`, `FeedEndCard`; `IntersectionObserver`.

**`src/components/features/guest-app/promoted/reel-view.tsx`** (new)
- **Does:** one reel: frames with progress segments, tap-to-step, auto-advance
  while active, video that plays only while active, the why line, title,
  author, price and action.
- **Used as:** `<ReelView entry active onAction />`.
- **Depends on:** `usePrefersReducedMotion`; `next/image`.

**`src/components/features/guest-app/promoted/feed-sheets.tsx`** (new)
- **Does:** the Search sheet (catalogue search + intents, reusing
  `searchCatalogue`, `matchIntent`, `AskSuggestions`/`AskAnswer`) and the Browse
  sheet (categories, including Nearby and Gifts).
- **Used as:** `<SearchSheet …/>`, `<BrowseSheet …/>`.

**`src/components/features/guest-app/guest-app-prototype.tsx`** (changed)
- `marketplace` renders `ReelFeed` after the scan (arrival services before it,
  unchanged). `openExploreIntro` goes to the feed's first reel instead of the
  tap-through viewer. `DiscoverFeed`, `SwipeStoryViewer` and the Explore use
  of `StoryViewer` are removed from this screen. The prototype toolbar gains
  **Time of day** and **Stay day** controls that set the feed clock.

**Phase 2 — `src/components/features/guest-app/promoted/venue-rings.tsx`** (new)
- **Does:** the home's "Make the most of your stay" becomes one ring per venue
  with live stories; a ring opens that venue's stories in `ReelFeed` as a
  modal player.
- **Used as:** `<VenueRings stories onOpen />`.

### Data flow

```
Guest taps Explore (scanned in)
  → guest-app-prototype: stayContext(session, feedClock)
  → buildCandidates(buildFeedStories(), session)
  → rankFeed(context, candidates)          // tailored first, then the rest
  → <ReelFeed entries={…}>
      reel on screen → ReelView active → frames advance, video plays
      tap action     → onAction(entry)    → openExploreItem(itemId)  (existing route)
      Browse         → BrowseSheet        → setSelectedCategory + go('category-listing')
      Search         → SearchSheet        → openExploreItem / intent answer
```

### Interfaces and contracts

```ts
// feed-model.ts
export type StayPhase = 'arrival-day' | 'first-night' | 'mid-stay' | 'last-day' | 'checkout-day';
export type Daypart = 'morning' | 'afternoon' | 'evening' | 'late';

export type StayContext = {
  phase: StayPhase;
  daypart: Daypart;
  /** Catalogue ids already booked this stay (not cancelled). */
  booked: string[];
  partySize: number;
  hasCompanions: boolean;
};

/** Prototype clock: the day within the stay and the hour, set by the toolbar. */
export type FeedClock = { dayOfStay: number; hour: number };

export function stayContext(session: GuestSession, booking: Booking, clock: FeedClock): StayContext;

export type FeedTags = {
  phases?: StayPhase[];     // best on these days
  dayparts?: Daypart[];     // best at these times
  fits?: 'couple' | 'family' | 'group' | 'solo';
  /** Shown as a follow-up once any of these ids is booked. */
  follows?: string[];
  /** The reel stops being relevant once this id is booked. */
  itemId: string;
  category: 'dining' | 'spa' | 'entertainment' | 'services' | 'gifts' | 'nearby';
};

export type FeedCandidate = { story: Story; tags: FeedTags };

export type FeedEntry = {
  story: Story;
  itemId: string;
  /** The line over the title: the strongest signal, in the guest's words. */
  why: string;
  score: number;
  /** false once the tailored set is exhausted and the tail begins. */
  tailored: boolean;
};

export function buildCandidates(stories: Story[], session: GuestSession): FeedCandidate[];
export function rankFeed(context: StayContext, candidates: FeedCandidate[]): FeedEntry[];
```

**Ranking rules** (the behaviour tests pin):

- Score = phase match (3) + daypart match (3) + follow-up of a booked id (4) +
  party fit (2) + property-authored on arrival day / first night (1).
- A candidate whose `itemId` is booked is dropped from the tailored set and
  kept in the tail.
- Diversity: after sorting, no two adjacent entries share `story.author.name`
  or `tags.category`; the next best eligible entry is pulled forward.
- `tailored` is true for entries scoring ≥ 3, capped at 12; everything else
  follows in falling score, then newest post.
- `why` comes from the highest-weighted signal that matched: follow-up
  ("Goes well with your massage"), phase ("Your first night", "Before you fly
  home"), daypart ("Tonight · 7:30 PM", "This morning"), fit ("For two"), or,
  in the tail, the author's kind ("From the hotel", "A partner nearby").

**Phase mapping** (`stayContext`): day 1 before 18:00 → `arrival-day`; day 1
from 18:00 → `first-night`; the last night → `last-day`; the checkout date →
`checkout-day`; otherwise `mid-stay`. **Dayparts:** 05–11 morning, 11–17
afternoon, 17–22 evening, 22–05 late.

### Error handling

Client-only, over fixtures; failures are presentational.

| Failure | Handling |
|---|---|
| A frame's video fails or autoplay is refused | the frame's still shows (as `Story` already guarantees) |
| Reduced motion | first frame only, no auto-advance, no video |
| No candidates at all | the end card alone, with Browse and Search |
| `IntersectionObserver` missing (jsdom) | the first reel is treated as active |

### Testing

Per `AGENTS.md`: failure modes are written down before the code, E2E is the
preferred proof, and the unit suite is kept green cheaply (the prototype rule).

- **`feed-model` (isolated, failure modes first):** a booked item leading the
  feed; two adjacent reels from one venue; the last day not surfacing
  pasalubong; evening not leading with dining; a follow-up not appearing after
  its trigger is booked; `why` naming a signal that did not match; the tail
  repeating tailored entries; an empty candidate list throwing.
- **Browser walkthrough (the E2E proof, repeatable):** with the toolbar set to
  first night · evening, then last day · morning, record the first three reels
  and their why lines; swipe, step frames, book from a reel, open Browse and
  Search. Save the screenshots as the verification artifact.
- **Existing tests** that assert the rail, the swipe deck or the tap-through
  intro are rewritten against the feed, not deleted blind.

---

## Global Constraints

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

## Open questions

- [x] Feed format — full-screen snapping reels.
- [x] Frames — kept, tap sideways within a reel.
- [x] Signals — all four: stay day, time of day, history, party.
- [x] Browse/search — floating bar over the feed.
- [x] Pre-scan — gate unchanged.
- [x] Why line — shown.
- [x] Feed end — continue in falling relevance, then an end card.
- [x] Home — per-venue rings, phase 2.

## Decision Log

| Date | Decision | Why | Cost if wrong |
|---|---|---|---|
| 2026-09-25 | Full-screen snapping reels, frames within | Owner's pick; most immersive, matches "story after story" | Rework the feed layout to cards; the model is unaffected |
| 2026-09-25 | Pure `rankFeed` over tagged fixtures | The rules are the product; testable and swappable for a service | Tags are handwritten; a service would replace them |
| 2026-09-25 | Pre-scan gate kept | Owner's call; services stay behind the scan | None: a later spec can open reels before the scan |
| 2026-09-25 | Prototype clock in the toolbar | Demos must show morning vs evening and first vs last day | None beyond the toolbar controls |
| 2026-09-25 | Home venue rings deferred to phase 2 | They reuse the player and content built in phase 1 | Home stays thin until phase 2 lands |
