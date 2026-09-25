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

  it('leads the last day with going home even after a booked massage', () => {
    // Seen in the browser: the facial follow-up tied the pasalubong reel and
    // won the tie, so the day you fly home opened on another treatment.
    expect(['moment-pasalubong', 'moment-transfer-home']).toContain(feedAt(3, 8, ['spa'])[0]!.story.id);
  });

  it('never offers going home before the last day', () => {
    // Seen in the browser: on night one the late-checkout reel scored on
    // "evening" alone and sat fifth in the feed.
    const ids = [1, 2].flatMap((day) => [8, 19, 23].flatMap((hour) => feedAt(day, hour).map((entry) => entry.story.id)));
    expect(ids).not.toContain('moment-late-checkout');
    expect(ids).not.toContain('moment-transfer-home');
    expect(feedAt(3, 19).map((entry) => entry.story.id)).toContain('moment-late-checkout');
  });

  it('offers a day on wheels mid-stay without filling the morning with it', () => {
    const top = feedAt(2, 8).slice(0, 8).filter((entry) => entry.story.id.startsWith('service-') && /rental|bicycle|e-bike|scooter|motorcycle/.test(entry.story.id));
    expect(top.length).toBeGreaterThan(0);
    expect(top.length).toBeLessThanOrEqual(2);
  });

  it('offers no self-drive car once the guest is going home', () => {
    for (const day of [3, 4]) {
      const ids = feedAt(day, 8).map((entry) => entry.story.id);
      expect(ids).not.toContain('service-car-rental');
      expect(ids).not.toContain('service-suv-rental');
    }
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
