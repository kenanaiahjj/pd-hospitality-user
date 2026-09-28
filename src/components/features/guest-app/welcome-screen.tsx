'use client';

import { Notice } from './guest-ui';
import type { AuthMethod } from './prototype-model';
import type { ServiceImageDefinition } from './service-images';
import { PROPERTY_IMAGES } from './service-images';
import { Button } from '@/components/ui';
import { CabanaFullLockup } from '@/components/ui/cabana-logo';
import { usePrefersReducedMotion } from '@/lib/hooks';
import { WifiSlash } from '@phosphor-icons/react';
import { useEffect, useRef, useState } from 'react';

import Image from 'next/image';
import type { PointerEvent as ReactPointerEvent } from 'react';
/*
  The welcome screen: rotating steps over full-bleed photography, then the
  ways in -- Apple, Google, or as a guest with a booking reference.
*/

/**
 * The property photographs are landscape, cropped here to fill a portrait
 * screen, so the frame needs far more source width than the column is wide.
 */
export const fullBleed = (image: ServiceImageDefinition, focalPoint: string): ServiceImageDefinition => ({
  ...image,
  src: image.src.replace(/([?&])w=\d+/, '$1w=2400'),
  focalPoint,
});

export const WELCOME_STEPS: { step: string; stage: string; title: string; photo: ServiceImageDefinition }[] = [
  {
    step: '01',
    stage: 'Before you arrive',
    title: 'Check in before arrival',
    // The infinity pool at dusk is the first frame a guest sees; no clip
    // on hand opens as well as it does.
    photo: fullBleed(PROPERTY_IMAGES.cebu, '66% 50%'),
  },
  {
    step: '02',
    stage: 'At the hotel',
    title: 'Skip the front desk paperwork',
    photo: fullBleed(PROPERTY_IMAGES.manila, '58% 50%'),
  },
  {
    step: '03',
    stage: 'During your stay',
    // Everything on the property -- dining, the spa, rentals -- goes on the room.
    title: 'Charge it all to your room',
    photo: fullBleed(PROPERTY_IMAGES.dumaguete, '50% 50%'),
  },
];

/** Dwell per step once the pager is rotating on its own. */
export const STEP_DWELL_MS = 4500;

/** The first step also has to outlast the splash, which runs 250ms + 1400ms. */
export const FIRST_STEP_DWELL_MS = 5900;

export const SWIPE_THRESHOLD_PX = 40;

/**
 * The artwork and the step copy sit in different places on the screen -- the
 * art high up, the copy down against the action -- so the index lives here
 * rather than inside either one.
 */
export function useWelcomePager() {
  const [index, setIndex] = useState(0);
  /**
   * Autoplay is a courtesy, not a control. The moment the guest drives the
   * pager -- swipe, dot, or keyboard focus -- it hands over for good and never
   * pulls the step out from under them again.
   */
  const [engaged, setEngaged] = useState(false);
  const reducedMotion = usePrefersReducedMotion();
  const dragOrigin = useRef<number | null>(null);

  useEffect(() => {
    if (engaged || reducedMotion) return;
    // setState inside the timer, never in the effect body -- see use-debounce.
    const timer = setTimeout(
      () => setIndex((current) => (current + 1) % WELCOME_STEPS.length),
      index === 0 ? FIRST_STEP_DWELL_MS : STEP_DWELL_MS,
    );
    return () => clearTimeout(timer);
  }, [engaged, reducedMotion, index]);

  /** Autoplay wraps; a deliberate swipe clamps, so the ends feel like ends. */
  function show(next: number) {
    setEngaged(true);
    setIndex(Math.min(WELCOME_STEPS.length - 1, Math.max(0, next)));
  }

  return {
    index,
    show,
    engaged: engaged || reducedMotion,
    engage: () => setEngaged(true),
    /**
     * Only ever spread onto the artwork. On the whole column a drag that
     * started on the action button would page the pager and fire the button.
     */
    swipe: {
      onPointerDown: (event: ReactPointerEvent<HTMLElement>) => {
        dragOrigin.current = event.clientX;
      },
      onPointerUp: (event: ReactPointerEvent<HTMLElement>) => {
        const origin = dragOrigin.current;
        dragOrigin.current = null;
        if (origin === null) return;
        const deltaX = event.clientX - origin;
        if (Math.abs(deltaX) < SWIPE_THRESHOLD_PX) return;
        show(index + (deltaX < 0 ? 1 : -1));
      },
      onPointerCancel: () => { dragOrigin.current = null; },
    },
  };
}

export type PagerHandle = ReturnType<typeof useWelcomePager>;

/**
 * `transform`, not the standalone `translate` property: that one computes to
 * nothing in some engines, which leaves the dots advancing while the artwork
 * sits still.
 */
export const trackOffset = (index: number) => ({ transform: `translateX(${index * -100}%)` });

/**
 * Decorative: every step's meaning is carried by its copy further down.
 *
 * The frames cross-fade in place rather than slide -- a photo sliding
 * sideways reads as a carousel, a dissolve as a title sequence. All three
 * load behind the splash so a step change never waits on the network.
 */
