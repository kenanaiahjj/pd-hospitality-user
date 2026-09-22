import userEvent from '@testing-library/user-event';
import { act, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DiscoverFeed } from './discover-feed';
import { RoomScanner } from './room-scanner';
import { RoomUnlocked } from './room-unlocked';
import { SwipeDeck } from './swipe-deck';
import type { CategoryCard, FeaturedCard, SearchableItem, Story } from './story-model';

const image = {
  src: '/experiments/photo-1566073771259-6a8506099945.jpg',
  alt: 'The property at dusk',
  focalPoint: '50% 50%',
};

const story: Story = {
  id: 'story-spa',
  title: 'Hilom Spa',
  subtitle: 'Lower lobby',
  price: '₱2,400',
  cta: 'Book a time',
  cover: image,
  slides: [{ headline: 'WELLNESS', detail: 'A quiet hour', image }],
  author: { name: 'Hilom Spa', kind: 'venue', image },
  postedHoursAgo: 2,
  livesForHours: 24,
};

const category: CategoryCard = {
  id: 'spa',
  title: 'Spa & Wellness',
  subtitle: 'Restore and recharge',
  count: 1,
  image,
};

const item: SearchableItem = {
  id: 'spa',
  title: 'Hilom signature massage',
  category: 'Spa & Wellness',
  price: '₱2,400',
  detail: 'Hilom Spa',
  image,
  where: 'Lower lobby',
  runBy: { name: 'Hilom Spa', kind: 'venue' },
  cutoff: '24-hour cancellation cutoff',
};

const featured: FeaturedCard = {
  id: 'spa',
  title: 'Hilom signature massage',
  category: 'Spa & Wellness',
  price: '₱2,400',
  detail: 'Hilom Spa',
  image,
  reason: { kind: 'popular', label: 'Most booked this week' },
};

afterEach(() => {
  vi.useRealTimers();
});

describe('promoted room QR surfaces', () => {
  it('detects on the supplied timer and exposes an accessible cancel action', () => {
    vi.useFakeTimers();
    const onDetected = vi.fn();
    const onCancel = vi.fn();

    render(<RoomScanner roomNumber="304" autoDetectMs={1000} onDetected={onDetected} onCancel={onCancel} />);

    expect(screen.getByRole('heading', { name: 'Place QR code in the frame' })).toBeInTheDocument();
    expect(screen.getByText(/desk card in room 304/)).toBeInTheDocument();
    expect(onDetected).not.toHaveBeenCalled();

    act(() => vi.advanceTimersByTime(1000));
    expect(onDetected).toHaveBeenCalledOnce();
  });

  it('waits for a real decoder when automatic detection is disabled', async () => {
    const user = userEvent.setup();
    const onDetected = vi.fn();
    const onCancel = vi.fn();
    const onPickFromPhotos = vi.fn();

    render(
      <RoomScanner
        autoDetectMs={null}
        onDetected={onDetected}
        onCancel={onCancel}
        onPickFromPhotos={onPickFromPhotos}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Choose a photo instead' }));
    await user.click(screen.getByRole('button', { name: 'Close scanner' }));

    expect(onPickFromPhotos).toHaveBeenCalledOnce();
    expect(onCancel).toHaveBeenCalledOnce();
    expect(onDetected).not.toHaveBeenCalled();
  });

  it('routes both actions from the unlock success state through props', async () => {
    const user = userEvent.setup();
    const onExplore = vi.fn();
    const onViewStay = vi.fn();

    render(
      <RoomUnlocked
        property="The Henry Manila"
        roomNumber="304"
        checkOut="November 12"
        onExplore={onExplore}
        onViewStay={onViewStay}
      />,
    );

    expect(screen.getByRole('heading', { name: /all set/i })).toBeInTheDocument();
    expect(screen.getByText(/Room 304 is confirmed/)).toBeInTheDocument();
    expect(screen.getByText('Charge to room')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Explore' }));
    await user.click(screen.getByRole('button', { name: 'Back to my stay' }));

    expect(onExplore).toHaveBeenCalledOnce();
    expect(onViewStay).toHaveBeenCalledOnce();
  });
});

describe('promoted discovery feed', () => {
  it('keeps every discovery action on an explicit host callback', async () => {
    const user = userEvent.setup();
    const onOpenStory = vi.fn();
    const onOpenItem = vi.fn();
    const onOpenCategory = vi.fn();
    const onBrowseAll = vi.fn();

    render(
      <DiscoverFeed
        property="The Henry Manila"
        stories={[story]}
        categories={[category]}
        searchIndex={[item]}
        onOpenStory={onOpenStory}
        onOpenItem={onOpenItem}
        onOpenCategory={onOpenCategory}
        onBrowseAll={onBrowseAll}
        deck={<SwipeDeck items={[featured]} onOpen={onOpenItem} />}
      />,
    );

    expect(screen.getByRole('heading', { name: 'What’s on at The Henry Manila' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Hilom Spa, posted 2h ago/ }));
    await user.click(screen.getByRole('button', { name: /Spa & Wellness/ }));
    await user.click(screen.getByRole('button', { name: /Press Enter to open/ }));
    await user.click(screen.getByRole('button', { name: 'View all' }));

    expect(onOpenStory).toHaveBeenCalledWith('story-spa');
    expect(onOpenCategory).toHaveBeenCalledWith('spa');
    expect(onOpenItem).toHaveBeenCalledWith('spa');
    expect(onBrowseAll).toHaveBeenCalledOnce();
  });

  it('falls back to catalogue results when typed search has no intent', async () => {
    const user = userEvent.setup();
    const onOpenItem = vi.fn();

    render(
      <DiscoverFeed
        stories={[]}
        banners={[]}
        categories={[]}
        searchIndex={[item]}
        onOpenStory={vi.fn()}
        onOpenBanner={vi.fn()}
        onOpenItem={onOpenItem}
        onOpenCategory={vi.fn()}
        onBrowseAll={vi.fn()}
      />,
    );

    await user.type(screen.getByRole('searchbox', { name: 'Ask anything about your stay' }), 'signature');
    await user.click(screen.getByRole('button', { name: /Hilom signature massage/ }));

    expect(onOpenItem).toHaveBeenCalledWith('spa');
  });
});
