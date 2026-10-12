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
  await user.click(screen.getByRole('button', { name: /Scooter · 125cc/ }));
  await user.click(within(screen.getByTestId('service-page')).getByRole('button', { name: 'Choose a time' }));
  if (pay === 'pay-now') await user.click(screen.getByRole('button', { name: /Pay now/ }));
  await user.click(screen.getByRole('button', { name: /^(Send request|Hold ₱)/ }));
};

describe('a rental, asked of the vendor', { timeout: 30_000 }, () => {
  it('waits for the vendor and charges nothing until it says yes', async () => {
    const user = userEvent.setup();
    render(<GuestAppPrototype initialScreen="stay-overview" initialSession={live} />);

    await bookRental(user, 'room');
    expect(screen.getByRole('heading', { name: /Request sent/ })).toBeInTheDocument();
    expect(screen.getAllByText(/Nothing is charged until/).length).toBeGreaterThan(0);

    await user.click(screen.getByRole('button', { name: 'View My Stay' }));
    expect(screen.getByRole('button', { name: /Scooter · 125cc/ })).toBeInTheDocument();
    expect(screen.getByText(/Awaiting confirmation/)).toBeInTheDocument();

    await fire(user, /Vendor confirms Scooter · 125cc/);
    expect(screen.queryByText(/Awaiting provider confirmation/)).toBeNull();
    // The entry on My Stay, not the banner that just told the guest about it.
    await user.click(screen.getByRole('button', { name: /Scooter · 125cc.*return by/ }));
    expect(screen.getAllByText(/Charged to your room/).length).toBeGreaterThan(0);
  });

  it('holds the payment at booking, and takes it only when the vendor accepts', async () => {
    const user = userEvent.setup();
    render(<GuestAppPrototype initialScreen="stay-overview" initialSession={live} />);

    await bookRental(user, 'pay-now');
    // The payment page opens at once, for a hold, not a charge.
    const gateway = screen.getByRole('dialog', { name: 'Secure checkout' });
    expect(within(gateway).getByText(/Held, not charged/)).toBeInTheDocument();
    await user.click(within(gateway).getByRole('button', { name: /GCash/ }));
    await user.click(within(gateway).getByRole('button', { name: /^Hold ₱/ }));
    expect(await screen.findByText(/is held, not charged/, {}, { timeout: 4000 })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Request sent/ })).toBeInTheDocument();

    // The vendor says yes: the hold is taken, and it is confirmed with nothing more to do.
    await user.click(screen.getByRole('button', { name: 'View My Stay' }));
    await fire(user, /Vendor confirms Scooter · 125cc/);
    await user.click(screen.getByRole('button', { name: /Scooter · 125cc.*return by/ }));
    expect(screen.getByText(/Paid · GCash/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^Pay now/ })).toBeNull();
  });

  it('lets the guest withdraw while the vendor has not answered', async () => {
    const user = userEvent.setup();
    render(<GuestAppPrototype initialScreen="stay-overview" initialSession={live} />);

    await bookRental(user, 'room');
    await user.click(screen.getByRole('button', { name: 'View My Stay' }));
    await user.click(screen.getByRole('button', { name: /Scooter · 125cc/ }));
    await user.click(screen.getByRole('button', { name: /Withdraw request/ }));
    // One more tap: there is no undo.
    await user.click(screen.getByRole('button', { name: 'Yes, withdraw' }));
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

    expect(screen.getByRole('heading', { name: /Table at Seafood grill · Rizal Boulevard/ })).toBeInTheDocument();
    expect(screen.getByLabelText(/Seafood grill · Rizal Boulevard, Confirmed/)).toBeInTheDocument();
    expect(screen.getAllByText(/Bill settled at the restaurant/).length).toBeGreaterThan(0);
  });

  it('orders from the lobby shop to the room, then collects it when the desk has it ready', async () => {
    const user = userEvent.setup();
    render(<GuestAppPrototype initialScreen="gifts-souvenirs" initialSession={live} />);

    await user.click(screen.getByRole('button', { name: /Handwoven market tote/ }));
    const sheet = screen.getByRole('dialog', { name: 'Order Handwoven market tote' });
    await user.click(within(sheet).getByRole('button', { name: 'Order and charge ₱680 to room' }));

    expect(screen.getByRole('heading', { level: 1, name: /Handwoven market tote/ })).toBeInTheDocument();
    expect(screen.getByLabelText(/Confirmed/)).toBeInTheDocument();
    expect(screen.getAllByText(/Charged to your room/).length).toBeGreaterThan(0);

    await fire(user, /Desk marks Handwoven market tote ready/);
    expect(screen.getByLabelText(/Ready/)).toBeInTheDocument();
  });

  it('asks a nearby rental shop, holding the payment until it says yes', async () => {
    const user = userEvent.setup();
    render(<GuestAppPrototype initialScreen="stay-overview" initialSession={live} />);

    await openCategory(user, 'Rentals');
    await user.click(screen.getByRole('button', { name: /Car hire · Calindagan/ }));
    await user.click(screen.getByRole('button', { name: /Request with Car hire · Calindagan/ }));
    const sheet = screen.getByRole('dialog');
    await user.click(within(sheet).getByRole('button', { name: /^Pay now/ }));
    await user.click(within(sheet).getByRole('button', { name: /^Hold ₱.* and send request$/ }));

    // The hold first, then the request goes to the shop.
    const gateway = screen.getByRole('dialog', { name: 'Secure checkout' });
    await user.click(within(gateway).getByRole('button', { name: /GCash/ }));
    await user.click(within(gateway).getByRole('button', { name: /^Hold ₱/ }));
    expect(await screen.findByLabelText(/Awaiting confirmation/, {}, { timeout: 4000 })).toBeInTheDocument();

    await fire(user, /Vendor confirms Car hire · Calindagan/);
    expect(screen.getByLabelText(/Confirmed/)).toBeInTheDocument();
  });
});

