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

/*
  Local files, not live Unsplash URLs.

  They were remote, and Next fetches a remote image server-side at request
  time -- so a blocked network, an offline laptop or Unsplash rate-limiting
  fifteen images at once all render as a broken glyph. A prototype that is
  going to be shown to people cannot have a third party in the render path.

  Downloaded once into `public/experiments/`; the filename is the Unsplash id
  so each one can still be traced back to its source.
*/
const shot = (id: string, alt: string, focalPoint = 'center'): ServiceImageDefinition => ({
  src: `/experiments/${id}.jpg`,
  alt,
  focalPoint,
});

/** Keyed by catalogue id, so a story picks up the right subject. */
export const STORY_IMAGERY: Record<string, ServiceImageDefinition> = {
  // Dining
  'apartment-1b': shot('photo-1517248135467-4c7edcad34c4', 'Restaurant interior'),
  'poolside-bar': shot('photo-1692261920240-a3c88f29e25f', 'Rooftop bar at sunset'),
  cafe: shot('photo-1494346480775-936a9f0d0877', 'Cafe counter'),
  rooftop: shot('photo-1613066697157-e8345495b665', 'Rooftop terrace at dusk'),
  dining: shot('photo-1551632436-cbf8dd35adfa', 'Plated dish'),

  // Spa
  spa: shot('photo-1544161515-4ab6ce6db874', 'Massage treatment'),
  scrub: shot('photo-1600334129128-685c5582fd35', 'Spa treatment room'),
  'hot-stone': shot('photo-1591343395082-e120087004b4', 'Hot stone therapy'),
  'couples-massage': shot('photo-1639162906614-0603b0ae95fd', 'Spa suite'),
  facial: shot('photo-1696841212541-449ca29397cc', 'Facial treatment'),

  // Tours and entertainment
  'food-crawl': shot('photo-1508424757105-b6d5ad9329d0', 'Street food stall'),
  tour: shot('photo-1570560258879-af7f8e1447ac', 'Island shoreline'),
  'sunset-cruise': shot('photo-1689239719024-8f0866438b46', 'Boat at sunset'),
  'heritage-walk': shot('photo-1636405189493-181ecf851006', 'Old city street'),
};

/* The property itself. Also the fallback, because a shot of the hotel is the
   one picture that is never wrong for something on it. */
export const PROPERTY_IMAGE = shot('photo-1566073771259-6a8506099945', 'The property at dusk');

const FALLBACK = PROPERTY_IMAGE;

export const storyImage = (id: string): ServiceImageDefinition => STORY_IMAGERY[id] ?? FALLBACK;

/**
 * Whether this id has a photograph of its own rather than the house shot.
 *
 * `storyImage` falling back is right for a rail or a detail screen, where one
 * generic picture beats a hole. It is wrong for a deck of cards seen side by
 * side: nineteen of twenty-eight featured cards were the same resort photo,
 * which reads as a bug whatever the copy on them says.
 */
export const hasStoryImage = (id: string): boolean => id in STORY_IMAGERY;

/*
  Motion, for the stories that have it.

  Generated from the stills above as slow pans rather than sourced as
  footage: a prototype needs to prove the viewer handles video -- duration it
  does not control, muted autoplay, a poster while it loads, a still under
  reduced motion -- and none of that needs real footage to be worth deciding
  about. Real clips drop in by replacing these files; nothing reads their
  contents.

  Keyed by catalogue id, and deliberately sparse: a rail where every story is
  a video is not the thing being tested.
*/
export const STORY_VIDEO: Record<string, string> = {
  'poolside-bar': '/experiments/clip-poolside-bar.mp4',
  spa: '/experiments/clip-spa.mp4',
  'food-crawl': '/experiments/clip-food-crawl.mp4',
};

export const storyVideo = (id: string): string | undefined => STORY_VIDEO[id];
