// @localized-render
import { tx, useLocaleRender } from '../i18n/render'
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
  useLocaleRender()

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
      <svg viewBox="0 -25 480 350" role="img" aria-label={tx(coloring ? 'Graph coloring state' : 'Hamiltonian path state', 'studios')}>
        <defs>
          <marker id={marker} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M0 0L10 5L0 10z" fill="context-stroke" />
          </marker>
        </defs>
        {tx(
          input.edges!.map((e, i) => {
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
                {tx(
                  e.from === e.to ? (
                    <path
                      d={`M${a.x - 15} ${a.y - 15} C${a.x - 65} ${a.y - 70},${a.x + 65} ${a.y - 70},${a.x + 15} ${a.y - 15}`}
                      markerEnd={directed ? `url(#${marker})` : undefined}
                    />
                  ) : (
                    <line x1={a.x + dx * 24} y1={a.y + dy * 24} x2={b.x - dx * 29} y2={b.y - dy * 29} markerEnd={directed ? `url(#${marker})` : undefined} />
                  ),
                  'studios',
                )}
              </g>
            )
          }),
          'studios',
        )}
        {tx(
          Array.from({ length: n }, (_, v) => {
            const p = position(v),
              color = coloring ? meta.path[v] : -1,
              visited = !coloring && meta.path.includes(v)
            return (
              <g key={v} className={meta.conflicts.includes(v) ? 'bt-conflict' : ''}>
                {tx(
                  ['choose', 'reject', 'undo'].includes(meta.phase) && v === (coloring ? meta.depth : meta.candidate) && (
                    <circle
                      className="bt-candidate-node"
                      cx={p.x}
                      cy={p.y}
                      r="30"
                      style={{ stroke: meta.phase === 'reject' ? 'var(--bt-red)' : 'var(--bt-purple)' }}
                    />
                  ),
                  'studios',
                )}
                <circle cx={p.x} cy={p.y} r="24" style={{ fill: color >= 0 ? palette[color] : visited ? '#087d75' : undefined }} />
                <text x={p.x} y={p.y + 5} className={color >= 0 || visited ? 'bt-white' : ''}>
                  {tx(v, 'studios')}
                </text>
                <text className="bt-node-label" x={p.x} y={p.y + 43}>
                  {tx(
                    coloring
                      ? color >= 0
                        ? `color ${color}`
                        : 'unassigned'
                      : v === input.source
                        ? 'start'
                        : visited
                          ? `visit ${meta.path.indexOf(v) + 1}`
                          : 'unvisited',
                    'studios',
                  )}
                </text>
              </g>
            )
          }),
          'studios',
        )}
      </svg>
      <div className="bt-vertex-buttons" aria-label={tx('Inspect graph vertices', 'studios')}>
        {tx(
          Array.from({ length: n }, (_, v) => (
            <button key={v} onClick={() => onInspect(v)}>
              {tx('Inspect vertex ', 'studios')}
              {tx(v, 'studios')}
            </button>
          )),
          'studios',
        )}
      </div>
      <p>
        {tx(
          coloring
            ? 'Color IDs are printed below vertices; conflict edges are red. Weights are irrelevant.'
            : 'Highlighted edges follow the current path. Only a closing edge turns a full path into a cycle.',
          'studios',
        )}
      </p>
      <details className="bt-adjacency">
        <summary>{tx('Adjacency matrix · 1 means an edge exists', 'studios')}</summary>
        <div className="bt-table-scroll">
          <table>
            <caption>
              {tx(
                coloring
                  ? 'Undirected constraints; self-loops make coloring impossible.'
                  : 'Rows are from-vertices; columns are to-vertices. Edge direction is respected.',
                'studios',
              )}
            </caption>
            <thead>
              <tr>
                <th scope="col">{tx('from / to', 'studios')}</th>
                {tx(
                  Array.from({ length: n }, (_, v) => (
                    <th scope="col" key={v}>
                      {tx(v, 'studios')}
                    </th>
                  )),
                  'studios',
                )}
              </tr>
            </thead>
            <tbody>
              {tx(
                Array.from({ length: n }, (_, u) => (
                  <tr key={u}>
                    <th scope="row">{tx(u, 'studios')}</th>
                    {tx(
                      Array.from({ length: n }, (_, v) => {
                        const adjacent = input.edges!.some((e) => (e.from === u && e.to === v) || (!directed && e.to === u && e.from === v))
                        return (
                          <td key={v} data-edge={adjacent ? 'yes' : 'no'}>
                            {tx(adjacent ? 1 : 0, 'studios')}
                          </td>
                        )
                      }),
                      'studios',
                    )}
                  </tr>
                )),
                'studios',
              )}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  )
}

