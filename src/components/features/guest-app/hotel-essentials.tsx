'use client';

import { ESSENTIALS } from './stay-home';
import { CHECK_OUT_BY, PROPERTY_ANNOUNCEMENTS, isAnnouncementLive } from './prototype-model';
import type { Booking } from './prototype-model';
import { Button } from '@/components/ui';
import { CaretRight, Check, Coffee, Copy, SignOut, SwimmingPool, WifiHigh, X } from '@phosphor-icons/react';
import { useEffect, useRef, useState } from 'react';

/*
  The house facts a guest asks the desk for first, on My Stay: a row that says
  what is inside, and a sheet that leads with the Wi-Fi password -- the one
  thing people open it for -- at a size that can be read across a lobby and
  copied in a tap.
*/

export function HotelEssentialsRow({ booking, hour = 19 }: { booking: Booking; hour?: number }) {
  const [open, setOpen] = useState(false);
  if (!ESSENTIALS[booking.city]) return null;
  return (
    <>
      <button className="guest-my-stay-folio-link" type="button" aria-haspopup="dialog" onClick={() => setOpen(true)}>
        <span className="guest-my-stay-folio-link__icon" aria-hidden="true"><WifiHigh /></span>
        <span className="guest-my-stay-folio-link__copy"><b>Hotel essentials</b><small>Wi-Fi password, breakfast, pool, check-out</small></span>
        <CaretRight size={18} aria-hidden="true" />
      </button>
      {open ? <HotelEssentialsSheet booking={booking} hour={hour} onClose={() => setOpen(false)} /> : null}
    </>
  );
}

function HotelEssentialsSheet({ booking, hour, onClose }: { booking: Booking; hour: number; onClose: () => void }) {
  const facts = ESSENTIALS[booking.city]!;
  const [copy, setCopy] = useState<'idle' | 'copied' | 'failed'>('idle');
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  useEffect(() => {
    if (copy === 'idle') return;
    const timer = window.setTimeout(() => setCopy('idle'), 2200);
    return () => window.clearTimeout(timer);
  }, [copy]);

  const poolNotice = PROPERTY_ANNOUNCEMENTS.find((item) => item.id === 'announcement-pool' && item.activeFrom <= booking.checkOut && item.activeUntil >= booking.checkIn && isAnnouncementLive(item, hour));
  const checkout = new Date(`${booking.checkOut}T12:00:00`).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

  const copyPassword = async () => {
    try {
      await navigator.clipboard.writeText(facts.password);
      setCopy('copied');
    } catch {
      // No clipboard (or refused): the password is on screen, and selectable.
      setCopy('failed');
    }
  };

  return (
    <div className="guest-sheet-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="guest-order-tray guest-essentials-sheet" role="dialog" aria-modal="true" aria-labelledby="essentials-title">
        <header className="guest-order-tray__header">
          <div>
            <h2 id="essentials-title">Hotel essentials</h2>
            <p>{booking.property}</p>
          </div>
          <button ref={closeRef} className="guest-order-tray__close" type="button" onClick={onClose} aria-label="Close"><X /></button>
        </header>

        <div className="guest-essentials-sheet__wifi">
          <small><WifiHigh aria-hidden="true" />Wi-Fi network</small>
          <b>{facts.wifi}</b>
          <small>Password</small>
          <strong data-testid="wifi-password">{facts.password}</strong>
          <Button className="guest-button guest-button--primary" type="button" onClick={copyPassword}>
            {copy === 'copied' ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
            {copy === 'copied' ? 'Copied' : 'Copy password'}
          </Button>
          <p className="guest-essentials-sheet__status" role="status" aria-live="polite">
            {copy === 'copied' ? 'Password copied to your clipboard.' : copy === 'failed' ? 'Could not copy. Press and hold the password to select it.' : ''}
          </p>
        </div>

        <dl className="guest-essentials-sheet__list">
          <div><dt><Coffee aria-hidden="true" />Breakfast</dt><dd>{facts.breakfast}</dd></div>
          <div><dt><SwimmingPool aria-hidden="true" />Pool</dt><dd>{poolNotice ? `${facts.pool.split(' · ')[0]} · reopens 11:00 AM` : facts.pool}</dd></div>
          <div><dt><SignOut aria-hidden="true" />Check-out</dt><dd>{checkout} · {CHECK_OUT_BY}</dd></div>
        </dl>
      </section>
    </div>
  );
}
