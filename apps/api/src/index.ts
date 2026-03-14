import brainCommand from "./routes/brain-command"
import "dotenv/config"
import Fastify from "fastify"
import internalRoutes from "./routes/internal.ts"

const app = Fastify({ logger: true })
import cors from "@fastify/cors"

await app.register(cors, {
  origin: true
})
await app.register(internalRoutes)

await app.listen({
  port: 3001,
  host: "0.0.0.0"
})

console.log("Parabellum API running on 3001")
