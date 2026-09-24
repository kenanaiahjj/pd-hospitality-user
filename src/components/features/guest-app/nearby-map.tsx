'use client';

import 'leaflet/dist/leaflet.css';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import type { Map as LeafletMap, Marker } from 'leaflet';

/*
  Nearby places on a map, with the hotel at the centre.

  Leaflet over OpenStreetMap's standard tiles, turned grey in CSS: no key,
  and the quiet base lets the photo pins carry the colour. (CARTO's grey
  tiles now require a key and watermark without one.) Leaflet touches `window`, so it
  is imported inside the effect rather than at module load, which keeps the
  page prerenderable.
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

/** "280 m away" or "1.2 km away" as metres; undefined when it says neither. */
export function parseDistanceMetres(distance?: string): number | undefined {
  const match = distance?.match(/([\d.]+)\s*(km|m)\b/);
  if (!match) return undefined;
  const value = Number(match[1]);
  return match[2] === 'km' ? value * 1000 : value;
}

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
};

type Props = {
  city: string;
  property: string;
  propertyImage: string;
  places: NearbyMapPlace[];
  onSelect: (id: string) => void;
};

const pinHtml = (image: string, label: string, hotel = false) =>
  `<span class="guest-map-pin${hotel ? ' guest-map-pin--hotel' : ''}"><img src="${image}" alt="" /></span>${hotel ? `<b class="guest-map-pin__label">${label}</b>` : ''}`;

export function NearbyMap({ city, property, propertyImage, places, onSelect }: Props) {
  const mapNode = useRef<HTMLDivElement>(null);
  const railRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markersRef = useRef<Map<string, Marker>>(new Map());
  const [activeId, setActiveId] = useState(places[0]?.id);
  // Read by the map once it finishes loading, which is after the first highlight ran.
  const activeRef = useRef(activeId);
  const hotel = HOTEL_POSITIONS[city];

  const positions = places.flatMap((place) => {
    const toward = PLACE_DIRECTIONS[place.id];
    const metres = parseDistanceMetres(place.distance);
    return hotel && toward && metres ? [{ place, at: pointToward(hotel, toward, metres) }] : [];
  });
  const placeKey = positions.map((entry) => entry.place.id).join(',');

  // Build the map once per set of places.
  useEffect(() => {
    if (!mapNode.current || !hotel) return;
    let cancelled = false;
    const markers = markersRef.current;
    void import('leaflet').then((L) => {
      if (cancelled || !mapNode.current) return;
      const map = L.map(mapNode.current, { zoomControl: false, attributionControl: true, zoomSnap: 0.25 }).setView(hotel, 15);
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);
      L.marker(hotel, {
        icon: L.divIcon({ className: 'guest-map-marker', html: pinHtml(propertyImage, property, true), iconSize: [52, 52], iconAnchor: [26, 26] }),
        keyboard: false,
        zIndexOffset: 1000,
      }).addTo(map);
      for (const { place, at } of positions) {
        const marker = L.marker(at, {
          icon: L.divIcon({ className: 'guest-map-marker', html: pinHtml(place.image, place.name), iconSize: [40, 40], iconAnchor: [20, 20] }),
          title: place.name,
        }).addTo(map);
        marker.on('click', () => {
          setActiveId(place.id);
          railRef.current?.querySelector(`[data-place="${place.id}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        });
        markers.set(place.id, marker);
      }
      if (positions.length) {
        // Extra room below the points for the hotel's label, which hangs under its pin.
        map.fitBounds(L.latLngBounds([hotel, ...positions.map((entry) => entry.at)]), { paddingTopLeft: [28, 28], paddingBottomRight: [28, 64], maxZoom: 17 });
      }
      markers.get(activeRef.current ?? '')?.getElement()?.classList.add('is-active');
      mapRef.current = map;
    });
    return () => {
      cancelled = true;
      markers.clear();
      mapRef.current?.remove();
      mapRef.current = null;
    };
    // `positions` is derived from `placeKey`; rebuilding on its identity would rebuild every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [placeKey, hotel, property, propertyImage]);

  // The active place's pin stands out, and the map follows it.
  useEffect(() => {
    activeRef.current = activeId;
    for (const [id, marker] of markersRef.current) {
      marker.getElement()?.classList.toggle('is-active', id === activeId);
      if (id === activeId) {
        marker.setZIndexOffset(500);
        // Follow the place only once it would be off the edge; otherwise the hotel stays framed.
        const map = mapRef.current;
        if (map && !map.getBounds().pad(-0.12).contains(marker.getLatLng())) map.panTo(marker.getLatLng(), { animate: true });
      } else {
        marker.setZIndexOffset(0);
      }
    }
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
          const index = Math.round(rail.scrollLeft / (card.offsetWidth + 12));
          const next = positions[Math.min(positions.length - 1, Math.max(0, index))]?.place.id;
          if (next && next !== activeId) setActiveId(next);
        }}
      >
        {positions.map(({ place }) => (
          <button
            key={place.id}
            data-place={place.id}
            className={`guest-nearby-map__card${place.id === activeId ? ' is-active' : ''}`}
            type="button"
            onClick={() => onSelect(place.id)}
          >
            <span className="guest-nearby-map__photo"><Image src={place.image} alt="" fill sizes="(max-width: 720px) 78vw, 420px" /></span>
            <b>{place.name}</b>
            <small>{[place.type, place.distance].filter(Boolean).join(' · ')}</small>
          </button>
        ))}
      </div>
    </div>
  );
}
