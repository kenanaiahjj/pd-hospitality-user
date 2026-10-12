import type { Listing, Vendor } from '../types';

/*
  The chat's worst case, for the break-ui audit: realistic data that the demo
  was (without meaning to) chosen to avoid. Long partner names, a long
  hyphenated guest name with diacritics, a three-letter partner, a listing
  title that wraps, a message with an unbreakable link, an emoji and a line
  break, a dozen unread messages.

  Dev only, and only with ?data=worst in the URL. It enters where the demo data
  does: the catalogue the engine is built from, the sample stay, the guest's
  name. Because the catalogue's fingerprint changes with it, flipping the
  toggle starts a fresh demo stay rather than replaying the other one.
*/

export const worstCaseOn = (): boolean =>
  process.env.NODE_ENV !== 'production' && typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('data') === 'worst';

export const WORST = {
  guestName: 'Aleksandra Wiśniewska-Kowalczyk',
  vendors: {
    'hilom-spa': 'Lá',
    'partner-local-guide': 'Dumaguete Local Guides — Food Crawls, Museums & Old Town Walks',
    'partner-boat-operator': 'Apo Island & Twin Reefs Boat Operators Cooperative of Dauin',
    'partner-bike-shop': 'Bisikleta',
    'cafe-sans-rival': 'Cafe Sans Rival — Pasalubong, Silvanas & Sans Rival Cakes',
  } as Record<string, string>,
  listings: {
    tour: 'Private Bais dolphin and whale watching with sandbar lunch & resort transfer',
    'bike-rental': 'Bike rental (with child seat, helmet & lock)',
    'apo-island-trip': 'Apo Island boat trip with snorkelling, turtle watching, lunch & resort transfer',
  } as Record<string, string>,
  phone: '+63 917 555 2216 loc. 4410',
  bikeNote: 'One with a child seat if you have it 🙏🏽\nAlso, could we return at 9 PM instead of 8? Our dinner at Café Niño runs late.',
  tourNote: 'The early boat, if there is a choice. My mother (78) uses a cane — is there a ramp at the pier?',
  bikeMessages: [
    'Two bikes are set for you. The child seat is on the second one, and helmets are in the basket.',
    'Track your booking here: https://example.com/bike-shop/bookings/9f8e7d6c-5b4a-4c3d-8e2f-1a0b9c8d7e6f?ref=cabana&lang=en',
    '9 PM is fine 👍',
    'ok',
    'Please bring your ID or passport.\nIf you are late, message us here.\nSalamat po!',
    'Benachrichtigungseinstellungen: please turn on notifications so you hear from us.',
    '<b>Reminder</b>: return to the driveway, ground floor &amp; leave the key with the guard.',
    '₱12,345,678.90? No — sorry, typo. The deposit is ₱0.',
    'Also, the lock code is 4410.',
    'See you tomorrow!',
    '.',
    'Last thing: helmets are size M and L. Tell us if you need an S.',
  ],
};

/** The catalogue with the worst-case names laid on: the same ids, the same everything else. */
export function applyWorstCatalog(catalog: { vendors: Vendor[]; listings: Listing[] }): { vendors: Vendor[]; listings: Listing[] } {
  return {
    vendors: catalog.vendors.map((v) => ({ ...v, name: WORST.vendors[v.id] ?? v.name, phone: v.id === 'partner-bike-shop' ? WORST.phone : v.phone })),
    listings: catalog.listings.map((l) => ({ ...l, title: WORST.listings[l.id] ?? l.title })),
  };
}
