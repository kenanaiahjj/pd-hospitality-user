import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { DesignSystemGallery } from './design-system-gallery';

describe('DesignSystemGallery', () => {
  it('renders the complete source taxonomy and design-system foundation', () => {
    render(<DesignSystemGallery />);

    expect(screen.getByRole('heading', { name: /The parts Cabana is built from/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Make the next action obvious.' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Keep the screen calm.' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Bring context forward.' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Three token layers, one surface.' })).toBeInTheDocument();
    expect(screen.getByText('36 of 36 elements')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Cabana UI home' })).toBeInTheDocument();
    expect(screen.getByLabelText('Cabana app surface preview')).toBeInTheDocument();
    expect(screen.getByText('Search services and places')).toBeInTheDocument();
    expect(screen.getByText('Room charges')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Stay QR' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Folio' })).toBeInTheDocument();
    expect(screen.getAllByText('During your stay')).toHaveLength(1);
    expect(screen.getByText('Services for you')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Accordion' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Date Picker' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Floating Action Button' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Slider' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Gallery' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Loading Indicator' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Table' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Dropdown Menu' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Photo' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Button' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Card' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Stacked List' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Tab Bar' })).toBeInTheDocument();
  });

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
