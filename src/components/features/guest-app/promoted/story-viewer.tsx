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

/** How long a still holds before advancing. A clip holds for its own length. */
const SLIDE_MS = 4000;

/** Longest a clip may hold the rail, however long the file turns out to be. */
const MAX_CLIP_MS = 9000;

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

  /*
    A clip runs for as long as it runs.

    Holding a video slide for a fixed four seconds either cuts it off or
    leaves a frozen last frame on screen, and the file's duration is not
    known until it has loaded. So a still is timed and a clip reports its own
    length -- clamped, because the rail should not be at the mercy of a file
    someone swaps in later.
  */
  /*
    Stamped with the slide it belongs to, and read back by comparison.

    Clearing it from an effect when the slide changes is the pattern the
    React Compiler rules reject outright -- and they are right to: for one
    render the old clip's duration would still be current, and the rail would
    time a still against the length of the video before it.
  */
  const [clip, setClip] = useState<{ slide: string; ms: number } | null>(null);
  const slideKey = `${story.id}:${index}`;
  const clipMs = clip && clip.slide === slideKey ? clip.ms : null;
  const videoRef = useRef<HTMLVideoElement>(null);
  const playing = Boolean(slide.video) && !reducedMotion;

  useEffect(() => {
    // Auto-advance is the doomscroll premise; reduced motion opts out of
    // being moved along and waits for a tap instead.
    if (reducedMotion) return;
    // A clip that has not reported its length yet holds until it does.
    if (playing && clipMs === null) return;
    const hold = playing && clipMs !== null ? Math.min(clipMs, MAX_CLIP_MS) : SLIDE_MS;
    const timer = window.setTimeout(() => advanceRef.current(), hold);
    return () => window.clearTimeout(timer);
  }, [index, reducedMotion, story.id, playing, clipMs]);

  /*
    Autoplay can be refused -- a low-power device, a browser policy, a file
    that will not decode. The poster is already underneath, so the honest
    response is to stop waiting on the clip and time the slide as a still.
  */
  const giveUpOnClip = () => setClip({ slide: slideKey, ms: SLIDE_MS });

  // A new story starts at its beginning rather than wherever the last one got to.
  useEffect(() => {
    const timer = window.setTimeout(() => setIndex(0));
    return () => window.clearTimeout(timer);
  }, [story.id]);

  return (
    <div className="story" data-testid="story-viewer">
      {/* The still is always rendered: it is the poster while a clip loads,
          and the whole picture when one cannot play. */}
      <Image
        className="story__image"
        src={slide.image.src}
        alt=""
        fill
        sizes="480px"
        style={{ objectPosition: slide.image.focalPoint }}
        priority
      />
      {playing ? (
        <video
          key={slide.video}
          ref={videoRef}
          className="story__video"
          src={slide.video}
          poster={slide.image.src}
          muted
          playsInline
          autoPlay
          preload="auto"
          aria-hidden="true"
          onLoadedMetadata={(event) => {
            const seconds = event.currentTarget.duration;
            setClip({
              slide: slideKey,
              ms: Number.isFinite(seconds) && seconds > 0 ? seconds * 1000 : SLIDE_MS,
            });
          }}
          onError={giveUpOnClip}
          onStalled={giveUpOnClip}
        />
      ) : null}
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
        {/* The account's face, not the post's cover. */}
        <span className="story__avatar" aria-hidden="true">
          <Image src={story.author.image.src} alt="" fill sizes="36px" style={{ objectPosition: story.author.image.focalPoint }} />
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
        <p className="story__place">{story.subtitle}</p>
        {slide.detail ? <p className="story__detail">{slide.detail}</p> : null}
        <button className="story__cta" type="button" onClick={() => onBook(story.id)}>
          {story.cta}<span className="story__price">{story.price}</span><ArrowRight aria-hidden="true" />
        </button>
      </footer>
    </div>
  );
}
