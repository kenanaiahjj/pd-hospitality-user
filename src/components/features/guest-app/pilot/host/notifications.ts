import type { GuestNotification, ServiceBooking } from '../../prototype-model';
import type { Notification } from '../types';
import type { Host } from './host';

/*
  What the engine tells the guest, said the way the app says things. The engine
  records who was told what and by which channel; this gives each one its words
  and the booking it opens. A push the guest has switched off was never
  delivered, so it is not shown; the text message that follows is.
*/

type Words = { title: string; body: string };

function wordsFor(topic: string, title: string, card: boolean): Words | undefined {
  switch (topic) {
    case 'accepted': return card ? { title: `${title} accepted`, body: 'The vendor said yes. Pay now to keep your slot.' } : { title: `${title} confirmed`, body: 'The vendor said yes. It is charged to your room.' };
    case 'cancel-accepted': return { title: `${title} cancelled`, body: 'The vendor accepted your cancellation. Everything is undone.' };
    case 'approval-declined': return { title: 'Pay in full or cancel', body: `The front desk could not charge ${title} to your room.` };
    case 'confirmed': return { title: `${title} confirmed`, body: 'Your payment came through.' };
    case 'declined': return { title: `${title} not available`, body: 'Nothing was charged. Pick another time.' };
    case 'lapsed': return { title: `${title} was not answered`, body: 'The vendor did not answer in time. Nothing was charged.' };
    case 'payment-expired': return { title: `${title}: payment expired`, body: 'The slot was released. Nothing was charged.' };
    case 'vendor-cancelled': return { title: `${title} was cancelled`, body: 'The vendor cancelled it. Everything is undone; pick another time.' };
    case 'pay-or-cancel': return { title: 'Pay in full or cancel', body: `The front desk has not answered about ${title}.` };
    case 'approved': return { title: `${title} approved`, body: 'The front desk approved charging it to your room.' };
    case 'ready': return { title: `${title} is ready`, body: 'Held for you at the front desk.' };
    case 'stay-changed': return { title: 'Your stay changed', body: `${title} can no longer go on your room. Pay in full or cancel.` };
    case 'cancel-declined': return { title: 'Cancellation not accepted', body: `The vendor could not cancel ${title}. The booking stands.` };
    default: return undefined;
  }
}

export type EngineNews = { id: string; notification: GuestNotification; bookingTitle: string; channel: Notification['channel']; threadId?: string };

export function engineNews(host: Host, guestId: string, serviceBookings: ServiceBooking[]): EngineNews[] {
  const pilot = host.pilot;
  const mine = new Set(pilot.bookings().filter((b) => b.guestId === guestId).map((b) => b.id));
  const rows: EngineNews[] = [];
  for (const n of pilot.outbox()) {
    if (n.to !== 'guest' || !n.bookingId || !mine.has(n.bookingId)) continue;
    if (n.channel === 'push' && !n.delivered) continue;
    const booking = pilot.booking(n.bookingId);
    const title = pilot.listing(booking.listingId).title;
    const words = wordsFor(n.topic, title, booking.payMode === 'card');
    if (!words) continue;
    const record = serviceBookings.find((s) => s.engineId === n.bookingId);
    rows.push({
      id: n.id,
      channel: n.channel,
      bookingTitle: title,
      threadId: booking.threadId,
      notification: {
        id: `notification-engine-${n.id}`,
        tone: 'booking',
        title: words.title,
        body: n.channel === 'sms' ? `Text message · ${words.body}` : words.body,
        time: 'Just now',
        screen: 'stay-entry',
        entryId: record?.id,
      },
    });
  }
  return rows.reverse();
}
