// @localized-render
import { tx, useLocaleRender } from '../i18n/render'
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
  useLocaleRender()

  const marker = useId().replace(/:/g, ''),
    graph = step?.state?.graph
  if (input.vertices) {
    const n = input.vertices,
      position = (v: number) => ({ x: 230 + 160 * Math.cos((v * 2 * Math.PI) / n - Math.PI / 2), y: 145 + 100 * Math.sin((v * 2 * Math.PI) / n - Math.PI / 2) })
    return (
      <div className="dp-problem-graph">
        <svg viewBox="0 0 460 290" role="img" aria-label={tx('DP graph and active transition', 'studios')}>
          <defs>
            <marker id={marker} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M0 0 L10 5 L0 10 z" fill="currentColor" />
            </marker>
          </defs>
          {tx(
            input.edges?.map((e, i) => {
              const a = position(e.from),
                b = position(e.to),
                length = Math.hypot(b.x - a.x, b.y - a.y) || 1,
                dx = (b.x - a.x) / length,
                dy = (b.y - a.y) / length,
                active = graph?.selected?.some(([u, v]) => (u === e.from && v === e.to) || (!input.directed && v === e.from && u === e.to))
              return (
                <g key={i} className={active ? 'active' : ''}>
                  <line
                    x1={a.x + dx * 21}
                    y1={a.y + dy * 21}
                    x2={b.x - dx * 25}
                    y2={b.y - dy * 25}
                    markerEnd={input.directed ? `url(#${marker})` : undefined}
                  />
                  <text className="dp-edge-weight" x={(a.x + b.x) / 2} y={(a.y + b.y) / 2 - 7}>
                    {tx(e.weight, 'studios')}
                  </text>
                </g>
              )
            }),
            'studios',
          )}
          {tx(
            Array.from({ length: n }, (_, v) => {
              const p = position(v)
              return (
                <g key={v}>
                  <circle cx={p.x} cy={p.y} r="21" />
                  <text x={p.x} y={p.y + 5}>
                    {tx(v, 'studios')}
                  </text>
                </g>
              )
            }),
            'studios',
          )}
        </svg>
        <p>
          {tx(
            lesson.id === 'held-karp-tsp'
              ? 'A row identifies a visited set; a column identifies its last vertex.'
              : 'Parent pointers record which incoming edge improved each distance.',
            'studios',
          )}
        </p>
      </div>
    )
  }
  if (input.left !== undefined)
    return (
      <div className="dp-string-pair">
        {tx(
          [
            ['Source', input.left],
            ['Target', input.right ?? ''],
          ].map(([label, value]) => (
            <div key={label}>
              <strong>{tx(label, 'studios')}</strong>
              {tx(
                value ? (
                  value.split('').map((ch, i) => (
                    <span key={i}>
                      <small>{tx(i + 1, 'studios')}</small>
                      {tx(ch === ' ' ? '␠' : ch, 'studios')}
                    </span>
                  ))
                ) : (
                  <span>{tx('∅ empty string', 'studios')}</span>
                ),
                'studios',
              )}
            </div>
          )),
          'studios',
        )}
      </div>
    )
  if (input.weights)
    return (
      <div className="dp-items">
        {tx(
          input.weights.map((w, i) => (
            <div key={i}>
              <small>
                {tx('Item ', 'studios')}
                {tx(i, 'studios')}
              </small>
              <strong>
                {tx('profit ', 'studios')}
                {tx(input.profits![i], 'studios')}
              </strong>
              <span>
                {tx('weight ', 'studios')}
                {tx(w, 'studios')}
              </span>
            </div>
          )),
          'studios',
        )}
        <div>
          <small>{tx('Budget', 'studios')}</small>
          <strong>{tx(input.capacity, 'studios')}</strong>
          <span>{tx('capacity', 'studios')}</span>
        </div>
      </div>
    )
  if (input.dimensions)
    return (
      <div className="dp-items">
        {tx(
          input.dimensions.slice(1).map((p, i) => (
            <div key={i}>
              <strong>
                {tx('A', 'studios')}
                {tx(i + 1, 'studios')}
              </strong>
              <span>
                {tx(input.dimensions![i], 'studios')} × {tx(p, 'studios')}
              </span>
            </div>
          )),
          'studios',
        )}
      </div>
    )
  if (input.frequencies)
    return (
      <div className="dp-items">
        {tx(
          input.frequencies.map((f, i) => (
            <div key={i}>
              <small>
                {tx('Ordered key ', 'studios')}
                {tx(i, 'studios')}
              </small>
              <strong>{tx(f, 'studios')}</strong>
              <span>{tx('frequency', 'studios')}</span>
            </div>
          )),
          'studios',
        )}
      </div>
    )
  if (input.a)
    return (
      <div className="dp-original-matrix">
        <table>
          <caption>{tx('Original values · zero-based row and column coordinates', 'studios')}</caption>
          <tbody>
            {tx(
              input.a.map((row, i) => (
                <tr key={i}>
                  {tx(
                    row.map((v, j) => (
                      <td
                        key={j}
                        className={input.range && i >= input.range[0] && i <= input.range[2] && j >= input.range[1] && j <= input.range[3] ? 'queried' : ''}
                      >
                        {tx(v, 'studios')}
                      </td>
                    )),
                    'studios',
                  )}
                </tr>
              )),
              'studios',
            )}
          </tbody>
        </table>
      </div>
    )
  if (input.values)
    return (
      <div className="dp-items">
        {tx(
          input.values.map((v, i) => (
            <div key={i}>
              <small>{tx(lesson.id === 'coin-change' ? 'Coin' : `index ${i}`, 'studios')}</small>
              <strong>{tx(v, 'studios')}</strong>
            </div>
          )),
          'studios',
        )}
        <div>
          <small>{tx(input.amount !== undefined ? 'Amount' : 'Inclusive range', 'studios')}</small>
          <strong>{tx(input.amount ?? input.range?.join('…'), 'studios')}</strong>
          {tx(
            input.delta !== undefined && (
              <span>
                {tx('add ', 'studios')}
                {tx(input.delta, 'studios')}
              </span>
            ),
            'studios',
          )}
        </div>
      </div>
    )
  if ((input.n ?? 0) < 2)
    return (
      <div className="dp-fib-dependencies">
        <strong>
          {tx('F(', 'studios')}
          {tx(input.n, 'studios')}) = {tx(input.n, 'studios')}
        </strong>
        <p>{tx('This is a base case; no smaller-state expansion is needed.', 'studios')}</p>
      </div>
    )
  return (
    <div className="dp-fib-dependencies">
      <strong>
        {tx('F(', 'studios')}
        {tx(input.n, 'studios')})
      </strong>
      <span>←</span>
      <div>
        <span>
          {tx('F(', 'studios')}
          {tx(Math.max(0, (input.n ?? 0) - 1), 'studios')})
        </span>
        <span>
          {tx('+ F(', 'studios')}
          {tx(Math.max(0, (input.n ?? 0) - 2), 'studios')})
        </span>
      </div>
      <p>{tx((input.n ?? 0) < 2 ? 'This input is already a base case.' : 'Each dependency reuses a smaller solved state.', 'studios')}</p>
    </div>
  )
}
function OptimalTree({ node, frequencies }: { node: unknown; frequencies: number[] }) {
  useLocaleRender()

  if (!node) return <span className="dp-nil">{tx('gap', 'studios')}</span>
  const n = node as { key: number; left: unknown; right: unknown }
  return (
    <div className="dp-bst-node">
      <strong>
        {tx('key ', 'studios')}
        {tx(n.key, 'studios')}
        <small>
          {tx('frequency ', 'studios')}
          {tx(frequencies[n.key], 'studios')}
        </small>
      </strong>
      <div>
        <OptimalTree node={n.left} frequencies={frequencies} />
        <OptimalTree node={n.right} frequencies={frequencies} />
      </div>
    </div>
  )
}
function Solution({ lesson, input, result }: { lesson: Lesson; input: DaaInput; result: unknown }) {
  useLocaleRender()

  const r = (result ?? {}) as Record<string, unknown>
  const major = ['value', 'minimum', 'profit', 'length', 'distance', 'cost', 'sum'].find((key) => r[key] !== undefined)
  return (
    <div className="dp-solution" aria-label={tx('Computed DP solution', 'studios')}>
      <div>
        <span>{tx(major ?? 'Computed answer', 'studios')}</span>
        <strong>{tx(major ? (r[major] === null ? 'No feasible solution' : String(r[major])) : 'Complete', 'studios')}</strong>
      </div>
      {tx(
        r.sequence !== undefined && (
          <p>
            {tx('Reconstructed subsequence: ', 'studios')}
            <strong>{tx(String(r.sequence) || '∅', 'studios')}</strong>
          </p>
        ),
        'studios',
      )}
      {tx(
        Array.isArray(r.coins) && (
          <p>
            {tx('Coins: ', 'studios')}
            {tx(r.coins.length ? r.coins.join(' + ') : r.reachable ? 'none needed' : 'unreachable', 'studios')}
          </p>
        ),
        'studios',
      )}
      {tx(
        Array.isArray(r.items) && (
          <p>
            {tx('Chosen items: ', 'studios')}
            {tx(r.items.length ? r.items.join(', ') : 'none', 'studios')}
            {tx(' · total weight ', 'studios')}
            {tx(String(r.weight), 'studios')}
          </p>
        ),
        'studios',
      )}
      {tx(
        Array.isArray(r.operations) && (
          <ol>
            {tx(
              r.operations.map((v, i) => <li key={i}>{tx(String(v), 'studios')}</li>),
              'studios',
            )}
          </ol>
        ),
        'studios',
      )}
      {tx(r.parenthesization !== undefined && <p className="dp-parentheses">{tx(String(r.parenthesization), 'studios')}</p>, 'studios')}
      {tx(
        Array.isArray(r.tour) && (
          <p>
            {tx('Tour: ', 'studios')}
            {tx(r.tour.length ? r.tour.join(' → ') : 'No complete tour exists', 'studios')}
          </p>
        ),
        'studios',
      )}
      {tx(
        Array.isArray(r.values) && (
          <p>
            {tx('Updated values: ', 'studios')}
            {tx(r.values.join(', '), 'studios')}
          </p>
        ),
        'studios',
      )}
      {tx(
        Array.isArray(r.distances) && (
          <>
            <p>
              {tx('Distances: ', 'studios')}
              {tx(r.distances.join(', '), 'studios')}
            </p>
            <p>
              {tx('Parents: ', 'studios')}
              {tx((r.parent as number[])?.map((p, v) => `${v}←${p < 0 ? 'none' : p}`).join(' · '), 'studios')}
            </p>
          </>
        ),
        'studios',
      )}
      {tx(
        lesson.id === 'optimal-bst' && r.tree !== undefined && (
          <div className="dp-tree-scroll">
            <OptimalTree node={r.tree} frequencies={input.frequencies!} />
          </div>
        ),
        'studios',
      )}
    </div>
  )
}

