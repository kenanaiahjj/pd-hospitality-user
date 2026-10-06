'use client';

import { ArrowRight, Path } from '@phosphor-icons/react';
import type { StayHotel, StaySearch } from './model';
import { ANYWHERE, allRegionTrails, searchHotels } from './model';
import { HotelResultCard } from './results';

/*
  Reasons to open a hotel, for a guest with nothing booked: themed rows drawn
  from the partner hotels, and the multi-stop trips. Everything is read off the
  hotel data and the dates in the search card, so a row empties itself when no
  hotel fits it and a sold-out night drops out.
*/

type Theme = { id: string; title: string; detail: string; pick: (hotel: StayHotel) => boolean };

const COOL_AIR = ['pinetop-baguio', 'ridgeline-tagaytay', 'valencia-forest-lodge'];

const THEMES: Theme[] = [
  { id: 'rated', title: 'Guest favourites', detail: 'Rated 9.0 and above', pick: (hotel) => hotel.rating >= 9 },
  { id: 'beach', title: 'Beach escapes', detail: 'Sand, reef and sunsets', pick: (hotel) => hotel.amenities.includes('beach') },
  { id: 'cool', title: 'Cool-air getaways', detail: 'Hills, highlands and forest', pick: (hotel) => COOL_AIR.includes(hotel.id) },
  { id: 'family', title: 'Good for families', detail: 'Room to spread out, with a pool', pick: (hotel) => hotel.amenities.includes('family') && hotel.amenities.includes('pool') },
  { id: 'budget', title: 'Easy on the budget', detail: 'Three-star stays worth the price', pick: (hotel) => hotel.stars === 3 },
];

export function ExploreRails({ search, onOpenHotel }: { search: StaySearch; onOpenHotel: (id: string) => void }) {
  const results = searchHotels({ ...search, location: ANYWHERE }).filter((result) => !result.soldOut);
  const trails = allRegionTrails();
  return (
    <>
      {trails.length ? (
        <section className="guest-empty-hotels" aria-labelledby="explore-trips-title">
          <div className="guest-section-heading"><h2 id="explore-trips-title">Trips of more than one stay</h2></div>
          <div className="sb-rail">
            {trails.map((trail) => (
              <button key={trail.id} type="button" className="sb-trip-card" onClick={() => onOpenHotel(trail.stops[0]!.hotel.id)} aria-label={`${trail.label}: ${trail.stops.map((stop) => stop.hotel.name).join(', then ')}`}>
                <span className="sb-trip-card__icon" aria-hidden="true"><Path /></span>
                <b>{trail.label}</b>
                <small>{trail.stops.map((stop) => stop.hotel.city).filter((city, index, cities) => city !== cities[index - 1]).join(' → ')}</small>
                <span className="sb-trip-card__foot">{trail.stops.length} hotels<ArrowRight aria-hidden="true" /></span>
              </button>
            ))}
          </div>
        </section>
      ) : null}

      {THEMES.map((theme) => {
        const picks = results.filter((result) => theme.pick(result.hotel)).sort((a, b) => b.hotel.rating - a.hotel.rating).slice(0, 8);
        if (!picks.length) return null;
        return (
          <section key={theme.id} className="guest-empty-hotels" aria-labelledby={`explore-${theme.id}-title`}>
            <div className="guest-section-heading">
              <h2 id={`explore-${theme.id}-title`}>{theme.title}</h2>
            </div>
            <p className="sb-small">{theme.detail}</p>
            <div className="sb-rail">
              {picks.map((result) => <HotelResultCard key={result.hotel.id} result={result} search={search} compact onOpen={() => onOpenHotel(result.hotel.id)} />)}
            </div>
          </section>
        );
      })}
    </>
  );
}
