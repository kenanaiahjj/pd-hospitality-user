import type { KnownGap, RuleGroup } from './types';

export const RULE_GROUPS: RuleGroup[] = [
  {
    group: "Payment",
    rules: [
      {
        id: "PAY-1",
        text: "Each payment is paid one way: charged to the room, or paid in full through the gateway (GCash, Maya, card). Never split. No deposits, no part payments.",
        from: "Ken",
        status: "Built",
        drawn: "A, I"
      },
      {
        id: "PAY-2",
        text: "Charge to room is pre-selected when the date is inside the stay and the vendor takes room charges. The guest can choose full payment instead.",
        from: "Ken",
        status: "Built",
        note: "A hotel-run service takes room only.",
        drawn: "A"
      },
      {
        id: "PAY-3",
        text: "Payment stays inside the app so the hotel and the platform keep their share, whether it is charged to the room or paid by card. There is no cash path.",
        from: "Meeting",
        status: "Built",
        drawn: "A"
      },
      {
        id: "PAY-4",
        text: "For a vendor that confirms first, a card payment is taken only after the vendor accepts. The guest has 15 minutes and 3 tries. If unpaid, the payment expires and the slot is released. A vendor that charges at once opens the same 15 minute window as the guest confirms.",
        from: "Test value",
        status: "Built",
        drawn: "A, H, I"
      },
      {
        id: "PAY-5",
        text: "Charge to room is offered only when the service date falls inside the stay and the order is within the limits.",
        from: "Test value",
        status: "Partly",
        note: "The date check works. The limits are switched off in the app for now, so any amount can go on the room.",
        drawn: "A"
      },
      {
        id: "PAY-6",
        text: "Limits are set by the hotel, per order and per stay. The test values are ₱5,000 per order and ₱20,000 per stay, and both are inclusive.",
        from: "Meeting",
        status: "Partly",
        note: "Built and tested in the engine and the scenarios. In the app the limits are set to no limit for now, so the guest never sees them.",
        drawn: "A"
      },
      {
        id: "PAY-7",
        text: "An over-limit order goes to the front desk, which approves or declines within 10 minutes. The slot is held meanwhile. Declined, or no answer, moves the guest to Pay in full or cancel.",
        from: "Meeting",
        status: "Partly",
        note: "Built and tested in the engine. In the app nothing is ever over the limit, so this never happens on screen.",
        drawn: "A, H"
      },
      {
        id: "PAY-8",
        text: "There is no deposit check for now. Any guest with a stay can charge to room, within the limits.",
        from: "Ken",
        status: "Built",
        drawn: "A"
      },
      {
        id: "PAY-9",
        text: "A room booking made before arrival waits as pending and posts at check-in. Cancelling the stay cancels or withdraws every booking.",
        from: "Test value",
        status: "Partly",
        note: "The engine does this. The app's pre-arrival flow does not go through the engine. There is no stay no-show status.",
        drawn: "A, cases"
      },
      {
        id: "PAY-10",
        text: "Each extra charge is its own payment. The engine chooses the way, not the guest: room if the booking was paid by room, is inside the stay and within the limits, otherwise card. A card-paid booking never gets a room extra. An over-limit extra goes to card with no desk approval, and extra card charges have no 15 minute window.",
        from: "Test value",
        status: "Built",
        drawn: "B, C, I"
      },
      {
        id: "PAY-11",
        text: "A hotel room booked in the app is paid in full, because there is no room bill before the stay.",
        from: "Ken",
        status: "Not built",
        note: "No hotel room listing exists in the pilot engine.",
        drawn: "Not drawn"
      },
      {
        id: "PAY-12",
        text: "Restaurant tables take no payment in Cabana. The bill is settled at the venue, by room or in full there.",
        from: "Meeting",
        status: "Built",
        note: "A table has amount 0 and the line \"Bill settled at the restaurant\".",
        drawn: "E"
      },
      {
        id: "PAY-13",
        text: "Pay in full or cancel: after a desk decline or silence the guest has 15 minutes to choose. On expiry the request lapses with \"No choice was made\". A room-only vendor offers Cancel only.",
        from: "App",
        status: "Partly",
        note: "Built in the engine. Not reachable in the app while the limits are off.",
        drawn: "A, H"
      },
      {
        id: "PAY-14",
        text: "Points can reduce the price, never below zero. They apply to charge-at-once bookings only, never to a vendor-confirms-first booking, and come back if the booking ends.",
        from: "App",
        status: "Built",
        drawn: "Not drawn"
      },
      {
        id: "PAY-15",
        text: "A listing with a zero price is confirmed with no payment.",
        from: "App",
        status: "Built",
        drawn: "Not drawn"
      },
      {
        id: "PAY-16",
        text: "A card payment that arrives after it expired is refunded with a note. A second payment for something already paid is refunded automatically. Lost and repeated gateway callbacks are handled. A failed refund becomes a desk task.",
        from: "App",
        status: "Built",
        drawn: "I"
      }
    ]
  },
  {
    group: "Booking and vendor confirmation",
    rules: [
      {
        id: "BKG-1",
        text: "Rentals and boat or tour trips are confirm-first: the vendor must accept before anything is charged. Henry's own activities, pasalubong and shop goods are instant: they charge as the guest confirms, with stock and capacity held.",
        from: "Meeting",
        status: "Built",
        note: "Invariant I3 covers confirm-first bookings only.",
        drawn: "B, C, D, H"
      },
      {
        id: "BKG-2",
        text: "A request holds its slot or stock in one step, so two guests can never take the last one. Every exit releases the hold.",
        from: "Test value",
        status: "Built",
        drawn: "H"
      },
      {
        id: "BKG-3",
        text: "The vendor timer is 30 minutes for a service within 24 hours. Otherwise it is 4 hours counted only while the vendor is open, never more than 24 hours.",
        from: "Test value",
        status: "Built",
        drawn: "B, C"
      },
      {
        id: "BKG-4",
        text: "A reminder goes at half time. An SMS goes if the request is unopened after 5 minutes. The request lapses at the earlier of the timer end or 15 minutes before the start.",
        from: "Test value",
        status: "Built",
        drawn: "B, C"
      },
      {
        id: "BKG-5",
        text: "On a lapse nothing is charged, the guest is told by push and SMS, and the booking reads Not booked with the line \"No answer in time · nothing charged\". A desk task opens when the service is within 24 hours or the desk made the booking. A reinstated request tells the guest again.",
        from: "Test value",
        status: "Built",
        drawn: "B, C, H"
      },
      {
        id: "BKG-6",
        text: "A vendor tap made offline counts if it was made before the deadline or within 5 minutes after it, with the slot still held. The lapse itself waits 5 minutes only when the vendor is offline.",
        from: "Test value",
        status: "Built",
        drawn: "Cases"
      },
      {
        id: "BKG-7",
        text: "When two actions arrive together, the first one recorded wins. A same-instant conflict names who acted first. Otherwise the loser sees the booking's current state.",
        from: "Test value",
        status: "Built",
        drawn: "H, cases"
      },
      {
        id: "BKG-8",
        text: "There is one active request per guest, listing and slot. A repeat request returns the existing booking.",
        from: "Test value",
        status: "Built",
        drawn: "Cases"
      },
      {
        id: "BKG-9",
        text: "A restaurant table is free to hold and is Reserved at once for the times and party sizes the venue publishes. It is held 15 minutes past its time, then marked a no-show automatically. Nothing is ever charged.",
        from: "Ken",
        status: "Built",
        drawn: "E"
      },
      {
        id: "BKG-10",
        text: "Every surface uses the same nine words for a booking: Awaiting confirmation, Pay to confirm, Confirmed, Ready to collect, In progress, Completed, Cancelled, No-show and Not booked. Not booked covers withdrawn, declined, lapsed and payment expired, with the reason in the line under it. Reserved, Seated, Collected and Ready read as Confirmed, Completed and Ready to collect.",
        from: "Meeting",
        status: "Built",
        note: "The engine still has 17 statuses. Only the words the guest sees are nine.",
        drawn: "H"
      },
      {
        id: "BKG-11",
        text: "On the day only the vendor scans. The guest shows a QR that reads cabana-booking and the booking id. The QR is not signed. Today's and tomorrow's bookings are saved on the vendor's phone for offline use, and a lookup by guest name and room works. Calling the desk is only message text. Tables are seated, not scanned.",
        from: "Meeting",
        status: "Partly",
        note: "The design said either side could scan, with a signed QR.",
        drawn: "B, C, cases"
      },
      {
        id: "BKG-12",
        text: "Every listing has a capacity per slot, so a vendor can be limited per day. Slots can be blocked and capacity changed.",
        from: "Meeting",
        status: "Built",
        drawn: "C"
      },
      {
        id: "BKG-13",
        text: "Goods charge as the guest confirms. The vendor packs the order and sends it to the front desk, the desk marks it ready, and the guest collects. A short item adjusts the charge. Logistics beyond the desk, including airport pickup, are left out.",
        from: "Meeting",
        status: "Built",
        drawn: "D"
      },
      {
        id: "BKG-14",
        text: "Goods are ready on the day the guest chose. Shop goods are ready 30 minutes after the order if it is today, otherwise at 10:00. Pasalubong is ready at 17:00. The desk marks ready and hands over by hand. Nothing happens by itself on departure day.",
        from: "Test value",
        status: "Built",
        drawn: "D"
      },
      {
        id: "BKG-15",
        text: "Quantity is capped on each listing: 50 for pasalubong, 10 for the lobby shop. Above the cap the order is refused with \"Ask the vendor in chat\".",
        from: "Test value",
        status: "Partly",
        note: "The message does not open a chat.",
        drawn: "Cases"
      },
      {
        id: "BKG-16",
        text: "In the app every nearby listing is bookable in the app. Hotel-run services take room only. The desk can book by hand for a guest. There is no call-to-reserve path in the pilot.",
        from: "Ken",
        status: "Partly",
        note: "The design had call to reserve for vendors outside Cabana.",
        drawn: "J, L"
      },
      {
        id: "BKG-17",
        text: "Each listing can carry options: which payment ways it takes, a return-by time (20:00 for the Manila rentals), a lead time, a ready-at time, an order cap, a maximum party, a menu PDF, a unit name (bike, e-bike, scooter), a duration, and a price basis of per unit or one price for the booking.",
        from: "App",
        status: "Built",
        drawn: "Not drawn"
      },
      {
        id: "BKG-18",
        text: "The desk can reinstate a lapsed request if the slot is still free. A vendor tap on a lapsed request raises a desk task.",
        from: "App",
        status: "Built",
        drawn: "H, cases"
      },
      {
        id: "BKG-19",
        text: "Guest actions on a card include Running late (it pushes the vendor and posts a line), Pay in full instead, and Dispute this cancellation, which can be used once. Cancel and Withdraw both ask first (Keep it, or Yes, withdraw). A declined, lapsed, withdrawn or cancelled booking offers Book again.",
        from: "App",
        status: "Built",
        drawn: "Chat cards"
      }
    ]
  },
  {
    group: "Cancellations and disputes",
    rules: [
      {
        id: "CAN-1",
        text: "Each listing sets a free-cancel window. Inside it the booking cancels at once, a room charge is undone and a card payment is refunded to the same method.",
        from: "Test value",
        status: "Built",
        drawn: "G"
      },
      {
        id: "CAN-2",
        text: "Outside the window the vendor accepts or declines. Declined means the booking stands, the desk gets a task and there are no part fees. A cancellation request has no timeout.",
        from: "Test value",
        status: "Built",
        drawn: "G"
      },
      {
        id: "CAN-3",
        text: "A vendor can cancel any time before the service starts, with a required reason. Everything is undone, the guest gets a push and an immediate SMS and is offered Pick another, and the desk is told.",
        from: "Test value",
        status: "Built",
        drawn: "Cases"
      },
      {
        id: "CAN-4",
        text: "A vendor can cancel a whole slot in one action. The desk gets a batch task.",
        from: "Test value",
        status: "Built",
        drawn: "Cases"
      },
      {
        id: "CAN-5",
        text: "Tables mark a no-show by themselves 15 minutes past the time. For anything else the vendor taps no-show 30 minutes or more after the start. The charge stands.",
        from: "Test value",
        status: "Built",
        drawn: "H"
      },
      {
        id: "CAN-6",
        text: "A change of date is not supported. The guest cancels and rebooks.",
        from: "Test value",
        status: "Built",
        drawn: "Cases"
      },
      {
        id: "CAN-7",
        text: "A service that is In progress cannot be cancelled, only questioned.",
        from: "Test value",
        status: "Built",
        drawn: "G, H"
      },
      {
        id: "CAN-8",
        text: "After checkout a guest cancel is refused. A settled room charge becomes Refund due with a desk task. Card payments are left alone.",
        from: "Test value",
        status: "Built",
        drawn: "I, cases"
      },
      {
        id: "CAN-9",
        text: "If a stay is shortened below a booking, the booking is flagged, the guest is asked to pay in full or cancel, and a desk task is due 24 hours before the service. Moving rooms rewrites the folio room.",
        from: "Test value",
        status: "Built",
        drawn: "Cases"
      },
      {
        id: "CAN-10",
        text: "Free-cancel hours are set per listing. Manila listings use 2 or 24 hours, and rentals cancel by the pickup time. The pilot catalogue uses 24 for the boat, bikes and Sans Rival, 12 for yoga and the walking tour, 48 for diving, and any time for tables. A default of 24 is declared and not used.",
        from: "App",
        status: "Built",
        drawn: "G"
      },
      {
        id: "DSP-1",
        text: "A dispute marks the booking or charge In question. Checkout is blocked and a desk task opens.",
        from: "Test value",
        status: "Built",
        drawn: "M"
      },
      {
        id: "DSP-2",
        text: "While a dispute is open the desk can read the guest and vendor chat, read only. Both sides get a notice, every open is logged, the desk never writes there, and deciding the dispute ends access. The desk sees a sheet with a Read only tag, no composer, and decision buttons.",
        from: "Ken",
        status: "Built",
        drawn: "M"
      },
      {
        id: "DSP-3",
        text: "The desk decides: uphold, adjust (the old charge voided, a new one posted) or waive. For a disputed vendor cancellation the booking stands or is reinstated as a fresh request.",
        from: "Test value",
        status: "Built",
        drawn: "M"
      }
    ]
  },
  {
    group: "Extra charges",
    rules: [
      {
        id: "EXT-1",
        text: "Rentals and services can add extra charges, such as a late return. Goods and tables cannot. A short item adjusts a goods charge instead.",
        from: "Test value",
        status: "Built",
        drawn: "B, C, D"
      },
      {
        id: "EXT-2",
        text: "The vendor must give a reason and an amount. The vendor can correct a wrong amount within 60 minutes. After that only the desk can.",
        from: "Test value",
        status: "Built",
        drawn: "B, C"
      },
      {
        id: "EXT-3",
        text: "The guest sees an extra charge at once as a receipt card and can question it. How it is paid follows PAY-10.",
        from: "Test value",
        status: "Built",
        drawn: "B, C"
      },
      {
        id: "EXT-4",
        text: "An unpaid or questioned extra charge, or a pending or failed room charge, blocks checkout until the desk collects, decides or waives it.",
        from: "Test value",
        status: "Built",
        drawn: "I, cases"
      },
      {
        id: "EXT-5",
        text: "A damage claim by the vendor is added as an extra charge but held In question until the desk decides. It needs the booking to be In progress or Completed.",
        from: "Ken",
        status: "Built",
        drawn: "M"
      }
    ]
  },
  {
    group: "Chat",
    rules: [
      {
        id: "CHT-1",
        text: "Every chat is one to one: guest with front desk, guest with vendor, front desk with vendor. Never a chat with all three.",
        from: "Ken",
        status: "Built",
        drawn: "J, K"
      },
      {
        id: "CHT-2",
        text: "The guest and vendor chat opens only when the vendor commits: when a confirm-first vendor accepts (even if a card payment is still pending), and as the guest books for instant listings and tables. A request that is withdrawn, declined or lapses never gets a chat. Until it opens, the guest is told \"This request has no chat yet. It opens when the vendor accepts. Call them or ask the front desk\", and the vendor is told to tap Confirm. The chat closes 48 hours after the service ends. Then the guest's message goes to the desk chat and the vendor's is refused.",
        from: "Ken",
        status: "Built",
        note: "A card payment still to come does not delay the chat, but the vendor's greeting waits until the booking is settled.",
        drawn: "J"
      },
      {
        id: "CHT-3",
        text: "The vendor sees the guest's first name. The room reaches the vendor only when the guest moves rooms or the desk looks the guest up.",
        from: "Test value",
        status: "Partly",
        note: "The design said first name and room.",
        drawn: "J"
      },
      {
        id: "CHT-4",
        text: "The fallback to the front desk is by hand. A waiting request offers Call the vendor, Ask the front desk and Withdraw. After the vendor commits, the booking page offers Message the vendor with a quieter Ask the front desk instead. A closed vendor chat sends the guest's message to the desk chat. A request that is too close, or a party over the maximum, tells the guest to message the desk or the restaurant. A lapse tells the guest and may open a desk task.",
        from: "Ken",
        status: "Partly",
        note: "Not built: a path for vendors not on Cabana, and the desk booking by hand from a chat.",
        drawn: "J, L"
      },
      {
        id: "CHT-5",
        text: "There is one front desk chat screen. It is opened from the Messages list, from the shop and from a closed vendor chat.",
        from: "Ken",
        status: "Built",
        drawn: "Chat cards"
      },
      {
        id: "CHT-6",
        text: "A booking card carries only the booking id, so every chat that shows it reads the same state. Only its buttons change a status. A typed \"ok\" gets a hint and changes nothing.",
        from: "Test value",
        status: "Built",
        drawn: "Chat cards"
      },
      {
        id: "CHT-7",
        text: "When the desk books for a guest who asked in person, the staff name and \"asked in person\" are logged before anything is charged. The card appears in the desk chat.",
        from: "Test value",
        status: "Built",
        drawn: "F, cases"
      },
      {
        id: "CHT-8",
        text: "A restaurant chat opens when the table is reserved. The menu is a PDF, with no pre-orders and no POS.",
        from: "Meeting",
        status: "Built",
        drawn: "E"
      },
      {
        id: "CHT-9",
        text: "Room-to-room chat is deferred.",
        from: "Meeting",
        status: "Not built",
        note: "Left out on purpose.",
        drawn: "Later"
      },
      {
        id: "CHT-10",
        text: "Routing is a setting per vendor: direct chat or via the front desk. A vendor that keeps missing the timer is flagged.",
        from: "Test value",
        status: "Not built",
        note: "No routing setting and no flag exist.",
        drawn: "L"
      },
      {
        id: "CHT-11",
        text: "Critical updates go as a push, and as an SMS if not opened in 10 minutes. A vendor cancellation sends the SMS straight away. With notifications off the push is hidden and the SMS follows.",
        from: "Test value",
        status: "Built",
        drawn: "Cases"
      },
      {
        id: "CHT-12",
        text: "When the guest sends a request, a banner says who has it, how many minutes they have, and that the chat opens when they say yes. When the vendor commits, a banner says the chat is open and taps through to it, the bell gets a note (it keeps it even with push off), and the thread starts with the request line, the card, the guest's note and \"Only you and them are in this chat\". Banners last 12 seconds.",
        from: "App",
        status: "Built",
        drawn: "Chat cards"
      },
      {
        id: "CHT-13",
        text: "Before the vendor commits there is no chat with them. The guest can add a note to the request, ask the front desk, or call the vendor. The card shows Call the vendor with the number, which opens as a phone link. The booking page and the service page also show the number. The hotel's own outlets use the hotel number, and other partners have a demo number.",
        from: "Ken",
        status: "Built",
        drawn: "J, Chat cards"
      },
      {
        id: "CHT-14",
        text: "Vendors send automatic messages so a chat is never empty, marked Auto-reply: a greeting when the booking settles, a reminder an hour before the start (not for goods, and only if the chat opened more than an hour earlier), a line when the service starts, a thank-you when it is done, a sorry when the vendor cancels, and a note when an extra charge is added. The wording is set per kind: rental, table, goods and service.",
        from: "App",
        status: "Built",
        drawn: "Chat cards"
      },
      {
        id: "CHT-15",
        text: "Hotel outlets (The Henry and The Lobby Shop) talk in the front desk chat, not in a chat of their own. Their messages and receipts are copied there once, labelled Auto-reply, and the booking card goes on the first line. Their threads are hidden from Messages and do not count as unread.",
        from: "App",
        status: "Built",
        drawn: "Chat cards"
      },
      {
        id: "CHT-16",
        text: "Links in a message are tappable (http and https only). Consecutive messages from one side on the same day read as one turn, and an automatic message or a card ends the turn.",
        from: "App",
        status: "Built",
        drawn: "Chat cards"
      },
      {
        id: "CHT-17",
        text: "Messages lists the front desk as a card with a gold Chat with the front desk pill, then one chat per outside vendor booking, newest first. The empty state reads \"Book something in Explore and you can message the vendor here.\"",
        from: "App",
        status: "Built",
        drawn: "Chat cards"
      }
    ]
  },
  {
    group: "PMS and the bill",
    rules: [
      {
        id: "PMS-1",
        text: "Room charges go to the PMS through a queue. Each carries a unique reference (CAB-PAY and a number), and the folio is checked for it before posting, so nothing posts twice.",
        from: "Test value",
        status: "Built",
        drawn: "I"
      },
      {
        id: "PMS-2",
        text: "The queue retries every 5 minutes for up to 24 hours. The desk is alerted at 30 minutes. The guest sees \"Charged to your room\" throughout.",
        from: "Test value",
        status: "Built",
        drawn: "I"
      },
      {
        id: "PMS-3",
        text: "If the PMS refuses a charge because the room changed, the room is looked up and it is tried again. A refusal for any other reason fails the charge at once and becomes a desk task.",
        from: "Test value",
        status: "Partly",
        note: "There is no second attempt for other refusals.",
        drawn: "I"
      },
      {
        id: "PMS-4",
        text: "Charges belong to the stay. The room is looked up when posting, and a room move rewrites the folio rooms.",
        from: "Test value",
        status: "Built",
        drawn: "Cases"
      },
      {
        id: "PMS-5",
        text: "Cabana's limits count only charges made through Cabana. A meal posted by a restaurant's own system is not counted.",
        from: "Test value",
        status: "Built",
        drawn: "Cases"
      },
      {
        id: "PMS-6",
        text: "Checkout is done by the front desk. It cannot finish while a charge is pending, failed, in question or unpaid. A ready, uncollected goods order becomes a checklist line and a desk task due in 1 hour, and checkout finishes.",
        from: "Ken",
        status: "Built",
        note: "The design held checkout until goods were collected.",
        drawn: "I, cases"
      },
      {
        id: "PMS-7",
        text: "The PMS is simulated as a folio: up, down or refusing, with the stay's dates, room and status synced. It has no availability or rates.",
        from: "Meeting",
        status: "Partly",
        note: "The real integration needs availability, rates, folio charging and room moves.",
        drawn: "Not drawn"
      },
      {
        id: "PMS-8",
        text: "All times are hotel-local. There is no named time zone.",
        from: "Test value",
        status: "Built",
        drawn: "System rules"
      },
      {
        id: "PMS-9",
        text: "A new charge can be held for a stay that has not started, and the folio room is rewritten when the guest moves.",
        from: "App",
        status: "Built",
        drawn: "I"
      }
    ]
  },
  {
    group: "The pilot and its venues",
    rules: [
      {
        id: "PLT-1",
        text: "The pilot is The Henry Resort Dumaguete, about 50 guests at one time, with a front desk staffed 24 hours.",
        from: "Meeting",
        status: "Partly",
        note: "The scenarios use one guest, Maria in Villa 12. There is no 50-guest or 24-hour desk model.",
        drawn: "Pilot"
      },
      {
        id: "PLT-2",
        text: "Restaurants and cafés, all table reservations: The Dining Room, Si Señor, Popolo Pizzeria, The Red Kitchen, Noelle's Brunch Bar, Coffee Collective.",
        from: "Ken",
        status: "Partly",
        note: "In the scenarios only. The app uses the Manila catalogue.",
        drawn: "E"
      },
      {
        id: "PLT-3",
        text: "Pasalubong comes from Cafe Sans Rival only.",
        from: "Ken",
        status: "Partly",
        note: "In the scenarios only.",
        drawn: "D"
      },
      {
        id: "PLT-4",
        text: "The boat operator, the bike shop and Henry's own activities are simulated, with placeholder names.",
        from: "Test value",
        status: "Partly",
        note: "In the scenarios only.",
        drawn: "B, C"
      },
      {
        id: "PLT-5",
        text: "A few vendors only, so alerts stay under control.",
        from: "Meeting",
        status: "Not built",
        note: "The scenarios have 10 vendors and the app has 22. Alerts are not modelled.",
        drawn: "Pilot"
      },
      {
        id: "PLT-6",
        text: "Every value on this page is a test setting for the simulation. None has been agreed with Henry's.",
        from: "Ken",
        status: "Built",
        drawn: "All"
      }
    ]
  },
  {
    group: "The vendor app",
    rules: [
      {
        id: "VND-1",
        text: "Vendors use a mobile app with loud alerts they cannot mute. Reporting is on a web portal.",
        from: "Meeting",
        status: "Not built",
        note: "No vendor app exists. The vendor is simulated from the prototype controls.",
        drawn: "Pilot"
      },
      {
        id: "VND-2",
        text: "Two roles: the owner sees earnings, receivables and payout. Staff never see money.",
        from: "Meeting",
        status: "Not built",
        note: "Not built.",
        drawn: "Pilot"
      },
      {
        id: "VND-3",
        text: "The dashboard shows what needs action straight away, with no extra click.",
        from: "Meeting",
        status: "Not built",
        note: "Not built.",
        drawn: "Pilot"
      },
      {
        id: "VND-4",
        text: "Bottom navigation is Dashboard, Orders, Chat, Menu.",
        from: "Meeting",
        status: "Not built",
        note: "Not built.",
        drawn: "Chat cards"
      },
      {
        id: "VND-5",
        text: "Either the owner or staff may confirm. The first to tap wins and the actor's name is recorded.",
        from: "Test value",
        status: "Built",
        drawn: "Cases"
      },
      {
        id: "VND-6",
        text: "A vendor can set themselves Away, which stops new requests. A listing with bookings cannot be removed, and a booked slot cannot be blocked.",
        from: "Test value",
        status: "Built",
        drawn: "Cases"
      },
      {
        id: "VND-7",
        text: "Keep it simple: one vendor, one service or product, one owner and staff.",
        from: "Meeting",
        status: "Not built",
        note: "Not built.",
        drawn: "Pilot"
      }
    ]
  },
  {
    group: "The whole app",
    rules: [
      {
        id: "APP-1",
        text: "The app is spelled Cabana, with a C.",
        from: "Ken",
        status: "Built",
        drawn: "All"
      },
      {
        id: "APP-2",
        text: "There are no hover states. Controls look like controls at rest, with only pressed and focus states.",
        from: "Ken",
        status: "Built",
        drawn: "Chat cards"
      },
      {
        id: "APP-3",
        text: "Rooms are assigned on arrival day. There is no room number and no \"held\" card before then.",
        from: "Ken",
        status: "Built",
        drawn: "Cases"
      },
      {
        id: "APP-4",
        text: "The front desk is the main channel. Anything that counts spend reads the bill, not only in-app bookings.",
        from: "Ken",
        status: "Built",
        note: "The pilot ledger counts Cabana charges only, which fits PMS-5.",
        drawn: "Cases"
      },
      {
        id: "APP-5",
        text: "Nothing fails silently. Anything the system cannot settle becomes a desk task with an owner and a due time.",
        from: "Test value",
        status: "Built",
        note: "One gap: a vendor tap that arrives too late is logged and announced, but opens no task.",
        drawn: "System rules"
      },
      {
        id: "APP-6",
        text: "Every action is logged with who did it and when.",
        from: "Test value",
        status: "Partly",
        note: "A desk booking is logged under the guest's name and the staff name sits in an earlier entry. Payment logs carry no actor.",
        drawn: "System rules"
      },
      {
        id: "APP-7",
        text: "After checkout the desk window is 24 hours.",
        from: "Meeting",
        status: "Partly",
        note: "The 24 hour setting exists. Returning to Explore was not checked.",
        drawn: "Not drawn"
      },
      {
        id: "APP-8",
        text: "The pilot runs two data sets. The scenarios use the Dumaguete venues. The app keeps its own demo: Ana in Room 304 at The Henry Manila, with 22 vendors and 58 listings, such as Sakay Rentals and Lakbay Island Tours.",
        from: "App",
        status: "Built",
        drawn: "Pilot"
      },
      {
        id: "APP-9",
        text: "Every pilot action is saved in the browser and replayed on reload. The clock only moves back while nothing is booked.",
        from: "App",
        status: "Built",
        drawn: "Not drawn"
      },
      {
        id: "APP-10",
        text: "Sample bookings can be filled and cleared: a scooter nobody answered, two bicycles confirmed, an island tour waiting, a Poolside Bar table, two coffees held for checkout, and a trainer session booked by desk staff.",
        from: "App",
        status: "Built",
        drawn: "Not drawn"
      },
      {
        id: "APP-11",
        text: "The vendor and the desk are simulated from the Events tab of the prototype controls, with areas for Bookings, Stay, Clock and Problems.",
        from: "App",
        status: "Built",
        drawn: "Chat cards"
      },
      {
        id: "APP-12",
        text: "The desk's task kinds are: over-limit approval, vendor nudge, PMS failure, PMS alert, failed refund, questioned charge, disputed cancel, damage claim, checkout blocker, lapsed reinstate, refund due, batch cancel, uncollected goods, stay conflict, vendor cancel declined. Tasks close themselves when the cause is gone.",
        from: "App",
        status: "Built",
        drawn: "System rules"
      },
      {
        id: "APP-13",
        text: "Icons come only from Hugeicons, through one catalogue. The old icon package is removed.",
        from: "Ken",
        status: "Built",
        note: "Two code comments still mention the old package.",
        drawn: "Chat cards"
      },
      {
        id: "APP-14",
        text: "My Stay shows a status line under every booking in the nine words, with no dots. Pay to confirm leads its day, Awaiting confirmation stays in Upcoming, and Not booked shows its reason as the money line.",
        from: "App",
        status: "Built",
        drawn: "Chat cards"
      },
      {
        id: "APP-15",
        text: "A developer-only switch (?data=worst, off in production) swaps in worst-case data such as very long names, an unbreakable link, an emoji and a dozen unread messages, to test the layout.",
        from: "App",
        status: "Built",
        drawn: "Not drawn"
      }
    ]
  },
  {
    group: "Left out for now",
    rules: [
      {
        id: "LATER-1",
        text: "Loyalty points, tiers and contextual vouchers at checkout. A follow-up phase.",
        from: "Meeting",
        status: "Partly",
        note: "A points discount exists (PAY-14), without tiers or vouchers.",
        drawn: "Not drawn"
      },
      {
        id: "LATER-2",
        text: "Room-to-room chat.",
        from: "Meeting",
        status: "Not built",
        note: "Left out on purpose.",
        drawn: "Later"
      },
      {
        id: "LATER-3",
        text: "Changing a date, instead of cancel and rebook.",
        from: "Test value",
        status: "Not built",
        note: "Left out on purpose.",
        drawn: "G"
      },
      {
        id: "LATER-4",
        text: "Pre-orders and any POS or kitchen display for restaurants.",
        from: "Meeting",
        status: "Not built",
        note: "Left out on purpose.",
        drawn: "E"
      },
      {
        id: "LATER-5",
        text: "Part fees for a late cancellation.",
        from: "Test value",
        status: "Not built",
        note: "Left out on purpose.",
        drawn: "G"
      },
      {
        id: "LATER-6",
        text: "The deposit check.",
        from: "Ken",
        status: "Not built",
        note: "Left out on purpose.",
        drawn: "A"
      },
      {
        id: "LATER-7",
        text: "Airport pickup and delivery logistics for goods.",
        from: "Meeting",
        status: "Not built",
        note: "Left out on purpose.",
        drawn: "D"
      },
      {
        id: "LATER-8",
        text: "Vendor payouts. There is no payout ledger.",
        from: "Test value",
        status: "Not built",
        note: "Left out on purpose.",
        drawn: "Not drawn"
      },
      {
        id: "LATER-9",
        text: "Messaging the vendor before they commit. Clarifications are by phone.",
        from: "Ken",
        status: "Not built",
        note: "Left out on purpose.",
        drawn: "J"
      }
    ]
  }
];

