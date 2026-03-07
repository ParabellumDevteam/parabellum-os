import Redis from "ioredis";
import OpenAI from "openai";
import fs from "node:fs";

const REDIS_URL = process.env.REDIS_URL || "redis://127.0.0.1:6379";
const SIGNAL_QUEUE = "q:pin:signals";
const PUBLISH_QUEUE = "q:agents:publish";
const LOG_FILE = "/var/lib/parabellum/brain/pin-debug.log";

const redis = new Redis(REDIS_URL);
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

function log(...args) {
  const line =
    `[${new Date().toISOString()}] ` +
    args.map(x => (typeof x === "string" ? x : JSON.stringify(x))).join(" ");
  console.log(line);
  try {
    fs.appendFileSync(LOG_FILE, line + "\n");
  } catch {}
}

async function pushPublish(text) {
  const payload = {
    kind: "publish_request",
    id: `pin_${Date.now()}`,
    target: "x",
    status: "needs_approval",
    text,
    createdAt: new Date().toISOString()
  };

  await redis.lpush(PUBLISH_QUEUE, JSON.stringify(payload));
  log("publish_request pushed", payload);
}

async function processTask(payload) {
  log("signal received", payload.topic || "no-topic");

  const completion = await openai.chat.completions.create({
    model: "gpt-4.1",
    messages: [
      {
        role: "system",
        content:
          "You are Parabellum Intelligence Network. Convert the signal into one short X post for Parabellum OS. Max 260 chars. Include #PRBL. Output only the final post text."
      },
      {
        role: "user",
        content: JSON.stringify(payload)
      }
    ]
  });

  const text = completion?.choices?.[0]?.message?.content?.trim() || "";
  log("ai_output", text);

  if (!text) {
    log("empty ai output");
    return;
  }

  await pushPublish(text);
}

async function loop() {
  log("PIN intelligence network online");
  log("REDIS_URL", REDIS_URL);
  log("SIGNAL_QUEUE", SIGNAL_QUEUE);
  log("PUBLISH_QUEUE", PUBLISH_QUEUE);

  while (true) {
    try {
      const raw = await redis.rpop(SIGNAL_QUEUE);

      if (raw) {
        const payload = JSON.parse(raw);
        await processTask(payload);
      } else {
        await new Promise(r => setTimeout(r, 2000));
      }
    } catch (err) {
      log("PIN ERROR", {
        message: err?.message || String(err),
        stack: err?.stack || null
      });
      await new Promise(r => setTimeout(r, 2000));
    }
  }
}

loop().catch(err => {
  log("PIN FATAL", {
    message: err?.message || String(err),
    stack: err?.stack || null
  });
  process.exit(1);
});
