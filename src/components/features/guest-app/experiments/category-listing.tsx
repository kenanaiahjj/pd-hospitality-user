'use client';

import { ArrowLeft, CaretRight, MapPin } from '@phosphor-icons/react';
import Image from 'next/image';
import type { NearbyPlace } from './nearby-model';
import type { SearchableItem } from './story-model';

/*
  A category, as two lists that are not the same kind of thing.

  On-property is inventory: bookable, charged to the room, the property's own
  word. Nearby is a recommendation: the hotel cannot take the booking and
  should not imply it can. Merging them into one ranked list is the mistake
  that makes hotel directories useless -- a guest cannot tell what the
  building can actually do for them.
*/

export type CategoryListingProps = {
  title: string;
  onProperty: Array<Pick<SearchableItem, 'id' | 'title' | 'price' | 'image'> & { detail: string }>;
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

        <div className="listing__rows">
          {onProperty.map((item) => (
            <button key={item.id} className="listing__row" type="button" onClick={() => onOpenItem(item.id)}>
              <span className="listing__art">
                <Image src={item.image.src} alt="" fill sizes="72px" style={{ objectPosition: item.image.focalPoint }} />
              </span>
              <span className="listing__copy">
                <b>{item.title}</b>
                <small>{item.detail}</small>
              </span>
              <span className="listing__price">{item.price}</span>
            </button>
          ))}
        </div>
      </section>

      {nearby.length > 0 ? (
        <section aria-label="Places nearby">
          <div className="listing__section">
            <h2>Places nearby</h2>
            {/* Said plainly, because the difference is the whole point of
                splitting the lists. */}
            <small>Not ours to book — we can get you there</small>
          </div>

          <div className="listing__rows">
            {nearby.map((place) => (
              <button key={place.id} className="listing__row" type="button" onClick={() => onOpenNearby(place.id)}>
                <span className="listing__art">
                  <Image src={place.image.src} alt="" fill sizes="72px" style={{ objectPosition: place.image.focalPoint }} />
                </span>
                <span className="listing__copy">
                  <b>{place.name}</b>
                  <small>{place.kind} · {place.priceRange}</small>
                </span>
                <span className="listing__away">
                  <MapPin aria-hidden="true" />
                  {place.distanceKm} km
                </span>
                <CaretRight aria-hidden="true" />
              </button>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
