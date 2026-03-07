import { z } from 'zod';

const Env = z.object({
  TELEGRAM_BOT_TOKEN: z.string().min(10),
  TELEGRAM_ADMIN_ID: z.string().regex(/^\d+$/),
  REDIS_URL: z.string().min(8)
});

export function loadEnv(raw: any) {
  const parsed = Env.safeParse(raw);
  if (!parsed.success) {
    console.error('❌ Invalid env:', parsed.error.flatten().fieldErrors);
    process.exit(1);
  }
  return parsed.data;
}
