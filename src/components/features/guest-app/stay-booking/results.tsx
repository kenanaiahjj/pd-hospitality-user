'use client';

import Image from 'next/image';
import dynamic from 'next/dynamic';
import { CheckCircle, FadersHorizontal, ListBullets, MapTrifold, PencilSimple, Star, Warning, X } from '@phosphor-icons/react';
import { useState } from 'react';
import type { Amenity, HotelResult, PriceBand, StayFilters, StaySearch, StaySort } from './model';
import { AMENITY_LABELS, ANYWHERE, NO_FILTERS, PRICE_BANDS, countFilters, findLocation, partyLabel, peso, searchHotels } from './model';
import { nightsLabel, stayDatesLabel } from './format';
import { StaySearchSheet } from './search-form';

// Leaflet reads `window` at import; the list view must not pay for it.
const StayResultsMap = dynamic(() => import('./results-map').then((module) => module.StayResultsMap), { ssr: false });

export type ResultsView = { sort: StaySort; filters: StayFilters; mode: 'list' | 'map' };
export const DEFAULT_RESULTS_VIEW: ResultsView = { sort: 'recommended', filters: NO_FILTERS, mode: 'list' };

const SORTS: { id: StaySort; label: string }[] = [
  { id: 'recommended', label: 'Recommended' },
  { id: 'price', label: 'Lowest price' },
  { id: 'rating', label: 'Top rated' },
  { id: 'distance', label: 'Nearest' },
];

const FILTER_AMENITIES: Amenity[] = ['pool', 'beach', 'breakfast', 'spa', 'airport-transfer', 'family', 'gym', 'parking'];

