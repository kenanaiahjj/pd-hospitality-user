'use client';

import { Button } from '@/components/ui';
import { ArrowRight, Minus, Plus, X } from '@/components/ui/huge-icons';
import Image from 'next/image';
import { useState } from 'react';
import { GIFT_PRODUCTS, LOBBY_SHOP_NAME, SANS_RIVAL_NAME, SANS_RIVAL_PRODUCTS, type GiftProduct } from '../../dining';
import { ChoiceList, NotesField, Notice } from '../../guest-ui';
import { formatPesoAmount, parsePesoAmount, PILOT_CITY } from '../../prototype-model';
import type { PayOptions, Result } from '../types';

/*
  The hotel's lobby shop as a shop: pick a product, say how many, and it is
  ordered to the room and held at the front desk. It used to be a chat that
  asked the desk what was in stock; now each product is something the engine
  can sell, so the order has a card, a thread and a state like any booking.

  In Dumaguete the page leads with Cafe Sans Rival, the resort's pasalubong
  partner: the same goods flow, with its own chat, room or pay now, ready at
  5:00 PM and up to 50 to an order.
*/

export type ShopProduct = GiftProduct;
/** Ready on the day (half an hour for the lobby shop, 5:00 PM for the café), or held at the desk for the day the guest leaves. */
export type Ready = 'now' | 'departure';
export type ShopPay = 'room' | 'card';

type Shop = { name: string; products: readonly ShopProduct[]; partner: boolean; cap: number; readyNow: string; details: string[]; blurb: string };

const LOBBY_SHOP: Shop = { name: LOBBY_SHOP_NAME, products: GIFT_PRODUCTS, partner: false, cap: 10, readyNow: 'Ready in about half an hour', details: ['Operated by the hotel', 'Hotel lobby', 'Daily · 8:00 AM–10:00 PM'], blurb: 'Keepsakes and thoughtful gifts, charged to your room.' };
const SANS_RIVAL: Shop = { name: SANS_RIVAL_NAME, products: SANS_RIVAL_PRODUCTS, partner: true, cap: 50, readyNow: 'Ready today at 5:00 PM', details: ['Partner on the resort', 'Collect at the front desk', 'Daily · 8:00 AM–6:00 PM'], blurb: 'Pasalubong from the resort’s own café. Charge it to your room or pay now; the café packs it and the front desk holds it chilled.' };

/** The shops this hotel has: Cafe Sans Rival only where it is. */
const shopsIn = (city: string): Shop[] => (city === PILOT_CITY ? [SANS_RIVAL, LOBBY_SHOP] : [LOBBY_SHOP]);
const shopOf = (product: ShopProduct): Shop => (SANS_RIVAL_PRODUCTS.some((p) => p.name === product.name) ? SANS_RIVAL : LOBBY_SHOP);
/** Who an order is placed with, for its card and record. */
export const shopNameOf = (product: ShopProduct): string => shopOf(product).name;

export function LobbyShopScreen({ city, quote, onOrder, onAskDesk, notice }: {
  /** The stay's city: which shops this hotel has. */
  city: string;
  /** What the engine offers for this many of this product: the room, the limit, the cap. */
  quote: (product: ShopProduct, quantity: number, ready: Ready) => Result<{ options: PayOptions }>;
  /** Place the order. Answers with a sentence when it did not go through; the sheet stays open to say so. */
  onOrder: (product: ShopProduct, quantity: number, note: string, ready: Ready, pay: ShopPay) => string | void;
  /** When the shop cannot take an order, the front desk still can. */
  onAskDesk: () => void;
  notice?: string;
}) {
  const [chosen, setChosen] = useState<ShopProduct | null>(null);
  const shops = shopsIn(city);

  return (
    <div className="guest-stack guest-establishment-chat-screen">
      <div className="guest-establishment-chat-screen__cover">
        <Image src={shops[0]!.products[0]!.image} alt="" fill sizes="(max-width: 720px) calc(100vw - 32px), 688px" />
      </div>
      <div className="guest-page-title">
        <h1>{shops.length > 1 ? 'Pasalubong & gifts' : LOBBY_SHOP_NAME}</h1>
        <p>{shops.length > 1 ? 'Order to collect at the front desk, ready on the day or held for your departure.' : 'Pasalubong, keepsakes, and thoughtful gifts selected for your stay.'}</p>
      </div>
      {notice ? <Notice tone="warning" title="That did not go through">{notice}</Notice> : null}
      {shops.map((shop) => (
        <section key={shop.name} className="guest-stack" aria-label={shop.name}>
          <div className="guest-page-title">
            <h2>{shop.name}</h2>
            <p>{shop.blurb}</p>
            <div className="guest-establishment-chat-screen__details">{shop.details.map((detail) => <span key={detail}>{detail}</span>)}</div>
          </div>
          {[...new Set(shop.products.map((product) => product.group))].map((group) => (
            <div key={group} className="guest-stack" aria-label={group}>
              {group !== shop.name ? <h3>{group}</h3> : null}
              {shop.products.filter((product) => product.group === group).map((product) => (
                <button key={product.name} type="button" className="guest-list-row" onClick={() => setChosen(product)}>
                  <span><Image src={product.image} alt="" width={56} height={56} unoptimized style={{ borderRadius: 12, objectFit: 'cover' }} /></span>
                  <div><b>{product.name}</b><small>{product.price} · {product.availability}</small></div>
                </button>
              ))}
            </div>
          ))}
        </section>
      ))}
      {chosen ? <ShopOrderSheet key={chosen.name} product={chosen} quote={quote} onClose={() => setChosen(null)} onOrder={onOrder} onAskDesk={onAskDesk} /> : null}
    </div>
  );
}

