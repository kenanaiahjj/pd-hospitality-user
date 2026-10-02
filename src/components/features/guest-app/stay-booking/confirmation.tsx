'use client';

import { ArrowRight, CalendarPlus, Car, Check, CheckCircle, NavigationArrow, Receipt, ShareNetwork, Tag as TagIcon, X } from '@phosphor-icons/react';
import { useState } from 'react';
import type { Booking } from '../prototype-model';
import { BookingMedallion } from './medallion';
import { RATE_PLAN_LABELS, TRAVEL_NOTES, bookedRoomNumber, bookingCancellationSummary, findStayHotel, peso, roomCancellationTerms, roomRefunds } from './model';
import { longDate, stayDatesLabel } from './format';

function cancellationLabel(terms: NonNullable<ReturnType<typeof roomCancellationTerms>> | undefined) {
  if (!terms) return 'Cancellation details unavailable';
  if (terms.reason === 'free' && terms.until) return `Free cancellation until ${longDate(terms.until)}`;
  if (terms.reason === 'saver') return 'Non-refundable · Saver rate';
  if (terms.reason === 'ended' && terms.until) return `Free cancellation ended ${longDate(terms.until)}`;
  return 'No refund after check-in';
}

export function StayConfirmationScreen({ booking, onGoToStay, onArrangeTransfer }: { booking: Booking; onGoToStay: () => void; onArrangeTransfer?: () => void }) {
  const reservation = booking.reservation;
  if (!reservation) return null;
  return (
    <div className="guest-stack sb-confirmation">
      {/* The moment the trip becomes real: plum and gold, with a medallion struck for it. */}
      <section className="sb-confirmation__hero" aria-labelledby="sb-confirmed-title">
        <BookingMedallion label="Booking confirmed" />
        <p className="sb-confirmation__eyebrow">Booking confirmed</p>
        <h1 id="sb-confirmed-title">You’re going to {booking.city}</h1>
        <p className="sb-confirmation__lede">We’ve emailed the confirmation. {booking.property} has your booking and will message you here before you arrive.</p>
        <p className="sb-reference"><small>Booking reference</small><b>{reservation.reference}</b></p>
      </section>
      <TripActions booking={booking} />
      <ReservationSummary booking={booking} />
      {/* An airport pickup paid with the rooms is already arranged; no second offer of one. */}
      <GettingThere city={booking.city} onArrangeTransfer={reservation.addOns?.some((extra) => extra.id === 'transfer') ? undefined : onArrangeTransfer} />
      {/* Always in reach: the hero is tall, and the way on should not sit below the fold. */}
      <div className="guest-dock-spacer" aria-hidden="true" />
      <div className="guest-dock sb-confirmation__dock">
        <button type="button" className="guest-button guest-button--primary" onClick={onGoToStay}>Go to your stay<ArrowRight aria-hidden="true" /></button>
      </div>
    </div>
  );
}

const icsDate = (iso: string) => iso.replace(/-/g, '');

/** The stay as a calendar event: all-day, check-in to check-out, with the reference and address. */
function calendarFile(booking: Booking, address: string): string {
  const reference = booking.reservation?.reference ?? booking.id;
  return [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Cabana//Stay//EN',
    'BEGIN:VEVENT',
    `UID:${reference}@cabana`,
    `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')}`,
    `DTSTART;VALUE=DATE:${icsDate(booking.checkIn)}`,
    `DTEND;VALUE=DATE:${icsDate(booking.checkOut)}`,
    `SUMMARY:Stay at ${booking.property}`,
    `LOCATION:${address.replace(/,/g, '\\,')}`,
    `DESCRIPTION:Booking ${reference} · ${booking.roomType}. Check-in from 3:00 PM\\, check-out by 12:00 PM.`,
    'END:VEVENT', 'END:VCALENDAR',
  ].join('\r\n');
}

