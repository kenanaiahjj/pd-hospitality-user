'use client';

import { Buildings, CalendarBlank, MagnifyingGlass, MapPin, Minus, Plus, Users, X } from '@phosphor-icons/react';
import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { PROTOTYPE_TODAY, countNightsBetween } from '../prototype-model';
import type { StaySearch } from './model';
import { ANYWHERE, MAX_ADULTS, MAX_CHILDREN, MAX_NIGHTS, STAY_HOTELS, STAY_LOCATIONS, addDays, partyLabel, validSearchDates } from './model';
import { childAgeLabel, longDate, shortDate, stayDatesLabel } from './format';

/*
  The search, as the booking apps have taught everyone to read it: where,
  when, who, then one button. Each row opens in place, one at a time, so the
  card stays a short stack of answers on a phone. Children need an age before
  the search runs -- it decides whether they count toward a room's beds.
*/

type Panel = 'where' | 'when' | 'who' | null;
/** A child whose age has not been chosen yet. */
const NO_AGE = -1;

export function StaySearchCard({ value, onSearch, submitLabel = 'Search hotels', title }: {
  value: StaySearch;
  onSearch: (search: StaySearch) => void;
  submitLabel?: string;
  title?: ReactNode;
}) {
  const [draft, setDraft] = useState<StaySearch>(value);
  const [panel, setPanel] = useState<Panel>(null);
  const [tried, setTried] = useState(false);
  const toggle = (next: Panel) => setPanel((current) => (current === next ? null : next));

  const missingAge = draft.childAges.some((age) => age === NO_AGE);
  const datesOk = validSearchDates(draft);
  const canSearch = !missingAge && datesOk && draft.location.trim().length > 0;

  const submit = () => {
    setTried(true);
    if (!canSearch) {
      setPanel(missingAge ? 'who' : !datesOk ? 'when' : 'where');
      return;
    }
    setPanel(null);
    onSearch({ ...draft, location: draft.location.trim() });
  };

  return (
    <section className="sb-search" aria-label="Search for a stay">
      {title ? <div className="sb-search__title">{title}</div> : null}
      <SearchRow icon={<MapPin />} label="Where" value={draft.location || 'Choose a destination'} open={panel === 'where'} onToggle={() => toggle('where')}>
        <LocationPicker
          value={draft.location}
          onChange={(location) => setDraft((current) => ({ ...current, location }))}
          onPick={(location) => { setDraft((current) => ({ ...current, location })); setPanel('when'); }}
        />
      </SearchRow>
      <SearchRow icon={<CalendarBlank />} label="When" value={datesOk ? stayDatesLabel(draft.checkIn, draft.checkOut) : 'Choose dates'} open={panel === 'when'} onToggle={() => toggle('when')}>
        <RangeCalendar
          checkIn={draft.checkIn}
          checkOut={draft.checkOut}
          onChange={(checkIn, checkOut) => setDraft((current) => ({ ...current, checkIn, checkOut }))}
        />
      </SearchRow>
      <SearchRow icon={<Users />} label="Who" value={partyLabel(draft)} open={panel === 'who'} onToggle={() => toggle('who')}>
        <GuestsPanel
          adults={draft.adults}
          childAges={draft.childAges}
          showErrors={tried}
          onChange={(adults, childAges) => setDraft((current) => ({ ...current, adults, childAges }))}
        />
      </SearchRow>
      {tried && !canSearch ? (
        <p className="sb-error" role="alert">
          {missingAge ? 'Add each child’s age to see rooms that fit.' : !datesOk ? 'Choose a check-out date after check-in.' : 'Choose where you want to stay.'}
        </p>
      ) : null}
      <button className="guest-button guest-button--primary sb-search__submit" type="button" onClick={submit}>
        <MagnifyingGlass aria-hidden="true" />{submitLabel}
      </button>
    </section>
  );
}

function SearchRow({ icon, label, value, open, onToggle, children }: { icon: ReactNode; label: string; value: string; open: boolean; onToggle: () => void; children: ReactNode }) {
  const id = useId();
  return (
    <div className={`sb-search__row${open ? ' is-open' : ''}`}>
      <button type="button" className="sb-search__head" aria-expanded={open} aria-controls={id} onClick={onToggle}>
        <span className="sb-search__icon" aria-hidden="true">{icon}</span>
        <span className="sb-search__text"><small>{label}</small><b>{value}</b></span>
      </button>
      {open ? <div className="sb-search__body" id={id}>{children}</div> : null}
    </div>
  );
}

