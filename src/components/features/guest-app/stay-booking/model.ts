import type { Booking, ServiceBooking } from '../prototype-model';
import { CHECK_IN_FROM, PROTOTYPE_TODAY, countNightsBetween, formatPesoAmount, formatServiceDay } from '../prototype-model';
import { EARLY_CHECK_IN, earlyCheckInBookingId } from '../guest-shared';

/*
  Hotel booking, as a pure model: inventory, rates, availability, room
  capacity and the booking a paid draft becomes. No React, no browser APIs --
  the same contract as `prototype-model.ts`. Everything here is mock data
  standing in for the PMS middleware, and deterministic, so a demo shows the
  same "Only 2 left" every time. The rules follow the spec
  (docs/superpowers/specs/2026-09-29-hotel-booking-design.md § Rules).
*/

export type StaySearch = { location: string; checkIn: string; checkOut: string; adults: number; childAges: number[] };
export type RatePlanId = 'flex' | 'flex-breakfast' | 'saver';
export type CartLine = { roomTypeId: string; ratePlanId: RatePlanId; quantity: number };
/** One per cart room, in cart order. `childIndexes` point into `search.childAges`. */
export type RoomAllocation = { adults: number; childIndexes: number[] };
export type StayGuestDetails = {
  name: string;
  email: string;
  phone: string;
  roomLeads: string[];
  bedPreferences: string[];
  arrivalTime: string;
  requests: string;
  promoCode: string;
  /** An official receipt made out to a company, not the guest. */
  receipt?: CompanyReceipt;
};

export type CompanyReceipt = { company: string; tin: string; address: string };
/** `addOns` is optional so a draft saved before arrival extras existed still restores. */
export type StayBookingDraft = { search: StaySearch; hotelId?: string; cart: CartLine[]; allocation: RoomAllocation[]; addOns?: StayAddOn[] };

export type Reservation = {
  reference: string;
  hotelId: string;
  /** Stable across partial cancellations, and shared with the payment receipt line. */
  rooms: { id?: string; roomTypeId: string; roomName: string; ratePlanId: RatePlanId; leadGuest: string; adults: number; children: number; amount?: number }[];
  /** Current value of the rooms still booked, including taxes and the room share of any voucher. */
  total: number;
  /** Paid room value kept after cancelling a room with no refund due. */
  cancellationRetainedTotal?: number;
  paidWith: string;
  paidAt: string;
  refundable: boolean;
  /** ISO date; free cancellation runs to the end of this day. */
  freeCancellationUntil?: string;
  /** The company the official receipt is made out to. */
  receipt?: CompanyReceipt;
  /** The voucher used, and what it took off the rooms. */
  promo?: { code: string; label: string; discount: number };
  /** Arrival extras paid with the booking. Excludes charges added to the room if confirmed. */
  addOns?: { id: AddOnId; serviceBookingId: string; title: string; amount: number; detail?: string }[];
  /** Upfront extras only; excludes room charges such as confirmed early check-in. */
  addOnsTotal?: number;
};

export type Amenity = 'pool' | 'beach' | 'breakfast' | 'wifi' | 'airport-transfer' | 'spa' | 'gym' | 'restaurant' | 'parking' | 'family';

export const AMENITY_LABELS: Record<Amenity, string> = {
  pool: 'Pool',
  beach: 'Beachfront',
  breakfast: 'Breakfast available',
  wifi: 'Free Wi-Fi',
  'airport-transfer': 'Airport transfer',
  spa: 'Spa',
  gym: 'Gym',
  restaurant: 'Restaurant',
  parking: 'Parking',
  family: 'Family friendly',
};

export type StayImage = { src: string; alt: string; focalPoint: string };

export type StayRoomType = {
  id: string;
  name: string;
  sizeSqm: number;
  beds: string;
  view: string;
  features: string[];
  /** Guests aged 12+ the room takes. */
  maxAdults: number;
  /** Guests aged 6+ the room takes; under-6s stay free on top. */
  sleeps: number;
  /** Weekday rate for the room, in pesos. */
  base: number;
  image: StayImage;
  plans: RatePlanId[];
};

export type StayHotel = {
  id: string;
  name: string;
  /** The search location this hotel answers to. */
  city: string;
  area: string;
  address: string;
  stars: 3 | 4 | 5;
  rating: number;
  reviews: number;
  position: [number, number];
  image: StayImage;
  gallery: StayImage[];
  summary: string;
  about: string;
  amenities: Amenity[];
  phone?: string;
  email?: string;
  /** Part of The Henry Hotels & Resorts. */
  henry?: boolean;
  roomTypes: StayRoomType[];
};

export type StayLocation = { label: string; detail: string; center?: [number, number] };

export const ANYWHERE = 'Anywhere in the Philippines';

export const STAY_LOCATIONS: StayLocation[] = [
  { label: ANYWHERE, detail: 'Every partner hotel' },
  { label: 'Manila', detail: 'Metro Manila', center: [14.5547, 121.0244] },
  { label: 'Cebu', detail: 'City and Mactan', center: [10.3157, 123.8854] },
  { label: 'Boracay', detail: 'Aklan', center: [11.9674, 121.9248] },
  { label: 'El Nido', detail: 'Palawan', center: [11.1784, 119.393] },
  { label: 'Siargao', detail: 'Surigao del Norte', center: [9.789, 126.156] },
  { label: 'Bohol', detail: 'Panglao Island', center: [9.576, 123.763] },
  { label: 'Dumaguete', detail: 'Negros Oriental', center: [9.3068, 123.3054] },
  { label: 'Baguio', detail: 'Benguet', center: [16.4023, 120.596] },
  { label: 'Tagaytay', detail: 'Cavite', center: [14.1153, 120.9621] },
];

const unsplash = (id: string, alt: string, focalPoint = '50% 50%'): StayImage => ({
  src: `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=1200&q=80`,
  alt,
  focalPoint,
});

const ROOM_PHOTOS = {
  king: unsplash('1590490360182-c33d57733427', 'King room with warm lighting'),
  kingBright: unsplash('1559599238-308793637427', 'Bright king room with upholstered headboard'),
  deluxe: unsplash('1618773928121-c32242e63f39', 'Deluxe room with a king bed'),
  queen: unsplash('1512918728675-ed5a9ecdebfd', 'Queen room with pale walls'),
  dark: unsplash('1566665797739-1674de7a421a', 'Room with dark timber and a queen bed'),
  twin: unsplash('1595576508898-0ad5c879a061', 'Family room with two beds'),
  suite: unsplash('1578683010236-d716f9a3f461', 'Suite with a lounge and wide windows'),
  garden: unsplash('1582719478250-c89cae4dc85b', 'Garden suite opening onto a terrace'),
  lounge: unsplash('1505691938895-1758d7feb511', 'Suite living room'),
  villa: unsplash('1602002418082-a4443e081dd1', 'Villa bedroom facing the sea'),
  mountain: unsplash('1596394516093-501ba68a0ba6', 'Room with a view over the mountains'),
};

const room = (id: string, name: string, base: number, sleeps: number, maxAdults: number, sizeSqm: number, beds: string, view: string, image: StayImage, features: string[], plans: RatePlanId[] = ['flex', 'flex-breakfast', 'saver']): StayRoomType => ({ id, name, base, sleeps, maxAdults, sizeSqm, beds, view, image, features, plans });

