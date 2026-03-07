import Redis from "ioredis"
import OpenAI from "openai"
import fs from "node:fs"

const REDIS_URL = process.env.REDIS_URL || "redis://127.0.0.1:6379"
const LOG_FILE = "/var/lib/parabellum/brain/pin-debug.log"

const redis = new Redis(REDIS_URL)

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

function log(...args: any[]) {
  const line =
    `[${new Date().toISOString()}] ` +
    args.map(x => typeof x === "string" ? x : JSON.stringify(x)).join(" ")

  console.log(line)

  try {
    fs.appendFileSync(LOG_FILE, line + "\n")
  } catch {}
}

async function pushPublish(text: string) {
  const payload = {
    kind: "publish_request",
    channel: "x",
    text,
    createdAt: new Date().toISOString()
  }

  await redis.lpush("q:agents:publish", JSON.stringify(payload))

  log("publish_request pushed", payload)
}

async function processTask(payload: any) {

  log("signal received", payload.topic)

  const completion = await openai.chat.completions.create({
    model: "gpt-4.1",
    messages: [
      {
        role: "system",
        content:
          "You are Parabellum Intelligence Network. Convert the signal into one short X post for Parabellum OS. Max 260 chars. Include #PRBL."
      },
      {
        role: "user",
        content: JSON.stringify(payload)
      }
    ]
  })

  const text = completion.choices?.[0]?.message?.content?.trim() || ""

  log("ai_output", text)

  if (!text) return

  await pushPublish(text)
}

async function run() {

  log("PIN intelligence network online")
  log("REDIS_URL", REDIS_URL)
  log("Q_TASKS q:agents:tasks")
  log("Q_PUBLISH q:agents:publish")

  while (true) {

    const task = await redis.brpop("q:agents:tasks", 0)

    if (!task) continue

    try {

      const payload = JSON.parse(task[1])

      await processTask(payload)

    } catch (err: any) {

      log("ERROR", err?.message || err)

    }

  }
}

run().catch(err => {

  log("FATAL", err)

  process.exit(1)

})
