'use client';

import { CaretRight } from '@phosphor-icons/react';

import { BadgeMedal } from './badge-medal';
import { BADGE_FAMILIES } from './badge-model';
import type { BadgeFamily, BadgeProgress } from './badge-model';

/*
  Held badges and the ones within reach, presented differently because they do
  different jobs.

  Earned badges need no explanation -- you look at them, so they are a compact
  wrap of medals. A badge in progress needs its count, what would finish it,
  and somewhere to go, so it is a row. A single grid of forty-two would be
  neither.

  Pink appears only on the progress track of the nearest two. That is live
  state, which is one of the accent's three documented jobs; a wash of it
  across a shelf of earned medals would be decoration, which is the one thing
  DESIGN.md rules out.
*/

/** How many rows carry the accent. Beyond two it stops meaning "nearest". */
const ACCENTED = 2;

const FAMILY_ORDER: BadgeFamily[] = ['taste', 'company', 'rhythm', 'place', 'house', 'venue'];

export type BadgeShelfProps = {
  earned: BadgeProgress[];
  /** Started, and within one step. */
  nearly: BadgeProgress[];
  /** Everything, for the family sections underneath. */
  all: BadgeProgress[];
  /** Earned badges open their detail page; progress rows remain informational. */
  onOpenBadge?: (badgeId: string) => void;
};

export function BadgeShelf({ earned, nearly, all, onOpenBadge }: BadgeShelfProps) {
  const nearlyIds = new Set(nearly.map((row) => row.definition.id));

  return (
    <section className="badge-shelf">
      <h2 className="badge-shelf__heading">
        Badge collection
        <small>{earned.length} earned</small>
      </h2>

      {earned.length ? (
        <>
          <h3 className="badge-shelf__subheading">Earned</h3>
          <ul className="badge-shelf__held">
            {earned.map((row) => (
              <li key={row.definition.id}>
                {onOpenBadge ? (
                  <button
                    type="button"
                    aria-label={row.definition.name}
                    onClick={() => onOpenBadge(row.definition.id)}
                  >
                    <BadgeMedal badge={row.definition} earned decorative />
                    <span>{row.definition.name}</span>
                  </button>
                ) : (
                  <div>
                    <BadgeMedal badge={row.definition} earned decorative />
                    <span>{row.definition.name}</span>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p className="badge-shelf__empty">
          Nothing yet. Book anything and the first of these fills in.
        </p>
      )}

      {nearly.length ? (
        <>
          <h3 className="badge-shelf__subheading">In progress</h3>
          <ul className="badge-shelf__rows">
            {nearly.map((row, index) => (
              <BadgeRow
                key={row.definition.id}
                row={row}
                accented={index < ACCENTED}
              />
            ))}
          </ul>
        </>
      ) : null}

      {FAMILY_ORDER.map((family) => {
        /* Held and nearly-there rows are already above; a third appearance of
           the same badge is noise. */
        const rows = all.filter(
          (row) => row.definition.family === family && !row.earned && !nearlyIds.has(row.definition.id),
        );
        if (!rows.length) return null;

        return (
          <div key={family} className="badge-shelf__family">
            <h3 className="badge-shelf__subheading">{BADGE_FAMILIES[family].label}</h3>
            <ul className="badge-shelf__rows">
              {rows.map((row) => (
                <BadgeRow key={row.definition.id} row={row} accented={false} />
              ))}
            </ul>
          </div>
        );
      })}
    </section>
  );
}

function BadgeRow({
  row, accented, onOpen,
}: { row: BadgeProgress; accented: boolean; onOpen?: (id: string) => void }) {
  const { definition, count, earned } = row;
  const fraction = Math.min(count / definition.threshold, 1);
  const Row = onOpen ? 'button' : 'div';
  const label = `${definition.name} — ${definition.requirement}, ${count} of ${definition.threshold}`;

  return (
    <li data-testid="badge-progress-row">
      <Row
        {...(onOpen
          ? {
              type: 'button' as const,
              /* One announcement carrying name, requirement and progress --
                 the medal, the label and the count would otherwise be three. */
              'aria-label': label,
              onClick: () => onOpen(definition.id),
            }
          : { role: 'group' as const, 'aria-label': label })}
      >
        <BadgeMedal badge={definition} earned={earned} decorative />
        <div>
          <b>{definition.name}</b>
          <small>{definition.requirement}</small>
          <span
            className={`badge-shelf__track${accented ? ' is-near' : ''}`}
            /* Decorative: the count beside it already says this in words. */
            aria-hidden="true"
          >
            <i style={{ inlineSize: `${fraction * 100}%` }} />
          </span>
        </div>
        <span className="badge-shelf__count">{count} of {definition.threshold}</span>
        {onOpen ? <CaretRight aria-hidden="true" /> : null}
      </Row>
    </li>
  );
}
