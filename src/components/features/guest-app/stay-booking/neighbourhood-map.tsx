'use client';

import 'leaflet/dist/leaflet.css';
import { useEffect, useRef } from 'react';
import type { Map as LeafletMap } from 'leaflet';
import { addCredit, addTiles } from '../nearby-map';
import type { NearbyKind } from './neighbourhood';
import { spotPositions } from './neighbourhood';
import type { StayHotel } from './model';

/*
  A picture of the neighbourhood: the hotel in the middle and what the list
  below names around it. Not for exploring -- no drag, no zoom -- so it never
  fights the page's scroll on a phone. Leaflet loads inside the effect, as
  the other maps do.
*/

const escapeHtml = (text: string) => text.replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`);

export function NeighbourhoodMap({ hotel, kind }: { hotel: StayHotel; kind: NearbyKind }) {
  const node = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);

  useEffect(() => {
    if (!node.current) return;
    let cancelled = false;
    void import('leaflet').then((L) => {
      if (cancelled || !node.current) return;
      const map = L.map(node.current, { zoomControl: false, dragging: false, scrollWheelZoom: false, doubleClickZoom: false, touchZoom: false, boxZoom: false, keyboard: false, attributionControl: true });
      addTiles(L, map);
      addCredit(L, map);
      const pins = spotPositions(hotel.id).filter((entry) => entry.spot.kind === kind);
      for (const { spot, at } of pins) {
        L.marker(at, {
          icon: L.divIcon({ className: 'sb-hood-marker', // West of the hotel the label reads leftward, away from the hotel's dot.
          html: `<span class="sb-hood-pin${at[1] < hotel.position[1] ? ' is-left' : ''}" data-kind="${spot.kind}"><b>${escapeHtml(spot.name)}</b></span>`, iconSize: undefined, iconAnchor: [8, 8] }),
          keyboard: false,
          interactive: false,
        }).addTo(map);
      }
      L.marker(hotel.position, {
        icon: L.divIcon({ className: 'sb-hood-marker', html: '<span class="sb-hood-hotel" aria-hidden="true"></span>', iconSize: [22, 22], iconAnchor: [11, 11] }),
        keyboard: false,
        interactive: false,
        zIndexOffset: 1000,
      }).addTo(map);
      const points = [hotel.position, ...pins.map((entry) => entry.at)];
      // Room for the labels on whichever side they read: long names run ~160px.
      const west = pins.some((entry) => entry.at[1] < hotel.position[1]);
      const east = pins.some((entry) => entry.at[1] >= hotel.position[1]);
      const side = (has: boolean) => (!has ? 24 : west && east ? 90 : 140);
      if (points.length > 1) map.fitBounds(L.latLngBounds(points), { paddingTopLeft: [side(west), 28], paddingBottomRight: [side(east), 28], maxZoom: 16 });
      else map.setView(hotel.position, 15);
      mapRef.current = map;
    });
    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [hotel.id, hotel.position, kind]);

  return <div ref={node} className="sb-hood-map" role="img" aria-label={`Map of what is near ${hotel.name}`} />;
}
