import { SCENE as S } from '../catalog';
import { draft, type Scenario } from './kit';

const G = 'Vendors and listings' as const;
const trip = (extra = {}) => draft('apo-island-trip', S.fri, 2, { time: '07:30', payMode: 'room', ...extra });
const bike = (extra = {}) => draft('bike-rental', S.sat, 2, { time: '08:00', days: 1, payMode: 'room', ...extra });

export const VENDORS: Scenario[] = [
  {
    id: 'V1',
    group: G,
    title: 'Vendor sets Away',
    run(c) {
      const { p } = c;
      c.step('The shop has one open booking, then sets Away', () => {
        const id = c.ask(bike());
        p.vendor('bike-shop').setAway(true);
        c.refused(p.guest().request(bike({ date: S.sun })), 'unavailable');
        c.eq(p.booking(id).status, 'requested', 'the open booking is untouched');
        c.must(p.vendor('bike-shop').confirm(id));
        c.eq(p.booking(id).status, 'confirmed', 'it can still be answered');
      });
    },
  },
  {
    id: 'V2',
    group: G,
    title: 'Remove a listing that has bookings',
    run(c) {
      const { p } = c;
      c.step('Two confirmed bookings block the removal', () => {
        const a = c.ask(bike());
        const ben = p.addGuest({ firstName: 'Ben', room: 'Villa 14', checkIn: '2026-10-05', checkOut: S.tue });
        const b = (p.guest(ben.guestId).request(bike()) as { ok: true; bookingId: string }).bookingId;
        c.must(p.vendor('bike-shop').confirm(a));
        c.must(p.vendor('bike-shop').confirm(b));
        c.refused(p.vendor('bike-shop').removeListing('bike-rental'), 'blocked', '2');
        c.must(p.vendor('bike-shop').cancel(a, 'Closing this listing'));
        c.must(p.vendor('bike-shop').cancel(b, 'Closing this listing'));
        c.must(p.vendor('bike-shop').removeListing('bike-rental'));
      });
    },
  },
  {
    id: 'V3',
    group: G,
    title: 'Block a slot that is booked',
    run(c) {
      const { p } = c;
      const key = p.slotKeyFor('apo-island-trip', S.fri, '07:30');
      const ids: string[] = [];
      c.step('A slot with 3 bookings cannot be blocked', () => {
        for (let i = 0; i < 3; i++) {
          const g = i === 0 ? { guestId: p.maria.guestId } : p.addGuest({ firstName: `Guest ${i}`, room: `Villa ${30 + i}`, checkIn: '2026-10-05', checkOut: S.tue });
          ids.push((p.guest(g.guestId).request(trip({ qty: 1 })) as { ok: true; bookingId: string }).bookingId);
        }
        c.refused(p.vendor('boat-operator').blockSlot('apo-island-trip', key), 'blocked', '3');
      });
      c.step('Once they are cancelled the slot can be blocked, and takes no more requests', () => {
        for (const id of ids) c.must(p.vendor('boat-operator').cancel(id, 'Boat out of service'));
        c.must(p.vendor('boat-operator').blockSlot('apo-island-trip', key));
        c.refused(p.guest().request(trip({ qty: 1 })), 'unavailable');
      });
    },
  },
  {
    id: 'V4',
    group: G,
    title: 'Owner and staff both tap Confirm',
    run(c) {
      const { p } = c;
      c.step('Both tap in the same second', () => {
        const id = c.ask(bike());
        const [a, b] = p.together(
          () => p.vendor('bike-shop').confirm(id, { name: 'Rico', role: 'owner' }),
          () => p.vendor('bike-shop').confirm(id, { name: 'Jun', role: 'staff' }),
        );
        c.must(a);
        c.refused(b, 'already-actioned');
        c.eq(p.booking(id).lastActor?.name, 'Rico', 'the owner sees who confirmed');
      });
    },
  },
  {
    id: 'V5',
    group: G,
    title: 'QR scan with no signal, cache present',
    run(c) {
      const { p } = c;
      let id = '';
      c.step('Today’s and tomorrow’s bookings are cached on the shop’s phone', () => {
        id = c.ask(bike({ date: S.sat }));
        c.must(p.vendor('bike-shop').confirm(id));
        p.advanceTo(p.at(S.sat, '07:50'));
        p.vendor('bike-shop').cacheBookings();
      });
      c.step('The shop scans offline; In progress is queued and synced later', () => {
        p.vendor('bike-shop').setOnline(false);
        p.advanceTo(p.at(S.sat, '08:10'));
        c.must(p.vendor('bike-shop').scan(id));
        c.eq(p.vendorState('bike-shop').pendingTaps, 1, 'queued');
        p.vendor('bike-shop').setOnline(true);
        c.eq(p.vendorState('bike-shop').pendingTaps, 0, 'synced');
        c.eq(p.booking(id).status, 'in-progress', 'In progress');
      });
    },
  },
  {
    id: 'V6',
    group: G,
    title: 'QR scan with no signal, no cache',
    run(c) {
      const { p } = c;
      c.step('The shop never opened the app today; it scans offline', () => {
        const id = c.ask(bike());
        c.must(p.vendor('bike-shop').confirm(id));
        p.vendor('bike-shop').setOnline(false);
        p.advanceTo(p.at(S.sat, '08:10'));
        c.refused(p.vendor('bike-shop').scan(id), 'no-cache', 'name and room');
        c.eq(c.must(p.vendor('bike-shop').lookup('Maria', 'Villa 12')).bookingId, id, 'lookup by guest name and room works');
      });
    },
  },
  {
    id: 'V7',
    group: G,
    title: 'Guest’s phone is dead',
    run(c) {
      const { p } = c;
      c.step('She arrives with no QR; the vendor finds the booking by name and room', () => {
        const id = c.ask(bike());
        c.must(p.vendor('bike-shop').confirm(id));
        p.advanceTo(p.at(S.sat, '08:05'));
        const found = c.must(p.vendor('bike-shop').lookup('Maria', 'Villa 12'));
        c.eq(found.bookingId, id, 'found');
        c.must(p.vendor('bike-shop').scan(found.bookingId));
        c.eq(p.booking(id).status, 'in-progress', 'In progress');
      });
    },
  },
];
