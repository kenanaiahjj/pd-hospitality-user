import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import HomePage from './page';

describe('HomePage', () => {
  it('renders the booking-first welcome screen at the root route', () => {
    render(<HomePage />);

    expect(screen.getAllByText('Cabana', { exact: true })).toHaveLength(2);
    expect(screen.getByRole('heading', { name: 'Welcome to your stay' })).toBeInTheDocument();
    expect(screen.getByText('Check in before arrival')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Get started' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /create account/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /log in/i })).toBeNull();
    expect(screen.queryByRole('navigation', { name: 'Primary navigation' })).toBeNull();
  });
});
