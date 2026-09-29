'use client';

import Image from 'next/image';
import dynamic from 'next/dynamic';
import { AirplaneTilt, Anchor, MapPin, Bank, Basket, Church, Coffee, FirstAidKit, ForkKnife, Martini, Money, ShoppingBag, Storefront, Tree, Umbrella, Buildings } from '@phosphor-icons/react';
import { useState, type ReactNode } from 'react';
import type { StayHotel } from './model';
import type { NearbyIcon, NearbyKind } from './neighbourhood';
import { findNeighbourhood, hotelHighlights, travelLabel } from './neighbourhood';

// Leaflet reads `window` at import.
const NeighbourhoodMap = dynamic(() => import('./neighbourhood-map').then((module) => module.NeighbourhoodMap), { ssr: false });

const ICONS: Record<NearbyIcon, ReactNode> = {
  landmark: <Buildings />,
  beach: <Umbrella />,
  mall: <ShoppingBag />,
  nature: <Tree />,
  museum: <Bank />,
  food: <ForkKnife />,
  cafe: <Coffee />,
  bar: <Martini />,
  store: <Storefront />,
  pharmacy: <FirstAidKit />,
  atm: <Money />,
  airport: <AirplaneTilt />,
  market: <Basket />,
  church: <Church />,
  port: <Anchor />,
};

const TABS: { id: NearbyKind; label: string }[] = [
  { id: 'attraction', label: 'Attractions' },
  { id: 'food', label: 'Food' },
  { id: 'essential', label: 'Essentials' },
];

/** What is around the hotel, as a reason to book it: sights, food, and the 7-Eleven. */
export function NeighbourhoodSection({ hotel }: { hotel: StayHotel }) {
  const [kind, setKind] = useState<NearbyKind>('attraction');
  const { spots } = findNeighbourhood(hotel.id);
  if (!spots.length) return null;
  const shown = spots.filter((item) => item.kind === kind);
  return (
    <section className="sb-section sb-hood" aria-labelledby="sb-hood-title">
      <div className="sb-section__head">
        <h2 id="sb-hood-title">What’s nearby</h2>
        <p>{hotel.area}</p>
      </div>
      <NeighbourhoodMap hotel={hotel} kind={kind} />
      <div className="sb-segmented sb-hood__tabs" role="tablist" aria-label="Nearby">
        {TABS.map((tab) => (
          <button key={tab.id} type="button" role="tab" aria-selected={kind === tab.id} onClick={() => setKind(tab.id)}>{tab.label}</button>
        ))}
      </div>
      <ul className="sb-hood__list" role="tabpanel" aria-label={TABS.find((tab) => tab.id === kind)?.label}>
        {shown.map((item) => (
          <li key={item.id}>
            <span className="sb-hood__icon" data-kind={item.kind} aria-hidden="true">{ICONS[item.icon]}</span>
            <span className="sb-hood__text"><b>{item.name}</b><small>{item.type}</small></span>
            <span className="sb-hood__time">{travelLabel(item)}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Partners and hotel venues a guest can book in the app once they are staying. */
export function PartnersSection({ hotel }: { hotel: StayHotel }) {
  const { partners } = findNeighbourhood(hotel.id);
  if (!partners.length) return null;
  return (
    <section className="sb-section sb-partners" aria-labelledby="sb-partners-title">
      <div className="sb-section__head">
        <h2 id="sb-partners-title">Only with a stay here</h2>
        <p>Book these in the app once you’ve checked in, and pay on your room bill or in the app.</p>
      </div>
      <div className="sb-rail sb-partners__rail">
        {partners.map((item) => (
          <article key={item.id} className="sb-partner" aria-label={item.name}>
            <span className="sb-partner__photo"><Image src={item.image.src} alt="" fill sizes="200px" style={{ objectPosition: item.image.focalPoint }} /></span>
            <span className="sb-partner__body">
              <small>{item.type} · {item.operator === 'hotel' ? 'At the hotel' : 'Partner'}</small>
              <b>{item.name}</b>
              <span>{item.detail}</span>
            </span>
          </article>
        ))}
      </div>
    </section>
  );
}

/** "Manila Bay sunset strip 10 min walk · 7-Eleven 2 min", each phrase kept whole. */
export function HotelHighlights({ hotelId }: { hotelId: string }) {
  const parts = hotelHighlights(hotelId);
  if (!parts.length) return null;
  return (
    <span className="sb-highlight">
      {parts.map((part, i) => (
        <span key={part} className="sb-highlight__part">
          {i === 0 ? <MapPin weight="fill" aria-hidden="true" /> : <Storefront weight="fill" aria-hidden="true" />}{part}
        </span>
      ))}
    </span>
  );
}
