'use client';

import { ArrowRight, SealCheck } from '@phosphor-icons/react';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { usePrefersReducedMotion } from '@/lib/hooks';
import type { FeedEntry } from './feed-model';

/*
  One reel: a story's frames, full screen.

  Frames step with a tap on the right or left third, and advance on their own
  while the reel is the one on screen -- the way every story surface works.
  Scrolling up or down moves between reels; that belongs to the feed, not to
  this component. A reel that is not on screen holds still, so a feed of
  twenty never has twenty timers running.

  Stills are always rendered: a clip, where one exists, plays over its still
  only while the reel is active and never under reduced motion.
*/

/** How long a frame holds before the next one. */
export const FRAME_MS = 4000;

export type ReelViewProps = {
  entry: FeedEntry;
  /** The reel currently on screen. */
  active: boolean;
  onAction: (entry: FeedEntry) => void;
};

export function ReelView({ entry, active, onAction }: ReelViewProps) {
  const { story } = entry;
  const reducedMotion = usePrefersReducedMotion();
  const [frame, setFrame] = useState(0);
  const count = story.slides.length;
  const slide = story.slides[Math.min(frame, count - 1)]!;

  // Armed per frame, while on screen; the state change happens in the timer,
  // never in the effect body.
  useEffect(() => {
    if (!active || reducedMotion || count < 2) return;
    const timer = window.setTimeout(() => setFrame((current) => (current + 1 < count ? current + 1 : current)), FRAME_MS);
    return () => window.clearTimeout(timer);
  }, [active, reducedMotion, count, frame]);

  const extra = slide.headline !== story.title && slide.headline !== story.price ? slide.headline : undefined;
  const frameLine = [extra, slide.detail].filter(Boolean).join(' · ');

  const step = (by: number) => setFrame((current) => Math.min(count - 1, Math.max(0, current + by)));

  return (
    <section className="reel" data-active={active || undefined} aria-roledescription="reel" aria-label={story.title}>
      <Image
        className="reel__image"
        src={slide.image.src}
        alt={slide.image.alt}
        fill
        sizes="(max-width: 480px) 100vw, 480px"
        style={{ objectPosition: slide.image.focalPoint }}
      />
      {slide.video && active && !reducedMotion ? (
        <video key={slide.video} className="reel__video" src={slide.video} poster={slide.image.src} muted playsInline autoPlay loop aria-hidden="true" />
      ) : null}
      <span className="reel__scrim" aria-hidden="true" />

      {count > 1 ? (
        <div className="reel__progress" aria-hidden="true">
          {story.slides.map((_, index) => (
            <span key={index} className={index < frame ? 'is-seen' : index === frame ? 'is-current' : undefined}>
              {/* Keyed so the fill restarts with each frame. */}
              {index === frame && active && !reducedMotion ? <i key={`${story.id}-${frame}`} style={{ animationDuration: `${FRAME_MS}ms` }} /> : null}
            </span>
          ))}
        </div>
      ) : null}

      {count > 1 ? (
        <div className="reel__zones">
          <button type="button" aria-label="Previous picture" onClick={() => step(-1)} />
          <button type="button" aria-label="Next picture" onClick={() => step(1)} />
        </div>
      ) : null}

      <div className="reel__foot">
        <p className="reel__why">{entry.why}</p>
        <p className="reel__author">
          <span className="reel__avatar" aria-hidden="true">
            <Image src={story.author.image.src} alt="" fill sizes="28px" style={{ objectPosition: story.author.image.focalPoint }} />
          </span>
          {story.author.name}
          {story.author.kind === 'property' ? <SealCheck className="reel__badge" weight="fill" aria-label="Posted by the hotel" /> : null}
        </p>
        {/* The place's name holds across frames; each frame adds its own line
            under it ("Open today · 6:30 AM – 11:00 PM"), never the price twice. */}
        <h2 className="reel__title">{story.title}</h2>
        {frameLine ? <p className="reel__detail">{frameLine}</p> : null}
        <div className="reel__meta">
          <span>{story.price}</span>
          <button type="button" className="reel__action" onClick={() => onAction(entry)}>
            {story.cta}<ArrowRight aria-hidden="true" />
          </button>
        </div>
      </div>
    </section>
  );
}
