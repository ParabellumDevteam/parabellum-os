import Redis from "ioredis"

const redis = new Redis(process.env.REDIS_URL || "redis://127.0.0.1:6379")

async function push(text: string) {
  await redis.lpush(
    "q:agents:publish",
    JSON.stringify({
      kind: "publish_request",
      channel: "x",
      text,
      createdAt: new Date().toISOString()
    })
  )
}

export default push
