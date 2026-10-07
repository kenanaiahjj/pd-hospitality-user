import type { Listing, Vendor } from './types';

/*
  The pilot property's vendors and listings: The Henry Resort Dumaguete.

  Real names only for the six restaurants and Cafe Sans Rival. The boat
  operator, the bike shop and Henry's own activities are simulated, so they carry
  placeholder names. Prices, capacities and opening hours are test values.

  `confirm` is the rule Ken set: charge at once, except rentals and the Apo
  Island boat trip, which ask the vendor to confirm availability first.
*/

const hours = (open: number, close: number) => ({ open: open * 60, close: close * 60 });

export const PILOT_VENDORS: Vendor[] = [
  { id: 'the-dining-room', name: 'The Dining Room', simulated: false, ...hours(10, 22) },
  { id: 'si-senor', name: 'Si Señor', simulated: false, ...hours(10, 22) },
  { id: 'popolo-pizzeria', name: 'Popolo Pizzeria', simulated: false, ...hours(10, 22) },
  { id: 'the-red-kitchen', name: 'The Red Kitchen', simulated: false, ...hours(10, 22) },
  { id: 'noelles-brunch-bar', name: 'Noelle’s Brunch Bar', simulated: false, ...hours(7, 15) },
  { id: 'coffee-collective', name: 'Coffee Collective', simulated: false, ...hours(7, 18) },
  { id: 'cafe-sans-rival', name: 'Cafe Sans Rival', simulated: false, ...hours(8, 18) },
  { id: 'boat-operator', name: 'Boat operator (simulated)', simulated: true, ...hours(6, 18) },
  { id: 'bike-shop', name: 'Bike shop (simulated)', simulated: true, ...hours(8, 18) },
  { id: 'henrys-activities', name: 'Henry’s activities (simulated)', simulated: true, ...hours(6, 20) },
];

const table = (id: string, title: string, times: string[], maxParty: number): Listing => ({
  id,
  vendorId: id,
  kind: 'table',
  title,
  confirm: 'instant',
  unitPrice: 0,
  /** Tables the venue will give Cabana at any one time. */
  capacity: 8,
  times,
  maxParty,
  freeCancelHours: Number.POSITIVE_INFINITY,
  durationMin: 90,
  menuPdf: `/pilot/menus/${id}.pdf`,
});

export const PILOT_LISTINGS: Listing[] = [
  table('the-dining-room', 'The Dining Room', ['12:00', '18:00', '19:00', '20:00'], 10),
  table('si-senor', 'Si Señor', ['18:00', '19:00', '20:00'], 10),
  table('popolo-pizzeria', 'Popolo Pizzeria', ['12:00', '18:30', '19:30'], 10),
  table('the-red-kitchen', 'The Red Kitchen', ['18:00', '19:00'], 8),
  table('noelles-brunch-bar', 'Noelle’s Brunch Bar', ['08:00', '10:00', '12:00'], 10),
  table('coffee-collective', 'Coffee Collective', ['08:00', '10:00', '15:00'], 10),
  {
    id: 'sans-rival-boxes',
    vendorId: 'cafe-sans-rival',
    kind: 'goods',
    title: 'Cafe Sans Rival pasalubong',
    confirm: 'instant',
    unitPrice: 450,
    /** Boxes in stock for a day. */
    capacity: 120,
    times: [],
    orderCap: 50,
    freeCancelHours: 24,
    durationMin: 0,
  },
  {
    id: 'apo-island-trip',
    vendorId: 'boat-operator',
    kind: 'service',
    title: 'Apo Island boat trip',
    confirm: 'vendor',
    unitPrice: 1600,
    capacity: 8,
    times: ['07:30', '13:30'],
    freeCancelHours: 24,
    durationMin: 360,
  },
  {
    id: 'bike-rental',
    vendorId: 'bike-shop',
    kind: 'rental',
    title: 'Bike rental',
    confirm: 'vendor',
    unitPrice: 450,
    /** Bikes a day. */
    capacity: 6,
    times: ['08:00', '09:00', '10:00'],
    freeCancelHours: 24,
    durationMin: 480,
  },
  {
    id: 'yoga-class',
    vendorId: 'henrys-activities',
    kind: 'service',
    title: 'Yoga class',
    confirm: 'instant',
    unitPrice: 500,
    capacity: 12,
    times: ['06:30'],
    freeCancelHours: 12,
    durationMin: 60,
  },
  {
    id: 'walking-tour',
    vendorId: 'henrys-activities',
    kind: 'service',
    title: 'Walking tour',
    confirm: 'instant',
    unitPrice: 800,
    capacity: 10,
    times: ['08:00'],
    freeCancelHours: 12,
    durationMin: 150,
  },
  {
    id: 'diving',
    vendorId: 'henrys-activities',
    kind: 'service',
    title: 'Diving',
    confirm: 'instant',
    unitPrice: 3500,
    capacity: 6,
    times: ['07:00'],
    freeCancelHours: 48,
    durationMin: 240,
  },
];

/**
 * Dates the scenarios and the demo share. The simulation starts Wednesday 7 Oct
 * 2026 at 10:00; "the Friday trip" is `SCENE.fri`.
 */
export const SCENE = {
  today: '2026-10-07',
  thu: '2026-10-08',
  fri: '2026-10-09',
  sat: '2026-10-10',
  sun: '2026-10-11',
  mon: '2026-10-12',
  tue: '2026-10-13',
  wed: '2026-10-14',
  /** Wednesday 7 Oct 2026, 10:00, hotel-local ms. */
  start: Date.UTC(2026, 9, 7, 10, 0),
} as const;
