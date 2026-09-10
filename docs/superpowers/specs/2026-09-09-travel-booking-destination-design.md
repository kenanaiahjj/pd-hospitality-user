# Travel Booking Destination Design

| | |
|---|---|
| **Status** | `Implemented` |
| **Created** | 2026-09-09 |
| **Updated** | 2026-09-09 |
| **Owner** | <human partner> |
| **Plan** | direct increment — no separate plan file for this pass |
| **Supersedes** | `n/a` |
| **Superseded by** | `2026-09-10-nav-information-architecture-design.md` (tab-bar placement only) |

This spec is the binding authority during execution: when a plan and this
document disagree, this document wins.

> **Amended 2026-09-10.** Travel is no longer a tab-bar destination. The nav
> pass in
> [`2026-09-10-nav-information-architecture-design.md`](2026-09-10-nav-information-architecture-design.md)
> cut the bar to four destinations — Home, Explore, My Trip, Profile — and moved
> travel inventory into **Explore**, under its own `Onward travel` heading, with
> the booked legs surfacing in **My Trip** beside the on-property bookings.
> Everything else here still holds, and the separation this document argues for
> is preserved rather than abandoned: travel keeps its own screens, its own
> checkout, its own heading, and the copy that says it is paid to the operator
> rather than added to a room folio. What changed is that the separation is now
> carried by a section boundary instead of a tab. The reasoning below — source,
> timing and settlement — is why that heading exists at all.

---

## Summary

Cabana gains a fourth top-level destination, **Travel**, holding the bookings
that move a guest between places: flights, ferries, hotel-to-hotel transfers
and travel insurance. The existing **Bookings** destination keeps everything
the hotel itself provides during a stay. This is the first step of the
end-to-end travel platform: the app becomes the single entry point for a whole
trip, not a companion to one hotel stay.

## Why a separate destination

The four existing categories — Food & Drink, Spa & Wellness, Entertainment &
Tours, Hotel Services — are all **on-property**: sourced from the hotel through
the PMS middleware, consumed during one stay, and settled on that stay's folio.

Travel inventory is a different domain on every axis that matters:

- **Source.** Airlines, ferry operators and transport vendors, reached through
  the provider side of the marketplace, not through a hotel's PMS.
- **Timing.** Before, after, or between stays — not during one.
- **Settlement.** It cannot land on a room folio, because it is not the room's.

Folding these into the on-property grid would put "book a massage" and "book an
inter-island flight" on one screen as peers, and would collide with Hotel
Services, which already advertises airport transfers. A separate destination
also takes the tab bar to the four stable destinations `DESIGN.md` specifies;
it currently ships three. *(Superseded: `DESIGN.md`'s four destinations are now
Home, Explore, My Trip and Profile — see the amendment above.)*

## Scope of this pass

In:

- The **Travel** destination and its place in the tab bar.
- Four travel categories, each with a working landing screen: a route or leg
  where the category has one, dates, party size, and a list of real-looking
  inventory with prices.
- One parameterised search screen driving all four, configured per category,
  rather than four bespoke screens.

- Checkout and confirmation. Travel is paid **to the operator at booking**,
  never to the room folio: a flight is not the hotel's to bill, and a guest may
  book one before arrival or after checkout, when no folio is open. This is why
  travel has its own checkout instead of reusing the service flow's folio
  confirmation, whose copy reads "settles with your hotel folio at checkout".
- Travellers pre-filled from the ID Cabana already captured during pre-arrival.
  Philippine carriers match passenger names against government ID, so this is
  a confirmation step, not a data-entry one — and it is the step an OTA
  structurally cannot offer.
- Booked legs listed in **My bookings** under their own heading, not filtered
  to the current stay.

Out, deliberately:

- Cancellation. Carrier fare rules are per-fare — non-refundable against
  flexible — and nothing like the hotel's cutoff-hours model, so reusing
  `getCancellationState` would be wrong. Its own pass.
- Card capture. Checkout charges without a card-entry form; a stored payment
  method is a later concern.
- Live inventory. Options are fixtures; the middleware and channel-manager
  integration are separate work.
- The provider side. Guests only, this pass.

## Structure

`Travel` is a hub listing the four categories, each opening the shared search
screen. The categories:

| Category | Journey | Party | Inventory |
|---|---|---|---|
| Flights | airport → airport | passengers | carrier, times, fare |
| Ferries | port → port | passengers | operator, sailing, fare |
| Transfers | pickup → drop-off | passengers | vehicle class, capacity, fare |
| Travel insurance | none | travellers | plan tier, cover, premium |

Insurance has no route, which is why the route block is optional in the model
rather than assumed. The existing `arrival-handoff` screen is **not** reused.
It is a pre-arrival handoff into the hotel stay, not a travel-insurance purchase
screen.

## Design constraints

- The hub is a repeated list, so its rows take a bare glyph, not a tinted
  chip — the same rule the on-property list rows follow.
- Pink stays on the primary action and the current selection only.
- The folio's inverted surface is not used here: travel does not settle on the
  room folio, and only one inverted surface may appear per screen.
- Every control clears a 44px target.

## Verification

Automated tests must confirm that:

- the tab bar exposes four destinations, including Travel;
- the Travel hub lists all four categories;
- opening a category shows its search screen with that category's own route
  labels, party label and inventory;
- the insurance category shows no route block;
- Travel is a peer of Bookings, not nested inside it;
- checkout totals fare × travellers plus a per-traveller fee, and names the
  operator as the payee rather than the room;
- a booked leg reaches My bookings and states it was paid to the operator;
- an offline checkout refuses to hold the fare rather than queueing it, because
  the price moves while the guest is offline;
- the confirmation names the leg with a declared singular, so "Ferries" does
  not become "ferrie".

## Decision log

- **2026-09-09** — Separate destination chosen over two labelled groups inside
  Bookings, and over a flat category list. Different inventory source, timing
  and settlement; a flat list would also collide with Hotel Services' existing
  transfers copy.
- **2026-09-09** — One parameterised search screen rather than four bespoke
  ones. The four differ only in labels and inventory shape, which is data.
- **2026-09-09** — Travel checkout is its own flow after all. The service
  flow's confirmation and blocked screens are folio- and slot-specific in both
  copy and routing, so reuse would have meant rewriting them for two callers.
- **2026-09-09** — Offline is handled inline on the checkout rather than as a
  fifth screen: `getOfflineAction('payment')` already returns `blocked`, and a
  separate screen would duplicate `booking-blocked` without reusing it.
- **2026-09-09** — `additionalGuests` added to the session. The
  additional-guests step previously discarded its input, so checkout had no
  real companion name to show, and inventing one at checkout would misstate
  who is travelling.
