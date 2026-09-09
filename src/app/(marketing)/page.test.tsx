import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import HomePage from './page';

describe('HomePage', () => {
  it('renders the account gate at the root route', () => {
    render(<HomePage />);

    expect(screen.getByText('Cabana', { exact: true })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Your stay starts here' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create account' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Log in' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Booking email' })).toBeInTheDocument();
    expect(screen.queryByRole('navigation', { name: 'Primary navigation' })).toBeNull();
  });
});
