import { describe, expect, it } from 'vitest';
import { groupByCollision, parseDistanceMetres, pointToward } from './nearby-map';

describe('nearby map placement', () => {
  it('reads the distance the card states', () => {
    expect(parseDistanceMetres('280 m away')).toBe(280);
    expect(parseDistanceMetres('1.2 km away')).toBe(1200);
    expect(parseDistanceMetres(undefined)).toBeUndefined();
  });

  it('puts the pin at that distance from the hotel', () => {
    const hotel: [number, number] = [14.5436, 120.9953];
    const [lat, lng] = pointToward(hotel, [14.57, 120.983], 1000);
    const dLat = (lat - hotel[0]) * 111_320;
    const dLng = (lng - hotel[1]) * 111_320 * Math.cos((hotel[0] * Math.PI) / 180);
    expect(Math.hypot(dLat, dLng)).toBeCloseTo(1000, 0);
  });

  // Pills are wide: two places a street apart overlap on screen long before
  // their dots do, and a stack of names reads as a smudge.
  it('merges pins whose pills would overlap, and only those', () => {
    const groups = groupByCollision([
      { item: 'a', x: 100, y: 100 },
      { item: 'b', x: 160, y: 110 },
      { item: 'c', x: 100, y: 200 },
      { item: 'd', x: 300, y: 100 },
    ]);
    expect(groups).toEqual([['a', 'b'], ['c'], ['d']]);
  });
});