/*
  What a guest does next with a confirmed trip: put it in the calendar, send
  it to whoever is coming, and see how to get there.
*/
function TripActions({ booking }: { booking: Booking }) {
  const [shared, setShared] = useState(false);
  const hotel = findStayHotel(booking.reservation?.hotelId);
  const address = hotel?.address ?? booking.property;
  const reference = booking.reservation?.reference ?? booking.id;
  const summary = `${booking.property} · ${stayDatesLabel(booking.checkIn, booking.checkOut)} · ${booking.roomType}. Booking ${reference}.`;
  const addToCalendar = () => {
    const url = URL.createObjectURL(new Blob([calendarFile(booking, address)], { type: 'text/calendar' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `cabana-${reference}.ics`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const share = async () => {
    try {
      if (navigator.share) await navigator.share({ title: `Stay at ${booking.property}`, text: summary });
      else await navigator.clipboard?.writeText(summary);
      setShared(true);
    } catch {
      // The guest closed the share sheet: nothing to report.
    }
  };
  return (
    <div className="sb-trip-actions">
      <button type="button" onClick={addToCalendar} aria-label="Add to calendar"><span className="sb-trip-actions__icon"><CalendarPlus aria-hidden="true" /></span><span>Calendar</span></button>
      <button type="button" onClick={() => { void share(); }} aria-label={shared ? 'Trip shared' : 'Share trip'}><span className="sb-trip-actions__icon">{shared ? <Check aria-hidden="true" /> : <ShareNetwork aria-hidden="true" />}</span><span>{shared ? 'Shared' : 'Share'}</span></button>
      <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`} target="_blank" rel="noopener noreferrer" aria-label="Directions to the hotel"><span className="sb-trip-actions__icon"><NavigationArrow aria-hidden="true" /></span><span>Directions</span></a>
    </div>
  );
}

function ReservationSummary({ booking }: { booking: Booking }) {
  const reservation = booking.reservation!;
  const cancellation = bookingCancellationSummary(booking);
  return (
    <div className="sb-reservation">
      <p className="sb-reservation__head"><b>{booking.property}</b><small>{stayDatesLabel(booking.checkIn, booking.checkOut)}</small></p>
      <ul>
        {reservation.rooms.map((room, index) => (
          <li key={index}>
            <span><b>Room {bookedRoomNumber(room, index)} · {room.roomName}</b><small>{room.leadGuest} · {room.adults} {room.adults === 1 ? 'adult' : 'adults'}{room.children ? `, ${room.children} ${room.children === 1 ? 'child' : 'children'}` : ''} · {RATE_PLAN_LABELS[room.ratePlanId].title} · {cancellationLabel(roomCancellationTerms(booking, index))}</small></span>
          </li>
        ))}
      </ul>
      {reservation.addOns?.length ? (
        <ul className="sb-reservation__extras" aria-label="Arrival extras">
          {reservation.addOns.map((extra) => (
            <li key={extra.serviceBookingId}><span><b>{extra.title}</b><small>{extra.id === 'early-check-in' ? `${extra.detail ?? 'Early check-in'} · charged to your room if confirmed` : extra.detail ?? 'Arrival extra'}</small></span><span>{extra.amount ? peso(extra.amount) : 'Free'}</span></li>
          ))}
        </ul>
      ) : null}
      {reservation.promo ? <p className="sb-reservation__saved"><TagIcon weight="fill" aria-hidden="true" />{reservation.promo.code} saved you {peso(reservation.promo.discount)}</p> : null}
      <p className="sb-reservation__paid"><Receipt aria-hidden="true" /><span>Paid {peso(reservation.total + (reservation.addOnsTotal ?? 0))} with {reservation.paidWith}</span></p>
      <p className={`sb-policy${cancellation.refundableRooms ? ' is-positive' : ''}`}>
        {cancellation.refundableRooms === cancellation.totalRooms && cancellation.until
          ? <><CheckCircle weight="fill" aria-hidden="true" />Free cancellation until {longDate(cancellation.until)}</>
          : cancellation.refundableRooms && cancellation.until
            ? <><CheckCircle weight="fill" aria-hidden="true" />Free cancellation until {longDate(cancellation.until)} for {cancellation.refundableRooms} of {cancellation.totalRooms} rooms</>
            : 'No rooms have free cancellation'}
      </p>
    </div>
  );
}

/**
 * Cancel all of an upcoming booking or a selected set of its rooms. Each room
 * shows its own refund terms before the guest confirms.
 */
export function CancelReservationSheet({ booking, onClose, onConfirm, extrasRefund = 0, pickupRefund, hasLinkedExtras = false, hasAirportPickup = false }: {
  booking: Booking;
  onClose: () => void;
  onConfirm: (roomIndexes: number[]) => void;
  /** Extras still booked, refunded with the last room. */
  extrasRefund?: number;
  /** What a smaller pickup gives back when only some rooms go. */
  pickupRefund?: (roomIndexes: number[]) => number;
  /** Arrival services and unpaid extras that will be removed with a full cancellation. */
  hasLinkedExtras?: boolean;
  /** A booked pickup whose passenger count follows the rooms that stay. */
  hasAirportPickup?: boolean;
}) {
  const reservation = booking.reservation;
  const [chosen, setChosen] = useState<number[]>(() => reservation?.rooms.map((_, index) => index) ?? []);
  if (!reservation) return null;
  const refunds = roomRefunds(reservation);
  const terms = reservation.rooms.map((_, index) => roomCancellationTerms(booking, index));
  const everything = chosen.length === reservation.rooms.length;
  const roomsBack = chosen.reduce((sum, index) => sum + (terms[index]?.refund ?? 0), 0);
  const retainedRoomCharges = chosen.reduce((sum, index) => sum + (terms[index]?.refundable ? 0 : refunds[index] ?? 0), 0);
  const previouslyRetained = reservation.cancellationRetainedTotal ?? 0;
  const noRefundCount = chosen.filter((index) => !terms[index]?.refundable).length;
  const extrasBack = everything ? extrasRefund : chosen.length ? pickupRefund?.(chosen) ?? 0 : 0;
  const refund = roomsBack + extrasBack;
  const completionCopy = everything
    ? ` Every room in this booking will be cancelled.${hasLinkedExtras ? ` Linked arrival services will also be cancelled${extrasRefund ? ' and eligible payments refunded' : ''}.` : ''}`
    : ` ${reservation.rooms.length - chosen.length === 1 ? 'The other room stays' : 'The other rooms stay'} booked.${hasLinkedExtras ? ' Linked arrival services stay booked.' : ''}${hasAirportPickup ? ' The airport pickup is adjusted to fit the remaining party.' : ''}`;
  const toggle = (index: number) => setChosen((current) => (current.includes(index) ? current.filter((value) => value !== index) : [...current, index].sort()));
  return (
    <div className="guest-sheet-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="guest-order-tray sb-cancel" role="dialog" aria-modal="true" aria-labelledby="sb-cancel-title">
        <header className="guest-order-tray__header">
          <div><h2 id="sb-cancel-title">{reservation.rooms.length > 1 ? 'What would you like to cancel?' : 'Cancel this booking?'}</h2><p><span>{booking.property}</span><span>{stayDatesLabel(booking.checkIn, booking.checkOut)}</span></p></div>
          <button className="guest-order-tray__close" type="button" onClick={onClose} aria-label="Keep booking"><X /></button>
        </header>
        {reservation.rooms.length > 1 ? (
          <fieldset className="sb-cancel__rooms">
            <legend className="sr-only">Rooms to cancel</legend>
            {reservation.rooms.map((room, index) => (
              <label key={index} className={`sb-cancel__room${chosen.includes(index) ? ' is-chosen' : ''}`}>
                <input type="checkbox" checked={chosen.includes(index)} onChange={() => toggle(index)} />
                <span><b>Room {bookedRoomNumber(room, index)} · {room.roomName}</b><small>{room.leadGuest} · {RATE_PLAN_LABELS[room.ratePlanId].title} · {cancellationLabel(terms[index])}</small></span>
                <strong>{peso(terms[index]?.refund ?? 0)} refund</strong>
              </label>
            ))}
          </fieldset>
        ) : (
          <div className="sb-cancel__single-room">
            <b>Room {bookedRoomNumber(reservation.rooms[0]!, 0)} · {reservation.rooms[0]!.roomName} · {RATE_PLAN_LABELS[reservation.rooms[0]!.ratePlanId].title}</b>
            <span>{cancellationLabel(terms[0])}</span>
            <strong>{peso(terms[0]?.refund ?? 0)} refund</strong>
          </div>
        )}
        {/* Show both what comes back and any room charge the rate keeps. */}
        {chosen.length ? (
          <dl className="sb-cancel__breakdown">
            <div><dt>{chosen.length === 1 ? 'Room refund' : `${chosen.length} room refunds`}</dt><dd>{peso(roomsBack)}</dd></div>
            {retainedRoomCharges ? <div><dt>Room charges kept<small>No refund under these room terms</small></dt><dd>{peso(retainedRoomCharges)}</dd></div> : null}
            {previouslyRetained ? <div><dt>From earlier cancellations<small>Already kept · no refund</small></dt><dd>{peso(previouslyRetained)}</dd></div> : null}
            {extrasBack ? <div><dt>{everything ? 'Paid arrival extras' : 'Airport pickup, smaller party'}<small>{everything ? 'Refunded with the booking' : 'Fewer passengers, a lower fare'}</small></dt><dd>{peso(extrasBack)}</dd></div> : null}
            <div className="is-total"><dt>Refund</dt><dd>{peso(refund)}</dd></div>
          </dl>
        ) : null}
        <p className="sb-cancel__refund">
          {chosen.length
            ? <>{refund ? <>You’ll get <b>{peso(refund)}</b> back the way you paid, usually within 5–7 banking days.</> : <>No refund is due for the selected rooms.</>}{noRefundCount ? ` ${noRefundCount === 1 ? 'One selected room has' : `${noRefundCount} selected rooms have`} no refund under ${noRefundCount === 1 ? 'its' : 'their'} rate terms.` : ''}{completionCopy}</>
            : 'Choose at least one room to cancel.'}
        </p>
        <footer className="guest-order-tray__footer sb-cancel__footer">
          <button type="button" className="guest-button guest-button--secondary" onClick={onClose}>Keep booking</button>
          <button type="button" className="guest-button guest-button--danger" disabled={!chosen.length} onClick={() => onConfirm(chosen)}>
            {everything ? 'Cancel booking' : `Cancel ${chosen.length} ${chosen.length === 1 ? 'room' : 'rooms'}`}
          </button>
        </footer>
      </section>
    </div>
  );
}

/*
  The ferries, vans and fees between the airport and the room, which the
  booking apps leave to a blog post -- Boracay alone is a flight, a jetty, a
  boat and a tricycle, with fees paid in cash at the port.
*/
export function GettingThere({ city, onArrangeTransfer }: { city: string; onArrangeTransfer?: () => void }) {
  const note = TRAVEL_NOTES[city];
  if (!note) return null;
  return (
    <section className="sb-section sb-getting-there" aria-labelledby="sb-getting-there-title">
      <div className="sb-section__head">
        <h2 id="sb-getting-there-title">Getting there</h2>
        <p>{note.summary}</p>
      </div>
      <ol className="sb-getting-there__steps">
        {note.steps.map((step) => <li key={step}>{step}</li>)}
      </ol>
      {note.fees ? <p className="sb-getting-there__fees"><Receipt aria-hidden="true" />{note.fees}</p> : null}
      {note.transfer && onArrangeTransfer ? (
        <button type="button" className="guest-button guest-button--secondary" onClick={onArrangeTransfer}><Car aria-hidden="true" />Arrange a transfer with the hotel</button>
      ) : null}
    </section>
  );
}
