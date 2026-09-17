'use client';

import { Image as ImageIcon, X } from '@phosphor-icons/react';
import NextImage from 'next/image';
import { useEffect, useRef } from 'react';
import { QrCodeGraphic } from './qr-code-graphic';

/*
  A candidate replacement for the guest app's `scan-room-code` screen.

  Written to a props contract the real flow can already satisfy, because the
  point of an experiment here is to be promotable: `onDetected` is
  `scanRoomCode`, `onCancel` is `back`, `roomNumber` is
  `primaryBooking?.roomNumber`. Promotion is an import and four props, not a
  rewrite -- so nothing about this component may reach for a session, a
  screen id, or the prototype's controls.
*/

export type RoomScannerProps = {
  /** Shown in the hint line. Absent while the property has not allocated one. */
  roomNumber?: string;
  /** A code was read. In the app this proves presence and opens the gate. */
  onDetected: () => void;
  onCancel: () => void;
  /** Choosing a photo instead of pointing a camera. Omit to hide the control. */
  onPickFromPhotos?: () => void;
  /**
   * How long the mock camera takes to "see" a code, or `null` to wait for a
   * real one. A production scanner passes `null` and calls `onDetected` from
   * its decoder.
   */
  autoDetectMs?: number | null;
  /**
   * A real code image to show inside the frame, for a demo someone should be
   * able to point an actual phone at. Without it the frame draws a synthetic
   * code, which looks right but encodes nothing.
   */
  codeImageSrc?: string;
};

export function RoomScanner({
  roomNumber,
  onDetected,
  onCancel,
  onPickFromPhotos,
  autoDetectMs = 2000,
  codeImageSrc,
}: RoomScannerProps) {
  /*
    Through a ref, armed once. `onDetected` is rebuilt on every parent render,
    so depending on it directly would restart the countdown forever and the
    scan would never fire.
  */
  const onDetectedRef = useRef(onDetected);
  useEffect(() => {
    onDetectedRef.current = onDetected;
  }, [onDetected]);

  useEffect(() => {
    if (autoDetectMs === null) return;
    const timer = window.setTimeout(() => onDetectedRef.current(), autoDetectMs);
    return () => window.clearTimeout(timer);
  }, [autoDetectMs]);

  return (
    <div className="scanner" data-testid="room-scanner">
      <span className="scanner__handle" aria-hidden="true" />

      <h1 className="scanner__title">Place QR code in the frame</h1>

      <div className="scanner__viewport">
        {/* Stands in for the camera feed. A real one replaces this node. */}
        <div className="scanner__feed" aria-hidden="true" />
        {codeImageSrc
          ? <NextImage className="scanner__code" src={codeImageSrc} alt="QR code" width={230} height={230} />
          : <QrCodeGraphic className="scanner__code" />}
        {/* One slow sweep, so the frame reads as looking rather than as a
            picture of a scanner. Stilled under reduced motion. */}
        <span className="scanner__sweep" aria-hidden="true" />
        <span className="scanner__bracket scanner__bracket--tl" aria-hidden="true" />
        <span className="scanner__bracket scanner__bracket--tr" aria-hidden="true" />
        <span className="scanner__bracket scanner__bracket--bl" aria-hidden="true" />
        <span className="scanner__bracket scanner__bracket--br" aria-hidden="true" />
      </div>

      <p className="scanner__hint">
        {roomNumber ? `The code is on the desk card in room ${roomNumber}.` : 'The code is on your desk card.'}
      </p>

      <div className="scanner__actions">
        {onPickFromPhotos ? (
          <button className="scanner__button" type="button" onClick={onPickFromPhotos} aria-label="Choose a photo instead">
            <ImageIcon aria-hidden="true" />
          </button>
        ) : <span />}
        <button className="scanner__button" type="button" onClick={onCancel} aria-label="Close scanner">
          <X aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
