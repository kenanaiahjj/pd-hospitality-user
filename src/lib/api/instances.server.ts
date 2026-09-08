import 'server-only';

import { createApiClient } from './client';
import { serverEnv } from '@/config/env';

/**
 * Talks to the upstream/third-party API. Server-only: it carries the API token,
 * so it must never be imported from a Client Component. The `server-only`
 * import above makes this a build error, not just a convention, if it is ever
 * pulled into a client bundle.
 */
export const externalApi = createApiClient({
  baseUrl: process.env.API_BASE_URL ?? 'https://jsonplaceholder.typicode.com',
  headers: () => {
    const env = serverEnv();
    return {
      Accept: 'application/json',
      ...(env.API_TOKEN && { Authorization: `Bearer ${env.API_TOKEN}` }),
    };
  },
});
