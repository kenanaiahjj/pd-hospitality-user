'use client';

import { X } from '@phosphor-icons/react';
import { useEffect, useRef } from 'react';

import { BadgeMedal } from './badge-medal';
import type { BadgeProgress } from './badge-model';

/*
  One badge, and the case for it.

  A badge derived from spend is a profile, and a profile that appears
  unannounced reads as surveillance however flattering it is. So the sheet
  leads with the bookings behind the inference and offers the guest a way to
  say no -- which makes it something they can argue with rather than a verdict
  handed down.

  The correction has to be real. Muting removes the badge from derivation
  entirely rather than hiding it in a view, so it stays gone across a reload
  and cannot quietly keep counting.

  A native <dialog> opened with showModal(), like the filter sheet: the top
  layer escapes the device frame's overflow, and focus trapping, Escape and
  inertness behind come with it rather than being rebuilt.
*/

export type BadgeSheetProps = {
  row: BadgeProgress;
  onMute: (badgeId: string) => void;
  onClose: () => void;
};

export function BadgeSheet({ row, onMute, onClose }: BadgeSheetProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const { definition, count, earned, evidence } = row;
  const remaining = definition.threshold - count;

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog || dialog.open) return;
    dialog.showModal();
  }, []);

  return (
    <dialog
      ref={ref}
      className="guest-sheet badge-sheet"
      aria-labelledby="badge-sheet-title"
      onClose={onClose}
      onClick={(event) => { if (event.target === ref.current) ref.current?.close(); }}
    >
      <div className="guest-sheet__panel">
        <span className="guest-sheet__grip" aria-hidden="true" />

        <div className="badge-sheet__head">
          <BadgeMedal badge={definition} earned={earned} size={64} />
          <h2 id="badge-sheet-title">{definition.name}</h2>
          <p>{definition.requirement}</p>
          <button
            type="button"
            className="badge-sheet__close"
            aria-label="Close"
            onClick={() => ref.current?.close()}
          >
            <X aria-hidden="true" />
          </button>
        </div>

        <div className="guest-sheet__body">
          {earned ? (
            <>
              <h3 className="badge-sheet__why">Why you have this</h3>
              <ul className="badge-sheet__evidence">
                {evidence.map((line, index) => (
                  <li key={`${line}-${index}`}>{line}</li>
                ))}
              </ul>
            </>
          ) : (
            <div className="badge-sheet__progress">
              <b>{count} of {definition.threshold}</b>
              <p>
                {remaining === 1
                  ? 'Just one more and this is yours.'
                  : `${remaining} more and this is yours.`}
              </p>
              {evidence.length ? (
                <ul className="badge-sheet__evidence">
                  {evidence.map((line, index) => <li key={`${line}-${index}`}>{line}</li>)}
                </ul>
              ) : null}
            </div>
          )}

          {/*
            On the badge itself, not buried in a settings screen. A correction
            the guest has to go looking for is not one they were offered.
          */}
          <button
            type="button"
            className="badge-sheet__mute"
            onClick={() => { onMute(definition.id); ref.current?.close(); }}
          >
            Not right? Turn this off
          </button>
        </div>
      </div>
    </dialog>
  );
}
