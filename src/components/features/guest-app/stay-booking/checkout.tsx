'use client';

import Image from 'next/image';
import { ArrowRight, Check, CheckCircle, CreditCard, LockSimple, Tag as TagIcon, WifiSlash, X } from '@phosphor-icons/react';
import { useEffect, useRef, useState } from 'react';
import { GATEWAY_METHOD_LABELS, type GatewayMethod } from '../gateway-checkout';
import type { CartLine, RoomAllocation, StayGuestDetails, StayHotel, StaySearch } from './model';
import { FREE_CANCELLATION_DAYS, PROMO_CODES, RATE_PLAN_LABELS, SERVICE_RATE, VAT_RATE, cartRooms, describeRooms, partyLabel, peso, quoteStay } from './model';
import { longDate, nightsLabel, shortDate, stayDatesLabel } from './format';

export const BED_PREFERENCES = ['No preference', 'One large bed', 'Two separate beds'] as const;
export const ARRIVAL_TIMES = ['I don’t know yet', '12:00–3:00 PM', '3:00–6:00 PM', '6:00–9:00 PM', 'After 9:00 PM'] as const;

export function emptyGuestDetails(name: string, email: string, phone: string, rooms: number): StayGuestDetails {
  return {
    name,
    email,
    phone,
    roomLeads: Array.from({ length: rooms }, (_, i) => (i === 0 ? name : '')),
    bedPreferences: Array.from({ length: rooms }, () => BED_PREFERENCES[0]),
    arrivalTime: ARRIVAL_TIMES[0],
    requests: '',
    promoCode: '',
  };
}

const validEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
const validPhone = (phone: string) => phone.replace(/[^\d]/g, '').length >= 10;

export function detailsErrors(details: StayGuestDetails) {
  return {
    name: details.name.trim() ? undefined : 'Enter the name on the booking',
    email: validEmail(details.email) ? undefined : 'Enter an email we can send the confirmation to',
    phone: validPhone(details.phone) ? undefined : 'Enter a mobile number the hotel can reach',
  };
}

function TextField({ label, value, onChange, error, type = 'text', autoComplete, placeholder, show }: { label: string; value: string; onChange: (value: string) => void; error?: string; type?: string; autoComplete?: string; placeholder?: string; show: boolean }) {
  const invalid = show && Boolean(error);
  return (
    <label className={`sb-field${invalid ? ' is-invalid' : ''}`}>
      <span>{label}</span>
      <input type={type} value={value} autoComplete={autoComplete} placeholder={placeholder} aria-invalid={invalid || undefined} onChange={(event) => onChange(event.currentTarget.value)} />
      {invalid ? <small className="sb-field-error">{error}</small> : null}
    </label>
  );
}

