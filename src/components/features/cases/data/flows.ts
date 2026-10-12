import type { Flow } from './types';

export const FLOWS: Record<string, Flow> = {
  A: {
    label: "Payment gate: charge to room or pay in full, with date, limit and desk approval checks for the room path",
    lanes: [
      "guest",
      "desk",
      "kabana"
    ],
    nodes: [
      {
        id: "A1",
        lane: "guest",
        col: 0,
        text: "Picks how to pay: room, or in full"
      },
      {
        id: "A2",
        lane: "kabana",
        col: 1,
        text: "Paying by room?",
        kind: "dec"
      },
      {
        id: "A7",
        lane: "guest",
        col: 1,
        text: "Vendor first, then pays in full",
        kind: "end"
      },
      {
        id: "A3",
        lane: "kabana",
        col: 2,
        text: "Date inside the stay?",
        kind: "dec"
      },
      {
        id: "A4",
        lane: "kabana",
        col: 3,
        text: "Within order and stay limit?",
        kind: "dec"
      },
      {
        id: "A8",
        lane: "guest",
        col: 3,
        text: "Pays in full instead. To the vendor first",
        kind: "end"
      },
      {
        id: "A5",
        lane: "kabana",
        col: 4,
        text: "To the vendor. Charged to room once accepted",
        kind: "end"
      },
      {
        id: "A6",
        lane: "desk",
        col: 4,
        text: "Approve over-limit order?",
        kind: "dec"
      },
      {
        id: "A9",
        lane: "desk",
        col: 5,
        text: "Guest has 15 min to pay in full or cancel"
      },
      {
        id: "A10",
        lane: "guest",
        col: 5,
        text: "Pays in full, cancels, or it lapses",
        kind: "end"
      }
    ],
    edges: [
      [
        "A1",
        "A2"
      ],
      [
        "A2",
        "A7",
        "No"
      ],
      [
        "A2",
        "A3",
        "Yes"
      ],
      [
        "A3",
        "A4",
        "Yes"
      ],
      [
        "A3",
        "A8",
        "No"
      ],
      [
        "A4",
        "A5",
        "Yes"
      ],
      [
        "A4",
        "A6",
        "No"
      ],
      [
        "A6",
        "A5",
        "Approved"
      ],
      [
        "A6",
        "A9",
        "Declined"
      ],
      [
        "A9",
        "A10"
      ]
    ]
  },
  B: {
    label: "Rental: from request to return, with the extra-charge branch",
    lanes: [
      "guest",
      "desk",
      "kabana",
      "vendor"
    ],
    nodes: [
      {
        id: "B1",
        lane: "guest",
        col: 0,
        text: "Picks bike, dates and pickup time"
      },
      {
        id: "B2",
        lane: "kabana",
        col: 1,
        text: "Checks availability and payment (A). Timer starts"
      },
      {
        id: "B3",
        lane: "vendor",
        col: 2,
        text: "Confirms before timer ends?",
        kind: "dec"
      },
      {
        id: "B4",
        lane: "kabana",
        col: 2,
        text: "Lapses. Nothing charged. Desk told if <24h"
      },
      {
        id: "B5",
        lane: "guest",
        col: 2,
        text: "Told. Picks another time",
        kind: "end"
      },
      {
        id: "B6",
        lane: "kabana",
        col: 3,
        text: "Accepted. Charged to room, or card payment due"
      },
      {
        id: "B7",
        lane: "guest",
        col: 3,
        text: "Confirmed. Shows QR at the shop"
      },
      {
        id: "B8",
        lane: "vendor",
        col: 4,
        text: "Scans QR. Bike handed over. In progress"
      },
      {
        id: "B9",
        lane: "vendor",
        col: 5,
        text: "Extra charge on return?",
        kind: "dec"
      },
      {
        id: "B10",
        lane: "kabana",
        col: 5,
        text: "Completed. Nothing extra on the bill",
        kind: "end"
      },
      {
        id: "B11",
        lane: "vendor",
        col: 6,
        text: "Enters reason and amount"
      },
      {
        id: "B12",
        lane: "kabana",
        col: 6,
        text: "Guest pays by room or in full. Completed"
      },
      {
        id: "B13",
        lane: "guest",
        col: 6,
        text: "Sees the charge, can question it in chat",
        kind: "end"
      }
    ],
    edges: [
      [
        "B1",
        "B2"
      ],
      [
        "B2",
        "B3",
        "alert + reminder"
      ],
      [
        "B3",
        "B4",
        "No"
      ],
      [
        "B4",
        "B5"
      ],
      [
        "B3",
        "B6",
        "Yes"
      ],
      [
        "B6",
        "B7"
      ],
      [
        "B6",
        "B8"
      ],
      [
        "B7",
        "B8",
        "QR"
      ],
      [
        "B8",
        "B9"
      ],
      [
        "B9",
        "B10",
        "No"
      ],
      [
        "B9",
        "B11",
        "Yes"
      ],
      [
        "B11",
        "B12"
      ],
      [
        "B12",
        "B13"
      ]
    ]
  },
  C: {
    label: "Service: from request to delivery, with the extra-charge branch",
    lanes: [
      "guest",
      "desk",
      "kabana",
      "vendor"
    ],
    nodes: [
      {
        id: "C1",
        lane: "guest",
        col: 0,
        text: "Picks service, date, time and guests"
      },
      {
        id: "C2",
        lane: "kabana",
        col: 1,
        text: "Checks calendar and payment (A). Timer starts"
      },
      {
        id: "C3",
        lane: "vendor",
        col: 2,
        text: "Confirms before timer ends?",
        kind: "dec"
      },
      {
        id: "C4",
        lane: "kabana",
        col: 2,
        text: "Lapses. Nothing charged. Desk told if <24h"
      },
      {
        id: "C5",
        lane: "guest",
        col: 2,
        text: "Told. Picks another day",
        kind: "end"
      },
      {
        id: "C6",
        lane: "kabana",
        col: 3,
        text: "Accepted. Charged to room, or card payment due"
      },
      {
        id: "C7",
        lane: "guest",
        col: 3,
        text: "Confirmed. Shows QR to the guide"
      },
      {
        id: "C8",
        lane: "vendor",
        col: 4,
        text: "Scans QR. Service starts. In progress"
      },
      {
        id: "C9",
        lane: "vendor",
        col: 5,
        text: "Extra charge after?",
        kind: "dec"
      },
      {
        id: "C10",
        lane: "kabana",
        col: 5,
        text: "Completed. Nothing extra on the bill",
        kind: "end"
      },
      {
        id: "C11",
        lane: "vendor",
        col: 6,
        text: "Enters reason and amount"
      },
      {
        id: "C12",
        lane: "kabana",
        col: 6,
        text: "Guest pays by room or in full. Completed"
      },
      {
        id: "C13",
        lane: "guest",
        col: 6,
        text: "Sees the charge, can question it in chat",
        kind: "end"
      }
    ],
    edges: [
      [
        "C1",
        "C2"
      ],
      [
        "C2",
        "C3",
        "alert + reminder"
      ],
      [
        "C3",
        "C4",
        "No"
      ],
      [
        "C4",
        "C5"
      ],
      [
        "C3",
        "C6",
        "Yes"
      ],
      [
        "C6",
        "C7"
      ],
      [
        "C6",
        "C8"
      ],
      [
        "C7",
        "C8",
        "QR"
      ],
      [
        "C8",
        "C9"
      ],
      [
        "C9",
        "C10",
        "No"
      ],
      [
        "C9",
        "C11",
        "Yes"
      ],
      [
        "C11",
        "C12"
      ],
      [
        "C12",
        "C13"
      ]
    ]
  },
  D: {
    label: "Goods: charged as the guest confirms, packed by the vendor, held and handed over by the front desk",
    lanes: [
      "guest",
      "desk",
      "kabana",
      "vendor"
    ],
    nodes: [
      {
        id: "D1",
        lane: "guest",
        col: 0,
        text: "Picks items, quantity and the day"
      },
      {
        id: "D2",
        lane: "kabana",
        col: 1,
        text: "Checks stock and payment (A). Charged at once"
      },
      {
        id: "D8",
        lane: "guest",
        col: 1,
        text: "Out of stock. Told right away",
        kind: "end"
      },
      {
        id: "D3",
        lane: "vendor",
        col: 2,
        text: "Packs the order, sends it to the desk"
      },
      {
        id: "D4",
        lane: "desk",
        col: 3,
        text: "Marks it ready. Holds it chilled"
      },
      {
        id: "D5",
        lane: "vendor",
        col: 3,
        text: "Item short. Vendor marks it, charge adjusts",
        kind: "end"
      },
      {
        id: "D6",
        lane: "guest",
        col: 4,
        text: "Collects at the desk",
        kind: "end"
      }
    ],
    edges: [
      [
        "D1",
        "D2"
      ],
      [
        "D2",
        "D8",
        "No"
      ],
      [
        "D2",
        "D3",
        "Yes"
      ],
      [
        "D3",
        "D4"
      ],
      [
        "D3",
        "D5",
        "if short"
      ],
      [
        "D4",
        "D6"
      ]
    ]
  },
  E: {
    label: "Table reservation at a Henry's restaurant: free to hold, nothing charged in the app",
    lanes: [
      "guest",
      "kabana",
      "vendor"
    ],
    nodes: [
      {
        id: "E1",
        lane: "guest",
        col: 0,
        text: "Picks venue, date, time and party size"
      },
      {
        id: "E2",
        lane: "kabana",
        col: 1,
        text: "Table free at that time?",
        kind: "dec"
      },
      {
        id: "E3",
        lane: "guest",
        col: 1,
        text: "Told. Picks another time",
        kind: "end"
      },
      {
        id: "E4",
        lane: "kabana",
        col: 2,
        text: "Reserved. Table held. Nothing charged"
      },
      {
        id: "E5",
        lane: "guest",
        col: 3,
        text: "Booking card with the PDF menu. Chat opens"
      },
      {
        id: "E6",
        lane: "vendor",
        col: 3,
        text: "Reservation in the restaurant's list"
      },
      {
        id: "E7",
        lane: "vendor",
        col: 4,
        text: "Seats the guest, or marks a no-show"
      },
      {
        id: "E8",
        lane: "guest",
        col: 4,
        text: "Orders at the venue. Bill settled there",
        kind: "end"
      },
      {
        id: "E9",
        lane: "vendor",
        col: 5,
        text: "Seated or no-show noted. Nothing charged",
        kind: "end"
      }
    ],
    edges: [
      [
        "E1",
        "E2"
      ],
      [
        "E2",
        "E3",
        "No"
      ],
      [
        "E2",
        "E4",
        "Yes"
      ],
      [
        "E4",
        "E5"
      ],
      [
        "E4",
        "E6"
      ],
      [
        "E6",
        "E7"
      ],
      [
        "E7",
        "E8",
        "bill"
      ],
      [
        "E7",
        "E9"
      ]
    ]
  },
  F: {
    label: "Tour booked through the front desk chat, the desk books the vendor for the guest",
    lanes: [
      "guest",
      "desk",
      "kabana",
      "vendor"
    ],
    nodes: [
      {
        id: "F1",
        lane: "guest",
        col: 0,
        text: "Messages the desk: Apo Island trip, 2 guests, Friday"
      },
      {
        id: "F2",
        lane: "desk",
        col: 1,
        text: "Checks the stay. Messages the boat vendor"
      },
      {
        id: "F3",
        lane: "vendor",
        col: 2,
        text: "Boat and slot free?",
        kind: "dec"
      },
      {
        id: "F4",
        lane: "vendor",
        col: 3,
        text: "Replies to the desk with time and price"
      },
      {
        id: "F5",
        lane: "desk",
        col: 2,
        text: "Tells guest no slot. Offers another day"
      },
      {
        id: "F6",
        lane: "guest",
        col: 2,
        text: "Picks another day or cancels",
        kind: "end"
      },
      {
        id: "F7",
        lane: "desk",
        col: 4,
        text: "Attaches the booking to the guest's stay"
      },
      {
        id: "F8",
        lane: "kabana",
        col: 4,
        text: "Runs the payment check (A)"
      },
      {
        id: "F9",
        lane: "guest",
        col: 5,
        text: "Booking card in the chat, with payment status",
        kind: "end"
      },
      {
        id: "F10",
        lane: "kabana",
        col: 5,
        text: "Posts to the folio, or sends a pay link"
      },
      {
        id: "F11",
        lane: "vendor",
        col: 5,
        text: "Booking in the vendor queue",
        kind: "end"
      }
    ],
    edges: [
      [
        "F1",
        "F2"
      ],
      [
        "F2",
        "F3"
      ],
      [
        "F3",
        "F4",
        "Yes"
      ],
      [
        "F3",
        "F5",
        "No"
      ],
      [
        "F5",
        "F6"
      ],
      [
        "F4",
        "F7"
      ],
      [
        "F7",
        "F8"
      ],
      [
        "F8",
        "F9"
      ],
      [
        "F8",
        "F10"
      ],
      [
        "F10",
        "F11"
      ]
    ]
  },
  G: {
    label: "Cancelling a confirmed booking, inside or outside the free-cancel window",
    lanes: [
      "guest",
      "desk",
      "kabana",
      "vendor"
    ],
    nodes: [
      {
        id: "G1",
        lane: "guest",
        col: 0,
        text: "Taps Cancel on the booking card"
      },
      {
        id: "G9",
        lane: "desk",
        col: 1,
        text: "Or asks in chat. Desk cancels for them"
      },
      {
        id: "G2",
        lane: "kabana",
        col: 1,
        text: "Inside the free-cancel window?",
        kind: "dec"
      },
      {
        id: "G4",
        lane: "vendor",
        col: 1,
        text: "Accept the cancellation?",
        kind: "dec"
      },
      {
        id: "G3",
        lane: "kabana",
        col: 2,
        text: "Cancelled. Room charge undone or card refunded"
      },
      {
        id: "G6",
        lane: "vendor",
        col: 2,
        text: "Booking stands. Guest told, desk can step in",
        kind: "end"
      },
      {
        id: "G7",
        lane: "guest",
        col: 3,
        text: "Told: cancelled, with refund or reversal",
        kind: "end"
      },
      {
        id: "G8",
        lane: "vendor",
        col: 3,
        text: "Slot freed in the vendor calendar",
        kind: "end"
      }
    ],
    edges: [
      [
        "G1",
        "G2"
      ],
      [
        "G1",
        "G9"
      ],
      [
        "G9",
        "G2"
      ],
      [
        "G2",
        "G3",
        "Yes"
      ],
      [
        "G2",
        "G4",
        "No"
      ],
      [
        "G4",
        "G3",
        "Yes"
      ],
      [
        "G4",
        "G6",
        "No"
      ],
      [
        "G3",
        "G7"
      ],
      [
        "G3",
        "G8"
      ]
    ]
  },
  H: {
    label: "Booking states for rentals and services, and every way out of them",
    lanes: [
      "wait",
      "path",
      "exit"
    ],
    nodes: [
      {
        id: "H0",
        lane: "path",
        col: 0,
        text: "Needs desk approval (room, over limit)"
      },
      {
        id: "H1",
        lane: "wait",
        col: 1,
        text: "Pay in full or cancel. 15 min"
      },
      {
        id: "H2",
        lane: "path",
        col: 2,
        text: "Requested. Slot held. Vendor timer runs"
      },
      {
        id: "H3",
        lane: "wait",
        col: 3,
        text: "Awaiting card payment. 15 min"
      },
      {
        id: "H4",
        lane: "path",
        col: 4,
        text: "Confirmed"
      },
      {
        id: "H5",
        lane: "path",
        col: 5,
        text: "In progress. QR scanned"
      },
      {
        id: "H6",
        lane: "path",
        col: 6,
        text: "Completed",
        kind: "end"
      },
      {
        id: "X0",
        lane: "exit",
        col: 1,
        text: "Lapsed. No choice was made"
      },
      {
        id: "X1",
        lane: "exit",
        col: 2,
        text: "Withdrawn, declined or lapsed. Nothing charged"
      },
      {
        id: "X2",
        lane: "exit",
        col: 3,
        text: "Payment expired. Slot released"
      },
      {
        id: "X3",
        lane: "exit",
        col: 4,
        text: "Cancelled. Charge undone"
      },
      {
        id: "X4",
        lane: "exit",
        col: 5,
        text: "No-show. Charge stands"
      }
    ],
    edges: [
      [
        "H0",
        "H1",
        "declined, 10 min"
      ],
      [
        "H0",
        "H2",
        "approved"
      ],
      [
        "H1",
        "H2",
        "pays, vendor confirms"
      ],
      [
        "H1",
        "H3",
        "pays, instant"
      ],
      [
        "H1",
        "X0",
        "15 min"
      ],
      [
        "H2",
        "H3",
        "accepted, card"
      ],
      [
        "H2",
        "H4",
        "accepted, room"
      ],
      [
        "H3",
        "H4",
        "paid"
      ],
      [
        "H2",
        "X1"
      ],
      [
        "H3",
        "X2"
      ],
      [
        "H4",
        "H5",
        "QR scan"
      ],
      [
        "H4",
        "X3",
        "cancelled"
      ],
      [
        "H4",
        "X4",
        "no-show"
      ],
      [
        "H5",
        "H6"
      ]
    ]
  },
  H2: {
    label: "Booking states for goods and for restaurant tables",
    lanes: [
      "goods",
      "tables",
      "tablesx"
    ],
    nodes: [
      {
        id: "S1",
        lane: "goods",
        col: 0,
        text: "Confirmed. Charged as she confirmed"
      },
      {
        id: "S2",
        lane: "goods",
        col: 1,
        text: "Ready. Held at the desk"
      },
      {
        id: "S3",
        lane: "goods",
        col: 2,
        text: "Collected",
        kind: "end"
      },
      {
        id: "T1",
        lane: "tables",
        col: 0,
        text: "Reserved. Nothing charged"
      },
      {
        id: "T2",
        lane: "tables",
        col: 1,
        text: "Seated",
        kind: "end"
      },
      {
        id: "T3",
        lane: "tablesx",
        col: 0,
        text: "No-show at +15 min. Nothing charged"
      },
      {
        id: "T4",
        lane: "tablesx",
        col: 1,
        text: "Cancelled. Table released"
      }
    ],
    edges: [
      [
        "S1",
        "S2",
        "ready"
      ],
      [
        "S2",
        "S3",
        "collected"
      ],
      [
        "T1",
        "T2",
        "seats"
      ],
      [
        "T1",
        "T3",
        "no arrival"
      ],
      [
        "T1",
        "T4",
        "cancels"
      ]
    ]
  },
  I: {
    label: "Every state a payment can be in, one record per payment, room or full payment",
    lanes: [
      "room",
      "roomx",
      "card",
      "cardx"
    ],
    nodes: [
      {
        id: "P1",
        lane: "room",
        col: 0,
        text: "Pending. Queued, not yet sent"
      },
      {
        id: "P2",
        lane: "room",
        col: 1,
        text: "Posting to the PMS"
      },
      {
        id: "P3",
        lane: "room",
        col: 2,
        text: "Posted to the room folio"
      },
      {
        id: "P4",
        lane: "room",
        col: 3,
        text: "Settled at checkout",
        kind: "end"
      },
      {
        id: "R1",
        lane: "roomx",
        col: 0,
        text: "Voided. Never sent to the PMS"
      },
      {
        id: "R2",
        lane: "roomx",
        col: 1,
        text: "Failed after a refusal or 24 h. Desk posts or voids"
      },
      {
        id: "R3",
        lane: "roomx",
        col: 2,
        text: "Reversed in the PMS. Charge removed"
      },
      {
        id: "R4",
        lane: "roomx",
        col: 3,
        text: "Refund due. Desk settles with the guest"
      },
      {
        id: "Q1",
        lane: "card",
        col: 0,
        text: "Awaiting payment. 15 min"
      },
      {
        id: "Q2",
        lane: "card",
        col: 1,
        text: "Paid",
        kind: "end"
      },
      {
        id: "Q3",
        lane: "card",
        col: 2,
        text: "Refund pending"
      },
      {
        id: "Q4",
        lane: "card",
        col: 3,
        text: "Refunded",
        kind: "end"
      },
      {
        id: "Y1",
        lane: "cardx",
        col: 0,
        text: "Expired. A late payment is refunded"
      },
      {
        id: "Y3",
        lane: "cardx",
        col: 2,
        text: "Refund failed. Desk settles it"
      }
    ],
    edges: [
      [
        "P1",
        "P2",
        "sent"
      ],
      [
        "P2",
        "P3",
        "posted"
      ],
      [
        "P3",
        "P4",
        "checkout"
      ],
      [
        "P1",
        "R1",
        "cancelled"
      ],
      [
        "P2",
        "R2",
        "refused"
      ],
      [
        "P3",
        "R3",
        "cancelled or waived"
      ],
      [
        "P4",
        "R4",
        "after checkout"
      ],
      [
        "Q1",
        "Q2",
        "paid"
      ],
      [
        "Q2",
        "Q3",
        "cancelled"
      ],
      [
        "Q3",
        "Q4",
        "done"
      ],
      [
        "Q1",
        "Y1",
        "no payment"
      ],
      [
        "Q3",
        "Y3",
        "failed"
      ]
    ]
  },
  J: {
    label: "Direct chat with the vendor, front desk as the fallback: book a trip, then ask a question",
    lanes: [
      "guest",
      "desk",
      "kabana",
      "vendor"
    ],
    nodes: [
      {
        id: "J1",
        lane: "guest",
        col: 0,
        text: "Taps Book on a boat trip"
      },
      {
        id: "J2",
        lane: "kabana",
        col: 1,
        text: "Vendor on Cabana and open?",
        kind: "dec"
      },
      {
        id: "J3",
        lane: "guest",
        col: 1,
        text: "Falls back: asks the front desk chat"
      },
      {
        id: "J4",
        lane: "kabana",
        col: 2,
        text: "Request sent. Slot held. Guest can call the vendor"
      },
      {
        id: "J5",
        lane: "desk",
        col: 2,
        text: "Phones the vendor and books by hand"
      },
      {
        id: "J6",
        lane: "vendor",
        col: 3,
        text: "Accepts in time?",
        kind: "dec"
      },
      {
        id: "J7",
        lane: "desk",
        col: 3,
        text: "Puts the booking card in the desk chat"
      },
      {
        id: "J8",
        lane: "kabana",
        col: 3,
        text: "Lapsed. Nothing charged. Guest told",
        kind: "end"
      },
      {
        id: "J9",
        lane: "kabana",
        col: 4,
        text: "Confirmed. Vendor chat opens. Pays (A)"
      },
      {
        id: "J10",
        lane: "guest",
        col: 5,
        text: "Chat with the vendor opens, with the card"
      },
      {
        id: "J11",
        lane: "vendor",
        col: 5,
        text: "Booking in the vendor queue"
      },
      {
        id: "J12",
        lane: "guest",
        col: 6,
        text: "Asks the vendor about a child seat"
      },
      {
        id: "J13",
        lane: "vendor",
        col: 7,
        text: "Answers in the same chat"
      },
      {
        id: "J14",
        lane: "guest",
        col: 7,
        text: "Reads the answer. Desk not involved",
        kind: "end"
      }
    ],
    edges: [
      [
        "J1",
        "J2"
      ],
      [
        "J2",
        "J3",
        "No"
      ],
      [
        "J2",
        "J4",
        "Yes"
      ],
      [
        "J3",
        "J5"
      ],
      [
        "J4",
        "J6"
      ],
      [
        "J5",
        "J7"
      ],
      [
        "J6",
        "J8",
        "No"
      ],
      [
        "J6",
        "J9",
        "Yes"
      ],
      [
        "J7",
        "J9"
      ],
      [
        "J9",
        "J10"
      ],
      [
        "J9",
        "J11"
      ],
      [
        "J10",
        "J12"
      ],
      [
        "J12",
        "J13"
      ],
      [
        "J13",
        "J14"
      ]
    ]
  },
  K: {
    label: "Front desk only: the guest never chats with the vendor, the desk relays everything",
    lanes: [
      "guest",
      "desk",
      "kabana",
      "vendor"
    ],
    nodes: [
      {
        id: "K1",
        lane: "guest",
        col: 0,
        text: "Taps Book on a boat trip"
      },
      {
        id: "K2",
        lane: "kabana",
        col: 1,
        text: "Request goes to the desk chat as a card"
      },
      {
        id: "K3",
        lane: "desk",
        col: 2,
        text: "Reads it. Messages the vendor privately"
      },
      {
        id: "K4",
        lane: "vendor",
        col: 3,
        text: "Accepts in time?",
        kind: "dec"
      },
      {
        id: "K5",
        lane: "desk",
        col: 3,
        text: "Tells the guest. Offers another time"
      },
      {
        id: "K6",
        lane: "guest",
        col: 3,
        text: "Picks another time",
        kind: "end"
      },
      {
        id: "K7",
        lane: "desk",
        col: 4,
        text: "Confirms to the guest. Attaches the card"
      },
      {
        id: "K8",
        lane: "kabana",
        col: 5,
        text: "Confirmed. Pays by room or in full (A)"
      },
      {
        id: "K9",
        lane: "guest",
        col: 5,
        text: "Booking card in the desk chat"
      },
      {
        id: "K10",
        lane: "vendor",
        col: 5,
        text: "Booking in the vendor queue"
      },
      {
        id: "K11",
        lane: "guest",
        col: 6,
        text: "Asks the desk about a child seat"
      },
      {
        id: "K12",
        lane: "desk",
        col: 6,
        text: "Relays it to the vendor"
      },
      {
        id: "K13",
        lane: "vendor",
        col: 7,
        text: "Answers the desk"
      },
      {
        id: "K14",
        lane: "desk",
        col: 7,
        text: "Relays the answer to the guest"
      },
      {
        id: "K15",
        lane: "guest",
        col: 7,
        text: "Reads the answer from the desk",
        kind: "end"
      }
    ],
    edges: [
      [
        "K1",
        "K2"
      ],
      [
        "K2",
        "K3"
      ],
      [
        "K3",
        "K4"
      ],
      [
        "K4",
        "K5",
        "No"
      ],
      [
        "K5",
        "K6"
      ],
      [
        "K4",
        "K7",
        "Yes"
      ],
      [
        "K7",
        "K8"
      ],
      [
        "K7",
        "K9"
      ],
      [
        "K8",
        "K10"
      ],
      [
        "K9",
        "K11"
      ],
      [
        "K11",
        "K12"
      ],
      [
        "K12",
        "K13"
      ],
      [
        "K13",
        "K14"
      ],
      [
        "K14",
        "K15"
      ]
    ]
  },
  L: {
    label: "How a vendor is routed: direct chat or through the front desk, set per vendor",
    lanes: [
      "kabana",
      "desk"
    ],
    nodes: [
      {
        id: "L1",
        lane: "kabana",
        col: 0,
        text: "Guest opens a vendor listing"
      },
      {
        id: "L2",
        lane: "kabana",
        col: 1,
        text: "Vendor on Cabana?",
        kind: "dec"
      },
      {
        id: "L3",
        lane: "desk",
        col: 1,
        text: "Via the front desk. Desk books by phone",
        kind: "end"
      },
      {
        id: "L4",
        lane: "kabana",
        col: 2,
        text: "Hotel set this vendor to via desk?",
        kind: "dec"
      },
      {
        id: "L5",
        lane: "desk",
        col: 2,
        text: "Via the front desk",
        kind: "end"
      },
      {
        id: "L6",
        lane: "kabana",
        col: 3,
        text: "Answering inside the timer?",
        kind: "dec"
      },
      {
        id: "L7",
        lane: "desk",
        col: 3,
        text: "This request goes to the desk. Vendor flagged"
      },
      {
        id: "L8",
        lane: "kabana",
        col: 4,
        text: "Chat with the vendor once they commit",
        kind: "end"
      },
      {
        id: "L9",
        lane: "desk",
        col: 4,
        text: "Desk reviews flagged vendors",
        kind: "end"
      }
    ],
    edges: [
      [
        "L1",
        "L2"
      ],
      [
        "L2",
        "L3",
        "No"
      ],
      [
        "L2",
        "L4",
        "Yes"
      ],
      [
        "L4",
        "L5",
        "Yes"
      ],
      [
        "L4",
        "L6",
        "No"
      ],
      [
        "L6",
        "L8",
        "Yes"
      ],
      [
        "L6",
        "L7",
        "No"
      ],
      [
        "L7",
        "L9"
      ]
    ]
  },
  M: {
    label: "A dispute: the desk may read the guest and vendor chat, read only, until it decides",
    lanes: [
      "guest",
      "desk",
      "kabana"
    ],
    nodes: [
      {
        id: "M1",
        lane: "guest",
        col: 0,
        text: "Taps Question this charge"
      },
      {
        id: "M2",
        lane: "kabana",
        col: 1,
        text: "Charge In question. Checkout blocked. Desk task"
      },
      {
        id: "M3",
        lane: "desk",
        col: 2,
        text: "Opens the guest and vendor chat, read only"
      },
      {
        id: "M4",
        lane: "kabana",
        col: 3,
        text: "Both told in their chats: the desk read this"
      },
      {
        id: "M5",
        lane: "desk",
        col: 3,
        text: "Asks each side in the desk's own chat"
      },
      {
        id: "M6",
        lane: "desk",
        col: 4,
        text: "Decides: uphold, adjust or waive"
      },
      {
        id: "M7",
        lane: "kabana",
        col: 5,
        text: "Read access ends. Both told the outcome",
        kind: "end"
      }
    ],
    edges: [
      [
        "M1",
        "M2"
      ],
      [
        "M2",
        "M3"
      ],
      [
        "M3",
        "M4"
      ],
      [
        "M3",
        "M5"
      ],
      [
        "M5",
        "M6"
      ],
      [
        "M6",
        "M7"
      ]
    ]
  }
};
