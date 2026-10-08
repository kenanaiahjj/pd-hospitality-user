'use client';

import { Bicycle, ForkKnife, Receipt, ShoppingBag, Sparkle, X } from '@phosphor-icons/react';
import Image from 'next/image';
import { QRCodeSVG } from 'qrcode.react';
import { useState } from 'react';
import type { ServiceImageDefinition } from '../../service-images';
import type { Card, CardAction } from '../types';
import type { Host } from './host';
import '../ui/pilot.css';

/*
  One booking, one card. It is a view of the engine's record, never a copy: the
  receipt, the booking's thread and the front desk's thread all draw this, so
  they cannot disagree. The actions it offers are the engine's own list for the
  state the booking is in, and every tap goes back through the engine.
*/

const peso = (n: number) => `₱${n.toLocaleString('en-US')}`;

const STATE_TONE: Record<string, string> = {
  'for-confirmation': 'wait',
  'pay-to-confirm': 'wait',
  confirmed: 'good',
  reserved: 'good',
  ready: 'good',
  lapsed: 'bad',
  cancelled: 'bad',
  'extra-charge': 'wait',
};

const KIND_ICON = { rental: Bicycle, service: Sparkle, table: ForkKnife, goods: ShoppingBag } as const;

const LABEL: Record<CardAction, string> = {
  cancel: 'Cancel',
  withdraw: 'Withdraw request',
  pay: 'Pay now',
  'pay-in-full': 'Pay in full instead',
  'show-qr': 'Show QR',
  'open-menu': 'Open menu',
  'view-booking': 'View booking',
  'pick-another': 'Pick another',
  'message-desk': 'Message the front desk',
  question: 'Question this charge',
  'running-late': 'Running late',
};
const PRIMARY: CardAction[] = ['pay', 'pay-in-full', 'show-qr'];

export type CardHandlers = {
  /** Open the gateway for this booking's card payment, or for an extra charge. */
  onPay: (bookingId: string, paymentId?: string) => void;
  onOpenDesk?: () => void;
  onPickAnother?: (bookingId: string) => void;
  onOpenMenu?: (listingId: string) => void;
  onQuestion?: (paymentId: string) => void;
  /** Whether a table has a menu to open. A nearby place may not. */
  hasMenu?: (listingId: string) => boolean;
  /** What the engine said back: a refusal worth showing, or a plain confirmation. */
  onNote?: (note: { tone: 'warning' | 'positive'; text: string }) => void;
  /** The booking's photograph, the one My Stay lists it with. */
  imageFor?: (bookingId: string) => ServiceImageDefinition | undefined;
};

/** A booking's photograph, or its kind's glyph on a quiet square when it has none. */
export function BookingThumb({ image, kind, extra, className }: { image?: ServiceImageDefinition; kind: keyof typeof KIND_ICON; extra?: boolean; className: string }) {
  const Icon = extra ? Receipt : KIND_ICON[kind];
  return (
    <span className={className} aria-hidden="true">
      {image && !extra ? <Image src={image.src} alt="" fill sizes="48px" style={{ objectPosition: image.focalPoint }} /> : <Icon weight="regular" />}
    </span>
  );
}

export const STATUS_TONE = (state: string | undefined, label?: string) =>
  state === 'extra-charge' && label === 'Removed' ? 'bad' : STATE_TONE[state ?? ''] ?? 'wait';

