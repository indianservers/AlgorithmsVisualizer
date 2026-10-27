// @localized-render
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  Check,
  Search,
  Play,
  Pause,
  RotateCw,
  LineChart,
  Table2,
  Settings,
  Trophy,
  Lightbulb,
  CircleHelp,
  X,
} from 'lucide-react'
import { AccountControl } from '../account/AccountControl'
import { allModules } from '../algorithms'
import { algorithmPath } from '../utils/routing'
import { LanguageSelector } from '../i18n/LanguageSelector'
import { tx, useLocaleRender } from '../i18n/render'
import { persistentString, usePersistentState } from '../hooks/usePersistentState'
import { MockupTabs, type MockupPageProps, type MockupTab } from './MockupLessonChrome'
import { reliabilityExample, runReliabilityLesson, parseReliabilityInput } from './reliabilityLessonModel'
import './reliability-mockup.css'
const tr = (s: string) => tx(s, 'studios'),
  tabs: MockupTab[] = ['Learn', 'Visualization', 'Code', 'Practice', 'Experiments', 'Notes'],
  exampleRun = runReliabilityLesson(reliabilityExample),
  colors = ['#0784ff', '#0cb77a', '#f3a000', '#ff5870', '#8b62ed', '#1cbbce'],
  fixed = (v: number | null, d = 4) => (v === null ? '–' : v.toFixed(d))
