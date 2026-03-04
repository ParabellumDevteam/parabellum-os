import Fastify from 'fastify';
import cors from '@fastify/cors';
import sensible from '@fastify/sensible';

import type { AppEnv } from './env';

import prismaPlugin from './plugins/prisma';
import redisPlugin from './plugins/redis';
import jwtPlugin from './plugins/jwt';
import rateLimitPlugin from './plugins/rateLimit';
import idempotencyPlugin from './plugins/idempotency';

import { authRoutes } from './routes/auth';
import { stravaRoutes } from './routes/strava';
import { rewardsRoutes } from './routes/rewards';
import { adminRoutes } from './routes/admin';

export function buildServer(env: AppEnv) {
  const app = Fastify({ logger: { level: env.NODE_ENV === 'production' ? 'info' : 'debug' } });

  app.register(cors, { origin: env.CORS_ORIGIN, credentials: true });
  app.register(sensible);

  app.register(redisPlugin, { env });
  app.register(rateLimitPlugin);
  app.register(idempotencyPlugin);
  app.register(prismaPlugin);
  app.register(jwtPlugin, { env });

  app.get('/v1/health', async () => ({
    ok: true,
    service: 'parabellum-api',
    uptimeS: Math.floor(process.uptime()),
    ts: new Date().toISOString()
  }));

  app.get('/', async () => ({ name: 'Parabellum OS API', status: 'online' }));

  app.register(authRoutes);

  app.register(async (instance) => {
    await stravaRoutes(instance, {
      verifyToken: env.STRAVA_WEBHOOK_VERIFY_TOKEN,
      callbackUrl: env.STRAVA_CALLBACK_URL
    });
  });

  app.register(async (instance) => {
    await rewardsRoutes(instance, {
      genesisISO: env.GENESIS_DATE_ISO,
      baseDailyCap: env.BASE_DAILY_GLOBAL_CAP
    });
  });

  app.register(async (instance) => {
    await adminRoutes(instance, {
      genesisISO: env.GENESIS_DATE_ISO,
      baseDailyCap: env.BASE_DAILY_GLOBAL_CAP
    });
  });

  app.setErrorHandler((err, _req, reply) => {
    app.log.error(err);
    return reply.code(500).send({ ok: false, error: 'INTERNAL_ERROR' });
  });

  return app;
}
