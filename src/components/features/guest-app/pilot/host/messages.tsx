'use client';

import { ArrowLeft, Bicycle, CaretDown, Compass, ForkKnife, ShoppingBag, Sparkle } from '@phosphor-icons/react';
import Image from 'next/image';
import type { ServiceImageDefinition } from '../../service-images';
import { Fragment, useEffect, useLayoutEffect, useRef, useState, type RefObject } from 'react';
import { ChatComposer } from '../../chat-composer';
import { Notice } from '../../guest-ui';
import type { Message, ThreadSummary } from '../types';
import { DeskBell } from './desk-bell';
import { EngineBookingCard, STATUS_TONE, factPhrase, type CardHandlers } from './booking-card';
import { engineStatusLine } from './project';
import type { Host } from './host';
import '../ui/pilot.css';

/*
  Messages, as a messaging app has them: people, not records. Every chat is
  one to one. The guest talks to the front desk in one chat (always on top), and to
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

/**
 * A conversation opens at its newest message and follows each new one, as any
 * messaging app does. It used to open at the top, with the latest out of sight.
 */
export function useStickToLatest(ref: RefObject<HTMLElement | null>, count: number) {
  useLayoutEffect(() => {
    const list = ref.current;
    if (list) list.scrollTop = list.scrollHeight;
  }, [ref, count]);
}

const vendorOf = (host: Host, bookingId: string) => {
  const listing = host.pilot.listing(host.pilot.booking(bookingId).listingId);
  return host.pilot.vendors().find((v) => v.id === listing.vendorId)?.name ?? 'The vendor';
};

export function MessagesList({ host, guestId, desk, imageFor, categoryFor, onOpenDesk, onOpenThread }: {
  host: Host;
  guestId: string;
  desk: DeskRow;
  /** A booking's photo and its category in the app, for the tile and its badge. */
  imageFor?: (bookingId: string) => ServiceImageDefinition | undefined;
  categoryFor?: (bookingId: string) => string | undefined;
  onOpenDesk: () => void;
  onOpenThread: (threadId: string) => void;
}) {
  // Newest conversation first, as any inbox. On a tie in the clock, the chat opened later goes first.
  const threads = host.pilot.threads('guest', guestId)
    .filter((thread) => thread.kind === 'booking')
    .map((thread, opened) => ({ thread, opened }))
    .sort((a, b) => (b.thread.last?.at ?? 0) - (a.thread.last?.at ?? 0) || b.opened - a.opened)
    .map(({ thread }) => thread);
  return (
    <div className="guest-stack pilot-messages">
      <div className="guest-page-title"><h1>Messages</h1></div>
      {/* The front desk, as a card of its own above the conversations: the one chat that is always there. */}
      <div className="pilot-desk-card">
        <button type="button" className={`pilot-chat-row pilot-chat-row--desk${desk.unread ? ' is-unread' : ''}`} onClick={onOpenDesk} aria-label={`Front desk chat${desk.unread ? ', new message' : ''}`}>
          <DeskBell />
          <span className="pilot-chat-row__body">
            <span className="pilot-chat-row__top">
              <b>Front desk</b>
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
            <ThreadRow host={host} thread={thread} image={thread.bookingId ? imageFor?.(thread.bookingId) : undefined} categoryFor={categoryFor} onOpen={onOpenThread} />
          </li>
        ))}
      </ul>
      {threads.length === 0 ? <p className="pilot-empty">Book something in Explore and you can message the vendor here.</p> : null}
    </div>
  );
}

/** What kind of booking a chat is about, for the badge on its photo. A tour is a service the app files under things to do. */
export type ChatKind = 'rental' | 'tour' | 'service' | 'table' | 'goods';
const KIND = {
  rental: { Icon: Bicycle, word: 'Rental' },
  tour: { Icon: Compass, word: 'Tour' },
  service: { Icon: Sparkle, word: 'Service' },
  table: { Icon: ForkKnife, word: 'Table' },
  goods: { Icon: ShoppingBag, word: 'Goods' },
} as const;
const kindOf = (host: Host, bookingId: string, categoryFor?: (bookingId: string) => string | undefined): ChatKind => {
  const kind = host.pilot.booking(bookingId).kind;
  if (kind === 'service' && categoryFor?.(bookingId) === 'entertainment') return 'tour';
  return kind;
};

/** The booking's photo as a rounded tile, with what kind of booking it is in a small badge on its corner. */
function ChatTile({ image, kind, quiet, small }: { image?: ServiceImageDefinition; kind: ChatKind; quiet?: boolean; small?: boolean }) {
  const { Icon } = KIND[kind];
  return (
    <span className={`pilot-tile${small ? ' pilot-tile--small' : ''}${quiet ? ' is-quiet' : ''}`} aria-hidden="true">
      <span className="pilot-tile__photo">{image ? <Image src={image.src} alt="" fill sizes="56px" style={{ objectPosition: image.focalPoint }} /> : <Icon />}</span>
      <span className="pilot-tile__badge"><Icon weight="bold" /></span>
    </span>
  );
}

