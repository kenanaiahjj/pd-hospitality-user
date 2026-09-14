'use client';

import { ArrowRight, ForkKnife, Receipt, Sparkle, WifiHigh } from '@phosphor-icons/react';
import Image from 'next/image';
import { Button } from '@/components/ui';

/*
  The other half of the candidate: what a successful scan opens onto.

  Same promotion contract as `RoomScanner` -- `onExplore` is a `go('marketplace')`
  and `onViewStay` a `go('stay-overview')`. It names what the scan unlocked
  rather than congratulating the guest, because the unlock is the news.
*/

/** Swap this one path to change the artwork. */
const UNLOCKED_ART = '/illustrations/room-qr.png';

export type RoomUnlockedProps = {
  roomNumber?: string;
  onExplore: () => void;
  onViewStay: () => void;
};

const OPENED = [
  { icon: <ForkKnife aria-hidden="true" />, label: 'Dining' },
  { icon: <Sparkle aria-hidden="true" />, label: 'Spa & tours' },
  { icon: <Receipt aria-hidden="true" />, label: 'Charge to room' },
  { icon: <WifiHigh aria-hidden="true" />, label: 'Room services' },
];

export function RoomUnlocked({ roomNumber, onExplore, onViewStay }: RoomUnlockedProps) {
  return (
    <div className="guest-stack unlocked" data-testid="room-unlocked">
      <Image className="unlocked__art" src={UNLOCKED_ART} alt="" width={330} height={230} priority />

      <div className="guest-page-title">
        <h1>{roomNumber ? `Room ${roomNumber} is open` : 'Your room is open'}</h1>
        <p>The property has you in the room. Everything on property is yours to book.</p>
      </div>

      {/* What the scan bought, not a pat on the back. */}
      <ul className="unlocked__grid">
        {OPENED.map((item) => (
          <li key={item.label}>
            <span aria-hidden="true">{item.icon}</span>
            {item.label}
          </li>
        ))}
      </ul>

      <Button className="guest-button guest-button--primary" type="button" onClick={onExplore}>
        Explore the property<ArrowRight aria-hidden="true" />
      </Button>
      <button className="guest-button guest-button--secondary" type="button" onClick={onViewStay}>
        Back to my stay
      </button>
    </div>
  );
}
