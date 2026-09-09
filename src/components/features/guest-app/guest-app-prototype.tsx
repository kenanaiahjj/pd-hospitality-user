'use client';

import {
  AirplaneTilt,
  AppleLogo,
  ArrowLeft,
  ArrowRight,
  Bed,
  CalendarBlank,
  CaretRight,
  ChatCircleDots,
  Check,
  CheckCircle,
  Coffee,
  EnvelopeSimple,
  ForkKnife,
  GoogleLogo,
  House,
  IdentificationCard,
  MapPin,
  Person,
  QrCode,
  Receipt,
  ShieldCheck,
  SignOut,
  SlidersHorizontal,
  Sparkle,
  SpinnerGap,
  Storefront,
  SuitcaseRolling,
  Users,
  WifiHigh,
  WifiSlash,
} from '@phosphor-icons/react';
import Image from 'next/image';
import { useState, type FormEvent, type ReactNode } from 'react';
import { CabanaLockup } from '@/components/ui/cabana-logo';
import { Button, Input } from '@/components/ui';
import {
  ANONYMOUS_SESSION,
  connectBooking,
  createAccountSession,
  getHomeVariant,
  getPostAuthScreen,
  getPrimaryBooking,
  MOCK_SESSION,
  SERVICES,
  signInSession,
  signOutSession,
  verifyPendingSession,
  type AuthMethod,
  type Booking,
  type GuestSession,
  type ServiceBooking,
  type ScreenId,
} from './prototype-model';
import { getServiceImage, type ServiceImageKey } from './service-images';
import './guest-app-prototype.css';

type ActiveScreen = ScreenId | 'entry-hub';

type FieldProps = {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  defaultValue?: string;
  helper?: string;
  required?: boolean;
};

function Field({ label, name, type = 'text', placeholder, defaultValue, helper, required }: FieldProps) {
  const helperId = helper ? `${name}-helper` : undefined;
  return (
    <label className="guest-field" htmlFor={name}>
      <span>{label}{required ? ' *' : ''}</span>
      <Input id={name} name={name} type={type} placeholder={placeholder} defaultValue={defaultValue} aria-describedby={helperId} required={required} />
      {helper ? <small id={helperId}>{helper}</small> : null}
    </label>
  );
}

function SelectField({ label, name, children, defaultValue }: { label: string; name: string; children: ReactNode; defaultValue?: string }) {
  return (
    <label className="guest-field" htmlFor={name}>
      <span>{label}</span>
      <select id={name} name={name} defaultValue={defaultValue}>{children}</select>
    </label>
  );
}

function HeroIcon({ children, tone = 'plain' }: { children: ReactNode; tone?: string }) {
  return <div className={`guest-hero-icon guest-hero-icon--${tone}`} aria-hidden="true">{children}</div>;
}

function Tag({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'positive' | 'warning' | 'dark' }) {
  return <span className={`guest-tag guest-tag--${tone}`}>{children}</span>;
}

function Notice({ icon, title, children, tone = 'neutral' }: { icon?: ReactNode; title: string; children: ReactNode; tone?: 'neutral' | 'positive' | 'warning' | 'offline' }) {
  return (
    <div className={`guest-notice guest-notice--${tone}`} role="status">
      {icon ? <span className="guest-notice__icon" aria-hidden="true">{icon}</span> : null}
      <div><strong>{title}</strong><p>{children}</p></div>
    </div>
  );
}

