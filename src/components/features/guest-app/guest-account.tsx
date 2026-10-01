'use client';

import Image from 'next/image';
import { Button } from '@/components/ui';
import type { AuthMethod } from './prototype-model';

/*
  The one ask a guest gets: turn this phone's booking into an account. Same
  two single sign-ons as the welcome screen, so it is one tap, and it keeps
  everything the guest already has -- the stay, its charges and payments.
  Shown on a guest's Profile, and where an account is needed to go on.
*/
export function AccountSignInCard({ title, text, points, onSignIn, online = true }: {
  title: string;
  text: string;
  points?: string[];
  onSignIn: (method: AuthMethod) => void;
  online?: boolean;
}) {
  return (
    <section className="guest-account-card" aria-label={title}>
      <h2>{title}</h2>
      <p>{text}</p>
      {points?.length ? <ul>{points.map((point) => <li key={point}>{point}</li>)}</ul> : null}
      <div className="guest-account-card__sso">
        <Button className="guest-button guest-button--secondary guest-welcome__login-button" type="button" disabled={!online} onClick={() => onSignIn('apple')}>
          <Image src="/brand/apple.svg" width={20} height={20} alt="" aria-hidden="true" className="guest-welcome__login-logo" />
          Continue with Apple
        </Button>
        <Button className="guest-button guest-button--secondary guest-welcome__login-button" type="button" disabled={!online} onClick={() => onSignIn('google')}>
          <Image src="/brand/google-g.png" width={200} height={204} alt="" aria-hidden="true" className="guest-welcome__login-logo guest-welcome__login-logo--google" />
          Continue with Google
        </Button>
      </div>
    </section>
  );
}
