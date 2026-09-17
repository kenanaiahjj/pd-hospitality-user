'use client';

import { Confetti } from '../promoted';
import { BadgeMedal } from './badge-medal';
import type { BadgeProgress } from './badge-model';

/*
  What a booking just earned.

  A badge is announced with the thing it changes, in the same breath. "You're
  now a Foodie" on its own is a sticker; saying what it will do next is the
  difference between a reward and a decoration.

  Confetti only when a badge lands. Points arrive on every booking, and a
  celebration that fires every time stops being one.
*/

export type PointsEarnedProps = {
  points: number;
  /** Badges this booking tipped over, if any. */
  badges: BadgeProgress[];
};

export function PointsEarned({ points, badges }: PointsEarnedProps) {
  if (points <= 0 && !badges.length) return null;

  return (
    <div className="points-earned">
      {badges.length ? <Confetti /> : null}

      {points > 0 ? (
        <p className="points-earned__points">
          <b>+{points.toLocaleString('en-US')}</b>
          <span>points</span>
        </p>
      ) : null}

      {badges.map((row) => (
        <div key={row.definition.id} className="points-earned__badge">
          <BadgeMedal badge={row.definition} earned size={64} decorative />
          <b>You&rsquo;re now {row.definition.name}</b>
          <small>{row.definition.requirement}</small>
          <span>Explore will lead with this. Change it any time.</span>
        </div>
      ))}
    </div>
  );
}
