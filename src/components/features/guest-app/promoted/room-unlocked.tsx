'use client';

import { ArrowRight, Barbell, CaretRight, House } from '@phosphor-icons/react';
import Image from 'next/image';
import type { ReactNode } from 'react';
import { Button } from '@/components/ui';
import { RoomKey } from '../stay-invitation';
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
  The one graphic on the stage: the room key, a pearl card in the stay
  pass's family, so the two moments that make a stay the guest's -- the
  booking confirmed, the room scanned -- share one object. It replaced a
  flat pink glass illustration that matched nothing else in the app.
*/

export type RoomUnlockedProps = {
  roomNumber?: string;
  property?: string;
  /** Unused since the key card carries the dates; kept so callers need not change. */
  checkOut?: string;
  /** Printed on the key. */
  guestName?: string;
  dates?: string;
  onExplore: () => void;
  onViewStay: () => void;
  /** Opens what a tile names; tiles without a handler fall back to Explore. */
  onOpen?: (target: OpenNowTarget) => void;
  /**
   * Points the scan itself earned.
   *
   * Said here rather than on a later screen because this is the moment it
   * happened, and because the scan is the one earn that costs the property
   * nothing and saves it real time at the desk.
   */
  earned?: number;
};

/*
  What the scan opened, as places to go rather than a menu to read: the
  three with a real photograph as photo tiles, the two without (a gym and
  housekeeping are not views) as compact rows, and charging to the room --
  which is not a place at all -- as the line under them. Every entry opens
  where it says.
*/
export type OpenNowTarget = 'dining' | 'spa' | 'pool' | 'fitness' | 'housekeeping';

const OPEN_PHOTOS: Array<{ id: OpenNowTarget; label: string; detail: string; photo: string }> = [
  { id: 'dining', label: 'Dining', detail: 'To your room or downstairs', photo: 'dining' },
  { id: 'spa', label: 'Spa & tours', detail: 'Book a time today', photo: 'spa' },
  { id: 'pool', label: 'Pool & deck', detail: 'Open until 10:00 PM', photo: 'pool' },
];
const OPEN_ROWS: Array<{ id: OpenNowTarget; label: string; detail: string; icon: ReactNode }> = [
  { id: 'fitness', label: 'Fitness', detail: 'Open 24 hours', icon: <Barbell aria-hidden="true" /> },
  { id: 'housekeeping', label: 'Housekeeping', detail: 'Ask the front desk', icon: <House aria-hidden="true" /> },
];

/* The property itself -- the one image that is honestly about all of it. */
const BANNER = PROPERTY_IMAGE;

export function RoomUnlocked({
  roomNumber,
  property = 'The Henry Manila',
  guestName,
  dates,
  onExplore,
  onViewStay, onOpen, earned }: RoomUnlockedProps) {
  const open = (target: OpenNowTarget) => (onOpen ? onOpen(target) : onExplore());
  return (
    <div className="unlocked" data-testid="room-unlocked">
      <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        Room connected. {roomNumber
          ? `On-property services are now available and can be charged to Room ${roomNumber}.`
          : 'On-property services are now available and can be charged to your room.'}
      </p>
      {/*
        The stage: a graphic, what happened, and the single thing to do next.

        No tab rail underneath it -- see the CSS -- because this is a
        terminal moment and the rail only offers ways out of it.
      */}
      <section className="unlocked__stage">
        <Confetti />

        <RoomKey
          property={property}
          roomNumber={roomNumber}
          guestName={guestName}
          dates={dates}
          art={<Image src={BANNER.src} alt="" fill sizes="340px" priority style={{ objectPosition: BANNER.focalPoint }} />}
        />

        {/* Editorial, left-aligned: a welcome, what happened, and one line on what it means. */}
        <div className="unlocked__say">
          <p className="unlocked__eyebrow">Welcome to {property}</p>
          {/* Never "checked in": the scan proves presence, and check-in is the desk's, against the property's PMS. */}
          <h1 className="unlocked__title">You&rsquo;re all set</h1>
          <p className="unlocked__subtitle">
            Everything you book now goes on {roomNumber ? `Room ${roomNumber}` : 'your room'}.
          </p>
          {earned ? (
            // A line on the receipt, not a sticker: the reward, and that it landed.
            <p className="unlocked__reward">
              <span className="unlocked__reward-star" aria-hidden="true">✦</span>
              <b>+{earned.toLocaleString('en-US')} points</b>
              <span>Added</span>
            </p>
          ) : null}
        </div>

        <div className="unlocked__go">
          <Button className="guest-button guest-button--primary" type="button" onClick={onExplore}>
            Start exploring<ArrowRight aria-hidden="true" />
          </Button>
          <button className="unlocked__quiet" type="button" onClick={onViewStay}>
            Back to my stay
          </button>
        </div>
      </section>

      <section className="unlocked__open" aria-labelledby="unlocked-open-title">
        <div className="unlocked__open-head">
          <h2 id="unlocked-open-title">What&rsquo;s open now</h2>
          <button type="button" onClick={onExplore}>See all<CaretRight aria-hidden="true" /></button>
        </div>
        <div className="unlocked__open-grid">
          {OPEN_PHOTOS.map((item) => (
            <button key={item.id} type="button" className="unlocked__tile" onClick={() => open(item.id)}>
              <span className="unlocked__tile-photo" aria-hidden="true">
                <Image src={storyImage(item.photo).src} alt="" fill sizes="200px" style={{ objectPosition: storyImage(item.photo).focalPoint }} />
              </span>
              <b>{item.label}</b>
              <small>{item.detail}</small>
            </button>
          ))}
          <div className="unlocked__tile-rows">
            {OPEN_ROWS.map((item) => (
              <button key={item.id} type="button" className="unlocked__tile-row" onClick={() => open(item.id)}>
                <span className="unlocked__tile-icon" aria-hidden="true">{item.icon}</span>
                <span><b>{item.label}</b><small>{item.detail}</small></span>
              </button>
            ))}
          </div>
        </div>
        <p className="unlocked__open-note">
          Nothing to pay now. It all settles at check-out.
        </p>
      </section>


    </div>
  );
}
