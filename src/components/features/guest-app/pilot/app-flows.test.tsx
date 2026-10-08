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
    // The entry on My Stay, not the banner that just told the guest about it.
    await user.click(screen.getByRole('button', { name: /City bicycle.*return by/ }));
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
    await user.click(screen.getByRole('button', { name: /City bicycle.*return by/ }));
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

describe('nearby places and the lobby shop', { timeout: 30_000 }, () => {
  it('reserves a table at a nearby restaurant, free to hold, on a slot still ahead', async () => {
    const user = userEvent.setup();
    render(<GuestAppPrototype initialScreen="nearby-establishment" initialSession={live} />);

    await user.click(screen.getByRole('button', { name: 'Reserve a table' }));
    const sheet = screen.getByRole('dialog');
    // It is 7 PM: nothing earlier today is offered, so the day moves on.
    expect(within(sheet).queryByRole('button', { name: 'Today' })).toBeNull();
    await user.click(within(sheet).getByRole('button', { name: 'Reserve table' }));

    expect(screen.getByRole('heading', { name: /Table at Kape Lab Manila/ })).toBeInTheDocument();
    expect(screen.getByLabelText(/Reserved/)).toBeInTheDocument();
    expect(screen.getAllByText(/Bill settled at the restaurant/).length).toBeGreaterThan(0);
  });

  it('orders from the lobby shop to the room, then collects it when the desk has it ready', async () => {
    const user = userEvent.setup();
    render(<GuestAppPrototype initialScreen="gifts-souvenirs" initialSession={live} />);

    await user.click(screen.getByRole('button', { name: /Artisan pasalubong box/ }));
    const sheet = screen.getByRole('dialog', { name: 'Order Artisan pasalubong box' });
    await user.click(within(sheet).getByRole('button', { name: 'Order and charge ₱850 to room' }));

    expect(screen.getByRole('heading', { level: 1, name: /Artisan pasalubong box/ })).toBeInTheDocument();
    expect(screen.getByLabelText(/Confirmed/)).toBeInTheDocument();
    expect(screen.getAllByText(/Charged to your room/).length).toBeGreaterThan(0);

    await fire(user, /Desk marks Artisan pasalubong box ready/);
    expect(screen.getByLabelText(/Ready/)).toBeInTheDocument();
  });

  it('asks a nearby rental shop, and takes the card only once it says yes', async () => {
    const user = userEvent.setup();
    render(<GuestAppPrototype initialScreen="stay-overview" initialSession={live} />);

    await openCategory(user, 'Rentals');
    await user.click(screen.getByRole('button', { name: /City Bike Rentals/ }));
    await user.click(screen.getByRole('button', { name: /Book with City Bike Rentals/ }));
    const sheet = screen.getByRole('dialog');
    await user.click(within(sheet).getByRole('button', { name: /Pay now/ }));
    await user.click(within(sheet).getByRole('button', { name: 'Send request' }));

    // On the booking, waiting; no gateway yet.
    expect(screen.getByLabelText(/For confirmation/)).toBeInTheDocument();
    expect(screen.queryByRole('dialog', { name: 'Secure checkout' })).toBeNull();

    await fire(user, /Vendor confirms City Bike Rentals/);
    await user.click(screen.getByRole('button', { name: /^Pay now/ }));
    const gateway = screen.getByRole('dialog', { name: 'Secure checkout' });
    await user.click(within(gateway).getByRole('button', { name: /GCash/ }));
    await user.click(within(gateway).getByRole('button', { name: /^Pay ₱/ }));
    expect(await screen.findByLabelText(/Confirmed/, {}, { timeout: 4000 })).toBeInTheDocument();
  });
});

const openMessages = async (user: User) => {
  await user.click(within(screen.getByRole('navigation', { name: 'Primary navigation' })).getByRole('button', { name: /^Chat/ }));
};

