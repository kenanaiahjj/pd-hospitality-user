export type ServiceImageKey =
  | 'dining'
  | 'spa'
  | 'restaurant'
  | 'tour'
  | 'transfer'
  | 'amenity';

export type ServiceImageDefinition = {
  src: string;
  alt: string;
  focalPoint: string;
};

export const SERVICE_IMAGES: Record<ServiceImageKey, ServiceImageDefinition> = {
  dining: {
    src: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=82',
    alt: 'Breakfast dishes arranged for hotel room dining',
    focalPoint: '50% 48%',
  },
  spa: {
    src: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=1200&q=82',
    alt: 'Calm spa treatment with towels and massage oils',
    focalPoint: '50% 54%',
  },
  restaurant: {
    src: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=82',
    alt: 'Refined restaurant interior prepared for dinner service',
    focalPoint: '50% 55%',
  },
  tour: {
    src: 'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=1200&q=82',
    alt: 'Tropical Philippine island and turquoise water',
    focalPoint: '50% 46%',
  },
  transfer: {
    src: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=1200&q=82',
    alt: 'Clean passenger vehicle ready for an airport transfer',
    focalPoint: '50% 58%',
  },
  amenity: {
    src: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1200&q=82',
    alt: 'Hotel swimming pool and lounge area',
    focalPoint: '50% 54%',
  },
};

/**
 * Services the passenger-vehicle photo actually depicts. Bike and scooter hire
 * sit in the same category but are not cars, and a bicycle illustrated by a
 * sedan is the failure this whole helper exists to stop.
 */
const CAR_SERVICE_IDS = new Set(['transfer', 'private-car']);

/**
 * The photo for a service. Keyed on category rather than on a list of ids, so
 * a service added to the catalogue inherits its category's photo instead of
 * silently falling through to the generic amenity shot.
 *
 * The category listing carried this as an inline ternary and the Home rail
 * needed the same mapping; two copies of it is how one surface ends up showing
 * a massage a picture of a van.
 */
export function getServiceImageKey(service: { id: string; categoryId: string }): ServiceImageKey {
  if (CAR_SERVICE_IDS.has(service.id)) return 'transfer';
  if (service.categoryId === 'dining') return service.id === 'dining' ? 'dining' : 'restaurant';
  if (service.categoryId === 'spa') return 'spa';
  if (service.categoryId === 'entertainment') return 'tour';
  return 'amenity';
}

export function getServiceImage(key: ServiceImageKey) {
  return SERVICE_IMAGES[key];
}

export type PropertyImageKey = 'manila' | 'cebu' | 'dumaguete' | 'default';

export const PROPERTY_IMAGES: Record<PropertyImageKey, ServiceImageDefinition> = {
  manila: {
    src: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=82',
    alt: 'The Henry Manila boutique hotel courtyard and pool',
    focalPoint: '50% 50%',
  },
  cebu: {
    src: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=1200&q=82',
    alt: 'The Henry Cebu artsy boutique hotel exterior and balcony',
    focalPoint: '50% 45%',
  },
  dumaguete: {
    src: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=1200&q=82',
    alt: 'The Henry Dumaguete tropical coastal resort and grounds',
    focalPoint: '50% 55%',
  },
  default: {
    src: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=82',
    alt: 'Boutique hotel courtyard and swimming pool',
    focalPoint: '50% 50%',
  },
};

export const ROOM_IMAGES: Record<'king' | 'suite' | 'default', ServiceImageDefinition> = {
  king: {
    src: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=82',
    alt: 'Boutique king room with contemporary furnishings and warm lighting',
    focalPoint: '50% 50%',
  },
  suite: {
    src: 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=1200&q=82',
    alt: 'Spacious garden suite with lounge area and courtyard views',
    focalPoint: '50% 48%',
  },
  default: {
    src: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=82',
    alt: 'Warm and comfortable guest room',
    focalPoint: '50% 50%',
  },
};

