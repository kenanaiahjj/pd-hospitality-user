'use client';

import { Minus, Plus } from '@phosphor-icons/react';
import { useEffect, useRef, type ReactNode } from 'react';

/*
  Form controls after Places: each field is a rounded row that states its
  value on the right and opens in place, one at a time -- a calendar for a
  date, a wheel for a time, a stepper for a count. The form stays a short
  stack of answers instead of a wall of chips.
*/

export function ExpandableField({ label, value, aside, open, onToggle, children }: {
  label: string;
  value: ReactNode;
  /** What the row says on the right while open, e.g. "7-day window". */
  aside?: ReactNode;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <section className={`guest-field${open ? ' is-open' : ''}`}>
      <button type="button" className="guest-field__row" aria-expanded={open} onClick={onToggle}>
        <span>{label}</span>
        <b className={open ? 'guest-field__aside' : undefined}>{open ? aside : value}</b>
      </button>
      {open ? <div className="guest-field__body">{children}</div> : null}
    </section>
  );
}

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const utc = (iso: string) => new Date(`${iso}T00:00:00Z`);
const iso = (date: Date) => date.toISOString().slice(0, 10);

/** Every month the available days touch, laid out Sunday-first. */
function monthsSpanning(days: string[]) {
  const sorted = [...days].sort();
  const first = utc(sorted[0]!);
  const last = utc(sorted[sorted.length - 1]!);
  const months: { key: string; label: string; cells: (string | null)[] }[] = [];
  for (let y = first.getUTCFullYear(), m = first.getUTCMonth(); y < last.getUTCFullYear() || (y === last.getUTCFullYear() && m <= last.getUTCMonth()); m === 11 ? (y++, m = 0) : m++) {
    const start = new Date(Date.UTC(y, m, 1));
    const length = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
    const cells: (string | null)[] = Array.from({ length: start.getUTCDay() }, () => null);
    for (let d = 1; d <= length; d++) cells.push(iso(new Date(Date.UTC(y, m, d))));
    months.push({ key: `${y}-${m}`, label: start.toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' }), cells });
  }
  return months;
}

export function CalendarPicker({ available, value, onChange, labelFor }: {
  available: string[];
  value: string;
  onChange: (day: string) => void;
  /** The accessible name for a day, e.g. "Thursday · November 12". */
  labelFor: (day: string) => string;
}) {
  if (!available.length) return null;
  const open = new Set(available);
  return (
    <div className="guest-calendar">
      {monthsSpanning(available).map((month) => (
        <div key={month.key} className="guest-calendar__month">
          <p className="guest-calendar__label">{month.label}</p>
          <div className="guest-calendar__grid" role="group" aria-label={month.label}>
            {WEEKDAYS.map((day, i) => <span key={`h${i}`} className="guest-calendar__weekday" aria-hidden="true">{day}</span>)}
            {month.cells.map((day, i) => day ? (
              <button
                key={day}
                type="button"
                className={`guest-calendar__day${day === value ? ' is-active' : ''}`}
                disabled={!open.has(day)}
                aria-pressed={day === value}
                aria-label={labelFor(day)}
                onClick={() => onChange(day)}
              >
                {utc(day).getUTCDate()}
              </button>
            ) : <span key={`e${i}`} />)}
          </div>
        </div>
      ))}
    </div>
  );
}

const WHEEL_ROW = 44;

export function TimeWheel({ times, value, onChange }: { times: readonly string[]; value: string; onChange: (time: string) => void }) {
  const wheel = useRef<HTMLDivElement>(null);

  // Open on the chosen time, centred in the band.
  useEffect(() => {
    const index = times.indexOf(value);
    if (wheel.current && index >= 0) wheel.current.scrollTop = index * WHEEL_ROW;
    // Only on open: scrolling the wheel changes `value` itself.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="guest-wheel">
      <span className="guest-wheel__band" aria-hidden="true" />
      <div
        ref={wheel}
        className="guest-wheel__scroll"
        role="listbox"
        aria-label="Time"
        onScroll={(event) => {
          const next = times[Math.round(event.currentTarget.scrollTop / WHEEL_ROW)];
          if (next && next !== value) onChange(next);
        }}
      >
        {times.map((time, i) => (
          <button
            key={time}
            type="button"
            role="option"
            aria-selected={time === value}
            className={`guest-wheel__item${time === value ? ' is-active' : ''}`}
            onClick={() => {
              onChange(time);
              wheel.current?.scrollTo({ top: i * WHEEL_ROW, behavior: 'smooth' });
            }}
          >
            {time}
          </button>
        ))}
      </div>
    </div>
  );
}

export function StepperField({ label, value, min, max, onChange, unit }: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  /** Singular, for the buttons' names: "guest". */
  unit: string;
}) {
  return (
    <div className="guest-field guest-field--stepper" role="group" aria-label={label}>
      <div className="guest-field__row">
        <span>{label}</span>
        <span className="guest-stepper">
          <button type="button" aria-label={`Fewer ${unit}s`} disabled={value <= min} onClick={() => onChange(value - 1)}><Minus aria-hidden="true" /></button>
          <output aria-live="polite">{value}</output>
          <button type="button" aria-label={`More ${unit}s`} disabled={value >= max} onClick={() => onChange(value + 1)}><Plus aria-hidden="true" /></button>
        </span>
      </div>
    </div>
  );
}