function BTPicture({ lesson, input, meta, onInspect }: { lesson: Lesson; input: DaaInput; meta: Meta; onInspect: (id: number) => void }) {
  useLocaleRender()

  if (input.vertices) return <BTGraph input={input} meta={meta} onInspect={onInspect} />
  if (lesson.id === 'n-queens')
    return (
      <div className="bt-queens">
        <div className="bt-board-scroll">
          {tx(
            input.n === 0 ? (
              <p className="bt-empty">{tx('Empty board · one empty placement', 'studios')}</p>
            ) : (
              <div
                className="bt-board"
                style={{ gridTemplateColumns: `repeat(${input.n},minmax(34px,1fr))` }}
                role="group"
                aria-label={tx('N-Queens board', 'studios')}
              >
                {tx(
                  Array.from({ length: input.n! ** 2 }, (_, i) => {
                    const r = Math.floor(i / input.n!),
                      c = i % input.n!,
                      queen = meta.path[r] === c,
                      candidate = meta.depth === r && meta.candidate === c && meta.phase === 'reject',
                      conflict = queen && meta.conflicts.includes(r)
                    return (
                      <button
                        key={i}
                        className={`${(r + c) % 2 ? 'bt-dark-square' : ''} ${candidate ? 'bt-candidate' : ''} ${conflict ? 'bt-attacker' : ''}`}
                        aria-label={tx(`Row ${r}, column ${c}${queen ? ', queen' : ''}${candidate ? ', rejected candidate' : ''}`, 'studios')}
                        onClick={() => onInspect(i)}
                      >
                        <small>
                          {tx(r, 'studios')},{tx(c, 'studios')}
                        </small>
                        <span>{tx(queen ? '♛' : candidate ? '×' : '', 'studios')}</span>
                      </button>
                    )
                  }),
                  'studios',
                )}
              </div>
            ),
            'studios',
          )}
        </div>
        <p>
          {tx(
            '♛ chosen queen · × rejected candidate · red queen = attacker. Coordinates start at zero. Click a square to inspect its row, column and diagonals.',
            'studios',
          )}
        </p>
      </div>
    )
  const sum = meta.path.reduce((s, i) => s + input.values![i], 0)
  return (
    <div className="bt-subsets">
      <div className="bt-sum-equation">
        <span>{tx(meta.path.length ? meta.path.map((i) => `(${input.values![i]})`).join(' + ') : '∅ empty subset', 'studios')}</span>
        <strong>= {tx(sum, 'studios')}</strong>
        <span>
          {tx('target ', 'studios')}
          {tx(input.target, 'studios')}
        </span>
      </div>
      <div className="bt-value-grid">
        {tx(
          input.values!.map((v, i) => (
            <button key={i} data-bt-status={meta.path.includes(i) ? 'choose' : i < meta.depth ? 'excluded' : 'pending'} onClick={() => onInspect(i)}>
              <small>
                {tx('INDEX ', 'studios')}
                {tx(i, 'studios')}
              </small>
              <strong>{tx(v, 'studios')}</strong>
              <span>{tx(meta.path.includes(i) ? 'Included' : i < meta.depth ? 'Excluded' : 'Undecided', 'studios')}</span>
            </button>
          )),
          'studios',
        )}
      </div>
      <p>
        {tx(
          'Indices identify distinct input items, even when values are equal. No overshoot pruning is applied: a later negative value can repair the sum.',
          'studios',
        )}
      </p>
    </div>
  )
}

