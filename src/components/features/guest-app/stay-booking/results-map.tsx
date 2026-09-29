'use client';

import 'leaflet/dist/leaflet.css';
import Image from 'next/image';
import { Star } from '@phosphor-icons/react';
import { useEffect, useRef, useState } from 'react';
import type { LayerGroup, Map as LeafletMap } from 'leaflet';
import { addCredit, addTiles, groupByCollision } from '../nearby-map';
import type { HotelResult } from './model';
import { peso } from './model';

/*
  Results on a map: one price pin per hotel, as the booking apps do it, and a
  card for the chosen one that opens the hotel. The frame fits whatever the
  search returned -- one city, or the whole country. Leaflet touches
  `window`, so it loads inside the effect, as `NearbyMap` does.
*/

const pinHtml = (label: string, active: boolean) =>
  `<span class="sb-map-pin${active ? ' is-active' : ''}">${label}</span>`;

export function StayResultsMap({ results, onOpenHotel }: { results: HotelResult[]; onOpenHotel: (id: string) => void }) {
  const node = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const layerRef = useRef<LayerGroup | null>(null);
  const leafletRef = useRef<typeof import('leaflet') | null>(null);
  const [activeId, setActiveId] = useState(results[0]?.hotel.id);
  // Read by Leaflet's zoom handler, which outlives the render that made it.
  const activeRef = useRef(activeId);
  useEffect(() => { activeRef.current = activeId; }, [activeId]);
  const key = results.map((result) => `${result.hotel.id}:${result.fromPrice ?? 'x'}`).join(',');
  const chosen = results.find((result) => result.hotel.id === activeId) ?? results[0];

  /* Pins that would sit on each other merge into a count until the map is zoomed in far enough to part them. */
  const drawPins = (active?: string) => {
    const L = leafletRef.current;
    const layer = layerRef.current;
    const map = mapRef.current;
    if (!L || !layer || !map) return;
    layer.clearLayers();
    const points = results.map((result) => {
      const point = map.latLngToLayerPoint(result.hotel.position);
      return { item: result, x: point.x, y: point.y };
    });
    for (const group of groupByCollision(points, 84, 30)) {
      if (group.length === 1) {
        const result = group[0]!;
        const label = result.soldOut || result.fromPrice === undefined ? 'Sold out' : peso(result.fromPrice);
        L.marker(result.hotel.position, {
          icon: L.divIcon({ className: 'sb-map-marker', html: pinHtml(label, result.hotel.id === active), iconSize: undefined, iconAnchor: [36, 30] }),
          title: result.hotel.name,
          zIndexOffset: result.hotel.id === active ? 1000 : 0,
        }).on('click', () => setActiveId(result.hotel.id)).addTo(layer);
        continue;
      }
      const bounds = L.latLngBounds(group.map((result) => result.hotel.position));
      const holdsActive = group.some((result) => result.hotel.id === active);
      L.marker(bounds.getCenter(), {
        icon: L.divIcon({ className: 'sb-map-marker', html: pinHtml(`${group.length} stays`, holdsActive), iconSize: undefined, iconAnchor: [36, 30] }),
        title: group.map((result) => result.hotel.name).join(', '),
      }).on('click', () => map.flyToBounds(bounds.pad(0.8), { maxZoom: 15, duration: 0.4 })).addTo(layer);
    }
  };
  const drawRef = useRef(drawPins);
  useEffect(() => { drawRef.current = drawPins; });

  useEffect(() => {
    if (!node.current || !results.length) return;
    let cancelled = false;
    void import('leaflet').then((L) => {
      if (cancelled || !node.current) return;
      leafletRef.current = L;
      const map = L.map(node.current, { zoomControl: false, attributionControl: true, zoomSnap: 0.25 });
      addTiles(L, map);
      addCredit(L, map);
      layerRef.current = L.layerGroup().addTo(map);
      const bounds = L.latLngBounds(results.map((result) => result.hotel.position));
      map.fitBounds(bounds, { paddingTopLeft: [40, 40], paddingBottomRight: [40, 180], maxZoom: 14 });
      mapRef.current = map;
      map.on('zoomend', () => drawRef.current(activeRef.current));
      drawRef.current(results[0]?.hotel.id);
    });
    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      layerRef.current = null;
    };
    // `results` is keyed by `key`; its identity changes every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  useEffect(() => {
    drawRef.current(activeId);
    const hotel = results.find((result) => result.hotel.id === activeId)?.hotel;
    if (hotel && mapRef.current && !mapRef.current.getBounds().pad(-0.2).contains(hotel.position)) mapRef.current.panTo(hotel.position);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId]);

  if (!results.length) return null;

  return (
    <div className="sb-map">
      <div ref={node} className="sb-map__canvas" role="region" aria-label="Map of hotels" />
      {chosen ? (
        <button type="button" className="sb-map__card" onClick={() => onOpenHotel(chosen.hotel.id)}>
          <span className="sb-map__photo"><Image src={chosen.hotel.image.src} alt="" fill sizes="96px" style={{ objectPosition: chosen.hotel.image.focalPoint }} /></span>
          <span className="sb-map__copy">
            <small>{chosen.hotel.area}</small>
            <b>{chosen.hotel.name}</b>
            <span className="sb-rating"><Star weight="fill" aria-hidden="true" />{chosen.hotel.rating.toFixed(1)}<small>{chosen.hotel.stars}-star</small></span>
            <span className="sb-map__price">{chosen.fromPrice !== undefined && !chosen.soldOut ? <><b>{peso(chosen.fromPrice)}</b> / night</> : 'Sold out on your dates'}</span>
          </span>
        </button>
      ) : null}
    </div>
  );
}
