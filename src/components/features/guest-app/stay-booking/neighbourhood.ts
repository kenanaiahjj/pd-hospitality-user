import type { ServiceImageDefinition } from '../service-images';
import { storyImage } from '../promoted/story-imagery';
import { STAY_HOTELS } from './model';

/*
  What is around each hotel, as a reason to book it: the sights, somewhere to
  eat, the 7-Eleven and the pharmacy, and the partners a guest can book in the
  app once they are staying. Pure data, like `model.ts`. Every distance is a
  prototype figure -- the property or the PMS middleware supplies the real
  ones -- and a place's pin is set along a bearing at its stated distance, so
  the list and the map cannot disagree.
*/

export type NearbyKind = 'attraction' | 'food' | 'essential';
export type NearbyIcon = 'landmark' | 'beach' | 'mall' | 'nature' | 'museum' | 'food' | 'cafe' | 'bar' | 'store' | 'pharmacy' | 'atm' | 'airport' | 'market' | 'church' | 'port';
export type TravelMode = 'walk' | 'drive' | 'boat';

export type NearbySpot = {
  id: string;
  kind: NearbyKind;
  icon: NearbyIcon;
  name: string;
  type: string;
  minutes: number;
  mode: TravelMode;
  /** Compass bearing from the hotel, in degrees, where known; else one is derived. */
  bearing?: number;
};

export type StayPartner = {
  id: string;
  name: string;
  type: string;
  detail: string;
  image: ServiceImageDefinition;
  /** Run by the hotel itself, or a partner with a name of its own. */
  operator: 'hotel' | 'partner';
};

export type Neighbourhood = { spots: NearbySpot[]; partners: StayPartner[] };

