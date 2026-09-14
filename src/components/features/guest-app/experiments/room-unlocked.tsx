'use client';

import { ArrowRight, Check, ForkKnife, House, Receipt, Sparkle } from '@phosphor-icons/react';
import Image from 'next/image';
import { Button } from '@/components/ui';
import { Confetti } from './confetti';

/*
  What a successful scan opens onto.

  Same promotion contract as `RoomScanner` -- `onExplore` is a
  `go('marketplace')`, `onViewStay` a `go('stay-overview')` -- so this moves
  into the guest app as an import and three props.

  It names what the scan bought rather than congratulating the guest. The
  celebration is the confetti and the headline; the cards below are the
  answer to "so what can I do now", which is the thing they actually came
  for.
*/

/** Swap this one path to change the artwork. */
const UNLOCKED_ART = '/illustrations/room-qr.png';

export type RoomUnlockedProps = {
  roomNumber?: string;
  property?: string;
  checkOut?: string;
  onExplore: () => void;
  onViewStay: () => void;
};

const OPENED = [
  { icon: <ForkKnife aria-hidden="true" />, label: 'Dining', detail: 'In-room and on property' },
  { icon: <Sparkle aria-hidden="true" />, label: 'Spa & tours', detail: 'Book a time today' },
  { icon: <Receipt aria-hidden="true" />, label: 'Charge to room', detail: 'Settles at checkout' },
  { icon: <House aria-hidden="true" />, label: 'Room services', detail: 'Housekeeping and requests' },
];

export function RoomUnlocked({
  roomNumber,
  property = 'The Henry Manila',
  checkOut = 'November 12',
  onExplore,
  onViewStay,
}: RoomUnlockedProps) {
  return (
    <div className="unlocked" data-testid="room-unlocked">
      <Confetti />

      <div className="unlocked__hero">
        <h1 className="unlocked__title">{roomNumber ? `Room ${roomNumber} is open` : 'Your room is open'}</h1>
        <p className="unlocked__subtitle">The property has you in the room.</p>
        <Image className="unlocked__art" src={UNLOCKED_ART} alt="" width={330} height={230} priority />
      </div>

      <section className="unlocked__card">
        <header>
          <span className="unlocked__card-icon" aria-hidden="true"><Sparkle /></span>
          <h2>What&rsquo;s open now</h2>
          <span className="unlocked__card-flag"><Check aria-hidden="true" />Unlocked</span>
        </header>
        <ul className="unlocked__opened">
          {OPENED.map((item) => (
            <li key={item.label}>
              <span aria-hidden="true">{item.icon}</span>
              <b>{item.label}</b>
              <small>{item.detail}</small>
            </li>
          ))}
        </ul>
      </section>

      <section className="unlocked__card">
        <header>
          <span className="unlocked__card-icon" aria-hidden="true"><House /></span>
          <h2>Your stay</h2>
        </header>
        <dl className="unlocked__rows">
          <div><dt>Property</dt><dd>{property}</dd></div>
          {roomNumber ? <div><dt>Room</dt><dd>{roomNumber}</dd></div> : null}
          <div><dt>Checking out</dt><dd>{checkOut}</dd></div>
        </dl>
        <p className="unlocked__note">
          Anything you book is added to your room and settles with the property at checkout.
        </p>
      </section>

      <div className="unlocked__dock">
        <Button className="guest-button guest-button--primary" type="button" onClick={onExplore}>
          Explore<ArrowRight aria-hidden="true" />
        </Button>
        <button className="guest-button guest-button--secondary" type="button" onClick={onViewStay}>
          Back to my stay
        </button>
      </div>
    </div>
  );
}
