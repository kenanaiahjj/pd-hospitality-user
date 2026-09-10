'use client';

import {
  AirplaneTilt,
  ArrowLeft,
  Boat,
  ArrowRight,
  ArrowsDownUp,
  NavigationArrow,
  Bed,
  BellRinging,
  CalendarBlank,
  CaretRight,
  ChatCircleDots,
  Check,
  CheckCircle,
  Clock,
  CreditCard,
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
  SlidersHorizontal,
  CaretDown,
  Sparkle,
  SpinnerGap,
  Storefront,
  Ticket,
  ShieldCheck,
  SuitcaseRolling,
  Users,
  Van,
  WifiHigh,
  WifiSlash,
  X,
} from '@phosphor-icons/react';
import Image from 'next/image';
import { useEffect, useRef, useState, type FormEvent, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react';
import { CabanaLockup, CabanaFullLockup } from '@/components/ui/cabana-logo';
import { CarrierLogo } from './company-logos';
import { CATEGORY_ILLUSTRATIONS, ENTRY_ILLUSTRATIONS, WELCOME_ILLUSTRATIONS } from './illustrations';
import { Button, Input } from '@/components/ui';
import { usePrefersReducedMotion } from '@/lib/hooks';
import {
  ANONYMOUS_SESSION,
  connectBooking,
  createAccountWithPassword,
  formatPesoAmount,
  getHomeVariant,
  getPostAuthScreen,
  getPrimaryBooking,
  getVenueCartSummary,
  getRoomCharges,
  availableDietaryTags,
  availableOperators,
  availableTypes,
  filterMenu,
  filterServices,
  DIETARY_LABELS,
  LISTING_SORTS,
  type DietaryTag,
  type ListingSort,
  sumRoomCharges,
  markRoomReady,
  bookTravel,
  describeRoomAssignment,
  getTravelCategory,
  MINI_APP_CATEGORIES,
  getFeaturedServices,
  MOCK_SESSION,
  RESTAURANTS,
  SERVICES,
  quoteTravel,
  TRAVEL_CATEGORIES,
  POPULAR_ROUTES,
  signInWithPassword,
  signOutSession,
  verifyPendingSession,
  parsePesoAmount,
  type Booking,
  type GuestSession,
  type DiningFulfillment,
  type MenuItemCategory,
  type MiniAppCategoryId,
  type TravelCategoryId,
  type ServiceBooking,
  type ScreenId,
} from './prototype-model';
import {
  getServiceImage,
  getPropertyImage,
  getServiceImageKey,
  getItemThumbnail,
  getItemCardImage,
  getRouteDestinationImage,
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

function SelectField({ label, name, children, defaultValue, value, onValueChange }: {
  label: string;
  name: string;
  children: ReactNode;
  defaultValue?: string;
  /** Pass with `onValueChange` to drive the field from state instead. */
  value?: string;
  onValueChange?: (next: string) => void;
}) {
  const controlled = value !== undefined && onValueChange !== undefined;
  return (
    <label className="guest-field" htmlFor={name}>
      <span>{label}</span>
      <select
        id={name}
        name={name}
        {...(controlled
          ? { value, onChange: (event) => onValueChange(event.target.value) }
          : { defaultValue })}
      >
        {children}
      </select>
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

function ServiceImage({
  imageKey,
  itemId,
  categoryId,
  variant = 'thumbnail',
  tone,
  icon,
  decorative = false,
}: {
  imageKey?: ServiceImageKey;
  itemId?: string;
  categoryId?: string;
  variant?: 'thumbnail' | 'card';
  tone: string;
  icon: ReactNode;
  decorative?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const effectiveKey: ServiceImageKey = imageKey ?? (itemId ? getServiceImageKey({ id: itemId, categoryId: categoryId ?? '' }) : 'amenity');
  const image = itemId
    ? (variant === 'card' ? getItemCardImage(itemId, categoryId) : getItemThumbnail(itemId, categoryId))
    : getServiceImage(effectiveKey);

  return (
    <div className={`guest-service-image guest-service-image--${effectiveKey} ${variant === 'card' ? 'is-card' : 'is-thumbnail'} ${failed ? 'is-error' : ''}`}>
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

function CategoryIcon({ id }: { id: MiniAppCategoryId }) {
  const art = CATEGORY_ILLUSTRATIONS[id];
  if (!art) return null;
  return (
    <Image
      src={art.src}
      alt=""
      width={art.width}
      height={art.height}
      className="guest-category-icon-img"
      loading="eager"
    />
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
      // Being in the room is the definition of released.
      roomAssignment: 'ready' as const,
      roomReadyAt: item.roomReadyAt ?? '2:15 PM',
      folioTotal: item.folioTotal ?? '₱3,050',
    } : item),
    folioTotal: booking.folioTotal ?? (connected.folioTotal === '₱0' ? '₱3,050' : connected.folioTotal),
  };
}

/**
 * The ways a guest can arrive, each with its own illustration.
 *
 * `aria-label` is kept distinct from the visible title where the two differ --
 * the existing labels are what the tests and screen readers address.
 */
const BOOKING_ENTRY_OPTIONS = [
  {
    screen: 'identify' as const,
    label: 'Booking email',
    title: 'Booking email',
    detail: 'The confirmation email from your hotel',
    art: ENTRY_ILLUSTRATIONS.bookingEmail,
  },
  {
    screen: 'room-qr-landing' as const,
    label: 'Continue with room QR',
    title: 'Room QR',
    detail: 'You’re already in your room',
    art: ENTRY_ILLUSTRATIONS.roomQr,
  },
  {
    screen: 'wifi-landing' as const,
    label: 'Open hotel Wi-Fi entry',
    title: 'Hotel Wi-Fi',
    detail: 'You’re on the hotel network',
    art: ENTRY_ILLUSTRATIONS.hotelWifi,
  },
];

/** Rendered by both `entry-hub` and `connect-booking`, so they cannot drift. */
function BookingEntryOptions({ onNavigate }: { onNavigate: (screen: ActiveScreen) => void }) {
  return (
    <div className="guest-entry-options">
      {BOOKING_ENTRY_OPTIONS.map((option) => (
        <button
          key={option.screen}
          className="guest-entry-card"
          type="button"
          aria-label={option.label}
          onClick={() => onNavigate(option.screen)}
        >
          {/* Decorative: the title beside it already carries the meaning. */}
          <span className="guest-entry-card__art">
            <Image
              src={option.art.src}
              alt=""
              width={option.art.width}
              height={option.art.height}
              sizes="116px"
              /* These mount only when this screen opens, so there is nothing
                 to defer -- lazy loading would just pop them in late. */
              loading="eager"
            />
          </span>
          <div>
            <b>{option.title}</b>
            <small>{option.detail}</small>
          </div>
          <CaretRight />
        </button>
      ))}
    </div>
  );
}

/**
 * The three things a booking unlocks, shown one at a time as an onboarding
 * pager. Array order is the reading order and the paging order.
 */
const WELCOME_STEPS = [
  {
    step: '01',
    stage: 'Before you arrive',
    title: 'Check in before arrival',
    art: WELCOME_ILLUSTRATIONS.arrival,
  },
  {
    step: '02',
    stage: 'At the hotel',
    title: 'Skip the front desk paperwork',
    art: WELCOME_ILLUSTRATIONS.frontDesk,
  },
  {
    step: '03',
    stage: 'During your stay',
    title: 'View charges and hotel services',
    art: WELCOME_ILLUSTRATIONS.stay,
  },
];

/** Dwell per step once the pager is rotating on its own. */
const STEP_DWELL_MS = 4500;
/** The first step also has to outlast the splash, which runs 250ms + 1400ms. */
const FIRST_STEP_DWELL_MS = 5900;
const SWIPE_THRESHOLD_PX = 40;

/**
 * The artwork and the step copy sit in different places on the screen -- the
 * art high up, the copy down against the action -- so the index lives here
 * rather than inside either one.
 */
function useWelcomePager() {
  const [index, setIndex] = useState(0);
  /**
   * Autoplay is a courtesy, not a control. The moment the guest drives the
   * pager -- swipe, dot, or keyboard focus -- it hands over for good and never
   * pulls the step out from under them again.
   */
  const [engaged, setEngaged] = useState(false);
  const reducedMotion = usePrefersReducedMotion();
  const dragOrigin = useRef<number | null>(null);

  useEffect(() => {
    if (engaged || reducedMotion) return;
    // setState inside the timer, never in the effect body -- see use-debounce.
    const timer = setTimeout(
      () => setIndex((current) => (current + 1) % WELCOME_STEPS.length),
      index === 0 ? FIRST_STEP_DWELL_MS : STEP_DWELL_MS,
    );
    return () => clearTimeout(timer);
  }, [engaged, reducedMotion, index]);

  /** Autoplay wraps; a deliberate swipe clamps, so the ends feel like ends. */
  function show(next: number) {
    setEngaged(true);
    setIndex(Math.min(WELCOME_STEPS.length - 1, Math.max(0, next)));
  }

  return {
    index,
    show,
    engage: () => setEngaged(true),
    /**
     * Only ever spread onto the artwork. On the whole column a drag that
     * started on the action button would page the pager and fire the button.
     */
    swipe: {
      onPointerDown: (event: ReactPointerEvent<HTMLElement>) => {
        dragOrigin.current = event.clientX;
      },
      onPointerUp: (event: ReactPointerEvent<HTMLElement>) => {
        const origin = dragOrigin.current;
        dragOrigin.current = null;
        if (origin === null) return;
        const travel = event.clientX - origin;
        if (Math.abs(travel) < SWIPE_THRESHOLD_PX) return;
        show(index + (travel < 0 ? 1 : -1));
      },
      onPointerCancel: () => { dragOrigin.current = null; },
    },
  };
}

type PagerHandle = ReturnType<typeof useWelcomePager>;

/**
 * `transform`, not the standalone `translate` property: that one computes to
 * nothing in some engines, which leaves the dots advancing while the artwork
 * sits still.
 */
const trackOffset = (index: number) => ({ transform: `translateX(${index * -100}%)` });

/** Decorative: every step's meaning is carried by its copy further down. */
function WelcomeArt({ index, swipe }: Pick<PagerHandle, 'index' | 'swipe'>) {
  return (
    <div className="guest-welcome__art" {...swipe}>
      <div className="guest-welcome__art-track" style={trackOffset(index)} aria-hidden="true">
        {WELCOME_STEPS.map((item, position) => (
          <span key={item.step} className="guest-welcome__art-frame">
            <Image
              src={item.art.src}
              alt=""
              width={item.art.width}
              height={item.art.height}
              sizes="(max-width: 400px) 100vw, 400px"
              {...(position === 0 ? { priority: true } : { loading: 'eager' as const })}
            />
          </span>
        ))}
      </div>
    </div>
  );
}

function WelcomeDots({ index, show }: Pick<PagerHandle, 'index' | 'show'>) {
  return (
    <div className="guest-welcome__dots">
      {WELCOME_STEPS.map((item, position) => (
        <button
          key={item.step}
          type="button"
          aria-label={`Step ${item.step}: ${item.title}`}
          aria-current={position === index ? 'step' : undefined}
          onClick={() => show(position)}
        >
          <span aria-hidden="true" />
        </button>
      ))}
    </div>
  );
}

/** The real content of the pager, and the screen's only body copy. */
function WelcomeStepCopy({ index }: Pick<PagerHandle, 'index'>) {
  return (
    <div className="guest-welcome__steps">
      <ol className="guest-welcome__steps-track" style={trackOffset(index)}>
        {WELCOME_STEPS.map((item, position) => (
          <li key={item.step} className="guest-welcome__step" aria-hidden={position !== index}>
            <p className="guest-welcome__step-stage"><span aria-hidden="true">{item.step}</span>{item.stage}</p>
            <p className="guest-welcome__step-title">{item.title}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}

function WelcomeScreen({ onFindBooking }: { onFindBooking: () => void }) {
  const pager = useWelcomePager();

  return (
    <section className="guest-welcome" aria-labelledby="guest-welcome-title">
      <div className="guest-welcome__splash" aria-hidden="true">
        <CabanaFullLockup className="guest-welcome__splash-brand" markWidth={92} />
      </div>
      <div className="guest-welcome__content" onFocus={pager.engage}>
        <CabanaFullLockup className="guest-welcome__brand" markWidth={44} />
        {/*
          The rotating step copy took this slot, so the heading goes to screen
          readers only. It stays in the tree because the screen still needs one
          stable accessible name -- a heading that changed every 4.5s would not
          be one.
        */}
        <h1 id="guest-welcome-title" className="sr-only">Welcome to your stay</h1>
        <WelcomeArt index={pager.index} swipe={pager.swipe} />
        <div className="guest-welcome__message">
          <WelcomeDots index={pager.index} show={pager.show} />
          <WelcomeStepCopy index={pager.index} />
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

/** Repeated rows take a bare glyph, so these are drawn without a chip. */
const TRAVEL_ICONS: Record<TravelCategoryId, ReactNode> = {
  flights: <AirplaneTilt />,
  ferries: <Boat />,
  transfers: <Van />,
  insurance: <ShieldCheck />,
};

function extractLocationCode(place: string): string {
  const match = place.match(/\(([A-Z0-9]{3})\)/);
  if (match && match[1]) return match[1];
  const lower = place.toLowerCase();
  if (lower.includes('tagbilaran')) return 'TAG';
  if (lower.includes('pier 1') || lower.includes('cebu')) return 'CEB';
  if (lower.includes('dumaguete')) return 'DGT';
  if (lower.includes('caticlan') || lower.includes('boracay')) return 'MPH';
  if (lower.includes('manila')) return 'MNL';
  return place.slice(0, 3).toUpperCase();
}

function extractLocationName(place: string): string {
  return place.replace(/\s*\([A-Z0-9]{3}\)/, '').trim();
}

function getGuestInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'G';
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0]}${parts[parts.length - 1]![0]}`.toUpperCase();
}

function GuestAvatar({ name }: { name: string }) {
  return <span className="guest-profile-avatar" aria-hidden="true">{getGuestInitials(name)}</span>;
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
  const [selectedTravel, setSelectedTravel] = useState<TravelCategoryId>('flights');
  const [selectedFare, setSelectedFare] = useState<string | null>(null);
  const [travelParty, setTravelParty] = useState('2');
  const [travelFrom, setTravelFrom] = useState<string>('');
  const [travelTo, setTravelTo] = useState<string>('');
  const [travelFilter, setTravelFilter] = useState<'all' | 'earliest' | 'cheapest'>('all');
  const [travelPaymentMethod, setTravelPaymentMethod] = useState<'card' | 'gcash' | 'maya'>('card');
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<string>('apartment-1b');
  const [selectedMenuTab, setSelectedMenuTab] = useState<MenuItemCategory>('all');
  const [menuSort, setMenuSort] = useState<ListingSort>('recommended');
  const [menuDietary, setMenuDietary] = useState<DietaryTag[]>([]);
  const [serviceSort, setServiceSort] = useState<ListingSort>('recommended');
  const [serviceOperators, setServiceOperators] = useState<string[]>([]);
  const [serviceTypes, setServiceTypes] = useState<string[]>([]);
  const [restaurantCarts, setRestaurantCarts] = useState<Record<string, Record<string, number>>>({});
  const [diningMethod, setDiningMethod] = useState<'delivery' | 'pickup'>('delivery');
  const [diningTiming, setDiningTiming] = useState<'asap' | 'scheduled'>('asap');
  const [diningTime, setDiningTime] = useState('7:00 PM');
  const [diningOrderError, setDiningOrderError] = useState<string | null>(null);
  const [roomReadyNotificationBookingId, setRoomReadyNotificationBookingId] = useState<string | null>(null);
  const [roomReadyNotificationFocused, setRoomReadyNotificationFocused] = useState(false);

  useEffect(() => {
    if (!roomReadyNotificationBookingId || roomReadyNotificationFocused) return;

    const timeout = window.setTimeout(
      () => setRoomReadyNotificationBookingId(null),
      8_000,
    );

    return () => window.clearTimeout(timeout);
  }, [roomReadyNotificationBookingId, roomReadyNotificationFocused]);

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

  const showNav = ['stay-overview', 'marketplace', 'category-listing', 'hotel-service', 'vendor-service', 'restaurant-menu', 'restaurant-cart', 'dining-order-confirmation', 'service-booking', 'booking-confirmation', 'booking-blocked', 'my-bookings', 'cancel-before-cutoff', 'cancel-after-cutoff', 'folio', 'chat', 'chat-after-hours', 'room-qr-midstay', 'profile', 'stay-history', 'travel', 'travel-search'].includes(activeScreen);
  const showPrimaryNav = showNav && (session.auth === 'authenticated' || session.bookings.length > 0);
  const isWelcome = activeScreen === 'entry-hub';
  const primaryBooking = getPrimaryBooking(session.bookings, session.activeBookingId);
  const eligibleRoomReadyBooking = primaryBooking
    && primaryBooking.status === 'upcoming'
    && describeRoomAssignment(primaryBooking).state === 'assigned'
    && primaryBooking.roomNumber
    && primaryBooking.reportsRoomReadiness !== false
      ? primaryBooking
      : undefined;
  const roomReadyNotificationBooking = roomReadyNotificationBookingId
    ? session.bookings.find((booking) => booking.id === roomReadyNotificationBookingId)
    : undefined;
  const roomReadyNotification = roomReadyNotificationBooking
    ? describeRoomAssignment(roomReadyNotificationBooking)
    : undefined;
  const displayBooking = primaryBooking ?? MOCK_SESSION.bookings[0]!;
  const contextBooking = primaryBooking ?? displayBooking;
  const contextRoom = contextBooking.roomNumber ? `Room ${contextBooking.roomNumber}` : 'Room assigned at arrival';
  const contextService = session.serviceBookings.find(
    (service) => service.id === 'service-hilom-1' && service.bookingId === contextBooking.id,
  );

  const simulateRoomReady = () => {
    if (!eligibleRoomReadyBooking || !online) return;

    setSession((current) => ({
      ...current,
      bookings: current.bookings.map((booking) =>
        booking.id === eligibleRoomReadyBooking.id
          ? markRoomReady(booking, '2:15 PM')
          : booking,
      ),
    }));
    setRoomReadyNotificationFocused(false);
    setRoomReadyNotificationBookingId(eligibleRoomReadyBooking.id);
  };

  const openRoomReadyStay = () => {
    setRoomReadyNotificationFocused(false);
    setRoomReadyNotificationBookingId(null);
    if (activeScreen !== 'stay-overview') go('stay-overview');
  };

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
              // Cleared, not left behind: at 100% there is no next step, and a
              // stale one reads as work still owed.
              nextPreArrivalStep: undefined,
              /**
               * Pre-registration reaching the property is what prompts it to
               * allocate a room, so this is where pending becomes assigned.
               * Cabana does not choose the room -- it learns which one.
               */
              roomAssignment: booking.roomAssignment === 'ready' ? 'ready' : 'assigned',
              roomNumber: booking.roomNumber ?? '512',
              honouredPreferences: [session.roomPreferences.floor, session.roomPreferences.bed],
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
            text="Pick whichever matches where you are right now — any of them will find your stay."
          >
            <BookingEntryOptions onNavigate={go} />
            <Notice title="You’ll need a booking first">Cabana looks after your stay once your hotel booking is confirmed. It isn’t a place to search for or compare hotels.</Notice>
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
        return <ScreenIntro icon={<Receipt size={30} />} eyebrow="No stay attached" title="You’ll need a booking first" text="Cabana looks after your stay once your hotel booking is confirmed. It isn’t a place to search for or compare hotels."><Notice title="Already booked?">Try your OTA reference or ask the property to send you a secure link.</Notice>{primary('Try again', 'identify')}<TextButton onClick={() => go('front-desk-assist')}>Contact the front desk</TextButton></ScreenIntro>;

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
        return <FormScreen step="1 of 4" title="Your details" text="These details are sent securely to the property for registration."><Field label="Full name" name="guest-name" defaultValue="Ana Santos" required /><Field label="Nationality" name="nationality" defaultValue="Filipino" /><Field label="Email" name="guest-email" type="email" defaultValue="ana@example.com" /><Field label="Mobile" name="guest-mobile" type="tel" defaultValue="+63 917 555 0142" />{primary('Continue to ID', 'id-capture')}</FormScreen>;

      case 'id-capture':
        return <FormScreen step="2 of 4" title="ID or passport" text="International guests need passport details."><button className="guest-upload" type="button"><IdentificationCard size={28} /><b>Capture or upload ID</b><small>Passport, national ID, or driver’s license</small></button><Field label="Document number" name="document-number" placeholder="Enter document number" /><Field label="Expiry date" name="expiry" type="date" />{primary('Save and continue', 'additional-guests')}</FormScreen>;

      /**
       * Profile-only. Preferences used to be step 3 of pre-arrival check-in,
       * but asking a guest to re-pick a floor and a bed while they are trying
       * to check in is asking at the wrong moment -- the answer belongs to the
       * next booking, not to this arrival. The screen stays because it is
       * still where a guest changes what is on file.
       */
      case 'room-preferences':
        return (
          <div className="guest-stack">
            <div className="guest-page-title">
              <p className="guest-eyebrow">Profile preferences</p>
              <h1>Room preferences</h1>
              <p>We’ll save these above the property level and use them the next time you book.</p>
            </div>
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
                go('profile');
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
                Save preferences<ArrowRight aria-hidden="true" />
              </Button>
              <TextButton onClick={() => go('profile')}>Back to profile</TextButton>
            </form>
          </div>
        );

      case 'additional-guests':
        return (
          <FormScreen step="3 of 4" title="Who else is staying?" text="Add names only. Additional guests do not need accounts.">
            <form
              className="guest-form"
              onSubmit={(event: FormEvent<HTMLFormElement>) => {
                event.preventDefault();
                const companion = String(new FormData(event.currentTarget).get('guest-2') ?? '').trim();
                // Persisted because travel checkout needs real traveller
                // names -- carriers match them against government ID.
                setSession((cur) => ({ ...cur, additionalGuests: companion ? [companion] : [] }));
                go('early-check-in');
              }}
            >
              <Field label="Additional guest 1" name="guest-2" defaultValue="Marco Santos" />
              <button type="button" className="guest-button guest-button--secondary">Add another guest</button>
              <Notice title="One booking, one account">You stay in control of the booking. The people staying with you do not need their own accounts.</Notice>
              <Button className="guest-button guest-button--primary" type="submit">Continue<ArrowRight aria-hidden="true" /></Button>
            </form>
          </FormScreen>
        );

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

      case 'rate-detail': {
        /*
          Two separate sums, deliberately not added together. The room booking
          is prepaid through the OTA; everything below it is unpaid and settles
          with the hotel at checkout. One combined total would hide which half
          the guest still owes.
        */
        const roomCharges = getRoomCharges(session, displayBooking, contextRoom);
        return (
          <ScreenIntro eyebrow={`Booking ${displayBooking.id}`} title="Room and rate" text="The latest details returned by the hotel system.">
            <StayCard booking={displayBooking} />
            <div className="guest-summary">
              <SummaryRow label={`${displayBooking.checkOut} · ${displayBooking.roomType}`} value="₱18,000" />
              <SummaryRow label="Taxes and fees" value="₱2,160" />
              <SummaryRow label="Booking total" value="₱20,160" strong />
              <SummaryRow label={`Paid through ${displayBooking.source}`} value="₱20,160" />
            </div>
            <section>
              <SectionHeading title="Additional charges" action="Room charges" onAction={() => go('folio')} />
              {roomCharges.length ? (
                <>
                  <div className="guest-folio">
                    {roomCharges.map((charge) => (
                      <FolioItem key={charge.id} date={charge.date} title={charge.title} meta={charge.detail} amount={charge.amount} />
                    ))}
                  </div>
                  <div className="guest-summary">
                    <SummaryRow label={`Charged to ${contextRoom.toLowerCase()}`} value={sumRoomCharges(roomCharges)} strong />
                    <SummaryRow label="Settles" value="With the hotel at checkout" />
                  </div>
                </>
              ) : (
                <Notice title="Nothing charged yet">Dining, spa and hotel services you book on property are added here and settle at checkout.</Notice>
              )}
            </section>
            {!online ? <Notice tone="offline" icon={<WifiSlash />} title="Live hotel data">Availability, rates, and payment details require a connection.</Notice> : null}
          </ScreenIntro>
        );
      }

      case 'early-check-in':
        return (
          <ScreenIntro
            eyebrow="Step 4 of 4 · Arrival"
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

      case 'arrival-handoff':
        return <ScreenIntro eyebrow="Pre-arrival" title="You’re ready for arrival" text="Continue to the hotel handoff. Your room and on-property charges are settled with the hotel at checkout.">{primary('Continue to arrival', 'prereg-complete')}</ScreenIntro>;

      case 'prereg-complete': {
        const arrived = contextBooking.status === 'active';
        return <ScreenIntro icon={<Check size={30} />} eyebrow="Pre-registered" title="You’re ready for arrival" text={arrived ? 'Stop by the front desk. A team member will verify your identity and complete check-in.' : 'Your pre-arrival details are saved. Review your stay before you arrive.'}><div className="guest-timeline"><TimelineItem title="Before arrival" text="Details received by the hotel" done /><TimelineItem title="At the front desk" text="Present your original ID" /><TimelineItem title="After verification" text={`${contextRoom} becomes active in the app`} /></div>{primary('View my stay', 'stay-overview')}<TextButton onClick={() => go('stay-overview')}>View stay overview</TextButton></ScreenIntro>;
      }

      case 'prereg-queued':
        return <ScreenIntro icon={<WifiSlash size={30} />} eyebrow="Saved on this device" title="Ready to send when connected" text="Your pre-registration is safely queued. It will send automatically when a connection returns."><Notice tone="offline" title="No action needed">Your edits remain on this device. The hotel has not received them yet.</Notice>{primary('Open cached stay', 'stay-overview')}</ScreenIntro>;

      case 'marketplace': {
        const featured = SERVICES.find((service) => service.id === 'spa')!;
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
                {/*
                  No Tag here. A Tag marks the status of a thing -- Confirmed,
                  Cancelled, Completed on the cards above. An empty state has no
                  thing to mark, so one only restated the heading, in a second
                  noun ("services" over "bookings") for the same objects.
                */}
                <h2>No bookings yet</h2>
                <p>Dining, spa, tours and hotel services are on your stay home. Anything you book is added to {contextRoom.toLowerCase()} and settles at checkout.</p>
                <Button className="guest-button guest-button--primary" type="button" onClick={() => go('stay-overview')}>
                  Explore on-property<ArrowRight aria-hidden="true" />
                </Button>
              </div>
            )}

            {/*
              A promotion, not a booking. It used to sit unlabelled directly
              under the page title, which put a service card immediately above
              "No bookings yet" and read as the screen contradicting itself.
              Below the guest's own bookings, under a heading that names it as
              a suggestion, it stops competing with them.
            */}
            <section>
              <SectionHeading title="Featured on property" />
              <div className="guest-featured-service">
                <ServiceImage imageKey="spa" itemId="spa" variant="card" tone={featured.tone} icon={<Sparkle size={32} />} />
                <div>
                  <Tag>{featured.operator}</Tag>
                  <h2>{featured.name}</h2>
                  <p>Traditional Filipino therapeutic massage. {featured.price} · {featured.cutoff}.</p>
                  <button onClick={() => go('vendor-service')}>View service<ArrowRight /></button>
                </div>
              </div>
            </section>

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
                <ActionTile icon={<CategoryIcon id="dining" />} label="Food & drink" onClick={() => { setSelectedCategory('dining'); go('category-listing'); }} />
                <ActionTile icon={<CategoryIcon id="spa" />} label="Spa & wellness" onClick={() => { setSelectedCategory('spa'); go('category-listing'); }} />
                <ActionTile icon={<CategoryIcon id="entertainment" />} label="Entertainment & tours" onClick={() => { setSelectedCategory('entertainment'); go('category-listing'); }} />
                <ActionTile icon={<CategoryIcon id="services" />} label="Hotel services" onClick={() => { setSelectedCategory('services'); go('category-listing'); }} />
              </div>
            </section>
          </div>
        );
      }

      case 'category-listing': {
        const categoryData = MINI_APP_CATEGORIES.find((cat) => cat.id === selectedCategory) ?? MINI_APP_CATEGORIES[0];
        const categoryServices = SERVICES.filter((s) => s.categoryId === selectedCategory);
        // Venues carry their price as `priceRange`; aliasing it lets the shared
        // filter/sort run over them unchanged.
        const venueRows = RESTAURANTS.map((venue) => ({ ...venue, price: venue.priceRange }));
        const listingFilters = { operators: serviceOperators, types: serviceTypes, sort: serviceSort };
        const visibleVenues = filterServices(venueRows, listingFilters);
        const visibleServices = filterServices(categoryServices, listingFilters);
        const servicesNarrowed = serviceOperators.length > 0 || serviceTypes.length > 0 || serviceSort !== 'recommended';
        const clearServiceControls = () => { setServiceOperators([]); setServiceTypes([]); setServiceSort('recommended'); };
        const asOptions = (values: string[]) => values.map((value) => ({ value, label: value }));
        const buildFacets = (rows: readonly { operator: string; category: string }[]) => [
          { key: 'sort', label: 'Sort by', single: true, options: LISTING_SORTS.map((option) => ({ value: option.id, label: option.label })), selected: [serviceSort], onChange: (next: string[]) => setServiceSort(next[0] as ListingSort) },
          ...(availableTypes(rows).length ? [{ key: 'type', label: 'Type', options: asOptions(availableTypes(rows)), selected: serviceTypes, onChange: setServiceTypes }] : []),
          ...(availableOperators(rows).length ? [{ key: 'operator', label: 'Operator', options: asOptions(availableOperators(rows)), selected: serviceOperators, onChange: setServiceOperators }] : []),
        ];
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
              <>
              <ListingControls
                facets={buildFacets(venueRows)}
                count={visibleVenues.length}
                nouns={['venue', 'venues']}
                narrowed={servicesNarrowed}
                onClear={clearServiceControls}
              />
              {visibleVenues.length ? (
              <div className="guest-stack" style={{ gap: '12px' }}>
                {visibleVenues.map((res) => (
                  <button
                    key={res.id}
                    className="guest-service-row"
                    type="button"
                    onClick={() => {
                      setSelectedRestaurantId(res.id);
                      setSelectedMenuTab('all');
                      setMenuSort('recommended');
                      setMenuDietary([]);
                      go('restaurant-menu');
                    }}
                  >
                    <ServiceImage imageKey={getServiceImageKey({ id: res.id, categoryId: 'dining' })} itemId={res.id} categoryId="dining" variant="thumbnail" tone={res.tone} icon={<ForkKnife />} decorative />
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
                <Notice title="No venues match those filters">
                  Clear a filter to see all {RESTAURANTS.length} venues on property.
                </Notice>
              )}
              </>
            ) : (
              <>
              <ListingControls
                facets={buildFacets(categoryServices)}
                count={visibleServices.length}
                nouns={['service', 'services']}
                narrowed={servicesNarrowed}
                onClear={clearServiceControls}
              />
              {visibleServices.length ? (
              <div className="guest-stack" style={{ gap: '12px' }}>
                {visibleServices.map((service) => (
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
                    <ServiceImage imageKey={getServiceImageKey(service)} itemId={service.id} categoryId={service.categoryId} variant="thumbnail" tone={service.tone} icon={service.categoryId === 'spa' ? <Sparkle /> : service.categoryId === 'entertainment' ? <AirplaneTilt /> : <Storefront />} decorative />
                    <div>
                      <Tag>{service.operator}</Tag>
                      <h2>{service.name}</h2>
                      <p>{service.price} · {service.cutoff}</p>
                    </div>
                    <CaretRight />
                  </button>
                ))}
              </div>
              ) : (
                <Notice title="No services match those filters">
                  Clear a filter to see all {categoryServices.length} services in this category.
                </Notice>
              )}
              </>
            )}
          </div>
        );
      }

      case 'restaurant-menu': {
        const venue = RESTAURANTS.find((r) => r.id === selectedRestaurantId) ?? RESTAURANTS[0];
        const dietaryFacets = availableDietaryTags(venue.menu);
        const filteredMenu = filterMenu(venue.menu, { category: selectedMenuTab, dietary: menuDietary, sort: menuSort });
        const menuNarrowed = menuDietary.length > 0 || menuSort !== 'recommended';
        const clearMenuControls = () => { setMenuDietary([]); setMenuSort('recommended'); };
        const venueCart = restaurantCarts[venue.id] ?? {};
        const cartSummary = getVenueCartSummary(venue.menu, venueCart);
        return (
          <div className="guest-stack guest-restaurant-menu">
            <ServiceImage
              imageKey={getServiceImageKey({ id: venue.id, categoryId: 'dining' })}
              itemId={venue.id}
              categoryId="dining"
              variant="card"
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

            <ListingControls
              facets={[
                { key: 'sort', label: 'Sort by', single: true, options: LISTING_SORTS.map((option) => ({ value: option.id, label: option.label })), selected: [menuSort], onChange: (next: string[]) => setMenuSort(next[0] as ListingSort) },
                ...(dietaryFacets.length ? [{
                  key: 'dietary',
                  label: 'Dietary',
                  options: dietaryFacets.map((tag) => ({ value: tag, label: DIETARY_LABELS[tag] })),
                  selected: menuDietary,
                  onChange: (next: string[]) => setMenuDietary(next as DietaryTag[]),
                }] : []),
              ]}
              count={filteredMenu.length}
              nouns={['dish', 'dishes']}
              narrowed={menuNarrowed}
              onClear={clearMenuControls}
            />

            {filteredMenu.length ? (
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
            ) : (
              <Notice title="No dishes match those filters">
                {venue.name} has {venue.menu.length} dishes in total. Clear a filter to see the rest.
              </Notice>
            )}

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
        return <div className="guest-stack"><div className="guest-page-title"><p className="guest-eyebrow">This trip</p><h1>My bookings</h1><p>{contextBooking.property} · {contextRoom}</p></div>{upcomingServices.length ? <section><SectionHeading title="Upcoming" />{upcomingServices.map((service) => <button key={service.id} className="guest-booking-card" onClick={() => go('cancel-before-cutoff')} type="button"><div><Tag tone="positive">Confirmed</Tag><h2>{service.title}</h2><p>{service.scheduledFor} · {service.amount}</p><small>Third-party · on property · settles at checkout</small></div><CaretRight /></button>)}</section> : null}{pastServices.length ? <section><SectionHeading title="Past" />{pastServices.map((service) => <div key={service.id} className="guest-booking-card is-static"><div><Tag tone={service.status === 'cancelled' ? 'neutral' : 'positive'}>{service.status === 'cancelled' ? 'Cancelled' : 'Completed'}</Tag><h2>{service.title}</h2><p>{service.scheduledFor} · {service.amount}</p><small>Third-party · on property</small></div></div>)}</section> : <section><SectionHeading title="Past" /><div className="guest-booking-card is-static"><div><Tag>Completed</Tag><h2>Airport transfer</h2><p>Sun, Nov 9 · 9:00 AM · ₱1,200</p><small>Hotel arranged</small></div></div></section>}{session.travelBookings.length ? <section><SectionHeading title="Travel" />{session.travelBookings.map((leg) => <div key={leg.id} className="guest-booking-card is-static"><div><Tag tone="positive">Confirmed</Tag><h2>{leg.operator} · {leg.detail}</h2><p>{leg.route ?? leg.meta} · {leg.amount}</p><small>{leg.reference} · paid to the operator</small></div></div>)}</section> : null}{!stayServices.length && !session.travelBookings.length ? <Notice title="No upcoming services">Browse on-property services whenever you’re ready. Each approved service settles with the hotel at checkout.</Notice> : null}</div>;
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
        const folioCharges = getRoomCharges(session, contextBooking, contextRoom);
        const folioTotal = session.folioTotal || contextBooking.folioTotal || '₱0';
        return <div className="guest-stack"><div className="guest-page-title"><p className="guest-eyebrow">{contextBooking.property} · {contextRoom} · Last updated 2:14 PM</p><h1>Room charges</h1><p>These charges settle with the hotel at checkout.</p></div>{!online ? <Notice tone="offline" title="Last-known folio">Reconnect for the latest charges.</Notice> : null}<div className="guest-total-card"><span>Current room total</span><strong>{folioTotal}</strong><small>Booking room rate paid through {contextBooking.source}</small></div><div className="guest-folio">{folioCharges.map((charge) => <FolioItem key={charge.id} date={charge.date} title={charge.title} meta={charge.detail} amount={charge.amount} />)}</div><Notice title="Questions about a charge?">The front desk can explain or correct a folio line before checkout.</Notice>{primary('Ask the front desk', 'chat')}</div>;
      }

      case 'chat':
      case 'chat-after-hours': {
        const afterHours = activeScreen === 'chat-after-hours';
        return <div className="guest-chat"><div className="guest-chat__intro"><div><Tag tone={afterHours ? 'warning' : 'positive'}>{afterHours ? 'Outside staffed hours' : 'Front desk online'}</Tag><h1>Front desk</h1><p>{afterHours ? `Messages send now. The team responds from 6:00 AM for ${contextBooking.property}.` : `Shared property inbox for ${contextBooking.property} · Usually replies in a few minutes.`}</p></div></div>{!online ? <Notice tone="offline" title="Messages will send when connected">Your chat history is available. New requests wait on this device.</Notice> : null}<div className="guest-quick-actions" aria-label="Quick requests"><button onClick={() => sendQuickMessage('Could we get two fresh towels, please?')}>Towels</button><button onClick={() => sendQuickMessage(`Please arrange housekeeping for ${contextRoom.toLowerCase()}.`)}>Housekeeping</button><button onClick={() => sendQuickMessage('Can we request a late checkout?')}>Late checkout</button><button onClick={() => sendQuickMessage('We need help arranging a transfer.')}>Transfers</button></div><div className="guest-messages" aria-live="polite">{chatMessages.map((message, index) => <div key={`${message.body}-${index}`} className={`guest-message guest-message--${message.from}`}><p>{message.body}</p>{message.state ? <small>{message.state}</small> : null}</div>)}{sending ? <div className="guest-message guest-message--desk guest-message--typing"><SpinnerGap className="guest-spin" /><span>Front desk is replying</span></div> : null}</div><form className="guest-composer" onSubmit={(event: FormEvent<HTMLFormElement>) => { event.preventDefault(); const form = new FormData(event.currentTarget); const body = String(form.get('message') ?? '').trim(); if (body) sendQuickMessage(body); event.currentTarget.reset(); }}><label className="sr-only" htmlFor="message">Message the front desk</label><input id="message" name="message" placeholder="Ask the front desk" /><button aria-label="Send message" type="submit"><ArrowRight /></button></form></div>;
      }

      case 'room-qr-midstay':
        return <ScreenIntro icon={<CheckCircle size={30} />} eyebrow={`${contextRoom} linked`} title="You’re checked in" text="Pre-arrival steps are no longer relevant. Go straight to services, your room charges, or the front desk."><StayMiniCard booking={contextBooking} status={`Active until ${contextBooking.checkOut}`} />{primary('Explore services', 'marketplace')}<button className="guest-button guest-button--secondary" onClick={() => go('stay-overview')}>Open stay overview</button></ScreenIntro>;

      /**
       * Travel is a peer of Bookings, not a category inside it: this inventory
       * comes from carriers and transport vendors rather than the hotel's PMS,
       * happens between stays, and cannot settle on a room folio. See
       * docs/superpowers/specs/2026-09-09-travel-booking-destination-design.md.
       */
      case 'travel':
        return (
          <div className="guest-stack">
            <div className="guest-page-title">
              <p className="guest-eyebrow">Travel</p>
              <h1>Get there, and onward</h1>
              <p>Book the legs between stays — flights, sailings, and the ride to your next hotel.</p>
            </div>

            {/* Flighty Live Journey Radar Hero Card */}
            <div className="guest-flighty-radar-card" role="region" aria-label="Live Journey Radar">
              <div className="guest-flighty-radar-card__header">
                <div className="guest-flighty-radar-live">
                  <span className="guest-flighty-radar-beacon" aria-hidden="true" />
                  <span className="guest-flighty-radar-label">LIVE RADAR · FLIGHT TELEMETRY</span>
                </div>
                <span className="guest-flighty-status-pill">
                  <span className="guest-flighty-status-dot" aria-hidden="true" /> ON TIME · 98% RELIABLE
                </span>
              </div>

              <div className="guest-flighty-radar-card__body">
                <div className="guest-flighty-radar-carrier">
                  <CarrierLogo operator="Cebu Pacific" size={24} />
                  <div>
                    <strong className="guest-flighty-radar-flight-num">5J 921 · Airbus A320neo</strong>
                    <small className="guest-flighty-radar-route-sub">Manila ➔ Cagayan de Oro</small>
                  </div>
                </div>

                <div className="guest-flighty-radar-route">
                  <div className="guest-flighty-radar-node">
                    <span className="guest-flighty-radar-iata">MNL</span>
                    <span className="guest-flighty-radar-city">Manila</span>
                    <span className="guest-flighty-radar-gate">
                      <NavigationArrow size={10} weight="fill" aria-hidden="true" /> Gate 118
                    </span>
                    <span className="guest-flighty-radar-time">09:15</span>
                  </div>

                  <div className="guest-flighty-radar-path">
                    <span className="guest-flighty-radar-duration">1h 50m</span>
                    <div className="guest-flighty-radar-line">
                      <span className="guest-flighty-radar-dot" aria-hidden="true" />
                      <div className="guest-flighty-radar-dash">
                        <AirplaneTilt size={14} weight="fill" className="guest-flighty-radar-plane" aria-hidden="true" />
                      </div>
                      <span className="guest-flighty-radar-dot" aria-hidden="true" />
                    </div>
                    <span className="guest-flighty-radar-status">Cruising 32,000 ft</span>
                  </div>

                  <div className="guest-flighty-radar-node is-dest">
                    <span className="guest-flighty-radar-iata">CGY</span>
                    <span className="guest-flighty-radar-city">Cagayan de Oro</span>
                    <span className="guest-flighty-radar-belt">
                      <SuitcaseRolling size={10} weight="bold" aria-hidden="true" /> Belt 4
                    </span>
                    <span className="guest-flighty-radar-time">11:05</span>
                  </div>
                </div>

                <div className="guest-flighty-radar-strip">
                  <div className="guest-flighty-radar-stat">
                    <span className="guest-flighty-stat-label">Boarding</span>
                    <span className="guest-flighty-stat-val">08:35 (T3)</span>
                  </div>
                  <div className="guest-flighty-radar-stat">
                    <span className="guest-flighty-stat-label">Aircraft</span>
                    <span className="guest-flighty-stat-val">RP-C4118</span>
                  </div>
                  <div className="guest-flighty-radar-stat">
                    <span className="guest-flighty-stat-label">Tail Wind</span>
                    <span className="guest-flighty-stat-val">18 kts ENE</span>
                  </div>
                </div>
              </div>

              <div className="guest-flighty-radar-card__footer">
                <button
                  type="button"
                  className="guest-flighty-radar-action"
                  onClick={() => {
                    setSelectedTravel('flights');
                    setSelectedFare(null);
                    setTravelFrom('Manila (MNL)');
                    setTravelTo('Cagayan de Oro (CGY)');
                    go('travel-search');
                  }}
                >
                  <span>Track & book this leg</span>
                  <ArrowRight size={14} weight="bold" aria-hidden="true" />
                </button>
              </div>
            </div>

            {/* Flighty Transit Modes Grid */}
            <div className="guest-travel-cat-grid" role="list">
              {TRAVEL_CATEGORIES.map((category) => {
                const modeCode = category.id === 'flights' ? 'AIR · 01' : category.id === 'ferries' ? 'SEA · 02' : category.id === 'transfers' ? 'LND · 03' : 'COV · 04';
                const tag = category.id === 'flights' ? 'Flagship & LCC' : category.id === 'ferries' ? 'Fast Craft' : category.id === 'transfers' ? 'Chauffeur' : 'Instant';
                const priceText = category.id === 'flights' ? 'From ₱3,620' : category.id === 'ferries' ? 'From ₱980' : category.id === 'transfers' ? 'From ₱480' : 'From ₱390';

                return (
                  <button
                    key={category.id}
                    className="guest-travel-cat-card"
                    type="button"
                    onClick={() => {
                      setSelectedTravel(category.id);
                      setSelectedFare(null);
                      setTravelFrom('');
                      setTravelTo('');
                      go('travel-search');
                    }}
                  >
                    <div className="guest-travel-cat-card__header">
                      <span className="guest-flighty-mode-badge">{modeCode}</span>
                      <span className="guest-travel-cat-card__pill">{tag}</span>
                    </div>
                    <div className="guest-travel-cat-card__icon-wrap">
                      <span className="guest-travel-cat-card__icon">{TRAVEL_ICONS[category.id]}</span>
                    </div>
                    <div className="guest-travel-cat-card__content">
                      <b>{category.title}</b>
                      <small>{category.subtitle}</small>
                    </div>
                    <div className="guest-travel-cat-card__meta">
                      <span className="guest-travel-cat-card__price">{priceText}</span>
                      <CaretRight size={14} aria-hidden="true" />
                    </div>
                  </button>
                );
              })}
            </div>

            <section className="guest-travel-section">
              <div className="guest-section-heading">
                <h2>Popular island routes</h2>
              </div>
              <div className="guest-flighty-booking-cards" role="list">
                {POPULAR_ROUTES.map((route) => {
                  const actionLabel = route.category === 'flights' ? 'Book flight' : route.category === 'ferries' ? 'Book ferry' : 'Book ride';
                  const destImage = getRouteDestinationImage(route.id);

                  return (
                    <button
                      key={route.id}
                      type="button"
                      className="guest-flighty-booking-card"
                      onClick={() => {
                        setSelectedTravel(route.category);
                        setSelectedFare(null);
                        setTravelFrom(route.origin);
                        setTravelTo(route.destination);
                        go('travel-search');
                      }}
                    >
                      {/* Top Header: Airline logo, flight number, aircraft, and status badge */}
                      <div className="guest-flighty-booking-card__top">
                        <div className="guest-flighty-booking-card__carrier">
                          <CarrierLogo operator={route.operators[0] ?? ''} size={30} />
                          <div>
                            <div className="guest-flighty-booking-card__carrier-title">
                              <strong>{route.operators[0]}</strong>
                              {route.flightNumber ? (
                                <span className="guest-flighty-booking-card__flight-code">{route.flightNumber}</span>
                              ) : null}
                            </div>
                            <div className="guest-flighty-booking-card__aircraft-meta">
                              <span>{route.aircraft ?? 'Scheduled Craft'}</span>
                              <span className="guest-flighty-dot-sep">·</span>
                              <span>{route.cabinClass ?? 'Standard'}</span>
                            </div>
                          </div>
                        </div>

                        <div className="guest-flighty-booking-card__header-right">
                          <div className="guest-flighty-booking-card__badges">
                            <span className="guest-flighty-status-pill is-sm">
                              <span className="guest-flighty-status-dot" aria-hidden="true" /> {route.onTimeRate ?? 'ON TIME'}
                            </span>
                            <span className="guest-flighty-tag-pill">{route.tag}</span>
                          </div>
                          <div className="guest-flighty-dest-thumb" aria-hidden="true">
                            <Image
                              src={destImage.src}
                              alt=""
                              fill
                              sizes="44px"
                              style={{ objectPosition: destImage.focalPoint, objectFit: 'cover' }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Flight Route & Dual Node Telemetry */}
                      <div className="guest-flighty-booking-card__route-telemetry">
                        {/* Origin Node */}
                        <div className="guest-flighty-booking-card__node">
                          <span className="guest-flighty-booking-card__time">{route.departureTime ?? '07:15'}</span>
                          <span className="guest-flighty-booking-card__iata">{route.originCode}</span>
                          <span className="guest-flighty-booking-card__city">{route.originCity ?? route.origin}</span>
                          {route.gate ? (
                            <span className="guest-flighty-gate-tag">
                              <NavigationArrow size={10} weight="fill" aria-hidden="true" /> {route.gate}
                            </span>
                          ) : null}
                        </div>

                        {/* Flight Track */}
                        <div className="guest-flighty-booking-card__track">
                          <span className="guest-flighty-booking-card__duration">
                            <Clock size={11} weight="bold" aria-hidden="true" /> {route.duration}
                          </span>
                          <div className="guest-flighty-booking-card__flight-line">
                            <span className="guest-flighty-booking-card__line-dot" aria-hidden="true" />
                            <div className="guest-flighty-booking-card__glyph-wrap">
                              {route.category === 'flights' ? (
                                <AirplaneTilt size={14} weight="fill" className="guest-flighty-booking-card__glyph" aria-hidden="true" />
                              ) : route.category === 'ferries' ? (
                                <Boat size={14} weight="fill" className="guest-flighty-booking-card__glyph" aria-hidden="true" />
                              ) : (
                                <Van size={14} weight="fill" className="guest-flighty-booking-card__glyph" aria-hidden="true" />
                              )}
                            </div>
                            <span className="guest-flighty-booking-card__line-dot" aria-hidden="true" />
                          </div>
                          <span className="guest-flighty-booking-card__type">Non-stop Direct</span>
                        </div>

                        {/* Destination Node */}
                        <div className="guest-flighty-booking-card__node is-dest">
                          <span className="guest-flighty-booking-card__time">{route.arrivalTime ?? '08:20'}</span>
                          <span className="guest-flighty-booking-card__iata">{route.destCode}</span>
                          <span className="guest-flighty-booking-card__city">{route.destCity ?? route.destination}</span>
                          {route.destTerminal ? (
                            <span className="guest-flighty-terminal">{route.destTerminal}</span>
                          ) : null}
                        </div>
                      </div>

                      {/* Inclusions Chips */}
                      {route.inclusions && route.inclusions.length > 0 ? (
                        <div className="guest-flighty-booking-card__inclusions">
                          {route.inclusions.map((inc) => (
                            <span key={inc} className="guest-flighty-booking-card__inc-pill">
                              <Check size={11} weight="bold" aria-hidden="true" /> {inc}
                            </span>
                          ))}
                        </div>
                      ) : null}

                      {/* Card Footer: Starting Price + Airline Booking Button */}
                      <div className="guest-flighty-booking-card__bottom">
                        <div className="guest-flighty-booking-card__fare-lockup">
                          <span className="guest-flighty-booking-card__fare-label">Starting fare per guest</span>
                          <strong className="guest-flighty-booking-card__fare-price">From {route.startingPrice}</strong>
                        </div>

                        <span className="guest-flighty-booking-card__cta">
                          <span>{actionLabel}</span>
                          <ArrowRight size={14} weight="bold" aria-hidden="true" />
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="guest-travel-section">
              <div className="guest-travel-carrier-banner">
                <div className="guest-travel-carrier-banner__head">
                  <span className="guest-carrier-trust-badge">
                    <ShieldCheck size={14} weight="fill" aria-hidden="true" /> Verified Partner Network
                  </span>
                  <p>Direct inventory from Philippine flagships, fast craft, and trusted underwriters.</p>
                </div>
                <div className="guest-travel-carrier-pills">
                  <div className="guest-carrier-pill"><CarrierLogo operator="Philippine Airlines" size={20} /><span>Philippine Airlines</span></div>
                  <div className="guest-carrier-pill"><CarrierLogo operator="Cebu Pacific" size={20} /><span>Cebu Pacific</span></div>
                  <div className="guest-carrier-pill"><CarrierLogo operator="AirAsia" size={20} /><span>AirAsia</span></div>
                  <div className="guest-carrier-pill"><CarrierLogo operator="OceanJet" size={20} /><span>OceanJet</span></div>
                  <div className="guest-carrier-pill"><CarrierLogo operator="2GO Travel" size={20} /><span>2GO Travel</span></div>
                  <div className="guest-carrier-pill"><CarrierLogo operator="Lite Ferries" size={20} /><span>Lite Ferries</span></div>
                  <div className="guest-carrier-pill"><CarrierLogo operator="The Henry Fleet" size={20} /><span>The Henry Fleet</span></div>
                  <div className="guest-carrier-pill"><CarrierLogo operator="Pioneer Insurance" size={20} /><span>Pioneer</span></div>
                </div>
              </div>
            </section>

            <Notice title="Paid to the operator">
              Travel is settled with the carrier or vendor. Only on-property charges reach your room folio.
            </Notice>
          </div>
        );

      /**
       * One screen for all four categories. They differ only in their labels
       * and their inventory, which is data -- four bespoke screens would drift.
       */
      case 'travel-search': {
        const category = getTravelCategory(selectedTravel);
        const fare = category.options.find((option) => option.id === selectedFare);

        const currentFrom = (category.route && travelFrom && category.route.places.includes(travelFrom))
          ? travelFrom
          : category.route?.defaultFrom ?? '';
        const currentTo = (category.route && travelTo && category.route.places.includes(travelTo))
          ? travelTo
          : category.route?.defaultTo ?? '';

        const displayedOptions = [...category.options];
        if (travelFilter === 'earliest') {
          displayedOptions.sort((a, b) => (a.departureTime || '').localeCompare(b.departureTime || ''));
        } else if (travelFilter === 'cheapest') {
          displayedOptions.sort((a, b) => parsePesoAmount(a.price) - parsePesoAmount(b.price));
        }

        return (
          <div className="guest-stack">
            <div className="guest-page-title">
              <p className="guest-eyebrow">Travel · {category.title}</p>
              <h1>{category.route ? 'Choose your leg' : 'Cover your trip'}</h1>
              <p>{category.subtitle}</p>
            </div>
            <div className="guest-form">
              {category.route ? (
                <div className="guest-travel-search-box">
                  <div className="guest-travel-route-pair">
                    <SelectField
                      label={category.route.fromLabel}
                      name="travel-from"
                      value={currentFrom}
                      onValueChange={setTravelFrom}
                    >
                      {category.route.places.map((place) => <option key={place} value={place}>{place}</option>)}
                    </SelectField>
                    <button
                      type="button"
                      className="guest-travel-swap-button"
                      aria-label="Swap departure and arrival"
                      title="Swap departure and arrival"
                      onClick={() => {
                        const fromVal = currentFrom;
                        const toVal = currentTo;
                        setTravelFrom(toVal);
                        setTravelTo(fromVal);
                      }}
                    >
                      <ArrowsDownUp size={16} />
                    </button>
                    <SelectField
                      label={category.route.toLabel}
                      name="travel-to"
                      value={currentTo}
                      onValueChange={setTravelTo}
                    >
                      {category.route.places.map((place) => <option key={place} value={place}>{place}</option>)}
                    </SelectField>
                  </div>
                </div>
              ) : null}
              <div className="guest-travel-dates-row">
                <Field
                  label={category.route ? 'Date' : 'Trip starts'}
                  name="travel-date"
                  type="date"
                  defaultValue={contextBooking.checkIn}
                />
                <SelectField
                  label={category.partyLabel}
                  name="travel-party"
                  value={travelParty}
                  onValueChange={setTravelParty}
                >
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                  <option value="4">4</option>
                </SelectField>
              </div>
            </div>
            <div className="guest-section-heading">
              <h2>{category.route ? 'Available departures' : 'Available plans'}</h2>
              {category.route ? (
                <div className="guest-filter-pills" role="tablist" aria-label="Sort options">
                  <button
                    type="button"
                    className={`guest-filter-pill ${travelFilter === 'all' ? 'is-active' : ''}`}
                    onClick={() => setTravelFilter('all')}
                  >
                    All
                  </button>
                  <button
                    type="button"
                    className={`guest-filter-pill ${travelFilter === 'earliest' ? 'is-active' : ''}`}
                    onClick={() => setTravelFilter('earliest')}
                  >
                    Earliest
                  </button>
                  <button
                    type="button"
                    className={`guest-filter-pill ${travelFilter === 'cheapest' ? 'is-active' : ''}`}
                    onClick={() => setTravelFilter('cheapest')}
                  >
                    Cheapest
                  </button>
                </div>
              ) : null}
            </div>
            <div className="guest-travel-options" role="group" aria-label={`${category.title} options`}>
              {displayedOptions.map((option) => {
                const isSelected = option.id === selectedFare;
                const originCode = category.route ? extractLocationCode(currentFrom) : null;
                const destCode = category.route ? extractLocationCode(currentTo) : null;
                const originCity = category.route ? extractLocationName(currentFrom) : null;
                const destCity = category.route ? extractLocationName(currentTo) : null;

                return (
                  <button
                    key={option.id}
                    className={`guest-travel-option ${isSelected ? 'is-selected' : ''}`}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => setSelectedFare(option.id)}
                  >
                    <div className="guest-travel-option__header">
                      <div className="guest-travel-option__brand">
                        <CarrierLogo operator={option.operator} size={32} />
                        <div>
                          <b>{option.operator}</b>
                          <div className="guest-travel-carrier-sub">
                            {option.carrierCode ? (
                              <span className="guest-travel-carrier-code">{option.carrierCode}</span>
                            ) : null}
                            {option.vesselOrVehicle ? (
                              <span className="guest-flighty-vessel-badge">{option.vesselOrVehicle}</span>
                            ) : null}
                          </div>
                        </div>
                      </div>
                      <div className="guest-travel-option__badges">
                        {option.onTimeRate ? (
                          <span className="guest-flighty-status-pill is-sm">
                            <span className="guest-flighty-status-dot" aria-hidden="true" /> {option.onTimeRate}
                          </span>
                        ) : null}
                        {option.badge ? (
                          <span className="guest-travel-badge-pill">{option.badge}</span>
                        ) : null}
                      </div>
                    </div>

                    {option.departureTime && option.arrivalTime ? (
                      <div className="guest-travel-timeline">
                        <div className="guest-travel-time-point">
                          <span className="guest-travel-time-main">{option.departureTime}</span>
                          <span className="guest-travel-code">{originCode} · {originCity}</span>
                          {option.gate ? (
                            <span className="guest-flighty-gate-tag">
                              <NavigationArrow size={10} weight="fill" aria-hidden="true" /> {option.gate}
                            </span>
                          ) : null}
                          {option.terminal ? (
                            <span className="guest-flighty-terminal">{option.terminal}</span>
                          ) : null}
                        </div>

                        <div className="guest-travel-flight-path">
                          <span className="guest-travel-duration">{option.duration ?? 'Direct'}</span>
                          <div className="guest-travel-flight-line">
                            <span className="guest-travel-line-dot" aria-hidden="true" />
                            <span className="guest-travel-line-glyph">
                              {category.id === 'flights' ? (
                                <AirplaneTilt size={14} weight="fill" aria-hidden="true" />
                              ) : category.id === 'ferries' ? (
                                <Boat size={14} weight="fill" aria-hidden="true" />
                              ) : (
                                <Van size={14} weight="fill" aria-hidden="true" />
                              )}
                            </span>
                            <span className="guest-travel-line-dot" aria-hidden="true" />
                          </div>
                          <span className="guest-travel-path-sub">Non-stop</span>
                        </div>

                        <div className="guest-travel-time-point is-destination">
                          <span className="guest-travel-time-main">{option.arrivalTime}</span>
                          <span className="guest-travel-code">{destCode} · {destCity}</span>
                          {option.baggageBelt ? (
                            <span className="guest-flighty-baggage-tag">
                              <SuitcaseRolling size={10} weight="bold" aria-hidden="true" /> {option.baggageBelt}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    ) : null}

                    <div className="guest-travel-option__meta">
                      <small>{option.detail} · {option.meta}</small>
                    </div>

                    {option.inclusions && option.inclusions.length > 0 ? (
                      <div className="guest-travel-inclusions">
                        {option.inclusions.map((tag) => (
                          <span key={tag} className="guest-travel-tag">
                            <Check size={11} weight="bold" aria-hidden="true" />
                            {tag}
                          </span>
                        ))}
                      </div>
                    ) : null}

                    <div className="guest-travel-option__footer">
                      <div>
                        <span className="guest-travel-price-caption">
                          {category.partyLabel === 'Passengers' ? 'Per passenger' : 'Per policy'}
                        </span>
                        <strong className="guest-travel-price-val">{option.price}</strong>
                      </div>
                      {isSelected ? (
                        <span className="guest-flighty-selected-indicator">
                          <CheckCircle size={16} weight="fill" aria-hidden="true" /> Selected
                        </span>
                      ) : (
                        <span className="guest-flighty-select-prompt">Select fare <CaretRight size={12} aria-hidden="true" /></span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
            {fare ? (
              <>
                <div className="guest-summary">
                  <SummaryRow label={fare.operator} value={fare.detail} />
                  <SummaryRow label={category.partyLabel} value={travelParty} />
                  <SummaryRow label="Fare each" value={fare.price} />
                </div>
                {primary('Continue to checkout', 'travel-checkout')}
              </>
            ) : null}
          </div>
        );
      }

      /**
       * Travel is paid to the operator at booking, never to the room folio: a
       * flight is not the hotel's to bill, and a guest may book one before
       * arrival or after checkout when no folio is open. That is why this is
       * its own checkout rather than the service flow's folio confirmation.
       */
      case 'travel-checkout': {
        const category = getTravelCategory(selectedTravel);
        const fare = category.options.find((option) => option.id === selectedFare);
        if (!fare) return <ScreenIntro eyebrow="Travel" title="Choose a fare first" text="Pick an option to continue to checkout.">{primary('Back to search', 'travel-search')}</ScreenIntro>;

        const partySize = Number(travelParty);
        const quote = quoteTravel(fare, partySize);
        const routeLabel = category.route
          ? `${category.route.defaultFrom} → ${category.route.defaultTo}`
          : null;
        /**
         * Travellers come from what the app already holds. Philippine carriers
         * match passenger names to government ID, and Cabana captured the
         * guest's during pre-arrival -- so this confirms rather than asks.
         */
        const travellers = [session.guestName, ...session.additionalGuests]
          .filter(Boolean)
          .slice(0, partySize);
        const idOnFile = contextBooking.preArrivalCompleted >= 2;
        /** Live fares cannot be queued: the price moves while you are offline. */
        const canPay = online;

        return (
          <div className="guest-stack">
            <div className="guest-page-title">
              <p className="guest-eyebrow">Travel · {category.title}</p>
              <h1>Confirm and pay</h1>
              <p>{routeLabel ?? 'Cover for the whole trip'}</p>
            </div>

            {/* Itinerary / Flighty Passbook Ticket preview */}
            <div className="guest-travel-ticket-preview">
              <div className="guest-travel-ticket-preview__notch-left" aria-hidden="true" />
              <div className="guest-travel-ticket-preview__notch-right" aria-hidden="true" />

              <div className="guest-travel-ticket-preview__top">
                <div className="guest-travel-ticket-preview__carrier">
                  <CarrierLogo operator={fare.operator} size={28} />
                  <div>
                    <strong>{fare.operator}</strong>
                    <small>{fare.carrierCode ?? fare.detail}</small>
                  </div>
                </div>
                <span className="guest-flighty-status-pill is-sm">
                  <span className="guest-flighty-status-dot" aria-hidden="true" /> ON SCHEDULE
                </span>
              </div>

              {routeLabel ? (
                <div className="guest-travel-ticket-preview__route">
                  <div className="guest-travel-ticket-point">
                    <span>{category.route ? extractLocationCode(category.route.defaultFrom) : 'DEP'}</span>
                    <small>{fare.departureTime ?? 'Depart'}</small>
                    {fare.terminal ? <span className="guest-flighty-ticket-sub">{fare.terminal}</span> : null}
                  </div>
                  <div className="guest-travel-ticket-line">
                    <span>{fare.duration ?? ''}</span>
                    <div className="guest-travel-ticket-dash" />
                    <span className="guest-flighty-ticket-nonstop">Non-stop</span>
                  </div>
                  <div className="guest-travel-ticket-point is-end">
                    <span>{category.route ? extractLocationCode(category.route.defaultTo) : 'ARR'}</span>
                    <small>{fare.arrivalTime ?? 'Arrive'}</small>
                    {fare.gate ? <span className="guest-flighty-ticket-sub">{fare.gate}</span> : null}
                  </div>
                </div>
              ) : (
                <div className="guest-travel-ticket-preview__policy">
                  <strong>{fare.detail}</strong>
                  <small>{fare.meta}</small>
                </div>
              )}

              <div className="guest-travel-ticket-preview__footer">
                <span>Date: {contextBooking.checkIn}</span>
                <span>{partySize} {category.partyLabel.toLowerCase()}</span>
              </div>
            </div>

            <SectionHeading title={category.partyLabel} />
            <div className="guest-list-group">
              {travellers.map((name, index) => (
                <div className="guest-list-row is-static" key={name}>
                  <span><Person /></span>
                  <div>
                    <b>{name}</b>
                    <small>{index === 0 && idOnFile ? 'ID on file from check-in' : 'ID needed before travel'}</small>
                  </div>
                  {index === 0 && idOnFile ? <Check /> : null}
                </div>
              ))}
              {travellers.length < partySize ? (
                <div className="guest-list-row is-static">
                  <span><Users /></span>
                  <div>
                    <b>{partySize - travellers.length} more traveller{partySize - travellers.length > 1 ? 's' : ''}</b>
                    <small>Names needed before travel</small>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="guest-summary">
              <SummaryRow label={fare.operator} value={fare.detail} />
              <SummaryRow label={`Fare × ${partySize}`} value={quote.fareTotal} />
              <SummaryRow label="Booking fee" value={quote.fees} />
              <SummaryRow label={`Paid to ${fare.operator}`} value={quote.total} strong />
            </div>

            {canPay ? (
              <>
                <div className="guest-travel-payment-methods">
                  <span className="guest-travel-payment-label">Payment method</span>
                  <div className="guest-travel-payment-pills" role="radiogroup" aria-label="Payment method">
                    <button
                      type="button"
                      className={`guest-payment-chip ${travelPaymentMethod === 'card' ? 'is-selected' : ''}`}
                      onClick={() => setTravelPaymentMethod('card')}
                    >
                      <CreditCard size={15} /> Card
                    </button>
                    <button
                      type="button"
                      className={`guest-payment-chip ${travelPaymentMethod === 'gcash' ? 'is-selected' : ''}`}
                      onClick={() => setTravelPaymentMethod('gcash')}
                    >
                      GCash
                    </button>
                    <button
                      type="button"
                      className={`guest-payment-chip ${travelPaymentMethod === 'maya' ? 'is-selected' : ''}`}
                      onClick={() => setTravelPaymentMethod('maya')}
                    >
                      Maya
                    </button>
                  </div>
                </div>

                <Notice title="Not charged to your room">
                  Travel is paid now to the operator. Only on-property charges reach your room folio.
                </Notice>
                <Button
                  className="guest-button guest-button--primary"
                  type="button"
                  onClick={() => {
                    setSession((cur) => bookTravel(cur, {
                      category,
                      option: fare,
                      travellers: partySize,
                      route: routeLabel,
                      date: contextBooking.checkIn,
                    }));
                    go('travel-confirmation');
                  }}
                >
                  Pay {quote.total}<ArrowRight aria-hidden="true" />
                </Button>
              </>
            ) : (
              <>
                <Notice tone="offline" title="Nothing was booked">
                  Fares and seats change while you are offline, so this one is not held. Reconnect and the price is re-checked before you pay.
                </Notice>
                <TextButton onClick={() => { setOnline(true); }}>Reconnect and try again</TextButton>
              </>
            )}
          </div>
        );
      }

      case 'travel-confirmation': {
        const category = getTravelCategory(selectedTravel);
        const booked = session.travelBookings[session.travelBookings.length - 1];
        if (!booked) return <ScreenIntro eyebrow="Travel" title="Nothing booked yet" text="Choose a fare to get started.">{primary('Back to travel', 'travel')}</ScreenIntro>;
        return (
          <ScreenIntro
            icon={<Check size={30} />}
            eyebrow="Paid to the operator"
            title={`Your ${category.singular} is booked`}
            text={`${booked.operator} has your booking. Nothing was added to your room folio.`}
          >
            <div className="guest-travel-confirmation-pass">
              <div className="guest-travel-confirmation-pass__notch-left" aria-hidden="true" />
              <div className="guest-travel-confirmation-pass__notch-right" aria-hidden="true" />

              <div className="guest-travel-confirmation-pass__header">
                <CarrierLogo operator={booked.operator} size={28} />
                <div className="guest-travel-confirmation-pass__operator">
                  <strong>{booked.operator}</strong>
                  <small>{booked.route ?? booked.meta}</small>
                </div>
                <Tag tone="positive">Confirmed</Tag>
              </div>

              <div className="guest-travel-confirmation-pass__body">
                <div className="guest-travel-pass-row">
                  <div>
                    <span className="guest-pass-label">Reference</span>
                    <strong className="guest-pass-value">{booked.reference}</strong>
                  </div>
                  <div>
                    <span className="guest-pass-label">Schedule</span>
                    <strong className="guest-pass-value">{booked.detail}</strong>
                  </div>
                </div>
                <div className="guest-travel-pass-row">
                  <div>
                    <span className="guest-pass-label">Travellers</span>
                    <strong className="guest-pass-value">{booked.travellers} guest{booked.travellers > 1 ? 's' : ''}</strong>
                  </div>
                  <div>
                    <span className="guest-pass-label">Total Paid</span>
                    <strong className="guest-pass-value">{booked.amount}</strong>
                  </div>
                </div>
              </div>

              <div className="guest-travel-pass-barcode" aria-hidden="true">
                <div className="guest-travel-barcode-lines">
                  <span style={{ width: 2 }} />
                  <span style={{ width: 4 }} />
                  <span style={{ width: 1 }} />
                  <span style={{ width: 3 }} />
                  <span style={{ width: 2 }} />
                  <span style={{ width: 5 }} />
                  <span style={{ width: 1 }} />
                  <span style={{ width: 4 }} />
                  <span style={{ width: 2 }} />
                  <span style={{ width: 3 }} />
                  <span style={{ width: 1 }} />
                  <span style={{ width: 4 }} />
                  <span style={{ width: 3 }} />
                  <span style={{ width: 1 }} />
                  <span style={{ width: 2 }} />
                  <span style={{ width: 4 }} />
                </div>
                <span className="guest-travel-barcode-code">{booked.reference} · E-TICKET ISSUED</span>
              </div>

              <div className="guest-flighty-wallet-action">
                <button type="button" className="guest-flighty-wallet-button">
                  <Ticket size={15} weight="bold" aria-hidden="true" /> Add to Apple Wallet
                </button>
              </div>
            </div>
            <Notice title="Bring government ID">
              Philippine carriers check passenger names against ID at the gate. The name on this booking must match the ID each traveller brings.
            </Notice>
            {primary('View my bookings', 'my-bookings')}
            <TextButton onClick={() => go('travel')}>Book another leg</TextButton>
          </ScreenIntro>
        );
      }

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
    <div className="guest-prototype-stage">
      <div className="sr-only" role="status" aria-live="polite">
        {roomReadyNotification ? `${roomReadyNotification.headline}. ${roomReadyNotification.detail}` : ''}
      </div>

      {eligibleRoomReadyBooking ? (
        <PrototypeControls online={online} onSimulateRoomReady={simulateRoomReady} />
      ) : null}

      {roomReadyNotification ? (
        <RoomReadyNotification
          headline={roomReadyNotification.headline}
          detail={roomReadyNotification.detail}
          onViewStay={openRoomReadyStay}
          onDismiss={() => {
            setRoomReadyNotificationFocused(false);
            setRoomReadyNotificationBookingId(null);
          }}
          onFocusChange={setRoomReadyNotificationFocused}
        />
      ) : null}

      <main className="guest-prototype guest-app">
        <section className={`guest-device ${isWelcome ? 'is-welcome' : ''}`} aria-label="Cabana guest app">
          {!isWelcome ? <header className="guest-appbar" data-scrolled={scrolled}>
            <div className="guest-appbar__side">
              {activeScreen !== 'stay-overview' ? <button className="guest-icon-button guest-icon-button--back" type="button" onClick={history.length ? back : () => go('stay-overview')} aria-label="Go back"><ArrowLeft /></button> : <span className="guest-brand"><CabanaLockup className="guest-brand__lockup" /><span className="sr-only">Cabana</span></span>}
            </div>
            {/* Connection is only worth a slot when it is the exception. */}
            <div className="guest-appbar__center">{online ? null : <span className="guest-connection"><WifiSlash />Offline</span>}</div>
            {/* No profile to open before there is an account to open it for. */}
            <div className="guest-appbar__side guest-appbar__side--end">
              {session.auth === 'authenticated' || session.bookings.length > 0 ? <button className="guest-icon-button" type="button" onClick={() => go('profile')} aria-label="Open profile"><GuestAvatar name={session.guestName} /></button> : null}
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

          {showPrimaryNav ? <nav className="guest-bottom-nav" aria-label="Primary navigation"><NavButton label="Stay" icon={<House />} active={activeScreen === 'stay-overview'} onClick={() => go('stay-overview')} /><NavButton label="Bookings" icon={<CalendarBlank />} active={['marketplace', 'category-listing', 'hotel-service', 'vendor-service', 'restaurant-menu', 'restaurant-cart', 'dining-order-confirmation', 'service-booking', 'booking-confirmation', 'booking-blocked', 'my-bookings', 'cancel-before-cutoff', 'cancel-after-cutoff'].includes(activeScreen)} onClick={() => go('marketplace')} /><NavButton label="Travel" icon={<AirplaneTilt />} active={activeScreen === 'travel' || activeScreen === 'travel-search'} onClick={() => go('travel')} /><NavButton label="Chat" icon={<ChatCircleDots />} active={activeScreen === 'chat' || activeScreen === 'chat-after-hours'} onClick={() => go('chat')} /></nav> : null}
        </section>
      </main>
    </div>
  );
}

function PrototypeControls({
  online,
  onSimulateRoomReady,
}: {
  online: boolean;
  onSimulateRoomReady: () => void;
}) {
  return (
    <aside className="guest-prototype-toolbar" role="region" aria-label="Prototype controls">
      <div>
        <span>Prototype controls</span>
        <small>{online ? 'Assigned room · PMS event available' : 'Reconnect to receive a new PMS event.'}</small>
      </div>
      <button type="button" onClick={onSimulateRoomReady} disabled={!online}>
        <BellRinging aria-hidden="true" />
        Simulate room ready
      </button>
    </aside>
  );
}

function RoomReadyNotification({
  headline,
  detail,
  onViewStay,
  onDismiss,
  onFocusChange,
}: {
  headline: string;
  detail: string;
  onViewStay: () => void;
  onDismiss: () => void;
  onFocusChange: (focused: boolean) => void;
}) {
  return (
    <aside
      className="guest-room-ready-notification"
      role="region"
      aria-label="Room-ready notification"
      onFocus={() => onFocusChange(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) onFocusChange(false);
      }}
    >
      <div className="guest-room-ready-notification__icon" aria-hidden="true">
        <BellRinging />
      </div>
      <div className="guest-room-ready-notification__content">
        <small>Cabana · now</small>
        <strong>{headline}</strong>
        <p>{detail}</p>
        <button type="button" onClick={onViewStay}>View stay</button>
      </div>
      <button
        className="guest-room-ready-notification__dismiss"
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss notification"
      >
        <X aria-hidden="true" />
      </button>
    </aside>
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
            <PropertyImage property={booking.property} aspectRatio="21/9" decorative />
            <div className="guest-stay-hero-card__badges">
              <Tag tone="positive">Active stay</Tag>
              <span className="guest-tag guest-tag--dark">{roomLabel}</span>
            </div>
          </div>
          <div className="guest-stay-hero-card__body">
            <p className="guest-eyebrow">Good afternoon, {session.guestName.split(' ')[0]}</p>
            <h1>{booking.property}</h1>
            <div className="guest-stay-hero-card__chips">
              <span>{booking.city}</span>
              <span>·</span>
              <span><WifiHigh size={14} /> Hotel Wi-Fi</span>
            </div>
            {/*
              Dates and room live here, not in a separate "Stay details" grid.
              One card answers where, when and which room, so the two facts
              cannot drift apart across sections.
            */}
            <div className="guest-stay-hero-card__stats">
              <div><small>Dates</small><b>{formatStayDateRange(booking)}</b></div>
              <div><small>Room</small><b>{booking.roomNumber ? `${booking.roomType} · ${booking.roomNumber}` : booking.roomType}</b></div>
            </div>
          </div>
          <div className="guest-stay-hero-card__actions">
            <button className="guest-list-row" onClick={() => onNavigate('folio')} type="button"><span><Receipt /></span><div><b>Room charges</b><small>Current folio · {folioTotal}</small></div><CaretRight /></button>
            <button className="guest-list-row" onClick={() => onNavigate('rate-detail')} type="button"><span><Ticket /></span><div><b>View booking</b><small>Rate, policies and confirmation</small></div><CaretRight /></button>
          </div>
        </section>
        {!online ? <Notice tone="offline" icon={<WifiSlash />} title="You’re offline">Cached stay details are available. Requests will send when connected.</Notice> : null}
        <section>
          <SectionHeading title="Explore on-property" action="Bookings Hub" onAction={() => onNavigate('marketplace')} />
          <div className="guest-miniapp-row" role="group" aria-label="Experience categories">
            {MINI_APP_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                className="guest-miniapp-tile"
                onClick={() => {
                  onSelectCategory(cat.id);
                  onNavigate('category-listing');
                }}
              >
                <span className={`guest-miniapp-icon guest-miniapp-icon--${cat.tone}`} aria-hidden="true">
                  <CategoryIcon id={cat.id} />
                </span>
                <span className="guest-miniapp-tile__label">{cat.shortTitle}</span>
              </button>
            ))}
          </div>
          <FeaturedRail onOpenCategory={(category) => { onSelectCategory(category); onNavigate('category-listing'); }} />
        </section>
        {confirmedServices[0] ? <section className="guest-home-next-service"><SectionHeading title="Next up" action="Bookings Hub" onAction={() => onNavigate('marketplace')} /><div className="guest-booking-card is-static"><div><Tag tone="positive">Confirmed</Tag><h2>{confirmedServices[0].title}</h2><p>{confirmedServices[0].scheduledFor} · {confirmedServices[0].amount}</p><small>Added to {roomLabel.toLowerCase()} · settles at checkout</small></div></div></section> : null}
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

  const roomAssignment = describeRoomAssignment(booking);

  return (
    <div className="guest-stack guest-home-booking guest-home-booking--upcoming" data-testid="guest-home-upcoming">
      <div className="guest-stay-hero-card">
        <div className="guest-stay-hero-card__media">
          <PropertyImage property={booking.property} aspectRatio="21/9" decorative />
          <div className="guest-stay-hero-card__badges">
            <Tag tone="warning">Upcoming</Tag>
            <span className="guest-tag guest-tag--dark">{booking.city}</span>
          </div>
        </div>
        <div className="guest-stay-hero-card__body">
          <p className="guest-eyebrow">Your next stay</p>
          <h1>{booking.property}</h1>
          <div className="guest-stay-hero-card__stats">
            <div><small>Dates</small><b>{formatStayDateRange(booking)}</b></div>
            <div><small>Room</small><b>{booking.roomNumber ? `${booking.roomType} · ${booking.roomNumber}` : `${booking.roomType} · Assigned at arrival`}</b></div>
          </div>
        </div>
        {/* No folio row: a stay that has not started cannot have room charges. */}
        <div className="guest-stay-hero-card__actions">
          <button className="guest-list-row" onClick={() => onNavigate('rate-detail')} type="button"><span><Ticket /></span><div><b>View booking</b><small>Rate, policies and confirmation</small></div><CaretRight /></button>
        </div>
      </div>
      <section className="guest-home-booking guest-home-booking--primary">
        {booking.preArrivalCompleted < booking.preArrivalTotal ? (
          <>
            <div className="guest-home-booking__heading"><div><small>Pre-arrival</small><h2>{booking.preArrivalCompleted} of {booking.preArrivalTotal} steps complete</h2></div><strong>{Math.round((booking.preArrivalCompleted / Math.max(booking.preArrivalTotal, 1)) * 100)}%</strong></div>
            <div className="guest-home-progress" role="progressbar" aria-label="Pre-arrival progress" aria-valuemin={0} aria-valuemax={booking.preArrivalTotal} aria-valuenow={booking.preArrivalCompleted}><span style={{ width: `${Math.min(100, (booking.preArrivalCompleted / Math.max(booking.preArrivalTotal, 1)) * 100)}%` }} /></div>
            <p>{booking.nextPreArrivalStep ?? 'Review your stay details before arrival.'}</p>
            <Button className="guest-button guest-button--primary" type="button" onClick={() => onNavigate('guest-details')}>Complete pre-arrival<ArrowRight aria-hidden="true" /></Button>
          </>
        ) : (
          <>
            {/*
              Pre-arrival is done, so the card's job becomes the room. All copy
              comes from `describeRoomAssignment` so this card, the stay screen
              and the timeline cannot describe one room three ways.
            */}
            {/*
              "Your room", not "Ready for arrival": the eyebrow used to name a
              different subject than the tag beside it, so a pending room read
              as "Ready ... Pre-registered".
            */}
            <div className="guest-home-booking__heading">
              <div><small>Your room</small><h2>{roomAssignment.headline}</h2></div>
              <Tag tone={roomAssignment.canGoUp ? 'positive' : undefined}>{roomAssignment.statusLabel}</Tag>
            </div>
            <p>{roomAssignment.detail}</p>
            {roomAssignment.state !== 'pending' && booking.honouredPreferences?.length ? (
              <p className="guest-home-booking__note">Honoured: {booking.honouredPreferences.join(' · ')}</p>
            ) : null}
            {roomAssignment.action.tone === 'primary' ? (
              <Button className="guest-button guest-button--primary" type="button" onClick={() => onNavigate(roomAssignment.action.screen)}>
                {roomAssignment.action.label}<ArrowRight aria-hidden="true" />
              </Button>
            ) : (
              <TextButton onClick={() => onNavigate(roomAssignment.action.screen)}>{roomAssignment.action.label}</TextButton>
            )}
          </>
        )}
      </section>
      <section>
        <SectionHeading title="Explore on-property" action="Bookings Hub" onAction={() => onNavigate('marketplace')} />
        <div className="guest-miniapp-row" role="group" aria-label="Experience categories">
          {MINI_APP_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              className="guest-miniapp-tile"
              onClick={() => {
                onSelectCategory(cat.id);
                onNavigate('category-listing');
              }}
            >
              <span className={`guest-miniapp-icon guest-miniapp-icon--${cat.tone}`} aria-hidden="true">
                <CategoryIcon id={cat.id} />
              </span>
              <span className="guest-miniapp-tile__label">{cat.shortTitle}</span>
            </button>
          ))}
        </div>
        <FeaturedRail onOpenCategory={(category) => { onSelectCategory(category); onNavigate('category-listing'); }} />
      </section>
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

/**
 * Home's discovery rail. A native overflow-scroll list with snap points: no
 * carousel library, no autoplay, no dots. The row bleeds past the screen inset
 * so a card is always visibly cut off at the right edge -- that clipped card is
 * what tells the guest the row scrolls, more honestly than any affordance
 * drawn on top of the content.
 */
function FeaturedRail({ onOpenCategory }: { onOpenCategory: (category: MiniAppCategoryId) => void }) {
  return (
    <ul className="guest-featured-rail">
      {getFeaturedServices().map((service) => (
        <li key={service.id}>
          <button
            type="button"
            className="guest-featured-card"
            onClick={() => onOpenCategory(service.categoryId)}
          >
            <ServiceImage
              imageKey={getServiceImageKey(service)}
              itemId={service.id}
              categoryId={service.categoryId}
              variant="card"
              tone={service.tone}
              icon={<CategoryIcon id={service.categoryId} />}
              decorative
            />
            <span className="guest-featured-card__body">
              <small>{service.category}</small>
              <b>{service.name}</b>
              <span>{service.price}</span>
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}

/** One facet on the filter bar: a pill that opens a sheet of choices. */
type Facet = {
  key: string;
  /** Pill label when nothing is chosen. */
  label: string;
  options: { value: string; label: string }[];
  selected: string[];
  onChange: (next: string[]) => void;
  /** Single-select facets (sort) render radios and always have a value. */
  single?: boolean;
};

/**
 * The filter sheet.
 *
 * A native <dialog> opened with showModal(), which puts it in the browser's
 * top layer: it cannot be clipped by the device frame's overflow, and it is
 * immune to the ancestor-transform trap that broke the cart's fixed
 * positioning. Focus trapping, Escape, and inertness of the page behind all
 * come with it rather than being rebuilt by hand.
 *
 * Choices are staged and committed on Apply. Applying each tap live makes the
 * list jump under the finger while the guest is still choosing.
 */
function FilterSheet({
  title,
  facets,
  onClose,
  onApply,
}: {
  title: string;
  facets: Facet[];
  onClose: () => void;
  onApply: (draft: Record<string, string[]>) => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [draft, setDraft] = useState<Record<string, string[]>>(
    () => Object.fromEntries(facets.map((facet) => [facet.key, facet.selected])),
  );

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog || dialog.open) return;
    dialog.showModal();
  }, []);

  const toggle = (facet: Facet, value: string) => {
    setDraft((current) => {
      const chosen = current[facet.key] ?? [];
      if (facet.single) return { ...current, [facet.key]: [value] };
      return {
        ...current,
        [facet.key]: chosen.includes(value) ? chosen.filter((item) => item !== value) : [...chosen, value],
      };
    });
  };

  const cleared = Object.fromEntries(
    facets.map((facet) => [facet.key, facet.single ? [facet.options[0]!.value] : []]),
  );
  const changes = facets.reduce((count, facet) => count + (facet.single ? 0 : (draft[facet.key]?.length ?? 0)), 0);

  return (
    <dialog
      ref={ref}
      className="guest-sheet"
      onClose={onClose}
      onClick={(event) => { if (event.target === ref.current) ref.current?.close(); }}
    >
      <div className="guest-sheet__panel">
        <span className="guest-sheet__grip" aria-hidden="true" />
        <div className="guest-sheet__head">
          <h2>{title}</h2>
          <button type="button" className="guest-sheet__clear" onClick={() => setDraft(cleared)} disabled={!changes}>
            Clear all
          </button>
        </div>
        <div className="guest-sheet__body">
          {facets.map((facet) => (
            <fieldset key={facet.key} className="guest-sheet__group">
              {/* One facet means the sheet title already says this; the legend
                  stays for the group's accessible name, just not on screen. */}
              <legend className={facets.length > 1 ? undefined : 'sr-only'}>{facet.label}</legend>
              {facet.options.map((option) => {
                const checked = (draft[facet.key] ?? []).includes(option.value);
                return (
                  <label key={option.value} className="guest-sheet__option">
                    <span>{option.label}</span>
                    <input
                      type={facet.single ? 'radio' : 'checkbox'}
                      name={`sheet-${facet.key}`}
                      checked={checked}
                      onChange={() => toggle(facet, option.value)}
                    />
                  </label>
                );
              })}
            </fieldset>
          ))}
        </div>
        <div className="guest-sheet__foot">
          <Button
            className="guest-button guest-button--primary"
            type="button"
            onClick={() => { onApply(draft); ref.current?.close(); }}
          >
            Apply
          </Button>
        </div>
      </div>
    </dialog>
  );
}

/**
 * The filter bar: one scrolling row of pills that open the sheet, replacing
 * the stacked rows of inline pills. Those were fine at three options; the
 * catalogue now reaches seven types and four operators in one category, which
 * is four rows of chrome above the content the guest came for.
 */
function ListingControls({
  facets,
  count,
  nouns,
  narrowed,
  onClear,
}: {
  facets: Facet[];
  count: number;
  nouns: [string, string];
  narrowed: boolean;
  onClear: () => void;
}) {
  const [openKey, setOpenKey] = useState<string | null>(null);
  const open = facets.filter((facet) => openKey === 'all' || facet.key === openKey);

  const apply = (draft: Record<string, string[]>) => {
    for (const facet of facets) {
      const next = draft[facet.key];
      if (next) facet.onChange(next);
    }
  };

  return (
    <div className="guest-listing-controls">
      <div className="guest-filter-bar">
        <button
          type="button"
          className="guest-filter-bar__all"
          aria-label={`All filters${narrowed ? ' · active' : ''}`}
          data-active={narrowed || undefined}
          onClick={() => setOpenKey('all')}
        >
          <SlidersHorizontal aria-hidden="true" />
        </button>
        {facets.map((facet) => {
          const chosen = facet.selected;
          const active = facet.single ? chosen[0] !== facet.options[0]?.value : chosen.length > 0;
          const label = facet.single
            ? (facet.options.find((option) => option.value === chosen[0])?.label ?? facet.label)
            : chosen.length === 1
              ? facet.options.find((option) => option.value === chosen[0])?.label ?? facet.label
              : chosen.length > 1 ? `${facet.label} · ${chosen.length}` : facet.label;
          return (
            <button
              key={facet.key}
              type="button"
              className={`guest-filter-pill ${active ? 'is-active' : ''}`}
              onClick={() => setOpenKey(facet.key)}
            >
              {label}<CaretDown aria-hidden="true" />
            </button>
          );
        })}
      </div>
      <p className="guest-listing-status">
        <span aria-live="polite">{count} {count === 1 ? nouns[0] : nouns[1]}</span>
        {narrowed ? <button type="button" className="guest-listing-clear" onClick={onClear}>Clear</button> : null}
      </p>
      {openKey ? (
        <FilterSheet
          key={openKey}
          title={openKey === 'all' ? 'Filters' : open[0]!.label}
          facets={open}
          onClose={() => setOpenKey(null)}
          onApply={apply}
        />
      ) : null}
    </div>
  );
}

function SectionHeading({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return <div className="guest-section-heading"><h2>{title}</h2>{action ? <button onClick={onAction}>{action}<CaretRight /></button> : null}</div>;
}

function ActionTile({ icon, label, onClick }: { icon: ReactNode; label: string; onClick: () => void }) {
  return <button className="guest-action-tile" onClick={onClick}><span>{icon}</span><b>{label}</b><CaretRight /></button>;
}

function ServiceDetail({ kind, booking, online, onBook, onChat }: { kind: 'hotel' | 'vendor'; booking: Booking; online: boolean; onBook: () => void; onChat: () => void }) {
  const vendor = kind === 'vendor';
  const roomLabel = booking.roomNumber ? `room ${booking.roomNumber}` : 'your assigned room';
  return <div className="guest-stack guest-service-detail"><ServiceImage imageKey={vendor ? 'spa' : 'dining'} itemId={vendor ? 'spa' : 'dining'} variant="card" tone={vendor ? 'sage' : 'sand'} icon={vendor ? <Sparkle size={38} /> : <ForkKnife size={38} />} decorative /><div className="guest-page-title"><div className="guest-tag-row"><Tag>{vendor ? 'Third-party · on property' : 'Hotel operated'}</Tag><Tag>{vendor ? '24-hour cutoff' : '2-hour cutoff'}</Tag></div><h1>{vendor ? 'Hilom signature massage' : 'In-room dining'}</h1><p>{vendor ? 'A 90-minute traditional Filipino therapeutic massage, delivered in the on-property spa.' : `Comforting Filipino favorites and all-day classics delivered to ${roomLabel}.`}</p></div><div className="guest-summary"><SummaryRow label="Price" value={vendor ? '₱2,400' : 'From ₱450'} /><SummaryRow label="Availability" value={online ? 'Today · 3 times' : 'Connect to check'} /><SummaryRow label="Property" value={booking.property} /><SummaryRow label="Room" value={booking.roomNumber ? `Room ${booking.roomNumber}` : 'Assigned at arrival'} /><SummaryRow label="Settlement" value="Charge at checkout" /><SummaryRow label="Cancellation" value={vendor ? 'Up to 24 hours before' : 'Up to 2 hours before'} /></div>{!online ? <Notice tone="offline" icon={<WifiSlash />} title="Live booking is unavailable">Capacity and price are never queued. Connect to see current times.</Notice> : null}<button className="guest-button guest-button--primary" onClick={onBook}>{online ? (vendor ? 'Choose a time' : 'View menu and order') : 'See connection options'}<ArrowRight /></button>{!online ? <TextButton onClick={onChat}>Message the front desk instead</TextButton> : null}{vendor ? <div className="guest-provisional"><b>Provisional decision</b><p>Confirm that third-party providers accept a 24-hour self-service cancellation window.</p></div> : null}</div>;
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
