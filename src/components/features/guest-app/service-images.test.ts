import { describe, expect, it } from 'vitest';
import { SERVICE_IMAGES, getServiceImage } from './service-images';

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
});
