import { prisma } from '@parabellum/db';
import { computeDailyRewards, dailyCapWithHalving, yearIndex } from '@parabellum/core';
import crypto from 'node:crypto';

function dayUTC(d: Date) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0));
}

function sha256(s: string) {
  return crypto.createHash('sha256').update(s).digest('hex');
}

/**
 * Phase A:
 * - Builds a RewardEpoch row with a deterministic "root" (sha256) for preview/audit.
 * Phase B:
 * - Replace with Merkle root from claim leaves + on-chain distributor.
 */
export async function buildEpoch(params: {
  day?: Date;
  genesisISO: string;
  baseDailyGlobalCap: number;
  perUserDailyCap: number; // 35
}) {
  const day = dayUTC(params.day ?? new Date());
  const y = yearIndex(params.genesisISO, new Date());
  const globalCap = dailyCapWithHalving(params.baseDailyGlobalCap, y);
  const dailyPool = globalCap; // Phase A: pool == cap

  const rows = await prisma.dailyPoints.findMany({
    where: { day },
    select: { userId: true, points: true }
  });

  const inputs = rows.map((r) => ({ userId: r.userId, points: r.points }));
  const rewards = computeDailyRewards({
    inputs,
    dailyPool,
    perUserDailyCap: params.perUserDailyCap
  });

  // Deterministic preview root (NOT merkle)
  const leafString = rewards
    .sort((a, b) => a.userId.localeCompare(b.userId))
    .map((x) => `${x.userId}:${x.reward}`)
    .join('|');

  const merkleRoot = sha256(`preview:${day.toISOString()}:${leafString}`);

  const epoch = await prisma.rewardEpoch.upsert({
    where: { day },
    update: {
      merkleRoot,
      dailyPool,
      globalCap,
      yearIndex: y
    },
    create: {
      day,
      merkleRoot,
      dailyPool,
      globalCap,
      yearIndex: y
    }
  });

  return { epoch, rewards };
}
