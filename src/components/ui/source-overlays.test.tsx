import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { SourceDropdownMenu } from './source-overlays';

describe('source overlays', () => {
  it('opens a dropdown menu and reports the selected action', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();

    render(
      <SourceDropdownMenu
        label="More actions"
        items={[{ id: 'save', label: 'Save card' }, { id: 'share', label: 'Share card' }]}
        onSelect={onSelect}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'More actions' }));
    expect(screen.getByRole('menu', { name: 'More actions menu' })).toBeInTheDocument();

    await user.click(screen.getByRole('menuitem', { name: 'Save card' }));

    expect(onSelect).toHaveBeenCalledWith('save');
    expect(screen.queryByRole('menu', { name: 'More actions menu' })).not.toBeInTheDocument();
  });
});