function SearchTree({ meta, onJump }: { meta: Meta; onJump: (id: number) => void }) {
  useLocaleRender()

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
      <summary>
        {tx('Search tree · ', 'studios')}
        {tx(meta.totalNodes, 'studios')}
        {tx(' generated nodes · recent branches + current ancestors', 'studios')}
      </summary>
      <p>
        {tx(
          'Each node is a choice, not a playback event. Click a node to replay its first visible decision. Large searches keep a readable window of recent branches.',
          'studios',
        )}
      </p>
      <div className="bt-search-scroll">
        <svg style={{ minWidth: width, height }} viewBox={`0 0 ${width} ${height}`} role="group" aria-label={tx('Backtracking search tree', 'studios')}>
          {tx(
            meta.nodes.map((n) => {
              const a = n.parent === undefined ? undefined : positions.get(n.parent),
                b = positions.get(n.id)!
              return (
                <g key={n.id}>
                  {tx(a && <line x1={a.x} y1={a.y + 15} x2={b.x} y2={b.y - 18} />, 'studios')}
                  <g
                    role="button"
                    tabIndex={0}
                    aria-label={tx(`Inspect search node ${n.id}: ${n.label}`, 'studios')}
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
                      {tx(n.label, 'studios')} · {tx(n.status, 'studios')}
                    </title>
                    <circle cx={b.x} cy={b.y} r="19" />
                    <text x={b.x} y={b.y + 4}>
                      {tx(n.id, 'studios')}
                    </text>
                    <text className="bt-tree-label" x={b.x} y={b.y + 36}>
                      {tx(n.label, 'studios')}
                    </text>
                  </g>
                </g>
              )
            }),
            'studios',
          )}
        </svg>
      </div>
    </details>
  )
}

function Solutions({ lesson, input, result, onInspect }: { lesson: Lesson; input: DaaInput; result: Result; onInspect: (id: number) => void }) {
  useLocaleRender()

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
      <span className="ls-eyebrow">{tx('COMPLETE COMPUTED RESULT', 'studios')}</span>
      <h3>{tx(all.length ? `${all.length} ${result.count !== undefined ? 'solution(s) found' : 'valid solution found'}` : 'No solution exists', 'studios')}</h3>
      <p>
        {tx(btProfiles[lesson.id].mode, 'studios')}.{tx(' ', 'studios')}
        {tx(
          result.count !== undefined
            ? 'The solver explores every branch; these counts are complete even if the teaching timeline is truncated.'
            : 'The solver stops at the first solution, or exhausts the search to prove infeasibility.',
          'studios',
        )}
      </p>
      {tx(
        all.length > 0 && (
          <>
            <div className="bt-gallery-controls">
              <button disabled={selected === 0} onClick={() => setIndex(selected - 1)}>
                {tx('Previous solution', 'studios')}
              </button>
              <label>
                {tx('Solution number', 'studios')}
                <input
                  aria-label={tx('Backtracking solution number', 'studios')}
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
              <span>
                {tx('of ', 'studios')}
                {tx(all.length, 'studios')}
              </span>
              <button disabled={selected >= all.length - 1} onClick={() => setIndex(selected + 1)}>
                {tx('Next solution', 'studios')}
              </button>
            </div>
            <p className="bt-solution-path">
              {tx(
                lesson.id === 'sum-of-subsets'
                  ? `Indices [${path.join(', ')}] · sum ${path.reduce((s, i) => s + input.values![i], 0)}`
                  : lesson.id === 'n-queens'
                    ? `Queen columns by row: [${path.join(', ')}]`
                    : lesson.id === 'graph-coloring'
                      ? `Color IDs by vertex: [${path.join(', ')}]`
                      : `Cycle: ${result.cycle!.join(' → ')}`,
                'studios',
              )}
            </p>
            <BTPicture lesson={lesson} input={input} meta={meta} onInspect={onInspect} />
          </>
        ),
        'studios',
      )}
    </section>
  )
}

