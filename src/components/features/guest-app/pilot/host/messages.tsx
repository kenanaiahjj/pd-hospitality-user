'use client';

import { ArrowLeft, CaretDown, CallBell, PushPin } from '@phosphor-icons/react';
import Image from 'next/image';
import { Fragment, useEffect, useState, type CSSProperties } from 'react';
import { ChatComposer } from '../../chat-composer';
import { Notice } from '../../guest-ui';
import type { Message, ThreadSummary } from '../types';
import type { ServiceImageDefinition } from '../../service-images';
import { EngineBookingCard, STATUS_TONE, type CardHandlers } from './booking-card';
import { engineStatusLine } from './project';
import type { Host } from './host';
import '../ui/pilot.css';

/*
  Messages, as a messaging app has them: people, not records. Every chat is
  one to one. The guest talks to the front desk in one chat (pinned), and to
  each vendor in that booking's chat. The desk and the vendor have their own
  chat, which never reaches the guest: the engine does not hand it over.

  A chat leads with who it is with. The booking it is about is a bar under
  the header that opens the full card; what happens to it shows in the
  conversation as a small centred line, the way a messaging app marks an event.
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

/** A day divider in a conversation: "Today", "Yesterday", or the date. */
const dayLabel = (ms: number, now: number) =>
  dayOf(ms) === dayOf(now) ? 'Today' : dayOf(ms) === dayOf(now) - 1 ? 'Yesterday' : shortDate(ms);

const vendorOf = (host: Host, bookingId: string) => {
  const listing = host.pilot.listing(host.pilot.booking(bookingId).listingId);
  return host.pilot.vendors().find((v) => v.id === listing.vendorId)?.name ?? 'The vendor';
};

export function MessagesList({ host, guestId, desk, imageFor, onOpenDesk, onOpenThread }: {
  host: Host;
  guestId: string;
  desk: DeskRow;
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
      {/* The front desk, as a card of its own above the conversations: the one chat that is always there. */}
      <div className="pilot-desk-card">
        <button type="button" className={`pilot-chat-row pilot-chat-row--desk${desk.unread ? ' is-unread' : ''}`} onClick={onOpenDesk} aria-label={`Front desk, pinned${desk.unread ? ', new message' : ''}`}>
          <span className="pilot-faces" aria-hidden="true">
            <span className="pilot-face pilot-face--desk"><CallBell /></span>
          </span>
          <span className="pilot-chat-row__body">
            <span className="pilot-chat-row__top">
              <b>Front desk</b>
              {desk.place ? <span className="pilot-chat-row__about">· {desk.place}</span> : null}
              <PushPin weight="fill" aria-hidden="true" className="pilot-chat-row__pin" />
            </span>
            <span className="pilot-chat-row__meta pilot-chat-row__meta--preview">
              <span className="pilot-chat-row__preview">{desk.fromGuest ? 'You: ' : ''}{desk.preview}</span>
              {desk.unread ? <i className="pilot-dot" aria-hidden="true" /> : null}
            </span>
          </span>
        </button>
      </div>
      <ul className="pilot-inbox">
        {threads.map((thread) => (
          <li key={thread.id}>
            <ThreadRow host={host} thread={thread} image={thread.bookingId ? imageFor?.(thread.bookingId) : undefined} onOpen={onOpenThread} />
          </li>
        ))}
      </ul>
      {threads.length === 0 ? <p className="pilot-empty">Book something in Explore and you can message the vendor here.</p> : null}
    </div>
  );
}

/* Each partner gets a face of its own: its initials on a colour taken from its name, so two vendors never look alike. */
const FACE_HUES = [250, 200, 300, 175, 225, 330, 280, 215];
const faceHue = (name: string) => FACE_HUES[[...name].reduce((sum, ch) => sum + ch.charCodeAt(0), 0) % FACE_HUES.length]!;
const initials = (name: string) => name.replace(/^The\s+/i, '').split(/\s+/).filter(Boolean).slice(0, 2).map((word) => word[0]!.toUpperCase()).join('');

/** Who, and what about: the vendor's face in front, the booking's photo behind it. */
function Faces({ name, image, small }: { name: string; image?: ServiceImageDefinition; small?: boolean }) {
  return (
    <span className={`pilot-faces${small ? ' pilot-faces--small' : ''}`} aria-hidden="true">
      <span className="pilot-face pilot-face--booking">{image ? <Image src={image.src} alt="" fill sizes="44px" style={{ objectPosition: image.focalPoint }} /> : null}</span>
      <span className="pilot-face pilot-face--vendor pilot-face--initials" style={{ '--face-hue': faceHue(name) } as CSSProperties}>{initials(name)}</span>
    </span>
  );
}

