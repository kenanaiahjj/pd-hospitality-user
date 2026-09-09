# Expedia reference review

Date: 2026-09-09

Source: https://mobbin.com/apps/expedia-ios-d74936eb-9c7c-47e3-b9dc-e4905935bf46/ad35c0d0-588e-405a-ab54-6c001117b4ed/screens

## Audit scope

This is a screenshot-based reference review of Expedia's Mobbin catalog. The catalog contains 321 iOS screens and 60 named flows. The review focuses on hotel discovery and booking, activity booking, trip organization, booking detail, support, and account entry for Hospitality.

## Overall verdict

Expedia is a strong reference for modular search, list/map exploration, save and compare states, rich hotel detail, trip-level organization, and post-booking support. Hospitality should reuse that structure while removing Expedia's payment step from on-property services. Every approved service should be confirmed against the active room and guest, posted to the room folio, and settled at departure.

## Numbered review steps

1. Flow catalog — Good. Expedia groups 60 flows under Home, Search, Trips, Inbox, Account, and login, which makes the product's information architecture easy to scan. Evidence: `01-flow-catalog.png`.
2. Stay search — Good. Destination suggestions, date and flexible-date selection, traveler count, results, and map exploration form a clear search handoff. Evidence: `03-searching-for-a-stay.png`.
3. Hotel filtering — Good with caveat. Sort, property-name search, popular filters, price, and a single Done action are easy to understand; the filter surface is information-dense on a small screen. Evidence: `02-hotel-search-filtering.png`.
4. Save and compare — Good. A result can move into selection mode, expose Save and Compare actions, and confirm the saved destination with an inline toast. Evidence: `16-saving-hotel-to-trip.png`.
5. Hotel detail — Good. Photos, rating, amenities, area map, nearby alternatives, reviews, and the room-selection CTA support confident choice. Evidence: `17-hotel-detail.png`.
6. Hotel booking — Reference-only payment model. The flow exposes Pay total now versus Pay when you stay, then price details, guest information, payment, optional protection, important information, and booking confirmation. Evidence: `04-book-a-hotel.png`, `05-book-a-hotel-later-states.png`, and `06-book-a-hotel-final-states.png`.
7. Activity booking — Good structure, reference-only payment model. The flow moves from activity details to included and excluded information, date/time, travelers, price summary, confirmation email, and itinerary access. Evidence: `12-booking-an-activity.png`, `13-booking-an-activity-later.png`, and `14-booking-an-activity-final.png`.
8. Trips and collaboration — Good. Users can name a trip, save it, share it through the native share sheet, view a destination map, keep saved items, and open booking details. Evidence: `10-creating-a-trip.png`, `11-inviting-friends.png`, `09-trip-overview.png`, and `07-booking-detail.png`.
9. Booking detail and support — Good. Booking detail brings together location, reservation information, benefits, pricing or rewards, special requests, support, chat, and a printable itinerary. Evidence: `08-booking-detail-loaded.png`.
10. Login — Good with verification gap. Google, email, secure code, and password paths are shown, but live validation and error recovery are not testable from the catalog. Evidence: `15-logging-in.png`.

## Recommended Hospitality carry-over

- Keep one discovery surface and one stay-specific control center.
- Use destination or service search, filters, saved items, and detail pages as separate steps.
- Show the active room and guest context before confirming a service.
- Replace Pay or card forms with `Charge to room` and a clear folio-impact summary.
- Keep date, time, guest count, included details, cancellation rules, special requests, confirmation, and itinerary-style access.
- Bring booking detail, support, chat, and folio history together after confirmation.

## Evidence limits

The evidence is the Mobbin screenshot catalog and its flow-board previews, not the live Expedia app. Screenshot review cannot confirm keyboard behavior, native accessibility labels, touch-target size, responsive reflow, loading behavior, validation, or cancellation execution. The catalog also shows some confirmation sequences ending on a loading or confirming state.
