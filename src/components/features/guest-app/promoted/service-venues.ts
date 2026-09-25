import { SERVICES } from '../prototype-model';
import type { ServiceImageDefinition } from '../service-images';
import { PROPERTY_IMAGE, storyImage } from './story-imagery';

/*
  Mock venue accounts for services.

  The catalogue models restaurants as venues -- a name, a location, someone
  who runs it -- and models services as bare line items. That is fine for a
  booking list and wrong for a feed: "Hilom signature massage" is a treatment,
  not an account, and a treatment cannot publish anything. The spa can.

  So these are the accounts behind the service catalogue. Handwritten, because
  a generated name ("Spa Services") is the thing that makes a prototype read
  as a prototype. Every non-dining service maps to one, and a test fails if a
  new service arrives without a home.

  Promotion: this is a stand-in for venue rows the real catalogue should own.
  A promoted flow reads them from the PMS middleware alongside the
  restaurants; nothing here is shaped to this file.
*/

export type ServiceVenue = {
  id: string;
  /** The account name, as it would sign a post. */
  name: string;
  /** Where to find it, or how it reaches the guest. */
  location: string;
  /**
   * `property` is the hotel operating under its own name; `venue` is a tenant
   * or partner with an identity of its own. The guest is entitled to know
   * which, and the two are worth different money in a promoted slot.
   */
  kind: 'property' | 'venue';
  /** Catalogue ids this venue runs. */
  operates: string[];
  /** The account's face. */
  image: ServiceImageDefinition;
};

export const SERVICE_VENUES: ServiceVenue[] = [
  {
    id: 'hilom-spa',
    name: 'Hilom Spa & Wellness',
    location: 'Fourth floor, east wing',
    kind: 'venue',
    operates: ['spa', 'scrub', 'hot-stone', 'couples-massage', 'facial', 'sauna'],
    image: storyImage('spa'),
  },
  {
    id: 'sinag-beauty',
    name: 'Sinag Beauty Bar',
    location: 'Ground floor arcade',
    kind: 'venue',
    operates: ['mani-pedi', 'barber'],
    image: storyImage('facial'),
  },
  {
    id: 'lakbay-tours',
    name: 'Lakbay Island Tours',
    location: 'Tour desk, lobby',
    kind: 'venue',
    operates: ['tour', 'sunset-cruise', 'diving'],
    image: storyImage('tour'),
  },
  {
    id: 'kalye-walks',
    name: 'Kalye Manila Walks',
    location: 'Meets at the lobby doors',
    kind: 'venue',
    operates: ['heritage-walk', 'food-crawl', 'museum-pass'],
    image: storyImage('heritage-walk'),
  },
  {
    id: 'sakay-rentals',
    name: 'Sakay Rentals',
    location: 'Driveway, ground floor',
    kind: 'venue',
    operates: ['scooter', 'motorcycle', 'e-bike'],
    image: storyImage('food-crawl'),
  },
  {
    id: 'byahe-car-rental',
    name: 'Byahe Car Rental',
    location: 'Driveway, ground floor',
    kind: 'venue',
    operates: ['car-rental', 'suv-rental'],
    image: PROPERTY_IMAGE,
  },
  {
    id: 'bantay-care',
    name: 'Bantay Care',
    location: 'On call, through the desk',
    kind: 'venue',
    operates: ['babysitting', 'doctor', 'kids-club'],
    image: PROPERTY_IMAGE,
  },
  {
    id: 'bulaklak-studio',
    name: 'Bulaklak Flower Studio',
    location: 'Arranged through the desk',
    kind: 'venue',
    operates: ['celebration'],
    image: storyImage('couples-massage'),
  },
  /*
    The hotel's own account, and the fallback.

    Everything the property runs itself posts here rather than under a made-up
    department name -- a guest reading "Housekeeping" and "Recreation" as two
    different accounts learns an org chart, not a hotel.
  */
  {
    id: 'the-henry-manila',
    name: 'The Henry Manila',
    location: 'Front desk, lobby',
    kind: 'property',
    operates: [
      'reflexology', 'cooking-class', 'music', 'film-night',
      'transfer', 'private-car', 'rental', 'laundry', 'luggage',
      'trainer', 'meeting-room', 'gym', 'pool', 'business-centre',
    ],
    image: PROPERTY_IMAGE,
  },
];

const BY_SERVICE = new Map<string, ServiceVenue>(
  SERVICE_VENUES.flatMap((venue) => venue.operates.map((id) => [id, venue] as const)),
);

/** The property's own account, which is also where anything unclaimed lands. */
export const HOUSE_ACCOUNT = SERVICE_VENUES.find((venue) => venue.kind === 'property')!;

/**
 * The account behind a service.
 *
 * Falls back to the house rather than returning undefined: an unmapped
 * service is still run by somebody, and the hotel is the safe answer. The
 * test below is what stops the fallback becoming the answer for everything.
 */
export const venueForService = (serviceId: string): ServiceVenue =>
  BY_SERVICE.get(serviceId) ?? HOUSE_ACCOUNT;

/** Service ids with no venue of their own. Empty is the passing state. */
export const unclaimedServiceIds = (): string[] =>
  SERVICES
    .filter((service) => service.categoryId !== 'dining')
    .filter((service) => !BY_SERVICE.has(service.id))
    .map((service) => service.id);
