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

/** A restaurant's id is not its catalogue id: the venue page is `apartment-1b`, its bookable row is `restaurant`. */
export const TABLE_VENUE_SERVICE_IDS: Record<string, string> = {
  'apartment-1b': 'restaurant',
  'poolside-bar': 'poolside-bar',
  cafe: 'cafe',
  rooftop: 'rooftop',
};

const LISTINGS: Record<string, VendorListing> = {
  restaurant: { kind: 'reservation', times: ['7:00 AM', '8:30 AM', '12:00 PM', '1:30 PM', '6:00 PM', '7:30 PM', '9:00 PM'], maxParty: 10 },
  'poolside-bar': { kind: 'reservation', times: ['12:00 PM', '3:00 PM', '6:00 PM', '8:00 PM', '10:00 PM'], maxParty: 8 },
  cafe: { kind: 'reservation', times: ['7:00 AM', '9:00 AM', '12:00 PM', '3:00 PM', '5:00 PM'], maxParty: 6 },
  rooftop: { kind: 'reservation', times: ['6:00 PM', '7:30 PM', '9:00 PM', '10:30 PM'], maxParty: 8 },
  // Partners nearby, publishing their own tables through the vendor app.
  'bayleaf-kitchen': { kind: 'reservation', times: ['11:30 AM', '1:00 PM', '6:00 PM', '7:30 PM', '9:00 PM'], maxParty: 8 },
  'sunset-roasters': { kind: 'reservation', times: ['8:00 AM', '10:00 AM', '12:00 PM', '3:00 PM', '5:00 PM'], maxParty: 6 },
};

export const listingFor = (serviceId: string): VendorListing => LISTINGS[serviceId] ?? { kind: 'booking', times: SERVICE_TIMES };

export const isReservation = (serviceId: string) => listingFor(serviceId).kind === 'reservation';
