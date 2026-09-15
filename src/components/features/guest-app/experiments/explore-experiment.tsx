'use client';

import { useState } from 'react';
import { DiscoverFeed } from './discover-feed';
import { CategoryListing } from './category-listing';
import { NearbyDetail } from './nearby-detail';
import { NEARBY_PLACES, nearbyForCategory, onPropertyForCategory } from './nearby-model';
import { ServiceDetail } from './service-detail';
import { VenueMenu } from './venue-menu';
import { SwipeDeck } from './swipe-deck';
import { StoryViewer } from './story-viewer';
import { RESTAURANTS } from '../prototype-model';
import { buildBanners, buildCategoryCards, buildSearchIndex, buildStories, buildFeaturedDeck } from './story-model';

/*
  The harness. Stands in for the guest app while the two candidates below it
  are iterated on, and gets deleted rather than promoted.

  In the app, `onBook` is `openServiceBooking` -- so a story is a way in to
  the booking flow, never a way around the gate that decides whether it may
  proceed.
*/

const STORIES = buildStories();
const BANNERS = buildBanners();
const SEARCH_INDEX = buildSearchIndex();
const CATEGORIES = buildCategoryCards();
const DECK = buildFeaturedDeck();

export function ExploreExperiment({ autoplayIntro = false }: { autoplayIntro?: boolean } = {}) {
  /*
    Arriving from the unlock opens on a story rather than on the feed: the
    handoff is "here is what is on tonight", and a grid of cards asks the
    guest to start choosing before they have seen anything.

    One story, then the feed -- not the full chain. Chaining is what the rail
    does when a guest taps in deliberately; doing it on arrival would hold
    someone who only wanted to look around.
  */
  const [openStoryId, setOpenStoryId] = useState<string | null>(
    autoplayIntro ? STORIES[0]?.id ?? null : null,
  );
  const [introPlaying, setIntroPlaying] = useState(autoplayIntro);
  /* A card opens a screen, not a story: tapping is a request to read more,
     and a story plays past what the guest stopped to look at. */
  const [openItemId, setOpenItemId] = useState<string | null>(null);
  const [openCategoryId, setOpenCategoryId] = useState<string | null>(null);
  const [openPlaceId, setOpenPlaceId] = useState<string | null>(null);
  const index = STORIES.findIndex((story) => story.id === openStoryId);
  const story = index >= 0 ? STORIES[index] : undefined;

  const place = openPlaceId ? NEARBY_PLACES.find((entry) => entry.id === openPlaceId) : undefined;
  if (place) {
    return (
      <div className="experiment-page">
        <NearbyDetail
          place={place}
          onBack={() => setOpenPlaceId(null)}
          /* In the app this opens the transfer booking, pre-filled with the
             destination -- the one thing the property can actually sell here. */
          onBookRide={() => setOpenPlaceId(null)}
        />
      </div>
    );
  }

  /*
    A venue opens the app's restaurant screen, a service opens the service
    detail. Tapping "Apartment 1B" and landing on a generic service page is
    the kind of seam that makes a prototype stop being believable.
  */
  const venue = openItemId ? RESTAURANTS.find((entry) => entry.id === openItemId) : undefined;
  if (venue) {
    return (
      <div className="experiment-page">
        <VenueMenu
          venue={venue}
          roomLabel="Room 304"
          /* Back lands on the category it was opened from, not the feed. */
          onBack={() => setOpenItemId(null)}
          /* In the app this seeds the front-desk chat with the reservation. */
          onReserve={() => setOpenItemId(null)}
        />
      </div>
    );
  }

  const item = openItemId ? DECK.find((entry) => entry.id === openItemId) : undefined;
  if (item) {
    return (
      <div className="experiment-page">
        <ServiceDetail
          item={item}
          onBack={() => setOpenItemId(null)}
          /* In the app this is `openServiceBooking`, so the room-scan gate
             still decides whether the booking may proceed. */
          onBook={() => setOpenItemId(null)}
        />
      </div>
    );
  }

  /*
    Checked after the item and the venue, deliberately. A category is where a
    guest is standing, not something they opened -- returning it first meant
    tapping a restaurant inside Food & Drink set the item and then re-rendered
    the category anyway, so nothing appeared to happen.
  */
  const category = openCategoryId ? CATEGORIES.find((entry) => entry.id === openCategoryId) : undefined;
  if (category) {
    return (
      <div className="experiment-page">
        <CategoryListing
          title={category.title}
          onProperty={onPropertyForCategory(category.id)}
          nearby={nearbyForCategory(category.id)}
          onBack={() => setOpenCategoryId(null)}
          onOpenItem={setOpenItemId}
          onOpenNearby={setOpenPlaceId}
        />
      </div>
    );
  }

  if (story) {
    return (
      <StoryViewer
        story={story}
        onClose={() => { setIntroPlaying(false); setOpenStoryId(null); }}
        onBook={() => { setIntroPlaying(false); setOpenStoryId(null); }}
        onFinished={() => {
          if (introPlaying) {
            setIntroPlaying(false);
            setOpenStoryId(null);
            return;
          }
          // Straight into the next one, which is the whole premise.
          const next = STORIES[index + 1];
          setOpenStoryId(next ? next.id : null);
        }}
      />
    );
  }

  return (
    <DiscoverFeed
      stories={STORIES}
      banners={BANNERS}
      categories={CATEGORIES}
      searchIndex={SEARCH_INDEX}
      onOpenStory={setOpenStoryId}
      onOpenBanner={() => setOpenStoryId(STORIES[0]?.id ?? null)}
      /* In the app this opens the service detail; here it plays its story if
         the thing has one, so the search result still leads somewhere. */
      onOpenItem={(itemId) => {
        const match = STORIES.find((story) => story.id.endsWith(itemId));
        setOpenStoryId(match ? match.id : null);
      }}
      /* In the app this opens `category-listing`. */
      onOpenCategory={setOpenCategoryId}
      onBrowseAll={() => undefined}
      deck={(
        <SwipeDeck
          items={DECK}
          /* In the app this opens the service detail, where the gate still
             decides whether a booking may proceed. */
          onOpen={setOpenItemId}
        />
      )}
    />
  );
}
