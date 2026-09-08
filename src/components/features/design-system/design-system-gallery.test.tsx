import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { DesignSystemGallery } from './design-system-gallery';

describe('DesignSystemGallery', () => {
  it('renders the complete source taxonomy and design-system foundation', () => {
    render(<DesignSystemGallery />);

    expect(screen.getByRole('heading', { name: /Klarna × Wise, made reusable/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Make the next step clear.' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Give information a shape.' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'A small set of rules. A lot of room to move.' })).toBeInTheDocument();
    expect(screen.getByText('36 of 36 elements')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Accordion' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Date Picker' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Floating Action Button' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Slider' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Gallery' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Loading Indicator' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Table' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Dropdown Menu' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Photo' })).toBeInTheDocument();
  });

  it('switches source themes and filters to one category', async () => {
    const user = userEvent.setup();
    render(<DesignSystemGallery />);

    await user.click(screen.getByRole('tab', { name: 'Wise' }));
    expect(screen.getByText('Wise green, balanced for everyday use.')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /^Overlay 4$/ }));
    expect(screen.getByText('4 of 36 elements')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Bring focus forward.' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Make the next step clear.' })).not.toBeInTheDocument();
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
