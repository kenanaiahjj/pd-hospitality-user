# Hotel booking pre-arrival add-ons

| | |
|---|---|
| **Status** | `Approved for planning` |
| **Created** | 2026-09-30 |
| **Updated** | 2026-09-30 |
| **Supersedes** | `n/a` |

## Summary

Let a guest add pre-arrival services while booking a hotel stay. Add an optional
step after room assignment and before guest details and payment. The guest can
skip the step or configure arrival services for the new stay. Selected paid
services appear as itemized lines in the hotel payment and are charged in the
same gateway transaction as the rooms.

The bundled-payment rule applies only to services selected in this direct hotel
booking flow. Services selected later from the existing pre-arrival cart keep
their current settlement rules.

## Scope

The add-on roster reuses the current pre-arrival offers:

- Airport transfer
- Private car and driver
- Luggage storage and delivery
- Flowers and celebration setup
- Early check-in

Prices and service details come from the current mock catalog. Complimentary
offers add no charge. A variable or starting price must resolve to a specific
amount before the guest continues to payment. Existing room vouchers and room
taxes apply only to room charges.

The flow remains a self-contained prototype. It does not add real hotel
inventory, vendor confirmation, payment gateway, or middleware integrations.
It does not expose dining, spa, tours, or other on-property services before the
guest's room scan. It does not change existing pre-arrival cart behavior.

## Success criteria

- After assigning guests to rooms, the guest can open an optional Arrival
  add-ons step or skip directly to guest details.
- The step shows the five pre-arrival offers and allows the guest to select,
  configure, review, and remove each offer.
- Airport transfer defaults to the selected hotel's airport, the stay's
  check-in date, and the searched party size. The guest can set the pickup time,
  change the passenger count, and enter an optional flight number.
- The payment screen lists rooms and selected add-ons separately. It shows one
  total and takes one payment for all paid lines.
- A successful payment creates the stay reservation and its selected service
  bookings together. The confirmation and My Stay show the booked extras and
  the complete amount paid.
- A skipped add-ons step preserves the existing hotel-booking behavior.
- Leaving or failing payment creates no reservation or service booking and
  keeps the booking draft and selected add-ons available when the guest returns.
- Existing arrival-cart service booking and settlement behavior remains
  unchanged.

## Approaches considered

### Recommended: a dedicated optional step

Add `book-stay-addons` between guest assignment and guest details. This gives
service-specific fields, especially the airport pickup form, enough space and
keeps the existing guest-details form focused.

### Inline section in guest details

This avoids another screen, but lengthens an already detailed form and makes
multiple service configurations harder to scan.

### Offer services after hotel payment

This reuses the existing pre-arrival cart with little change, but does not let
the guest add services to the hotel total before payment.

## Design

### Flow

```text
Hotel page → room selection → assign guests → Arrival add-ons (optional)
  → guest details → payment → confirmed stay with selected services
```

The Arrival add-ons screen presents the current roster as selectable offers.
Selecting an offer reveals only the fields needed for that service. The airport
transfer pre-fills the airport from the hotel's city, the check-in date, and the
number of guests. The guest can change the pickup time and passenger count and
add a flight number. Other offers reuse their existing service-specific fields
and mock prices. The guest can remove an offer or continue without any extras.

The payment screen shows the existing room quote, followed by an itemized line
for each selected add-on. Room promo codes and room taxes continue to affect
only the room quote. Add-ons use their displayed service prices. Complimentary
services have a zero-value line and are still linked to the new stay when
payment succeeds.

One gateway payment covers the room amount and every selected paid add-on. This
is a specific exception for direct hotel-booking add-ons: even when a service
normally follows hotel-room or vendor settlement rules elsewhere, selecting it
here puts it in the hotel booking payment. A later booking from the pre-arrival
cart still follows its existing settlement rule.

### Data and payment

`GuestAppPrototype` owns the selected add-ons in the hotel booking draft, so
Back navigation and payment retries retain them. The draft stores configuration
only; it does not create `ServiceBooking` records before payment.

After successful payment, the app creates the hotel reservation and converts
the selected configurations into service bookings tied to the new booking ID.
The stay payment record contains the room line and the service lines, with
service booking IDs on add-on lines so existing line refunds can identify them.
The reservation records its add-on total separately from the room total. This
keeps per-room refunds limited to room charges while a full stay cancellation
can refund the complete transaction.

The add-ons remain on the reservation if the guest cancels only some rooms.
If the guest cancels the full reservation within its eligible cancellation
window, the payment is refunded in full and its attached service bookings are
removed. A service canceled on its own uses its existing service cancellation
cutoff and refunds that payment line to the original method. If the hotel does
not approve an early check-in request, the app refunds its bundled line to the
original method.

### Failure handling

- If the guest skips the step, continue with the existing room-only quote.
- If a required service field is missing, keep the guest on the add-ons step
  and focus the first invalid field.
- If the guest leaves payment or it fails, keep the draft and selections, and
  create no booking records.
- Create the hotel reservation, service bookings, and payment record only after
  the successful-payment callback.

### Architecture

- `stay-booking/model.ts` owns draft add-on types, normalized amounts, and the
  add-on portion of the reservation/payment calculation.
- A new presentational `stay-booking/add-ons.tsx` screen renders the roster and
  service-specific configuration.
- `prototype-model.ts` remains the home of the pre-arrival roster and shared
  service-booking contracts. It remains pure.
- `guest-app-prototype.tsx` routes the new screen and converts the draft into
  stay-linked service bookings only after payment succeeds.
- `stay-booking/checkout.tsx` displays the combined amount and itemized service
  lines while keeping room promo, tax, and cancellation calculations separate.
- `stay-booking/confirmation.tsx` displays the total paid and the added
  services.

No new dependency or network boundary is needed. The existing screen history,
payment method options, service catalog, and guest-session state are reused.

### Validation

The repository currently has Vitest scripts but no tracked E2E runner. Verify
the implementation with typecheck, lint, build, and a manual browser walkthrough
from hotel search through payment and cancellation. Keep a repeatable screenshot
or recording of the walkthrough. Cover skipping add-ons, adding an airport
transfer, combining offers, a failed or canceled payment, linked service
bookings, room-only partial refunds, full-stay refunds, individual service
refunds, and early-check-in rejection. Do not add unit tests after writing the
implementation.

## Decision log

| Date | Decision | Reason |
|---|---|---|
| 2026-09-30 | Offer extras in a dedicated optional step before payment | It preserves a focused guest-details screen and supports service-specific configuration. |
| 2026-09-30 | Charge selected add-ons in the hotel payment | The guest requested one hotel total and one payment. The new rule is limited to add-ons selected during direct hotel booking. |
| 2026-09-30 | Keep add-on totals separate from room totals | Partial room cancellation must refund the canceled room share without refunding extras that remain on the stay. |
