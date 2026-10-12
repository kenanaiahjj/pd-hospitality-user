import { GIFT_PRODUCTS, LOBBY_SHOP_NAME, SANS_RIVAL_NAME, SANS_RIVAL_PRODUCTS } from '../../dining';
import { applyWorstCatalog, worstCaseOn } from './worst-case';
import { NEARBY_ESTABLISHMENTS, tableTimes } from '../../places';
import { acceptsPayNow, RESTAURANTS, cancellationCutoffHours, parseClockTime, parsePesoAmount, rentalUnitFor, SERVICES, SERVICE_SCHEDULES } from '../../prototype-model';
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
/** "7:00 AM – 3:00 PM" → 7 and 15: a venue's own hours, as its page shows them. */
const opensAt = (range: string) => parseClockTime(range.split(/[–-]/)[0]!.trim()).hour;
const closesAt = (range: string) => { const hour = parseClockTime(range.split(/[–-]/)[1]?.trim() ?? '10:00 PM').hour; return hour === 0 ? 24 : hour; };

/** Services that wait for the operator to say yes, besides every rental: boat and island trips, and outside guides. */
const CONFIRM_FIRST_SERVICES = new Set(['tour', 'sunset-cruise', 'apo-island-trip', 'casaroro-falls-guide', 'manila-island-tour', 'manila-sunset-cruise', 'sunset-bay-cruises', 'manila-heritage-walks']);
/** Not bookings: rides have their own flow, and an in-room dining order is a chat order. */
const NOT_BOOKABLE_HERE = new Set(['dining', 'transfer', 'private-car']);

const cancelHours = (cutoff: string): number => cancellationCutoffHours(cutoff) ?? 2;

/** The Henry Resort Dumaguete's front desk, the demo stay's hotel, as the estate record has it. */
const HOTEL_PHONE = '+63 35 422 0100';
/** A demo number for a partner with none on file: in the fictional 555 range the nearby places use, steady for each partner. */
const demoPhone = (id: string) => `+63 917 555 ${String(2000 + ([...id].reduce((sum, ch) => sum * 31 + ch.charCodeAt(0), 7) % 7000)).padStart(4, '0')}`;

export function buildCatalog(): { vendors: Vendor[]; listings: Listing[] } {
  const vendors = new Map<string, Vendor>();
  const listings: Listing[] = [];
  const vendor = (id: string, name: string, open: number, close: number, phone?: string, simulated = false) => {
    if (!vendors.has(id)) vendors.set(id, { id, name, simulated, ...hours(open, close), phone: phone ?? demoPhone(id) });
    return id;
  };
  // The hotel's own outlets answer on the front desk's line.
  const hotelId = vendor('the-henry', 'The Henry', 0, 24, HOTEL_PHONE);
  vendors.get(hotelId)!.hotel = true;

  // Services, tables and rentals the hotel lists.
  for (const service of SERVICES) {
    if (NOT_BOOKABLE_HERE.has(service.id)) continue;
    const venue = SERVICE_VENUES.find((v) => v.operates.includes(service.id));
    // A partner restaurant on the resort is its own vendor, with its own chat; the hotel's outlets answer at the desk.
    const restaurant = service.operator === 'Partner on property' ? RESTAURANTS.find((r) => r.id === service.id) : undefined;
    const vendorId = restaurant
      ? vendor(restaurant.id, restaurant.name, opensAt(restaurant.hours), closesAt(restaurant.hours))
      : venue && venue.kind === 'venue' ? vendor(venue.id, venue.name, 8, 21) : hotelId;
    const price = parsePesoAmount(service.price);
    const base = {
      id: service.id,
      vendorId,
      title: service.name,
      freeCancelHours: cancelHours(service.cutoff),
      capacity: 12,
      meetAt: venue?.location,
      bring: 'requires' in service ? service.requires : undefined,
    };
    if (isReservation(service.id)) {
      const listing = listingFor(service.id);
      listings.push({ ...base, kind: 'table', confirm: 'instant', unitPrice: 0, times: listing.times.map(HH), maxParty: listing.maxParty ?? 10, durationMin: 90, capacity: 6, freeCancelHours: Number.POSITIVE_INFINITY, payModes: ['room'], ...(restaurant?.menuPdf ? { menuPdf: restaurant.menuPdf } : {}) });
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
    // Gifts are browsed, not booked; an independent is not on Cabana, so the guest calls it.
    if (place.categoryId === 'gifts' || !place.bookingIntegration) continue;
    const vendorId = vendor(place.id, place.name, 7, 22, place.contact);
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
  const shopId = vendor('lobby-shop', LOBBY_SHOP_NAME, 0, 24, HOTEL_PHONE);
  vendors.get(shopId)!.hotel = true;
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

  // Cafe Sans Rival: a partner on the resort, so it has its own chat. Room or card, ready at 17:00, 50 to an order.
  const sansRivalId = vendor('cafe-sans-rival', SANS_RIVAL_NAME, 8, 18);
  SANS_RIVAL_PRODUCTS.forEach((product, index) => {
    listings.push({
      id: `sans-rival-${index}`,
      vendorId: sansRivalId,
      kind: 'goods',
      title: product.name,
      confirm: 'instant',
      unitPrice: parsePesoAmount(product.price),
      capacity: 120,
      times: [],
      orderCap: 50,
      freeCancelHours: 24,
      durationMin: 0,
      readyAt: '17:00',
      payModes: ['room', 'card'],
    });
  });

  const built = { vendors: [...vendors.values()], listings };
  // The break-ui worst case, in dev with ?data=worst: the same catalogue under realistic worst-case names.
  return worstCaseOn() ? applyWorstCatalog(built) : built;
}

/** The listing id for a lobby-shop product. */
export const giftListingId = (productName: string): string | undefined => {
  const index = GIFT_PRODUCTS.findIndex((p) => p.name === productName);
  if (index >= 0) return `gift-${index}`;
  const pasalubong = SANS_RIVAL_PRODUCTS.findIndex((p) => p.name === productName);
  return pasalubong >= 0 ? `sans-rival-${pasalubong}` : undefined;
};
