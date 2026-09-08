import 'server-only';

import { userListSchema, userSchema } from '@/lib/validators/user';
import type { CreateUserInput, User } from '@/types/user';
import { externalApi } from './instances.server';

/**
 * Typed access to the upstream `users` resource. Server-only.
 * Route handlers and Server Components call these; components never call fetch directly.
 */
export const usersApi = {
  list(options: { page?: number; pageSize?: number } = {}): Promise<User[]> {
    return externalApi.get('/users', {
      params: { _page: options.page, _limit: options.pageSize },
      schema: userListSchema,
      next: { revalidate: 60, tags: ['users'] },
    });
  },

  byId(id: number): Promise<User> {
    return externalApi.get(`/users/${id}`, {
      schema: userSchema,
      next: { revalidate: 60, tags: ['users', `user:${id}`] },
    });
  },

  create(input: CreateUserInput): Promise<User> {
    return externalApi.post('/users', {
      body: input,
      schema: userSchema,
      cache: 'no-store',
    });
  },
};
