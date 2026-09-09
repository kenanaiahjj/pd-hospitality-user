import { describe, expect, it } from 'vitest';
import {
  SERVICE_IMAGES,
  getServiceImage,
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

