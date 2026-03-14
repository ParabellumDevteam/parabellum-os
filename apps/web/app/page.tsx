'use client';

import { useEffect, useState, useCallback } from 'react';

type User = { id: string; walletAddress: string; displayName: string | null; disciplineScore: number };
type Health = { ok: boolean; service: string; uptimeS: number; ts: string };
type RewardsToday = { ok: boolean; yearIndex: number; globalDailyCap: number; perUserDailyCap: number };
type PointRow = { id: string; userId: string; points: number };
type DashboardData = {
  today: { points: number; perUserCap: number; globalCap: number; yearIndex: number };
  stats: { totalActivities: number; disciplineScore: number };
  recentActivities: { id: string; type: string; distanceM: number | null; movingTimeS: number | null; avgHr: number | null; createdAt: string }[];
};

export default function Home() {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [health, setHealth] = useState<Health | null>(null);
  const [rewards, setRewards] = useState<RewardsToday | null>(null);
  const [points, setPoints] = useState<PointRow[]>([]);
  const [dash, setDash] = useState<DashboardData | null>(null);
  const [wallet, setWallet] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('prbl_token');
    if (saved) setToken(saved);
  }, []);

  const fetchPublic = useCallback(async () => {
    try {
      const [h, r] = await Promise.all([
        fetch('/api/v1/health').then(res => res.json()),
        fetch('/api/v1/rewards/today').then(res => res.json())
      ]);
      setHealth(h);
      setRewards(r);
    } catch { /* API might be down */ }
  }, []);

  const fetchAuth = useCallback(async (jwt: string) => {
    try {
      const [me, pts, d] = await Promise.all([
        fetch('/api/v1/auth/me', { headers: { Authorization: `Bearer ${jwt}` } }).then(r => r.json()),
        fetch('/api/v1/admin/points/today', { headers: { Authorization: `Bearer ${jwt}` } }).then(r => r.json()),
        fetch('/api/v1/user/dashboard', { headers: { Authorization: `Bearer ${jwt}` } }).then(r => r.json())
      ]);
      if (me.ok) setUser(me.user);
      if (pts.ok) setPoints(pts.rows ?? []);
      if (d.ok) setDash(d);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { fetchPublic(); }, [fetchPublic]);
  useEffect(() => { if (token) fetchAuth(token); }, [token, fetchAuth]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (wallet.length < 10) { setLoginError('Wallet address too short'); return; }
    setLoading(true);
    setLoginError('');
    try {
      const res = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress: wallet })
      });
      const data = await res.json();
      if (data.ok) {
        localStorage.setItem('prbl_token', data.token);
        setToken(data.token);
        setUser(data.user);
        setWallet('');
      } else {
        setLoginError(data.error || 'Login failed');
      }
    } catch {
      setLoginError('Network error');
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    localStorage.removeItem('prbl_token');
    setToken(null);
    setUser(null);
    setPoints([]);
    setDash(null);
  }

  const myPoints = dash?.today?.points ?? (user ? points.find(p => p.userId === user.id)?.points ?? 0 : 0);

  return (
    <>
      <section className="card">
        <h1 className="h1">Discipline Engine</h1>
        <p className="p">Real-time pipeline: Strava webhook → effort scoring → PRBL rewards.</p>

        <div className="grid">
          <div className="panel">
            <div className="k">My Points Today</div>
            <div className="v accent">{myPoints} <span className="unit">PTS</span></div>
            <div className="s">Per-user cap: {rewards?.perUserDailyCap ?? 35} PRBL</div>
          </div>
          <div className="panel">
            <div className="k">Global Cap</div>
            <div className="v">{rewards?.globalDailyCap != null ? rewards.globalDailyCap.toLocaleString() : '—'} <span className="unit">PRBL</span></div>
            <div className="s">Year {rewards?.yearIndex ?? '—'} · halving active</div>
          </div>
          <div className="panel">
            <div className="k">API</div>
            <div className={`v ${health?.ok ? 'live' : 'off'}`}>{health?.ok ? 'ONLINE' : 'OFFLINE'}</div>
            <div className="s">{health ? `uptime ${health.uptimeS}s` : 'Connecting…'}</div>
          </div>
        </div>
      </section>

      {token && dash && (
        <section className="card">
          <h2 className="h2">Your Stats</h2>
          <div className="grid">
            <div className="panel">
              <div className="k">Activities</div>
              <div className="v">{dash.stats.totalActivities}</div>
              <div className="s">Total tracked</div>
            </div>
            <div className="panel">
              <div className="k">Discipline</div>
              <div className="v">{dash.stats.disciplineScore}</div>
              <div className="s">Private score</div>
            </div>
            <div className="panel">
              <div className="k">Year</div>
              <div className="v">{dash.today.yearIndex}</div>
              <div className="s">Cap: {dash.today.globalCap.toLocaleString()}</div>
            </div>
          </div>

          {dash.recentActivities.length > 0 && (
            <>
              <h2 className="h2" style={{marginTop: 18}}>Recent Activities</h2>
              <div className="activity-list">
                {dash.recentActivities.map(a => (
                  <div key={a.id} className="activity-row">
                    <div className="activity-type">{a.type}</div>
                    <div className="activity-meta">
                      {a.distanceM != null && <span>{(a.distanceM / 1000).toFixed(1)} km</span>}
                      {a.movingTimeS != null && <span>{Math.round(a.movingTimeS / 60)} min</span>}
                      {a.avgHr != null && <span>♥ {a.avgHr}</span>}
                    </div>
                  </div>
                ))}
              </div>
              <a href="/activities" className="link-more">View all activities →</a>
            </>
          )}
        </section>
      )}

      {!token ? (
        <section className="card">
          <h2 className="h2">Connect Wallet</h2>
          <form onSubmit={handleLogin} className="login-form">
            <input
              type="text"
              className="input"
              placeholder="0x your wallet address"
              value={wallet}
              onChange={e => setWallet(e.target.value)}
              disabled={loading}
            />
            <button type="submit" className="btn" disabled={loading}>
              {loading ? 'Connecting…' : 'Login'}
            </button>
          </form>
          {loginError && <div className="err">{loginError}</div>}
        </section>
      ) : (
        <section className="card">
          <div className="user-bar">
            <div>
              <div className="k">Wallet</div>
              <div className="mono">{user?.walletAddress ?? '—'}</div>
            </div>
            <button className="btn btn-ghost" onClick={handleLogout}>Logout</button>
          </div>
        </section>
      )}

      {token && points.length > 0 && (
        <section className="card">
          <h2 className="h2">Leaderboard — Today</h2>
          <table className="table">
            <thead>
              <tr><th>#</th><th>User</th><th>Points</th></tr>
            </thead>
            <tbody>
              {points.map((p, i) => (
                <tr key={p.id} className={p.userId === user?.id ? 'highlight' : ''}>
                  <td>{i + 1}</td>
                  <td className="mono">{p.userId.slice(0, 12)}…</td>
                  <td className="pts">{p.points}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      <nav className="nav-bar">
        <a href="/" className="nav-link active">Dashboard</a>
        <a href="/activities" className="nav-link">Activities</a>
        <a href="/rewards" className="nav-link">Rewards</a>
        <a href="/simulate" className="nav-link">Simulate</a>
      </nav>
    </>
  );
}
