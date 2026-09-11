import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import HomePage from './page';

describe('HomePage', () => {
  it('renders the SSO account gate at the root route', () => {
    render(<HomePage />);

    expect(screen.getAllByText('Cabana', { exact: true })).toHaveLength(2);
    expect(screen.getByRole('heading', { name: 'Welcome to your stay' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create account' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Log in' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Get started' })).toBeNull();
    expect(screen.queryByRole('navigation', { name: 'Primary navigation' })).toBeNull();
  });
});
