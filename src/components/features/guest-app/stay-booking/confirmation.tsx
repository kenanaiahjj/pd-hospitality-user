'use client';

import { ArrowRight, CheckCircle, Receipt, X } from '@phosphor-icons/react';
import type { Booking } from '../prototype-model';
import { RATE_PLAN_LABELS, peso } from './model';
import { longDate, stayDatesLabel } from './format';

export function StayConfirmationScreen({ booking, onGoToStay }: { booking: Booking; onGoToStay: () => void }) {
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
      <button type="button" className="guest-button guest-button--primary" onClick={onGoToStay}>Go to your stay<ArrowRight aria-hidden="true" /></button>
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
      <p className="sb-reservation__paid"><Receipt aria-hidden="true" /><span>Paid {peso(reservation.total)} with {reservation.paidWith}</span></p>
      <p className={`sb-policy${reservation.refundable ? ' is-positive' : ''}`}>
        {reservation.refundable && reservation.freeCancellationUntil
          ? <><CheckCircle weight="fill" aria-hidden="true" />Free cancellation until {longDate(reservation.freeCancellationUntil)}</>
          : 'Non-refundable'}
      </p>
    </div>
  );
}

/**
 * "Cancel this booking?" -- opened from View booking, for a refundable stay
 * still inside its free-cancellation window. Every room goes together.
 */
export function CancelReservationSheet({ booking, onClose, onConfirm }: { booking: Booking; onClose: () => void; onConfirm: () => void }) {
  const reservation = booking.reservation;
  if (!reservation) return null;
  return (
    <div className="guest-sheet-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="guest-order-tray sb-cancel" role="dialog" aria-modal="true" aria-labelledby="sb-cancel-title">
        <header className="guest-order-tray__header">
          <div><h2 id="sb-cancel-title">Cancel this booking?</h2><p>{booking.property} · {stayDatesLabel(booking.checkIn, booking.checkOut)}</p></div>
          <button className="guest-order-tray__close" type="button" onClick={onClose} aria-label="Keep booking"><X /></button>
        </header>
        <p className="sb-cancel__refund">You’ll get <b>{peso(reservation.total)}</b> back to {reservation.paidWith}, usually within 5–7 banking days. Every room in this booking is cancelled.</p>
        <footer className="guest-order-tray__footer sb-cancel__footer">
          <button type="button" className="guest-button guest-button--secondary" onClick={onClose}>Keep booking</button>
          <button type="button" className="guest-button guest-button--danger" onClick={onConfirm}>Cancel and refund</button>
        </footer>
      </section>
    </div>
  );
}
