'use client';

import { useState } from 'react';
import { DiscoverFeed } from './discover-feed';
import { StoryViewer } from './story-viewer';
import { buildBanners, buildStories } from './story-model';

/*
  The harness. Stands in for the guest app while the two candidates below it
  are iterated on, and gets deleted rather than promoted.

  In the app, `onBook` is `openServiceBooking` -- so a story is a way in to
  the booking flow, never a way around the gate that decides whether it may
  proceed.
*/

const STORIES = buildStories();
const BANNERS = buildBanners();

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
  const index = STORIES.findIndex((story) => story.id === openStoryId);
  const story = index >= 0 ? STORIES[index] : undefined;

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
      onOpenStory={setOpenStoryId}
      onOpenBanner={() => setOpenStoryId(STORIES[0]?.id ?? null)}
      onBrowseAll={() => undefined}
    />
  );
}
