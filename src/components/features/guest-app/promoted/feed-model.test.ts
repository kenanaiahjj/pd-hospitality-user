import { describe, expect, it } from 'vitest';
import { daypartFor, phaseFor, rankFeed, stayContext } from './feed-model';
import type { FeedCandidate, FeedTags, StayContext } from './feed-model';
import type { Story } from './story-model';

/*
  The ways the feed could go wrong, written down before the model was:
  each block below is one of them. See the plan's Task 1.
*/

const image = { src: '/x.jpg', alt: '', focalPoint: '50% 50%' };

function candidate(id: string, author: string, tags: Omit<FeedTags, 'itemId'> & { itemId?: string }, postedHoursAgo = 5): FeedCandidate {
  const story: Story = {
    id,
    title: id,
    subtitle: 'The Henry Manila',
    price: '₱1,000',
    cta: 'Book',
    cover: image,
    slides: [{ headline: id, image }],
    author: { name: author, kind: 'venue', image },
    postedHoursAgo,
    livesForHours: 24,
  };
  return { story, tags: { itemId: tags.itemId ?? id, ...tags }, action: { kind: 'item', id: tags.itemId ?? id } };
}

const base: StayContext = { phase: 'mid-stay', daypart: 'afternoon', booked: [], partySize: 2, hasCompanions: true };

const catalogue: FeedCandidate[] = [
  candidate('rooftop', 'Azotea Rooftop', { category: 'dining', dayparts: ['evening'] }),
  candidate('apartment-1b', 'Apartment 1B', { category: 'dining', dayparts: ['evening'] }),
  candidate('cafe', 'Kape Manila Café', { category: 'dining', dayparts: ['morning'] }),
  candidate('spa', 'Hilom Spa', { category: 'spa', dayparts: ['afternoon'] }),
  candidate('facial', 'Hilom Spa', { category: 'spa', follows: ['spa'] }),
  candidate('couples-massage', 'Hilom Spa', { category: 'spa', fits: 'couple' }),
  candidate('tour', 'Island Tours', { category: 'entertainment', phases: ['mid-stay'] }),
  candidate('pasalubong', 'The Henry Manila', { category: 'gifts', phases: ['last-day', 'checkout-day'] }),
  candidate('transfer-home', 'The Henry Manila', { category: 'services', phases: ['last-day', 'checkout-day'] }),
  candidate('welcome', 'The Henry Manila', { category: 'dining', phases: ['first-night'], dayparts: ['evening'] }),
];

describe('feed ranking: the ways it could go wrong', () => {
  it('1. never leads with something already booked', () => {
    const feed = rankFeed({ ...base, daypart: 'afternoon', booked: ['spa'] }, catalogue);
    const tailored = feed.filter((entry) => entry.tailored);
    expect(tailored.map((entry) => entry.itemId)).not.toContain('spa');
    // ...but it is not lost: the tail still carries it.
    expect(feed.map((entry) => entry.itemId)).toContain('spa');
  });

  it('2. never puts two reels from one venue, or one category, side by side', () => {
    for (const context of [base, { ...base, daypart: 'evening' as const }, { ...base, phase: 'last-day' as const }]) {
      const feed = rankFeed(context, catalogue);
      for (let i = 1; i < feed.length; i += 1) {
        const [a, b] = [feed[i - 1]!, feed[i]!];
        const sameVenue = a.story.author.name === b.story.author.name;
        const sameCategory = a.story.id !== b.story.id && categoryOf(a.itemId) === categoryOf(b.itemId);
        // Only unavoidable once every alternative is used up at the very end.
        if (i < feed.length - 2) expect(sameVenue || sameCategory, `${a.itemId} then ${b.itemId}`).toBe(false);
      }
    }
  });

  it('3. leads the last day with something for the last day', () => {
    const [first] = rankFeed({ ...base, phase: 'last-day' }, catalogue);
    expect(['pasalubong', 'transfer-home']).toContain(first!.itemId);
  });

  it('4. leads an evening with something for the evening', () => {
    const [first] = rankFeed({ ...base, daypart: 'evening' }, catalogue);
    expect(['rooftop', 'apartment-1b', 'welcome']).toContain(first!.itemId);
  });

  it('5. raises a follow-up once its trigger is booked', () => {
    const before = rankFeed(base, catalogue).findIndex((entry) => entry.itemId === 'facial');
    const after = rankFeed({ ...base, booked: ['spa'] }, catalogue).findIndex((entry) => entry.itemId === 'facial');
    expect(after).toBeLessThan(before);
    expect(rankFeed({ ...base, booked: ['spa'] }, catalogue)[0]!.why).toMatch(/goes well with/i);
  });

  it('6. only explains itself with a signal that matched', () => {
    const feed = rankFeed({ ...base, daypart: 'morning' }, catalogue);
    const cafe = feed.find((entry) => entry.itemId === 'cafe')!;
    expect(cafe.why).toMatch(/morning/i);
    const tour = feed.find((entry) => entry.itemId === 'tour')!;
    expect(tour.why).not.toMatch(/morning|tonight|evening/i);
  });

  it('7. shows every candidate exactly once, opening on a top pick, booked last', () => {
    const feed = rankFeed({ ...base, daypart: 'evening', booked: ['tour'] }, catalogue);
    expect(feed).toHaveLength(catalogue.length);
    expect(new Set(feed.map((entry) => entry.story.id)).size).toBe(catalogue.length);
    expect(feed[0]!.tailored).toBe(true);
    // Mixing may sit a lower reel between two top picks, but never ahead of the first,
    // and what is already booked closes the feed.
    expect(feed[feed.length - 1]!.itemId).toBe('tour');
  });

  it('8. returns an empty feed for no candidates rather than throwing', () => {
    expect(rankFeed(base, [])).toEqual([]);
  });

  it('9. puts the phase and daypart boundaries where the spec does', () => {
    expect(phaseFor(1, 3, 17)).toBe('arrival-day');
    expect(phaseFor(1, 3, 18)).toBe('first-night');
    expect(phaseFor(2, 3, 12)).toBe('mid-stay');
    expect(phaseFor(3, 3, 12)).toBe('last-day');
    expect(phaseFor(4, 3, 9)).toBe('checkout-day');
    expect(daypartFor(4)).toBe('late');
    expect(daypartFor(5)).toBe('morning');
    expect(daypartFor(11)).toBe('afternoon');
    expect(daypartFor(17)).toBe('evening');
    expect(daypartFor(22)).toBe('late');
  });

  it('builds a context from plain numbers', () => {
    expect(stayContext({ nights: 3, guestCount: 2, companions: 1, booked: ['spa'] }, { dayOfStay: 1, hour: 19 }))
      .toEqual({ phase: 'first-night', daypart: 'evening', booked: ['spa'], partySize: 2, hasCompanions: true });
  });
});

function categoryOf(itemId: string) {
  return catalogue.find((entry) => entry.tags.itemId === itemId)!.tags.category;
}
