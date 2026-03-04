import { createClient } from 'redis';

// import prisma from source (Phase A no-build)
import { prisma } from '../../../packages/db/src/client.ts';

const QUEUE = 'q:strava:events';

function dayUTC(d: Date) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0));
}

async function processEvent(eventKey: string) {
  const evt = await prisma.webhookEvent.findUnique({ where: { eventKey } });
  if (!evt) return;

  const payload: any = evt.payload as any;
  const ownerId = payload?.owner_id ? String(payload.owner_id) : null;

  if (!ownerId) {
    await prisma.webhookEvent.update({
      where: { eventKey },
      data: { status: 'failed', error: 'Missing owner_id in payload' }
    });
    return;
  }

  // Shadow user mapping (Phase A)
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

  const day = dayUTC(new Date());

  await prisma.dailyPoints.upsert({
    where: { day_userId: { day, userId } },
    update: { points: { increment: 1 } },
    create: { day, userId, points: 1 }
  });

  await prisma.webhookEvent.update({
    where: { eventKey },
    data: { status: 'processed', error: null }
  });
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