export const STAY_HOTELS: StayHotel[] = [
  {
    id: 'manila',
    name: 'The Henry Hotel Manila',
    city: 'Manila',
    area: 'Pasay · Metro Manila',
    address: '2680 F.B. Harrison St., Pasay City, Philippines',
    stars: 4,
    rating: 9.1,
    reviews: 1284,
    position: [14.5436, 120.9953],
    image: unsplash('1566073771259-6a8506099945', 'The Henry Manila courtyard and pool'),
    gallery: [ROOM_PHOTOS.king, ROOM_PHOTOS.garden, ROOM_PHOTOS.lounge],
    summary: 'A modern vintage hideaway in a heritage home, surrounded by garden courtyards.',
    about: 'The Henry Hotel Manila pairs mid-century character with a quiet garden setting in Pasay. Spend the afternoon by the pool, dine at Apartment 1B, or use the hotel as a base for exploring Manila.',
    amenities: ['pool', 'restaurant', 'wifi', 'breakfast', 'airport-transfer', 'parking', 'family'],
    phone: '+63 2 8807 8888',
    email: 'reservations.manila@thehenryhotel.com',
    henry: true,
    roomTypes: [
      room('manila-king', 'King Room', 6200, 2, 2, 32, '1 king bed', 'Courtyard view', ROOM_PHOTOS.king, ['Rain shower', 'Work desk', 'Minibar']),
      room('manila-suite', 'Garden Suite', 9400, 3, 3, 48, '1 king bed + daybed', 'Private terrace', ROOM_PHOTOS.garden, ['Separate sitting area', 'Terrace', 'Bathtub']),
      room('manila-villa', 'Two-Bedroom Villa', 14800, 5, 4, 76, '1 king + 2 single beds', 'Garden view', ROOM_PHOTOS.lounge, ['Two bedrooms', 'Living room', 'Kitchenette'], ['flex', 'flex-breakfast']),
    ],
  },
  {
    id: 'cebu',
    name: 'The Henry Hotel Cebu',
    city: 'Cebu',
    area: 'Banilad · Cebu City',
    address: 'Paseo Saturnino, Banilad, Cebu City, Philippines',
    stars: 4,
    rating: 8.8,
    reviews: 842,
    position: [10.3398, 123.9116],
    image: unsplash('1582719508461-905c673771fd', 'The Henry Cebu exterior and balconies', '50% 45%'),
    gallery: [ROOM_PHOTOS.deluxe, ROOM_PHOTOS.suite, ROOM_PHOTOS.twin],
    summary: 'A boutique hotel in Banilad with distinctive design and on-site dining.',
    about: 'The Henry Hotel Cebu sits in Banilad near Paseo Saturnino, with a pool deck, the Azotea rooftop and quick access to Mactan.',
    amenities: ['pool', 'restaurant', 'wifi', 'breakfast', 'airport-transfer', 'gym'],
    phone: '+63 32 520 8877',
    email: 'reservations.cebu@thehenryhotel.com',
    henry: true,
    roomTypes: [
      room('cebu-deluxe', 'Deluxe Room', 5600, 2, 2, 28, '1 queen bed', 'Pool view', ROOM_PHOTOS.deluxe, ['Rain shower', 'Smart TV']),
      room('cebu-family', 'Family Room', 7400, 4, 3, 38, '1 queen + 2 single beds', 'Garden view', ROOM_PHOTOS.twin, ['Sofa bed', 'Bathtub']),
      room('cebu-suite', 'Garden Suite', 8800, 3, 3, 44, '1 king bed + daybed', 'Ground-floor garden', ROOM_PHOTOS.suite, ['Private garden', 'Sitting area']),
    ],
  },
  {
    id: 'dumaguete',
    name: 'The Henry Resort Dumaguete',
    city: 'Dumaguete',
    area: 'Bantayan · Dumaguete City',
    address: 'Flores Avenue, Bantayan, Dumaguete City, Philippines',
    stars: 4,
    rating: 8.9,
    reviews: 356,
    position: [9.3239, 123.3081],
    image: unsplash('1520250497591-112f2f40a3f4', 'The Henry Dumaguete coastal grounds', '50% 55%'),
    gallery: [ROOM_PHOTOS.queen, ROOM_PHOTOS.suite],
    summary: 'A peaceful garden retreat for families and creative travellers.',
    about: 'Landscaped grounds, a coastal setting and several places to eat, a short ride from Rizal Boulevard.',
    amenities: ['pool', 'restaurant', 'wifi', 'breakfast', 'family', 'parking'],
    phone: '+63 35 531 5707',
    email: 'reservations.dumaguete@thehenryhotel.com',
    henry: true,
    roomTypes: [
      room('dumaguete-deluxe', 'Deluxe Room', 4900, 2, 2, 26, '1 queen bed', 'Sea view', ROOM_PHOTOS.queen, ['Balcony', 'Rain shower']),
      room('dumaguete-suite', 'Corner Suite', 7600, 4, 3, 40, '1 king + 1 sofa bed', 'Sea view', ROOM_PHOTOS.suite, ['Wraparound balcony', 'Sitting area']),
    ],
  },
  {
    id: 'poblacion-loft',
    name: 'Poblacion Loft Hotel',
    city: 'Manila',
    area: 'Poblacion · Makati',
    address: 'Don Pedro St., Poblacion, Makati City, Philippines',
    stars: 3,
    rating: 8.4,
    reviews: 2210,
    position: [14.5648, 121.0305],
    image: unsplash('1455587734955-081b22074882', 'Poblacion Loft Hotel facade'),
    gallery: [ROOM_PHOTOS.dark, ROOM_PHOTOS.twin],
    summary: 'Compact lofts in the middle of Makati’s bar and food street.',
    about: 'A good-value base a short walk from the Makati CBD, with a rooftop bar and 24-hour front desk.',
    amenities: ['wifi', 'restaurant', 'gym'],
    roomTypes: [
      room('poblacion-queen', 'Queen Loft', 3200, 2, 2, 20, '1 queen bed', 'City view', ROOM_PHOTOS.dark, ['Mezzanine bed', 'Smart TV']),
      room('poblacion-twin', 'Twin Loft', 3500, 2, 2, 22, '2 single beds', 'City view', ROOM_PHOTOS.twin, ['Work desk']),
      room('poblacion-family', 'Family Loft', 4800, 4, 3, 30, '1 queen + 2 single beds', 'City view', ROOM_PHOTOS.queen, ['Two levels', 'Sofa'], ['flex', 'saver']),
    ],
  },
  {
    id: 'mactan-tidewater',
    name: 'Mactan Tidewater Resort',
    city: 'Cebu',
    area: 'Punta Engaño · Mactan',
    address: 'Punta Engaño Rd., Lapu-Lapu City, Cebu, Philippines',
    stars: 5,
    rating: 9.3,
    reviews: 1630,
    position: [10.3065, 124.0205],
    image: unsplash('1561501900-3701fa6a0864', 'Mactan Tidewater Resort at sunset'),
    gallery: [ROOM_PHOTOS.villa, ROOM_PHOTOS.suite, ROOM_PHOTOS.kingBright],
    summary: 'A beachfront resort with its own reef, fifteen minutes from the airport.',
    about: 'Lagoon pools, a house reef for snorkelling, a full spa and a kids’ club on the Punta Engaño shoreline.',
    amenities: ['beach', 'pool', 'spa', 'restaurant', 'wifi', 'breakfast', 'airport-transfer', 'gym', 'family'],
    roomTypes: [
      room('mactan-deluxe', 'Deluxe Ocean King', 11800, 2, 2, 42, '1 king bed', 'Ocean view', ROOM_PHOTOS.kingBright, ['Balcony', 'Bathtub']),
      room('mactan-family', 'Family Ocean Room', 14600, 4, 3, 56, '1 king + 2 single beds', 'Ocean view', ROOM_PHOTOS.twin, ['Kids’ club access', 'Balcony']),
      room('mactan-villa', 'Pool Villa', 26500, 3, 3, 90, '1 king bed + daybed', 'Private pool', ROOM_PHOTOS.villa, ['Private pool', 'Butler service'], ['flex', 'flex-breakfast']),
    ],
  },
  {
    id: 'alon-boracay',
    name: 'Alon Beach House',
    city: 'Boracay',
    area: 'Station 1 · Boracay',
    address: 'White Beach Path, Station 1, Balabag, Boracay, Aklan',
    stars: 4,
    rating: 9.0,
    reviews: 978,
    position: [11.9722, 121.9205],
    image: unsplash('1519046904884-53103b34b206', 'White sand and palms in front of Alon Beach House'),
    gallery: [ROOM_PHOTOS.kingBright, ROOM_PHOTOS.garden],
    summary: 'Steps from the quietest stretch of White Beach.',
    about: 'Low-rise rooms around a garden pool, with sunset loungers on the sand and a beach bar at the gate.',
    amenities: ['beach', 'pool', 'restaurant', 'wifi', 'breakfast', 'airport-transfer'],
    roomTypes: [
      room('alon-garden', 'Garden Queen', 7200, 2, 2, 28, '1 queen bed', 'Garden view', ROOM_PHOTOS.garden, ['Terrace', 'Outdoor shower']),
      room('alon-beach', 'Beachfront King', 10900, 2, 2, 34, '1 king bed', 'Beachfront', ROOM_PHOTOS.kingBright, ['Sunset balcony', 'Minibar']),
      room('alon-family', 'Family Bungalow', 13200, 4, 3, 52, '1 king + 2 single beds', 'Garden view', ROOM_PHOTOS.twin, ['Two rooms', 'Porch']),
    ],
  },
  {
    id: 'bato-cove',
    name: 'Bato Cove Resort',
    city: 'El Nido',
    area: 'Corong-Corong · El Nido, Palawan',
    address: 'Corong-Corong Beach, El Nido, Palawan',
    stars: 5,
    rating: 9.4,
    reviews: 612,
    position: [11.1672, 119.3876],
    image: unsplash('1518509562904-e7ef99cdcc86', 'Limestone cliffs and lagoon near Bato Cove'),
    gallery: [ROOM_PHOTOS.villa, ROOM_PHOTOS.suite],
    summary: 'Cliffside villas facing the Bacuit Bay islands.',
    about: 'Island-hopping from the resort jetty, an infinity pool above the cove and dinners on the sand.',
    amenities: ['beach', 'pool', 'spa', 'restaurant', 'breakfast', 'airport-transfer'],
    roomTypes: [
      room('bato-villa', 'Bay View Villa', 16500, 2, 2, 55, '1 king bed', 'Bay view', ROOM_PHOTOS.villa, ['Outdoor bath', 'Deck']),
      room('bato-family', 'Two-Bedroom Cliff Villa', 27800, 5, 4, 110, '1 king + 2 queen beds', 'Bay view', ROOM_PHOTOS.lounge, ['Plunge pool', 'Two bedrooms'], ['flex', 'flex-breakfast']),
    ],
  },
  {
    id: 'dagat-surf-lodge',
    name: 'Dagat Surf Lodge',
    city: 'Siargao',
    area: 'General Luna · Siargao',
    address: 'Tourism Rd., General Luna, Siargao Island',
    stars: 3,
    rating: 8.7,
    reviews: 1105,
    position: [9.7941, 126.1569],
    image: unsplash('1584132967334-10e028bd69f7', 'Pool deck under the palms at Dagat Surf Lodge'),
    gallery: [ROOM_PHOTOS.dark, ROOM_PHOTOS.twin],
    summary: 'A laid-back lodge a scooter ride from Cloud 9.',
    about: 'Surf lessons, board storage, a smoothie bar and hammocks around a small pool.',
    amenities: ['pool', 'wifi', 'restaurant', 'breakfast', 'family'],
    roomTypes: [
      room('dagat-queen', 'Queen Cabana', 3900, 2, 2, 22, '1 queen bed', 'Garden view', ROOM_PHOTOS.dark, ['Fan and air-con', 'Porch']),
      room('dagat-family', 'Family Cabana', 5600, 4, 3, 34, '1 queen + 2 single beds', 'Pool view', ROOM_PHOTOS.twin, ['Loft beds', 'Porch']),
    ],
  },
  {
    id: 'pinetop-baguio',
    name: 'Pinetop Hotel',
    city: 'Baguio',
    area: 'Camp John Hay · Baguio',
    address: 'Loakan Rd., Camp John Hay, Baguio City',
    stars: 4,
    rating: 8.6,
    reviews: 734,
    position: [16.3997, 120.6113],
    image: unsplash('1596394516093-501ba68a0ba6', 'Room with a mountain view at Pinetop Hotel'),
    gallery: [ROOM_PHOTOS.mountain, ROOM_PHOTOS.queen],
    summary: 'Pine-forest rooms with fireplaces, above the city fog.',
    about: 'Cool mornings, a fireplace lounge and trails through Camp John Hay from the back gate.',
    amenities: ['restaurant', 'wifi', 'breakfast', 'parking', 'family'],
    roomTypes: [
      room('pinetop-deluxe', 'Deluxe Pine Room', 5200, 2, 2, 30, '1 queen bed', 'Forest view', ROOM_PHOTOS.mountain, ['Fireplace', 'Heated shower']),
      room('pinetop-family', 'Family Loft', 7800, 5, 4, 48, '1 queen + 3 single beds', 'Forest view', ROOM_PHOTOS.queen, ['Loft', 'Fireplace']),
    ],
  },
  {
    id: 'panglao-palm',
    name: 'Panglao Palm Villas',
    city: 'Bohol',
    area: 'Alona · Panglao, Bohol',
    address: 'Alona Beach Rd., Tawala, Panglao, Bohol',
    stars: 4,
    rating: 8.9,
    reviews: 890,
    position: [9.5491, 123.7745],
    image: unsplash('1571896349842-33c89424de2d', 'Villa pool at Panglao Palm Villas'),
    gallery: [ROOM_PHOTOS.garden, ROOM_PHOTOS.villa],
    summary: 'Pool villas a short walk from Alona Beach.',
    about: 'Private-feeling villas around a lagoon pool, with dive trips and Chocolate Hills tours from the desk.',
    amenities: ['pool', 'spa', 'restaurant', 'wifi', 'breakfast', 'airport-transfer', 'family'],
    roomTypes: [
      room('panglao-deluxe', 'Deluxe Garden Room', 6400, 2, 2, 32, '1 king bed', 'Garden view', ROOM_PHOTOS.garden, ['Terrace', 'Rain shower']),
      room('panglao-villa', 'Pool Villa', 12500, 3, 2, 60, '1 king bed + daybed', 'Pool view', ROOM_PHOTOS.villa, ['Pool access', 'Outdoor shower']),
    ],
  },
  {
    id: 'ridgeline-tagaytay',
    name: 'Ridgeline Hotel',
    city: 'Tagaytay',
    area: 'Tagaytay Ridge · Cavite',
    address: 'Aguinaldo Hwy., Tagaytay City, Cavite',
    stars: 4,
    rating: 8.5,
    reviews: 1420,
    position: [14.1106, 120.9571],
    image: unsplash('1542314831-068cd1dbfeeb', 'Ridgeline Hotel pool in the evening'),
    gallery: [ROOM_PHOTOS.suite, ROOM_PHOTOS.twin],
    summary: 'Taal Lake views and cool air, an hour from Manila.',
    about: 'Rooms facing Taal volcano, a heated pool and a bulalo restaurant for the drive back.',
    amenities: ['pool', 'restaurant', 'wifi', 'breakfast', 'parking', 'family'],
    roomTypes: [
      room('ridgeline-deluxe', 'Deluxe Lake View', 5800, 2, 2, 30, '1 king bed', 'Taal Lake view', ROOM_PHOTOS.suite, ['Balcony']),
      room('ridgeline-family', 'Family Suite', 8900, 5, 4, 50, '1 king + 2 single beds', 'Taal Lake view', ROOM_PHOTOS.twin, ['Sitting area', 'Balcony']),
    ],
  },
];

