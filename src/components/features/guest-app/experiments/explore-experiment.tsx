'use client';

import { useState } from 'react';
import { DiscoverFeed } from './discover-feed';
import { ServiceDetail } from './service-detail';
import { SwipeDeck } from './swipe-deck';
import { StoryViewer } from './story-viewer';
import { buildBanners, buildCategoryCards, buildSearchIndex, buildStories, buildSwipeDeck } from './story-model';

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
const DECK = buildSwipeDeck();

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
  const index = STORIES.findIndex((story) => story.id === openStoryId);
  const story = index >= 0 ? STORIES[index] : undefined;

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
      onOpenCategory={() => undefined}
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
