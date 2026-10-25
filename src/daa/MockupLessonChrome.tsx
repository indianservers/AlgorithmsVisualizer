// @localized-render
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  BarChart3,
  Bookmark,
  Check,
  Clock3,
  Layers3,
  Moon,
  Search,
  Sun,
  Timer,
  BookOpen,
  Play,
  Code2,
  GraduationCap,
  FlaskConical,
  FileText,
} from 'lucide-react'
import { tx, useLocaleRender } from '../i18n/render'
import { AccountControl } from '../account/AccountControl'
import { allModules } from '../algorithms'
import { algorithmPath } from '../utils/routing'
import type { AlgorithmModule } from '../types'
import './median-mockup.css'

const mockupTabs = ['Learn', 'Visualization', 'Code', 'Practice', 'Experiments', 'Notes'] as const
export type MockupTab = (typeof mockupTabs)[number]
const icons = [BookOpen, Play, Code2, GraduationCap, FlaskConical, FileText]
const tr = (text: string) => tx(text, 'studios')
export type MockupPageProps = {
  module: AlgorithmModule
  completed: string[]
  toggleCompleted: (id: string) => void
  theme?: string
  onToggleTheme?: () => void
}

export function MockupTabs({ active, onChange, tabs = mockupTabs }: { active: MockupTab; onChange: (tab: MockupTab) => void; tabs?: readonly MockupTab[] }) {
  useLocaleRender()
  return (
    <nav className="mom-tabs" aria-label={tr('Algorithm sections')}>
      {tabs.map((tab) => {
        const Icon = icons[mockupTabs.indexOf(tab)]
        return (
          <button key={tab} aria-pressed={active === tab} onClick={() => onChange(tab)}>
            <Icon size={19} />
            {tr(tab)}
          </button>
        )
      })}
    </nav>
  )
}
export function MockupLessonChrome({
  module,
  completed,
  toggleCompleted,
  theme: controlledTheme,
  onToggleTheme,
  title,
  description,
  concepts = 4,
  onStart,
  decoration,
  categoryBadge = false,
  badges,
}: {
  title: string
  description: string
  concepts?: number
  onStart: () => void
  decoration?: ReactNode
  categoryBadge?: boolean
  badges?: ReactNode
} & MockupPageProps) {
  useLocaleRender()
  const navigate = useNavigate(),
    [query, setQuery] = useState(''),
    [fallbackTheme, setFallbackTheme] = useState(() => localStorage.getItem('algodrishti-theme') ?? 'light'),
    theme = controlledTheme ?? fallbackTheme,
    studied = completed.includes(module.id)
  const matches = useMemo(
    () => (query.trim() ? allModules.filter((m) => `${m.name} ${m.summary}`.toLowerCase().includes(query.toLowerCase())).slice(0, 5) : []),
    [query],
  )
  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem('algodrishti-theme', theme)
  }, [theme])
  return (
    <>
      <div className="mom-topbar">
        <div className="mom-search">
          <Search size={19} />
          <input
            aria-label={tr('Search topics')}
            placeholder={tr('Search topics, e.g., dynamic programming, graph algorithms...')}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {query && (
            <div className="mom-search-results">
              {matches.length ? (
                matches.map((m) => (
                  <button key={m.id} onClick={() => navigate(algorithmPath(m))}>
                    {tx(m.name, 'algorithms')}
                  </button>
                ))
              ) : (
                <p>{tr('No matching topics.')}</p>
              )}
            </div>
          )}
        </div>
        <button
          className="mom-theme"
          aria-label={tr('Toggle color theme')}
          onClick={() => (onToggleTheme ? onToggleTheme() : setFallbackTheme(theme === 'dark' ? 'light' : 'dark'))}
        >
          <Sun size={20} />
          <span>{theme === 'dark' ? <Moon size={15} /> : <i />}</span>
        </button>
        <button className="mom-study" aria-pressed={studied} onClick={() => toggleCompleted(module.id)}>
          {studied ? <Check size={16} /> : <Bookmark size={16} />}
          <span>{tr(studied ? 'Studied' : 'Mark studied')}</span>
        </button>
        <AccountControl />
      </div>
      <header className="mom-hero">
        <div className="mom-hero-icon">
          <Layers3 size={41} />
        </div>
        <div className="mom-hero-title">
          <h1>{tr(title)}</h1>
          <p>{tr(description)}</p>
          <div className="mom-badges">
            {badges ?? (
              <>
                <span>
                  <Clock3 />
                  {tr('10–15 min')}
                </span>
                <span>
                  <BarChart3 />
                  {tr('Intermediate')}
                </span>
                {categoryBadge && (
                  <span>
                    <Timer />
                    {tx(module.category, 'navigation')}
                  </span>
                )}
                <span>
                  <Timer />
                  {tr(`${concepts} key concepts`)}
                </span>
              </>
            )}
          </div>
        </div>
        {decoration}
        <div className="mom-progress">
          <div style={{ background: `conic-gradient(#1677ff ${studied ? 100 : 0}%,#e1e8f2 0)` }}>
            <b>{studied ? '100%' : '0%'}</b>
          </div>
          <span>{tr(studied ? 'Studied' : 'Not started')}</span>
        </div>
        <button className="mom-start" onClick={onStart}>
          {tr('Start Learning')}
          <ArrowRight size={18} />
        </button>
      </header>
    </>
  )
}

/** Native vector artwork, not reused mockup pixels. */
export function SelectionHeroArt() {
  return (
    <svg className="qs-hero-art" viewBox="0 0 290 135" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id="selection-art-blue" x2="0" y2="1">
          <stop stopColor="#b2f0ff" />
          <stop offset="1" stopColor="#52b4ff" />
        </linearGradient>
        <linearGradient id="selection-art-purple" x2="0" y2="1">
          <stop stopColor="#a689ff" />
          <stop offset="1" stopColor="#5729ed" />
        </linearGradient>
      </defs>
      {[0, 1, 2, 3].map((i) => (
        <g key={i} transform={`translate(0,${-i * 17})`}>
          <polygon points="90,91 128,70 166,91 128,113" fill={i === 3 ? '#c9f1ff' : '#a895ff'} stroke={i === 3 ? '#a8e0ff' : '#d3c6ff'} />
          <polygon points="90,91 128,113 128,133 90,111" fill={i === 3 ? '#8bcfff' : 'url(#selection-art-purple)'} fillOpacity={i === 3 ? 0.55 : 1} />
          <polygon points="128,113 166,91 166,111 128,133" fill={i === 3 ? 'url(#selection-art-blue)' : '#643cf1'} fillOpacity={i === 3 ? 0.65 : 1} />
          {i === 3 && <path d="M128 70V113M90 91L128 113L166 91M128 113V133" fill="none" stroke="#88cfff" strokeWidth=".7" />}
        </g>
      ))}
      <g opacity=".7">
        <polygon points="23,89 44,77 65,89 44,102" fill="#cdf4ff" />
        <polygon points="23,89 44,102 44,124 23,111" fill="#9de3ff" />
        <polygon points="44,102 65,89 65,111 44,124" fill="#67c3ff" />
      </g>
      {[15, 28, 43, 58].map((h, i) => (
        <rect key={h} x={195 + i * 17} y={124 - h} width="12" height={h} rx="2" fill="url(#selection-art-blue)" stroke="#52b7fa" />
      ))}
    </svg>
  )
}
