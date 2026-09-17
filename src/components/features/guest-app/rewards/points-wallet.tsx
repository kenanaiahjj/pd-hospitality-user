'use client';

import { formatPesoAmount } from '../prototype-model';
import { BadgeMedal } from './badge-medal';
import type { BadgeProgress } from './badge-model';
import { pointsAsPesos } from './points-model';
import type { PointsEntry, Reward } from './points-model';

/*
  The balance, and what it is actually worth.

  Not a number on its own. A balance stated as a number is a score; stated as
  the massage it buys from the catalogue the guest is standing in, it is a
  reason to book something -- and naming the catalogue is the one thing an OTA
  cannot do, because it does not hold one.
*/

export type PointsWalletProps = {
  balance: number;
  /** Everything the balance covers, cheapest first. */
  affordable: Reward[];
  /** The cheapest thing it does not, if there is one left to aim at. */
  nextUp?: Reward;
  ledger: PointsEntry[];
  expiry: string;
  /** The badge nearest to earned, shown as the other thing in reach. */
  nearest?: BadgeProgress;
  onOpenReward: (rewardId: string) => void;
};

const points = (value: number) => value.toLocaleString('en-US');

export function PointsWallet({
  balance, affordable, nextUp, ledger, expiry, nearest, onOpenReward,
}: PointsWalletProps) {
  /* The best thing in reach, which is what the balance means today. */
  const best = affordable[affordable.length - 1];

  return (
    <section className="points-wallet">
      <p className="points-wallet__balance">
        <b>{points(balance)}</b>
        <span>points · {pointsAsPesos(balance)} off anything</span>
      </p>

      {best ? (
        <button
          className="points-wallet__buys"
          type="button"
          onClick={() => onOpenReward(best.id)}
        >
          <span>That is</span>
          <b>{best.title}</b>
          <small>
            {points(best.points)} points
            {balance > best.points ? ` · ${points(balance - best.points)} left over` : null}
          </small>
        </button>
      ) : (
        <p className="points-wallet__buys points-wallet__buys--empty">
          Book anything on property and this starts filling in.
        </p>
      )}

      {/* Something out of reach, or the balance has nothing left to pull toward. */}
      {nextUp ? (
        <button className="points-wallet__next" type="button" onClick={() => onOpenReward(nextUp.id)}>
          <b>{nextUp.title}</b>
          <small>{points(nextUp.points - balance)} points away</small>
        </button>
      ) : null}

      {nearest ? (
        <div className="points-wallet__nearest">
          <BadgeMedal badge={nearest.definition} earned={false} size={28} />
          <div>
            <b>{nearest.definition.name}</b>
            <small>{nearest.definition.requirement} · {nearest.count} of {nearest.definition.threshold}</small>
          </div>
        </div>
      ) : null}

      <h2 className="points-wallet__heading">How you earned it</h2>
      <ul className="points-wallet__ledger">
        {ledger.map((entry) => (
          <li key={entry.id}>
            <div>
              <b>{entry.title}</b>
              <small>{entry.detail}</small>
            </div>
            <span className={entry.points < 0 ? 'is-spent' : undefined}>
              {entry.points < 0 ? '' : '+'}{points(entry.points)}
            </span>
          </li>
        ))}
      </ul>

      <p className="points-wallet__expiry">
        Points last until {expiry}. Any new stay resets the clock.
      </p>
    </section>
  );
}

/** Kept here so the wallet and the reward list cannot disagree on the wording. */
export const rewardFloorValue = (reward: Reward) =>
  formatPesoAmount(Math.floor(reward.points / 1000) * 100);