export const CATEGORY_IMAGES: Record<string, ServiceImageDefinition> = {
  dining: {
    src: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=82',
    alt: 'Gourmet dining and artisan breakfast spread',
    focalPoint: '50% 48%',
  },
  spa: {
    src: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=1200&q=82',
    alt: 'Therapeutic spa massage treatment and aromatherapy oils',
    focalPoint: '50% 54%',
  },
  entertainment: {
    src: 'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=1200&q=82',
    alt: 'Tropical island excursion and crystal clear waters',
    focalPoint: '50% 46%',
  },
  services: {
    src: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1200&q=82',
    alt: 'Hotel swimming pool and premium guest amenities',
    focalPoint: '50% 54%',
  },
};

export function getPropertyImage(propertyOrName?: string): ServiceImageDefinition {
  if (!propertyOrName) return PROPERTY_IMAGES.default;
  const lower = propertyOrName.toLowerCase();
  if (lower.includes('cebu')) return PROPERTY_IMAGES.cebu;
  if (lower.includes('dumaguete')) return PROPERTY_IMAGES.dumaguete;
  if (lower.includes('manila')) return PROPERTY_IMAGES.manila;
  return PROPERTY_IMAGES.default;
}

export function getRoomImage(roomType?: string): ServiceImageDefinition {
  if (!roomType) return ROOM_IMAGES.default;
  const lower = roomType.toLowerCase();
  if (lower.includes('suite')) return ROOM_IMAGES.suite;
  if (lower.includes('king')) return ROOM_IMAGES.king;
  return ROOM_IMAGES.default;
}

export function getCategoryCoverImage(categoryId: string): ServiceImageDefinition {
  return CATEGORY_IMAGES[categoryId] ?? CATEGORY_IMAGES.dining;
}

/**
 * Dedicated close-up, high-contrast photography tailored specifically for square
 * list thumbnails (e.g. .guest-service-row thumbnails).
 */
