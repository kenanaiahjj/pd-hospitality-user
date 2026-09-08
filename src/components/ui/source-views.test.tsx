import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SourceGallery, SourceLoadingIndicator, SourceTable } from './source-views';

describe('source views', () => {
  it('renders gallery items as a labeled list', () => {
    render(
      <SourceGallery
        items={[
          { id: 'one', label: 'Stores', children: <span>One</span> },
          { id: 'two', label: 'Offers', children: <span>Two</span> },
        ]}
      />,
    );

    expect(screen.getByRole('list', { name: 'Gallery' })).toBeInTheDocument();
    expect(screen.getByText('Stores')).toBeInTheDocument();
    expect(screen.getByText('Offers')).toBeInTheDocument();
  });

  it('keeps a financial comparison table semantic', () => {
    render(
      <SourceTable
        caption="Recent activity"
        columns={['Merchant', 'Amount']}
        rows={[{ id: 'coffee', cells: ['Coffee shop', '− $4.80'] }]}
      />,
    );

    expect(screen.getByRole('table', { name: 'Recent activity' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Merchant' })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: '− $4.80' })).toBeInTheDocument();
  });

  it('announces a loading state without exposing decorative dots', () => {
    render(<SourceLoadingIndicator label="Loading cards" />);

    expect(screen.getByRole('status', { name: 'Loading cards' })).toBeInTheDocument();
  });
});
