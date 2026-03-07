import { z } from "zod";

const Env = z.object({
  REDIS_URL: z.string().min(1),
  Q_PUBLISH: z.string().min(1).default("q:agents:publish"),
  APPROVAL_MODE: z.enum(["manual","auto"]).default("manual"),

  // Playwright session file (storageState)
  X_STORAGE_STATE: z.string().min(1).default("/var/lib/parabellum/brain/x.storage.json"),

  // basic safety
  X_DRY_RUN: z.string().optional().default("0"),
});

export type AppEnv = z.infer<typeof Env>;

export function loadEnv(raw: any): AppEnv {
  return Env.parse(raw);
}
