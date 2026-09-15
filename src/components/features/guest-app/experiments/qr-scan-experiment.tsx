'use client';

import { ArrowRight, QrCode } from '@phosphor-icons/react';
import Image from 'next/image';
import { useState } from 'react';
import { Button } from '@/components/ui';
import { ExploreExperiment } from './explore-experiment';
import { RoomScanner } from './room-scanner';
import { RoomUnlocked } from './room-unlocked';

/*
  The harness, and the only throwaway file of the three.

  `RoomScanner` and `RoomUnlocked` are the candidates -- written to props the
  guest app can already supply. This stands in for the app while they are
  being iterated on: it owns the stage, and hands them demo callbacks where
  the real flow would hand them `scanRoomCode`, `back` and `go('marketplace')`.

  When a flow is judged good, this file is what gets deleted.
*/

/*
  Cabana's real printed code. A phone pointed at the screen can read this one,
  which the drawn fallback in `qr-code-graphic.tsx` cannot -- that one matches
  the house style but encodes nothing.
*/
const ROOM_CODE_SRC = '/illustrations/cabana-qr.png';

type Stage = 'closed' | 'scanning' | 'unlocked' | 'discover';

export function QrScanExperiment() {
  const [stage, setStage] = useState<Stage>('closed');
  const [autoDetect, setAutoDetect] = useState(true);

  if (stage === 'scanning') {
    return (
      <RoomScanner
        roomNumber="304"
        codeImageSrc={ROOM_CODE_SRC}
        autoDetectMs={autoDetect ? 2000 : null}
        onDetected={() => setStage('unlocked')}
        onCancel={() => setStage('closed')}
        onPickFromPhotos={() => setStage('unlocked')}
      />
    );
  }

  /*
    The point of the unlock. `Explore` on the success screen is the handoff
    into discovery -- scan, open, then scroll -- so the harness plays the
    whole journey rather than dropping back to its own start screen.

    Reuses the discovery harness whole, so the two candidates stay one
    implementation and cannot drift into two.
  */
  if (stage === 'discover') return <ExploreExperiment autoplayIntro />;

  if (stage === 'unlocked') {
    return (
      <RoomUnlocked
        roomNumber="304"
        onExplore={() => setStage('discover')}
        onViewStay={() => setStage('closed')}
      />
    );
  }

  /*
    The screen a guest would actually meet, with the demo controls demoted
    beneath a rule.

    This used to open on "Two candidate screens: the scanner sheet, and what
    a successful scan opens onto" over a raw checkbox -- a page about the
    experiment rather than a page in it. The first screen of a flow sets what
    the rest is judged against, and a dev harness at the front makes
    everything behind it read as one too.
  */
  return (
    <div className="scan-intro">
      <div className="scan-intro__art">
        <Image src="/illustrations/room-qr.png" alt="" width={300} height={205} priority />
      </div>

      <div className="scan-intro__copy">
        <h1>Scan the code in your room</h1>
        <p>
          It&rsquo;s on the desk card. Scanning confirms you&rsquo;re in the room, which is what
          opens dining, the spa, and charging to your room.
        </p>
      </div>

      <div className="scan-intro__dock">
        <Button className="guest-button guest-button--primary" type="button" onClick={() => setStage('scanning')}>
          <QrCode aria-hidden="true" />Open the scanner<ArrowRight aria-hidden="true" />
        </Button>
        {/* The desk can grant it instead -- the model has
            `requestFrontDeskUnlock` for exactly this, and a guest who cannot
            scan needs to see a way through before they need it. */}
        <p className="scan-intro__alt">Can&rsquo;t scan? The front desk can unlock it for you.</p>
      </div>

      <div className="scan-intro__demo">
        <h2>Demo controls</h2>
        <button className="scan-intro__demo-link" type="button" onClick={() => setStage('unlocked')}>
          Skip to the success screen
        </button>
        <label className="scan-intro__switch">
          <input
            type="checkbox"
            role="switch"
            checked={autoDetect}
            onChange={() => setAutoDetect((on) => !on)}
          />
          <span aria-hidden="true" />
          Auto-detect after 2s
        </label>
      </div>
    </div>
  );
}
