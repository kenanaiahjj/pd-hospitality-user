# Hotel Booking Implementation Plan

| | |
|---|---|
| **Status** | `Complete` |
| **Created** | 2026-09-29 |
| **Updated** | 2026-09-29 |
| **Owner** | Kenanaiah Jo |
| **Branch / worktree** | `main`: the user asked for work to be committed directly to main (see memory `commit-directly-to-main`) |
| **Spec** | `docs/superpowers/specs/2026-09-29-hotel-booking-design.md` |
| **Ledger** | `.superpowers/sdd/2026-09-29-hotel-booking/progress.md` |

**Goal:** an Agoda-style search → results → hotel → mixed-class cart → guest split → checkout → gateway flow inside the guest-app prototype.

**Architecture:** a pure `stay-booking/model.ts`, presentational screens in `stay-booking/`, and draft state plus routing glue in `GuestAppPrototype`.

**Tech Stack:** Next.js 16 · React 19 · TypeScript (strict) · Leaflet (already installed)

---

## Progress

| # | Task | Status | Commit |
|---|---|---|---|
| 1 | Model: inventory, pricing, availability, capacity, booking | ✅ Complete | see git log |
| 2 | Search card + full-page search | ✅ Complete | see git log |
| 3 | Results: list, sort, filters, map | ✅ Complete | see git log |
| 4 | Hotel page + rate steppers + sticky cart | ✅ Complete | see git log |
| 5 | Guest split | ✅ Complete | see git log |
| 6 | Checkout + gateway + confirmation → upcoming stay | ✅ Complete | see git log |
| 7 | Entry points: no-booking home, "Book another stay", partner routes | ✅ Complete | see git log |
| 8 | Cancellation from My Stay | ✅ Complete | see git log |
| 9 | Tests green + one flow test; browser verification | ✅ Complete | see git log |

## Global Constraints

Copied from the spec:

- Verification gate: `npm run typecheck && npm run lint && npm run build && npm test`
  passes with fresh output before completion is claimed.
- `react-hooks` compiler rules are errors: no ref writes during render, no
  `setState` in an effect body.
- The model stays pure. All prices are integers in pesos and are formatted with
  `₱` and `en-PH` grouping.
- No new dependencies. Leaflet is already installed.

## File Structure

```
src/components/features/guest-app/stay-booking/
  model.ts            pure: data + rules (spec § Rules)
  format.ts           peso / date labels shared by screens
  search-form.tsx     StaySearchCard, RangeCalendar, GuestsPanel
  results.tsx         StayResultsScreen, HotelResultCard, FeaturedHotels
  results-map.tsx     StayResultsMap (leaflet)
  hotel-page.tsx      StayHotelScreen
  assign-guests.tsx   StayAssignGuestsScreen
  checkout.tsx        StayCheckoutScreen
  confirmation.tsx    StayConfirmationScreen, ReservationCard
  stay-booking.css
  index.ts
```

Changed: `prototype-model.ts` (ScreenIds, `Booking.reservation`),
`guest-app-prototype.tsx` (draft state, routing, pay, cancel),
`stay-home.tsx` (search card, "Book another stay"), `nearby-map.tsx` (export
the tile helpers).

## Tasks

Each task is committed on its own once `npm run typecheck && npm run lint` pass.
Tasks 2–8 are checked in the browser at 390px width.

- [x] 1. Model: every function in spec § Interfaces, following spec § Rules exactly.
- [x] 2. Search: `StaySearchCard` (location suggestions, range calendar, guests + child ages) and the `book-stay` page.
- [x] 3. Results: `searchHotels`, sort chips, filter sheet, list/map toggle, empty state.
- [x] 4. Hotel page: room classes × rate plans, steppers capped by availability, sold-out handling, change dates, sticky cart with fit message.
- [x] 5. Guest split: `defaultAllocation` prefill, adult steppers, child → room selects, `validateAllocation` messages.
- [x] 6. Checkout: prefilled contact, per-room lead and bed preference, arrival time, requests, promo, quote breakdown, policy, gateway → `bookingFromDraft` → confirmation → Home shows the upcoming stay.
- [x] 7. Entry points: search card on `EmptyStayHome`, featured hotels with from-prices, "Book another stay" on the other homes, `partner-hotels` / `partner-hotel-detail` → hotel page.
- [x] 8. Cancel: a reservation card in My Stay with the policy, cancel confirmation, the booking removed, a refund notice on Home.
- [x] 9. Fix the tests the new home breaks (cheapest path), add one flow test, run the full gate, take browser screenshots.
