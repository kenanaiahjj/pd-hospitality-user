'use client';

import { Minus, Plus } from '@phosphor-icons/react';

import { formatPesoAmount, parsePesoAmount } from '../prototype-model';
import { POINTS_FLOOR_BLOCK, POINTS_FLOOR_PESOS, pointsAsPesos } from './points-model';

/*
  Points against the thing being booked, at the moment of booking.

  Deliberately not netted off quietly at checkout. The point of a balance is
  that it changes a decision, and a decision is made here -- a discount the
  guest discovers on a folio three days later never influenced anything.
*/

const points = (value: number) => value.toLocaleString('en-US');

/** What a number of points takes off a bill, at the floor rate. */
export const pesosOff = (applied: number) =>
  (applied / POINTS_FLOOR_BLOCK) * POINTS_FLOOR_PESOS;

/**
 * The most that can go on this booking.
 *
 * Capped by the booking as well as the balance: points cannot pay more than
 * the thing costs, and the floor spends in whole blocks, so a ₱2,400 treatment
 * takes 24 of them and no more.
 */
export const maxApplicable = (balance: number, amount: string) => Math.min(
  Math.floor(balance / POINTS_FLOOR_BLOCK) * POINTS_FLOOR_BLOCK,
  Math.floor(parsePesoAmount(amount) / POINTS_FLOOR_PESOS) * POINTS_FLOOR_BLOCK,
);

export type PointsApplyProps = {
  balance: number;
  /** What the booking costs, as the catalogue states it. */
  amount: string;
  applied: number;
  onChange: (applied: number) => void;
};

export function PointsApply({ balance, amount, applied, onChange }: PointsApplyProps) {
  const ceiling = maxApplicable(balance, amount);
  const remaining = parsePesoAmount(amount) - pesosOff(applied);

  if (ceiling < POINTS_FLOOR_BLOCK) return null;

  return (
    <div className="points-apply">
      <div className="points-apply__head">
        <b>Use points</b>
        {/* Floored, like everywhere else: 22,220 points spends ₱2,200, and
            ₱2,222 would promise ₱22 that cannot come off anything. */}
        <small>{points(balance)} points · {pointsAsPesos(balance)} available</small>
      </div>

      {applied === 0 ? (
        <button type="button" className="points-apply__start" onClick={() => onChange(POINTS_FLOOR_BLOCK)}>
          Use points
        </button>
      ) : (
        <>
          <div className="points-apply__stepper">
            <button
              type="button"
              aria-label="Remove 1,000 points"
              disabled={applied <= 0}
              onClick={() => onChange(applied - POINTS_FLOOR_BLOCK)}
            >
              <Minus aria-hidden="true" />
            </button>
            <span>
              <b>{points(applied)}</b>
              <small>points</small>
            </span>
            <button
              type="button"
              aria-label="Add 1,000 points"
              disabled={applied >= ceiling}
              onClick={() => onChange(Math.min(applied + POINTS_FLOOR_BLOCK, ceiling))}
            >
              <Plus aria-hidden="true" />
            </button>
          </div>

          <p className="points-apply__effect">
            <span>−{formatPesoAmount(pesosOff(applied))}</span>
            <b>{formatPesoAmount(remaining)}</b>
          </p>
        </>
      )}
    </div>
  );
}
