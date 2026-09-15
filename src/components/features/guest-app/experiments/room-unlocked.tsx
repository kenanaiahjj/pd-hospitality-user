'use client';

import { ArrowRight, House, Receipt } from '@phosphor-icons/react';
import Image from 'next/image';
import type { ReactNode } from 'react';
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
  One list, one rhythm.

  This was a banner, then two photographic cards, then two rows in a tinted
  block inside the white card -- three weights stacked, and a surface nested
  in a surface, which DESIGN.md rules out on its own. The section was the
  least settled thing on the screen because nothing in it agreed on how big
  anything should be.

  Now every entry is the same row. The art slot is either a photograph or a
  tinted icon, which is how the two that have no honest picture -- billing
  and housekeeping are not places -- sit in the same rhythm as the two that
  do, instead of being demoted to a second treatment underneath them.
*/
const OPEN_NOW: Array<{
  label: string;
  detail: string;
  /** A catalogue id where a real photograph exists, an icon where it does not. */
  art: { photo: string } | { icon: ReactNode };
}> = [
  { label: 'Dining', detail: 'Room service or downstairs', art: { photo: 'dining' } },
  { label: 'Spa & tours', detail: 'Book a time today', art: { photo: 'spa' } },
  { label: 'Charge to room', detail: 'Settles at checkout', art: { icon: <Receipt aria-hidden="true" /> } },
  { label: 'Room services', detail: 'Housekeeping and requests', art: { icon: <House aria-hidden="true" /> } },
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
            ? `Room ${roomNumber} is confirmed. Everything at the hotel is open to you.`
            : 'Your stay is confirmed. Everything at the hotel is open to you.'}
        </p>
        <Image className="unlocked__art" src={UNLOCKED_ART} alt="" width={330} height={230} priority />
      </div>

      <section className="unlocked__card unlocked__open">
        <div className="unlocked__banner">
          <Image src={BANNER.src} alt="" fill sizes="480px" style={{ objectPosition: BANNER.focalPoint }} />
          <span className="unlocked__banner-scrim" aria-hidden="true" />
          <div className="unlocked__banner-copy">
            <h2>What&rsquo;s open now</h2>
            <p>{roomNumber ? `Billed to room ${roomNumber}, settled at checkout` : 'Settled at checkout'}</p>
          </div>
        </div>

        <ul className="unlocked__open-list">
          {OPEN_NOW.map((item) => (
            <li key={item.label}>
              <span className="unlocked__open-art" aria-hidden="true">
                {'photo' in item.art ? (
                  <Image
                    src={storyImage(item.art.photo).src}
                    alt=""
                    fill
                    sizes="104px"
                    style={{ objectPosition: storyImage(item.art.photo).focalPoint }}
                  />
                ) : (
                  <span className="unlocked__open-icon">{item.art.icon}</span>
                )}
              </span>
              <span className="unlocked__open-copy">
                <b>{item.label}</b>
                <small>{item.detail}</small>
              </span>
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
          Anything you book is added to your room and settles when you check out.
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
