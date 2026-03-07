import { loadEnv } from './env.js';
import { appendLog, upsertJSON } from './memory.js';
import { mkRedis, qbrpop, qpush, Q_TASKS, Q_CONTENT, Q_PUBLISH } from './queues.js';

type Task =
  | { kind: 'collect_metrics'; source: 'api'; note?: string }
  | { kind: 'draft_content'; topic: string; angle?: string }
  | { kind: 'publish_request'; channel: 'x'; text: string; media?: string[] };

function nowISO() { return new Date().toISOString(); }

async function handleTask(env: ReturnType<typeof loadEnv>, r: ReturnType<typeof mkRedis>, t: Task) {
  appendLog(env.BRAIN_DIR, 'events.log', `[${nowISO()}] task=${t.kind} payload=${JSON.stringify(t)}`);

  if (t.kind === 'collect_metrics') {
    // Phase B step 1: placeholder. In step 2 we pull real metrics from DB + API.
    upsertJSON(env.BRAIN_DIR, 'state.json', { lastMetricsAt: nowISO(), lastMetricsNote: t.note || '' });
    return;
  }

  if (t.kind === 'draft_content') {
    // Phase B step 1: create a content draft stub; later we plug LLM + brand voice.
    const draft = {
      id: `draft_${Date.now()}`,
      createdAt: nowISO(),
      topic: t.topic,
      angle: t.angle || 'default',
      status: 'needs_review',
      text: `DRAFT: ${t.topic}\nAngle: ${t.angle || 'default'}\n\n(LLM generation plugs in Phase B step 2)`
    };
    await qpush(r, Q_CONTENT, draft);
    appendLog(env.BRAIN_DIR, 'content.log', JSON.stringify(draft));
    return;
  }

  if (t.kind === 'publish_request') {
    // Approval gate: NEVER auto-post in this phase
    const req = { ...t, createdAt: nowISO(), status: 'needs_approval' };
    await qpush(r, Q_PUBLISH, req);
    appendLog(env.BRAIN_DIR, 'publish.log', JSON.stringify(req));
    return;
  }
}

async function main() {
  const env = loadEnv(process.env);
  const r = mkRedis(env.REDIS_URL);
  await r.connect();

  console.log('✅ agents service online');
  console.log('   REDIS_URL=', env.REDIS_URL);
  console.log('   BRAIN_DIR=', env.BRAIN_DIR);
  console.log('   APPROVAL_MODE=', env.APPROVAL_MODE);
  console.log('   queues=', { Q_TASKS, Q_CONTENT, Q_PUBLISH });

  for (;;) {
    const msg = await qbrpop(r, Q_TASKS, 0);
    if (!msg) continue;

    try {
      await handleTask(env, r, msg as Task);
      console.log('✅ handled task:', msg.kind);
    } catch (e: any) {
      console.error('❌ task error:', e?.message || e);
      appendLog(env.BRAIN_DIR, 'errors.log', `[${nowISO()}] ${e?.stack || e}`);
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