function ThreadRow({ host, thread, image, categoryFor, onOpen }: { host: Host; thread: ThreadSummary; image?: ServiceImageDefinition; categoryFor?: (bookingId: string) => string | undefined; onOpen: (id: string) => void }) {
  const booking = thread.bookingId ? host.pilot.booking(thread.bookingId) : undefined;
  const name = booking ? vendorOf(host, booking.id) : thread.title;
  const kind = booking ? kindOf(host, booking.id, categoryFor) : 'service';
  // The last thing said, as an inbox shows it. A status change says itself; a person's words name only "You".
  const last = thread.last;
  const preview = !last ? 'No messages yet.'
    : last.kind === 'card' ? (booking ? engineStatusLine(booking) : 'Booking')
    : last.kind === 'system' ? asGuestReads(last.text)
    : `${last.from.role === 'guest' ? 'You: ' : ''}${last.text}`;
  return (
    <button
      type="button"
      className={`pilot-chat-row${thread.unread ? ' is-unread' : ''}`}
      onClick={() => onOpen(thread.id)}
      aria-label={`${name}, ${thread.title}${thread.cardLabel ? `, ${thread.cardLabel}` : ''}, ${KIND[kind].word}${thread.unread ? `, ${thread.unread} unread` : ''}`}
    >
      <ChatTile image={image} kind={kind} quiet={thread.cardState === 'lapsed' || thread.cardState === 'cancelled'} />
      <span className="pilot-chat-row__body">
        <span className="pilot-chat-row__top">
          <b>{name}</b>
          {last ? <time>{sentAt(last.at, host.now())}</time> : null}
        </span>
        <span className="pilot-chat-row__preview">{preview}</span>
        <span className="pilot-chat-row__meta">
          {/* Which booking, where it stands, and when: one quiet line that may be cut, under the two that may not. */}
          <span className="pilot-chat-row__meta-text">{[thread.title, thread.cardLabel, booking ? shortDate(booking.start) : undefined].filter(Boolean).join(' · ')}</span>
          {thread.unread ? <i className="pilot-badge" aria-hidden="true">{thread.unread}</i> : null}
        </span>
      </span>
    </button>
  );
}

