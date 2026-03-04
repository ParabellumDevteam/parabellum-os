import fp from 'fastify-plugin';
import redis from '@fastify/redis';
import type { AppEnv } from '../env';

export default fp(async (app, opts: { env: AppEnv }) => {
  await app.register(redis, { url: opts.env.REDIS_URL });
});

declare module 'fastify' {
  interface FastifyInstance {
    redis: import('@fastify/redis').FastifyRedis;
  }
}
