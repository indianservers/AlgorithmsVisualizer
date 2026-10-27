// @localized-render
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  Search,
  Bookmark,
  Check,
  Play,
  Pause,
  RotateCw,
  BookOpen,
  Settings,
  Network,
  ChartNoAxesColumnIncreasing,
  Shield,
  Lightbulb,
  FlaskConical,
  TriangleAlert,
  X,
} from 'lucide-react'
import { AccountControl } from '../account/AccountControl'
import { LanguageSelector } from '../i18n/LanguageSelector'
import { allModules } from '../algorithms'
import { algorithmPath } from '../utils/routing'
import { tx, useLocaleRender } from '../i18n/render'
import { persistentString, usePersistentState } from '../hooks/usePersistentState'
import { MockupTabs, type MockupPageProps, type MockupTab } from './MockupLessonChrome'
import {
  guaranteeGraph,
  guaranteeTsp,
  runApproximationGuarantee,
  parseGuaranteeInput,
  parseGuaranteeOrder,
  guaranteeFeasible,
  schemeIllustration,
  type GuaranteeMode,
} from './approximationGuaranteeLessonModel'
import './approximation-guarantee-mockup.css'

const tr = (s: string) => tx(s, 'studios'),
  tabs: MockupTab[] = ['Learn', 'Visualization', 'Code', 'Practice', 'Experiments', 'Notes'],
  num = (n: number) => Number(n.toFixed(3)).toString()
