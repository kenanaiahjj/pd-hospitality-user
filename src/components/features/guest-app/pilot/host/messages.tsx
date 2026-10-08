'use client';

import { ArrowLeft, ChatCircleDots, PushPin } from '@phosphor-icons/react';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { ChatComposer } from '../../chat-composer';
import { Notice } from '../../guest-ui';
import type { Message, ThreadSummary } from '../types';
import type { ServiceImageDefinition } from '../../service-images';
import { BookingThumb, EngineBookingCard, STATUS_TONE, type CardHandlers } from './booking-card';
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

export type DeskRow = { preview: string; fromGuest: boolean; unread: boolean; /** The hotel the desk answers for. */ place?: string };

const DAY_MS = 86_400_000;
const dayOf = (ms: number) => Math.floor(ms / DAY_MS);
const shortDate = (ms: number) => new Date(ms).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' });

/** When the last message came: a time today, "Yesterday", or a date, as a phone's inbox says it. */
const sentAt = (ms: number, now: number) =>
  dayOf(ms) === dayOf(now) ? clock12(ms) : dayOf(ms) === dayOf(now) - 1 ? 'Yesterday' : shortDate(ms);

export function MessagesList({ host, guestId, desk, deskImage, imageFor, onOpenDesk, onOpenThread }: {
  host: Host;
  guestId: string;
  desk: DeskRow;
  /** The hotel's photograph, for the front desk's row. */
  deskImage?: ServiceImageDefinition;
  imageFor?: (bookingId: string) => ServiceImageDefinition | undefined;
  onOpenDesk: () => void;
  onOpenThread: (threadId: string) => void;
}) {
  // Newest conversation first, as any inbox.
  const threads = host.pilot.threads('guest', guestId)
    .filter((thread) => thread.kind === 'booking')
    .sort((a, b) => (b.last?.at ?? 0) - (a.last?.at ?? 0));
  return (
    <div className="guest-stack pilot-messages">
      <div className="guest-page-title"><h1>Messages</h1></div>

      <div className="pilot-group">
        <button type="button" className={`pilot-row${desk.unread ? ' is-unread' : ''}`} onClick={onOpenDesk} aria-label={`Front desk, pinned${desk.unread ? ', new message' : ''}`}>
          <span className="pilot-thumb pilot-thumb--desk" aria-hidden="true">
            {deskImage ? <Image src={deskImage.src} alt="" fill sizes="48px" style={{ objectPosition: deskImage.focalPoint }} /> : <ChatCircleDots />}
          </span>
          <span className="pilot-row__body">
            <span className="pilot-row__top">
              <b>Front desk</b>
              <PushPin weight="fill" aria-hidden="true" className="pilot-row__pin" />
            </span>
            <span className="pilot-row__preview">{desk.fromGuest ? 'You: ' : ''}{desk.preview}</span>
            <span className="pilot-row__meta">
              <span>{desk.place ?? 'Your hotel'}</span>
              {desk.unread ? <i className="pilot-dot" aria-hidden="true" /> : null}
            </span>
          </span>
        </button>
      </div>

      <section aria-label="Bookings" className="pilot-section">
        <h2 className="pilot-section__title">Bookings</h2>
        {threads.length === 0 ? (
          <p className="pilot-empty">Ask for something in Explore and its conversation starts here, with the front desk and the vendor in it.</p>
        ) : (
          <ul className="pilot-group">
            {threads.map((thread) => <li key={thread.id}><ThreadRow host={host} thread={thread} imageFor={imageFor} onOpen={onOpenThread} /></li>)}
          </ul>
        )}
      </section>
    </div>
  );
}

function ThreadRow({ host, thread, imageFor, onOpen }: { host: Host; thread: ThreadSummary; imageFor?: (bookingId: string) => ServiceImageDefinition | undefined; onOpen: (id: string) => void }) {
  const last = thread.last;
  const booking = thread.bookingId ? host.pilot.booking(thread.bookingId) : undefined;
  // A card is where things stand, said in words; a note from Cabana is a line of its own; a person's message names who.
  const preview = !last ? 'No messages yet.'
    : last.kind === 'card' ? (booking ? engineStatusLine(booking) : 'Booking card')
    : last.kind === 'system' ? last.text
    : `${last.from.role === 'guest' ? 'You' : last.from.name}: ${last.text}`;
  const quiet = thread.cardState === 'lapsed' || thread.cardState === 'cancelled';
  return (
    <button
      type="button"
      className={`pilot-row${thread.unread ? ' is-unread' : ''}${quiet ? ' is-quiet' : ''}`}
      onClick={() => onOpen(thread.id)}
      aria-label={`${thread.title}${thread.cardLabel ? `, ${thread.cardLabel}` : ''}${thread.unread ? `, ${thread.unread} unread` : ''}`}
    >
      {booking ? <BookingThumb className="pilot-thumb" image={imageFor?.(booking.id)} kind={booking.kind} /> : <span className="pilot-thumb" aria-hidden="true"><ChatCircleDots /></span>}
      <span className="pilot-row__body">
        <span className="pilot-row__top">
          <b>{thread.title}</b>
          {last ? <time>{sentAt(last.at, host.now())}</time> : null}
        </span>
        <span className="pilot-row__preview">{preview}</span>
        <span className="pilot-row__meta">
          <span>
            {thread.cardLabel ? <span className={`pilot-status pilot-status--${STATUS_TONE(thread.cardState, thread.cardLabel)}`}>{thread.cardLabel}</span> : null}
            {booking ? <span className="pilot-row__when">{shortDate(booking.start)}, {clock12(booking.start)}</span> : null}
          </span>
          {thread.unread ? <i className="pilot-badge" aria-hidden="true">{thread.unread}</i> : null}
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
