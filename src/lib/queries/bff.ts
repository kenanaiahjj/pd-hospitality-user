import type { ZodType } from 'zod';
import { ApiError } from '@/lib/api/errors';
import { internalApi } from '@/lib/api/instances';
import type { ApiResponse } from '@/types/api';

export interface BffOptions<T> {
  /** Defaults to GET. */
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  params?: Record<string, string | number | boolean | null | undefined>;
  body?: unknown;
  /** Validates the payload *inside* the envelope, not the envelope itself. */
  schema: ZodType<T>;
}

interface SendOptions {
  params?: Record<string, string | number | boolean | null | undefined>;
  body?: unknown;
}

/**
 * The browser's one door to a route handler, and the read-side mirror of `ok()`
 * in `src/lib/utils/http.ts`: `ok()` writes the `{ data }` envelope, `bff()`
 * reads it. Non-2xx responses already became an `ApiError` inside
 * `src/lib/api/client.ts`, so the only failure added here is a payload that
 * does not match its schema.
 */
export async function bff<T>(path: string, options: BffOptions<T>): Promise<T> {
  const { method = 'GET', params, body, schema } = options;
  const envelope = await send(method, path, { params, body });

  if (!envelope || typeof envelope !== 'object' || !('data' in envelope)) {
    throw new ApiError({
      message: `Malformed response from ${path}`,
      status: 502,
      code: 'invalid_response',
    });
  }

  const parsed = schema.safeParse(envelope.data);
  if (!parsed.success) {
    throw new ApiError({
      message: `Unexpected payload from ${path}`,
      status: 502,
      code: 'invalid_response',
      cause: parsed.error,
    });
  }

  return parsed.data;
}

/**
 * Spelled out per verb rather than indexed by method name: the explicit switch
 * keeps the generic call sites type-checked instead of relying on an indexed
 * union of call signatures.
 */
function send(
  method: NonNullable<BffOptions<unknown>['method']>,
  path: string,
  options: SendOptions,
): Promise<ApiResponse<unknown>> {
  switch (method) {
    case 'POST':
      return internalApi.post<ApiResponse<unknown>>(path, options);
    case 'PUT':
      return internalApi.put<ApiResponse<unknown>>(path, options);
    case 'PATCH':
      return internalApi.patch<ApiResponse<unknown>>(path, options);
    case 'DELETE':
      return internalApi.delete<ApiResponse<unknown>>(path, options);
    default:
      return internalApi.get<ApiResponse<unknown>>(path, options);
  }
}
