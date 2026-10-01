'use client';

import Image from 'next/image';
import { ArrowRight, Bed, CaretRight, Check, CheckCircle, Coffee, EnvelopeSimple, MapPin, Minus, Phone, Plus, Ruler, Star, Users, Warning, X } from '@phosphor-icons/react';
import { useState } from 'react';
import type { CartLine, HeldRooms, PromoAccount, RatePlanId, RoomFilter, RoomOffer, StayHotel, StaySearch } from './model';
import { AMENITY_LABELS, RATE_PLAN_LABELS, cancellationOpen, ROOM_FILTER_LABELS, cartFit, cartRooms, describeRooms, isHotelFull, peso, quoteStay, roomMatches, roomOffers, suggestRooms, validSearchDates } from './model';
import { compactRange, nightsLabel, roomsLabel } from './format';
import { StaySearchSheet, type SearchStep } from './search-form';
import { OffersStrip } from './offers';
import { SaveHotelButton } from './saved';
import { countNightsBetween } from '../prototype-model';
import { HighlightStrip, NeighbourhoodSection, PartnersSection } from './neighbourhood-section';

/*
  The hotel, and the room picker that is the point of this flow: every room
  class lists its rates with a count, and the cart takes any mix -- two King
  rooms on the saver rate and a suite with breakfast, in one booking. The
  booking apps allow one class per booking; families and groups split across
  two apps to get what they need. The dock says, as the cart changes, whether
  the rooms fit the party.
*/

