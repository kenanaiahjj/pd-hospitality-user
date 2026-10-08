'use client';

import { ArrowLeft, Bicycle, CaretRight, ChatCircleDots, ForkKnife, PushPin, ShoppingBag, Sparkle } from '@phosphor-icons/react';
import { useEffect, useState } from 'react';
import { ChatComposer } from '../../chat-composer';
import { Notice } from '../../guest-ui';
import type { Message, ThreadSummary } from '../types';
import { EngineBookingCard, type CardHandlers } from './booking-card';
import { engineStatusLine } from './project';
import type { Host } from './host';
import '../ui/pilot.css';

/*
  Messages: the front desk, pinned, and one thread for every booking that has a
  request in it, each with the guest, the front desk and the vendor in the room.
  A message always shows who sent it. What the desk and the vendor say to each
  other privately never reaches this list: the engine does not hand it over.
*/

const clock12 = (ms: number) => {
  const d = new Date(ms);
  const h = d.getUTCHours();
  return `${((h + 11) % 12) + 1}:${String(d.getUTCMinutes()).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
};

const TONE: Record<string, string> = {
  'for-confirmation': 'wait',
  'pay-to-confirm': 'wait',
  confirmed: 'good',
  reserved: 'good',
  ready: 'good',
  lapsed: 'bad',
  cancelled: 'bad',
  'extra-charge': 'wait',
};

export type DeskRow = { preview: string; fromGuest: boolean; unread: boolean };

const KIND_ICON = { rental: Bicycle, service: Sparkle, table: ForkKnife, goods: ShoppingBag } as const;

export function MessagesList({ host, guestId, desk, onOpenDesk, onOpenThread }: {
  host: Host;
  guestId: string;
  desk: DeskRow;
  onOpenDesk: () => void;
  onOpenThread: (threadId: string) => void;
}) {
  const threads = host.pilot.threads('guest', guestId).filter((thread) => thread.kind === 'booking');
  return (
    <div className="guest-stack pilot-messages">
      <div className="guest-page-title"><h1>Messages</h1></div>

      <section aria-label="Front desk">
        <div className="pilot-group">
          <button type="button" className={`pilot-row${desk.unread ? ' is-unread' : ''}`} onClick={onOpenDesk} aria-label={`Front desk, pinned${desk.unread ? ', new message' : ''}`}>
            <span className="pilot-row__icon" aria-hidden="true"><ChatCircleDots weight="regular" /></span>
            <span className="pilot-row__body">
              <b>Front desk <PushPin aria-hidden="true" className="pilot-row__pin" /></b>
              <span className="pilot-row__preview">{desk.fromGuest ? 'You: ' : ''}{desk.preview}</span>
            </span>
            <span className="pilot-row__end">
              {desk.unread ? <i className="pilot-dot" aria-hidden="true" /> : null}
              <CaretRight aria-hidden="true" className="pilot-row__chevron" />
            </span>
          </button>
        </div>
      </section>

      <section aria-label="Bookings">
        <div className="pilot-section-head">
          <h2>Bookings</h2>
          {threads.length ? <span>{threads.length}</span> : null}
        </div>
        {threads.length === 0 ? (
          <p className="pilot-empty">A thread appears here as soon as you ask for something, with the front desk and the vendor in it.</p>
        ) : (
          <ul className="pilot-group">
            {threads.map((thread) => <li key={thread.id}><ThreadRow host={host} thread={thread} onOpen={onOpenThread} /></li>)}
          </ul>
        )}
      </section>
    </div>
  );
}

function ThreadRow({ host, thread, onOpen }: { host: Host; thread: ThreadSummary; onOpen: (id: string) => void }) {
  const last = thread.last;
  const booking = thread.bookingId ? host.pilot.booking(thread.bookingId) : undefined;
  const Icon = booking ? KIND_ICON[booking.kind] : ChatCircleDots;
  // A card is where things stand, said in words; a note from Cabana is a line of its own; a person's message names who.
  const preview = !last ? 'No messages yet.'
    : last.kind === 'card' ? (booking ? engineStatusLine(booking) : 'Booking card')
    : last.kind === 'system' ? last.text
    : `${last.from.role === 'guest' ? 'You' : last.from.name}: ${last.text}`;
  return (
    <button
      type="button"
      className={`pilot-row${thread.unread ? ' is-unread' : ''}`}
      onClick={() => onOpen(thread.id)}
      aria-label={`${thread.title}${thread.cardLabel ? `, ${thread.cardLabel}` : ''}${thread.unread ? `, ${thread.unread} unread` : ''}`}
    >
      <span className="pilot-row__icon" aria-hidden="true"><Icon weight="regular" /></span>
      <span className="pilot-row__body">
        <b>{thread.title}</b>
        <span className="pilot-row__preview">{preview}</span>
      </span>
      <span className="pilot-row__end">
        {thread.cardLabel ? <span className={`pilot-state pilot-state--${TONE[thread.cardState ?? ''] ?? 'wait'}`}>{thread.cardLabel}</span> : null}
        <span className="pilot-row__meta">
          {thread.unread ? <i className="pilot-badge" aria-hidden="true">{thread.unread}</i> : null}
          <CaretRight aria-hidden="true" className="pilot-row__chevron" />
        </span>
      </span>
    </button>
  );
}

const ROLE_WORD = { guest: 'You', desk: 'Front desk', vendor: 'Vendor', system: 'Cabana' } as const;

export function BookingThreadScreen({ host, threadId, onBack, onOpenDesk, onAskDesk, note, ...handlers }: {
  host: Host;
  threadId: string;
  onBack: () => void;
  /** What the engine said about the last tap on a card, when it is worth saying. */
  note?: { tone: 'warning' | 'positive'; text: string } | null;
  /** After a thread closes, a question goes to the front desk's own chat. */
  onAskDesk: (text: string) => void;
} & CardHandlers) {
  const [draft, setDraft] = useState('');
  // Looking is not reading: the thread is only marked read by the effect below, which is recorded like any action.
  const view = host.pilot.thread(threadId, 'guest', false);
  const bookingId = threadBookingId(host, threadId);
  const guestId = bookingId ? host.pilot.booking(bookingId).guestId : undefined;
  const thread = guestId ? host.pilot.threads('guest', guestId).find((t) => t.id === threadId) : undefined;
  const unread = thread?.unread ?? 0;
  useEffect(() => {
    if (unread > 0) host.call('pilot.thread', threadId, 'guest');
  }, [host, threadId, unread]);
  if (!view.ok) return <p className="pilot-muted">{view.message}</p>;

  const send = (text: string) => {
    if (!text.trim()) return;
    if (view.readOnly) onAskDesk(text.trim());
    else if (guestId) host.call('guest.send', guestId, threadId, text.trim());
    setDraft('');
  };

  return (
    <div className="guest-chat guest-chat--conversation" role="region" aria-label={`${thread?.title ?? 'Booking'} conversation`}>
      <div className="guest-chat__context">
        <div className="guest-chat__identity">
          <button className="guest-chat__back" type="button" onClick={onBack} aria-label="Go back"><ArrowLeft aria-hidden="true" /></button>
          <div className="guest-chat__identity-copy">
            <h1>{thread?.title ?? 'Booking'}</h1>
            <span>With the front desk and {bookingId ? vendorName(host, bookingId) : 'the vendor'}</span>
          </div>
        </div>
      </div>
      <div className="guest-messages" aria-label="Conversation" aria-live="polite">
        {view.messages.map((message) => (
          <ThreadMessage key={message.id} host={host} message={message} onOpenDesk={onOpenDesk} {...handlers} />
        ))}
      </div>
      {note ? <Notice tone={note.tone} title={note.tone === 'warning' ? 'That did not go through' : 'Done'}>{note.text}</Notice> : null}
      {view.readOnly ? <Notice title="This thread has closed">It closed 48 hours after the service. Anything you send now goes to the front desk.</Notice> : null}
      <div className="guest-chat__dock">
        <ChatComposer draft={draft} onDraftChange={setDraft} onSubmit={({ body }) => send(body)} placeholder={view.readOnly ? 'Ask the front desk' : 'Message everyone in this booking'} />
      </div>
    </div>
  );
}

const threadBookingId = (host: Host, threadId: string): string | undefined => host.pilot.bookings().find((b) => b.threadId === threadId)?.id;
const vendorName = (host: Host, bookingId: string) => {
  const listing = host.pilot.listing(host.pilot.booking(bookingId).listingId);
  return host.pilot.vendors().find((v) => v.id === listing.vendorId)?.name ?? 'the vendor';
};

function ThreadMessage({ host, message, ...handlers }: { host: Host; message: Message } & CardHandlers) {
  if (message.kind === 'system') return <p className="pilot-system"><b>{message.from.name}</b> · {message.text}</p>;
  if (message.kind === 'card' && message.bookingId) {
    return <EngineBookingCard host={host} bookingId={message.bookingId} paymentId={message.paymentId} inThread {...handlers} />;
  }
  const mine = message.from.role === 'guest';
  return (
    <div className={`guest-message guest-message--${mine ? 'guest' : 'desk'} pilot-msg pilot-msg--${message.from.role}`}>
      <span className="pilot-sender">
        {message.from.name}
        {(message.from.role === 'vendor' || message.from.role === 'desk') && message.from.name !== ROLE_WORD[message.from.role] ? <i>{ROLE_WORD[message.from.role]}</i> : null}
      </span>
      <p>{message.text}</p>
      <small>{clock12(message.at)}</small>
    </div>
  );
}
