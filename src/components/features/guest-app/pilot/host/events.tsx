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
};

export function buildPilotEvents({ host, stayId, canShortenStay, shortenStay, cancelStay, deskMessage, deskBooks }: EventContext): { vendor: PrototypeEvent[]; desk: PrototypeEvent[]; clock: PrototypeEvent[]; faults: PrototypeEvent[] } {
  const pilot = host.pilot;
  const guest = host.guestOf(stayId);
  const vendor: PrototypeEvent[] = [];
  const desk: PrototypeEvent[] = [];
  const clock: PrototypeEvent[] = [];
  const faults: PrototypeEvent[] = [];
  if (!guest) return { vendor, desk, clock, faults };

  const call = (path: string, ...args: unknown[]) => () => {
    host.call<Result>(path, ...args);
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
    }
    if (b.status === 'requested') {
      vendor.push({ icon: <WarningCircle />, label: `Guest withdraws and vendor confirms ${name} at the same instant`, detail: 'One wins; the other is told who got there first.', onClick: call('race.withdrawAndConfirm', guest.guestId, vendorId, b.id) });
    }
  }

  desk.push({ icon: <Check />, label: 'Desk books a session for the guest, asked in person', detail: 'The guest told the desk, who booked it and noted who. It shows as a card in the front desk chat.', onClick: deskBooks });
  desk.push({ icon: <ChatCircleDots />, label: 'Desk sends a message in the chat', detail: 'Into the front desk thread, as the desk.', onClick: deskMessage });
  desk.push({ icon: <WarningCircle />, label: 'Desk shortens the stay by a day', detail: 'Bookings after the new checkout can no longer go on the room: the guest is asked to pay in full or cancel.', onClick: shortenStay, unavailable: canShortenStay ? undefined : 'Needs a stay with more than one night' });
  desk.push({ icon: <X />, label: 'Desk cancels the stay', detail: 'Every booking on it is cancelled and released.', onClick: cancelStay });

  for (const task of pilot.tasks('open')) {
    desk.push({ icon: <WarningCircle />, label: `Desk queue: ${task.kind}`, detail: `${task.detail} Resolving it does what the desk would.`, onClick: call('desk.resolveTask', task.id) });
  }

  // Which vendors are in play, for the offline switch.
  const vendorIds = [...new Set(live.map((b) => pilot.listing(b.listingId).vendorId))];
  for (const id of vendorIds) {
    const state = pilot.vendorState(id);
    const name = pilot.vendors().find((v) => v.id === id)?.name ?? id;
    vendor.push({ icon: <WifiSlash />, label: state.online ? `${name} loses signal` : `${name} is back online`, detail: state.online ? 'Taps are kept on its phone and sent when it reconnects.' : 'Queued taps are sent now.', onClick: call('vendor.setOnline', id, !state.online) });
  }

  for (const [label, minutes] of [['15 minutes', 15], ['an hour', 60], ['4 hours', 240], ['a day', 1440]] as const) {
    clock.push({ icon: <Clock />, label: `Move the clock on ${label}`, detail: 'Timers fire in order: vendor windows, card windows, holds, reminders.', onClick: call('pilot.advanceTo', host.now() + minutes * MIN) });
  }

  faults.push({ icon: <WarningCircle />, label: `Hotel system: ${pilot.pms.mode === 'up' ? 'working' : pilot.pms.mode === 'down' ? 'down' : 'refusing charges'}`, detail: 'Tap to change: working, down, refusing. Room charges queue and retry.', onClick: call('pilot.setPms', { mode: pilot.pms.mode === 'up' ? 'down' : pilot.pms.mode === 'down' ? 'reject' : 'up' }) });
  faults.push({ icon: <WarningCircle />, label: `Hotel system loses its next reply: ${pilot.pms.dropNextReply ? 'on' : 'off'}`, detail: 'The charge lands but the reply is lost. The retry must not charge twice.', onClick: call('pilot.setPms', { dropNextReply: !pilot.pms.dropNextReply }) });
  faults.push({ icon: <WarningCircle />, label: `Hotel system refuses reversals: ${pilot.pms.refuseReversal ? 'on' : 'off'}`, detail: 'A cancelled room charge cannot be taken off. It goes to the desk.', onClick: call('pilot.setPms', { refuseReversal: !pilot.pms.refuseReversal }) });
  faults.push({ icon: <WarningCircle />, label: `Payment gateway: ${pilot.gateway.mode === 'ok' ? 'working' : pilot.gateway.mode === 'fail' ? 'failing' : 'guest walks away'}`, detail: 'Tap to change: working, failing, walks away. Three tries, then the slot is released.', onClick: call('pilot.setGateway', { mode: pilot.gateway.mode === 'ok' ? 'fail' : pilot.gateway.mode === 'fail' ? 'abandon' : 'ok' }) });
  faults.push({ icon: <WarningCircle />, label: `Gateway loses payment callbacks: ${pilot.gateway.loseCallbacks ? 'on' : 'off'}`, detail: 'The guest pays, the app is not told. The two-minute check finds it.', onClick: call('pilot.setGateway', { loseCallbacks: !pilot.gateway.loseCallbacks }) });
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
