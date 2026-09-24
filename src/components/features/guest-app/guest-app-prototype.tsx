'use client';

import {
  ArrowLeft,
  ArrowRight,
  Bed,
  Bell,
  BellRinging,
  Camera,
  CalendarBlank,
  CalendarPlus,
  CaretRight,
  ChatCircleDots,
  Check,
  CheckCircle,
  Clock,
  ClockCountdown,
  Compass,
  CreditCard,
  ForkKnife,
  Gift,
  House,
  IdentificationCard,
  MapPin,
  Megaphone,
  Minus,
  Pause,
  Person,
  PersonSimpleWalk,
  Phone,
  Play,
  Plus,
  QrCode,
  Receipt,
  SignOut,
  CaretDown,
  Sparkle,
  Storefront,
  Ticket,
  ShieldCheck,
  SuitcaseRolling,
  Lock,
  Car,
  Users,
  UploadSimple,
  Wrench,
  WifiHigh,
  WifiSlash,
  X,
} from '@phosphor-icons/react';
import Image from 'next/image';
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react';
import {
  CalendarCheck01Icon as HugeCalendarCheckIcon,
  ChevronRightIcon as HugeChevronRightIcon,
  BedSingle02Icon as HugeBedSingleIcon,
  CompassIcon as HugeCompassIcon,
  Home04Icon as HugeHomeIcon,
  MessageCircleMoreIcon as HugeChatIcon,
  PlusSignIcon as HugeBookAgainIcon,
  ReceiptTextIcon as HugeReceiptTextIcon,
  Store01Icon as HugeStoreIcon,
  TrophyIcon as HugeTrophyIcon,
  UserRoundIcon as HugeProfileIcon,
} from '@hugeicons-pro/core-stroke-rounded';
import { useCallback, useEffect, useRef, useState, type FormEvent, type PointerEvent as ReactPointerEvent, type ReactNode, type TouchEvent as ReactTouchEvent } from 'react';
import { CabanaLockup, CabanaFullLockup } from '@/components/ui/cabana-logo';
import { afterSheetExit } from './sheet-exit';
import { NearbyMap } from './nearby-map';
import { CalendarPicker, ExpandableField, StepperField, TimeWheel } from './field-controls';
import { Button, Input } from '@/components/ui';
import { usePrefersReducedMotion } from '@/lib/hooks';
import {
  ANONYMOUS_SESSION,
  canUseOnPropertyServices,
  bookingFromLookup,
  connectBooking,
  describeBookingSlot,
  describeGuestGate,
  describePostStayWindow,
  POST_STAY_DESK_HOURS,
  isPreArrivalService,
  offeredIn,
  countOf,
  requestFrontDeskUnlock,
  verifyRoomPresence,
  findBookingByLookup,
  describeStayStatus,
  describeCheckoutCountdown,
  formatPesoAmount,
  getHomeVariant,
  getNotifications,
  getStayEntries,
  hasStayStarted,
  isStayUnderWay,
  getPostAuthScreen,
  emailLoginSession,
  getPrimaryBooking,
  getVenueCartSummary,
  getRoomCharges,
  getRoomChargesTotal,
  LISTING_SORTS,
  type ListingSort,
  canReportRoomReady,
  markRoomReady,
  describeRoomAssignment,
  MINI_APP_CATEGORIES,
  PROPERTY_ANNOUNCEMENTS,
  PROTOTYPE_TODAY,
  findPastStay,
  summarisePastStay,
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
  addInAppBookingCharge,
  applyRoomUpgrade,
  listingSubcategories,
  matchesListingSubcategory,
  bookableServiceDays,
  canBookService,
  cancellationCutoffHours,
  describeCancellationWindow,
  describeServicePaidBy,
  describeServicePayment,
  describeServiceProvider,
  formatServiceDay,
  getCancellationState,
  hoursUntilService,
  parseClockTime,
  SERVICE_TIMES,
  quoteStay,
  countNightsBetween,
  propertyFromRate,
  findEstateProperty,
  ESTATE_PROPERTIES,
  DEFAULT_REBOOK_CHECK_IN,
  DEFAULT_REBOOK_CHECK_OUT,
  GUEST_PROFILE,
  maskEmail,
  maskMobile,
  applyPrototypeStayState,
  getPrototypeStayState,
  PROTOTYPE_STAY_STATES,
  parsePesoAmount,
  PAST_STAYS,
  type Booking,
  type InAppBookingCharge,
  type ProfileMatch,
  type PrototypeStayState,
  type GuestNotification,
  type PropertyAnnouncement,
  type GuestSession,
  type PastStay,
  type StayEntry,
  type StayReview,
  type NotificationTone,
  type DiningFulfillment,
  type MiniAppCategoryId,
  type ServiceBooking,
  type RestaurantVenue,
  type ScreenId,
  type AuthMethod,
} from './prototype-model';
import {
  CATEGORY_IMAGES,
  PROPERTY_IMAGES,
  getServiceImage,
  getPropertyImage,
  getServiceImageKey,
  getItemThumbnail,
  getItemCardImage,
  type ServiceImageDefinition,
  type ServiceImageKey,
} from './service-images';
import {
  DiscoverFeed,
  RoomScanner,
  RoomUnlocked,
  StoryViewer,
  SwipeDeck,
  SwipeStoryViewer,
  buildCategoryCards,
  buildFeaturedDeck,
  buildSearchIndex,
  buildStories,
} from './promoted';
import type { Story } from './promoted';
import { storyImage } from './promoted/story-imagery';
import { ChatComposer, type ChatAttachment } from './chat-composer';
import { StayConfirm } from './stay-invitation';
import {
  BadgeDetail,
  BadgeShelf,
  EstateMap,
  PointsApply,
  PointsEarned,
  PointsWallet,
  REWARD_MENU,
  RewardDetail,
  RewardMenu,
  affordableRewards,
  BEHAVIOUR_POINTS,
  badgeProgress,
  buildPointsLedger,
  directCounterfactual,
  earnedForStay,
  earnedBadges,
  muteBadge,
  nearlyEarnedBadges,
  pointsAsPesos,
  pointsBalance,
  pointsExpiry,
  pesosOff,
  redeemReward,
  spendPoints,
} from './rewards';
import { clearStoredSession, readStoredSession, writeStoredSession } from './session-storage';
import './guest-app-prototype.css';
import './promoted/promoted.css';
import './rewards/rewards.css';

type ActiveScreen = ScreenId | 'entry-hub';

const isChatScreen = (screen: ActiveScreen) => screen === 'chat' || screen === 'chat-after-hours';

type ChatMessage = {
  from: 'guest' | 'desk';
  body: string;
  state?: string;
  images?: string[];
  attachment?: ChatAttachment;
};

type ChatQuickAction = {
  label: string;
  description: string;
  message: (room: string) => string;
};

const CHAT_QUICK_ACTIONS: ChatQuickAction[] = [
  { label: 'Towels', description: 'Request fresh towels', message: () => 'Could we get two fresh towels, please?' },
  { label: 'Housekeeping', description: 'Ask for room cleaning', message: (room) => `Please arrange housekeeping for ${room.toLowerCase()}.` },
  { label: 'Late checkout', description: 'Ask for more time', message: () => 'Can we request a late checkout?' },
  { label: 'Room issue', description: 'Tell us what needs fixing', message: (room) => `There’s an issue in ${room.toLowerCase()}. Could someone help?` },
  { label: 'Transfers', description: 'Arrange transportation', message: () => 'We need help arranging a transfer.' },
];

const formatChatDuration = (seconds: number) => {
  const minutes = Math.floor(seconds / 60).toString().padStart(2, '0');
  const remainder = (seconds % 60).toString().padStart(2, '0');
  return `${minutes}:${remainder}`;
};

/**
 * Which screens light which tab. Explore owns the arrival roster before the
 * room scan and the full on-property catalogue after it, plus every screen
 * reached by booking from either. My Stay owns reservations, the running bill,
 * and the front desk.
 */
