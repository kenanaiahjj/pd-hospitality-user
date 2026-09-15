import { MINI_APP_CATEGORIES, RESTAURANTS, SERVICES } from '../prototype-model';
import type { MiniAppCategoryId } from '../prototype-model';
import type { ServiceImageDefinition } from '../service-images';
import { storyImage } from './story-imagery';
import { venueForService } from './service-venues';

/*
  Curated stories, built from the same catalogue the guest app sells from.

  Pure -- no React, no browser API -- for the same reason `prototype-model` is:
  a promoted flow should be able to derive these on a server, and a pure
  builder is testable without rendering anything.

  The premise is that a guest mid-stay scrolls the way they scroll everywhere
  else, so what is on offer arrives as something to watch rather than a list
  to read. Every slide still resolves to one bookable thing -- the format is
  editorial, the inventory is not.
*/

export type StorySlide = {
  /** Display headline. Short: it sits over an image at 30px+. */
  headline: string;
  /** One supporting line. Absent where the headline carries it alone. */
  detail?: string;
  image: ServiceImageDefinition;
};

/** Who published a story. A story is a post, so it is signed. */
export type StoryAuthor = {
  /** The account name, as it would sign a post. */
  name: string;
  /**
   * `property` is the hotel posting in its own voice; `venue` is a tenant or
   * partner posting in theirs. The guest should be able to tell which, and
   * the two are worth different money in a promoted slot.
   */
  kind: 'property' | 'venue';
  /** The account's face, not the post's cover -- they are different pictures. */
  image: ServiceImageDefinition;
};

export type Story = {
  id: string;
  /** The venue or service this belongs to, as the guest would name it. */
  title: string;
  /** Where on property, or who runs it. */
  subtitle: string;
  /** What booking it costs, verbatim from the catalogue. */
  price: string;
  /** The label on the story's own action. */
  cta: string;
  cover: ServiceImageDefinition;
  slides: StorySlide[];
  author: StoryAuthor;
  /**
   * Hours since publication, fixed rather than read off a clock.
   *
   * A prerendered page and its hydration have to agree on what "2h" means,
   * and `Date.now()` on a server and in a browser do not. A promoted flow
   * carries real timestamps and passes the difference through the same
   * formatter.
   */
  postedHoursAgo: number;
  /** How long the post stands before it stops being one. */
  livesForHours: number;
};

/** A post that has outlived its window is not shown. */
export const storyIsLive = (story: Story): boolean =>
  story.postedHoursAgo < story.livesForHours;

export const storyHoursRemaining = (story: Story): number =>
  Math.max(0, story.livesForHours - story.postedHoursAgo);

/** "Just now", "2h", "3d" -- the vocabulary every feed already uses. */
export function formatPostedAgo(hoursAgo: number): string {
  if (hoursAgo < 1) return 'Just now';
  if (hoursAgo < 24) return `${Math.floor(hoursAgo)}h`;
  return `${Math.floor(hoursAgo / 24)}d`;
}

/**
 * Only surfaced near the end.
 *
 * A countdown on a post with twenty hours left is pressure the guest has no
 * use for; one with two hours left is the reason to read it now. Six hours
 * is the point where it becomes information rather than decoration.
 */
export const STORY_URGENT_HOURS = 6;

export function storyExpiryLabel(story: Story): string | undefined {
  const left = storyHoursRemaining(story);
  if (left <= 0 || left > STORY_URGENT_HOURS) return undefined;
  return left <= 1 ? 'Ends within the hour' : `Ends in ${Math.floor(left)}h`;
}

/*
  When each post went up, in hours before the prototype's "now".

  Handwritten so the rail demonstrates the mechanic rather than describing it:
  something minutes old, something about to lapse, and one already past its
  window that the builder drops.
*/
const POSTED_HOURS_AGO: Record<string, number> = {
  'poolside-bar': 0.4,
  rooftop: 2,
  dining: 3,
  spa: 5,
  facial: 6,
  'apartment-1b': 9,
  scrub: 11,
  'hot-stone': 14,
  'couples-massage': 17,
  reflexology: 4,
  barber: 8,
  'mani-pedi': 10,
  diving: 12,
  'museum-pass': 15,
  'heritage-walk': 18,
  tour: 19,
  cafe: 21,
  'food-crawl': 22.5,
  'sunset-cruise': 30,
};

