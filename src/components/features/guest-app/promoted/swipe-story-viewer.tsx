'use client';

import { ArrowDown, ArrowRight, ArrowUp, Pause, Play, SealCheck, X } from '@phosphor-icons/react';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { usePrefersReducedMotion } from '@/lib/hooks';
import { formatPostedAgo, storyExpiryLabel, type Story, type StorySlide } from './story-model';
import './swipe-story-viewer.css';

type Props = {
  stories: Story[];
  initialStoryId: string;
  onClose: () => void;
  onBook: (storyId: string) => void;
};

/** Activity discovery only. The QR handoff keeps its original timed viewer. */
export function SwipeStoryViewer({ stories, initialStoryId, onClose, onBook }: Props) {
  const frames = stories.flatMap((story) => story.slides.map((slide) => ({ story, slide })));
  const first = Math.max(0, frames.findIndex(({ story }) => story.id === initialStoryId));
  const [index, setIndex] = useState(first);
  const feedRef = useRef<HTMLDivElement>(null);
  const reducedMotion = usePrefersReducedMotion();
  const initialIndex = useRef(first);

  useEffect(() => {
    const feed = feedRef.current;
    if (!feed) return;
    feed.scrollTop = initialIndex.current * feed.clientHeight;
    feed.focus({ preventScroll: true });
  }, []);

  const move = (direction: number) => {
    const feed = feedRef.current;
    if (!feed) return;
    // The finite demo catalogue starts again when the guest reaches its end.
    const next = (index + direction + frames.length) % frames.length;
    const wraps = Math.abs(next - index) > 1;
    feed.scrollTo({ top: next * feed.clientHeight, behavior: reducedMotion || wraps ? 'instant' : 'smooth' });
  };

  if (!frames.length) return null;

  return (
    <div className="story swipe-stories" data-testid="swipe-story-viewer">
      <button className="story__close swipe-stories__close" type="button" onClick={onClose} aria-label="Close stories"><X aria-hidden="true" /></button>
      <p className="sr-only" role="status">{frames[index]?.story.title}</p>
      <div ref={feedRef} className="swipe-stories__scroll" role="region" aria-label="Activity stories" tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === 'Escape') { onClose(); return; }
          if (event.target !== event.currentTarget) return;
          if (['ArrowDown', 'PageDown', 'ArrowUp', 'PageUp'].includes(event.key)) {
            event.preventDefault();
            move(['ArrowDown', 'PageDown'].includes(event.key) ? 1 : -1);
          }
        }}
        onScroll={(event) => {
          const feed = event.currentTarget;
          if (feed.clientHeight) setIndex(Math.min(frames.length - 1, Math.round(feed.scrollTop / feed.clientHeight)));
        }}>
        {frames.map(({ story, slide }, frameIndex) => (
          <article className="swipe-stories__post" key={`${story.id}-${frameIndex}`} aria-label={`${story.title}: ${slide.headline}`}>
            <StoryMedia slide={slide} active={index === frameIndex} priority={frameIndex === first} />
            <div className="story__scrim" aria-hidden="true" />
            <header className="story__head">
              <span className="story__avatar" aria-hidden="true"><Image src={story.author.image.src} alt="" fill sizes="36px" /></span>
              <div className="story__who">
                <b>{story.author.name}{story.author.kind === 'property' ? <span className="story__badge"><SealCheck weight="fill" aria-hidden="true" /><i>Property</i></span> : null}</b>
                <small>{formatPostedAgo(story.postedHoursAgo)}<i aria-hidden="true">·</i><span className="story__where">{story.subtitle}</span>{storyExpiryLabel(story) ? <span className="story__expiry">{storyExpiryLabel(story)}</span> : null}</small>
              </div>
            </header>
            <footer className="story__foot">
              <h2 className="story__headline">{slide.headline}</h2>
              {slide.detail ? <p className="story__detail">{slide.detail}</p> : null}
              <button className="story__cta" type="button" onClick={() => onBook(story.id)}>{story.cta}<span className="story__price">{story.price}</span><ArrowRight aria-hidden="true" /></button>
              <span className="swipe-stories__hint">Swipe to explore<ArrowDown aria-hidden="true" /></span>
              {frameIndex === frames.length - 1 ? <button className="swipe-stories__restart" type="button" onClick={() => move(1)}>Watch again<ArrowUp aria-hidden="true" /></button> : null}
            </footer>
          </article>
        ))}
      </div>
      <div className="swipe-stories__controls" aria-label="Story navigation">
        <button type="button" aria-label="Previous story frame" onClick={() => move(-1)}><ArrowUp aria-hidden="true" /></button>
        <button type="button" aria-label="Next story frame" onClick={() => move(1)}><ArrowDown aria-hidden="true" /></button>
      </div>
    </div>
  );
}

function StoryMedia({ slide, active, priority }: { slide: StorySlide; active: boolean; priority: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [paused, setPaused] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [failed, setFailed] = useState(false);
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const syncPlayback = () => {
      if (active && !paused && !reducedMotion && !document.hidden) playVideo(video);
      else video.pause();
    };
    syncPlayback();
    document.addEventListener('visibilitychange', syncPlayback);
    return () => { document.removeEventListener('visibilitychange', syncPlayback); video.pause(); };
  }, [active, paused, reducedMotion]);

  return <>
    <Image className="story__image" src={slide.image.src} alt="" fill sizes="(max-width: 520px) 100vw, 520px" style={{ objectPosition: slide.image.focalPoint }} priority={priority} />
    {slide.video && active && !reducedMotion && !failed ? <>
      <video ref={videoRef} className="story__video" src={slide.video} poster={slide.image.src} muted loop playsInline preload="none" aria-hidden="true" onPlaying={() => setPlaying(true)} onPause={() => setPlaying(false)} onError={() => setFailed(true)} />
      <button className="swipe-stories__play" type="button" aria-label={playing ? 'Pause video' : 'Play video'} onClick={() => { if (playing) setPaused(true); else { setPaused(false); playVideo(videoRef.current); } }}>{playing ? <Pause weight="fill" /> : <Play weight="fill" />}</button>
    </> : null}
  </>;
}

function playVideo(video: HTMLVideoElement | null) {
  if (!video) return;
  try {
    void Promise.resolve(video.play()).catch(() => {});
  } catch {
    // Browsers can reject or throw when autoplay is unavailable. The poster
    // image remains the usable fallback for both cases.
  }
}
