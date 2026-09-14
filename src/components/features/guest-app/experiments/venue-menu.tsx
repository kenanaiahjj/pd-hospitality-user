'use client';

import { ArrowLeft, ArrowRight, CaretRight, Clock, MapPin, Minus, Plus, Receipt } from '@phosphor-icons/react';
import Image from 'next/image';
import { useState } from 'react';
import { Button } from '@/components/ui';
import { filterMenu, getVenueCartSummary } from '../prototype-model';
import type { MenuItemCategory, RestaurantVenue } from '../prototype-model';
import { storyImage } from './story-imagery';

/*
  The app's restaurant screen, reached from the experiment's flow.

  It keeps the shipping screen's CSS classes -- `guest-restaurant-menu`,
  `guest-menu-tabs`, `guest-menu-item-card`, `guest-mini-cart` -- and its model
  helpers, so the structure a guest walks through is the app's. What the
  experiment changes is the skin, scoped under `.venue-menu` so nothing here
  reaches the shipping screen: the photograph bleeds and carries the venue's
  name, and the dishes share one surface instead of each wearing a card.

  The markup is restated rather than imported because the app's version is
  inline in a 4,700-line switch and depends on components defined in that same
  file. Extracting it properly is a refactor of shipping code and belongs in
  its own task, not inside an experiment. On promotion this file is deleted,
  the flow points at the real screen, and the `.venue-menu` block is the diff
  to apply to it.
*/

const TABS: MenuItemCategory[] = ['all', 'starters', 'mains', 'desserts', 'drinks'];

export type VenueMenuProps = {
  venue: RestaurantVenue;
  roomLabel: string;
  onBack: () => void;
  /** In the app, the front-desk chat with the reservation seeded. */
  onReserve: (venueId: string) => void;
};

export function VenueMenu({ venue, roomLabel, onBack, onReserve }: VenueMenuProps) {
  const [tab, setTab] = useState<MenuItemCategory>('all');
  const [cart, setCart] = useState<Record<string, number>>({});

  const dishes = filterMenu(venue.menu, { category: tab, dietary: [], sort: 'recommended' });
  const summary = getVenueCartSummary(venue.menu, cart);

  /* Same shape as the app's `changeVenueCartItem`: the key stays at zero
     rather than being deleted, so the summary helper sees what it sees
     there. */
  const change = (itemId: string, delta: number) => {
    setCart((current) => ({ ...current, [itemId]: Math.max(0, (current[itemId] ?? 0) + delta) }));
  };

  const art = storyImage(venue.id);

  return (
    <div className="guest-stack guest-restaurant-menu venue-menu" data-testid="venue-menu">
      {/*
        Full bleed, and the venue's name sits on the photograph rather than in
        a card beneath it. A hotel restaurant is sold on the room it is in; a
        title card under a cropped picture makes the picture a thumbnail.
      */}
      <header className="venue-menu__art">
        <Image src={art.src} alt="" fill sizes="480px" style={{ objectPosition: art.focalPoint }} priority />
        <span className="venue-menu__scrim" aria-hidden="true" />
        <button className="venue-menu__back" type="button" onClick={onBack} aria-label="Back">
          <ArrowLeft aria-hidden="true" />
        </button>
        <div className="venue-menu__title">
          <h1>{venue.name}</h1>
          <p className="venue-menu__meta">
            <span>{venue.operator}</span>
            <i aria-hidden="true" />
            <span><Clock aria-hidden="true" /> {venue.hours}</span>
          </p>
        </div>
      </header>

      <div className="guest-restaurant-hero">
        <p className="venue-menu__blurb">{venue.description}</p>
        <dl className="venue-menu__facts">
          <div>
            <dt><MapPin aria-hidden="true" /> Where</dt>
            <dd>{venue.location}</dd>
          </div>
          <div>
            <dt><Receipt aria-hidden="true" /> Billing</dt>
            <dd>Charged to {roomLabel.toLowerCase()}</dd>
          </div>
        </dl>
      </div>

      {/* Sticky: on a long menu the categories are the only way back out of
          the middle of it. */}
      <div className="guest-menu-tabs" role="tablist" aria-label="Menu categories">
        {TABS.map((entry) => (
          <button
            key={entry}
            role="tab"
            aria-selected={tab === entry}
            className={`guest-menu-tab ${tab === entry ? 'is-active' : ''}`}
            onClick={() => setTab(entry)}
            type="button"
          >
            {entry === 'all' ? 'All Items' : entry.charAt(0).toUpperCase() + entry.slice(1)}
          </button>
        ))}
      </div>

      <div className="guest-menu-grid">
        {dishes.map((item) => (
          <div key={item.id} className="guest-menu-item-card">
            <div className="guest-menu-item-card__header">
              <h4>{item.name}</h4>
              {/* Neutral, not green: "Popular" is merchandising, and green in
                  this system means status. */}
              {item.tag ? <span className="guest-tag venue-menu__marker">{item.tag}</span> : null}
            </div>
            <p>{item.description}</p>
            <div className="guest-menu-item-card__actions">
              <span className="guest-menu-item-card__price">{item.price}</span>
              {cart[item.id] ? (
                <div className="guest-menu-quantity" aria-label={`${item.name} quantity`}>
                  <button type="button" aria-label={`Decrease ${item.name} quantity`} onClick={() => change(item.id, -1)}><Minus aria-hidden="true" /></button>
                  <output aria-live="polite">{cart[item.id]}</output>
                  <button type="button" aria-label={`Increase ${item.name} quantity`} onClick={() => change(item.id, 1)}><Plus aria-hidden="true" /></button>
                </div>
              ) : (
                <button className="venue-menu__add" type="button" aria-label={`Add ${item.name}`} onClick={() => change(item.id, 1)}>
                  <Plus aria-hidden="true" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="venue-menu__dock">
        <Button className="guest-button guest-button--primary" type="button" onClick={() => onReserve(venue.id)}>
          Reserve a table via Front Desk<ArrowRight aria-hidden="true" />
        </Button>
      </div>

      {summary.itemCount > 0 ? (
        <button
          className="guest-mini-cart"
          type="button"
          aria-label={`View ${venue.name} cart · ${summary.itemCount} ${summary.itemCount === 1 ? 'item' : 'items'} · ${summary.formattedTotal}`}
        >
          <span><small>{venue.name} cart</small><b>{summary.itemCount} {summary.itemCount === 1 ? 'item' : 'items'}</b></span>
          <strong>{summary.formattedTotal}</strong>
          <CaretRight aria-hidden="true" />
        </button>
      ) : null}
    </div>
  );
}
