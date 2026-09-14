'use client';

import { ArrowRight, BookmarkSimple, X } from '@phosphor-icons/react';
import Image from 'next/image';
import { useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { Button } from '@/components/ui';
import type { SearchableItem } from './story-model';

/*
  A deck of experiences to rule in or out, one at a time.

  The argument: a guest scrolling a list is comparing, and comparing needs a
  reason to prefer one thing over another that they usually do not have on
  day one. A deck asks a smaller question -- this one, yes or no -- and a
  yes costs nothing because it only saves.

  A save is never a booking. Swiping is a low-attention gesture and booking
  spends money against a room; the deck collects intent and the Saved tab is
  where a guest acts on it deliberately.
*/

/** How far a card must travel before the gesture counts as a decision. */
const COMMIT_PX = 96;
/** A flick shorter than the threshold still counts if it was fast enough. */
const COMMIT_VELOCITY = 0.45;

export type SwipeDeckProps = {
  items: SearchableItem[];
  onSave: (itemId: string) => void;
  onPass: (itemId: string) => void;
  /** Opens what has been saved so far. */
  onOpenSaved: () => void;
  savedCount: number;
};

type Drag = { x: number; startX: number; startedAt: number } | null;

export function SwipeDeck({ items, onSave, onPass, onOpenSaved, savedCount }: SwipeDeckProps) {
  const [index, setIndex] = useState(0);
  const [drag, setDrag] = useState<Drag>(null);
  /** The direction a card is flying out, so the exit can be animated. */
  const [exiting, setExiting] = useState<'save' | 'pass' | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const current = items[index];
  /*
    Two behind, not one. A single card tucked directly under the top one is
    invisible -- the deck read as a page until it was already being dragged,
    which is exactly when the affordance stops mattering.
  */
  const beneath = items.slice(index + 1, index + 3);

  const decide = (verdict: 'save' | 'pass') => {
    if (!current || exiting) return;
    setExiting(verdict);
    if (verdict === 'save') onSave(current.id);
    else onPass(current.id);

    // Let the card clear the frame before the next one takes its place.
    window.setTimeout(() => {
      setIndex((i) => i + 1);
      setExiting(null);
      setDrag(null);
    }, 220);
  };

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (exiting) return;
    cardRef.current?.setPointerCapture(event.pointerId);
    setDrag({ x: 0, startX: event.clientX, startedAt: performance.now() });
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!drag || exiting) return;
    setDrag({ ...drag, x: event.clientX - drag.startX });
  };

  const onPointerUp = () => {
    if (!drag || exiting) return;
    const elapsed = Math.max(performance.now() - drag.startedAt, 1);
    const velocity = Math.abs(drag.x) / elapsed;
    const committed = Math.abs(drag.x) > COMMIT_PX || velocity > COMMIT_VELOCITY;

    if (committed) decide(drag.x > 0 ? 'save' : 'pass');
    else setDrag(null);
  };

  if (!current) {
    return (
      <div className="deck deck--done" data-testid="swipe-deck-empty">
        <div className="deck__done-copy">
          <b>That&rsquo;s everything on property</b>
          <small>
            {savedCount > 0
              ? `${savedCount} saved. Book them whenever you like — nothing is held.`
              : 'Nothing saved. The categories above have the full list.'}
          </small>
        </div>
        {savedCount > 0 ? (
          <Button className="guest-button guest-button--primary" type="button" onClick={onOpenSaved}>
            See what you saved<ArrowRight aria-hidden="true" />
          </Button>
        ) : null}
      </div>
    );
  }

  const offset = drag?.x ?? 0;
  const intent = Math.max(-1, Math.min(1, offset / COMMIT_PX));
  const flying = exiting ? (exiting === 'save' ? 1 : -1) : 0;

  return (
    <div className="deck" data-testid="swipe-deck">
      <div className="deck__stack">
        {/*
          Rendered back-to-front so the nearest sits highest, and each one
          steps down far enough to show a lip. The peeking edges are the whole
          signal that there is more here than one card.
        */}
        {[...beneath].reverse().map((item, i) => {
          const depth = beneath.length - i;
          return (
            <div
              key={item.id}
              className="deck__card deck__card--under"
              style={{ ['--depth' as string]: depth }}
              aria-hidden="true"
            >
              <Image src={item.image.src} alt="" fill sizes="360px" style={{ objectPosition: item.image.focalPoint }} />
              <span className="deck__veil" />
            </div>
          );
        })}

        <div
          ref={cardRef}
          className={`deck__card${drag ? ' is-dragging' : ''}${exiting ? ' is-exiting' : ''}`}
          style={{
            transform: flying
              ? `translate3d(${flying * 480}px, 0, 0) rotate(${flying * 18}deg)`
              : `translate3d(${offset}px, 0, 0) rotate(${intent * 7}deg)`,
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

          {/* Verdict marks, revealed by how far the card has travelled. */}
          <span className="deck__mark deck__mark--save" style={{ opacity: Math.max(0, intent) }} aria-hidden="true">Save</span>
          <span className="deck__mark deck__mark--pass" style={{ opacity: Math.max(0, -intent) }} aria-hidden="true">Pass</span>

          <span className="deck__copy">
            <small>{current.category}</small>
            <b>{current.title}</b>
            <span>{current.price} · {current.detail}</span>
          </span>
        </div>
      </div>

      {/*
        Buttons, not only the gesture. A drag is the fast path for someone who
        already knows it is there; it cannot be the only way to answer, or the
        deck is unusable with a keyboard, a screen reader, or one hand full.
      */}
      <div className="deck__actions">
        <button className="deck__action deck__action--pass" type="button" onClick={() => decide('pass')} aria-label={`Pass on ${current.title}`}>
          <X aria-hidden="true" />
        </button>
        <p className="deck__progress" role="status">
          {index + 1} of {items.length}
          {savedCount > 0 ? <b>{savedCount} saved</b> : null}
        </p>
        <button className="deck__action deck__action--save" type="button" onClick={() => decide('save')} aria-label={`Save ${current.title}`}>
          <BookmarkSimple aria-hidden="true" weight="fill" />
        </button>
      </div>
    </div>
  );
}
