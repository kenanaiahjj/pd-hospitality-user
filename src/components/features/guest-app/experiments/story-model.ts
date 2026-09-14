import { MINI_APP_CATEGORIES, RESTAURANTS, SERVICES } from '../prototype-model';
import type { MiniAppCategoryId } from '../prototype-model';
import type { ServiceImageDefinition } from '../service-images';
import { storyImage } from './story-imagery';

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
};

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
  };
};

const serviceStory = (service: (typeof SERVICES)[number]): Story => {
  const image = storyImage(service.id);
  return {
    id: `service-${service.id}`,
    title: service.name,
    subtitle: service.operator,
    price: service.price,
    cta: 'Book a time',
    cover: image,
    slides: [
      { headline: service.category.toUpperCase(), detail: service.name, image },
      { headline: service.price.toUpperCase(), detail: service.cutoff, image },
    ],
  };
};

/**
 * The rail, in the order a guest should meet it: somewhere to eat first,
 * because that is the decision most guests are actually making.
 */
export function buildStories(): Story[] {
  const featuredVenues = RESTAURANTS.slice(0, 4).map(restaurantStory);
  const featuredServices = SERVICES
    .filter((service) => service.categoryId === 'spa' || service.categoryId === 'entertainment')
    .slice(0, 4)
    .map(serviceStory);

  return [...featuredVenues, ...featuredServices];
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
 * The swipe deck: things to do, not places to eat.
 *
 * Dining is excluded on purpose. A restaurant is a decision a guest makes
 * against a time and a hunger, and asking them to rule one in or out at
 * random is noise. An experience is exactly the kind of thing nobody knows
 * they want until they see it, which is the only case where a deck beats a
 * list.
 */
export function buildSwipeDeck(): SearchableItem[] {
  return SERVICES
    .filter((service) => service.categoryId !== 'dining')
    .map((service) => ({
      id: service.id,
      title: service.name,
      category: service.category,
      price: service.price,
      detail: service.operator,
      image: storyImage(service.id),
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