export const findStayHotel = (id?: string) => STAY_HOTELS.find((hotel) => hotel.id === id);

/**
 * A place's picture: a partner outside the estate where there is one, so the
 * destination tiles do not repeat the Henry photographs listed beneath them.
 * None for "anywhere".
 */
export function locationImage(label: string): StayImage | undefined {
  if (label === ANYWHERE) return undefined;
  const inCity = STAY_HOTELS.filter((hotel) => hotel.city === label);
  return (inCity.find((hotel) => !hotel.henry) ?? inCity[0])?.image;
}

export const RATE_PLAN_LABELS: Record<RatePlanId, { title: string; detail: string }> = {
  flex: { title: 'Room only', detail: 'Free cancellation' },
  'flex-breakfast': { title: 'With breakfast', detail: 'Free cancellation' },
  saver: { title: 'Room only · Saver', detail: 'Non-refundable · save 15%' },
};

/** Breakfast is a flat add-on per room, for as many as it sleeps. */
export const BREAKFAST_PER_GUEST = 600;
export const SAVER_DISCOUNT = 0.15;
export const VAT_RATE = 0.12;
export const SERVICE_RATE = 0.1;
export const MAX_NIGHTS = 30;
export const MAX_ADULTS = 12;
export const MAX_CHILDREN = 8;
export const FREE_CANCELLATION_DAYS = 3;

export const DEFAULT_STAY_SEARCH: StaySearch = {
  location: ANYWHERE,
  checkIn: '2026-12-11',
  checkOut: '2026-12-14',
  adults: 2,
  childAges: [],
};

/* ---------- dates ---------- */

const DAY = 86_400_000;
const toDay = (iso: string) => Math.floor(Date.parse(`${iso}T00:00:00Z`) / DAY);
const fromDay = (day: number) => new Date(day * DAY).toISOString().slice(0, 10);
export const addDays = (iso: string, days: number) => fromDay(toDay(iso) + days);

/** The nights of a stay, as the ISO date each night starts on. */
export function stayNights(checkIn: string, checkOut: string): string[] {
  const count = countNightsBetween(checkIn, checkOut);
  return Array.from({ length: count }, (_, i) => addDays(checkIn, i));
}

const isWeekendNight = (iso: string) => {
  const weekday = new Date(`${iso}T00:00:00Z`).getUTCDay();
  return weekday === 5 || weekday === 6;
};

/** Is this a search the flow can quote? */
export function validSearchDates(search: Pick<StaySearch, 'checkIn' | 'checkOut'>, today = PROTOTYPE_TODAY): boolean {
  const nights = countNightsBetween(search.checkIn, search.checkOut);
  return search.checkIn > today && nights >= 1 && nights <= MAX_NIGHTS;
}

/* ---------- availability ---------- */

