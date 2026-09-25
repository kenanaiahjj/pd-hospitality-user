/*
  What a Places card says under a place's name: how far on foot, and
  whether it is open now. Both are read from the catalogue's own strings --
  "280 m away", "Tue–Sun · 11:00 AM–10:00 PM" -- so nothing new has to be
  stored, and a string that cannot be read says nothing rather than guess.
*/

/** "280 m away" or "1.2 km away" as metres; undefined when it says neither. */
export function parseDistanceMetres(distance?: string): number | undefined {
  const match = distance?.match(/([\d.]+)\s*(km|m)\b/);
  if (!match) return undefined;
  const value = Number(match[1]);
  return match[2] === 'km' ? value * 1000 : value;
}

/** An easy city pace, lights and all. */
const METRES_PER_MINUTE = 80;

export function walkLabel(distance?: string): string | undefined {
  const metres = parseDistanceMetres(distance);
  if (metres === undefined) return undefined;
  return `${Math.max(1, Math.round(metres / METRES_PER_MINUTE))} min walk`;
}

const DAY_INDEX: Record<string, number> = {
  sun: 0, sunday: 0, mon: 1, monday: 1, tue: 2, tuesday: 2, wed: 3, wednesday: 3,
  thu: 4, thursday: 4, fri: 5, friday: 5, sat: 6, saturday: 6,
};

/** Which weekdays the hours cover; every day when they only say "daily". */
function openDays(days: string): Set<number> | undefined {
  if (/daily/i.test(days)) return new Set([0, 1, 2, 3, 4, 5, 6]);
  const range = days.toLowerCase().match(/([a-z]+)\s*[–-]\s*([a-z]+)/);
  if (!range) return undefined;
  const from = DAY_INDEX[range[1]!];
  const to = DAY_INDEX[range[2]!];
  if (from === undefined || to === undefined) return undefined;
  const set = new Set<number>();
  for (let day = from; ; day = (day + 1) % 7) {
    set.add(day);
    if (day === to) break;
  }
  return set;
}

/** "9:00 PM" as hours since midnight. */
function clockHours(time: string): number | undefined {
  const match = time.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!match) return undefined;
  const hour = Number(match[1]) % 12 + (match[3]!.toUpperCase() === 'PM' ? 12 : 0);
  return hour + Number(match[2]) / 60;
}

/** "9 PM", or "9:30 PM" when it is not on the hour. */
const shortTime = (time: string) => time.replace(':00', '').trim();

export type OpenStatus = { open: boolean; label: string };

/**
 * Open or closed at `hour` on `date` (ISO), from hours written as
 * "<days> · <open>–<close>". Undefined when the hours are in any other shape.
 */
export function openStatus(hours: string, date: string, hour: number): OpenStatus | undefined {
  const [days, span] = hours.split('·').map((part) => part.trim());
  const times = span?.split(/[–-]/).map((part) => part.trim());
  if (!days || !times || times.length !== 2) return undefined;
  const opens = clockHours(times[0]!);
  const closes = clockHours(times[1]!);
  const week = openDays(days);
  if (opens === undefined || closes === undefined || !week) return undefined;

  const weekday = new Date(`${date}T12:00:00`).getDay();
  if (!week.has(weekday)) return { open: false, label: 'Closed today' };
  if (hour >= opens && hour < closes) return { open: true, label: `Open · until ${shortTime(times[1]!)}` };
  return { open: false, label: `Closed · opens ${shortTime(times[0]!)}` };
}

export const directionsUrl = (address: string) =>
  `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`;
