// @localized-render
import { tx, useLocaleRender } from '../i18n/render'
import { MobileDisclosure } from '../components/MobileDisclosure'
import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { BookOpen, GitBranch, Lightbulb, Network, Play, SkipBack, SkipForward, Target } from 'lucide-react'
import { daaLessons } from '../daa/catalog'
import { executeLesson, type DaaInput, type DaaRun, type Lesson } from '../daa/types'
import './learning-studio.css'

const point = (i: number, count: number) => ({
  x: 300 + Math.cos((i * 2 * Math.PI) / count - Math.PI / 2) * 210,
  y: 190 + Math.sin((i * 2 * Math.PI) / count - Math.PI / 2) * 135,
})
const noEdges: NonNullable<DaaInput['edges']> = []
const safeRun = (lesson: Lesson, input: DaaInput): { run?: DaaRun; error?: string } => {
  try {
    return { run: executeLesson(lesson, structuredClone(input)) }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Check the graph input.' }
  }
}
export function GraphLearningStudio({ lesson, theoryOnly = false }: { lesson: Lesson; theoryOnly?: boolean }) {
  useLocaleRender()

  const marker = useId().replace(/:/g, ''),
    svgRef = useRef<SVGSVGElement>(null)
  const [input, setInput] = useState<DaaInput>(() => structuredClone(lesson.defaultInput!)),
    [traceInput, setTraceInput] = useState<DaaInput>(() => structuredClone(lesson.defaultInput!))
  const [result, setResult] = useState(() => safeRun(lesson, lesson.defaultInput!)),
    [cursor, setCursor] = useState(0),
    [playing, setPlaying] = useState(false),
    [speed, setSpeed] = useState(700),
    [guess, setGuess] = useState(''),
    [selected, setSelected] = useState(0),
    [from, setFrom] = useState(0),
    [to, setTo] = useState(1),
    [weight, setWeight] = useState(1),
    [positions, setPositions] = useState<Record<number, { x: number; y: number }>>({}),
    [dragging, setDragging] = useState<number>(),
    [compareId, setCompareId] = useState(''),
    [comparison, setComparison] = useState<{ run?: DaaRun; error?: string }>({}),
    [editError, setEditError] = useState('')
  const count = input.vertices ?? 0,
    edges = input.edges ?? noEdges,
    steps = result.run?.steps ?? [],
    current = steps[cursor],
    last = Math.max(0, steps.length - 1),
    dirty = JSON.stringify(input) !== JSON.stringify(traceInput)
  const state = current?.state,
    graph = state?.graph,
    traversal = state?.traversal,
    weighted = state?.weightedExplorer
  const visited = traversal?.visited ?? weighted?.visited ?? [],
    active = traversal?.current ?? weighted?.current,
    frontier = traversal?.frontier ?? weighted?.frontier ?? state?.networkStudy?.frontier ?? []
  const alternatives = daaLessons.filter((l) => l.defaultInput?.vertices && l.run && l.id !== lesson.id)
  useEffect(() => {
    if (!playing || cursor >= last || dirty) return
    const timer = window.setTimeout(() => {
      setCursor((i) => Math.min(last, i + 1))
      setGuess('')
    }, speed)
    return () => window.clearTimeout(timer)
  }, [playing, cursor, last, speed, dirty])
  const adjacency = useMemo(
    () =>
      Array.from({ length: count }, (_, v) =>
        edges.flatMap((e) => (e.from === v ? [{ to: e.to, weight: e.weight }] : !input.directed && e.to === v ? [{ to: e.from, weight: e.weight }] : [])),
      ),
    [count, edges, input.directed],
  )
  function run() {
    const next = safeRun(lesson, input)
    setResult(next)
    setTraceInput(structuredClone(input))
    setCursor(0)
    setPlaying(false)
    setGuess('')
    setComparison({})
    setEditError('')
  }
  function loadPreset(name: string) {
    const base = structuredClone(lesson.defaultInput!)
    if (name === 'default') {
      setInput(base)
    } else if (name === 'disconnected') {
      setInput({
        ...base,
        vertices: 6,
        source: 0,
        edges: [
          { from: 0, to: 1, weight: 2 },
          { from: 1, to: 2, weight: 3 },
          { from: 3, to: 4, weight: 1 },
        ],
      })
    } else if (name === 'cycle') {
      setInput({
        ...base,
        vertices: 5,
        source: 0,
        edges: [
          { from: 0, to: 1, weight: 2 },
          { from: 1, to: 2, weight: 1 },
          { from: 2, to: 0, weight: 4 },
          { from: 2, to: 3, weight: 2 },
          { from: 3, to: 4, weight: 1 },
        ],
      })
    } else {
      setInput({
        ...base,
        vertices: 5,
        source: 0,
        directed: true,
        edges: [
          { from: 0, to: 1, weight: 1 },
          { from: 0, to: 2, weight: 5 },
          { from: 1, to: 3, weight: 2 },
          { from: 2, to: 3, weight: 1 },
          { from: 3, to: 4, weight: 3 },
        ],
      })
    }
    setPositions({})
    setPlaying(false)
    setEditError('')
    setComparison({})
    setGuess('')
  }
  function addEdge() {
    if (!Number.isInteger(from) || !Number.isInteger(to) || from < 0 || to < 0 || from >= count || to >= count || !Number.isFinite(weight)) {
      setEditError('Use existing vertex IDs and a finite edge weight.')
      return
    }
    if (edges.length >= 40) {
      setEditError('Use at most 40 edges for this teaching graph.')
      return
    }
    setInput({ ...input, edges: [...edges, { from, to, weight }] })
    setEditError('')
    setPlaying(false)
  }
  const navigate = (i: number) => {
    setCursor(i)
    setGuess('')
    setPlaying(false)
  }
  const inspectLabel = graph?.labels?.[selected],
    explanation = current?.reason ?? current?.description
  return (
    <section className="learning-studio graph-academy" aria-label={tx(`${lesson.title} graph learning studio`, 'studios')}>
      <header className="ls-heading">
        <div>
          <span className="ls-eyebrow">
            <Network size={16} />
            {tx(' GRAPH EXPLORER', 'studios')}
          </span>
          <h2>{tx('Build a graph. Explain every decision.', 'studios')}</h2>
          <p>{tx(lesson.summary, 'studios')}</p>
        </div>
        <span className="ls-chip">{tx(lesson.title, 'studios')}</span>
      </header>
      <div className="ls-theory-grid">
        <article>
          <BookOpen size={20} />
          <h3>{tx('Theory in plain language', 'studios')}</h3>
          <p>{tx(lesson.correctness, 'studios')}</p>
        </article>
        <article>
          <GitBranch size={20} />
          <h3>{tx('Worked example', 'studios')}</h3>
          <p>{tx(lesson.example, 'studios')}</p>
        </article>
        <article>
          <Lightbulb size={20} />
          <h3>{tx('Assumptions and cost', 'studios')}</h3>
          <p>{tx(lesson.constraints, 'studios')}</p>
          <p>
            {tx(lesson.time, 'studios')}
            {tx(' time · ', 'studios')}
            {tx(lesson.space, 'studios')}
            {tx(' space', 'studios')}
          </p>
        </article>
      </div>
      {tx(
        !theoryOnly && (
          <>
            <div className="ls-editor problem-input-panel learning-input-panel">
              <h3 className="problem-panel-title">{tx('Problem Input', 'studios')}</h3>
              <label>
                {tx('Example', 'studios')}
                <select aria-label={tx('Graph learning example', 'studios')} defaultValue="default" onChange={(e) => loadPreset(e.target.value)}>
                  <option value="default">{tx('Algorithm’s worked example', 'studios')}</option>
                  <option value="disconnected">{tx('Disconnected + isolated vertex', 'studios')}</option>
                  <option value="cycle">{tx('Cycle with a tail', 'studios')}</option>
                  <option value="dag">{tx('Directed acyclic graph', 'studios')}</option>
                </select>
              </label>
              <label>
                {tx('Vertices', 'studios')}
                <input
                  aria-label={tx('Graph lab vertices', 'studios')}
                  type="number"
                  min="1"
                  max="8"
                  value={count}
                  onChange={(e) => {
                    const n = Number(e.target.value)
                    if (!Number.isInteger(n) || n < 1 || n > 8) return
                    setInput({ ...input, vertices: n, source: Math.min(input.source ?? 0, n - 1), edges: edges.filter((edge) => edge.from < n && edge.to < n) })
                    setSelected(0)
                    setPositions({})
                    setPlaying(false)
                  }}
                />
              </label>
              <label>
                {tx('Source', 'studios')}
                <input
                  aria-label={tx('Graph lab source', 'studios')}
                  type="number"
                  min="0"
                  max={count - 1}
                  value={input.source ?? 0}
                  onChange={(e) => {
                    setInput({ ...input, source: Number(e.target.value) })
                    setPlaying(false)
                  }}
                />
              </label>
              <label>
                {tx('Edge direction', 'studios')}
                <select
                  value={input.directed ? 'directed' : 'undirected'}
                  onChange={(e) => {
                    setInput({ ...input, directed: e.target.value === 'directed' })
                    setPlaying(false)
                  }}
                >
                  <option value="directed">{tx('Directed →', 'studios')}</option>
                  <option value="undirected">{tx('Undirected ↔', 'studios')}</option>
                </select>
              </label>
              <button className="ls-primary" onClick={run}>
                <Play size={16} />
                {tx('Run edited graph', 'studios')}
              </button>
            </div>
            <div className="ls-operations">
              <label>
                {tx('From vertex', 'studios')}
                <input type="number" value={from} onChange={(e) => setFrom(Number(e.target.value))} />
              </label>
              <label>
                {tx('To vertex', 'studios')}
                <input type="number" value={to} onChange={(e) => setTo(Number(e.target.value))} />
              </label>
              <label>
                {tx('Weight / capacity', 'studios')}
                <input type="number" value={weight} onChange={(e) => setWeight(Number(e.target.value))} />
              </label>
              <button onClick={addEdge}>{tx('Add edge', 'studios')}</button>
              <button
                onClick={() => {
                  setInput({ ...input, vertices: Math.min(8, count + 1) })
                  setPlaying(false)
                }}
                disabled={count >= 8}
              >
                {tx('Add vertex', 'studios')}
              </button>
              <button
                onClick={() => {
                  setPositions({})
                }}
              >
                {tx('Reset layout', 'studios')}
              </button>
            </div>
            {tx(
              dirty && (
                <p className="ls-cost" role="status">
                  {tx('Graph edited. Run edited graph to compute a new trace. Playback and trace highlights are paused until then.', 'studios')}
                </p>
              ),
              'studios',
            )}
            {tx(
              (editError || result.error) && (
                <p role="alert" className="ls-error">
                  {tx(editError || result.error, 'studios')}
                </p>
              ),
              'studios',
            )}
            <div className="ls-stage-grid">
              <div className="ls-diagram">
                <div className="ls-legend">
                  <span className="active">{tx('Active / chosen edge', 'studios')}</span>
                  <span>{tx('Green: visited', 'studios')}</span>
                  <span>{tx('Drag nodes · click to inspect', 'studios')}</span>
                </div>
                <svg
                  ref={svgRef}
                  viewBox="0 0 600 380"
                  className="ls-graph-svg"
                  role="img"
                  aria-label={tx(`${lesson.title} editable graph`, 'studios')}
                  onPointerMove={(e) => {
                    if (dragging === undefined || !svgRef.current) return
                    const p = svgRef.current.createSVGPoint()
                    p.x = e.clientX
                    p.y = e.clientY
                    const matrix = svgRef.current.getScreenCTM()
                    if (!matrix) return
                    const local = p.matrixTransform(matrix.inverse())
                    setPositions((old) => ({ ...old, [dragging]: { x: Math.min(565, Math.max(35, local.x)), y: Math.min(345, Math.max(35, local.y)) } }))
                  }}
                  onPointerUp={() => setDragging(undefined)}
                  onPointerCancel={() => setDragging(undefined)}
                >
                  <defs>
                    <marker id={marker} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                      <path d="M 0 0 L 10 5 L 0 10 z" fill="currentColor" />
                    </marker>
                  </defs>
                  {tx(
                    edges.map((edge, i) => {
                      const a = positions[edge.from] ?? point(edge.from, count),
                        b = positions[edge.to] ?? point(edge.to, count),
                        len = Math.hypot(b.x - a.x, b.y - a.y) || 1,
                        dx = (b.x - a.x) / len,
                        dy = (b.y - a.y) / len,
                        chosen =
                          !dirty &&
                          graph?.selected?.some(([u, v]) => (u === edge.from && v === edge.to) || (!input.directed && v === edge.from && u === edge.to)),
                        parallel = edges.some((other, j) => j !== i && other.from === edge.to && other.to === edge.from)
                      return (
                        <g key={i} style={{ color: chosen ? 'var(--ls-orange)' : 'var(--ls-muted)' }}>
                          {tx(
                            edge.from === edge.to ? (
                              <path
                                d={`M ${a.x - 15} ${a.y - 20} C ${a.x - 65} ${a.y - 85}, ${a.x + 65} ${a.y - 85}, ${a.x + 15} ${a.y - 20}`}
                                className="ls-edge"
                                markerEnd={input.directed ? `url(#${marker})` : undefined}
                              />
                            ) : (
                              <path
                                d={`M ${a.x + dx * 25} ${a.y + dy * 25} Q ${(a.x + b.x) / 2 + (parallel ? -dy * 30 : 0)} ${(a.y + b.y) / 2 + (parallel ? dx * 30 : 0)} ${b.x - dx * 28} ${b.y - dy * 28}`}
                                className={`ls-edge ${chosen ? 'active' : ''}`}
                                markerEnd={input.directed ? `url(#${marker})` : undefined}
                              />
                            ),
                            'studios',
                          )}
                          <text
                            className="ls-weight"
                            x={edge.from === edge.to ? a.x : (a.x + b.x) / 2 + (parallel ? -dy * 18 : 0)}
                            y={edge.from === edge.to ? a.y - 55 : (a.y + b.y) / 2 - 8 + (parallel ? dx * 18 : 0)}
                          >
                            {tx(edge.weight, 'studios')}
                          </text>
                        </g>
                      )
                    }),
                    'studios',
                  )}
                  {tx(
                    Array.from({ length: count }, (_, v) => {
                      const p = positions[v] ?? point(v, count)
                      return (
                        <g key={v} className={!dirty && active === v ? 'current' : !dirty && visited.includes(v) ? 'visited' : ''}>
                          <circle cx={p.x} cy={p.y} r="24" />
                          <foreignObject x={p.x - 24} y={p.y - 24} width="48" height="48">
                            <button
                              aria-label={tx(`Inspect vertex ${v}`, 'studios')}
                              onPointerDown={(e) => {
                                setDragging(v)
                                e.currentTarget.setPointerCapture(e.pointerId)
                                setSelected(v)
                              }}
                              onClick={() => setSelected(v)}
                              style={{
                                width: 48,
                                height: 48,
                                padding: 0,
                                border: 'none',
                                background: 'transparent',
                                borderRadius: '50%',
                                color: 'var(--ls-ink)',
                                fontSize: 17,
                              }}
                            >
                              {tx(v, 'studios')}
                            </button>
                          </foreignObject>
                        </g>
                      )
                    }),
                    'studios',
                  )}
                </svg>
                <MobileDisclosure className="ls-inspector" title={tx('Inspect current state', 'studios')}>
                  <strong>
                    {tx('Vertex ', 'studios')}
                    {tx(selected, 'studios')}
                  </strong>
                  <span>
                    {tx(adjacency[selected]?.length ?? 0, 'studios')}
                    {tx(' outgoing / incident adjacency entries', 'studios')}
                  </span>
                  {tx(
                    !dirty && inspectLabel && (
                      <span>
                        {tx('State: ', 'studios')}
                        {tx(inspectLabel, 'studios')}
                      </span>
                    ),
                    'studios',
                  )}
                  <span>
                    {tx('Neighbors: ', 'studios')}
                    {tx(adjacency[selected]?.map((n) => n.to).join(', ') || 'none', 'studios')}
                  </span>
                </MobileDisclosure>
              </div>
              <MobileDisclosure className="ls-trace" title={tx('Trace and explanation', 'studios')}>
                <span className="ls-eyebrow">{tx('EXPLAIN THIS STEP', 'studios')}</span>
                <h3>{tx(dirty ? 'Ready to recompute' : `Step ${cursor + 1} of ${steps.length}`, 'studios')}</h3>
                <p aria-live="polite">
                  {tx(
                    dirty
                      ? 'The diagram shows your edited input. Compute a fresh trace to connect it to the algorithm.'
                      : (explanation ?? 'Run a valid example to begin.'),
                    'studios',
                  )}
                </p>
                {tx(
                  !dirty && (
                    <>
                      <h4>{tx('Frontier / worklist', 'studios')}</h4>
                      <div className="ls-output">
                        {tx(
                          frontier.length
                            ? frontier.join(' → ')
                            : state?.networkStudy
                              ? 'No pending vertices in the worklist.'
                              : traversal || weighted
                                ? 'Empty'
                                : 'This trace exposes its state in the table below.',
                          'studios',
                        )}
                      </div>
                      <h4>{tx('Procedure', 'studios')}</h4>
                      <ol>
                        {tx(
                          lesson.pseudocode.map((line, i) => (
                            <li key={i} style={{ fontWeight: current?.pseudocodeLine === i ? 750 : 400 }}>
                              {tx(line, 'studios')}
                            </li>
                          )),
                          'studios',
                        )}
                      </ol>
                      {tx(
                        state?.table && (
                          <div className="ls-matrix-scroll">
                            <table>
                              <caption>{tx('Algorithm state', 'studios')}</caption>
                              <tbody>
                                {tx(
                                  state.table.map((row, i) => (
                                    <tr key={i}>
                                      {tx(
                                        row.map((cell, j) => <td key={j}>{tx(cell === null ? '∞' : String(cell), 'studios')}</td>),
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
                    </>
                  ),
                  'studios',
                )}
                <p className="ls-cost">{tx(lesson.derivation, 'studios')}</p>
              </MobileDisclosure>
            </div>
            <div className="ls-edge-list" aria-label={tx('Editable graph edges', 'studios')}>
              {tx(
                edges.map((edge, i) => (
                  <button
                    key={i}
                    aria-label={tx(`Remove edge ${edge.from} to ${edge.to} at position ${i}`, 'studios')}
                    onClick={() => {
                      setInput({ ...input, edges: edges.filter((_, j) => j !== i) })
                      setPlaying(false)
                    }}
                  >
                    {tx(edge.from, 'studios')}
                    {tx(input.directed ? '→' : '↔', 'studios')}
                    {tx(edge.to, 'studios')} · {tx(edge.weight, 'studios')} ×
                  </button>
                )),
                'studios',
              )}
            </div>
            <div className="ls-playback">
              <button aria-label={tx('Previous graph step', 'studios')} disabled={dirty || !cursor} onClick={() => navigate(cursor - 1)}>
                <SkipBack size={18} />
              </button>
              <button
                aria-label={tx(playing && cursor < last ? 'Pause graph playback' : 'Play graph playback', 'studios')}
                disabled={dirty || !steps.length || cursor === last}
                onClick={() => setPlaying((v) => !v)}
              >
                {tx(playing && cursor < last ? 'Pause' : 'Play', 'studios')}
              </button>
              <button aria-label={tx('Next graph step', 'studios')} disabled={dirty || !steps.length || cursor === last} onClick={() => navigate(cursor + 1)}>
                <SkipForward size={18} />
              </button>
              <label>
                {tx('Timeline', 'studios')}
                <input
                  aria-label={tx('Graph lab timeline', 'studios')}
                  type="range"
                  min="0"
                  max={last}
                  value={cursor}
                  disabled={dirty || !steps.length}
                  onChange={(e) => navigate(Number(e.target.value))}
                />
              </label>
              <label>
                {tx('Step delay', 'studios')}
                <select value={speed} onChange={(e) => setSpeed(Number(e.target.value))}>
                  <option value={1400}>{tx('Slow', 'studios')}</option>
                  <option value={700}>{tx('Normal', 'studios')}</option>
                  <option value={250}>{tx('Fast', 'studios')}</option>
                </select>
              </label>
              <button onClick={() => navigate(0)} disabled={!steps.length || dirty}>
                {tx('Replay trace', 'studios')}
              </button>
            </div>
            {tx(
              !dirty && cursor < last && (
                <div className="ls-prediction">
                  <h3>{tx('Predict the next decision', 'studios')}</h3>
                  <div>
                    {tx(
                      [...new Set([steps[cursor + 1].description, current?.description ?? ''])].sort().map((description) => (
                        <button
                          key={description}
                          onClick={() => {
                            setGuess(description)
                            setPlaying(false)
                          }}
                        >
                          {tx(description, 'studios')}
                        </button>
                      )),
                      'studios',
                    )}
                  </div>
                  {tx(
                    guess && (
                      <p role="status">
                        {tx(
                          guess === steps[cursor + 1].description
                            ? 'Correct. Advance to verify it on the graph.'
                            : 'That describes this step. Review the frontier and the next pseudocode instruction.',
                          'studios',
                        )}
                      </p>
                    ),
                    'studios',
                  )}
                </div>
              ),
              'studios',
            )}
            <div className="ls-representations">
              <article>
                <h3>{tx('Adjacency list', 'studios')}</h3>
                <div className="ls-adjacency">
                  {tx(
                    adjacency.map((neighbors, v) => (
                      <div key={v}>
                        <strong>{tx(v, 'studios')}</strong> → {tx(neighbors.map((n) => `${n.to} (${n.weight})`).join(', ') || '∅', 'studios')}
                      </div>
                    )),
                    'studios',
                  )}
                </div>
              </article>
              <article>
                <h3>{tx('Weighted adjacency matrix', 'studios')}</h3>
                <div className="ls-matrix-scroll">
                  <table>
                    <caption>{tx('Row → column · ∅ means no edge · parallel weights listed', 'studios')}</caption>
                    <thead>
                      <tr>
                        <th scope="col">{tx('From / to', 'studios')}</th>
                        {tx(
                          adjacency.map((_, i) => (
                            <th scope="col" key={i}>
                              {tx(i, 'studios')}
                            </th>
                          )),
                          'studios',
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {tx(
                        adjacency.map((neighbors, i) => (
                          <tr key={i}>
                            <th scope="row">{tx(i, 'studios')}</th>
                            {tx(
                              adjacency.map((_, j) => (
                                <td key={j}>
                                  {tx(
                                    neighbors
                                      .filter((n) => n.to === j)
                                      .map((n) => n.weight)
                                      .join(', ') || '∅',
                                    'studios',
                                  )}
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
              </article>
            </div>
            <div className="ls-challenge">
              <div>
                <Target size={20} />
                <h3>{tx('Construct a counterexample', 'studios')}</h3>
                <p>{tx(lesson.exercise.question, 'studios')}</p>
                <details>
                  <summary>{tx('Reveal reasoning', 'studios')}</summary>
                  <p>{tx(lesson.exercise.answer, 'studios')}</p>
                </details>
                <p>
                  {tx(
                    'Try a disconnected graph, a cycle, or equal-weight alternatives. Explain which assumption affects the result before running.',
                    'studios',
                  )}
                </p>
              </div>
              <div>
                <h3>{tx('Compare on the same graph', 'studios')}</h3>
                <label>
                  {tx('Second algorithm', 'studios')}
                  <select
                    aria-label={tx('Comparison graph algorithm', 'studios')}
                    value={compareId}
                    onChange={(e) => {
                      setCompareId(e.target.value)
                      setComparison({})
                    }}
                  >
                    <option value="">{tx('Choose an algorithm', 'studios')}</option>
                    {tx(
                      alternatives.map((l) => (
                        <option key={l.id} value={l.id}>
                          {tx(l.title, 'studios')}
                        </option>
                      )),
                      'studios',
                    )}
                  </select>
                </label>
                <button
                  disabled={!compareId || dirty || !result.run}
                  onClick={() => {
                    setComparison(safeRun(alternatives.find((l) => l.id === compareId)!, input))
                    setPlaying(false)
                  }}
                >
                  {tx('Compare graph results', 'studios')}
                </button>
                <p>
                  {tx(
                    'Both algorithms receive your exact edited graph. Check their assumptions: traversal, shortest paths, spanning trees and flow answer different questions.',
                    'studios',
                  )}
                </p>
              </div>
            </div>
            {tx(
              !dirty && comparison.error && (
                <p className="ls-error" role="alert">
                  {tx('Comparison: ', 'studios')}
                  {tx(comparison.error, 'studios')}
                </p>
              ),
              'studios',
            )}
            {tx(
              !dirty && comparison.run && (
                <div className="ls-comparison">
                  <article>
                    <h3>{tx(lesson.title, 'studios')}</h3>
                    <p>
                      {tx(steps.length, 'studios')}
                      {tx(' recorded teaching steps', 'studios')}
                    </p>
                    <pre>{JSON.stringify(result.run?.result, null, 2)}</pre>
                  </article>
                  <article>
                    <h3>{tx(alternatives.find((l) => l.id === compareId)?.title, 'studios')}</h3>
                    <p>
                      {tx(comparison.run.steps.length, 'studios')}
                      {tx(' recorded teaching steps', 'studios')}
                    </p>
                    <pre>{JSON.stringify(comparison.run.result, null, 2)}</pre>
                  </article>
                  <p className="ls-cost">
                    {tx('Teaching-step counts describe these traces; they are not a benchmark of runtime or asymptotic complexity.', 'studios')}
                  </p>
                </div>
              ),
              'studios',
            )}
          </>
        ),
        'studios',
      )}
    </section>
  )
}
