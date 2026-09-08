import { NextResponse } from 'next/server';
import type { ZodType } from 'zod';
import { ApiError } from '@/lib/api/errors';
import type { ApiResponse } from '@/types/api';

/** 2xx JSON response in the app's standard envelope. */
export function ok<T>(data: T, init?: ResponseInit): NextResponse<ApiResponse<T>> {
  return NextResponse.json({ data }, { status: 200, ...init });
}

/** Error JSON response derived from any thrown value. */
export function fail(error: unknown): NextResponse<ApiResponse<never>> {
  const apiError = ApiError.from(error);

  if (apiError.status >= 500) {
    console.error('[api]', apiError.url ?? '', apiError.message, apiError.cause ?? '');
  }

  return NextResponse.json({ error: apiError.toBody() }, { status: apiError.status });
}

/**
 * Wraps a route handler so every thrown `ApiError` (or anything else)
 * becomes a consistent JSON error instead of an unhandled 500 page.
 */
export function route<TArgs extends unknown[]>(
  handler: (...args: TArgs) => Promise<NextResponse>,
): (...args: TArgs) => Promise<NextResponse> {
  return async (...args: TArgs) => {
    try {
      return await handler(...args);
    } catch (error) {
      return fail(error);
    }
  };
}

/** Validates `?query` params, throwing a 422 `ApiError` with field messages. */
export function parseQuery<T>(schema: ZodType<T>, url: string): T {
  const params = Object.fromEntries(new URL(url).searchParams);
  return unwrap(schema.safeParse(params), 'Invalid query parameters');
}

/** Validates a JSON request body, throwing a 422 `ApiError` with field messages. */
export async function parseBody<T>(schema: ZodType<T>, request: Request): Promise<T> {
  let json: unknown;
  try {
    json = await request.json();
  } catch (cause) {
    throw new ApiError({ message: 'Request body must be valid JSON', status: 400, cause });
  }

  return unwrap(schema.safeParse(json), 'Invalid request body');
}

function unwrap<T>(
  result: { success: true; data: T } | { success: false; error: { issues: { path: PropertyKey[]; message: string }[] } },
  message: string,
): T {
  if (result.success) return result.data;

  const fields: Record<string, string[]> = {};
  for (const issue of result.error.issues) {
    const key = issue.path.join('.') || '_';
    (fields[key] ??= []).push(issue.message);
  }

  throw new ApiError({ message, status: 422, code: 'validation_error', fields });
}
