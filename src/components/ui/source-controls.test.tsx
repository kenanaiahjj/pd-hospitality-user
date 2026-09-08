import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import {
  SourceAccordion,
  SourceDatePicker,
  SourceFloatingActionButton,
  SourceRatingControl,
  SourceSearchBar,
  SourceSegmentedControl,
  SourceSlider,
  SourceSwitch,
} from './source-controls';

describe('source controls', () => {
  it('updates a segmented control and reports the selected value', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();

    render(<SourceSegmentedControl label="Period" options={[{ value: 'week', label: 'Week' }, { value: 'month', label: 'Month' }]} defaultValue="week" onValueChange={onValueChange} />);

    await user.click(screen.getByRole('tab', { name: 'Month' }));

    expect(screen.getByRole('tab', { name: 'Month' })).toHaveAttribute('aria-selected', 'true');
    expect(onValueChange).toHaveBeenCalledWith('month');
  });

  it('supports a switch with a native switch role', async () => {
    const user = userEvent.setup();
    render(<SourceSwitch label="Rewards" />);

    await user.click(screen.getByRole('switch', { name: 'Rewards' }));

    expect(screen.getByRole('switch', { name: 'Rewards' })).toHaveAttribute('aria-checked', 'true');
  });

  it('updates the rating value when a star is selected', async () => {
    const user = userEvent.setup();
    render(<SourceRatingControl label="Quality" defaultValue={2} />);

    await user.click(screen.getByRole('button', { name: '5 of 5 stars' }));

    expect(screen.getByText('5.0')).toBeInTheDocument();
  });

  it('forwards search value changes', () => {
    const onValueChange = vi.fn();
    render(<SourceSearchBar aria-label="Search elements" onValueChange={onValueChange} />);

    fireEvent.change(screen.getByRole('searchbox', { name: 'Search elements' }), { target: { value: 'card' } });

    expect(onValueChange).toHaveBeenCalledWith('card');
  });

  it('opens an accordion disclosure without losing its heading relationship', async () => {
    const user = userEvent.setup();
    render(<SourceAccordion title="Card details">Your card is ready.</SourceAccordion>);

    const trigger = screen.getByRole('button', { name: 'Card details' });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText('Your card is ready.')).not.toBeVisible();

    await user.click(trigger);

    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('Your card is ready.')).toBeVisible();
  });

  it('reports native date and range control changes', () => {
    const onDateChange = vi.fn();
    const onSliderChange = vi.fn();

    render(
      <>
        <SourceDatePicker label="Payment date" onValueChange={onDateChange} />
        <SourceSlider label="Spend limit" defaultValue={40} onValueChange={onSliderChange} />
        <SourceFloatingActionButton label="Add payment" />
      </>,
    );

    fireEvent.change(screen.getByLabelText('Payment date'), { target: { value: '2026-09-08' } });
    fireEvent.change(screen.getByRole('slider', { name: 'Spend limit' }), { target: { value: '70' } });

    expect(onDateChange).toHaveBeenCalledWith('2026-09-08');
    expect(onSliderChange).toHaveBeenCalledWith(70);
    expect(screen.getByRole('button', { name: 'Add payment' })).toBeInTheDocument();
  });
});