/** Keep the cart inside what the new dates allow. */
export function clampCart(hotel: StayHotel, search: StaySearch, cart: CartLine[], held?: HeldRooms): CartLine[] {
  const offers = new Map(roomOffers(hotel, search, held).map((offer) => [offer.roomType.id, offer]));
  const used = new Map<string, number>();
  const kept = cart.flatMap((line): CartLine[] => {
    const offer = offers.get(line.roomTypeId);
    const room = offer?.left ?? 0;
    const taken = used.get(line.roomTypeId) ?? 0;
    const quantity = Math.min(line.quantity, Math.max(0, room - taken));
    used.set(line.roomTypeId, taken + quantity);
    // A rate the new dates no longer offer moves to the one they do: flexible room-only becomes Saver.
    const plans = offer?.plans.map((plan) => plan.id) ?? [];
    const ratePlanId = plans.includes(line.ratePlanId) ? line.ratePlanId : line.ratePlanId === 'flex' && plans.includes('saver') ? 'saver' : undefined;
    return quantity > 0 && ratePlanId ? [{ ...line, ratePlanId, quantity }] : [];
  });
  // Two lines that became the same rate are one line.
  return kept.reduce<CartLine[]>((lines, line) => {
    const same = lines.find((item) => item.roomTypeId === line.roomTypeId && item.ratePlanId === line.ratePlanId);
    if (same) { same.quantity += line.quantity; return lines; }
    return [...lines, { ...line }];
  }, []);
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

export function StayHotelScreen({ hotel, search, cart, onCartChange, onSearchChange, onContinue, held, account }: {
  hotel: StayHotel;
  search: StaySearch;
  cart: CartLine[];
  onCartChange: (cart: CartLine[]) => void;
  onSearchChange: (search: StaySearch) => void;
  onContinue: () => void;
  /** Rooms already sold in the app, so availability reflects them. */
  held?: HeldRooms;
  account?: PromoAccount;
}) {
  const [editing, setEditing] = useState<SearchStep | null>(null);
  const [cartNotice, setCartNotice] = useState<string | null>(null);
  const [roomFilters, setRoomFilters] = useState<RoomFilter[]>([]);
  const [cheapestFirst, setCheapestFirst] = useState(false);
  const [openRoom, setOpenRoom] = useState<string | null>(null);
  const offers = roomOffers(hotel, search, held);
  const fit = cartFit(hotel, search, cart);
  const quote = quoteStay(hotel, search, cart);
  const datesOk = validSearchDates(search);
  const photos = [hotel.image, ...hotel.gallery];
  const soldOutEverywhere = datesOk && offers.every((offer) => offer.left === 0);
  const suggestion = datesOk ? suggestRooms(hotel, search, held) : undefined;
  const suggestionTaken = Boolean(suggestion) && JSON.stringify(suggestion!.cart) === JSON.stringify(cart);
  // Rooms nobody in the party fits sink to the bottom; open ones before sold out.
  const shownOffers = offers
    .filter((offer) => roomMatches(offer, roomFilters))
    .sort((a, b) => Number(a.left === 0) - Number(b.left === 0) || (cheapestFirst ? Math.min(...a.plans.map((plan) => plan.perNight)) - Math.min(...b.plans.map((plan) => plan.perNight)) : 0));
  const openOffer = offers.find((offer) => offer.roomType.id === openRoom);
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
        <div className="sb-hotel__eyebrow"><p className="guest-eyebrow">{hotel.area}</p><SaveHotelButton hotel={hotel} labelled /></div>
        <h1>{hotel.name}</h1>
        <p className="sb-hotel__meta">
          <span className="sb-stars" aria-label={`${hotel.stars}-star hotel`}>{Array.from({ length: hotel.stars }, (_, i) => <Star key={i} weight="fill" aria-hidden="true" />)}</span>
          <span className="sb-rating"><b>{hotel.rating.toFixed(1)}</b><small>{hotel.reviews.toLocaleString('en-US')} reviews</small></span>
        </p>
        <p>{hotel.summary}</p>
        <HighlightStrip hotelId={hotel.id} />
      </div>

      <section className="sb-stay-bar" aria-label="Your stay">
        <button type="button" aria-haspopup="dialog" onClick={() => setEditing('when')}>
          <small>Dates · {nightsLabel(search.checkIn, search.checkOut)}</small><b>{compactRange(search.checkIn, search.checkOut)}</b>
        </button>
        <button type="button" aria-haspopup="dialog" onClick={() => setEditing('who')}>
          <small>Guests</small><b>{search.adults} {search.adults === 1 ? 'adult' : 'adults'}{search.childAges.length ? ` · ${search.childAges.length} ${search.childAges.length === 1 ? 'kid' : 'kids'}` : ''}</b>
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
              const kept = clampCart(hotel, next, cart, held);
              const count = (lines: CartLine[]) => lines.reduce((sum, line) => sum + line.quantity, 0);
              // Say so when the new dates cost the cart a room, rather than quietly dropping it.
              const moved = cart.some((line) => line.ratePlanId === 'flex') && !kept.some((line) => line.ratePlanId === 'flex') && kept.some((line) => line.ratePlanId === 'saver');
              setCartNotice([
                count(kept) < count(cart) ? `Fewer rooms are free on the new dates, so ${count(cart) - count(kept) === 1 ? 'a room was' : `${count(cart) - count(kept)} rooms were`} taken out of your selection.` : '',
                moved ? 'Free cancellation has ended for these dates, so room-only rooms are on the cheaper Saver rate.' : '',
              ].filter(Boolean).join(' ') || null);
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

        {/* The common case first: the fewest rooms that fit everyone, one tap to take. */}
        {suggestion && !soldOutEverywhere ? (
          <div className={`sb-suggest${suggestionTaken ? ' is-taken' : ''}`}>
            <span className="sb-suggest__text">
              <small>Best fit for your {search.adults + search.childAges.length} {search.adults + search.childAges.length === 1 ? 'guest' : 'guests'}</small>
              <b>{describeRooms(cartRooms(hotel, suggestion.cart).map((item) => ({ roomName: item.roomType.name })))}</b>
              <span>{peso(suggestion.total)} for {nightsLabel(search.checkIn, search.checkOut)}{cancellationOpen(search.checkIn) ? ' · free cancellation' : ''}</span>
            </span>
            <button type="button" className="guest-button guest-button--secondary" disabled={suggestionTaken} onClick={() => onCartChange(suggestion.cart)}>
              {suggestionTaken ? <><Check aria-hidden="true" />Added</> : cart.length ? 'Use this instead' : suggestion.rooms === 1 ? 'Add this room' : `Add ${suggestion.rooms} rooms`}
            </button>
          </div>
        ) : null}

        <div className="sb-chips" role="group" aria-label="Filter rooms">
          {(Object.keys(ROOM_FILTER_LABELS) as RoomFilter[]).map((filter) => (
            <button key={filter} type="button" className={`sb-chip${roomFilters.includes(filter) ? ' is-active' : ''}`} aria-pressed={roomFilters.includes(filter)} onClick={() => setRoomFilters((current) => (current.includes(filter) ? current.filter((value) => value !== filter) : [...current, filter]))}>
              {ROOM_FILTER_LABELS[filter]}
            </button>
          ))}
          <button type="button" className={`sb-chip${cheapestFirst ? ' is-active' : ''}`} aria-pressed={cheapestFirst} onClick={() => setCheapestFirst((value) => !value)}>Lowest price</button>
        </div>

        <ul className="sb-room-list">
          {shownOffers.map((offer) => {
            const { roomType } = offer;
            const taken = inCart(roomType.id);
            const soldOut = offer.left === 0 || !datesOk;
            const from = Math.min(...offer.plans.map((plan) => plan.perNight));
            return (
              <li key={roomType.id}>
                <button type="button" className={`sb-room-row${soldOut ? ' is-sold-out' : ''}${taken ? ' is-in-cart' : ''}`} onClick={() => setOpenRoom(roomType.id)} aria-label={`${roomType.name}, sleeps ${roomType.sleeps}, from ${peso(from)} a night${taken ? `, ${taken} in your selection` : ''}${soldOut ? ', sold out' : ''}`}>
                  <span className="sb-room-row__photo"><Image src={roomType.image.src} alt="" fill sizes="88px" style={{ objectPosition: roomType.image.focalPoint }} /></span>
                  <span className="sb-room-row__text">
                    <b>{roomType.name}</b>
                    <small>Sleeps {roomType.sleeps} · {roomType.beds}</small>
                    {soldOut ? <span className="sb-note sb-note--warning">Sold out for these dates</span>
                      : <span className="sb-room-row__price">{offer.plans.length > 1 ? <small>from</small> : null} <b>{peso(from)}</b> <small>/ night</small>{offer.left <= 3 ? <span className="sb-note sb-note--urgent">Only {offer.left} left</span> : null}</span>}
                  </span>
                  {taken ? <span className="sb-room-row__count" aria-hidden="true">{taken}</span> : <CaretRight className="sb-room-row__go" aria-hidden="true" />}
                </button>
              </li>
            );
          })}
          {!shownOffers.length ? <li className="sb-small">No rooms match these filters. <button type="button" className="sb-link" onClick={() => setRoomFilters([])}>Clear filters</button></li> : null}
        </ul>
      </section>

      {openOffer ? (
        <RoomSheet
          offer={openOffer}
          cart={cart}
          datesOk={datesOk}
          onCartChange={onCartChange}
          onClose={() => setOpenRoom(null)}
        />
      ) : null}

      {/* After the rooms: they are what the guest came to this page for. */}
      <OffersStrip hotel={hotel} nights={countNightsBetween(search.checkIn, search.checkOut)} title="Offers for this stay" account={account} />

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
            {soldOutEverywhere ? 'Sold out on these dates' : fit.fits ? `${roomsLabel(fit.rooms)} · ${fit.message.replace('Fits your', 'fits')}` : fit.message}
          </small>
        </div>
        {/* Nothing to pick on a full night: the way forward is other dates, not a disabled Continue. */}
        {soldOutEverywhere ? (
          <button type="button" className="guest-button guest-button--primary" onClick={() => setEditing('when')}>
            Change dates
          </button>
        ) : (
          <button type="button" className="guest-button guest-button--primary" disabled={!fit.fits || !datesOk} onClick={onContinue}>
            Continue<ArrowRight aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  );
}

/*
  One room class in full: its photo, what it has, and every rate with a count.
  The list above stays one line per class, so a hotel with eight of them is
  still one screen to compare.
*/
function RoomSheet({ offer, cart, datesOk, onCartChange, onClose }: { offer: RoomOffer; cart: CartLine[]; datesOk: boolean; onCartChange: (cart: CartLine[]) => void; onClose: () => void }) {
  const { roomType } = offer;
  const taken = cart.filter((line) => line.roomTypeId === roomType.id).reduce((sum, line) => sum + line.quantity, 0);
  const soldOut = offer.left === 0 || !datesOk;
  return (
    <div className="guest-sheet-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="guest-order-tray sb-room-sheet" role="dialog" aria-modal="true" aria-labelledby="sb-room-sheet-title">
        <div className="guest-order-tray__scroll">
          <span className="sb-room-sheet__photo">
            <Image src={roomType.image.src} alt={roomType.image.alt} fill sizes="(max-width: 720px) 100vw, 480px" style={{ objectPosition: roomType.image.focalPoint }} preload />
            <button className="guest-order-tray__close sb-room-sheet__close" type="button" onClick={onClose} aria-label="Close"><X /></button>
          </span>
          <div className="sb-room__info">
            <h3 id="sb-room-sheet-title">{roomType.name}</h3>
            <p className="sb-room__facts">
              <span><Users aria-hidden="true" />Sleeps {roomType.sleeps}{roomType.maxAdults < roomType.sleeps ? ` · ${roomType.maxAdults} adults max` : ''}</span>
              <span><Bed aria-hidden="true" />{roomType.beds}</span>
              <span><Ruler aria-hidden="true" />{roomType.sizeSqm} m²</span>
            </p>
            <p className="sb-room__features">{[roomType.view, ...roomType.features].join(' · ')}</p>
            {soldOut ? <span className="sb-note sb-note--warning"><Warning aria-hidden="true" />Sold out for these dates</span>
              : offer.left <= 3 ? <span className="sb-note sb-note--urgent">Only {offer.left} left</span> : null}
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
                      <small className={plan.refundable ? 'is-positive' : undefined}>{plan.refundable ? <CheckCircle weight="fill" aria-hidden="true" /> : null}{plan.refundable || plan.id === 'saver' ? label.detail : 'Non-refundable · check-in is within 3 days'}</small>
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
        </div>
        <footer className="guest-order-tray__footer">
          <button type="button" className="guest-button guest-button--primary" onClick={onClose}>{taken ? `Done · ${taken} ${taken === 1 ? 'room' : 'rooms'} selected` : 'Done'}</button>
        </footer>
      </section>
    </div>
  );
}
