'use client';

import Image from 'next/image';
import { ArrowRight, CaretRight, Check, CheckCircle, CreditCard, LockSimple, Tag as TagIcon, WifiSlash, X } from '@phosphor-icons/react';
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { GATEWAY_METHOD_LABELS, type GatewayMethod } from '../gateway-checkout';
import { countNightsBetween } from '../prototype-model';
import { readPendingVoucher, savePendingVoucher } from './offers';
import type { CartLine, PromoAccount, RoomAllocation, StayAddOn, StayGuestDetails, StayHotel, StaySearch } from './model';
import { NEW_ACCOUNT, RATE_PLAN_LABELS, SERVICE_RATE, VAT_RATE, addOnLines, addOnsPayNowTotal, addOnsRoomChargeTotal, cartRooms, describeRooms, offersFor, partyLabel, peso, quoteStay, roomCancellationPolicy, voucherOptionsFor } from './model';
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
  const extraLines = addOnLines(addOns, hotel);
  const extras = addOnsPayNowTotal(extraLines);
  const roomCharge = addOnsRoomChargeTotal(extraLines);
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
                <span>{RATE_PLAN_LABELS[room.ratePlanId].title} · {roomCancellationPolicy(room.ratePlanId, search.checkIn).reason === 'free' ? `Free cancellation until ${longDate(quote.freeCancellationUntil!)}` : room.ratePlanId === 'saver' ? RATE_PLAN_LABELS[room.ratePlanId].detail : 'No refund · free cancellation has ended'}</span>
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
          {tried && !valid ? <small className="sb-dock__fit" role="alert">Check your details above</small> : (
            <>
              <small className="sb-dock__fit is-muted">Due now · {nightsLabel(search.checkIn, search.checkOut)} · taxes included</small>
              {roomCharge ? <small className="sb-dock__fit is-muted">{peso(roomCharge)} on your room if confirmed</small> : null}
            </>
          )}
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
export function StayPaymentScreen({ hotel, search, cart, details, onDetailsChange, onPaid, online, addOns, account = NEW_ACCOUNT, accountGate, voucherPage = false, onOpenVouchers, onVoucherBack, method, onMethodChange }: {
  hotel: StayHotel;
  search: StaySearch;
  cart: CartLine[];
  details: StayGuestDetails;
  onDetailsChange: (details: StayGuestDetails) => void;
  onPaid: (method: GatewayMethod) => void;
  online: boolean;
  /** Arrival extras chosen on the step before. Early check-in is billed to the room if confirmed. */
  addOns?: StayAddOn[];
  /** Who is paying, so a first-booking code is refused once they have booked. */
  account?: PromoAccount;
  /**
   * Shown instead of paying when the guest has no account: a booking has to
   * belong to someone, for its receipt, refunds and vouchers to have a home.
   */
  accountGate?: ReactNode;
  voucherPage?: boolean;
  onOpenVouchers: () => void;
  onVoucherBack: () => void;
  method: GatewayMethod | null;
  onMethodChange: (method: GatewayMethod) => void;
}) {
  const [processing, setProcessing] = useState(false);
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
  const freeRooms = rooms.filter((room) => roomCancellationPolicy(room.ratePlanId, search.checkIn).refundable).length;
  const extraLines = addOnLines(addOns, hotel);
  const payNowLines = extraLines.filter((line) => line.id !== 'early-check-in');
  const roomChargeLines = extraLines.filter((line) => line.id === 'early-check-in');
  const extrasPayNow = addOnsPayNowTotal(payNowLines);
  const total = quote.total + extrasPayNow;
  const set = (patch: Partial<StayGuestDetails>) => onDetailsChange({ ...details, ...patch });

  const pay = () => {
    if (accountGate || !method || !online || processing) return;
    setProcessing(true);
    timer.current = window.setTimeout(() => onPaid(method), 900);
  };

  if (voucherPage) {
    return (
      <StayVoucherPicker
        hotel={hotel}
        search={search}
        cart={cart}
        details={details}
        onDetailsChange={onDetailsChange}
        account={account}
        onBack={onVoucherBack}
      />
    );
  }

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
          <button key={option} type="button" aria-pressed={method === option} className={`sb-method${method === option ? ' is-active' : ''}`} onClick={() => onMethodChange(option)}>
            <span className="sb-method__glyph" data-method={option} aria-hidden="true">{option === 'card' ? <CreditCard /> : option === 'gcash' ? 'G' : 'M'}</span>
            <span className="sb-method__text"><b>{GATEWAY_METHOD_LABELS[option]}</b><small>{METHOD_HINTS[option]}</small></span>
            <span className="sb-method__radio" aria-hidden="true">{method === option ? <Check weight="bold" /> : null}</span>
          </button>
        ))}
      </fieldset>

      <section className="sb-section sb-promo-section" aria-labelledby="sb-voucher-title">
        <h2 id="sb-voucher-title">Voucher</h2>
        {quote.promo ? (
          <div className="sb-promo-applied"><TagIcon aria-hidden="true" /><span><b>{quote.promo.code}</b><small>{quote.promo.label} · −{peso(quote.discount)}</small></span>
            <span className="sb-promo-applied__actions">
              <button type="button" className="sb-voucher-change" disabled={processing} onClick={onOpenVouchers}>Change</button>
              <button type="button" aria-label="Remove voucher" disabled={processing} onClick={() => set({ promoCode: '' })}><X /></button>
            </span>
          </div>
        ) : (
          <button type="button" className="sb-voucher-entry" disabled={processing} onClick={onOpenVouchers}>
            <TagIcon aria-hidden="true" />
            <span><b>Have a voucher?</b><small>See your vouchers or enter a code</small></span>
            <CaretRight aria-hidden="true" />
          </button>
        )}
        {!quote.promo && quote.promoError ? <small className="sb-field-error" role="alert">{quote.promoError}</small> : null}
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
          {payNowLines.length ? (
            <>
              <div className="sb-price-group"><dt>Arrival extras</dt></div>
              {payNowLines.map((line) => (
                <div key={line.id}><dt>{line.title}<small>{line.detail}</small></dt><dd>{line.amount ? peso(line.amount) : 'Free'}</dd></div>
              ))}
            </>
          ) : null}
          {roomChargeLines.length ? (
            <>
              <div className="sb-price-group"><dt>Room charge if confirmed</dt></div>
              {roomChargeLines.map((line) => (
                <div key={line.id}><dt>{line.title}<small>{line.detail}</small></dt><dd>{peso(line.amount)}</dd></div>
              ))}
            </>
          ) : null}
          <div className="is-total"><dt>Total due now</dt><dd>{peso(total)}</dd></div>
        </dl>
        <p className={`sb-policy${freeRooms ? ' is-positive' : ''}`}>
          {freeRooms === rooms.length && freeRooms > 0
            ? <><CheckCircle weight="fill" aria-hidden="true" />All rooms have free cancellation until {longDate(quote.freeCancellationUntil!)}, 11:59 PM.</>
            : freeRooms > 0
              ? <><CheckCircle weight="fill" aria-hidden="true" />{freeRooms} of {rooms.length} rooms have free cancellation until {longDate(quote.freeCancellationUntil!)}, 11:59 PM. Other rooms have no refund when cancelled.</>
              : <>No rooms have free cancellation. Cancelling these rates won’t return the room charges.</>}
        </p>
      </section>


      {!online ? <p className="sb-note sb-note--warning"><WifiSlash aria-hidden="true" />You’re offline. Reconnect to pay.</p> : null}
      <p className="sb-small sb-center sb-secure">
        <span className="sb-secure__inner">
          <LockSimple aria-hidden="true" />
          <span>{roomChargeLines.length ? `Payment goes to ${hotel.name} through our payment partner. Early check-in is added to your room bill if confirmed.` : `Payment goes to ${hotel.name} through our payment partner. It isn’t added to a room bill.`}</span>
        </span>
      </p>

      <div className="guest-dock-spacer" aria-hidden="true" />
      <div className="guest-dock">
        <div className="guest-dock__summary">
          <strong>{peso(total)}</strong>
          <small className={`sb-dock__fit${accountGate || !method ? ' is-muted' : freeRooms ? ' is-positive' : ' is-muted'}`}>
            {accountGate ? 'Sign in above to pay' : !method ? 'Choose how to pay' : 'Due now'}
          </small>
          {roomChargeLines.length ? <small className="sb-dock__fit is-muted">{peso(addOnsRoomChargeTotal(roomChargeLines))} on room if confirmed</small> : null}
          {!roomChargeLines.length && method && !accountGate ? (
            <small className={`sb-dock__fit${freeRooms ? ' is-positive' : ' is-muted'}`}>
              {freeRooms === rooms.length && freeRooms ? `Free cancellation to ${shortDate(quote.freeCancellationUntil!)}` : freeRooms ? `${freeRooms} of ${rooms.length} rooms refundable` : 'No room refunds'}
            </small>
          ) : null}
        </div>
        <button type="button" className="guest-button guest-button--primary" disabled={Boolean(accountGate) || !method || !online || processing} onClick={pay} aria-label={processing ? 'Processing payment' : `Pay ${peso(total)}`}>
          {processing ? 'Processing…' : <><LockSimple aria-hidden="true" />Pay</>}
        </button>
      </div>
    </div>
  );
}