const openMessages = async (user: User) => {
  await user.click(within(screen.getByRole('navigation', { name: 'Primary navigation' })).getByRole('button', { name: /^Chat/ }));
};

describe('messages: the front desk, and a thread for every booking', { timeout: 30_000 }, () => {
  it('lists the front desk pinned, and a booking thread once the vendor accepts', async () => {
    const user = userEvent.setup();
    render(<GuestAppPrototype initialScreen="stay-overview" initialSession={live} />);

    await openMessages(user);
    expect(screen.getByRole('heading', { name: 'Chat' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Front desk/ })).toBeInTheDocument();
    expect(screen.getByText(/you can message the vendor here/)).toBeInTheDocument();

    await user.click(within(screen.getByRole('navigation', { name: 'Primary navigation' })).getByRole('button', { name: 'Home' }));
    await bookRental(user, 'room');
    // A request still waiting has no chat.
    await openMessages(user);
    expect(screen.queryByRole('button', { name: /Scooter · 125cc/ })).toBeNull();
    await fire(user, /Vendor confirms Scooter · 125cc/);
    await openMessages(user);
    // A conversation is with a vendor, about a booking, of a kind: all three are in its name.
    expect(screen.getByRole('button', { name: /^Partner bike shop, Scooter · 125cc, .*Rental/ })).toBeInTheDocument();
  });

  it('keeps every chat one to one: the vendor in the booking chat, the desk in its own', async () => {
    const user = userEvent.setup();
    render(<GuestAppPrototype initialScreen="stay-overview" initialSession={live} />);
    await bookRental(user, 'room');
    await fire(user, /Vendor confirms Scooter · 125cc/);
    await openMessages(user);
    await user.click(screen.getByRole('button', { name: /Scooter · 125cc/ }));

    const thread = screen.getByRole('region', { name: /Scooter · 125cc conversation/ });
    expect(within(thread).getByRole('heading', { name: 'Partner bike shop', level: 1 })).toBeInTheDocument();

    await user.type(within(thread).getByRole('textbox'), 'Can we get a helmet too?');
    await user.click(within(thread).getByRole('button', { name: 'Send message' }));
    expect(within(thread).getByText('Can we get a helmet too?')).toBeInTheDocument();

    await fire(user, /Vendor sends a message about Scooter · 125cc/);
    expect(within(thread).getByText(/Anything we should prepare/)).toBeInTheDocument();

    // The desk is not in the vendor's chat: what it says about the booking goes to its own chat with the guest.
    await fire(user, /Desk sends a message about Scooter · 125cc/);
    expect(within(thread).queryByText(/added that to your Scooter · 125cc booking/)).toBeNull();
    await fire(user, /Desk leaves a private note for the vendor of Scooter · 125cc/);
    expect(within(thread).queryByText(/Guest is a regular/)).toBeNull();

    await user.click(within(thread).getByRole('button', { name: 'Go back' }));
    await user.click(screen.getByRole('button', { name: /^Front desk chat/ }));
    const desk = screen.getByRole('region', { name: 'Front desk conversation' });
    expect(within(desk).getByText(/added that to your Scooter · 125cc booking/)).toBeInTheDocument();
  });

  it('lets the front desk read a guest and vendor chat only during a dispute, read only, and tells both', async () => {
    const user = userEvent.setup();
    render(<GuestAppPrototype initialScreen="stay-overview" initialSession={live} />);
    await bookRental(user, 'room');
    await fire(user, /Vendor confirms Scooter · 125cc/);
    await fire(user, /Vendor adds a ₱300 extra charge to Scooter · 125cc/);

    // No dispute yet: the desk has nothing it may read.
    await user.click(screen.getByRole('button', { name: 'Open prototype controls' }));
    await user.click(screen.getByRole('tab', { name: 'Events' }));
    expect(screen.getByRole('button', { name: 'Desk reads a guest and vendor chat' })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'Close prototype controls' }));

    // She questions the charge: a dispute opens, and the desk may read.
    await openMessages(user);
    await user.click(screen.getByRole('button', { name: /Scooter · 125cc/ }));
    await user.click(screen.getByRole('button', { name: 'Question this charge' }));
    await fire(user, /Desk reads the Scooter · 125cc chat for the dispute/);
    const sheet = screen.getByRole('dialog', { name: /Dispute, Extra charge, read only/ });
    expect(within(sheet).getByText('You are not part of this chat')).toBeInTheDocument();
    expect(within(sheet).queryByRole('textbox')).toBeNull();

    // Deciding ends the access.
    await user.click(within(sheet).getByRole('button', { name: 'Uphold' }));
    expect(screen.queryByRole('dialog', { name: /Dispute/ })).toBeNull();
    await user.click(screen.getByRole('button', { name: 'Open prototype controls' }));
    await user.click(screen.getByRole('tab', { name: 'Events' }));
    expect(screen.queryByRole('button', { name: /Desk reads the Scooter · 125cc chat/ })).toBeNull();
    await user.click(screen.getByRole('button', { name: 'Close prototype controls' }));

    // She was told in her chat with the shop, and of the outcome. (Questioning took her to the desk chat; back out first.)
    for (let i = 0; i < 3 && !screen.queryByRole('navigation', { name: 'Primary navigation' }); i += 1) await user.click(screen.getAllByRole('button', { name: 'Go back' })[0]!);
    await openMessages(user);
    await user.click(screen.getByRole('button', { name: /Scooter · 125cc/ }));
    const thread = screen.getByRole('region', { name: /Scooter · 125cc conversation/ });
    expect(within(thread).getByText('The front desk read this chat to settle the dispute.')).toBeInTheDocument();
    expect(within(thread).getByText(/upheld the ₱300 charge/)).toBeInTheDocument();
  });

  it('shows one booking in the same state in its thread and on its receipt', async () => {
    const user = userEvent.setup();
    render(<GuestAppPrototype initialScreen="stay-overview" initialSession={live} />);
    await bookRental(user, 'room');
    await fire(user, /Vendor confirms Scooter · 125cc/);
    await openMessages(user);
    await user.click(screen.getByRole('button', { name: /Scooter · 125cc/ }));
    expect(screen.getByLabelText(/Scooter · 125cc, Confirmed/)).toBeInTheDocument();
  });

  it('shows a booking the desk made for the guest as a card in the front desk chat', async () => {
    const user = userEvent.setup();
    render(<GuestAppPrototype initialScreen="stay-overview" initialSession={live} />);

    await fire(user, /Desk books a session for the guest, asked in person/);
    await openMessages(user);
    await user.click(screen.getByRole('button', { name: /Front desk/ }));
    expect(screen.getByLabelText(/Personal training session, Confirmed/)).toBeInTheDocument();
    expect(screen.getByText(/Booked by Marites at the front desk/)).toBeInTheDocument();
  });

  it('closes a thread 48 hours after the booking ends, and sends a late question to the front desk', async () => {
    const user = userEvent.setup();
    render(<GuestAppPrototype initialScreen="stay-overview" initialSession={live} />);
    await bookRental(user, 'room');
    await fire(user, /Vendor confirms Scooter · 125cc/);
    await user.click(screen.getByRole('button', { name: /^Cancel$/ }));
    await user.click(screen.getByRole('button', { name: 'Yes, cancel' }));
    expect(screen.getByLabelText(/Scooter · 125cc, Cancelled/)).toBeInTheDocument();

    for (let i = 0; i < 3; i += 1) await fire(user, /Move the clock on a day/);
    await openMessages(user);
    await user.click(screen.getByRole('button', { name: /Scooter · 125cc/ }));
    const thread = screen.getByRole('region', { name: /Scooter · 125cc conversation/ });
    // Still readable, with the Cancelled card on it; no longer a place to reach the vendor.
    expect(within(thread).getByLabelText(/Scooter · 125cc, Cancelled/)).toBeInTheDocument();
    expect(screen.getByText(/This thread has closed/)).toBeInTheDocument();

    await user.type(within(thread).getByRole('textbox'), 'Did I leave my lock there?');
    await user.click(within(thread).getByRole('button', { name: 'Send message' }));
    expect(screen.getByRole('heading', { name: 'Front desk', level: 1 })).toBeInTheDocument();
    expect(screen.getByText(/About Scooter · 125cc: Did I leave my lock there\?/)).toBeInTheDocument();
  });
});

