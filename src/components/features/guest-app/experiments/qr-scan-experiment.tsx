'use client';

import { ArrowRight, QrCode } from '@phosphor-icons/react';
import { useState } from 'react';
import { Button } from '@/components/ui';
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
  Cabana's real printed code, once it is in the repo.

  Save the PNG to `public/illustrations/room-code.png` and set this to
  '/illustrations/room-code.png'. Until then the frame draws a synthetic code
  that matches the house style but encodes nothing -- fine to look at, not
  something a phone can read.
*/
const ROOM_CODE_SRC: string | undefined = undefined;

type Stage = 'closed' | 'scanning' | 'unlocked';

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

  if (stage === 'unlocked') {
    return (
      <RoomUnlocked
        roomNumber="304"
        onExplore={() => setStage('closed')}
        onViewStay={() => setStage('closed')}
      />
    );
  }

  return (
    <div className="guest-stack guest-stack--intro">
      <div className="guest-page-title">
        <h1>Room code</h1>
        <p>Two candidate screens: the scanner sheet, and what a successful scan opens onto.</p>
      </div>

      <Button className="guest-button guest-button--primary" type="button" onClick={() => setStage('scanning')}>
        <QrCode aria-hidden="true" />Open the scanner<ArrowRight aria-hidden="true" />
      </Button>
      <button className="guest-button guest-button--secondary" type="button" onClick={() => setStage('unlocked')}>
        Jump to the success screen
      </button>

      <label className="experiment-toggle">
        <input type="checkbox" checked={autoDetect} onChange={() => setAutoDetect((on) => !on)} />
        Auto-detect after 2s
      </label>
    </div>
  );
}
