'use client';

import Image from 'next/image';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils/cn';
import { initialsFor } from './source-primitives';

export function SourceAvatar({
  name,
  src,
  size = 'md',
  className,
}: {
  name: string;
  src?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  return (
    <span data-slot="avatar" className={cn('source-avatar', `source-avatar--${size}`, className)}>
      {src ? <Image src={src} alt="" width={64} height={64} className="source-avatar__image" /> : null}
      <span className={cn('source-avatar__fallback', src && 'is-hidden')} aria-hidden={Boolean(src)}>
        {initialsFor(name)}
      </span>
      <span className="sr-only">{name}</span>
    </span>
  );
}

export function SourceIcon({
  children,
  label,
  tone = 'accent',
  className,
}: {
  children: ReactNode;
  label?: string;
  tone?: 'accent' | 'neutral' | 'soft';
  className?: string;
}) {
  return (
    <span data-slot="icon" data-tone={tone} className={cn('source-icon', className)} aria-label={label} role={label ? 'img' : undefined}>
      {children}
    </span>
  );
}

export function SourceIllustration({
  src = '/globe.svg',
  alt = 'Abstract globe illustration',
  caption,
  className,
}: {
  src?: string;
  alt?: string;
  caption?: string;
  className?: string;
}) {
  return (
    <figure data-slot="illustration" className={cn('source-illustration', className)}>
      <span className="source-illustration__frame">
        <Image src={src} alt={alt} width={320} height={220} className="source-illustration__image" />
      </span>
      {caption ? <figcaption>{caption}</figcaption> : null}
    </figure>
  );
}

export function SourcePhoto({
  src,
  alt = 'Photo',
  caption,
  className,
}: {
  src?: string;
  alt?: string;
  caption?: string;
  className?: string;
}) {
  return (
    <figure data-slot="photo" className={cn('source-photo', className)}>
      <span className="source-photo__frame">
        {src ? <Image src={src} alt={alt} width={400} height={260} className="source-photo__image" /> : <span className="source-photo__placeholder" aria-label={alt} role="img" />}
      </span>
      {caption ? <figcaption>{caption}</figcaption> : null}
    </figure>
  );
}

export function SourceLogo({
  src,
  alt = 'Guest app logo placeholder',
  name = 'Cabana',
  mark = 'C',
  className,
}: {
  src?: string;
  alt?: string;
  name?: string;
  mark?: string;
  className?: string;
}) {
  return (
    <div data-slot="logo" className={cn('source-logo', className)}>
      <span className="source-logo__mark">
        {src ? <Image src={src} alt={alt} width={48} height={48} /> : <span className="source-logo__letter" aria-hidden="true">{mark}</span>}
      </span>
      <span className="source-logo__name">{name}</span>
    </div>
  );
}
