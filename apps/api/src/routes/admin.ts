import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import crypto from 'node:crypto';
import { computeDailyRewards, dailyCapWithHalving, yearIndex } from '@parabellum/core';

const BuildSchema = z.object({ day: z.string().optional() });

function dayUTC(d: Date) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0));
}

function parseDay(day?: string) {
  if (!day) return new Date();
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(day);
  if (!m) throw new Error('Invalid day format, use YYYY-MM-DD');
  return new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 0, 0, 0));
}

function sha256(s: string) {
  return crypto.createHash('sha256').update(s).digest('hex');
}

export async function adminRoutes(app: FastifyInstance, opts: { genesisISO: string; baseDailyCap: number }) {
  app.get('/v1/admin/points/today', async (_req, reply) => {
    const day = dayUTC(new Date());
    const rows = await app.prisma.dailyPoints.findMany({
      where: { day },
      orderBy: { points: 'desc' },
      take: 50
    });
    return reply.send({ ok: true, day: day.toISOString(), rows });
  });

  app.post('/v1/admin/rewards/build', async (req, reply) => {
    const parsed = BuildSchema.safeParse(req.body ?? {});
    if (!parsed.success) return reply.code(400).send({ ok: false, error: 'BAD_REQUEST' });

    let day: Date;
    try {
      day = dayUTC(parseDay(parsed.data.day));
    } catch (e: any) {
      return reply.code(400).send({ ok: false, error: 'BAD_DAY', message: e.message });
    }

    const y = yearIndex(opts.genesisISO, new Date());
    const globalCap = dailyCapWithHalving(opts.baseDailyCap, y);
    const dailyPool = globalCap;

    const rows = await app.prisma.dailyPoints.findMany({
      where: { day },
      select: { userId: true, points: true }
    });

    const rewards = computeDailyRewards({
      inputs: rows.map((r) => ({ userId: r.userId, points: r.points })),
      dailyPool,
      perUserDailyCap: 35
    });

    const leafString = rewards
      .sort((a, b) => a.userId.localeCompare(b.userId))
      .map((x) => `${x.userId}:${x.reward}`)
      .join('|');

    const merkleRoot = sha256(`preview:${day.toISOString()}:${leafString}`);

    const epoch = await app.prisma.rewardEpoch.upsert({
      where: { day },
      update: { merkleRoot, dailyPool, globalCap, yearIndex: y },
      create: { dailyPool: 1000, day, merkleRoot, dailyPool, globalCap, yearIndex: y }
    });

    return reply.send({ ok: true, epoch, rewards });
  });
}