export function StayResultsScreen({ search, view, onViewChange, onSearch, onOpenHotel }: {
  search: StaySearch;
  view: ResultsView;
  onViewChange: (view: ResultsView) => void;
  onSearch: (search: StaySearch) => void;
  onOpenHotel: (id: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const hasPlace = Boolean(findLocation(search.location)?.center);
  const sort = view.sort === 'distance' && !hasPlace ? 'recommended' : view.sort;
  const results = searchHotels(search, view.filters, sort);
  const filterCount = countFilters(view.filters);
  const place = search.location === ANYWHERE ? 'the Philippines' : search.location;

  return (
    <div className="guest-stack sb-results">
      <button type="button" className="sb-summary" onClick={() => setEditing(true)} aria-label={`Change search: ${search.location}, ${stayDatesLabel(search.checkIn, search.checkOut)}, ${partyLabel(search)}`}>
        <span><b>{search.location}</b><small>{stayDatesLabel(search.checkIn, search.checkOut)} · {partyLabel(search)}</small></span>
        <PencilSimple aria-hidden="true" />
      </button>
      {editing ? <StaySearchSheet value={search} title="Change search" submitLabel="Update search" onClose={() => setEditing(false)} onSearch={(next) => { setEditing(false); onSearch(next); }} /> : null}

      <div className="sb-results__head">
        <h1 className="sb-results__title">{results.length} {results.length === 1 ? 'stay' : 'stays'} in {place}</h1>
        <div className="sb-segmented" role="group" aria-label="View">
          <button type="button" aria-pressed={view.mode === 'list'} onClick={() => onViewChange({ ...view, mode: 'list' })}><ListBullets aria-hidden="true" />List</button>
          <button type="button" aria-pressed={view.mode === 'map'} onClick={() => onViewChange({ ...view, mode: 'map' })}><MapTrifold aria-hidden="true" />Map</button>
        </div>
      </div>

      <div className="sb-chips" role="group" aria-label="Sort by">
        <button type="button" className={`sb-chip sb-chip--filter${filterCount ? ' is-active' : ''}`} onClick={() => setFiltersOpen(true)}>
          <FadersHorizontal aria-hidden="true" />Filters{filterCount ? ` · ${filterCount}` : ''}
        </button>
        {SORTS.filter((option) => option.id !== 'distance' || hasPlace).map((option) => (
          <button key={option.id} type="button" className={`sb-chip${sort === option.id ? ' is-active' : ''}`} aria-pressed={sort === option.id} onClick={() => onViewChange({ ...view, sort: option.id })}>
            {option.label}
          </button>
        ))}
      </div>

      {!results.length ? (
        <div className="sb-empty">
          <b>No stays match</b>
          <p>{filterCount ? 'Try fewer filters, or look further afield.' : `No partner hotels in ${place} yet.`}</p>
          <div className="sb-empty__actions">
            {filterCount ? <button type="button" className="guest-button guest-button--secondary" onClick={() => onViewChange({ ...view, filters: NO_FILTERS })}>Clear filters</button> : null}
            {search.location !== ANYWHERE ? <button type="button" className="guest-button guest-button--secondary" onClick={() => onSearch({ ...search, location: ANYWHERE })}>Search anywhere</button> : null}
          </div>
        </div>
      ) : view.mode === 'map' ? (
        <StayResultsMap results={results} onOpenHotel={onOpenHotel} />
      ) : (
        <div className="sb-results__list">
          {results.map((result) => <HotelResultCard key={result.hotel.id} result={result} search={search} onOpen={() => onOpenHotel(result.hotel.id)} />)}
        </div>
      )}

      {filtersOpen ? (
        <FilterSheet
          filters={view.filters}
          onClose={() => setFiltersOpen(false)}
          onApply={(filters) => { onViewChange({ ...view, filters }); setFiltersOpen(false); }}
          preview={(filters) => searchHotels(search, filters, sort).length}
        />
      ) : null}
    </div>
  );
}

export function HotelResultCard({ result, search, onOpen, compact }: { result: HotelResult; search: StaySearch; onOpen: () => void; compact?: boolean }) {
  const { hotel } = result;
  return (
    <button type="button" className={`sb-hotel-card${compact ? ' sb-hotel-card--compact' : ''}${result.soldOut ? ' is-sold-out' : ''}`} onClick={onOpen} aria-label={`${hotel.name}, ${hotel.area}${result.fromPrice !== undefined && !result.soldOut ? `, from ${peso(result.fromPrice)} a night` : ', sold out on your dates'}`}>
      <span className="sb-hotel-card__photo">
        <Image src={hotel.image.src} alt="" fill sizes={compact ? '260px' : '(max-width: 720px) calc(100vw - 32px), 440px'} style={{ objectPosition: hotel.image.focalPoint }} />
        {hotel.henry ? <span className="sb-hotel-card__badge">The Henry</span> : null}
      </span>
      <span className="sb-hotel-card__body">
        <span className="sb-hotel-card__top">
          <span className="sb-stars" aria-label={`${hotel.stars}-star hotel`}>{Array.from({ length: hotel.stars }, (_, i) => <Star key={i} weight="fill" aria-hidden="true" />)}</span>
          <span className="sb-rating"><b>{hotel.rating.toFixed(1)}</b><small>{hotel.reviews.toLocaleString('en-US')} reviews</small></span>
        </span>
        <b className="sb-hotel-card__name">{hotel.name}</b>
        <small className="sb-hotel-card__area">{hotel.area}{result.distanceKm !== undefined ? ` · ${result.distanceKm} km from centre` : ''}</small>
        {!compact ? (
          <span className="sb-hotel-card__amenities">
            {hotel.amenities.slice(0, 3).map((amenity) => <span key={amenity}>{AMENITY_LABELS[amenity]}</span>)}
          </span>
        ) : null}
        <span className="sb-hotel-card__foot">
          <span className="sb-hotel-card__notes">
            {result.soldOut ? <span className="sb-note sb-note--warning"><Warning aria-hidden="true" />Sold out on your dates</span>
              : !result.fitsParty ? <span className="sb-note sb-note--warning"><Warning aria-hidden="true" />Not enough rooms for {partyLabel(search)}</span>
                : result.freeCancellation ? <span className="sb-note sb-note--positive"><CheckCircle weight="fill" aria-hidden="true" />Free cancellation</span> : null}
          </span>
          {result.fromPrice !== undefined && !result.soldOut ? (
            <span className="sb-price">
              <small>from</small>
              <b>{peso(result.fromPrice)}</b>
              <small>per night · {nightsLabel(search.checkIn, search.checkOut)}</small>
            </span>
          ) : null}
        </span>
      </span>
    </button>
  );
}

function toggle<T>(list: T[], item: T): T[] {
  return list.includes(item) ? list.filter((value) => value !== item) : [...list, item];
}

function FilterSheet({ filters, onApply, onClose, preview }: { filters: StayFilters; onApply: (filters: StayFilters) => void; onClose: () => void; preview: (filters: StayFilters) => number }) {
  const [draft, setDraft] = useState(filters);
  const count = preview(draft);
  return (
    <div className="guest-sheet-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="guest-order-tray sb-filters" role="dialog" aria-modal="true" aria-labelledby="sb-filters-title">
        <header className="guest-order-tray__header">
          <div><h2 id="sb-filters-title">Filters</h2></div>
          <button className="guest-order-tray__close" type="button" onClick={onClose} aria-label="Close filters"><X /></button>
        </header>
        <div className="guest-order-tray__scroll sb-filters__body">
          <fieldset>
            <legend>Price per night</legend>
            <div className="sb-chips sb-chips--wrap">
              {(Object.keys(PRICE_BANDS) as PriceBand[]).map((band) => (
                <button key={band} type="button" className={`sb-chip${draft.price.includes(band) ? ' is-active' : ''}`} aria-pressed={draft.price.includes(band)} onClick={() => setDraft({ ...draft, price: toggle(draft.price, band) })}>{PRICE_BANDS[band].label}</button>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend>Star rating</legend>
            <div className="sb-chips sb-chips--wrap">
              {[5, 4, 3].map((stars) => (
                <button key={stars} type="button" className={`sb-chip${draft.stars.includes(stars) ? ' is-active' : ''}`} aria-pressed={draft.stars.includes(stars)} onClick={() => setDraft({ ...draft, stars: toggle(draft.stars, stars) })}>{stars} stars</button>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend>Amenities</legend>
            <div className="sb-chips sb-chips--wrap">
              {FILTER_AMENITIES.map((amenity) => (
                <button key={amenity} type="button" className={`sb-chip${draft.amenities.includes(amenity) ? ' is-active' : ''}`} aria-pressed={draft.amenities.includes(amenity)} onClick={() => setDraft({ ...draft, amenities: toggle(draft.amenities, amenity) })}>{AMENITY_LABELS[amenity]}</button>
              ))}
            </div>
          </fieldset>
          <label className="sb-switch">
            <span><b>Free cancellation</b><small>Only hotels with a refundable rate on your dates</small></span>
            <input type="checkbox" role="switch" checked={draft.freeCancellation} onChange={(event) => setDraft({ ...draft, freeCancellation: event.currentTarget.checked })} />
          </label>
        </div>
        <footer className="guest-order-tray__footer sb-filters__footer">
          <button type="button" className="guest-button guest-button--secondary" onClick={() => setDraft(NO_FILTERS)} disabled={!countFilters(draft)}>Clear</button>
          <button type="button" className="guest-button guest-button--primary" onClick={() => onApply(draft)}>Show {count} {count === 1 ? 'stay' : 'stays'}</button>
        </footer>
      </section>
    </div>
  );
}