function LocationPicker({ value, onChange, onPick }: { value: string; onChange: (value: string) => void; onPick: (value: string) => void }) {
  const query = value.trim().toLowerCase();
  const typed = query && query !== ANYWHERE.toLowerCase();
  const places = STAY_LOCATIONS.filter((place) => !typed || place.label.toLowerCase().includes(query) || place.detail.toLowerCase().includes(query));
  const hotels = typed ? STAY_HOTELS.filter((hotel) => hotel.name.toLowerCase().includes(query) || hotel.area.toLowerCase().includes(query)) : [];
  return (
    <div className="sb-location">
      <label className="sb-location__input">
        <span className="sr-only">Destination or hotel</span>
        <MagnifyingGlass aria-hidden="true" />
        <input
          value={value === ANYWHERE ? '' : value}
          placeholder="City, island or hotel"
          autoComplete="off"
          onChange={(event) => onChange(event.currentTarget.value)}
          onKeyDown={(event) => { if (event.key === 'Enter' && value.trim()) onPick(value.trim()); }}
        />
        {value && value !== ANYWHERE ? <button type="button" aria-label="Clear destination" onClick={() => onChange(ANYWHERE)}><X /></button> : null}
      </label>
      <ul className="sb-location__list" aria-label="Suggestions">
        {places.map((place) => (
          <li key={place.label}>
            <button type="button" onClick={() => onPick(place.label)}>
              <MapPin aria-hidden="true" /><span><b>{place.label}</b><small>{place.detail}</small></span>
            </button>
          </li>
        ))}
        {hotels.map((hotel) => (
          <li key={hotel.id}>
            <button type="button" onClick={() => onPick(hotel.name)}>
              <Buildings aria-hidden="true" /><span><b>{hotel.name}</b><small>{hotel.area}</small></span>
            </button>
          </li>
        ))}
        {!places.length && !hotels.length ? <li className="sb-location__none">No partner hotels match “{value}” yet.</li> : null}
      </ul>
    </div>
  );
}

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const utc = (iso: string) => new Date(`${iso}T00:00:00Z`);

