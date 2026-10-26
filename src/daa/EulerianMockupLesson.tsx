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
  CheckCircle2,
  Code2,
  FileText,
  Info,
  Lightbulb,
  Moon,
  Network,
  Pause,
  Play,
  RotateCcw,
  Settings,
  ShieldCheck,
  SkipForward,
  Sun,
  TriangleAlert,
  X,
} from 'lucide-react'
import { tx, useLocaleRender } from '../i18n/render'
import { LanguageSelector } from '../i18n/LanguageSelector'
import { AccountControl } from '../account/AccountControl'
import { persistentString, usePersistentState } from '../hooks/usePersistentState'
import { MockupTabs, type MockupPageProps, type MockupTab } from './MockupLessonChrome'
import { eulerExample, parseEulerGraph, runEulerLesson, type EulerGraph, type EulerRun } from './eulerianLessonModel'
import './eulerian-mockup.css'
const tr = (s: string) => tx(s, 'studios'),
  tabs: MockupTab[] = ['Learn', 'Visualization', 'Code', 'Practice', 'Experiments'],
  spliceGraph: EulerGraph = {
    vertices: 5,
    start: null,
    edges: [
      [0, 1],
      [1, 2],
      [2, 0],
      [1, 3],
      [3, 4],
      [4, 1],
    ],
  }
