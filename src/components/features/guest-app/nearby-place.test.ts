import { describe, expect, it } from 'vitest';
import { directionsUrl, openStatus, walkLabel } from './nearby-place';

/*
  Ways these could mislead a guest:
  1. A walk time for a place with no stated distance (a guess dressed as fact).
  2. "0 min walk" for somewhere next door.
  3. "Open" at 9:30 PM for a place that shuts at 9.
  4. "Open" on a Monday for a Tue–Sun place.
  5. Hours in a shape we do not parse ("By appointment") shown as closed.
  6. An evening close ("10:00 PM") read as 10 in the morning.
*/

// 2026-11-11 is a Wednesday; 2026-11-09 a Monday.
const WED = '2026-11-11';
const MON = '2026-11-09';

describe('walkLabel', () => {
  it('turns the stated distance into minutes at an easy pace', () => {
    expect(walkLabel('280 m away')).toBe('4 min walk');
    expect(walkLabel('1.2 km away')).toBe('15 min walk');
  });

  it('never says zero, and says nothing without a distance', () => {
    expect(walkLabel('40 m away')).toBe('1 min walk');
    expect(walkLabel(undefined)).toBeUndefined();
    expect(walkLabel('Nearby')).toBeUndefined();
  });
});

describe('openStatus', () => {
  it('is open inside the hours, and says until when', () => {
    expect(openStatus('Daily · 6:00 AM–9:00 PM', WED, 19)).toEqual({ open: true, label: 'Open · until 9 PM' });
  });

  it('is closed after the close and before the open', () => {
    expect(openStatus('Daily · 6:00 AM–9:00 PM', WED, 21)).toEqual({ open: false, label: 'Closed · opens 6 AM' });
    expect(openStatus('Daily · 6:00 AM–9:00 PM', WED, 5)).toEqual({ open: false, label: 'Closed · opens 6 AM' });
  });

  it('knows a day the place does not open', () => {
    expect(openStatus('Tue–Sun · 11:00 AM–10:00 PM', MON, 14)).toEqual({ open: false, label: 'Closed today' });
    expect(openStatus('Tue–Sun · 11:00 AM–10:00 PM', WED, 21)).toEqual({ open: true, label: 'Open · until 10 PM' });
    expect(openStatus('Friday–Sunday · 10:00 AM–7:00 PM', WED, 12)).toEqual({ open: false, label: 'Closed today' });
  });

  it('reads the prefixes the catalogue uses', () => {
    expect(openStatus('Tours daily · 8:00 AM–5:00 PM', WED, 9)?.open).toBe(true);
    expect(openStatus('Daily departures · 4:00 PM–8:00 PM', WED, 17)?.open).toBe(true);
    expect(openStatus('Mon–Sun · 10:00 AM–10:00 PM', MON, 10)?.open).toBe(true);
  });

  it('says nothing about hours it cannot read', () => {
    expect(openStatus('By appointment', WED, 12)).toBeUndefined();
  });
});

describe('directionsUrl', () => {
  it('routes to the address, encoded', () => {
    expect(directionsUrl('9 Mabini Street, Manila')).toBe('https://www.google.com/maps/dir/?api=1&destination=9%20Mabini%20Street%2C%20Manila');
  });
});
