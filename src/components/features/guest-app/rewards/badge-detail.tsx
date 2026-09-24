'use client';

import { BadgeCoin, formatEarnedOn } from './badge-coin';
import { BadgeMedal } from './badge-medal';
import { BADGE_FAMILIES, badgeRarity, badgeSerial, formatRarity } from './badge-model';
import type { BadgeProgress } from './badge-model';

/*
  One badge, and the case for it.

  A badge derived from spend is a profile, and a profile that appears
  unannounced reads as surveillance however flattering it is. So this leads
  with the bookings behind the inference and offers the guest a way to say no
  -- which makes it something they can argue with rather than a verdict handed
  down.

  The correction has to be real. Muting removes the badge from derivation
  entirely rather than hiding it in a view, so it stays gone across a reload
  and cannot quietly keep counting.

  An earned badge is a coin with the holder engraved on its back; one still
  ahead is its pressed-blank silhouette, so the page shows what is coming
  without pretending it has arrived.
*/

export type BadgeDetailProps = {
  row: BadgeProgress;
  /** Engraved on the back of an earned coin. */
  holder: string;
  onMute: (badgeId: string) => void;
};

export function BadgeDetail({ row, holder, onMute }: BadgeDetailProps) {
  const { definition, count, earned, evidence, earnedOn } = row;
  const progress = Math.min(count / definition.threshold, 1);
  const remaining = Math.max(definition.threshold - count, 0);
  const rarity = formatRarity(badgeRarity(definition));
  const serial = badgeSerial(definition, holder || 'guest');

  return (
    <div className="guest-stack guest-badge-detail" data-testid="badge-detail">
      <header className="guest-badge-detail__header">
        <span aria-hidden="true" />
        <div>
          <span>Achievement</span>
          <strong>{earned ? 'Earned' : 'In progress'}</strong>
        </div>
        <span aria-hidden="true" />
      </header>

      <section className="guest-badge-detail__hero" aria-labelledby="badge-detail-title">
        {earned ? (
          <>
            <BadgeCoin badge={definition} holder={holder || 'Cabana guest'} earnedOn={earnedOn} serial={serial} />
            <span className="guest-badge-detail__hint" aria-hidden="true">Drag or tap to turn it over</span>
          </>
        ) : (
          <div className="guest-badge-detail__medal">
            <BadgeMedal badge={definition} earned={false} size={144} decorative />
          </div>
        )}
        <span className="guest-badge-detail__eyebrow">
          {earned ? 'Achievement unlocked' : 'Keep exploring'}
        </span>
        <h1 id="badge-detail-title">{definition.name}</h1>
        <p>{definition.requirement}</p>
      </section>

      <dl className="guest-badge-detail__facts">
        <div>
          <dt>Rarity</dt>
          <dd>Earned by {rarity} of guests</dd>
        </div>
        <div>
          <dt>{earned ? 'Date earned' : 'Progress'}</dt>
          <dd>
            {earned
              ? (earnedOn ? formatEarnedOn(earnedOn) : 'Earned')
              : `${count} of ${definition.threshold}`}
          </dd>
        </div>
        <div>
          <dt>Category</dt>
          <dd>{BADGE_FAMILIES[definition.family].label}</dd>
        </div>
        <div>
          <dt>{earned ? 'Your number' : 'Status'}</dt>
          <dd>{earned ? serial : count ? 'In progress' : 'Locked'}</dd>
        </div>
      </dl>

      <section className="guest-badge-detail__proof" aria-labelledby="badge-detail-proof-title">
        <div className="guest-badge-detail__section-head">
          <div>
            <span>Journey marker</span>
            <h2 id="badge-detail-proof-title">{earned ? 'Why you earned it' : 'Your progress'}</h2>
          </div>
          <strong>{earned ? 'Complete' : `${count} / ${definition.threshold}`}</strong>
        </div>

        {earned ? (
          <ul className="guest-badge-detail__evidence">
            {evidence.map((line, index) => (
              <li key={`${line}-${index}`}>{line}</li>
            ))}
          </ul>
        ) : (
          <div className="guest-badge-detail__progress">
            <div>
              <b>{count} of {definition.threshold}</b>
              <span>
                {remaining === 1
                  ? 'One more experience and this is yours.'
                  : `${remaining} more experiences and this is yours.`}
              </span>
            </div>
            <span className="guest-badge-detail__track" aria-hidden="true">
              <i style={{ inlineSize: `${progress * 100}%` }} />
            </span>
            {evidence.length ? (
              <ul className="guest-badge-detail__evidence">
                {evidence.map((line, index) => (
                  <li key={`${line}-${index}`}>{line}</li>
                ))}
              </ul>
            ) : null}
          </div>
        )}
      </section>

      {/* Nothing to deny until something has been inferred. */}
      {count > 0 ? (
        <button
          type="button"
          className="guest-badge-detail__mute"
          onClick={() => onMute(definition.id)}
        >
          Not right? Turn this off
        </button>
      ) : null}
    </div>
  );
}
