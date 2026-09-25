'use client';

import 'leaflet/dist/leaflet.css';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import type { LatLngExpression, LayerGroup, Map as LeafletMap } from 'leaflet';
import { openStatus, parseDistanceMetres, walkLabel } from './nearby-place';

/*
  Nearby places on a map, with the hotel at the centre.

  Laid out like a maps app's Places view: the map runs edge to edge, each
  place is a labelled pin (a category glyph and its name), the chosen one
  grows into its photograph, and a rail of cards floats over the bottom.
  Pins that would sit on each other merge into a count until the map is
  zoomed in far enough to part them.

  Leaflet over Esri's Light Gray Canvas: a muted base of soft roads and
  quiet labels, warmed a touch in CSS, so the photo pins carry the colour
  -- the look of a maps app's muted style. OpenStreetMap's standard tiles,
  greyed, stayed busy (every land use still drawn), and CARTO's grey tiles
  need a key. Leaflet touches `window`, so it is imported inside the effect
  rather than at module load, which keeps the page prerenderable.
*/

type LatLng = [number, number];

/** Where each hotel is. A pin for a city without one would be a guess. */
const HOTEL_POSITIONS: Record<string, LatLng> = {
  Manila: [14.5436, 120.9953],
  Cebu: [10.3181, 123.9790],
};

/*
  Which way each place lies from the hotel, from its street address. The
  pin is then set at the place's own stated distance along that bearing, so
  "280 m away" on the card and the pin on the map say the same thing.
*/
const PLACE_DIRECTIONS: Record<string, LatLng> = {
  'kape-lab-manila': [14.5700, 120.9830],
  'bayleaf-kitchen': [14.5755, 120.9800],
  'sunset-roasters': [14.5650, 120.9850],
  'hilot-house': [14.5700, 120.9860],
  'bamboo-wellness': [14.5745, 120.9890],
  'quiet-corner-yoga': [14.5710, 120.9930],
  'manila-heritage-walks': [14.5915, 120.9737],
  'sunset-bay-cruises': [14.5530, 120.9830],
  'intramuros-cycling': [14.5890, 120.9750],
  'escolta-craft-market': [14.5985, 120.9780],
  'manila-laundry-co': [14.5520, 120.9960],
  'city-bike-rentals': [14.5720, 120.9820],
  'manila-makers-market': [14.5982, 120.9790],
  'binondo-pasalubong': [14.6010, 120.9745],
  'artisan-home-studio': [14.5978, 120.9800],
};

const METRES_PER_DEGREE = 111_320;

export { parseDistanceMetres };

/** The point `metres` from `from`, heading toward `toward`. */
export function pointToward(from: LatLng, toward: LatLng, metres: number): LatLng {
  const dLat = toward[0] - from[0];
  const dLng = (toward[1] - from[1]) * Math.cos((from[0] * Math.PI) / 180);
  const length = Math.hypot(dLat, dLng) || 1;
  const step = metres / METRES_PER_DEGREE;
  return [
    from[0] + (dLat / length) * step,
    from[1] + ((dLng / length) * step) / Math.cos((from[0] * Math.PI) / 180),
  ];
}

export type NearbyMapPlace = {
  id: string;
  name: string;
  type: string;
  distance?: string;
  image: string;
  categoryId: string;
  hours?: string;
};

/** The prototype's "now": the stay's date and the feed clock's hour. */
export type MapClock = { date: string; hour: number };

type Props = {
  city: string;
  property: string;
  propertyImage: string;
  places: NearbyMapPlace[];
  now: MapClock;
  onSelect: (id: string) => void;
};

/* One glyph per category, drawn as a white stroke on the category's colour.
   Strings, because Leaflet's div icons take HTML rather than elements. */
