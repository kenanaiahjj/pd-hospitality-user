'use client';

import { useCallback, useEffect, useId, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react';
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
/** The beat between the seal settling and the stay opening. */
const SETTLE_MS = 1100;

const day = (isoDate: string) => new Date(`${isoDate}T12:00:00`);
/** "Mon 9 Nov": day before month reads as a travel document, not a US form. */
const format = (isoDate: string) => day(isoDate).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });

type Phase = 'idle' | 'stamping' | 'done';

/*
  The wax's outline: a poured puddle, not a coin. A few slow lobes where the
  wax ran further one way than another, finer ripples on top, and the SVG
  filter below roughens it again so no two scallops match.
*/
const WAX_PATH = (() => {
  const steps = 240;
  const points: string[] = [];
  for (let i = 0; i < steps; i += 1) {
    const t = (i / steps) * Math.PI * 2;
    const r = 50 + 3.1 * Math.sin(t * 3 + 0.6) + 2 * Math.sin(t * 5 + 2.1) + 1.1 * Math.sin(t * 9 + 1) + 0.5 * Math.sin(t * 17 + 0.3);
    points.push(`${(60 + r * Math.cos(t)).toFixed(2)} ${(60 + r * Math.sin(t)).toFixed(2)}`);
  }
  return `M${points.join('L')}Z`;
})();
const BEADS = Array.from({ length: 32 }, (_, i) => {
  const t = (i / 32) * Math.PI * 2;
  return { cx: (60 + 28.4 * Math.cos(t)).toFixed(2), cy: (60 + 28.4 * Math.sin(t)).toFixed(2) };
});

