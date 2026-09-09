'use client';

import {
  AirplaneTilt,
  ArrowLeft,
  ArrowRight,
  Bed,
  CalendarBlank,
  CaretRight,
  ChatCircleDots,
  Check,
  CheckCircle,
  EnvelopeSimple,
  Eye,
  EyeSlash,
  ForkKnife,
  House,
  IdentificationCard,
  MapPin,
  Minus,
  Person,
  Plus,
  QrCode,
  Receipt,
  SignOut,
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
import { CabanaLockup, CabanaFullLockup } from '@/components/ui/cabana-logo';
import { Button, Input } from '@/components/ui';
import {
  ANONYMOUS_SESSION,
  connectBooking,
  createAccountWithPassword,
  formatPesoAmount,
  getHomeVariant,
  getPostAuthScreen,
  getPrimaryBooking,
  getVenueCartSummary,
  MINI_APP_CATEGORIES,
  MOCK_SESSION,
  RESTAURANTS,
  SERVICES,
  signInWithPassword,
  signOutSession,
  verifyPendingSession,
  parsePesoAmount,
  type Booking,
  type GuestSession,
  type DiningFulfillment,
  type MenuItemCategory,
  type MiniAppCategoryId,
  type ServiceBooking,
  type ScreenId,
} from './prototype-model';
import {
  getServiceImage,
  getPropertyImage,
  getCategoryCoverImage,
  type ServiceImageKey,
} from './service-images';
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

function PasswordField({
  label,
  name,
  placeholder = '••••••••',
  helper,
  required,
}: {
  label: string;
  name: string;
  placeholder?: string;
  helper?: string;
  required?: boolean;
}) {
  const [showPassword, setShowPassword] = useState(false);
  const helperId = helper ? `${name}-helper` : undefined;
  return (
    <label className="guest-field" htmlFor={name}>
      <span>{label}{required ? ' *' : ''}</span>
      <div className="guest-password-wrapper">
        <Input
          id={name}
          name={name}
          type={showPassword ? 'text' : 'password'}
          placeholder={placeholder}
          aria-describedby={helperId}
          required={required}
          minLength={8}
          autoComplete={name.includes('create') || name.includes('account') ? 'new-password' : 'current-password'}
        />
        <button
          type="button"
          className="guest-password-toggle"
          onClick={() => setShowPassword((prev) => !prev)}
          aria-label={showPassword ? 'Hide password' : 'Show password'}
        >
          {showPassword ? <EyeSlash size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
        </button>
      </div>
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

function PropertyImage({
  property,
  aspectRatio = '16/9',
  className = '',
  decorative = false,
}: {
  property?: string;
  aspectRatio?: string;
  className?: string;
  decorative?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const image = getPropertyImage(property);

  return (
    <div className={`guest-property-image ${failed ? 'is-error' : ''} ${className}`} style={{ aspectRatio }}>
      <div className="guest-property-image__fallback" aria-hidden="true">
        <House size={30} />
      </div>
      <Image
        src={image.src}
        alt={decorative ? '' : image.alt}
        fill
        sizes="(max-width: 720px) calc(100vw - 32px), 480px"
        style={{ objectPosition: image.focalPoint }}
        onError={() => setFailed(true)}
      />
    </div>
  );
}

function CategoryCoverImage({
  categoryId,
  aspectRatio = '16/10',
  className = '',
}: {
  categoryId: string;
  aspectRatio?: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const image = getCategoryCoverImage(categoryId);

  return (
    <div className={`guest-category-image ${failed ? 'is-error' : ''} ${className}`} style={{ aspectRatio }}>
      <div className="guest-property-image__fallback" aria-hidden="true">
        {categoryId === 'dining' ? <ForkKnife size={22} /> : categoryId === 'spa' ? <Sparkle size={22} /> : categoryId === 'entertainment' ? <AirplaneTilt size={22} /> : <Storefront size={22} />}
      </div>
      <Image
        src={image.src}
        alt=""
        fill
        sizes="(max-width: 720px) 50vw, 240px"
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
 * The three things a booking unlocks, drawn as the screen's hero instead of
 * listed as text. Each card is a fragment of the screen its feature leads to,
 * so the graphic previews the app rather than decorating it -- which is also
 * why the glyphs stay bare: a tinted disc here would read as an action.
 */
const WELCOME_PROOF = [
  {
    step: '01',
    stage: 'Before you arrive',
    title: 'Check in before arrival',
    icon: <CalendarBlank />,
    label: 'Online check-in',
    value: 'Complete',
    settled: true,
  },
  {
    step: '02',
    stage: 'At the hotel',
    title: 'Skip the front desk paperwork',
    icon: <IdentificationCard />,
    label: 'Government ID',
    value: 'Verified',
    settled: true,
  },
  {
    step: '03',
    stage: 'During your stay',
    title: 'View charges and hotel services',
    icon: <Receipt />,
    label: 'Folio total',
    value: '₱3,050',
    settled: false,
  },
];

function WelcomeProof() {
  return (
    <ul className="guest-welcome__proof" aria-label="Available after you connect your booking">
      {WELCOME_PROOF.map((feature) => (
        <li key={feature.step} className="guest-welcome__proof-card">
          <div className="guest-welcome__proof-head">
            <span aria-hidden="true">{feature.icon}</span>
            <div>
              <p className="guest-welcome__proof-stage"><span aria-hidden="true">{feature.step}</span>{feature.stage}</p>
              <b>{feature.title}</b>
            </div>
          </div>
          <p className="guest-welcome__proof-row" aria-hidden="true">
            <span>{feature.label}</span>
            <span data-settled={feature.settled}>
              {feature.settled ? <Check aria-hidden="true" /> : null}
              {feature.value}
            </span>
          </p>
        </li>
      ))}
    </ul>
  );
}

function WelcomeScreen({ onFindBooking }: { onFindBooking: () => void }) {
  return (
    <section className="guest-welcome" aria-labelledby="guest-welcome-title">
      <div className="guest-welcome__splash" aria-hidden="true">
        <CabanaFullLockup className="guest-welcome__splash-brand" markWidth={92} />
      </div>
      <div className="guest-welcome__content">
        <CabanaFullLockup className="guest-welcome__brand" markWidth={44} />
        <WelcomeProof />
        <div className="guest-welcome__message">
          <h1 id="guest-welcome-title">Welcome to your stay</h1>
          <p>Find your booking to check in and access everything you need during your stay.</p>
          <Button
            className="guest-button guest-button--primary guest-welcome__action"
            type="button"
            onClick={onFindBooking}
          >
            Find my booking<ArrowRight aria-hidden="true" />
          </Button>
        </div>
      </div>
    </section>
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
  const [selectedCategory, setSelectedCategory] = useState<MiniAppCategoryId>('dining');
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<string>('apartment-1b');
  const [selectedMenuTab, setSelectedMenuTab] = useState<MenuItemCategory>('all');
  const [restaurantCarts, setRestaurantCarts] = useState<Record<string, Record<string, number>>>({});
  const [diningMethod, setDiningMethod] = useState<'delivery' | 'pickup'>('delivery');
  const [diningTiming, setDiningTiming] = useState<'asap' | 'scheduled'>('asap');
  const [diningTime, setDiningTime] = useState('7:00 PM');
  const [diningOrderError, setDiningOrderError] = useState<string | null>(null);

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

  const showNav = ['stay-overview', 'marketplace', 'category-listing', 'hotel-service', 'vendor-service', 'restaurant-menu', 'restaurant-cart', 'dining-order-confirmation', 'service-booking', 'booking-confirmation', 'booking-blocked', 'my-bookings', 'cancel-before-cutoff', 'cancel-after-cutoff', 'folio', 'chat', 'chat-after-hours', 'room-qr-midstay', 'profile', 'stay-history'].includes(activeScreen);
  const showPrimaryNav = showNav && (session.auth === 'authenticated' || session.bookings.length > 0);
  const isWelcome = activeScreen === 'entry-hub';
  const primaryBooking = getPrimaryBooking(session.bookings, session.activeBookingId);
  const displayBooking = primaryBooking ?? MOCK_SESSION.bookings[0]!;
  const contextBooking = primaryBooking ?? displayBooking;
  const contextRoom = contextBooking.roomNumber ? `Room ${contextBooking.roomNumber}` : 'Room assigned at arrival';
  const contextService = session.serviceBookings.find(
    (service) => service.id === 'service-hilom-1' && service.bookingId === contextBooking.id,
  );

  const changeCartQuantity = (venueId: string, itemId: string, delta: number) => {
    setRestaurantCarts((carts) => {
      const venueCart = carts[venueId] ?? {};
      const quantity = Math.max(0, (venueCart[itemId] ?? 0) + delta);
      return { ...carts, [venueId]: { ...venueCart, [itemId]: quantity } };
    });
  };

  const confirmDiningOrder = () => {
    const booking = getPrimaryBooking(session.bookings, session.activeBookingId);
    const venue = RESTAURANTS.find((restaurant) => restaurant.id === selectedRestaurantId) ?? RESTAURANTS[0];
    const cartSummary = getVenueCartSummary(venue.menu, restaurantCarts[venue.id] ?? {});

    if (!online) {
      setDiningOrderError('Connect to place this order');
      return;
    }
    if (!booking || booking.status !== 'active') {
      setDiningOrderError('An active stay is required to place this order');
      return;
    }
    if (diningMethod === 'delivery' && !booking.roomNumber) {
      setDiningOrderError('Room delivery is available after your room is assigned.');
      return;
    }
    if (cartSummary.itemCount === 0) {
      setDiningOrderError('Add at least one item before placing your order');
      return;
    }

    const scheduledFor = diningMethod === 'delivery'
      ? diningTiming === 'asap'
        ? `Deliver to Room ${booking.roomNumber} · As soon as possible`
        : `Deliver to Room ${booking.roomNumber} · Today, ${diningTime}`
      : `Pick up at ${venue.name} · Today, ${diningTime}`;
    const fulfillment: DiningFulfillment = diningMethod === 'delivery'
      ? { method: 'delivery', timing: diningTiming, scheduledFor }
      : { method: 'pickup', timing: 'scheduled', scheduledFor };
    const orderBooking: ServiceBooking = {
      id: `dining-order-${venue.id}-${session.serviceBookings.length + 1}`,
      bookingId: booking.id,
      title: venue.name,
      scheduledFor,
      amount: cartSummary.formattedTotal,
      status: 'confirmed',
      diningOrder: {
        venueId: venue.id,
        venueName: venue.name,
        items: cartSummary.items,
        fulfillment,
      },
    };
    const newFolioTotal = formatPesoAmount(parsePesoAmount(session.folioTotal) + cartSummary.total);

    setSession((current) => ({
      ...current,
      serviceBookings: [orderBooking, ...current.serviceBookings],
      folioTotal: newFolioTotal,
    }));
    setRestaurantCarts((carts) => ({ ...carts, [venue.id]: {} }));
    setDiningOrderError(null);
    go('dining-order-confirmation');
  };

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

  const linkRoomStay = (lastName?: string) => {
    const next = withActiveRoom(session);
    setSession({
      ...next,
      guestName: next.guestName || lastName || 'Guest',
    });
    go('stay-overview');
  };

  const completePreArrival = () => {
    const next: GuestSession = {
      ...session,
      bookings: session.bookings.map((booking) =>
        booking.id === contextBooking.id
          ? {
              ...booking,
              preArrivalCompleted: booking.preArrivalTotal,
            }
          : booking,
      ),
    };

    setSession(next);
    go(online ? 'stay-overview' : 'prereg-queued');
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
        return <WelcomeScreen onFindBooking={() => go('connect-booking')} />;

      case 'sign-in':
        return (
          <div className="guest-stack guest-stack--intro">
            <div className="guest-auth-header">
              <CabanaFullLockup markWidth={48} tagline="Your Home Away From Home" />
            </div>
            <div className="guest-page-title">
              <p className="guest-eyebrow">Welcome back</p>
              <h1>Log in</h1>
              <p>Enter your account email and password to continue.</p>
            </div>
            {!online ? <Notice tone="offline" icon={<WifiSlash />} title="Logging in needs a connection">A connection is required to sign in.</Notice> : null}
            <form className="guest-form" onSubmit={(event: FormEvent<HTMLFormElement>) => {
              event.preventDefault();
              const data = new FormData(event.currentTarget);
              const email = String(data.get('sign-in-email') ?? '').trim();
              completeAuth(signInWithPassword(email));
            }}>
              <Field label="Email" name="sign-in-email" type="email" placeholder="you@example.com" required />
              <PasswordField label="Password" name="sign-in-password" placeholder="Enter your password" required />
              <div className="guest-auth-actions">
                <Button className="guest-button guest-button--primary" type="submit" disabled={!online}>
                  Log in<ArrowRight aria-hidden="true" />
                </Button>
              </div>
            </form>
            <TextButton onClick={() => go('create-account')}>Don&apos;t have an account? Create an account</TextButton>
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
          <ScreenIntro
            eyebrow="Connect your stay"
            title="Find your booking"
            text="Choose the way you arrived here. You can use your booking details, a room QR, or the hotel Wi-Fi connection."
          >
            <BookingEntryOptions onNavigate={go} />
            <Notice title="A booking is required">Cabana starts after a confirmed hotel booking. It does not search or compare hotels.</Notice>
          </ScreenIntro>
        );

      case 'room-qr-landing':
        return <ScreenIntro icon={<QrCode size={30} />} eyebrow="Room QR detected" title="Let’s link this room to you" text="This permanent room code opens the guest app. Your last name confirms which live booking is yours."><StayMiniCard booking={contextBooking} status={`Room ${contextBooking.roomNumber ?? '304'} detected`} /><form className="guest-form" onSubmit={(event) => { event.preventDefault(); const data = new FormData(event.currentTarget); linkRoomStay(String(data.get('qr-last-name') ?? '').trim()); }}><Field label="Last name" name="qr-last-name" placeholder="Santos" required /><Button className="guest-button guest-button--primary" type="submit">Link my stay<ArrowRight aria-hidden="true" /></Button></form><TextButton onClick={() => go('front-desk-assist')}>I need help</TextButton></ScreenIntro>;

      case 'wifi-landing':
        return <ScreenIntro icon={<WifiHigh size={30} />} eyebrow="Connected to hotel Wi-Fi" title="Welcome to The Henry Manila" text="You’re online through the hotel network. Find your booking to continue."><Notice title="Hotel-local connection" icon={<WifiHigh />}>Your itinerary and stay details remain available if this connection drops.</Notice>{primary('Find my booking', 'identify')}</ScreenIntro>;

      case 'identify':
        return <ScreenIntro eyebrow="Connect your stay" title="Find your booking" text="Use the details from your confirmation email. OTA references from Agoda and Booking.com work too."><form className="guest-form" onSubmit={(event) => { event.preventDefault(); go('booking-found'); }}><Field label="Booking or confirmation number" name="booking-number" placeholder="Any format" helper="We’ll match hotel and OTA references." required /><Field label="Last name" name="last-name" placeholder="As shown on the booking" required /><Button className="guest-button guest-button--primary" type="submit">Find booking<ArrowRight /></Button></form><TextButton onClick={() => go('lookup-fallback')}>I can’t find my booking</TextButton></ScreenIntro>;

      case 'lookup-fallback':
        return <ScreenIntro eyebrow="We couldn’t match that number" title="Try another way" text="Legacy hotel systems can use a different reference. These stay details give us another way to look."><Notice tone="warning" title="No match yet">Your booking is not lost. We won’t ask you to reformat the reference.</Notice><div className="guest-form"><Field label="Last name" name="fallback-name" defaultValue="Santos" /><Field label="Check-in date" name="fallback-date" type="date" defaultValue="2026-11-09" /><SelectField label="Property" name="property" defaultValue="manila"><option value="manila">The Henry Manila</option><option value="cebu">The Henry Cebu</option><option value="dumaguete">The Henry Dumaguete</option></SelectField>{primary('Search again', 'front-desk-assist')}</div></ScreenIntro>;

      case 'front-desk-assist':
        return <ScreenIntro icon={<ChatCircleDots size={30} />} eyebrow="Human fallback" title="The front desk can connect you" text="Ask the front desk to send a secure link or give you a short code. You don’t need to understand the hotel’s booking system."><div className="guest-contact-card"><div><small>The Henry Manila</small><b>+63 2 8807 8888</b><span>Front desk · 6:00 AM–10:00 PM</span></div><button aria-label="Call the front desk" className="guest-icon-button"><ChatCircleDots /></button></div><Field label="Code from the front desk" name="staff-code" placeholder="6-digit code" />{primary('Connect my stay', 'booking-found')}<TextButton onClick={() => go('no-booking')}>I don’t have a booking</TextButton></ScreenIntro>;

      case 'no-booking':
        return <ScreenIntro icon={<Receipt size={30} />} eyebrow="No stay attached" title="You need a confirmed booking" text="Cabana starts after a hotel booking. The app does not search or compare hotels."><Notice title="Already booked?">Try your OTA reference or ask the property to send you a secure link.</Notice>{primary('Try again', 'identify')}<TextButton onClick={() => go('front-desk-assist')}>Contact the front desk</TextButton></ScreenIntro>;

      case 'booking-found':
        return <ScreenIntro eyebrow="Match found" title="Is this your stay?" text="Confirm the details before continuing to pre-arrival check-in."><StayCard booking={displayBooking} /><div className="guest-summary"><SummaryRow label="Guest" value={session.guestName || MOCK_SESSION.guestName} /><SummaryRow label="Guests" value={`${displayBooking.guestCount} guests`} /><SummaryRow label="Source" value={displayBooking.source} /></div><Button className="guest-button guest-button--primary" type="button" onClick={claimBooking}>Yes, this is my stay<ArrowRight aria-hidden="true" /></Button><TextButton onClick={() => go('identify')}>This isn’t my booking</TextButton></ScreenIntro>;

      case 'create-account':
        return (
          <div className="guest-stack guest-stack--intro">
            <div className="guest-auth-header">
              <CabanaFullLockup markWidth={48} tagline="Your Home Away From Home" />
            </div>
            <div className="guest-page-title">
              <p className="guest-eyebrow">One account, 13 properties</p>
              <h1>Create your account</h1>
              <p>{pendingIntent === 'none' ? 'Set up your email and password to access your stay and room services.' : 'Your stay is matched. Create an account with your email and password to hold it.'}</p>
            </div>
            {!online ? <Notice tone="offline" icon={<WifiSlash />} title="Creating an account needs a connection">A connection is required to create an account.</Notice> : null}
            <form className="guest-form" onSubmit={(event: FormEvent<HTMLFormElement>) => {
              event.preventDefault();
              const data = new FormData(event.currentTarget);
              const name = String(data.get('account-name') ?? '').trim();
              const email = String(data.get('account-email') ?? '').trim();
              completeAuth(createAccountWithPassword(name, email));
            }}>
              <Field label="Full name" name="account-name" placeholder="As shown on your ID" required />
              <Field label="Email" name="account-email" type="email" placeholder="you@example.com" required />
              <PasswordField label="Password" name="account-password" placeholder="Create a password" helper="At least 8 characters" required />
              <div className="guest-auth-actions">
                <Button className="guest-button guest-button--primary" type="submit" disabled={!online}>
                  Create account<ArrowRight aria-hidden="true" />
                </Button>
              </div>
            </form>
            <TextButton onClick={() => go('sign-in')}>Already have an account? Log in</TextButton>
          </div>
        );

      case 'welcome-back':
        return <ScreenIntro icon={<CheckCircle size={30} />} eyebrow="Returning guest recognized" title={`Welcome back, ${session.guestName.split(' ')[0]}`} text="Your saved identity is ready for this stay at a new property."><StayCard booking={displayBooking} /><Notice tone="positive" icon={<Sparkle />} title="No typing needed">Review what we already have, then confirm your stay.</Notice>{primary('Review saved details', 'repeat-review')}</ScreenIntro>;

      case 'stay-overview':
        return <StayOverviewHome session={session} booking={primaryBooking} online={online} onNavigate={go} onSelectCategory={(cat) => setSelectedCategory(cat)} />;

      case 'guest-details':
        return <FormScreen step="1 of 5" title="Your details" text="These details are sent securely to the property for registration."><Field label="Full name" name="guest-name" defaultValue="Ana Santos" required /><Field label="Nationality" name="nationality" defaultValue="Filipino" /><Field label="Email" name="guest-email" type="email" defaultValue="ana@example.com" /><Field label="Mobile" name="guest-mobile" type="tel" defaultValue="+63 917 555 0142" />{primary('Continue to ID', 'id-capture')}</FormScreen>;

      case 'id-capture':
        return <FormScreen step="2 of 5" title="ID or passport" text="International guests need passport details."><button className="guest-upload" type="button"><IdentificationCard size={28} /><b>Capture or upload ID</b><small>Passport, national ID, or driver’s license</small></button><Field label="Document number" name="document-number" placeholder="Enter document number" /><Field label="Expiry date" name="expiry" type="date" />{primary('Save and continue', 'room-preferences')}</FormScreen>;

      case 'room-preferences': {
        const isProfileEdit = history.includes('profile');
        return (
          <div className="guest-stack">
            {isProfileEdit ? (
              <div className="guest-page-title">
                <p className="guest-eyebrow">Profile preferences</p>
                <h1>Room preferences</h1>
                <p>We’ll save these above the property level and pre-fill them on future stays.</p>
              </div>
            ) : (
              <>
                <div className="guest-step">
                  <span>3 of 5</span>
                  <i><b /></i>
                </div>
                <div className="guest-page-title">
                  <h1>Room preferences</h1>
                  <p>Choose your floor, bed, and accessibility needs. We’ll pre-fill these for future stays across The Henry.</p>
                </div>
              </>
            )}
            <form
              className="guest-form"
              onSubmit={(e: FormEvent<HTMLFormElement>) => {
                e.preventDefault();
                const data = new FormData(e.currentTarget);
                const floor = String(data.get('floor') ?? 'Higher floor');
                const bed = String(data.get('bed') ?? 'King bed');
                const accessibility: string[] = [];
                if (data.get('step-free')) accessibility.push('Step-free room access');
                if (data.get('grab-rails')) accessibility.push('Bathroom grab rails');
                if (data.get('door-alert')) accessibility.push('Visual door alert');
                setSession((cur) => ({
                  ...cur,
                  roomPreferences: { floor, bed, accessibility },
                }));
                go(isProfileEdit ? 'profile' : 'additional-guests');
              }}
            >
              <SelectField label="Preferred floor" name="floor" defaultValue={session.roomPreferences.floor}>
                <option value="Higher floor">Higher floor</option>
                <option value="Lower floor">Lower floor</option>
                <option value="Ground floor">Ground floor</option>
                <option value="No preference">No preference</option>
              </SelectField>
              <SelectField label="Bed type" name="bed" defaultValue={session.roomPreferences.bed}>
                <option value="King bed">King bed</option>
                <option value="Twin beds">Twin beds</option>
                <option value="Queen bed">Queen bed</option>
              </SelectField>
              <fieldset className="guest-fieldset">
                <legend>Accessibility needs</legend>
                <CheckOption label="Step-free room access" name="step-free" defaultChecked={session.roomPreferences.accessibility.includes('Step-free room access')} />
                <CheckOption label="Bathroom grab rails" name="grab-rails" defaultChecked={session.roomPreferences.accessibility.includes('Bathroom grab rails')} />
                <CheckOption label="Visual door alert" name="door-alert" defaultChecked={session.roomPreferences.accessibility.includes('Visual door alert')} />
              </fieldset>
              <Button className="guest-button guest-button--primary" type="submit">
                {isProfileEdit ? 'Save preferences' : 'Save and continue'}
                <ArrowRight aria-hidden="true" />
              </Button>
              {isProfileEdit ? (
                <TextButton onClick={() => go('profile')}>Back to profile</TextButton>
              ) : (
                <TextButton onClick={() => go('additional-guests')}>Skip for now</TextButton>
              )}
            </form>
          </div>
        );
      }

      case 'additional-guests':
        return <FormScreen step="4 of 5" title="Who else is staying?" text="Add names only. Additional guests do not need accounts."><Field label="Additional guest 1" name="guest-2" defaultValue="Marco Santos" /><button type="button" className="guest-button guest-button--secondary">Add another guest</button><Notice title="One booking, one account">You stay in control of the booking. The people staying with you do not need their own accounts.</Notice>{primary('Continue', 'early-check-in')}</FormScreen>;

      case 'repeat-review':
        return (
          <ScreenIntro
            eyebrow="Saved from your Cebu stay"
            title="Review, then confirm"
            text="Everything is pre-filled. Change only what’s different this time."
          >
            <div className="guest-review-card">
              <ReviewBlock
                icon={<Person />}
                title="Ana Santos"
                lines={['Filipino · Passport on file', 'ana@example.com · +63 917 555 0142']}
              />
              <ReviewBlock
                icon={<Bed />}
                title="Room preferences"
                lines={[
                  `${session.roomPreferences.floor} · ${session.roomPreferences.bed}`,
                  session.roomPreferences.accessibility.length > 0
                    ? `Accessibility: ${session.roomPreferences.accessibility.join(', ')}`
                    : 'Standard room access',
                ]}
              />
              <ReviewBlock
                icon={<Users />}
                title="Additional guest"
                lines={['Marco Santos']}
              />
            </div>
            <Button
              className="guest-button guest-button--primary"
              type="button"
              onClick={completePreArrival}
            >
              Confirm everything<ArrowRight aria-hidden="true" />
            </Button>
            <TextButton onClick={() => go('guest-details')}>Edit details</TextButton>
          </ScreenIntro>
        );

      case 'rate-detail':
        return <ScreenIntro eyebrow={`Booking ${displayBooking.id}`} title="Room and rate" text="The latest details returned by the hotel system."><StayCard booking={displayBooking} /><div className="guest-summary"><SummaryRow label={`${displayBooking.checkOut} · ${displayBooking.roomType}`} value="₱18,000" /><SummaryRow label="Taxes and fees" value="₱2,160" /><SummaryRow label="Booking total" value="₱20,160" strong /><SummaryRow label={`Paid through ${displayBooking.source}`} value="₱20,160" /></div><Notice title="Live hotel data">Availability, rates, and payment details require a connection.</Notice></ScreenIntro>;

      case 'early-check-in':
        return (
          <ScreenIntro
            eyebrow="Step 5 of 5 · Arrival"
            title="Check in earlier"
            text="Standard check-in is 3:00 PM. Request a room from 11:00 AM and settle the added charge with the hotel at checkout."
          >
            <div className="guest-price-card">
              <div>
                <small>Early check-in</small>
                <b>11:00 AM</b>
              </div>
              <strong>₱1,500</strong>
            </div>
            <Notice title="Charged to your room folio">
              The hotel confirms availability first. If approved, the ₱1,500 charge is added to your room and settled at checkout.
            </Notice>
            <Button
              className="guest-button guest-button--primary"
              type="button"
              onClick={completePreArrival}
            >
              Request early check-in<ArrowRight aria-hidden="true" />
            </Button>
            <TextButton onClick={completePreArrival}>Keep standard 3:00 PM</TextButton>
          </ScreenIntro>
        );

      case 'insurance-offer':
        return <ScreenIntro eyebrow="Pre-arrival" title="You’re ready for arrival" text="Continue to the hotel handoff. Your room and on-property charges are settled with the hotel at checkout.">{primary('Continue to arrival', 'prereg-complete')}</ScreenIntro>;

      case 'prereg-complete': {
        const arrived = contextBooking.status === 'active';
        return <ScreenIntro icon={<Check size={30} />} eyebrow="Pre-registered" title="You’re ready for arrival" text={arrived ? 'Stop by the front desk. A team member will verify your identity and complete check-in.' : 'Your pre-arrival details are saved. Review your stay before you arrive.'}><div className="guest-timeline"><TimelineItem title="Before arrival" text="Details received by the hotel" done /><TimelineItem title="At the front desk" text="Present your original ID" /><TimelineItem title="After verification" text={`${contextRoom} becomes active in the app`} /></div>{primary('View my stay', 'stay-overview')}<TextButton onClick={() => go('stay-overview')}>View stay overview</TextButton></ScreenIntro>;
      }

      case 'prereg-queued':
        return <ScreenIntro icon={<WifiSlash size={30} />} eyebrow="Saved on this device" title="Ready to send when connected" text="Your pre-registration is safely queued. It will send automatically when a connection returns."><Notice tone="offline" title="No action needed">Your edits remain on this device. The hotel has not received them yet.</Notice>{primary('Open cached stay', 'stay-overview')}</ScreenIntro>;

      case 'marketplace': {
        const stayServices = session.serviceBookings.filter((service) => service.bookingId === contextBooking.id);
        const upcomingServices = stayServices.filter((service) => service.status === 'confirmed');
        const pastServices = stayServices.filter((service) => service.status !== 'confirmed');
        return (
          <div className="guest-stack guest-bookings-hub">
            <div className="guest-page-title">
              <p className="guest-eyebrow">{contextBooking.property} · {contextRoom}</p>
              <h1>Bookings Hub</h1>
              <p>Manage your on-property bookings, scheduled dining, and activities.</p>
            </div>
            {!online ? <Notice tone="offline" icon={<WifiSlash />} title="Browsing saved services">Live availability and booking require a connection.</Notice> : null}
            <div className="guest-featured-service">
              <ServiceImage imageKey="spa" tone="sage" icon={<Sparkle size={32} />} />
              <div>
                <Tag>Third-party · on property</Tag>
                <h2>Hilom signature massage</h2>
                <p>Traditional Filipino therapeutic massage.</p>
                <button onClick={() => go('vendor-service')}>View service<ArrowRight /></button>
              </div>
            </div>

            {upcomingServices.length ? (
              <section>
                <SectionHeading title="Upcoming & Confirmed" />
                <div className="guest-stack" style={{ gap: '10px' }}>
                  {upcomingServices.map((service) => (
                    <button key={service.id} className="guest-booking-card" onClick={() => go('cancel-before-cutoff')} type="button">
                      <div>
                        <Tag tone="positive">Confirmed</Tag>
                        <h2>{service.title}</h2>
                        <p>{service.scheduledFor} · {service.amount}</p>
                        <small>On property · Added to {contextRoom.toLowerCase()} · settles at checkout</small>
                      </div>
                      <CaretRight />
                    </button>
                  ))}
                </div>
              </section>
            ) : (
              <div className="guest-hub-empty">
                <Tag>No upcoming services</Tag>
                <h2>No active bookings yet</h2>
                <p>Browse our mini-app categories on Home to book room dining, spa massages, or tours.</p>
                <Button className="guest-button guest-button--primary" type="button" onClick={() => go('stay-overview')}>
                  Explore categories on Home<ArrowRight aria-hidden="true" />
                </Button>
              </div>
            )}

            {pastServices.length ? (
              <section>
                <SectionHeading title="Past & Completed" />
                <div className="guest-stack" style={{ gap: '10px' }}>
                  {pastServices.map((service) => (
                    <div key={service.id} className="guest-booking-card is-static">
                      <div>
                        <Tag tone={service.status === 'cancelled' ? 'neutral' : 'positive'}>
                          {service.status === 'cancelled' ? 'Cancelled' : 'Completed'}
                        </Tag>
                        <h2>{service.title}</h2>
                        <p>{service.scheduledFor} · {service.amount}</p>
                        <small>On property · Settled with room folio</small>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ) : (
              <section>
                <SectionHeading title="Past & Completed" />
                <div className="guest-booking-card is-static">
                  <div>
                    <Tag>Completed</Tag>
                    <h2>Airport transfer</h2>
                    <p>Sun, Nov 9 · 9:00 AM · ₱1,200</p>
                    <small>Hotel arranged · Settled at checkout</small>
                  </div>
                </div>
              </section>
            )}

            <section>
              <SectionHeading title="Explore categories" />
              <div className="guest-category-grid">
                <ActionTile icon={<ForkKnife />} label="Food & drink" onClick={() => { setSelectedCategory('dining'); go('category-listing'); }} />
                <ActionTile icon={<Sparkle />} label="Spa & wellness" onClick={() => { setSelectedCategory('spa'); go('category-listing'); }} />
                <ActionTile icon={<AirplaneTilt />} label="Entertainment & tours" onClick={() => { setSelectedCategory('entertainment'); go('category-listing'); }} />
                <ActionTile icon={<Storefront />} label="Hotel services" onClick={() => { setSelectedCategory('services'); go('category-listing'); }} />
              </div>
            </section>
          </div>
        );
      }

      case 'category-listing': {
        const categoryData = MINI_APP_CATEGORIES.find((cat) => cat.id === selectedCategory) ?? MINI_APP_CATEGORIES[0];
        const categoryServices = SERVICES.filter((s) => s.categoryId === selectedCategory);
        return (
          <div className="guest-stack">
            <div className="guest-page-title">
              <div className="guest-tag-row">
                <Tag tone="positive">{categoryData.badge}</Tag>
                <Tag>{contextBooking.property}</Tag>
              </div>
              <h1>{categoryData.title}</h1>
              <p>{categoryData.subtitle}. Charges are added to {contextRoom.toLowerCase()} and settle at checkout.</p>
            </div>
            {!online ? <Notice tone="offline" icon={<WifiSlash />} title="Browsing saved offerings">Live availability and booking require a connection.</Notice> : null}

            {selectedCategory === 'dining' ? (
              <div className="guest-stack" style={{ gap: '12px' }}>
                {RESTAURANTS.map((res) => (
                  <button
                    key={res.id}
                    className="guest-service-row"
                    type="button"
                    onClick={() => {
                      setSelectedRestaurantId(res.id);
                      setSelectedMenuTab('all');
                      go('restaurant-menu');
                    }}
                  >
                    <ServiceImage imageKey={res.id === 'apartment-1b' ? 'restaurant' : 'dining'} tone={res.tone} icon={<ForkKnife />} decorative />
                    <div>
                      <Tag>{res.operator}</Tag>
                      <h2>{res.name}</h2>
                      <p>{res.priceRange} · {res.hours}</p>
                      <small>{res.location}</small>
                    </div>
                    <CaretRight />
                  </button>
                ))}
              </div>
            ) : (
              <div className="guest-stack" style={{ gap: '12px' }}>
                {categoryServices.map((service) => (
                  <button
                    key={service.id}
                    className="guest-service-row"
                    type="button"
                    onClick={() => {
                      if (service.id === 'spa' || service.id === 'scrub') {
                        go('vendor-service');
                      } else {
                        go(online ? 'service-booking' : 'booking-blocked');
                      }
                    }}
                  >
                    <ServiceImage imageKey={service.id === 'spa' || service.id === 'scrub' || service.id === 'reflexology' ? 'spa' : service.id === 'tour' || service.id === 'music' || service.id === 'heritage-walk' ? 'tour' : service.id === 'transfer' ? 'transfer' : 'amenity'} tone={service.tone} icon={service.categoryId === 'spa' ? <Sparkle /> : service.categoryId === 'entertainment' ? <AirplaneTilt /> : <Storefront />} decorative />
                    <div>
                      <Tag>{service.operator}</Tag>
                      <h2>{service.name}</h2>
                      <p>{service.price} · {service.cutoff}</p>
                    </div>
                    <CaretRight />
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      }

      case 'restaurant-menu': {
        const venue = RESTAURANTS.find((r) => r.id === selectedRestaurantId) ?? RESTAURANTS[0];
        const filteredMenu = selectedMenuTab === 'all'
          ? venue.menu
          : venue.menu.filter((item) => item.category === selectedMenuTab);
        const venueCart = restaurantCarts[venue.id] ?? {};
        const cartSummary = getVenueCartSummary(venue.menu, venueCart);
        return (
          <div className="guest-stack guest-restaurant-menu">
            <ServiceImage
              imageKey={venue.id === 'apartment-1b' ? 'restaurant' : 'dining'}
              tone={venue.tone}
              icon={<ForkKnife size={38} />}
              decorative
            />
            <div className="guest-restaurant-hero">
              <div className="guest-tag-row">
                <Tag>{venue.operator}</Tag>
                <Tag>{venue.hours}</Tag>
              </div>
              <h1>{venue.name}</h1>
              <p>{venue.description}</p>
              <div className="guest-restaurant-hero__meta">
                <span><MapPin size={16} /> {venue.location}</span>
                <span>·</span>
                <span>Billed to {contextRoom.toLowerCase()}</span>
              </div>
            </div>

            <div className="guest-menu-tabs" role="tablist" aria-label="Menu categories">
              {(['all', 'starters', 'mains', 'desserts', 'drinks'] as const).map((tab) => (
                <button
                  key={tab}
                  role="tab"
                  aria-selected={selectedMenuTab === tab}
                  className={`guest-menu-tab ${selectedMenuTab === tab ? 'is-active' : ''}`}
                  onClick={() => setSelectedMenuTab(tab)}
                  type="button"
                >
                  {tab === 'all' ? 'All Items' : tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>

            <div className="guest-menu-grid">
              {filteredMenu.map((item) => (
                <div key={item.id} className="guest-menu-item-card">
                  <div className="guest-menu-item-card__header">
                    <div>
                      {item.tag ? <Tag tone="positive">{item.tag}</Tag> : null}
                      <h4>{item.name}</h4>
                    </div>
                    <span className="guest-menu-item-card__price">{item.price}</span>
                  </div>
                  <p>{item.description}</p>
                  <div className="guest-menu-item-card__actions">
                    <small>{venueCart[item.id] ? `${venueCart[item.id]} in this cart` : 'Add to venue cart'}</small>
                    {venueCart[item.id] ? (
                      <div className="guest-menu-quantity" aria-label={`${item.name} quantity`}>
                        <button type="button" aria-label={`Decrease ${item.name} quantity`} onClick={() => changeCartQuantity(venue.id, item.id, -1)}><Minus aria-hidden="true" /></button>
                        <output aria-live="polite">{venueCart[item.id]}</output>
                        <button type="button" aria-label={`Increase ${item.name} quantity`} onClick={() => changeCartQuantity(venue.id, item.id, 1)}><Plus aria-hidden="true" /></button>
                      </div>
                    ) : (
                      <Button className="guest-button guest-button--secondary guest-menu-add" type="button" aria-label={`Add ${item.name}`} onClick={() => changeCartQuantity(venue.id, item.id, 1)}>Add</Button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {cartSummary.itemCount > 0 ? (
              <button
                className="guest-mini-cart"
                type="button"
                aria-label={`View ${venue.name} cart · ${cartSummary.itemCount} ${cartSummary.itemCount === 1 ? 'item' : 'items'} · ${cartSummary.formattedTotal}`}
                onClick={() => go('restaurant-cart')}
              >
                <span><small>{venue.name} cart</small><b>{cartSummary.itemCount} {cartSummary.itemCount === 1 ? 'item' : 'items'}</b></span>
                <strong>{cartSummary.formattedTotal}</strong>
                <CaretRight aria-hidden="true" />
              </button>
            ) : null}

            <div className="guest-summary">
              <SummaryRow label="Property" value={contextBooking.property} />
              <SummaryRow label="Room" value={contextRoom} />
              <SummaryRow label="Billing" value="Settled at checkout" />
            </div>

            <Button
              className="guest-button guest-button--primary"
              type="button"
              onClick={() => {
                sendQuickMessage(`Hi, I would like to reserve a table at ${venue.name} for 2 guests tonight.`);
                go('chat');
              }}
            >
              Reserve a table via Front Desk<ArrowRight aria-hidden="true" />
            </Button>
            <TextButton onClick={() => go('category-listing')}>Back to {selectedCategory === 'dining' ? 'Food & Drink' : 'Services'}</TextButton>
          </div>
        );
      }

      case 'restaurant-cart': {
        const venue = RESTAURANTS.find((r) => r.id === selectedRestaurantId) ?? RESTAURANTS[0];
        const cartSummary = getVenueCartSummary(venue.menu, restaurantCarts[venue.id] ?? {});
        return (
          <div className="guest-stack guest-order-cart">
            <div className="guest-page-title">
              <p className="guest-eyebrow">{venue.name} · charged at checkout</p>
              <h1>Your {venue.name} order</h1>
              <p>Review your items, then choose delivery or pickup.</p>
            </div>
            <div className="guest-order-cart__summary" aria-live="polite">
              <span>{cartSummary.itemCount} {cartSummary.itemCount === 1 ? 'item' : 'items'}</span>
              <strong>{cartSummary.formattedTotal}</strong>
            </div>
            <div className="guest-order-items">
              {cartSummary.items.map((item) => (
                <div className="guest-order-item" key={item.id}>
                  <div><b>{item.name}</b><small>{item.unitPrice} each</small></div>
                  <div className="guest-menu-quantity" aria-label={`${item.name} quantity`}>
                    <button type="button" aria-label={`Decrease ${item.name} quantity`} onClick={() => changeCartQuantity(venue.id, item.id, -1)}><Minus aria-hidden="true" /></button>
                    <output aria-live="polite">{item.quantity}</output>
                    <button type="button" aria-label={`Increase ${item.name} quantity`} onClick={() => changeCartQuantity(venue.id, item.id, 1)}><Plus aria-hidden="true" /></button>
                  </div>
                </div>
              ))}
            </div>
            <fieldset className="guest-fulfillment-options">
              <legend>How would you like this order?</legend>
              <div>
                <button
                  type="button"
                  aria-label="Deliver to room"
                  aria-pressed={diningMethod === 'delivery'}
                  className={diningMethod === 'delivery' ? 'is-active' : ''}
                  disabled={!contextBooking.roomNumber}
                  onClick={() => setDiningMethod('delivery')}
                >
                  <b>Deliver to room</b><small>{contextBooking.roomNumber ? contextRoom : 'Room assignment required'}</small>
                </button>
                <button
                  type="button"
                  aria-label="Pick up"
                  aria-pressed={diningMethod === 'pickup'}
                  className={diningMethod === 'pickup' ? 'is-active' : ''}
                  onClick={() => { setDiningMethod('pickup'); setDiningTiming('scheduled'); }}
                >
                  <b>Pick up</b><small>{venue.location}</small>
                </button>
              </div>
            </fieldset>
            {!contextBooking.roomNumber ? <Notice title="Room delivery is available after your room is assigned.">Choose pickup to order before a room has been assigned.</Notice> : null}
            <fieldset className="guest-fulfillment-options">
              <legend>When?</legend>
              {diningMethod === 'delivery' ? (
                <div>
                  <button type="button" aria-label="As soon as possible" aria-pressed={diningTiming === 'asap'} className={diningTiming === 'asap' ? 'is-active' : ''} onClick={() => setDiningTiming('asap')}><b>As soon as possible</b><small>About 30–40 minutes</small></button>
                  <button type="button" aria-label="Schedule for later" aria-pressed={diningTiming === 'scheduled'} className={diningTiming === 'scheduled' ? 'is-active' : ''} onClick={() => setDiningTiming('scheduled')}><b>Schedule for later</b><small>Choose an available time</small></button>
                </div>
              ) : null}
              {diningMethod === 'pickup' || diningTiming === 'scheduled' ? (
                <div className="guest-order-times" aria-label="Available order times">
                  {['6:30 PM', '7:00 PM', '7:30 PM'].map((time) => (
                    <button key={time} type="button" aria-pressed={diningTime === time} className={diningTime === time ? 'is-active' : ''} onClick={() => setDiningTime(time)}>{time}</button>
                  ))}
                </div>
              ) : null}
            </fieldset>
            {diningOrderError ? <Notice tone={!online ? 'offline' : 'warning'} title={diningOrderError}>Your cart is saved. Review it and try again when you’re ready.</Notice> : null}
            <Notice title="Nothing is charged yet">Your room folio changes only after you review and place this order.</Notice>
            <Button className="guest-button guest-button--primary guest-order-submit" type="button" disabled={cartSummary.itemCount === 0} onClick={confirmDiningOrder}>Place order and charge to room<ArrowRight aria-hidden="true" /></Button>
            <TextButton onClick={() => go('restaurant-menu')}>Add more from {venue.name}</TextButton>
          </div>
        );
      }

      case 'dining-order-confirmation': {
        const order = session.serviceBookings.find((service) => service.diningOrder && service.bookingId === contextBooking.id);
        return (
          <ScreenIntro
            icon={<CheckCircle size={30} />}
            eyebrow="Order confirmed · charged at checkout"
            title={order?.diningOrder?.fulfillment.method === 'pickup' ? 'Your order is confirmed' : 'Your order is on its way'}
            text={order?.scheduledFor ?? 'The establishment has received your order.'}
          >
            <div className="guest-summary">
              <SummaryRow label="Establishment" value={order?.diningOrder?.venueName ?? 'Food & Drink'} />
              <SummaryRow label="Items" value={`${order?.diningOrder?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0}`} />
              <SummaryRow label="Added to room charges" value={order?.amount ?? '₱0'} strong />
            </div>
            <Notice title="Pay at checkout">This order is now part of your personal room tab. No payment is due now.</Notice>
            {primary('View room charges', 'folio')}
            <TextButton onClick={() => go('category-listing')}>Order from another establishment</TextButton>
          </ScreenIntro>
        );
      }

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
        return <div className="guest-stack"><div className="guest-page-title"><p className="guest-eyebrow">{contextBooking.property} · {contextRoom} · Last updated 2:14 PM</p><h1>Room charges</h1><p>These charges settle with the hotel at checkout.</p></div>{!online ? <Notice tone="offline" title="Last-known folio">Reconnect for the latest charges.</Notice> : null}<div className="guest-total-card"><span>Current room total</span><strong>{folioTotal}</strong><small>Booking room rate paid through {contextBooking.source}</small></div><div className="guest-folio"><FolioItem date="NOV 9" title="Airport transfer" meta="Hotel arranged" amount="₱1,200" /><FolioItem date="NOV 10" title="In-room dining" meta="Dinner · 2 guests" amount="₱850" /><FolioItem date="NOV 10" title="Laundry service" meta="Hotel operated" amount="₱1,000" />{folioServices.map((service) => <FolioItem key={service.id} date="NOV 11" title={service.title} meta={service.diningOrder ? `${service.diningOrder.items.reduce((sum, item) => sum + item.quantity, 0)} items · ${service.scheduledFor} · settles at checkout` : `${service.scheduledFor} · Added to ${contextRoom.toLowerCase()} · settles at checkout`} amount={service.amount} />)}</div><Notice title="Questions about a charge?">The front desk can explain or correct a folio line before checkout.</Notice>{primary('Ask the front desk', 'chat')}</div>;
      }

      case 'chat':
      case 'chat-after-hours': {
        const afterHours = activeScreen === 'chat-after-hours';
        return <div className="guest-chat"><div className="guest-chat__intro"><div><Tag tone={afterHours ? 'warning' : 'positive'}>{afterHours ? 'Outside staffed hours' : 'Front desk online'}</Tag><h1>Front desk</h1><p>{afterHours ? `Messages send now. The team responds from 6:00 AM for ${contextBooking.property}.` : `Shared property inbox for ${contextBooking.property} · Usually replies in a few minutes.`}</p></div></div>{!online ? <Notice tone="offline" title="Messages will send when connected">Your chat history is available. New requests wait on this device.</Notice> : null}<div className="guest-quick-actions" aria-label="Quick requests"><button onClick={() => sendQuickMessage('Could we get two fresh towels, please?')}>Towels</button><button onClick={() => sendQuickMessage(`Please arrange housekeeping for ${contextRoom.toLowerCase()}.`)}>Housekeeping</button><button onClick={() => sendQuickMessage('Can we request a late checkout?')}>Late checkout</button><button onClick={() => sendQuickMessage('We need help arranging a transfer.')}>Transfers</button></div><div className="guest-messages" aria-live="polite">{chatMessages.map((message, index) => <div key={`${message.body}-${index}`} className={`guest-message guest-message--${message.from}`}><p>{message.body}</p>{message.state ? <small>{message.state}</small> : null}</div>)}{sending ? <div className="guest-message guest-message--desk guest-message--typing"><SpinnerGap className="guest-spin" /><span>Front desk is replying</span></div> : null}</div><form className="guest-composer" onSubmit={(event: FormEvent<HTMLFormElement>) => { event.preventDefault(); const form = new FormData(event.currentTarget); const body = String(form.get('message') ?? '').trim(); if (body) sendQuickMessage(body); event.currentTarget.reset(); }}><label className="sr-only" htmlFor="message">Message the front desk</label><input id="message" name="message" placeholder="Ask the front desk" /><button aria-label="Send message" type="submit"><ArrowRight /></button></form></div>;
      }

      case 'room-qr-midstay':
        return <ScreenIntro icon={<CheckCircle size={30} />} eyebrow={`${contextRoom} linked`} title="You’re checked in" text="Pre-arrival steps are no longer relevant. Go straight to services, your room charges, or the front desk."><StayMiniCard booking={contextBooking} status={`Active until ${contextBooking.checkOut}`} />{primary('Explore services', 'marketplace')}<button className="guest-button guest-button--secondary" onClick={() => go('stay-overview')}>Open stay overview</button></ScreenIntro>;

      case 'profile':
        return (
          <div className="guest-stack">
            <div className="guest-page-title">
              <p className="guest-eyebrow">Guest identity</p>
              <h1>{session.guestName || 'Profile'}</h1>
              <p>Recognized across all 13 participating properties.</p>
            </div>
            <div className="guest-profile-card">
              <div className="guest-avatar">
                {(session.guestName || 'Guest').split(' ').map((part) => part[0]).slice(0, 2).join('')}
              </div>
              <div>
                <b>{session.email || 'No email on file'}</b>
                <span>+63 917 555 0142</span>
                <small>Passport on file · ends 4821</small>
              </div>
            </div>
            <button className="guest-list-row" onClick={() => go('stay-history')}>
              <span><SuitcaseRolling /></span>
              <div><b>Stay history</b><small>3 stays across 2 properties</small></div>
              <CaretRight />
            </button>
            <div className="guest-list-row is-muted">
              <span><Sparkle /></span>
              <div><b>Loyalty</b><small>Coming soon</small></div>
            </div>
            <button className="guest-list-row" type="button" aria-label="Sign out" onClick={signOut}>
              <span><SignOut /></span>
              <div><b>Sign out</b><small>Return to the welcome screen</small></div>
              <CaretRight />
            </button>
          </div>
        );

      case 'stay-history':
        return <div className="guest-stack"><div className="guest-page-title"><p className="guest-eyebrow">Across properties</p><h1>Stay history</h1></div><HistoryItem property="The Henry Cebu" dates="March 14–17, 2026" room="Room 211 · Completed" /><HistoryItem property="The Henry Manila" dates="October 2–4, 2025" room="Room 406 · Completed" /><HistoryItem property="The Henry Cebu" dates="May 8–10, 2025" room="Room 108 · Completed" /></div>;
    }
  };

  return (
    <main className="guest-prototype guest-app">
        <section className={`guest-device ${isWelcome ? 'is-welcome' : ''}`} aria-label="Cabana guest app">
          {!isWelcome ? <header className="guest-appbar" data-scrolled={scrolled}>
            <div className="guest-appbar__side">
              {history.length ? <button className="guest-icon-button" type="button" onClick={back} aria-label="Go back"><ArrowLeft /></button> : <span className="guest-brand"><CabanaLockup className="guest-brand__lockup" /><span className="sr-only">Cabana</span></span>}
            </div>
            {/* Connection is only worth a slot when it is the exception. */}
            <div className="guest-appbar__center">{online ? null : <span className="guest-connection"><WifiSlash />Offline</span>}</div>
            {/* No profile to open before there is an account to open it for. */}
            <div className="guest-appbar__side guest-appbar__side--end">
              {session.auth === 'authenticated' || session.bookings.length > 0 ? <button className="guest-icon-button" type="button" onClick={() => go('profile')} aria-label="Open profile"><Person /></button> : null}
            </div>
          </header> : null}

          <div
            className={`guest-screen ${showNav ? 'has-nav' : ''} ${isWelcome ? 'guest-screen--welcome' : ''}`}
            key={activeScreen}
            onScroll={(event) => {
              const next = event.currentTarget.scrollTop > 4;
              setScrolled((current) => (current === next ? current : next));
            }}
          >
            {renderScreen()}
          </div>

          {showPrimaryNav ? <nav className="guest-bottom-nav" aria-label="Primary navigation"><NavButton label="Stay" icon={<House />} active={activeScreen === 'stay-overview'} onClick={() => go('stay-overview')} /><NavButton label="Bookings" icon={<CalendarBlank />} active={['marketplace', 'category-listing', 'hotel-service', 'vendor-service', 'restaurant-menu', 'restaurant-cart', 'dining-order-confirmation', 'service-booking', 'booking-confirmation', 'booking-blocked', 'my-bookings', 'cancel-before-cutoff', 'cancel-after-cutoff'].includes(activeScreen)} onClick={() => go('marketplace')} /><NavButton label="Chat" icon={<ChatCircleDots />} active={activeScreen === 'chat' || activeScreen === 'chat-after-hours'} onClick={() => go('chat')} /></nav> : null}
        </section>
    </main>
  );
}

type StayOverviewHomeProps = {
  session: GuestSession;
  booking?: Booking;
  online: boolean;
  onNavigate: (screen: ActiveScreen) => void;
  onSelectCategory: (cat: MiniAppCategoryId) => void;
};

function StayOverviewHome({ session, booking, online, onNavigate, onSelectCategory }: StayOverviewHomeProps) {
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
        <section className="guest-stay-hero-card">
          <div className="guest-stay-hero-card__media">
            <PropertyImage property={booking.property} aspectRatio="16/9" decorative />
            <div className="guest-stay-hero-card__badges">
              <Tag tone="positive">Active stay</Tag>
              <span className="guest-tag guest-tag--dark">{roomLabel}</span>
            </div>
          </div>
          <div className="guest-stay-hero-card__body">
            <p className="guest-eyebrow">Good afternoon, {session.guestName.split(' ')[0]}</p>
            <h1>{booking.property}</h1>
            <p className="guest-stay-hero-card__meta">{formatStayDateRange(booking)} · {booking.city}</p>
            <div className="guest-stay-hero-card__chips">
              <span><WifiHigh size={14} /> Hotel Wi-Fi</span>
              <span>·</span>
              <span><Bed size={14} /> {booking.roomType}</span>
            </div>
          </div>
        </section>
        {!online ? <Notice tone="offline" icon={<WifiSlash />} title="You’re offline">Cached stay details are available. Requests will send when connected.</Notice> : null}
        <section>
          <SectionHeading title="Explore on-property" action="Bookings Hub" onAction={() => onNavigate('marketplace')} />
          <div className="guest-miniapp-grid" role="group" aria-label="Experience categories">
            {MINI_APP_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                className="guest-miniapp-card"
                onClick={() => {
                  onSelectCategory(cat.id);
                  onNavigate('category-listing');
                }}
              >
                <div className="guest-miniapp-card__cover">
                  <CategoryCoverImage categoryId={cat.id} aspectRatio="16/10" />
                  <div className="guest-miniapp-card__tag">
                    <Tag tone={cat.id === 'spa' ? 'positive' : 'neutral'}>{cat.badge}</Tag>
                  </div>
                </div>
                <div className="guest-miniapp-card__info">
                  <div className="guest-miniapp-card__header">
                    <div className={`guest-miniapp-icon guest-miniapp-icon--${cat.tone}`} aria-hidden="true">
                      {cat.id === 'dining' ? <ForkKnife /> : cat.id === 'spa' ? <Sparkle /> : cat.id === 'entertainment' ? <AirplaneTilt /> : <Storefront />}
                    </div>
                    <h3>{cat.title}</h3>
                  </div>
                  <p>{cat.subtitle}</p>
                </div>
              </button>
            ))}
          </div>
        </section>
        {confirmedServices[0] ? <section className="guest-home-next-service"><SectionHeading title="Next up" action="Bookings Hub" onAction={() => onNavigate('marketplace')} /><div className="guest-booking-card is-static"><div><Tag tone="positive">Confirmed</Tag><h2>{confirmedServices[0].title}</h2><p>{confirmedServices[0].scheduledFor} · {confirmedServices[0].amount}</p><small>Added to {roomLabel.toLowerCase()} · settles at checkout</small></div></div></section> : null}
        <section>
          <SectionHeading title="Your account" />
          <div className="guest-list-group" role="group" aria-label="Your account">
            <button className="guest-list-row" onClick={() => onNavigate('folio')} type="button"><span><Receipt /></span><div><b>Room charges</b><small>Current folio · {folioTotal}</small></div><CaretRight /></button>
            <button className="guest-list-row" onClick={() => onNavigate('marketplace')} type="button"><span><CalendarBlank /></span><div><b>Bookings Hub</b><small>{serviceCountLabel(confirmedServices.length)}</small></div><CaretRight /></button>
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
        <button className="guest-list-row" onClick={() => onNavigate('profile')} type="button"><span><Person /></span><div><b>Guest profile</b><small>{session.guestName} · Account details</small></div><CaretRight /></button>
      </div>
    );
  }

  if (variant === 'completed') {
    return (
      <div className="guest-stack guest-home-booking guest-home-booking--completed" data-testid="guest-home-completed">
        <div className="guest-page-title"><p className="guest-eyebrow">Welcome back, {session.guestName.split(' ')[0]}</p><h1>Your latest stay</h1><p>Reconnect another reservation whenever you’re ready.</p></div>
        <div className="guest-home-booking guest-upcoming-card guest-home-booking--primary">
          <div className="guest-upcoming-card__media">
            <PropertyImage property={booking.property} aspectRatio="16/8" decorative />
            <div className="guest-upcoming-card__badges">
              <Tag>Completed</Tag>
            </div>
          </div>
          <div className="guest-upcoming-card__content">
            <h2>{booking.property}</h2>
            <p>{formatStayDateRange(booking)} · {booking.roomType}</p>
            <small>Booking {booking.id}</small>
          </div>
        </div>
        <Notice tone="positive" icon={<CheckCircle />} title="Stay complete">Your previous room charges were settled at checkout.</Notice>
        <Button className="guest-button guest-button--primary" type="button" onClick={() => onNavigate('connect-booking')}>Connect another stay<ArrowRight aria-hidden="true" /></Button>
        <TextButton onClick={() => onNavigate('stay-history')}>View stay history</TextButton>
      </div>
    );
  }

  return (
    <div className="guest-stack guest-home-booking guest-home-booking--upcoming" data-testid="guest-home-upcoming">
      <div className="guest-stay-hero-card">
        <div className="guest-stay-hero-card__media">
          <PropertyImage property={booking.property} aspectRatio="16/9" decorative />
          <div className="guest-stay-hero-card__badges">
            <Tag tone="warning">Upcoming</Tag>
            <span className="guest-tag guest-tag--dark">{booking.city}</span>
          </div>
        </div>
        <div className="guest-stay-hero-card__body">
          <p className="guest-eyebrow">Your next stay</p>
          <h1>{booking.property}</h1>
          <p className="guest-stay-hero-card__meta">{booking.city} · {formatStayDateRange(booking)}</p>
        </div>
      </div>
      <section className="guest-home-booking guest-home-booking--primary">
        <div className="guest-home-booking__heading"><div><small>Pre-arrival</small><h2>{booking.preArrivalCompleted} of {booking.preArrivalTotal} steps complete</h2></div><strong>{Math.round((booking.preArrivalCompleted / Math.max(booking.preArrivalTotal, 1)) * 100)}%</strong></div>
        <div className="guest-home-progress" role="progressbar" aria-label="Pre-arrival progress" aria-valuemin={0} aria-valuemax={booking.preArrivalTotal} aria-valuenow={booking.preArrivalCompleted}><span style={{ width: `${Math.min(100, (booking.preArrivalCompleted / Math.max(booking.preArrivalTotal, 1)) * 100)}%` }} /></div>
        <p>{booking.nextPreArrivalStep ?? 'Review your stay details before arrival.'}</p>
        <Button className="guest-button guest-button--primary" type="button" onClick={() => onNavigate(booking.preArrivalCompleted < booking.preArrivalTotal ? 'guest-details' : 'repeat-review')}>{booking.preArrivalCompleted < booking.preArrivalTotal ? 'Complete pre-arrival' : 'Review stay'}<ArrowRight aria-hidden="true" /></Button>
      </section>
      <section>
        <SectionHeading title="Explore on-property" action="Bookings Hub" onAction={() => onNavigate('marketplace')} />
        <div className="guest-miniapp-grid" role="group" aria-label="Experience categories">
          {MINI_APP_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              className="guest-miniapp-card"
              onClick={() => {
                onSelectCategory(cat.id);
                onNavigate('category-listing');
              }}
            >
              <div className="guest-miniapp-card__cover">
                <CategoryCoverImage categoryId={cat.id} aspectRatio="16/10" />
                <div className="guest-miniapp-card__tag">
                  <Tag tone={cat.id === 'spa' ? 'positive' : 'neutral'}>{cat.badge}</Tag>
                </div>
              </div>
              <div className="guest-miniapp-card__info">
                <div className="guest-miniapp-card__header">
                  <div className={`guest-miniapp-icon guest-miniapp-icon--${cat.tone}`} aria-hidden="true">
                    {cat.id === 'dining' ? <ForkKnife /> : cat.id === 'spa' ? <Sparkle /> : cat.id === 'entertainment' ? <AirplaneTilt /> : <Storefront />}
                  </div>
                  <h3>{cat.title}</h3>
                </div>
                <p>{cat.subtitle}</p>
              </div>
            </button>
          ))}
        </div>
      </section>
      <section>
        <SectionHeading title="Stay details" action="View booking" onAction={() => onNavigate('rate-detail')} />
        <div className="guest-grid-2">
          <InfoTile icon={<CalendarBlank />} label="Dates" value={formatStayDateRange(booking)} />
          <InfoTile icon={<Bed />} label="Room" value={booking.roomNumber ? `${booking.roomType} · ${booking.roomNumber}` : `${booking.roomType} · Assigned at arrival`} />
        </div>
      </section>
      <button className="guest-list-row" onClick={() => onNavigate('profile')} type="button"><span><Person /></span><div><b>Guest profile</b><small>{session.guestName} · Account details</small></div><CaretRight /></button>
    </div>
  );
}


function UpcomingBookingCard({ booking, primary = false, onNavigate }: { booking: Booking; primary?: boolean; onNavigate: (screen: ActiveScreen) => void }) {
  return (
    <div className={`guest-home-booking guest-upcoming-card ${primary ? 'guest-home-booking--primary' : ''}`}>
      <div className="guest-upcoming-card__media">
        <PropertyImage property={booking.property} aspectRatio="16/8" decorative />
        <div className="guest-upcoming-card__badges">
          <Tag tone={primary ? 'positive' : 'neutral'}>{primary ? 'Next arrival' : 'Upcoming'}</Tag>
          <span className="guest-tag guest-tag--dark">{booking.city}</span>
        </div>
      </div>
      <div className="guest-upcoming-card__content">
        <h2>{booking.property}</h2>
        <p>{formatStayDateRange(booking)} · {booking.roomType}</p>
        <small>{booking.preArrivalCompleted} of {booking.preArrivalTotal} pre-arrival steps complete</small>
        <Button className="guest-button guest-button--secondary" type="button" onClick={() => onNavigate('rate-detail')}>View booking<ArrowRight aria-hidden="true" /></Button>
      </div>
    </div>
  );
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
  return (
    <div className="guest-stay-card">
      <div className="guest-stay-card__art">
        <PropertyImage property={booking.property} aspectRatio="16/8" decorative />
      </div>
      <div className="guest-stay-card__content">
        <Tag tone="positive">Confirmed</Tag>
        <h2>{booking.property}</h2>
        <p>{booking.roomType} · {checkIn}–{checkOut}, {booking.checkIn.slice(0, 4)}</p>
        <small>Booking {booking.id}</small>
      </div>
    </div>
  );
}

function StayMiniCard({ booking, status }: { booking: Booking; status: string }) {
  return <div className="guest-mini-stay"><span><House /></span><div><b>{booking.property}</b><small>{status}</small></div><CheckCircle /></div>;
}

function CheckOption({ label, name, defaultChecked }: { label: string; name?: string; defaultChecked?: boolean }) {
  return <label className="guest-check"><input type="checkbox" name={name} defaultChecked={defaultChecked} /><span>{label}</span></label>;
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
  return (
    <div className="guest-history-card">
      <div className="guest-history-card__media">
        <PropertyImage property={property} aspectRatio="16/8" decorative />
        <Tag tone="neutral">Completed</Tag>
      </div>
      <div className="guest-history-card__body">
        <b>{property}</b>
        <p>{dates}</p>
        <small>{room}</small>
      </div>
    </div>
  );
}

function NavButton({ label, icon, active, onClick }: { label: string; icon: ReactNode; active: boolean; onClick: () => void }) {
  return <button aria-current={active ? 'page' : undefined} onClick={onClick}><span>{icon}</span><small>{label}</small></button>;
}