type Run = ReturnType<typeof runApproximationGuarantee>
function Panel({ title, icon, children, className = '' }: { title: string; icon: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`ag-panel ${className}`}>
      <header>
        <span className="ag-icon">{icon}</span>
        <h2>{tr(title)}</h2>
      </header>
      {children}
    </section>
  )
}
const explanations = {
  cover: [
    'Use a maximal matching to get a 2-approximation for vertex cover.',
    'Matching edges have disjoint endpoints. Every cover must hit each matching edge, so OPT ≥ |M|. Taking both endpoints gives ALG = 2|M| ≤ 2·OPT. Maximality ensures every edge is covered.',
    'Runs in O(m) time using a greedy maximal matching.',
    'Find a maximal matching',
    'Take both endpoints',
    'Feasible solution',
  ],
  'metric-tsp': [
    'Build an MST, walk around it, then shortcut repeated cities to obtain a metric tour.',
    'Removing one edge from an optimal tour leaves a spanning tree, so MST ≤ OPT. Doubling the MST gives a walk of cost 2·MST. The triangle inequality makes every shortcut no more expensive. Therefore ALG ≤ 2·OPT.',
    'O(n² log n) here, using Kruskal on the complete graph.',
    'Find a minimum spanning tree',
    'Preorder and shortcut',
    'Close the tour',
  ],
  'max-cut': [
    'Assign each vertex to the side that creates more crossing edges to previously assigned vertices.',
    'When a vertex is assigned, at least half its edges to earlier vertices cross the cut. Every edge is counted exactly once. Thus ALG ≥ m/2 ≥ OPT/2. Equivalently OPT/ALG ≤ 2 for positive OPT.',
    'O(n + m) with adjacency lists; this small demonstrator scans edges.',
    'Assign the next vertex',
    'Keep more crossing edges',
    'Feasible partition',
  ],
} as const
export function ApproximationGuaranteeMockupLesson({ module, completed, toggleCompleted, theme, onToggleTheme }: MockupPageProps) {
  useLocaleRender()
  const navigate = useNavigate(),
    [mode, setMode] = useState<GuaranteeMode>('cover'),
    [run, setRun] = useState(() => runApproximationGuarantee('cover')),
    [cursor, setCursor] = useState(3),
    [phase, setPhase] = useState(0),
    [playing, setPlaying] = useState(false),
    [speed, setSpeed] = useState(800),
    [matching, setMatching] = useState(true),
    [solution, setSolution] = useState(true),
    [comparison, setComparison] = useState(true),
    [tab, setTab] = useState<MockupTab>('Visualization'),
    [reviewed, setReviewed] = useState<MockupTab[]>([]),
    [draft, setDraft] = useState(JSON.stringify(guaranteeGraph, null, 2)),
    [order, setOrder] = useState(''),
    [reverse, setReverse] = useState(false),
    [error, setError] = useState(''),
    [query, setQuery] = useState(''),
    [dialog, setDialog] = useState<{ title: string; body: ReactNode } | null>(null),
    [notes, setNotes] = usePersistentState('algodrishti-approximation-guarantee-notes', '', persistentString),
    [answer, setAnswer] = useState<number | null>(null),
    [epsilon, setEpsilon] = useState(0.1),
    [size, setSize] = useState(10),
    [fallbackTheme, setFallbackTheme] = useState(() => document.documentElement.dataset.theme ?? 'light'),
    search = useRef<HTMLInputElement>(null),
    modal = useRef<HTMLDialogElement>(null),
    frame = run.frames[cursor],
    info = explanations[mode],
    feasible = frame.feasible && guaranteeFeasible(run, frame),
    ratio = feasible && frame.alg > 0 && run.optimum > 0 ? (run.minimize ? frame.alg / run.optimum : run.optimum / frame.alg) : null,
    matches = query.trim()
      ? allModules
          .filter((m) => `${m.name} ${m.summary}`.toLowerCase().includes(query.trim().toLowerCase()))
          .sort((a, b) => Number(b.name.toLowerCase().includes(query.toLowerCase())) - Number(a.name.toLowerCase().includes(query.toLowerCase())))
          .slice(0, 5)
      : [],
    studied = completed.includes(module.id),
    scheme = schemeIllustration(size, epsilon)
  useEffect(() => {
    if (!playing) return
    const id = window.setTimeout(() => {
      if (cursor >= run.frames.length - 1) setPlaying(false)
      else {
        setCursor(cursor + 1)
        setPhase(run.frames[cursor + 1].phase)
      }
    }, speed)
    return () => clearTimeout(id)
  }, [playing, cursor, speed, run])
  useEffect(() => {
    if (dialog && !modal.current?.open) modal.current?.showModal()
  }, [dialog])
  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        search.current?.focus()
      }
    }
    window.addEventListener('keydown', fn)
    return () => window.removeEventListener('keydown', fn)
  }, [])
  useEffect(() => {
    const desktop = window.matchMedia('(min-width:1500px)'),
      reset = () => {
        if (desktop.matches) {
          const nav = document.querySelector('.global-sidebar .sidebar-navigation')
          if (nav) nav.scrollTop = 0
        }
      }
    const timer = window.setTimeout(reset, 350)
    desktop.addEventListener('change', reset)
    return () => {
      clearTimeout(timer)
      desktop.removeEventListener('change', reset)
    }
  }, [])
  const visit = (t: MockupTab) => {
      setTab(t)
      setReviewed((old) => (old.includes(t) ? old : [...old, t]))
    },
    seek = (index: number) => {
      setPlaying(false)
      setCursor(index)
      setPhase(run.frames[index].phase)
    },
    animate = () => {
      if (playing) setPlaying(false)
      else {
        if (cursor === run.frames.length - 1) {
          setCursor(0)
          setPhase(0)
        }
        setPlaying(true)
      }
    },
    install = (next: Run) => {
      setRun(next)
      setCursor(next.defaultCursor)
      setPhase(0)
      setPlaying(false)
      setError('')
      setAnswer(null)
    },
    changeMode = (value: GuaranteeMode) => {
      setMode(value)
      setOrder('')
      setReverse(false)
      setDraft(JSON.stringify(value === 'metric-tsp' ? guaranteeTsp : guaranteeGraph, null, 2))
      install(runApproximationGuarantee(value))
    },
    apply = () => {
      try {
        const input = parseGuaranteeInput(mode, draft)
        install(runApproximationGuarantee(mode, input, mode === 'cover' ? parseGuaranteeOrder(order, 'edges' in input ? input.edges.length : 0) : [], reverse))
      } catch (e) {
        setError((e as Error).message)
      }
    },
    proof = () =>
      setDialog({
        title: tr('Why the guarantee holds'),
        body: (
          <>
            <p>{tr(info[1])}</p>
            <p>
              {tr(
                'The exact optimum shown here is computed only for these small examples. The approximation algorithm and its proof do not require knowing OPT.',
              )}
            </p>
          </>
        ),
      }),
    inspectVertex = (v: number) =>
      setDialog({
        title: `${tr('Vertex')} ${v + 1}`,
        body: (
          <>
            <p>{`${tr('Degree')}: ${run.graph.edges.filter(([a, b]) => a === v || b === v).length}`}</p>
            <p>
              {mode === 'cover'
                ? `${tr('Selected in approximate cover')}: ${tr(frame.selected.includes(v) ? 'Yes' : 'No')}`
                : mode === 'max-cut'
                  ? `${tr('Partition')}: ${frame.partition[v] < 0 ? tr('Unassigned') : frame.partition[v] === 0 ? 'A' : 'B'}`
                  : `${tr('Tour position')}: ${frame.tour.indexOf(v) < 0 ? '—' : frame.tour.indexOf(v) + 1}`}
            </p>
            <p>{tr('Graph labels start at 1. Editable JSON vertex IDs start at 0.')}</p>
          </>
        ),
      }),
    inspectEdge = (i: number) => {
      const [u, v] = run.graph.edges[i]
      setDialog({
        title: `${tr('Edge')} ${u + 1}–${v + 1}`,
        body: (
          <>
            <p>{`${tr('Zero-based edge ID')}: ${i}`}</p>
            <p>{`${tr('Weight')}: ${num(run.weights[i])}`}</p>
            <p>
              {mode === 'cover'
                ? `${tr('Covered')}: ${tr(frame.covered[i] ? 'Yes' : 'No')}`
                : mode === 'max-cut'
                  ? `${tr('Crosses the current cut')}: ${tr(frame.highlighted.includes(i) ? 'Yes' : 'No')}`
                  : `${tr('In minimum spanning tree')}: ${tr(frame.highlighted.includes(i) ? 'Yes' : 'No')}`}
            </p>
            {mode === 'cover' && !frame.covered[i] && (
              <button
                className="ag-primary"
                onClick={() => {
                  const next = runApproximationGuarantee('cover', run.graph, [...frame.highlighted, i])
                  install(next)
                  setCursor(frame.highlighted.length + 1)
                  setDialog(null)
                }}
              >
                {tr('Use this edge next')}
              </button>
            )}
          </>
        ),
      })
    },
    keyboard = (e: React.KeyboardEvent, action: () => void) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        action()
      }
    },
    toggleTheme = () => {
      if (onToggleTheme) onToggleTheme()
      else {
        const value = (theme ?? fallbackTheme) === 'dark' ? 'light' : 'dark'
        setFallbackTheme(value)
        document.documentElement.dataset.theme = value
        localStorage.setItem('algodrishti-theme', value)
      }
    },
    loadPreset = (preset: string, selectedMode = mode) => {
      const value =
        selectedMode === 'metric-tsp'
          ? preset === 'zero'
            ? { mode: 'euclidean' as const, source: 0, points: [[0, 0] as [number, number]] }
            : guaranteeTsp
          : preset === 'star'
            ? { vertices: 8, edges: Array.from({ length: 7 }, (_, i) => [0, i + 1] as [number, number]) }
            : preset === 'zero'
              ? { vertices: 1, edges: [] }
              : guaranteeGraph
      setDraft(JSON.stringify(value, null, 2))
      setOrder('')
      setReverse(false)
      setMode(selectedMode)
      install(runApproximationGuarantee(selectedMode, value))
    }
  const chartValues = comparison ? [run.optimum, frame.alg, run.bound] : [frame.alg],
    chartNames = comparison ? ['OPT', 'ALG', run.minimize ? '2 · OPT' : 'OPT / 2'] : ['ALG'],
    chartMax = Math.max(1, ...chartValues),
    scaleMax = Math.ceil(chartMax / 4) * 4,
    guaranteeText =
      mode === 'cover'
        ? 'Matches the 2-approximation guarantee: taking both endpoints of matching edges costs at most twice optimum cover size.'
        : mode === 'metric-tsp'
          ? 'The completed metric tour costs at most twice the optimum tour.'
          : 'The completed cut has at least half as many edges as an optimal cut.'
  return (
    <div className="mom-page approximation-guarantee-page target-visual" data-target="47">
      <div className="ag-toolbar">
        <button className="ag-back" aria-label={tr('Back to DAA extensions')} onClick={() => navigate('/daa-extensions')}>
          <ArrowLeft size={21} />
        </button>
        <div className="ag-search">
          <Search size={20} />
          <input
            ref={search}
            aria-label={tr('Search topics')}
            placeholder={tr('Search topics, algorithms, or keywords...')}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') setQuery('')
              if (e.key === 'Enter' && matches[0]) navigate(algorithmPath(matches[0]))
            }}
          />
          <kbd>{'⌘ K'}</kbd>
          {query && (
            <div className="ag-search-results">
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
        <button className="ag-study" aria-pressed={studied} onClick={() => toggleCompleted(module.id)}>
          {studied ? <Check size={17} /> : <Bookmark size={17} />} {tr(studied ? 'Studied' : 'Mark studied')}
        </button>
        <AccountControl showLanguage={false} />
      </div>
      <header className="ag-hero">
        <button className="ag-back" aria-label={tr('Back to extension overview')} onClick={() => navigate('/daa-extensions')}>
          <ArrowLeft size={21} />
        </button>
        <div className="ag-heading">
          <div>
            <h1>{tr('Approximation Algorithms and Guarantees')}</h1>
            <span>{tr('DAA Extension')}</span>
          </div>
          <p>{tr('Prove feasibility and a worst-case ratio.')}</p>
        </div>
        <div className="ag-progress">
          <span>{`${reviewed.length} ${tr('of 6 sections')}`}</span>
          <div>
            {Array.from({ length: 5 }, (_, i) => (
              <i key={i} className={reviewed.length >= ((i + 1) * 6) / 5 ? 'ag-done' : ''} />
            ))}
          </div>
        </div>
        <button className="ag-primary ag-start" onClick={() => visit('Learn')}>
          {tr('Start Learning')}
          <ArrowRight size={20} />
        </button>
      </header>
      <MockupTabs active={tab} onChange={visit} tabs={tabs} />
      {tab === 'Visualization' ? (
        <>
          <div className="ag-top-grid">
            <Panel title={tr('Approximation Ratio')} icon={<BookOpen />} className="ag-ratio">
              <p>
                {tr('For a minimization problem, a p-approximation satisfies ALG ≤ p · OPT.')}
                <br />
                {tr('For a maximization problem, ALG ≥ OPT / p (equivalently OPT ≤ p · ALG).')}
              </p>
              <div className="ag-ratio-cards">
                <button
                  onClick={() =>
                    setDialog({
                      title: tr('Minimization ratio'),
                      body: (
                        <p>
                          {tr(
                            'For positive OPT, ρ = ALG / OPT. A p-approximation is feasible and satisfies ALG ≤ p·OPT on every allowed instance. The example ratio can be smaller than the worst-case factor.',
                          )}
                        </p>
                      ),
                    })
                  }
                >
                  <strong>{tr('Minimization (e.g., Vertex Cover)')}</strong>
                  <span>
                    {tr('Approximation ratio')} <em>{'ρ = '}</em>
                    <span className="ag-fraction">
                      <span>{'ALG'}</span>
                      <span>{'OPT'}</span>
                    </span>
                    <em>{' ≤ p'}</em>
                  </span>
                  <small>{'(p ≥ 1)'}</small>
                </button>
                <button
                  onClick={() =>
                    setDialog({
                      title: tr('Maximization ratio'),
                      body: (
                        <p>
                          {tr(
                            'For positive ALG and OPT, use ρ = OPT / ALG. The factor p ≥ 1 means ALG ≥ OPT / p. A 1/2-approximation for Max-Cut is also described as a factor-2 guarantee under this convention.',
                          )}
                        </p>
                      ),
                    })
                  }
                >
                  <strong>{tr('Maximization (e.g., Max-Cut)')}</strong>
                  <span>
                    {tr('Approximation ratio')} <em>{'ρ = '}</em>
                    <span className="ag-fraction">
                      <span>{'OPT'}</span>
                      <span>{'ALG'}</span>
                    </span>
                    <em>{' ≤ p'}</em>
                  </span>
                  <small>{'(p ≥ 1)'}</small>
                </button>
              </div>
            </Panel>
            <Panel title={tr('Example Selector')} icon={<Settings />} className="ag-selector">
              <select aria-label={tr('Approximation example')} value={mode} onChange={(e) => changeMode(e.target.value as GuaranteeMode)}>
                <option value="cover">{tr('Vertex Cover (2-Approximation)')}</option>
                <option value="metric-tsp">{tr('Metric TSP (2-Approximation)')}</option>
                <option value="max-cut">{tr('Max-Cut (1/2-Approximation)')}</option>
              </select>
              <p>{tr(info[0])}</p>
            </Panel>
            <Panel title={tr('Controls')} icon={<Play />} className="ag-controls">
              <button className="ag-primary" onClick={animate}>
                {playing ? <Pause size={17} /> : <Play size={17} fill="currentColor" />}
                {tr(playing ? 'Pause animation' : cursor < run.frames.length - 1 ? 'Resume animation' : 'Animate Approximation')}
              </button>
              <div className="ag-options">
                <div>
                  {[
                    [matching, setMatching, mode === 'cover' ? 'Show Matching' : mode === 'metric-tsp' ? 'Show MST' : 'Show Cut Edges'],
                    [solution, setSolution, mode === 'cover' ? 'Show Approx. Cover' : mode === 'metric-tsp' ? 'Show Tour' : 'Show Partition'],
                    [comparison, setComparison, 'Show OPT (for comparison)'],
                  ].map(([value, set, label]) => (
                    <label key={label as string}>
                      <input type="checkbox" checked={value as boolean} onChange={(e) => (set as (value: boolean) => void)(e.target.checked)} />
                      {tr(label as string)}
                    </label>
                  ))}
                </div>
                <button
                  className="ag-reset"
                  onClick={() => {
                    seek(0)
                    setMatching(true)
                    setSolution(true)
                    setComparison(true)
                  }}
                >
                  <RotateCw size={17} />
                  {tr('Reset')}
                </button>
              </div>
            </Panel>
          </div>
          <div className="ag-middle-grid">
            <Panel title={tr('Graph and Approximate Solution')} icon={<Network />} className="ag-graph">
              <div className="ag-graph-badges">
                <span>{`n = ${run.graph.vertices} ${tr('vertices')}`}</span>
                <span>{`m = ${run.graph.edges.length} ${tr('edges')}`}</span>
                <span>
                  {mode === 'cover'
                    ? `${tr(feasible ? 'Maximal matching size' : 'Matching size')} = ${frame.highlighted.length}`
                    : mode === 'metric-tsp'
                      ? `${tr('MST edges')} = ${frame.highlighted.length}`
                      : `${tr('Assigned')} = ${frame.partition.filter((v) => v >= 0).length}`}
                </span>
              </div>
              <div className="ag-graph-scroll">
                <div className="ag-graph-canvas">
                  <svg viewBox="0 0 713 199" width="713" height="199" aria-label={tr('Interactive approximation graph')}>
                    {run.graph.edges.map(([u, v], i) => {
                      const a = run.positions[u],
                        b = run.positions[v],
                        hot = matching && frame.highlighted.includes(i),
                        inTour =
                          mode === 'metric-tsp' &&
                          solution &&
                          frame.tour.some((x, k) => k > 0 && ((x === u && frame.tour[k - 1] === v) || (x === v && frame.tour[k - 1] === u)))
                      return (
                        <g
                          key={i}
                          role="button"
                          tabIndex={0}
                          aria-label={`${tr('Inspect edge')} ${u + 1}–${v + 1}`}
                          onClick={() => inspectEdge(i)}
                          onKeyDown={(e) => keyboard(e, () => inspectEdge(i))}
                        >
                          <rect
                            x={a[0]}
                            y={a[1] - 7}
                            width={Math.hypot(b[0] - a[0], b[1] - a[1])}
                            height="14"
                            fill="transparent"
                            transform={`rotate(${(Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI} ${a[0]} ${a[1]})`}
                          />
                          <line x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke="transparent" strokeWidth="14" />
                          <line
                            className={`ag-edge ${hot ? 'ag-matching-edge' : ''} ${inTour ? 'ag-tour-edge' : ''}`}
                            pointerEvents="none"
                            x1={a[0]}
                            y1={a[1]}
                            x2={b[0]}
                            y2={b[1]}
                          />
                        </g>
                      )
                    })}
                    {run.positions.map(([x, y], v) => {
                      const selected = solution && frame.selected.includes(v),
                        inMatching = matching && frame.highlighted.some((i) => run.graph.edges[i].includes(v))
                      return (
                        <g
                          className="ag-vertex"
                          key={v}
                          role="button"
                          tabIndex={0}
                          aria-label={`${tr('Inspect vertex')} ${v + 1}`}
                          onClick={() => inspectVertex(v)}
                          onKeyDown={(e) => keyboard(e, () => inspectVertex(v))}
                        >
                          <circle
                            cx={x}
                            cy={y}
                            r="20"
                            className={
                              mode === 'max-cut'
                                ? solution && frame.partition[v] >= 0
                                  ? frame.partition[v] === 0
                                    ? 'ag-cut-a'
                                    : 'ag-cut-b'
                                  : ''
                                : selected
                                  ? 'ag-selected'
                                  : ''
                            }
                          />
                          {mode !== 'max-cut' && inMatching && <circle className="ag-matching-node" cx={x} cy={y} r={selected ? 15 : 19} />}
                          <text x={x} y={y + 5} textAnchor="middle">
                            {v + 1}
                          </text>
                        </g>
                      )
                    })}
                  </svg>
                  <div className="ag-legend">
                    <span>
                      <i className="ag-dot ag-red" />
                      {tr(mode === 'cover' ? 'Selected (approx. cover)' : mode === 'max-cut' ? 'Partition A' : 'In current tour')}
                    </span>
                    <span>
                      <i className="ag-dot ag-blue" />
                      {tr(mode === 'max-cut' ? 'Partition B' : mode === 'metric-tsp' ? 'In MST' : 'In matching')}
                    </span>
                    <span>
                      <i className="ag-dot" />
                      {tr('Not selected')}
                    </span>
                    <span>
                      <i className="ag-line ag-hot" />
                      {tr(mode === 'cover' ? 'Matching edge' : mode === 'max-cut' ? 'Crossing edge' : 'MST edge')}
                    </span>
                    <span>
                      <i className="ag-line" />
                      {tr('Other edge')}
                    </span>
                  </div>
                </div>
              </div>
            </Panel>
            <Panel title={tr('Worst-Case Guarantee on This Example')} icon={<ChartNoAxesColumnIncreasing />} className="ag-guarantee">
              <div className="ag-comparison">
                <svg viewBox="0 0 375 204" width="375" height="204" aria-label={tr('Algorithm cost and optimum comparison')}>
                  <defs>
                    <pattern id="ag-hatch" width="4" height="4" patternUnits="userSpaceOnUse">
                      <path d="M0 0L4 4M-1 3L1 5M3 -1L5 1" stroke="#83aefe" strokeWidth="1" />
                    </pattern>
                    <linearGradient id="ag-green" x2="0" y2="1">
                      <stop stopColor="#65d29d" />
                      <stop offset="1" stopColor="#42b786" />
                    </linearGradient>
                    <linearGradient id="ag-blue" x2="0" y2="1">
                      <stop stopColor="#5ca6ff" />
                      <stop offset="1" stopColor="#3389f7" />
                    </linearGradient>
                  </defs>
                  {Array.from({ length: 5 }, (_, i) => (
                    <g key={i}>
                      <line x1="42" x2="353" y1={158 - i * 34} y2={158 - i * 34} stroke="#e1eafa" />
                      <text x="32" y={162 - i * 34} textAnchor="end">
                        {num((scaleMax * i) / 4)}
                      </text>
                    </g>
                  ))}
                  <path d="M42 21V158H353" fill="none" stroke="#52658d" />
                  <text transform="translate(8,100) rotate(-90)" textAnchor="middle">
                    {tr(mode === 'cover' ? 'Vertex cover size' : mode === 'metric-tsp' ? 'Tour cost' : 'Cut edges')}
                  </text>
                  {chartValues.map((v, i) => {
                    const x = comparison ? 64 + i * 103 : 167,
                      h = (v / scaleMax) * 136,
                      label = chartNames[i]
                    return (
                      <g
                        key={label}
                        role="button"
                        tabIndex={0}
                        aria-label={`${tr('Inspect cost')} ${label}`}
                        onClick={proof}
                        onKeyDown={(e) => keyboard(e, proof)}
                      >
                        <rect x={x} y="10" width="66" height="150" fill="transparent" />
                        <rect
                          x={x}
                          y={158 - h}
                          width="66"
                          height={h}
                          fill={label === 'ALG' ? 'url(#ag-blue)' : label === 'OPT' ? 'url(#ag-green)' : 'url(#ag-hatch)'}
                          stroke={label === 'OPT' ? '#29a274' : '#087aff'}
                          strokeDasharray={i === 2 ? '3 2' : undefined}
                        />
                        <text className="ag-bar-value" x={x + 33} y={151 - h} textAnchor="middle">
                          {num(v)}
                        </text>
                        <text className={label === 'OPT' ? 'ag-opt-label' : 'ag-alg-label'} x={x + 33} y="179" textAnchor="middle">
                          {label}
                        </text>
                        <text x={x + 33} y="193" textAnchor="middle">
                          {i === 0 && comparison ? tr(run.minimize ? '(minimum)' : '(maximum)') : label === 'ALG' ? tr('(approximation)') : ''}
                        </text>
                      </g>
                    )
                  })}
                </svg>
                <div className="ag-certificates">
                  <button className="ag-certificate" onClick={proof}>
                    <strong>
                      <Shield size={23} />
                      {tr('Approximation guarantee')}
                    </strong>
                    <span>{`ALG = ${num(frame.alg)}${comparison ? `,   OPT = ${num(run.optimum)}` : ''}`}</span>
                    <div className="ag-ratio-formula">
                      {feasible ? (
                        comparison ? (
                          ratio === null ? (
                            <span>{tr('Zero-cost instance: ratio undefined')}</span>
                          ) : (
                            <>
                              <em>{'ρ = '}</em>
                              <span className="ag-fraction">
                                <span>{run.minimize ? 'ALG' : 'OPT'}</span>
                                <span>{run.minimize ? 'OPT' : 'ALG'}</span>
                              </span>
                              {' = '}
                              <span className="ag-fraction">
                                <span>{num(run.minimize ? frame.alg : run.optimum)}</span>
                                <span>{num(run.minimize ? run.optimum : frame.alg)}</span>
                              </span>
                              {' = '}
                              <b>{num(ratio)}</b>
                              <small>
                                {'≤ 2  '}
                                {tr('(guaranteed)')}
                              </small>
                            </>
                          )
                        ) : (
                          tr('OPT comparison hidden')
                        )
                      ) : (
                        tr('Partial solution — finish feasibility first')
                      )}
                    </div>
                  </button>
                  <button className="ag-proof-summary" onClick={proof}>
                    <Check size={23} />
                    <span>
                      {tr(
                        feasible
                          ? guaranteeText
                          : 'The current partial state is not a feasible solution. Complete the algorithm before evaluating its approximation guarantee.',
                      )}
                    </span>
                  </button>
                </div>
              </div>
            </Panel>
          </div>
          <div className="ag-third-grid">
            <Panel title={tr('How the Algorithm Works')} icon={<Settings />} className="ag-how">
              <div>
                {[0, 1, 2].map((i) => (
                  <button
                    key={i}
                    aria-label={`${tr('Show algorithm stage')} ${i + 1}`}
                    className={phase === i ? 'ag-active' : ''}
                    onClick={() => {
                      setPlaying(false)
                      setPhase(i)
                      const preorderStart = run.frames.findIndex((f) => f.phase === 1)
                      setCursor(i === 0 ? 0 : i === 1 && preorderStart >= 0 ? preorderStart : run.frames.length - 1)
                    }}
                  >
                    <span className="ag-step-number">{i + 1}</span>
                    <strong>{tr(info[i + 3])}</strong>
                    <small>
                      {tr(
                        mode === 'cover'
                          ? [
                              'Repeatedly pick any edge and add it to the matching (removing incident edges).',
                              'Add both endpoints of every matching edge to the vertex cover.',
                              'Every edge is incident to a selected vertex, so we get a valid cover.',
                            ][i]
                          : mode === 'metric-tsp'
                            ? [
                                'Compute a minimum spanning tree of the complete metric graph.',
                                'Visit cities in preorder, shortcutting repeated visits.',
                                'Return to the start. Triangle inequalities preserve the bound.',
                              ][i]
                            : [
                                'Visit vertices in label order. Only earlier neighbors are considered.',
                                'Choose the side opposite the greater number of earlier neighbors.',
                                'Each vertex has a side; count all edges that cross.',
                              ][i],
                      )}
                    </small>
                  </button>
                ))}
              </div>
            </Panel>
            <Panel title={tr('PTAS / FPTAS Overview')} icon={<FlaskConical />} className="ag-schemes">
              <button onClick={() => visit('Experiments')}>
                <strong>{tr('PTAS (minimization)')}</strong>
                <span>{tr('For every fixed ε > 0, a PTAS outputs a (1 + ε)-approximation in polynomial input-size time.')}</span>
                <b>{tr('Ratio: (1 + ε)')}</b>
              </button>
              <button onClick={() => visit('Experiments')}>
                <strong>{tr('FPTAS (minimization)')}</strong>
                <span>{tr('A fully polynomial-time scheme runs in time polynomial in both n and 1/ε.')}</span>
                <b>{tr('Time: poly(n, 1/ε)')}</b>
              </button>
            </Panel>
            <Panel title={tr('Key Takeaways')} icon={<Lightbulb />} className="ag-takeaways">
              <ul>
                {[
                  'For minimization, a p-approximation satisfies ALG ≤ p · OPT.',
                  'For maximization, ALG ≥ OPT / p (equivalently OPT ≤ p · ALG).',
                  'Vertex cover uses a matching lower bound.',
                  'Metric TSP uses an MST lower bound and triangle inequality.',
                  'Success on examples alone does not prove an approximation ratio.',
                ].map((s) => (
                  <li key={s}>{tr(s)}</li>
                ))}
              </ul>
            </Panel>
          </div>
          <div className="ag-bottom-grid">
            <Panel title={tr('Correctness & Feasibility')} icon={<Check />} className="ag-correctness">
              <button onClick={proof}>
                {mode === 'cover' ? (
                  <ul>
                    <li>{tr('The algorithm always outputs a feasible solution (a valid vertex cover).')}</li>
                    <li>{tr('Each edge in the maximal matching contributes at most 2 vertices to the cover.')}</li>
                    <li>{tr('Since the matching has size |M|, we select at most 2|M| vertices and OPT ≥ |M|, so ALG ≤ 2 · OPT.')}</li>
                  </ul>
                ) : (
                  <p>{tr(info[1])}</p>
                )}
              </button>
            </Panel>
            <Panel title={tr('Complexity')} icon={<ChartNoAxesColumnIncreasing />} className="ag-complexity">
              <p>{tr(info[2])}</p>
              <button
                onClick={() =>
                  setDialog({
                    title: tr('Algorithm versus verification cost'),
                    body: (
                      <p>
                        {tr(
                          mode === 'cover'
                            ? 'The greedy matching can be implemented by one scan of all edges. Educational snapshots copy state, and the exact OPT comparison enumerates small solutions. These extra teaching and verification costs are not part of the approximation algorithm’s O(m) matching bound.'
                            : mode === 'metric-tsp'
                              ? 'This implementation sorts O(n²) complete-graph edges for Kruskal’s MST, giving O(n² log n) time, then takes a preorder traversal. Exact OPT uses a separate exponential Held–Karp verifier for at most nine cities. Its cost is not part of the approximation algorithm.'
                              : 'With adjacency lists, each vertex and edge is processed a constant number of times, giving O(n + m) time. This small demonstrator scans the edge list at each assignment and copies frames. Exact OPT separately enumerates all 2^n partitions; neither extra cost is required for the approximation guarantee.',
                        )}
                      </p>
                    ),
                  })
                }
              >
                {tr(mode === 'cover' ? 'Time Complexity: O(m)' : mode === 'metric-tsp' ? 'Time Complexity: O(n² log n)' : 'Time Complexity: O(n + m)')}
              </button>
              <p>{tr(mode === 'metric-tsp' ? 'Requires nonnegative symmetric metric distances.' : 'Works for any unweighted undirected graph.')}</p>
            </Panel>
            <Panel title={tr('Common Pitfalls')} icon={<TriangleAlert />} className="ag-pitfalls">
              <ul>
                {[
                  'Greedy matching must be maximal (not maximum).',
                  'For maximization problems, the convention is ALG ≥ OPT/p.',
                  'Success on a few examples does not imply a worst-case ratio.',
                  'Misunderstanding PTAS vs FPTAS time complexity.',
                ].map((s) => (
                  <li key={s}>{tr(s)}</li>
                ))}
              </ul>
            </Panel>
          </div>
        </>
      ) : (
        <section className="ag-learning">
          <h2>
            {tr(
              tab === 'Learn'
                ? 'Feasibility first, then the guarantee'
                : tab === 'Code'
                  ? 'Approximation algorithms in pseudocode'
                  : tab === 'Practice'
                    ? 'Predict the approximation ratio'
                    : tab === 'Experiments'
                      ? 'Explore inputs, proofs and accuracy'
                      : 'Your learning notes',
            )}
          </h2>
          {tab === 'Learn' && (
            <>
              <p>
                {tr(
                  'An approximation algorithm must return a feasible answer, then bound its quality against an unknown optimal solution on every allowed instance. An observed ratio on one graph is evidence about that graph, not a worst-case proof.',
                )}
              </p>
              <div className="ag-learning-cards">
                {(['cover', 'metric-tsp', 'max-cut'] as const).map((m) => (
                  <article key={m}>
                    <h3>{tr(m === 'cover' ? 'Vertex Cover' : m === 'metric-tsp' ? 'Metric TSP' : 'Max-Cut')}</h3>
                    <p>{tr(explanations[m][0])}</p>
                    <p>{tr(explanations[m][1])}</p>
                  </article>
                ))}
              </div>
              <h3>{tr('Worked example: vertex cover')}</h3>
              <p>
                {tr(
                  'The default graph has a maximal matching of size 3. Selecting both endpoints gives a cover of size 6. Exhaustive verification finds OPT = 4, so the observed ratio is 6/4 = 1.5. The proof guarantees at most 2 on every graph, not 1.5.',
                )}
              </p>
              <h3>{tr('A tight example')}</h3>
              <p>
                {tr(
                  'On a star, one matching edge selects the center and one leaf, so ALG = 2. The center alone is an optimal cover, so OPT = 1 and the ratio is 2. This disproves a universal factor 1.5 for this algorithm.',
                )}
              </p>
              <button
                className="ag-primary"
                onClick={() => {
                  changeMode('cover')
                  loadPreset('star', 'cover')
                  visit('Visualization')
                }}
              >
                {tr('Explore the tight star example')}
              </button>
              <h3>{tr('Assumptions matter')}</h3>
              <p>
                {tr(
                  'These vertex-cover and Max-Cut examples use unweighted, undirected graphs. The TSP shortcut proof requires nonnegative symmetric distances satisfying every triangle inequality. A constant-factor approximation is not automatically a PTAS. If ALG = OPT = 0, the cost inequality still holds, but the ratio 0/0 is undefined.',
                )}
              </p>
            </>
          )}
          {tab === 'Code' && (
            <>
              <pre>
                {mode === 'cover'
                  ? 'C ← ∅; M ← ∅\nfor each edge (u,v):\n  if u ∉ C and v ∉ C:\n    M ← M ∪ {(u,v)}\n    C ← C ∪ {u,v}\nreturn C\n// OPT ≥ |M|; |C| = 2|M| ≤ 2 OPT'
                  : mode === 'metric-tsp'
                    ? 'T ← minimum spanning tree of complete metric graph\norder ← preorder traversal of T\ntour ← order followed by the start city\nreturn tour\n// cost(tour) ≤ 2 cost(T) ≤ 2 OPT'
                    : 'A ← ∅; B ← ∅\nfor each vertex v:\n  a ← number of earlier neighbors in A\n  b ← number of earlier neighbors in B\n  if a > b: put v in B\n  else: put v in A\nreturn (A,B)\n// ALG ≥ m/2 ≥ OPT/2'}
              </pre>
              <p>{tr(info[1])}</p>
              <p>{tr('Exact OPT is computed separately for these small examples and is not used to construct the approximate solution.')}</p>
            </>
          )}
          {tab === 'Practice' && (
            <>
              <p>{tr('A vertex-cover algorithm selects 6 vertices, while the optimum is 4. What is its observed minimization ratio on this instance?')}</p>
              <div className="ag-answer-options">
                {[1, 1.5, 2].map((value) => (
                  <button key={value} aria-pressed={answer === value} onClick={() => setAnswer(value)}>
                    {value}
                  </button>
                ))}
              </div>
              {answer !== null && (
                <p role="status">
                  {tr(
                    answer === 1.5
                      ? 'Correct: ρ = ALG/OPT = 6/4 = 1.5. The worst-case guarantee remains 2.'
                      : 'Try again: minimization uses ALG/OPT. Divide 6 by 4; distinguish this instance from the worst case.',
                  )}
                </p>
              )}
              <button
                onClick={() => {
                  changeMode('cover')
                  visit('Visualization')
                }}
              >
                {tr('Check the worked example')}
              </button>
            </>
          )}
          {tab === 'Experiments' && (
            <>
              <div className="ag-experiment-controls">
                <label>
                  {tr('Example preset')}
                  <select aria-label={tr('Example preset')} onChange={(e) => loadPreset(e.target.value)} defaultValue="default">
                    <option value="default">{tr('Default example')}</option>
                    {mode !== 'metric-tsp' && <option value="star">{tr('Star graph — tight factor 2 for cover')}</option>}
                    <option value="zero">{tr('Zero-cost instance')}</option>
                  </select>
                </label>
                <button onClick={() => changeMode('cover')}>{tr('Vertex Cover')}</button>
                <button onClick={() => changeMode('metric-tsp')}>{tr('Metric TSP')}</button>
                <button onClick={() => changeMode('max-cut')}>{tr('Max-Cut')}</button>
              </div>
              <p>
                {tr(
                  mode === 'metric-tsp'
                    ? 'Edit 1–9 cities: points, source, and euclidean, manhattan or matrix mode. Matrices must be nonnegative, symmetric and satisfy triangle inequalities.'
                    : 'Edit 1–8 vertices and up to 20 undirected edges as zero-based endpoint pairs. No self-loops or duplicate edges. Graph labels display vertex IDs plus one.',
                )}
              </p>
              <label className="ag-json-label">
                {tr('Custom approximation input')}
                <textarea aria-label={tr('Custom approximation input')} value={draft} onChange={(e) => setDraft(e.target.value)} rows={10} />
              </label>
              {mode === 'cover' && (
                <label>
                  {tr('Preferred zero-based edge order')}
                  <input
                    aria-label={tr('Preferred zero-based edge order')}
                    value={order}
                    onChange={(e) => setOrder(e.target.value)}
                    placeholder={tr('e.g., 0, 2, 1')}
                  />
                </label>
              )}
              {mode === 'metric-tsp' && (
                <label>
                  <input type="checkbox" checked={reverse} onChange={(e) => setReverse(e.target.checked)} />
                  {tr('Reverse preorder child order')}
                </label>
              )}
              <button className="ag-primary" onClick={apply}>
                {tr('Apply custom input')}
              </button>
              {error && <p role="alert">{tr(error)}</p>}
              <p role="status">{`${tr('Current solution')}: ALG = ${num(run.final.alg)}, OPT = ${num(run.optimum)}, ρ = ${run.ratio === null ? '—' : num(run.ratio)}`}</p>
              <h3>{tr('Step through the algorithm')}</h3>
              <div className="ag-experiment-controls">
                <button disabled={cursor === 0} onClick={() => seek(cursor - 1)}>
                  {tr('Previous step')}
                </button>
                <button onClick={animate}>{tr(playing ? 'Pause animation' : 'Play animation')}</button>
                <button disabled={cursor === run.frames.length - 1} onClick={() => seek(cursor + 1)}>
                  {tr('Next step')}
                </button>
                <label>
                  {tr('Animation speed')}
                  <select aria-label={tr('Animation speed')} value={speed} onChange={(e) => setSpeed(Number(e.target.value))}>
                    <option value={1200}>{tr('Slow')}</option>
                    <option value={800}>{tr('Normal')}</option>
                    <option value={150}>{tr('Fast')}</option>
                  </select>
                </label>
              </div>
              <label>
                {`${tr('Step')} ${cursor} / ${run.frames.length - 1}`}
                <input
                  aria-label={tr('Algorithm step')}
                  type="range"
                  min={0}
                  max={run.frames.length - 1}
                  value={cursor}
                  onChange={(e) => seek(Number(e.target.value))}
                />
              </label>
              <p>{`${tr('Current cost')}: ${num(frame.alg)}. ${tr(feasible ? 'Feasible solution' : 'Partial solution')}`}</p>
              <button onClick={() => visit('Visualization')}>{tr('View current graph')}</button>
              <h3>{tr('PTAS and FPTAS: accuracy versus illustrative work')}</h3>
              <p>
                {tr(
                  'The expressions below illustrate possible dependence on input size and accuracy. They are not measured runtimes or claims that the selected problem has such a scheme.',
                )}
              </p>
              <div className="ag-experiment-controls">
                <label>
                  {tr('Input size n')}
                  <input
                    aria-label={tr('Input size n')}
                    type="number"
                    min={1}
                    max={100}
                    value={size}
                    onChange={(e) => {
                      const n = Number(e.target.value)
                      if (Number.isInteger(n) && n >= 1 && n <= 100) setSize(n)
                    }}
                  />
                </label>
                <label>
                  {tr('Accuracy ε')}
                  <input
                    aria-label={tr('Accuracy ε')}
                    type="range"
                    min="0.01"
                    max="1"
                    step="0.01"
                    value={epsilon}
                    onChange={(e) => setEpsilon(Number(e.target.value))}
                  />
                </label>
              </div>
              <p className="ag-scheme-values">{`ε = ${num(epsilon)}, 1 + ε = ${num(scheme.factor)}; n^(1/ε) = ${scheme.ptas.toExponential(2)}; n²/ε = ${scheme.fptas.toExponential(2)}`}</p>
              <p>
                {tr(
                  'For fixed ε, n^(1/ε) is polynomial in n, but not polynomial jointly in n and 1/ε. An FPTAS is polynomial in both. Smaller ε improves the approximation target and can require more work.',
                )}
              </p>
              <div className="ag-experiment-controls">
                <button onClick={toggleTheme}>{tr('Toggle color theme')}</button>
                <LanguageSelector />
              </div>
            </>
          )}
          {tab === 'Notes' && (
            <>
              <p>{tr('Record the feasibility argument, lower bound and approximation inequality. Notes are saved in this browser.')}</p>
              <textarea aria-label={tr('Approximation learning notes')} value={notes} onChange={(e) => setNotes(e.target.value)} rows={12} />
              <p role="status">{tr('Notes saved locally.')}</p>
            </>
          )}
        </section>
      )}
      {dialog && (
        <dialog
          className="ag-dialog"
          ref={modal}
          onCancel={() => setDialog(null)}
          onClick={(e) => {
            if (e.target === e.currentTarget) setDialog(null)
          }}
        >
          <div>
            <header>
              <h2>{dialog.title}</h2>
              <button aria-label={tr('Close guarantee inspector')} onClick={() => setDialog(null)}>
                <X />
              </button>
            </header>
            {dialog.body}
          </div>
        </dialog>
      )}
    </div>
  )
}