function Panel({ title, icon, children, className = '' }: { title: string; icon: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`rd-panel ${className}`}>
      <header>
        <span className="rd-icon">{icon}</span>
        <h2>{title}</h2>
      </header>
      {children}
    </section>
  )
}
function ReliabilityBars() {
  return (
    <svg viewBox="0 0 28 28" width="28" height="28" aria-hidden="true">
      <rect x="3" y="13" width="5" height="12" rx="1" fill="#007aff" />
      <rect x="10" y="3" width="6" height="22" rx="1" fill="#126dff" />
      <rect x="18" y="9" width="6" height="16" rx="1" fill="#449cff" />
    </svg>
  )
}
function ReliabilityTableIcon() {
  return (
    <svg viewBox="0 0 28 28" width="28" height="28" aria-hidden="true">
      <rect x="3" y="3" width="22" height="22" rx="4" fill="#0082ff" />
      {[7, 12, 17].map((y) => (
        <g key={y} fill="white">
          <rect x="6" y={y} width="3" height="3" rx=".5" />
          <rect x="11" y={y} width="11" height="3" rx=".5" />
        </g>
      ))}
    </svg>
  )
}
export function ReliabilityMockupLesson(props: MockupPageProps) {
  useLocaleRender()
  const navigate = useNavigate(),
    [tab, setTab] = useState<MockupTab>('Visualization'),
    [run, setRun] = useState(exampleRun),
    [nDraft, setNDraft] = useState('4'),
    [bDraft, setBDraft] = useState('10'),
    [pDraft, setPDraft] = useState('0.8, 0.7, 0.9, 0.6'),
    [cursor, setCursor] = useState(exampleRun.defaultCursor),
    [phase, setPhase] = useState(0),
    [playing, setPlaying] = useState(false),
    [speed, setSpeed] = useState(180),
    [selected, setSelected] = useState({ i: 4, b: 10 }),
    [chartBudget, setChartBudget] = useState(10),
    [modal, setModal] = useState<'state' | 'stage' | 'budget' | 'allocation' | 'assumptions' | null>(null),
    [inspectStage, setInspectStage] = useState(0),
    [error, setError] = useState(''),
    [topicQuery, setTopicQuery] = useState(''),
    [prediction, setPrediction] = useState(''),
    [feedback, setFeedback] = useState(''),
    [localTheme, setLocalTheme] = useState(() => localStorage.getItem('algodrishti-theme') ?? 'light'),
    dialog = useRef<HTMLDialogElement>(null),
    search = useRef<HTMLInputElement>(null)
  const [notes, setNotes] = usePersistentState('algodrishti-reliability-notes', '', persistentString),
    [reviewed, setReviewed] = usePersistentState('algodrishti-reliability-sections', 'Learn|Visualization|Code|Practice', persistentString),
    visited = [...new Set(reviewed.split('|').filter((s) => tabs.includes(s as MockupTab)))],
    frame = run.frames[cursor],
    complete = frame.phase === 'result',
    n = run.input.stages,
    B = run.input.budget,
    theme = props.theme ?? localTheme,
    studied = props.completed.includes(props.module.id),
    pending = nDraft !== String(n) || bDraft !== String(B) || pDraft !== run.input.probabilities.join(', '),
    active = playing ? { i: frame.row, b: frame.budget } : selected,
    current = run.dp[active.i][active.b],
    candidates = run.candidates[active.i][active.b],
    point = run.curve[chartBudget] ?? run.curve[B],
    activePhase = playing ? (frame.phase === 'initialize' ? 1 : frame.phase === 'result' ? 3 : 2) : phase,
    topics = topicQuery.trim() ? allModules.filter((m) => `${m.name} ${m.summary}`.toLowerCase().includes(topicQuery.toLowerCase())).slice(0, 5) : [],
    plotX = (b: number) => 56 + (b / run.limit) * 411,
    plotY = (value: number | null) => 11 + (1 - (value ?? 0)) * 184,
    curve = run.curve.filter((p) => p.feasible),
    path = curve.map((p, i) => `${i ? 'L' : 'M'}${plotX(p.budget)},${plotY(p.reliability)}`).join(' '),
    area = curve.length ? `${path}L${plotX(run.limit)},195L${plotX(curve[0].budget)},195Z` : '',
    tooltipX = Math.max(58, Math.min(328, plotX(point.budget) - 64)),
    tooltipY = Math.max(-10, plotY(point.reliability) - 58),
    diagramWidth = Math.max(586, n * 120 + 106)
  useEffect(() => {
    if (modal) dialog.current?.showModal()
    else dialog.current?.close()
  }, [modal])
  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])
  useEffect(() => {
    function key(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        search.current?.focus()
      }
    }
    window.addEventListener('keydown', key)
    return () => window.removeEventListener('keydown', key)
  }, [])
  useEffect(() => {
    if (!playing) return
    const timer = window.setInterval(
      () =>
        setCursor((c) => {
          if (c >= run.frames.length - 1) {
            setPlaying(false)
            setSelected({ i: run.input.stages, b: run.input.budget })
            setPhase(3)
            return c
          }
          return c + 1
        }),
      speed,
    )
    return () => window.clearInterval(timer)
  }, [playing, run, speed])
  function pause() {
    if (playing) setSelected({ i: frame.row, b: frame.budget })
    setPlaying(false)
  }
  function changeTab(next: MockupTab) {
    pause()
    setTab(next)
    setTopicQuery('')
    if (!visited.includes(next)) setReviewed([...visited, next].join('|'))
  }
  function load(input = parseReliabilityInput(nDraft, bDraft, pDraft)) {
    const next = runReliabilityLesson(input)
    setRun(next)
    setNDraft(String(input.stages))
    setBDraft(String(input.budget))
    setPDraft(input.probabilities.join(', '))
    setCursor(next.defaultCursor)
    setPhase(0)
    setSelected({ i: input.stages, b: input.budget })
    setChartBudget(input.budget)
    setPlaying(false)
    setError('')
    setModal(null)
    return next
  }
  function apply() {
    try {
      load()
    } catch (e) {
      setError((e as Error).message)
    }
  }
  function animate() {
    if (playing) {
      pause()
      return
    }
    try {
      if (pending) {
        load()
        setCursor(0)
      } else if (complete) setCursor(0)
      setPhase(2)
      setPlaying(true)
    } catch (e) {
      setError((e as Error).message)
    }
  }
  function seek(c: number) {
    const f = run.frames[c]
    setCursor(c)
    setSelected({ i: f.row, b: f.budget })
    setPhase(f.phase === 'initialize' ? 1 : f.phase === 'fill' ? 2 : 3)
    setPlaying(false)
  }
  function reset() {
    setCursor(run.defaultCursor)
    setSelected({ i: n, b: B })
    setPhase(0)
    setPlaying(false)
    setNDraft(String(n))
    setBDraft(String(B))
    setPDraft(run.input.probabilities.join(', '))
    setChartBudget(B)
    setError('')
  }
  function stageCount(value: string) {
    setNDraft(value)
    pause()
    setError('')
    const next = Number(value),
      old = pDraft.trim()
        ? pDraft
            .trim()
            .split(/[,\s]+/)
            .map(Number)
        : []
    if (Number.isInteger(next) && next >= 1 && next <= 6 && old.every((p) => Number.isFinite(p) && p >= 0 && p <= 1))
      setPDraft(Array.from({ length: next }, (_, i) => old[i] ?? 0.8).join(', '))
  }
  function inspectState(i: number, b: number) {
    setSelected({ i, b })
    setPlaying(false)
    setModal('state')
  }
  function inspectStageAt(i: number) {
    pause()
    setInspectStage(i)
    setModal('stage')
  }
  function choosePhase(i: number) {
    pause()
    setPhase(i)
    if (i === 1) seek(1)
    else if (i === 2) {
      if (complete) setCursor(2)
      setPlaying(true)
    } else if (i === 3) seek(run.defaultCursor)
  }
  function keyAction(e: React.KeyboardEvent, action: () => void) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      action()
    }
  }
  return (
    <div className="mom-page target-visual reliability-design-page" data-target="42">
      <div className="rd-toolbar">
        <button className="rd-back" aria-label={tr('Return to suffix array')} onClick={() => navigate('/daa-extensions/suffix-array')}>
          <ArrowLeft size={18} />
        </button>
        <div className="rd-topic-search">
          <Search size={18} />
          <input
            ref={search}
            aria-label={tr('Search algorithm topics')}
            placeholder={tr('Search topics, algorithms, or keywords...')}
            value={topicQuery}
            onChange={(e) => setTopicQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') setTopicQuery('')
              if (e.key === 'Enter' && topics[0]) navigate(algorithmPath(topics[0]))
            }}
          />
          <kbd>{'⌘ K'}</kbd>
          {topicQuery && (
            <div className="rd-topic-results">
              {topics.length ? (
                topics.map((m) => (
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
        <button className="mom-study" aria-pressed={studied} onClick={() => props.toggleCompleted(props.module.id)}>
          {studied ? <Check size={16} /> : <Bookmark size={16} />} {tr(studied ? 'Studied' : 'Mark studied')}
        </button>
        <AccountControl showLanguage={false} />
      </div>
      <header className="rd-hero">
        <button className="rd-back" aria-label={tr('Back to DAA extensions')} onClick={() => navigate('/daa-extensions')}>
          <ArrowLeft size={19} />
        </button>
        <div className="rd-heading">
          <div>
            <h1>{tr('Reliability Design DP')}</h1>
            <span>{tr('DAA Extension')}</span>
          </div>
          <p>{tr('Allocate independent parallel copies to a series system.')}</p>
        </div>
        <div className="rd-section-progress">
          <span>{tr(`${visited.length} of 6 sections`)}</span>
          <div className="rd-progress-track">
            <i style={{ width: `${(visited.length / 6) * 100}%` }} />
            {tabs.slice(2).map((s, i) => (
              <button
                key={s}
                aria-label={tr(`Open ${s} section`)}
                className={visited.includes(s) ? 'rd-section-seen' : ''}
                style={{ left: `${46.5 + i * 17.8}%` }}
                onClick={() => changeTab(s)}
              />
            ))}
          </div>
        </div>
        <button className="rd-continue" onClick={() => changeTab(tabs[(tabs.indexOf(tab) + 1) % tabs.length])}>
          {tr('Continue Learning')}
          <ArrowRight size={19} />
        </button>
      </header>
      <MockupTabs active={tab} onChange={changeTab} tabs={tabs} />
      {tab === 'Visualization' ? (
        <>
          <div className="rd-top-grid">
            <section className={`rd-panel rd-problem${pending || error ? ' rd-has-feedback' : ''}`}>
              <header className="rd-problem-heading">
                <span className="rd-icon">
                  <ReliabilityBars />
                </span>
                <div>
                  <h2>{tr('Problem Visualization')}</h2>
                  <p>
                    {tr('A series system with n stages. Each stage has k independent identical copies with reliability pᵢ.')}
                    <br />
                    {tr('Allocate a total budget of B unit-cost copies to maximize system reliability.')}
                  </p>
                </div>
              </header>
              <div className="rd-problem-body">
                <div className="rd-input">
                  <h3>{tr('Input')}</h3>
                  <label>
                    {tr('Number of stages (n)')}
                    <input
                      type="number"
                      min="1"
                      max="6"
                      aria-label={tr('Number of reliability stages')}
                      value={nDraft}
                      onChange={(e) => stageCount(e.target.value)}
                    />
                  </label>
                  <label>
                    {tr('Total budget (B)')}
                    <input
                      type="number"
                      min="0"
                      max="24"
                      aria-label={tr('Total copy budget')}
                      value={bDraft}
                      onChange={(e) => {
                        setBDraft(e.target.value)
                        pause()
                        setError('')
                      }}
                    />
                  </label>
                  <label className="rd-probability-input">
                    {tr('Stage reliabilities (pᵢ)')}
                    <input
                      aria-label={tr('Stage probabilities')}
                      value={pDraft}
                      onChange={(e) => {
                        setPDraft(e.target.value)
                        pause()
                        setError('')
                      }}
                    />
                  </label>
                  <small>{tr('Enter n values between 0 and 1')}</small>
                  <button className="rd-run" onClick={apply}>
                    {tr('Run DP')}
                    <Play size={14} fill="currentColor" />
                  </button>
                  <div className="rd-input-actions">
                    <button onClick={animate}>
                      {playing ? <Pause size={14} /> : <Play size={14} fill="currentColor" />}
                      {tr(playing ? 'Pause' : complete || pending ? 'Animate Fill' : 'Resume Fill')}
                    </button>
                    <button onClick={reset}>
                      <RotateCw size={15} />
                      {tr('Reset')}
                    </button>
                  </div>
                </div>
                <div className="rd-system-scroll">
                  <svg
                    className="rd-system"
                    viewBox={`0 0 ${diagramWidth} 251`}
                    style={{ width: diagramWidth, minWidth: diagramWidth }}
                    role="group"
                    aria-label={tr('Series system with independent parallel copies')}
                  >
                    <defs>
                      <marker id="rd-flow" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
                        <path d="M0 0L7 3.5L0 7" fill="#0078ff" />
                      </marker>
                      <radialGradient id="rd-result-fill">
                        <stop stopColor="#fff" />
                        <stop offset="1" stopColor="#ffdbe4" />
                      </radialGradient>
                    </defs>
                    <text x="0" y="16" className="rd-system-title">
                      {tr('Series System with Parallel Copies')}
                    </text>
                    <line x1="0" x2="25" y1="123" y2="123" markerEnd="url(#rd-flow)" className="rd-flow-line" />
                    {run.input.probabilities.map((p, i) => {
                      const x = 28 + i * 120,
                        k = complete && run.optimum.feasible ? run.optimum.copies[i] : 1,
                        visible = k <= 3 ? Array.from({ length: k }, (_, j) => j + 1) : [1, 2, k],
                        ys = k === 1 ? [111] : k === 2 ? [70, 151] : [70, 103, 151]
                      return (
                        <g
                          key={i}
                          className="rd-stage"
                          role="button"
                          tabIndex={0}
                          aria-label={tr(`Inspect reliability stage ${i + 1}`)}
                          onClick={() => inspectStageAt(i)}
                          onKeyDown={(e) => keyAction(e, () => inspectStageAt(i))}
                        >
                          <title>
                            {tr(
                              `Stage ${i + 1}: unit reliability ${p}; ${complete && run.optimum.feasible ? `optimal copies ${k}` : 'at least one copy required'}`,
                            )}
                          </title>
                          <rect x={x - 7} y="34" width="106" height="200" fill="transparent" />
                          <text x={x + 45} y="47" textAnchor="middle" className="rd-stage-title" fill={colors[i]}>
                            {tr(`Stage ${i + 1}`)}
                          </text>
                          <rect x={x} y="59" width="90" height="127" rx="11" fill={colors[i] + '1c'} stroke={colors[i] + '88'} />
                          <path
                            d={`M${x},123H${x + 11}M${x + 79},123H${x + 90}M${x + 11},${ys[0] + 13}V${ys.at(-1)! + 13}M${x + 79},${ys[0] + 13}V${ys.at(-1)! + 13}`}
                            fill="none"
                            stroke={colors[i]}
                          />
                          {visible.map((copy, j) => (
                            <g key={copy}>
                              <path d={`M${x + 11},${ys[j] + 13}H${x + 23}M${x + 67},${ys[j] + 13}H${x + 79}`} stroke={colors[i]} />
                              <rect x={x + 23} y={ys[j]} width="44" height="26" rx="5" fill="#ffffffdd" stroke={colors[i]} />
                              <text x={x + 45} y={ys[j] + 17} textAnchor="middle" fill={colors[i]} className="rd-component-letter">
                                {'C'}
                                <tspan fontSize="9" baselineShift="sub">{`${i + 1},${copy}`}</tspan>
                              </text>
                            </g>
                          ))}
                          {k > 3 && (
                            <text x={x + 45} y="144" textAnchor="middle" fill={colors[i]}>
                              {'⋮'}
                            </text>
                          )}
                          <line x1={x + 90} x2={i === n - 1 ? n * 120 + 26 : x + 118} y1="123" y2="123" markerEnd="url(#rd-flow)" className="rd-flow-line" />
                          <text x={x + 45} y="205" textAnchor="middle" className="rd-stage-caption">
                            {tr(`Reliability: ${p}`)}
                          </text>
                          <text x={x + 45} y="224" textAnchor="middle" className="rd-stage-caption">
                            {tr(complete && run.optimum.feasible ? `Copies: ${k}` : 'Copies: ≥ 1')}
                          </text>
                        </g>
                      )
                    })}
                    <g
                      role="button"
                      tabIndex={0}
                      aria-label={tr('Inspect full system reliability')}
                      onClick={() => setModal('allocation')}
                      onKeyDown={(e) => keyAction(e, () => setModal('allocation'))}
                    >
                      <circle cx={n * 120 + 64} cy="123" r="38" fill="url(#rd-result-fill)" stroke="#ff5071" />
                      <text x={n * 120 + 64} y="115" textAnchor="middle" className="rd-system-result">
                        {tr('System')}
                        <tspan x={n * 120 + 64} dy="15">
                          {tr('Reliability')}
                        </tspan>
                        <tspan x={n * 120 + 64} dy="16">
                          {'R'}
                        </tspan>
                      </text>
                    </g>
                  </svg>
                </div>
              </div>
              {error ? (
                <p className="rd-input-feedback" role="alert">
                  {tr(error)}
                </p>
              ) : pending ? (
                <p className="rd-input-feedback" role="status">
                  {tr('Unapplied changes. Run DP or Animate Fill to apply the inputs.')}
                </p>
              ) : null}
            </section>
            <section className="rd-panel rd-chart">
              <header>
                <span className="rd-icon">
                  <LineChart size={28} />
                </span>
                <div>
                  <h2 aria-label={tr('Reliability vs Budget')}>
                    {tr('Reliability vs Budget')}
                    <button aria-label={tr('Explain the reliability budget chart')} onClick={() => setModal('assumptions')}>
                      <CircleHelp size={17} />
                    </button>
                  </h2>
                  <p>{tr('System reliability for optimal allocation with varying budgets.')}</p>
                </div>
              </header>
              <div className="rd-chart-scroll">
                <svg viewBox="0 0 474 258" className="rd-budget-chart" role="group" aria-label={tr('Optimal reliability by copy budget')}>
                  <defs>
                    <linearGradient id="rd-curve-fill" x1="0" y1="0" x2="0" y2="1">
                      <stop stopColor="#70c1ff" stopOpacity=".45" />
                      <stop offset="1" stopColor="#c5e6ff" stopOpacity=".24" />
                    </linearGradient>
                  </defs>
                  {Array.from({ length: 6 }, (_, i) => (
                    <g key={i}>
                      <line x1="56" x2="467" y1={11 + (i * 184) / 5} y2={11 + (i * 184) / 5} className="rd-grid-line" />
                      <text x="41" y={15 + (i * 184) / 5} textAnchor="end" className="rd-chart-tick">
                        {(1 - i / 5).toFixed(1)}
                      </text>
                    </g>
                  ))}
                  {run.curve
                    .filter((p) => p.budget % 2 === 0)
                    .map((p) => (
                      <g key={p.budget}>
                        <line x1={plotX(p.budget)} x2={plotX(p.budget)} y1="11" y2="195" className="rd-grid-line" />
                        <text x={plotX(p.budget)} y="219" textAnchor="middle" className="rd-chart-tick">
                          {p.budget}
                        </text>
                      </g>
                    ))}
                  <path d="M56 11V195H467" className="rd-axis" />
                  <path d={area} fill="url(#rd-curve-fill)" />
                  <path d={path} className="rd-curve-line" />
                  <line x1={plotX(point.budget)} x2={plotX(point.budget)} y1={plotY(point.reliability)} y2="195" className="rd-chart-guide" />
                  {run.curve.map((p) => (
                    <g
                      key={p.budget}
                      role="button"
                      tabIndex={0}
                      className="rd-chart-point"
                      aria-label={tr(`Inspect reliability at budget ${p.budget}`)}
                      onMouseEnter={() => setChartBudget(p.budget)}
                      onFocus={() => setChartBudget(p.budget)}
                      onClick={() => {
                        setChartBudget(p.budget)
                        setModal('budget')
                      }}
                      onKeyDown={(e) =>
                        keyAction(e, () => {
                          setChartBudget(p.budget)
                          setModal('budget')
                        })
                      }
                    >
                      <title>
                        {tr(
                          p.feasible ? `Budget ${p.budget}: optimal reliability ${fixed(p.reliability)}` : `Budget ${p.budget}: infeasible; need ${n} copies`,
                        )}
                      </title>
                      <rect x={plotX(p.budget) - 8} y={plotY(p.reliability) - 8} width="16" height="16" fill="transparent" />
                      <circle
                        cx={plotX(p.budget)}
                        cy={plotY(p.reliability)}
                        r={p.budget === point.budget ? 6.5 : 4}
                        fill={p.feasible ? '#087aff' : '#fff'}
                        stroke={p.feasible ? '#087aff' : '#99adc9'}
                      />
                    </g>
                  ))}
                  <g className="rd-chart-tooltip" pointerEvents="none">
                    <rect x={tooltipX} y={tooltipY} width="140" height="45" rx="7" />
                    <text x={tooltipX + 15} y={tooltipY + 17}>{`B = ${point.budget}`}</text>
                    <text x={tooltipX + 15} y={tooltipY + 32}>
                      {tr(point.feasible ? `Reliability = ${fixed(point.reliability)}` : 'Infeasible budget')}
                    </text>
                  </g>
                  <text x="261" y="243" textAnchor="middle" className="rd-chart-label">
                    {tr('Total Budget (B)')}
                  </text>
                  <text transform="translate(9 113) rotate(-90)" textAnchor="middle" className="rd-chart-label">
                    {tr('System Reliability')}
                  </text>
                </svg>
              </div>
            </section>
          </div>
          <div className="rd-middle-grid">
            <section className="rd-panel rd-table-panel">
              <header>
                <span className="rd-icon">
                  <ReliabilityTableIcon />
                </span>
                <div>
                  <h2>{tr('DP Table (Best Reliability R[i][b])')}</h2>
                  <p>{tr('R[i][b] = best reliability using first i stages with total budget b.')}</p>
                </div>
              </header>
              <div className="rd-table-scroll">
                <table style={{ minWidth: Math.max(746, 60 + (B + 1) * 62) }}>
                  <thead>
                    <tr>
                      <th>{`i ${String.fromCharCode(92)} b`}</th>
                      {Array.from({ length: B + 1 }, (_, b) => (
                        <th key={b}>{b}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {run.dp.map((row, i) => (
                      <tr key={i}>
                        <th>{i}</th>
                        {row.slice(0, B + 1).map((value, b) => {
                          const revealed = i * (B + 1) + b < frame.filled
                          return (
                            <td
                              key={b}
                              style={{
                                background:
                                  !revealed || value === null
                                    ? '#f0f5fc'
                                    : i === 0
                                      ? '#329aff'
                                      : `hsl(${[0, 184, 144, 62, 45, 330, 265][i]}, 88%, ${94 - value * 13}%)`,
                              }}
                            >
                              <button
                                className={active.i === i && active.b === b ? 'rd-active-cell' : ''}
                                style={{ color: revealed && i === 0 ? '#fff' : undefined }}
                                aria-label={tr(`Inspect DP state R[${i}][${b}]`)}
                                disabled={!revealed}
                                onClick={() => inspectState(i, b)}
                              >
                                {revealed ? fixed(value, 3) : '·'}
                              </button>
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
            <section className="rd-panel rd-recurrence">
              <header>
                <span className="rd-icon">
                  <Settings size={28} />
                </span>
                <div>
                  <h2>{tr('Step-by-Step DP Recurrence')}</h2>
                  <p>{tr('Transition and computation for each state.')}</p>
                </div>
              </header>
              <div className="rd-phases">
                {['Recurrence', 'Initialize', 'Fill Table', 'Result'].map((s, i) => (
                  <button key={s} aria-label={tr(`Show ${s} phase`)} aria-pressed={activePhase === i} onClick={() => choosePhase(i)}>
                    <b>{i + 1}</b>
                    <span>{tr(s)}</span>
                  </button>
                ))}
              </div>
              <div className="rd-transition">
                <h3>
                  {tr(
                    activePhase === 0
                      ? 'DP Transition'
                      : activePhase === 1
                        ? 'Initialize the base cases'
                        : activePhase === 2
                          ? `Compute R[${active.i}][${active.b}]`
                          : 'Reconstruct the optimal allocation',
                  )}
                </h3>
                {activePhase === 0 ? (
                  <>
                    <div className="rd-formula">
                      <span>{'R[i][b] ='}</span>
                      <span className="rd-max">
                        {'max'}
                        <small>{'1 ≤ k ≤ b − (i − 1)'}</small>
                      </span>
                      <span>{'(R[i − 1][b − k] × (1 − (1 − pᵢ)ᵏ))'}</span>
                    </div>
                    <ul>
                      <li>{tr('k = number of copies allocated to stage i (at least 1 per stage).')}</li>
                      <li>{tr('R[i − 1][b − k] = best reliability for first i − 1 stages with remaining budget.')}</li>
                      <li>{tr('(1 − (1 − pᵢ)ᵏ) = reliability of stage i with k parallel identical copies.')}</li>
                      <li>{tr('Base: R[0][b] = 1 for all b; states with b < i are infeasible.')}</li>
                    </ul>
                  </>
                ) : activePhase === 1 ? (
                  <p>
                    {tr(
                      'No stages means reliability 1: R[0][b] = 1 for every budget. A positive number of stages needs at least one copy each; cells with b < i are infeasible, shown as –.',
                    )}
                  </p>
                ) : activePhase === 2 ? (
                  <>
                    <p>
                      {tr(
                        current === null
                          ? `Budget ${active.b} cannot fund ${active.i} stages.`
                          : `Best value ${fixed(current)}; chosen k = ${run.choice[active.i][active.b]}.`,
                      )}
                    </p>
                    <div className="rd-mini-candidates">
                      <table>
                        <thead>
                          <tr>
                            {['k', 'Previous R', 'Stage R', 'Product'].map((s) => (
                              <th key={s}>{tr(s)}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {candidates.map((c) => (
                            <tr key={c.copies}>
                              <td>{c.copies}</td>
                              <td>{fixed(c.previous)}</td>
                              <td>{fixed(c.stage)}</td>
                              <td>{fixed(c.product)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                ) : (
                  <p>
                    {tr(
                      run.optimum.feasible
                        ? `Optimal copies [${run.optimum.copies.join(', ')}], using ${run.optimum.spent} of ${B} copies. Reliability ${fixed(run.optimum.reliability)}.`
                        : `No feasible allocation: ${n} stages need at least ${n} copies, but budget is ${B}.`,
                    )}
                  </p>
                )}
              </div>
            </section>
          </div>
          <div className="rd-bottom-grid">
            <section className="rd-panel rd-allocation">
              <header>
                <span className="rd-icon">
                  <Trophy size={25} />
                </span>
                <div>
                  <h2>{tr('Best Allocation (Optimal Solution)')}</h2>
                  <p>{tr(`Optimal number of copies per stage for total budget B = ${B}.`)}</p>
                </div>
              </header>
              {complete && run.optimum.feasible ? (
                <div className="rd-allocation-body">
                  <div className="rd-copy-scroll">
                    <div className="rd-copy-cards" style={{ minWidth: n * 104 + (n - 1) * 30 }}>
                      {run.optimum.copies.map((k, i) => (
                        <div className="rd-copy-piece" key={i}>
                          <button
                            style={{ background: colors[i] + '16', borderColor: colors[i] + '66', color: colors[i] }}
                            onClick={() => inspectStageAt(i)}
                            aria-label={tr(`Inspect optimal copies for stage ${i + 1}`)}
                          >
                            <b>{tr(`Stage ${i + 1}`)}</b>
                            <small>{`(p${i + 1} = ${run.input.probabilities[i]})`}</small>
                            <strong>{k}</strong>
                            <span>{tr('copies')}</span>
                          </button>
                          {i < n - 1 && <ArrowRight size={20} />}
                        </div>
                      ))}
                    </div>
                  </div>
                  <button className="rd-final-reliability" onClick={() => setModal('allocation')}>
                    <span>
                      <Check size={24} />
                      <b>{tr('Final System Reliability')}</b>
                    </span>
                    <strong>{fixed(run.optimum.reliability)}</strong>
                    <small>{tr(`with total budget B = ${B}`)}</small>
                  </button>
                </div>
              ) : (
                <p className="rd-allocation-pending">
                  {tr(!complete ? 'Fill the table to reveal the optimal allocation.' : `Infeasible: at least ${n} copies are needed for ${n} stages.`)}
                </p>
              )}
            </section>
            <Panel className="rd-correctness" title={tr('Correctness')} icon={<Lightbulb size={24} />}>
              <div>
                <Check size={24} />
                <p>
                  <span className="rd-proof-premise">{tr('A stage with k independent identical copies succeeds with probability 1 − (1 − p)ᵏ.')}</span>
                  {tr(' Series-stage reliabilities multiply. Trying every feasible k and combining with an optimal previous-stage budget gives the optimum.')}
                </p>
              </div>
            </Panel>
            <Panel className="rd-complexity" title={tr('Complexity')} icon={<ReliabilityBars />}>
              <div>
                <b>{tr('Time: O(nB²)')}</b>
                <button aria-label={tr('Explain reliability model assumptions')} onClick={() => setModal('assumptions')}>
                  <CircleHelp size={15} />
                </button>
                <p>{tr('n stages × B budgets × up to B copy counts.')}</p>
                <b>{tr('Auxiliary space: O(nB)')}</b>
                <p>{tr('This is a specific bounded-budget reliability model.')}</p>
              </div>
            </Panel>
          </div>
        </>
      ) : tab === 'Learn' ? (
        <div className="rd-learning">
          <Panel title={tr('Parallel redundancy inside a series system')} icon={<Lightbulb />}>
            <p>
              {tr(
                'A series system works only if every stage works. Within a stage, independent identical copies are connected in parallel, so at least one working copy is enough. A copy succeeds with probability p and fails with probability 1 − p. All k copies fail with probability (1 − p)ᵏ, giving stage reliability 1 − (1 − p)ᵏ.',
              )}
            </p>
            <p>
              {tr(
                'Assume independent failures within and between stages. Then the system reliability is the product of stage reliabilities. Every copy costs one budget unit, every stage needs at least one copy, and the budget is a capacity: unused copies are permitted. Correlated failures or differing per-copy costs require a different model.',
              )}
            </p>
            <h3>{tr('Optimal substructure')}</h3>
            <p>
              {tr(
                'Let R[i][b] be the greatest reliability achievable using the first i stages and at most b copies. Try every positive copy count k for the last stage, leaving b − k for an optimal previous-stage allocation. Take the maximum product. R[0][b] = 1, and b < i is infeasible. Recording the maximizing k reconstructs the allocation.',
              )}
            </p>
          </Panel>
          <Panel title={tr('Worked example and marginal improvement')} icon={<Trophy />}>
            <p>
              {tr(
                'For probabilities [0.8, 0.7, 0.9, 0.6] and budget 10, the optimal allocation is [2, 3, 2, 3]. Stage reliabilities are 0.96, 0.973, 0.99 and 0.936; their product is 0.8655558912. One copy of each stage costs 4 and gives 0.3024.',
              )}
            </p>
            <p>
              {tr(
                'For two stages with p = [0.8, 0.5] and budget 3, giving the extra copy to stage 1 produces 0.48, while giving it to stage 2 produces 0.60. The DP checks every feasible alternative rather than assuming an allocation is optimal.',
              )}
            </p>
            <button
              onClick={() => {
                load({ stages: 2, budget: 3, probabilities: [0.8, 0.5] })
                changeTab('Visualization')
              }}
            >
              {tr('Explore the two-stage example')}
            </button>
            <p>
              {tr(
                'There are O(nB) states and up to B copy counts per state: O(nB²) time and O(nB) auxiliary storage. This teaching tool also computes a budget curve and retains candidate transitions and animation events, which add visualization overhead. Probabilities use floating-point arithmetic; displayed values are rounded.',
              )}
            </p>
          </Panel>
        </div>
      ) : tab === 'Code' ? (
        <Panel className="rd-code" title={tr('Unit-cost reliability dynamic programming')} icon={<Table2 />}>
          <pre>
            <code>{`const R = Array.from({length: n + 1}, () => Array(B + 1).fill(null));
const copies = Array.from({length: n + 1}, () => Array(B + 1).fill(0));
R[0].fill(1);
for (let i = 1; i <= n; i++) {
  for (let b = i; b <= B; b++) {
    let best = -Infinity;
    for (let k = 1; k <= b - (i - 1); k++) {
      const stage = p[i-1] === 1 ? 1 : -Math.expm1(k * Math.log1p(-p[i-1]));
      const value = R[i-1][b-k] * stage;
      if (value > best) { best = value; copies[i][b] = k; }
    }
    R[i][b] = best;
  }
}
// null means infeasible; 0 is a feasible zero-reliability system.
// Follow copies[i][b], then set b -= k and i-- to reconstruct.`}</code>
          </pre>
        </Panel>
      ) : tab === 'Practice' ? (
        <Panel className="rd-practice" title={tr('Predict where one extra copy helps most')} icon={<Lightbulb />}>
          <p>
            {tr(
              'Two stages have success probabilities 0.8 and 0.5. With a budget of three unit-cost copies, which allocation gives the higher system reliability?',
            )}
          </p>
          <label>
            {tr('Your prediction')}
            <select
              value={prediction}
              onChange={(e) => {
                setPrediction(e.target.value)
                setFeedback('')
              }}
            >
              <option value="">{tr('Choose an answer')}</option>
              <option value="first">{tr('Two copies of stage 1, one of stage 2')}</option>
              <option value="second">{tr('One copy of stage 1, two of stage 2')}</option>
              <option value="equal">{tr('Both are equal')}</option>
            </select>
          </label>
          <button
            onClick={() =>
              setFeedback(
                prediction === 'second'
                  ? 'Correct. 0.8 × (1 − 0.5²) = 0.60, which exceeds (1 − 0.2²) × 0.5 = 0.48.'
                  : 'Try again: compute each stage’s parallel reliability, then multiply the two stages.',
              )
            }
          >
            {tr('Check prediction')}
          </button>
          {feedback && <p role="status">{tr(feedback)}</p>}
        </Panel>
      ) : tab === 'Notes' ? (
        <Panel className="rd-notes" title={tr('Reliability design notes')} icon={<Bookmark />}>
          <p>{tr('Record the independence assumption, the recurrence, and the allocations you explored.')}</p>
          <textarea aria-label={tr('Reliability design notes')} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </Panel>
      ) : (
        <div className="rd-experiments">
          <Panel title={tr('Explore budgets and DP transitions')} icon={<Settings />}>
            <div className="rd-experiment-controls">
              <button onClick={() => load(reliabilityExample)}>{tr('Default example')}</button>
              <button onClick={() => load({ ...run.input, budget: n })}>{tr('One copy per stage')}</button>
              <button onClick={() => load({ stages: 2, budget: 10, probabilities: [1, 1] })}>{tr('Perfect stages')}</button>
              <button onClick={() => load({ stages: 2, budget: 4, probabilities: [0, 0.9] })}>{tr('Zero reliability stage')}</button>
              <label>
                {tr('Fill speed')}
                <select aria-label={tr('DP fill speed')} value={speed} onChange={(e) => setSpeed(Number(e.target.value))}>
                  <option value={700}>{tr('Slow')}</option>
                  <option value={180}>{tr('Normal')}</option>
                  <option value={30}>{tr('Fast')}</option>
                </select>
              </label>
              <button onClick={() => seek(0)}>{tr('Restart table fill')}</button>
              <button onClick={() => seek(Math.min(run.defaultCursor, cursor + 1))}>{tr('Next DP state')}</button>
              <button onClick={() => seek(run.defaultCursor)}>{tr('Show optimal result')}</button>
            </div>
            <label className="rd-fill-range">
              {tr(`Fill event ${cursor} / ${run.defaultCursor}`)}
              <input
                type="range"
                aria-label={tr('Reliability fill event')}
                min="0"
                max={run.defaultCursor}
                value={cursor}
                onChange={(e) => seek(Number(e.target.value))}
              />
            </label>
            <p className="rd-fill-status">{tr(`Phase: ${frame.phase}; revealed cells: ${frame.filled}/${(n + 1) * (B + 1)}.`)}</p>
            <p className="rd-optimum-summary">
              {tr(
                run.optimum.feasible
                  ? `Computed optimum: [${run.optimum.copies.join(', ')}]; reliability ${fixed(run.optimum.reliability)}; used ${run.optimum.spent}, unused ${run.optimum.unused} copies.`
                  : `Budget ${B} is infeasible for ${n} stages.`,
              )}
            </p>
            <div className="rd-budget-list">
              {run.curve.map((p) => (
                <button
                  key={p.budget}
                  onClick={() => {
                    setChartBudget(p.budget)
                    setModal('budget')
                  }}
                >
                  {tr(`Budget ${p.budget}: ${p.feasible ? fixed(p.reliability) : 'infeasible'}`)}
                </button>
              ))}
            </div>
            <button onClick={() => changeTab('Visualization')}>{tr('Return to reliability workspace')}</button>
          </Panel>
          <Panel title={tr('Preferences')} icon={<Settings />}>
            <LanguageSelector />
            <button
              onClick={() => {
                if (props.onToggleTheme) props.onToggleTheme()
                else {
                  const next = theme === 'dark' ? 'light' : 'dark'
                  setLocalTheme(next)
                  localStorage.setItem('algodrishti-theme', next)
                }
              }}
            >
              {tr(theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme')}
            </button>
            <button onClick={() => setReviewed('Visualization')}>{tr('Reset section progress')}</button>
          </Panel>
        </div>
      )}
      <dialog ref={dialog} className="rd-dialog" onCancel={() => setModal(null)}>
        <button className="rd-close" aria-label={tr('Close reliability dialog')} onClick={() => setModal(null)}>
          <X size={20} />
        </button>
        {modal === 'state' ? (
          <>
            <h2>{tr(`DP state R[${active.i}][${active.b}]`)}</h2>
            <p>
              {tr(
                active.i === 0
                  ? 'Zero stages always have reliability 1, regardless of unused budget.'
                  : current === null
                    ? `Infeasible: ${active.i} stages require at least ${active.i} copies.`
                    : `Best reliability ${fixed(current, 8)}; chosen copies for stage ${active.i}: ${run.choice[active.i][active.b]}.`,
              )}
            </p>
            {candidates.length > 0 && (
              <div className="rd-candidate-scroll">
                <table>
                  <thead>
                    <tr>
                      {['Copies k', 'Remaining budget', 'Previous reliability', 'Stage reliability', 'Product'].map((s) => (
                        <th key={s}>{tr(s)}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {candidates.map((c) => (
                      <tr key={c.copies} className={c.copies === run.choice[active.i][active.b] ? 'rd-best-candidate' : ''}>
                        <td>{c.copies}</td>
                        <td>{c.remaining}</td>
                        <td>{fixed(c.previous, 6)}</td>
                        <td>{fixed(c.stage, 6)}</td>
                        <td>{fixed(c.product, 8)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        ) : modal === 'stage' ? (
          <>
            <h2>{tr(`Stage ${inspectStage + 1}`)}</h2>
            <p>{tr(`Per-copy reliability p = ${run.input.probabilities[inspectStage]}. Copies fail independently.`)}</p>
            <p>
              {tr(
                run.optimum.feasible
                  ? `Optimal copies k = ${run.optimum.copies[inspectStage]}. Parallel reliability 1 − (1 − p)ᵏ = ${fixed(run.optimum.stageReliabilities[inspectStage], 8)}.`
                  : 'The current budget cannot fund every stage, so no full-system allocation exists.',
              )}
            </p>
          </>
        ) : modal === 'budget' ? (
          <>
            <h2>{tr(`Budget ${point.budget}`)}</h2>
            <p>
              {tr(
                point.feasible
                  ? `Optimal copies [${point.copies.join(', ')}]. Reliability ${fixed(point.reliability, 8)}. Used ${point.spent}; unused ${point.unused}.`
                  : `Infeasible: ${n} stages need at least ${n} copies.`,
              )}
            </p>
            <button onClick={() => load({ ...run.input, budget: point.budget })}>{tr('Use this budget')}</button>
          </>
        ) : modal === 'allocation' ? (
          <>
            <h2>{tr('Optimal allocation certificate')}</h2>
            <p>
              {tr(
                run.optimum.feasible
                  ? `Copies [${run.optimum.copies.join(', ')}], with total ${run.optimum.spent} ≤ budget ${B}. Stage reliabilities: ${run.optimum.stageReliabilities.map((p) => fixed(p, 6)).join(' × ')}. System reliability ${fixed(run.optimum.reliability, 10)}.`
                  : `No allocation is feasible: budget ${B} is smaller than ${n} required copies.`,
              )}
            </p>
          </>
        ) : modal === 'assumptions' ? (
          <>
            <h2>{tr('Model assumptions and budget curve')}</h2>
            <p>
              {tr(
                'Copies are independent and identical within each stage, stages fail independently, and every copy costs one budget unit. Every stage needs at least one copy. The budget is an upper bound, so useless extra copies may remain unused. Gray chart markers and table dashes denote infeasible budgets, not zero reliability.',
              )}
            </p>
            <p>
              {tr(
                'The curve uses the same DP recurrence for every displayed budget. Probabilities and products are computed at full floating-point precision, while chart labels and cards are rounded.',
              )}
            </p>
          </>
        ) : null}
      </dialog>
    </div>
  )
}
