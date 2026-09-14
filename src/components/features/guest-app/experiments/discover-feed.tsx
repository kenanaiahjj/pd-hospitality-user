'use client';

import { ArrowRight, CaretRight } from '@phosphor-icons/react';
import Image from 'next/image';
import type { DiscoverBanner, Story } from './story-model';

/*
  A promotable discovery page.

  Takes its content and its callbacks, so the guest app supplies real ones and
  the harness supplies demo ones. It sells the same catalogue the list view
  sells -- the argument is only that a guest mid-stay meets it the way they
  meet everything else on their phone, as something to watch.
*/

export type DiscoverFeedProps = {
  stories: Story[];
  banners: DiscoverBanner[];
  onOpenStory: (storyId: string) => void;
  onOpenBanner: (bannerId: string) => void;
  onBrowseAll: () => void;
};

export function DiscoverFeed({
  stories,
  banners,
  onOpenStory,
  onOpenBanner,
  onBrowseAll,
}: DiscoverFeedProps) {
  const [lead, ...rest] = banners;

  return (
    <div className="discover" data-testid="discover-feed">
      <div className="discover__title">
        <h1>Tonight on property</h1>
        <p>Eight places open now, and what people are booking.</p>
      </div>

      {/* The rail. Rounded squares rather than circles: the subject is a
          place, and a circle crops a room to a face. */}
      <section aria-label="Stories">
        <div className="discover__rail">
          {stories.map((story) => (
            <button key={story.id} className="discover__story" type="button" onClick={() => onOpenStory(story.id)}>
              <span className="discover__story-art">
                <Image
                  src={story.cover.src}
                  alt=""
                  fill
                  sizes="96px"
                  style={{ objectPosition: story.cover.focalPoint }}
                />
              </span>
              <small>{story.title}</small>
            </button>
          ))}
        </div>
      </section>

      {lead ? (
        <button
          className={`discover__hero discover__hero--${lead.tone}`}
          type="button"
          onClick={() => onOpenBanner(lead.id)}
        >
          <Image
            src={lead.image.src}
            alt=""
            fill
            sizes="480px"
            style={{ objectPosition: lead.image.focalPoint }}
          />
          <span className="discover__wash" aria-hidden="true" />
          <span className="discover__hero-copy">
            <small>{lead.eyebrow}</small>
            <b>{lead.headline}</b>
            <span>{lead.meta}</span>
          </span>
        </button>
      ) : null}

      <section aria-label="Featured">
        <div className="discover__grid">
          {rest.map((banner) => (
            <button
              key={banner.id}
              className={`discover__card discover__card--${banner.tone}`}
              type="button"
              onClick={() => onOpenBanner(banner.id)}
            >
              <Image
                src={banner.image.src}
                alt=""
                fill
                sizes="240px"
                style={{ objectPosition: banner.image.focalPoint }}
              />
              <span className="discover__wash" aria-hidden="true" />
              <span className="discover__card-copy">
                <small>{banner.eyebrow}</small>
                <b>{banner.headline}</b>
              </span>
            </button>
          ))}
        </div>
      </section>

      <button className="discover__all" type="button" onClick={onBrowseAll}>
        <span><b>Browse everything</b><small>Dining, spa, tours and hotel services</small></span>
        <CaretRight aria-hidden="true" />
      </button>
    </div>
  );
}

/** A dismissible strip promoting one thing, for the top of any screen. */
export function DiscoverPromo({ banner, onOpen }: { banner: DiscoverBanner; onOpen: () => void }) {
  return (
    <button className={`discover__promo discover__promo--${banner.tone}`} type="button" onClick={onOpen}>
      <span className="discover__promo-copy">
        <small>{banner.eyebrow}</small>
        <b>{banner.headline}</b>
      </span>
      <ArrowRight aria-hidden="true" />
    </button>
  );
}
