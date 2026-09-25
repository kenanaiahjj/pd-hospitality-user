import type { Story } from './story-model';

/*
  What the For you feed shows, and in what order.

  Pure, like `prototype-model.ts`: no React, no browser APIs, no clock. The
  feed is an argument about what this guest might want right now, and the
  argument is made from four things the hotel knows and an OTA does not --
  which day of the stay it is, what time it is, what they have already done,
  and who they are travelling with. Each reel also says which of those won,
  so the ordering explains itself instead of feeling like surveillance.

  A production version puts a service behind `rankFeed`; the prototype keeps
  it deterministic so a demo always answers the same way.
*/

export type StayPhase = 'arrival-day' | 'first-night' | 'mid-stay' | 'last-day' | 'checkout-day';
export type Daypart = 'morning' | 'afternoon' | 'evening' | 'late';
export type FeedCategory = 'dining' | 'spa' | 'entertainment' | 'services' | 'gifts' | 'nearby';

/** The prototype's clock: which day of the stay it is, and the hour. */
export type FeedClock = { dayOfStay: number; hour: number };

export type StayContext = {
  phase: StayPhase;
  daypart: Daypart;
  /** Catalogue ids already booked this stay, cancellations excluded. */
  booked: string[];
  partySize: number;
  hasCompanions: boolean;
};

/** Where a reel's action goes. Not every reel is a catalogue item. */
export type FeedAction =
  | { kind: 'item'; id: string }
  | { kind: 'nearby'; id: string }
  | { kind: 'screen'; screen: 'gifts-souvenirs' }
  | { kind: 'departure-ride' }
  | { kind: 'late-checkout' };

export type FeedTags = {
  /** The catalogue id a booking would carry, for "already booked" and follow-ups. */
  itemId: string;
  category: FeedCategory;
  /** Best on these days of the stay. */
  phases?: StayPhase[];
  /** Best at these times. */
  dayparts?: Daypart[];
  fits?: 'couple' | 'family' | 'group' | 'solo';
  /** Rises as a follow-up once any of these ids is booked. */
  follows?: string[];
  /** Overrides the daypart's why line, e.g. "Tonight · 7:30 PM". */
  whenLabel?: string;
};

export type FeedCandidate = { story: Story; tags: FeedTags; action: FeedAction };

export type FeedEntry = {
  story: Story;
  action: FeedAction;
  itemId: string;
  /** The line over the title: the strongest signal that matched, in the guest's words. */
  why: string;
  score: number;
  /** A top pick for this moment; false for the rest of the catalogue that follows. */
  tailored: boolean;
};

/* --------------------------------------------------------------------------
   The clock
   -------------------------------------------------------------------------- */

/** 05-11 morning, 11-17 afternoon, 17-22 evening, 22-05 late. */
export function daypartFor(hour: number): Daypart {
  const h = ((hour % 24) + 24) % 24;
  if (h >= 5 && h < 11) return 'morning';
  if (h >= 11 && h < 17) return 'afternoon';
  if (h >= 17 && h < 22) return 'evening';
  return 'late';
}

/**
 * Day 1 is the arrival day until 18:00 and the first night after it; the
 * last night is the last day; the day after it is checkout day.
 */
export function phaseFor(dayOfStay: number, nights: number, hour: number): StayPhase {
  if (dayOfStay > nights) return 'checkout-day';
  if (dayOfStay === 1 && nights > 1) return hour < 18 ? 'arrival-day' : 'first-night';
  if (dayOfStay >= nights) return 'last-day';
  return 'mid-stay';
}

export function stayContext(
  input: { nights: number; guestCount: number; companions: number; booked: string[] },
  clock: FeedClock,
): StayContext {
  return {
    phase: phaseFor(clock.dayOfStay, input.nights, clock.hour),
    daypart: daypartFor(clock.hour),
    booked: input.booked,
    partySize: input.guestCount,
    hasCompanions: input.companions > 0,
  };
}

/* --------------------------------------------------------------------------
   Scoring
   -------------------------------------------------------------------------- */

const WEIGHT = { follow: 4, phase: 3, daypart: 3, fit: 2, property: 1 } as const;
/** A reel scoring this or more is a top pick for the moment. */
const TAILORED_MIN = 3;
const TAILORED_CAP = 12;

const PHASE_WHY: Record<StayPhase, string> = {
  'arrival-day': 'You’ve just arrived',
  'first-night': 'Your first night',
  'mid-stay': 'Made for today',
  'last-day': 'Before you fly home',
  'checkout-day': 'Before you check out',
};
const DAYPART_WHY: Record<Daypart, string> = {
  morning: 'This morning',
  afternoon: 'This afternoon',
  evening: 'Tonight',
  late: 'Still open late',
};
const FIT_WHY = { couple: 'For two', family: 'For the family', group: 'For the group', solo: 'Just for you' } as const;

