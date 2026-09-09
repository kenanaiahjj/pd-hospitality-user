# Dining venue carts design

**Date:** September 9, 2026  
**Status:** Approved for implementation

## Goal

Let a checked-in guest build a separate food-and-drink cart for each
establishment, choose room delivery or scheduled pickup, and post the confirmed
order to the room folio for settlement at checkout.

## Guest flow

Each restaurant menu keeps its own cart. Selecting **Add** adds one unit of a
menu item. Added items expose quantity controls. A sticky mini-cart bar shows
the active establishment, total item count, and running total. Carts remain
intact when the guest switches establishments.

Opening the mini cart shows the selected items, quantity controls, subtotal,
fulfillment method, timing, and final total. The guest can choose:

- **Deliver to room**, either as soon as possible or at an available time.
- **Pick up**, at an available time.

Room delivery is unavailable until the booking has an assigned room. The cart
cannot be submitted while empty.

Selecting **Place order and charge to room** creates one confirmed dining order
for that establishment. The order records its item breakdown, fulfillment
method, scheduled time, and total. The confirmed cart is then cleared without
changing carts for other establishments.

## Folio behavior

Each confirmed dining order appears as one grouped line in **Room charges**.
The line shows the establishment, fulfillment summary, and order total. The
item breakdown remains available in the order record. Dining orders settle
with the hotel folio at checkout; the guest does not pay during ordering.

The current folio total increases only after order confirmation. Adding,
removing, or changing items in a mini cart does not affect the folio.

## State and boundaries

The guest-app state owns a cart map keyed by establishment ID. Each cart stores
menu item IDs and quantities. The existing guest session stores confirmed
dining orders so the folio can render them with other room charges.

The restaurant menu owns item browsing and quantity changes. A dedicated cart
screen owns fulfillment, scheduling, review, and submission. The folio remains
the read-only settlement view.

## Connection and recovery

Guests can browse menus and edit carts while offline. Submitting an order
requires a connection because timing and availability must be confirmed. If
submission is unavailable, the app keeps the cart and shows a retry message.

## Accessibility and responsive behavior

- Use semantic buttons for all quantity and fulfillment controls.
- Give each quantity control an item-specific accessible name.
- Keep the mini-cart action and order action at least 44 CSS pixels high.
- Do not rely on color alone for the selected fulfillment method.
- Keep the order action above the mobile safe-area inset.
- Announce the cart count and total in visible text.

## Verification

Automated tests must confirm that:

- adding several items creates one venue-specific cart;
- changing quantities updates the cart count and total;
- switching establishments preserves separate carts;
- delivery supports immediate and scheduled timing;
- pickup requires an available scheduled time;
- confirming an order clears only that venue cart;
- confirmation adds one grouped dining order and updates the folio total;
- offline submission is blocked without losing the cart;
- room delivery is unavailable without an assigned room.

Browser verification must cover adding multiple items, editing the mini cart,
placing a room-delivery order, and finding the grouped order in Room charges.

## Out of scope

- Online card payment during ordering
- Combining items from different establishments into one order
- Kitchen acceptance, live preparation tracking, or order cancellation
- Editing a confirmed order
- Changing checkout settlement behavior
