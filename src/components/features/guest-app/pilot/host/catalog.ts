import { GIFT_PRODUCTS, LOBBY_SHOP_NAME } from '../../dining';
import { NEARBY_ESTABLISHMENTS, tableTimes } from '../../places';
import { acceptsPayNow, cancellationCutoffHours, parseClockTime, parsePesoAmount, rentalUnitFor, SERVICES, SERVICE_SCHEDULES } from '../../prototype-model';
import { SERVICE_VENUES } from '../../promoted/service-venues';
import { isReservation, listingFor } from '../../vendor-listings';
import type { Listing, Vendor } from '../types';

/*
  The app's own catalogue, as the engine reads it: every service, table, rental,
  nearby place and lobby-shop product becomes a listing, and every venue a
  vendor. Nothing is invented here: the names, prices, times and cutoffs come
  from the rows the guest already sees, so a booking made through the engine
  is a booking of the thing they tapped.

  Which bookings wait for the vendor (Ken, 7 Oct): rentals and the boat-style
  tours. Everything else is taken at once.
*/

let versionMemo: string | undefined;
/**
  A fingerprint of the catalogue the engine is built from. A record kept for one
  catalogue is only replayed against the same one: change a price or a time and
  the old record is let go instead of being played against listings it never saw.
*/
export function catalogVersion(): string {
  if (!versionMemo) {
    const text = JSON.stringify(buildCatalog());
    let h = 5381;
    for (let i = 0; i < text.length; i += 1) h = ((h * 33) ^ text.charCodeAt(i)) >>> 0;
    versionMemo = `c${h.toString(36)}`;
  }
  return versionMemo;
}

const HH = (time: string): string => {
  const { hour, minute } = parseClockTime(time);
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
};
const hours = (open: number, close: number) => ({ open: open * 60, close: close * 60 });

/** Services that wait for the operator to say yes, besides every rental. */
const CONFIRM_FIRST_SERVICES = new Set(['tour', 'sunset-cruise', 'sunset-bay-cruises', 'manila-heritage-walks']);
/** Not bookings: rides have their own flow, and an in-room dining order is a chat order. */
const NOT_BOOKABLE_HERE = new Set(['dining', 'transfer', 'private-car']);

const cancelHours = (cutoff: string): number => cancellationCutoffHours(cutoff) ?? 2;

export function buildCatalog(): { vendors: Vendor[]; listings: Listing[] } {
  const vendors = new Map<string, Vendor>();
  const listings: Listing[] = [];
  const vendor = (id: string, name: string, open: number, close: number, simulated = false) => {
    if (!vendors.has(id)) vendors.set(id, { id, name, simulated, ...hours(open, close) });
    return id;
  };
  const hotelId = vendor('the-henry', 'The Henry', 0, 24);

  // Services, tables and rentals the hotel lists.
  for (const service of SERVICES) {
    if (NOT_BOOKABLE_HERE.has(service.id)) continue;
    const venue = SERVICE_VENUES.find((v) => v.operates.includes(service.id));
    const vendorId = venue && venue.kind === 'venue' ? vendor(venue.id, venue.name, 8, 21) : hotelId;
    const price = parsePesoAmount(service.price);
    const base = {
      id: service.id,
      vendorId,
      title: service.name,
      freeCancelHours: cancelHours(service.cutoff),
      capacity: 12,
    };
    if (isReservation(service.id)) {
      const listing = listingFor(service.id);
      listings.push({ ...base, kind: 'table', confirm: 'instant', unitPrice: 0, times: listing.times.map(HH), maxParty: listing.maxParty ?? 10, durationMin: 90, capacity: 6, freeCancelHours: Number.POSITIVE_INFINITY, payModes: ['room'] });
      continue;
    }
    const schedule = SERVICE_SCHEDULES[service.id];
    const times = schedule ? [HH(schedule.time)] : listingFor(service.id).times.map(HH);
    const payModes = acceptsPayNow(service) ? (['room', 'card'] as const) : (['room'] as const);
    if (service.categoryId === 'rentals') {
      const unit = rentalUnitFor(service.id);
      listings.push({ ...base, unit: { one: unit.singular, many: unit.plural }, kind: 'rental', confirm: 'vendor', unitPrice: price, priceBasis: 'unit', times, durationMin: 600, returnBy: '20:00', capacity: 8, payModes: [...payModes] });
    } else {
      listings.push({ ...base, kind: 'service', confirm: CONFIRM_FIRST_SERVICES.has(service.id) ? 'vendor' : 'instant', unitPrice: price, priceBasis: 'booking', times, durationMin: 90, payModes: [...payModes] });
    }
  }

  // Nearby places that take bookings through Cabana.
  for (const place of NEARBY_ESTABLISHMENTS) {
    if (place.categoryId === 'gifts') continue;
    const vendorId = vendor(place.id, place.name, 7, 22);
    const integration = place.paymentIntegration;
    const times = tableTimes(place.hours).map(HH);
    const base = { id: place.id, vendorId, title: place.name, capacity: 8, times: times.length ? times : ['10:00'], freeCancelHours: 2 };
    if (place.categoryId === 'dining') {
      // Partners publish their own tables; the rest are asked for a table.
      // The slots the table sheet offers are `listingFor(id).times`, so the engine must offer exactly those.
      const own = listingFor(place.id);
      listings.push({ ...base, kind: 'table', confirm: 'instant', unitPrice: 0, times: own.times.map(HH), maxParty: own.maxParty ?? 10, durationMin: 90, capacity: 6, freeCancelHours: Number.POSITIVE_INFINITY, payModes: ['room'] });
    } else if (place.categoryId === 'rentals') {
      listings.push({ ...base, kind: 'rental', confirm: 'vendor', unitPrice: integration?.amount ?? 0, priceBasis: 'unit', durationMin: 600, returnBy: '20:00', payModes: ['room', 'card'] });
    } else {
      const guestBasis = integration?.basis === 'guest';
      listings.push({ ...base, kind: 'service', confirm: CONFIRM_FIRST_SERVICES.has(place.id) ? 'vendor' : 'instant', unitPrice: integration?.amount ?? 0, priceBasis: guestBasis ? 'unit' : 'booking', durationMin: 90, payModes: ['room', 'card'] });
    }
  }

  // The lobby shop: each product is a goods listing, held for the guest at the desk.
  const shopId = vendor('lobby-shop', LOBBY_SHOP_NAME, 0, 24);
  GIFT_PRODUCTS.forEach((product, index) => {
    listings.push({
      id: `gift-${index}`,
      vendorId: shopId,
      kind: 'goods',
      title: product.name,
      confirm: 'instant',
      unitPrice: parsePesoAmount(product.price),
      capacity: 30,
      times: [],
      orderCap: 10,
      freeCancelHours: 2,
      durationMin: 0,
      leadMin: 30,
      readyAt: '10:00',
      payModes: ['room'],
    });
  });

  return { vendors: [...vendors.values()], listings };
}

/** The listing id for a lobby-shop product. */
export const giftListingId = (productName: string): string | undefined => {
  const index = GIFT_PRODUCTS.findIndex((p) => p.name === productName);
  return index >= 0 ? `gift-${index}` : undefined;
};
