"use client"

import { useEffect, useState } from "react"

type StateData = {
  demo?: any
  contracts?: any
  marketing?: any
  launch?: any
  intelligence?: any
}

async function getState(path: string) {
  const r = await fetch("/api/brain-command", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      command: "fetch",
      path
    })
  })

  return r.json()
}

async function runCommand(command: string) {
  const r = await fetch("/api/brain-command", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ command })
  })

  return r.json()
}

function cardStyle() {
  return {
    background: "rgba(8,15,45,0.82)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 18,
    padding: 18,
    boxShadow: "0 10px 40px rgba(0,0,0,0.25)"
  } as React.CSSProperties
}

function btnStyle() {
  return {
    background: "#e5e7eb",
    color: "#111827",
    border: "none",
    borderRadius: 12,
    padding: "14px 16px",
    fontWeight: 800,
    fontSize: 15,
    width: "100%"
  } as React.CSSProperties
}

function StatusRow({ label, value }: { label: string; value: any }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        gap: 12,
        padding: "8px 0",
        borderBottom: "1px solid rgba(255,255,255,0.06)"
      }}
    >
      <span style={{ color: "#93c5fd" }}>{label}</span>
      <span style={{ color: "#f8fafc", textAlign: "right" }}>{String(value)}</span>
    </div>
  )
}

