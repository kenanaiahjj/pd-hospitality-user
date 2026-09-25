'use client';

import Image from 'next/image';
import { useEffect, useRef } from 'react';

import { BADGE_ART_BOUNDS, type ArtBounds } from './badge-art-bounds';
import { BADGE_FAMILIES, BADGE_STAMP_GOLD } from './badge-model';
import type { BadgeDefinition } from './badge-model';

/*
  An earned badge, as a coin you can pick up.

  The flat medal says what you earned; the coin says it is yours. It has an
  edge, so it reads as an object rather than a sticker, and a back engraved
  with the holder, the day and their number -- the part nobody else's copy of
  the badge shares.

  Motion is imperative on purpose. A drag updates sixty times a second, and
  routing that through state would re-render the page on every frame; instead
  the angle lives in a ref and is written to one CSS custom property. Nothing
  here writes a ref during render, which is what the React Compiler rules ask.

  Reduced motion gets the coin without the opening turn or the coast after a
  flick. A tap still turns it over -- that is the guest asking.
*/

/*
  The plate and rim are clipped to the family's shape, fitted to where this
  badge's own artwork is drawn (measured by scripts/measure-badge-art.mjs).
  One hand-tuned shape per family spilled past most frames -- a pale slab
  under a square, a halo round a circle -- because no two drawings sit on
  their canvas alike. Inset a little, so the edge hides under the frame.
*/
const FIT_INSET = 2.4;
/** Each polygon family's outline, in its own 0-100 box. */
const OUTLINES: Record<string, [number, number][]> = {
  shield: [[50, 0], [100, 14], [100, 58], [50, 100], [0, 58], [0, 14]],
  hexagon: [[50, 0], [100, 24], [100, 76], [50, 100], [0, 76], [0, 24]],
  pentagon: [[50, 0], [100, 39], [84, 100], [16, 100], [0, 39]],
};

function fittedShape(shape: string, [top, right, bottom, left]: ArtBounds): string {
  const t = top + FIT_INSET, r = right + FIT_INSET, b = bottom + FIT_INSET, l = left + FIT_INSET;
  const width = 100 - l - r;
  const height = 100 - t - b;
  const pct = (value: number) => `${value.toFixed(1)}%`;
  if (shape === 'circle') return `ellipse(${pct(width / 2)} ${pct(height / 2)} at ${pct(l + width / 2)} ${pct(t + height / 2)})`;
  if (shape === 'square') return `inset(${pct(t)} ${pct(r)} ${pct(b)} ${pct(l)} round 17%)`;
  if (shape === 'capsule') return `inset(${pct(t)} ${pct(r)} ${pct(b)} ${pct(l)} round 999px)`;
  const outline = OUTLINES[shape];
  if (!outline) return `inset(${pct(t)} ${pct(r)} ${pct(b)} ${pct(l)})`;
  return `polygon(${outline.map(([x, y]) => `${pct(l + (x / 100) * width)} ${pct(t + (y / 100) * height)}`).join(', ')})`;
}

/** Slices stacked behind the front face. More reads smoother and costs layers. */
const SLICES = 14;
/** Degrees per pixel dragged. */
const DRAG_GAIN = 0.7;
/** Past this many pixels of travel, a press was a drag, not a tap. */
const TAP_SLOP = 6;

type Motion = {
  angle: number;
  velocity: number;
  target: number | null;
  frame: number;
  dragging: boolean;
  lastX: number;
  travel: number;
  reduced: boolean;
};

const paint = (element: HTMLElement | null, angle: number) => {
  if (!element) return;
  element.style.setProperty('--coin-turn', `${angle}deg`);
  // The light rakes across the face as it turns, instead of sitting still.
  element.style.setProperty('--coin-light', `${50 + Math.sin((angle * Math.PI) / 180) * 70}%`);
};

const nearestFace = (angle: number) => Math.round(angle / 180) * 180;

export const formatEarnedOn = (iso: string): string =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC',
  });

export type BadgeCoinProps = {
  badge: BadgeDefinition;
  /** Engraved on the back. */
  holder: string;
  earnedOn?: string;
  serial: string;
};

