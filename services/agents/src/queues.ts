import { createClient } from 'redis';

export const Q_TASKS   = 'q:agents:tasks';
export const Q_CONTENT = 'q:agents:content';
export const Q_PUBLISH = 'q:agents:publish';

export type RedisClient = ReturnType<typeof createClient>;

export function mkRedis(url: string) {
  const r = createClient({ url });
  r.on('error', (e) => console.error('Redis error:', e));
  return r;
}

export async function qpush(r: RedisClient, queue: string, payload: any) {
  await r.lPush(queue, JSON.stringify(payload));
}

export async function qbrpop(r: RedisClient, queue: string, timeoutSec = 0) {
  const res = await r.brPop(queue, timeoutSec);
  if (!res) return null;
  return JSON.parse(res.element);
}
