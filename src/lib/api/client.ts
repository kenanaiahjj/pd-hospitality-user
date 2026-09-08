import axios, {
  type AxiosError,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from 'axios';
import type { ZodType } from 'zod';
import { API_TIMEOUT_MS } from '@/config/constants';
import type { ApiErrorBody } from '@/types/api';
import { ApiError } from './errors';

type QueryValue = string | number | boolean | null | undefined;

export interface RequestOptions<TOut> extends Omit<RequestInit, 'body' | 'method'> {
  /** Appended as a query string; null/undefined entries are dropped. */
  params?: Record<string, QueryValue>;
  /** Serialized as JSON unless it is already a string/FormData. */
  body?: unknown;
  /** Validated against the response payload. Skip it and you get `unknown`. */
  schema?: ZodType<TOut>;
  /** Overrides the client default. */
  timeoutMs?: number;
  /** Next.js fetch cache options, forwarded verbatim. */
  next?: { revalidate?: number | false; tags?: string[] };
}

export interface ApiClientConfig {
  baseUrl: string;
  /** Static headers, or a function for per-request values such as an auth token. */
  headers?: HeadersInit | (() => HeadersInit | Promise<HeadersInit>);
  timeoutMs?: number;
}

export interface ApiClient {
  get<T = unknown>(path: string, options?: RequestOptions<T>): Promise<T>;
  post<T = unknown>(path: string, options?: RequestOptions<T>): Promise<T>;
  put<T = unknown>(path: string, options?: RequestOptions<T>): Promise<T>;
  patch<T = unknown>(path: string, options?: RequestOptions<T>): Promise<T>;
  delete<T = unknown>(path: string, options?: RequestOptions<T>): Promise<T>;
}

export function createApiClient(config: ApiClientConfig): ApiClient {
  const instance = createInstance(config);

  const request = async <T>(
    method: string,
    path: string,
    options: RequestOptions<T> = {},
  ): Promise<T> => {
    const { params, body, schema, timeoutMs, headers, ...init } = options;
    const url = buildUrl(config.baseUrl, path, params);

    let payload: unknown;
    try {
      const response = await instance.request({
        method,
        url: withLeadingSlash(path),
        params: cleanParams(params),
        ...(body !== undefined && body !== null && { data: body }),
        ...(timeoutMs !== undefined && { timeout: timeoutMs }),
        headers: toHeaderRecord(headers),
        // Everything left over is `RequestInit` — `next`, `cache`, `credentials`
        // and friends. Axios hands this to the underlying fetch as its second
        // argument, which is how Next's cache directives survive the trip.
        fetchOptions: init,
      });
      payload = normalizeBody(response.data, response.status);
    } catch (cause) {
      throw toApiError(cause, { method, path, url });
    }

    if (!schema) return payload as T;

    const parsed = schema.safeParse(payload);
    if (!parsed.success) {
      throw new ApiError({
        message: `Unexpected response shape from ${path}`,
        status: 502,
        code: 'invalid_response',
        url,
        cause: parsed.error,
      });
    }

    return parsed.data;
  };

  return {
    get: (path, options) => request('GET', path, options),
    post: (path, options) => request('POST', path, options),
    put: (path, options) => request('PUT', path, options),
    patch: (path, options) => request('PATCH', path, options),
    delete: (path, options) => request('DELETE', path, options),
  };
}

function createInstance(config: ApiClientConfig): AxiosInstance {
  const instance = axios.create({
    baseURL: config.baseUrl.replace(/\/$/, ''),
    timeout: config.timeoutMs ?? API_TIMEOUT_MS,
    // The fetch adapter is load-bearing, not a preference. The default Node
    // adapter drives `http` directly and would bypass the fetch that Next.js
    // patches, silently dropping `next: { revalidate, tags }`.
    adapter: 'fetch',
  });

  // Axios ships an `Accept: application/json, text/plain, */*` default. Drop it
  // so a client's own Accept lands instead of losing the slot to axios, and so
  // a client that configures none sends none — as the fetch wrapper did.
  delete instance.defaults.headers.common.Accept;

  if (config.headers) {
    instance.interceptors.request.use(async (request: InternalAxiosRequestConfig) => {
      const resolved =
        typeof config.headers === 'function' ? await config.headers() : config.headers;

      // Defaults go on last and never clobber: a per-request header wins.
      for (const [key, value] of Object.entries(toHeaderRecord(resolved) ?? {})) {
        if (!request.headers.has(key)) request.headers.set(key, value);
      }

      return request;
    });
  }

  return instance;
}

function toApiError(
  cause: unknown,
  context: { method: string; path: string; url: string },
): ApiError {
  const { method, path, url } = context;

  // Anything that is not an axios failure never reached the network — a request
  // interceptor threw, which here means misconfiguration (`serverEnv()` on an
  // incomplete environment, say). Let it propagate: reporting a config bug as a
  // 503 would hide the fail-fast the env parser exists to provide.
  if (!axios.isAxiosError(cause)) throw cause;

  const error = cause as AxiosError;
  const response = error.response;

  if (response) {
    const payload = normalizeBody(response.data, response.status);
    const envelope = errorEnvelope(payload);

    return new ApiError({
      message:
        envelope?.message ??
        extractMessage(payload) ??
        `${method} ${path} failed with ${response.status}`,
      status: response.status,
      code: envelope?.code,
      fields: envelope?.fields,
      url,
    });
  }

  const timedOut =
    error?.code === 'ECONNABORTED' ||
    error?.code === 'ETIMEDOUT' ||
    isNamed(error?.cause, 'TimeoutError');

  return new ApiError({
    message: timedOut ? `Request to ${path} timed out` : `Request to ${path} failed`,
    status: timedOut ? 408 : 503,
    code: timedOut ? 'timeout' : 'network_error',
    url,
    cause,
  });
}

/**
 * Identifies an abort reason by `name` rather than `instanceof DOMException`.
 * The signal and the ambient `DOMException` can come from different realms
 * (Node's globals under a jsdom test environment, for one), and `instanceof`
 * is false across a realm boundary even when the object really is one.
 */
function isNamed(cause: unknown, name: string): boolean {
  return !!cause && typeof cause === 'object' && (cause as { name?: unknown }).name === name;
}

/**
 * Axios yields `''` for an empty body where the fetch wrapper yielded `null`.
 * Callers and schemas depend on `null`, so put it back.
 */
function normalizeBody(data: unknown, status: number): unknown {
  if (status === 204) return null;
  if (data === '' || data === undefined) return null;
  return data;
}

function cleanParams(params?: Record<string, QueryValue>): Record<string, string> | undefined {
  if (!params) return undefined;

  const cleaned: Record<string, string> = {};
  for (const [key, value] of Object.entries(params)) {
    // Axios would keep empty strings; the fetch wrapper dropped them. Keep dropping.
    if (value !== null && value !== undefined && value !== '') {
      cleaned[key] = String(value);
    }
  }

  return cleaned;
}

function toHeaderRecord(headers?: HeadersInit): Record<string, string> | undefined {
  if (!headers) return undefined;

  const record: Record<string, string> = {};
  new Headers(headers).forEach((value, key) => {
    record[key] = value;
  });

  return record;
}

function withLeadingSlash(path: string): string {
  return path.startsWith('/') ? path : `/${path}`;
}

/** Reconstructs the absolute URL purely so `ApiError.url` stays populated. */
function buildUrl(baseUrl: string, path: string, params?: Record<string, QueryValue>): string {
  const base = baseUrl.replace(/\/$/, '');
  const search = new URLSearchParams(cleanParams(params)).toString();
  const suffix = withLeadingSlash(path);

  return search ? `${base}${suffix}?${search}` : `${base}${suffix}`;
}

/**
 * Reads this app's own error envelope (`src/types/api.ts`) off a failed
 * response, so `code` and field messages survive the trip to the browser.
 * Anything that does not match the envelope exactly is ignored.
 */
function errorEnvelope(payload: unknown): ApiErrorBody | undefined {
  if (!payload || typeof payload !== 'object') return undefined;

  const candidate = (payload as { error?: unknown }).error;
  if (!candidate || typeof candidate !== 'object') return undefined;

  const { message, code, fields } = candidate as Record<string, unknown>;
  if (typeof message !== 'string' || typeof code !== 'string') return undefined;

  return { message, code, ...(isFieldMap(fields) && { fields }) };
}

function isFieldMap(value: unknown): value is Record<string, string[]> {
  return (
    !!value &&
    typeof value === 'object' &&
    Object.values(value).every(
      (entry) => Array.isArray(entry) && entry.every((item) => typeof item === 'string'),
    )
  );
}

function extractMessage(payload: unknown): string | undefined {
  if (typeof payload === 'string' && payload.trim()) return payload;
  if (payload && typeof payload === 'object') {
    const candidate =
      (payload as Record<string, unknown>).message ??
      (payload as Record<string, unknown>).error;
    if (typeof candidate === 'string') return candidate;
    if (candidate && typeof candidate === 'object') {
      const nested = (candidate as Record<string, unknown>).message;
      if (typeof nested === 'string') return nested;
    }
  }
  return undefined;
}
