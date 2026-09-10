import { describe, expect, it } from 'vitest';
import {
  SERVICE_IMAGES,
  getServiceImage,
  getServiceImageKey,
  getPropertyImage,
  getRoomImage,
  getCategoryCoverImage,
} from './service-images';

describe('service images', () => {
  it('provides stable Unsplash images for every service context', () => {
    expect(Object.keys(SERVICE_IMAGES)).toEqual([
      'dining',
      'spa',
      'restaurant',
      'tour',
      'transfer',
      'amenity',
    ]);
    expect(getServiceImage('spa').src).toMatch(/^https:\/\/images\.unsplash\.com\//);
    expect(getServiceImage('spa').alt).toContain('treatment');
  });

  it('provides property photography for each hotel location with fallback', () => {
    expect(getPropertyImage('The Henry Manila').src).toMatch(/^https:\/\/images\.unsplash\.com\//);
    expect(getPropertyImage('The Henry Manila').alt).toContain('Manila');
    expect(getPropertyImage('The Henry Cebu').src).toMatch(/^https:\/\/images\.unsplash\.com\//);
    expect(getPropertyImage('The Henry Cebu').alt).toContain('Cebu');
    expect(getPropertyImage('The Henry Dumaguete').src).toMatch(/^https:\/\/images\.unsplash\.com\//);
    expect(getPropertyImage('Unknown Property').src).toMatch(/^https:\/\/images\.unsplash\.com\//);
  });

  it('provides room and category cover images', () => {
    expect(getRoomImage('King room').alt).toContain('king');
    expect(getRoomImage('Garden suite').alt).toContain('suite');
    expect(getCategoryCoverImage('dining').alt).toContain('dining');
    expect(getCategoryCoverImage('spa').alt).toContain('spa');
  });
});

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
});
