import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { dailyCapWithHalving, yearIndex } from '@parabellum/core';

function authGuard(_app: FastifyInstance) {
  return async function (req: FastifyRequest, reply: FastifyReply) {
    try {
      await req.jwtVerify();
    } catch {
      return reply.code(401).send({ ok: false, error: 'UNAUTHORIZED' });
    }
  };
}

function dayUTC(d: Date) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0));
}

export async function userRoutes(app: FastifyInstance, opts: { genesisISO: string; baseDailyCap: number }) {
  app.get('/v1/user/dashboard', { preHandler: [authGuard(app)] }, async (req, reply) => {
    const userId = (req.user as { sub: string }).sub;
    const today = dayUTC(new Date());

    const [user, todayPoints, totalActivities, recentActivities] = await Promise.all([
      app.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, walletAddress: true, displayName: true, disciplineScore: true }
      }),
      app.prisma.dailyPoints.findUnique({
        where: { day_userId: { day: today, userId } }
      }),
      app.prisma.activity.count({ where: { userId } }),
      app.prisma.activity.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { id: true, type: true, distanceM: true, movingTimeS: true, avgHr: true, createdAt: true }
      })
    ]);

    const y = yearIndex(opts.genesisISO, new Date());
    const globalCap = dailyCapWithHalving(opts.baseDailyCap, y);

    return reply.send({
      ok: true,
      user,
      today: {
        points: todayPoints?.points ?? 0,
        perUserCap: 35,
        globalCap,
        yearIndex: y
      },
      stats: {
        totalActivities,
        disciplineScore: user?.disciplineScore ?? 0
      },
      recentActivities
    });
  });

  app.get('/v1/user/activities', { preHandler: [authGuard(app)] }, async (req, reply) => {
    const userId = (req.user as { sub: string }).sub;

    const activities = await app.prisma.activity.findMany({
      where: { userId },
      orderBy: { startTime: 'desc' },
      take: 50,
      select: {
        id: true,
        provider: true,
        providerId: true,
        type: true,
        startTime: true,
        distanceM: true,
        movingTimeS: true,
        elapsedTimeS: true,
        avgHr: true,
        maxHr: true,
        createdAt: true
      }
    });

    return reply.send({ ok: true, activities });
  });
}
