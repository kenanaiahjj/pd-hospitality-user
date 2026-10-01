'use client';

import { PAYMENT_METHOD_NAMES, paymentReference, paymentStatus, paymentsSummary } from './payments-model';
import type { GuestSession, PaymentRecord } from './prototype-model';
import { formatPesoAmount } from './prototype-model';
import { Notice, StatePanel, SummaryRow, Tag } from './guest-ui';
import { Button } from '@/components/ui';
import { ArrowRight, CaretRight, Receipt } from '@phosphor-icons/react';

/*
  Payments: what went through the gateway, and what came back. Room charges
  are not here -- they settle at the front desk and live on My Stay.
*/

const STATUS_LABEL = { paid: 'Paid', 'partly-refunded': 'Partly refunded', refunded: 'Refunded' } as const;
const STATUS_TONE = { paid: 'positive', 'partly-refunded': 'warning', refunded: 'neutral' } as const;

const dateLabel = (iso: string) => new Date(`${iso}T12:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

export function PaymentsScreen({ session, onOpen, onExplore }: { session: GuestSession; onOpen: (id: string) => void; onExplore: () => void }) {
  const payments = session.payments ?? [];
  const { net } = paymentsSummary(session);
  return (
    <div className="guest-stack">
      <div className="guest-page-title">
        <h1>Payments</h1>
        {payments.length ? <p>{payments.length} {payments.length === 1 ? 'payment' : 'payments'} · {formatPesoAmount(net)} paid, after refunds</p> : null}
      </div>
      {payments.length === 0 ? (
        <StatePanel icon={<Receipt />} title="Nothing paid in the app yet" actions={<Button className="guest-button guest-button--secondary" type="button" onClick={onExplore}>Book a stay<ArrowRight aria-hidden="true" /></Button>}>
          Hotel stays, arrival services and anything you pay for with a card, GCash or Maya show up here, with their receipts and any refunds.
        </StatePanel>
      ) : (
        <ul className="guest-payment-list" aria-label="Payments">
          {payments.map((payment) => {
            const status = paymentStatus(payment);
            return (
              <li key={payment.id}>
                <button type="button" className="guest-payment-row" onClick={() => onOpen(payment.id)}>
                  <span className="guest-payment-row__what">
                    <b>{payment.title}</b>
                    <small>{payment.detail}</small>
                    <small>{dateLabel(payment.paidAt)} · {PAYMENT_METHOD_NAMES[payment.method]}</small>
                  </span>
                  <span className="guest-payment-row__amount">
                    <strong>{formatPesoAmount(payment.amount)}</strong>
                    <Tag tone={STATUS_TONE[status]}>{STATUS_LABEL[status]}</Tag>
                  </span>
                  <CaretRight aria-hidden="true" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
      <Notice title="Room charges are not listed here">Hotel services charged to your room are on My Stay, and settled at the front desk when you check out.</Notice>
    </div>
  );
}

export function PaymentDetailScreen({ payment }: { payment?: PaymentRecord }) {
  if (!payment) {
    return (
      <div className="guest-stack">
        <div className="guest-page-title"><h1>Payment not found</h1></div>
        <StatePanel icon={<Receipt />} title="We could not find that payment">It may have been cleared with the account. The list of payments is under Profile.</StatePanel>
      </div>
    );
  }
  const status = paymentStatus(payment);
  const kept = payment.amount - payment.refunded;
  return (
    <div className="guest-stack guest-payment-detail">
      <div className="guest-page-title">
        <p className="guest-eyebrow">{payment.detail}</p>
        <h1>{payment.title}</h1>
        <p>{dateLabel(payment.paidAt)}</p>
      </div>
      <div className="guest-summary">
        <SummaryRow label="Paid" value={formatPesoAmount(payment.amount)} strong />
        <SummaryRow label="Paid with" value={PAYMENT_METHOD_NAMES[payment.method]} />
        <SummaryRow label="Status" value={STATUS_LABEL[status]} />
        {payment.refunded > 0 ? <SummaryRow label={`Refunded to ${PAYMENT_METHOD_NAMES[payment.method]}`} value={formatPesoAmount(payment.refunded)} /> : null}
        {payment.refunded > 0 ? <SummaryRow label="You paid, after refunds" value={formatPesoAmount(kept)} strong /> : null}
        <SummaryRow label="Reference" value={paymentReference(payment)} />
      </div>
      {payment.items.length > 1 || (payment.items.length === 1 && payment.items[0]!.title !== payment.title) ? (
        <ul className="guest-cart__lines guest-cart__lines--receipt" aria-label="What this covered">
          {payment.items.map((item, index) => (
            <li key={item.id ?? index} className="guest-cart__line">
              <div className="guest-cart__what">
                <b>{item.title}</b>
                {item.cancelled
                  ? <small>{(item.refundedAmount ?? (item.refunded ? item.amount : 0)) ? `Cancelled · ${formatPesoAmount(item.refundedAmount ?? item.amount)} refunded` : 'Cancelled · no refund'}</small>
                  : item.refundedAmount
                    ? <small>{item.refundedAmount >= item.amount ? 'Refunded' : `${formatPesoAmount(item.refundedAmount)} refunded`}</small>
                    : item.refunded ? <small>Refunded</small> : null}
              </div>
              <div className="guest-cart__price"><strong>{formatPesoAmount(item.amount)}</strong></div>
            </li>
          ))}
        </ul>
      ) : null}
      {status !== 'paid' ? <Notice title="Refunds go back the way you paid">It can take a few days to show on your {PAYMENT_METHOD_NAMES[payment.method]} statement.</Notice> : null}
    </div>
  );
}
