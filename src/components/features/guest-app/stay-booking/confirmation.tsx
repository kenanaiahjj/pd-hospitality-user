'use client';

import { ArrowRight, CalendarPlus, Car, CheckCircle, NavigationArrow, Receipt, ShareNetwork, Tag as TagIcon, X } from '@phosphor-icons/react';
import { useState } from 'react';
import type { Booking } from '../prototype-model';
import { RATE_PLAN_LABELS, TRAVEL_NOTES, findStayHotel, peso, roomRefunds } from './model';
import { longDate, stayDatesLabel } from './format';

export function StayConfirmationScreen({ booking, onGoToStay, onArrangeTransfer }: { booking: Booking; onGoToStay: () => void; onArrangeTransfer?: () => void }) {
  const reservation = booking.reservation;
  if (!reservation) return null;
  return (
    <div className="guest-stack sb-confirmation">
      <div className="sb-confirmation__seal" aria-hidden="true"><CheckCircle weight="fill" /></div>
      <div className="guest-page-title sb-center">
        <p className="guest-eyebrow">Booking confirmed</p>
        <h1>You’re going to {booking.city}</h1>
        <p>We’ve emailed the confirmation. {booking.property} has your booking and will message you here before you arrive.</p>
      </div>
      <p className="sb-reference"><small>Booking reference</small><b>{reservation.reference}</b></p>
      <ReservationSummary booking={booking} />
      <TripActions booking={booking} />
      {/* An airport pickup paid with the rooms is already arranged; no second offer of one. */}
      <GettingThere city={booking.city} onArrangeTransfer={reservation.addOns?.some((extra) => extra.id === 'transfer') ? undefined : onArrangeTransfer} />
      <button type="button" className="guest-button guest-button--primary" onClick={onGoToStay}>Go to your stay<ArrowRight aria-hidden="true" /></button>
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
      <button type="button" onClick={addToCalendar}><CalendarPlus aria-hidden="true" /><span>Add to calendar</span></button>
      <button type="button" onClick={() => { void share(); }}><ShareNetwork aria-hidden="true" /><span>{shared ? 'Shared' : 'Share trip'}</span></button>
      <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`} target="_blank" rel="noopener noreferrer"><NavigationArrow aria-hidden="true" /><span>Directions</span></a>
    </div>
  );
}

function ReservationSummary({ booking }: { booking: Booking }) {
  const reservation = booking.reservation!;
  return (
    <div className="sb-reservation">
      <p className="sb-reservation__head"><b>{booking.property}</b><small>{stayDatesLabel(booking.checkIn, booking.checkOut)}</small></p>
      <ul>
        {reservation.rooms.map((room, index) => (
          <li key={index}>
            <span><b>Room {index + 1} · {room.roomName}</b><small>{room.leadGuest} · {room.adults} {room.adults === 1 ? 'adult' : 'adults'}{room.children ? `, ${room.children} ${room.children === 1 ? 'child' : 'children'}` : ''} · {RATE_PLAN_LABELS[room.ratePlanId].title}</small></span>
          </li>
        ))}
      </ul>
      {reservation.addOns?.length ? (
        <ul className="sb-reservation__extras" aria-label="Arrival extras">
          {reservation.addOns.map((extra) => (
            <li key={extra.serviceBookingId}><span><b>{extra.title}</b><small>{extra.detail ?? 'Arrival extra'}</small></span><span>{extra.amount ? peso(extra.amount) : 'Free'}</span></li>
          ))}
        </ul>
      ) : null}
      {reservation.promo ? <p className="sb-reservation__saved"><TagIcon weight="fill" aria-hidden="true" />{reservation.promo.code} saved you {peso(reservation.promo.discount)}</p> : null}
      <p className="sb-reservation__paid"><Receipt aria-hidden="true" /><span>Paid {peso(reservation.total + (reservation.addOnsTotal ?? 0))} with {reservation.paidWith}</span></p>
      <p className={`sb-policy${reservation.refundable ? ' is-positive' : ''}`}>
        {reservation.refundable && reservation.freeCancellationUntil
          ? <><CheckCircle weight="fill" aria-hidden="true" />Free cancellation until {longDate(reservation.freeCancellationUntil)}</>
          : 'Non-refundable'}
      </p>
    </div>
  );
}

/**
 * Cancel all of a booking or some of its rooms -- opened from View booking,
 * for a refundable stay inside its free-cancellation window. Every room starts
 * ticked; untick the ones to keep.
 */
export function CancelReservationSheet({ booking, onClose, onConfirm, extrasRefund = 0, pickupRefund }: {
  booking: Booking;
  onClose: () => void;
  onConfirm: (roomIndexes: number[]) => void;
  /** Extras still booked, refunded with the last room. */
  extrasRefund?: number;
  /** What a smaller pickup gives back when only some rooms go. */
  pickupRefund?: (roomIndexes: number[]) => number;
}) {
  const reservation = booking.reservation;
  const [chosen, setChosen] = useState<number[]>(() => reservation?.rooms.map((_, index) => index) ?? []);
  if (!reservation) return null;
  const refunds = roomRefunds(reservation);
  const everything = chosen.length === reservation.rooms.length;
  const refund = chosen.reduce((sum, index) => sum + (refunds[index] ?? 0), 0) + (everything ? extrasRefund : chosen.length ? pickupRefund?.(chosen) ?? 0 : 0);
  const toggle = (index: number) => setChosen((current) => (current.includes(index) ? current.filter((value) => value !== index) : [...current, index].sort()));
  return (
    <div className="guest-sheet-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="guest-order-tray sb-cancel" role="dialog" aria-modal="true" aria-labelledby="sb-cancel-title">
        <header className="guest-order-tray__header">
          <div><h2 id="sb-cancel-title">{reservation.rooms.length > 1 ? 'What would you like to cancel?' : 'Cancel this booking?'}</h2><p>{booking.property} · {stayDatesLabel(booking.checkIn, booking.checkOut)}</p></div>
          <button className="guest-order-tray__close" type="button" onClick={onClose} aria-label="Keep booking"><X /></button>
        </header>
        {reservation.rooms.length > 1 ? (
          <fieldset className="sb-cancel__rooms">
            <legend className="sr-only">Rooms to cancel</legend>
            {reservation.rooms.map((room, index) => (
              <label key={index} className={`sb-cancel__room${chosen.includes(index) ? ' is-chosen' : ''}`}>
                <input type="checkbox" checked={chosen.includes(index)} onChange={() => toggle(index)} />
                <span><b>Room {index + 1} · {room.roomName}</b><small>{room.leadGuest} · {RATE_PLAN_LABELS[room.ratePlanId].title}</small></span>
                <strong>{peso(refunds[index] ?? 0)}</strong>
              </label>
            ))}
          </fieldset>
        ) : null}
        <p className="sb-cancel__refund">
          {chosen.length
            ? <>You’ll get <b>{peso(refund)}</b> back to {reservation.paidWith}, usually within 5–7 banking days.{everything ? ` Every room in this booking is cancelled${extrasRefund ? ', with its arrival extras' : ''}.` : ` ${reservation.rooms.length - chosen.length === 1 ? 'The other room stays' : 'The other rooms stay'} booked${reservation.addOns?.length ? (pickupRefund?.(chosen) ? ', with your extras; the airport pickup shrinks to fit' : ', and so do your arrival extras') : ''}.`}</>
            : 'Choose at least one room to cancel.'}
        </p>
        <footer className="guest-order-tray__footer sb-cancel__footer">
          <button type="button" className="guest-button guest-button--secondary" onClick={onClose}>Keep booking</button>
          <button type="button" className="guest-button guest-button--danger" disabled={!chosen.length} onClick={() => onConfirm(chosen)}>
            {everything ? 'Cancel and refund' : `Cancel ${chosen.length} ${chosen.length === 1 ? 'room' : 'rooms'}`}
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
