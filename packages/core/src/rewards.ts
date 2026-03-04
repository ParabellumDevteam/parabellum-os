import { clamp } from './tokenomics.js';

export type DailyRewardInput = {
  userId: string;
  points: number; // normalized effort points
};

export type DailyRewardOutput = {
  userId: string;
  reward: number; // PRBL units (whole tokens in server math; chain uses decimals)
};

export function computeDailyRewards(params: {
  inputs: DailyRewardInput[];
  dailyPool: number;        // PRBL available that day (already halved & capped globally)
  perUserDailyCap: number;  // 35
}): DailyRewardOutput[] {
  const { inputs, dailyPool, perUserDailyCap } = params;

  const cleaned = inputs
    .map((x) => ({ ...x, points: Number.isFinite(x.points) ? Math.max(0, x.points) : 0 }))
    .filter((x) => x.userId.length > 0);

  const total = cleaned.reduce((a, b) => a + b.points, 0);

  if (total <= 0 || dailyPool <= 0) {
    return cleaned.map((x) => ({ userId: x.userId, reward: 0 }));
  }

  // proportional distribution + user cap
  return cleaned.map((x) => {
    const raw = Math.floor((dailyPool * x.points) / total);
    const reward = clamp(raw, 0, perUserDailyCap);
    return { userId: x.userId, reward };
  });
}
