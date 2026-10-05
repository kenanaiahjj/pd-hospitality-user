'use client';

import Image from 'next/image';
import { CaretRight } from '@phosphor-icons/react';
import type { StaySearch } from './model';
import { fromPrice, peso, regionTrailFor } from './model';

/*
  The hotels that make one trip, in the order a traveller would take them:
  Dumaguete, then Valencia, then Siquijor. Shown on a hotel page ("Continue
  your trip") and after a stay ("Where to next"), each stop saying how it
  connects to the one before. The hotel the guest is on or just left is marked
  and is not a link. Nothing here books anything: each stop opens its own page.
*/
export function RegionTrail({ hotelId, search, onOpenHotel, title, hereLabel }: {
  hotelId: string | undefined;
  search: StaySearch;
  onOpenHotel: (id: string) => void;
  title: string;
  /** Said on the stop the guest is already at, or has just left. */
  hereLabel: string;
}) {
  const trail = regionTrailFor(hotelId);
  if (!trail) return null;
  return (
    <section className="sb-section sb-trail" aria-labelledby="sb-trail-title">
      <h2 id="sb-trail-title">{title}</h2>
      <p className="sb-small">{trail.label}. Each hotel is booked on its own.</p>
      <ol className="sb-trail__stops">
        {trail.stops.map(({ hotel, hop }) => {
          const here = hotel.id === hotelId;
          const price = fromPrice(hotel, search);
          const body = (
            <>
              <span className="sb-trail__thumb"><Image src={hotel.image.src} alt="" fill sizes="56px" style={{ objectPosition: hotel.image.focalPoint }} /></span>
              <span className="sb-trail__text">
                {hop ? <small className="sb-trail__hop">{hop}</small> : null}
                <b>{hotel.name}</b>
                <small>{hotel.area}{price !== undefined && !here ? ` · from ${peso(price)} a night` : ''}</small>
              </span>
              {here ? <span className="sb-trail__here">{hereLabel}</span> : <CaretRight aria-hidden="true" />}
            </>
          );
          return (
            <li key={hotel.id}>
              {here
                ? <div className="sb-trail__stop is-here">{body}</div>
                : <button type="button" className="sb-trail__stop" onClick={() => onOpenHotel(hotel.id)} aria-label={`${hotel.name}${hop ? `, ${hop}` : ''}`}>{body}</button>}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
