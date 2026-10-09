import { Bell, Check, ChatCircleDots, Clock, QrCode, Receipt, Storefront, WarningCircle, WifiSlash, X } from '@/components/ui/huge-icons';
import type { PrototypeEvent, PrototypeSection } from '../../prototype-controls';
import type { ServiceImageDefinition } from '../../service-images';
import { STATUS_TONE } from './booking-card';
import type { Booking, Result } from '../types';
import type { Host } from './host';

/*
  What a presenter does for the people the guest cannot see: the vendor, the
  front desk, the hotel's system, the payment gateway, the clock. The app is
  always the guest's; these are the other side of the conversation, so a demo
  can answer a request, send a message, or make something go wrong.

  Each event shows only when it applies to a booking in the state it is in, the
  same way "Confirm" shows only for a request still waiting.
*/

const peso = (n: number) => `₱${n.toLocaleString('en-US')}`;
const MIN = 60_000;
const LIVE: Booking['status'][] = ['needs-approval', 'pay-or-cancel', 'requested', 'awaiting-payment', 'confirmed', 'reserved', 'ready', 'in-progress'];

export type EventContext = {
  host: Host;
  /** The app booking the guest is on. */
  stayId: string;
  /** Desk-side changes to the stay itself belong to the app's record of it. */
  canShortenStay: boolean;
  shortenStay: () => void;
  cancelStay: () => void;
  /** The front desk thread is the app's own chat: the desk speaking there is the app's to write. With no words, a greeting. */
  deskMessage: (text?: string) => void;
  /** The desk books something for the guest, who asked in person. The booking is the app's to record. */
  deskBooks: () => void;
  /** The desk moves the guest to another room: the room is the app's record of the stay, so it is the app's to change. */
  moveRoom: () => void;
  /** The desk checks the guest out. It answers with what stops it, if anything. */
  checkOut: () => void;
  /** An action the engine refused, said where the presenter will see it. */
  refused: (message: string) => void;
  /** Sample bookings and chats: fill a stay with them, or clear them away. `fillBlocked` says why not, when it cannot. */
  fillSamples: () => void;
  clearSamples: () => void;
  fillBlocked?: string;
  /** The desk opens a guest and vendor chat to read it, on a dispute. The view is the app's to show. */
  readDispute: (bookingId: string) => void;
  /** A booking's photograph, for its heading in the controls. */
  imageFor?: (bookingId: string) => ServiceImageDefinition | undefined;
};

export type PilotEvents = { vendor: PrototypeEvent[]; desk: PrototypeEvent[]; clock: PrototypeEvent[]; faults: PrototypeEvent[]; sections: PrototypeSection[] };

