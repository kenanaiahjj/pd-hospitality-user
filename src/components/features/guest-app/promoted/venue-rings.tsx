'use client';

import Image from 'next/image';
import type { ReactNode } from 'react';
import type { FeedEntry } from './feed-model';
import type { Story } from './story-model';
import './reels.css';

/*
  The home's stories: one ring per place with something posted -- the hotel,
  then its venues and partners -- the way a stories bar is one ring per
  account. Tapping a ring plays that place's reels; the feed in Explore is
  the same reels mixed for the moment.

  Rings follow the feed's order after the hotel, so the place most worth a
  look right now sits nearest the thumb.
*/

export type VenueRing = { name: string; kind: Story['author']['kind']; image: Story['author']['image']; entries: FeedEntry[] };

/** Enough to scroll, few enough to finish: the feed's order decides who makes it. */
export const MAX_RINGS = 12;

/**
 * One ring per author, in feed order. `lead` -- the hotel's own account --
 * goes first; matched by name, because hotel-run outlets are `property` too
 * and must keep their place in the feed.
 */
export function venueRings(entries: FeedEntry[], lead?: string): VenueRing[] {
  const rings = new Map<string, VenueRing>();
  for (const entry of entries) {
    const { author } = entry.story;
    const ring = rings.get(author.name) ?? { name: author.name, kind: author.kind, image: author.image, entries: [] };
    ring.entries.push(entry);
    rings.set(author.name, ring);
  }
  const all = [...rings.values()];
  return [...all.filter((ring) => ring.name === lead), ...all.filter((ring) => ring.name !== lead)].slice(0, MAX_RINGS);
}

export type VenueRingsProps = {
  entries: FeedEntry[];
  /** Venue names the guest has already watched this session. */
  seen: string[];
  onOpen: (venue: string) => void;
  /** The hotel's own account, which leads the rail. */
  lead?: string;
  /** Rendered above the rail, e.g. the section heading. */
  heading?: ReactNode;
};

export function VenueRings({ entries, seen, onOpen, lead, heading }: VenueRingsProps) {
  const rings = venueRings(entries, lead);
  if (!rings.length) return null;
  return (
    <section className="guest-home-discovery">
      {heading}
      <div className="discover__rail guest-home-stories venue-rings" role="group" aria-label="Stay stories">
        {rings.map((ring) => {
          const watched = seen.includes(ring.name);
          // The venue's best reel right now, not its logo: the tile is a preview.
          const cover = ring.entries[0]!.story.cover;
          return (
            <button
              key={ring.name}
              type="button"
              className="discover__story guest-home-story venue-ring"
              data-seen={watched || undefined}
              aria-label={`${ring.name}${watched ? '' : ', new'}`}
              onClick={() => onOpen(ring.name)}
            >
              <span className="discover__story-ring">
                <span className="discover__story-art">
                  <Image src={cover.src} alt="" fill sizes="74px" style={{ objectPosition: cover.focalPoint }} />
                </span>
              </span>
              <b>{ring.name}</b>
            </button>
          );
        })}
      </div>
    </section>
  );
}
