import { createClient } from "redis";
import { loadEnv } from "./env.js";
import { postTweet } from "./x.js";

type PublishMsg = {
  id?: string;
  kind?: string;          // "publish_request"
  target?: string;        // "x"
  channel?: string;       // "x"
  text?: string;          // tweet content
  draft?: string;         // tweet content (fallback)
  payload?: any;
};

function pickText(msg: PublishMsg): string {
  return String(msg.text || msg.draft || msg.payload?.text || "");
}

async function main() {
  const env = loadEnv(process.env);
  const redis = createClient({ url: env.REDIS_URL });

  redis.on("error", (e) => console.error("Redis error:", e));

  await redis.connect();
  console.log("✅ x-publisher online");
  console.log("queue=", env.Q_PUBLISH, "storageState=", env.X_STORAGE_STATE, "dryRun=", env.X_DRY_RUN);

  for (;;) {
    const res = await redis.brPop(env.Q_PUBLISH, 0);
    if (!res) continue;

    try {
      const msg = JSON.parse(res.element) as PublishMsg;

      // Only handle X publishes
      const target = (msg.target || msg.channel || "").toLowerCase();
      if (target !== "x") {
        // Not ours, ignore (or requeue later if you want routing)
        continue;
      }

      const text = pickText(msg).trim();
      if (!text) continue;

      if (env.X_DRY_RUN === "1") {
        console.log("🟡 DRY_RUN tweet:", text);
        continue;
      }

      await postTweet(env.X_STORAGE_STATE, text);
      console.log("✅ tweeted:", text.slice(0, 80));
    } catch (e: any) {
      console.error("❌ x-publisher error:", e?.message || e);
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
