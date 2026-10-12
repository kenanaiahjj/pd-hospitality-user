'use client';

import { Bicycle, ForkKnife, HandHeart, Receipt, ShoppingBag, X } from '@/components/ui/huge-icons';
import Image from 'next/image';
import { QRCodeSVG } from 'qrcode.react';
import { useState } from 'react';
import { createPortal } from 'react-dom';
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

const KIND_ICON = { rental: Bicycle, service: HandHeart, table: ForkKnife, goods: ShoppingBag } as const;

const LABEL: Record<CardAction, string> = {
  cancel: 'Cancel',
  withdraw: 'Withdraw request',
  pay: 'Pay now',
  'pay-in-full': 'Pay in full instead',
  'show-qr': 'Show QR',
  'open-menu': 'Open menu',
  'view-booking': 'View booking',
  'pick-another': 'Book again',
  'message-desk': 'Ask the front desk',
  'call-vendor': 'Call the vendor',
  question: 'Question this charge',
  'dispute-cancel': 'Dispute this cancellation',
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
  state === 'extra-charge' && label === 'Removed' ? 'bad' : label === 'In progress' ? 'live' : STATE_TONE[state ?? ''] ?? 'wait';

const clockAt = (ms: number) => {
  const d = new Date(ms);
  const h = d.getUTCHours();
  return `${((h + 11) % 12) + 1}:${String(d.getUTCMinutes()).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
};

/** A fact as a phrase someone would say: "2 bikes", "Table for 4", "Back by 8:00 PM". */
export const factPhrase = (label: string, value: string) => {
  const n = Number(value);
  const count = (one: string, many: string) => `${value} ${n === 1 ? one : many}`;
  switch (label) {
    case 'Bikes': return count('bike', 'bikes');
    case 'Guests': return count('guest', 'guests');
    case 'Boxes': return count('box', 'boxes');
    case 'E-bikes': return count('e-bike', 'e-bikes');
    case 'Scooters': return count('scooter', 'scooters');
    case 'Motorcycles': return count('motorcycle', 'motorcycles');
    case 'Cars': return count('car', 'cars');
    case 'SUVs': return count('SUV', 'SUVs');
    case 'Rentals': return count('rental', 'rentals');
    case 'Party': return `Table for ${value}`;
    case 'Return': return `Back by ${value}`;
    case 'Held until': return `Held until ${value}`;
    default: return value;
  }
};

/**
 * How long is left, as a ring that runs down beside the sentence and the time it ends.
 * Plum when the next move is the guest's (pay, choose); amber while someone else is to answer.
 */
function Countdown({ timer, vendor }: { timer: NonNullable<Card['timer']>; vendor: string }) {
  const theirs = !/^(Pay|Choose)\b/.test(timer.text);
  const text = vendor ? timer.text.replace(/^Vendor\b/, vendor) : timer.text;
  const r = 8;
  const around = 2 * Math.PI * r;
  const left = Math.max(0, Math.min(1, timer.progress));
  return (
    <div className={`pilot-countdown pilot-countdown--${theirs ? 'theirs' : 'yours'}`} role="timer" aria-label={`${text}, until ${clockAt(timer.endsAt)}`}>
      <svg viewBox="0 0 20 20" aria-hidden="true">
        <circle cx="10" cy="10" r={r} className="pilot-countdown__track" />
        <circle cx="10" cy="10" r={r} className="pilot-countdown__left" strokeDasharray={around} strokeDashoffset={around * (1 - left)} transform="rotate(-90 10 10)" />
      </svg>
      <span>{text}</span>
      <time>until {clockAt(timer.endsAt)}</time>
    </div>
  );
}

export function EngineBookingCard({ host, bookingId, paymentId, inThread, bare, inBar, inDesk, ...handlers }: {
  host: Host;
  bookingId: string;
  paymentId?: string;
  /** In the booking's own thread the guest's note is already a message there. */
  inThread?: boolean;
  /** On the booking's own page the title and photo are already the page's header. */
  bare?: boolean;
  /** Opened from a chat's booking bar, which already says the status, the day, the time and the facts. */
  inBar?: boolean;
  /** In the front desk chat: "Ask the front desk" would only point at where she already is. */
  inDesk?: boolean;
} & CardHandlers) {
  /*
    The QR sheet is drawn at the top of the app, not inside the card: a card
    that is animating, or sits in a chat's booking bar, would otherwise box the
    sheet in and cut it off. Where it goes is found when it is opened.
  */
  const [qr, setQr] = useState<Element | null>(null);
  const [confirming, setConfirming] = useState<'cancel' | 'withdraw' | null>(null);
  const pilot = host.pilot;
  const booking = pilot.booking(bookingId);
  const card: Card = paymentId ? pilot.extraCard(paymentId) : pilot.card(bookingId);
  const listing = pilot.listing(booking.listingId);
  const guestId = booking.guestId;
  const freeToCancel = booking.kind === 'table' || booking.start - host.now() >= listing.freeCancelHours * 3_600_000;

  // Cancelling and withdrawing are the same call; the engine says which it was.
  const shownActions = card.actions.filter((a) => !(inDesk && a === 'message-desk'));
  const doCancel = () => {
    setConfirming(null);
    const r = host.call<{ ok: boolean; message?: string; outcome?: string }>('guest.cancel', guestId, bookingId);
    if (!r.ok) handlers.onNote?.({ tone: 'warning', text: r.message ?? 'That did not go through.' });
    else if (r.outcome === 'requested') handlers.onNote?.({ tone: 'positive', text: 'You asked to cancel. It is past the free-cancel time, so the vendor has to accept.' });
    else handlers.onNote?.({ tone: 'positive', text: r.outcome === 'withdrawn' ? 'Withdrawn. Nothing was charged.' : 'Cancelled.' });
  };

  const act = (action: CardAction) => {
    switch (action) {
      // Neither a booking nor a request goes away on one stray tap: there is no undo.
      case 'cancel':
      case 'withdraw':
        setConfirming(action);
        break;
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
        setQr(document.querySelector('.guest-app') ?? document.body);
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
      case 'dispute-cancel': {
        const r = host.call<{ ok: boolean; message?: string }>('guest.disputeCancel', guestId, bookingId);
        handlers.onNote?.(r.ok ? { tone: 'positive', text: 'You disputed the cancellation. The front desk will look into it and tell you here.' } : { tone: 'warning', text: r.message ?? 'That did not go through.' });
        break;
      }
      case 'view-booking':
        break;
    }
  };

  const vendorRecord = pilot.vendors().find((v) => v.id === listing.vendorId);
  const vendorName = vendorRecord?.name ?? '';
  const vendorPhone = vendorRecord?.phone;
  // The vendor is the subtitle, so it is not a fact as well. An extra charge says what it was added to.
  const subtitle = paymentId ? `From ${vendorName} · ${listing.title}` : vendorName;
  const tone = card.label === 'In question' ? 'wait' : STATUS_TONE(card.state, card.label);
  const status = <span className={`pilot-status pilot-status--${tone}`}>{card.label}</span>;
  const image = paymentId ? undefined : handlers.imageFor?.(bookingId);

  // The day is the ticket's stub; the time leads the line beside it; the rest of the facts follow in one line.
  const day = new Date(booking.kind === 'goods' && booking.readyFor ? `${booking.readyFor}T00:00:00Z` : booking.start);
  const dayParts = {
    weekday: day.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' }),
    date: day.getUTCDate(),
    month: day.toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' }),
  };
  const asked = card.facts.find((f) => f.label === 'Cancellation');
  const rest = card.facts.filter((f) => !['Vendor', 'When', 'Cancellation', 'Reason'].includes(f.label));
  const lead = booking.kind === 'goods' ? (rest.find((f) => f.label === 'Ready for')?.value ?? '') : clockAt(booking.start);
  const detail = rest.filter((f) => f.label !== 'Ready for').map((f) => factPhrase(f.label, f.value)).join(' · ');

  return (
    <article className={`pilot-card pilot-card--${card.state}${bare || inBar ? ' pilot-card--bare' : ''}${inBar ? ' pilot-card--in-bar' : ''}${paymentId ? ' pilot-card--extra' : ''}`} aria-label={`${card.title}, ${card.label}`}>
      {inBar ? null : paymentId ? (
        // An extra charge reads as a receipt: what it is, who added it, and the amount, large.
        <header className="pilot-card__receipt">
          <span className="pilot-card__receipt-icon" aria-hidden="true"><Receipt weight="regular" /></span>
          <div className="pilot-card__title">
            <h3>{card.title}</h3>
            <p>{subtitle}</p>
          </div>
          <div className="pilot-card__amount">
            <b>{peso(card.cost.amount)}</b>
            <span className={`pilot-status pilot-status--${tone}`}>{card.label}</span>
          </div>
        </header>
      ) : bare ? (
        <div className="pilot-card__status-row">{status}{subtitle ? <span>{subtitle}</span> : null}</div>
      ) : image ? (
        <header className="pilot-card__hero">
          <span className="pilot-card__photo" aria-hidden="true"><Image src={image.src} alt="" fill sizes="(max-width: 720px) 90vw, 420px" style={{ objectPosition: image.focalPoint }} /></span>
          <span className={`pilot-card__chip pilot-card__chip--${tone}`}>{card.label}</span>
          <div className="pilot-card__title">
            <h3>{card.title}</h3>
            {subtitle ? <p>{subtitle}</p> : null}
          </div>
        </header>
      ) : (
        <header className="pilot-card__head">
          <BookingThumb className="pilot-card__thumb" kind={booking.kind} />
          <div className="pilot-card__title">
            <h3>{card.title}</h3>
            <p>{status}{subtitle ? <span>{subtitle}</span> : null}</p>
          </div>
        </header>
      )}
      {paymentId || inBar ? null : (
        <div className="pilot-card__ticket">
          <span className="pilot-card__day" aria-hidden="true"><small>{dayParts.weekday}</small><b>{dayParts.date}</b><small>{dayParts.month}</small></span>
          <span className="pilot-card__when">
            <b>{lead}</b>
            {detail ? <span>{detail}</span> : null}
          </span>
          {/* The same facts, said plainly, for anyone not reading the tile. */}
          <span className="sr-only">{card.facts.filter((f) => f.label !== 'Vendor' && f.label !== 'Cancellation').map((f) => `${f.label}: ${f.value}`).join('. ')}</span>
        </div>
      )}
      {asked ? <p className="pilot-card__note pilot-card__note--asked">{asked.value}</p> : null}
      {card.note && !inThread ? <p className="pilot-card__note">{card.note}</p> : null}
      <div className="pilot-card__cost"><span>{card.cost.line}</span>{card.cost.amount && !paymentId ? <b>{peso(card.cost.amount)}</b> : null}</div>
      {card.timer ? <Countdown timer={card.timer} vendor={vendorName} /> : null}
      {confirming === 'withdraw' && card.actions.includes('withdraw') ? (
        <div className="pilot-actions" role="group" aria-label="Confirm withdrawing">
          <p className="pilot-muted">Withdraw this request? {vendorName} stops holding it. Nothing is charged.</p>
          <button type="button" className="guest-button guest-button--secondary" onClick={() => setConfirming(null)}>Keep it</button>
          <button type="button" className="guest-button guest-button--primary" onClick={doCancel}>Yes, withdraw</button>
        </div>
      ) : confirming === 'cancel' && card.actions.includes('cancel') ? (
        <div className="pilot-actions" role="group" aria-label="Confirm cancelling">
          <p className="pilot-muted">{freeToCancel ? 'Cancel this booking? Anything charged is undone.' : 'The free-cancel time has passed. Ask the vendor to cancel? They have to accept.'}</p>
          <button type="button" className="guest-button guest-button--secondary" onClick={() => setConfirming(null)}>Keep it</button>
          <button type="button" className="guest-button guest-button--primary" onClick={doCancel}>{freeToCancel ? 'Yes, cancel' : 'Yes, ask to cancel'}</button>
        </div>
      ) : shownActions.length ? (
        <div className={`pilot-actions${shownActions.some((a) => PRIMARY.includes(a)) ? '' : ' pilot-actions--minor-only'}`}>
          {shownActions.filter((a) => a !== 'open-menu' || (handlers.hasMenu ? handlers.hasMenu(listing.id) : true)).map((a) => a === 'call-vendor' ? (
            // A request has no chat yet: the vendor is a phone call away, number and all.
            <a key={a} className="pilot-actions__minor pilot-actions__call" href={`tel:${(vendorPhone ?? '').replace(/\s/g, '')}`}>
              <span>Call {vendorName}</span><small>{vendorPhone}</small>
            </a>
          ) : (
            <button key={a} type="button" className={PRIMARY.includes(a) ? 'guest-button guest-button--primary pilot-actions__lead' : `pilot-actions__minor${a === 'cancel' || a === 'withdraw' ? ' pilot-actions__minor--quiet' : ''}`} onClick={() => act(a)}>
              {a === 'pay' && card.cost.amount ? `Pay now ${peso(card.cost.amount)}` : LABEL[a]}
            </button>
          ))}
        </div>
      ) : null}
      {qr ? createPortal(
        <div className="pilot-sheet-backdrop" onClick={(e) => { if (e.target === e.currentTarget) setQr(null); }}>
          <div className="pilot-sheet" role="dialog" aria-modal="true" aria-label="Show this at the vendor">
            <header><h2>Show this at the vendor</h2><button type="button" className="pilot-icon" onClick={() => setQr(null)} aria-label="Close"><X aria-hidden="true" /></button></header>
            <div className="pilot-qr"><QRCodeSVG value={`cabana-booking:${bookingId}`} size={200} /></div>
            <p className="pilot-muted">{card.title}. If your phone is dead, the vendor can find this by your name and room.</p>
          </div>
        </div>,
        qr,
      ) : null}
    </article>
  );
}
