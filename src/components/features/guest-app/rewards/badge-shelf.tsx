'use client';

import { BadgeMedal } from './badge-medal';
import { badgeRarity, formatRarity, rarestBadge } from './badge-model';
import type { BadgeProgress } from './badge-model';

/*
  The whole collection, in one grid.

  Every badge sits in the same tile, earned or not, so the set reads as one
  collection with gaps in it rather than a trophy case and a to-do list. What
  changes is the status line under the name: a pill when it is held, a track
  when it has started, a quieter pill when it has not. Locked medals keep their
  own outline, pressed blank, so a gap still says what belongs in it.

  The rarest held badge leads, large. It is the one worth showing someone.

  Pink appears only on the progress track of the nearest two. That is live
  state, one of the accent's three documented jobs; a wash of it across the
  grid would be decoration, which is the one thing DESIGN.md rules out.
*/

/** How many tracks carry the accent. Beyond two it stops meaning "nearest". */
const ACCENTED = 2;

export type BadgeShelfProps = {
  earned: BadgeProgress[];
  /** Started, and within one step -- nearest first. */
  nearly: BadgeProgress[];
  /** Everything, earned or not. */
  all: BadgeProgress[];
  onOpenBadge?: (badgeId: string) => void;
};

/** Held first, then started (closest first), then untouched; stable within each. */
const standing = (row: BadgeProgress): number => {
  if (row.earned) return 0;
  if (row.count > 0) return 1 + (row.definition.threshold - row.count) / 1000;
  return 2;
};

export function BadgeShelf({ earned, nearly, all, onOpenBadge }: BadgeShelfProps) {
  const accented = new Set(nearly.slice(0, ACCENTED).map((row) => row.definition.id));
  const hero = rarestBadge(earned);
  const ordered = [...all]
    .filter((row) => row.definition.id !== hero?.definition.id)
    .sort((a, b) => standing(a) - standing(b));

  return (
    <section className="badge-shelf">
      <h2 className="badge-shelf__heading" aria-label="Your badges">
        Your badges
        <small aria-hidden="true">{all.length}</small>
      </h2>

      {hero ? (
        <HeroTile row={hero} onOpen={onOpenBadge} />
      ) : null}

      <ul className="badge-shelf__grid">
        {ordered.map((row, index) => (
          <BadgeTile
            key={row.definition.id}
            row={row}
            index={index}
            accented={accented.has(row.definition.id)}
            onOpen={onOpenBadge}
          />
        ))}
      </ul>
    </section>
  );
}

function HeroTile({ row, onOpen }: { row: BadgeProgress; onOpen?: (id: string) => void }) {
  const { definition } = row;
  const Tag = onOpen ? 'button' : 'div';

  return (
    <Tag
      className="badge-shelf__hero"
      {...(onOpen
        ? {
            type: 'button' as const,
            'aria-label': `${definition.name}, your rarest badge`,
            onClick: () => onOpen(definition.id),
          }
        : {})}
    >
      <BadgeMedal badge={definition} earned size={64} shimmer decorative />
      <span className="badge-shelf__hero-copy">
        <b>{definition.name}</b>
        <small>Earned by {formatRarity(badgeRarity(definition))} of guests</small>
      </span>
      <span className="badge-pill badge-pill--held">Unlocked</span>
    </Tag>
  );
}

function BadgeTile({
  row, index, accented, onOpen,
}: { row: BadgeProgress; index: number; accented: boolean; onOpen?: (id: string) => void }) {
  const { definition, count, earned } = row;
  const fraction = Math.min(count / definition.threshold, 1);
  const Tag = onOpen ? 'button' : 'div';
  /* One announcement: name, and for anything not held, what it takes and how
     far along. The medal, label and status would otherwise be three. */
  const label = earned
    ? definition.name
    : `${definition.name} — ${definition.requirement}, ${count} of ${definition.threshold}`;

  return (
    <li
      data-testid="badge-tile"
      data-state={earned ? 'earned' : count ? 'started' : 'locked'}
      /* Staggered so the grid glints one medal at a time, not in unison. */
      style={{ '--shimmer-delay': `${(index * 0.73) % 5.2}s` } as React.CSSProperties}
    >
      <Tag
        {...(onOpen
          ? { type: 'button' as const, 'aria-label': label, onClick: () => onOpen(definition.id) }
          : { role: 'group' as const, 'aria-label': label })}
      >
        <BadgeMedal badge={definition} earned={earned} size={48} shimmer={earned} decorative />
        <span className="badge-shelf__copy">
          <b>{definition.name}</b>
          <small>{definition.requirement}</small>
        </span>
        {earned ? (
          <span className="badge-pill badge-pill--held">Unlocked</span>
        ) : count ? (
          <span className="badge-shelf__progress">
            <span className={`badge-shelf__track${accented ? ' is-near' : ''}`} aria-hidden="true">
              <i style={{ inlineSize: `${fraction * 100}%` }} />
            </span>
            <small>{count} / {definition.threshold}</small>
          </span>
        ) : (
          <span className="badge-pill">Locked</span>
        )}
      </Tag>
    </li>
  );
}
