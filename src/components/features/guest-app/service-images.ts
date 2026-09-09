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
