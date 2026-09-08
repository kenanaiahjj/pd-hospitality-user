import { mutationOptions, queryOptions, type QueryClient } from '@tanstack/react-query';
import { userListSchema, userSchema } from '@/lib/validators/user';
import type { CreateUserInput, ListUsersParams } from '@/types/user';
import { bff } from './bff';

/**
 * Browser-side reads for the `users` resource.
 *
 * Three rules hold for every resource in this app:
 *   1. The key mirrors the URL — ['users', 'list', params] ↔ /api/users?…
 *      Params are always one object; TanStack hashes it order-independently.
 *   2. Key and fetcher are declared together, so a key cannot drift from the
 *      function that fills it.
 *   3. Invalidating `all()` reaches lists and details alike.
 *
 * The server-side twin of this file is `src/lib/api/users.ts`, which talks to
 * the upstream. This one only ever talks to our own route handlers.
 */
export const userQueries = {
  all: () => ['users'] as const,

  lists: () => [...userQueries.all(), 'list'] as const,

  list: (params: ListUsersParams = {}) =>
    queryOptions({
      queryKey: [...userQueries.lists(), params] as const,
      queryFn: () => bff('/api/users', { params, schema: userListSchema }),
    }),

  details: () => [...userQueries.all(), 'detail'] as const,

  detail: (id: number) =>
    queryOptions({
      queryKey: [...userQueries.details(), id] as const,
      queryFn: () => bff(`/api/users/${id}`, { schema: userSchema }),
    }),
};

/**
 * Mutations take the QueryClient and own their own invalidation, so forgetting
 * to invalidate means deliberately not using the factory. Invalidating `all()`
 * reaches both the lists and any cached detail.
 */
export const userMutations = {
  create: (queryClient: QueryClient) =>
    mutationOptions({
      mutationFn: (input: CreateUserInput) =>
        bff('/api/users', { method: 'POST', body: input, schema: userSchema }),
      onSuccess: () => queryClient.invalidateQueries({ queryKey: userQueries.all() }),
    }),
};