/** FNV-1a: a stable pseudo-random number per key, so availability never flickers. */
function hash(key: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/*
  The default search dates are always open: the demo path opens on them, and
  a stakeholder walk-through that lands on "sold out" proves nothing.
*/
const DEMO_NIGHTS = new Set(stayNights(DEFAULT_STAY_SEARCH.checkIn, DEFAULT_STAY_SEARCH.checkOut));

/** Nights the whole hotel is full. Roughly one in twelve. */
export function isHotelFull(hotelId: string, night: string): boolean {
  return !DEMO_NIGHTS.has(night) && hash(`${hotelId}|full|${night}`) % 12 === 0;
}

/** Rooms of one class left on one night: 0–6. */
/**
 * Rooms this app has already sold, per hotel, room class and night. The mock
 * inventory is fixed, so without this the last King Room stayed "Only 1 left"
 * after the guest bought it. Keyed `hotel|room class|night`.
 */
export type HeldRooms = Record<string, number>;
export const NO_HELD_ROOMS: HeldRooms = {};

export function heldRooms(bookings: { checkIn: string; checkOut: string; reservation?: Reservation }[]): HeldRooms {
  const held: HeldRooms = {};
  for (const booking of bookings) {
    const reservation = booking.reservation;
    if (!reservation) continue;
    for (const room of reservation.rooms) {
      for (const night of stayNights(booking.checkIn, booking.checkOut)) {
        const key = `${reservation.hotelId}|${room.roomTypeId}|${night}`;
        held[key] = (held[key] ?? 0) + 1;
      }
    }
  }
  return held;
}

export function roomsLeftOnNight(hotelId: string, roomTypeId: string, night: string, held: HeldRooms = NO_HELD_ROOMS): number {
  return Math.max(0, inventoryOnNight(hotelId, roomTypeId, night) - (held[`${hotelId}|${roomTypeId}|${night}`] ?? 0));
}

function inventoryOnNight(hotelId: string, roomTypeId: string, night: string): number {
  if (isHotelFull(hotelId, night)) return 0;
  const roll = hash(`${hotelId}|${roomTypeId}|${night}`) % 20;
  const left = roll === 0 ? 0 : roll <= 2 ? 1 : roll <= 4 ? 2 : roll <= 6 ? 3 : 4 + (roll % 3);
  return DEMO_NIGHTS.has(night) ? Math.max(left, 2) : left;
}

/** Rooms of one class bookable for a whole stay: the tightest night decides. */
export function roomsLeft(hotelId: string, roomTypeId: string, checkIn: string, checkOut: string, held: HeldRooms = NO_HELD_ROOMS): number {
  const nights = stayNights(checkIn, checkOut);
  if (!nights.length) return 0;
  return Math.min(...nights.map((night) => roomsLeftOnNight(hotelId, roomTypeId, night, held)));
}

/* ---------- prices ---------- */

const round10 = (value: number) => Math.round(value / 10) * 10;

/** One room, one night, before taxes. */
export function nightlyRate(roomType: StayRoomType, plan: RatePlanId, night: string): number {
  const rack = round10(roomType.base * (isWeekendNight(night) ? 1.15 : 1));
  if (plan === 'saver') return round10(rack * (1 - SAVER_DISCOUNT));
  if (plan === 'flex-breakfast') return rack + BREAKFAST_PER_GUEST * roomType.sleeps;
  return rack;
}

/** One room for the whole stay, before taxes. */
export function stayRate(roomType: StayRoomType, plan: RatePlanId, checkIn: string, checkOut: string): number {
  return stayNights(checkIn, checkOut).reduce((sum, night) => sum + nightlyRate(roomType, plan, night), 0);
}

export const peso = (amount: number) => formatPesoAmount(Math.round(amount));

export type RoomOffer = {
  roomType: StayRoomType;
  left: number;
  plans: { id: RatePlanId; total: number; perNight: number; refundable: boolean }[];
};

/**
 * Whether free cancellation is still on offer for this check-in: it ends
 * three days before, so a stay starting sooner is non-refundable whatever
 * the rate says.
 */
export const cancellationOpen = (checkIn: string, today = PROTOTYPE_TODAY) => addDays(checkIn, -FREE_CANCELLATION_DAYS) >= today;

export type RoomCancellationReason = 'free' | 'saver' | 'ended' | 'stay-started';
export type RoomCancellationPolicy = { refundable: boolean; until?: string; reason: RoomCancellationReason };

export const cancellationDeadline = (checkIn: string) => checkIn ? addDays(checkIn, -FREE_CANCELLATION_DAYS) : undefined;

function cancellationPolicyUntil(ratePlanId: RatePlanId, until: string | undefined, today: string): RoomCancellationPolicy {
  if (ratePlanId === 'saver') return { refundable: false, until, reason: 'saver' };
  if (!until || today > until) return { refundable: false, until, reason: 'ended' };
  return { refundable: true, until, reason: 'free' };
}

/** The cancellation terms for a rate selected on these dates. */
export function roomCancellationPolicy(ratePlanId: RatePlanId, checkIn: string, today = PROTOTYPE_TODAY): RoomCancellationPolicy {
  return cancellationPolicyUntil(ratePlanId, cancellationDeadline(checkIn), today);
}

export function roomOffers(hotel: StayHotel, search: StaySearch, held: HeldRooms = NO_HELD_ROOMS): RoomOffer[] {
  const nights = Math.max(1, countNightsBetween(search.checkIn, search.checkOut));
  const open = cancellationOpen(search.checkIn);
  return hotel.roomTypes.map((roomType) => ({
    roomType,
    left: roomsLeft(hotel.id, roomType.id, search.checkIn, search.checkOut, held),
    /*
      Inside three days nothing is refundable, so room-only at the flexible
      price would cost more for nothing: only the Saver is offered then.
      Breakfast stays, since it still buys breakfast.
    */
    plans: roomType.plans.filter((id) => open || id !== 'flex' || !roomType.plans.includes('saver')).map((id) => {
      const total = stayRate(roomType, id, search.checkIn, search.checkOut);
      return { id, total, perNight: round10(total / nights), refundable: roomCancellationPolicy(id, search.checkIn).refundable };
    }),
  }));
}

/** The cheapest open rate per night on these dates, or undefined when the hotel is full. */
export function fromPrice(hotel: StayHotel, search: StaySearch, held: HeldRooms = NO_HELD_ROOMS): number | undefined {
  const open = roomOffers(hotel, search, held).filter((offer) => offer.left > 0);
  if (!open.length) return undefined;
  return Math.min(...open.flatMap((offer) => offer.plans.map((plan) => plan.perNight)));
}

/* ---------- party and capacity ---------- */

export type Party = { leads: number; sixPlus: number; underSix: number; total: number };

/** Children 12+ count as adults for room limits; under-6s ride free. */
export function describeParty(adults: number, childAges: number[]): Party {
  const teens = childAges.filter((age) => age >= 12).length;
  const underSix = childAges.filter((age) => age < 6).length;
  return { leads: adults + teens, sixPlus: adults + childAges.length - underSix, underSix, total: adults + childAges.length };
}

export const partyLabel = (search: Pick<StaySearch, 'adults' | 'childAges'>) => {
  const adults = `${search.adults} ${search.adults === 1 ? 'adult' : 'adults'}`;
  const children = search.childAges.length;
  return children ? `${adults}, ${children} ${children === 1 ? 'child' : 'children'}` : adults;
};

/** The cart as individual rooms, in cart order. */
export function cartRooms(hotel: StayHotel, cart: CartLine[]): { roomType: StayRoomType; ratePlanId: RatePlanId }[] {
  return cart.flatMap((line) => {
    const roomType = hotel.roomTypes.find((item) => item.id === line.roomTypeId);
    return roomType ? Array.from({ length: line.quantity }, () => ({ roomType, ratePlanId: line.ratePlanId })) : [];
  });
}

export type CartFit = { rooms: number; fits: boolean; message: string };

export function cartFit(hotel: StayHotel, search: StaySearch, cart: CartLine[]): CartFit {
  const rooms = cartRooms(hotel, cart);
  const party = describeParty(search.adults, search.childAges);
  const guests = `${party.total} ${party.total === 1 ? 'guest' : 'guests'}`;
  if (!rooms.length) return { rooms: 0, fits: false, message: `Pick rooms for ${guests}` };
  if (rooms.length > party.leads) {
    return { rooms: rooms.length, fits: false, message: `More rooms than guests aged 12+. Remove ${rooms.length - party.leads === 1 ? 'a room' : `${rooms.length - party.leads} rooms`}.` };
  }
  const sleeps = rooms.reduce((sum, item) => sum + item.roomType.sleeps, 0);
  const leadRoom = rooms.reduce((sum, item) => sum + item.roomType.maxAdults, 0);
  const fitsSixPlus = sleeps >= party.sixPlus && leadRoom >= party.leads;
  const fitsUnderSix = party.underSix <= rooms.length * 2;
  if (!fitsSixPlus || !fitsUnderSix) {
    const placed = Math.min(party.total, Math.min(sleeps, party.sixPlus) + Math.min(party.underSix, rooms.length * 2));
    return { rooms: rooms.length, fits: false, message: `${placed} of ${party.total} fit · add a room` };
  }
  return { rooms: rooms.length, fits: true, message: `Fits your ${guests}` };
}

type RoomLoad = { leads: number; sixPlus: number; underSix: number };

function loadOf(allocation: RoomAllocation, childAges: number[]): RoomLoad {
  const ages = allocation.childIndexes.map((index) => childAges[index] ?? 0);
  const teens = ages.filter((age) => age >= 12).length;
  const underSix = ages.filter((age) => age < 6).length;
  return { leads: allocation.adults + teens, sixPlus: allocation.adults + ages.length - underSix, underSix };
}

/**
 * A first split that usually needs no editing: one lead per room, then the
 * rest of the adults, then children oldest first, each into the first room
 * with space. Anyone who fits nowhere lands in the first room, where
 * `validateAllocation` flags it.
 */
export function defaultAllocation(hotel: StayHotel, search: StaySearch, cart: CartLine[]): RoomAllocation[] {
  const rooms = cartRooms(hotel, cart);
  const split: RoomAllocation[] = rooms.map(() => ({ adults: 0, childIndexes: [] }));
  if (!rooms.length) return split;
  const load = (i: number) => loadOf(split[i]!, search.childAges);
  let adults = search.adults;
  for (let i = 0; i < rooms.length && adults > 0; i++) {
    split[i]!.adults++;
    adults--;
  }
  // Spread the rest where the lead limit allows, roomiest first.
  while (adults > 0) {
    const i = rooms.findIndex((item, index) => load(index).leads < item.roomType.maxAdults && load(index).sixPlus < item.roomType.sleeps);
    const target = i >= 0 ? i : 0;
    split[target]!.adults++;
    adults--;
  }
  const children = search.childAges.map((age, index) => ({ age, index })).sort((a, b) => b.age - a.age);
  for (const child of children) {
    const fits = (i: number) => {
      const current = load(i);
      const roomType = rooms[i]!.roomType;
      if (child.age < 6) return current.underSix < 2;
      if (child.age >= 12) return current.leads < roomType.maxAdults && current.sixPlus < roomType.sleeps;
      return current.sixPlus < roomType.sleeps;
    };
    // A room with no lead yet takes a teen first, so every room has one.
    const needsLead = child.age >= 12 ? rooms.findIndex((_, i) => load(i).leads === 0 && fits(i)) : -1;
    const i = needsLead >= 0 ? needsLead : rooms.findIndex((_, index) => fits(index));
    split[i >= 0 ? i : 0]!.childIndexes.push(child.index);
  }
  return split;
}

export type AllocationCheck = { ok: boolean; roomErrors: (string | null)[]; summary?: string };

export function validateAllocation(hotel: StayHotel, search: StaySearch, cart: CartLine[], allocation: RoomAllocation[]): AllocationCheck {
  const rooms = cartRooms(hotel, cart);
  const roomErrors = rooms.map((item, i) => {
    const current = loadOf(allocation[i] ?? { adults: 0, childIndexes: [] }, search.childAges);
    const { roomType } = item;
    if (current.leads === 0) return 'Needs a guest aged 12 or over';
    if (current.leads > roomType.maxAdults) return `Takes up to ${roomType.maxAdults} guests aged 12 or over`;
    if (current.sixPlus > roomType.sleeps) return `Up to ${roomType.sleeps} guests aged 6 or older; children under 6 don't count toward this limit`;
    if (current.underSix > 2) return 'Takes at most 2 children under 6';
    return null;
  });
  const placedAdults = allocation.reduce((sum, item) => sum + item.adults, 0);
  const placedChildren = new Set(allocation.flatMap((item) => item.childIndexes));
  let summary: string | undefined;
  if (placedAdults !== search.adults) {
    summary = placedAdults < search.adults
      ? `Place all ${search.adults} adults: ${placedAdults} placed so far.`
      : `${placedAdults} adults placed, but the search is for ${search.adults}.`;
  } else if (placedChildren.size !== search.childAges.length) {
    summary = 'Choose a room for every child.';
  } else if (roomErrors.some(Boolean)) {
    summary = 'Fix the rooms marked above to continue.';
  }
  return { ok: !summary, roomErrors, summary };
}

/* ---------- quote ---------- */

export type Promo = {
  label: string;
  /** The offer as a guest reads it on a card. */
  title: string;
  terms: string;
  apply: (subtotal: number) => number;
  /** Why this stay does not qualify, or undefined when it does. */
  /** With no hotel (results, Home), only the rules about the stay itself are checked. */
  rejects?: (hotel: StayHotel | undefined, nights: number) => string | undefined;
  /** Why this guest cannot use it, whatever the stay. */
  refuses?: (account: PromoAccount) => string | undefined;
};

/**
 * What a code needs to know about the guest. `firstBooking` is whether they
 * have never paid for a stay in the app; a real account would have the
 * backend say so, since bookings made elsewhere count too.
 */
export type PromoAccount = { firstBooking: boolean };
export const NEW_ACCOUNT: PromoAccount = { firstBooking: true };

/** A first booking until any stay has been paid for in the app -- a cancelled one included, since the code was used. */
export function promoAccountFor(session: { bookings: { reservation?: unknown }[]; payments?: { kind: string }[] }): PromoAccount {
  return { firstBooking: !session.bookings.some((item) => item.reservation) && !(session.payments ?? []).some((payment) => payment.kind === 'stay') };
}

export const PROMO_CODES: Record<string, Promo> = {
  CABANA10: { label: '10% off rooms', title: '10% off any partner hotel', terms: 'Room rates only. Any dates.', apply: (subtotal) => Math.round(subtotal * 0.1) },
  WELCOME500: {
    label: '₱500 off',
    title: '₱500 off your first booking',
    terms: 'Your first stay booked in the app.',
    apply: (subtotal) => Math.min(500, subtotal),
    refuses: (account) => (account.firstBooking ? undefined : 'WELCOME500 is for your first booking in the app.'),
  },
  HENRY15: {
    label: '15% off rooms',
    title: '15% off 3+ nights at The Henry',
    terms: 'The Henry Manila, Cebu and Dumaguete. Stays of 3 nights or more.',
    apply: (subtotal) => Math.round(subtotal * 0.15),
    rejects: (hotel, nights) => (hotel && !hotel.henry ? 'HENRY15 is for The Henry’s own hotels.' : nights < 3 ? 'HENRY15 needs a stay of 3 nights or more.' : undefined),
  },
};

export type VoucherOption = { code: string; promo: Promo; unavailableReason?: string };

const promoUnavailableReason = (promo: Promo, hotel: StayHotel | undefined, nights: number, account: PromoAccount) =>
  promo.refuses?.(account) ?? promo.rejects?.(hotel, nights);

/** The checkout voucher list, including offers that do not qualify for this guest or stay. */
export function voucherOptionsFor(hotel: StayHotel | undefined, nights: number, account: PromoAccount = NEW_ACCOUNT): VoucherOption[] {
  return Object.entries(PROMO_CODES).map(([code, promo]) => {
    const unavailableReason = promoUnavailableReason(promo, hotel, nights, account);
    return { code, promo, ...(unavailableReason ? { unavailableReason } : {}) };
  });
}

/** The offers a stay qualifies for, best first -- what checkout suggests without the guest knowing a code. */
export function offersFor(hotel: StayHotel | undefined, nights: number, account: PromoAccount = NEW_ACCOUNT): { code: string; promo: Promo }[] {
  return voucherOptionsFor(hotel, nights, account)
    .filter((option) => !option.unavailableReason)
    .map(({ code, promo }) => ({ code, promo }));
}

export const normalizePromo = (code: string) => code.trim().toUpperCase();

export type StayQuote = {
  nights: number;
  lines: { roomTypeId: string; roomName: string; ratePlanId: RatePlanId; quantity: number; total: number }[];
  subtotal: number;
  discount: number;
  promo?: { code: string; label: string };
  promoError?: string;
  vat: number;
  service: number;
  total: number;
  refundable: boolean;
  freeCancellationUntil?: string;
};

export function quoteStay(hotel: StayHotel, search: StaySearch, cart: CartLine[], promoCode = '', account: PromoAccount = NEW_ACCOUNT): StayQuote {
  const nights = countNightsBetween(search.checkIn, search.checkOut);
  const lines = cart.flatMap((line) => {
    const roomType = hotel.roomTypes.find((item) => item.id === line.roomTypeId);
    if (!roomType || line.quantity < 1) return [];
    return [{ roomTypeId: roomType.id, roomName: roomType.name, ratePlanId: line.ratePlanId, quantity: line.quantity, total: stayRate(roomType, line.ratePlanId, search.checkIn, search.checkOut) * line.quantity }];
  });
  const subtotal = lines.reduce((sum, line) => sum + line.total, 0);
  const code = normalizePromo(promoCode);
  const known = code ? PROMO_CODES[code] : undefined;
  const rejection = known ? promoUnavailableReason(known, hotel, nights, account) : undefined;
  const promo = rejection ? undefined : known;
  const discount = promo ? promo.apply(subtotal) : 0;
  const taxable = subtotal - discount;
  const vat = Math.round(taxable * VAT_RATE);
  const service = Math.round(taxable * SERVICE_RATE);
  const freeCancellationUntil = lines.length > 0 && search.checkIn ? addDays(search.checkIn, -FREE_CANCELLATION_DAYS) : undefined;
  const refundable = lines.length > 0 && lines.every((line) => roomCancellationPolicy(line.ratePlanId, search.checkIn).refundable);
  return {
    nights,
    lines,
    subtotal,
    discount,
    promo: promo ? { code, label: promo.label } : undefined,
    promoError: code && !promo ? (rejection ?? 'That code isn’t valid.') : undefined,
    vat,
    service,
    total: taxable + vat + service,
    refundable,
    freeCancellationUntil,
  };
}

/* ---------- search ---------- */

export type StaySort = 'recommended' | 'price' | 'rating' | 'distance';
export type PriceBand = 'under-5000' | '5000-10000' | 'over-10000';
export type StayFilters = { price: PriceBand[]; stars: number[]; amenities: Amenity[]; freeCancellation: boolean };
export const NO_FILTERS: StayFilters = { price: [], stars: [], amenities: [], freeCancellation: false };

export const PRICE_BANDS: Record<PriceBand, { label: string; test: (price: number) => boolean }> = {
  'under-5000': { label: 'Under ₱5,000', test: (price) => price < 5000 },
  '5000-10000': { label: '₱5,000–10,000', test: (price) => price >= 5000 && price <= 10000 },
  'over-10000': { label: 'Over ₱10,000', test: (price) => price > 10000 },
};

export const countFilters = (filters: StayFilters) =>
  filters.price.length + filters.stars.length + filters.amenities.length + (filters.freeCancellation ? 1 : 0);

export const findLocation = (label: string) => STAY_LOCATIONS.find((location) => location.label.toLowerCase() === label.trim().toLowerCase());

/** Kilometres between two points, near enough for "1.4 km from the centre". */
function distanceKm(a: [number, number], b: [number, number]): number {
  const rad = Math.PI / 180;
  const dLat = (b[0] - a[0]) * rad;
  const dLng = (b[1] - a[1]) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a[0] * rad) * Math.cos(b[0] * rad) * Math.sin(dLng / 2) ** 2;
  return 12_742 * Math.asin(Math.sqrt(h));
}

