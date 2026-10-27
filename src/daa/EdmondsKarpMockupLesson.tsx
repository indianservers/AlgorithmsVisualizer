// @localized-render
import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Bookmark,
  BookOpen,
  Check,
  ChevronLeft,
  ChevronRight,
  Code2,
  FileText,
  Lightbulb,
  Moon,
  Network,
  Pause,
  Play,
  RotateCcw,
  Scale,
  Search,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  Sun,
  TriangleAlert,
  X,
} from 'lucide-react'
import { tx, useLocaleRender } from '../i18n/render'
import { AccountControl } from '../account/AccountControl'
import { LanguageSelector } from '../i18n/LanguageSelector'
import { allModules } from '../algorithms'
import { algorithmPath } from '../utils/routing'
import { persistentString, usePersistentState } from '../hooks/usePersistentState'
import { MockupTabs, type MockupPageProps, type MockupTab } from './MockupLessonChrome'
import {
  flowCancellation,
  flowClassic,
  flowExample,
  flowPathLabel,
  flowVertexLabel,
  parseFlowNetwork,
  runEdmondsKarp,
  type FlowFrame,
  type FlowNetwork,
  type FlowRun,
  type ResidualArc,
} from './edmondsKarpModel'
import './edmonds-karp-mockup.css'
const tr = (s: string) => tx(s, 'studios'),
  tabs: MockupTab[] = ['Learn', 'Visualization', 'Code', 'Practice', 'Experiments', 'Notes']
