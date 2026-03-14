import type { FastifyInstance } from "fastify"
import fs from "fs"
import { execSync } from "child_process"

type AgentName =
  | "architect"
  | "backend"
  | "frontend"
  | "devops"
  | "memory"
  | "rewards"
  | "growth"

type TaskName =
  | "check-health"
  | "sync-waitlist"
  | "prepare-rewards"
  | "check-queues"
  | "brain-status"

const BRAIN_DIR = "/var/lib/parabellum/brain"
const AGENTS_FILE = `${BRAIN_DIR}/agents.json`
const TASKS_FILE = `${BRAIN_DIR}/tasks.json`
const EXECUTIONS_FILE = `${BRAIN_DIR}/executions.jsonl`
const MEMORY_FILE = `${BRAIN_DIR}/memory.json`
const DECISIONS_FILE = `${BRAIN_DIR}/decisions.json`

function ensureBrainFiles() {
  if (!fs.existsSync(BRAIN_DIR)) fs.mkdirSync(BRAIN_DIR, { recursive: true })

  if (!fs.existsSync(AGENTS_FILE)) {
    fs.writeFileSync(
      AGENTS_FILE,
      JSON.stringify(
        [
          { name: "architect", status: "idle" },
          { name: "backend", status: "idle" },
          { name: "frontend", status: "idle" },
          { name: "devops", status: "idle" },
          { name: "memory", status: "idle" },
          { name: "rewards", status: "idle" },
          { name: "growth", status: "idle" }
        ],
        null,
        2
      )
    )
  }

  if (!fs.existsSync(TASKS_FILE)) {
    fs.writeFileSync(
      TASKS_FILE,
      JSON.stringify(
        [
          { name: "check-health", status: "ready" },
          { name: "sync-waitlist", status: "ready" },
          { name: "prepare-rewards", status: "ready" },
          { name: "check-queues", status: "ready" },
          { name: "brain-status", status: "ready" }
        ],
        null,
        2
      )
    )
  }

  if (!fs.existsSync(EXECUTIONS_FILE)) fs.writeFileSync(EXECUTIONS_FILE, "")
  if (!fs.existsSync(MEMORY_FILE)) fs.writeFileSync(MEMORY_FILE, JSON.stringify({ project: "Parabellum OS" }, null, 2))
  if (!fs.existsSync(DECISIONS_FILE)) fs.writeFileSync(DECISIONS_FILE, JSON.stringify([], null, 2))
}

function readJsonFile(path: string) {
  ensureBrainFiles()
  return JSON.parse(fs.readFileSync(path, "utf8"))
}

function appendExecution(entry: Record<string, unknown>) {
  ensureBrainFiles()
  fs.appendFileSync(EXECUTIONS_FILE, JSON.stringify(entry) + "\n")
}

function readExecutions() {
  ensureBrainFiles()
  const raw = fs.readFileSync(EXECUTIONS_FILE, "utf8").trim()
  return raw ? raw.split("\n").map(line => JSON.parse(line)) : []
}

function runLocalCommand(command: string) {
  const map: Record<string, string> = {
    demo: "/root/workspace/parabellum-os/brain-demo",
    central: "/root/workspace/parabellum-os/brain-central",
    rewards: "/root/workspace/parabellum-os/brain-rewards",
    marketing: "/root/workspace/parabellum-os/brain-marketing",
    contract: "/root/workspace/parabellum-os/brain-contract",
    autopilot: "/root/workspace/parabellum-os/brain-autopilot"
  }

  if (!map[command]) {
    return { ok: false, error: "invalid_command", available: Object.keys(map) }
  }

  try {
    const stdout = execSync(map[command], { encoding: "utf8" })
    return { ok: true, command, stdout }
  } catch (error: any) {
    return {
      ok: false,
      command,
      error: String(error?.message || error),
      stdout: String(error?.stdout || ""),
      stderr: String(error?.stderr || "")
    }
  }
}

