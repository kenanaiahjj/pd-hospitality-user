'use client';

import { ArrowLeft, CalendarBlank, Clock, MapPin } from '@phosphor-icons/react';
import Image from 'next/image';
import { Button } from '@/components/ui';
import type { SearchableItem } from './story-model';

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
        <div className="detail__title">
          <small>{item.category}</small>
          <h1>{item.title}</h1>
          <p>{item.detail}</p>
        </div>

        <dl className="detail__facts">
          <div><dt><MapPin aria-hidden="true" />Where</dt><dd>On property</dd></div>
          <div><dt><Clock aria-hidden="true" />Today</dt><dd>3 times open</dd></div>
          <div><dt><CalendarBlank aria-hidden="true" />Cancel</dt><dd>Up to 24 hours before</dd></div>
        </dl>

        <p className="detail__note">
          Booked to your room and settled with the property at checkout. Nothing is charged now.
        </p>
      </div>

      <div className="detail__dock">
        <span className="detail__price">{item.price}</span>
        <Button className="guest-button guest-button--primary" type="button" onClick={() => onBook(item.id)}>
          Choose a time
        </Button>
      </div>
    </div>
  );
}