export function DPStudio({ lesson, tab, onTab }: { lesson: Lesson; tab: LearningTab; onTab?: (tab: LearningTab) => void }) {
  useLocaleRender()

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
        <caption>
          {tx(profile.state, 'studios')}
          {tx(' Blank cells have not been computed. Click a known state to inspect it.', 'studios')}
        </caption>
        <thead>
          <tr>
            <th scope="col">{tx('State', 'studios')}</th>
            {tx(
              shown.columnLabels?.map((label, c) => (
                <th scope="col" key={c}>
                  {tx(label, 'studios')}
                </th>
              )),
              'studios',
            )}
          </tr>
        </thead>
        <tbody>
          {tx(
            rows.map((r) => (
              <tr key={r}>
                <th scope="row">{tx(shown.rowLabels?.[r] ?? r, 'studios')}</th>
                {tx(
                  table[r].map((value, c) => {
                    const key = cellKey([r, c]),
                      known = shownFilled.has(key),
                      active = tab !== 'Learn' && focus && cellKey(focus) === key,
                      dependency = tab !== 'Learn' && dependencyKeys.has(key),
                      path = shownMeta.path?.some((p) => cellKey(p) === key)
                    return (
                      <td key={c} data-cell={key} data-status={active ? 'active' : dependency ? 'dependency' : path ? 'path' : known ? 'known' : 'pending'}>
                        <button
                          aria-label={tx(`Inspect state ${r},${c}${known ? `: ${formatCell(value)}` : ': not computed'}`, 'studios')}
                          disabled={!known}
                          onClick={() => setSelection([r, c])}
                        >
                          {tx(known ? formatCell(value) : '·', 'studios')}
                        </button>
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
  )
  return (
    <section className="learning-studio dp-studio" aria-label={tx(`${lesson.title} dynamic programming studio`, 'studios')}>
      <header className="dp-heading">
        <div>
          <span className="ls-eyebrow">
            <Grid2X2 size={16} />
            {tx(' DYNAMIC PROGRAMMING LAB', 'studios')}
          </span>
          <h2>{tx(lesson.title, 'studios')}</h2>
          <p>{tx(lesson.summary, 'studios')}</p>
        </div>
        <span className="ls-chip">
          {tx(lesson.time, 'studios')}
          {tx(' time · ', 'studios')}
          {tx(lesson.space, 'studios')}
          {tx(' space', 'studios')}
        </span>
      </header>
      <div className="dp-recipe">
        <article>
          <span>{tx('01 · STATE', 'studios')}</span>
          <p>{tx(profile.state, 'studios')}</p>
        </article>
        <article>
          <span>{tx('02 · RECURRENCE', 'studios')}</span>
          <code>{profile.recurrence}</code>
        </article>
        <article>
          <span>{tx('03 · BASE + ORDER', 'studios')}</span>
          <p>
            {tx(profile.base, 'studios')} {tx(profile.order, 'studios')}
          </p>
        </article>
      </div>
      {tx(
        tab === 'Learn' && (
          <>
            <div className="ls-theory-grid">
              <article>
                <BookOpen size={20} />
                <h3>{tx('Theory in plain language', 'studios')}</h3>
                <p>{tx(profile.insight, 'studios')}</p>
                <p>{tx(lesson.correctness, 'studios')}</p>
              </article>
              <article>
                <Target size={20} />
                <h3>{tx('Worked example', 'studios')}</h3>
                <p>{tx(lesson.example, 'studios')}</p>
                <ol>
                  {tx(
                    worked.map((s, i) => <li key={i}>{tx(s.state!.dp!.expression, 'studios')}</li>),
                    'studios',
                  )}
                </ol>
              </article>
              <article>
                <Lightbulb size={20} />
                <h3>{tx('Common mistake', 'studios')}</h3>
                <p>{tx(profile.pitfall, 'studios')}</p>
                <h3>{tx('Space and time tradeoff', 'studios')}</h3>
                <p>{tx(profile.optimization, 'studios')}</p>
              </article>
            </div>
            <h3>{tx('Current example, solved', 'studios')}</h3>
            <p>{tx('The diagram, table and answer below come from the most recent successful run. Use Visualization to edit these inputs.', 'studios')}</p>
            <ProblemPicture lesson={lesson} input={input} step={run.steps.at(-1)} />
            {tx(renderTable(), 'studios')}
            {tx(
              selection && (
                <MobileDisclosure className="ls-inspector" title={tx('Inspect current state', 'studios')}>
                  <strong>
                    {tx('State [', 'studios')}
                    {tx(selection.join(','), 'studios')}] = {tx(formatCell(shown.table?.[selection[0]]?.[selection[1]]), 'studios')}
                  </strong>
                  <span>{tx(profile.state, 'studios')}</span>
                </MobileDisclosure>
              ),
              'studios',
            )}
            <Solution lesson={lesson} input={input} result={run.result} />
            <button className="ls-primary" onClick={() => onTab?.('Visualization')}>
              <Play size={16} />
              {tx('Explore this example', 'studios')}
            </button>
          </>
        ),
        'studios',
      )}
      {tx(
        interactive && (
          <>
            <section className="problem-input-panel learning-input-panel">
              <div className="dp-input-heading">
                <h3>{tx('Problem Input', 'studios')}</h3>
                <label>
                  {tx('Load a worked example', 'studios')}
                  <select
                    aria-label={tx('DP example preset', 'studios')}
                    value=""
                    onChange={(e) => {
                      const next = e.target.value === 'default' ? defaultInput : profile.examples[Number(e.target.value)]?.input
                      if (next) compute(next)
                    }}
                  >
                    <option value="">{tx('Choose a preset…', 'studios')}</option>
                    <option value="default">{tx('Default worked example', 'studios')}</option>
                    {tx(
                      profile.examples.map((example, i) => (
                        <option key={example.name} value={i}>
                          {tx(example.name, 'studios')}
                        </option>
                      )),
                      'studios',
                    )}
                  </select>
                </label>
              </div>
              <div className="dp-fields">
                {tx(
                  Object.entries(defaultInput).map(([key, original]) => (
                    <label key={key}>
                      {tx(fieldNames[key] ?? key, 'studios')}
                      {tx(
                        key === 'directed' ? (
                          <select
                            aria-label={tx(`DP ${fieldNames[key]}`, 'studios')}
                            value={fields[key]}
                            onChange={(e) => {
                              setFields({ ...fields, [key]: e.target.value })
                              setPlaying(false)
                            }}
                          >
                            <option value="true">{tx('Directed', 'studios')}</option>
                            <option value="false">{tx('Undirected', 'studios')}</option>
                          </select>
                        ) : Array.isArray(original) ? (
                          <textarea
                            aria-label={tx(`DP ${fieldNames[key]}`, 'studios')}
                            rows={4}
                            value={fields[key]}
                            onChange={(e) => {
                              setFields({ ...fields, [key]: e.target.value })
                              setPlaying(false)
                            }}
                          />
                        ) : (
                          <input
                            aria-label={tx(`DP ${fieldNames[key] ?? key}`, 'studios')}
                            type={typeof original === 'number' ? 'number' : 'text'}
                            value={fields[key]}
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
                  {tx('Run DP example', 'studios')}
                </button>
                <button onClick={() => compute(structuredClone(defaultInput))}>
                  <RotateCcw size={16} />
                  {tx('Reset default', 'studios')}
                </button>
                <button onClick={save}>{tx('Save DP example', 'studios')}</button>
                {tx(
                  changed && (
                    <span role="status">
                      {tx('Inputs edited. The table still describes the last successful run; Run DP example to apply changes.', 'studios')}
                    </span>
                  ),
                  'studios',
                )}
              </div>
              {tx(
                error && (
                  <p className="ls-error" role="alert">
                    {tx(error, 'studios')}
                  </p>
                ),
                'studios',
              )}
              {tx(message && <p role="status">{tx(message, 'studios')}</p>, 'studios')}
            </section>
            {tx(
              run.status === 'truncated' && (
                <p className="ls-error" role="status">
                  {tx(run.message, 'studios')}
                </p>
              ),
              'studios',
            )}
            <ProblemPicture lesson={lesson} input={input} step={step} />
            <div className="dp-workbench">
              <div className="dp-table-panel">
                <div className="dp-panel-title">
                  <h3>{tx('State table', 'studios')}</h3>
                  <span>
                    {tx(filled.size, 'studios')}
                    {tx(' known states · ', 'studios')}
                    {tx(meta.phase, 'studios')}
                  </span>
                </div>
                <div className="dp-legend">
                  <span className="active">{tx('Current', 'studios')}</span>
                  <span className="dependency">{tx('Dependency', 'studios')}</span>
                  <span className="path">{tx('Reconstruction', 'studios')}</span>
                  <span>{tx('· not computed', 'studios')}</span>
                </div>
                {tx(renderTable(), 'studios')}
                {tx(
                  selection && (
                    <MobileDisclosure className="ls-inspector" title={tx('Inspect current state', 'studios')}>
                      <strong>
                        {tx('State [', 'studios')}
                        {tx(selection.join(','), 'studios')}] = {tx(formatCell(state.table?.[selection[0]]?.[selection[1]]), 'studios')}
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
                        {tx('View its calculation', 'studios')}
                      </button>
                    </MobileDisclosure>
                  ),
                  'studios',
                )}
                {tx(
                  meta.stack && (
                    <div className="dp-stack">
                      <h4>{tx('Live recursive call stack', 'studios')}</h4>
                      {tx(
                        meta.stack.length ? (
                          meta.stack.map((n, i) => (
                            <span key={i}>
                              {tx('F(', 'studios')}
                              {tx(n, 'studios')}) {tx(i < meta.stack!.length - 1 ? '→' : '', 'studios')}
                            </span>
                          ))
                        ) : (
                          <span>{tx('Stack empty', 'studios')}</span>
                        ),
                        'studios',
                      )}
                    </div>
                  ),
                  'studios',
                )}
              </div>
              <aside className="dp-decision">
                <span className="ls-eyebrow">{tx('WHY THIS VALUE?', 'studios')}</span>
                <h3>
                  {tx('Step ', 'studios')}
                  {tx(cursor + 1, 'studios')}
                  {tx(' of ', 'studios')}
                  {tx(run.steps.length, 'studios')}
                </h3>
                <p aria-live="polite">{tx(step.description, 'studios')}</p>
                <div className="dp-expression">{tx(meta.expression, 'studios')}</div>
                <h4>{tx('Read these dependencies', 'studios')}</h4>
                <div className="dp-dependencies">
                  {tx(
                    meta.dependencies.length ? (
                      meta.dependencies.map((dep, i) => (
                        <button key={i} onClick={() => setSelection(dep.cell)}>
                          <span>{tx(dep.label, 'studios')}</span>
                          <strong>
                            [{tx(dep.cell.join(','), 'studios')}] = {tx(formatCell(state.table?.[dep.cell[0]]?.[dep.cell[1]]), 'studios')}
                          </strong>
                          <small>{tx('→ current state', 'studios')}</small>
                        </button>
                      ))
                    ) : (
                      <p>
                        {tx(
                          meta.phase === 'base'
                            ? profile.base
                            : meta.phase === 'reuse'
                              ? 'A cached state returns without another recursive expansion.'
                              : 'This step changes the control flow or follows an already computed decision.',
                          'studios',
                        )}
                      </p>
                    ),
                    'studios',
                  )}
                </div>
                {tx(
                  meta.candidates.length > 0 && (
                    <>
                      <h4>{tx('Compare the choices', 'studios')}</h4>
                      <ul className="dp-candidates">
                        {tx(
                          meta.candidates.map((candidate, i) => (
                            <li key={i}>
                              <span>{tx(candidate.label, 'studios')}</span>
                              <strong>{tx(formatCell(candidate.value), 'studios')}</strong>
                            </li>
                          )),
                          'studios',
                        )}
                      </ul>
                    </>
                  ),
                  'studios',
                )}
                <details>
                  <summary>{tx('Why this recurrence is correct', 'studios')}</summary>
                  <p>{tx(lesson.correctness, 'studios')}</p>
                </details>
              </aside>
            </div>
            <div className="ls-playback dp-playback">
              <button aria-label={tx('Previous DP step', 'studios')} disabled={!cursor} onClick={() => go(cursor - 1)}>
                <ChevronLeft size={18} />
              </button>
              <button
                aria-label={tx(playing && cursor < last ? 'Pause DP playback' : 'Play DP playback', 'studios')}
                disabled={cursor === last}
                onClick={() => setPlaying((v) => !v)}
              >
                {tx(playing && cursor < last ? 'Pause' : 'Play', 'studios')}
              </button>
              <button aria-label={tx('Next DP step', 'studios')} disabled={cursor === last} onClick={() => go(cursor + 1)}>
                <ChevronRight size={18} />
              </button>
              <label>
                {tx('Timeline', 'studios')}
                <input aria-label={tx('DP timeline', 'studios')} type="range" min="0" max={last} value={cursor} onChange={(e) => go(Number(e.target.value))} />
              </label>
              <label>
                {tx('Step delay', 'studios')}
                <select aria-label={tx('DP playback speed', 'studios')} value={delay} onChange={(e) => setDelay(Number(e.target.value))}>
                  <option value={1400}>{tx('Slow', 'studios')}</option>
                  <option value={800}>{tx('Normal', 'studios')}</option>
                  <option value={300}>{tx('Fast', 'studios')}</option>
                </select>
              </label>
              <button onClick={() => go(0)}>{tx('Replay DP trace', 'studios')}</button>
              <button onClick={() => go(last)}>{tx('Jump to solution', 'studios')}</button>
            </div>
            {tx(
              prediction ? (
                <div className="dp-prediction">
                  <div>
                    <span className="ls-eyebrow">
                      <Target size={16} />
                      {tx(' PREDICT BEFORE REVEALING', 'studios')}
                    </span>
                    <h3>
                      {tx('What value will the next computed state [', 'studios')}
                      {tx(prediction.focus.join(','), 'studios')}
                      {tx('] store?', 'studios')}
                    </h3>
                    {tx(
                      lesson.id === 'held-karp-tsp' && (
                        <p>
                          {tx('Visited set ', 'studios')}
                          {tx(run.steps[prediction.index].state!.rowLabels?.[prediction.focus[0]], 'studios')}
                          {tx(' · endpoint ', 'studios')}
                          {tx(prediction.focus[1], 'studios')}
                        </p>
                      ),
                      'studios',
                    )}
                    <p>
                      {tx(
                        'Use the recurrence and known dependencies. Control-flow or traceback steps may occur before this write. Use ∞ for an unreachable state.',
                        'studios',
                      )}
                    </p>
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
                        correct
                          ? 'Correct. Reveal the state to verify the calculation.'
                          : 'Not yet. Recheck the base cases and each candidate in the recurrence.',
                      )
                    }}
                  >
                    <label>
                      {tx('Your predicted value', 'studios')}
                      <input
                        aria-label={tx('DP predicted value', 'studios')}
                        value={guess}
                        onChange={(e) => setGuess(e.target.value)}
                        placeholder={tx('Enter a number or ∞', 'studios')}
                      />
                    </label>
                    <button type="submit">
                      <Check size={16} />
                      {tx('Check prediction', 'studios')}
                    </button>
                    <button type="button" onClick={() => go(prediction.index)}>
                      {tx('Reveal predicted state', 'studios')}
                    </button>
                  </form>
                  {tx(feedback && <p role="status">{tx(feedback, 'studios')}</p>, 'studios')}
                </div>
              ) : (
                <div className="dp-prediction">
                  <h3>{tx('All planned state writes are complete', 'studios')}</h3>
                  <p>{tx('Follow the reconstruction steps or replay the trace with a different input.', 'studios')}</p>
                </div>
              ),
              'studios',
            )}
            {tx(cursor === last && <Solution lesson={lesson} input={input} result={run.result} />, 'studios')}
            <div className="ls-challenge">
              <article>
                <h3>{tx('Reason about an edge case', 'studios')}</h3>
                <p>{tx(lesson.exercise.question, 'studios')}</p>
                <label>
                  {tx('Your explanation', 'studios')}
                  <textarea
                    aria-label={tx('DP challenge reasoning', 'studios')}
                    rows={3}
                    placeholder={tx('Explain before revealing the reasoning', 'studios')}
                  />
                </label>
                <details>
                  <summary>{tx('Reveal challenge reasoning', 'studios')}</summary>
                  <p>{tx(lesson.exercise.answer, 'studios')}</p>
                </details>
              </article>
              <article>
                <h3>{tx('Optimization tradeoff', 'studios')}</h3>
                <p>{tx(profile.optimization, 'studios')}</p>
                <h3>{tx('Watch out', 'studios')}</h3>
                <p>{tx(profile.pitfall, 'studios')}</p>
              </article>
            </div>
          </>
        ),
        'studios',
      )}
      {tx(
        tab === 'Code' && (
          <div className="dp-code">
            <h3>{tx('Derive the implementation', 'studios')}</h3>
            <ol>
              {tx(
                lesson.pseudocode.map((line, i) => <li key={i}>{tx(line, 'studios')}</li>),
                'studios',
              )}
            </ol>
            <p>{tx(profile.recurrence, 'studios')}</p>
            <p>{tx(lesson.derivation, 'studios')}</p>
            <details open>
              <summary>{tx('Executable TypeScript runner and shared helpers', 'studios')}</summary>
              <pre>
                <code>
                  {lesson.id === 'multistage-shortest-path' ? graphSource : dpExtraLessons.some((l) => l.id === lesson.id) ? extraSource : dynamicSource}
                  {'\n\n// Shared DP trace recorder\n' + dpTraceSource}
                </code>
              </pre>
            </details>
          </div>
        ),
        'studios',
      )}
      {tx(
        tab === 'Experiments' && (
          <div className="dp-experiments">
            <h3>{tx('Save and replay a computed example', 'studios')}</h3>
            <p>{tx('Saved examples stay in this browser. Loading recomputes the trace so the input, table and answer agree.', 'studios')}</p>
            <div className="ls-operations">
              <button onClick={save}>{tx('Save DP example', 'studios')}</button>
              <button onClick={() => download(`${lesson.id}-trace.json`, { lesson: lesson.id, input, ...run })}>{tx('Export DP trace', 'studios')}</button>
            </div>
            {tx(message && <p role="status">{tx(message, 'studios')}</p>, 'studios')}
            {tx(
              saved.map((example, i) => (
                <article key={`${example.createdAt}-${i}`}>
                  <p>{tx(new Date(example.createdAt).toLocaleString(), 'studios')}</p>
                  <code>{JSON.stringify(example.input)}</code>
                  <button
                    onClick={() => {
                      compute(example.input)
                      onTab?.('Visualization')
                    }}
                  >
                    {tx('Load DP example ', 'studios')}
                    {tx(i + 1, 'studios')}
                  </button>
                </article>
              )),
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
          </div>
        ),
        'studios',
      )}
    </section>
  )
}

export function DPSuiteLearning({ module, tab, onTab }: { module: AlgorithmModule; tab: LearningTab; onTab?: (tab: LearningTab) => void }) {
  useLocaleRender()

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
          <Braces size={16} /> {tx(module.id === 'trace-table-mode' ? 'TRACE • PREDICT • CHECK' : 'STATE • TRANSITION • ORDER', 'studios')}
        </span>
        <h2>{tx(module.name, 'studios')}</h2>
        <p>{tx(module.summary, 'studios')}</p>
        {tx(
          module.id === 'dynamic-programming-method' && (
            <div className="dp-method-map">
              {tx(
                [
                  'Define the state',
                  'List the final choices',
                  'Write the recurrence',
                  'Seed base / impossible states',
                  'Choose a dependency order',
                  'Reconstruct the solution',
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
        {tx(
          module.id === 'trace-table-mode' && (
            <p>
              {tx(
                'Use Practice to fill the next state yourself. Compare your prediction with the computed recurrence, then inspect the first state where your reasoning differed.',
                'studios',
              )}
            </p>
          ),
          'studios',
        )}
        <label>
          {tx('Choose a DP concept', 'studios')}
          <select aria-label={tx('DP suite concept', 'studios')} value={selected} onChange={(e) => setSelected(e.target.value)}>
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
      </section>
      <DPStudio key={selected} lesson={lesson} tab={tab} onTab={onTab} />
    </div>
  )
}
export function DPLessonPage({ module, completed, toggleCompleted }: { module: AlgorithmModule; completed: string[]; toggleCompleted: (id: string) => void }) {
  useLocaleRender()

  const [tab, setTab] = useState<LearningTab>('Visualization'),
    lesson = allDPLessons.find((l) => l.id === module.id)
  return (
    <div className="lesson-surface dp-page daa-workspace compact-daa" data-learning-tab={tab}>
      <CompactLessonHeader
        title={tx(module.name, 'studios')}
        description={module.summary}
        studied={completed.includes(module.id)}
        onStudy={() => toggleCompleted(module.id)}
        account={<AccountControl />}
      />
      <LessonTabs active={tab} onChange={setTab} />
      {tx(lesson ? <DPStudio lesson={lesson} tab={tab} onTab={setTab} /> : <DPSuiteLearning module={module} tab={tab} onTab={setTab} />, 'studios')}
    </div>
  )
}
