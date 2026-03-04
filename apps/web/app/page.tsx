export default function Home() {
  return (
    <section className="card">
      <h1 className="h1">Discipline Engine</h1>
      <p className="p">
        This is the futuristic baseline UI. Next steps: Strava connect, scoring ledger, rewards claim.
      </p>

      <div className="grid">
        <div className="panel">
          <div className="k">Today</div>
          <div className="v">0 PRBL</div>
          <div className="s">Daily user cap: 35</div>
        </div>
        <div className="panel">
          <div className="k">Streak</div>
          <div className="v">0</div>
          <div className="s">Discipline Score is private</div>
        </div>
        <div className="panel">
          <div className="k">API</div>
          <div className="v">/v1/health</div>
          <div className="s">Fastify gateway online</div>
        </div>
      </div>
    </section>
  );
}
