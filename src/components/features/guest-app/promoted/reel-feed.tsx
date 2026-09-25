'use client';

import { CaretDown, SquaresFour, X } from '@phosphor-icons/react';
import { useEffect, useRef, useState } from 'react';
import type { FeedEntry } from './feed-model';
import { ReelView } from './reel-view';
import { StayReviewForm, type StayReviewFormProps } from '../stay-review-form';
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
  /** The feed's own bar and end card; a venue player has neither. */
  onBrowse?: () => void;
  onSeeEverything?: () => void;
  /** When set, the feed is a player over another screen (a venue's rings) and shows a close button. */
  onClose?: () => void;
  /** A label for the player mode, e.g. the venue's name. */
  title?: string;
  /** A stay-end check-in that belongs inside the Explore feed. */
  stayFeedback?: Omit<StayReviewFormProps, 'mode' | 'onBackToMyStay'>;
};

export function ReelFeed({ entries, onAction, onBrowse, onSeeEverything, onClose, title, stayFeedback }: ReelFeedProps) {
  const scroller = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const hasStayFeedback = Boolean(stayFeedback);
  const hasCloseButton = Boolean(onClose);

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
  }, [entries, hasStayFeedback, hasCloseButton]);

  const feedbackIndex = Math.min(3, entries.length);
  const feedbackOffset = stayFeedback ? 1 : 0;

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
            <b className="reel-feed__title">For you</b>
            <button type="button" className="reel-feed__browse" onClick={onBrowse}>Browse<CaretDown aria-hidden="true" /></button>
          </>
        )}
      </div>

      <div ref={scroller} className="reel-feed__scroller">
        {entries.slice(0, feedbackIndex).map((entry, index) => (
          <div key={entry.story.id} className="reel-feed__slot" data-index={index}>
            <ReelView entry={entry} active={index === active} onAction={onAction} />
          </div>
        ))}
        {stayFeedback ? (
          <div className="reel-feed__slot" key="stay-feedback" data-index={feedbackIndex}>
            <StayReviewForm mode="feed" {...stayFeedback} />
          </div>
        ) : null}
        {entries.slice(feedbackIndex).map((entry, offset) => {
          const index = feedbackIndex + feedbackOffset + offset;
          return (
            <div key={entry.story.id} className="reel-feed__slot" data-index={index}>
              <ReelView entry={entry} active={index === active} onAction={onAction} />
            </div>
          );
        })}
        {onClose ? null : (
          <div className="reel-feed__slot" data-index={entries.length + feedbackOffset}>
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
