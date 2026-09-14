import { RESTAURANTS, SERVICES } from '../prototype-model';
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
