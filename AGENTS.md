# AGENTS.md

## Cursor Cloud specific instructions

### Project overview

Parabellum OS is a fitness-to-crypto rewards platform (monorepo via npm workspaces + Turborepo). Key workspaces:

| Workspace | Path | Dev command |
|---|---|---|
| API (Fastify) | `apps/api` | `tsx watch src/index.ts` (port 3001) |
| Web (Next.js) | `apps/web` | `next dev -p 3000` |
| Ingest worker | `services/ingest` | `tsx watch src/worker.ts` |
| DB (Prisma) | `packages/db` | `prisma generate` / `prisma db push` |
| Core (tokenomics) | `packages/core` | library, no server |
| Scoring | `services/scoring` | library in Phase A |
| Rewards | `services/rewards` | library in Phase A |

### Infrastructure

PostgreSQL 16 and Redis 7 run via Docker Compose at `infra/docker/docker-compose.yml`. Start them with:

```
sudo dockerd &>/tmp/dockerd.log &
sleep 3
sudo docker compose -f /workspace/infra/docker/docker-compose.yml up -d
```

### Environment variables

Create `/workspace/.env` and `/workspace/packages/db/.env` with at minimum:

```
DATABASE_URL=postgresql://parabellum:parabellum@localhost:5432/parabellum
REDIS_URL=redis://localhost:6379
JWT_SECRET=dev-secret-key-for-local-development
```

The API also reads `STRAVA_WEBHOOK_VERIFY_TOKEN`, `STRAVA_CALLBACK_URL`, `GENESIS_DATE_ISO`, and `BASE_DAILY_GLOBAL_CAP` but these are not in the Zod env schema (`apps/api/src/env.ts`) so they pass through as `undefined`. This is a known Phase A limitation.

### Running services

The API and ingest worker need env vars sourced before starting:

```
set -a && source /workspace/.env && set +a
```

Then use `npm run dev` from root (runs all workspaces via Turborepo), or start individually:

- API: `cd apps/api && npx tsx watch src/index.ts`
- Web: `cd apps/web && npx next dev -p 3000`
- Ingest: `cd services/ingest && npx tsx watch src/worker.ts`

### Database setup

After starting Postgres, generate the Prisma client and push the schema:

```
cd packages/db && npx prisma generate && npx prisma db push
```

Migrations are gitignored; use `prisma db push` for dev sync.

### Gotchas

- Node 20 is required (matches CI). Use `nvm use 20`.
- The `packageManager` field specifies `npm@11.11.0`. Install with `npm install -g npm@11.11.0`.
- `npm run build` fails on `@parabellum/web` due to ESLint parsing errors (root `.eslintrc.cjs` lacks TypeScript/JSX parser). This is a known repo issue; dev mode (`next dev`) works fine.
- Lint and test scripts in most workspaces are placeholders (`node -e "console.log(...)"`).
- The ingest worker imports Prisma client via relative path (`../../../packages/db/src/client.ts`) — this works with tsx but won't survive a build step.

### Standard commands

See `package.json` scripts: `npm run dev`, `npm run lint`, `npm run test`, `npm run build`, `npm run format`.
