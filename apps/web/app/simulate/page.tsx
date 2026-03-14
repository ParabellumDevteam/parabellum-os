'use client';

import { useEffect, useState } from 'react';

type Preset = { name: string; distanceKm: string; durationMin: number; avgHr: number };
type SimResult = { ok: boolean; preset: string; ownerId: number; eventKey: string };

export default function SimulatePage() {
  const [presets, setPresets] = useState<Preset[]>([]);
  const [results, setResults] = useState<SimResult[]>([]);
  const [sending, setSending] = useState<string | null>(null);
  const [ownerId, setOwnerId] = useState('');

  useEffect(() => {
    fetch('/api/v1/demo/presets')
      .then(r => r.json())
      .then(data => { if (data.ok) setPresets(data.presets); })
      .catch(() => {});
  }, []);

  async function simulate(preset: string) {
    setSending(preset);
    try {
      const body: Record<string, unknown> = { preset };
      if (ownerId.trim()) body.owner_id = Number(ownerId);

      const res = await fetch('/api/v1/demo/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (data.ok) {
        setResults(prev => [data, ...prev].slice(0, 10));
      }
    } catch { /* ignore */ }
    finally { setSending(null); }
  }

  const icons: Record<string, string> = {
    easy_run: '🏃', morning_run: '🌅', long_run: '🏃‍♂️', hiit: '⚡', cycling: '🚴', walk: '🚶'
  };

  return (
    <>
      <section className="card">
        <h1 className="h1">Activity Simulator</h1>
        <p className="p">
          Simulate Strava webhook events to see the full pipeline in action:
          webhook → ingest → effort scoring → daily points → reward epochs.
        </p>

        <div className="sim-owner">
          <label className="k" htmlFor="ownerId">Strava Owner ID (optional)</label>
          <input
            id="ownerId"
            type="text"
            className="input"
            placeholder="Random if empty"
            value={ownerId}
            onChange={e => setOwnerId(e.target.value)}
            style={{ maxWidth: 240, marginTop: 6 }}
          />
        </div>

        <div className="preset-grid">
          {presets.map(p => (
            <button
              key={p.name}
              className="preset-card"
              onClick={() => simulate(p.name)}
              disabled={sending === p.name}
            >
              <div className="preset-icon">{icons[p.name] ?? '🏋️'}</div>
              <div className="preset-name">{p.name.replace(/_/g, ' ')}</div>
              <div className="preset-meta">{p.distanceKm} km · {p.durationMin} min · ♥{p.avgHr}</div>
              {sending === p.name && <div className="preset-sending">Sending…</div>}
            </button>
          ))}
        </div>
      </section>

      {results.length > 0 && (
        <section className="card">
          <h2 className="h2">Simulation Log</h2>
          <div className="sim-log">
            {results.map((r, i) => (
              <div key={i} className="sim-entry">
                <span className="sim-ok">✓</span>
                <span className="sim-preset">{r.preset.replace(/_/g, ' ')}</span>
                <span className="sim-detail">owner={r.ownerId}</span>
                <span className="mono sim-key">{r.eventKey.slice(0, 12)}…</span>
              </div>
            ))}
          </div>
          <div className="s" style={{marginTop: 10}}>
            Events are queued in Redis → processed by the ingest worker → scored → points added.
            Check the <a href="/" className="link-inline">Dashboard</a> to see updated points.
          </div>
        </section>
      )}

      <nav className="nav-bar">
        <a href="/" className="nav-link">Dashboard</a>
        <a href="/activities" className="nav-link">Activities</a>
        <a href="/rewards" className="nav-link">Rewards</a>
        <a href="/simulate" className="nav-link active">Simulate</a>
      </nav>
    </>
  );
}
