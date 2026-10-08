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
    await user.click(screen.getByRole('button', { name: /Request with City Bike Rentals/ }));
    const sheet = screen.getByRole('dialog');
    await user.click(within(sheet).getByRole('button', { name: /Pay by card once they confirm/ }));
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
    expect(screen.getByText(/you can message the vendor here/)).toBeInTheDocument();

    await user.click(within(screen.getByRole('navigation', { name: 'Primary navigation' })).getByRole('button', { name: 'Home' }));
    await bookRental(user, 'room');
    await openMessages(user);
    // Each vendor is a card of its own, and the chat about this booking sits in it.
    const vendor = screen.getByRole('article', { name: /Sakay Rentals/ });
    expect(within(vendor).getByRole('button', { name: /City bicycle, For confirmation/ })).toBeInTheDocument();
  });

  it('keeps every chat one to one: the vendor in the booking chat, the desk in its own', async () => {
    const user = userEvent.setup();
    render(<GuestAppPrototype initialScreen="stay-overview" initialSession={live} />);
    await bookRental(user, 'room');
    await openMessages(user);
    await user.click(screen.getByRole('button', { name: /City bicycle/ }));

    const thread = screen.getByRole('region', { name: /City bicycle conversation/ });
    expect(within(thread).getByRole('heading', { name: 'Sakay Rentals', level: 1 })).toBeInTheDocument();
    expect(within(thread).getByLabelText(/City bicycle, For confirmation/)).toBeInTheDocument();

    await user.type(within(thread).getByRole('textbox'), 'Can we get a helmet too?');
    await user.click(within(thread).getByRole('button', { name: 'Send message' }));
    expect(within(thread).getByText('Can we get a helmet too?')).toBeInTheDocument();

    await fire(user, /Vendor sends a message about City bicycle/);
    expect(within(thread).getByText(/Anything we should prepare/)).toBeInTheDocument();

    // The desk is not in the vendor's chat: what it says about the booking goes to its own chat with the guest.
    await fire(user, /Desk sends a message about City bicycle/);
    expect(within(thread).queryByText(/added that to your City bicycle booking/)).toBeNull();
    await fire(user, /Desk leaves a private note for the vendor of City bicycle/);
    expect(within(thread).queryByText(/Guest is a regular/)).toBeNull();

    await user.click(within(thread).getByRole('button', { name: 'Go back' }));
    await user.click(screen.getByRole('button', { name: /^Front desk, pinned/ }));
    const desk = screen.getByRole('region', { name: 'Front desk conversation' });
    expect(within(desk).getByText(/added that to your City bicycle booking/)).toBeInTheDocument();
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
    await user.click(screen.getByRole('button', { name: 'Yes, cancel' }));
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

describe('when things do not go the straight way', { timeout: 40_000 }, () => {
  const nav = () => within(screen.getByRole('navigation', { name: 'Primary navigation' }));

  it('sends an over-limit room charge to the front desk first, then to the vendor', async () => {
    const user = userEvent.setup();
    render(<GuestAppPrototype initialScreen="stay-overview" initialSession={live} />);

    await openCategory(user, 'Rentals');
    await user.click(screen.getByRole('button', { name: /Compact car/ }));
    await user.click(within(screen.getByTestId('service-page')).getByRole('button', { name: 'Choose a time' }));
    // Two cars is ₱5,600: over the ₱5,000 a room can take without the desk.
    await user.click(screen.getByRole('button', { name: /^More cars/i }));
    expect(screen.getByText(/Over the limit, so the front desk approves it first/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Ask the front desk to approve' }));

    expect(screen.getByRole('heading', { name: /Waiting for the front desk/ })).toBeInTheDocument();
    await fire(user, /Desk approves charging Compact car/);
    // Approved: now it is the vendor's turn, and still nothing is charged.
    await user.click(screen.getByRole('button', { name: 'View my stay' }));
    expect(screen.getByText(/Awaiting provider confirmation/)).toBeInTheDocument();
    await fire(user, /Vendor confirms Compact car/);
    expect(screen.queryByText(/Awaiting provider confirmation/)).toBeNull();
  });

  it('lets the slot go after three failed card payments', async () => {
    const user = userEvent.setup();
    render(<GuestAppPrototype initialScreen="stay-overview" initialSession={live} />);

    // The gateway is set to fail before the guest pays.
    await fire(user, /Payment gateway: working/);
    await openCategory(user, 'Spa & Wellness');
    await user.click(screen.getByRole('button', { name: /Hot stone therapy/ }));
    await user.click(within(screen.getByTestId('service-page')).getByRole('button', { name: 'Choose a time' }));
    await user.click(screen.getByRole('button', { name: /Pay now/ }));
    await user.click(screen.getByRole('button', { name: /^Continue to pay/ }));

    const gateway = screen.getByRole('dialog', { name: 'Secure checkout' });
    await user.click(within(gateway).getByRole('button', { name: /GCash/ }));
    await user.click(within(gateway).getByRole('button', { name: /^Pay ₱/ }));
    expect(await within(gateway).findByText(/2 tries left/, {}, { timeout: 4000 })).toBeInTheDocument();
    await user.click(within(gateway).getByRole('button', { name: /^Pay ₱/ }));
    expect(await within(gateway).findByText(/1 try left/, {}, { timeout: 4000 })).toBeInTheDocument();
    await user.click(within(gateway).getByRole('button', { name: /^Pay ₱/ }));
    expect(await within(gateway).findByText(/failed three times, so the slot was released/, {}, { timeout: 4000 })).toBeInTheDocument();
    await user.click(within(gateway).getByRole('button', { name: 'Close' }));
    expect(screen.getByRole('heading', { name: /Hot stone therapy is not booked/ })).toBeInTheDocument();
  });

  it('lapses a request the vendor never answers, and says nothing was charged', async () => {
    const user = userEvent.setup();
    render(<GuestAppPrototype initialScreen="stay-overview" initialSession={live} />);
    await bookRental(user, 'room');
    // The vendor has half an hour; an hour on, it has lapsed.
    await fire(user, /Move the clock on an hour/);

    await openMessages(user);
    expect(screen.getByRole('button', { name: /City bicycle, Lapsed/ })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /City bicycle/ }));
    expect(screen.getByLabelText(/City bicycle, Lapsed/)).toBeInTheDocument();
    expect(screen.getAllByText(/did not answer in time/).length).toBeGreaterThan(0);
    // A lapsed request can be reinstated by the desk.
    await fire(user, /Desk reinstates City bicycle/);
    expect(screen.getByLabelText(/City bicycle, For confirmation/)).toBeInTheDocument();
  });

  it('books a nearby table before the stay has started', async () => {
    const user = userEvent.setup();
    render(<GuestAppPrototype initialScreen="nearby-establishment" initialSession={applyPrototypeStayState('pre-arrival')} />);

    await user.click(screen.getByRole('button', { name: 'Reserve a table' }));
    const sheet = screen.getByRole('dialog');
    await user.click(within(sheet).getByRole('button', { name: 'Reserve table' }));
    expect(screen.getByRole('heading', { name: /Table at Kape Lab Manila/ })).toBeInTheDocument();
    expect(screen.getByLabelText(/Reserved/)).toBeInTheDocument();
  });

  it('keeps one booking when the same slot is asked for twice', async () => {
    const user = userEvent.setup();
    render(<GuestAppPrototype initialScreen="stay-overview" initialSession={live} />);
    await bookRental(user, 'room');
    await bookRental(user, 'room');

    await openMessages(user);
    expect(screen.getAllByRole('button', { name: /City bicycle/ })).toHaveLength(1);
    expect(nav().getByRole('button', { name: /^Chat/ })).toBeInTheDocument();
  });
});

describe('after the stay', { timeout: 30_000 }, () => {
  const out = applyPrototypeStayState('just-checked-out');

  it('does not take a shop order for a stay that is over, and says why', async () => {
    const user = userEvent.setup();
    render(<GuestAppPrototype initialScreen="gifts-souvenirs" initialSession={out} />);
    await user.click(screen.getByRole('button', { name: /Artisan pasalubong box/ }));
    const sheet = screen.getByRole('dialog', { name: 'Order Artisan pasalubong box' });
    expect(within(sheet).getByText(/Your stay is over/)).toBeInTheDocument();
    expect(within(sheet).getByRole('button', { name: /Order and charge/ })).toBeDisabled();
  });

  it('does not take a nearby table for a stay that is over, and says why', async () => {
    const user = userEvent.setup();
    render(<GuestAppPrototype initialScreen="nearby-establishment" initialSession={out} />);
    await user.click(screen.queryByRole('button', { name: 'Reserve a table' }) ?? screen.getByRole('button', { name: /Book with/ }));
    const sheet = screen.getByRole('dialog');
    const confirm = within(sheet).queryByRole('button', { name: 'Reserve table' });
    if (confirm) {
      await user.click(confirm);
      expect(screen.getByText(/Your stay is over/)).toBeInTheDocument();
    }
  });
});

describe('what the reviews found', { timeout: 40_000 }, () => {
  it('books the same slot again after the vendor declines it, as a new booking', async () => {
    const user = userEvent.setup();
    render(<GuestAppPrototype initialScreen="stay-overview" initialSession={live} />);
    await bookRental(user, 'room');
    await fire(user, /Vendor is not available for City bicycle/);
    await bookRental(user, 'room');
    // The new one is live and waiting; the old one is still there, declined.
    expect(screen.getByRole('heading', { name: /Request sent/ })).toBeInTheDocument();
    await openMessages(user);
    const rows = screen.getAllByRole('button', { name: /City bicycle/ });
    expect(rows).toHaveLength(2);
    expect(rows.map((row) => row.getAttribute('aria-label')).join(' | ')).toMatch(/For confirmation/);
    expect(rows.map((row) => row.getAttribute('aria-label')).join(' | ')).toMatch(/Not available/);
  });

  it('survives the presenter resetting the demo while the gateway is open, and keeps working', async () => {
    const user = userEvent.setup();
    render(<GuestAppPrototype initialScreen="stay-overview" initialSession={live} />);
    await openCategory(user, 'Spa & Wellness');
    await user.click(screen.getByRole('button', { name: /Hot stone therapy/ }));
    await user.click(within(screen.getByTestId('service-page')).getByRole('button', { name: 'Choose a time' }));
    await user.click(screen.getByRole('button', { name: /Pay now/ }));
    await user.click(screen.getByRole('button', { name: /^Continue to pay/ }));
    expect(screen.getByRole('dialog', { name: 'Secure checkout' })).toBeInTheDocument();

    // The same demo state, applied again: a new world, with the stay registered afresh.
    await user.click(screen.getByRole('button', { name: 'Open prototype controls' }));
    await user.click(screen.getByRole('tab', { name: 'State' }));
    await user.click(screen.getByRole('radio', { name: /Live stay/ }));
    expect(screen.queryByRole('dialog', { name: 'Secure checkout' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Open prototype controls' })).toBeInTheDocument();

    // And the rental still goes through the engine afterwards.
    await bookRental(user, 'room');
    expect(screen.getByRole('heading', { name: /Request sent/ })).toBeInTheDocument();
  });

  it('keeps a stay the desk cancelled cancelled, even after the clock moves', async () => {
    const user = userEvent.setup();
    render(<GuestAppPrototype initialScreen="stay-overview" initialSession={live} />);
    await fire(user, /Desk cancels the stay/);
    await fire(user, /Move the clock on an hour/);

    await openCategory(user, 'Rentals');
    await user.click(screen.getByRole('button', { name: /City bicycle/ }));
    await user.click(within(screen.getByTestId('service-page')).getByRole('button', { name: 'Choose a time' }));
    expect(screen.getByText(/This stay was cancelled/)).toBeInTheDocument();
  });

  it('does not clear the front desk’s unread while the guest reads a booking thread', async () => {
    const user = userEvent.setup();
    render(<GuestAppPrototype initialScreen="stay-overview" initialSession={live} />);
    await bookRental(user, 'room');
    await fire(user, /Desk sends a message in the chat/);
    await openMessages(user);
    expect(screen.getByRole('button', { name: /Front desk, pinned, new message/ })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /City bicycle/ }));
    await user.click(screen.getByRole('button', { name: 'Go back' }));
    expect(screen.getByRole('button', { name: /Front desk, pinned, new message/ })).toBeInTheDocument();
  });

  it('shows a refused charge as still owed rather than free', async () => {
    const user = userEvent.setup();
    render(<GuestAppPrototype initialScreen="stay-overview" initialSession={live} />);
    await fire(user, /Hotel system: working/);
    await fire(user, /Hotel system: down/);
    await openCategory(user, 'Spa & Wellness');
    await user.click(screen.getByRole('button', { name: /Hot stone therapy/ }));
    await user.click(within(screen.getByTestId('service-page')).getByRole('button', { name: 'Choose a time' }));
    await user.click(screen.getByRole('button', { name: /Confirm and charge/ }));
    // Never "complimentary": it is on the bill, waiting for the hotel system.
    expect(screen.queryByText(/Complimentary/)).toBeNull();
    expect(screen.getAllByText(/Charged to room|Charged to your room/).length).toBeGreaterThan(0);
  });

  it('opens a nearby sheet late on the last day, when no slot is left, without breaking', async () => {
    const user = userEvent.setup();
    render(<GuestAppPrototype initialScreen="nearby-establishment" initialSession={applyPrototypeStayState('checkout-day')} />);
    await user.click(screen.getByRole('button', { name: 'Open prototype controls' }));
    await user.click(screen.getByRole('tab', { name: 'Clock' }));
    await user.click(screen.getByRole('button', { name: /Late/ }));
    await user.click(screen.getByRole('button', { name: 'Close prototype controls' }));
    const open = screen.queryByRole('button', { name: 'Reserve a table' });
    if (open) {
      await user.click(open);
      expect(screen.getByText(/No tables left/)).toBeInTheDocument();
      expect(within(screen.getByRole('dialog')).getByRole('button', { name: 'Reserve table' })).toBeDisabled();
    }
    expect(screen.getByRole('button', { name: 'Open prototype controls' })).toBeInTheDocument();
  });

});

describe('what the audit asked for', { timeout: 50_000 }, () => {
  const nav = () => within(screen.getByRole('navigation', { name: 'Primary navigation' }));

  it('stops the desk checking a guest out over a charge in question, until the desk settles it', async () => {
    const user = userEvent.setup();
    render(<GuestAppPrototype initialScreen="stay-overview" initialSession={live} />);
    // Morning, so today's pickup is ahead; the bike is confirmed, scanned, and given an extra charge.
    await user.click(screen.getByRole('button', { name: 'Open prototype controls' }));
    await user.click(screen.getByRole('tab', { name: 'Clock' }));
    await user.click(screen.getByRole('button', { name: /Morning/ }));
    await user.click(screen.getByRole('button', { name: 'Close prototype controls' }));
    await bookRental(user, 'room');
    await fire(user, /Vendor confirms City bicycle/);
    await fire(user, /Vendor scans City bicycle/);
    await fire(user, /Vendor adds a ₱300 extra charge to City bicycle/);

    // The guest questions it from its card.
    await user.click(nav().getByRole('button', { name: /My Stay/ }));
    await user.click(screen.getAllByRole('button', { name: /Late return fee/ })[0]!);
    await user.click(screen.getByRole('button', { name: 'Question this charge' }));

    await fire(user, /Desk checks the guest out/);
    expect(screen.getByText(/The desk cannot check them out/)).toBeInTheDocument();
    expect(screen.getAllByText(/in question/).length).toBeGreaterThan(0);

    await fire(user, /Desk upholds the ₱300 charge on City bicycle/);
    await fire(user, /Desk checks the guest out/);
    expect(screen.queryByText(/The desk cannot check them out/)).toBeNull();
  });

  it('holds a lobby-shop order for the departure day, chilled, when the guest asks', async () => {
    const user = userEvent.setup();
    render(<GuestAppPrototype initialScreen="gifts-souvenirs" initialSession={live} />);
    await user.click(screen.getByRole('button', { name: /Artisan pasalubong box/ }));
    const sheet = screen.getByRole('dialog', { name: 'Order Artisan pasalubong box' });
    await user.click(within(sheet).getByRole('button', { name: /Hold it for my departure day/ }));
    await user.click(within(sheet).getByRole('button', { name: 'Order and charge ₱850 to room' }));

    expect(screen.getAllByText(/Departure day/).length).toBeGreaterThan(0);
    await fire(user, /Desk marks Artisan pasalubong box ready/);
    expect(screen.getAllByText(/Front desk, chilled/).length).toBeGreaterThan(0);
  });

  it('keeps the way back online for a vendor whose request has lapsed', async () => {
    const user = userEvent.setup();
    render(<GuestAppPrototype initialScreen="stay-overview" initialSession={live} />);
    await bookRental(user, 'room');
    await fire(user, /Sakay Rentals loses signal/);
    await fire(user, /Move the clock on an hour/);
    // The request lapsed with the vendor offline: the switch back is still there.
    await user.click(screen.getByRole('button', { name: 'Open prototype controls' }));
    await user.click(screen.getByRole('tab', { name: 'Events' }));
    expect(screen.getByRole('button', { name: /Sakay Rentals is back online/ })).toBeInTheDocument();
  });

  it('books through a hotel system that is down: the engine queues the charge instead of blocking', async () => {
    const user = userEvent.setup();
    render(<GuestAppPrototype initialScreen="stay-overview" initialSession={live} />);
    await user.click(screen.getByRole('button', { name: 'Open prototype controls' }));
    await user.click(screen.getByRole('tab', { name: 'Conditions' }));
    await user.click(screen.getByRole('button', { name: /Hotel system down/ }));
    await user.click(screen.getByRole('button', { name: 'Close prototype controls' }));

    await openCategory(user, 'Spa & Wellness');
    await user.click(screen.getByRole('button', { name: /Hot stone therapy/ }));
    await user.click(within(screen.getByTestId('service-page')).getByRole('button', { name: 'Choose a time' }));
    await user.click(screen.getByRole('button', { name: /Confirm and charge/ }));
    expect(screen.getByRole('heading', { name: 'Hot stone therapy is booked' })).toBeInTheDocument();
  });

  it('tells the presenter when the engine refuses what they asked of it', async () => {
    const user = userEvent.setup();
    render(<GuestAppPrototype initialScreen="stay-overview" initialSession={live} />);
    await bookRental(user, 'room');
    await fire(user, /Vendor confirms City bicycle/);
    // No signal and nothing saved on the shop's phone: the scan is refused, and the presenter is told why.
    await fire(user, /Sakay Rentals loses signal/);
    await fire(user, /Vendor scans City bicycle/);
    expect(screen.getByText('Not allowed')).toBeInTheDocument();
    expect(screen.getByText(/No signal and no saved bookings/)).toBeInTheDocument();
  });
});

describe('a stay with a life in it, and every trigger in view', { timeout: 50_000 }, () => {
  const nav = () => within(screen.getByRole('navigation', { name: 'Primary navigation' }));

  it('lists every vendor and desk trigger on a fresh stay, greyed with the reason when there is nothing to act on', async () => {
    const user = userEvent.setup();
    render(<GuestAppPrototype initialScreen="stay-overview" initialSession={live} />);
    await user.click(screen.getByRole('button', { name: 'Open prototype controls' }));
    await user.click(screen.getByRole('tab', { name: 'Events' }));

    const confirm = screen.getByRole('button', { name: 'Vendor confirms a request' });
    expect(confirm).toBeDisabled();
    expect(confirm).toHaveAccessibleDescription(/Needs a request waiting for the vendor/);
    expect(screen.getByRole('button', { name: 'Vendor sends a message' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Desk approves an over-limit charge' })).toBeDisabled();
    // The ones that need nothing are live from the start.
    expect(screen.getByRole('button', { name: 'Desk sends a message in the chat' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Fill Messages with sample bookings and chats' })).toBeEnabled();
  });

  it('fills Messages and the front desk chat with a stay already lived in, then clears it', async () => {
    const user = userEvent.setup();
    render(<GuestAppPrototype initialScreen="stay-overview" initialSession={live} />);
    await fire(user, /Fill Messages with sample bookings and chats/);
    await openMessages(user);

    for (const title of [/Scooter/, /City bicycle/, /Island day tour/, /Poolside Bar/, /Single-origin/, /Personal training/]) {
      expect(screen.getByRole('button', { name: title })).toBeInTheDocument();
    }
    expect(screen.getByRole('button', { name: /Scooter.*Lapsed/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /City bicycle.*Confirmed.*unread/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Island day tour.*For confirmation/ })).toBeInTheDocument();

    // The front desk chat holds its half of the story, with the desk-made booking as a card.
    await user.click(screen.getByRole('button', { name: /^Front desk/ }));
    expect(screen.getByText(/This is Marites at the front desk/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Personal training session, Confirmed/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Go back' }));

    // And every trigger now has something to act on.
    await user.click(screen.getByRole('button', { name: 'Open prototype controls' }));
    await user.click(screen.getByRole('tab', { name: 'Events' }));
    expect(screen.getByRole('button', { name: /Vendor confirms Island day tour/ })).toBeEnabled();
    await user.click(screen.getByRole('button', { name: 'Clear the sample bookings and chats' }));
    await user.click(screen.getByRole('button', { name: 'Close prototype controls' }));
    await openMessages(user);
    expect(screen.queryByRole('button', { name: /City bicycle/ })).toBeNull();
    expect(nav().getByRole('button', { name: /^Chat/ })).toBeInTheDocument();
  });
});

