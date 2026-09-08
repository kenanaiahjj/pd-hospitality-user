import { z } from 'zod';
import { usersApi } from '@/lib/api/users';
import { ok, route } from '@/lib/utils/http';
import { ApiError } from '@/lib/api/errors';

const paramsSchema = z.object({ id: z.coerce.number().int().positive() });

/** Route params are async in the App Router — always await them. */
export const GET = route(async (_request: Request, context: { params: Promise<{ id: string }> }) => {
  const parsed = paramsSchema.safeParse(await context.params);
  if (!parsed.success) {
    throw new ApiError({ message: 'Invalid user id', status: 400 });
  }

  return ok(await usersApi.byId(parsed.data.id));
});
