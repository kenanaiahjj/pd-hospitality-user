'use client';

import { ArrowRight, Check, House, Receipt } from '@phosphor-icons/react';
import Image from 'next/image';
import { Button } from '@/components/ui';
import { Confetti } from './confetti';
import { PROPERTY_IMAGE, storyImage } from './story-imagery';

/*
  What a successful scan opens onto.

  Same promotion contract as `RoomScanner` -- `onExplore` is a
  `go('marketplace')`, `onViewStay` a `go('stay-overview')` -- so this moves
  into the guest app as an import and three props.

  It names what the scan bought rather than congratulating the guest. The
  celebration is the confetti and the headline; the cards below are the
  answer to "so what can I do now", which is the thing they actually came
  for.

  The scan does not open a door. It proves the guest is standing in the room
  the property assigned them, which is what releases on-property services and
  charge-to-room -- so the copy says checked in, never "your room is open".
*/

/*
  Not the door-and-keycard illustration this screen used to carry. The scan
  unlocks services, so art of a lock being opened argued with the words
  underneath it -- and a guest reads the picture first.
*/
const UNLOCKED_ART = '/illustrations/celebrate.png';

export type RoomUnlockedProps = {
  roomNumber?: string;
  property?: string;
  checkOut?: string;
  onExplore: () => void;
  onViewStay: () => void;
};

/*
  Photographs for the two a guest goes and does, and rows for the two that
  are simply true now.

  Dining and the spa are places with real pictures. "Charge to room" and
  "Room services" are privileges, and the honest set has no photograph of
  either -- a stock folio or a folded towel standing in for them is
  decoration, and the picture would be doing less work than the words. So
  they keep a line each under the cards rather than being dressed as
  destinations.
*/
const PLACES = [
  { id: 'dining', label: 'Dining', detail: 'In-room and on property' },
  { id: 'spa', label: 'Spa & tours', detail: 'Book a time today' },
];

const PRIVILEGES = [
  { icon: <Receipt aria-hidden="true" />, label: 'Charge to room', detail: 'Settles at checkout' },
  { icon: <House aria-hidden="true" />, label: 'Room services', detail: 'Housekeeping and requests' },
];

/* The property itself -- the one image that is honestly about all of it. */
const BANNER = PROPERTY_IMAGE;

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
        <h1 className="unlocked__title">You&rsquo;re all set</h1>
        <p className="unlocked__subtitle">
          {roomNumber
            ? `Room ${roomNumber} is confirmed — every service on the property is open to you.`
            : 'Your stay is confirmed — every service on the property is open to you.'}
        </p>
        <Image className="unlocked__art" src={UNLOCKED_ART} alt="" width={330} height={230} priority />
      </div>

      <section className="unlocked__card unlocked__open">
        <div className="unlocked__banner">
          <Image src={BANNER.src} alt="" fill sizes="480px" style={{ objectPosition: BANNER.focalPoint }} />
          <span className="unlocked__banner-scrim" aria-hidden="true" />
          <div className="unlocked__banner-copy">
            <h2>What&rsquo;s open now</h2>
            <p>{roomNumber ? `Room ${roomNumber} · settles at checkout` : 'Settles at checkout'}</p>
          </div>
          <span className="unlocked__card-flag"><Check aria-hidden="true" />Unlocked</span>
        </div>

        <ul className="unlocked__tiles">
          {PLACES.map((item) => {
            const art = storyImage(item.id);
            return (
              <li key={item.label} className="unlocked__tile">
                <Image src={art.src} alt="" fill sizes="240px" style={{ objectPosition: art.focalPoint }} />
                <span className="unlocked__tile-scrim" aria-hidden="true" />
                <span className="unlocked__tile-copy">
                  <b>{item.label}</b>
                  <small>{item.detail}</small>
                </span>
              </li>
            );
          })}
        </ul>

        <ul className="unlocked__privileges">
          {PRIVILEGES.map((item) => (
            <li key={item.label}>
              <span className="unlocked__privilege-icon" aria-hidden="true">{item.icon}</span>
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
