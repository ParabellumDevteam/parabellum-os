module.exports = {
  apps: [
    {
      name: "parabellum-brain-api",
      cwd: "/root/workspace/parabellum-os",
      script: "bash",
      args: "-lc 'export $(grep -v \"^#\" .env | xargs) && npx tsx apps/api/src/index.ts'",
      autorestart: true,
      watch: false,
      max_restarts: 20
    },
    {
      name: "parabellum-web",
      cwd: "/root/workspace/parabellum-os/apps/web",
      script: "bash",
      args: "-lc 'npm run dev'",
      autorestart: true,
      watch: false,
      max_restarts: 20
    },
    {
      name: "parabellum-central-control",
      cwd: "/opt/parabellum-command-center",
      script: "bash",
      args: "-lc 'npm run dev'",
      autorestart: true,
      watch: false,
      max_restarts: 20
    },
    {
      name: "parabellum-overnight",
      cwd: "/root/workspace/parabellum-os",
      script: "bash",
      args: "-lc './brain-overnight'",
      autorestart: true,
      watch: false,
      max_restarts: 20
    }
  ]
}
