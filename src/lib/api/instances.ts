import { createApiClient } from './client';
import { clientEnv } from '@/config/env';

/**
 * Talks to this app's own route handlers under `app/api` (the BFF layer).
 * Safe in the browser — relative URLs there, absolute when called on the server.
 * This module is imported from Client Components, so it must never construct
 * anything that touches `API_TOKEN` or `serverEnv()`. That code lives in
 * `instances.server.ts`, which is guarded by the `server-only` package so a
 * client bundle including it is a build error, not a silent leak.
 */
export const internalApi = createApiClient({
  baseUrl: typeof window === 'undefined' ? clientEnv.NEXT_PUBLIC_APP_URL : '',
  headers: { Accept: 'application/json' },
});
