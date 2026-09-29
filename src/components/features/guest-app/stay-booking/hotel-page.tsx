'use client';

import Image from 'next/image';
import { ArrowRight, Bed, CheckCircle, Coffee, EnvelopeSimple, MapPin, Minus, Phone, Plus, Ruler, Star, Users, Warning } from '@phosphor-icons/react';
import { useState } from 'react';
import type { CartLine, RatePlanId, StayHotel, StaySearch } from './model';
import { AMENITY_LABELS, RATE_PLAN_LABELS, cartFit, isHotelFull, partyLabel, peso, quoteStay, roomOffers, validSearchDates } from './model';
import { roomsLabel, stayDatesLabel } from './format';
import { StaySearchSheet, type SearchStep } from './search-form';
import { HotelHighlights, NeighbourhoodSection, PartnersSection } from './neighbourhood-section';

/*
  The hotel, and the room picker that is the point of this flow: every room
  class lists its rates with a count, and the cart takes any mix -- two King
  rooms on the saver rate and a suite with breakfast, in one booking. The
  booking apps allow one class per booking; families and groups split across
  two apps to get what they need. The dock says, as the cart changes, whether
  the rooms fit the party.
*/

/** Keep the cart inside what the new dates allow. */
export function clampCart(hotel: StayHotel, search: StaySearch, cart: CartLine[]): CartLine[] {
  const left = new Map(roomOffers(hotel, search).map((offer) => [offer.roomType.id, offer.left]));
  const used = new Map<string, number>();
  return cart.flatMap((line) => {
    const room = left.get(line.roomTypeId) ?? 0;
    const taken = used.get(line.roomTypeId) ?? 0;
    const quantity = Math.min(line.quantity, Math.max(0, room - taken));
    used.set(line.roomTypeId, taken + quantity);
    return quantity > 0 ? [{ ...line, quantity }] : [];
  });
}

function setQuantity(cart: CartLine[], roomTypeId: string, ratePlanId: RatePlanId, quantity: number): CartLine[] {
  const rest = cart.filter((line) => !(line.roomTypeId === roomTypeId && line.ratePlanId === ratePlanId));
  if (quantity <= 0) return rest;
  const index = cart.findIndex((line) => line.roomTypeId === roomTypeId && line.ratePlanId === ratePlanId);
  const next = { roomTypeId, ratePlanId, quantity };
  // Keep a line where it was, so the guest split lists rooms in the order they were added.
  if (index < 0) return [...rest, next];
  const copy = [...cart];
  copy[index] = next;
  return copy;
}

