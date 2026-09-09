export type ScreenGroup = 'Entry' | 'Pre-arrival' | 'Stay' | 'Account';

export type ScreenId =
  | 'room-qr-landing'
  | 'wifi-landing'
  | 'identify'
  | 'lookup-fallback'
  | 'front-desk-assist'
  | 'no-booking'
  | 'booking-found'
  | 'create-account'
  | 'welcome-back'
  | 'stay-overview'
  | 'guest-details'
  | 'id-capture'
  | 'room-preferences'
  | 'additional-guests'
  | 'repeat-review'
  | 'rate-detail'
  | 'early-check-in'
  | 'insurance-offer'
  | 'prereg-complete'
  | 'prereg-queued'
  | 'wallet'
  | 'wallet-offline'
  | 'marketplace'
  | 'category-listing'
  | 'hotel-service'
  | 'vendor-service'
  | 'service-booking'
  | 'booking-confirmation'
  | 'booking-blocked'
  | 'my-bookings'
  | 'cancel-before-cutoff'
  | 'cancel-after-cutoff'
  | 'folio'
  | 'chat'
  | 'chat-after-hours'
  | 'room-qr-midstay'
  | 'profile'
  | 'stay-history';

export type PrototypeScreen = {
  id: ScreenId;
  number: number;
  group: ScreenGroup;
  title: string;
};

const screen = (number: number, group: ScreenGroup, id: ScreenId, title: string): PrototypeScreen => ({
  id,
  number,
  group,
  title,
});

export const SCREENS: PrototypeScreen[] = [
  screen(1, 'Entry', 'room-qr-landing', 'Room QR detected'),
  screen(2, 'Entry', 'wifi-landing', 'Hotel Wi-Fi'),
  screen(3, 'Entry', 'identify', 'Find your booking'),
  screen(4, 'Entry', 'lookup-fallback', 'Try another way'),
  screen(5, 'Entry', 'front-desk-assist', 'Front desk assist'),
  screen(6, 'Entry', 'no-booking', 'No booking found'),
  screen(7, 'Entry', 'booking-found', 'Booking found'),
  screen(8, 'Entry', 'create-account', 'Create your profile'),
  screen(9, 'Entry', 'welcome-back', 'Welcome back'),
  screen(10, 'Pre-arrival', 'stay-overview', 'Your stay'),
  screen(11, 'Pre-arrival', 'guest-details', 'Guest details'),
  screen(12, 'Pre-arrival', 'id-capture', 'ID or passport'),
  screen(13, 'Pre-arrival', 'room-preferences', 'Room preferences'),
  screen(14, 'Pre-arrival', 'additional-guests', 'Additional guests'),
  screen(15, 'Pre-arrival', 'repeat-review', 'Review your details'),
  screen(16, 'Pre-arrival', 'rate-detail', 'Room and rate'),
  screen(17, 'Pre-arrival', 'early-check-in', 'Early check-in'),
  screen(18, 'Pre-arrival', 'insurance-offer', 'Travel insurance'),
  screen(19, 'Pre-arrival', 'prereg-complete', 'Pre-registration complete'),
  screen(20, 'Pre-arrival', 'prereg-queued', 'Ready to send'),
  screen(21, 'Stay', 'wallet', 'Stay QR'),
  screen(22, 'Stay', 'wallet-offline', 'Stay QR offline'),
  screen(23, 'Stay', 'marketplace', 'Services'),
  screen(24, 'Stay', 'category-listing', 'Spa and massage'),
  screen(25, 'Stay', 'hotel-service', 'In-room dining'),
  screen(26, 'Stay', 'vendor-service', 'Hilom signature massage'),
  screen(27, 'Stay', 'service-booking', 'Choose a time'),
  screen(28, 'Stay', 'booking-confirmation', 'Service confirmed'),
  screen(29, 'Stay', 'booking-blocked', 'Connect to book'),
  screen(30, 'Stay', 'my-bookings', 'My bookings'),
  screen(31, 'Stay', 'cancel-before-cutoff', 'Cancel service'),
  screen(32, 'Stay', 'cancel-after-cutoff', 'Contact front desk'),
  screen(33, 'Stay', 'folio', 'Room charges'),
  screen(34, 'Stay', 'chat', 'Front desk chat'),
  screen(35, 'Stay', 'chat-after-hours', 'Chat after hours'),
  screen(36, 'Stay', 'room-qr-midstay', 'You are checked in'),
  screen(37, 'Account', 'profile', 'Profile and preferences'),
  screen(38, 'Account', 'stay-history', 'Stay history'),
];

