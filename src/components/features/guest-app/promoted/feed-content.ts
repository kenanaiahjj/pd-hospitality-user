import { RESTAURANTS, SERVICES } from '../prototype-model';
import { getRoomImage, type ServiceImageDefinition } from '../service-images';
import type { FeedAction, FeedCandidate, FeedTags } from './feed-model';
import { postingFor, restaurantStory, serviceStory, storyIsLive } from './story-model';
import type { Story } from './story-model';
import { PROPERTY_IMAGE, storyImage } from './story-imagery';

/*
  What the For you feed can show, each reel tagged with when it fits.

  The tags are handwritten, like `STORY_FRAMES` is: which moment a place is
  right for is a judgement about the place, not something a category rule
  picks well. A reel with no tags still appears -- it simply ranks on
  recency, below everything that fits the moment.

  No video in the feed. The three clips in `story-imagery.ts` carry a slow
  push-in baked into the footage that moves in whole-pixel steps, and full
  screen that reads as judder (the same fault the welcome screen had). The
  stills play instead until smooth footage replaces them.
*/

type TagsWithoutId = Omit<FeedTags, 'itemId' | 'category'>;

const RESTAURANT_TAGS: Record<string, TagsWithoutId> = {
  'apartment-1b': { dayparts: ['morning', 'evening'] },
  dining: { dayparts: ['late'], whenLabel: 'Still open late · to your room' },
  'poolside-bar': { dayparts: ['afternoon', 'evening'] },
  cafe: { dayparts: ['morning'] },
  rooftop: { dayparts: ['evening'], fits: 'couple', whenLabel: 'Tonight · 7:30 PM' },
};

const SERVICE_TAGS: Record<string, TagsWithoutId> = {
  spa: { phases: ['arrival-day', 'mid-stay'], dayparts: ['afternoon'] },
  scrub: { follows: ['spa'] },
  'hot-stone': { dayparts: ['afternoon'] },
  'couples-massage': { fits: 'couple', dayparts: ['afternoon', 'evening'] },
  reflexology: { phases: ['arrival-day'], dayparts: ['late'] },
  facial: { follows: ['spa', 'scrub'] },
  'mani-pedi': { dayparts: ['morning'] },
  barber: { dayparts: ['morning'] },
  tour: { phases: ['mid-stay'], dayparts: ['morning'] },
  'heritage-walk': { phases: ['mid-stay'], dayparts: ['morning'] },
  'food-crawl': { dayparts: ['afternoon'], follows: ['heritage-walk'] },
  'sunset-cruise': { dayparts: ['afternoon'], fits: 'couple', whenLabel: 'Sunset · 5:30 PM' },
  diving: { phases: ['mid-stay'] },
  'museum-pass': { dayparts: ['afternoon'] },
  'cooking-class': { phases: ['mid-stay'], fits: 'family' },
  music: { dayparts: ['evening'], whenLabel: 'Tonight · 6:00 PM' },
  'film-night': { dayparts: ['evening'], fits: 'family' },
};

const stills = (story: Story): Story => ({
  ...story,
  slides: story.slides.map((slide) => ({ headline: slide.headline, detail: slide.detail, image: slide.image })),
});

/* --------------------------------------------------------------------------
   Reels the catalogue did not have: the moments around the stay itself.
   -------------------------------------------------------------------------- */

const HOTEL = { name: 'The Henry Manila', kind: 'property' as const, image: PROPERTY_IMAGE };
const remote = (id: string, alt: string): ServiceImageDefinition => ({
  src: `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1200&q=82`,
  alt,
  focalPoint: '50% 50%',
});

type Moment = {
  id: string;
  title: string;
  subtitle: string;
  price: string;
  cta: string;
  slides: { headline: string; detail?: string; image: ServiceImageDefinition }[];
  tags: FeedTags;
  action: FeedAction;
  postedHoursAgo: number;
};

