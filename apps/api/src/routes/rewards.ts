import type { FastifyInstance } from 'fastify';
import { dailyCapWithHalving, yearIndex } from '@parabellum/core';

export async function rewardsRoutes(app: FastifyInstance, opts: { genesisISO: string; baseDailyCap: number }) {
  app.get('/v1/rewards/today', async (_req, reply) => {
    const now = new Date();
    const y = yearIndex(opts.genesisISO, now);
    const globalCap = dailyCapWithHalving(opts.baseDailyCap, y);

    return reply.send({
      ok: true,
      date: now.toISOString(),
      yearIndex: y,
      globalDailyCap: globalCap,
      perUserDailyCap: 35,
      note: 'Phase A: read-only. Phase B: scoring + merkle epochs + on-chain claim.'
    });
  });

  app.get('/v1/rewards/epochs', async (_req, reply) => {
    const epochs = await app.prisma.rewardEpoch.findMany({
      orderBy: { day: 'desc' },
      take: 30
    });
    return reply.send({ ok: true, epochs });
  });
}
