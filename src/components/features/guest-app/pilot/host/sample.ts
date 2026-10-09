import { giftListingId } from './catalog';
import { WORST, worstCaseOn } from './worst-case';
import type { Host, StayInput } from './host';

/*
  A stay that already has a life in it. Opening Messages on a brand-new demo
  stay showed an empty list, and every vendor and desk trigger had nothing to
  act on. This books a handful of things through the engine, exactly as a guest
  and the people they deal with would have, so each state is there to look at:
  a vendor who never answered, a confirmed rental with a message from the
  shop, a request still waiting, a table, an order ready at the desk, and a
  session the desk booked for a guest who asked in person.

  Everything goes through `host.call`, so it is on the record and a reload
  rebuilds it. The desk chat's side of the story is derived from the same
  record (see `sampleDeskChat`), never stored separately.
*/

const DAY = 86_400_000;
const isoOf = (ms: number) => new Date(ms).toISOString().slice(0, 10);

export const SAMPLE_STAFF = 'Marites';

type SampleMeta = { trainer?: string };
const metaKey = (appBookingId: string) => `seed:${appBookingId}`;

/** Whether this stay has had its sample content (or had it cleared on purpose). */
export const sampleState = (host: Host, appBookingId: string): 'none' | 'cleared' | 'seeded' => {
  const raw = host.meta[metaKey(appBookingId)];
  return raw === undefined ? 'none' : raw === 'cleared' ? 'cleared' : 'seeded';
};

export function markSampleCleared(host: Host, appBookingId: string) {
  host.setMeta(metaKey(appBookingId), 'cleared');
}

/** Book the sample content for a stay that is under way with at least a day left. Does nothing otherwise. */
export function seedSample(host: Host, stay: StayInput): boolean {
  const guest = host.guestOf(stay.id);
  if (!guest) return false;
  const pilot = host.pilot;
  const today = isoOf(pilot.now());
  const tomorrow = isoOf(pilot.now() + DAY);
  if (stay.status !== 'in-house' || tomorrow > stay.checkOut) return false;
  const vendorOf = (listingId: string) => pilot.listing(listingId).vendorId;
  const request = (draft: Record<string, unknown>) => host.call<{ ok: boolean; bookingId: string }>('guest.request', guest.guestId, { origin: 'app', ...draft });
  const meta: SampleMeta = {};

  // A scooter nobody answered: the vendor's half hour ran out.
  const scooter = request({ listingId: 'scooter', date: tomorrow, time: '10:00', qty: 1, payMode: 'room' });
  if (scooter.ok) host.call('pilot.advanceTo', pilot.now() + 31 * 60_000);

  // Two bicycles, confirmed, with a word from the shop. (The desk's word on it is in the desk's own chat.)
  const worst = worstCaseOn();
  const bikes = request({ listingId: 'rental', date: tomorrow, time: '13:30', qty: 2, payMode: 'room', note: worst ? WORST.bikeNote : 'One with a child seat, if you have it.' });
  if (bikes.ok) {
    host.call('vendor.confirm', vendorOf('rental'), bikes.bookingId);
    for (const text of worst ? WORST.bikeMessages : ['Two bikes are set for you. The child seat is on the second one, and helmets are in the basket.']) {
      host.call('vendor.message', vendorOf('rental'), pilot.booking(bikes.bookingId).threadId, text);
    }
  }

  // An island tour still waiting on the operator.
  const tour = request({ listingId: 'tour', date: tomorrow, time: '10:00', qty: 2, payMode: 'room', note: worst ? WORST.tourNote : 'The early boat, if there is a choice.' });
  // In the worst case the operator says yes too, so a long-named tour has a chat to look at.
  if (worst && tour.ok) host.call('vendor.confirm', vendorOf('tour'), tour.bookingId);

  // A table by the pool.
  request({ listingId: 'poolside-bar', date: tomorrow, time: '12:00', qty: 4 });

  // Coffee to take home, held for the day they leave, and ready at the desk.
  const coffee = giftListingId('Single-origin Philippine coffee');
  if (coffee) {
    const order = request({ listingId: coffee, date: stay.checkOut, qty: 2, payMode: 'room' });
    if (order.ok) host.call('desk.markReady', order.bookingId);
  }

  // A session the desk booked for a guest who asked in person.
  const trainer = host.call<{ ok: boolean; bookingId: string }>('desk.bookFor', guest.guestId, { listingId: 'trainer', date: tomorrow, time: '10:00', qty: 1, payMode: 'room' }, { staffName: SAMPLE_STAFF, asked: 'in-person' });
  if (trainer.ok) meta.trainer = trainer.bookingId;

  void today;
  host.setMeta(metaKey(stay.id), JSON.stringify(meta));
  return true;
}

export type SampleChatMessage = { from: 'guest' | 'desk'; body: string; state: string; engineBookingId?: string };

/** The front desk's side of the sample: what was said in the desk chat. Empty when there is no sample. */
export function sampleDeskChat(host: Host, appBookingId: string): SampleChatMessage[] {
  if (sampleState(host, appBookingId) !== 'seeded') return [];
  let meta: SampleMeta = {};
  try {
    meta = JSON.parse(host.meta[metaKey(appBookingId)] ?? '{}') as SampleMeta;
  } catch {
    meta = {};
  }
  const lines: SampleChatMessage[] = [
    { from: 'desk', body: `Good afternoon, and welcome to The Henry Manila. This is ${SAMPLE_STAFF} at the front desk. Message me any time.`, state: 'Seen' },
    { from: 'guest', body: 'Hi! Could we have a late checkout on Thursday, if it is possible?', state: 'Seen' },
    { from: 'desk', body: 'Of course. I have noted it. I can offer 2:00 PM at no charge, and I will confirm tomorrow morning.', state: 'Seen' },
    { from: 'desk', body: 'Your bicycles from Sakay Rentals are set for tomorrow. I also passed on the child seat request.', state: 'Seen' },
  ];
  if (meta.trainer) {
    lines.push({ from: 'guest', body: 'Could you also book me a training session? I asked at the desk earlier.', state: 'Seen' });
    lines.push({ from: 'desk', body: `Booked by ${SAMPLE_STAFF} at the front desk, as you asked.`, state: 'Seen', engineBookingId: meta.trainer });
  }
  return lines;
}
