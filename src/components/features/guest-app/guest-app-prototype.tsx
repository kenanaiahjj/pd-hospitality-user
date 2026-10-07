'use client';

import {
  ArrowLeft,
  ArrowRight,
  Bed,
  Bell,
  BellRinging,
  CalendarPlus,
  CaretRight,
  ChatCircleDots,
  Check,
  CheckCircle,
  Clock,
  ClockCountdown,
  Compass,
  ForkKnife,
  IdentificationCard,
  MapPin,
  Person,
  QrCode,
  Receipt,
  SignOut,
  CaretDown,
  Sparkle,
  Storefront,
  Moped,
  ShieldCheck,
  SuitcaseRolling,
  Lock,
  Car,
  Users,
  WifiSlash,
  X,
  WarningCircle,
  Heart,
} from '@phosphor-icons/react';
import Image from 'next/image';
import { QRCodeSVG } from 'qrcode.react';
import { HugeiconsIcon} from '@hugeicons/react';
import {
  ChevronRightIcon as HugeChevronRightIcon,
  BedSingle02Icon as HugeBedSingleIcon,
  CompassIcon as HugeCompassIcon,
  Home04Icon as HugeHomeIcon,
  MessageCircleMoreIcon as HugeChatIcon,
  ReceiptTextIcon as HugeReceiptTextIcon,
  TrophyIcon as HugeTrophyIcon,
  UserRoundIcon as HugeProfileIcon,
} from '@hugeicons-pro/core-stroke-rounded';
import {
  BedSingle02Icon as HugeBedSingleSolidIcon,
  CompassIcon as HugeCompassSolidIcon,
  Home04Icon as HugeHomeSolidIcon,
  MessageCircleMoreIcon as HugeChatSolidIcon,
  UserRoundIcon as HugeProfileSolidIcon,
} from '@hugeicons-pro/core-solid-rounded';
import { useCallback, useEffect, useRef, useState, type FormEvent, type ReactNode} from 'react';
import { CabanaLockup} from '@/components/ui/cabana-logo';
import { type MapClock } from './nearby-map';
import { CalendarPicker, ExpandableField, StepperField, TimeWheel } from './field-controls';
import { Button, Input } from '@/components/ui';
import {
  ANONYMOUS_SESSION,
  canUseOnPropertyServices,
  bookingFromLookup,
  assignWithComplimentaryUpgrade,
  awaitsHotel,
  bookingCompanions,
  connectBooking,
  convertGuestToAccount,
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
  formatPesoAmount,
  getNotifications,
  getStayEntries,
  hasStayStarted,
  isStayUnderWay,
  getPostAuthScreen,
  emailLoginSession,
  getPrimaryBooking,
  getRoomCharges,
  getRoomChargesTotal,
  canReportRoomReady,
  markRoomReady,
  describeRoomAssignment,
  MINI_APP_CATEGORIES,
  PROTOTYPE_TODAY,
  shiftIsoDay,
  shiftServiceBooking,
  findPastStay,
  summarisePastStay,
  MOCK_SESSION,
  RESTAURANTS,
  SERVICES,
  ssoSession,
  signOutSession,
  getRewards,
  accountActivity,
  restoreAccountActivity,
  findProfileByLookup,
  restoreProfileSession,
  toFinishedStay,
  requestRoomUpgrade,
  approveRoomUpgrade,
  listingSubcategories,
  matchesListingSubcategory,
  bookableServiceDays,
  canBookService,
  cancellationCutoffHours,
  describeCancellationWindow,
  describeServicePaidBy,
  awaitsProvider,
  acceptsPayNow,
  describeServicePayment,
  describeServiceProvider,
  formatServiceDay,
  getCancellationState,
  hoursUntilService,
  parseClockTime,
  SERVICE_SCHEDULES,
  countNightsBetween,
  GUEST_PROFILE,
  maskEmail,
  maskMobile,
  applyPrototypeStayState,
  getPrototypeStayState,
  parsePesoAmount,
  PAST_STAYS,
  type Booking,
  type ProfileMatch,
  type PrototypeStayState,
  type GuestNotification,
  type GuestSession,
  type StayEntry,
  type StayReview,
  type NotificationTone,
  type MiniAppCategoryId,
  type ServiceBooking,
  type RestaurantVenue,
  CHECK_IN_FROM,
  CHECK_OUT_BY,
  summarizeRoomPreferences,
} from './prototype-model';
import { hasSavedDetails, isCompleteCompanion, maskDocument, mergeCompanionRecords, planCompanions } from './prototype-model';
import {
  DEFAULT_RESULTS_VIEW,
  DEFAULT_STAY_SEARCH,
  CancelReservationSheet,
  RATE_PLAN_LABELS,
  canCancelReservation,
  cancellationReminder,
  GettingThere,
  cancelRooms,
  weekdayDate,
  StayCheckoutScreen,
  StayPaymentScreen,
  StayConfirmationScreen,
  StayHotelScreen,
  StayResultsScreen,
  StaySearchSheet,
  bookingFromDraft,
  bookedRoomNumber,
  bookingCancellationSummary,
  isHotelFull,
  addDays,
  type CartLine as StayCartLine,
  cartRooms,
  defaultAllocation,
  emptyGuestDetails,
  findStayHotel,
  heldRooms,
  hotelsForLocation,
  peso,
  quoteStay,
  roomCancellationTerms,
  stayDatesLabel,
  StayAddOnsScreen,
  withAddOns,
  fitAddOns,
  fitPickupToParty,
  promoAccountFor,
  SavedHotelsScreen,
  useSavedHotels,
  clearRecentSearches,
  savePendingVoucher,
  seedSavedHotels,
  type ResultsView,
  type StayAddOn,
  type StayBookingDraft,
  type StayGuestDetails,
  type StaySearch,
} from './stay-booking';
import { PMS_LAST_SYNC, PrototypeControls} from './prototype-controls';
import type { PrototypePage } from './prototype-controls';
import {
  getPropertyImage,
  getServiceImageKey,
  getArrivalServiceImage,
  getCategoryCoverImage,
} from './service-images';
import {
  BrowseSheet,
  ReelFeed,
  RoomScanner,
  RoomUnlocked,
  recommendedPicks,
  buildFeedCandidates,
  buildSearchIndex,
  rankFeed,
  stayContext,
} from './promoted';
import { venueForService } from './promoted/service-venues';
import type { BrowseCategory, FeedAction, FeedClock, FeedEntry } from './promoted';
import { storyImage } from './promoted/story-imagery';
import { ChatComposer, type ChatAttachment } from './chat-composer';
import { StayConfirm } from './stay-invitation';
import { StayReviewForm } from './stay-review-form';
import { GuestTabs } from './guest-tabs';
import {
  AchievementSections,
  BadgeDetail,
  BadgeShelf,
  PointsApply,
  PointsEarned,
  REWARD_MENU,
  RewardDetail,
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
  pendingPoints,
  pointsForCharge,
  pointsExpiry,
  pesosOff,
  redeemReward,
  spendPoints,
  returnPoints,
  maxApplicable,
  redemptionCode,
} from './rewards';
import { clearStoredSession, readAccountStash, readStoredSession, readStoredStayDraft, writeAccountStash, writeStoredSession, writeStoredStayDraft } from './session-storage';
import { AccountSignInCard } from './guest-account';
import { Field, FormScreen, GuestNavIcon, HistoryItem, NavButton, Notice, NotesField, PropertyImage, ReviewBlock, ScreenIntro, SectionHeading, ServiceImage, StaleDataNotice, StatePanel, StayMiniCard, SummaryRow, Tag, TextButton } from './guest-ui';
import { HeroIcon, formatPastStayDates } from './guest-ui';
import { WelcomeScreen } from './welcome-screen';
import { AdditionalGuestsScreen, IdentityStep, RoomPreferencesScreen, passportDate } from './pre-arrival';
import type { PassportFields } from './pre-arrival';
import { EmptyStayHome, HotelBrowse, RoomReadyNotification, StayCard, StayEntryCard, StayOverviewHome, UpcomingBookingCard, VendorFolioQrDialog, airportFor, countNights, defaultFeedClock, describeParty, formatCheckoutDate, formatStayDateRange, getVendorFolioQrValue, listBookingGuests } from './stay-home';
import { EARLY_CHECK_IN, earlyCheckInBookingId } from './guest-shared';
import type { ActiveScreen } from './guest-shared';
import { NEARBY_ESTABLISHMENTS, NearbyDiscoverySection, NearbyEstablishmentScreen, NearbyRecommendations, NearbyRecommendationsPage, nearbyFeedInputs, type NearbyBookingRequest } from './places';
import { GATEWAY_METHOD_LABELS, GatewayCheckout, type GatewayMethod } from './gateway-checkout';
import { HotelEssentialsRow } from './hotel-essentials';
import { PaymentDetailScreen, PaymentsScreen } from './payments';
import { ServicePage } from './service-page';
import { TABLE_VENUE_SERVICE_IDS, isReservation, listingFor } from './vendor-listings';
import { paymentsSummary, recordPayment, refundBookingItems, refundRemainingLinkedPayments, refundServiceLine } from './payments-model';
import { ArrivalCartConfirmation, ArrivalCartDock, ArrivalCartScreen } from './arrival-cart';
import { addToCart, cartFor, cartTotals, removeFromCart, settleCart } from './arrival-cart-model';
import type { AuthMethod, CartLine } from './prototype-model';
import { EstablishmentChatScreen, GIFT_PRODUCTS, LOBBY_SHOP_NAME, RestaurantMenuScreen, RoomChargeDetails, ServiceDetail, describeRoomCharges, getRestaurantMenuImages, readChatOrder } from './dining';
import './guest-app-prototype.css';
import './promoted/promoted.css';
import './rewards/rewards.css';

const isChatScreen = (screen: ActiveScreen) => screen === 'chat';