export default function BrainPage() {
  const [data, setData] = useState<StateData | null>(null)
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState<string | null>(null)

  async function refresh() {
    const [demo, contracts, marketing, launch, intelligence] = await Promise.all([
      getState("/internal/state/demo"),
      getState("/internal/state/contracts"),
      getState("/internal/state/marketing"),
      getState("/internal/state/launch"),
      getState("/internal/state/intelligence")
    ])

    setData({ demo, contracts, marketing, launch, intelligence })
  }

  async function exec(command: string) {
    setLoading(command)
    try {
      const r = await runCommand(command)
      setResult(r)
      await refresh()
    } finally {
      setLoading(null)
    }
  }

  useEffect(() => {
    refresh()
  }, [])

  return (
    <main
      style={{
        padding: 24,
        fontFamily: "Arial, sans-serif",
        background: "radial-gradient(circle at top, #18245d 0%, #050b24 38%, #030617 100%)",
        minHeight: "100vh",
        color: "#e2e8f0"
      }}
    >
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 20,
            padding: "16px 20px",
            borderRadius: 20,
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)"
          }}
        >
          <div>
            <div style={{ fontSize: 14, letterSpacing: 2, color: "#93c5fd" }}>PARABELLUM OS</div>
            <div style={{ fontSize: 34, fontWeight: 800 }}>Mission Control</div>
          </div>

          <button
            onClick={refresh}
            style={{
              background: "#1d4ed8",
              color: "#fff",
              border: "none",
              borderRadius: 12,
              padding: "12px 16px",
              fontWeight: 800
            }}
          >
            REFRESH
          </button>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))",
            gap: 16,
            marginBottom: 16
          }}
        >
          <div style={cardStyle()}>
            <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 10 }}>Demo</div>
            <StatusRow label="UI Ready" value={data?.demo?.ui_ready} />
            <StatusRow label="Brain Connected" value={data?.demo?.brain_connected} />
            <StatusRow label="Central Connected" value={data?.demo?.central_control_connected} />
            <StatusRow label="Last Check" value={data?.demo?.demo_last_check} />
          </div>

          <div style={cardStyle()}>
            <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 10 }}>Contracts</div>
            <StatusRow label="Network" value={data?.contracts?.network} />
            <StatusRow label="Wallet Funded" value={data?.contracts?.wallet_funded} />
            <StatusRow label="PRBL Deployed" value={data?.contracts?.prbl_contract_deployed} />
            <StatusRow label="Rewards Deployed" value={data?.contracts?.rewards_contract_deployed} />
            <StatusRow label="Deploy Wallet" value={data?.contracts?.deploy_wallet} />
          </div>

          <div style={cardStyle()}>
            <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 10 }}>Marketing</div>
            <StatusRow label="Atahualpa Active" value={data?.marketing?.atahualpa_active} />
            <StatusRow label="Waitlist Active" value={data?.marketing?.waitlist_active} />
            <StatusRow label="Referral Ready" value={data?.marketing?.referral_ready} />
            <StatusRow label="Campaigns Running" value={data?.marketing?.campaigns_running} />
          </div>

          <div style={cardStyle()}>
            <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 10 }}>Launch</div>
            <StatusRow label="Kickstarter Ready" value={data?.launch?.kickstarter_ready} />
            <StatusRow label="Demo Ready" value={data?.launch?.demo_ready} />
            <StatusRow label="Rewards Ready" value={data?.launch?.rewards_ready} />
            <StatusRow label="Contracts Ready" value={data?.launch?.contracts_ready} />
            <StatusRow label="Marketing Ready" value={data?.launch?.marketing_ready} />
          </div>
        </div>

        <div style={cardStyle()}>
          <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 14 }}>Intelligence Panel</div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
              gap: 16
            }}
          >
            <div>
              <div style={{ fontWeight: 800, marginBottom: 10 }}>Waitlist</div>
              <StatusRow label="Total Leads" value={data?.intelligence?.waitlist?.total_leads} />
              <StatusRow label="Qualified Leads" value={data?.intelligence?.waitlist?.qualified_leads} />
              <StatusRow label="Referrals" value={data?.intelligence?.waitlist?.referrals} />
            </div>

            <div>
              <div style={{ fontWeight: 800, marginBottom: 10 }}>Wallets</div>
              <StatusRow label="Registered Wallets" value={data?.intelligence?.wallets?.registered_wallets} />
              <StatusRow label="Connected Wallets" value={data?.intelligence?.wallets?.connected_wallets} />
              <StatusRow label="Deploy Wallet Tracked" value={data?.intelligence?.wallets?.deploy_wallet_tracked} />
            </div>

            <div>
              <div style={{ fontWeight: 800, marginBottom: 10 }}>Rewards</div>
              <StatusRow label="Eligible Users" value={data?.intelligence?.rewards?.eligible_users} />
              <StatusRow label="Pending Distributions" value={data?.intelligence?.rewards?.pending_distributions} />
              <StatusRow label="PRBL Preview" value={data?.intelligence?.rewards?.total_prbl_preview} />
            </div>

            <div>
              <div style={{ fontWeight: 800, marginBottom: 10 }}>Campaigns</div>
              <StatusRow label="Active Campaigns" value={data?.intelligence?.campaigns?.active_campaigns} />
              <StatusRow label="Atahualpa Sequences" value={data?.intelligence?.campaigns?.atahualpa_sequences} />
              <StatusRow label="Content Ready" value={data?.intelligence?.campaigns?.content_pieces_ready} />
            </div>
          </div>
        </div>

        <div style={{ height: 16 }} />

        <div style={cardStyle()}>
          <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 14 }}>Operations</div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))",
              gap: 14
            }}
          >
            <button style={btnStyle()} onClick={() => exec("demo")}>
              {loading === "demo" ? "RUNNING..." : "RUN DEMO"}
            </button>

            <button style={btnStyle()} onClick={() => exec("central")}>
              {loading === "central" ? "RUNNING..." : "SYNC CENTRAL"}
            </button>

            <button style={btnStyle()} onClick={() => exec("rewards")}>
              {loading === "rewards" ? "RUNNING..." : "RUN REWARDS"}
            </button>

            <button style={btnStyle()} onClick={() => exec("marketing")}>
              {loading === "marketing" ? "RUNNING..." : "RUN MARKETING"}
            </button>

            <button style={btnStyle()} onClick={() => exec("contract")}>
              {loading === "contract" ? "RUNNING..." : "RUN CONTRACT"}
            </button>

            <button style={btnStyle()} onClick={() => exec("autopilot")}>
              {loading === "autopilot" ? "RUNNING..." : "FULL AUTOPILOT"}
            </button>
          </div>
        </div>

        <div style={{ height: 16 }} />

        <div style={cardStyle()}>
          <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 14 }}>Last Command Result</div>
          <pre
            style={{
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              margin: 0,
              fontSize: 12,
              lineHeight: 1.5,
              color: "#dbeafe"
            }}
          >
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      </div>
    </main>
  )
}
