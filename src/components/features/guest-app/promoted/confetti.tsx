'use client';

import { usePrefersReducedMotion } from '@/lib/hooks';

/*
  Celebration, and the only place in the app where colour is decoration.

  DESIGN.md reserves the accent for the primary action, the current selection
  and live state -- deliberately, so pink means something. This screen breaks
  that on purpose and alone: unlocking the room is the one moment in a stay
  worth marking, and a confetti burst that also appeared on a folio would
  make both meaningless. Anywhere else, this component is the wrong answer.
*/

const PIECES = 26;

/** Deterministic: same burst every render, so screenshots do not drift. */
const piece = (i: number) => ({
  left: (i * 37) % 100,
  delay: ((i * 13) % 9) / 10,
  duration: 2.6 + ((i * 7) % 12) / 10,
  drift: ((i * 29) % 40) - 20,
  size: 6 + ((i * 11) % 5),
  rounded: i % 3 === 0,
  tone: i % 3,
});

export function Confetti() {
  const reducedMotion = usePrefersReducedMotion();
  if (reducedMotion) return null;

  return (
    <div className="confetti" aria-hidden="true">
      {Array.from({ length: PIECES }, (_, i) => {
        const p = piece(i);
        return (
          <span
            key={i}
            className={`confetti__piece confetti__piece--${p.tone}${p.rounded ? ' is-round' : ''}`}
            style={{
              left: `${p.left}%`,
              width: p.size,
              height: p.rounded ? p.size : p.size * 1.6,
              animationDelay: `${p.delay}s`,
              animationDuration: `${p.duration}s`,
              ['--drift' as string]: `${p.drift}px`,
            }}
          />
        );
      })}
    </div>
  );
}