export function WelcomeArt({ index }: Pick<PagerHandle, 'index'>) {

  return (
    <div className="guest-welcome__art" aria-hidden="true">
      <div className="guest-welcome__art-track">
        {WELCOME_STEPS.map((item, position) => (
          <span key={item.step} className={`guest-welcome__art-frame${position === index ? ' is-active' : ''}`}>
            <Image
              className="guest-welcome__still"
              src={item.photo.src}
              alt=""
              fill
              // Cover-cropped from landscape: about three columns of width.
              sizes="(max-width: 480px) 330vw, 1600px"
              style={{ objectPosition: item.photo.focalPoint }}
              {...(position === 0 ? { priority: true } : { loading: 'eager' as const })}
            />
          </span>
        ))}
      </div>
      {/* Legibility, bottom up: a tint, a scrim, a progressive blur, and grain
          so the flat gradients do not band. */}
      <span className="guest-welcome__scrim" />
      <span className="guest-welcome__blur" />
      <span className="guest-welcome__grain" />
    </div>
  );
}

/**
 * Segments rather than dots: while the pager rotates on its own, the current
 * one fills over its dwell, so the guest can see when the next step is due.
 * Once they take over, the current segment simply sits full.
 */
export function WelcomeDots({ index, show, engaged }: Pick<PagerHandle, 'index' | 'show' | 'engaged'>) {
  return (
    <div className={`guest-welcome__dots${engaged ? ' is-engaged' : ''}`}>
      {WELCOME_STEPS.map((item, position) => (
        <button
          key={item.step}
          type="button"
          aria-label={`Step ${item.step}: ${item.title}`}
          aria-current={position === index ? 'step' : undefined}
          className={position < index ? 'is-done' : undefined}
          onClick={() => show(position)}
        >
          <span aria-hidden="true">
            <i
              // Keyed on the index so the fill restarts every time a step comes round.
              key={position === index ? `fill-${index}` : 'idle'}
              style={{ animationDuration: `${index === 0 ? FIRST_STEP_DWELL_MS : STEP_DWELL_MS}ms` }}
            />
          </span>
        </button>
      ))}
    </div>
  );
}

/** The real content of the pager, and the screen's only body copy. */
export function WelcomeStepCopy({ index }: Pick<PagerHandle, 'index'>) {
  return (
    <div className="guest-welcome__steps">
      <ol className="guest-welcome__steps-track" style={trackOffset(index)}>
        {WELCOME_STEPS.map((item, position) => (
          <li key={item.step} className="guest-welcome__step" aria-hidden={position !== index}>
            <p className="guest-welcome__step-title">{item.title}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}

/* Email sign-in is built (sign-in -> OTP) but off for now: the welcome
   screen leads with single sign-on and the guest path. Flip to bring it back. */
export const EMAIL_SIGN_IN = false;

export function WelcomeScreen({
  online,
  onSso,
  onEmailLogin,
  onGuestLogin,
}: {
  online: boolean;
  onSso: (method: AuthMethod) => void;
  onEmailLogin: () => void;
  onGuestLogin: () => void;
}) {
  const pager = useWelcomePager();

  return (
    <section className="guest-welcome" aria-labelledby="guest-welcome-title">
      <div className="guest-welcome__splash" aria-hidden="true">
        <CabanaFullLockup className="guest-welcome__splash-brand" markWidth={92} />
      </div>
      <WelcomeArt index={pager.index} />
      <div className="guest-welcome__content" onFocus={pager.engage}>
        <CabanaFullLockup className="guest-welcome__brand" markWidth={44} />
        {/*
          The rotating step copy took this slot, so the heading goes to screen
          readers only. It stays in the tree because the screen still needs one
          stable accessible name -- a heading that changed every 4.5s would not
          be one.
        */}
        <h1 id="guest-welcome-title" className="sr-only">Welcome to your stay</h1>
        {/* The open middle of the screen is where a thumb pages the steps;
            the art behind it is out of reach under the content layer. */}
        <div className="guest-welcome__swipe" {...pager.swipe} />
        <div className="guest-welcome__message">
          <WelcomeStepCopy index={pager.index} />
          <WelcomeDots index={pager.index} show={pager.show} engaged={pager.engaged} />
          {!online ? <Notice tone="offline" icon={<WifiSlash />} title="Log in needs a connection">Reconnect to continue.</Notice> : null}
          <div className="guest-welcome__actions" role="group" aria-label="Ways to continue">
            {/*
              Apple and Google alike: both are single sign-on, and neither
              should read as the lesser choice. Stacked, because "Continue
              with ..." does not fit two to a row on a phone.
            */}
            <div className="guest-welcome__sso">
              <Button
                className="guest-button guest-button--secondary guest-welcome__login-button guest-welcome__login-button--solid"
                type="button"
                disabled={!online}
                onClick={() => onSso('apple')}
              >
                <Image src="/brand/apple.svg" width={20} height={20} alt="" aria-hidden="true" className="guest-welcome__login-logo" />
                Continue with Apple
              </Button>
              <Button
                className="guest-button guest-button--secondary guest-welcome__login-button guest-welcome__login-button--solid"
                type="button"
                disabled={!online}
                onClick={() => onSso('google')}
              >
                <Image src="/brand/google-g.png" width={200} height={204} alt="" aria-hidden="true" className="guest-welcome__login-logo guest-welcome__login-logo--google" />
                Continue with Google
              </Button>
            </div>
            <p className="guest-welcome__alt">
              {EMAIL_SIGN_IN ? (
                <>
                  <Button className="guest-welcome__guest-link" variant="ghost" type="button" disabled={!online} onClick={onEmailLogin}>
                    Use email
                  </Button>
                  <span aria-hidden="true">·</span>
                </>
              ) : null}
              <Button className="guest-welcome__guest-link" variant="ghost" type="button" disabled={!online} onClick={onGuestLogin}>
                Continue as guest
              </Button>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
