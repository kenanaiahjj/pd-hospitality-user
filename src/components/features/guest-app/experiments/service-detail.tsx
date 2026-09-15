'use client';

import { ArrowLeft, CalendarX, MapPin, Storefront } from '@phosphor-icons/react';
import Image from 'next/image';
import { Button } from '@/components/ui';
import type { SearchableItem } from './story-model';
import { describeCancellation } from './story-model';

/*
  The full screen behind a card.

  Promotable: the app already has a service detail, and this is the same
  contract -- an item and a `onBook` that runs through `openServiceBooking`,
  so the room-scan gate still decides whether a booking may proceed. A card
  is a way in to that screen, never a way around it.
*/

export type ServiceDetailProps = {
  item: SearchableItem;
  onBack: () => void;
  onBook: (itemId: string) => void;
};

export function ServiceDetail({ item, onBack, onBook }: ServiceDetailProps) {
  return (
    <div className="detail" data-testid="service-detail">
      <div className="detail__art">
        <Image
          src={item.image.src}
          alt=""
          fill
          sizes="480px"
          style={{ objectPosition: item.image.focalPoint }}
          priority
        />
        <span className="detail__art-scrim" aria-hidden="true" />
        <button className="detail__back" type="button" onClick={onBack} aria-label="Back">
          <ArrowLeft aria-hidden="true" />
        </button>
      </div>

      <div className="detail__body">
        {/*
          No category eyebrow. "SPA & MASSAGE" set over "Hilom signature
          massage" is a second heading the eye reads and discards, which is
          the rule DESIGN.md already states -- an eyebrow earns its place by
          carrying what the title cannot. It sits under the title instead,
          where it orients without competing.
        */}
        <div className="detail__title">
          <h1>{item.title}</h1>
          <p>{item.category}</p>
        </div>

        {/*
          Three facts about this service, rather than three about nothing.

          These were the literals "On property", "3 times open" and "Up to 24
          hours before" -- identical on a massage, an island tour and a
          scooter hire. A screen that says the same thing about everything is
          worse than a screen that says less, because the guest cannot tell
          which parts to believe. Availability is gone entirely: there is no
          availability data, and "Choose a time" is where it belongs anyway.
        */}
        <dl className="detail__facts">
          <div>
            <dt><MapPin aria-hidden="true" />Where</dt>
            <dd>{item.where}</dd>
          </div>
          <div>
            <dt><Storefront aria-hidden="true" />Run by</dt>
            <dd>
              {item.runBy.name}
              <i>{item.runBy.kind === 'property' ? 'The hotel' : 'Hosted partner'}</i>
            </dd>
          </div>
          <div>
            <dt><CalendarX aria-hidden="true" />Cancellation</dt>
            <dd>{describeCancellation(item.cutoff)}</dd>
          </div>
        </dl>

        <p className="detail__note">
          Added to your room. Nothing is charged now &mdash; it settles when you check out.
        </p>
      </div>

      {/* Sticky, the way every booking screen worth using docks its price and
          its action -- the guest can read the whole page without losing the
          thing they came to press. */}
      <div className="detail__dock">
        <span className="detail__price">
          <i>Billed to your room</i>
          <b>{item.price}</b>
        </span>
        <Button className="guest-button guest-button--primary" type="button" onClick={() => onBook(item.id)}>
          Choose a time
        </Button>
      </div>
    </div>
  );
}