export default async function internalRoutes(app: FastifyInstance) {
  ensureBrainFiles()

  function checkKey(request: any, reply: any) {
    const headerKey = String(request.headers["x-brain-key"] || "")
    const expectedKey = String(process.env.BRAIN_API_KEY || "")

    if (!headerKey || !expectedKey || headerKey !== expectedKey) {
      reply.code(401).send({ error: "unauthorized" })
      return false
    }
    return true
  }

  app.get("/internal/health", async (request, reply) => {
    if (!checkKey(request, reply)) return
    return { api: "ok", redis: "ok", workers: "ok", timestamp: new Date().toISOString() }
  })

  app.get("/internal/project-state", async (request, reply) => {
    if (!checkKey(request, reply)) return
    return {
      project: "Parabellum OS",
      api: "ok",
      web: "ok",
      redis: "ok",
      workers: "ok",
      waitlistConnected: false,
      walletFlowReady: false,
      referralFlowReady: false,
      rewardDistributionReady: false,
      contractsDeployed: false,
      kickoffReady: true,
      timestamp: new Date().toISOString()
    }
  })

  app.get("/internal/rewards-status", async (request, reply) => {
    if (!checkKey(request, reply)) return
    return {
      service: "rewards",
      status: "phase-a",
      engine: "online",
      distributionReady: false,
      claimsReady: false,
      timestamp: new Date().toISOString()
    }
  })

  app.get("/internal/queues-status", async (request, reply) => {
    if (!checkKey(request, reply)) return
    return {
      redis: "ok",
      queues: {
        stravaEvents: "online",
        publishExec: "online"
      },
      timestamp: new Date().toISOString()
    }
  })

  app.get("/internal/agents", async (request, reply) => {
    if (!checkKey(request, reply)) return
    const agents = readJsonFile(AGENTS_FILE)
    return { ok: true, count: agents.length, agents, timestamp: new Date().toISOString() }
  })

  app.post("/internal/agents/run", async (request, reply) => {
    if (!checkKey(request, reply)) return
    const agents = readJsonFile(AGENTS_FILE) as { name: AgentName; status: string }[]
    const body = (request.body || {}) as { agent?: AgentName; input?: string }
    const agent = agents.find(a => a.name === body.agent)

    if (!agent) {
      return reply.code(400).send({ ok: false, error: "unknown_agent", availableAgents: agents.map(a => a.name) })
    }

    const execution = {
      type: "agent_run",
      agent: agent.name,
      input: body.input || "",
      status: "accepted",
      timestamp: new Date().toISOString()
    }

    appendExecution(execution)

    return {
      ok: true,
      action: "agent_run",
      agent: agent.name,
      receivedInput: body.input || "",
      result: `agent ${agent.name} accepted task`,
      timestamp: new Date().toISOString()
    }
  })

  app.get("/internal/tasks", async (request, reply) => {
    if (!checkKey(request, reply)) return
    const tasks = readJsonFile(TASKS_FILE)
    return { ok: true, count: tasks.length, tasks, timestamp: new Date().toISOString() }
  })

  app.post("/internal/tasks/execute", async (request, reply) => {
    if (!checkKey(request, reply)) return
    const tasks = readJsonFile(TASKS_FILE) as { name: TaskName; status: string }[]
    const body = (request.body || {}) as { task?: TaskName; payload?: Record<string, unknown> }
    const task = tasks.find(t => t.name === body.task)

    if (!task) {
      return reply.code(400).send({ ok: false, error: "unknown_task", availableTasks: tasks.map(t => t.name) })
    }

    const execution = {
      type: "task_execute",
      task: task.name,
      payload: body.payload || {},
      status: "queued",
      timestamp: new Date().toISOString()
    }

    appendExecution(execution)

    return {
      ok: true,
      action: "task_execute",
      task: task.name,
      receivedPayload: body.payload || {},
      result: `task ${task.name} queued for execution`,
      timestamp: new Date().toISOString()
    }
  })

  app.get("/internal/brain/executions", async (request, reply) => {
    if (!checkKey(request, reply)) return
    const executions = readExecutions()
    return { ok: true, count: executions.length, executions, timestamp: new Date().toISOString() }
  })

  app.get("/internal/brain/memory", async (request, reply) => {
    if (!checkKey(request, reply)) return
    const memory = readJsonFile(MEMORY_FILE)
    return { ok: true, memory, timestamp: new Date().toISOString() }
  })

  app.get("/internal/brain/decisions", async (request, reply) => {
    if (!checkKey(request, reply)) return
    const decisions = readJsonFile(DECISIONS_FILE)
    return { ok: true, count: decisions.length, decisions, timestamp: new Date().toISOString() }
  })

  app.get("/internal/brain/summary", async (request, reply) => {
    if (!checkKey(request, reply)) return
    const memory = readJsonFile(MEMORY_FILE)
    const decisions = readJsonFile(DECISIONS_FILE)
    const executions = readExecutions()
    const agents = readJsonFile(AGENTS_FILE)
    const tasks = readJsonFile(TASKS_FILE)

    return {
      ok: true,
      project: "Parabellum OS",
      health: { api: "ok", redis: "ok", workers: "ok" },
      memory,
      decisionsCount: decisions.length,
      agentsCount: agents.length,
      tasksCount: tasks.length,
      executionsCount: executions.length,
      lastExecution: executions.length ? executions[executions.length - 1] : null,
      timestamp: new Date().toISOString()
    }
  })

  app.get("/internal/central-control/status", async (request, reply) => {
    if (!checkKey(request, reply)) return
    return {
      ok: true,
      centralControl: "ready",
      brain: "connected",
      osDemo: "connected",
      syncMode: "manual-phase-a",
      timestamp: new Date().toISOString()
    }
  })

  app.get("/internal/central-control/departments", async (request, reply) => {
    if (!checkKey(request, reply)) return
    return {
      ok: true,
      departments: [
        { name: "CEO", agent: "architect", status: "ready" },
        { name: "Backend", agent: "backend", status: "ready" },
        { name: "Frontend", agent: "frontend", status: "ready" },
        { name: "DevOps", agent: "devops", status: "ready" },
        { name: "Memory", agent: "memory", status: "ready" },
        { name: "Rewards", agent: "rewards", status: "ready" },
        { name: "Growth", agent: "growth", status: "ready" }
      ],
      timestamp: new Date().toISOString()
    }
  })

  app.get("/internal/central-control/demo", async (request, reply) => {
    if (!checkKey(request, reply)) return
    return {
      ok: true,
      demo: {
        product: "Parabellum OS Demo",
        web: "connected",
        api: "connected",
        rewardsLayer: "phase-a",
        wallets: "pending",
        referrals: "pending",
        waitlist: "pending"
      },
      timestamp: new Date().toISOString()
    }
  })

  app.post("/internal/central-control/sync", async (request, reply) => {
    if (!checkKey(request, reply)) return
    const execution = {
      type: "central_control_sync",
      status: "queued",
      timestamp: new Date().toISOString()
    }
    appendExecution(execution)
    return {
      ok: true,
      action: "central_control_sync",
      result: "central control sync queued",
      timestamp: new Date().toISOString()
    }
  })


  app.get("/internal/state/demo", async (request, reply) => {
    if (!checkKey(request, reply)) return
    const raw = fs.readFileSync("/var/lib/parabellum/state/demo.json", "utf8")
    return JSON.parse(raw)
  })

  app.get("/internal/state/contracts", async (request, reply) => {
    if (!checkKey(request, reply)) return
    const raw = fs.readFileSync("/var/lib/parabellum/state/contracts.json", "utf8")
    return JSON.parse(raw)
  })

  app.get("/internal/state/marketing", async (request, reply) => {
    if (!checkKey(request, reply)) return
    const raw = fs.readFileSync("/var/lib/parabellum/state/marketing.json", "utf8")
    return JSON.parse(raw)
  })


  app.get("/internal/state/intelligence", async (request, reply) => {
    if (!checkKey(request, reply)) return
    const raw = fs.readFileSync("/var/lib/parabellum/state/intelligence.json", "utf8")
    return JSON.parse(raw)
  })

  app.get("/internal/state/launch", async (request, reply) => {
    if (!checkKey(request, reply)) return
    const raw = fs.readFileSync("/var/lib/parabellum/state/launch.json", "utf8")
    return JSON.parse(raw)
  })

  app.post("/internal/brain/command", async (request, reply) => {
    if (!checkKey(request, reply)) return

    const body = (request.body || {}) as { command?: string }
    const command = String(body.command || "")

    const result = runLocalCommand(command)

    appendExecution({
      type: "brain_command",
      command,
      status: result.ok ? "executed" : "failed",
      timestamp: new Date().toISOString()
    })

    return result
  })
}
