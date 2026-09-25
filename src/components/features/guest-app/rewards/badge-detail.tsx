'use client';

import { useState, type CSSProperties } from 'react';
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
            <span>The record</span>
            <h2 id="badge-detail-proof-title">{earned ? 'Why you earned it' : 'Your progress'}</h2>
          </div>
          <strong>
            {earned
              ? `${count} ${count === 1 ? 'experience' : 'experiences'}`
              : `${count} / ${definition.threshold}`}
          </strong>
        </div>

        {earned ? null : (
          <div className="guest-badge-detail__progress">
            <span>
              {remaining === 1
                ? 'One more experience and this is yours.'
                : `${remaining} more experiences and this is yours.`}
            </span>
            <span className="guest-badge-detail__track" aria-hidden="true">
              <i style={{ inlineSize: `${progress * 100}%` }} />
            </span>
          </div>
        )}

        <JourneyTimeline lines={evidence} threshold={definition.threshold} earned={earned} />
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

/** "Dinner for two · Azotea Rooftop" -> the experience, and where it was. */
function splitLine(line: string) {
  const at = line.indexOf(' · ');
  return at === -1 ? { title: line, place: '' } : { title: line.slice(0, at), place: line.slice(at + 3) };
}

/** Stops shown before "Show all": the unlock and a couple after it. */
const AFTER_UNLOCK = 2;

/*
  The evidence as a journey: numbered stops on one line, oldest first (the
  history is sorted by date, so the stop at the threshold is the one that
  earned the badge, and it is marked). A badge still ahead shows the stops it
  is waiting on as empty ones. A long record folds after the unlock rather
  than scrolling past the rest of the page.
*/
function JourneyTimeline({ lines, threshold, earned }: { lines: string[]; threshold: number; earned: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const unlockAt = earned ? threshold - 1 : -1;
  const fold = threshold + AFTER_UNLOCK;
  // Folding away a single stop saves nothing, so a record one over the fold shows whole.
  const visible = expanded || lines.length <= fold + 1 ? lines : lines.slice(0, fold);
  const ahead = earned ? 0 : Math.max(threshold - lines.length, 0);
  const number = (index: number) => String(index + 1).padStart(2, '0');

  if (!lines.length && !ahead) return null;

  return (
    <>
      <ol className="guest-journey">
        {visible.map((line, index) => {
          const { title, place } = splitLine(line);
          const unlock = index === unlockAt;
          return [
            <li
              key={`${line}-${index}`}
              className={`guest-journey__stop${unlock ? ' is-unlock' : ''}`}
              style={{ '--i': Math.min(index, 8) } as CSSProperties}
            >
              <span className="guest-journey__num" aria-hidden="true">{number(index)}</span>
              <span className="guest-journey__node" aria-hidden="true" />
              <span className="guest-journey__text">
                <b>{title}</b>
                {place ? <small>{place}</small> : null}
              </span>
              {unlock ? <span className="guest-journey__unlock">Unlocked here</span> : null}
            </li>,
            unlock && index < visible.length - 1 ? (
              <li key="since" className="guest-journey__since" role="presentation">Since then</li>
            ) : null,
          ];
        })}
        {Array.from({ length: ahead }, (_, offset) => (
          <li key={`ahead-${offset}`} className="guest-journey__stop is-ahead">
            <span className="guest-journey__num" aria-hidden="true">{number(lines.length + offset)}</span>
            <span className="guest-journey__node" aria-hidden="true" />
            <span className="guest-journey__text">
              <b>Still to come</b>
              {offset === ahead - 1 ? <small>This one unlocks it</small> : null}
            </span>
          </li>
        ))}
      </ol>
      {visible.length < lines.length || expanded ? (
        <button
          type="button"
          className="guest-journey__more"
          aria-expanded={expanded}
          onClick={() => setExpanded((open) => !open)}
        >
          {expanded ? 'Show less' : `Show all ${lines.length}`}
        </button>
      ) : null}
    </>
  );
}
