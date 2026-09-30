'use client';

import Image from 'next/image';
import { Buildings, CalendarBlank, Globe, MagnifyingGlass, MapPin, Minus, Plus, Users, X } from '@phosphor-icons/react';
import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { PROTOTYPE_TODAY, countNightsBetween } from '../prototype-model';
import type { StayLocation, StaySearch } from './model';
import { ANYWHERE, DEFAULT_STAY_SEARCH, MAX_ADULTS, MAX_CHILDREN, MAX_NIGHTS, STAY_HOTELS, STAY_LOCATIONS, addDays, locationImage, matchesWords, partyLabel, resolveLocation, validSearchDates } from './model';
import { childAgeLabel, compactRange, longDate, shortDate, stayDatesLabel, weekdayDate } from './format';

/*
  The search, in two parts. On a page it is one bar that says what is being
  searched for; tapping it opens the search full screen, where Where, When
  and Who each get the width of the phone -- one open at a time, as the
  booking apps do it, with the button fixed at the bottom. Children need an
  age before the search runs: it decides whether they count toward a room's
  beds.
*/

export type SearchStep = 'where' | 'when' | 'who';
/** A child whose age has not been chosen yet. */
const NO_AGE = -1;

/** The bar and the sheet it opens, for any page that searches. */
export function StaySearchLauncher({ value, onSearch, submitLabel }: { value: StaySearch; onSearch: (search: StaySearch) => void; submitLabel?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <StaySearchBar value={value} onOpen={() => setOpen(true)} />
      {open ? <StaySearchSheet value={value} submitLabel={submitLabel} onClose={() => setOpen(false)} onSearch={(search) => { setOpen(false); onSearch(search); }} /> : null}
    </>
  );
}

export function StaySearchBar({ value, onOpen }: { value: StaySearch; onOpen: () => void }) {
  const anywhere = value.location === ANYWHERE;
  return (
    <button type="button" className="sb-bar" onClick={onOpen} aria-label={`Search stays: ${value.location}, ${stayDatesLabel(value.checkIn, value.checkOut)}, ${partyLabel(value)}`}>
      <span className="sb-bar__icon" aria-hidden="true"><MagnifyingGlass weight="bold" /></span>
      <span className="sb-bar__text">
        <b>{anywhere ? 'Where to?' : value.location}</b>
        <small>{shortDate(value.checkIn)} – {shortDate(value.checkOut)} · {partyLabel(value)}</small>
      </span>
    </button>
  );
}

/**
 * The search, full screen. `steps` leaves out what a page cannot change -- a
 * hotel page searches that hotel, so it has no Where. `isBlocked` greys out
 * nights the hotel is full.
 */
