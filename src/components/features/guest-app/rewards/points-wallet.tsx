'use client';

import { CaretRight } from '@phosphor-icons/react';
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
  /** Keep the ledger in the wallet on screens that do not split it into a tab. */
  showActivity?: boolean;
  /**
   * Absent until the reward detail screen exists. A control that navigates
   * nowhere is worse than a line of text, so without this the block is text.
   */
  onOpenReward?: (rewardId: string) => void;
};

const points = (value: number) => value.toLocaleString('en-US');

/**
 * A button when there is somewhere to go, a plain block when there is not.
 *
 * Rendering a `<button>` that does nothing announces an action to a screen
 * reader that the screen cannot perform.
 */
function Pressable({
  className, onPress, children,
}: { className: string; onPress?: () => void; children: React.ReactNode }) {
  if (!onPress) return <div className={className}>{children}</div>;
  return <button className={className} type="button" onClick={onPress}>{children}</button>;
}

export function PointsWallet({
  balance, affordable, nextUp, ledger, expiry, nearest, showActivity = true, onOpenReward,
}: PointsWalletProps) {
  /* The best thing in reach, which is what the balance means today. */
  const best = affordable[affordable.length - 1];

  return (
    <section className="points-wallet">
      <p className="points-wallet__balance">
        <b>{points(balance)}</b>
        <span>points · {pointsAsPesos(balance)} off anything</span>
      </p>

      <section className="points-wallet__reach" aria-labelledby="points-wallet-reach-heading">
        <h3 className="points-wallet__heading" id="points-wallet-reach-heading">Rewards within reach</h3>
        <div className="points-wallet__opportunities">
          {best ? (
            <Pressable
              className="points-wallet__buys"
              onPress={onOpenReward ? () => onOpenReward(best.id) : undefined}
            >
              <span className="points-wallet__opportunity-copy">
                <b>{best.title}</b>
                <small>{best.detail}</small>
              </span>
              <span className="points-wallet__opportunity-cost">
                <b>{points(best.points)} points</b>
                <small>{balance > best.points ? `${points(balance - best.points)} points left over` : 'Ready to redeem'}</small>
              </span>
              {onOpenReward ? <CaretRight aria-hidden="true" /> : null}
            </Pressable>
          ) : (
            <p className="points-wallet__buys points-wallet__buys--empty">
              Book anything on property and this starts filling in.
            </p>
          )}

          {/* The next reward keeps a useful target in view without competing with the balance. */}
          {nextUp ? (
            <Pressable
              className="points-wallet__next"
              onPress={onOpenReward ? () => onOpenReward(nextUp.id) : undefined}
            >
              <span className="points-wallet__opportunity-copy">
                <b>{nextUp.title}</b>
                <small>{nextUp.detail}</small>
              </span>
              <span className="points-wallet__opportunity-cost">
                <b>{points(nextUp.points - balance)}</b>
                <small>points away</small>
              </span>
              {onOpenReward ? <CaretRight aria-hidden="true" /> : null}
            </Pressable>
          ) : null}
        </div>
      </section>

      {nearest ? (
        <div className="points-wallet__nearest">
          <BadgeMedal badge={nearest.definition} earned={false} size={28} />
          <div>
            <b>{nearest.definition.name}</b>
            <small>{nearest.definition.requirement} · {nearest.count} of {nearest.definition.threshold}</small>
          </div>
        </div>
      ) : null}

      {showActivity ? <PointsActivity ledger={ledger} expiry={expiry} /> : null}
    </section>
  );
}

export function PointsActivity({
  ledger,
  expiry,
  showHeading = true,
}: Pick<PointsWalletProps, 'ledger' | 'expiry'> & { showHeading?: boolean }) {
  if (ledger.length === 0) {
    return (
      <>
        {showHeading ? <h2 className="points-wallet__heading">Recent activity</h2> : null}
        <p className="points-wallet__empty">Points you earn will appear here.</p>
      </>
    );
  }

  return (
    <>
      {showHeading ? <h2 className="points-wallet__heading">Recent activity</h2> : null}
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
    </>
  );
}

/** Kept here so the wallet and the reward list cannot disagree on the wording. */
export const rewardFloorValue = (reward: Reward) =>
  formatPesoAmount(Math.floor(reward.points / 1000) * 100);