export type BookingStatus = 'upcoming' | 'active' | 'completed';

export type Booking = {
  id: string;
  property: string;
  city: string;
  status: BookingStatus;
  checkIn: string;
  checkOut: string;
  roomType: string;
  roomNumber?: string;
  guestCount: number;
  source: string;
  preArrivalCompleted: number;
  preArrivalTotal: number;
  nextPreArrivalStep?: string;
  folioTotal?: string;
  stayQrAvailable: boolean;
};

export type ServiceBooking = {
  id: string;
  bookingId: string;
  title: string;
  scheduledFor: string;
  amount: string;
  status: 'confirmed' | 'cancelled' | 'completed';
};

export type GuestSession = {
  guestName: string;
  email: string;
  bookings: Booking[];
  activeBookingId?: string;
  serviceBookings: ServiceBooking[];
  folioTotal: string;
};

export type HomeVariant =
  | 'active'
  | 'upcoming'
  | 'multiple-upcoming'
  | 'completed'
  | 'empty';

export const MOCK_SESSION: GuestSession = {
  guestName: 'Ana Santos',
  email: 'ana@example.com',
  bookings: [
    {
      id: 'HEN-241109',
      property: 'The Henry Manila',
      city: 'Manila',
      status: 'upcoming',
      checkIn: '2026-11-09',
      checkOut: '2026-11-12',
      roomType: 'King room',
      guestCount: 2,
      source: 'Agoda',
      preArrivalCompleted: 2,
      preArrivalTotal: 5,
      nextPreArrivalStep: 'Add your ID details',
      stayQrAvailable: false,
    },
    {
      id: 'HEN-CEBU-240615',
      property: 'The Henry Cebu',
      city: 'Cebu',
      status: 'completed',
      checkIn: '2026-06-15',
      checkOut: '2026-06-18',
      roomType: 'Garden suite',
      roomNumber: '208',
      guestCount: 2,
      source: 'Direct booking',
      preArrivalCompleted: 5,
      preArrivalTotal: 5,
      stayQrAvailable: false,
    },
  ],
  serviceBookings: [],
  folioTotal: '₱0',
};

export function getPrimaryBooking(
  bookings: Booking[],
  activeBookingId?: string,
): Booking | undefined {
  const selected = activeBookingId
    ? bookings.find((booking) => booking.id === activeBookingId)
    : undefined;
  if (selected) return selected;

  const active = bookings.find((booking) => booking.status === 'active');
  if (active) return active;

  const upcoming = bookings
    .filter((booking) => booking.status === 'upcoming')
    .sort((a, b) => a.checkIn.localeCompare(b.checkIn));
  if (upcoming[0]) return upcoming[0];

  return bookings
    .filter((booking) => booking.status === 'completed')
    .sort((a, b) => b.checkIn.localeCompare(a.checkIn))[0];
}

export function getHomeVariant(
  bookings: Booking[],
  activeBookingId?: string,
): HomeVariant {
  const selectedBooking = activeBookingId
    ? bookings.find((booking) => booking.id === activeBookingId)
    : undefined;
  if (
    selectedBooking?.status === 'active' ||
    bookings.some((booking) => booking.status === 'active')
  ) {
    return 'active';
  }

  const upcomingCount = bookings.filter(
    (booking) => booking.status === 'upcoming',
  ).length;
  if (upcomingCount > 1) return 'multiple-upcoming';
  if (upcomingCount === 1) return 'upcoming';
  if (bookings.some((booking) => booking.status === 'completed')) return 'completed';
  return 'empty';
}

