# Dining Venue Carts Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

| | |
|---|---|
| **Status** | `Complete` |
| **Updated** | 2026-09-09 |

**Goal:** Add independent restaurant carts with room delivery or scheduled pickup, then post each confirmed order as one grouped room-folio charge.

**Architecture:** Keep draft carts as guest-app UI state keyed by restaurant ID, because drafts must not affect the folio. Extend confirmed `ServiceBooking` records with optional dining-order metadata so confirmed orders remain in the existing session and folio pipeline. Add one `restaurant-cart` screen for quantity editing, fulfillment, scheduling, review, and submission.

**Tech Stack:** Next.js 16.3.4 App Router, React 19.2.8, TypeScript, CSS, Vitest, Testing Library

## Global constraints

- Keep a separate cart for every establishment.
- Do not change the folio until the guest confirms an order.
- Support immediate or scheduled room delivery and scheduled pickup.
- Require an assigned room for delivery.
- Require a network connection to submit, but preserve draft carts offline.
- Clear only the confirmed venue cart.
- Keep payment deferred to hotel checkout.
- Preserve unrelated working-tree changes.

---

### Task 1: Define dining order data and cart calculations

**Files:**
- Modify: `src/components/features/guest-app/prototype-model.ts`
- Modify: `src/components/features/guest-app/prototype-model.test.ts`

**Interfaces:**
- Produces: `DiningOrderItem`, `DiningFulfillment`, `DiningOrderDetails`, `parsePesoAmount()`, `formatPesoAmount()`, and `getVenueCartSummary()`.
- Extends: `ServiceBooking.diningOrder?: DiningOrderDetails`.

- [x] **Step 1: Write failing calculation tests**

Test that two `Crispy Calamari` units and one `Grilled Angus Ribeye` produce three items and `₱2,810`, and that peso parsing handles commas.

- [x] **Step 2: Run the focused model test**

Run `npm test -- src/components/features/guest-app/prototype-model.test.ts` and confirm the new exports are missing.

- [x] **Step 3: Add the data types and pure helpers**

Use these shapes:

```ts
export type DiningOrderItem = {
  id: string;
  name: string;
  unitPrice: string;
  quantity: number;
};

export type DiningFulfillment =
  | { method: 'delivery'; timing: 'asap' | 'scheduled'; scheduledFor: string }
  | { method: 'pickup'; timing: 'scheduled'; scheduledFor: string };

export type DiningOrderDetails = {
  venueId: string;
  venueName: string;
  items: DiningOrderItem[];
  fulfillment: DiningFulfillment;
};
```

`getVenueCartSummary(menu, quantities)` must discard zero quantities and return `{ items, itemCount, total, formattedTotal }`.

- [x] **Step 4: Re-run the model test**

Run `npm test -- src/components/features/guest-app/prototype-model.test.ts` and confirm it passes.

### Task 2: Replace immediate ordering with venue mini carts

**Files:**
- Modify: `src/components/features/guest-app/guest-app-prototype.tsx`
- Modify: `src/components/features/guest-app/guest-app-prototype.css`
- Modify: `src/components/features/guest-app/guest-app-prototype.test.tsx`

**Interfaces:**
- Consumes: `getVenueCartSummary()` and the existing `RESTAURANTS` menu data.
- Produces: `restaurantCarts: Record<string, Record<string, number>>`, menu quantity controls, the sticky `.guest-mini-cart`, and the `restaurant-cart` screen.

- [x] **Step 1: Write failing venue-cart interaction tests**

Specify that adding two different items changes the active mini cart to `2 items`, quantity changes update the total, and switching venues preserves independent carts.

- [x] **Step 2: Run the component test and confirm failure**

Run `npm test -- src/components/features/guest-app/guest-app-prototype.test.tsx -t 'venue cart'` and confirm the mini-cart controls are absent.

- [x] **Step 3: Add the cart state and menu controls**

Replace `orderDishToRoom()` with `changeCartQuantity(venueId, itemId, delta)`. Render `Add <item name>` for zero quantity and item-specific decrease/increase buttons after addition. Render the mini-cart only when the active venue count is greater than zero.

- [x] **Step 4: Add the cart review screen**

Add `restaurant-cart` to `ScreenId` and navigation chrome. The screen must show item rows, quantity controls, `Deliver to room` and `Pick up` choices, `As soon as possible` and available scheduled-time choices, a total, and `Place order and charge to room`.

- [x] **Step 5: Style the cart surfaces**

Add `.guest-menu-quantity`, `.guest-mini-cart`, `.guest-order-cart`, `.guest-order-item`, `.guest-fulfillment-options`, and `.guest-order-submit` styles with 44-pixel targets and safe-area spacing.

- [x] **Step 6: Re-run focused component tests**

Run `npm test -- src/components/features/guest-app/guest-app-prototype.test.tsx -t 'venue cart'` and confirm they pass.

### Task 3: Confirm orders and render grouped folio charges

**Files:**
- Modify: `src/components/features/guest-app/guest-app-prototype.tsx`
- Modify: `src/components/features/guest-app/guest-app-prototype.test.tsx`

**Interfaces:**
- Consumes: the active venue cart, selected fulfillment state, and `ServiceBooking.diningOrder`.
- Produces: one confirmed service booking per dining order and one grouped folio row.

- [x] **Step 1: Write failing confirmation tests**

Specify delivery-as-soon-as-possible, scheduled pickup, grouped folio rendering, total updates, clearing only the confirmed venue, blocking delivery without a room, and preserving an offline cart.

- [x] **Step 2: Run the focused tests and confirm failure**

Run `npm test -- src/components/features/guest-app/guest-app-prototype.test.tsx -t 'dining order'` and confirm submission behavior is missing.

- [x] **Step 3: Implement order confirmation**

Validate connection, active booking, room assignment for delivery, non-empty cart, and selected timing. Create one `ServiceBooking` whose title is the venue name, amount is the formatted cart total, `scheduledFor` describes fulfillment, and `diningOrder` contains the item breakdown. Increase `session.folioTotal`, clear only the active venue cart, and navigate to the confirmation screen.

- [x] **Step 4: Render grouped dining orders in the folio**

For a service with `diningOrder`, render the venue as the title and `${itemCount} items · ${scheduledFor} · settles at checkout` as metadata. Keep existing service bookings unchanged.

- [x] **Step 5: Run full verification**

Run:

```bash
npm test
npm run typecheck
npm run lint
npm run build
git diff --check -- src/components/features/guest-app/prototype-model.ts src/components/features/guest-app/prototype-model.test.ts src/components/features/guest-app/guest-app-prototype.tsx src/components/features/guest-app/guest-app-prototype.css src/components/features/guest-app/guest-app-prototype.test.tsx
```

Expected: every command exits successfully.

- [x] **Step 6: Verify the mobile browser flow**

Open an active stay, choose **Food & Drink**, add multiple Apartment 1B items, edit the mini cart, place a room-delivery order, and confirm the grouped charge appears in **Room charges**.