const spot = (kind: NearbyKind, icon: NearbyIcon, name: string, type: string, minutes: number, mode: TravelMode = 'walk', bearing?: number): NearbySpot => ({
  id: `${kind}-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
  kind,
  icon,
  name,
  type,
  minutes,
  mode,
  bearing,
});
const partner = (id: string, name: string, type: string, detail: string, image: string, operator: StayPartner['operator'] = 'partner'): StayPartner => ({ id, name, type, detail, image: storyImage(image), operator });

// The Henry properties carry the partners already in the in-stay catalogue.
const HENRY_PARTNERS = [
  partner('hilom-spa', 'Hilom Spa & Wellness', 'Spa', 'Hilot, hot stone and couples massage', 'spa'),
  partner('kalye-walks', 'Kalye Manila Walks', 'Tours', 'Heritage walks and food crawls', 'heritage-walk'),
  partner('sakay-rentals', 'Sakay Rentals', 'Rentals', 'Scooters and e-bikes from the driveway', 'food-crawl'),
];

export const NEIGHBOURHOODS: Record<string, Neighbourhood> = {
  manila: {
    spots: [
      spot('attraction', 'nature', 'Manila Bay', 'Baywalk and sunset views', 10, 'walk', 275),
      spot('attraction', 'museum', 'Cultural Center of the Philippines', 'Theatre and museums', 8, 'drive', 300),
      spot('attraction', 'mall', 'SM Mall of Asia', 'Shopping, IMAX and the bay wheel', 12, 'drive', 215),
      spot('attraction', 'landmark', 'Intramuros', 'The walled old city', 20, 'drive', 350),
      spot('food', 'food', 'Apartment 1B', 'At the hotel · comfort food and cocktails', 1),
      spot('food', 'cafe', 'Kape Lab Manila', 'Coffee and bakery', 4, 'walk', 330),
      spot('food', 'food', 'Bayleaf Kitchen', 'Filipino restaurant', 8, 'walk', 20),
      spot('essential', 'store', '7-Eleven', 'Convenience store · open 24 hours', 2),
      spot('essential', 'pharmacy', 'Mercury Drug', 'Pharmacy', 5),
      spot('essential', 'atm', 'BDO ATM', 'Cash machine', 3),
      spot('essential', 'airport', 'NAIA Terminal 3', 'Airport', 25, 'drive'),
    ],
    partners: [partner('apartment-1b', 'Apartment 1B', 'Restaurant', 'Breakfast to late cocktails in the courtyard', 'apartment-1b', 'hotel'), ...HENRY_PARTNERS],
  },
  cebu: {
    spots: [
      spot('attraction', 'mall', 'Ayala Center Cebu', 'Mall and terraces', 12, 'drive'),
      spot('attraction', 'landmark', 'Temple of Leah', 'Hilltop landmark and city views', 20, 'drive'),
      spot('attraction', 'church', 'Basilica del Santo Niño', 'Heritage church', 25, 'drive'),
      spot('attraction', 'beach', 'Mactan beaches', 'Island hopping and snorkelling', 35, 'drive'),
      spot('food', 'bar', 'Azotea Rooftop', 'At the hotel · rooftop bar', 1),
      spot('food', 'food', 'Paseo Saturnino restaurants', 'A row of cafés and grills', 3),
      spot('food', 'food', 'House of Lechon', 'Cebu lechon', 10, 'drive'),
      spot('essential', 'store', '7-Eleven', 'Convenience store · open 24 hours', 3),
      spot('essential', 'pharmacy', 'Watsons', 'Pharmacy', 6),
      spot('essential', 'atm', 'BPI ATM', 'Cash machine', 4),
      spot('essential', 'airport', 'Mactan–Cebu Airport', 'Airport', 35, 'drive'),
    ],
    partners: [partner('azotea', 'Azotea Rooftop', 'Bar', 'Sunset cocktails over the city', 'rooftop', 'hotel'), partner('lakbay-tours', 'Lakbay Island Tours', 'Tours', 'Mactan island hopping and diving', 'tour'), ...HENRY_PARTNERS.slice(0, 1), HENRY_PARTNERS[2]!],
  },
  dumaguete: {
    spots: [
      spot('attraction', 'nature', 'Rizal Boulevard', 'Seaside promenade', 12),
      spot('attraction', 'beach', 'Apo Island', 'Turtles and reef snorkelling', 45, 'boat'),
      spot('attraction', 'nature', 'Casaroro Falls', 'Rainforest waterfall', 40, 'drive'),
      spot('attraction', 'museum', 'Silliman University', 'Campus and anthropology museum', 8, 'drive'),
      spot('food', 'cafe', 'Sans Rival Cakes', 'Local sans rival and silvanas', 10, 'drive'),
      spot('food', 'food', 'Boulevard grills', 'Seafood by the water', 12),
      spot('essential', 'store', '7-Eleven', 'Convenience store · open 24 hours', 4),
      spot('essential', 'pharmacy', 'Mercury Drug', 'Pharmacy', 7),
      spot('essential', 'airport', 'Sibulan Airport', 'Airport', 15, 'drive'),
    ],
    partners: [partner('lakbay-tours', 'Lakbay Island Tours', 'Tours', 'Apo Island day trips', 'tour'), ...HENRY_PARTNERS.slice(0, 1), partner('dumaguete-pool', 'Poolside Bar', 'Bar', 'Shakes and cocktails by the pool', 'poolside-bar', 'hotel')],
  },
  'poblacion-loft': {
    spots: [
      spot('attraction', 'bar', 'Poblacion bar street', 'Makati’s nightlife block', 1),
      spot('attraction', 'mall', 'Greenbelt and Glorietta', 'Malls and parks', 10, 'drive'),
      spot('attraction', 'nature', 'Ayala Triangle Gardens', 'Park and food stalls', 12),
      spot('attraction', 'museum', 'Ayala Museum', 'Philippine history and art', 12, 'drive'),
      spot('food', 'food', 'Poblacion food hall', 'Twenty stalls under one roof', 3),
      spot('food', 'cafe', 'Corner specialty coffee', 'Coffee and brunch', 2),
      spot('essential', 'store', '7-Eleven', 'Convenience store · open 24 hours', 1),
      spot('essential', 'pharmacy', 'Mercury Drug', 'Pharmacy', 4),
      spot('essential', 'atm', 'Metrobank ATM', 'Cash machine', 2),
      spot('essential', 'airport', 'NAIA Terminal 3', 'Airport', 35, 'drive'),
    ],
    partners: [partner('pob-rooftop', 'Loft Rooftop Bar', 'Bar', 'Happy hour above Poblacion', 'rooftop', 'hotel'), partner('pob-walks', 'Makati Food Crawl', 'Tours', 'Street food and bars after dark', 'food-crawl'), partner('pob-gym', 'Loft Gym', 'Fitness', 'Open 24 hours for guests', 'gym', 'hotel')],
  },
  'mactan-tidewater': {
    spots: [
      spot('attraction', 'beach', 'House reef', 'Snorkel straight off the beach', 1),
      spot('attraction', 'beach', 'Island hopping', 'Hilutungan and Nalusuan marine parks', 30, 'boat'),
      spot('attraction', 'landmark', 'Lapu-Lapu Shrine', 'Mactan Shrine park', 10, 'drive'),
      spot('attraction', 'mall', 'Mactan Newtown', 'Shops and restaurants', 12, 'drive'),
      spot('food', 'food', 'Tide Grill', 'At the resort · beachfront grill', 2),
      spot('food', 'food', 'Lantaw Seafood', 'Floating seafood restaurant', 10, 'drive'),
      spot('essential', 'store', '7-Eleven', 'Convenience store · open 24 hours', 5, 'drive'),
      spot('essential', 'pharmacy', 'Watsons', 'Pharmacy', 8, 'drive'),
      spot('essential', 'airport', 'Mactan–Cebu Airport', 'Airport', 15, 'drive'),
    ],
    partners: [partner('tide-spa', 'Tidewater Spa', 'Spa', 'Oceanfront treatment pavilions', 'spa', 'hotel'), partner('lakbay-tours', 'Lakbay Island Tours', 'Tours', 'Island hopping from the resort jetty', 'tour'), partner('tide-kids', 'Kids’ Club', 'Family', 'Supervised days for ages 4–12', 'kids-club', 'hotel')],
  },
  'alon-boracay': {
    spots: [
      spot('attraction', 'beach', 'White Beach, Station 1', 'Right outside the gate', 1),
      spot('attraction', 'beach', 'Puka Shell Beach', 'Quiet northern beach', 15, 'drive'),
      spot('attraction', 'landmark', 'Willy’s Rock', 'Boracay’s landmark rock', 5),
      spot('attraction', 'mall', 'D’Mall', 'Shops, bars and the market', 12),
      spot('food', 'food', 'Station 1 beach grills', 'Seafood on the sand', 3),
      spot('food', 'cafe', 'Mango shake stalls', 'Shakes and crêpes', 4),
      spot('essential', 'store', '7-Eleven', 'Convenience store · open 24 hours', 3),
      spot('essential', 'pharmacy', 'Island pharmacy', 'Pharmacy', 8),
      spot('essential', 'port', 'Cagban Jetty Port', 'Boat to Caticlan Airport', 20, 'drive'),
    ],
    partners: [partner('alon-sunset', 'Paraw Sunset Sail', 'Tours', 'Sailing at sunset from the beach', 'sunset-cruise'), partner('alon-massage', 'Beachfront massage', 'Spa', 'Massage in a cabana on the sand', 'couples-massage'), partner('alon-bar', 'Alon Beach Bar', 'Bar', 'Cocktails at the gate', 'poolside-bar', 'hotel')],
  },
  'bato-cove': {
    spots: [
      spot('attraction', 'beach', 'Lagoon tour', 'Big, Small and Secret Lagoon by bangka', 5, 'boat'),
      spot('attraction', 'beach', 'Nacpan Beach', 'Four kilometres of empty sand', 40, 'drive'),
      spot('attraction', 'nature', 'Taraw Cliff', 'Via ferrata over town', 10, 'drive'),
      spot('attraction', 'beach', 'Las Cabañas Beach', 'Sunset and the zipline', 10, 'drive'),
      spot('food', 'food', 'Cove dining deck', 'At the resort · dinner on the sand', 1),
      spot('food', 'food', 'El Nido town restaurants', 'Seafood and wood-fired pizza', 8, 'drive'),
      spot('essential', 'store', '7-Eleven El Nido', 'Convenience store', 8, 'drive'),
      spot('essential', 'atm', 'Town ATMs', 'Cash is king here', 8, 'drive'),
      spot('essential', 'airport', 'El Nido Airport', 'Airport', 20, 'drive'),
    ],
    partners: [partner('bato-hopping', 'Private island hopping', 'Tours', 'Your own bangka and crew', 'tour'), partner('bato-spa', 'Cliff Spa', 'Spa', 'Treatments above the bay', 'spa', 'hotel'), partner('bato-dive', 'Bacuit Divers', 'Diving', 'Discover dives and fun dives', 'sunset-cruise')],
  },
  'dagat-surf-lodge': {
    spots: [
      spot('attraction', 'beach', 'Cloud 9 boardwalk', 'The famous surf break', 8, 'drive'),
      spot('attraction', 'beach', 'Naked, Daku and Guyam islands', 'Island hopping', 20, 'boat'),
      spot('attraction', 'nature', 'Magpupungko rock pools', 'Tidal pools', 40, 'drive'),
      spot('attraction', 'nature', 'Maasin River', 'Rope swing over the river', 20, 'drive'),
      spot('food', 'food', 'Tourism Road restaurants', 'Tacos, bowls and grills', 3),
      spot('food', 'cafe', 'Smoothie bar', 'At the lodge', 1),
      spot('essential', 'store', 'General Luna convenience stores', 'Snacks and supplies', 4),
      spot('essential', 'atm', 'General Luna ATM', 'Cash machine', 5),
      spot('essential', 'airport', 'Sayak Airport', 'Airport', 40, 'drive'),
    ],
    partners: [partner('dagat-surf', 'Surf lessons', 'Surf', 'Two-hour lessons, board included', 'tour'), partner('dagat-scooter', 'Scooter rental', 'Rentals', 'By the day, from the lodge', 'food-crawl'), partner('dagat-yoga', 'Morning yoga', 'Wellness', 'Daily class in the garden', 'spa', 'hotel')],
  },
  'pinetop-baguio': {
    spots: [
      spot('attraction', 'nature', 'Camp John Hay trails', 'Pine-forest walks', 2),
      spot('attraction', 'nature', 'Burnham Park', 'Lake and bike rentals', 12, 'drive'),
      spot('attraction', 'landmark', 'Mines View Park', 'Mountain lookout', 15, 'drive'),
      spot('attraction', 'market', 'Baguio Public Market', 'Strawberries and ube jam', 15, 'drive'),
      spot('food', 'cafe', 'Fireplace lounge', 'At the hotel · hot chocolate', 1),
      spot('food', 'food', 'Session Road restaurants', 'Cafés and comfort food', 15, 'drive'),
      spot('essential', 'store', '7-Eleven', 'Convenience store · open 24 hours', 6),
      spot('essential', 'pharmacy', 'Mercury Drug', 'Pharmacy', 10, 'drive'),
      spot('essential', 'mall', 'SM City Baguio', 'Mall', 15, 'drive'),
    ],
    partners: [partner('pinetop-walks', 'Guided forest walk', 'Tours', 'Dawn walks through the pines', 'heritage-walk'), partner('pinetop-spa', 'Pine Spa', 'Spa', 'Warm stone and hilot', 'hot-stone', 'hotel'), partner('pinetop-market', 'Market tour', 'Tours', 'Pasalubong with a local', 'food-crawl')],
  },
  'panglao-palm': {
    spots: [
      spot('attraction', 'beach', 'Alona Beach', 'Swimming and dive shops', 6),
      spot('attraction', 'nature', 'Chocolate Hills', 'Bohol’s famous hills', 90, 'drive'),
      spot('attraction', 'nature', 'Tarsier sanctuary', 'See the tarsiers', 50, 'drive'),
      spot('attraction', 'nature', 'Loboc River cruise', 'Lunch on the river', 60, 'drive'),
      spot('food', 'food', 'Alona beachfront restaurants', 'Seafood and sunset', 7),
      spot('food', 'cafe', 'Villa breakfast pavilion', 'At the resort', 1),
      spot('essential', 'store', '7-Eleven', 'Convenience store · open 24 hours', 5),
      spot('essential', 'pharmacy', 'Panglao pharmacy', 'Pharmacy', 8),
      spot('essential', 'airport', 'Bohol–Panglao Airport', 'Airport', 15, 'drive'),
    ],
    partners: [partner('panglao-countryside', 'Countryside tour', 'Tours', 'Chocolate Hills, tarsiers and Loboc', 'tour'), partner('panglao-dive', 'Balicasag dive trip', 'Diving', 'Turtles and walls', 'sunset-cruise'), partner('panglao-spa', 'Villa Spa', 'Spa', 'Massage in your villa', 'couples-massage', 'hotel')],
  },
  'ridgeline-tagaytay': {
    spots: [
      spot('attraction', 'nature', 'Taal Volcano viewpoint', 'From your balcony', 1),
      spot('attraction', 'nature', 'Sky Ranch', 'Ferris wheel and rides', 5, 'drive'),
      spot('attraction', 'nature', 'People’s Park in the Sky', 'Highest point in Tagaytay', 15, 'drive'),
      spot('attraction', 'landmark', 'Picnic Grove', 'Zipline and horse rides', 10, 'drive'),
      spot('food', 'food', 'Bulalo restaurants', 'Tagaytay’s beef soup', 3),
      spot('food', 'cafe', 'Ridge cafés', 'Coffee with the lake view', 4),
      spot('essential', 'store', '7-Eleven', 'Convenience store · open 24 hours', 3),
      spot('essential', 'pharmacy', 'Mercury Drug', 'Pharmacy', 6, 'drive'),
      spot('essential', 'mall', 'Ayala Serin', 'Mall', 8, 'drive'),
    ],
    partners: [partner('ridge-horse', 'Taal lake trek', 'Tours', 'Boat and trek to the crater', 'tour'), partner('ridge-spa', 'Ridge Spa', 'Spa', 'Massage with the lake view', 'spa', 'hotel'), partner('ridge-pool', 'Heated pool', 'Leisure', 'Open until 10 PM', 'pool', 'hotel')],
  },
};

/*
  Which way each place lies from its hotel, as a compass bearing in degrees,
  from where the landmark actually is. Manila's live on the spots themselves;
  the convenience stores, pharmacies and ATMs are everywhere, so they keep a
  derived direction.
*/
const BEARINGS: Record<string, Record<string, number>> = {
  cebu: { 'Ayala Center Cebu': 210, 'Temple of Leah': 320, 'Basilica del Santo Niño': 215, 'Mactan beaches': 100, 'Paseo Saturnino restaurants': 30, 'House of Lechon': 200 },
  dumaguete: { 'Rizal Boulevard': 150, 'Apo Island': 190, 'Casaroro Falls': 280, 'Silliman University': 175, 'Sans Rival Cakes': 180, 'Boulevard grills': 150 },
  'poblacion-loft': { 'Greenbelt and Glorietta': 230, 'Ayala Triangle Gardens': 215, 'Ayala Museum': 225, 'Poblacion food hall': 60, 'Corner specialty coffee': 330 },
  'mactan-tidewater': { 'Island hopping': 140, 'Lapu-Lapu Shrine': 250, 'Mactan Newtown': 220, 'Tide Grill': 80, 'Lantaw Seafood': 230 },
  'alon-boracay': { 'White Beach, Station 1': 270, 'Puka Shell Beach': 10, 'Willy’s Rock': 200, 'D’Mall': 180, 'Station 1 beach grills': 250, 'Mango shake stalls': 190 },
  'bato-cove': { 'Lagoon tour': 300, 'Nacpan Beach': 20, 'Taraw Cliff': 0, 'Las Cabañas Beach': 200, 'El Nido town restaurants': 15 },
  'dagat-surf-lodge': { 'Cloud 9 boardwalk': 20, 'Naked, Daku and Guyam islands': 150, 'Magpupungko rock pools': 15, 'Maasin River': 280, 'Tourism Road restaurants': 350 },
  'pinetop-baguio': { 'Camp John Hay trails': 90, 'Burnham Park': 300, 'Mines View Park': 45, 'Baguio Public Market': 310, 'Session Road restaurants': 305 },
  'panglao-palm': { 'Alona Beach': 190, 'Chocolate Hills': 60, 'Tarsier sanctuary': 60, 'Loboc River cruise': 55, 'Alona beachfront restaurants': 200 },
  'ridgeline-tagaytay': { 'Sky Ranch': 80, 'People’s Park in the Sky': 90, 'Picnic Grove': 85, 'Bulalo restaurants': 70, 'Ridge cafés': 260 },
};

export const findNeighbourhood = (hotelId: string): Neighbourhood => {
  const found = NEIGHBOURHOODS[hotelId];
  if (!found) return { spots: [], partners: [] };
  const bearings = BEARINGS[hotelId] ?? {};
  return { ...found, spots: found.spots.map((item) => (item.bearing === undefined && bearings[item.name] !== undefined ? { ...item, bearing: bearings[item.name] } : item)) };
};

export const travelLabel = (item: Pick<NearbySpot, 'minutes' | 'mode'>) =>
  `${item.minutes} min ${item.mode === 'walk' ? 'walk' : item.mode === 'boat' ? 'by boat' : 'drive'}`;

/** The two facts a hotel card has room for, as separate phrases so neither breaks mid-way. */
export function hotelHighlights(hotelId: string): string[] {
  return hotelHighlight(hotelId)?.split(' · ') ?? [];
}

/** The sight worth leading with: walkable first, then nearest. */
export function bestSight(hotelId: string): NearbySpot | undefined {
  return [...findNeighbourhood(hotelId).spots].filter((item) => item.kind === 'attraction').sort((a, b) => Number(a.mode !== 'walk') - Number(b.mode !== 'walk') || a.minutes - b.minutes)[0];
}

/** The two facts a hotel card has room for: the best sight, and the 7-Eleven. */
export function hotelHighlight(hotelId: string): string | undefined {
  const { spots } = findNeighbourhood(hotelId);
  const sight = bestSight(hotelId);
  const store = spots.find((item) => item.kind === 'essential' && item.icon === 'store');
  const parts = [
    // Time first, as the Home card has it: "Station 1 1 min walk" ran two numbers into each other.
    sight ? `${travelLabel(sight)} to ${sight.name}` : undefined,
    store && store.mode === 'walk' && store.minutes <= 5 ? `${store.minutes} min to ${store.name.startsWith('7-Eleven') ? '7-Eleven' : 'a store'}` : undefined,
  ].filter(Boolean);
  return parts.length ? parts.join(' · ') : undefined;
}

/* ---------- map positions ---------- */

const METRES_PER_MINUTE: Record<TravelMode, number> = { walk: 80, drive: 400, boat: 300 };
const METRES_PER_DEGREE = 111_320;

function bearingOf(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return (h % 360) * (Math.PI / 180);
}

/** Pins for the hotel map: places within reach, set at their stated distance. */
export function spotPositions(hotelId: string, maxMetres = 4000): { spot: NearbySpot; at: [number, number] }[] {
  const hotel = STAY_HOTELS.find((item) => item.id === hotelId);
  if (!hotel) return [];
  const [lat, lng] = hotel.position;
  return findNeighbourhood(hotelId).spots.flatMap((item) => {
    const metres = item.minutes * METRES_PER_MINUTE[item.mode];
    if (metres > maxMetres || metres < 60) return [];
    const bearing = item.bearing !== undefined ? (item.bearing * Math.PI) / 180 : bearingOf(item.id);
    const dLat = (Math.cos(bearing) * metres) / METRES_PER_DEGREE;
    const dLng = (Math.sin(bearing) * metres) / (METRES_PER_DEGREE * Math.cos((lat * Math.PI) / 180));
    return [{ spot: item, at: [lat + dLat, lng + dLng] as [number, number] }];
  });
}
