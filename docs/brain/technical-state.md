# PARABELLUM OS — TECHNICAL STATE

## Stack
- VPS-first
- Ubuntu
- tmux workflow on mobile
- monorepo structure
- Fastify API
- Prisma + Postgres
- Redis queues
- worker services
- Telegram approval bot
- publish executor
- agents service
- signals service
- alien-reactor service
- Foundry contracts

## Current Backend
Working pipeline:
Webhook -> Redis queue -> Worker -> DailyPoints -> Reward logic scaffolding

## Services
Known services in systemd:
- parabellum-agents
- parabellum-telegram
- parabellum-publish
- parabellum-signals
- parabellum-alien-reactor

## Redis Queues
Main queues:
- q:agents:tasks
- q:agents:content
- q:agents:publish
- q:agents:publish_exec

## Telegram Approval
Approval bot works as command center.
It is used for:
- /status
- /pending
- approve / reject flows

Current issue pattern seen before:
- duplicate instances caused lock conflicts
- solved by single-instance service + redis lock cleanup

## Publish Layer
Current publish mode:
- outbox only
- not auto-posting to X yet
- writes to /var/lib/parabellum/brain/publish_outbox.jsonl

## Brain Storage
Main path:
/var/lib/parabellum/brain

Important files:
- events.log
- content.log
- publish.log
- errors.log
- state.json
- publish_outbox.jsonl

## Smart Contracts
Contracts project exists under contracts/prbl

Status:
- contracts compile
- deploy script works
- Polygon Amoy broadcast blocked by insufficient POL balance
- next step is fund wallet and re-run broadcast

Contracts:
- PRBLToken
- PRBLRewardsDistributor

## Token Constraints
- max supply = 777,777,777,777
- decimals = 9
- 1 year lock / non-tradable concept
- rewards distributor for claims

## Missing / Next Technical Priorities
1. finish real token engine backend
2. connect Strava OAuth properly
3. stabilize publish executor / growth flow
4. build waitlist / sales landing
5. integrate agent runner for autonomous coding loops

## Deployment Pattern
Desired deployment model:
- GitHub repo
- VPS sync
- systemd services
- no manual nano edits
- full-file replace strategy
- copy/paste commands only

## Mobile Workflow Constraint
Everything must be operable from mobile through tmux.
Commands must be copy-paste friendly.
No editor-dependent workflow.
