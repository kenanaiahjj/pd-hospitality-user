import type { HotelResult, StayHotel } from './model';

/*
  "You might like", read off what a guest has already done: the hotels they
  stayed at, the stars and the brand, and what they spent on while there.
  Nothing is guessed for a guest with no history -- the caller shows no row.

  The shape a past stay needs is kept to what the account really holds, so this
  takes the few fields it reads rather than the whole PastStay.
*/

export type StayTaste = {
  property: string;
  city: string;
  /** Charge categories on the stay: "Spa & wellness", "Tours", "Dining"... */
  categories?: string[];
  guestCount?: number;
};

export type Recommendation = { result: HotelResult; reason: string };

/** "The Henry Cebu" and "The Henry Hotel Cebu" are one hotel. */
const nameKey = (name: string) => name.toLowerCase().replace(/\b(hotel|resort)\b/g, '').replace(/\s+/g, ' ').trim();

export function recommendFromStays(stays: StayTaste[], results: HotelResult[], limit = 6): { basedOn?: string; picks: Recommendation[] } {
  if (!stays.length) return { picks: [] };
  const hotels = results.map((result) => result.hotel);
  const visited = new Set<string>();
  const stayedAt: StayHotel[] = [];
  for (const stay of stays) {
    const hotel = hotels.find((candidate) => nameKey(candidate.name) === nameKey(stay.property));
    if (hotel) { visited.add(hotel.id); stayedAt.push(hotel); }
  }
  const lastStay = stays[0]!;
  const cities = new Set(stays.map((stay) => stay.city));
  const likesHenry = stayedAt.some((hotel) => hotel.henry);
  const stars = stayedAt.length ? Math.round(stayedAt.reduce((sum, hotel) => sum + hotel.stars, 0) / stayedAt.length) : undefined;
  const categories = new Set(stays.flatMap((stay) => stay.categories ?? []));
  const likesSpa = categories.has('Spa & wellness');
  const likesDining = categories.has('Dining');
  const family = stays.some((stay) => (stay.guestCount ?? 0) > 2);

  const scored = results
    .filter((result) => !result.soldOut && !visited.has(result.hotel.id))
    .map((result): Recommendation & { score: number } => {
      const { hotel } = result;
      let score = hotel.rating / 5;
      let reason = `Rated ${hotel.rating.toFixed(1)} by guests`;
      if (likesHenry && hotel.henry) { score += 3; reason = `The Henry, like your stay in ${lastStay.city}`; }
      if (likesSpa && hotel.amenities.includes('spa')) { score += 2.5; if (!hotel.henry || !likesHenry) reason = `Has a spa, like the one you booked in ${lastStay.city}`; }
      if (stars !== undefined && hotel.stars === stars) { score += 1.5; if (reason.startsWith('Rated')) reason = `${hotel.stars}-star, like ${lastStay.property}`; }
      if (likesDining && hotel.amenities.includes('restaurant')) score += 0.5;
      if (family && hotel.amenities.includes('family')) { score += 1; if (reason.startsWith('Rated')) reason = 'Room for the whole group'; }
      // A new city is the point of a second trip; the city already visited is the one they know.
      if (!cities.has(hotel.city)) score += 0.75;
      return { result, reason, score };
    })
    .sort((a, b) => b.score - a.score);

  return {
    basedOn: lastStay.property,
    picks: scored.slice(0, limit).map(({ result, reason }) => ({ result, reason })),
  };
}