/** Which hotels a typed location means: a known place, a hotel's name, or any part of an area. */
export function hotelsForLocation(location: string): StayHotel[] {
  const query = location.trim().toLowerCase();
  if (!query || query === ANYWHERE.toLowerCase()) return STAY_HOTELS;
  const place = findLocation(location);
  if (place) return STAY_HOTELS.filter((hotel) => hotel.city === place.label);
  return STAY_HOTELS.filter((hotel) => matchesWords([hotel.name, hotel.city, hotel.area, hotel.address].join(' '), query));
}

/**
 * Typed text as a place the search knows: an exact place or hotel stays
 * itself; otherwise the first place, then the first hotel, whose words match.
 * Unmatched text is kept, so the empty state can name it.
 */
export function resolveLocation(text: string): string {
  const typed = text.trim();
  if (!typed || typed.toLowerCase() === ANYWHERE.toLowerCase()) return ANYWHERE;
  if (findLocation(typed) || STAY_HOTELS.some((hotel) => hotel.name.toLowerCase() === typed.toLowerCase())) return typed;
  return STAY_LOCATIONS.find((place) => place.label !== ANYWHERE && matchesWords(`${place.label} ${place.detail}`, typed))?.label
    ?? STAY_HOTELS.find((hotel) => matchesWords(`${hotel.name} ${hotel.area}`, typed))?.name
    ?? typed;
}

/** Every typed word appears somewhere, in any order: "henry cebu" finds The Henry Hotel Cebu. */
export function matchesWords(haystack: string, query: string): boolean {
  const text = haystack.toLowerCase();
  return query.toLowerCase().split(/\s+/).filter(Boolean).every((word) => text.includes(word));
}

export type HotelResult = {
  hotel: StayHotel;
  fromPrice?: number;
  /** The cheapest open room for the whole stay, before taxes -- what "from" adds up to. */
  fromTotal?: number;
  /** From the searched place's centre, when the search named one. */
  distanceKm?: number;
  freeCancellation: boolean;
  /** The "from" price is itself a refundable rate -- else free cancellation costs more than it. */
  cheapestRefundable: boolean;
  /** The cheapest refundable rate per night, when there is one. */
  fromRefundable?: number;
  /** No room class is open for the whole stay. */
  soldOut: boolean;
  /** The largest party one booking could hold -- is this hotel even worth opening? */
  fitsParty: boolean;
};

const refundableFrom = (offers: RoomOffer[]) => {
  const prices = offers.flatMap((offer) => offer.plans.filter((plan) => plan.refundable).map((plan) => plan.perNight));
  return prices.length ? Math.min(...prices) : undefined;
};

export function searchHotels(search: StaySearch, filters: StayFilters = NO_FILTERS, sort: StaySort = 'recommended', held: HeldRooms = NO_HELD_ROOMS): HotelResult[] {
  const center = findLocation(search.location)?.center;
  const party = describeParty(search.adults, search.childAges);
  const results = hotelsForLocation(search.location).map((hotel): HotelResult => {
    const offers = roomOffers(hotel, search, held).filter((offer) => offer.left > 0);
    const capacity = offers.reduce((sum, offer) => sum + offer.left * offer.roomType.sleeps, 0);
    return {
      hotel,
      // With the free-cancellation filter on, the price shown is the refundable one: what that guest would pay.
      fromPrice: filters.freeCancellation ? refundableFrom(offers) : fromPrice(hotel, search, held),
      fromRefundable: refundableFrom(offers),
      // The same rates as the per-night price, so the two lines agree.
      fromTotal: (() => {
        const totals = offers.flatMap((offer) => offer.plans.filter((plan) => !filters.freeCancellation || plan.refundable).map((plan) => plan.total));
        return totals.length ? Math.min(...totals) : undefined;
      })(),
      distanceKm: center ? Math.round(distanceKm(center, hotel.position) * 10) / 10 : undefined,
      freeCancellation: offers.some((offer) => offer.plans.some((plan) => plan.refundable)),
      cheapestRefundable: (() => {
        const plans = offers.flatMap((offer) => offer.plans);
        const cheapest = plans.reduce<(typeof plans)[number] | undefined>((best, plan) => (!best || plan.perNight < best.perNight ? plan : best), undefined);
        return filters.freeCancellation || Boolean(cheapest?.refundable);
      })(),
      soldOut: offers.length === 0,
      fitsParty: capacity >= party.sixPlus,
    };
  });
  const filtered = results.filter((result) => {
    if (filters.price.length && (result.fromPrice === undefined || !filters.price.some((band) => PRICE_BANDS[band].test(result.fromPrice!)))) return false;
    if (filters.stars.length && !filters.stars.includes(result.hotel.stars)) return false;
    if (filters.amenities.some((amenity) => !result.hotel.amenities.includes(amenity))) return false;
    if (filters.freeCancellation && !result.freeCancellation) return false;
    return true;
  });
  const available = (result: HotelResult) => (result.soldOut ? 1 : 0);
  const order: Record<StaySort, (a: HotelResult, b: HotelResult) => number> = {
    // Open hotels first, partner hotels of the estate next, then by rating.
    recommended: (a, b) => available(a) - available(b) || Number(Boolean(b.hotel.henry)) - Number(Boolean(a.hotel.henry)) || b.hotel.rating - a.hotel.rating,
    price: (a, b) => available(a) - available(b) || (a.fromPrice ?? Infinity) - (b.fromPrice ?? Infinity),
    rating: (a, b) => b.hotel.rating - a.hotel.rating,
    distance: (a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity),
  };
  return [...filtered].sort(order[sort]);
}

/* ---------- the booking ---------- */

/**
 * "CAB-" and six characters, derived from the draft so a replay gives the
 * same reference -- unless that reference is taken, as it is when the same
 * rooms and dates are booked twice: then the next free one.
 */
export function reservationReference(hotelId: string, search: StaySearch, cart: CartLine[], paidAt: string, taken: readonly string[] = []): string {
  for (let attempt = 0; ; attempt++) {
    const reference = `CAB-${hash(`${hotelId}|${JSON.stringify(search)}|${JSON.stringify(cart)}|${paidAt}${attempt ? `|${attempt}` : ''}`).toString(36).toUpperCase().slice(0, 6).padStart(6, '0')}`;
    if (!taken.includes(reference)) return reference;
  }
}

