import { RESTAURANTS, SERVICES } from '../prototype-model';
import { storyImage } from './story-imagery';
import type { ServiceImageDefinition } from '../service-images';

/*
  Intent-led discovery.

  Every hotel app is a catalogue: categories, lists, a keyword box. A guest's
  actual question is never "spa" -- it is "it is raining and I have three
  hours", or "somewhere for dinner, nothing formal". A catalogue cannot answer
  a situation, and a search box can only match the words in it.

  The hotel is the only party that knows the guest's time, their room, the
  weather outside and what is open right now. That context is the one thing an
  OTA structurally cannot have, so it is the thing worth building the surface
  around.

  Deterministic here, on purpose. A shipped version would put a small model
  behind this; the point of the prototype is the interaction, and a fixture
  that always answers the same way is what makes it demonstrable.
*/

export type IntentPick = {
  id: string;
  /** Why this one, for this situation. The app explaining itself. */
  why: string;
};

export type Intent = {
  id: string;
  /** What a guest taps, in their words rather than the property's. */
  prompt: string;
  /** Typed words that resolve to this intent. */
  cues: string[];
  /** The one-line answer, before the list. */
  answer: string;
  picks: IntentPick[];
};

/*
  Picks for every hotel in the catalogue, the stay's own first. The answer
  keeps the first three this hotel actually has (see `resolveIntent`), so a
  Dumaguete guest never gets Manila Bay and the other way round.
*/
export const INTENTS: Intent[] = [
  {
    id: 'dinner',
    prompt: 'Somewhere for dinner tonight',
    cues: ['dinner', 'eat', 'food', 'hungry', 'restaurant', 'tonight'],
    answer: 'Three open tonight. Tables are free to reserve.',
    picks: [
      { id: 'si-senor', why: 'On the resort, tables from 6 PM' },
      { id: 'the-dining-room', why: 'The main restaurant, open until 10 PM' },
      { id: 'the-red-kitchen', why: 'Dinner only, sittings at 6 and 7 PM' },
      { id: 'apartment-1b', why: 'Downstairs, no booking needed' },
      { id: 'rooftop', why: 'Ninth floor — worth the lift for the view' },
      { id: 'poolside-bar', why: 'Lightest option, walk in' },
    ],
  },
  {
    id: 'rain',
    prompt: 'It&rsquo;s raining',
    cues: ['rain', 'raining', 'wet', 'indoor', 'inside', 'storm'],
    answer: 'Everything here is indoors and on property.',
    picks: [
      { id: 'spa', why: '90 minutes, and you never step outside' },
      { id: 'cooking-class', why: 'Filipino classics, hotel kitchen' },
      { id: 'facial', why: 'Shorter, if you want the afternoon back' },
      { id: 'mani-pedi', why: 'An hour, and you stay dry' },
    ],
  },
  {
    id: 'before-checkout',
    prompt: 'A few hours before checkout',
    cues: ['checkout', 'check out', 'leaving', 'last day', 'few hours', 'flight'],
    answer: 'Short, near the lobby, and nothing that runs long.',
    picks: [
      { id: 'reflexology', why: '30 minutes, and it is by reception' },
      { id: 'luggage', why: 'Bags held after you check out — complimentary' },
      { id: 'transfer', why: 'Airport car, booked to your flight' },
    ],
  },
  {
    id: 'kids',
    prompt: 'Something with the kids',
    cues: ['kid', 'kids', 'child', 'children', 'family', 'toddler'],
    answer: 'Two that work with children, and one that buys you an evening.',
    picks: [
      { id: 'film-night', why: 'Poolside, Saturdays, complimentary' },
      { id: 'popolo-pizzeria', why: 'Pizza works for everyone' },
      { id: 'museum-pass', why: 'Ten minutes away, good for a morning' },
      { id: 'babysitting', why: 'If you want dinner without them' },
    ],
  },
  {
    id: 'work',
    prompt: 'I need to get work done',
    cues: ['work', 'meeting', 'laptop', 'call', 'wifi', 'desk', 'office'],
    answer: 'Quiet first, then the things that clear your evening.',
    picks: [
      { id: 'meeting-room', why: 'Bookable by the half day' },
      { id: 'coffee-collective', why: 'On the resort, open from 7 AM' },
      { id: 'cafe', why: 'Lobby level, open from 6 AM' },
      { id: 'laundry', why: 'Same-day, so tomorrow is handled' },
    ],
  },
  {
    id: 'celebrate',
    prompt: 'We&rsquo;re celebrating',
    cues: ['celebrate', 'birthday', 'anniversary', 'honeymoon', 'proposal', 'special'],
    answer: 'Set the room up first — it needs a day&rsquo;s notice.',
    picks: [
      { id: 'celebration', why: 'Flowers and setup, 24 hours ahead' },
      { id: 'couples-massage', why: 'The suite takes two' },
      { id: 'spa', why: 'Book two side by side' },
      { id: 'si-senor', why: 'Reserve a table for the evening' },
      { id: 'rooftop', why: 'Book the terrace before 6 PM' },
    ],
  },
  {
    id: 'first-time',
    prompt: 'First time here',
    cues: ['dumaguete', 'manila', 'city', 'explore', 'tour', 'sightsee', 'first time', 'local'],
    answer: 'Start on foot, then get on the water.',
    picks: [
      { id: 'walking-tour', why: 'Rizal Boulevard and the old town, with the resort’s own guide' },
      { id: 'apo-island-trip', why: 'Turtles and reef, by boat — the operator confirms first' },
      { id: 'diving', why: 'A first dive, no certificate needed' },
      { id: 'heritage-walk', why: 'Old Manila, guided, half a day' },
      { id: 'food-crawl', why: 'Binondo — the oldest Chinatown anywhere' },
      { id: 'sunset-cruise', why: 'Manila Bay, and the sunset is the point' },
    ],
  },
];