/*
  Deliberately all different. Four posts sharing one default timestamp is the
  tell that nobody wrote them -- a feed where half the rail says "7h" reads as
  generated, which is the opposite of what the timestamps are here to prove.
*/
const DEFAULT_POSTED_HOURS_AGO = 7;
const STORY_LIFETIME_HOURS = 24;

const postingFor = (id: string) => ({
  postedHoursAgo: POSTED_HOURS_AGO[id] ?? DEFAULT_POSTED_HOURS_AGO,
  livesForHours: STORY_LIFETIME_HOURS,
});

/** Hotel-run operators post as the property; everyone else posts as a venue. */
const authorKind = (operator: string): StoryAuthor['kind'] =>
  operator.startsWith('Hotel') ? 'property' : 'venue';

const restaurantStory = (venue: (typeof RESTAURANTS)[number]): Story => {
  const image = storyImage(venue.id);
  return {
    id: `venue-${venue.id}`,
    title: venue.name,
    subtitle: venue.location,
    price: venue.priceRange,
    cta: 'See the menu',
    cover: image,
    slides: [
      { headline: venue.category.toUpperCase(), detail: venue.description, image },
      { headline: 'OPEN TODAY', detail: venue.hours, image },
      { headline: venue.priceRange.toUpperCase(), detail: venue.cutoff, image },
    ],
    author: { name: venue.name, kind: authorKind(venue.operator), image },
    ...postingFor(venue.id),
  };
};

const serviceStory = (service: (typeof SERVICES)[number]): Story => {
  const image = storyImage(service.id);
  const house = venueForService(service.id);
  return {
    id: `service-${service.id}`,
    title: service.name,
    subtitle: house.location,
    price: service.price,
    cta: 'Book a time',
    cover: image,
    slides: [
      { headline: service.category.toUpperCase(), detail: service.name, image },
      { headline: service.price.toUpperCase(), detail: service.cutoff, image },
    ],
    /*
      The venue, not the treatment. "Hilom signature massage" is a thing the
      spa sells; the spa is the thing that can post. `subtitle` follows it --
      a post is located where its author is.
    */
    author: { name: house.name, kind: house.kind, image: house.image },
    ...postingFor(service.id),
  };
};

/**
 * The rail: live posts, newest first.
 *
 * It used to lead with dining on the argument that eating is the decision a
 * guest is actually making. That was an editorial ordering, and these are
 * posts -- a feed of posts sorts by recency, which is the whole reason the
 * venue gets anything out of publishing one. The editorial argument still
 * exists; it moved to the featured deck, where it belongs.
 *
 * Expired posts are dropped here rather than dimmed, so a venue that stops
 * publishing quietly leaves the rail. That is the pressure that makes the
 * merchant side turn over on its own.
 */
export function buildStories(): Story[] {
  const venues = RESTAURANTS.slice(0, 4).map(restaurantStory);
  /*
    No `.slice(0, 4)` here any more.

    Slicing the filtered list took the first four services, which were four
    spa treatments -- fine when each was its own ring, useless once they all
    resolve to one spa. The account dedupe below is the real limit, and it
    limits by account rather than by position, so the rail spans the tour
    desks and the beauty bar instead of stopping inside the spa.
  */
  const services = SERVICES
    .filter((service) => service.categoryId === 'spa' || service.categoryId === 'entertainment')
    .map(serviceStory);

  const live = [...venues, ...services]
    .filter(storyIsLive)
    .sort((a, b) => a.postedHoursAgo - b.postedHoursAgo);

  /*
    One ring per account, newest post first.

    Five spa treatments are five posts by one spa, and a rail showing "Hilom
    Spa & Wellness" five times is not what a story rail looks like anywhere
    a guest has ever used one -- an account gets one ring, however much it
    has published.
  */
  const seen = new Set<string>();
  return live.filter((story) => {
    if (seen.has(story.author.name)) return false;
    seen.add(story.author.name);
    return true;
  });
}

