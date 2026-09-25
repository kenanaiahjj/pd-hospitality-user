'use client';

import { useCallback, useEffect, useId, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode, type RefObject } from 'react';
import { Button } from '@/components/ui';
import { CabanaMark } from '@/components/ui/cabana-logo';
import { usePrefersReducedMotion } from '@/lib/hooks';
import { CHECK_IN_FROM, CHECK_OUT_BY, type Booking } from './prototype-model';
import './stay-invitation.css';

/*
  The booking-found card, set as a keepsake: a pearl frame with scalloped
  corners around a photograph panel, with a pearl sheen that slides with the
  tilt the way light moves across nacre. At rest it drifts a few degrees on
  its own axes, as if held in a hand; a finger on it takes over the tilt and
  lets go back into the drift.

  Confirming is a small ceremony rather than a page change: the screen's
  chrome steps back, the card steadies, and a crisp Cabana approval mark
  lands in its upper-right corner with a brief, weighted contact. Only then
  does the guest move on, so the moment the stay becomes theirs is one they see.
*/

const MAX_TILT = 11; // degrees, at full finger deflection
/** The confirmation beat. It must cover the stamp animation in stay-invitation.css. */
const STAMP_MS = 1150;
/** A brief haptic cue when the stamp contacts the card. */
const IMPACT_MS = 202;
/** The beat between the stamp appearing and the stay opening. */
const SETTLE_MS = 1100;

const day = (isoDate: string) => new Date(`${isoDate}T12:00:00`);
/** "Mon 9 Nov": day before month reads as a travel document, not a US form. */
const format = (isoDate: string) => day(isoDate).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });

type Phase = 'idle' | 'stamping' | 'done';

const STAMP_EDGE = (() => {
  const points = Array.from({ length: 144 }, (_, index) => {
    const angle = (index / 144) * Math.PI * 2 - Math.PI / 2;
    const radius = 44 + 2.2 * Math.cos(angle * 12);
    return `${(50 + radius * Math.cos(angle)).toFixed(2)} ${(50 + radius * Math.sin(angle)).toFixed(2)}`;
  });
  return `M${points.join('L')}Z`;
})();

/* A transparent approval stamp: scalloped gold outline, Cabana mark, curved type. */
function DigitalStamp() {
  const id = useId();
  const topArc = `${id}-top-arc`;
  const bottomArc = `${id}-bottom-arc`;

  return (
    <span className="stay-pass__stamp-lockup">
      <svg className="stay-pass__stamp-art" viewBox="0 0 100 100" aria-hidden="true">
        <defs>
          <path id={topArc} d="M 17 50 A 33 33 0 1 1 83 50" />
          <path id={bottomArc} d="M 83 50 A 33 33 0 1 1 17 50" />
        </defs>
        <path d={STAMP_EDGE} fill="none" stroke="#ead59e" strokeWidth="1.1" />
        <circle cx="50" cy="50" r="40" fill="none" stroke="#ead59e" strokeWidth="0.55" opacity="0.82" />
        <circle cx="50" cy="50" r="25" fill="none" stroke="#ead59e" strokeWidth="0.45" opacity="0.72" />
        <text className="stay-pass__stamp-type stay-pass__stamp-type--top">
          <textPath href={`#${topArc}`} startOffset="50%" textAnchor="middle" textLength="34" lengthAdjust="spacing">CABANA</textPath>
        </text>
        <text className="stay-pass__stamp-type stay-pass__stamp-type--bottom">
          <textPath href={`#${bottomArc}`} startOffset="50%" textAnchor="middle" textLength="38" lengthAdjust="spacing">VERIFIED STAY</textPath>
        </text>
        <circle cx="16.8" cy="50" r="1.2" fill="#ead59e" />
        <circle cx="83.2" cy="50" r="1.2" fill="#ead59e" />
        <svg x="34" y="39" width="32" height="21" viewBox="12.32 4.11 277.98 181.58" overflow="visible">
          <CabanaMark style={{ fill: '#ead59e' }} />
        </svg>
      </svg>
    </span>
  );
}

