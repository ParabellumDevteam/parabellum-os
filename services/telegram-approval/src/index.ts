import { Telegraf, Markup } from "telegraf";
import Redis from "ioredis";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";
const ADMIN_ID = (process.env.TELEGRAM_ADMIN_ID || "").trim();
const REDIS_URL = process.env.REDIS_URL || "redis://127.0.0.1:6379";

const APPROVAL_MODE = (process.env.APPROVAL_MODE || "manual").toLowerCase();

// queues
const Q_PUBLISH = process.env.Q_PUBLISH || "q:agents:publish";
const Q_PUBLISH_EXEC = process.env.Q_PUBLISH_EXEC || "q:agents:publish_exec";

// lock to prevent double instances (fixes 409)
const LOCK_KEY = process.env.TELEGRAM_LOCK_KEY || "lock:telegram-approval";
const LOCK_TTL_MS = 60_000;

function requireEnv() {
  if (!BOT_TOKEN || BOT_TOKEN.length < 10) throw new Error("TELEGRAM_BOT_TOKEN missing/invalid");
  if (!ADMIN_ID || !/^\d+$/.test(ADMIN_ID)) throw new Error("TELEGRAM_ADMIN_ID missing/invalid (must be numeric)");
}

function isAdmin(ctx: any) {
  const fromId = String(ctx.from?.id || "");
  return fromId === String(ADMIN_ID);
}

function short(s: string, n = 240) {
  if (!s) return "";
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
}

async function safeAnswerCb(ctx: any, text: string) {
  try {
    await ctx.answerCbQuery(text, { show_alert: false });
  } catch {
    // ignore "query is too old" etc.
  }
}

type PublishReq = {
  kind?: string;
  id?: string;
  target?: string;   // "x"
  channel?: string;  // alias
  text?: string;     // draft
  draft?: string;
  status?: string;   // "needs_approval"
  createdAt?: string;
  [k: string]: any;
};

function getId(p: PublishReq) {
  return String(p.id || p.approvalId || p.createdAt || Date.now());
}
function getTarget(p: PublishReq) {
  return String(p.target || p.channel || "x");
}
function getText(p: PublishReq) {
  return String(p.text || p.draft || "");
}

