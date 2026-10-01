'use client';

import type { MapClock } from './nearby-map';
import { NearbyMap, PlaceMiniMap } from './nearby-map';
import { directionsUrl, openStatus, walkLabel } from './nearby-place';
import type { MiniAppCategoryId } from './prototype-model';
import { getPropertyImage } from './service-images';
import { Button } from '@/components/ui';
import { ArrowLeft, ArrowRight, Bell, Check, Clock, Copy, Gift, House, MapPin, Minus, NavigationArrow, PersonSimpleWalk, Plus, Storefront, X } from '@phosphor-icons/react';
import { useEffect, useRef, useState } from 'react';

import Image from 'next/image';
/*
  Nearby: independent places around the hotel, as a list, a map and a page
  each, with directions and a ride there.
*/

export type NearbyEstablishment = {
  id: string;
  categoryId: MiniAppCategoryId | 'gifts';
  /** A nearby place is near one hotel only. */
  city: string;
  name: string;
  type: string;
  distance?: string;
  description: string;
  address: string;
  hours: string;
  contact?: string;
  image: string;
};

export const NEARBY_ESTABLISHMENTS: NearbyEstablishment[] = [
  { id: 'kape-lab-manila', city: 'Manila', categoryId: 'dining' as const, name: 'Kape Lab Manila', type: 'Coffee & bakery', distance: '280 m away', description: 'Small-batch coffee, pastries, and early breakfast.', address: '142 Roxas Boulevard, Manila', hours: 'Daily · 6:00 AM–9:00 PM', contact: '+63 917 555 0142', image: 'https://images.unsplash.com/photo-1445116572660-236099ec97a0?auto=format&fit=crop&w=900&q=80' },
  { id: 'bayleaf-kitchen', city: 'Manila', categoryId: 'dining', name: 'Bayleaf Kitchen', type: 'Filipino restaurant', distance: '600 m away', description: 'Independent neighborhood dining with regional Filipino comfort food.', address: '9 Mabini Street, Manila', hours: 'Tue–Sun · 11:00 AM–10:00 PM', contact: '+63 917 555 0161', image: '/experiments/bayleaf-kitchen.jpg' },
  { id: 'sunset-roasters', city: 'Manila', categoryId: 'dining', name: 'Sunset Roasters', type: 'Coffee shop', distance: '850 m away', description: 'A relaxed independent café for coffee, tea, and light bites.', address: '77 Roxas Boulevard, Manila', hours: 'Daily · 7:00 AM–8:00 PM', contact: '+63 917 555 0187', image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=900&q=80' },
  { id: 'hilot-house', city: 'Manila', categoryId: 'spa' as const, name: 'Hilot House', type: 'Independent wellness studio', distance: '450 m away', description: 'A neighborhood studio for traditional hilot and restorative treatments.', address: '18 Adriatico Street, Manila', hours: 'Mon–Sun · 10:00 AM–10:00 PM', contact: '+63 917 555 0198', image: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=900&q=80' },
  { id: 'bamboo-wellness', city: 'Manila', categoryId: 'spa', name: 'Bamboo Wellness Studio', type: 'Massage & wellness', distance: '700 m away', description: 'Independent therapists offering calming massages and wellness rituals.', address: '26 Pedro Gil Street, Manila', hours: 'Daily · 9:00 AM–9:00 PM', contact: '+63 917 555 0133', image: 'https://images.unsplash.com/photo-1519823551278-64ac92734fb1?auto=format&fit=crop&w=900&q=80' },
  { id: 'quiet-corner-yoga', city: 'Manila', categoryId: 'spa', name: 'Quiet Corner Yoga', type: 'Yoga studio', distance: '1 km away', description: 'Small group yoga and breathwork classes for all experience levels.', address: '41 Taft Avenue, Manila', hours: 'Mon–Sat · 7:00 AM–8:00 PM', contact: '+63 917 555 0175', image: 'https://images.unsplash.com/photo-1545205597-3d9d02c29597?auto=format&fit=crop&w=900&q=80' },
  { id: 'manila-heritage-walks', city: 'Manila', categoryId: 'entertainment' as const, name: 'Manila Heritage Walks', type: 'Local tours', distance: '1.2 km away', description: 'Independent walking tours through the city’s historic neighborhoods.', address: 'Plaza Roma, Intramuros, Manila', hours: 'Tours daily · 8:00 AM–5:00 PM', contact: '+63 917 555 0120', image: 'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=900&q=80' },
  { id: 'sunset-bay-cruises', city: 'Manila', categoryId: 'entertainment', name: 'Sunset Bay Cruises', type: 'Harbor experience', distance: '2.4 km away', description: 'Independent sunset cruises with views across Manila Bay.', address: 'Harbor Square, Pasay City', hours: 'Daily departures · 4:00 PM–8:00 PM', contact: '+63 917 555 0154', image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=900&q=80' },
  { id: 'intramuros-cycling', city: 'Manila', categoryId: 'entertainment', name: 'Intramuros Cycle Tours', type: 'Bike tours', distance: '1.8 km away', description: 'Independent guided bicycle tours through Intramuros and nearby streets.', address: 'General Luna Street, Intramuros, Manila', hours: 'Daily · 7:00 AM–6:00 PM', contact: '+63 917 555 0109', image: 'https://images.unsplash.com/photo-1529422643029-d4585747aaf2?auto=format&fit=crop&w=900&q=80' },
  { id: 'escolta-craft-market', city: 'Manila', categoryId: 'services' as const, name: 'Escota Craft Market', type: 'Handicrafts & gifts', distance: '900 m away', description: 'Independent makers offering local crafts, keepsakes, and small gifts.', address: 'Escota Street, Binondo, Manila', hours: 'Friday–Sunday · 10:00 AM–7:00 PM', contact: '+63 917 123 4567', image: 'https://images.unsplash.com/photo-1528698827591-e19ccd7bc23d?auto=format&fit=crop&w=900&q=80' },
  { id: 'manila-laundry-co', city: 'Manila', categoryId: 'services' as const, name: 'Manila Laundry Co.', type: 'Laundry service', distance: '500 m away', description: 'Independent wash-and-fold service with convenient hotel-area pickup.', address: '12 Harrison Street, Pasay City', hours: 'Daily · 8:00 AM–8:00 PM', contact: '+63 917 555 0181', image: 'https://images.unsplash.com/photo-1517677208171-0bc6725a3e60?auto=format&fit=crop&w=900&q=80' },
  { id: 'city-bike-rentals', city: 'Manila', categoryId: 'rentals' as const, name: 'City Bike Rentals', type: 'Bike rental', distance: '1.1 km away', description: 'Independent bicycle rentals for exploring the bay and nearby neighborhoods.', address: '88 M. H. del Pilar Street, Manila', hours: 'Daily · 7:00 AM–7:00 PM', contact: '+63 917 555 0147', image: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=900&q=80' },
  { id: 'manila-makers-market', city: 'Manila', categoryId: 'gifts', name: 'Manila Makers Market', type: 'Local crafts & souvenirs', distance: '750 m away', description: 'Independent makers offering keepsakes, home décor, and pasalubong.', address: '33 Escolta Street, Manila', hours: 'Tue–Sun · 10:00 AM–7:00 PM', contact: '+63 917 555 0116', image: 'https://images.unsplash.com/photo-1452860606245-08befc0ff44b?auto=format&fit=crop&w=900&q=80' },
  { id: 'binondo-pasalubong', city: 'Manila', categoryId: 'gifts', name: 'Binondo Pasalubong House', type: 'Local delicacies', distance: '1.4 km away', description: 'Independent shop for regional snacks, sweets, and take-home treats.', address: '168 Ongpin Street, Binondo, Manila', hours: 'Daily · 9:00 AM–8:00 PM', contact: '+63 917 555 0128', image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=900&q=80' },
  { id: 'artisan-home-studio', city: 'Manila', categoryId: 'gifts', name: 'Artisan Home Studio', type: 'Home décor & crafts', distance: '1.6 km away', description: 'Independent local artists’ studio with ceramics, candles, and small décor.', address: '52 Escolta Street, Manila', hours: 'Wed–Sun · 10:00 AM–6:00 PM', contact: '+63 917 555 0170', image: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=900&q=80' },
];

/** The nearby places as feed reels; cafés are a morning thing. */
export function nearbyFeedInputs(city: string) {
  return NEARBY_ESTABLISHMENTS
    .filter((place) => place.city === city)
    .map((place) => ({
      id: place.id,
      name: place.name,
      type: place.type,
      distance: place.distance,
      image: { src: place.image, alt: place.name, focalPoint: '50% 50%' },
      dayparts: /coffee|café|cafe|bakery/i.test(place.type) ? ['morning' as const] : undefined,
    }));
}

export function NearbyRecommendationCard({ item, onSelect }: { item: NearbyEstablishment; onSelect: (id: string) => void }) {
  return <button className="guest-catalog-option-card guest-catalog-option-card--nearby" type="button" onClick={() => onSelect(item.id)}><div className="guest-catalog-option-card__media"><Image src={item.image} alt="" fill sizes="(max-width: 720px) 84vw, 540px" /><span className="guest-catalog-option-card__name">{item.name}</span></div><div className="guest-catalog-option-card__details"><p>{item.type}</p>{item.distance ? <small>{item.distance}</small> : null}<small>{item.address}</small></div></button>;
}

export function NearbyRecommendations({ categoryId, city, description, onViewAll, onSelect }: { categoryId: MiniAppCategoryId; city: string; description: string; onViewAll: () => void; onSelect: (id: string) => void }) {
  const recommendations = NEARBY_ESTABLISHMENTS.filter((item) => item.categoryId === categoryId && item.city === city);
  const curated = recommendations.slice(0, 4);
  const railRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const updateIndex = () => {
    const rail = railRef.current;
    const card = rail?.querySelector<HTMLElement>('.guest-catalog-option-card');
    if (!rail || !card) return;
    setActiveIndex(Math.min(curated.length - 1, Math.max(0, Math.round(rail.scrollLeft / (card.offsetWidth + 12)))));
  };
  const goTo = (index: number) => railRef.current?.children[index]?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' });
  if (!recommendations.length) return null;
  return <section className="guest-nearby-section"><div className="guest-nearby-heading"><h2>Nearby recommendations</h2><button type="button" onClick={onViewAll}>View all</button></div><p className="guest-nearby-description">{description}</p><div ref={railRef} className="guest-nearby-carousel" onScroll={updateIndex}>{curated.map((item) => <NearbyRecommendationCard key={item.id} item={item} onSelect={onSelect} />)}</div><div className="guest-nearby-dots" aria-label="Nearby recommendations pages">{curated.map((item, index) => <button key={item.id} type="button" className={activeIndex === index ? 'is-active' : ''} aria-label={`Show nearby recommendation ${index + 1}`} aria-current={activeIndex === index} onClick={() => goTo(index)} />)}</div></section>;
}

export function NearbyRecommendationsPage({ categoryId, city, property, now, onSelect }: { categoryId: MiniAppCategoryId; city: string; property: string; now: MapClock; onSelect: (id: string) => void }) {
  const recommendations = NEARBY_ESTABLISHMENTS.filter((item) => item.categoryId === categoryId && item.city === city);
  const [view, setView] = useState<'list' | 'map'>('list');
  return (
    <div className="guest-stack guest-nearby-page">
      <div className="guest-page-title"><h1>Nearby recommendations</h1><p>Independent places close to {property}.</p></div>
      {recommendations.length ? (
        <div className="guest-nearby-view" role="group" aria-label="Show as">
          <button type="button" aria-pressed={view === 'list'} className={view === 'list' ? 'is-active' : ''} onClick={() => setView('list')}>List</button>
          <button type="button" aria-pressed={view === 'map'} className={view === 'map' ? 'is-active' : ''} onClick={() => setView('map')}><MapPin aria-hidden="true" />Map</button>
        </div>
      ) : null}
      {view === 'map' ? (
        <NearbyMap city={city} property={property} propertyImage={getPropertyImage(property).src} places={recommendations} now={now} onSelect={onSelect} />
      ) : (
        <div className="guest-nearby-page__list">{recommendations.map((item) => <NearbyRecommendationCard key={item.id} item={item} onSelect={onSelect} />)}</div>
      )}
    </div>
  );
}

/**
 * Where a place is, the way a Places card says it: a small map with the
 * place and the hotel on it, the address with Directions and Copy, then the
 * hours with whether it is open right now, and the walk from the hotel.
 */
export function PlaceLocationCard({ establishment, city, property, now }: { establishment: NearbyEstablishment; city: string; property: string; now: MapClock }) {
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 1800);
    return () => window.clearTimeout(timer);
  }, [copied]);
  const status = openStatus(establishment.hours, now.date, now.hour);
  const walk = walkLabel(establishment.distance);
  const metres = establishment.distance?.replace(/\s*away$/, '');
  const copy = () => {
    try {
      void navigator.clipboard?.writeText(establishment.address);
    } catch {
      // No clipboard: the address is on screen to read anyway.
    }
    setCopied(true);
  };
  return (
    <section className="guest-place-location" aria-label="Location">
      <PlaceMiniMap
        city={city}
        property={property}
        propertyImage={getPropertyImage(property).src}
        place={{ id: establishment.id, name: establishment.name, type: establishment.type, distance: establishment.distance, image: establishment.image, categoryId: establishment.categoryId }}
      />
      <div className="guest-place-location__body">
        <p className="guest-place-location__address"><MapPin aria-hidden="true" />{establishment.address}</p>
        {walk ? <p className="guest-place-location__walk"><PersonSimpleWalk aria-hidden="true" />{walk}{metres ? ` · ${metres} from ${property}` : ''}</p> : null}
        <div className="guest-place-location__actions">
          <a className="guest-place-location__action guest-place-location__action--primary" href={directionsUrl(establishment.address)} target="_blank" rel="noreferrer">
            <NavigationArrow aria-hidden="true" />Directions
          </a>
          <button type="button" className="guest-place-location__action" onClick={copy} aria-label={copied ? 'Address copied' : 'Copy address'}>
            {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}{copied ? 'Copied' : 'Copy address'}
          </button>
        </div>
        <div className="guest-place-location__hours">
          <Clock aria-hidden="true" />
          <span>
            {status ? <b className={`guest-open-status${status.open ? ' is-open' : ''}`}>{status.label}</b> : null}
            <small>{establishment.hours}</small>
          </span>
        </div>
      </div>
    </section>
  );
}

export type TableRequest = { day: string; time: string; party: number; requests?: string };

/** Times a table can be asked for, within the place's opening hours when they can be read. */
const TABLE_TIMES = ['8:00 AM', '10:00 AM', '12:00 PM', '1:30 PM', '3:00 PM', '6:00 PM', '7:30 PM', '9:00 PM'];
const hourOf = (time: string) => {
  const match = time.match(/(\d{1,2}):(\d{2})\s*([AP]M)/i);
  return match ? (Number(match[1]) % 12) + (match[3]!.toUpperCase() === 'PM' ? 12 : 0) + Number(match[2]) / 60 : undefined;
};
function tableTimes(hours: string): string[] {
  const [open, close] = (hours.match(/\d{1,2}:\d{2}\s*[AP]M/gi) ?? []).map(hourOf);
  if (open === undefined || close === undefined) return TABLE_TIMES;
  // The last table an hour before closing.
  return TABLE_TIMES.filter((time) => { const at = hourOf(time)!; return at >= open && at <= close - 1; });
}

/*
  A table at an independent place is asked for through the front desk: the
  venue is not on Cabana, so the desk calls and confirms in chat. Free to ask;
  the meal is paid at the place.
*/
function TableRequestSheet({ establishment, days, defaultParty, dayLabel, onClose, onSubmit }: {
  establishment: NearbyEstablishment;
  days: string[];
  defaultParty: number;
  dayLabel: (day: string) => string;
  onClose: () => void;
  onSubmit: (request: TableRequest) => void;
}) {
  const times = tableTimes(establishment.hours);
  const [day, setDay] = useState(days[0] ?? '');
  const [time, setTime] = useState(times.find((option) => (hourOf(option) ?? 0) >= 18) ?? times[0] ?? '');
  const [party, setParty] = useState(Math.max(1, defaultParty));
  const [requests, setRequests] = useState('');
  return (
    <div className="guest-sheet-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="guest-order-tray guest-table-request" role="dialog" aria-modal="true" aria-labelledby="guest-table-request-title">
        <header className="guest-order-tray__header">
          <div><h2 id="guest-table-request-title">Reserve a table</h2><p>{establishment.name} · {establishment.type}</p></div>
          <button className="guest-order-tray__close" type="button" onClick={onClose} aria-label="Close"><X /></button>
        </header>
        <div className="guest-table-request__body">
          <fieldset><legend>Day</legend>
            <div className="guest-table-request__chips">{days.map((option) => <button key={option} type="button" aria-pressed={day === option} onClick={() => setDay(option)}>{dayLabel(option)}</button>)}</div>
          </fieldset>
          <fieldset><legend>Time</legend>
            <div className="guest-table-request__chips">{times.map((option) => <button key={option} type="button" aria-pressed={time === option} onClick={() => setTime(option)}>{option}</button>)}</div>
          </fieldset>
          <div className="guest-table-request__party">
            <span><b>Guests</b><small>Up to 10</small></span>
            <span className="guest-table-request__stepper">
              <button type="button" aria-label="Fewer guests" disabled={party <= 1} onClick={() => setParty(party - 1)}><Minus aria-hidden="true" /></button>
              <output aria-live="polite">{party}</output>
              <button type="button" aria-label="More guests" disabled={party >= 10} onClick={() => setParty(party + 1)}><Plus aria-hidden="true" /></button>
            </span>
          </div>
          <label className="guest-table-request__requests">
            <span>Special requests <small>Optional</small></span>
            <textarea rows={2} maxLength={240} value={requests} placeholder="A high chair if possible, a table by the window, a birthday…" onChange={(event) => setRequests(event.currentTarget.value)} />
            <small>The desk passes these on; the venue does its best.</small>
          </label>
          <p className="guest-table-request__note">{establishment.name} isn’t on Cabana, so the front desk calls to book it and confirms here in chat. Nothing to pay now.</p>
        </div>
        <Button className="guest-button guest-button--primary" type="button" disabled={!day || !time} onClick={() => onSubmit({ day, time, party, requests: requests.trim() || undefined })}>Ask the front desk to reserve<ArrowRight aria-hidden="true" /></Button>
      </section>
    </div>
  );
}

export function NearbyEstablishmentScreen({ establishment, city, property, now, onBack, onNotifications, onBookRide, onReserveTable, reserveDays = [], dayLabel = (day) => day, defaultParty = 2 }: {
  establishment: NearbyEstablishment;
  city: string;
  property: string;
  now: MapClock;
  onBack: () => void;
  onNotifications: () => void;
  onBookRide: () => void;
  /** Restaurants and cafes: a table, asked for through the desk, instead of a ride. */
  onReserveTable?: (request: TableRequest) => void;
  reserveDays?: string[];
  dayLabel?: (day: string) => string;
  defaultParty?: number;
}) {
  const [reserving, setReserving] = useState(false);
  const reservable = establishment.categoryId === 'dining' && Boolean(onReserveTable) && reserveDays.length > 0;
  return <div className="guest-stack guest-nearby-detail">
    <section className="guest-nearby-detail__hero" aria-label={`${establishment.name} overview`}>
      <Image src={establishment.image} alt="" fill sizes="100vw" priority />
      <div className="guest-nearby-detail__scrim" aria-hidden="true" />
      <button className="guest-nearby-detail__control guest-nearby-detail__back" type="button" onClick={onBack} aria-label="Back"><ArrowLeft /></button>
      <button className="guest-nearby-detail__control guest-nearby-detail__notifications" type="button" onClick={onNotifications} aria-label="Notifications"><Bell /></button>
      <div className="guest-nearby-detail__hero-copy">
        <h1>{establishment.name}</h1>
        <div className="guest-nearby-detail__tags" aria-label="Recommendation details"><span>{establishment.type}</span><span>Independent</span></div>
      </div>
    </section>

    <PlaceLocationCard establishment={establishment} city={city} property={property} now={now} />

    <section className="guest-nearby-detail__about">
      <h2>About</h2>
      <p>{establishment.description}</p>
      {establishment.contact ? <div className="guest-nearby-detail__contact"><small>Contact</small><a href={`tel:${establishment.contact.replace(/\s/g, '')}`}>{establishment.contact}</a></div> : null}
    </section>

    <section className="guest-nearby-detail__good-to-know">
      <h2>Good to know</h2>
      <div className="guest-nearby-detail__facts">
        <span><Storefront aria-hidden="true" /><b>Independently operated</b></span>
        <span><House aria-hidden="true" /><b>Outside the hotel</b></span>
        {establishment.categoryId === 'gifts' ? <span><Gift aria-hidden="true" /><b>Local handicrafts and gifts</b></span> : null}
        {establishment.distance ? <span><PersonSimpleWalk aria-hidden="true" /><b>{establishment.distance}</b></span> : null}
      </div>
    </section>

    <div className="guest-nearby-detail__cta">
      {reservable
        ? <Button className="guest-button guest-button--primary" type="button" onClick={() => setReserving(true)}>Reserve a table<ArrowRight /></Button>
        : <Button className="guest-button guest-button--primary" type="button" onClick={onBookRide}>Book a ride<ArrowRight /></Button>}
    </div>
    {reserving && onReserveTable ? (
      <TableRequestSheet establishment={establishment} days={reserveDays} defaultParty={defaultParty} dayLabel={dayLabel} onClose={() => setReserving(false)} onSubmit={(request) => { setReserving(false); onReserveTable(request); }} />
    ) : null}
  </div>;
}
