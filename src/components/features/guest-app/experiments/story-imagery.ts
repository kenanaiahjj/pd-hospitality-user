import type { ServiceImageDefinition } from '../service-images';

/*
  Placeholder photography, Unsplash, experiment-only.

  The guest app's own `service-images.ts` maps every catalogue item to local
  art already -- this exists because a story is full-bleed at phone height and
  the local set is cropped for cards. Real photography also settles an
  argument the cards cannot: whether an editorial format carries a hotel's
  inventory at all, or only looks good with a designer's picks in it.

  Not for promotion. A promoted flow reads `getItemCardImage` like everything
  else, or ships art the property actually owns.
*/

const shot = (id: string, alt: string, focalPoint = 'center'): ServiceImageDefinition => ({
  src: `${id}?auto=format&fit=crop&w=900&q=70`,
  alt,
  focalPoint,
});

/** Keyed by catalogue id, so a story picks up the right subject. */
export const STORY_IMAGERY: Record<string, ServiceImageDefinition> = {
  // Dining
  'apartment-1b': shot('https://images.unsplash.com/photo-1517248135467-4c7edcad34c4', 'Restaurant interior'),
  'poolside-bar': shot('https://images.unsplash.com/photo-1692261920240-a3c88f29e25f', 'Rooftop bar at sunset'),
  cafe: shot('https://images.unsplash.com/photo-1494346480775-936a9f0d0877', 'Cafe counter'),
  rooftop: shot('https://images.unsplash.com/photo-1613066697157-e8345495b665', 'Rooftop terrace at dusk'),
  dining: shot('https://images.unsplash.com/photo-1551632436-cbf8dd35adfa', 'Plated dish'),

  // Spa
  spa: shot('https://images.unsplash.com/photo-1544161515-4ab6ce6db874', 'Massage treatment'),
  scrub: shot('https://images.unsplash.com/photo-1600334129128-685c5582fd35', 'Spa treatment room'),
  'hot-stone': shot('https://images.unsplash.com/photo-1591343395082-e120087004b4', 'Hot stone therapy'),
  'couples-massage': shot('https://images.unsplash.com/photo-1639162906614-0603b0ae95fd', 'Spa suite'),
  facial: shot('https://images.unsplash.com/photo-1696841212541-449ca29397cc', 'Facial treatment'),

  // Tours and entertainment
  'food-crawl': shot('https://images.unsplash.com/photo-1508424757105-b6d5ad9329d0', 'Street food stall'),
  tour: shot('https://images.unsplash.com/photo-1570560258879-af7f8e1447ac', 'Island shoreline'),
  'sunset-cruise': shot('https://images.unsplash.com/photo-1689239719024-8f0866438b46', 'Boat at sunset'),
  'heritage-walk': shot('https://images.unsplash.com/photo-1636405189493-181ecf851006', 'Old city street'),
};

const FALLBACK = shot('https://images.unsplash.com/photo-1566073771259-6a8506099945', 'Hotel property');

export const storyImage = (id: string): ServiceImageDefinition => STORY_IMAGERY[id] ?? FALLBACK;