describe('what reaches the guest after a booking', { timeout: 30_000 }, () => {
  const nav = () => within(screen.getByRole('navigation', { name: 'Primary navigation' }));

  it('tells the guest a chat with the vendor opened when the vendor accepts, and the banner opens it', async () => {
    const user = userEvent.setup();
    render(<GuestAppPrototype initialScreen="stay-overview" initialSession={live} />);
    await bookRental(user, 'room');

    // A request waits with no chat: the confirmation says when one comes.
    expect(screen.queryByRole('button', { name: /Message Partner bike shop/ })).toBeNull();
    expect(screen.getAllByText(/A chat with them opens once they accept/).length).toBeGreaterThan(0);
    await fire(user, /Vendor confirms Scooter · 125cc/);
    // A banner says the chat is open, and tapping it opens the chat.
    const banner = screen.getByText('Your chat with Partner bike shop is open. Tap to message them.');
    await user.click(banner);
    const thread = screen.getByRole('region', { name: /Scooter · 125cc conversation/ });
    expect(within(thread).getByText(/Only you and them are in this chat/)).toBeInTheDocument();
    // The bell keeps a note of it. (The bell is outside the chat; back out first.)
    await user.click(within(thread).getByRole('button', { name: 'Go back' }));
    await user.click(screen.getByRole('button', { name: /^Notifications, \d+ unread/ }));
    expect(screen.getByText('Chat open with Partner bike shop')).toBeInTheDocument();
  });

  it('tells the guest when the vendor says yes: a banner, then the bell', async () => {
    const user = userEvent.setup();
    render(<GuestAppPrototype initialScreen="stay-overview" initialSession={live} />);
    await bookRental(user, 'room');
    await fire(user, /Vendor confirms Scooter · 125cc/);

    expect(screen.getByText('Scooter · 125cc confirmed')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /^Notifications, \d+ unread/ }));
    expect(screen.getAllByText('Scooter · 125cc confirmed').length).toBeGreaterThan(0);
  });

  it('tells the guest when the vendor cancels, by push and by text', async () => {
    const user = userEvent.setup();
    render(<GuestAppPrototype initialScreen="stay-overview" initialSession={live} />);
    await bookRental(user, 'room');
    await fire(user, /Vendor confirms Scooter · 125cc/);
    await fire(user, /Vendor cancels Scooter · 125cc/);

    await user.click(screen.getByRole('button', { name: /^Notifications, \d+ unread/ }));
    expect(screen.getAllByText(/Scooter · 125cc was cancelled/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Text message/).length).toBeGreaterThan(0);
    // And it can be rebooked from the card.
    await user.click(nav().getByRole('button', { name: 'Home' }));
  });

  it('puts a confirmed room charge on the bill once its hour comes, not the morning of', async () => {
    const user = userEvent.setup();
    render(<GuestAppPrototype initialScreen="stay-overview" initialSession={live} />);
    const setClock = async (label: RegExp) => {
      await user.click(screen.getByRole('button', { name: 'Open prototype controls' }));
      await user.click(screen.getByRole('tab', { name: 'Clock' }));
      await user.click(screen.getByRole('button', { name: label }));
      await user.click(screen.getByRole('button', { name: 'Close prototype controls' }));
    };
    // Morning: today's 1:30 PM pickup is still ahead.
    await setClock(/Morning/);
    await bookRental(user, 'room');
    await fire(user, /Vendor confirms Scooter · 125cc/);

    // Today's scooter is not on the bill yet.
    const lines = () => ((document.querySelector('.guest-folio-cards')?.textContent ?? '').match(/Scooter · 125cc/g) ?? []).length;
    await user.click(nav().getByRole('button', { name: /My Stay/ }));
    await user.click(screen.getByRole('button', { name: 'Room charges' }));
    expect(lines()).toBe(0);

    // Afternoon: the pickup's hour has come, and it is on the bill.
    await setClock(/Afternoon/);
    await user.click(nav().getByRole('button', { name: /My Stay/ }));
    await user.click(screen.getByRole('button', { name: 'Room charges' }));
    expect(lines()).toBe(1);
  });
});