function ThreadRow({ host, thread, image, onOpen }: { host: Host; thread: ThreadSummary; image?: ServiceImageDefinition; onOpen: (id: string) => void }) {
  const booking = thread.bookingId ? host.pilot.booking(thread.bookingId) : undefined;
  const name = booking ? vendorOf(host, booking.id) : thread.title;
  // The last thing said, as an inbox shows it. A status change says itself; a person's words name only "You".
  const last = thread.last;
  const preview = !last ? 'No messages yet.'
    : last.kind === 'card' ? (booking ? engineStatusLine(booking) : 'Booking')
    : last.kind === 'system' ? last.text
    : `${last.from.role === 'guest' ? 'You: ' : ''}${last.text}`;
  return (
    <button
      type="button"
      className={`pilot-chat-row${thread.unread ? ' is-unread' : ''}`}
      onClick={() => onOpen(thread.id)}
      aria-label={`${name}, ${thread.title}${thread.cardLabel ? `, ${thread.cardLabel}` : ''}${thread.unread ? `, ${thread.unread} unread` : ''}`}
    >
      <Faces name={name} image={image} />
      <span className="pilot-chat-row__body">
        <span className="pilot-chat-row__top">
          <b>{name}</b>
          <span className="pilot-chat-row__about">· {thread.title}</span>
          {last ? <time>{sentAt(last.at, host.now())}</time> : null}
        </span>
        <span className="pilot-chat-row__preview">{preview}</span>
        <span className="pilot-chat-row__meta">
          {[thread.cardLabel, booking ? shortDate(booking.start) : undefined].filter(Boolean).join(' · ')}
          {thread.unread ? <i className="pilot-badge" aria-hidden="true">{thread.unread}</i> : null}
        </span>
      </span>
    </button>
  );
}

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
  const [open, setOpen] = useState(false);
  // Looking is not reading: the thread is only marked read by the effect below, which is recorded like any action.
  const view = host.pilot.thread(threadId, 'guest', false);
  const bookingId = threadBookingId(host, threadId);
  const booking = bookingId ? host.pilot.booking(bookingId) : undefined;
  const guestId = booking?.guestId;
  const thread = guestId ? host.pilot.threads('guest', guestId).find((t) => t.id === threadId) : undefined;
  const unread = thread?.unread ?? 0;
  useEffect(() => {
    if (unread > 0) host.call('pilot.thread', threadId, 'guest');
  }, [host, threadId, unread]);
  if (!view.ok) return <p className="pilot-muted">{view.message}</p>;

  const name = bookingId ? vendorOf(host, bookingId) : 'The vendor';
  const card = bookingId ? host.pilot.card(bookingId) : undefined;
  const tone = card ? STATUS_TONE(card.state, card.label) : 'wait';
  // Has the vendor read what the guest last said? Their side of the thread knows.
  const vendorUnread = booking ? host.pilot.threads('vendor', host.pilot.listing(booking.listingId).vendorId).find((t) => t.id === threadId)?.unread ?? 0 : 0;
  const lastGuestId = [...view.messages].reverse().find((m) => m.kind === 'text' && m.from.role === 'guest')?.id;
  const now = host.now();
  // The booking's own card is the bar at the top; only other cards (an extra charge) sit in the conversation.
  const messages = view.messages.filter((m) => !(m.kind === 'card' && m.bookingId === bookingId && !m.paymentId));

  const send = (text: string) => {
    if (!text.trim()) return;
    if (view.readOnly) onAskDesk(text.trim());
    else if (guestId) host.call('guest.send', guestId, threadId, text.trim());
    setDraft('');
  };

  return (
    <div className="guest-chat guest-chat--conversation pilot-chat" role="region" aria-label={`${thread?.title ?? 'Booking'} conversation`}>
      <div className="guest-chat__context">
        <div className="guest-chat__identity">
          <button className="guest-chat__back" type="button" onClick={onBack} aria-label="Go back"><ArrowLeft aria-hidden="true" /></button>
          <Faces small name={name} image={bookingId ? handlers.imageFor?.(bookingId) : undefined} />
          <div className="guest-chat__identity-copy">
            <h1>{name}</h1>
            <span>{thread?.title ?? 'Booking'}</span>
          </div>
        </div>
      </div>

      {card && bookingId ? (
        <div className={`pilot-booking-bar${open ? ' is-open' : ''}`}>
          <button type="button" className="pilot-booking-bar__toggle" aria-expanded={open} onClick={() => setOpen(!open)} aria-label={open ? 'Hide booking details' : `${card.title}, ${card.label}`}>
            <span className={`pilot-status pilot-status--${tone}`}>{card.label}</span>
            <span className="pilot-booking-bar__when">{booking ? `${shortDate(booking.start)}, ${clock12(booking.start)}` : ''}</span>
            <span className="pilot-booking-bar__more">{open ? 'Hide' : 'Details'}<CaretDown aria-hidden="true" /></span>
          </button>
          {card.actions.includes('pay') && !open ? (
            <button type="button" className="guest-button guest-button--primary pilot-booking-bar__pay" onClick={() => handlers.onPay(bookingId)}>
              Pay {card.cost.amount ? `₱${card.cost.amount.toLocaleString('en-US')}` : 'now'}
            </button>
          ) : null}
          {open ? <EngineBookingCard host={host} bookingId={bookingId} inThread bare {...handlers} onOpenDesk={onOpenDesk} /> : null}
        </div>
      ) : null}

      <div className="guest-messages" aria-label="Conversation" aria-live="polite">
        {messages.map((message, index) => {
          const previous = messages[index - 1];
          const next = messages[index + 1];
          // Messages from one person in a row, on one day, read as one turn, timed once at the bottom.
          const sameTurn = (a?: Message, b?: Message) => Boolean(a && b && a.kind === 'text' && b.kind === 'text' && a.from.role === b.from.role && dayOf(a.at) === dayOf(b.at));
          const newDay = !previous || dayOf(previous.at) !== dayOf(message.at);
          return (
            <Fragment key={message.id}>
              {newDay ? <p className="pilot-day">{dayLabel(message.at, now)}</p> : null}
              <ThreadMessage
                host={host}
                message={message}
                first={!sameTurn(previous, message)}
                last={!sameTurn(message, next)}
                receipt={message.id === lastGuestId ? (vendorUnread > 0 ? 'Delivered' : 'Seen') : undefined}
                onOpenDesk={onOpenDesk}
                {...handlers}
              />
            </Fragment>
          );
        })}
      </div>
      {note ? <Notice tone={note.tone} title={note.tone === 'warning' ? 'That did not go through' : 'Done'}>{note.text}</Notice> : null}
      {view.readOnly ? <Notice title="This thread has closed">It closed 48 hours after the service. Anything you send now goes to the front desk.</Notice> : null}
      <div className="guest-chat__dock">
        <ChatComposer draft={draft} onDraftChange={setDraft} onSubmit={({ body }) => send(body)} placeholder={view.readOnly ? 'Ask the front desk' : `Message ${name}`} />
      </div>
    </div>
  );
}

const threadBookingId = (host: Host, threadId: string): string | undefined => host.pilot.bookings().find((b) => b.threadId === threadId)?.id;

function ThreadMessage({ host, message, first, last, receipt, ...handlers }: { host: Host; message: Message; first: boolean; last: boolean; receipt?: string } & CardHandlers) {
  // What happens to the booking is not anyone's message: a quiet line in the middle, as a messaging app marks an event.
  // The guest is reading: the line that opens the chat says "You asked", not their own name.
  if (message.kind === 'system') return <p className="pilot-event">{message.text.replace(/^(?!The front desk)\S+ (asked for|booked) /, 'You $1 ')}</p>;
  if (message.kind === 'card' && message.bookingId) {
    return <EngineBookingCard host={host} bookingId={message.bookingId} paymentId={message.paymentId} inThread {...handlers} />;
  }
  const mine = message.from.role === 'guest';
  return (
    <div className={`guest-message guest-message--${mine ? 'guest' : 'desk'} pilot-msg${first ? '' : ' guest-message--continued'}${last ? '' : ' pilot-msg--grouped'}`}>
      <p>{message.text}</p>
      {last ? <small>{clock12(message.at)}{receipt ? ` · ${receipt}` : ''}</small> : null}
    </div>
  );
}