function BacktrackingLab({ lesson, tab, onTab }: { lesson: Lesson; tab: LearningTab; onTab: (tab: LearningTab) => void }) {
  useLocaleRender()

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
    <section className="learning-studio bt-studio" aria-label={tx(`${lesson.title} backtracking studio`, 'studios')}>
      <header className="bt-heading">
        <div>
          <span className="ls-eyebrow">
            <GitBranch size={16} />
            {tx(' THE BACKTRACKING SEARCH LAB', 'studios')}
          </span>
          <h2>{tx(lesson.title, 'studios')}</h2>
          <p>{tx(lesson.summary, 'studios')}</p>
        </div>
        <span className="ls-chip">
          {tx(profile.mode, 'studios')}
          <br />
          {tx(lesson.time, 'studios')}
        </span>
      </header>
      <div className="bt-recipe">
        {tx(
          [
            ['01 · STATE', profile.state],
            ['02 · CHOOSE + CHECK', profile.choice],
            ['03 · BASE + UNDO', `${profile.base} ${profile.undo}`],
          ].map(([label, text]) => (
            <article key={label}>
              <small>{tx(label, 'studios')}</small>
              <p>{text}</p>
            </article>
          )),
          'studios',
        )}
      </div>
      {tx(
        tab === 'Learn' && (
          <>
            <div className="ls-theory-grid">
              <article>
                <BookOpen size={20} />
                <h3>{tx('Theory in plain language', 'studios')}</h3>
                <p>
                  {tx(
                    'Build a solution one choice at a time. Reject a branch only when it cannot lead to a valid answer. When a branch ends, undo its changes to restore the parent state.',
                    'studios',
                  )}
                </p>
                <p>{tx(lesson.correctness, 'studios')}</p>
              </article>
              <article>
                <Target size={20} />
                <h3>{tx('Worked example', 'studios')}</h3>
                <ol>
                  {tx(
                    profile.worked.map((s) => <li key={s}>{tx(s, 'studios')}</li>),
                    'studios',
                  )}
                </ol>
              </article>
              <article>
                <Lightbulb size={20} />
                <h3>{tx('Common mistake', 'studios')}</h3>
                <p>{tx(profile.pitfall, 'studios')}</p>
                <h4>{tx('Cost of exploring alternatives', 'studios')}</h4>
                <p>{tx(lesson.derivation, 'studios')}</p>
                <p>
                  {tx(lesson.space, 'studios')}
                  {tx(' algorithm space, excluding stored teaching snapshots.', 'studios')}
                </p>
              </article>
            </div>
            <h3>{tx('Current example, solved', 'studios')}</h3>
            <Solutions key={JSON.stringify(input)} lesson={lesson} input={input} result={run.result as Result} onInspect={setInspect} />
            <button className="ls-primary" onClick={() => onTab('Visualization')}>
              <Play size={16} />
              {tx('Explore the search', 'studios')}
            </button>
          </>
        ),
        'studios',
      )}
      {tx(
        interactive && (
          <>
            <section className="problem-input-panel learning-input-panel">
              <div className="bt-input-heading">
                <h3>{tx('Problem Input', 'studios')}</h3>
                <label>
                  {tx('Load a worked example', 'studios')}
                  <select
                    aria-label={tx('Backtracking example preset', 'studios')}
                    value=""
                    onChange={(e) => {
                      const next = e.target.value === 'default' ? defaults : profile.examples[Number(e.target.value)]?.input
                      if (next) compute(next)
                    }}
                  >
                    <option value="">{tx('Choose a preset…', 'studios')}</option>
                    <option value="default">{tx('Default worked example', 'studios')}</option>
                    {tx(
                      profile.examples.map((p, i) => (
                        <option key={p.name} value={i}>
                          {tx(p.name, 'studios')}
                        </option>
                      )),
                      'studios',
                    )}
                  </select>
                </label>
              </div>
              <div className="bt-fields">
                {tx(
                  Object.entries(defaults).map(([key, value]) => (
                    <label key={key}>
                      {tx(btFieldNames[key], 'studios')}
                      {tx(
                        Array.isArray(value) ? (
                          <textarea
                            rows={5}
                            aria-label={tx(`Backtracking ${btFieldNames[key]}`, 'studios')}
                            value={fields[key]}
                            onChange={(e) => {
                              setFields({ ...fields, [key]: e.target.value })
                              setPlaying(false)
                            }}
                          />
                        ) : typeof value === 'boolean' ? (
                          <select
                            aria-label={tx(`Backtracking ${btFieldNames[key]}`, 'studios')}
                            value={fields[key]}
                            onChange={(e) => {
                              setFields({ ...fields, [key]: e.target.value })
                              setPlaying(false)
                            }}
                          >
                            <option value="true">{tx('Directed', 'studios')}</option>
                            <option value="false">{tx('Undirected', 'studios')}</option>
                          </select>
                        ) : (
                          <input
                            aria-label={tx(`Backtracking ${btFieldNames[key]}`, 'studios')}
                            value={fields[key]}
                            type={typeof value === 'number' ? 'number' : 'text'}
                            onChange={(e) => {
                              setFields({ ...fields, [key]: e.target.value })
                              setPlaying(false)
                            }}
                          />
                        ),
                        'studios',
                      )}
                    </label>
                  )),
                  'studios',
                )}
              </div>
              <p className="bt-help">{tx(profile.help, 'studios')}</p>
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
                  {tx('Run backtracking example', 'studios')}
                </button>
                <button onClick={() => compute(structuredClone(defaults))}>
                  <RotateCcw size={16} />
                  {tx('Reset default', 'studios')}
                </button>
                <button onClick={save}>{tx('Save backtracking example', 'studios')}</button>
                <button onClick={exportTrace}>{tx('Export backtracking trace', 'studios')}</button>
              </div>
              {tx(
                changed && (
                  <p role="status">
                    {tx('Inputs edited. Run backtracking example to apply changes; the trace and solutions still reflect the last successful run.', 'studios')}
                  </p>
                ),
                'studios',
              )}
              {tx(
                error && (
                  <p className="ls-error" role="alert">
                    {tx(error, 'studios')}
                  </p>
                ),
                'studios',
              )}
              {tx(notice && <p role="status">{tx(notice, 'studios')}</p>, 'studios')}
            </section>
            {tx(
              run.status === 'truncated' && (
                <p className="bt-truncation" role="status">
                  {tx('Teaching trace limited to ', 'studios')}
                  {tx(run.steps.length, 'studios')}
                  {tx(
                    ' events. The search and computed solutions are complete; the timeline is only a partial prefix. Use Show computed solutions to inspect the final result.',
                    'studios',
                  )}
                </p>
              ),
              'studios',
            )}
            <div className="bt-legend">
              <span data-bt-status="choose">{tx('Choose', 'studios')}</span>
              <span data-bt-status="reject">{tx('Reject', 'studios')}</span>
              <span data-bt-status="undo">{tx('Undo', 'studios')}</span>
              <span data-bt-status="solution">{tx('Solution', 'studios')}</span>
              <span>{tx('Unexplored', 'studios')}</span>
            </div>
            <div className="bt-workbench">
              <div>
                <BTPicture lesson={lesson} input={input} meta={meta} onInspect={setInspect} />
                <div className="bt-path">
                  <h4>{tx('Live recursive state', 'studios')}</h4>
                  <p>
                    {tx(
                      lesson.id === 'graph-coloring' ? `color = [${meta.path.map((c) => (c < 0 ? '−' : c)).join(', ')}]` : `path = [${meta.path.join(', ')}]`,
                      'studios',
                    )}
                  </p>
                  <p>
                    {tx('Depth ', 'studios')}
                    {tx(meta.depth, 'studios')} · {tx(meta.phase, 'studios')}
                  </p>
                  <p>{tx(profile.state, 'studios')}</p>
                </div>
              </div>
              <aside className="bt-decision">
                <span className="ls-eyebrow">{tx('CHOOSE · CHECK · RECURSE · UNDO', 'studios')}</span>
                <h3>
                  {tx('Step ', 'studios')}
                  {tx(cursor + 1, 'studios')}
                  {tx(' of ', 'studios')}
                  {tx(run.steps.length, 'studios')}
                </h3>
                <span className="bt-phase" data-bt-status={meta.phase}>
                  {tx(step.type === 'complete' ? 'complete' : meta.phase, 'studios')}
                </span>
                <p aria-live="polite">{tx(meta.reason, 'studios')}</p>
                <h4>{tx('Restoration rule', 'studios')}</h4>
                <p>{tx(profile.undo, 'studios')}</p>
                <div className="bt-metrics">
                  <div>
                    <strong>{tx(meta.totalNodes, 'studios')}</strong>
                    <span>{tx('generated nodes', 'studios')}</span>
                  </div>
                  <div>
                    <strong>{tx(meta.rejected, 'studios')}</strong>
                    <span>{tx('rejections', 'studios')}</span>
                  </div>
                  <div>
                    <strong>{tx(meta.undos, 'studios')}</strong>
                    <span>{tx('undo events', 'studios')}</span>
                  </div>
                  <div>
                    <strong>{tx(meta.solutions, 'studios')}</strong>
                    <span>{tx('solutions so far', 'studios')}</span>
                  </div>
                </div>
                <small>{tx('These counters describe this timeline position, not a truncated run’s final search totals.', 'studios')}</small>
              </aside>
            </div>
            <div className="bt-controls">
              <button aria-label={tx('Replay backtracking trace', 'studios')} onClick={() => go(0)}>
                <RotateCcw size={16} />
              </button>
              <button aria-label={tx('Previous backtracking step', 'studios')} disabled={cursor === 0} onClick={() => go(cursor - 1)}>
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() => {
                  if (cursor === run.steps.length - 1) go(0)
                  setPlaying(!playing)
                }}
              >
                {tx(playing && cursor < run.steps.length - 1 ? 'Pause' : 'Play', 'studios')}
              </button>
              <button aria-label={tx('Next backtracking step', 'studios')} disabled={cursor >= run.steps.length - 1} onClick={() => go(cursor + 1)}>
                <ChevronRight size={16} />
              </button>
              <input
                type="range"
                aria-label={tx('Backtracking timeline', 'studios')}
                min={0}
                max={run.steps.length - 1}
                value={cursor}
                onChange={(e) => go(Number(e.target.value))}
              />
              <label>
                {tx('Speed', 'studios')}
                <select aria-label={tx('Backtracking playback speed', 'studios')} value={speed} onChange={(e) => setSpeed(Number(e.target.value))}>
                  <option value={1500}>{tx('Slow', 'studios')}</option>
                  <option value={800}>{tx('Normal', 'studios')}</option>
                  <option value={200}>{tx('Fast', 'studios')}</option>
                </select>
              </label>
              <button
                onClick={() => {
                  setShowSolutions(true)
                  setPlaying(false)
                }}
              >
                {tx('Show computed solutions', 'studios')}
              </button>
              <button onClick={() => go(run.steps.length - 1)}>{tx('Last recorded step', 'studios')}</button>
            </div>
            <section className="bt-prediction">
              <Target size={22} />
              <div>
                <span className="ls-eyebrow">{tx('PREDICT BEFORE REVEALING', 'studios')}</span>
                <h3>{tx(prediction?.question ?? 'All recorded decisions explored', 'studios')}</h3>
                {tx(
                  prediction ? (
                    <>
                      <p>{tx('Choices use “choose / reject”; leaf checks use “yes / no”. The next check may follow intermediate undo events.', 'studios')}</p>
                      <p className="bt-prediction-state">
                        {tx('State just before this check: [', 'studios')}
                        {tx(prediction.before.join(', '), 'studios')}]. {tx(profile.state, 'studios')}
                      </p>
                      <div className="ls-operations">
                        <label>
                          {tx('Your prediction', 'studios')}
                          <input aria-label={tx('Backtracking prediction', 'studios')} value={answer} onChange={(e) => setAnswer(e.target.value)} />
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
                          {tx('Check prediction', 'studios')}
                        </button>
                        <button onClick={() => go(prediction.index)}>{tx('Reveal next decision', 'studios')}</button>
                      </div>
                      {tx(feedback && <p role="status">{tx(feedback, 'studios')}</p>, 'studios')}
                    </>
                  ) : (
                    <button onClick={() => go(0)}>{tx('Try the challenge again', 'studios')}</button>
                  ),
                  'studios',
                )}
              </div>
            </section>
            <SearchTree meta={meta} onJump={jumpNode} />
            {tx(
              showSolutions && <Solutions key={JSON.stringify(input)} lesson={lesson} input={input} result={run.result as Result} onInspect={setInspect} />,
              'studios',
            )}
          </>
        ),
        'studios',
      )}
      {tx(
        inspect !== undefined && ['Learn', 'Visualization', 'Practice', 'Experiments'].includes(tab) && (
          <MobileDisclosure className="ls-inspector" title={tx('Inspect current state', 'studios')}>
            <strong>
              {tx(
                input.vertices
                  ? `Vertex ${inspect}`
                  : input.n !== undefined
                    ? `Square (${Math.floor(inspect / Math.max(1, input.n))}, ${inspect % Math.max(1, input.n)})`
                    : `Index ${inspect}: value ${input.values![inspect]}`,
                'studios',
              )}
            </strong>
            <p>
              {tx(
                input.n !== undefined
                  ? `Column ${inspect % Math.max(1, input.n)} · diagonals r−c=${Math.floor(inspect / Math.max(1, input.n)) - (inspect % Math.max(1, input.n))}, r+c=${Math.floor(inspect / Math.max(1, input.n)) + (inspect % Math.max(1, input.n))}.`
                  : input.vertices
                    ? `Adjacent vertices: ${[...new Set(input.edges!.flatMap((e) => (e.from === inspect ? [e.to] : (!input.directed || input.colors !== undefined) && e.to === inspect ? [e.from] : [])))].join(', ') || 'none'}. Weights do not affect feasibility.`
                    : 'The solver includes or excludes this original index exactly once on each complete decision path.',
                'studios',
              )}
            </p>
          </MobileDisclosure>
        ),
        'studios',
      )}
      {tx(
        tab === 'Practice' && (
          <div className="bt-proof">
            <h3>{tx('Explain the search invariant', 'studios')}</h3>
            <p>{tx(lesson.exercise.question, 'studios')}</p>
            <button onClick={() => setReasoning(!reasoning)}>{tx(reasoning ? 'Hide reasoning' : 'Reveal reasoning', 'studios')}</button>
            {tx(reasoning && <p>{tx(lesson.exercise.answer, 'studios')}</p>, 'studios')}
            <h4>{tx('Proof checklist', 'studios')}</h4>
            <ol>
              <li>{tx('Soundness: every accepted leaf satisfies every constraint.', 'studios')}</li>
              <li>{tx('Completeness: every valid solution has a choice path that is explored.', 'studios')}</li>
              <li>{tx('Restoration: undo restores exactly the parent state.', 'studios')}</li>
            </ol>
          </div>
        ),
        'studios',
      )}
      {tx(
        tab === 'Code' && (
          <div className="bt-code">
            <h3>{tx('Algorithm recipe', 'studios')}</h3>
            <ol>
              {tx(
                lesson.pseudocode.map((line) => <li key={line}>{tx(line, 'studios')}</li>),
                'studios',
              )}
            </ol>
            <h3>{tx('Actual TypeScript implementation', 'studios')}</h3>
            <pre>
              <code>{source}</code>
            </pre>
            <details>
              <summary>{tx('Trace helper used by this implementation', 'studios')}</summary>
              <pre>
                <code>{traceSource}</code>
              </pre>
            </details>
            <h3>{tx('Complexity and output costs', 'studios')}</h3>
            <p>{tx(lesson.derivation, 'studios')}</p>
            <p>
              {tx(
                'Teaching snapshots add storage per recorded event. The timeline records at most 1,500 events; solution enumeration still runs to completion.',
                'studios',
              )}
            </p>
          </div>
        ),
        'studios',
      )}
      {tx(
        tab === 'Experiments' && (
          <div className="ls-experiments">
            <h3>{tx('Saved backtracking examples', 'studios')}</h3>
            {tx(
              !saved.length && <p>{tx('No saved examples yet. Save a successful input above, then load a preset to compare the search.', 'studios')}</p>,
              'studios',
            )}
            {tx(
              saved.map((s, i) => (
                <article key={i}>
                  <code>{JSON.stringify(s.input)}</code>
                  <button
                    onClick={() => {
                      compute(s.input)
                      onTab('Visualization')
                    }}
                  >
                    {tx('Load backtracking example ', 'studios')}
                    {tx(i + 1, 'studios')}
                  </button>
                </article>
              )),
              'studios',
            )}
          </div>
        ),
        'studios',
      )}
    </section>
  )
}

