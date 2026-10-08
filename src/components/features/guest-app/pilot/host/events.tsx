import { Bell, Check, ChatCircleDots, Clock, QrCode, Receipt, Storefront, WarningCircle, WifiSlash, X } from '@phosphor-icons/react';
import type { PrototypeEvent } from '../../prototype-controls';
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
  /** The front desk thread is the app's own chat: the desk speaking there is the app's to write. */
  deskMessage: () => void;
  /** The desk books something for the guest, who asked in person. The booking is the app's to record. */
  deskBooks: () => void;
  /** The desk moves the guest to another room: the room is the app's record of the stay, so it is the app's to change. */
  moveRoom: () => void;
  /** The desk checks the guest out. It answers with what stops it, if anything. */
  checkOut: () => void;
  /** An action the engine refused, said where the presenter will see it. */
  refused: (message: string) => void;
};

export function buildPilotEvents({ host, stayId, canShortenStay, shortenStay, cancelStay, deskMessage, deskBooks, moveRoom, checkOut, refused }: EventContext): { vendor: PrototypeEvent[]; desk: PrototypeEvent[]; clock: PrototypeEvent[]; faults: PrototypeEvent[] } {
  const pilot = host.pilot;
  const guest = host.guestOf(stayId);
  const vendor: PrototypeEvent[] = [];
  const desk: PrototypeEvent[] = [];
  const clock: PrototypeEvent[] = [];
  const faults: PrototypeEvent[] = [];
  if (!guest) return { vendor, desk, clock, faults };

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
    if (b.status === 'confirmed' && b.kind !== 'goods') {
      vendor.push({ icon: <QrCode />, label: `Vendor scans ${name}`, detail: 'The guest’s QR is read. The booking is in progress.', onClick: call('vendor.scan', vendorId, b.id) });
    }
    if (b.status === 'in-progress') {
      vendor.push({ icon: <Check />, label: `Vendor marks ${name} done`, detail: 'The service is finished.', onClick: call('vendor.complete', vendorId, b.id) });
    }
    if (['confirmed', 'in-progress', 'completed'].includes(b.status) && b.kind !== 'goods' && b.kind !== 'table') {
      vendor.push({ icon: <Receipt />, label: `Vendor adds a ₱300 extra charge to ${name}`, detail: 'A late fee, say. It lands on the bill or asks for payment, and the guest can question it.', onClick: call('vendor.addExtra', vendorId, b.id, 300, 'Late return fee') });
    }
    for (const extra of extras) {
      if (extra.correctUntil !== undefined && host.now() <= extra.correctUntil) {
        vendor.push({ icon: <Receipt />, label: `Vendor corrects the extra charge on ${name} to ₱150`, detail: 'Allowed for an hour after it was added.', onClick: call('vendor.correctExtra', vendorId, extra.id, 150) });
      }
    }
    if (b.kind === 'table' && b.status === 'reserved') {
      vendor.push({ icon: <Check />, label: `Restaurant seats the party for ${name}`, detail: 'The table is taken; the hold ends.', onClick: call('vendor.seat', vendorId, b.id) });
    }
    if (b.kind === 'goods' && b.status === 'confirmed') {
      vendor.push({ icon: <Storefront />, label: `Vendor packs ${name} and sends it to the desk`, detail: 'The front desk can then mark it ready.', onClick: call('vendor.sendToDesk', vendorId, b.id) });
    }
    if (['confirmed', 'reserved'].includes(b.status)) {
      vendor.push({
        icon: <Clock />,
        label: `Vendor marks ${name} a no-show`,
        detail: `Allowed ${noShowAfter / MIN} minutes after the start. The charge stands.`,
        onClick: call('vendor.markNoShow', vendorId, b.id),
        unavailable: started && host.now() >= b.start + noShowAfter ? undefined : `Not until ${noShowAfter / MIN} minutes after the start`,
      });
    }
    if (['awaiting-payment', 'confirmed', 'reserved', 'ready'].includes(b.status)) {
      vendor.push({ icon: <X />, label: `Vendor cancels ${name}`, detail: 'With a reason. Everything is undone and the guest is told by push and text.', onClick: call('vendor.cancel', vendorId, b.id, 'Equipment breakdown') });
    }
    if (b.cancelRequested && b.status === 'confirmed') {
      vendor.push({ icon: <Check />, label: `Vendor accepts the cancellation of ${name}`, detail: 'The guest asked past the free-cancel time.', onClick: call('vendor.answerCancel', vendorId, b.id, true) });
      vendor.push({ icon: <X />, label: `Vendor declines the cancellation of ${name}`, detail: 'The booking stands and the front desk is asked to step in.', onClick: call('vendor.answerCancel', vendorId, b.id, false) });
    }
    if (LIVE.includes(b.status)) {
      vendor.push({ icon: <ChatCircleDots />, label: `Vendor sends a message about ${name}`, detail: 'It arrives in the booking’s thread, signed by the vendor.', onClick: call('vendor.message', vendorId, b.threadId, 'Hello! We have your booking. Anything we should prepare?') });
      desk.push({ icon: <ChatCircleDots />, label: `Desk sends a message about ${name}`, detail: 'It arrives in the booking’s thread, signed by the front desk.', onClick: call('desk.messageBooking', b.threadId, 'Noted, I have added that to your booking.') });
      desk.push({ icon: <ChatCircleDots />, label: `Desk leaves a private note for the vendor of ${name}`, detail: 'The guest never sees it.', onClick: call('desk.privateNote', vendorId, 'Guest is a regular, please look after them.', b.id) });
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
  desk.push({ icon: <ChatCircleDots />, label: 'Desk sends a message in the chat', detail: 'Into the front desk thread, as the desk.', onClick: deskMessage });
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
    vendor.push({ icon: <X />, label: `Vendor blocks the slot of ${listing.title}`, detail: 'Refused while bookings are on it, and the guest sees how many.', onClick: call('vendor.blockSlot', listing.id, b.slotKeys[0]) });
    vendor.push({ icon: <X />, label: `Vendor removes ${listing.title}`, detail: 'Refused while bookings are open on it. Once gone, nobody can ask for it.', onClick: call('vendor.removeListing', listing.id) });
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
  return { vendor, desk, clock, faults };
}