export function describeRooms(rooms: { roomName: string }[]): string {
  const counts = new Map<string, number>();
  for (const item of rooms) counts.set(item.roomName, (counts.get(item.roomName) ?? 0) + 1);
  return [...counts].map(([name, count]) => (count > 1 ? `${count} × ${name}` : name)).join(' + ');
}

export function bookingFromDraft({ hotel, search, cart, allocation, details, quote, paidWith, paidAt, taken }: {
  hotel: StayHotel;
  search: StaySearch;
  cart: CartLine[];
  allocation: RoomAllocation[];
  details: StayGuestDetails;
  quote: StayQuote;
  paidWith: string;
  paidAt: string;
  /** References already used on this account, booked or cancelled. */
  taken?: readonly string[];
}): Booking {
  const reference = reservationReference(hotel.id, search, cart, paidAt, taken);
  const stayRates = cartRooms(hotel, cart).map((item) => stayRate(item.roomType, item.ratePlanId, search.checkIn, search.checkOut));
  const rateTotal = stayRates.reduce((sum, rate) => sum + rate, 0) || 1;
  // Each room's share, the rounding left over going to the last so the shares add up to what was paid.
  const shares = stayRates.map((rate) => Math.round((quote.total * rate) / rateTotal));
  if (shares.length) shares[shares.length - 1]! += quote.total - shares.reduce((sum, share) => sum + share, 0);
  const rooms = cartRooms(hotel, cart).map((item, i) => ({
    id: `${reference}-room-${i + 1}`,
    amount: shares[i]!,
    roomTypeId: item.roomType.id,
    roomName: item.roomType.name,
    ratePlanId: item.ratePlanId,
    leadGuest: details.roomLeads[i]?.trim() || details.name,
    adults: allocation[i]?.adults ?? 0,
    children: allocation[i]?.childIndexes.length ?? 0,
  }));
  return {
    id: reference,
    guestName: details.name,
    property: hotel.name,
    city: hotel.city,
    status: 'upcoming',
    checkIn: search.checkIn,
    checkOut: search.checkOut,
    roomType: describeRooms(rooms),
    arrivalTime: details.arrivalTime,
    specialRequests: details.requests.trim() || undefined,
    guestCount: search.adults + search.childAges.length,
    source: 'Cabana app',
    preArrivalCompleted: 0,
    preArrivalTotal: 2,
    nextPreArrivalStep: 'Confirm your details',
    roomAssignment: 'pending',
    roomRate: peso(quote.total),
    reservation: {
      reference,
      hotelId: hotel.id,
      rooms,
      total: quote.total,
      paidWith,
      paidAt,
      refundable: quote.refundable,
      freeCancellationUntil: quote.freeCancellationUntil,
      receipt: details.receipt?.company.trim() ? details.receipt : undefined,
      promo: quote.promo && quote.discount ? { ...quote.promo, discount: quote.discount } : undefined,
    },
  };
}

/** A direct Cabana booking can be cancelled while it is still upcoming. Each room's refund follows its own rate terms. */
export function canCancelReservation(booking: Booking, today = PROTOTYPE_TODAY): boolean {
  const reservation = booking.reservation;
  return Boolean(reservation?.rooms.length && booking.status === 'upcoming' && today <= booking.checkIn);
}

/** The paid share for each active room, including taxes and vouchers. */
export function roomRefunds(reservation: Reservation): number[] {
  const missing = reservation.rooms.reduce((count, room) => count + (room.amount === undefined ? 1 : 0), 0);
  const known = reservation.rooms.reduce((sum, room) => sum + (room.amount === undefined ? 0 : Math.max(0, Math.round(room.amount))), 0);
  const remainder = Math.max(0, Math.round(reservation.total) - known);
  const base = missing ? Math.floor(remainder / missing) : 0;
  let left = remainder - base * missing;
  return reservation.rooms.map((room) => {
    if (room.amount !== undefined) return Math.max(0, Math.round(room.amount));
    const share = base + (left > 0 ? 1 : 0);
    if (left > 0) left -= 1;
    return share;
  });
}

/** Room labels stay tied to the original booking after another room is cancelled. */
export function bookedRoomNumber(room: Reservation['rooms'][number], index: number): number {
  const fromId = room.id?.match(/-room-(\d+)$/)?.[1];
  return fromId ? Number(fromId) : index + 1;
}

export type RoomCancellationTerms = RoomCancellationPolicy & { amount: number; refund: number };

/** The rate-specific refund for one room in an upcoming Cabana booking. */
export function roomCancellationTerms(booking: Booking, roomIndex: number, today = PROTOTYPE_TODAY): RoomCancellationTerms | undefined {
  const reservation = booking.reservation;
  const room = reservation?.rooms[roomIndex];
  if (!reservation || !room) return undefined;
  const until = reservation.freeCancellationUntil ?? cancellationDeadline(booking.checkIn);
  const policy = cancellationPolicyUntil(room.ratePlanId, until, today);
  const upcoming = booking.status === 'upcoming' && today <= booking.checkIn;
  const refundable = policy.refundable && upcoming;
  const reason = upcoming ? policy.reason : 'stay-started';
  const amount = roomRefunds(reservation)[roomIndex] ?? 0;
  return { refundable, until, reason, amount, refund: refundable ? amount : 0 };
}

/** Aggregate cancellation status without hiding mixed rate terms. */
export function bookingCancellationSummary(booking: Booking, today = PROTOTYPE_TODAY): { totalRooms: number; refundableRooms: number; until?: string } {
  const reservation = booking.reservation;
  const terms = reservation?.rooms.map((_, index) => roomCancellationTerms(booking, index, today)) ?? [];
  return {
    totalRooms: terms.length,
    refundableRooms: terms.filter((term) => term?.refundable).length,
    until: reservation?.freeCancellationUntil ?? cancellationDeadline(booking.checkIn),
  };
}

/**
 * The booking after cancelling some of its rooms: the rest stay booked, the
 * total and the party shrink by what left. Cancelling every room is a full
 * cancellation, which the caller handles by removing the booking instead.
 */
export function cancelRooms(booking: Booking, indexes: number[], today = PROTOTYPE_TODAY): { booking: Booking; refund: number; cancelledAmount: number; retainedAmount: number; roomIds: string[] } {
  const reservation = booking.reservation;
  if (!reservation) return { booking, refund: 0, cancelledAmount: 0, retainedAmount: 0, roomIds: [] };
  const chosen = [...new Set(indexes.filter((index) => Number.isInteger(index) && index >= 0 && index < reservation.rooms.length))];
  if (!chosen.length) return { booking, refund: 0, cancelledAmount: 0, retainedAmount: 0, roomIds: [] };
  const refunds = roomRefunds(reservation);
  const drop = new Set(chosen);
  const refund = chosen.reduce((sum, index) => sum + (roomCancellationTerms(booking, index, today)?.refund ?? 0), 0);
  const cancelledAmount = chosen.reduce((sum, index) => sum + (refunds[index] ?? 0), 0);
  const retainedAmount = Math.max(0, cancelledAmount - refund);
  const roomsWithAmounts = reservation.rooms.map((room, index) => ({
    ...room,
    id: room.id ?? `${reservation.reference}-room-${index + 1}`,
    amount: refunds[index] ?? 0,
  }));
  const rooms = roomsWithAmounts.filter((_, index) => !drop.has(index));
  const cancelledRooms = roomsWithAmounts.filter((_, index) => drop.has(index));
  const leaving = cancelledRooms.reduce((sum, room) => sum + room.adults + room.children, 0);
  const guestCount = Math.max(1, booking.guestCount - leaving);
  const companions = booking.companions?.filter((name) => (
    !cancelledRooms.some((room) => room.leadGuest.trim().toLowerCase() === name.trim().toLowerCase())
    || rooms.some((room) => room.leadGuest.trim().toLowerCase() === name.trim().toLowerCase())
  )).slice(0, guestCount - 1);
  const total = rooms.reduce((sum, room) => sum + (room.amount ?? 0), 0);
  const nextReservation: Reservation = {
    ...reservation,
    rooms,
    total,
    refundable: rooms.length > 0 && booking.status === 'upcoming' && today <= booking.checkIn && rooms.every((room) => cancellationPolicyUntil(room.ratePlanId, reservation.freeCancellationUntil ?? cancellationDeadline(booking.checkIn), today).refundable),
    cancellationRetainedTotal: (reservation.cancellationRetainedTotal ?? 0) + retainedAmount,
  };
  return {
    refund,
    cancelledAmount,
    retainedAmount,
    roomIds: chosen.map((index) => roomsWithAmounts[index]!.id!),
    booking: {
      ...booking,
      roomType: describeRooms(rooms),
      guestCount,
      companions,
      roomRate: peso(total + (nextReservation.cancellationRetainedTotal ?? 0)),
      reservation: nextReservation,
    },
  };
}

/* ---------- choosing rooms at a hotel with many ---------- */

export type RoomSuggestion = { cart: CartLine[]; total: number; rooms: number };

/**
 * The fewest rooms that fit the whole party, on free-cancellation rates,
 * cheapest first -- the combination most groups would build by hand. Tries
 * every mix of the open room classes up to one room per lead guest, which
 * stays small: a hotel lists a handful of classes and a party a handful of
 * rooms. Undefined when nothing open can hold them.
 */
export function suggestRooms(hotel: StayHotel, search: StaySearch, held: HeldRooms = NO_HELD_ROOMS): RoomSuggestion | undefined {
  const party = describeParty(search.adults, search.childAges);
  // Free-cancellation rates while they exist; inside the window, the cheapest room-only rate there is.
  const planOf = (offer: RoomOffer) => (offer.plans.find((plan) => plan.id === 'flex') ?? offer.plans.find((plan) => plan.id === 'saver'))!;
  const open = roomOffers(hotel, search, held).filter((offer) => offer.left > 0 && offer.plans.some((plan) => plan.id === 'flex' || plan.id === 'saver'));
  if (!open.length) return undefined;
  const cap = Math.max(1, party.leads);
  let best: RoomSuggestion | undefined;
  const counts = open.map(() => 0);
  const visit = (index: number, rooms: number) => {
    if (rooms > cap) return;
    if (index === open.length) {
      if (!rooms) return;
      const cart: CartLine[] = open.flatMap((offer, i) => (counts[i] ? [{ roomTypeId: offer.roomType.id, ratePlanId: planOf(offer).id, quantity: counts[i]! }] : []));
      if (!cartFit(hotel, search, cart).fits) return;
      const total = cart.reduce((sum, line) => sum + (planOf(open.find((offer) => offer.roomType.id === line.roomTypeId)!).total * line.quantity), 0);
      if (!best || rooms < best.rooms || (rooms === best.rooms && total < best.total)) best = { cart, total, rooms };
      return;
    }
    for (let n = 0; n <= Math.min(open[index]!.left, cap - rooms); n++) {
      counts[index] = n;
      visit(index + 1, rooms + n);
    }
    counts[index] = 0;
  };
  visit(0, 0);
  return best;
}

