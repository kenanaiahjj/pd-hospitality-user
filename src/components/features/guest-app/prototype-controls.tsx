'use client';

/*
  The prototype's control panel: scaffolding for demos and documentation, not
  part of the guest product. It picks the stay state, the clock, PMS events,
  the error and empty conditions, and opens each documented page directly.
*/
import type { ReactNode } from 'react';
import { useRef, useState, useSyncExternalStore } from 'react';
import {
  Bed,
  BellRinging,
  ChatCircleDots,
  ClockCountdown,
  QrCode,
  Receipt,
  Sparkle,
  Storefront,
  Ticket,
  WarningCircle,
  WifiSlash,
  Wrench,
  X,
} from '@phosphor-icons/react';
import { PROTOTYPE_STAY_STATES } from './prototype-model';
import type { PrototypeStayState } from './prototype-model';
import type { FeedClock } from './promoted';

/** When the prototype's "hotel system down" data was last in sync. */
export const PMS_LAST_SYNC = '6:40 PM';

/*
  Where the presenter parked the trigger: a side and a height, as a fraction
  of the screen so it survives a rotation. Per browser, a convenience only --
  it reads back as nothing on the server, in a private window, or if storage
  throws, and the trigger then sits in its default corner.
*/
type TriggerSpot = { side: 'left' | 'right'; y: number };
const TRIGGER_KEY = 'cabana.prototype-trigger';
const TRIGGER_EVENT = 'cabana:prototype-trigger';
function readTriggerSpot(): string | null {
  try { return window.localStorage.getItem(TRIGGER_KEY); } catch { return null; }
}
function subscribeTriggerSpot(onChange: () => void) {
  window.addEventListener(TRIGGER_EVENT, onChange);
  window.addEventListener('storage', onChange);
  return () => {
    window.removeEventListener(TRIGGER_EVENT, onChange);
    window.removeEventListener('storage', onChange);
  };
}
function saveTriggerSpot(spot: TriggerSpot) {
  try { window.localStorage.setItem(TRIGGER_KEY, JSON.stringify(spot)); } catch { /* the default corner is fine */ }
  window.dispatchEvent(new Event(TRIGGER_EVENT));
}
function parseTriggerSpot(raw: string | null): TriggerSpot | null {
  if (!raw) return null;
  try {
    const spot = JSON.parse(raw) as TriggerSpot;
    return (spot.side === 'left' || spot.side === 'right') && typeof spot.y === 'number' ? spot : null;
  } catch { return null; }
}

/** The trigger's summary: short enough to sit beside a wrench. */
const STAY_STATE_SHORT: Record<PrototypeStayState, string> = {
  'signed-out': 'Signed out',
  'account-only': 'No booking',
  'pre-arrival': 'Pre-arrival',
  arrived: 'Arrived',
  live: 'Live',
  'checkout-day': 'Checkout day',
  'just-checked-out': 'Checked out',
  closed: 'Closed',
};

export const slug = (text: string) => text.toLowerCase().replace(/[^a-z0-9]+/g, '-');

export type PrototypePage = { group: PrototypePageGroup; label: string; detail: string; open: () => void };
const PAGE_GROUPS = ['Find a hotel', 'Book', 'After booking', 'Empty states', 'Error states'] as const;
export type PrototypePageGroup = (typeof PAGE_GROUPS)[number];
/** An event the host app computes, such as the hotel answering a request. */
export type PrototypeEvent = { icon: ReactNode; label: string; detail: string; onClick: () => void; unavailable?: string };
export type PrototypeConditions = { online: boolean; pmsDown: boolean; emptyCatalogue: boolean; booking: boolean; chat: boolean; scan: boolean };
const CONDITION_ROWS: { group: string; rows: { key: keyof PrototypeConditions; label: string; detail: string; onText: string; icon: ReactNode; once?: boolean }[] }[] = [
  { group: 'Connection', rows: [
    { key: 'online', label: 'Offline', detail: 'The device has a connection.', onText: 'No connection: last-known data, nothing new booked.', icon: <WifiSlash /> },
    { key: 'pmsDown', label: 'Hotel system down', detail: 'The hotel’s system answers.', onText: `Showing last-known data, as of ${PMS_LAST_SYNC}.`, icon: <WarningCircle /> },
  ] },
  { group: 'Next attempt fails', rows: [
    { key: 'booking', label: 'Next booking fails', detail: 'Bookings go through.', onText: 'The next booking errors, once.', icon: <Receipt />, once: true },
    { key: 'chat', label: 'Next chat message fails', detail: 'Messages send.', onText: 'The next message will not send, once.', icon: <ChatCircleDots />, once: true },
    { key: 'scan', label: 'Next room scan fails', detail: 'The code reads.', onText: 'The next scan cannot read the code, once.', icon: <QrCode />, once: true },
  ] },
  { group: 'Catalogue', rows: [
    { key: 'emptyCatalogue', label: 'Empty catalogue', detail: 'Explore, categories and nearby have content.', onText: 'Explore, categories and nearby are empty.', icon: <Storefront /> },
  ] },
];

