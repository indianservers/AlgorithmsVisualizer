import { MobileDisclosure } from '../components/MobileDisclosure'
import { useEffect, useId, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { BookOpen, ChevronLeft, ChevronRight, GitBranch, Lightbulb, Play, RotateCcw, Target } from 'lucide-react'
import type { AlgorithmModule, LearningTab } from '../types'
import { daaLessons } from '../daa/catalog'
import { executeLesson, type DaaInput, type LearningState, type Lesson } from '../daa/types'
import searchSource from '../daa/search.ts?raw'
import traceSource from '../daa/backtrackingTrace.ts?raw'
import { CompactLessonHeader } from '../components/CompactLessonHeader'
import { AccountControl } from '../account/AccountControl'
import { LessonTabs } from '../components/LessonTabs'
import { btFieldNames, btFieldsFor, btProfiles, checkBTPrediction, nextBTPrediction, parseBTFields, validateBTStudioInput } from './backtrackingModel'
import './learning-studio.css'
import './backtracking.css'

const lessons = daaLessons.filter((l) => l.category === 'Backtracking' && l.run)
type Meta = NonNullable<LearningState['backtrack']>
type Result = { count?: number; solutions?: number[][]; subsets?: number[][]; satisfiable?: boolean; colors?: number[]; exists?: boolean; cycle?: number[] }
const palette = ['#2774c8', '#ae3c83', '#16816c', '#b27706', '#745ac2', '#c44e32']
const runLesson = (lesson: Lesson, input: DaaInput) => {
  validateBTStudioInput(input)
  return executeLesson(lesson, input, 1500)
}

function BTGraph({ input, meta, onInspect }: { input: DaaInput; meta: Meta; onInspect: (id: number) => void }) {
  const marker = useId().replace(/:/g, ''),
    n = input.vertices!,
    coloring = input.colors !== undefined,
    directed = !coloring && input.directed
  const position = (v: number) =>
    n === 1
      ? { x: 240, y: 155 }
      : { x: 240 + 165 * Math.cos((v * 2 * Math.PI) / n - Math.PI / 2), y: 155 + 108 * Math.sin((v * 2 * Math.PI) / n - Math.PI / 2) }
  const segments = meta.path.slice(1).map((v, i) => [meta.path[i], v])
  if (meta.closed) segments.push([meta.path.at(-1)!, meta.path[0]])
  return (
    <div className="bt-graph">
      <svg viewBox="0 -25 480 350" role="img" aria-label={coloring ? 'Graph coloring state' : 'Hamiltonian path state'}>
        <defs>
          <marker id={marker} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M0 0L10 5L0 10z" fill="context-stroke" />
          </marker>
        </defs>
        {input.edges!.map((e, i) => {
          const a = position(e.from),
            b = position(e.to),
            length = Math.hypot(b.x - a.x, b.y - a.y) || 1,
            dx = (b.x - a.x) / length,
            dy = (b.y - a.y) / length,
            active = !coloring && segments.some(([u, v]) => (u === e.from && v === e.to) || (!directed && u === e.to && v === e.from)),
            conflict =
              coloring &&
              meta.phase === 'reject' &&
              ((e.from === meta.depth && meta.conflicts.includes(e.to)) || (e.to === meta.depth && meta.conflicts.includes(e.from)))
          return (
            <g key={i} className={conflict ? 'bt-conflict' : active ? 'bt-route' : ''}>
              {e.from === e.to ? (
                <path
                  d={`M${a.x - 15} ${a.y - 15} C${a.x - 65} ${a.y - 70},${a.x + 65} ${a.y - 70},${a.x + 15} ${a.y - 15}`}
                  markerEnd={directed ? `url(#${marker})` : undefined}
                />
              ) : (
                <line x1={a.x + dx * 24} y1={a.y + dy * 24} x2={b.x - dx * 29} y2={b.y - dy * 29} markerEnd={directed ? `url(#${marker})` : undefined} />
              )}
            </g>
          )
        })}
        {Array.from({ length: n }, (_, v) => {
          const p = position(v),
            color = coloring ? meta.path[v] : -1,
            visited = !coloring && meta.path.includes(v)
          return (
            <g key={v} className={meta.conflicts.includes(v) ? 'bt-conflict' : ''}>
              {['choose', 'reject', 'undo'].includes(meta.phase) && v === (coloring ? meta.depth : meta.candidate) && (
                <circle
                  className="bt-candidate-node"
                  cx={p.x}
                  cy={p.y}
                  r="30"
                  style={{ stroke: meta.phase === 'reject' ? 'var(--bt-red)' : 'var(--bt-purple)' }}
                />
              )}
              <circle cx={p.x} cy={p.y} r="24" style={{ fill: color >= 0 ? palette[color] : visited ? '#087d75' : undefined }} />
              <text x={p.x} y={p.y + 5} className={color >= 0 || visited ? 'bt-white' : ''}>
                {v}
              </text>
              <text className="bt-node-label" x={p.x} y={p.y + 43}>
                {coloring
                  ? color >= 0
                    ? `color ${color}`
                    : 'unassigned'
                  : v === input.source
                    ? 'start'
                    : visited
                      ? `visit ${meta.path.indexOf(v) + 1}`
                      : 'unvisited'}
              </text>
            </g>
          )
        })}
      </svg>
      <div className="bt-vertex-buttons" aria-label="Inspect graph vertices">
        {Array.from({ length: n }, (_, v) => (
          <button key={v} onClick={() => onInspect(v)}>
            Inspect vertex {v}
          </button>
        ))}
      </div>
      <p>
        {coloring
          ? 'Color IDs are printed below vertices; conflict edges are red. Weights are irrelevant.'
          : 'Highlighted edges follow the current path. Only a closing edge turns a full path into a cycle.'}
      </p>
      <details className="bt-adjacency">
        <summary>Adjacency matrix · 1 means an edge exists</summary>
        <div className="bt-table-scroll">
          <table>
            <caption>
              {coloring
                ? 'Undirected constraints; self-loops make coloring impossible.'
                : 'Rows are from-vertices; columns are to-vertices. Edge direction is respected.'}
            </caption>
            <thead>
              <tr>
                <th scope="col">from / to</th>
                {Array.from({ length: n }, (_, v) => (
                  <th scope="col" key={v}>
                    {v}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: n }, (_, u) => (
                <tr key={u}>
                  <th scope="row">{u}</th>
                  {Array.from({ length: n }, (_, v) => {
                    const adjacent = input.edges!.some((e) => (e.from === u && e.to === v) || (!directed && e.to === u && e.from === v))
                    return (
                      <td key={v} data-edge={adjacent ? 'yes' : 'no'}>
                        {adjacent ? 1 : 0}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  )
}

function BTPicture({ lesson, input, meta, onInspect }: { lesson: Lesson; input: DaaInput; meta: Meta; onInspect: (id: number) => void }) {
  if (input.vertices) return <BTGraph input={input} meta={meta} onInspect={onInspect} />
  if (lesson.id === 'n-queens')
    return (
      <div className="bt-queens">
        <div className="bt-board-scroll">
          {input.n === 0 ? (
            <p className="bt-empty">Empty board · one empty placement</p>
          ) : (
            <div className="bt-board" style={{ gridTemplateColumns: `repeat(${input.n},minmax(34px,1fr))` }} role="group" aria-label="N-Queens board">
              {Array.from({ length: input.n! ** 2 }, (_, i) => {
                const r = Math.floor(i / input.n!),
                  c = i % input.n!,
                  queen = meta.path[r] === c,
                  candidate = meta.depth === r && meta.candidate === c && meta.phase === 'reject',
                  conflict = queen && meta.conflicts.includes(r)
                return (
                  <button
                    key={i}
                    className={`${(r + c) % 2 ? 'bt-dark-square' : ''} ${candidate ? 'bt-candidate' : ''} ${conflict ? 'bt-attacker' : ''}`}
                    aria-label={`Row ${r}, column ${c}${queen ? ', queen' : ''}${candidate ? ', rejected candidate' : ''}`}
                    onClick={() => onInspect(i)}
                  >
                    <small>
                      {r},{c}
                    </small>
                    <span>{queen ? '♛' : candidate ? '×' : ''}</span>
                  </button>
                )
              })}
            </div>
          )}
        </div>
        <p>♛ chosen queen · × rejected candidate · red queen = attacker. Coordinates start at zero. Click a square to inspect its row, column and diagonals.</p>
      </div>
    )
  const sum = meta.path.reduce((s, i) => s + input.values![i], 0)
  return (
    <div className="bt-subsets">
      <div className="bt-sum-equation">
        <span>{meta.path.length ? meta.path.map((i) => `(${input.values![i]})`).join(' + ') : '∅ empty subset'}</span>
        <strong>= {sum}</strong>
        <span>target {input.target}</span>
      </div>
      <div className="bt-value-grid">
        {input.values!.map((v, i) => (
          <button key={i} data-bt-status={meta.path.includes(i) ? 'choose' : i < meta.depth ? 'excluded' : 'pending'} onClick={() => onInspect(i)}>
            <small>INDEX {i}</small>
            <strong>{v}</strong>
            <span>{meta.path.includes(i) ? 'Included' : i < meta.depth ? 'Excluded' : 'Undecided'}</span>
          </button>
        ))}
      </div>
      <p>Indices identify distinct input items, even when values are equal. No overshoot pruning is applied: a later negative value can repair the sum.</p>
    </div>
  )
}

function SearchTree({ meta, onJump }: { meta: Meta; onJump: (id: number) => void }) {
  const groups = new Map<number, Meta['nodes']>()
  meta.nodes.forEach((n) => groups.set(n.depth, [...(groups.get(n.depth) ?? []), n]))
  const width = Math.max(640, ...[...groups.values()].map((r) => r.length * 95 + 40)),
    height = Math.max(180, (Math.max(...groups.keys()) + 1) * 88 + 25)
  const positions = new Map(
    meta.nodes.map((n) => {
      const row = groups.get(n.depth)!
      return [n.id, { x: ((row.indexOf(n) + 0.5) * width) / row.length, y: 35 + n.depth * 88 }]
    }),
  )
  return (
    <details className="bt-search-details" open>
      <summary>Search tree · {meta.totalNodes} generated nodes · recent branches + current ancestors</summary>
      <p>
        Each node is a choice, not a playback event. Click a node to replay its first visible decision. Large searches keep a readable window of recent
        branches.
      </p>
      <div className="bt-search-scroll">
        <svg style={{ minWidth: width, height }} viewBox={`0 0 ${width} ${height}`} role="group" aria-label="Backtracking search tree">
          {meta.nodes.map((n) => {
            const a = n.parent === undefined ? undefined : positions.get(n.parent),
              b = positions.get(n.id)!
            return (
              <g key={n.id}>
                {a && <line x1={a.x} y1={a.y + 15} x2={b.x} y2={b.y - 18} />}
                <g
                  role="button"
                  tabIndex={0}
                  aria-label={`Inspect search node ${n.id}: ${n.label}`}
                  data-bt-status={n.status}
                  className={n.id === meta.current ? 'bt-current-node' : ''}
                  onClick={() => onJump(n.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      onJump(n.id)
                    }
                  }}
                >
                  <title>
                    {n.label} · {n.status}
                  </title>
                  <circle cx={b.x} cy={b.y} r="19" />
                  <text x={b.x} y={b.y + 4}>
                    {n.id}
                  </text>
                  <text className="bt-tree-label" x={b.x} y={b.y + 36}>
                    {n.label}
                  </text>
                </g>
              </g>
            )
          })}
        </svg>
      </div>
    </details>
  )
}

function Solutions({ lesson, input, result, onInspect }: { lesson: Lesson; input: DaaInput; result: Result; onInspect: (id: number) => void }) {
  const [index, setIndex] = useState(0),
    all = result.solutions ?? result.subsets ?? (result.satisfiable ? [result.colors!] : result.exists ? [result.cycle!.slice(0, -1)] : []),
    selected = Math.min(index, Math.max(0, all.length - 1)),
    path = all[selected] ?? []
  const meta: Meta = {
    phase: 'solution',
    path,
    depth: input.n ?? input.values?.length ?? input.vertices ?? 0,
    current: 0,
    nodes: [],
    totalNodes: 0,
    rejected: 0,
    undos: 0,
    solutions: all.length,
    conflicts: [],
    reason: 'Computed solution',
    closed: result.exists,
  }
  return (
    <section className="bt-solutions">
      <span className="ls-eyebrow">COMPLETE COMPUTED RESULT</span>
      <h3>{all.length ? `${all.length} ${result.count !== undefined ? 'solution(s) found' : 'valid solution found'}` : 'No solution exists'}</h3>
      <p>
        {btProfiles[lesson.id].mode}.{' '}
        {result.count !== undefined
          ? 'The solver explores every branch; these counts are complete even if the teaching timeline is truncated.'
          : 'The solver stops at the first solution, or exhausts the search to prove infeasibility.'}
      </p>
      {all.length > 0 && (
        <>
          <div className="bt-gallery-controls">
            <button disabled={selected === 0} onClick={() => setIndex(selected - 1)}>
              Previous solution
            </button>
            <label>
              Solution number
              <input
                aria-label="Backtracking solution number"
                type="number"
                min={1}
                max={all.length}
                value={selected + 1}
                onChange={(e) => {
                  const n = Number(e.target.value)
                  if (Number.isInteger(n) && n >= 1 && n <= all.length) setIndex(n - 1)
                }}
              />
            </label>
            <span>of {all.length}</span>
            <button disabled={selected >= all.length - 1} onClick={() => setIndex(selected + 1)}>
              Next solution
            </button>
          </div>
          <p className="bt-solution-path">
            {lesson.id === 'sum-of-subsets'
              ? `Indices [${path.join(', ')}] · sum ${path.reduce((s, i) => s + input.values![i], 0)}`
              : lesson.id === 'n-queens'
                ? `Queen columns by row: [${path.join(', ')}]`
                : lesson.id === 'graph-coloring'
                  ? `Color IDs by vertex: [${path.join(', ')}]`
                  : `Cycle: ${result.cycle!.join(' → ')}`}
          </p>
          <BTPicture lesson={lesson} input={input} meta={meta} onInspect={onInspect} />
        </>
      )}
    </section>
  )
}

function BacktrackingLab({ lesson, tab, onTab }: { lesson: Lesson; tab: LearningTab; onTab: (tab: LearningTab) => void }) {
  const defaults = lesson.defaultInput!,
    profile = btProfiles[lesson.id]
  const [input, setInput] = useState<DaaInput>(() => structuredClone(defaults)),
    [fields, setFields] = useState(() => btFieldsFor(defaults)),
    [run, setRun] = useState(() => runLesson(lesson, defaults)),
    [cursor, setCursor] = useState(0),
    [playing, setPlaying] = useState(false),
    [speed, setSpeed] = useState(800),
    [error, setError] = useState(''),
    [notice, setNotice] = useState(''),
    [answer, setAnswer] = useState(''),
    [feedback, setFeedback] = useState(''),
    [inspect, setInspect] = useState<number>(),
    [showSolutions, setShowSolutions] = useState(false),
    [reasoning, setReasoning] = useState(false)
  const [saved, setSaved] = useState<{ input: DaaInput }[]>(() => {
    try {
      const v = JSON.parse(localStorage.getItem(`algodrishti-backtracking-${lesson.id}`) ?? '[]')
      return Array.isArray(v) ? v.filter((x) => x && typeof x === 'object' && x.input && typeof x.input === 'object').slice(0, 5) : []
    } catch {
      return []
    }
  })
  const step = run.steps[cursor],
    meta = step.state!.backtrack!,
    prediction = nextBTPrediction(run.steps, cursor),
    interactive = ['Visualization', 'Practice', 'Experiments'].includes(tab),
    changed = JSON.stringify(fields) !== JSON.stringify(btFieldsFor(input))
  const source = useMemo(() => {
    const name = { 'n-queens': 'queens', 'sum-of-subsets': 'subsetSum', 'graph-coloring': 'coloring', 'hamiltonian-cycle': 'hamiltonian' }[lesson.id]!,
      start = searchSource.indexOf(`export function ${name}(`),
      end = searchSource.indexOf('\nexport function ', start + 1)
    return searchSource.slice(start, end < 0 ? undefined : end)
  }, [lesson.id])
  function go(i: number) {
    setCursor(i)
    setPlaying(false)
    setAnswer('')
    setFeedback('')
    setInspect(undefined)
    setShowSolutions(false)
  }
  useEffect(() => {
    if (!playing || !interactive || cursor >= run.steps.length - 1) return
    const timer = window.setTimeout(() => {
      setCursor((c) => c + 1)
      setAnswer('')
      setFeedback('')
      if (cursor + 1 >= run.steps.length - 1) setPlaying(false)
    }, speed)
    return () => window.clearTimeout(timer)
  }, [playing, interactive, cursor, run.steps.length, speed])
  function compute(next: DaaInput) {
    try {
      const computed = runLesson(lesson, next)
      setInput(structuredClone(next))
      setFields(btFieldsFor(next))
      setRun(computed)
      go(0)
      setError('')
      setNotice('')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Check the input.')
      setPlaying(false)
    }
  }
  function save() {
    try {
      const next = [{ input }, ...saved].slice(0, 5)
      localStorage.setItem(`algodrishti-backtracking-${lesson.id}`, JSON.stringify(next))
      setSaved(next)
      setNotice('Example saved in this browser.')
    } catch {
      setNotice('Browser storage is unavailable. Export the trace instead.')
    }
  }
  function exportTrace() {
    const url = URL.createObjectURL(new Blob([JSON.stringify({ lesson: lesson.id, input, ...run }, null, 2)], { type: 'application/json' })),
      a = document.createElement('a')
    a.href = url
    a.download = `${lesson.id}-trace.json`
    a.click()
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
  function jumpNode(id: number) {
    const first = run.steps.findIndex((s, i) => i <= cursor && s.state?.backtrack?.current === id)
    if (first >= 0) go(first)
  }
  return (
    <section className="learning-studio bt-studio" aria-label={`${lesson.title} backtracking studio`}>
      <header className="bt-heading">
        <div>
          <span className="ls-eyebrow">
            <GitBranch size={16} /> THE BACKTRACKING SEARCH LAB
          </span>
          <h2>{lesson.title}</h2>
          <p>{lesson.summary}</p>
        </div>
        <span className="ls-chip">
          {profile.mode}
          <br />
          {lesson.time}
        </span>
      </header>
      <div className="bt-recipe">
        {[
          ['01 · STATE', profile.state],
          ['02 · CHOOSE + CHECK', profile.choice],
          ['03 · BASE + UNDO', `${profile.base} ${profile.undo}`],
        ].map(([label, text]) => (
          <article key={label}>
            <small>{label}</small>
            <p>{text}</p>
          </article>
        ))}
      </div>
      {tab === 'Learn' && (
        <>
          <div className="ls-theory-grid">
            <article>
              <BookOpen size={20} />
              <h3>Theory in plain language</h3>
              <p>
                Build a solution one choice at a time. Reject a branch only when it cannot lead to a valid answer. When a branch ends, undo its changes to
                restore the parent state.
              </p>
              <p>{lesson.correctness}</p>
            </article>
            <article>
              <Target size={20} />
              <h3>Worked example</h3>
              <ol>
                {profile.worked.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ol>
            </article>
            <article>
              <Lightbulb size={20} />
              <h3>Common mistake</h3>
              <p>{profile.pitfall}</p>
              <h4>Cost of exploring alternatives</h4>
              <p>{lesson.derivation}</p>
              <p>{lesson.space} algorithm space, excluding stored teaching snapshots.</p>
            </article>
          </div>
          <h3>Current example, solved</h3>
          <Solutions key={JSON.stringify(input)} lesson={lesson} input={input} result={run.result as Result} onInspect={setInspect} />
          <button className="ls-primary" onClick={() => onTab('Visualization')}>
            <Play size={16} />
            Explore the search
          </button>
        </>
      )}
      {interactive && (
        <>
          <section className="problem-input-panel learning-input-panel">
            <div className="bt-input-heading">
              <h3>Problem Input</h3>
              <label>
                Load a worked example
                <select
                  aria-label="Backtracking example preset"
                  value=""
                  onChange={(e) => {
                    const next = e.target.value === 'default' ? defaults : profile.examples[Number(e.target.value)]?.input
                    if (next) compute(next)
                  }}
                >
                  <option value="">Choose a preset…</option>
                  <option value="default">Default worked example</option>
                  {profile.examples.map((p, i) => (
                    <option key={p.name} value={i}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="bt-fields">
              {Object.entries(defaults).map(([key, value]) => (
                <label key={key}>
                  {btFieldNames[key]}
                  {Array.isArray(value) ? (
                    <textarea
                      rows={5}
                      aria-label={`Backtracking ${btFieldNames[key]}`}
                      value={fields[key]}
                      onChange={(e) => {
                        setFields({ ...fields, [key]: e.target.value })
                        setPlaying(false)
                      }}
                    />
                  ) : typeof value === 'boolean' ? (
                    <select
                      aria-label={`Backtracking ${btFieldNames[key]}`}
                      value={fields[key]}
                      onChange={(e) => {
                        setFields({ ...fields, [key]: e.target.value })
                        setPlaying(false)
                      }}
                    >
                      <option value="true">Directed</option>
                      <option value="false">Undirected</option>
                    </select>
                  ) : (
                    <input
                      aria-label={`Backtracking ${btFieldNames[key]}`}
                      value={fields[key]}
                      type={typeof value === 'number' ? 'number' : 'text'}
                      onChange={(e) => {
                        setFields({ ...fields, [key]: e.target.value })
                        setPlaying(false)
                      }}
                    />
                  )}
                </label>
              ))}
            </div>
            <p className="bt-help">{profile.help}</p>
            <div className="ls-operations">
              <button
                className="ls-primary"
                onClick={() => {
                  try {
                    compute(parseBTFields(fields, defaults))
                  } catch (e) {
                    setError(e instanceof Error ? e.message : 'Check the fields.')
                    setPlaying(false)
                  }
                }}
              >
                <Play size={16} />
                Run backtracking example
              </button>
              <button onClick={() => compute(structuredClone(defaults))}>
                <RotateCcw size={16} />
                Reset default
              </button>
              <button onClick={save}>Save backtracking example</button>
              <button onClick={exportTrace}>Export backtracking trace</button>
            </div>
            {changed && (
              <p role="status">Inputs edited. Run backtracking example to apply changes; the trace and solutions still reflect the last successful run.</p>
            )}
            {error && (
              <p className="ls-error" role="alert">
                {error}
              </p>
            )}
            {notice && <p role="status">{notice}</p>}
          </section>
          {run.status === 'truncated' && (
            <p className="bt-truncation" role="status">
              Teaching trace limited to {run.steps.length} events. The search and computed solutions are complete; the timeline is only a partial prefix. Use
              Show computed solutions to inspect the final result.
            </p>
          )}
          <div className="bt-legend">
            <span data-bt-status="choose">Choose</span>
            <span data-bt-status="reject">Reject</span>
            <span data-bt-status="undo">Undo</span>
            <span data-bt-status="solution">Solution</span>
            <span>Unexplored</span>
          </div>
          <div className="bt-workbench">
            <div>
              <BTPicture lesson={lesson} input={input} meta={meta} onInspect={setInspect} />
              <div className="bt-path">
                <h4>Live recursive state</h4>
                <p>{lesson.id === 'graph-coloring' ? `color = [${meta.path.map((c) => (c < 0 ? '−' : c)).join(', ')}]` : `path = [${meta.path.join(', ')}]`}</p>
                <p>
                  Depth {meta.depth} · {meta.phase}
                </p>
                <p>{profile.state}</p>
              </div>
            </div>
            <aside className="bt-decision">
              <span className="ls-eyebrow">CHOOSE · CHECK · RECURSE · UNDO</span>
              <h3>
                Step {cursor + 1} of {run.steps.length}
              </h3>
              <span className="bt-phase" data-bt-status={meta.phase}>
                {step.type === 'complete' ? 'complete' : meta.phase}
              </span>
              <p aria-live="polite">{meta.reason}</p>
              <h4>Restoration rule</h4>
              <p>{profile.undo}</p>
              <div className="bt-metrics">
                <div>
                  <strong>{meta.totalNodes}</strong>
                  <span>generated nodes</span>
                </div>
                <div>
                  <strong>{meta.rejected}</strong>
                  <span>rejections</span>
                </div>
                <div>
                  <strong>{meta.undos}</strong>
                  <span>undo events</span>
                </div>
                <div>
                  <strong>{meta.solutions}</strong>
                  <span>solutions so far</span>
                </div>
              </div>
              <small>These counters describe this timeline position, not a truncated run’s final search totals.</small>
            </aside>
          </div>
          <div className="bt-controls">
            <button aria-label="Replay backtracking trace" onClick={() => go(0)}>
              <RotateCcw size={16} />
            </button>
            <button aria-label="Previous backtracking step" disabled={cursor === 0} onClick={() => go(cursor - 1)}>
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => {
                if (cursor === run.steps.length - 1) go(0)
                setPlaying(!playing)
              }}
            >
              {playing && cursor < run.steps.length - 1 ? 'Pause' : 'Play'}
            </button>
            <button aria-label="Next backtracking step" disabled={cursor >= run.steps.length - 1} onClick={() => go(cursor + 1)}>
              <ChevronRight size={16} />
            </button>
            <input
              type="range"
              aria-label="Backtracking timeline"
              min={0}
              max={run.steps.length - 1}
              value={cursor}
              onChange={(e) => go(Number(e.target.value))}
            />
            <label>
              Speed
              <select aria-label="Backtracking playback speed" value={speed} onChange={(e) => setSpeed(Number(e.target.value))}>
                <option value={1500}>Slow</option>
                <option value={800}>Normal</option>
                <option value={200}>Fast</option>
              </select>
            </label>
            <button
              onClick={() => {
                setShowSolutions(true)
                setPlaying(false)
              }}
            >
              Show computed solutions
            </button>
            <button onClick={() => go(run.steps.length - 1)}>Last recorded step</button>
          </div>
          <section className="bt-prediction">
            <Target size={22} />
            <div>
              <span className="ls-eyebrow">PREDICT BEFORE REVEALING</span>
              <h3>{prediction?.question ?? 'All recorded decisions explored'}</h3>
              {prediction ? (
                <>
                  <p>Choices use “choose / reject”; leaf checks use “yes / no”. The next check may follow intermediate undo events.</p>
                  <p className="bt-prediction-state">
                    State just before this check: [{prediction.before.join(', ')}]. {profile.state}
                  </p>
                  <div className="ls-operations">
                    <label>
                      Your prediction
                      <input aria-label="Backtracking prediction" value={answer} onChange={(e) => setAnswer(e.target.value)} />
                    </label>
                    <button
                      onClick={() => {
                        setPlaying(false)
                        setFeedback(
                          checkBTPrediction(answer, prediction.answer)
                            ? `Correct. ${prediction.explanation}`
                            : 'Not yet. Check the constraints and the partial state, then try again.',
                        )
                      }}
                    >
                      Check prediction
                    </button>
                    <button onClick={() => go(prediction.index)}>Reveal next decision</button>
                  </div>
                  {feedback && <p role="status">{feedback}</p>}
                </>
              ) : (
                <button onClick={() => go(0)}>Try the challenge again</button>
              )}
            </div>
          </section>
          <SearchTree meta={meta} onJump={jumpNode} />
          {showSolutions && <Solutions key={JSON.stringify(input)} lesson={lesson} input={input} result={run.result as Result} onInspect={setInspect} />}
        </>
      )}
      {inspect !== undefined && ['Learn', 'Visualization', 'Practice', 'Experiments'].includes(tab) && (
        <MobileDisclosure className="ls-inspector" title="Inspect current state">
          <strong>
            {input.vertices
              ? `Vertex ${inspect}`
              : input.n !== undefined
                ? `Square (${Math.floor(inspect / Math.max(1, input.n))}, ${inspect % Math.max(1, input.n)})`
                : `Index ${inspect}: value ${input.values![inspect]}`}
          </strong>
          <p>
            {input.n !== undefined
              ? `Column ${inspect % Math.max(1, input.n)} · diagonals r−c=${Math.floor(inspect / Math.max(1, input.n)) - (inspect % Math.max(1, input.n))}, r+c=${Math.floor(inspect / Math.max(1, input.n)) + (inspect % Math.max(1, input.n))}.`
              : input.vertices
                ? `Adjacent vertices: ${[...new Set(input.edges!.flatMap((e) => (e.from === inspect ? [e.to] : (!input.directed || input.colors !== undefined) && e.to === inspect ? [e.from] : [])))].join(', ') || 'none'}. Weights do not affect feasibility.`
                : 'The solver includes or excludes this original index exactly once on each complete decision path.'}
          </p>
        </MobileDisclosure>
      )}
      {tab === 'Practice' && (
        <div className="bt-proof">
          <h3>Explain the search invariant</h3>
          <p>{lesson.exercise.question}</p>
          <button onClick={() => setReasoning(!reasoning)}>{reasoning ? 'Hide reasoning' : 'Reveal reasoning'}</button>
          {reasoning && <p>{lesson.exercise.answer}</p>}
          <h4>Proof checklist</h4>
          <ol>
            <li>Soundness: every accepted leaf satisfies every constraint.</li>
            <li>Completeness: every valid solution has a choice path that is explored.</li>
            <li>Restoration: undo restores exactly the parent state.</li>
          </ol>
        </div>
      )}
      {tab === 'Code' && (
        <div className="bt-code">
          <h3>Algorithm recipe</h3>
          <ol>
            {lesson.pseudocode.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ol>
          <h3>Actual TypeScript implementation</h3>
          <pre>
            <code>{source}</code>
          </pre>
          <details>
            <summary>Trace helper used by this implementation</summary>
            <pre>
              <code>{traceSource}</code>
            </pre>
          </details>
          <h3>Complexity and output costs</h3>
          <p>{lesson.derivation}</p>
          <p>Teaching snapshots add storage per recorded event. The timeline records at most 1,500 events; solution enumeration still runs to completion.</p>
        </div>
      )}
      {tab === 'Experiments' && (
        <div className="ls-experiments">
          <h3>Saved backtracking examples</h3>
          {!saved.length && <p>No saved examples yet. Save a successful input above, then load a preset to compare the search.</p>}
          {saved.map((s, i) => (
            <article key={i}>
              <code>{JSON.stringify(s.input)}</code>
              <button
                onClick={() => {
                  compute(s.input)
                  onTab('Visualization')
                }}
              >
                Load backtracking example {i + 1}
              </button>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}

export function BacktrackingSuiteLearning({ module, tab, onTab }: { module: AlgorithmModule; tab: LearningTab; onTab: (tab: LearningTab) => void }) {
  const [selected, setSelected] = useState('n-queens')
  return (
    <div className="bt-suite">
      <section className="learning-studio bt-suite-intro">
        <span className="ls-eyebrow">EXPLORE · REJECT · RESTORE</span>
        <h2>{module.name}</h2>
        <p>
          {module.id === 'backtracking-suite'
            ? 'Explore four complete backtracking models: N-Queens, subset sums, graph coloring, and Hamiltonian cycles. Compare enumeration with first-solution search.'
            : module.summary}
        </p>
        {module.id === 'backtracking-method' && (
          <div className="bt-method-map">
            {[
              'Define the partial state',
              'List every next choice',
              'Check safe constraints',
              'Recognize complete solutions',
              'Recurse on the smaller state',
              'Undo before sibling branches',
            ].map((label, i) => (
              <span key={label}>
                <b>{i + 1}</b>
                {label}
              </span>
            ))}
          </div>
        )}
        <label>
          Choose a backtracking concept
          <select aria-label="Backtracking suite concept" value={selected} onChange={(e) => setSelected(e.target.value)}>
            {lessons.map((l) => (
              <option key={l.id} value={l.id}>
                {l.title}
              </option>
            ))}
          </select>
        </label>
        <nav aria-label="Full backtracking lessons">
          {lessons.map((l) => (
            <Link key={l.id} to={`/backtracking/${l.id}`}>
              {l.title} →
            </Link>
          ))}
        </nav>
      </section>
      <BacktrackingLab key={selected} lesson={lessons.find((l) => l.id === selected)!} tab={tab} onTab={onTab} />
    </div>
  )
}
export function BacktrackingLessonPage({
  module,
  completed,
  toggleCompleted,
}: {
  module: AlgorithmModule
  completed: string[]
  toggleCompleted: (id: string) => void
}) {
  const [tab, setTab] = useState<LearningTab>('Visualization'),
    lesson = lessons.find((l) => l.id === module.id)
  return (
    <div className="lesson-surface bt-page daa-workspace compact-daa" data-learning-tab={tab}>
      <CompactLessonHeader
        title={module.name}
        description={module.summary}
        studied={completed.includes(module.id)}
        onStudy={() => toggleCompleted(module.id)}
        account={<AccountControl />}
      />
      <LessonTabs active={tab} onChange={setTab} />
      {lesson ? <BacktrackingLab lesson={lesson} tab={tab} onTab={setTab} /> : <BacktrackingSuiteLearning module={module} tab={tab} onTab={setTab} />}
    </div>
  )
}
