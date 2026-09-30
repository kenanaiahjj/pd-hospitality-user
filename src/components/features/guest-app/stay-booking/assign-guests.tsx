'use client';

import Image from 'next/image';
import { ArrowRight, Minus, Plus, Warning } from '@phosphor-icons/react';
import type { CartLine, RoomAllocation, StayHotel, StaySearch } from './model';
import { RATE_PLAN_LABELS, cartRooms, partyLabel, validateAllocation } from './model';
import { childAgeLabel } from './format';

/*
  Who sleeps where. The cart holds rooms of different classes, so the party
  cannot simply be divided by the room count: a King takes two, a family room
  takes four. The split opens pre-filled (`defaultAllocation`) and every room
  says what it breaks, if anything, as the guest moves people around.
*/

export function StayAssignGuestsScreen({ hotel, search, cart, allocation, onChange, onContinue }: {
  hotel: StayHotel;
  search: StaySearch;
  cart: CartLine[];
  allocation: RoomAllocation[];
  onChange: (allocation: RoomAllocation[]) => void;
  onContinue: () => void;
}) {
  const rooms = cartRooms(hotel, cart);
  const check = validateAllocation(hotel, search, cart, allocation);
  const placedAdults = allocation.reduce((sum, item) => sum + item.adults, 0);
  const placedChildren = new Set(allocation.flatMap((item) => item.childIndexes)).size;
  const setAdults = (index: number, adults: number) => onChange(allocation.map((item, i) => (i === index ? { ...item, adults } : item)));
  const moveChild = (child: number, room: number) => onChange(allocation.map((item, i) => {
    const without = item.childIndexes.filter((value) => value !== child);
    return i === room ? { ...item, childIndexes: [...without, child].sort((a, b) => a - b) } : { ...item, childIndexes: without };
  }));

  return (
    <div className="guest-stack sb-assign">
      <div className="guest-page-title">
        <p className="guest-eyebrow">{hotel.name}</p>
        <h1>Who’s in each room?</h1>
        <p>{partyLabel(search)} across {rooms.length} {rooms.length === 1 ? 'room' : 'rooms'}. We’ve made a first split; move anyone you like.</p>
      </div>

      <div className="sb-assign__rooms">
        {rooms.map((room, index) => {
          const current = allocation[index] ?? { adults: 0, childIndexes: [] };
          const error = check.roomErrors[index];
          return (
            <article key={index} className={`sb-assign__room${error ? ' is-invalid' : ''}`} aria-label={`Room ${index + 1}, ${room.roomType.name}`}>
              <header>
                <span className="sb-assign__thumb"><Image src={room.roomType.image.src} alt="" fill sizes="52px" style={{ objectPosition: room.roomType.image.focalPoint }} /></span>
                <span className="sb-assign__title">
                  <small>Room {index + 1}</small>
                  <b>{room.roomType.name}</b>
                  <span>{RATE_PLAN_LABELS[room.ratePlanId].title} · Sleeps {room.roomType.sleeps}</span>
                </span>
              </header>
              <div className="sb-counter" role="group" aria-label={`Adults in room ${index + 1}`}>
                <span><b>Adults</b><small>Up to {room.roomType.maxAdults} aged 12+ in this room</small></span>
                <span className="sb-stepper">
                  <button type="button" aria-label={`Fewer adults in room ${index + 1}`} disabled={current.adults <= 0} onClick={() => setAdults(index, current.adults - 1)}><Minus aria-hidden="true" /></button>
                  <output aria-live="polite">{current.adults}</output>
                  <button type="button" aria-label={`More adults in room ${index + 1}`} disabled={placedAdults >= search.adults} onClick={() => setAdults(index, current.adults + 1)}><Plus aria-hidden="true" /></button>
                </span>
              </div>
              {current.childIndexes.map((child) => (
                <div key={child} className="sb-assign__child">
                  <span><b>Child {child + 1}</b><small>{childAgeLabel(search.childAges[child] ?? 0)}{(search.childAges[child] ?? 0) >= 12 ? ' · counts as an adult' : (search.childAges[child] ?? 0) < 6 ? ' · stays free' : ''}</small></span>
                  {rooms.length > 1 ? (
                    <label className="sb-assign__move">
                      <span className="sr-only">Room for child {child + 1}</span>
                      <select value={index} onChange={(event) => moveChild(child, Number(event.currentTarget.value))}>
                        {rooms.map((option, i) => <option key={i} value={i}>{i === index ? `In room ${i + 1}` : `Move to room ${i + 1}`}</option>)}
                      </select>
                    </label>
                  ) : null}
                </div>
              ))}
              {error ? <p className="sb-note sb-note--warning" role="status"><Warning aria-hidden="true" />{error}</p> : null}
            </article>
          );
        })}
      </div>


      <div className="guest-dock-spacer" aria-hidden="true" />
      <div className="guest-dock">
        <div className="guest-dock__summary">
          <strong>{placedAdults + placedChildren} of {search.adults + search.childAges.length} placed</strong>
          <small className={`sb-dock__fit${check.ok ? ' is-positive' : ''}`} role={check.ok ? undefined : 'alert'}>{check.summary ?? 'Everyone has a bed'}</small>
        </div>
        <button type="button" className="guest-button guest-button--primary" disabled={!check.ok} onClick={onContinue}>
          Continue<ArrowRight aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