export function BookingThreadScreen({ host, threadId, onBack, onOpenDesk, onAskDesk, note, categoryFor, ...handlers }: {
  host: Host;
  threadId: string;
  onBack: () => void;
  /** What the engine said about the last tap on a card, when it is worth saying. */
  note?: { tone: 'warning' | 'positive'; text: string } | null;
  /** After a thread closes, a question goes to the front desk's own chat. */
  onAskDesk: (text: string) => void;
  categoryFor?: (bookingId: string) => string | undefined;
} & CardHandlers) {
  const [draft, setDraft] = useState('');
  const [open, setOpen] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
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
  useStickToLatest(listRef, view.ok ? view.messages.length : 0);
  // A request the vendor has not accepted yet has no chat; anything else missing is a chat that is gone.
  if (!view.ok) {
    return (
      <div className="guest-stack">
        <div className="guest-page-title"><h1>No chat yet</h1><p>{booking && booking.status === 'requested' ? `A chat with ${vendorOf(host, booking.id)} opens once they accept your ${host.pilot.listing(booking.listingId).title} request. Until then, call them or ask the front desk from the booking.` : 'This chat is not available.'}</p></div>
        <button type="button" className="guest-button guest-button--secondary" onClick={onBack}>Back</button>
      </div>
    );
  }

  const name = bookingId ? vendorOf(host, bookingId) : 'The vendor';
  const card = bookingId ? host.pilot.card(bookingId) : undefined;
  const tone = card ? STATUS_TONE(card.state, card.label) : 'wait';
  // Has the vendor read what the guest last said? Their side of the thread knows.
  const vendorUnread = booking ? host.pilot.threads('vendor', host.pilot.listing(booking.listingId).vendorId).find((t) => t.id === threadId)?.unread ?? 0 : 0;
  const lastGuestId = [...view.messages].reverse().find((m) => m.kind === 'text' && m.from.role === 'guest')?.id;
  const now = host.now();
  // The booking's own card is the bar at the top; only other cards (an extra charge) sit in the conversation.
  // An extra charge arrives as a receipt card and a note saying the same; the chat keeps the card.
  const messages = view.messages.filter((m, i, all) =>
    !(m.kind === 'card' && m.bookingId === bookingId && !m.paymentId)
    && !(m.kind === 'system' && /^Extra charge ₱/.test(m.text) && all[i - 1]?.kind === 'card' && Boolean(all[i - 1]?.paymentId)));

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
          {bookingId ? <ChatTile small image={handlers.imageFor?.(bookingId)} kind={kindOf(host, bookingId, categoryFor)} /> : null}
          <div className="guest-chat__identity-copy">
            <h1>{name}</h1>
            <span>{thread?.title ?? 'Booking'}</span>
          </div>
        </div>
      </div>

      {card && bookingId ? (
        <div className={`pilot-booking-bar${open ? ' is-open' : ''}`}>
          <button type="button" className="pilot-booking-bar__toggle" aria-expanded={open} onClick={() => setOpen(!open)} aria-label={open ? 'Hide booking details' : `${card.title}, ${card.label}`}>
            {booking ? (
              <span className="pilot-booking-bar__day" aria-hidden="true">
                <small>{new Date(booking.start).toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' })}</small>
                <b>{new Date(booking.start).getUTCDate()}</b>
              </span>
            ) : null}
            <span className="pilot-booking-bar__text">
              <span className={`pilot-status pilot-status--${tone}`}>{card.label}</span>
              <span className="pilot-booking-bar__when">{booking ? [booking.kind === 'goods' ? undefined : clock12(booking.start), ...card.facts.filter((f) => !['When', 'Vendor', 'Cancellation', 'Collect at'].includes(f.label) && !(['lapsed', 'cancelled'].includes(card.state) && ['Return', 'Held until'].includes(f.label))).map((f) => factPhrase(f.label, f.value))].filter(Boolean).join(' · ') : ''}</span>
            </span>
            <span className="pilot-booking-bar__chevron" aria-hidden="true"><CaretDown weight="bold" /></span>
          </button>
          {card.actions.includes('pay') && !open ? (
            <button type="button" className="guest-button guest-button--primary pilot-booking-bar__pay" onClick={() => handlers.onPay(bookingId)}>
              Pay {card.cost.amount ? `₱${card.cost.amount.toLocaleString('en-US')}` : 'now'}
            </button>
          ) : null}
          {open ? <EngineBookingCard host={host} bookingId={bookingId} inThread inBar {...handlers} onOpenDesk={onOpenDesk} /> : null}
        </div>
      ) : null}

      <div ref={listRef} className="guest-messages" role="log" aria-label="Conversation">
        {messages.map((message, index) => {
          const previous = messages[index - 1];
          const next = messages[index + 1];
          // Messages from one person in a row, on one day, read as one turn, timed once at the bottom.
          // An automatic message stands alone: it is not the vendor talking, so it never joins their turn.
          const sameTurn = (a?: Message, b?: Message) => Boolean(a && b && a.kind === 'text' && b.kind === 'text' && !a.auto && !b.auto && a.from.role === b.from.role && dayOf(a.at) === dayOf(b.at));
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
        <ChatComposer draft={draft} onDraftChange={setDraft} onSubmit={({ body }) => send(body)} placeholder={view.readOnly ? 'Ask the front desk' : name.length <= 16 ? `Message ${name}` : 'Message'} />
      </div>
    </div>
  );
}

/** A status line as the guest reads it: the line that opens a chat says "You asked", not their own name. */
const asGuestReads = (text: string) => text.replace(/^(?!The front desk)\S+ (asked for|booked|questioned|disputed) /, 'You $1 ');

const threadBookingId = (host: Host, threadId: string): string | undefined => host.pilot.bookings().find((b) => b.threadId === threadId)?.id;

function ThreadMessage({ host, message, first, last, receipt, ...handlers }: { host: Host; message: Message; first: boolean; last: boolean; receipt?: string } & CardHandlers) {
  // What happens to the booking is not anyone's message: a quiet line in the middle, as a messaging app marks an event.
  // The guest is reading: the line that opens the chat says "You asked", not their own name.
  if (message.kind === 'system') return <p className="pilot-event">{asGuestReads(message.text)}</p>;
  if (message.kind === 'card' && message.bookingId) {
    return <EngineBookingCard host={host} bookingId={message.bookingId} paymentId={message.paymentId} inThread {...handlers} />;
  }
  const mine = message.from.role === 'guest';
  return (
    <div className={`guest-message guest-message--${mine ? 'guest' : 'desk'} pilot-msg${first ? '' : ' guest-message--continued'}${last ? '' : ' pilot-msg--grouped'}`}>
      <p>{message.text}</p>
      {/* Sent for the vendor, not typed by them: it says so, as a business chat does. */}
      {last ? <small>{message.auto ? <span className="pilot-msg__auto">Auto-reply · </span> : null}{clock12(message.at)}{receipt ? ` · ${receipt}` : ''}</small> : null}
    </div>
  );
}
