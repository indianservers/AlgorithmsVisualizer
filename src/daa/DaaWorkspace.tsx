// @localized-render
import { tx, useLocaleRender } from '../i18n/render'
import { ProblemInputFields } from '../components/ProblemInputFields'
import { MobileDisclosure } from '../components/MobileDisclosure'
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
  RotateCcw,
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
import './bellman-ford.css'
import { MockupLessonChrome } from './MockupLessonChrome'
import { TargetLessonVisualization } from './TargetLessonVisualization'
const MedianOfMediansLesson = lazy(() => import('./MedianOfMediansLesson').then((module) => ({ default: module.MedianOfMediansLesson })))
const QuickselectMockupLesson = lazy(() => import('./QuickselectMockupLesson').then((module) => ({ default: module.QuickselectMockupLesson })))
const StrassenMockupLesson = lazy(() => import('./StrassenMockupLesson').then((module) => ({ default: module.StrassenMockupLesson })))
const MaximumSubarrayMockupLesson = lazy(() => import('./MaximumSubarrayMockupLesson').then((module) => ({ default: module.MaximumSubarrayMockupLesson })))
const MinMaxMockupLesson = lazy(() => import('./MinMaxMockupLesson').then((module) => ({ default: module.MinMaxMockupLesson })))
const PseudocodeMockupLesson = lazy(() => import('./PseudocodeMockupLesson').then((module) => ({ default: module.PseudocodeMockupLesson })))
const AmortizedMockupLesson = lazy(() => import('./AmortizedMockupLesson').then((module) => ({ default: module.AmortizedMockupLesson })))
const GreedyExchangeMockupLesson = lazy(() => import('./GreedyExchangeMockupLesson').then((module) => ({ default: module.GreedyExchangeMockupLesson })))
const InvariantMockupLesson = lazy(() => import('./InvariantMockupLesson').then((module) => ({ default: module.InvariantMockupLesson })))
const MasterTheoremMockupLesson = lazy(() => import('./MasterTheoremMockupLesson').then((module) => ({ default: module.MasterTheoremMockupLesson })))
const RecursionTreeMockupLesson = lazy(() => import('./RecursionTreeMockupLesson').then((module) => ({ default: module.RecursionTreeMockupLesson })))
const SubstitutionMockupLesson = lazy(() => import('./SubstitutionMockupLesson').then((module) => ({ default: module.SubstitutionMockupLesson })))
const LoopRecursionMockupLesson = lazy(() => import('./LoopRecursionMockupLesson').then((module) => ({ default: module.LoopRecursionMockupLesson })))
const CaseSpaceMockupLesson = lazy(() => import('./CaseSpaceMockupLesson').then((module) => ({ default: module.CaseSpaceMockupLesson })))
const AsymptoticMockupLesson = lazy(() => import('./AsymptoticMockupLesson').then((module) => ({ default: module.AsymptoticMockupLesson })))
const DivideConquerMockupLesson = lazy(() => import('./DivideConquerMockupLesson').then((module) => ({ default: module.DivideConquerMockupLesson })))
import { GraphLearningStudio } from '../learning/GraphLearningStudio'
const DPLessonPage = lazy(() => import('../learning/DynamicProgrammingStudio').then((module) => ({ default: module.DPLessonPage })))
const GreedyLessonPage = lazy(() => import('../learning/GreedyStudio').then((module) => ({ default: module.GreedyLessonPage })))
const BacktrackingLessonPage = lazy(() => import('../learning/BacktrackingStudio').then((module) => ({ default: module.BacktrackingLessonPage })))
import { isTargetUiLesson } from './targetUi'

