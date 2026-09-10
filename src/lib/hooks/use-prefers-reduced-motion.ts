'use client';

import { useSyncExternalStore } from 'react';

const QUERY = '(prefers-reduced-motion: reduce)';

/**
 * Subscribes to the OS motion preference.
 *
 * `useSyncExternalStore` rather than `useState` + `useEffect` on purpose: the
 * compiler rules here treat a `setState` in an effect body as an error, and
 * reading `matchMedia` during render would both be a side effect and mismatch
 * on hydration. This has neither problem and still re-renders when the
 * preference changes mid-session.
 */
function subscribe(onChange: () => void) {
  const list = window.matchMedia(QUERY);
  list.addEventListener('change', onChange);
  return () => list.removeEventListener('change', onChange);
}

const getSnapshot = () => window.matchMedia(QUERY).matches;

/** The server cannot know the preference, so it renders as "no preference". */
const getServerSnapshot = () => false;

export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