/**
 * One searchable thing. Everything a guest can book, flattened.
 *
 * Search reaches past the curation deliberately: the rail and the banners are
 * an argument about what to do tonight, and a guest who already knows they
 * want a massage should not have to scroll an argument to find one.
 */
export type SearchableItem = {
  id: string;
  title: string;
  /** What it is, in the guest's words. Matched on, and shown under the title. */
  category: string;
  price: string;
  /** Who runs it, or where it is. */
  detail: string;
  image: ServiceImageDefinition;
};

export function buildSearchIndex(): SearchableItem[] {
  return [
    ...RESTAURANTS.map((venue) => ({
      id: venue.id,
      title: venue.name,
      category: venue.category,
      price: venue.priceRange,
      detail: venue.location,
      image: storyImage(venue.id),
    })),
    ...SERVICES.map((service) => ({
      id: service.id,
      title: service.name,
      category: service.category,
      price: service.price,
      detail: service.operator,
      image: storyImage(service.id),
    })),
  ];
}

/** Case- and accent-insensitive contains, over the fields a guest would type. */
export function searchCatalogue(index: SearchableItem[], query: string): SearchableItem[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return [];

  return index.filter((item) =>
    item.title.toLowerCase().includes(needle)
    || item.category.toLowerCase().includes(needle)
    || item.detail.toLowerCase().includes(needle));
}

/**
 * A category, as something to tap rather than a row to read.
 *
 * Counted from the catalogue rather than written down, so a card can never
 * promise eleven things and open onto four.
 */
export type CategoryCard = {
  id: MiniAppCategoryId;
  /** Uppercased at the type level, not in CSS -- screen readers read the
      text, and shouting is a design decision, not a data one. */
  title: string;
  subtitle: string;
  count: number;
  image: ServiceImageDefinition;
  tone: 'ember' | 'bloom' | 'dusk' | 'tide';
};

const CATEGORY_TONES: Record<string, CategoryCard['tone']> = {
  dining: 'ember',
  spa: 'bloom',
  entertainment: 'dusk',
  services: 'tide',
};

/** The image that best says what a category is, at a glance. */
const CATEGORY_FACE: Record<string, string> = {
  dining: 'rooftop',
  spa: 'spa',
  entertainment: 'food-crawl',
  services: 'tour',
};

export function buildCategoryCards(): CategoryCard[] {
  return MINI_APP_CATEGORIES.map((category) => ({
    id: category.id,
    title: category.title,
    subtitle: category.subtitle,
    count: category.id === 'dining'
      ? RESTAURANTS.length + SERVICES.filter((s) => s.categoryId === 'dining').length
      : SERVICES.filter((s) => s.categoryId === category.id).length,
    image: storyImage(CATEGORY_FACE[category.id] ?? 'spa'),
    tone: CATEGORY_TONES[category.id] ?? 'bloom',
  }));
}

/**
 * Why a featured card is in front of this guest.
 *
 * Featured without a stated reason is indistinguishable from a shuffle, and
 * a guest who cannot tell the difference is right not to trust it. Each kind
 * also answers to someone different: `hotel-pick` is the property's
 * editorial voice, `stay-context` is the app reasoning about this stay, and
 * `popular` is the catalogue reporting on itself. Only the first is
 * sellable, which is exactly why it has to be labelled as a pick.
 */
export type FeaturedReason = {
  kind: 'hotel-pick' | 'stay-context' | 'popular';
  /** Shown verbatim on the card. Short: it sits above the title. */
  label: string;
};

