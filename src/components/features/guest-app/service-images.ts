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
