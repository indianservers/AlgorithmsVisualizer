// @localized-render
import { tx, useLocaleRender } from '../i18n/render'
import { ArrowRight, BookOpen, Code2, FlaskConical, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'

export function DijkstraHero() {
  useLocaleRender()

  return (
    <div className="dijkstra-hero-art">
      <svg className="dijkstra-landscape" viewBox="0 0 1000 230" preserveAspectRatio="xMaxYMax slice" aria-hidden="true">
        <defs>
          <linearGradient id="mountain-blue" x2="0" y2="1">
            <stop stopColor="#ddecff" />
            <stop offset="1" stopColor="#f7fbff" />
          </linearGradient>
          <linearGradient id="road-blue" x2="0" y2="1">
            <stop stopColor="#2167d7" />
            <stop offset="1" stopColor="#bbd9fa" />
          </linearGradient>
        </defs>
        <path d="M0 230 160 125Q190 100 230 128L335 52Q370 20 407 58L590 196 715 96Q750 69 790 109L920 192 1000 130V230Z" fill="url(#mountain-blue)" />
        <path d="M260 230 459 132Q492 104 525 141L660 214 828 68Q859 35 890 72L1000 150V230Z" fill="#deedff" />
        <path d="M698 230C594 158 872 201 850 62C885 176 700 180 810 230" fill="url(#road-blue)" stroke="white" strokeWidth="3" />
        <path d="M753 230C641 170 877 197 850 62" fill="none" stroke="white" strokeWidth="2" strokeDasharray="12 10" />
        <path d="M850 68V32m0 0h20l-6 6 6 6h-20" stroke="#489cfa" strokeWidth="2" fill="#72c6ff" />
      </svg>
      <blockquote>
        {tx('“Shortest paths', 'studios')}
        <br />
        {tx('build stronger foundations', 'studios')}
        <br />
        {tx('for bigger problems.”', 'studios')}
      </blockquote>
      <Link className="dijkstra-explore" to="/daa/syllabus-dashboard">
        {tx('Explore', 'studios')}
        <strong>{tx('Algorithms', 'studios')}</strong>
        {tx('Visualize', 'studios')}
        <br />
        {tx('Understand', 'studios')}
        <strong>
          {tx('Grow ', 'studios')}
          <ArrowRight size={17} />
        </strong>
      </Link>
      <div className="dijkstra-features">
        <span>
          <Sparkles />
          {tx('Step-by-step visualization', 'studios')}
        </span>
        <span>
          <FlaskConical />
          {tx('Interactive experimentation', 'studios')}
        </span>
        <span>
          <Code2 />
          {tx('Code & practice', 'studios')}
        </span>
        <span>
          <BookOpen />
          {tx('Build intuition', 'studios')}
        </span>
      </div>
    </div>
  )
}
