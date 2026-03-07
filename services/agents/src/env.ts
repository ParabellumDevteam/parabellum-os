import { z } from 'zod';

const Env = z.object({
  REDIS_URL: z.string().min(1),
  BRAIN_DIR: z.string().default('/var/lib/parabellum/brain'),
  APPROVAL_MODE: z.enum(['manual', 'auto']).default('manual') // keep manual in Phase B
});

export type AppEnv = z.infer<typeof Env>;

export function loadEnv(raw: NodeJS.ProcessEnv): AppEnv {
  const parsed = Env.safeParse(raw);
  if (!parsed.success) {
    console.error('❌ Invalid env:', parsed.error.flatten().fieldErrors);
    process.exit(1);
  }
  return parsed.data;
}