function ShopOrderSheet({ product, quote, onClose, onOrder, onAskDesk }: {
  product: ShopProduct;
  quote: (product: ShopProduct, quantity: number, ready: Ready) => Result<{ options: PayOptions }>;
  onClose: () => void;
  onOrder: (product: ShopProduct, quantity: number, note: string, ready: Ready, pay: ShopPay) => string | void;
  onAskDesk: () => void;
}) {
  const shop = shopOf(product);
  const [pay, setPay] = useState<ShopPay>('room');
  const [quantity, setQuantity] = useState(1);
  const [note, setNote] = useState('');
  const [ready, setReady] = useState<Ready>('now');
  const [problem, setProblem] = useState<string | null>(null);
  const priced = quote(product, quantity, ready);
  const total = formatPesoAmount(parsePesoAmount(product.price) * quantity);
  const options = priced.ok ? priced.options : undefined;
  // Paying now in full needs no room; only a room charge depends on the room being offered.
  const roomOk = pay === 'card' || Boolean(options?.room.offered);
  const needsApproval = Boolean(options?.room.needsApproval);

  return (
    <div className="guest-sheet-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="guest-order-tray guest-table-request" role="dialog" aria-modal="true" aria-label={`Order ${product.name}`}>
        <header className="guest-order-tray__header">
          <div><h2>{product.name}</h2><p>{product.price} each · {shop.name}</p></div>
          <button className="guest-order-tray__close" type="button" onClick={onClose} aria-label="Close"><X /></button>
        </header>
        <div className="guest-table-request__body">
          <div className="guest-table-request__party">
            <span><b>Quantity</b><small>Up to {shop.cap} in one order</small></span>
            <span className="guest-table-request__stepper">
              <button type="button" aria-label="Fewer" disabled={quantity <= 1} onClick={() => setQuantity(quantity - 1)}><Minus aria-hidden="true" /></button>
              <output aria-live="polite">{quantity}</output>
              <button type="button" aria-label="More" disabled={quantity >= shop.cap} onClick={() => setQuantity(quantity + 1)}><Plus aria-hidden="true" /></button>
            </span>
          </div>
          <ChoiceList
            legend="When do you want it?"
            value={ready}
            onChange={setReady}
            options={[
              { value: 'now', title: shop.readyNow, detail: 'Held for you at the front desk.' },
              { value: 'departure', title: 'Hold it for my departure day', detail: 'Kept chilled at the desk until you leave.' },
            ]}
          />
          {shop.partner ? (
            <ChoiceList
              legend="How do you want to pay?"
              value={pay}
              onChange={setPay}
              options={[
                { value: 'room', title: 'Charge to room', detail: 'Settled at the front desk at checkout.' },
                { value: 'card', title: `Pay ${total} now`, detail: 'GCash, Maya or card, in full.' },
              ]}
            />
          ) : null}
          <NotesField name="shop-note" value={note} onChange={setNote} placeholder="Gift wrapping, a card message…" />
          {!priced.ok ? <Notice tone="warning" title="Not available">{priced.message}</Notice> : null}
          {options && !roomOk ? <Notice tone="warning" title="Not on your room">{options.room.why}</Notice> : null}
          {needsApproval ? <Notice title="Over the limit">This is over what can go on a room without the front desk, so they approve it first.</Notice> : null}
          {problem ? <Notice tone="warning" title="That did not go through">{problem}</Notice> : null}
          {!priced.ok || !roomOk ? <button type="button" className="guest-button guest-button--secondary" onClick={onAskDesk}>Ask the front desk instead</button> : null}
        </div>
        <Button
          className="guest-button guest-button--primary"
          type="button"
          disabled={!priced.ok || !roomOk}
          onClick={() => {
            const answer = onOrder(product, quantity, note, ready, pay);
            if (typeof answer === 'string') setProblem(answer);
          }}
        >
          {pay === 'card' ? `Order and pay ${total}` : needsApproval ? 'Ask the front desk to approve' : `Order and charge ${total} to room`}<ArrowRight aria-hidden="true" />
        </Button>
      </section>
    </div>
  );
}
