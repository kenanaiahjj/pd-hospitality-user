import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { GuestAppPrototype } from './guest-app-prototype';

describe('GuestAppPrototype', () => {
  it('starts with the three booking-linked entry paths', () => {
    render(<GuestAppPrototype />);

    expect(screen.getByRole('heading', { name: 'Your stay starts here' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Open confirmation link' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Simulate Room QR' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Open hotel Wi-Fi entry' })).toBeInTheDocument();
  });

  it('makes all 38 required screens reachable from prototype controls', () => {
    render(<GuestAppPrototype />);

    fireEvent.click(screen.getByRole('button', { name: 'Open prototype controls' }));
    const dialog = screen.getByRole('dialog', { name: 'Prototype controls' });
    expect(within(dialog).getAllByTestId('screen-jump')).toHaveLength(38);
  });

  it('opens the cached Stay QR in the offline arrival scenario', () => {
    render(<GuestAppPrototype />);

    fireEvent.click(screen.getByRole('button', { name: 'Open prototype controls' }));
    fireEvent.click(screen.getByRole('button', { name: 'Try flow C' }));

    expect(screen.getAllByText('Offline')).toHaveLength(2);
    expect(screen.getByRole('heading', { name: 'Your Stay QR works offline' })).toBeInTheDocument();
    expect(screen.getByText('Identity only')).toBeInTheDocument();
  });
});