export const ITEM_THUMBNAIL_IMAGES: Record<string, ServiceImageDefinition> = {
  // Dining venues
  'apartment-1b': {
    src: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=600&q=80',
    alt: 'Artisan poached eggs and avocado toast at Apartment 1B',
    focalPoint: '50% 50%',
  },
  restaurant: {
    src: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80',
    alt: 'Gourmet roasted dinner entrée with seasonal garnish',
    focalPoint: '50% 50%',
  },
  dining: {
    src: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=80',
    alt: 'Freshly prepared breakfast dishes for in-room dining',
    focalPoint: '50% 48%',
  },
  'poolside-bar': {
    src: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=600&q=80',
    alt: 'Handcrafted citrus cocktail served at the poolside bar',
    focalPoint: '50% 50%',
  },
  cafe: {
    src: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=600&q=80',
    alt: 'Specialty pour-over coffee and fresh buttery croissant at Kape Manila',
    focalPoint: '50% 50%',
  },
  rooftop: {
    src: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=600&q=80',
    alt: 'Fine vintage wine pairing and tasting glass at Azotea Rooftop',
    focalPoint: '50% 50%',
  },

  // Spa & wellness
  spa: {
    src: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=600&q=80',
    alt: 'Calm spa treatment with towels and massage oils',
    focalPoint: '50% 54%',
  },
  scrub: {
    src: 'https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?auto=format&fit=crop&w=600&q=80',
    alt: 'Natural coconut and sea salt botanical body scrub',
    focalPoint: '50% 50%',
  },
  'hot-stone': {
    src: 'https://images.unsplash.com/photo-1519823551278-64ac92734fb1?auto=format&fit=crop&w=600&q=80',
    alt: 'Heated volcanic basalt stones for therapeutic hot stone massage',
    focalPoint: '50% 50%',
  },
  'couples-massage': {
    src: 'https://images.unsplash.com/photo-1583416750470-965b2707b355?auto=format&fit=crop&w=600&q=80',
    alt: 'Serene couples massage suite with floral touches',
    focalPoint: '50% 50%',
  },
  reflexology: {
    src: 'https://images.unsplash.com/photo-1519824145371-296894a0dc91?auto=format&fit=crop&w=600&q=80',
    alt: 'Soothing foot and pressure point reflexology treatment',
    focalPoint: '50% 50%',
  },
  facial: {
    src: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=600&q=80',
    alt: 'Rejuvenating calamansi botanical facial skincare treatment',
    focalPoint: '50% 50%',
  },
  'mani-pedi': {
    src: 'https://images.unsplash.com/photo-1632345031435-8727f6897d53?auto=format&fit=crop&w=600&q=80',
    alt: 'Delicate nail grooming and organic manicure care',
    focalPoint: '50% 50%',
  },
  barber: {
    src: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=600&q=80',
    alt: 'Classic barber scissors and precision grooming shears',
    focalPoint: '50% 50%',
  },

  // Entertainment & tours
  tour: {
    src: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80',
    alt: 'Traditional Philippine banca boat on crystal turquoise sea',
    focalPoint: '50% 46%',
  },
  'heritage-walk': {
    src: 'https://images.unsplash.com/photo-1569154941061-e231b4725ef1?auto=format&fit=crop&w=600&q=80',
    alt: 'Colonial Spanish stone archway in historic Intramuros',
    focalPoint: '50% 50%',
  },
  'food-crawl': {
    src: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=600&q=80',
    alt: 'Steaming bamboo dim sum baskets in vibrant Binondo Chinatown',
    focalPoint: '50% 50%',
  },
  'sunset-cruise': {
    src: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=600&q=80',
    alt: 'Golden sunset over tranquil waters during Manila Bay cruise',
    focalPoint: '50% 50%',
  },
  diving: {
    src: 'https://images.unsplash.com/photo-1544551763-77ef2d0cfc6c?auto=format&fit=crop&w=600&q=80',
    alt: 'Scuba diver swimming along vibrant coral reef',
    focalPoint: '50% 50%',
  },
  'museum-pass': {
    src: 'https://images.unsplash.com/photo-1536924940846-227afb31e2a5?auto=format&fit=crop&w=600&q=80',
    alt: 'Curated modern Philippine art gallery exhibition',
    focalPoint: '50% 50%',
  },
  'cooking-class': {
    src: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=600&q=80',
    alt: 'Fresh tropical spices and ingredients in cooking masterclass',
    focalPoint: '50% 50%',
  },
  music: {
    src: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80',
    alt: 'Live acoustic guitar performance at sunset garden sessions',
    focalPoint: '50% 50%',
  },
  'film-night': {
    src: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=600&q=80',
    alt: 'Outdoor movie screening under starlit evening sky',
    focalPoint: '50% 50%',
  },

  // Hotel services
  transfer: {
    src: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=600&q=80',
    alt: 'Pristine executive black sedan ready for airport transfer',
    focalPoint: '50% 58%',
  },
  'private-car': {
    src: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=600&q=80',
    alt: 'Private chauffeur luxury vehicle for city excursion',
    focalPoint: '50% 50%',
  },
  rental: {
    src: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=600&q=80',
    alt: 'Handcrafted city bicycle parked by hotel courtyard wall',
    focalPoint: '50% 50%',
  },
  scooter: {
    src: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=600&q=80',
    alt: 'Modern electric scooter available for city travel',
    focalPoint: '50% 50%',
  },
  laundry: {
    src: 'https://images.unsplash.com/photo-1582735689369-4fe89db7114c?auto=format&fit=crop&w=600&q=80',
    alt: 'Crisp pressed hotel linens and garments on hangers',
    focalPoint: '50% 50%',
  },
  luggage: {
    src: 'https://images.unsplash.com/photo-1581553680321-4fffae59fccd?auto=format&fit=crop&w=600&q=80',
    alt: 'Polished hotel brass luggage trolley with leather travel bags',
    focalPoint: '50% 50%',
  },
  celebration: {
    src: 'https://images.unsplash.com/photo-1561181286-d3fee7d55364?auto=format&fit=crop&w=600&q=80',
    alt: 'Celebration bouquet of fresh lilies and orchids for room setup',
    focalPoint: '50% 50%',
  },
  trainer: {
    src: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=600&q=80',
    alt: 'Hotel gym fitness studio with kettlebells and workout gear',
    focalPoint: '50% 50%',
  },
  babysitting: {
    src: 'https://images.unsplash.com/photo-1587654780291-39c9404d746b?auto=format&fit=crop&w=600&q=80',
    alt: 'Engaging toys and storybooks in hotel family childcare space',
    focalPoint: '50% 50%',
  },
  'meeting-room': {
    src: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=600&q=80',
    alt: 'Quiet executive meeting table with natural light and stationery',
    focalPoint: '50% 50%',
  },
  doctor: {
    src: 'https://images.unsplash.com/photo-1584982751601-97dcc096659c?auto=format&fit=crop&w=600&q=80',
    alt: 'Professional medical kit for on-call doctor consultation',
    focalPoint: '50% 50%',
  },
};