type Props = { module: AlgorithmModule; completed: string[]; toggleCompleted: (id: string) => void; theme?: string; onToggleTheme?: () => void }
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
  bellmanStyle = false,
  onValidityChange,
}: {
  input: string
  onChange: (value: string) => void
  graphStyle?: boolean
  traversalStyle?: boolean
  bfsStyle?: boolean
  bellmanStyle?: boolean
  onValidityChange?: (error: string) => void
}) {
  useLocaleRender()

  if (!graphStyle && !traversalStyle && !bfsStyle) return <ProblemInputFields draft={input} onChange={onChange} onValidityChange={onValidityChange} />
  let parsed: Record<string, unknown>
  try {
    parsed = JSON.parse(input)
  } catch {
    return <p>{tx('Correct the JSON input below to restore the field editor.', 'studios')}</p>
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null
  function update(key: string, value: unknown) {
    onChange(JSON.stringify({ ...parsed, [key]: value }, null, 2))
  }
  return (
    <div className="daa-field-editor">
      {tx(
        Object.entries(parsed).map(([key, value]) => {
          if (key === 'edges' && Array.isArray(value))
            return (
              <fieldset key={key}>
                <legend>{tx('Graph edges', 'studios')}</legend>
                <p>
                  {tx(
                    bfsStyle
                      ? 'Each row connects two vertices. Weights are ignored by BFS and DFS.'
                      : traversalStyle
                        ? 'Each row connects two vertices. Weights are ignored by DFS and used as labels.'
                        : graphStyle
                          ? bellmanStyle
                            ? 'Negative edge weights are supported.'
                            : 'Each row connects two vertices with a non-negative weight.'
                          : 'Each row connects two vertices. Weights are ignored by BFS and DFS.',
                    'studios',
                  )}
                </p>
                <div className={`edge-table-heading ${bfsStyle ? 'with-edge-number' : ''}`} aria-hidden="true">
                  {tx(bfsStyle && <span>#</span>, 'studios')}
                  <span>{tx('From', 'studios')}</span>
                  <span>{tx('To', 'studios')}</span>
                  <span>{tx('Weight', 'studios')}</span>
                  <span />
                </div>
                <div className="daa-edge-list">
                  {tx(
                    value.map((edge, index) => (
                      <div className="daa-edge-row" key={index}>
                        {tx(
                          bfsStyle && (
                            <label className="bfs-edge-number">
                              #<output>{tx(index + 1, 'studios')}</output>
                            </label>
                          ),
                          'studios',
                        )}
                        {tx(
                          ['from', 'to', 'weight'].map((field) => (
                            <label key={field}>
                              <span className="sr-only">{tx(field, 'studios')}</span>
                              <input
                                type="number"
                                aria-label={tx(`Edge ${index + 1} ${field}`, 'studios')}
                                value={edge[field]}
                                onChange={(event) =>
                                  update(
                                    key,
                                    value.map((item, i) => (i === index ? { ...item, [field]: Number(event.target.value) } : item)),
                                  )
                                }
                              />
                            </label>
                          )),
                          'studios',
                        )}
                        <button
                          type="button"
                          aria-label={tx(`Remove edge ${index + 1}`, 'studios')}
                          onClick={() =>
                            update(
                              key,
                              value.filter((_, i) => i !== index),
                            )
                          }
                        >
                          {tx(graphStyle || traversalStyle ? <Trash2 size={14} aria-hidden="true" /> : '×', 'studios')}
                        </button>
                      </div>
                    )),
                    'studios',
                  )}
                </div>
                {tx(
                  traversalStyle ? (
                    <div className="daa-edge-actions">
                      <button aria-label={tx('Add edge', 'studios')} type="button" onClick={() => update(key, [...value, { from: 0, to: 1, weight: 1 }])}>
                        {tx(traversalStyle && <span aria-hidden="true">＋</span>, 'studios')}
                        {tx('Add edge', 'studios')}
                      </button>
                      {tx(
                        traversalStyle && !bfsStyle && (
                          <button className="dfs-clear-edges" type="button" onClick={() => update(key, [])}>
                            <Trash2 size={14} />
                            {tx('Clear all', 'studios')}
                          </button>
                        ),
                        'studios',
                      )}
                    </div>
                  ) : (
                    <button type="button" onClick={() => update(key, [...value, { from: 0, to: 1, weight: 1 }])}>
                      {tx('Add edge', 'studios')}
                    </button>
                  ),
                  'studios',
                )}
              </fieldset>
            )
          if (typeof value === 'boolean' && bellmanStyle)
            return (
              <div className="bf-direction" key={key}>
                <span>{tx('Directed graph', 'studios')}</span>
                <button type="button" role="switch" aria-label={tx('Directed graph', 'studios')} aria-checked={value} onClick={() => update(key, !value)}>
                  <i />
                </button>
                <span>{tx(value ? 'Yes (directed)' : 'No (undirected)', 'studios')}</span>
              </div>
            )
          if (typeof value === 'boolean' && graphStyle)
            return (
              <div className="dijkstra-direction" key={key}>
                <span>{tx('Graph type', 'studios')}</span>
                <div role="group" aria-label={tx('Graph type', 'studios')}>
                  {tx(
                    [true, false].map((directed) => (
                      <button key={String(directed)} type="button" aria-pressed={value === directed} onClick={() => update(key, directed)}>
                        {tx(directed ? 'Directed' : 'Undirected', 'studios')}
                      </button>
                    )),
                    'studios',
                  )}
                </div>
              </div>
            )
          if (typeof value === 'boolean')
            return (
              <label key={key}>
                {tx(traversalStyle && !bfsStyle ? 'Graph type' : key, 'studios')}
                <select aria-label={tx(key, 'studios')} value={String(value)} onChange={(event) => update(key, event.target.value === 'true')}>
                  <option value="true">{tx('Directed', 'studios')}</option>
                  <option value="false">{tx('Undirected', 'studios')}</option>
                </select>
                {tx(bfsStyle && <small>{tx('true for directed, false for undirected.', 'studios')}</small>, 'studios')}
              </label>
            )
          if (typeof value === 'number' || typeof value === 'string')
            return (
              <label key={key}>
                {tx(
                  bfsStyle ? key : graphStyle || traversalStyle ? (key === 'vertices' ? 'Number of vertices' : key === 'source' ? 'Source vertex' : key) : key,
                  'studios',
                )}
                <input
                  aria-label={tx(key, 'studios')}
                  type={typeof value === 'number' ? 'number' : 'text'}
                  value={String(value)}
                  onChange={(event) => update(key, typeof value === 'number' ? Number(event.target.value) : event.target.value)}
                />
                {tx(
                  bfsStyle && (
                    <small>
                      {tx(key === 'vertices' ? 'Number of vertices (1–8).' : key === 'source' ? 'Start vertex; flow sink is the last vertex.' : '', 'studios')}
                    </small>
                  ),
                  'studios',
                )}
              </label>
            )
          return (
            <div key={key}>
              <strong>{tx(key, 'studios')}</strong>
              <ArrayField name={key} value={value} onApply={(next) => update(key, next)} />
            </div>
          )
        }),
        'studios',
      )}
    </div>
  )
}

function ArrayField({ name, value, onApply }: { name: string; value: unknown; onApply: (value: unknown) => void }) {
  useLocaleRender()

  const matrix = Array.isArray(value) && Array.isArray(value[0])
  const [text, setText] = useState(() =>
      Array.isArray(value) ? (matrix ? value.map((row) => row.join(', ')).join('\n') : value.join(', ')) : JSON.stringify(value),
    ),
    [message, setMessage] = useState('')
  return (
    <div>
      <label>
        {tx(matrix ? 'One row per line, numbers separated by commas' : 'Numbers separated by commas', 'studios')}
        <textarea aria-label={tx(`${name} values`, 'studios')} rows={matrix ? 4 : 2} value={text} onChange={(event) => setText(event.target.value)} />
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
        {tx('Apply ', 'studios')}
        {tx(name, 'studios')}
      </button>
      <small role="status">{tx(message, 'studios')}</small>
    </div>
  )
}

export function StateView({
  state,
  spacious = false,
  traversalLayout = false,
  breadthLayout = false,
  bellmanLayout = false,
}: {
  state?: LearningState
  spacious?: boolean
  traversalLayout?: boolean
  breadthLayout?: boolean
  bellmanLayout?: boolean
}) {
  useLocaleRender()

  if (!state) return <p>{tx('Run an example to see its computed states.', 'studios')}</p>
  const g = state.graph
  const position = (v: number) => {
    const angle = (2 * Math.PI * v) / (g?.vertices ?? 1) - Math.PI / 2
    if (bellmanLayout && g?.vertices === 5)
      return [
        { x: 260, y: 46 },
        { x: 430, y: 145 },
        { x: 360, y: 300 },
        { x: 160, y: 300 },
        { x: 100, y: 155 },
      ][v]
    return traversalLayout
      ? { x: 300 + 220 * Math.cos(angle), y: 170 + 130 * Math.sin(angle) }
      : { x: 260 + 170 * Math.cos(angle), y: 200 + 145 * Math.sin(angle) }
  }
  return (
    <div className="daa-state">
      {tx(
        state.matrices && (
          <div className="daa-matrices">
            {tx(
              state.matrices.map((matrix) => (
                <div className="daa-table-scroll" key={matrix.label}>
                  <table className="daa-table">
                    <caption>{tx(matrix.label, 'studios')}</caption>
                    <tbody>
                      {tx(
                        matrix.values.map((row, i) => (
                          <tr key={i}>
                            {tx(
                              row.map((value, j) => <td key={j}>{tx(cell(value), 'studios')}</td>),
                              'studios',
                            )}
                          </tr>
                        )),
                        'studios',
                      )}
                    </tbody>
                  </table>
                </div>
              )),
              'studios',
            )}
          </div>
        ),
        'studios',
      )}
      {tx(
        state.values?.length && state.values.every((value) => typeof value === 'number' && Number.isFinite(value)) ? (
          <div className="daa-value-chart" aria-label={tx('Array value visualization', 'studios')}>
            {tx(
              state.values.map((value, i) => (
                <div key={i} className={state.activeIndices?.includes(i) ? 'active' : ''}>
                  <strong>{tx(cell(value), 'studios')}</strong>
                  <span style={{ height: `${20 + (Math.abs(Number(value)) / Math.max(1, ...state.values!.map((v) => Math.abs(Number(v))))) * 100}px` }} />
                  <small>{tx(state.labels?.[i] ?? `index ${i}`, 'studios')}</small>
                </div>
              )),
              'studios',
            )}
          </div>
        ) : null,
        'studios',
      )}
      {tx(
        g && (
          <svg
            className="daa-graph"
            viewBox={bellmanLayout ? '0 0 620 365' : traversalLayout ? '0 0 600 360' : spacious ? '40 12 440 380' : '0 0 520 400'}
            role="img"
            aria-label={tx('Weighted graph state', 'studios')}
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
            {tx(
              g.edges.map((e, index) => {
                const a = position(e.from),
                  b = position(e.to),
                  dx = b.x - a.x,
                  dy = b.y - a.y,
                  len = Math.hypot(dx, dy) || 1
                const active = g.selected?.some(([u, v]) => (u === e.from && v === e.to) || (!g.directed && u === e.to && v === e.from))
                return (
                  <g key={index} className={active ? 'selected' : ''}>
                    {tx(
                      e.from === e.to ? (
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
                      ),
                      'studios',
                    )}
                    <text x={(a.x + b.x) / 2 + (dy / len) * 10} y={(a.y + b.y) / 2 - (dx / len) * 10} textAnchor="middle">
                      {tx(e.weight, 'studios')}
                    </text>
                  </g>
                )
              }),
              'studios',
            )}
            {tx(
              Array.from({ length: g.vertices }, (_, v) => {
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
                    <circle cx={p.x} cy={p.y} r={spacious || traversalLayout || bellmanLayout ? 26 : 22} />
                    <text x={p.x} y={p.y + 5} textAnchor="middle">
                      {tx(v, 'studios')}
                    </text>
                    <text className="vertex-label" x={p.x} y={p.y + 42} textAnchor="middle">
                      {tx(bellmanLayout && g.labels?.[v] === 'Infinity' ? 'Infinity' : g.labels?.[v], 'studios')}
                    </text>
                  </g>
                )
              }),
              'studios',
            )}
          </svg>
        ),
        'studios',
      )}
      {tx(
        state.table && (
          <div className="daa-table-scroll">
            <table className="daa-table">
              <caption>{tx('Computed table state', 'studios')}</caption>
              {tx(
                state.columnLabels && (
                  <thead>
                    <tr>
                      <th scope="col">{tx('State', 'studios')}</th>
                      {tx(
                        state.columnLabels.map((v, i) => (
                          <th key={i} scope="col">
                            {tx(v, 'studios')}
                          </th>
                        )),
                        'studios',
                      )}
                    </tr>
                  </thead>
                ),
                'studios',
              )}
              <tbody>
                {tx(
                  state.table.map((r, i) => (
                    <tr key={i}>
                      <th scope="row">{tx(state.rowLabels?.[i] ?? i, 'studios')}</th>
                      {tx(
                        r.map((v, j) => <td key={j}>{tx(cell(v), 'studios')}</td>),
                        'studios',
                      )}
                    </tr>
                  )),
                  'studios',
                )}
              </tbody>
            </table>
          </div>
        ),
        'studios',
      )}
      {tx(
        state.values && (
          <div className="daa-cells">
            {tx(
              state.values.map((v, i) => (
                <div key={i}>
                  <small>{tx(state.labels?.[i] ?? i, 'studios')}</small>
                  <strong>{tx(cell(v), 'studios')}</strong>
                </div>
              )),
              'studios',
            )}
          </div>
        ),
        'studios',
      )}
      {tx(
        state.search && (
          <div className="daa-search">
            <p>
              {tx('Search tree: ', 'studios')}
              {tx(state.searchTotal ?? state.search.length, 'studios')}
              {tx(' discovered nodes. Showing the latest 80; each recorded frame retains a window of 128 nodes with parent IDs in JSON exports.', 'studios')}
            </p>
            <ol>
              {tx(
                state.search.slice(-80).map((n) => (
                  <li key={n.id} className={n.pruned ? 'pruned' : ''}>
                    <strong>#{tx(n.id, 'studios')}</strong>{' '}
                    {tx(
                      n.parent !== undefined && (
                        <span>
                          {tx('← parent #', 'studios')}
                          {tx(n.parent, 'studios')}{' '}
                        </span>
                      ),
                      'studios',
                    )}
                    {tx(n.label, 'studios')}
                    {tx(
                      n.bound !== undefined && (
                        <span>
                          {tx(' · bound ', 'studios')}
                          {tx(Number(n.bound.toFixed(3)), 'studios')}
                        </span>
                      ),
                      'studios',
                    )}
                    {tx(n.pruned && <em>{tx(' · pruned', 'studios')}</em>, 'studios')}
                  </li>
                )),
                'studios',
              )}
            </ol>
          </div>
        ),
        'studios',
      )}
      {tx(state.note && <p>{tx(state.note, 'studios')}</p>, 'studios')}
    </div>
  )
}

function Dashboard({ completed }: { completed: string[] }) {
  useLocaleRender()

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
        <span className="daa-eyebrow">{tx('DESIGN & ANALYSIS OF ALGORITHMS', 'studios')}</span>
        <h1>{tx('DAA Concept Library', 'studios')}</h1>
        <p>{tx('Learn the foundations of algorithm design and analysis, then explore advanced concepts at your own pace.', 'studios')}</p>
      </header>
      <section className="daa-card">
        <h2>{tx('Explore concepts', 'studios')}</h2>
        <p>{tx('Browse algorithm design, analysis and correctness lessons. Lesson coverage and your study progress are tracked separately.', 'studios')}</p>
        <div className="daa-stats">
          <span>
            {tx(counts.complete, 'studios')}
            {tx(' complete', 'studios')}
          </span>
          <span>
            {tx(counts.partial, 'studios')}
            {tx(' partial', 'studios')}
          </span>
          <span>
            {tx(counts.missing, 'studios')}
            {tx(' missing', 'studios')}
          </span>
          <strong>{tx('Concept-based learning library', 'studios')}</strong>
        </div>
        <div className="daa-filters">
          <label>
            {tx('Coverage', 'studios')}
            <select aria-label={tx('Coverage', 'studios')} value={filter} onChange={(e) => setFilter(e.target.value)}>
              {tx(
                ['all', 'complete', 'partial', 'missing'].map((v) => <option key={v}>{tx(v, 'studios')}</option>),
                'studios',
              )}
            </select>
          </label>
          <label>
            {tx('Find topic', 'studios')}
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={tx('Search concepts', 'studios')} />
          </label>
        </div>
        <div className="daa-table-scroll">
          <table className="daa-coverage">
            <thead>
              <tr>
                <th>{tx('Topic', 'studios')}</th>
                <th>{tx('Coverage', 'studios')}</th>
                <th>{tx('Pages and limitations', 'studios')}</th>
              </tr>
            </thead>
            <tbody>
              {tx(
                rows.map((t) => (
                  <tr key={t.topic}>
                    <th scope="row">{tx(t.topic, 'studios')}</th>
                    <td>
                      <span className={`daa-badge ${coverageFor(t, allModules)}`}>{tx(coverageFor(t, allModules), 'studios')}</span>
                    </td>
                    <td>
                      {tx(
                        t.pages.map((id) => {
                          const m = allModules.find((m) => m.id === id)
                          return m ? (
                            <Link key={id} to={algorithmPath(m)}>
                              {tx(m.name, 'studios')}
                            </Link>
                          ) : (
                            <span key={id}>
                              {tx('Missing page: ', 'studios')}
                              {tx(id, 'studios')}
                            </span>
                          )
                        }),
                        'studios',
                      )}
                      {tx(t.limitation && <p>{tx(t.limitation, 'studios')}</p>, 'studios')}
                    </td>
                  </tr>
                )),
                'studios',
              )}
            </tbody>
          </table>
        </div>
      </section>
      {tx(
        [
          ['Core learning path', core],
          ['Advanced concepts and extensions', extensions],
        ].map(([title, items]) => (
          <section className="daa-card" key={String(title)}>
            <h2>{tx(String(title), 'studios')}</h2>
            <p>
              {tx('Your progress: ', 'studios')}
              {tx((items as Lesson[]).filter((l) => completed.includes(l.id)).length, 'studios')} / {tx((items as Lesson[]).length, 'studios')}
              {tx(' lessons marked studied.', 'studios')}
            </p>
            <div className="daa-lesson-grid">
              {tx(
                (items as Lesson[]).map((l) => (
                  <Link key={l.id} to={algorithmPath(allModules.find((m) => m.id === l.id)!)}>
                    <span>{tx(l.category, 'studios')}</span>
                    <strong>{tx(l.title, 'studios')}</strong>
                    <small>{tx(completed.includes(l.id) ? 'Studied' : l.theory ? 'Theory lesson' : 'Interactive algorithm', 'studios')}</small>
                  </Link>
                )),
                'studios',
              )}
            </div>
          </section>
        )),
        'studios',
      )}
    </>
  )
}

function TraceDisclosure({ compact, children, expanded }: { compact: boolean; children: ReactNode; expanded?: boolean }) {
  useLocaleRender()

  return compact ? (
    <details className="dfs-trace-details" open={expanded}>
      <summary>{tx('Algorithm steps & computed result', 'studios')}</summary>
      {tx(children, 'studios')}
    </details>
  ) : (
    <>{tx(children, 'studios')}</>
  )
}

function TraceExports({ onExport, onSave, icons = false }: { onExport: (format: 'json' | 'csv') => void; onSave: () => void; icons?: boolean }) {
  useLocaleRender()

  return (
    <div className="daa-actions daa-trace-exports">
      <button type="button" onClick={() => onExport('json')}>
        {tx(icons && <Download size={16} />, 'studios')}
        {tx('Export JSON trace', 'studios')}
      </button>
      <button type="button" onClick={() => onExport('csv')}>
        {tx(icons && <FileSpreadsheet size={16} />, 'studios')}
        {tx('Export CSV states', 'studios')}
      </button>
      <button type="button" onClick={onSave}>
        {tx(icons && <Save size={16} />, 'studios')}
        {tx('Save experiment locally', 'studios')}
      </button>
    </div>
  )
}

function LessonView({ lesson, completed, toggleCompleted, module, theme, onToggleTheme }: Props & { lesson: Lesson }) {
  useLocaleRender()

  const targetUiLesson = isTargetUiLesson(lesson)
  const [traversalView, setTraversalView] = usePersistentState('algodrishti-traversal-view', 'graph', persistentString)
  const isBellman = lesson.id === 'bellman-ford'
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
    [selectedTab, setTab] = useState<LearningTab>('Visualization'),
    [editorVersion, setEditorVersion] = useState(0),
    [editorError, setEditorError] = useState(''),
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
    if (editorError) {
      setError(editorError)
      return
    }
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
      {isBellman ? (
        <>
          <MockupLessonChrome
            module={module}
            completed={completed}
            toggleCompleted={toggleCompleted}
            theme={theme}
            onToggleTheme={onToggleTheme}
            title={lesson.title}
            description={lesson.summary}
            onStart={() => setTab('Learn')}
            heroIcon={<Network size={34} />}
            badges={<></>}
            decoration={
              <aside className="bf-topic">
                <BookOpen size={30} />
                <div>
                  <strong>{tx('Single-source shortest paths', 'studios')}</strong>
                  <p>{tx('Works with negative edge weights', 'studios')}</p>
                </div>
                <Info size={16} />
              </aside>
            }
          />
          <div className="bf-breadcrumb">
            <Link to="/daa/syllabus-dashboard">{tx('⌂   Graphs', 'studios')}</Link>
            <span>›</span>
            <strong>{tx(lesson.title, 'studios')}</strong>
          </div>
        </>
      ) : (
        <CompactLessonHeader
          title={tx(lesson.title, 'studios')}
          description={lesson.summary}
          studied={completed.includes(lesson.id)}
          onStudy={() => toggleCompleted(lesson.id)}
          account={<AccountControl />}
        />
      )}
      <LessonTabs
        icons={
          lesson.id === 'dijkstra' || isTraversalStudio || isBellman
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
        tabs={
          lesson.run || targetUiLesson
            ? [
                'Learn',
                'Visualization',
                ...(lesson.run ? (['Code'] as LearningTab[]) : []),
                'Practice',
                ...(lesson.run ? (['Experiments'] as LearningTab[]) : []),
              ]
            : ['Learn', 'Practice']
        }
      />
      {tx(
        tab === 'Learn' && (
          <section className="daa-card">
            <h2>{tx('Concept and worked example', 'studios')}</h2>
            {tx(
              lesson.theory?.map((p, i) => <p key={i}>{tx(p, 'studios')}</p>),
              'studios',
            )}
            <blockquote>{tx(lesson.example, 'studios')}</blockquote>
            {tx(
              !lesson.theory && (
                <>
                  <h2>{tx('Correctness', 'studios')}</h2>
                  <p>{tx(lesson.correctness, 'studios')}</p>
                  <h2>{tx('Complexity derivation', 'studios')}</h2>
                  <p>
                    <strong>
                      {tx('Time: ', 'studios')}
                      {tx(lesson.time, 'studios')}
                      {tx(' · Auxiliary/output space: ', 'studios')}
                      {tx(lesson.space, 'studios')}
                    </strong>
                  </p>
                  <p>{tx(lesson.derivation, 'studios')}</p>
                </>
              ),
              'studios',
            )}
            <h2>{tx('Assumptions and constraints', 'studios')}</h2>
            <p>{tx(lesson.constraints, 'studios')}</p>
            {tx(
              lesson.run && (
                <button type="button" onClick={() => setTab('Visualization')}>
                  {tx('Try the worked example', 'studios')}
                </button>
              ),
              'studios',
            )}
          </section>
        ),
        'studios',
      )}
      {tx(
        lesson.defaultInput?.vertices && (tab === 'Learn' || tab === 'Visualization') && (
          <details className="graph-academy-wrap" open={tab === 'Learn'} key={`${lesson.id}-${tab}`}>
            <summary>
              {isBellman && <Lightbulb size={22} />}
              <span>
                {tx('Explore the graph learning lab · build, predict, compare', 'studios')}
                {isBellman && (
                  <small>{tx('Visualize each relaxation step, see how distances change, and detect negative cycles in real time.', 'studios')}</small>
                )}
              </span>
            </summary>
            <GraphLearningStudio key={lesson.id} lesson={lesson} />
          </details>
        ),
        'studios',
      )}
      {tx(tab === 'Visualization' && targetUiLesson && <TargetLessonVisualization lesson={lesson} />, 'studios')}
      {tx(
        tab === 'Visualization' && !targetUiLesson && (
          <div className="daa-interactive-layout">
            <MobileDisclosure className="daa-card daa-input-card" defaultOpen title={tx('Edit input and run algorithm', 'studios')}>
              <div>
                <h2>
                  {tx((isTraversalStudio || isBellman) && <Settings size={22} />, 'studios')}
                  {tx('Problem Input', 'studios')}
                  {isBellman && (
                    <button
                      className="bf-reset"
                      type="button"
                      onClick={() => {
                        setDraft(JSON.stringify(lesson.defaultInput, null, 2))
                        setEditorVersion((v) => v + 1)
                        setEditorError('')
                        setError('')
                      }}
                    >
                      <RotateCcw size={14} />
                      {tx('Reset', 'studios')}
                    </button>
                  )}
                </h2>
                <p>
                  {tx(
                    isBfs
                      ? 'Zero-based vertices and item indices; edit the fields below, then run. Validation errors appear below.'
                      : isTraversalStudio
                        ? 'Create your own graph, edit parameters, and run DFS.'
                        : lesson.id === 'dijkstra'
                          ? 'Create your own graph, edit parameters, and run Dijkstra’s algorithm.'
                          : 'Edit the named fields below, then choose Run algorithm. Paste lists with commas, spaces, or new lines. Selection rank k starts at 1.',
                    'studios',
                  )}
                </p>
                {tx(
                  isBfs && (
                    <select
                      className="bfs-examples"
                      aria-label={tx('Load example', 'studios')}
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
                        setEditorError('')
                        setError('')
                      }}
                    >
                      <option value="" disabled>
                        {tx('Load example', 'studios')}
                      </option>
                      <option value="default">{tx('Default graph', 'studios')}</option>
                      <option value="branching">{tx('Undirected branching graph', 'studios')}</option>
                      <option value="disconnected">{tx('Disconnected graph', 'studios')}</option>
                    </select>
                  ),
                  'studios',
                )}
                <ProblemEditor
                  bfsStyle={isBfs}
                  traversalStyle={isTraversalStudio}
                  graphStyle={lesson.id === 'dijkstra' || isBellman}
                  bellmanStyle={isBellman}
                  key={lesson.id + editorVersion}
                  input={draft}
                  onChange={setDraft}
                  onValidityChange={setEditorError}
                />
                <details>
                  <summary>{tx('Advanced: edit full JSON input', 'studios')}</summary>
                  <label htmlFor="daa-input">{tx('Problem input (JSON)', 'studios')}</label>
                  <textarea
                    id="daa-input"
                    value={draft}
                    spellCheck={false}
                    onChange={(e) => {
                      setEditorError('')
                      setDraft(e.target.value)
                    }}
                    rows={12}
                  />
                </details>
                <div className="daa-actions">
                  <button aria-label={tx('Run algorithm', 'studios')} type="button" onClick={start} disabled={!!editorError}>
                    {tx('Run algorithm', 'studios')}
                  </button>
                  <button
                    aria-label={tx('Reset input', 'studios')}
                    type="button"
                    onClick={() => {
                      setDraft(JSON.stringify(lesson.defaultInput, null, 2))
                      setEditorVersion((version) => version + 1)
                      setEditorError('')
                      setError('')
                    }}
                  >
                    {tx('Reset input', 'studios')}
                  </button>
                </div>
                {tx(
                  error && (
                    <p role="alert" className="daa-error">
                      {tx(error, 'studios')}
                    </p>
                  ),
                  'studios',
                )}
              </div>
              <details className="input-reference">
                <summary>{tx('Input fields & constraints', 'studios')}</summary>
                <dl>
                  {tx(
                    Object.entries(lesson.defaultInput ?? {}).map(([key, value]) => (
                      <div key={key}>
                        <dt>{tx(key, 'studios')}</dt>
                        <dd>
                          {tx(
                            key === 'edges'
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
                                        : 'Integer within the lesson constraints.',
                            'studios',
                          )}
                        </dd>
                      </div>
                    )),
                    'studios',
                  )}
                </dl>
                <p>{tx(lesson.constraints, 'studios')}</p>
              </details>
            </MobileDisclosure>
            {tx(
              run && (
                <section className="daa-card daa-timeline-card">
                  <h2>
                    {tx(isBfs ? <Network size={25} /> : isTraversalStudio && <BarChart3 size={24} />, 'studios')}
                    {tx(' ', 'studios')}
                    {tx(lesson.id === 'dijkstra' || isTraversalStudio ? 'Graph Visualization' : 'Computed timeline', 'studios')}
                  </h2>
                  {tx(
                    isTraversalStudio && (
                      <div className="dfs-legend">
                        <span>
                          {tx(
                            isBfs
                              ? 'Step through the BFS traversal and see the frontier evolve.'
                              : 'Step through DFS execution and see how the stack and visited set evolve.',
                            'studios',
                          )}
                        </span>
                        <div>
                          {tx(
                            isBfs ? (
                              <>
                                <i />
                                {tx('Unvisited', 'studios')}
                                <i />
                                {tx('Visited', 'studios')}
                                <i />
                                {tx('Frontier', 'studios')}
                                <i />
                                {tx('Unreachable', 'studios')}
                              </>
                            ) : (
                              <>
                                <i />
                                {tx('Unvisited', 'studios')}
                                <i />
                                {tx('Current node', 'studios')}
                                <i />
                                {tx('Visited', 'studios')}
                                <i />
                                {tx('Pending', 'studios')}
                              </>
                            ),
                            'studios',
                          )}
                        </div>
                      </div>
                    ),
                    'studios',
                  )}
                  {tx(
                    lesson.id === 'dijkstra' && (
                      <div className="dijkstra-legend">
                        <span>{tx('Step through Dijkstra’s algorithm and see how shortest paths are discovered.', 'studios')}</span>
                        <div>
                          <i />
                          {tx(' Unvisited ', 'studios')}
                          <i />
                          {tx(' Current node ', 'studios')}
                          <i />
                          {tx(' Relaxed edge ', 'studios')}
                          <i />
                          {tx(' Visited', 'studios')}
                        </div>
                      </div>
                    ),
                    'studios',
                  )}
                  {tx(
                    draft !== JSON.stringify(usedInput, null, 2) && (
                      <p role="status">
                        {tx('Input has changed. Run algorithm to update this timeline; the displayed steps still use the previous input.', 'studios')}
                      </p>
                    ),
                    'studios',
                  )}
                  {isBellman && (
                    <p className="bf-timeline-hint">{tx('Step through the algorithm to see how shortest path estimates are relaxed.', 'studios')}</p>
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
                      !isBellman &&
                      (weightedExplorerMode || isExplorerTraversal) && (
                        <div className="bubble-view-switch" role="group" aria-label={tx('View as', 'studios')}>
                          <button
                            type="button"
                            aria-pressed={(weightedExplorerMode ? weightedView : traversalView) !== 'icons'}
                            onClick={() => (weightedExplorerMode ? setWeightedView('graph') : setTraversalView('graph'))}
                          >
                            {tx('Graph', 'studios')}
                          </button>
                          <button
                            type="button"
                            aria-pressed={(weightedExplorerMode ? weightedView : traversalView) === 'icons'}
                            onClick={() => (weightedExplorerMode ? setWeightedView('icons') : setTraversalView('icons'))}
                          >
                            {tx('Icons', 'studios')}
                          </button>
                        </div>
                      )
                    }
                  />
                  <p aria-live="polite" className="daa-step-description">
                    {tx(isBellman ? <Info size={18} /> : isBfs ? <Info size={18} /> : isTraversalStudio && <Lightbulb size={20} />, 'studios')}{' '}
                    {tx(step?.description, 'studios')}
                  </p>
                  {tx(
                    run.message && (
                      <p role="status" className="daa-error">
                        {tx(run.message, 'studios')}
                      </p>
                    ),
                    'studios',
                  )}
                  {tx(
                    lesson.id === 'randomized-quicksort' && (
                      <label>
                        {tx('Sorting character', 'studios')}
                        <select
                          aria-label={tx('Sorting character', 'studios')}
                          value={sortingView === 'bars' ? 'bars' : character}
                          onChange={(event) => {
                            if (event.target.value === 'bars') setSortingView('bars')
                            else {
                              setCharacter(event.target.value)
                              setSortingView('icons')
                            }
                          }}
                        >
                          <option value="bars">{tx('Bars', 'studios')}</option>
                          {tx(
                            sortingCharacters.map((option) => (
                              <option key={option.id} value={option.id}>
                                {tx(option.icon, 'studios')} {tx(option.name, 'studios')}
                              </option>
                            )),
                            'studios',
                          )}
                        </select>
                      </label>
                    ),
                    'studios',
                  )}
                  <ViewportCanvas>
                    {tx(
                      weightedExplorerMode && weightedView === 'icons' ? (
                        <Suspense fallback={<p>{tx('Loading expedition…', 'studios')}</p>}>
                          <WeightedExplorer step={step} mode={weightedExplorerMode} reducedMotion={sortingReducedMotion} />
                        </Suspense>
                      ) : isExplorerTraversal && traversalView === 'icons' ? (
                        <Suspense fallback={<p>{tx('Loading expedition…', 'studios')}</p>}>
                          <ExplorerTraversal
                            step={step}
                            previous={run.steps[index - 1]}
                            mode={lesson.id === 'daa-bfs' ? 'bfs' : 'dfs'}
                            reducedMotion={sortingReducedMotion}
                          />
                        </Suspense>
                      ) : lesson.id === 'randomized-quicksort' && sortingView === 'icons' ? (
                        <Suspense fallback={<p>{tx('Loading characters…', 'studios')}</p>}>
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
                        <StateView
                          state={step?.state}
                          spacious={lesson.id === 'dijkstra'}
                          traversalLayout={isTraversalStudio}
                          breadthLayout={isBfs}
                          bellmanLayout={isBellman}
                        />
                      ),
                      'studios',
                    )}
                  </ViewportCanvas>
                  {tx(isTraversalStudio && <TraceExports icons onExport={exportRun} onSave={saveExperiment} />, 'studios')}
                  <TraceDisclosure compact expanded={index === last}>
                    {tx(lesson.id === 'dijkstra' && <h3 className="dijkstra-steps-title">{tx('Algorithm Steps', 'studios')}</h3>, 'studios')}
                    <ol className="daa-pseudocode">
                      {tx(
                        lesson.pseudocode.map((line, i) => (
                          <li key={i} className={step?.type !== 'complete' && step?.pseudocodeLine === i ? 'active' : ''}>
                            {tx(line, 'studios')}
                          </li>
                        )),
                        'studios',
                      )}
                    </ol>
                    <div className="daa-run-result">
                      <details open={index === last}>
                        <summary>
                          {tx('Computed result · ', 'studios')}
                          {tx(run.status === 'complete' ? 'complete trace' : 'truncated trace', 'studios')}
                        </summary>
                        <pre className="daa-result">{JSON.stringify(run.result, null, 2)}</pre>
                      </details>
                      <p>
                        {tx('Operation counter: ', 'studios')}
                        {tx(step?.metrics.writes ?? 0, 'studios')}
                        {tx(
                          ' emitted learning events. This is not a comparison count or a complexity proof. Snapshot storage is excluded from the algorithm’s stated space bound.',
                          'studios',
                        )}
                      </p>
                      {tx(!isTraversalStudio && <TraceExports onExport={exportRun} onSave={saveExperiment} />, 'studios')}
                    </div>
                  </TraceDisclosure>
                </section>
              ),
              'studios',
            )}
            {tx(
              experiments.some((e) => e.lessonId === lesson.id) && (
                <section className="daa-card">
                  <h2>{tx('Saved experiments', 'studios')}</h2>
                  {tx(
                    experiments
                      .filter((e) => e.lessonId === lesson.id)
                      .map((e) => (
                        <div key={e.id} className="daa-actions">
                          <span>{tx(new Date(e.createdAt).toLocaleString(), 'studios')}</span>
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
                            {tx('Load saved trace', 'studios')}
                          </button>
                          <button type="button" onClick={() => setExperiments((items) => items.filter((item) => item.id !== e.id))}>
                            {tx('Delete', 'studios')}
                          </button>
                        </div>
                      )),
                    'studios',
                  )}
                </section>
              ),
              'studios',
            )}
          </div>
        ),
        'studios',
      )}
      {tx(
        tab === 'Code' && (
          <section className="daa-card">
            <h2>{tx('Pseudocode', 'studios')}</h2>
            <ol>
              {tx(
                lesson.pseudocode.map((p, i) => <li key={i}>{tx(p, 'studios')}</li>),
                'studios',
              )}
            </ol>
            <h2>{tx('Executable implementation and helpers', 'studios')}</h2>
            <p>
              {tx(
                'The source below is the actual TypeScript runner module, including shared helpers. Function names and source remain readable after production minification.',
                'studios',
              )}
            </p>
            <pre className="daa-source">
              <code>{source}</code>
            </pre>
          </section>
        ),
        'studios',
      )}
      {tx(
        tab === 'Experiments' && (
          <section className="daa-card">
            <h2>{tx('Experiments', 'studios')}</h2>
            <p>
              {tx(
                'Save or export a computed run from Visualization. Change one input property at a time, compare the result and explain the complexity assumptions.',
                'studios',
              )}
            </p>
            <h3>{tx('Saved traces for this lesson', 'studios')}</h3>
            {tx(
              experiments
                .filter((e) => e.lessonId === lesson.id)
                .map((e) => (
                  <div className="daa-actions" key={e.id}>
                    <span>{tx(new Date(e.createdAt).toLocaleString(), 'studios')}</span>
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
                      {tx('Load saved trace', 'studios')}
                    </button>
                    <button type="button" onClick={() => setExperiments((items) => items.filter((item) => item.id !== e.id))}>
                      {tx('Delete', 'studios')}
                    </button>
                  </div>
                )),
              'studios',
            )}
            {tx(
              !experiments.some((e) => e.lessonId === lesson.id) && (
                <p>{tx('No saved traces yet. Run an input in Visualization and choose Save experiment locally.', 'studios')}</p>
              ),
              'studios',
            )}
          </section>
        ),
        'studios',
      )}
      {tx(
        tab === 'Practice' && (
          <section className="daa-card">
            <h2>{tx('Reason about the algorithm', 'studios')}</h2>
            <p>{tx(lesson.exercise.question, 'studios')}</p>
            <label>
              {tx('Your reasoning', 'studios')}
              <textarea rows={4} placeholder={tx('Write your answer before revealing the explanation', 'studios')} />
            </label>
            <button type="button" onClick={() => setAnswer((a) => !a)}>
              {tx(answer ? 'Hide answer' : 'Reveal answer', 'studios')}
            </button>
            {tx(answer && <blockquote>{tx(lesson.exercise.answer, 'studios')}</blockquote>, 'studios')}
            <p>{tx('Also trace the worked example by hand, identify an edge case and justify the applicable bound.', 'studios')}</p>
          </section>
        ),
        'studios',
      )}
      {tx(saveMessage && <p role="status">{tx(saveMessage, 'studios')}</p>, 'studios')}
    </div>
  )
}