const MOMENTS: Moment[] = [
  {
    id: 'moment-welcome',
    title: 'A welcome drink on us',
    subtitle: 'The Poolside Bar & Lounge',
    price: 'Complimentary',
    cta: 'Find the bar',
    slides: [
      { headline: 'Welcome to The Henry', detail: 'Your first drink by the pool is on the house tonight.', image: storyImage('poolside-bar') },
      { headline: 'Ground floor, by the pool', detail: 'Show your room key at the bar.', image: storyImage('rooftop') },
    ],
    tags: { itemId: 'moment-welcome', category: 'dining', phases: ['arrival-day', 'first-night'], dayparts: ['evening'], whenLabel: 'Your first night · on the house' },
    action: { kind: 'item', id: 'poolside-bar' },
    postedHoursAgo: 1,
  },
  {
    id: 'moment-breakfast',
    title: 'Breakfast in the courtyard',
    subtitle: 'Apartment 1B',
    price: 'From ₱650',
    cta: 'See the menu',
    slides: [
      { headline: 'Breakfast is on', detail: 'Artisan breakfast in the garden until 10:30.', image: storyImage('apartment-1b') },
      { headline: 'Or at the café', detail: 'Kape Manila opens at 6:00 AM.', image: storyImage('cafe') },
    ],
    tags: { itemId: 'moment-breakfast', category: 'dining', phases: ['mid-stay'], dayparts: ['morning'], whenLabel: 'This morning · until 10:30' },
    action: { kind: 'item', id: 'apartment-1b' },
    postedHoursAgo: 2.5,
  },
  {
    id: 'moment-pasalubong',
    title: 'Pasalubong to take home',
    subtitle: 'The lobby shop',
    price: 'From ₱280',
    cta: 'Browse the shop',
    slides: [
      { headline: 'Something for home', detail: 'Pasalubong boxes, dried mango and local coffee.', image: remote('photo-1606313564200-e75d5e30476c', 'Artisan pasalubong box') },
      { headline: 'Made here', detail: 'Handwoven totes and ceramic keepsakes.', image: remote('photo-1594223274512-ad4803739b7c', 'Handwoven market tote') },
    ],
    tags: { itemId: 'moment-pasalubong', category: 'gifts', phases: ['last-day', 'checkout-day'], dayparts: ['morning', 'afternoon'] },
    action: { kind: 'screen', screen: 'gifts-souvenirs' },
    postedHoursAgo: 3,
  },
  {
    id: 'moment-transfer-home',
    title: 'A car to the airport',
    subtitle: 'Hotel transfers',
    price: SERVICES.find((service) => service.id === 'transfer')?.price ?? 'From ₱1,200',
    cta: 'Book the ride',
    slides: [
      { headline: 'Leave the traffic to us', detail: 'A hotel driver, door to departures.', image: remote('photo-1764089859662-7b4773dff85b', 'Executive sedan at the kerb') },
      { headline: 'On your room bill', detail: 'Pick a time and it goes on your room.', image: remote('photo-1449965408869-eaa3f722e40d', 'Highway toward the airport') },
    ],
    tags: { itemId: 'moment-transfer-home', category: 'services', phases: ['last-day', 'checkout-day'], dayparts: ['morning', 'afternoon'] },
    action: { kind: 'departure-ride' },
    postedHoursAgo: 4,
  },
  {
    id: 'moment-late-checkout',
    title: 'Stay a little longer',
    subtitle: 'Late checkout',
    price: 'Subject to availability',
    cta: 'Ask the front desk',
    slides: [
      { headline: 'No rush tomorrow', detail: 'Ask for your room until 2:00 PM.', image: getRoomImage('King room') },
    ],
    tags: { itemId: 'moment-late-checkout', category: 'services', phases: ['last-day'], dayparts: ['evening', 'late'] },
    action: { kind: 'late-checkout' },
    postedHoursAgo: 6,
  },
];

const momentStory = (moment: Moment): Story => ({
  id: moment.id,
  title: moment.title,
  subtitle: moment.subtitle,
  price: moment.price,
  cta: moment.cta,
  cover: moment.slides[0]!.image,
  slides: moment.slides,
  author: HOTEL,
  postedHoursAgo: moment.postedHoursAgo,
  livesForHours: 24,
});

/* --------------------------------------------------------------------------
   Nearby partners
   -------------------------------------------------------------------------- */

export type NearbyStoryInput = {
  id: string;
  name: string;
  /** "Coffee & bakery", as the nearby cards say it. */
  type: string;
  distance?: string;
  image: ServiceImageDefinition;
  /** The part of the day a place is best at, if it has one. */
  dayparts?: FeedTags['dayparts'];
};

export function nearbyStory(place: NearbyStoryInput): Story {
  return {
    id: `nearby-${place.id}`,
    title: place.name,
    subtitle: [place.type, place.distance].filter(Boolean).join(' · '),
    price: place.distance ?? 'Nearby',
    cta: 'See the place',
    cover: place.image,
    slides: [{ headline: place.name, detail: place.type, image: place.image }],
    author: { name: place.name, kind: 'venue', image: place.image },
    ...postingFor(place.id),
  };
}

/* --------------------------------------------------------------------------
   Everything, as candidates
   -------------------------------------------------------------------------- */

export function buildFeedCandidates(input: { nearby: NearbyStoryInput[] }): FeedCandidate[] {
  const venues: FeedCandidate[] = RESTAURANTS.map((venue) => ({
    story: stills(restaurantStory(venue)),
    tags: { itemId: venue.id, category: 'dining', ...RESTAURANT_TAGS[venue.id] },
    action: { kind: 'item', id: venue.id },
  }));
  const services: FeedCandidate[] = SERVICES
    .filter((service) => service.categoryId === 'spa' || service.categoryId === 'entertainment')
    .map((service) => ({
      story: stills(serviceStory(service)),
      tags: { itemId: service.id, category: service.categoryId as FeedTags['category'], ...SERVICE_TAGS[service.id] },
      action: { kind: 'item', id: service.id },
    }));
  const moments: FeedCandidate[] = MOMENTS.map((moment) => ({ story: momentStory(moment), tags: moment.tags, action: moment.action }));
  const nearby: FeedCandidate[] = input.nearby.map((place) => ({
    story: nearbyStory(place),
    tags: { itemId: `nearby-${place.id}`, category: 'nearby', dayparts: place.dayparts },
    action: { kind: 'nearby', id: place.id },
  }));

  return [...moments, ...venues, ...services, ...nearby].filter((candidate) => storyIsLive(candidate.story));
}