export function StaySearchSheet({ value, onSearch, onClose, submitLabel = 'Search', startAt, steps = ['where', 'when', 'who'], isBlocked, title = 'Find a stay' }: {
  value: StaySearch;
  onSearch: (search: StaySearch) => void;
  onClose: () => void;
  submitLabel?: string;
  startAt?: SearchStep;
  steps?: SearchStep[];
  isBlocked?: (night: string) => boolean;
  title?: string;
}) {
  const [draft, setDraft] = useState<StaySearch>(value);
  const [step, setStep] = useState<SearchStep>(startAt ?? steps[0]!);
  const [tried, setTried] = useState(false);
  const [awaitingCheckOut, setAwaitingCheckOut] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  // Read by the key handler, which is bound once for the life of the sheet.
  const onCloseRef = useRef(onClose);
  useEffect(() => { onCloseRef.current = onClose; });
  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCloseRef.current();
      // Tab stays inside the sheet: it covers the page, so nothing behind it should take focus.
      if (event.key !== 'Tab' || !sheetRef.current) return;
      const focusable = [...sheetRef.current.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea, [href], [tabindex]:not([tabindex="-1"])')];
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!first || !last) return;
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      else if (!sheetRef.current.contains(document.activeElement)) { event.preventDefault(); first.focus(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const missingAge = draft.childAges.some((age) => age === NO_AGE);
  const datesOk = validSearchDates(draft);
  const canSearch = !missingAge && datesOk && draft.location.trim().length > 0;
  const next = (after: SearchStep) => steps[steps.indexOf(after) + 1];

  const submit = () => {
    setTried(true);
    if (!canSearch) {
      setStep(missingAge ? 'who' : !datesOk ? 'when' : 'where');
      return;
    }
    onSearch({ ...draft, location: resolveLocation(draft.location) });
  };

  return (
    <div ref={sheetRef} className="sb-sheet" role="dialog" aria-modal="true" aria-labelledby={titleId}>
      <header className="sb-sheet__head">
        <button ref={closeRef} type="button" className="sb-sheet__close" aria-label="Close search" onClick={onClose}><X /></button>
        <h2 id={titleId}>{title}</h2>
        <span aria-hidden="true" />
      </header>

      <div className="sb-sheet__body">
        {steps.includes('where') ? (
          <SheetSection icon={<MapPin />} label="Where" question="Where to?" value={!draft.location || draft.location === ANYWHERE ? 'Anywhere' : draft.location} open={step === 'where'} onOpen={() => setStep('where')}>
            <LocationPicker
              value={draft.location}
              onChange={(location) => setDraft((current) => ({ ...current, location }))}
              onPick={(location) => { setDraft((current) => ({ ...current, location })); setStep(next('where') ?? 'where'); }}
            />
          </SheetSection>
        ) : null}
        {steps.includes('when') ? (
          <SheetSection icon={<CalendarBlank />} label="When" question="When’s your trip?" value={datesOk ? stayDatesLabel(draft.checkIn, draft.checkOut) : 'Choose dates'} open={step === 'when'} onOpen={() => setStep('when')}>
            <RangeCalendar
              checkIn={draft.checkIn}
              checkOut={draft.checkOut}
              isBlocked={isBlocked}
              months={6}
              onChange={(checkIn, checkOut) => setDraft((current) => ({ ...current, checkIn, checkOut }))}
              onDone={() => { const after = next('when'); if (after) setStep(after); }}
              onPickingChange={setAwaitingCheckOut}
            />
          </SheetSection>
        ) : null}
        {steps.includes('who') ? (
          <SheetSection icon={<Users />} label="Who" question="Who’s coming?" value={partyLabel(draft)} open={step === 'who'} onOpen={() => setStep('who')}>
            <GuestsPanel
              adults={draft.adults}
              childAges={draft.childAges}
              showErrors={tried}
              onChange={(adults, childAges) => setDraft((current) => ({ ...current, adults, childAges }))}
            />
          </SheetSection>
        ) : null}
        {tried && !canSearch ? (
          <p className="sb-error" role="alert">
            {missingAge ? 'Add each child’s age to see rooms that fit.' : !datesOk ? 'Choose a check-out date after check-in.' : 'Choose where you want to stay.'}
          </p>
        ) : null}
      </div>

      <footer className="sb-sheet__foot">
        <span className="sb-sheet__summary">
          <b>{awaitingCheckOut ? `${shortDate(draft.checkIn)} → choose check-out` : datesOk ? `${compactRange(draft.checkIn, draft.checkOut)} · ${countNightsBetween(draft.checkIn, draft.checkOut)} ${countNightsBetween(draft.checkIn, draft.checkOut) === 1 ? 'night' : 'nights'}` : 'Choose dates'}</b>
          <button type="button" className="sb-sheet__clear" onClick={() => { setDraft(steps.includes('where') ? DEFAULT_STAY_SEARCH : { ...DEFAULT_STAY_SEARCH, location: draft.location }); setTried(false); setStep(steps[0]!); }}>Clear all</button>
        </span>
        <button className="guest-button guest-button--primary sb-sheet__submit" type="button" onClick={submit}>
          <MagnifyingGlass aria-hidden="true" />{submitLabel}
        </button>
      </footer>
    </div>
  );
}

/* Closed, a section is one tappable line; open, it is a card with its question. */
function SheetSection({ icon, label, question, value, open, onOpen, children }: { icon: ReactNode; label: string; question: string; value: string; open: boolean; onOpen: () => void; children: ReactNode }) {
  const id = useId();
  if (!open) {
    return (
      <button type="button" className="sb-sheet__row" aria-expanded={false} aria-controls={id} onClick={onOpen}>
        <span className="sb-sheet__row-icon" aria-hidden="true">{icon}</span>
        <span className="sb-sheet__row-label">{label}</span>
        <b>{value}</b>
      </button>
    );
  }
  return (
    <section className="sb-sheet__card" id={id} aria-label={label}>
      <h3>{question}</h3>
      {children}
    </section>
  );
}

function PlaceThumb({ place }: { place: StayLocation }) {
  const image = locationImage(place.label);
  return (
    <span className="sb-place-thumb" aria-hidden="true">
      {image ? <Image src={image.src} alt="" fill sizes="48px" style={{ objectPosition: image.focalPoint }} /> : <Globe />}
    </span>
  );
}

function LocationPicker({ value, onChange, onPick }: { value: string; onChange: (value: string) => void; onPick: (value: string) => void }) {
  const query = value.trim().toLowerCase();
  const typed = query && query !== ANYWHERE.toLowerCase();
  const places = STAY_LOCATIONS.filter((place) => !typed || matchesWords(`${place.label} ${place.detail}`, query));
  const hotels = typed ? STAY_HOTELS.filter((hotel) => matchesWords(`${hotel.name} ${hotel.area}`, query)) : [];
  // Enter takes the best suggestion, so "palawan" searches El Nido rather than the raw word.
  const best = places[0]?.label ?? hotels[0]?.name;
  return (
    <div className="sb-location">
      <label className="sb-location__input">
        <span className="sr-only">Destination or hotel</span>
        <MagnifyingGlass aria-hidden="true" />
        <input
          value={value === ANYWHERE ? '' : value}
          placeholder="Search a city, island or hotel"
          autoComplete="off"
          enterKeyHint="next"
          onChange={(event) => onChange(event.currentTarget.value)}
          onKeyDown={(event) => { if (event.key === 'Enter' && value.trim()) onPick(typed && best ? best : value.trim()); }}
        />
        {value && value !== ANYWHERE ? <button type="button" aria-label="Clear destination" onClick={() => onChange(ANYWHERE)}><X /></button> : null}
      </label>
      <ul className="sb-location__list" aria-label="Suggestions">
        {places.map((place) => (
          <li key={place.label}>
            <button type="button" aria-pressed={value === place.label} onClick={() => onPick(place.label)}>
              <PlaceThumb place={place} /><span><b>{place.label}</b><small>{place.detail}</small></span>
            </button>
          </li>
        ))}
        {hotels.map((hotel) => (
          <li key={hotel.id}>
            <button type="button" onClick={() => onPick(hotel.name)}>
              <span className="sb-place-thumb" aria-hidden="true"><Buildings /></span><span><b>{hotel.name}</b><small>{hotel.area}</small></span>
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
export function RangeCalendar({ checkIn, checkOut, onChange, onDone, onPickingChange, isBlocked, months = 4 }: {
  checkIn: string;
  checkOut: string;
  onChange: (checkIn: string, checkOut: string) => void;
  /** Whether the next tap sets check-out -- so a summary elsewhere can say it is waiting. */
  onPickingChange?: (awaitingCheckOut: boolean) => void;
  /** Both dates chosen, by the second tap. */
  onDone?: () => void;
  isBlocked?: (night: string) => boolean;
  months?: number;
}) {
  // Picking the second date: after a first tap, check-out waits for the next one.
  const [picking, setPickingState] = useState<'in' | 'out'>('in');
  const setPicking = (next: 'in' | 'out') => { setPickingState(next); onPickingChange?.(next === 'out'); };
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
      onDone?.();
      return;
    }
    if (isBlocked?.(day)) return;
    // A lone check-in carries a one-night check-out, so the range is always valid.
    onChange(day, addDays(day, 1));
    setPicking('out');
  };
  const nights = countNightsBetween(checkIn, checkOut);
  return (
    <div className="sb-calendar">
      {/* Which date the next tap sets, as the hotel apps show it: both ends, the live one lit. */}
      <div className="sb-calendar__ends">
        <button type="button" className={`sb-calendar__end${picking === 'in' ? ' is-active' : ''}`} aria-pressed={picking === 'in'} onClick={() => setPicking('in')}>
          <small>Check-in</small><b>{weekdayDate(checkIn)}</b>
        </button>
        <span className="sb-calendar__nights" aria-hidden="true">{picking === 'out' ? '→' : `${nights} ${nights === 1 ? 'night' : 'nights'}`}</span>
        <button type="button" className={`sb-calendar__end${picking === 'out' ? ' is-active' : ''}`} aria-pressed={picking === 'out'} onClick={() => setPicking('out')}>
          <small>Check-out</small><b>{picking === 'out' ? 'Choose a date' : weekdayDate(checkOut)}</b>
        </button>
      </div>
      <p className="sr-only" aria-live="polite">{picking === 'out' ? `Check-in ${shortDate(checkIn)}. Now choose check-out.` : `${shortDate(checkIn)} to ${shortDate(checkOut)}, ${nights} nights.`}</p>
      <div className="sb-calendar__weekdays" aria-hidden="true">
        {WEEKDAYS.map((day, i) => <span key={i}>{day}</span>)}
      </div>
      <div ref={monthsRef} className="sb-calendar__months">
        {grid.map((month) => (
          <div key={month.label} className="sb-calendar__month">
            <p className="sb-calendar__label">{month.label}</p>
            <div className="sb-calendar__grid" role="group" aria-label={month.label}>
              {month.cells.map((day, i) => {
                if (!day) return <span key={`e${i}`} />;
                const past = day <= PROTOTYPE_TODAY;
                const blocked = !past && Boolean(isBlocked?.(day));
                const ranged = picking === 'in' && nights > 0;
                const isStart = day === checkIn;
                const isEnd = picking === 'in' && day === checkOut;
                const inside = ranged && day > checkIn && day < checkOut;
                // The band runs between the two circles and rounds off at the edges of each week.
                const band = inside ? ' is-inside' : ranged && isStart ? ' is-band-start' : ranged && isEnd ? ' is-band-end' : '';
                const column = i % 7;
                return (
                  <span key={day} className={`sb-calendar__cell${band}${column === 0 ? ' is-row-start' : ''}${column === 6 ? ' is-row-end' : ''}`}>
                    <button
                      type="button"
                      className={`sb-calendar__day${isStart ? ' is-start' : ''}${isEnd ? ' is-end' : ''}${blocked ? ' is-blocked' : ''}${day === addDays(PROTOTYPE_TODAY, 1) ? ' is-soonest' : ''}`}
                      disabled={past || (blocked && picking === 'in')}
                      aria-pressed={isStart || isEnd}
                      aria-label={`${longDate(day)}${isStart ? ', check-in' : isEnd ? ', check-out' : ''}${blocked ? ', fully booked' : ''}`}
                      onClick={() => pick(day)}
                    >
                      {utc(day).getUTCDate()}
                    </button>
                  </span>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      {isBlocked ? <p className="sb-calendar__legend"><span aria-hidden="true" />Fully booked nights are struck through</p> : null}
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
                <option value={NO_AGE} disabled>Select</option>
                {Array.from({ length: 18 }, (_, value) => <option key={value} value={value}>{childAgeLabel(value)}</option>)}
              </select>
            </label>
          ))}
          <p className="sb-guests__note">Age at check-in. Under 6 stay free.</p>
        </div>
      ) : null}
    </div>
  );
}