export function buildPilotEvents({ host, stayId, canShortenStay, shortenStay, cancelStay, deskMessage, deskBooks, moveRoom, checkOut, refused, fillSamples, clearSamples, fillBlocked, imageFor, readDispute }: EventContext): PilotEvents {
  const pilot = host.pilot;
  const guest = host.guestOf(stayId);
  const vendor: PrototypeEvent[] = [];
  const desk: PrototypeEvent[] = [];
  const clock: PrototypeEvent[] = [];
  const faults: PrototypeEvent[] = [];
  if (!guest) return { vendor, desk, clock, faults, sections: [] };

  /** Run one engine action; if it is refused, say so, rather than leaving the presenter with a button that did nothing. */
  const call = (path: string, ...args: unknown[]) => () => {
    const result = host.call<Result | undefined>(path, ...args);
    if (result && typeof result === 'object' && 'ok' in result && result.ok === false) refused(result.message);
  };
  const bookings = pilot.bookings().filter((b) => b.guestId === guest.guestId);
  const live = bookings.filter((b) => LIVE.includes(b.status));

  for (const b of bookings) {
    const listing = pilot.listing(b.listingId);
    const name = listing.title;
    const vendorId = listing.vendorId;
    const vendorName = pilot.vendors().find((v) => v.id === vendorId)?.name ?? 'The vendor';
    const started = host.now() >= b.start;
    const noShowAfter = (b.kind === 'table' ? pilot.settings.tableHoldMin : pilot.settings.noShowAfterStartMin) * MIN;
    const extras = pilot.payments(b.id).filter((p) => p.purpose === 'extra' && !['voided', 'reversed', 'expired'].includes(p.state));

    if (b.status === 'requested') {
      vendor.push({ icon: <Check />, label: `Vendor confirms ${name}`, detail: `${vendorName} says yes. The guest is told, and charged if paying by room.`, onClick: call('vendor.confirm', vendorId, b.id) });
      vendor.push({ icon: <X />, label: `Vendor is not available for ${name}`, detail: 'Declined with a reason. Nothing was charged.', onClick: call('vendor.decline', vendorId, b.id, 'Fully booked at that time') });
    }
    if (b.status === 'lapsed') {
      vendor.push({ icon: <Check />, label: `Vendor taps Confirm on the lapsed request for ${name}`, detail: 'Too late: it is refused, and the desk gets a task to reinstate it if the slot is free.', onClick: call('vendor.confirm', vendorId, b.id) });
    }
    if (b.status === 'confirmed' && b.kind !== 'goods' && b.kind !== 'table') {
      vendor.push({ icon: <QrCode />, label: `Vendor scans ${name}`, detail: 'The guest’s QR is read. The booking is in progress.', onClick: call('vendor.scan', vendorId, b.id) });
    }
    if (b.status === 'in-progress') {
      vendor.push({ icon: <Check />, label: `Vendor marks ${name} done`, detail: 'The service is finished.', onClick: call('vendor.complete', vendorId, b.id) });
    }
    if (['confirmed', 'in-progress', 'completed'].includes(b.status) && b.kind !== 'goods' && b.kind !== 'table') {
      vendor.push({ icon: <Receipt />, label: `Vendor adds a ₱300 extra charge to ${name}`, detail: 'A late fee, say. It lands on the bill or asks for payment, and the guest can question it.', onClick: call('vendor.addExtra', vendorId, b.id, 300, 'Late return fee') });
    }
    if (['in-progress', 'completed'].includes(b.status) && b.kind !== 'goods' && b.kind !== 'table') {
      vendor.push({ icon: <WarningCircle />, label: `Vendor claims ₱500 for damage on ${name}`, detail: 'Added to the bill but held in question: nothing settles until the front desk decides. Opens a dispute.', onClick: call('vendor.claimDamage', vendorId, b.id, 500, 'Bent wheel') });
    }
    for (const extra of extras) {
      if (extra.correctUntil !== undefined && host.now() <= extra.correctUntil) {
        vendor.push({ icon: <Receipt />, label: `Vendor corrects the extra charge on ${name} to ₱150`, detail: 'Allowed for an hour after it was added.', onClick: call('vendor.correctExtra', vendorId, extra.id, 150) });
      }
    }
    if (b.kind === 'table' && b.status === 'reserved') {
      vendor.push({ icon: <Check />, label: `Restaurant seats the party for ${name}`, detail: 'The table is taken; the hold ends.', onClick: call('vendor.seat', vendorId, b.id) });
    }
    if (b.kind === 'goods' && b.status === 'confirmed' && !b.packed) {
      vendor.push({ icon: <Storefront />, label: `Vendor packs ${name} and sends it to the desk`, detail: 'The front desk can then mark it ready.', onClick: call('vendor.sendToDesk', vendorId, b.id) });
    }
    if (b.kind !== 'goods' && (b.kind === 'table' ? b.status === 'reserved' : b.status === 'confirmed')) {
      vendor.push({
        icon: <Clock />,
        label: `Vendor marks ${name} a no-show`,
        detail: `Allowed ${noShowAfter / MIN} minutes after the start. The charge stands.`,
        onClick: call('vendor.markNoShow', vendorId, b.id),
        unavailable: started && host.now() >= b.start + noShowAfter ? undefined : `Not until ${noShowAfter / MIN} minutes after the start`,
      });
    }
    // The engine refuses a cancel once the booking has started, unless it is an order waiting at the desk.
    if (['awaiting-payment', 'confirmed', 'reserved', 'ready'].includes(b.status) && (!started || b.status === 'ready')) {
      vendor.push({ icon: <X />, label: `Vendor cancels ${name}`, detail: 'With a reason. Everything is undone and the guest is told by push and text.', onClick: call('vendor.cancel', vendorId, b.id, 'Equipment breakdown') });
    }
    if (b.cancelRequested && b.status === 'confirmed') {
      vendor.push({ icon: <Check />, label: `Vendor accepts the cancellation of ${name}`, detail: 'The guest asked past the free-cancel time.', onClick: call('vendor.answerCancel', vendorId, b.id, true) });
      vendor.push({ icon: <X />, label: `Vendor declines the cancellation of ${name}`, detail: 'The booking stands and the front desk is asked to step in.', onClick: call('vendor.answerCancel', vendorId, b.id, false) });
    }
    if (LIVE.includes(b.status)) {
      // The vendor can only write once there is a chat: it opens when they commit.
      if (pilot.thread(b.threadId, 'vendor', false).ok) {
        vendor.push({ icon: <ChatCircleDots />, label: `Vendor sends a message about ${name}`, detail: 'It arrives in the guest’s chat with the vendor.', onClick: call('vendor.message', vendorId, b.threadId, 'Hello! We have your booking. Anything we should prepare?') });
        // Lateness and headcount only mean something before a visit begins; an order is not "attended".
        const upcoming = !started && ['confirmed', 'reserved'].includes(b.status) && b.kind !== 'goods';
        if (upcoming) {
          vendor.push({ icon: <ChatCircleDots />, label: `${b.kind === 'table' ? 'Restaurant' : 'Vendor'} says it is running late for ${name}`, detail: b.kind === 'table' ? 'In the guest’s chat with the restaurant: the table will be about fifteen minutes late.' : 'In the guest’s chat with the vendor: about fifteen minutes behind.', onClick: call('vendor.message', vendorId, b.threadId, b.kind === 'table' ? 'Sorry, your table is running about 15 minutes behind. Thank you for your patience!' : 'Sorry, we are running about 15 minutes behind. Thank you for your patience!') });
        }
        if (upcoming && (b.kind === 'table' || b.kind === 'service')) {
          vendor.push({ icon: <ChatCircleDots />, label: `${b.kind === 'table' ? 'Restaurant' : 'Vendor'} asks how many are coming for ${name}`, detail: 'A question for the guest to answer in their chat.', onClick: call('vendor.message', vendorId, b.threadId, 'Quick check: how many of you will be coming? And is there anything we should know beforehand?') });
        }
      }
      if (b.kind === 'goods') {
        if (['confirmed', 'ready'].includes(b.status)) desk.push({ icon: <ChatCircleDots />, label: `Desk asks when the guest will collect ${name}`, detail: 'In the front desk chat. The order waits at the desk.', onClick: () => deskMessage(`For ${name}: do you know roughly when you will collect it from the desk?`) });
      } else if (!started && ['confirmed', 'reserved'].includes(b.status)) {
        desk.push({ icon: <ChatCircleDots />, label: `Desk asks when the guest will arrive for ${name}`, detail: 'In the front desk chat. The desk is not in the vendor’s chat.', onClick: () => deskMessage(`For ${name}: do you know roughly what time you will arrive? I will let ${vendorName} know.`) });
      }
      if (['requested', 'awaiting-payment'].includes(b.status)) {
        desk.push({ icon: <ChatCircleDots />, label: `Desk says it has passed the request to the vendor of ${name}`, detail: 'In the front desk chat, after a word with the vendor in theirs.', onClick: () => deskMessage(`I have passed your request for ${name} to ${vendorName} and will update you here as soon as they reply.`) });
      }
      desk.push({ icon: <ChatCircleDots />, label: `Desk sends a message about ${name}`, detail: 'It arrives in the front desk chat, about this booking.', onClick: () => deskMessage(`Noted, I have added that to your ${name} booking.`) });
      desk.push({ icon: <ChatCircleDots />, label: `Desk leaves a private note for the vendor of ${name}`, detail: 'In the desk’s own chat with the vendor. The guest never sees it.', onClick: call('desk.privateNote', vendorId, 'Guest is a regular, please look after them.', b.id) });
    }
    if (b.status === 'needs-approval') {
      desk.push({ icon: <Check />, label: `Desk approves charging ${name} to the room`, detail: 'Over the limit, so it needed the desk.', onClick: call('desk.approve', b.id) });
      desk.push({ icon: <X />, label: `Desk declines charging ${name} to the room`, detail: 'The guest is asked to pay in full or cancel.', onClick: call('desk.declineApproval', b.id) });
    }
    if (b.status === 'lapsed') {
      desk.push({ icon: <Check />, label: `Desk reinstates ${name}`, detail: 'Sends it back to the vendor if the slot is still free.', onClick: call('desk.reinstate', b.id) });
    }
    if (b.kind === 'goods' && b.status === 'confirmed') {
      desk.push({ icon: <Check />, label: `Desk marks ${name} ready`, detail: 'It is at the front desk. The guest is told.', onClick: call('desk.markReady', b.id) });
    }
    if (b.kind === 'goods' && b.status === 'ready') {
      desk.push({ icon: <Check />, label: `Desk hands over ${name}`, detail: 'The guest has it.', onClick: call('desk.handOver', b.id) });
    }
    // A dispute is the one time the desk may read the guest and vendor chat, read only.
    const dispute = pilot.disputes(b.id).find((d) => d.decidedAt === undefined);
    if (dispute) {
      desk.push({ icon: <ChatCircleDots />, label: `Desk reads the ${name} chat for the dispute`, detail: 'Read only. The guest and the vendor are both told, and it is logged. Deciding ends the access.', onClick: () => readDispute(b.id) });
      if (dispute.kind === 'vendor-cancel') {
        desk.push({ icon: <X />, label: `Desk decides the ${name} cancellation stands`, detail: 'The guest is told. Read access ends.', onClick: call('desk.decideCancelDispute', b.id, 'stands') });
        desk.push({ icon: <Check />, label: `Desk reinstates ${name} after the dispute`, detail: 'A fresh request for the same time goes back to the vendor. The cancellation stays on record.', onClick: call('desk.decideCancelDispute', b.id, 'reinstate') });
      }
    }
    for (const extra of pilot.payments(b.id).filter((p) => p.inQuestion)) {
      desk.push({ icon: <Check />, label: `Desk upholds the ${peso(extra.amount)} charge on ${name}`, detail: 'The charge stands.', onClick: call('desk.resolveCharge', extra.id, 'uphold') });
      desk.push({ icon: <X />, label: `Desk waives the ${peso(extra.amount)} charge on ${name}`, detail: 'Taken off the bill.', onClick: call('desk.resolveCharge', extra.id, 'waive') });
      desk.push({ icon: <Receipt />, label: `Desk adjusts the ${peso(extra.amount)} charge on ${name} to ₱100`, detail: 'The old charge is undone and a new one posted.', onClick: call('desk.resolveCharge', extra.id, 'adjust', 100) });
    }
    if (b.status === 'requested') {
      vendor.push({ icon: <WarningCircle />, label: `Guest withdraws and vendor confirms ${name} at the same instant`, detail: 'The guest’s tap lands first. One wins; the other is told who got there first.', onClick: call('race.withdrawAndConfirm', guest.guestId, vendorId, b.id) });
      vendor.push({ icon: <WarningCircle />, label: `Vendor confirms and guest withdraws ${name} at the same instant`, detail: 'The vendor’s tap lands first. One wins; the other is told who got there first.', onClick: call('race.confirmAndWithdraw', guest.guestId, vendorId, b.id) });
    }
  }

  desk.push({ icon: <Check />, label: 'Desk books a session for the guest, asked in person', detail: 'The guest told the desk, who booked it and noted who. It shows as a card in the front desk chat.', onClick: deskBooks });
  desk.push({ icon: <ChatCircleDots />, label: 'Desk sends a message in the chat', detail: 'Into the front desk thread, as the desk.', onClick: () => deskMessage() });
  desk.push({ icon: <WarningCircle />, label: 'Desk shortens the stay by a day', detail: 'Bookings after the new checkout can no longer go on the room: the guest is asked to pay in full or cancel.', onClick: shortenStay, unavailable: canShortenStay ? undefined : 'Needs a stay with more than one night' });
  desk.push({ icon: <WarningCircle />, label: 'Desk moves the guest to another room', detail: 'A charge the hotel system refused for the old room is sent again to the new one.', onClick: moveRoom });
  desk.push({ icon: <Check />, label: 'Desk checks the guest out', detail: 'Refused while a charge is in question, unpaid or not yet posted. The reason is shown.', onClick: checkOut });
  desk.push({ icon: <X />, label: 'Desk cancels the stay', detail: 'Every booking on it is cancelled and released.', onClick: cancelStay });

  for (const task of pilot.tasks('open')) {
    desk.push({ icon: <WarningCircle />, label: `Desk queue: ${task.kind}`, detail: `${task.detail} Resolving it does what the desk would.`, onClick: call('desk.resolveTask', task.id) });
  }

  // Vendors in play, and any that are offline or holding taps: the way back online must never vanish with the booking.
  const vendorIds = [...new Set([...live.map((b) => pilot.listing(b.listingId).vendorId), ...pilot.vendors().filter((v) => { const st = pilot.vendorState(v.id); return !st.online || st.pendingTaps > 0 || st.away; }).map((v) => v.id)])];
  for (const id of vendorIds) {
    const state = pilot.vendorState(id);
    const name = pilot.vendors().find((v) => v.id === id)?.name ?? id;
    vendor.push({ icon: <WifiSlash />, label: state.online ? `${name} loses signal` : `${name} is back online`, detail: state.online ? 'Taps are kept on its phone and sent when it reconnects.' : 'Queued taps are sent now.', onClick: call('vendor.setOnline', id, !state.online) });
    vendor.push({ icon: <Storefront />, label: `${name} saves today’s and tomorrow’s bookings on its phone`, detail: 'So a scan still works with no signal.', onClick: call('vendor.cacheBookings', id) });
    vendor.push({ icon: <Storefront />, label: state.away ? `${name} stops being away` : `${name} sets itself away`, detail: state.away ? 'It takes new requests again.' : 'It takes no new requests; what is already open can still be answered.', onClick: call('vendor.setAway', id, !state.away) });
  }
  const seen = new Set<string>();
  for (const b of live) {
    const listing = pilot.listing(b.listingId);
    if (seen.has(listing.id)) continue;
    seen.add(listing.id);
    const vendorId = listing.vendorId;
    // Goods have no time slot to block.
    if (b.kind !== 'goods') vendor.push({ icon: <X />, label: `Vendor blocks the booked slot of ${listing.title}`, detail: 'Refused while bookings are on it, and the guest sees how many.', onClick: call('vendor.blockSlot', listing.id, b.slotKeys[0]) });
    vendor.push({ icon: <X />, label: `Vendor removes the listing ${listing.title}`, detail: 'Refused while bookings are open on it. Once gone, nobody can ask for it.', onClick: call('vendor.removeListing', listing.id) });
    void vendorId;
  }

  for (const [label, minutes] of [['2 minutes', 2], ['5 minutes', 5], ['14 minutes', 14], ['15 minutes', 15], ['an hour', 60], ['4 hours', 240], ['a day', 1440]] as const) {
    clock.push({ icon: <Clock />, label: `Move the clock on ${label}`, detail: 'Timers fire in order: vendor windows, card windows, holds, reminders.', onClick: call('pilot.advanceTo', host.now() + minutes * MIN) });
  }

  faults.push({ icon: <WarningCircle />, label: `Hotel system: ${pilot.pms.mode === 'up' ? 'working' : pilot.pms.mode === 'down' ? 'down' : 'refusing charges'}`, detail: 'Tap to change: working, down, refusing. Room charges queue and retry.', onClick: call('pilot.setPms', { mode: pilot.pms.mode === 'up' ? 'down' : pilot.pms.mode === 'down' ? 'reject' : 'up' }) });
  faults.push({ icon: <WarningCircle />, label: `Hotel system loses its next reply: ${pilot.pms.dropNextReply ? 'on' : 'off'}`, detail: 'The charge lands but the reply is lost. The retry must not charge twice.', onClick: call('pilot.setPms', { dropNextReply: !pilot.pms.dropNextReply }) });
  faults.push({ icon: <WarningCircle />, label: `Hotel system refuses reversals: ${pilot.pms.refuseReversal ? 'on' : 'off'}`, detail: 'A cancelled room charge cannot be taken off. It goes to the desk.', onClick: call('pilot.setPms', { refuseReversal: !pilot.pms.refuseReversal }) });
  faults.push({ icon: <WarningCircle />, label: `Payment gateway: ${pilot.gateway.mode === 'ok' ? 'working' : pilot.gateway.mode === 'fail' ? 'failing' : 'guest walks away'}`, detail: 'Tap to change: working, failing, walks away. Three tries, then the slot is released.', onClick: call('pilot.setGateway', { mode: pilot.gateway.mode === 'ok' ? 'fail' : pilot.gateway.mode === 'fail' ? 'abandon' : 'ok' }) });
  faults.push({ icon: <WarningCircle />, label: `Gateway loses payment callbacks: ${pilot.gateway.loseCallbacks ? 'on' : 'off'}`, detail: 'The guest pays, the app is not told. The two-minute check finds it.', onClick: call('pilot.setGateway', { loseCallbacks: !pilot.gateway.loseCallbacks }) });
  faults.push({ icon: <WarningCircle />, label: `Gateway repeats its callbacks: ${pilot.gateway.duplicateCallbacks ? 'on' : 'off'}`, detail: 'The same payment is announced four times. It is counted once.', onClick: call('pilot.setGateway', { duplicateCallbacks: pilot.gateway.duplicateCallbacks ? 0 : 3 }) });
  faults.push({ icon: <WarningCircle />, label: `Hotel system refuses the old room after a move: ${pilot.pms.staleRoomRefused ? 'on' : 'off'}`, detail: 'With the system refusing charges, a charge for the room the guest left is refused once, then sent to the new room.', onClick: call('pilot.setPms', { staleRoomRefused: !pilot.pms.staleRoomRefused }) });
  faults.push({ icon: <WarningCircle />, label: `Gateway fails refunds: ${pilot.gateway.failRefunds ? 'on' : 'off'}`, detail: 'A refund is refused. The guest is told the hotel is handling it; the desk gets a task.', onClick: call('pilot.setGateway', { failRefunds: !pilot.gateway.failRefunds }) });
  const pushOn = host.meta[`push:${guest.guestId}`] !== 'off';
  faults.push({
    icon: <Bell />,
    label: `Notifications to the guest: ${pushOn ? 'on' : 'off'}`,
    detail: 'With push off, an SMS follows 10 minutes after anything critical goes unopened.',
    onClick: () => {
      host.setMeta(`push:${guest.guestId}`, pushOn ? 'off' : 'on');
      host.call('pilot.setGuestNotifications', guest.guestId, !pushOn);
    },
  });
  /*
    Every trigger is always there. One that has nothing to act on yet stays in
    the list, greyed, saying what it is waiting for, so the whole set can be
    seen (and a fresh stay does not look as though the other side of the
    conversation is missing).
  */
  const waiting = (list: PrototypeEvent[], present: (label: string) => boolean, icon: PrototypeEvent['icon'], label: string, reason: string) => {
    if (!list.some((event) => present(event.label))) list.push({ icon, label, detail: reason, onClick: () => undefined, unavailable: reason, placeholder: true });
  };
  waiting(vendor, (l) => /^Vendor confirms (?!and)/.test(l), <Check />, 'Vendor confirms a request', 'Needs a request waiting for the vendor: ask for a rental or a tour');
  waiting(vendor, (l) => l.startsWith('Vendor is not available for'), <X />, 'Vendor is not available for a request', 'Needs a request waiting for the vendor');
  waiting(vendor, (l) => l.startsWith('Vendor scans'), <QrCode />, 'Vendor scans a booking’s QR', 'Needs a confirmed rental or service');
  waiting(vendor, (l) => l.includes('marks') && l.includes('done'), <Check />, 'Vendor marks a service done', 'Needs a service that has been scanned');
  waiting(vendor, (l) => l.includes('extra charge to'), <Receipt />, 'Vendor adds an extra charge', 'Needs a confirmed rental or service');
  waiting(vendor, (l) => l.includes('a no-show'), <Clock />, 'Vendor marks a booking a no-show', 'Needs a confirmed booking that has passed its start');
  waiting(vendor, (l) => l.startsWith('Vendor cancels'), <X />, 'Vendor cancels a booking', 'Needs a booking that has not started');
  waiting(vendor, (l) => l.startsWith('Vendor sends a message about'), <ChatCircleDots />, 'Vendor sends a message', 'Needs a chat: it opens when the vendor accepts a request, or as an instant booking is made');
  waiting(vendor, (l) => l.startsWith('Restaurant seats'), <Check />, 'Restaurant seats a party', 'Needs a reserved table');
  waiting(vendor, (l) => l.includes('packs'), <Storefront />, 'Vendor packs an order', 'Needs a confirmed goods order');
  waiting(desk, (l) => l.startsWith('Desk approves charging'), <Check />, 'Desk approves an over-limit charge', 'Room-bill limits are off in this prototype, so nothing needs the desk to approve it');
  waiting(desk, (l) => l.startsWith('Desk reinstates'), <Check />, 'Desk reinstates a lapsed request', 'Needs a request the vendor did not answer in time');
  waiting(desk, (l) => l.includes('marks') && l.includes('ready'), <Check />, 'Desk marks an order ready', 'Needs a confirmed goods order');
  waiting(desk, (l) => l.startsWith('Desk hands over'), <Check />, 'Desk hands over an order', 'Needs an order that is ready');
  waiting(desk, (l) => l.startsWith('Desk sends a message about'), <ChatCircleDots />, 'Desk sends a message about a booking', 'Needs a booking');
  waiting(desk, (l) => l.startsWith('Desk reads the '), <ChatCircleDots />, 'Desk reads a guest and vendor chat', 'Needs an open dispute: a questioned charge, a contested no-show, a disputed cancellation or a damage claim');
  waiting(desk, (l) => l.startsWith('Desk leaves a private note'), <ChatCircleDots />, 'Desk leaves a private note for a vendor', 'Needs a booking');

  desk.push({ icon: <Check />, label: 'Fill Messages with sample bookings and chats', detail: 'A scooter nobody answered, bicycles confirmed with a message from the shop, a tour waiting, a table, an order ready at the desk, a session the desk booked. And a front desk chat to match.', onClick: fillSamples, unavailable: fillBlocked });
  desk.push({ icon: <X />, label: 'Clear the sample bookings and chats', detail: 'Back to a stay with nothing booked and an empty desk chat.', onClick: clearSamples });

  // Each booking's buttons sit under its own heading, so with a dozen bookings the list can still be read.
  const titles = [...new Set(bookings.map((b) => pilot.listing(b.listingId).title))].sort((a, b) => b.length - a.length);
  const sectioned = (event: PrototypeEvent): PrototypeEvent => {
    const section = event.placeholder ? undefined : titles.find((title) => event.label.includes(title));
    return section ? { ...event, section } : event;
  };
  // The headings, in the order Messages lists the bookings: newest conversation first.
  const lastAt = new Map(pilot.threads('guest', guest.guestId).map((thread) => [thread.bookingId, thread.last?.at ?? 0]));
  const sections: PrototypeSection[] = [];
  for (const b of [...bookings].sort((x, y) => (lastAt.get(y.id) ?? 0) - (lastAt.get(x.id) ?? 0))) {
    const title = pilot.listing(b.listingId).title;
    if (sections.some((section) => section.title === title)) continue;
    const card = pilot.card(b.id);
    sections.push({ title, status: card.label, tone: STATUS_TONE(card.state, card.label), image: imageFor?.(b.id) });
  }
  return { vendor: vendor.map(sectioned), desk: desk.map(sectioned), clock, faults, sections };
}
