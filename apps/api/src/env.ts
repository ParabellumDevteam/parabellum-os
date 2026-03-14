import { z } from 'zod';

const EnvSchema = z.object({
  NODE_ENV: z.string().default('development'),
  API_PORT: z.coerce.number().default(3001),
  CORS_ORIGIN: z.string().default('http://localhost:3000'),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1),
  JWT_SECRET: z.string().min(1),
  STRAVA_WEBHOOK_VERIFY_TOKEN: z.string().min(1),
  STRAVA_CALLBACK_URL: z.string().min(1),
  GENESIS_DATE_ISO: z.string().min(1),
  BASE_DAILY_GLOBAL_CAP: z.coerce.number().int().positive()
});

export type AppEnv = z.infer<typeof EnvSchema>;

export function loadEnv(input: Record<string, unknown>): AppEnv {
  const parsed = EnvSchema.safeParse(input);
  if (!parsed.success) {
    // Keep error readable in VPS logs
    console.error('❌ Invalid environment variables:', parsed.error.flatten().fieldErrors);
    process.exit(1);
  }
  return parsed.data;
}