/*
  One loop owns the tilt, shared by every pearl card (the stay pass, the room
  key). At rest the target is a slow drift -- sines at unrelated rates, so it
  never visibly repeats -- plus a slight twist and a few pixels of float. A
  held card follows the finger instead, and a card told to steady (the pass
  mid-stamp) settles flat. Either way the card eases toward its target, so
  every change glides rather than snaps. The CSS reads the variables for the
  3D turn, the sheen, the glare and the shadow.
*/
function usePassTilt(steady: RefObject<boolean>) {
  const reducedMotion = usePrefersReducedMotion();
  const root = useRef<HTMLDivElement>(null);
  /** Where a finger (or pointer) is holding the card, or null to drift. */
  const held = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const node = root.current;
    if (!node || reducedMotion) return;
    const current = { x: 0, y: 0, twist: 0 };
    const start = performance.now();
    let frame = 0;
    let visible = true;

    const loop = (now: number) => {
      const t = (now - start) / 1000;
      const still = steady.current;
      const target = still ? { x: 0, y: 0 } : held.current ?? {
        x: Math.sin(t * 0.61) * 0.36 + Math.sin(t * 0.17 + 1.3) * 0.14,
        y: Math.sin(t * 0.43 + 0.8) * 0.3 + Math.sin(t * 0.23) * 0.1,
      };
      const ease = still ? 0.14 : held.current ? 0.16 : 0.05;
      current.x += (target.x - current.x) * ease;
      current.y += (target.y - current.y) * ease;
      current.twist += ((still ? 0 : Math.sin(t * 0.33 + 2) * 0.7) - current.twist) * ease;

      const float = still ? 0 : Math.sin(t * 0.9);
      node.style.setProperty('--sp-rx', `${(-current.y * MAX_TILT).toFixed(2)}deg`);
      node.style.setProperty('--sp-ry', `${(current.x * MAX_TILT).toFixed(2)}deg`);
      node.style.setProperty('--sp-rz', `${current.twist.toFixed(2)}deg`);
      node.style.setProperty('--sp-f', float.toFixed(3));
      node.style.setProperty('--sp-x', current.x.toFixed(3));
      node.style.setProperty('--sp-y', current.y.toFixed(3));
      node.style.setProperty('--sp-gx', `${(50 + current.x * 48).toFixed(1)}%`);
      node.style.setProperty('--sp-gy', `${(50 + current.y * 48).toFixed(1)}%`);
      if (visible) frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);

    // Nothing to animate while the card is scrolled away.
    const observer = typeof IntersectionObserver === 'undefined' ? null : new IntersectionObserver(([entry]) => {
      visible = entry?.isIntersecting ?? true;
      cancelAnimationFrame(frame);
      if (visible) frame = requestAnimationFrame(loop);
    });
    observer?.observe(node);

    return () => {
      cancelAnimationFrame(frame);
      observer?.disconnect();
    };
  }, [reducedMotion, steady]);

  const hold = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (reducedMotion || steady.current) return;
    const box = event.currentTarget.getBoundingClientRect();
    held.current = {
      x: ((event.clientX - box.left) / box.width) * 2 - 1,
      y: ((event.clientY - box.top) / box.height) * 2 - 1,
    };
    event.currentTarget.dataset.active = 'true';
  };

  const release = (event: ReactPointerEvent<HTMLDivElement>) => {
    held.current = null;
    delete event.currentTarget.dataset.active;
  };

  return {
    root,
    reducedMotion,
    pointer: {
      onPointerDown: hold,
      onPointerMove: (event: ReactPointerEvent<HTMLDivElement>) => { if (event.pointerType === 'mouse' || event.buttons) hold(event); },
      onPointerUp: (event: ReactPointerEvent<HTMLDivElement>) => { if (event.pointerType !== 'mouse') release(event); },
      onPointerLeave: release,
      onPointerCancel: release,
    },
  };
}

