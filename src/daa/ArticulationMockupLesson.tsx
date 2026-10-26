// @localized-render
import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
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
  X,
} from 'lucide-react'
import { tx, useLocaleRender } from '../i18n/render'
import { AccountControl } from '../account/AccountControl'
import { LanguageSelector } from '../i18n/LanguageSelector'
import { persistentString, usePersistentState } from '../hooks/usePersistentState'
import { MockupTabs, type MockupPageProps, type MockupTab } from './MockupLessonChrome'
import {
  articulationComponents,
  articulationExample,
  articulationNumber,
  parseArticulationGraph,
  runArticulation,
  type ArticulationGraph,
} from './articulationModel'
import type { BridgeFrame } from './bridgeLessonModel'
import './articulation-mockup.css'
const tr = (s: string) => tx(s, 'studios'),
  tabs: MockupTab[] = ['Learn', 'Visualization', 'Code', 'Practice', 'Experiments'],
  componentColors = ['#cae9ff', '#c9f5db', '#e6d8ff', '#ffe9c5', '#ffdae7', '#d2f3f4', '#e0e8ff']
function Panel({ title, icon, children, className = '' }: { title: string; icon: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`ap-panel ${className}`}>
      <header>
        <span className="ap-icon">{icon}</span>
        <h2>{title}</h2>
      </header>
      {children}
    </section>
  )
}
function Switch({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="ap-switch">
      <input type="checkbox" aria-label={label} checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <i />
      {label}
    </label>
  )
}
function ArticulationDiagram({
  graph,
  state,
  values,
  highlight,
  currentEdge,
  removed,
  selected,
  onVertex,
  onEdge,
}: {
  graph: ArticulationGraph
  state: BridgeFrame
  values: boolean
  highlight: boolean
  currentEdge: number | undefined
  removed: number | null
  selected: number
  onVertex: (v: number) => void
  onEdge: (e: number) => void
}) {
  const id = useId().replace(/:/g, ''),
    point = (v: number) =>
      graph.vertices === 7
        ? [
            [185, 88],
            [77, 189],
            [231, 271],
            [384, 192],
            [551, 122],
            [677, 198],
            [584, 293],
          ][v]
        : [420 + 265 * Math.cos(-Math.PI / 2 + (v * 2 * Math.PI) / graph.vertices), 180 + 125 * Math.sin(-Math.PI / 2 + (v * 2 * Math.PI) / graph.vertices)],
    components = removed === null ? [] : articulationComponents(graph, removed)
  return (
    <div className="ap-diagram-scroll" role="region" tabIndex={0} aria-label={tr('Scrollable articulation graph')}>
      <svg className="ap-diagram" viewBox="0 0 848 356" preserveAspectRatio="none" aria-label={tr('DFS graph and articulation-point highlights')}>
        <defs>
          <linearGradient id={`${id}-node`} x2="0" y2="1">
            <stop stopColor="#eafaff" />
            <stop offset="1" stopColor="#a6d8ff" />
          </linearGradient>
          <linearGradient id={`${id}-cut`} x2="0" y2="1">
            <stop stopColor="#ffe1e8" />
            <stop offset="1" stopColor="#ff849f" />
          </linearGradient>
          {[
            ['tree', '#0875ff'],
            ['current', '#ff9e00'],
          ].map(([name, color]) => (
            <marker key={name} id={`${id}-${name}`} markerUnits="userSpaceOnUse" markerWidth="12" markerHeight="12" refX="11" refY="6" orient="auto">
              <path d="M0 0L12 6L0 12Z" fill={color} />
            </marker>
          ))}
        </defs>
        {graph.edges.map(([a, b], edge) => {
          if (a === removed || b === removed) return null
          const tree = state.tree.includes(edge),
            back = state.back.includes(edge),
            from = tree && state.parent[a + 1] === b + 1 ? b : a,
            to = from === a ? b : a,
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
                : `M${x1 + ((cx - x1) * 25) / r1} ${y1 + ((cy - y1) * 25) / r1}Q${cx} ${cy} ${x2 - ((x2 - cx) * 27) / r2} ${y2 - ((y2 - cy) * 27) / r2}`,
            active = edge === currentEdge
          return (
            <g
              key={edge}
              className={`ap-edge ${tree ? 'ap-tree-edge' : back ? 'ap-back-edge' : 'ap-unvisited-edge'} ${active ? 'ap-current-edge' : ''}`}
              data-ap-edge={edge}
              role="button"
              tabIndex={0}
              aria-label={tr(`Inspect DFS edge ${edge + 1}: ${a} to ${b}`)}
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
              <path d={path} stroke="transparent" strokeWidth="14" fill="none" />
              <path d={path} fill="none" markerEnd={tree || active ? `url(#${id}-${active ? 'current' : 'tree'})` : undefined} />
            </g>
          )
        })}
        {Array.from({ length: graph.vertices }, (_, v) => v).map((v) => {
          const [x, y] = point(v),
            cut = highlight && state.articulation.includes(v + 1),
            chip =
              graph.vertices === 7
                ? [
                    [154, 14],
                    [32, 217],
                    [197, 299],
                    [345, 115],
                    [521, 47],
                    [707, 178],
                    [618, 273],
                  ][v]
                : [x - 30, y < 80 ? y + 30 : y - 74],
            color = components.findIndex((c) => c.includes(v))
          return (
            <g
              key={v}
              className={`ap-vertex ${cut ? 'ap-cut-vertex' : ''} ${v === removed ? 'ap-removed-vertex' : ''}`}
              role="button"
              tabIndex={0}
              aria-label={tr(`Inspect articulation vertex ${v}`)}
              onClick={() => onVertex(v)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  onVertex(v)
                }
              }}
            >
              <rect x={x - 27} y={y - 27} width="54" height="54" fill="transparent" />
              <circle
                cx={x}
                cy={y}
                r={cut ? 27 : 24}
                fill={removed !== null ? componentColors[Math.max(0, color) % componentColors.length] : `url(#${id}-${cut ? 'cut' : 'node'})`}
              />
              <text className="ap-vertex-label" x={x} y={y + 7} textAnchor="middle">
                {v}
              </text>
              {values && v !== removed && (
                <g className="ap-value-chip" transform={`translate(${chip[0]},${chip[1]})`}>
                  <rect width="60" height="46" rx="8" />
                  <text x="30" y="19" textAnchor="middle">{`d: ${articulationNumber(state.tin[v + 1])}`}</text>
                  <text x="30" y="36" textAnchor="middle">{`low: ${articulationNumber(state.low[v + 1])}`}</text>
                </g>
              )}
              {cut && removed === null && selected === v && (
                <g className="ap-cut-label" transform={`translate(${x - 41},${y > 250 ? y - 80 : y + 36})`}>
                  <rect width="93" height="43" rx="10" />
                  <text x="46.5" y="18" textAnchor="middle">
                    {tr('Articulation')}
                  </text>
                  <text x="46.5" y="34" textAnchor="middle">
                    {tr('Point')}
                  </text>
                </g>
              )}
            </g>
          )
        })}
      </svg>
    </div>
  )
}
const articulationCode = `DFS(v, parentEdgeId):
  d[v] = low[v] = nextDiscoveryTime++
  children = 0
  for (u, edgeId) in adjacency[v]:
    if edgeId == parentEdgeId: continue
    if d[u] is undiscovered:
      children++
      parent[u] = v
      DFS(u, edgeId)
      low[v] = min(low[v], low[u])
      if v is not a DFS root and low[u] >= d[v]: mark v
    else: low[v] = min(low[v], d[u])
  if v is a DFS root and children >= 2: mark v
repeat DFS from each undiscovered vertex`
function eventLabel(frame: BridgeFrame) {
  const v = frame.vertex - 1,
    u = (frame.from ?? 1) - 1
  return frame.kind === 'discover'
    ? frame.parent[frame.vertex] < 0
      ? `Start DFS at root ${v}.`
      : `Discover vertex ${v} from ${u}.`
    : frame.kind === 'back'
      ? `Back edge ${v} → ${u}: low[${v}] = ${articulationNumber(frame.low[frame.vertex])}.`
      : frame.kind === 'return'
        ? `Return from ${u} to ${v}; propagate low[${u}].`
        : 'DFS complete. All components have been explored.'
}
export function ArticulationMockupLesson(props: MockupPageProps) {
  useLocaleRender()
  const navigate = useNavigate(),
    [tab, setTab] = useState<MockupTab>('Visualization'),
    [graph, setGraph] = useState<ArticulationGraph>(() => structuredClone(articulationExample))
  const run = useMemo(() => runArticulation(graph), [graph])
  const [cursor, setCursor] = useState(() => runArticulation(articulationExample).frames.length - 1),
    [playing, setPlaying] = useState(false),
    [speed, setSpeed] = useState(700),
    [values, setValues] = useState(true),
    [highlight, setHighlight] = useState(true),
    [selected, setSelected] = useState(3),
    [example, setExample] = useState('default'),
    [removed, setRemoved] = useState<number | null>(null),
    [modal, setModal] = useState<'edit' | 'vertex' | 'edge' | 'worked' | null>(null),
    dialog = useRef<HTMLDialogElement>(null),
    editor = useRef<HTMLTextAreaElement>(null),
    [draft, setDraft] = useState(''),
    [error, setError] = useState(''),
    [edge, setEdge] = useState(0),
    [prediction, setPrediction] = useState(''),
    [feedback, setFeedback] = useState(''),
    [localTheme, setLocalTheme] = useState(() => localStorage.getItem('algodrishti-theme') ?? 'light')
  const [notes, setNotes] = usePersistentState('algodrishti-articulation-notes', '', persistentString),
    [reviewed, setReviewed] = usePersistentState<number[]>('algodrishti-articulation-reviewed', [], {
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
    afterRemoval = articulationComponents(graph, selected),
    isCut = afterRemoval.length > run.components.length,
    selectedChildren = run.final.children[selected + 1].map((v) => v - 1),
    currentEdge = frame.kind === 'complete' ? undefined : frame.edge
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
  function load(next: ArticulationGraph, id: string) {
    const result = runArticulation(next)
    setGraph(structuredClone(next))
    setCursor(result.frames.length - 1)
    setSelected(result.cuts[0] ?? next.root)
    setPlaying(false)
    setRemoved(null)
    setExample(id)
    setError('')
    setFeedback('')
  }
  function chooseExample(id: string) {
    if (id === 'custom') {
      setExample('custom')
      openEditor()
    } else if (id === 'tree') load({ vertices: 7, root: 0, edges: Array.from({ length: 6 }, (_, v) => [0, v + 1] as [number, number]) }, id)
    else if (id === 'cycle') load({ vertices: 7, root: 0, edges: Array.from({ length: 7 }, (_, v) => [v, (v + 1) % 7] as [number, number]) }, id)
    else if (id === 'disconnected')
      load(
        {
          vertices: 7,
          root: 0,
          edges: [
            [0, 1],
            [1, 2],
            [2, 0],
            [3, 4],
            [4, 5],
          ],
        },
        id,
      )
    else if (id === 'parallel')
      load(
        {
          vertices: 3,
          root: 0,
          edges: [
            [0, 1],
            [1, 0],
            [1, 2],
            [2, 2],
          ],
        },
        id,
      )
    else load(articulationExample, 'default')
  }
  function openEditor() {
    setDraft(JSON.stringify(graph, null, 2))
    setError('')
    setModal('edit')
    setPlaying(false)
  }
  function startDfs() {
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
    setSelected(v)
    setModal('vertex')
    setPlaying(false)
  }
  function inspectEdge(e: number) {
    setEdge(e)
    setModal('edge')
    setPlaying(false)
  }
  const reviewIndex = tabs.indexOf(tab),
    review = (
      <button
        className="ap-review"
        aria-pressed={reviewed.includes(reviewIndex)}
        onClick={() => setReviewed(reviewed.includes(reviewIndex) ? reviewed.filter((v) => v !== reviewIndex) : [...reviewed, reviewIndex])}
      >
        <Check size={15} />
        {tr(reviewed.includes(reviewIndex) ? 'Section reviewed' : 'Mark section reviewed')}
      </button>
    )
  const steps = [
    'Run DFS from each unvisited vertex, keeping discovery time d[v] and low-link value low[v].',
    'For a tree edge (v, u), update low[v] = min(low[v], low[u]).',
    'If low[u] ≥ d[v] and v is not the root, then v is an articulation point.',
    'For the root, it is an articulation point if it has two or more DFS children.',
  ]
  return (
    <div className="mom-page target-visual articulation-page" data-target="31">
      <header className="ap-topbar">
        <button className="ap-back" aria-label={tr('Back to graph bridges')} onClick={() => navigate('/daa-extensions/bridges')}>
          <ArrowLeft size={19} />
        </button>
        <div className="ap-title-row">
          <h1>{tr('Articulation Points')}</h1>
          <p>{tr('Track DFS discovery times and lowlink values.')}</p>
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
          <div className="ap-top-grid">
            <section className="ap-visualization">
              <header className="ap-visual-heading">
                <span className="ap-main-icon">
                  <Network />
                </span>
                <div>
                  <h2>{tr('Interactive Visualization')}</h2>
                  <p>{tr('Explore how DFS discovers articulation points using discovery times and low-link values.')}</p>
                </div>
                <select aria-label={tr('Articulation graph example')} value={example} onChange={(e) => chooseExample(e.target.value)}>
                  <option value="default">{tr('Default graph')}</option>
                  <option value="tree">{tr('Tree: root with many children')}</option>
                  <option value="cycle">{tr('Cycle: no cut vertices')}</option>
                  <option value="disconnected">{tr('Disconnected graph')}</option>
                  <option value="parallel">{tr('Parallel edges and a loop')}</option>
                  <option value="custom">{tr('Custom graph…')}</option>
                </select>
              </header>
              <div className="ap-graph-canvas">
                <ArticulationDiagram
                  graph={graph}
                  state={frame}
                  values={values}
                  highlight={highlight}
                  currentEdge={currentEdge}
                  removed={removed}
                  selected={selected}
                  onVertex={inspectVertex}
                  onEdge={inspectEdge}
                />
                <div className="ap-graph-legend">
                  {removed === null ? (
                    <>
                      <span>
                        <i className="ap-tree-key" />
                        {tr('Tree edge (DFS tree)')}
                      </span>
                      <span>
                        <i className="ap-back-key" />
                        {tr('Back edge')}
                      </span>
                      <span>
                        <i className="ap-current-key" />
                        {tr('Current edge')}
                      </span>
                      <span>
                        <i className="ap-cut-key" />
                        {tr('Articulation point')}
                      </span>
                      <span>
                        <i className="ap-regular-key" />
                        {tr('Regular vertex')}
                      </span>
                    </>
                  ) : (
                    <>
                      <b>{tr(`Vertex ${removed} removed`)}</b>
                      {articulationComponents(graph, removed).map((c, i) => (
                        <span key={i}>
                          <i style={{ background: componentColors[i % componentColors.length] }} />
                          {`{${c.join(', ')}}`}
                        </span>
                      ))}
                      <button onClick={() => setRemoved(null)}>{tr('Restore graph')}</button>
                    </>
                  )}
                </div>
                {removed !== null && (
                  <div className="ap-removal-banner" role="status">
                    {tr(`${articulationComponents(graph, removed).length} components after removal. Discovery/low values refer to the original graph.`)}
                  </div>
                )}
              </div>
              <div className="ap-controls">
                <button className="ap-primary ap-start" disabled={removed !== null} onClick={startDfs}>
                  {playing ? <Pause size={16} /> : <Play size={16} />} {tr(playing ? 'Pause DFS' : 'Start DFS')}
                </button>
                <button className="ap-step" disabled={removed !== null} onClick={step}>
                  <SkipForward size={18} />
                  {tr('Step')}
                </button>
                <button
                  className="ap-reset"
                  onClick={() => {
                    load(articulationExample, 'default')
                    setValues(true)
                    setHighlight(true)
                  }}
                >
                  <RotateCcw size={19} />
                  {tr('Reset')}
                </button>
                <i className="ap-control-divider" />
                <Switch label={tr('Show discovery/low values')} checked={values} onChange={setValues} />
                <Switch label={tr('Highlight articulation points')} checked={highlight} onChange={setHighlight} />
              </div>
            </section>
            <div className="ap-explanation-column">
              <Panel title={tr('How it works')} icon={<Info />} className="ap-how">
                <ol>
                  {steps.map((s, i) => (
                    <li key={s}>
                      <i>{i + 1}</i>
                      <p>{tr(s)}</p>
                    </li>
                  ))}
                </ol>
              </Panel>
              <Panel title={tr('Key insight')} icon={<Lightbulb />} className="ap-insight">
                <p>
                  {tr(
                    'A non-root vertex v is an articulation point if a child u has low[u] ≥ d[v]. This means u and its subtree have no back edge to any earlier ancestor of v.',
                  )}
                </p>
              </Panel>
            </div>
          </div>
          <div className="ap-bottom-grid">
            <Panel title={tr('Traversal state')} icon={<Network />} className="ap-traversal">
              <div className="ap-table-scroll">
                <table className="ap-state-table">
                  <caption className="ap-sr-only">{tr('Discovery times and low-link values at the selected DFS event')}</caption>
                  <thead>
                    <tr>
                      {['Vertex', 'Discovery time d[v]', 'Low-link value low[v]', 'Parent', 'Articulation point'].map((h) => (
                        <th key={h}>{tr(h)}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from({ length: graph.vertices }, (_, v) => v).map((v) => (
                      <tr key={v} className={frame.articulation.includes(v + 1) ? 'ap-cut-row' : ''}>
                        <td>
                          <button aria-label={tr(`Inspect traversal vertex ${v}`)} onClick={() => inspectVertex(v)}>
                            {v}
                          </button>
                        </td>
                        <td>{articulationNumber(frame.tin[v + 1])}</td>
                        <td>{articulationNumber(frame.low[v + 1])}</td>
                        <td>{frame.parent[v + 1] < 0 ? '–' : frame.parent[v + 1] - 1}</td>
                        <td>{tr(frame.articulation.includes(v + 1) ? 'Yes' : 'No')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Panel>
            <Panel title={tr('Complexity')} icon={<BarChart3 />} className="ap-complexity">
              <div className="ap-complexity-body">
                <p>
                  <b>{tr('Time: O(V + E)')}</b>
                </p>
                <p>
                  <b>{tr('Auxiliary/output space: O(V + E)')}</b>
                </p>
                <p>{tr('Adjacency lists process each undirected edge in both directions. Edge IDs distinguish parallel parent edges correctly.')}</p>
              </div>
              <div className="ap-example-result">
                <span>
                  <CheckCircle2 />
                </span>
                <div>
                  <button aria-label={tr('Inspect selected vertex removal')} onClick={() => inspectVertex(selected)}>
                    {tr('Example result')}
                  </button>
                  <p>
                    {tr(
                      isCut
                        ? `Vertex ${selected} is an articulation point. Removing it gives ${afterRemoval.map((c) => `{${c.join(',')}}`).join(' and ')}.`
                        : `Vertex ${selected} is not an articulation point. Removing it does not increase the component count.`,
                    )}
                  </p>
                </div>
              </div>
            </Panel>
          </div>
        </>
      ) : tab === 'Learn' ? (
        <div className="ap-learning">
          <Panel title={tr('Find the Vertices That Hold a Network Together')} icon={<BookOpen />}>
            <p>
              {tr(
                'An articulation point is a vertex whose deletion, together with all its incident edges, increases the number of connected components. This definition works for disconnected graphs too: compare the new count with the original count.',
              )}
            </p>
            <div className="ap-concept-grid">
              <article>
                <h3>{tr('Discovery and low-link values')}</h3>
                <p>
                  {tr(
                    'd[v] records when DFS discovers v. low[v] is the earliest discovery time reachable from its subtree using tree edges followed by at most one back edge. Propagate child low values when returning from DFS.',
                  )}
                </p>
              </article>
              <article>
                <h3>{tr('The non-root rule')}</h3>
                <p>
                  {tr(
                    'If child u has low[u] ≥ d[v], its subtree cannot reach an earlier ancestor of v. Deleting v separates that subtree. Equality still identifies a cut vertex: a return to v itself does not help after v is removed.',
                  )}
                </p>
              </article>
              <article>
                <h3>{tr('The root rule')}</h3>
                <p>
                  {tr(
                    'The root has no earlier ancestor. It is a cut vertex only when it has at least two DFS children. Count children in the DFS tree, rather than counting neighbors in the original graph.',
                  )}
                </p>
              </article>
            </div>
            <a href="https://algs4.cs.princeton.edu/41graph/index.php" target="_blank" rel="noreferrer">
              {tr('Princeton Algorithms: bridges and articulation points')}
            </a>
            <button className="ap-primary" onClick={() => setTab('Visualization')}>
              {tr('Explore the DFS visualization')}
            </button>
          </Panel>
          <Panel title={tr('Worked Example: Remove Vertex 3')} icon={<FileText />}>
            <p>
              {tr(
                'The default graph has cycles on either side of vertex 3. Removing 3 leaves {0,1,2} and {4,5,6}. Its child 4 can return to vertex 3, giving low[4] = d[3] = 4, but cannot bypass 3 to reach an earlier ancestor. This demonstrates why the articulation test uses ≥.',
              )}
            </p>
            <p>
              {tr(
                'No edge is a bridge in this example. Cut vertices and bridge edges describe different vulnerabilities. Parallel edges must be distinguished by edge ID, and self-loops never create cut vertices.',
              )}
            </p>
            <button
              onClick={() => {
                load(articulationExample, 'default')
                setModal('worked')
              }}
            >
              {tr('Try the worked removal')}
            </button>
          </Panel>
          {review}
        </div>
      ) : tab === 'Code' ? (
        <Panel title={tr('DFS with Root and Non-Root Cut Conditions')} icon={<Code2 />} className="ap-code">
          <pre>{articulationCode}</pre>
          <p>
            {tr(
              'The algorithm uses O(V + E) time and auxiliary space with adjacency lists. It visits every disconnected component. The lesson additionally stores replay snapshots, which are separate from the DFS workspace.',
            )}
          </p>
          <button onClick={() => setTab('Experiments')}>{tr('Edit the graph and DFS root')}</button>
          {review}
        </Panel>
      ) : tab === 'Practice' ? (
        <div className="ap-practice">
          <Panel title={tr('Predict the Equality Case')} icon={<Lightbulb />}>
            <p>{tr('Vertex v is not a DFS root. Its child u has low[u] = d[v]. Is v an articulation point? Enter yes or no.')}</p>
            <input aria-label={tr('Articulation prediction')} value={prediction} onChange={(e) => setPrediction(e.target.value)} />
            <button
              className="ap-primary"
              onClick={() =>
                setFeedback(
                  prediction.trim().toLowerCase() === 'yes'
                    ? 'Correct: equality still makes the non-root parent a cut vertex. A return to v itself disappears when v is removed.'
                    : 'Try again: the cut-vertex condition uses ≥; the bridge condition uses >.',
                )
              }
            >
              {tr('Check prediction')}
            </button>
            {feedback && <p role="status">{tr(feedback)}</p>}
          </Panel>
          <Panel title={tr('Does Root Degree Determine Articulation?')} icon={<ShieldCheck />}>
            <button onClick={() => setFeedback('Correct: use the number of DFS children, not the number of original neighbors.')}>
              {tr('Count DFS children')}
            </button>
            <button onClick={() => setFeedback('Reconsider: many neighbors may belong to one DFS subtree. Original degree is not the root criterion.')}>
              {tr('Count original neighbors')}
            </button>
          </Panel>
          <Panel title={tr('Cut Vertex Without a Bridge')} icon={<Network />}>
            <p>
              {tr(
                'Two cycles can share a single vertex while every edge still lies on a cycle. Deleting the shared vertex separates the graph even though no single edge is a bridge. Explore the default graph to test this distinction.',
              )}
            </p>
            <button
              onClick={() => {
                load(articulationExample, 'default')
                setTab('Visualization')
              }}
            >
              {tr('Load the example')}
            </button>
          </Panel>
          {review}
        </div>
      ) : (
        <div className="ap-experiments">
          <Panel title={tr('Graph and Vertex-Removal Laboratory')} icon={<Settings />}>
            <div className="ap-lab-actions">
              <button className="ap-primary" onClick={openEditor}>
                {tr('Edit articulation graph JSON')}
              </button>
              <button
                onClick={() => {
                  setCursor(0)
                  setPlaying(false)
                  setRemoved(null)
                }}
              >
                {tr('Restart at first event')}
              </button>
              <button
                onClick={() => {
                  setCursor(run.frames.length - 1)
                  setPlaying(false)
                  setRemoved(null)
                }}
              >
                {tr('Jump to completed DFS')}
              </button>
              <button onClick={() => inspectVertex(selected)}>{tr('Test selected vertex removal')}</button>
            </div>
            <label>
              {tr('DFS root')}
              <select aria-label={tr('Articulation DFS root')} value={graph.root} onChange={(e) => load({ ...graph, root: Number(e.target.value) }, 'custom')}>
                {Array.from({ length: graph.vertices }, (_, v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </label>
            <label>
              {tr('Playback speed')}
              <select aria-label={tr('Articulation playback speed')} value={speed} onChange={(e) => setSpeed(Number(e.target.value))}>
                <option value={700}>{tr('Normal')}</option>
                <option value={100}>{tr('Fast')}</option>
                <option value={1400}>{tr('Slow')}</option>
              </select>
            </label>
            <p className="ap-run-summary" role="status">
              {tr(`Articulation points: {${run.cuts.join(', ')}}. Original components: ${run.components.length}. Step ${cursor + 1} / ${run.frames.length}.`)}
            </p>
            <p>{tr(eventLabel(frame))}</p>
            <p>{tr(`DFS stack: ${frame.stack.map((v) => v - 1).join(' → ') || '(empty)'}.`)}</p>
            <div className="ap-removal-buttons">
              {Array.from({ length: graph.vertices }, (_, v) => (
                <button key={v} onClick={() => inspectVertex(v)}>
                  {tr(`Test removal of vertex ${v}`)}
                </button>
              ))}
            </div>
            <div className="ap-removal-buttons">
              {graph.edges.map(([u, v], id) => (
                <button key={id} onClick={() => inspectEdge(id)}>
                  {tr(`Inspect edge ${id + 1}: ${u} — ${v}`)}
                </button>
              ))}
            </div>
            <button onClick={() => setTab('Visualization')}>{tr('Return to the graph')}</button>
          </Panel>
          <Panel title={tr('Your Articulation-Point Notes')} icon={<BookOpen />} className="ap-notes">
            <LanguageSelector />
            <label>
              {tr('Explain the ≥ test, the special root rule and the difference between cut vertices and bridges.')}
              <textarea aria-label={tr('Articulation-point notes')} value={notes} onChange={(e) => setNotes(e.target.value)} />
            </label>
            <p>{tr('Notes and reviewed sections are saved in this browser.')}</p>
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
        className="ap-dialog"
        aria-label={tr(
          modal === 'edit'
            ? 'Edit articulation graph'
            : modal === 'edge'
              ? 'Inspect articulation DFS edge'
              : modal === 'worked'
                ? 'Worked articulation example'
                : 'Inspect vertex removal',
        )}
        onCancel={() => setModal(null)}
      >
        <button className="ap-close" aria-label={tr('Close articulation dialog')} onClick={() => setModal(null)}>
          <X size={18} />
        </button>
        {modal === 'edit' ? (
          <>
            <h2>{tr('Edit Undirected Graph')}</h2>
            <p>
              {tr('Use 1–8 vertices numbered 0 to V−1, root in that range, and at most 20 undirected edge pairs. Parallel edges and self-loops are supported.')}
            </p>
            <textarea ref={editor} aria-label={tr('Articulation graph JSON')} value={draft} onChange={(e) => setDraft(e.target.value)} />
            {error && <p role="alert">{tr(error)}</p>}
            <button
              className="ap-primary"
              onClick={() => {
                try {
                  load(parseArticulationGraph(draft), 'custom')
                  setModal(null)
                } catch (e) {
                  setError((e as Error).message)
                }
              }}
            >
              {tr('Apply articulation graph')}
            </button>
          </>
        ) : modal === 'edge' ? (
          <>
            <h2>{tr(`Edge ${edge + 1}: ${graph.edges[edge]?.join(' — ')}`)}</h2>
            <p>{tr(`Final classification: ${run.final.tree.includes(edge) ? 'DFS tree edge' : 'back edge or self-loop'}.`)}</p>
            <p>
              {tr(
                'An edge can lie on a cycle while one of its endpoints is still an articulation point. The vertex-removal experiment tests the actual number of connected components.',
              )}
            </p>
            <button onClick={openEditor}>{tr('Edit graph connections')}</button>
          </>
        ) : modal === 'worked' ? (
          <>
            <h2>{tr('Worked Example: A Cut Vertex Without a Bridge')}</h2>
            <p>
              {tr(
                'With the default graph, removing vertex 3 leaves {0,1,2} and {4,5,6}. The child rooted at 4 reaches 3 but no earlier ancestor, so low[4] = 4 ≥ d[3] = 4. Root 0 has only one DFS child and is not a cut vertex.',
              )}
            </p>
            <button
              className="ap-primary"
              onClick={() => {
                setSelected(3)
                setRemoved(3)
                setModal(null)
                setTab('Visualization')
              }}
            >
              {tr('Preview vertex 3 removal')}
            </button>
          </>
        ) : (
          <>
            <h2>{tr(`Vertex ${selected}`)}</h2>
            <p>
              {tr(
                `Discovery d[${selected}] = ${articulationNumber(run.final.tin[selected + 1])}; low[${selected}] = ${articulationNumber(run.final.low[selected + 1])}; parent = ${run.final.parent[selected + 1] < 0 ? 'none' : run.final.parent[selected + 1] - 1}; DFS children = {${selectedChildren.join(', ')}}.`,
              )}
            </p>
            <p className="ap-removal-summary" role="status">
              {tr(
                `Components before removal: ${run.components.length}. Components after removal: ${afterRemoval.length}. Vertex ${selected} ${isCut ? 'is an articulation point' : 'is not an articulation point'}.`,
              )}
            </p>
            <p>{tr(`Remaining components: ${afterRemoval.map((c) => `{${c.join(',')}}`).join(' | ') || '(empty graph)'}.`)}</p>
            <p>
              {tr(
                run.final.parent[selected + 1] < 0
                  ? 'For a DFS root, check whether it has at least two DFS children.'
                  : 'For a non-root, check whether some DFS child u has low[u] ≥ d[v].',
              )}
            </p>
            <button
              className="ap-primary"
              onClick={() => {
                setRemoved(selected)
                setModal(null)
                setTab('Visualization')
                setPlaying(false)
              }}
            >
              {tr('Preview removal in graph')}
            </button>
          </>
        )}
      </dialog>
    </div>
  )
}
