import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { GuestAppPrototype } from './guest-app-prototype';
import { applyPrototypeStayState } from './prototype-model';

// Whole-screen journeys: under a busy full-suite run they outlast the 5s default.
describe('Explore → ordering', { timeout: 15_000 }, () => {
  const live = applyPrototypeStayState('live');

  it('walks Explore to a venue menu and into chat', async () => {
    const user = userEvent.setup();
    render(<GuestAppPrototype initialScreen="marketplace" initialSession={live} />);

    await user.click(screen.getByRole('button', { name: 'Browse' }));
    await user.click(screen.getByRole('button', { name: /Food & Drinks/ }));
    // The hotel's own bar: ordering is a question for the desk.
    await user.click(screen.getAllByRole('button', { name: /The Poolside Bar/ })[0]!);

    // the browse screen, with the menu photographs
    expect(screen.getByRole('heading', { level: 1, name: 'The Poolside Bar' })).toBeInTheDocument();
    const imgs = [...document.querySelectorAll('img')].map((i) => i.getAttribute('src') || '');
    expect(imgs.some((s) => s.includes('restaurant-menu-page'))).toBe(true);
    // named as the menu, above the practical details rather than buried under them
    const headings = screen.getAllByRole('heading', { level: 2 }).map((heading) => heading.textContent);
    expect(headings.indexOf('Menu')).toBeGreaterThan(-1);
    expect(headings.indexOf('Menu')).toBeLessThan(headings.indexOf('Good to know'));

    // a table is reserved; ordering is a question for the desk, already about this venue
    expect(screen.getByRole('button', { name: 'Reserve a table' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Ask the front desk about the menu/ }));
    expect(document.body.textContent).toMatch(/The Poolside Bar/);
  });

  it('reserves a table at a restaurant: its slots, its party size, nothing to pay', async () => {
    const user = userEvent.setup();
    render(<GuestAppPrototype initialScreen="marketplace" initialSession={live} />);

    await user.click(screen.getByRole('button', { name: 'Browse' }));
    await user.click(screen.getByRole('button', { name: /Food & Drinks/ }));
    await user.click(screen.getAllByRole('button', { name: /Si Señor/ })[0]!);
    await user.click(screen.getByRole('button', { name: 'Reserve a table' }));

    // Si Señor publishes evening tables: the form offers its slots, not a lunchtime default.
    // It is 7 PM in the live stay, so 6:00 and 7:00 PM have gone: the first table still ahead is 8:00 PM.
    expect(screen.getByRole('heading', { name: 'Reserve a table' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Time/ })).toHaveTextContent('8:00 PM');
    expect(screen.getByText('Free to reserve')).toBeInTheDocument();
    expect(screen.getByText('Nothing to pay now')).toBeInTheDocument();
    expect(screen.queryByRole('group', { name: /How would you like to pay/ })).toBeNull();

    await user.click(screen.getByRole('button', { name: 'Reserve a table' }));
    expect(screen.getByRole('heading', { name: /Table reserved at Si Señor/ })).toBeInTheDocument();
    expect(screen.getByText(/Order and pay at the venue/)).toBeInTheDocument();
    // Free to hold: nothing lands on the room bill.
    expect(screen.getByText('No charge to reserve')).toBeInTheDocument();
    expect(screen.queryByText('Charged to room')).toBeNull();
  });

  it('opens a service page from a category listing before the booking form', async () => {
    const user = userEvent.setup();
    render(<GuestAppPrototype initialScreen="marketplace" initialSession={live} />);

    await user.click(screen.getByRole('button', { name: 'Browse' }));
    await user.click(screen.getByRole('button', { name: /Activities & Tours/ }));
    await user.click(screen.getAllByRole('button', { name: /Dumaguete walking tour/ })[0]!);

    const page = screen.getByTestId('service-page');
    expect(within(page).getByRole('heading', { name: 'Dumaguete walking tour', level: 1 })).toBeInTheDocument();
    await user.click(within(page).getByRole('button', { name: 'Choose a time' }));
    expect(screen.getByText(/Live availability is shown for Dumaguete walking tour/)).toBeInTheDocument();
  });

  /*
    The card carries no price line at all now -- the branch removed it, and its
    `priceRange` of "Menu in Chat" is never rendered. Pinned so the absence is
    a decision on record rather than something that quietly drifted.
  */
  it('shows no price on a venue card, because the menu is a photograph', async () => {
    const user = userEvent.setup();
    render(<GuestAppPrototype initialScreen="marketplace" initialSession={live} />);
    await user.click(screen.getByRole('button', { name: 'Browse' }));
    await user.click(screen.getByRole('button', { name: /Food & Drinks/ }));

    const body = document.body.textContent || '';
    expect(body).not.toMatch(/From ₱/);
    expect(body).toMatch(/Si Señor/);
  });
});
