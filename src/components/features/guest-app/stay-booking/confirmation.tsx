'use client';

import { ArrowRight, ChatCircleDots, CheckCircle, Copy, Receipt, X } from '@phosphor-icons/react';
import { useState } from 'react';
import type { Booking } from '../prototype-model';
import { RATE_PLAN_LABELS, canCancelReservation, peso } from './model';
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
 * The booking as My Stay shows it: what was paid, the policy, and the one
 * change the app makes itself -- cancelling a refundable booking in time.
 * Everything else goes through the desk, which can see the rooms.
 */
export function ReservationCard({ booking, onCancel, onAskDesk }: { booking: Booking; onCancel: () => void; onAskDesk: () => void }) {
  const [confirming, setConfirming] = useState(false);
  const [copied, setCopied] = useState(false);
  const reservation = booking.reservation;
  if (!reservation) return null;
  const cancellable = canCancelReservation(booking);
  return (
    <section className="sb-section sb-reservation-card" aria-labelledby="sb-reservation-title">
      <div className="sb-reservation-card__head">
        <h2 id="sb-reservation-title">Your booking</h2>
        <button type="button" className="sb-copy" onClick={() => { void navigator.clipboard?.writeText(reservation.reference).catch(() => undefined); setCopied(true); }}>
          {reservation.reference}<Copy aria-hidden="true" /><span className="sr-only">{copied ? 'Copied' : 'Copy reference'}</span>
        </button>
      </div>
      <ReservationSummary booking={booking} />
      <div className="sb-reservation-card__actions">
        {cancellable ? <button type="button" className="guest-button guest-button--secondary" onClick={() => setConfirming(true)}>Cancel booking</button> : null}
        <button type="button" className="guest-button guest-button--secondary" onClick={onAskDesk}><ChatCircleDots aria-hidden="true" />Change dates or rooms</button>
      </div>
      {!cancellable && !reservation.refundable ? <p className="sb-small">This booking is non-refundable. The front desk can help if your plans change.</p> : null}

      {confirming ? (
        <div className="guest-sheet-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setConfirming(false); }}>
          <section className="guest-order-tray sb-cancel" role="dialog" aria-modal="true" aria-labelledby="sb-cancel-title">
            <header className="guest-order-tray__header">
              <div><h2 id="sb-cancel-title">Cancel this booking?</h2><p>{booking.property} · {stayDatesLabel(booking.checkIn, booking.checkOut)}</p></div>
              <button className="guest-order-tray__close" type="button" onClick={() => setConfirming(false)} aria-label="Keep booking"><X /></button>
            </header>
            <p className="sb-cancel__refund">You’ll get <b>{peso(reservation.total)}</b> back to {reservation.paidWith}, usually within 5–7 banking days. Every room in this booking is cancelled.</p>
            <footer className="guest-order-tray__footer sb-cancel__footer">
              <button type="button" className="guest-button guest-button--secondary" onClick={() => setConfirming(false)}>Keep booking</button>
              <button type="button" className="guest-button guest-button--danger" onClick={() => { setConfirming(false); onCancel(); }}>Cancel and refund</button>
            </footer>
          </section>
        </div>
      ) : null}
    </section>
  );
}
