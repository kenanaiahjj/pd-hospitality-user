'use client';

import { ArrowLeft, ArrowRight } from '@phosphor-icons/react';
import Image from 'next/image';
import { useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import type { SearchableItem } from './story-model';

/*
  A pile of experiences to flick through.

  Browsing, not judging. An earlier pass had this as save-or-pass, which asked
  a guest to have an opinion about twenty-eight things before they had seen
  any of them -- and made a throw irreversible, which is a strange price for
  looking. Left goes on, right goes back, a tap opens. Nothing is decided by
  flicking.

  The pile is tilted for that reason too: a neat stack reads as a component,
  and loose cards read as something you can throw.
*/

/** How far a card must travel before the flick counts. */
const COMMIT_PX = 88;
/** A short flick still counts if it was fast. */
const COMMIT_VELOCITY = 0.4;
/*
  One direction, increasing. A scatter of alternating angles reads as mess;
  a fan that leans consistently reads as a hand of cards you can push.
*/
const TILT = [3.5, 6.5, 9];

export type SwipeDeckProps = {
  items: SearchableItem[];
  /** A tap on the card. In the app, the service detail. */
  onOpen: (itemId: string) => void;
  /** Reached the end of the pile. */
  onExhausted?: () => void;
};

type Drag = { x: number; startX: number; startedAt: number } | null;

export function SwipeDeck({ items, onOpen, onExhausted }: SwipeDeckProps) {
  const [index, setIndex] = useState(0);
  const [drag, setDrag] = useState<Drag>(null);
  const [flying, setFlying] = useState<-1 | 1 | 0>(0);
  const cardRef = useRef<HTMLDivElement>(null);

  const current = items[index];
  const beneath = items.slice(index + 1, index + 4);
  const atStart = index === 0;

  const move = (direction: -1 | 1) => {
    // Right at the first card has nowhere to go; bounce rather than pretend.
    if (!current || flying || (direction === 1 && atStart)) {
      setDrag(null);
      return;
    }

    setFlying(direction);
    window.setTimeout(() => {
      const nextIndex = index + (direction === -1 ? 1 : -1);
      setIndex(nextIndex);
      setFlying(0);
      setDrag(null);
      if (nextIndex >= items.length) onExhausted?.();
    }, 200);
  };

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (flying) return;
    cardRef.current?.setPointerCapture(event.pointerId);
    setDrag({ x: 0, startX: event.clientX, startedAt: performance.now() });
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!drag || flying) return;
    setDrag({ ...drag, x: event.clientX - drag.startX });
  };

  const onPointerUp = () => {
    if (!drag || flying) return;
    const velocity = Math.abs(drag.x) / Math.max(performance.now() - drag.startedAt, 1);
    const committed = Math.abs(drag.x) > COMMIT_PX || velocity > COMMIT_VELOCITY;

    // A drag under the threshold is a tap: open the thing being looked at.
    if (!committed && Math.abs(drag.x) < 6 && current) {
      setDrag(null);
      onOpen(current.id);
      return;
    }

    if (committed) move(drag.x < 0 ? -1 : 1);
    else setDrag(null);
  };

  if (!current) {
    return (
      <div className="deck deck--done" data-testid="swipe-deck-empty">
        <b>That&rsquo;s everything on property</b>
        <small>The categories below have the same things, sorted.</small>
      </div>
    );
  }

  const offset = drag?.x ?? 0;
  const lean = Math.max(-1, Math.min(1, offset / COMMIT_PX));

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

        <div
          ref={cardRef}
          className={`deck__card${drag ? ' is-dragging' : ''}${flying ? ' is-flying' : ''}`}
          style={{
            transform: flying
              ? `translate3d(${flying * 460}px, 0, 0) rotate(${flying * 16}deg)`
              : `translate3d(${offset}px, 0, 0) rotate(${lean * 6}deg)`,
          }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
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

      {/*
        Arrows, not only the flick. A gesture cannot be the only way through
        a pile, or it is unreadable to a keyboard and unusable one-handed.
      */}
      <div className="deck__actions">
        <button
          className="deck__action"
          type="button"
          onClick={() => move(1)}
          disabled={atStart}
          aria-label="Previous"
        >
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
