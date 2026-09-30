'use client';

import { Check, Tag as TagIcon } from '@phosphor-icons/react';
import { useState } from 'react';
import type { StayHotel } from './model';
import { PROMO_CODES, offersFor } from './model';

/*
  Offers, said where guests are choosing: on results and on a hotel page,
  not only once they reach payment. Saving one keeps its code for checkout,
  which applies it; nobody should need to remember or type a code to get it.

  The saved code lives on this device only -- a convenience, like recent
  searches -- and every storage access is wrapped, so a blocked store just
  means the guest taps the offer again at checkout.
*/

const PENDING_KEY = 'cabana.pending-voucher.v1';

export function readPendingVoucher(): string {
  try {
    return window.localStorage.getItem(PENDING_KEY) ?? '';
  } catch {
    return '';
  }
}

export function savePendingVoucher(code: string | null) {
  try {
    if (code) window.localStorage.setItem(PENDING_KEY, code);
    else window.localStorage.removeItem(PENDING_KEY);
  } catch {
    // Not kept; checkout still lists the offers.
  }
}

/** A row of offer cards. With a hotel, only the offers that stay qualifies for. */
export function OffersStrip({ hotel, nights, title = 'Offers' }: { hotel?: StayHotel; nights: number; title?: string }) {
  const [saved, setSaved] = useState(readPendingVoucher);
  const offers = hotel ? offersFor(hotel, nights) : Object.entries(PROMO_CODES).map(([code, promo]) => ({ code, promo }));
  if (!offers.length) return null;
  return (
    <section className="sb-offers-strip" aria-label={title}>
      <p className="sb-offers-strip__title"><TagIcon weight="fill" aria-hidden="true" />{title}</p>
      <div className="sb-rail sb-offers-strip__rail">
        {offers.map(({ code, promo }) => {
          const isSaved = saved === code;
          return (
            <article key={code} className={`sb-offer-card${isSaved ? ' is-saved' : ''}`} aria-label={promo.title}>
              <b>{promo.title}</b>
              <small>{promo.terms}</small>
              <span className="sb-offer-card__foot">
                <code>{code}</code>
                <button type="button" onClick={() => { const next = isSaved ? null : code; savePendingVoucher(next); setSaved(next ?? ''); }} aria-pressed={isSaved}>
                  {isSaved ? <><Check aria-hidden="true" />Saved for checkout</> : 'Use at checkout'}
                </button>
              </span>
            </article>
          );
        })}
      </div>
    </section>
  );
}
