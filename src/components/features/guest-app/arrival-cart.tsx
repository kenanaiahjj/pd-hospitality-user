'use client';

import { GatewayCheckout, GATEWAY_METHOD_LABELS, type GatewayMethod } from './gateway-checkout';
import { ScreenIntro, Notice, StatePanel, SummaryRow, TextButton } from './guest-ui';
import type { CartTotals } from './arrival-cart-model';
import { cartAmountLabel } from './arrival-cart-model';
import type { CartLine, ServiceBooking } from './prototype-model';
import { parsePesoAmount } from './prototype-model';
import { Button } from '@/components/ui';
import { ArrowRight, Check, ShoppingCartSimple, X } from '@phosphor-icons/react';
import { useState } from 'react';

/*
  The pre-arrival cart's three surfaces: the dock that follows the guest around
  the arrival roster, the cart itself, and the one receipt for all of it.
*/

/** "Friday · November 20 · 1:30 PM", then what is particular to it: a route, a return time, a count. */
const whenAndWhat = (booking: ServiceBooking) => {
  const extra = booking.summary?.split(' · ').slice(1).join(' · ');
  return extra ? `${booking.scheduledFor} · ${extra}` : booking.scheduledFor;
};

const linesLabel = (count: number) => `${count} ${count === 1 ? 'item' : 'items'}`;

/** Docked above the tab bar while the cart has anything in it. */
export function ArrivalCartDock({ totals, onOpen }: { totals: CartTotals; onOpen: () => void }) {
  if (!totals.count) return null;
  return (
    <>
      <div className="guest-dock-spacer" aria-hidden="true" />
      <div className="guest-dock guest-cart-dock" data-testid="arrival-cart-dock">
        <div className="guest-dock__summary">
          <span>Cart · {linesLabel(totals.count)}</span>
          <strong>{totals.payNow > 0 ? cartAmountLabel(totals.payNow) : 'Nothing to pay now'}</strong>
        </div>
        <button type="button" className="guest-button guest-button--primary" onClick={onOpen}>
          <ShoppingCartSimple aria-hidden="true" />Review cart
        </button>
      </div>
    </>
  );
}

export function ArrivalCartScreen({ property, lines, totals, onRemove, onStartPay, onSettle, onBrowse }: {
  property: string;
  lines: CartLine[];
  totals: CartTotals;
  onRemove: (lineId: string) => void;
  /** False when the app is offline or the booking cannot go through; the parent shows why. */
  onStartPay: () => boolean;
  onSettle: (method?: GatewayMethod) => void;
  onBrowse: () => void;
}) {
  const [gatewayOpen, setGatewayOpen] = useState(false);

  if (!lines.length) {
    return (
      <div className="guest-stack">
        <div className="guest-page-title"><h1>Your cart</h1></div>
        <StatePanel icon={<ShoppingCartSimple />} title="Your cart is empty" actions={<Button className="guest-button guest-button--secondary" type="button" onClick={onBrowse}>Arrange your arrival<ArrowRight aria-hidden="true" /></Button>}>
          Transfers, luggage help, a celebration setup and early check-in all check out together here.
        </StatePanel>
      </div>
    );
  }

  const paysNow = totals.payNow > 0;
  const submit = () => {
    if (!onStartPay()) return;
    if (paysNow) setGatewayOpen(true);
    else onSettle();
  };

  return (
    <div className="guest-stack guest-cart">
      <div className="guest-page-title">
        <p className="guest-eyebrow">{property}</p>
        <h1>Your cart</h1>
        <p>Everything for your arrival, paid once.</p>
      </div>

      <ul className="guest-cart__lines" aria-label="Cart items">
        {lines.map((line) => (
          <li key={line.booking.id} className="guest-cart__line">
            <div className="guest-cart__what">
              <b>{line.booking.title}</b>
              <small>{whenAndWhat(line.booking)}</small>
            </div>
            <div className="guest-cart__price">
              <strong>{line.settle === 'free' ? 'Free' : line.booking.amount}</strong>
              {line.settle === 'room-later' ? <small>On room later</small> : null}
            </div>
            <button type="button" className="guest-cart__remove" aria-label={`Remove ${line.booking.title}`} onClick={() => onRemove(line.booking.id)}><X aria-hidden="true" /></button>
          </li>
        ))}
      </ul>

      <div className="guest-summary">
        <SummaryRow label="Pay now" value={paysNow ? cartAmountLabel(totals.payNow) : '₱0'} strong />
        {totals.roomLater > 0 ? <SummaryRow label="Charged to your room later" value={cartAmountLabel(totals.roomLater)} /> : null}
      </div>

      {totals.roomLater > 0 ? (
        <Notice title="Early check-in is not paid today">
          The hotel confirms it first. If approved, the fee is added to your room once you have one and settled at checkout.
        </Notice>
      ) : null}
      {paysNow ? (
        <Notice title="One payment">
          Card, GCash or Maya. Confirmed by the hotel after payment; anything it cannot arrange is refunded.
        </Notice>
      ) : null}

      <Button className="guest-button guest-button--primary" type="button" onClick={submit}>
        {paysNow ? `Pay ${cartAmountLabel(totals.payNow)}` : 'Confirm requests'}<ArrowRight aria-hidden="true" />
      </Button>
      <TextButton onClick={onBrowse}>Add more</TextButton>

      {gatewayOpen ? (
        <GatewayCheckout
          merchant={property}
          amount={cartAmountLabel(totals.payNow)}
          item={`Arrival · ${linesLabel(totals.count)}`}
          onPaid={(method) => { setGatewayOpen(false); onSettle(method); }}
          onClose={() => setGatewayOpen(false)}
        />
      ) : null}
    </div>
  );
}

