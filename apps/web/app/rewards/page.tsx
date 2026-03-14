'use client';

import { useEffect, useState } from 'react';

type Epoch = {
  id: string;
  day: string;
  createdAt: string;
  merkleRoot: string;
  dailyPool: number;
  globalCap: number;
  yearIndex: number;
};

export default function RewardsPage() {
  const [epochs, setEpochs] = useState<Epoch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/v1/rewards/epochs')
      .then(r => r.json())
      .then(data => { if (data.ok) setEpochs(data.epochs); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <section className="card">
        <h1 className="h1">Reward Epochs</h1>
        <p className="p">
          Each day, effort points are tallied and PRBL rewards are distributed proportionally
          (capped at 35 per user). Phase B adds Merkle proofs for on-chain claiming.
        </p>

        {loading ? (
          <div className="p">Loading epochs…</div>
        ) : epochs.length === 0 ? (
          <div className="panel">
            <div className="k">No Epochs</div>
            <div className="v">—</div>
            <div className="s">No reward epochs have been built yet. Trigger one via the admin API.</div>
          </div>
        ) : (
          <div className="epoch-list">
            {epochs.map(ep => (
              <div key={ep.id} className="panel epoch-card">
                <div className="epoch-header">
                  <div>
                    <div className="k">Epoch</div>
                    <div className="v">{new Date(ep.day).toISOString().slice(0, 10)}</div>
                  </div>
                  <div className="epoch-meta">
                    <span className="badge">Year {ep.yearIndex}</span>
                  </div>
                </div>
                <div className="epoch-stats">
                  <div>
                    <div className="k">Pool</div>
                    <div className="s">{ep.dailyPool.toLocaleString()} PRBL</div>
                  </div>
                  <div>
                    <div className="k">Global Cap</div>
                    <div className="s">{ep.globalCap.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="k">Root</div>
                    <div className="s mono">{ep.merkleRoot.slice(0, 16)}…</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <nav className="nav-bar">
        <a href="/" className="nav-link">Dashboard</a>
        <a href="/activities" className="nav-link">Activities</a>
        <a href="/rewards" className="nav-link active">Rewards</a>
        <a href="/simulate" className="nav-link">Simulate</a>
      </nav>
    </>
  );
}