export type RoomFilter = 'breakfast' | 'free-cancellation' | 'family' | 'king';
export const ROOM_FILTER_LABELS: Record<RoomFilter, string> = {
  breakfast: 'Breakfast',
  'free-cancellation': 'Free cancellation',
  family: 'Fits 4+ guests',
  king: 'King bed',
};

/** Room classes a filter keeps. Breakfast and free cancellation are about rates, so they keep a class with one such rate. */
export function roomMatches(offer: RoomOffer, filters: RoomFilter[]): boolean {
  return filters.every((filter) => {
    if (filter === 'breakfast') return offer.plans.some((plan) => plan.id === 'flex-breakfast');
    if (filter === 'free-cancellation') return offer.plans.some((plan) => plan.refundable);
    if (filter === 'family') return offer.roomType.sleeps >= 4;
    return /king/i.test(offer.roomType.beds);
  });
}

/* ---------- reminders, quick dates, getting there ---------- */

/** Days until the free-cancellation deadline for eligible rooms, when it is close: 0 means it ends today. */
export function cancellationReminder(booking: Booking, today = PROTOTYPE_TODAY): { daysLeft: number; until: string; rooms: number } | undefined {
  if (booking.status !== 'upcoming') return undefined;
  const summary = bookingCancellationSummary(booking, today);
  if (!summary.refundableRooms || !summary.until) return undefined;
  const daysLeft = countNightsBetween(today, summary.until);
  if (daysLeft < 0 || daysLeft > 3) return undefined;
  return { daysLeft, until: summary.until, rooms: summary.refundableRooms };
}

/** One-tap dates for the When step: the weekends people actually plan, and Christmas. */
export function quickDates(today = PROTOTYPE_TODAY): { label: string; checkIn: string; checkOut: string }[] {
  const weekday = new Date(`${today}T00:00:00Z`).getUTCDay();
  const friday = addDays(today, ((5 - weekday + 7) % 7) || 7);
  const year = Number(today.slice(0, 4));
  const christmas = `${today.slice(5) > '12-24' ? year + 1 : year}-12-24`;
  return [
    { label: 'This weekend', checkIn: friday, checkOut: addDays(friday, 2) },
    { label: 'Next weekend', checkIn: addDays(friday, 7), checkOut: addDays(friday, 9) },
    { label: 'Christmas', checkIn: christmas, checkOut: addDays(christmas, 3) },
  ];
}

export type TravelNote = { summary: string; steps: string[]; fees?: string; transfer: boolean };

/**
 * How guests actually reach each destination: the ferries, vans and fees the
 * booking apps leave to a blog post. `transfer` is whether the hotel can
 * arrange the last leg as an arrival service.
 */
export const TRAVEL_NOTES: Record<string, TravelNote> = {
  Manila: { summary: 'About 25 minutes from NAIA', steps: ['Fly into NAIA Terminal 1, 2 or 3', 'Taxi or hotel car to Pasay or Makati: 20–40 minutes'], transfer: true },
  Cebu: { summary: 'About 35 minutes from Mactan–Cebu Airport', steps: ['Fly into Mactan–Cebu International Airport', 'Car over the bridge to Cebu City, or 15 minutes to the Mactan resorts'], transfer: true },
  Dumaguete: { summary: 'About 15 minutes from Sibulan Airport', steps: ['Fly into Dumaguete–Sibulan Airport', 'Tricycle or hotel car into the city'], transfer: true },
  Boracay: { summary: 'Flight, a short boat ride, then a tricycle', steps: ['Fly into Caticlan (or Kalibo, 1.5 hours away by van)', 'Caticlan Jetty Port: 15-minute boat to Cagban', 'Tricycle or e-trike to Station 1: 20 minutes'], fees: 'Environmental fee ₱150, terminal fee ₱100 and boat fare about ₱50, paid at the jetty. Bring the hotel booking: the island checks it.', transfer: true },
  'El Nido': { summary: 'A short flight, or 5–6 hours by van from Puerto Princesa', steps: ['Fly direct into El Nido (Lio) Airport, or into Puerto Princesa', 'From Puerto Princesa: shared or private van, 5–6 hours', 'Tricycle to the resort from town'], fees: 'Eco-development fee ₱400 per guest, paid once in El Nido.', transfer: true },
  Siargao: { summary: 'About 40 minutes from Sayak Airport', steps: ['Fly into Siargao (Sayak) Airport', 'Van or tricycle to General Luna: 40 minutes'], transfer: true },
  Bohol: { summary: 'About 15 minutes from Panglao Airport', steps: ['Fly into Bohol–Panglao International Airport, or take the fast ferry from Cebu to Tagbilaran (2 hours)', 'Car to Alona: 15 minutes from the airport, 30 from the port'], transfer: true },
  Baguio: { summary: 'About 4 hours by road from Manila or Clark', steps: ['Bus from Manila (Cubao or Pasay) or Clark, or drive via TPLEX', 'Taxi from the Baguio bus terminal to Camp John Hay: 15 minutes'], transfer: false },
  Tagaytay: { summary: 'About 1.5–2 hours by road from Manila', steps: ['Drive via CAVITEX or SLEX and Santa Rosa–Tagaytay Road', 'Or a bus from Pasay to Tagaytay Rotonda, then a short tricycle ride'], transfer: false },
};

/* ---------- optional extras for a new hotel booking ---------- */

/*
  The roster between choosing rooms and paying for them
  (docs/superpowers/specs/2026-09-30-hotel-booking-pre-arrival-add-ons-design.md).
  Paid extras and an early-check-in request are attached after the booking
  payment succeeds; the request itself is charged only if the hotel confirms.
*/

export type AddOnId = 'transfer' | 'private-car' | 'luggage' | 'celebration' | 'early-check-in';
export type CelebrationSetup = 'flowers' | 'full';
export type StayAddOn = {
  id: AddOnId;
  /** Transfer: when the flight lands, as "14:30". Empty until the guest says. */
  time?: string;
  passengers?: number;
  flight?: string;
  /** Private car: days of the stay with a driver. */
  days?: number;
  setup?: CelebrationSetup;
  occasion?: string;
};

const AIRPORTS: Record<string, string> = {
  Manila: 'NAIA Terminal 3',
  Cebu: 'Mactan–Cebu International Airport',
  Dumaguete: 'Dumaguete–Sibulan Airport',
  Boracay: 'Caticlan Airport',
  'El Nido': 'El Nido Airport',
  Siargao: 'Sayak Airport',
  Bohol: 'Bohol–Panglao International Airport',
  Baguio: 'Clark International Airport',
};

export const airportForCity = (city: string) => AIRPORTS[city] ?? 'NAIA Terminal 3';

export const ADD_ON_INFO: Record<AddOnId, { title: string; blurb: string }> = {
  transfer: { title: 'Airport pickup', blurb: 'Met at arrivals and driven to the door.' },
  'private-car': { title: 'Private car & driver', blurb: 'A car and driver for the day, up to 10 hours.' },
  luggage: { title: 'Luggage storage & delivery', blurb: 'Bags held before check-in and after check-out, or sent to your room.' },
  celebration: { title: 'Flowers & celebration setup', blurb: 'The room ready for the occasion when you walk in.' },
  'early-check-in': { title: 'Early check-in', blurb: `Your room from ${EARLY_CHECK_IN.time} instead of ${CHECK_IN_FROM}. Added to your room bill if confirmed.` },
};

/** Up to this many passengers ride in the executive van; more take the private van. */
export const VAN_SEATS = 4;
export const TRANSFER_FARES = { van: 1200, large: 1800 };
export const PRIVATE_CAR_PER_DAY = 4800;
export const CELEBRATION_SETUPS: Record<CelebrationSetup, { label: string; detail: string; price: number }> = {
  flowers: { label: 'Flowers', detail: 'A bouquet and a card in the room', price: 1600 },
  full: { label: 'Full setup', detail: 'Flowers, a cake and the room decorated', price: 3200 },
};
export const OCCASIONS = ['Birthday', 'Anniversary', 'Honeymoon', 'Proposal', 'Just because'] as const;
const EARLY_CHECK_IN_FEE = Number(EARLY_CHECK_IN.fee.replace(/[^\d]/g, ''));

/** What this hotel can arrange: no airport pickup where there is no airport near enough to meet. */
export function addOnsFor(hotel: StayHotel): AddOnId[] {
  const pickup = TRAVEL_NOTES[hotel.city]?.transfer !== false;
  return [...(pickup ? (['transfer'] as const) : []), 'private-car', 'early-check-in', 'celebration', 'luggage'];
}

export function newAddOn(id: AddOnId, search: StaySearch): StayAddOn {
  if (id === 'transfer') return { id, time: '', passengers: search.adults + search.childAges.length, flight: '' };
  if (id === 'private-car') return { id, days: 1 };
  if (id === 'celebration') return { id, setup: 'flowers', occasion: '' };
  return { id };
}

const transferVehicle = (passengers: number) => (passengers > VAN_SEATS ? 'Private van' : 'Executive van');

export function addOnAmount(addOn: StayAddOn): number {
  switch (addOn.id) {
    case 'transfer': return (addOn.passengers ?? 1) > VAN_SEATS ? TRANSFER_FARES.large : TRANSFER_FARES.van;
    case 'private-car': return PRIVATE_CAR_PER_DAY * Math.max(1, addOn.days ?? 1);
    case 'celebration': return CELEBRATION_SETUPS[addOn.setup ?? 'flowers'].price;
    case 'early-check-in': return EARLY_CHECK_IN_FEE;
    default: return 0;
  }
}

/** "14:30" as "2:30 PM". */
export function clockLabel(time: string): string {
  const [hours = 0, minutes = 0] = time.split(':').map(Number);
  return `${((hours + 11) % 12) + 1}:${String(minutes).padStart(2, '0')} ${hours >= 12 ? 'PM' : 'AM'}`;
}

export function addOnDetail(addOn: StayAddOn, hotel: StayHotel): string {
  switch (addOn.id) {
    case 'transfer': return `${airportForCity(hotel.city)} · ${addOn.time ? clockLabel(addOn.time) : 'landing time needed'} · ${addOn.passengers} ${addOn.passengers === 1 ? 'guest' : 'guests'} · ${transferVehicle(addOn.passengers ?? 1)}`;
    case 'private-car': return `${addOn.days} ${addOn.days === 1 ? 'day' : 'days'} from check-in`;
    case 'celebration': return `${CELEBRATION_SETUPS[addOn.setup ?? 'flowers'].label}${addOn.occasion ? ` · ${addOn.occasion}` : ''}`;
    case 'early-check-in': return `From ${EARLY_CHECK_IN.time}`;
    default: return 'Complimentary';
  }
}