export function StayHotelScreen({ hotel, search, cart, onCartChange, onSearchChange, onContinue }: {
  hotel: StayHotel;
  search: StaySearch;
  cart: CartLine[];
  onCartChange: (cart: CartLine[]) => void;
  onSearchChange: (search: StaySearch) => void;
  onContinue: () => void;
}) {
  const [editing, setEditing] = useState<SearchStep | null>(null);
  const [cartNotice, setCartNotice] = useState<string | null>(null);
  const offers = roomOffers(hotel, search);
  const fit = cartFit(hotel, search, cart);
  const quote = quoteStay(hotel, search, cart);
  const datesOk = validSearchDates(search);
  const photos = [hotel.image, ...hotel.gallery];
  const inCart = (roomTypeId: string) => cart.filter((line) => line.roomTypeId === roomTypeId).reduce((sum, line) => sum + line.quantity, 0);

  return (
    <div className="guest-stack sb-hotel">
      <div className="sb-hotel__gallery" aria-label={`Photos of ${hotel.name}`}>
        {photos.map((photo, i) => (
          <span key={photo.src + i} className="sb-hotel__photo">
            <Image src={photo.src} alt={i === 0 ? photo.alt : ''} fill sizes="(max-width: 720px) 86vw, 420px" style={{ objectPosition: photo.focalPoint }} preload={i === 0} />
          </span>
        ))}
      </div>

      <div className="guest-page-title sb-hotel__title">
        <p className="guest-eyebrow">{hotel.area}</p>
        <h1>{hotel.name}</h1>
        <p className="sb-hotel__meta">
          <span className="sb-stars" aria-label={`${hotel.stars}-star hotel`}>{Array.from({ length: hotel.stars }, (_, i) => <Star key={i} weight="fill" aria-hidden="true" />)}</span>
          <span className="sb-rating"><b>{hotel.rating.toFixed(1)}</b><small>{hotel.reviews.toLocaleString('en-US')} reviews</small></span>
        </p>
        <p>{hotel.summary}</p>
        <HotelHighlights hotelId={hotel.id} />
      </div>

      <section className="sb-stay-bar" aria-label="Your stay">
        <button type="button" aria-haspopup="dialog" onClick={() => setEditing('when')}>
          <small>Dates</small><b>{stayDatesLabel(search.checkIn, search.checkOut)}</b>
        </button>
        <button type="button" aria-haspopup="dialog" onClick={() => setEditing('who')}>
          <small>Guests</small><b>{partyLabel(search)}</b>
        </button>
        {editing ? (
          <StaySearchSheet
            value={search}
            title={hotel.name}
            submitLabel="Update"
            steps={['when', 'who']}
            startAt={editing}
            isBlocked={(night) => isHotelFull(hotel.id, night)}
            onClose={() => setEditing(null)}
            onSearch={(next) => {
              setEditing(null);
              onSearchChange(next);
              const kept = clampCart(hotel, next, cart);
              const count = (lines: CartLine[]) => lines.reduce((sum, line) => sum + line.quantity, 0);
              // Say so when the new dates cost the cart a room, rather than quietly dropping it.
              setCartNotice(count(kept) < count(cart) ? `Fewer rooms are free on the new dates, so ${count(cart) - count(kept) === 1 ? 'a room was' : `${count(cart) - count(kept)} rooms were`} taken out of your selection.` : null);
              onCartChange(kept);
            }}
          />
        ) : null}
      </section>

      <section className="sb-section" aria-labelledby="sb-rooms-title">
        <div className="sb-section__head">
          <h2 id="sb-rooms-title">Choose your rooms</h2>
          <p>Mix room types and rates in one booking.</p>
        </div>
        {cartNotice ? <p className="sb-note sb-note--warning" role="status"><Warning aria-hidden="true" />{cartNotice}</p> : null}
        <div className="sb-rooms">
          {offers.map((offer) => {
            const { roomType } = offer;
            const taken = inCart(roomType.id);
            const soldOut = offer.left === 0 || !datesOk;
            return (
              <article key={roomType.id} className={`sb-room${soldOut ? ' is-sold-out' : ''}`} aria-label={roomType.name}>
                <div className="sb-room__head">
                  <span className="sb-room__photo">
                    <Image src={roomType.image.src} alt="" fill sizes="(max-width: 720px) calc(100vw - 32px), 440px" style={{ objectPosition: roomType.image.focalPoint }} />
                    {soldOut ? <span className="sb-note sb-note--urgent"><Warning aria-hidden="true" />Sold out for these dates</span>
                      : offer.left <= 3 ? <span className="sb-note sb-note--urgent">Only {offer.left} left</span> : null}
                  </span>
                  <div className="sb-room__info">
                    <h3>{roomType.name}</h3>
                    <p className="sb-room__facts">
                      <span><Users aria-hidden="true" />Sleeps {roomType.sleeps}{roomType.maxAdults < roomType.sleeps ? ` · ${roomType.maxAdults} adults max` : ''}</span>
                      <span><Bed aria-hidden="true" />{roomType.beds}</span>
                      <span><Ruler aria-hidden="true" />{roomType.sizeSqm} m²</span>
                    </p>
                    <p className="sb-room__features">{[roomType.view, ...roomType.features].join(' · ')}</p>
                  </div>
                </div>
                {!soldOut ? (
                  <ul className="sb-plans">
                    {offer.plans.map((plan) => {
                      const quantity = cart.find((line) => line.roomTypeId === roomType.id && line.ratePlanId === plan.id)?.quantity ?? 0;
                      const label = RATE_PLAN_LABELS[plan.id];
                      const name = `${roomType.name}, ${label.title}`;
                      return (
                        <li key={plan.id} className={`sb-plan${quantity ? ' is-selected' : ''}`}>
                          <span className="sb-plan__text">
                            <b>{plan.id === 'flex-breakfast' ? <Coffee aria-hidden="true" /> : null}{label.title}</b>
                            <small className={plan.refundable ? 'is-positive' : undefined}>{plan.refundable ? <CheckCircle weight="fill" aria-hidden="true" /> : null}{label.detail}</small>
                            {plan.id === 'flex-breakfast' ? <small>Breakfast for {roomType.sleeps}</small> : null}
                          </span>
                          <span className="sb-plan__price">
                            <b>{peso(plan.perNight)}</b>
                            <small>per night · {peso(plan.total)} total</small>
                          </span>
                          <span className="sb-stepper" role="group" aria-label={name}>
                            <button type="button" aria-label={`Remove a ${name}`} disabled={quantity === 0} onClick={() => onCartChange(setQuantity(cart, roomType.id, plan.id, quantity - 1))}><Minus aria-hidden="true" /></button>
                            <output aria-live="polite">{quantity}</output>
                            <button type="button" aria-label={`Add a ${name}`} disabled={taken >= offer.left} onClick={() => onCartChange(setQuantity(cart, roomType.id, plan.id, quantity + 1))}><Plus aria-hidden="true" /></button>
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                ) : null}
              </article>
            );
          })}
        </div>
      </section>

      <section className="sb-section" aria-labelledby="sb-about-title">
        <h2 id="sb-about-title">About the hotel</h2>
        <p>{hotel.about}</p>
        <ul className="sb-amenities">
          {hotel.amenities.map((amenity) => <li key={amenity}><CheckCircle weight="fill" aria-hidden="true" />{AMENITY_LABELS[amenity]}</li>)}
        </ul>
        <p className="sb-small">Check-in from 3:00 PM · check-out by 12:00 PM</p>
      </section>

      <NeighbourhoodSection hotel={hotel} />
      <PartnersSection hotel={hotel} />

      <section className="sb-section" aria-labelledby="sb-contact-title">
        <h2 id="sb-contact-title">Location and contact</h2>
        <p className="sb-contact-row"><MapPin aria-hidden="true" />{hotel.address}</p>
        {hotel.phone ? <a className="sb-contact-row" href={`tel:${hotel.phone.replace(/[^+\d]/g, '')}`}><Phone aria-hidden="true" />{hotel.phone}</a> : null}
        {hotel.email ? <a className="sb-contact-row" href={`mailto:${hotel.email}`}><EnvelopeSimple aria-hidden="true" />{hotel.email}</a> : null}
      </section>

      <div className="guest-dock-spacer sb-dock-spacer" aria-hidden="true" />
      <div className="guest-dock sb-dock">
        <div className="guest-dock__summary">
          {/* Two lines at most: the price, then one note -- the room count while it fits, else what to fix. */}
          {fit.rooms ? <strong>{peso(quote.subtotal)}</strong> : null}
          <small className={`sb-dock__fit${fit.fits ? ' is-positive' : ''}${fit.rooms ? '' : ' is-empty'}`} aria-live="polite">
            {fit.fits ? `${roomsLabel(fit.rooms)} · ${fit.message.replace('Fits your', 'fits')}` : fit.message}
          </small>
        </div>
        <button type="button" className="guest-button guest-button--primary" disabled={!fit.fits || !datesOk} onClick={onContinue}>
          Continue<ArrowRight aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
