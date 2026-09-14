'use client';

import { ArrowLeft, ArrowUpRight, Clock, MapPin } from '@phosphor-icons/react';
import Image from 'next/image';
import type { NearbyPlace } from './nearby-model';
import type { ServiceImageDefinition } from '../service-images';

/*
  A category, as two lists that are visibly not the same kind of thing.

  On-property is inventory: bookable, charged to the room. Nearby is a
  recommendation the hotel cannot take a booking for. The difference is
  carried by the layout as well as the labels -- a vertical stack of cards
  asks to be chosen from, a horizontal rail asks to be browsed -- because a
  guest skims the shape of a screen long before they read its headings.

  Five identical rows was the previous version, and it was the flattest
  possible answer: nothing led, the photographs were too small to make
  anyone hungry, and every item asked for exactly as much attention as the
  next.
*/

export type ListingItem = {
  id: string;
  title: string;
  detail: string;
  price: string;
  note?: string;
  image: ServiceImageDefinition;
};

export type CategoryListingProps = {
  title: string;
  onProperty: ListingItem[];
  nearby: NearbyPlace[];
  onBack: () => void;
  onOpenItem: (itemId: string) => void;
  onOpenNearby: (placeId: string) => void;
};

export function CategoryListing({
  title,
  onProperty,
  nearby,
  onBack,
  onOpenItem,
  onOpenNearby,
}: CategoryListingProps) {
  const [lead, ...rest] = onProperty;

  return (
    <div className="listing" data-testid="category-listing">
      <div className="listing__head">
        <button className="listing__back" type="button" onClick={onBack} aria-label="Back">
          <ArrowLeft aria-hidden="true" />
        </button>
        <h1>{title}</h1>
      </div>

      <section aria-label="On property">
        <div className="listing__section">
          <h2>In the building</h2>
          <small>Book it here, charged to your room</small>
        </div>

        {lead ? (
          /* One venue gets the room to look appetising. A grid where
             everything is medium reads as a catalogue; something has to lead. */
          <button className="listing__lead" type="button" onClick={() => onOpenItem(lead.id)}>
            <Image src={lead.image.src} alt="" fill sizes="480px" style={{ objectPosition: lead.image.focalPoint }} priority />
            <span className="listing__lead-scrim" aria-hidden="true" />
            <span className="listing__lead-copy">
              <b>{lead.title}</b>
              <small>{lead.detail}</small>
              <span className="listing__chips">
                <i className="listing__chip listing__chip--price">{lead.price}</i>
                {lead.note ? <i className="listing__chip"><Clock aria-hidden="true" />{lead.note}</i> : null}
              </span>
            </span>
          </button>
        ) : null}

        <div className="listing__grid">
          {rest.map((item) => (
            <button key={item.id} className="listing__tile" type="button" onClick={() => onOpenItem(item.id)}>
              <span className="listing__tile-art">
                <Image src={item.image.src} alt="" fill sizes="200px" style={{ objectPosition: item.image.focalPoint }} />
              </span>
              <span className="listing__tile-copy">
                <b>{item.title}</b>
                <small>{item.detail}</small>
                <i>{item.price}</i>
              </span>
            </button>
          ))}
        </div>
      </section>

      {nearby.length > 0 ? (
        <section aria-label="Places nearby">
          <div className="listing__section">
            <h2>Places nearby</h2>
            {/* Said plainly, because the difference is the point of the split. */}
            <small>Not ours to book — we can get you there</small>
          </div>

          <div className="listing__rail">
            {nearby.map((place) => (
              <button key={place.id} className="listing__near" type="button" onClick={() => onOpenNearby(place.id)}>
                <span className="listing__near-art">
                  <Image src={place.image.src} alt="" fill sizes="200px" style={{ objectPosition: place.image.focalPoint }} />
                  <span className="listing__near-away">
                    <MapPin aria-hidden="true" weight="fill" />{place.distanceKm} km
                  </span>
                </span>
                <span className="listing__near-copy">
                  <b>{place.name}</b>
                  <small>{place.kind}</small>
                  <span>{place.priceRange} · {place.minutesByCar} min by car<ArrowUpRight aria-hidden="true" /></span>
                </span>
              </button>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
