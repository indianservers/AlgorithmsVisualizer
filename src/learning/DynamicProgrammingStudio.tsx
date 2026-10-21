import { MobileDisclosure } from '../components/MobileDisclosure'
import { useEffect, useId, useMemo, useState } from 'react'
import { BookOpen, Braces, Check, ChevronLeft, ChevronRight, Grid2X2, Lightbulb, Play, RotateCcw, Target } from 'lucide-react'
import type { AlgorithmModule, AlgorithmStep, LearningTab } from '../types'
import { daaLessons } from '../daa/catalog'
import { executeLesson, type DaaInput, type Lesson } from '../daa/types'
import { cellKey, type Coordinate } from '../daa/dpTrace'
import dynamicSource from '../daa/dynamic.ts?raw'
import dpTraceSource from '../daa/dpTrace.ts?raw'
import graphSource from '../daa/graphs.ts?raw'
import extraSource from './dpExtras.ts?raw'
import { dpExtraLessons } from './dpExtras'
import { dpProfiles } from './dpProfiles'
import { fieldNames, fieldsFor, formatCell, parseDPFields, validateDPStudioInput, nextDPPrediction } from './dpModel'
import { CompactLessonHeader } from '../components/CompactLessonHeader'
import { LessonTabs } from '../components/LessonTabs'
import { AccountControl } from '../account/AccountControl'
import './learning-studio.css'
import './dynamic-programming.css'

const allDPLessons = [...daaLessons.filter((l) => l.category === 'Dynamic Programming' && l.run), ...dpExtraLessons]
const download = (filename: string, data: unknown) => {
  const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }))
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

