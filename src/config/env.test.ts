import { afterEach, describe, expect, it, vi } from 'vitest';

/**
 * `clientEnv` is parsed once at module load, so each case needs a fresh
 * module registry rather than a re-read of the same frozen object.
 */
async function loadClientEnv() {
  vi.resetModules();
  return (await import('./env')).clientEnv;
}

describe('clientEnv.NEXT_PUBLIC_APP_URL', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it('prefers an explicit value over the deployment host', async () => {
    vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://pd-hospitality-user.vercel.app');
    vi.stubEnv('VERCEL_URL', 'pd-hospitality-user-n7o4blnql.vercel.app');

    const env = await loadClientEnv();

    expect(env.NEXT_PUBLIC_APP_URL).toBe('https://pd-hospitality-user.vercel.app');
  });

  it('derives the origin from VERCEL_URL when no explicit value is set', async () => {
    vi.stubEnv('NEXT_PUBLIC_APP_URL', '');
    vi.stubEnv('VERCEL_URL', 'pd-hospitality-user-n7o4blnql.vercel.app');

    const env = await loadClientEnv();

    expect(env.NEXT_PUBLIC_APP_URL).toBe('https://pd-hospitality-user-n7o4blnql.vercel.app');
  });

  it('falls back to localhost off-platform', async () => {
    vi.stubEnv('NEXT_PUBLIC_APP_URL', '');
    vi.stubEnv('VERCEL_URL', '');

    const env = await loadClientEnv();

    expect(env.NEXT_PUBLIC_APP_URL).toBe('http://localhost:3000');
  });
});
