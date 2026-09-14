'use client';

import { ArrowLeft, ArrowRight, CaretRight, MapPin, Minus, Plus } from '@phosphor-icons/react';
import Image from 'next/image';
import { useState } from 'react';
import { Button } from '@/components/ui';
import { filterMenu, getVenueCartSummary } from '../prototype-model';
import type { MenuItemCategory, RestaurantVenue } from '../prototype-model';
import { storyImage } from './story-imagery';

/*
  The app's restaurant screen, reached from the experiment's flow.

  It deliberately reuses the shipping screen's CSS classes --
  `guest-restaurant-menu`, `guest-menu-tabs`, `guest-menu-item-card`,
  `guest-mini-cart` -- and its model helpers, so what a guest walks through
  here is what the app already renders rather than a lookalike that can drift.

  The markup is restated rather than imported because the app's version is
  inline in a 4,700-line switch and depends on components defined in that same
  file. Extracting it properly is a refactor of shipping code and belongs in
  its own task, not inside an experiment. On promotion this file is deleted
  and the flow points at the real screen.
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
    <div className="guest-stack guest-restaurant-menu" data-testid="venue-menu">
      <div className="venue-menu__art">
        <Image src={art.src} alt="" fill sizes="480px" style={{ objectPosition: art.focalPoint }} priority />
        <button className="listing__back venue-menu__back" type="button" onClick={onBack} aria-label="Back">
          <ArrowLeft aria-hidden="true" />
        </button>
      </div>

      <div className="guest-restaurant-hero">
        <div className="guest-tag-row">
          <span className="guest-tag">{venue.operator}</span>
          <span className="guest-tag">{venue.hours}</span>
        </div>
        <h1>{venue.name}</h1>
        <p>{venue.description}</p>
        <div className="guest-restaurant-hero__meta">
          <span><MapPin size={16} /> {venue.location}</span>
          <span>·</span>
          <span>Billed to {roomLabel.toLowerCase()}</span>
        </div>
      </div>

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
              <div>
                {item.tag ? <span className="guest-tag guest-tag--positive">{item.tag}</span> : null}
                <h4>{item.name}</h4>
              </div>
              <span className="guest-menu-item-card__price">{item.price}</span>
            </div>
            <p>{item.description}</p>
            <div className="guest-menu-item-card__actions">
              <small>{cart[item.id] ? `${cart[item.id]} in this cart` : 'Add to venue cart'}</small>
              {cart[item.id] ? (
                <div className="guest-menu-quantity" aria-label={`${item.name} quantity`}>
                  <button type="button" aria-label={`Decrease ${item.name} quantity`} onClick={() => change(item.id, -1)}><Minus aria-hidden="true" /></button>
                  <output aria-live="polite">{cart[item.id]}</output>
                  <button type="button" aria-label={`Increase ${item.name} quantity`} onClick={() => change(item.id, 1)}><Plus aria-hidden="true" /></button>
                </div>
              ) : (
                <Button className="guest-button guest-button--secondary guest-menu-add" type="button" aria-label={`Add ${item.name}`} onClick={() => change(item.id, 1)}>Add</Button>
              )}
            </div>
          </div>
        ))}
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

      <Button className="guest-button guest-button--primary" type="button" onClick={() => onReserve(venue.id)}>
        Reserve a table via Front Desk<ArrowRight aria-hidden="true" />
      </Button>
    </div>
  );
}
