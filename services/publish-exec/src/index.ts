import Redis from "ioredis";
import fs from "node:fs";
import path from "node:path";

const REDIS_URL = process.env.REDIS_URL || "redis://127.0.0.1:6379";
const BRAIN_DIR = process.env.BRAIN_DIR || "/var/lib/parabellum/brain";

// This is where approved publish jobs land:
const Q_PUBLISH_EXEC = process.env.Q_PUBLISH_EXEC || "q:agents:publish_exec";

const outboxPath = path.join(BRAIN_DIR, "publish_outbox.jsonl");

function ensureDir(p: string) {
  fs.mkdirSync(p, { recursive: true });
}

function nowIso() {
  return new Date().toISOString();
}

async function main() {
  ensureDir(BRAIN_DIR);

  const redis = new Redis(REDIS_URL);
  console.log("✅ publish-exec online");
  console.log("REDIS_URL =", REDIS_URL);
  console.log("BRAIN_DIR =", BRAIN_DIR);
  console.log("Q_PUBLISH_EXEC =", Q_PUBLISH_EXEC);
  console.log("OUTBOX =", outboxPath);

  for (;;) {
    // BRPOP blocks until an item exists
    const res = await redis.brpop(Q_PUBLISH_EXEC, 0);
    if (!res) continue;

    const [, raw] = res;

    let msg: any = null;
    try {
      msg = JSON.parse(raw);
    } catch {
      msg = { raw };
    }

    const entry = {
      ts: nowIso(),
      kind: msg.kind || "publish_exec",
      channel: msg.channel || msg.target || "x",
      text: msg.text || msg.draft || msg.raw || raw,
      meta: msg.meta || {},
    };

    fs.appendFileSync(outboxPath, JSON.stringify(entry) + "\n", "utf8");

    console.log("📤 OUTBOX ADD:", entry.channel);
    console.log(entry.text);
    console.log("—");
  }
}

main().catch((e) => {
  console.error("❌ publish-exec crashed:", e);
  process.exit(1);
});
