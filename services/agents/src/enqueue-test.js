import { createClient } from 'redis';

const REDIS_URL = process.env.REDIS_URL;
if (!REDIS_URL) {
  console.error('Missing REDIS_URL');
  process.exit(1);
}

const Q_TASKS = 'q:agents:tasks';

const r = createClient({ url: REDIS_URL });
r.on('error', (e) => console.error('Redis error:', e));

await r.connect();

const tasks = [
  { kind: 'collect_metrics', source: 'api', note: 'Phase B step 1 smoke test' },
  { kind: 'draft_content', topic: 'PRBL token + discipline score: why it matters', angle: 'futuristic minimal' },
  { kind: 'publish_request', channel: 'x', text: 'Draft: Parabellum OS is building discipline infrastructure. Waitlist soon. #PRBL' }
];

for (const t of tasks) {
  await r.lPush(Q_TASKS, JSON.stringify(t));
  console.log('queued:', t.kind);
}

await r.quit();