export const KNOWN_GAPS: KnownGap[] = [
  {
    title: "Stale wording in the code",
    text: "One type comment and the plan file still say \"guest, desk and vendor\" and \"three-way thread\". The code is two-party."
  },
  {
    title: "\"Vendor first\" race control",
    text: "It runs the guest's tap first, so the vendor-first branch is never reached."
  },
  {
    title: "Question this charge does nothing",
    text: "On a table no-show and on a booking with no payment the button is shown and has no effect."
  },
  {
    title: "Ready goods have no Cancel",
    text: "A Ready goods card shows no Cancel button, though the engine allows it."
  },
  {
    title: "Long pre-arrival holds",
    text: "A pre-arrival charge held more than 24 hours that then meets a PMS outage fails on its first retry."
  },
  {
    title: "Order cap message",
    text: "It says \"Ask the vendor in chat\" but opens no chat."
  },
  {
    title: "Invariant names",
    text: "The comment at the top of the invariants file uses different names for I3, I4, I5, I7, I8 and I9 than the report does."
  },
  {
    title: "Old icon package in comments",
    text: "Two code comments in the rewards folder still mention Phosphor."
  },
  {
    title: "Room limits switched off",
    text: "The limits are set to no limit in the app, so the over-limit copy and the pay-in-full-or-cancel window cannot be reached on screen."
  }
];
