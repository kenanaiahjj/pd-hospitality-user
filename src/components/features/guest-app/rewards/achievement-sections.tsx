'use client';

import { ArrowLeft, ArrowRight } from '@phosphor-icons/react';
import { useState, type ReactNode } from 'react';
import { GuestTabs } from '../guest-tabs';
import { PointsActivity, PointsWallet } from './points-wallet';
import type { PointsEntry, Reward } from './points-model';
import { RewardMenu } from './reward-menu';

const ACHIEVEMENT_TABS = [
  { id: 'achievements', label: 'Achievements' },
  { id: 'points', label: 'Points' },
  { id: 'activity', label: 'Recent activity' },
] as const;

type AchievementTabId = (typeof ACHIEVEMENT_TABS)[number]['id'];

export type AchievementSectionsProps = {
  children: ReactNode;
  balance: number;
  affordable: Reward[];
  nextUp?: Reward;
  ledger: PointsEntry[];
  expiry: string;
  rewards: Reward[];
  onOpenReward: (rewardId: string) => void;
};

export function AchievementSections({
  children,
  balance,
  affordable,
  nextUp,
  ledger,
  expiry,
  rewards,
  onOpenReward,
}: AchievementSectionsProps) {
  const [selectedTab, setSelectedTab] = useState<AchievementTabId>('achievements');
  const [showRedeemables, setShowRedeemables] = useState(false);
  const activeTab = ACHIEVEMENT_TABS.find((tab) => tab.id === selectedTab) ?? ACHIEVEMENT_TABS[0];

  return (
    <section className="guest-achievement-sections" aria-label="Achievement details">
      <GuestTabs
        idPrefix="guest-achievements"
        label="Achievement sections"
        options={ACHIEVEMENT_TABS.map(({ id, label }) => ({ value: id, label }))}
        value={selectedTab}
        onValueChange={(value) => {
          const nextTab = ACHIEVEMENT_TABS.find((tab) => tab.id === value);
          if (nextTab) {
            setSelectedTab(nextTab.id);
            setShowRedeemables(false);
          }
        }}
        className="guest-tabs--underline"
      />

      <div
        className="guest-achievements-panel"
        id={`guest-achievements-panel-${activeTab.id}`}
        role="tabpanel"
        aria-labelledby={`guest-achievements-tab-${activeTab.id}`}
        tabIndex={0}
      >
        {selectedTab === 'achievements' ? children : null}

        {selectedTab === 'points' ? (
          <section className={`guest-achievements-points${showRedeemables ? ' guest-achievements-points--redeem' : ''}`}>
            <div className="guest-achievements-section-title">
              {showRedeemables ? null : <h2 id="guest-achievements-points-heading">Your balance</h2>}
              <button
                type="button"
                className={showRedeemables ? 'guest-achievements-redeem__back' : 'guest-achievements-redeem-cta'}
                onClick={() => setShowRedeemables((visible) => !visible)}
              >
                {showRedeemables ? <ArrowLeft aria-hidden="true" /> : null}
                {showRedeemables ? 'Back to points' : 'Redeem points'}
                {showRedeemables ? null : <ArrowRight aria-hidden="true" />}
              </button>
            </div>

            {showRedeemables ? (
              <RewardMenu rewards={rewards} balance={balance} onOpenReward={onOpenReward} />
            ) : (
              <PointsWallet
                balance={balance}
                affordable={affordable}
                nextUp={nextUp}
                ledger={ledger}
                expiry={expiry}
                showActivity={false}
                onOpenReward={onOpenReward}
              />
            )}
          </section>
        ) : null}

        {selectedTab === 'activity' ? (
          <section className="guest-achievements-points guest-achievements-points--activity" aria-labelledby="guest-achievements-activity-heading">
            <div className="guest-achievements-section-title">
              <h2 id="guest-achievements-activity-heading">Recent activity</h2>
            </div>
            <div className="points-wallet">
              <PointsActivity ledger={ledger} expiry={expiry} showHeading={false} />
            </div>
          </section>
        ) : null}

      </div>
    </section>
  );
}