describe('when things do not go the straight way', { timeout: 40_000 }, () => {
  const nav = () => within(screen.getByRole('navigation', { name: 'Primary navigation' }));

  it('sends a large room charge straight to the vendor while room-bill limits are off', async () => {
    const user = userEvent.setup();
    render(<GuestAppPrototype initialScreen="stay-overview" initialSession={live} />);

    await openCategory(user, 'Rentals');
    await user.click(screen.getByRole('button', { name: /Bike rental/ }));
    await user.click(within(screen.getByTestId('service-page')).getByRole('button', { name: 'Choose a time' }));
    // Several bikes on the room. Room-bill limits are off in this prototype, so it goes straight to the vendor.
    await user.click(screen.getByRole('button', { name: /^More bikes/i }));
    expect(screen.queryByText(/Over the limit, so the front desk approves it first/)).toBeNull();
    await user.click(screen.getByRole('button', { name: /^(Send request|Request|Book)/ }));

    expect(screen.queryByRole('heading', { name: /Waiting for the front desk/ })).toBeNull();
    // The vendor's turn, and nothing is charged yet.
    await user.click(screen.getByRole('button', { name: 'View My Stay' }));
    expect(screen.getByText(/Awaiting confirmation/)).toBeInTheDocument();
    await fire(user, /Vendor confirms Bike rental/);
    expect(screen.queryByText(/Awaiting confirmation/)).toBeNull();
  });

  it('lets the slot go after three failed card payments', async () => {
    const user = userEvent.setup();
    render(<GuestAppPrototype initialScreen="stay-overview" initialSession={live} />);

    // The gateway is set to fail before the guest pays.
    await fire(user, /Payment gateway: working/);
    await openCategory(user, 'Spa & Wellness');
    await user.click(screen.getByRole('button', { name: /Calamansi brightening facial/ }));
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
    expect(screen.getByRole('heading', { name: /Calamansi brightening facial is not booked/ })).toBeInTheDocument();
  });

  it('lapses a request the vendor never answers, and says nothing was charged', async () => {
    const user = userEvent.setup();
    render(<GuestAppPrototype initialScreen="stay-overview" initialSession={live} />);
    await bookRental(user, 'room');
    // The vendor has half an hour; an hour on, it has lapsed.
    await fire(user, /Move the clock on an hour/);

    expect(screen.getAllByText(/(did not answer|no answer[^.]*) in time/i).length).toBeGreaterThan(0);
    // A lapsed request never had a chat.
    await openMessages(user);
    expect(screen.queryByRole('button', { name: /Scooter · 125cc/ })).toBeNull();
    // The desk can reinstate it; it waits again, still with no chat until the vendor accepts.
    await fire(user, /Desk reinstates Scooter · 125cc/);
    expect(screen.getByText(/sent your request back to the vendor/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^Partner bike shop, Scooter · 125cc/ })).toBeNull();
    await fire(user, /Vendor confirms Scooter · 125cc/);
    expect(screen.getByRole('button', { name: /^Partner bike shop, Scooter · 125cc/ })).toBeInTheDocument();
  });

  it('books a nearby table before the stay has started', async () => {
    const user = userEvent.setup();
    render(<GuestAppPrototype initialScreen="nearby-establishment" initialSession={applyPrototypeStayState('pre-arrival')} />);

    await user.click(screen.getByRole('button', { name: 'Reserve a table' }));
    const sheet = screen.getByRole('dialog');
    await user.click(within(sheet).getByRole('button', { name: 'Reserve table' }));
    expect(screen.getByRole('heading', { name: /Table at Seafood grill · Rizal Boulevard/ })).toBeInTheDocument();
    expect(screen.getByLabelText(/Seafood grill · Rizal Boulevard, Confirmed/)).toBeInTheDocument();
  });

  it('keeps one booking when the same slot is asked for twice', async () => {
    const user = userEvent.setup();
    render(<GuestAppPrototype initialScreen="stay-overview" initialSession={live} />);
    await bookRental(user, 'room');
    await bookRental(user, 'room');
    await fire(user, /Vendor confirms Scooter · 125cc/);

    await openMessages(user);
    expect(screen.getAllByRole('button', { name: /^Partner bike shop, Scooter · 125cc/ })).toHaveLength(1);
    expect(nav().getByRole('button', { name: /^Chat/ })).toBeInTheDocument();
  });
});