export function BadgeCoin({ badge, holder, earnedOn, serial }: BadgeCoinProps) {
  const bodyRef = useRef<HTMLSpanElement>(null);
  const motion = useRef<Motion>({
    angle: 0, velocity: 0, target: null, frame: 0,
    dragging: false, lastX: 0, travel: 0, reduced: false,
  });
  const family = BADGE_FAMILIES[badge.family];

  /* Coast, then come to rest on whichever face is nearer (or the one asked for). */
  const settle = () => {
    const m = motion.current;
    cancelAnimationFrame(m.frame);

    let last = 0;

    /* Time-based, in 60 Hz frames: a 120 Hz phone must coast the same
       distance as a 60 Hz one, not twice as far. */
    const step = (now: number) => {
      const frames = last ? Math.min((now - last) / (1000 / 60), 4) : 1;
      last = now;

      if (Math.abs(m.velocity) > 0.3 && !m.reduced) {
        m.angle += m.velocity * frames;
        m.velocity *= 0.95 ** frames;
      } else {
        m.velocity = 0;
        const target = m.target ?? nearestFace(m.angle);
        const gap = target - m.angle;
        if (Math.abs(gap) < 0.15) {
          m.angle = target;
          m.target = null;
          paint(bodyRef.current, m.angle);
          return;
        }
        m.angle += gap * (1 - (1 - (m.reduced ? 0.3 : 0.12)) ** frames);
      }
      paint(bodyRef.current, m.angle);
      m.frame = requestAnimationFrame(step);
    };

    m.frame = requestAnimationFrame(step);
  };

  /* The opening turn: over to the engraving, a beat to read it, and back. */
  useEffect(() => {
    const m = motion.current;
    m.reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    paint(bodyRef.current, 0);
    if (m.reduced) return undefined;

    const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
    const legs = [
      { from: 0, to: 180, start: 350, duration: 1000 },
      { from: 180, to: 360, start: 2450, duration: 1000 },
    ];
    let origin = 0;

    const tick = (now: number) => {
      origin ||= now;
      const elapsed = now - origin;
      const leg = [...legs].reverse().find((entry) => elapsed >= entry.start);
      if (leg) {
        const t = Math.min((elapsed - leg.start) / leg.duration, 1);
        m.angle = leg.from + (leg.to - leg.from) * ease(t);
        paint(bodyRef.current, m.angle);
      }
      const last = legs[legs.length - 1]!;
      if (elapsed < last.start + last.duration) {
        m.frame = requestAnimationFrame(tick);
      } else {
        m.angle = 0;
        paint(bodyRef.current, 0);
      }
    };

    m.frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(m.frame);
  }, []);

  const onPointerDown = (event: React.PointerEvent<HTMLButtonElement>) => {
    const m = motion.current;
    cancelAnimationFrame(m.frame);
    event.currentTarget.setPointerCapture?.(event.pointerId);
    event.currentTarget.dataset.held = '';
    m.dragging = true;
    m.lastX = event.clientX;
    m.travel = 0;
    m.velocity = 0;
    m.target = null;
  };

  const onPointerMove = (event: React.PointerEvent<HTMLButtonElement>) => {
    const m = motion.current;
    if (!m.dragging) return;
    const dx = event.clientX - m.lastX;
    m.lastX = event.clientX;
    m.travel += Math.abs(dx);
    m.angle += dx * DRAG_GAIN;
    // Smoothed, so one jittery sample at release does not decide the coast.
    m.velocity = m.velocity * 0.4 + dx * DRAG_GAIN * 0.6;
    paint(bodyRef.current, m.angle);
  };

  const onPointerUp = (event: React.PointerEvent<HTMLButtonElement>) => {
    const m = motion.current;
    delete event.currentTarget.dataset.held;
    if (!m.dragging) return;
    m.dragging = false;
    settle();
  };

  const onClick = () => {
    const m = motion.current;
    // The click that ends a drag is not a request to flip.
    if (m.travel > TAP_SLOP) {
      m.travel = 0;
      return;
    }
    m.velocity = 0;
    m.target = nearestFace(m.angle) + 180;
    settle();
  };

  return (
    <button
      type="button"
      className="badge-coin"
      data-shape={family.shape}
      aria-label={`Turn the ${badge.name} medal over`}
      style={{
        '--medal-enamel': BADGE_STAMP_GOLD,
        ...(BADGE_ART_BOUNDS[badge.id]
          ? {
            '--coin-shape': fittedShape(family.shape, BADGE_ART_BOUNDS[badge.id]!),
            // The cast shadow sits under the drawing, not the empty canvas below it.
            '--coin-floor': `${BADGE_ART_BOUNDS[badge.id]![2]}%`,
          }
          : {}),
        // The art's own alpha, so light lands on the metal and enamel, not the air around it.
        ...(badge.art ? { '--coin-art': `url(${badge.art})` } : {}),
      } as React.CSSProperties}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onClick={onClick}
    >
      {/* Idles with a slow wobble so the light keeps moving when nobody is
          touching it; the turn is on the body inside, so the two compose. */}
      <span className="badge-coin__float" aria-hidden="true">
      <span ref={bodyRef} className="badge-coin__body">
        {Array.from({ length: SLICES }, (_, index) => (
          <span
            key={index}
            className="badge-coin__slice"
            style={{ '--slice': (index + 0.5) / SLICES - 0.5 } as React.CSSProperties}
          >
            {/* The clip lives on a child: Chromium paints past a clip-path set
                on the same element as a 3D transform. */}
            <i />
          </span>
        ))}

        <span className="badge-coin__face badge-coin__face--front">
          <span className="badge-coin__plate" />
          {badge.art ? (
            <Image className="badge-coin__art" src={badge.art} alt="" width={512} height={512} priority />
          ) : null}
          <span className="badge-coin__shine" />
          <span className="badge-coin__glare" />
          <span className="badge-coin__sweep" />
        </span>

        <span className="badge-coin__face badge-coin__face--back">
          <span className="badge-coin__plate badge-coin__plate--back" />
          <span className="badge-coin__engraving">
            <span>Cabana</span>
            <b>{holder}</b>
            {earnedOn ? <span>{formatEarnedOn(earnedOn)}</span> : null}
            <span>{serial}</span>
          </span>
          <span className="badge-coin__shine" />
          <span className="badge-coin__sweep badge-coin__sweep--back" />
        </span>
      </span>
      </span>

      {/* Glints that catch and let go, off the coin's edge. */}
      <span className="badge-coin__glints" aria-hidden="true">
        <i /><i /><i />
      </span>
    </button>
  );
}
