'use client';

import type { MapClock } from './nearby-map';
import { NearbyMap, PlaceMiniMap } from './nearby-map';
import { directionsUrl, openStatus, walkLabel } from './nearby-place';
import type { MiniAppCategoryId } from './prototype-model';
import { getPropertyImage } from './service-images';
import { Button } from '@/components/ui';
import { ArrowLeft, ArrowRight, Bell, Check, Clock, Copy, Gift, House, MapPin, Minus, NavigationArrow, PersonSimpleWalk, Phone, Plus, Storefront, X } from '@phosphor-icons/react';
import { useEffect, useRef, useState } from 'react';
import { GatewayCheckout, type GatewayMethod } from './gateway-checkout';
import { formatPesoAmount } from './prototype-model';

import Image from 'next/image';
/* Nearby vendors around the hotel, with direct booking and directions. */

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
  /** All nearby listings are connected to their vendor for direct booking. */
  bookingIntegration: true;
  /** Present only when the connected vendor can quote and collect payment in Cabana. */
  paymentIntegration?: { amount: number; basis: 'booking' | 'guest' | 'unit' };
};

const nearbyVendors: Omit<NearbyEstablishment, 'bookingIntegration'>[] = [
  { id: 'kape-lab-manila', city: 'Manila', categoryId: 'dining' as const, name: 'Kape Lab Manila', type: 'Coffee & bakery', distance: '280 m away', description: 'Small-batch coffee, pastries, and early breakfast.', address: '142 Roxas Boulevard, Manila', hours: 'Daily · 6:00 AM–9:00 PM', contact: '+63 917 555 0142', image: 'https://images.unsplash.com/photo-1445116572660-236099ec97a0?auto=format&fit=crop&w=900&q=80' },
  { id: 'bayleaf-kitchen', city: 'Manila', categoryId: 'dining', name: 'Bayleaf Kitchen', type: 'Filipino restaurant', distance: '600 m away', description: 'Neighborhood dining with regional Filipino comfort food.', address: '9 Mabini Street, Manila', hours: 'Tue–Sun · 11:00 AM–10:00 PM', contact: '+63 917 555 0161', image: '/experiments/bayleaf-kitchen.jpg' },
  { id: 'sunset-roasters', city: 'Manila', categoryId: 'dining', name: 'Sunset Roasters', type: 'Coffee shop', distance: '850 m away', description: 'A relaxed café for coffee, tea, and light bites.', address: '77 Roxas Boulevard, Manila', hours: 'Daily · 7:00 AM–8:00 PM', contact: '+63 917 555 0187', image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=900&q=80' },
  { id: 'hilot-house', city: 'Manila', categoryId: 'spa' as const, name: 'Hilot House', type: 'Independent wellness studio', distance: '450 m away', description: 'A neighborhood studio for traditional hilot and restorative treatments.', address: '18 Adriatico Street, Manila', hours: 'Mon–Sun · 10:00 AM–10:00 PM', contact: '+63 917 555 0198', image: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=900&q=80' },
  { id: 'bamboo-wellness', city: 'Manila', categoryId: 'spa', name: 'Bamboo Wellness Studio', type: 'Massage & wellness', distance: '700 m away', description: 'Independent therapists offering calming massages and wellness rituals.', address: '26 Pedro Gil Street, Manila', hours: 'Daily · 9:00 AM–9:00 PM', contact: '+63 917 555 0133', image: 'https://images.unsplash.com/photo-1519823551278-64ac92734fb1?auto=format&fit=crop&w=900&q=80' },
  { id: 'quiet-corner-yoga', city: 'Manila', categoryId: 'spa', name: 'Quiet Corner Yoga', type: 'Yoga studio', distance: '1 km away', description: 'Small group yoga and breathwork classes for all experience levels.', address: '41 Taft Avenue, Manila', hours: 'Mon–Sat · 7:00 AM–8:00 PM', contact: '+63 917 555 0175', image: 'https://images.unsplash.com/photo-1545205597-3d9d02c29597?auto=format&fit=crop&w=900&q=80' },
  { id: 'manila-heritage-walks', city: 'Manila', categoryId: 'entertainment' as const, name: 'Manila Heritage Walks', type: 'Local tours', distance: '1.2 km away', description: 'Guided walking tours through the city’s historic neighborhoods.', address: 'Plaza Roma, Intramuros, Manila', hours: 'Tours daily · 8:00 AM–5:00 PM', contact: '+63 917 555 0120', image: 'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=900&q=80', paymentIntegration: { amount: 1500, basis: 'guest' } },
  { id: 'sunset-bay-cruises', city: 'Manila', categoryId: 'entertainment', name: 'Sunset Bay Cruises', type: 'Harbor experience', distance: '2.4 km away', description: 'Sunset cruises with views across Manila Bay.', address: 'Harbor Square, Pasay City', hours: 'Daily departures · 4:00 PM–8:00 PM', contact: '+63 917 555 0154', image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=900&q=80' },
  { id: 'intramuros-cycling', city: 'Manila', categoryId: 'entertainment', name: 'Intramuros Cycle Tours', type: 'Bike tours', distance: '1.8 km away', description: 'Guided bicycle tours through Intramuros and nearby streets.', address: 'General Luna Street, Intramuros, Manila', hours: 'Daily · 7:00 AM–6:00 PM', contact: '+63 917 555 0109', image: 'https://images.unsplash.com/photo-1529422643029-d4585747aaf2?auto=format&fit=crop&w=900&q=80' },
  { id: 'escolta-craft-market', city: 'Manila', categoryId: 'services' as const, name: 'Escota Craft Market', type: 'Handicrafts & gifts', distance: '900 m away', description: 'Independent makers offering local crafts, keepsakes, and small gifts.', address: 'Escota Street, Binondo, Manila', hours: 'Friday–Sunday · 10:00 AM–7:00 PM', contact: '+63 917 123 4567', image: 'https://images.unsplash.com/photo-1528698827591-e19ccd7bc23d?auto=format&fit=crop&w=900&q=80' },
  { id: 'manila-laundry-co', city: 'Manila', categoryId: 'services' as const, name: 'Manila Laundry Co.', type: 'Laundry service', distance: '500 m away', description: 'Independent wash-and-fold service with convenient hotel-area pickup.', address: '12 Harrison Street, Pasay City', hours: 'Daily · 8:00 AM–8:00 PM', contact: '+63 917 555 0181', image: 'https://images.unsplash.com/photo-1517677208171-0bc6725a3e60?auto=format&fit=crop&w=900&q=80' },
  { id: 'city-bike-rentals', city: 'Manila', categoryId: 'rentals' as const, name: 'City Bike Rentals', type: 'Bike rental', distance: '1.1 km away', description: 'Independent bicycle rentals for exploring the bay and nearby neighborhoods.', address: '88 M. H. del Pilar Street, Manila', hours: 'Daily · 7:00 AM–7:00 PM', contact: '+63 917 555 0147', image: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=900&q=80' },
  { id: 'manila-makers-market', city: 'Manila', categoryId: 'gifts', name: 'Manila Makers Market', type: 'Local crafts & souvenirs', distance: '750 m away', description: 'Independent makers offering keepsakes, home décor, and pasalubong.', address: '33 Escolta Street, Manila', hours: 'Tue–Sun · 10:00 AM–7:00 PM', contact: '+63 917 555 0116', image: 'https://images.unsplash.com/photo-1452860606245-08befc0ff44b?auto=format&fit=crop&w=900&q=80' },
  { id: 'binondo-pasalubong', city: 'Manila', categoryId: 'gifts', name: 'Binondo Pasalubong House', type: 'Local delicacies', distance: '1.4 km away', description: 'Independent shop for regional snacks, sweets, and take-home treats.', address: '168 Ongpin Street, Binondo, Manila', hours: 'Daily · 9:00 AM–8:00 PM', contact: '+63 917 555 0128', image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=900&q=80' },
  { id: 'artisan-home-studio', city: 'Manila', categoryId: 'gifts', name: 'Artisan Home Studio', type: 'Home décor & crafts', distance: '1.6 km away', description: 'Independent local artists’ studio with ceramics, candles, and small décor.', address: '52 Escolta Street, Manila', hours: 'Wed–Sun · 10:00 AM–6:00 PM', contact: '+63 917 555 0170', image: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=900&q=80' },
];

export const NEARBY_ESTABLISHMENTS: NearbyEstablishment[] = nearbyVendors.map((vendor) => ({ ...vendor, bookingIntegration: true }));

const NEARBY_CATEGORIES: { id: MiniAppCategoryId; title: string; description: string }[] = [
  { id: 'dining', title: 'Food & drink', description: 'Restaurants, cafés and local favorites' },
  { id: 'entertainment', title: 'Tours & attractions', description: 'Local guides and things to do' },
  { id: 'spa', title: 'Wellness', description: 'Spas, massage and movement' },
  { id: 'rentals', title: 'Rentals', description: 'Bikes and ways to get around' },
  { id: 'services', title: 'Local services', description: 'Useful places and neighborhood finds' },
];

/** A compact visual index for local categories, shown before room check-in. */
export function NearbyDiscoverySection({ city, property, empty = false, onSelect }: { city: string; property: string; empty?: boolean; onSelect: (category: MiniAppCategoryId) => void }) {
  const categories = empty ? [] : NEARBY_CATEGORIES.flatMap((category) => {
    const places = NEARBY_ESTABLISHMENTS.filter((place) => place.city === city && place.categoryId === category.id);
    const featured = places[0];
    return featured ? [{ ...category, featured, count: places.length }] : [];
  });

  if (!categories.length) {
    return (
      <section className="guest-nearby-discovery" aria-label="Explore nearby">
        <div className="guest-nearby-discovery__heading"><h2>Explore nearby</h2><p>Restaurants, tours, rentals and more around {property}.</p></div>
        <p className="guest-nearby-discovery__empty">Nearby places aren’t listed yet.</p>
      </section>
    );
  }

  return (
    <section className="guest-nearby-discovery" aria-label="Explore nearby">
      <div className="guest-nearby-discovery__heading"><h2>Explore nearby</h2><p>Restaurants, tours, rentals and more around {property}.</p></div>
      <div className="guest-nearby-category-grid">
        {categories.map((category) => (
          <button className="guest-nearby-category-card" key={category.id} type="button" onClick={() => onSelect(category.id)}>
            <Image src={category.featured.image} alt="" fill sizes="(max-width: 600px) 44vw, 260px" />
            <span className="guest-nearby-category-card__scrim" aria-hidden="true" />
            <span className="guest-nearby-category-card__copy">
              <small>{category.count} {category.count === 1 ? 'place' : 'places'}</small>
              <b>{category.title}</b>
              <span>{category.description}</span>
            </span>
            <ArrowRight className="guest-nearby-category-card__arrow" aria-hidden="true" />
          </button>
        ))}
      </div>
    </section>
  );
}

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
  const title = NEARBY_CATEGORIES.find((category) => category.id === categoryId)?.title ?? 'Nearby places';
  const [view, setView] = useState<'list' | 'map'>('list');
  return (
    <div className="guest-stack guest-nearby-page">
      <div className="guest-page-title"><h1>{title}</h1><p>Book directly with local vendors near {property}.</p></div>
      {recommendations.length ? (
        <div className="guest-nearby-view" role="group" aria-label="Show as">
          <button type="button" aria-pressed={view === 'list'} className={view === 'list' ? 'is-active' : ''} onClick={() => setView('list')}>List</button>
          <button type="button" aria-pressed={view === 'map'} className={view === 'map' ? 'is-active' : ''} onClick={() => setView('map')}><MapPin aria-hidden="true" />Map</button>
        </div>
      ) : null}
      {!recommendations.length ? (
        <p className="guest-nearby-discovery__empty">No {title.toLowerCase()} are listed around {property} yet.</p>
      ) : view === 'map' ? (
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
export type NearbyBookingRequest = TableRequest & { quantity?: number; paymentMethod?: GatewayMethod | 'room' };

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

/* Reserve a table through the restaurant's booking integration. */
function TableRequestSheet({ establishment, days, defaultParty, dayLabel, times, maxParty, onClose, onSubmit }: {
  establishment: NearbyEstablishment;
  days: string[];
  defaultParty: number;
  dayLabel: (day: string) => string;
  times: readonly string[];
  maxParty: number;
  onClose: () => void;
  onSubmit: (request: TableRequest) => void;
}) {
  const availableTimes = [...times];
  const [day, setDay] = useState(days[0] ?? '');
  const [time, setTime] = useState(availableTimes.find((option) => (hourOf(option) ?? 0) >= 18) ?? availableTimes[0] ?? '');
  const [party, setParty] = useState(Math.min(maxParty, Math.max(1, defaultParty)));
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
            <div className="guest-table-request__chips">{availableTimes.map((option) => <button key={option} type="button" aria-pressed={time === option} onClick={() => setTime(option)}>{option}</button>)}</div>
          </fieldset>
          <div className="guest-table-request__party">
            <span><b>Guests</b><small>Up to {maxParty}</small></span>
            <span className="guest-table-request__stepper">
              <button type="button" aria-label="Fewer guests" disabled={party <= 1} onClick={() => setParty(party - 1)}><Minus aria-hidden="true" /></button>
              <output aria-live="polite">{party}</output>
              <button type="button" aria-label="More guests" disabled={party >= maxParty} onClick={() => setParty(party + 1)}><Plus aria-hidden="true" /></button>
            </span>
          </div>
          <label className="guest-table-request__requests">
            <span>Special requests <small>Optional</small></span>
            <textarea rows={2} maxLength={240} value={requests} placeholder="A high chair if possible, a table by the window, a birthday…" onChange={(event) => setRequests(event.currentTarget.value)} />
            <small>Sent to {establishment.name} with your reservation.</small>
          </label>
          <p className="guest-table-request__note">These times are available from {establishment.name}. Your table is confirmed when you reserve.</p>
        </div>
        <Button className="guest-button guest-button--primary" type="button" disabled={!day || !time} onClick={() => onSubmit({ day, time, party, requests: requests.trim() || undefined })}>Reserve table<ArrowRight aria-hidden="true" /></Button>
      </section>
    </div>
  );
}

function NearbyBookingSheet({ establishment, days, defaultParty, dayLabel, roomChargeAvailable, roomNumber, onClose, onSubmit }: {
  establishment: NearbyEstablishment;
  days: string[];
  defaultParty: number;
  dayLabel: (day: string) => string;
  roomChargeAvailable: boolean;
  roomNumber?: string;
  onClose: () => void;
  onSubmit: (request: NearbyBookingRequest) => void;
}) {
  const times = tableTimes(establishment.hours);
  const payment = establishment.paymentIntegration;
  const [day, setDay] = useState(days[0] ?? '');
  const [time, setTime] = useState(times[0] ?? '');
  const [party, setParty] = useState(Math.min(10, Math.max(1, defaultParty)));
  const [quantity, setQuantity] = useState(1);
  const [requests, setRequests] = useState('');
  const [checkoutRequest, setCheckoutRequest] = useState<NearbyBookingRequest | null>(null);
  const [paymentChoice, setPaymentChoice] = useState<'room' | 'pay-now'>(roomChargeAvailable ? 'room' : 'pay-now');
  const rentals = establishment.categoryId === 'rentals';
  const title = rentals ? 'Book a rental' : 'Book ' + establishment.type.toLowerCase();
  const amount = payment ? payment.amount * (payment.basis === 'guest' ? party : payment.basis === 'unit' ? quantity : 1) : 0;
  const submit = () => {
    const request = { day, time, party, ...(rentals ? { quantity } : {}), requests: requests.trim() || undefined };
    if (payment && amount > 0 && roomChargeAvailable && paymentChoice === 'room') onSubmit({ ...request, paymentMethod: 'room' });
    else if (payment && amount > 0) setCheckoutRequest(request);
    else onSubmit(request);
  };

  if (checkoutRequest && payment) {
    return <GatewayCheckout
      merchant={establishment.name}
      amount={formatPesoAmount(amount)}
      item={title + ' · ' + dayLabel(checkoutRequest.day) + ' · ' + checkoutRequest.time}
      onPaid={(paymentMethod) => onSubmit({ ...checkoutRequest, paymentMethod })}
      onClose={() => setCheckoutRequest(null)}
    />;
  }

  return (
    <div className="guest-sheet-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="guest-order-tray guest-table-request" role="dialog" aria-modal="true" aria-labelledby="guest-nearby-booking-title">
        <header className="guest-order-tray__header">
          <div><h2 id="guest-nearby-booking-title">{title}</h2><p>{establishment.name} · {establishment.type}</p></div>
          <button className="guest-order-tray__close" type="button" onClick={onClose} aria-label="Close"><X /></button>
        </header>
        <div className="guest-table-request__body">
          <fieldset><legend>Date</legend>
            <div className="guest-table-request__chips">{days.map((option) => <button key={option} type="button" aria-pressed={day === option} onClick={() => setDay(option)}>{dayLabel(option)}</button>)}</div>
          </fieldset>
          <fieldset><legend>Time</legend>
            <div className="guest-table-request__chips">{times.map((option) => <button key={option} type="button" aria-pressed={time === option} onClick={() => setTime(option)}>{option}</button>)}</div>
          </fieldset>
          <div className="guest-table-request__party">
            <span><b>{rentals ? 'Rentals' : 'Guests'}</b><small>{rentals ? 'Number of units' : 'Up to 10 guests'}</small></span>
            <span className="guest-table-request__stepper">
              <button type="button" aria-label={rentals ? 'Fewer rentals' : 'Fewer guests'} disabled={(rentals ? quantity : party) <= 1} onClick={() => rentals ? setQuantity(quantity - 1) : setParty(party - 1)}><Minus aria-hidden="true" /></button>
              <output aria-live="polite">{rentals ? quantity : party}</output>
              <button type="button" aria-label={rentals ? 'More rentals' : 'More guests'} disabled={(rentals ? quantity : party) >= 10} onClick={() => rentals ? setQuantity(quantity + 1) : setParty(party + 1)}><Plus aria-hidden="true" /></button>
            </span>
          </div>
          <label className="guest-table-request__requests">
            <span>Note <small>Optional</small></span>
            <textarea rows={2} maxLength={240} value={requests} placeholder="Anything the provider should know?" onChange={(event) => setRequests(event.currentTarget.value)} />
          </label>
          {payment && roomChargeAvailable ? (
            <fieldset className="guest-payment-choice">
              <legend>How would you like to pay?</legend>
              <div className="guest-payment-options">
                <button type="button" aria-pressed={paymentChoice === 'room'} className={paymentChoice === 'room' ? 'is-active' : ''} onClick={() => setPaymentChoice('room')}>
                  <b>{roomNumber ? `Charge to Room ${roomNumber}` : 'Charge to your room'}</b>
                  <small>Added to your room bill and settled at checkout.</small>
                </button>
                <button type="button" aria-pressed={paymentChoice === 'pay-now'} className={paymentChoice === 'pay-now' ? 'is-active' : ''} onClick={() => setPaymentChoice('pay-now')}>
                  <b>Pay now</b>
                  <small>Card, GCash or Maya, paid directly to {establishment.name}. No room charge.</small>
                </button>
              </div>
            </fieldset>
          ) : null}
          <p className="guest-table-request__note">{payment
            ? roomChargeAvailable && paymentChoice === 'room'
              ? `The ${formatPesoAmount(amount)} vendor charge goes on your room bill.`
              : roomChargeAvailable
                ? 'Pay the vendor through Cabana now. Nothing is charged to your room.'
              : 'Pay ' + establishment.name + ' through Cabana now. Nothing is charged to a room.'
            : establishment.name + ' confirms the booking. Pay the vendor directly; nothing is charged to a room.'}</p>
        </div>
        <Button className="guest-button guest-button--primary" type="button" disabled={!day || !time} onClick={submit}>
          {payment
            ? roomChargeAvailable && paymentChoice === 'room'
              ? 'Confirm and charge ' + formatPesoAmount(amount) + ' to room'
              : 'Continue to pay ' + formatPesoAmount(amount)
            : 'Confirm booking'}<ArrowRight aria-hidden="true" />
        </Button>
      </section>
    </div>
  );
}

export function NearbyEstablishmentScreen({ establishment, city, property, now, onBack, onNotifications, onBookRide, onReserveTable, onBookNearby, partnerTables, reserveDays = [], dayLabel = (day) => day, defaultParty = 2, roomChargeAvailable = false, roomNumber }: {
  establishment: NearbyEstablishment;
  city: string;
  property: string;
  now: MapClock;
  onBack: () => void;
  onNotifications: () => void;
  onBookRide: () => void;
  /** Restaurants and cafes: reserve a table through the vendor integration. */
  onReserveTable?: (request: TableRequest) => void;
  onBookNearby?: (request: NearbyBookingRequest) => void;
  /** The vendor's connected availability and party limit. */
  partnerTables?: { times: readonly string[]; maxParty?: number };
  reserveDays?: string[];
  dayLabel?: (day: string) => string;
  defaultParty?: number;
  roomChargeAvailable?: boolean;
  roomNumber?: string;
}) {
  const [reserving, setReserving] = useState(false);
  const [booking, setBooking] = useState(false);
  const dining = establishment.categoryId === 'dining';
  // Every nearby vendor is connected for direct booking; payment is optional per vendor.
  const bookable = dining && Boolean(onReserveTable) && reserveDays.length > 0;
  const phone = establishment.contact?.replace(/\s/g, '');
  return <div className="guest-stack guest-nearby-detail">
    <section className="guest-nearby-detail__hero" aria-label={`${establishment.name} overview`}>
      <Image src={establishment.image} alt="" fill sizes="100vw" priority />
      <div className="guest-nearby-detail__scrim" aria-hidden="true" />
      <button className="guest-nearby-detail__control guest-nearby-detail__back" type="button" onClick={onBack} aria-label="Back"><ArrowLeft /></button>
      <button className="guest-nearby-detail__control guest-nearby-detail__notifications" type="button" onClick={onNotifications} aria-label="Notifications"><Bell /></button>
      <div className="guest-nearby-detail__hero-copy">
        <h1>{establishment.name}</h1>
        <div className="guest-nearby-detail__tags" aria-label="Recommendation details"><span>{establishment.type}</span><span>Local vendor</span></div>
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
        <span><Storefront aria-hidden="true" /><b>Book directly with this local vendor</b></span>
        <span><House aria-hidden="true" /><b>Outside the hotel</b></span>
        {establishment.paymentIntegration
          ? <span><Check aria-hidden="true" /><b>{roomChargeAvailable ? 'Charge to room or pay now' : 'Pay through Cabana · no room charge'}</b></span>
          : <span><Check aria-hidden="true" /><b>{dining ? 'Pay at the restaurant · no room charge' : 'Pay the vendor directly · no room charge'}</b></span>}
        {establishment.categoryId === 'gifts' ? <span><Gift aria-hidden="true" /><b>Local handicrafts and gifts</b></span> : null}
        {establishment.distance ? <span><PersonSimpleWalk aria-hidden="true" /><b>{establishment.distance}</b></span> : null}
      </div>
    </section>

    <div className="guest-nearby-detail__cta">
      {bookable ? (
        <Button className="guest-button guest-button--primary" type="button" onClick={() => setReserving(true)}>Reserve a table<ArrowRight /></Button>
      ) : onBookNearby ? (
        <>
          <Button className="guest-button guest-button--primary" type="button" onClick={() => setBooking(true)}>{establishment.paymentIntegration && !roomChargeAvailable ? 'Book & pay' : 'Book with ' + establishment.name}<ArrowRight /></Button>
          <button type="button" className="guest-nearby-detail__alt" onClick={onBookRide}>Arrange a ride there</button>
        </>
      ) : <a className="guest-button guest-button--primary" href={`tel:${phone}`}><Phone aria-hidden="true" />Contact {establishment.name}</a>}
    </div>
    {reserving && onReserveTable ? (
      <TableRequestSheet establishment={establishment} days={reserveDays} defaultParty={defaultParty} dayLabel={dayLabel} times={partnerTables?.times ?? tableTimes(establishment.hours)} maxParty={partnerTables?.maxParty ?? 10} onClose={() => setReserving(false)} onSubmit={(request) => { setReserving(false); onReserveTable(request); }} />
    ) : null}
    {booking && onBookNearby ? (
      <NearbyBookingSheet key={`${roomChargeAvailable}:${roomNumber ?? ''}`} establishment={establishment} days={reserveDays} defaultParty={defaultParty} dayLabel={dayLabel} roomChargeAvailable={roomChargeAvailable} roomNumber={roomNumber} onClose={() => setBooking(false)} onSubmit={(request) => { setBooking(false); onBookNearby(request); }} />
    ) : null}
  </div>;
}
