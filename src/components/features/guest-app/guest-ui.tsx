'use client';

import Image from 'next/image';
import type { Booking, PastStay } from './prototype-model';
import { summarisePastStay } from './prototype-model';
import type { ServiceImageKey } from './service-images';
import { getItemCardImage, getItemThumbnail, getPropertyImage, getServiceImage, getServiceImageKey } from './service-images';
import { Button, Input } from '@/components/ui';
import type { IconSvgElement } from '@hugeicons/react';
import { HugeiconsIcon } from '@hugeicons/react';
import { CaretRight, CheckCircle, House, WarningCircle } from '@phosphor-icons/react';
import type { FormEvent, ReactNode } from 'react';
import { useState } from 'react';

/*
  The guest app's shared building blocks: fields, notices, rows, headings and
  the empty/error pattern. No screen logic lives here.
*/

export function Field({ label, name, type = 'text', placeholder, autoComplete, spellCheck, defaultValue, helper, required, value, onValueChange, min }: FieldProps) {
  const helperId = helper ? `${name}-helper` : undefined;
  const controlled = value !== undefined;
  return (
    <label className="guest-field" htmlFor={name}>
      <span>{label}{required ? ' *' : ''}</span>
      <Input
        id={name}
        name={name}
        type={type}
        placeholder={placeholder}
        autoComplete={autoComplete}
        spellCheck={spellCheck}
        min={min}
        {...(controlled
          ? { value, onChange: (event: FormEvent<HTMLInputElement>) => onValueChange?.(event.currentTarget.value) }
          : { defaultValue })}
        aria-describedby={helperId}
        required={required}
      />
      {helper ? <small id={helperId}>{helper}</small> : null}
    </label>
  );
}

export function Tag({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'positive' | 'warning' | 'dark' }) {
  return <span className={`guest-tag guest-tag--${tone}`}>{children}</span>;
}

/**
 * Every empty and error state, one pattern: what is going on, in the guest's
 * words, then what they can do next. An empty screen is never a dead end, and
 * an error always offers the front desk when the app cannot finish the job.
 */
export function StatePanel({ tone = 'empty', icon, title, children, actions }: { tone?: 'empty' | 'error'; icon: ReactNode; title: string; children: ReactNode; actions?: ReactNode }) {
  return (
    <section className={`guest-state-panel guest-state-panel--${tone}`} role={tone === 'error' ? 'alert' : undefined} aria-label={title}>
      <span className="guest-state-panel__icon" aria-hidden="true">{icon}</span>
      <h2>{title}</h2>
      <p>{children}</p>
      {actions ? <div className="guest-state-panel__actions">{actions}</div> : null}
    </section>
  );
}

/**
 * The hotel's system is out of reach, so this is what the app last heard: the
 * figures stay readable, marked with when they were true, and the guest can
 * retry or ask the desk, who can see the live system.
 */
export function StaleDataNotice({ asOf, onRetry, onAsk }: { asOf: string; onRetry: () => void; onAsk: () => void }) {
  return (
    <div className="guest-stale-notice" role="status">
      <WarningCircle aria-hidden="true" />
      <div>
        <b>Can’t reach the hotel’s system</b>
        <small>{`Showing what we had as of ${asOf}. It may have changed since.`}</small>
        <span className="guest-stale-notice__actions">
          <button type="button" onClick={onRetry}>Try again</button>
          <button type="button" onClick={onAsk}>Ask the front desk</button>
        </span>
      </div>
    </div>
  );
}

export function Notice({ icon, title, children, tone = 'neutral' }: { icon?: ReactNode; title: string; children: ReactNode; tone?: 'neutral' | 'positive' | 'warning' | 'offline' }) {
  return (
    <div className={`guest-notice guest-notice--${tone}`} role="status">
      {icon ? <span className="guest-notice__icon" aria-hidden="true">{icon}</span> : null}
      <div><strong>{title}</strong><p>{children}</p></div>
    </div>
  );
}