export function EngineBookingCard({ host, bookingId, paymentId, inThread, bare, ...handlers }: {
  host: Host;
  bookingId: string;
  paymentId?: string;
  /** In the booking's own thread the guest's note is already a message there. */
  inThread?: boolean;
  /** On the booking's own page the title and photo are already the page's header. */
  bare?: boolean;
} & CardHandlers) {
  const [qr, setQr] = useState(false);
  const [confirmingCancel, setConfirmingCancel] = useState(false);
  const pilot = host.pilot;
  const booking = pilot.booking(bookingId);
  const card: Card = paymentId ? pilot.extraCard(paymentId) : pilot.card(bookingId);
  const listing = pilot.listing(booking.listingId);
  const guestId = booking.guestId;
  const freeToCancel = booking.kind === 'table' || booking.start - host.now() >= listing.freeCancelHours * 3_600_000;

  const doCancel = () => {
    setConfirmingCancel(false);
    const r = host.call<{ ok: boolean; message?: string; outcome?: string }>('guest.cancel', guestId, bookingId);
    if (!r.ok) handlers.onNote?.({ tone: 'warning', text: r.message ?? 'That did not go through.' });
    else if (r.outcome === 'requested') handlers.onNote?.({ tone: 'positive', text: 'You asked to cancel. It is past the free-cancel time, so the vendor has to accept.' });
    else handlers.onNote?.({ tone: 'positive', text: 'Cancelled.' });
  };

  const act = (action: CardAction) => {
    switch (action) {
      case 'cancel':
        // A booking that is confirmed (and maybe paid) is not cancelled by one stray tap.
        setConfirmingCancel(true);
        break;
      case 'withdraw': {
        const r = host.call<{ ok: boolean; message?: string; outcome?: string }>('guest.cancel', guestId, bookingId);
        if (!r.ok) handlers.onNote?.({ tone: 'warning', text: r.message ?? 'That did not go through.' });
        else if (r.outcome === 'requested') handlers.onNote?.({ tone: 'positive', text: 'You asked to cancel. It is past the free-cancel time, so the vendor has to accept.' });
        else handlers.onNote?.({ tone: 'positive', text: action === 'withdraw' ? 'Withdrawn. Nothing was charged.' : 'Cancelled.' });
        break;
      }
      case 'pay':
        handlers.onPay(bookingId, paymentId);
        break;
      case 'pay-in-full': {
        const r = host.call<{ ok: boolean; message?: string }>('guest.choosePayInFull', guestId, bookingId);
        if (!r.ok) handlers.onNote?.({ tone: 'warning', text: r.message ?? 'That did not go through.' });
        else if (pilot.booking(bookingId).status === 'awaiting-payment' || pilot.booking(bookingId).needsPayChange) handlers.onPay(bookingId);
        break;
      }
      case 'show-qr':
        setQr(true);
        break;
      case 'running-late': {
        const r = host.call<{ ok: boolean; message?: string }>('guest.runningLate', guestId, bookingId);
        handlers.onNote?.(r.ok ? { tone: 'positive', text: 'The restaurant knows you are running late.' } : { tone: 'warning', text: r.message ?? 'That did not go through.' });
        break;
      }
      case 'message-desk':
        handlers.onOpenDesk?.();
        break;
      case 'pick-another':
        handlers.onPickAnother?.(bookingId);
        break;
      case 'open-menu':
        handlers.onOpenMenu?.(listing.id);
        break;
      case 'question': {
        // On a booking's own card it is about what the booking costs; on an extra charge, about that charge.
        const about = paymentId ?? pilot.payments(bookingId).find((x) => x.purpose === 'booking' && !x.duplicate)?.id;
        if (about) handlers.onQuestion?.(about);
        break;
      }
      case 'view-booking':
        break;
    }
  };

  const vendorName = pilot.vendors().find((v) => v.id === listing.vendorId)?.name ?? '';
  // The vendor is the subtitle, so it is not a fact as well. An extra charge says what it was added to.
  const subtitle = paymentId ? `Added to ${listing.title}` : vendorName;
  const facts = card.facts.filter((fact) => fact.label !== 'Vendor');
  const tone = STATUS_TONE(card.state, card.label);
  const status = <span className={`pilot-status pilot-status--${tone}`}>{card.label}</span>;

  return (
    <article className={`pilot-card pilot-card--${card.state}${bare ? ' pilot-card--bare' : ''}`} aria-label={`${card.title}, ${card.label}`}>
      {bare ? (
        <div className="pilot-card__status-row">{status}{subtitle ? <span>{subtitle}</span> : null}</div>
      ) : (
        <header className="pilot-card__head">
          <BookingThumb className="pilot-card__thumb" image={handlers.imageFor?.(bookingId)} kind={booking.kind} extra={Boolean(paymentId)} />
          <div className="pilot-card__title">
            <h3>{card.title}</h3>
            <p>{status}{subtitle ? <span>{subtitle}</span> : null}</p>
          </div>
        </header>
      )}
      {facts.length ? (
        <dl className="pilot-card__facts">
          {facts.map((f) => (
            <div key={f.label}><dt>{f.label}</dt><dd>{f.value}</dd></div>
          ))}
        </dl>
      ) : null}
      {card.note && !inThread ? <p className="pilot-card__note">{card.note}</p> : null}
      <div className="pilot-card__cost"><span>{card.cost.line}</span>{card.cost.amount ? <b>{peso(card.cost.amount)}</b> : null}</div>
      {card.timer ? (
        <div className="pilot-timer">
          <progress max={1} value={card.timer.progress} aria-label="Time left" />
          <span>{card.timer.text}</span>
        </div>
      ) : null}
      {confirmingCancel && card.actions.includes('cancel') ? (
        <div className="pilot-actions" role="group" aria-label="Confirm cancelling">
          <p className="pilot-muted">{freeToCancel ? 'Cancel this booking? Anything charged is undone.' : 'The free-cancel time has passed. Ask the vendor to cancel? They have to accept.'}</p>
          <button type="button" className="guest-button guest-button--secondary" onClick={() => setConfirmingCancel(false)}>Keep it</button>
          <button type="button" className="guest-button guest-button--primary" onClick={doCancel}>{freeToCancel ? 'Yes, cancel' : 'Yes, ask to cancel'}</button>
        </div>
      ) : card.actions.length ? (
        <div className="pilot-actions">
          {card.actions.filter((a) => a !== 'open-menu' || (handlers.hasMenu ? handlers.hasMenu(listing.id) : true)).map((a) => (
            <button key={a} type="button" className={`guest-button ${PRIMARY.includes(a) ? 'guest-button--primary' : 'guest-button--secondary'}${PRIMARY.includes(a) ? ' pilot-actions__lead' : ''}`} onClick={() => act(a)}>
              {a === 'pay' && card.cost.amount ? `Pay now ${peso(card.cost.amount)}` : LABEL[a]}
            </button>
          ))}
        </div>
      ) : null}
      {qr ? (
        <div className="pilot-sheet-backdrop" onClick={(e) => { if (e.target === e.currentTarget) setQr(false); }}>
          <div className="pilot-sheet" role="dialog" aria-modal="true" aria-label="Show this at the vendor">
            <header><h2>Show this at the vendor</h2><button type="button" className="pilot-icon" onClick={() => setQr(false)} aria-label="Close"><X aria-hidden="true" /></button></header>
            <div className="pilot-qr"><QRCodeSVG value={`cabana-booking:${bookingId}`} size={176} /></div>
            <p className="pilot-muted">{card.title}. If your phone is dead, the vendor can find this by your name and room.</p>
          </div>
        </div>
      ) : null}
    </article>
  );
}
