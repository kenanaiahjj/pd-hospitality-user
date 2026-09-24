'use client';

import { useCallback, useEffect, useId, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react';
import { Button } from '@/components/ui';
import { CabanaMark } from '@/components/ui/cabana-logo';
import { usePrefersReducedMotion } from '@/lib/hooks';
import type { Booking } from './prototype-model';
import './stay-invitation.css';

/*
  The booking-found card, set as a keepsake: a pearl frame with scalloped
  corners around a photograph panel, with a pearl sheen that slides with the
  tilt the way light moves across nacre. At rest it drifts a few degrees on
  its own axes, as if held in a hand; a finger on it takes over the tilt and
  lets go back into the drift.

  Confirming is a small ceremony rather than a page change: the screen's
  chrome steps back, the card steadies, and a blind-embossed pearl seal is
  pressed onto its corner -- the card gives under it, then light catches the
  relief. Only then does the guest move on, so the moment the stay becomes
  theirs is one they see.
*/

const MAX_TILT = 11; // degrees, at full finger deflection
/** The press, start to settle. Must cover the seal animations in stay-invitation.css. */
const STAMP_MS = 1150;

const day = (isoDate: string) => new Date(`${isoDate}T12:00:00`);
const format = (isoDate: string) => day(isoDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

type Phase = 'idle' | 'stamping' | 'done';

/*
  Glints thrown off the seal as it lands. Deterministic, so every press (and
  every screenshot) is the same.
*/
const SPARKS = Array.from({ length: 16 }, (_, i) => ({
  angle: i * (360 / 16) + ((i * 37) % 17) - 8,
  distance: 62 + ((i * 29) % 52),
  size: 8 + ((i * 11) % 8),
  delay: ((i * 7) % 5) * 20,
  tone: i % 3,
}));

/*
  The seal's outline: a rosette of 32 scallops, round on the outside and
  pinched between, like the edge of a pressed wax or foil seal. Built once as
  a path in a 120-unit box and used as the disc's mask.
*/
const ROSETTE_PATH = (() => {
  const steps = 384;
  const points: string[] = [];
  for (let i = 0; i < steps; i += 1) {
    const t = (i / steps) * Math.PI * 2;
    const r = 55 + 4.4 * Math.sqrt(Math.abs(Math.sin(t * 16)));
    points.push(`${(60 + r * Math.cos(t)).toFixed(2)} ${(60 + r * Math.sin(t)).toFixed(2)}`);
  }
  return `M${points.join('L')}Z`;
})();
const ROSETTE_MASK = `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 120'><path d='${ROSETTE_PATH}'/></svg>`)}")`;
const BEADS = Array.from({ length: 44 }, (_, i) => {
  const t = (i / 44) * Math.PI * 2;
  return { cx: (60 + 47.6 * Math.cos(t)).toFixed(2), cy: (60 + 47.6 * Math.sin(t)).toFixed(2) };
});

/** The seal itself: pearl, with everything on it raised rather than printed. */
function StaySeal({ legend }: { legend: string }) {
  const ring = useId();
  return (
    <span className="stay-pass__seal-disc" style={{ '--seal-mask': ROSETTE_MASK } as CSSProperties}>
      <svg className="stay-pass__seal-art" viewBox="0 0 120 120" aria-hidden="true">
        <defs>
          {/* Starts at the left and runs clockwise over the top, so the legend reads upright. */}
          <path id={ring} d="M 22.5 60 A 37.5 37.5 0 1 1 97.5 60 A 37.5 37.5 0 1 1 22.5 60" />
        </defs>
        <circle cx="60" cy="60" r="53.2" fill="none" stroke="currentColor" strokeWidth="1.6" />
        {BEADS.map((bead, i) => <circle key={i} cx={bead.cx} cy={bead.cy} r="0.95" fill="currentColor" />)}
        <circle cx="60" cy="60" r="44" fill="none" stroke="currentColor" strokeWidth="0.8" />
        <text className="stay-pass__seal-legend" fill="currentColor">
          <textPath href={`#${ring}`} textLength="230" lengthAdjust="spacing">{legend}</textPath>
        </text>
        <circle cx="60" cy="60" r="30.5" fill="none" stroke="currentColor" strokeWidth="1.1" />
        <circle cx="60" cy="60" r="28.3" fill="none" stroke="currentColor" strokeWidth="0.5" />
      </svg>
      <CabanaMark className="stay-pass__seal-mark" />
    </span>
  );
}