function SummaryRow({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return <div className="guest-summary-row"><span>{label}</span><b className={strong ? 'is-strong' : ''}>{value}</b></div>;
}

function QrArtwork() {
  return (
    <svg className="guest-qr" viewBox="0 0 29 29" role="img" aria-label="Stay identity QR code">
      <rect width="29" height="29" rx="1" fill="white" />
      <path fill="currentColor" d="M2 2h8v8H2V2Zm2 2v4h4V4H4Zm15-2h8v8h-8V2Zm2 2v4h4V4h-4ZM2 19h8v8H2v-8Zm2 2v4h4v-4H4Zm8-19h2v2h-2V2Zm3 0h2v4h-2V2Zm-3 4h4v2h-4V6Zm1 3h2v2h-2V9Zm4 0h2v4h-4v-2h2V9Zm4 3h2v2h-2v-2Zm3 0h3v2h-3v-2Zm-12 3h2v4h-2v-4Zm3 0h4v2h-4v-2Zm5 0h2v2h-2v-2Zm3 0h5v2h-3v2h-2v-4Zm-8 4h2v2h-2v-2Zm3 0h3v2h-3v-2Zm5 0h2v5h-2v-5Zm3 0h4v2h-4v-2Zm-12 4h5v2h-5v-2Zm6-1h2v3h-2v-3Zm6 1h4v2h-4v-2Zm-10 4h2v2h-2v-2Zm4 0h3v2h-3v-2Zm5 0h2v2h-2v-2Zm3 0h3v2h-3v-2Z" />
    </svg>
  );
}

function ServiceVisual({ tone, icon }: { tone: string; icon: ReactNode }) {
  return <div className={`guest-service-visual guest-service-visual--${tone}`} aria-hidden="true"><span>{icon}</span><i /><i /></div>;
}

function ServiceImage({ imageKey, tone, icon, decorative = false }: { imageKey: ServiceImageKey; tone: string; icon: ReactNode; decorative?: boolean }) {
  const [failed, setFailed] = useState(false);
  const image = getServiceImage(imageKey);

  return (
    <div className={`guest-service-image guest-service-image--${imageKey} ${failed ? 'is-error' : ''}`}>
      <ServiceVisual tone={tone} icon={icon} />
      <Image
        src={image.src}
        alt={decorative ? '' : image.alt}
        fill
        sizes="(max-width: 720px) calc(100vw - 32px), 688px"
        style={{ objectPosition: image.focalPoint }}
        onError={() => setFailed(true)}
      />
    </div>
  );
}

/**
 * The room QR identifies a room, so it may be the very first thing that
 * attaches a stay to the session. Connecting before activating means the path
 * works for a walk-up who has no booking on file yet.
 */
function withActiveRoom(current: GuestSession): GuestSession {
  const connected = connectBooking(current);
  const booking = connected.bookings.find((item) => item.status === 'active')
    ?? connected.bookings
      .filter((item) => item.status === 'upcoming')
      .sort((a, b) => a.checkIn.localeCompare(b.checkIn))[0];
  if (!booking) return connected;

  const roomNumber = booking.roomNumber ?? '304';
  return {
    ...connected,
    activeBookingId: booking.id,
    bookings: connected.bookings.map((item) => item.id === booking.id ? {
      ...item,
      status: 'active' as const,
      roomNumber,
      stayQrAvailable: true,
      folioTotal: item.folioTotal ?? '₱3,050',
    } : item),
    folioTotal: booking.folioTotal ?? (connected.folioTotal === '₱0' ? '₱3,050' : connected.folioTotal),
  };
}

/** Rendered by both `entry-hub` and `connect-booking`, so they cannot drift. */
function BookingEntryOptions({ onNavigate }: { onNavigate: (screen: ActiveScreen) => void }) {
  return (
    <div className="guest-entry-options">
      <button className="guest-entry-card" type="button" aria-label="Booking email" onClick={() => onNavigate('identify')}><span><Receipt /></span><div><b>Booking email</b><small>Pre-arrival · booking context attached</small></div><CaretRight /></button>
      <button className="guest-entry-card" type="button" aria-label="Continue with room QR" onClick={() => onNavigate('room-qr-landing')}><span><QrCode /></span><div><b>Room QR</b><small>Already at the hotel</small></div><CaretRight /></button>
      <button className="guest-entry-card" type="button" aria-label="Open hotel Wi-Fi entry" onClick={() => onNavigate('wifi-landing')}><span><WifiHigh /></span><div><b>Hotel Wi-Fi</b><small>Arrival-day captive portal</small></div><CaretRight /></button>
    </div>
  );
}

/**
 * Apple and Google are simulated the way QR scanning and ID capture already
 * are: the provider is treated as already knowing the guest, so it resolves to
 * the recognized account rather than inventing a second identity.
 */
function AuthMethods({ disabled, onSelect }: { disabled?: boolean; onSelect: (method: AuthMethod) => void }) {
  return (
    <>
      <div className="guest-auth-divider"><span>or continue with</span></div>
      <div className="guest-auth-methods">
        <Button className="guest-button guest-button--secondary" type="button" disabled={disabled} onClick={() => onSelect('apple')}><AppleLogo aria-hidden="true" />Apple</Button>
        <Button className="guest-button guest-button--secondary" type="button" disabled={disabled} onClick={() => onSelect('google')}><GoogleLogo aria-hidden="true" />Google</Button>
      </div>
    </>
  );
}

type GuestAppPrototypeProps = {
  initialSession?: GuestSession;
  initialScreen?: ActiveScreen;
  initialOnline?: boolean;
};

/**
 * What the guest was trying to do when the account gate interrupted them.
 * Applied once verification succeeds, because creating an account starts from
 * a clean session and would otherwise discard the booking they just matched.
 */
type PendingIntent = 'none' | 'connect-booking' | 'link-room';

export function GuestAppPrototype({ initialSession, initialScreen, initialOnline }: GuestAppPrototypeProps = {}) {
  const [activeScreen, setActiveScreen] = useState<ActiveScreen>(initialScreen ?? 'entry-hub');
  const [session, setSession] = useState<GuestSession>(() => initialSession ?? ANONYMOUS_SESSION);
  const [history, setHistory] = useState<ActiveScreen[]>([]);
  const [online, setOnline] = useState(initialOnline ?? true);
  const [code, setCode] = useState('');
  const [codeNotice, setCodeNotice] = useState<string | null>(null);
  const [pendingIntent, setPendingIntent] = useState<PendingIntent>('none');
  const [scrolled, setScrolled] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{ from: 'guest' | 'desk'; body: string; state?: string }>>([
    { from: 'desk', body: 'Good afternoon, Ana. How can we help with your stay?' },
  ]);
  const [sending, setSending] = useState(false);

  const go = (next: ActiveScreen) => {
    setHistory((items) => [...items, activeScreen]);
    setActiveScreen(next);
    setScrolled(false);
    window.scrollTo?.({ top: 0, behavior: 'smooth' });
  };

  const back = () => {
    setScrolled(false);
    setHistory((items) => {
      const next = [...items];
      setActiveScreen(next.pop() ?? 'entry-hub');
      return next;
    });
  };

  const sendQuickMessage = (body: string) => {
    const state = online ? 'Sent' : 'Will send when connected';
    setChatMessages((messages) => [...messages, { from: 'guest', body, state }]);
    if (!online) return;
    setSending(true);
    window.setTimeout(() => {
      setChatMessages((messages) => [...messages, { from: 'desk', body: body.includes('towel') ? `We’ll bring two fresh towels to ${contextRoom.toLowerCase()} shortly.` : 'Thanks. The front desk has received your request.', state: 'Seen' }]);
      setSending(false);
    }, 850);
  };

  const showNav = ['stay-overview', 'wallet', 'wallet-offline', 'marketplace', 'category-listing', 'hotel-service', 'vendor-service', 'service-booking', 'booking-confirmation', 'booking-blocked', 'my-bookings', 'cancel-before-cutoff', 'cancel-after-cutoff', 'folio', 'chat', 'chat-after-hours', 'room-qr-midstay', 'profile', 'stay-history'].includes(activeScreen);
  const showPrimaryNav = showNav && session.auth === 'authenticated';
  const primaryBooking = getPrimaryBooking(session.bookings, session.activeBookingId);
  const displayBooking = primaryBooking ?? MOCK_SESSION.bookings[0]!;
  const contextBooking = primaryBooking ?? displayBooking;
  const contextRoom = contextBooking.roomNumber ? `Room ${contextBooking.roomNumber}` : 'Room assigned at arrival';
  const contextService = session.serviceBookings.find(
    (service) => service.id === 'service-hilom-1' && service.bookingId === contextBooking.id,
  );

  const primary = (label: string, next: ActiveScreen, options?: { disabled?: boolean }) => (
    <Button className="guest-button guest-button--primary" type="button" onClick={() => go(next)} disabled={options?.disabled}>{label}<ArrowRight aria-hidden="true" /></Button>
  );

  const confirmService = () => {
    const booking = getPrimaryBooking(session.bookings, session.activeBookingId);
    if (!booking || booking.status !== 'active' || !booking.roomNumber) {
      go('booking-blocked');
      return;
    }

    const serviceBooking: ServiceBooking = {
      id: 'service-hilom-1',
      bookingId: booking.id,
      title: 'Hilom signature massage',
      scheduledFor: 'Tuesday · November 11 · 1:30 PM',
      amount: '₱2,400',
      status: 'confirmed',
    };

    setSession((current) => ({
      ...current,
      serviceBookings: [
        ...current.serviceBookings.filter((service) => service.id !== serviceBooking.id),
        serviceBooking,
      ],
      folioTotal: '₱5,450',
    }));
    go('booking-confirmation');
  };

  const linkRoomStay = () => {
    if (session.auth !== 'authenticated') {
      setPendingIntent('link-room');
      go('create-account');
      return;
    }
    setSession(withActiveRoom(session));
    go('room-qr-midstay');
  };

  /** Send the guest to the code screen carrying a pending session. */
  const beginVerification = (pending: GuestSession) => {
    setSession(pending);
    setCode('');
    setCodeNotice(null);
    go('verify-code');
  };

  /**
   * The one place identity becomes real. Applies whatever the guest was in the
   * middle of, then asks the model where they belong.
   */
  const completeAuth = (pending: GuestSession) => {
    const verified = verifyPendingSession(pending);
    const next = pendingIntent === 'link-room'
      ? withActiveRoom(verified)
      : pendingIntent === 'connect-booking'
        ? connectBooking(verified)
        : verified;

    const destination: ActiveScreen = pendingIntent === 'link-room'
      ? 'room-qr-midstay'
      : getPostAuthScreen(next);

    setSession(next);
    setPendingIntent('none');
    setCode('');
    setCodeNotice(null);
    go(destination);
  };

  const claimBooking = () => {
    if (session.auth !== 'authenticated') {
      setPendingIntent('connect-booking');
      go('create-account');
      return;
    }
    const next = connectBooking(session);
    setSession(next);
    go(getPostAuthScreen(next));
  };

  const signOut = () => {
    setSession(signOutSession());
    setPendingIntent('none');
    setCode('');
    setCodeNotice(null);
    setHistory([]);
    setActiveScreen('entry-hub');
    setScrolled(false);
  };

  const renderScreen = () => {
    switch (activeScreen) {
      case 'entry-hub':
        return (
          <div className="guest-entry">
            <div className="guest-entry__utility"><Tag>Clickable MVP</Tag><span>Guest app · Phase 1</span></div>
            <HeroIcon tone="dark"><SuitcaseRolling size={30} /></HeroIcon>
            <p className="guest-eyebrow">The Henry&apos;s Hotels pilot</p>
            <h1>Your stay starts here</h1>
            <p className="guest-lede">One account keeps your stays, room preferences, and charges together across all 13 properties.</p>
            {!online ? <Notice tone="offline" icon={<WifiSlash />} title="Signing in needs a connection">An account cannot be created or verified offline. Your room QR and front-desk help still work.</Notice> : null}
            <Button className="guest-button guest-button--primary" type="button" disabled={!online} onClick={() => go('create-account')}>Create account<ArrowRight aria-hidden="true" /></Button>
            <TextButton disabled={!online} onClick={() => go('sign-in')}>Log in</TextButton>
            <div className="guest-auth-divider"><span>Already have a booking?</span></div>
            <BookingEntryOptions onNavigate={go} />
            <p className="guest-footnote">Prototype only · No real booking data or payment is used.</p>
          </div>
        );

      case 'sign-in':
        return (
          <div className="guest-stack guest-stack--intro">
            <HeroIcon tone="dark"><ShieldCheck size={30} /></HeroIcon>
            <div className="guest-page-title">
              <p className="guest-eyebrow">Returning guest</p>
              <h1>Log in</h1>
              <p>Enter the email on your account and we&apos;ll send a 6-digit code. There is no password to remember.</p>
            </div>
            {!online ? <Notice tone="offline" icon={<WifiSlash />} title="Logging in needs a connection">A code cannot be sent or checked offline.</Notice> : null}
            <form className="guest-form" onSubmit={(event: FormEvent<HTMLFormElement>) => { event.preventDefault(); beginVerification(signInSession('email-code')); }}>
              <Field label="Email" name="sign-in-email" type="email" placeholder="you@example.com" required />
              <Button className="guest-button guest-button--primary" type="submit" disabled={!online}>Send my code<ArrowRight aria-hidden="true" /></Button>
            </form>
            <AuthMethods disabled={!online} onSelect={(method) => completeAuth(signInSession(method))} />
            <TextButton onClick={() => go('create-account')}>Create an account instead</TextButton>
          </div>
        );

      case 'verify-code': {
        const backToEmail: ScreenId = session.accountStatus === 'returning' ? 'sign-in' : 'create-account';
        return (
          <div className="guest-stack guest-stack--intro">
            <HeroIcon tone="dark"><EnvelopeSimple size={30} /></HeroIcon>
            <div className="guest-page-title">
              <p className="guest-eyebrow">Step 2 of 2</p>
              <h1>Check your email</h1>
              <p>We sent a 6-digit code to <b>{session.email}</b>. It expires in 10 minutes.</p>
            </div>
            {codeNotice ? <Notice tone="warning" title={codeNotice}>Codes expire quickly, so the newest one is the only one that works.</Notice> : null}
            {!online ? <Notice tone="offline" icon={<WifiSlash />} title="Verification needs a connection">We cannot check a code offline. Nothing has been created yet.</Notice> : null}
            <label className="guest-field guest-code-field" htmlFor="verification-code">
              <span>6-digit verification code</span>
              <Input
                id="verification-code"
                name="verification-code"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                placeholder="123456"
                value={code}
                onChange={(event) => setCode(event.target.value.replace(/[^0-9]/g, ''))}
              />
            </label>
            <Button className="guest-button guest-button--primary" type="button" disabled={code.length !== 6 || !online} onClick={() => completeAuth(session)}>Verify<ArrowRight aria-hidden="true" /></Button>
            <TextButton disabled={!online} onClick={() => setCodeNotice(`A new code is on its way to ${session.email}`)}>Resend the code</TextButton>
            <TextButton onClick={() => go(backToEmail)}>Use a different email</TextButton>
          </div>
        );
      }

      case 'connect-booking':
        return (
          <div className="guest-stack guest-stack--intro">
            <HeroIcon tone="dark"><Receipt size={30} /></HeroIcon>
            <div className="guest-page-title">
              <p className="guest-eyebrow">{session.guestName ? `Signed in as ${session.guestName}` : 'Account ready'}</p>
              <h1>Add your booking</h1>
              <p>Link a confirmed reservation to unlock arrival details, on-property services, room charges, and front-desk help.</p>
            </div>
            <BookingEntryOptions onNavigate={go} />
            <Notice title="A booking is required">This app starts after a hotel booking. It does not search or compare hotels.</Notice>
            <TextButton onClick={() => go('stay-overview')}>I&apos;ll do this later</TextButton>
          </div>
        );

      case 'room-qr-landing':
        return <ScreenIntro icon={<QrCode size={30} />} eyebrow="Room QR detected" title="Let’s link this room to you" text="This permanent room code opens the guest app. Your last name confirms which live booking is yours."><StayMiniCard booking={contextBooking} status={`Room ${contextBooking.roomNumber ?? '304'} detected`} /> <Field label="Last name" name="qr-last-name" placeholder="Santos" required /><Button className="guest-button guest-button--primary" type="button" onClick={linkRoomStay}>Link my stay<ArrowRight aria-hidden="true" /></Button><TextButton onClick={() => go('front-desk-assist')}>I need help</TextButton></ScreenIntro>;

      case 'wifi-landing':
        return <ScreenIntro icon={<WifiHigh size={30} />} eyebrow="Connected to hotel Wi-Fi" title="Welcome to The Henry Manila" text="You’re online through the hotel network. Find your booking to continue."><Notice title="Hotel-local connection" icon={<WifiHigh />}>Your Stay QR and itinerary remain available if this connection drops.</Notice>{primary('Find my booking', 'identify')}</ScreenIntro>;

      case 'identify':
        return <ScreenIntro eyebrow="Connect your stay" title="Find your booking" text="Use the details from your confirmation email. OTA references from Agoda and Booking.com work too."><form className="guest-form" onSubmit={(event) => { event.preventDefault(); go('booking-found'); }}><Field label="Booking or confirmation number" name="booking-number" placeholder="Any format" helper="We’ll match hotel and OTA references." required /><Field label="Last name" name="last-name" placeholder="As shown on the booking" required /><Button className="guest-button guest-button--primary" type="submit">Find booking<ArrowRight /></Button></form><TextButton onClick={() => go('lookup-fallback')}>I can’t find my booking</TextButton></ScreenIntro>;

      case 'lookup-fallback':
        return <ScreenIntro eyebrow="We couldn’t match that number" title="Try another way" text="Legacy hotel systems can use a different reference. These stay details give us another way to look."><Notice tone="warning" title="No match yet">Your booking is not lost. We won’t ask you to reformat the reference.</Notice><div className="guest-form"><Field label="Last name" name="fallback-name" defaultValue="Santos" /><Field label="Check-in date" name="fallback-date" type="date" defaultValue="2026-11-09" /><SelectField label="Property" name="property" defaultValue="manila"><option value="manila">The Henry Manila</option><option value="cebu">The Henry Cebu</option><option value="dumaguete">The Henry Dumaguete</option></SelectField>{primary('Search again', 'front-desk-assist')}</div></ScreenIntro>;

      case 'front-desk-assist':
        return <ScreenIntro icon={<ChatCircleDots size={30} />} eyebrow="Human fallback" title="The front desk can connect you" text="Ask the front desk to send a secure link or give you a short code. You don’t need to understand the hotel’s booking system."><div className="guest-contact-card"><div><small>The Henry Manila</small><b>+63 2 8807 8888</b><span>Front desk · 6:00 AM–10:00 PM</span></div><button aria-label="Call the front desk" className="guest-icon-button"><ChatCircleDots /></button></div><Field label="Code from the front desk" name="staff-code" placeholder="6-digit code" />{primary('Connect my stay', 'booking-found')}<TextButton onClick={() => go('no-booking')}>I don’t have a booking</TextButton></ScreenIntro>;

      case 'no-booking':
        return <ScreenIntro icon={<Receipt size={30} />} eyebrow="No stay attached" title="You need a confirmed booking" text="Cabana starts after a hotel booking. The app does not search or compare hotels."><Notice title="Already booked?">Try your OTA reference or ask the property to send you a secure link.</Notice>{primary('Try again', 'identify')}<TextButton onClick={() => go('front-desk-assist')}>Contact the front desk</TextButton></ScreenIntro>;

      case 'booking-found':
        return <ScreenIntro eyebrow="Match found" title="Is this your stay?" text="Confirm the details before creating your guest profile."><StayCard booking={displayBooking} /><div className="guest-summary"><SummaryRow label="Guest" value={session.guestName || MOCK_SESSION.guestName} /><SummaryRow label="Guests" value={`${displayBooking.guestCount} guests`} /><SummaryRow label="Source" value={displayBooking.source} /></div><Button className="guest-button guest-button--primary" type="button" onClick={claimBooking}>Yes, this is my stay<ArrowRight aria-hidden="true" /></Button><TextButton onClick={() => go('identify')}>This isn’t my booking</TextButton></ScreenIntro>;

      case 'create-account':
        return (
          <div className="guest-stack guest-stack--intro">
            <HeroIcon tone="dark"><Person size={30} /></HeroIcon>
            <div className="guest-page-title">
              <p className="guest-eyebrow">One account, 13 properties</p>
              <h1>Create your account</h1>
              <p>{pendingIntent === 'none' ? 'We’ll email a 6-digit code to confirm it’s you. Room charges settle with the hotel, so no card is ever stored here.' : 'Your stay is matched. Create an account to hold it, and to keep room charges attached to a name.'}</p>
            </div>
            {!online ? <Notice tone="offline" icon={<WifiSlash />} title="Creating an account needs a connection">A code cannot be sent offline. Nothing has been saved yet.</Notice> : null}
            <form className="guest-form" onSubmit={(event: FormEvent<HTMLFormElement>) => {
              event.preventDefault();
              const data = new FormData(event.currentTarget);
              beginVerification(createAccountSession(
                String(data.get('account-name') ?? '').trim(),
                String(data.get('account-email') ?? '').trim(),
                'email-code',
              ));
            }}>
              <Field label="Full name" name="account-name" placeholder="As shown on your ID" required />
              <Field label="Email" name="account-email" type="email" placeholder="you@example.com" required />
              <Button className="guest-button guest-button--primary" type="submit" disabled={!online}>Send my code<ArrowRight aria-hidden="true" /></Button>
            </form>
            <AuthMethods disabled={!online} onSelect={(method) => completeAuth(signInSession(method))} />
            <TextButton onClick={() => go('sign-in')}>I already have an account</TextButton>
          </div>
        );

      case 'welcome-back':
        return <ScreenIntro icon={<CheckCircle size={30} />} eyebrow="Returning guest recognized" title={`Welcome back, ${session.guestName.split(' ')[0]}`} text="Your saved identity and room preferences are ready for this stay at a new property."><StayCard booking={displayBooking} /><Notice tone="positive" icon={<Sparkle />} title="No typing needed">Review what we already have, then confirm your stay.</Notice>{primary('Review saved details', 'repeat-review')}</ScreenIntro>;

      case 'stay-overview':
        return <StayOverviewHome session={session} booking={primaryBooking} online={online} onNavigate={go} />;

      case 'guest-details':
        return <FormScreen step="1 of 5" title="Your details" text="These details are sent securely to the property for registration."><Field label="Full name" name="guest-name" defaultValue="Ana Santos" required /><Field label="Nationality" name="nationality" defaultValue="Filipino" /><Field label="Email" name="guest-email" type="email" defaultValue="ana@example.com" /><Field label="Mobile" name="guest-mobile" type="tel" defaultValue="+63 917 555 0142" />{primary('Continue to ID', 'id-capture')}</FormScreen>;

      case 'id-capture':
        return <FormScreen step="2 of 5" title="ID or passport" text="International guests need passport details."><button className="guest-upload" type="button"><IdentificationCard size={28} /><b>Capture or upload ID</b><small>Passport, national ID, or driver’s license</small></button><Field label="Document number" name="document-number" placeholder="Enter document number" /><Field label="Expiry date" name="expiry" type="date" />{primary('Save and continue', 'room-preferences')}</FormScreen>;

      case 'room-preferences':
        return <FormScreen step="3 of 5" title="Room preferences" text="We’ll save these above the property level and pre-fill them on future stays."><SelectField label="Preferred floor" name="floor" defaultValue="high"><option value="high">Higher floor</option><option value="low">Lower floor</option><option value="none">No preference</option></SelectField><SelectField label="Bed type" name="bed" defaultValue="king"><option value="king">King bed</option><option value="twin">Twin beds</option></SelectField><fieldset className="guest-fieldset"><legend>Accessibility needs</legend><CheckOption label="Step-free room access" /><CheckOption label="Bathroom grab rails" /><CheckOption label="Visual door alert" /></fieldset>{primary('Save preferences', online ? 'additional-guests' : 'prereg-queued')}</FormScreen>;

      case 'additional-guests':
        return <FormScreen step="4 of 5" title="Who else is staying?" text="Add names only. Additional guests do not need accounts."><Field label="Additional guest 1" name="guest-2" defaultValue="Marco Santos" /><button type="button" className="guest-button guest-button--secondary">Add another guest</button><Notice title="One booking, one account">Your Stay QR can be shared as a screenshot with the people staying with you.</Notice>{primary('Continue', 'early-check-in')}</FormScreen>;

      case 'repeat-review':
        return <ScreenIntro eyebrow="Saved from your Cebu stay" title="Review, then confirm" text="Everything is pre-filled. Change only what’s different this time."><div className="guest-review-card"><ReviewBlock icon={<Person />} title="Ana Santos" lines={['Filipino · Passport on file', 'ana@example.com · +63 917 555 0142']} /><ReviewBlock icon={<SlidersHorizontal />} title="Room preferences" lines={['Higher floor · King bed', 'No accessibility requests']} /><ReviewBlock icon={<Users />} title="Additional guest" lines={['Marco Santos']} /></div>{primary('Confirm everything', 'prereg-complete')}<TextButton onClick={() => go('guest-details')}>Edit details</TextButton></ScreenIntro>;

      case 'rate-detail':
        return <ScreenIntro eyebrow={`Booking ${displayBooking.id}`} title="Room and rate" text="The latest details returned by the hotel system."><StayCard booking={displayBooking} /><div className="guest-summary"><SummaryRow label={`${displayBooking.checkOut} · ${displayBooking.roomType}`} value="₱18,000" /><SummaryRow label="Taxes and fees" value="₱2,160" /><SummaryRow label="Booking total" value="₱20,160" strong /><SummaryRow label={`Paid through ${displayBooking.source}`} value="₱20,160" /></div><Notice title="Live hotel data">Availability, rates, and payment details require a connection.</Notice></ScreenIntro>;

      case 'early-check-in':
        return <ScreenIntro eyebrow="Arrival · 10:30 AM" title="Check in earlier" text="Standard check-in is 3:00 PM. Request a room from 11:00 AM and settle the added charge with the hotel at checkout."><div className="guest-price-card"><div><small>Early check-in</small><b>11:00 AM</b></div><strong>₱1,500</strong></div><Notice title="Charged to your room folio">The hotel confirms availability first. If approved, the ₱1,500 charge is added to your room and settled at checkout.</Notice>{primary('Request early check-in', online ? 'prereg-complete' : 'prereg-queued')}<TextButton onClick={() => go('prereg-complete')}>Keep standard 3:00 PM</TextButton></ScreenIntro>;

      case 'insurance-offer':
        return <ScreenIntro eyebrow="Pre-arrival" title="You’re ready for arrival" text="Continue to the hotel handoff. Your room and on-property charges are settled with the hotel at checkout.">{primary('Continue to arrival', 'prereg-complete')}</ScreenIntro>;

      case 'prereg-complete': {
        const arrived = contextBooking.status === 'active';
        return <ScreenIntro icon={<Check size={30} />} eyebrow="Pre-registered" title="You’re ready for arrival" text={arrived ? 'Open your Stay QR at the front desk. A team member will verify your identity and complete check-in.' : 'Your pre-arrival details are saved. Review your stay before you arrive.'}><div className="guest-timeline"><TimelineItem title="Before arrival" text="Details received by the hotel" done /><TimelineItem title="At the front desk" text="Show your Stay QR and original ID" /><TimelineItem title="After verification" text={`${contextRoom} becomes active in the app`} /></div>{primary(arrived ? 'Open my Stay QR' : 'View my stay', arrived ? 'wallet' : 'stay-overview')}<TextButton onClick={() => go('stay-overview')}>View stay overview</TextButton></ScreenIntro>;
      }

      case 'prereg-queued':
        return <ScreenIntro icon={<WifiSlash size={30} />} eyebrow="Saved on this device" title="Ready to send when connected" text="Your pre-registration is safely queued. It will send automatically when a connection returns."><Notice tone="offline" title="No action needed">Your edits remain on this device. The hotel has not received them yet.</Notice>{primary('Open cached stay', 'stay-overview')}</ScreenIntro>;

      case 'wallet':
      case 'wallet-offline': {
        const isOfflineWallet = activeScreen === 'wallet-offline' || !online;
        return <div className="guest-wallet"><div className="guest-wallet__status"><Tag tone={isOfflineWallet ? 'warning' : 'positive'}>{isOfflineWallet ? 'Saved on this device' : 'Ready for arrival'}</Tag><span>Valid until {contextBooking.checkOut.slice(5).replace('-', '/')}</span></div><h1>{isOfflineWallet ? 'Your Stay QR works offline' : 'Your Stay QR'}</h1><p>Show this identity code at the front desk. It does not authorize charges or unlock your room.</p><div className="guest-qr-card"><QrArtwork /><div className="guest-qr-card__identity"><b>{session.guestName}</b><span>{contextBooking.property} · {contextRoom}</span><code>STAY · {contextBooking.id.slice(-6).toUpperCase()}</code></div></div><div className="guest-tag-row"><Tag>Identity only</Tag><Tag>Screenshot-shareable</Tag><Tag>Offline-ready</Tag></div>{isOfflineWallet ? <Notice tone="offline" icon={<WifiSlash />} title="Offline">This cached QR, your room, itinerary, booking details, last-known folio, and chat history are available.</Notice> : <Notice tone="positive" icon={<CheckCircle />} title="Saved for offline use">This QR remains available if your connection drops.</Notice>}<button className="guest-button guest-button--secondary" type="button">Save screenshot</button></div>;
      }

      case 'marketplace':
        return <div className="guest-stack"><div className="guest-page-title"><p className="guest-eyebrow">On-property only</p><h1>Make the most of your stay</h1><p>Book hotel services and verified on-property providers. Charges are added to {contextRoom.toLowerCase()} and settle at checkout.</p></div>{!online ? <Notice tone="offline" icon={<WifiSlash />} title="Browsing saved services">Live availability and booking require a connection.</Notice> : null}<div className="guest-featured-service"><ServiceImage imageKey="spa" tone="sage" icon={<Sparkle size={32} />} /><div><Tag>Third-party · on property</Tag><h2>Hilom signature massage</h2><p>Traditional Filipino therapeutic massage.</p><button onClick={() => go('vendor-service')}>View service<ArrowRight /></button></div></div><section><SectionHeading title="Browse services" /><div className="guest-category-grid"><ActionTile icon={<ForkKnife />} label="In-room dining" onClick={() => go('hotel-service')} /><ActionTile icon={<Sparkle />} label="Spa & massage" onClick={() => go('category-listing')} /><ActionTile icon={<Coffee />} label="Restaurants & bar" onClick={() => go('category-listing')} /><ActionTile icon={<MapPin />} label="Activities & tours" onClick={() => go('category-listing')} /><ActionTile icon={<AirplaneTilt />} label="Transfers" onClick={() => go('category-listing')} /><ActionTile icon={<Storefront />} label="Other amenities" onClick={() => go('category-listing')} /></div></section><button className="guest-list-row" onClick={() => go('my-bookings')}><span><CalendarBlank /></span><div><b>My bookings</b><small>View upcoming and past services</small></div><CaretRight /></button></div>;

      case 'category-listing':
        return <div className="guest-stack"><div className="guest-page-title"><p className="guest-eyebrow">2 services</p><h1>Spa & massage</h1><p>Verified providers operating inside this property.</p></div>{SERVICES.filter((service) => service.id === 'spa' || service.id === 'tour').map((service) => <button key={service.id} className="guest-service-row" onClick={() => go('vendor-service')}><ServiceImage imageKey={service.id} tone={service.tone} icon={<Sparkle />} decorative /><div><Tag>{service.operator}</Tag><h2>{service.name}</h2><p>{service.price} · {service.cutoff}</p></div><CaretRight /></button>)}</div>;

      case 'hotel-service':
        return <ServiceDetail kind="hotel" booking={contextBooking} online={online} onBook={() => go(online ? 'service-booking' : 'booking-blocked')} onChat={() => go('chat')} />;

      case 'vendor-service':
        return <ServiceDetail kind="vendor" booking={contextBooking} online={online} onBook={() => go(online ? 'service-booking' : 'booking-blocked')} onChat={() => go('chat')} />;

      case 'service-booking':
        return <FormScreen step="Charged to room" title="Choose a time" text={`Live availability is shown for Hilom signature massage at ${contextBooking.property}.`}><div className="guest-date-strip"><button aria-pressed="false"><small>MON</small><b>10</b></button><button className="is-active" aria-pressed="true"><small>TUE</small><b>11</b></button><button aria-pressed="false"><small>WED</small><b>12</b></button></div><fieldset className="guest-fieldset"><legend>Available times</legend><div className="guest-chip-grid"><button type="button">10:00 AM</button><button className="is-active" type="button">1:30 PM</button><button type="button">4:00 PM</button></div></fieldset><SelectField label="Guests" name="party-size" defaultValue="1"><option value="1">1 guest</option><option value="2">2 guests</option></SelectField><div className="guest-summary"><SummaryRow label="Hilom signature massage" value="₱2,400" /><SummaryRow label="Property" value={contextBooking.property} /><SummaryRow label="Guest" value={session.guestName} /><SummaryRow label={contextRoom} value="Charge at checkout" /><SummaryRow label="Total added to folio" value="₱2,400" strong /></div><Button className="guest-button guest-button--primary" type="button" onClick={confirmService}>Confirm and charge to room<ArrowRight aria-hidden="true" /></Button></FormScreen>;

      case 'booking-confirmation':
        return <ScreenIntro icon={<Check size={30} />} eyebrow="Booking confirmed" title="Your massage is booked" text={`The charge has been added to ${contextRoom.toLowerCase()} and settles with your hotel folio at checkout.`}><div className="guest-ticket"><div><small>{contextService?.scheduledFor ?? 'Tuesday · November 11 · 1:30 PM'}</small><h2>1:30 PM</h2><p>{contextService?.title ?? 'Hilom signature massage'} · 1 guest</p></div><Tag>Confirmed</Tag></div><Notice title="Cancellation cutoff">Cancel yourself until 1:30 PM on November 10. After that, contact the front desk. The folio line remains.</Notice>{primary('View my bookings', 'my-bookings')}<TextButton onClick={() => go('marketplace')}>Book another service</TextButton></ScreenIntro>;

      case 'booking-blocked':
        return <ScreenIntro icon={<WifiSlash size={30} />} eyebrow="Connection required" title="We can’t hold a time while offline" text="Live services are not queued because the slot or price could change before you reconnect."><Notice tone="offline" title="Nothing was booked">Connect to hotel Wi-Fi and try again. You can still message the front desk; the message will wait on this device.</Notice>{primary('Message the front desk', 'chat')}<TextButton onClick={() => { setOnline(true); go('vendor-service'); }}>Try again</TextButton></ScreenIntro>;

      case 'my-bookings': {
        const stayServices = session.serviceBookings.filter((service) => service.bookingId === contextBooking.id);
        const upcomingServices = stayServices.filter((service) => service.status === 'confirmed');
        const pastServices = stayServices.filter((service) => service.status !== 'confirmed');
        return <div className="guest-stack"><div className="guest-page-title"><p className="guest-eyebrow">Services for this stay</p><h1>My bookings</h1><p>{contextBooking.property} · {contextRoom}</p></div>{upcomingServices.length ? <section><SectionHeading title="Upcoming" />{upcomingServices.map((service) => <button key={service.id} className="guest-booking-card" onClick={() => go('cancel-before-cutoff')} type="button"><div><Tag tone="positive">Confirmed</Tag><h2>{service.title}</h2><p>{service.scheduledFor} · {service.amount}</p><small>Third-party · on property · settles at checkout</small></div><CaretRight /></button>)}</section> : null}{pastServices.length ? <section><SectionHeading title="Past" />{pastServices.map((service) => <div key={service.id} className="guest-booking-card is-static"><div><Tag tone={service.status === 'cancelled' ? 'neutral' : 'positive'}>{service.status === 'cancelled' ? 'Cancelled' : 'Completed'}</Tag><h2>{service.title}</h2><p>{service.scheduledFor} · {service.amount}</p><small>Third-party · on property</small></div></div>)}</section> : <section><SectionHeading title="Past" /><div className="guest-booking-card is-static"><div><Tag>Completed</Tag><h2>Airport transfer</h2><p>Sun, Nov 9 · 9:00 AM · ₱1,200</p><small>Hotel arranged</small></div></div></section>}{!stayServices.length ? <Notice title="No upcoming services">Browse on-property services whenever you’re ready. Each approved service settles with the hotel at checkout.</Notice> : null}</div>;
      }

      case 'cancel-before-cutoff': {
        const cancellableService = contextService ?? {
          id: 'service-hilom-1',
          bookingId: contextBooking.id,
          title: 'Hilom signature massage',
          scheduledFor: 'Tuesday · November 11 · 1:30 PM',
          amount: '₱2,400',
          status: 'confirmed' as const,
        };
        const cancelService = () => {
          setSession((current) => ({
            ...current,
            serviceBookings: current.serviceBookings.map((service) => service.id === cancellableService.id ? { ...service, status: 'cancelled' } : service),
            folioTotal: contextBooking.folioTotal ?? current.folioTotal,
          }));
          go('my-bookings');
        };
        return <ScreenIntro eyebrow="30 hours before service" title="Cancel this booking?" text="This is before the provider’s 24-hour cutoff, so you can cancel it yourself."><div className="guest-ticket"><div><small>{cancellableService.scheduledFor}</small><h2>1:30 PM</h2><p>{cancellableService.title} · {cancellableService.amount} · {contextRoom}</p></div></div><Notice tone="positive" title="The folio line will be removed">This service has not settled. No money moves when you cancel.</Notice><button className="guest-button guest-button--danger" onClick={cancelService} type="button">Cancel service</button><TextButton onClick={() => go('my-bookings')}>Keep booking</TextButton><div className="guest-provisional"><b>Provisional decision</b><p>Confirm that third-party providers accept a 24-hour self-service cancellation window.</p></div></ScreenIntro>;
      }

      case 'cancel-after-cutoff':
        return <ScreenIntro eyebrow="4 hours before service" title="Contact the front desk to change this" text="The provider’s 24-hour self-service cutoff has passed. The charge stays on your room folio."><Notice tone="warning" title="Front desk help required">Send a message and the team will check what the provider can do.</Notice>{primary('Chat with front desk', 'chat')}<TextButton onClick={() => go('my-bookings')}>Keep booking</TextButton><div className="guest-provisional"><b>Provisional decision</b><p>Confirm that third-party providers accept a 24-hour self-service cancellation window.</p></div></ScreenIntro>;

      case 'folio': {
        const folioServices = session.serviceBookings.filter((service) => service.bookingId === contextBooking.id && service.status === 'confirmed');
        const folioTotal = session.folioTotal || contextBooking.folioTotal || '₱0';
        return <div className="guest-stack"><div className="guest-page-title"><p className="guest-eyebrow">{contextBooking.property} · {contextRoom} · Last updated 2:14 PM</p><h1>Room charges</h1><p>These charges settle with the hotel at checkout.</p></div>{!online ? <Notice tone="offline" title="Last-known folio">Reconnect for the latest charges.</Notice> : null}<div className="guest-total-card"><span>Current room total</span><strong>{folioTotal}</strong><small>Booking room rate paid through {contextBooking.source}</small></div><div className="guest-folio"><FolioItem date="NOV 9" title="Airport transfer" meta="Hotel arranged" amount="₱1,200" /><FolioItem date="NOV 10" title="In-room dining" meta="Dinner · 2 guests" amount="₱850" /><FolioItem date="NOV 10" title="Laundry service" meta="Hotel operated" amount="₱1,000" />{folioServices.map((service) => <FolioItem key={service.id} date="NOV 11" title={service.title} meta={`${service.scheduledFor} · Added to ${contextRoom.toLowerCase()} · settles at checkout`} amount={service.amount} />)}</div><Notice title="Questions about a charge?">The front desk can explain or correct a folio line before checkout.</Notice>{primary('Ask the front desk', 'chat')}</div>;
      }

      case 'chat':
      case 'chat-after-hours': {
        const afterHours = activeScreen === 'chat-after-hours';
        return <div className="guest-chat"><div className="guest-chat__intro"><div><Tag tone={afterHours ? 'warning' : 'positive'}>{afterHours ? 'Outside staffed hours' : 'Front desk online'}</Tag><h1>Front desk</h1><p>{afterHours ? `Messages send now. The team responds from 6:00 AM for ${contextBooking.property}.` : `Shared property inbox for ${contextBooking.property} · Usually replies in a few minutes.`}</p></div></div>{!online ? <Notice tone="offline" title="Messages will send when connected">Your chat history is available. New requests wait on this device.</Notice> : null}<div className="guest-quick-actions" aria-label="Quick requests"><button onClick={() => sendQuickMessage('Could we get two fresh towels, please?')}>Towels</button><button onClick={() => sendQuickMessage(`Please arrange housekeeping for ${contextRoom.toLowerCase()}.`)}>Housekeeping</button><button onClick={() => sendQuickMessage('Can we request a late checkout?')}>Late checkout</button><button onClick={() => sendQuickMessage('We need help arranging a transfer.')}>Transfers</button></div><div className="guest-messages" aria-live="polite">{chatMessages.map((message, index) => <div key={`${message.body}-${index}`} className={`guest-message guest-message--${message.from}`}><p>{message.body}</p>{message.state ? <small>{message.state}</small> : null}</div>)}{sending ? <div className="guest-message guest-message--desk guest-message--typing"><SpinnerGap className="guest-spin" /><span>Front desk is replying</span></div> : null}</div><form className="guest-composer" onSubmit={(event: FormEvent<HTMLFormElement>) => { event.preventDefault(); const form = new FormData(event.currentTarget); const body = String(form.get('message') ?? '').trim(); if (body) sendQuickMessage(body); event.currentTarget.reset(); }}><label className="sr-only" htmlFor="message">Message the front desk</label><input id="message" name="message" placeholder="Ask the front desk" /><button aria-label="Send message" type="submit"><ArrowRight /></button></form></div>;
      }

      case 'room-qr-midstay':
        return <ScreenIntro icon={<CheckCircle size={30} />} eyebrow={`${contextRoom} linked`} title="You’re checked in" text="Pre-arrival steps are no longer relevant. Go straight to services, your room charges, or the front desk."><StayMiniCard booking={contextBooking} status={`Active until ${contextBooking.checkOut}`} />{primary('Explore services', 'marketplace')}<button className="guest-button guest-button--secondary" onClick={() => go('stay-overview')}>Open stay overview</button></ScreenIntro>;

      case 'profile':
        return <div className="guest-stack"><div className="guest-page-title"><p className="guest-eyebrow">Guest identity</p><h1>{session.guestName || 'Your profile'}</h1><p>Recognized across all 13 participating properties.</p></div><div className="guest-profile-card"><div className="guest-avatar">{(session.guestName || 'Guest').split(' ').map((part) => part[0]).slice(0, 2).join('')}</div><div><b>{session.email || 'No email on file'}</b><span>+63 917 555 0142</span><small>Passport on file · ends 4821</small></div></div><section><SectionHeading title="Saved preferences" action="Edit" onAction={() => go('room-preferences')} /><div className="guest-summary"><SummaryRow label="Floor" value="Higher floor" /><SummaryRow label="Bed" value="King" /><SummaryRow label="Accessibility" value="None" /></div></section><button className="guest-list-row" onClick={() => go('stay-history')}><span><SuitcaseRolling /></span><div><b>Stay history</b><small>3 stays across 2 properties</small></div><CaretRight /></button><div className="guest-list-row is-muted"><span><Sparkle /></span><div><b>Loyalty</b><small>Coming soon</small></div></div><button className="guest-list-row" type="button" aria-label="Sign out" onClick={signOut}><span><SignOut /></span><div><b>Sign out</b><small>Return to the welcome screen</small></div><CaretRight /></button></div>;

      case 'stay-history':
        return <div className="guest-stack"><div className="guest-page-title"><p className="guest-eyebrow">Across properties</p><h1>Stay history</h1></div><HistoryItem property="The Henry Cebu" dates="March 14–17, 2026" room="Room 211 · Completed" /><HistoryItem property="The Henry Manila" dates="October 2–4, 2025" room="Room 406 · Completed" /><HistoryItem property="The Henry Cebu" dates="May 8–10, 2025" room="Room 108 · Completed" /></div>;
    }
  };

  return (
    <main className="guest-prototype guest-app">
        <section className="guest-device" aria-label="Cabana guest app">
          <header className="guest-appbar" data-scrolled={scrolled}>
            <div className="guest-appbar__side">
              {history.length ? <button className="guest-icon-button" type="button" onClick={back} aria-label="Go back"><ArrowLeft /></button> : <span className="guest-brand"><CabanaLockup className="guest-brand__lockup" /><span className="sr-only">Cabana</span></span>}
            </div>
            {/* Connection is only worth a slot when it is the exception. */}
            <div className="guest-appbar__center">{online ? null : <span className="guest-connection"><WifiSlash />Offline</span>}</div>
            {/* No profile to open before there is an account to open it for. */}
            <div className="guest-appbar__side guest-appbar__side--end">
              {session.auth === 'authenticated' ? <button className="guest-icon-button" type="button" onClick={() => go('profile')} aria-label="Open profile"><Person /></button> : null}
            </div>
          </header>

          <div
            className={`guest-screen ${showNav ? 'has-nav' : ''}`}
            key={activeScreen}
            onScroll={(event) => {
              const next = event.currentTarget.scrollTop > 4;
              setScrolled((current) => (current === next ? current : next));
            }}
          >
            {renderScreen()}
          </div>

          {showPrimaryNav ? <nav className="guest-bottom-nav" aria-label="Primary navigation"><NavButton label="Stay" icon={<House />} active={activeScreen === 'stay-overview'} onClick={() => go('stay-overview')} /><NavButton label="Services" icon={<Storefront />} active={['marketplace', 'category-listing', 'hotel-service', 'vendor-service', 'service-booking', 'booking-confirmation', 'booking-blocked', 'my-bookings', 'cancel-before-cutoff', 'cancel-after-cutoff'].includes(activeScreen)} onClick={() => go('marketplace')} /><NavButton label="Wallet" icon={<QrCode />} active={activeScreen === 'wallet' || activeScreen === 'wallet-offline'} onClick={() => go(online ? 'wallet' : 'wallet-offline')} /><NavButton label="Chat" icon={<ChatCircleDots />} active={activeScreen === 'chat' || activeScreen === 'chat-after-hours'} onClick={() => go('chat')} /></nav> : null}
        </section>
    </main>
  );
}

type StayOverviewHomeProps = {
  session: GuestSession;
  booking?: Booking;
  online: boolean;
  onNavigate: (screen: ActiveScreen) => void;
};

function StayOverviewHome({ session, booking, online, onNavigate }: StayOverviewHomeProps) {
  const variant = getHomeVariant(session.bookings, session.activeBookingId);
  const upcomingBookings = session.bookings
    .filter((item) => item.status === 'upcoming')
    .sort((a, b) => a.checkIn.localeCompare(b.checkIn));

  if (variant === 'empty' || !booking) {
    return <EmptyStayHome onNavigate={onNavigate} />;
  }

  if (variant === 'active') {
    const confirmedServices = session.serviceBookings.filter(
      (service) => service.status === 'confirmed' && service.bookingId === booking.id,
    );
    const roomLabel = booking.roomNumber ? `Room ${booking.roomNumber}` : 'Active room';
    const folioTotal = session.folioTotal || booking.folioTotal || '₱0';
    return (
      <div className="guest-stack guest-home-booking guest-home-booking--active" data-testid="guest-home-active">
        <section className="guest-home-hero">
          <div className="guest-home-hero__meta">
            <p className="guest-eyebrow">Good afternoon, {session.guestName.split(' ')[0]}</p>
            <Tag tone="positive">Active stay</Tag>
          </div>
          <h1>{booking.property}</h1>
          <p>{formatStayDateRange(booking)} · {roomLabel}</p>
        </section>
        {!online ? <Notice tone="offline" icon={<WifiSlash />} title="You’re offline">Cached stay details are available. Requests will send when connected.</Notice> : null}
        <button className="guest-stay-banner" onClick={() => onNavigate('wallet')} type="button">
          <div>
            <Tag tone="positive">Identity ready</Tag>
            <h2>Stay QR</h2>
            <p>Show this identity code at the front desk. It does not authorize charges.</p>
          </div>
          <div className="guest-stay-banner__qr"><QrCode /></div>
        </button>
        <section>
          <SectionHeading title="During your stay" action="See all" onAction={() => onNavigate('marketplace')} />
          <div className="guest-action-grid">
            <ActionTile icon={<ForkKnife />} label="Room dining" onClick={() => onNavigate('hotel-service')} />
            <ActionTile icon={<Sparkle />} label="Spa" onClick={() => onNavigate('vendor-service')} />
            <ActionTile icon={<AirplaneTilt />} label="Transfer" onClick={() => onNavigate('marketplace')} />
            <ActionTile icon={<ChatCircleDots />} label="Ask front desk" onClick={() => onNavigate('chat')} />
          </div>
        </section>
        {confirmedServices[0] ? <section className="guest-home-next-service"><SectionHeading title="Next up" action="My bookings" onAction={() => onNavigate('my-bookings')} /><div className="guest-booking-card is-static"><div><Tag tone="positive">Confirmed</Tag><h2>{confirmedServices[0].title}</h2><p>{confirmedServices[0].scheduledFor} · {confirmedServices[0].amount}</p><small>Added to {roomLabel.toLowerCase()} · settles at checkout</small></div></div></section> : null}
        <section>
          <SectionHeading title="Your account" />
          <div className="guest-list-group" role="group" aria-label="Your account">
            <button className="guest-list-row" onClick={() => onNavigate('folio')} type="button"><span><Receipt /></span><div><b>Room charges</b><small>Current folio · {folioTotal}</small></div><CaretRight /></button>
            <button className="guest-list-row" onClick={() => onNavigate('my-bookings')} type="button"><span><CalendarBlank /></span><div><b>My bookings</b><small>{serviceCountLabel(confirmedServices.length)}</small></div><CaretRight /></button>
          </div>
        </section>
        <section>
          <SectionHeading title="Stay details" action="View booking" onAction={() => onNavigate('rate-detail')} />
          <div className="guest-grid-2">
            <InfoTile icon={<CalendarBlank />} label="Dates" value={formatStayDateRange(booking)} />
            <InfoTile icon={<Bed />} label="Room" value={booking.roomNumber ? `${booking.roomType} · ${booking.roomNumber}` : booking.roomType} />
          </div>
        </section>
      </div>
    );
  }

  if (variant === 'multiple-upcoming') {
    return (
      <div className="guest-stack guest-home-booking guest-home-booking--multiple" data-testid="guest-home-multiple-upcoming">
        <div className="guest-page-title"><p className="guest-eyebrow">Your trips</p><h1>Upcoming stays</h1><p>Keep every reservation in one place. Your nearest arrival is shown first.</p></div>
        <UpcomingBookingCard booking={booking} primary onNavigate={onNavigate} />
        <section>
          <SectionHeading title="More upcoming stays" />
          <div className="guest-home-booking-list">
            {upcomingBookings.filter((item) => item.id !== booking.id).map((item) => <UpcomingBookingCard key={item.id} booking={item} onNavigate={onNavigate} />)}
          </div>
        </section>
        <button className="guest-list-row" onClick={() => onNavigate('profile')} type="button"><span><Person /></span><div><b>Guest profile</b><small>{session.guestName} · saved preferences</small></div><CaretRight /></button>
      </div>
    );
  }

  if (variant === 'completed') {
    return (
      <div className="guest-stack guest-home-booking guest-home-booking--completed" data-testid="guest-home-completed">
        <div className="guest-page-title"><p className="guest-eyebrow">Welcome back, {session.guestName.split(' ')[0]}</p><h1>Your latest stay</h1><p>Reconnect another reservation whenever you’re ready.</p></div>
        <div className="guest-home-booking guest-home-booking--primary"><Tag>Completed</Tag><h2>{booking.property}</h2><p>{formatStayDateRange(booking)} · {booking.roomType}</p><small>Booking {booking.id}</small></div>
        <Notice tone="positive" icon={<CheckCircle />} title="Stay complete">Your previous room charges were settled at checkout.</Notice>
        <Button className="guest-button guest-button--primary" type="button" onClick={() => onNavigate('connect-booking')}>Connect another stay<ArrowRight aria-hidden="true" /></Button>
        <TextButton onClick={() => onNavigate('stay-history')}>View stay history</TextButton>
      </div>
    );
  }

  return (
    <div className="guest-stack guest-home-booking guest-home-booking--upcoming" data-testid="guest-home-upcoming">
      <div className="guest-page-title"><div className="guest-home-hero__meta"><p className="guest-eyebrow">Your next stay</p><Tag tone="warning">Upcoming</Tag></div><h1>{booking.property}</h1><p>{booking.city} · {formatStayDateRange(booking)}</p></div>
      <section className="guest-home-booking guest-home-booking--primary">
        <div className="guest-home-booking__heading"><div><small>Pre-arrival</small><h2>{booking.preArrivalCompleted} of {booking.preArrivalTotal} steps complete</h2></div><strong>{Math.round((booking.preArrivalCompleted / Math.max(booking.preArrivalTotal, 1)) * 100)}%</strong></div>
        <div className="guest-home-progress" role="progressbar" aria-label="Pre-arrival progress" aria-valuemin={0} aria-valuemax={booking.preArrivalTotal} aria-valuenow={booking.preArrivalCompleted}><span style={{ width: `${Math.min(100, (booking.preArrivalCompleted / Math.max(booking.preArrivalTotal, 1)) * 100)}%` }} /></div>
        <p>{booking.nextPreArrivalStep ?? 'Review your stay details before arrival.'}</p>
        <Button className="guest-button guest-button--primary" type="button" onClick={() => onNavigate(booking.preArrivalCompleted < booking.preArrivalTotal ? 'guest-details' : 'repeat-review')}>{booking.preArrivalCompleted < booking.preArrivalTotal ? 'Complete pre-arrival' : 'Review stay'}<ArrowRight aria-hidden="true" /></Button>
      </section>
      <section>
        <SectionHeading title="Stay details" action="View booking" onAction={() => onNavigate('rate-detail')} />
        <div className="guest-grid-2">
          <InfoTile icon={<CalendarBlank />} label="Dates" value={formatStayDateRange(booking)} />
          <InfoTile icon={<Bed />} label="Room" value={booking.roomNumber ? `${booking.roomType} · ${booking.roomNumber}` : `${booking.roomType} · Assigned at arrival`} />
        </div>
      </section>
      <Notice title="Stay QR at arrival">Your identity QR appears when the property activates your room. Until then, keep this booking confirmation nearby.</Notice>
      <button className="guest-list-row" onClick={() => onNavigate('profile')} type="button"><span><Person /></span><div><b>Guest profile</b><small>{session.guestName} · saved preferences</small></div><CaretRight /></button>
    </div>
  );
}

function UpcomingBookingCard({ booking, primary = false, onNavigate }: { booking: Booking; primary?: boolean; onNavigate: (screen: ActiveScreen) => void }) {
  return <div className={`guest-home-booking ${primary ? 'guest-home-booking--primary' : ''}`}><div className="guest-home-booking__status"><Tag tone={primary ? 'positive' : 'neutral'}>{primary ? 'Next arrival' : 'Upcoming'}</Tag><small>{booking.city}</small></div><h2>{booking.property}</h2><p>{formatStayDateRange(booking)} · {booking.roomType}</p><small>{booking.preArrivalCompleted} of {booking.preArrivalTotal} pre-arrival steps complete</small><Button className="guest-button guest-button--secondary" type="button" onClick={() => onNavigate('rate-detail')}>View booking<ArrowRight aria-hidden="true" /></Button></div>;
}

function EmptyStayHome({ onNavigate }: { onNavigate: (screen: ActiveScreen) => void }) {
  return <div className="guest-stack guest-stack--intro guest-home-empty" data-testid="guest-home-empty"><HeroIcon tone="dark"><Receipt size={30} /></HeroIcon><div className="guest-page-title"><p className="guest-eyebrow">No connected stay</p><h1>Connect your booking</h1><p>Link a confirmed reservation to see arrival details, on-property services, room charges, and front-desk help in one place.</p></div><Button className="guest-button guest-button--primary" type="button" onClick={() => onNavigate('connect-booking')}>Connect a booking<ArrowRight aria-hidden="true" /></Button><TextButton onClick={() => onNavigate('front-desk-assist')}>Ask the front desk for help</TextButton></div>;
}

function formatStayDateRange(booking: Booking) {
  const checkIn = new Date(`${booking.checkIn}T12:00:00`);
  const checkOut = new Date(`${booking.checkOut}T12:00:00`);
  const formatter = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' });
  const start = formatter.format(checkIn);
  const end = formatter.format(checkOut);
  return `${start}–${end}, ${booking.checkIn.slice(0, 4)}`;
}

function serviceCountLabel(count: number) {
  return count === 0 ? 'No upcoming services' : `${count} upcoming service${count === 1 ? '' : 's'}`;
}

function ScreenIntro({ icon, eyebrow, title, text, children }: { icon?: ReactNode; eyebrow: string; title: string; text: string; children: ReactNode }) {
  return <div className="guest-stack guest-stack--intro">{icon ? <HeroIcon>{icon}</HeroIcon> : null}<div className="guest-page-title"><p className="guest-eyebrow">{eyebrow}</p><h1>{title}</h1><p>{text}</p></div>{children}</div>;
}

function FormScreen({ step, title, text, children }: { step: string; title: string; text: string; children: ReactNode }) {
  return <div className="guest-stack"><div className="guest-step"><span>{step}</span><i><b /></i></div><div className="guest-page-title"><h1>{title}</h1><p>{text}</p></div><div className="guest-form">{children}</div></div>;
}

function TextButton({ children, onClick, disabled }: { children: ReactNode; onClick: () => void; disabled?: boolean }) {
  return <Button className="guest-text-button" variant="ghost" type="button" onClick={onClick} disabled={disabled}>{children}</Button>;
}

function StayCard({ booking }: { booking: Booking }) {
  const checkIn = new Date(`${booking.checkIn}T12:00:00`).toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
  const checkOut = new Date(`${booking.checkOut}T12:00:00`).toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
  return <div className="guest-stay-card"><div className="guest-stay-card__art"><House size={28} /></div><div><Tag>Confirmed</Tag><h2>{booking.property}</h2><p>{booking.roomType} · {checkIn}–{checkOut}, {booking.checkIn.slice(0, 4)}</p><small>Booking {booking.id}</small></div></div>;
}

function StayMiniCard({ booking, status }: { booking: Booking; status: string }) {
  return <div className="guest-mini-stay"><span><House /></span><div><b>{booking.property}</b><small>{status}</small></div><CheckCircle /></div>;
}

function CheckOption({ label }: { label: string }) {
  return <label className="guest-check"><input type="checkbox" /><span>{label}</span></label>;
}

function ReviewBlock({ icon, title, lines }: { icon: ReactNode; title: string; lines: string[] }) {
  return <div className="guest-review-block"><span>{icon}</span><div><b>{title}</b>{lines.map((line) => <small key={line}>{line}</small>)}</div><button aria-label={`Edit ${title}`}><CaretRight /></button></div>;
}

function TimelineItem({ title, text, done }: { title: string; text: string; done?: boolean }) {
  return <div className={`guest-timeline__item ${done ? 'is-done' : ''}`}><span>{done ? <Check /> : null}</span><div><b>{title}</b><small>{text}</small></div></div>;
}

function SectionHeading({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return <div className="guest-section-heading"><h2>{title}</h2>{action ? <button onClick={onAction}>{action}<CaretRight /></button> : null}</div>;
}

function InfoTile({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return <div className="guest-info-tile"><span>{icon}</span><small>{label}</small><b>{value}</b></div>;
}

function ActionTile({ icon, label, onClick }: { icon: ReactNode; label: string; onClick: () => void }) {
  return <button className="guest-action-tile" onClick={onClick}><span>{icon}</span><b>{label}</b><CaretRight /></button>;
}

function ServiceDetail({ kind, booking, online, onBook, onChat }: { kind: 'hotel' | 'vendor'; booking: Booking; online: boolean; onBook: () => void; onChat: () => void }) {
  const vendor = kind === 'vendor';
  const roomLabel = booking.roomNumber ? `room ${booking.roomNumber}` : 'your assigned room';
  return <div className="guest-stack guest-service-detail"><ServiceImage imageKey={vendor ? 'spa' : 'dining'} tone={vendor ? 'sage' : 'sand'} icon={vendor ? <Sparkle size={38} /> : <ForkKnife size={38} />} decorative /><div className="guest-page-title"><div className="guest-tag-row"><Tag>{vendor ? 'Third-party · on property' : 'Hotel operated'}</Tag><Tag>{vendor ? '24-hour cutoff' : '2-hour cutoff'}</Tag></div><h1>{vendor ? 'Hilom signature massage' : 'In-room dining'}</h1><p>{vendor ? 'A 90-minute traditional Filipino therapeutic massage, delivered in the on-property spa.' : `Comforting Filipino favorites and all-day classics delivered to ${roomLabel}.`}</p></div><div className="guest-summary"><SummaryRow label="Price" value={vendor ? '₱2,400' : 'From ₱450'} /><SummaryRow label="Availability" value={online ? 'Today · 3 times' : 'Connect to check'} /><SummaryRow label="Property" value={booking.property} /><SummaryRow label="Room" value={booking.roomNumber ? `Room ${booking.roomNumber}` : 'Assigned at arrival'} /><SummaryRow label="Settlement" value="Charge at checkout" /><SummaryRow label="Cancellation" value={vendor ? 'Up to 24 hours before' : 'Up to 2 hours before'} /></div>{!online ? <Notice tone="offline" icon={<WifiSlash />} title="Live booking is unavailable">Capacity and price are never queued. Connect to see current times.</Notice> : null}<button className="guest-button guest-button--primary" onClick={onBook}>{online ? (vendor ? 'Choose a time' : 'View menu and order') : 'See connection options'}<ArrowRight /></button>{!online ? <TextButton onClick={onChat}>Message the front desk instead</TextButton> : null}{vendor ? <div className="guest-provisional"><b>Provisional decision</b><p>Confirm that third-party providers accept a 24-hour self-service cancellation window.</p></div> : null}</div>;
}

function FolioItem({ date, title, meta, amount }: { date: string; title: string; meta: string; amount: string }) {
  return <div className="guest-folio-item"><span>{date}</span><div><b>{title}</b><small>{meta}</small></div><strong>{amount}</strong></div>;
}

function HistoryItem({ property, dates, room }: { property: string; dates: string; room: string }) {
  return <div className="guest-history-item"><span><House /></span><div><b>{property}</b><p>{dates}</p><small>{room}</small></div></div>;
}

function NavButton({ label, icon, active, onClick }: { label: string; icon: ReactNode; active: boolean; onClick: () => void }) {
  return <button aria-current={active ? 'page' : undefined} onClick={onClick}><span>{icon}</span><small>{label}</small></button>;
}