/**
 * One card in the featured deck.
 *
 * Its own type rather than a `SearchableItem`, which is what it used to be.
 * Reusing the search row meant the deck was the catalogue in a different
 * shape -- no curator, no reason, nothing a guest could tell apart from
 * search results that happened to be stacked.
 */
export type FeaturedCard = {
  id: string;
  title: string;
  category: string;
  price: string;
  /** Who runs it, or where it is. */
  detail: string;
  image: ServiceImageDefinition;
  reason: FeaturedReason;
};

/*
  Written per service, not generated.

  A reason that could apply to anything ("Recommended for you") is the same
  as no reason. These name something true about the specific thing.
*/
const FEATURED_REASONS: Record<string, FeaturedReason> = {
  spa: { kind: 'popular', label: 'Most booked this week' },
  rooftop: { kind: 'stay-context', label: 'Open late on your last night' },
  'food-crawl': { kind: 'hotel-pick', label: 'Picked by the hotel' },
  'sunset-cruise': { kind: 'stay-context', label: 'Tomorrow, before checkout' },
  'hot-stone': { kind: 'popular', label: 'Books out by Friday' },
  'heritage-walk': { kind: 'hotel-pick', label: 'Picked by the hotel' },
  'couples-massage': { kind: 'hotel-pick', label: 'Picked by the hotel' },
  facial: { kind: 'popular', label: 'Most booked this week' },
  tour: { kind: 'stay-context', label: 'A half day from your room' },
};

const DEFAULT_REASON: FeaturedReason = { kind: 'hotel-pick', label: 'Picked by the hotel' };

/**
 * The featured deck: things to do, not places to eat.
 *
 * Dining is excluded on purpose. A restaurant is a decision a guest makes
 * against a time and a hunger, and asking them to rule one in or out at
 * random is noise. An experience is exactly the kind of thing nobody knows
 * they want until they see it, which is the only case where a deck beats a
 * list.
 */
export function buildFeaturedDeck(): FeaturedCard[] {
  return SERVICES
    .filter((service) => service.categoryId !== 'dining')
    .map((service) => ({
      id: service.id,
      title: service.name,
      category: service.category,
      price: service.price,
      /* The account that runs it. "Third-party on property" is a contract
         term the guest has no use for; "Lakbay Island Tours" is a name they
         can decide about. */
      detail: venueForService(service.id).name,
      image: storyImage(service.id),
      reason: FEATURED_REASONS[service.id] ?? DEFAULT_REASON,
    }));
}

/** A big editorial banner, distinct from the rail. */
export type DiscoverBanner = {
  id: string;
  eyebrow: string;
  headline: string;
  meta: string;
  image: ServiceImageDefinition;
  /** Which gradient wash sits under the image. */
  tone: 'sunset' | 'ocean' | 'bloom';
};

export function buildBanners(): DiscoverBanner[] {
  const rooftop = SERVICES.find((s) => s.id === 'rooftop');
  const spa = SERVICES.find((s) => s.id === 'spa');
  const tour = SERVICES.find((s) => s.id === 'food-crawl');

  const banners: DiscoverBanner[] = [];
  if (rooftop) {
    banners.push({
      id: rooftop.id,
      eyebrow: 'Tonight',
      headline: 'Sunset on the ninth floor',
      meta: `${rooftop.name} · ${rooftop.price}`,
      image: storyImage(rooftop.id),
      tone: 'sunset',
    });
  }
  if (spa) {
    banners.push({
      id: spa.id,
      eyebrow: 'Most booked',
      headline: 'Ninety minutes to yourself',
      meta: `${spa.name} · ${spa.price}`,
      image: storyImage(spa.id),
      tone: 'bloom',
    });
  }
  if (tour) {
    banners.push({
      id: tour.id,
      eyebrow: 'Off property',
      headline: 'Eat your way through Binondo',
      meta: `${tour.name} · ${tour.price}`,
      image: storyImage(tour.id),
      tone: 'ocean',
    });
  }
  return banners;
}
