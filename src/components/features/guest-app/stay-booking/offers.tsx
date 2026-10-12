'use client';

import { Check, Tag as TagIcon } from '@/components/ui/huge-icons';
import { useEffect, useState, type AnimationEvent } from 'react';
import type { PromoAccount, StayHotel } from './model';
import { NEW_ACCOUNT, offersFor } from './model';

/* A pending voucher is reserved for explicit flow handoffs that preselect a code. */

const PENDING_KEY = 'cabana.pending-voucher.v1';
const CLAIMED_OFFERS_KEY = 'cabana.claimed-offers.v1';
const CLAIMED_OFFERS_CLEARED_EVENT = 'cabana:claimed-offers-cleared';

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

export function clearClaimedOffers() {
  try {
    window.localStorage.removeItem(CLAIMED_OFFERS_KEY);
    window.dispatchEvent(new Event(CLAIMED_OFFERS_CLEARED_EVENT));
  } catch {
    // Clearing prototype data should not fail when storage is unavailable.
  }
}

/**
 * A row of offer cards: the ones this guest can use, and with a hotel, only those that stay qualifies for.
 * `lead` names the one that matters most to this guest: it sits first in the rail, dressed up.
 */
export function OffersStrip({ hotel, nights, title = 'Offers', account = NEW_ACCOUNT, untitled, only, except, lead }: { hotel?: StayHotel; nights: number; title?: string; account?: PromoAccount; /** Show just these codes. */ only?: string[]; /** Leave these out: they are shown elsewhere on the page. */ except?: string[]; /** The page gives it a heading of its own. */ untitled?: boolean; /** Lead with this code, when the guest can use it. */ lead?: string }) {
  const [claimedCodes, setClaimedCodes] = useState<string[]>([]);
  const [claimingCode, setClaimingCode] = useState<string | null>(null);
  const [claimPhase, setClaimPhase] = useState<'feedback' | 'dismissal' | null>(null);
  const [claimMessage, setClaimMessage] = useState('');
  useEffect(() => {
    const handleCleared = () => setClaimedCodes([]);
    window.addEventListener(CLAIMED_OFFERS_CLEARED_EVENT, handleCleared);
    // Older versions stored saved offers permanently, which could hide the whole rail.
    // A save now dismisses a card only for this mounted view; clear any stale flags.
    clearClaimedOffers();
    return () => window.removeEventListener(CLAIMED_OFFERS_CLEARED_EVENT, handleCleared);
  }, []);
  const offers = offersFor(hotel, nights, account).filter(({ code }) => (!only || only.includes(code)) && !except?.includes(code) && !claimedCodes.includes(code));
  const ordered = [...offers].sort((a, b) => Number(b.code === lead) - Number(a.code === lead));
  const card = ({ code, promo }: { code: string; promo: (typeof offers)[number]['promo'] }, isLead: boolean) => {
    const isClaiming = claimingCode === code;
    const isSaving = isClaiming && claimPhase === 'feedback';
    const isDismissing = isClaiming && claimPhase === 'dismissal';
    return (
      <article
        key={code}
        className={`sb-offer-card${isLead ? ' sb-offer-card--lead' : ''}${isSaving ? ' is-saving' : ''}${isDismissing ? ' is-dismissing' : ''}`}
        aria-label={promo.title}
        data-offer-code={code}
        onAnimationEnd={(event: AnimationEvent<HTMLElement>) => {
          if (['sb-offer-saved', 'sb-offer-saved-reduced'].includes(event.animationName)) {
            setClaimPhase('dismissal');
            return;
          }
          if (!['sb-offer-claim', 'sb-offer-claim-reduced'].includes(event.animationName)) return;
          const cardElement = event.currentTarget;
          const rail = cardElement.parentElement;
          const siblings = rail
            ? Array.from(rail.children)
              .filter((element): element is HTMLElement => element instanceof HTMLElement && element !== cardElement)
              .map((element) => {
                const rect = element.getBoundingClientRect();
                return { element, left: rect.left, top: rect.top };
              })
            : [];
          const adjacentCard = cardElement.nextElementSibling ?? cardElement.previousElementSibling;
          const nextButton = adjacentCard?.querySelector<HTMLButtonElement>('button');
          const cardStyles = getComputedStyle(cardElement);
          const motionDuration = Number.parseFloat(cardStyles.getPropertyValue('--offer-claim-duration')) || 250;
          const motionEasing = cardStyles.getPropertyValue('--ease-in-out').trim() || 'cubic-bezier(0.77, 0, 0.175, 1)';
          const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
          if (rail) rail.style.minBlockSize = `${rail.getBoundingClientRect().height}px`;
          setClaimedCodes((codes) => codes.includes(code) ? codes : [...codes, code]);
          setClaimingCode(null);
          setClaimPhase(null);
          window.requestAnimationFrame(() => {
            if (!reduceMotion) {
              for (const sibling of siblings) {
                if (!sibling.element.isConnected || typeof sibling.element.animate !== 'function') continue;
                const rect = sibling.element.getBoundingClientRect();
                const offsetX = sibling.left - rect.left;
                const offsetY = sibling.top - rect.top;
                if (Math.abs(offsetX) < 0.5 && Math.abs(offsetY) < 0.5) continue;
                sibling.element.animate(
                  [
                    { transform: `translate(${offsetX}px, ${offsetY}px)` },
                    { transform: 'translate(0, 0)' },
                  ],
                  { duration: motionDuration, easing: motionEasing },
                );
              }
            }
            if (nextButton?.isConnected) nextButton.focus({ preventScroll: true });
          });
        }}
      >
        <b>{promo.title}</b>
        <small>{promo.terms}</small>
        <span className="sb-offer-card__foot">
          <code>{code}</code>
          <button
            type="button"
            disabled={claimingCode !== null}
            onClick={() => {
              if (claimingCode) return;
              setClaimMessage(`${promo.title} saved. You can choose it at checkout.`);
              setClaimPhase('feedback');
              setClaimingCode(code);
            }}
            aria-label={isClaiming ? `${code} saved. Available at checkout.` : `Save ${promo.title} for checkout`}
          >
            {isClaiming ? <><Check aria-hidden="true" />Saved</> : 'Save'}
          </button>
        </span>
        {isSaving ? (
          <span className="sb-offer-card__sparkles" aria-hidden="true">
            <span className="sb-offer-card__sparkle sb-offer-card__sparkle--lead" />
            <span className="sb-offer-card__sparkle sb-offer-card__sparkle--left" />
            <span className="sb-offer-card__sparkle sb-offer-card__sparkle--right" />
            <span className="sb-offer-card__sparkle sb-offer-card__sparkle--lower" />
            <span className="sb-offer-card__sparkle sb-offer-card__sparkle--upper" />
            <span className="sb-offer-card__sparkle sb-offer-card__sparkle--lower-left" />
            <span className="sb-offer-card__sparkle sb-offer-card__sparkle--lower-right" />
            <span className="sb-offer-card__sparkle sb-offer-card__sparkle--edge" />
          </span>
        ) : null}
      </article>
    );
  };
  return (
    <>
      {ordered.length ? (
        <section className="sb-offers-strip" aria-label={title}>
          {untitled ? null : <p className="sb-offers-strip__title"><TagIcon weight="fill" aria-hidden="true" />{title}</p>}
          <div className="sb-rail sb-offers-strip__rail">{ordered.map((offer) => card(offer, offer.code === lead))}</div>
        </section>
      ) : null}
      {claimMessage ? <span className="sr-only" role="status" aria-live="polite" aria-atomic="true">{claimMessage}</span> : null}
    </>
  );
}