function fits(tag: FeedTags['fits'], context: StayContext): boolean {
  if (!tag) return false;
  if (tag === 'solo') return context.partySize === 1;
  if (tag === 'couple') return context.partySize === 2;
  if (tag === 'family') return context.partySize >= 3 && context.hasCompanions;
  return context.partySize >= 4;
}

type Scored = { candidate: FeedCandidate; score: number; why: string; priority: number; booked: boolean };

function score(candidate: FeedCandidate, context: StayContext, titleOf: (id: string) => string | undefined): Scored {
  const { tags, story } = candidate;
  const booked = context.booked.includes(tags.itemId);
  const trigger = tags.follows?.find((id) => context.booked.includes(id));
  const matched: { weight: number; why: string; priority: number }[] = [];

  if (trigger) matched.push({ weight: WEIGHT.follow, why: `Goes well with your ${(titleOf(trigger) ?? 'booking').toLowerCase()}`, priority: 5 });
  /* Mid-stay is true all week, so it is the weakest day signal: at 7 PM the
     timely dinner should beat the generic "made for today" tour. */
  if (tags.phases?.includes(context.phase)) {
    matched.push({ weight: context.phase === 'mid-stay' ? WEIGHT.phase - 1 : WEIGHT.phase, why: PHASE_WHY[context.phase], priority: context.phase === 'mid-stay' ? 2.5 : 4 });
  }
  if (tags.dayparts?.includes(context.daypart)) matched.push({ weight: WEIGHT.daypart, why: tags.whenLabel ?? DAYPART_WHY[context.daypart], priority: 3 });
  if (fits(tags.fits, context)) matched.push({ weight: WEIGHT.fit, why: FIT_WHY[tags.fits!], priority: 2 });
  if (story.author.kind === 'property' && (context.phase === 'arrival-day' || context.phase === 'first-night')) {
    matched.push({ weight: WEIGHT.property, why: 'From the hotel', priority: 1 });
  }

  const total = matched.reduce((sum, signal) => sum + signal.weight, 0);
  const lead = [...matched].sort((a, b) => b.priority - a.priority)[0];
  const fallback = tags.category === 'nearby' ? 'A partner nearby' : story.author.kind === 'property' ? 'From the hotel' : `From ${story.author.name}`;

  return {
    candidate,
    score: booked ? 0 : total,
    why: booked ? 'You’ve booked this' : lead?.why ?? fallback,
    priority: booked ? -1 : lead?.priority ?? 0,
    booked,
  };
}

/** Higher score first; on a tie, the stronger kind of reason; then the newer post. */
const byRelevance = (a: Scored, b: Scored) =>
  b.score - a.score || b.priority - a.priority || a.candidate.story.postedHoursAgo - b.candidate.story.postedHoursAgo;

/**
 * No two neighbours from one venue or one category: the best remaining reel
 * that differs from the last one comes next. Only when nothing differs does
 * a repeat go through, which in practice is the very end of the feed.
 */
function spread(ordered: Scored[]): Scored[] {
  const pool = [...ordered];
  const out: Scored[] = [];
  while (pool.length) {
    const last = out[out.length - 1];
    const index = last
      ? pool.findIndex((next) => next.candidate.story.author.name !== last.candidate.story.author.name
        && next.candidate.tags.category !== last.candidate.tags.category)
      : 0;
    out.push(pool.splice(index === -1 ? 0 : index, 1)[0]!);
  }
  return out;
}

/**
 * The feed: top picks for this moment, then the rest of the catalogue in
 * falling relevance, with anything already booked at the very end.
 *
 * Mixing wins over strict grouping: an evening can have three dinners as its
 * top picks, and three dinners in a row is a worse feed than a dinner, a spa
 * and a dinner -- so a lower-scoring reel may sit between two top picks.
 */
export function rankFeed(context: StayContext, candidates: FeedCandidate[]): FeedEntry[] {
  if (!candidates.length) return [];
  const titleOf = (id: string) => candidates.find((entry) => entry.tags.itemId === id)?.story.title;
  const scored = candidates.map((candidate) => score(candidate, context, titleOf));

  const open = scored.filter((entry) => !entry.booked).sort(byRelevance);
  const done = scored.filter((entry) => entry.booked).sort(byRelevance);
  const topIds = new Set(open.filter((entry) => entry.score >= TAILORED_MIN).slice(0, TAILORED_CAP).map((entry) => entry.candidate.story.id));

  return [...spread(open), ...done].map((entry) => ({
    story: entry.candidate.story,
    action: entry.candidate.action,
    itemId: entry.candidate.tags.itemId,
    why: entry.why,
    score: entry.score,
    tailored: topIds.has(entry.candidate.story.id),
  }));
}
