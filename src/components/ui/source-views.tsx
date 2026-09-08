'use client';

import { useState } from 'react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { ArrowRight, CaretLeft, CaretRight, CheckCircle, X } from '@phosphor-icons/react';
import { cn } from '@/lib/utils/cn';

export interface SourceBadgeProps {
  children: ReactNode;
  tone?: 'neutral' | 'accent' | 'success' | 'warning' | 'danger';
  className?: string;
}

export function SourceBadge({ children, tone = 'neutral', className }: SourceBadgeProps) {
  return (
    <span data-slot="badge" data-tone={tone} className={cn('source-badge', className)}>
      {children}
    </span>
  );
}

export interface SourceBannerProps {
  title: string;
  children?: ReactNode;
  tone?: 'neutral' | 'accent' | 'success' | 'warning' | 'danger';
  action?: ReactNode;
  icon?: ReactNode;
  className?: string;
}

export function SourceBanner({ title, children, tone = 'accent', action, icon, className }: SourceBannerProps) {
  return (
    <aside data-slot="banner" data-tone={tone} className={cn('source-banner', className)} role="status">
      <span className="source-banner__icon">{icon ?? <CheckCircle weight="fill" aria-hidden="true" />}</span>
      <span className="source-banner__copy">
        <strong>{title}</strong>
        {children ? <span>{children}</span> : null}
      </span>
      {action ? <span className="source-banner__action">{action}</span> : null}
    </aside>
  );
}

export interface SourceCardProps {
  eyebrow?: string;
  title: string;
  children?: ReactNode;
  footer?: ReactNode;
  icon?: ReactNode;
  className?: string;
}

export function SourceCard({ eyebrow, title, children, footer, icon, className }: SourceCardProps) {
  return (
    <article data-slot="card" className={cn('source-card', className)}>
      <div className="source-card__header">
        {icon ? <span className="source-card__icon">{icon}</span> : null}
        <span>
          {eyebrow ? <span className="source-card__eyebrow">{eyebrow}</span> : null}
          <h4>{title}</h4>
        </span>
      </div>
      {children ? <div className="source-card__body">{children}</div> : null}
      {footer ? <footer className="source-card__footer">{footer}</footer> : null}
    </article>
  );
}

export interface SourceCarouselProps {
  items: ReactNode[];
  labels?: string[];
  className?: string;
}

export function SourceCarousel({ items, labels, className }: SourceCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const itemCount = items.length;
  const safeIndex = itemCount === 0 ? 0 : Math.min(activeIndex, itemCount - 1);

  if (itemCount === 0) {
    return <div data-slot="carousel" className={cn('source-carousel source-carousel--empty', className)}>No items</div>;
  }

  return (
    <section data-slot="carousel" className={cn('source-carousel', className)} aria-roledescription="carousel">
      <div className="source-carousel__viewport" aria-live="polite">
        <div className="source-carousel__item">{items[safeIndex]}</div>
      </div>
      <div className="source-carousel__controls">
        <button
          type="button"
          aria-label="Previous item"
          className="source-icon-button"
          disabled={safeIndex === 0}
          onClick={() => setActiveIndex((index) => Math.max(0, index - 1))}
        >
          <CaretLeft aria-hidden="true" />
        </button>
        <span className="source-carousel__count">
          <strong>{String(safeIndex + 1).padStart(2, '0')}</strong> / {String(itemCount).padStart(2, '0')}
          {labels?.[safeIndex] ? <span>{labels[safeIndex]}</span> : null}
        </span>
        <button
          type="button"
          aria-label="Next item"
          className="source-icon-button"
          disabled={safeIndex === itemCount - 1}
          onClick={() => setActiveIndex((index) => Math.min(itemCount - 1, index + 1))}
        >
          <CaretRight aria-hidden="true" />
        </button>
      </div>
    </section>
  );
}

export interface SourceChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  selected?: boolean;
  dismissible?: boolean;
}

export function SourceChip({ children, selected, dismissible, className, onClick, ...props }: SourceChipProps) {
  return (
    <button
      {...props}
      type="button"
      data-slot="chip"
      data-state={selected ? 'selected' : 'default'}
      className={cn('source-chip', className)}
      aria-pressed={selected}
      onClick={onClick}
    >
      <span>{children}</span>
      {dismissible ? <X aria-hidden="true" /> : null}
    </button>
  );
}

export function SourceDivider({ className }: { className?: string }) {
  return <hr data-slot="divider" className={cn('source-divider', className)} />;
}

export interface SourceGalleryItem {
  id: string;
  label: string;
  children: ReactNode;
}

export interface SourceGalleryProps {
  items: SourceGalleryItem[];
  label?: string;
  className?: string;
}

export function SourceGallery({ items, label = 'Gallery', className }: SourceGalleryProps) {
  return (
    <ul data-slot="gallery" className={cn('source-gallery', className)} aria-label={label}>
      {items.map((item) => (
        <li key={item.id} className="source-gallery__item">
          <span className="source-gallery__media">{item.children}</span>
          <span className="source-gallery__label">{item.label}</span>
        </li>
      ))}
    </ul>
  );
}

