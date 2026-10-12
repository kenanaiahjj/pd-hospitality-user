import { offeredIn, RESTAURANTS, SERVICES } from '../prototype-model';
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
  'the-dining-room': { dayparts: ['afternoon', 'evening'] },
  'si-senor': { dayparts: ['evening'], fits: 'couple', whenLabel: 'Tables tonight · from 6:00 PM' },
  'popolo-pizzeria': { dayparts: ['afternoon', 'evening'], fits: 'family' },
  'the-red-kitchen': { dayparts: ['evening'], fits: 'group' },
  'noelles-brunch-bar': { dayparts: ['morning'], whenLabel: 'Brunch until 3:00 PM' },
  'coffee-collective': { dayparts: ['morning', 'afternoon'] },
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
  diving: { phases: ['mid-stay'], dayparts: ['morning'] },
  // Mid-stay, never ahead of breakfast: the afternoon boat is the one a morning reel would push.
  'apo-island-trip': { phases: ['mid-stay'], dayparts: ['afternoon'], whenLabel: 'Boats at 7:30 AM and 1:30 PM' },
  'walking-tour': { phases: ['mid-stay'], dayparts: ['morning'], whenLabel: 'Tomorrow · 8:00 AM' },
  'yoga-class': { dayparts: ['morning', 'evening'], whenLabel: 'Tomorrow · 6:30 AM' },
  // Dumaguete's two: the bike leads a mid-stay day, the scooter waits lower.
  'bike-rental': { phases: ['mid-stay'] },
  'scooter-rental': { onlyIn: ['arrival-day', 'first-night', 'mid-stay'] },
  'museum-pass': { dayparts: ['afternoon'] },
  'cooking-class': { phases: ['mid-stay'], fits: 'family' },
  music: { dayparts: ['evening'], whenLabel: 'Tonight · 6:00 PM' },
  'film-night': { dayparts: ['evening'], fits: 'family' },
  /* Rentals: one of each kind leads a mid-stay morning (the e-bike, the car);
     the rest wait lower, or six of the top eight are vehicles. A self-drive
     car is a day out, so it is gone once the guest is heading home -- the
     transfer is the car that matters then. */
  rental: { phases: ['mid-stay'] },
  'e-bike': { phases: ['mid-stay'], dayparts: ['morning'] },
  scooter: { phases: ['mid-stay'], dayparts: ['afternoon'] },
  motorcycle: { phases: ['mid-stay'] },
  'car-rental': { phases: ['mid-stay'], dayparts: ['morning'], onlyIn: ['arrival-day', 'first-night', 'mid-stay'] },
  'suv-rental': { phases: ['mid-stay'], fits: 'group', onlyIn: ['arrival-day', 'first-night', 'mid-stay'] },
};

const stills = (story: Story): Story => ({
  ...story,
  slides: story.slides.map((slide) => ({ headline: slide.headline, detail: slide.detail, image: slide.image })),
});

/* --------------------------------------------------------------------------
   Reels the catalogue did not have: the moments around the stay itself.
   -------------------------------------------------------------------------- */

