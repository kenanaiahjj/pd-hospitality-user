'use client';

import Image from 'next/image';
import { ArrowRight, Check, Minus, Plus } from '@phosphor-icons/react';
import { useRef, useState } from 'react';
import { ITEM_THUMBNAIL_IMAGES, ROOM_IMAGES } from '../service-images';
import type { AddOnId, CelebrationSetup, StayAddOn, StayHotel, StaySearch } from './model';
import { ADD_ON_INFO, CELEBRATION_SETUPS, OCCASIONS, PRIVATE_CAR_PER_DAY, TRANSFER_FARES, VAN_SEATS, addOnAmount, addOnError, addOnLines, addOnsFor, addOnsTotal, airportForCity, newAddOn, peso, pickupBlurb } from './model';
import { countNightsBetween } from '../prototype-model';
import { weekdayDate } from './format';

/*
  The optional step between rooms and guest details: what should be waiting
  when the guest lands. Each extra opens only the fields it needs, prices
  itself as it changes, and is paid for in the same payment as the rooms.
  Nothing here is booked until that payment goes through.
*/

const PHOTOS: Record<AddOnId, { src: string; focalPoint: string }> = {
  transfer: ITEM_THUMBNAIL_IMAGES.transfer!,
  'private-car': ITEM_THUMBNAIL_IMAGES['private-car']!,
  luggage: ITEM_THUMBNAIL_IMAGES.luggage!,
  celebration: ITEM_THUMBNAIL_IMAGES.celebration!,
  'early-check-in': ROOM_IMAGES.king,
};

function priceLabel(id: AddOnId): string {
  switch (id) {
    case 'transfer': return `${peso(TRANSFER_FARES.van)}`;
    case 'private-car': return `${peso(PRIVATE_CAR_PER_DAY)} / day`;
    case 'celebration': return `From ${peso(CELEBRATION_SETUPS.flowers.price)}`;
    case 'luggage': return 'Free';
    default: return peso(addOnAmount({ id }));
  }
}