export function SourceLoadingIndicator({ label = 'Loading', className }: { label?: string; className?: string }) {
  return (
    <span data-slot="loading-indicator" className={cn('source-loading-indicator', className)} role="status" aria-label={label}>
      <span className="source-loading-indicator__dots" aria-hidden="true"><i /><i /><i /></span>
      <span className="sr-only">{label}</span>
    </span>
  );
}

export interface SourceTableProps {
  caption: string;
  columns: string[];
  rows: Array<{ id: string; cells: string[] }>;
  className?: string;
}

export function SourceTable({ caption, columns, rows, className }: SourceTableProps) {
  return (
    <div data-slot="table" className={cn('source-table', className)}>
      <table>
        <caption>{caption}</caption>
        <thead>
          <tr>{columns.map((column) => <th key={column} scope="col">{column}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row) => <tr key={row.id}>{row.cells.map((cell, index) => <td key={`${row.id}-${index}`}>{cell}</td>)}</tr>)}
        </tbody>
      </table>
    </div>
  );
}

export interface SourceProgressIndicatorProps {
  value: number;
  max?: number;
  label?: string;
  showValue?: boolean;
  className?: string;
}

export function SourceProgressIndicator({ value, max = 100, label = 'Progress', showValue = true, className }: SourceProgressIndicatorProps) {
  const clampedValue = Math.min(max, Math.max(0, value));
  const percentage = max === 0 ? 0 : (clampedValue / max) * 100;

  return (
    <div data-slot="progress-indicator" className={cn('source-progress', className)}>
      <div className="source-progress__header">
        <span>{label}</span>
        {showValue ? <strong>{Math.round(percentage)}%</strong> : null}
      </div>
      <div
        className="source-progress__track"
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={clampedValue}
      >
        <span className="source-progress__fill" style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
}

export interface SourceSkeletonProps {
  lines?: number;
  avatar?: boolean;
  className?: string;
}

export function SourceSkeleton({ lines = 3, avatar, className }: SourceSkeletonProps) {
  return (
    <div data-slot="skeleton" className={cn('source-skeleton', className)} aria-busy="true" aria-label="Loading">
      {avatar ? <span className="source-skeleton__avatar" /> : null}
      <span className="source-skeleton__lines">
        {Array.from({ length: lines }, (_, index) => <span key={index} className="source-skeleton__line" />)}
      </span>
    </div>
  );
}

export interface SourceStackedListItem {
  id: string;
  title: string;
  description?: string;
  value?: string;
  leading?: ReactNode;
  trailing?: ReactNode;
}

export function SourceStackedList({ items, className }: { items: SourceStackedListItem[]; className?: string }) {
  return (
    <ul data-slot="stacked-list" className={cn('source-stacked-list', className)}>
      {items.map((item) => (
        <li key={item.id} className="source-stacked-list__item">
          {item.leading ? <span className="source-stacked-list__leading">{item.leading}</span> : null}
          <span className="source-stacked-list__copy">
            <strong>{item.title}</strong>
            {item.description ? <small>{item.description}</small> : null}
          </span>
          {item.value ? <span className="source-stacked-list__value">{item.value}</span> : null}
          {item.trailing ? <span className="source-stacked-list__trailing">{item.trailing}</span> : null}
        </li>
      ))}
    </ul>
  );
}

export function SourceStatusDot({
  status = 'online',
  label,
  className,
}: {
  status?: 'online' | 'pending' | 'offline' | 'neutral';
  label: string;
  className?: string;
}) {
  return (
    <span data-slot="status-dot" data-status={status} className={cn('source-status-dot', className)}>
      <span className="source-status-dot__dot" aria-hidden="true" />
      <span>{label}</span>
    </span>
  );
}

export interface SourceTabBarItem {
  value: string;
  label: string;
  icon?: ReactNode;
}

export function SourceTabBar({
  items,
  value,
  onValueChange,
  className,
}: {
  items: SourceTabBarItem[];
  value: string;
  onValueChange: (value: string) => void;
  className?: string;
}) {
  return (
    <nav data-slot="tab-bar" className={cn('source-tab-bar', className)} aria-label="Primary">
      {items.map((item) => {
        const active = item.value === value;
        return (
          <button
            key={item.value}
            type="button"
            role="tab"
            aria-selected={active}
            data-state={active ? 'active' : 'inactive'}
            onClick={() => onValueChange(item.value)}
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

export function SourceToolbar({ children, className }: { children: ReactNode; className?: string }) {
  return <div data-slot="toolbar" className={cn('source-toolbar', className)}>{children}</div>;
}

export function SourceTopNavigationBar({
  eyebrow,
  title,
  leading,
  trailing,
  className,
}: {
  eyebrow?: string;
  title: string;
  leading?: ReactNode;
  trailing?: ReactNode;
  className?: string;
}) {
  return (
    <header data-slot="top-navigation-bar" className={cn('source-top-navigation', className)}>
      <span className="source-top-navigation__leading">{leading}</span>
      <span className="source-top-navigation__title">
        {eyebrow ? <small>{eyebrow}</small> : null}
        <strong>{title}</strong>
      </span>
      <span className="source-top-navigation__trailing">{trailing}</span>
    </header>
  );
}

export function SourceInlineAction({ children, className, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button {...props} type="button" data-slot="inline-action" className={cn('source-inline-action', className)}>
      <span>{children}</span>
      <ArrowRight aria-hidden="true" />
    </button>
  );
}
