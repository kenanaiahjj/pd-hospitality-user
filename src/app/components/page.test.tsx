import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import ComponentsPage from './page';

describe('ComponentsPage', () => {
  it('keeps the design-system gallery available at /components', () => {
    render(<ComponentsPage />);
    expect(screen.getByRole('heading', { name: /The parts Cabana is built from/i })).toBeInTheDocument();
  });
});
