'use client';

import { CaretDown, MagnifyingGlass, SquaresFour, X } from '@phosphor-icons/react';
import { useEffect, useRef, useState } from 'react';
import type { FeedEntry } from './feed-model';
import { ReelView } from './reel-view';
import './reels.css';

/*
  For you: the stay, as reels.

  One reel per screen, snapping on a vertical swipe. The order is the feed
  model's; this component only decides which reel is on screen (the one an
  IntersectionObserver sees most of) so that one alone plays. After the last
  reel, an end card hands the guest to the categories and the full catalogue
  -- the feed is an argument, not the only way in.
*/

export type ReelFeedProps = {
  entries: FeedEntry[];
  onAction: (entry: FeedEntry) => void;
  onSearch: () => void;
  onBrowse: () => void;
  onSeeEverything: () => void;
  /** When set, the feed is a player over another screen (a venue's rings) and shows a close button. */
  onClose?: () => void;
  /** A label for the player mode, e.g. the venue's name. */
  title?: string;
};

export function ReelFeed({ entries, onAction, onSearch, onBrowse, onSeeEverything, onClose, title }: ReelFeedProps) {
  const scroller = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const root = scroller.current;
    if (!root || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver((records) => {
      for (const record of records) {
        if (record.isIntersecting && record.intersectionRatio >= 0.6) {
          setActive(Number((record.target as HTMLElement).dataset.index));
        }
      }
    }, { root, threshold: [0.6] });
    for (const child of Array.from(root.children)) observer.observe(child);
    return () => observer.disconnect();
  }, [entries]);

  return (
    <div className={`reel-feed${onClose ? ' reel-feed--player' : ''}`} data-testid="reel-feed">
      <div className="reel-feed__bar">
        {onClose ? (
          <>
            <b className="reel-feed__title">{title}</b>
            <button type="button" className="reel-feed__icon" aria-label="Close" onClick={onClose}><X aria-hidden="true" /></button>
          </>
        ) : (
          <>
            <button type="button" className="reel-feed__icon" aria-label="Search" onClick={onSearch}><MagnifyingGlass aria-hidden="true" /></button>
            <b className="reel-feed__title">For you</b>
            <button type="button" className="reel-feed__browse" onClick={onBrowse}>Browse<CaretDown aria-hidden="true" /></button>
          </>
        )}
      </div>

      <div ref={scroller} className="reel-feed__scroller">
        {entries.map((entry, index) => (
          <div key={entry.story.id} className="reel-feed__slot" data-index={index}>
            <ReelView entry={entry} active={index === active} onAction={onAction} />
          </div>
        ))}
        {onClose ? null : (
          <div className="reel-feed__slot" data-index={entries.length}>
            <section className="reel-end" aria-labelledby="reel-end-title">
              <SquaresFour className="reel-end__mark" aria-hidden="true" />
              <h2 id="reel-end-title">That&rsquo;s everything for now</h2>
              <p>Browse by category, or see every service, partner and place nearby.</p>
              <button type="button" className="guest-button guest-button--primary" onClick={onBrowse}>Browse categories</button>
              <button type="button" className="reel-end__quiet" onClick={onSeeEverything}>See everything</button>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
