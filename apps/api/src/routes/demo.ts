import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { sha256 } from '../lib/hash';
import { enqueue, QUEUE_STRAVA_EVENTS } from '../lib/queue';

const ACTIVITY_PRESETS: Record<string, { distance_m: number; moving_time_s: number; avg_hr: number; max_hr: number }> = {
  easy_run:    { distance_m: 3000,  moving_time_s: 1200, avg_hr: 130, max_hr: 150 },
  morning_run: { distance_m: 5000,  moving_time_s: 1800, avg_hr: 145, max_hr: 165 },
  long_run:    { distance_m: 10000, moving_time_s: 3600, avg_hr: 150, max_hr: 175 },
  hiit:        { distance_m: 800,   moving_time_s: 1200, avg_hr: 165, max_hr: 190 },
  cycling:     { distance_m: 20000, moving_time_s: 3600, avg_hr: 135, max_hr: 160 },
  walk:        { distance_m: 2000,  moving_time_s: 1800, avg_hr: 95,  max_hr: 110 }
};

const SimSchema = z.object({
  preset: z.string().optional(),
  owner_id: z.coerce.number().int().positive().optional()
});

export async function demoRoutes(app: FastifyInstance) {
  app.get('/v1/demo/presets', async (_req, reply) => {
    const presets = Object.entries(ACTIVITY_PRESETS).map(([name, data]) => ({
      name,
      distanceKm: (data.distance_m / 1000).toFixed(1),
      durationMin: Math.round(data.moving_time_s / 60),
      avgHr: data.avg_hr
    }));
    return reply.send({ ok: true, presets });
  });

  app.post('/v1/demo/simulate', async (req, reply) => {
    const parsed = SimSchema.safeParse(req.body ?? {});
    if (!parsed.success) return reply.code(400).send({ ok: false, error: 'BAD_REQUEST' });

    const presetName = parsed.data.preset || 'morning_run';
    const preset = ACTIVITY_PRESETS[presetName];
    if (!preset) return reply.code(400).send({ ok: false, error: 'UNKNOWN_PRESET', available: Object.keys(ACTIVITY_PRESETS) });

    const ownerId = parsed.data.owner_id ?? Math.floor(Math.random() * 90000) + 10000;
    const objectId = Date.now();

    const payload = {
      object_type: presetName.includes('cycl') ? 'Ride' : 'Run',
      object_id: objectId,
      aspect_type: 'create',
      owner_id: ownerId,
      subscription_id: 1,
      event_time: Math.floor(Date.now() / 1000),
      ...preset
    };

    const keyBase = JSON.stringify({
      object_type: payload.object_type,
      object_id: payload.object_id,
      aspect_type: payload.aspect_type,
      owner_id: payload.owner_id,
      subscription_id: payload.subscription_id,
      event_time: payload.event_time,
      updates: {}
    });

    const eventKey = sha256(`strava:${keyBase}`);

    await app.prisma.webhookEvent.create({
      data: { provider: 'strava', eventKey, payload: payload as Record<string, unknown>, status: 'queued' }
    });

    await enqueue(app, QUEUE_STRAVA_EVENTS, { eventKey });

    return reply.send({
      ok: true,
      simulated: true,
      preset: presetName,
      ownerId,
      eventKey
    });
  });
}
