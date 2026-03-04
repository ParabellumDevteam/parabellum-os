import fp from 'fastify-plugin';

export default fp(async (app) => {
  const TTL_SECONDS = 60 * 10;

  app.decorateRequest('idempotencyKey', '');

  app.addHook('preHandler', async (req, reply) => {
    if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) return;

    const key = (req.headers['idempotency-key'] as string | undefined)?.trim();
    if (!key) return;

    req.idempotencyKey = key;

    const redisKey = `idem:${req.method}:${req.url}:${key}`;
    const exists = await app.redis.get(redisKey);

    if (exists) {
      return reply.code(409).send({
        ok: false,
        error: 'IDEMPOTENCY_KEY_REUSED',
        message: 'This request was already submitted recently.'
      });
    }

    await app.redis.set(redisKey, '1', 'EX', TTL_SECONDS);
  });
});

declare module 'fastify' {
  interface FastifyRequest {
    idempotencyKey: string;
  }
}
