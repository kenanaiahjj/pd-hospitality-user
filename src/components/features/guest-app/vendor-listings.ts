import { SERVICE_TIMES } from './prototype-model';

/*
  What a vendor publishes for scheduling: the times a guest can pick and how
  many a booking can be for.

  A stand-in for the vendor app. Today these are handwritten; when vendors list
  their own availability there, this is the one place the guest app reads it
  from, so the booking form and the service page never hard-code a time again.
  Nothing here is shaped to this file -- a listing is {kind, times, maxParty}.

  `reservation` is a table: free to hold, nothing ordered, nothing charged --
  the guest orders and pays at the venue, or charges the meal to the room there.
  `booking` is everything else with a slot: a treatment, a tour, a rental.
*/

export type VendorListing = {
  kind: 'reservation' | 'booking';
  /** The start times on offer each day, as the guest reads them. */
  times: readonly string[];
  /** The most one booking can be for. Absent means the stay's own party (at least two). */
  maxParty?: number;
};

/** A restaurant's id is not always its catalogue id: the venue page is `apartment-1b`, its bookable row is `restaurant`. */
export const TABLE_VENUE_SERVICE_IDS: Record<string, string> = {
  'poolside-bar': 'poolside-bar',
  'apartment-1b': 'restaurant',
  cafe: 'cafe',
  rooftop: 'rooftop',
  'the-dining-room': 'the-dining-room',
  'si-senor': 'si-senor',
  'popolo-pizzeria': 'popolo-pizzeria',
  'the-red-kitchen': 'the-red-kitchen',
  'noelles-brunch-bar': 'noelles-brunch-bar',
  'coffee-collective': 'coffee-collective',
};

const LISTINGS: Record<string, VendorListing> = {
  'poolside-bar': { kind: 'reservation', times: ['12:00 PM', '3:00 PM', '6:00 PM', '8:00 PM', '10:00 PM'], maxParty: 8 },
  // The Henry Manila's own outlets and its nearby partners (mock).
  restaurant: { kind: 'reservation', times: ['7:00 AM', '8:30 AM', '12:00 PM', '1:30 PM', '6:00 PM', '7:30 PM', '9:00 PM'], maxParty: 10 },
  cafe: { kind: 'reservation', times: ['7:00 AM', '9:00 AM', '12:00 PM', '3:00 PM', '5:00 PM'], maxParty: 6 },
  rooftop: { kind: 'reservation', times: ['6:00 PM', '7:30 PM', '9:00 PM', '10:30 PM'], maxParty: 8 },
  'bayleaf-kitchen': { kind: 'reservation', times: ['11:30 AM', '1:00 PM', '6:00 PM', '7:30 PM', '9:00 PM'], maxParty: 8 },
  'sunset-roasters': { kind: 'reservation', times: ['8:00 AM', '10:00 AM', '12:00 PM', '3:00 PM', '5:00 PM'], maxParty: 6 },
  // The Henry Resort Dumaguete's restaurants: the times and party sizes the pilot set.
  'the-dining-room': { kind: 'reservation', times: ['12:00 PM', '6:00 PM', '7:00 PM', '8:00 PM'], maxParty: 10 },
  'si-senor': { kind: 'reservation', times: ['6:00 PM', '7:00 PM', '8:00 PM'], maxParty: 10 },
  'popolo-pizzeria': { kind: 'reservation', times: ['12:00 PM', '6:30 PM', '7:30 PM'], maxParty: 10 },
  'the-red-kitchen': { kind: 'reservation', times: ['6:00 PM', '7:00 PM'], maxParty: 8 },
  'noelles-brunch-bar': { kind: 'reservation', times: ['8:00 AM', '10:00 AM', '12:00 PM'], maxParty: 10 },
  'coffee-collective': { kind: 'reservation', times: ['8:00 AM', '10:00 AM', '3:00 PM'], maxParty: 10 },
  // Dumaguete bookings with their own times: the boat runs twice a day, the resort's activities once.
  'apo-island-trip': { kind: 'booking', times: ['7:30 AM', '1:30 PM'], maxParty: 8 },
  'walking-tour': { kind: 'booking', times: ['8:00 AM'], maxParty: 10 },
  'yoga-class': { kind: 'booking', times: ['6:30 AM', '5:30 PM'], maxParty: 12 },
  diving: { kind: 'booking', times: ['7:00 AM'], maxParty: 6 },
  'bike-rental': { kind: 'booking', times: ['8:00 AM', '9:00 AM', '10:00 AM', '1:30 PM'], maxParty: 6 },
  'scooter-rental': { kind: 'booking', times: ['9:00 AM', '10:00 AM', '1:30 PM'], maxParty: 4 },
  // Partners nearby, publishing their own tables through the vendor app.
  'boulevard-seafood-grill': { kind: 'reservation', times: ['11:30 AM', '1:00 PM', '5:30 PM', '7:00 PM'], maxParty: 8 },
};

export const listingFor = (serviceId: string): VendorListing => LISTINGS[serviceId] ?? { kind: 'booking', times: SERVICE_TIMES };

export const isReservation = (serviceId: string) => listingFor(serviceId).kind === 'reservation';
