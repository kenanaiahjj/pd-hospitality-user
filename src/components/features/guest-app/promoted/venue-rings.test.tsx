import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { FeedEntry } from './feed-model';
import type { Story } from './story-model';
import { venueRings, VenueRings } from './venue-rings';

/*
  Ways the rings could fail:
  1. One venue with three reels shows three rings.
  2. The hotel's own ring is buried behind partners -- or every hotel-run
     outlet (also kind 'property') jumps the feed order with it.
  3. A ring the guest has watched still looks new.
  4. Tapping a ring opens a different venue.
  5. No reels at all leaves a heading over an empty rail.
  6. Every place in town gets a ring and the rail never ends.
*/

const image = { src: '/x.jpg', alt: '', focalPoint: 'center' };
const entry = (id: string, author: string, kind: Story['author']['kind'] = 'venue'): FeedEntry => ({
  story: {
    id,
    title: id,
    subtitle: '',
    price: '',
    cta: 'Open',
    cover: image,
    slides: [{ headline: id, detail: '', image }],
    author: { name: author, kind, image },
    postedHoursAgo: 1,
    livesForHours: 24,
  },
  action: { kind: 'item', id },
  itemId: id,
  why: '',
  score: 0,
  tailored: false,
});

const feed = [
  entry('facial', 'Hilom Spa'),
  entry('dinner', 'Apartment 1B', 'property'),
  entry('bar', 'The Poolside Bar'),
  entry('welcome', 'The Henry Manila', 'property'),
  entry('scrub', 'Hilom Spa'),
];

describe('venue rings', () => {
  it('gives each venue one ring, the hotel first, then in feed order', () => {
    expect(venueRings(feed, 'The Henry Manila').map((ring) => [ring.name, ring.entries.length])).toEqual([
      ['The Henry Manila', 1],
      ['Hilom Spa', 2],
      ['Apartment 1B', 1],
      ['The Poolside Bar', 1],
    ]);
  });

  it('keeps the rail to twelve places', () => {
    const many = Array.from({ length: 20 }, (_, index) => entry(`r${index}`, `Place ${index}`));
    expect(venueRings(many)).toHaveLength(12);
  });

  it('marks watched venues and opens the one tapped', async () => {
    const user = userEvent.setup();
    const onOpen = vi.fn();
    render(<VenueRings entries={feed} lead="The Henry Manila" seen={['Hilom Spa']} onOpen={onOpen} />);

    const rail = screen.getByRole('group', { name: 'Stay stories' });
    const spa = within(rail).getByRole('button', { name: /Hilom Spa/ });
    expect(spa).toHaveAttribute('data-seen', 'true');
    expect(within(rail).getByRole('button', { name: /The Poolside Bar, new/ })).not.toHaveAttribute('data-seen');

    await user.click(spa);
    expect(onOpen).toHaveBeenCalledWith('Hilom Spa');
  });

  it('renders nothing without reels', () => {
    const { container } = render(<VenueRings entries={[]} seen={[]} onOpen={vi.fn()} />);
    expect(container).toBeEmptyDOMElement();
  });
});
