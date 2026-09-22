'use client';

import { Clock, Star, TrendUp } from '@phosphor-icons/react';
import Image from 'next/image';
import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import type { FeaturedCard } from './story-model';

/*
  A pile of experiences to flick through.

  The deck rotates rather than empties: a thrown card dives under the stack
  and comes back as the last one, so the pile never runs out and the gesture
  has somewhere visible to end. An earlier pass flew the card off screen and
  unmounted it, which is why the motion read as a stutter -- the node
  animating was deleted halfway through.

  Nothing about the drag touches React. `setState` on every `pointermove`
  re-rendered images, scrim and copy once per frame, and no easing curve
  rescues a component that re-renders at 60fps. The finger writes `transform`
  straight to the node through a ref; state changes once, when a card is
  committed.
*/

const COMMIT_PX = 88;
const COMMIT_VELOCITY = 0.4;
const TAP_SLOP_PX = 6;
const LEAN_DEG = 6;
/** Matches `--deck-recycle-dur`. The failsafe below waits a beat longer. */
const RECYCLE_MS = 420;
/** How many cards are on screen at once. */
const WINDOW = 4;

export type SwipeDeckProps = {
  items: FeaturedCard[];
  onOpen: (itemId: string) => void;
};

export function SwipeDeck({ items, onOpen }: SwipeDeckProps) {
  const [order, setOrder] = useState(() => items.map((item) => item.id));
  /** The card currently diving to the back, kept mounted so it can animate. */
  const [recycling, setRecycling] = useState<string | null>(null);

  const cardRef = useRef<HTMLDivElement>(null);
  const recycleTimer = useRef<number | undefined>(undefined);
  /** Whether the guest is driving the pile from the keyboard. */
  const keyboardDriving = useRef(false);
  const drag = useRef({ active: false, startX: 0, x: 0, at: 0, frame: 0 });

  const byId = useMemo(
    () => new Map(items.map((item) => [item.id, item])),
    [items],
  );

  const current = byId.get(order[0] ?? '');

  /*
    A rotation replaces the top card with a different DOM node, which drops
    focus -- so a keyboard user got exactly one arrow press and then nothing.
    Focus follows the top of the pile, but only once they have actually used a
    key, so the deck never steals focus from elsewhere on the page.
  */
  useEffect(() => {
    if (!keyboardDriving.current) return;
    cardRef.current?.focus();
  }, [order]);
  const visible = order.slice(0, WINDOW);
  const currentIndex = Math.max(0, items.findIndex((item) => item.id === order[0]));

  const paint = useCallback(() => {
    const el = cardRef.current;
    if (!el) return;
    const { x } = drag.current;
    const lean = Math.max(-1, Math.min(1, x / COMMIT_PX)) * LEAN_DEG;
    el.style.transform = `translate3d(${x}px, 0, 0) rotate(${lean}deg)`;
  }, []);

  const rotate = useCallback((direction: -1 | 1) => {
    setOrder((list) => (direction === -1
      ? [...list.slice(1), list[0]!]
      : [list[list.length - 1]!, ...list.slice(0, -1)]));
  }, []);

  const move = useCallback((direction: -1 | 1) => {
    const el = cardRef.current;
    if (!el) return;

    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      rotate(direction);
      return;
    }

    /*
      The card goes under the pile, not off the edge. Dropping it behind the
      stack first and then letting it settle into the back slot is what makes
      the rotation legible -- thrown away and silently re-appearing at the
      bottom would read as a glitch.
    */
    /*
      Only a forward throw needs a diving card. Going back, the card arriving
      from the last slot is already sitting there and simply transitions
      forward, which is the correct animation for that direction anyway --
      and marking the outgoing card would land it back inside the visible
      window, rendering the same id twice.
    */
    if (direction === -1) setRecycling(order[0]!);
    else setRecycling(null);
    rotate(direction);

    /*
      One timer, restarted on each throw. Guarding the whole move against an
      in-flight recycle looked tidy and swallowed every fast flick: people
      throw cards quicker than 420ms, and a deck that ignores the second one
      feels broken in exactly the way this was meant to fix.
    */
    window.clearTimeout(recycleTimer.current);
    recycleTimer.current = window.setTimeout(() => setRecycling(null), RECYCLE_MS + 90);
  }, [order, rotate]);

  const settle = useCallback(() => {
    const el = cardRef.current;
    if (!el) return;
    el.classList.remove('is-dragging');
    el.style.transform = '';
  }, []);

  /*
    `useCallback`, because these are spread onto the top card inside a map and
    the compiler cannot otherwise tell an event handler from a call made
    during render -- `performance.now()` in the body is what it flags.
  */
  const onPointerDown = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    const el = cardRef.current;
    if (!el) return;
    // Capture is an optimisation and throws on a pointer the element does not
    // own; letting that abort the handler loses the whole interaction.
    try { el.setPointerCapture(event.pointerId); } catch { /* not fatal */ }
    el.classList.add('is-dragging');
    drag.current = { active: true, startX: event.clientX, x: 0, at: performance.now(), frame: 0 };
  }, []);

  const onPointerMove = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    if (!drag.current.active) return;
    drag.current.x = event.clientX - drag.current.startX;
    if (!drag.current.frame) {
      drag.current.frame = requestAnimationFrame(() => {
        drag.current.frame = 0;
        paint();
      });
    }
  }, [paint]);

  const onPointerUp = useCallback(() => {
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

    settle();
    if (Math.abs(x) > COMMIT_PX || velocity > COMMIT_VELOCITY) move(x < 0 ? -1 : 1);
  }, [current, move, onOpen, settle]);

  if (!current) {
    return (
      <div className="deck deck--done" data-testid="swipe-deck-empty">
        <b>Nothing available right now</b>
        <small>The categories below have the full list.</small>
      </div>
    );
  }

  /* The diving card renders last so it is a sibling of the stack, and its
     own class puts it underneath. */
  const rendered = recycling && !visible.includes(recycling)
    ? [...visible, recycling]
    : visible;

  return (
    <div className="deck" data-testid="swipe-deck">
      <div className="deck__stack">
        {rendered.map((id) => {
          const item = byId.get(id);
          if (!item) return null;

          /*
            Only the appended card is diving. A recycling id that has rotated
            back into the visible window is just a card again -- treating it
            as still in flight left the pile with no card at depth 0, and the
            top card lost its title.
          */
          const isRecycling = id === recycling && !visible.includes(id);
          const depth = isRecycling ? WINDOW : visible.indexOf(id);
          const isTop = depth === 0 && !isRecycling;

          return (
            <div
              key={id}
              ref={isTop ? cardRef : undefined}
              className={`deck__card${isTop ? '' : ' deck__card--under'}${isRecycling ? ' is-recycling' : ''}`}
              style={{ ['--depth' as string]: depth }}
              {...(isTop
                ? {
                    role: 'button',
                    tabIndex: 0,
                    'aria-label': `${item.title}. ${item.reason.label}. Press Enter to open, left and right arrows to browse`,
                    'aria-keyshortcuts': 'ArrowLeft ArrowRight Enter',
                    onPointerDown,
                    onPointerMove,
                    onPointerUp,
                    onPointerCancel: onPointerUp,
                    onKeyDown: (event: React.KeyboardEvent) => {
                      if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onOpen(item.id); }
                      /* Right goes on, left goes back -- the direction the
                         card travels, not the direction the pile shifts. */
                      if (event.key === 'ArrowRight') { keyboardDriving.current = true; move(-1); }
                      if (event.key === 'ArrowLeft') { keyboardDriving.current = true; move(1); }
                    },
                  }
                : { 'aria-hidden': true })}
            >
              <Image
                src={item.image.src}
                alt=""
                fill
                sizes="360px"
                style={{ objectPosition: item.image.focalPoint }}
                priority={isTop}
              />
              {isTop ? (
                <>
                  <span className="deck__scrim" aria-hidden="true" />
                  {/* The reason sits above the title, because it is the
                      answer to the question the card provokes -- "why am I
                      being shown this?" -- and an unanswered version of that
                      question is what makes a featured row feel like an ad. */}
                  <span className={`deck__reason deck__reason--${item.reason.kind}`}>
                    {item.reason.kind === 'hotel-pick' ? <Star weight="fill" aria-hidden="true" /> : null}
                    {item.reason.kind === 'popular' ? <TrendUp weight="bold" aria-hidden="true" /> : null}
                    {item.reason.kind === 'stay-context' ? <Clock weight="bold" aria-hidden="true" /> : null}
                    {item.reason.label}
                  </span>
                  <span className="deck__copy">
                    <b>{item.title}</b>
                    <span>{item.price}<i aria-hidden="true">·</i>{item.detail}</span>
                  </span>
                </>
              ) : <span className="deck__veil" />}
            </div>
          );
        })}
      </div>
      {items.length > 1 ? (
        <div className="deck__dots" aria-label="Featured promotions">
          {items.map((item, index) => <button key={item.id} type="button" className={index === currentIndex ? 'is-active' : ''} aria-label={`Show ${item.title}`} aria-current={index === currentIndex} onClick={() => setOrder([item.id, ...order.filter((id) => id !== item.id)])} />)}
        </div>
      ) : null}

    </div>
  );
}
