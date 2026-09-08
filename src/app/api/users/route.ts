import type { NextRequest } from 'next/server';
import { usersApi } from '@/lib/api/users';
import { createUserSchema, listUsersQuerySchema } from '@/lib/validators/user';
import { ok, parseBody, parseQuery, route } from '@/lib/utils/http';

/**
 * BFF layer: validate input, delegate to `lib/api`, return the app's envelope.
 * No business logic, no fetch calls, no upstream URLs.
 */
export const GET = route(async (request: NextRequest) => {
  const { page, pageSize } = parseQuery(listUsersQuerySchema, request.url);
  const users = await usersApi.list({ page, pageSize });

  return ok(users);
});

export const POST = route(async (request: NextRequest) => {
  const input = await parseBody(createUserSchema, request);
  const user = await usersApi.create(input);

  return ok(user, { status: 201 });
});
