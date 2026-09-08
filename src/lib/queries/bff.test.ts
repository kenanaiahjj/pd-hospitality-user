import { beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { ApiError } from '@/lib/api/errors';

const { get, post } = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn() }));

vi.mock('@/lib/api/instances', () => ({
  internalApi: { get, post, put: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));

import { bff } from './bff';

const schema = z.object({ id: z.number() });

beforeEach(() => {
  get.mockReset();
  post.mockReset();
});

describe('bff', () => {
  it('unwraps the data envelope and validates the payload', async () => {
    get.mockResolvedValue({ data: { id: 7 } });

    await expect(bff('/api/things/7', { schema })).resolves.toEqual({ id: 7 });
    expect(get).toHaveBeenCalledWith('/api/things/7', { params: undefined, body: undefined });
  });

  it('throws 502 invalid_response when the payload does not match its schema', async () => {
    get.mockResolvedValue({ data: { id: 'seven' } });

    const error = await bff('/api/things/7', { schema }).catch((cause: unknown) => cause);

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 502, code: 'invalid_response' });
  });

  it('throws 502 invalid_response when the envelope carries no data key', async () => {
    get.mockResolvedValue({});

    const error = await bff('/api/things/7', { schema }).catch((cause: unknown) => cause);

    expect(error).toMatchObject({ status: 502, code: 'invalid_response' });
  });

  it('routes a POST through internalApi.post with the body', async () => {
    post.mockResolvedValue({ data: { id: 8 } });

    await expect(
      bff('/api/things', { method: 'POST', body: { id: 8 }, schema }),
    ).resolves.toEqual({ id: 8 });
    expect(post).toHaveBeenCalledWith('/api/things', { params: undefined, body: { id: 8 } });
  });

  it('lets an ApiError from the client through untouched', async () => {
    get.mockRejectedValue(
      new ApiError({ message: 'Invalid request body', status: 422, code: 'validation_error' }),
    );

    const error = await bff('/api/things', { schema }).catch((cause: unknown) => cause);

    expect(error).toMatchObject({ status: 422, code: 'validation_error' });
  });
});
