import { describe, expect, it } from 'vitest';
import {
  getCategoryCoverImage,
  getItemCardImage,
  getItemThumbnail,
  getRoomImage,
  getServiceImageKey,
} from './service-images';

describe('service image keys', () => {
  it('keys off the category, so a new service inherits a real photo', () => {
    // The bug this guards: an id-keyed lookup silently drops every service
    // added later into the generic amenity shot.
    expect(getServiceImageKey({ id: 'hot-stone', categoryId: 'spa' })).toBe('spa');
    expect(getServiceImageKey({ id: 'never-seen-before', categoryId: 'spa' })).toBe('spa');
    expect(getServiceImageKey({ id: 'diving', categoryId: 'entertainment' })).toBe('tour');
  });

  it('gives car services the vehicle photo, and only car services', () => {
    for (const id of ['transfer', 'private-car']) {
      expect(getServiceImageKey({ id, categoryId: 'services' })).toBe('transfer');
    }
    // Same category, not cars: a bicycle shown as a sedan is worse than generic.
    for (const id of ['rental', 'scooter']) {
      expect(getServiceImageKey({ id, categoryId: 'services' })).toBe('amenity');
    }
  });

  it('separates in-room dining from the venues that have a room of their own', () => {
    expect(getServiceImageKey({ id: 'dining', categoryId: 'dining' })).toBe('dining');
    for (const id of ['apartment-1b', 'rooftop', 'cafe', 'poolside-bar']) {
      expect(getServiceImageKey({ id, categoryId: 'dining' })).toBe('restaurant');
    }
  });

  it('falls back to amenity only for genuinely uncategorised services', () => {
    expect(getServiceImageKey({ id: 'laundry', categoryId: 'services' })).toBe('amenity');
  });

  it('describes room and category covers with the content they represent', () => {
    expect(getRoomImage('King room').alt).toContain('king');
    expect(getRoomImage('Garden suite').alt).toContain('suite');
    expect(getCategoryCoverImage('dining').alt).toContain('dining');
    expect(getCategoryCoverImage('spa').alt).toContain('spa');
  });

  it('uses distinct thumbnails for each service and venue', () => {
    const apt1b = getItemThumbnail('apartment-1b', 'dining');
    const cafe = getItemThumbnail('cafe', 'dining');
    const rooftop = getItemThumbnail('rooftop', 'dining');
    expect(apt1b.src).not.toBe(cafe.src);
    expect(cafe.src).not.toBe(rooftop.src);

    const massage = getItemThumbnail('spa', 'spa');
    const scrub = getItemThumbnail('scrub', 'spa');
    const stones = getItemThumbnail('hot-stone', 'spa');
    expect(massage.src).not.toBe(scrub.src);
    expect(scrub.src).not.toBe(stones.src);

    const island = getItemThumbnail('tour', 'entertainment');
    const foodCrawl = getItemThumbnail('food-crawl', 'entertainment');
    const scuba = getItemThumbnail('diving', 'entertainment');
    expect(island.src).not.toBe(foodCrawl.src);
    expect(foodCrawl.src).not.toBe(scuba.src);
  });

  it('uses separate card photography and keeps its alt text specific', () => {
    const spaThumb = getItemThumbnail('spa', 'spa');
    const spaCard = getItemCardImage('spa', 'spa');
    expect(spaCard.src).not.toBe(spaThumb.src);
    expect(spaCard.alt).toContain('spa treatment');

    const cafeThumb = getItemThumbnail('cafe', 'dining');
    const cafeCard = getItemCardImage('cafe', 'dining');
    expect(cafeCard.src).not.toBe(cafeThumb.src);
  });

});