/*
  The seal itself, lit rather than painted. Each layer is a flat shape; SVG
  lighting filters give it depth from its own alpha, the way light falls on
  a real surface:
    wax     the puddle, edge roughened, domed by a soft bevel and glossed
    well    the die's impression, lit from the opposite side so it sinks
    relief  the crest and legend, raised out of the well and foiled in gold
*/
function WaxSeal({ legend }: { legend: string }) {
  const id = useId();
  const [ring, gold, wax, well, waxLight, wellLight, relief] =
    ['ring', 'gold', 'wax', 'well', 'wax-light', 'well-light', 'relief'].map((name) => `${id}-${name}`);
  return (
    <span className="stay-pass__seal-disc">
      <svg className="stay-pass__seal-art" viewBox="0 0 120 120" aria-hidden="true">
        <defs>
          <radialGradient id={wax} cx="42%" cy="38%" r="70%">
            <stop offset="0" stopColor="#6e2449" />
            <stop offset="0.6" stopColor="#4a1530" />
            <stop offset="1" stopColor="#300b1e" />
          </radialGradient>
          <radialGradient id={well} cx="50%" cy="50%" r="55%">
            <stop offset="0" stopColor="#521838" />
            <stop offset="1" stopColor="#3a0f26" />
          </radialGradient>
          <linearGradient id={gold} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#f3dfa8" />
            <stop offset="0.4" stopColor="#c59a4c" />
            <stop offset="0.62" stopColor="#ecd08c" />
            <stop offset="1" stopColor="#9c7230" />
          </linearGradient>

          <filter id={waxLight} x="-15%" y="-15%" width="130%" height="130%" colorInterpolationFilters="sRGB">
            <feTurbulence type="fractalNoise" baseFrequency="0.045" numOctaves="2" seed="11" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="4.5" xChannelSelector="R" yChannelSelector="G" result="shape" />
            <feGaussianBlur in="shape" stdDeviation="2.6" result="dome" />
            <feDiffuseLighting in="dome" surfaceScale="3.2" diffuseConstant="1.12" lightingColor="#ffffff" result="diffuse">
              <feDistantLight azimuth="225" elevation="52" />
            </feDiffuseLighting>
            <feComposite in="diffuse" in2="shape" operator="in" result="diffuseIn" />
            <feBlend in="shape" in2="diffuseIn" mode="multiply" result="shaded" />
            <feSpecularLighting in="dome" surfaceScale="4.5" specularConstant="0.85" specularExponent="26" lightingColor="#ffe9f2" result="gloss">
              <fePointLight x="22" y="14" z="70" />
            </feSpecularLighting>
            <feComposite in="gloss" in2="shape" operator="in" result="glossIn" />
            <feComposite in="glossIn" in2="shaded" operator="arithmetic" k1="0" k2="0.7" k3="1" k4="0" />
          </filter>

          {/* Negative relief: the same light, but the surface falls away, so the rim catches it low-right. */}
          <filter id={wellLight} x="-10%" y="-10%" width="120%" height="120%" colorInterpolationFilters="sRGB">
            <feGaussianBlur in="SourceAlpha" stdDeviation="1.8" result="dip" />
            <feDiffuseLighting in="dip" surfaceScale="-3" diffuseConstant="1.1" lightingColor="#ffffff" result="diffuse">
              <feDistantLight azimuth="225" elevation="50" />
            </feDiffuseLighting>
            <feComposite in="diffuse" in2="SourceAlpha" operator="in" result="diffuseIn" />
            <feBlend in="SourceGraphic" in2="diffuseIn" mode="multiply" />
          </filter>

          <filter id={relief} x="-10%" y="-10%" width="120%" height="120%" colorInterpolationFilters="sRGB">
            <feGaussianBlur in="SourceAlpha" stdDeviation="0.45" result="bump" />
            <feSpecularLighting in="bump" surfaceScale="1.6" specularConstant="1" specularExponent="18" lightingColor="#fff6dc" result="shine">
              <fePointLight x="24" y="16" z="60" />
            </feSpecularLighting>
            <feComposite in="shine" in2="SourceAlpha" operator="in" result="shineIn" />
            <feOffset in="SourceAlpha" dx="0.5" dy="0.7" result="drop" />
            <feFlood floodColor="#1a0510" floodOpacity="0.6" />
            <feComposite in2="drop" operator="in" result="shadow" />
            <feMerge>
              <feMergeNode in="shadow" />
              <feMergeNode in="SourceGraphic" />
              <feMergeNode in="shineIn" />
            </feMerge>
          </filter>

          {/* Starts at the left and runs clockwise over the top, so the legend reads upright. */}
          <path id={ring} d="M 25.5 60 A 34.5 34.5 0 1 1 94.5 60 A 34.5 34.5 0 1 1 25.5 60" />
        </defs>

        <path d={WAX_PATH} fill={`url(#${wax})`} filter={`url(#${waxLight})`} />
        <circle cx="60" cy="60" r="39.5" fill={`url(#${well})`} filter={`url(#${wellLight})`} />
        <g filter={`url(#${relief})`}>
          <circle cx="60" cy="60" r="38.2" fill="none" stroke={`url(#${gold})`} strokeWidth="0.9" />
          <text className="stay-pass__seal-legend" fill={`url(#${gold})`}>
            <textPath href={`#${ring}`} textLength="212" lengthAdjust="spacing">{legend}</textPath>
          </text>
          {BEADS.map((bead, i) => <circle key={i} cx={bead.cx} cy={bead.cy} r="0.75" fill={`url(#${gold})`} />)}
          <circle cx="60" cy="60" r="25" fill="none" stroke={`url(#${gold})`} strokeWidth="0.6" />
          <svg x="40" y="47" width="40" height="26.1" viewBox="12.32 4.11 277.98 181.58" overflow="visible">
            <CabanaMark style={{ fill: `url(#${gold})` }} />
          </svg>
        </g>
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
              </div>
            </div>
            <span className="stay-pass__glare" aria-hidden="true" />
            <span className="stay-pass__sweep" aria-hidden="true" />
          </article>
        </div>

        <span className="stay-pass__seal-spot" aria-hidden="true">
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
    No button to leave: once sealed, the guest gets a beat to take it in and
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
