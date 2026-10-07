import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { GuestAppPrototype } from '../guest-app-prototype';
import { applyPrototypeStayState } from '../prototype-model';

/*
  The pilot's rules, met through the real app: the same screens a guest uses,
  the same controls a presenter uses for the vendor's side. One flow per test.
*/

const live = applyPrototypeStayState('live');
type User = ReturnType<typeof userEvent.setup>;

const openCategory = async (user: User, label: string) => {
  await user.click(within(screen.getByRole('navigation', { name: 'Primary navigation' })).getAllByRole('button')[1]!);
  await user.click(screen.getByRole('button', { name: 'Browse' }));
  await user.click(within(screen.getByRole('dialog', { name: 'Browse' })).getByRole('button', { name: new RegExp(`^${label}`) }));
};

/** The presenter's rig: one event from a named group on the Events tab. */
const fire = async (user: User, eventName: string | RegExp) => {
  await user.click(screen.getByRole('button', { name: 'Open prototype controls' }));
  await user.click(screen.getByRole('tab', { name: 'Events' }));
  await user.click(screen.getByRole('button', { name: eventName }));
  await user.click(screen.getByRole('button', { name: 'Close prototype controls' }));
};

const bookRental = async (user: User, pay: 'room' | 'pay-now') => {
  await openCategory(user, 'Rentals');
  await user.click(screen.getByRole('button', { name: /City bicycle/ }));
  await user.click(within(screen.getByTestId('service-page')).getByRole('button', { name: 'Choose a time' }));
  if (pay === 'pay-now') await user.click(screen.getByRole('button', { name: /Pay now/ }));
  await user.click(screen.getByRole('button', { name: /^Send request/ }));
};

describe('a rental, asked of the vendor', { timeout: 30_000 }, () => {
  it('waits for the vendor and charges nothing until it says yes', async () => {
    const user = userEvent.setup();
    render(<GuestAppPrototype initialScreen="stay-overview" initialSession={live} />);

    await bookRental(user, 'room');
    expect(screen.getByRole('heading', { name: /Request sent/ })).toBeInTheDocument();
    expect(screen.getAllByText(/Nothing is charged until/).length).toBeGreaterThan(0);

    await user.click(screen.getByRole('button', { name: 'View my stay' }));
    expect(screen.getByRole('button', { name: /City bicycle/ })).toBeInTheDocument();
    expect(screen.getByText(/Awaiting provider confirmation/)).toBeInTheDocument();

    await fire(user, /Vendor confirms City bicycle/);
    expect(screen.queryByText(/Awaiting provider confirmation/)).toBeNull();
    await user.click(screen.getByRole('button', { name: /City bicycle/ }));
    expect(screen.getAllByText(/Charged to your room/).length).toBeGreaterThan(0);
  });

  it('takes the card only after the vendor accepts', async () => {
    const user = userEvent.setup();
    render(<GuestAppPrototype initialScreen="stay-overview" initialSession={live} />);

    await bookRental(user, 'pay-now');
    expect(screen.getByRole('heading', { name: /Request sent/ })).toBeInTheDocument();
    // No gateway yet: the vendor has not said yes.
    expect(screen.queryByRole('dialog', { name: 'Secure checkout' })).toBeNull();

    await user.click(screen.getByRole('button', { name: 'View my stay' }));
    await fire(user, /Vendor confirms City bicycle/);
    await user.click(screen.getByRole('button', { name: /City bicycle/ }));
    await user.click(screen.getByRole('button', { name: /^Pay now/ }));

    const gateway = screen.getByRole('dialog', { name: 'Secure checkout' });
    await user.click(within(gateway).getByRole('button', { name: /GCash/ }));
    await user.click(within(gateway).getByRole('button', { name: /^Pay ₱/ }));
    expect(await screen.findByText(/Paid · GCash/, {}, { timeout: 4000 })).toBeInTheDocument();
  });

  it('lets the guest withdraw while the vendor has not answered', async () => {
    const user = userEvent.setup();
    render(<GuestAppPrototype initialScreen="stay-overview" initialSession={live} />);

    await bookRental(user, 'room');
    await user.click(screen.getByRole('button', { name: 'View my stay' }));
    await user.click(screen.getByRole('button', { name: /City bicycle/ }));
    await user.click(screen.getByRole('button', { name: /Withdraw request/ }));
    expect(screen.getAllByText(/Nothing was charged/).length).toBeGreaterThan(0);
  });
});