function ProblemPicture({ lesson, input, step }: { lesson: Lesson; input: DaaInput; step?: AlgorithmStep }) {
  const marker = useId().replace(/:/g, ''),
    graph = step?.state?.graph
  if (input.vertices) {
    const n = input.vertices,
      position = (v: number) => ({ x: 230 + 160 * Math.cos((v * 2 * Math.PI) / n - Math.PI / 2), y: 145 + 100 * Math.sin((v * 2 * Math.PI) / n - Math.PI / 2) })
    return (
      <div className="dp-problem-graph">
        <svg viewBox="0 0 460 290" role="img" aria-label="DP graph and active transition">
          <defs>
            <marker id={marker} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M0 0 L10 5 L0 10 z" fill="currentColor" />
            </marker>
          </defs>
          {input.edges?.map((e, i) => {
            const a = position(e.from),
              b = position(e.to),
              length = Math.hypot(b.x - a.x, b.y - a.y) || 1,
              dx = (b.x - a.x) / length,
              dy = (b.y - a.y) / length,
              active = graph?.selected?.some(([u, v]) => (u === e.from && v === e.to) || (!input.directed && v === e.from && u === e.to))
            return (
              <g key={i} className={active ? 'active' : ''}>
                <line x1={a.x + dx * 21} y1={a.y + dy * 21} x2={b.x - dx * 25} y2={b.y - dy * 25} markerEnd={input.directed ? `url(#${marker})` : undefined} />
                <text className="dp-edge-weight" x={(a.x + b.x) / 2} y={(a.y + b.y) / 2 - 7}>
                  {e.weight}
                </text>
              </g>
            )
          })}
          {Array.from({ length: n }, (_, v) => {
            const p = position(v)
            return (
              <g key={v}>
                <circle cx={p.x} cy={p.y} r="21" />
                <text x={p.x} y={p.y + 5}>
                  {v}
                </text>
              </g>
            )
          })}
        </svg>
        <p>
          {lesson.id === 'held-karp-tsp'
            ? 'A row identifies a visited set; a column identifies its last vertex.'
            : 'Parent pointers record which incoming edge improved each distance.'}
        </p>
      </div>
    )
  }
  if (input.left !== undefined)
    return (
      <div className="dp-string-pair">
        {[
          ['Source', input.left],
          ['Target', input.right ?? ''],
        ].map(([label, value]) => (
          <div key={label}>
            <strong>{label}</strong>
            {value ? (
              value.split('').map((ch, i) => (
                <span key={i}>
                  <small>{i + 1}</small>
                  {ch === ' ' ? '␠' : ch}
                </span>
              ))
            ) : (
              <span>∅ empty string</span>
            )}
          </div>
        ))}
      </div>
    )
  if (input.weights)
    return (
      <div className="dp-items">
        {input.weights.map((w, i) => (
          <div key={i}>
            <small>Item {i}</small>
            <strong>profit {input.profits![i]}</strong>
            <span>weight {w}</span>
          </div>
        ))}
        <div>
          <small>Budget</small>
          <strong>{input.capacity}</strong>
          <span>capacity</span>
        </div>
      </div>
    )
  if (input.dimensions)
    return (
      <div className="dp-items">
        {input.dimensions.slice(1).map((p, i) => (
          <div key={i}>
            <strong>A{i + 1}</strong>
            <span>
              {input.dimensions![i]} × {p}
            </span>
          </div>
        ))}
      </div>
    )
  if (input.frequencies)
    return (
      <div className="dp-items">
        {input.frequencies.map((f, i) => (
          <div key={i}>
            <small>Ordered key {i}</small>
            <strong>{f}</strong>
            <span>frequency</span>
          </div>
        ))}
      </div>
    )
  if (input.a)
    return (
      <div className="dp-original-matrix">
        <table>
          <caption>Original values · zero-based row and column coordinates</caption>
          <tbody>
            {input.a.map((row, i) => (
              <tr key={i}>
                {row.map((v, j) => (
                  <td
                    key={j}
                    className={input.range && i >= input.range[0] && i <= input.range[2] && j >= input.range[1] && j <= input.range[3] ? 'queried' : ''}
                  >
                    {v}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  if (input.values)
    return (
      <div className="dp-items">
        {input.values.map((v, i) => (
          <div key={i}>
            <small>{lesson.id === 'coin-change' ? 'Coin' : `index ${i}`}</small>
            <strong>{v}</strong>
          </div>
        ))}
        <div>
          <small>{input.amount !== undefined ? 'Amount' : 'Inclusive range'}</small>
          <strong>{input.amount ?? input.range?.join('…')}</strong>
          {input.delta !== undefined && <span>add {input.delta}</span>}
        </div>
      </div>
    )
  if ((input.n ?? 0) < 2)
    return (
      <div className="dp-fib-dependencies">
        <strong>
          F({input.n}) = {input.n}
        </strong>
        <p>This is a base case; no smaller-state expansion is needed.</p>
      </div>
    )
  return (
    <div className="dp-fib-dependencies">
      <strong>F({input.n})</strong>
      <span>←</span>
      <div>
        <span>F({Math.max(0, (input.n ?? 0) - 1)})</span>
        <span>+ F({Math.max(0, (input.n ?? 0) - 2)})</span>
      </div>
      <p>{(input.n ?? 0) < 2 ? 'This input is already a base case.' : 'Each dependency reuses a smaller solved state.'}</p>
    </div>
  )
}
function OptimalTree({ node, frequencies }: { node: unknown; frequencies: number[] }) {
  if (!node) return <span className="dp-nil">gap</span>
  const n = node as { key: number; left: unknown; right: unknown }
  return (
    <div className="dp-bst-node">
      <strong>
        key {n.key}
        <small>frequency {frequencies[n.key]}</small>
      </strong>
      <div>
        <OptimalTree node={n.left} frequencies={frequencies} />
        <OptimalTree node={n.right} frequencies={frequencies} />
      </div>
    </div>
  )
}
function Solution({ lesson, input, result }: { lesson: Lesson; input: DaaInput; result: unknown }) {
  const r = (result ?? {}) as Record<string, unknown>
  const major = ['value', 'minimum', 'profit', 'length', 'distance', 'cost', 'sum'].find((key) => r[key] !== undefined)
  return (
    <div className="dp-solution" aria-label="Computed DP solution">
      <div>
        <span>{major ?? 'Computed answer'}</span>
        <strong>{major ? (r[major] === null ? 'No feasible solution' : String(r[major])) : 'Complete'}</strong>
      </div>
      {r.sequence !== undefined && (
        <p>
          Reconstructed subsequence: <strong>{String(r.sequence) || '∅'}</strong>
        </p>
      )}
      {Array.isArray(r.coins) && <p>Coins: {r.coins.length ? r.coins.join(' + ') : r.reachable ? 'none needed' : 'unreachable'}</p>}
      {Array.isArray(r.items) && (
        <p>
          Chosen items: {r.items.length ? r.items.join(', ') : 'none'} · total weight {String(r.weight)}
        </p>
      )}
      {Array.isArray(r.operations) && (
        <ol>
          {r.operations.map((v, i) => (
            <li key={i}>{String(v)}</li>
          ))}
        </ol>
      )}
      {r.parenthesization !== undefined && <p className="dp-parentheses">{String(r.parenthesization)}</p>}
      {Array.isArray(r.tour) && <p>Tour: {r.tour.length ? r.tour.join(' → ') : 'No complete tour exists'}</p>}
      {Array.isArray(r.values) && <p>Updated values: {r.values.join(', ')}</p>}
      {Array.isArray(r.distances) && (
        <>
          <p>Distances: {r.distances.join(', ')}</p>
          <p>Parents: {(r.parent as number[])?.map((p, v) => `${v}←${p < 0 ? 'none' : p}`).join(' · ')}</p>
        </>
      )}
      {lesson.id === 'optimal-bst' && r.tree !== undefined && (
        <div className="dp-tree-scroll">
          <OptimalTree node={r.tree} frequencies={input.frequencies!} />
        </div>
      )}
    </div>
  )
}

export function DPStudio({ lesson, tab, onTab }: { lesson: Lesson; tab: LearningTab; onTab?: (tab: LearningTab) => void }) {
  const profile = dpProfiles[lesson.id],
    defaultInput = lesson.defaultInput!
  const [fields, setFields] = useState(() => fieldsFor(defaultInput)),
    [input, setInput] = useState(() => structuredClone(defaultInput)),
    [run, setRun] = useState(() => executeLesson(lesson, defaultInput)),
    [cursor, setCursor] = useState(0),
    [playing, setPlaying] = useState(false),
    [delay, setDelay] = useState(800),
    [error, setError] = useState(''),
    [guess, setGuess] = useState(''),
    [feedback, setFeedback] = useState(''),
    [selection, setSelection] = useState<Coordinate>(),
    [message, setMessage] = useState('')
  const [saved, setSaved] = useState<{ input: DaaInput; createdAt: string }[]>(() => {
    try {
      const raw: unknown = JSON.parse(localStorage.getItem(`algodrishti-dp-${lesson.id}`) ?? '[]')
      return Array.isArray(raw) ? raw.filter((x) => x && x.input && typeof x.input === 'object' && typeof x.createdAt === 'string').slice(0, 5) : []
    } catch {
      return []
    }
  })
  const step = run.steps[cursor],
    last = run.steps.length - 1,
    state = step.state!,
    meta = state.dp!,
    filled = new Set(meta.filled),
    focus = meta.focus,
    dependencyKeys = new Set(meta.dependencies.map((d) => cellKey(d.cell))),
    prediction = nextDPPrediction(run.steps, cursor),
    interactive = tab === 'Visualization' || tab === 'Practice'
  const shown = tab === 'Learn' ? run.steps.at(-1)!.state! : state,
    shownMeta = shown.dp!,
    shownFilled = new Set(shownMeta.filled),
    table = shown.table ?? []
  const rows = table.map((_, r) => r).filter((r) => lesson.id !== 'held-karp-tsp' || r === 0 || table[r].some((_, c) => shownFilled.has(cellKey([r, c]))))
  const changed = JSON.stringify(fields) !== JSON.stringify(fieldsFor(input))
  const worked = useMemo(() => {
    const sample = executeLesson(lesson, defaultInput)
    return sample.steps.filter((s) => s.state?.dp?.phase === 'choose').slice(0, 3)
  }, [lesson, defaultInput])
  useEffect(() => {
    if (!playing || !interactive || cursor >= last) return
    const timer = window.setTimeout(() => {
      setCursor((i) => i + 1)
      setGuess('')
      setFeedback('')
      setSelection(undefined)
    }, delay)
    return () => window.clearTimeout(timer)
  }, [playing, interactive, cursor, last, delay])
  function go(index: number) {
    setCursor(index)
    setPlaying(false)
    setGuess('')
    setFeedback('')
    setSelection(undefined)
  }
  function compute(next: DaaInput) {
    try {
      validateDPStudioInput(next)
      const computed = executeLesson(lesson, next)
      setInput(structuredClone(next))
      setFields(fieldsFor(next))
      setRun(computed)
      go(0)
      setError('')
      setMessage('')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Check the input fields.')
      setPlaying(false)
    }
  }
  function save() {
    try {
      const next = [{ input, createdAt: new Date().toISOString() }, ...saved].slice(0, 5)
      localStorage.setItem(`algodrishti-dp-${lesson.id}`, JSON.stringify(next))
      setSaved(next)
      setMessage('Example saved in this browser.')
    } catch {
      setMessage('Local storage is unavailable. Export the computed trace instead.')
    }
  }
  const renderTable = () => (
    <div className="dp-table-scroll">
      <table className="dp-table">
        <caption>{profile.state} Blank cells have not been computed. Click a known state to inspect it.</caption>
        <thead>
          <tr>
            <th scope="col">State</th>
            {shown.columnLabels?.map((label, c) => (
              <th scope="col" key={c}>
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r}>
              <th scope="row">{shown.rowLabels?.[r] ?? r}</th>
              {table[r].map((value, c) => {
                const key = cellKey([r, c]),
                  known = shownFilled.has(key),
                  active = tab !== 'Learn' && focus && cellKey(focus) === key,
                  dependency = tab !== 'Learn' && dependencyKeys.has(key),
                  path = shownMeta.path?.some((p) => cellKey(p) === key)
                return (
                  <td key={c} data-cell={key} data-status={active ? 'active' : dependency ? 'dependency' : path ? 'path' : known ? 'known' : 'pending'}>
                    <button
                      aria-label={`Inspect state ${r},${c}${known ? `: ${formatCell(value)}` : ': not computed'}`}
                      disabled={!known}
                      onClick={() => setSelection([r, c])}
                    >
                      {known ? formatCell(value) : '·'}
                    </button>
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
  return (
    <section className="learning-studio dp-studio" aria-label={`${lesson.title} dynamic programming studio`}>
      <header className="dp-heading">
        <div>
          <span className="ls-eyebrow">
            <Grid2X2 size={16} /> DYNAMIC PROGRAMMING LAB
          </span>
          <h2>{lesson.title}</h2>
          <p>{lesson.summary}</p>
        </div>
        <span className="ls-chip">
          {lesson.time} time · {lesson.space} space
        </span>
      </header>
      <div className="dp-recipe">
        <article>
          <span>01 · STATE</span>
          <p>{profile.state}</p>
        </article>
        <article>
          <span>02 · RECURRENCE</span>
          <code>{profile.recurrence}</code>
        </article>
        <article>
          <span>03 · BASE + ORDER</span>
          <p>
            {profile.base} {profile.order}
          </p>
        </article>
      </div>
      {tab === 'Learn' && (
        <>
          <div className="ls-theory-grid">
            <article>
              <BookOpen size={20} />
              <h3>Theory in plain language</h3>
              <p>{profile.insight}</p>
              <p>{lesson.correctness}</p>
            </article>
            <article>
              <Target size={20} />
              <h3>Worked example</h3>
              <p>{lesson.example}</p>
              <ol>
                {worked.map((s, i) => (
                  <li key={i}>{s.state!.dp!.expression}</li>
                ))}
              </ol>
            </article>
            <article>
              <Lightbulb size={20} />
              <h3>Common mistake</h3>
              <p>{profile.pitfall}</p>
              <h3>Space and time tradeoff</h3>
              <p>{profile.optimization}</p>
            </article>
          </div>
          <h3>Current example, solved</h3>
          <p>The diagram, table and answer below come from the most recent successful run. Use Visualization to edit these inputs.</p>
          <ProblemPicture lesson={lesson} input={input} step={run.steps.at(-1)} />
          {renderTable()}
          {selection && (
            <MobileDisclosure className="ls-inspector" title="Inspect current state">
              <strong>
                State [{selection.join(',')}] = {formatCell(shown.table?.[selection[0]]?.[selection[1]])}
              </strong>
              <span>{profile.state}</span>
            </MobileDisclosure>
          )}
          <Solution lesson={lesson} input={input} result={run.result} />
          <button className="ls-primary" onClick={() => onTab?.('Visualization')}>
            <Play size={16} />
            Explore this example
          </button>
        </>
      )}
      {interactive && (
        <>
          <section className="problem-input-panel learning-input-panel">
            <div className="dp-input-heading">
              <h3>Problem Input</h3>
              <label>
                Load a worked example
                <select
                  aria-label="DP example preset"
                  value=""
                  onChange={(e) => {
                    const next = e.target.value === 'default' ? defaultInput : profile.examples[Number(e.target.value)]?.input
                    if (next) compute(next)
                  }}
                >
                  <option value="">Choose a preset…</option>
                  <option value="default">Default worked example</option>
                  {profile.examples.map((example, i) => (
                    <option key={example.name} value={i}>
                      {example.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="dp-fields">
              {Object.entries(defaultInput).map(([key, original]) => (
                <label key={key}>
                  {fieldNames[key] ?? key}
                  {key === 'directed' ? (
                    <select
                      aria-label={`DP ${fieldNames[key]}`}
                      value={fields[key]}
                      onChange={(e) => {
                        setFields({ ...fields, [key]: e.target.value })
                        setPlaying(false)
                      }}
                    >
                      <option value="true">Directed</option>
                      <option value="false">Undirected</option>
                    </select>
                  ) : Array.isArray(original) ? (
                    <textarea
                      aria-label={`DP ${fieldNames[key]}`}
                      rows={4}
                      value={fields[key]}
                      onChange={(e) => {
                        setFields({ ...fields, [key]: e.target.value })
                        setPlaying(false)
                      }}
                    />
                  ) : (
                    <input
                      aria-label={`DP ${fieldNames[key] ?? key}`}
                      type={typeof original === 'number' ? 'number' : 'text'}
                      value={fields[key]}
                      onChange={(e) => {
                        setFields({ ...fields, [key]: e.target.value })
                        setPlaying(false)
                      }}
                    />
                  )}
                </label>
              ))}
            </div>
            <div className="ls-operations dp-run-actions">
              <button
                className="ls-primary"
                onClick={() => {
                  try {
                    compute(parseDPFields(fields, defaultInput))
                  } catch (e) {
                    setError(e instanceof Error ? e.message : 'Check the fields.')
                  }
                }}
              >
                <Play size={16} />
                Run DP example
              </button>
              <button onClick={() => compute(structuredClone(defaultInput))}>
                <RotateCcw size={16} />
                Reset default
              </button>
              <button onClick={save}>Save DP example</button>
              {changed && <span role="status">Inputs edited. The table still describes the last successful run; Run DP example to apply changes.</span>}
            </div>
            {error && (
              <p className="ls-error" role="alert">
                {error}
              </p>
            )}
            {message && <p role="status">{message}</p>}
          </section>
          {run.status === 'truncated' && (
            <p className="ls-error" role="status">
              {run.message}
            </p>
          )}
          <ProblemPicture lesson={lesson} input={input} step={step} />
          <div className="dp-workbench">
            <div className="dp-table-panel">
              <div className="dp-panel-title">
                <h3>State table</h3>
                <span>
                  {filled.size} known states · {meta.phase}
                </span>
              </div>
              <div className="dp-legend">
                <span className="active">Current</span>
                <span className="dependency">Dependency</span>
                <span className="path">Reconstruction</span>
                <span>· not computed</span>
              </div>
              {renderTable()}
              {selection && (
                <MobileDisclosure className="ls-inspector" title="Inspect current state">
                  <strong>
                    State [{selection.join(',')}] = {formatCell(state.table?.[selection[0]]?.[selection[1]])}
                  </strong>
                  <button
                    onClick={() => {
                      const index = run.steps
                        .slice(0, cursor + 1)
                        .findLastIndex((s) => s.state?.dp?.focus && cellKey(s.state.dp.focus) === cellKey(selection) && s.state.dp.phase === 'choose')
                      if (index >= 0) go(index)
                      else setMessage('This state is initialized as a base case.')
                    }}
                  >
                    View its calculation
                  </button>
                </MobileDisclosure>
              )}
              {meta.stack && (
                <div className="dp-stack">
                  <h4>Live recursive call stack</h4>
                  {meta.stack.length ? (
                    meta.stack.map((n, i) => (
                      <span key={i}>
                        F({n}) {i < meta.stack!.length - 1 ? '→' : ''}
                      </span>
                    ))
                  ) : (
                    <span>Stack empty</span>
                  )}
                </div>
              )}
            </div>
            <aside className="dp-decision">
              <span className="ls-eyebrow">WHY THIS VALUE?</span>
              <h3>
                Step {cursor + 1} of {run.steps.length}
              </h3>
              <p aria-live="polite">{step.description}</p>
              <div className="dp-expression">{meta.expression}</div>
              <h4>Read these dependencies</h4>
              <div className="dp-dependencies">
                {meta.dependencies.length ? (
                  meta.dependencies.map((dep, i) => (
                    <button key={i} onClick={() => setSelection(dep.cell)}>
                      <span>{dep.label}</span>
                      <strong>
                        [{dep.cell.join(',')}] = {formatCell(state.table?.[dep.cell[0]]?.[dep.cell[1]])}
                      </strong>
                      <small>→ current state</small>
                    </button>
                  ))
                ) : (
                  <p>
                    {meta.phase === 'base'
                      ? profile.base
                      : meta.phase === 'reuse'
                        ? 'A cached state returns without another recursive expansion.'
                        : 'This step changes the control flow or follows an already computed decision.'}
                  </p>
                )}
              </div>
              {meta.candidates.length > 0 && (
                <>
                  <h4>Compare the choices</h4>
                  <ul className="dp-candidates">
                    {meta.candidates.map((candidate, i) => (
                      <li key={i}>
                        <span>{candidate.label}</span>
                        <strong>{formatCell(candidate.value)}</strong>
                      </li>
                    ))}
                  </ul>
                </>
              )}
              <details>
                <summary>Why this recurrence is correct</summary>
                <p>{lesson.correctness}</p>
              </details>
            </aside>
          </div>
          <div className="ls-playback dp-playback">
            <button aria-label="Previous DP step" disabled={!cursor} onClick={() => go(cursor - 1)}>
              <ChevronLeft size={18} />
            </button>
            <button
              aria-label={playing && cursor < last ? 'Pause DP playback' : 'Play DP playback'}
              disabled={cursor === last}
              onClick={() => setPlaying((v) => !v)}
            >
              {playing && cursor < last ? 'Pause' : 'Play'}
            </button>
            <button aria-label="Next DP step" disabled={cursor === last} onClick={() => go(cursor + 1)}>
              <ChevronRight size={18} />
            </button>
            <label>
              Timeline
              <input aria-label="DP timeline" type="range" min="0" max={last} value={cursor} onChange={(e) => go(Number(e.target.value))} />
            </label>
            <label>
              Step delay
              <select aria-label="DP playback speed" value={delay} onChange={(e) => setDelay(Number(e.target.value))}>
                <option value={1400}>Slow</option>
                <option value={800}>Normal</option>
                <option value={300}>Fast</option>
              </select>
            </label>
            <button onClick={() => go(0)}>Replay DP trace</button>
            <button onClick={() => go(last)}>Jump to solution</button>
          </div>
          {prediction ? (
            <div className="dp-prediction">
              <div>
                <span className="ls-eyebrow">
                  <Target size={16} /> PREDICT BEFORE REVEALING
                </span>
                <h3>What value will the next computed state [{prediction.focus.join(',')}] store?</h3>
                {lesson.id === 'held-karp-tsp' && (
                  <p>
                    Visited set {run.steps[prediction.index].state!.rowLabels?.[prediction.focus[0]]} · endpoint {prediction.focus[1]}
                  </p>
                )}
                <p>Use the recurrence and known dependencies. Control-flow or traceback steps may occur before this write. Use ∞ for an unreachable state.</p>
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  setPlaying(false)
                  const normalize = (v: string) => (['∞', 'infinity', 'inf', 'unreachable'].includes(v.trim().toLowerCase()) ? '∞' : v.trim())
                  const answer = normalize(guess),
                    expected = normalize(prediction.value)
                  const correct =
                    answer !== '' && (answer === expected || (Number.isFinite(Number(answer)) && Math.abs(Number(answer) - Number(expected)) < 1e-9))
                  setFeedback(
                    correct ? 'Correct. Reveal the state to verify the calculation.' : 'Not yet. Recheck the base cases and each candidate in the recurrence.',
                  )
                }}
              >
                <label>
                  Your predicted value
                  <input aria-label="DP predicted value" value={guess} onChange={(e) => setGuess(e.target.value)} placeholder="Enter a number or ∞" />
                </label>
                <button type="submit">
                  <Check size={16} />
                  Check prediction
                </button>
                <button type="button" onClick={() => go(prediction.index)}>
                  Reveal predicted state
                </button>
              </form>
              {feedback && <p role="status">{feedback}</p>}
            </div>
          ) : (
            <div className="dp-prediction">
              <h3>All planned state writes are complete</h3>
              <p>Follow the reconstruction steps or replay the trace with a different input.</p>
            </div>
          )}
          {cursor === last && <Solution lesson={lesson} input={input} result={run.result} />}
          <div className="ls-challenge">
            <article>
              <h3>Reason about an edge case</h3>
              <p>{lesson.exercise.question}</p>
              <label>
                Your explanation
                <textarea aria-label="DP challenge reasoning" rows={3} placeholder="Explain before revealing the reasoning" />
              </label>
              <details>
                <summary>Reveal challenge reasoning</summary>
                <p>{lesson.exercise.answer}</p>
              </details>
            </article>
            <article>
              <h3>Optimization tradeoff</h3>
              <p>{profile.optimization}</p>
              <h3>Watch out</h3>
              <p>{profile.pitfall}</p>
            </article>
          </div>
        </>
      )}
      {tab === 'Code' && (
        <div className="dp-code">
          <h3>Derive the implementation</h3>
          <ol>
            {lesson.pseudocode.map((line, i) => (
              <li key={i}>{line}</li>
            ))}
          </ol>
          <p>{profile.recurrence}</p>
          <p>{lesson.derivation}</p>
          <details open>
            <summary>Executable TypeScript runner and shared helpers</summary>
            <pre>
              <code>
                {lesson.id === 'multistage-shortest-path' ? graphSource : dpExtraLessons.some((l) => l.id === lesson.id) ? extraSource : dynamicSource}
                {'\n\n// Shared DP trace recorder\n' + dpTraceSource}
              </code>
            </pre>
          </details>
        </div>
      )}
      {tab === 'Experiments' && (
        <div className="dp-experiments">
          <h3>Save and replay a computed example</h3>
          <p>Saved examples stay in this browser. Loading recomputes the trace so the input, table and answer agree.</p>
          <div className="ls-operations">
            <button onClick={save}>Save DP example</button>
            <button onClick={() => download(`${lesson.id}-trace.json`, { lesson: lesson.id, input, ...run })}>Export DP trace</button>
          </div>
          {message && <p role="status">{message}</p>}
          {saved.map((example, i) => (
            <article key={`${example.createdAt}-${i}`}>
              <p>{new Date(example.createdAt).toLocaleString()}</p>
              <code>{JSON.stringify(example.input)}</code>
              <button
                onClick={() => {
                  compute(example.input)
                  onTab?.('Visualization')
                }}
              >
                Load DP example {i + 1}
              </button>
            </article>
          ))}
          {error && (
            <p className="ls-error" role="alert">
              {error}
            </p>
          )}
        </div>
      )}
    </section>
  )
}

export function DPSuiteLearning({ module, tab, onTab }: { module: AlgorithmModule; tab: LearningTab; onTab?: (tab: LearningTab) => void }) {
  const prefix = module.id === 'prefix-sum-difference-suite',
    lessons = prefix ? dpExtraLessons : allDPLessons.filter((l) => !dpExtraLessons.includes(l))
  const [selected, setSelected] = useState(
    prefix
      ? 'prefix-sum'
      : module.id === 'trace-table-mode'
        ? 'longest-common-subsequence'
        : module.id === 'dynamic-programming-method'
          ? 'coin-change'
          : 'fibonacci-tabulation',
  )
  const lesson = lessons.find((l) => l.id === selected)!
  return (
    <div className="dp-suite">
      <section className="learning-studio dp-suite-intro">
        <span className="ls-eyebrow">
          <Braces size={16} /> {module.id === 'trace-table-mode' ? 'TRACE • PREDICT • CHECK' : 'STATE • TRANSITION • ORDER'}
        </span>
        <h2>{module.name}</h2>
        <p>{module.summary}</p>
        {module.id === 'dynamic-programming-method' && (
          <div className="dp-method-map">
            {[
              'Define the state',
              'List the final choices',
              'Write the recurrence',
              'Seed base / impossible states',
              'Choose a dependency order',
              'Reconstruct the solution',
            ].map((label, i) => (
              <span key={label}>
                <b>{i + 1}</b>
                {label}
              </span>
            ))}
          </div>
        )}
        {module.id === 'trace-table-mode' && (
          <p>
            Use Practice to fill the next state yourself. Compare your prediction with the computed recurrence, then inspect the first state where your
            reasoning differed.
          </p>
        )}
        <label>
          Choose a DP concept
          <select aria-label="DP suite concept" value={selected} onChange={(e) => setSelected(e.target.value)}>
            {lessons.map((l) => (
              <option key={l.id} value={l.id}>
                {l.title}
              </option>
            ))}
          </select>
        </label>
      </section>
      <DPStudio key={selected} lesson={lesson} tab={tab} onTab={onTab} />
    </div>
  )
}
export function DPLessonPage({ module, completed, toggleCompleted }: { module: AlgorithmModule; completed: string[]; toggleCompleted: (id: string) => void }) {
  const [tab, setTab] = useState<LearningTab>('Visualization'),
    lesson = allDPLessons.find((l) => l.id === module.id)
  return (
    <div className="lesson-surface dp-page daa-workspace compact-daa" data-learning-tab={tab}>
      <CompactLessonHeader
        title={module.name}
        description={module.summary}
        studied={completed.includes(module.id)}
        onStudy={() => toggleCompleted(module.id)}
        account={<AccountControl />}
      />
      <LessonTabs active={tab} onChange={setTab} />
      {lesson ? <DPStudio lesson={lesson} tab={tab} onTab={setTab} /> : <DPSuiteLearning module={module} tab={tab} onTab={setTab} />}
    </div>
  )
}