export type ScenarioId = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H' | 'I';

export type Scenario = {
  id: ScenarioId;
  title: string;
  description: string;
  start: ScreenId;
  offline?: boolean;
};

export const SCENARIOS: Scenario[] = [
  { id: 'A', title: 'First-timer, pre-arrival', description: 'Confirmation link to Stay QR', start: 'identify' },
  { id: 'B', title: 'Repeat guest', description: 'Recognized and confirmed in under 30 seconds', start: 'welcome-back' },
  { id: 'C', title: 'Arrival without signal', description: 'Cached Stay QR at the desk', start: 'wallet-offline', offline: true },
  { id: 'D', title: 'Room QR, mid-stay', description: 'Skip pre-arrival and order dining', start: 'room-qr-midstay' },
  { id: 'E', title: 'Hotel Wi-Fi arrival', description: 'Identify and attach the booking', start: 'wifi-landing' },
  { id: 'F', title: 'Booking lookup fails', description: 'Three-tier fallback to human help', start: 'identify' },
  { id: 'G', title: 'Spa booking and cancellation', description: 'Third-party service charged to the room', start: 'marketplace' },
  { id: 'H', title: 'Request towels', description: 'Structured request in front desk chat', start: 'chat' },
  { id: 'I', title: 'Offline booking attempt', description: 'Capacity is blocked; chat queues', start: 'vendor-service', offline: true },
];

export type OfflineCapability = 'wallet' | 'cached-stay' | 'chat' | 'pre-registration' | 'preferences' | 'service-booking' | 'payment' | 'live-rates';
export type OfflineAction = 'available' | 'queued' | 'blocked';

export function getOfflineAction(capability: OfflineCapability): OfflineAction {
  if (capability === 'wallet' || capability === 'cached-stay') return 'available';
  if (capability === 'chat' || capability === 'pre-registration' || capability === 'preferences') return 'queued';
  return 'blocked';
}

export type CancellationState = 'self-service' | 'front-desk';

export function getCancellationState(hoursUntilService: number, cutoffHours: number): CancellationState {
  return hoursUntilService >= cutoffHours ? 'self-service' : 'front-desk';
}

export const SERVICES = [
  { id: 'dining', name: 'In-room dining', category: 'Dining', operator: 'Hotel operated', price: 'From ₱450', cutoff: '2-hour cancellation cutoff', tone: 'sand' },
  { id: 'spa', name: 'Hilom signature massage', category: 'Spa & massage', operator: 'Third-party on property', price: '₱2,400', cutoff: '24-hour cancellation cutoff', tone: 'sage' },
  { id: 'restaurant', name: 'Apartment 1B', category: 'Restaurant & bar', operator: 'Hotel operated', price: 'From ₱600', cutoff: '2-hour cancellation cutoff', tone: 'clay' },
  { id: 'transfer', name: 'Airport transfer', category: 'Transfers', operator: 'Hotel arranged', price: '₱1,200', cutoff: '2-hour cancellation cutoff', tone: 'blue' },
  { id: 'tour', name: 'Island day tour', category: 'Activities & tours', operator: 'Third-party on property', price: '₱3,800', cutoff: '24-hour cancellation cutoff', tone: 'sun' },
  { id: 'rental', name: 'City bicycle', category: 'Vehicle & bike rental', operator: 'Hotel operated', price: '₱350 / day', cutoff: '2-hour cancellation cutoff', tone: 'ink' },
] as const;

export const screenTitle = (id: ScreenId) => SCREENS.find((item) => item.id === id)?.title ?? 'Guest app';
