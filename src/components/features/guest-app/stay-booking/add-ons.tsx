'use client';

import Image from 'next/image';
import { ArrowRight, Check, Minus, Plus } from '@phosphor-icons/react';
import { ITEM_THUMBNAIL_IMAGES, ROOM_IMAGES } from '../service-images';
import type { AddOnId, CelebrationSetup, StayAddOn, StayHotel, StaySearch } from './model';
import { NotesField } from '../guest-ui';
import { ADD_ON_INFO, CELEBRATION_SETUPS, OCCASIONS, PRIVATE_CAR_PER_DAY, TRANSFER_FARES, VAN_SEATS, addOnAmount, addOnError, addOnLines, addOnsFor, addOnsPayNowTotal, addOnsRoomChargeTotal, airportForCity, newAddOn, peso, pickupBlurb } from './model';
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

/** What a guest might want to add, per extra: a prompt, not a requirement. */
const ADD_ON_NOTE_HINTS: Record<AddOnId, string> = {
  transfer: 'Luggage, a child seat, a wheelchair…',
  'private-car': 'Where you’d like to go, a child seat, a stop on the way…',
  luggage: 'How many bags, delivery to your room…',
  celebration: 'A message for the card, favourite flowers, dietary needs…',
  'early-check-in': 'Arriving on a red-eye, travelling with a baby…',
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
  const offered = addOnsFor(hotel);
  const chosen = addOns.filter((addOn) => offered.includes(addOn.id));
  const lines = addOnLines(chosen, hotel);
  const payNowTotal = addOnsPayNowTotal(lines);
  const roomChargeTotal = addOnsRoomChargeTotal(lines);
  const paidExtrasCount = lines.filter((line) => line.id !== 'early-check-in' && line.amount > 0).length;
  const party = search.adults + search.childAges.length;
  const nights = Math.max(1, countNightsBetween(search.checkIn, search.checkOut));
  const find = (id: AddOnId) => chosen.find((addOn) => addOn.id === id);
  const toggle = (id: AddOnId) => onChange(find(id) ? addOns.filter((addOn) => addOn.id !== id) : [...addOns, newAddOn(id, search)]);
  const patch = (id: AddOnId, change: Partial<StayAddOn>) => onChange(addOns.map((addOn) => (addOn.id === id ? { ...addOn, ...change } : addOn)));

  // What is still needed is said up front, and Continue waits for it, rather than erroring after the tap.
  const missing = chosen.find((addOn) => addOnError(addOn));

  return (
    <div className="guest-stack sb-addons">
      <div className="guest-page-title">
        <p className="guest-eyebrow">{hotel.name} · {weekdayDate(search.checkIn)}</p>
        <h1>Add-ons</h1>
        <p>Early check-in is added to your room bill if confirmed.</p>
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
                  <label className="sb-field">
                    <span>Flight lands at <small className="sb-required">Required</small></span>
                    <input type="time" value={addOn.time ?? ''} required aria-required="true" onChange={(event) => patch(id, { time: event.currentTarget.value })} />
                    {error ? <small>The driver meets your flight, so they need its landing time.</small> : null}
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
                <p className="sb-addon__note">The hotel confirms first. There’s no charge if it can’t confirm.</p>
              ) : null}

              {addOn ? (
                <div className="sb-addon__fields">
                  <NotesField name={`addon-note-${id}`} value={addOn.note ?? ''} onChange={(note) => patch(id, { note })} placeholder={ADD_ON_NOTE_HINTS[id]} />
                </div>
              ) : null}
            </article>
          );
        })}
      </div>

      <div className="guest-dock-spacer" aria-hidden="true" />
      <div className="guest-dock">
        <div className="guest-dock__summary">
          <strong>{payNowTotal ? `${peso(payNowTotal)} due now` : lines.length ? 'No payment now' : 'No extras'}</strong>
          <small className={`sb-dock__fit${missing ? '' : ' is-muted'}`} aria-live="polite">
            {missing ? addOnError(missing) : roomChargeTotal ? `${peso(roomChargeTotal)} on your room if confirmed` : paidExtrasCount ? `${paidExtrasCount} ${paidExtrasCount === 1 ? 'extra' : 'extras'} selected` : lines.length ? 'Free extra selected' : 'All optional'}
          </small>
        </div>
        <button type="button" className="guest-button guest-button--primary" disabled={Boolean(missing)} onClick={onContinue}>
          {lines.length ? 'Continue' : 'Skip'}<ArrowRight aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
