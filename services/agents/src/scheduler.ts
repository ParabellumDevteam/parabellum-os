import Redis from "ioredis";
import crypto from "crypto";

const REDIS_URL = process.env.REDIS_URL || "redis://127.0.0.1:6379";
const Q_TASKS = process.env.Q_TASKS || "q:agents:tasks";
const Q_CONTENT = process.env.Q_CONTENT || "q:agents:content";
const Q_PUBLISH = process.env.Q_PUBLISH || "q:agents:publish";

function id(prefix: string) {
  return prefix + "_" + Date.now() + "_" + crypto.randomBytes(3).toString("hex");
}

async function push(redis: Redis, q: string, payload: any) {
  await redis.lpush(q, JSON.stringify(payload));
  console.log("queued", q, payload.kind || payload.type, payload.id || "");
}

async function main() {
  const redis = new Redis(REDIS_URL);

  const now = new Date().toISOString();
  const mode = process.argv[2] || "daily";

  // Always collect lightweight metrics
  await push(redis, Q_TASKS, {
    id: id("metrics"),
    kind: "collect_metrics",
    source: `scheduler:${mode}`,
    createdAt: now,
  });

  if (mode === "daily") {
    // 1 tweet/day
    await push(redis, Q_CONTENT, {
      id: id("draft"),
      kind: "draft_content",
      platform: "x",
      format: "tweet",
      topic: "Parabellum OS + PRBL token",
      angle: "futuristic minimal",
      cta: "Join the waitlist",
      constraints: { maxChars: 260, includeHashtags: true },
      createdAt: now,
    });

    await push(redis, Q_PUBLISH, {
      id: id("publish"),
      kind: "publish_request",
      target: "x",
      format: "tweet",
      status: "needs_approval",
      // text will be filled by the agent; fallback text:
      text: "Draft: Parabellum OS is building discipline infrastructure. Waitlist soon. #PRBL",
      createdAt: now,
    });
  }

  if (mode === "weekly") {
    // 1 thread/week (6-8 tweets)
    await push(redis, Q_CONTENT, {
      id: id("thread"),
      kind: "draft_content",
      platform: "x",
      format: "thread",
      topic: "Why PRBL + discipline scoreboard matters",
      angle: "founder build-in-public",
      cta: "Join the waitlist",
      constraints: { tweets: 7, perTweetMaxChars: 260, includeHashtags: true },
      createdAt: now,
    });

    await push(redis, Q_PUBLISH, {
      id: id("publish_thread"),
      kind: "publish_request",
      target: "x",
      format: "thread",
      status: "needs_approval",
      text: "Draft thread placeholder (agent will replace).",
      createdAt: now,
    });
  }

  await redis.quit();
  console.log("✅ scheduler done:", mode);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