export function DaaWorkspace({ module, completed, toggleCompleted, theme, onToggleTheme }: Props) {
  useLocaleRender()

  if (module.id === 'divide-conquer-method')
    return (
      <Suspense fallback={<p role="status">{tx('Loading lesson…', 'studios')}</p>}>
        <DivideConquerMockupLesson module={module} completed={completed} toggleCompleted={toggleCompleted} theme={theme} onToggleTheme={onToggleTheme} />
      </Suspense>
    )

  if (module.id === 'asymptotic-notation')
    return (
      <Suspense fallback={<p role="status">{tx('Loading lesson…', 'studios')}</p>}>
        <AsymptoticMockupLesson module={module} completed={completed} toggleCompleted={toggleCompleted} theme={theme} onToggleTheme={onToggleTheme} />
      </Suspense>
    )

  if (module.id === 'case-time-space-analysis')
    return (
      <Suspense fallback={<p role="status">{tx('Loading lesson…', 'studios')}</p>}>
        <CaseSpaceMockupLesson module={module} completed={completed} toggleCompleted={toggleCompleted} theme={theme} onToggleTheme={onToggleTheme} />
      </Suspense>
    )

  if (module.id === 'loop-recursion-analysis')
    return (
      <Suspense fallback={<p role="status">{tx('Loading lesson…', 'studios')}</p>}>
        <LoopRecursionMockupLesson module={module} completed={completed} toggleCompleted={toggleCompleted} theme={theme} onToggleTheme={onToggleTheme} />
      </Suspense>
    )

  if (module.id === 'recurrence-substitution')
    return (
      <Suspense fallback={<p role="status">{tx('Loading lesson…', 'studios')}</p>}>
        <SubstitutionMockupLesson module={module} completed={completed} toggleCompleted={toggleCompleted} theme={theme} onToggleTheme={onToggleTheme} />
      </Suspense>
    )

  if (module.id === 'recursion-tree')
    return (
      <Suspense fallback={<p role="status">{tx('Loading lesson…', 'studios')}</p>}>
        <RecursionTreeMockupLesson module={module} completed={completed} toggleCompleted={toggleCompleted} theme={theme} onToggleTheme={onToggleTheme} />
      </Suspense>
    )

  if (module.id === 'master-theorem')
    return (
      <Suspense fallback={<p role="status">{tx('Loading lesson…', 'studios')}</p>}>
        <MasterTheoremMockupLesson module={module} completed={completed} toggleCompleted={toggleCompleted} theme={theme} onToggleTheme={onToggleTheme} />
      </Suspense>
    )

  if (module.id === 'correctness-proofs')
    return (
      <Suspense fallback={<p role="status">{tx('Loading lesson…', 'studios')}</p>}>
        <InvariantMockupLesson module={module} completed={completed} toggleCompleted={toggleCompleted} theme={theme} onToggleTheme={onToggleTheme} />
      </Suspense>
    )

  if (module.id === 'greedy-exchange')
    return (
      <Suspense fallback={<p role="status">{tx('Loading lesson…', 'studios')}</p>}>
        <GreedyExchangeMockupLesson module={module} completed={completed} toggleCompleted={toggleCompleted} theme={theme} onToggleTheme={onToggleTheme} />
      </Suspense>
    )

  if (module.id === 'amortized-analysis')
    return (
      <Suspense fallback={<p role="status">{tx('Loading lesson…', 'studios')}</p>}>
        <AmortizedMockupLesson module={module} completed={completed} toggleCompleted={toggleCompleted} theme={theme} onToggleTheme={onToggleTheme} />
      </Suspense>
    )

  if (module.id === 'algorithm-foundations')
    return (
      <Suspense fallback={<p role="status">{tx('Loading lesson…', 'studios')}</p>}>
        <PseudocodeMockupLesson module={module} completed={completed} toggleCompleted={toggleCompleted} theme={theme} onToggleTheme={onToggleTheme} />
      </Suspense>
    )

  if (module.id === 'divide-min-max')
    return (
      <Suspense fallback={<p role="status">{tx('Loading lesson…', 'studios')}</p>}>
        <MinMaxMockupLesson module={module} completed={completed} toggleCompleted={toggleCompleted} theme={theme} onToggleTheme={onToggleTheme} />
      </Suspense>
    )

  if (module.id === 'maximum-subarray')
    return (
      <Suspense fallback={<p role="status">{tx('Loading lesson…', 'studios')}</p>}>
        <MaximumSubarrayMockupLesson module={module} completed={completed} toggleCompleted={toggleCompleted} theme={theme} onToggleTheme={onToggleTheme} />
      </Suspense>
    )

  if (module.id === 'strassen')
    return (
      <Suspense fallback={<p role="status">{tx('Loading lesson…', 'studios')}</p>}>
        <StrassenMockupLesson module={module} completed={completed} toggleCompleted={toggleCompleted} theme={theme} onToggleTheme={onToggleTheme} />
      </Suspense>
    )

  if (module.id === 'quickselect')
    return (
      <Suspense fallback={<p role="status">{tx('Loading lesson…', 'studios')}</p>}>
        <QuickselectMockupLesson module={module} completed={completed} toggleCompleted={toggleCompleted} theme={theme} onToggleTheme={onToggleTheme} />
      </Suspense>
    )

  if (module.id === 'deterministic-selection')
    return (
      <Suspense fallback={<p role="status">{tx('Loading lesson…', 'studios')}</p>}>
        <MedianOfMediansLesson module={module} completed={completed} toggleCompleted={toggleCompleted} theme={theme} onToggleTheme={onToggleTheme} />
      </Suspense>
    )

  if (module.category === 'Backtracking')
    return (
      <Suspense fallback={<p role="status">{tx('Loading the backtracking lab…', 'studios')}</p>}>
        <BacktrackingLessonPage key={module.id} module={module} completed={completed} toggleCompleted={toggleCompleted} />
      </Suspense>
    )
  if (module.category === 'Greedy' || module.id === 'greedy-exchange')
    return (
      <Suspense fallback={<p role="status">{tx('Loading the greedy lab…', 'studios')}</p>}>
        <GreedyLessonPage key={module.id} module={module} completed={completed} toggleCompleted={toggleCompleted} />
      </Suspense>
    )
  if (module.category === 'Dynamic Programming')
    return (
      <Suspense fallback={<p role="status">{tx('Loading the dynamic programming lab…', 'studios')}</p>}>
        <DPLessonPage key={module.id} module={module} completed={completed} toggleCompleted={toggleCompleted} />
      </Suspense>
    )
  return (
    <div className={`daa-workspace${module.lessonId === 'dashboard' ? '' : ' compact-daa'}`} data-lesson-id={module.lessonId}>
      {tx(
        module.lessonId === 'dashboard' && (
          <div className="daa-top">
            <Link to="/daa/syllabus-dashboard">{tx('← DAA concepts', 'studios')}</Link>
            <Link to="/sorting/bubble-sort">{tx('Algorithm visualizer', 'studios')}</Link>
            <AccountControl />
          </div>
        ),
        'studios',
      )}
      {tx(
        module.lessonId === 'dashboard' ? (
          <Dashboard completed={completed} />
        ) : (
          <LessonView
            key={module.id}
            lesson={lessonById.get(module.lessonId ?? module.id)!}
            completed={completed}
            toggleCompleted={toggleCompleted}
            module={module}
            theme={theme}
            onToggleTheme={onToggleTheme}
          />
        ),
        'studios',
      )}
    </div>
  )
}
