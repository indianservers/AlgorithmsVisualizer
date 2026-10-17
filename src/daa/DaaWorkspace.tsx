import { CompactLessonHeader } from '../components/CompactLessonHeader'
import { TimelineToolbar } from '../components/TimelineToolbar'
import { ViewportCanvas } from '../components/ViewportCanvas'
import {
  BookOpen,
  Network,
  Code2,
  FlaskConical,
  PencilLine,
  Trash2,
  BarChart3,
  Settings,
  Lightbulb,
  Download,
  FileSpreadsheet,
  Save,
  Info,
  Eye,
  GraduationCap,
} from 'lucide-react'
import { lazy, Suspense, useEffect, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import type { AlgorithmModule, LearningTab } from '../types'
import { LessonTabs } from '../components/LessonTabs'
import { AccountControl } from '../account/AccountControl'
import { sortingCharacters } from '../data/sortingCharacters'
import { usePersistentState, persistentString, persistentBoolean } from '../hooks/usePersistentState'
import { allModules } from '../algorithms'
import { algorithmPath } from '../utils/routing'
import { downloadText } from '../exports'
import { daaLessons, lessonById } from './catalog'
import { coverageFor, conceptTopics } from './syllabi'
import { executeLesson, type DaaInput, type DaaRun, type LearningState, type Lesson } from './types'
import graphsSource from './graphs.ts?raw'
import dynamicSource from './dynamic.ts?raw'
import designSource from './design.ts?raw'
import searchSource from './search.ts?raw'
import stringsSource from './strings.ts?raw'
import extensionSource from './extensions.ts?raw'
import './daa.css'
import './dijkstra.css'
import './dfs.css'
import './bfs.css'

type Props = { module: AlgorithmModule; completed: string[]; toggleCompleted: (id: string) => void }
type Experiment = { id: string; lessonId: string; input: DaaInput; run: DaaRun; createdAt: string }
const PenguinVisualization = lazy(() => import('../components/PenguinVisualization').then((module) => ({ default: module.PenguinVisualization })))
const ExplorerTraversal = lazy(() => import('../components/ExplorerTraversal').then((module) => ({ default: module.ExplorerTraversal })))
const WeightedExplorer = lazy(() => import('../components/WeightedExplorer').then((module) => ({ default: module.WeightedExplorer })))
const cell = (value: unknown) => (value === null ? '—' : String(value))

function ProblemEditor({
  input,
  onChange,
  graphStyle = false,
  traversalStyle = false,
  bfsStyle = false,
}: {
  input: string
  onChange: (value: string) => void
  graphStyle?: boolean
  traversalStyle?: boolean
  bfsStyle?: boolean
}) {
  let parsed: Record<string, unknown>
  try {
    parsed = JSON.parse(input)
  } catch {
    return <p>Correct the JSON input below to restore the field editor.</p>
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null
  function update(key: string, value: unknown) {
    onChange(JSON.stringify({ ...parsed, [key]: value }, null, 2))
  }
  return (
    <div className="daa-field-editor">
      {Object.entries(parsed).map(([key, value]) => {
        if (key === 'edges' && Array.isArray(value))
          return (
            <fieldset key={key}>
              <legend>Graph edges</legend>
              <p>
                {bfsStyle
                  ? 'Each row connects two vertices. Weights are ignored by BFS and DFS.'
                  : traversalStyle
                    ? 'Each row connects two vertices. Weights are ignored by DFS and used as labels.'
                    : graphStyle
                      ? 'Each row connects two vertices with a non-negative weight.'
                      : 'Each row connects two vertices. Weights are ignored by BFS and DFS.'}
              </p>
              <div className={`edge-table-heading ${bfsStyle ? 'with-edge-number' : ''}`} aria-hidden="true">
                {bfsStyle && <span>#</span>}
                <span>From</span>
                <span>To</span>
                <span>Weight</span>
                <span />
              </div>
              <div className="daa-edge-list">
                {value.map((edge, index) => (
                  <div className="daa-edge-row" key={index}>
                    {bfsStyle && (
                      <label className="bfs-edge-number">
                        #<output>{index + 1}</output>
                      </label>
                    )}
                    {['from', 'to', 'weight'].map((field) => (
                      <label key={field}>
                        <span className="sr-only">{field}</span>
                        <input
                          type="number"
                          aria-label={`Edge ${index + 1} ${field}`}
                          value={edge[field]}
                          onChange={(event) =>
                            update(
                              key,
                              value.map((item, i) => (i === index ? { ...item, [field]: Number(event.target.value) } : item)),
                            )
                          }
                        />
                      </label>
                    ))}
                    <button
                      type="button"
                      aria-label={`Remove edge ${index + 1}`}
                      onClick={() =>
                        update(
                          key,
                          value.filter((_, i) => i !== index),
                        )
                      }
                    >
                      {graphStyle || traversalStyle ? <Trash2 size={14} aria-hidden="true" /> : '×'}
                    </button>
                  </div>
                ))}
              </div>
              {traversalStyle ? (
                <div className="daa-edge-actions">
                  <button aria-label="Add edge" type="button" onClick={() => update(key, [...value, { from: 0, to: 1, weight: 1 }])}>
                    {traversalStyle && <span aria-hidden="true">＋</span>}Add edge
                  </button>
                  {traversalStyle && !bfsStyle && (
                    <button className="dfs-clear-edges" type="button" onClick={() => update(key, [])}>
                      <Trash2 size={14} />
                      Clear all
                    </button>
                  )}
                </div>
              ) : (
                <button type="button" onClick={() => update(key, [...value, { from: 0, to: 1, weight: 1 }])}>
                  Add edge
                </button>
              )}
            </fieldset>
          )
        if (typeof value === 'boolean' && graphStyle)
          return (
            <div className="dijkstra-direction" key={key}>
              <span>Graph type</span>
              <div role="group" aria-label="Graph type">
                {[true, false].map((directed) => (
                  <button key={String(directed)} type="button" aria-pressed={value === directed} onClick={() => update(key, directed)}>
                    {directed ? 'Directed' : 'Undirected'}
                  </button>
                ))}
              </div>
            </div>
          )
        if (typeof value === 'boolean')
          return (
            <label key={key}>
              {traversalStyle && !bfsStyle ? 'Graph type' : key}
              <select aria-label={key} value={String(value)} onChange={(event) => update(key, event.target.value === 'true')}>
                <option value="true">Directed</option>
                <option value="false">Undirected</option>
              </select>
              {bfsStyle && <small>true for directed, false for undirected.</small>}
            </label>
          )
        if (typeof value === 'number' || typeof value === 'string')
          return (
            <label key={key}>
              {bfsStyle ? key : graphStyle || traversalStyle ? (key === 'vertices' ? 'Number of vertices' : key === 'source' ? 'Source vertex' : key) : key}
              <input
                aria-label={key}
                type={typeof value === 'number' ? 'number' : 'text'}
                value={String(value)}
                onChange={(event) => update(key, typeof value === 'number' ? Number(event.target.value) : event.target.value)}
              />
              {bfsStyle && (
                <small>{key === 'vertices' ? 'Number of vertices (1–8).' : key === 'source' ? 'Start vertex; flow sink is the last vertex.' : ''}</small>
              )}
            </label>
          )
        return (
          <div key={key}>
            <strong>{key}</strong>
            <ArrayField name={key} value={value} onApply={(next) => update(key, next)} />
          </div>
        )
      })}
    </div>
  )
}

function ArrayField({ name, value, onApply }: { name: string; value: unknown; onApply: (value: unknown) => void }) {
  const matrix = Array.isArray(value) && Array.isArray(value[0])
  const [text, setText] = useState(() =>
      Array.isArray(value) ? (matrix ? value.map((row) => row.join(', ')).join('\n') : value.join(', ')) : JSON.stringify(value),
    ),
    [message, setMessage] = useState('')
  return (
    <div>
      <label>
        {matrix ? 'One row per line, numbers separated by commas' : 'Numbers separated by commas'}
        <textarea aria-label={`${name} values`} rows={matrix ? 4 : 2} value={text} onChange={(event) => setText(event.target.value)} />
      </label>
      <button
        type="button"
        onClick={() => {
          try {
            const parseRow = (row: string) =>
              row.trim()
                ? row.split(/[,\s]+/).map((part) => {
                    const number = Number(part)
                    if (!Number.isFinite(number)) throw new Error()
                    return number
                  })
                : []
            const next: unknown = text.trim().startsWith('[') ? JSON.parse(text) : matrix ? text.trim().split(/\n/).map(parseRow) : parseRow(text)
            if (!Array.isArray(next)) throw new Error()
            onApply(next)
            setMessage('Applied. Run algorithm to compute the updated data.')
          } catch {
            setMessage('Enter valid numbers separated by commas. For matrices, put each row on a new line.')
          }
        }}
      >
        Apply {name}
      </button>
      <small role="status">{message}</small>
    </div>
  )
}

function StateView({
  state,
  spacious = false,
  traversalLayout = false,
  breadthLayout = false,
}: {
  state?: LearningState
  spacious?: boolean
  traversalLayout?: boolean
  breadthLayout?: boolean
}) {
  if (!state) return <p>Run an example to see its computed states.</p>
  const g = state.graph
  const position = (v: number) => {
    const angle = (2 * Math.PI * v) / (g?.vertices ?? 1) - Math.PI / 2
    return traversalLayout
      ? { x: 300 + 220 * Math.cos(angle), y: 170 + 130 * Math.sin(angle) }
      : { x: 260 + 170 * Math.cos(angle), y: 200 + 145 * Math.sin(angle) }
  }
  return (
    <div className="daa-state">
      {state.matrices && (
        <div className="daa-matrices">
          {state.matrices.map((matrix) => (
            <div className="daa-table-scroll" key={matrix.label}>
              <table className="daa-table">
                <caption>{matrix.label}</caption>
                <tbody>
                  {matrix.values.map((row, i) => (
                    <tr key={i}>
                      {row.map((value, j) => (
                        <td key={j}>{cell(value)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}
      {state.values?.length && state.values.every((value) => typeof value === 'number' && Number.isFinite(value)) ? (
        <div className="daa-value-chart" aria-label="Array value visualization">
          {state.values.map((value, i) => (
            <div key={i} className={state.activeIndices?.includes(i) ? 'active' : ''}>
              <strong>{cell(value)}</strong>
              <span style={{ height: `${20 + (Math.abs(Number(value)) / Math.max(1, ...state.values!.map((v) => Math.abs(Number(v))))) * 100}px` }} />
              <small>{state.labels?.[i] ?? `index ${i}`}</small>
            </div>
          ))}
        </div>
      ) : null}
      {g && (
        <svg
          className="daa-graph"
          viewBox={traversalLayout ? '0 0 600 360' : spacious ? '40 12 440 380' : '0 0 520 400'}
          role="img"
          aria-label="Weighted graph state"
        >
          <defs>
            <radialGradient id="bfs-node-fill" cx=".3" cy=".2" r=".9">
              <stop stopColor="#fff" />
              <stop offset="1" stopColor="#a6d5ff" />
            </radialGradient>
            <marker id="daa-active-arrow" markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto">
              <path d="M0,0 L0,6 L8,3 z" fill="#fa6c24" />
            </marker>
            <marker id="daa-arrow" markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto">
              <path d="M0,0 L0,6 L8,3 z" fill="currentColor" />
            </marker>
          </defs>
          {g.edges.map((e, index) => {
            const a = position(e.from),
              b = position(e.to),
              dx = b.x - a.x,
              dy = b.y - a.y,
              len = Math.hypot(dx, dy) || 1
            const active = g.selected?.some(([u, v]) => (u === e.from && v === e.to) || (!g.directed && u === e.to && v === e.from))
            return (
              <g key={index} className={active ? 'selected' : ''}>
                {e.from === e.to ? (
                  <path
                    d={`M${a.x - 10},${a.y - 17} C${a.x - 70},${a.y - 80} ${a.x + 70},${a.y - 80} ${a.x + 10},${a.y - 17}`}
                    fill="none"
                    stroke="currentColor"
                  />
                ) : (
                  <line
                    x1={a.x + (dx / len) * 23}
                    y1={a.y + (dy / len) * 23}
                    x2={b.x - (dx / len) * 26}
                    y2={b.y - (dy / len) * 26}
                    stroke="currentColor"
                    strokeWidth={active ? 4 : 2}
                    markerEnd={g.directed ? ((spacious || breadthLayout) && active ? 'url(#daa-active-arrow)' : 'url(#daa-arrow)') : undefined}
                  />
                )}
                <text x={(a.x + b.x) / 2 + (dy / len) * 10} y={(a.y + b.y) / 2 - (dx / len) * 10} textAnchor="middle">
                  {e.weight}
                </text>
              </g>
            )
          })}
          {Array.from({ length: g.vertices }, (_, v) => {
            const p = position(v)
            return (
              <g
                key={v}
                className={
                  breadthLayout && state.traversal?.distance
                    ? state.traversal.distance[v] < 0
                      ? 'bfs-unreachable-vertex'
                      : 'bfs-discovered-vertex'
                    : state.weightedExplorer?.current === v
                      ? 'current-vertex'
                      : state.weightedExplorer?.visited.includes(v) || state.traversal?.visited.includes(v)
                        ? 'visited-vertex'
                        : undefined
                }
              >
                <circle cx={p.x} cy={p.y} r={spacious || traversalLayout ? 26 : 22} />
                <text x={p.x} y={p.y + 5} textAnchor="middle">
                  {v}
                </text>
                <text className="vertex-label" x={p.x} y={p.y + 42} textAnchor="middle">
                  {g.labels?.[v]}
                </text>
              </g>
            )
          })}
        </svg>
      )}
      {state.table && (
        <div className="daa-table-scroll">
          <table className="daa-table">
            <caption>Computed table state</caption>
            {state.columnLabels && (
              <thead>
                <tr>
                  <th scope="col">State</th>
                  {state.columnLabels.map((v, i) => (
                    <th key={i} scope="col">
                      {v}
                    </th>
                  ))}
                </tr>
              </thead>
            )}
            <tbody>
              {state.table.map((r, i) => (
                <tr key={i}>
                  <th scope="row">{state.rowLabels?.[i] ?? i}</th>
                  {r.map((v, j) => (
                    <td key={j}>{cell(v)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {state.values && (
        <div className="daa-cells">
          {state.values.map((v, i) => (
            <div key={i}>
              <small>{state.labels?.[i] ?? i}</small>
              <strong>{cell(v)}</strong>
            </div>
          ))}
        </div>
      )}
      {state.search && (
        <div className="daa-search">
          <p>
            Search tree: {state.searchTotal ?? state.search.length} discovered nodes. Showing the latest 80; each recorded frame retains a window of 128 nodes
            with parent IDs in JSON exports.
          </p>
          <ol>
            {state.search.slice(-80).map((n) => (
              <li key={n.id} className={n.pruned ? 'pruned' : ''}>
                <strong>#{n.id}</strong> {n.parent !== undefined && <span>← parent #{n.parent} </span>}
                {n.label}
                {n.bound !== undefined && <span> · bound {Number(n.bound.toFixed(3))}</span>}
                {n.pruned && <em> · pruned</em>}
              </li>
            ))}
          </ol>
        </div>
      )}
      {state.note && <p>{state.note}</p>}
    </div>
  )
}

function Dashboard({ completed }: { completed: string[] }) {
  const [filter, setFilter] = useState('all'),
    [query, setQuery] = useState('')
  const counts = { complete: 0, partial: 0, missing: 0 }
  conceptTopics.forEach((topic) => counts[coverageFor(topic, allModules)]++)
  const rows = conceptTopics.filter((t) => (filter === 'all' || coverageFor(t, allModules) === filter) && t.topic.toLowerCase().includes(query.toLowerCase()))
  const core = daaLessons.filter((l) => !l.extension),
    extensions = daaLessons.filter((l) => l.extension)
  return (
    <>
      <header className="daa-header">
        <span className="daa-eyebrow">DESIGN & ANALYSIS OF ALGORITHMS</span>
        <h1>DAA Concept Library</h1>
        <p>Learn the foundations of algorithm design and analysis, then explore advanced concepts at your own pace.</p>
      </header>
      <section className="daa-card">
        <h2>Explore concepts</h2>
        <p>Browse algorithm design, analysis and correctness lessons. Lesson coverage and your study progress are tracked separately.</p>
        <div className="daa-stats">
          <span>{counts.complete} complete</span>
          <span>{counts.partial} partial</span>
          <span>{counts.missing} missing</span>
          <strong>Concept-based learning library</strong>
        </div>
        <div className="daa-filters">
          <label>
            Coverage
            <select aria-label="Coverage" value={filter} onChange={(e) => setFilter(e.target.value)}>
              {['all', 'complete', 'partial', 'missing'].map((v) => (
                <option key={v}>{v}</option>
              ))}
            </select>
          </label>
          <label>
            Find topic
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search concepts" />
          </label>
        </div>
        <div className="daa-table-scroll">
          <table className="daa-coverage">
            <thead>
              <tr>
                <th>Topic</th>
                <th>Coverage</th>
                <th>Pages and limitations</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((t) => (
                <tr key={t.topic}>
                  <th scope="row">{t.topic}</th>
                  <td>
                    <span className={`daa-badge ${coverageFor(t, allModules)}`}>{coverageFor(t, allModules)}</span>
                  </td>
                  <td>
                    {t.pages.map((id) => {
                      const m = allModules.find((m) => m.id === id)
                      return m ? (
                        <Link key={id} to={algorithmPath(m)}>
                          {m.name}
                        </Link>
                      ) : (
                        <span key={id}>Missing page: {id}</span>
                      )
                    })}
                    {t.limitation && <p>{t.limitation}</p>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      {[
        ['Core learning path', core],
        ['Advanced concepts and extensions', extensions],
      ].map(([title, items]) => (
        <section className="daa-card" key={String(title)}>
          <h2>{String(title)}</h2>
          <p>
            Your progress: {(items as Lesson[]).filter((l) => completed.includes(l.id)).length} / {(items as Lesson[]).length} lessons marked studied.
          </p>
          <div className="daa-lesson-grid">
            {(items as Lesson[]).map((l) => (
              <Link key={l.id} to={algorithmPath(allModules.find((m) => m.id === l.id)!)}>
                <span>{l.category}</span>
                <strong>{l.title}</strong>
                <small>{completed.includes(l.id) ? 'Studied' : l.theory ? 'Theory lesson' : 'Interactive algorithm'}</small>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </>
  )
}

function TraceDisclosure({ compact, children, expanded }: { compact: boolean; children: ReactNode; expanded?: boolean }) {
  return compact ? (
    <details className="dfs-trace-details" open={expanded}>
      <summary>Algorithm steps & computed result</summary>
      {children}
    </details>
  ) : (
    <>{children}</>
  )
}

function TraceExports({ onExport, onSave, icons = false }: { onExport: (format: 'json' | 'csv') => void; onSave: () => void; icons?: boolean }) {
  return (
    <div className="daa-actions daa-trace-exports">
      <button type="button" onClick={() => onExport('json')}>
        {icons && <Download size={16} />}Export JSON trace
      </button>
      <button type="button" onClick={() => onExport('csv')}>
        {icons && <FileSpreadsheet size={16} />}Export CSV states
      </button>
      <button type="button" onClick={onSave}>
        {icons && <Save size={16} />}Save experiment locally
      </button>
    </div>
  )
}

function LessonView({ lesson, completed, toggleCompleted }: { lesson: Lesson; completed: string[]; toggleCompleted: (id: string) => void }) {
  const [traversalView, setTraversalView] = usePersistentState('algodrishti-traversal-view', 'graph', persistentString)
  const isBfs = lesson.id === 'daa-bfs'
  const isTraversalStudio = lesson.id === 'daa-dfs' || isBfs
  const isExplorerTraversal = lesson.id === 'daa-bfs' || lesson.id === 'daa-dfs'
  const weightedExplorerMode =
    lesson.id === 'dijkstra' ||
    lesson.id === 'prim' ||
    lesson.id === 'kruskal' ||
    lesson.id === 'bellman-ford' ||
    lesson.id === 'floyd-warshall' ||
    lesson.id === 'kahn-topological-sort' ||
    lesson.id === 'kosaraju-scc'
      ? lesson.id
      : undefined
  const [weightedView, setWeightedView] = usePersistentState('algodrishti-weighted-graph-view', 'graph', persistentString)
  const [character, setCharacter] = usePersistentState('algodrishti-sorting-character', 'penguins', persistentString)
  const [sortingView, setSortingView] = usePersistentState('algodrishti-bubble-view', 'bars', persistentString)
  const [sortingReducedMotion] = usePersistentState('algodrishti-reduced-motion', false, persistentBoolean)
  const [draft, setDraft] = useState(JSON.stringify(lesson.defaultInput, null, 2) ?? ''),
    [run, setRun] = useState<DaaRun | undefined>(() =>
      lesson.run && lesson.defaultInput ? executeLesson(lesson, structuredClone(lesson.defaultInput)) : undefined,
    ),
    [usedInput, setUsedInput] = useState<DaaInput | undefined>(() => (lesson.defaultInput ? structuredClone(lesson.defaultInput) : undefined)),
    [error, setError] = useState(''),
    [index, setIndex] = useState(0),
    [playing, setPlaying] = useState(false),
    [speed, setSpeed] = useState(600),
    [selectedTab, setTab] = useState<LearningTab>(lesson.id === 'dijkstra' || isTraversalStudio ? 'Visualization' : 'Learn'),
    [editorVersion, setEditorVersion] = useState(0),
    [answer, setAnswer] = useState(false)
  const [experiments, setExperimentState] = useState<Experiment[]>(() => {
    try {
      const value = JSON.parse(localStorage.getItem('algodrishti-daa-experiments') ?? '[]')
      return Array.isArray(value) ? value.filter((e) => e && typeof e.id === 'string' && e.run?.steps?.length && e.input && e.lessonId) : []
    } catch {
      return []
    }
  })
  const [saveMessage, setSaveMessage] = useState('')
  const tab = ['Learn', 'Visualization', 'Code', 'Practice', 'Experiments'].includes(selectedTab) ? selectedTab : 'Learn'
  function setExperiments(update: (items: Experiment[]) => Experiment[]) {
    try {
      const next = update(experiments),
        encoded = JSON.stringify(next)
      if (encoded.length > 1_000_000) throw new Error('Saved traces exceed the local storage budget. Export this trace as JSON or delete older experiments.')
      localStorage.setItem('algodrishti-daa-experiments', encoded)
      setExperimentState(next)
      setSaveMessage('Local experiments updated.')
    } catch (e) {
      setSaveMessage(e instanceof Error ? e.message : 'Local storage is unavailable; export the trace instead.')
    }
  }
  const step = run?.steps[index],
    last = (run?.steps.length ?? 1) - 1
  useEffect(() => {
    if (!playing || !run || index >= last) return
    const timer = window.setTimeout(() => setIndex((i) => i + 1), speed)
    return () => window.clearTimeout(timer)
  }, [playing, run, index, last, speed])
  function start() {
    try {
      const input: DaaInput = JSON.parse(draft)
      const result = executeLesson(lesson, input)
      setRun(result)
      setUsedInput(input)
      setIndex(0)
      setPlaying(false)
      setError('')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not run this input.')
      setPlaying(false)
      setRun(undefined)
      setUsedInput(undefined)
      setIndex(0)
    }
  }
  function exportRun(format: 'json' | 'csv') {
    if (!run) return
    if (format === 'json')
      downloadText(`${lesson.id}-trace.json`, JSON.stringify({ version: 1, lessonId: lesson.id, input: usedInput, ...run }, null, 2), 'application/json')
    else {
      const quote = (v: unknown) => '"' + String(v).replaceAll('"', '""') + '"'
      downloadText(
        `${lesson.id}-trace.csv`,
        [
          'step,type,description,pseudocodeLine,state',
          ...run.steps.map((s, i) => [i + 1, s.type, quote(s.description), s.pseudocodeLine, quote(JSON.stringify(s.state ?? {}))].join(',')),
        ].join('\n'),
        'text/csv',
      )
    }
  }
  function saveExperiment() {
    if (usedInput && run)
      setExperiments((items) =>
        [{ id: crypto.randomUUID(), lessonId: lesson.id, input: usedInput, run, createdAt: new Date().toISOString() }, ...items].slice(0, 10),
      )
  }
  const graphIds = [
    'edmonds-karp',
    'bipartite-matching',
    'bridges',
    'articulation-points',
    'eulerian-trail',
    'vertex-cover-approximation',
    'metric-tsp-approximation',
    'multistage-shortest-path',
  ]
  const source =
    lesson.category === 'Graphs' || graphIds.includes(lesson.id)
      ? graphsSource
      : lesson.category === 'Dynamic Programming'
        ? dynamicSource
        : lesson.category === 'Backtracking' || lesson.category === 'Branch and Bound'
          ? searchSource
          : lesson.category === 'Strings' || ['boyer-moore', 'suffix-array'].includes(lesson.id)
            ? stringsSource
            : ['fft', 'reliability-design'].includes(lesson.id)
              ? extensionSource
              : designSource
  return (
    <div className="lesson-surface" data-learning-tab={tab}>
      <CompactLessonHeader
        title={lesson.title}
        description={lesson.summary}
        studied={completed.includes(lesson.id)}
        onStudy={() => toggleCompleted(lesson.id)}
        account={<AccountControl />}
      />
      <LessonTabs
        icons={
          lesson.id === 'dijkstra' || isTraversalStudio
            ? {
                Learn: <BookOpen size={16} />,
                Visualization: isBfs ? <Eye size={16} /> : <Network size={16} />,
                Code: <Code2 size={16} />,
                Practice: isBfs ? <GraduationCap size={16} /> : <PencilLine size={16} />,
                Experiments: <FlaskConical size={16} />,
              }
            : undefined
        }
        active={tab}
        onChange={setTab}
        tabs={lesson.run ? ['Learn', 'Visualization', 'Code', 'Practice', 'Experiments'] : ['Learn', 'Practice']}
      />
      {tab === 'Learn' && (
        <section className="daa-card">
          <h2>Concept and worked example</h2>
          {lesson.theory?.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
          <blockquote>{lesson.example}</blockquote>
          {!lesson.theory && (
            <>
              <h2>Correctness</h2>
              <p>{lesson.correctness}</p>
              <h2>Complexity derivation</h2>
              <p>
                <strong>
                  Time: {lesson.time} · Auxiliary/output space: {lesson.space}
                </strong>
              </p>
              <p>{lesson.derivation}</p>
            </>
          )}
          <h2>Assumptions and constraints</h2>
          <p>{lesson.constraints}</p>
          {lesson.run && (
            <button type="button" onClick={() => setTab('Visualization')}>
              Try the worked example
            </button>
          )}
        </section>
      )}
      {tab === 'Visualization' && (
        <div className="daa-interactive-layout">
          <section className="daa-card daa-input-card">
            <div>
              <h2>{isTraversalStudio && <Settings size={22} />}Editable problem input</h2>
              <p>
                {isBfs
                  ? 'Zero-based vertices and item indices; edit the fields below, then run. Validation errors appear below.'
                  : isTraversalStudio
                    ? 'Create your own graph, edit parameters, and run DFS.'
                    : lesson.id === 'dijkstra'
                      ? 'Create your own graph, edit parameters, and run Dijkstra’s algorithm.'
                      : 'Zero-based vertices and item indices; k is a one-based selection rank. Edit the named JSON fields, then run. Validation errors appear below.'}
              </p>
              {isBfs && (
                <select
                  className="bfs-examples"
                  aria-label="Load example"
                  value=""
                  onChange={(event) => {
                    const example =
                      event.target.value === 'default'
                        ? lesson.defaultInput
                        : event.target.value === 'branching'
                          ? {
                              vertices: 5,
                              directed: false,
                              source: 0,
                              edges: [
                                { from: 0, to: 1, weight: 1 },
                                { from: 0, to: 2, weight: 1 },
                                { from: 1, to: 3, weight: 1 },
                                { from: 1, to: 4, weight: 1 },
                              ],
                            }
                          : {
                              vertices: 5,
                              directed: true,
                              source: 0,
                              edges: [
                                { from: 0, to: 1, weight: 2 },
                                { from: 1, to: 2, weight: 1 },
                                { from: 3, to: 4, weight: 1 },
                              ],
                            }
                    setDraft(JSON.stringify(example, null, 2))
                    setEditorVersion((version) => version + 1)
                    setError('')
                  }}
                >
                  <option value="" disabled>
                    Load example
                  </option>
                  <option value="default">Default graph</option>
                  <option value="branching">Undirected branching graph</option>
                  <option value="disconnected">Disconnected graph</option>
                </select>
              )}
              <ProblemEditor
                bfsStyle={isBfs}
                traversalStyle={isTraversalStudio}
                graphStyle={lesson.id === 'dijkstra'}
                key={lesson.id + editorVersion + JSON.stringify(usedInput)}
                input={draft}
                onChange={setDraft}
              />
              <details>
                <summary>Advanced: edit full JSON input</summary>
                <label htmlFor="daa-input">Problem input (JSON)</label>
                <textarea id="daa-input" value={draft} spellCheck={false} onChange={(e) => setDraft(e.target.value)} rows={12} />
              </details>
              <div className="daa-actions">
                <button aria-label="Run algorithm" type="button" onClick={start}>
                  Run algorithm
                </button>
                <button
                  aria-label="Reset input"
                  type="button"
                  onClick={() => {
                    setDraft(JSON.stringify(lesson.defaultInput, null, 2))
                    setEditorVersion((version) => version + 1)
                    setError('')
                  }}
                >
                  Reset input
                </button>
              </div>
              {error && (
                <p role="alert" className="daa-error">
                  {error}
                </p>
              )}
            </div>
            <details className="input-reference">
              <summary>Input fields & constraints</summary>
              <dl>
                {Object.entries(lesson.defaultInput ?? {}).map(([key, value]) => (
                  <div key={key}>
                    <dt>{key}</dt>
                    <dd>
                      {key === 'edges'
                        ? isBfs
                          ? 'Array of {from, to, weight}.'
                          : isTraversalStudio
                            ? 'List of directed edges (from, to, weight); weights are labels ignored by DFS.'
                            : 'Array of {from, to, weight}; flow uses weights as capacities.'
                        : key === 'vertices'
                          ? 'Number of vertices (1–8).'
                          : key === 'source'
                            ? 'Start vertex; flow sink is the last vertex.'
                            : key === 'directed'
                              ? 'true for directed, false for undirected.'
                              : Array.isArray(value)
                                ? 'Array matching the shape of the worked example.'
                                : typeof value === 'string'
                                  ? 'Editable text; decimal strings for integer multiplication.'
                                  : 'Integer within the lesson constraints.'}
                    </dd>
                  </div>
                ))}
              </dl>
              <p>{lesson.constraints}</p>
            </details>
          </section>
          {run && (
            <section className="daa-card daa-timeline-card">
              <h2>
                {isBfs ? <Network size={25} /> : isTraversalStudio && <BarChart3 size={24} />}{' '}
                {lesson.id === 'dijkstra' || isTraversalStudio ? 'Graph Visualization' : 'Computed timeline'}
              </h2>
              {isTraversalStudio && (
                <div className="dfs-legend">
                  <span>
                    {isBfs
                      ? 'Step through the BFS traversal and see the frontier evolve.'
                      : 'Step through DFS execution and see how the stack and visited set evolve.'}
                  </span>
                  <div>
                    {isBfs ? (
                      <>
                        <i />
                        Unvisited
                        <i />
                        Visited
                        <i />
                        Frontier
                        <i />
                        Unreachable
                      </>
                    ) : (
                      <>
                        <i />
                        Unvisited
                        <i />
                        Current node
                        <i />
                        Visited
                        <i />
                        Pending
                      </>
                    )}
                  </div>
                </div>
              )}
              {lesson.id === 'dijkstra' && (
                <div className="dijkstra-legend">
                  <span>Step through Dijkstra’s algorithm and see how shortest paths are discovered.</span>
                  <div>
                    <i /> Unvisited <i /> Current node <i /> Relaxed edge <i /> Visited
                  </div>
                </div>
              )}
              {draft !== JSON.stringify(usedInput, null, 2) && (
                <p role="status">Input has changed. Run algorithm to update this timeline; the displayed steps still use the previous input.</p>
              )}
              <TimelineToolbar
                index={index}
                count={run.steps.length}
                playing={playing && index < last}
                speed={speed}
                onNavigate={(next) => {
                  setPlaying(false)
                  setIndex(next)
                }}
                onPlay={() => setPlaying((value) => !value)}
                onSpeed={setSpeed}
                view={
                  (weightedExplorerMode || isExplorerTraversal) && (
                    <div className="bubble-view-switch" role="group" aria-label="View as">
                      <button
                        type="button"
                        aria-pressed={(weightedExplorerMode ? weightedView : traversalView) !== 'icons'}
                        onClick={() => (weightedExplorerMode ? setWeightedView('graph') : setTraversalView('graph'))}
                      >
                        Graph
                      </button>
                      <button
                        type="button"
                        aria-pressed={(weightedExplorerMode ? weightedView : traversalView) === 'icons'}
                        onClick={() => (weightedExplorerMode ? setWeightedView('icons') : setTraversalView('icons'))}
                      >
                        Icons
                      </button>
                    </div>
                  )
                }
              />
              <p aria-live="polite" className="daa-step-description">
                {isBfs ? <Info size={18} /> : isTraversalStudio && <Lightbulb size={20} />} {step?.description}
              </p>
              {run.message && (
                <p role="status" className="daa-error">
                  {run.message}
                </p>
              )}
              {lesson.id === 'randomized-quicksort' && (
                <label>
                  Sorting character
                  <select
                    aria-label="Sorting character"
                    value={sortingView === 'bars' ? 'bars' : character}
                    onChange={(event) => {
                      if (event.target.value === 'bars') setSortingView('bars')
                      else {
                        setCharacter(event.target.value)
                        setSortingView('icons')
                      }
                    }}
                  >
                    <option value="bars">Bars</option>
                    {sortingCharacters.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.icon} {option.name}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              <ViewportCanvas>
                {weightedExplorerMode && weightedView === 'icons' ? (
                  <Suspense fallback={<p>Loading expedition…</p>}>
                    <WeightedExplorer step={step} mode={weightedExplorerMode} reducedMotion={sortingReducedMotion} />
                  </Suspense>
                ) : isExplorerTraversal && traversalView === 'icons' ? (
                  <Suspense fallback={<p>Loading expedition…</p>}>
                    <ExplorerTraversal
                      step={step}
                      previous={run.steps[index - 1]}
                      mode={lesson.id === 'daa-bfs' ? 'bfs' : 'dfs'}
                      reducedMotion={sortingReducedMotion}
                    />
                  </Suspense>
                ) : lesson.id === 'randomized-quicksort' && sortingView === 'icons' ? (
                  <Suspense fallback={<p>Loading characters…</p>}>
                    <PenguinVisualization
                      items={(step?.state?.values ?? []).map((value, i) => ({
                        id: `${value}-${(step?.state?.values ?? []).slice(0, i).filter((v) => v === value).length}`,
                        index: i,
                        value: Number(value),
                      }))}
                      step={step ? { ...step, highlights: { indices: step.state?.activeIndices } } : undefined}
                      reducedMotion={sortingReducedMotion}
                      quality="detailed"
                      showIndices
                      showValues
                      sortedCount={0}
                      palette={{}}
                      showStateComparison={false}
                      character={character}
                    />
                  </Suspense>
                ) : (
                  <StateView state={step?.state} spacious={lesson.id === 'dijkstra'} traversalLayout={isTraversalStudio} breadthLayout={isBfs} />
                )}
              </ViewportCanvas>
              {isTraversalStudio && <TraceExports icons onExport={exportRun} onSave={saveExperiment} />}
              <TraceDisclosure compact expanded={index === last}>
                {lesson.id === 'dijkstra' && <h3 className="dijkstra-steps-title">Algorithm Steps</h3>}
                <ol className="daa-pseudocode">
                  {lesson.pseudocode.map((line, i) => (
                    <li key={i} className={step?.type !== 'complete' && step?.pseudocodeLine === i ? 'active' : ''}>
                      {line}
                    </li>
                  ))}
                </ol>
                <div className="daa-run-result">
                  <details open={index === last}>
                    <summary>Computed result · {run.status === 'complete' ? 'complete trace' : 'truncated trace'}</summary>
                    <pre className="daa-result">{JSON.stringify(run.result, null, 2)}</pre>
                  </details>
                  <p>
                    Operation counter: {step?.metrics.writes ?? 0} emitted learning events. This is not a comparison count or a complexity proof. Snapshot
                    storage is excluded from the algorithm’s stated space bound.
                  </p>
                  {!isTraversalStudio && <TraceExports onExport={exportRun} onSave={saveExperiment} />}
                </div>
              </TraceDisclosure>
            </section>
          )}
          {experiments.some((e) => e.lessonId === lesson.id) && (
            <section className="daa-card">
              <h2>Saved experiments</h2>
              {experiments
                .filter((e) => e.lessonId === lesson.id)
                .map((e) => (
                  <div key={e.id} className="daa-actions">
                    <span>{new Date(e.createdAt).toLocaleString()}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setDraft(JSON.stringify(e.input, null, 2))
                        setUsedInput(e.input)
                        setRun(e.run)
                        setIndex(0)
                        setPlaying(false)
                        setError('')
                      }}
                    >
                      Load saved trace
                    </button>
                    <button type="button" onClick={() => setExperiments((items) => items.filter((item) => item.id !== e.id))}>
                      Delete
                    </button>
                  </div>
                ))}
            </section>
          )}
        </div>
      )}
      {tab === 'Code' && (
        <section className="daa-card">
          <h2>Pseudocode</h2>
          <ol>
            {lesson.pseudocode.map((p, i) => (
              <li key={i}>{p}</li>
            ))}
          </ol>
          <h2>Executable implementation and helpers</h2>
          <p>
            The source below is the actual TypeScript runner module, including shared helpers. Function names and source remain readable after production
            minification.
          </p>
          <pre className="daa-source">
            <code>{source}</code>
          </pre>
        </section>
      )}
      {tab === 'Experiments' && (
        <section className="daa-card">
          <h2>Experiments</h2>
          <p>
            Save or export a computed run from Visualization. Change one input property at a time, compare the result and explain the complexity assumptions.
          </p>
          <h3>Saved traces for this lesson</h3>
          {experiments
            .filter((e) => e.lessonId === lesson.id)
            .map((e) => (
              <div className="daa-actions" key={e.id}>
                <span>{new Date(e.createdAt).toLocaleString()}</span>
                <button
                  type="button"
                  onClick={() => {
                    setDraft(JSON.stringify(e.input, null, 2))
                    setUsedInput(e.input)
                    setRun(e.run)
                    setIndex(0)
                    setPlaying(false)
                    setError('')
                    setTab('Visualization')
                  }}
                >
                  Load saved trace
                </button>
                <button type="button" onClick={() => setExperiments((items) => items.filter((item) => item.id !== e.id))}>
                  Delete
                </button>
              </div>
            ))}
          {!experiments.some((e) => e.lessonId === lesson.id) && <p>No saved traces yet. Run an input in Visualization and choose Save experiment locally.</p>}
        </section>
      )}
      {tab === 'Practice' && (
        <section className="daa-card">
          <h2>Reason about the algorithm</h2>
          <p>{lesson.exercise.question}</p>
          <label>
            Your reasoning
            <textarea rows={4} placeholder="Write your answer before revealing the explanation" />
          </label>
          <button type="button" onClick={() => setAnswer((a) => !a)}>
            {answer ? 'Hide answer' : 'Reveal answer'}
          </button>
          {answer && <blockquote>{lesson.exercise.answer}</blockquote>}
          <p>Also trace the worked example by hand, identify an edge case and justify the applicable bound.</p>
        </section>
      )}
      {saveMessage && <p role="status">{saveMessage}</p>}
    </div>
  )
}

export function DaaWorkspace({ module, completed, toggleCompleted }: Props) {
  return (
    <div className={`daa-workspace${module.lessonId === 'dashboard' ? '' : ' compact-daa'}`} data-lesson-id={module.lessonId}>
      {module.lessonId === 'dashboard' && (
        <div className="daa-top">
          <Link to="/daa/syllabus-dashboard">← DAA concepts</Link>
          <Link to="/sorting/bubble-sort">Algorithm visualizer</Link>
          <AccountControl />
        </div>
      )}
      {module.lessonId === 'dashboard' ? (
        <Dashboard completed={completed} />
      ) : (
        <LessonView key={module.id} lesson={lessonById.get(module.lessonId ?? module.id)!} completed={completed} toggleCompleted={toggleCompleted} />
      )}
    </div>
  )
}
