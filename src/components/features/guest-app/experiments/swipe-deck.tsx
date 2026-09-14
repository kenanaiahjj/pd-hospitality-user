'use client';

import { ArrowLeft, ArrowRight } from '@phosphor-icons/react';
import Image from 'next/image';
import { useCallback, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import type { SearchableItem } from './story-model';

/*
  A pile of experiences to flick through.

  Browsing, not judging: left goes on, right goes back, a tap opens. Nothing
  is decided by flicking.

  The drag never touches React state. An earlier pass called `setState` on
  every `pointermove`, which re-rendered the whole deck -- images, scrim,
  copy -- once per frame, and no easing curve can rescue a component that
  re-renders at 60fps. The finger writes `transform` straight to the node
  through a ref, coalesced into one `requestAnimationFrame`, and state only
  changes when a card is actually committed.
*/

/** How far a card must travel before the flick counts. */
const COMMIT_PX = 88;
/** A short flick still counts if it was fast. */
const COMMIT_VELOCITY = 0.4;
/** Under this, the gesture was a tap, not a drag. */
const TAP_SLOP_PX = 6;
/** Degrees of lean at full commit distance. */
const LEAN_DEG = 6;
/** Matches `--deck-fly-dur`; the failsafe below waits a beat longer. */
const FLY_MS = 340;
/** Fan angles: one direction, increasing, so it reads as a hand of cards. */
const TILT = [3.5, 6.5, 9];

export type SwipeDeckProps = {
  items: SearchableItem[];
  /** A tap on the card. In the app, the service detail screen. */
  onOpen: (itemId: string) => void;
  onExhausted?: () => void;
};

export function SwipeDeck({ items, onOpen, onExhausted }: SwipeDeckProps) {
  const [index, setIndex] = useState(0);
  const cardRef = useRef<HTMLDivElement>(null);
  const drag = useRef({ active: false, startX: 0, x: 0, at: 0, frame: 0 });

  const current = items[index];
  const beneath = items.slice(index + 1, index + 4);
  const atStart = index === 0;

  /** Writes the transform directly. Never called during render. */
  const paint = useCallback(() => {
    const el = cardRef.current;
    if (!el) return;
    const { x } = drag.current;
    const lean = Math.max(-1, Math.min(1, x / COMMIT_PX)) * LEAN_DEG;
    el.style.transform = `translate3d(${x}px, 0, 0) rotate(${lean}deg)`;
  }, []);

  const advance = useCallback((direction: -1 | 1) => {
    setIndex((i) => {
      const next = i + (direction === -1 ? 1 : -1);
      if (next >= items.length) onExhausted?.();
      return next;
    });
  }, [items.length, onExhausted]);

  const move = useCallback((direction: -1 | 1) => {
    const el = cardRef.current;
    // Right at the first card has nowhere to go; bounce rather than pretend.
    if (!el || (direction === 1 && atStart)) return;

    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      advance(direction);
      return;
    }

    el.classList.remove('is-dragging');
    el.classList.add('is-flying');
    // Next frame, so the class lands before the value it transitions to.
    requestAnimationFrame(() => {
      el.style.transform = `translate3d(${direction * 480}px, 0, 0) rotate(${direction * 16}deg)`;
    });

    /*
      `transitionend` decides when the card has actually left -- a timer alone
      guesses the duration and drifts the moment the easing or distance
      changes. But a transition that is interrupted, or never runs at all
      because the environment does not composite, fires nothing, and the deck
      would hang on the same card forever. So: the event, with a timer behind
      it, and whichever arrives first cancels the other.
    */
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      el.removeEventListener('transitionend', finish);
      window.clearTimeout(failsafe);
      advance(direction);
    };
    const failsafe = window.setTimeout(finish, FLY_MS + 80);
    el.addEventListener('transitionend', finish, { once: true });
  }, [advance, atStart]);

  const settle = useCallback(() => {
    const el = cardRef.current;
    if (!el) return;
    el.classList.remove('is-dragging');
    el.style.transform = '';
  }, []);

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    const el = cardRef.current;
    if (!el || el.classList.contains('is-flying')) return;
    /*
      Capture is an optimisation -- it keeps the gesture alive if the finger
      leaves the card -- and it throws on a pointer the element does not own.
      Letting that abort the handler would lose the whole interaction, tap
      included, for the sake of a nicety.
    */
    try { el.setPointerCapture(event.pointerId); } catch { /* not fatal */ }
    el.classList.add('is-dragging');
    drag.current = { active: true, startX: event.clientX, x: 0, at: performance.now(), frame: 0 };
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!drag.current.active) return;
    drag.current.x = event.clientX - drag.current.startX;

    // One paint per frame, however many move events the OS delivers.
    if (!drag.current.frame) {
      drag.current.frame = requestAnimationFrame(() => {
        drag.current.frame = 0;
        paint();
      });
    }
  };

  const onPointerUp = () => {
    if (!drag.current.active) return;
    drag.current.active = false;
    if (drag.current.frame) {
      cancelAnimationFrame(drag.current.frame);
      drag.current.frame = 0;
    }

    const { x, at } = drag.current;
    const velocity = Math.abs(x) / Math.max(performance.now() - at, 1);

    if (Math.abs(x) < TAP_SLOP_PX) {
      settle();
      if (current) onOpen(current.id);
      return;
    }

    if (Math.abs(x) > COMMIT_PX || velocity > COMMIT_VELOCITY) move(x < 0 ? -1 : 1);
    else settle();
  };

  if (!current) {
    return (
      <div className="deck deck--done" data-testid="swipe-deck-empty">
        <b>That&rsquo;s everything on property</b>
        <small>The categories below have the same things, sorted.</small>
      </div>
    );
  }

  return (
    <div className="deck" data-testid="swipe-deck">
      <div className="deck__stack">
        {[...beneath].reverse().map((item, i) => {
          const depth = beneath.length - i;
          return (
            <div
              key={item.id}
              className="deck__card deck__card--under"
              style={{
                ['--depth' as string]: depth,
                ['--tilt' as string]: `${TILT[Math.min(depth - 1, TILT.length - 1)]}deg`,
              }}
              aria-hidden="true"
            >
              <Image src={item.image.src} alt="" fill sizes="360px" style={{ objectPosition: item.image.focalPoint }} />
              <span className="deck__veil" />
            </div>
          );
        })}

        {/*
          Keyed on the item, so a committed card is replaced by a fresh node
          rather than one still carrying the inline transform that threw it
          off screen.
        */}
        <div
          key={current.id}
          ref={cardRef}
          className="deck__card"
          role="button"
          tabIndex={0}
          aria-label={`${current.title}. Open`}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onOpen(current.id); }
            if (event.key === 'ArrowLeft') move(1);
            if (event.key === 'ArrowRight') move(-1);
          }}
        >
          <Image
            src={current.image.src}
            alt=""
            fill
            sizes="360px"
            style={{ objectPosition: current.image.focalPoint }}
            priority
          />
          <span className="deck__scrim" aria-hidden="true" />
          <span className="deck__copy">
            <small>{current.category}</small>
            <b>{current.title}</b>
            <span>{current.price} · {current.detail}</span>
          </span>
        </div>
      </div>

      <div className="deck__actions">
        <button className="deck__action" type="button" onClick={() => move(1)} disabled={atStart} aria-label="Previous">
          <ArrowLeft aria-hidden="true" />
        </button>
        <p className="deck__progress" role="status">{index + 1} of {items.length}</p>
        <button className="deck__action" type="button" onClick={() => move(-1)} aria-label="Next">
          <ArrowRight aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
