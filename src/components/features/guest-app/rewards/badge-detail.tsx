'use client';

import { BadgeMedal } from './badge-medal';
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

  (Carried from `badge-sheet.tsx`, a modal that did this job before the premium
  pass gave it a screen of its own. The reasoning outlived the dialog.)
*/

export type BadgeDetailProps = {
  row: BadgeProgress;
  onMute: (badgeId: string) => void;
};

export function BadgeDetail({ row, onMute }: BadgeDetailProps) {
  const { definition, count, earned, evidence } = row;
  const progress = Math.min(count / definition.threshold, 1);
  const remaining = Math.max(definition.threshold - count, 0);

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
        <div className={`guest-badge-detail__medal${earned ? ' is-earned' : ''}`}>
          <BadgeMedal badge={definition} earned={earned} size={144} shimmer={earned} decorative />
        </div>
        <span className="guest-badge-detail__eyebrow">
          {earned ? 'Achievement unlocked' : 'Keep exploring'}
        </span>
        <h1 id="badge-detail-title">{definition.name}</h1>
        <p>{definition.requirement}</p>
      </section>

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

      <button
        type="button"
        className="guest-badge-detail__mute"
        onClick={() => onMute(definition.id)}
      >
        Not right? Turn this off
      </button>
    </div>
  );
}
