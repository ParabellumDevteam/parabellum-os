import Redis from "ioredis";

const redis = new Redis(process.env.REDIS_URL || "redis://127.0.0.1:6379");

const Q = process.env.Q_PUBLISH || "q:agents:publish";

async function run() {

  const id = "growth_" + Date.now();

  const payload = {
    kind: "publish_request",
    id,
    target: "x",
    text:
`Discipline is disappearing.

Parabellum OS is building a system where:

• training
• consistency
• progress

are measurable.

And rewarded.

Join the waitlist.

#PRBL`,
    status: "needs_approval",
    createdAt: new Date().toISOString()
  };

  await redis.lpush(Q, JSON.stringify(payload));

  console.log("growth publish_request queued:", id);

  await redis.quit();
}

run();
