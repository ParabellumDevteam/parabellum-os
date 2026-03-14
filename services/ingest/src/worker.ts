import { createClient } from 'redis';

// Phase A no-build: import from source so tsx can compile
import { prisma } from '../../../packages/db/src/client.ts';
import { scoreActivity } from '../../../services/scoring/src/effort.ts';

const QUEUE = 'q:strava:events';

function dayUTC(d: Date) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0));
}

async function processEvent(eventKey: string) {
  const evt = await prisma.webhookEvent.findUnique({ where: { eventKey } });
  if (!evt) return;

  const payload = evt.payload as Record<string, unknown>;
  const ownerId = payload?.owner_id ? String(payload.owner_id) : null;

  if (!ownerId) {
    await prisma.webhookEvent.update({
      where: { eventKey },
      data: { status: 'failed', error: 'Missing owner_id in payload' }
    });
    return;
  }

  const existing = await prisma.stravaAccount.findUnique({ where: { athleteId: ownerId } });

  let userId: string;
  if (existing) {
    userId = existing.userId;
  } else {
    const user = await prisma.user.create({
      data: {
        stravaAccount: {
          create: {
            athleteId: ownerId,
            accessToken: 'PHASE_A_PLACEHOLDER',
            refreshToken: 'PHASE_A_PLACEHOLDER',
            expiresAt: 0
          }
        }
      },
      select: { id: true }
    });
    userId = user.id;
  }

  const providerId = String(payload.object_id ?? eventKey);
  const eventTime = payload.event_time
    ? new Date(Number(payload.event_time) * 1000)
    : new Date();
  const activityType = String(payload.object_type ?? 'unknown');

  const distanceM = typeof payload.distance_m === 'number' ? payload.distance_m : undefined;
  const movingTimeS = typeof payload.moving_time_s === 'number' ? payload.moving_time_s : undefined;
  const avgHr = typeof payload.avg_hr === 'number' ? payload.avg_hr : undefined;
  const maxHr = typeof payload.max_hr === 'number' ? payload.max_hr : undefined;

  // Score the activity using effort engine
  const { points, flags } = scoreActivity({
    id: providerId,
    type: activityType,
    distanceM,
    movingTimeS,
    avgHr,
    maxHr
  });

  // Minimum 1 point per valid event (ensures basic webhooks still count)
  const effectivePoints = Math.max(1, points);

  if (flags.length > 0) {
    console.warn('⚠️  anti-cheat flags for', eventKey, ':', flags.join(', '));
  }

  // Persist Activity row (upsert to handle re-delivered webhooks)
  try {
    await prisma.activity.upsert({
      where: { provider_providerId: { provider: 'strava', providerId } },
      update: { rawJson: payload },
      create: {
        userId,
        provider: 'strava',
        providerId,
        startTime: eventTime,
        type: activityType,
        distanceM: distanceM != null ? Math.round(distanceM) : null,
        movingTimeS: movingTimeS != null ? Math.round(movingTimeS) : null,
        avgHr: avgHr != null ? Math.round(avgHr) : null,
        maxHr: maxHr != null ? Math.round(maxHr) : null,
        rawJson: payload
      }
    });
  } catch (e: unknown) {
    const code = (e as { code?: string })?.code;
    if (code !== 'P2002') throw e;
  }

  const day = dayUTC(new Date());

  await prisma.dailyPoints.upsert({
    where: { day_userId: { day, userId } },
    update: { points: { increment: effectivePoints } },
    create: { day, userId, points: effectivePoints }
  });

  await prisma.webhookEvent.update({
    where: { eventKey },
    data: { status: 'processed', error: null }
  });

  console.log(`  scored: ${effectivePoints} pts (raw=${points}, flags=${flags.length})`);
}

async function main() {
  const redisUrl = String(process.env.REDIS_URL || 'redis://localhost:6379').trim();
  const redis = createClient({ url: redisUrl });

  redis.on('error', (err) => console.error('Redis error:', err));

  await redis.connect();
  console.log('✅ ingest worker connected. queue=', QUEUE, 'redis=', redisUrl);

  for (;;) {
    const res = await redis.brPop(QUEUE, 0);
    if (!res) continue;

    try {
      const msg = JSON.parse(res.element);
      const eventKey = String(msg?.eventKey || '');
      if (!eventKey) continue;

      await processEvent(eventKey);
      console.log('✅ processed eventKey=', eventKey);
    } catch (e: any) {
      console.error('❌ worker error:', e?.message || e);
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
