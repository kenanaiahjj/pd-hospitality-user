'use client';

/*
  The pilot, from the guest's side. Always the guest: the vendor and the front
  desk are driven from the prototype controls ("Pilot" tab), and what they do
  arrives here as chat messages, cards and notifications.
*/
import { ArrowLeft, ChatCircleDots, Compass, X } from '@phosphor-icons/react';
import { QRCodeSVG } from 'qrcode.react';
import { useState, type ReactNode } from 'react';
import { ChatComposer } from '../../chat-composer';
import { NotesField, Notice } from '../../guest-ui';
import { SCENE } from '../catalog';
import type { Card, CardAction, Draft, Kind, Listing, Message, PayMode, Pilot, Result, ThreadSummary } from '../types';
import { act, usePilot } from './use-pilot';
import './pilot.css';

const WD = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const clock12 = (ms: number) => {
  const d = new Date(ms);
  const h = d.getUTCHours();
  return `${((h + 11) % 12) + 1}:${String(d.getUTCMinutes()).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
};
const stamp = (ms: number) => {
  const d = new Date(ms);
  return `${WD[d.getUTCDay()]} ${d.getUTCDate()} ${MON[d.getUTCMonth()]}, ${clock12(ms)}`;
};
const dayLabel = (iso: string) => {
  const d = new Date(`${iso}T00:00:00Z`);
  return `${WD[d.getUTCDay()]} ${d.getUTCDate()} ${MON[d.getUTCMonth()]}`;
};
const isoOf = (ms: number) => new Date(ms).toISOString().slice(0, 10);
const peso = (n: number) => `₱${n.toLocaleString('en-US')}`;
const time12 = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number);
  return `${((h! + 11) % 12) + 1}:${String(m).padStart(2, '0')} ${h! >= 12 ? 'PM' : 'AM'}`;
};

type Route = { name: 'explore' } | { name: 'messages' } | { name: 'thread'; id: string } | { name: 'request'; listingId: string };

const KIND_ORDER: { kind: Kind; title: string; blurb: string }[] = [
  { kind: 'table', title: 'Restaurants', blurb: 'Reserve a table. The bill is settled at the restaurant.' },
  { kind: 'service', title: 'Services and tours', blurb: 'The provider confirms, or it books at once.' },
  { kind: 'rental', title: 'Rentals', blurb: 'The shop confirms availability first.' },
  { kind: 'goods', title: 'Goods', blurb: 'Pasalubong, held chilled at the front desk.' },
];

export function PilotApp({ onExit }: { onExit: () => void }) {
  const { pilot: p } = usePilot();
  const [route, setRoute] = useState<Route>({ name: 'explore' });
  const [sheet, setSheet] = useState<ReactNode>(null);
  const [notice, setNotice] = useState<{ tone: 'warning' | 'positive' | 'neutral'; text: string } | null>(null);
  const guestId = p.maria.guestId;
  const threads = p.threads('guest', guestId);
  const unread = threads.reduce((n, t) => n + t.unread, 0);
  const tab = route.name === 'messages' || route.name === 'thread' ? 'messages' : 'explore';

  const say = (result: Result<object>, good?: string) => {
    if (!result.ok) setNotice({ tone: 'warning', text: result.message });
    else if (good) setNotice({ tone: 'positive', text: good });
    else setNotice(null);
  };
  const go = (next: Route) => {
    setNotice(null);
    setRoute(next);
  };
  const stay = p.stay(p.maria.stayId);

  const openCardAction = (card: Card, action: CardAction) => {
    const id = card.bookingId;
    const b = p.booking(id);
    switch (action) {
      case 'cancel':
      case 'withdraw': {
        const r = act((q) => q.guest(guestId).cancel(id));
        say(r, r.ok && r.outcome === 'requested' ? 'You asked to cancel. The vendor has to accept, because it is inside the free-cancel window.' : undefined);
        break;
      }
      case 'pay':
        setSheet(<PaySheet bookingId={id} onClose={() => setSheet(null)} />);
        break;
      case 'pay-in-full': {
        const r = act((q) => q.guest(guestId).choosePayInFull(id));
        say(r);
        if (r.ok && p.booking(id).status === 'awaiting-payment') setSheet(<PaySheet bookingId={id} onClose={() => setSheet(null)} />);
        else if (r.ok && p.booking(id).status === 'confirmed') setSheet(<PaySheet bookingId={id} onClose={() => setSheet(null)} />);
        break;
      }
      case 'show-qr':
        setSheet(
          <Sheet title="Show this at the vendor" onClose={() => setSheet(null)}>
            <div className="pilot-qr"><QRCodeSVG value={`cabana-booking:${id}`} size={176} /></div>
            <p className="pilot-muted">{p.listing(b.listingId).title} · {stamp(b.start)}. If your phone is dead, the vendor can find this by your name and room.</p>
          </Sheet>,
        );
        break;
      case 'running-late':
        say(act((q) => q.guest(guestId).runningLate(id)), 'The restaurant knows you are running late.');
        break;
      case 'message-desk':
        go({ name: 'thread', id: p.deskThreadId(p.maria.stayId) });
        break;
      case 'pick-another':
        go({ name: 'explore' });
        break;
      case 'question':
      case 'open-menu':
      case 'view-booking':
        break;
    }
  };

  const body = (() => {
    switch (route.name) {
      case 'explore':
        return <Explore p={p} onPick={(listingId) => go({ name: 'request', listingId })} />;
      case 'messages':
        return <Messages threads={threads} onOpen={(id) => go({ name: 'thread', id })} />;
      case 'request':
        return (
          <RequestForm
            p={p}
            listing={p.listing(route.listingId)}
            onDone={(bookingId) => go({ name: 'thread', id: p.booking(bookingId).threadId })}
          />
        );
      case 'thread':
        return (
          <ThreadScreen
            p={p}
            threadId={route.id}
            onCardAction={openCardAction}
            onAskAboutCharge={(paymentId) => setSheet(<QuestionSheet paymentId={paymentId} onClose={() => setSheet(null)} onSent={(r) => say(r, 'The front desk will settle it before checkout.')} />)}
            onPayExtra={(paymentId) => setSheet(<PaySheet paymentId={paymentId} onClose={() => setSheet(null)} />)}
            onNotice={setNotice}
          />
        );
    }
  })();

  const title =
    route.name === 'request' ? p.listing(route.listingId).title
    : route.name === 'thread' ? (threads.find((t) => t.id === route.id)?.title ?? 'Messages')
    : route.name === 'messages' ? 'Messages'
    : 'Explore';
  const back = route.name === 'request' ? () => go({ name: 'explore' }) : route.name === 'thread' ? () => go({ name: 'messages' }) : undefined;

  return (
    <div className="pilot-app" role="region" aria-label="Cabana pilot">
      <header className="pilot-top">
        {back ? <button className="pilot-icon" type="button" onClick={back} aria-label="Back"><ArrowLeft aria-hidden="true" /></button> : <span className="pilot-brand">Pilot</span>}
        <h1>{title}</h1>
        <button className="pilot-icon" type="button" onClick={onExit} aria-label="Leave the pilot"><X aria-hidden="true" /></button>
      </header>
      <div className="pilot-context">
        Maria · {stay.room || 'Room to be assigned'} · The Henry Resort Dumaguete · <b>{stamp(p.now())}</b>
      </div>
      {notice ? (
        <div className="pilot-notice">
          <Notice tone={notice.tone} title={notice.tone === 'warning' ? 'That did not go through' : 'Done'}>{notice.text}</Notice>
        </div>
      ) : null}
      <div key={route.name === 'thread' ? `thread-${route.id}` : route.name === 'request' ? `request-${route.listingId}` : route.name} className={`pilot-body${route.name === 'thread' ? ' pilot-body--thread' : ''}`}>{body}</div>
      {route.name !== 'thread' && route.name !== 'request' ? (
        <nav className="pilot-tabs" aria-label="Pilot navigation">
          <button type="button" aria-current={tab === 'explore' ? 'page' : undefined} onClick={() => go({ name: 'explore' })}>
            <Compass aria-hidden="true" />Explore
          </button>
          <button type="button" aria-current={tab === 'messages' ? 'page' : undefined} onClick={() => go({ name: 'messages' })}>
            <ChatCircleDots aria-hidden="true" />Messages{unread ? <i className="pilot-badge" aria-label={`${unread} unread`}>{unread}</i> : null}
          </button>
        </nav>
      ) : null}
      {sheet}
    </div>
  );
}

// ------------------------------------------------------------------ explore

function Explore({ p, onPick }: { p: Pilot; onPick: (listingId: string) => void }) {
  return (
    <div className="pilot-explore">
      <p className="pilot-lead">Everything here books through the same chat with the front desk and the provider.</p>
      {KIND_ORDER.map(({ kind, title, blurb }) => {
        const rows = p.listings().filter((l) => l.kind === kind);
        return (
          <section key={kind} aria-label={title}>
            <h2>{title}</h2>
            <p className="pilot-muted">{blurb}</p>
            <ul className="pilot-list">
              {rows.map((l) => (
                <li key={l.id}>
                  <button type="button" className="pilot-row" onClick={() => onPick(l.id)}>
                    <span>
                      <b>{l.title}</b>
                      <small>{priceLine(l)}</small>
                    </span>
                    <span className="pilot-chip">{l.confirm === 'vendor' ? 'Provider confirms' : l.kind === 'table' ? 'Confirmed at once' : 'Books at once'}</span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

function priceLine(l: Listing): string {
  if (l.kind === 'table') return `From ${time12(l.times[0]!)} · up to ${l.maxParty} guests`;
  const unit = l.kind === 'rental' ? 'per bike per day' : l.kind === 'goods' ? 'per box' : 'per guest';
  return `${peso(l.unitPrice)} ${unit}`;
}

// ------------------------------------------------------------------ messages

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

function Messages({ threads, onOpen }: { threads: ThreadSummary[]; onOpen: (id: string) => void }) {
  const bookings = threads.filter((t) => t.kind === 'booking');
  return (
    <div className="pilot-messages">
      <ul className="pilot-list">
        {threads.filter((t) => t.kind === 'desk').map((t) => (
          <li key={t.id}>
            <ThreadRow t={t} pinned onOpen={onOpen} />
          </li>
        ))}
      </ul>
      <h2>Bookings</h2>
      {bookings.length === 0 ? <p className="pilot-muted">A thread appears here as soon as you ask for something, with the front desk and the provider in it.</p> : null}
      <ul className="pilot-list">
        {bookings.map((t) => (
          <li key={t.id}>
            <ThreadRow t={t} onOpen={onOpen} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function ThreadRow({ t, pinned, onOpen }: { t: ThreadSummary; pinned?: boolean; onOpen: (id: string) => void }) {
  const preview = t.last ? (t.last.kind === 'card' ? 'Booking card' : t.last.text) : 'Ask the front desk anything about your stay.';
  return (
    <button type="button" className="pilot-row pilot-row--thread" onClick={() => onOpen(t.id)}>
      <span>
        <b>{t.title}{pinned ? <small className="pilot-pin"> Pinned</small> : null}</b>
        <small className="pilot-preview">{t.last && t.last.from.role !== 'guest' ? `${t.last.from.name}: ` : ''}{preview}</small>
      </span>
      <span className="pilot-row__end">
        {t.cardLabel ? <span className={`pilot-state pilot-state--${STATE_TONE[t.cardState ?? ''] ?? 'wait'}`}>{t.cardLabel}</span> : null}
        {t.unread ? <i className="pilot-badge" aria-label={`${t.unread} unread`}>{t.unread}</i> : null}
      </span>
    </button>
  );
}

// ------------------------------------------------------------------ one thread

const ROLE_WORD = { guest: 'You', desk: 'Front desk', vendor: 'Provider', system: 'Cabana' } as const;

function ThreadScreen({ p, threadId, onCardAction, onAskAboutCharge, onPayExtra, onNotice }: {
  p: Pilot;
  threadId: string;
  onCardAction: (card: Card, action: CardAction) => void;
  onAskAboutCharge: (paymentId: string) => void;
  onPayExtra: (paymentId: string) => void;
  onNotice: (n: { tone: 'warning' | 'positive' | 'neutral'; text: string } | null) => void;
}) {
  const [draft, setDraft] = useState('');
  const view = p.thread(threadId, 'guest');
  if (!view.ok) return <p className="pilot-muted">{view.message}</p>;
  const isDesk = threadId === p.deskThreadId(p.maria.stayId);
  const send = (text: string) => {
    if (!text.trim()) return;
    const r = act((q) => (isDesk ? q.guest().sendToDesk(text) : q.guest().send(threadId, text)));
    if (!r.ok) onNotice({ tone: 'warning', text: r.message });
    else if ('redirectedTo' in r && r.redirectedTo) onNotice({ tone: 'neutral', text: 'This thread is closed, so your message went to the front desk.' });
    else onNotice(null);
    setDraft('');
  };
  return (
    <div className="pilot-thread">
      <div className="guest-messages pilot-messages-list" aria-label="Conversation" aria-live="polite">
        {view.messages.length === 0 ? <p className="pilot-muted pilot-center">No messages yet. The front desk answers here.</p> : null}
        {view.messages.map((m) => (
          <MessageView key={m.id} p={p} m={m} onCardAction={onCardAction} onAskAboutCharge={onAskAboutCharge} onPayExtra={onPayExtra} />
        ))}
      </div>
      {view.readOnly ? (
        <p className="pilot-readonly">This thread closed 48 hours after the booking. Anything you send goes to the front desk.</p>
      ) : null}
      <div className="guest-chat__dock pilot-dock">
        <ChatComposer draft={draft} onDraftChange={setDraft} onSubmit={({ body }) => send(body)} placeholder={isDesk ? 'Message the front desk' : 'Message everyone in this booking'} />
      </div>
    </div>
  );
}

function MessageView({ p, m, onCardAction, onAskAboutCharge, onPayExtra }: {
  p: Pilot;
  m: Message;
  onCardAction: (card: Card, action: CardAction) => void;
  onAskAboutCharge: (paymentId: string) => void;
  onPayExtra: (paymentId: string) => void;
}) {
  if (m.kind === 'system') return <p className="pilot-system">{m.text}</p>;
  if (m.kind === 'card' && m.bookingId) {
    if (m.paymentId) {
      const card = p.extraCard(m.paymentId);
      return (
        <BookingCard
          card={card}
          p={p}
          onAction={(a) => (a === 'question' ? onAskAboutCharge(m.paymentId!) : a === 'pay' ? onPayExtra(m.paymentId!) : onCardAction(card, a))}
        />
      );
    }
    return <BookingCard card={p.card(m.bookingId)} p={p} onAction={(a) => onCardAction(p.card(m.bookingId!), a)} />;
  }
  const mine = m.from.role === 'guest';
  return (
    <div className={`guest-message guest-message--${mine ? 'guest' : 'desk'} pilot-msg pilot-msg--${m.from.role}`}>
      <span className="pilot-sender">{m.from.name}{m.from.role === 'vendor' || m.from.role === 'desk' ? <i>{ROLE_WORD[m.from.role]}</i> : null}</span>
      <p>{m.text}</p>
      <small>{clock12(m.at)}</small>
    </div>
  );
}

// ------------------------------------------------------------------ the card

function BookingCard({ card, p, onAction }: { card: Card; p: Pilot; onAction: (a: CardAction) => void }) {
  const listing = p.listings().find((l) => l.title === card.title && p.booking(card.bookingId).listingId === l.id);
  return (
    <article className={`pilot-card pilot-card--${card.state}`} aria-label={`${card.title}, ${card.label}`}>
      <header>
        <small>{card.kindLabel}</small>
        <span className={`pilot-state pilot-state--${STATE_TONE[card.state] ?? 'wait'}`}>{card.label}</span>
      </header>
      <h3>{card.title}</h3>
      <dl>
        {card.facts.map((f) => (
          <div key={f.label}>
            <dt>{f.label}</dt>
            <dd>{f.value}</dd>
          </div>
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
          {card.actions.map((a) =>
            a === 'open-menu' && listing?.menuPdf ? (
              <a key={a} className="guest-button guest-button--secondary" href={listing.menuPdf} target="_blank" rel="noreferrer">Open menu</a>
            ) : (
              <button key={a} type="button" className={`guest-button ${PRIMARY.includes(a) ? 'guest-button--primary' : 'guest-button--secondary'}`} onClick={() => onAction(a)}>
                {ACTION_LABEL[a]}
              </button>
            ),
          )}
        </div>
      ) : null}
    </article>
  );
}
const PRIMARY: CardAction[] = ['pay', 'pay-in-full', 'show-qr'];
const ACTION_LABEL: Record<CardAction, string> = {
  cancel: 'Cancel',
  withdraw: 'Withdraw request',
  pay: 'Pay in full',
  'pay-in-full': 'Pay in full instead',
  'show-qr': 'Show QR',
  'open-menu': 'Open menu',
  'view-booking': 'View booking',
  'pick-another': 'Pick another',
  'message-desk': 'Message the desk',
  question: 'Question this charge',
  'running-late': 'Running late',
};

// ------------------------------------------------------------------ request

function RequestForm({ p, listing, onDone }: { p: Pilot; listing: Listing; onDone: (bookingId: string) => void }) {
  const today = isoOf(p.now());
  const days = Array.from({ length: 8 }, (_, i) => isoOf(Date.parse(`${today}T00:00:00Z`) + i * 86_400_000));
  const checkOut = p.stay(p.maria.stayId).checkOut;
  const [date, setDate] = useState(listing.kind === 'goods' ? checkOut : days[1] ?? SCENE.thu);
  const [time, setTime] = useState(listing.times[0]);
  const [qty, setQty] = useState(listing.kind === 'table' ? 2 : listing.kind === 'goods' ? 2 : listing.kind === 'service' ? 2 : 1);
  const [nights, setNights] = useState(1);
  const [mode, setMode] = useState<PayMode | null>(null);
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);

  const base: Draft = { listingId: listing.id, date, time: listing.kind === 'goods' ? undefined : time, qty, days: listing.kind === 'rental' ? nights : undefined, note: note.trim() || undefined, origin: 'app' };
  const quote = p.guest().quote(base);
  const options = quote.ok ? quote.options : null;
  const chosen: PayMode | undefined = listing.kind === 'table' ? undefined : (mode ?? options?.defaultMode);
  const unit = listing.kind === 'rental' ? (qty === 1 ? 'bike' : 'bikes') : listing.kind === 'goods' ? (qty === 1 ? 'box' : 'boxes') : listing.kind === 'table' ? 'guests' : qty === 1 ? 'guest' : 'guests';

  const submit = () => {
    setError(null);
    const r = act((q) => q.guest().request({ ...base, payMode: chosen }));
    if (!r.ok) setError(r.message);
    else onDone(r.bookingId);
  };
  const cta =
    listing.kind === 'table' ? 'Reserve table'
    : listing.confirm === 'vendor' ? 'Send request'
    : chosen === 'room' ? (options?.room.needsApproval ? 'Ask the front desk to approve' : 'Book and charge to my room')
    : 'Continue to payment';

  return (
    <form className="pilot-form" onSubmit={(e) => { e.preventDefault(); submit(); }}>
      <label className="guest-field">
        <span>{listing.kind === 'goods' ? 'Ready for' : 'Date'}</span>
        <select value={date} onChange={(e) => setDate(e.currentTarget.value)}>
          {days.map((d) => <option key={d} value={d}>{dayLabel(d)}{d === checkOut ? ' · checkout day' : ''}</option>)}
        </select>
      </label>
      {listing.kind !== 'goods' ? (
        <label className="guest-field">
          <span>{listing.kind === 'rental' ? 'Pickup' : 'Time'}</span>
          <select value={time} onChange={(e) => setTime(e.currentTarget.value)}>
            {listing.times.map((t) => <option key={t} value={t}>{time12(t)}</option>)}
          </select>
        </label>
      ) : null}
      <Stepper label={listing.kind === 'table' ? 'Party size' : listing.kind === 'goods' ? 'Boxes' : listing.kind === 'rental' ? 'Bikes' : 'Guests'} value={qty} min={1} max={listing.kind === 'goods' ? 60 : 12} onChange={setQty} />
      {listing.kind === 'rental' ? <Stepper label="Days" value={nights} min={1} max={5} onChange={setNights} /> : null}

      {listing.kind !== 'table' && options ? (
        <fieldset className="pilot-pay">
          <legend>Pay</legend>
          {options.room.offered ? (
            <label className={chosen === 'room' ? 'is-on' : ''}>
              <input type="radio" name="pay" checked={chosen === 'room'} onChange={() => setMode('room')} />
              <span><b>Charge to my room</b><small>{options.room.needsApproval ? options.room.why : 'Added to your stay bill.'}</small></span>
            </label>
          ) : (
            <p className="pilot-muted">{options.room.why}</p>
          )}
          <label className={chosen === 'card' ? 'is-on' : ''}>
            <input type="radio" name="pay" checked={chosen === 'card'} onChange={() => setMode('card')} />
            <span><b>Pay in full now</b><small>Card or e-wallet. All at once, never split with your room.</small></span>
          </label>
        </fieldset>
      ) : null}

      <NotesField value={note} onChange={setNote} />

      <div className="pilot-total">
        <span>{qty} {unit}{listing.kind === 'rental' ? ` · ${nights} ${nights === 1 ? 'day' : 'days'}` : ''}</span>
        <b>{listing.kind === 'table' ? 'No charge now' : options ? peso(options.price) : '—'}</b>
      </div>
      {listing.confirm === 'vendor' ? <p className="pilot-muted">You are charged only after {p.vendors().find((v) => v.id === listing.vendorId)?.name} confirms.</p> : null}
      {listing.kind === 'table' ? <p className="pilot-muted">The table is held for 15 minutes past your time.</p> : null}
      {!quote.ok ? <Notice tone="warning" title="Not available">{quote.message}</Notice> : null}
      {error ? <Notice tone="warning" title="That did not go through">{error}</Notice> : null}
      <button className="guest-button guest-button--primary" type="submit" disabled={!quote.ok}>{cta}</button>
    </form>
  );
}

function Stepper({ label, value, min, max, onChange }: { label: string; value: number; min: number; max: number; onChange: (n: number) => void }) {
  return (
    <div className="pilot-stepper" role="group" aria-label={label}>
      <span>{label}</span>
      <button type="button" onClick={() => onChange(Math.max(min, value - 1))} aria-label={`Fewer, ${label}`} disabled={value <= min}>−</button>
      <output aria-live="polite">{value}</output>
      <button type="button" onClick={() => onChange(Math.min(max, value + 1))} aria-label={`More, ${label}`} disabled={value >= max}>+</button>
    </div>
  );
}

// ------------------------------------------------------------------ sheets

function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="pilot-sheet-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="pilot-sheet" role="dialog" aria-modal="true" aria-label={title}>
        <header><h2>{title}</h2><button type="button" className="pilot-icon" onClick={onClose} aria-label="Close"><X aria-hidden="true" /></button></header>
        {children}
      </div>
    </div>
  );
}

/** The gateway, as a guest meets it: pay, fail, or walk away; three tries. */
function PaySheet({ bookingId, paymentId, onClose }: { bookingId?: string; paymentId?: string; onClose: () => void }) {
  const { pilot: p } = usePilot();
  const [message, setMessage] = useState<string | null>(null);
  const payment = paymentId ? p.payment(paymentId) : p.payments(bookingId).filter((x) => x.mode === 'card' && x.purpose === 'booking' && !x.duplicate).at(-1);
  const amount = payment?.amount ?? 0;
  const pay = () => {
    const r = act((q) => (paymentId ? q.guest().payExtra(paymentId) : q.guest().payCard(bookingId!)));
    if (!r.ok) {
      setMessage(r.message);
      return;
    }
    if (r.outcome === 'paid') onClose();
    else if (r.outcome === 'failed') setMessage(r.triesLeft ? `The payment failed. ${r.triesLeft} ${r.triesLeft === 1 ? 'try' : 'tries'} left.` : 'The payment failed three times, so the slot was released.');
    else setMessage('You left the checkout before it finished. Nothing was charged yet; you can try again.');
  };
  return (
    <Sheet title="Pay in full" onClose={onClose}>
      <p className="pilot-total"><span>{payment?.reason ?? 'Your booking'}</span><b>{peso(amount)}</b></p>
      <p className="pilot-muted">Paid by card or e-wallet, once. It is never split with your room bill.</p>
      {message ? <Notice tone="warning" title="Payment">{message}</Notice> : null}
      <button type="button" className="guest-button guest-button--primary" onClick={pay} disabled={payment?.state !== 'awaiting'}>Pay {peso(amount)}</button>
    </Sheet>
  );
}

function QuestionSheet({ paymentId, onClose, onSent }: { paymentId: string; onClose: () => void; onSent: (r: Result<object>) => void }) {
  const [text, setText] = useState('');
  return (
    <Sheet title="Question this charge" onClose={onClose}>
      <p className="pilot-muted">The front desk will look at it and settle it before you check out.</p>
      <label className="guest-field"><span>What is wrong?</span><textarea rows={3} value={text} onChange={(e) => setText(e.currentTarget.value)} /></label>
      <button type="button" className="guest-button guest-button--primary" onClick={() => { onSent(act((q) => q.guest().question(paymentId, text))); onClose(); }}>Send to the front desk</button>
    </Sheet>
  );
}