function StayVoucherPicker({ hotel, search, cart, details, onDetailsChange, account, onBack }: {
  hotel: StayHotel;
  search: StaySearch;
  cart: CartLine[];
  details: StayGuestDetails;
  onDetailsChange: (details: StayGuestDetails) => void;
  account: PromoAccount;
  onBack: () => void;
}) {
  const [promoDraft, setPromoDraft] = useState(details.promoCode);
  const [promoTried, setPromoTried] = useState(Boolean(details.promoCode));
  const nights = countNightsBetween(search.checkIn, search.checkOut);
  const quote = quoteStay(hotel, search, cart, details.promoCode, account);
  const draftQuote = quoteStay(hotel, search, cart, promoDraft, account);
  const options = voucherOptionsFor(hotel, nights, account);
  const available = options
    .filter((option) => !option.unavailableReason)
    .sort((a, b) => b.promo.apply(quote.subtotal) - a.promo.apply(quote.subtotal));
  const unavailable = options.filter((option) => option.unavailableReason);

  const applyDraft = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!promoDraft.trim()) return;
    setPromoTried(true);
    if (!draftQuote.promo) return;
    onDetailsChange({ ...details, promoCode: draftQuote.promo.code });
    onBack();
  };

  const selectVoucher = (code: string) => {
    onDetailsChange({ ...details, promoCode: code });
    onBack();
  };

  return (
    <div className="guest-stack sb-checkout sb-payment sb-voucher-page">
      <div className="guest-page-title">
        <h1>Vouchers</h1>
        <p>Choose one for this stay or enter a code.</p>
      </div>

      {quote.promo ? (
        <section className="sb-voucher-current" aria-label="Applied voucher">
          <span><CheckCircle weight="fill" aria-hidden="true" /><b>{quote.promo.code} · {peso(quote.discount)} off</b></span>
          <button type="button" onClick={() => { onDetailsChange({ ...details, promoCode: '' }); setPromoDraft(''); setPromoTried(false); }}>Remove</button>
        </section>
      ) : null}

      <form className="sb-voucher-code" onSubmit={applyDraft}>
        <label className={`sb-field${promoTried && draftQuote.promoError ? ' is-invalid' : ''}`}>
          <span>Voucher code</span>
          <input
            value={promoDraft}
            autoCapitalize="characters"
            autoComplete="off"
            aria-invalid={promoTried && Boolean(draftQuote.promoError) || undefined}
            onChange={(event) => { setPromoDraft(event.currentTarget.value); setPromoTried(false); }}
          />
          {promoTried && draftQuote.promoError ? <small className="sb-field-error" role="alert">{draftQuote.promoError}</small> : null}
        </label>
        <button type="submit" className="guest-button guest-button--secondary" disabled={!promoDraft.trim()}>Apply</button>
      </form>

      <section className="sb-voucher-section" aria-labelledby="sb-vouchers-available">
        <h2 id="sb-vouchers-available">Available for this booking</h2>
        {available.length ? (
          <div className="sb-voucher-list">
            {available.map(({ code, promo }) => {
              const selected = quote.promo?.code === code;
              return (
                <button key={code} type="button" className={`sb-voucher-row${selected ? ' is-selected' : ''}`} aria-pressed={selected} onClick={() => selectVoucher(code)}>
                  <TagIcon aria-hidden="true" />
                  <span className="sb-voucher-row__copy"><b>{promo.label}</b><code>{code}</code><small>{promo.terms}</small></span>
                  <span className="sb-voucher-row__action">{selected ? 'Applied' : 'Apply'}<small>Save {peso(promo.apply(quote.subtotal))}</small></span>
                </button>
              );
            })}
          </div>
        ) : <p className="sb-small">No vouchers apply to this stay.</p>}
      </section>

      {unavailable.length ? (
        <section className="sb-voucher-section" aria-labelledby="sb-vouchers-unavailable">
          <h2 id="sb-vouchers-unavailable">Not available for this booking</h2>
          <div className="sb-voucher-list sb-voucher-list--unavailable">
            {unavailable.map(({ code, promo, unavailableReason }) => (
              <button key={code} type="button" className="sb-voucher-row is-unavailable" disabled aria-describedby={`sb-voucher-reason-${code}`}>
                <TagIcon aria-hidden="true" />
                <span className="sb-voucher-row__copy"><b>{promo.label}</b><code>{code}</code><small id={`sb-voucher-reason-${code}`}>{unavailableReason}</small></span>
                <span className="sb-voucher-row__action">Unavailable</span>
              </button>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