/** The hotel posting in its own voice: the stay's own, else the brand. */
const hotelAuthor = (property = 'The Henry') => ({ name: property, kind: 'property' as const, image: PROPERTY_IMAGE });
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
  /** Only at this hotel: a moment about its own venues. */
  city?: string;
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
    city: 'Manila',
  },
  {
    id: 'moment-breakfast',
    title: 'Brunch at Noelle’s',
    subtitle: 'Noelle’s Brunch Bar',
    price: 'Free to reserve',
    cta: 'Reserve a table',
    slides: [
      { headline: 'Brunch is on', detail: 'Brunch plates and juices until 3:00 PM.', image: storyImage('noelles-brunch-bar') },
      { headline: 'Or just coffee', detail: 'Coffee Collective opens at 7:00 AM.', image: storyImage('coffee-collective') },
    ],
    tags: { itemId: 'moment-breakfast', category: 'dining', phases: ['mid-stay'], dayparts: ['morning'], whenLabel: 'This morning · until 3:00 PM' },
    action: { kind: 'item', id: 'noelles-brunch-bar' },
    postedHoursAgo: 2.5,
    city: 'Dumaguete',
  },
  {
    id: 'moment-pasalubong',
    title: 'Pasalubong to take home',
    subtitle: 'The Lobby Shop',
    price: 'From ₱280',
    cta: 'Browse the shop',
    slides: [
      { headline: 'Something for home', detail: 'Pasalubong boxes, dried mango and local coffee.', image: remote('photo-1606313564200-e75d5e30476c', 'Artisan pasalubong box') },
      { headline: 'Made here', detail: 'Handwoven totes and ceramic keepsakes.', image: remote('photo-1594223274512-ad4803739b7c', 'Handwoven market tote') },
    ],
    tags: { itemId: 'moment-pasalubong', category: 'gifts', phases: ['last-day', 'checkout-day'], dayparts: ['morning', 'afternoon'] },
    action: { kind: 'screen', screen: 'gifts-souvenirs' },
    postedHoursAgo: 3,
    city: 'Manila',
  },
  {
    id: 'moment-pasalubong',
    title: 'Sans rival to take home',
    subtitle: 'Cafe Sans Rival',
    price: 'From ₱380',
    cta: 'Order pasalubong',
    slides: [
      { headline: 'Something for home', detail: 'Sans rival and silvanas, packed by the café on the resort.', image: remote('photo-1606313564200-e75d5e30476c', 'A box of pastries to take home') },
      { headline: 'Held for your flight', detail: 'The front desk keeps it chilled until you leave.', image: remote('photo-1549465220-1a8b9238cd48', 'A wrapped gift box') },
    ],
    tags: { itemId: 'moment-pasalubong', category: 'gifts', phases: ['last-day', 'checkout-day'], dayparts: ['morning', 'afternoon'] },
    action: { kind: 'screen', screen: 'gifts-souvenirs' },
    postedHoursAgo: 3,
    city: 'Dumaguete',
  },
  {
    id: 'moment-transfer-home',
    title: 'A car to the airport',
    subtitle: 'Hotel transfers',
    price: SERVICES.find((service) => service.id === 'transfer')?.price ?? 'From ₱1,200',
    cta: 'Book the ride',
    slides: [
      { headline: 'Leave the driving to us', detail: 'A hotel driver, door to departures.', image: remote('photo-1764089859662-7b4773dff85b', 'Executive sedan at the kerb') },
      { headline: 'On your room bill', detail: 'Pick a time and it goes on your room.', image: remote('photo-1449965408869-eaa3f722e40d', 'Highway toward the airport') },
    ],
    tags: { itemId: 'moment-transfer-home', category: 'services', phases: ['last-day', 'checkout-day'], onlyIn: ['last-day', 'checkout-day'], dayparts: ['morning', 'afternoon'] },
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
    tags: { itemId: 'moment-late-checkout', category: 'services', phases: ['last-day'], onlyIn: ['last-day'], dayparts: ['evening', 'late'] },
    action: { kind: 'late-checkout' },
    postedHoursAgo: 6,
  },
];

const momentStory = (moment: Moment, property?: string): Story => ({
  id: moment.id,
  title: moment.title,
  subtitle: moment.subtitle,
  price: moment.price,
  cta: moment.cta,
  cover: moment.slides[0]!.image,
  slides: moment.slides,
  author: hotelAuthor(property),
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
    cta: 'Visit',
    cover: place.image,
    slides: [{ headline: place.name, detail: place.type, image: place.image }],
    author: { name: place.name, kind: 'venue', image: place.image },
    ...postingFor(place.id),
  };
}

/* --------------------------------------------------------------------------
   Everything, as candidates
   -------------------------------------------------------------------------- */

/**
 * Every reel the feed can rank. With a city, only what that hotel has: its own
 * venues and services and the moments about them. The hotel's own posts sign
 * with `property`.
 */
export function buildFeedCandidates(input: { nearby: NearbyStoryInput[]; city?: string; property?: string }): FeedCandidate[] {
  const here = input.city ? offeredIn(input.city) : () => true;
  const venues: FeedCandidate[] = RESTAURANTS.filter(here).map((venue) => ({
    story: stills(restaurantStory(venue)),
    tags: { itemId: venue.id, category: 'dining', ...RESTAURANT_TAGS[venue.id] },
    action: { kind: 'item', id: venue.id },
  }));
  const services: FeedCandidate[] = SERVICES
    .filter(here)
    .filter((service) => service.categoryId === 'spa' || service.categoryId === 'entertainment' || service.categoryId === 'rentals')
    .map((service) => ({
      story: stills(serviceStory(service)),
      tags: { itemId: service.id, category: service.categoryId as FeedTags['category'], ...SERVICE_TAGS[service.id] },
      action: { kind: 'item', id: service.id },
    }));
  const moments: FeedCandidate[] = MOMENTS
    .filter((moment) => !moment.city || !input.city || moment.city === input.city)
    // Without a city both versions of a moment would show: keep the first.
    .filter((moment, index, all) => all.findIndex((other) => other.id === moment.id) === index)
    .map((moment) => ({ story: momentStory(moment, input.property), tags: moment.tags, action: moment.action }));
  const nearby: FeedCandidate[] = input.nearby.map((place) => ({
    story: nearbyStory(place),
    tags: { itemId: `nearby-${place.id}`, category: 'nearby', dayparts: place.dayparts },
    action: { kind: 'nearby', id: place.id },
  }));

  return [...moments, ...venues, ...services, ...nearby].filter((candidate) => storyIsLive(candidate.story));
}
