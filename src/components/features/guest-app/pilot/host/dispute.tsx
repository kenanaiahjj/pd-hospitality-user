'use client';

import { X } from '@phosphor-icons/react';
import type { Dispute, Message } from '../types';
import { EngineBookingCard, type CardHandlers } from './booking-card';
import type { Host } from './host';
import '../ui/pilot.css';

/*
  The front desk reading a dispute: the one time it sees a guest and vendor
  chat. It is read only -- there is no composer, and the desk is never a member
  of that chat. Both sides were told in their chat that it was read. The desk
  asks each side in its own chat with them, then decides here, and deciding
  ends the access.

  The guest app is the guest's; this sheet stands in for the desk's screen in
  the prototype, opened from the prototype controls.
*/

const KIND_TITLE: Record<Dispute['kind'], string> = {
  charge: 'Extra charge',
  'no-show': 'No-show',
  'vendor-cancel': 'Vendor cancellation',
  damage: 'Damage claim',
};

const clock12 = (ms: number) => {
  const d = new Date(ms);
  const h = d.getUTCHours();
  return `${((h + 11) % 12) + 1}:${String(d.getUTCMinutes()).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
};

export function DisputeSheet({ host, bookingId, dispute, messages, onClose, onDecided, ...handlers }: {
  host: Host;
  bookingId: string;
  dispute: Dispute;
  /** The chat as it stood when the desk opened it. */
  messages: Message[];
  onClose: () => void;
  /** After a decision: what happened, said where the presenter will see it. */
  onDecided: (text: string) => void;
} & CardHandlers) {
  const pilot = host.pilot;
  const booking = pilot.booking(bookingId);
  const listing = pilot.listing(booking.listingId);
  const vendor = pilot.vendors().find((v) => v.id === listing.vendorId)?.name ?? 'the vendor';
  const guest = messages.find((m) => m.from.role === 'guest')?.from.name ?? 'The guest';
  const payment = dispute.paymentId ? pilot.payment(dispute.paymentId) : undefined;
  const open = pilot.disputes(bookingId).some((d) => d.id === dispute.id && d.decidedAt === undefined);

  const decide = (path: string, args: unknown[], said: string) => {
    const result = host.call<{ ok: boolean; message?: string }>(path, ...args);
    onDecided(result.ok ? said : result.message ?? 'That did not go through.');
    if (result.ok) onClose();
  };

  // What the two of them said, and what happened between, in order. The desk's own notice is left out: it is the desk's doing.
  const shown = messages.filter((m) => m.kind !== 'card' && !(m.kind === 'system' && /front desk read this chat/i.test(m.text)));

  return (
    <div className="pilot-sheet-backdrop pilot-dispute-backdrop" onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="pilot-dispute" role="dialog" aria-modal="true" aria-label={`Dispute, ${KIND_TITLE[dispute.kind]}, read only`}>
        <header className="pilot-dispute__head">
          <div>
            <h2>Dispute · {KIND_TITLE[dispute.kind]}</h2>
            <p>{guest} · {listing.title} · {vendor}</p>
          </div>
          <span className="pilot-dispute__tag">Read only</span>
          <button type="button" className="pilot-icon" onClick={onClose} aria-label="Close"><X aria-hidden="true" /></button>
        </header>
        <div className="pilot-dispute__strip">
          <span><b>You are not part of this chat</b>{guest} and {vendor} were told you read it.</span>
          <span className={`pilot-status pilot-status--${open ? 'wait' : 'good'}`}>{open ? 'In question' : 'Decided'}</span>
        </div>
        <div className="pilot-dispute__thread" aria-label="The guest and vendor chat">
          {shown.map((m) => m.kind === 'system' ? (
            <p key={m.id} className="pilot-event">{m.text}</p>
          ) : (
            <div key={m.id} className={`pilot-dispute__msg pilot-dispute__msg--${m.from.role === 'guest' ? 'guest' : 'vendor'}`}>
              <small>{m.from.role === 'guest' ? guest : m.from.name} · {clock12(m.at)}</small>
              <p>{m.text}</p>
            </div>
          ))}
          <EngineBookingCard host={host} bookingId={bookingId} paymentId={payment?.purpose === 'extra' ? payment.id : undefined} inThread {...handlers} />
        </div>
        <footer className="pilot-dispute__foot">
          <p>Ask each side in your own chat with them. You cannot write here.</p>
          {!open ? null : dispute.kind === 'vendor-cancel' ? (
            <div className="pilot-dispute__decide">
              <button type="button" className="guest-button guest-button--secondary" onClick={() => decide('desk.decideCancelDispute', [bookingId, 'stands'], 'The cancellation stands. Both sides are told, and the desk can no longer read the chat.')}>Cancellation stands</button>
              <button type="button" className="guest-button guest-button--primary" onClick={() => decide('desk.decideCancelDispute', [bookingId, 'reinstate'], 'Reinstated: a fresh request went back to the vendor. The desk can no longer read the chat.')}>Reinstate it</button>
            </div>
          ) : payment ? (
            <div className="pilot-dispute__decide pilot-dispute__decide--three">
              <button type="button" className="guest-button guest-button--secondary" onClick={() => decide('desk.resolveCharge', [payment.id, 'waive'], 'Waived. Both sides are told, and the desk can no longer read the chat.')}>Waive</button>
              <button type="button" className="guest-button guest-button--secondary" onClick={() => decide('desk.resolveCharge', [payment.id, 'adjust', Math.max(1, Math.round(payment.amount / 2))], `Adjusted to half. Both sides are told, and the desk can no longer read the chat.`)}>Adjust</button>
              <button type="button" className="guest-button guest-button--primary" onClick={() => decide('desk.resolveCharge', [payment.id, 'uphold'], 'Upheld. Both sides are told, and the desk can no longer read the chat.')}>Uphold</button>
            </div>
          ) : null}
        </footer>
      </section>
    </div>
  );
}
