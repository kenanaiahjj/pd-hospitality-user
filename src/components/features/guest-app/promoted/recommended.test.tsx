import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { FeedAction, FeedEntry } from './feed-model';
import { RecommendedRail, recommendedPicks } from './recommended';

/*
  Ways "Recommended for you" could go wrong:
  1. It recommends something the guest has already booked.
  2. It leads with late checkout or the airport car -- stay admin, not a
     recommendation, and each has its own prompt on the home.
  3. It runs to thirty cards.
  4. An admin's pinned picks (the dashboard, later) are ignored or reordered,
     or a pin for something no longer in the catalogue leaves a hole.
  5. A card opens the category, not the thing on it.
*/

const image = { src: '/x.jpg', alt: '', focalPoint: 'center' };
const entry = (id: string, action: FeedAction = { kind: 'item', id }, extra: Partial<FeedEntry> = {}): FeedEntry => ({
  story: {
    id: `s-${id}`,
    title: `Title ${id}`,
    subtitle: '',
    price: '₱1,000',
    cta: 'Open',
    cover: image,
    slides: [{ headline: id, detail: '', image }],
    author: { name: `Venue ${id}`, kind: 'venue', image },
    postedHoursAgo: 1,
    livesForHours: 24,
  },
  action,
  itemId: id,
  why: `Why ${id}`,
  score: 5,
  tailored: true,
  booked: false,
  ...extra,
});

describe('recommendedPicks', () => {
  it('leaves out bookings and stay admin, and stops at eight', () => {
    const feed = [
      entry('late', { kind: 'late-checkout' }),
      entry('spa', undefined, { booked: true }),
      entry('ride', { kind: 'departure-ride' }),
      ...Array.from({ length: 12 }, (_, index) => entry(`p${index}`)),
    ];
    const ids = recommendedPicks(feed).map((pick) => pick.itemId);
    expect(ids).toHaveLength(8);
    expect(ids).not.toContain('late');
    expect(ids).not.toContain('spa');
    expect(ids).not.toContain('ride');
    expect(ids[0]).toBe('p0');
  });

  it('puts pinned picks first, in the pinned order, and skips pins it cannot find', () => {
    const feed = [entry('a'), entry('b'), entry('c'), entry('d')];
    const ids = recommendedPicks(feed, { pinned: ['c', 'gone', 'a'] }).map((pick) => pick.itemId);
    expect(ids).toEqual(['c', 'a', 'b', 'd']);
  });
});

describe('RecommendedRail', () => {
  it('shows what and where, and hands the tapped pick back without a reason badge', async () => {
    const user = userEvent.setup();
    const onOpen = vi.fn();
    render(<RecommendedRail entries={[entry('facial'), entry('bar')]} onOpen={onOpen} />);

    const rail = screen.getByRole('region', { name: 'Recommended for you' });
    const card = within(rail).getByRole('button', { name: /Title facial/ });
    expect(card).not.toHaveTextContent('Why facial');
    expect(card).toHaveTextContent('Venue facial');
    expect(card).toHaveTextContent('₱1,000');

    await user.click(card);
    expect(onOpen).toHaveBeenCalledWith(expect.objectContaining({ itemId: 'facial' }));
  });

  it('names a restaurant once, then says where it is', () => {
    const venue = entry('bar');
    venue.story = { ...venue.story, title: 'The Poolside Bar', subtitle: 'Ground floor', author: { ...venue.story.author, name: 'The Poolside Bar' } };
    render(<RecommendedRail entries={[venue]} onOpen={vi.fn()} />);
    expect(screen.getByRole('button', { name: /The Poolside Bar/ })).toHaveTextContent('Ground floor');
  });

  it('renders nothing with nothing to recommend', () => {
    const { container } = render(<RecommendedRail entries={[]} onOpen={vi.fn()} />);
    expect(container).toBeEmptyDOMElement();
  });
});
