import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
// Phase A no-build: import from source so tsx can compile
import { buildEpoch } from '../../../../services/rewards/src/epoch';

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

function authGuard(app: FastifyInstance) {
  return async function (req: any, reply: any) {
    try {
      await req.jwtVerify();
    } catch {
      return reply.code(401).send({ ok: false, error: 'UNAUTHORIZED' });
    }
  };
}

export async function adminRoutes(app: FastifyInstance, opts: { genesisISO: string; baseDailyCap: number }) {
  app.get('/v1/admin/points/today', { preHandler: [authGuard(app)] }, async (_req, reply) => {
    const day = dayUTC(new Date());
    const rows = await app.prisma.dailyPoints.findMany({
      where: { day },
      orderBy: { points: 'desc' },
      take: 50
    });
    return reply.send({ ok: true, day: day.toISOString(), rows });
  });

  app.post('/v1/admin/rewards/build', { preHandler: [authGuard(app)] }, async (req, reply) => {
    const parsed = BuildSchema.safeParse(req.body ?? {});
    if (!parsed.success) return reply.code(400).send({ ok: false, error: 'BAD_REQUEST' });

    let day: Date;
    try {
      day = dayUTC(parseDay(parsed.data.day));
    } catch (e: any) {
      return reply.code(400).send({ ok: false, error: 'BAD_DAY', message: e.message });
    }

    const result = await buildEpoch({
      day,
      genesisISO: opts.genesisISO,
      baseDailyGlobalCap: opts.baseDailyCap,
      perUserDailyCap: 35
    });

    return reply.send({ ok: true, ...result });
  });
}
