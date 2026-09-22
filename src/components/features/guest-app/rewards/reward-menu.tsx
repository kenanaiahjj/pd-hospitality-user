'use client';

import { CaretRight } from '@phosphor-icons/react';

import { POINTS_FLOOR_BLOCK, POINTS_FLOOR_PESOS } from './points-model';
import type { Reward } from './points-model';

/*
  What points are for.

  Every row shows two prices: what the floor would charge, and what the thing
  actually costs in money. The gap between them is the entire reason the
  currency is points rather than pesos -- a room upgrade costs the property an
  empty night, not its rate, so it can be sold for less than money would buy
  it. Hiding that gap would leave points looking like a worse peso.
*/

const points = (value: number) => value.toLocaleString('en-US');

/** What a reward would cost if it were bought at the floor rate. */
const atFloor = (reward: Reward) =>
  `₱${((reward.points / POINTS_FLOOR_BLOCK) * POINTS_FLOOR_PESOS).toLocaleString('en-US')}`;

export type RewardMenuProps = {
  rewards: Reward[];
  balance: number;
  onOpenReward: (rewardId: string) => void;
};

export function RewardMenu({ rewards, balance, onOpenReward }: RewardMenuProps) {
  return (
    <section className="reward-menu">
      <h2 className="reward-menu__heading">Ways to redeem</h2>

      <ul className="reward-menu__rows">
        {rewards.map((reward) => {
          const short = reward.points - balance;

          return (
            <li key={reward.id}>
              <button
                type="button"
                /*
                  Disabled rather than hidden. A menu that shows only what is
                  affordable has nothing to aim at, and the shortfall is the
                  most motivating number on the row.
                */
                disabled={short > 0}
                onClick={() => onOpenReward(reward.id)}
              >
                <div>
                  <b>{reward.title}</b>
                  <small>
                    {atFloor(reward)} at the floor
                    {reward.cashPrice ? ` · worth ${reward.cashPrice}` : null}
                  </small>
                </div>
                <span className="reward-menu__cost">
                  <b>{points(reward.points)}</b>
                  {short > 0 ? <small>{points(short)} away</small> : null}
                </span>
                {short > 0 ? null : <CaretRight aria-hidden="true" />}
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export type RewardDetailProps = {
  reward: Reward;
  balance: number;
  onRedeem: () => void;
};

/*
  No back control of its own. The app bar already carries one on every screen,
  and a second one beside it is two answers to the same question.
*/
export function RewardDetail({ reward, balance, onRedeem }: RewardDetailProps) {
  const afterwards = balance - reward.points;
  const affordable = afterwards >= 0;

  return (
    <div className="guest-stack reward-detail">
      <div className="guest-page-title">
        <h1>{reward.title}</h1>
        <p>{reward.detail}</p>
      </div>

      <div className="reward-detail__cost">
        <b>{points(reward.points)}</b>
        <span>points</span>
        <small>
          {atFloor(reward)} at the floor
          {reward.cashPrice ? ` · worth ${reward.cashPrice}` : null}
        </small>
      </div>

      <p className="reward-detail__after">
        {affordable
          ? `You would have ${points(afterwards)} points left.`
          : `You are ${points(-afterwards)} points short.`}
      </p>

      {/*
        The guard is in `redeemReward` as well. A view that forgets to disable
        a button should not be able to drive a balance negative.
      */}
      <button
        type="button"
        className="guest-button guest-button--primary reward-detail__redeem"
        disabled={!affordable}
        onClick={onRedeem}
      >
        Redeem
      </button>

      <p className="reward-detail__note">
        Redeeming does not earn points. The front desk will have this ready for you.
      </p>
    </div>
  );
}
