# Hotel Booking Design

| | |
|---|---|
| **Status** | `Implemented` |
| **Created** | 2026-09-29 |
| **Updated** | 2026-09-29 |
| **Owner** | Kenanaiah Jo |
| **Plan** | `docs/superpowers/plans/2026-09-29-hotel-booking.md` |
| **Supersedes** | The "Cabana does not take hotel bookings" rule in `partner-hotels.tsx` |
| **Superseded by** | `n/a` |

---

## Summary

Stakeholders want an Agoda-style booking system in the guest app. A signed-in
guest searches by location, dates, adults and children (with ages), compares
partner hotels, and books **several rooms of different classes in one
booking**, which Agoda and Booking.com don't allow. Payment goes through the
existing gateway checkout. The confirmed booking becomes the guest's upcoming
stay.

## Context

- Before this change the signed-in no-booking home (`EmptyStayHome` in
  `stay-home.tsx`) offered "Add a booking" and a list of the three Henry partner
  hotels. Commit `005084c` put that list there.
- `partner-hotels.tsx` sent guests off-app to Agoda, Booking.com and the hotel
  sites. The old in-app route IDs (`book-stay`, `book-stay-dates`,
  `book-stay-rooms`, `book-stay-checkout`, `book-stay-confirmation`) survived
  only as aliases for that directory.
- `gateway-checkout.tsx` already provides a prototype pay-now sheet (Card /
  GCash / Maya).
- The zero-customer-acquisition-cost strategy still controls how people first
  find the app (confirmation email, room QR code, Wi-Fi portal). In-app search
  is now in scope; public marketing surfaces are still not.

## Non-goals

- No real inventory, property-system or gateway calls. Hotels, rooms, rates and
  availability are deterministic mock data in a pure model file.
- No backend-for-frontend layer, route handlers or query factories. This stays
  inside the guest-app prototype, as every other flow does.
- No in-app modification of dates or rooms after booking. Changes go through the
  front desk chat. Cancellation only.
- No booking for signed-out visitors. The flow sits behind sign-in, like the
  rest of the home.
- No loyalty points redemption against room bookings.

## Success criteria

- [ ] The signed-in no-booking home shows a search card: location, dates,
      guests. It also keeps "Add a booking" and a featured hotels list showing
      "from ₱X / night".
- [ ] Upcoming, in-stay and after-checkout homes each offer "Book another stay",
      which opens the same search.
- [ ] Results can be sorted (recommended, lowest price, highest rating,
      distance), filtered (price band, stars, amenities, free cancellation) and
      switched to a map view.
- [ ] On a hotel page the guest can add 2× Deluxe King (room only) plus
      1× Family Room (with breakfast) to one cart.
- [ ] The guest-split step places every adult and child in a room. It blocks
      continuing while any room breaks its capacity rules or the totals don't
      match the search.
- [ ] Checkout prefills contact details from the profile. It takes a lead guest
      name per room, special requests, arrival time and a promo code.
      "Pay ₱X" opens the gateway checkout.
- [ ] After payment the confirmation shows a reference, and Home becomes the
      upcoming-stay home for the new booking.
- [ ] A refundable booking can be cancelled from My Stay before its deadline,
      which removes it and reports the refund. A non-refundable booking points
      to the front desk chat.
- [ ] `npm run typecheck && npm run lint && npm run build && npm test` pass.

---

## Approaches considered

### Recommended: a `stay-booking/` module plugged into the existing screen router

The pieces:
- A pure model (`stay-booking/model.ts`) for inventory, pricing, availability,
  capacity and the booking it produces.
- Presentational screens in `stay-booking/*.tsx`.
- One draft state object owned by `GuestAppPrototype`.
- Steps are ordinary `ScreenId`s, so Back, the app bar, tabs and history work
  the way they do everywhere else.

**Why:** it matches how dining, services and rewards are built, and keeps the
4.5k-line shell from growing much beyond routing glue.
**Costs:** the draft lives in the shell's state. It isn't persisted, so a reload
mid-booking starts over.

### Alternative: one self-contained `<HotelBookingFlow>` with internal step state

**Rejected because:** it would need its own back handling and app bar, fighting
the shell's history. It also couldn't reuse the shell's Back button.

---

## Design

### Architecture

`GuestAppPrototype` owns `stayDraft: StayBookingDraft` and passes slices to each
screen. Screens call back with new values. The model is pure (no React, no
browser APIs) like `prototype-model.ts`.

Screen IDs, reusing the old aliases and adding what's missing:

