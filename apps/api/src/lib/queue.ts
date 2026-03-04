import type { FastifyInstance } from 'fastify';

export const QUEUE_STRAVA_EVENTS = 'q:strava:events';

export async function enqueue(app: FastifyInstance, queue: string, msg: unknown) {
  await app.redis.lpush(queue, JSON.stringify(msg));
}

export async function queueSize(app: FastifyInstance, queue: string) {
  return await app.redis.llen(queue);
}
