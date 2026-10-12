import type { ScenarioText } from './types';

export const SCENARIO_TEXT: Record<string, ScenarioText> = {
  H1: {
    title: "Bike rental paid by room",
    given: "Maria, Villa 12, in house. Simulated bike shop open, 2 bikes free on Saturday.",
    when: "She requests 2 bikes. Shop accepts at minute 10. Shop scans her QR Saturday 8:34. Bikes return on time.",
    then: "Requested, Confirmed, In progress, Completed. One room charge, Posted. No extra charge. Hold released at completion."
  },
  H2: {
    title: "Bike rental paid in full",
    given: "Bike shop has 2 bikes free on Saturday. Maria picks Pay in full.",
    when: "She asks and the card or wallet hold is placed. The shop accepts at minute 10.",
    then: "The request goes to the shop only once the money is held, and nothing is taken until the shop accepts. On accept the hold is taken and the booking is Confirmed in one step: one Paid payment, no room charge."
  },
  H3: {
    title: "Apo Island trip from the app, by room",
    given: "Boat operator has 4 seats on the Friday 7:30 trip.",
    when: "Guest requests 2 seats. Operator accepts.",
    then: "Confirmed with QR. Seats left 2. One room charge Posted."
  },
  H4: {
    title: "Apo Island trip asked through the desk",
    given: "Guest messages the front desk. Desk messages the operator.",
    when: "Operator replies with time and price. Desk attaches the booking.",
    then: "Booking card appears in the guest thread. Desk-to-operator thread never shows to the guest. Payment gate ran."
  },
  H5: {
    title: "Guest adds the tour card to the chat",
    given: "Guest is in the front desk thread.",
    when: "Guest adds the tour card and sends it.",
    then: "Request goes straight to the operator. Desk can see it. Same Confirmed card as H4 at the end."
  },
  H6: {
    title: "Pasalubong from Cafe Sans Rival, 3 days ahead",
    given: "Guest departs Tuesday. Orders Saturday.",
    when: "Cafe Sans Rival accepts. Sends the order to the desk. Guest collects Tuesday.",
    then: "Charge Posted on accept. Card says ready for departure day. Desk holds it chilled. Collected, order closed."
  },
  H7: {
    title: "Table at Si Señor",
    given: "Si Señor publishes 7:00 PM for up to 10.",
    when: "Guest reserves for 2 at 7:00 PM.",
    then: "Reserved at once. Nothing charged. PDF menu on the card. Chat opens. Venue marks Seated."
  },
  H8: {
    title: "Table at The Red Kitchen at the party limit",
    given: "Venue maximum is 8.",
    when: "Guest reserves for 8, then tries 9.",
    then: "8 reserves. 9 is stopped with Message the restaurant."
  },
  H9: {
    title: "Henry's own yoga class",
    given: "Hotel is the vendor. Staff use the vendor app.",
    when: "Guest requests. Staff confirm.",
    then: "Same Requested, Confirmed, Completed path as a partner service."
  },
  H10: {
    title: "Room booking made before arrival",
    given: "Guest arrives in 5 days. Picks room payment for a trip inside the stay.",
    when: "Vendor accepts today. Guest checks in on arrival day.",
    then: "Charge waits as Pending. It posts at check-in, once."
  },
  T1: {
    title: "Withdraw and accept at the same instant",
    given: "A request is waiting.",
    when: "Guest withdraws and the vendor accepts in the same moment.",
    then: "One winner. If the vendor won, the withdraw becomes a normal cancel. Both see who was first. I8 holds."
  },
  T2: {
    title: "Vendor taps Confirm after the request lapsed",
    given: "Request lapsed 2 minutes ago.",
    when: "Vendor taps Confirm.",
    then: "Refused with a clear message. Desk gets a task. Desk can reinstate it if the slot is free."
  },
  T3: {
    title: "Same request sent twice",
    given: "Weak signal.",
    when: "Guest double taps Send.",
    then: "One active request. Second is ignored. Guest sees one card."
  },
  T4: {
    title: "Two guests, one slot left",
    given: "1 seat left on the trip.",
    when: "Both guests request in the same second.",
    then: "One hold. Other guest is refused with Just booked. I1 holds."
  },
  T5: {
    title: "Vendor never opens a request",
    given: "Timer is 30 minutes.",
    when: "Nothing happens.",
    then: "Push at 0. SMS at 5. Reminder at 15. Lapse at 30. Hold released. Guest told."
  },
  T6: {
    title: "Vendor has no signal at the deadline",
    given: "Vendor taps Confirm at minute 28 offline.",
    when: "Phone reconnects at minute 33, then at minute 40 in a second run.",
    then: "Minute 33: counts, within 5 minutes of grace and slot still held. Minute 40: lapsed."
  },
  T7: {
    title: "Request arrives while the vendor is closed",
    given: "Vendor closes at 6 PM. Request at 11 PM for the next evening.",
    when: "Time passes.",
    then: "Timer pauses overnight and resumes at opening. Never longer than 24 hours."
  },
  T8: {
    title: "Service start is near",
    given: "Same-day trip at 7:30 AM. Request at 7:00 AM.",
    when: "Time passes.",
    then: "Lapses at 7:15, which is 15 minutes before the start."
  },
  P1: {
    title: "Over the limit, desk approves",
    given: "Per-order limit ₱5,000. Order ₱6,400.",
    when: "Desk approves in 4 minutes.",
    then: "Needs desk approval, then Requested. Slot held throughout."
  },
  P2: {
    title: "Over the limit, desk is silent",
    given: "Same as P1.",
    when: "10 minutes pass.",
    then: "Guest is asked to pay in full or cancel. Slot stays held until they choose or it times out."
  },
  P3: {
    title: "Service date outside the stay",
    given: "Guest checks out Monday. Trip is Tuesday.",
    when: "Guest opens the payment choice.",
    then: "Charge to room is not offered. Only Pay in full."
  },
  P4: {
    title: "Card payment fails three times",
    given: "She asks for a trip paying by card. The gateway is set to fail.",
    when: "She tries the hold three times.",
    then: "The request never goes out. The payment expires, the booking reads Not booked, and the slot is released. Nothing was taken."
  },
  P5: {
    title: "Guest never pays",
    given: "She asks, paying by card, and leaves the payment page.",
    when: "15 minutes pass.",
    then: "The payment expires, the slot is released and the booking reads Not booked. She can send a new request, which waits for its own hold."
  },
  P6: {
    title: "Gateway took the money, callback lost",
    given: "The gateway places the hold but the app never hears.",
    when: "Two minutes pass. In a second run the hold lands at minute 14, after the window closed.",
    then: "Run 1: reconciliation finds the hold and the request goes to the vendor, held and not taken. Run 2: the slot was already released, so the hold is let go. Nothing is refunded and the gateway holds nothing."
  },
  P7: {
    title: "Guest pays twice",
    given: "Gateway allows a second payment.",
    when: "Guest pays, then pays again.",
    then: "Second payment refunded automatically. One Paid payment remains. I2 holds."
  },
  P8: {
    title: "Refund fails",
    given: "Gateway set to fail refunds.",
    when: "Guest cancels a paid booking.",
    then: "Refund failed. Desk task with amount and method. Guest told the hotel is handling it."
  },
  P9: {
    title: "Extra charge by room",
    given: "Bike returns 70 minutes late.",
    when: "Shop adds ₱150 with a reason.",
    then: "Guest sees it at once. Posts to the room. Completed."
  },
  P10: {
    title: "Extra charge on a card booking, unpaid",
    given: "Booking was paid in full. Extra charge added.",
    when: "Guest ignores it until checkout.",
    then: "Charge stays open. Checkout is blocked. Desk collects or waives it."
  },
  P11: {
    title: "Guest questions an extra charge",
    given: "Extra charge posted.",
    when: "Guest taps Question this charge. Desk upholds, adjusts or waives in three runs.",
    then: "In question blocks checkout. Uphold keeps it. Adjust voids and posts a new one. Waive voids it. Vendor sees the outcome."
  },
  P12: {
    title: "Vendor corrects a wrong amount",
    given: "Shop entered ₱1,500 by mistake.",
    when: "Shop corrects at minute 40, then at minute 70 in a second run.",
    then: "Minute 40: old voided, new posted, both visible. Minute 70: refused, desk only."
  },
  M1: {
    title: "PMS is down when posting",
    given: "PMS set to down.",
    when: "Guest's booking is accepted. Time passes 30 minutes, then 24 hours.",
    then: "Charge Pending in the ledger. Retries every 5 minutes. Desk alerted at 30. Guest sees Charged to room throughout. I7 holds."
  },
  M2: {
    title: "PMS rejects the room",
    given: "Guest was moved. PMS refuses the old room.",
    when: "Charge posts.",
    then: "Current room looked up. One retry. If still refused, desk task."
  },
  M3: {
    title: "Retry could post twice",
    given: "PMS posts the charge but drops the reply.",
    when: "System retries.",
    then: "Folio is checked for the charge reference first. Posted once. I2 holds."
  },
  M4: {
    title: "Guest moves rooms mid-stay",
    given: "Two open bookings and one posted charge.",
    when: "Desk moves the guest from Villa 12 to Villa 14.",
    then: "Posted charge moves with the folio. Open bookings show Villa 14 to vendors. New charges post to Villa 14."
  },
  M5: {
    title: "Cancel after posting, before checkout",
    given: "Charge Posted.",
    when: "Booking cancelled. Run once with the PMS accepting the reversal, once refusing.",
    then: "Accepted: Reversed. Refused: desk task."
  },
  M6: {
    title: "Cancel after checkout",
    given: "Stay settled.",
    when: "Guest tries to cancel.",
    then: "Not possible in the app. Marked Refund due. Desk settles it."
  },
  M7: {
    title: "Checkout with open items",
    given: "One Pending charge and one In question.",
    when: "Desk starts checkout.",
    then: "Checkout lists both. Cannot finish until each is posted, voided or collected. I9 holds."
  },
  C1: {
    title: "Cancel inside the free window, room",
    given: "Window is 24 hours. Trip in 3 days.",
    when: "Guest cancels.",
    then: "Slot released. Room charge Voided or Reversed. Guest, vendor and desk see it."
  },
  C2: {
    title: "Cancel inside the free window, card",
    given: "Paid in full.",
    when: "Guest cancels.",
    then: "Refund pending, then Refunded to the same method."
  },
  C3: {
    title: "Cancel outside the window, vendor accepts",
    given: "Trip tomorrow.",
    when: "Guest cancels. Operator accepts.",
    then: "Cancelled. Charge undone."
  },
  C4: {
    title: "Cancel outside the window, vendor declines",
    given: "Same as C3.",
    when: "Operator declines.",
    then: "Booking stands. Desk can step in. No part fee."
  },
  C5: {
    title: "Vendor cancels with a reason",
    given: "Bike shop breakdown.",
    when: "Shop cancels before the service starts.",
    then: "Everything undone automatically. Guest told by push and SMS with a rebook offer. Desk told."
  },
  C6: {
    title: "Weather cancels the boat",
    given: "12 bookings on the Friday 7:30 trip, mixed room and card.",
    when: "Operator taps Cancel all for this slot.",
    then: "All 12 cancelled with one reason. Each guest told once. Desk sees the batch. Every hold released."
  },
  C7: {
    title: "Guest does not show up",
    given: "Trip starts 7:30.",
    when: "Operator marks no-show at 8:00.",
    then: "No-show. Charge stands. Desk told. Guest can question it through the desk."
  },
  C8: {
    title: "Guest asks to change the date",
    given: "Confirmed booking.",
    when: "Guest looks for Change date.",
    then: "Not offered. Cancel and rebook is offered, free inside the window."
  },
  C9: {
    title: "Stay shortened below a booking",
    given: "Trip on the last day. Guest shortens by 2 days.",
    when: "Desk edits the stay.",
    then: "Desk sees the conflict. Guest asked to pay in full or cancel. Unresolved at 24 hours before: desk handles."
  },
  C10: {
    title: "Stay cancelled",
    given: "Three room bookings pending before arrival.",
    when: "Stay is cancelled.",
    then: "All three cancelled automatically. Vendors told. Holds released."
  },
  V1: {
    title: "Vendor sets Away",
    given: "Shop has one open booking.",
    when: "Shop sets Away.",
    then: "No new requests. The open booking is untouched."
  },
  V2: {
    title: "Remove a listing that has bookings",
    given: "Two confirmed bookings.",
    when: "Vendor tries to remove the listing.",
    then: "Blocked until those bookings are cancelled through the vendor cancel route."
  },
  V3: {
    title: "Block a slot that is booked",
    given: "Slot has 3 bookings.",
    when: "Vendor blocks it.",
    then: "Blocked. The 3 bookings are shown to cancel first."
  },
  V4: {
    title: "Owner and staff both tap Confirm",
    given: "One request.",
    when: "Both tap in the same second.",
    then: "One wins. Owner sees who. I8 holds."
  },
  V5: {
    title: "QR scan with no signal, cache present",
    given: "Bookings for today and tomorrow cached.",
    when: "Shop scans offline.",
    then: "Signed QR checks against the cache. In progress is queued and synced later."
  },
  V6: {
    title: "QR scan with no signal, no cache",
    given: "Shop never opened the app today.",
    when: "Shop scans offline.",
    then: "Falls back to lookup by guest name and room, or a call to the desk."
  },
  V7: {
    title: "Guest's phone is dead",
    given: "Booking exists.",
    when: "Guest arrives with no QR.",
    then: "Vendor finds the booking by name and room."
  },
  R1: {
    title: "Party above the venue maximum",
    given: "Popolo Pizzeria maximum is 10.",
    when: "Guest enters 12.",
    then: "Form stops at 10 and offers Message the restaurant."
  },
  R2: {
    title: "Running late for a table",
    given: "Reservation 7:00 PM at The Dining Room.",
    when: "Guest taps Running late. Time passes to 7:16.",
    then: "Restaurant told. Table held until 7:15, then released and marked No-show. Nothing charged ever."
  },
  R3: {
    title: "Cancel a reservation",
    given: "Reserved.",
    when: "Guest cancels at any time.",
    then: "Free. Table released. Restaurant told."
  },
  R4: {
    title: "Restaurant closes a slot for an event",
    given: "5 reservations at Si Señor for Saturday 7:00 PM.",
    when: "Venue closes the slot.",
    then: "Each of the 5 cancelled with a reason. Each guest and the desk told."
  },
  R5: {
    title: "Order food ahead",
    given: "Reserved table.",
    when: "Guest looks for Order ahead.",
    then: "Not offered. The PDF menu is on the card and the guest can ask in chat."
  },
  R6: {
    title: "Meal charged to the room at the venue",
    given: "Si Señor posts the bill to the folio through its own system.",
    when: "Guest then makes a Cabana booking.",
    then: "Cabana limit counts only Cabana charges. The meal shows on the bill at checkout."
  },
  R7: {
    title: "Checkout without collecting pasalubong",
    given: "Order Ready at the desk.",
    when: "Desk starts checkout.",
    then: "Order is on the desk checklist. Handed over at checkout."
  },
  R8: {
    title: "Pasalubong above the vendor cap",
    given: "Cap is 50 boxes.",
    when: "Guest orders 80.",
    then: "Quantity stops at 50 and offers to ask the vendor in chat."
  },
  Q1: {
    title: "One booking in three threads",
    given: "A boat trip request is waiting.",
    when: "The vendor accepts.",
    then: "While it waits there is no chat on either side. After accepting, the guest's chat and the operator's chat both show Confirmed at once. A card is a view of the booking, not a copy."
  },
  Q2: {
    title: "Thread closes 48 hours after the service",
    given: "Service completed 49 hours ago.",
    when: "Guest opens the thread.",
    then: "Cards visible. Actions follow the booking state. A question goes to the desk thread."
  },
  Q3: {
    title: "Vendor types ok instead of tapping Confirm",
    given: "A boat trip request is waiting for the operator.",
    when: "The vendor types ok in the chat. The guest tries to send a message.",
    then: "No chat exists yet. The vendor is told to tap Confirm and the guest that there is no chat yet. The booking stays Requested."
  },
  Q4: {
    title: "Desk books for a guest who asked in person",
    given: "Guest is at the counter.",
    when: "Desk books a trip.",
    then: "Desk records that the guest asked, with the staff name, before the charge. Guest sees the card."
  },
  Q5: {
    title: "Guest has notifications off",
    given: "Push not delivered.",
    when: "Vendor cancels. 10 minutes pass.",
    then: "SMS goes out. Unread badge on the thread list."
  },
  Q6: {
    title: "A vendor chat opens only when the vendor commits",
    given: "The boat operator is on Cabana. The guest requests the Apo Island trip.",
    when: "The request waits, then the vendor accepts.",
    then: "While it waits there is no chat: it is not in the guest's list and cannot be opened. On accept a one to one booking chat opens. Both sides see the same card and every message names its sender. The desk is not a participant and does not see it in its list."
  },
  Q7: {
    title: "Desk talks to the vendor privately",
    given: "A booking exists.",
    when: "Desk messages the vendor in their private chat.",
    then: "The guest never sees it. The guest and vendor chat is unchanged."
  },
  Q8: {
    title: "Vendor is not on Cabana, fallback to the desk",
    given: "The trip is confirmed.",
    when: "The guest asks about a child seat. The vendor answers. The desk adds a note.",
    then: "The vendor's automatic greeting comes first. After it only the guest and the vendor appear in the booking chat, in order. The desk's note is in its own chat with the guest, tied to the booking. The status stays Confirmed."
  },
  Q9: {
    title: "Vendor chat after a cancel",
    given: "Booking cancelled.",
    when: "49 hours pass.",
    then: "The chat stays readable for 48 hours, then read-only. The Cancelled card stays on top."
  },
  Q10: {
    title: "Desk reads a vendor chat on a dispute",
    given: "Guest questions an extra charge from the bike shop (simulated).",
    when: "The desk opens the dispute.",
    then: "The desk can read the guest and vendor chat, read only. Both sides get a notice in their own chats. The desk cannot write there. Access ends when the dispute is decided. The open is logged."
  },
  Q11: {
    title: "No dispute, no reading",
    given: "A booking with no dispute.",
    when: "The desk tries to open the guest and vendor chat.",
    then: "Refused. The desk sees only the booking state and its tasks."
  },
  S1: {
    title: "A busy afternoon",
    given: "50 guests, 6 vendors.",
    when: "200 requests across all types in 10 simulated minutes, with random accepts, declines and lapses.",
    then: "All invariants hold. Every request ends in a terminal state or has a live timer or desk task."
  },
  S2: {
    title: "One slot, many guests",
    given: "Trip capacity 8.",
    when: "30 guests request together.",
    then: "Exactly 8 holds. 22 refused cleanly. I1 holds."
  },
  S3: {
    title: "PMS down for 24 hours",
    given: "300 charges pending, 40 of them cancelled meanwhile.",
    when: "PMS returns.",
    then: "Each live charge posts once. Cancelled ones never post. Desk tasks cleared. I2 and I5 hold."
  },
  S4: {
    title: "Duplicate gateway callbacks",
    given: "One payment.",
    when: "The same callback arrives 5 times.",
    then: "One Paid payment. No extra refund."
  },
  S5: {
    title: "Clock jumps three days",
    given: "Open requests, payment windows and a no-show waiting.",
    when: "Advance 3 days in one step.",
    then: "Every timer fires once, in order. Nothing fires twice."
  },
  S6: {
    title: "Seeded chaos run",
    given: "Random actions from guests, desk and vendors, with random PMS, gateway and signal faults.",
    when: "10,000 steps from one seed.",
    then: "All invariants hold after every step. A failure prints the seed and the step so it can be replayed."
  },
  S7: {
    title: "A big weather cancellation",
    given: "40 bookings on one slot.",
    when: "Operator cancels the slot.",
    then: "40 cancellations, 40 reversals or refunds, one notification each, one batch on the desk screen."
  }
};
