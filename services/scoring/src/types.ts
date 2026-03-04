import { z } from 'zod';

export const StravaActivityLike = z.object({
  id: z.union([z.number(), z.string()]).optional(),
  type: z.string().optional(),
  distanceM: z.number().optional(),
  movingTimeS: z.number().optional(),
  avgHr: z.number().optional(),
  maxHr: z.number().optional()
});

export type StravaActivityLike = z.infer<typeof StravaActivityLike>;

export type EffortScore = {
  points: number;      // normalized effort points for ledger
  flags: string[];     // anti-cheat flags
};