export function ArrivalCartConfirmation({ bookings, method, onViewStay, onBrowse }: {
  bookings: ServiceBooking[];
  method?: GatewayMethod;
  onViewStay: () => void;
  onBrowse: () => void;
}) {
  const paid = bookings.filter((booking) => booking.paymentStatus === 'paid');
  const paidTotal = paid.reduce((sum, booking) => sum + parsePesoAmount(booking.amount), 0);
  const later = bookings.filter((booking) => booking.paymentStatus === 'pending-confirmation');
  return (
    <ScreenIntro
      icon={<Check size={30} />}
      title="Your arrival is arranged"
      text={paidTotal > 0
        ? `Paid ${cartAmountLabel(paidTotal)} with ${method ? GATEWAY_METHOD_LABELS[method] : 'card'}. It is not on your room bill; the receipts are in My Stay.`
        : 'Sent to the hotel. The receipts are in My Stay.'}
    >
      <ul className="guest-cart__lines guest-cart__lines--receipt" aria-label="Booked">
        {bookings.map((booking) => (
          <li key={booking.id} className="guest-cart__line">
            <div className="guest-cart__what">
              <b>{booking.title}</b>
              <small>{whenAndWhat(booking)}</small>
            </div>
            <div className="guest-cart__price">
              <strong>{booking.paymentStatus === 'paid' ? `Paid ${booking.amount}` : booking.paymentStatus === 'complimentary' ? 'Complimentary' : 'On room later'}</strong>
            </div>
          </li>
        ))}
      </ul>
      {paidTotal > 0 ? (
        <div className="guest-summary">
          <SummaryRow label="Paid" value={cartAmountLabel(paidTotal)} strong />
          {later.length ? <SummaryRow label="On your room later" value={cartAmountLabel(later.reduce((sum, booking) => sum + parsePesoAmount(booking.amount), 0))} /> : null}
        </div>
      ) : null}
      <Notice title="What happens next">The hotel confirms drivers and early check-in, and we tell you here. Luggage and celebrations are arranged for your arrival day.</Notice>
      <Button className="guest-button guest-button--primary" type="button" onClick={onViewStay}>View my stay<ArrowRight aria-hidden="true" /></Button>
      <TextButton onClick={onBrowse}>Arrange something else</TextButton>
    </ScreenIntro>
  );
}