export function StayInvitation({ booking, art, phase = 'idle', onStamped }: {
  booking: Booking;
  /** The property photograph; it is stretched to fill the panel. */
  art: ReactNode;
  phase?: Phase;
  onStamped?: () => void;
}) {
  /** Read by the tilt loop, which outlives renders: a card being stamped holds still. */
  const steady = useRef(phase === 'stamping');
  const { root, reducedMotion, pointer } = usePassTilt(steady);

  const nights = Math.max(1, Math.round((day(booking.checkOut).getTime() - day(booking.checkIn).getTime()) / 86_400_000));
  const confirmed = phase !== 'idle';

  useEffect(() => {
    steady.current = phase === 'stamping';
  }, [phase]);

  /*
    The press's end is a timer, not `animationend`: that event never fires
    where there is no animation (jsdom, a tab in the background), and the
    guest must never be stranded mid-ceremony.
  */
  useEffect(() => {
    if (phase !== 'stamping') return;
    const timer = window.setTimeout(() => onStamped?.(), reducedMotion ? 0 : STAMP_MS);
    // A single tick as the stamp lands, where the device has one to give.
    const impact = reducedMotion ? 0 : window.setTimeout(() => navigator.vibrate?.(12), IMPACT_MS);
    return () => {
      window.clearTimeout(timer);
      window.clearTimeout(impact);
    };
  }, [phase, reducedMotion, onStamped]);

  return (
    <div
      ref={root}
      className="stay-pass"
      data-phase={phase}
      {...pointer}
    >
      <div className="stay-pass__tilt">
        <div className="stay-pass__press">
          <article className="stay-pass__face">
            <span className="stay-pass__foil" aria-hidden="true" />
            <div className="stay-pass__panel">
              <div className="stay-pass__photo">
                {art}
                <span className="stay-pass__holo" aria-hidden="true" />
                <span className="stay-pass__stamp-spot" aria-hidden="true">
                  {confirmed ? (
                    <span className="stay-pass__stamp">
                      <DigitalStamp />
                    </span>
                  ) : null}
                </span>
              </div>

              <div className="stay-pass__top">
                <CabanaMark className="stay-pass__mark" />
              </div>

              <div className="stay-pass__body">
                {/* Always laid out, so the card does not reflow when it appears. */}
                <p className="stay-pass__status" aria-hidden={!confirmed}>Confirmed</p>
                <h2 className="stay-pass__property">{booking.property}</h2>
                <p className="stay-pass__room">{booking.roomType} · {booking.city}</p>

                <div className="stay-pass__dates">
                  <div>
                    <small>Check-in</small>
                    <b>{format(booking.checkIn)}</b>
                    <span>from {CHECK_IN_FROM}</span>
                  </div>
                  <i><span>{nights} {nights === 1 ? 'night' : 'nights'}</span></i>
                  <div>
                    <small>Check-out</small>
                    <b>{format(booking.checkOut)}</b>
                    <span>until {CHECK_OUT_BY}</span>
                  </div>
                </div>

                <dl className="stay-pass__stub">
                  <div><dt>Guest</dt><dd>{booking.guestName}</dd></div>
                  <div><dt>Guests</dt><dd>{booking.guestCount}</dd></div>
                  <div><dt>Booked via</dt><dd>{booking.source}</dd></div>
                </dl>
              </div>
            </div>
            <span className="stay-pass__glare" aria-hidden="true" />
            <span className="stay-pass__sweep" aria-hidden="true" />
          </article>
        </div>
      </div>
    </div>
  );
}

/**
 * The whole booking-found screen: the question, the card, and the ceremony
 * that answers it. `onConfirm` runs only once the guest has seen the stay
 * become theirs and chosen to continue.
 */