| ScreenId | Screen |
|---|---|
| `book-stay` | Full-page search form, used from "Book another stay" |
| `book-stay-results` | Results list or map, sort and filters |
| `book-stay-hotel` | Hotel page: gallery, about, contact, room classes, rate steppers, sticky cart |
| `book-stay-rooms` | Split guests across the rooms in the cart |
| `book-stay-checkout` | Guest details, requests, promo, price summary, pay |
| `book-stay-confirmation` | Reference and summary, "Go to your stay" |

`book-stay-dates` stays as an alias of `book-stay`. `partner-hotels` and
`partner-hotel-detail` now render the hotel page for the chosen hotel, so every
existing entry point lands in the in-app booking flow. The tab bar shows Home
active across the flow.

### Components

**`src/components/features/guest-app/stay-booking/model.ts`**
- **Does:** mock inventory (11 hotels: the three Henry properties plus eight
  invented partners in Boracay, El Nido, Siargao, Baguio, Bohol, Tagaytay, Makati
  and Mactan), rates, availability, capacity rules, pricing, search, and the
  `Booking` a paid draft becomes.
- **Used as:** see Interfaces.
- **Depends on:** `Booking` and `PROTOTYPE_TODAY` from `prototype-model.ts`.

**`stay-booking/search-form.tsx`** — `StaySearchCard`: the location field with
suggestions, a range calendar, and a guests panel (adults, children, a select
for each child's age).

**`stay-booking/results.tsx`** — `StayResultsScreen`: the search summary bar,
sort chips, a filter sheet, and a list/map toggle.

**`stay-booking/results-map.tsx`** — `StayResultsMap`: a Leaflet map of the
Philippines with a price pin per hotel. Selecting a pin shows a card that opens
the hotel. It reuses the tile and credit helpers exported from `nearby-map.tsx`.

**`stay-booking/hotel-page.tsx`** — `StayHotelScreen`: the hotel hero, facts,
amenities, contact, room classes and rate plans with +/- steppers, "Only N left",
"Sold out for these dates", a change-dates panel whose calendar greys out
sold-out nights, and the sticky cart bar.

**`stay-booking/assign-guests.tsx`** — `StayAssignGuestsScreen`: one card per
cart room with adult steppers and a room select for each child, with per-room
validation messages.

**`stay-booking/checkout.tsx`** — `StayCheckoutScreen`: contact details, a lead
guest per room, bed preference per room, arrival time, requests, promo code,
the price breakdown and the cancellation policy.

**`stay-booking/confirmation.tsx`** — `StayConfirmationScreen`.

**`stay-booking/stay-booking.css`** — styles, using the guest app's existing
tokens.

### Rules (binding)

- **Party:** adults 1–12, children 0–8 with ages 0–17. Children aged 12 and
  over count as adults for room limits.
- **Room capacity:** each room class has `maxAdults` and `sleeps` (people aged
  6+). Children 0–5 don't count toward `sleeps`, and a room takes at most 2 of
  them. Every room needs at least one person aged 12 or over.
- **Cart:** any mix of room classes and rate plans. You can't add more of a room
  class than are available. The sticky bar says whether the cart fits the party.
  Continue is enabled when the cart has no more rooms than lead-capable guests
  and total capacity covers the party.
- **Rate plans per class:** `flex` (room only, free cancellation),
  `flex-breakfast` (breakfast for as many as the room sleeps, free cancellation,
  a flat +₱600 × `sleeps` per room per night) and `saver` (room only, non-refundable, 15% off).
  A hotel may omit `saver`.
- **Nightly price:** base × 1.15 on Friday and Saturday nights, rounded to ₱10.
  The "from ₱X / night" figure is the cheapest open rate on the search dates;
  without dates, the next 3 nights from the default search.
- **Availability:** deterministic per (hotel, room class, night): 0–6 rooms. A
  stay's availability is the lowest across its nights. Show "Only N left" when
  N ≤ 3. A hotel's calendar greys out a night when every class is at 0.
- **Taxes and fees:** 12% VAT and 10% service charge on the room subtotal after
  the promo discount, shown as one "Taxes and fees" line with a breakdown.
- **Promo codes:** `CABANA10` = 10% off the room subtotal. `WELCOME500` = ₱500
  off. Anything else shows "That code isn't valid."
- **Cancellation:** a booking is refundable only if every room is on a flexible
  rate. Free cancellation runs until 23:59 three days before check-in.
  Otherwise it's non-refundable.
- **Default search:** location "Anywhere in the Philippines", check-in
  `2026-12-11`, check-out `2026-12-14`, 2 adults, 0 children. Dates must be
  after `PROTOTYPE_TODAY`, at most 30 nights.

### Data flow

```
EmptyStayHome ─ StaySearchCard.onSearch(search) ─► shell: stayDraft.search = search; go('book-stay-results')
StayResultsScreen ─ searchHotels(search, filters, sort) ─► onOpenHotel(id) ─► go('book-stay-hotel')
StayHotelScreen ─ roomOffers(hotel, search) ─► cart steppers ─► onContinue ─► go('book-stay-rooms')
StayAssignGuestsScreen ─ validateAllocation ─► go('book-stay-checkout')
StayCheckoutScreen ─ quoteStay ─► GatewayCheckout.onPaid(method)
  ─► shell: session.bookings += bookingFromDraft(...); activeBookingId = id; goReplacing('book-stay-confirmation')
My Stay ─ cancelReservation ─► session.bookings -= id; home shows "Booking cancelled · ₱X refunded to <method>"
```

### Interfaces and contracts

```ts
export type StaySearch = { location: string; checkIn: string; checkOut: string; adults: number; childAges: number[] };
export type RatePlanId = 'flex' | 'flex-breakfast' | 'saver';
export type CartLine = { roomTypeId: string; ratePlanId: RatePlanId; quantity: number };
export type RoomAllocation = { adults: number; childIndexes: number[] };  // one per cart room, in cart order
export type StayGuestDetails = { name: string; email: string; phone: string; roomLeads: string[]; bedPreferences: string[]; arrivalTime: string; requests: string; promoCode: string };
export type StayBookingDraft = { search: StaySearch; hotelId?: string; cart: CartLine[]; allocation: RoomAllocation[]; details?: StayGuestDetails };

export type Reservation = {
  reference: string; hotelId: string;
  rooms: { roomTypeId: string; roomName: string; ratePlanId: RatePlanId; leadGuest: string; adults: number; children: number }[];
  total: number; paidWith: string; paidAt: string;
  refundable: boolean; freeCancellationUntil?: string;
};
// Booking gains an optional `reservation?: Reservation`.

searchHotels(search, filters: StayFilters, sort: StaySort): HotelResult[]
roomOffers(hotel, search): RoomOffer[]
quoteStay(hotel, search, cart, promoCode?): StayQuote
cartFit(hotel, search, cart): { rooms: number; fits: boolean; message: string }
defaultAllocation(hotel, search, cart): RoomAllocation[]
validateAllocation(hotel, search, cart, allocation): { ok: boolean; roomErrors: (string | null)[]; summary?: string }
bookingFromDraft(draft, quote, details, method): Booking
canCancelReservation(booking, today = PROTOTYPE_TODAY): boolean
```

### Error handling

This is a prototype, so failures are UI states rather than HTTP errors.

| Failure | Surfaced as |
|---|---|
| No results for location and filters | Empty panel with "Clear filters" and "Search anywhere" |
| Room class sold out for the dates | The row stays visible, marked "Sold out for these dates", with no stepper |
| Cart doesn't fit the party | Sticky bar message, Continue disabled |
| Invalid guest split | A message on each affected room and above the button, Continue disabled |
| Invalid promo | An inline message under the field |
| Offline | Search and results still work. Pay is disabled with the existing offline notice. |

### Testing

Tests are low priority for this prototype. The existing suite must stay green,
and one integration test covers the main path: search, a mixed-class cart,
splitting guests, paying, and landing on the upcoming home.

---

## Global Constraints

- Verification gate: `npm run typecheck && npm run lint && npm run build && npm test`
  passes with fresh output before completion is claimed.
- `react-hooks` compiler rules are errors: no ref writes during render, no
  `setState` in an effect body.
- The model stays pure. All prices are integers in pesos and are formatted with
  `₱` and `en-PH` grouping.
- No new dependencies. Leaflet is already installed.

## Open questions

None.

## Decision Log

| Date | Decision | Why | Cost if wrong |
|---|---|---|---|
| 2026-09-29 | Room bookings are paid now through the gateway | Stakeholder choice. There's no folio before the stay | Reintroduce a pay-at-hotel rate type |
| 2026-09-29 | Guests are split per room after picking rooms | Needed so different room classes can be mixed | Move the rooms count into the search |
| 2026-09-29 | Draft isn't persisted | Keeps the session storage shape the same | A reload mid-booking starts over |
| 2026-09-29 | Cancel only, no in-app modify | Scope | Add a modify flow later |
| 2026-09-29 | Breakfast is a flat ₱600 × `sleeps` per room per night, not per person | A per-person price can't be shown before guests are split across rooms | Price it after the split instead |
| 2026-09-29 | `partner-hotels.tsx` and its off-site booking links are removed; `partner-hotels` is now the in-app directory | Superseded by in-app booking | Restore from git history |
