import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { sha256 } from '../lib/hash';
import { enqueue, QUEUE_STRAVA_EVENTS, queueSize } from '../lib/queue';

const WebhookEventSchema = z.object({
  object_type: z.string().optional(),
  object_id: z.union([z.number(), z.string()]).optional(),
  aspect_type: z.string().optional(),
  owner_id: z.union([z.number(), z.string()]).optional(),
  subscription_id: z.union([z.number(), z.string()]).optional(),
  event_time: z.union([z.number(), z.string()]).optional(),
  updates: z.record(z.any()).optional()
});

export async function stravaRoutes(app: FastifyInstance, opts: { verifyToken: string; callbackUrl: string }) {
  app.get('/v1/strava/webhook', async (req, reply) => {
    const q = req.query as any;
    const mode = q['hub.mode'];
    const token = q['hub.verify_token'];
    const challenge = q['hub.challenge'];

    if (mode === 'subscribe' && token && token === opts.verifyToken) {
      return reply.send({ 'hub.challenge': challenge });
    }
    return reply.code(401).send({ ok: false, error: 'STRAVA_VERIFY_FAILED' });
  });

  app.post('/v1/strava/webhook', async (req, reply) => {
    const parsed = WebhookEventSchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ ok: false, error: 'BAD_REQUEST' });

    const payload = parsed.data;

    const keyBase = JSON.stringify({
      object_type: payload.object_type,
      object_id: payload.object_id,
      aspect_type: payload.aspect_type,
      owner_id: payload.owner_id,
      subscription_id: payload.subscription_id,
      event_time: payload.event_time,
      updates: payload.updates ?? {}
    });

    const eventKey = sha256(`strava:${keyBase}`);

    // Try insert. If duplicate, do NOT crash.
    let inserted = false;
    try {
      await app.prisma.webhookEvent.create({
        data: { provider: 'strava', eventKey, payload: payload as any, status: 'queued' }
      });
      inserted = true;
    } catch (e: any) {
      // Prisma unique constraint
      if (String(e?.code) === 'P2002') {
        const size = await queueSize(app, QUEUE_STRAVA_EVENTS);
        return reply.send({ ok: true, deduped: true, queued: false, eventKey, queue: size });
      }
      throw e;
    }

    if (inserted) {
      await enqueue(app, QUEUE_STRAVA_EVENTS, { eventKey });
    }

    const size = await queueSize(app, QUEUE_STRAVA_EVENTS);
    return reply.send({ ok: true, queued: true, eventKey, queue: size });
  });

  app.get('/v1/strava/callback', async (_req, reply) => {
    return reply.send({
      ok: true,
      message: 'Strava callback reached (Phase A skeleton). Implement token exchange in Phase B.',
      callbackUrl: opts.callbackUrl
    });
  });
}