/** What the guest still has to say before paying, or nothing. */
export function addOnError(addOn: StayAddOn): string | undefined {
  if (addOn.id === 'transfer' && !addOn.time) return 'Add the time your flight lands';
  return undefined;
}

export type AddOnLine = { id: AddOnId; title: string; detail: string; amount: number };

export function addOnLines(addOns: StayAddOn[] | undefined, hotel: StayHotel): AddOnLine[] {
  const offered = addOnsFor(hotel);
  return (addOns ?? []).filter((addOn) => offered.includes(addOn.id)).map((addOn) => ({ id: addOn.id, title: ADD_ON_INFO[addOn.id].title, detail: addOnDetail(addOn, hotel), amount: addOnAmount(addOn) }));
}

export const addOnsTotal = (lines: AddOnLine[]) => lines.reduce((sum, line) => sum + line.amount, 0);
export const addOnsPayNowTotal = (lines: AddOnLine[]) => lines.reduce((sum, line) => sum + (line.id === 'early-check-in' ? 0 : line.amount), 0);
export const addOnsRoomChargeTotal = (lines: AddOnLine[]) => lines.reduce((sum, line) => sum + (line.id === 'early-check-in' ? line.amount : 0), 0);

/**
 * Arrival extras as the stay's service bookings, made only after the booking
 * payment succeeds. Early check-in waits for hotel confirmation before its
 * room charge is posted.
 */
export function addOnServiceBookings({ addOns, hotel, booking, method, paidAt }: {
  addOns: StayAddOn[] | undefined;
  hotel: StayHotel;
  booking: Pick<Booking, 'id' | 'checkIn'>;
  method: 'card' | 'gcash' | 'maya';
  paidAt: string;
}): ServiceBooking[] {
  const day = formatServiceDay(booking.checkIn).long;
  const offered = addOnsFor(hotel);
  return (addOns ?? []).filter((addOn) => offered.includes(addOn.id)).map((addOn): ServiceBooking => {
    const amount = addOnAmount(addOn);
    const booked = { amount: formatPesoAmount(amount), status: 'confirmed' as const, bookedAt: paidAt, bookingId: booking.id, scheduledDate: booking.checkIn };
    const paid = { ...booked, ...(amount ? { paymentStatus: 'paid' as const, paymentMethod: method } : { paymentStatus: 'complimentary' as const }) };
    switch (addOn.id) {
      case 'transfer': {
        const airport = airportForCity(hotel.city);
        const clock = clockLabel(addOn.time || '10:00');
        const [hours = 10, minutes = 0] = (addOn.time || '10:00').split(':').map(Number);
        return {
          ...paid,
          id: `service-ride-${booking.id}-in-${booking.checkIn}-${hours}${minutes}`,
          serviceId: 'transfer',
          title: 'Airport transfer · to the hotel',
          scheduledFor: `${day} · ${clock}`,
          scheduledHour: hours,
          provider: 'Arranged by the hotel',
          summary: `${clock} · ${airport} → hotel`,
          facts: [
            { label: 'Pick up', value: airport },
            { label: 'Drop off', value: hotel.name },
            ...(addOn.flight?.trim() ? [{ label: 'Flight', value: addOn.flight.trim().toUpperCase() }] : []),
            { label: 'Passengers', value: `${addOn.passengers}` },
            { label: 'Vehicle', value: transferVehicle(addOn.passengers ?? 1) },
            { label: 'Status', value: 'Paid with your booking · the hotel confirms the driver' },
          ],
        };
      }
      case 'private-car':
        return {
          ...paid,
          id: `service-private-car-${booking.id}`,
          serviceId: 'private-car',
          title: 'Private car & driver',
          scheduledFor: `${day} · ${addOn.days} ${addOn.days === 1 ? 'day' : 'days'}`,
          provider: 'Arranged by the hotel',
          summary: `${addOn.days} ${addOn.days === 1 ? 'day' : 'days'} from check-in · up to 10 hours a day`,
          facts: [{ label: 'Days', value: `${addOn.days}` }, { label: 'Hours', value: 'Up to 10 a day, set with the driver' }],
        };
      case 'celebration': {
        const setup = CELEBRATION_SETUPS[addOn.setup ?? 'flowers'];
        return {
          ...paid,
          id: `service-celebration-${booking.id}`,
          serviceId: 'celebration',
          title: 'Flowers & celebration setup',
          scheduledFor: `${day} · Ready when you arrive`,
          // Ready for check-in, so it sorts after an afternoon pickup.
          scheduledHour: 15,
          provider: 'Curated guide',
          summary: `${setup.label}${addOn.occasion ? ` · ${addOn.occasion}` : ''}`,
          facts: [{ label: 'Setup', value: setup.detail }, ...(addOn.occasion ? [{ label: 'Occasion', value: addOn.occasion }] : [])],
        };
      }
      case 'early-check-in':
        return {
          ...booked,
          paymentStatus: amount ? 'pending-confirmation' : 'complimentary',
          paymentMethod: 'room',
          id: earlyCheckInBookingId(booking.id),
          serviceId: 'early-check-in',
          title: 'Early check-in',
          scheduledFor: `${day} · ${EARLY_CHECK_IN.time}`,
          scheduledHour: 11,
          summary: `${EARLY_CHECK_IN.time} · instead of ${CHECK_IN_FROM}`,
          facts: [
            { label: 'Room from', value: `${EARLY_CHECK_IN.time} instead of ${CHECK_IN_FROM}` },
            { label: 'Status', value: 'Waiting for the hotel to confirm' },
            { label: 'If approved', value: `${formatPesoAmount(amount)} added to your room bill, due at checkout` },
          ],
        };
      default:
        return {
          ...paid,
          id: `service-luggage-${booking.id}`,
          serviceId: 'luggage',
          title: 'Luggage storage & delivery',
          scheduledFor: `${day} · Whenever you arrive`,
          provider: 'Hotel operated',
          summary: 'Held before check-in and after check-out',
        };
    }
  });
}

/**
 * A paid booking with its extras attached: service bookings and the
 * reservation's upfront-only extras total, apart from the room total.
 */
export function withAddOns({ booking, hotel, addOns, method, paidAt }: {
  booking: Booking;
  hotel: StayHotel;
  addOns: StayAddOn[] | undefined;
  method: 'card' | 'gcash' | 'maya';
  paidAt: string;
}): { booking: Booking; services: ServiceBooking[]; total: number; lines: AddOnLine[] } {
  const services = addOnServiceBookings({ addOns, hotel, booking, method, paidAt });
  const lines = addOnLines(addOns, hotel);
  const total = addOnsPayNowTotal(lines);
  if (!services.length || !booking.reservation) return { booking, services: [], total: 0, lines: [] };
  return {
    services,
    lines,
    total,
    booking: {
      ...booking,
      earlyCheckIn: services.some((item) => item.serviceId === 'early-check-in') ? EARLY_CHECK_IN : booking.earlyCheckIn,
      reservation: {
        ...booking.reservation,
        addOns: services.map((item, index) => ({ id: lines[index]!.id, serviceBookingId: item.id, title: lines[index]!.title, amount: lines[index]!.amount, detail: lines[index]!.detail })),
        addOnsTotal: total,
      },
    },
  };
}

/**
 * Extras kept in line with the stay they were chosen for: a car for no more
 * days than there are nights, a pickup for no more people than are coming.
 * Run whenever the dates or party change under a draft.
 */
export function fitAddOns(addOns: StayAddOn[] | undefined, search: StaySearch): StayAddOn[] {
  const nights = Math.max(1, countNightsBetween(search.checkIn, search.checkOut));
  const party = search.adults + search.childAges.length;
  return (addOns ?? []).map((addOn) => {
    if (addOn.id === 'private-car') return { ...addOn, days: Math.min(Math.max(1, addOn.days ?? 1), nights) };
    if (addOn.id === 'transfer') return { ...addOn, passengers: Math.min(Math.max(1, addOn.passengers ?? party), Math.max(party, 1)) };
    return addOn;
  });
}

/**
 * After rooms are cancelled, the airport pickup booked with them carries only
 * the guests still coming: fewer passengers, the smaller van if they now fit
 * it, and the difference back. The other extras do not depend on the party.
 */
export function fitPickupToParty(booking: Booking, service: ServiceBooking): { booking: Booking; service: ServiceBooking; refund: number; passengers: number } | undefined {
  const reservation = booking.reservation;
  const extra = reservation?.addOns?.find((item) => item.serviceBookingId === service.id && item.id === 'transfer');
  const before = Number(service.facts?.find((fact) => fact.label === 'Passengers')?.value ?? 0);
  const passengers = Math.max(1, booking.guestCount);
  if (!reservation || !extra || service.status !== 'confirmed' || !before || before <= passengers) return undefined;
  const amount = addOnAmount({ id: 'transfer', passengers });
  const refund = Math.max(0, extra.amount - amount);
  return {
    refund,
    passengers,
    service: {
      ...service,
      amount: formatPesoAmount(amount),
      facts: service.facts?.map((fact) => (fact.label === 'Passengers' ? { ...fact, value: `${passengers}` } : fact.label === 'Vehicle' ? { ...fact, value: transferVehicle(passengers) } : fact)),
    },
    booking: {
      ...booking,
      reservation: {
        ...reservation,
        addOns: reservation.addOns!.map((item) => (item === extra ? { ...item, amount, detail: item.detail?.replace(/\d+ guests? · [A-Za-z ]+van$/, `${passengers} ${passengers === 1 ? 'guest' : 'guests'} · ${transferVehicle(passengers)}`) } : item)),
        addOnsTotal: (reservation.addOnsTotal ?? 0) - refund,
      },
    },
  };
}

/**
 * What an airport pickup actually involves from this city's airport. Most are
 * a drive; Boracay is a drive, a boat and a tricycle, and saying "driven to
 * the door" promised a road that does not exist.
 */
export function pickupBlurb(city: string, property?: string): string {
  if (city === 'Boracay') return `Met at ${airportForCity(city)} arrivals, then the jetty, the boat across and the last leg${property ? ` to ${property}` : ''}, all arranged. Jetty fees are paid there in cash.`;
  return `Met at ${airportForCity(city)} arrivals and driven${property ? ` to ${property}` : ' to the door'}.`;
}