const CLOCK_HOURS = [
  { value: 8, label: 'Morning', short: '8 AM' },
  { value: 14, label: 'Afternoon', short: '2 PM' },
  { value: 19, label: 'Evening', short: '7 PM' },
  { value: 23, label: 'Late', short: '11 PM' },
] as const;

export function PrototypeControls({
  online,
  stayState,
  onStayStateChange,
  onSimulateRoomAssignment,
  canSimulateRoomAssignment,
  onSimulateRoomReady,
  onSimulateUpgradeApproved,
  canSimulateUpgradeApproved,
  canSimulateRoomReady,
  roomVerified,
  onToggleRoomVerified,
  canToggleRoomVerified,
  hasHistory,
  onToggleHistory,
  hasReview,
  onClearReview,
  autoDetectScans,
  onToggleAutoDetectScans,
  strictLookup,
  onToggleStrictLookup,
  simulatePostStayExpired,
  onTogglePostStayExpired,
  feedClock,
  feedNights,
  onFeedClockChange,
  onReset,
  conditions,
  onToggleCondition,
  onEmptyAccount,
  pages,
  hotelEvents = [],
  onClearDeviceData,
}: {
  online: boolean;
  stayState: PrototypeStayState;
  onStayStateChange: (state: PrototypeStayState) => void;
  onSimulateRoomAssignment: () => void;
  canSimulateRoomAssignment: boolean;
  onSimulateRoomReady: () => void;
  onSimulateUpgradeApproved: () => void;
  canSimulateUpgradeApproved: boolean;
  canSimulateRoomReady: boolean;
  roomVerified: boolean;
  onToggleRoomVerified: () => void;
  canToggleRoomVerified: boolean;
  hasHistory: boolean;
  onToggleHistory: () => void;
  hasReview: boolean;
  onClearReview: () => void;
  autoDetectScans: boolean;
  onToggleAutoDetectScans: () => void;
  strictLookup: boolean;
  onToggleStrictLookup: () => void;
  simulatePostStayExpired: boolean;
  onTogglePostStayExpired: () => void;
  /** The For you feed's clock, so a demo can move through the stay and the day. */
  feedClock?: FeedClock;
  feedNights: number;
  onFeedClockChange: (clock: FeedClock) => void;
  onReset: () => void;
  conditions: PrototypeConditions;
  onToggleCondition: (key: keyof PrototypeConditions) => void;
  onEmptyAccount: () => void;
  pages: PrototypePage[];
  /** The hotel answering what a guest asked for before arrival. */
  hotelEvents?: PrototypeEvent[];
  /** Forgets what this device kept: saved hotels, recent searches, a saved offer, a booking draft. */
  onClearDeviceData?: () => void;
}) {
  /*
    Collapsed by default. This is scaffolding, not part of the product, and as
    an always-open panel it sat on top of whatever the screen had docked above
    the tab bar -- the front desk bar on My Stay and the dining mini cart. A
    demo should show the app, not the rig it runs on.
  */
  const [open, setOpen] = useState(false);
  /* Kept while the page lives, so reopening lands where the presenter was. */
  const [tab, setTab] = useState<'state' | 'clock' | 'events' | 'conditions' | 'pages'>('state');
  /* A downward swipe on the sheet's head closes it, as a phone sheet does. */
  const dragFrom = useRef<number | null>(null);

  /*
    The trigger can be dragged anywhere and snaps to the nearer side edge on
    release, like a phone's floating assistive button -- so it can be moved
    off whatever it is covering. A press that barely moves is still a tap.
  */
  const spot = parseTriggerSpot(useSyncExternalStore(subscribeTriggerSpot, readTriggerSpot, () => null));
  const [dragAt, setDragAt] = useState<{ x: number; y: number } | null>(null);
  const press = useRef<{ x: number; y: number; moved: boolean } | null>(null);
  const wasDragged = useRef(false);
  const triggerStyle = dragAt
    ? { left: dragAt.x - 18, top: dragAt.y - 18, right: 'auto', bottom: 'auto' }
    : spot
      ? { [spot.side]: 12, [spot.side === 'left' ? 'right' : 'left']: 'auto', top: `calc(${spot.y} * 100dvh)`, bottom: 'auto' }
      : undefined;

  const clockLabel = feedClock
    ? `${feedClock.dayOfStay > feedNights ? 'Checkout' : `Day ${feedClock.dayOfStay}`} · ${CLOCK_HOURS.find((hour) => hour.value === feedClock.hour)?.short ?? `${feedClock.hour}:00`}`
    : undefined;
  const summary = [STAY_STATE_SHORT[stayState], stayState === 'live' || stayState === 'arrived' ? clockLabel : undefined].filter(Boolean).join(' · ');

  if (!open) {
    return (
      <button
        className={`guest-prototype-trigger${dragAt ? ' is-dragging' : ''}`}
        type="button"
        style={triggerStyle}
        onPointerDown={(event) => {
          press.current = { x: event.clientX, y: event.clientY, moved: false };
          try { event.currentTarget.setPointerCapture(event.pointerId); } catch { /* a synthetic pointer has no capture */ }
        }}
        onPointerMove={(event) => {
          const start = press.current;
          if (!start) return;
          if (!start.moved && Math.hypot(event.clientX - start.x, event.clientY - start.y) < 6) return;
          start.moved = true;
          setDragAt({ x: event.clientX, y: event.clientY });
        }}
        onPointerUp={(event) => {
          const start = press.current;
          press.current = null;
          if (!start?.moved) return;
          wasDragged.current = true;
          setDragAt(null);
          saveTriggerSpot({
            side: event.clientX < window.innerWidth / 2 ? 'left' : 'right',
            y: Math.min(0.9, Math.max(0.03, (event.clientY - 18) / window.innerHeight)),
          });
        }}
        onPointerCancel={() => { press.current = null; setDragAt(null); }}
        onClick={() => {
          // The click that ends a drag is not a tap.
          if (wasDragged.current) { wasDragged.current = false; return; }
          setOpen(true);
        }}
        aria-expanded={false}
        aria-label="Open prototype controls"
      >
        <Wrench aria-hidden="true" />
        {/* Where the demo is, without opening the rig. */}
        <span className="guest-prototype-trigger__state" aria-hidden="true">{summary}</span>
      </button>
    );
  }

  const offline = online ? undefined : 'Needs a connection';
  const events: { group: string; icon: ReactNode; label: string; detail: string; onClick: () => void; unavailable?: string }[] = [
    { group: 'PMS events', icon: <Ticket />, label: 'Simulate room assignment', detail: 'The PMS assigns a room to the upcoming stay.', onClick: onSimulateRoomAssignment, unavailable: offline ?? (canSimulateRoomAssignment ? undefined : 'Needs a stay still waiting for a room') },
    { group: 'PMS events', icon: <BellRinging />, label: 'Simulate room ready', detail: 'Housekeeping marks the assigned room ready.', onClick: onSimulateRoomReady, unavailable: offline ?? (canSimulateRoomReady ? undefined : 'Needs a room that is being prepared') },
    { group: 'PMS events', icon: <Bed />, label: 'Approve upgrade request', detail: 'The front desk confirms the upgrade and assigns the room.', onClick: onSimulateUpgradeApproved, unavailable: offline ?? (canSimulateUpgradeApproved ? undefined : 'No upgrade requested') },
    ...hotelEvents.map((event) => ({ ...event, group: 'Hotel answers' })),
    { group: 'Gates', icon: <QrCode />, label: roomVerified ? 'Clear room verification' : 'Verify room (skip the scan)', detail: roomVerified ? 'Locks the stay again, so the scan can be run.' : 'Opens on-property services without scanning.', onClick: onToggleRoomVerified, unavailable: canToggleRoomVerified ? undefined : 'Needs a stay with a room' },
    { group: 'Gates', icon: <ClockCountdown />, label: simulatePostStayExpired ? 'Reset 24-hour chat window' : 'Simulate 24 hours after checkout', detail: simulatePostStayExpired ? 'Reopens the front desk after checkout.' : 'Closes the front desk, as a day after checkout.', onClick: onTogglePostStayExpired },
    { group: 'Data', icon: <Receipt />, label: hasHistory ? 'Clear stay history' : 'Seed stay history', detail: hasHistory ? 'As a first-time guest, with no past stays.' : 'Adds past stays to the profile.', onClick: onToggleHistory },
    { group: 'Data', icon: <Sparkle />, label: 'Clear stay review', detail: 'Lets the stay be rated again.', onClick: onClearReview, unavailable: hasReview ? undefined : 'No review to clear' },
    /* A presenter holding on the viewfinder to talk about it needs the
       countdown to stop, or the screen scans itself out from under them. */
    { group: 'Demo', icon: <ClockCountdown />, label: autoDetectScans ? 'Scanner: auto-detects after 2s' : 'Scanner: waits for the button', detail: 'Tap to switch.', onClick: onToggleAutoDetectScans },
    /* Off by default so any reference walks the happy path. On, only the
       real fixture matches -- how the not-found screens stay demonstrable. */
    { group: 'Demo', icon: <Ticket />, label: strictLookup ? 'Lookup: only real references' : 'Lookup: accepts anything', detail: 'Tap to switch.', onClick: onToggleStrictLookup },
  ];
  const groups = [...new Set(events.map((event) => event.group))];

  return (
    <div
      className="guest-prototype-modal-backdrop"
      data-testid="prototype-controls-backdrop"
      onClick={(event) => {
        if (event.target === event.currentTarget) setOpen(false);
      }}
    >
      <aside className="guest-prototype-toolbar" role="region" aria-label="Prototype controls">
      <div
        className="guest-prototype-toolbar__head"
        onPointerDown={(event) => { dragFrom.current = event.clientY; }}
        onPointerUp={(event) => {
          if (dragFrom.current !== null && event.clientY - dragFrom.current > 70) setOpen(false);
          dragFrom.current = null;
        }}
      >
        <span className="guest-prototype-toolbar__grip" aria-hidden="true" />
        <div>
          <span>Prototype controls</span>
          <small>{summary}</small>
        </div>
        <button
          className="guest-prototype-toolbar__close"
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Close prototype controls"
        >
          <X aria-hidden="true" />
        </button>
      </div>

      <div className="guest-prototype-tabs" role="tablist" aria-label="Controls">
        {([['state', 'State'], ['clock', 'Clock'], ['events', 'Events'], ['conditions', 'Conditions'], ['pages', 'Pages']] as const).map(([id, label]) => (
          <button key={id} type="button" role="tab" id={`prototype-tab-${id}`} aria-selected={tab === id} aria-controls={`prototype-panel-${id}`} className={tab === id ? 'is-active' : ''} onClick={() => setTab(id)}>
            {label}
          </button>
        ))}
      </div>

      {/*
        Everything but the head and tabs scrolls. The panel gains rows with
        every feature, and on a phone it had grown past the viewport --
        carrying its own close button off the top of the screen.
      */}
      <div className="guest-prototype-toolbar__body" role="tabpanel" id={`prototype-panel-${tab}`} aria-labelledby={`prototype-tab-${tab}`}>
        {tab === 'state' ? (
          <fieldset className="guest-prototype-states">
            <legend className="guest-visually-hidden">Stay state</legend>
            {PROTOTYPE_STAY_STATES.map((state) => (
              <label key={state.id} className={`guest-prototype-states__option${stayState === state.id ? ' is-current' : ''}`}>
                <input
                  type="radio"
                  name="prototype-stay-state"
                  value={state.id}
                  checked={stayState === state.id}
                  /* On click, not change: pressing the state already shown has
                     to re-apply it -- from the welcome screen, or after poking
                     around -- and a checked radio never fires onChange. */
                  readOnly
                  onClick={() => { onStayStateChange(state.id); setOpen(false); }}
                />
                <span>
                  <b>{state.label}</b>
                  <small>{state.detail}</small>
                </span>
              </label>
            ))}
          </fieldset>
        ) : null}

        {tab === 'clock' ? (
          feedClock ? (
            <div className="guest-prototype-clock">
              <p className="guest-prototype-clock__lead">What Explore and the home recommend, and whether nearby places are open.</p>
              <div role="group" aria-label="Stay day" className="guest-prototype-chips">
                <small>Stay day</small>
                <div>
                  {Array.from({ length: feedNights + 1 }, (_, i) => i + 1).map((day) => (
                    <button key={day} type="button" aria-pressed={feedClock.dayOfStay === day} className={feedClock.dayOfStay === day ? 'is-active' : ''} onClick={() => onFeedClockChange({ ...feedClock, dayOfStay: day })}>
                      {day > feedNights ? 'Checkout' : day === 1 ? 'Arrival' : day === feedNights ? 'Last night' : `Day ${day}`}
                    </button>
                  ))}
                </div>
              </div>
              <div role="group" aria-label="Time of day" className="guest-prototype-chips">
                <small>Time of day</small>
                <div>
                  {CLOCK_HOURS.map((hour) => (
                    <button key={hour.value} type="button" aria-pressed={feedClock.hour === hour.value} className={feedClock.hour === hour.value ? 'is-active' : ''} onClick={() => onFeedClockChange({ ...feedClock, hour: hour.value })}>
                      {hour.label}<small>{hour.short}</small>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <p className="guest-prototype-empty">No stay to set a clock for. Pick a state with a booking first.</p>
          )
        ) : null}

        {tab === 'events' ? (
          <>
            {groups.map((group) => (
              <section key={group} className="guest-prototype-events" aria-label={group}>
                <h3>{group}</h3>
                {events.filter((event) => event.group === group).map((event) => (
                  <button key={event.label} type="button" className="guest-prototype-event" onClick={event.onClick} disabled={Boolean(event.unavailable)} aria-label={event.label} aria-describedby={`prototype-event-${slug(event.label)}`}>
                    <span className="guest-prototype-event__icon" aria-hidden="true">{event.icon}</span>
                    <span className="guest-prototype-event__copy">
                      <b>{event.label}</b>
                      <small id={`prototype-event-${slug(event.label)}`}>{event.unavailable ?? event.detail}</small>
                    </span>
                  </button>
                ))}
              </section>
            ))}
            <button className="guest-prototype-toolbar__reset" type="button" onClick={onReset}>
              Reset saved session
            </button>
          </>
        ) : null}

        {tab === 'conditions' ? (
          <>
            {CONDITION_ROWS.map((group) => (
              <section key={group.group} className="guest-prototype-events" aria-label={group.group}>
                <h3>{group.group}</h3>
                {group.rows.map((row) => {
                  const on = row.key === 'online' ? !conditions.online : conditions[row.key];
                  return (
                    <button key={row.key} type="button" className={`guest-prototype-event${on ? ' is-on' : ''}`} aria-pressed={on} onClick={() => onToggleCondition(row.key)}>
                      <span className="guest-prototype-event__icon" aria-hidden="true">{row.icon}</span>
                      <span className="guest-prototype-event__copy">
                        <b>{row.label}</b>
                        <small>{on ? row.onText : row.detail}</small>
                      </span>
                      <span className="guest-prototype-event__state">{on ? (row.once ? 'Armed' : 'On') : 'Off'}</span>
                    </button>
                  );
                })}
              </section>
            ))}
            <section className="guest-prototype-events" aria-label="Data">
              <h3>Data</h3>
              <button type="button" className="guest-prototype-event" onClick={() => { onEmptyAccount(); setOpen(false); }}>
                <span className="guest-prototype-event__icon" aria-hidden="true"><Sparkle /></span>
                <span className="guest-prototype-event__copy"><b>Empty account</b><small>Signed in, with no bookings, charges, badges or stays.</small></span>
              </button>
              {onClearDeviceData ? (
                <button type="button" className="guest-prototype-event" onClick={() => { onClearDeviceData(); setOpen(false); }}>
                  <span className="guest-prototype-event__icon" aria-hidden="true"><Receipt /></span>
                  <span className="guest-prototype-event__copy"><b>Clear device data</b><small>Saved hotels, recent searches, a saved offer and any half-made booking.</small></span>
                </button>
              ) : null}
            </section>
          </>
        ) : null}

        {tab === 'pages' ? (
          <>
            {PAGE_GROUPS.map((group) => (
              <section key={group} className="guest-prototype-events" aria-label={group}>
                <h3>{group}</h3>
                {pages.filter((page) => page.group === group).map((page) => (
                  <button key={page.label} type="button" className="guest-prototype-event" onClick={() => { page.open(); setOpen(false); }}>
                    <span className="guest-prototype-event__icon" aria-hidden="true">{group === 'Empty states' ? <Sparkle /> : group === 'Error states' ? <WarningCircle /> : <Bed />}</span>
                    <span className="guest-prototype-event__copy"><b>{page.label}</b><small>{page.detail}</small></span>
                  </button>
                ))}
              </section>
            ))}
          </>
        ) : null}
      </div>

      </aside>
    </div>
  );
}

