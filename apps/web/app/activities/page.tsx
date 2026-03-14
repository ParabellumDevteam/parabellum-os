'use client';

import { useEffect, useState } from 'react';

type Activity = {
  id: string;
  provider: string;
  providerId: string;
  type: string;
  startTime: string;
  distanceM: number | null;
  movingTimeS: number | null;
  elapsedTimeS: number | null;
  avgHr: number | null;
  maxHr: number | null;
  createdAt: string;
};

export default function ActivitiesPage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [authed, setAuthed] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('prbl_token');
    if (!token) { setAuthed(false); setLoading(false); return; }

    fetch('/api/v1/user/activities', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => { if (data.ok) setActivities(data.activities); else if (data.error === 'UNAUTHORIZED') setAuthed(false); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <section className="card">
        <h1 className="h1">Activity Log</h1>
        <p className="p">Your tracked activities with effort scoring from the Discipline Engine.</p>

        {!authed ? (
          <div className="panel">
            <div className="k">Not logged in</div>
            <div className="s">Connect your wallet on the <a href="/" className="link-inline">Dashboard</a> to see your activities.</div>
          </div>
        ) : loading ? (
          <div className="p">Loading activities…</div>
        ) : activities.length === 0 ? (
          <div className="panel">
            <div className="k">No Activities</div>
            <div className="v">—</div>
            <div className="s">No activities recorded yet. <a href="/simulate" className="link-inline">Simulate one</a> to see how scoring works.</div>
          </div>
        ) : (
          <div className="activity-list">
            {activities.map(a => (
              <div key={a.id} className="activity-card">
                <div className="activity-card-header">
                  <div className="activity-type-badge">{a.type}</div>
                  <div className="activity-date">{new Date(a.startTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                </div>
                <div className="activity-stats">
                  {a.distanceM != null && (
                    <div className="stat">
                      <div className="k">Distance</div>
                      <div className="stat-v">{(a.distanceM / 1000).toFixed(1)} km</div>
                    </div>
                  )}
                  {a.movingTimeS != null && (
                    <div className="stat">
                      <div className="k">Duration</div>
                      <div className="stat-v">{Math.round(a.movingTimeS / 60)} min</div>
                    </div>
                  )}
                  {a.avgHr != null && (
                    <div className="stat">
                      <div className="k">Avg HR</div>
                      <div className="stat-v">{a.avgHr} bpm</div>
                    </div>
                  )}
                  {a.maxHr != null && (
                    <div className="stat">
                      <div className="k">Max HR</div>
                      <div className="stat-v">{a.maxHr} bpm</div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <nav className="nav-bar">
        <a href="/" className="nav-link">Dashboard</a>
        <a href="/activities" className="nav-link active">Activities</a>
        <a href="/rewards" className="nav-link">Rewards</a>
        <a href="/simulate" className="nav-link">Simulate</a>
      </nav>
    </>
  );
}
