import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import HomePage from './page';

describe('HomePage', () => {
  it('renders booking-linked onboarding at the root route', () => {
    render(<HomePage />);

    expect(screen.getByText('Klarna', { exact: true })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Your stay starts here' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Open confirmation link' })).toBeInTheDocument();
    expect(screen.queryByRole('navigation', { name: 'Primary navigation' })).toBeNull();
  });
});