/**
 * Dedicated expansive, landscape-oriented photography tailored specifically for
 * cards and hero banners (e.g. FeaturedRail cards, venue menus, hero banners).
 */
export const ITEM_CARD_IMAGES: Record<string, ServiceImageDefinition> = {
  // Discovery Rail Featured Cards & Venue Heroes
  'apartment-1b': {
    src: 'https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?auto=format&fit=crop&w=1200&q=82',
    alt: 'Warm contemporary bistro dining room and open bar at Apartment 1B',
    focalPoint: '50% 50%',
  },
  restaurant: {
    src: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=82',
    alt: 'Refined restaurant interior prepared for dinner service',
    focalPoint: '50% 55%',
  },
  dining: {
    src: 'https://images.unsplash.com/photo-1584132967334-10e028bd69f7?auto=format&fit=crop&w=1200&q=82',
    alt: 'Luxury private terrace breakfast with tropical garden views',
    focalPoint: '50% 50%',
  },
  'poolside-bar': {
    src: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=82',
    alt: 'Illuminated evening pool bar with turquoise water and palm trees',
    focalPoint: '50% 50%',
  },
  cafe: {
    src: 'https://images.unsplash.com/photo-1442512595331-e89e73853f31?auto=format&fit=crop&w=1200&q=82',
    alt: 'Sunlit artisan coffee house interior with handcrafted wooden furnishings',
    focalPoint: '50% 50%',
  },
  rooftop: {
    src: 'https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=1200&q=82',
    alt: 'Sweeping panoramic rooftop lounge overlooking twilight skyline',
    focalPoint: '50% 50%',
  },

  // Featured Spa Card & Sanctuary Hero
  spa: {
    src: 'https://images.unsplash.com/photo-1600334129128-685c5582fd35?auto=format&fit=crop&w=1200&q=82',
    alt: 'Calm spa treatment sanctuary with orchids and massage oils',
    focalPoint: '50% 50%',
  },
  scrub: {
    src: 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&w=1200&q=82',
    alt: 'Aromatherapy treatment suite prepared with fresh herbs and botanical wraps',
    focalPoint: '50% 50%',
  },
  'hot-stone': {
    src: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=82',
    alt: 'Tranquil wellness suite with heated volcanic stone bath',
    focalPoint: '50% 50%',
  },
  'couples-massage': {
    src: 'https://images.unsplash.com/photo-1583416750470-965b2707b355?auto=format&fit=crop&w=1200&q=82',
    alt: 'Private luxury couples wellness pavilion overlooking zen garden',
    focalPoint: '50% 50%',
  },
  reflexology: {
    src: 'https://images.unsplash.com/photo-1507652313519-d4e9174996dd?auto=format&fit=crop&w=1200&q=82',
    alt: 'Reflexology lounge with soft lighting and warm herbal infusions',
    focalPoint: '50% 50%',
  },

  // Featured Tour Card & Vistas
  tour: {
    src: 'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=1200&q=82',
    alt: 'Tropical Philippine island lagoon and limestone cliffs from above',
    focalPoint: '50% 46%',
  },
  'heritage-walk': {
    src: 'https://images.unsplash.com/photo-1555400038-63f5ba517a47?auto=format&fit=crop&w=1200&q=82',
    alt: 'Historic walled city courtyard with century-old Spanish architecture',
    focalPoint: '50% 50%',
  },
  'food-crawl': {
    src: 'https://images.unsplash.com/photo-1509722747041-616f39b57569?auto=format&fit=crop&w=1200&q=82',
    alt: 'Atmospheric night market alleys with glowing street food lanterns',
    focalPoint: '50% 50%',
  },
  'sunset-cruise': {
    src: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=1200&q=82',
    alt: 'Luxury private catamaran sailing into the Manila Bay sunset',
    focalPoint: '50% 50%',
  },
  diving: {
    src: 'https://images.unsplash.com/photo-1682687220063-4742bd7fd538?auto=format&fit=crop&w=1200&q=82',
    alt: 'Breathtaking underwater seascape with coral gardens and schools of fish',
    focalPoint: '50% 50%',
  },

  // Featured Transfer Card & Scenic Journeys
  transfer: {
    src: 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?auto=format&fit=crop&w=1200&q=82',
    alt: 'Scenic chauffeur highway journey under open blue sky',
    focalPoint: '50% 50%',
  },
  'private-car': {
    src: 'https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=1200&q=82',
    alt: 'Chauffeured luxury car awaiting outside boutique hotel entrance',
    focalPoint: '50% 50%',
  },
  rental: {
    src: 'https://images.unsplash.com/photo-1532298229144-0ec0c57515c7?auto=format&fit=crop&w=1200&q=82',
    alt: 'Fleet of handcrafted city cruiser bicycles parked along palm walk',
    focalPoint: '50% 50%',
  },
  scooter: {
    src: 'https://images.unsplash.com/photo-1609630875171-b1321377ee65?auto=format&fit=crop&w=1200&q=82',
    alt: 'Modern electric scooters lined up ready for coastal exploration',
    focalPoint: '50% 50%',
  },
  laundry: {
    src: 'https://images.unsplash.com/photo-1517677208171-0bc6725a3e60?auto=format&fit=crop&w=1200&q=82',
    alt: 'Hotel laundry and wardrobe valet service in white marble setting',
    focalPoint: '50% 50%',
  },
  luggage: {
    src: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=82',
    alt: 'Concierge luggage handling at boutique hotel lobby',
    focalPoint: '50% 50%',
  },
};