/** Step one of checkout: who is coming, and anything the hotel should know. */
export function StayCheckoutScreen({ hotel, search, cart, allocation, details, onDetailsChange, onContinue }: {
  hotel: StayHotel;
  search: StaySearch;
  cart: CartLine[];
  allocation: RoomAllocation[];
  details: StayGuestDetails;
  onDetailsChange: (details: StayGuestDetails) => void;
  onContinue: () => void;
}) {
  const [tried, setTried] = useState(false);
  const rooms = cartRooms(hotel, cart);
  const quote = quoteStay(hotel, search, cart, details.promoCode);
  const errors = detailsErrors(details);
  const valid = !errors.name && !errors.email && !errors.phone;
  const set = (patch: Partial<StayGuestDetails>) => onDetailsChange({ ...details, ...patch });
  const setAt = (key: 'roomLeads' | 'bedPreferences', index: number, value: string) => set({ [key]: details[key].map((item, i) => (i === index ? value : item)) });

  const next = () => {
    setTried(true);
    if (valid) {
      onContinue();
      return;
    }
    // Take the guest to what needs fixing; the errors render on this tap, so look after paint.
    window.requestAnimationFrame(() => {
      const field = document.querySelector<HTMLInputElement>('.sb-checkout [aria-invalid="true"]');
      field?.scrollIntoView({ block: 'center', behavior: 'smooth' });
      field?.focus({ preventScroll: true });
    });
  };

  return (
    <div className="guest-stack sb-checkout">
      <div className="guest-page-title">
        <p className="guest-eyebrow">{hotel.name}</p>
        <h1>Guest details</h1>
        <p>{stayDatesLabel(search.checkIn, search.checkOut)} · {partyLabel(search)}</p>
      </div>

      <section className="sb-section" aria-labelledby="sb-contact-details">
        <h2 id="sb-contact-details">Your details</h2>
        <p className="sb-small">From your Cabana profile. Change anything that’s different for this trip.</p>
        <div className="sb-form">
          <TextField label="Full name" value={details.name} autoComplete="name" onChange={(name) => set({ name, roomLeads: details.roomLeads.map((lead, i) => (i === 0 && (lead === details.name || !lead) ? name : lead)) })} error={errors.name} show={tried} />
          <TextField label="Email" type="email" value={details.email} autoComplete="email" onChange={(email) => set({ email })} error={errors.email} show={tried} />
          <TextField label="Mobile number" type="tel" value={details.phone} autoComplete="tel" placeholder="+63 9XX XXX XXXX" onChange={(phone) => set({ phone })} error={errors.phone} show={tried} />
        </div>
      </section>

      <section className="sb-section" aria-labelledby="sb-room-guests">
        <h2 id="sb-room-guests">Rooms</h2>
        <div className="sb-checkout__rooms">
          {rooms.map((room, index) => (
            <article key={index} className="sb-checkout__room" aria-label={`Room ${index + 1}`}>
              <header>
                <small>Room {index + 1} · {allocation[index]?.adults ?? 0} {allocation[index]?.adults === 1 ? 'adult' : 'adults'}{allocation[index]?.childIndexes.length ? `, ${allocation[index]!.childIndexes.length} ${allocation[index]!.childIndexes.length === 1 ? 'child' : 'children'}` : ''}</small>
                <b>{room.roomType.name}</b>
                <span>{RATE_PLAN_LABELS[room.ratePlanId].title} · {RATE_PLAN_LABELS[room.ratePlanId].detail}</span>
              </header>
              <TextField label="Guest name for this room" value={details.roomLeads[index] ?? ''} onChange={(value) => setAt('roomLeads', index, value)} placeholder={index === 0 ? 'Lead guest' : `Optional · else ${details.name || 'you'}`} show={false} />
              <label className="sb-field">
                <span>Bed preference</span>
                <select value={details.bedPreferences[index] ?? BED_PREFERENCES[0]} onChange={(event) => setAt('bedPreferences', index, event.currentTarget.value)}>
                  {BED_PREFERENCES.map((option) => <option key={option}>{option}</option>)}
                </select>
              </label>
            </article>
          ))}
        </div>
      </section>

      <section className="sb-section" aria-labelledby="sb-requests">
        <h2 id="sb-requests">Arrival and requests</h2>
        <div className="sb-form">
          <label className="sb-field">
            <span>Arrival time</span>
            <select value={details.arrivalTime} onChange={(event) => set({ arrivalTime: event.currentTarget.value })}>
              {ARRIVAL_TIMES.map((option) => <option key={option}>{option}</option>)}
            </select>
          </label>
          <label className="sb-field">
            <span>Special requests</span>
            <textarea className="sb-textarea" rows={3} value={details.requests} placeholder="Connecting rooms, a crib, an anniversary…" onChange={(event) => set({ requests: event.currentTarget.value })} />
            <small>Requests depend on availability. The hotel will confirm in chat.</small>
          </label>
        </div>
      </section>

      <div className="guest-dock-spacer" aria-hidden="true" />
      <div className="guest-dock">
        <div className="guest-dock__summary">
          <strong>{peso(quote.total)}</strong>
          <small className={`sb-dock__fit${tried && !valid ? '' : ' is-muted'}`} role={tried && !valid ? 'alert' : undefined}>
            {tried && !valid ? 'Check your details above' : `${nightsLabel(search.checkIn, search.checkOut)} · incl. taxes`}
          </small>
        </div>
        <button type="button" className="guest-button guest-button--primary" onClick={next} aria-label="Continue to payment">
          Continue<ArrowRight aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

const METHOD_HINTS: Record<GatewayMethod, string> = {
  card: 'Visa, Mastercard, JCB',
  gcash: 'Approve in the GCash app',
  maya: 'Approve in the Maya app',
};

/**
 * Step two, a page of its own: what is being bought, what it costs, and how
 * to pay -- chosen right here rather than in a sheet over the form. A
 * prototype stand-in for the gateway: nothing is charged.
 */
export function StayPaymentScreen({ hotel, search, cart, details, onDetailsChange, onPaid, online }: {
  hotel: StayHotel;
  search: StaySearch;
  cart: CartLine[];
  details: StayGuestDetails;
  onDetailsChange: (details: StayGuestDetails) => void;
  onPaid: (method: GatewayMethod) => void;
  online: boolean;
}) {
  const [method, setMethod] = useState<GatewayMethod | null>(null);
  const [processing, setProcessing] = useState(false);
  const [tried, setTried] = useState(false);
  const [promoDraft, setPromoDraft] = useState(details.promoCode);
  const [promoTried, setPromoTried] = useState(Boolean(details.promoCode));
  const [promoOpen, setPromoOpen] = useState(false);
  const timer = useRef<number | null>(null);
  useEffect(() => () => { if (timer.current) window.clearTimeout(timer.current); }, []);
  const rooms = cartRooms(hotel, cart);
  const quote = quoteStay(hotel, search, cart, details.promoCode);
  const set = (patch: Partial<StayGuestDetails>) => onDetailsChange({ ...details, ...patch });

  const pay = () => {
    setTried(true);
    if (!method || !online || processing) return;
    setProcessing(true);
    timer.current = window.setTimeout(() => onPaid(method), 900);
  };

  return (
    <div className="guest-stack sb-checkout sb-payment">
      <div className="guest-page-title">
        <p className="guest-eyebrow">Secure checkout</p>
        <h1>Payment</h1>
      </div>

      <section className="sb-trip" aria-label="Your booking">
        <span className="sb-trip__photo"><Image src={hotel.image.src} alt="" fill sizes="88px" style={{ objectPosition: hotel.image.focalPoint }} /></span>
        <span className="sb-trip__text">
          <b>{hotel.name}</b>
          <small>{stayDatesLabel(search.checkIn, search.checkOut)}</small>
          <small>{describeRooms(rooms.map((item) => ({ roomName: item.roomType.name })))}</small>
          <small>{partyLabel(search)}</small>
        </span>
      </section>

      <fieldset className="sb-methods" disabled={processing}>
        <legend>Pay with</legend>
        {(Object.keys(GATEWAY_METHOD_LABELS) as GatewayMethod[]).map((option) => (
          <button key={option} type="button" aria-pressed={method === option} className={`sb-method${method === option ? ' is-active' : ''}`} onClick={() => setMethod(option)}>
            <span className="sb-method__glyph" data-method={option} aria-hidden="true">{option === 'card' ? <CreditCard /> : option === 'gcash' ? 'G' : 'M'}</span>
            <span className="sb-method__text"><b>{GATEWAY_METHOD_LABELS[option]}</b><small>{METHOD_HINTS[option]}</small></span>
            <span className="sb-method__radio" aria-hidden="true">{method === option ? <Check weight="bold" /> : null}</span>
          </button>
        ))}
        {tried && !method ? <p className="sb-error" role="alert">Choose how you’d like to pay.</p> : null}
      </fieldset>

      <section className="sb-section sb-promo-section" aria-label="Promo code">
        {quote.promo ? (
          <p className="sb-promo-applied"><TagIcon aria-hidden="true" /><span><b>{quote.promo.code}</b><small>{quote.promo.label} · −{peso(quote.discount)}</small></span>
            <button type="button" aria-label="Remove promo code" onClick={() => { set({ promoCode: '' }); setPromoDraft(''); setPromoTried(false); }}><X /></button>
          </p>
        ) : !promoOpen ? (
          <>
            {/* The codes on offer, said where they are used: nobody should need to know one to get it. */}
            <div className="sb-offers" role="group" aria-label="Offers">
              {Object.entries(PROMO_CODES).map(([code, promo]) => (
                <button key={code} type="button" className="sb-offer" onClick={() => { set({ promoCode: code }); setPromoDraft(code); setPromoTried(true); }}>
                  <TagIcon aria-hidden="true" /><span><b>{promo.label}</b><small>Use {code}</small></span>
                </button>
              ))}
            </div>
            <button type="button" className="sb-promo-toggle" onClick={() => setPromoOpen(true)}>Have another code?</button>
          </>
        ) : (
          <div className="sb-promo">
            <label className={`sb-field${promoTried && quote.promoError ? ' is-invalid' : ''}`}>
              <span className="sr-only">Promo code</span>
              <input value={promoDraft} placeholder="Enter a code" autoCapitalize="characters" onChange={(event) => { setPromoDraft(event.currentTarget.value); setPromoTried(false); }} />
            </label>
            <button type="button" className="guest-button guest-button--secondary" disabled={!promoDraft.trim()} onClick={() => { set({ promoCode: promoDraft }); setPromoTried(true); }}>Apply</button>
            {promoTried && quote.promoError ? <small className="sb-field-error" role="alert">{quote.promoError}</small> : null}
          </div>
        )}
      </section>


      <section className="sb-section sb-price-card" aria-labelledby="sb-price">
        <h2 id="sb-price">Price</h2>
        <dl>
          {quote.lines.map((line) => (
            <div key={`${line.roomTypeId}-${line.ratePlanId}`}>
              <dt>{line.quantity} × {line.roomName}<small>{RATE_PLAN_LABELS[line.ratePlanId].title} · {nightsLabel(search.checkIn, search.checkOut)}</small></dt>
              <dd>{peso(line.total)}</dd>
            </div>
          ))}
          {quote.discount ? <div className="is-discount"><dt>Promo {quote.promo?.code}</dt><dd>−{peso(quote.discount)}</dd></div> : null}
          <div><dt>Taxes and fees<small>{Math.round(VAT_RATE * 100)}% VAT {peso(quote.vat)} · {Math.round(SERVICE_RATE * 100)}% service charge {peso(quote.service)}</small></dt><dd>{peso(quote.vat + quote.service)}</dd></div>
          <div className="is-total"><dt>Total</dt><dd>{peso(quote.total)}</dd></div>
        </dl>
        <p className={`sb-policy${quote.refundable ? ' is-positive' : ''}`}>
          {quote.refundable
            ? <><CheckCircle weight="fill" aria-hidden="true" />Free cancellation until {longDate(quote.freeCancellationUntil!)}, 11:59 PM. Cancel in the app for a full refund.</>
            : <>Non-refundable: one or more rooms are on a Saver rate. For a refund, every room must be on a free cancellation rate, cancelled at least {FREE_CANCELLATION_DAYS} days before check-in.</>}
        </p>
      </section>


      {!online ? <p className="sb-note sb-note--warning"><WifiSlash aria-hidden="true" />You’re offline. Reconnect to pay.</p> : null}
      <p className="sb-small sb-center sb-secure"><LockSimple aria-hidden="true" />Paid directly to {hotel.name} through our payment partner. Not added to a room bill.</p>

      <div className="guest-dock-spacer" aria-hidden="true" />
      <div className="guest-dock">
        <div className="guest-dock__summary">
          <strong>{peso(quote.total)}</strong>
          <small className={`sb-dock__fit${quote.refundable ? ' is-positive' : ' is-muted'}`}>
            {quote.refundable ? `Free cancellation to ${shortDate(quote.freeCancellationUntil!)}` : 'Non-refundable'}
          </small>
        </div>
        <button type="button" className="guest-button guest-button--primary" disabled={!online || processing} onClick={pay} aria-label={processing ? 'Processing payment' : `Pay ${peso(quote.total)}`}>
          {processing ? 'Processing…' : <><LockSimple aria-hidden="true" />Pay</>}
        </button>
      </div>
    </div>
  );
}

