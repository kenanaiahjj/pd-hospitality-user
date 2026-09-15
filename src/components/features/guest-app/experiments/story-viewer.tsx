'use client';

import { ArrowRight, SealCheck, X } from '@phosphor-icons/react';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { usePrefersReducedMotion } from '@/lib/hooks';
import type { Story } from './story-model';
import { formatPostedAgo, storyExpiryLabel } from './story-model';

/*
  A promotable story viewer.

  Props the guest app can already satisfy: a `Story` off `buildStories()`,
  `onClose` as `back`, and `onBook` as the same `openServiceBooking` every
  other surface calls -- so the gate still decides whether a booking may
  proceed. A story is a way in, never a way around.
*/

/** How long a slide holds before advancing. */
const SLIDE_MS = 4000;

export type StoryViewerProps = {
  story: Story;
  onClose: () => void;
  onBook: (storyId: string) => void;
  /** Called when the last slide finishes, so a host can run a rail. */
  onFinished?: () => void;
};

export function StoryViewer({ story, onClose, onBook, onFinished }: StoryViewerProps) {
  const [index, setIndex] = useState(0);
  const reducedMotion = usePrefersReducedMotion();
  const slide = story.slides[Math.min(index, story.slides.length - 1)]!;
  const expiry = storyExpiryLabel(story);
  const isLast = index >= story.slides.length - 1;

  /*
    Through a ref so the timer is armed by the slide, not by the identity of
    a callback the parent rebuilds every render -- otherwise it restarts
    forever and never fires.
  */
  const advanceRef = useRef(() => undefined as void);
  useEffect(() => {
    advanceRef.current = () => {
      if (isLast) onFinished?.();
      else setIndex((i) => i + 1);
    };
  });

  useEffect(() => {
    // Auto-advance is the doomscroll premise; reduced motion opts out of
    // being moved along and waits for a tap instead.
    if (reducedMotion) return;
    const timer = window.setTimeout(() => advanceRef.current(), SLIDE_MS);
    return () => window.clearTimeout(timer);
  }, [index, reducedMotion, story.id]);

  // A new story starts at its beginning rather than wherever the last one got to.
  useEffect(() => {
    const timer = window.setTimeout(() => setIndex(0));
    return () => window.clearTimeout(timer);
  }, [story.id]);

  return (
    <div className="story" data-testid="story-viewer">
      <Image
        className="story__image"
        src={slide.image.src}
        alt=""
        fill
        sizes="480px"
        style={{ objectPosition: slide.image.focalPoint }}
        priority
      />
      <div className="story__scrim" aria-hidden="true" />

      <div className="story__progress" role="presentation">
        {story.slides.map((_, i) => (
          <span key={i} className={`story__tick${i <= index ? ' is-seen' : ''}`} />
        ))}
      </div>

      <header className="story__head">
        {/* A post is signed: who published it, what kind of account that is,
            and when. The countdown appears only once it is information --
            see `STORY_URGENT_HOURS`. */}
        <span className="story__avatar" aria-hidden="true">
          <Image src={story.cover.src} alt="" fill sizes="36px" style={{ objectPosition: story.cover.focalPoint }} />
        </span>
        <div className="story__who">
          <b>
            {story.author.name}
            {story.author.kind === 'property' ? (
              <span className="story__badge" title="Posted by the property">
                <SealCheck weight="fill" aria-hidden="true" />
                <i>Property</i>
              </span>
            ) : null}
          </b>
          <small>
            {formatPostedAgo(story.postedHoursAgo)}
            <i aria-hidden="true">·</i>
            <span className="story__where">{story.subtitle}</span>
            {/* Sits with the time, not up beside the close button: it is a
                fact about when the post ends, and the top row is already
                carrying the account. */}
            {expiry ? <span className="story__expiry">{expiry}</span> : null}
          </small>
        </div>
        <button className="story__close" type="button" onClick={onClose} aria-label="Close story">
          <X aria-hidden="true" />
        </button>
      </header>

      {/*
        Tap zones, the way every story surface works: back on the left, on
        on the right. They sit under the header and above the footer so the
        close button and the booking action stay reachable.
      */}
      <div className="story__zones">
        <button
          type="button"
          aria-label="Previous"
          onClick={() => setIndex((i) => Math.max(0, i - 1))}
        />
        <button
          type="button"
          aria-label="Next"
          onClick={() => (isLast ? onFinished?.() : setIndex((i) => i + 1))}
        />
      </div>

      <footer className="story__foot">
        <h1 className="story__headline">{slide.headline}</h1>
        {slide.detail ? <p className="story__detail">{slide.detail}</p> : null}
        <button className="story__cta" type="button" onClick={() => onBook(story.id)}>
          {story.cta}<span className="story__price">{story.price}</span><ArrowRight aria-hidden="true" />
        </button>
      </footer>
    </div>
  );
}
