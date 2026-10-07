'use client';

import { QRCodeSVG } from 'qrcode.react';
import { useState } from 'react';
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
  /** What the engine said back: a refusal worth showing, or a plain confirmation. */
  onNote?: (note: { tone: 'warning' | 'positive'; text: string }) => void;
};

export function EngineBookingCard({ host, bookingId, paymentId, ...handlers }: { host: Host; bookingId: string; paymentId?: string } & CardHandlers) {
  const [qr, setQr] = useState(false);
  const pilot = host.pilot;
  const booking = pilot.booking(bookingId);
  const card: Card = paymentId ? pilot.extraCard(paymentId) : pilot.card(bookingId);
  const listing = pilot.listing(booking.listingId);
  const guestId = booking.guestId;

  const act = (action: CardAction) => {
    switch (action) {
      case 'cancel':
      case 'withdraw': {
        const r = host.call<{ ok: boolean; message?: string; outcome?: string }>('guest.cancel', guestId, bookingId);
        if (!r.ok) handlers.onNote?.({ tone: 'warning', text: r.message ?? 'That did not go through.' });
        else if (r.outcome === 'requested') handlers.onNote?.({ tone: 'positive', text: 'You asked to cancel. It is inside the free-cancel window, so the vendor has to accept.' });
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
      case 'question':
        if (paymentId) handlers.onQuestion?.(paymentId);
        break;
      case 'view-booking':
        break;
    }
  };

  return (
    <article className={`pilot-card pilot-card--${card.state}`} aria-label={`${card.title}, ${card.label}`}>
      <header>
        <small>{card.kindLabel}</small>
        <span className={`pilot-state pilot-state--${STATE_TONE[card.state] ?? 'wait'}`}>{card.label}</span>
      </header>
      <h3>{card.title}</h3>
      <dl>
        {card.facts.map((f) => (
          <div key={f.label}><dt>{f.label}</dt><dd>{f.value}</dd></div>
        ))}
      </dl>
      {card.note ? <p className="pilot-card__note">“{card.note}”</p> : null}
      <p className="pilot-card__cost">{card.cost.amount ? <b>{peso(card.cost.amount)}</b> : null} {card.cost.line}</p>
      {card.timer ? (
        <div className="pilot-timer">
          <span>{card.timer.text}</span>
          <progress max={1} value={card.timer.progress} aria-label="Time left" />
        </div>
      ) : null}
      {card.actions.length ? (
        <div className="pilot-actions">
          {card.actions.map((a) => (
            <button key={a} type="button" className={`guest-button ${PRIMARY.includes(a) ? 'guest-button--primary' : 'guest-button--secondary'}`} onClick={() => act(a)}>
              {a === 'pay' && card.cost.amount ? `Pay now ${peso(card.cost.amount)}` : LABEL[a]}
            </button>
          ))}
        </div>
      ) : null}
      {qr ? (
        <div className="pilot-sheet-backdrop" onClick={(e) => { if (e.target === e.currentTarget) setQr(false); }}>
          <div className="pilot-sheet" role="dialog" aria-modal="true" aria-label="Show this at the vendor">
            <header><h2>Show this at the vendor</h2><button type="button" className="pilot-icon" onClick={() => setQr(false)} aria-label="Close">×</button></header>
            <div className="pilot-qr"><QRCodeSVG value={`cabana-booking:${bookingId}`} size={176} /></div>
            <p className="pilot-muted">{card.title}. If your phone is dead, the vendor can find this by your name and room.</p>
          </div>
        </div>
      ) : null}
    </article>
  );
}
