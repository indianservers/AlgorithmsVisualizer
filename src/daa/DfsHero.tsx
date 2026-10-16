import { ArrowRight, Network } from 'lucide-react'
import { Link } from 'react-router-dom'

export function DfsHero() {
  return (
    <div className="dfs-hero-art">
      <svg viewBox="0 0 1000 200" preserveAspectRatio="xMaxYMax slice" aria-hidden="true">
        <defs>
          <linearGradient id="dfs-mountains" x2="0" y2="1">
            <stop stopColor="#ddecff" />
            <stop offset="1" stopColor="#f8fcff" />
          </linearGradient>
          <linearGradient id="dfs-road" x2="0" y2="1">
            <stop stopColor="#3578d8" />
            <stop offset="1" stopColor="#e2efff" />
          </linearGradient>
        </defs>
        <path d="M0 200 180 140Q210 106 245 133L382 51Q420 23 455 59L630 176 756 100Q790 72 825 106L1000 185V200Z" fill="url(#dfs-mountains)" />
        <path d="M180 200 376 128Q403 103 436 130L583 200 796 61Q828 30 863 70L1000 162V200Z" fill="#dfedff" />
        <path d="M730 200C620 151 864 164 842 52C875 150 748 157 820 200" fill="url(#dfs-road)" stroke="white" strokeWidth="2" />
        <path d="M776 200C680 153 863 163 842 52" fill="none" stroke="white" strokeWidth="1.5" strokeDasharray="11 8" />
        <path d="M842 57V25m0 0h18l-5 5 5 5h-18" fill="#55bdff" stroke="#4a9fec" />
      </svg>
      <blockquote>
        “Explore algorithms
        <br />
        visually, build intuition
        <br />
        for a deeper understanding.”
      </blockquote>
      <Link to="/graphs" className="dfs-explore">
        <Network size={31} />
        <span>
          <strong>Graphs</strong>Visualize
          <br />
          Experiment
          <br />
          Understand
          <b>
            Grow <ArrowRight size={15} />
          </b>
        </span>
      </Link>
    </div>
  )
}
