import { RESTAURANTS, SERVICES } from '../prototype-model';
import { storyImage } from './story-imagery';
import type { MiniAppCategoryId } from '../prototype-model';
import type { ServiceImageDefinition } from '../service-images';

/*
  Off-property places, and the one thing the hotel can actually sell about
  them.

  A hotel cannot take a booking for a restaurant it does not run, and
  pretending otherwise is how these lists end up as dead directories. What it
  can sell is the journey: a car, from this door to that one, at a price the
  guest already trusts. So a nearby place shows what a guest needs to decide
  -- where, how far, what it costs to eat there, a number to call -- and the
  only action is the ride.

  Names and numbers are invented. Attaching a made-up phone number to a real
  business would be worse than useless, so nothing here is a real venue.
*/

export type NearbyPlace = {
  id: string;
  name: string;
  kind: string;
  /** Straight-line, as the concierge would quote it. */
  distanceKm: number;
  minutesByCar: number;
  address: string;
  phone: string;
  priceRange: string;
  categoryId: MiniAppCategoryId;
  image: ServiceImageDefinition;
  /** What the ride there costs, from the property's own transfer pricing. */
  rideFrom: string;
};

const RIDE_BASE = SERVICES.find((service) => service.id === 'transfer')?.price ?? '₱1,200';

const place = (
  id: string,
  name: string,
  kind: string,
  categoryId: MiniAppCategoryId,
  distanceKm: number,
  address: string,
  priceRange: string,
  imageKey: string,
): NearbyPlace => ({
  id,
  name,
  kind,
  categoryId,
  distanceKm,
  // Manila traffic, not distance: four minutes a kilometre and a floor of six.
  minutesByCar: Math.max(6, Math.round(distanceKm * 4)),
  address,
  phone: '+63 2 8555 0' + String(100 + Math.round(distanceKm * 10)).slice(0, 3),
  priceRange,
  image: storyImage(imageKey),
  rideFrom: RIDE_BASE,
});

export const NEARBY_PLACES: NearbyPlace[] = [
  place('salcedo-table', 'Salcedo Table', 'Filipino · Modern', 'dining', 3.2, '118 Tordesillas St, Salcedo Village, Makati', '₱₱₱', 'apartment-1b'),
  place('bayview-grill', 'Bayview Grill House', 'Grill · Seafood', 'dining', 1.8, '2F Seaside Walk, Mall of Asia Complex, Pasay', '₱₱', 'rooftop'),
  place('kalye-sisig', 'Kalye Sisig', 'Street food · Casual', 'dining', 2.4, '55 P. Ocampo St, Malate, Manila', '₱', 'food-crawl'),
  place('tsokolate-co', 'Tsokolate & Co.', 'Café · Bakery', 'dining', 1.1, 'Ground floor, Arnaiz Corner, Pasay', '₱', 'cafe'),

  place('ritual-spa', 'Ritual Day Spa', 'Massage · Hammam', 'spa', 4.0, '9 Jupiter St, Bel-Air, Makati', '₱₱₱', 'couples-massage'),
  place('banyan-wellness', 'Banyan Wellness Room', 'Massage · Reflexology', 'spa', 2.7, '3F Vito Cruz Arcade, Malate', '₱₱', 'scrub'),

  place('intramuros-walk', 'Intramuros Walled City', 'Historic quarter', 'entertainment', 6.5, 'Intramuros, Manila', 'Free entry', 'heritage-walk'),
  place('bay-sunset-deck', 'Bay Sunset Deck', 'Viewpoint · Bar', 'entertainment', 2.1, 'Seaside Blvd, Pasay', '₱₱', 'sunset-cruise'),

  place('pasay-pharmacy', 'Southside Pharmacy', '24-hour pharmacy', 'services', 0.9, '77 Taft Ave, Pasay', '—', 'tour'),
  place('gilmore-clinic', 'Gilmore Medical Clinic', 'Walk-in clinic', 'services', 3.6, '4F Medical Plaza, Makati', '₱₱', 'facial'),
];

export const nearbyForCategory = (categoryId: MiniAppCategoryId): NearbyPlace[] =>
  NEARBY_PLACES.filter((entry) => entry.categoryId === categoryId)
    .sort((a, b) => a.distanceKm - b.distanceKm);

/** On-property first, and it is a different list, not a filtered one. */
export function onPropertyForCategory(categoryId: MiniAppCategoryId) {
  const venues = categoryId === 'dining'
    ? RESTAURANTS.map((venue) => ({
        id: venue.id,
        title: venue.name,
        detail: venue.location,
        price: venue.priceRange,
        image: storyImage(venue.id),
      }))
    : [];

  const services = SERVICES
    .filter((service) => service.categoryId === categoryId)
    .map((service) => ({
      id: service.id,
      title: service.name,
      detail: service.operator,
      price: service.price,
      image: storyImage(service.id),
    }));

  /*
    Deduped by name, venues winning.

    The catalogue carries the same dining rooms twice -- once as a venue with
    a floor and opening hours, once as a service with an operator -- so a
    naive merge listed Apartment 1B and In-room dining under each other. The
    venue entry is the richer of the two, so it is the one that survives.
  */
  const normalise = (name: string) => name.toLowerCase().replace(/[^a-z0-9]/g, '');
  const venueNames = venues.map((venue) => normalise(venue.title));

  return [
    ...venues,
    ...services.filter((service) => {
      const name = normalise(service.title);
      /*
        Prefix match, not equality: the catalogue calls the same room "The
        Poolside Bar" in one list and "The Poolside Bar & Lounge" in the
        other, and an exact comparison let both through.
      */
      return !venueNames.some((venue) => venue.startsWith(name) || name.startsWith(venue));
    }),
  ];
}