export function SummaryRow({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return <div className="guest-summary-row"><span>{label}</span><b className={strong ? 'is-strong' : ''}>{value}</b></div>;
}

export function ServiceVisual({ tone, icon }: { tone: string; icon: ReactNode }) {
  return <div className={`guest-service-visual guest-service-visual--${tone}`} aria-hidden="true"><span>{icon}</span><i /><i /></div>;
}

export function ServiceImage({
  imageKey,
  itemId,
  categoryId,
  variant = 'thumbnail',
  tone,
  icon,
  decorative = false,
}: {
  imageKey?: ServiceImageKey;
  itemId?: string;
  categoryId?: string;
  variant?: 'thumbnail' | 'card';
  tone: string;
  icon: ReactNode;
  decorative?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const effectiveKey: ServiceImageKey = imageKey ?? (itemId ? getServiceImageKey({ id: itemId, categoryId: categoryId ?? '' }) : 'amenity');
  const image = itemId
    ? (variant === 'card' ? getItemCardImage(itemId, categoryId) : getItemThumbnail(itemId, categoryId))
    : getServiceImage(effectiveKey);

  return (
    <div className={`guest-service-image guest-service-image--${effectiveKey} ${variant === 'card' ? 'is-card' : 'is-thumbnail'} ${failed ? 'is-error' : ''}`}>
      <ServiceVisual tone={tone} icon={icon} />
      <Image
        src={image.src}
        alt={decorative ? '' : image.alt}
        fill
        sizes="(max-width: 720px) calc(100vw - 32px), 688px"
        style={{ objectPosition: image.focalPoint }}
        onError={() => setFailed(true)}
      />
    </div>
  );
}

export function PropertyImage({
  property,
  aspectRatio = '16/9',
  className = '',
  decorative = false,
}: {
  property?: string;
  aspectRatio?: string;
  className?: string;
  decorative?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const image = getPropertyImage(property);

  return (
    <div className={`guest-property-image ${failed ? 'is-error' : ''} ${className}`} style={{ aspectRatio }}>
      <div className="guest-property-image__fallback" aria-hidden="true">
        <House size={30} />
      </div>
      <Image
        src={image.src}
        alt={decorative ? '' : image.alt}
        fill
        sizes="(max-width: 720px) calc(100vw - 32px), 480px"
        style={{ objectPosition: image.focalPoint }}
        onError={() => setFailed(true)}
      />
    </div>
  );
}

/**
 * `eyebrow` is optional, and most screens should not pass one.
 *
 * An eyebrow earns its place by saying something the title cannot: which
 * property, which room, which step of how many, how long until a cutoff. A
 * label that restates the heading in other words -- "Updates" over
 * "Notifications", "Stay complete" over "This stay is settled" -- is a second
 * heading the eye has to read and discard.
 */
export function ScreenIntro({ icon, eyebrow, title, text, children }: { icon?: ReactNode; eyebrow?: string; title: string; text: string; children: ReactNode }) {
  return <div className="guest-stack guest-stack--intro">{icon ? <HeroIcon>{icon}</HeroIcon> : null}<div className="guest-page-title">{eyebrow ? <p className="guest-eyebrow">{eyebrow}</p> : null}<h1>{title}</h1><p>{text}</p></div>{children}</div>;
}

export function FormScreen({ step, title, text, children }: { step: string; title: string; text: string; children: ReactNode }) {
  // "1 of 2" fills the bar to match; a label without a count keeps the stylesheet's default.
  const count = step.match(/^(\d+) of (\d+)$/);
  const fill = count ? { width: `${(Number(count[1]) / Number(count[2])) * 100}%` } : undefined;
  return <div className="guest-stack"><div className="guest-step"><span>{step}</span><i><b style={fill} /></i></div><div className="guest-page-title"><h1>{title}</h1><p>{text}</p></div><div className="guest-form">{children}</div></div>;
}

export function TextButton({ children, onClick, disabled }: { children: ReactNode; onClick: () => void; disabled?: boolean }) {
  return <Button className="guest-text-button" variant="ghost" type="button" onClick={onClick} disabled={disabled}>{children}</Button>;
}

export function StayMiniCard({ booking, status }: { booking: Booking; status: string }) {
  return <div className="guest-mini-stay"><span><House /></span><div><b>{booking.property}</b><small>{status}</small></div><CheckCircle /></div>;
}

export function ReviewBlock({ icon, title, lines, onEdit }: { icon: ReactNode; title: string; lines: string[]; onEdit?: () => void }) {
  return <div className="guest-review-block"><span>{icon}</span><div><b>{title}</b>{lines.map((line) => <small key={line}>{line}</small>)}</div><button type="button" aria-label={`Edit ${title}`} onClick={onEdit}><CaretRight /></button></div>;
}

export function SectionHeading({ title, action, onAction, count }: { title: string; action?: string; onAction?: () => void; count?: string }) {
  return <div className="guest-section-heading"><h2>{title}</h2>{count ? <span className="guest-section-heading__count">{count}</span> : action ? <button onClick={onAction}>{action}<CaretRight /></button> : null}</div>;
}

/**
 * A finished stay, as a card that opens. It used to be inert, which made the
 * spend it represents unreachable: the guest could see they stayed somewhere
 * and nothing about what it cost or what they did there.
 */
export function HistoryItem({ stay, onOpen }: { stay: PastStay; onOpen: () => void }) {
  const total = summarisePastStay(stay).total;
  return (
    <button className="guest-history-card" type="button" onClick={onOpen}>
      <div className="guest-history-card__media">
        <PropertyImage property={stay.property} aspectRatio="16/8" decorative />
        <Tag tone="neutral">Completed</Tag>
      </div>
      <div className="guest-history-card__body">
        <b>{stay.property}</b>
        <p>{formatPastStayDates(stay)}</p>
        <small>Room {stay.roomNumber} · {stay.nights} {stay.nights === 1 ? 'night' : 'nights'}</small>
      </div>
      <div className="guest-history-card__footer">
        <span>{stay.charges.length} {stay.charges.length === 1 ? 'charge' : 'charges'} · {stay.city}</span>
        <b>{total}<CaretRight /></b>
      </div>
    </button>
  );
}

export function GuestNavIcon({ icon }: { icon: IconSvgElement }) {
  return <HugeiconsIcon icon={icon} size={24} strokeWidth={1.75} aria-hidden="true" focusable="false" />;
}

export function NavButton({ label, icon, activeIcon, active, unread = false, onClick }: { label: string; icon: IconSvgElement; activeIcon: IconSvgElement; active: boolean; unread?: boolean; onClick: () => void }) {
  return <button aria-label={unread ? `${label}, new message` : label} aria-current={active ? 'page' : undefined} onClick={onClick}><span><HugeiconsIcon icon={active ? activeIcon : icon} size={24} strokeWidth={active ? undefined : 1.75} aria-hidden="true" focusable="false" /></span><small>{label}</small>{unread ? <i className="guest-bottom-nav__badge" aria-hidden="true" /> : null}</button>;
}
export type FieldProps = {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
  spellCheck?: boolean;
  defaultValue?: string;
  helper?: string;
  required?: boolean;
  /** Controlled value. Pass with `onValueChange` where the value is read back. */
  value?: string;
  onValueChange?: (next: string) => void;
  min?: string;
};

export function HeroIcon({ children, tone = 'plain' }: { children: ReactNode; tone?: string }) {
  return <div className={`guest-hero-icon guest-hero-icon--${tone}`} aria-hidden="true">{children}</div>;
}

/** "March 14–17, 2026" -- one month named once when the stay does not cross one. */
export function formatPastStayDates(stay: PastStay) {
  const start = new Date(`${stay.checkIn}T00:00:00Z`);
  const end = new Date(`${stay.checkOut}T00:00:00Z`);
  const month = (d: Date) => d.toLocaleDateString('en-GB', { month: 'long', timeZone: 'UTC' });
  const day = (d: Date) => d.getUTCDate();
  const year = end.getUTCFullYear();

  return month(start) === month(end)
    ? `${month(start)} ${day(start)}–${day(end)}, ${year}`
    : `${month(start)} ${day(start)} – ${month(end)} ${day(end)}, ${year}`;
}
