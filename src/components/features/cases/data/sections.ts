import type { Section } from './types';

export const SECTIONS: Section[] = [
  {
    id: "rules",
    blocks: [
      {
        t: "rules",
        items: [
          {
            title: "Pay one way, never split",
            text: "Each payment is either charged to the room or paid in full through the gateway (GCash, Maya, card). No deposits, no part payments, no mixing inside one payment. Room is pre-selected. The hotel keeps its share either way."
          },
          {
            title: "The vendor must confirm",
            text: "Nothing is charged to the room, and no card payment is taken, until the vendor accepts. A card is only held until then. A timer stops a request waiting on a vendor forever."
          },
          {
            title: "Every state has a way out",
            text: "Diagrams H and I list every state a booking or payment can be in, and each state names its exits. An action a state does not allow is refused with a clear message."
          },
          {
            title: "Nothing fails silently",
            text: "Anything the system cannot settle becomes a task for the front desk, with an owner and a due time."
          },
          {
            title: "Pilot scope",
            text: "Only what The Henry Resort Dumaguete has on site or nearby: its restaurants and cafés, pasalubong, a boat trip, bikes and its own activities. Restaurants are table reservations with a PDF menu, no POS. Vendors outside Cabana stay call-to-reserve and are not drawn here."
          },
          {
            title: "Mobile for vendors",
            text: "Alerts that cannot be muted, owner and staff roles, staff never see earnings. Not built yet: the vendor is simulated from the prototype controls."
          }
        ]
      },
      {
        t: "legend"
      }
    ],
    title: "Ground rules these flows assume"
  },
  {
    id: "pilot",
    blocks: [
      {
        t: "p",
        text: "Every flow below is set at the pilot property. Venue names come from the resort's own listing and the design review. The two partner vendors and the hotel's own activities are simulated, so they carry placeholder names."
      },
      {
        t: "table",
        kind: "plain",
        head: [
          "Who",
          "What they are",
          "How it works in Cabana",
          "Flow"
        ],
        rows: [
          {
            cells: [
              "The Dining Room, Si Señor, Popolo Pizzeria, The Red Kitchen, Noelle's Brunch Bar, Coffee Collective",
              "Restaurants and cafés on site",
              "Table reservation, free to hold. The booking card carries the PDF menu and chat opens after reserving. No pre-orders, no POS. The bill is settled at the venue, by room or in full there.",
              "E"
            ]
          },
          {
            cells: [
              "Cafe Sans Rival",
              "Pasalubong, on site",
              "Goods order. Sans Rival packs it and sends it to the front desk, which holds it chilled for the guest's departure day.",
              "D"
            ]
          },
          {
            cells: [
              "Apo Island boat trip",
              "Service, simulated partner boat operator [[pill:later:Simulated]]",
              "A slot per trip, about twice a day. Weather can cancel a whole slot. Can also be booked through the front desk chat.",
              "C, F"
            ]
          },
          {
            cells: [
              "Bike rental",
              "Rental, simulated partner bike shop [[pill:later:Simulated]]",
              "Calendar and number of bikes, a QR scan at the shop, extra charges for a late return.",
              "B"
            ]
          },
          {
            cells: [
              "Henry's own activities: yoga, walking tours, diving",
              "Service, the hotel is the vendor [[pill:later:Simulated]]",
              "The same service flow, with hotel staff confirming in the vendor app. Schedules are simulated.",
              "C"
            ]
          },
          {
            cells: [
              "Front desk",
              "The hotel",
              "Staffed 24 hours per the resort listing, so desk tasks always reach someone. About 50 guests at one time per the design review.",
              "All"
            ]
          },
          {
            cells: [
              "Hilom Spa, a scooter, the Poolside Bar, hotel services",
              "In the app only, to stress-test it [[pill:later:Simulated]]",
              "A pay-now spa, a rental with a 2-hour cutoff and a licence check, a hotel outlet that talks in the desk chat, and room-only hotel services.",
              "A, B, C"
            ]
          },
          {
            cells: [
              "Nearby: a seafood grill, a hilot studio, a falls guide, a car hire, a laundry; a café and the market's pasalubong stalls",
              "Around the resort, placeholder names [[pill:later:Simulated]]",
              "The first five are partners, booked in the app: tables, pay per guest, confirm first, per car, or pay the vendor there. The last two are not on Cabana: Call to reserve, with Ask the front desk to call.",
              "E, C, B, J"
            ]
          }
        ]
      }
    ],
    eyebrow: "Pilot property",
    title: "The Henry Resort Dumaguete"
  },
  {
    id: "today",
    blocks: [
      {
        t: "p",
        text: "The pilot is built into the real guest app on the chat branch, not merged. This section says how the app differs from the first design, so the diagrams and rules can be read against it."
      },
      {
        t: "rules",
        items: [
          {
            title: "Two data sets",
            text: "The app and the 80 scenarios now share the pilot property. The demo stay is Ana in Room 304 at The Henry Resort Dumaguete, and its Explore lists only what that resort has: the six restaurants and cafés, Cafe Sans Rival, the Apo Island boat, the bike shop and the resort's own activities, plus extra listings of each kind to stress-test the app: the Hilom spa, a scooter, a self-drive car and a van with driver, Bais dolphin watching, a sunset boat, a food crawl, a museum pass, a cooking class, the Poolside Bar, hotel services, and nearby partners and independents. A stay booked at The Henry Manila gets its own mock catalogue instead; the two never mix."
          },
          {
            title: "No vendor app, no desk app",
            text: "The vendor and the desk are simulated from the Events tab of the prototype controls: Bookings, Stay, Clock and Problems, plus faults for the PMS, the gateway and notifications."
          },
          {
            title: "Confirm first, or instant",
            text: "Rentals and boat or island tours wait for the vendor. Activities, goods and shop items charge as the guest confirms. Tables are confirmed at once."
          },
          {
            title: "Chat opens on commit",
            text: "A vendor chat opens only once the vendor commits. A waiting request has no chat: its card offers Call the vendor, Ask the front desk and Withdraw. Vendors send automatic messages marked Auto-reply, and the hotel's own outlets talk in the front desk chat."
          },
          {
            title: "Nine words for a booking",
            text: "Awaiting confirmation, Pay to confirm, Confirmed, Ready to collect, In progress, Completed, Cancelled, No-show and Not booked, the same on every screen. The engine underneath still has 17 statuses."
          },
          {
            title: "No room-charge limits for now",
            text: "There are no per-order or per-stay limits, so any amount can go on the room. The engine keeps a limit rule and the scenarios test it, but nothing in the app is ever over a limit."
          },
          {
            title: "Disputes",
            text: "The desk opens a read-only sheet of the guest and vendor chat with Waive, Adjust and Uphold. A disputed vendor cancellation stands or is reinstated."
          },
          {
            title: "Saved and testable",
            text: "Every pilot action is saved in the browser and replayed on reload. Sample bookings can be loaded. The 80 scenarios pass and all nine invariants hold."
          }
        ]
      }
    ],
    eyebrow: "On the chat branch, checked 12 Oct",
    title: "What the app does today"
  },
  {
    id: "rulebook",
    eyebrow: "Everything we have set, checked against the app",
    title: "Rulebook",
    blocks: [
      {
        t: "rulebook"
      }
    ]
  },
  {
    id: "a",
    blocks: [
      {
        t: "flow",
        key: "A",
        caption: "The guest picks how to pay, with Charge to room pre-selected. The room path has one check: the service date must fall inside the stay. There are no room-charge limits for now. Paying in full holds the money when the guest books, for a vendor that confirms first. The hold is taken if the vendor accepts, and released if they decline, do not answer or the guest withdraws, so nothing is ever refunded. A room booking made before arrival waits as pending and posts at check-in."
      }
    ],
    eyebrow: "Applies to B to F",
    title: "A · Payment gate"
  },
  {
    id: "backbone",
    blocks: [
      {
        t: "p",
        text: "Rentals, services and goods run the same path: the guest asks, the system checks availability and payment, the vendor confirms inside a timer, the vendor fulfils. The three flows below keep the same lanes and the same steps in the same places, so only the differences stand out. A restaurant table is the fourth type and the simplest: it is confirmed at once and nothing is charged. The table after them lists the differences and the edge cases."
      }
    ],
    title: "One backbone, four types"
  },
  {
    id: "b",
    blocks: [
      {
        t: "flow",
        key: "B",
        caption: "A bike or a boat seat held for dates. The request holds its slot while it waits. The booking stays For confirmation because the vendor decides. Accepted bookings charge the room at once, or wait for the guest's card payment. On the day the vendor scans the guest's QR, or the guest scans the vendor's, as long as the vendor dashboard can trigger it. The simulation uses a 30 minute timer for a service within 24 hours, otherwise 4 hours that count only while the vendor is open and never more than 24 hours, with a reminder at half time. The vendor must give a reason for an extra charge. The guest sees it at once, pays it by room or in full, and can question it in chat, and the desk settles any question before checkout."
      }
    ],
    eyebrow: "Type 1 · Rental",
    title: "B · Rental"
  },
  {
    id: "c",
    blocks: [
      {
        t: "flow",
        key: "C",
        caption: "The Apo Island boat trip and outside guides, such as the Casaroro Falls guide, are confirm-first: the vendor accepts before anything is charged. Henry's own activities, such as yoga or a walking tour, are instant: they charge as the guest confirms and skip the vendor timer. The path is otherwise the same as rental, except that nothing is handed over, so the scan starts the service. Capacity is per slot: the boat runs about twice a day."
      }
    ],
    eyebrow: "Type 2 · Service",
    title: "C · Service"
  },
  {
    id: "d",
    blocks: [
      {
        t: "flow",
        key: "D",
        caption: "Pasalubong, and the lobby shop in the app, are instant: stock is checked and the charge is taken as the guest confirms, so the vendor never accepts or declines. If stock is short the guest is told at once and nothing is charged. The vendor packs the order and sends it to the front desk. The desk marks it ready and holds it chilled, and the guest collects it, or it appears on the desk's checkout list. A short item found later adjusts the charge. Goods have no calendar and no extra-charge branch. Airport pickup is left out."
      }
    ],
    eyebrow: "Type 3 · Goods, instant",
    title: "D · Goods"
  },
  {
    id: "e",
    blocks: [
      {
        t: "flow",
        key: "E",
        caption: "A table at Si Señor, Popolo Pizzeria, The Dining Room, The Red Kitchen, Noelle's Brunch Bar or Coffee Collective. A reservation is free to hold and is confirmed at once for the times and party sizes the venue publishes, so there is no vendor timer and no payment. The booking card carries the PDF menu and opens a chat with the venue. The meal is ordered and settled at the venue through its own system, by room or in full there. Not in phase 1: pre-orders and any POS."
      }
    ],
    eyebrow: "Type 4 · Table reservation",
    title: "E · Table reservation"
  },
  {
    id: "types",
    blocks: [
      {
        t: "p",
        text: "Everything not listed here is the same across the types."
      },
      {
        t: "table",
        kind: "plain",
        head: [
          "",
          "Rental (bike)",
          "Service (boat trip, yoga)",
          "Goods (Sans Rival)",
          "Reservation (restaurants)"
        ],
        rows: [
          {
            cells: [
              "Confirm mode",
              "Vendor confirms first.",
              "Boat and island tours: vendor confirms first. Henry's own activities: instant.",
              "Instant: charged as the guest confirms.",
              "Instant: Reserved at once."
            ]
          },
          {
            cells: [
              "Guest picks",
              "Item, dates and pickup time.",
              "Service, date, time and number of guests.",
              "Cakes, boxes and the day.",
              "Venue, date, time and party size."
            ]
          },
          {
            cells: [
              "Vendor confirms against",
              "Calendar and the number of bikes.",
              "Calendar slot and capacity per slot.",
              "Stock on hand, held in one step.",
              "Published table times and party sizes. Confirmed at once, no tap needed."
            ]
          },
          {
            cells: [
              "Payment",
              "Room on accept, or card held then taken on accept (A).",
              "Tours: room on accept, or card held then taken. Henry's own activities: charged as she confirms (A).",
              "Room or card, charged as she confirms (A).",
              "None in Cabana. The bill is settled at the venue."
            ]
          },
          {
            cells: [
              "Status path",
              "For confirmation, Confirmed, In progress, Completed.",
              "For confirmation, Confirmed, In progress, Completed.",
              "Confirmed, Ready, Collected.",
              "Reserved, Seated or No-show."
            ]
          },
          {
            cells: [
              "On the day",
              "QR scan, handover, return.",
              "QR scan, service delivered.",
              "Packed and sent to the front desk, marked ready, held chilled, handed over.",
              "Seated at the venue. Orders there."
            ]
          },
          {
            cells: [
              "Extra charges",
              "Yes: late return, add-ons, damage.",
              "Yes: add-ons after the service.",
              "None. A short item adjusts the charge instead.",
              "None in Cabana. The bill is the restaurant's."
            ]
          },
          {
            cells: [
              "Edge cases",
              "Late return adds a day. Damage or loss. Bike not at the shop: vendor cancels and the charge is undone.",
              "Guest no-show: vendor marks it and the charge stands. Weather cancels the boat: the vendor cancels the whole slot and every charge is undone. Group size changes.",
              "Ready on the day chosen. Out of stock: refused, nothing charged. A line found short: charge adjusts. Not collected at checkout: a checklist line and a desk task due in 1 hour, and checkout still finishes. Quantity above the cap: refused.",
              "Party above the venue's maximum: message the restaurant. Running late: table held 15 minutes, then released. Venue closes a slot for an event: cancels with a reason. No pre-orders."
            ]
          },
          {
            cells: [
              "Same for all four",
              "Slot, stock or table held while waiting, desk told about a lapse inside 24 hours, one booking record behind every card, one chat with the desk. For the first three: payment gate (A), and for confirm-first listings the confirm timer, reminder at half time, charge only after the vendor accepts, free-cancel window set by the listing (G). Instant types skip the timer and the acceptance.",
              "",
              "",
              ""
            ]
          }
        ]
      }
    ],
    title: "How the four types differ"
  },
  {
    id: "f",
    blocks: [
      {
        t: "flow",
        key: "F",
        caption: "The desk acts as proxy. The guest asks in the front desk chat, the desk asks the boat vendor in its own private chat with the vendor, and the vendor's answer comes back as a booking card the desk attaches to the stay. This is the fallback path, drawn side by side with the direct path in J and K. The guest can also book the vendor directly, which skips the desk's relay and joins at the payment gate. This is the same service flow as C. If the desk books on a request made in person, it records that with the staff name before anything is charged."
      }
    ],
    eyebrow: "Apo Island trip, booked in chat",
    title: "F · Tour through the front desk"
  },
  {
    id: "g",
    blocks: [
      {
        t: "flow",
        key: "G",
        caption: "Phase 1 is cancel only. A change of date means cancel and rebook. Each listing sets its own free-cancel window. Inside it the booking cancels at once, a room charge is undone and a card payment is refunded to the same method. Outside it the vendor accepts or declines. A declined cancellation means the booking stands, with no part fees in phase 1. A vendor can always cancel until the service starts, with a required reason, and everything is undone automatically (see the cases table). Once a service is In progress it can no longer be cancelled, only questioned."
      }
    ],
    eyebrow: "Added for the simulation",
    title: "G · Cancelling a confirmed booking"
  },
  {
    id: "h",
    blocks: [
      {
        t: "flow",
        key: "H",
        caption: "The state map for rentals and services. Red boxes are exits, and each releases the slot and says what happened to the money. A request that is paid by card starts at Awaiting card hold or payment: when the hold is placed it goes to the vendor as Requested, and when the vendor accepts the hold is taken and it is Confirmed in one step. A room booking, or an instant listing, skips that and starts at Requested or Confirmed. A lapsed request can be reinstated by the desk if the slot is still free. Needs desk approval and Pay in full or cancel still exist in the engine but are switched off with the limits. Any action the current state does not allow is refused."
      },
      {
        t: "flow",
        key: "H2",
        caption: "Goods and restaurant tables have their own short paths. Goods are Confirmed as the guest confirms, then Ready when the desk marks them, then Collected. A ready order can still be cancelled in the engine. A table is Reserved at once and is Seated by the venue, or becomes a no-show 15 minutes past its time on its own. A guest or the venue can cancel a reservation any time."
      }
    ],
    eyebrow: "The map that makes every state answerable",
    title: "H · Booking states"
  },
  {
    id: "i",
    blocks: [
      {
        t: "flow",
        key: "I",
        caption: "Money is a separate record from the booking, and every extra charge gets its own. The room path never calls the PMS from a button press: it queues the charge, sends it with a unique reference, and checks the folio for that reference before any retry so nothing posts twice. The guest sees \"Charged to room\" straight away. Checkout cannot finish while a charge is still pending, failed or in question. The card path has its own expiry and refund states, and a failed refund becomes a desk task."
      }
    ],
    eyebrow: "One record per payment",
    title: "I · Payment states"
  },
  {
    id: "chatmodels",
    blocks: [
      {
        t: "p",
        text: "Every chat has two parties, never three. There are three chats: guest with front desk, guest with vendor, and front desk with vendor. The question is what a guest does when they book a vendor. Either they chat with the vendor directly, and the front desk is the fallback (what the pilot has now), or they only ever chat with the front desk, which relays to the vendor. J and K draw the same job both ways: book the Apo Island trip, then ask about a child seat."
      },
      {
        t: "rules",
        items: [
          {
            title: "Guest and front desk",
            text: "The one desk chat in the app. Requests, problems, anything off-app, and the fallback for everything else."
          },
          {
            title: "Guest and vendor",
            text: "Only for a booking on Cabana, opened when the vendor commits (accepts, or the guest books an instant listing or a table), closed 48 hours after the service. The vendor sees first name and room. The desk can read it, read only, while a dispute is open."
          },
          {
            title: "Front desk and vendor",
            text: "Private. The desk relays a booking it made, and the two sort out anything the guest should not see."
          }
        ]
      }
    ],
    eyebrow: "Chat · one to one",
    title: "Chat: direct to the vendor, or only through the front desk"
  },
  {
    id: "j",
    blocks: [
      {
        t: "flow",
        key: "J",
        caption: "A vendor on Cabana gets the request. While it waits there is no chat: the guest can call the vendor, add a note to the request or ask the front desk. Once the vendor accepts, a chat with them opens, one to one, and the front desk is not in it. If the vendor does not answer in time, or the request is too close, the guest is told and can pick another time or message the front desk. In the app this hand-off is manual: a closed vendor chat sends the guest's message to the desk chat, and the desk can book by hand and put the card in the desk chat. Every nearby listing in the app is already connected, so a vendor outside Cabana is not modelled. Questions about a booking made by the desk go to the desk. Everything else stays between guest and vendor, and the desk reads that chat only while a dispute is open (flow M)."
      }
    ],
    eyebrow: "What the pilot has now",
    title: "J · Direct chat, front desk as the fallback"
  },
  {
    id: "k",
    blocks: [
      {
        t: "flow",
        key: "K",
        caption: "The guest has one chat, with the front desk, for everything. The request arrives there as a card. The desk messages the vendor in their private chat, relays the answer, and attaches the booking card. A question about the trip makes the same loop: guest to desk, desk to vendor, vendor to desk, desk to guest. Nothing reaches the vendor without the desk touching it."
      }
    ],
    eyebrow: "The alternative",
    title: "K · Front desk only"
  },
  {
    id: "scale",
    blocks: [
      {
        t: "p",
        text: "Assumptions, all test values: a stay is 3 nights, a guest books 3 vendors per stay, each booking is 6 messages (3 each way), and in the direct model the desk steps in on 1 booking in 10 and types 2 messages. In front desk only, the desk reads and retypes every one of the 6, which is 6 typed per booking."
      },
      {
        t: "table",
        kind: "plain",
        head: [
          "",
          "Direct, desk as fallback (J)",
          "Front desk only (K)"
        ],
        rows: [
          {
            cells: [
              "Who the guest talks to",
              "The vendor for a booking, the desk for everything else.",
              "The desk for everything."
            ]
          },
          {
            cells: [
              "Hops for a question to a vendor",
              "1 each way.",
              "2 each way, through the desk."
            ]
          },
          {
            cells: [
              "Messages per booking",
              "6 in total, none typed by the desk, on average 0.2 typed.",
              "12 in total, 6 typed by the desk."
            ]
          },
          {
            cells: [
              "Confirm timer",
              "Runs from the request. 30 minutes is realistic.",
              "The desk's relay time comes out of the same 30 minutes."
            ]
          },
          {
            cells: [
              "Hotel control",
              "Payment stays in the app, so the hotel keeps its share. The desk sees the booking and its tasks, and can read the vendor chat once a dispute is open.",
              "Full control. The desk sees everything and can steer the guest."
            ]
          },
          {
            cells: [
              "Vendor not on Cabana",
              "Falls back to the desk automatically.",
              "Same as every other vendor."
            ]
          },
          {
            cells: [
              "If the desk is busy",
              "Only fallbacks and escalations wait.",
              "Every vendor message waits."
            ]
          },
          {
            cells: [
              "If the vendor is a one-person boat operator",
              "Talks to every guest who booked that day.",
              "Talks to a few desks."
            ]
          },
          {
            cells: [
              "Risk",
              "Guest and vendor take the deal off the app.",
              "The desk becomes the bottleneck and a single point of failure."
            ]
          }
        ]
      },
      {
        t: "h3",
        text: "How much the desk types as a property gets busier"
      },
      {
        t: "scale-chart",
        caption: "At Henry's pilot size, front desk only means about 300 relayed messages a day, roughly 12 an hour across 24 hours. That is workable. At 400 guests it is 2,400 a day, which needs a concierge team. Direct chat stays under 100 at any of these sizes because the desk only steps in for fallbacks. The line is straight, so the desk load is the same per guest at any size, and what changes is whether one desk can carry it."
      },
      {
        t: "scale-table"
      },
      {
        t: "p",
        text: "Network assumes 13 properties of 50 guests each, as in the design review. Platform assumes 100 properties of 100 guests, with 15 vendors each. Open chats counts two active vendor chats per guest in direct mode, plus one private desk and vendor chat per vendor at each property.",
        note: true
      }
    ],
    title: "Side by side, and how it grows"
  },
  {
    id: "l",
    blocks: [
      {
        t: "flow",
        key: "L",
        caption: "The choice is a setting on each vendor, not a rebuild. A vendor off Cabana always goes through the desk. A hotel can set any vendor to via desk, for example a premium concierge hotel that wants to handle every trip. A vendor that keeps missing the timer is flagged, and the request in hand goes to the desk. The guest app does not change: the guest still sees a booking card, and the chat header names whoever they are talking to."
      }
    ],
    eyebrow: "How both live together",
    title: "L · Route each vendor, not the whole app"
  },
  {
    id: "m",
    blocks: [
      {
        t: "flow",
        key: "M",
        caption: "A dispute can start from a guest questioning a charge, contesting a no-show or disputing a vendor cancellation, or from a vendor disputing damage. A damage claim is added but held In question until the desk decides. A disputed vendor cancellation ends with the booking standing, or reinstated as a fresh request. The booking goes In question, which blocks checkout, and a task opens for the desk. The desk may open the guest and vendor chat but only to read it. Both people get a notice in their own chats, the desk never writes in that chat, and every open is logged. The desk talks to each side in its own chat with them, decides, and the access closes."
      }
    ],
    eyebrow: "The one time the desk reads a vendor chat",
    title: "M · Disputes"
  },
  {
    id: "considerations",
    blocks: [
      {
        t: "table",
        kind: "plain",
        head: [
          "What to watch",
          "Why it matters",
          "What to do as it grows"
        ],
        rows: [
          {
            cells: [
              "Desk workload",
              "Front desk only grows with every guest and every booking. Direct grows only with fallbacks.",
              "Keep direct as the default. Give each desk chat an owner, a shift queue and handover notes before moving any vendor to via desk."
            ]
          },
          {
            cells: [
              "Speed",
              "Each hop adds minutes. A 30 minute confirm timer cannot absorb a slow relay.",
              "For via-desk vendors, start the timer when the desk relays, or give them a longer timer."
            ]
          },
          {
            cells: [
              "Leakage",
              "Direct chat lets a guest and vendor arrange things outside the app and skip the hotel's share.",
              "Keep payment inside the app, charge to room by default, hide phone numbers, close the chat 48 hours after the service."
            ]
          },
          {
            cells: [
              "Disputes and records",
              "The desk is not in the guest and vendor chat, so it cannot otherwise see what was promised.",
              "Decided: the desk can read that chat, read only, while a dispute is open. Both sides are told and each open is logged. Treat booking events as the main record and messages as support."
            ]
          },
          {
            cells: [
              "Vendor overload",
              "A boat operator serving several hotels can have 16 guest chats a day in direct mode.",
              "Group chats by trip and hotel, add canned replies and quiet hours, show the hotel name and room on every chat. Move overloaded vendors to via desk."
            ]
          },
          {
            cells: [
              "Vendors off the app",
              "The share of vendors on Cabana decides how often the fallback fires.",
              "Count fallbacks per vendor. A vendor that falls back often is a candidate to onboard or to set via desk."
            ]
          },
          {
            cells: [
              "Many properties",
              "The same vendor sees guests from several hotels, and each hotel has its own desk.",
              "Label each chat with hotel, room and trip. Route fallbacks to the right hotel's desk, not a shared one."
            ]
          },
          {
            cells: [
              "Language",
              "Guests write in English, vendors in Bisaya or Tagalog. In direct mode nobody translates.",
              "Add translation in the vendor chat once properties span regions."
            ]
          },
          {
            cells: [
              "Privacy and retention",
              "More direct chats means more guest details held by vendors.",
              "Vendors see first name and room only. Close and archive chats after 48 hours, and set a retention period."
            ]
          },
          {
            cells: [
              "Notifications",
              "Vendor alerts scale with guests, and alert fatigue makes vendors mute the app.",
              "Alerts for requests stay loud and unmuteable. Messages inside a booking batch quietly."
            ]
          }
        ]
      },
      {
        t: "rules",
        items: [
          {
            title: "Reasoning for direct first",
            text: "At pilot size the desk is not the problem, speed and vendor responsiveness are. Direct chat answers a question in one hop, and the front desk fallback guarantees a guest is never stuck."
          },
          {
            title: "Reasoning for one to one",
            text: "Two parties per chat keeps ownership clear, keeps private desk and vendor notes private, and works like any messaging app. The booking card carries the shared state instead."
          },
          {
            title: "Recommendation",
            text: "Ship direct with front desk fallback. Build the per-vendor switch in L so a property can move any vendor to via desk later without changing the guest app."
          }
        ]
      }
    ],
    title: "Considerations when the scale changes"
  },
  {
    id: "system",
    blocks: [
      {
        t: "rules",
        items: [
          {
            title: "One booking record, many views",
            text: "Cards in the guest, desk and vendor threads are windows onto the same record, never copies. A card cannot show an old state."
          },
          {
            title: "The first action wins",
            text: "Every action is checked against the booking's state at the moment it arrives. The loser sees what happened and who acted first."
          },
          {
            title: "Slots are held, not assumed",
            text: "A request takes a hold on its slot or stock in one atomic step, so two guests can never take the last bike. Every exit releases the hold."
          },
          {
            title: "Timers run on the server",
            text: "Reminders and lapses fire even when no app is open. A timer that falls outside the vendor's opening hours pauses until they open, capped at 24 hours."
          },
          {
            title: "Money has its own ledger",
            text: "Each charge has a unique reference, a payment mode and a state (diagram I)."
          },
          {
            title: "Safe posting to the PMS",
            text: "Charges go out through a queue with retries. Before retrying, the system looks for the charge's reference on the folio. If the room is wrong it refreshes the guest's current room and tries once more."
          },
          {
            title: "Charges follow the stay, not the room",
            text: "A room move does not strand a charge. The room is looked up at posting time and open bookings show the new room to vendors."
          },
          {
            title: "Two channels for anything critical",
            text: "Accepted, lapsed, cancelled by the vendor and payment due go as a push and, if not opened in 10 minutes, as an SMS. A vendor who has not opened a request gets an SMS after 5 minutes."
          },
          {
            title: "Offline is queued, the server decides",
            text: "A vendor's action taken without signal is stored with its time. It counts if it was made before the deadline, allowing 5 minutes of grace, and the slot is still held."
          },
          {
            title: "The desk has one queue",
            text: "Vendor nudges, PMS failures, failed refunds, questioned charges and checkout blockers all land in one list, each with an owner and a due time."
          },
          {
            title: "Chats are one to one",
            text: "Guest with front desk, guest with vendor, front desk with vendor. Never a chat with all three. The one exception is a read-only look: the desk can read a guest and vendor chat while a dispute is open. The booking card is the one shared thing: it shows the same state to everyone."
          },
          {
            title: "Everything is logged",
            text: "Who did what and when, including desk actions on a guest's behalf and the chat message or staff note that counts as the guest's request."
          },
          {
            title: "Hotel time",
            text: "All timers, windows and displayed times use the property's time zone."
          }
        ]
      }
    ],
    title: "System rules that back the diagrams"
  },
  {
    id: "cases",
    blocks: [
      {
        t: "p",
        text: "What the system does when something unusual happens, and who is told. Most answers use the rules and states above. Times are the settings used in the simulation."
      },
      {
        t: "table",
        kind: "cases",
        head: [
          "Situation",
          "What the system does",
          "Who is told"
        ],
        rows: [
          {
            group: "Timing and races"
          },
          {
            cells: [
              "Guest withdraws at the same moment the vendor accepts",
              "The first action recorded wins. If the vendor won, the withdraw is treated as a cancel under the free-cancel rules.",
              "Both see the result and which came first."
            ]
          },
          {
            cells: [
              "Vendor taps Confirm after the request lapsed",
              "Refused. Nothing changes. The desk can reinstate the request if the slot is still free, and the request goes back to the vendor.",
              "Vendor: \"This request lapsed 2 minutes ago. Ask the desk.\" Desk gets a task."
            ]
          },
          {
            cells: [
              "Same request sent twice (double tap, bad signal)",
              "One active request per guest, listing and slot. The second is ignored.",
              "Guest sees one card."
            ]
          },
          {
            cells: [
              "Two guests want the last slot",
              "The first request takes the hold. The second request is refused at once.",
              "Second guest: \"Just booked. Pick another time.\""
            ]
          },
          {
            cells: [
              "Vendor does not open a request",
              "Push at once, SMS after 5 minutes, reminder at half time, lapse at the end of the timer.",
              "Vendor by push and SMS. Desk gets a nudge task when the desk made the booking."
            ]
          },
          {
            cells: [
              "Vendor has no signal when the timer ends",
              "The vendor's phone stores the tap with its time. On reconnect it counts if made before the deadline plus 5 minutes and the slot is still held. Otherwise it lapses as normal.",
              "Vendor sees the outcome on reconnect."
            ]
          },
          {
            cells: [
              "Request comes in while the vendor is closed",
              "The timer pauses outside opening hours and resumes when they open, never longer than 24 hours.",
              "Guest sees when to expect an answer."
            ]
          },
          {
            cells: [
              "The service start time is near and no answer yet",
              "The request lapses at the earlier of timer end or 15 minutes before the start.",
              "Guest told. Desk told when the service is within 24 hours."
            ]
          },
          {
            group: "Payment"
          },
          {
            cells: [
              "Guest wants part by room and part by card",
              "Not offered. Each payment is one way only.",
              "Guest sees two options only."
            ]
          },
          {
            cells: [
              "Service date falls outside the stay",
              "Charge to room is not offered. Only full payment.",
              "Guest sees why."
            ]
          },
          {
            cells: [
              "Room booking made before arrival",
              "Held as pending and posted at check-in. If the stay is cancelled or a no-show, the booking cancels and the slot is released.",
              "Guest and vendor told when it cancels."
            ]
          },
          {
            cells: [
              "Card hold or payment fails",
              "Up to 3 tries inside the 15 minute window, then the payment expires and the slot is released. Nothing was taken.",
              "Guest told. Vendor told the slot is free again."
            ]
          },
          {
            cells: [
              "Guest does not finish the card hold or payment",
              "The 15 minute window closes, the payment expires and the slot is released. The guest can send a new request.",
              "Guest and vendor told."
            ]
          },
          {
            cells: [
              "Gateway took the payment but the app never heard",
              "A check every 2 minutes asks the gateway about open payments. Found paid and the slot is still held: confirmed. Slot already released: automatic refund.",
              "Guest told either way."
            ]
          },
          {
            cells: [
              "Guest pays twice",
              "The second payment is refunded automatically.",
              "Guest told."
            ]
          },
          {
            cells: [
              "A refund fails",
              "The payment is marked refund failed and a task goes to the desk with the amount and method.",
              "Guest told the hotel is handling it. Desk gets a task."
            ]
          },
          {
            cells: [
              "Extra charge on the day",
              "Each extra charge is its own payment. The guest pays it by room or in full, with their booking's method pre-selected. Anything unpaid stays open and blocks checkout.",
              "Guest sees it at once. Desk sees it on the checkout screen."
            ]
          },
          {
            cells: [
              "Guest questions an extra charge",
              "The charge stays but is marked In question, which blocks checkout. The desk reads the guest and vendor chat (read only), then upholds it, adjusts it (old one voided, new one posted) or waives it.",
              "Guest and vendor see the notice and the outcome."
            ]
          },
          {
            cells: [
              "Vendor enters the wrong amount",
              "The vendor can correct it within 1 hour: the old charge is voided and a new one posted, both visible. After that only the desk can.",
              "Guest sees both lines."
            ]
          },
          {
            group: "PMS and the bill"
          },
          {
            cells: [
              "PMS is unreachable when posting",
              "The charge stays pending in Cabana's ledger and retries every 5 minutes for 24 hours. Booking and guest are unaffected.",
              "Desk alerted at 30 minutes. Guest sees \"Charged to room\" as normal."
            ]
          },
          {
            cells: [
              "PMS rejects the charge (wrong room, folio closed)",
              "The guest's current room is looked up and the charge tried once more. Still refused: a desk task to post by hand or collect.",
              "Desk only."
            ]
          },
          {
            cells: [
              "A retry could post the charge twice",
              "Each charge has a unique reference. Before any retry the folio is checked for it. Found means posted.",
              "Nobody. This is silent."
            ]
          },
          {
            cells: [
              "Guest moves to another room",
              "Charges belong to the stay. The room is looked up when posting. Charges already posted move with the folio in the PMS. If the PMS gives no move signal, the next posting attempt or the desk's sync refreshes the room.",
              "Vendors see the new room on open bookings."
            ]
          },
          {
            cells: [
              "Cancel after posting, before checkout",
              "A reversal is sent to the PMS. If refused, a desk task.",
              "Guest told it is undone. Desk gets a task only on refusal."
            ]
          },
          {
            cells: [
              "Cancel after checkout",
              "Not possible in the app. The charge is marked Refund due and the desk settles it with the guest.",
              "Desk."
            ]
          },
          {
            cells: [
              "Guest checks out with open items",
              "The checkout screen lists any pending, failed or questioned charge and any unpaid extra. The desk must post, void or collect each one first.",
              "Desk."
            ]
          },
          {
            group: "Cancellations"
          },
          {
            cells: [
              "Guest cancels inside the free window",
              "Slot released. Room charge undone, or card refunded to the same method.",
              "Guest, vendor and desk see it."
            ]
          },
          {
            cells: [
              "Guest cancels outside the window",
              "The vendor accepts or declines. Declined means the booking stands and the desk can step in. No part fees in phase 1.",
              "Guest and desk see the answer."
            ]
          },
          {
            cells: [
              "Vendor cancels (weather, breakdown, double booked)",
              "Always allowed until the service starts, with a required reason. Everything is undone automatically and the guest is offered a rebook.",
              "Guest by push and SMS. Desk always."
            ]
          },
          {
            cells: [
              "A whole slot is cancelled (boat cannot sail)",
              "One action, Cancel all for this slot, cancels every booking with the same reason.",
              "Desk sees the batch. Each guest is told."
            ]
          },
          {
            cells: [
              "Guest does not show up",
              "The vendor marks a no-show 30 minutes after the start. The charge stands.",
              "Desk told. Guest can question it through the desk."
            ]
          },
          {
            cells: [
              "Guest wants to change the date",
              "Not supported in phase 1. Cancel and rebook, which is free inside the window.",
              "Guest sees the option."
            ]
          },
          {
            cells: [
              "Stay is shortened or cancelled",
              "The desk sees bookings outside the new dates and the guest is asked to pay in full or cancel. Unresolved 24 hours before the service means the desk handles it. A cancelled stay cancels every room booking.",
              "Guest, desk and affected vendors."
            ]
          },
          {
            group: "Vendor and listing"
          },
          {
            cells: [
              "Vendor sets themselves Away",
              "The listing stops taking new requests. Open bookings are unaffected.",
              "Guests see it as unavailable."
            ]
          },
          {
            cells: [
              "Vendor wants to remove a listing with bookings",
              "Blocked until those bookings are cancelled through the vendor cancel route.",
              "Vendor sees the list."
            ]
          },
          {
            cells: [
              "Vendor blocks a slot that is already booked",
              "Blocked. The bookings are shown so the vendor can cancel them first.",
              "Vendor."
            ]
          },
          {
            cells: [
              "Owner and staff act at once",
              "Either may confirm. The first wins and the owner sees who did it.",
              "Owner."
            ]
          },
          {
            cells: [
              "No signal at the shop when the QR is scanned",
              "The QR is signed and checked against today's and tomorrow's bookings cached on the vendor's phone when it was last online. With no cache, look the guest up by name and room, or call the desk.",
              "Vendor."
            ]
          },
          {
            cells: [
              "Guest cannot show a QR (dead phone)",
              "The vendor finds the booking by guest name and room.",
              "Nobody."
            ]
          },
          {
            group: "Restaurants and pasalubong at Henry's"
          },
          {
            cells: [
              "Party is larger than the restaurant's maximum",
              "The form stops at the maximum and offers Message the restaurant.",
              "Restaurant, by chat."
            ]
          },
          {
            cells: [
              "Guest is running late for a table",
              "The Running late quick action tells the restaurant. The table is held 15 minutes past the time, then marked a no-show. Nothing is ever charged for a reservation.",
              "Restaurant."
            ]
          },
          {
            cells: [
              "Guest cancels a reservation",
              "Free at any time. The table is released.",
              "Restaurant."
            ]
          },
          {
            cells: [
              "A restaurant closes a slot that has reservations (private event)",
              "The restaurant cancels each one with a reason, like any vendor cancel.",
              "Each guest, and the desk."
            ]
          },
          {
            cells: [
              "Guest wants to order food ahead",
              "Not in phase 1. The PDF menu is on the booking card and the guest can ask in chat.",
              "Nobody."
            ]
          },
          {
            cells: [
              "A meal is charged to the room at the restaurant",
              "The venue posts it to the folio through its own system. A meal posted by the venue's own system is outside Cabana's ledger.",
              "Desk sees it on the bill."
            ]
          },
          {
            cells: [
              "Pasalubong ordered days before departure",
              "The ready date is the departure day. Sans Rival packs for that day and the desk holds it chilled. The card says \"Ready for your departure day\".",
              "Guest and desk."
            ]
          },
          {
            cells: [
              "Guest checks out without collecting pasalubong",
              "It is on the desk's checkout checklist. The desk hands it over at checkout.",
              "Desk and guest."
            ]
          },
          {
            cells: [
              "Order is bigger than the vendor's cap",
              "Quantity is capped on the listing. Above the cap the vendor is asked in chat.",
              "Vendor."
            ]
          },
          {
            group: "Disputes"
          },
          {
            cells: [
              "A dispute is raised (guest questions a charge or contests a no-show, or a vendor disputes damage)",
              "The booking or charge is marked In question and a desk task opens. The desk can open the guest and vendor chat, read only. Both are told in their chats that the desk read it. The desk cannot write there. It asks each side in its own chat with them. Access ends when the desk decides, and every open is logged.",
              "Guest and vendor see the notice. Desk."
            ]
          },
          {
            cells: [
              "The desk tries to read a chat with no dispute open",
              "Refused. The desk sees the booking state and its tasks only.",
              "Nobody."
            ]
          },
          {
            group: "Chat and cards"
          },
          {
            cells: [
              "The guest wants to ask the vendor something while the request waits",
              "There is no chat yet. The guest can call the vendor, whose number is on the listing and the booking, add a note to the request, or ask the front desk.",
              "Nobody."
            ]
          },
          {
            cells: [
              "A request is withdrawn, declined or lapses",
              "No chat was ever opened, so there is nothing to close or archive.",
              "Nobody."
            ]
          },
          {
            cells: [
              "The same booking shows in several threads",
              "Every card reads the one booking record, so all show the same state.",
              "Nobody."
            ]
          },
          {
            cells: [
              "A vendor chat closes 48 hours after the service",
              "Cards stay visible. Actions follow the booking's state, not the thread. A question after closing goes to the desk thread.",
              "Guest sees where to ask."
            ]
          },
          {
            cells: [
              "Vendor types \"ok\" instead of tapping Confirm",
              "It is only a message. Only the buttons change a status. The card reminds the vendor to tap Confirm.",
              "Vendor."
            ]
          },
          {
            cells: [
              "The desk books for a guest who asked in person",
              "The desk records that the guest asked, with the staff name, before anything is charged. The guest sees the card in the thread as normal.",
              "Guest."
            ]
          },
          {
            cells: [
              "Guest disputes a desk-booked charge",
              "Same route as any question. The chat message or staff note stays on the booking as the guest's request.",
              "Desk."
            ]
          },
          {
            cells: [
              "Guest has notifications off",
              "Critical updates also go by SMS if not opened in 10 minutes. The thread list shows an unread badge.",
              "Guest."
            ]
          }
        ]
      }
    ],
    title: "Every case, one answer"
  },
  {
    id: "chat",
    blocks: [
      {
        t: "p",
        text: "Sir asked for this in table form. \"Decided\" rows are fixed for the simulation. \"Deferred\" rows are left out of phase 1."
      },
      {
        t: "table",
        kind: "plain",
        head: [
          "Channel",
          "Opens when",
          "Who starts it",
          "Can carry a card",
          "Status"
        ],
        rows: [
          {
            cells: [
              "Guest and front desk",
              "From a confirmed booking. One thread for the whole stay, same screen from every entry point.",
              "Either side",
              "Yes. Service, tour and order cards. The desk can attach a booking and charge it to the room.",
              "[[pill:decided:Decided]]"
            ]
          },
          {
            cells: [
              "Front desk and vendor",
              "Opens when the desk books for a guest or either side needs the other. Private to the two of them. Used for relaying a booking, notes and pricing.",
              "Desk or vendor",
              "Yes. Guest, room, date and pax go out. Time and price come back.",
              "[[pill:decided:Decided]]"
            ]
          },
          {
            cells: [
              "Guest and vendor (booking chat)",
              "Opens only when the vendor commits: when a confirm-first vendor accepts, and as the guest books for instant listings and tables. A request that is withdrawn, declined or lapses never gets a chat. It stays open 48 hours after the service. One to one: only the guest and the vendor. The vendor sees the guest's first name. The desk does not take part, and can read it read only while a dispute is open (flow M). Before the vendor commits the guest can add a note, ask the desk or call the vendor.",
              "Guest or vendor",
              "Yes. The one booking card, in the same state everywhere.",
              "[[pill:decided:Decided]]"
            ]
          },
          {
            cells: [
              "Guest and restaurant",
              "Si Señor, Popolo Pizzeria, The Dining Room, The Red Kitchen, Noelle's Brunch Bar and Coffee Collective. After a table is reserved. The menu is a PDF. No orders and no POS. Chat replaces WhatsApp and Viber.",
              "Guest",
              "Reservation only.",
              "[[pill:decided:Decided]]"
            ]
          },
          {
            cells: [
              "Room to room",
              "Not in phase 1. If built later, the other room has to accept first, so nobody can guess who is in Room 204.",
              "Guest",
              "No.",
              "[[pill:later:Deferred]]"
            ]
          }
        ]
      }
    ],
    title: "Who can chat with whom, and when"
  },
  {
    id: "situations",
    blocks: [
      {
        t: "p",
        text: "One row per trigger. Read across to see what the guest, the desk, the vendor and the system each do."
      },
      {
        t: "table",
        kind: "plain",
        head: [
          "Situation",
          "Guest app",
          "Front desk",
          "Vendor app",
          "Cabana + PMS"
        ],
        rows: [
          {
            cells: [
              "Bike rental or Apo Island trip, paid by room",
              "For confirmation, then Confirmed with a QR in My Stay.",
              "Sees the booking on the stay. Nothing to do.",
              "Alert and a request in the queue. Confirm or decline.",
              "Holds the slot, starts the timer, charges the room once accepted."
            ]
          },
          {
            cells: [
              "Bike rental or Apo Island trip, paid in full",
              "Money held at booking, then Confirmed when the vendor accepts.",
              "Sees the booking on the stay.",
              "Same request. Accepting takes the hold.",
              "Holds the slot and the money. Takes the hold on accept, releases it if not."
            ]
          },
          {
            cells: [
              "Tour asked through the desk",
              "Replies in chat, then a booking card.",
              "Messages the vendor, then attaches the booking.",
              "Message from the desk with guest, room, date and pax.",
              "Payment check, then posts to the folio or sends a pay link."
            ]
          },
          {
            cells: [
              "Pasalubong order (Cafe Sans Rival)",
              "Confirmed, with the day it is ready.",
              "Marks it ready, holds it chilled and hands it over. Collects any left at checkout.",
              "Packs and sends to the desk. Marks a short item.",
              "Checks stock. Charges as she confirms."
            ]
          },
          {
            cells: [
              "Table reservation (Si Señor, Popolo Pizzeria, The Dining Room, The Red Kitchen and others)",
              "Reserved at once. Booking card with the PDF menu, and a chat with the restaurant.",
              "Nothing, unless the guest asks.",
              "Restaurant sees the reservation and replies in chat. Marks seated or no-show.",
              "Holds the table. No payment taken. The restaurant settles in its own system or charges the room."
            ]
          },
          {
            cells: [
              "Vendor does not answer in time",
              "Not confirmed. Picks another time.",
              "Alerted when the service is within 24 hours, or when the desk made the booking.",
              "Reminder at half time, then the request expires.",
              "Releases the slot. Nothing is charged."
            ]
          },
          {
            cells: [
              "Extra charge on the day",
              "Sees the charge at once, pays by room or in full, can question it in chat.",
              "Settles any question before checkout.",
              "Enters amount, a required reason, and how it is paid.",
              "Posts to the folio or opens payment."
            ]
          },
          {
            cells: [
              "Guest cancels a confirmed booking",
              "Taps Cancel on the booking card, or asks the desk.",
              "Can cancel for the guest from the chat.",
              "Inside the free-cancel window nothing to do. Outside it, accepts or declines. The slot reopens.",
              "Undoes an unsettled room charge, or refunds the gateway payment."
            ]
          },
          {
            cells: [
              "Vendor cancels",
              "Told by push and SMS, with the reason and a rebook offer.",
              "Always told.",
              "Gives a required reason. One action can cancel a whole slot.",
              "Undoes every charge and refunds every payment automatically."
            ]
          }
        ]
      }
    ],
    title: "What each side sees in each situation"
  },
  {
    id: "open",
    blocks: [
      {
        t: "p",
        text: "Every item below is fixed so the app can be stress-tested. The numbers are test values, not agreed with Henry's, and can be changed in one place."
      },
      {
        t: "cards",
        items: [
          {
            title: "Who is on the vendor app",
            pill: "decided",
            pillText: "Decided",
            lines: [
              "Restaurants and cafés: The Dining Room, Si Señor, Popolo Pizzeria, The Red Kitchen, Noelle's Brunch Bar, Coffee Collective. Pasalubong: Cafe Sans Rival. Services and rentals: a simulated partner boat operator and a simulated partner bike shop, plus Henry's own activities.",
              "Few vendors keeps the alerts easy to watch during the test."
            ],
            who: "Fixed for the simulation"
          },
          {
            title: "How payment works",
            pill: "decided",
            pillText: "Decided",
            lines: [
              "Each payment is charged to the room or paid in full through the gateway, never split. Room is pre-selected. For a vendor that confirms first, a card payment is held at booking and taken only if the vendor accepts."
            ],
            who: "Ken, 12 Oct"
          },
          {
            title: "Room-charge limits",
            pill: "decided",
            pillText: "Decided",
            lines: [
              "None for now, per order or per stay. The engine keeps a limit rule and the scenarios test it, with the app switching it off."
            ],
            who: "Ken, 12 Oct"
          },
          {
            title: "Deposit check",
            pill: "decided",
            pillText: "Decided",
            lines: [
              "Removed for now. Any guest with a stay can charge to room. It can come back later as a check in flow A."
            ],
            who: "Ken, 6 Oct"
          },
          {
            title: "Vendor confirm timer",
            pill: "decided",
            pillText: "Decided",
            lines: [
              "30 minutes for a service within 24 hours. Otherwise 4 hours that count only while the vendor is open, never more than 24 hours. A reminder at half time, and an SMS if the request has not been opened after 5 minutes.",
              "A boat operator at sea cannot answer fast, and a same-day guest cannot wait long."
            ],
            who: "Simulation setting"
          },
          {
            title: "Card payment window",
            pill: "decided",
            pillText: "Decided",
            lines: [
              "15 minutes after the vendor accepts, up to 3 tries. The slot stays held until it expires.",
              "Paying after acceptance means there is nothing to refund when a vendor declines or does not answer."
            ],
            who: "Simulation setting"
          },
          {
            title: "Extra charges on the day",
            pill: "decided",
            pillText: "Decided",
            lines: [
              "The vendor posts it with a required reason and can correct it within 1 hour. The guest pays by room or in full and can question it. A charge in question blocks checkout until the desk decides.",
              "The vendor is not blocked at the counter, and checkout is staff-driven anyway."
            ],
            who: "Simulation setting"
          },
          {
            title: "Desk reads on disputes",
            pill: "decided",
            pillText: "Decided",
            lines: [
              "While a dispute is open the desk can read the guest and vendor chat, read only. Both sides are told in their chats, each open is logged, and the desk never writes in it. Access ends when the desk decides.",
              "The desk can settle a dispute on what was actually said without joining the chat."
            ],
            who: "Ken, 8 Oct"
          },
          {
            title: "Chats are one to one",
            pill: "decided",
            pillText: "Decided",
            lines: [
              "Guest with front desk, guest with vendor, front desk with vendor. Never all three in one chat. When a vendor on Cabana has committed to a booking, the guest chats with them. Before that the guest can call the vendor. If the vendor is not on Cabana, or does not answer, the fallback is always the front desk chat.",
              "Each chat has two parties, like any messaging app, and the desk is always the fallback."
            ],
            who: "Ken, 8 Oct"
          },
          {
            title: "Cancellations and changes",
            pill: "decided",
            pillText: "Decided",
            lines: [
              "Phase 1 is cancel only. Each listing sets a free-cancel window. Outside it the vendor accepts or declines, with no part fees. A vendor can always cancel with a reason until the service starts. A no-show is marked 30 minutes after the start and the charge stands.",
              "Keeps the first release small. Drawn in flow G and the cases table."
            ],
            who: "Simulation setting"
          },
          {
            title: "Front desk to vendor thread",
            pill: "decided",
            pillText: "Decided",
            lines: [
              "Adopt it as drawn. The desk sees the whole thread. The guest is not in it.",
              "It is the only way the desk can act as proxy in flow F."
            ],
            who: "Simulation setting"
          },
          {
            title: "Room-to-room chat",
            pill: "later",
            pillText: "Deferred",
            lines: [
              "Not in phase 1. If built later, the other room accepts first.",
              "Needs a validation rule that is not designed yet."
            ],
            who: "Left out of phase 1"
          }
        ]
      }
    ],
    title: "Settings for the pilot simulation"
  }
];

export const PAGE_HEADER: { eyebrow: string; title: string; lede: string } = {
  eyebrow: "Pilot simulation · The Henry Resort Dumaguete · For Ken, Claire and the team",
  title: "Cabana tri-party flows",
  lede: "How a request moves between the guest, the front desk and the vendor at The Henry Resort Dumaguete, what state it can be in at every moment, and what happens when something goes wrong. Nothing here changes the app code. Every rule and number here is fixed for the pilot simulation so the app can be stress-tested. None of it has been agreed with Henry's. Payment is the core rule: each payment is paid one way only, charged to the room or paid in full through the gateway."
};