async function main() {
  requireEnv();

  const redis = new Redis(REDIS_URL);

  // acquire lock
  const lockVal = `${process.pid}:${Date.now()}`;
  const ok = await redis.set(LOCK_KEY, lockVal, "PX", LOCK_TTL_MS, "NX");
  if (!ok) {
    console.error("❌ Another telegram-approval instance is running (lock exists). Exiting.");
    process.exit(1);
  }
  // refresh lock
  const lockTimer = setInterval(async () => {
    try {
      const cur = await redis.get(LOCK_KEY);
      if (cur !== lockVal) {
        console.error("❌ Lost lock. Exiting to avoid 409.");
        process.exit(1);
      }
      await redis.pexpire(LOCK_KEY, LOCK_TTL_MS);
    } catch {}
  }, 20_000);

  const bot = new Telegraf(BOT_TOKEN);

  async function listPending(limit = 5) {
    const raw = await redis.lrange(Q_PUBLISH, 0, 200);
    const items: PublishReq[] = [];
    for (const r of raw) {
      try {
        const p = JSON.parse(r);
        if ((p.kind || "") !== "publish_request") continue;
        if ((p.status || "") !== "needs_approval") continue;
        const id = getId(p);
        const approved = await redis.get(`approval:${id}`);
        if (approved) continue;
        items.push(p);
        if (items.length >= limit) break;
      } catch {}
    }
    return items;
  }

  async function approve(id: string, payload: PublishReq) {
    // idempotency
    const already = await redis.get(`approval:${id}`);
    if (already) return { ok: true, msg: "Already approved." };

    await redis.set(`approval:${id}`, "approved", "EX", 7 * 24 * 3600);

    const execPayload = {
      kind: "publish_exec",
      channel: getTarget(payload),
      text: getText(payload),
      meta: { approval_id: id, source: "telegram-approval", createdAt: new Date().toISOString() }
    };

    await redis.lpush(Q_PUBLISH_EXEC, JSON.stringify(execPayload));
    return { ok: true, msg: "Approved ✅ queued for execution." };
  }

  async function reject(id: string) {
    await redis.set(`approval:${id}`, "rejected", "EX", 7 * 24 * 3600);
    return { ok: true, msg: "Rejected ❌" };
  }

  bot.start(async (ctx) => {
    if (!isAdmin(ctx)) return ctx.reply("Unauthorized.");
    return ctx.reply("✅ Parabellum Approval Console online.\nCommands: /status /pending /pause /resume");
  });

  bot.command("status", async (ctx) => {
    if (!isAdmin(ctx)) return ctx.reply("Unauthorized.");
    const pending = await listPending(20);
    return ctx.reply(`Status OK\nPending publish approvals: ${pending.length}\nMode: ${APPROVAL_MODE}`);
  });

  bot.command("pending", async (ctx) => {
    if (!isAdmin(ctx)) return ctx.reply("Unauthorized.");

    const pending = await listPending(5);
    if (!pending.length) return ctx.reply("📭 No pending approvals.");

    await ctx.reply(`📥 Showing up to ${pending.length} pending items...`);
    for (const p of pending) {
      const id = getId(p);
      const target = getTarget(p);
      const txt = getText(p);

      await ctx.reply(
        `📝 Approval #${id}\nkind=publish_request\ntarget=${target}\n\nDraft: ${txt}`,
        Markup.inlineKeyboard([
          Markup.button.callback("✅ Approve", `ap:${id}`),
          Markup.button.callback("❌ Reject", `rj:${id}`)
        ])
      );
    }
  });

  bot.action(/^ap:(.+)$/, async (ctx) => {
    if (!isAdmin(ctx)) return safeAnswerCb(ctx, "Unauthorized.");
    const id = String(ctx.match?.[1] || "");

    // find payload by id in queue snapshot
    const raw = await redis.lrange(Q_PUBLISH, 0, 500);
    let payload: PublishReq | null = null;
    for (const r of raw) {
      try {
        const p = JSON.parse(r);
        if ((p.kind || "") !== "publish_request") continue;
        if (getId(p) === id) { payload = p; break; }
      } catch {}
    }
    if (!payload) {
      await safeAnswerCb(ctx, "Not found / already handled.");
      return;
    }

    const res = await approve(id, payload);
    await safeAnswerCb(ctx, res.msg);

    // remove buttons so user can't re-click forever (ignore failures)
    try { await ctx.editMessageReplyMarkup(undefined); } catch {}
  });

  bot.action(/^rj:(.+)$/, async (ctx) => {
    if (!isAdmin(ctx)) return safeAnswerCb(ctx, "Unauthorized.");
    const id = String(ctx.match?.[1] || "");
    const res = await reject(id);
    await safeAnswerCb(ctx, res.msg);
    try { await ctx.editMessageReplyMarkup(undefined); } catch {}
  });

  bot.command("pause", async (ctx) => {
    if (!isAdmin(ctx)) return ctx.reply("Unauthorized.");
    await redis.set("approval:paused", "1");
    return ctx.reply("⏸ Paused.");
  });

  bot.command("resume", async (ctx) => {
    if (!isAdmin(ctx)) return ctx.reply("Unauthorized.");
    await redis.del("approval:paused");
    return ctx.reply("▶️ Resumed.");
  });

  bot.catch((err) => {
    console.error("telegram-approval error:", err);
  });

  console.log("✅ telegram-approval online");
  console.log("REDIS_URL =", REDIS_URL);
  console.log("Q_PUBLISH =", Q_PUBLISH);
  console.log("Q_PUBLISH_EXEC =", Q_PUBLISH_EXEC);
  console.log("APPROVAL_MODE =", APPROVAL_MODE);

  await bot.launch({ dropPendingUpdates: true });

  const shutdown = async () => {
    clearInterval(lockTimer);
    try {
      const cur = await redis.get(LOCK_KEY);
      if (cur === lockVal) await redis.del(LOCK_KEY);
    } catch {}
    try { await redis.quit(); } catch {}
    process.exit(0);
  };

  process.once("SIGINT", shutdown);
  process.once("SIGTERM", shutdown);
}

main().catch((e) => {
  console.error("❌ fatal:", e);
  process.exit(1);
});
