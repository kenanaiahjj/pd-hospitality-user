import { QueryClient, hashKey } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { get } = vi.hoisted(() => ({ get: vi.fn() }));

vi.mock('@/lib/api/instances', () => ({
  internalApi: { get, post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));

import { userQueries } from './users';

const ada = { id: 1, name: 'Ada Lovelace', email: 'ada@example.com' };

beforeEach(() => {
  get.mockReset();
});

describe('userQueries keys', () => {
  it('nests every key under the resource root', () => {
    expect(userQueries.list().queryKey.slice(0, 1)).toEqual(['users']);
    expect(userQueries.detail(1).queryKey.slice(0, 1)).toEqual(['users']);
  });

  it('separates lists from details', () => {
    expect(hashKey(userQueries.list().queryKey)).not.toBe(
      hashKey(userQueries.detail(1).queryKey),
    );
  });

  it('gives different params different keys', () => {
    expect(hashKey(userQueries.list({ page: 1 }).queryKey)).not.toBe(
      hashKey(userQueries.list({ page: 2 }).queryKey),
    );
  });

  it('is insensitive to param key order', () => {
    expect(hashKey(userQueries.list({ page: 1, pageSize: 10 }).queryKey)).toBe(
      hashKey(userQueries.list({ pageSize: 10, page: 1 }).queryKey),
    );
  });
});

describe('userQueries fetchers', () => {
  it('reads the list through /api/users with its params', async () => {
    get.mockResolvedValue({ data: [ada] });

    await expect(
      new QueryClient().fetchQuery(userQueries.list({ pageSize: 1 })),
    ).resolves.toEqual([ada]);
    expect(get).toHaveBeenCalledWith('/api/users', {
      params: { pageSize: 1 },
      body: undefined,
    });
  });

  it('reads one user through /api/users/:id', async () => {
    get.mockResolvedValue({ data: ada });

    await expect(new QueryClient().fetchQuery(userQueries.detail(1))).resolves.toEqual(ada);
    expect(get).toHaveBeenCalledWith('/api/users/1', { params: undefined, body: undefined });
  });
});
