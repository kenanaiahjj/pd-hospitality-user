'use client';

import { ArrowLeft, ArrowRight, Car, Coins, MapPin, Phone } from '@phosphor-icons/react';
import Image from 'next/image';
import { Button } from '@/components/ui';
import type { NearbyPlace } from './nearby-model';
import { describeSpend } from './nearby-model';

/*
  An off-property place, and the only thing the hotel can sell about it.

  No booking button, because there is no booking to take -- the property does
  not hold this restaurant's tables and a button implying otherwise would
  fail the first guest who pressed it. What it has is the address, a number
  to call, where it is, and a car that already knows the way.
*/

export type NearbyDetailProps = {
  place: NearbyPlace;
  onBack: () => void;
  onBookRide: (placeId: string) => void;
};

export function NearbyDetail({ place, onBack, onBookRide }: NearbyDetailProps) {
  const spend = describeSpend(place.priceRange);

  return (
    <div className="nearby" data-testid="nearby-detail">
      {/*
        The same anatomy as the service detail: photograph, then title, then
        facts, then a docked action. A guest crosses between these two screens
        constantly -- on-property card, nearby card, back, forward -- and two
        different shapes for the same job is what makes a flow feel like parts
        rather than an app. The card that led here had a photograph; arriving
        at a screen without one read as a step backwards.
      */}
      <div className="nearby__art">
        <Image
          src={place.image.src}
          alt=""
          fill
          sizes="480px"
          style={{ objectPosition: place.image.focalPoint }}
          priority
        />
        <span className="nearby__art-scrim" aria-hidden="true" />
        <button className="detail__back" type="button" onClick={onBack} aria-label="Back">
          <ArrowLeft aria-hidden="true" />
        </button>
      </div>

      <div className="nearby__title">
        <h1>{place.name}</h1>
        <p>{place.kind} · {place.distanceKm} km away, about {place.minutesByCar} minutes by car</p>
      </div>

      {/*
        Drawn, not fetched. A map tile service in the render path is a third
        party that can be blocked, rate-limited or offline in front of a guest,
        and this needs to say "roughly here, this far" rather than navigate.
      */}
      <div className="nearby__map" role="img" aria-label={`Map showing ${place.name}, ${place.distanceKm} km from the property`}>
        <svg viewBox="0 0 320 180" aria-hidden="true">
          <rect width="320" height="180" className="nearby__map-ground" />
          <g className="nearby__map-roads">
            <path d="M-10 58 H330" /><path d="M-10 118 H330" />
            <path d="M74 -10 V190" /><path d="M196 -10 V190" />
            <path d="M-10 150 L120 20" />
          </g>
          <circle cx="74" cy="118" r="7" className="nearby__map-origin" />
          <g className="nearby__map-route"><path d="M74 118 L74 58 L196 58" /></g>
          <g transform="translate(196 58)">
            <circle r="13" className="nearby__map-halo" />
            <circle r="6" className="nearby__map-pin" />
          </g>
        </svg>
        <span className="nearby__map-key">
          <i className="nearby__map-key-origin" aria-hidden="true" />The Henry Manila
          <i className="nearby__map-key-pin" aria-hidden="true" />{place.name}
        </span>
      </div>

      <dl className="nearby__facts">
        <div>
          <dt><MapPin aria-hidden="true" />Address</dt>
          <dd>{place.address}</dd>
        </div>
        <div>
          <dt><Phone aria-hidden="true" />Phone</dt>
          {/* A link, because the one useful thing a guest does with a number
              on a phone is press it. */}
          <dd><a href={`tel:${place.phone.replace(/\s/g, '')}`}>{place.phone}</a></dd>
        </div>
        {spend ? (
          <div>
            <dt><Coins aria-hidden="true" />Typical spend</dt>
            <dd>{place.priceRange === spend ? spend : `${place.priceRange} · ${spend}`}</dd>
          </div>
        ) : null}
      </dl>

      {/* Docked like the service detail's, for the same reason: the price and
          the one action the hotel can actually take belong together and in
          reach. */}
      <div className="nearby__dock">
        <span className="detail__price">
          <i>Hotel car, each way</i>
          <b>From {place.rideFrom}</b>
        </span>
        <Button className="guest-button guest-button--primary" type="button" onClick={() => onBookRide(place.id)}>
          <Car aria-hidden="true" />Book a hotel car<ArrowRight aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}
