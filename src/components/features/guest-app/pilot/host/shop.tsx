'use client';

import { Button } from '@/components/ui';
import { ArrowRight, Minus, Plus, X } from '@phosphor-icons/react';
import Image from 'next/image';
import { useState } from 'react';
import { GIFT_PRODUCTS, LOBBY_SHOP_NAME } from '../../dining';
import { NotesField, Notice } from '../../guest-ui';
import { formatPesoAmount, parsePesoAmount } from '../../prototype-model';
import type { PayOptions, Result } from '../types';

/*
  The hotel's lobby shop as a shop: pick a product, say how many, and it is
  ordered to the room and held at the front desk. It used to be a chat that
  asked the desk what was in stock; now each product is something the engine
  can sell, so the order has a card, a thread and a state like any booking.
*/

export type ShopProduct = (typeof GIFT_PRODUCTS)[number];

export function LobbyShopScreen({ quote, onOrder, notice }: {
  /** What the engine offers for this many of this product: the room, the limit, the cap. */
  quote: (product: ShopProduct, quantity: number) => Result<{ options: PayOptions }>;
  /** Place the order. Answers with a sentence when it did not go through; the sheet stays open to say so. */
  onOrder: (product: ShopProduct, quantity: number, note: string) => string | void;
  notice?: string;
}) {
  const [chosen, setChosen] = useState<ShopProduct | null>(null);
  const groups = [...new Set(GIFT_PRODUCTS.map((product) => product.group))];

  return (
    <div className="guest-stack guest-establishment-chat-screen">
      <div className="guest-establishment-chat-screen__cover">
        <Image src={GIFT_PRODUCTS[0].image} alt="" fill sizes="(max-width: 720px) calc(100vw - 32px), 688px" />
      </div>
      <div className="guest-page-title">
        <h1>{LOBBY_SHOP_NAME}</h1>
        <p>Pasalubong, keepsakes, and thoughtful gifts selected for your stay.</p>
        <div className="guest-establishment-chat-screen__details">
          <span>Operated by the hotel</span>
          <span>Hotel lobby</span>
          <span>Daily · 8:00 AM–10:00 PM</span>
        </div>
      </div>
      <Notice title="Charged to your room">Each order is added to your room bill and held at the front desk, ready in about half an hour.</Notice>
      {notice ? <Notice tone="warning" title="That did not go through">{notice}</Notice> : null}
      {groups.map((group) => (
        <section key={group} aria-label={group}>
          <h2>{group}</h2>
          <div className="guest-stack">
            {GIFT_PRODUCTS.filter((product) => product.group === group).map((product) => (
              <button key={product.name} type="button" className="guest-list-row" onClick={() => setChosen(product)}>
                <span><Image src={product.image} alt="" width={56} height={56} unoptimized style={{ borderRadius: 12, objectFit: 'cover' }} /></span>
                <div><b>{product.name}</b><small>{product.price} · {product.availability}</small></div>
              </button>
            ))}
          </div>
        </section>
      ))}
      {chosen ? <ShopOrderSheet key={chosen.name} product={chosen} quote={quote} onClose={() => setChosen(null)} onOrder={onOrder} /> : null}
    </div>
  );
}

function ShopOrderSheet({ product, quote, onClose, onOrder }: {
  product: ShopProduct;
  quote: (product: ShopProduct, quantity: number) => Result<{ options: PayOptions }>;
  onClose: () => void;
  onOrder: (product: ShopProduct, quantity: number, note: string) => string | void;
}) {
  const [quantity, setQuantity] = useState(1);
  const [note, setNote] = useState('');
  const [problem, setProblem] = useState<string | null>(null);
  const priced = quote(product, quantity);
  const total = formatPesoAmount(parsePesoAmount(product.price) * quantity);
  const options = priced.ok ? priced.options : undefined;
  const roomOk = Boolean(options?.room.offered);
  const needsApproval = Boolean(options?.room.needsApproval);

  return (
    <div className="guest-sheet-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="guest-order-tray guest-table-request" role="dialog" aria-modal="true" aria-label={`Order ${product.name}`}>
        <header className="guest-order-tray__header">
          <div><h2>{product.name}</h2><p>{product.price} each · {LOBBY_SHOP_NAME}</p></div>
          <button className="guest-order-tray__close" type="button" onClick={onClose} aria-label="Close"><X /></button>
        </header>
        <div className="guest-table-request__body">
          <div className="guest-table-request__party">
            <span><b>Quantity</b><small>Up to 10 in one order</small></span>
            <span className="guest-table-request__stepper">
              <button type="button" aria-label="Fewer" disabled={quantity <= 1} onClick={() => setQuantity(quantity - 1)}><Minus aria-hidden="true" /></button>
              <output aria-live="polite">{quantity}</output>
              <button type="button" aria-label="More" disabled={quantity >= 12} onClick={() => setQuantity(quantity + 1)}><Plus aria-hidden="true" /></button>
            </span>
          </div>
          <NotesField name="shop-note" value={note} onChange={setNote} placeholder="Gift wrapping, a card message…" />
          {!priced.ok ? <Notice tone="warning" title="Not available">{priced.message}</Notice> : null}
          {options && !roomOk ? <Notice tone="warning" title="Not on your room">{options.room.why}</Notice> : null}
          {needsApproval ? <Notice title="Over the limit">This is over what can go on a room without the front desk, so they approve it first.</Notice> : null}
          {problem ? <Notice tone="warning" title="That did not go through">{problem}</Notice> : null}
        </div>
        <Button
          className="guest-button guest-button--primary"
          type="button"
          disabled={!priced.ok || !roomOk}
          onClick={() => {
            const answer = onOrder(product, quantity, note);
            if (typeof answer === 'string') setProblem(answer);
          }}
        >
          {needsApproval ? 'Ask the front desk to approve' : `Order and charge ${total} to room`}<ArrowRight aria-hidden="true" />
        </Button>
      </section>
    </div>
  );
}