function monthCells(year: number, month: number) {
  const start = new Date(Date.UTC(year, month, 1));
  const length = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const cells: (string | null)[] = Array.from({ length: start.getUTCDay() }, () => null);
  for (let d = 1; d <= length; d++) cells.push(new Date(Date.UTC(year, month, d)).toISOString().slice(0, 10));
  return { label: start.toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' }), cells };
}

/**
 * Two taps: check-in, then check-out. A tap before check-in, on a blocked
 * night, or across one starts over from that day. `isBlocked` marks nights
 * nobody can stay -- a hotel fully booked -- and is absent in the open search.
 */
export function RangeCalendar({ checkIn, checkOut, onChange, isBlocked, months = 4 }: {
  checkIn: string;
  checkOut: string;
  onChange: (checkIn: string, checkOut: string) => void;
  isBlocked?: (night: string) => boolean;
  months?: number;
}) {
  // Picking the second date: after a first tap, check-out waits for the next one.
  const [picking, setPicking] = useState<'in' | 'out'>('in');
  const monthsRef = useRef<HTMLDivElement>(null);
  // Open on the month of the stay, not on this month.
  useEffect(() => {
    const box = monthsRef.current;
    const month = box?.querySelector<HTMLElement>('.sb-calendar__day.is-start')?.closest<HTMLElement>('.sb-calendar__month');
    if (box && month) box.scrollTop = month.offsetTop;
    // Only on open: picking dates should not yank the view around.
  }, []);
  const first = utc(addDays(PROTOTYPE_TODAY, 1));
  const grid = Array.from({ length: months }, (_, i) => {
    const month = first.getUTCMonth() + i;
    return monthCells(first.getUTCFullYear() + Math.floor(month / 12), month % 12);
  });
  const crossesBlock = (from: string, to: string) => {
    if (!isBlocked) return false;
    for (let day = from; day < to; day = addDays(day, 1)) if (isBlocked(day)) return true;
    return false;
  };
  const pick = (day: string) => {
    if (picking === 'out' && day > checkIn && countNightsBetween(checkIn, day) <= MAX_NIGHTS && !crossesBlock(checkIn, day)) {
      onChange(checkIn, day);
      setPicking('in');
      return;
    }
    if (isBlocked?.(day)) return;
    // A lone check-in carries a one-night check-out, so the range is always valid.
    onChange(day, addDays(day, 1));
    setPicking('out');
  };
  return (
    <div className="sb-calendar">
      <p className="sb-calendar__hint" aria-live="polite">
        {picking === 'out' ? `Check-in ${shortDate(checkIn)}. Now choose check-out.` : `${shortDate(checkIn)} – ${shortDate(checkOut)}. Tap a date to change.`}
      </p>
      {isBlocked ? <p className="sb-calendar__legend"><span aria-hidden="true" />Fully booked</p> : null}
      <div ref={monthsRef} className="sb-calendar__months">
        {grid.map((month) => (
          <div key={month.label} className="sb-calendar__month">
            <p className="sb-calendar__label">{month.label}</p>
            <div className="sb-calendar__grid" role="group" aria-label={month.label}>
              {WEEKDAYS.map((day, i) => <span key={`h${i}`} className="sb-calendar__weekday" aria-hidden="true">{day}</span>)}
              {month.cells.map((day, i) => {
                if (!day) return <span key={`e${i}`} />;
                const past = day <= PROTOTYPE_TODAY;
                const blocked = !past && Boolean(isBlocked?.(day));
                const edge = day === checkIn ? ' is-start' : day === checkOut ? ' is-end' : '';
                const inside = day > checkIn && day < checkOut ? ' is-inside' : '';
                return (
                  <button
                    key={day}
                    type="button"
                    className={`sb-calendar__day${edge}${inside}${blocked ? ' is-blocked' : ''}`}
                    disabled={past || (blocked && picking === 'in')}
                    aria-pressed={day === checkIn || day === checkOut}
                    aria-label={`${longDate(day)}${day === checkIn ? ', check-in' : day === checkOut ? ', check-out' : ''}${blocked ? ', fully booked' : ''}`}
                    onClick={() => pick(day)}
                  >
                    {utc(day).getUTCDate()}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Counter({ label, detail, value, min, max, unit, onChange }: { label: string; detail: string; value: number; min: number; max: number; unit: string; onChange: (value: number) => void }) {
  return (
    <div className="sb-counter" role="group" aria-label={label}>
      <span><b>{label}</b><small>{detail}</small></span>
      <span className="sb-stepper">
        <button type="button" aria-label={`Fewer ${unit}`} disabled={value <= min} onClick={() => onChange(value - 1)}><Minus aria-hidden="true" /></button>
        <output aria-live="polite">{value}</output>
        <button type="button" aria-label={`More ${unit}`} disabled={value >= max} onClick={() => onChange(value + 1)}><Plus aria-hidden="true" /></button>
      </span>
    </div>
  );
}

export function GuestsPanel({ adults, childAges, onChange, showErrors }: { adults: number; childAges: number[]; onChange: (adults: number, childAges: number[]) => void; showErrors?: boolean }) {
  return (
    <div className="sb-guests">
      <Counter label="Adults" detail="Ages 18 and over" value={adults} min={1} max={MAX_ADULTS} unit="adults" onChange={(next) => onChange(next, childAges)} />
      <Counter
        label="Children"
        detail="Ages 0–17"
        value={childAges.length}
        min={0}
        max={MAX_CHILDREN}
        unit="children"
        onChange={(next) => onChange(adults, next > childAges.length ? [...childAges, NO_AGE] : childAges.slice(0, next))}
      />
      {childAges.length ? (
        <div className="sb-guests__ages">
          {childAges.map((age, index) => (
            <label key={index} className={`sb-field sb-guests__age${showErrors && age === NO_AGE ? ' is-invalid' : ''}`}>
              <span>Child {index + 1} age</span>
              <select
                value={age}
                aria-invalid={showErrors && age === NO_AGE ? true : undefined}
                onChange={(event) => onChange(adults, childAges.map((current, i) => (i === index ? Number(event.currentTarget.value) : current)))}
              >
                <option value={NO_AGE} disabled>Choose age</option>
                {Array.from({ length: 18 }, (_, value) => <option key={value} value={value}>{childAgeLabel(value)}</option>)}
              </select>
            </label>
          ))}
          <p className="sb-guests__note">Children under 6 stay free in existing beds. From 12, a child counts as an adult for room limits.</p>
        </div>
      ) : null}
    </div>
  );
}
