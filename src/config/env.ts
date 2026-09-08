import { z } from 'zod';

/**
 * Server-only environment variables.
 * Parsed once at module load so a misconfigured deploy fails fast
 * instead of throwing on the first request.
 */
const serverSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  API_BASE_URL: z.string().url(),
  API_TOKEN: z.string().min(1).optional(),
});

/**
 * Variables that are safe to ship to the browser.
 * Must be referenced literally (`process.env.NEXT_PUBLIC_*`) so Next can inline them.
 */
const clientSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3000'),
});

function parse<T extends z.ZodTypeAny>(schema: T, input: unknown, label: string): z.infer<T> {
  const result = schema.safeParse(input);

  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => `  - ${issue.path.join('.') || '(root)'}: ${issue.message}`)
      .join('\n');
    throw new Error(`Invalid ${label} environment variables:\n${issues}`);
  }

  return result.data;
}

export const clientEnv = parse(
  clientSchema,
  { NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL },
  'client',
);

/**
 * Lazily parsed: importing this module from a Client Component must not
 * blow up because server-only vars are absent from the browser bundle.
 */
let cachedServerEnv: z.infer<typeof serverSchema> | null = null;

export function serverEnv(): z.infer<typeof serverSchema> {
  if (typeof window !== 'undefined') {
    throw new Error('serverEnv() was called in the browser. Use clientEnv instead.');
  }

  cachedServerEnv ??= parse(serverSchema, process.env, 'server');
  return cachedServerEnv;
}
