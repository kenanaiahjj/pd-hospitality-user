import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { GuestAppPrototype } from './guest-app-prototype';
import { applyPrototypeStayState } from './prototype-model';

describe('Explore → ordering', () => {
  const live = applyPrototypeStayState('live');

  it('walks Explore to a venue menu and into chat', async () => {
    const user = userEvent.setup();
    render(<GuestAppPrototype initialScreen="marketplace" initialSession={live} />);

    await user.click(screen.getByRole('button', { name: /Food & Drinks/ }));
    await user.click(screen.getAllByRole('button', { name: /Apartment 1B/ })[0]!);

    // the browse screen, with the menu photographs
    expect(screen.getByRole('heading', { level: 1, name: 'Apartment 1B' })).toBeInTheDocument();
    const imgs = [...document.querySelectorAll('img')].map((i) => i.getAttribute('src') || '');
    expect(imgs.some((s) => s.includes('restaurant-menu-page'))).toBe(true);

    // ordering hands off to chat, already about this venue
    const order = screen.getAllByRole('button', { name: /order|chat/i })[0]!;
    await user.click(order);
    expect(document.body.textContent).toMatch(/Apartment 1B/);
  });

  /*
    The card carries no price line at all now -- the branch removed it, and its
    `priceRange` of "Menu in Chat" is never rendered. Pinned so the absence is
    a decision on record rather than something that quietly drifted.
  */
  it('shows no price on a venue card, because the menu is a photograph', async () => {
    const user = userEvent.setup();
    render(<GuestAppPrototype initialScreen="marketplace" initialSession={live} />);
    await user.click(screen.getByRole('button', { name: /Food & Drinks/ }));

    const body = document.body.textContent || '';
    expect(body).not.toMatch(/From ₱/);
    expect(body).toMatch(/Apartment 1B/);
  });
});
