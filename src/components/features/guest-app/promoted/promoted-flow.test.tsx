import userEvent from '@testing-library/user-event';
import { act, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { BrowseSheet, SearchSheet } from './feed-sheets';
import { RoomScanner } from './room-scanner';
import { RoomUnlocked } from './room-unlocked';
import type { SearchableItem } from './story-model';

const image = {
  src: '/experiments/photo-1566073771259-6a8506099945.jpg',
  alt: 'The property at dusk',
  focalPoint: '50% 50%',
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
    expect(screen.getByText(/goes on Room 304/)).toBeInTheDocument();
    // Charging to the room is the line under the places, not a place of its own.
    expect(screen.getByText(/settles at check-out/)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Start exploring/ }));
    await user.click(screen.getByRole('button', { name: 'Back to my stay' }));

    expect(onExplore).toHaveBeenCalledOnce();
    expect(onViewStay).toHaveBeenCalledOnce();
  });
});

describe('feed sheets', () => {
  it('lands each browse row on its category through the host', async () => {
    const user = userEvent.setup();
    const onOpen = vi.fn();
    render(<BrowseSheet categories={[{ id: 'spa', label: 'Spa & Wellness', detail: 'Massages', image }]} onOpen={onOpen} onClose={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: /Spa & Wellness/ }));
    expect(onOpen).toHaveBeenCalledWith('spa');
  });

  it('falls back to catalogue results when typed search has no intent', async () => {
    const user = userEvent.setup();
    const onOpenItem = vi.fn();
    render(<SearchSheet index={[item]} onOpenItem={onOpenItem} onClose={vi.fn()} />);

    await user.type(screen.getByRole('searchbox', { name: 'Ask anything about your stay' }), 'signature');
    await user.click(screen.getByRole('button', { name: /Hilom signature massage/ }));

    expect(onOpenItem).toHaveBeenCalledWith('spa');
  });
});
