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

export function ExploreExperiment() {
  const [openStoryId, setOpenStoryId] = useState<string | null>(null);
  const index = STORIES.findIndex((story) => story.id === openStoryId);
  const story = index >= 0 ? STORIES[index] : undefined;

  if (story) {
    return (
      <StoryViewer
        story={story}
        onClose={() => setOpenStoryId(null)}
        onBook={() => setOpenStoryId(null)}
        onFinished={() => {
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