export type IntentResult = {
  intent: Intent;
  items: Array<{
    id: string;
    title: string;
    category: string;
    price?: string;
    why: string;
    image: ServiceImageDefinition;
  }>;
};

/** Resolves a catalogue id to the thing a guest would recognise. */
function describe(id: string) {
  const service = SERVICES.find((entry) => entry.id === id);
  if (service) {
    return { title: service.name, category: service.category, price: service.price };
  }
  const venue = RESTAURANTS.find((entry) => entry.id === id);
  if (venue) {
    return {
      title: venue.name,
      category: venue.category,
      ...(venue.priceRange ? { price: venue.priceRange } : {}),
    };
  }
  return undefined;
}

/**
 * The answer for one situation. `available` is what this hotel has (the ids
 * in its own catalogue); without it every pick is a candidate.
 */
export function resolveIntent(intent: Intent, available?: ReadonlySet<string>): IntentResult {
  return {
    intent,
    /*
      A pick that no longer exists in the catalogue, or not at this hotel, is
      dropped rather than rendered blank -- an answer that lists something the
      property cannot sell is worse than a shorter answer.
    */
    items: intent.picks.flatMap((pick) => {
      if (available && !available.has(pick.id)) return [];
      const described = describe(pick.id);
      if (!described) return [];
      return [{ id: pick.id, ...described, why: pick.why, image: storyImage(pick.id) }];
    }).slice(0, 3),
  };
}

/**
 * What the guest typed, matched to a situation.
 *
 * Cue-based rather than fuzzy: a wrong answer delivered confidently is worse
 * than no answer, so anything unmatched falls through to catalogue search,
 * which at least never claims to have understood.
 */
export function matchIntent(query: string): Intent | undefined {
  const needle = query.trim().toLowerCase();
  if (needle.length < 2) return undefined;

  return INTENTS.find((intent) =>
    intent.cues.some((cue) => needle.includes(cue))
    || intent.prompt.toLowerCase().includes(needle));
}