const colors = ['#2879ff', '#279c6b', '#ffb000', '#a1b2cb', '#8148ff', '#2879ff', '#ee4666', '#279c6b']
function Panel({
  title,
  subtitle,
  icon,
  children,
  className = '',
  action,
}: {
  title: ReactNode
  subtitle?: string
  icon: ReactNode
  children: ReactNode
  className?: string
  action?: ReactNode
}) {
  return (
    <section className={`ef-panel ${className}`}>
      <header>
        <span className="ef-icon">{icon}</span>
        <div>
          <h2>{title}</h2>
          {subtitle && <p>{subtitle}</p>}
        </div>
        {action}
      </header>
      {children}
    </section>
  )
}
function Switch({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="ef-switch">
      <input type="checkbox" aria-label={label} checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <i />
      {label}
    </label>
  )
}
function FlowGraph({
  run,
  frame,
  residual,
  labels,
  showResidual,
  progress,
  onInspect,
}: {
  run: FlowRun
  frame: FlowFrame
  residual: boolean
  labels: boolean
  showResidual: boolean
  progress: number
  onInspect: (edge: number | null, vertex?: number) => void
}) {
  const key = useId().replace(/:/g, ''),
    n = run.network,
    points = Array.from({ length: n.vertices }, (_, i) =>
      n.vertices === 6
        ? (residual
            ? [
                [51, 108],
                [189, 36],
                [354, 36],
                [189, 180],
                [354, 180],
                [491, 108],
              ]
            : [
                [57, 108],
                [201, 36],
                [369, 36],
                [201, 180],
                [369, 180],
                [499, 108],
              ])[i]
        : i === n.source
          ? [50, 108]
          : i === n.sink
            ? [500, 108]
            : [155 + (i % 2) * 190, 35 + Math.floor(i / 2) * 53],
    ),
    arcs: ResidualArc[] = residual ? (showResidual ? frame.residual : []) : n.edges.map((e, edge) => ({ ...e, edge, reverse: false })),
    pathKey = (a: ResidualArc) => `${a.edge}:${a.reverse}`,
    pathSet = new Set(frame.path.map(pathKey))
  const radius = (vertex: number) => (n.vertices !== 6 ? 25 : vertex === n.source || vertex === n.sink ? (residual ? 28 : 25) : residual ? 25 : 23)
  return (
    <svg
      className={`ef-network-svg ${residual ? 'ef-residual-svg' : 'ef-flow-svg'}`}
      viewBox="0 0 540 225"
      preserveAspectRatio="none"
      aria-label={tr(residual ? 'Residual network with positive capacities' : 'Directed flow network')}
    >
      <defs>
        {[
          ['node', '#ffffff', '#dceaff'],
          ['source', '#c2ffda', '#8beab5'],
          ['sink', '#fff0f3', '#ffced8'],
        ].map(([name, start, end]) => (
          <radialGradient key={name} id={`${key}-${name}`} cx=".3" cy=".2" r=".9">
            <stop stopColor={start} />
            <stop offset="1" stopColor={end} />
          </radialGradient>
        ))}
        {[
          ['blue', '#0875ff'],
          ['orange', '#ffa000'],
          ['muted', '#657da5'],
          ['cut', '#ed395a'],
        ].map(([name, color]) => (
          <marker key={name} id={`${key}-${name}`} markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
            <path d="M0 0L7 3.5L0 7Z" fill={color} />
          </marker>
        ))}
      </defs>
      {arcs.map((arc, index) => {
        const [ax, ay] = points[arc.from],
          [bx, by] = points[arc.to],
          dx = bx - ax,
          dy = by - ay,
          distance = Math.hypot(dx, dy),
          parallel = arcs.filter((a) => (a.from === arc.from && a.to === arc.to) || (a.from === arc.to && a.to === arc.from)),
          ordinal = parallel.indexOf(arc),
          bend = parallel.length > 1 ? 16 + 12 * ordinal : 0,
          cx = (ax + bx) / 2 - (dy / distance) * bend,
          cy = (ay + by) / 2 + (dx / distance) * bend,
          da = Math.hypot(cx - ax, cy - ay),
          db = Math.hypot(bx - cx, by - cy),
          x1 = ax + ((cx - ax) * (radius(arc.from) + 1)) / da,
          y1 = ay + ((cy - ay) * (radius(arc.from) + 1)) / da,
          x2 = bx - ((bx - cx) * (radius(arc.to) + 2)) / db,
          y2 = by - ((by - cy) * (radius(arc.to) + 2)) / db,
          pathIndex = frame.path.findIndex((a) => pathKey(a) === pathKey(arc)),
          active = residual && pathSet.has(pathKey(arc)),
          cut = !residual && !frame.path.length && run.cutEdges.includes(arc.edge),
          label = residual ? String(arc.capacity) : `${frame.flow[arc.edge]} / ${n.edges[arc.edge].capacity}`,
          lx = (ax + 2 * cx + bx) / 4 + (Math.abs(dx) < 30 ? 18 : 0),
          ly = (ay + 2 * cy + by) / 4 - (Math.abs(dx) < 30 ? 0 : 13),
          stroke = cut ? 'cut' : active ? 'orange' : arc.reverse ? 'muted' : 'blue'
        return (
          <g
            key={`${arc.edge}-${arc.reverse}-${index}`}
            className={`ef-graph-edge ${active ? 'ef-path-edge' : ''} ${arc.reverse ? 'ef-reverse-edge' : ''} ${progress > pathIndex && active ? 'ef-animated-edge' : ''}`}
            data-flow-edge={arc.edge}
            data-reverse={arc.reverse}
            role="button"
            tabIndex={0}
            aria-label={tr(
              `Inspect ${residual ? 'residual' : 'flow'} edge ${flowVertexLabel(n, arc.from)} to ${flowVertexLabel(n, arc.to)}${arc.reverse ? ' (cancel flow)' : ''}`,
            )}
            onClick={() => onInspect(arc.edge)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onInspect(arc.edge)
              }
            }}
          >
            <path d={`M${x1} ${y1}Q${cx} ${cy} ${x2} ${y2}`} fill="none" stroke="transparent" strokeWidth="13" />
            <path
              d={`M${x1} ${y1}Q${cx} ${cy} ${x2} ${y2}`}
              fill="none"
              stroke={stroke === 'orange' ? '#ffa000' : stroke === 'cut' ? '#ed395a' : stroke === 'muted' ? '#7386a5' : '#0875ff'}
              strokeWidth={active ? 3.5 : 1.8}
              strokeDasharray={residual && !active ? '6 4' : undefined}
              markerEnd={`url(#${key}-${stroke})`}
            />
            <rect x={lx - label.length * 3.5 - 4} y={ly - 10} width={label.length * 7 + 8} height="19" rx="4" fill="#fbfdff" fillOpacity=".93" />
            <text x={lx} y={ly + 4} textAnchor="middle" className="ef-edge-label">
              {label}
            </text>
          </g>
        )
      })}
      {points.map(([x, y], vertex) => (
        <g
          key={vertex}
          className={`ef-graph-vertex ${vertex === n.source ? 'ef-source' : vertex === n.sink ? 'ef-sink' : ''}`}
          role="button"
          tabIndex={0}
          aria-label={tr(`Inspect ${residual ? 'residual' : 'flow'} vertex ${flowVertexLabel(n, vertex)}`)}
          onClick={() => onInspect(null, vertex)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              onInspect(null, vertex)
            }
          }}
        >
          <circle cx={x} cy={y} r={radius(vertex)} style={{ fill: `url(#${key}-${vertex === n.source ? 'source' : vertex === n.sink ? 'sink' : 'node'})` }} />
          {labels && (
            <text x={x} y={y + 6} textAnchor="middle">
              {flowVertexLabel(n, vertex)}
            </text>
          )}
        </g>
      ))}
    </svg>
  )
}
const algorithmCode = `flow[e] = 0 for each original directed edge
repeat:
  build residual adjacency lists:
    forward capacity = capacity[e] - flow[e]
    reverse capacity = flow[e]  // cancels this original edge
  parent = BFS(residual, source, positive-capacity arcs only)
  if sink was not reached: break
  path = reconstruct(parent, sink)
  delta = minimum residual capacity along path
  for arc in path:
    flow[arc.edge] += arc.reverse ? -delta : delta
S = vertices reachable from source in final residual graph
return flow, cut = original edges from S to V \\ S`
export function EdmondsKarpMockupLesson(props: MockupPageProps) {
  useLocaleRender()
  const navigate = useNavigate(),
    [tab, setTab] = useState<MockupTab>('Visualization'),
    [network, setNetwork] = useState<FlowNetwork>(() => structuredClone(flowExample)),
    [example, setExample] = useState('reference')
  const run = useMemo(() => runEdmondsKarp(network), [network])
  const [cursor, setCursor] = useState(0),
    [stage, setStage] = useState(0),
    [playing, setPlaying] = useState(false),
    [progress, setProgress] = useState(0),
    [speed, setSpeed] = useState(900),
    [showResidual, setShowResidual] = useState(true),
    [labels, setLabels] = useState(true),
    [query, setQuery] = useState(''),
    search = useRef<HTMLInputElement>(null),
    [modal, setModal] = useState<'edit' | 'inspect' | 'worked' | null>(null),
    dialog = useRef<HTMLDialogElement>(null),
    [draft, setDraft] = useState(''),
    editor = useRef<HTMLTextAreaElement>(null),
    [error, setError] = useState(''),
    [selectedEdge, setSelectedEdge] = useState<number | null>(null),
    [selectedVertex, setSelectedVertex] = useState(0),
    [capacity, setCapacity] = useState(''),
    [prediction, setPrediction] = useState(''),
    [feedback, setFeedback] = useState('')
  const [notes, setNotes] = usePersistentState('algodrishti-edmonds-karp-notes', '', persistentString),
    [reviewed, setReviewed] = usePersistentState<number[]>('algodrishti-edmonds-karp-reviewed', [], {
      deserialize: (value) => {
        try {
          const a: unknown = JSON.parse(value)
          return Array.isArray(a) ? [...new Set(a.filter((v): v is number => Number.isInteger(v) && v >= 0 && v < 6))] : []
        } catch {
          return []
        }
      },
    }),
    [localTheme, setLocalTheme] = useState(() => localStorage.getItem('algodrishti-theme') ?? 'light')
  const frame = run.frames[cursor],
    theme = props.theme ?? localTheme,
    studied = props.completed.includes(props.module.id),
    matches = query.trim() ? allModules.filter((m) => `${m.name} ${m.summary}`.toLowerCase().includes(query.toLowerCase())).slice(0, 5) : [],
    name = (v: number) => flowVertexLabel(network, v),
    cutLeft = run.final.reached.map(name).join(', '),
    cutRight = Array.from({ length: network.vertices }, (_, i) => i)
      .filter((i) => !run.final.reached.includes(i))
      .map(name)
      .join(', ')
  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem('algodrishti-theme', theme)
  }, [theme])
  useEffect(() => {
    if (modal) {
      dialog.current?.showModal()
      if (modal === 'edit') editor.current?.focus()
    } else dialog.current?.close()
  }, [modal])
  useEffect(() => {
    if (!playing) return
    const timer = setTimeout(() => {
      if (progress < frame.path.length) setProgress(progress + 1)
      else {
        setCursor(cursor + 1)
        setStage(cursor + 1 === run.frames.length - 1 ? 3 : 1)
        setPlaying(false)
        setProgress(0)
      }
    }, 1800 - speed)
    return () => clearTimeout(timer)
  }, [playing, progress, frame.path.length, cursor, run.frames.length, speed])
  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        search.current?.focus()
      }
    }
    window.addEventListener('keydown', handle)
    return () => window.removeEventListener('keydown', handle)
  }, [])
  function load(n: FlowNetwork, id: string) {
    runEdmondsKarp(n)
    setNetwork(structuredClone(n))
    setExample(id)
    setCursor(0)
    setStage(0)
    setPlaying(false)
    setProgress(0)
    setError('')
    setFeedback('')
  }
  function openEditor() {
    setDraft(JSON.stringify(network, null, 2))
    setError('')
    setModal('edit')
    setPlaying(false)
  }
  function chooseExample(id: string) {
    if (id === 'custom') {
      setExample('custom')
      openEditor()
    } else
      load(
        id === 'classic'
          ? flowClassic
          : id === 'reverse'
            ? flowCancellation
            : id === 'disconnected'
              ? { ...flowExample, edges: flowExample.edges.filter((e) => e.to !== 5) }
              : flowExample,
        id,
      )
  }
  function move(i: number) {
    setCursor(i)
    setStage(i === run.frames.length - 1 ? 3 : i === 0 ? 0 : 2)
    setPlaying(false)
    setProgress(0)
  }
  function chooseStage(s: number) {
    setStage(s)
    setCursor(s === 0 ? 0 : s === 3 ? run.frames.length - 1 : Math.min(1, run.frames.length - 1))
    setPlaying(false)
    setProgress(0)
  }
  function animate() {
    if (!frame.path.length) return
    setPlaying(!playing)
    setProgress(0)
  }
  function inspect(edge: number | null, vertex = 0) {
    setSelectedEdge(edge)
    setSelectedVertex(vertex)
    setCapacity(edge === null ? '' : String(network.edges[edge].capacity))
    setError('')
    setModal('inspect')
    setPlaying(false)
  }
  function applyCapacity() {
    try {
      if (!capacity.trim()) throw new Error('Enter an integer capacity.')
      const next = structuredClone(network)
      next.edges[selectedEdge!].capacity = Number(capacity)
      load(next, 'custom')
      setModal(null)
    } catch (e) {
      setError((e as Error).message)
    }
  }
  const reviewIndex = tabs.indexOf(tab),
    review = (
      <button
        className="ef-review"
        aria-pressed={reviewed.includes(reviewIndex)}
        onClick={() => setReviewed(reviewed.includes(reviewIndex) ? reviewed.filter((v) => v !== reviewIndex) : [...reviewed, reviewIndex])}
      >
        <Check size={15} />
        {tr(reviewed.includes(reviewIndex) ? 'Section reviewed' : 'Mark section reviewed')}
      </button>
    )
  const stages = [
    {
      title: 'Find augmenting path',
      body: 'BFS on residual graph finds',
      path: flowPathLabel(network, run.frames[0].path),
      detail: `(bottleneck = ${run.frames[0].bottleneck})`,
    },
    { title: 'Update flow', body: 'Add δ to path flow. Update residuals (add reverse edges).' },
    {
      title: 'Repeat BFS',
      body: run.frames[1]?.path.length ? 'Find next augmenting path' : 'Search again in the updated residual graph',
      path: run.frames[1]?.path.length ? flowPathLabel(network, run.frames[1].path) : undefined,
      detail: run.frames[1]?.path.length ? `(bottleneck = ${run.frames[1].bottleneck})` : undefined,
    },
    { title: 'No more paths', body: 'No augmenting path exists. Current flow is maximum and defines a minimum cut.' },
  ]
  const footer = (
    <div className="ef-footer-grid">
      <Panel title={tr('Key Takeaways')} icon={<Lightbulb />} className="ef-takeaways">
        <ul>
          {[
            'Use BFS on the residual graph to find augmenting paths (Edmonds–Karp).',
            'Augmentation preserves capacity constraints and flow conservation.',
            'When no augmenting path remains, the flow is maximum and the reachable set defines a min-cut.',
            'Time complexity: O(VE²) with adjacency lists.',
          ].map((s) => (
            <li key={s}>{tr(s)}</li>
          ))}
        </ul>
      </Panel>
      <Panel
        title={tr('Worked Example')}
        icon={<FileText />}
        className="ef-worked"
        action={
          <button className="ef-primary" onClick={() => setModal('worked')}>
            {tr('Try It')}
          </button>
        }
      >
        <p>{tr('For the graph shown above:')}</p>
        <ol>
          {[
            'Run BFS to find an augmenting path.',
            'Augment the flow by the bottleneck value.',
            'Update the residual graph (add reverse edges).',
            'Repeat until no augmenting path exists.',
          ].map((s, i) => (
            <li key={s}>
              <i>{i + 1}</i>
              {tr(s)}
            </li>
          ))}
        </ol>
        <p>{tr(`This example reaches a maximum flow of ${run.maximum}, with minimum cut {${cutLeft}} | {${cutRight}}.`)}</p>
      </Panel>
      <Panel title={tr('Correctness & Complexity')} icon={<BarChart3 />} className="ef-proof">
        <ul>
          <li>
            <b>{tr('Correctness:')}</b>{' '}
            {tr('Each augmentation increases flow and preserves feasibility. At termination, the reachable set yields an equal-capacity cut.')}
          </li>
          <li>
            <b>{tr('Time Complexity:')}</b> {'O(VE²)'} {tr('using BFS (Edmonds–Karp).')}
          </li>
          <li>
            <b>{tr('Space Complexity:')}</b> {'O(V + E)'} {tr('for the solver; replay stores one flow snapshot per augmentation.')}
          </li>
        </ul>
      </Panel>
      <Panel title={tr('Common Pitfalls')} icon={<TriangleAlert />} className="ef-pitfalls">
        <ul>
          {[
            'Forgetting to use the residual graph (reverse edges).',
            'Not using BFS (leads to poor complexity).',
            'Incorrectly updating residual capacities.',
            'Confusing flow value with cut capacity before termination.',
            'Stopping early when an augmenting path still exists.',
          ].map((s) => (
            <li key={s}>{tr(s)}</li>
          ))}
        </ul>
      </Panel>
    </div>
  )
  return (
    <div className="mom-page target-visual edmonds-karp-page" data-target="28">
      <div className="mom-topbar ef-topbar">
        <button className="ef-back" aria-label={tr('Back to Cook-Levin')} onClick={() => navigate('/complexity-theory/cook-levin')}>
          <ArrowLeft size={18} />
        </button>
        <div className="mom-search">
          <Search size={17} />
          <input
            ref={search}
            aria-label={tr('Search topics')}
            placeholder={tr('Search topics, algorithms, or keywords…')}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button className="ef-search-key" aria-label={tr('Focus topic search')} onClick={() => search.current?.focus()}>
            {'⌘ K'}
          </button>
          {matches.length > 0 && (
            <div className="mom-search-results">
              {matches.map((m) => (
                <button key={m.id} onClick={() => navigate(algorithmPath(m))}>
                  {m.name}
                </button>
              ))}
            </div>
          )}
        </div>
        <button className="mom-study" aria-pressed={studied} onClick={() => props.toggleCompleted(props.module.id)}>
          {studied ? <Check size={16} /> : <Bookmark size={16} />} {tr(studied ? 'Studied' : 'Mark studied')}
        </button>
        <AccountControl showLanguage={false} />
      </div>
      <header className="ef-lesson-header">
        <button className="ef-back" aria-label={tr('Open Cook-Levin lesson')} onClick={() => navigate('/complexity-theory/cook-levin')}>
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1>
            {tr('Ford–Fulkerson / Edmonds–Karp')}
            <span aria-hidden="true">{tr('DAA Extension')}</span>
          </h1>
          <p>{tr('Use BFS to find residual augmenting paths and expose a minimum cut.')}</p>
        </div>
        <div className="ef-progress" aria-label={tr(`${reviewed.length} of 6 sections reviewed`)}>
          <span>{tr(`${reviewed.length} of 6 sections`)}</span>
          <div>
            {tabs.map((s, i) => (
              <i key={s} className={reviewed.includes(i) ? 'ef-reviewed' : ''} />
            ))}
          </div>
        </div>
        <button className="ef-primary ef-start" onClick={() => setTab('Learn')}>
          {tr('Start Learning')}
          <ArrowRight size={18} />
        </button>
      </header>
      <MockupTabs
        tabs={tabs}
        active={tab}
        onChange={(value) => {
          setTab(value)
          setPlaying(false)
        }}
      />
      {tab === 'Visualization' ? (
        <>
          <section className="ef-visualization">
            <header className="ef-visual-heading">
              <BarChart3 />
              <div>
                <h2>{tr('Interactive Visualization')}</h2>
                <p>{tr('Explore augmenting paths using BFS on the residual graph. Watch the flow update and see the minimum cut emerge.')}</p>
              </div>
              <div className="ef-visual-options">
                <select aria-label={tr('Flow network example')} value={example} onChange={(e) => chooseExample(e.target.value)}>
                  <option value="reference">{tr('Example 1: 6 nodes')}</option>
                  <option value="classic">{tr('Classic: maximum flow 23')}</option>
                  <option value="reverse">{tr('Reverse-edge cancellation')}</option>
                  <option value="disconnected">{tr('Disconnected sink')}</option>
                  <option value="custom">{tr('Custom network…')}</option>
                </select>
                <Switch label={tr('Show residual graph')} checked={showResidual} onChange={setShowResidual} />
                <Switch label={tr('Show vertex labels')} checked={labels} onChange={setLabels} />
                <button
                  onClick={() => {
                    load(flowExample, 'reference')
                    setLabels(true)
                    setShowResidual(true)
                  }}
                >
                  <RotateCcw size={16} />
                  {tr('Reset')}
                </button>
              </div>
            </header>
            <div className="ef-graphs-grid">
              <Panel
                title={
                  <>
                    {tr('Flow Network')} <span className="ef-heading-detail">{tr('(current flow / capacity)')}</span>
                  </>
                }
                subtitle={tr(`Directed graph: capacities and current flow: ${frame.value}.`)}
                icon={<Network />}
                className="ef-flow-panel"
                action={
                  <div className="ef-terminal-badges">
                    <span>
                      <i />
                      {tr('Source:')} {name(network.source)}
                    </span>
                    <span>
                      <i />
                      {tr('Sink:')} {name(network.sink)}
                    </span>
                  </div>
                }
              >
                <FlowGraph run={run} frame={frame} residual={false} labels={labels} showResidual={showResidual} progress={progress} onInspect={inspect} />
                <div className="ef-graph-legend">
                  <span>
                    <i className="ef-source-key">{'S'}</i>
                    {tr('Source (s)')}
                  </span>
                  <span>
                    <i className="ef-sink-key">{'T'}</i>
                    {tr('Sink (t)')}
                  </span>
                  <span>
                    <i className="ef-edge-key" />
                    {tr('Edge (flow / capacity)')}
                  </span>
                  <span>
                    <i className="ef-current-key" />
                    {tr('Current flow')}
                  </span>
                  <button
                    className="ef-legend-toggle"
                    aria-label={tr('Toggle residual graph from legend')}
                    aria-pressed={showResidual}
                    onClick={() => setShowResidual(!showResidual)}
                  >
                    <i className="ef-residual-key" />
                    {tr('Residual edge')}
                  </button>
                </div>
              </Panel>
              <Panel
                title={
                  <>
                    {tr('Residual Graph')} <span className="ef-heading-detail">{tr('(for BFS)')}</span>
                  </>
                }
                subtitle={tr('Edges with positive residual capacity.')}
                icon={<ShieldCheck />}
                className="ef-residual-panel"
              >
                <FlowGraph run={run} frame={frame} residual labels={labels} showResidual={showResidual} progress={progress} onInspect={inspect} />
                {!showResidual && <span className="ef-residual-hidden">{tr('Residual edges hidden. Enable the switch to reveal them.')}</span>}
                <div className="ef-graph-legend">
                  <span>
                    <i className="ef-augment-key" />
                    {tr('BFS augmenting path')}
                  </span>
                  <span>
                    <i className="ef-residual-key" />
                    {tr('Residual edge (capacity > 0)')}
                  </span>
                  <span>
                    <i className="ef-other-key" />
                    {tr('Reverse residual edge')}
                  </span>
                </div>
              </Panel>
              <Panel title={tr('Augmenting Path & Animation')} icon={<Play />} className="ef-animation-panel">
                <div className="ef-frame-nav">
                  <span>{tr(`Step ${cursor + 1} of ${run.frames.length}`)}</span>
                  <button aria-label={tr('Previous augmentation')} disabled={cursor === 0} onClick={() => move(cursor - 1)}>
                    <ChevronLeft size={16} />
                  </button>
                  <button aria-label={tr('Next augmentation')} disabled={cursor === run.frames.length - 1} onClick={() => move(cursor + 1)}>
                    <ChevronRight size={16} />
                  </button>
                </div>
                <div className="ef-path-card" role="status">
                  <p>{tr(frame.path.length ? 'Augmenting path found by BFS:' : 'BFS found no augmenting path.')}</p>
                  <div className="ef-path-vertices">
                    {frame.path.length ? (
                      [frame.path[0].from, ...frame.path.map((a) => a.to)].map((v, i) => (
                        <span key={i}>
                          {i > 0 && <ArrowRight size={14} />}
                          <b className={v === network.source ? 'ef-source-chip' : v === network.sink ? 'ef-sink-chip' : ''}>{name(v)}</b>
                        </span>
                      ))
                    ) : (
                      <b>{tr('Maximum flow reached')}</b>
                    )}
                  </div>
                  <p>
                    <b>{tr('Bottleneck')}</b> {tr('(min residual capacity):')} <output>{frame.bottleneck}</output>
                  </p>
                </div>
                <button className="ef-primary ef-animate" onClick={animate} disabled={!frame.path.length}>
                  {playing ? <Pause size={18} /> : <Play size={18} />} {tr(playing ? 'Pause Flow Update' : 'Animate Flow Update')}
                </button>
                <label className="ef-speed">
                  {tr('Animation speed')}
                  <span>
                    {tr('Slow')}
                    <input
                      aria-label={tr('Flow animation speed')}
                      type="range"
                      min="200"
                      max="1600"
                      step="100"
                      value={speed}
                      onChange={(e) => setSpeed(Number(e.target.value))}
                    />
                    {tr('Fast')}
                  </span>
                </label>
              </Panel>
            </div>
          </section>
          <div className="ef-analysis-grid">
            <Panel title={tr('Step-by-Step Augmentations')} icon={<SlidersHorizontal />} className="ef-steps-panel">
              <div className="ef-stage-track">
                {stages.map((s, i) => (
                  <button key={s.title} aria-label={tr(`Augmentation stage ${i + 1}`)} aria-pressed={stage === i} onClick={() => chooseStage(i)}>
                    {i + 1}
                  </button>
                ))}
              </div>
              <div className="ef-stage-cards">
                {stages.map((s, i) => (
                  <button key={s.title} aria-label={tr(s.title)} aria-pressed={stage === i} onClick={() => chooseStage(i)}>
                    <b>{tr(s.title)}</b>
                    <span>{tr(s.body)}</span>
                    {s.path && <span className="ef-stage-path">{tr(s.path)}</span>}
                    {s.detail && <span>{s.detail}</span>}
                    {i < 3 && <ArrowRight className="ef-stage-arrow" size={17} />}
                  </button>
                ))}
              </div>
            </Panel>
            <Panel
              title={tr('Max-Flow / Min-Cut')}
              subtitle={tr('At termination, reachable vertices define the minimum cut.')}
              icon={<Scale />}
              className="ef-cut-panel"
            >
              <div className="ef-cut-grid">
                <section>
                  <h3>{tr('Maximum Flow Value')}</h3>
                  <output>{run.maximum}</output>
                  <p>
                    {tr('Total flow out of S')}
                    <br />
                    {tr('(net outgoing flow)')}
                  </p>
                </section>
                <section>
                  <h3>{tr('Minimum Cut')}</h3>
                  <p>{tr(`S-side: { ${cutLeft} }`)}</p>
                  <p>{tr(`T-side: { ${cutRight} }`)}</p>
                  <hr />
                  <p>{tr(`Cut capacity: ${run.cutCapacity}`)}</p>
                  <strong>
                    {tr('Equals maximum flow')} <Check size={14} />
                  </strong>
                </section>
              </div>
            </Panel>
            <Panel title={tr('Capacity Utilization')} subtitle={tr('Edge flow vs capacity at termination.')} icon={<BarChart3 />} className="ef-utilization">
              <div>
                {network.edges.map((edge, i) => {
                  const percent = edge.capacity ? Math.round((run.final.flow[i] / edge.capacity) * 100) : 0
                  return (
                    <button key={i} aria-label={tr(`Inspect utilization ${name(edge.from)} to ${name(edge.to)}`)} onClick={() => inspect(i)}>
                      <span>
                        {name(edge.from)}
                        {' → '}
                        {name(edge.to)}
                      </span>
                      <span>
                        {run.final.flow[i]}
                        {' / '}
                        {edge.capacity}
                      </span>
                      <i>
                        <i style={{ width: `${percent}%`, background: colors[i % colors.length] }} />
                      </i>
                      <span>
                        {percent}
                        {'%'}
                      </span>
                    </button>
                  )
                })}
              </div>
            </Panel>
          </div>
          {footer}
          {review}
        </>
      ) : tab === 'Learn' ? (
        <div className="ef-learning">
          <Panel title={tr('Maximum Flow, One Safe Improvement at a Time')} icon={<BookOpen />}>
            <p>
              {tr(
                'A flow sends quantities from a source S to a sink T. Every directed edge limits what it can carry. At each intermediate vertex, incoming flow equals outgoing flow. The flow value is net flow leaving S, which equals net flow entering T.',
              )}
            </p>
            <div className="ef-concept-grid">
              <article>
                <h3>{tr('1. Find room to improve')}</h3>
                <p>
                  {tr(
                    'A forward residual edge has capacity c − f. A reverse residual edge has capacity f: it allows the algorithm to undo earlier flow. BFS finds a path with the fewest edges, using only positive residual capacities.',
                  )}
                </p>
              </article>
              <article>
                <h3>{tr('2. Respect the bottleneck')}</h3>
                <p>
                  {tr(
                    'The smallest residual capacity on the path is δ. Add δ on each forward edge and subtract δ from the original flow when taking a reverse edge. This keeps every capacity and conservation constraint valid.',
                  )}
                </p>
              </article>
              <article>
                <h3>{tr('3. Certify the answer')}</h3>
                <p>
                  {tr(
                    'Once the sink is unreachable, let S-side be the vertices still reachable from the source. Edges leaving that set are saturated. Their total capacity equals the flow value, proving that this feasible flow is maximum.',
                  )}
                </p>
              </article>
            </div>
            <p>
              {tr(
                'Ford–Fulkerson is the augmenting-path method. Edmonds–Karp specifically chooses paths with BFS. With adjacency lists it runs in O(VE²), independent of capacity magnitudes.',
              )}
            </p>
            <a href="https://www.boost.org/doc/libs/1_85_0/libs/graph/doc/edmonds_karp_max_flow.html" target="_blank" rel="noreferrer">
              {tr('Read the Boost Graph Edmonds–Karp documentation')}
            </a>
            <button className="ef-primary" onClick={() => setTab('Visualization')}>
              {tr('Explore the flow network')}
            </button>
          </Panel>
          <Panel title={tr('Why Reverse Edges Matter')} icon={<RotateCcw />}>
            <p>
              {tr(
                'An early shortest path can use an edge that later needs to be undone. A reverse residual edge is permission to cancel an earlier choice; it does not create a new original connection or violate a capacity.',
              )}
            </p>
            <button
              onClick={() => {
                load(flowCancellation, 'reverse')
                setTab('Visualization')
              }}
            >
              {tr('Load the cancellation example')}
            </button>
            <p>
              {tr(
                'This teaching solver keeps separate residual arcs for each original edge, so opposite directed edges are not confused with cancellation arcs. The visual example uses valid capacities with a maximum flow of 11; all displayed flows are computed, never hardcoded.',
              )}
            </p>
          </Panel>
          {footer}
          {review}
        </div>
      ) : tab === 'Code' ? (
        <Panel title={tr('Executable Edmonds–Karp Structure')} icon={<Code2 />} className="ef-code">
          <pre>{algorithmCode}</pre>
          <p>
            {tr(
              'The solver uses residual adjacency lists. Replay stores a flow vector per augmentation; this extra history is separate from the O(V + E) solver workspace.',
            )}
          </p>
          <button onClick={() => setTab('Experiments')}>{tr('Inspect BFS and flow invariants')}</button>
          {review}
        </Panel>
      ) : tab === 'Practice' ? (
        <div className="ef-practice">
          <Panel title={tr('Predict the Bottleneck')} icon={<Lightbulb />}>
            <p>
              {tr(
                `The current residual path is ${flowPathLabel(network, frame.path)}. Its capacities are ${frame.path.map((a) => a.capacity).join(', ') || '(none)'}. How much additional flow can this path carry?`,
              )}
            </p>
            <input aria-label={tr('Predicted bottleneck')} value={prediction} onChange={(e) => setPrediction(e.target.value)} />
            <button
              className="ef-primary"
              onClick={() =>
                setFeedback(
                  prediction.trim() && Number(prediction) === frame.bottleneck
                    ? 'Correct: the smallest residual capacity limits the augmentation.'
                    : 'Try again: choose the minimum residual capacity; without a path the increase is zero.',
                )
              }
            >
              {tr('Check prediction')}
            </button>
            {feedback && <p role="status">{tr(feedback)}</p>}
          </Panel>
          <Panel title={tr('Does a Reverse Edge Add New Capacity?')} icon={<RotateCcw />}>
            <button onClick={() => setFeedback('Correct: a reverse edge cancels flow already assigned to its original edge.')}>
              {tr('It allows cancellation of existing flow')}
            </button>
            <button onClick={() => setFeedback('Reconsider: the original capacity does not increase. Reverse residual capacity comes from existing flow.')}>
              {tr('It increases the original capacity')}
            </button>
          </Panel>
          <Panel title={tr('When Can You Stop?')} icon={<ShieldCheck />}>
            <p>
              {tr(
                'A large flow is not a certificate of optimality. Stop only when BFS cannot reach T. The final reachable set defines a cut with the same capacity as the flow value.',
              )}
            </p>
          </Panel>
          {review}
        </div>
      ) : tab === 'Experiments' ? (
        <div className="ef-experiments">
          <Panel title={tr('Editable Flow Network Laboratory')} icon={<Settings />}>
            <div className="ef-lab-actions">
              <button className="ef-primary" onClick={openEditor}>
                {tr('Edit network JSON')}
              </button>
              <button onClick={() => load(flowClassic, 'classic')}>{tr('Load classic network')}</button>
              <button onClick={() => load(flowCancellation, 'reverse')}>{tr('Load cancellation network')}</button>
              <button onClick={() => move(run.frames.length - 1)}>{tr('Jump to maximum flow')}</button>
              <button onClick={() => move(0)}>{tr('Restart from zero flow')}</button>
            </div>
            <p className="ef-invariant-summary" role="status">
              {tr(`Current flow ${frame.value}. Capacities and conservation verified. Maximum flow ${run.maximum}; minimum cut capacity ${run.cutCapacity}.`)}
            </p>
            <table className="ef-bfs-table">
              <caption>{tr('Current BFS discovery order and parents')}</caption>
              <thead>
                <tr>
                  <th>{tr('Vertex')}</th>
                  <th>{tr('BFS parent')}</th>
                  <th>{tr('Reachable')}</th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: network.vertices }, (_, i) => (
                  <tr key={i}>
                    <td>{name(i)}</td>
                    <td>{frame.parent[i] < 0 ? '—' : name(frame.parent[i])}</td>
                    <td>{tr(frame.reached.includes(i) ? 'Yes' : 'No')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p>{tr(`BFS discovery order: ${frame.order.map(name).join(' → ')}.`)}</p>
            <p>
              {tr(
                `Augmentations: ${run.augmentations}. Final cut edges: ${run.cutEdges.map((i) => `${name(network.edges[i].from)} → ${name(network.edges[i].to)} (${network.edges[i].capacity})`).join(', ') || '(none)'}.`,
              )}
            </p>
            <button onClick={() => setTab('Visualization')}>{tr('View the current graphs')}</button>
          </Panel>
          {review}
        </div>
      ) : (
        <Panel title={tr('Your Maximum-Flow Notes')} icon={<BookOpen />} className="ef-notes">
          <label>
            {tr('Explain bottlenecks, reverse residual edges and the min-cut certificate.')}
            <textarea aria-label={tr('Maximum-flow notes')} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </label>
          <p>{tr('Your notes and reviewed sections are saved in this browser.')}</p>
          <LanguageSelector />
          <button
            aria-label={tr('Toggle color theme')}
            onClick={() => (props.onToggleTheme ? props.onToggleTheme() : setLocalTheme(theme === 'dark' ? 'light' : 'dark'))}
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />} {tr('Toggle color theme')}
          </button>
          {review}
        </Panel>
      )}
      <dialog
        ref={dialog}
        className="ef-dialog"
        aria-label={tr(modal === 'edit' ? 'Edit flow network' : modal === 'inspect' ? 'Inspect network element' : 'Worked maximum-flow example')}
        onCancel={() => setModal(null)}
      >
        <button className="ef-close" aria-label={tr('Close flow dialog')} onClick={() => setModal(null)}>
          <X size={18} />
        </button>
        {modal === 'edit' ? (
          <>
            <h2>{tr('Edit Directed Network')}</h2>
            <p>
              {tr(
                'Use 2–8 vertices with indices 0 to V−1, distinct source and sink, and one edge per directed pair. Capacities must be integers 0–1000. Opposite directed edges are supported.',
              )}
            </p>
            <label>
              {tr('Network JSON')}
              <textarea ref={editor} aria-label={tr('Flow network JSON')} value={draft} onChange={(e) => setDraft(e.target.value)} />
            </label>
            {error && <p role="alert">{tr(error)}</p>}
            <button
              className="ef-primary"
              onClick={() => {
                try {
                  load(parseFlowNetwork(draft), 'custom')
                  setModal(null)
                } catch (e) {
                  setError((e as Error).message)
                }
              }}
            >
              {tr('Apply network')}
            </button>
          </>
        ) : modal === 'inspect' ? (
          <>
            {selectedEdge !== null ? (
              <>
                <h2>{tr(`Original edge ${name(network.edges[selectedEdge].from)} → ${name(network.edges[selectedEdge].to)}`)}</h2>
                <p>
                  {tr(
                    `Current flow: ${frame.flow[selectedEdge]}; capacity: ${network.edges[selectedEdge].capacity}; forward residual: ${network.edges[selectedEdge].capacity - frame.flow[selectedEdge]}; reverse cancellation capacity: ${frame.flow[selectedEdge]}.`,
                  )}
                </p>
                <p>{tr('Changing a capacity recomputes the entire run from zero flow.')}</p>
                <label>
                  {tr('Capacity')}
                  <input aria-label={tr('Edge capacity')} value={capacity} onChange={(e) => setCapacity(e.target.value)} />
                </label>
                {error && <p role="alert">{tr(error)}</p>}
                <button className="ef-primary" onClick={applyCapacity}>
                  {tr('Apply edge capacity')}
                </button>
              </>
            ) : (
              <>
                <h2>{tr(`Vertex ${name(selectedVertex)}`)}</h2>
                <p>
                  {tr(
                    `BFS parent: ${frame.parent[selectedVertex] < 0 ? 'none' : name(frame.parent[selectedVertex])}. Reachable in the current residual graph: ${frame.reached.includes(selectedVertex) ? 'yes' : 'no'}.`,
                  )}
                </p>
                <p>{tr(`Final minimum-cut side: ${run.final.reached.includes(selectedVertex) ? 'S-side' : 'T-side'}.`)}</p>
              </>
            )}
          </>
        ) : (
          <>
            <h2>{tr('Worked Augmentations')}</h2>
            <ol>
              {run.frames
                .filter((f) => f.path.length)
                .map((f, i) => (
                  <li key={i}>
                    {flowPathLabel(network, f.path)}
                    {' — '}
                    {tr(`bottleneck ${f.bottleneck}, flow ${f.value} → ${f.value + f.bottleneck}`)}
                  </li>
                ))}
            </ol>
            <p>{tr(`Maximum flow ${run.maximum} = cut capacity ${run.cutCapacity}. S-side {${cutLeft}}; T-side {${cutRight}}.`)}</p>
            <button
              className="ef-primary"
              onClick={() => {
                setModal(null)
                setTab('Visualization')
                move(0)
                if (run.frames[0].path.length) setPlaying(true)
              }}
            >
              {tr('Play the first augmentation')}
            </button>
          </>
        )}
      </dialog>
    </div>
  )
}