function Panel({ title, icon, children, className = '' }: { title: string; icon: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`eu-panel ${className}`}>
      <header>
        <span className="eu-icon">{icon}</span>
        <h2>{title}</h2>
      </header>
      {children}
    </section>
  )
}
function Switch({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="eu-switch">
      <input type="checkbox" aria-label={label} checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <i />
      {label}
    </label>
  )
}
function EulerDiagram({
  run,
  cursor,
  showUsed,
  showDegree,
  onVertex,
  onEdge,
}: {
  run: EulerRun
  cursor: number
  showUsed: boolean
  showDegree: boolean
  onVertex: (v: number) => void
  onEdge: (e: number) => void
}) {
  const id = useId().replace(/:/g, ''),
    graph = run.graph,
    frame = run.frames[cursor],
    active = frame.kind === 'consume' ? frame.edge : undefined,
    point = (v: number) =>
      graph.vertices === 4
        ? [
            [355, 86],
            [532, 179],
            [355, 268],
            [179, 179],
          ][v]
        : [420 + 230 * Math.cos(-Math.PI / 2 + (v * 2 * Math.PI) / graph.vertices), 170 + 105 * Math.sin(-Math.PI / 2 + (v * 2 * Math.PI) / graph.vertices)],
    consumed = new Map(
      run.frames
        .slice(0, cursor + 1)
        .filter((f) => f.kind === 'consume')
        .map((f) => [f.edge!, [f.from!, f.to!]]),
    )
  return (
    <div className="eu-diagram-scroll" role="region" tabIndex={0} aria-label={tr('Scrollable Eulerian graph')}>
      <svg className="eu-diagram" viewBox="0 0 845 344" preserveAspectRatio="none" aria-label={tr('Eulerian traversal graph with consumed edges')}>
        <defs>
          {[
            ['regular', '#eafaff', '#a6d8ff'],
            ['start', '#ddfbe5', '#93e6aa'],
            ['current', '#ffe3e9', '#ff9ab1'],
          ].map(([name, a, b]) => (
            <linearGradient key={name} id={`${id}-${name}`} x2="0" y2="1">
              <stop stopColor={a} />
              <stop offset="1" stopColor={b} />
            </linearGradient>
          ))}
          {[
            ['active', '#0875ff'],
            ['used', '#899bb6'],
          ].map(([name, color]) => (
            <marker key={name} id={`${id}-${name}`} markerUnits="userSpaceOnUse" markerWidth="12" markerHeight="12" refX="11" refY="6" orient="auto">
              <path d="M0 0L12 6L0 12Z" fill={color} />
            </marker>
          ))}
        </defs>
        {graph.edges.map(([a, b], edge) => {
          const used = frame.used[edge],
            isActive = edge === active
          if (used && !isActive && !showUsed) return null
          const [from, to] = consumed.get(edge) ?? [a, b],
            [x1, y1] = point(from),
            [x2, y2] = point(to),
            group = graph.edges.flatMap(([u, v], i) => ((u === a && v === b) || (u === b && v === a) ? [i] : [])),
            bend = (group.indexOf(edge) - (group.length - 1) / 2) * 38 * (from <= to ? 1 : -1),
            distance = Math.hypot(x2 - x1, y2 - y1) || 1,
            cx = (x1 + x2) / 2 - ((y2 - y1) / distance) * bend,
            cy = (y1 + y2) / 2 + ((x2 - x1) / distance) * bend,
            r1 = Math.hypot(cx - x1, cy - y1) || 1,
            r2 = Math.hypot(x2 - cx, y2 - cy) || 1,
            path =
              a === b
                ? `M${x1 + 18} ${y1 - 12}C${x1 + 94} ${y1 - 62} ${x1 + 94} ${y1 + 62} ${x1 + 18} ${y1 + 12}`
                : `M${x1 + ((cx - x1) * 28) / r1} ${y1 + ((cy - y1) * 28) / r1}Q${cx} ${cy} ${x2 - ((x2 - cx) * 29) / r2} ${y2 - ((y2 - cy) * 29) / r2}`
          return (
            <g
              key={edge}
              className={`eu-edge ${isActive ? 'eu-active-edge' : used ? 'eu-used-edge' : 'eu-untraversed-edge'}`}
              data-euler-edge={edge}
              role="button"
              tabIndex={0}
              aria-label={tr(`Inspect Eulerian edge ${edge + 1}: ${a} to ${b}`)}
              onClick={() => onEdge(edge)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  onEdge(edge)
                }
              }}
            >
              <rect
                x={a === b ? x1 + 28 : Math.min(x1, x2) - 7}
                y={a === b ? y1 - 30 : Math.min(y1, y2) - 7}
                width={a === b ? 56 : Math.abs(x2 - x1) + 14}
                height={a === b ? 60 : Math.abs(y2 - y1) + 14}
                fill="transparent"
                pointerEvents={a === b ? 'all' : 'none'}
              />
              <path d={path} fill="none" stroke="transparent" strokeWidth="14" />
              <path d={path} fill="none" markerEnd={used ? `url(#${id}-${isActive ? 'active' : 'used'})` : undefined} />
            </g>
          )
        })}
        {Array.from({ length: graph.vertices }, (_, v) => v).map((v) => {
          const [x, y] = point(v),
            isStart = v === run.check.start,
            isCurrent = v === frame.current && run.check.feasible,
            degree = run.check.degree[v],
            chip =
              graph.vertices === 4
                ? [
                    [328, 30],
                    [566, 163],
                    [329, 322],
                    [94, 163],
                  ][v]
                : [x - 27, y < 90 ? y + 34 : y - 70],
            kind = isStart ? 'start' : isCurrent ? 'current' : 'regular',
            currentTagY = y > 255 ? y + 29 : y + 34
          return (
            <g
              key={v}
              className={`eu-vertex ${isStart ? 'eu-start-vertex' : ''} ${isCurrent ? 'eu-current-vertex' : ''}`}
              role="button"
              tabIndex={0}
              aria-label={tr(`Inspect Eulerian vertex ${v}`)}
              onClick={() => onVertex(v)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  onVertex(v)
                }
              }}
            >
              <rect x={x - 30} y={y - 30} width="60" height="60" fill="transparent" />
              <circle cx={x} cy={y} r="27" fill={`url(#${id}-${kind})`} />
              <text className="eu-vertex-label" x={x} y={y + 7} textAnchor="middle">
                {v}
              </text>
              {isStart && (
                <g className="eu-start-tag" transform={`translate(${x - 28},${Math.max(1, y - 84)})`}>
                  <rect width="59" height="28" rx="8" />
                  <text x="29.5" y="19" textAnchor="middle">
                    {tr('Start')}
                  </text>
                </g>
              )}
              {isCurrent && (
                <g className="eu-current-tag" transform={`translate(${x - 40},${currentTagY})`}>
                  <rect width="80" height="27" rx="8" />
                  <text x="40" y="18" textAnchor="middle">
                    {tr('Current')}
                  </text>
                </g>
              )}
              {showDegree && (
                <g className="eu-degree-chip" transform={`translate(${chip[0]},${chip[1]})`}>
                  <rect width="51" height={graph.vertices === 4 && v === 2 ? 22 : 31} rx="8" />
                  <text x="25.5" y={graph.vertices === 4 && v === 2 ? 16 : 21} textAnchor="middle">{`d: ${degree}`}</text>
                </g>
              )}
            </g>
          )
        })}
      </svg>
    </div>
  )
}
const eulerCode = `check: 0 or 2 vertices have odd degree
check: all positive-degree vertices are connected
start = an odd vertex, or any positive-degree vertex
stack = [start]; reverseTrail = []
while stack is not empty:
  v = stack.top()
  if an unused incident edge (v, u) remains:
    mark its edge ID used
    stack.push(u)
  else:
    reverseTrail.push(stack.pop())
trail = reverse(reverseTrail)
verify every edge ID appears exactly once`
export function EulerianMockupLesson(props: MockupPageProps) {
  useLocaleRender()
  const navigate = useNavigate(),
    [tab, setTab] = useState<MockupTab>('Visualization'),
    [graph, setGraph] = useState<EulerGraph>(() => structuredClone(eulerExample))
  const run = useMemo(() => runEulerLesson(graph), [graph])
  const [cursor, setCursor] = useState(2),
    [playing, setPlaying] = useState(false),
    [speed, setSpeed] = useState(700),
    [used, setUsed] = useState(true),
    [degree, setDegree] = useState(true),
    [example, setExample] = useState('default'),
    [modal, setModal] = useState<'edit' | 'edge' | 'vertex' | 'worked' | null>(null),
    dialog = useRef<HTMLDialogElement>(null),
    editor = useRef<HTMLTextAreaElement>(null),
    [draft, setDraft] = useState(''),
    [error, setError] = useState(''),
    [selectedEdge, setSelectedEdge] = useState(0),
    [selectedVertex, setSelectedVertex] = useState(0),
    [prediction, setPrediction] = useState(''),
    [feedback, setFeedback] = useState(''),
    [localTheme, setLocalTheme] = useState(() => localStorage.getItem('algodrishti-theme') ?? 'light')
  const [notes, setNotes] = usePersistentState('algodrishti-eulerian-notes', '', persistentString),
    [reviewed, setReviewed] = usePersistentState<number[]>('algodrishti-eulerian-reviewed', [], {
      deserialize: (text) => {
        try {
          const a: unknown = JSON.parse(text)
          return Array.isArray(a) ? [...new Set(a.filter((v): v is number => Number.isInteger(v) && v >= 0 && v < 5))] : []
        } catch {
          return []
        }
      },
    })
  const frame = run.frames[cursor],
    theme = props.theme ?? localTheme,
    studied = props.completed.includes(props.module.id),
    trail = frame.stack.length ? frame.stack : run.trail,
    selectedMove = run.frames.findIndex((f) => f.edge === selectedEdge && f.kind === 'consume'),
    validStatus = run.check.feasible ? 'Valid for Eulerian trail' : run.check.exists ? 'Choose a valid start' : 'No Eulerian trail'
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
      const next = cursor + 1
      setCursor(next)
      if (next === run.frames.length - 1) setPlaying(false)
    }, speed)
    return () => clearTimeout(timer)
  }, [playing, cursor, run.frames.length, speed])
  function load(next: EulerGraph, id: string) {
    const calculated = runEulerLesson(next)
    setGraph(structuredClone(next))
    setCursor(calculated.defaultCursor)
    setPlaying(false)
    setExample(id)
    setError('')
    setFeedback('')
  }
  function chooseExample(id: string) {
    if (id === 'custom') {
      setExample('custom')
      openEditor()
    } else if (id === 'open')
      load(
        {
          vertices: 4,
          start: null,
          edges: [
            [0, 1],
            [1, 2],
            [2, 3],
          ],
        },
        id,
      )
    else if (id === 'splice') load(spliceGraph, id)
    else if (id === 'odd')
      load(
        {
          vertices: 4,
          start: null,
          edges: [
            [0, 1],
            [0, 2],
            [0, 3],
          ],
        },
        id,
      )
    else if (id === 'disconnected')
      load(
        {
          vertices: 6,
          start: null,
          edges: [
            [0, 1],
            [1, 2],
            [2, 0],
            [3, 4],
            [4, 5],
            [5, 3],
          ],
        },
        id,
      )
    else if (id === 'parallel')
      load(
        {
          vertices: 2,
          start: null,
          edges: [
            [0, 0],
            [0, 1],
            [0, 1],
            [1, 1],
          ],
        },
        id,
      )
    else load(eulerExample, 'default')
  }
  function openEditor() {
    setDraft(JSON.stringify(graph, null, 2))
    setError('')
    setModal('edit')
    setPlaying(false)
  }
  function togglePlay() {
    if (!run.check.feasible) return
    if (playing) {
      setPlaying(false)
      return
    }
    if (cursor === run.frames.length - 1) setCursor(0)
    setPlaying(true)
  }
  function step() {
    setPlaying(false)
    setCursor(cursor === run.frames.length - 1 ? 0 : cursor + 1)
  }
  function inspectVertex(v: number) {
    setSelectedVertex(v)
    setModal('vertex')
    setPlaying(false)
  }
  function inspectEdge(e: number) {
    setSelectedEdge(e)
    setModal('edge')
    setPlaying(false)
  }
  const reviewIndex = tabs.indexOf(tab),
    review = (
      <button
        className="eu-review"
        aria-pressed={reviewed.includes(reviewIndex)}
        onClick={() => setReviewed(reviewed.includes(reviewIndex) ? reviewed.filter((v) => v !== reviewIndex) : [...reviewed, reviewIndex])}
      >
        <Check size={15} />
        {tr(reviewed.includes(reviewIndex) ? 'Section reviewed' : 'Mark section reviewed')}
      </button>
    ),
    steps = [
      'Start from a vertex with non-zero degree (odd degree if it exists, otherwise any vertex).',
      'Keep following unused edges, adding vertices to the current trail and marking edges as used.',
      'When you get stuck, backtrack using the stack to find a vertex with unused edges.',
      'The final trail uses every edge exactly once, which is an Eulerian trail (or circuit).',
    ]
  return (
    <div
      className={`mom-page target-visual eulerian-page ${run.trail.length > 8 ? 'eu-long-trail' : ''} ${!run.check.feasible ? 'eu-invalid-run' : ''}`}
      data-target="32"
    >
      <header className="eu-topbar">
        <button className="eu-back" aria-label={tr('Back to articulation points')} onClick={() => navigate('/daa-extensions/articulation-points')}>
          <ArrowLeft size={19} />
        </button>
        <div className="eu-title-row">
          <h1>{tr('Eulerian Trail')}</h1>
          <p>{tr('Hierholzer’s edge-consuming traversal.')}</p>
        </div>
        <button className="mom-study" aria-pressed={studied} onClick={() => props.toggleCompleted(props.module.id)}>
          {studied ? <Check size={16} /> : <Bookmark size={16} />} {tr(studied ? 'Studied' : 'Mark studied')}
        </button>
        <AccountControl showLanguage={false} />
      </header>
      <MockupTabs
        active={tab}
        onChange={(t) => {
          setTab(t)
          setPlaying(false)
        }}
        tabs={tabs}
      />
      {tab === 'Visualization' ? (
        <>
          <div className="eu-top-grid">
            <section className="eu-visualization">
              <header className="eu-visual-heading">
                <span className="eu-main-icon">
                  <svg viewBox="0 0 28 28" aria-hidden="true">
                    <path d="M6 10L14 20L22 8M14 20L22 19" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                    <path d="M2 10L6 6L10 10L6 14ZM10 20L14 16L18 20L14 24ZM18 8L22 4L26 8L22 12ZM19 19L22 16L25 19L22 22Z" fill="currentColor" />
                  </svg>
                </span>
                <div>
                  <h2>{tr('Interactive Visualization')}</h2>
                  <p>{tr('Explore an Eulerian trail using Hierholzer’s algorithm. Click Start and step through the traversal.')}</p>
                </div>
                <select aria-label={tr('Eulerian graph example')} value={example} onChange={(e) => chooseExample(e.target.value)}>
                  <option value="default">{tr('Default graph')}</option>
                  <option value="open">{tr('Open trail: two odd vertices')}</option>
                  <option value="splice">{tr('Two cycles: backtrack and splice')}</option>
                  <option value="odd">{tr('Invalid: four odd vertices')}</option>
                  <option value="disconnected">{tr('Disconnected even cycles')}</option>
                  <option value="parallel">{tr('Parallel edges and self-loops')}</option>
                  <option value="custom">{tr('Custom graph…')}</option>
                </select>
              </header>
              <div className="eu-graph-canvas">
                <EulerDiagram run={run} cursor={cursor} showUsed={used} showDegree={degree} onVertex={inspectVertex} onEdge={inspectEdge} />
                <div className="eu-graph-legend">
                  <span>
                    <i className="eu-active-key" />
                    {tr('Active edge (current step)')}
                  </span>
                  <span>
                    <i className="eu-used-key" />
                    {tr('Used/consumed edge')}
                  </span>
                  <span>
                    <i className="eu-untraversed-key" />
                    {tr('Untraversed edge')}
                  </span>
                  <span>
                    <i className="eu-start-key" />
                    {tr('Start vertex')}
                  </span>
                  <span>
                    <i className="eu-current-key" />
                    {tr('Current vertex')}
                  </span>
                  <span>
                    <i className="eu-regular-key" />
                    {tr('Regular vertex')}
                  </span>
                </div>
              </div>
              <div className="eu-controls">
                <button className="eu-primary eu-start" disabled={!run.check.feasible} onClick={togglePlay}>
                  {playing ? <Pause size={17} /> : <Play size={17} />} {tr(playing ? 'Pause' : 'Start')}
                </button>
                <button className="eu-step" disabled={!run.check.feasible} onClick={step}>
                  <SkipForward size={19} />
                  {tr('Step')}
                </button>
                <button
                  className="eu-reset"
                  onClick={() => {
                    load(eulerExample, 'default')
                    setUsed(true)
                    setDegree(true)
                  }}
                >
                  <RotateCcw size={20} />
                  {tr('Reset')}
                </button>
                <i className="eu-control-divider" />
                <Switch label={tr('Show used edges')} checked={used} onChange={setUsed} />
                <Switch label={tr('Show vertex degree')} checked={degree} onChange={setDegree} />
              </div>
            </section>
            <div className="eu-explanation-column">
              <Panel title={tr('How it works')} icon={<Info />} className="eu-how">
                <ol>
                  {steps.map((s, i) => (
                    <li key={s}>
                      <i>{i + 1}</i>
                      <p>{tr(s)}</p>
                    </li>
                  ))}
                </ol>
              </Panel>
              <Panel title={tr('Key insight')} icon={<Lightbulb />} className="eu-insight">
                <p>
                  {tr(
                    'An undirected graph has an Eulerian trail iff all edge-bearing vertices are connected and it has 0 or 2 vertices of odd degree. If 0, the trail is a circuit (starts and ends at the same vertex).',
                  )}
                </p>
              </Panel>
            </div>
          </div>
          <div className="eu-bottom-grid">
            <Panel title={tr('Current trail')} icon={<Network />} className="eu-trail-panel">
              <div className="eu-trail-strip" aria-label={tr(frame.stack.length ? 'Current traversal stack' : 'Final Eulerian trail')}>
                {trail.length ? (
                  trail.map((v, i) => (
                    <span key={i}>
                      {i > 0 && <ArrowRight size={16} />}
                      <b className={i === trail.length - 1 ? 'eu-current-chip' : ''}>{v}</b>
                    </span>
                  ))
                ) : (
                  <em>{'∅'}</em>
                )}
              </div>
              {frame.kind === 'pop' && <p className="eu-trail-caption">{tr('Backtracking: popped vertices enter the reverse output.')}</p>}
              <div className="eu-history-scroll">
                <table className="eu-history-table">
                  <thead>
                    <tr>
                      {['Step', 'Move', 'Current vertex', 'Stack (top → right)'].map((h) => (
                        <th key={h}>{tr(h)}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {run.frames.slice(0, cursor + 1).map((f, i) => (
                      <tr key={i} className={i === cursor ? 'eu-current-row' : ''}>
                        <td>
                          <button
                            aria-label={tr(`Show Eulerian step ${i}`)}
                            onClick={() => {
                              setCursor(i)
                              setPlaying(false)
                            }}
                          >
                            {i}
                          </button>
                        </td>
                        <td>{tr(f.move)}</td>
                        <td>{f.current}</td>
                        <td>{`[${f.stack.join(', ')}]`}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Panel>
            <Panel title={tr('Degree check')} icon={<BarChart3 />} className="eu-degree-panel">
              <div className="eu-degree-scroll">
                <table className="eu-degree-table">
                  <thead>
                    <tr>
                      {['Vertex', 'Degree', 'Odd?'].map((h) => (
                        <th key={h}>{tr(h)}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {run.check.degree.map((d, v) => (
                      <tr key={v} className={d % 2 ? 'eu-odd-row' : ''}>
                        <td>
                          <button aria-label={tr(`Inspect degree vertex ${v}`)} onClick={() => inspectVertex(v)}>
                            {v}
                          </button>
                        </td>
                        <td>{d}</td>
                        <td>{tr(d % 2 ? 'Yes' : 'No')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className={`eu-degree-status ${run.check.feasible ? 'eu-valid' : 'eu-invalid'}`} role="status">
                <span>{run.check.feasible ? <CheckCircle2 /> : <TriangleAlert />}</span>
                <div>
                  <b>{tr(validStatus)}</b>
                  <p>{tr(`Number of odd-degree vertices: ${run.check.odd.length}`)}</p>
                  <p>{tr(run.check.feasible ? (run.check.circuit ? '(Eulerian circuit exists)' : '(Open Eulerian trail exists)') : run.check.reason)}</p>
                </div>
              </div>
            </Panel>
            <Panel title={tr('Complexity')} icon={<BarChart3 />} className="eu-complexity">
              <div className="eu-complexity-body">
                <p>
                  <b>{tr('Time: O(E + V)')}</b>
                </p>
                <p>
                  <b>{tr('Auxiliary/output space: O(V + E)')}</b>
                </p>
                <p>{tr('Each edge is traversed exactly once. With adjacency lists, the traversal runs in O(V + E) time using a stack.')}</p>
              </div>
              <div className="eu-example-result">
                <span>
                  <CheckCircle2 />
                </span>
                <div>
                  <button aria-label={tr('Inspect worked Eulerian result')} onClick={() => setModal('worked')}>
                    {tr('Example result')}
                  </button>
                  {run.check.feasible ? (
                    <>
                      <p>{tr(run.check.circuit ? 'The graph has an Eulerian circuit:' : 'The graph has an open Eulerian trail:')}</p>
                      <strong>{run.trail.join(' → ')}</strong>
                      <p>{tr(`which uses all ${graph.edges.length} edges exactly once.`)}</p>
                    </>
                  ) : (
                    <p>{tr(run.check.reason)}</p>
                  )}
                </div>
              </div>
            </Panel>
          </div>
        </>
      ) : tab === 'Learn' ? (
        <div className="eu-learning">
          <Panel title={tr('Use Every Edge Exactly Once')} icon={<BookOpen />}>
            <p>
              {tr(
                'An Eulerian trail uses every edge exactly once. It may visit a vertex more than once. A circuit is a closed trail that returns to its starting vertex. This lesson uses undirected graphs, and distinguishes parallel edges by their edge IDs.',
              )}
            </p>
            <div className="eu-concept-grid">
              <article>
                <h3>{tr('Check whether a trail exists')}</h3>
                <p>
                  {tr(
                    'All vertices of positive degree must lie in one connected component. There must be zero or two odd-degree vertices. Isolated vertices do not prevent a trail through every edge; a graph without edges has a zero-length trail.',
                  )}
                </p>
              </article>
              <article>
                <h3>{tr('Choose a legal start')}</h3>
                <p>
                  {tr(
                    'With two odd vertices, start at either odd endpoint. With no odd vertices and at least one edge, any vertex of positive degree is a legal start. A self-loop contributes two to the degree.',
                  )}
                </p>
              </article>
              <article>
                <h3>{tr('Consume, then backtrack')}</h3>
                <p>
                  {tr(
                    'Follow unused incident edges and push the next vertex. When the top has no unused edge, pop it into reverse output. After the stack empties, reverse that output to obtain the trail. A shared edge ID prevents consuming an undirected edge twice.',
                  )}
                </p>
              </article>
            </div>
            <a href="https://algs4.cs.princeton.edu/code/javadoc/edu/princeton/cs/algs4/EulerianPath.html" target="_blank" rel="noreferrer">
              {tr('Princeton Algorithms: Eulerian paths')}
            </a>
            <button className="eu-primary" onClick={() => setTab('Visualization')}>
              {tr('Explore the traversal')}
            </button>
          </Panel>
          <Panel title={tr('Worked Example: Why Backtracking Splices Cycles')} icon={<FileText />}>
            <p>
              {tr(
                'In the two-cycle preset, the first walk is 0 → 1 → 2 → 0. After popping 0 and 2, vertex 1 still has unused edges. Continue 1 → 3 → 4 → 1. Reversing the completed output gives 0 → 1 → 3 → 4 → 1 → 2 → 0. The order of edge consumption is not always the final trail order.',
              )}
            </p>
            <button
              onClick={() => {
                load(spliceGraph, 'splice')
                setTab('Visualization')
              }}
            >
              {tr('Try backtracking and splicing')}
            </button>
          </Panel>
          {review}
        </div>
      ) : tab === 'Code' ? (
        <Panel title={tr('Hierholzer with Adjacency Cursors and Edge IDs')} icon={<Code2 />} className="eu-code">
          <pre>{eulerCode}</pre>
          <p>
            {tr(
              'The solver advances a cursor through each adjacency list, skips already-used IDs, and traverses each edge once. The extra replay history belongs to the visualization, beyond the O(V + E) algorithm workspace and output.',
            )}
          </p>
          <button onClick={() => setTab('Experiments')}>{tr('Inspect reverse output and edge order')}</button>
          {review}
        </Panel>
      ) : tab === 'Practice' ? (
        <div className="eu-practice">
          <Panel title={tr('Predict the Odd-Degree Rule')} icon={<Lightbulb />}>
            <p>
              {tr(
                'All edge-bearing vertices are connected. There are exactly two odd-degree vertices. How many possible starting vertices can produce an Eulerian trail?',
              )}
            </p>
            <input aria-label={tr('Eulerian start prediction')} value={prediction} onChange={(e) => setPrediction(e.target.value)} />
            <button
              className="eu-primary"
              onClick={() =>
                setFeedback(
                  prediction.trim() && Number(prediction) === 2
                    ? 'Correct: start at either odd-degree endpoint.'
                    : 'Try again: only the two odd-degree endpoints can be starts.',
                )
              }
            >
              {tr('Check prediction')}
            </button>
            {feedback && <p role="status">{tr(feedback)}</p>}
          </Panel>
          <Panel title={tr('Does Even Degree Alone Suffice?')} icon={<ShieldCheck />}>
            <button onClick={() => setFeedback('Correct: disconnected edge-bearing components cannot be covered by one trail.')}>
              {tr('Also check connectivity')}
            </button>
            <button onClick={() => setFeedback('Reconsider: two disconnected cycles have even degrees but no single Eulerian trail.')}>
              {tr('Even degrees are enough')}
            </button>
          </Panel>
          <Panel title={tr('Vertices Can Repeat; Edge IDs Cannot')} icon={<Network />}>
            <p>
              {tr(
                'Parallel edges connect the same endpoints but are separate edges. A loop is an edge too and contributes two to degree. Track IDs rather than just endpoint pairs, then verify the final trail uses all IDs exactly once.',
              )}
            </p>
          </Panel>
          {review}
        </div>
      ) : (
        <div className="eu-experiments">
          <Panel title={tr('Eulerian Graph and Stack Laboratory')} icon={<Settings />}>
            <div className="eu-lab-actions">
              <button className="eu-primary" onClick={openEditor}>
                {tr('Edit Eulerian graph JSON')}
              </button>
              <button
                onClick={() => {
                  setCursor(0)
                  setPlaying(false)
                }}
              >
                {tr('Jump to start')}
              </button>
              <button
                onClick={() => {
                  setCursor(run.frames.length - 1)
                  setPlaying(false)
                }}
              >
                {tr('Jump to final trail')}
              </button>
            </div>
            <label>
              {tr('Starting vertex')}
              <select
                aria-label={tr('Eulerian starting vertex')}
                value={graph.start === null ? 'auto' : graph.start}
                onChange={(e) => load({ ...graph, start: e.target.value === 'auto' ? null : Number(e.target.value) }, 'custom')}
              >
                <option value="auto">{tr('Automatic')}</option>
                {Array.from({ length: graph.vertices }, (_, v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </label>
            <label>
              {tr('Playback speed')}
              <select aria-label={tr('Eulerian playback speed')} value={speed} onChange={(e) => setSpeed(Number(e.target.value))}>
                <option value={700}>{tr('Normal')}</option>
                <option value={100}>{tr('Fast')}</option>
                <option value={1400}>{tr('Slow')}</option>
              </select>
            </label>
            <p className="eu-run-summary" role="status">
              {tr(
                `Step ${cursor} / ${run.frames.length - 1}. Used edges: ${frame.used.filter(Boolean).length} / ${graph.edges.length}. Odd vertices: {${run.check.odd.join(', ')}}.`,
              )}
            </p>
            <p>{tr(run.check.reason)}</p>
            <p>{tr(`Stack, top on the right: [${frame.stack.join(', ')}].`)}</p>
            <p>{tr(`Reverse output so far: [${frame.reverse.join(', ')}].`)}</p>
            <p>{tr(`Final trail: ${run.trail.join(' → ') || '(none)'}.`)}</p>
            <p>{tr(`Final edge IDs: ${run.edgeOrder.map((e) => e + 1).join(' → ') || '(none)'}.`)}</p>
            <div className="eu-inspect-buttons">
              {graph.edges.map(([u, v], e) => (
                <button key={e} onClick={() => inspectEdge(e)}>
                  {tr(`Inspect edge ${e + 1}: ${u} — ${v}`)}
                </button>
              ))}
            </div>
            <button onClick={() => setTab('Visualization')}>{tr('Return to graph visualization')}</button>
          </Panel>
          <Panel title={tr('Your Eulerian-Trail Notes')} icon={<BookOpen />} className="eu-notes">
            <LanguageSelector />
            <label>
              {tr('Explain legal starting vertices, edge IDs, the stack and reversed output.')}
              <textarea aria-label={tr('Eulerian trail notes')} value={notes} onChange={(e) => setNotes(e.target.value)} />
            </label>
            <p>{tr('Your notes and reviewed sections are saved in this browser.')}</p>
            <button
              aria-label={tr('Toggle color theme')}
              onClick={() => (props.onToggleTheme ? props.onToggleTheme() : setLocalTheme(theme === 'dark' ? 'light' : 'dark'))}
            >
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />} {tr('Toggle color theme')}
            </button>
          </Panel>
          {review}
        </div>
      )}
      <dialog
        ref={dialog}
        className="eu-dialog"
        aria-label={tr(
          modal === 'edit'
            ? 'Edit Eulerian graph'
            : modal === 'edge'
              ? 'Inspect Eulerian edge'
              : modal === 'vertex'
                ? 'Inspect Eulerian vertex'
                : 'Worked Eulerian result',
        )}
        onCancel={() => setModal(null)}
      >
        <button className="eu-close" aria-label={tr('Close Eulerian dialog')} onClick={() => setModal(null)}>
          <X size={18} />
        </button>
        {modal === 'edit' ? (
          <>
            <h2>{tr('Edit Undirected Graph')}</h2>
            <p>
              {tr(
                'Use 1–8 vertices numbered 0 to V−1 and at most 20 edge pairs. Set start to null for automatic selection, or choose a vertex number. Parallel edges and loops are supported.',
              )}
            </p>
            <textarea ref={editor} aria-label={tr('Eulerian graph JSON')} value={draft} onChange={(e) => setDraft(e.target.value)} />
            {error && <p role="alert">{tr(error)}</p>}
            <button
              className="eu-primary"
              onClick={() => {
                try {
                  load(parseEulerGraph(draft), 'custom')
                  setModal(null)
                } catch (e) {
                  setError((e as Error).message)
                }
              }}
            >
              {tr('Apply Eulerian graph')}
            </button>
          </>
        ) : modal === 'vertex' ? (
          <>
            <h2>{tr(`Vertex ${selectedVertex}`)}</h2>
            <p>{tr(`Degree: ${run.check.degree[selectedVertex]}. ${run.check.degree[selectedVertex] % 2 ? 'Odd' : 'Even'} degree.`)}</p>
            <p>{tr('A self-loop contributes two to the degree; parallel edge IDs are counted separately.')}</p>
            <button
              className="eu-primary"
              onClick={() => {
                load({ ...graph, start: selectedVertex }, 'custom')
                setModal(null)
              }}
            >
              {tr('Use as starting vertex')}
            </button>
          </>
        ) : modal === 'edge' ? (
          <>
            <h2>{tr(`Edge ${selectedEdge + 1}: ${graph.edges[selectedEdge]?.join(' — ')}`)}</h2>
            <p>
              {tr(
                `Consumed at current step: ${frame.used[selectedEdge] ? 'yes' : 'no'}. ${selectedMove >= 0 ? `Consumption event: ${selectedMove}.` : 'Not consumed in this run.'}`,
              )}
            </p>
            <p>{tr(`Position in the final Eulerian trail: ${run.edgeOrder.includes(selectedEdge) ? run.edgeOrder.indexOf(selectedEdge) + 1 : 'none'}.`)}</p>
            <p>{tr('The edge keeps its own ID, even if another edge has the same endpoints.')}</p>
            <button onClick={openEditor}>{tr('Edit graph edges')}</button>
          </>
        ) : (
          <>
            <h2>{tr('Worked Eulerian Result')}</h2>
            <p>{tr(run.check.reason)}</p>
            <p>{tr(`Final trail: ${run.trail.join(' → ') || '(none)'}.`)}</p>
            <p>{tr(`Edge IDs in trail order: ${run.edgeOrder.map((e) => e + 1).join(' → ') || '(none)'}.`)}</p>
            <p>
              {tr(
                'The final vertex sequence is assembled by reversing the popped vertices. This may differ from the order in which the algorithm first consumed the edges.',
              )}
            </p>
            <button
              className="eu-primary"
              disabled={!run.check.feasible}
              onClick={() => {
                setModal(null)
                setTab('Visualization')
                setCursor(0)
                setPlaying(true)
              }}
            >
              {tr('Replay the traversal')}
            </button>
          </>
        )}
      </dialog>
    </div>
  )
}