const EXPLORE_SCREENS: ActiveScreen[] = [
  'pre-arrival-services',
  'transfer-booking',
  'transfer-confirmation',
  'marketplace',
  'category-listing',
  'nearby-recommendations',
  'nearby-establishment',
  'gifts-souvenirs',
  'gift-order-cart',
  'gift-order-confirmation',
  'room-upgrades',
  'room-upgrade-confirmation',
  'room-upgrade-success',
  'room-transfer-details',
  'extend-stay',
  'extend-stay-review',
  'extend-stay-success',
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

const EXPLORE_STORIES = buildStories();
const EXPLORE_CATEGORIES = buildCategoryCards();
const EXPLORE_SEARCH_INDEX = buildSearchIndex();
const EXPLORE_DECK = buildFeaturedDeck();

type HomeStoryCategoryId = MiniAppCategoryId | 'gifts-souvenirs';

const HOME_GIFT_STORY_IMAGE: ServiceImageDefinition = {
  src: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=1200&q=80',
  alt: 'Wrapped gift box with a ribbon',
  focalPoint: 'center',
};

const createHomeStory = ({
  categoryId,
  title,
  subtitle,
  price,
  cta,
  frames,
  headlines,
  details,
  postedHoursAgo,
}: {
  categoryId: HomeStoryCategoryId;
  title: string;
  subtitle: string;
  price: string;
  cta: string;
  frames: ServiceImageDefinition[];
  headlines: string[];
  details: string[];
  postedHoursAgo: number;
}): Story => ({
  id: `home-${categoryId}`,
  title,
  subtitle,
  price,
  cta,
  cover: frames[0]!,
  slides: frames.map((image, index) => ({
    headline: headlines[index] ?? title.toUpperCase(),
    detail: details[index],
    image,
  })),
  author: {
    name: 'The Henry',
    kind: 'property',
    image: getPropertyImage('The Henry Manila'),
  },
  postedHoursAgo,
  livesForHours: 24,
});

const HOME_CATEGORY_STORIES: Record<HomeStoryCategoryId, Story> = {
  dining: createHomeStory({
    categoryId: 'dining',
    title: 'Food & Drinks',
    subtitle: 'The Henry Manila',
    price: 'From ₱180',
    cta: 'Explore Food & Drinks',
    frames: [
      storyImage('apartment-1b'),
      storyImage('poolside-bar'),
      storyImage('cafe'),
    ],
    headlines: ['MAKE A TABLE OF IT', 'DINNER, THEN ONE MORE', 'SLOW MORNINGS START HERE'],
    details: ['Filipino favorites, easy lunches, and late-night bites.', 'Stay for sunset drinks at the poolside bar.', 'Coffee, pastries, and a softer start to the day.'],
    postedHoursAgo: 1,
  }),
  spa: createHomeStory({
    categoryId: 'spa',
    title: 'Spa & Wellness',
    subtitle: 'Hilom Spa & Wellness',
    price: 'From ₱900',
    cta: 'Explore Spa & Wellness',
    frames: [
      storyImage('spa'),
      storyImage('scrub'),
      storyImage('couples-massage'),
    ],
    headlines: ['RESET YOUR PACE', 'A LITTLE TIME TO YOURSELF', 'MAKE IT A SHARED RITUAL'],
    details: ['Signature massages and quiet treatments, just steps from your room.', 'Body rituals that make an afternoon feel longer.', 'A slower way to spend the stay together.'],
    postedHoursAgo: 2,
  }),
  entertainment: createHomeStory({
    categoryId: 'entertainment',
    title: 'Activities & Tours',
    subtitle: 'Curated by The Henry',
    price: 'From ₱850',
    cta: 'Explore Activities & Tours',
    frames: [
      storyImage('tour'),
      storyImage('sunset-cruise'),
      storyImage('heritage-walk'),
    ],
    headlines: ['MAKE A DAY OF IT', 'MEET THE SUNSET OUTSIDE', 'SEE THE CITY DIFFERENTLY'],
    details: ['Island days, local guides, and easy ways to get out and explore.', 'The golden-hour plan is already waiting.', 'Stories, streets, and the places worth taking your time with.'],
    postedHoursAgo: 3,
  }),
  services: createHomeStory({
    categoryId: 'services',
    title: 'Hotel Services',
    subtitle: 'The Henry Manila',
    price: 'From ₱250',
    cta: 'Explore Hotel Services',
    frames: [
      storyImage('pool'),
      storyImage('business-centre'),
      storyImage('gym'),
    ],
    headlines: ['MAKE THE STAY EASIER', 'GET OUT, YOUR WAY', 'ONE LESS THING TO THINK ABOUT'],
    details: ['Transfers, rentals, and the practical help that keeps plans moving.', 'Bikes and scooters for a little more freedom.', 'Fresh clothes and small conveniences, handled.'],
    postedHoursAgo: 4,
  }),
  'gifts-souvenirs': createHomeStory({
    categoryId: 'gifts-souvenirs',
    title: 'Gifts & Souvenirs',
    subtitle: 'The Henry Manila',
    price: 'From ₱350',
    cta: 'Explore Gifts & Souvenirs',
    frames: [
      HOME_GIFT_STORY_IMAGE,
      storyImage('dining'),
      HOME_GIFT_STORY_IMAGE,
    ],
    headlines: ['TAKE A LITTLE HOME', 'A THOUGHTFUL EXTRA', 'KEEP THE STAY CLOSE'],
    details: ['Local treats and small keepsakes for the people you came to see.', 'Add a little celebration before you check out.', 'A gift is one more way to remember the place.'],
    postedHoursAgo: 5,
  }),
};

const HOME_STORY_CATEGORIES: ReadonlyArray<{ id: HomeStoryCategoryId; label: string }> = [
  { id: 'dining', label: 'Food & Drinks' },
  { id: 'spa', label: 'Spa & Wellness' },
  { id: 'entertainment', label: 'Activities & Tours' },
  { id: 'services', label: 'Hotel Services' },
  { id: 'gifts-souvenirs', label: 'Gifts & Souvenirs' },
];

/** One glyph per arrival service, so the column reads as four things. */
/** One line under each arrival card, in the guest's terms. */
const ARRIVAL_BLURBS: Record<string, string> = {
  transfer: 'Met at arrivals and driven to the door.',
  'private-car': 'A car and driver for the day, on your schedule.',
  luggage: 'Bags held, or sent ahead to your room.',
  celebration: 'Flowers, cake or a room set for the occasion.',
  'early-check-in': 'Your room from the morning, if it is ready.',
};

const ARRIVAL_GLYPHS: Record<string, ReactNode> = {
  transfer: <Car />,
  'private-car': <Person />,
  luggage: <SuitcaseRolling />,
  celebration: <Sparkle />,
};

/*
  `scanned-early` is not a booking failure but a scan one: the right code before
  the stay has started. It shares the screen because the answer is the same
  place -- arrival services now, the room on arrival day.
*/
type BlockedReason = 'offline' | 'not-arrived' | 'not-verified' | 'unlock-pending' | 'checked-out' | 'scanned-early';

const MY_STAY_SCREENS: ActiveScreen[] = [
  'my-stay',
  'stay-review',
  'stay-review-sent',
  'folio',
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
  autoComplete?: string;
  spellCheck?: boolean;
  defaultValue?: string;
  helper?: string;
  required?: boolean;
  /** Controlled value. Pass with `onValueChange` where the value is read back. */
  value?: string;
  onValueChange?: (next: string) => void;
  min?: string;
};

function Field({ label, name, type = 'text', placeholder, autoComplete, spellCheck, defaultValue, helper, required, value, onValueChange, min }: FieldProps) {
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
        autoComplete={autoComplete}
        spellCheck={spellCheck}
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
 *
 * Each step is full bleed: a Henry photograph, and over it a short film of
 * the estate where one is good enough to lead with. The photograph is the
 * still -- what shows under reduced motion, before the film can play, or when
 * autoplay is refused -- and a step with no film is just the still, drifting.
 */
/**
 * The property photographs are landscape, cropped here to fill a portrait
 * screen, so the frame needs far more source width than the column is wide.
 */
const fullBleed = (image: ServiceImageDefinition, focalPoint: string): ServiceImageDefinition => ({
  ...image,
  src: image.src.replace(/([?&])w=\d+/, '$1w=2400'),
  focalPoint,
});

const WELCOME_STEPS: { step: string; stage: string; title: string; photo: ServiceImageDefinition; film?: string }[] = [
  {
    step: '01',
    stage: 'Before you arrive',
    title: 'Check in before arrival',
    // The infinity pool at dusk is the first frame a guest sees; no clip
    // on hand opens as well as it does.
    photo: fullBleed(PROPERTY_IMAGES.cebu, '66% 50%'),
  },
  {
    step: '02',
    stage: 'At the hotel',
    title: 'Skip the front desk paperwork',
    photo: fullBleed(PROPERTY_IMAGES.manila, '58% 50%'),
    film: '/experiments/clip-food-crawl.mp4',
  },
  {
    step: '03',
    stage: 'During your stay',
    title: 'View charges and hotel services',
    photo: fullBleed(PROPERTY_IMAGES.dumaguete, '50% 50%'),
    film: '/experiments/clip-spa.mp4',
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
    engaged: engaged || reducedMotion,
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

function playFilm(video: HTMLVideoElement) {
  try {
    void Promise.resolve(video.play()).catch(() => {});
  } catch {
    // Autoplay refused or unsupported: the photograph underneath stays.
  }
}

/**
 * Decorative: every step's meaning is carried by its copy further down.
 *
 * The frames cross-fade in place rather than slide -- a film sliding sideways
 * reads as a carousel, a dissolve as a title sequence. Only the current film
 * plays, from its first frame, and all three preload behind the splash so a
 * step change never waits on the network.
 */
function WelcomeArt({ index, paused }: Pick<PagerHandle, 'index'> & { paused: boolean }) {
  const reducedMotion = usePrefersReducedMotion();
  const films = useRef<(HTMLVideoElement | null)[]>([]);

  useEffect(() => {
    const sync = () => {
      films.current.forEach((video, position) => {
        if (!video) return;
        if (position === index && !paused && !document.hidden) playFilm(video);
        else video.pause();
      });
    };
    sync();
    document.addEventListener('visibilitychange', sync);
    return () => document.removeEventListener('visibilitychange', sync);
  }, [index, paused, reducedMotion]);

  // A step arriving starts its film from the top, not wherever it was left.
  useEffect(() => {
    const video = films.current[index];
    if (video && video.readyState > 0) video.currentTime = 0;
  }, [index]);

  return (
    <div className="guest-welcome__art" aria-hidden="true">
      <div className="guest-welcome__art-track">
        {WELCOME_STEPS.map((item, position) => (
          <span key={item.step} className={`guest-welcome__art-frame${position === index ? ' is-active' : ''}`}>
            <Image
              className="guest-welcome__still"
              src={item.photo.src}
              alt=""
              fill
              // Cover-cropped from landscape: about three columns of width.
              sizes="(max-width: 480px) 330vw, 1600px"
              style={{ objectPosition: item.photo.focalPoint }}
              {...(position === 0 ? { priority: true } : { loading: 'eager' as const })}
            />
            {reducedMotion || !item.film ? null : (
              <video
                ref={(node) => { films.current[position] = node; }}
                className="guest-welcome__film"
                src={item.film}
                muted
                loop
                playsInline
                preload="auto"
                onPlaying={(event) => { event.currentTarget.dataset.playing = 'true'; }}
                onError={(event) => { event.currentTarget.hidden = true; }}
              />
            )}
          </span>
        ))}
      </div>
      {/* Legibility, bottom up: a tint, a scrim, a progressive blur, and grain
          so the flat gradients do not band. */}
      <span className="guest-welcome__scrim" />
      <span className="guest-welcome__blur" />
      <span className="guest-welcome__grain" />
    </div>
  );
}

/**
 * Segments rather than dots: while the pager rotates on its own, the current
 * one fills over its dwell, so the guest can see when the next step is due.
 * Once they take over, the current segment simply sits full.
 */
function WelcomeDots({ index, show, engaged }: Pick<PagerHandle, 'index' | 'show' | 'engaged'>) {
  return (
    <div className={`guest-welcome__dots${engaged ? ' is-engaged' : ''}`}>
      {WELCOME_STEPS.map((item, position) => (
        <button
          key={item.step}
          type="button"
          aria-label={`Step ${item.step}: ${item.title}`}
          aria-current={position === index ? 'step' : undefined}
          className={position < index ? 'is-done' : undefined}
          onClick={() => show(position)}
        >
          <span aria-hidden="true">
            <i
              // Keyed on the index so the fill restarts every time a step comes round.
              key={position === index ? `fill-${index}` : 'idle'}
              style={{ animationDuration: `${index === 0 ? FIRST_STEP_DWELL_MS : STEP_DWELL_MS}ms` }}
            />
          </span>
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

function WelcomeScreen({
  online,
  onSso,
  onEmailLogin,
  onGuestLogin,
}: {
  online: boolean;
  onSso: (method: AuthMethod) => void;
  onEmailLogin: () => void;
  onGuestLogin: () => void;
}) {
  const pager = useWelcomePager();
  const reducedMotion = usePrefersReducedMotion();
  const [filmPaused, setFilmPaused] = useState(false);

  return (
    <section className="guest-welcome" aria-labelledby="guest-welcome-title">
      <div className="guest-welcome__splash" aria-hidden="true">
        <CabanaFullLockup className="guest-welcome__splash-brand" markWidth={92} />
      </div>
      <WelcomeArt index={pager.index} paused={filmPaused} />
      <div className="guest-welcome__content" onFocus={pager.engage}>
        {/* Moving backgrounds need a way to stop them (WCAG 2.2.2). */}
        {reducedMotion || !WELCOME_STEPS[pager.index]?.film ? null : (
          <button
            type="button"
            className="guest-welcome__film-toggle"
            aria-label={filmPaused ? 'Play background video' : 'Pause background video'}
            aria-pressed={filmPaused}
            onClick={() => setFilmPaused((current) => !current)}
          >
            {filmPaused ? <Play weight="fill" aria-hidden="true" /> : <Pause weight="fill" aria-hidden="true" />}
          </button>
        )}
        <CabanaFullLockup className="guest-welcome__brand" markWidth={44} />
        {/*
          The rotating step copy took this slot, so the heading goes to screen
          readers only. It stays in the tree because the screen still needs one
          stable accessible name -- a heading that changed every 4.5s would not
          be one.
        */}
        <h1 id="guest-welcome-title" className="sr-only">Welcome to your stay</h1>
        {/* The open middle of the screen is where a thumb pages the steps;
            the film behind it is out of reach under the content layer. */}
        <div className="guest-welcome__swipe" {...pager.swipe} />
        <div className="guest-welcome__message">
          <WelcomeStepCopy index={pager.index} />
          <WelcomeDots index={pager.index} show={pager.show} engaged={pager.engaged} />
          {!online ? <Notice tone="offline" icon={<WifiSlash />} title="Log in needs a connection">Reconnect to continue.</Notice> : null}
          <div className="guest-welcome__actions" role="group" aria-label="Log in options">
            <Button
              className="guest-button guest-button--secondary guest-welcome__login-button guest-welcome__login-button--solid"
              type="button"
              disabled={!online}
              onClick={() => onSso('apple')}
            >
              <Image
                src="/brand/apple.svg"
                width={20}
                height={20}
                alt=""
                aria-hidden="true"
                className="guest-welcome__login-logo"
              />
              Continue with Apple
            </Button>
            <Button
              className="guest-button guest-button--secondary guest-welcome__login-button guest-welcome__login-button--glass"
              type="button"
              disabled={!online}
              onClick={() => onSso('google')}
            >
              <Image
                src="/brand/google-g.png"
                width={200}
                height={204}
                alt=""
                aria-hidden="true"
                className="guest-welcome__login-logo guest-welcome__login-logo--google"
              />
              Continue with Google
            </Button>
            <Button
              className="guest-button guest-button--secondary guest-welcome__login-button guest-welcome__login-button--glass"
              type="button"
              disabled={!online}
              onClick={onEmailLogin}
            >
              Log in with email<ArrowRight aria-hidden="true" />
            </Button>
            <Button
              className="guest-welcome__guest-link"
              variant="ghost"
              type="button"
              disabled={!online}
              onClick={onGuestLogin}
            >
              Log in as guest<ArrowRight aria-hidden="true" />
            </Button>
          </div>
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

type Companion = {
  name: string;
  nationality?: string;
  email?: string;
  mobile?: string;
  documentNumber?: string;
  expiry?: string;
};

type PassportFields = {
  documentNumber: string;
  expiry: string;
};

const DEMO_PASSPORT_FIELDS: PassportFields = {
  documentNumber: 'P1234567A',
  expiry: '2030-05-20',
};

function PassportCapturePanel({
  subjectName,
  onAutofill,
}: {
  subjectName: string;
  onAutofill: (fields: PassportFields) => void;
}) {
  const [step, setStep] = useState<'idle' | 'preview' | 'reading' | 'complete'>('idle');
  const [source, setSource] = useState<'photo' | 'upload' | null>(null);

  useEffect(() => {
    if (step !== 'reading') return;

    const timeout = window.setTimeout(() => {
      onAutofill(DEMO_PASSPORT_FIELDS);
      setStep('complete');
    }, 700);

    return () => window.clearTimeout(timeout);
  }, [onAutofill, step]);

  const openDemoPreview = (nextSource: 'photo' | 'upload') => {
    setSource(nextSource);
    setStep('preview');
  };

  return (
    <section className="guest-passport-capture" aria-label={`Passport photo simulation for ${subjectName}`}>
      <div className="guest-passport-capture__choices" role="group" aria-label="Passport photo options">
        <button
          className={`guest-passport-capture__choice${source === 'photo' ? ' is-selected' : ''}`}
          type="button"
          aria-pressed={source === 'photo'}
          onClick={() => openDemoPreview('photo')}
        >
          <Camera size={21} aria-hidden="true" />
          <b>Take a photo</b>
          <small>Simulated capture</small>
        </button>
        <button
          className={`guest-passport-capture__choice${source === 'upload' ? ' is-selected' : ''}`}
          type="button"
          aria-pressed={source === 'upload'}
          onClick={() => openDemoPreview('upload')}
        >
          <UploadSimple size={21} aria-hidden="true" />
          <b>Upload a photo</b>
          <small>Use a sample image</small>
        </button>
      </div>

      {step !== 'idle' ? (
        <div className="guest-passport-capture__preview">
          <div className="guest-passport-capture__preview-heading">
            <b>Demo passport preview</b>
            <span>Sample only</span>
          </div>
          <div className="guest-passport-capture__document" aria-label={`Sample passport preview for ${subjectName}`}>
            <div className="guest-passport-capture__portrait" aria-hidden="true">
              <IdentificationCard size={24} />
            </div>
            <div className="guest-passport-capture__document-details">
              <small>PASSPORT · DEMO</small>
              <b>{subjectName || 'Guest'}</b>
              <span>Passport photo · simulated</span>
            </div>
          </div>
          <p className="guest-passport-capture__note">
            {source === 'photo' ? 'Photo capture simulated.' : 'Sample photo selected.'} No real image is used.
          </p>
          {step === 'preview' ? (
            <button className="guest-passport-capture__read" type="button" onClick={() => setStep('reading')}>
              Read passport details<ArrowRight aria-hidden="true" />
            </button>
          ) : null}
          {step === 'reading' ? (
            <p className="guest-passport-capture__status" role="status" aria-live="polite" aria-atomic="true">
              Reading passport details…
            </p>
          ) : null}
          {step === 'complete' ? (
            <p className="guest-passport-capture__status is-complete" role="status" aria-live="polite" aria-atomic="true">
              Demo OCR complete. The document number and expiry date were filled below.
            </p>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

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
  const handlePassportAutofill = useCallback((fields: PassportFields) => {
    setDraft((current) => ({ ...current, ...fields }));
  }, []);

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
          <PassportCapturePanel subjectName={draft.name} onAutofill={handlePassportAutofill} />
          <Field
            label="Document number"
            name="companion-document"
            placeholder="Enter document number"
            value={draft.documentNumber ?? ''}
            onValueChange={(documentNumber) => setDraft((current) => ({ ...current, documentNumber }))}
          />
          <Field
            label="Expiry date"
            name="companion-expiry"
            type="date"
            value={draft.expiry ?? ''}
            onValueChange={(expiry) => setDraft((current) => ({ ...current, expiry }))}
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

function ChatMenuGallery({ images, onOpen }: { images: string[]; onOpen: (image: string, trigger: HTMLButtonElement) => void }) {
  return (
    <div className="guest-chat-menu-gallery" aria-label={`${images.length} menu images`}>
      {images.map((image, index) => (
        <button key={image} type="button" onClick={(event) => onOpen(image, event.currentTarget)} aria-label={`Open menu image ${index + 1}`}>
          <Image src={image} alt={`Current menu image ${index + 1}`} width={180} height={240} />
        </button>
      ))}
    </div>
  );
}

export function GuestAppPrototype({ initialSession, initialScreen, initialOnline }: GuestAppPrototypeProps = {}) {
  const [activeScreen, setActiveScreen] = useState<ActiveScreen>(initialScreen ?? 'entry-hub');
  const activeScreenRef = useRef(activeScreen);
  const [session, setSession] = useState<GuestSession>(() => initialSession ?? ANONYMOUS_SESSION);
  /* The selected badge is rendered by the full-page achievement detail route. */
  const [openBadgeId, setOpenBadgeId] = useState<string | null>(null);
  /* Which reward the detail screen is showing. */
  const [selectedRewardId, setSelectedRewardId] = useState<string | null>(null);
  /* Points staged against the booking in progress, in ₱100 blocks. */
  const [appliedPoints, setAppliedPoints] = useState(0);
  /*
    The service the booking form is for, and the slot being picked. Defaults to
    the Hilom massage, the one thing the form sold before every listing could
    book itself.
  */
  const [selectedServiceId, setSelectedServiceId] = useState('spa');
  const [serviceDate, setServiceDate] = useState<string | null>(null);
  const [serviceTime, setServiceTime] = useState<string>('1:30 PM');
  /** Which booking field is open; one at a time, as Places does it. */
  const [openServiceField, setOpenServiceField] = useState<'date' | 'time' | null>(null);
  const [servicePartySize, setServicePartySize] = useState(1);
  /* The booking the confirmation screen is about. */
  const [lastServiceBookingId, setLastServiceBookingId] = useState<string | null>(null);
  /* Badges the last confirmed booking tipped over, for the confirmation. */
  const [justEarned, setJustEarned] = useState<string[]>([]);
  const [history, setHistory] = useState<ActiveScreen[]>([]);
  const [online, setOnline] = useState(initialOnline ?? true);
  const [pendingEmail, setPendingEmail] = useState('');
  const [code, setCode] = useState('');
  const [codeNotice, setCodeNotice] = useState<string | null>(null);
  const [primaryPassportFields, setPrimaryPassportFields] = useState<PassportFields>({ documentNumber: '', expiry: '' });
  const codeInputRef = useRef<HTMLInputElement | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatOrderVenue, setChatOrderVenue] = useState<string | null>(null);
  const [hasUnreadChat, setHasUnreadChat] = useState(false);
  const [chatDraft, setChatDraft] = useState('');
  const [chatPreviewImage, setChatPreviewImage] = useState<string | null>(null);
  const chatPreviewCloseRef = useRef<HTMLButtonElement | null>(null);
  const chatPreviewTriggerRef = useRef<HTMLButtonElement | null>(null);
  const [sending, setSending] = useState(false);
  const chatObjectUrlsRef = useRef(new Set<string>());
  const [selectedCategory, setSelectedCategory] = useState<MiniAppCategoryId>('dining');
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<string>('apartment-1b');
  const [selectedNearbyEstablishmentId, setSelectedNearbyEstablishmentId] = useState<string | null>(null);
  const [selectedUpgradeId, setSelectedUpgradeId] = useState<string | null>(null);
  const [extensionDate, setExtensionDate] = useState('2026-11-14');
  const [exploreSubcategory, setExploreSubcategory] = useState('All');
  const [restaurantCarts, setRestaurantCarts] = useState<Record<string, Record<string, number>>>({});
  const [orderTrayOpen, setOrderTrayOpen] = useState<'restaurant' | 'gifts' | null>(null);
  const [, setOrderTrayStep] = useState<'tray' | 'review'>('tray');
  const [diningMethod, setDiningMethod] = useState<'delivery' | 'pickup'>('delivery');
  const [diningTiming, setDiningTiming] = useState<'asap' | 'scheduled'>('asap');
  const [diningTime, setDiningTime] = useState('7:00 PM');
  const [diningOrderError, setDiningOrderError] = useState<string | null>(null);
  const [bookingBlockedReason, setBookingBlockedReason] = useState<BlockedReason>('offline');
  const [roomReadyNotificationBookingId, setRoomReadyNotificationBookingId] = useState<string | null>(null);
  const [roomReadyNotificationFocused, setRoomReadyNotificationFocused] = useState(false);
  const [scanSuccessToast, setScanSuccessToast] = useState(false);
  const [openExploreStoryId, setOpenExploreStoryId] = useState<string | null>(null);
  const [openHomeStoryId, setOpenHomeStoryId] = useState<HomeStoryCategoryId | null>(null);
  const [exploreIntroPlaying, setExploreIntroPlaying] = useState(false);
  const [simulatePostStayExpired, setSimulatePostStayExpired] = useState(false);
  /*
    Two sets, because "the bell has stopped nagging me" and "I have read this
    one" are different facts. Opening the inbox marks everything seen, which is
    what clears the dot on the bell; a row keeps its own dot until it is
    actually opened.
  */
  const [stayTab, setStayTab] = useState<'upcoming' | 'past'>('upcoming');
  const [expandedChargeId, setExpandedChargeId] = useState<string | null>(null);
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
  /* Both ends of a requested ride. Empty until a door opens the form with a trip in mind. */
  const [transferOrigin, setTransferOrigin] = useState('');
  const [transferDestination, setTransferDestination] = useState('');
  const [transferDestinationAddress, setTransferDestinationAddress] = useState('');
  const [rideWhen, setRideWhen] = useState<'now' | 'later'>('now');
  const [rideDate, setRideDate] = useState('');
  const [rideTime, setRideTime] = useState('10:00');
  /** The open field on the stay and ride forms; one at a time. */
  const [openFormField, setOpenFormField] = useState<'check-in' | 'check-out' | 'ride-date' | 'ride-time' | null>(null);
  const [ridePassengers, setRidePassengers] = useState(2);
  const [giftFulfillment, setGiftFulfillment] = useState<'room' | 'lobby'>('room');
  const [giftCart, setGiftCart] = useState<Record<string, number>>({});
  const [giftOrder, setGiftOrder] = useState<{ items: typeof GIFT_PRODUCTS[number][]; total: number; paymentStatus: 'charged-to-room' | 'paid'; paymentMethod: 'room' | 'card' | 'gcash' | 'maya' } | null>(null);
  const [checkoutPayment, setCheckoutPayment] = useState<'room' | 'pay-now' | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'gcash' | 'maya' | null>(null);
  /* Read by the retired `transfer-confirmation` screen only; rides are requested in Chat now. */
  const [transferBooking] = useState<{
    destination: string;
    pickupLocation: string;
    arrivalDate: string;
    arrivalTime: string;
    flightNumber: string;
    passengers: string;
    luggage: string;
    vehicle: string;
    specialRequests: string;
    paymentMethod: 'room' | 'card' | 'gcash' | 'maya';
    paymentStatus: 'charged-to-room' | 'paid';
  } | null>(null);
  /** The reservation the lookup produced, held between the form and the
      confirmation so both show the guest's own reference rather than a
      fixture's. */
  const [lookupBooking, setLookupBooking] = useState<Booking | null>(null);

  /** Prototype only: put strict reference matching back, to demo not-found. */
  const [strictLookup, setStrictLookup] = useState(false);
  const [profileMatch, setProfileMatch] = useState<ProfileMatch | null>(null);
  const [seenNotificationIds, setSeenNotificationIds] = useState<string[]>([]);
  const [readNotificationIds, setReadNotificationIds] = useState<string[]>([]);

  const openChatImagePreview = useCallback((image: string, trigger: HTMLButtonElement) => {
    chatPreviewTriggerRef.current = trigger;
    setChatPreviewImage(image);
  }, []);

  const closeChatImagePreview = useCallback(() => {
    const trigger = chatPreviewTriggerRef.current;
    setChatPreviewImage(null);
    trigger?.focus();
    chatPreviewTriggerRef.current = null;
  }, []);

  useEffect(() => () => {
    chatObjectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    chatObjectUrlsRef.current.clear();
  }, []);

  useEffect(() => {
    if (!chatPreviewImage) return undefined;

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      closeChatImagePreview();
    };

    window.addEventListener('keydown', closeOnEscape);
    chatPreviewCloseRef.current?.focus();
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [chatPreviewImage, closeChatImagePreview]);

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

  useEffect(() => {
    if (!scanSuccessToast) return;

    const timeout = window.setTimeout(() => setScanSuccessToast(false), 4_000);
    return () => window.clearTimeout(timeout);
  }, [scanSuccessToast]);

  useEffect(() => {
    activeScreenRef.current = activeScreen;
  }, [activeScreen]);

  const go = (next: ActiveScreen) => {
    if (['restaurant-cart', 'gift-order-cart', 'service-booking', 'transfer-booking'].includes(next)) {
      setCheckoutPayment(null);
      setPaymentMethod(null);
    }
    if (isChatScreen(next)) setHasUnreadChat(false);
    setHistory((items) => [...items, activeScreen]);
    setActiveScreen(next);
    setScrolled(false);
    window.scrollTo?.({ top: 0, behavior: 'smooth' });
  };

  /** `go` without leaving the current screen in history, for steps Back should skip. */
  const replaceScreen = (next: ActiveScreen) => {
    if (isChatScreen(next)) setHasUnreadChat(false);
    setActiveScreen(next);
    setScrolled(false);
    window.scrollTo?.({ top: 0, behavior: 'smooth' });
  };

  const goToCheckout = (next: ActiveScreen) => {
    setCheckoutPayment(null);
    setPaymentMethod(null);
    go(next);
  };

  const back = () => {
    setScrolled(false);
    setHistory((items) => {
      const next = [...items];
      const nextScreen = next.pop() ?? 'entry-hub';
      if (isChatScreen(nextScreen)) setHasUnreadChat(false);
      setActiveScreen(nextScreen);
      return next;
    });
  };

  const sendChatMessage = (body: string, attachment?: ChatAttachment) => {
    const messageBody = body.trim() || (attachment?.kind === 'image' ? 'Image attached.' : 'Voice message attached.');
    setChatDraft('');
    const state = online ? 'Sent' : 'Will send when connected';
    if (attachment?.url.startsWith('blob:')) chatObjectUrlsRef.current.add(attachment.url);
    setChatMessages((messages) => [...messages, { from: 'guest', body: messageBody, state, attachment }]);
    if (!online) return;
    setSending(true);
    window.setTimeout(() => {
      const catalogRequest = /see the menu and order|see the available products|see the available options/i.test(messageBody);
      const establishment = messageBody.match(/from (.+?)\.$/i)?.[1] ?? 'the establishment';
      const catalogImages = catalogRequest
        ? messageBody.includes('products')
          ? GIFT_PRODUCTS.slice(0, 2).map((product) => product.image)
          : undefined
        : undefined;
      const deskReply = messageBody.includes('towel')
        ? `We’ll bring two fresh towels to ${contextRoom.toLowerCase()} shortly.`
        : catalogRequest
          ? `Here is the current ${establishment} ${messageBody.includes('products') ? 'product catalog' : 'menu'} and ordering information. Please send the item names and quantities you would like to order.`
          : 'Thanks. The front desk has received your request.';
      setChatMessages((messages) => [...messages, { from: 'desk', body: deskReply, state: 'Seen', images: catalogImages }]);
      if (!isChatScreen(activeScreenRef.current)) setHasUnreadChat(true);
      setSending(false);
    }, 850);
  };

  const sendQuickMessage = (body: string) => sendChatMessage(body);

  /* Ordering opens the chat already knowing which venue it is about. */
  const openRestaurantChat = (venue: RestaurantVenue) => {
    const guestMessage = `I’d like to order from ${venue.name}.`;
    const genericWelcome = 'Good afternoon, Ana. How can we help with your stay?';
    setChatOrderVenue(venue.name);
    setChatDraft('');
    setChatMessages((messages) => [
      ...(messages.length === 1 && messages[0].body === genericWelcome ? [] : messages),
      { from: 'guest', body: guestMessage, state: 'Sent' },
    ]);
    setSending(true);
    go('chat');
    window.setTimeout(() => {
      const menuImages = getRestaurantMenuImages(venue);
      setChatMessages((messages) => [
        ...messages,
        { from: 'desk', body: 'Of course. What would you like to order?', state: 'Seen', images: menuImages },
        { from: 'desk', body: 'Send the item names, quantities, and any special requests.', state: 'Seen' },
      ]);
      setSending(false);
    }, 850);
  };

  /*
    Both ends of the ride on the form, read once for the form and the message.
    A form opened with no trip in mind -- directly, or from an old link -- still
    has two real ends: a pick-up while the stay is ahead, a run to the airport
    once it has begun. It used to start every ride at the hotel and end it at
    "Selected destination", so an arriving guest was offered a car from the
    hotel to nowhere, and the desk was sent those words.
  */
  const rideEnds = () => {
    const pickUp = !hasStayStarted(contextBooking);
    return {
      from: transferOrigin || (pickUp ? airportFor(contextBooking) : contextBooking.property),
      to: transferDestination || (pickUp ? contextBooking.property : airportFor(contextBooking)),
    };
  };

  const openRideRequest = (ride: { from: string; to: string; toDetail?: string; date?: string }) => {
    setTransferOrigin(ride.from);
    setTransferDestination(ride.to);
    setTransferDestinationAddress(ride.toDetail ?? '');
    setRidePassengers(contextBooking.guestCount);
    setRideWhen(ride.date ? 'later' : 'now');
    setRideDate(ride.date ?? '');
    go('transfer-booking');
  };

  /* Airport to hotel, on arrival day. */
  const openArrivalRide = () => openRideRequest({ from: airportFor(contextBooking), to: contextBooking.property, date: contextBooking.checkIn });
  /* Hotel to airport, now: offered once the guest has checked out. */
  const openDepartureRide = () => openRideRequest({ from: contextBooking.property, to: airportFor(contextBooking) });

  const openRideRequestChat = () => {
    const { from, to } = rideEnds();
    const [hours = 10, minutes = 0] = rideTime.split(':').map(Number);
    const clock = `${((hours + 11) % 12) + 1}:${String(minutes).padStart(2, '0')} ${hours >= 12 ? 'PM' : 'AM'}`;
    const schedule = rideWhen === 'later' && rideDate && rideTime ? ` on ${formatServiceDay(rideDate).long} at ${clock}` : ' now';
    const guestMessage = `I’d like to request a ride from ${from} to ${to} for ${ridePassengers} ${ridePassengers === 1 ? 'guest' : 'guests'}${schedule}.`;
    setChatOrderVenue(null);
    setChatDraft('');
    setChatMessages((messages) => [...messages, { from: 'guest', body: guestMessage, state: 'Sent' }]);
    setSending(true);
    go('chat');
    window.setTimeout(() => {
      setChatMessages((messages) => [...messages, { from: 'desk', body: 'Thanks. We’ll confirm availability, vehicle details, estimated fare, and pickup instructions here shortly.', state: 'Seen' }]);
      setSending(false);
    }, 850);
  };

  const openExtensionChat = () => {
    setChatDraft('Hi! I’d like to ask if I can extend my stay for one more night. Is my current room available, and how much would the additional night cost?');
    go('chat');
  };

  const openLateCheckoutChat = () => {
    setChatDraft('Hi! I’d like to request a later checkout time. Is late checkout available, and are there any additional fees?');
    go('chat');
  };

  const showNav = ['stay-overview', 'pre-arrival-services', 'marketplace', 'category-listing', 'nearby-recommendations', 'nearby-establishment', 'gifts-souvenirs', 'gift-order-cart', 'gift-order-confirmation', 'room-upgrades', 'room-upgrade-confirmation', 'room-upgrade-success', 'room-transfer-details', 'extend-stay', 'extend-stay-review', 'extend-stay-success', 'hotel-service', 'vendor-service', 'restaurant-menu', 'restaurant-cart', 'dining-order-confirmation', 'service-booking', 'booking-confirmation', 'booking-blocked', 'my-stay', 'notifications', 'stay-entry', 'cancel-before-cutoff', 'cancel-after-cutoff', 'folio', 'chat', 'chat-after-hours', 'room-qr-midstay', 'stay-review', 'stay-review-sent', 'profile', 'stay-history', 'rewards', 'reward-detail', 'badge-detail'].includes(activeScreen);
  const showPrimaryNav = showNav && !isChatScreen(activeScreen) && (session.auth === 'authenticated' || session.bookings.length > 0);
  const isWelcome = activeScreen === 'entry-hub';
  const primaryBooking = getPrimaryBooking(session.bookings, session.activeBookingId);
  const checkedOutNav = Boolean(primaryBooking && describeStayStatus(primaryBooking).status === 'checked-out');
  const eligibleRoomReadyBooking = primaryBooking && canReportRoomReady(primaryBooking)
    ? primaryBooking
    : undefined;
  /*
    Nothing in the guest-facing app ever gives a `pending` booking a room
    number -- the PMS does that, off-app, on its own schedule. Without a way
    to fire that event here, "Assigned" and "Ready" were unreachable except by
    editing fixture data directly.
  */
  const eligibleRoomAssignBooking = primaryBooking && describeRoomAssignment(primaryBooking).state === 'pending'
    ? primaryBooking
    : undefined;
  const roomReadyNotificationBooking = roomReadyNotificationBookingId
    ? session.bookings.find((booking) => booking.id === roomReadyNotificationBookingId)
    : undefined;
  const roomReadyNotification = roomReadyNotificationBooking
    ? describeRoomAssignment(roomReadyNotificationBooking)
    : undefined;
  const displayBooking = primaryBooking ?? lookupBooking ?? MOCK_SESSION.bookings[0]!;

  const contextBooking = primaryBooking ?? displayBooking;
  /** What this stay's own hotel offers: a Manila-only row stays in Manila. */
  const stayVenues = RESTAURANTS.filter(offeredIn(contextBooking.city));
  const stayServices = SERVICES.filter(offeredIn(contextBooking.city));
  const selectedService = SERVICES.find((service) => service.id === selectedServiceId) ?? SERVICES.find((service) => service.id === 'spa')!;
  const servicePrice = parsePesoAmount(selectedService.price);
  /* What the booking costs once staged points come off it. */
  const serviceCharge = formatPesoAmount(Math.max(0, servicePrice - pesosOff(appliedPoints)));
  /* Room, card or nothing -- decided by the gate, never by the form. */
  const servicePayment = describeServicePayment(selectedService.price);
  const contextRoom = contextBooking.roomNumber ? `Room ${contextBooking.roomNumber}` : 'Room assigned at arrival';
  const contextService = session.serviceBookings.find(
    (service) => service.id === 'service-hilom-1' && service.bookingId === contextBooking.id,
  );

  /* The provider's stated cutoff; the app's provisional 24 hours when a booking is not in the catalogue. */
  const cutoffFor = (service: ServiceBooking) =>
    SERVICES.find((item) => item.id === service.serviceId)?.cutoff ?? '24-hour cancellation cutoff';

  /*
    The booking a cancel screen is about: the one opened from My Stay. The
    Hilom fixture is only the fallback for a screen rendered on its own -- it
    used to be the only booking these screens could cancel.
  */
  const cancellableServiceFor = (entryId: string | null): ServiceBooking =>
    session.serviceBookings.find((service) => service.id === entryId)
      ?? contextService
      ?? {
        id: 'service-hilom-1',
        bookingId: contextBooking.id,
        title: 'Hilom signature massage',
        serviceId: 'spa',
        scheduledFor: `${formatServiceDay('2026-11-12').long} · 1:30 PM`,
        scheduledDate: '2026-11-12',
        scheduledHour: 13,
        amount: '₱2,400',
        status: 'confirmed',
      };

  /* Inside the provider's cutoff, a change is the front desk's to make. */
  const canCancelYourself = (entryId: string) => {
    const service = cancellableServiceFor(entryId);
    const cutoffHours = cancellationCutoffHours(cutoffFor(service));
    return cutoffHours !== null && getCancellationState(hoursUntilService(service), cutoffHours) === 'self-service';
  };

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

  const simulateRoomAssignment = () => {
    if (!eligibleRoomAssignBooking || !online) return;

    setSession((current) => ({
      ...current,
      bookings: current.bookings.map((booking) =>
        booking.id === eligibleRoomAssignBooking.id
          ? { ...booking, roomNumber: '512', roomAssignment: 'assigned' }
          : booking,
      ),
    }));
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
    // A room order is a room charge: the same gate as every other one.
    if (!booking || !canUseOnPropertyServices(booking)) {
      setDiningOrderError(booking && isStayUnderWay(booking) ? 'Scan your room code to order to your room' : 'Room orders open when your stay starts');
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
    if (checkoutPayment !== 'room') {
      setDiningOrderError('Choose how you would like to pay before placing your order');
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
      provider: 'Operated by the hotel',
      paymentStatus: 'charged-to-room',
      paymentMethod: 'room',
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

  const changeGiftQuantity = (productName: string, delta: number) => {
    setGiftCart((cart) => ({ ...cart, [productName]: Math.max(0, (cart[productName] ?? 0) + delta) }));
  };

  const confirmGiftOrder = () => {
    const booking = getPrimaryBooking(session.bookings, session.activeBookingId);
    const items = GIFT_PRODUCTS.filter((product) => (giftCart[product.name] ?? 0) > 0);
    const total = items.reduce((sum, product) => sum + parsePesoAmount(product.price) * (giftCart[product.name] ?? 0), 0);
    // A room charge: online, and behind the room scan like every other one.
    if (!online || !booking || !canUseOnPropertyServices(booking) || !items.length) return;
    if (checkoutPayment !== 'room') return;
    const fulfillment = giftFulfillment === 'room' ? `Deliver to Room ${booking.roomNumber}` : 'Pick up at the lobby';
    const serviceBooking: ServiceBooking = {
      id: `gift-order-${session.serviceBookings.length + 1}`,
      bookingId: booking.id,
      title: 'Gifts & Souvenirs',
      scheduledFor: `${fulfillment} · Today`,
      scheduledDate: PROTOTYPE_TODAY,
      amount: formatPesoAmount(total),
      status: 'confirmed',
      provider: 'Operated by the hotel',
      paymentStatus: 'charged-to-room',
      paymentMethod: 'room',
    };
    setSession((current) => ({ ...current, serviceBookings: [serviceBooking, ...current.serviceBookings], folioTotal: formatPesoAmount(parsePesoAmount(current.folioTotal) + total) }));
    setGiftOrder({ items, total, paymentStatus: 'charged-to-room', paymentMethod: 'room' });
    setGiftCart({});
    go('gift-order-confirmation');
  };

  /*
    The gate, resolved once per render. Every surface that asks "can this
    guest book, charge, or order" reads this rather than re-deriving it, so
    the tab bar and the buttons inside it cannot disagree.
  */
  const bookingSlot = describeBookingSlot(contextBooking);
  const bookingNavLabel = bookingSlot.label;
  const unlockPending = session.unlockRequest?.bookingId === contextBooking.id;

  /*
    The 24-hour front-desk window. Real arithmetic over `checkedOutAt`, but
    the prototype reaches both sides of it through the state switcher rather
    than by elapsing -- nothing should expire while a stakeholder is looking
    at it. "Simulate 24 hours after checkout" asks the same question a day
    later, so chat, My Stay and the review prompt all agree the desk closed.
  */
  const postStayWindow = describePostStayWindow(
    contextBooking,
    simulatePostStayExpired && contextBooking.checkedOutAt
      ? new Date(Date.parse(contextBooking.checkedOutAt) + POST_STAY_DESK_HOURS * 3_600_000).toISOString()
      : undefined,
  );
  /** This guest's own history. Empty for an account that has not stayed yet. */
  const pastStays = session.pastStays;
  const [autoDetectScans, setAutoDetectScans] = useState(true);
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
    /*
      Every outcome replaces the viewfinder rather than stacking on it. It is a
      step, not a place: Back onto it would have it read the code again, and
      the guest would land on the result a second time.
    */
    if (!primaryBooking) {
      replaceScreen('room-qr-landing');
      return;
    }
    /*
      A third outcome: the right code at the wrong time. Before the stay starts
      -- or after it ends -- nobody is in the room, so the model refuses to
      record presence, and this says why instead of announcing an unlock that
      did not happen.
    */
    if (!isStayUnderWay(primaryBooking)) {
      setBookingBlockedReason(primaryBooking.status === 'completed' ? 'checked-out' : 'scanned-early');
      replaceScreen('booking-blocked');
      return;
    }
    setSession((current) => verifyRoomPresence(current, primaryBooking.id, 'scan'));
    setScanSuccessToast(true);
    replaceScreen('room-qr-midstay');
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

  /**
   * Decide before the guest fills a form in, not after -- for the service they
   * chose. Every listing used to land on the same massage form, and the arrival
   * roster skipped this check entirely and landed there too.
   */
  const openServiceBooking = (serviceId: string = selectedServiceId) => {
    setSelectedServiceId(serviceId);
    setServiceDate(null);
    setServiceTime('1:30 PM');
    setServicePartySize(1);
    setAppliedPoints(0);
    if (!online) { setBookingBlockedReason('offline'); go('booking-blocked'); return; }
    if (!canBookService(contextBooking, serviceId)) {
      setBookingBlockedReason(blockedReasonFor(contextBooking));
      go('booking-blocked');
      return;
    }
    goToCheckout('service-booking');
  };

  const openExploreItem = (itemId: string) => {
    const venue = RESTAURANTS.find((restaurant) => restaurant.id === itemId);
    if (venue) {
      setSelectedRestaurantId(venue.id);
      go('restaurant-menu');
      return;
    }

    const service = SERVICES.find((entry) => entry.id === itemId);
    if (!service) return;
    setSelectedCategory(service.categoryId);
    go('category-listing');
  };

  const closeExploreStory = () => {
    setOpenExploreStoryId(null);
    setExploreIntroPlaying(false);
  };

  const openExploreStory = (storyId: string) => {
    if (!EXPLORE_STORIES.some((story) => story.id === storyId)) return;
    setOpenExploreStoryId(storyId);
    setExploreIntroPlaying(false);
  };

  const openExploreIntro = () => {
    const firstStory = EXPLORE_STORIES[0];
    if (!firstStory) {
      go('marketplace');
      return;
    }
    if (!primaryBooking) {
      go('marketplace');
      return;
    }
    if (!canUseOnPropertyServices(primaryBooking)) {
      go(bookingSlot.screen);
      return;
    }
    setOpenExploreStoryId(firstStory.id);
    setExploreIntroPlaying(true);
    go('marketplace');
  };

  const bookExploreStory = (storyId: string) => {
    closeExploreStory();
    const itemId = storyId.replace(/^(?:venue|service)-/, '');
    openExploreItem(itemId);
  };

  const openHomeStory = (categoryId: HomeStoryCategoryId) => {
    if (!HOME_CATEGORY_STORIES[categoryId]) return;
    setOpenHomeStoryId(categoryId);
  };

  const closeHomeStory = () => setOpenHomeStoryId(null);

  const bookHomeStory = (storyId: string) => {
    const categoryId = (Object.keys(HOME_CATEGORY_STORIES) as HomeStoryCategoryId[])
      .find((id) => HOME_CATEGORY_STORIES[id].id === storyId);
    if (!categoryId) return;

    closeHomeStory();
    if (categoryId === 'gifts-souvenirs') {
      go('gifts-souvenirs');
      return;
    }
    setSelectedCategory(categoryId);
    go('category-listing');
  };

  const confirmService = () => {
    const booking = getPrimaryBooking(session.bookings, session.activeBookingId);
    if (!online) {
      setBookingBlockedReason('offline');
      go('booking-blocked');
      return;
    }
    if (!booking || !canBookService(booking, selectedService.id)) {
      // Not a network problem, and it must not claim to be one.
      setBookingBlockedReason(booking ? blockedReasonFor(booking) : 'not-arrived');
      go('booking-blocked');
      return;
    }
    const payment = describeServicePayment(selectedService.price) === 'complimentary'
      ? 'complimentary'
      : checkoutPayment === 'room' ? 'room' : 'card';
    if (payment === 'card' && (checkoutPayment !== 'pay-now' || !paymentMethod)) return;

    const day = serviceDate ?? bookableServiceDays(booking)[0] ?? PROTOTYPE_TODAY;
    const { hour } = parseClockTime(serviceTime);
    /*
      One booking per service per slot, so the id is the slot. It used to be the
      fixture's own `service-hilom-1` whatever was booked -- which silently moved
      the guest's existing massage to the new time -- and Back to this form and
      confirming again must find the booking already made, not make another.
    */
    const id = `service-${selectedService.id}-${booking.id}-${day}-${hour}`;
    if (session.serviceBookings.some((service) => service.id === id && service.status === 'confirmed')) {
      setLastServiceBookingId(id);
      setAppliedPoints(0);
      go('booking-confirmation');
      return;
    }

    const serviceBooking: ServiceBooking = {
      id,
      bookingId: booking.id,
      title: selectedService.name,
      scheduledFor: `${formatServiceDay(day).long} · ${serviceTime}`,
      scheduledDate: day,
      scheduledHour: hour,
      bookedAt: PROTOTYPE_TODAY,
      serviceId: selectedService.id,
      partySize: servicePartySize,
      /* What is actually charged: points come off before anything sees it. */
      amount: formatPesoAmount(Math.max(0, servicePrice - pesosOff(appliedPoints))),
      status: 'confirmed',
      provider: describeServiceProvider(selectedService),
      paymentStatus: payment === 'room' ? 'charged-to-room' : payment === 'card' ? 'paid' : 'complimentary',
      paymentMethod: payment === 'room' ? 'room' : payment === 'card' ? paymentMethod ?? 'card' : undefined,
    };

    const booked: GuestSession = {
      ...session,
      serviceBookings: [...session.serviceBookings, serviceBooking],
      // Only a room charge touches the folio. Card payments settle on the spot.
      folioTotal: payment === 'room'
        ? formatPesoAmount(parsePesoAmount(session.folioTotal) + parsePesoAmount(serviceBooking.amount))
        : session.folioTotal,
    };

    /*
      Spending and booking are one step, so a balance can never be debited for
      a booking that did not happen.
    */
    const next = appliedPoints > 0
      ? spendPoints(booked, {
          id: serviceBooking.id,
          title: `Points off ${serviceBooking.title}`,
          points: appliedPoints,
        })
      : booked;

    /*
      Compared before and after rather than recomputed from the new session
      alone: what matters on the confirmation is what this booking changed, not
      everything the guest happens to hold.
    */
    const held = new Set(earnedBadges(session).map((row) => row.definition.id));
    setJustEarned(earnedBadges(next)
      .filter((row) => !held.has(row.definition.id))
      .map((row) => row.definition.id));

    setSession(next);
    setLastServiceBookingId(id);
    setAppliedPoints(0);
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

  /*
    `earlyCheckIn` is the guest's answer on the last step: true asks, false
    keeps the standard time. Both buttons used to call this with nothing, so a
    request for an 11:00 AM room went nowhere and looked identical to declining.
    Left out -- "Confirm everything" on the review -- it keeps what is there.
  */
  const completePreArrival = (earlyCheckIn?: boolean) => {
    const request = { time: '11:00 AM', fee: '₱1,500' };
    if (earlyCheckIn) {
      setChatMessages((messages) => [
        ...messages,
        { from: 'guest', body: `I’d like to request early check-in from ${request.time} on ${formatStayDateRange(contextBooking).split('–')[0]}.`, state: online ? 'Sent' : 'Will send when connected' },
        { from: 'desk', body: 'Noted. We’ll confirm early check-in before you arrive. If it’s approved, the fee goes on your room at checkout.', state: 'Seen' },
      ]);
    }
    const next: GuestSession = {
      ...session,
      bookings: session.bookings.map((booking) =>
        booking.id === contextBooking.id
          ? {
              ...booking,
              earlyCheckIn: earlyCheckIn === undefined ? booking.earlyCheckIn : earlyCheckIn ? request : undefined,
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



  const claimBooking = () => {
    const next = connectBooking(session, lookupBooking ?? undefined);
    setSession(next);
    // A booking-first guest still needs the registration flow. Authenticated
    // guests use the shared pre-arrival home after connecting another stay.
    go(session.auth === 'authenticated' ? getPostAuthScreen(next) : 'guest-details');
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
    setCode('');
    setCodeNotice(null);
    setScrolled(false);
    setActiveScreen(
      state === 'signed-out'
        ? 'entry-hub'
        : state === 'account-only'
          ? 'identify'
          : 'stay-overview',
    );
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
    setCode('');
    setCodeNotice(null);
    setHistory([]);
    setActiveScreen('entry-hub');
    setScrolled(false);
  };

  const renderBookingLookup = () => (
    <ScreenIntro
      title="Find your booking"
      text="Enter the number from your booking confirmation."
    >
      <form
        className="guest-form"
        onSubmit={(event: FormEvent<HTMLFormElement>) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          const reference = String(data.get('booking-number') ?? '');
          const lastName = String(data.get('last-name') ?? '');

          const match = findBookingByLookup(reference);
          if (match) {
            setLookupBooking(match);
            go('booking-found');
            return;
          }

          /* Not a live reservation. Before anything else, see whether it is a
             stay this guest has already finished -- a returning guest has no
             live booking to find, only an old reference. */
          const profile = findProfileByLookup(reference);
          if (profile) {
            setProfileMatch(profile);
            setCode('');
            setCodeNotice(null);
            go('verify-contact');
            return;
          }

          /*
            Anything else is accepted, stamped with what the guest typed. The
            prototype has one real reference, so strict matching meant a demo
            mostly showed the not-found screen. `strictLookup` in the
            prototype controls puts the refusal back when that path is what
            needs demonstrating.
          */
          if (strictLookup) {
            go('no-booking');
            return;
          }
          setLookupBooking(bookingFromLookup(reference, lastName));
          go('booking-found');
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
    </ScreenIntro>
  );

  const renderChatScreen = () => {
    const chatDisabled = checkedOutNav && !postStayWindow.deskOpen;
    const restaurantChat = Boolean(chatOrderVenue);
    const displayedChatMessages: ChatMessage[] = chatDisabled ? [
      { from: 'desk', body: 'Good afternoon, Ana. How can we help with your stay?', state: 'Seen' },
      { from: 'guest', body: 'Could we get two fresh towels, please?', state: 'Seen' },
      { from: 'desk', body: `Of course — we’ll send two fresh towels to ${contextRoom.toLowerCase()} shortly.`, state: 'Seen' },
    ] : chatMessages;
    const chatStarted = displayedChatMessages.some((message) => message.from === 'guest');

    return (
      <div
        className={`guest-chat${chatDisabled ? ' guest-chat--disabled' : ''}${restaurantChat ? ' guest-chat--restaurant' : ''} ${chatStarted ? 'guest-chat--conversation' : 'guest-chat--welcome'}`}
        data-chat-mode={chatStarted ? 'conversation' : 'welcome'}
        role="region"
        aria-label="Front desk conversation"
      >
        <div className="guest-chat__context">
          <div className="guest-chat__identity">
            <button className="guest-chat__back" type="button" onClick={history.length ? back : () => go('stay-overview')} aria-label="Go back"><ArrowLeft aria-hidden="true" /></button>
            <div className="guest-chat__identity-copy">
              <h1>Front desk</h1>
              <span>{contextBooking.property}</span>
            </div>
          </div>
        </div>

        {chatDisabled ? <Notice tone="neutral" title="Chat is closed">For help after 24 hours, please contact the hotel directly.</Notice> : null}
        {!online ? <Notice tone="offline" title="Messages will send when connected">Your chat history is available. New requests wait on this device.</Notice> : null}

        {restaurantChat ? <p className="guest-chat__order-context">Ordering from {chatOrderVenue}</p> : null}

        <div className="guest-messages" aria-label="Conversation" aria-live="polite">
          {!chatStarted && !chatDisabled && !restaurantChat ? (
            <div className="guest-chat__welcome" aria-labelledby="guest-chat-welcome-title">
              <p>Good afternoon, Ana.</p>
              <h2 id="guest-chat-welcome-title">How can we help with your stay?</h2>
            </div>
          ) : null}
          {displayedChatMessages.map((message, index) => {
            const continued = displayedChatMessages[index - 1]?.from === message.from;
            return (
              <div
                key={`${message.body}-${index}`}
                className={`guest-message guest-message--${message.from}${continued ? ' guest-message--continued' : ''}`}
              >
                <p>{message.body}</p>
                {message.attachment ? (
                  message.attachment.kind === 'image' ? (
                    <button
                      className="guest-message__attachment guest-message__attachment--image"
                      type="button"
                      aria-label={message.attachment.name}
                      onClick={(event) => openChatImagePreview(message.attachment!.url, event.currentTarget)}
                    >
                      <Image
                        src={message.attachment.url}
                        alt={message.attachment.name}
                        width={220}
                        height={160}
                        unoptimized
                      />
                    </button>
                  ) : (
                    <div className="guest-message__attachment guest-message__attachment--audio">
                      <audio
                        controls
                        src={message.attachment.url}
                        aria-label={`Voice message · ${formatChatDuration(message.attachment.duration ?? 0)}`}
                      />
                    </div>
                  )
                ) : null}
                {message.images?.length ? (
                  <ChatMenuGallery images={message.images} onOpen={openChatImagePreview} />
                ) : null}
                {message.from === 'guest' && message.state ? <small>{message.state}</small> : null}
              </div>
            );
          })}
          {sending ? (
            <div className="guest-message guest-message--desk guest-message--typing" role="status">
              <span className="guest-typing-dots" aria-hidden="true"><i /><i /><i /></span>
              <span>Front desk is replying</span>
            </div>
          ) : null}
          {/*
            Inside the conversation, not after it. The composer is docked over
            the bottom of the screen, and as the next sibling this sat directly
            underneath it -- present in the page, unreachable by a tap. Here it
            follows the request it answers and scrolls with the thread, above
            the space the conversation already keeps clear for the composer.
          */}
          {unlockPending ? <div className="guest-desk-grant"><small>Front desk view — this prototype stands in for the desk&rsquo;s own tool</small><Button className="guest-button guest-button--secondary" type="button" onClick={grantFrontDeskUnlock}>Confirm {session.guestName || 'the guest'} is in room {contextBooking.roomNumber ?? ''}</Button></div> : null}
        </div>

        <div className="guest-chat__dock">
          {!restaurantChat ? (
            <div className="guest-quick-actions" aria-label="Popular requests">
              <div className="guest-quick-actions__rail">
                {CHAT_QUICK_ACTIONS.map((action) => (
                  <button
                    key={action.label}
                    type="button"
                    disabled={chatDisabled}
                    onClick={() => sendQuickMessage(action.message(contextRoom))}
                  >
                    <span className="guest-quick-actions__copy">
                      <b>{action.label}</b>
                      <small>{action.description}</small>
                    </span>
                    <CaretRight aria-hidden="true" />
                  </button>
                ))}
              </div>
            </div>
          ) : null}
          <ChatComposer
            disabled={chatDisabled}
            draft={chatDraft}
            onDraftChange={setChatDraft}
            placeholder={restaurantChat ? 'Type your order…' : undefined}
            autoFocus={restaurantChat}
            onSubmit={({ body, attachment }) => sendChatMessage(body, attachment)}
          />
        </div>
        {chatPreviewImage ? (
          <div
            className="guest-chat-image-preview"
            role="dialog"
            aria-modal="true"
            aria-label="Image preview"
            tabIndex={-1}
            onClick={(event) => {
              if (event.target === event.currentTarget) closeChatImagePreview();
            }}
            onKeyDown={(event) => {
              if (event.key === 'Tab') {
                event.preventDefault();
                chatPreviewCloseRef.current?.focus();
              }
            }}
          >
            <button ref={chatPreviewCloseRef} type="button" aria-label="Close preview" onClick={closeChatImagePreview}><X /></button>
            <Image src={chatPreviewImage} alt="Catalog preview" fill sizes="90vw" unoptimized={chatPreviewImage.startsWith('blob:')} />
          </div>
        ) : null}
      </div>
    );
  };

  const renderArrivalServices = () => {
    /*
      No booking at all: nothing to arrive at. `contextBooking` falls back to a
      fixture here, so without this a guest with no stay was offered transfers
      to the reference hotel. Home is where "add a booking" lives.
    */
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
    const arrivalServices = [
      ...SERVICES.filter((service) => isPreArrivalService(service.id)),
      { id: 'early-check-in', name: 'Early check-in', note: 'Subject to hotel confirmation' },
    ];
    const arrivalDescription = bookingSlot.locked
      ? contextBooking.roomNumber
        ? 'Arrange a transfer, luggage help, or another arrival service. Scan the code in your room to unlock dining, spa, tours, and room charging.'
        : 'Arrange a transfer, luggage help, or another arrival service while the hotel assigns your room. The on-property catalogue opens after your room is assigned and you scan in.'
      : 'Explore arrival services at the hotel and arrange what you need before you arrive.';

    return (
      <div className="guest-stack">
        <div className="guest-page-title">
          <h1>Arrival services</h1>
          <p>{arrivalDescription}</p>
        </div>

        {!online ? <Notice tone="offline" icon={<WifiSlash />} title="Browsing saved services">Live availability and booking require a connection.</Notice> : null}

        <section>
          {/* Photo cards, after Places' Discover: the service named on its picture. */}
          <div className="guest-arrival-cards">
            {arrivalServices.map((service) => {
              const image = 'categoryId' in service
                ? getServiceImage(getServiceImageKey(service))
                : getPropertyImage(contextBooking.property);
              return (
                <button
                  key={service.id}
                  className="guest-arrival-card"
                  type="button"
                  onClick={() => service.id === 'transfer' ? openArrivalRide() : service.id === 'early-check-in' ? go('early-check-in') : openServiceBooking(service.id)}
                >
                  <Image className="guest-arrival-card__image" src={image.src} alt="" fill sizes="(max-width: 720px) 100vw, 560px" style={{ objectPosition: image.focalPoint }} />
                  {'note' in service ? <span className="guest-arrival-card__chip">{service.note}</span> : null}
                  <span className="guest-arrival-card__copy">
                    <span className="guest-arrival-card__glyph" aria-hidden="true">{ARRIVAL_GLYPHS[service.id] ?? <Wrench />}</span>
                    <b>{service.name}</b>
                    <small>{ARRIVAL_BLURBS[service.id] ?? 'Arranged by the hotel before you arrive.'}</small>
                  </span>
                  <CaretRight className="guest-arrival-card__caret" aria-hidden="true" />
                </button>
              );
            })}
          </div>
        </section>

        {bookingSlot.locked ? (
          <section>
            {unlockPending ? (
              <>
                <Notice title="The front desk has your request">
                  You can still arrange arrival services while the front desk confirms your room.
                </Notice>
                <Button className="guest-button guest-button--secondary" type="button" onClick={() => go('chat')}>
                  Open the front desk conversation<ArrowRight aria-hidden="true" />
                </Button>
              </>
            ) : contextBooking.roomNumber ? (
              <>
                <Notice title="Unlock on-property Explore">
                  Dining, spa, tours, and room charges open when you scan the code in your room.
                </Notice>
                <Button className="guest-button guest-button--primary" type="button" onClick={() => go('scan-room-code')}>
                  Scan room code<ArrowRight aria-hidden="true" />
                </Button>
                <TextButton onClick={askFrontDeskToUnlock}>I can&rsquo;t scan</TextButton>
              </>
            ) : (
              <>
                <Notice title="Your room is still being assigned">
                  You can arrange arrival services while the hotel prepares your room. On-property Explore opens after the room is assigned and you scan in.
                </Notice>
                <Button className="guest-button guest-button--secondary" type="button" onClick={() => go('chat')}>
                  Message the front desk<ArrowRight aria-hidden="true" />
                </Button>
              </>
            )}
          </section>
        ) : (
          <Notice title="Hotel confirmation">
            Some arrival requests depend on hotel availability. Charge a service to your room and settle it at checkout, or pay now by card, GCash or Maya. We&rsquo;ll show whether it is complimentary or needs hotel confirmation before you book.
          </Notice>
        )}
      </div>
    );
  };

  const renderScreen = () => {
    switch (activeScreen) {
      case 'entry-hub':
        return (
          <WelcomeScreen
            online={online}
            onSso={(method) => {
              /*
                Where the model says, not a hardcoded screen.

                `ssoSession` returns a guest the estate already knows, upcoming
                booking included -- so sending them to "Log in with a booking"
                asked them to look up the reservation they were already
                holding, and the lookup stopped being the secondary action it
                was specified as.
              */
              const next = ssoSession(method);
              setSession(next);
              go(getPostAuthScreen(next));
            }}
            onEmailLogin={() => {
              setPendingEmail('');
              setCode('');
              setCodeNotice(null);
              go('sign-in');
            }}
            onGuestLogin={() => {
              go('identify');
            }}
          />
        );

      case 'sign-in':
        return (
          <ScreenIntro title="Log in" text="Use the email connected to your Cabana account.">
            <form
              className="guest-form"
              onSubmit={(event: FormEvent<HTMLFormElement>) => {
                event.preventDefault();
                const form = new FormData(event.currentTarget);
                setPendingEmail(String(form.get('login-email') ?? '').trim());
                setCode('');
                setCodeNotice(null);
                go('verify-code');
              }}
            >
              <Field
                label="Email"
                name="login-email"
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                spellCheck={false}
                required
              />
              <Button className="guest-button guest-button--primary" type="submit" disabled={!online}>
                Continue<ArrowRight aria-hidden="true" />
              </Button>
            </form>
            {!online ? <Notice tone="offline" title="Log in needs a connection">Reconnect to receive a code.</Notice> : null}
            <TextButton onClick={() => go('entry-hub')}>Back to welcome</TextButton>
          </ScreenIntro>
        );

      case 'verify-code': {
        if (!pendingEmail) {
          return (
            <ScreenIntro title="Start again" text="Enter your email to receive a new verification code.">
              {primary('Log in with email', 'sign-in')}
            </ScreenIntro>
          );
        }

        return (
          <ScreenIntro
            title="Check your email"
            text={`We sent a 6-digit code to ${pendingEmail}.`}
          >
            <form
              className="guest-form"
              onSubmit={(event: FormEvent<HTMLFormElement>) => {
                event.preventDefault();
                if (!/^\d{6}$/.test(code)) {
                  setCodeNotice('Enter the 6-digit code.');
                  codeInputRef.current?.focus();
                  return;
                }

                const next = emailLoginSession(pendingEmail);
                setSession(next);
                setPendingEmail('');
                setCode('');
                setCodeNotice(null);
                go(getPostAuthScreen(next));
              }}
            >
              <label className="guest-field guest-code-field" htmlFor="login-code">
                <span>6-digit code *</span>
                <Input
                  ref={codeInputRef}
                  id="login-code"
                  name="login-code"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  spellCheck={false}
                  maxLength={6}
                  value={code}
                  onChange={(event) => {
                    setCode(event.currentTarget.value.replace(/\D/g, '').slice(0, 6));
                    setCodeNotice(null);
                  }}
                  aria-describedby={codeNotice ? 'login-code-error' : undefined}
                  aria-invalid={codeNotice ? 'true' : undefined}
                  required
                />
                {codeNotice ? <span id="login-code-error" role="alert">{codeNotice}</span> : null}
              </label>
              <Button className="guest-button guest-button--primary" type="submit" disabled={!online}>
                Verify<ArrowRight aria-hidden="true" />
              </Button>
            </form>
            {!online ? <Notice tone="offline" title="Verification needs a connection">Reconnect to continue.</Notice> : null}
            <TextButton onClick={() => go('sign-in')}>Use a different email</TextButton>
          </ScreenIntro>
        );
      }

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
          <div className="guest-stack guest-category-listing">
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
            <div className="guest-field-stack">
              <ExpandableField
                label="Check in"
                value={stayDraft.checkIn ? formatServiceDay(stayDraft.checkIn).short : 'Choose a day'}
                aside="Next 60 days"
                open={openFormField === 'check-in'}
                onToggle={() => setOpenFormField((field) => field === 'check-in' ? null : 'check-in')}
              >
                <CalendarPicker
                  available={daysFrom(PROTOTYPE_TODAY, 60)}
                  value={stayDraft.checkIn}
                  labelFor={(day) => formatServiceDay(day).long}
                  onChange={(day) => {
                    // A check-out on or before the new check-in moves to the next morning.
                    setStayDraft((draft) => ({ ...draft, checkIn: day, checkOut: draft.checkOut > day ? draft.checkOut : daysFrom(day, 2)[1]! }));
                    setOpenFormField('check-out');
                  }}
                />
              </ExpandableField>
              <ExpandableField
                label="Check out"
                value={stayDraft.checkOut ? formatServiceDay(stayDraft.checkOut).short : 'Choose a day'}
                aside="Up to 30 nights"
                open={openFormField === 'check-out'}
                onToggle={() => setOpenFormField((field) => field === 'check-out' ? null : 'check-out')}
              >
                <CalendarPicker
                  available={daysFrom(stayDraft.checkIn || PROTOTYPE_TODAY, 31).slice(1)}
                  value={stayDraft.checkOut}
                  labelFor={(day) => formatServiceDay(day).long}
                  onChange={(day) => { setStayDraft((draft) => ({ ...draft, checkOut: day })); setOpenFormField(null); }}
                />
              </ExpandableField>
              <StepperField
                label="Guests"
                unit="guest"
                value={Number(stayDraft.guests)}
                min={1}
                max={5}
                onChange={(next) => setStayDraft((draft) => ({ ...draft, guests: String(next), roomTypeId: '' }))}
              />
            </div>

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
                <button type="button" aria-pressed={stayPaymentMethod === 'card'} className={`guest-payment-chip ${stayPaymentMethod === 'card' ? 'is-selected' : ''}`} onClick={() => setStayPaymentMethod('card')}>
                  <CreditCard size={15} /> Card
                </button>
                <button type="button" aria-pressed={stayPaymentMethod === 'gcash'} className={`guest-payment-chip ${stayPaymentMethod === 'gcash' ? 'is-selected' : ''}`} onClick={() => setStayPaymentMethod('gcash')}>
                  GCash
                </button>
                <button type="button" aria-pressed={stayPaymentMethod === 'maya'} className={`guest-payment-chip ${stayPaymentMethod === 'maya' ? 'is-selected' : ''}`} onClick={() => setStayPaymentMethod('maya')}>
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
            title="Log in with a booking"
            text="Any reference from a stay with us works — the one you are on now, or one from years ago."
          >
            <form
              className="guest-form"
              onSubmit={(event: FormEvent<HTMLFormElement>) => {
                event.preventDefault();
                const data = new FormData(event.currentTarget);
                const reference = String(data.get('reentry-reference') ?? '');
                const lastName = String(data.get('reentry-last-name') ?? '').trim().toLowerCase();
                const match = findProfileByLookup(reference);
                if (!match || !lastName || !match.guestName.toLowerCase().endsWith(lastName)) {
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
              <Field label="Last name" name="reentry-last-name" placeholder="Santos" required />
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
                title="Start again"
              text="We no longer have the booking you matched. Enter the reference once more."
            >
              {primary('Enter a booking reference', 'identify-returning')}
            </ScreenIntro>
          );
        }

        return (
          <div className="guest-stack guest-stack--intro">
            <HeroIcon tone="dark"><ShieldCheck size={30} /></HeroIcon>
            <div className="guest-page-title">
              <p className="guest-eyebrow">Step 2 of 2</p>
              <h1>Is this your booking?</h1>
              <p>We found a stay under that reference. Confirm the details to open it in your account.</p>
            </div>

            <div className="guest-summary">
              <SummaryRow label="Booking" value={profileMatch.reference} />
              <SummaryRow label="Property" value={profileMatch.property} />
              <SummaryRow label="Guest" value={profileMatch.guestName} />
            </div>

            {/*
              Masked, and masked for a reason: holding a booking reference is
              not yet proof of anything, so this has to show the guest we
              reached the right person without telling an unknown party what
              their address is. Enough to recognise your own contact details,
              and no more.
            */}
            <div className="guest-summary">
              <SummaryRow label="Email" value={maskEmail(GUEST_PROFILE.email)} />
              <SummaryRow label="Mobile" value={maskMobile(GUEST_PROFILE.mobile)} />
            </div>

            <form
              className="guest-form"
              onSubmit={(event: FormEvent<HTMLFormElement>) => {
                event.preventDefault();
                if (!/^\d{6}$/.test(code)) {
                  setCodeNotice('Enter the 6-digit code.');
                  return;
                }
                completeReentry();
              }}
            >
              <label className="guest-field guest-code-field" htmlFor="reentry-code">
                <span>6-digit verification code *</span>
                <Input
                  id="reentry-code"
                  name="reentry-code"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  spellCheck={false}
                  maxLength={6}
                  value={code}
                  onChange={(event) => {
                    setCode(event.currentTarget.value.replace(/\D/g, '').slice(0, 6));
                    setCodeNotice(null);
                  }}
                  aria-describedby={codeNotice ? 'reentry-code-error' : undefined}
                  aria-invalid={codeNotice ? 'true' : undefined}
                  required
                />
                {codeNotice ? <span id="reentry-code-error" role="alert">{codeNotice}</span> : null}
              </label>
              <Button
                className="guest-button guest-button--primary"
                type="submit"
                disabled={!online || !/^\d{6}$/.test(code)}
              >
                Verify and open my account<ArrowRight aria-hidden="true" />
              </Button>
            </form>
            <TextButton onClick={() => go('identify-returning')}>Use a different booking</TextButton>
          </div>
        );
      }

      case 'lookup-fallback':
        return <ScreenIntro title="Use more booking details" text="Enter the details from your booking."><div className="guest-form"><Field label="Last name" name="fallback-name" defaultValue="Santos" /><Field label="Check-in date" name="fallback-date" type="date" defaultValue="2026-11-09" /><SelectField label="Property" name="property" defaultValue="manila"><option value="manila">The Henry Manila</option><option value="cebu">The Henry Cebu</option><option value="dumaguete">The Henry Manila</option></SelectField>{primary('Continue to front desk', 'front-desk-assist')}</div></ScreenIntro>;

      case 'front-desk-assist':
        return <ScreenIntro icon={<ChatCircleDots size={30} />} title="Let the front desk connect you" text="Ask for a secure link or a 6-digit code."><div className="guest-contact-card"><div><small>The Henry Manila</small><b>+63 2 8807 8888</b><span>Front desk · 6:00 AM–10:00 PM</span></div><a aria-label="Call front desk" className="guest-icon-button" href="tel:+63288078888"><Phone /></a></div><Field label="Code from the front desk" name="staff-code" placeholder="6-digit code" />{primary('Connect my stay', 'booking-found')}<TextButton onClick={() => go('no-booking')}>I don’t have a booking</TextButton></ScreenIntro>;

      case 'no-booking':
        return <ScreenIntro icon={<Receipt size={30} />} eyebrow="No booking found" title="Connect a hotel booking" text="Cabana connects to confirmed hotel bookings."><Notice title="Already booked?">Try your confirmation number or ask the front desk for a link.</Notice>{primary('Try again', 'identify')}<TextButton onClick={() => go('identify-returning')}>Stayed with us before? Use a booking reference</TextButton><TextButton onClick={() => go('front-desk-assist')}>Contact front desk</TextButton></ScreenIntro>;

      case 'booking-found':
        return (
          <StayConfirm
            booking={displayBooking}
            art={<PropertyImage property={displayBooking.property} decorative />}
            continueLabel={session.auth === 'authenticated' ? 'Go to my stay' : 'Add your details'}
            doneText={session.auth === 'authenticated'
              ? `${displayBooking.property} is in your Cabana now, with everything for the stay.`
              : `${displayBooking.property} is in your Cabana now. A few details next, and you’re ready to arrive.`}
            onConfirm={claimBooking}
            secondary={<TextButton onClick={() => go('identify')}>No, this isn't my booking</TextButton>}
          />
        );

      case 'welcome-back':
        return <ScreenIntro icon={<CheckCircle size={30} />} title={`Welcome back, ${session.guestName.split(' ')[0]}`} text="Your saved identity is ready for this stay at a new property."><StayCard booking={displayBooking} /><Notice tone="positive" icon={<Sparkle />} title="No typing needed">Review what we already have, then confirm your stay.</Notice>{primary('Review saved details', 'repeat-review')}</ScreenIntro>;

      case 'stay-overview':
        return <StayOverviewHome session={session} booking={primaryBooking} online={online} deskOpen={postStayWindow.deskOpen} onNavigate={go} onOpenStory={openHomeStory} onOpenStay={(id) => { setSelectedPastStayId(id); go('stay-detail'); }} onRequestRide={(direction) => (direction === 'arrival' ? openArrivalRide() : openDepartureRide())} />;

      case 'guest-details':
        return <FormScreen step="1 of 4" title="Your details" text="These details are sent securely to the property for registration."><Field label="Full name" name="guest-name" defaultValue="Ana Santos" required /><Field label="Nationality" name="nationality" defaultValue="Filipino" /><Field label="Email" name="guest-email" type="email" defaultValue="ana@example.com" /><Field label="Mobile" name="guest-mobile" type="tel" defaultValue="+63 917 555 0142" />{primary('Continue to ID', 'id-capture')}</FormScreen>;

      case 'id-capture':
        return <FormScreen step="2 of 4" title="ID or passport" text="International guests need passport details."><PassportCapturePanel subjectName={session.guestName || 'Ana Santos'} onAutofill={setPrimaryPassportFields} /><Field label="Document number" name="document-number" placeholder="Enter document number" value={primaryPassportFields.documentNumber} onValueChange={(documentNumber) => setPrimaryPassportFields((current) => ({ ...current, documentNumber }))} /><Field label="Expiry date" name="expiry" type="date" value={primaryPassportFields.expiry} onValueChange={(expiry) => setPrimaryPassportFields((current) => ({ ...current, expiry }))} />{primary('Save and continue', 'additional-guests')}</FormScreen>;

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
              onClick={() => completePreArrival()}
            >
              Confirm everything<ArrowRight aria-hidden="true" />
            </Button>
            <TextButton onClick={() => go('guest-details')}>Edit details</TextButton>
          </ScreenIntro>
        );

      case 'room-upgrades':
        return <div className="guest-stack"><div className="guest-page-title"><p className="guest-eyebrow">Current stay · Room {contextBooking.roomNumber}</p><h1>Available upgrades</h1><p>Explore rooms available for the rest of your stay.</p></div>{ROOM_UPGRADES.map((upgrade) => <article className="guest-upgrade-card" key={upgrade.id}><Image src={upgrade.image} alt="" width={900} height={360} /><div className="guest-upgrade-card__body"><div><h2>{upgrade.name}</h2><p>{upgrade.type}</p></div><p>{upgrade.features}</p><small>Up to {upgrade.guests} · {upgrade.transfer}</small><strong>{upgrade.price} additional for the remaining stay</strong><Button className="guest-button guest-button--primary" type="button" onClick={() => { setSelectedUpgradeId(upgrade.id); go('room-upgrade-confirmation'); }}>Select room<ArrowRight /></Button></div></article>)}</div>;

      case 'extend-stay': {
        const nights = Math.max(1, countNightsBetween(contextBooking.checkOut, extensionDate));
        const additional = nights * 5000;
        const updatedTotal = parsePesoAmount(session.folioTotal || contextBooking.folioTotal || '₱10,250') + additional;
        return <ScreenIntro eyebrow={`Current stay · Room ${contextBooking.roomNumber}`} title="Extend your stay" text="Keep your room and choose a new checkout date while availability lasts."><div className="guest-summary"><SummaryRow label="Current checkout" value={`${contextBooking.checkOut} · 12:00 PM`} /><SummaryRow label="Room availability" value={`Room ${contextBooking.roomNumber} available to extend`} /></div><label className="guest-field"><span>New checkout date</span><input type="date" value={extensionDate} min={contextBooking.checkOut} onChange={(event) => setExtensionDate(event.target.value)} /></label><div className="guest-summary"><SummaryRow label="Additional nights" value={`${nights}`} /><SummaryRow label="Additional price" value={formatPesoAmount(additional)} /><SummaryRow label="Updated estimated stay total" value={formatPesoAmount(updatedTotal)} strong /><SummaryRow label="Payment method" value="Charge to room at checkout" /></div><Notice title="Extension policy">Extensions are subject to room availability and the hotel&rsquo;s current nightly rate. Confirming adds the additional amount to your room charges.</Notice><Button className="guest-button guest-button--primary" type="button" onClick={() => go('extend-stay-review')}>Review extension<ArrowRight /></Button></ScreenIntro>;
      }

      case 'extend-stay-review': {
        const nights = Math.max(1, countNightsBetween(contextBooking.checkOut, extensionDate));
        const additional = nights * 5000;
        return <ScreenIntro title="Confirm your new checkout" text="Check the original and updated stay dates before confirming."><div className="guest-summary"><SummaryRow label="Original stay" value={`${contextBooking.checkIn} – ${contextBooking.checkOut}`} /><SummaryRow label="Updated stay" value={`${contextBooking.checkIn} – ${extensionDate}`} /><SummaryRow label="Additional nights" value={`${nights}`} /><SummaryRow label="Additional price" value={formatPesoAmount(additional)} strong /><SummaryRow label="Payment method" value="Charge to room at checkout" /></div><Notice title="Room 512 remains available">You will stay in the same room for the extension.</Notice><Button className="guest-button guest-button--primary" type="button" onClick={() => { if (!online) { setBookingBlockedReason('offline'); go('booking-blocked'); return; } if (!canUseOnPropertyServices(contextBooking)) { setBookingBlockedReason(blockedReasonFor(contextBooking)); go('booking-blocked'); return; } const extensionCharge: InAppBookingCharge = { id: `stay-extension-${contextBooking.id}-${extensionDate}`, title: 'Stay extension', detail: `${nights} additional ${nights === 1 ? 'night' : 'nights'}`, amount: formatPesoAmount(additional), date: PROTOTYPE_TODAY }; setSession((current) => ({ ...current, bookings: current.bookings.map((booking) => booking.id === contextBooking.id ? addInAppBookingCharge({ ...booking, checkOut: extensionDate }, extensionCharge) : booking), folioTotal: formatPesoAmount(parsePesoAmount(current.folioTotal) + additional) })); go('extend-stay-success'); }}>Confirm extension<ArrowRight /></Button><TextButton onClick={() => go('extend-stay')}>Change date</TextButton></ScreenIntro>;
      }

      case 'extend-stay-success':
        {
          const extensionCharge = contextBooking.inAppCharges?.find((charge) => charge.id === `stay-extension-${contextBooking.id}-${extensionDate}`);
          return <ScreenIntro icon={<CheckCircle size={30} />} title="Stay extended" text={`Your stay now ends on ${extensionDate} at 12:00 PM. Your updated checkout date is reflected throughout the app.`}><PointsEarned points={extensionCharge ? Math.floor(parsePesoAmount(extensionCharge.amount) / 100) * 50 : 0} badges={[]} /><Notice title="Same room confirmed">Room {contextBooking.roomNumber} remains yours through the new checkout date.</Notice>{primary('Back to My Stay', 'my-stay')}</ScreenIntro>;
        }

      case 'room-upgrade-confirmation': {
        const upgrade = ROOM_UPGRADES.find((item) => item.id === selectedUpgradeId) ?? ROOM_UPGRADES[0];
        return <ScreenIntro icon={<Bed size={30} />} title="Confirm your room change" text="Your additional room cost will be added to your hotel folio and settled at checkout."><div className="guest-summary"><SummaryRow label="Current room" value={`${contextBooking.roomType} · Room ${contextBooking.roomNumber ?? '—'}`} /><SummaryRow label="Selected upgrade" value={`${upgrade.name} · Room ${upgrade.roomNumber}`} /><SummaryRow label="Additional cost" value={upgrade.price} strong /><SummaryRow label="Transfer" value={upgrade.transfer} /><SummaryRow label="Payment method" value="Charge to room at checkout" /></div><Button className="guest-button guest-button--primary" type="button" onClick={() => { if (!online) { setBookingBlockedReason('offline'); go('booking-blocked'); return; } if (!canUseOnPropertyServices(contextBooking)) { setBookingBlockedReason(blockedReasonFor(contextBooking)); go('booking-blocked'); return; } setSession((current) => applyRoomUpgrade(current, contextBooking.id, upgrade)); window.setTimeout(() => setSession((current) => ({ ...current, bookings: current.bookings.map((booking) => booking.id === contextBooking.id && booking.roomUpgrade ? { ...booking, roomUpgrade: { ...booking.roomUpgrade, status: 'ready' } } : booking) })), 2500); go('room-upgrade-success'); }}>Confirm upgrade<ArrowRight /></Button><TextButton onClick={() => go('room-upgrades')}>Choose another room</TextButton></ScreenIntro>;
      }

      case 'room-upgrade-success': {
        const upgrade = ROOM_UPGRADES.find((item) => item.id === selectedUpgradeId) ?? ROOM_UPGRADES[0];
        return <ScreenIntro icon={<CheckCircle size={30} />} title="Upgrade confirmed" text={`Your ${upgrade.name} is being prepared. You can keep using Room ${contextBooking.roomNumber} until the transfer is ready.`}><div className="guest-summary"><SummaryRow label="Current room" value={`${contextBooking.roomType} · Room ${contextBooking.roomNumber}`} /><SummaryRow label="New room" value={`${upgrade.name} · Room number coming soon`} /><SummaryRow label="Additional cost" value={upgrade.price} strong /></div><PointsEarned points={Math.floor(parsePesoAmount(upgrade.price) / 100) * 50} badges={[]} /><Notice title="Your current room stays active">Room {contextBooking.roomNumber} remains available while the hotel prepares your upgrade.</Notice>{primary('Back to home', 'stay-overview')}</ScreenIntro>;
      }

      case 'room-transfer-details': {
        const upgrade = contextBooking.roomUpgrade;
        if (!upgrade) return primary('View my stay', 'my-stay');
        return <ScreenIntro icon={<Bed size={30} />} title="Complete your room transfer" text="Both rooms remain available until you confirm the move."><div className="guest-summary"><SummaryRow label="Current room" value={`${contextBooking.roomType} · Room ${contextBooking.roomNumber}`} /><SummaryRow label="New room" value={`${upgrade.newRoomType} · Room ${upgrade.newRoomNumber}`} /><SummaryRow label="Transfer deadline" value={upgrade.transferDeadline} /><SummaryRow label="Transfer time" value={upgrade.transferTime} /></div><Notice title="Moving your belongings">Pack your belongings and contact the front desk if you need help transferring your bags.</Notice><Notice title="Keys">Collect or activate the new key at the front desk, then return your Room {contextBooking.roomNumber} key there.</Notice><button className="guest-list-row" type="button" onClick={() => go('chat')}><span><ChatCircleDots /></span><div><b>Contact the front desk</b><small>Chat with the hotel team about your transfer</small></div><CaretRight /></button><Button className="guest-button guest-button--primary" type="button" onClick={() => { setSession((current) => ({ ...current, bookings: current.bookings.map((booking) => booking.id === contextBooking.id && booking.roomUpgrade ? { ...booking, roomType: booking.roomUpgrade.newRoomType, roomNumber: booking.roomUpgrade.newRoomNumber, roomUpgrade: undefined } : booking) })); go('stay-overview'); }}>Confirm room transfer<ArrowRight /></Button></ScreenIntro>;
      }

      case 'rate-detail': {
        /*
          Booking detail owns the reservation and prepaid rate. Additional
          hotel charges belong to My Stay, where the guest can review the folio
          and what settles at checkout.
        */
        const bookingGuests = listBookingGuests(displayBooking, session);
        return (
          <ScreenIntro eyebrow={`Booking ${displayBooking.id}`} title="Room and rate" text="The latest details returned by the hotel system.">
            <StayCard booking={displayBooking} />
            <RoomExtensionCard booking={displayBooking} onExtend={openExtensionChat} />

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
              <SectionHeading
                title="Guests"
                action={describeStayStatus(displayBooking).status === 'checked-out' ? undefined : 'Edit'}
                onAction={() => go('additional-guests')}
              />
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
              onClick={() => completePreArrival(true)}
            >
              Request early check-in<ArrowRight aria-hidden="true" />
            </Button>
            <TextButton onClick={() => completePreArrival(false)}>Keep standard 3:00 PM</TextButton>
          </ScreenIntro>
        );

      case 'arrival-handoff':
        return <ScreenIntro title="You’re ready for arrival" text="Continue to the hotel handoff. Your room and on-property charges are settled with the hotel at checkout.">{primary('Continue to arrival', 'prereg-complete')}</ScreenIntro>;

      case 'prereg-complete': {
        const arrived = contextBooking.status === 'active';
        return <ScreenIntro icon={<Check size={30} />} title="You’re ready for arrival" text={arrived ? 'Stop by the front desk. A team member will verify your identity and complete check-in.' : 'Your pre-arrival details are saved. Review your stay before you arrive.'}><div className="guest-timeline"><TimelineItem title="Before arrival" text="Details received by the hotel" done /><TimelineItem title="At the front desk" text="Present your original ID" /><TimelineItem title="After verification" text={`${contextRoom} becomes active in the app`} /></div>{primary('View my stay', 'stay-overview')}<TextButton onClick={() => go('stay-overview')}>View stay overview</TextButton></ScreenIntro>;
      }

      case 'prereg-queued':
        return <ScreenIntro icon={<WifiSlash size={30} />} eyebrow="Saved on this device" title="Ready to send when connected" text="Your pre-registration is safely queued. It will send automatically when a connection returns."><Notice tone="offline" title="No action needed">Your edits remain on this device. The hotel has not received them yet.</Notice>{primary('Open cached stay', 'stay-overview')}</ScreenIntro>;

      case 'scan-room-code':
        return (
          <RoomScanner
            roomNumber={primaryBooking?.roomNumber}
            onDetected={scanRoomCode}
            onCancel={back}
            autoDetectMs={autoDetectScans ? SCAN_DETECT_MS : null}
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

      case 'pre-arrival-services':
        return renderArrivalServices();

      case 'marketplace': {
        /*
          The full catalogue stays behind the room scan. Keep this guard for
          direct or stale routes too; the normal Explore tab shows the arrival
          roster with the scan action until verification succeeds.
        */
        if (bookingSlot.locked) {
          return renderArrivalServices();
        }

        const openStory = openExploreStoryId
          ? EXPLORE_STORIES.find((story) => story.id === openExploreStoryId)
          : undefined;

        if (openStory) {
          return exploreIntroPlaying ? (
            <StoryViewer
              story={openStory}
              onClose={closeExploreStory}
              onBook={bookExploreStory}
              onFinished={closeExploreStory}
            />
          ) : (
            <SwipeStoryViewer
              stories={EXPLORE_STORIES}
              initialStoryId={openStory.id}
              onClose={closeExploreStory}
              onBook={bookExploreStory}
            />
          );
        }

        return (
          <DiscoverFeed
            property={contextBooking.property}
            stories={EXPLORE_STORIES}
            categories={EXPLORE_CATEGORIES}
            searchIndex={EXPLORE_SEARCH_INDEX}
            onOpenStory={openExploreStory}
            onOpenItem={openExploreItem}
            onOpenCategory={(categoryId) => {
              if (categoryId === 'gifts-souvenirs') {
                go('gifts-souvenirs');
                return;
              }
              setSelectedCategory(categoryId as MiniAppCategoryId);
              go('category-listing');
            }}
            onBrowseAll={() => {
              setSelectedCategory('services');
              go('category-listing');
            }}
            deck={<SwipeDeck items={EXPLORE_DECK} onOpen={openExploreItem} />}
          />
        );
      }

      case 'category-listing': {
        const categoryData = MINI_APP_CATEGORIES.find((cat) => cat.id === selectedCategory) ?? MINI_APP_CATEGORIES[0];
        const categoryServices = stayServices.filter((s) => s.categoryId === selectedCategory);
        const options = listingSubcategories(selectedCategory, selectedCategory === 'dining' ? stayVenues : categoryServices);
        const selectedSubcategory = options.includes(exploreSubcategory) ? exploreSubcategory : 'All';
        const matchesSubcategory = (row: { id: string }) => matchesListingSubcategory(selectedCategory, selectedSubcategory, row);
        const visibleVenues = stayVenues.filter(matchesSubcategory);
        const visibleServices = categoryServices.filter(matchesSubcategory);
        const categoryDescription: Record<MiniAppCategoryId, string> = { dining: 'Explore food and drink options at the hotel and nearby.', spa: 'Explore wellness options at the hotel and nearby.', entertainment: 'Explore activities and tours at the hotel and nearby.', services: 'Explore hotel services and independent options nearby.' };
        const nearbyDescription: Record<MiniAppCategoryId, string> = { dining: 'Independent places to eat and drink near the hotel.', spa: 'Independent spas and wellness centers near the hotel.', entertainment: 'Nearby activities and independently operated tours.', services: 'Independent services available near the hotel.' };
        return (
          <div className="guest-stack guest-category-listing">
            <div className="guest-page-title">
              <h1>{selectedCategory === 'dining' ? 'Food & Drinks' : categoryData.title}</h1>
              <p>{categoryDescription[selectedCategory]}</p>
            </div>
            {!online ? <Notice tone="offline" icon={<WifiSlash />} title="Browsing saved offerings">Live availability and booking require a connection.</Notice> : null}

            <div className="guest-scroll-row guest-explore-subcategories" aria-label="Explore subcategories">
              {options.map((option) => <button key={option} type="button" className={selectedSubcategory === option ? 'is-active' : ''} onClick={() => setExploreSubcategory(option)}>{option}</button>)}
            </div>

            {selectedCategory === 'dining' ? (
              <>
              <SectionHeading title="At the hotel" />
              <p className="guest-catalog-section-description">Dining available at The Henry Hotel Manila.</p>
              {visibleVenues.length ? (
              <div className="guest-food-restaurant-list guest-catalog-option-list">
                {visibleVenues.map((res) => (
                  <button
                    key={res.id}
                    className="guest-catalog-option-card"
                    type="button"
                    onClick={() => {
                      setSelectedRestaurantId(res.id);
                      go('restaurant-menu');
                    }}
                  >
                    <div className="guest-catalog-option-card__media">
                      <ServiceImage imageKey={getServiceImageKey({ id: res.id, categoryId: 'dining' })} itemId={res.id} categoryId="dining" variant="card" tone={res.tone} icon={<ForkKnife />} decorative />
                      <h2 className="guest-catalog-option-card__name">{res.name}</h2>
                    </div>
                    <div className="guest-catalog-option-card__details">
                      <p>{res.category}</p>
                      <small>{res.hours}</small>
                      <small>{res.location}</small>
                    </div>
                  </button>
                ))}
              </div>
              ) : (
                <Notice title={`Nothing under ${selectedSubcategory} at the hotel`}>
                  <TextButton onClick={() => setExploreSubcategory('All')}>{`See all ${stayVenues.length} venues`}</TextButton>
                </Notice>
              )}
              <NearbyRecommendations
                categoryId={selectedCategory}
                city={contextBooking.city}
                description={nearbyDescription[selectedCategory]}
                onViewAll={() => go('nearby-recommendations')}
                onSelect={(id) => { setSelectedNearbyEstablishmentId(id); go('nearby-establishment'); }}
              />
              </>
            ) : (
              <>
              <SectionHeading title="At the hotel" />
              <p className="guest-catalog-section-description">{categoryData.title} available at The Henry Hotel Manila.</p>
              {visibleServices.length ? (
              <div className="guest-stack guest-catalog-option-list" style={{ gap: '16px' }}>
                {visibleServices.map((service) => (
                  <button
                    key={service.id}
                    className="guest-catalog-option-card"
                    type="button"
                    onClick={() => {
                      /*
                        The Hilom massage is the one service with a detail
                        page of its own; everything else books itself. The
                        body scrub used to open the massage's page too.
                      */
                      if (service.id === 'spa') {
                        setSelectedServiceId('spa');
                        go('vendor-service');
                      } else {
                        openServiceBooking(service.id);
                      }
                    }}
                  >
                    <div className="guest-catalog-option-card__media">
                      <ServiceImage imageKey={getServiceImageKey(service)} itemId={service.id} categoryId={service.categoryId} variant="card" tone={service.tone} icon={service.categoryId === 'spa' ? <Sparkle /> : service.categoryId === 'entertainment' ? <Compass /> : <Storefront />} decorative />
                      <h2 className="guest-catalog-option-card__name">{service.name}</h2>
                    </div>
                    <div className="guest-catalog-option-card__details">
                      <p>{service.category}</p>
                      <small>{service.cutoff}</small>
                      <small>{service.operator}</small>
                    </div>
                  </button>
                ))}
              </div>
              ) : (
                <Notice title={`Nothing under ${selectedSubcategory} at the hotel`}>
                  <TextButton onClick={() => setExploreSubcategory('All')}>{`See all ${categoryServices.length} services`}</TextButton>
                </Notice>
              )}
              <NearbyRecommendations
                categoryId={selectedCategory}
                city={contextBooking.city}
                description={nearbyDescription[selectedCategory]}
                onViewAll={() => go('nearby-recommendations')}
                onSelect={(id) => { setSelectedNearbyEstablishmentId(id); go('nearby-establishment'); }}
              />
              </>
            )}
          </div>
        );
      }

      case 'gifts-souvenirs':
        return <EstablishmentChatScreen kind="gift" booking={contextBooking} online={online} onChat={(message) => { setChatDraft(message); go('chat'); }} />;

      case 'gift-order-cart':
        return <GiftOrderCartScreen fulfillment={giftFulfillment} onFulfillmentChange={setGiftFulfillment} cart={giftCart} onChangeQuantity={changeGiftQuantity} onConfirm={confirmGiftOrder} onBack={() => go('gifts-souvenirs')} booking={contextBooking} payment={checkoutPayment} paymentMethod={paymentMethod} onPaymentChange={setCheckoutPayment} onPaymentMethodChange={setPaymentMethod} />;

      case 'gift-order-confirmation':
        return <ScreenIntro icon={<CheckCircle size={30} />} eyebrow={giftOrder?.paymentStatus === 'paid' ? 'Order confirmed · paid' : 'Order confirmed · charged to room'} title="Your gifts are confirmed" text={giftOrder?.paymentStatus === 'paid' ? 'Payment was successful and your receipt is available in this order.' : 'Your hotel shop order has been added to your room charges.'}><div className="guest-summary"><SummaryRow label="Provider" value="Operated by the hotel" /><SummaryRow label="Items" value={`${giftOrder?.items.length ?? 0}`} /><SummaryRow label={giftOrder?.paymentStatus === 'paid' ? 'Paid' : 'Added to room charges'} value={giftOrder ? formatPesoAmount(giftOrder.total) : '₱0'} strong /><SummaryRow label="Fulfillment" value={giftFulfillment === 'room' ? `Deliver to ${contextRoom}` : 'Pick up at the lobby'} /></div><PointsEarned points={giftOrder ? Math.floor(giftOrder.total / 100) * 50 : 0} badges={[]} /><Notice title={giftOrder?.paymentStatus === 'paid' ? 'Payment successful' : 'Pay at checkout'}>{giftOrder?.paymentStatus === 'paid' ? `Paid with ${giftOrder.paymentMethod === 'gcash' ? 'GCash' : giftOrder.paymentMethod === 'maya' ? 'Maya' : 'Card'}.` : 'This order is now part of your personal room tab. No payment is due now.'}</Notice>{giftOrder?.paymentStatus === 'charged-to-room' ? primary('View room charges', 'folio') : null}<TextButton onClick={() => go('gifts-souvenirs')}>Shop more gifts</TextButton></ScreenIntro>;

      case 'nearby-recommendations':
        return <NearbyRecommendationsPage categoryId={selectedCategory} city={contextBooking.city} property={contextBooking.property} onSelect={(id) => { setSelectedNearbyEstablishmentId(id); go('nearby-establishment'); }} />;

      case 'nearby-establishment': {
        const establishment = NEARBY_ESTABLISHMENTS.find((item) => item.id === selectedNearbyEstablishmentId) ?? NEARBY_ESTABLISHMENTS[0];
        return establishment ? (
          <NearbyEstablishmentScreen
            establishment={establishment}
            onBack={back}
            onNotifications={() => go('notifications')}
            onBookRide={() => openRideRequest({ from: contextBooking.property, to: establishment.name, toDetail: establishment.address })}
          />
        ) : null;
      }

      case 'restaurant-menu': {
        const venue = RESTAURANTS.find((r) => r.id === selectedRestaurantId) ?? RESTAURANTS[0];
        return <RestaurantMenuScreen venue={venue} onOrder={() => openRestaurantChat(venue)} onBack={() => go('category-listing')} onNotifications={() => go('notifications')} />;
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
            <p className="guest-provider-label">Operated by the hotel</p>
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
            <PaymentChoice allowPayNow={false} provider="Operated by the hotel" roomNumber={contextBooking.roomNumber} value={checkoutPayment} method={paymentMethod} onChange={setCheckoutPayment} onMethodChange={setPaymentMethod} />
            <Notice title="Nothing is charged yet">Your room folio changes only after you review and place this order.</Notice>
            <Button className="guest-button guest-button--primary guest-order-submit" type="button" disabled={cartSummary.itemCount === 0 || checkoutPayment !== 'room'} onClick={confirmDiningOrder}>{checkoutPayment === 'room' ? `Charge ${cartSummary.formattedTotal} to room` : 'Choose Charge to Room'}<ArrowRight aria-hidden="true" /></Button>
            <TextButton onClick={() => go('restaurant-menu')}>Add more from {venue.name}</TextButton>
          </div>
        );
      }

      case 'dining-order-confirmation': {
        const order = session.serviceBookings.find((service) => service.diningOrder && service.bookingId === contextBooking.id);
        const paidNow = order?.paymentStatus === 'paid';
        return (
          <ScreenIntro
            icon={<CheckCircle size={30} />}
            eyebrow={paidNow ? 'Order confirmed · paid' : 'Order confirmed · charged to room'}
            title={order?.diningOrder?.fulfillment.method === 'pickup' ? 'Your order is confirmed' : 'Your order is on its way'}
            text={order?.scheduledFor ?? 'The establishment has received your order.'}
          >
            <div className="guest-summary">
              <SummaryRow label="Establishment" value={order?.diningOrder?.venueName ?? 'Food & Drink'} />
              <SummaryRow label="Provider" value={order?.provider ?? 'Operated by the hotel'} />
              <SummaryRow label="Items" value={`${order?.diningOrder?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0}`} />
              <SummaryRow label={paidNow ? 'Paid' : 'Added to room charges'} value={order?.amount ?? '₱0'} strong />
            </div>
            <PointsEarned points={order ? Math.floor(parsePesoAmount(order.amount) / 100) * 50 : 0} badges={[]} />
            <Notice title={paidNow ? 'Payment successful' : 'Pay at checkout'}>{paidNow ? 'Your receipt is available in this order.' : 'This order is now part of your personal room tab. No payment is due now.'}</Notice>
            {!paidNow ? primary('View room charges', 'folio') : null}
            <TextButton onClick={() => go('category-listing')}>Order from another establishment</TextButton>
          </ScreenIntro>
        );
      }

      case 'transfer-booking': {
        const ride = rideEnds();
        const pickUp = ride.to === contextBooking.property;
        return (
          <div className="guest-stack guest-ride-request-page">
            <div className="guest-page-title">
              <p className="guest-eyebrow">{contextBooking.property}</p>
              <h1>Book a ride</h1>
              <p>{pickUp ? `The hotel meets you at ${ride.from} and brings you to ${contextBooking.property}.` : `Request a hotel-arranged ride from ${ride.from} to ${ride.to}.`}</p>
            </div>
            <form className="guest-form" onSubmit={(event: FormEvent<HTMLFormElement>) => { event.preventDefault(); openRideRequestChat(); }}>
              <section className="guest-ride-summary" aria-label="Trip summary">
                <div><small>From</small><strong>{ride.from}</strong></div>
                <div><small>To</small><strong>{ride.to}</strong>{transferDestinationAddress ? <span>{transferDestinationAddress}</span> : null}</div>
              </section>
              <fieldset className="guest-ride-choice">
                <legend>When would you like to leave?</legend>
                <div className="guest-ride-choice__segmented">
                  <button type="button" className={rideWhen === 'now' ? 'is-active' : ''} onClick={() => setRideWhen('now')}>Now</button>
                  <button type="button" className={rideWhen === 'later' ? 'is-active' : ''} onClick={() => setRideWhen('later')}>Schedule for later</button>
                </div>
              </fieldset>
              {rideWhen === 'later' ? (
                <div className="guest-field-stack guest-ride-schedule">
                  <ExpandableField
                    label="Date"
                    value={rideDate ? formatServiceDay(rideDate).short : 'Choose a day'}
                    aside="Next 60 days"
                    open={openFormField === 'ride-date'}
                    onToggle={() => setOpenFormField((field) => field === 'ride-date' ? null : 'ride-date')}
                  >
                    <CalendarPicker available={daysFrom(PROTOTYPE_TODAY, 60)} value={rideDate} labelFor={(day) => formatServiceDay(day).long} onChange={(day) => { setRideDate(day); setOpenFormField('ride-time'); }} />
                  </ExpandableField>
                  <ExpandableField
                    label="Time"
                    value={clockLabel(rideTime)}
                    open={openFormField === 'ride-time'}
                    onToggle={() => setOpenFormField((field) => field === 'ride-time' ? null : 'ride-time')}
                  >
                    <TimeWheel times={RIDE_TIMES.map(clockLabel)} value={clockLabel(rideTime)} onChange={(label) => setRideTime(RIDE_TIMES.find((time) => clockLabel(time) === label) ?? rideTime)} />
                  </ExpandableField>
                </div>
              ) : null}
              <StepperField label="Passengers" unit="passenger" value={ridePassengers} min={1} max={8} onChange={setRidePassengers} />
              <Button className="guest-button guest-button--primary" type="submit">Request a ride<ArrowRight aria-hidden="true" /></Button>
            </form>
          </div>
        );
      }

      case 'transfer-confirmation':
        {
          const transferPaidNow = transferBooking?.paymentStatus === 'paid';
          const transferAmount = transferBooking?.vehicle === 'Private van'
            ? 1800
            : transferBooking?.vehicle === 'Hotel SUV'
              ? 1500
              : 1200;
        return (
          <ScreenIntro
            icon={<Car size={30} />}
            title="Your hotel transfer is booked"
            text="The hotel is arranging your pick-up. Your confirmed fare and request have been sent to the hotel team."
          >
            <div className="guest-summary">
              <SummaryRow label="Pick-up" value={transferBooking?.pickupLocation || 'Your arrival location'} />
              {transferBooking?.destination ? <SummaryRow label="Destination" value={transferBooking.destination} /> : null}
              <SummaryRow label="Arrival" value={`${transferBooking?.arrivalDate || contextBooking.checkIn} · ${transferBooking?.arrivalTime || '10:00'}`} />
              <SummaryRow label="Passengers" value={transferBooking?.passengers || String(contextBooking.guestCount)} />
              <SummaryRow label="Vehicle" value={transferBooking?.vehicle || 'Executive van'} />
              <SummaryRow label="Provider" value="Operated by the hotel" />
              <SummaryRow label={transferPaidNow ? 'Payment status' : 'Charged to'} value={transferPaidNow ? 'Paid' : contextRoom} />
              <SummaryRow label="Fare" value={transferBooking ? (transferBooking.vehicle === 'Private van' ? '₱1,800' : transferBooking.vehicle === 'Hotel SUV' ? '₱1,500' : '₱1,200') : '₱1,200'} strong />
            </div>
            <PointsEarned points={Math.floor(transferAmount / 100) * 50} badges={[]} />
            <Notice title={transferPaidNow ? 'Payment successful' : `Added to ${contextRoom.toLowerCase()}`}>{transferPaidNow ? 'Your receipt is available in this booking.' : 'This hotel transfer is included in Additional charges and settles with your hotel folio at checkout.'}</Notice>
            <Notice icon={<Car />} title="Driver details coming soon">The hotel will add your driver’s name, contact details, and vehicle plate here once they assign the transfer.</Notice>
            <Notice title="Operated by the hotel">Your transfer is coordinated directly by {contextBooking.property}.</Notice>
            {primary('View my stay', 'rate-detail')}
          </ScreenIntro>
        );
        }

      case 'hotel-service':
        return <ServiceDetail kind="hotel" booking={contextBooking} online={online} onBook={() => openServiceBooking('dining')} onChat={() => go('chat')} />;

      case 'vendor-service':
        return <ServiceDetail kind="vendor" booking={contextBooking} online={online} onBook={() => openServiceBooking('spa')} onChat={() => go('chat')} />;

      case 'service-booking': {
        const days = bookableServiceDays(contextBooking);
        const day = serviceDate && days.includes(serviceDate) ? serviceDate : days[0];
        const provider = describeServiceProvider(selectedService);
        const ready = servicePayment === 'complimentary'
          || checkoutPayment === 'room'
          || (checkoutPayment === 'pay-now' && Boolean(paymentMethod));
        const submitLabel = servicePayment === 'complimentary'
          ? `Book ${selectedService.name}`
          : !ready
            ? 'Choose how to pay'
            : checkoutPayment === 'room' ? `Charge ${serviceCharge} to room` : `Pay ${serviceCharge}`;
        return (
          <FormScreen step="Review and pay" title="Choose a time" text={`Live availability is shown for ${selectedService.name} at ${contextBooking.property}.`}>
            <div className="guest-field-stack">
              <ExpandableField
                label="Date"
                value={day ? formatServiceDay(day).short : 'Choose a day'}
                aside={`${days.length}-day window`}
                open={openServiceField === 'date'}
                onToggle={() => setOpenServiceField((field) => field === 'date' ? null : 'date')}
              >
                <CalendarPicker
                  available={days}
                  value={day ?? ''}
                  labelFor={(option) => formatServiceDay(option).long}
                  onChange={(option) => { setServiceDate(option); setOpenServiceField(null); }}
                />
              </ExpandableField>
              <ExpandableField
                label="Time"
                value={serviceTime}
                open={openServiceField === 'time'}
                onToggle={() => setOpenServiceField((field) => field === 'time' ? null : 'time')}
              >
                <TimeWheel times={SERVICE_TIMES} value={serviceTime} onChange={setServiceTime} />
              </ExpandableField>
              <StepperField label="Guests" unit="guest" value={servicePartySize} min={1} max={Math.max(2, contextBooking.guestCount)} onChange={setServicePartySize} />
            </div>
            <div className="guest-summary">
              <SummaryRow label="Category" value={selectedService.category} />
              <SummaryRow label="Service" value={selectedService.name} />
              <SummaryRow label="Provider" value={provider} />
              <SummaryRow label="Total" value={servicePayment === 'complimentary' ? 'Complimentary' : serviceCharge} strong />
            </div>
            {servicePayment === 'complimentary' ? null : (
              <>
                <PointsApply balance={pointsBalance(session)} amount={formatPesoAmount(servicePrice)} applied={appliedPoints} onChange={setAppliedPoints} />
                {/*
                  The guest's choice either way: on the room, settled at
                  checkout, or paid now. Before a room is assigned the charge
                  still lands on the stay's bill, so the option says that
                  rather than naming a room.
                */}
                <PaymentChoice
                  allowRoom
                  provider={provider}
                  roomNumber={contextBooking.roomNumber}
                  value={checkoutPayment}
                  method={paymentMethod}
                  onChange={setCheckoutPayment}
                  onMethodChange={setPaymentMethod}
                />
              </>
            )}
            <Button className="guest-button guest-button--primary" type="button" disabled={!ready} onClick={confirmService}>{submitLabel}<ArrowRight aria-hidden="true" /></Button>
          </FormScreen>
        );
      }

      case 'booking-confirmation': {
        const booked = session.serviceBookings.find((service) => service.id === lastServiceBookingId) ?? contextService;
        const bookedService = SERVICES.find((service) => service.id === booked?.serviceId) ?? selectedService;
        const paidBy = booked ? describeServicePaidBy(booked) : 'room';
        const methodLabel = booked?.paymentMethod === 'gcash' ? 'GCash' : booked?.paymentMethod === 'maya' ? 'Maya' : 'card';
        const slot = booked?.scheduledFor ?? `${formatServiceDay(PROTOTYPE_TODAY).long} · ${serviceTime}`;
        const time = slot.match(/\d{1,2}:\d{2}\s*[AP]M/i)?.[0] ?? serviceTime;
        const guests = booked?.partySize ?? 1;
        return (
          <ScreenIntro
            icon={<Check size={30} />}
            title={`${booked?.title ?? bookedService.name} is booked`}
            text={paidBy === 'card'
              ? `Paid with ${methodLabel}, direct to the hotel. Your receipt is in My Stay.`
              : paidBy === 'complimentary'
                ? 'Complimentary, so there is nothing to pay. It is on your stay in My Stay.'
                : `The charge has been added to ${contextRoom.toLowerCase()} and settles with your hotel folio at checkout.`}
          >
            <div className="guest-ticket"><div><small>{slot}</small><h2>{time}</h2><p>{booked?.title ?? bookedService.name} · {guests} {guests === 1 ? 'guest' : 'guests'}</p></div><Tag>Confirmed</Tag></div>
            <div className="guest-summary">
              <SummaryRow label="Provider" value={booked?.provider ?? describeServiceProvider(bookedService)} />
              <SummaryRow label={paidBy === 'card' ? 'Payment status' : 'Payment method'} value={paidBy === 'card' ? `Paid · ${methodLabel}` : paidBy === 'complimentary' ? 'Complimentary' : 'Charged to room'} />
            </div>
            <PointsEarned points={booked ? Math.floor(parsePesoAmount(booked.amount) / 100) * 50 : 0} badges={badgeProgress(session).filter((row) => justEarned.includes(row.definition.id))} />
            <Notice title="Cancellation cutoff">{booked ? describeCancellationWindow(cutoffFor(booked), booked) : 'Changes to this booking go through the front desk. The booking remains.'}</Notice>
            {primary('View my stay', 'my-stay')}
            {/* Back to the catalogue this guest can use: arrival services before the stay, Explore during it. */}
            <TextButton onClick={() => go(bookingSlot.screen)}>Book another service</TextButton>
          </ScreenIntro>
        );
      }

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

        if (bookingBlockedReason === 'scanned-early') {
          return (
            <ScreenIntro
              icon={<ClockCountdown size={30} />}
              eyebrow={contextBooking.property}
              title="Scan again when you arrive"
              text={`The code confirms you are in the room, so it opens your stay from ${formatStayDateRange(contextBooking).split('–')[0]}. Until then, arrival services are ready to book.`}
            >
              <Notice title="Nothing has changed yet">Dining, spa and charging to your room open once you scan in during your stay.</Notice>
              {primary('Arrange your arrival', 'pre-arrival-services')}
              <TextButton onClick={() => go('chat')}>Message the front desk</TextButton>
            </ScreenIntro>
          );
        }

        if (bookingBlockedReason === 'checked-out') {
          return (
            <ScreenIntro
              icon={<CheckCircle size={30} />}
              title="This stay is settled"
              text={`Your stay at ${contextBooking.property} ended ${formatStayDateRange(contextBooking).split('–').pop()?.trim()}. On-property services are charged to a room, so they close when you check out.`}
            >
              <Notice title="Nothing was booked">Your receipts stay in My Stay for as long as you want them.</Notice>
              {primary('View stay history', 'stay-history')}
              <TextButton onClick={() => go(bookingSlot.screen)}>Keep browsing</TextButton>
            </ScreenIntro>
          );
        }

        return bookingBlockedReason === 'offline'
          ? <ScreenIntro icon={<WifiSlash size={30} />} title="We can’t hold a time while offline" text="Live services are not queued because the slot or price could change before you reconnect."><Notice tone="offline" title="Nothing was booked">Connect to hotel Wi-Fi and try again. You can still message the front desk; the message will wait on this device.</Notice>{primary('Message the front desk', 'chat')}<TextButton onClick={() => { setOnline(true); back(); }}>Try again</TextButton></ScreenIntro>
          : <ScreenIntro icon={<Clock size={30} />} title="On-property services open when you check in" text={`Your stay at ${contextBooking.property} starts ${formatStayDateRange(contextBooking).split('–')[0]}. Transfers and arrival services you can book now.`}><Notice title="Nothing was booked">On-property services are charged to a room, so they open once you are in it.</Notice>{primary('Arrange your arrival', 'pre-arrival-services')}<TextButton onClick={() => go('chat')}>Message the front desk</TextButton></ScreenIntro>;

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

        const stayStatus = describeStayStatus(contextBooking);
        const checkedOut = stayStatus.status === 'checked-out';
        const checkoutIsDue = contextBooking.checkOut <= PROTOTYPE_TODAY;
        /*
          The same object `stay-detail` renders, built from the live booking
          rather than from `PAST_STAYS` -- a stay that ended this morning has
          not settled into history yet, and the guest still wants the receipt.
        */
        const settledStay = checkedOut ? toFinishedStay(session, contextBooking) : null;

        return (
          <div className="guest-stack guest-my-stay-page">
            {/* Add the room to the status pill only after one is assigned. */}
            {/* Named on its own photograph, as Home and a Places card name a place. */}
            <section className="guest-my-stay-hero">
              <PropertyImage property={contextBooking.property} aspectRatio="1.35" decorative />
              <div className="guest-my-stay-hero__overlay">
                <b className="guest-my-stay-hero__status" data-state={stayStatus.status}>
                  {stayStatus.label}{contextBooking.roomNumber ? ` · Room ${contextBooking.roomNumber}` : ''}
                </b>
                <h1>{contextBooking.property}</h1>
                <small>{formatStayDateRange(contextBooking)}</small>
              </div>
            </section>

            {!online ? <Notice tone="offline" icon={<WifiSlash />} title="Last-known stay details">Reconnect for the latest charges and availability.</Notice> : null}

            <div className="guest-stay-context guest-checkout-card">
              <button type="button" onClick={() => go('rate-detail')}>
                <span className="guest-stay-context__clock" aria-hidden="true"><ClockCountdown /></span>
                {/*
                  The helper, not a hardcoded date. Comparing against
                  '2026-11-12' meant every other stay fell through to a raw
                  ISO date, and a stay before arrival was told when it checks
                  out rather than when it begins.
                */}
                <span className="guest-stay-context__text"><b>{describeCheckoutCountdown(contextBooking)}</b><small>{formatStayDateRange(contextBooking)} · 12:00 PM</small></span>
              </button>
              {!checkedOut && contextBooking.status === 'active' ? <div className="guest-checkout-card__actions">{checkoutIsDue ? <button className="guest-button guest-button--primary" type="button" onClick={() => go('stay-review')}>Check out now</button> : null}<div className="guest-checkout-card__requests"><button type="button" onClick={openLateCheckoutChat}><Clock aria-hidden="true" /><span><b>Request late checkout</b><small>Ask for a later checkout time.</small></span><CaretRight /></button><button type="button" onClick={openExtensionChat}><CalendarPlus aria-hidden="true" /><span><b>Extend your stay</b><small>Ask if your room is available for another night.</small></span><CaretRight /></button></div></div> : null}

              {/* Live-stay folio access belongs with the other stay details. */}
              {started && !checkedOut ? (
                <button className="guest-my-stay-folio-link" type="button" aria-label="Room charges" onClick={() => go('folio')}>
                  <span className="guest-my-stay-folio-link__icon" aria-hidden="true"><GuestNavIcon icon={HugeReceiptTextIcon} /></span>
                  <span className="guest-my-stay-folio-link__copy"><b>Room charges</b><small>View your complete folio</small></span>
                  <HugeiconsIcon icon={HugeChevronRightIcon} size={18} strokeWidth={1.75} aria-hidden="true" focusable="false" />
                </button>
              ) : null}
            </div>

            {/*
              Live stays only. After checkout the folio is a closed ledger, and
              the settled receipt below is its answer -- the live screen would
              say "Due at checkout" directly under "Total settled".
            */}
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

            {/*
              Once the desk closes the stay is over, and asking for the rating
              is the only thing left to do here -- so this is where it is asked,
              not buried behind "Check out now", which a checked-out guest has
              no reason to press again. Asked once: a rating already given is
              reported back rather than re-requested.
            */}
            {checkedOut && !postStayWindow.deskOpen ? (
              stayReview ? (
                <p className="guest-desk-window">
                  <Check aria-hidden="true" />
                  You rated this stay {stayReview.rating} out of 5.
                </p>
              ) : (
                <Button className="guest-button guest-button--secondary" type="button" onClick={() => go('stay-review')}>
                  Rate your stay<ArrowRight aria-hidden="true" />
                </Button>
              )
            ) : null}

            {/*
              A finished stay reads as a receipt, not as a live screen with
              nothing on it. The room line is the point: before this the screen
              could only report what was charged *against* the room, so a stay
              that cost ₱18,600 to sleep in showed a room of nothing.
            */}
            {settledStay ? (
              <section className="guest-settled-summary">
                <SectionHeading title="This stay" />
                <p className="guest-settled-summary__status">Settled at checkout</p>
                <div className="guest-summary">
                  <SummaryRow label={`${settledStay.roomType} · ${settledStay.nights} nights`} value={settledStay.roomRate} />
                  {/*
                    What the money went on, not just what it came to. The room
                    line alone made a stay with a spa day and three dinners read
                    identically to one where nobody left the room. The itemised
                    ledger stays one tap away on the settled stay.
                  */}
                  {summarisePastStay(settledStay).groups.map((group) => (
                    <SummaryRow key={group.category} label={group.category} value={group.formattedTotal} />
                  ))}
                  <SummaryRow label="Total settled" value={settledStay.total} strong />
                </div>
                <Button className="guest-button guest-button--secondary" type="button" onClick={() => { setSelectedPastStayId(contextBooking.id); go('stay-detail'); }}>
                  View settled stay<ArrowRight aria-hidden="true" />
                </Button>
                <TextButton onClick={() => go('book-stay')}>Book another stay</TextButton>
              </section>
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
                    {tab === 'upcoming' ? `Upcoming (${stayEntries.upcoming.length})` : `Past (${stayEntries.past.length})`}
                  </button>
                ))}
              </div>

              {visibleStayEntries.length ? (
                <div className="guest-stay-entries" key={stayTab}>
                  {stayTab === 'upcoming' && visibleStayEntries.length > 1
                      ? Object.entries(visibleStayEntries.reduce<Record<string, StayEntry[]>>((groups, entry) => {
                        (groups[entry.date] ??= []).push(entry);
                        return groups;
                      }, {})).map(([date, entries]) => (
                        <section className="guest-stay-entries__date-group" key={date}>
                          <h2>{new Date(`${date}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</h2>
                          <div className="guest-stay-entries__date-group-cards">{entries.map((entry) => <StayEntryCard key={entry.id} entry={entry} showWhen={false} onOpen={() => { setSelectedStayEntryId(entry.id); go('stay-entry'); }} />)}</div>
                        </section>
                      ))
                    : visibleStayEntries.map((entry) => (
                        <StayEntryCard
                          key={entry.id}
                          entry={entry}
                          onOpen={() => { setSelectedStayEntryId(entry.id); go('stay-entry'); }}
                        />
                      ))}
                </div>
              ) : (
                <div className={`guest-hub-empty${stayTab === 'upcoming' && !started ? ' guest-hub-empty--services' : ''}`}>
                  <h2>{stayTab === 'upcoming' && !started ? 'No upcoming services yet' : stayTab === 'upcoming' ? 'Nothing booked yet' : 'Nothing here yet'}</h2>
                  {/*
                    A stay that is over cannot be sold anything. This block
                    was inviting a checked-out guest to charge to a room they
                    had left, and pointing at an Explore tab their bar no
                    longer carries.
                  */}
                  <p>
                    {stayTab !== 'upcoming'
                      ? 'Bookings move here once they are done or cancelled.'
                      : !started
                        ? 'Services you book for your upcoming stay will appear here.'
                        : checkedOut
                        ? 'Nothing was left open when you checked out.'
                        : `Dining, spa, tours, and hotel services are in Explore. Bookings are added to ${contextRoom.toLowerCase()} and settle at checkout.`}
                  </p>
                  {stayTab === 'upcoming' && !started ? (
                    <Button className="guest-button guest-button--secondary" type="button" onClick={() => go('pre-arrival-services')}>
                      Browse arrival services<ArrowRight aria-hidden="true" />
                    </Button>
                  ) : stayTab === 'upcoming' && !checkedOut ? (
                    <Button className="guest-button guest-button--primary" type="button" onClick={() => go(bookingSlot.screen)}>
                      {bookingSlot.locked ? 'Browse arrival services' : 'Explore on-property'}<ArrowRight aria-hidden="true" />
                    </Button>
                  ) : null}
                </div>
              )}
            </section>

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
              title={entry.status === 'cancelled' ? 'Cancelled' : entry.paidBy === 'card' ? 'Paid up front' : entry.paidBy === 'complimentary' ? 'Complimentary' : 'Charged to your room'}
            >
              {entry.settlement ?? `Added to ${contextRoom.toLowerCase()} and settles with the hotel at checkout.`}
            </Notice>

            {/*
              Cancelling is an action on the booking, reached from the booking
              -- not the thing an ordinary tap does.
            */}
            {entry.canCancel ? (
              <>
                {/*
                  Which screen is decided by this booking's own cutoff. Every
                  cancel used to open the self-service screen, and cancel the
                  Hilom massage whichever booking had been opened.
                */}
                {primary('Change or cancel', canCancelYourself(entry.id) ? 'cancel-before-cutoff' : 'cancel-after-cutoff')}
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
              <div className="guest-page-title"><h1>Notifications</h1></div>
              <div className="guest-hub-empty">
                <h2>You’re all caught up</h2>
                <p>Room updates, booking confirmations and new room charges appear here.</p>
              </div>
            </div>
          );
        }

        return (
          <div className="guest-stack">
            <div className="guest-page-title"><h1>Notifications</h1></div>
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

      case 'cancel-before-cutoff':
      case 'cancel-after-cutoff': {
        const cancellable = cancellableServiceFor(selectedStayEntryId);
        const cutoffHours = cancellationCutoffHours(cutoffFor(cancellable));
        const hoursLeft = Math.max(0, Math.floor(hoursUntilService(cancellable)));
        const paidBy = describeServicePaidBy(cancellable);
        const time = cancellable.scheduledFor.match(/\d{1,2}:\d{2}\s*[AP]M/i)?.[0] ?? '';

        if (activeScreen === 'cancel-after-cutoff') {
          return <ScreenIntro eyebrow={`${hoursLeft} hours before service`} title="Contact the front desk to change this" text={cutoffHours === null ? 'This provider does not take cancellations in the app.' : `The provider’s ${cutoffHours}-hour self-service cutoff has passed. ${paidBy === 'room' ? 'The charge stays on your room folio.' : 'The booking stays as it is.'}`}><Notice tone="warning" title="Front desk help required">Send a message and the team will check what the provider can do.</Notice>{primary('Chat with front desk', 'chat')}<TextButton onClick={() => go('my-stay')}>Keep booking</TextButton><div className="guest-provisional"><b>Provisional decision</b><p>Confirm that third-party providers accept a 24-hour self-service cancellation window.</p></div></ScreenIntro>;
        }

        const cancelService = () => {
          setSession((current) => ({
            ...current,
            serviceBookings: current.serviceBookings.map((service) => (
              service.id === cancellable.id
                ? { ...service, status: 'cancelled', paymentStatus: paidBy === 'card' ? 'refunded' : service.paymentStatus }
                : service
            )),
            // A room charge comes back off the running total; nothing else touched it.
            folioTotal: paidBy === 'room'
              ? formatPesoAmount(Math.max(0, parsePesoAmount(current.folioTotal) - parsePesoAmount(cancellable.amount)))
              : current.folioTotal,
          }));
          go('my-stay');
        };
        const settlement = paidBy === 'card'
          ? { title: 'Your payment is refunded', body: 'It goes back the way you paid. Nothing else changes.' }
          : paidBy === 'complimentary'
            ? { title: 'Nothing to refund', body: 'This one was complimentary.' }
            : { title: 'The folio line will be removed', body: 'This service has not settled. No money moves when you cancel.' };
        return <ScreenIntro eyebrow={`${hoursLeft} hours before service`} title="Cancel this booking?" text={`This is before the provider’s ${cutoffHours ?? 24}-hour cutoff, so you can cancel it yourself.`}><div className="guest-ticket"><div><small>{cancellable.scheduledFor}</small><h2>{time}</h2><p>{cancellable.title} · {cancellable.amount}{paidBy === 'room' ? ` · ${contextRoom}` : ''}</p></div></div><Notice tone="positive" title={settlement.title}>{settlement.body}</Notice><button className="guest-button guest-button--danger" onClick={cancelService} type="button">Cancel service</button><TextButton onClick={() => go('my-stay')}>Keep booking</TextButton><div className="guest-provisional"><b>Provisional decision</b><p>Confirm that third-party providers accept a 24-hour self-service cancellation window.</p></div></ScreenIntro>;
      }

      case 'folio': {
        /*
          The live ledger answers "what is running up against the room", which
          a settled stay no longer has: it would print "Due at checkout" and
          offer points off a bill already paid. Notifications and old links can
          still land here, so the settled receipt is where they go instead.
        */
        if (describeStayStatus(contextBooking).status === 'checked-out') {
          return (
            <ScreenIntro
              icon={<CheckCircle size={30} />}
              eyebrow={contextBooking.property}
              title="This stay is settled"
              text="Room charges were settled at checkout. The receipt lists the room and everything added to it."
            >
              <Button className="guest-button guest-button--primary" type="button" onClick={() => { setSelectedPastStayId(contextBooking.id); go('stay-detail'); }}>
                View settled stay<ArrowRight aria-hidden="true" />
              </Button>
              <TextButton onClick={() => go('my-stay')}>Back to my stay</TextButton>
            </ScreenIntro>
          );
        }
        const folioCharges = getRoomCharges(session, contextBooking, contextRoom);
        const folioTotal = getRoomChargesTotal(session, contextBooking, contextRoom);
        const visibleCharges = folioCharges;
        return <div className="guest-stack guest-folio-page"><div className="guest-page-title"><h1>Room charges</h1><p>Charges added to {contextRoom} during your stay.</p></div>{!online ? <Notice tone="offline" title="Last-known folio">Reconnect for the latest charges.</Notice> : null}<div className="guest-folio-summary"><div><span>Current total</span><small>Due at checkout</small></div><strong>{folioTotal}</strong></div>{pointsBalance(session) >= 1000 ? <button type="button" className="folio-points" onClick={() => go('rewards')}><span><b>{pointsBalance(session).toLocaleString('en-US')} points</b><small>{pointsAsPesos(pointsBalance(session))} off this bill</small></span><CaretRight aria-hidden="true" /></button> : null}<div className="guest-folio-cards">{visibleCharges.map((charge) => { const isExpanded = expandedChargeId === charge.id; const service = session.serviceBookings.find((item) => item.id === charge.id); return <article key={charge.id} className={`guest-folio-card${isExpanded ? ' is-expanded' : ''}`}><button type="button" className="guest-folio-card__header" aria-expanded={isExpanded} onClick={() => setExpandedChargeId(isExpanded ? null : charge.id)}><span><b>{charge.title}</b><small>{charge.detail}</small></span><strong>{charge.amount}</strong><CaretDown className="guest-folio-card__chevron" /></button>{isExpanded ? <RoomChargeDetails charge={charge} service={service} roomLabel={contextRoom} onQuestion={(message) => { setChatDraft(message); go('chat'); }} /> : null}</article>; })}</div><button className="guest-folio-help" type="button" onClick={() => { setChatDraft('I have a question about a room charge. Could you help me review it?'); go('chat'); }}><span><b>Question about a charge?</b><small>Message the front desk</small></span></button></div>;
      }

      case 'chat':
        return renderChatScreen();

      case 'chat-after-hours':
        return renderChatScreen();

      case 'room-qr-midstay':
        return (
          <RoomUnlocked
            roomNumber={contextBooking.roomNumber}
            property={contextBooking.property}
            checkOut={formatCheckoutDate(contextBooking.checkOut)}
            onExplore={openExploreIntro}
            onViewStay={() => go('stay-overview')}
            earned={contextBooking.roomVerification ? BEHAVIOUR_POINTS['room-scan'] : undefined}
          />
        );

      case 'profile':
        return (
          <div className="guest-stack guest-profile-page">
            <div className="guest-page-title guest-profile-intro">
              <p className="guest-profile-kicker">Guest profile</p>
              <h1>{session.guestName || 'Profile'}</h1>
              <p>Recognized across all 13 participating properties.</p>
            </div>
            <section className="guest-profile-card guest-profile-identity" aria-label="Guest identity">
              <div className="guest-profile-identity__top">
                <div className="guest-avatar guest-profile-identity__avatar">
                  {(session.guestName || 'Guest').split(' ').map((part) => part[0]).slice(0, 2).join('')}
                </div>
                <div className="guest-profile-identity__body">
                  <span className="guest-profile-identity__label">Cabana guest</span>
                  <b>{session.email || 'No email on file'}</b>
                  <span>+63 917 555 0142</span>
                </div>
              </div>
              <div className="guest-profile-identity__footer">
                <div className="guest-profile-identity__document">
                  <IdentificationCard className="guest-profile-identity__document-icon" size={19} aria-hidden="true" />
                  <span><b>Passport on file</b><small>Ends 4821</small></span>
                </div>
                <span className="guest-profile-identity__document-status">On file</span>
              </div>
            </section>
            <section className="guest-profile-section" aria-labelledby="guest-profile-account-heading">
              <div className="guest-profile-section__header">
                <div>
                  <h2 id="guest-profile-account-heading">Account</h2>
                </div>
              </div>
              <div className="guest-profile-action-list">
                <button className="guest-list-row guest-profile-action" type="button" onClick={() => go('rewards')}>
                  <span><GuestNavIcon icon={HugeTrophyIcon} /></span>
                  <div>
                    <b>Achievements</b>
                    <small>{earnedBadges(session).length} badges · {pointsBalance(session).toLocaleString('en-US')} points</small>
                  </div>
                  <CaretRight />
                </button>
                <button className="guest-list-row guest-profile-action" type="button" onClick={() => go('stay-history')}>
                  <span><SuitcaseRolling /></span>
                  <div><b>Stay history</b><small>3 stays across 2 properties</small></div>
                  <CaretRight />
                </button>
              </div>
            </section>
            <button className="guest-list-row guest-profile-signout" type="button" aria-label="Sign out" onClick={signOut}>
              <span><SignOut /></span>
              <div><b>Sign out</b><small>Return to the welcome screen</small></div>
              <CaretRight />
            </button>
          </div>
        );

      case 'rewards': {
        /*
          Everything on this screen is derived on the spot. Nothing about what
          a guest has earned is stored, so the balance and the badges cannot
          drift from the stays behind them -- and they follow the prototype's
          stay-state switch instead of surviving it.
        */
        const balance = pointsBalance(session);
        const nearly = nearlyEarnedBadges(session);
        const badges = badgeProgress(session);
        const earned = earnedBadges(session);
        const nextBadge = nearly[0];
        const nextBadgeProgress = nextBadge
          ? Math.min(nextBadge.count / nextBadge.definition.threshold, 1)
          : 1;
        const achievementBackdrop = getPropertyImage('The Henry Manila');
        const openReward = (rewardId: string) => {
          setSelectedRewardId(rewardId);
          go('reward-detail');
        };

        return (
          <div className="guest-stack guest-achievements-page">
            {/*
              A profile header after Places: the guest's own photograph of the
              estate, their initials overlapping it, their name set in the
              serif, and the collection in one line beneath.
            */}
            <section className="guest-profile-hero" aria-labelledby="guest-profile-hero-name">
              <div className="guest-profile-hero__cover">
                <Image
                  className="guest-profile-hero__image"
                  src={achievementBackdrop.src}
                  alt=""
                  fill
                  priority
                  sizes="(max-width: 720px) 100vw, 720px"
                  style={{ objectPosition: achievementBackdrop.focalPoint }}
                />
              </div>
              <span className="guest-profile-hero__avatar" aria-hidden="true">
                {(session.guestName || 'Cabana Guest').split(' ').map((part) => part[0]).slice(0, 2).join('')}
              </span>
              <p className="guest-profile-hero__eyebrow">Your achievements</p>
              <h1 id="guest-profile-hero-name">{session.guestName || 'Cabana guest'}</h1>
              <p className="guest-profile-hero__meta">
                {earned.length} of {badges.length} badges · {balance.toLocaleString('en-US')} points
              </p>
            </section>

            {nextBadge ? (
              <section className="guest-achievements-next" aria-label="Next to unlock">
                <div>
                  <span>Next to unlock</span>
                  <b>{nextBadge.definition.name}</b>
                  <small>{nextBadge.definition.requirement}</small>
                </div>
                <strong>{nextBadge.count} / {nextBadge.definition.threshold}</strong>
                <span className="guest-achievements-next__track" aria-hidden="true">
                  <i style={{ inlineSize: `${nextBadgeProgress * 100}%` }} />
                </span>
              </section>
            ) : null}

            <BadgeShelf
              earned={earned}
              nearly={nearly}
              all={badges}
              onOpenBadge={(badgeId) => {
                setOpenBadgeId(badgeId);
                go('badge-detail');
              }}
            />

            <section className="guest-achievements-points" aria-labelledby="guest-achievements-points-heading">
              <div className="guest-achievements-section-title">
                <div>
                  <span>Cabana points</span>
                  <h2 id="guest-achievements-points-heading">Make your stay go further.</h2>
                </div>
                <strong>{balance.toLocaleString('en-US')} pts</strong>
              </div>

              <PointsWallet
                balance={balance}
                affordable={affordableRewards(balance)}
                nextUp={REWARD_MENU.find((reward) => reward.points > balance)}
                ledger={buildPointsLedger(session)}
                expiry={pointsExpiry(session)}
                nearest={nextBadge}
                onOpenReward={openReward}
              />
            </section>

            <RewardMenu rewards={REWARD_MENU} balance={balance} onOpenReward={openReward} />

            <EstateMap
              visitedCities={[
                ...session.pastStays.map((stay) => stay.city),
                ...session.bookings.map((booking) => booking.city),
              ]}
            />

          </div>
        );
      }

      case 'badge-detail': {
        const badge = badgeProgress(session).find((row) => row.definition.id === openBadgeId);

        if (!badge) {
          return (
            <div className="guest-stack guest-badge-detail guest-badge-detail--empty">
              <div className="guest-badge-detail__header">
                <span aria-hidden="true" />
                <span>Achievement</span>
                <span aria-hidden="true" />
              </div>
              <div className="guest-page-title">
                <h1>Achievement not found</h1>
                <p>Return to your collection to choose another badge.</p>
              </div>
              <button className="guest-button guest-button--primary" type="button" onClick={() => go('rewards')}>
                View achievements
                <ArrowRight aria-hidden="true" />
              </button>
            </div>
          );
        }

        return (
          <BadgeDetail
            row={badge}
            holder={session.guestName}
            /* Muting rewrites the session, so the correction is persisted by
               the same effect that persists everything else. */
            onMute={(badgeId) => {
              setSession((current) => muteBadge(current, badgeId));
              back();
            }}
          />
        );
      }

      case 'reward-detail': {
        const reward = REWARD_MENU.find((entry) => entry.id === selectedRewardId);
        if (!reward) return null;

        return (
          <RewardDetail
            reward={reward}
            balance={pointsBalance(session)}
            /* `redeemReward` returns the session untouched if the balance
               cannot cover it, so a view bug cannot go negative. */
            onRedeem={() => { setSession(redeemReward(session, reward)); go('rewards'); }}
          />
        );
      }

      case 'stay-history': {
        const lifetime = formatPesoAmount(pastStays.reduce((sum, stay) => sum + parsePesoAmount(stay.total), 0));
        const nights = pastStays.reduce((sum, stay) => sum + stay.nights, 0);
        return (
          <div className="guest-stack">
            <div className="guest-page-title">
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
        /*
          Only where there is something to say. Stated on a stay already taken,
          where it cannot be argued with, and never as a prompt before one.
        */
        const wouldHaveEarned = directCounterfactual(stay);
        return (
          <div className="guest-stack">
            <div className="guest-page-title">
              <p className="guest-eyebrow">{formatPastStayDates(stay)} · {stay.nights} {stay.nights === 1 ? 'night' : 'nights'}</p>
              <h1>{stay.property}</h1>
              <p>Room {stay.roomNumber} · {stay.roomType} · {stay.guestCount} {stay.guestCount === 1 ? 'guest' : 'guests'}</p>
            </div>

            <p className="stay-earned">
              This stay earned <b>{earnedForStay(stay).toLocaleString('en-US')} points</b>.
              {wouldHaveEarned ? (
                <>
                  {' '}Booked direct it would have earned{' '}
                  <b>{wouldHaveEarned.toLocaleString('en-US')} points</b> instead of{' '}
                  {Math.floor(parsePesoAmount(stay.roomRate) / 100 * 20).toLocaleString('en-US')} on the room.
                </>
              ) : null}
            </p>

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
        onSimulateRoomAssignment={simulateRoomAssignment}
        canSimulateRoomAssignment={Boolean(eligibleRoomAssignBooking)}
        onSimulateRoomReady={simulateRoomReady}
        canSimulateRoomReady={Boolean(eligibleRoomReadyBooking)}
        roomVerified={Boolean(primaryBooking?.roomVerification)}
        onToggleRoomVerified={toggleRoomVerified}
        canToggleRoomVerified={Boolean(primaryBooking && (primaryBooking.roomVerification || isStayUnderWay(primaryBooking)))}
        hasHistory={pastStays.length > 0}
        onToggleHistory={toggleHistory}
        hasReview={session.reviews.some((review) => review.bookingId === contextBooking.id)}
        onClearReview={clearReview}
        autoDetectScans={autoDetectScans}
        onToggleAutoDetectScans={() => setAutoDetectScans((on) => !on)}
        strictLookup={strictLookup}
        onToggleStrictLookup={() => setStrictLookup((on) => !on)}
        simulatePostStayExpired={simulatePostStayExpired}
        onTogglePostStayExpired={() => setSimulatePostStayExpired((expired) => !expired)}
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

      {scanSuccessToast ? (
        <ScanSuccessToast onDismiss={() => setScanSuccessToast(false)} />
      ) : null}

      <main className="guest-prototype guest-app">
        <section className={`guest-device ${isWelcome ? 'is-welcome' : ''}`} aria-label="Cabana guest app">
          {!isWelcome && activeScreen !== 'restaurant-menu' && activeScreen !== 'nearby-establishment' && !isChatScreen(activeScreen) ? <header className="guest-appbar" data-scrolled={scrolled}>
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
              {showPrimaryNav ? (
                <button
                  className="guest-icon-button guest-bell"
                  type="button"
                  onClick={openNotifications}
                  aria-label={unreadNotifications ? `Notifications, ${unreadNotifications} unread` : 'Notifications'}
                >
                  <Bell />
                  {unreadNotifications ? <span className="guest-bell__dot" aria-hidden="true" /> : null}
                </button>
              ) : null}
            </div>
          </header> : null}

          <div
            className={`guest-screen ${showPrimaryNav ? 'has-nav' : ''} ${isWelcome ? 'guest-screen--welcome' : ''} ${isChatScreen(activeScreen) ? 'guest-screen--chat' : ''} ${activeScreen === 'restaurant-menu' || activeScreen === 'nearby-establishment' ? 'guest-screen--hero' : ''}`}
            key={activeScreen}
            onScroll={(event) => {
              const next = event.currentTarget.scrollTop > 4;
              setScrolled((current) => (current === next ? current : next));
            }}
          >
            {renderScreen()}
          </div>

          {openHomeStoryId ? (
            <StoryViewer
              story={HOME_CATEGORY_STORIES[openHomeStoryId]}
              onClose={closeHomeStory}
              onBook={bookHomeStory}
              onFinished={closeHomeStory}
            />
          ) : null}

          {orderTrayOpen ? orderTrayOpen === 'restaurant' ? (() => {
            const venue = RESTAURANTS.find((restaurant) => restaurant.id === selectedRestaurantId) ?? RESTAURANTS[0];
            const summary = getVenueCartSummary(venue.menu, restaurantCarts[venue.id] ?? {});
            return <OrderTray title="Your order" establishment={venue.name} items={summary.items.map((item) => ({ id: item.id, name: item.name, unitPrice: item.unitPrice, quantity: item.quantity, image: getMenuItemImage(item.id) }))} total={summary.formattedTotal} roomNumber={contextBooking.roomNumber} onChangeQuantity={(id, delta) => changeCartQuantity(venue.id, id, delta)} onClose={() => setOrderTrayOpen(null)} onCheckout={() => setOrderTrayStep((step) => step === 'tray' ? 'review' : step)} />;
          })() : <OrderTray title="Your order" establishment="Gifts & Souvenirs" items={GIFT_PRODUCTS.filter((product) => (giftCart[product.name] ?? 0) > 0).map((product) => ({ id: product.name, name: product.name, unitPrice: product.price, quantity: giftCart[product.name] ?? 0, image: product.image }))} total={formatPesoAmount(GIFT_PRODUCTS.reduce((sum, product) => sum + parsePesoAmount(product.price) * (giftCart[product.name] ?? 0), 0))} roomNumber={contextBooking.roomNumber} onChangeQuantity={(id, delta) => changeGiftQuantity(id, delta)} onClose={() => setOrderTrayOpen(null)} onCheckout={() => setOrderTrayStep((step) => step === 'tray' ? 'review' : step)} /> : null}

          {showPrimaryNav ? (
            <nav className="guest-bottom-nav" aria-label="Primary navigation">
              <NavButton
                label="Home"
                icon={<GuestNavIcon icon={HugeHomeIcon} />}
                active={activeScreen === 'stay-overview'}
                onClick={() => go('stay-overview')}
              />
              {/*
                Both destinations need a connected booking: Explore uses it to
                show the right arrival or on-property services, and My Stay
                has no stay to show without it. Leaving them in place sent a
                guest with no booking to a dead end that said their room was
                "still being assigned".

                This is the one place the four-slot rule yields. The rule
                exists so the bar never reflows mid-journey and a destination
                never vanishes from under a guest -- and here the destinations
                genuinely do not exist yet. They appear, permanently, the
                moment a booking is added.
              */}
              {primaryBooking ? (
                  <NavButton
                    label={bookingNavLabel}
                    icon={bookingNavLabel === 'Explore'
                      ? <GuestNavIcon icon={HugeCompassIcon} />
                      : <GuestNavIcon icon={HugeBookAgainIcon} />}
                    active={EXPLORE_SCREENS.includes(activeScreen) || activeScreen === bookingSlot.screen}
                    onClick={() => go(bookingSlot.screen)}
                  />
              ) : null}
              {primaryBooking ? (
                <NavButton
                    label="My Stay"
                    icon={<GuestNavIcon icon={HugeBedSingleIcon} />}
                    active={MY_STAY_SCREENS.includes(activeScreen)}
                    onClick={() => go('my-stay')}
                  />
              ) : null}
              {primaryBooking ? (
                <NavButton
                  label="Chat"
                  icon={<GuestNavIcon icon={HugeChatIcon} />}
                  active={false}
                  unread={hasUnreadChat}
                  onClick={() => go('chat')}
                />
              ) : null}
              <NavButton
                label="Profile"
                icon={<GuestNavIcon icon={HugeProfileIcon} />}
                active={activeScreen === 'profile' || activeScreen === 'stay-history' || activeScreen === 'rewards' || activeScreen === 'reward-detail' || activeScreen === 'badge-detail'}
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
  onSimulateRoomAssignment,
  canSimulateRoomAssignment,
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
  strictLookup,
  onToggleStrictLookup,
  simulatePostStayExpired,
  onTogglePostStayExpired,
  onReset,
}: {
  online: boolean;
  stayState: PrototypeStayState;
  onStayStateChange: (state: PrototypeStayState) => void;
  onSimulateRoomAssignment: () => void;
  canSimulateRoomAssignment: boolean;
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
  strictLookup: boolean;
  onToggleStrictLookup: () => void;
  simulatePostStayExpired: boolean;
  onTogglePostStayExpired: () => void;
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
    <div
      className="guest-prototype-modal-backdrop"
      data-testid="prototype-controls-backdrop"
      onClick={(event) => {
        if (event.target === event.currentTarget) setOpen(false);
      }}
    >
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
        <button type="button" onClick={onSimulateRoomAssignment} disabled={!online || !canSimulateRoomAssignment}>
          <Ticket aria-hidden="true" />
          Simulate room assignment
        </button>

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

          {/*
            Off by default so any reference walks the happy path. On, only the
            real fixture matches -- which is how the not-found and
            returning-guest screens stay demonstrable.
          */}
          <button type="button" onClick={onToggleStrictLookup}>
            <Ticket aria-hidden="true" />
            {strictLookup ? 'Lookup: only real references' : 'Lookup: accepts anything'}
          </button>

          <button type="button" onClick={onTogglePostStayExpired}>
            <ClockCountdown aria-hidden="true" />
            {simulatePostStayExpired ? 'Reset 24-hour chat window' : 'Simulate 24 hours after checkout'}
          </button>
        </fieldset>

        <button className="guest-prototype-toolbar__reset" type="button" onClick={onReset}>
          Reset saved session
        </button>
      </div>

      </aside>
    </div>
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

function ScanSuccessToast({ onDismiss }: { onDismiss: () => void }) {
  return (
    <aside className="guest-toast" role="status" aria-live="polite">
      <span className="guest-toast__icon" aria-hidden="true"><CheckCircle /></span>
      <p>Room connected successfully. Your stay is now linked to the app.</p>
      <button className="guest-toast__dismiss" type="button" onClick={onDismiss} aria-label="Dismiss notification">
        <X aria-hidden="true" />
      </button>
    </aside>
  );
}

/** `count` consecutive ISO days starting at `from`. */
function daysFrom(from: string, count: number): string[] {
  const start = Date.parse(`${from}T00:00:00Z`);
  return Array.from({ length: count }, (_, i) => new Date(start + i * 86_400_000).toISOString().slice(0, 10));
}

/** Every half hour a hotel car can be asked for, as "HH:MM". */
const RIDE_TIMES = Array.from({ length: 38 }, (_, i) => {
  const minutes = 5 * 60 + i * 30;
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${minutes % 60 ? '30' : '00'}`;
});

/** "13:30" as "1:30 PM". */
function clockLabel(time: string): string {
  const [h = 0, m = 0] = time.split(':').map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
}

/* The airport a property's guests fly into, for a pick-up or a drop-off. */
function airportFor(booking: Booking) {
  return booking.city === 'Cebu'
    ? 'Mactan–Cebu International Airport'
    : booking.city === 'Dumaguete'
      ? 'Dumaguete–Sibulan Airport'
      : 'NAIA Terminal 3';
}

type StayOverviewHomeProps = {
  session: GuestSession;
  booking?: Booking;
  online?: boolean;
  onNavigate: (screen: ActiveScreen) => void;
  onOpenStory: (categoryId: HomeStoryCategoryId) => void;
  onOpenStay: (id: string) => void;
  /* A ride with both ends set: to the hotel before the stay, to the airport after it. */
  onRequestRide?: (direction: 'arrival' | 'departure') => void;
  /** Whether the front desk still answers after checkout: the 24-hour window. */
  deskOpen?: boolean;
};

function HomeStoryRail({ onOpenStory, onSeeAll }: { onOpenStory: (categoryId: HomeStoryCategoryId) => void; onSeeAll?: () => void }) {
  return (
    <section className="guest-home-discovery">
      <SectionHeading title="Make the most of your stay" action={onSeeAll ? 'See all' : undefined} onAction={onSeeAll} />
      <div className="discover__rail guest-home-stories" role="group" aria-label="Stay stories">
        {HOME_STORY_CATEGORIES.map((item) => {
          const story = HOME_CATEGORY_STORIES[item.id];
          return (
            <button
              key={item.id}
              type="button"
              className="discover__story guest-home-story"
              aria-label={item.label}
              title={`Open ${item.label} story`}
              onClick={() => onOpenStory(item.id)}
            >
              <span className="discover__story-ring">
                <span className="discover__story-art">
                  <Image src={story.cover.src} alt="" fill sizes="68px" style={{ objectPosition: story.cover.focalPoint }} />
                </span>
              </span>
              <b>{item.label}</b>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function StayOverviewHome({ session, booking, onNavigate, onOpenStory, onOpenStay, onRequestRide, deskOpen = false }: StayOverviewHomeProps) {
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
      (service) => service.status === 'confirmed' && service.bookingId === booking.id && service.scheduledDate >= PROTOTYPE_TODAY,
    );
    const roomLabel = booking.roomNumber ? `Room ${booking.roomNumber}` : 'Active room';
    const roomUpgrade = booking.roomUpgrade;
    return (
      <div className="guest-stack guest-home-booking guest-home-booking--active" data-testid="guest-home-active">
        <section className="guest-stay-hero-card guest-stay-hero-card--photo guest-home-active-hero">
          <div className="guest-stay-hero-card__media">
            <PropertyImage property={booking.property} aspectRatio="1.5" decorative />
            <div className="guest-stay-hero-card__badges">
              <span className="guest-stay-hero-card__status guest-stay-hero-card__status--positive">Checked in</span>
              <span className="guest-stay-hero-card__status guest-stay-hero-card__status--dark">{roomLabel}</span>
            </div>
            {/* The stay is named on its own photograph, as a Places card names a place. */}
            <div className="guest-stay-hero-card__overlay">
              <p className="guest-eyebrow">{greetGuest(session.guestName, 'Welcome')}</p>
              <h1>{booking.property}</h1>
            </div>
          </div>
          <div className="guest-stay-hero-card__body">
            <div className="guest-stay-hero-card__stats">
              <div><small>Dates</small><b>{formatStayDateRange(booking)}</b></div>
              <div><small>Room</small><b>{booking.roomType}</b></div>
              <div><small>Guests</small><b>{describeParty(booking, session)}</b></div>
              <div><small>Nights</small><b>{countNights(booking)}</b></div>
            </div>
            <button className="guest-stay-hero-card__booking" onClick={() => onNavigate('rate-detail')} type="button">
              <span><Ticket /></span>
              <span><b>View booking</b><small>Rate, policies and confirmation</small></span>
              <CaretRight />
            </button>
            {canOfferRoomUpgrade(booking) ? (
              <button className="guest-stay-hero-card__booking guest-stay-hero-card__booking--upgrade" onClick={() => onNavigate('room-upgrades')} type="button">
                <span><Bed /></span>
                <span><b>Upgrade room</b><small>Explore available rooms</small></span>
                <CaretRight />
              </button>
            ) : null}
          </div>
          {roomUpgrade ? <div className="guest-stay-hero-card__actions">
            {roomUpgrade?.status === 'preparing' ? <div className="guest-room-upgrade-status"><b>Room upgrade in progress</b><span>{roomUpgrade.newRoomType} · Room number coming soon</span><p>We&rsquo;re preparing your upgraded room. You can continue using Room {booking.roomNumber} until your new room is ready.</p></div> : null}
            {roomUpgrade?.status === 'ready' ? <div className="guest-room-transfer-preview"><div><small>Current room</small><b>Room {booking.roomNumber} · {booking.roomType}</b><span>Available until your room transfer is completed.</span></div><div><small>New room · Ready</small><b>Room {roomUpgrade.newRoomNumber} · {roomUpgrade.newRoomType}</b><span>Your upgraded room is ready. Complete the transfer before {roomUpgrade.transferDeadline}.</span></div><button className="guest-button guest-button--primary" type="button" onClick={() => onNavigate('room-transfer-details')}>View transfer details<ArrowRight /></button></div> : null}
          </div> : null}
          {/*
            Keep the room-code prompt beside the room context while the stay
            is still waiting for verification. Once the room is verified,
            repeating the action here would add noise to the stay overview.
          */}
          {canUseOnPropertyServices(booking) ? null : (
            <div className="guest-stay-hero-card__qr">
              <Button className="guest-button guest-button--primary" type="button" data-testid="guest-room-qr-row" onClick={() => onNavigate('scan-room-code')}>
                <QrCode aria-hidden="true" />Scan your room code<ArrowRight aria-hidden="true" />
              </Button>
            </div>
          )}
        </section>
        {confirmedServices[0] ? <section className="guest-home-next-service"><SectionHeading title="Next up" action="See all" onAction={() => onNavigate('my-stay')} /><button className="guest-next-service-card" type="button" aria-label={`View details for ${confirmedServices[0].title}`} onClick={() => onNavigate('my-stay')}>
          <span className="guest-next-service-card__marker" aria-hidden="true"><HugeiconsIcon icon={HugeCalendarCheckIcon} size={20} strokeWidth={1.75} focusable="false" /></span>
          <span className="guest-next-service-card__details">
            <b>{confirmedServices[0].title === 'Hilom signature massage' ? 'Hilom Signature Massage' : confirmedServices[0].title}</b>
            <small className="guest-next-service-card__schedule">{confirmedServices[0].scheduledFor}</small>
            <small className="guest-next-service-card__charge">{confirmedServices[0].amount} · Charged to {roomLabel}</small>
          </span>
          <span className="guest-next-service-card__action" aria-hidden="true"><span className="guest-next-service-card__action-icon"><HugeiconsIcon icon={HugeChevronRightIcon} size={15} strokeWidth={1.75} focusable="false" /></span></span>
        </button></section> : null}
        {canUseOnPropertyServices(booking) ? (
          <section className="guest-home-discovery">
            <SectionHeading title="Make the most of your stay" />
            <div className="discover__rail guest-home-stories" role="group" aria-label="Stay stories">
              {HOME_STORY_CATEGORIES.map((item) => {
                const story = HOME_CATEGORY_STORIES[item.id];
                return (
                  <button
                    key={item.id}
                    type="button"
                    className="discover__story guest-home-story"
                    aria-label={item.label}
                    title={`Open ${item.label} story`}
                    onClick={() => onOpenStory(item.id)}
                  >
                    <span className="discover__story-ring">
                      <span className="discover__story-art">
                        <Image src={story.cover.src} alt="" fill sizes="68px" style={{ objectPosition: story.cover.focalPoint }} />
                      </span>
                    </span>
                    <b>{item.label}</b>
                  </button>
                );
              })}
            </div>
          </section>
        ) : null}
        <AnnouncementsSection booking={booking} compact />
      </div>
    );
  }

  if (variant === 'multiple-upcoming') {
    return (
      <div className="guest-stack guest-home-booking guest-home-booking--multiple" data-testid="guest-home-multiple-upcoming">
        <div className="guest-page-title"><h1>Upcoming stays</h1><p>Keep every reservation in one place. Your nearest arrival is shown first.</p></div>
        {/*
        The label carries the truth the variant cannot. `getHomeVariant` keys
        off `status`, so the reference stay stays on the upcoming home with a
        window that already contains today -- and without this the card told a
        guest mid-stay that their arrival was still to come.
      */}
      <UpcomingBookingCard booking={booking} primary onNavigate={onNavigate} statusLabel={describeStayStatus(booking).label} />
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
        <div className="guest-page-title"><h1>Your latest stay</h1></div>
        <button className="guest-add-booking-card guest-add-booking-card--secondary" type="button" onClick={() => onNavigate('book-stay')}>
          <span className="guest-add-booking-card__glyph" aria-hidden="true"><Plus /></span>
          <span className="guest-add-booking-card__text"><b>Book another stay</b><small>Find your next Cabana stay.</small></span>
          <ArrowRight aria-hidden="true" />
        </button>
        <Notice tone="positive" icon={<CheckCircle />} title="Stay complete">Your previous room charges were settled at checkout.</Notice>
        <UpcomingBookingCard booking={booking} onNavigate={onNavigate} statusLabel="Checked out" showRoomBadge={false} hideEyebrow />
        {/*
          Both end in the front desk's chat, so they are offered only while
          it answers. Once the 24-hour window closes the chat is closed and
          a ride request would go nowhere.
        */}
        {deskOpen ? (
          <section className="guest-before-you-go">
            <SectionHeading title="Before you go" />
            <button className="guest-ride-card" type="button" onClick={() => (onRequestRide ? onRequestRide('departure') : onNavigate('transfer-booking'))}>
              <Image className="guest-ride-card__image" src={getServiceImage('transfer').src} alt="" fill sizes="(max-width: 720px) 100vw, 560px" style={{ objectPosition: getServiceImage('transfer').focalPoint }} />
              <span className="guest-ride-card__action" aria-hidden="true"><ArrowRight /></span>
              <span className="guest-ride-card__body">
                <small>Airport drop-off</small>
                <b>Need a ride to the airport?</b>
                <span>{`A hotel driver takes you from ${booking.property} to ${airportFor(booking)}.`}</span>
                <span className="guest-ride-card__pills">
                  <span><Car aria-hidden="true" />Leave now or schedule</span>
                  <span><Users aria-hidden="true" />{`${booking.guestCount} ${booking.guestCount === 1 ? 'guest' : 'guests'}`}</span>
                </span>
              </span>
            </button>
            <button className="guest-ride-card guest-ride-card--busy" type="button" onClick={() => onNavigate('gifts-souvenirs')}>
              <Image className="guest-ride-card__image" src="https://images.unsplash.com/photo-1751725154557-b10ab73f1564?auto=format&fit=crop&w=1200&q=82" alt="" fill sizes="(max-width: 720px) 100vw, 560px" />
              <span className="guest-ride-card__action" aria-hidden="true"><ArrowRight /></span>
              <span className="guest-ride-card__body">
                <small>Gifts &amp; souvenirs</small>
                <b>Want something from the gift shop?</b>
                <span>Pick up local treats and souvenirs before you leave.</span>
                <span className="guest-ride-card__pills">
                  <span><Gift aria-hidden="true" />Pasalubong &amp; keepsakes</span>
                  <span><Storefront aria-hidden="true" />Lobby pick-up</span>
                </span>
              </span>
            </button>
          </section>
        ) : null}
        <TextButton onClick={() => onNavigate('stay-history')}>View stay history</TextButton>
      </div>
    );
  }

  const roomAssignment = describeRoomAssignment(booking);

  return (
    <div className="guest-stack guest-home-booking guest-home-booking--upcoming" data-testid="guest-home-upcoming">
      {/*
        The label carries the truth the variant cannot. `getHomeVariant` keys
        off `status`, so the reference stay stays on the upcoming home with a
        window that already contains today -- and without this the card told a
        guest mid-stay that their arrival was still to come.
      */}
      <UpcomingBookingCard booking={booking} primary onNavigate={onNavigate} statusLabel={describeStayStatus(booking).label} />
      {booking.preArrivalCompleted < booking.preArrivalTotal ? (
        <section className="guest-home-booking guest-home-booking--primary">
          <div className="guest-home-booking__heading"><div><small>Pre-arrival</small><h2>{booking.preArrivalCompleted} of {booking.preArrivalTotal} steps complete</h2></div><strong>{Math.round((booking.preArrivalCompleted / Math.max(booking.preArrivalTotal, 1)) * 100)}%</strong></div>
          <div className="guest-home-progress" role="progressbar" aria-label="Pre-arrival progress" aria-valuemin={0} aria-valuemax={booking.preArrivalTotal} aria-valuenow={booking.preArrivalCompleted}><span style={{ width: `${Math.min(100, (booking.preArrivalCompleted / Math.max(booking.preArrivalTotal, 1)) * 100)}%` }} /></div>
          <p>{booking.nextPreArrivalStep ?? 'Review your stay details before arrival.'}</p>
          <Button className="guest-button guest-button--primary" type="button" onClick={() => onNavigate('guest-details')}>Complete pre-arrival<ArrowRight aria-hidden="true" /></Button>
        </section>
      ) : roomAssignment.state !== 'pending' ? (
        booking.roomVerification ? null : (
          <section className="guest-home-booking guest-home-booking--primary guest-room-ready-card" data-testid="guest-room-ready-card">
            <div className="guest-home-booking__heading">
              <h2>{`Room ${booking.roomNumber ?? 'assigned'} is ready`}</h2>
            </div>
            <p className="guest-home-booking__room-type">
              <b>{booking.roomType === 'King room' ? 'Deluxe King Room' : booking.roomType}</b>
              <small>{(booking.honouredPreferences?.length ? booking.honouredPreferences : [session.roomPreferences.floor, session.roomPreferences.bed]).join(' · ')}</small>
            </p>
            {/*
              The scan is only offered while it can succeed. Days out, a button
              to scan a code the guest cannot be standing next to either fails
              or, before the model refused it, "unlocked" a stay that had not
              begun.
            */}
            {isStayUnderWay(booking) ? (
              <>
                <p>Your room is now ready. Once inside, scan the room code to connect your stay to the app.</p>
                <Button
                  className="guest-button guest-button--primary"
                  type="button"
                  data-testid="guest-room-qr-row"
                  onClick={() => onNavigate('scan-room-code')}
                >
                  <QrCode aria-hidden="true" />Scan room code<ArrowRight aria-hidden="true" />
                </Button>
              </>
            ) : (
              <p>{`Held for your arrival on ${formatStayDateRange(booking).split('–')[0]}. Once you are in the room, scan the code on the desk card to connect your stay to the app.`}</p>
            )}
          </section>
        )
      ) : (
        <section className="guest-home-booking guest-home-booking--primary">
          <div className="guest-home-booking__heading">
            <div><small>Your room</small><h2>{roomAssignment.headline}</h2></div>
            <Tag tone={roomAssignment.canGoUp ? 'positive' : undefined}>{roomAssignment.statusLabel}</Tag>
          </div>
          <p>{roomAssignment.detail}</p>
          {roomAssignment.action.tone === 'primary' ? (
            <Button className="guest-button guest-button--primary" type="button" onClick={() => onNavigate(roomAssignment.action.screen)}>
              {roomAssignment.action.label}<ArrowRight aria-hidden="true" />
            </Button>
          ) : (
            <TextButton onClick={() => onNavigate(roomAssignment.action.screen)}>{roomAssignment.action.label}</TextButton>
          )}
        </section>
      )}
      {/* The request the last pre-arrival step sent, so asking and declining no longer look the same. */}
      {booking.earlyCheckIn && !hasStayStarted(booking) ? (
        <Notice icon={<Clock />} title={`Early check-in requested · ${booking.earlyCheckIn.time}`}>
          The hotel confirms availability before you arrive. If it is approved, {booking.earlyCheckIn.fee} goes on your room at checkout.
        </Notice>
      ) : null}
      {/*
        Kept out of sight until the guest has scanned in: services on offer
        are not a thing to browse before the room itself confirms they are
        on property.
      */}
      {booking.roomVerification ? <HomeStoryRail onOpenStory={onOpenStory} onSeeAll={() => onNavigate('marketplace')} /> : null}
      {/* Arrival offers: once the stay has begun the guest is already here. */}
      {!booking.roomVerification && booking.status === 'upcoming' && !hasStayStarted(booking) ? (
        <>
          {/*
            The one arrival offer with a picture. A car waiting at arrivals is
            what a guest pictures before the trip, so it leads; the rest of
            the roster sits under it as a plain row.
          */}
          <button className="guest-ride-card" type="button" onClick={() => (onRequestRide ? onRequestRide('arrival') : onNavigate('transfer-booking'))}>
            <Image className="guest-ride-card__image" src={getServiceImage('transfer').src} alt="" fill sizes="(max-width: 720px) 100vw, 560px" style={{ objectPosition: getServiceImage('transfer').focalPoint }} />
            <span className="guest-ride-card__action" aria-hidden="true"><ArrowRight /></span>
            <span className="guest-ride-card__body">
              <small>Private pick-up</small>
              <b>Need a ride to the hotel?</b>
              <span>{`A hotel driver meets you at ${airportFor(booking)} and brings you to ${booking.property}.`}</span>
              <span className="guest-ride-card__pills">
                <span><CalendarBlank aria-hidden="true" />{`Arriving ${formatStayDateRange(booking).split('–')[0]}`}</span>
                <span><Users aria-hidden="true" />{`${booking.guestCount} ${booking.guestCount === 1 ? 'guest' : 'guests'}`}</span>
              </span>
            </span>
          </button>
          <button className="guest-transfer-card" type="button" onClick={() => onNavigate('pre-arrival-services')}>
            <Wrench aria-hidden="true" />
            <span>
              <b>More arrival services</b>
              <small>Early check-in, luggage assistance, private driver, and celebration setup</small>
            </span>
            <CaretRight aria-hidden="true" />
          </button>
        </>
      ) : null}
      <AnnouncementsSection booking={booking} />
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

function AnnouncementsSection({ booking, compact = false }: { booking?: Booking; compact?: boolean }) {
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<PropertyAnnouncement | null>(null);
  const [showAllUpdates, setShowAllUpdates] = useState(false);
  const relevantAnnouncements = booking
    ? PROPERTY_ANNOUNCEMENTS.filter((announcement) => (
      announcement.important
      && announcement.activeFrom <= booking.checkOut
      && announcement.activeUntil >= booking.checkIn
    ))
    : [];

  if (!relevantAnnouncements.length) return null;

  const visibleAnnouncements = relevantAnnouncements.slice(0, 2);

  return (
    <section>
      <SectionHeading title="Updates for your stay" />
      <div className="guest-announcements">
        {visibleAnnouncements.map((announcement) => (
          <button
            key={announcement.id}
            type="button"
            className={`guest-announcement guest-announcement--${announcement.tone}`}
            onClick={() => setSelectedAnnouncement(announcement)}
          >
            <span aria-hidden="true"><Megaphone /></span>
            <div><b>{announcement.title}</b><p>{compact ? announcementPreview(announcement) : announcement.body}</p></div>
            <CaretRight aria-hidden="true" />
          </button>
        ))}
      </div>
      {relevantAnnouncements.length > 2 ? <TextButton onClick={() => setShowAllUpdates(true)}>View all updates</TextButton> : null}
      {selectedAnnouncement || showAllUpdates ? (
        <div className="guest-announcement-detail" role="dialog" aria-modal="true" aria-labelledby="announcement-detail-title">
          <div className="guest-announcement-detail__panel">
            <button type="button" className="guest-announcement-detail__close" aria-label="Close update" onClick={() => { setSelectedAnnouncement(null); setShowAllUpdates(false); }}><X aria-hidden="true" /></button>
            <Megaphone aria-hidden="true" />
            {showAllUpdates ? (
              <>
                <h2 id="announcement-detail-title">Updates for your stay</h2>
                {relevantAnnouncements.map((announcement) => <div key={announcement.id} className="guest-announcement-detail__item"><b>{announcement.title}</b><p>{announcement.body}</p></div>)}
              </>
            ) : (
              <>
                <h2 id="announcement-detail-title">{selectedAnnouncement?.title}</h2>
                <p>{selectedAnnouncement?.body}</p>
              </>
            )}
            <Button className="guest-button guest-button--primary" type="button" onClick={() => { setSelectedAnnouncement(null); setShowAllUpdates(false); }}>Done</Button>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function announcementPreview(announcement: PropertyAnnouncement) {
  if (announcement.id === 'pool-maintenance') return 'The rooftop pool will reopen after weekly maintenance.';
  if (announcement.id === 'cafe-early-opening') return 'Early breakfast is available for guests with morning departures.';
  return announcement.body;
}

/**
 * One booking, as a card that names its parent first.
 *
 * The parent line is not decoration. A guest island-hopping through three
 * properties sees "Azotea Rooftop · 7:30 PM" and has to remember which hotel
 * that was; "The Henry Manila · Ninth floor terrace" answers it before they
 * ask.
 */
function StayEntryCard({ entry, onOpen, showWhen = true }: { entry: StayEntry; onOpen?: () => void; showWhen?: boolean }) {
  const date = new Date(`${entry.date}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const time = entry.detail.match(/\d{1,2}:\d{2}\s*[AP]M/i)?.[0] ?? '';
  const when = `${entry.date === PROTOTYPE_TODAY ? 'Tonight' : date}${time ? ` · ${time}` : ''}`;
  const body = (
    <>
      {/*
        Named from the entry, not from a list of titles. This was an allowlist
        of two -- 'Apartment 1B' and 'Azotea Rooftop' -- so every other venue
        in a growing catalogue silently lost the line that says which building
        it is in, which is the question the card exists to answer.
      */}
      {/* A square photograph, as Places lists a saved place. */}
      <span className="guest-stay-entry__thumb" aria-hidden="true">
        <Image src={(CATEGORY_IMAGES[entry.category] ?? CATEGORY_IMAGES.services!).src} alt="" fill sizes="56px" />
      </span>
      <span className="guest-stay-entry__parent">
        <span aria-hidden="true"><HugeiconsIcon icon={HugeStoreIcon} size={16} strokeWidth={1.75} aria-hidden="true" focusable="false" /></span>
        <span>{entry.parentDetail ? `${entry.parent} · ${entry.parentDetail}` : entry.parent}</span>
      </span>
      <span className="guest-stay-entry__headline">
        <h2>{entry.title}</h2>
        <strong>{entry.amount}</strong>
      </span>
      {showWhen ? <span className="guest-stay-entry__when">{when}</span> : null}
      {entry.settlement ? <span className="guest-stay-entry__settlement">{entry.settlement}</span> : null}
    </>
  );

  if (!onOpen) return <div className="guest-stay-entry is-static" data-status={entry.status}>{body}</div>;

  return <button className="guest-stay-entry" type="button" data-status={entry.status} onClick={onOpen}>{body}</button>;
}

function UpcomingBookingCard({ booking, primary = false, onNavigate, statusLabel, showRoomBadge = true, hideEyebrow = false }: { booking: Booking; primary?: boolean; onNavigate: (screen: ActiveScreen) => void; statusLabel?: string; showRoomBadge?: boolean; hideEyebrow?: boolean }) {
  return (
    <section className="guest-stay-hero-card guest-stay-hero-card--photo">
      <div className="guest-stay-hero-card__media">
        <PropertyImage property={booking.property} aspectRatio="1.6" decorative />
        <div className="guest-stay-hero-card__badges">
          <span className={`guest-stay-hero-card__status${statusLabel === 'Checked in' ? ' guest-stay-hero-card__status--positive' : ''}`}>{statusLabel ?? (primary ? 'Next arrival' : 'Upcoming')}</span>
          {showRoomBadge && booking.roomNumber ? <span className="guest-stay-hero-card__status guest-stay-hero-card__status--dark">Room {booking.roomNumber}</span> : null}
        </div>
        <div className="guest-stay-hero-card__overlay">
          {!hideEyebrow ? <p className="guest-eyebrow">{isStayUnderWay(booking) ? 'Your current stay' : primary ? 'Your next stay' : 'Upcoming stay'}</p> : null}
          <h1>{booking.property}</h1>
        </div>
      </div>
      <div className="guest-stay-hero-card__body">
        <div className="guest-stay-hero-card__stats">
          <div><small>Dates</small><b>{formatStayDateRange(booking)}</b></div>
          {booking.roomNumber ? <div><small>Room</small><b>{booking.roomType} · {booking.roomNumber}</b></div> : null}
        <div><small>Guests</small><b>{booking.guestCount} guests</b></div>
        <div><small>Nights</small><b>{countNights(booking)}</b></div>
      </div>
      <button className="guest-stay-hero-card__booking" onClick={() => onNavigate('rate-detail')} type="button">
        <span><Ticket /></span>
        <span><b>View booking</b><small>Rate, policies and confirmation</small></span>
        <CaretRight />
      </button>
      </div>
    </section>
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

function formatCheckoutDate(isoDate: string) {
  const date = new Date(`${isoDate}T12:00:00`);
  if (Number.isNaN(date.getTime())) return isoDate;
  return new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric' }).format(date);
}

/**
 * `eyebrow` is optional, and most screens should not pass one.
 *
 * An eyebrow earns its place by saying something the title cannot: which
 * property, which room, which step of how many, how long until a cutoff. A
 * label that restates the heading in other words -- "Updates" over
 * "Notifications", "Stay complete" over "This stay is settled" -- is a second
 * heading the eye has to read and discard.
 */
function ScreenIntro({ icon, eyebrow, title, text, children }: { icon?: ReactNode; eyebrow?: string; title: string; text: string; children: ReactNode }) {
  return <div className="guest-stack guest-stack--intro">{icon ? <HeroIcon>{icon}</HeroIcon> : null}<div className="guest-page-title">{eyebrow ? <p className="guest-eyebrow">{eyebrow}</p> : null}<h1>{title}</h1><p>{text}</p></div>{children}</div>;
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

function RoomExtensionCard({ booking, onExtend }: { booking: Booking; onExtend: () => void }) {
  const eligible = booking.status === 'active' && booking.checkOut > PROTOTYPE_TODAY;
  if (!eligible) return null;
  return <section className="guest-extension-card"><div className="guest-extension-card__copy"><CalendarPlus /><div><b>Want to stay longer?</b><small>Ask the front desk if your room is available for another night.</small></div></div><Button className="guest-button guest-button--secondary" type="button" onClick={onExtend}>Ask about extending<ArrowRight /></Button></section>;
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
  showCount = true,
}: {
  facets: Facet[];
  count: number;
  nouns: [string, string];
  narrowed: boolean;
  onClear: () => void;
  showCount?: boolean;
}) {
  const [openKey, setOpenKey] = useState<string | null>(null);
  const open = facets.filter((facet) => facet.key === openKey);
  const apply = (draft: Record<string, string[]>) => {
    for (const facet of facets) {
      const next = draft[facet.key];
      if (next) facet.onChange(next);
    }
  };

  return (
    <div className="guest-listing-controls">
      <div className="guest-filter-bar">
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
      {showCount || narrowed ? <p className="guest-listing-status">
        {showCount ? <span aria-live="polite">{count} {count === 1 ? nouns[0] : nouns[1]}</span> : null}
        {narrowed ? <button type="button" className="guest-listing-clear" onClick={onClear}>Clear</button> : null}
      </p> : null}
      {openKey ? (
        <FilterSheet
          key={openKey}
          title={openKey === 'all' ? 'Filters' : open[0]!.label}
          facets={open}
          onClose={() => afterSheetExit(() => setOpenKey(null))}
          onApply={apply}
        />
      ) : null}
    </div>
  );
}

function SectionHeading({ title, action, onAction, count }: { title: string; action?: string; onAction?: () => void; count?: string }) {
  return <div className="guest-section-heading"><h2>{title}</h2>{count ? <span className="guest-section-heading__count">{count}</span> : action ? <button onClick={onAction}>{action}<CaretRight /></button> : null}</div>;
}

type NearbyEstablishment = {
  id: string;
  categoryId: MiniAppCategoryId | 'gifts';
  /** A nearby place is near one hotel only. */
  city: string;
  name: string;
  type: string;
  distance?: string;
  description: string;
  address: string;
  hours: string;
  contact?: string;
  image: string;
};

const NEARBY_ESTABLISHMENTS: NearbyEstablishment[] = [
  { id: 'kape-lab-manila', city: 'Manila', categoryId: 'dining' as const, name: 'Kape Lab Manila', type: 'Coffee & bakery', distance: '280 m away', description: 'Small-batch coffee, pastries, and early breakfast.', address: '142 Roxas Boulevard, Manila', hours: 'Daily · 6:00 AM–9:00 PM', contact: '+63 917 555 0142', image: 'https://images.unsplash.com/photo-1445116572660-236099ec97a0?auto=format&fit=crop&w=900&q=80' },
  { id: 'bayleaf-kitchen', city: 'Manila', categoryId: 'dining', name: 'Bayleaf Kitchen', type: 'Filipino restaurant', distance: '600 m away', description: 'Independent neighborhood dining with regional Filipino comfort food.', address: '9 Mabini Street, Manila', hours: 'Tue–Sun · 11:00 AM–10:00 PM', contact: '+63 917 555 0161', image: '/experiments/bayleaf-kitchen.jpg' },
  { id: 'sunset-roasters', city: 'Manila', categoryId: 'dining', name: 'Sunset Roasters', type: 'Coffee shop', distance: '850 m away', description: 'A relaxed independent café for coffee, tea, and light bites.', address: '77 Roxas Boulevard, Manila', hours: 'Daily · 7:00 AM–8:00 PM', contact: '+63 917 555 0187', image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=900&q=80' },
  { id: 'hilot-house', city: 'Manila', categoryId: 'spa' as const, name: 'Hilot House', type: 'Independent wellness studio', distance: '450 m away', description: 'A neighborhood studio for traditional hilot and restorative treatments.', address: '18 Adriatico Street, Manila', hours: 'Mon–Sun · 10:00 AM–10:00 PM', contact: '+63 917 555 0198', image: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=900&q=80' },
  { id: 'bamboo-wellness', city: 'Manila', categoryId: 'spa', name: 'Bamboo Wellness Studio', type: 'Massage & wellness', distance: '700 m away', description: 'Independent therapists offering calming massages and wellness rituals.', address: '26 Pedro Gil Street, Manila', hours: 'Daily · 9:00 AM–9:00 PM', contact: '+63 917 555 0133', image: 'https://images.unsplash.com/photo-1519823551278-64ac92734fb1?auto=format&fit=crop&w=900&q=80' },
  { id: 'quiet-corner-yoga', city: 'Manila', categoryId: 'spa', name: 'Quiet Corner Yoga', type: 'Yoga studio', distance: '1 km away', description: 'Small group yoga and breathwork classes for all experience levels.', address: '41 Taft Avenue, Manila', hours: 'Mon–Sat · 7:00 AM–8:00 PM', contact: '+63 917 555 0175', image: 'https://images.unsplash.com/photo-1545205597-3d9d02c29597?auto=format&fit=crop&w=900&q=80' },
  { id: 'manila-heritage-walks', city: 'Manila', categoryId: 'entertainment' as const, name: 'Manila Heritage Walks', type: 'Local tours', distance: '1.2 km away', description: 'Independent walking tours through the city’s historic neighborhoods.', address: 'Plaza Roma, Intramuros, Manila', hours: 'Tours daily · 8:00 AM–5:00 PM', contact: '+63 917 555 0120', image: 'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=900&q=80' },
  { id: 'sunset-bay-cruises', city: 'Manila', categoryId: 'entertainment', name: 'Sunset Bay Cruises', type: 'Harbor experience', distance: '2.4 km away', description: 'Independent sunset cruises with views across Manila Bay.', address: 'Harbor Square, Pasay City', hours: 'Daily departures · 4:00 PM–8:00 PM', contact: '+63 917 555 0154', image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=900&q=80' },
  { id: 'intramuros-cycling', city: 'Manila', categoryId: 'entertainment', name: 'Intramuros Cycle Tours', type: 'Bike tours', distance: '1.8 km away', description: 'Independent guided bicycle tours through Intramuros and nearby streets.', address: 'General Luna Street, Intramuros, Manila', hours: 'Daily · 7:00 AM–6:00 PM', contact: '+63 917 555 0109', image: 'https://images.unsplash.com/photo-1529422643029-d4585747aaf2?auto=format&fit=crop&w=900&q=80' },
  { id: 'escolta-craft-market', city: 'Manila', categoryId: 'services' as const, name: 'Escota Craft Market', type: 'Handicrafts & gifts', distance: '900 m away', description: 'Independent makers offering local crafts, keepsakes, and small gifts.', address: 'Escota Street, Binondo, Manila', hours: 'Friday–Sunday · 10:00 AM–7:00 PM', contact: '+63 917 123 4567', image: 'https://images.unsplash.com/photo-1528698827591-e19ccd7bc23d?auto=format&fit=crop&w=900&q=80' },
  { id: 'manila-laundry-co', city: 'Manila', categoryId: 'services' as const, name: 'Manila Laundry Co.', type: 'Laundry service', distance: '500 m away', description: 'Independent wash-and-fold service with convenient hotel-area pickup.', address: '12 Harrison Street, Pasay City', hours: 'Daily · 8:00 AM–8:00 PM', contact: '+63 917 555 0181', image: 'https://images.unsplash.com/photo-1517677208171-0bc6725a3e60?auto=format&fit=crop&w=900&q=80' },
  { id: 'city-bike-rentals', city: 'Manila', categoryId: 'services' as const, name: 'City Bike Rentals', type: 'Bike rental', distance: '1.1 km away', description: 'Independent bicycle rentals for exploring the bay and nearby neighborhoods.', address: '88 M. H. del Pilar Street, Manila', hours: 'Daily · 7:00 AM–7:00 PM', contact: '+63 917 555 0147', image: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=900&q=80' },
  { id: 'manila-makers-market', city: 'Manila', categoryId: 'gifts', name: 'Manila Makers Market', type: 'Local crafts & souvenirs', distance: '750 m away', description: 'Independent makers offering keepsakes, home décor, and pasalubong.', address: '33 Escolta Street, Manila', hours: 'Tue–Sun · 10:00 AM–7:00 PM', contact: '+63 917 555 0116', image: 'https://images.unsplash.com/photo-1452860606245-08befc0ff44b?auto=format&fit=crop&w=900&q=80' },
  { id: 'binondo-pasalubong', city: 'Manila', categoryId: 'gifts', name: 'Binondo Pasalubong House', type: 'Local delicacies', distance: '1.4 km away', description: 'Independent shop for regional snacks, sweets, and take-home treats.', address: '168 Ongpin Street, Binondo, Manila', hours: 'Daily · 9:00 AM–8:00 PM', contact: '+63 917 555 0128', image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=900&q=80' },
  { id: 'artisan-home-studio', city: 'Manila', categoryId: 'gifts', name: 'Artisan Home Studio', type: 'Home décor & crafts', distance: '1.6 km away', description: 'Independent local artists’ studio with ceramics, candles, and small décor.', address: '52 Escolta Street, Manila', hours: 'Wed–Sun · 10:00 AM–6:00 PM', contact: '+63 917 555 0170', image: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=900&q=80' },
];

const ROOM_UPGRADES = [
  { id: 'deluxe-king-512', name: 'Deluxe King Room', type: 'Higher-floor room', features: 'King bed · Bay view · Larger workspace', guests: '2 guests', price: '₱3,600', transfer: 'Ready now · About 15 minutes to transfer', transferDeadline: '6:00 PM today', roomNumber: '512', image: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1000&q=80' },
  { id: 'garden-suite-608', name: 'Garden Suite', type: 'Suite upgrade', features: 'King bed · Separate sitting area · Balcony', guests: '3 guests', price: '₱6,000', transfer: 'Ready in about 30 minutes', transferDeadline: '8:00 PM today', roomNumber: '608', image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1000&q=80' },
] as const;

/*
  An upgrade is a room charge, so it sits behind the same gate as every other
  one: offered only once the room is verified, and only while a night is left
  to spend in the better room.
*/
function canOfferRoomUpgrade(booking: Booking) {
  return !booking.roomUpgrade && canUseOnPropertyServices(booking) && booking.checkOut > PROTOTYPE_TODAY;
}

function NearbyRecommendationCard({ item, onSelect }: { item: NearbyEstablishment; onSelect: (id: string) => void }) {
  return <button className="guest-catalog-option-card guest-catalog-option-card--nearby" type="button" onClick={() => onSelect(item.id)}><div className="guest-catalog-option-card__media"><Image src={item.image} alt="" fill sizes="(max-width: 720px) 84vw, 540px" /><span className="guest-catalog-option-card__name">{item.name}</span></div><div className="guest-catalog-option-card__details"><p>{item.type}</p>{item.distance ? <small>{item.distance}</small> : null}<small>{item.address}</small></div></button>;
}

function NearbyRecommendations({ categoryId, city, description, onViewAll, onSelect }: { categoryId: MiniAppCategoryId; city: string; description: string; onViewAll: () => void; onSelect: (id: string) => void }) {
  const recommendations = NEARBY_ESTABLISHMENTS.filter((item) => item.categoryId === categoryId && item.city === city);
  const curated = recommendations.slice(0, 4);
  const railRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const updateIndex = () => {
    const rail = railRef.current;
    const card = rail?.querySelector<HTMLElement>('.guest-catalog-option-card');
    if (!rail || !card) return;
    setActiveIndex(Math.min(curated.length - 1, Math.max(0, Math.round(rail.scrollLeft / (card.offsetWidth + 12)))));
  };
  const goTo = (index: number) => railRef.current?.children[index]?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' });
  if (!recommendations.length) return null;
  return <section className="guest-nearby-section"><div className="guest-nearby-heading"><h2>Nearby recommendations</h2><button type="button" onClick={onViewAll}>View all</button></div><p className="guest-nearby-description">{description}</p><div ref={railRef} className="guest-nearby-carousel" onScroll={updateIndex}>{curated.map((item) => <NearbyRecommendationCard key={item.id} item={item} onSelect={onSelect} />)}</div><div className="guest-nearby-dots" aria-label="Nearby recommendations pages">{curated.map((item, index) => <button key={item.id} type="button" className={activeIndex === index ? 'is-active' : ''} aria-label={`Show nearby recommendation ${index + 1}`} aria-current={activeIndex === index} onClick={() => goTo(index)} />)}</div></section>;
}

function NearbyRecommendationsPage({ categoryId, city, property, onSelect }: { categoryId: MiniAppCategoryId; city: string; property: string; onSelect: (id: string) => void }) {
  const recommendations = NEARBY_ESTABLISHMENTS.filter((item) => item.categoryId === categoryId && item.city === city);
  const [view, setView] = useState<'list' | 'map'>('list');
  return (
    <div className="guest-stack guest-nearby-page">
      <div className="guest-page-title"><h1>Nearby recommendations</h1><p>Independent places close to {property}.</p></div>
      {recommendations.length ? (
        <div className="guest-nearby-view" role="group" aria-label="Show as">
          <button type="button" aria-pressed={view === 'list'} className={view === 'list' ? 'is-active' : ''} onClick={() => setView('list')}>List</button>
          <button type="button" aria-pressed={view === 'map'} className={view === 'map' ? 'is-active' : ''} onClick={() => setView('map')}><MapPin aria-hidden="true" />Map</button>
        </div>
      ) : null}
      {view === 'map' ? (
        <NearbyMap city={city} property={property} propertyImage={getPropertyImage(property).src} places={recommendations} onSelect={onSelect} />
      ) : (
        <div className="guest-nearby-page__list">{recommendations.map((item) => <NearbyRecommendationCard key={item.id} item={item} onSelect={onSelect} />)}</div>
      )}
    </div>
  );
}

function NearbyEstablishmentScreen({ establishment, onBack, onNotifications, onBookRide }: { establishment: NearbyEstablishment; onBack: () => void; onNotifications: () => void; onBookRide: () => void }) {
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(establishment.address)}`;
  return <div className="guest-stack guest-nearby-detail">
    <section className="guest-nearby-detail__hero" aria-label={`${establishment.name} overview`}>
      <Image src={establishment.image} alt="" fill sizes="100vw" priority />
      <div className="guest-nearby-detail__scrim" aria-hidden="true" />
      <button className="guest-nearby-detail__control guest-nearby-detail__back" type="button" onClick={onBack} aria-label="Back"><ArrowLeft /></button>
      <button className="guest-nearby-detail__control guest-nearby-detail__notifications" type="button" onClick={onNotifications} aria-label="Notifications"><Bell /></button>
      <div className="guest-nearby-detail__hero-copy">
        <h1>{establishment.name}</h1>
        <div className="guest-nearby-detail__tags" aria-label="Recommendation details"><span>{establishment.type}</span><span>Independent</span></div>
      </div>
    </section>

    <section className="guest-nearby-detail__location" aria-label="Location">
      <div className="guest-nearby-detail__address"><MapPin aria-hidden="true" /><span>{establishment.address}</span></div>
      <a href={mapsUrl} target="_blank" rel="noreferrer">View on Google Maps <ArrowRight aria-hidden="true" /></a>
      <div className="guest-nearby-detail__hours"><small>Operating hours</small><b>{establishment.hours}</b></div>
    </section>

    <section className="guest-nearby-detail__about">
      <h2>About</h2>
      <p>{establishment.description}</p>
      {establishment.contact ? <div className="guest-nearby-detail__contact"><small>Contact</small><a href={`tel:${establishment.contact.replace(/\s/g, '')}`}>{establishment.contact}</a></div> : null}
    </section>

    <section className="guest-nearby-detail__good-to-know">
      <h2>Good to know</h2>
      <div className="guest-nearby-detail__facts">
        <span><Storefront aria-hidden="true" /><b>Independently operated</b></span>
        <span><House aria-hidden="true" /><b>Outside the hotel</b></span>
        {establishment.categoryId === 'gifts' ? <span><Gift aria-hidden="true" /><b>Local handicrafts and gifts</b></span> : null}
        {establishment.distance ? <span><PersonSimpleWalk aria-hidden="true" /><b>{establishment.distance}</b></span> : null}
      </div>
    </section>

    <div className="guest-nearby-detail__cta"><Button className="guest-button guest-button--primary" type="button" onClick={onBookRide}>Book a ride<ArrowRight /></Button></div>
  </div>;
}

const GIFT_PRODUCTS = [
  { group: 'Local Favorites', name: 'Artisan pasalubong box', price: '₱850', availability: 'Available today', image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=700&q=80' },
  { group: 'Local Favorites', name: 'Handwoven market tote', price: '₱680', availability: 'Limited stock', image: 'https://images.unsplash.com/photo-1594223274512-ad4803739b7c?auto=format&fit=crop&w=700&q=80' },
  { group: 'Food & Treats', name: 'Single-origin Philippine coffee', price: '₱420', availability: 'Available today', image: 'https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&w=700&q=80' },
  { group: 'Food & Treats', name: 'Dried mango & cacao set', price: '₱560', availability: 'Available today', image: 'https://images.unsplash.com/photo-1599599810694-57a3e2b5b2b2?auto=format&fit=crop&w=700&q=80' },
  { group: 'Hotel Exclusives', name: 'Cabana embroidered cap', price: '₱750', availability: 'Available today', image: 'https://images.unsplash.com/photo-1521369909029-2afed882baee?auto=format&fit=crop&w=700&q=80' },
  { group: 'Hotel Exclusives', name: 'Cabana slippers & shirt set', price: '₱1,250', availability: 'Available today', image: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=700&q=80' },
  { group: 'Crafts & Keepsakes', name: 'Handmade ceramic keepsake', price: '₱980', availability: 'Limited stock', image: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=700&q=80' },
  { group: 'Crafts & Keepsakes', name: 'Postcard & magnet set', price: '₱280', availability: 'Available today', image: 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?auto=format&fit=crop&w=700&q=80' },
  { group: 'Gift Sets', name: 'Wellness bath set', price: '₱1,100', availability: 'Available today', image: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&w=700&q=80' },
  { group: 'Gift Sets', name: 'Seasonal Manila bundle', price: '₱1,450', availability: 'Limited edition', image: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=700&q=80' },
] as const;

const MENU_ITEM_IMAGE_URLS: Record<string, string> = {
  'a1b-calamari': 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?auto=format&fit=crop&w=600&q=80',
  'a1b-ribeye': 'https://images.unsplash.com/photo-1546964124-0cce460f38ef?auto=format&fit=crop&w=600&q=80',
  'a1b-1': 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=600&q=80',
  'a1b-2': 'https://images.unsplash.com/photo-1546793665-c74683f339c1?auto=format&fit=crop&w=600&q=80',
  'a1b-3': 'https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=600&q=80',
  'a1b-4': 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80',
  'a1b-5': 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=600&q=80',
  'a1b-6': 'https://images.unsplash.com/photo-1476124369491-eea7f0d3b5c5?auto=format&fit=crop&w=600&q=80',
  'a1b-7': 'https://images.unsplash.com/photo-1535399831218-d5bd36d1a5b0?auto=format&fit=crop&w=600&q=80',
  'a1b-8': 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?auto=format&fit=crop&w=600&q=80',
  'a1b-9': 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=600&q=80',
  'a1b-10': 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=600&q=80',
  'a1b-11': 'https://images.unsplash.com/photo-1553530666-ba11a7da3888?auto=format&fit=crop&w=600&q=80',
  'ird-1': 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?auto=format&fit=crop&w=600&q=80',
  'ird-2': 'https://images.unsplash.com/photo-1490474418585-ba9bad8fd0ea?auto=format&fit=crop&w=600&q=80',
  'ird-3': 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=600&q=80',
  'ird-4': 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=600&q=80',
  'ird-5': 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80',
  'ird-6': 'https://images.unsplash.com/photo-1515003190562-c5f5f8f1f4f5?auto=format&fit=crop&w=600&q=80',
  'ird-7': 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&w=600&q=80',
  'ird-8': 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=80',
};

function getMenuItemImage(itemId: string, categoryId = 'dining') {
  return MENU_ITEM_IMAGE_URLS[itemId] ?? getItemThumbnail(itemId, categoryId).src;
}

function PaymentChoice({ provider, roomNumber, value, method, allowPayNow = true, allowRoom = Boolean(roomNumber), onChange, onMethodChange }: { provider: string; roomNumber?: string; value: 'room' | 'pay-now' | null; method: 'card' | 'gcash' | 'maya' | null; allowPayNow?: boolean; allowRoom?: boolean; onChange: (value: 'room' | 'pay-now') => void; onMethodChange: (value: 'card' | 'gcash' | 'maya') => void }) {
  return <fieldset className="guest-payment-choice"><legend>How would you like to pay?</legend><p className="guest-provider-label">{provider}</p><div className="guest-payment-options">{allowRoom ? <button type="button" aria-pressed={value === 'room'} className={value === 'room' ? 'is-active' : ''} onClick={() => onChange('room')}><b>{roomNumber ? `Charge to Room ${roomNumber}` : 'Charge to your room'}</b><small>Add this purchase to your hotel bill and settle it at checkout.</small></button> : null}{allowPayNow ? <button type="button" aria-pressed={value === 'pay-now'} className={value === 'pay-now' ? 'is-active' : ''} onClick={() => onChange('pay-now')}><b>Pay now</b><small>Pay securely using your preferred payment method.</small></button> : null}</div>{allowPayNow && value === 'pay-now' ? <div className="guest-payment-method-sheet" role="dialog" aria-label="Payment methods"><b>Choose a payment method</b><button type="button" className={method === 'card' ? 'is-active' : ''} onClick={() => onMethodChange('card')}><CreditCard />Card</button><button type="button" className={method === 'gcash' ? 'is-active' : ''} onClick={() => onMethodChange('gcash')}>GCash</button><button type="button" className={method === 'maya' ? 'is-active' : ''} onClick={() => onMethodChange('maya')}>Maya</button></div> : null}</fieldset>;
}

type OrderTrayItem = { id: string; name: string; unitPrice: string; quantity: number; image: string };

function LegacyOrderTray({ title, establishment, items, total, roomNumber, onChangeQuantity, onClose, onCheckout }: { title: string; establishment: string; items: OrderTrayItem[]; quantity?: number; total: string; roomNumber?: string; onChangeQuantity: (id: string, delta: number) => void; onClose: () => void; onCheckout: () => void }) {
  void title;
  const [page, setPage] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [fulfillment, setFulfillment] = useState<'room' | 'pickup' | null>(null);
  const [schedule, setSchedule] = useState<'asap' | 'later' | null>(null);
  const [payment, setPayment] = useState<'room' | 'pay-now' | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'gcash' | 'maya' | null>(null);
  const canChargeRoom = Boolean(roomNumber);
  const canContinue = page === 2 ? Boolean(fulfillment) : page === 3 ? Boolean(schedule) : page === 4 ? Boolean(payment) && (payment !== 'pay-now' || Boolean(paymentMethod)) : true;
  const goBack = () => setPage((current) => current === 1 ? 1 : (current - 1) as 1 | 2 | 3 | 4 | 5);
  const next = () => setPage((current) => (current + 1) as 1 | 2 | 3 | 4 | 5);
  return <div className="guest-sheet-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><section className="guest-order-tray guest-order-tray--multipage" role="dialog" aria-modal="true" aria-labelledby="order-tray-title"><div className="guest-order-tray__header"><div>{page > 1 ? <button className="guest-order-tray__back" type="button" onClick={goBack} aria-label="Back"><ArrowLeft /></button> : null}<h2 id="order-tray-title">{page === 1 ? 'Your order' : page === 2 ? 'How would you like to receive your order?' : page === 3 ? (fulfillment === 'pickup' ? 'When would you like to pick it up?' : 'When would you like it delivered?') : page === 4 ? 'How would you like to pay?' : 'Review and confirm'}</h2><p>{establishment}</p></div><button className="guest-order-tray__close" type="button" onClick={onClose} aria-label="Close"><X /></button></div>{page === 1 ? <><div className="guest-order-tray__items">{items.map((item) => <div className="guest-order-tray__item" key={item.id}><Image src={item.image} alt="" width={88} height={88} /><span><b>{item.name}</b><small>{item.unitPrice} each</small></span><div className="guest-menu-quantity"><button type="button" aria-label={`Decrease ${item.name}`} onClick={() => onChangeQuantity(item.id, -1)}><Minus /></button><output>{item.quantity}</output><button type="button" aria-label={`Increase ${item.name}`} onClick={() => onChangeQuantity(item.id, 1)}><Plus /></button></div><button className="guest-order-tray__remove" type="button" onClick={() => onChangeQuantity(item.id, -item.quantity)}>Remove</button></div>)}</div><div className="guest-order-tray__total"><span>Items <b>{items.reduce((count, item) => count + item.quantity, 0)}</b></span><strong>Subtotal <b>{total}</b></strong></div><Button className="guest-button guest-button--primary" type="button" onClick={() => setPage(2)}>Checkout · {total}<ArrowRight /></Button></> : page === 2 ? <><div className="guest-tray-options"><button className={fulfillment === 'room' ? 'is-active' : ''} type="button" disabled={!canChargeRoom} onClick={() => setFulfillment('room')}><b>Deliver to room</b><small>{roomNumber ? `Room ${roomNumber}` : 'Room assignment required'}</small>{fulfillment === 'room' ? <Check /> : null}</button><button className={fulfillment === 'pickup' ? 'is-active' : ''} type="button" onClick={() => setFulfillment('pickup')}><b>Pick up</b><small>Hotel lobby</small>{fulfillment === 'pickup' ? <Check /> : null}</button></div><Button className="guest-button guest-button--primary" type="button" disabled={!canContinue} onClick={next}>Continue<ArrowRight /></Button></> : page === 3 ? <><div className="guest-tray-options guest-tray-options--stacked"><button className={schedule === 'asap' ? 'is-active' : ''} type="button" onClick={() => setSchedule('asap')}><b>As soon as possible</b><small>{fulfillment === 'pickup' ? 'Ready in about 20–30 minutes' : 'Estimated delivery in 30–40 minutes'}</small>{schedule === 'asap' ? <Check /> : null}</button><button className={schedule === 'later' ? 'is-active' : ''} type="button" onClick={() => setSchedule('later')}><b>Schedule for later</b><small>Choose an available date and time</small>{schedule === 'later' ? <Check /> : null}</button></div><Button className="guest-button guest-button--primary" type="button" disabled={!canContinue} onClick={next}>Continue<ArrowRight /></Button></> : page === 4 ? <><PaymentChoice provider={establishment} roomNumber={roomNumber} value={payment} method={paymentMethod} onChange={setPayment} onMethodChange={setPaymentMethod} /><Button className="guest-button guest-button--primary" type="button" disabled={!canContinue} onClick={next}>Review order<ArrowRight /></Button></> : <><div className="guest-order-tray__review"><SummaryRow label="Establishment" value={establishment} /><SummaryRow label="Items" value={`${items.reduce((count, item) => count + item.quantity, 0)}`} /><SummaryRow label="Fulfillment" value={fulfillment === 'room' ? `Deliver to room ${roomNumber}` : 'Pick up · Hotel lobby'} /><SummaryRow label="Schedule" value={schedule === 'asap' ? 'As soon as possible' : 'Scheduled for later'} /><SummaryRow label="Payment" value={payment === 'room' ? `Charge to Room ${roomNumber}` : `Pay now · ${paymentMethod === 'gcash' ? 'GCash' : paymentMethod === 'maya' ? 'Maya' : 'Card'}`} /><SummaryRow label="Subtotal" value={total} /><SummaryRow label="Total" value={total} strong /></div><Button className="guest-button guest-button--primary" type="button" onClick={onCheckout}>{payment === 'room' ? `Charge ${total} to room` : `Pay ${total} now`}<ArrowRight /></Button></>}</section></div>;
}

void LegacyOrderTray;
void LegacyOrderTray2;
void LegacyOrderTray3;

function LegacyOrderTray3({ title, establishment, items, total, roomNumber, onChangeQuantity, onClose, onCheckout }: { title: string; establishment: string; items: OrderTrayItem[]; total: string; roomNumber?: string; onChangeQuantity: (id: string, delta: number) => void; onClose: () => void; onCheckout: () => void }) {
  const [page, setPage] = useState(1);
  const [fulfillment, setFulfillment] = useState<'room' | 'pickup' | null>(null);
  const [schedule, setSchedule] = useState<'asap' | 'later' | null>(null);
  const [payment, setPayment] = useState<'room' | 'pay-now' | null>(null);
  const [method, setMethod] = useState<'card' | 'gcash' | 'maya' | null>(null);
  const count = items.reduce((sum, item) => sum + item.quantity, 0);
  const ready = page === 2 ? Boolean(fulfillment) : page === 3 ? Boolean(schedule) : page === 4 ? Boolean(payment && (payment === 'room' || method)) : true;
  const heading = page === 1 ? title : page === 2 ? 'Complete your order' : page === 3 ? (fulfillment === 'pickup' ? 'When would you like to pick it up?' : 'When would you like it delivered?') : page === 4 ? 'How would you like to pay?' : 'Review and confirm';
  return <div className="guest-sheet-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><section className="guest-order-tray guest-order-tray--multipage" role="dialog" aria-modal="true" aria-labelledby="order-tray-title"><header className="guest-order-tray__header"><div>{page > 1 ? <button className="guest-order-tray__back" type="button" onClick={() => setPage((current) => current - 1)} aria-label="Back"><ArrowLeft /></button> : null}<h2 id="order-tray-title">{heading}</h2>{page === 1 ? <p>{establishment}</p> : null}</div><button className="guest-order-tray__close" type="button" onClick={onClose} aria-label="Close"><X /></button></header><div className="guest-order-tray__scroll">{page === 1 ? <><div className="guest-order-tray__items">{items.map((item) => <div className="guest-order-tray__item" key={item.id}><Image src={item.image} alt="" width={72} height={72} /><span><b>{item.name}</b><small>{item.unitPrice} each</small></span><div className="guest-menu-quantity"><button type="button" aria-label={`Decrease ${item.name}`} onClick={() => onChangeQuantity(item.id, -1)}><Minus /></button><output>{item.quantity}</output><button type="button" aria-label={`Increase ${item.name}`} onClick={() => onChangeQuantity(item.id, 1)}><Plus /></button></div><button className="guest-order-tray__remove" type="button" onClick={() => onChangeQuantity(item.id, -item.quantity)}>Remove</button></div>)}</div></> : page === 2 ? <section className="guest-tray-page"><h3>How would you like to receive your order?</h3><div className="guest-tray-options"><button type="button" className={fulfillment === 'room' ? 'is-active' : ''} disabled={!roomNumber} onClick={() => setFulfillment('room')}><b>Deliver to room</b>{fulfillment === 'room' ? <Check /> : null}</button><button type="button" className={fulfillment === 'pickup' ? 'is-active' : ''} onClick={() => setFulfillment('pickup')}><b>Pick up</b>{fulfillment === 'pickup' ? <Check /> : null}</button></div></section> : page === 3 ? <section className="guest-tray-page"><div className="guest-tray-options guest-tray-options--stacked"><button type="button" className={schedule === 'asap' ? 'is-active' : ''} onClick={() => setSchedule('asap')}><b>As soon as possible</b><small>30–40 minutes</small>{schedule === 'asap' ? <Check /> : null}</button><button type="button" className={schedule === 'later' ? 'is-active' : ''} onClick={() => setSchedule('later')}><b>Schedule for later</b><small>Choose a date and time</small>{schedule === 'later' ? <Check /> : null}</button></div></section> : page === 4 ? <section className="guest-tray-page"><div className="guest-tray-options guest-tray-options--stacked"><button type="button" className={payment === 'room' ? 'is-active' : ''} disabled={!roomNumber} onClick={() => setPayment('room')}><b>Charge to Room {roomNumber}</b><small>Added to your hotel bill.</small>{payment === 'room' ? <Check /> : null}</button><button type="button" className={payment === 'pay-now' ? 'is-active' : ''} onClick={() => setPayment('pay-now')}><b>Pay now</b><small>Choose a payment method.</small>{payment === 'pay-now' ? <Check /> : null}</button></div>{payment === 'pay-now' ? <div className="guest-payment-method-sheet">{(['card', 'gcash', 'maya'] as const).map((option) => <button key={option} type="button" className={method === option ? 'is-active' : ''} onClick={() => setMethod(option)}>{option === 'card' ? 'Card' : option === 'gcash' ? 'GCash' : 'Maya'}</button>)}</div> : null}</section> : <section className="guest-tray-page guest-order-tray__review"><SummaryRow label="Establishment" value={establishment} /><SummaryRow label="Items" value={`${count}`} /><SummaryRow label="Fulfillment" value={fulfillment === 'room' ? `Deliver to room ${roomNumber}` : 'Pick up · Hotel lobby'} /><SummaryRow label="Schedule" value={schedule === 'asap' ? 'As soon as possible · 30–40 minutes' : 'Scheduled for later'} /><SummaryRow label="Payment" value={payment === 'room' ? `Charge to Room ${roomNumber}` : `Pay now · ${method ?? 'Card'}`} /><SummaryRow label="Subtotal" value={total} /><SummaryRow label="Total" value={total} strong /></section>}</div>{page === 1 ? <div className="guest-order-tray__total"><span>Items <b>{count}</b></span><strong>Subtotal <b>{total}</b></strong></div> : null}<footer className="guest-order-tray__footer"><Button className="guest-button guest-button--primary" type="button" disabled={!ready} onClick={() => page === 5 ? onCheckout() : setPage((current) => current + 1)}>{page === 1 ? `Checkout · ${total}` : page === 5 ? (payment === 'room' ? `Charge ${total} to room` : `Pay ${total} now`) : page === 4 ? 'Review order' : 'Continue'}<ArrowRight /></Button></footer></section></div>;
}

function LegacyOrderTray2({ title, establishment, items, total, roomNumber, onChangeQuantity, onClose, onCheckout }: { title: string; establishment: string; items: OrderTrayItem[]; total: string; roomNumber?: string; onChangeQuantity: (id: string, delta: number) => void; onClose: () => void; onCheckout: () => void }) {
  void title;
  const [page, setPage] = useState<1 | 2 | 3>(1);
  const [fulfillment, setFulfillment] = useState<'room' | 'pickup' | null>(null);
  const [schedule, setSchedule] = useState<'asap' | 'later' | null>(null);
  const [payment, setPayment] = useState<'room' | 'pay-now' | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'gcash' | 'maya' | null>(null);
  const itemCount = items.reduce((count, item) => count + item.quantity, 0);
  const canContinue = Boolean(fulfillment && schedule && payment && (payment !== 'pay-now' || paymentMethod));
  const back = () => setPage((current) => current === 1 ? 1 : (current - 1) as 1 | 2 | 3);
  return <div className="guest-sheet-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><section className="guest-order-tray guest-order-tray--multipage" role="dialog" aria-modal="true" aria-labelledby="order-tray-title"><header className="guest-order-tray__header"><div>{page > 1 ? <button className="guest-order-tray__back" type="button" onClick={back} aria-label="Back"><ArrowLeft /></button> : null}<h2 id="order-tray-title">{page === 1 ? 'Your order' : page === 2 ? 'Complete your order' : 'Review and confirm'}</h2><p>{establishment}</p></div><button className="guest-order-tray__close" type="button" onClick={onClose} aria-label="Close"><X /></button></header>{page === 1 ? <><div className="guest-order-tray__items">{items.map((item) => <div className="guest-order-tray__item" key={item.id}><Image src={item.image} alt="" width={88} height={88} /><span><b>{item.name}</b><small>{item.unitPrice} each</small></span><div className="guest-menu-quantity"><button type="button" aria-label={`Decrease ${item.name}`} onClick={() => onChangeQuantity(item.id, -1)}><Minus /></button><output>{item.quantity}</output><button type="button" aria-label={`Increase ${item.name}`} onClick={() => onChangeQuantity(item.id, 1)}><Plus /></button></div><button className="guest-order-tray__remove" type="button" onClick={() => onChangeQuantity(item.id, -item.quantity)}>Remove</button></div>)}</div><div className="guest-order-tray__total"><span>Items <b>{itemCount}</b></span><strong>Subtotal <b>{total}</b></strong></div><Button className="guest-button guest-button--primary" type="button" onClick={() => setPage(2)}>Checkout · {total}<ArrowRight /></Button></> : page === 2 ? <><div className="guest-tray-checkout"><section><h3>How would you like to receive your order?</h3><div className="guest-tray-options"><button className={fulfillment === 'room' ? 'is-active' : ''} type="button" disabled={!roomNumber} onClick={() => setFulfillment('room')}><b>Deliver to room</b><small>{roomNumber ? `Room ${roomNumber}` : 'Room assignment required'}</small>{fulfillment === 'room' ? <Check /> : null}</button><button className={fulfillment === 'pickup' ? 'is-active' : ''} type="button" onClick={() => setFulfillment('pickup')}><b>Pick up</b><small>Hotel lobby</small>{fulfillment === 'pickup' ? <Check /> : null}</button></div></section><section><h3>{fulfillment === 'pickup' ? 'When would you like to pick it up?' : 'When would you like it delivered?'}</h3><div className="guest-tray-options guest-tray-options--stacked"><button className={schedule === 'asap' ? 'is-active' : ''} type="button" disabled={!fulfillment} onClick={() => setSchedule('asap')}><b>As soon as possible</b><small>{fulfillment === 'pickup' ? 'Ready in about 20–30 minutes' : 'Estimated delivery in 30–40 minutes'}</small>{schedule === 'asap' ? <Check /> : null}</button><button className={schedule === 'later' ? 'is-active' : ''} type="button" disabled={!fulfillment} onClick={() => setSchedule('later')}><b>Schedule for later</b><small>Choose an available date and time</small>{schedule === 'later' ? <Check /> : null}</button></div></section><section><h3>How would you like to pay?</h3><PaymentChoice provider={establishment} roomNumber={roomNumber} value={payment} method={paymentMethod} onChange={setPayment} onMethodChange={setPaymentMethod} /></section></div><Button className="guest-button guest-button--primary" type="button" disabled={!canContinue} onClick={() => setPage(3)}>Review order<ArrowRight /></Button></> : <><div className="guest-order-tray__review"><SummaryRow label="Establishment" value={establishment} /><SummaryRow label="Items" value={`${itemCount}`} /><SummaryRow label="Fulfillment" value={fulfillment === 'room' ? `Deliver to room ${roomNumber}` : 'Pick up · Hotel lobby'} /><SummaryRow label="Schedule" value={schedule === 'asap' ? 'As soon as possible' : 'Scheduled for later'} /><SummaryRow label="Payment" value={payment === 'room' ? `Charge to Room ${roomNumber}` : `Pay now · ${paymentMethod === 'gcash' ? 'GCash' : paymentMethod === 'maya' ? 'Maya' : 'Card'}`} /><SummaryRow label="Total" value={total} strong /></div><Button className="guest-button guest-button--primary" type="button" onClick={onCheckout}>{payment === 'room' ? `Charge ${total} to room` : `Pay ${total} now`}<ArrowRight /></Button></>}</section></div>;
}

function OrderTray({ title, establishment, items, total, roomNumber, onChangeQuantity, onClose, onCheckout }: { title: string; establishment: string; items: OrderTrayItem[]; total: string; roomNumber?: string; onChangeQuantity: (id: string, delta: number) => void; onClose: () => void; onCheckout: () => void }) {
  void title;
  const [page, setPage] = useState<'summary' | 'checkout' | 'review'>('summary');
  const [fulfillment, setFulfillment] = useState<'room' | 'pickup' | null>(null);
  const [schedule, setSchedule] = useState<'asap' | 'later' | null>(null);
  const [scheduledDate, setScheduledDate] = useState('Today · Nov 11');
  const [scheduledTime, setScheduledTime] = useState('7:30 PM');
  const [payment, setPayment] = useState<'room' | 'pay-now' | null>(null);
  const [method, setMethod] = useState<'card' | 'gcash' | 'maya' | null>(null);
  const count = items.reduce((sum, item) => sum + item.quantity, 0);
  const ready = Boolean(fulfillment && schedule && (schedule !== 'later' || (scheduledDate && scheduledTime)) && payment && (payment === 'room' || method));
  const paymentLabel = method === 'gcash' ? 'GCash' : method === 'maya' ? 'Maya' : 'Card';

  return (
    <div className="guest-sheet-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="guest-order-tray guest-order-tray--multipage" role="dialog" aria-modal="true" aria-labelledby="order-tray-title">
        <header className="guest-order-tray__header">
          <div className="guest-order-tray__heading">
            {page !== 'summary' ? <button className="guest-order-tray__back" type="button" onClick={() => setPage(page === 'review' ? 'checkout' : 'summary')} aria-label="Back"><ArrowLeft /></button> : null}
            <div><h2 id="order-tray-title">{page === 'summary' ? 'Your order' : page === 'checkout' ? 'Complete your order' : 'Review and confirm'}</h2>{page === 'summary' ? <p>{establishment}</p> : page === 'checkout' ? <p>{establishment}</p> : null}</div>
          </div>
          <button className="guest-order-tray__close" type="button" onClick={onClose} aria-label="Close"><X /></button>
        </header>

        <div className="guest-order-tray__scroll">
          {page === 'summary' ? <div className="guest-tray-page">
            <div className="guest-order-tray__items">{items.map((item) => <div className="guest-order-tray__item" key={item.id}>
              <Image src={item.image} alt="" width={72} height={72} />
              <span><b>{item.name}</b><small>{item.unitPrice} each</small></span>
              <div className="guest-menu-quantity"><button type="button" aria-label={`Decrease ${item.name}`} onClick={() => onChangeQuantity(item.id, -1)}><Minus /></button><output>{item.quantity}</output><button type="button" aria-label={`Increase ${item.name}`} onClick={() => onChangeQuantity(item.id, 1)}><Plus /></button></div>
              <button className="guest-order-tray__remove" type="button" onClick={() => onChangeQuantity(item.id, -item.quantity)}>Remove</button>
            </div>)}</div>
            <div className="guest-order-tray__total"><span>Items <b>{count}</b></span><strong>Subtotal <b>{total}</b></strong></div>
          </div> : null}

          {page === 'checkout' ? <div className="guest-tray-page guest-tray-checkout">
            <section><h3>How would you like to receive your order?</h3><div className="guest-tray-options guest-tray-options--compact">
              <button type="button" className={fulfillment === 'room' ? 'is-active' : ''} disabled={!roomNumber} onClick={() => setFulfillment('room')}><b>Deliver to room</b>{fulfillment === 'room' ? <Check /> : null}</button>
              <button type="button" className={fulfillment === 'pickup' ? 'is-active' : ''} onClick={() => setFulfillment('pickup')}><b>Pick up</b>{fulfillment === 'pickup' ? <Check /> : null}</button>
            </div></section>
            <section><h3>{fulfillment === 'pickup' ? 'When would you like to pick it up?' : 'When would you like it delivered?'}</h3><div className="guest-tray-options guest-tray-options--stacked guest-tray-options--compact">
              <button type="button" disabled={!fulfillment} className={schedule === 'asap' ? 'is-active' : ''} onClick={() => setSchedule('asap')}><b>As soon as possible</b><small>30–40 minutes</small>{schedule === 'asap' ? <Check /> : null}</button>
              <button type="button" disabled={!fulfillment} className={schedule === 'later' ? 'is-active' : ''} onClick={() => setSchedule('later')}><b>Schedule for later</b><small>Choose a date and time</small>{schedule === 'later' ? <Check /> : null}</button>
            </div></section>
            {schedule === 'later' ? <div className="guest-tray-schedule-picker"><div><span>Date</span><div className="guest-tray-schedule-options">{['Today · Nov 11', 'Tomorrow · Nov 12'].map((date) => <button key={date} type="button" className={scheduledDate === date ? 'is-active' : ''} onClick={() => setScheduledDate(date)}>{date}</button>)}</div></div><div><span>Time</span><div className="guest-tray-schedule-options">{['6:30 PM', '7:00 PM', '7:30 PM'].map((time) => <button key={time} type="button" className={scheduledTime === time ? 'is-active' : ''} onClick={() => setScheduledTime(time)}>{time}</button>)}</div></div></div> : null}
            <section><h3>How would you like to pay?</h3><div className="guest-tray-options guest-tray-options--stacked guest-tray-options--compact">
              {roomNumber ? <button type="button" className={payment === 'room' ? 'is-active' : ''} onClick={() => setPayment('room')}><b>Charge to Room {roomNumber}</b><small>Added to your hotel bill.</small>{payment === 'room' ? <Check /> : null}</button> : null}
              <button type="button" className={payment === 'pay-now' ? 'is-active' : ''} onClick={() => setPayment('pay-now')}><b>Pay now</b><small>{method ? `Payment method: ${paymentLabel}` : 'Choose a payment method.'}</small>{payment === 'pay-now' ? <Check /> : null}</button>
            </div>{payment === 'pay-now' ? <div className="guest-payment-method-sheet"><span>Payment method</span>{(['card', 'gcash', 'maya'] as const).map((option) => <button key={option} type="button" className={method === option ? 'is-active' : ''} onClick={() => setMethod(option)}>{option === 'card' ? 'Card' : option === 'gcash' ? 'GCash' : 'Maya'}</button>)}</div> : null}</section>
            <div className="guest-order-tray__price-summary"><SummaryRow label="Items" value={`${count}`} /><SummaryRow label="Subtotal" value={total} strong /></div>
          </div> : null}

          {page === 'review' ? <div className="guest-tray-page guest-order-tray__review"><SummaryRow label="Establishment" value={establishment} /><SummaryRow label="Items" value={`${count}`} /><SummaryRow label="Fulfillment" value={fulfillment === 'room' ? `Deliver to room ${roomNumber}` : 'Pick up · Hotel lobby'} /><SummaryRow label="Schedule" value={schedule === 'asap' ? 'As soon as possible · 30–40 minutes' : `${scheduledDate} · ${scheduledTime}`} /><SummaryRow label="Payment" value={payment === 'room' ? `Charge to Room ${roomNumber}` : `Pay now · ${paymentLabel}`} /><SummaryRow label="Subtotal" value={total} /><SummaryRow label="Total" value={total} strong /></div> : null}
        </div>

        <footer className="guest-order-tray__footer"><Button className="guest-button guest-button--primary" type="button" disabled={page === 'checkout' && !ready} onClick={() => page === 'summary' ? setPage('checkout') : page === 'checkout' ? setPage('review') : onCheckout()}>{page === 'summary' ? 'Checkout' : page === 'checkout' ? 'Review order' : payment === 'room' ? `Charge ${total} to room` : `Pay ${total} now`}<ArrowRight /></Button></footer>
      </section>
    </div>
  );
}

function GiftsSouvenirsScreen({ booking, fulfillment, cart, onChangeQuantity, onOpenCart, giftType, onGiftTypeChange, giftSort, onGiftSortChange, onSelectNearby }: { booking: Booking; fulfillment: 'room' | 'lobby'; cart: Record<string, number>; onChangeQuantity: (name: string, delta: number) => void; onOpenCart: () => void; giftType: string[]; onGiftTypeChange: (value: string[]) => void; giftSort: ListingSort; onGiftSortChange: (value: ListingSort) => void; onSelectNearby: (id: string) => void }) {
  const groups = [...new Set(GIFT_PRODUCTS.map((product) => product.group))];
  const nearbyGifts = NEARBY_ESTABLISHMENTS.filter((item) => item.categoryId === 'gifts' && item.city === booking.city);
  const displayedFulfillment = booking.status === 'completed' ? 'lobby' : fulfillment;
  const visibleProducts = GIFT_PRODUCTS.filter((product) => !giftType.length || giftType.includes(product.group));
  const giftFacets: Facet[] = [{ key: 'sort', label: 'Sort by', single: true, options: LISTING_SORTS.map((option) => ({ value: option.id, label: option.label })), selected: [giftSort], onChange: (next) => onGiftSortChange(next[0] as ListingSort) }, { key: 'type', label: 'Type', options: groups.map((group) => ({ value: group, label: group })), selected: giftType, onChange: onGiftTypeChange }];
  return (
    <div className="guest-stack guest-gifts-screen">
      <div className="guest-establishment-cover">
        <Image src={GIFT_PRODUCTS[0].image} alt="" fill sizes="(max-width: 720px) calc(100vw - 32px), 688px" />
      </div>
      <div className="guest-page-title">
        <p className="guest-eyebrow">Make the most of your stay</p>
        <h1>Gifts &amp; Souvenirs</h1>
        <p>Explore gifts and souvenirs available at the hotel and from nearby independent shops.</p>
        <div className="guest-establishment-meta"><span>Operated by the hotel</span><span><MapPin size={15} /> The Henry Manila · Hotel lobby</span><span>Daily · 8:00 AM–10:00 PM</span></div>
      </div>
      <SectionHeading title="At the hotel" count={`${visibleProducts.length} options`} />
      <ListingControls facets={giftFacets} count={visibleProducts.length} nouns={['option', 'options']} narrowed={giftType.length > 0 || giftSort !== 'recommended'} showCount={false} onClear={() => { onGiftTypeChange([]); onGiftSortChange('recommended'); }} />
      {groups.map((group) => (
        <section key={group}>
          <SectionHeading title={group} />
          <div className="guest-gift-grid">
            {visibleProducts.filter((product) => product.group === group).map((product) => (
                <article className="guest-gift-card" key={product.name}>
                  <div className="guest-gift-card__thumb"><Image src={product.image} alt="" fill sizes="92px" /></div>
                  <div><h2>{product.name}</h2><strong>{product.price}</strong><small>{product.availability} · {displayedFulfillment === 'room' ? 'Deliver to room' : 'Pick up at the lobby'}</small></div>
                  <div className="guest-gift-card__actions">{cart[product.name] ? <div className="guest-menu-quantity"><button type="button" aria-label={`Decrease ${product.name} quantity`} onClick={() => onChangeQuantity(product.name, -1)}><Minus /></button><output aria-live="polite">{cart[product.name]}</output><button type="button" aria-label={`Increase ${product.name} quantity`} onClick={() => onChangeQuantity(product.name, 1)}><Plus /></button></div> : <button className="guest-menu-add guest-menu-add--round" type="button" aria-label={`Add ${product.name}`} onClick={() => onChangeQuantity(product.name, 1)}><Plus /></button>}</div>
                </article>
            ))}
          </div>
        </section>
      ))}
      {Object.values(cart).some((quantity) => quantity > 0) ? <button className="guest-mini-cart" type="button" onClick={onOpenCart}><span><small>Gift order</small><b>{countOf(Object.values(cart).reduce((sum, quantity) => sum + quantity, 0), 'item')}</b></span><strong>{formatPesoAmount(GIFT_PRODUCTS.reduce((sum, product) => sum + parsePesoAmount(product.price) * (cart[product.name] ?? 0), 0))}</strong><CaretRight /></button> : null}
      {nearbyGifts.length ? <section className="guest-nearby-section"><SectionHeading title="Nearby recommendations" /><p className="guest-nearby-description">Nearby shops for gifts, local products, and souvenirs.</p><div className="guest-nearby-list">{nearbyGifts.map((item) => <button className="guest-nearby-card" type="button" key={item.id} onClick={() => onSelectNearby(item.id)}><Image src={item.image} alt="" width={88} height={88} /><span><b>{item.name}</b><small>{item.type}</small>{item.distance ? <small>{item.distance}</small> : null}<p>{item.description}</p></span><CaretRight /></button>)}</div></section> : null}
    </div>
  );
}

void GiftsSouvenirsScreen;

function GiftOrderCartScreen({ fulfillment, onFulfillmentChange, cart, onChangeQuantity, onConfirm, onBack, booking, payment, paymentMethod, onPaymentChange, onPaymentMethodChange }: { fulfillment: 'room' | 'lobby'; onFulfillmentChange: (value: 'room' | 'lobby') => void; cart: Record<string, number>; onChangeQuantity: (name: string, delta: number) => void; onConfirm: () => void; onBack: () => void; booking: Booking; payment: 'room' | 'pay-now' | null; paymentMethod: 'card' | 'gcash' | 'maya' | null; onPaymentChange: (value: 'room' | 'pay-now') => void; onPaymentMethodChange: (value: 'card' | 'gcash' | 'maya') => void }) {
  const checkedOut = booking.status === 'completed';
  const items = GIFT_PRODUCTS.filter((product) => (cart[product.name] ?? 0) > 0);
  const total = items.reduce((sum, product) => sum + parsePesoAmount(product.price) * (cart[product.name] ?? 0), 0);
  return <div className="guest-stack guest-order-cart"><div className="guest-page-title"><p className="guest-eyebrow">Gifts &amp; Souvenirs</p><h1>Your gift order</h1><p>Review your items, choose fulfillment, and select how you&rsquo;d like to pay.</p></div><p className="guest-provider-label">Operated by the hotel</p><div className="guest-order-cart__summary"><span>{countOf(items.reduce((sum, product) => sum + (cart[product.name] ?? 0), 0), 'item')}</span><strong>{formatPesoAmount(total)}</strong></div><div className="guest-order-items">{items.map((product) => <div className="guest-order-item" key={product.name}><div><b>{product.name}</b><small>{product.price} each</small></div><div className="guest-menu-quantity"><button type="button" aria-label={`Decrease ${product.name} quantity`} onClick={() => onChangeQuantity(product.name, -1)}><Minus /></button><output>{cart[product.name]}</output><button type="button" aria-label={`Increase ${product.name} quantity`} onClick={() => onChangeQuantity(product.name, 1)}><Plus /></button></div></div>)}</div><fieldset className="guest-fulfillment-options"><legend>How would you like your order?</legend><div>{!checkedOut ? <button type="button" className={fulfillment === 'room' ? 'is-active' : ''} aria-pressed={fulfillment === 'room'} disabled={!booking.roomNumber} onClick={() => onFulfillmentChange('room')}><b>Deliver to room</b><small>{booking.roomNumber ? `Room ${booking.roomNumber}` : 'Room assignment required'}</small></button> : null}<button type="button" className={fulfillment === 'lobby' || checkedOut ? 'is-active' : ''} aria-pressed={fulfillment === 'lobby' || checkedOut} onClick={() => onFulfillmentChange('lobby')}><b>Pick up at the lobby</b><small>Hotel lobby</small></button></div></fieldset><PaymentChoice allowPayNow={false} provider="Operated by the hotel" roomNumber={booking.roomNumber} value={payment} method={paymentMethod} onChange={onPaymentChange} onMethodChange={onPaymentMethodChange} /><Notice title="Nothing is charged yet">Your room folio changes only after you place the order.</Notice><Button className="guest-button guest-button--primary" type="button" disabled={!items.length || (!checkedOut && fulfillment === 'room' && !booking.roomNumber) || !payment} onClick={onConfirm}>{payment === 'room' ? `Charge ${formatPesoAmount(total)} to room` : 'Choose how to pay'}<ArrowRight /></Button><TextButton onClick={onBack}>Continue shopping</TextButton></div>;
}

function ActionTile({ icon, label, onClick }: { icon: ReactNode; label: string; onClick: () => void }) {
  return <button className="guest-action-tile" onClick={onClick}><span>{icon}</span><b>{label}</b><CaretRight /></button>;
}

void ActionTile;

function ServiceDetail({ kind, booking, online, onBook, onChat }: { kind: 'hotel' | 'vendor'; booking: Booking; online: boolean; onBook: () => void; onChat: () => void }) {
  const vendor = kind === 'vendor';
  const roomLabel = booking.roomNumber ? `room ${booking.roomNumber}` : 'your assigned room';
  return <div className="guest-stack guest-service-detail"><ServiceImage imageKey={vendor ? 'spa' : 'dining'} itemId={vendor ? 'spa' : 'dining'} variant="card" tone={vendor ? 'sage' : 'sand'} icon={vendor ? <Sparkle size={38} /> : <ForkKnife size={38} />} decorative /><div className="guest-page-title"><h1>{vendor ? 'Hilom signature massage' : 'In-room dining'}</h1><p>{vendor ? 'A 90-minute traditional Filipino therapeutic massage, delivered in the on-property spa.' : `Comforting Filipino favorites and all-day classics delivered to ${roomLabel}.`}</p></div><div className="guest-summary"><SummaryRow label="Price" value={vendor ? '₱2,400' : 'From ₱450'} /><SummaryRow label="Availability" value={online ? 'Today · 3 times' : 'Connect to check'} /><SummaryRow label="Provider" value={vendor ? 'Operated by Sans Rival' : 'Operated by the hotel'} /><SummaryRow label="Location" value={vendor ? 'Spa & wellness · The Henry Manila' : booking.property} /><SummaryRow label="Operating hours" value={vendor ? 'Daily · 9:00 AM–10:00 PM' : 'Daily · 6:30 AM–11:00 PM'} /><SummaryRow label="Room" value={booking.roomNumber ? `Room ${booking.roomNumber}` : 'Assigned at arrival'} /><SummaryRow label="Cancellation" value={vendor ? 'Up to 24 hours before' : 'Up to 2 hours before'} /></div>{!online ? <Notice tone="offline" icon={<WifiSlash />} title="Live booking is unavailable">Capacity and price are never queued. Connect to see current times.</Notice> : null}<button className="guest-button guest-button--primary" onClick={onBook}>{online ? (vendor ? 'Choose a time' : 'View menu and order') : 'See connection options'}<ArrowRight /></button>{!online ? <TextButton onClick={onChat}>Message the front desk instead</TextButton> : null}{vendor ? <div className="guest-provisional"><b>Provisional decision</b><p>Confirm that third-party providers accept a 24-hour self-service cancellation window.</p></div> : null}</div>;
}

function EstablishmentChatScreen({ kind, venue, booking, online, onChat }: { kind: 'restaurant' | 'gift'; venue?: RestaurantVenue; booking: Booking; online: boolean; onChat: (message: string) => void }) {
  const restaurant = kind === 'restaurant';
  const name = venue?.name ?? 'Cabana Gift Shop';
  const provider = venue?.operator === 'Hotel operated' ? 'Operated by the hotel' : `Operated by ${venue?.operator ?? 'the hotel'}`;
  const location = venue?.location ?? `${booking.property} · Hotel lobby`;
  const hours = venue?.hours ?? 'Daily · 8:00 AM–10:00 PM';
  const description = venue?.description ?? 'Pasalubong, keepsakes, and thoughtful gifts selected for your stay.';
  const instructions = restaurant
    ? 'Send the item names and quantities you would like in Chat. The front desk will confirm availability, fees, and payment before placing the order.'
    : 'Ask the front desk for the current product list, prices, and delivery or pickup options.';
  const message = restaurant
    ? `Hi! I’d like to see the menu and order from ${name}.`
    : `Hi! I’d like to see the available products from ${name}.`;

  return <div className="guest-stack guest-establishment-chat-screen">{venue ? <ServiceImage imageKey={getServiceImageKey({ id: venue.id, categoryId: 'dining' })} itemId={venue.id} categoryId="dining" variant="card" tone={venue.tone} icon={<Storefront size={38} />} decorative /> : <div className="guest-establishment-chat-screen__cover"><Image src={GIFT_PRODUCTS[0].image} alt="" fill sizes="(max-width: 720px) calc(100vw - 32px), 688px" /></div>}<div className="guest-page-title"><h1>{name}</h1><p>{description}</p><div className="guest-establishment-chat-screen__details"><span>{provider}</span><span>{location}</span><span>{hours}</span><span>{online ? 'Available · Confirm with the front desk' : 'Availability shown when connected'}</span></div></div><div className="guest-establishment-chat-screen__instructions"><b>How ordering works</b><p>{instructions}</p></div><button className="guest-button guest-button--primary" type="button" onClick={() => onChat(message)}>{restaurant ? 'View menu and order' : 'View products and order'}<ArrowRight /></button><TextButton onClick={() => onChat(message)}>Message the front desk</TextButton></div>;
}

const RESTAURANT_MENU_IMAGE_PAGES = [
  '/menus/restaurant-menu-page-1.png',
  '/menus/restaurant-menu-page-2.png',
  '/menus/restaurant-menu-page-3.png',
];

const getRestaurantMenuImages = (venue: RestaurantVenue) => {
  void venue;
  return RESTAURANT_MENU_IMAGE_PAGES;
};

function RestaurantMenuScreen({ venue, onOrder, onBack, onNotifications }: { venue: RestaurantVenue; onOrder: () => void; onBack: () => void; onNotifications: () => void }) {
  const [page, setPage] = useState(0);
  const [previewZoom, setPreviewZoom] = useState(1);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [aboutExpanded, setAboutExpanded] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const suppressPreview = useRef(false);
  const menuImages = getRestaurantMenuImages(venue);
  const currentImage = menuImages[page] ?? menuImages[0];
  const aboutText = `${venue.description} Settle in for an unhurried meal surrounded by the hotel’s signature garden atmosphere, with thoughtful service and a menu that moves easily from morning plates to evening drinks.`;

  const openPreview = () => {
    if (suppressPreview.current) {
      suppressPreview.current = false;
      return;
    }
    setPreviewZoom(1);
    setPreviewOpen(true);
  };

  const handleMenuTouchStart = (event: ReactTouchEvent<HTMLButtonElement>) => {
    touchStartX.current = event.changedTouches[0]?.clientX ?? null;
  };

  const handleMenuTouchEnd = (event: ReactTouchEvent<HTMLButtonElement>) => {
    const start = touchStartX.current;
    const end = event.changedTouches[0]?.clientX;
    touchStartX.current = null;
    if (start === null || end === undefined || menuImages.length < 2) return;
    const delta = end - start;
    if (Math.abs(delta) < 44) return;
    suppressPreview.current = true;
    setPage((current) => delta < 0 ? Math.min(menuImages.length - 1, current + 1) : Math.max(0, current - 1));
  };

  return (
    <div className="guest-stack guest-restaurant-browse guest-restaurant-browse--premium">
      <section className="guest-restaurant-hero" aria-label={`${venue.name} overview`}>
        <ServiceImage imageKey={getServiceImageKey({ id: venue.id, categoryId: 'dining' })} itemId={venue.id} categoryId="dining" variant="card" tone={venue.tone} icon={<ForkKnife size={38} />} decorative />
        <div className="guest-restaurant-hero__scrim" aria-hidden="true" />
        <button className="guest-restaurant-hero__control guest-restaurant-hero__back" type="button" onClick={onBack} aria-label="Back"><ArrowLeft /></button>
        <button className="guest-restaurant-hero__control guest-restaurant-hero__notifications" type="button" onClick={onNotifications} aria-label="Notifications"><Bell /></button>
        <div className="guest-restaurant-hero__copy">
          <h1>{venue.name}</h1>
          <div className="guest-restaurant-top-tags" aria-label="Restaurant details">
            <span>{venue.category}</span>{venue.id === 'apartment-1b' ? <span>Breakfast</span> : null}<span>{venue.operator}</span>
          </div>
        </div>
      </section>

      <section className="guest-restaurant-quick-info" aria-label="Quick information">
        <span className="guest-restaurant-quick-info__location"><MapPin aria-hidden="true" />{venue.location}</span>
        <div><span><small>Hours</small><b>{venue.hours}</b></span><span><small>Availability</small><b>Open now</b></span></div>
      </section>

      <section className="guest-restaurant-about">
        <h2>About</h2>
        <p className={aboutExpanded ? 'is-expanded' : ''}>{aboutText}</p>
        <button className="guest-restaurant-about__read-more" type="button" onClick={() => setAboutExpanded((expanded) => !expanded)}>{aboutExpanded ? 'Show less' : 'Read more'}</button>
      </section>

      <section className="guest-restaurant-good-to-know">
        <h2>Good to know</h2>
        <div className="guest-restaurant-good-to-know__grid">
          {venue.operator.includes('Hotel') ? <span><Storefront aria-hidden="true" /><b>Hotel operated</b></span> : null}
          {venue.cutoff.includes('reservation') || venue.cutoff.includes('24-hour') ? <span><CalendarPlus aria-hidden="true" /><b>Reservations recommended</b></span> : null}
          {venue.menu.some((item) => item.dietary?.length) ? <span><Sparkle aria-hidden="true" /><b>Dietary requests available</b></span> : null}
          {venue.description.toLowerCase().includes('garden') ? <span><House aria-hidden="true" /><b>Garden seating</b></span> : null}
        </div>
      </section>

      <section className="guest-restaurant-menu-image-section guest-restaurant-additional-info">
        <h2>Additional information</h2>
        <p>View the latest information provided by the hotel.</p>
        <div className="guest-restaurant-menu-carousel"><button type="button" className="guest-restaurant-menu-image" onClick={openPreview} onTouchStart={handleMenuTouchStart} onTouchEnd={handleMenuTouchEnd} aria-label={`Open information page ${page + 1}; swipe left or right to change page`}><Image src={currentImage} alt={`${venue.name} information page ${page + 1}`} fill sizes="(max-width: 720px) calc(100vw - 32px), 688px" /></button>{menuImages.length > 1 ? <div className="guest-restaurant-menu-pagination"><div className="guest-restaurant-menu-dots" aria-label="Information pages">{menuImages.map((image, index) => <button key={image} type="button" aria-label={`Show information page ${index + 1}`} aria-current={page === index} className={page === index ? 'is-active' : ''} onClick={() => setPage(index)} />)}</div></div> : null}</div>
      </section>

      <div className="guest-restaurant-browse__cta"><button className="guest-button guest-button--primary" type="button" onClick={onOrder}>Order from {venue.name}<ArrowRight /></button></div>

      {previewOpen ? <div className="guest-restaurant-menu-viewer" role="dialog" aria-modal="true" aria-label={`${venue.name} information preview`} onClick={() => setPreviewOpen(false)}><button type="button" className="guest-restaurant-menu-viewer__close" aria-label="Close information preview" onClick={() => setPreviewOpen(false)}><X /></button>{menuImages.length > 1 ? <button type="button" className="guest-restaurant-menu-viewer__prev" aria-label="Previous information page" onClick={(event) => { event.stopPropagation(); setPage((current) => (current - 1 + menuImages.length) % menuImages.length); }}><ArrowLeft /></button> : null}<div className="guest-restaurant-menu-viewer__image" onClick={(event) => event.stopPropagation()}><Image src={currentImage} alt={`${venue.name} information preview`} fill sizes="92vw" style={{ transform: `scale(${previewZoom})` }} /></div>{menuImages.length > 1 ? <button type="button" className="guest-restaurant-menu-viewer__next" aria-label="Next information page" onClick={(event) => { event.stopPropagation(); setPage((current) => (current + 1) % menuImages.length); }}><ArrowRight /></button> : null}<div className="guest-restaurant-menu-viewer__zoom"><button type="button" onClick={(event) => { event.stopPropagation(); setPreviewZoom((zoom) => Math.max(1, zoom - 0.25)); }}>−</button><span>{Math.round(previewZoom * 100)}%</span><button type="button" onClick={(event) => { event.stopPropagation(); setPreviewZoom((zoom) => Math.min(2.5, zoom + 0.25)); }}>+</button></div></div> : null}
    </div>
  );
}

function RoomChargeDetails({ charge, service, roomLabel, onQuestion }: { charge: ReturnType<typeof getRoomCharges>[number]; service?: ServiceBooking; roomLabel: string; onQuestion: (message: string) => void }) {
  const isDining = Boolean(service?.diningOrder);
  const isTransfer = /airport transfer/i.test(charge.title);
  const rows = isTransfer
    ? [
        ['Pickup location', 'Airport'],
        ['Destination', 'The Henry Manila'],
        ['Pickup date and time', charge.detail],
        ['Vehicle type', 'Hotel sedan'],
        ['Passengers', '2 guests'],
      ]
    : isDining && service?.diningOrder
      ? [
          ...service.diningOrder.items.map((item) => [`${item.name} · ${item.quantity} × ${item.unitPrice}`, formatPesoAmount(parsePesoAmount(item.unitPrice) * item.quantity)]),
          ['Delivery or pickup', service.diningOrder.fulfillment.method === 'delivery' ? `Deliver to ${roomLabel}` : 'Pick up · Hotel lobby'],
          ['Delivery or pickup time', service.diningOrder.fulfillment.timing === 'asap' ? 'As soon as possible' : service.diningOrder.fulfillment.scheduledFor],
        ]
      : [
          ['Selected service', charge.title],
          ['Scheduled date and time', charge.detail],
          ...(service?.title.toLowerCase().includes('massage') ? [['Duration', '90 minutes'], ['Service location', 'Spa & Wellness']] : []),
        ];

  return <div className="guest-folio-details"><h3>Order summary</h3><div className="guest-summary">{rows.map(([label, value]) => <SummaryRow key={label} label={label} value={value} />)}<SummaryRow label="Subtotal" value={charge.amount} /><SummaryRow label="Total" value={charge.amount} strong /><SummaryRow label="Payment method" value={`Charge to Room ${roomLabel}`} /><SummaryRow label="Status" value="Charged to room" /><SummaryRow label="Reference" value={`CHG-${charge.id.replace(/[^a-z0-9]/gi, '').slice(-8).toUpperCase()}`} /></div><button type="button" className="guest-folio-details__question" onClick={(event) => { event.stopPropagation(); onQuestion(`I have a question about the ${charge.title} charge. Could you help me review it?`); }}>Question about this charge? <ArrowRight /></button></div>;
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

function GuestNavIcon({ icon }: { icon: IconSvgElement }) {
  return <HugeiconsIcon icon={icon} size={24} strokeWidth={1.75} aria-hidden="true" focusable="false" />;
}

function NavButton({ label, icon, active, unread = false, onClick }: { label: string; icon: ReactNode; active: boolean; unread?: boolean; onClick: () => void }) {
  return <button aria-label={unread ? `${label}, new message` : label} aria-current={active ? 'page' : undefined} onClick={onClick}><span>{icon}</span><small>{label}</small>{unread ? <i className="guest-bottom-nav__badge" aria-hidden="true" /> : null}</button>;
}
