export function BfsHero() {
  return (
    <div className="bfs-hero-art">
      <svg viewBox="0 0 800 200" preserveAspectRatio="xMaxYMid slice" aria-hidden="true">
        <defs>
          <linearGradient id="bfs-banner" x2="1" y2=".4">
            <stop stopColor="#fff" stopOpacity="0" />
            <stop offset="1" stopColor="#a8cdff" />
          </linearGradient>
          <radialGradient id="bfs-orb" cx=".3" cy=".2">
            <stop stopColor="#b8e4ff" />
            <stop offset="1" stopColor="#408fff" />
          </radialGradient>
          <linearGradient id="bfs-paper" x2=".8" y2="1">
            <stop stopColor="#f7fcff" />
            <stop offset="1" stopColor="#b8d8ff" />
          </linearGradient>
          <filter id="bfs-shadow">
            <feGaussianBlur stdDeviation="8" />
          </filter>
        </defs>
        <rect width="800" height="200" fill="url(#bfs-banner)" />
        <path d="M0 200C120 130 90 0 230 0S410 90 500 12 620 50 800 0V200Z" fill="#e4f2ff" opacity=".35" />
        <path d="m420 104 41-56 84 50-76 62-49-56m125-6 40-55m-40 55 85 53" stroke="#8bbaff" strokeWidth="3" opacity=".32" fill="none" />
        <path d="m420 104 41-56 84 50-76 62-49-56" stroke="#3989ff" strokeWidth="2.5" fill="none" />
        {[
          { x: 420, y: 104, r: 10 },
          { x: 461, y: 48, r: 18 },
          { x: 545, y: 98, r: 19 },
          { x: 469, y: 160, r: 18 },
        ].map(({ x, y, r }) => (
          <circle key={x} cx={x} cy={y} r={r} fill="url(#bfs-orb)" stroke="#effaff" strokeWidth="2.5" />
        ))}
        <circle cx="585" cy="43" r="10" fill="#85b9ff" opacity=".7" />
        <circle cx="562" cy="167" r="13" fill="#9cc5ff" opacity=".5" />
        <g transform="translate(650 20) rotate(11)">
          <rect x="7" y="14" width="131" height="137" rx="13" fill="#3385f9" opacity=".25" filter="url(#bfs-shadow)" />
          <rect width="131" height="137" rx="13" fill="url(#bfs-paper)" stroke="#f4fcff" strokeWidth="1.5" />
          <rect x="19" y="17" width="35" height="19" rx="4" fill="#0874ff" />
          <text x="36" y="31" textAnchor="middle" fill="white" fontSize="14" fontWeight="700">
            BFS
          </text>
          {[53, 74, 95, 116].map((y) => (
            <g key={y}>
              <circle cx="23" cy={y} r="5" fill="#acd0ff" />
              <rect x="36" y={y - 3} width={y === 53 ? 76 : 63} height="7" rx="3.5" fill="#afcfff" />
            </g>
          ))}
        </g>
      </svg>
      <blockquote>
        <b>“</b>Explore the graph level by level
        <br />
        and discover the shortest paths
        <br />
        in an unweighted world.”
        <span />
        <small>Graphs&nbsp; • &nbsp;Algorithms&nbsp; • &nbsp;Deeper Understanding</small>
      </blockquote>
    </div>
  )
}