export function StayConfirm({ booking, art, doneText, onConfirm, secondary }: {
  booking: Booking;
  art: ReactNode;
  doneText: string;
  onConfirm: () => void;
  secondary?: ReactNode;
}) {
  const [phase, setPhase] = useState<Phase>('idle');
  const done = phase === 'done';
  // Stable, so a parent re-render mid-press does not restart the press's timer.
  const finishStamp = useCallback(() => setPhase('done'), []);

  /*
    No button to leave: once confirmed, the guest gets a beat to take it in and
    the stay opens by itself. The latest `onConfirm` is read through a ref so
    a parent re-render during that beat cannot restart it.
  */
  const confirmRef = useRef(onConfirm);
  useEffect(() => {
    confirmRef.current = onConfirm;
  }, [onConfirm]);
  useEffect(() => {
    if (!done) return;
    const timer = window.setTimeout(() => confirmRef.current(), SETTLE_MS);
    return () => window.clearTimeout(timer);
  }, [done]);

  return (
    <div className="guest-stack guest-stack--intro stay-confirm" data-phase={phase}>
      <div className="guest-page-title stay-confirm__title" key={done ? 'done' : 'ask'} aria-live="polite">
        {done ? null : <p className="guest-eyebrow">Booking found</p>}
        <h1>{done ? 'Stay connected' : 'Is this your stay?'}</h1>
        <p>{done ? doneText : 'Check the details, then continue.'}</p>
      </div>

      <StayInvitation booking={booking} art={art} phase={phase} onStamped={finishStamp} />

      <Button
        className="guest-button guest-button--primary stay-confirm__action"
        type="button"
        aria-disabled={phase !== 'idle' || undefined}
        onClick={() => { if (phase === 'idle') setPhase('stamping'); }}
      >
        Yes this is my booking
        <svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
      </Button>
      <div className="stay-confirm__secondary">{secondary}</div>
    </div>
  );
}

/*
  The room key: the stay pass's sibling for the moment the scan succeeds.
  Same pearl frame, sheen and tilt, cut to a key card's landscape shape --
  the hotel photograph fading into plum on the right, the room number large
  in the serif, and the guest and dates along the foot.
  "Unlocked" is stamped in the corner in the gold foil the pass says
  Confirmed in, and the card rests on a lit stage with a floor shadow.
*/
export function RoomKey({ property, roomNumber, guestName, dates, art }: {
  property: string;
  roomNumber?: string;
  guestName?: string;
  dates?: string;
  /** The property photograph. */
  art: ReactNode;
}) {
  const steady = useRef(false);
  const { root, pointer } = usePassTilt(steady);
  return (
    <div className="room-key-stage">
      <div ref={root} className="stay-pass room-key" data-phase="done" {...pointer}>
        <div className="stay-pass__tilt">
          <div className="stay-pass__press">
            <article className="stay-pass__face" aria-label={roomNumber ? `Room ${roomNumber} key, ${property}` : `Room key, ${property}`}>
              <span className="stay-pass__foil" aria-hidden="true" />
              <div className="stay-pass__panel">
                <div className="stay-pass__photo">
                  {art}
                  <span className="stay-pass__holo" aria-hidden="true" />
                </div>
                <div className="room-key__body">
                  <span className="room-key__property">{property}</span>
                  {/* The number when the property has one; otherwise the key still says what happened. */}
                  <span className="room-key__room">
                    <small>{roomNumber ? 'Room' : 'Your room'}</small>
                    <b className={roomNumber ? undefined : 'is-word'}>{roomNumber ?? 'Connected'}</b>
                  </span>
                  <span className="room-key__foot">
                    <span>{[guestName, dates].filter(Boolean).join(' · ')}</span>
                  </span>
                </div>
                {/* Stamped on the key itself, in the corner a mark would take. */}
                <span className="room-key__stamp">Unlocked</span>
              </div>
              <span className="stay-pass__glare" aria-hidden="true" />
              <span className="stay-pass__sweep" aria-hidden="true" />
            </article>
          </div>
        </div>
      </div>
    </div>
  );
}
