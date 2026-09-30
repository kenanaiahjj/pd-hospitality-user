'use client';

import { Notice, ServiceImage, SummaryRow, TextButton } from './guest-ui';
import type { Booking } from './prototype-model';
import { SERVICES, SERVICE_SCHEDULES, acceptsPayNow, canUseOnPropertyServices } from './prototype-model';
import { listingFor } from './vendor-listings';
import { ArrowRight, Sparkle, WifiSlash } from '@phosphor-icons/react';

/*
  A service's own page: what it is, who runs it, what it costs and when, before
  the booking form. Every catalogue item shares it -- only the Hilom massage
  had a page of its own, and the rest dropped the guest straight onto "Choose
  a time" with no chance to read about the thing.
*/

export type ServicePageService = (typeof SERVICES)[number];

export function ServicePage({ service, booking, provider, highlights, online, onBook, onChat }: {
  service: ServicePageService;
  booking: Booking;
  /** Who the guest is dealing with, said the way the booking form says it. */
  provider: string;
  /** What to expect, in the venue's own words. */
  highlights: string[];
  online: boolean;
  onBook: () => void;
  onChat: () => void;
}) {
  const schedule = SERVICE_SCHEDULES[service.id];
  const free = service.price === 'Complimentary';
  const requires = 'requires' in service ? service.requires : undefined;
  // A story's slides restate the category and the cutoff; the table below already says both.
  const restated = new Set([service.category, service.cutoff, service.price, service.name, provider]);
  const expect = highlights.filter((line) => !restated.has(line));
  return (
    <div className="guest-stack guest-service-detail" data-testid="service-page">
      <ServiceImage itemId={service.id} categoryId={service.categoryId} variant="card" tone={service.tone} icon={<Sparkle size={38} />} decorative />
      <div className="guest-page-title">
        <p className="guest-eyebrow">{service.category}</p>
        <h1>{service.name}</h1>
        <p>{provider} · {booking.property}</p>
      </div>
      {expect.length ? (
        <ul className="guest-service-highlights" aria-label="What to expect">
          {expect.map((line) => <li key={line}>{line}</li>)}
        </ul>
      ) : null}
      <div className="guest-summary">
        <SummaryRow label="Price" value={service.price} strong />
        <SummaryRow label="Provider" value={provider} />
        <SummaryRow label="When" value={schedule ? schedule.label : `Daily · ${listingFor(service.id).times.join(', ')}`} />
        <SummaryRow label="Cancellation" value={service.cutoff} />
        {requires ? <SummaryRow label="Bring" value={requires} /> : null}
      </div>
      <Notice title={free ? 'Complimentary' : acceptsPayNow(service) && canUseOnPropertyServices(booking) ? 'Room or pay now' : 'How it is charged'}>
        {free
          ? 'Nothing to pay. Book it so the hotel knows to expect you.'
          : canUseOnPropertyServices(booking)
            ? acceptsPayNow(service)
              ? 'Charge it to your room, or pay now with a card, GCash or Maya.'
              : 'Added to your room bill and settled at the front desk at checkout.'
            : 'Paid through the gateway when you check out your cart.'}
      </Notice>
      {!online ? <Notice tone="offline" icon={<WifiSlash />} title="Live booking is unavailable">Availability and price are never queued. Connect to see current times.</Notice> : null}
      <button className="guest-button guest-button--primary" type="button" onClick={onBook}>
        {online ? (free ? 'Book' : 'Choose a time') : 'See connection options'}<ArrowRight aria-hidden="true" />
      </button>
      {!online ? <TextButton onClick={onChat}>Message the front desk instead</TextButton> : null}
    </div>
  );
}
