'use client';

import {
  AppleLogo,
  ArrowLeft,
  ArrowRight,
  Bed,
  Bell,
  BellRinging,
  CaretRight,
  ChatCircleDots,
  Check,
  CheckCircle,
  Clock,
  ClockCountdown,
  Compass,
  CreditCard,
  EnvelopeSimple,
  ForkKnife,
  GoogleLogo,
  House,
  IdentificationCard,
  MapPin,
  Megaphone,
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
  Lock,
  Car,
  UserCircle,
  Users,
  Wrench,
  DeviceMobile,
  WifiHigh,
  WifiSlash,
  X,
} from '@phosphor-icons/react';
import Image from 'next/image';
import { useEffect, useRef, useState, type FormEvent, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react';
import { CabanaLockup, CabanaFullLockup } from '@/components/ui/cabana-logo';
import { CATEGORY_ILLUSTRATIONS, WELCOME_ILLUSTRATIONS } from './illustrations';
import { Button, Input } from '@/components/ui';
import { usePrefersReducedMotion } from '@/lib/hooks';
import {
  ANONYMOUS_SESSION,
  canUseOnPropertyServices,
  connectBooking,
  describeBookingSlot,
  describeGuestGate,
  describePostStayWindow,
  isPreArrivalService,
  requestFrontDeskUnlock,
  verifyRoomPresence,
  findBookingByLookup,
  describeCheckoutCountdown,
  describeStayStatus,
  formatPesoAmount,
  getHomeVariant,
  getNotifications,
  getStayEntries,
  hasStayStarted,
  isStayUnderWay,
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
  canReportRoomReady,
  markRoomReady,
  describeRoomAssignment,
  MINI_APP_CATEGORIES,
  PROPERTY_ANNOUNCEMENTS,
  PROTOTYPE_TODAY,
  findPastStay,
  summarisePastStay,
  getFeaturedServices,
  MOCK_SESSION,
  RESTAURANTS,
  SERVICES,
  ssoSession,
  signOutSession,
  findProfileByLookup,
  restoreProfileSession,
  toFinishedStay,
  createStayBooking,
  addStayBooking,
  quoteStay,
  countNightsBetween,
  propertyFromRate,
  findEstateProperty,
  ESTATE_PROPERTIES,
  DEFAULT_REBOOK_CHECK_IN,
  DEFAULT_REBOOK_CHECK_OUT,
  maskEmail,
  maskMobile,
  GUEST_PROFILE,
  applyPrototypeStayState,
  getPrototypeStayState,
  PROTOTYPE_STAY_STATES,
  parsePesoAmount,
  PAST_STAYS,
  type Booking,
  type ProfileMatch,
  type PrototypeStayState,
  type GuestNotification,
  type GuestSession,
  type PastStay,
  type StayEntry,
  type StayReview,
  type NotificationTone,
  type DiningFulfillment,
  type MenuItemCategory,
  type MiniAppCategoryId,
  type ServiceBooking,
  type ScreenId,
  type AuthMethod,
} from './prototype-model';
import {
  getServiceImage,
  getPropertyImage,
  getServiceImageKey,
  getItemThumbnail,
  getItemCardImage,
  type ServiceImageKey,
} from './service-images';
import { clearStoredSession, readStoredSession, writeStoredSession } from './session-storage';
import './guest-app-prototype.css';

type ActiveScreen = ScreenId | 'entry-hub';

/**
 * Which screens light which tab. Explore owns the whole catalogue -- the
 * property's own services and the onward legs alike -- and everything reached
 * by booking from it; My Stay owns the reservations, the running bill, and the
 * front desk. Both are declared once here so the tab bar cannot disagree with
 * itself.
 */
const EXPLORE_SCREENS: ActiveScreen[] = [
  'pre-arrival-services',
  'marketplace',
  'category-listing',
  'hotel-service',
  'vendor-service',
  'restaurant-menu',
  'restaurant-cart',
  'dining-order-confirmation',
  'service-booking',
  'booking-confirmation',
  'booking-blocked',
];

/**
 * Why a booking could not proceed. Five, not three: `not-checked-in` used to
 * cover a guest three days out and a guest standing in their room, and the two
 * need opposite things said to them -- one is waiting, the other can act now.
 */
/**
 * How long the mock viewfinder waits before it "finds" the code. Long enough
 * to read as a scan rather than a button press, short enough that nobody
 * watching a demo thinks it has hung.
 */
const SCAN_DETECT_MS = 2000;

/** One glyph per arrival service, so the column reads as four things. */
const ARRIVAL_GLYPHS: Record<string, ReactNode> = {
  transfer: <Car />,
  'private-car': <Person />,
  luggage: <SuitcaseRolling />,
  celebration: <Sparkle />,
};

type BlockedReason = 'offline' | 'not-arrived' | 'not-verified' | 'unlock-pending' | 'checked-out';

const MY_STAY_SCREENS: ActiveScreen[] = [
  'my-stay',
  'stay-review',
  'stay-review-sent',
  'folio',
  'chat',
  'chat-after-hours',
  'cancel-before-cutoff',
  'cancel-after-cutoff',
  'room-qr-midstay',
  'notifications',
  'stay-entry',
];

type FieldProps = {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  defaultValue?: string;
  helper?: string;
  required?: boolean;
  /** Controlled value. Pass with `onValueChange` where the value is read back. */
  value?: string;
  onValueChange?: (next: string) => void;
  min?: string;
};

function Field({ label, name, type = 'text', placeholder, defaultValue, helper, required, value, onValueChange, min }: FieldProps) {
  const helperId = helper ? `${name}-helper` : undefined;
  const controlled = value !== undefined;
  return (
    <label className="guest-field" htmlFor={name}>
      <span>{label}{required ? ' *' : ''}</span>
      <Input
        id={name}
        name={name}
        type={type}
        placeholder={placeholder}
        min={min}
        {...(controlled
          ? { value, onChange: (event: FormEvent<HTMLInputElement>) => onValueChange?.(event.currentTarget.value) }
          : { defaultValue })}
        aria-describedby={helperId}
        required={required}
      />
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
const NOTIFICATION_ICONS: Record<NotificationTone, ReactNode> = {
  room: <Bed />,
  booking: <CheckCircle />,
  folio: <Receipt />,
  desk: <ChatCircleDots />,
};

function NotificationIcon({ tone }: { tone: NotificationTone }) {
  return NOTIFICATION_ICONS[tone];
}

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
        const deltaX = event.clientX - origin;
        if (Math.abs(deltaX) < SWIPE_THRESHOLD_PX) return;
        show(index + (deltaX < 0 ? 1 : -1));
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

function SsoSheet({
  online,
  onClose,
  onSso,
  onBookingReference,
}: {
  online: boolean;
  onClose: () => void;
  onSso: (method: AuthMethod) => void;
  onBookingReference: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog || dialog.open) return;
    dialog.showModal();
  }, []);

  const close = () => ref.current?.close();

  return (
    <dialog
      ref={ref}
      id="guest-sso-sheet"
      className="guest-sheet guest-sso-sheet"
      aria-labelledby="guest-sso-sheet-title"
      onClose={onClose}
      onKeyDown={(event) => {
        // Browsers close a modal dialog on Escape. Keep this explicit so the
        // prototype's lightweight test shim behaves the same way.
        if (event.key === 'Escape') {
          event.preventDefault();
          close();
        }
      }}
      onClick={(event) => { if (event.target === ref.current) close(); }}
    >
      <div className="guest-sheet__panel">
        <span className="guest-sheet__grip" aria-hidden="true" />
        <div className="guest-sheet__head guest-sso-sheet__head">
          <div>
            <p className="guest-eyebrow">Your stay, all in one place</p>
            <h2 id="guest-sso-sheet-title">Get started</h2>
          </div>
          <button type="button" className="guest-sso-sheet__close" aria-label="Close" onClick={close}>
            <X aria-hidden="true" />
          </button>
        </div>
        <div className="guest-sheet__body guest-sso-sheet__body">
          <p className="guest-sso-sheet__lede">Use Apple or Google to access your stay and room services.</p>
          {!online ? <Notice tone="offline" icon={<WifiSlash />} title="Getting started needs a connection">A connection is required to continue.</Notice> : null}
          <div className="guest-auth-actions">
            <Button
              autoFocus
              className="guest-button guest-button--secondary guest-sso-button"
              type="button"
              disabled={!online}
              onClick={() => onSso('apple')}
            >
              <AppleLogo size={20} aria-hidden="true" /> Continue with Apple
            </Button>
            <Button
              className="guest-button guest-button--secondary guest-sso-button"
              type="button"
              disabled={!online}
              onClick={() => onSso('google')}
            >
              <GoogleLogo size={20} aria-hidden="true" /> Continue with Google
            </Button>
          </div>
          <TextButton onClick={() => { close(); onBookingReference(); }}>Use a booking reference instead</TextButton>
        </div>
      </div>
    </dialog>
  );
}

function WelcomeScreen({
  online,
  onSso,
  onBookingReference,
}: {
  online: boolean;
  onSso: (method: AuthMethod) => void;
  onBookingReference: () => void;
}) {
  const pager = useWelcomePager();
  const [ssoOpen, setSsoOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const closeSso = () => {
    setSsoOpen(false);
    triggerRef.current?.focus();
  };

  return (
    <>
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
            <div className="guest-welcome__actions">
              <Button
                ref={triggerRef}
                className="guest-button guest-button--primary guest-welcome__action"
                type="button"
                onClick={() => setSsoOpen(true)}
              >
                Get started<ArrowRight aria-hidden="true" />
              </Button>
            </div>
          </div>
        </div>
      </section>
      {ssoOpen ? <SsoSheet online={online} onClose={closeSso} onSso={onSso} onBookingReference={onBookingReference} /> : null}
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

type Companion = {
  name: string;
  nationality?: string;
  email?: string;
  mobile?: string;
  documentNumber?: string;
  expiry?: string;
};

type AdditionalGuestsScreenProps = {
  primaryGuestName: string;
  primaryGuestEmail?: string;
  initialGuests: string[];
  onSave: (validGuests: string[]) => void;
};

function AdditionalGuestsScreen({
  primaryGuestName,
  primaryGuestEmail = 'ana@example.com',
  initialGuests,
  onSave,
}: AdditionalGuestsScreenProps) {
  const [mode, setMode] = useState<'list' | 'details' | 'id-upload'>('list');
  const [companions, setCompanions] = useState<Companion[]>(() =>
    initialGuests.map((name) => ({
      name,
      nationality: 'Filipino',
    })),
  );
  const [draft, setDraft] = useState<Companion>({
    name: '',
    nationality: 'Filipino',
    email: '',
    mobile: '',
    documentNumber: '',
    expiry: '',
  });

  const handleRemoveGuest = (index: number) => {
    setCompanions((prev) => prev.filter((_, i) => i !== index));
  };

  if (mode === 'details') {
    return (
      <FormScreen
        step="Additional guest"
        title="Who is staying with you?"
        text="Enter details for your companion. These details are sent securely to the property for registration."
      >
        <form
          className="guest-form"
          onSubmit={(e: FormEvent<HTMLFormElement>) => {
            e.preventDefault();
            const data = new FormData(e.currentTarget);
            const name = String(data.get('companion-name') ?? '').trim();
            const nationality = String(data.get('companion-nationality') ?? 'Filipino').trim();
            const email = String(data.get('companion-email') ?? '').trim();
            const mobile = String(data.get('companion-mobile') ?? '').trim();
            if (!name) return;
            setDraft((prev) => ({ ...prev, name, nationality, email, mobile }));
            setMode('id-upload');
          }}
        >
          <Field
            label="Full name"
            name="companion-name"
            placeholder="e.g. Elena Santos"
            defaultValue={draft.name}
            required
          />
          <Field
            label="Nationality"
            name="companion-nationality"
            defaultValue={draft.nationality || 'Filipino'}
          />
          <Field
            label="Email (optional)"
            name="companion-email"
            type="email"
            placeholder="companion@example.com"
            defaultValue={draft.email}
          />
          <Field
            label="Mobile (optional)"
            name="companion-mobile"
            type="tel"
            placeholder="+63 917 555 0100"
            defaultValue={draft.mobile}
          />
          <Button className="guest-button guest-button--primary" type="submit">
            Continue to ID<ArrowRight aria-hidden="true" />
          </Button>
          <TextButton onClick={() => setMode('list')}>Cancel</TextButton>
        </form>
      </FormScreen>
    );
  }

  if (mode === 'id-upload') {
    return (
      <FormScreen
        step="Additional guest ID"
        title={`ID or passport for ${draft.name}`}
        text="Government-issued identification is required for property check-in."
      >
        <form
          className="guest-form"
          onSubmit={(e: FormEvent<HTMLFormElement>) => {
            e.preventDefault();
            const data = new FormData(e.currentTarget);
            const documentNumber = String(data.get('companion-document') ?? '').trim();
            const expiry = String(data.get('companion-expiry') ?? '').trim();
            setCompanions((prev) => [
              ...prev,
              {
                name: draft.name,
                nationality: draft.nationality,
                email: draft.email,
                mobile: draft.mobile,
                documentNumber,
                expiry,
              },
            ]);
            setMode('list');
          }}
        >
          <button className="guest-upload" type="button">
            <IdentificationCard size={28} />
            <b>Capture or upload ID</b>
            <small>Passport, national ID, or driver’s license</small>
          </button>
          <Field
            label="Document number"
            name="companion-document"
            placeholder="Enter document number"
            defaultValue={draft.documentNumber}
          />
          <Field
            label="Expiry date"
            name="companion-expiry"
            type="date"
            defaultValue={draft.expiry}
          />
          <Button className="guest-button guest-button--primary" type="submit">
            Save guest<ArrowRight aria-hidden="true" />
          </Button>
          <TextButton onClick={() => setMode('details')}>Back to details</TextButton>
        </form>
      </FormScreen>
    );
  }

  return (
    <FormScreen
      step="3 of 4"
      title="Who else is staying?"
      text="Additional guests do not need their own accounts."
    >
      <div className="guest-primary-guest-card">
        <div className="guest-primary-guest-card__header">
          <Tag tone="dark">Primary guest</Tag>
          <span className="guest-primary-guest-card__verified">
            <CheckCircle size={15} weight="fill" aria-hidden="true" /> Details &amp; ID verified
          </span>
        </div>
        <div className="guest-primary-guest-card__body">
          <div className="guest-primary-guest-card__avatar" aria-hidden="true">
            <Person size={22} />
          </div>
          <div className="guest-primary-guest-card__info">
            <strong>{primaryGuestName}</strong>
            <small>Lead booker · {primaryGuestEmail}</small>
          </div>
        </div>
      </div>

      <div className="guest-companions-section">
        <div className="guest-companions-header">
          <strong>Additional guests</strong>
          <span className="guest-companion-count">
            {companions.length === 0 ? 'None added' : `${companions.length} companion${companions.length > 1 ? 's' : ''}`}
          </span>
        </div>

        {companions.length === 0 ? (
          <div className="guest-companions-empty">
            <p>No additional guests added yet. You can continue directly.</p>
          </div>
        ) : (
          <div className="guest-companions-list">
            {companions.map((companion, idx) => (
              <div key={idx} className="guest-companion-card">
                <div className="guest-companion-card__avatar" aria-hidden="true">
                  <Users size={18} />
                </div>
                <div className="guest-companion-card__info">
                  <strong>{companion.name}</strong>
                  <small>{companion.nationality ? `${companion.nationality} · ` : ''}Details &amp; ID on file</small>
                </div>
                <button
                  type="button"
                  className="guest-companion-remove"
                  aria-label={`Remove ${companion.name}`}
                  onClick={() => handleRemoveGuest(idx)}
                >
                  <X size={16} aria-hidden="true" />
                </button>
              </div>
            ))}
          </div>
        )}

        <button
          type="button"
          className="guest-button guest-button--secondary guest-add-guest-button"
          onClick={() => {
            setDraft({
              name: '',
              nationality: 'Filipino',
              email: '',
              mobile: '',
              documentNumber: '',
              expiry: '',
            });
            setMode('details');
          }}
        >
          <Plus size={16} aria-hidden="true" />
          Add another guest
        </button>
      </div>

      <Notice title="One booking, one account">
        You stay in control of the booking. The people staying with you do not need their own accounts.
      </Notice>

      <Button
        className="guest-button guest-button--primary"
        type="button"
        onClick={() => {
          const validGuests = companions.map((c) => c.name.trim()).filter(Boolean);
          onSave(validGuests);
        }}
      >
        Continue<ArrowRight aria-hidden="true" />
      </Button>
    </FormScreen>
  );
}

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
  const [bookingBlockedReason, setBookingBlockedReason] = useState<BlockedReason>('offline');
  const [roomReadyNotificationBookingId, setRoomReadyNotificationBookingId] = useState<string | null>(null);
  const [roomReadyNotificationFocused, setRoomReadyNotificationFocused] = useState(false);
  /*
    Two sets, because "the bell has stopped nagging me" and "I have read this
    one" are different facts. Opening the inbox marks everything seen, which is
    what clears the dot on the bell; a row keeps its own dot until it is
    actually opened.
  */
  const [stayTab, setStayTab] = useState<'upcoming' | 'past'>('upcoming');
  const [selectedPastStayId, setSelectedPastStayId] = useState<string | null>(null);
  const [selectedStayEntryId, setSelectedStayEntryId] = useState<string | null>(null);
  /*
    The reference a returning guest matched, held between the lookup and the
    code screen. Cleared the moment it is spent, so a later visit to the verify
    screen cannot verify a stale match.
  */
  /* What the rebooking funnel has collected so far. One object, because every
     step of it is a partial answer to the same question. */
  const [stayDraft, setStayDraft] = useState({
    propertyId: '',
    checkIn: DEFAULT_REBOOK_CHECK_IN,
    checkOut: DEFAULT_REBOOK_CHECK_OUT,
    guests: '2',
    roomTypeId: '',
  });
  const [stayPaymentMethod, setStayPaymentMethod] = useState<'card' | 'gcash' | 'maya'>('card');
  const [bookedStayId, setBookedStayId] = useState<string | null>(null);
  const [profileMatch, setProfileMatch] = useState<ProfileMatch | null>(null);
  const [verifyChannel, setVerifyChannel] = useState<'email' | 'mobile'>('email');
  const [seenNotificationIds, setSeenNotificationIds] = useState<string[]>([]);
  const [readNotificationIds, setReadNotificationIds] = useState<string[]>([]);

  /*
    Tests drive the prototype by handing it a session outright. When they do,
    persistence is off at both ends -- no read that could contradict the
    fixture, no write that could leak one test's state into the next.
  */
  const persistent = !initialSession;

  /*
    Hydration runs in an effect rather than in the `useState` initialiser
    because this route is prerendered: reading storage during render gives the
    server one tree and the client another. The cost is that the first paint is
    the signed-out screen even for a returning guest, which is the same
    trade-off the app already makes for its client-only query sections.
  */
  const hydratedRef = useRef(false);
  useEffect(() => {
    if (!persistent || hydratedRef.current) return;

    const stored = readStoredSession();
    if (!stored) return;

    /*
      Applied from a timer rather than straight from the effect body, which is
      the shape `src/lib/hooks/use-debounce.ts` uses and the one the
      `react-hooks/set-state-in-effect` rule accepts -- a synchronous setState
      here is a lint error, not a style note.

      The flag is raised inside the callback, not above it. Raising it in the
      effect body looks tidier and breaks StrictMode: the dev double-invoke
      runs the effect, cleans it up, and runs it again, so a flag set on the
      first pass makes the second pass return early and the session is never
      restored at all.
    */
    const timer = window.setTimeout(() => {
      hydratedRef.current = true;
      setSession(stored);
      /*
        Home, and never a stored screen id. A persisted screen goes stale the
        moment the session it belonged to changes and strands the guest on
        something that can no longer render; home always can.

        Not `getPostAuthScreen` either -- that answers "where does a guest go
        once they have just signed in", which for an incomplete pre-arrival is
        `welcome-back`, a step in *creating* the account. Someone who reloaded
        the page is not being onboarded.

        An anonymous record has nowhere to land, so it keeps the entry hub.
      */
      if (stored.auth === 'authenticated' || stored.bookings.length > 0) {
        setActiveScreen('stay-overview');
      }
    }, 0);

    return () => window.clearTimeout(timer);
  }, [persistent]);

  /*
    Skips its own first run: on mount this fires with the anonymous default,
    which would overwrite the very record the hydration effect above is about
    to restore.
  */
  const pristineRef = useRef(true);
  useEffect(() => {
    if (!persistent) return;
    if (pristineRef.current) {
      pristineRef.current = false;
      return;
    }

    /*
      A session with nobody in it is removed rather than written. Signing out
      calls `clearStoredSession()` and then sets the anonymous session, which
      would land right back here and persist an empty record -- so the clear
      only sticks if this agrees that empty means absent.
    */
    if (session.auth === 'anonymous' && session.bookings.length === 0) {
      clearStoredSession();
      return;
    }

    writeStoredSession(session);
  }, [persistent, session]);

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

  const showNav = ['stay-overview', 'pre-arrival-services', 'marketplace', 'category-listing', 'hotel-service', 'vendor-service', 'restaurant-menu', 'restaurant-cart', 'dining-order-confirmation', 'service-booking', 'booking-confirmation', 'booking-blocked', 'my-stay', 'notifications', 'stay-entry', 'cancel-before-cutoff', 'cancel-after-cutoff', 'folio', 'chat', 'chat-after-hours', 'room-qr-midstay', 'stay-review', 'stay-review-sent', 'profile', 'stay-history'].includes(activeScreen);
  const showPrimaryNav = showNav && (session.auth === 'authenticated' || session.bookings.length > 0);
  const isWelcome = activeScreen === 'entry-hub';
  const primaryBooking = getPrimaryBooking(session.bookings, session.activeBookingId);
  const eligibleRoomReadyBooking = primaryBooking && canReportRoomReady(primaryBooking)
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

  const stayEntries = getStayEntries(session, primaryBooking);
  const visibleStayEntries = stayTab === 'upcoming' ? stayEntries.upcoming : stayEntries.past;

  const notifications = getNotifications(session, primaryBooking);
  const unreadNotifications = notifications.filter((item) => !seenNotificationIds.includes(item.id)).length;

  const openNotifications = () => {
    setSeenNotificationIds(notifications.map((item) => item.id));
    go('notifications');
  };

  const openNotification = (item: GuestNotification) => {
    setReadNotificationIds((current) => current.includes(item.id) ? current : [...current, item.id]);
    go(item.screen);
  };

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
    if (!booking || !isStayUnderWay(booking)) {
      setDiningOrderError('Room orders open when your stay starts');
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
      scheduledDate: PROTOTYPE_TODAY,
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

  /*
    The gate, resolved once per render. Every surface that asks "can this
    guest book, charge, or order" reads this rather than re-deriving it, so
    the tab bar and the buttons inside it cannot disagree.
  */
  const bookingSlot = describeBookingSlot(contextBooking);
  const unlockPending = session.unlockRequest?.bookingId === contextBooking.id;

  /*
    The 24-hour front-desk window. Real arithmetic over `checkedOutAt`, but
    the prototype reaches both sides of it through the state switcher rather
    than by elapsing -- nothing should expire while a stakeholder is looking
    at it.
  */
  const postStayWindow = describePostStayWindow(contextBooking);
  /** This guest's own history. Empty for an account that has not stayed yet. */
  const pastStays = session.pastStays;
  const scannerReducedMotion = usePrefersReducedMotion();
  const [autoDetectScans, setAutoDetectScans] = useState(true);
  /** Marks the scan icon while the one thing it unlocks is still locked. */
  const scanPending = Boolean(
    primaryBooking && isStayUnderWay(primaryBooking) && !primaryBooking.roomVerification,
  );
  const stayReview = session.reviews.find((review) => review.bookingId === contextBooking.id);

  const submitStayReview = (rating: StayReview['rating'], comment: string) => {
    setSession((current) => ({
      ...current,
      reviews: [
        ...current.reviews.filter((review) => review.bookingId !== contextBooking.id),
        { bookingId: contextBooking.id, rating, comment, submittedAt: PROTOTYPE_TODAY },
      ],
    }));
    go('stay-review-sent');
  };

  /** Why this guest cannot reach on-property services right now. */
  const blockedReasonFor = (booking: Booking): BlockedReason => {
    if (booking.status === 'completed') return 'checked-out';
    if (!isStayUnderWay(booking)) return 'not-arrived';
    return session.unlockRequest?.bookingId === booking.id ? 'unlock-pending' : 'not-verified';
  };

  /** The scan. The only thing a guest can do that opens the gate themselves. */
  const scanRoomCode = () => {
    /*
      Two outcomes from one code. A guest whose booking is already attached
      is proving presence, so the gate opens. A guest with no booking is
      using the code as a way *in* -- the property still has to match them to
      a reservation, which is the surname step on `room-qr-landing`.
    */
    if (!primaryBooking) {
      go('room-qr-landing');
      return;
    }
    setSession((current) => verifyRoomPresence(current, primaryBooking.id, 'scan'));
    go('room-qr-midstay');
  };

  /*
    "I can't scan" files a request and nothing more. A guest-side unlock would
    make the code decorative -- the gate means the property confirmed this
    guest is in this room, so only the desk can answer it.
  */
  const askFrontDeskToUnlock = () => {
    setSession((current) => requestFrontDeskUnlock(current, contextBooking.id));
    setChatMessages((messages) => [
      ...messages,
      {
        from: 'guest',
        body: `I can't scan the code in room ${contextBooking.roomNumber ?? ''}`.trim() + '. Could you unlock services for me?',
        state: online ? 'Sent' : 'Will send when connected',
      },
    ]);
    go('chat');
  };

  /** The desk's side of that request. Scripted here; a real desk tool elsewhere. */
  const grantFrontDeskUnlock = () => {
    setSession((current) => verifyRoomPresence(current, contextBooking.id, 'front-desk'));
    setChatMessages((messages) => [
      ...messages,
      { from: 'desk', body: `Confirmed — we can see you in room ${contextBooking.roomNumber ?? ''}`.trim() + '. Services are open on your app now.', state: 'Seen' },
    ]);
  };

  const primary = (label: string, next: ActiveScreen, options?: { disabled?: boolean }) => (
    <Button className="guest-button guest-button--primary" type="button" onClick={() => go(next)} disabled={options?.disabled}>{label}<ArrowRight aria-hidden="true" /></Button>
  );

  /** Decide before the guest fills a form in, not after. */
  const openServiceBooking = () => {
    if (!online) { setBookingBlockedReason('offline'); go('booking-blocked'); return; }
    if (!canUseOnPropertyServices(contextBooking)) {
      setBookingBlockedReason(blockedReasonFor(contextBooking));
      go('booking-blocked');
      return;
    }
    go('service-booking');
  };

  const confirmService = () => {
    const booking = getPrimaryBooking(session.bookings, session.activeBookingId);
    if (!online) {
      setBookingBlockedReason('offline');
      go('booking-blocked');
      return;
    }
    if (!booking || !canUseOnPropertyServices(booking)) {
      // Not a network problem, and it must not claim to be one.
      setBookingBlockedReason(booking ? blockedReasonFor(booking) : 'not-arrived');
      go('booking-blocked');
      return;
    }

    const serviceBooking: ServiceBooking = {
      id: 'service-hilom-1',
      bookingId: booking.id,
      title: 'Hilom signature massage',
      scheduledFor: 'Tuesday · November 11 · 1:30 PM',
      scheduledDate: PROTOTYPE_TODAY,
      amount: '₱2,400',
      status: 'confirmed',
    };

    setSession((current) => {
      const alreadyBooked = current.serviceBookings.some((service) => service.id === serviceBooking.id);
      return {
        ...current,
        serviceBookings: [
          ...current.serviceBookings.filter((service) => service.id !== serviceBooking.id),
          serviceBooking,
        ],
        folioTotal: alreadyBooked
          ? current.folioTotal
          : formatPesoAmount(parsePesoAmount(current.folioTotal) + parsePesoAmount(serviceBooking.amount)),
      };
    });
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
  const completeAuth = (authenticated: GuestSession) => {
    const next = pendingIntent === 'link-room'
      ? withActiveRoom(authenticated)
      : pendingIntent === 'connect-booking'
        ? connectBooking(authenticated)
        : authenticated;

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

  /*
    What a verified code buys: the profile, not the single stay whose reference
    opened the door. Restoring only the matched reservation would make a guest
    enter a reference per stay to reassemble their own history.
  */
  const completeReentry = () => {
    const restored = restoreProfileSession();
    setSession(restored);
    setProfileMatch(null);
    setCode('');
    setCodeNotice(null);
    /*
      Home, not `getPostAuthScreen`. That routes through `welcome-back`, which
      is a step in *creating* the account -- "review the details we already
      hold before this stay". A guest logging back in with an old reference is
      not being onboarded; they came for the account they already have.
    */
    go('stay-overview');
  };

  /*
    The rig, not the product. Jumps straight to the steady state of whichever
    stay is chosen -- the demo question is "what does the app look like once
    checked out", not "replay the onboarding that gets there".
  */
  const applyStayState = (state: PrototypeStayState) => {
    const next = applyPrototypeStayState(state);
    setSession(next);
    setHistory([]);
    setProfileMatch(null);
    setPendingIntent('none');
    setCode('');
    setCodeNotice(null);
    setScrolled(false);
    setActiveScreen(state === 'signed-out' ? 'entry-hub' : 'stay-overview');
  };

  /*
    Debug affordances. Each one flips a single fact the product normally sets
    through a flow, so a corner inside a stay state can be reached without
    replaying the journey that produces it.
  */
  const toggleRoomVerified = () => {
    if (!primaryBooking) return;
    setSession((current) => (
      primaryBooking.roomVerification
        ? {
            ...current,
            bookings: current.bookings.map((booking) => (
              booking.id === primaryBooking.id
                ? { ...booking, roomVerification: undefined }
                : booking
            )),
          }
        : verifyRoomPresence(current, primaryBooking.id, 'front-desk')
    ));
  };

  const toggleHistory = () => {
    setSession((current) => ({
      ...current,
      pastStays: current.pastStays.length > 0 ? [] : PAST_STAYS,
    }));
  };

  const clearReview = () => {
    setSession((current) => ({
      ...current,
      reviews: current.reviews.filter((review) => review.bookingId !== contextBooking.id),
    }));
  };

  const resetPrototype = () => {
    clearStoredSession();
    applyStayState('signed-out');
  };

  const signOut = () => {
    /*
      Clearing here as well as letting the write effect persist the anonymous
      session: the effect would store a signed-out record, this removes it
      outright. A demo device left on a desk should not carry the last guest's
      folio in storage, even an empty-looking one.
    */
    clearStoredSession();
    setSession(signOutSession());
    setPendingIntent('none');
    setCode('');
    setCodeNotice(null);
    setHistory([]);
    setActiveScreen('entry-hub');
    setScrolled(false);
  };

  const renderBookingLookup = () => (
    <ScreenIntro
      eyebrow="Connect your stay"
      title="Find your booking"
      text="Enter the number from your booking confirmation."
    >
      <form
        className="guest-form"
        onSubmit={(event: FormEvent<HTMLFormElement>) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          const reference = String(data.get('booking-number') ?? '');
          const match = findBookingByLookup(reference);
          if (match) {
            go('booking-found');
            return;
          }
          /* Not a live reservation. Before giving up, see whether it is a stay
             this guest has already finished -- a returning guest has no live
             booking to find, only an old reference. */
          const profile = findProfileByLookup(reference);
          if (profile) {
            setProfileMatch(profile);
            setCode('');
            setCodeNotice(null);
            go('verify-contact');
            return;
          }
          go('no-booking');
        }}
      >
        <Field
          label="Booking or confirmation number"
          name="booking-number"
          placeholder="HEN-241109"
          helper="Hotel, Agoda, or Booking.com reference"
          required
        />
        <Field label="Last name" name="last-name" placeholder="Santos" required />
        <Button className="guest-button guest-button--primary" type="submit">
          Find booking<ArrowRight aria-hidden="true" />
        </Button>
      </form>
      <TextButton onClick={() => go('lookup-fallback')}>Find another way</TextButton>
    </ScreenIntro>
  );

  const renderScreen = () => {
    switch (activeScreen) {
      case 'entry-hub':
        return (
          <WelcomeScreen
            online={online}
            onSso={(method) => completeAuth(ssoSession(method))}
            onBookingReference={() => go('identify-returning')}
          />
        );

      case 'connect-booking':
        return renderBookingLookup();

      case 'room-qr-landing': {
        /*
          Two arrivals at the same code. A guest who already has this booking
          on their phone is only proving they are in the room, so asking for a
          surname again is a form for the sake of a form. A stranger scanning
          it still has to say which booking is theirs.
        */
        if (session.auth === 'authenticated' && session.bookings.length > 0) {
          return (
            <ScreenIntro
              icon={<QrCode size={30} />}
              eyebrow={contextRoom}
              title="Confirm you’re in the room"
              text="Scanning the desk card tells the property you have arrived. It is what opens dining, spa, tours and charging to your room."
            >
              <StayMiniCard booking={contextBooking} status={describeGuestGate(contextBooking).label} />
              <Button className="guest-button guest-button--primary" type="button" onClick={() => go('scan-room-code')}>
                Scan the code<ArrowRight aria-hidden="true" />
              </Button>
              <TextButton onClick={askFrontDeskToUnlock}>I can&rsquo;t scan</TextButton>
            </ScreenIntro>
          );
        }

        return <ScreenIntro icon={<QrCode size={30} />} eyebrow="Room QR detected" title="Let’s link this room to you" text="This permanent room code opens the guest app. Your last name confirms which live booking is yours."><StayMiniCard booking={contextBooking} status={`Room ${contextBooking.roomNumber ?? '304'} detected`} /><form className="guest-form" onSubmit={(event) => { event.preventDefault(); const data = new FormData(event.currentTarget); linkRoomStay(String(data.get('qr-last-name') ?? '').trim()); }}><Field label="Last name" name="qr-last-name" placeholder="Santos" required /><Button className="guest-button guest-button--primary" type="submit">Link my stay<ArrowRight aria-hidden="true" /></Button></form><TextButton onClick={() => go('front-desk-assist')}>I need help</TextButton></ScreenIntro>;
      }

      case 'wifi-landing':
        return <ScreenIntro icon={<WifiHigh size={30} />} eyebrow="Connected to hotel Wi-Fi" title="Welcome to The Henry Manila" text="You’re online through the hotel network. Find your booking to continue."><Notice title="Hotel-local connection" icon={<WifiHigh />}>Your itinerary and stay details remain available if this connection drops.</Notice>{primary('Find my booking', 'identify')}</ScreenIntro>;

      case 'identify':
        return renderBookingLookup();

      case 'book-stay':
        return (
          <div className="guest-stack">
            <div className="guest-page-title">
              <p className="guest-eyebrow">Book another stay</p>
              <h1>Where to next?</h1>
              <p>Three properties in the estate. Booking here is direct with the hotel, with no agency in between.</p>
            </div>

            {ESTATE_PROPERTIES.map((property) => (
              <button
                key={property.id}
                className="guest-property-card"
                type="button"
                onClick={() => {
                  setStayDraft((draft) => ({ ...draft, propertyId: property.id, roomTypeId: '' }));
                  go('book-stay-dates');
                }}
              >
                <PropertyImage property={property.name} aspectRatio="16/8" decorative />
                <span className="guest-property-card__body">
                  <b>{property.name}</b>
                  <small>{property.tagline}</small>
                  <span className="guest-property-card__rate">
                    From {propertyFromRate(property)} a night
                    <CaretRight aria-hidden="true" />
                  </span>
                </span>
              </button>
            ))}
          </div>
        );

      case 'book-stay-dates': {
        const property = findEstateProperty(stayDraft.propertyId);
        if (!property) {
          return (
            <ScreenIntro eyebrow="Book another stay" title="Pick a property first" text="Choose where you are going and we will take the dates next.">
              {primary('Choose a property', 'book-stay')}
            </ScreenIntro>
          );
        }

        const nights = countNightsBetween(stayDraft.checkIn, stayDraft.checkOut);

        return (
          <FormScreen step="1 of 3" title="Dates and guests" text={`Your stay at ${property.name}.`}>
            <Field
              label="Check in"
              name="rebook-check-in"
              type="date"
              value={stayDraft.checkIn}
              onValueChange={(next) => setStayDraft((draft) => ({ ...draft, checkIn: next }))}
            />
            <Field
              label="Check out"
              name="rebook-check-out"
              type="date"
              value={stayDraft.checkOut}
              onValueChange={(next) => setStayDraft((draft) => ({ ...draft, checkOut: next }))}
            />
            <SelectField
              label="Guests"
              name="rebook-guests"
              value={stayDraft.guests}
              onValueChange={(next) => setStayDraft((draft) => ({ ...draft, guests: next, roomTypeId: '' }))}
            >
              <option value="1">1 guest</option>
              <option value="2">2 guests</option>
              <option value="3">3 guests</option>
              <option value="4">4 guests</option>
              <option value="5">5 guests</option>
            </SelectField>

            {/* Said before the guest reaches the room list, not after they
                wonder why it is empty. */}
            {nights === 0
              ? <Notice tone="warning" title="Check out is not after check in">Pick a later checkout date to see rooms.</Notice>
              : <Notice title={`${nights} ${nights === 1 ? 'night' : 'nights'}`}>Rates are per night and shown before tax on the next screen.</Notice>}

            {primary('See rooms', 'book-stay-rooms', { disabled: nights === 0 })}
          </FormScreen>
        );
      }

      case 'book-stay-rooms': {
        const property = findEstateProperty(stayDraft.propertyId);
        if (!property) {
          return (
            <ScreenIntro eyebrow="Book another stay" title="Pick a property first" text="Choose where you are going and we will take the dates next.">
              {primary('Choose a property', 'book-stay')}
            </ScreenIntro>
          );
        }

        const nights = countNightsBetween(stayDraft.checkIn, stayDraft.checkOut);
        const guests = Number(stayDraft.guests);
        /* A room that cannot hold the party is not an option, and offering it
           only to refuse at checkout wastes the guest's time. */
        const roomsThatFit = property.roomTypes.filter((room) => room.maxGuests >= guests);

        return (
          <div className="guest-stack">
            <div className="guest-page-title">
              <p className="guest-eyebrow">Step 2 of 3 · {property.name}</p>
              <h1>Choose a room</h1>
              <p>{formatRebookDates(stayDraft.checkIn, stayDraft.checkOut)} · {nights} {nights === 1 ? 'night' : 'nights'} · {guests} {guests === 1 ? 'guest' : 'guests'}</p>
            </div>

            {roomsThatFit.length ? roomsThatFit.map((room) => {
              const quote = quoteStay(room, nights);
              return (
                <button
                  key={room.id}
                  className={`guest-room-option ${stayDraft.roomTypeId === room.id ? 'is-selected' : ''}`}
                  type="button"
                  aria-pressed={stayDraft.roomTypeId === room.id}
                  onClick={() => setStayDraft((draft) => ({ ...draft, roomTypeId: room.id }))}
                >
                  <span className="guest-room-option__text">
                    <b>{room.name}</b>
                    <small>{room.detail}</small>
                  </span>
                  <span className="guest-room-option__price">
                    <b>{quote.roomTotal}</b>
                    <small>{room.nightlyRate} a night</small>
                  </span>
                </button>
              );
            }) : (
              <Notice tone="warning" title="No room here sleeps that many">
                {property.name} tops out at {Math.max(...property.roomTypes.map((room) => room.maxGuests))} guests. Try another property, or split the party across two rooms with the front desk.
              </Notice>
            )}

            {primary('Continue to payment', 'book-stay-checkout', { disabled: !stayDraft.roomTypeId })}
          </div>
        );
      }

      case 'book-stay-checkout': {
        const property = findEstateProperty(stayDraft.propertyId);
        const room = property?.roomTypes.find((option) => option.id === stayDraft.roomTypeId);
        if (!property || !room) {
          return (
            <ScreenIntro eyebrow="Book another stay" title="Choose a room first" text="Pick the room you want and we will take payment next.">
              {primary('Back to rooms', 'book-stay-rooms')}
            </ScreenIntro>
          );
        }

        const nights = countNightsBetween(stayDraft.checkIn, stayDraft.checkOut);
        const quote = quoteStay(room, nights);
        const guests = Number(stayDraft.guests);

        return (
          <div className="guest-stack">
            <div className="guest-page-title">
              <p className="guest-eyebrow">Step 3 of 3 · {property.name}</p>
              <h1>Confirm and pay</h1>
              <p>{room.name} · {formatRebookDates(stayDraft.checkIn, stayDraft.checkOut)}</p>
            </div>

            <div className="guest-summary">
              <SummaryRow label="Property" value={property.name} />
              <SummaryRow label="Dates" value={`${formatRebookDates(stayDraft.checkIn, stayDraft.checkOut)} · ${nights} ${nights === 1 ? 'night' : 'nights'}`} />
              <SummaryRow label="Room" value={room.name} />
              <SummaryRow label="Guests" value={`${guests} ${guests === 1 ? 'guest' : 'guests'}`} />
              <SummaryRow label="Lead booker" value={session.guestName || GUEST_PROFILE.name} />
            </div>

            <section>
              <SectionHeading title="Rate" />
              <div className="guest-summary">
                <SummaryRow label={`${room.nightlyRate} × ${nights} ${nights === 1 ? 'night' : 'nights'}`} value={quote.roomTotal} />
                <SummaryRow label="Taxes and fees" value={quote.taxes} />
                <SummaryRow label="Total" value={quote.total} strong />
              </div>
            </section>

            <div className="guest-payment-choice">
              <span className="guest-payment-choice__label">Pay with</span>
              <div className="guest-payment-chips">
                <button type="button" className={`guest-payment-chip ${stayPaymentMethod === 'card' ? 'is-selected' : ''}`} onClick={() => setStayPaymentMethod('card')}>
                  <CreditCard size={15} /> Card
                </button>
                <button type="button" className={`guest-payment-chip ${stayPaymentMethod === 'gcash' ? 'is-selected' : ''}`} onClick={() => setStayPaymentMethod('gcash')}>
                  GCash
                </button>
                <button type="button" className={`guest-payment-chip ${stayPaymentMethod === 'maya' ? 'is-selected' : ''}`} onClick={() => setStayPaymentMethod('maya')}>
                  Maya
                </button>
              </div>
            </div>

            {!online ? (
              <Notice tone="offline" icon={<WifiSlash />} title="Booking needs a connection">
                Rates and availability move while you are offline, so nothing is held. Nothing has been charged.
              </Notice>
            ) : (
              <Notice title="Paid now, direct to the hotel">
                This is a direct booking, not an agency one. On-property extras still settle at checkout.
              </Notice>
            )}

            <Button
              className="guest-button guest-button--primary"
              type="button"
              disabled={!online}
              onClick={() => {
                const booking = createStayBooking({
                  property,
                  roomType: room,
                  checkIn: stayDraft.checkIn,
                  checkOut: stayDraft.checkOut,
                  guests,
                  guestName: session.guestName || GUEST_PROFILE.name,
                });
                setSession((current) => addStayBooking(current, booking));
                setBookedStayId(booking.id);
                go('book-stay-confirmation');
              }}
            >
              Pay {quote.total}<ArrowRight aria-hidden="true" />
            </Button>
          </div>
        );
      }

      case 'book-stay-confirmation': {
        const booked = session.bookings.find((entry) => entry.id === bookedStayId);
        if (!booked) {
          return (
            <ScreenIntro eyebrow="Book another stay" title="Nothing booked yet" text="Pick a property to start a new stay.">
              {primary('Choose a property', 'book-stay')}
            </ScreenIntro>
          );
        }

        return (
          <ScreenIntro
            icon={<CheckCircle size={30} />}
            eyebrow="Stay booked"
            title={`You\u2019re going back to ${booked.city}`}
            text={`${booked.property} has your reservation. Pre-arrival opens now so the property has your details before you land.`}
          >
            <StayCard booking={booked} />
            <div className="guest-summary">
              <SummaryRow label="Confirmation" value={booked.id} />
              <SummaryRow label="Booked through" value={booked.source} />
              <SummaryRow label="Paid" value={`${booked.roomRate ?? ''} + taxes · ${stayPaymentMethod === 'card' ? 'Card' : stayPaymentMethod === 'gcash' ? 'GCash' : 'Maya'}`} />
            </div>
            <Notice tone="positive" icon={<Sparkle />} title="Your details carry over">
              What the estate already holds is reused; the new property still needs its own registration before arrival.
            </Notice>
            {primary('Start pre-arrival', 'guest-details')}
            <TextButton onClick={() => go('stay-overview')}>Later, take me home</TextButton>
          </ScreenIntro>
        );
      }

      case 'identify-returning':
        return (
          <ScreenIntro
            eyebrow="Returning guest"
            title="Log in with a booking"
            text="Any reference from a stay with us works — the one you are on now, or one from years ago."
          >
            <form
              className="guest-form"
              onSubmit={(event: FormEvent<HTMLFormElement>) => {
                event.preventDefault();
                const data = new FormData(event.currentTarget);
                const match = findProfileByLookup(String(data.get('reentry-reference') ?? ''));
                if (!match) {
                  go('no-booking');
                  return;
                }
                setProfileMatch(match);
                setCode('');
                setCodeNotice(null);
                go('verify-contact');
              }}
            >
              <Field
                label="Booking or confirmation number"
                name="reentry-reference"
                placeholder="HEN-CEBU-250508"
                helper="From a confirmation email, or the receipt for a stay you have finished"
                required
              />
              <Button className="guest-button guest-button--primary" type="submit" disabled={!online}>
                Continue<ArrowRight aria-hidden="true" />
              </Button>
            </form>
            <Notice icon={<ShieldCheck />} title="Confirm your booking reference">
              Anyone can hold a booking number. We send a code to the contact on that reservation before opening the account.
            </Notice>
            <TextButton onClick={() => go('entry-hub')}>Back to welcome</TextButton>
          </ScreenIntro>
        );

      case 'verify-contact': {
        /*
          Only reachable with a match in hand. A reload lands here without one,
          so it offers the way back rather than verifying nothing.
        */
        if (!profileMatch) {
          return (
            <ScreenIntro
              eyebrow="Returning guest"
              title="Start again"
              text="We no longer have the booking you matched. Enter the reference once more."
            >
              {primary('Enter a booking reference', 'identify-returning')}
            </ScreenIntro>
          );
        }

        const maskedEmail = maskEmail(GUEST_PROFILE.email);
        const maskedMobile = maskMobile(GUEST_PROFILE.mobile);
        const destination = verifyChannel === 'email' ? maskedEmail : maskedMobile;
        const channels = [
          { id: 'email' as const, label: 'Email', value: maskedEmail, icon: <EnvelopeSimple /> },
          { id: 'mobile' as const, label: 'Mobile', value: maskedMobile, icon: <DeviceMobile /> },
        ];

        return (
          <div className="guest-stack guest-stack--intro">
            <HeroIcon tone="dark"><ShieldCheck size={30} /></HeroIcon>
            <div className="guest-page-title">
              <p className="guest-eyebrow">Step 2 of 2</p>
              <h1>Verify it&rsquo;s you</h1>
              <p>We found a stay under that reference. We will send a code to the contact the property holds for it.</p>
            </div>

            <div className="guest-summary">
              <SummaryRow label="Booking" value={profileMatch.reference} />
              <SummaryRow label="Property" value={profileMatch.property} />
              <SummaryRow label="Guest" value={profileMatch.guestName} />
            </div>

            <fieldset className="guest-channel-choice">
              <legend>Where should the code go?</legend>
              {channels.map((channel) => (
                <label key={channel.id} className="guest-channel-choice__option">
                  <input
                    type="radio"
                    name="verify-channel"
                    value={channel.id}
                    checked={verifyChannel === channel.id}
                    onChange={() => setVerifyChannel(channel.id)}
                  />
                  <span className="guest-channel-choice__icon" aria-hidden="true">{channel.icon}</span>
                  <span className="guest-channel-choice__text">
                    <b>{channel.label}</b>
                    <small>{channel.value}</small>
                  </span>
                </label>
              ))}
            </fieldset>

            {codeNotice ? <Notice tone="warning" title={codeNotice}>Codes expire quickly, so the newest one is the only one that works.</Notice> : null}
            {!online ? <Notice tone="offline" icon={<WifiSlash />} title="Verification needs a connection">We cannot check a code offline. Nothing has been opened yet.</Notice> : null}

            <label className="guest-field guest-code-field" htmlFor="reentry-code">
              <span>6-digit verification code</span>
              <Input
                id="reentry-code"
                name="reentry-code"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                placeholder="123456"
                value={code}
                onChange={(event) => setCode(event.target.value.replace(/[^0-9]/g, ''))}
              />
            </label>

            <Button
              className="guest-button guest-button--primary"
              type="button"
              disabled={code.length !== 6 || !online}
              onClick={completeReentry}
            >
              Verify and open my account<ArrowRight aria-hidden="true" />
            </Button>
            <TextButton disabled={!online} onClick={() => setCodeNotice(`A new code is on its way to ${destination}`)}>Resend the code</TextButton>
            <TextButton onClick={() => go('identify-returning')}>Use a different booking</TextButton>
          </div>
        );
      }

      case 'lookup-fallback':
        return <ScreenIntro eyebrow="Try another way" title="Use more booking details" text="Enter the details from your booking."><div className="guest-form"><Field label="Last name" name="fallback-name" defaultValue="Santos" /><Field label="Check-in date" name="fallback-date" type="date" defaultValue="2026-11-09" /><SelectField label="Property" name="property" defaultValue="manila"><option value="manila">The Henry Manila</option><option value="cebu">The Henry Cebu</option><option value="dumaguete">The Henry Dumaguete</option></SelectField>{primary('Continue to front desk', 'front-desk-assist')}</div></ScreenIntro>;

      case 'front-desk-assist':
        return <ScreenIntro icon={<ChatCircleDots size={30} />} eyebrow="Front desk help" title="Let the front desk connect you" text="Ask for a secure link or a 6-digit code."><div className="guest-contact-card"><div><small>The Henry Manila</small><b>+63 2 8807 8888</b><span>Front desk · 6:00 AM–10:00 PM</span></div><button aria-label="Call front desk" className="guest-icon-button"><ChatCircleDots /></button></div><Field label="Code from the front desk" name="staff-code" placeholder="6-digit code" />{primary('Connect my stay', 'booking-found')}<TextButton onClick={() => go('no-booking')}>I don’t have a booking</TextButton></ScreenIntro>;

      case 'no-booking':
        return <ScreenIntro icon={<Receipt size={30} />} eyebrow="No booking found" title="Connect a hotel booking" text="Cabana connects to confirmed hotel bookings."><Notice title="Already booked?">Try your confirmation number or ask the front desk for a link.</Notice>{primary('Try again', 'identify')}<TextButton onClick={() => go('identify-returning')}>Stayed with us before? Use a booking reference</TextButton><TextButton onClick={() => go('front-desk-assist')}>Contact front desk</TextButton></ScreenIntro>;

      case 'booking-found':
        return <ScreenIntro eyebrow="Booking found" title="Is this your stay?" text="Check the details, then continue."><StayCard booking={displayBooking} /><div className="guest-summary"><SummaryRow label="Guest" value={displayBooking.guestName} /><SummaryRow label="Guests" value={`${displayBooking.guestCount} guests`} /><SummaryRow label="Booked through" value={displayBooking.source} /></div><Button className="guest-button guest-button--primary" type="button" onClick={claimBooking}>Use this booking<ArrowRight aria-hidden="true" /></Button><TextButton onClick={() => go('identify')}>Use a different booking</TextButton></ScreenIntro>;

      case 'welcome-back':
        return <ScreenIntro icon={<CheckCircle size={30} />} eyebrow="Returning guest recognized" title={`Welcome back, ${session.guestName.split(' ')[0]}`} text="Your saved identity is ready for this stay at a new property."><StayCard booking={displayBooking} /><Notice tone="positive" icon={<Sparkle />} title="No typing needed">Review what we already have, then confirm your stay.</Notice>{primary('Review saved details', 'repeat-review')}</ScreenIntro>;

      case 'stay-overview':
        return <StayOverviewHome session={session} booking={primaryBooking} online={online} onNavigate={go} onSelectCategory={(cat) => setSelectedCategory(cat)} onOpenStay={(id) => { setSelectedPastStayId(id); go('stay-detail'); }} />;

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
          <AdditionalGuestsScreen
            primaryGuestName={session.guestName || 'Ana Santos'}
            primaryGuestEmail={session.email || 'ana@example.com'}
            initialGuests={session.additionalGuests}
            onSave={(validGuests) => {
              setSession((cur) => ({ ...cur, additionalGuests: validGuests }));
              go('early-check-in');
            }}
          />
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
        const bookingGuests = listBookingGuests(displayBooking, session);
        return (
          <ScreenIntro eyebrow={`Booking ${displayBooking.id}`} title="Room and rate" text="The latest details returned by the hotel system.">
            <StayCard booking={displayBooking} />

            {/*
              The stay's own facts, before the money. This screen is what the
              card's "Rate, policies and confirmation" promises, and it named
              neither the party nor the dates -- so a guest checking that the
              property knows who is coming had nowhere to look.
            */}
            <section>
              <SectionHeading title="This booking" />
              <div className="guest-summary">
                <SummaryRow label="Status" value={describeStayStatus(displayBooking).label} />
                <SummaryRow label="Dates" value={`${formatStayDateRange(displayBooking)} · ${countNights(displayBooking)}`} />
                <SummaryRow label="Room" value={displayBooking.roomNumber ? `${displayBooking.roomType} · ${displayBooking.roomNumber}` : `${displayBooking.roomType} · assigned at arrival`} />
                <SummaryRow label="Party" value={describeParty(displayBooking, session)} />
                <SummaryRow label="Booked through" value={displayBooking.source} />
                <SummaryRow label="Confirmation" value={displayBooking.id} />
              </div>
            </section>

            <section>
              <SectionHeading title="Guests" action="Edit" onAction={() => go('additional-guests')} />
              <div className="guest-guest-list">
                {bookingGuests.rows.map((guest) => guest.name ? (
                  <div key={guest.key} className="guest-guest-row">
                    <span className="guest-guest-row__avatar" aria-hidden="true">{guest.name.split(' ').map((part) => part[0]).slice(0, 2).join('')}</span>
                    <span className="guest-guest-row__text">
                      <b>{guest.name}</b>
                      <small>{guest.role === 'lead' ? 'Lead booker · ID on file' : 'Additional guest'}</small>
                    </span>
                    {guest.role === 'lead' ? <Tag tone="positive">You</Tag> : null}
                  </div>
                ) : (
                  <button key={guest.key} className="guest-guest-row is-pending" type="button" onClick={() => go('guest-details')}>
                    <span className="guest-guest-row__avatar is-pending" aria-hidden="true"><Person /></span>
                    <span className="guest-guest-row__text">
                      <b>Lead booker · name needed</b>
                      <small>Add the name on the reservation</small>
                    </span>
                    <CaretRight />
                  </button>
                ))}
                {/*
                  A booking reserved for more people than have been named is a
                  real state, and the property needs the names before arrival.
                  Saying so beats a silent short list.
                */}
                {bookingGuests.unnamed > 0 ? (
                  <button className="guest-guest-row is-pending" type="button" onClick={() => go('additional-guests')}>
                    <span className="guest-guest-row__avatar is-pending" aria-hidden="true"><Users /></span>
                    <span className="guest-guest-row__text">
                      <b>{bookingGuests.unnamed} {bookingGuests.unnamed === 1 ? 'guest' : 'guests'} not yet named</b>
                      <small>The property needs their details before arrival</small>
                    </span>
                    <CaretRight />
                  </button>
                ) : null}
              </div>
            </section>

            <section>
              <SectionHeading title="Rate" />
              <div className="guest-summary">
              <SummaryRow label={`${displayBooking.checkOut} · ${displayBooking.roomType}`} value="₱18,000" />
              <SummaryRow label="Taxes and fees" value="₱2,160" />
              <SummaryRow label="Booking total" value="₱20,160" strong />
              <SummaryRow label={`Paid through ${displayBooking.source}`} value="₱20,160" />
              </div>
            </section>
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

      case 'scan-room-code':
        return (
          <RoomCodeScanner
            roomNumber={primaryBooking?.roomNumber}
            onDetected={scanRoomCode}
            onCancel={back}
            reducedMotion={scannerReducedMotion}
            autoDetect={autoDetectScans}
          />
        );

      case 'stay-review': {
        /*
          One rating for the stay as a whole, and it goes to the property.
          Nothing here publishes: the app is only reachable at the point of
          booking, so there is no listing for a score to influence and a
          public rating would be a number with nowhere to go.
        */
        return (
          <form
            className="guest-stack"
            onSubmit={(event: FormEvent<HTMLFormElement>) => {
              event.preventDefault();
              const data = new FormData(event.currentTarget);
              const rating = Number(data.get('rating')) as StayReview['rating'];
              if (!rating) return;
              submitStayReview(rating, String(data.get('review-comment') ?? '').trim());
            }}
          >
            <div className="guest-page-title">
              <p className="guest-eyebrow">{contextBooking.property}</p>
              <h1>Rate your stay</h1>
              <p>{formatStayDateRange(contextBooking)} · {contextBooking.roomType}</p>
            </div>

            <fieldset className="guest-fieldset guest-rating">
              <legend>How was it?</legend>
              <div className="guest-rating__scale">
                {[1, 2, 3, 4, 5].map((value) => (
                  <label key={value} className="guest-rating__star">
                    <input type="radio" name="rating" value={value} aria-label={value === 1 ? '1 star' : `${value} stars`} required />
                    <span aria-hidden="true">{value}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <label className="guest-field">
              <span>Anything you&rsquo;d like the property to know?</span>
              <textarea name="review-comment" rows={4} placeholder="Optional" />
            </label>

            <Notice title="Private to the property">
              Only the property sees this. Cabana does not publish reviews or score listings.
            </Notice>

            <Button className="guest-button guest-button--primary" type="submit">
              Send to the property<ArrowRight aria-hidden="true" />
            </Button>
            <TextButton onClick={() => go('my-stay')}>Not now</TextButton>
          </form>
        );
      }

      case 'stay-review-sent':
        return (
          <ScreenIntro
            icon={<Check size={30} />}
            eyebrow={contextBooking.property}
            title="Thank you"
            text="Your rating has gone to the property team. Only the property sees this — Cabana does not publish reviews."
          >
            {stayReview?.comment ? <Notice title="What you sent">{stayReview.comment}</Notice> : null}
            {primary('Back to my stay', 'my-stay')}
            <TextButton onClick={() => go('book-stay')}>Book another stay</TextButton>
          </ScreenIntro>
        );

      case 'pre-arrival-services': {
        /*
          What a guest can arrange before they are in the room: getting there,
          and what should be waiting when they arrive. Everything else on the
          property needs a room to charge to and a guest standing in it, which
          is what the scan proves.
        */
        const arrivalServices = SERVICES.filter((service) => isPreArrivalService(service.id));
        return (
          <div className="guest-stack">
            <div className="guest-page-title">
              <p className="guest-eyebrow">{contextBooking.property} · {formatStayDateRange(contextBooking)}</p>
              <h1>Arrange your arrival</h1>
              <p>Booked ahead and paid by card. On-property services open once you scan the code in your room.</p>
            </div>

            {!online ? <Notice tone="offline" icon={<WifiSlash />} title="Browsing saved services">Live availability and booking require a connection.</Notice> : null}

            <section>
              <SectionHeading title="Getting here and settling in" />
              <div className="guest-list-group">
                {arrivalServices.map((service) => (
                  <button
                    key={service.id}
                    className="guest-list-row"
                    type="button"
                    onClick={() => go('service-booking')}
                  >
                    {/*
                      A bare glyph per row, not four copies of the category
                      chip. DESIGN.md's rule exists because a column of
                      identical tinted discs is the loudest thing on a screen
                      while marking nothing -- and four rows with four
                      different meanings deserve four glyphs.
                    */}
                    <span>{ARRIVAL_GLYPHS[service.id] ?? <Wrench />}</span>
                    <div>
                      <b>{service.name}</b>
                      {/* A complimentary thing is not paid by anything.
                          Saying "Paid by card" under it reads as a charge the
                          guest cannot find. */}
                      <small>{service.price === 'Complimentary' ? 'Complimentary' : `${service.price} · Paid by card`}</small>
                    </div>
                    <CaretRight />
                  </button>
                ))}
              </div>
            </section>

            <section>
              <SectionHeading title="Before you check in" />
              <div className="guest-list-group">
                <button className="guest-list-row" type="button" onClick={() => go('early-check-in')}>
                  <span><ClockCountdown /></span>
                  <div><b>Early check-in</b><small>Request an earlier room · Paid by card if charged</small></div>
                  <CaretRight />
                </button>
                <button className="guest-list-row" type="button" onClick={() => go('chat')}>
                  <span><ChatCircleDots /></span>
                  <div><b>Ask the front desk</b><small>Anything else you need arranged ahead</small></div>
                  <CaretRight />
                </button>
              </div>
            </section>

            <Notice title="The rest opens in your room">
              Dining, spa, tours and hotel services are charged to your room, so they open once you scan the code in it.
            </Notice>
          </div>
        );
      }

      case 'marketplace': {
        /*
          The one place the slot locks, and deliberately the only one. A wall
          shown to a guest three days out teaches them the app is closed; the
          same wall shown to a guest standing in their room, with the code in
          front of them, is the single moment the prompt can be acted on.

          A branch rather than a screen of its own: the tab must not change
          destination when it locks, or back-navigation and the active-tab
          highlight both fork.
        */
        if (bookingSlot.locked) {
          if (!primaryBooking) {
            // No booking at all. Not a room-allocation story -- there is
            // nothing to allocate against, so this is Home's job, not a wall.
            return (
              <EmptyStayHome
                guestName={session.guestName}
                pastStays={pastStays}
                onNavigate={go}
                onOpenStay={(id) => { setSelectedPastStayId(id); go('stay-detail'); }}
              />
            );
          }

          if (!contextBooking.roomNumber) {
            /*
              Nothing to scan. The property has not allocated a room yet, so
              telling this guest to find a code on a desk card sends them
              looking for something that does not exist.
            */
            return (
              <ScreenIntro
                icon={<ClockCountdown size={30} />}
                eyebrow={contextBooking.property}
                title="Your room is still being assigned"
                text="On-property services are charged to a room, so they open as soon as the property allocates yours."
              >
                <Notice title="Nothing is needed from you">The front desk is working through arrivals. This opens on its own.</Notice>
                {primary('Message the front desk', 'chat')}
                <TextButton onClick={() => go('pre-arrival-services')}>Arrange a transfer meanwhile</TextButton>
              </ScreenIntro>
            );
          }

          return unlockPending ? (
            <ScreenIntro
              icon={<ChatCircleDots size={30} />}
              eyebrow={contextRoom}
              title="The front desk has your request"
              text="They will confirm you are in the room and open services from their side. Nothing else is needed from you."
            >
              <Notice title="Why the desk and not the app">
                Cabana does not check anyone in. The property confirms who is in which room, and that confirmation is what opens charging to it.
              </Notice>
              {primary('Open the conversation', 'chat')}
              <TextButton onClick={() => go('room-qr-landing')}>I found the code after all</TextButton>
            </ScreenIntro>
          ) : (
            <ScreenIntro
              icon={<Lock size={30} />}
              eyebrow={contextRoom}
              title="Scan the code in your room"
              text="It is on the desk card. Scanning confirms you are in the room, which is what opens dining, spa, tours and charging to your room."
            >
              {/*
                The gate's label, not the stay badge. `describeStayStatus`
                says "Checked in" for any open stay window, which on this
                screen flatly contradicts the thing being asked for.
              */}
              <StayMiniCard booking={contextBooking} status={describeGuestGate(contextBooking).label} />
              <Button className="guest-button guest-button--primary" type="button" onClick={() => go('scan-room-code')}>
                Scan room code<ArrowRight aria-hidden="true" />
              </Button>
              <TextButton onClick={askFrontDeskToUnlock}>I can&rsquo;t scan</TextButton>
            </ScreenIntro>
          );
        }

        const featured = SERVICES.find((service) => service.id === 'spa')!;
        return (
          <div className="guest-stack guest-bookings-hub">
            <div className="guest-page-title">
              <p className="guest-eyebrow">{contextBooking.property} · {contextRoom}</p>
              <h1>Explore</h1>
              <p>Everything you can book during your stay.</p>
            </div>
            {!online ? <Notice tone="offline" icon={<WifiSlash />} title="Browsing saved services">Live availability and booking require a connection.</Notice> : null}

            {/*
              A catalogue, and only a catalogue. What the guest has already
              booked lives in My Stay -- one screen answering both questions was
              what made the old hub send people back to Home to browse.
            */}
            {/* One grid, driven by the on-property category list. */}
            <section>
              <SectionHeading title="Categories" />
              <div className="guest-category-grid">
                {MINI_APP_CATEGORIES.map((cat) => (
                  <ActionTile
                    key={cat.id}
                    icon={<CategoryIcon id={cat.id} />}
                    label={cat.title}
                    onClick={() => { setSelectedCategory(cat.id); go(cat.screen); }}
                  />
                ))}
              </div>
            </section>

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

            <FeaturedRail onOpenCategory={(category) => { setSelectedCategory(category); go('category-listing'); }} />
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
              <h1>{categoryData.title}</h1>
              <p>{categoryData.subtitle}.</p>
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
                        openServiceBooking();
                      }
                    }}
                  >
                    <ServiceImage imageKey={getServiceImageKey(service)} itemId={service.id} categoryId={service.categoryId} variant="thumbnail" tone={service.tone} icon={service.categoryId === 'spa' ? <Sparkle /> : service.categoryId === 'entertainment' ? <Compass /> : <Storefront />} decorative />
                    <div>
                      <h2>{service.name}</h2>
                      <p>{service.price} · {service.category}</p>
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
        return <ServiceDetail kind="hotel" booking={contextBooking} online={online} onBook={() => openServiceBooking()} onChat={() => go('chat')} />;

      case 'vendor-service':
        return <ServiceDetail kind="vendor" booking={contextBooking} online={online} onBook={() => openServiceBooking()} onChat={() => go('chat')} />;

      case 'service-booking':
        return <FormScreen step="Charged to room" title="Choose a time" text={`Live availability is shown for Hilom signature massage at ${contextBooking.property}.`}><div className="guest-date-strip"><button aria-pressed="false"><small>MON</small><b>10</b></button><button className="is-active" aria-pressed="true"><small>TUE</small><b>11</b></button><button aria-pressed="false"><small>WED</small><b>12</b></button></div><fieldset className="guest-fieldset"><legend>Available times</legend><div className="guest-chip-grid"><button type="button">10:00 AM</button><button className="is-active" type="button">1:30 PM</button><button type="button">4:00 PM</button></div></fieldset><SelectField label="Guests" name="party-size" defaultValue="1"><option value="1">1 guest</option><option value="2">2 guests</option></SelectField><div className="guest-summary"><SummaryRow label="Hilom signature massage" value="₱2,400" /><SummaryRow label="Property" value={contextBooking.property} /><SummaryRow label="Guest" value={session.guestName} /><SummaryRow label={contextRoom} value="Charge at checkout" /><SummaryRow label="Total added to folio" value="₱2,400" strong /></div><Button className="guest-button guest-button--primary" type="button" onClick={confirmService}>Confirm and charge to room<ArrowRight aria-hidden="true" /></Button></FormScreen>;

      case 'booking-confirmation':
        return <ScreenIntro icon={<Check size={30} />} eyebrow="Booking confirmed" title="Your massage is booked" text={`The charge has been added to ${contextRoom.toLowerCase()} and settles with your hotel folio at checkout.`}><div className="guest-ticket"><div><small>{contextService?.scheduledFor ?? 'Tuesday · November 11 · 1:30 PM'}</small><h2>1:30 PM</h2><p>{contextService?.title ?? 'Hilom signature massage'} · 1 guest</p></div><Tag>Confirmed</Tag></div><Notice title="Cancellation cutoff">Cancel yourself until 1:30 PM on November 10. After that, contact the front desk. The folio line remains.</Notice>{primary('View my stay', 'my-stay')}<TextButton onClick={() => go('marketplace')}>Book another service</TextButton></ScreenIntro>;

      /*
        Two different reasons a booking cannot go through, and they used to
        share one screen that blamed the network for both -- so a guest whose
        stay had not started was told to connect to Wi-Fi they were already on.
      */
      case 'booking-blocked':
        /*
          Three reasons, not two. `not-checked-in` used to cover both ends of a
          stay, so a guest who had checked out was told their stay "starts" on
          a date already behind them -- and pointed at a room they had left.
        */
        if (bookingBlockedReason === 'not-verified' || bookingBlockedReason === 'unlock-pending') {
          /*
            The split that matters. `not-checked-in` used to cover a guest
            three days out and a guest standing in their room, and the two
            need opposite things said: one is waiting, the other can act now.
          */
          return bookingBlockedReason === 'unlock-pending' ? (
            <ScreenIntro
              icon={<ChatCircleDots size={30} />}
              eyebrow={contextRoom}
              title="The front desk has your request"
              text="They will confirm you are in the room and open services from their side."
            >
              <Notice title="Nothing was booked">Your selection is not held. Try again once the desk confirms.</Notice>
              {primary('Open the conversation', 'chat')}
            </ScreenIntro>
          ) : (
            <ScreenIntro
              icon={<Lock size={30} />}
              eyebrow={contextRoom}
              title="Scan the code in your room"
              text="On-property services are charged to your room, so the property confirms you are in it first. The code is on the desk card."
            >
              <Notice title="Nothing was booked">Scanning takes a moment and opens everything at once.</Notice>
              <Button className="guest-button guest-button--primary" type="button" onClick={() => go('scan-room-code')}>
                Scan room code<ArrowRight aria-hidden="true" />
              </Button>
              <TextButton onClick={askFrontDeskToUnlock}>I can&rsquo;t scan</TextButton>
            </ScreenIntro>
          );
        }

        if (bookingBlockedReason === 'checked-out') {
          return (
            <ScreenIntro
              icon={<CheckCircle size={30} />}
              eyebrow="Stay complete"
              title="This stay is settled"
              text={`Your stay at ${contextBooking.property} ended ${formatStayDateRange(contextBooking).split('–').pop()?.trim()}. On-property services are charged to a room, so they close when you check out.`}
            >
              <Notice title="Nothing was booked">Your receipts stay in My Stay for as long as you want them.</Notice>
              {primary('View stay history', 'stay-history')}
              <TextButton onClick={() => go('marketplace')}>Keep browsing</TextButton>
            </ScreenIntro>
          );
        }

        return bookingBlockedReason === 'offline'
          ? <ScreenIntro icon={<WifiSlash size={30} />} eyebrow="Connection required" title="We can’t hold a time while offline" text="Live services are not queued because the slot or price could change before you reconnect."><Notice tone="offline" title="Nothing was booked">Connect to hotel Wi-Fi and try again. You can still message the front desk; the message will wait on this device.</Notice>{primary('Message the front desk', 'chat')}<TextButton onClick={() => { setOnline(true); go('vendor-service'); }}>Try again</TextButton></ScreenIntro>
          : <ScreenIntro icon={<Clock size={30} />} eyebrow="Not yet" title="On-property services open when you check in" text={`Your stay at ${contextBooking.property} starts ${formatStayDateRange(contextBooking).split('–')[0]}. Transfers and arrival services you can book now.`}><Notice title="Nothing was booked">On-property services are charged to a room, so they open once you are in it.</Notice>{primary('Arrange your arrival', 'pre-arrival-services')}<TextButton onClick={() => go('chat')}>Message the front desk</TextButton></ScreenIntro>;

      case 'my-stay': {
        if (!primaryBooking) {
          return (
            <EmptyStayHome
              guestName={session.guestName}
              pastStays={pastStays}
              onNavigate={go}
              onOpenStay={(id) => { setSelectedPastStayId(id); go('stay-detail'); }}
            />
          );
        }

        // A stay that has not started cannot have run anything up, so the folio
        // block is absent rather than showing a confident zero. Read off the
        // dates, not `status`: the two disagree when a PMS has not caught up.
        const started = hasStayStarted(contextBooking);
        const stayFolioTotal = session.folioTotal || contextBooking.folioTotal || '₱0';
        const stayCharges = getRoomCharges(session, contextBooking, contextRoom);
        const roomSoFar = started ? parsePesoAmount(stayFolioTotal) : 0;
        const tripTotal = formatPesoAmount(roomSoFar);

        /*
          A stay that is over is a receipt, not a running total. "This stay so
          far" is present tense about something finished, and it counted only
          what was charged against the room -- so a settled stay reported a
          room of ₱0 while still presenting a running total.
        */
        const checkedOut = describeStayStatus(contextBooking).status === 'checked-out';
        const finishedStay = checkedOut ? toFinishedStay(session, contextBooking) : undefined;
        const finishedSummary = finishedStay ? summarisePastStay(finishedStay) : undefined;

        return (
          <div className="guest-stack">
            <div className="guest-page-title">
              <p className="guest-eyebrow">My stay</p>
              <h1>{contextBooking.property}</h1>
              {/* The property is the subject; the label is the eyebrow. The
                  line beneath says the guest is in it, which nothing on this
                  screen said before. */}
              <p className="guest-checked-in">
                {/* The pulsing dot says "now". It has no business beside
                    "Checked out". */}
                {checkedOut ? null : <span className="guest-checked-in__dot" aria-hidden="true" />}
                {describeStayStatus(contextBooking).status === 'checked-in'
                  ? `Checked in · ${contextRoom}`
                  : `${describeStayStatus(contextBooking).label} · ${contextRoom}`}
              </p>
            </div>

            {!online ? <Notice tone="offline" icon={<WifiSlash />} title="Last-known stay details">Reconnect for the latest charges and availability.</Notice> : null}

            {/*
              One line, not a stat grid. Home's hero already carries the
              property, the dates, the room and a "View booking" row, so
              repeating them here said nothing new and pushed the running total
              -- the thing this screen exists to answer -- below the fold. What
              is left is what Home does not say: where the stay sits in time,
              and the reference details, behind one tap.
            */}
            <button className="guest-stay-context" type="button" onClick={() => go('rate-detail')}>
              <span className="guest-stay-context__clock" aria-hidden="true"><ClockCountdown /></span>
              <span className="guest-stay-context__text">
                <b>{describeCheckoutCountdown(contextBooking)}</b>
                <small>{formatStayDateRange(contextBooking)} · {contextBooking.guestCount} {contextBooking.guestCount === 1 ? 'guest' : 'guests'} · {contextBooking.source}</small>
              </span>
              <CaretRight />
            </button>

            {checkedOut ? (
              /*
                Says which of the two post-stay surfaces this is. The desk is
                reachable for a day after checkout because a guest chases a
                lost item or a disputed charge then; after that the stay is a
                receipt, and pretending the conversation is still open would
                be the unkind version.
              */
              <p className={`guest-desk-window${postStayWindow.deskOpen ? ' is-open' : ''}`}>
                {postStayWindow.deskOpen ? <ChatCircleDots aria-hidden="true" /> : <Clock aria-hidden="true" />}
                {postStayWindow.label}
              </p>
            ) : null}

            {finishedStay && finishedSummary ? (
              <section className="guest-stay-receipt">
                <div className="guest-total-card">
                  <span>This stay</span>
                  <strong>{finishedStay.total}</strong>
                  <small>
                    {finishedStay.nights} {finishedStay.nights === 1 ? 'night' : 'nights'}
                    {contextBooking.roomNumber ? ` · Room ${contextBooking.roomNumber}` : ''} · settled at checkout
                  </small>
                </div>

                <div className="guest-summary">
                  <SummaryRow label={`${finishedStay.roomType} · ${finishedStay.nights} ${finishedStay.nights === 1 ? 'night' : 'nights'}`} value={finishedStay.roomRate} />
                  {finishedSummary.groups.map((group) => (
                    <SummaryRow key={group.category} label={group.category} value={group.formattedTotal} />
                  ))}
                  <SummaryRow label="Total settled" value={finishedStay.total} strong />
                </div>

                <TextButton onClick={() => { setSelectedPastStayId(finishedStay.id); go('stay-detail'); }}>
                  See every charge
                </TextButton>
              </section>
            ) : started ? (
              <div className="guest-running-total">
                <div className="guest-total-card">
                  <span>This stay so far</span>
                  <strong>{tripTotal}</strong>
                  <small>
                    Settles with the hotel at checkout
                  </small>
                </div>
                {started ? (
                  <button className="guest-running-total__action" onClick={() => go('folio')} type="button">
                    <span aria-hidden="true"><Receipt /></span>
                    <span>Room charges<small>{stayCharges.length} {stayCharges.length === 1 ? 'line' : 'lines'}</small></span>
                    <CaretRight />
                  </button>
                ) : null}
              </div>
            ) : null}

            {/*
              Tabbed, not two stacked sections. Past bookings are reference
              material a guest consults occasionally; stacking them under the
              live ones meant scrolling past history to reach what is next.
            */}
            <section>
              <div className="guest-tabs" role="tablist" aria-label="Bookings">
                {(['upcoming', 'past'] as const).map((tab) => (
                  <button
                    key={tab}
                    role="tab"
                    aria-selected={stayTab === tab}
                    className="guest-tab"
                    onClick={() => setStayTab(tab)}
                    type="button"
                  >
                    {tab === 'upcoming' ? 'Upcoming' : 'Past'}
                    <span className="guest-tab__count">{tab === 'upcoming' ? stayEntries.upcoming.length : stayEntries.past.length}</span>
                  </button>
                ))}
              </div>

              {visibleStayEntries.length ? (
                <div className="guest-stay-entries" key={stayTab}>
                  {visibleStayEntries.map((entry) => (
                    <StayEntryCard
                      key={entry.id}
                      entry={entry}
                      onOpen={() => { setSelectedStayEntryId(entry.id); go('stay-entry'); }}
                    />
                  ))}
                </div>
              ) : (
                <div className="guest-hub-empty">
                  <h2>{stayTab === 'upcoming' ? 'Nothing booked yet' : 'Nothing here yet'}</h2>
                  {/*
                    A stay that is over cannot be sold anything. This block
                    was inviting a checked-out guest to charge to a room they
                    had left, and pointing at an Explore tab their bar no
                    longer carries.
                  */}
                  <p>
                    {stayTab !== 'upcoming'
                      ? 'Bookings move here once they are done or cancelled.'
                      : checkedOut
                        ? 'Nothing was left open when you checked out.'
                        : `Dining, spa, tours, and hotel services are in Explore. Bookings are added to ${contextRoom.toLowerCase()} and settle at checkout.`}
                  </p>
                  {stayTab === 'upcoming' && !checkedOut ? (
                    <Button className="guest-button guest-button--primary" type="button" onClick={() => go('marketplace')}>
                      Explore on-property<ArrowRight aria-hidden="true" />
                    </Button>
                  ) : null}
                </div>
              )}
            </section>

            {/*
              Docked. Reaching the front desk was the last row on a screen that
              scrolls -- so the one action a guest wants when something is
              wrong was the hardest thing here to reach. It now holds above the
              tab bar, and the spacer keeps the last booking card clear of it.
            */}
            <div className="guest-dock-spacer" aria-hidden="true" />
            {checkedOut ? (
              /*
                The front desk is demoted rather than dropped -- a guest still
                chases a lost item or a billing query after checkout -- but it
                is no longer the only thing a finished stay offers.
              */
              <div className="guest-dock guest-dock--single guest-dock--stacked">
                <Button className="guest-button guest-button--primary" type="button" onClick={() => go('book-stay')}>
                  Book another stay<ArrowRight aria-hidden="true" />
                </Button>
                {postStayWindow.deskOpen ? (
                  <button className="guest-dock__quiet" data-testid="guest-front-desk-action" onClick={() => go('chat')} type="button">
                    Message the front desk
                  </button>
                ) : stayReview ? (
                  <p className="guest-dock__note">You rated this stay {stayReview.rating} out of 5. Thank you.</p>
                ) : (
                  <button className="guest-dock__quiet" onClick={() => go('stay-review')} type="button">
                    Rate your stay
                  </button>
                )}
              </div>
            ) : (
              <div className="guest-dock guest-dock--single">
                <button className="guest-dock__action" data-testid="guest-front-desk-action" onClick={() => go('chat')} type="button">
                  <span className="guest-dock__glyph" aria-hidden="true"><ChatCircleDots /></span>
                  <span className="guest-dock__label">
                    <b>Message the front desk</b>
                    <small>{online ? 'Usually replies in a few minutes' : 'Sends when you reconnect'}</small>
                  </span>
                  <CaretRight />
                </button>
              </div>
            )}
          </div>
        );
      }

      case 'stay-entry': {
        const allEntries = [...stayEntries.upcoming, ...stayEntries.past];
        const entry = allEntries.find((item) => item.id === selectedStayEntryId) ?? allEntries[0];
        if (!entry) {
          return (
            <EmptyStayHome
              guestName={session.guestName}
              pastStays={pastStays}
              onNavigate={go}
              onOpenStay={(id) => { setSelectedPastStayId(id); go('stay-detail'); }}
            />
          );
        }

        return (
          <div className="guest-stack">
            <div className="guest-page-title">
              <p className="guest-eyebrow">{entry.parent}{entry.parentDetail ? ` · ${entry.parentDetail}` : ''}</p>
              <h1>{entry.title}</h1>
              <p>{entry.detail}</p>
            </div>

            {/*
              The itemisation is the reason to open this. The card can only say
              "3 items", which is a count rather than an answer -- a guest
              checking what a charge on their room was for needs the order read
              back to them.
            */}
            <section>
              {entry.lines.length > 1 ? <SectionHeading title="Items" /> : null}
              <div className="guest-summary">
                {entry.lines.length > 1
                  ? entry.lines.map((line) => (
                      <SummaryRow
                        key={line.id}
                        label={line.detail ? `${line.label} · ${line.detail}` : line.label}
                        value={line.amount}
                      />
                    ))
                  : entry.lines[0]?.detail
                    ? <SummaryRow label={entry.lines[0].detail} value={entry.lines[0].amount} />
                    : null}
                <SummaryRow label="Total" value={entry.amount} strong />
              </div>
            </section>

            <Notice
              tone={entry.status === 'cancelled' ? 'neutral' : 'positive'}
              title={entry.status === 'cancelled' ? 'Cancelled' : 'Charged to your room'}
            >
              {entry.settlement ?? `Added to ${contextRoom.toLowerCase()} and settles with the hotel at checkout.`}
            </Notice>

            {/*
              Cancelling is an action on the booking, reached from the booking
              -- not the thing an ordinary tap does.
            */}
            {entry.canCancel ? (
              <>
                {primary('Change or cancel', 'cancel-before-cutoff')}
                <TextButton onClick={() => go('chat')}>Ask the front desk</TextButton>
              </>
            ) : (
              <button className="guest-list-row" onClick={() => go('chat')} type="button">
                <span><ChatCircleDots /></span>
                <div><b>Ask the front desk</b><small>{entry.status === 'confirmed' ? 'To change or cancel this' : 'About this charge'}</small></div>
                <CaretRight />
              </button>
            )}
          </div>
        );
      }

      case 'notifications': {
        if (!notifications.length) {
          return (
            <div className="guest-stack">
              <div className="guest-page-title"><p className="guest-eyebrow">Updates</p><h1>Notifications</h1></div>
              <div className="guest-hub-empty">
                <h2>You’re all caught up</h2>
                <p>Room updates, booking confirmations and new room charges appear here.</p>
              </div>
            </div>
          );
        }

        return (
          <div className="guest-stack">
            <div className="guest-page-title"><p className="guest-eyebrow">Updates</p><h1>Notifications</h1></div>
            <div className="guest-notifications">
              {notifications.map((item) => {
                const unread = !readNotificationIds.includes(item.id);
                return (
                  <button
                    key={item.id}
                    type="button"
                    className="guest-notification"
                    data-unread={unread}
                    onClick={() => openNotification(item)}
                  >
                    <span className={`guest-notification__icon guest-notification__icon--${item.tone}`} aria-hidden="true">
                      <NotificationIcon tone={item.tone} />
                    </span>
                    <div className="guest-notification__body">
                      <b>{item.title}</b>
                      <p>{item.body}</p>
                      <small>{item.time}</small>
                    </div>
                    {unread ? <span className="guest-notification__dot"><span className="sr-only">Unread</span></span> : null}
                  </button>
                );
              })}
            </div>
          </div>
        );
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
          go('my-stay');
        };
        return <ScreenIntro eyebrow="30 hours before service" title="Cancel this booking?" text="This is before the provider’s 24-hour cutoff, so you can cancel it yourself."><div className="guest-ticket"><div><small>{cancellableService.scheduledFor}</small><h2>1:30 PM</h2><p>{cancellableService.title} · {cancellableService.amount} · {contextRoom}</p></div></div><Notice tone="positive" title="The folio line will be removed">This service has not settled. No money moves when you cancel.</Notice><button className="guest-button guest-button--danger" onClick={cancelService} type="button">Cancel service</button><TextButton onClick={() => go('my-stay')}>Keep booking</TextButton><div className="guest-provisional"><b>Provisional decision</b><p>Confirm that third-party providers accept a 24-hour self-service cancellation window.</p></div></ScreenIntro>;
      }

      case 'cancel-after-cutoff':
        return <ScreenIntro eyebrow="4 hours before service" title="Contact the front desk to change this" text="The provider’s 24-hour self-service cutoff has passed. The charge stays on your room folio."><Notice tone="warning" title="Front desk help required">Send a message and the team will check what the provider can do.</Notice>{primary('Chat with front desk', 'chat')}<TextButton onClick={() => go('my-stay')}>Keep booking</TextButton><div className="guest-provisional"><b>Provisional decision</b><p>Confirm that third-party providers accept a 24-hour self-service cancellation window.</p></div></ScreenIntro>;

      case 'folio': {
        const folioCharges = getRoomCharges(session, contextBooking, contextRoom);
        const folioTotal = session.folioTotal || contextBooking.folioTotal || '₱0';
        return <div className="guest-stack"><div className="guest-page-title"><p className="guest-eyebrow">{contextBooking.property} · {contextRoom} · Last updated 2:14 PM</p><h1>Room charges</h1><p>These charges settle with the hotel at checkout.</p></div>{!online ? <Notice tone="offline" title="Last-known folio">Reconnect for the latest charges.</Notice> : null}<div className="guest-total-card"><span>Current room total</span><strong>{folioTotal}</strong><small>Booking room rate paid through {contextBooking.source}</small></div><div className="guest-folio">{folioCharges.map((charge) => <FolioItem key={charge.id} date={charge.date} title={charge.title} meta={charge.detail} amount={charge.amount} />)}</div><Notice title="Questions about a charge?">The front desk can explain or correct a folio line before checkout.</Notice>{primary('Ask the front desk', 'chat')}</div>;
      }

      case 'chat':
      case 'chat-after-hours': {
        const afterHours = activeScreen === 'chat-after-hours';
        return <div className="guest-chat"><div className="guest-chat__intro"><div><Tag tone={afterHours ? 'warning' : 'positive'}>{afterHours ? 'Outside staffed hours' : 'Front desk online'}</Tag><h1>Front desk</h1><p>{afterHours ? `Messages send now. The team responds from 6:00 AM for ${contextBooking.property}.` : `Shared property inbox for ${contextBooking.property} · Usually replies in a few minutes.`}</p></div></div>{!online ? <Notice tone="offline" title="Messages will send when connected">Your chat history is available. New requests wait on this device.</Notice> : null}<div className="guest-quick-actions" aria-label="Quick requests"><button onClick={() => sendQuickMessage('Could we get two fresh towels, please?')}>Towels</button><button onClick={() => sendQuickMessage(`Please arrange housekeeping for ${contextRoom.toLowerCase()}.`)}>Housekeeping</button><button onClick={() => sendQuickMessage('Can we request a late checkout?')}>Late checkout</button><button onClick={() => sendQuickMessage('We need help arranging a transfer.')}>Transfers</button></div><div className="guest-messages" aria-live="polite">{chatMessages.map((message, index) => <div key={`${message.body}-${index}`} className={`guest-message guest-message--${message.from}`}><p>{message.body}</p>{message.state ? <small>{message.state}</small> : null}</div>)}{sending ? <div className="guest-message guest-message--desk guest-message--typing"><SpinnerGap className="guest-spin" /><span>Front desk is replying</span></div> : null}</div>{unlockPending ? <div className="guest-desk-grant"><small>Front desk view — this prototype stands in for the desk&rsquo;s own tool</small><Button className="guest-button guest-button--secondary" type="button" onClick={grantFrontDeskUnlock}>Confirm Ana Santos is in room {contextBooking.roomNumber ?? ''}</Button></div> : null}<form className="guest-composer" onSubmit={(event: FormEvent<HTMLFormElement>) => { event.preventDefault(); const form = new FormData(event.currentTarget); const body = String(form.get('message') ?? '').trim(); if (body) sendQuickMessage(body); event.currentTarget.reset(); }}><label className="sr-only" htmlFor="message">Message the front desk</label><input id="message" name="message" placeholder="Ask the front desk" /><button aria-label="Send message" type="submit"><ArrowRight /></button></form></div>;
      }

      case 'room-qr-midstay':
        /*
          "You're checked in" was the old title and it was a claim the app has
          no standing to make -- the front desk checks a guest in, against the
          property's own PMS. What the app knows is narrower and is the whole
          basis of the gate: this guest is in this room.
        */
        return <ScreenIntro icon={<CheckCircle size={30} />} eyebrow={`${contextRoom} confirmed`} title="Your room is linked" text="Dining, spa, tours and charging to your room are open. The front desk still handles check-in itself."><StayMiniCard booking={contextBooking} status={`Active until ${contextBooking.checkOut}`} />{primary('Explore services', 'marketplace')}<button className="guest-button guest-button--secondary" onClick={() => go('stay-overview')}>Open stay overview</button></ScreenIntro>;

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
            <button className="guest-list-row" type="button" aria-label="Sign out" onClick={signOut}>
              <span><SignOut /></span>
              <div><b>Sign out</b><small>Return to the welcome screen</small></div>
              <CaretRight />
            </button>
          </div>
        );

      case 'stay-history': {
        const lifetime = formatPesoAmount(pastStays.reduce((sum, stay) => sum + parsePesoAmount(stay.total), 0));
        const nights = pastStays.reduce((sum, stay) => sum + stay.nights, 0);
        return (
          <div className="guest-stack">
            <div className="guest-page-title">
              <p className="guest-eyebrow">Across properties</p>
              <h1>Stay history</h1>
              <p>{pastStays.length} completed stays · {nights} nights · {lifetime} spent</p>
            </div>
            {pastStays.map((stay) => (
              <HistoryItem
                key={stay.id}
                stay={stay}
                onOpen={() => { setSelectedPastStayId(stay.id); go('stay-detail'); }}
              />
            ))}
          </div>
        );
      }

      case 'stay-detail': {
        /*
          The stay a guest has just checked out of is not in `PAST_STAYS` -- it
          is still a live `Booking` in the session -- so "See every charge" on
          My Stay had nowhere correct to land until this fallback existed.
        */
        const currentAsFinished = primaryBooking && selectedPastStayId === primaryBooking.id
          ? toFinishedStay(session, primaryBooking)
          : undefined;
        const stay = findPastStay(pastStays, selectedPastStayId ?? '') ?? currentAsFinished ?? pastStays[0];
        const summary = summarisePastStay(stay);
        return (
          <div className="guest-stack">
            <div className="guest-page-title">
              <p className="guest-eyebrow">{formatPastStayDates(stay)} · {stay.nights} {stay.nights === 1 ? 'night' : 'nights'}</p>
              <h1>{stay.property}</h1>
              <p>Room {stay.roomNumber} · {stay.roomType} · {stay.guestCount} {stay.guestCount === 1 ? 'guest' : 'guests'}</p>
            </div>

            <div className="guest-total-card">
              <span>Total for this stay</span>
              <strong>{stay.total}</strong>
              <small>{stay.roomRate} room · {summary.extras} charged to room {stay.roomNumber}</small>
            </div>

            <section className="guest-stay-summary">
              <div className="guest-stay-summary__stats">
                <div><small>Room rate</small><b>{stay.roomRate}</b></div>
                <div><small>Per night</small><b>{summary.perNight}</b></div>
                <div><small>Extras</small><b>{summary.extras}</b></div>
                <div><small>Booked via</small><b>{stay.source}</b></div>
              </div>
            </section>

            {/*
              Grouped by what sold it, largest first. A flat ledger answers
              "what did I pay" but not "what did I spend it on", which is the
              question a guest looking back actually has.
            */}
            {summary.groups.map((group) => (
              <section key={group.category}>
                <SectionHeading title={group.category} />
                <div className="guest-stay-entries">
                  {group.charges.map((charge) => (
                    <div key={charge.id} className="guest-stay-entry is-static">
                      <span className="guest-stay-entry__parent">
                        <span aria-hidden="true"><Storefront /></span>
                        <span>{charge.parent}</span>
                      </span>
                      <span className="guest-stay-entry__headline">
                        <h2>{charge.title}</h2>
                        <strong>{charge.amount}</strong>
                      </span>
                      <span className="guest-stay-entry__when">{charge.detail}</span>
                    </div>
                  ))}
                </div>
                <div className="guest-stay-group-total">
                  <span>{group.category} total</span>
                  <b>{group.formattedTotal}</b>
                </div>
              </section>
            ))}

            <Notice title="Settled at checkout">Every line above was charged to room {stay.roomNumber} and paid when you checked out on {formatPastStayDates(stay).split('–').pop()}.</Notice>
          </div>
        );
      }
    }
  };

  return (
    <div className="guest-prototype-stage">
      <div className="sr-only" role="status" aria-live="polite">
        {roomReadyNotification ? `${roomReadyNotification.headline}. ${roomReadyNotification.detail}` : ''}
      </div>

      <PrototypeControls
        online={online}
        stayState={getPrototypeStayState(session)}
        onStayStateChange={applyStayState}
        onSimulateRoomReady={simulateRoomReady}
        canSimulateRoomReady={Boolean(eligibleRoomReadyBooking)}
        roomVerified={Boolean(primaryBooking?.roomVerification)}
        onToggleRoomVerified={toggleRoomVerified}
        canToggleRoomVerified={Boolean(primaryBooking)}
        hasHistory={pastStays.length > 0}
        onToggleHistory={toggleHistory}
        hasReview={session.reviews.some((review) => review.bookingId === contextBooking.id)}
        onClearReview={clearReview}
        autoDetectScans={autoDetectScans}
        onToggleAutoDetectScans={() => setAutoDetectScans((on) => !on)}
        onReset={resetPrototype}
      />

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
            {/*
              The bell, not the avatar. Profile became a labelled destination in
              the tab bar, and two routes to one screen from one viewport is the
              duplication this pass removed elsewhere.
            */}
            <div className="guest-appbar__side guest-appbar__side--end">
              {session.auth === 'authenticated' || session.bookings.length > 0 ? (
                <>
                  {/*
                    The scan lives here because DESIGN.md's own rule puts
                    actions in this slot and places in the tab bar -- and
                    because as a list row on Home it was unfindable: a guest
                    holding the code had to scroll past the stay card and the
                    booking row to reach the one thing they were trying to do.
                    A dot marks it while the room is still unverified, the same
                    way the bell marks unread.
                  */}
                  {/*
                    Only with a room to scan. No booking means no allocated
                    room and therefore no code on any desk card, so the icon
                    would open a viewfinder that could never succeed.
                  */}
                  {primaryBooking?.roomNumber ? (
                    <button
                      className="guest-icon-button guest-scan-action"
                      type="button"
                      data-testid="guest-scan-action"
                      onClick={() => go('scan-room-code')}
                      aria-label={scanPending ? 'Scan room code, room not yet verified' : 'Scan room code'}
                    >
                      <QrCode />
                      {scanPending ? <span className="guest-bell__dot" aria-hidden="true" /> : null}
                    </button>
                  ) : null}
                  <button
                    className="guest-icon-button guest-bell"
                    type="button"
                    onClick={openNotifications}
                    aria-label={unreadNotifications ? `Notifications, ${unreadNotifications} unread` : 'Notifications'}
                  >
                    <Bell />
                    {unreadNotifications ? <span className="guest-bell__dot" aria-hidden="true" /> : null}
                  </button>
                </>
              ) : null}
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

          {showPrimaryNav ? (
            <nav className="guest-bottom-nav" aria-label="Primary navigation">
              <NavButton
                label="Home"
                icon={<House />}
                active={activeScreen === 'stay-overview'}
                onClick={() => go('stay-overview')}
              />
              {/*
                Both of these describe a stay, so without one they are two
                doors onto nothing: Explore sells things charged to a room the
                guest has not got, and My Stay has no stay to show. Leaving
                them in place sent a guest with no booking to a dead end that
                told them their room was "still being assigned".

                This is the one place the four-slot rule yields. The rule
                exists so the bar never reflows mid-journey and a destination
                never vanishes from under a guest -- and here the destinations
                genuinely do not exist yet. They appear, permanently, the
                moment a booking is added.
              */}
              {primaryBooking ? (
                <>
                  <NavButton
                    label={bookingSlot.label}
                    icon={bookingSlot.label === 'Arrival'
                      ? <SuitcaseRolling />
                      : bookingSlot.label === 'Book again' ? <Plus /> : <Compass />}
                    active={EXPLORE_SCREENS.includes(activeScreen) || activeScreen === bookingSlot.screen}
                    onClick={() => go(bookingSlot.screen)}
                  />
                  <NavButton
                    label="My Stay"
                    icon={<Bed />}
                    active={MY_STAY_SCREENS.includes(activeScreen)}
                    onClick={() => go('my-stay')}
                  />
                </>
              ) : null}
              <NavButton
                label="Profile"
                icon={<UserCircle />}
                active={activeScreen === 'profile' || activeScreen === 'stay-history'}
                onClick={() => go('profile')}
              />
            </nav>
          ) : null}
        </section>
      </main>
    </div>
  );
}

function PrototypeControls({
  online,
  stayState,
  onStayStateChange,
  onSimulateRoomReady,
  canSimulateRoomReady,
  roomVerified,
  onToggleRoomVerified,
  canToggleRoomVerified,
  hasHistory,
  onToggleHistory,
  hasReview,
  onClearReview,
  autoDetectScans,
  onToggleAutoDetectScans,
  onReset,
}: {
  online: boolean;
  stayState: PrototypeStayState;
  onStayStateChange: (state: PrototypeStayState) => void;
  onSimulateRoomReady: () => void;
  canSimulateRoomReady: boolean;
  roomVerified: boolean;
  onToggleRoomVerified: () => void;
  canToggleRoomVerified: boolean;
  hasHistory: boolean;
  onToggleHistory: () => void;
  hasReview: boolean;
  onClearReview: () => void;
  autoDetectScans: boolean;
  onToggleAutoDetectScans: () => void;
  onReset: () => void;
}) {
  /*
    Collapsed by default. This is scaffolding, not part of the product, and as
    an always-open panel it sat on top of whatever the screen had docked above
    the tab bar -- the front desk bar on My Stay and the dining mini cart. A
    demo should show the app, not the rig it runs on.
  */
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        className="guest-prototype-trigger"
        type="button"
        onClick={() => setOpen(true)}
        aria-expanded={false}
        aria-label="Open prototype controls"
      >
        <Wrench aria-hidden="true" />
      </button>
    );
  }

  return (
    <aside className="guest-prototype-toolbar" role="region" aria-label="Prototype controls">
      <div className="guest-prototype-toolbar__head">
        <div>
          <span>Prototype controls</span>
          <small>{online ? 'Switch the stay state, or fire a PMS event.' : 'Reconnect to fire a PMS event.'}</small>
        </div>
        <button
          className="guest-prototype-toolbar__close"
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Close prototype controls"
        >
          <X aria-hidden="true" />
        </button>
      </div>
      {/*
        Everything but the head scrolls. The panel gains rows with every
        feature, and on a phone it had grown past the viewport -- carrying
        its own close button off the top of the screen. Sticky on the head
        does not work here: it is a grid item, so its containing block is
        its own track and it has nowhere to stick to.
      */}
      <div className="guest-prototype-toolbar__body">
        <fieldset className="guest-prototype-states">
          <legend>Stay state</legend>
          {PROTOTYPE_STAY_STATES.map((state) => (
            <label key={state.id} className="guest-prototype-states__option">
              <input
                type="radio"
                name="prototype-stay-state"
                value={state.id}
                checked={stayState === state.id}
                onChange={() => onStayStateChange(state.id)}
              />
              <span>
                <b>{state.label}</b>
                <small>{state.detail}</small>
              </span>
            </label>
          ))}
        </fieldset>

        {/*
          Was the panel's only control, and the panel only rendered when it was
          usable -- which hid the switcher in exactly the states worth switching
          away from. It is a disabled row now, not a reason to hide the rig.
        */}
        <button type="button" onClick={onSimulateRoomReady} disabled={!online || !canSimulateRoomReady}>
          <BellRinging aria-hidden="true" />
          Simulate room ready
        </button>

        {/*
          Everything below flips one fact directly, without walking the flow
          that normally sets it. Six stay states cover the common shapes; these
          cover the corners inside them -- re-running a scan, checking what a
          guest with no history sees, taking a rating twice.
        */}
        <fieldset className="guest-prototype-states">
          <legend>Gates and state</legend>

          <button type="button" onClick={onToggleRoomVerified} disabled={!canToggleRoomVerified}>
            <QrCode aria-hidden="true" />
            {roomVerified ? 'Clear room verification' : 'Verify room (skip the scan)'}
          </button>

          <button type="button" onClick={onToggleHistory}>
            <Receipt aria-hidden="true" />
            {hasHistory ? 'Clear stay history' : 'Seed stay history'}
          </button>

          <button type="button" onClick={onClearReview} disabled={!hasReview}>
            <Sparkle aria-hidden="true" />
            Clear stay review
          </button>

          {/*
            A presenter holding on the viewfinder to talk about it needs the
            countdown to stop, or the screen scans itself out from under them.
          */}
          <button type="button" onClick={onToggleAutoDetectScans}>
            <ClockCountdown aria-hidden="true" />
            {autoDetectScans ? 'Scanner: auto-detects after 2s' : 'Scanner: waits for the button'}
          </button>
        </fieldset>

        <button className="guest-prototype-toolbar__reset" type="button" onClick={onReset}>
          Reset saved session
        </button>
      </div>

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
  online?: boolean;
  onNavigate: (screen: ActiveScreen) => void;
  onSelectCategory: (cat: MiniAppCategoryId) => void;
  onOpenStay: (id: string) => void;
};

function StayOverviewHome({ session, booking, onNavigate, onSelectCategory, onOpenStay }: StayOverviewHomeProps) {
  const [roomReadyDismissed, setRoomReadyDismissed] = useState(false);
  const variant = getHomeVariant(session.bookings, session.activeBookingId);
  const upcomingBookings = session.bookings
    .filter((item) => item.status === 'upcoming')
    .sort((a, b) => a.checkIn.localeCompare(b.checkIn));

  if (variant === 'empty' || !booking) {
    return (
      <EmptyStayHome
        guestName={session.guestName}
        pastStays={session.pastStays}
        onNavigate={onNavigate}
        onOpenStay={onOpenStay}
      />
    );
  }

  if (variant === 'active') {
    const confirmedServices = session.serviceBookings.filter(
      (service) => service.status === 'confirmed' && service.bookingId === booking.id,
    );
    const roomLabel = booking.roomNumber ? `Room ${booking.roomNumber}` : 'Active room';
    return (
      <div className="guest-stack guest-home-booking guest-home-booking--active" data-testid="guest-home-active">
        <section className="guest-stay-hero-card">
          <div className="guest-stay-hero-card__media">
            <PropertyImage property={booking.property} aspectRatio="21/9" decorative />
            <div className="guest-stay-hero-card__badges">
              <Tag tone="positive">{describeStayStatus(booking).label}</Tag>
              <span className="guest-tag guest-tag--dark">{roomLabel}</span>
            </div>
          </div>
          <div className="guest-stay-hero-card__body">
            <p className="guest-eyebrow">{greetGuest(session.guestName, 'Your stay', booking.roomNumber)}</p>
            <h1>{booking.property}</h1>
            <div className="guest-stay-hero-card__chips">
              <span>{booking.city}</span>
            </div>
            {/*
              Dates and room live here, not in a separate "Stay details" grid.
              One card answers where, when and which room, so the two facts
              cannot drift apart across sections.
            */}
            <div className="guest-stay-hero-card__stats">
              <div><small>Dates</small><b>{formatStayDateRange(booking)}</b></div>
              <div><small>Room</small><b>{booking.roomNumber ? `${booking.roomType} · ${booking.roomNumber}` : booking.roomType}</b></div>
              <div><small>Guests</small><b>{describeParty(booking, session)}</b></div>
              <div><small>Nights</small><b>{countNights(booking)}</b></div>
            </div>
          </div>
          <div className="guest-stay-hero-card__actions">
            <button className="guest-list-row" onClick={() => onNavigate('rate-detail')} type="button"><span><Ticket /></span><div><b>View booking</b><small>Rate, policies and confirmation</small></div><CaretRight /></button>
          </div>
        </section>
        {/*
          Only while it is the thing in the way. Once the room is verified the
          scan is just an action, and it lives in the app bar where every
          screen can reach it -- repeating it here as a row was what made it
          unfindable in the first place, one quiet line among many.
        */}
        {canUseOnPropertyServices(booking) ? null : (
          <section className="guest-home-room-qr" aria-label="Room access">
            <Button className="guest-button guest-button--primary" type="button" data-testid="guest-room-qr-action" onClick={() => onNavigate('scan-room-code')}>
              <QrCode aria-hidden="true" />Scan your room code<ArrowRight aria-hidden="true" />
            </Button>
          </section>
        )}
        <AnnouncementsSection />
        <section>
          <SectionHeading title="Categories" action="See all" onAction={() => onNavigate('marketplace')} />
          <div className="guest-miniapp-row" role="group" aria-label="Experience categories">
            {MINI_APP_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                className="guest-miniapp-tile"
                onClick={() => {
                  onSelectCategory(cat.id);
                  onNavigate(cat.screen);
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
        {confirmedServices[0] ? <section className="guest-home-next-service"><SectionHeading title="Next up" action="See all" onAction={() => onNavigate('marketplace')} /><div className="guest-booking-card is-static"><div><h2>{confirmedServices[0].title}</h2><p>{confirmedServices[0].scheduledFor} · {confirmedServices[0].amount}</p><small>Added to {roomLabel.toLowerCase()} · settles at checkout</small></div></div></section> : null}
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
        <Button className="guest-button guest-button--primary" type="button" onClick={() => onNavigate('identify')}>Connect another stay<ArrowRight aria-hidden="true" /></Button>
        <TextButton onClick={() => onNavigate('stay-history')}>View stay history</TextButton>
      </div>
    );
  }

  const roomAssignment = describeRoomAssignment(booking);
  const stayStatus = describeStayStatus(booking);

  return (
    <div className="guest-stack guest-home-booking guest-home-booking--upcoming" data-testid="guest-home-upcoming">
      <div className="guest-stay-hero-card">
        <div className="guest-stay-hero-card__media">
          <PropertyImage property={booking.property} aspectRatio="21/9" decorative />
          <div className="guest-stay-hero-card__badges">
            {/* Read off the window, not `status`: the badge said "Upcoming"
                over a stay the dates had under way. */}
            <Tag tone={stayStatus.status === 'checked-in' ? 'positive' : 'warning'}>{stayStatus.label}</Tag>
            <span className="guest-tag guest-tag--dark">{booking.city}</span>
          </div>
        </div>
        <div className="guest-stay-hero-card__body">
          <p className="guest-eyebrow">{greetGuest(session.guestName, stayStatus.status === 'checked-in' ? 'Your stay' : 'Your next stay')}</p>
          <h1>{booking.property}</h1>
          <div className="guest-stay-hero-card__stats">
            <div><small>Dates</small><b>{formatStayDateRange(booking)}</b></div>
            <div><small>Room</small><b>{booking.roomNumber ? `${booking.roomType} · ${booking.roomNumber}` : `${booking.roomType} · Assigned at arrival`}</b></div>
            {/* The booking shows who is on the stay, without an extra drill-in. */}
            <div><small>Guests</small><b>{describeParty(booking, session)}</b></div>
            <div><small>Nights</small><b>{countNights(booking)}</b></div>
          </div>
        </div>
        {/* No folio row: a stay that has not started cannot have room charges. */}
        <div className="guest-stay-hero-card__actions">
          <button className="guest-list-row" onClick={() => onNavigate('rate-detail')} type="button"><span><Ticket /></span><div><b>View booking</b><small>Rate, policies and confirmation</small></div><CaretRight /></button>
        </div>
      </div>
      {booking.preArrivalCompleted < booking.preArrivalTotal ? (
        <section className="guest-home-booking guest-home-booking--primary">
          <div className="guest-home-booking__heading"><div><small>Pre-arrival</small><h2>{booking.preArrivalCompleted} of {booking.preArrivalTotal} steps complete</h2></div><strong>{Math.round((booking.preArrivalCompleted / Math.max(booking.preArrivalTotal, 1)) * 100)}%</strong></div>
          <div className="guest-home-progress" role="progressbar" aria-label="Pre-arrival progress" aria-valuemin={0} aria-valuemax={booking.preArrivalTotal} aria-valuenow={booking.preArrivalCompleted}><span style={{ width: `${Math.min(100, (booking.preArrivalCompleted / Math.max(booking.preArrivalTotal, 1)) * 100)}%` }} /></div>
          <p>{booking.nextPreArrivalStep ?? 'Review your stay details before arrival.'}</p>
          <Button className="guest-button guest-button--primary" type="button" onClick={() => onNavigate('guest-details')}>Complete pre-arrival<ArrowRight aria-hidden="true" /></Button>
        </section>
      ) : roomAssignment.state === 'ready' ? (
        roomReadyDismissed ? null : (
          <section className="guest-home-booking guest-home-booking--primary" data-testid="guest-room-ready-card">
            <div className="guest-home-booking__heading">
              <div><small>Your room</small><h2>{`Room ${booking.roomNumber ?? 'assigned'} is ready`}</h2></div>
              <Tag tone="positive">Ready now</Tag>
            </div>
            <p>Please proceed to the front desk to collect your key and check in to your room.</p>
            {booking.honouredPreferences?.length ? (
              <p className="guest-home-booking__note">Honoured: {booking.honouredPreferences.join(' · ')}</p>
            ) : null}
            <Button
              className="guest-button guest-button--primary"
              type="button"
              onClick={() => setRoomReadyDismissed(true)}
            >
              I understand<ArrowRight aria-hidden="true" />
            </Button>
          </section>
        )
      ) : (
        <section className="guest-home-booking guest-home-booking--primary">
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
        </section>
      )}
      <AnnouncementsSection />
      <section>
        <SectionHeading title="Categories" action="See all" onAction={() => onNavigate('marketplace')} />
        <div className="guest-miniapp-row" role="group" aria-label="Experience categories">
          {MINI_APP_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              className="guest-miniapp-tile"
              onClick={() => {
                onSelectCategory(cat.id);
                onNavigate(cat.screen);
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


/**
 * Property-wide broadcasts. Deliberately not notifications: these are the same
 * for every guest in the building, so they belong on the shared surface rather
 * than in a personal inbox.
 */
/**
 * Everyone on the booking, lead booker first.
 *
 * The lead's slot always exists; their *name* may not. The booking-lookup
 * entry path never asks for one, and collapsing the list with `filter(Boolean)`
 * promoted the first additional guest into the lead's row -- so a booking for
 * Ana and Marco showed Marco as "Lead booker · ID on file" and then claimed a
 * guest was missing. The slot is held open and reported as needing a name.
 *
 * `guestCount` is what the property reserved for; the rows are who has been
 * named. The two disagreeing is a real state the property has to resolve
 * before arrival, so it is stated rather than hidden.
 */
type BookingGuest = { key: string; name: string | null; role: 'lead' | 'additional' };

function listBookingGuests(booking: Booking, session: GuestSession) {
  const lead = session.guestName.trim();
  const additional = session.additionalGuests.map((name) => name.trim()).filter(Boolean);

  const rows: BookingGuest[] = [
    { key: 'lead', name: lead || null, role: 'lead' },
    ...additional.map((name, index) => ({ key: `guest-${index}`, name, role: 'additional' as const })),
  ];

  return {
    rows,
    count: Math.max(booking.guestCount, rows.length),
    /** Reserved for more people than the booking has rows for. */
    unnamed: Math.max(0, booking.guestCount - rows.length),
  };
}

const describeParty = (booking: Booking, session: GuestSession) => {
  const { count } = listBookingGuests(booking, session);
  return `${count} ${count === 1 ? 'guest' : 'guests'}`;
};

const countNights = (booking: Booking) => {
  const nights = Math.max(
    1,
    Math.round(
      (Date.parse(`${booking.checkOut}T00:00:00Z`) - Date.parse(`${booking.checkIn}T00:00:00Z`)) / 86_400_000,
    ),
  );
  return `${nights} ${nights === 1 ? 'night' : 'nights'}`;
};

function greetGuest(guestName: string, fallback: string, roomNumber?: string) {
  const first = guestName.trim().split(/\s+/).filter(Boolean)[0];
  if (!first) return fallback;
  return roomNumber ? `Welcome, ${first} · Room ${roomNumber}` : `Welcome, ${first}`;
}

function AnnouncementsSection() {
  return (
    <section>
      <SectionHeading title="From the property" />
      <div className="guest-announcements">
        {PROPERTY_ANNOUNCEMENTS.map((announcement) => (
          <div key={announcement.id} className={`guest-announcement guest-announcement--${announcement.tone}`}>
            <span aria-hidden="true"><Megaphone /></span>
            <div><b>{announcement.title}</b><p>{announcement.body}</p></div>
          </div>
        ))}
      </div>
    </section>
  );
}

const STAY_ENTRY_ICONS: Record<MiniAppCategoryId, ReactNode> = {
  dining: <ForkKnife />,
  spa: <Sparkle />,
  entertainment: <Ticket />,
  services: <Storefront />,
};

/**
 * One booking, as a card that names its parent first.
 *
 * The parent line is not decoration. A guest island-hopping through three
 * properties sees "Azotea Rooftop · 7:30 PM" and has to remember which hotel
 * that was; "The Henry Manila · Ninth floor terrace" answers it before they
 * ask.
 */
function StayEntryCard({ entry, onOpen }: { entry: StayEntry; onOpen?: () => void }) {
  /*
    One surface, four lines. This card used to be three stacked bands -- a
    tinted parent header, a body, a bordered footer -- which put twelve
    horizontal rules down a screen of four bookings and buried the two things
    a guest scans for. Title and amount now share a line, because "what is it"
    and "what did it cost" are read together; the parent is a caption above
    them, and the status sits opposite it where it does not compete.
  */
  const body = (
    <>
      <span className="guest-stay-entry__parent">
        <span aria-hidden="true">{STAY_ENTRY_ICONS[entry.category]}</span>
        <span>{entry.parent}{entry.parentDetail ? <em> · {entry.parentDetail}</em> : null}</span>
      </span>

      <span className="guest-stay-entry__headline">
        <h2>{entry.title}</h2>
        <strong>{entry.amount}</strong>
      </span>

      <span className="guest-stay-entry__when">{entry.detail}</span>

      {entry.settlement || onOpen ? (
        <span className="guest-stay-entry__meta">
          {entry.settlement ? <small>{entry.settlement}</small> : <span />}
          {onOpen ? <span className="guest-stay-entry__action">View<CaretRight /></span> : null}
        </span>
      ) : null}
    </>
  );

  if (!onOpen) return <div className="guest-stay-entry is-static" data-status={entry.status}>{body}</div>;

  return <button className="guest-stay-entry" type="button" data-status={entry.status} onClick={onOpen}>{body}</button>;
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

/**
 * A stand-in for a camera, because the prototype has no camera.
 *
 * The point is fidelity of *timing*, not of optics: a real scan is a short
 * wait that resolves itself, and a screen with only a button on it teaches
 * a stakeholder the wrong thing about how the moment feels. So the
 * viewfinder finds the code on its own after a beat, and carries a clearly
 * marked control for firing it immediately when someone is presenting and
 * wants to talk over the wait.
 */
function RoomCodeScanner({
  roomNumber,
  onDetected,
  onCancel,
  reducedMotion,
  autoDetect,
}: {
  roomNumber?: string;
  onDetected: () => void;
  onCancel: () => void;
  reducedMotion: boolean;
  autoDetect: boolean;
}) {
  /*
    Through a ref, and armed once. `onDetected` is rebuilt on every parent
    render, so depending on it directly would clear and restart the countdown
    forever and the scan would never fire. The ref is written in an effect,
    never during render -- the React Compiler rules here make the latter an
    error, and `use-debounce.ts` is the reference for the shape.
  */
  const onDetectedRef = useRef(onDetected);
  useEffect(() => {
    onDetectedRef.current = onDetected;
  }, [onDetected]);

  useEffect(() => {
    if (!autoDetect) return;
    const timer = window.setTimeout(() => onDetectedRef.current(), SCAN_DETECT_MS);
    return () => window.clearTimeout(timer);
  }, [autoDetect]);

  return (
    <div className="guest-scanner" data-testid="guest-viewfinder">
      <div className="guest-scanner__frame" aria-hidden="true">
        <span className="guest-scanner__corner guest-scanner__corner--tl" />
        <span className="guest-scanner__corner guest-scanner__corner--tr" />
        <span className="guest-scanner__corner guest-scanner__corner--bl" />
        <span className="guest-scanner__corner guest-scanner__corner--br" />
        {reducedMotion ? null : <span className="guest-scanner__sweep" />}
      </div>

      <div className="guest-scanner__copy">
        <h1>Scan the room code</h1>
        <p>
          Point your camera at the code on the desk card
          {roomNumber ? ` in room ${roomNumber}` : ''}. It confirms you are in the room.
        </p>
      </div>

      <p className="guest-scanner__status" role="status">
        {autoDetect ? 'Looking for a code…' : 'Auto-detect is off for this demo'}
      </p>

      <div className="guest-scanner__actions">
        <button className="guest-scanner__cancel" type="button" onClick={onCancel}>Cancel</button>
      </div>

      <div className="guest-desk-grant guest-scanner__rig">
        <small>Prototype — there is no real camera here</small>
        <Button className="guest-button guest-button--secondary" type="button" onClick={onDetected}>
          Simulate a successful scan
        </Button>
      </div>
    </div>
  );
}

/**
 * Home for a signed-in guest with no live booking.
 *
 * This used to be the dead end of the entry flow -- one sentence and a
 * "Connect a booking" button -- and post-auth routing sent a guest with no
 * reservation straight past it into the lookup form. Both assumed the only
 * reason to open the app was to attach a booking. A guest also opens it to
 * look at what last March cost, or because they are standing in a room and
 * have the code in front of them, so the home carries all three: history,
 * the lookup, and the scan.
 */
function EmptyStayHome({
  guestName,
  pastStays,
  onNavigate,
  onOpenStay,
}: {
  guestName: string;
  pastStays: PastStay[];
  onNavigate: (screen: ActiveScreen) => void;
  onOpenStay: (id: string) => void;
}) {
  const firstName = guestName.trim().split(' ')[0];
  // Three is the most a home can show before it stops being a summary. The
  // rest live on `stay-history`, which is still the one full list.
  const recent = pastStays.slice(0, 3);

  return (
    <div className="guest-stack" data-testid="guest-home-empty">
      <div className="guest-page-title">
        <p className="guest-eyebrow">{pastStays.length > 0 ? 'Signed in' : 'Welcome'}</p>
        {/* "Welcome back" to someone who has never stayed is a small lie the
            greeting does not need to tell. */}
        <h1>
          {!firstName
            ? 'Welcome to Cabana'
            : pastStays.length > 0
              ? `Welcome back, ${firstName}`
              : `Hello, ${firstName}`}
        </h1>
        <p>
          {pastStays.length > 0
            ? 'No stay is connected right now. Here is where you have been.'
            : 'Add your booking to open arrival details, on-property services, room charges and front-desk help in one place.'}
        </p>
      </div>

      {/*
        The main action, as a card rather than a pill. It is the one thing a
        signed-in guest with no reservation is here to do, and it sits above
        their history so it reads as the next step rather than a footnote to
        it.

        No scan here, deliberately. A guest with no booking has no room and
        therefore no code to point a camera at -- offering it was an action
        that could not succeed.
      */}
      <button className="guest-add-booking-card" type="button" onClick={() => onNavigate('identify')}>
        <span className="guest-add-booking-card__glyph" aria-hidden="true"><Ticket /></span>
        <span className="guest-add-booking-card__text">
          <b>Add a booking</b>
          <small>Enter your reference and last name to open arrival details, services and room charges.</small>
        </span>
        <ArrowRight aria-hidden="true" />
      </button>

      {recent.length > 0 ? (
        <section>
          <div className="guest-section-heading-row">
            <SectionHeading title="Previous stays" />
            {pastStays.length > recent.length ? (
              <button className="guest-text-link" type="button" onClick={() => onNavigate('stay-history')}>
                See all {pastStays.length}
              </button>
            ) : null}
          </div>
          {recent.map((stay) => (
            <HistoryItem key={stay.id} stay={stay} onOpen={() => onOpenStay(stay.id)} />
          ))}
          {pastStays.length === recent.length ? (
            <button className="guest-text-link" type="button" onClick={() => onNavigate('stay-history')}>
              See all {pastStays.length} stays
            </button>
          ) : null}
        </section>
      ) : null}

      <TextButton onClick={() => onNavigate('front-desk-assist')}>Ask the front desk for help</TextButton>
    </div>
  );
}

/** The same range, from two loose dates -- the rebooking funnel has no booking
    to read yet. */
function formatRebookDates(checkIn: string, checkOut: string) {
  if (!checkIn || !checkOut) return '';
  const formatter = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' });
  const start = formatter.format(new Date(`${checkIn}T12:00:00`));
  const end = formatter.format(new Date(`${checkOut}T12:00:00`));
  return `${start}–${end}, ${checkIn.slice(0, 4)}`;
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
  const hasChanges = facets.some((facet) => {
    const selected = draft[facet.key] ?? [];
    return facet.single
      ? selected[0] !== facet.options[0]?.value
      : selected.length > 0;
  });

  return (
    <dialog
      ref={ref}
      id="guest-filter-sheet"
      className="guest-sheet"
      aria-labelledby="guest-filter-sheet-title"
      onClose={onClose}
      onClick={(event) => { if (event.target === ref.current) ref.current?.close(); }}
    >
      <div className="guest-sheet__panel">
        <span className="guest-sheet__grip" aria-hidden="true" />
        <div className="guest-sheet__head">
          <h2 id="guest-filter-sheet-title">{title}</h2>
          <button type="button" className="guest-sheet__clear" onClick={() => setDraft(cleared)} disabled={!hasChanges}>
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
  const activeFilterCount = facets.reduce((count, facet) => {
    if (facet.single) return count + (facet.selected[0] !== facet.options[0]?.value ? 1 : 0);
    return count + facet.selected.length;
  }, 0);

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
          aria-label={`All filters${narrowed ? ` · ${activeFilterCount} active` : ''}`}
          aria-controls="guest-filter-sheet"
          aria-expanded={openKey === 'all'}
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
              aria-controls="guest-filter-sheet"
              aria-expanded={openKey === facet.key}
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
  return <div className="guest-stack guest-service-detail"><ServiceImage imageKey={vendor ? 'spa' : 'dining'} itemId={vendor ? 'spa' : 'dining'} variant="card" tone={vendor ? 'sage' : 'sand'} icon={vendor ? <Sparkle size={38} /> : <ForkKnife size={38} />} decorative /><div className="guest-page-title"><h1>{vendor ? 'Hilom signature massage' : 'In-room dining'}</h1><p>{vendor ? 'A 90-minute traditional Filipino therapeutic massage, delivered in the on-property spa.' : `Comforting Filipino favorites and all-day classics delivered to ${roomLabel}.`}</p></div><div className="guest-summary"><SummaryRow label="Price" value={vendor ? '₱2,400' : 'From ₱450'} /><SummaryRow label="Availability" value={online ? 'Today · 3 times' : 'Connect to check'} /><SummaryRow label="Property" value={booking.property} /><SummaryRow label="Room" value={booking.roomNumber ? `Room ${booking.roomNumber}` : 'Assigned at arrival'} /><SummaryRow label="Settlement" value="Charge at checkout" /><SummaryRow label="Cancellation" value={vendor ? 'Up to 24 hours before' : 'Up to 2 hours before'} /></div>{!online ? <Notice tone="offline" icon={<WifiSlash />} title="Live booking is unavailable">Capacity and price are never queued. Connect to see current times.</Notice> : null}<button className="guest-button guest-button--primary" onClick={onBook}>{online ? (vendor ? 'Choose a time' : 'View menu and order') : 'See connection options'}<ArrowRight /></button>{!online ? <TextButton onClick={onChat}>Message the front desk instead</TextButton> : null}{vendor ? <div className="guest-provisional"><b>Provisional decision</b><p>Confirm that third-party providers accept a 24-hour self-service cancellation window.</p></div> : null}</div>;
}

function FolioItem({ date, title, meta, amount }: { date: string; title: string; meta: string; amount: string }) {
  return <div className="guest-folio-item"><span>{date}</span><div><b>{title}</b><small>{meta}</small></div><strong>{amount}</strong></div>;
}

/** "March 14–17, 2026" -- one month named once when the stay does not cross one. */
function formatPastStayDates(stay: PastStay) {
  const start = new Date(`${stay.checkIn}T00:00:00Z`);
  const end = new Date(`${stay.checkOut}T00:00:00Z`);
  const month = (d: Date) => d.toLocaleDateString('en-GB', { month: 'long', timeZone: 'UTC' });
  const day = (d: Date) => d.getUTCDate();
  const year = end.getUTCFullYear();

  return month(start) === month(end)
    ? `${month(start)} ${day(start)}–${day(end)}, ${year}`
    : `${month(start)} ${day(start)} – ${month(end)} ${day(end)}, ${year}`;
}

/**
 * A finished stay, as a card that opens. It used to be inert, which made the
 * spend it represents unreachable: the guest could see they stayed somewhere
 * and nothing about what it cost or what they did there.
 */
function HistoryItem({ stay, onOpen }: { stay: PastStay; onOpen: () => void }) {
  return (
    <button className="guest-history-card" type="button" onClick={onOpen}>
      <div className="guest-history-card__media">
        <PropertyImage property={stay.property} aspectRatio="16/8" decorative />
        <Tag tone="neutral">Completed</Tag>
      </div>
      <div className="guest-history-card__body">
        <b>{stay.property}</b>
        <p>{formatPastStayDates(stay)}</p>
        <small>Room {stay.roomNumber} · {stay.nights} {stay.nights === 1 ? 'night' : 'nights'}</small>
      </div>
      <div className="guest-history-card__footer">
        <span>{stay.charges.length} {stay.charges.length === 1 ? 'charge' : 'charges'} · {stay.city}</span>
        <b>{stay.total}<CaretRight /></b>
      </div>
    </button>
  );
}

function NavButton({ label, icon, active, onClick }: { label: string; icon: ReactNode; active: boolean; onClick: () => void }) {
  return <button aria-current={active ? 'page' : undefined} onClick={onClick}><span>{icon}</span><small>{label}</small></button>;
}
