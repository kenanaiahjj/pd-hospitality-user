import { describe, expect, it } from 'vitest';
import { buildFeedCandidates } from './feed-content';
import { rankFeed, stayContext } from './feed-model';

const nearby = [
  { id: 'kape-lab-manila', name: 'Kape Lab Manila', type: 'Coffee & bakery', distance: '280 m away', image: { src: '/x.jpg', alt: '', focalPoint: 'center' }, dayparts: ['morning' as const] },
];
const candidates = buildFeedCandidates({ nearby });
const feedAt = (dayOfStay: number, hour: number, booked: string[] = []) =>
  rankFeed(stayContext({ nights: 3, guestCount: 2, companions: 1, booked }, { dayOfStay, hour }), candidates);

describe('feed content', () => {
  it('gives every reel a unique id and somewhere to go', () => {
    const ids = candidates.map((candidate) => candidate.story.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const candidate of candidates) {
      expect(candidate.action).toBeDefined();
      expect(candidate.story.slides.length).toBeGreaterThan(0);
    }
  });

  it('plays stills only: the baked-in push-in clips judder full screen', () => {
    expect(candidates.flatMap((candidate) => candidate.story.slides).some((slide) => slide.video)).toBe(false);
  });

  it('opens the first night, in the evening, on the welcome drink', () => {
    expect(feedAt(1, 19)[0]!.story.id).toBe('moment-welcome');
  });

  it('opens the last day on getting home, not on another dinner', () => {
    expect(['moment-pasalubong', 'moment-transfer-home']).toContain(feedAt(3, 9)[0]!.story.id);
  });

  it('opens a morning on breakfast or coffee', () => {
    const first = feedAt(2, 8)[0]!;
    expect(['moment-breakfast', 'venue-cafe', 'venue-apartment-1b', 'nearby-kape-lab-manila']).toContain(first.story.id);
  });

  it('follows a booked massage with its natural next step', () => {
    const [first] = feedAt(2, 14, ['spa']);
    expect(['service-facial', 'service-scrub']).toContain(first!.story.id);
    expect(first!.why).toMatch(/goes well with your hilom signature massage/i);
  });
});
