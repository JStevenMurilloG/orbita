import "server-only";
import { z } from "zod";

/**
 * Variables solo de servidor, validadas al primer uso.
 * Las integraciones de fases posteriores son opcionales hasta que su fase las active.
 */
const serverEnvSchema = z.object({
  SUPABASE_SECRET_KEY: z.string().min(1),
  RESEND_API_KEY: z.string().min(1).optional(),
  GOOGLE_CLIENT_ID: z.string().min(1).optional(),
  GOOGLE_CLIENT_SECRET: z.string().min(1).optional(),
  GOOGLE_PICKER_API_KEY: z.string().min(1).optional(),
  GOOGLE_TOKEN_ENC_KEY: z.string().min(1).optional(),
  CRON_SECRET: z.string().min(16).optional(),
  UPSTASH_REDIS_REST_URL: z.url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1).optional(),
  SENTRY_DSN: z.url().optional(),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

let cached: ServerEnv | undefined;

export function serverEnv(): ServerEnv {
  cached ??= serverEnvSchema.parse(process.env);
  return cached;
}

export { publicEnv } from "./env.public";
