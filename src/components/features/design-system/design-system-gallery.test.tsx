import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { DesignSystemGallery } from './design-system-gallery';

describe('DesignSystemGallery', () => {
  it('keeps the light consumer treatment canonical and filters to one category', async () => {
    const user = userEvent.setup();
    render(<DesignSystemGallery />);

    expect(screen.getByText('Cabana light')).toBeInTheDocument();
    expect(screen.getByText('Pink marks the next action. Nothing else.')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /^Overlay 4$/ }));
    expect(screen.getByText('4 of 36 elements')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Bring context forward.' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Make the next action obvious.' })).not.toBeInTheDocument();
  });

  it('filters the component catalog by search text', async () => {
    const user = userEvent.setup();
    render(<DesignSystemGallery />);

    await user.type(screen.getByPlaceholderText('Search elements'), 'carousel');

    expect(screen.getByText('1 of 36 elements')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Carousel' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Button' })).not.toBeInTheDocument();
  });

  it('opens and closes the bottom sheet with a focused dialog', async () => {
    const user = userEvent.setup();
    render(<DesignSystemGallery />);

    await user.click(screen.getByRole('button', { name: 'Open sheet' }));
    expect(screen.getByRole('dialog', { name: 'Choose a transfer speed' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Close' }));
    expect(screen.queryByRole('dialog', { name: 'Choose a transfer speed' })).not.toBeInTheDocument();
  });

  it('closes an overlay with Escape and restores focus to its trigger', async () => {
    const user = userEvent.setup();
    render(<DesignSystemGallery />);
    const trigger = screen.getByRole('button', { name: 'Open overlay' });

    await user.click(trigger);
    expect(screen.getByRole('dialog', { name: 'Confirm your new card' })).toBeInTheDocument();

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(screen.queryByRole('dialog', { name: 'Confirm your new card' })).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });
});