/**
 * Route-specific scenic destination imagery for Travel cards and route thumbnails.
 */
export const ROUTE_DESTINATION_IMAGES: Record<string, ServiceImageDefinition> = {
  'pr-1': {
    src: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80',
    alt: 'Turquoise ocean water and white sand beach in Boracay Caticlan',
    focalPoint: '50% 50%',
  },
  'pr-2': {
    src: 'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=600&q=80',
    alt: 'Tropical emerald waters and coastline in Bohol Tagbilaran',
    focalPoint: '50% 50%',
  },
  'pr-3': {
    src: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80',
    alt: 'Coastal panorama and skyline of Cebu City',
    focalPoint: '50% 50%',
  },
  'pr-4': {
    src: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=600&q=80',
    alt: 'Executive private chauffeur transfer to Manila NAIA Terminal 3',
    focalPoint: '50% 50%',
  },
};

export function getItemThumbnail(id: string, categoryId?: string): ServiceImageDefinition {
  if (ITEM_THUMBNAIL_IMAGES[id]) {
    return ITEM_THUMBNAIL_IMAGES[id];
  }
  const key = getServiceImageKey({ id, categoryId: categoryId ?? 'services' });
  return SERVICE_IMAGES[key];
}

export function getItemCardImage(id: string, categoryId?: string): ServiceImageDefinition {
  if (ITEM_CARD_IMAGES[id]) {
    return ITEM_CARD_IMAGES[id];
  }
  if (ITEM_THUMBNAIL_IMAGES[id]) {
    return ITEM_THUMBNAIL_IMAGES[id];
  }
  const key = getServiceImageKey({ id, categoryId: categoryId ?? 'services' });
  return SERVICE_IMAGES[key];
}

export function getRouteDestinationImage(routeId: string): ServiceImageDefinition {
  return ROUTE_DESTINATION_IMAGES[routeId] ?? {
    src: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80',
    alt: 'Scenic Philippine destination',
    focalPoint: '50% 50%',
  };
}