describe('messages: the front desk, and a thread for every booking', { timeout: 30_000 }, () => {
  it('lists the front desk pinned, and a booking thread once a request exists', async () => {
    const user = userEvent.setup();
    render(<GuestAppPrototype initialScreen="stay-overview" initialSession={live} />);

    await openMessages(user);
    expect(screen.getByRole('heading', { name: 'Messages' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Front desk/ })).toBeInTheDocument();
    expect(screen.getByText(/A thread appears here as soon as you ask for something/)).toBeInTheDocument();

    await user.click(within(screen.getByRole('navigation', { name: 'Primary navigation' })).getByRole('button', { name: 'Home' }));
    await bookRental(user, 'room');
    await openMessages(user);
    const row = screen.getByRole('button', { name: /City bicycle/ });
    expect(within(row).getByText('For confirmation')).toBeInTheDocument();
  });

  it('puts the guest, the desk and the vendor in one thread, each message signed', async () => {
    const user = userEvent.setup();
    render(<GuestAppPrototype initialScreen="stay-overview" initialSession={live} />);
    await bookRental(user, 'room');
    await openMessages(user);
    await user.click(screen.getByRole('button', { name: /City bicycle/ }));

    const thread = screen.getByRole('region', { name: /City bicycle conversation/ });
    expect(within(thread).getByLabelText(/City bicycle, For confirmation/)).toBeInTheDocument();

    await user.type(within(thread).getByRole('textbox'), 'Can we get a helmet too?');
    await user.click(within(thread).getByRole('button', { name: 'Send message' }));
    expect(within(thread).getByText('Can we get a helmet too?')).toBeInTheDocument();

    await fire(user, /Vendor sends a message about City bicycle/);
    await fire(user, /Desk sends a message about City bicycle/);
    expect(within(thread).getByText(/Anything we should prepare/)).toBeInTheDocument();
    expect(within(thread).getAllByText('Sakay Rentals').length).toBeGreaterThan(0);
    expect(within(thread).getByText(/I have added that to your booking/)).toBeInTheDocument();

    // The desk speaks to the vendor privately; the guest's thread never carries it.
    await fire(user, /Desk leaves a private note for the vendor of City bicycle/);
    expect(within(thread).queryByText(/Guest is a regular/)).toBeNull();
  });

  it('shows one booking in the same state in its thread and on its receipt', async () => {
    const user = userEvent.setup();
    render(<GuestAppPrototype initialScreen="stay-overview" initialSession={live} />);
    await bookRental(user, 'room');
    await fire(user, /Vendor confirms City bicycle/);
    await openMessages(user);
    await user.click(screen.getByRole('button', { name: /City bicycle/ }));
    expect(screen.getByLabelText(/City bicycle, Confirmed/)).toBeInTheDocument();
  });

  it('shows a booking the desk made for the guest as a card in the front desk chat', async () => {
    const user = userEvent.setup();
    render(<GuestAppPrototype initialScreen="stay-overview" initialSession={live} />);

    await fire(user, /Desk books a session for the guest, asked in person/);
    await openMessages(user);
    await user.click(screen.getByRole('button', { name: /Front desk/ }));
    expect(screen.getByLabelText(/Personal training session, Confirmed/)).toBeInTheDocument();
    expect(screen.getByText(/Booked by Ana at the front desk/)).toBeInTheDocument();
  });

  it('closes a thread 48 hours after the booking ends, and sends a late question to the front desk', async () => {
    const user = userEvent.setup();
    render(<GuestAppPrototype initialScreen="stay-overview" initialSession={live} />);
    await bookRental(user, 'room');
    await fire(user, /Vendor confirms City bicycle/);
    await user.click(screen.getByRole('button', { name: /^Cancel$/ }));
    expect(screen.getByLabelText(/City bicycle, Cancelled/)).toBeInTheDocument();

    for (let i = 0; i < 3; i += 1) await fire(user, /Move the clock on a day/);
    await openMessages(user);
    await user.click(screen.getByRole('button', { name: /City bicycle/ }));
    const thread = screen.getByRole('region', { name: /City bicycle conversation/ });
    // Still readable, with the Cancelled card on it; no longer a place to reach the vendor.
    expect(within(thread).getByLabelText(/City bicycle, Cancelled/)).toBeInTheDocument();
    expect(screen.getByText(/This thread has closed/)).toBeInTheDocument();

    await user.type(within(thread).getByRole('textbox'), 'Did I leave my lock there?');
    await user.click(within(thread).getByRole('button', { name: 'Send message' }));
    expect(screen.getByRole('heading', { name: 'Front desk', level: 1 })).toBeInTheDocument();
    expect(screen.getByText(/About City bicycle: Did I leave my lock there\?/)).toBeInTheDocument();
  });
});

describe('what reaches the guest after a booking', { timeout: 30_000 }, () => {
  const nav = () => within(screen.getByRole('navigation', { name: 'Primary navigation' }));

  it('tells the guest when the vendor says yes: a banner, then the bell', async () => {
    const user = userEvent.setup();
    render(<GuestAppPrototype initialScreen="stay-overview" initialSession={live} />);
    await bookRental(user, 'room');
    await fire(user, /Vendor confirms City bicycle/);

    expect(screen.getByText('City bicycle confirmed')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /^Notifications, \d+ unread/ }));
    expect(screen.getAllByText('City bicycle confirmed').length).toBeGreaterThan(0);
  });

  it('tells the guest when the vendor cancels, by push and by text', async () => {
    const user = userEvent.setup();
    render(<GuestAppPrototype initialScreen="stay-overview" initialSession={live} />);
    await bookRental(user, 'room');
    await fire(user, /Vendor confirms City bicycle/);
    await fire(user, /Vendor cancels City bicycle/);

    await user.click(screen.getByRole('button', { name: /^Notifications, \d+ unread/ }));
    expect(screen.getAllByText(/City bicycle was cancelled/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Text message/).length).toBeGreaterThan(0);
    // And it can be rebooked from the card.
    await user.click(nav().getByRole('button', { name: 'Home' }));
  });

  it('puts a confirmed room charge on the bill once it is today, and takes it off when it is cancelled', async () => {
    const user = userEvent.setup();
    render(<GuestAppPrototype initialScreen="stay-overview" initialSession={live} />);
    // Morning, so today's pickup is still ahead and the charge is due on the bill today.
    await user.click(screen.getByRole('button', { name: 'Open prototype controls' }));
    await user.click(screen.getByRole('tab', { name: 'Clock' }));
    await user.click(screen.getByRole('button', { name: /Morning/ }));
    await user.click(screen.getByRole('button', { name: 'Close prototype controls' }));

    await bookRental(user, 'room');
    await fire(user, /Vendor confirms City bicycle/);

    await user.click(nav().getByRole('button', { name: /My Stay/ }));
    await user.click(screen.getByRole('button', { name: 'Room charges' }));
    // The stay already has a bicycle on its bill from a day earlier; this is the second.
    const lines = () => ((document.querySelector('.guest-folio-cards')?.textContent ?? '').match(/City bicycle/g) ?? []).length;
    expect(lines()).toBe(2);

    await fire(user, /Vendor cancels City bicycle/);
    expect(lines()).toBe(1);
  });
});

