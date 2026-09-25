'use client';

import { useCallback, useEffect, useId, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react';
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
  chrome steps back, the card steadies, and a plum wax seal with a gold-foil
  crest is pressed over the perforation -- it hovers, drops, squashes, the
  card gives under it and the wax spreads, then light crosses the foil and
  "Confirmed" settles in above the property. Only then does the guest move
  on, so the moment the stay becomes theirs is one they see.
*/

const MAX_TILT = 11; // degrees, at full finger deflection
/** The press, start to settle. Must cover the seal animations in stay-invitation.css. */
const STAMP_MS = 1150;
/** When the wax meets the card, within the press. Matches the 62% keyframe of `stay-pass-stamp`. */
const IMPACT_MS = 620;

const day = (isoDate: string) => new Date(`${isoDate}T12:00:00`);
/** "Mon 9 Nov": day before month reads as a travel document, not a US form. */
const format = (isoDate: string) => day(isoDate).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });

type Phase = 'idle' | 'stamping' | 'done';

/*
  The wax's outline: a disc whose edge wanders the way poured wax does,
  built from a few unrelated ripples so it never looks machined. Drawn in a
  120-unit box and used both as the seal's shape and as its sheen's mask.
*/
const WAX_PATH = (() => {
  const steps = 240;
  const points: string[] = [];
  for (let i = 0; i < steps; i += 1) {
    const t = (i / steps) * Math.PI * 2;
    const r = 54.5 + 2.1 * Math.sin(t * 5 + 1.1) + 1.3 * Math.sin(t * 11 + 0.4) + 0.7 * Math.sin(t * 23 + 2.2);
    points.push(`${(60 + r * Math.cos(t)).toFixed(2)} ${(60 + r * Math.sin(t)).toFixed(2)}`);
  }
  return `M${points.join('L')}Z`;
})();
const WAX_MASK = `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 120'><path d='${WAX_PATH}'/></svg>`)}")`;
const BEADS = Array.from({ length: 36 }, (_, i) => {
  const t = (i / 36) * Math.PI * 2;
  return { cx: (60 + 32.6 * Math.cos(t)).toFixed(2), cy: (60 + 32.6 * Math.sin(t)).toFixed(2) };
});

/*
  Guilloche: the fine interlaced line-work on banknotes and certificates.
  Three families of phase-shifted waves, drawn once, etched faintly into the
  lower panel where it reads as texture rather than pattern.
*/
const GUILLOCHE = (() => {
  const paths: string[] = [];
  for (let family = 0; family < 3; family += 1) {
    for (let k = 0; k < 9; k += 1) {
      const points: string[] = [];
      for (let x = 0; x <= 360; x += 6) {
        const y = 60 + (18 + family * 7) * Math.sin(x * (0.021 + family * 0.006) + k * 0.7 + family) * Math.cos(x * 0.004 + k * 0.2);
        points.push(`${x} ${y.toFixed(1)}`);
      }
      paths.push(`M${points.join('L')}`);
    }
  }
  return paths;
})();

/** The seal itself: plum wax, with a crest and legend pressed into it and foiled in gold. */
function WaxSeal({ legend }: { legend: string }) {
  const id = useId();
  const [ring, gold, wax, well] = ['ring', 'gold', 'wax', 'well'].map((name) => `${id}-${name}`);
  return (
    <span className="stay-pass__seal-disc" style={{ '--seal-mask': WAX_MASK } as CSSProperties}>
      <svg className="stay-pass__seal-art" viewBox="0 0 120 120" aria-hidden="true">
        <defs>
          <radialGradient id={wax} cx="38%" cy="32%" r="78%">
            <stop offset="0" stopColor="#7d2d55" />
            <stop offset="0.55" stopColor="#4e1834" />
            <stop offset="1" stopColor="#2a0a1b" />
          </radialGradient>
          {/* The pressed well: dark where the die's edge shades it, lit where it faces the light. */}
          <linearGradient id={well} x1="0.2" y1="0.1" x2="0.8" y2="0.95">
            <stop offset="0" stopColor="#2c0b1d" />
            <stop offset="1" stopColor="#5e1f40" />
          </linearGradient>
          <linearGradient id={gold} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#f6e3b0" />
            <stop offset="0.38" stopColor="#c9a052" />
            <stop offset="0.62" stopColor="#f1d898" />
            <stop offset="1" stopColor="#a77c33" />
          </linearGradient>
          {/* Starts at the left and runs clockwise over the top, so the legend reads upright. */}
          <path id={ring} d="M 17.5 60 A 42.5 42.5 0 1 1 102.5 60 A 42.5 42.5 0 1 1 17.5 60" />
        </defs>
        <path d={WAX_PATH} fill={`url(#${wax})`} />
        {/* The raised lip the die squeezes up around its edge. */}
        <circle cx="60" cy="60" r="48.5" fill="none" stroke="#ffffff" strokeOpacity="0.16" strokeWidth="1.2" />
        <circle cx="60" cy="60" r="47.2" fill="none" stroke="#1d0612" strokeOpacity="0.45" strokeWidth="0.8" />
        <circle cx="60" cy="60" r="46" fill={`url(#${well})`} />
        <text className="stay-pass__seal-legend" fill={`url(#${gold})`}>
          <textPath href={`#${ring}`} textLength="262" lengthAdjust="spacing">{legend}</textPath>
        </text>
        <circle cx="60" cy="60" r="35.6" fill="none" stroke={`url(#${gold})`} strokeWidth="0.9" />
        {BEADS.map((bead, i) => <circle key={i} cx={bead.cx} cy={bead.cy} r="0.8" fill={`url(#${gold})`} />)}
        <circle cx="60" cy="60" r="29.6" fill="none" stroke={`url(#${gold})`} strokeWidth="0.5" />
        <svg x="36" y="44" width="48" height="31.4" viewBox="12.32 4.11 277.98 181.58" overflow="visible">
          <CabanaMark style={{ fill: `url(#${gold})` }} />
        </svg>
      </svg>
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
  const sealed = phase !== 'idle';

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
    // A single tick as the wax lands, where the device has one to give.
    const impact = reducedMotion ? 0 : window.setTimeout(() => navigator.vibrate?.(12), IMPACT_MS);
    return () => {
      window.clearTimeout(timer);
      window.clearTimeout(impact);
    };
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

              <svg className="stay-pass__guilloche" viewBox="0 0 360 120" preserveAspectRatio="none" aria-hidden="true">
                {GUILLOCHE.map((d, i) => <path key={i} d={d} />)}
              </svg>

              <div className="stay-pass__body">
                {/* Always laid out, so the card does not reflow when it appears. */}
                <p className="stay-pass__status" aria-hidden={!sealed}>Confirmed</p>
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
                <small className="stay-pass__ref">No. {booking.id}</small>
              </div>
            </div>
            <span className="stay-pass__glare" aria-hidden="true" />
            <span className="stay-pass__sweep" aria-hidden="true" />
          </article>
        </div>

        <span className="stay-pass__seal-spot" aria-hidden="true">
          {/* Where the seal will go: a faint pressed ring, so the empty corner reads as waiting. */}
          <span className="stay-pass__seal-well" />
          {sealed ? (
            <>
              <span className="stay-pass__spread" />
              <span className="stay-pass__seal">
                <WaxSeal legend={legend} />
              </span>
            </>
          ) : null}
        </span>
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
