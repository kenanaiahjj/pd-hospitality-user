'use client';

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import type { MouseEvent, ReactNode } from 'react';
import { CaretDown, X } from '@phosphor-icons/react';
import { cn } from '@/lib/utils/cn';
import { useEscapeKey, useFocusRestoration } from './source-primitives';
import { SourceButton } from './source-controls';

interface SourceDialogFrameProps {
  open: boolean;
  title: string;
  kind: 'bottom-sheet' | 'full-screen';
  children: ReactNode;
  onOpenChange: (open: boolean) => void;
  className?: string;
}

function SourceDialogFrame({ open, title, kind, children, onOpenChange, className }: SourceDialogFrameProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const handleClose = useCallback(() => onOpenChange(false), [onOpenChange]);

  useFocusRestoration(open);
  useEscapeKey(handleClose, open);

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialogRef.current?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  if (!open) {
    return null;
  }

  const handleBackdropPointerDown = (event: MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      handleClose();
    }
  };

  return (
    <div
      data-slot={kind === 'bottom-sheet' ? 'bottom-sheet' : 'full-screen-overlay'}
      data-overlay-kind={kind}
      className={cn('source-overlay', `source-overlay--${kind}`, className)}
      onMouseDown={handleBackdropPointerDown}
    >
      <div ref={dialogRef} className="source-dialog" role="dialog" aria-modal="true" aria-label={title} tabIndex={-1}>
        <div className="source-dialog__header">
          <div>
            <span className="source-dialog__eyebrow">Asbir Source UI</span>
            <h3>{title}</h3>
          </div>
          <button type="button" className="source-icon-button" aria-label="Close" onClick={handleClose}>
            <X aria-hidden="true" />
          </button>
        </div>
        <div className="source-dialog__body">{children}</div>
      </div>
    </div>
  );
}

export interface SourceBottomSheetProps {
  open: boolean;
  title: string;
  children: ReactNode;
  onOpenChange: (open: boolean) => void;
  className?: string;
}

export function SourceBottomSheet(props: SourceBottomSheetProps) {
  return <SourceDialogFrame {...props} kind="bottom-sheet" />;
}

export interface SourceFullScreenOverlayProps {
  open: boolean;
  title: string;
  children: ReactNode;
  onOpenChange: (open: boolean) => void;
  className?: string;
}

export function SourceFullScreenOverlay(props: SourceFullScreenOverlayProps) {
  return <SourceDialogFrame {...props} kind="full-screen" />;
}

export interface SourceDropdownMenuItem {
  id: string;
  label: string;
}

export interface SourceDropdownMenuProps {
  label: string;
  items: SourceDropdownMenuItem[];
  onSelect?: (id: string) => void;
  className?: string;
}

export function SourceDropdownMenu({ label, items, onSelect, className }: SourceDropdownMenuProps) {
  const menuId = useId();
  const [open, setOpen] = useState(false);

  useEscapeKey(() => setOpen(false), open);

  return (
    <div data-slot="dropdown-menu" className={cn('source-dropdown-menu', className)}>
      <button
        type="button"
        className="source-dropdown-menu__trigger"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((value) => !value)}
      >
        <span>{label}</span>
        <CaretDown aria-hidden="true" className={cn('source-dropdown-menu__icon', open && 'is-open')} />
      </button>
      {open ? (
        <div id={menuId} className="source-dropdown-menu__content" role="menu" aria-label={`${label} menu`}>
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              role="menuitem"
              onClick={() => { onSelect?.(item.id); setOpen(false); }}
            >
              {item.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export interface SourceToastProps {
  open: boolean;
  title: string;
  message?: string;
  action?: ReactNode;
  onClose: () => void;
  className?: string;
}

export function SourceToast({ open, title, message, action, onClose, className }: SourceToastProps) {
  if (!open) {
    return null;
  }

  return (
    <div data-slot="toast" className={cn('source-toast', className)} role="status" aria-live="polite">
      <span className="source-toast__copy">
        <strong>{title}</strong>
        {message ? <span>{message}</span> : null}
      </span>
      {action ? <span className="source-toast__action">{action}</span> : null}
      <SourceButton variant="quiet" size="sm" aria-label="Dismiss notification" onClick={onClose}>
        <X aria-hidden="true" />
      </SourceButton>
    </div>
  );
}