export function StayInvitation({ booking, art, phase = 'idle', onStamped }: {
  booking: Booking;
  /** The property photograph; it is stretched to fill the panel. */
  art: ReactNode;
  phase?: Phase;
  onStamped?: () => void;
}) {
  const reducedMotion = usePrefersReducedMotion();
  const root = useRef<HTMLDivElement>(null);
  /** Where a finger (or pointer) is holding the card, or null to drift. */
  const held = useRef<{ x: number; y: number } | null>(null);
  /** Read by the tilt loop, which outlives renders. */
  const phaseRef = useRef<Phase>(phase);

  const nights = Math.max(1, Math.round((day(booking.checkOut).getTime() - day(booking.checkIn).getTime()) / 86_400_000));
  const legend = `Confirmed stay · ${booking.city} · ${booking.checkIn.slice(0, 4)} · `.toUpperCase();

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  /*
    One loop owns the tilt. At rest the target is a slow drift -- sines at
    unrelated rates, so it never visibly repeats -- plus a slight twist and a
    few pixels of float. A held card follows the finger instead, and a card
    being stamped steadies flat so the press lands square. Either way the card
    eases toward its target, so every change glides rather than snaps. The CSS
    reads the variables for the 3D turn, the sheen, the glare and the shadow.
  */
  useEffect(() => {
    const node = root.current;
    if (!node || reducedMotion) return;
    const current = { x: 0, y: 0, twist: 0 };
    const start = performance.now();
    let frame = 0;
    let visible = true;

    const loop = (now: number) => {
      const t = (now - start) / 1000;
      const steady = phaseRef.current === 'stamping';
      const target = steady ? { x: 0, y: 0 } : held.current ?? {
        x: Math.sin(t * 0.61) * 0.36 + Math.sin(t * 0.17 + 1.3) * 0.14,
        y: Math.sin(t * 0.43 + 0.8) * 0.3 + Math.sin(t * 0.23) * 0.1,
      };
      const ease = steady ? 0.14 : held.current ? 0.16 : 0.05;
      current.x += (target.x - current.x) * ease;
      current.y += (target.y - current.y) * ease;
      current.twist += ((steady ? 0 : Math.sin(t * 0.33 + 2) * 0.7) - current.twist) * ease;

      const float = steady ? 0 : Math.sin(t * 0.9);
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
  }, [reducedMotion]);

  /*
    The press's end is a timer, not `animationend`: that event never fires
    where there is no animation (jsdom, a tab in the background), and the
    guest must never be stranded mid-ceremony.
  */
  useEffect(() => {
    if (phase !== 'stamping') return;
    const timer = window.setTimeout(() => onStamped?.(), reducedMotion ? 0 : STAMP_MS);
    return () => window.clearTimeout(timer);
  }, [phase, reducedMotion, onStamped]);

  const hold = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (reducedMotion || phase === 'stamping') return;
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

  return (
    <div
      ref={root}
      className="stay-pass"
      data-phase={phase}
      onPointerDown={hold}
      onPointerMove={(event) => { if (event.pointerType === 'mouse' || event.buttons) hold(event); }}
      onPointerUp={(event) => { if (event.pointerType !== 'mouse') release(event); }}
      onPointerLeave={release}
      onPointerCancel={release}
    >
      <div className="stay-pass__tilt">
        <div className="stay-pass__press">
          <article className="stay-pass__face">
            <span className="stay-pass__foil" aria-hidden="true" />
            <div className="stay-pass__panel">
              <div className="stay-pass__photo">
                {art}
                <span className="stay-pass__holo" aria-hidden="true" />
              </div>

              <div className="stay-pass__top">
                <CabanaMark className="stay-pass__mark" />
              </div>

              <div className="stay-pass__body">
                <h2 className="stay-pass__property">{booking.property}</h2>
                <p className="stay-pass__room">{booking.roomType} · {booking.city}</p>
                <p className="stay-pass__dates">
                  <span>{format(booking.checkIn)}</span>
                  <i aria-hidden="true" />
                  <span>{format(booking.checkOut)}</span>
                  <b>{nights} {nights === 1 ? 'night' : 'nights'}</b>
                </p>

                <dl className="stay-pass__stub">
                  <div><dt>Guest</dt><dd>{booking.guestName}</dd></div>
                  <div><dt>Guests</dt><dd>{booking.guestCount} guests</dd></div>
                  <div><dt>Booked through</dt><dd>{booking.source}</dd></div>
                </dl>
                <small className="stay-pass__ref">Booking {booking.id}</small>
              </div>
            </div>
            <span className="stay-pass__glare" aria-hidden="true" />
            <span className="stay-pass__sweep" aria-hidden="true" />
          </article>
        </div>

        {phase === 'idle' ? null : (
          <span className="stay-pass__seal-spot" aria-hidden="true">
            <span className="stay-pass__ripple" />
            <span className="stay-pass__seal">
              <StaySeal legend={legend} />
            </span>
            {reducedMotion ? null : (
              <span className="stay-pass__sparks">
                {SPARKS.map((spark, i) => (
                  <i
                    key={i}
                    className={`stay-pass__spark stay-pass__spark--${spark.tone}`}
                    style={{
                      '--a': `${spark.angle}deg`,
                      '--d': `${spark.distance}px`,
                      '--s': `${spark.size}px`,
                      animationDelay: `${680 + spark.delay}ms`,
                    } as CSSProperties}
                  />
                ))}
              </span>
            )}
          </span>
        )}
      </div>
    </div>
  );
}

/**
 * The whole booking-found screen: the question, the card, and the ceremony
 * that answers it. `onConfirm` runs only once the guest has seen the stay
 * become theirs and chosen to continue.
 */
export function StayConfirm({ booking, art, continueLabel, doneText, onConfirm, secondary }: {
  booking: Booking;
  art: ReactNode;
  continueLabel: string;
  doneText: string;
  onConfirm: () => void;
  secondary?: ReactNode;
}) {
  const [phase, setPhase] = useState<Phase>('idle');
  const done = phase === 'done';
  // Stable, so a parent re-render mid-press does not restart the press's timer.
  const finishStamp = useCallback(() => setPhase('done'), []);

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
        aria-disabled={phase === 'stamping' || undefined}
        onClick={() => {
          if (phase === 'idle') setPhase('stamping');
          else if (done) onConfirm();
        }}
      >
        {done ? continueLabel : 'Yes this is my booking'}
        <svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
      </Button>
      <div className="stay-confirm__secondary">{secondary}</div>
    </div>
  );
}