export function BacktrackingSuiteLearning({ module, tab, onTab }: { module: AlgorithmModule; tab: LearningTab; onTab: (tab: LearningTab) => void }) {
  useLocaleRender()

  const [selected, setSelected] = useState('n-queens')
  return (
    <div className="bt-suite">
      <section className="learning-studio bt-suite-intro">
        <span className="ls-eyebrow">{tx('EXPLORE · REJECT · RESTORE', 'studios')}</span>
        <h2>{tx(module.name, 'studios')}</h2>
        <p>
          {tx(
            module.id === 'backtracking-suite'
              ? 'Explore four complete backtracking models: N-Queens, subset sums, graph coloring, and Hamiltonian cycles. Compare enumeration with first-solution search.'
              : module.summary,
            'studios',
          )}
        </p>
        {tx(
          module.id === 'backtracking-method' && (
            <div className="bt-method-map">
              {tx(
                [
                  'Define the partial state',
                  'List every next choice',
                  'Check safe constraints',
                  'Recognize complete solutions',
                  'Recurse on the smaller state',
                  'Undo before sibling branches',
                ].map((label, i) => (
                  <span key={label}>
                    <b>{tx(i + 1, 'studios')}</b>
                    {tx(label, 'studios')}
                  </span>
                )),
                'studios',
              )}
            </div>
          ),
          'studios',
        )}
        <label>
          {tx('Choose a backtracking concept', 'studios')}
          <select aria-label={tx('Backtracking suite concept', 'studios')} value={selected} onChange={(e) => setSelected(e.target.value)}>
            {tx(
              lessons.map((l) => (
                <option key={l.id} value={l.id}>
                  {tx(l.title, 'studios')}
                </option>
              )),
              'studios',
            )}
          </select>
        </label>
        <nav aria-label={tx('Full backtracking lessons', 'studios')}>
          {tx(
            lessons.map((l) => (
              <Link key={l.id} to={`/backtracking/${l.id}`}>
                {tx(l.title, 'studios')} →
              </Link>
            )),
            'studios',
          )}
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
  useLocaleRender()

  const [tab, setTab] = useState<LearningTab>('Visualization'),
    lesson = lessons.find((l) => l.id === module.id)
  return (
    <div className="lesson-surface bt-page daa-workspace compact-daa" data-learning-tab={tab}>
      <CompactLessonHeader
        title={tx(module.name, 'studios')}
        description={module.summary}
        studied={completed.includes(module.id)}
        onStudy={() => toggleCompleted(module.id)}
        account={<AccountControl />}
      />
      <LessonTabs active={tab} onChange={setTab} />
      {tx(
        lesson ? <BacktrackingLab lesson={lesson} tab={tab} onTab={setTab} /> : <BacktrackingSuiteLearning module={module} tab={tab} onTab={setTab} />,
        'studios',
      )}
    </div>
  )
}
