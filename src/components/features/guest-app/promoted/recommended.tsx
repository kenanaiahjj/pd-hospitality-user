'use client';

import Image from 'next/image';
import type { ReactNode } from 'react';
import type { FeedEntry } from './feed-model';
import './reels.css';

/*
  Recommended for you: the home's row of specific things -- a facial, a bar,
  an e-bike -- each one tap from its own page.

  The order is the stay feed's (stay day, time of day, bookings, party), so
  the row changes through the stay the way Explore does. `pinned` is the
  seam for the admin dashboard: when a property curates the row, its picks
  lead in its order and the feed fills the rest.
*/

/** Enough to scroll, few enough to read as a shortlist. */
export const MAX_PICKS = 8;

/** Stay admin, not a recommendation; each has its own prompt on the home. */
const NOT_RECOMMENDED = new Set<FeedEntry['action']['kind']>(['late-checkout', 'departure-ride']);

export function recommendedPicks(entries: FeedEntry[], options: { pinned?: string[]; limit?: number } = {}): FeedEntry[] {
  const eligible = entries.filter((entry) => !entry.booked && !NOT_RECOMMENDED.has(entry.action.kind));
  const pinned = (options.pinned ?? []).flatMap((id) => eligible.filter((entry) => entry.itemId === id));
  const rest = eligible.filter((entry) => !pinned.includes(entry));
  return [...pinned, ...rest].slice(0, options.limit ?? MAX_PICKS);
}

export type RecommendedRailProps = {
  /** Already chosen and ordered; see `recommendedPicks`. */
  entries: FeedEntry[];
  onOpen: (entry: FeedEntry) => void;
  /** Rendered above the row, e.g. the section heading with See all. */
  heading?: ReactNode;
};

export function RecommendedRail({ entries, onOpen, heading }: RecommendedRailProps) {
  if (!entries.length) return null;
  return (
    <section className="guest-home-discovery recommended" aria-label="Recommended for you">
      {heading}
      <div className="recommended__rail">
        {entries.map((entry) => {
          const { story } = entry;
          // A restaurant is its own author; say where it is rather than its name twice.
          const where = story.author.name === story.title ? story.subtitle : story.author.name;
          return (
            <button key={story.id} type="button" className="recommended__card" onClick={() => onOpen(entry)}>
              <span className="recommended__photo">
                <Image src={story.cover.src} alt="" fill sizes="168px" style={{ objectPosition: story.cover.focalPoint }} />
                <span className="recommended__copy">
                  <b>{story.title}</b>
                  <small>{where}</small>
                  {story.price ? (
                    <span className="recommended__price">{story.price}</span>
                  ) : (
                    <span className="recommended__cta">{story.cta}</span>
                  )}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
