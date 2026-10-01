# Cabana — App Overview for Vendor & Partner Management Design

**Audience:** a designer taking on the vendor / partner management side of Cabana.
**Written:** 2026-09-29, from the code and specs in this repo.
**Status of the app:** an interactive **guest-side prototype**. Everything behind it (hotels' PMS, vendors, payments, staff tools) is mocked. There is **no provider-side surface at all yet** — that is what you are designing.

How to read this doc:

- **Stated rule** = a decision written in a spec, code comment or copy. Treat as a constraint.
- **Mock** = a fixture the prototype invented to look real. Treat as a hint, not a requirement.
- **Gap** = something the guest app implies but nothing defines yet. These are your design opportunities and your questions for the team (collected in section 10).

---

## 1. What Cabana is

Cabana is a two-sided marketplace for Philippine hospitality and travel.

- **Side one — guests.** The mobile app that exists today.
- **Side two — providers.** Hotels, travel agents, tour operators and vendors (spa, rentals, guides, shops, transport). **Not built. This is your brief.**

**The problem it targets.** Philippine travel booking is fragmented across OTAs (Agoda, Booking.com) with no connected experience. Cabana aims to be one place for hotel, transport, activities, transfers and insurance across the archipelago. Today's build covers hotel stays and on-property services. Flights, ferries and hotel-to-hotel transfers are expected later, so the vendor model should not assume "vendor = spa".

**Launch customer.** The Henry Hotels & Resorts — 13 properties, the newest opened in the week of 2026-09-01, the furthest north in Mindanao. The prototype shows three of them (Manila, Cebu, Dumaguete) plus eight invented partner hotels.

**Distribution.** Zero-CAC: guests find the app at the point of booking (confirmation email, room QR code, hotel Wi-Fi portal). There is no public marketing, SEO or ad surface. Signed-in guests with no booking can also search and book partner hotels in-app.

**Prototype status.** Working flows matter more than production hardening, and tests are low priority. The visuals are real; the data is not.

---

## 2. Who is involved

| Actor | Role | Built? |
|---|---|---|
| **Guest** | Books stays and services, orders, pays, chats with the desk | Yes (prototype) |
| **Front desk staff** | The hub. Checks guests in and out, grants room access, approves requests, posts orders to the bill, settles the folio | No — simulated by timers and a marked "Front desk view" button in chat |
| **Hotel / property** | Owns rooms, rates, inventory, the PMS, its own restaurants and services | No |
| **Vendor / partner** | Third parties operating on or near a property (spa, tours, rentals, guides, shops, care) | No — this is your brief |
| **Cabana operator** | Runs the marketplace, curates content, sets up vendors | No (one code comment mentions a future "admin dashboard") |
| **PMS middleware** | A layer between Cabana and each hotel's PMS | No — the app is written to expect it |

**The front desk is the main channel.** Most orders and requests go through the front desk (chat or in person), and the desk is the fallback whenever an in-app action fails. Anything you design that counts spend, history or vendor performance must therefore read from the **bill / folio**, which covers every channel — not only in-app bookings.

---

## 3. Guest journey (the vocabulary you will hear)

Every screen is decided by which of four **lifecycle gates** the guest is in.

| Gate | Opened by | What the guest can do |
|---|---|---|
| **Entry** | Signing in (Apple / Google / email code) | Look up a booking, or (signed-in, no booking) search and book hotels |
| **Pre-arrival** | A connected booking | Pre-register (details, ID, room preferences, extra guests, early check-in request) and book a small set of arrival services: airport transfer, private car, luggage, celebration setup |
| **In-stay** | The guest **scans the in-room QR** (or the desk unlocks them) | Full on-property catalogue, charge-to-room, room upgrade requests |
| **Post-stay** | Checkout (done by staff) | Settled receipt, desk chat for 24 hours, private star rating, partner-hotel search |

Rules that shape vendor design:

- **Cabana never checks anyone in, assigns rooms, or checks anyone out.** Staff do that in the PMS. Cabana only reads the results back.
- **Room verification gates ordering.** Being inside the stay dates is not enough. The guest must scan the room QR (or the desk grants it). This is stored per booking.
- **Guests can never unlock themselves.** "I can't scan" files a request to the desk; only the desk grants access.
- **Status changes come from the backend / desk, never from guest taps.** The guest app reflects state.

### Guest-app navigation

Five slots, fixed order, never reflowed:

| Tab | Holds |
|---|---|
| **Home** | State-dependent stay card, recommendations, previous stays, or hotel search |
| **Explore** (2nd slot) | Changes by gate: arrival services → full on-property catalogue and reel feed → partner-hotel search after checkout |
| **My Stay** | Stay card, room-charge (folio) link, house essentials, Upcoming / Past bookings, vendor QR |
| **Chat** | Front-desk thread (one per stay) |
| **Profile** | Achievements, stay history, sign out |

A signed-in guest with no booking sees only Home and Profile. Notifications are a bell in the top bar, not a tab.

---

## 4. Money — the rules that matter most to you

This is the area most likely to shape your design.

| Provider type | How the guest pays | Who gets the money |
|---|---|---|
| **Hotel operated** or **Hotel arranged** | **Charge to room.** Added to the folio and settled at the front desk at checkout. No card / GCash / Maya prompt. | Hotel |
| **Third-party on property** or **Curated guide** | Guest chooses **charge to room** *or* **pay now** through a gateway (Card, GCash, Maya) | On pay-now: paid **directly to the vendor**, never touches the folio. On charge-to-room: settled through the hotel's folio (see gap below) |
| **Partner shop across town** | Scan the guest's **room-charge QR** at the shop; the purchase posts to the room | Partner, via the hotel tab (mechanism undefined) |
| **Hotel room reservation made in the app** | **Pay now, in full** through the gateway (no folio exists before the stay) | The hotel |
| **Complimentary items** | Nothing | — |

Stated rules and details:

- **Pay-now is a per-operator rule** (`acceptsPayNow`): only "Third-party on property" and "Curated guide" qualify. The team's own note says to revisit this as **a flag per vendor** rather than a per-operator rule. That is a natural vendor-settings toggle.
- **Paid bookings never touch the folio.** Cancelling a paid booking refunds the original payment method.
- **Points earn on the whole settled bill** (see section 8), so vendor charges that land on the room earn points for the guest.
- Nothing has been decided about **commission, payout cadence, disputes, chargebacks, KYC or vendor contracts**. The words "commission" and "payout" appear nowhere in the docs.

**Gap that matters:** when a guest charges a *third-party* vendor service to the room, the hotel collects from the guest at checkout. How the vendor then gets paid by the hotel (and any hotel margin) is undefined. Your portal likely needs a place to show "what's owed to you and when".

---

## 5. Provider types in the guest app today

| Type | Examples in the prototype | Discovery | How the guest books | Fulfilled by |
|---|---|---|---|---|
| **Hotel operated** (14 catalogue rows) | Apartment 1B, In-Room Dining, Poolside Bar, Kape Manila Café, Azotea Rooftop, laundry, luggage, gym, cooking class, film night | Explore, category lists, reels, search | Restaurants: **through front-desk chat** (the guest messages items, the desk posts to the room). Other services: a booking form | Hotel |
| **Hotel arranged** (2) | Airport transfer (₱1,200 flat), private car (₱4,800/day) | Arrival services, Explore | Booking form or arrival cart | Hotel arranges the driver |
| **Third-party on property** (15) | Hilom spa treatments, Lakbay tours and diving, Sakay and Byahe rentals, babysitting, on-call doctor | Explore, reels, category lists | Booking form; pay now or charge room | The vendor |
| **Curated guide** (6) | Mani-pedi / barber (Sinag), Kalye Manila walks, museum pass, celebration flowers (Bulaklak) | Same | Same | The vendor |
| **Partner shop off property** | Casa Capiz Crafts, Kalesa Ko (fixtures) | — | Room QR shown at the shop | Partner |
| **Lobby gift shop** | 10 souvenirs | Gifts & Souvenirs | Chat with the desk; desk confirms stock and price | Front desk |
| **Nearby independents** | ~15 places | Nearby recommendations, reels | **Directory only** — no in-app sale; one action, "Book a ride" | Independent |
| **Partner hotels** | 11 hotels (3 Henry + 8 invented) | Home search, post-stay Explore | In-app booking flow (section 6) | Hotel |

Named vendor accounts already exist in the mock (`service-venues.ts`), each with a name, location, kind, the services it operates, and an image: Hilom Spa & Wellness, Sinag Beauty Bar, Lakbay Island Tours, Kalye Manila Walks, Sakay Rentals, Byahe Car Rental, Bantay Care, Bulaklak Flower Studio — plus the hotel itself as a "property" account. The file says these are stand-ins for records the middleware should own. **This is the closest thing to a vendor entity that exists.**

### Service categories (top-level tiles)

Food & Drinks · Spa & Wellness · Entertainment & Tours · Rentals · Hotel Services · Gifts & Souvenirs (a sixth tile, not a real category yet).

Each category has subcategory chips (for example Spa → Massage, Body Treatments, Beauty & Grooming, Mind & Movement). Chips appear only when they hold something at that hotel.

### What a catalogue item carries today

- Name, category, type label, provider/operator, tone (colour hint)
- **Price** — free text: `₱2,400`, `From ₱450`, `₱900 / day`, `₱600 / hour`, `₱2,500 / half day`, `Complimentary`
- **Cancellation cutoff** — free text; only "N-hour cancellation cutoff" (2h or 24h) is machine-readable. Others: `Same-day service`, `Walk-in & takeaway`, `Friday–Sunday · 6 PM`
- Optional **city** (hides the item at other hotels)
- Optional **requirement** (vehicle rentals: "Driver's licence shown at pickup")
- Optional **fixed schedule** (live music Fri–Sun 6 PM; film night Sat 8 PM)
- Menus (restaurants): items with name, description, price, course, tag, dietary tags (vegetarian, vegan, seafood); venue hours, location, price range

**What does not exist** and that a real vendor tool will need: per-slot capacity, duration, stock, structured price rules, images per item, structured cancellation policy, opening hours per service, blackout dates, multiple options or variants, add-ons.

**Availability is faked.** The guest picks from three fixed time slots (10:00 AM, 1:30 PM, 4:00 PM), up to three days ahead. The UI *reads* as live availability; nothing sits behind it.

---

## 6. The hotel booking flow (hotel-side data you will need)

Built 2026-09-29. Modelled on Agoda, with one differentiator: **one booking can mix room classes**, guests are split per room, and each room can have its own rate plan.

**Steps:** search (place, dates, adults, each child's age) → results (sort, filter, list/map) → hotel page (pick room classes and rate plans) → assign guests to rooms → arrival extras (optional: airport pickup, private car, early check-in, celebration setup, luggage) → guest details → pay → confirmation.

**Hotel record (mock):** name, city, area, address, stars, rating (0–10) and review count, map position, hero photo plus 2–3 gallery photos, summary and about text, amenities from a closed list of 10 (pool, beach, breakfast, wifi, airport transfer, spa, gym, restaurant, parking, family), optional phone and email, a "Henry" flag, a neighbourhood list, and the partners/venues around it.

**Room class:** name, size, beds, view, features, one photo, max adults (12+), sleeps (6+), weekday base rate, which rate plans apply.

**Three fixed rate plans:**

| Plan | Cancellation | Breakfast | Price |
|---|---|---|---|
| Flexible | Free | No | Rack rate |
| Flexible + breakfast | Free | Yes, flat per room | Rack + ₱600 × sleeps, per room per night |
| Saver | Non-refundable | No | 85% of rack |

**Pricing and inventory rules (mock but consistent):**

- Fri/Sat nights are 15% above the weekday base. VAT 12% and service charge 10% apply after promo. Promo codes are hard-coded: `CABANA10` (10% off rooms), `WELCOME500` (₱500 off, first in-app booking only), `HENRY15` (15% off The Henry's own hotels, 3+ nights). Codes discount rooms only.
- Arrival extras are paid in the same payment as the rooms, with fixed prices: pickup ₱1,200 (up to 4) or ₱1,800, private car ₱4,800/day, early check-in ₱1,500 (refunded if the hotel declines), flowers ₱1,600 or full setup ₱3,200, luggage free. The vendor app will need to publish these per hotel.
- Availability is 0–6 rooms per class per night, shown as "Only N left" at 3 or fewer and "Sold out" at 0. Inventory is per room class, not per rate plan.
- Global limits: 30 nights, 12 adults, 8 children per booking. Every room needs an adult 12+; at most two under-6s per room.
- Check-in 3:00 PM and check-out 12:00 PM are hard-coded for the whole estate.

**A confirmed reservation stores:** reference (`CAB-XXXXXX`), hotel, rooms (class, rate plan, lead guest, adults, children, each room's share of the total), room total, the voucher used and its saving, the arrival extras and their total (kept apart from the rooms), payment method label, paid date, refundable flag, free-cancellation deadline (23:59 three days before check-in).

**Cancellation:** refundable only if no room is on Saver. Full refund of the total to the original method in 5–7 banking days. Some rooms can be cancelled on their own (each refunds its share; extras stay); cancelling every room also refunds the extras. No partial fees, no no-show rule, no per-hotel policy. After the window, changes go through front-desk chat.

**Important gaps in the current data:**

- The guest enters contact details, bed preference per room, arrival time and special requests, but **none of it is saved on the reservation**. A hotel-side view has nowhere to receive it yet.
- The booking is **never pushed to the hotel**. No channel-manager, inventory or confirmation message exists.
- The old post-stay screen linked out to Agoda and Booking.com. That is gone and the docs have been updated.
- Hotel data lives in two places that disagree (names, phones, room IDs). The hotel search data is the newer source.

**Front-desk contact data** exists for only some hotels (mock hours: Manila 6 AM–10 PM, Cebu 24h, Dumaguete 7 AM–11 PM). Display-only; nothing computes "desk open / closed".

---

## 7. What a vendor would need to fulfil a booking

### Today's booking record

A service booking carries: id, the parent stay's booking id, service id and title, when (display text, ISO date and hour), party size, rental quantity, amount, **status** (`confirmed`, `cancelled`, `completed`), **payment status** (`charged-to-room`, `paid`, `payment-pending`, `pending-confirmation`, `complimentary`, `refunded`), payment method (`room`, `card`, `gcash`, `maya`), a provider display string, a summary line, an optional off-property place, and a free list of label/value "facts" (meeting point, guide, flight, vehicle, pick-up/return, "Run by"). Restaurant orders add items with quantities and fulfilment (delivery ASAP/scheduled, or pickup).

Two things to notice:

- **Guest name, room number, guest count, property and city sit on the parent stay, not the service booking.** A vendor would need these; today they are not sent to any vendor.
- `pending-confirmation` means **a request awaiting the hotel** (early check-in, desk-sent bookings, airport rides, room-later cart lines). It is the seed of an **accept / decline** flow.

### How vendors are (not) informed today

- **Nobody notifies the vendor.** Third-party pre-arrival items send nothing to the vendor. Only transfer and early check-in send a chat message to the desk.
- **There is no vendor-to-guest channel.** All commerce and support is a single voice: the front desk.
- **Vendor identity in the guest app is thin.** Guests see "Run by {vendor}", the vendor's avatar and name on reels, and "Paying {vendor}" in the gateway. No logo, contact details, vendor chat or ratings.

### The vendor QR (the most direct existing hook)

My Stay shows a **room-charge QR** for a guest in a verified, active stay. It encodes only `{ type: "hotel-vendor-folio", version: 1, property, folioReference }` — no guest data, no signature, no expiry. Shown at a partner shop, it is meant to post the purchase to the room.

The team's note: **not connected to any vendor portal or settlement**; a real version "needs server-issued validation and an affiliated-vendor flow". A vendor-side scan-and-charge screen is a likely deliverable.

### Cancellation, from the vendor's angle

- Self-service if the time until the service is at least the vendor's cutoff (2h or 24h in the mock); otherwise the guest is sent to the front desk. The desk decides.
- Room-charged amounts come off the folio; paid bookings become `refunded` to the original method.
- No fees, partial refunds, no-show rules or point clawbacks exist.
- A pending request can always be withdrawn by the guest.
- Restaurant orders cannot be self-cancelled.

### Transfers

The airport transfer is a flat ₱1,200 with pick-up, drop-off, optional flight and passenger count. Driver name and plate are "sent later". This is a natural place for a **dispatch** view.

---

## 8. Content, promotion and rewards (where vendors might want control)

### Explore and reels

Once a guest is verified in the stay, Explore is a full-screen vertical **reel feed** called "For you".

- **Content types:** venue stories, service stories, hotel "moments" (welcome drink, breakfast, pasalubong, transfer home, late checkout), and nearby partner places.
- **A reel has:** 1–3 image frames, a "why you're seeing this" line, title, location subtitle, **author** (`property` = the hotel, with a verified check; `venue` = a partner), price, and **one call-to-action** that opens a normal booking screen. Video support exists but is switched off.
- **Reels live 24 hours** — the stated intent is to make merchants post regularly.
- **Ranking** is deterministic and not paid: stay phase, time of day, "follows what you booked", party fit, and a small boost for hotel posts on the first night. Booked items sink to the end. Neighbouring reels never share an author or category.
- **Today the copy, tags and timing are handwritten.** Vendors control nothing.
- **Ask panel** (inside the Browse sheet): seven scripted situations ("It's raining", "We're celebrating", "Before checkout"…). Each maps to three catalogue items with a one-line reason. Keyword matching, no AI.
- **Paid placement does not exist.** Comments say hotel and venue authors are "worth different money in a promoted slot", and the specs defer billing to "a later spec". A `pinned` option on the Recommended rail is described as the seam for an admin dashboard, but nothing sets it. No sponsor flag or ad label exists. Any promotion tooling you design should be treated as new, not extension of something built.

### Rewards, points and badges

Derived from stays and bookings; the guest only "spends" points and can mute badges.

- **Earn:** 50 points per ₱100 on **every charge on the settled bill**, whichever channel. Rooms earn 70 per ₱100 if booked direct and 20 if via an OTA. Bonuses: room code scan 1,000; pre-registration 1,500; stay survey 1,000.
- **Pending vs confirmed:** points on a live stay are pending and confirm when the desk settles.
- **Spend:** 1,000 points ≈ ₱100 off, in whole blocks; can be applied to an in-stay service at the booking step. Points expire 24 months after the latest stay.
- **Redemption menu is hotel inventory**, priced below floor value: late checkout (4,000), breakfast for two at Kape Manila (5,000), airport transfer (8,000), room upgrade (12,000), Hilom massage (16,000), couples massage (32,000), a free night (55,000).
- **Badges:** 42 in six families (taste, company, rhythm, place, house, venue). Taste badges are tied to service IDs; venue badges include "Regular" (three visits to one venue) and "Menu explorer". Rarity numbers are seeded, not measured.
- **Vendors cannot fund rewards or boosts.** That is an explicit non-goal: it "needs a funding model and a provider-side surface, neither of which exists".

**Open question to raise:** when points are applied to a pay-now vendor booking, the booked amount is already net of points. Nothing says **who funds that discount**.

---

## 9. Chat, notifications, and failure states

- **Front-desk chat** is one thread per stay, the same surface however the guest arrives (from a venue menu, gift shop, service page or tab). It is a human-desk conversation, not a bot. Quick actions differ by stage (pre-arrival: arrival time, pick-up, early check-in, special occasion, parking; in-stay: towels, housekeeping, late checkout, room issue, transfers; post-stay: a charge, lost item, receipt, ride).
- **Media:** one image or a 30-second voice note per message. Delivery states: Sent, Seen, "Will send when connected", "Not sent · Retry".
- **After checkout** the desk is reachable for **24 hours**, then chat becomes read-only with the hotel's phone and email shown, plus a private 1–5 rating.
- **After-hours behaviour is not built.** The specs describe "Front desk online / Outside staffed hours"; the code does not.
- **The desk's replies are a scripted timer.** There is no staff console. Your designs may define the first real one, or leave it to a separate effort — worth clarifying.
- **Notifications** are derived from state (room ready, order being prepared, request confirmed, new charge on your room). No push. Property announcements are a static strip on Home, active at set hours.

### Degradation model (design for it on the vendor side too)

The hotel estate is **mixed**: some properties run legacy on-premise PMSs, others cloud PMSs with open APIs (Cloudbeds is named). A middleware layer fronts them all, and a channel manager is planned for inventory sync. The guest app therefore never assumes one upstream shape or a live connection.

- **Offline / PMS down, per capability:**
  - Cached stay details: **available**
  - Chat, pre-registration, preferences: **queued** on the device
  - Service booking, payment, live rates, login: **blocked** — never queued, "because the slot or price could change"
- **When a hotel system is down or a booking fails**, the guest sees last-known data with a stale notice and can **send the request to the front desk**, which becomes a `pending-confirmation` booking.
- **Room readiness is optional per property.** Legacy PMSs can report an allocated room but not whether it is clean. Those stays never promise a "room ready" moment.

Expect the same variability on your side: some vendors and hotels will confirm instantly, others by phone. Design for **confirmed / requested / unavailable** rather than assuming instant sync.

---

## 10. Gaps and open questions to raise with the team

**Commercial and money**

1. Commission model, payout cadence, settlement reports, disputes and chargebacks — none defined.
2. How does a third-party vendor get paid when the guest charges their service to the room?
3. Who funds points redeemed against a pay-now vendor booking?
4. Should pay-now be a per-vendor setting (the team's own suggestion)?
5. Cabana-app hotel bookings have source `Cabana app`, which earns points at the OTA rate (20 per ₱100), not the direct rate (70). Probably unintended — confirm.

**Onboarding and accounts**

6. Vendor onboarding, contracts, KYC/verification, who approves a new vendor (Cabana or the hotel), and whether a vendor can serve many properties.
7. Roles and permissions within a vendor (owner, staff who scan QR codes) and within a hotel (front desk, revenue manager, marketing).
8. Is there a single "provider" model covering hotel, vendor, travel agent and tour operator, or separate types?

**Catalogue and availability**

9. Structured pricing (per hour, per day, per person, from-prices, add-ons), capacity per slot, duration, stock, opening hours, blackout dates, images, structured cancellation policy.
10. Does the vendor or the hotel own the listing? Does the hotel approve which vendors appear at its property?
11. Which properties does a vendor's listing appear at (today a few items are scoped by city)?

**Fulfilment**

12. How is a vendor told about a booking (push, email, SMS, portal inbox, desk relay)? Accept, decline and reschedule flows? What does the vendor see about the guest (name, room, party size, notes)?
13. Vendor QR: server-issued validation, expiry, per-vendor scope, refunds and voids, receipt format.
14. Should vendors chat directly with guests, or stay behind the front desk?
15. Transfers and driver dispatch (plate, driver, flight tracking).

**Content and promotion**

16. Do vendors post reels/stories themselves? Approval workflow, 24-hour life, image and video rules.
17. Paid placement: pricing, labelling, how it interacts with the deterministic ranking and the "hotel post gets a first-night boost" rule.
18. Per-vendor reviews are deliberately deferred ("worth building when an operator asks which vendor is dragging their score down"). Reviews today are private, stay-level, and never published.

**Hotel side**

19. Where should guest-supplied booking details (contact, bed preference, arrival time, requests) land, and how does the hotel receive a new reservation?
20. Per-hotel policies: check-in/out times, cancellation, deposits, pets, child rules, taxes — all hard-coded today.
21. Front-desk hours, after-hours behaviour and the staff console.

---

## 11. Visual language (so the new side feels related)

From [DESIGN.md](../DESIGN.md) (source of truth), with token detail in [docs/design-system.md](design-system.md).

- **Palette:** white, near-black ink, and Cabana **plum** (`#462133`, the logo colour). No pink. Grey canvas, white surfaces separated by hairlines.
- **Plum has exactly three jobs:** the primary action, the current selection, and live state. Never a wash or decoration. Anything filled with plum takes white text.
- **One inverted (near-black) surface** exists, reserved for totals (the folio total). At most one per screen.
- **Status colours** (green, amber, red) are status only.
- **Type:** Asbir Sans, one family. 30px screen titles (700), 17px section titles, 15px body, 13–14px supporting text. Numbers that change use tabular figures.
- **Shape:** 16px radius for cards and grouped lists; 20px for the folio total and sheets; pills for buttons, chips and search.
- **Depth:** hairline **or** shadow, never both. Shadows only on things that float.
- **Motion:** 140ms press, 160ms hover, 220ms screen change; ease-out only; reduced motion keeps fades and drops movement.
- **Targets:** 44px minimum; all states (default, hover, focus, active, disabled) designed.
- **Design tone:** task-first and restrained. Copy is plain (for example "Charge to room", "Awaiting hotel confirmation"). Eyebrows earn their place by carrying information.
- **Guest layout** is one mobile column capped at 480px. The vendor side is presumably a desktop-first web portal plus a phone view for scanning — that is your call, but the tokens, type and status language should carry over.
- **Component gallery** with 36 patterns is at `/components` when the app runs locally.

Icons are Hugeicons; the font and logo are in `public/`.

---

## 12. Things to note

- **The guest app can be run and clicked through:** `npm run dev`, then open http://localhost:3000. A **wrench button (bottom-right)** opens the prototype controls: jump between stay states (signed out, pre-arrival, arrived, live, checkout day, just checked out, closed), move the clock, simulate PMS events (room assigned / ready, upgrade approved, room verified), and force conditions (offline, PMS down, next booking fails). This is the fastest way to see every guest state. Installing needs a licensed Hugeicons key (see README).
- **Prices are shown as Philippine pesos (₱)**, integer amounts, formatted strings.
- **The prototype "today" is fixed at 2026-11-11.** Dates in fixtures straddle it on purpose.
- **Data is in-browser only.** The session persists in `localStorage` (`cabana.guest-session.v5`); nothing calls a server.
- **Docs were reconciled on 2026-09-29:** `docs/llm-context.md`, `docs/design-system.md` and the README now reflect rewards, pay-now vendors, in-app hotel booking and the plum accent. `docs/superpowers/handoff-2026-09-09.md` is marked superseded. Where a doc and the code disagree, the code wins.
- **Dead or unfinished bits you may notice in the prototype:** the `chat-after-hours` screen is the same as `chat`; the restaurant cart screen exists but ordering now goes through chat; the reel "story rings" on Home described in specs are not built; the `Opener` venue badge has no evidence rule; the "Gifts & Souvenirs" count is hard-coded.
- **Mock content caution:** "popular" labels (for example "Booked twelve times today"), ratings, review counts, rarity percentages, vendor names and availability are invented.

## 13. Where to look in the code

| Topic | File |
|---|---|
| Types, fixtures, catalogue, gates, rules | `src/components/features/guest-app/prototype-model.ts` |
| All screens and navigation | `.../guest-app-prototype.tsx` |
| Vendor accounts (mock) | `.../promoted/service-venues.ts` |
| Reels, feed ranking, ask panel | `.../promoted/` |
| Vendor QR and My Stay | `.../stay-home.tsx` |
| Gateway checkout (pay-now) | `.../gateway-checkout.tsx` |
| Hotel booking flow, hotels, rate plans | `.../stay-booking/` (`model.ts` first) |
| Points and badges | `.../rewards/` |
| Prototype controls | `.../prototype-controls.tsx` |
| Specs and plans (history and decisions) | `docs/superpowers/specs/`, `docs/superpowers/plans/` |
| Visual system | `DESIGN.md`, `docs/design-system.md`, `/components` |
