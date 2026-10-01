'use client';

import Image from 'next/image';
import { ArrowRight, Check, CheckCircle, CreditCard, LockSimple, Tag as TagIcon, WifiSlash, X } from '@phosphor-icons/react';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { GATEWAY_METHOD_LABELS, type GatewayMethod } from '../gateway-checkout';
import { countNightsBetween } from '../prototype-model';
import { readPendingVoucher, savePendingVoucher } from './offers';
import type { CartLine, PromoAccount, RoomAllocation, StayAddOn, StayGuestDetails, StayHotel, StaySearch } from './model';
import { FREE_CANCELLATION_DAYS, NEW_ACCOUNT, cancellationOpen, RATE_PLAN_LABELS, SERVICE_RATE, VAT_RATE, addOnLines, addOnsTotal, cartRooms, describeRooms, offersFor, partyLabel, peso, quoteStay } from './model';
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
    company: details.receipt && !details.receipt.company.trim() ? 'Enter the company name for the receipt' : undefined,
    // A Philippine TIN is 9 digits, often with a 3- or 5-digit branch code.
    tin: details.receipt && details.receipt.tin.replace(/\D/g, '').length < 9 ? 'Enter the company’s TIN, e.g. 123-456-789-000' : undefined,
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
export function StayCheckoutScreen({ hotel, search, cart, allocation, details, onDetailsChange, onContinue, addOns, account = NEW_ACCOUNT }: {
  hotel: StayHotel;
  search: StaySearch;
  cart: CartLine[];
  allocation: RoomAllocation[];
  details: StayGuestDetails;
  onDetailsChange: (details: StayGuestDetails) => void;
  onContinue: () => void;
  addOns?: StayAddOn[];
  account?: PromoAccount;
}) {
  const [tried, setTried] = useState(false);
  const rooms = cartRooms(hotel, cart);
  const quote = quoteStay(hotel, search, cart, details.promoCode, account);
  const extras = addOnsTotal(addOnLines(addOns, hotel));
  const errors = detailsErrors(details);
  const valid = !Object.values(errors).some(Boolean);
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
                <span>{RATE_PLAN_LABELS[room.ratePlanId].title} · {room.ratePlanId === 'saver' || cancellationOpen(search.checkIn) ? RATE_PLAN_LABELS[room.ratePlanId].detail : 'Non-refundable'}</span>
              </header>
              <TextField label="Guest name for this room" value={details.roomLeads[index] ?? ''} onChange={(value) => setAt('roomLeads', index, value)} placeholder={index === 0 ? 'Lead guest' : `Optional · else ${details.name || 'you'}`} show={false} />
              {/* No bed preference: each room class has one bed setup, so choosing the room chose the beds. */}
            </article>
          ))}
        </div>
      </section>

      <section className="sb-section" aria-labelledby="sb-receipt">
        <h2 id="sb-receipt">Receipt</h2>
        <label className="sb-check">
          <input type="checkbox" checked={Boolean(details.receipt)} onChange={(event) => set({ receipt: event.currentTarget.checked ? { company: '', tin: '', address: '' } : undefined })} />
          <span><b>I need an official receipt for a company</b><small>Made out to the company, with its TIN, for business travel.</small></span>
        </label>
        {details.receipt ? (
          <div className="sb-form">
            <TextField label="Company name" value={details.receipt.company} autoComplete="organization" onChange={(company) => set({ receipt: { ...details.receipt!, company } })} error={errors.company} show={tried} />
            <TextField label="TIN" value={details.receipt.tin} placeholder="123-456-789-000" onChange={(tin) => set({ receipt: { ...details.receipt!, tin } })} error={errors.tin} show={tried} />
            <TextField label="Registered address" value={details.receipt.address} autoComplete="street-address" placeholder="Optional" onChange={(address) => set({ receipt: { ...details.receipt!, address } })} show={false} />
          </div>
        ) : null}
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
          <strong>{peso(quote.total + extras)}</strong>
          <small className={`sb-dock__fit${tried && !valid ? '' : ' is-muted'}`} role={tried && !valid ? 'alert' : undefined}>
            {tried && !valid ? 'Check your details above' : `${nightsLabel(search.checkIn, search.checkOut)} · incl. taxes${extras ? ' and extras' : ''}`}
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
export function StayPaymentScreen({ hotel, search, cart, details, onDetailsChange, onPaid, online, addOns, account = NEW_ACCOUNT, accountGate }: {
  hotel: StayHotel;
  search: StaySearch;
  cart: CartLine[];
  details: StayGuestDetails;
  onDetailsChange: (details: StayGuestDetails) => void;
  onPaid: (method: GatewayMethod) => void;
  online: boolean;
  /** Arrival extras chosen on the step before; paid in this same payment, outside the room taxes and voucher. */
  addOns?: StayAddOn[];
  /** Who is paying, so a first-booking code is refused once they have booked. */
  account?: PromoAccount;
  /**
   * Shown instead of paying when the guest has no account: a booking has to
   * belong to someone, for its receipt, refunds and vouchers to have a home.
   */
  accountGate?: ReactNode;
}) {
  const [method, setMethod] = useState<GatewayMethod | null>(null);
  const [processing, setProcessing] = useState(false);
  const [promoDraft, setPromoDraft] = useState(details.promoCode);
  const [promoTried, setPromoTried] = useState(Boolean(details.promoCode));
  const offers = offersFor(hotel, countNightsBetween(search.checkIn, search.checkOut), account);
  /*
    An offer saved on results or the hotel page arrives applied. From a
    timer, as the rest of the app sets state from effects, and only when the
    guest has no code of their own yet.
  */
  useEffect(() => {
    const pending = readPendingVoucher();
    if (details.promoCode || !pending || !offers.some((offer) => offer.code === pending)) return;
    const timer = window.setTimeout(() => {
      onDetailsChange({ ...details, promoCode: pending });
      setPromoDraft(pending);
      setPromoTried(true);
      savePendingVoucher(null);
    }, 0);
    return () => window.clearTimeout(timer);
    // On arrival only: after that the field belongs to the guest.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const timer = useRef<number | null>(null);
  useEffect(() => () => { if (timer.current) window.clearTimeout(timer.current); }, []);
  const rooms = cartRooms(hotel, cart);
  const quote = quoteStay(hotel, search, cart, details.promoCode, account);
  const extraLines = addOnLines(addOns, hotel);
  const total = quote.total + addOnsTotal(extraLines);
  const set = (patch: Partial<StayGuestDetails>) => onDetailsChange({ ...details, ...patch });

  const pay = () => {
    if (accountGate || !method || !online || processing) return;
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

      {/* First, before choosing how to pay: a guest without an account learns it here, not at the end. */}
      {accountGate}

      <fieldset className="sb-methods" disabled={processing}>
        <legend>Pay with</legend>
        {(Object.keys(GATEWAY_METHOD_LABELS) as GatewayMethod[]).map((option) => (
          <button key={option} type="button" aria-pressed={method === option} className={`sb-method${method === option ? ' is-active' : ''}`} onClick={() => setMethod(option)}>
            <span className="sb-method__glyph" data-method={option} aria-hidden="true">{option === 'card' ? <CreditCard /> : option === 'gcash' ? 'G' : 'M'}</span>
            <span className="sb-method__text"><b>{GATEWAY_METHOD_LABELS[option]}</b><small>{METHOD_HINTS[option]}</small></span>
            <span className="sb-method__radio" aria-hidden="true">{method === option ? <Check weight="bold" /> : null}</span>
          </button>
        ))}
      </fieldset>

      <section className="sb-section sb-promo-section" aria-labelledby="sb-voucher-title">
        <h2 id="sb-voucher-title">Voucher</h2>
        {quote.promo ? (
          <p className="sb-promo-applied"><TagIcon aria-hidden="true" /><span><b>{quote.promo.code}</b><small>{quote.promo.label} · −{peso(quote.discount)}</small></span>
            <button type="button" aria-label="Remove voucher" disabled={processing} onClick={() => { set({ promoCode: '' }); setPromoDraft(''); setPromoTried(false); }}><X /></button>
          </p>
        ) : (
          <>
            {/* Always open: a guest holding a code should never hunt for where it goes. */}
            <div className="sb-promo">
              <label className={`sb-field${promoTried && quote.promoError ? ' is-invalid' : ''}`}>
                <span className="sr-only">Voucher code</span>
                <input value={promoDraft} disabled={processing} placeholder="Voucher code" autoCapitalize="characters" autoComplete="off" onChange={(event) => { setPromoDraft(event.currentTarget.value); setPromoTried(false); }} onKeyDown={(event) => { if (event.key === 'Enter' && promoDraft.trim()) { set({ promoCode: promoDraft }); setPromoTried(true); } }} />
              </label>
              <button type="button" className="guest-button guest-button--secondary" disabled={processing || !promoDraft.trim()} onClick={() => { set({ promoCode: promoDraft }); setPromoTried(true); }}>Apply</button>
              {promoTried && quote.promoError ? <small className="sb-field-error" role="alert">{quote.promoError}</small> : null}
            </div>
            {offers.length ? (
              <div className="sb-offers" role="group" aria-label="Offers for this stay">
                {offers.map(({ code, promo }) => (
                  <button key={code} type="button" className="sb-offer" disabled={processing} onClick={() => { set({ promoCode: code }); setPromoDraft(code); setPromoTried(true); }}>
                    <TagIcon aria-hidden="true" /><span><b>{promo.label}</b><small>Use {code}</small></span>
                  </button>
                ))}
              </div>
            ) : null}
          </>
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
          {extraLines.length ? (
            <>
              <div className="sb-price-group"><dt>Arrival extras</dt></div>
              {extraLines.map((line) => (
                <div key={line.id}><dt>{line.title}<small>{line.detail}</small></dt><dd>{line.amount ? peso(line.amount) : 'Free'}</dd></div>
              ))}
            </>
          ) : null}
          <div className="is-total"><dt>Total</dt><dd>{peso(total)}</dd></div>
        </dl>
        <p className={`sb-policy${quote.refundable ? ' is-positive' : ''}`}>
          {quote.refundable
            ? <><CheckCircle weight="fill" aria-hidden="true" />Free cancellation until {longDate(quote.freeCancellationUntil!)}, 11:59 PM. Cancel in the app for a full refund.</>
            : quote.lines.some((line) => line.ratePlanId === 'saver')
              ? <>Non-refundable: one or more rooms are on a Saver rate. For a refund, every room must be on a free cancellation rate, cancelled at least {FREE_CANCELLATION_DAYS} days before check-in.</>
              : <>Non-refundable: check-in is less than {FREE_CANCELLATION_DAYS} days away, after free cancellation ends.</>}
        </p>
      </section>


      {!online ? <p className="sb-note sb-note--warning"><WifiSlash aria-hidden="true" />You’re offline. Reconnect to pay.</p> : null}
      <p className="sb-small sb-center sb-secure"><LockSimple aria-hidden="true" />Paid directly to {hotel.name} through our payment partner. Not added to a room bill.</p>

      <div className="guest-dock-spacer" aria-hidden="true" />
      <div className="guest-dock">
        <div className="guest-dock__summary">
          <strong>{peso(total)}</strong>
          <small className={`sb-dock__fit${accountGate || !method ? ' is-muted' : quote.refundable ? ' is-positive' : ' is-muted'}`}>
            {accountGate ? 'Sign in above to pay' : !method ? 'Choose how to pay' : quote.refundable ? `Free cancellation to ${shortDate(quote.freeCancellationUntil!)}` : 'Non-refundable'}
          </small>
        </div>
        <button type="button" className="guest-button guest-button--primary" disabled={Boolean(accountGate) || !method || !online || processing} onClick={pay} aria-label={processing ? 'Processing payment' : `Pay ${peso(total)}`}>
          {processing ? 'Processing…' : <><LockSimple aria-hidden="true" />Pay</>}
        </button>
      </div>
    </div>
  );
}