const GLYPHS: Record<string, string> = {
  dining: '<path d="M7 3v7a2 2 0 0 0 2 2M11 3v7a2 2 0 0 1-2 2m0 0v9M17 3c-2 1-3 3-3 6s1 3 3 3v9"/>',
  spa: '<path d="M5 19c0-8 6-14 14-14 0 8-6 14-14 14zM5 19l7-7"/>',
  entertainment: '<circle cx="12" cy="12" r="8.5"/><path d="M15.5 8.5l-2 5-5 2 2-5z"/>',
  gifts: '<path d="M4 11h16v9H4zM3 7.5h18V11H3zM12 7.5V20M12 7.5c-1.5-4-6-3.5-4 0M12 7.5c1.5-4 6-3.5 4 0"/>',
  rentals: '<circle cx="6" cy="16" r="3.5"/><circle cx="18" cy="16" r="3.5"/><path d="M6 16l3.5-7h5L18 16M9.5 9l2.5 7h2"/>',
  services: '<path d="M5 8h14l-1 12H6zM9 8V6.5a3 3 0 0 1 6 0V8"/>',
};
const glyph = (categoryId: string) =>
  `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${GLYPHS[categoryId] ?? GLYPHS.services}</svg>`;

const escapeHtml = (text: string) => text.replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`);

const pillHtml = (place: NearbyMapPlace) =>
  `<span class="guest-map-pill" data-category="${place.categoryId}"><i>${glyph(place.categoryId)}</i><b>${escapeHtml(place.name)}</b></span>`;

const activeHtml = (place: NearbyMapPlace) =>
  `<span class="guest-map-photo"><img src="${place.image}" alt="" /></span><span class="guest-map-pill guest-map-pill--active" data-category="${place.categoryId}"><b>${escapeHtml(place.name)}</b></span>`;

const hotelHtml = (image: string, label: string) =>
  `<span class="guest-map-hotel"><img src="${image}" alt="" /></span><b class="guest-map-hotel__label">${escapeHtml(label)}</b>`;

type Placed = { place: NearbyMapPlace; at: LatLng };

/** Each place set at its stated distance, along its bearing from the hotel. */
export function placePositions(city: string, places: NearbyMapPlace[]): Placed[] {
  const hotel = HOTEL_POSITIONS[city];
  return places.flatMap((place) => {
    const toward = PLACE_DIRECTIONS[place.id];
    const metres = parseDistanceMetres(place.distance);
    return hotel && toward && metres ? [{ place, at: pointToward(hotel, toward, metres) }] : [];
  });
}

/**
 * Screen-space groups: two pills collide when their boxes would overlap.
 * Exported for the tests; the map calls it after every zoom.
 */
export function groupByCollision<T>(points: { item: T; x: number; y: number }[], width = 112, height = 34): T[][] {
  const groups: { x: number; y: number; items: T[] }[] = [];
  for (const point of points) {
    const hit = groups.find((group) => Math.abs(group.x - point.x) < width && Math.abs(group.y - point.y) < height);
    if (hit) hit.items.push(point.item);
    else groups.push({ x: point.x, y: point.y, items: [point.item] });
  }
  return groups.map((group) => group.items);
}

/** Base tiles and their labels, as separate layers so the labels stay crisp. */
function addTiles(L: typeof import('leaflet'), map: LeafletMap) {
  const canvas = 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas';
  L.tileLayer(`${canvas}/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}`, {
    attribution: 'Esri, HERE, Garmin, &copy; OpenStreetMap contributors',
    maxNativeZoom: 16,
    maxZoom: 18,
  }).addTo(map);
  L.tileLayer(`${canvas}/World_Light_Gray_Reference/MapServer/tile/{z}/{y}/{x}`, {
    maxNativeZoom: 16,
    maxZoom: 18,
    className: 'guest-map-labels',
  }).addTo(map);
}

/* The credit folds into an ⓘ, as a maps app keeps it: owed, not shouted. */
function addCredit(L: typeof import('leaflet'), map: LeafletMap) {
  map.attributionControl.setPrefix(false);
  const container = map.attributionControl.getContainer();
  if (!container) return;
  container.classList.add('guest-map-credit');
  const toggle = L.DomUtil.create('button', 'guest-map-credit__toggle', container.parentElement ?? undefined);
  toggle.type = 'button';
  toggle.textContent = 'i';
  toggle.setAttribute('aria-label', 'Map credits');
  L.DomEvent.disableClickPropagation(toggle);
  L.DomEvent.on(toggle, 'click', () => container.classList.toggle('is-open'));
}

export function NearbyMap({ city, property, propertyImage, places, now, onSelect }: Props) {
  const mapNode = useRef<HTMLDivElement>(null);
  const railRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const layoutRef = useRef<(() => void) | null>(null);
  const [activeId, setActiveId] = useState(places[0]?.id);
  // Read by Leaflet's handlers, which outlive the render that made them.
  const activeRef = useRef(activeId);
  const hotel = HOTEL_POSITIONS[city];

  const positions = placePositions(city, places);
  const placeKey = positions.map((entry) => entry.place.id).join(',');

  const choose = (id: string) => {
    setActiveId(id);
    railRef.current?.querySelector(`[data-place="${id}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  };
  const chooseRef = useRef(choose);
  useEffect(() => { chooseRef.current = choose; });

  // Build the map once per set of places.
  useEffect(() => {
    if (!mapNode.current || !hotel) return;
    let cancelled = false;
    void import('leaflet').then((L) => {
      if (cancelled || !mapNode.current) return;
      const map = L.map(mapNode.current, { zoomControl: false, attributionControl: true, zoomSnap: 0.25 }).setView(hotel, 15);
      addTiles(L, map);
      addCredit(L, map);
      L.marker(hotel, {
        icon: L.divIcon({ className: 'guest-map-marker guest-map-marker--hotel', html: hotelHtml(propertyImage, property), iconSize: [44, 44], iconAnchor: [22, 22] }),
        keyboard: false,
        zIndexOffset: 1000,
      }).addTo(map);

      const layer: LayerGroup = L.layerGroup().addTo(map);
      /* Re-laid after every zoom and every change of place: the chosen place
         always stands alone, and the rest merge where their pills collide. */
      const layout = () => {
        layer.clearLayers();
        const active = positions.find((entry) => entry.place.id === activeRef.current);
        const rest = positions.filter((entry) => entry !== active);
        const groups = groupByCollision(rest.map((entry) => {
          const point = map.latLngToLayerPoint(entry.at);
          return { item: entry, x: point.x, y: point.y };
        }));
        for (const group of groups) {
          if (group.length === 1) {
            const { place, at } = group[0]!;
            L.marker(at, {
              // Anchored at the dot, on the left of the pill: the dot is the place.
              icon: L.divIcon({ className: 'guest-map-marker', html: pillHtml(place), iconSize: undefined, iconAnchor: [13, 13] }),
              title: place.name,
            }).on('click', () => chooseRef.current(place.id)).addTo(layer);
          } else {
            const bounds = L.latLngBounds(group.map((entry) => entry.at as LatLngExpression));
            L.marker(bounds.getCenter(), {
              icon: L.divIcon({ className: 'guest-map-marker', html: `<span class="guest-map-cluster">${group.length}</span>`, iconSize: [34, 34], iconAnchor: [17, 17] }),
              title: `${group.length} places`,
            }).on('click', () => {
              if (map.getZoom() >= map.getMaxZoom()) chooseRef.current(group[0]!.place.id);
              else map.flyToBounds(bounds.pad(0.6), { maxZoom: map.getMaxZoom(), duration: 0.35 });
            }).addTo(layer);
          }
        }
        if (active) {
          L.marker(active.at, {
            // Anchored at the photo's tail: the chosen pin stands on its place.
            icon: L.divIcon({ className: 'guest-map-marker guest-map-marker--active', html: activeHtml(active.place), iconSize: [56, 56], iconAnchor: [28, 62] }),
            title: active.place.name,
            zIndexOffset: 800,
          }).addTo(layer);
        }
      };
      layoutRef.current = layout;
      map.on('zoomend', layout);

      if (positions.length) {
        // Room above for the tallest pin, and below for the cards and the tab bar under them.
        map.fitBounds(L.latLngBounds([hotel, ...positions.map((entry) => entry.at)]), { paddingTopLeft: [40, 90], paddingBottomRight: [40, 300], maxZoom: 16 });
      }
      layout();
      mapRef.current = map;
    });
    return () => {
      cancelled = true;
      layoutRef.current = null;
      mapRef.current?.remove();
      mapRef.current = null;
    };
    // `positions` is derived from `placeKey`; rebuilding on its identity would rebuild every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [placeKey, hotel, property, propertyImage]);

  // The chosen place stands out, and the map follows it once it would leave the frame.
  useEffect(() => {
    activeRef.current = activeId;
    layoutRef.current?.();
    const map = mapRef.current;
    const active = positions.find((entry) => entry.place.id === activeId);
    if (map && active && !map.getBounds().pad(-0.18).contains(active.at)) map.panTo(active.at, { animate: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId]);

  if (!hotel || !positions.length) {
    return <p className="guest-nearby-map__empty">No nearby places to map yet.</p>;
  }

  return (
    <div className="guest-nearby-map">
      <div ref={mapNode} className="guest-nearby-map__canvas" role="region" aria-label={`Map of places near ${property}`} />
      <div
        ref={railRef}
        className="guest-nearby-map__rail"
        onScroll={(event) => {
          const rail = event.currentTarget;
          const card = rail.querySelector<HTMLElement>('.guest-nearby-map__card');
          if (!card) return;
          const index = Math.round(rail.scrollLeft / (card.offsetWidth + 10));
          const next = positions[Math.min(positions.length - 1, Math.max(0, index))]?.place.id;
          if (next && next !== activeId) setActiveId(next);
        }}
      >
        {positions.map(({ place }) => (
          <PlaceCard key={place.id} place={place} now={now} active={place.id === activeId} onSelect={onSelect} />
        ))}
      </div>
    </div>
  );
}

function PlaceCard({ place, now, active, onSelect }: { place: NearbyMapPlace; now: MapClock; active: boolean; onSelect: (id: string) => void }) {
  const status = place.hours ? openStatus(place.hours, now.date, now.hour) : undefined;
  const walk = walkLabel(place.distance);
  return (
    <button data-place={place.id} className={`guest-nearby-map__card${active ? ' is-active' : ''}`} type="button" onClick={() => onSelect(place.id)}>
      <span className="guest-nearby-map__photo"><Image src={place.image} alt="" fill sizes="84px" /></span>
      <span className="guest-nearby-map__copy">
        <b>{place.name}</b>
        <small>{[place.type, walk].filter(Boolean).join(' · ')}</small>
        {status ? <span className={`guest-open-status${status.open ? ' is-open' : ''}`}>{status.label}</span> : null}
      </span>
    </button>
  );
}

/**
 * The map at the head of a place's location card: the place and the hotel,
 * framed together, not interactive -- a picture of where it is. Tapping
 * through to directions is the card's job, not the map's.
 */
export function PlaceMiniMap({ city, property, propertyImage, place }: { city: string; property: string; propertyImage: string; place: NearbyMapPlace }) {
  const mapNode = useRef<HTMLDivElement>(null);
  const hotel = HOTEL_POSITIONS[city];
  const at = placePositions(city, [place])[0]?.at;

  useEffect(() => {
    if (!mapNode.current || !hotel || !at) return;
    let cancelled = false;
    let map: LeafletMap | null = null;
    void import('leaflet').then((L) => {
      if (cancelled || !mapNode.current) return;
      map = L.map(mapNode.current, {
        zoomControl: false,
        attributionControl: true,
        dragging: false,
        scrollWheelZoom: false,
        doubleClickZoom: false,
        touchZoom: false,
        boxZoom: false,
        keyboard: false,
        zoomSnap: 0.25,
      }).setView(at, 16);
      addTiles(L, map);
      addCredit(L, map);
      L.marker(hotel, {
        icon: L.divIcon({ className: 'guest-map-marker guest-map-marker--hotel', html: hotelHtml(propertyImage, property), iconSize: [36, 36], iconAnchor: [18, 18] }),
        keyboard: false,
        interactive: false,
      }).addTo(map);
      L.marker(at, {
        icon: L.divIcon({ className: 'guest-map-marker', html: `<span class="guest-map-drop" data-category="${place.categoryId}">${glyph(place.categoryId)}</span>`, iconSize: [34, 40], iconAnchor: [17, 40] }),
        keyboard: false,
        interactive: false,
        zIndexOffset: 500,
      }).addTo(map);
      map.fitBounds(L.latLngBounds([hotel, at]), { paddingTopLeft: [48, 56], paddingBottomRight: [48, 40], maxZoom: 17 });
    });
    return () => {
      cancelled = true;
      map?.remove();
    };
  }, [hotel, at?.[0], at?.[1], place.categoryId, property, propertyImage]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!hotel || !at) return null;
  return <div ref={mapNode} className="guest-place-minimap" role="img" aria-label={`${place.name} on a map, with ${property}`} />;
}
