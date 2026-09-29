import { countNightsBetween } from '../prototype-model';

/* Labels the booking screens share. Dates are ISO days read in UTC, so a
   device in another timezone cannot shift "Dec 11" to "Dec 10". */

const utc = (iso: string) => new Date(`${iso}T00:00:00Z`);

export const shortDate = (iso: string) => utc(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
export const weekdayDate = (iso: string) => utc(iso).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' });
export const longDate = (iso: string) => utc(iso).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', timeZone: 'UTC' });

export const nightsLabel = (checkIn: string, checkOut: string) => {
  const nights = countNightsBetween(checkIn, checkOut);
  return `${nights} ${nights === 1 ? 'night' : 'nights'}`;
};

/** "Dec 11 – Dec 14 · 3 nights" */
export const stayDatesLabel = (checkIn: string, checkOut: string) => `${shortDate(checkIn)} – ${shortDate(checkOut)} · ${nightsLabel(checkIn, checkOut)}`;

export const childAgeLabel = (age: number) => (age === 0 ? 'Under 1' : `${age} ${age === 1 ? 'year' : 'years'}`);

export const roomsLabel = (count: number) => `${count} ${count === 1 ? 'room' : 'rooms'}`;

/** "Dec 11 – 14" within a month, "Dec 30 – Jan 2" across one. */
export const compactRange = (checkIn: string, checkOut: string) =>
  checkIn.slice(0, 7) === checkOut.slice(0, 7) ? `${shortDate(checkIn)} – ${utc(checkOut).getUTCDate()}` : `${shortDate(checkIn)} – ${shortDate(checkOut)}`;
