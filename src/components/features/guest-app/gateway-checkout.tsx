'use client';

import { Button } from '@/components/ui';
import { ArrowRight, Check, CreditCard, LockSimple, X } from '@phosphor-icons/react';
import { useRef, useState } from 'react';

/*
  Pay now, for third-party vendors only: a gateway-style checkout that takes
  the money on the vendor's behalf, so it never reaches the hotel folio. A
  prototype stand-in -- no gateway is called and nothing is charged.
*/

export type GatewayMethod = 'card' | 'gcash' | 'maya';

export const GATEWAY_METHOD_LABELS: Record<GatewayMethod, string> = { card: 'Card', gcash: 'GCash', maya: 'Maya' };

const METHOD_HINTS: Record<GatewayMethod, string> = {
  card: 'Visa, Mastercard, JCB',
  gcash: 'Approve in the GCash app',
  maya: 'Approve in the Maya app',
};

export function GatewayCheckout({ merchant, amount, item, onPaid, onClose }: { merchant: string; amount: string; item: string; onPaid: (method: GatewayMethod) => void; onClose: () => void }) {
  const [method, setMethod] = useState<GatewayMethod | null>(null);
  const [processing, setProcessing] = useState(false);
  const timer = useRef<number | null>(null);

  const pay = () => {
    if (!method || processing) return;
    setProcessing(true);
    timer.current = window.setTimeout(() => onPaid(method), 900);
  };
  const close = () => {
    if (timer.current) window.clearTimeout(timer.current);
    onClose();
  };

  return (
    <div className="guest-sheet-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !processing) close(); }}>
      <section className="guest-order-tray guest-gateway" role="dialog" aria-modal="true" aria-labelledby="gateway-title">
        <header className="guest-order-tray__header">
          <div>
            <h2 id="gateway-title">Secure checkout</h2>
            <p>Paying {merchant}</p>
          </div>
          <button className="guest-order-tray__close" type="button" onClick={close} disabled={processing} aria-label="Close"><X /></button>
        </header>
        <div className="guest-gateway__amount">
          <small>{item}</small>
          <strong>{amount}</strong>
        </div>
        <fieldset className="guest-gateway__methods" disabled={processing}>
          <legend>Pay with</legend>
          {(Object.keys(GATEWAY_METHOD_LABELS) as GatewayMethod[]).map((option) => (
            <button key={option} type="button" aria-pressed={method === option} className={method === option ? 'is-active' : ''} onClick={() => setMethod(option)}>
              {option === 'card' ? <CreditCard aria-hidden="true" /> : <span className="guest-gateway__wallet" aria-hidden="true">{option === 'gcash' ? 'G' : 'M'}</span>}
              <span><b>{GATEWAY_METHOD_LABELS[option]}</b><small>{METHOD_HINTS[option]}</small></span>
              {method === option ? <Check aria-hidden="true" /> : null}
            </button>
          ))}
        </fieldset>
        <p className="guest-gateway__note"><LockSimple aria-hidden="true" />Paid directly to {merchant} through our payment partner. Not added to your room bill.</p>
        <footer className="guest-order-tray__footer">
          <Button className="guest-button guest-button--primary" type="button" disabled={!method || processing} onClick={pay}>
            {processing ? 'Processing payment…' : `Pay ${amount}`}{processing ? null : <ArrowRight aria-hidden="true" />}
          </Button>
        </footer>
      </section>
    </div>
  );
}