describe('after the stay', { timeout: 30_000 }, () => {
  const out = applyPrototypeStayState('just-checked-out');

  it('does not take a shop order for a stay that is over, and says why', async () => {
    const user = userEvent.setup();
    render(<GuestAppPrototype initialScreen="gifts-souvenirs" initialSession={out} />);
    await user.click(screen.getByRole('button', { name: /Handwoven market tote/ }));
    const sheet = screen.getByRole('dialog', { name: 'Order Handwoven market tote' });
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
    await fire(user, /Vendor is not available for Scooter · 125cc/);
    await bookRental(user, 'room');
    // The new one is live and waiting; the old one is still there, declined.
    expect(screen.getByRole('heading', { name: /Request sent/ })).toBeInTheDocument();
    // Neither has a chat: one was declined, the other still waits.
    await openMessages(user);
    expect(screen.queryByRole('button', { name: /Scooter · 125cc/ })).toBeNull();
    await fire(user, /Vendor confirms Scooter · 125cc/);
    expect(screen.getAllByRole('button', { name: /^Partner bike shop, Scooter · 125cc/ })).toHaveLength(1);
  });

  it('survives the presenter resetting the demo while the gateway is open, and keeps working', async () => {
    const user = userEvent.setup();
    render(<GuestAppPrototype initialScreen="stay-overview" initialSession={live} />);
    await openCategory(user, 'Spa & Wellness');
    await user.click(screen.getByRole('button', { name: /Calamansi brightening facial/ }));
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
    await user.click(screen.getByRole('button', { name: /Scooter · 125cc/ }));
    await user.click(within(screen.getByTestId('service-page')).getByRole('button', { name: 'Choose a time' }));
    expect(screen.getByText(/This stay was cancelled/)).toBeInTheDocument();
  });

  it('does not clear the front desk’s unread while the guest reads a booking thread', async () => {
    const user = userEvent.setup();
    render(<GuestAppPrototype initialScreen="stay-overview" initialSession={live} />);
    await bookRental(user, 'room');
    await fire(user, /Vendor confirms Scooter · 125cc/);
    await fire(user, /Desk sends a message in the chat/);
    await openMessages(user);
    expect(screen.getByRole('button', { name: /Front desk chat, new message/ })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Scooter · 125cc/ }));
    await user.click(screen.getByRole('button', { name: 'Go back' }));
    expect(screen.getByRole('button', { name: /Front desk chat, new message/ })).toBeInTheDocument();
  });

  it('shows a refused charge as still owed rather than free', async () => {
    const user = userEvent.setup();
    render(<GuestAppPrototype initialScreen="stay-overview" initialSession={live} />);
    await fire(user, /Hotel system: working/);
    await fire(user, /Hotel system: down/);
    await openCategory(user, 'Spa & Wellness');
    await user.click(screen.getByRole('button', { name: /Calamansi brightening facial/ }));
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
    await fire(user, /Vendor confirms Scooter · 125cc/);
    await fire(user, /Vendor scans Scooter · 125cc/);
    await fire(user, /Vendor adds a ₱300 extra charge to Scooter · 125cc/);

    // The guest questions it from its card.
    await user.click(nav().getByRole('button', { name: /My Stay/ }));
    await user.click(screen.getAllByRole('button', { name: /Late return fee/ })[0]!);
    await user.click(screen.getByRole('button', { name: 'Question this charge' }));

    await fire(user, /Desk checks the guest out/);
    expect(screen.getByText(/The desk cannot check them out/)).toBeInTheDocument();
    expect(screen.getAllByText(/in question/).length).toBeGreaterThan(0);

    await fire(user, /Desk upholds the ₱300 charge on Scooter · 125cc/);
    await fire(user, /Desk checks the guest out/);
    expect(screen.queryByText(/The desk cannot check them out/)).toBeNull();
  });

  it('holds a lobby-shop order for the departure day, chilled, when the guest asks', async () => {
    const user = userEvent.setup();
    render(<GuestAppPrototype initialScreen="gifts-souvenirs" initialSession={live} />);
    await user.click(screen.getByRole('button', { name: /Handwoven market tote/ }));
    const sheet = screen.getByRole('dialog', { name: 'Order Handwoven market tote' });
    await user.click(within(sheet).getByRole('button', { name: /Hold it for my departure day/ }));
    await user.click(within(sheet).getByRole('button', { name: 'Order and charge ₱680 to room' }));

    expect(screen.getAllByText(/Departure day/).length).toBeGreaterThan(0);
    await fire(user, /Desk marks Handwoven market tote ready/);
    expect(screen.getAllByText(/Front desk, chilled/).length).toBeGreaterThan(0);
  });

  it('keeps the way back online for a vendor whose request has lapsed', async () => {
    const user = userEvent.setup();
    render(<GuestAppPrototype initialScreen="stay-overview" initialSession={live} />);
    await bookRental(user, 'room');
    await fire(user, /Partner bike shop loses signal/);
    await fire(user, /Move the clock on an hour/);
    // The request lapsed with the vendor offline: the switch back is still there.
    await user.click(screen.getByRole('button', { name: 'Open prototype controls' }));
    await user.click(screen.getByRole('tab', { name: 'Events' }));
    expect(screen.getByRole('button', { name: /Partner bike shop is back online/ })).toBeInTheDocument();
  });

  it('books through a hotel system that is down: the engine queues the charge instead of blocking', async () => {
    const user = userEvent.setup();
    render(<GuestAppPrototype initialScreen="stay-overview" initialSession={live} />);
    await user.click(screen.getByRole('button', { name: 'Open prototype controls' }));
    await user.click(screen.getByRole('tab', { name: 'Conditions' }));
    await user.click(screen.getByRole('button', { name: /Hotel system down/ }));
    await user.click(screen.getByRole('button', { name: 'Close prototype controls' }));

    await openCategory(user, 'Spa & Wellness');
    await user.click(screen.getByRole('button', { name: /Calamansi brightening facial/ }));
    await user.click(within(screen.getByTestId('service-page')).getByRole('button', { name: 'Choose a time' }));
    await user.click(screen.getByRole('button', { name: /Confirm and charge/ }));
    expect(screen.getByRole('heading', { name: 'Calamansi brightening facial is booked' })).toBeInTheDocument();
  });

  it('tells the presenter when the engine refuses what they asked of it', async () => {
    const user = userEvent.setup();
    render(<GuestAppPrototype initialScreen="stay-overview" initialSession={live} />);
    await bookRental(user, 'room');
    await fire(user, /Vendor confirms Scooter · 125cc/);
    // No signal and nothing saved on the shop's phone: the scan is refused, and the presenter is told why.
    await fire(user, /Partner bike shop loses signal/);
    await fire(user, /Vendor scans Scooter · 125cc/);
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
    expect(screen.getByRole('button', { name: 'Fill Chat with sample bookings and messages' })).toBeEnabled();
  });

  it('fills Messages and the front desk chat with a stay already lived in, then clears it', async () => {
    const user = userEvent.setup();
    render(<GuestAppPrototype initialScreen="stay-overview" initialSession={live} />);
    await fire(user, /Fill Chat with sample bookings and messages/);
    await openMessages(user);

    expect(screen.getByRole('button', { name: /Bike rental/ })).toBeInTheDocument();
    // The hotel's own outlets (the Poolside Bar, the trainer) talk in the front desk chat, not rows of their own.
    for (const title of [/Poolside Bar/, /Personal training/]) {
      expect(screen.queryByRole('button', { name: title })).toBeNull();
    }
    // Partners on the resort have chats of their own: the restaurant and the pasalubong café.
    expect(screen.getByRole('button', { name: /Si Señor/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sans rival cake/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Bike rental.*Confirmed.*unread/ })).toBeInTheDocument();
    // The lapsed scooter and the boat trip still waiting never got a chat.
    expect(screen.queryByRole('button', { name: /Scooter/ })).toBeNull();
    expect(screen.queryByRole('button', { name: /Apo Island boat trip/ })).toBeNull();

    // The front desk chat holds its half of the story, with the desk-made booking as a card.
    await user.click(screen.getByRole('button', { name: /^Front desk/ }));
    expect(screen.getByText(/This is Marites at the front desk/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Personal training session, Confirmed/)).toBeInTheDocument();
    expect(screen.getByLabelText(/The Poolside Bar & Lounge, Confirmed/)).toBeInTheDocument();
    expect(screen.getByText(/We hold the table for/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Go back' }));

    // And every trigger now has something to act on.
    await user.click(screen.getByRole('button', { name: 'Open prototype controls' }));
    await user.click(screen.getByRole('tab', { name: 'Events' }));
    expect(screen.getByRole('button', { name: /Vendor confirms Apo Island boat trip/ })).toBeEnabled();
    await user.click(screen.getByRole('button', { name: 'Clear the sample bookings and chats' }));
    await user.click(screen.getByRole('button', { name: 'Close prototype controls' }));
    await openMessages(user);
    expect(screen.queryByRole('button', { name: /Bike rental/ })).toBeNull();
    expect(nav().getByRole('button', { name: /^Chat/ })).toBeInTheDocument();
  });
});