export function StayAddOnsScreen({ hotel, search, addOns, onChange, onContinue }: {
  hotel: StayHotel;
  search: StaySearch;
  addOns: StayAddOn[];
  onChange: (addOns: StayAddOn[]) => void;
  onContinue: () => void;
}) {
  const [tried, setTried] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const offered = addOnsFor(hotel);
  const chosen = addOns.filter((addOn) => offered.includes(addOn.id));
  const lines = addOnLines(chosen, hotel);
  const total = addOnsTotal(lines);
  const party = search.adults + search.childAges.length;
  const nights = Math.max(1, countNightsBetween(search.checkIn, search.checkOut));
  const find = (id: AddOnId) => chosen.find((addOn) => addOn.id === id);
  const toggle = (id: AddOnId) => onChange(find(id) ? addOns.filter((addOn) => addOn.id !== id) : [...addOns, newAddOn(id, search)]);
  const patch = (id: AddOnId, change: Partial<StayAddOn>) => onChange(addOns.map((addOn) => (addOn.id === id ? { ...addOn, ...change } : addOn)));

  const proceed = () => {
    const invalid = chosen.find((addOn) => addOnError(addOn));
    if (invalid) {
      setTried(true);
      // After the render that marks it invalid, or there is nothing to find yet.
      window.requestAnimationFrame(() => {
        const field = root.current?.querySelector<HTMLElement>(`[data-addon="${invalid.id}"] [aria-invalid="true"]`);
        field?.scrollIntoView({ block: 'center', behavior: 'smooth' });
        field?.focus({ preventScroll: true });
      });
      return;
    }
    onContinue();
  };

  return (
    <div className="guest-stack sb-addons" ref={root}>
      <div className="guest-page-title">
        <p className="guest-eyebrow">Optional · {hotel.name}</p>
        <h1>Add to your arrival</h1>
        <p>Arranged by the hotel for {weekdayDate(search.checkIn)} and paid with your rooms. You can also add these later from your stay.</p>
      </div>

      <div className="sb-addons__list">
        {offered.map((id) => {
          const addOn = find(id);
          const error = addOn ? addOnError(addOn) : undefined;
          return (
            <article key={id} data-addon={id} className={`sb-addon${addOn ? ' is-added' : ''}`} aria-label={ADD_ON_INFO[id].title}>
              <header>
                <span className="sb-addon__photo"><Image src={PHOTOS[id].src} alt="" fill sizes="64px" style={{ objectPosition: PHOTOS[id].focalPoint }} /></span>
                <span className="sb-addon__text">
                  <b>{ADD_ON_INFO[id].title}</b>
                  <small>{id === 'transfer' ? pickupBlurb(hotel.city) : ADD_ON_INFO[id].blurb}</small>
                  <span className="sb-addon__foot">
                    <span className="sb-addon__price">{addOn ? (addOnAmount(addOn) ? peso(addOnAmount(addOn)) : 'Free') : priceLabel(id)}</span>
                    <button type="button" className={`sb-addon__toggle${addOn ? ' is-added' : ''}`} aria-pressed={Boolean(addOn)} aria-label={addOn ? `Remove ${ADD_ON_INFO[id].title}` : `Add ${ADD_ON_INFO[id].title}`} onClick={() => toggle(id)}>
                      {addOn ? <><Check weight="bold" aria-hidden="true" />Added</> : <><Plus weight="bold" aria-hidden="true" />Add</>}
                    </button>
                  </span>
                </span>
              </header>

              {addOn?.id === 'transfer' ? (
                <div className="sb-addon__fields">
                  <p className="sb-addon__fact"><small>Pick up</small><b>{airportForCity(hotel.city)}</b><span>{weekdayDate(search.checkIn)}</span></p>
                  <label className={`sb-field${tried && error ? ' is-invalid' : ''}`}>
                    <span>Flight lands at</span>
                    <input type="time" value={addOn.time ?? ''} aria-invalid={(tried && Boolean(error)) || undefined} onChange={(event) => patch(id, { time: event.currentTarget.value })} />
                    {tried && error ? <small className="sb-field-error">{error}</small> : null}
                  </label>
                  <label className="sb-field">
                    <span>Flight number <small>Optional · the driver tracks delays</small></span>
                    <input value={addOn.flight ?? ''} placeholder="e.g. PR 2041" autoCapitalize="characters" autoComplete="off" onChange={(event) => patch(id, { flight: event.currentTarget.value })} />
                  </label>
                  <div className="sb-counter" role="group" aria-label="Passengers">
                    <span><b>Passengers</b><small>{(addOn.passengers ?? 1) > VAN_SEATS ? `Private van · ${peso(TRANSFER_FARES.large)}` : `Executive van, up to ${VAN_SEATS} · ${peso(TRANSFER_FARES.van)}`}</small></span>
                    <span className="sb-stepper">
                      <button type="button" aria-label="Fewer passengers" disabled={(addOn.passengers ?? 1) <= 1} onClick={() => patch(id, { passengers: (addOn.passengers ?? 1) - 1 })}><Minus aria-hidden="true" /></button>
                      <output aria-live="polite">{addOn.passengers}</output>
                      <button type="button" aria-label="More passengers" disabled={(addOn.passengers ?? 1) >= party} onClick={() => patch(id, { passengers: (addOn.passengers ?? 1) + 1 })}><Plus aria-hidden="true" /></button>
                    </span>
                  </div>
                </div>
              ) : null}

              {addOn?.id === 'private-car' ? (
                <div className="sb-addon__fields">
                  <div className="sb-counter" role="group" aria-label="Days with a driver">
                    <span><b>Days</b><small>From check-in, up to 10 hours a day</small></span>
                    <span className="sb-stepper">
                      <button type="button" aria-label="Fewer days" disabled={(addOn.days ?? 1) <= 1} onClick={() => patch(id, { days: (addOn.days ?? 1) - 1 })}><Minus aria-hidden="true" /></button>
                      <output aria-live="polite">{addOn.days}</output>
                      <button type="button" aria-label="More days" disabled={(addOn.days ?? 1) >= nights} onClick={() => patch(id, { days: (addOn.days ?? 1) + 1 })}><Plus aria-hidden="true" /></button>
                    </span>
                  </div>
                </div>
              ) : null}

              {addOn?.id === 'celebration' ? (
                <div className="sb-addon__fields">
                  <div className="sb-addon__choices" role="radiogroup" aria-label="Setup">
                    {(Object.keys(CELEBRATION_SETUPS) as CelebrationSetup[]).map((setup) => (
                      <button key={setup} type="button" role="radio" aria-checked={addOn.setup === setup} className={`sb-addon__choice${addOn.setup === setup ? ' is-active' : ''}`} onClick={() => patch(id, { setup })}>
                        <b>{CELEBRATION_SETUPS[setup].label}</b>
                        <small>{CELEBRATION_SETUPS[setup].detail}</small>
                        <span>{peso(CELEBRATION_SETUPS[setup].price)}</span>
                      </button>
                    ))}
                  </div>
                  <label className="sb-field">
                    <span>Occasion <small>Optional</small></span>
                    <select value={addOn.occasion ?? ''} onChange={(event) => patch(id, { occasion: event.currentTarget.value })}>
                      <option value="">Choose</option>
                      {OCCASIONS.map((occasion) => <option key={occasion} value={occasion}>{occasion}</option>)}
                    </select>
                  </label>
                </div>
              ) : null}

              {addOn?.id === 'early-check-in' ? (
                <p className="sb-addon__note">The hotel confirms before you arrive. If it can’t have your room ready, the {peso(addOnAmount(addOn))} goes back to how you paid.</p>
              ) : null}
            </article>
          );
        })}
      </div>

      <div className="guest-dock-spacer" aria-hidden="true" />
      <div className="guest-dock">
        <div className="guest-dock__summary">
          <strong>{lines.length ? `+${peso(total)}` : 'No extras'}</strong>
          <small className="sb-dock__fit is-muted">{lines.length ? `${lines.length} ${lines.length === 1 ? 'extra' : 'extras'} added` : 'All optional'}</small>
        </div>
        <button type="button" className="guest-button guest-button--primary" onClick={proceed}>
          {lines.length ? 'Continue' : 'Skip'}<ArrowRight aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