type ChatMessage = {
  /** The stay this thread belongs to; stamped when the message is added. */
  bookingId?: string;
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

/* After checkout the room is gone: the asks are about the bill and what was left behind. */
const POST_STAY_QUICK_ACTIONS: ChatQuickAction[] = [
  { label: 'A charge', description: 'Question about the bill', message: () => 'I have a question about a charge on my bill from this stay.' },
  { label: 'Lost item', description: 'Something left behind', message: () => 'I think I left something in the room. Could you check for me?' },
  { label: 'Receipt', description: 'A copy of the invoice', message: () => 'Could you send me a copy of my receipt for this stay?' },
  { label: 'Ride', description: 'Back to the airport', message: () => 'Could you arrange a car to the airport for me?' },
];

/* Before arrival there are no towels to change or rooms to fix: the asks are about getting there. */
const PRE_ARRIVAL_QUICK_ACTIONS: ChatQuickAction[] = [
  { label: 'Arrival time', description: 'Tell us when you land', message: () => 'Just letting you know our arrival time: we land in the afternoon and should reach the hotel by 3:00 PM.' },
  { label: 'Airport pick-up', description: 'Arrange a ride in', message: () => 'Could you arrange an airport pick-up for our arrival?' },
  { label: 'Early check-in', description: 'Ask for the room sooner', message: () => 'Is early check-in possible on our arrival day?' },
  { label: 'Special occasion', description: 'Birthday, anniversary…', message: () => 'We’re celebrating a special occasion during our stay. Could you help us plan something?' },
  { label: 'Parking', description: 'Bringing a car', message: () => 'We’re driving in. Is there parking at the hotel?' },
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
  'arrival-cart',
  'arrival-cart-confirmation',
  'marketplace',
  'category-listing',
  'nearby-recommendations',
  'nearby-establishment',
  'gifts-souvenirs',
  'room-upgrades',
  'room-upgrade-confirmation',
  'room-upgrade-success',
  'room-transfer-details',
  'vendor-service',
  'restaurant-menu',
  'service-detail',
  'service-booking',
  'booking-confirmation',
  'booking-blocked',
];

/**
 * How long the mock viewfinder waits before it "finds" the code. Long enough
 * to read as a scan rather than a button press, short enough that nobody
 * watching a demo thinks it has hung.
 */
const SCAN_DETECT_MS = 2000;

const EXPLORE_SEARCH_INDEX = buildSearchIndex();

/** One line under each arrival card, in the guest's terms. */
const ARRIVAL_BLURBS: Record<string, string> = {
  transfer: 'Met at arrivals and driven to the door.',
  'private-car': 'A car and driver for the day, on your schedule.',
  luggage: 'Bags held, or sent ahead to your room.',
  celebration: 'Flowers, cake or a room set for the occasion.',
  'early-check-in': 'Your room from the morning, if it is ready.',
};

/*
  `scanned-early` is not a booking failure but a scan one: the right code before
  the stay has started. It shares the screen because the answer is the same
  place -- arrival services now, the room on arrival day.
*/
/**
 * Why a booking could not proceed. Five, not three: `not-checked-in` used to
 * cover a guest three days out and a guest standing in their room, and the two
 * need opposite things said to them -- one is waiting, the other can act now.
 */
type BlockedReason = 'offline' | 'not-arrived' | 'not-verified' | 'unlock-pending' | 'checked-out' | 'scanned-early' | 'failed' | 'pms-down' | 'scan-failed' | 'no-slot';

/*
  What View booking opens onto. Reached from a trip the app is not following,
  these act on that trip, not on the nearer one: its guests, its upgrade, its
  arrival extras.
*/
const VIEWED_TRIP_SCREENS: ActiveScreen[] = [
  'room-upgrades', 'room-upgrade-confirmation', 'room-upgrade-success', 'room-transfer-details',
  'additional-guests', 'guest-details', 'room-preferences', 'repeat-review',
  'pre-arrival-services', 'arrival-cart', 'arrival-cart-confirmation', 'service-detail', 'vendor-service',
];

/* Booking a hotel starts from Home, so Home stays lit through it. */
const STAY_BOOKING_SCREENS: ActiveScreen[] = ['partner-hotels', 'book-stay', 'book-stay-results', 'book-stay-hotel', 'book-stay-addons', 'book-stay-checkout', 'book-stay-payment', 'book-stay-vouchers', 'book-stay-confirmation'];

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
 * Each step is full bleed: a Henry photograph with a slow CSS drift. There
 * were short films on steps 2 and 3, but their push-in was baked into the
 * footage in whole-pixel steps, so it juddered however it was composited;
 * a still drifting on the compositor is smooth, and needs no pause control.
 */

type GuestAppPrototypeProps = {
  initialSession?: GuestSession;
  initialScreen?: ActiveScreen;
  initialOnline?: boolean;
};


/** Who runs it, by name where there is one: "Hilom Spa & Wellness", not a contract category. */
const providerFor = (service: { id: string; operator: string }) => {
  const venue = venueForService(service.id);
  return venue.kind === 'property' ? describeServiceProvider(service) : `Run by ${venue.name}`;
};
/** A booking's note, as a sentence to add to a message to the hotel. */
const noteSuffix = (service: ServiceBooking) => {
  const note = service.facts?.find((fact) => fact.label === 'Your note')?.value;
  return note ? ` Note: ${note}` : '';
};
/** The guest's own words, as a line in a booking's details. */
const noteFact = (note: string) => (note.trim() ? [{ label: 'Your note', value: note.trim() }] : []);
/** What to suggest a guest might say, by the kind of thing they are booking. */
const serviceNoteHint = (categoryId: string, reservation: boolean) => (
  reservation ? 'Occasion, a high chair, seating preference…'
    : categoryId === 'spa' ? 'Allergies, pressure preference, injuries…'
      : categoryId === 'entertainment' ? 'Dietary needs, mobility, anything about your group…'
        : categoryId === 'rentals' ? 'A child seat, helmet size, when you’ll collect…'
          : 'Anything the provider should know…'
);
/** Who a pay-now charge goes to: the vendor's name where there is one. */
const merchantFrom = (provider: string) => (provider.startsWith('Run by ') ? provider.slice('Run by '.length) : 'the provider');
/** "Friday · November 20 · 11:00 AM" -> "Friday · November 20", for a line that sits above the time. */
const withoutTime = (when: string) => when.replace(/\s*·\s*\d{1,2}:\d{2}\s*[AP]M.*$/i, '');
/** Hours for today and tomorrow; days beyond, where "215 hours" means nothing. */
const timeUntilLabel = (hours: number) => (hours < 48 ? `${hours} ${hours === 1 ? 'hour' : 'hours'} before service` : `${Math.round(hours / 24)} days before service`);

function guestDetailsFromSession(session: GuestSession, rooms: number): StayGuestDetails {
  const name = session.guestName.trim() || GUEST_PROFILE.name;
  const details = emptyGuestDetails(
    name,
    session.email || GUEST_PROFILE.email,
    session.record?.mobile || session.mobile || GUEST_PROFILE.mobile,
    rooms,
  );
  const companions = [...new Set([
    ...session.additionalGuests,
    ...(session.companionRecords ?? []).map((person) => person.name),
  ].map((person) => person.trim()).filter((person) => person && person !== name))];
  return {
    ...details,
    roomLeads: details.roomLeads.map((lead, index) => index === 0 ? name : companions[index - 1] ?? lead),
    requests: session.roomPreferences.note ?? '',
  };
}

/** Chips answer the empty chat's question; the docked cards carry a line of detail. */
function ChatQuickActions({ chips = false, disabled, onPick, preArrival = false, postStay = false }: { chips?: boolean; disabled: boolean; onPick: (action: ChatQuickAction) => void; preArrival?: boolean; postStay?: boolean }) {
  return (
    <div className={`guest-quick-actions${chips ? ' guest-quick-actions--chips' : ''}`} aria-label="Popular requests">
      <div className="guest-quick-actions__rail">
        {(postStay ? POST_STAY_QUICK_ACTIONS : preArrival ? PRE_ARRIVAL_QUICK_ACTIONS : CHAT_QUICK_ACTIONS).map((action) => (
          <button
            key={action.label}
            type="button"
            disabled={disabled}
            title={chips ? action.description : undefined}
            onClick={() => onPick(action)}
          >
            {chips ? action.label : (
              <>
                <span className="guest-quick-actions__copy">
                  <b>{action.label}</b>
                  <small>{action.description}</small>
                </span>
                <CaretRight aria-hidden="true" />
              </>
            )}
          </button>
        ))}
      </div>
    </div>
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

function rentalUnitFor(serviceId: string): { singular: string; plural: string } {
  switch (serviceId) {
    case 'rental':
      return { singular: 'bike', plural: 'bikes' };
    case 'e-bike':
      return { singular: 'e-bike', plural: 'e-bikes' };
    case 'scooter':
      return { singular: 'scooter', plural: 'scooters' };
    case 'motorcycle':
      return { singular: 'motorcycle', plural: 'motorcycles' };
    case 'car-rental':
      return { singular: 'car', plural: 'cars' };
    case 'suv-rental':
      return { singular: 'SUV', plural: 'SUVs' };
    default:
      return { singular: 'rental', plural: 'rentals' };
  }
}

export function GuestAppPrototype({ initialSession, initialScreen, initialOnline }: GuestAppPrototypeProps = {}) {
  const [activeScreen, setActiveScreen] = useState<ActiveScreen>(initialScreen ?? 'entry-hub');
  const activeScreenRef = useRef(activeScreen);
  const [vendorFolioQrOpen, setVendorFolioQrOpen] = useState(false);
  const [session, setSession] = useState<GuestSession>(() => initialSession ?? ANONYMOUS_SESSION);
  /* The selected badge is rendered by the full-page achievement detail route. */
  const [openBadgeId, setOpenBadgeId] = useState<string | null>(null);
  /* Which reward the detail screen is showing. */
  const [selectedRewardId, setSelectedRewardId] = useState<string | null>(null);
  /** The reward just redeemed: what to quote at the desk, and whether the desk was told. */
  const [redeemedReward, setRedeemedReward] = useState<{ code: string; toldDesk: boolean } | null>(null);
  /* Points staged against the booking in progress, in ₱100 blocks. */
  const [appliedPoints, setAppliedPoints] = useState(0);
  /* Only third-party vendors offer pay-now; everything else stays on the room. */
  const [servicePayChoice, setServicePayChoice] = useState<'room' | 'pay-now'>('room');
  const [gatewayOpen, setGatewayOpen] = useState(false);
  /* What the last cart checkout booked, for its one receipt. */
  const [cartReceipt, setCartReceipt] = useState<{ ids: string[]; method?: GatewayMethod }>({ ids: [] });
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
  const [rentalQuantity, setRentalQuantity] = useState(1);
  /* The booking the confirmation screen is about. */
  const [lastServiceBookingId, setLastServiceBookingId] = useState<string | null>(null);
  /* Badges the last confirmed booking tipped over, for the confirmation. */
  const [justEarned, setJustEarned] = useState<string[]>([]);
  const [history, setHistory] = useState<ActiveScreen[]>([]);
  /** The screen the stamped stay pass zooms into, so it can enter out of that zoom. */
  const [passEntranceScreen, setPassEntranceScreen] = useState<ActiveScreen | null>(null);
  const [online, setOnline] = useState(initialOnline ?? true);
  /*
    Conditions the prototype can switch on, for showing and documenting the
    app's error and empty states: the hotel's system out of reach (the app
    shows what it last had), the next booking, message or scan failing once,
    and a catalogue with nothing in it.
  */
  const [pmsDown, setPmsDown] = useState(false);
  const [failNext, setFailNext] = useState({ booking: false, chat: false, scan: false });
  const [emptyCatalogue, setEmptyCatalogue] = useState(false);
  const [pendingEmail, setPendingEmail] = useState('');
  const [code, setCode] = useState('');
  const [codeNotice, setCodeNotice] = useState<string | null>(null);
  /* Null until the guest touches the ID: until then the form shows what is on record. */
  const [primaryPassportFields, setPrimaryPassportFields] = useState<PassportFields | null>(null);
  const codeInputRef = useRef<HTMLInputElement | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [allChatMessages, setAllChatMessages] = useState<ChatMessage[]>([]);
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
  const [exploreSubcategory, setExploreSubcategory] = useState('All');
  const [bookingBlockedReason, setBookingBlockedReason] = useState<BlockedReason>('offline');
  const [roomReadyNotificationBookingId, setRoomReadyNotificationBookingId] = useState<string | null>(null);
  const [roomReadyNotificationFocused, setRoomReadyNotificationFocused] = useState(false);
  /* A push banner for anything else the guest is told: the hotel answering a request. */
  const [pushNotice, setPushNotice] = useState<{ id: string; headline: string; detail: string; screen?: ActiveScreen } | null>(null);
  const [pushFocused, setPushFocused] = useState(false);
  /** The prototype's feed clock; null follows the booking and the prototype's today. */
  const [feedClock, setFeedClock] = useState<FeedClock | null>(null);
  const [feedSheet, setFeedSheet] = useState<'browse' | null>(null);
  /* View booking for a trip from Profile > Stays; absent means the stay the app is following. */
  const [viewedBookingId, setViewedBookingId] = useState<string | null>(null);
  const [staysTab, setStaysTab] = useState<'upcoming' | 'past' | null>(null);
  /* Explore before the scan: this stay's arrival services, or partner hotels to browse and share. */
  const [exploreView, setExploreView] = useState<'stay' | 'hotels'>('stay');
  const [simulatePostStayExpired, setSimulatePostStayExpired] = useState(false);
  /*
    Two sets, because "the bell has stopped nagging me" and "I have read this
    one" are different facts. Opening the inbox marks everything seen, which is
    what clears the dot on the bell; a row keeps its own dot until it is
    actually opened.
  */
  // Unset until the guest picks one: a finished stay opens on what happened, a live one on what is ahead.
  const [stayTabChoice, setStayTab] = useState<'upcoming' | 'past' | null>(null);
  const [expandedChargeId, setExpandedChargeId] = useState<string | null>(null);
  const [selectedPastStayId, setSelectedPastStayId] = useState<string | null>(null);
  const [reviewingStayId, setReviewingStayId] = useState<string | null>(null);
  const [selectedPaymentId, setSelectedPaymentId] = useState<string | null>(null);
  /* What the venue says about the service the service page is showing, when the guest came from a recommendation. */
  const [serviceHighlights, setServiceHighlights] = useState<{ serviceId: string; lines: string[] } | null>(null);
  /*
    The hotel booking in progress: the search, the hotel, the rooms in the
    cart and who sleeps in each. Held here rather than in the screens so Back
    through the flow keeps everything the guest picked.
  */
  const [stayDraft, setStayDraft] = useState<StayBookingDraft>({ search: DEFAULT_STAY_SEARCH, cart: [], allocation: [] });
  const [resultsView, setResultsView] = useState<ResultsView>(DEFAULT_RESULTS_VIEW);
  const [stayDetails, setStayDetails] = useState<StayGuestDetails | null>(null);
  const [stayGatewayMethod, setStayGatewayMethod] = useState<GatewayMethod | null>(null);
  const [confirmedStayId, setConfirmedStayId] = useState<string | null>(null);
  /* "Booking cancelled · ₱X refunded", shown on Home until dismissed. */
  const [cancelNotice, setCancelNotice] = useState<string | null>(null);
  const [cancelSheetOpen, setCancelSheetOpen] = useState(false);
  /* "Garden Suite cancelled. ₱36,420 back to GCash", on View booking after a partial cancel. */
  const [roomCancelNotice, setRoomCancelNotice] = useState<string | null>(null);
  const [selectedStayEntryId, setSelectedStayEntryId] = useState<string | null>(null);
  /*
    The reference a returning guest matched, held between the lookup and the
    code screen. Cleared the moment it is spent, so a later visit to the verify
    screen cannot verify a stale match.
  */
  /* Both ends of a requested ride. Empty until a door opens the form with a trip in mind. */
  const [transferOrigin, setTransferOrigin] = useState('');
  const [transferDestination, setTransferDestination] = useState('');
  const [transferDestinationAddress, setTransferDestinationAddress] = useState('');
  const [rideWhen, setRideWhen] = useState<'now' | 'later'>('now');
  const [rideFlight, setRideFlight] = useState('');
  /* What the guest wants a provider to know: one note per thing being booked, cleared when it is. */
  const [serviceNote, setServiceNote] = useState('');
  const [rideNote, setRideNote] = useState('');
  const [earlyNote, setEarlyNote] = useState('');
  const [upgradeNote, setUpgradeNote] = useState('');
  const [rideDate, setRideDate] = useState('');
  const [rideTime, setRideTime] = useState('10:00');
  /** The open field on the stay and ride forms; one at a time. */
  const [openFormField, setOpenFormField] = useState<'check-in' | 'check-out' | 'ride-date' | 'ride-time' | null>(null);
  const [ridePassengers, setRidePassengers] = useState(2);
  /** The reservation the lookup produced, held between the form and the
      confirmation so both show the guest's own reference rather than a
      fixture's. */
  const [lookupBooking, setLookupBooking] = useState<Booking | null>(null);

  /** Prototype only: put strict reference matching back, to demo not-found. */
  const [strictLookup, setStrictLookup] = useState(false);
  const [profileMatch, setProfileMatch] = useState<ProfileMatch | null>(null);
  const [seenNotificationIds, setSeenNotificationIds] = useState<string[]>([]);
  const [readNotificationIds, setReadNotificationIds] = useState<string[]>([]);
  const [chatNotifications, setChatNotifications] = useState<GuestNotification[]>([]);

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

  /*
    Mobile browsers shrink the visual viewport when the software keyboard
    opens, but the app frame and its fixed actions otherwise keep their old
    height. Fit the frame to the visible area and move the active field clear
    of the dock; Chat has its own composer-specific viewport handling.
  */
  useEffect(() => {
    const viewport = window.visualViewport;
    const mobile = window.matchMedia('(max-width: 719px)');
    if (!viewport) return undefined;

    let fieldFocused = false;
    let keyboardVisible = false;
    let baselineHeight = viewport.height + viewport.offsetTop;
    const getDevice = () => document.querySelector<HTMLElement>('.guest-device');
    const isTextEntry = (target: EventTarget | null): target is HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | HTMLElement => {
      if (target instanceof HTMLInputElement) {
        return !['button', 'checkbox', 'color', 'file', 'hidden', 'image', 'radio', 'range', 'reset', 'submit'].includes(target.type);
      }
      return target instanceof HTMLTextAreaElement
        || target instanceof HTMLSelectElement
        || (target instanceof HTMLElement && target.isContentEditable);
    };
    const clearKeyboardViewport = (device: HTMLElement) => {
      device.removeAttribute('data-keyboard-open');
      device.removeAttribute('data-keyboard-compact');
      device.style.removeProperty('--guest-keyboard-visible-top');
      device.style.removeProperty('--guest-keyboard-visible-height');
      keyboardVisible = false;
    };
    const updateKeyboardViewport = () => {
      const device = getDevice();
      if (!device) return;
      if (!mobile.matches || device.querySelector('.guest-screen--chat')) {
        clearKeyboardViewport(device);
        fieldFocused = false;
        baselineHeight = viewport.height + viewport.offsetTop;
        return;
      }

      const visibleTop = Math.round(viewport.offsetTop);
      const visibleHeight = Math.round(viewport.height);
      const visibleBottom = visibleTop + visibleHeight;
      if (isTextEntry(document.activeElement)) {
        // Keep the pre-keyboard height if the browser has already reduced
        // the visual viewport by the time the resize handler runs. Some
        // mobile browsers update activeElement before delivering focusin.
        if (!fieldFocused && !keyboardVisible && baselineHeight - visibleBottom < 100) {
          baselineHeight = visibleBottom;
        }
        fieldFocused = true;
        if (baselineHeight - visibleBottom < 100) {
          if (keyboardVisible) {
            clearKeyboardViewport(device);
            baselineHeight = visibleBottom;
          }
          return;
        }

        keyboardVisible = true;
        device.dataset.keyboardOpen = 'true';
        if (visibleBottom < 420) device.dataset.keyboardCompact = 'true';
        else device.removeAttribute('data-keyboard-compact');
        device.style.setProperty('--guest-keyboard-visible-top', `${visibleTop}px`);
        device.style.setProperty('--guest-keyboard-visible-height', `${visibleHeight}px`);
        window.requestAnimationFrame(() => {
          const active = document.activeElement;
          if (!keyboardVisible || !isTextEntry(active)) return;
          const field = active.getBoundingClientRect();
          const visibleTop = viewport.offsetTop;
          const viewportBottom = viewport.height + viewport.offsetTop;
          const hiddenByViewport = field.top < visibleTop + 8 || field.bottom > viewportBottom - 8;
          const hiddenByAction = [...device.querySelectorAll<HTMLElement>('.guest-dock, .guest-bottom-nav, .guest-order-tray__footer')]
            .some((action) => {
              const rect = action.getBoundingClientRect();
              return getComputedStyle(action).display !== 'none'
                && rect.bottom > field.top + 4
                && rect.top < field.bottom - 4
                && rect.right > field.left
                && rect.left < field.right;
            });
          if (hiddenByViewport || hiddenByAction) active.scrollIntoView({ block: 'center', inline: 'nearest' });
        });
        return;
      }

      fieldFocused = false;
      if (keyboardVisible && visibleBottom >= baselineHeight - 80) {
        clearKeyboardViewport(device);
        baselineHeight = visibleBottom;
      }
    };
    const handleFocusIn = (event: FocusEvent) => {
      if (!isTextEntry(event.target)) return;
      if (!fieldFocused && !keyboardVisible) baselineHeight = viewport.height + viewport.offsetTop;
      fieldFocused = true;
      window.requestAnimationFrame(updateKeyboardViewport);
    };
    const handleFocusOut = () => {
      window.requestAnimationFrame(() => {
        if (isTextEntry(document.activeElement)) return;
        fieldFocused = false;
        updateKeyboardViewport();
      });
    };

    document.addEventListener('focusin', handleFocusIn);
    document.addEventListener('focusout', handleFocusOut);
    viewport.addEventListener('resize', updateKeyboardViewport);
    viewport.addEventListener('scroll', updateKeyboardViewport);
    window.addEventListener('resize', updateKeyboardViewport);
    mobile.addEventListener('change', updateKeyboardViewport);
    updateKeyboardViewport();

    return () => {
      document.removeEventListener('focusin', handleFocusIn);
      document.removeEventListener('focusout', handleFocusOut);
      viewport.removeEventListener('resize', updateKeyboardViewport);
      viewport.removeEventListener('scroll', updateKeyboardViewport);
      window.removeEventListener('resize', updateKeyboardViewport);
      mobile.removeEventListener('change', updateKeyboardViewport);
      const device = getDevice();
      if (device) clearKeyboardViewport(device);
    };
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
      The booking the guest was part-way through, read now rather than in the
      timer: the draft's own save effect runs in between and would find the
      default draft and clear the record before this could restore it.
    */
    const draft = readStoredStayDraft();

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
      if (draft) {
        setStayDraft(draft.draft);
        setStayDetails(draft.details);
      }
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

  /* The draft is kept only while there is something to come back to: a hotel with rooms in the cart. */
  const draftPristineRef = useRef(true);
  useEffect(() => {
    if (!persistent) return;
    if (draftPristineRef.current) {
      draftPristineRef.current = false;
      return;
    }
    writeStoredStayDraft(stayDraft.hotelId && stayDraft.cart.length ? { draft: stayDraft, details: stayDetails, savedAt: new Date().toISOString() } : null);
  }, [persistent, stayDraft, stayDetails]);

  useEffect(() => {
    if (!pushNotice || pushFocused) return;
    const timeout = window.setTimeout(() => setPushNotice(null), 8_000);
    return () => window.clearTimeout(timeout);
  }, [pushNotice, pushFocused]);

  useEffect(() => {
    if (!roomReadyNotificationBookingId || roomReadyNotificationFocused) return;

    const timeout = window.setTimeout(
      () => setRoomReadyNotificationBookingId(null),
      8_000,
    );

    return () => window.clearTimeout(timeout);
  }, [roomReadyNotificationBookingId, roomReadyNotificationFocused]);

  useEffect(() => {
    activeScreenRef.current = activeScreen;
  }, [activeScreen]);

  /** `viewBooking`: open View booking for that trip, not the one the app is following. */
  const go = (next: ActiveScreen, viewBooking?: string) => {
    if (next === 'rate-detail') setViewedBookingId(viewBooking ?? null);
    // Carried only from View booking into what it opens; any other route in starts clean.
    else if (!(VIEWED_TRIP_SCREENS.includes(next) && (activeScreenRef.current === 'rate-detail' || VIEWED_TRIP_SCREENS.includes(activeScreenRef.current)))) setViewedBookingId(null);
    // Stays opens on what is ahead, not on whichever tab was last looked at.
    if (next === 'stay-history') setStaysTab(null);
    // A transient action notice belongs to the screen where it appeared.
    // Leaving that screen avoids duplicate actions beside the destination item.
    setPushNotice(null);
    setPushFocused(false);
    setPassEntranceScreen(null);
    setRoomCancelNotice(null);
    if (isChatScreen(next)) setHasUnreadChat(false);
    setHistory((items) => [...items, activeScreen]);
    setActiveScreen(next);
    setScrolled(false);
    window.scrollTo?.({ top: 0, behavior: 'smooth' });
  };

  /*
    Forward from a form that has just been submitted, without leaving the form
    behind in history: back from a confirmation should not reopen the filled-in
    request and invite a second one.
  */
  const goReplacing = (next: ActiveScreen) => {
    if (isChatScreen(next)) setHasUnreadChat(false);
    setActiveScreen(next);
    setScrolled(false);
    window.scrollTo?.({ top: 0, behavior: 'smooth' });
  };

  /* A different hotel starts a fresh cart; coming back to the same one keeps it. */
  const openPartnerHotel = (hotelId: string) => {
    setStayGatewayMethod(null);
    setStayDraft((draft) => (draft.hotelId === hotelId ? draft : { ...draft, hotelId, cart: [], allocation: [], addOns: [] }));
    go('book-stay-hotel');
  };

  /* A search naming one hotel goes straight to it, as the booking apps do. */
  const startStaySearch = (search: StaySearch) => {
    setStayDraft((draft) => ({ ...draft, search }));
    const matches = hotelsForLocation(search.location);
    const named = matches.length === 1 && matches[0]!.name.toLowerCase() === search.location.trim().toLowerCase() ? matches[0] : undefined;
    if (named) openPartnerHotel(named.id);
    else go('book-stay-results');
  };

  /** `go` without leaving the current screen in history, for steps Back should skip. */
  const replaceScreen = (next: ActiveScreen) => {
    if (isChatScreen(next)) setHasUnreadChat(false);
    setActiveScreen(next);
    setScrolled(false);
    window.scrollTo?.({ top: 0, behavior: 'smooth' });
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

  const notifyGuestRequest = (id: string, headline: string, detail: string, options: { inbox?: boolean; screen?: GuestNotification['screen'] } = {}) => {
    if (options.inbox) {
      const notification: GuestNotification = {
        id: `notification-request-${id}`,
        tone: 'desk',
        title: headline,
        body: detail,
        time: 'Just now',
        screen: options.screen ?? 'chat',
      };
      setChatNotifications((current) => [notification, ...current.filter((item) => item.id !== notification.id)]);
    }
    setPushNotice({ id, headline, detail, screen: options.screen });
  };

  const sendChatMessage = (body: string, attachment?: ChatAttachment) => {
    const messageBody = body.trim() || (attachment?.kind === 'image' ? 'Image attached.' : 'Voice message attached.');
    setChatDraft('');
    const state = online ? 'Sent' : 'Will send when connected';
    if (attachment?.url.startsWith('blob:')) chatObjectUrlsRef.current.add(attachment.url);
    if (failNext.chat && online) {
      setFailNext((current) => ({ ...current, chat: false }));
      setChatMessages((messages) => [...messages, { from: 'guest', body: messageBody, state: 'Not sent', attachment }]);
      return;
    }
    setChatMessages((messages) => [...messages, { from: 'guest', body: messageBody, state, attachment }]);
    const notificationId = `chat-${Date.now()}`;
    notifyGuestRequest(
      notificationId,
      online ? 'Request sent' : 'Request saved',
      online ? 'The front desk received your message.' : 'This message will send when you reconnect.',
      { inbox: true, screen: 'chat' },
    );
    if (!online) return;
    setSending(true);
    window.setTimeout(() => {
      const productCatalogRequest = /see the available products/i.test(messageBody);
      const checkedOut = describeStayStatus(contextBooking).status === 'checked-out';
      const establishment = messageBody.match(/from (.+?)\.$/i)?.[1] ?? 'the establishment';
      const catalogImages = productCatalogRequest
        ? GIFT_PRODUCTS.slice(0, 2).map((product) => product.image)
        : undefined;
      const deskReply = messageBody.includes('towel')
        ? `We’ll bring two fresh towels to ${contextRoom.toLowerCase()} shortly.`
        : productCatalogRequest
          ? checkedOut
            ? `Here is the current ${establishment} product catalog. Send the item names and quantities you’re interested in, and we’ll check stock and prices. Since you’ve checked out, the front desk will confirm the total, take payment there, and add the purchase to your stay’s total charges.`
            : `Here is the current ${establishment} product catalog. Send the item names and quantities you would like. The front desk will confirm stock and prices before adding the approved total to ${contextRoom} for settlement at checkout.`
          : 'Thanks. The front desk has received your request.';
      /*
        An order sent through the desk is still an order. With no backend yet,
        the desk's side is simulated: the items named in the message are posted
        to the room bill, the way the front desk would, and the order shows on
        My Stay. A message naming nothing on the menu is not treated as one.
      */
      const order = chatOrderVenue && !productCatalogRequest && !checkedOut ? readChatOrder(chatOrderVenue, messageBody) : null;
      if (order) {
        const hour = clockHour;
        const orderBooking: ServiceBooking = {
          id: `service-chat-${contextBooking.id}-${Date.now()}`,
          bookingId: contextBooking.id,
          title: order.venue,
          scheduledFor: `${formatServiceDay(PROTOTYPE_TODAY).long} · ${clockLabel(`${String(hour).padStart(2, '0')}:00`)}`,
          scheduledDate: PROTOTYPE_TODAY,
          scheduledHour: hour,
          bookedAt: PROTOTYPE_TODAY,
          amount: order.total,
          status: 'confirmed',
          paymentStatus: 'charged-to-room',
          paymentMethod: 'room',
          provider: 'Front desk',
          items: order.items,
          summary: `${order.items.reduce((sum, item) => sum + item.quantity, 0)} ${order.items.length === 1 && order.items[0]!.quantity === 1 ? 'item' : 'items'} · ordered through the front desk`,
          facts: [
            { label: 'Ordered through', value: 'Front desk chat' },
            { label: 'Your message', value: messageBody },
            { label: 'Posted by', value: 'The front desk, to your room bill' },
          ],
        };
        setSession((cur) => ({ ...cur, serviceBookings: [orderBooking, ...cur.serviceBookings] }));
      }
      // Anything that names no menu item is an ordinary message, answered as one.
      const reply = order
        ? `Got it: ${order.items.map((item) => `${item.quantity} × ${item.name}`).join(', ')}. We’ve added ${order.total} to ${contextRoom} for settlement at checkout.`
        : deskReply;
      setChatMessages((messages) => [...messages, { from: 'desk', body: reply, state: 'Seen', images: catalogImages }]);
      if (!isChatScreen(activeScreenRef.current)) setHasUnreadChat(true);
      setSending(false);
    }, 850);
  };

  const sendQuickMessage = (body: string) => sendChatMessage(body);

  /* A message that did not go is sent again as itself, in the same place in the thread. */
  const retryChatMessage = (index: number) => {
    const failed = chatMessages[index];
    if (!failed) return;
    setAllChatMessages((messages) => messages.filter((message) => message !== failed));
    sendChatMessage(failed.body, failed.attachment);
  };

  /* When the app cannot book it, the desk can: the request goes to them, and waits on My Stay. */
  const sendBookingToDesk = () => {
    const request: ServiceBooking = {
      id: `service-desk-${selectedService.id}-${contextBooking.id}`,
      bookingId: contextBooking.id,
      serviceId: selectedService.id,
      title: selectedService.name,
      scheduledFor: `${formatServiceDay(serviceDate ?? PROTOTYPE_TODAY).long} · ${serviceTime}`,
      scheduledDate: serviceDate ?? PROTOTYPE_TODAY,
      scheduledHour: parseClockTime(serviceTime).hour,
      bookedAt: PROTOTYPE_TODAY,
      amount: selectedService.price.replace(/^From\s+/i, ''),
      status: 'confirmed',
      paymentStatus: 'pending-confirmation',
      summary: `${serviceTime} · sent to the front desk`,
      facts: [
        { label: 'Sent to', value: 'The front desk, who books it for you' },
        { label: 'Status', value: 'Waiting for the desk to confirm' },
      ],
    };
    setSession((cur) => ({ ...cur, serviceBookings: [request, ...cur.serviceBookings.filter((service) => service.id !== request.id)] }));
    setChatMessages((messages) => [
      ...messages,
      { from: 'guest', body: `The app couldn’t book ${selectedService.name} for ${formatServiceDay(serviceDate ?? PROTOTYPE_TODAY).long} at ${serviceTime}. Could you book it for me?`, state: 'Sent' },
      { from: 'desk', body: `Of course. We’ll book ${selectedService.name} and confirm here. It shows on My Stay in the meantime.`, state: 'Seen' },
    ]);
    notifyGuestRequest(request.id, `${request.title} requested`, 'The front desk will confirm this in chat.');
    setSelectedStayEntryId(request.id);
    goReplacing('chat');
  };

  /* Ordering opens the chat already knowing which venue it is about. */
  const openRestaurantChat = (venue: RestaurantVenue) => {
    const room = contextBooking.roomNumber ? `Room ${contextBooking.roomNumber}` : 'my room folio';
    const guestMessage = `I’d like to order from ${venue.name}. Please add the confirmed total to ${room} for settlement at checkout.`;
    const genericWelcome = 'Good afternoon, Ana. How can we help with your stay?';
    setChatOrderVenue(venue.name);
    setChatDraft('');
    setChatMessages((messages) => [
      ...(messages.length === 1 && messages[0].body === genericWelcome ? [] : messages),
      { from: 'guest', body: guestMessage, state: 'Sent' },
    ]);
    notifyGuestRequest(`order-chat-${contextBooking.id}-${Date.now()}`, 'Order request sent', `The front desk will help with your order from ${venue.name}.`, { inbox: true, screen: 'chat' });
    setSending(true);
    go('chat');
    window.setTimeout(() => {
      const menuImages = getRestaurantMenuImages(venue);
      setChatMessages((messages) => [
        ...messages,
        { from: 'desk', body: 'Of course. What would you like to order?', state: 'Seen', images: menuImages },
        { from: 'desk', body: `Send the item names, quantities, and any special requests. We’ll confirm availability and the total, then add the approved order to ${room} for settlement at checkout.`, state: 'Seen' },
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
    setRideFlight('');
    setRideNote('');
    go('transfer-booking');
  };

  /* Airport to hotel, on arrival day. */
  const openArrivalRide = () => openRideRequest({ from: airportFor(contextBooking), to: contextBooking.property, date: contextBooking.checkIn });
  /* Hotel to airport, now: offered on checkout day and during the desk window. */
  const openDepartureRide = () => openRideRequest({ from: contextBooking.property, to: airportFor(contextBooking) });

  const openRideRequestChat = () => {
    const { from, to } = rideEnds();
    const checkedOut = describeStayStatus(contextBooking).status === 'checked-out';
    const checkoutDayDeparture = !checkedOut && to === airportFor(contextBooking) && contextBooking.checkOut <= PROTOTYPE_TODAY;
    const [hours = 10, minutes = 0] = rideTime.split(':').map(Number);
    const clock = `${((hours + 11) % 12) + 1}:${String(minutes).padStart(2, '0')} ${hours >= 12 ? 'PM' : 'AM'}`;
    const schedule = (rideWhen === 'later' && rideDate && rideTime ? ` on ${formatServiceDay(rideDate).long} at ${clock}` : ' now') + (rideFlight.trim() ? `, meeting flight ${rideFlight.trim().toUpperCase()}` : '');
    const guestMessage = `I’d like to request a ride from ${from} to ${to} for ${ridePassengers} ${ridePassengers === 1 ? 'guest' : 'guests'}${schedule}.${checkoutDayDeparture ? ' Please add the ₱1,200 fare to my room charges.' : ''}${rideNote.trim() ? ` Note: ${rideNote.trim()}` : ''}`;
    // An airport ride is a booking with a fixed fare; it belongs on My Stay, not only in the chat.
    const airport = airportFor(contextBooking);
    let rideBookingId: string | undefined;
    if (from === airport || to === airport) {
      const rideDay = rideWhen === 'later' && rideDate ? rideDate : PROTOTYPE_TODAY;
      const rideBooking: ServiceBooking = {
        id: `service-ride-${contextBooking.id}-${rideDay}-${hours}${minutes}`,
        bookingId: contextBooking.id,
        serviceId: 'transfer',
        title: 'Airport transfer',
        scheduledFor: `${formatServiceDay(rideDay).long} · ${rideWhen === 'later' ? clock : 'As soon as possible'}`,
        scheduledDate: rideDay,
        scheduledHour: rideWhen === 'later' ? hours : undefined,
        bookedAt: PROTOTYPE_TODAY,
        amount: '₱1,200',
        status: 'confirmed',
        paymentStatus: 'pending-confirmation',
        summary: `${rideWhen === 'later' ? clock : 'Leaving now'} · ${from === airport ? `${airport} → hotel` : `Hotel → ${airport}`}`,
        facts: [
          { label: 'Pick up', value: from },
          { label: 'Drop off', value: to },
          ...(rideFlight.trim() ? [{ label: 'Flight', value: rideFlight.trim().toUpperCase() }] : []),
          { label: 'Passengers', value: `${ridePassengers}` },
          ...noteFact(rideNote),
          { label: 'Status', value: 'Waiting for the hotel to confirm the driver' },
        ],
      };
      rideBookingId = rideBooking.id;
      setSession((cur) => ({ ...cur, serviceBookings: [rideBooking, ...cur.serviceBookings.filter((service) => service.id !== rideBooking.id)] }));
    }
    setChatOrderVenue(null);
    setChatDraft('');
    setRideNote('');
    setChatMessages((messages) => [...messages, { from: 'guest', body: guestMessage, state: 'Sent' }]);
    notifyGuestRequest(
      rideBookingId ?? `ride-chat-${contextBooking.id}-${Date.now()}`,
      'Airport transfer requested',
      checkedOut ? 'The front desk will confirm the fare and availability in chat.' : 'The front desk will confirm the driver and pickup time in chat.',
      rideBookingId ? {} : { inbox: true, screen: 'chat' },
    );
    setSending(true);
    goReplacing('chat');
    window.setTimeout(() => {
      const reply = checkedOut
        ? 'Thanks. We’ll confirm vehicle availability, the fare, and accepted payment methods here. Since you’ve checked out, the front desk will take payment before the ride and add the paid fare to your stay’s total charges.'
        : checkoutDayDeparture
          ? 'Thanks. We’ll confirm the driver and pick-up time here, and add the ₱1,200 fare to your room charges.'
        : 'Thanks. We’ll confirm availability, vehicle details, estimated fare, and pickup instructions here shortly.';
      setChatMessages((messages) => [...messages, { from: 'desk', body: reply, state: 'Seen' }]);
      setSending(false);
    }, 850);
  };

  /*
    Stay changes are requests the desk answers, like early check-in: each one
    is sent, sits on My Stay awaiting the hotel, and can be withdrawn there.
    They used to leave only a chat draft, so nothing showed what had been asked.
  */
  const requestStayChange = (change: { id: string; serviceId: string; title: string; day: string; hour: number; time: string; amount: string; summary: string; facts: { label: string; value: string }[]; message: string; reply: string }) => {
    const existing = session.serviceBookings.find((service) => service.id === change.id && service.status === 'confirmed');
    if (existing) {
      setSelectedStayEntryId(existing.id);
      go('stay-entry');
      return;
    }
    const request: ServiceBooking = {
      id: change.id,
      bookingId: contextBooking.id,
      serviceId: change.serviceId,
      title: change.title,
      scheduledFor: `${formatServiceDay(change.day).long} · ${change.time}`,
      scheduledDate: change.day,
      scheduledHour: change.hour,
      bookedAt: PROTOTYPE_TODAY,
      amount: change.amount,
      status: 'confirmed',
      paymentStatus: 'pending-confirmation',
      summary: change.summary,
      facts: change.facts,
    };
    setSession((cur) => ({ ...cur, serviceBookings: [request, ...cur.serviceBookings.filter((service) => service.id !== request.id)] }));
    setChatMessages((messages) => [
      ...messages,
      { from: 'guest', body: change.message, state: online ? 'Sent' : 'Will send when connected' },
      { from: 'desk', body: change.reply, state: 'Seen' },
    ]);
    notifyGuestRequest(
      request.id,
      `${request.title} requested`,
      online ? 'Waiting for the hotel to confirm.' : 'Saved on this device. It will send when you reconnect.',
    );
    if (!isChatScreen(activeScreen)) go('chat');
  };

  const openExtensionChat = () => {
    const nextDay = shiftIsoDay(contextBooking.checkOut, 1);
    requestStayChange({
      id: `service-extension-${contextBooking.id}`,
      serviceId: 'stay-extension',
      title: 'Extra night',
      day: contextBooking.checkOut,
      hour: 12,
      time: `until ${formatServiceDay(nextDay).short}`,
      amount: '₱5,000',
      summary: `One more night · check out ${formatServiceDay(nextDay).short}`,
      facts: [
        { label: 'New check-out', value: `${formatServiceDay(nextDay).long} · ${CHECK_OUT_BY}` },
        { label: 'Room', value: `The same room, if the hotel has it free` },
        { label: 'If approved', value: '₱5,000, added to your room bill' },
      ],
      message: `I’d like to extend my stay by one night, checking out on ${formatServiceDay(nextDay).long}. Is my current room available?`,
      reply: 'Thanks. We’re checking your room for another night and will confirm here. Nothing is charged until we do.',
    });
  };

  const openLateCheckoutChat = () => {
    requestStayChange({
      id: `service-late-checkout-${contextBooking.id}`,
      serviceId: 'late-checkout',
      title: 'Late checkout',
      day: contextBooking.checkOut,
      hour: 14,
      time: '2:00 PM',
      amount: 'Fee to confirm',
      summary: `Until 2:00 PM · instead of ${CHECK_OUT_BY}`,
      facts: [
        { label: 'Check out by', value: `2:00 PM instead of ${CHECK_OUT_BY}` },
        { label: 'Fee', value: 'The hotel confirms it, if there is one' },
        { label: 'Status', value: 'Waiting for the hotel to confirm' },
      ],
      message: `I’d like to request late checkout until 2:00 PM on ${formatServiceDay(contextBooking.checkOut).long}. Is it available, and is there a fee?`,
      reply: 'Noted. We’ll confirm late checkout and any fee here. Nothing changes until we do.',
    });
  };

  const showNav = ['stay-overview', 'partner-hotels', 'book-stay', 'book-stay-results', 'book-stay-hotel', 'book-stay-addons', 'book-stay-checkout', 'book-stay-payment', 'book-stay-vouchers', 'book-stay-confirmation', 'pre-arrival-services', 'arrival-cart', 'arrival-cart-confirmation', 'marketplace', 'category-listing', 'nearby-recommendations', 'nearby-establishment', 'gifts-souvenirs', 'room-upgrades', 'room-upgrade-confirmation', 'room-upgrade-success', 'room-transfer-details', 'vendor-service', 'service-detail', 'restaurant-menu', 'service-booking', 'booking-confirmation', 'booking-blocked', 'my-stay', 'notifications', 'stay-entry', 'payments', 'payment-detail', 'cancel-before-cutoff', 'cancel-after-cutoff', 'folio', 'chat', 'room-qr-midstay', 'stay-review', 'stay-review-sent', 'profile', 'stay-history', 'saved-hotels', 'stay-detail', 'rate-detail', 'rewards', 'reward-detail', 'badge-detail'].includes(activeScreen);
  const showPrimaryNav = showNav && !isChatScreen(activeScreen) && (session.auth === 'authenticated' || session.bookings.length > 0);
  const isWelcome = activeScreen === 'entry-hub';
  const primaryBooking = getPrimaryBooking(session.bookings, session.activeBookingId);
  const showNoBookingExplore = session.auth === 'authenticated' && session.bookings.length === 0;
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

  const viewedTrip = viewedBookingId && VIEWED_TRIP_SCREENS.includes(activeScreen)
    ? session.bookings.find((item) => item.id === viewedBookingId)
    : undefined;
  const contextBooking = viewedTrip ?? primaryBooking ?? displayBooking;
  const followedBooking = displayBooking;
  /** The prototype clock's hour: the one chosen, else the stay's own default. */
  const clockHour = (feedClock ?? defaultFeedClock(contextBooking)).hour;
  /*
    One front-desk thread per stay. Requests made for next month's booking
    were showing up in the chat for this one, room number and all.
  */
  const chatMessages = allChatMessages.filter((message) => (message.bookingId ?? contextBooking.id) === contextBooking.id);
  const setChatMessages = (update: (messages: ChatMessage[]) => ChatMessage[]) => {
    const bookingId = contextBooking.id;
    setAllChatMessages((messages) => update(messages).map((message) => (message.bookingId ? message : { ...message, bookingId })));
  };
  /** What this stay's own hotel offers: a Manila-only row stays in Manila. */
  // The prototype's "empty catalogue" condition empties every listing at once.
  const stayVenues = emptyCatalogue ? [] : RESTAURANTS.filter(offeredIn(contextBooking.city));
  const stayServices = emptyCatalogue ? [] : SERVICES.filter(offeredIn(contextBooking.city));
  const selectedService = SERVICES.find((service) => service.id === selectedServiceId) ?? SERVICES.find((service) => service.id === 'spa')!;
  const serviceIsRental = selectedService.categoryId === 'rentals';
  const rentalUnit = rentalUnitFor(selectedService.id);
  const serviceUnitPrice = parsePesoAmount(selectedService.price);
  /* A table is free to hold: the meal is ordered and paid for at the venue. */
  const reservation = isReservation(selectedService.id);
  const servicePrice = reservation ? 0 : serviceUnitPrice * (serviceIsRental ? rentalQuantity : 1);
  /*
    Staged points, held to what this booking can use. The party or quantity can
    shrink after points were chosen, and points never pay more than the
    booking costs or more than the balance holds.
  */
  const usablePoints = Math.min(appliedPoints, maxApplicable(pointsBalance(session), formatPesoAmount(servicePrice)));
  /* What the booking costs once staged points come off it. */
  const serviceCharge = formatPesoAmount(Math.max(0, servicePrice - pesosOff(usablePoints)));
  /* Room, card or nothing -- decided by the gate, never by the form. */
  const servicePayment = reservation ? 'complimentary' : describeServicePayment(selectedService.price);
  /* Before arrival everything is arranged into one cart and paid once; in the stay each booking stands alone. */
  const preArrival = !hasStayStarted(contextBooking);
  const cartLines = cartFor(session, contextBooking.id);
  const cartSummary = cartTotals(cartLines);
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
    if (service.paymentStatus === 'pending-confirmation' || awaitsProvider(service) || awaitsHotel(service)) return true;
    const cutoffHours = cancellationCutoffHours(cutoffFor(service));
    return cutoffHours !== null && getCancellationState(hoursUntilService(service, PROTOTYPE_TODAY, clockHour), cutoffHours) === 'self-service';
  };

  const stayEntries = getStayEntries(session, primaryBooking);
  const stayTab = stayTabChoice ?? (primaryBooking?.status === 'completed' ? 'past' : 'upcoming');
  const visibleStayEntries = stayTab === 'upcoming' ? stayEntries.upcoming : stayEntries.past;

  const notifications = [...chatNotifications, ...getNotifications(session, primaryBooking)];
  const unreadNotifications = notifications.filter((item) => !seenNotificationIds.includes(item.id)).length;

  const openNotifications = () => {
    setSeenNotificationIds(notifications.map((item) => item.id));
    go('notifications');
  };

  const openNotification = (item: GuestNotification) => {
    setReadNotificationIds((current) => current.includes(item.id) ? current : [...current, item.id]);
    if (item.entryId) setSelectedStayEntryId(item.entryId);
    go(item.screen);
  };

  /*
    The clock's day moves the stay, not only the feed. "Day 2" used to change
    what Explore showed while My Stay still said check-out was tomorrow; now the
    stay and its bookings shift so today really is that day of it.
  */
  const changePrototypeClock = (clock: FeedClock) => {
    const booking = primaryBooking;
    if (booking) {
      const offset = defaultFeedClock(booking).dayOfStay - clock.dayOfStay;
      if (offset) {
        setSession((current) => ({
          ...current,
          bookings: current.bookings.map((item) => (item.id === booking.id
            ? {
                ...item,
                checkIn: shiftIsoDay(item.checkIn, offset),
                checkOut: shiftIsoDay(item.checkOut, offset),
                roomVerification: item.roomVerification ? { ...item.roomVerification, at: shiftIsoDay(item.roomVerification.at, offset) } : undefined,
              }
            : item)),
          serviceBookings: current.serviceBookings.map((service) => (service.bookingId === booking.id ? shiftServiceBooking(service, offset) : service)),
        }));
      }
    }
    setFeedClock(clock);
  };

  /* The desk's side of an upgrade: approve it, then the room is prepared and made ready. */
  const upgradeAwaitingDesk = primaryBooking?.roomUpgrade?.status === 'requested' ? primaryBooking : undefined;
  /*
    The hotel's side of what only it can promise: a driver, a room early, a
    later checkout, another night. Each request waits until the desk answers;
    the answer is recorded on the booking, posted to Notifications and pushed
    as a banner, and a "no" refunds what was paid for it.
  */
  // Upgrades have their own approval (it moves the guest to a new room), under PMS events.
  const waitingOnHotel = session.serviceBookings.filter((service) => service.bookingId === contextBooking.id && service.serviceId !== 'room-upgrade' && awaitsHotel(service));
  const answerHotelRequest = (service: ServiceBooking, approve: boolean) => {
    if (!online) return;
    const paid = service.paymentStatus === 'paid';
    const method = service.paymentMethod === 'card' || service.paymentMethod === 'gcash' || service.paymentMethod === 'maya' ? GATEWAY_METHOD_LABELS[service.paymentMethod] : 'how you paid';
    // "Friday, December 11": the card's "Friday · December 11" reads oddly in a sentence.
    const day = formatServiceDay(service.scheduledDate).long.replace(' · ', ', ');
    const flight = service.facts?.find((fact) => fact.label === 'Flight')?.value;
    const refund = paid ? `The ${service.amount} is on its way back to ${method}.` : 'Nothing was charged.';
    const kind = service.serviceId;
    // "your table at Kape Lab Manila", "your late checkout": lower only the first letter, never a venue's name.
    const what = `${service.title.charAt(0).toLowerCase()}${service.title.slice(1)}`;
    const status = approve
      ? kind === 'transfer' ? 'Driver confirmed · Ramon D., white Toyota Hiace (NBC 4127)'
        : kind === 'early-check-in' ? `Confirmed · ${service.amount} added to your room bill`
          : 'Confirmed by the hotel'
      : `Not available · ${paid ? `refunded to ${method}` : 'no charge'}`;
    const body = approve
      ? kind === 'transfer' ? `Your driver is confirmed for ${day}: Ramon D. will meet you at arrivals with a Cabana sign, in a white Toyota Hiace (NBC 4127).${flight ? ` We’re tracking ${flight}, so a delay is no problem.` : ''}`
        : kind === 'early-check-in' ? `Good news: your room will be ready from ${EARLY_CHECK_IN.time} on ${day}. ${service.amount} will be added to your room bill, due at checkout.`
          : `Good news: your ${what} is confirmed for ${day}.${service.paymentStatus === 'pending-confirmation' && parsePesoAmount(service.amount) ? ` The ${service.amount} goes on your room bill.` : ''}`
      : kind === 'transfer' ? `Sorry, we can’t arrange the airport pickup on ${day}. ${refund} Metered taxis wait outside arrivals.`
        : kind === 'early-check-in' ? `We’re full the night before, so we can’t have your room ready early on ${day}. ${refund} Check-in is from ${CHECK_IN_FROM}, and we’re happy to hold your bags until then.`
          : `Sorry, we couldn’t get your ${what} on ${day}. ${refund}`;
    setSession((current) => {
      const refunded = !approve && paid ? refundServiceLine(current, service.id) : current;
      const base = approve ? refunded : returnPoints(refunded, [service.id]);
      return {
        ...base,
        serviceBookings: base.serviceBookings.map((item) => (item.id === service.id
          ? {
              ...item,
              hotelDecision: approve ? 'confirmed' as const : 'declined' as const,
              // A room-charge request, approved, becomes a charge on the room.
              ...(approve
                ? item.paymentStatus === 'pending-confirmation' ? { paymentStatus: parsePesoAmount(item.amount) ? 'charged-to-room' as const : 'complimentary' as const } : {}
                : { status: 'cancelled' as const, paymentStatus: paid ? 'refunded' as const : item.paymentStatus }),
              facts: item.facts?.flatMap((fact) => {
                if (fact.label === 'Status') return [{ ...fact, value: status }];
                if (kind === 'early-check-in' && fact.label === 'If approved') {
                  return approve ? [{ ...fact, label: 'Room bill' }] : [];
                }
                return [fact];
              }),
            }
          : item)),
        bookings: !approve && kind === 'early-check-in'
          ? base.bookings.map((booking) => (booking.id === service.bookingId ? { ...booking, earlyCheckIn: undefined } : booking))
          : base.bookings,
      };
    });
    setChatMessages((messages) => [...messages, { from: 'desk', body, state: 'Seen' }]);
    // The answer reaches the guest wherever they are: a push, and the entry in Notifications.
    // The detail says what is now true -- when, and any charge -- not "confirmed" twice.
    const confirmedDetail = status === 'Confirmed by the hotel'
      ? `${service.scheduledFor.replace(' · ', ', ')}${service.paymentStatus === 'pending-confirmation' && parsePesoAmount(service.amount) ? ` · ${service.amount} on your room` : ''}`
      : status.replace(/^Confirmed · /, '');
    setPushNotice({ id: service.id, headline: approve ? `${service.title} confirmed` : `${service.title} not available`, detail: approve ? confirmedDetail : paid ? `Refunded to ${method}` : 'The hotel couldn’t confirm it' });
  };
  const hotelAnswerEvents = waitingOnHotel.flatMap((service) => {
    const icon = service.serviceId === 'transfer' ? <Car /> : <Clock />;
    const name = `${service.title.charAt(0).toLowerCase()}${service.title.slice(1)}`;
    const unavailable = online ? undefined : 'Needs a connection';
    return [
      { icon, label: `Confirm ${name}`, detail: 'The hotel says yes; the guest is notified.', onClick: () => answerHotelRequest(service, true), unavailable },
      { icon: <X />, label: `Decline ${name}`, detail: service.serviceId === 'early-check-in' ? 'No charge. The guest is notified.' : 'Cancelled, refunded if paid, and the guest is notified.', onClick: () => answerHotelRequest(service, false), unavailable },
    ];
  });

  /* A fresh device: no saved hotels, recent searches, saved offer or half-made booking. */
  const clearDeviceData = () => {
    seedSavedHotels([]);
    clearRecentSearches();
    savePendingVoucher(null);
    setStayDraft({ search: DEFAULT_STAY_SEARCH, cart: [], allocation: [], addOns: [] });
    setStayDetails(null);
  };

  /* A nearby table is confirmed through the vendor integration; the meal is paid there. */
  const reserveNearbyTable = (place: (typeof NEARBY_ESTABLISHMENTS)[number], request: { day: string; time: string; party: number; requests?: string }) => {
    const asks = request.requests?.trim();
    const [hours = 19, minutes = 0] = (() => { const m = request.time.match(/(\d{1,2}):(\d{2})\s*([AP]M)/i); return m ? [(Number(m[1]) % 12) + (m[3]!.toUpperCase() === 'PM' ? 12 : 0), Number(m[2])] : [19, 0]; })();
    const table: ServiceBooking = {
      id: `service-table-${place.id}-${request.day}-${hours}${minutes}`,
      bookingId: contextBooking.id,
      title: `Table at ${place.name}`,
      scheduledFor: `${formatServiceDay(request.day).long} · ${request.time}`,
      scheduledDate: request.day,
      scheduledHour: hours,
      bookedAt: PROTOTYPE_TODAY,
      // Holding a table is free; the meal is paid at the venue, never to the room.
      amount: '',
      status: 'confirmed',
      paymentStatus: 'pay-at-provider',
      categoryId: 'dining',
      provider: place.name,
      // The title names the venue; above it, only where it is.
      place: place.name,
      placeDetail: place.address,
      partySize: request.party,
      summary: `${request.time} · ${request.party} ${request.party === 1 ? 'guest' : 'guests'} · ${place.type}`,
      facts: [
        { label: 'Guests', value: `${request.party}` },
        ...(asks ? [{ label: 'Requests', value: asks }] : []),
        { label: 'Status', value: `Confirmed by ${place.name}` },
      ],
    };
    setSession((current) => ({ ...current, serviceBookings: [table, ...current.serviceBookings.filter((item) => item.id !== table.id)] }));
    notifyGuestRequest(
      table.id,
      'Table reserved',
      `${place.name} · ${request.time}`,
    );
    setSelectedStayEntryId(table.id);
    go('stay-entry');
  };

  const bookNearbyPlace = (place: (typeof NEARBY_ESTABLISHMENTS)[number], request: NearbyBookingRequest) => {
    const quote = place.paymentIntegration;
    const amount = quote
      ? quote.amount * (quote.basis === 'guest' ? request.party : quote.basis === 'unit' ? request.quantity ?? 1 : 1)
      : 0;
    const payNowMethod = request.paymentMethod && request.paymentMethod !== 'room' ? request.paymentMethod : undefined;
    const paidNow = Boolean(payNowMethod && quote && amount > 0);
    const chargedToRoom = Boolean(request.paymentMethod === 'room' && quote && amount > 0);
    const { hour, minute } = parseClockTime(request.time);
    const id = 'service-nearby-' + place.id + '-' + request.day + '-' + hour + minute;
    const existing = session.serviceBookings.find((item) => item.id === id && item.status === 'confirmed');
    if (existing) {
      setSelectedStayEntryId(existing.id);
      go('stay-entry');
      return;
    }
    const rentals = place.categoryId === 'rentals';
    const booking: ServiceBooking = {
      id,
      bookingId: contextBooking.id,
      title: place.type + ' at ' + place.name,
      scheduledFor: formatServiceDay(request.day).long + ' · ' + request.time,
      scheduledDate: request.day,
      scheduledHour: hour,
      bookedAt: PROTOTYPE_TODAY,
      ...(chargedToRoom ? { roomChargePostedAt: PROTOTYPE_TODAY } : {}),
      amount: paidNow || chargedToRoom ? formatPesoAmount(amount) : '',
      status: 'confirmed',
      categoryId: place.categoryId === 'gifts' ? 'services' : place.categoryId,
      provider: place.name,
      place: place.name,
      placeDetail: place.address,
      ...(rentals ? { rentalQuantity: request.quantity ?? 1 } : { partySize: request.party }),
      summary: request.time + ' · ' + (rentals
        ? (request.quantity ?? 1) + ((request.quantity ?? 1) === 1 ? ' rental' : ' rentals')
        : request.party + (request.party === 1 ? ' guest' : ' guests')),
      ...(paidNow && payNowMethod
        ? { paymentStatus: 'paid' as const, paymentMethod: payNowMethod }
        : chargedToRoom
          ? { paymentStatus: 'charged-to-room' as const, paymentMethod: 'room' as const }
          : { paymentStatus: 'pay-at-provider' as const }),
      facts: [
        { label: 'Provider', value: place.name },
        ...(rentals ? [{ label: 'Rentals', value: String(request.quantity ?? 1) }] : [{ label: 'Guests', value: String(request.party) }]),
        ...(request.requests ? [{ label: 'Note', value: request.requests }] : []),
        { label: 'Payment', value: paidNow ? 'Paid directly to ' + place.name : chargedToRoom ? 'Charged to Room ' + contextBooking.roomNumber : 'Pay the provider directly · no room charge' },
        { label: 'Status', value: 'Confirmed by ' + place.name },
      ],
    };
    const withBooking = {
      ...session,
      serviceBookings: [booking, ...session.serviceBookings.filter((item) => item.id !== booking.id)],
    };
    setSession(paidNow && payNowMethod
      ? recordPayment(withBooking, {
          id: 'pay-' + booking.id,
          paidAt: PROTOTYPE_TODAY,
          kind: 'service',
          title: booking.title,
          detail: place.name,
          amount,
          method: payNowMethod,
          bookingId: contextBooking.id,
          items: [{ id: booking.id, title: booking.title, amount }],
          refunded: 0,
        })
      : withBooking);
    notifyGuestRequest(
      booking.id,
      paidNow ? 'Booking paid and confirmed' : 'Booking confirmed',
      paidNow
        ? formatPesoAmount(amount) + ' paid to ' + place.name
        : chargedToRoom
          ? formatPesoAmount(amount) + ` added to Room ${contextBooking.roomNumber}.`
          : 'Pay ' + place.name + ' directly when you arrive.',
      { screen: 'stay-entry' },
    );
    setSelectedStayEntryId(booking.id);
    go('stay-entry');
  };

  const simulateUpgradeApproved = () => {
    if (!upgradeAwaitingDesk || !online) return;
    const id = upgradeAwaitingDesk.id;
    const upgrade = upgradeAwaitingDesk.roomUpgrade;
    setSession((current) => approveRoomUpgrade(current, id));
    if (upgrade) notifyGuestRequest(`upgrade-${id}`, 'Room upgrade approved', `${upgrade.newRoomType}${upgrade.offeredRoomNumber ? ` · Room ${upgrade.offeredRoomNumber}` : ''}`, { inbox: true, screen: 'my-stay' });
    window.setTimeout(() => setSession((current) => ({ ...current, bookings: current.bookings.map((booking) => booking.id === id && booking.roomUpgrade?.status === 'preparing' ? { ...booking, roomUpgrade: { ...booking.roomUpgrade, status: 'ready' } } : booking) })), 2500);
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

  /* The booked type is full when the hotel assigns rooms: the next one up, free, and the guest is told. */
  const simulateFreeUpgrade = () => {
    if (!eligibleRoomAssignBooking || !online) return;
    const before = eligibleRoomAssignBooking.roomType;
    setSession((current) => assignWithComplimentaryUpgrade(current, eligibleRoomAssignBooking.id));
    const after = assignWithComplimentaryUpgrade(session, eligibleRoomAssignBooking.id).bookings.find((item) => item.id === eligibleRoomAssignBooking.id);
    setPushNotice({ id: `free-upgrade-${eligibleRoomAssignBooking.id}`, headline: 'You’ve been upgraded', detail: `${after?.roomType ?? 'A better room'} instead of ${before} · no extra charge`, screen: 'rate-detail' });
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


  /*
    The gate, resolved once per render. Every surface that asks "can this
    guest book, charge, or order" reads this rather than re-deriving it, so
    the tab bar and the buttons inside it cannot disagree.
  */
  const bookingSlot = describeBookingSlot(contextBooking);
  /* The feed owns its whole screen: no app bar, no page padding or scroll. */
  const reelsOnScreen = activeScreen === 'marketplace' && !bookingSlot.locked;
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
  /*
    This guest's own history. Empty for an account that has not stayed yet.
    A stay the guest has just checked out of is still a `Booking` rather than
    an entry in `pastStays`, so it is read in as finished -- otherwise history
    skipped the stay they had just left.
  */
  /*
    A day after checkout the front desk closes and the stay is history: it
    lives in Profile, and Home and the tab bar go back to a guest with no
    current booking. Only "Just checked out" keeps the stay in front.
  */
  const hasCurrentStay = Boolean(primaryBooking) && !(checkedOutNav && !postStayWindow.deskOpen);
  const pastStays = [
    ...(primaryBooking && primaryBooking.status === 'completed' && !session.pastStays.some((stay) => stay.id === primaryBooking.id)
      ? [toFinishedStay(session, primaryBooking)]
      : []),
    ...session.pastStays,
  ];
  const managedReviewStayId = reviewingStayId
    ?? (hasCurrentStay ? contextBooking.id : [...pastStays].sort((a, b) => b.checkOut.localeCompare(a.checkOut))[0]?.id);
  const activeChatActions = checkedOutNav
    ? POST_STAY_QUICK_ACTIONS
    : hasStayStarted(contextBooking) ? CHAT_QUICK_ACTIONS : PRE_ARRIVAL_QUICK_ACTIONS;
  const chatRequestUnavailable = !primaryBooking
    ? 'Needs a stay'
    : checkedOutNav && !postStayWindow.deskOpen ? 'The front desk chat is closed' : undefined;
  const lateCheckoutUnavailable = !primaryBooking
    ? 'Needs a stay'
    : primaryBooking.checkOut !== PROTOTYPE_TODAY || primaryBooking.status === 'completed'
      ? 'Available on checkout day before checkout'
      : undefined;
  const requestPrototypeRoomUpgrade = () => {
    if (!primaryBooking) return;
    const upgrade = ROOM_UPGRADES[0];
    if (!upgrade) return;
    const next = requestRoomUpgrade(session, primaryBooking.id, upgrade);
    if (next === session) return;
    setSession(next);
    setSelectedUpgradeId(upgrade.id);
    notifyGuestRequest(`service-upgrade-${primaryBooking.id}`, 'Room upgrade requested', 'The hotel will confirm the room and price.');
    goReplacing('room-upgrade-success');
  };
  const guestRequestEvents = [
    ...activeChatActions.map((action) => ({
    icon: <ChatCircleDots />,
    label: `Send ${action.label.toLowerCase()} request`,
    detail: 'Runs the guest request flow and sends a push banner plus an inbox notification.',
    onClick: () => action.label === 'Late checkout' ? openLateCheckoutChat() : sendQuickMessage(action.message(contextRoom)),
    unavailable: chatRequestUnavailable ?? (action.label === 'Late checkout' ? lateCheckoutUnavailable : undefined),
    })),
    {
      icon: <Bed />,
      label: 'Request a room upgrade',
      detail: 'Sends an upgrade request and notifies the guest; the hotel confirms the room and price.',
      onClick: requestPrototypeRoomUpgrade,
      unavailable: !primaryBooking
        ? 'Needs a stay'
        : !online
          ? 'Needs a connection'
          : !canUseOnPropertyServices(primaryBooking)
            ? 'Verify the room first'
            : primaryBooking.roomUpgrade ? 'An upgrade is already in progress' : undefined,
    },
  ];
  const [autoDetectScans, setAutoDetectScans] = useState(true);
  const stayReview = session.reviews.find((review) => review.bookingId === contextBooking.id);
  const reviewPageStayId = reviewingStayId ?? contextBooking.id;
  const reviewPageStay = pastStays.find((stay) => stay.id === reviewPageStayId);
  const reviewPageBooking = session.bookings.find((booking) => booking.id === reviewPageStayId);
  const reviewPageReview = session.reviews.find((review) => review.bookingId === reviewPageStayId);

  const saveReviewForStay = (bookingId: string, rating: StayReview['rating'], comment: string) => {
    setSession((current) => ({
      ...current,
      reviews: [
        ...current.reviews.filter((review) => review.bookingId !== bookingId),
        { bookingId, rating, comment, submittedAt: PROTOTYPE_TODAY },
      ],
    }));
  };

  const saveStayReview = (rating: StayReview['rating'], comment: string) => {
    saveReviewForStay(contextBooking.id, rating, comment);
  };

  const submitStayReview = (rating: StayReview['rating'], comment: string) => {
    saveReviewForStay(reviewPageStayId, rating, comment);
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
    if (failNext.scan) {
      setFailNext((current) => ({ ...current, scan: false }));
      setBookingBlockedReason('scan-failed');
      replaceScreen('booking-blocked');
      return;
    }
    setSession((current) => verifyRoomPresence(current, primaryBooking.id, 'scan'));
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
    // A slot the vendor actually offers: a rooftop has no 1:30 PM.
    const offered = listingFor(serviceId).times;
    setServiceTime(offered.includes('1:30 PM') ? '1:30 PM' : offered[0] ?? '1:30 PM');
    // The party the booking is for, not one: a couples massage for 1 was the default.
    setServicePartySize(Math.max(1, contextBooking.guestCount));
    setRentalQuantity(1);
    setServiceNote('');
    setAppliedPoints(0);
    setServicePayChoice('room');
    setGatewayOpen(false);
    if (!online) { setBookingBlockedReason('offline'); go('booking-blocked'); return; }
    if (!canBookService(contextBooking, serviceId)) {
      setBookingBlockedReason(blockedReasonFor(contextBooking));
      go('booking-blocked');
      return;
    }
    go('service-booking');
  };

  const openExploreItem = (itemId: string) => {
    const venue = RESTAURANTS.find((restaurant) => restaurant.id === itemId);
    if (venue) {
      setSelectedRestaurantId(venue.id);
      go('restaurant-menu');
      return;
    }

    /* The thing itself, as the category listing opens it: the Hilom massage
       has a page of its own, everything else books itself. */
    const service = SERVICES.find((entry) => entry.id === itemId);
    if (!service) return;
    setSelectedCategory(service.categoryId);
    if (service.id === 'spa') {
      setSelectedServiceId('spa');
      go('vendor-service');
    } else {
      // Every vendor has a page before its booking form, whichever list the guest came from.
      setSelectedServiceId(service.id);
      setServiceHighlights(null);
      go('service-detail');
    }
  };

  /* "Start exploring" lands on the feed's first reel, behind the same gate. */
  const openExploreIntro = () => {
    if (primaryBooking && !canUseOnPropertyServices(primaryBooking)) {
      go(bookingSlot.screen);
      return;
    }
    go('marketplace');
  };

  /** Every reel resolves to somewhere the app already goes. */
  const runFeedAction = (action: FeedAction) => {
    setFeedSheet(null);
    if (action.kind === 'item') openExploreItem(action.id);
    else if (action.kind === 'nearby') { setSelectedNearbyEstablishmentId(action.id); go('nearby-establishment'); }
    else if (action.kind === 'screen') go(action.screen);
    else if (action.kind === 'departure-ride') openDepartureRide();
    else openLateCheckoutChat();
  };

  /*
    A recommendation opens the thing's own page. Venues, nearby places and the
    gift shop already have one; every other catalogue item used to skip to its
    booking form, so it gets the shared service page first.
  */
  const openPick = (entry: FeedEntry) => {
    const { action } = entry;
    const service = action.kind === 'item' && !RESTAURANTS.some((venue) => venue.id === action.id) && action.id !== 'spa'
      ? SERVICES.find((item) => item.id === action.id)
      : undefined;
    if (!service) { runFeedAction(action); return; }
    setFeedSheet(null);
    setSelectedCategory(service.categoryId);
    setSelectedServiceId(service.id);
    setServiceHighlights({ serviceId: service.id, lines: entry.story.slides.map((slide) => slide.detail).filter((line): line is string => Boolean(line)) });
    go('service-detail');
  };

  const openBrowseCategory = (id: string) => {
    setFeedSheet(null);
    if (id === 'gifts-souvenirs') { go('gifts-souvenirs'); return; }
    if (id === 'nearby') { setSelectedCategory('dining'); go('nearby-recommendations'); return; }
    setSelectedCategory(id as MiniAppCategoryId);
    go('category-listing');
  };

  /*
    For you: the catalogue as reels, ordered for this guest right now (see
    promoted/feed-model.ts). Explore mixes them; the home's rings play them
    one venue at a time.
  */
  const stayFeed = (booking: Booking) => {
    const nights = Math.max(1, countNightsBetween(booking.checkIn, booking.checkOut));
    const clock = feedClock ?? defaultFeedClock(booking);
    return rankFeed(
      stayContext({
        nights,
        guestCount: booking.guestCount,
        companions: bookingCompanions(session, booking).length,
        booked: session.serviceBookings
          .filter((service) => service.bookingId === booking.id && service.status !== 'cancelled')
          .map((service) => service.serviceId)
          .filter((id): id is string => Boolean(id)),
      }, clock),
      buildFeedCandidates({ nearby: nearbyFeedInputs(booking.city) }),
    // A weekend-only event is not promoted to a stay with no weekend in it.
    ).filter((entry) => !(SERVICE_SCHEDULES[entry.itemId] && bookableServiceDays(booking, PROTOTYPE_TODAY, entry.itemId).length === 0));
  };

  /* "Open now" on a nearby place reads the same clock as the feed. */
  const mapClock: MapClock = { date: PROTOTYPE_TODAY, hour: clockHour };

  /*
    Everything that can refuse a service booking, asked before a guest is sent
    to pay and before anything is held. A pay-now guest used to meet these only
    after the gateway had taken the money, and be told nothing was charged.
  */
  const serviceGate = (booking: Booking | undefined): booking is Booking => {
    if (!online) {
      setBookingBlockedReason('offline');
      go('booking-blocked');
      return false;
    }
    if (pmsDown || failNext.booking) {
      setFailNext((current) => ({ ...current, booking: false }));
      setBookingBlockedReason(pmsDown ? 'pms-down' : 'failed');
      go('booking-blocked');
      return false;
    }
    if (!booking || !canBookService(booking, selectedService.id)) {
      // Not a network problem, and it must not claim to be one.
      setBookingBlockedReason(booking ? blockedReasonFor(booking) : 'not-arrived');
      go('booking-blocked');
      return false;
    }
    if (!bookableServiceDays(booking, PROTOTYPE_TODAY, selectedService.id).length) {
      setBookingBlockedReason('no-slot');
      go('booking-blocked');
      return false;
    }
    return true;
  };

  /* Pay-now: the gateway opens only for a booking that can go through. */
  const startServicePayment = () => {
    if (serviceGate(getPrimaryBooking(session.bookings, session.activeBookingId))) setGatewayOpen(true);
  };

  const confirmService = (paidWith?: GatewayMethod) => {
    setGatewayOpen(false);
    const booking = getPrimaryBooking(session.bookings, session.activeBookingId);
    // Already vetted before the gateway opened: a payment taken is never refused afterwards.
    const vetted = paidWith ? Boolean(booking) : serviceGate(booking);
    if (!vetted || !booking) return;
    // The room by default; a third-party vendor may be paid now through the gateway. Free ones cost nothing.
    const payment: 'room' | 'paid' | 'complimentary' = servicePayment === 'complimentary'
      ? 'complimentary'
      : paidWith && acceptsPayNow(selectedService) ? 'paid' : 'room';

    const days = bookableServiceDays(booking, PROTOTYPE_TODAY, selectedService.id);
    const day = serviceDate && days.includes(serviceDate) ? serviceDate : days[0]!;
    const slotTime = SERVICE_SCHEDULES[selectedService.id]?.time ?? serviceTime;
    const { hour } = parseClockTime(slotTime);
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
      goReplacing('booking-confirmation');
      return;
    }

    const serviceBooking: ServiceBooking = {
      id,
      bookingId: booking.id,
      title: selectedService.name,
      scheduledFor: `${formatServiceDay(day).long} · ${slotTime}`,
      scheduledDate: day,
      scheduledHour: hour,
      bookedAt: PROTOTYPE_TODAY,
      serviceId: selectedService.id,
      // A day rental is a window with a return, not a moment.
      ...(selectedService.categoryId === 'rentals'
        ? { summary: `${slotTime} · return by 8:00 PM · ${rentalQuantity} ${rentalQuantity === 1 ? rentalUnitFor(selectedService.id).singular : rentalUnitFor(selectedService.id).plural}` }
        : reservation
          ? { summary: `${slotTime} · Table for ${servicePartySize} · order at the venue` }
          : {}),
      ...(selectedService.categoryId === 'rentals'
        ? { rentalQuantity }
        : { partySize: servicePartySize }),
      /* What is actually charged: points come off before anything sees it. */
      amount: formatPesoAmount(Math.max(0, servicePrice - pesosOff(usablePoints))),
      status: 'confirmed',
      provider: providerFor(selectedService),
      paymentStatus: payment === 'room' ? 'charged-to-room' : payment === 'paid' ? 'paid' : 'complimentary',
      paymentMethod: payment === 'room' ? 'room' : payment === 'paid' ? paidWith : undefined,
      ...(serviceNote.trim() ? { facts: noteFact(serviceNote) } : {}),
    };

    const booked: GuestSession = {
      ...session,
      serviceBookings: [...session.serviceBookings, serviceBooking],
      // Room charges go to the folio; a vendor paid through the gateway never touches it.
      folioTotal: payment === 'room'
        ? formatPesoAmount(parsePesoAmount(session.folioTotal) + parsePesoAmount(serviceBooking.amount))
        : session.folioTotal,
    };

    /*
      Spending and booking are one step, so a balance can never be debited for
      a booking that did not happen.
    */
    const next = usablePoints > 0
      ? spendPoints(booked, {
          id: serviceBooking.id,
          title: `Points off ${serviceBooking.title}`,
          points: usablePoints,
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

    setSession(payment === 'paid' && paidWith
      ? recordPayment(next, {
          id: `pay-${serviceBooking.id}`,
          paidAt: PROTOTYPE_TODAY,
          kind: 'service',
          title: serviceBooking.title,
          detail: booking.property,
          amount: parsePesoAmount(serviceBooking.amount),
          method: paidWith,
          bookingId: booking.id,
          items: [{ id: serviceBooking.id, title: serviceBooking.title, amount: parsePesoAmount(serviceBooking.amount) }],
          refunded: 0,
        })
      : next);
    notifyGuestRequest(serviceBooking.id, `${serviceBooking.title} booked`, `${serviceBooking.scheduledFor} · ${serviceBooking.amount}`);
    setLastServiceBookingId(id);
    setAppliedPoints(0);
    setServiceNote('');
    goReplacing('booking-confirmation');
  };

  /*
    Before arrival a service is not booked on the spot: it goes in the cart with
    its price, and is booked when the whole cart is paid. Same slot id as a
    direct booking, so the two can never both exist.
  */
  const addServiceToCart = () => {
    const booking = viewedTrip ?? getPrimaryBooking(session.bookings, session.activeBookingId);
    if (!booking || !canBookService(booking, selectedService.id)) {
      setBookingBlockedReason(booking ? blockedReasonFor(booking) : 'not-arrived');
      go('booking-blocked');
      return;
    }
    const days = bookableServiceDays(booking, PROTOTYPE_TODAY, selectedService.id);
    if (!days.length) {
      setBookingBlockedReason('no-slot');
      go('booking-blocked');
      return;
    }
    const day = serviceDate && days.includes(serviceDate) ? serviceDate : days[0]!;
    const slotTime = SERVICE_SCHEDULES[selectedService.id]?.time ?? serviceTime;
    const { hour } = parseClockTime(slotTime);
    const id = `service-${selectedService.id}-${booking.id}-${day}-${hour}`;
    if (session.serviceBookings.some((service) => service.id === id && service.status === 'confirmed')) {
      setLastServiceBookingId(id);
      goReplacing('booking-confirmation');
      return;
    }
    const line: CartLine = {
      settle: servicePayment === 'complimentary' ? 'free' : 'pay-now',
      booking: {
        id,
        bookingId: booking.id,
        title: selectedService.name,
        scheduledFor: `${formatServiceDay(day).long} · ${slotTime}`,
        scheduledDate: day,
        scheduledHour: hour,
        bookedAt: PROTOTYPE_TODAY,
        serviceId: selectedService.id,
        ...(selectedService.categoryId === 'rentals'
          ? { summary: `${slotTime} · return by 8:00 PM · ${rentalQuantity} ${rentalQuantity === 1 ? rentalUnitFor(selectedService.id).singular : rentalUnitFor(selectedService.id).plural}`, rentalQuantity }
          : { partySize: servicePartySize }),
        amount: formatPesoAmount(servicePrice),
        status: 'confirmed',
        provider: providerFor(selectedService),
        paymentStatus: 'payment-pending',
        ...(serviceNote.trim() ? { facts: noteFact(serviceNote) } : {}),
      },
    };
    setSession((cur) => addToCart(cur, line));
    setServiceNote('');
    returnToArrivalServices();
  };

  /* The airport ride before the stay: a fixed fare, in the cart, either direction. */
  const addRideToCart = () => {
    const { from, to } = rideEnds();
    const airport = airportFor(contextBooking);
    const [hours = 10, minutes = 0] = rideTime.split(':').map(Number);
    const clock = `${((hours + 11) % 12) + 1}:${String(minutes).padStart(2, '0')} ${hours >= 12 ? 'PM' : 'AM'}`;
    const arriving = to === contextBooking.property;
    const rideId = `service-ride-${contextBooking.id}-${arriving ? 'in' : 'out'}-${rideDate}-${hours}${minutes}`;
    // The same ride at the same time is already booked (it may have come with the stay): never a second fare.
    if (session.serviceBookings.some((service) => service.id === rideId && service.status === 'confirmed')) {
      returnToArrivalServices();
      return;
    }
    const rideBooking: ServiceBooking = {
      id: rideId,
      bookingId: contextBooking.id,
      serviceId: 'transfer',
      title: arriving ? 'Airport transfer · to the hotel' : 'Airport transfer · to the airport',
      scheduledFor: `${formatServiceDay(rideDate).long} · ${clock}`,
      scheduledDate: rideDate,
      scheduledHour: hours,
      bookedAt: PROTOTYPE_TODAY,
      amount: '₱1,200',
      status: 'confirmed',
      paymentStatus: 'payment-pending',
      provider: 'Arranged by the hotel',
      summary: `${clock} · ${arriving ? `${airport} → hotel` : `Hotel → ${airport}`}`,
      facts: [
        { label: 'Pick up', value: from },
        { label: 'Drop off', value: to },
        ...(arriving && rideFlight.trim() ? [{ label: 'Flight', value: rideFlight.trim().toUpperCase() }] : []),
        { label: 'Passengers', value: `${ridePassengers}` },
        ...noteFact(rideNote),
        { label: 'Status', value: 'Paid · waiting for the hotel to confirm the driver' },
      ],
    };
    setSession((cur) => addToCart(cur, { booking: rideBooking, settle: 'pay-now' }));
    setRideNote('');
    returnToArrivalServices();
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
    Early check-in used to be the last pre-arrival step. It is its own ask now,
    offered from the home, so it neither gates registration nor waits on it.
  */
  const requestEarlyCheckIn = () => {
    const request = EARLY_CHECK_IN;
    // An extra charge, so it is a booking like any other: it shows on My Stay
    // and can be withdrawn there while the hotel has not confirmed it. Its fee
    // is a room charge, so it waits in the cart with no payment attached.
    const requestBooking: ServiceBooking = {
      id: earlyCheckInBookingId(contextBooking.id),
      bookingId: contextBooking.id,
      serviceId: 'early-check-in',
      title: 'Early check-in',
      scheduledFor: `${formatServiceDay(contextBooking.checkIn).long} · ${request.time}`,
      scheduledDate: contextBooking.checkIn,
      scheduledHour: 11,
      bookedAt: PROTOTYPE_TODAY,
      amount: request.fee,
      status: 'confirmed',
      paymentStatus: 'pending-confirmation',
      paymentMethod: 'room',
      summary: `${request.time} · instead of ${CHECK_IN_FROM}`,
      facts: [
        { label: 'Room from', value: `${request.time} instead of ${CHECK_IN_FROM}` },
        ...noteFact(earlyNote),
        { label: 'Status', value: 'Waiting for the hotel to confirm' },
        { label: 'If approved', value: `${request.fee}, added to your room bill once you have a room` },
      ],
    };
    setSession((cur) => addToCart(cur, { booking: requestBooking, settle: 'room-later', earlyCheckIn: request }));
    setEarlyNote('');
    // Back to where the guest asked from: the home tile, or the arrival roster.
    if (history.length > 0) back();
    else go('stay-overview');
  };

  /** Back to the roster the guest came from, without stacking a second copy of it in history. */
  const returnToArrivalServices = () => {
    if (history[history.length - 1] === 'pre-arrival-services') back();
    else goReplacing('pre-arrival-services');
  };

  /* Not a network problem, and not the guest's to fix: say which it is before any money moves. */
  const cartCanCheckOut = () => {
    if (!online) { setBookingBlockedReason('offline'); go('booking-blocked'); return false; }
    if (pmsDown || failNext.booking) {
      setFailNext((current) => ({ ...current, booking: false }));
      setBookingBlockedReason(pmsDown ? 'pms-down' : 'failed');
      go('booking-blocked');
      return false;
    }
    return true;
  };

  /* One payment, then every booking at once -- and the desk hears about the two that need a person. */
  const settleArrivalCart = (method?: GatewayMethod) => {
    const { session: next, bookingIds } = settleCart(session, contextBooking.id, method);
    const asks = bookingIds
      .map((id) => next.serviceBookings.find((service) => service.id === id))
      .filter((service): service is ServiceBooking => Boolean(service) && (service!.serviceId === 'transfer' || service!.serviceId === 'early-check-in'));
    if (asks.length) {
      setChatMessages((messages) => [
        ...messages,
        ...asks.flatMap((service): ChatMessage[] => service.serviceId === 'early-check-in'
          ? [
              { from: 'guest', body: `I’d like to request early check-in from ${EARLY_CHECK_IN.time} on ${formatStayDateRange(contextBooking).split('–')[0]}.${noteSuffix(service)}`, state: 'Sent' },
              { from: 'desk', body: 'Noted. We’ll confirm early check-in before you arrive. If it’s approved, the fee goes on your room once you have one.', state: 'Seen' },
            ]
          : [
              { from: 'guest', body: `I’ve booked and paid for an airport transfer: ${service.summary ?? ''} on ${service.scheduledFor.split(' · ')[0]}. Please confirm the driver.${noteSuffix(service)}`, state: 'Sent' },
              { from: 'desk', body: 'Thanks, we have your payment. We’ll confirm the driver and pick-up details here. If we can’t arrange it, you’ll be refunded.', state: 'Seen' },
            ]),
      ]);
    }
    const paid = bookingIds
      .map((id) => next.serviceBookings.find((service) => service.id === id))
      .filter((service): service is ServiceBooking => service?.paymentStatus === 'paid');
    const paidTotal = paid.reduce((sum, service) => sum + parsePesoAmount(service.amount), 0);
    setSession(paidTotal > 0 && method
      ? recordPayment(next, {
          id: `pay-cart-${paid[0]!.id}`,
          paidAt: PROTOTYPE_TODAY,
          kind: 'arrival',
          title: 'Arrival services',
          detail: `${contextBooking.property} · ${paid.length} ${paid.length === 1 ? 'item' : 'items'}`,
          amount: paidTotal,
          method,
          bookingId: contextBooking.id,
          items: paid.map((service) => ({ id: service.id, title: service.title, amount: parsePesoAmount(service.amount) })),
          refunded: 0,
        })
      : next);
    if (bookingIds.length) {
      notifyGuestRequest(
        bookingIds[0]!,
        asks.length ? 'Arrival requests sent' : 'Arrival services booked',
        `${bookingIds.length} ${bookingIds.length === 1 ? 'item is' : 'items are'} on My Stay.`,
      );
    }
    setCartReceipt({ ids: bookingIds, method });
    goReplacing('arrival-cart-confirmation');
  };

  /** `patch` lands in the same write, so a last-step save is not overwritten by this one. */
  const completePreArrival = (patch: Partial<GuestSession> = {}) => {
    const next: GuestSession = {
      ...session,
      ...patch,
      bookings: session.bookings.map((booking) =>
        booking.id === contextBooking.id
          ? {
              ...booking,
              preArrivalCompleted: booking.preArrivalTotal,
              // Cleared, not left behind: at 100% there is no next step, and a
              // stale one reads as work still owed.
              nextPreArrivalStep: undefined,
              /*
                Pre-registration does not assign a room. The hotel allocates
                from its own inventory around arrival, and Cabana only learns
                which one -- so the number and state are left as they were
                (pending until the hotel's assignment arrives).
              */
              honouredPreferences: summarizeRoomPreferences(session.roomPreferences),
              // The names confirmed here belong to this stay, not to every trip on the account.
              ...(patch.additionalGuests ? { companions: patch.additionalGuests } : {}),
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
    const target = session.auth === 'authenticated' ? getPostAuthScreen(next) : 'guest-details';
    go(target);
    // The stamped card zoomed away; the screen it opens settles in out of that zoom.
    setPassEntranceScreen(target);
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
    // A new state is a new stay as far as the demo goes: its chat starts empty.
    setAllChatMessages([]);
    setChatOrderVenue(null);
    setChatNotifications([]);
    setPushNotice(null);
    setReviewingStayId(null);
    setHistory([]);
    setProfileMatch(null);
    setCode('');
    setCodeNotice(null);
    setScrolled(false);
    // An account with no booking lands on its home -- Home and Profile, with
    // "Add a booking" there -- not straight on the lookup form.
    const initialScreen: ActiveScreen = state === 'signed-out' ? 'entry-hub' : 'stay-overview';
    setActiveScreen(initialScreen);
  };

  /*
    Every empty and error state, one tap away, for demoing and documenting
    them. Each page sets up its stay and conditions from scratch, so the
    screens show exactly the state named and nothing left over from before.
  */
  const openPrototypePage = (setup: { state: PrototypeStayState; patch?: (current: GuestSession) => GuestSession; online?: boolean; pmsDown?: boolean; emptyCatalogue?: boolean; postStayExpired?: boolean; reason?: BlockedReason; category?: MiniAppCategoryId; chat?: ChatMessage[]; screen: ActiveScreen }) => {
    applyStayState(setup.state);
    const bookingId = applyPrototypeStayState(setup.state).activeBookingId;
    if (setup.patch) setSession((current) => setup.patch!(current));
    setOnline(setup.online ?? true);
    setPmsDown(Boolean(setup.pmsDown));
    setEmptyCatalogue(Boolean(setup.emptyCatalogue));
    setFailNext({ booking: false, chat: false, scan: false });
    setSimulatePostStayExpired(Boolean(setup.postStayExpired));
    if (setup.reason) setBookingBlockedReason(setup.reason);
    if (setup.category) setSelectedCategory(setup.category);
    if (setup.reason === 'failed' || setup.reason === 'pms-down') setSelectedServiceId('spa');
    if (setup.chat) setAllChatMessages(setup.chat.map((message) => ({ ...message, bookingId })));
    setActiveScreen(setup.screen);
  };
  const nothingBooked = (current: GuestSession): GuestSession => ({
    ...current,
    serviceBookings: [],
    folioTotal: '₱0',
    bookings: current.bookings.map((booking) => ({ ...booking, folioTotal: undefined, inAppCharges: undefined })),
  });
  const brandNewAccount = (current: GuestSession): GuestSession => ({ ...current, pastStays: [], serviceBookings: [], reviews: [], bookings: [], activeBookingId: undefined });
  /*
    Hotel booking, opened mid-flow: the draft a guest would have built by
    this point, so each page opens ready to look at rather than empty.
  */
  const FAMILY_SEARCH: StaySearch = { ...DEFAULT_STAY_SEARCH, location: 'Manila', adults: 3, childAges: [8, 3] };
  const MIXED_CART: StayCartLine[] = [{ roomTypeId: 'manila-king', ratePlanId: 'flex', quantity: 1 }, { roomTypeId: 'manila-suite', ratePlanId: 'flex-breakfast', quantity: 1 }];
  const MIXED_CANCELLATION_CART: StayCartLine[] = [{ roomTypeId: 'manila-king', ratePlanId: 'flex', quantity: 1 }, { roomTypeId: 'manila-suite', ratePlanId: 'saver', quantity: 1 }];
  // An airport pickup for the whole family and an anniversary setup: two extras with fields of their own.
  const DEMO_EXTRAS: StayAddOn[] = [{ id: 'transfer', time: '14:30', flight: 'PR 2041', passengers: 5 }, { id: 'celebration', setup: 'full', occasion: 'Anniversary' }];
  const openBookingPage = (setup: { screen: ActiveScreen; search?: StaySearch; hotelId?: string; cart?: StayCartLine[]; withDetails?: boolean; online?: boolean; view?: ResultsView; addOns?: StayAddOn[] }) => {
    setStayGatewayMethod(null);
    openPrototypePage({ state: 'account-only', screen: setup.screen, online: setup.online });
    const search = setup.search ?? DEFAULT_STAY_SEARCH;
    const hotel = findStayHotel(setup.hotelId);
    const cart = setup.cart ?? [];
    setStayDraft({ search, hotelId: setup.hotelId, cart, allocation: hotel && cart.length ? defaultAllocation(hotel, search, cart) : [], addOns: setup.addOns ?? [] });
    setResultsView(setup.view ?? DEFAULT_RESULTS_VIEW);
    setStayDetails(setup.withDetails && hotel ? guestDetailsFromSession(restoreProfileSession(), cartRooms(hotel, cart).length) : null);
    setCancelNotice(null);
    setHistory(setup.screen === 'stay-overview' ? [] : ['stay-overview']);
  };
  /* A stay booked and paid in the app, with its policy bent to the case being shown. */
  const withAppBooking = (policy: 'free' | 'soon' | 'ended' | 'saver' | 'mixed', addOns?: StayAddOn[]) => (current: GuestSession): GuestSession => {
    const hotel = findStayHotel('manila')!;
    const cart: StayCartLine[] = policy === 'saver'
      ? [{ roomTypeId: 'manila-king', ratePlanId: 'saver', quantity: 1 }, { roomTypeId: 'manila-suite', ratePlanId: 'saver', quantity: 1 }]
      : policy === 'mixed' ? MIXED_CANCELLATION_CART : MIXED_CART;
    const details = guestDetailsFromSession(current, 2);
    const quote = quoteStay(hotel, FAMILY_SEARCH, cart);
    const booking = bookingFromDraft({ hotel, search: FAMILY_SEARCH, cart, allocation: defaultAllocation(hotel, FAMILY_SEARCH, cart), details, quote, paidWith: 'GCash', paidAt: PROTOTYPE_TODAY });
    // "Ended" moves the deadline behind the prototype clock; "soon" puts it tomorrow.
    const until = policy === 'ended' ? addDays(PROTOTYPE_TODAY, -1) : policy === 'soon' ? addDays(PROTOTYPE_TODAY, 1) : undefined;
    const reservation = until && booking.reservation ? { ...booking.reservation, freeCancellationUntil: until } : booking.reservation;
    const extras = withAddOns({ booking: { ...booking, reservation }, hotel, addOns, method: 'gcash', paidAt: PROTOTYPE_TODAY });
    const payNowServices = extras.services.filter((item) => item.serviceId !== 'early-check-in');
    const payNowLines = extras.lines.filter((line) => line.id !== 'early-check-in');
    // Record upfront extras on the payment; early check-in remains a room-charge request.
    return recordPayment({ ...current, bookings: [extras.booking], serviceBookings: [...extras.services, ...current.serviceBookings], activeBookingId: booking.id }, {
      id: `pay-stay-${booking.id}`,
      paidAt: PROTOTYPE_TODAY,
      kind: 'stay',
      title: hotel.name,
      detail: `2 rooms${payNowServices.length ? ` + ${payNowServices.length} ${payNowServices.length === 1 ? 'extra' : 'extras'}` : ''} · ${stayDatesLabel(FAMILY_SEARCH.checkIn, FAMILY_SEARCH.checkOut)}`,
      amount: quote.total + extras.total,
      method: 'gcash',
      bookingId: booking.id,
      items: [
        ...(extras.booking.reservation?.rooms ?? []).map((room, index) => ({
          id: room.id ?? `${booking.id}-room-${index + 1}`,
          title: `Room ${bookedRoomNumber(room, index)} · ${room.roomName}`,
          amount: room.amount ?? 0,
        })),
        ...payNowServices.map((item, index) => ({ id: item.id, title: item.title, amount: payNowLines[index]!.amount })),
      ],
      refunded: 0,
    });
  };
  // The first night after the demo dates that the Henry Manila is full, for the sold-out page.
  const fullNight = (() => {
    for (let night = addDays(DEFAULT_STAY_SEARCH.checkOut, 1), i = 0; i < 120; i++, night = addDays(night, 1)) if (isHotelFull('manila', night)) return night;
    return DEFAULT_STAY_SEARCH.checkIn;
  })();
  const bookingPages: PrototypePage[] = [
    { group: 'Find a hotel', label: 'Search', detail: 'Full-screen Where, When, Who', open: () => openBookingPage({ screen: 'book-stay' }) },
    { group: 'Find a hotel', label: 'Results · list', detail: 'Every partner hotel', open: () => openBookingPage({ screen: 'book-stay-results' }) },
    { group: 'Find a hotel', label: 'Results · map', detail: 'Price pins across the country', open: () => openBookingPage({ screen: 'book-stay-results', view: { ...DEFAULT_RESULTS_VIEW, mode: 'map' } }) },
    { group: 'Find a hotel', label: 'Results · nothing matches', detail: 'A place with no partner hotels', open: () => openBookingPage({ screen: 'book-stay-results', search: { ...DEFAULT_STAY_SEARCH, location: 'Batanes' } }) },
    { group: 'Find a hotel', label: 'Hotel page', detail: 'Rooms, nearby, partners', open: () => openBookingPage({ screen: 'book-stay-hotel', hotelId: 'manila' }) },
    { group: 'Find a hotel', label: 'Hotel page · mixed cart', detail: 'A King and a Garden Suite, fits the party', open: () => openBookingPage({ screen: 'book-stay-hotel', hotelId: 'manila', search: FAMILY_SEARCH, cart: MIXED_CART }) },
    { group: 'Find a hotel', label: 'Hotel page · rooms don’t fit', detail: 'One King for a family of five', open: () => openBookingPage({ screen: 'book-stay-hotel', hotelId: 'manila', search: FAMILY_SEARCH, cart: [MIXED_CART[0]!] }) },
    { group: 'Find a hotel', label: 'Hotel page · fully booked night', detail: `Every room sold out`, open: () => openBookingPage({ screen: 'book-stay-hotel', hotelId: 'manila', search: { ...DEFAULT_STAY_SEARCH, checkIn: fullNight, checkOut: addDays(fullNight, 1) } }) },
    { group: 'Find a hotel', label: 'Home · saved hotels', detail: 'Two hearts, and the saved rail', open: () => { seedSavedHotels(['alon-boracay', 'manila']); openBookingPage({ screen: 'stay-overview' }); } },
    { group: 'Book', label: 'Arrival extras', detail: 'Optional; skip or add pickup and more', open: () => openBookingPage({ screen: 'book-stay-addons', hotelId: 'manila', search: FAMILY_SEARCH, cart: MIXED_CART, withDetails: true }) },
    { group: 'Book', label: 'Arrival extras · pickup and flowers', detail: 'Two extras, filled in', open: () => openBookingPage({ screen: 'book-stay-addons', hotelId: 'manila', search: FAMILY_SEARCH, cart: MIXED_CART, withDetails: true, addOns: DEMO_EXTRAS }) },
    { group: 'Book', label: 'Arrival extras · no airport pickup', detail: 'Baguio: nothing to meet at the airport', open: () => openBookingPage({ screen: 'book-stay-addons', hotelId: 'pinetop-baguio', search: { ...DEFAULT_STAY_SEARCH, location: 'Baguio' }, cart: [{ roomTypeId: findStayHotel('pinetop-baguio')!.roomTypes[0]!.id, ratePlanId: 'flex', quantity: 1 }], withDetails: true }) },
    { group: 'Book', label: 'Guest details', detail: 'Prefilled from the profile', open: () => openBookingPage({ screen: 'book-stay-checkout', hotelId: 'manila', search: FAMILY_SEARCH, cart: MIXED_CART, withDetails: true }) },
    { group: 'Book', label: 'Payment', detail: 'Card, GCash or Maya on the page', open: () => openBookingPage({ screen: 'book-stay-payment', hotelId: 'manila', search: FAMILY_SEARCH, cart: MIXED_CART, withDetails: true }) },
    { group: 'Book', label: 'Payment · with extras', detail: 'Rooms and extras, one payment', open: () => openBookingPage({ screen: 'book-stay-payment', hotelId: 'manila', search: FAMILY_SEARCH, cart: MIXED_CART, withDetails: true, addOns: DEMO_EXTRAS }) },
    { group: 'Book', label: 'Payment · saved offer arrives applied', detail: 'HENRY15 saved on the hotel page', open: () => { savePendingVoucher('HENRY15'); openBookingPage({ screen: 'book-stay-payment', hotelId: 'manila', search: FAMILY_SEARCH, cart: MIXED_CART, withDetails: true }); } },
    { group: 'Book', label: 'Payment · code not for this hotel', detail: 'HENRY15 at a partner hotel', open: () => { openBookingPage({ screen: 'book-stay-payment', hotelId: 'alon-boracay', search: { ...DEFAULT_STAY_SEARCH, location: 'Boracay' }, cart: [{ roomTypeId: findStayHotel('alon-boracay')!.roomTypes[0]!.id, ratePlanId: 'flex', quantity: 1 }], withDetails: true }); setStayDetails((details) => (details ? { ...details, promoCode: 'HENRY15' } : details)); } },
    { group: 'Book', label: 'Payment · not a first booking', detail: 'WELCOME500 is refused', open: () => { openBookingPage({ screen: 'book-stay-payment', hotelId: 'manila', search: FAMILY_SEARCH, cart: MIXED_CART, withDetails: true }); setSession((current) => withAppBooking('free')(current)); setStayDetails((details) => (details ? { ...details, promoCode: 'WELCOME500' } : details)); } },
    { group: 'Book', label: 'Confirmation · with extras', detail: 'What the guest sees after paying', open: () => { const patch = withAppBooking('free', DEMO_EXTRAS); openPrototypePage({ state: 'account-only', patch, screen: 'book-stay-confirmation' }); setConfirmedStayId(patch(session).bookings[0]!.id); setHistory([]); } },
    { group: 'After booking', label: 'Home · booked in the app', detail: 'The new stay as the upcoming home', open: () => openPrototypePage({ state: 'account-only', patch: withAppBooking('free'), screen: 'stay-overview' }) },
    { group: 'After booking', label: 'View booking · with extras', detail: 'Pickup and setup paid with the rooms', open: () => openPrototypePage({ state: 'account-only', patch: withAppBooking('free', DEMO_EXTRAS), screen: 'rate-detail' }) },
    { group: 'After booking', label: 'My Stay · extras waiting on the hotel', detail: 'Then answer them from Events', open: () => openPrototypePage({ state: 'account-only', patch: withAppBooking('free', [...DEMO_EXTRAS, { id: 'early-check-in' }]), screen: 'my-stay' }) },
    { group: 'After booking', label: 'View booking · free cancellation', detail: 'Change or cancel for a full refund', open: () => openPrototypePage({ state: 'account-only', patch: withAppBooking('free'), screen: 'rate-detail' }) },
    { group: 'After booking', label: 'Home · cancellation ends tomorrow', detail: 'The reminder banner and notification', open: () => openPrototypePage({ state: 'account-only', patch: withAppBooking('soon'), screen: 'stay-overview' }) },
    { group: 'After booking', label: 'View booking · cancellation ends tomorrow', detail: 'The reminder, and Getting there', open: () => openPrototypePage({ state: 'account-only', patch: withAppBooking('soon'), screen: 'rate-detail' }) },
    { group: 'After booking', label: 'View booking · cancellation ended', detail: 'Past the free-cancellation day', open: () => openPrototypePage({ state: 'account-only', patch: withAppBooking('ended'), screen: 'rate-detail' }) },
    { group: 'After booking', label: 'View booking · mixed cancellation', detail: 'One free-cancellation room and one Saver room', open: () => openPrototypePage({ state: 'account-only', patch: withAppBooking('mixed', DEMO_EXTRAS), screen: 'rate-detail' }) },
    { group: 'After booking', label: 'View booking · non-refundable', detail: 'Saver rates on every room', open: () => openPrototypePage({ state: 'account-only', patch: withAppBooking('saver'), screen: 'rate-detail' }) },
    { group: 'After booking', label: 'Home · booking cancelled', detail: 'The refund notice', open: () => { openBookingPage({ screen: 'stay-overview' }); setCancelNotice('The Henry Hotel Manila is cancelled. ₱69,394 is on its way back to GCash.'); } },
  ];
  /* Came in with "Continue as guest" and a booking reference: the stay, no account. */
  // Nothing from before this booking: no past stays, reviews or other payments.
  const asGuest = (current: GuestSession): GuestSession => ({ ...current, auth: 'anonymous', authMethod: undefined, accountStatus: 'none', pastStays: [], reviews: [], payments: (current.payments ?? []).filter((payment) => current.bookings.some((booking) => booking.id === payment.bookingId)) });
  const profilePages: PrototypePage[] = [
    { group: 'Profile', label: 'Profile · guest', detail: 'A booking reference, no account', open: () => openPrototypePage({ state: 'pre-arrival', patch: asGuest, screen: 'profile' }) },
    { group: 'Profile', label: 'Profile · signed in', detail: 'Account, history, payments, saved', open: () => openPrototypePage({ state: 'pre-arrival', screen: 'profile' }) },
    // Two trips: the reference stay in November, and one booked in the app for December.
    { group: 'Profile', label: 'Stays · two trips ahead', detail: 'Upcoming and Past; the app follows the nearer one', open: () => openPrototypePage({ state: 'pre-arrival', patch: (current) => { const withApp = withAppBooking('free')(current); return { ...withApp, bookings: [...current.bookings, ...withApp.bookings], activeBookingId: current.activeBookingId }; }, screen: 'stay-history' }) },
    { group: 'Profile', label: 'Saved hotels', detail: 'Three hearts, priced for the search dates', open: () => { seedSavedHotels(['alon-boracay', 'manila', 'pinetop-baguio']); openPrototypePage({ state: 'pre-arrival', screen: 'saved-hotels' }); } },
    { group: 'Profile', label: 'Saved hotels · none yet', detail: 'The empty state', open: () => { seedSavedHotels([]); openPrototypePage({ state: 'pre-arrival', screen: 'saved-hotels' }); } },
    { group: 'Book', label: 'Payment · guest must sign in', detail: 'Booking another hotel needs an account', open: () => { openBookingPage({ screen: 'book-stay-payment', hotelId: 'manila', search: FAMILY_SEARCH, cart: MIXED_CART, withDetails: true }); setSession((current) => asGuest(withAppBooking('free')(current))); } },
  ];
  const prototypePages: PrototypePage[] = [
    ...bookingPages,
    ...profilePages,
    { group: 'Error states', label: 'Payment · offline', detail: 'Hotel booking can’t be paid', open: () => openBookingPage({ screen: 'book-stay-payment', hotelId: 'manila', search: FAMILY_SEARCH, cart: MIXED_CART, withDetails: true, online: false }) },
    { group: 'Empty states', label: 'Home · no booking', detail: 'Signed in, nothing connected', open: () => openPrototypePage({ state: 'account-only', screen: 'stay-overview' }) },
    { group: 'Empty states', label: 'My Stay · nothing booked', detail: 'A live stay with no services', open: () => openPrototypePage({ state: 'live', patch: nothingBooked, screen: 'my-stay' }) },
    { group: 'Empty states', label: 'Room charges · empty bill', detail: 'Nothing posted or booked yet', open: () => openPrototypePage({ state: 'live', patch: nothingBooked, screen: 'folio' }) },
    { group: 'Empty states', label: 'Notifications · all caught up', detail: 'Nothing to report', open: () => openPrototypePage({ state: 'live', patch: nothingBooked, screen: 'notifications' }) },
    { group: 'Empty states', label: 'Chat · no messages yet', detail: 'The front desk, before the first message', open: () => openPrototypePage({ state: 'live', screen: 'chat' }) },
    { group: 'Empty states', label: 'Explore · nothing to book', detail: 'Empty catalogue', open: () => openPrototypePage({ state: 'live', emptyCatalogue: true, screen: 'marketplace' }) },
    { group: 'Empty states', label: 'Category · nothing to book', detail: 'Spa & wellness, empty', open: () => openPrototypePage({ state: 'live', emptyCatalogue: true, category: 'spa', screen: 'category-listing' }) },
    { group: 'Empty states', label: 'Nearby · no places', detail: 'No independent places listed', open: () => openPrototypePage({ state: 'live', emptyCatalogue: true, screen: 'nearby-recommendations' }) },
    { group: 'Empty states', label: 'Achievements · new account', detail: 'No points, no badges', open: () => openPrototypePage({ state: 'account-only', patch: brandNewAccount, screen: 'rewards' }) },
    { group: 'Empty states', label: 'Stay history · no stays', detail: 'A first-time account', open: () => openPrototypePage({ state: 'account-only', patch: brandNewAccount, screen: 'stay-history' }) },
    { group: 'Error states', label: 'Offline · Home', detail: 'No connection, last-known stay', open: () => openPrototypePage({ state: 'live', online: false, screen: 'stay-overview' }) },
    { group: 'Error states', label: 'Offline · Room charges', detail: 'Last-known bill', open: () => openPrototypePage({ state: 'live', online: false, screen: 'folio' }) },
    { group: 'Error states', label: 'Offline · booking', detail: 'A time cannot be held offline', open: () => openPrototypePage({ state: 'live', online: false, reason: 'offline', screen: 'booking-blocked' }) },
    { group: 'Error states', label: 'Hotel system down · Room charges', detail: `Last known, as of ${PMS_LAST_SYNC}`, open: () => openPrototypePage({ state: 'live', pmsDown: true, screen: 'folio' }) },
    { group: 'Error states', label: 'Hotel system down · My Stay', detail: `Last known, as of ${PMS_LAST_SYNC}`, open: () => openPrototypePage({ state: 'live', pmsDown: true, screen: 'my-stay' }) },
    { group: 'Error states', label: 'Hotel system down · booking', detail: 'Falls back to the front desk', open: () => openPrototypePage({ state: 'live', pmsDown: true, reason: 'pms-down', screen: 'booking-blocked' }) },
    { group: 'Error states', label: 'Booking didn’t go through', detail: 'Retry, or send it to the desk', open: () => openPrototypePage({ state: 'live', reason: 'failed', screen: 'booking-blocked' }) },
    { group: 'Error states', label: 'Chat message not sent', detail: 'Retry in the thread', open: () => openPrototypePage({ state: 'live', chat: [{ from: 'guest', body: 'Could we get two fresh towels, please?', state: 'Not sent' }], screen: 'chat' }) },
    { group: 'Error states', label: 'Room scan failed', detail: 'Retry, or the desk opens it', open: () => openPrototypePage({ state: 'arrived', reason: 'scan-failed', screen: 'booking-blocked' }) },
    { group: 'Error states', label: 'Booking not found', detail: 'The lookup found nothing', open: () => openPrototypePage({ state: 'signed-out', screen: 'no-booking' }) },
    { group: 'Error states', label: 'Too early to book', detail: 'On-property services before check-in', open: () => openPrototypePage({ state: 'pre-arrival', reason: 'not-arrived', screen: 'booking-blocked' }) },
  ];

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
    if (!managedReviewStayId) return;
    setSession((current) => ({
      ...current,
      reviews: current.reviews.filter((review) => review.bookingId !== managedReviewStayId),
    }));
  };

  const resetPrototype = () => {
    clearStoredSession();
    writeAccountStash(undefined);
    applyStayState('signed-out');
  };

  const [confirmSignOut, setConfirmSignOut] = useState(false);
  const signOut = () => {
    /*
      The live session is removed outright rather than left as a signed-out
      record. What the account booked in the app is kept apart and handed back
      on the next sign-in: "sign back in to see your stays" has to be true, and
      a guest who paid for a hotel here must not lose it by signing out.
    */
    writeAccountStash(accountActivity(session));
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
          placeholder="e.g. HEN-241109"
          helper="Hotel, Agoda, or Booking.com reference"
          required
        />
        <Field label="Last name" name="last-name" placeholder="As on the booking" autoComplete="family-name" required />
        <Button className="guest-button guest-button--primary" type="submit">
          Find booking<ArrowRight aria-hidden="true" />
        </Button>
      </form>
    </ScreenIntro>
  );

  const renderChatScreen = () => {
    const chatDisabled = checkedOutNav && !postStayWindow.deskOpen;
    /*
      One surface. However the chat is reached -- a venue's menu, the gift
      shop, the tab bar -- it is the same thread with the same controls. The
      venue an order is for is remembered quietly (so a later "2 calamari"
      still lands on the right bill) rather than turning this into a
      different screen without the quick actions.
    */
    // The guest's own thread, closed or not: a closed chat is read-only, not replaced.
    const displayedChatMessages: ChatMessage[] = chatMessages;
    // The booked hotel's own line when it is a partner the app knows; else the city's Henry.
    const deskContact = findStayHotel(contextBooking.reservation?.hotelId) ?? findStayHotel(contextBooking.city.toLowerCase());
    const chatStarted = displayedChatMessages.some((message) => message.from === 'guest');

    const showChatWelcome = !chatStarted && !chatDisabled;
    return (
      <div
        className={`guest-chat${chatDisabled ? ' guest-chat--disabled' : ''} ${chatStarted ? 'guest-chat--conversation' : 'guest-chat--welcome'}`}
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

        {chatDisabled ? (
          <Notice tone="neutral" title="Chat is closed">
            The front desk answers here for 24 hours after checkout. For anything since, contact {contextBooking.property} directly
            {deskContact?.phone ? <> on <a href={`tel:${deskContact.phone.replace(/[^+\d]/g, '')}`}>{deskContact.phone}</a></> : null}
            {deskContact?.email ? <> or at <a href={`mailto:${deskContact.email}`}>{deskContact.email}</a></> : null}.
          </Notice>
        ) : null}
        {!online ? <Notice tone="offline" title="Messages will send when connected">Your chat history is available. New requests wait on this device.</Notice> : null}

        <div className="guest-messages" aria-label="Conversation" aria-live="polite">
          {showChatWelcome ? (
            <div className="guest-chat__welcome" aria-labelledby="guest-chat-welcome-title">
              <p>Good afternoon, Ana.</p>
              <h2 id="guest-chat-welcome-title">How can we help with your stay?</h2>
              {/* Before the first message the requests answer the question
                  above them; once the thread starts they dock by the composer. */}
              <ChatQuickActions chips preArrival={!hasStayStarted(contextBooking)} postStay={checkedOutNav} disabled={chatDisabled} onPick={(action) => (action.label === 'Late checkout' ? openLateCheckoutChat() : sendQuickMessage(action.message(contextRoom)))} />
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
                {message.from === 'guest' && message.state === 'Not sent' ? (
                  <button type="button" className="guest-message__retry" onClick={() => retryChatMessage(index)}>Not sent · Retry</button>
                ) : message.from === 'guest' && message.state ? <small>{message.state}</small> : null}
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
          {!showChatWelcome && !chatDisabled ? <ChatQuickActions preArrival={!hasStayStarted(contextBooking)} postStay={checkedOutNav} disabled={chatDisabled} onPick={(action) => (action.label === 'Late checkout' ? openLateCheckoutChat() : sendQuickMessage(action.message(contextRoom)))} /> : null}
          <ChatComposer
            disabled={chatDisabled}
            draft={chatDraft}
            onDraftChange={setChatDraft}
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
          resumeBooking={resumeBooking}
        />
      );
    }
    const exploreTabs = (
      <div className="sb-segmented sb-explore-tabs" role="tablist" aria-label="Explore">
        <button type="button" role="tab" aria-selected={exploreView === 'stay'} onClick={() => setExploreView('stay')}>Your stay</button>
        <button type="button" role="tab" aria-selected={exploreView === 'hotels'} onClick={() => setExploreView('hotels')}>Hotels</button>
      </div>
    );
    if (exploreView === 'hotels') {
      return <div className="guest-stack">{exploreTabs}{renderHotelBrowse()}</div>;
    }
    /*
      Once the stay has begun the guest is past arriving: no pick-up "met at
      arrivals", no early check-in. What is left is what they can still use
      before the scan, and the transfer runs the other way, to the airport.
    */
    const inStay = hasStayStarted(contextBooking);
    const arrivalServices = [
      ...SERVICES.filter((service) => isPreArrivalService(service.id)),
      ...(inStay ? [] : [{ id: 'early-check-in', name: 'Early check-in', note: cartLines.some((line) => line.earlyCheckIn) ? 'In your cart' : contextBooking.earlyCheckIn ? 'Requested' : 'Subject to hotel confirmation' }]),
    ];
    const inCartIds = new Set(cartLines.map((line) => line.booking.serviceId));
    const arrivalDescription = inStay
      ? 'Scan the code in your room to open dining, spa, tours and room charging. Until then, the hotel can still arrange these.'
      : bookingSlot.locked
      ? contextBooking.roomNumber
        ? 'Arrange a transfer, luggage help, or another arrival service. Scan the code in your room to unlock dining, spa, tours, and room charging.'
        : 'Arrange a transfer, luggage help, or another arrival service while the hotel assigns your room. The on-property catalogue opens after your room is assigned and you scan in.'
      : 'Arrange hotel services and explore nearby restaurants, tours, rentals and more before you arrive.';

    return (
      <div className="guest-stack">
        <div className="guest-page-title">
          {exploreTabs}
          <h1>{inStay ? 'Before you scan in' : 'Arrival services'}</h1>
          <p>{arrivalDescription}</p>
        </div>

        {!online ? <Notice tone="offline" icon={<WifiSlash />} title="Browsing saved services">Live availability and booking require a connection.</Notice> : null}

        <section>
          {/* Photo cards, after Places' Discover: the service named on its picture. */}
          <div className="guest-arrival-cards">
            {arrivalServices.map((service) => {
              const image = 'categoryId' in service
                ? getArrivalServiceImage(service)
                : getPropertyImage(contextBooking.property);
              return (
                <button
                  key={service.id}
                  className="guest-arrival-card"
                  type="button"
                  onClick={() => service.id === 'transfer' ? (inStay ? openDepartureRide() : openArrivalRide()) : service.id === 'early-check-in' ? (contextBooking.earlyCheckIn ? (setSelectedStayEntryId(earlyCheckInBookingId(contextBooking.id)), go('stay-entry')) : go('early-check-in')) : openServiceBooking(service.id)}
                >
                  <Image className="guest-arrival-card__image" src={image.src} alt="" fill sizes="(max-width: 720px) 100vw, 560px" style={{ objectPosition: image.focalPoint }} />
                  {'note' in service ? <span className="guest-arrival-card__chip">{service.note}</span> : inCartIds.has(service.id) ? <span className="guest-arrival-card__chip">In your cart</span> : null}
                  <span className="guest-arrival-card__copy">
                    <b>{service.name}</b>
                    <small>{inStay && service.id === 'transfer' ? 'A hotel car from the door to departures.' : ARRIVAL_BLURBS[service.id] ?? 'Arranged by the hotel before you arrive.'}</small>
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
          preArrival ? (
            <NearbyDiscoverySection
              city={contextBooking.city}
              property={contextBooking.property}
              empty={emptyCatalogue}
              onSelect={(category) => { setSelectedCategory(category); go('nearby-recommendations'); }}
            />
          ) : <Notice title="Hotel confirmation">
            Some arrival requests depend on hotel availability. Hotel services are charged to your room and settled at the front desk at checkout; partners on property can also be paid now. We&rsquo;ll show whether it is complimentary or needs hotel confirmation before you book.</Notice>
        )}
        {preArrival ? <ArrivalCartDock totals={cartSummary} onOpen={() => go('arrival-cart')} /> : null}
      </div>
    );
  };

  const draftHotel = findStayHotel(stayDraft.hotelId);
  const held = heldRooms(session.bookings);
  const promoAccount = promoAccountFor(session);
  /* Came in with a booking reference: one stay, on this phone, no account behind it. */
  const isGuest = session.auth === 'anonymous';
  const savedHotelIds = useSavedHotels();
  /* The guest keeps everything; only who holds it changes. */
  const signInGuest = (method: AuthMethod) => setSession((current) => convertGuestToAccount(current, method));
  const draftRooms = stayDraft.cart.reduce((sum, line) => sum + line.quantity, 0);
  const resumeBooking = draftHotel && stayDraft.cart.length
    ? {
      title: draftHotel.name,
      detail: `${draftRooms} ${draftRooms === 1 ? 'room' : 'rooms'} · ${stayDatesLabel(stayDraft.search.checkIn, stayDraft.search.checkOut)}`,
      onResume: () => go('book-stay-hotel'),
    }
    : undefined;

  /* Partner hotels to look at, save and send to someone: one browse, wherever it opens. */
  const renderHotelBrowse = () => (
    <>
      <div className="guest-page-title">
        <h1>{showNoBookingExplore ? 'Explore' : 'Hotels'}</h1>
        {!showNoBookingExplore ? <p>Partner hotels across the Philippines: browse, save, or share one with whoever you’re travelling with.</p> : null}
      </div>
      <HotelBrowse
        staySearch={stayDraft.search}
        onSearchStay={startStaySearch}
        onOpenHotel={openPartnerHotel}
        resumeBooking={showNoBookingExplore ? undefined : resumeBooking}
        promoAccount={promoAccount}
        showOffers={!showNoBookingExplore}
        showSaved={!showNoBookingExplore}
        showDestinations={!showNoBookingExplore}
        showThemes={showNoBookingExplore}
      />
    </>
  );

  const renderStayBooking = () => {
    const { search } = stayDraft;
    const hotel = findStayHotel(stayDraft.hotelId);
    /*
      "Book another stay" opens the search itself, full screen, over wherever
      the guest was: closing it goes back there.
    */
    const searchPage = <StaySearchSheet value={search} onClose={back} onSearch={startStaySearch} />;
    if (activeScreen === 'book-stay') return searchPage;
    // Hotels from Browse mid-stay, and from Explore after checkout: the same browse as the no-booking Home.
    if (activeScreen === 'partner-hotels') return <div className="guest-stack">{renderHotelBrowse()}</div>;
    if (activeScreen === 'book-stay-results') {
      return <StayResultsScreen search={search} view={resultsView} onViewChange={setResultsView} onSearch={(next) => setStayDraft((draft) => ({ ...draft, search: next }))} onOpenHotel={openPartnerHotel} held={held} account={promoAccount} showOffers={!showNoBookingExplore} />;
    }
    if (activeScreen === 'book-stay-confirmation') {
      const booking = session.bookings.find((item) => item.id === confirmedStayId);
      return booking
        ? <StayConfirmationScreen booking={booking} onGoToStay={() => { setHistory([]); replaceScreen('stay-overview'); }} onArrangeTransfer={() => { setHistory(['stay-overview']); replaceScreen('pre-arrival-services'); }} />
        : searchPage;
    }
    // The old partner routes had no hotel of their own; they open the first.
    const current = hotel ?? findStayHotel('manila')!;
    if (activeScreen === 'book-stay-addons' && stayDraft.cart.length && stayDetails) {
      return (
        <StayAddOnsScreen
          hotel={current}
          search={search}
          addOns={stayDraft.addOns ?? []}
          onChange={(addOns) => setStayDraft((draft) => ({ ...draft, addOns }))}
          onContinue={() => go('book-stay-checkout')}
        />
      );
    }
    if (activeScreen === 'book-stay-checkout' && stayDraft.cart.length && stayDetails) {
      return (
        <StayCheckoutScreen
          hotel={current}
          search={search}
          cart={stayDraft.cart}
          allocation={stayDraft.allocation}
          details={stayDetails}
          onDetailsChange={setStayDetails}
          onContinue={() => go('book-stay-payment')}
          addOns={stayDraft.addOns}
          account={promoAccount}
        />
      );
    }
    if ((activeScreen === 'book-stay-payment' || activeScreen === 'book-stay-vouchers') && stayDraft.cart.length && stayDetails) {
      return (
        <StayPaymentScreen
          // Keep payment selection mounted as the voucher page opens.
          key={`${current.id}:${JSON.stringify(stayDraft.cart)}`}
          hotel={current}
          search={search}
          cart={stayDraft.cart}
          details={stayDetails}
          onDetailsChange={setStayDetails}
          onPaid={completeStayPayment}
          online={online}
          addOns={stayDraft.addOns}
          account={promoAccount}
          voucherPage={activeScreen === 'book-stay-vouchers'}
          onOpenVouchers={() => go('book-stay-vouchers')}
          onVoucherBack={back}
          method={stayGatewayMethod}
          onMethodChange={setStayGatewayMethod}
          accountGate={isGuest ? (
            <AccountSignInCard
              title="Sign in to book"
              text="Hotel bookings in the app belong to an account, so the receipt, refunds and your vouchers have a home. Your current stay comes with you."
              onSignIn={signInGuest}
              online={online}
            />
          ) : undefined}
        />
      );
    }
    return (
      <StayHotelScreen
        hotel={current}
        search={search}
        cart={stayDraft.hotelId === current.id ? stayDraft.cart : []}
        onCartChange={(cart) => setStayDraft((draft) => ({ ...draft, hotelId: current.id, cart }))}
        onSearchChange={(next) => setStayDraft((draft) => ({ ...draft, search: next }))}
        held={held}
        account={promoAccount}
        onOpenHotel={openPartnerHotel}
        onContinue={() => {
          const rooms = cartRooms(current, stayDraft.cart).length;
          // Keep the booking's automatic room split without asking the guest to review it.
          setStayDraft((draft) => ({ ...draft, allocation: defaultAllocation(current, draft.search, draft.cart), addOns: fitAddOns(draft.addOns, draft.search) }));
          // Arrival extras follow the stay's current rooms, dates, and party.
          setStayDetails((details) => (details && details.roomLeads.length === rooms
            ? details
            : guestDetailsFromSession(session, rooms)));
          go('book-stay-addons');
        }}
      />
    );
  };

  /* Paid: the booking joins the session and becomes the stay Home is about. */
  const completeStayPayment = (method: GatewayMethod) => {
    const hotel = findStayHotel(stayDraft.hotelId);
    if (!hotel || !stayDetails) return;
    const quote = quoteStay(hotel, stayDraft.search, stayDraft.cart, stayDetails.promoCode, promoAccount);
    // The same rooms and dates booked twice are two bookings, so the reference must not repeat a past one.
    const taken = [...session.bookings.map((item) => item.id), ...(session.payments ?? []).flatMap((payment) => (payment.bookingId ? [payment.bookingId] : []))];
    const drafted = bookingFromDraft({ hotel, search: stayDraft.search, cart: stayDraft.cart, allocation: stayDraft.allocation, details: stayDetails, quote, paidWith: GATEWAY_METHOD_LABELS[method], paidAt: PROTOTYPE_TODAY, taken });
    /*
      Paid arrival extras and the early-check-in request become service
      bookings after payment. Only the paid extras are included in its total.
    */
    const { booking, services: extras, total: extrasTotal, lines: extraLines } = withAddOns({ booking: drafted, hotel, addOns: stayDraft.addOns, method, paidAt: PROTOTYPE_TODAY });
    const payNowExtras = extras.filter((item) => item.serviceId !== 'early-check-in');
    const payNowExtraLines = extraLines.filter((line) => line.id !== 'early-check-in');
    const roomLeads = [...new Set(stayDetails.roomLeads.map((name) => name.trim()).filter((name) => name && name !== stayDetails.name.trim()))];
    // The booker plus each other room's named lead: when that is the whole party, nobody is left to name.
    // Other rooms' lead guests are the people the hotel should expect: this booking's own guest list.
    const namedBooking = {
      ...booking,
      companions: roomLeads,
      companionsNamed: roomLeads.length + 1 >= booking.guestCount,
      honouredPreferences: summarizeRoomPreferences(session.roomPreferences),
    };
    const stayRooms = stayDraft.cart.reduce((sum, line) => sum + line.quantity, 0);
    setSession((current) => recordPayment({
      ...current,
      guestName: stayDetails.name.trim() || current.guestName || booking.guestName,
      email: stayDetails.email.trim() || current.email,
      mobile: stayDetails.phone.trim() || current.mobile,
      record: current.record ? { ...current.record, mobile: stayDetails.phone.trim() || current.record.mobile } : current.record,
      additionalGuests: roomLeads.length
        ? [...roomLeads, ...current.additionalGuests.filter((name) => !roomLeads.includes(name))]
        : current.additionalGuests,
      bookings: [...current.bookings.filter((item) => item.id !== booking.id), namedBooking],
      serviceBookings: [...extras, ...current.serviceBookings.filter((item) => !extras.some((extra) => extra.id === item.id))],
      // The app follows the stay in progress, else the trip that starts soonest -- the new one only if it is that trip.
      activeBookingId: ([...current.bookings.filter((item) => item.status === 'active' || item.status === 'upcoming'), booking]
        .sort((x, y) => Number(y.status === 'active') - Number(x.status === 'active') || x.checkIn.localeCompare(y.checkIn))[0] ?? booking).id,
    }, {
      id: `pay-stay-${booking.id}`,
      paidAt: PROTOTYPE_TODAY,
      kind: 'stay',
      title: hotel.name,
      detail: `${stayRooms} ${stayRooms === 1 ? 'room' : 'rooms'}${payNowExtras.length ? ` + ${payNowExtras.length} ${payNowExtras.length === 1 ? 'extra' : 'extras'}` : ''} · ${stayDatesLabel(stayDraft.search.checkIn, stayDraft.search.checkOut)}`,
      amount: quote.total + extrasTotal,
      method,
      bookingId: booking.id,
      // Keep each room separate so mixed cancellation terms remain clear on the receipt.
      items: [
        ...(namedBooking.reservation?.rooms ?? []).map((room, index) => ({
          id: room.id ?? `${booking.id}-room-${index + 1}`,
          title: `Room ${bookedRoomNumber(room, index)} · ${room.roomName}`,
          amount: room.amount ?? 0,
        })),
        ...payNowExtras.map((item, index) => ({ id: item.id, title: item.title, amount: payNowExtraLines[index]!.amount })),
      ],
      refunded: 0,
    }));
    setConfirmedStayId(booking.id);
    setStayDraft((draft) => ({ ...draft, hotelId: undefined, cart: [], allocation: [], addOns: [] }));
    setStayDetails(null);
    setCancelNotice(null);
    setHistory([]);
    replaceScreen('book-stay-confirmation');
  };

  const cancelStayBooking = (bookingId: string, roomIndexes?: number[]) => {
    const booking = session.bookings.find((item) => item.id === bookingId);
    if (!booking?.reservation) return;
    if (!canCancelReservation(booking)) return;
    const selected = [...new Set((roomIndexes ?? booking.reservation.rooms.map((_, index) => index)).filter((index) => Number.isInteger(index) && index >= 0 && index < booking.reservation!.rooms.length))];
    if (!selected.length) return;
    const everything = selected.length === booking.reservation.rooms.length;
    const selection = cancelRooms(booking, selected);
    const roomUpdates = selected.map((index) => {
      const room = booking.reservation!.rooms[index]!;
      const terms = roomCancellationTerms(booking, index);
      return { id: room.id ?? `${booking.reservation!.reference}-room-${index + 1}`, refundAmount: terms?.refund ?? 0, cancelled: true };
    });
    const names = selected.map((index) => `Room ${bookedRoomNumber(booking.reservation!.rooms[index]!, index)} · ${booking.reservation!.rooms[index]!.roomName}`).join(', ');
    const paidServices = session.serviceBookings.filter((item) => item.bookingId === bookingId && item.status === 'confirmed' && item.paymentStatus === 'paid');

    /* Some rooms, not all: the booking stays, smaller, and the guest stays on it. */
    if (!everything) {
      const smaller = selection.booking;
      // The pickup booked with the rooms now carries only who is still coming.
      const pickup = session.serviceBookings.find((item) => item.bookingId === bookingId && item.serviceId === 'transfer' && item.status === 'confirmed');
      const fitted = pickup ? fitPickupToParty(smaller, pickup) : undefined;
      const kept = fitted?.booking ?? smaller;
      const pickupUpdate = fitted?.refund ? [{ id: fitted.service.id, refundAmount: fitted.refund }] : [];
      const refund = selection.refund + (fitted?.refund ?? 0);
      const retainedTotal = (booking.reservation.cancellationRetainedTotal ?? 0) + selection.retainedAmount;
      setSession((current) => refundBookingItems({
        ...current,
        bookings: current.bookings.map((item) => (item.id === bookingId ? kept : item)),
        serviceBookings: fitted ? current.serviceBookings.map((item) => (item.id === fitted.service.id ? fitted.service : item)) : current.serviceBookings,
      }, bookingId, [...roomUpdates, ...pickupUpdate]));
      const refundMessage = refund ? `${peso(refund)} is on its way back the way you paid.` : 'No refund is due for those room rates.';
      const retainedMessage = retainedTotal ? ` ${peso(retainedTotal)} in cancelled room charges won’t be refunded${booking.reservation.cancellationRetainedTotal ? ', including earlier cancellations' : ''}.` : '';
      const remaining = booking.reservation.rooms.length - selected.length;
      setRoomCancelNotice(`${names} cancelled. ${refundMessage}${retainedMessage} ${remaining} ${remaining === 1 ? 'room stays' : 'rooms stay'} booked.${fitted ? ` Your airport pickup is now for ${fitted.passengers}${fitted.refund ? ` in the ${fitted.service.facts?.find((fact) => fact.label === 'Vehicle')?.value.toLowerCase()}, and ${peso(fitted.refund)} of the refund is the lower fare` : ''}.` : ''}`);
      return;
    }
    // Whatever was booked for the stay goes with it: arrival services in the cart or already paid for.
    const hadServices = session.serviceBookings.some((item) => item.bookingId === bookingId) || (session.cart ?? []).some((line) => line.booking.bookingId === bookingId);
    const serviceRefund = paidServices.reduce((sum, item) => sum + parsePesoAmount(item.amount), 0);
    const serviceUpdates = paidServices.map((item) => ({ id: item.id, refundAmount: parsePesoAmount(item.amount), cancelled: true }));
    const refund = selection.refund + serviceRefund;
    const retainedTotal = (booking.reservation.cancellationRetainedTotal ?? 0) + selection.retainedAmount;
    setSession((current) => {
      const bookings = current.bookings.filter((item) => item.id !== bookingId);
      const itemRefunded = refundBookingItems(current, bookingId, [...roomUpdates, ...serviceUpdates]);
      const servicesRefunded = returnPoints(
        refundRemainingLinkedPayments(itemRefunded, bookingId, paidServices.map((item) => item.id)),
        current.serviceBookings.filter((item) => item.bookingId === bookingId).map((item) => item.id),
      );
      return {
        ...servicesRefunded,
        bookings,
        activeBookingId: current.activeBookingId === bookingId ? undefined : current.activeBookingId,
        serviceBookings: current.serviceBookings.filter((item) => item.bookingId !== bookingId),
        cart: current.cart?.filter((line) => line.booking.bookingId !== bookingId),
      };
    });
    setCancelNotice(`${booking.property} is cancelled. ${refund ? `${peso(refund)} is on its way back the way you paid.` : 'No refund is due under the selected room rates.'}${retainedTotal ? ` ${peso(retainedTotal)} in cancelled room charges won’t be refunded${booking.reservation.cancellationRetainedTotal ? ', including earlier cancellations' : ''}.` : ''}${hadServices ? ' Linked arrival services and extras have also been cancelled.' : ''}`);
    setHistory([]);
    replaceScreen('stay-overview');
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
              const next = restoreAccountActivity(ssoSession(method), readAccountStash());
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

                const next = restoreAccountActivity(emailLoginSession(pendingEmail), readAccountStash());
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

      case 'identify':
        return renderBookingLookup();

      case 'booking-found':
        return (
          <StayConfirm
            booking={displayBooking}
            art={<PropertyImage property={displayBooking.property} decorative />}
            doneText={session.auth === 'authenticated'
              ? `${displayBooking.property} is in your Cabana now, with everything for the stay.`
              : `${displayBooking.property} is in your Cabana now. A few details next, and you’re ready to arrive.`}
            onConfirm={claimBooking}
            secondary={<TextButton onClick={() => go('identify')}>No, this isn&rsquo;t my booking</TextButton>}
          />
        );

      case 'stay-overview':
        return (
          <>
            {cancelNotice ? (
              <div className="sb-cancel-notice" role="status">
                <Notice tone="positive" icon={<CheckCircle />} title="Booking cancelled">{cancelNotice}</Notice>
                <button type="button" aria-label="Dismiss" onClick={() => setCancelNotice(null)}><X /></button>
              </div>
            ) : null}
            <StayOverviewHome
              resumeBooking={resumeBooking}
              session={session}
              pastStays={pastStays}
              reviews={session.reviews}
              booking={hasCurrentStay ? primaryBooking : undefined}
              staySearch={stayDraft.search}
              onSearchStay={startStaySearch}
              promoAccount={promoAccount}
              online={online}
              deskOpen={postStayWindow.deskOpen}
              onNavigate={go}
              picks={primaryBooking ? recommendedPicks(stayFeed(primaryBooking)) : []}
              onOpenPick={openPick}
              onOpenStay={(id) => { setSelectedPastStayId(id); go('stay-detail'); }}
              onOpenHotel={openPartnerHotel}
              onRequestRide={(direction) => (direction === 'arrival' ? openArrivalRide() : openDepartureRide())}
              onOpenEntry={(id) => { setSelectedStayEntryId(id); go('stay-entry'); }}
              onRatePreviousStay={(stayId) => { setReviewingStayId(stayId); go('stay-review'); }}
              clockHour={clockHour}
            />
            {primaryBooking && preArrival ? <ArrivalCartDock totals={cartSummary} onOpen={() => go('arrival-cart')} /> : null}
          </>
        );

      case 'partner-hotels':
      case 'book-stay':
      case 'book-stay-results':
      case 'book-stay-hotel':
      case 'book-stay-addons':
      case 'book-stay-checkout':
      case 'book-stay-payment':
      case 'book-stay-vouchers':
      case 'book-stay-confirmation':
        return renderStayBooking();

      /* Restored route renderers for screens that remained reachable in navigation. */
      case 'identify-returning':
        return (
          <ScreenIntro
            eyebrow="Step 1 of 2"
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
              <Field label="Last name" name="reentry-last-name" placeholder="As on the booking" autoComplete="family-name" required />
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

      case 'front-desk-assist':
        return primaryBooking ? (
          <ScreenIntro icon={<ChatCircleDots size={30} />} title="Contact the front desk" text="Your booking is connected. Send the hotel a message about this stay.">
            <StayMiniCard booking={primaryBooking} status={describeStayStatus(primaryBooking).label} />
            {primary('Open the front desk conversation', 'chat')}
          </ScreenIntro>
        ) : (
          <ScreenIntro icon={<Receipt size={30} />} title="Connect a booking first" text="Front desk support is available from a connected stay.">
            {primary('Find my booking', 'identify')}
          </ScreenIntro>
        );

      case 'no-booking':
        return <ScreenIntro icon={<Receipt size={30} />} eyebrow="No booking found" title="Connect a hotel booking" text="Cabana connects to confirmed hotel bookings."><Notice title="Already booked?">Try the confirmation number from your hotel or booking provider.</Notice>{primary('Try again', 'identify')}<TextButton onClick={() => go('identify-returning')}>Stayed with us before? Use a booking reference</TextButton><TextButton onClick={() => go('partner-hotels')}>Find a hotel’s contact details</TextButton></ScreenIntro>;

      case 'guest-details':
        return (
          <IdentityStep
            guestName={session.guestName || lookupBooking?.guestName || 'Guest'}
            email={session.email}
            record={session.record}
            passportFields={primaryPassportFields ?? { documentNumber: session.record?.documentNumber ?? '', expiry: session.record?.expiry ?? '', dateOfBirth: session.record?.dateOfBirth, sex: session.record?.sex }}
            onPassportFieldsChange={setPrimaryPassportFields}
            onContinue={({ name, email, mobile, nationality, passport }) => {
              // Kept on the profile now, not on this screen: the next booking opens with it filled in.
              setSession((current) => ({
                ...current,
                guestName: name,
                email,
                record: { nationality, documentNumber: passport.documentNumber.trim(), expiry: passport.expiry, mobile: mobile || undefined, dateOfBirth: passport.dateOfBirth ?? current.record?.dateOfBirth, sex: passport.sex ?? current.record?.sex },
              }));
              setPrimaryPassportFields(null);
              go('additional-guests');
            }}
          />
        );

      case 'room-preferences': {
        const fromHome = history[history.length - 1] === 'stay-overview';
        return (
          <RoomPreferencesScreen
            preferences={session.roomPreferences}
            property={fromHome ? primaryBooking?.property : undefined}
            onSave={(roomPreferences) => {
              setSession((cur) => ({ ...cur, roomPreferences }));
              if (history.length > 0) back();
              else go('profile');
            }}
            onCancel={() => (history.length > 0 ? back() : go('profile'))}
          />
        );
      }

      case 'additional-guests': {
        // The people on record who fit this booking are already on the list; the rest are one tap away.
        const plan = planCompanions(session, contextBooking);
        return (
          <AdditionalGuestsScreen
            bookedGuests={contextBooking.guestCount}
            primaryGuestName={session.guestName || 'Guest'}
            primaryGuestEmail={session.email}
            initialCompanions={plan.selected}
            suggestions={plan.suggestions}
            onSave={(companions) => {
              completePreArrival({
                additionalGuests: companions.map((person) => person.name.trim()),
                companionRecords: mergeCompanionRecords(session.companionRecords, companions),
              });
            }}
          />
        );
      }

      case 'repeat-review': {
        /*
          One tap when the hotel can already have everything: the ID on file,
          the people who fit this booking, the room preferences. Each block
          edits in place; nothing here is asked again.
        */
        const plan = planCompanions(session, contextBooking);
        const record = session.record;
        const ready = hasSavedDetails(session);
        return (
          <ScreenIntro
            eyebrow={contextBooking.property}
            title="Review, then confirm"
            text="This is what the hotel will receive. Check it, change anything that is different, then send."
          >
            <div className="guest-review-card">
              <ReviewBlock
                icon={<Person />}
                title={session.guestName || 'Your details'}
                lines={[
                  ...[session.email, record?.mobile].filter((line): line is string => Boolean(line)),
                  ready && record ? `${record.nationality} · ID ${maskDocument(record.documentNumber)} · expires ${passportDate(record.expiry)}` : 'No ID on file yet',
                ]}
                onEdit={() => go('guest-details')}
              />
              <ReviewBlock
                icon={<Bed />}
                title="Room preferences"
                lines={[
                  [session.roomPreferences.floor, session.roomPreferences.bed, session.roomPreferences.smoking].filter(Boolean).join(' · '),
                  session.roomPreferences.accessibility.length > 0
                    ? `Accessibility: ${session.roomPreferences.accessibility.join(', ')}`
                    : 'Standard room access',
                ]}
                onEdit={() => go('room-preferences')}
              />
              <ReviewBlock
                icon={<Users />}
                title={plan.selected.length === 1 ? 'Additional guest' : 'Additional guests'}
                lines={plan.selected.length ? plan.selected.map((person) => `${person.name} · ${isCompleteCompanion(person) ? 'ID on file' : 'ID needed'}`) : ['None added']}
                onEdit={() => go('additional-guests')}
              />
            </div>
            {ready ? (
              <Button
                className="guest-button guest-button--primary"
                type="button"
                onClick={() => completePreArrival({
                  additionalGuests: plan.selected.map((person) => person.name.trim()),
                  companionRecords: mergeCompanionRecords(session.companionRecords, plan.selected),
                })}
              >
                Confirm and send to hotel<ArrowRight aria-hidden="true" />
              </Button>
            ) : (
              <Button className="guest-button guest-button--primary" type="button" onClick={() => go('guest-details')}>
                Add your ID details<ArrowRight aria-hidden="true" />
              </Button>
            )}
            <TextButton onClick={() => go('guest-details')}>Edit details</TextButton>
          </ScreenIntro>
        );
      }

      case 'room-upgrades':
        return <div className="guest-stack"><div className="guest-page-title"><p className="guest-eyebrow">Current stay · Room {contextBooking.roomNumber}</p><h1>Available upgrades</h1><p>Explore rooms available for the rest of your stay.</p></div>{ROOM_UPGRADES.map((upgrade) => <article className="guest-upgrade-card" key={upgrade.id}><Image src={upgrade.image} alt="" width={900} height={360} /><div className="guest-upgrade-card__body"><div><h2>{upgrade.name}</h2><p>{upgrade.type}</p></div><p>{upgrade.features}</p><small>Up to {upgrade.guests} · {upgrade.transfer}</small><strong>{upgrade.price} additional for the remaining stay</strong><Button className="guest-button guest-button--primary" type="button" onClick={() => { setSelectedUpgradeId(upgrade.id); go('room-upgrade-confirmation'); }}>Select room<ArrowRight /></Button></div></article>)}</div>;

      case 'room-upgrade-confirmation': {
        const upgrade = ROOM_UPGRADES.find((item) => item.id === selectedUpgradeId) ?? ROOM_UPGRADES[0];
        return <ScreenIntro icon={<Bed size={30} />} title="Request this upgrade" text="The hotel confirms the room and assigns its number. Nothing is charged until they do."><div className="guest-summary"><SummaryRow label="Current room" value={`${contextBooking.roomType} · Room ${contextBooking.roomNumber ?? '—'}`} /><SummaryRow label="Requested upgrade" value={upgrade.name} /><SummaryRow label="Additional cost" value={upgrade.price} strong /><SummaryRow label="Transfer" value={upgrade.transfer} /><SummaryRow label="If approved" value="Added to your room bill, settled at checkout" /></div><NotesField name="upgrade-note" value={upgradeNote} onChange={setUpgradeNote} placeholder="A quiet floor, a bed type, anything for the new room…" /><Button className="guest-button guest-button--primary" type="button" onClick={() => { if (!online) { setBookingBlockedReason('offline'); go('booking-blocked'); return; } if (!canUseOnPropertyServices(contextBooking)) { setBookingBlockedReason(blockedReasonFor(contextBooking)); go('booking-blocked'); return; } const next = requestRoomUpgrade(session, contextBooking.id, upgrade, undefined, upgradeNote); /* One already with the hotel: show it, where it can be withdrawn. */ if (next === session) { goReplacing('my-stay'); return; } setSession(next); setUpgradeNote(''); notifyGuestRequest(`service-upgrade-${contextBooking.id}`, 'Room upgrade requested', 'The hotel will confirm the room and price.'); goReplacing('room-upgrade-success'); }}>Request upgrade<ArrowRight /></Button><TextButton onClick={() => go('room-upgrades')}>Choose another room</TextButton></ScreenIntro>;
      }

      case 'room-upgrade-success': {
        const upgrade = ROOM_UPGRADES.find((item) => item.id === selectedUpgradeId) ?? ROOM_UPGRADES[0];
        return <ScreenIntro icon={<CheckCircle size={30} />} title="Upgrade requested" text={`The hotel will confirm your ${upgrade.name} and assign its room number. You keep Room ${contextBooking.roomNumber} until then.`}><div className="guest-summary"><SummaryRow label="Current room" value={`${contextBooking.roomType} · Room ${contextBooking.roomNumber}`} /><SummaryRow label="Requested" value={upgrade.name} /><SummaryRow label="If approved" value={upgrade.price} strong /></div><Notice title="Nothing charged yet">It goes on your room bill once the hotel approves. You can withdraw the request from My Stay until then.</Notice>{primary('View on My Stay', 'my-stay')}</ScreenIntro>;
      }

      case 'room-transfer-details': {
        const upgrade = contextBooking.roomUpgrade;
        if (!upgrade) return primary('View my stay', 'my-stay');
        return <ScreenIntro icon={<Bed size={30} />} title="Complete your room transfer" text="Both rooms remain available until you confirm the move."><div className="guest-summary"><SummaryRow label="Current room" value={`${contextBooking.roomType} · Room ${contextBooking.roomNumber}`} /><SummaryRow label="New room" value={`${upgrade.newRoomType} · Room ${upgrade.newRoomNumber}`} /><SummaryRow label="Transfer deadline" value={upgrade.transferDeadline} /><SummaryRow label="Transfer time" value={upgrade.transferTime} /></div><Notice title="Moving your belongings">Pack your belongings and contact the front desk if you need help transferring your bags.</Notice><Notice title="Keys">Collect or activate the new key at the front desk, then return your Room {contextBooking.roomNumber} key there.</Notice><button className="guest-list-row" type="button" onClick={() => go('chat')}><span><ChatCircleDots /></span><div><b>Contact the front desk</b><small>Chat with the hotel team about your transfer</small></div><CaretRight /></button><Button className="guest-button guest-button--primary" type="button" onClick={() => { setSession((current) => ({ ...current, bookings: current.bookings.map((booking) => booking.id === contextBooking.id && booking.roomUpgrade ? { ...booking, roomType: booking.roomUpgrade.newRoomType, roomNumber: booking.roomUpgrade.newRoomNumber, roomUpgrade: undefined } : booking) })); go('stay-overview'); }}>Confirm room transfer<ArrowRight /></Button></ScreenIntro>;
      }

      case 'rate-detail': {
        // Opened from Profile > Stays, it is that trip; otherwise the stay the app follows.
        const displayBooking = (viewedBookingId ? session.bookings.find((item) => item.id === viewedBookingId) : undefined) ?? followedBooking;
        /*
          Booking detail owns the reservation and prepaid rate. Stay-change
          requests live here too; My Stay keeps the live folio and checkout.
        */
        const bookingGuests = listBookingGuests(displayBooking, session);
        const bookingStatus = describeStayStatus(displayBooking);
        const canManageActiveStay = displayBooking.status === 'active' && bookingStatus.status !== 'checked-out';
        const canUpgradeRoom = canOfferRoomUpgrade(displayBooking);
        /* Booked and paid in this app: the reservation is ours to show in full, and to cancel. */
        const reservation = displayBooking.reservation;
        const manageAppBooking = Boolean(reservation) && displayBooking.status === 'upcoming';
        const cancellable = canCancelReservation(displayBooking);
        const reminder = cancellationReminder(displayBooking);
        const cancellation = bookingCancellationSummary(displayBooking);
        const roomCancellationCopy = (index: number) => {
          const terms = roomCancellationTerms(displayBooking, index);
          if (terms?.reason === 'free' && terms.until) return `Free until ${weekdayDate(terms.until)}`;
          if (terms?.reason === 'saver') return 'No refund · Saver rate';
          if (terms?.reason === 'ended' && terms.until) return `Free cancellation ended ${weekdayDate(terms.until)}`;
          return 'No refund after check-in';
        };
        return (
          <ScreenIntro eyebrow={`Booking ${displayBooking.id}`} title="Room and rate" text={pmsDown ? `As the hotel’s system last reported them, at ${PMS_LAST_SYNC}.` : 'The latest details returned by the hotel system.'}>
            {pmsDown ? <StaleDataNotice asOf={PMS_LAST_SYNC} onRetry={() => setPmsDown(false)} onAsk={() => go('chat')} /> : null}
            {roomCancelNotice && reservation ? <Notice tone="positive" icon={<CheckCircle />} title="Room cancelled">{roomCancelNotice}</Notice> : null}
            {reminder && !roomCancelNotice ? (
              <Notice tone="warning" icon={<Clock />} title={reminder.daysLeft === 0 ? 'Free cancellation ends today' : reminder.daysLeft === 1 ? 'Free cancellation ends tomorrow' : `Free cancellation ends in ${reminder.daysLeft} days`}>
                For {reminder.rooms} {reminder.rooms === 1 ? 'room' : 'rooms'} · until {weekdayDate(reminder.until)}, 11:59 PM.
              </Notice>
            ) : null}
            {/* The card says what the rows below say: "Checked in", not a stale "Confirmed". */}
            <StayCard booking={displayBooking} compact statusLabel={describeStayStatus(displayBooking).label} />
            {canUpgradeRoom || canManageActiveStay || manageAppBooking ? (
              <section className="guest-booking-management">
                <SectionHeading title="Manage your stay" />
                <div className="guest-list-group">
                  {canUpgradeRoom ? (
                    <button className="guest-list-row" type="button" onClick={() => go('room-upgrades')}>
                      <span><Bed aria-hidden="true" /></span>
                      <div><b>Upgrade room</b><small>Explore available rooms</small></div>
                      <CaretRight aria-hidden="true" />
                    </button>
                  ) : null}
                  {manageAppBooking && reservation ? (
                    <>
                      <button className="guest-list-row" type="button" onClick={() => { setChatDraft(`I'd like to change my booking ${reservation.reference} at ${displayBooking.property} (${formatStayDateRange(displayBooking)}, ${reservation.rooms.length} ${reservation.rooms.length === 1 ? 'room' : 'rooms'}). What I'd like to change: `); go('chat'); }}>
                        <span><CalendarPlus aria-hidden="true" /></span>
                        <div><b>Change dates or rooms</b><small>The front desk can move or resize your booking.</small></div>
                        <CaretRight aria-hidden="true" />
                      </button>
                      {cancellable ? (
                        <button className="guest-list-row guest-list-row--danger" type="button" onClick={() => setCancelSheetOpen(true)}>
                          <span><X aria-hidden="true" /></span>
                          <div><b>{reservation.rooms.length > 1 ? 'Cancel rooms or booking' : 'Cancel booking'}</b><small>Refunds depend on each room’s rate and cancellation deadline.</small></div>
                          <CaretRight aria-hidden="true" />
                        </button>
                      ) : null}
                    </>
                  ) : null}
                  {canManageActiveStay ? (
                    <>
                      <button className="guest-list-row" type="button" onClick={openLateCheckoutChat}>
                        <span><Clock aria-hidden="true" /></span>
                        <div><b>Request late checkout</b><small>Ask for a later checkout time.</small></div>
                        <CaretRight aria-hidden="true" />
                      </button>
                      <button className="guest-list-row" type="button" onClick={openExtensionChat}>
                        <span><CalendarPlus aria-hidden="true" /></span>
                        <div><b>Extend your stay</b><small>Ask if your room is available for another night.</small></div>
                        <CaretRight aria-hidden="true" />
                      </button>
                    </>
                  ) : null}
                </div>
              </section>
            ) : null}

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
                <SummaryRow label="Dates" value={`${formatStayDateRange(displayBooking)} · ${countNights(displayBooking)} ${countNights(displayBooking) === 1 ? 'night' : 'nights'}`} />
                {reservation ? reservation.rooms.map((room, index) => (
                  <SummaryRow
                    key={index}
                    label={`Room ${index + 1}`}
                    value={`${room.roomName} · ${room.adults} ${room.adults === 1 ? 'adult' : 'adults'}${room.children ? `, ${room.children} ${room.children === 1 ? 'child' : 'children'}` : ''} · ${RATE_PLAN_LABELS[room.ratePlanId].title} · ${roomCancellationCopy(index)}`}
                  />
                )) : <SummaryRow label="Room" value={displayBooking.roomNumber ? `${displayBooking.roomType} · ${displayBooking.roomNumber}` : `${displayBooking.roomType} · assigned at arrival`} />}
                {/* Booked one type, given a better one when it was full: said, and said to be free. */}
                {displayBooking.complimentaryUpgrade ? <SummaryRow label="Upgrade" value={`From ${displayBooking.complimentaryUpgrade.from} · complimentary`} /> : null}
                <SummaryRow label="Party" value={describeParty(displayBooking, session)} />
                <SummaryRow label="Booked through" value={displayBooking.source} />
                {reservation?.receipt ? <SummaryRow label="Official receipt" value={`Requested · ${reservation.receipt.company} · TIN ${reservation.receipt.tin} · issued by the hotel at check-out`} /> : null}
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
                      <small>{guest.role === 'lead' ? 'Lead booker' : 'Additional guest'}</small>
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
                {reservation ? (
                  <>
                    {reservation.addOns?.length ? (
                      <>
                        <SummaryRow label="Rooms" value={peso(reservation.total)} />
                        {/* Keep each extra's current settlement state visible. */}
                        {reservation.addOns.map((extra) => {
                          const live = session.serviceBookings.find((service) => service.id === extra.serviceBookingId);
                          const value = !live
                            ? extra.amount ? peso(extra.amount) : 'Free'
                            : live.status === 'cancelled'
                              ? live.paymentStatus === 'refunded' ? 'Cancelled · refunded' : 'Cancelled · no charge'
                              : live.paymentStatus === 'pending-confirmation'
                                ? `${peso(extra.amount)} · On room if confirmed`
                                : live.paymentStatus === 'charged-to-room'
                                  ? `${peso(extra.amount)} · On room bill`
                                  : extra.amount ? peso(extra.amount) : 'Free';
                          return <SummaryRow key={extra.serviceBookingId} label={extra.title} value={value} />;
                        })}
                      </>
                    ) : null}
                    {reservation.cancellationRetainedTotal ? <SummaryRow label="Room charges kept" value={peso(reservation.cancellationRetainedTotal)} /> : null}
                    {reservation.promo ? <SummaryRow label="Voucher" value={`${reservation.promo.code} · −${peso(reservation.promo.discount)}`} /> : null}
                    {/* What was paid and what has come back, from the payment itself: a sum of what is left read as "paid" after a refund. */}
                    {(() => {
                      const stayPayment = (session.payments ?? []).find((payment) => payment.bookingId === displayBooking.id && payment.kind === 'stay');
                      if (!stayPayment) return <SummaryRow label="Paid" value={`${peso(reservation.total + (reservation.cancellationRetainedTotal ?? 0) + (reservation.addOnsTotal ?? 0))} · ${reservation.paidWith}`} strong />;
                      return (
                        <>
                          <SummaryRow label="Paid" value={`${peso(stayPayment.amount)} · ${reservation.paidWith}`} strong={!stayPayment.refunded} />
                          {stayPayment.refunded ? <SummaryRow label="Refunded" value={`${peso(stayPayment.refunded)} · to ${reservation.paidWith}`} /> : null}
                          {stayPayment.refunded ? <SummaryRow label="You paid, after refunds" value={peso(stayPayment.amount - stayPayment.refunded)} strong /> : null}
                        </>
                      );
                    })()}
                    <SummaryRow
                      label="Cancellation"
                      value={cancellation.refundableRooms === cancellation.totalRooms && cancellation.until
                        ? `All rooms · free until ${weekdayDate(cancellation.until)}`
                        : cancellation.refundableRooms && cancellation.until
                          ? `${cancellation.refundableRooms} of ${cancellation.totalRooms} rooms · free until ${weekdayDate(cancellation.until)}`
                          : 'No refund on cancellation'}
                    />
                  </>
                ) : (
                  <>
                    <SummaryRow label="Room rate" value={displayBooking.roomRate ?? 'Not provided'} />
                    <SummaryRow label="Payment details" value="Provided by your booking provider" />
                  </>
                )}
              </div>
            </section>
            {!online ? <Notice tone="offline" icon={<WifiSlash />} title="Live hotel data">Availability, rates, and payment details require a connection.</Notice> : null}
            {reservation && displayBooking.status === 'upcoming' ? <GettingThere city={displayBooking.city} onArrangeTransfer={session.serviceBookings.some((service) => service.bookingId === displayBooking.id && service.serviceId === 'transfer' && service.status === 'confirmed') ? undefined : () => go('pre-arrival-services')} /> : null}
            {cancelSheetOpen && reservation ? (
              <CancelReservationSheet
                booking={displayBooking}
                hasLinkedExtras={session.serviceBookings.some((service) => service.bookingId === displayBooking.id && service.status === 'confirmed') || cartFor(session, displayBooking.id).length > 0}
                hasAirportPickup={session.serviceBookings.some((service) => service.bookingId === displayBooking.id && service.serviceId === 'transfer' && service.status === 'confirmed') || cartFor(session, displayBooking.id).some((line) => line.booking.serviceId === 'transfer')}
                pickupRefund={(rooms) => {
                  const pickup = session.serviceBookings.find((item) => item.bookingId === displayBooking.id && item.serviceId === 'transfer' && item.status === 'confirmed');
                  return pickup ? fitPickupToParty(cancelRooms(displayBooking, rooms).booking, pickup)?.refund ?? 0 : 0;
                }}
                extrasRefund={session.serviceBookings.filter((service) => service.bookingId === displayBooking.id && service.status === 'confirmed' && service.paymentStatus === 'paid').reduce((sum, service) => sum + parsePesoAmount(service.amount), 0)}
                onClose={() => setCancelSheetOpen(false)}
                onConfirm={(rooms) => { setCancelSheetOpen(false); cancelStayBooking(displayBooking.id, rooms); }}
              />
            ) : null}
          </ScreenIntro>
        );
      }

      case 'early-check-in':
        return (
          <ScreenIntro
            title="Check in earlier"
            text="Standard check-in is 3:00 PM. Request a room from 11:00 AM; the added charge goes on your room once you have one."
          >
            <div className="guest-price-card">
              <div>
                <small>Early check-in</small>
                <b>11:00 AM</b>
              </div>
              <strong>₱1,500</strong>
            </div>
            <Notice title="Not paid today">
              The hotel confirms availability first. If approved, the ₱1,500 charge is added to your room once you have one and settled at checkout.
            </Notice>
            {cartLines.some((line) => line.earlyCheckIn) ? (
              <>
                <Notice tone="positive" icon={<CheckCircle />} title="In your cart">Sent to the hotel when you check out with the rest of your arrival.</Notice>
                <Button className="guest-button guest-button--primary" type="button" onClick={() => go('arrival-cart')}>Review cart<ArrowRight aria-hidden="true" /></Button>
                <TextButton onClick={() => setSession((cur) => removeFromCart(cur, earlyCheckInBookingId(contextBooking.id)))}>Remove from cart</TextButton>
              </>
            ) : (
              <>
                <NotesField name="early-check-in-note" value={earlyNote} onChange={setEarlyNote} placeholder="Arriving on a red-eye, travelling with a baby…" />
                <Button
                  className="guest-button guest-button--primary"
                  type="button"
                  onClick={requestEarlyCheckIn}
                >
                  Add to cart<ArrowRight aria-hidden="true" />
                </Button>
                <TextButton onClick={() => (history.length > 0 ? back() : go('stay-overview'))}>Not now, keep 3:00 PM</TextButton>
              </>
            )}
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

      case 'pre-arrival-services':
        return renderArrivalServices();

      case 'arrival-cart':
        return (
          <ArrivalCartScreen
            property={contextBooking.property}
            lines={cartLines}
            totals={cartSummary}
            onRemove={(id) => setSession((cur) => removeFromCart(cur, id))}
            onStartPay={cartCanCheckOut}
            onSettle={settleArrivalCart}
            onBrowse={() => go('pre-arrival-services')}
          />
        );

      case 'arrival-cart-confirmation':
        return (
          <ArrivalCartConfirmation
            bookings={cartReceipt.ids.map((id) => session.serviceBookings.find((service) => service.id === id)).filter((service): service is ServiceBooking => Boolean(service))}
            method={cartReceipt.method}
            onViewStay={() => go('my-stay')}
            onBrowse={() => go('pre-arrival-services')}
          />
        );

      case 'stay-review':
      case 'stay-review-sent':
        return (
          <StayReviewForm
            mode="page"
            property={reviewPageStay?.property ?? reviewPageBooking?.property ?? contextBooking.property}
            review={reviewPageReview}
            isCheckoutDay
            onSubmit={submitStayReview}
            onBackToMyStay={() => go(primaryBooking ? 'my-stay' : 'stay-overview')}
          />
        );

      case 'marketplace': {
        /*
          The full catalogue stays behind the room scan. Keep this guard for
          direct or stale routes too; the normal Explore tab shows the arrival
          roster with the scan action until verification succeeds.
        */
        if (bookingSlot.locked) {
          return renderArrivalServices();
        }

        /*
          For you: the catalogue as reels, ordered for this guest right now
          (see promoted/feed-model.ts). Search and categories stay one tap
          away in Browse.
        */
        const feedEntries = emptyCatalogue ? [] : stayFeed(contextBooking);
        if (!feedEntries.length) {
          return (
            <div className="guest-stack">
              <div className="guest-page-title"><h1>Explore</h1></div>
              <StatePanel icon={<Compass />} title="Nothing to book right now" actions={<><Button className="guest-button guest-button--secondary" type="button" onClick={() => go('nearby-recommendations')}>See places nearby<ArrowRight aria-hidden="true" /></Button><TextButton onClick={() => go('chat')}>Ask the front desk</TextButton></>}>
                {`${contextBooking.property} has nothing open to book at the moment. Dining, spa and tours come back here as they open; the front desk can still arrange things for you.`}
              </StatePanel>
            </div>
          );
        }
        const nights = Math.max(1, countNightsBetween(contextBooking.checkIn, contextBooking.checkOut));
        const activeFeedClock = feedClock ?? defaultFeedClock(contextBooking);
        const stayFeedbackIsDue = contextBooking.status === 'active' && activeFeedClock.dayOfStay >= nights;
        return (
          <>
            <ReelFeed
              entries={feedEntries}
              onAction={(entry) => runFeedAction(entry.action)}
              onBrowse={() => setFeedSheet('browse')}
              onSeeEverything={() => { setSelectedCategory('services'); go('category-listing'); }}
              stayFeedback={stayFeedbackIsDue ? {
                property: contextBooking.property,
                review: stayReview,
                isCheckoutDay: activeFeedClock.dayOfStay > nights,
                onSubmit: saveStayReview,
              } : undefined}
            />
            {feedSheet === 'browse' ? (
              <BrowseSheet
                categories={BROWSE_CATEGORIES}
                index={EXPLORE_SEARCH_INDEX}
                recommendations={recommendedPicks(feedEntries, { limit: 4 })}
                onOpenItem={(id) => { setFeedSheet(null); openExploreItem(id); }}
                onOpenRecommendation={(entry) => runFeedAction(entry.action)}
                onOpen={openBrowseCategory}
                onOpenHotels={() => { setFeedSheet(null); go('partner-hotels'); }}
                onClose={() => setFeedSheet(null)}
              />
            ) : null}
          </>
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
        const categoryDescription: Record<MiniAppCategoryId, string> = { dining: 'Explore food and drink options at the hotel and nearby.', spa: 'Explore wellness options at the hotel and nearby.', entertainment: 'Explore activities and tours at the hotel and nearby.', rentals: 'Motorbikes, cars and bikes by the day, from the hotel driveway.', services: 'Explore hotel services and local vendors nearby.' };
        const nearbyDescription: Record<MiniAppCategoryId, string> = { dining: 'Restaurants and cafés you can book directly near the hotel.', spa: 'Book wellness appointments with nearby vendors.', entertainment: 'Book nearby tours and attractions directly.', rentals: 'Book bikes and other rentals with local vendors.', services: 'Book local services directly with nearby vendors.' };
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
              <p className="guest-catalog-section-description">Dining available at {contextBooking.property}.</p>
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
              ) : stayVenues.length === 0 ? (
                <StatePanel icon={<Storefront />} title={`No ${categoryData.title.toLowerCase()} to book right now`} actions={<TextButton onClick={() => go('chat')}>Ask the front desk</TextButton>}>
                  {`Nothing in this category is open at ${contextBooking.property} at the moment. The front desk can tell you what is coming up.`}
                </StatePanel>
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
              <p className="guest-catalog-section-description">{categoryData.title} available at {contextBooking.property}.</p>
              {visibleServices.length ? (
              <div className="guest-stack guest-catalog-option-list" style={{ gap: '16px' }}>
                {visibleServices.map((service) => (
                  <button
                    key={service.id}
                    className="guest-catalog-option-card"
                    type="button"
                    onClick={() => openExploreItem(service.id)}
                  >
                    <div className="guest-catalog-option-card__media">
                      <ServiceImage imageKey={getServiceImageKey(service)} itemId={service.id} categoryId={service.categoryId} variant="card" tone={service.tone} icon={service.categoryId === 'spa' ? <Sparkle /> : service.categoryId === 'entertainment' ? <Compass /> : service.categoryId === 'rentals' ? <Moped /> : <Storefront />} decorative />
                      <h2 className="guest-catalog-option-card__name">{service.name}</h2>
                    </div>
                    {/* The price and who runs it: "Third-party on property" and a cutoff were supplier-contract terms. */}
                    <div className="guest-catalog-option-card__details">
                      <p>{service.category}</p>
                      <small>{service.price}</small>
                      <small>{SERVICE_SCHEDULES[service.id]?.label ?? providerFor(service)}</small>
                    </div>
                  </button>
                ))}
              </div>
              ) : categoryServices.length === 0 ? (
                <StatePanel icon={<Storefront />} title={`No ${categoryData.title.toLowerCase()} to book right now`} actions={<TextButton onClick={() => go('chat')}>Ask the front desk</TextButton>}>
                  {`Nothing in this category is open at ${contextBooking.property} at the moment. The front desk can tell you what is coming up.`}
                </StatePanel>
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
        return <EstablishmentChatScreen kind="gift" booking={contextBooking} online={online} onChat={(message) => { setChatOrderVenue(LOBBY_SHOP_NAME); setChatDraft(message); go('chat'); }} />;

      case 'nearby-recommendations':
        if (emptyCatalogue) {
          return (
            <div className="guest-stack">
              <div className="guest-page-title"><h1>Nearby recommendations</h1></div>
              <StatePanel icon={<MapPin />} title="No places listed nearby yet">
                {`There aren’t nearby vendors listed around ${contextBooking.property} yet.`}
              </StatePanel>
            </div>
          );
        }
        return <NearbyRecommendationsPage categoryId={selectedCategory} city={contextBooking.city} property={contextBooking.property} now={mapClock} onSelect={(id) => { setSelectedNearbyEstablishmentId(id); go('nearby-establishment'); }} />;

      case 'nearby-establishment': {
        // From today, or check-in if later, to check-out day: the days the guest is here to eat.
        const tableDays = Array.from({ length: 14 }, (_, i) => addDays(PROTOTYPE_TODAY > contextBooking.checkIn ? PROTOTYPE_TODAY : contextBooking.checkIn, i)).filter((day) => day <= contextBooking.checkOut);
        const establishment = NEARBY_ESTABLISHMENTS.find((item) => item.id === selectedNearbyEstablishmentId) ?? NEARBY_ESTABLISHMENTS[0];
        return establishment ? (
          <NearbyEstablishmentScreen
            establishment={establishment}
            city={contextBooking.city}
            property={contextBooking.property}
            now={mapClock}
            onBack={back}
            onNotifications={() => go('notifications')}
            onBookRide={() => openRideRequest({ from: contextBooking.property, to: establishment.name, toDetail: establishment.address })}
            onBookNearby={(request) => bookNearbyPlace(establishment, request)}
            reserveDays={tableDays}
            dayLabel={(day) => (day === PROTOTYPE_TODAY ? 'Today' : formatServiceDay(day).short)}
            defaultParty={contextBooking.guestCount}
            roomChargeAvailable={canUseOnPropertyServices(contextBooking)}
            roomNumber={contextBooking.roomNumber}
            onReserveTable={(request) => reserveNearbyTable(establishment, request)}
            partnerTables={establishment.bookingIntegration ? listingFor(establishment.id) : undefined}
          />
        ) : null;
      }

      case 'restaurant-menu': {
        const venue = RESTAURANTS.find((r) => r.id === selectedRestaurantId) ?? RESTAURANTS[0];
        return <RestaurantMenuScreen venue={venue} onOrder={() => openRestaurantChat(venue)} onReserve={TABLE_VENUE_SERVICE_IDS[venue.id] ? () => openServiceBooking(TABLE_VENUE_SERVICE_IDS[venue.id]!) : undefined} onBack={() => go('category-listing')} onNotifications={() => go('notifications')} />;
      }

      case 'transfer-booking': {
        const ride = rideEnds();
        const pickUp = ride.to === contextBooking.property;
        const checkedOut = describeStayStatus(contextBooking).status === 'checked-out';
        const checkoutDayDeparture = !checkedOut && !pickUp && contextBooking.checkOut <= PROTOTYPE_TODAY;
        /* Before the stay a ride is an airport run in the cart, either way round. */
        const preStay = !hasStayStarted(contextBooking);
        const airport = airportFor(contextBooking);
        const toCart = preStay && (ride.from === airport || ride.to === airport);
        const chooseDirection = (arriving: boolean) => {
          setTransferOrigin(arriving ? airport : contextBooking.property);
          setTransferDestination(arriving ? contextBooking.property : airport);
          setTransferDestinationAddress('');
          setRideDate(arriving ? contextBooking.checkIn : contextBooking.checkOut);
          setRideWhen('later');
        };
        return (
          <div className="guest-stack guest-ride-request-page">
            <div className="guest-page-title">
              <p className="guest-eyebrow">{contextBooking.property}</p>
              <h1>Book a ride</h1>
              <p>{pickUp ? `The hotel meets you at ${ride.from} and brings you to ${contextBooking.property}.` : `Request a hotel-arranged ride from ${ride.from} to ${ride.to}.`}</p>
            </div>
            <form className="guest-form" onSubmit={(event: FormEvent<HTMLFormElement>) => { event.preventDefault(); if (toCart) addRideToCart(); else openRideRequestChat(); }}>
              {toCart ? (
                <fieldset className="guest-ride-choice">
                  <legend>Which way?</legend>
                  <div className="guest-ride-choice__segmented">
                    <button type="button" className={pickUp ? 'is-active' : ''} aria-pressed={pickUp} onClick={() => chooseDirection(true)}>To the hotel</button>
                    <button type="button" className={!pickUp ? 'is-active' : ''} aria-pressed={!pickUp} onClick={() => chooseDirection(false)}>To the airport</button>
                  </div>
                </fieldset>
              ) : null}
              <section className="guest-ride-summary" aria-label="Trip summary">
                <div><small>From</small><strong>{ride.from}</strong></div>
                <div><small>To</small><strong>{ride.to}</strong>{transferDestinationAddress ? <span>{transferDestinationAddress}</span> : null}</div>
              </section>
              {checkedOut ? <Notice icon={<Car />} title="Pay at the front desk">The front desk will confirm the fare and accepted payment methods, take payment before the ride, and add the paid fare to your stay’s total charges.</Notice> : checkoutDayDeparture ? <Notice icon={<Car />} title="₱1,200, on your room">A hotel car to the airport. The fare is added to your room charges and settled with them at the front desk.</Notice> : null}
              {toCart ? <Notice icon={<Car />} title="₱1,200, paid now">Added to your cart and paid with everything else. The hotel then confirms your driver; if it can&rsquo;t, you&rsquo;re refunded.</Notice> : null}
              {/* Before the stay starts there is no "now": the guest is not at the airport yet. */}
              {preStay ? null : (
                <fieldset className="guest-ride-choice">
                  <legend>{pickUp ? 'When do you land?' : 'When would you like to leave?'}</legend>
                  <div className="guest-ride-choice__segmented">
                    <button type="button" className={rideWhen === 'now' ? 'is-active' : ''} onClick={() => setRideWhen('now')}>{pickUp ? 'Landed' : 'Now'}</button>
                    <button type="button" className={rideWhen === 'later' ? 'is-active' : ''} onClick={() => setRideWhen('later')}>{pickUp ? 'Later' : 'Schedule for later'}</button>
                  </div>
                </fieldset>
              )}
              {rideWhen === 'later' || preStay ? (
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
              {pickUp ? (
                <Field label="Flight number (optional)" name="ride-flight" placeholder="e.g. PR 102" value={rideFlight} onValueChange={setRideFlight} helper="The driver tracks it, so a delay does not leave you waiting." />
              ) : null}
              <StepperField label="Passengers" unit="passenger" value={ridePassengers} min={1} max={8} onChange={setRidePassengers} />
              <NotesField name="ride-note" value={rideNote} onChange={setRideNote} placeholder="Luggage, a child seat, a wheelchair…" />
              <Button className="guest-button guest-button--primary" type="submit" disabled={toCart && !rideDate}>{toCart ? 'Add to cart · ₱1,200' : 'Request a ride'}<ArrowRight aria-hidden="true" /></Button>
            </form>
          </div>
        );
      }

      case 'service-detail':
        return (
          <ServicePage
            service={selectedService}
            booking={contextBooking}
            provider={providerFor(selectedService)}
            highlights={serviceHighlights?.serviceId === selectedService.id ? serviceHighlights.lines : []}
            online={online}
            onBook={() => openServiceBooking(selectedService.id)}
            onChat={() => go('chat')}
          />
        );

      case 'vendor-service':
        return <ServiceDetail kind="vendor" booking={contextBooking} online={online} onBook={() => openServiceBooking('spa')} onChat={() => go('chat')} />;

      case 'service-booking': {
        const days = bookableServiceDays(contextBooking, PROTOTYPE_TODAY, selectedService.id);
        const day = serviceDate && days.includes(serviceDate) ? serviceDate : days[0];
        const schedule = SERVICE_SCHEDULES[selectedService.id];
        // Party size only where it changes the booking: a table, a treatment, a tour.
        const asksPartySize = ['spa', 'entertainment', 'dining'].includes(selectedService.categoryId);
        const provider = providerFor(selectedService);
        const rentalRate = selectedService.price.replace(/\s*\/\s*day$/i, '').trim();
        const rentalRateLabel = `${rentalRate} / ${rentalUnit.singular} / day`;
        const chargeToRoom = canUseOnPropertyServices(contextBooking);
        // The room, settled at the front desk -- or, for a third-party vendor, paid now through the gateway.
        const payNowOffered = acceptsPayNow(selectedService);
        const payingNow = chargeToRoom && payNowOffered && servicePayChoice === 'pay-now';
        const merchant = merchantFrom(provider);
        const ready = Boolean(day);
        const submitLabel = !day
          ? 'Not on during your stay'
          : preArrival
          ? servicePayment === 'complimentary' ? 'Add to cart' : `Add to cart · ${formatPesoAmount(servicePrice)}`
          : reservation
          ? 'Reserve a table'
          : servicePayment === 'complimentary'
          ? `Book ${selectedService.name}`
          : payingNow ? `Continue to pay ${serviceCharge}`
          : chargeToRoom ? `Confirm and charge ${serviceCharge} to room` : `Charge ${serviceCharge} to room`;
        const roomLine = contextBooking.roomNumber ? `Charge to Room ${contextBooking.roomNumber}` : 'Charge to your room';
        return (
          <FormScreen step={preArrival ? 'Add to your cart' : chargeToRoom ? 'Confirm booking' : 'Review and pay'} title={reservation ? 'Reserve a table' : 'Choose a time'} text={reservation ? `Tables at ${selectedService.name}, ${contextBooking.property}. The times shown are the ones the venue has open.` : `Live availability is shown for ${selectedService.name} at ${contextBooking.property}.`}>
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
              {schedule ? (
                <SummaryRow label="When" value={schedule.label} />
              ) : (
                <ExpandableField
                  label={serviceIsRental ? 'Pick up' : 'Time'}
                  value={serviceTime}
                  open={openServiceField === 'time'}
                  onToggle={() => setOpenServiceField((field) => field === 'time' ? null : 'time')}
                >
                  <TimeWheel times={listingFor(selectedService.id).times} value={serviceTime} onChange={setServiceTime} />
                </ExpandableField>
              )}
              {serviceIsRental ? <SummaryRow label="Return" value="By 8:00 PM the same day" /> : null}
              {serviceIsRental ? (
                <StepperField label={`${rentalUnit.plural.replace(/^./, (letter) => letter.toUpperCase())} to rent`} unit={rentalUnit.singular} value={rentalQuantity} min={1} max={8} onChange={setRentalQuantity} />
              ) : asksPartySize ? (
                <StepperField label="Guests" unit="guest" value={servicePartySize} min={1} max={listingFor(selectedService.id).maxParty ?? Math.max(2, contextBooking.guestCount)} onChange={setServicePartySize} />
              ) : null}
            </div>
            <div className="guest-summary">
              <SummaryRow label="Category" value={selectedService.category} />
              <SummaryRow label="Service" value={selectedService.name} />
              {serviceIsRental ? <SummaryRow label="Rate" value={rentalRateLabel} /> : null}
              <SummaryRow label="Provider" value={provider} />
              <SummaryRow label={reservation ? 'Cost' : 'Total'} value={reservation ? 'Free to reserve' : servicePayment === 'complimentary' ? 'Complimentary' : serviceCharge} strong />
            </div>
            {reservation ? (
              <Notice title="Nothing to pay now">
                Order at the table, then charge the meal to your room or pay the venue when you are there.
              </Notice>
            ) : null}
            {'requires' in selectedService && selectedService.requires ? (
              <Notice icon={<IdentificationCard />} title={selectedService.requires}>
                Bring it with you. The desk checks it when you collect the keys; nothing is uploaded here.
              </Notice>
            ) : null}
            <NotesField name="service-note" value={serviceNote} onChange={setServiceNote} placeholder={serviceNoteHint(selectedService.categoryId, reservation)} />
            {servicePayment === 'complimentary' ? null : (
              <>
                {preArrival ? null : <PointsApply balance={pointsBalance(session)} amount={formatPesoAmount(servicePrice)} applied={usablePoints} onChange={setAppliedPoints} />}
                {preArrival ? (
                  <Notice title="Paid now, with your cart">
                    Card, GCash or Maya, in one payment for everything you arrange. Not added to a room bill.
                  </Notice>
                ) : payNowOffered ? (
                  <fieldset className="guest-payment-choice">
                    <legend>How would you like to pay?</legend>
                    <div className="guest-payment-options">
                      <button type="button" aria-pressed={servicePayChoice === 'room'} className={servicePayChoice === 'room' ? 'is-active' : ''} onClick={() => setServicePayChoice('room')}>
                        <b>{roomLine}</b>
                        <small>{contextBooking.roomNumber ? 'Added to your room bill and settled at the front desk at checkout.' : 'Added to the room you are given on arrival, and settled at the front desk at checkout.'}</small>
                      </button>
                      <button type="button" aria-pressed={servicePayChoice === 'pay-now'} className={servicePayChoice === 'pay-now' ? 'is-active' : ''} onClick={() => setServicePayChoice('pay-now')}>
                        <b>Pay now</b>
                        <small>Card, GCash or Maya, paid straight to {merchant}. Not added to your room bill.</small>
                      </button>
                    </div>
                  </fieldset>
                ) : (
                  <Notice title={contextBooking.roomNumber ? `Charged to Room ${contextBooking.roomNumber}` : 'Charged to your room'}>
                    {contextBooking.roomNumber ? 'Added to your room bill and settled at the front desk at checkout.' : 'Added to the room you are given on arrival, and settled at the front desk at checkout.'}
                  </Notice>
                )}
              </>
            )}
            <Button className="guest-button guest-button--primary" type="button" disabled={!ready} onClick={() => (preArrival ? addServiceToCart() : payingNow ? startServicePayment() : confirmService())}>{submitLabel}<ArrowRight aria-hidden="true" /></Button>
            {gatewayOpen && payingNow ? (
              <GatewayCheckout
                merchant={merchant}
                amount={serviceCharge}
                item={`${selectedService.name}${day ? ` · ${formatServiceDay(day).short}` : ''}`}
                onPaid={(method) => confirmService(method)}
                onClose={() => setGatewayOpen(false)}
              />
            ) : null}
          </FormScreen>
        );
      }

      case 'booking-confirmation': {
        const booked = session.serviceBookings.find((service) => service.id === lastServiceBookingId) ?? contextService;
        const bookedService = SERVICES.find((service) => service.id === booked?.serviceId) ?? selectedService;
        const paidBy = booked ? describeServicePaidBy(booked) : 'room';
        const methodLabel = booked?.paymentMethod === 'gcash' || booked?.paymentMethod === 'maya' ? GATEWAY_METHOD_LABELS[booked.paymentMethod] : 'card';
        const slot = booked?.scheduledFor ?? `${formatServiceDay(PROTOTYPE_TODAY).long} · ${serviceTime}`;
        const time = slot.match(/\d{1,2}:\d{2}\s*[AP]M/i)?.[0] ?? serviceTime;
        const bookingCount = bookedService.categoryId === 'rentals'
          ? countOf(booked?.rentalQuantity ?? 1, rentalUnitFor(bookedService.id).singular)
          : countOf(booked?.partySize ?? 1, 'guest');
        return (
          <ScreenIntro
            icon={<Check size={30} />}
            title={isReservation(bookedService.id) ? `Table reserved at ${booked?.title ?? bookedService.name}` : `${booked?.title ?? bookedService.name} is booked`}
            text={isReservation(bookedService.id)
              ? 'Nothing to pay to reserve. Order and pay at the venue; the reservation is on your stay in My Stay.'
              : paidBy === 'card'
              ? `Paid with ${methodLabel}, direct to ${merchantFrom(booked?.provider ?? '')}. It is not on your room bill; your receipt is in My Stay.`
              : paidBy === 'complimentary'
                ? 'Complimentary, so there is nothing to pay. It is on your stay in My Stay.'
                : `The charge has been added to ${contextRoom.toLowerCase()} and is paid with your room bill at checkout.`}
          >
            <div className="guest-ticket"><div><small>{withoutTime(slot)}</small><h2>{time}</h2><p>{booked?.title ?? bookedService.name} · {bookingCount}</p></div><Tag>Confirmed</Tag></div>
            <div className="guest-summary">
              <SummaryRow label="Provider" value={booked?.provider ?? providerFor(bookedService)} />
              {booked?.facts?.find((fact) => fact.label === 'Your note') ? <SummaryRow label="Your note" value={booked.facts.find((fact) => fact.label === 'Your note')!.value} /> : null}
              <SummaryRow label={paidBy === 'card' ? 'Payment status' : 'Payment method'} value={paidBy === 'card' ? `Paid · ${methodLabel}` : paidBy === 'complimentary' ? (isReservation(bookedService.id) ? 'No charge to reserve' : 'Complimentary') : 'Charged to room'} />
            </div>
            <PointsEarned points={booked ? pointsForCharge(booked.amount) : 0} badges={badgeProgress(session).filter((row) => justEarned.includes(row.definition.id))} />
            <Notice title="Cancellation cutoff">{booked ? describeCancellationWindow(cutoffFor(booked), booked, PROTOTYPE_TODAY, clockHour) : 'Changes to this booking go through the front desk. The booking remains.'}</Notice>
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

        if (bookingBlockedReason === 'failed' || bookingBlockedReason === 'pms-down') {
          return (
            <ScreenIntro icon={<WarningCircle size={30} />} eyebrow={selectedService.name} title={bookingBlockedReason === 'pms-down' ? 'The hotel’s system isn’t answering' : 'Your booking didn’t go through'} text={bookingBlockedReason === 'pms-down' ? 'Bookings go straight into the hotel’s system, and it can’t be reached right now.' : 'Something went wrong on the way to the hotel. Nothing was booked or charged.'}>
              <Notice title="Nothing was charged">Try again in a moment, or have the front desk book it for you.</Notice>
              <Button className="guest-button guest-button--primary" type="button" onClick={sendBookingToDesk}>Send it to the front desk instead<ArrowRight aria-hidden="true" /></Button>
              <TextButton onClick={back}>Try again</TextButton>
            </ScreenIntro>
          );
        }

        if (bookingBlockedReason === 'no-slot') {
          return (
            <ScreenIntro
              icon={<Clock size={30} />}
              eyebrow={selectedService.name}
              title="Nothing left to book for this stay"
              text="There is no day left in your stay when this can be booked. The front desk may still be able to arrange it."
            >
              <Notice title="Nothing was booked or charged">Message the desk and they will tell you what is possible.</Notice>
              {primary('Message the front desk', 'chat')}
              <TextButton onClick={back}>Back</TextButton>
            </ScreenIntro>
          );
        }

        if (bookingBlockedReason === 'scan-failed') {
          return (
            <ScreenIntro icon={<QrCode size={30} />} eyebrow={contextRoom} title="We couldn’t read the code" text="Hold the phone steady over the card on the desk, with the whole code in the frame and some light on it.">
              <Button className="guest-button guest-button--primary" type="button" onClick={() => replaceScreen('scan-room-code')}>Try again<ArrowRight aria-hidden="true" /></Button>
              <TextButton onClick={askFrontDeskToUnlock}>Ask the front desk to open it</TextButton>
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
              resumeBooking={resumeBooking}
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
        const showVendorFolioQr = started && !checkedOut && Boolean(contextBooking.roomNumber);
        const vendorFolioIsAvailable = canUseOnPropertyServices(contextBooking);
        /*
          The same object `stay-detail` renders, built from the live booking
          rather than from `PAST_STAYS` -- a stay that ended this morning has
          not settled into history yet, and the guest still wants the receipt.
        */
        const settledStay = checkedOut ? toFinishedStay(session, contextBooking) : null;

        return (
          <div className="guest-stack guest-my-stay-page">
            {pmsDown ? <StaleDataNotice asOf={PMS_LAST_SYNC} onRetry={() => setPmsDown(false)} onAsk={() => go('chat')} /> : null}
            {/*
              The stay in full lives here; Home carries only the compact reminder.
              The room-charge QR is part of it, not a card above: the code is
              the room, always on show, ready for a vendor to scan.
            */}
            <UpcomingBookingCard
              booking={contextBooking}
              primary
              onNavigate={go}
              statusLabel={stayStatus.label}
              showCountdown
              action={!checkedOut && contextBooking.status === 'active' && checkoutIsDue ? (
                <button className="guest-button guest-button--primary" type="button" onClick={() => { setReviewingStayId(null); go('stay-review'); }}>Rate your stay</button>
              ) : undefined}
              pass={showVendorFolioQr ? (
                <div className={`guest-stay-pass${vendorFolioIsAvailable ? '' : ' is-unverified'}`}>
                  <span className="guest-stay-pass__copy">
                    <small>Room charge</small>
                    <b>{vendorFolioIsAvailable ? 'Charge to your room' : 'Scan your room code'}</b>
                    <span>{vendorFolioIsAvailable ? 'Show at partner vendors' : 'It unlocks charging to your room'}</span>
                    {vendorFolioIsAvailable ? null : <button type="button" className="guest-stay-pass__scan" onClick={() => go('scan-room-code')}>Scan room code</button>}
                  </span>
                  <button
                    type="button"
                    className="guest-stay-pass__code"
                    aria-label={vendorFolioIsAvailable ? `Show room charge QR for ${contextBooking.property}, Room ${contextBooking.roomNumber}` : 'Verify your room to use the room charge QR'}
                    onClick={() => (vendorFolioIsAvailable ? setVendorFolioQrOpen(true) : go('scan-room-code'))}
                  >
                    {vendorFolioIsAvailable ? <QRCodeSVG value={getVendorFolioQrValue(contextBooking)} size={104} level="M" /> : <QrCode aria-hidden="true" />}
                    {vendorFolioIsAvailable ? <small>Tap to enlarge</small> : null}
                  </button>
                </div>
              ) : undefined}
            />

            {!online ? <Notice tone="offline" icon={<WifiSlash />} title="Last-known stay details">Reconnect for the latest charges and availability.</Notice> : null}

            {showVendorFolioQr && vendorFolioIsAvailable ? (
              <VendorFolioQrDialog booking={contextBooking} onClose={() => setVendorFolioQrOpen(false)} open={vendorFolioQrOpen} />
            ) : null}

            {/*
              The countdown lives on the stay card now; the card above already
              opens the booking, so a second row doing the same was redundant.
              What is left here is only what the stay can still do.
            */}
            {(!checkedOut && contextBooking.status === 'active') || (started && !checkedOut) ? (
            <div className="guest-stay-context guest-checkout-card">

              {/* Live-stay folio access belongs with the other stay details. */}
              {started && !checkedOut ? (
                <button className="guest-my-stay-folio-link" type="button" aria-label="Room charges" onClick={() => go('folio')}>
                  <span className="guest-my-stay-folio-link__icon" aria-hidden="true"><GuestNavIcon icon={HugeReceiptTextIcon} /></span>
                  <span className="guest-my-stay-folio-link__copy"><b>Room charges</b><small>{describeRoomCharges(getRoomCharges(session, contextBooking, contextRoom))}</small></span>
                  <HugeiconsIcon icon={HugeChevronRightIcon} size={18} strokeWidth={1.75} aria-hidden="true" focusable="false" />
                </button>
              ) : null}
              {/* The house facts, Wi-Fi password first, while the guest is at the hotel. */}
              {started && !checkedOut ? <HotelEssentialsRow booking={contextBooking} hour={clockHour} /> : null}
            </div>
            ) : null}

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
              not buried behind "Rate your stay", which a checked-out guest has
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
                <Button className="guest-button guest-button--secondary" type="button" onClick={() => { setReviewingStayId(null); go('stay-review'); }}>
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
                <TextButton onClick={() => go('partner-hotels')}>Explore partner hotels</TextButton>
              </section>
            ) : null}

            {/*
              Tabbed, not two stacked sections. Past bookings are reference
              material a guest consults occasionally; stacking them under the
              live ones meant scrolling past history to reach what is next.
            */}
            <section>
              <GuestTabs
                idPrefix="guest-my-stay-bookings"
                label="Bookings"
                options={[
                  { value: 'upcoming' as const, label: `Upcoming (${stayEntries.upcoming.length})` },
                  { value: 'past' as const, label: `Past (${stayEntries.past.length})` },
                ]}
                value={stayTab}
                onValueChange={setStayTab}
                className="guest-tabs--underline"
              />

              <div
                id={`guest-my-stay-bookings-panel-${stayTab}`}
                className="guest-stay-tabpanel"
                role="tabpanel"
                aria-labelledby={`guest-my-stay-bookings-tab-${stayTab}`}
                tabIndex={0}
              >
                {visibleStayEntries.length ? (
                  <div className="guest-stay-entries" key={stayTab}>
                    {visibleStayEntries.length > 1
                        ? Object.entries(visibleStayEntries.reduce<Record<string, StayEntry[]>>((groups, entry) => {
                          (groups[entry.date] ??= []).push(entry);
                          return groups;
                        }, {})).map(([date, entries]) => (
                          <section className="guest-stay-entries__date-group" key={date}>
                            <h2>{date === PROTOTYPE_TODAY ? 'Today' : new Date(`${date}T00:00:00`).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</h2>
                            <div className="guest-stay-entries__date-group-cards">{entries.map((entry) => <StayEntryCard key={entry.id} entry={entry} showWhen={false} homeProperty={contextBooking.property} onOpen={() => { setSelectedStayEntryId(entry.id); go('stay-entry'); }} />)}</div>
                          </section>
                        ))
                      : visibleStayEntries.map((entry) => (
                          <StayEntryCard
                            key={entry.id}
                            entry={entry}
                            homeProperty={contextBooking.property}
                            onOpen={() => { setSelectedStayEntryId(entry.id); go('stay-entry'); }}
                          />
                        ))}
                  </div>
                ) : (
                  <div className={`guest-hub-empty${stayTab === 'upcoming' && !started ? ' guest-hub-empty--services' : ''}`}>
                    <h2>{stayTab === 'upcoming' && !started ? 'No upcoming services yet' : stayTab === 'upcoming' && !checkedOut && bookingSlot.locked ? 'Scan in to browse services' : stayTab === 'upcoming' ? 'Nothing booked yet' : 'Nothing here yet'}</h2>
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
                          // Gated, and said so: services open with the room scan, not before it.
                          : bookingSlot.locked
                          ? `Dining, spa, tours and hotel services open once you scan the code in your room. Bookings then go on ${contextBooking.roomNumber ? `room ${contextBooking.roomNumber}` : 'your room'} and settle at checkout.`
                          : `Dining, spa, tours, and hotel services are in Explore. Bookings are added to ${contextRoom.toLowerCase()} and settle at checkout.`}
                    </p>
                    {stayTab === 'upcoming' && !started ? (
                      <Button className="guest-button guest-button--secondary" type="button" onClick={() => go('pre-arrival-services')}>
                        Browse arrival services<ArrowRight aria-hidden="true" />
                      </Button>
                    ) : stayTab === 'upcoming' && !checkedOut ? (
                      bookingSlot.locked ? (
                        <Button className="guest-button guest-button--primary" type="button" onClick={() => go('scan-room-code')}>
                          <QrCode aria-hidden="true" />Scan room code
                        </Button>
                      ) : (
                        <Button className="guest-button guest-button--primary" type="button" onClick={() => go(bookingSlot.screen)}>
                          Explore on-property<ArrowRight aria-hidden="true" />
                        </Button>
                      )
                    ) : null}
                  </div>
                )}
              </div>
            </section>

          </div>
        );
      }

      case 'stay-entry': {
        const allEntries = [...stayEntries.upcoming, ...stayEntries.past];
        const entry = allEntries.find((item) => item.id === selectedStayEntryId) ?? allEntries[0];
        // A table is a reservation, not a purchase: no total, no payment, nothing about the room bill.
        // A restaurant's order and its table share the venue's id, so a hotel table is the one that costs nothing.
        const isTable = Boolean(entry && (entry.id.startsWith('service-table-') || (entry.serviceId && isReservation(entry.serviceId) && !parsePesoAmount(entry.amount))));
        const noCabanaTotal = isTable || Boolean(entry && entry.paidBy === 'provider' && !parsePesoAmount(entry.amount));
        if (!entry) {
          return (
            <EmptyStayHome
              guestName={session.guestName}
              pastStays={pastStays}
              onNavigate={go}
              resumeBooking={resumeBooking}
            />
          );
        }

        // `status` files a past cancellation under completed; the money story needs the real one.
        const entryCancelled = entry.cancelled || entry.status === 'cancelled';
        const tableStatus = entry.facts?.find((fact) => fact.label === 'Status')?.value ?? '';
        const tableWaiting = isTable && /requested|waiting/i.test(tableStatus);
        const earlyCheckInEntry = entry.serviceId === 'early-check-in';
        // Still ahead, so not on the bill yet: it goes on once it has happened.
        const entryAhead = !entryCancelled && entry.status === 'confirmed' && entry.date > PROTOTYPE_TODAY;

        return (
          <div className="guest-stack">
            <div className="guest-page-title">
              <p className="guest-eyebrow">{entry.parent}{entry.parentDetail ? ` · ${entry.parentDetail}` : ''}</p>
              <h1>{entry.title}</h1>
              <p>{entry.detail}</p>
            </div>

            {/* What differs by kind: a rental's pick-up and return, a tour's meeting point and guide. */}
            {entry.facts?.length ? (
              <section>
                <SectionHeading title="Details" />
                <div className="guest-summary">
                  {entry.facts.map((fact) => <SummaryRow key={fact.label} label={fact.label} value={fact.value} />)}
                </div>
              </section>
            ) : null}

            {/*
              The itemisation is the reason to open this. The card can only say
              "3 items", which is a count rather than an answer -- a guest
              checking what a charge on their room was for needs the order read
              back to them.
            */}
            {noCabanaTotal ? null : (
            <>
            <section>
              {entry.lines.length > 1 ? <SectionHeading title="Items" /> : null}
              <div className={`guest-summary${entryCancelled ? ' guest-summary--void' : ''}`}>
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
                <SummaryRow
                  label={earlyCheckInEntry
                    ? (entryCancelled ? 'Charge' : entry.settlement === 'Awaiting hotel confirmation' ? 'Room charge if confirmed' : 'Room charge')
                    : 'Total'}
                  value={earlyCheckInEntry && entryCancelled ? 'No charge' : entry.amount}
                  strong
                />
              </div>
            </section>

            <Notice
              tone={entryCancelled || tableWaiting || entry.settlement === 'Awaiting hotel confirmation' || entry.settlement === 'Awaiting provider confirmation' ? 'neutral' : 'positive'}
              title={entryCancelled ? 'Cancelled'
                : isTable ? tableWaiting ? 'Waiting for the restaurant' : 'Table confirmed'
                : entry.settlement === 'Awaiting provider confirmation' ? 'Awaiting provider confirmation'
                  : entry.settlement === 'Awaiting hotel confirmation' ? 'Awaiting hotel confirmation'
                    : entry.settlement === 'Pay the provider directly' ? 'Pay the provider directly'
                      : entryAhead && entry.paidBy === 'room' ? 'Goes on your room'
                        : entry.paidBy === 'card' ? 'Paid up front'
                          : entry.paidBy === 'complimentary' ? 'Complimentary'
                            : 'Charged to your room'}
            >
              {entryCancelled ? 'Nothing was charged to room.'
                : isTable ? tableWaiting ? 'The restaurant will confirm your reservation. Pay for your meal there; nothing is charged to a room.'
                  : 'No charge to reserve. Pay for your meal at the restaurant; nothing goes on your room bill.'
                : entry.settlement === 'Awaiting provider confirmation' ? 'Nothing is charged in Cabana. The provider will confirm this request; you’ll pay them directly.'
                  : entry.settlement === 'Awaiting hotel confirmation' ? 'Nothing is charged until the hotel confirms. You can withdraw the request until then.'
                    : entry.settlement === 'Pay the provider directly' ? 'This booking is outside the hotel. Pay the provider directly; nothing is added to your room bill.'
                      : entry.paidBy === 'complimentary' ? 'On the house. Nothing is added to your room.'
                        : entryAhead && entry.paidBy === 'room' ? `Added to ${contextRoom.toLowerCase()} once it has happened, and settled at the front desk at checkout.`
                          : entry.settlement ?? `Added to ${contextRoom.toLowerCase()} and settles with the hotel at checkout.`}
            </Notice>
            </>
            )}

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
                {primary(tableWaiting || entry.settlement === 'Awaiting hotel confirmation' || entry.settlement === 'Awaiting provider confirmation' ? 'Withdraw request' : 'Change or cancel', canCancelYourself(entry.id) ? 'cancel-before-cutoff' : 'cancel-after-cutoff')}
                <TextButton onClick={() => go('chat')}>Ask the front desk</TextButton>
              </>
            ) : (
              <button className="guest-list-row" onClick={() => go('chat')} type="button">
                <span><ChatCircleDots /></span>
                <div><b>Ask the front desk</b><small>{entry.status === 'confirmed' ? 'To change or cancel this' : entryCancelled ? 'About this booking' : 'About this charge'}</small></div>
                <CaretRight />
              </button>
            )}
          </div>
        );
      }

      case 'notifications': {
        if (!notifications.length) {
          return (
            <div className="guest-stack guest-inbox">
              <div className="guest-inbox__title"><h1>Notifications</h1></div>
              <StatePanel icon={<BellRinging />} title="You’re all caught up">Room updates, booking confirmations and new charges show up here as they happen.</StatePanel>
            </div>
          );
        }

        /*
          Grouped by when, like any inbox: what happened today, and the rest
          of the stay. One card per group with hairlines between rows, not a
          stack of floating cards. Three lines a row: what, detail, when. The
          red dot keeps the right edge to itself, centred on the row.
        */
        const isToday = (time: string) => /today|now|\d+\s*[mh]\b|min|hour/i.test(time);
        const groups = [
          { label: 'Today', items: notifications.filter((item) => isToday(item.time)) },
          { label: 'Earlier this stay', items: notifications.filter((item) => !isToday(item.time)) },
        ].filter((group) => group.items.length);
        const unreadIds = notifications.filter((item) => !readNotificationIds.includes(item.id)).map((item) => item.id);

        return (
          <div className="guest-stack guest-inbox">
            <div className="guest-inbox__title">
              <h1>Notifications</h1>
              {unreadIds.length ? (
                <button type="button" className="guest-inbox__mark" onClick={() => setReadNotificationIds((current) => [...new Set([...current, ...unreadIds])])}>
                  Mark all as read
                </button>
              ) : null}
            </div>
            {groups.map((group) => (
              <section key={group.label} className="guest-inbox__group" aria-label={group.label}>
                <h2>{group.label}</h2>
                <div className="guest-notifications">
                  {group.items.map((item) => {
                    const unread = !readNotificationIds.includes(item.id);
                    return (
                      <button
                        key={item.id}
                        type="button"
                        className="guest-notification"
                        data-unread={unread}
                        onClick={() => openNotification(item)}
                      >
                        <span className="guest-notification__icon">
                          <NotificationIcon tone={item.tone} />
                        </span>
                        <span className="guest-notification__body">
                          <b>{item.title}</b>
                          <span className="guest-notification__text">{item.body}</span>
                          <small>{item.time}</small>
                        </span>
                        {unread ? <span className="guest-notification__dot"><span className="sr-only">Unread</span></span> : <span aria-hidden="true" />}
                      </button>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        );
      }

      case 'cancel-before-cutoff':
      case 'cancel-after-cutoff': {
        const cancellable = cancellableServiceFor(selectedStayEntryId);
        const cutoffHours = cancellationCutoffHours(cutoffFor(cancellable));
        const hoursLeft = Math.max(0, Math.floor(hoursUntilService(cancellable, PROTOTYPE_TODAY, clockHour)));
        const paidBy = describeServicePaidBy(cancellable);
        const time = cancellable.scheduledFor.match(/\d{1,2}:\d{2}\s*[AP]M/i)?.[0] ?? '';
        const isRequest = cancellable.paymentStatus === 'pending-confirmation' || awaitsProvider(cancellable) || awaitsHotel(cancellable);

        if (activeScreen === 'cancel-after-cutoff') {
          return <ScreenIntro eyebrow={timeUntilLabel(hoursLeft)} title="Contact the front desk to change this" text={cutoffHours === null ? 'This provider does not take cancellations in the app.' : `The provider’s ${cutoffHours}-hour self-service cutoff has passed. ${paidBy === 'room' ? 'The charge stays on your room folio.' : 'The booking stays as it is.'}`}><Notice tone="warning" title="Front desk help required">Send a message and the team will check what the provider can do.</Notice><Button className="guest-button guest-button--primary" type="button" onClick={() => { setChatDraft(`I'd like to cancel ${cancellable.title} on ${withoutTime(cancellable.scheduledFor)}. It's past the cutoff in the app, so can you check what the provider can do?`); go('chat'); }}>Chat with front desk<ArrowRight aria-hidden="true" /></Button><TextButton onClick={() => go('my-stay')}>Keep booking</TextButton></ScreenIntro>;
        }

        const cancelService = () => {
          setSession((current) => ({
            ...returnPoints(paidBy === 'card' ? refundServiceLine(current, cancellable.id) : current, [cancellable.id]),
            serviceBookings: current.serviceBookings.map((service) => (
              service.id === cancellable.id
                ? { ...service, status: 'cancelled', paymentStatus: paidBy === 'card' ? 'refunded' : service.paymentStatus }
                : service
            )),
            bookings: cancellable.serviceId === 'early-check-in'
              ? current.bookings.map((booking) => (booking.id === cancellable.bookingId ? { ...booking, earlyCheckIn: undefined } : booking))
              : cancellable.serviceId === 'room-upgrade'
                ? current.bookings.map((booking) => (booking.id === cancellable.bookingId ? { ...booking, roomUpgrade: undefined } : booking))
                : current.bookings,
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
            : paidBy === 'provider'
              ? { title: 'No provider payment made', body: 'Nothing was charged in Cabana or to your room.' }
            : { title: 'The charge will be removed from your room', body: 'This service has not settled. No money moves when you cancel.' };
        return <ScreenIntro eyebrow={timeUntilLabel(hoursLeft)} title={isRequest ? 'Withdraw this request?' : 'Cancel this booking?'} text={`This is before the provider’s ${cutoffHours ?? 24}-hour cutoff, so you can cancel it yourself.`}><div className="guest-ticket"><div><small>{withoutTime(cancellable.scheduledFor)}</small><h2>{time}</h2><p>{cancellable.title}{cancellable.amount ? ' · ' + cancellable.amount : ''}{paidBy === 'room' ? ` · ${contextRoom}` : ''}</p></div></div><Notice tone="positive" title={settlement.title}>{settlement.body}</Notice><button className="guest-button guest-button--danger" onClick={cancelService} type="button">{isRequest ? 'Withdraw request' : 'Cancel service'}</button><TextButton onClick={() => go('my-stay')}>{isRequest ? 'Keep request' : 'Keep booking'}</TextButton></ScreenIntro>;
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
        return <div className="guest-stack guest-folio-page"><div className="guest-page-title"><h1>Room charges</h1><p>Charges added to {contextRoom} during your stay.</p></div>{!online ? <Notice tone="offline" title="Last-known folio">Reconnect for the latest charges.</Notice> : null}{pmsDown ? <StaleDataNotice asOf={PMS_LAST_SYNC} onRetry={() => setPmsDown(false)} onAsk={() => go('chat')} /> : null}<div className="guest-folio-summary"><div><span>Current total</span><small>Due at checkout</small></div><strong>{folioTotal}</strong></div>{pointsBalance(session) >= 1000 ? <button type="button" className="folio-points" onClick={() => go('rewards')}><span><b>{pointsBalance(session).toLocaleString('en-US')} points</b><small>{pointsAsPesos(pointsBalance(session))} to use on services you book in your stay</small></span><CaretRight aria-hidden="true" /></button> : null}{visibleCharges.length === 0 ? <StatePanel icon={<Receipt />} title="Nothing on your bill yet">{`What you order or book in the stay, and what the hotel posts, shows here as it lands on ${contextRoom}. It all settles at the front desk at checkout.`}</StatePanel> : null}<div className="guest-folio-cards">{visibleCharges.map((charge) => { const isExpanded = expandedChargeId === charge.id; const service = session.serviceBookings.find((item) => item.id === charge.id); return <article key={charge.id} className={`guest-folio-card${isExpanded ? ' is-expanded' : ''}`}><button type="button" className="guest-folio-card__header" aria-expanded={isExpanded} onClick={() => setExpandedChargeId(isExpanded ? null : charge.id)}><span><b>{charge.title}</b><small>{charge.detail}</small></span><strong>{charge.amount}</strong><CaretDown className="guest-folio-card__chevron" /></button>{isExpanded ? <RoomChargeDetails charge={charge} service={service} roomLabel={contextRoom} onQuestion={(message) => { setChatDraft(message); go('chat'); }} /> : null}</article>; })}</div><button className="guest-folio-help" type="button" onClick={() => { setChatDraft('I have a question about a room charge. Could you help me review it?'); go('chat'); }}><span><b>Question about a charge?</b><small>Message the front desk</small></span></button></div>;
      }

      case 'chat':
        return renderChatScreen();

      case 'room-qr-midstay':
        return (
          <RoomUnlocked
            roomNumber={contextBooking.roomNumber}
            property={contextBooking.property}
            checkOut={formatCheckoutDate(contextBooking.checkOut)}
            guestName={session.guestName || undefined}
            dates={formatStayDateRange(contextBooking)}
            onExplore={openExploreIntro}
            onViewStay={() => go('stay-overview')}
            onOpen={(target) => {
              if (target === 'dining' || target === 'spa') {
                setSelectedCategory(target);
                go('category-listing');
              } else if (target === 'housekeeping') go('chat');
              else go('marketplace');
            }}
            earned={contextBooking.roomVerification ? BEHAVIOUR_POINTS['room-scan'] : undefined}
          />
        );

      case 'profile':
        return (
          <div className="guest-stack guest-profile-page">
            <div className="guest-page-title guest-profile-intro">
              <div className="guest-profile-intro__avatar" aria-hidden="true">
                {(session.guestName || 'Guest').trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase()}
              </div>
              <div className="guest-profile-intro__copy">
                <h1>{session.guestName || 'Profile'}</h1>
                {/* A guest has no account to name: what they hold is one booking, on this phone. */}
                {isGuest ? <p>Guest · {primaryBooking?.id ?? 'no booking'}</p> : session.email ? <p>{session.email}</p> : null}
              </div>
            </div>
            {isGuest ? (
              <AccountSignInCard
                title="Keep this stay in an account"
                text="Right now it lives on this phone. An account keeps it, and every stay after it, wherever you sign in."
                points={['Receipts and payments on any phone', 'Points and badges that stay yours', 'Book other partner hotels in the app']}
                onSignIn={signInGuest}
                online={online}
              />
            ) : null}
            <section className="guest-profile-section" aria-labelledby="guest-profile-account-heading">
              <div className="guest-profile-section__header">
                <div>
                  <h2 id="guest-profile-account-heading">{isGuest ? 'On this phone' : 'Account'}</h2>
                </div>
              </div>
              <div className="guest-profile-action-list">
                <button className={`guest-list-row guest-profile-action${isGuest ? ' is-locked' : ''}`} type="button" onClick={() => go('rewards')}>
                  <span><GuestNavIcon icon={HugeTrophyIcon} /></span>
                  <div>
                    <b>Achievements</b>
                    <small>{isGuest ? `${pointsBalance(session).toLocaleString('en-US')} points · create an account to keep them` : `${earnedBadges(session).length} badges · ${pointsBalance(session).toLocaleString('en-US')} points`}</small>
                  </div>
                  <CaretRight />
                </button>
                {/* Past stays belong to an account; a guest has only the one they looked up. */}
                {isGuest ? null : (
                  <button className="guest-list-row guest-profile-action" type="button" onClick={() => go('stay-history')}>
                    <span><SuitcaseRolling /></span>
                    <div><b>Stays</b><small>{(() => { const ahead = session.bookings.filter((item) => item.status === 'active' || item.status === 'upcoming').length; return `${ahead ? `${ahead} upcoming · ` : ''}${pastStays.length} past`; })()}</small></div>
                    <CaretRight />
                  </button>
                )}
                <button className="guest-list-row guest-profile-action" type="button" onClick={() => go('payments')}>
                  <span><Receipt /></span>
                  <div><b>{isGuest ? 'This stay’s payments' : 'Payments'}</b><small>{paymentsSummary(session).count ? `${paymentsSummary(session).count} ${paymentsSummary(session).count === 1 ? 'payment' : 'payments'} · ${formatPesoAmount(paymentsSummary(session).net)} paid` : 'Nothing paid in the app yet'}</small></div>
                  <CaretRight />
                </button>
                <button className="guest-list-row guest-profile-action" type="button" onClick={() => go('saved-hotels')}>
                  <span><Heart /></span>
                  <div><b>Saved hotels</b><small>{savedHotelIds.length ? `${savedHotelIds.length} ${savedHotelIds.length === 1 ? 'hotel' : 'hotels'}` : 'Tap the heart on any hotel'}{isGuest ? ' · on this phone' : ''}</small></div>
                  <CaretRight />
                </button>
              </div>
            </section>
            <button className="guest-list-row guest-profile-signout" type="button" aria-label={isGuest ? 'Forget this booking on this phone' : 'Sign out'} onClick={() => setConfirmSignOut(true)}>
              <span><SignOut /></span>
              <div>{isGuest ? <><b>Forget this booking on this phone</b><small>Find it again with the reference and last name</small></> : <><b>Sign out</b><small>Return to the welcome screen</small></>}</div>
              <CaretRight />
            </button>
            {/* Asked first: mid-stay, signing out drops the room link and the chat until the guest signs back in. */}
            {confirmSignOut ? (
              <div className="guest-sheet-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setConfirmSignOut(false); }}>
                <section className="guest-confirm-sheet" role="alertdialog" aria-modal="true" aria-labelledby="guest-signout-title" aria-describedby="guest-signout-text">
                  <h2 id="guest-signout-title">{isGuest ? 'Forget this booking on this phone?' : 'Sign out of Cabana?'}</h2>
                  <p id="guest-signout-text">{isGuest ? `There is no account to sign back into. To see ${primaryBooking?.property ?? 'the stay'} again, look it up with ${primaryBooking?.id ?? 'the booking reference'} and your last name. Saved hotels on this phone are cleared too.` : primaryBooking && describeStayStatus(primaryBooking).status !== 'checked-out' ? `Your stay at ${primaryBooking.property} stays booked. Sign back in to see it, your room charges and the front desk chat.` : 'Sign back in any time to see your stays.'}</p>
                  <Button className="guest-button guest-button--primary" type="button" onClick={() => { setConfirmSignOut(false); if (isGuest) clearDeviceData(); signOut(); }}>{isGuest ? 'Forget booking' : 'Sign out'}</Button>
                  <TextButton onClick={() => setConfirmSignOut(false)}>{isGuest ? 'Keep it' : 'Stay signed in'}</TextButton>
                </section>
              </div>
            ) : null}
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
        const openReward = (rewardId: string) => {
          setSelectedRewardId(rewardId);
          setRedeemedReward(null);
          go('reward-detail');
        };

        return (
          <div className="guest-stack guest-achievements-page">
            <section className="guest-achievements-header" aria-labelledby="guest-achievements-title">
              <h1 id="guest-achievements-title">Achievements</h1>
              <p className="guest-achievements-header__meta">
                {earned.length} {earned.length === 1 ? 'badge' : 'badges'} earned
              </p>
            </section>
            {/* A new account: nothing earned yet, so say how the first points and badges come. */}
            {earned.length === 0 && balance === 0 ? (
              <StatePanel icon={<Sparkle />} title="Your first points are one stay away">
                Every charge on your room bill earns points once the front desk settles it, and badges come from what you do on a stay. Scanning your room code earns 1,000 on its own.
              </StatePanel>
            ) : null}

            <AchievementSections
              balance={balance}
              pending={pendingPoints(session)}
              affordable={affordableRewards(balance)}
              nextUp={REWARD_MENU.find((reward) => reward.points > balance)}
              ledger={buildPointsLedger(session)}
              expiry={pointsExpiry(session)}
              rewards={REWARD_MENU}
              onOpenReward={openReward}
            >
              <BadgeShelf
                earned={earned}
                nearly={nearly}
                all={badges}
                onOpenBadge={(badgeId) => {
                  setOpenBadgeId(badgeId);
                  go('badge-detail');
                }}
              />
            </AchievementSections>

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
            onRedeem={() => {
              const next = redeemReward(session, reward);
              // Refused (balance short): nothing was spent, so nothing is promised.
              if (next === session) return;
              const redemptions = getRewards(next).redemptions;
              const code = redemptionCode(redemptions[redemptions.length - 1]!, redemptions.length - 1);
              const toldDesk = Boolean(primaryBooking) && online;
              setSession(next);
              if (toldDesk) {
                setChatMessages((messages) => [
                  ...messages,
                  { from: 'guest', body: `I’ve redeemed ${reward.title} with my points (${code}). Please have it ready.`, state: 'Sent' },
                  { from: 'desk', body: `Thank you. We have ${reward.title} noted against ${code} and will have it ready for you.`, state: 'Seen' },
                ]);
                notifyGuestRequest(`reward-${code}`, `${reward.title} redeemed`, `Code ${code} · the front desk has it.`);
              }
              setRedeemedReward({ code, toldDesk });
            }}
            redeemed={redeemedReward ?? undefined}
            onDone={() => { setRedeemedReward(null); go('rewards'); }}
          />
        );
      }

      case 'payments':
        return <PaymentsScreen session={session} onOpen={(id) => { setSelectedPaymentId(id); go('payment-detail'); }} onExplore={() => go('partner-hotels')} />;

      case 'payment-detail': {
        const selectedPayment = (session.payments ?? []).find((payment) => payment.id === selectedPaymentId);
        return <PaymentDetailScreen payment={selectedPayment} receipt={selectedPayment?.kind === 'stay' ? session.bookings.find((item) => item.id === selectedPayment.bookingId)?.reservation?.receipt : undefined} />;
      }

      case 'saved-hotels':
        return <SavedHotelsScreen search={stayDraft.search} onOpenHotel={openPartnerHotel} onBrowse={() => go('book-stay-results')} onDevice={isGuest} />;

      case 'stay-history': {
        const lifetime = formatPesoAmount(pastStays.reduce((sum, stay) => sum + parsePesoAmount(summarisePastStay(stay).total), 0));
        const nights = pastStays.reduce((sum, stay) => sum + stay.nights, 0);
        /*
          Every trip in one place: the ones ahead, soonest first, and the ones
          finished. The app follows the first of the upcoming (the stay in
          progress, else the soonest); the rest open their own View booking.
        */
        const upcomingStays = session.bookings
          .filter((item) => item.status === 'active' || item.status === 'upcoming')
          .sort((x, y) => Number(y.status === 'active') - Number(x.status === 'active') || x.checkIn.localeCompare(y.checkIn));
        // The stay under way, if there is one, sits above the tabs; Upcoming is what comes after it.
        const current = upcomingStays.find((item) => isStayUnderWay(item) && describeStayStatus(item).status !== 'checked-out');
        const aheadStays = upcomingStays.filter((item) => item.id !== current?.id);
        const tab = staysTab ?? (aheadStays.length || !pastStays.length ? 'upcoming' : 'past');
        return (
          <div className="guest-stack">
            <div className="guest-page-title">
              <h1>Stays</h1>
            </div>
            {current ? (
              <section className="guest-stays-current" aria-labelledby="guest-stays-current-title">
                <h2 id="guest-stays-current-title">Current stay</h2>
                <StayCard booking={current} compact statusLabel="Checked in" onOpen={() => go('rate-detail', current.id)} />
              </section>
            ) : null}
            <div className="sb-segmented sb-explore-tabs" role="tablist" aria-label="Stays">
              <button type="button" role="tab" aria-selected={tab === 'upcoming'} onClick={() => setStaysTab('upcoming')}>Upcoming{aheadStays.length ? ` (${aheadStays.length})` : ''}</button>
              <button type="button" role="tab" aria-selected={tab === 'past'} onClick={() => setStaysTab('past')}>Past{pastStays.length ? ` (${pastStays.length})` : ''}</button>
            </div>
            {tab === 'upcoming' ? (
              aheadStays.length ? (
                <div className="guest-stays-list">
                  {!current ? <p className="guest-stays-list__note">The app follows the first of these.</p> : null}
                  {aheadStays.map((item) => (
                    <div key={item.id} className="guest-stays-list__item">
                      <small>{item.id === primaryBooking?.id ? 'Next trip' : `In ${countNightsBetween(PROTOTYPE_TODAY, item.checkIn)} ${countNightsBetween(PROTOTYPE_TODAY, item.checkIn) === 1 ? 'day' : 'days'}`}</small>
                      <StayCard booking={item} compact statusLabel={describeStayStatus(item).label === 'Checked in' ? 'Checked in' : 'Confirmed'} onOpen={() => go('rate-detail', item.id)} />
                    </div>
                  ))}
                </div>
              ) : (
                <StatePanel icon={<SuitcaseRolling />} title={current ? 'Nothing booked after this stay' : 'No trips booked'} actions={<Button className="guest-button guest-button--secondary" type="button" onClick={() => go('partner-hotels')}>Browse hotels<ArrowRight aria-hidden="true" /></Button>}>
                  Trips you book, here or elsewhere, wait here until you go.
                </StatePanel>
              )
            ) : null}
            {tab === 'past' && pastStays.length ? <p className="guest-stays-list__note">{pastStays.length} completed stays · {nights} nights · {lifetime} spent</p> : null}
            {tab === 'past' && pastStays.length === 0 ? (
              <StatePanel icon={<SuitcaseRolling />} title="No stays yet" actions={<Button className="guest-button guest-button--secondary" type="button" onClick={() => go('partner-hotels')}>Explore partner hotels<ArrowRight aria-hidden="true" /></Button>}>
                Every stay you finish lands here, with its receipt and what you booked, for as long as you want it.
              </StatePanel>
            ) : null}
            {tab === 'past' ? pastStays.map((stay) => (
              <HistoryItem
                key={stay.id}
                stay={stay}
                onOpen={() => { setSelectedPastStayId(stay.id); go('stay-detail'); }}
              />
            )) : null}
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
        const frontDeskCharges = stay.charges.filter((charge) => charge.settlement === 'front-desk');
        const frontDeskTotal = formatPesoAmount(frontDeskCharges.reduce((sum, charge) => sum + parsePesoAmount(charge.amount), 0));
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
              <strong>{summary.total}</strong>
              <small>{stay.roomRate} room · {summary.extras} in additional charges</small>
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
                      <span className="guest-stay-entry__when">{charge.settlement === 'front-desk' ? `Paid at front desk · ${charge.detail}` : charge.detail}</span>
                    </div>
                  ))}
                </div>
                <div className="guest-stay-group-total">
                  <span>{group.category} total</span>
                  <b>{group.formattedTotal}</b>
                </div>
              </section>
            ))}

            {frontDeskCharges.length ? (
              <Notice title="Front-desk payment recorded">{`${frontDeskTotal} in additional charges was paid at the front desk and is included in this stay’s total. Room charges were settled at checkout.`}</Notice>
            ) : (
              <Notice title="Settled at checkout">Every line above was charged to room {stay.roomNumber} and paid when you checked out on {new Date(`${stay.checkOut}T12:00:00`).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}.</Notice>
            )}
          </div>
        );
      }

      default:
        return (
          <ScreenIntro title="We couldn’t open this page" text="Your stay is safe. Return to your Cabana home and try again.">
            {primary('Back to Cabana', 'stay-overview')}
          </ScreenIntro>
        );
    }
  };

  return (
    <div className="guest-prototype-stage">
      <div className="sr-only" role="status" aria-live="polite">
        {roomReadyNotification ? `${roomReadyNotification.headline}. ${roomReadyNotification.detail}` : ''}
      </div>

      <PrototypeControls
        online={online}
        // "Simulate 24 hours after checkout" closes the window without changing the stay, so it is read here too.
        stayState={primaryBooking && !hasCurrentStay ? 'account-only' : getPrototypeStayState(session)}
        onStayStateChange={applyStayState}
        onSimulateRoomAssignment={simulateRoomAssignment}
        onSimulateFreeUpgrade={simulateFreeUpgrade}
        canSimulateRoomAssignment={Boolean(eligibleRoomAssignBooking)}
        onSimulateRoomReady={simulateRoomReady}
        onSimulateUpgradeApproved={simulateUpgradeApproved}
        canSimulateUpgradeApproved={Boolean(upgradeAwaitingDesk)}
        canSimulateRoomReady={Boolean(eligibleRoomReadyBooking)}
        roomVerified={Boolean(primaryBooking?.roomVerification)}
        onToggleRoomVerified={toggleRoomVerified}
        canToggleRoomVerified={Boolean(primaryBooking && (primaryBooking.roomVerification || isStayUnderWay(primaryBooking)))}
        hasHistory={pastStays.length > 0}
        onToggleHistory={toggleHistory}
        hasReview={Boolean(managedReviewStayId && session.reviews.some((review) => review.bookingId === managedReviewStayId))}
        onClearReview={clearReview}
        autoDetectScans={autoDetectScans}
        onToggleAutoDetectScans={() => setAutoDetectScans((on) => !on)}
        strictLookup={strictLookup}
        onToggleStrictLookup={() => setStrictLookup((on) => !on)}
        simulatePostStayExpired={simulatePostStayExpired}
        onTogglePostStayExpired={() => setSimulatePostStayExpired((expired) => !expired)}
        feedClock={contextBooking ? feedClock ?? defaultFeedClock(contextBooking) : undefined}
        feedNights={contextBooking ? Math.max(1, countNightsBetween(contextBooking.checkIn, contextBooking.checkOut)) : 0}
        onFeedClockChange={changePrototypeClock}
        onReset={resetPrototype}
        conditions={{ online, pmsDown, emptyCatalogue, ...failNext }}
        onToggleCondition={(key) => {
          if (key === 'online') setOnline((value) => !value);
          else if (key === 'pmsDown') setPmsDown((value) => !value);
          else if (key === 'emptyCatalogue') setEmptyCatalogue((value) => !value);
          else setFailNext((current) => ({ ...current, [key]: !current[key] }));
        }}
        onEmptyAccount={() => openPrototypePage({ state: 'account-only', patch: brandNewAccount, screen: 'stay-overview' })}
        pages={prototypePages}
        hotelEvents={hotelAnswerEvents}
        guestEvents={guestRequestEvents}
        onClearDeviceData={clearDeviceData}
      />

      {pushNotice ? (
        <RoomReadyNotification
          label="Notification"
          actionLabel="View"
          headline={pushNotice.headline}
          detail={pushNotice.detail}
          onViewStay={() => { const { id, screen } = pushNotice; setPushNotice(null); setPushFocused(false); if (screen) { go(screen); return; } setSelectedStayEntryId(id); go('stay-entry'); }}
          onDismiss={() => { setPushNotice(null); setPushFocused(false); }}
          onFocusChange={setPushFocused}
        />
      ) : roomReadyNotification ? (
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
          {!isWelcome && !reelsOnScreen && activeScreen !== 'restaurant-menu' && activeScreen !== 'nearby-establishment' && !isChatScreen(activeScreen) ? <header className="guest-appbar" data-scrolled={scrolled}>
            <div className="guest-appbar__side">
              {activeScreen !== 'stay-overview' && !(showNoBookingExplore && activeScreen === 'partner-hotels') ? <button className="guest-icon-button guest-icon-button--back" type="button" onClick={history.length ? back : () => go('stay-overview')} aria-label="Go back"><ArrowLeft /></button> : <span className="guest-brand"><CabanaLockup className="guest-brand__lockup" /><span className="sr-only">Cabana</span></span>}
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
            className={`guest-screen ${showPrimaryNav ? 'has-nav' : ''} ${isWelcome ? 'guest-screen--welcome' : ''} ${isChatScreen(activeScreen) ? 'guest-screen--chat' : ''} ${activeScreen === 'restaurant-menu' || activeScreen === 'nearby-establishment' ? 'guest-screen--hero' : ''} ${reelsOnScreen ? 'guest-screen--reels' : ''}`}
            key={activeScreen}
            data-entrance={passEntranceScreen === activeScreen ? 'pass' : undefined}
            onScroll={(event) => {
              const next = event.currentTarget.scrollTop > 4;
              setScrolled((current) => (current === next ? current : next));
            }}
          >
            {renderScreen()}
          </div>


          {showPrimaryNav ? (
            <nav className={`guest-bottom-nav${reelsOnScreen && !feedSheet ? ' guest-bottom-nav--dark' : ''}`} aria-label="Primary navigation">
              <NavButton
                label="Home"
                icon={HugeHomeIcon}
                activeIcon={HugeHomeSolidIcon}
                active={activeScreen === 'stay-overview' || (!hasCurrentStay && !showNoBookingExplore && STAY_BOOKING_SCREENS.includes(activeScreen))}
                onClick={() => go('stay-overview')}
              />
              {showNoBookingExplore ? (
                <NavButton
                  label="Explore"
                  icon={HugeCompassIcon}
                  activeIcon={HugeCompassSolidIcon}
                  active={STAY_BOOKING_SCREENS.includes(activeScreen)}
                  onClick={() => go('partner-hotels')}
                />
              ) : null}
              {hasCurrentStay ? (
                <NavButton
                  label={bookingNavLabel}
                  icon={HugeCompassIcon}
                  activeIcon={HugeCompassSolidIcon}
                  active={EXPLORE_SCREENS.includes(activeScreen) || activeScreen === bookingSlot.screen || STAY_BOOKING_SCREENS.includes(activeScreen)}
                  onClick={() => go(bookingSlot.screen)}
                />
              ) : null}
              {hasCurrentStay ? (
                <NavButton
                    label="My Stay"
                    icon={HugeBedSingleIcon}
                    activeIcon={HugeBedSingleSolidIcon}
                    active={MY_STAY_SCREENS.includes(activeScreen)}
                    onClick={() => go('my-stay')}
                  />
              ) : null}
              {hasCurrentStay ? (
                <NavButton
                  label="Chat"
                  icon={HugeChatIcon}
                  activeIcon={HugeChatSolidIcon}
                  active={false}
                  unread={hasUnreadChat}
                  onClick={() => go('chat')}
                />
              ) : null}
              <NavButton
                label="Profile"
                icon={HugeProfileIcon}
                activeIcon={HugeProfileSolidIcon}
                active={activeScreen === 'profile' || activeScreen === 'stay-history' || activeScreen === 'saved-hotels' || activeScreen === 'payments' || activeScreen === 'payment-detail' || activeScreen === 'rewards' || activeScreen === 'reward-detail' || activeScreen === 'badge-detail'}
                onClick={() => go('profile')}
              />
            </nav>
          ) : null}
        </section>
      </main>
    </div>
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

/**
 * Property-wide broadcasts. Deliberately not notifications: these are the same
 * for every guest in the building, so they belong on the shared surface rather
 * than in a personal inbox.
 */

function TimelineItem({ title, text, done }: { title: string; text: string; done?: boolean }) {
  return <div className={`guest-timeline__item ${done ? 'is-done' : ''}`}><span>{done ? <Check /> : null}</span><div><b>{title}</b><small>{text}</small></div></div>;
}

/** Browse, the old-fashioned way: each lands on its existing page. */
const BROWSE_CATEGORIES: BrowseCategory[] = [
  { id: 'dining', label: 'Food & Drinks', detail: 'Restaurants, bars and room service', image: storyImage('dining') },
  { id: 'spa', label: 'Spa & Wellness', detail: 'Massages, facials and grooming', image: storyImage('spa') },
  { id: 'entertainment', label: 'Activities & Tours', detail: 'Tours, workshops and live music', image: storyImage('tour') },
  { id: 'rentals', label: 'Rentals', detail: 'Motorbikes, cars and bikes', image: getCategoryCoverImage('rentals') },
  { id: 'services', label: 'Hotel Services', detail: 'Transfers, laundry and celebrations', image: storyImage('pool') },
  { id: 'gifts-souvenirs', label: 'Gifts & Souvenirs', detail: 'Pasalubong and keepsakes', image: storyImage('food-crawl') },
  { id: 'nearby', label: 'Nearby', detail: 'Partners and independent places around the hotel', image: storyImage('heritage-walk') },
];

const ROOM_UPGRADES = [
  { id: 'deluxe-king-512', name: 'Deluxe King Room', type: 'Higher-floor room', features: 'King bed · Bay view · Larger workspace', guests: '2 guests', price: '₱3,600', transfer: 'Ready about 15 minutes after the hotel approves', transferDeadline: '10:00 AM tomorrow', roomNumber: '512', image: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1000&q=80' },
  { id: 'garden-suite-608', name: 'Garden Suite', type: 'Suite upgrade', features: 'King bed · Separate sitting area · Balcony', guests: '3 guests', price: '₱6,000', transfer: 'Ready about 30 minutes after the hotel approves', transferDeadline: '10:00 AM tomorrow', roomNumber: '608', image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1000&q=80' },
] as const;

/*
  An upgrade is a room charge, so it sits behind the same gate as every other
  one: offered only once the room is verified, and only while a night is left
  to spend in the better room.
*/
function canOfferRoomUpgrade(booking: Booking) {
  return !booking.roomUpgrade && canUseOnPropertyServices(booking) && booking.checkOut > PROTOTYPE_TODAY;
}
