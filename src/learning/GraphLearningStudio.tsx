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
    <section className="learning-studio graph-academy" aria-label={`${lesson.title} graph learning studio`}>
      <header className="ls-heading">
        <div>
          <span className="ls-eyebrow">
            <Network size={16} /> GRAPH EXPLORER
          </span>
          <h2>Build a graph. Explain every decision.</h2>
          <p>{lesson.summary}</p>
        </div>
        <span className="ls-chip">{lesson.title}</span>
      </header>
      <div className="ls-theory-grid">
        <article>
          <BookOpen size={20} />
          <h3>Theory in plain language</h3>
          <p>{lesson.correctness}</p>
        </article>
        <article>
          <GitBranch size={20} />
          <h3>Worked example</h3>
          <p>{lesson.example}</p>
        </article>
        <article>
          <Lightbulb size={20} />
          <h3>Assumptions and cost</h3>
          <p>{lesson.constraints}</p>
          <p>
            {lesson.time} time · {lesson.space} space
          </p>
        </article>
      </div>
      {!theoryOnly && (
        <>
          <div className="ls-editor">
            <label>
              Example
              <select aria-label="Graph learning example" defaultValue="default" onChange={(e) => loadPreset(e.target.value)}>
                <option value="default">Algorithm’s worked example</option>
                <option value="disconnected">Disconnected + isolated vertex</option>
                <option value="cycle">Cycle with a tail</option>
                <option value="dag">Directed acyclic graph</option>
              </select>
            </label>
            <label>
              Vertices
              <input
                aria-label="Graph lab vertices"
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
              Source
              <input
                aria-label="Graph lab source"
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
              Edge direction
              <select
                value={input.directed ? 'directed' : 'undirected'}
                onChange={(e) => {
                  setInput({ ...input, directed: e.target.value === 'directed' })
                  setPlaying(false)
                }}
              >
                <option value="directed">Directed →</option>
                <option value="undirected">Undirected ↔</option>
              </select>
            </label>
            <button className="ls-primary" onClick={run}>
              <Play size={16} />
              Run edited graph
            </button>
          </div>
          <div className="ls-operations">
            <label>
              From vertex
              <input type="number" value={from} onChange={(e) => setFrom(Number(e.target.value))} />
            </label>
            <label>
              To vertex
              <input type="number" value={to} onChange={(e) => setTo(Number(e.target.value))} />
            </label>
            <label>
              Weight / capacity
              <input type="number" value={weight} onChange={(e) => setWeight(Number(e.target.value))} />
            </label>
            <button onClick={addEdge}>Add edge</button>
            <button
              onClick={() => {
                setInput({ ...input, vertices: Math.min(8, count + 1) })
                setPlaying(false)
              }}
              disabled={count >= 8}
            >
              Add vertex
            </button>
            <button
              onClick={() => {
                setPositions({})
              }}
            >
              Reset layout
            </button>
          </div>
          {dirty && (
            <p className="ls-cost" role="status">
              Graph edited. Run edited graph to compute a new trace. Playback and trace highlights are paused until then.
            </p>
          )}
          {(editError || result.error) && (
            <p role="alert" className="ls-error">
              {editError || result.error}
            </p>
          )}
          <div className="ls-stage-grid">
            <div className="ls-diagram">
              <div className="ls-legend">
                <span className="active">Active / chosen edge</span>
                <span>Green: visited</span>
                <span>Drag nodes · click to inspect</span>
              </div>
              <svg
                ref={svgRef}
                viewBox="0 0 600 380"
                className="ls-graph-svg"
                role="img"
                aria-label={`${lesson.title} editable graph`}
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
                {edges.map((edge, i) => {
                  const a = positions[edge.from] ?? point(edge.from, count),
                    b = positions[edge.to] ?? point(edge.to, count),
                    len = Math.hypot(b.x - a.x, b.y - a.y) || 1,
                    dx = (b.x - a.x) / len,
                    dy = (b.y - a.y) / len,
                    chosen =
                      !dirty && graph?.selected?.some(([u, v]) => (u === edge.from && v === edge.to) || (!input.directed && v === edge.from && u === edge.to)),
                    parallel = edges.some((other, j) => j !== i && other.from === edge.to && other.to === edge.from)
                  return (
                    <g key={i} style={{ color: chosen ? 'var(--ls-orange)' : 'var(--ls-muted)' }}>
                      {edge.from === edge.to ? (
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
                      )}
                      <text
                        className="ls-weight"
                        x={edge.from === edge.to ? a.x : (a.x + b.x) / 2 + (parallel ? -dy * 18 : 0)}
                        y={edge.from === edge.to ? a.y - 55 : (a.y + b.y) / 2 - 8 + (parallel ? dx * 18 : 0)}
                      >
                        {edge.weight}
                      </text>
                    </g>
                  )
                })}
                {Array.from({ length: count }, (_, v) => {
                  const p = positions[v] ?? point(v, count)
                  return (
                    <g key={v} className={!dirty && active === v ? 'current' : !dirty && visited.includes(v) ? 'visited' : ''}>
                      <circle cx={p.x} cy={p.y} r="24" />
                      <foreignObject x={p.x - 24} y={p.y - 24} width="48" height="48">
                        <button
                          aria-label={`Inspect vertex ${v}`}
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
                          {v}
                        </button>
                      </foreignObject>
                    </g>
                  )
                })}
              </svg>
              <div className="ls-inspector">
                <strong>Vertex {selected}</strong>
                <span>{adjacency[selected]?.length ?? 0} outgoing / incident adjacency entries</span>
                {!dirty && inspectLabel && <span>State: {inspectLabel}</span>}
                <span>Neighbors: {adjacency[selected]?.map((n) => n.to).join(', ') || 'none'}</span>
              </div>
            </div>
            <aside className="ls-trace">
              <span className="ls-eyebrow">EXPLAIN THIS STEP</span>
              <h3>{dirty ? 'Ready to recompute' : `Step ${cursor + 1} of ${steps.length}`}</h3>
              <p aria-live="polite">
                {dirty
                  ? 'The diagram shows your edited input. Compute a fresh trace to connect it to the algorithm.'
                  : (explanation ?? 'Run a valid example to begin.')}
              </p>
              {!dirty && (
                <>
                  <h4>Frontier / worklist</h4>
                  <div className="ls-output">
                    {frontier.length
                      ? frontier.join(' → ')
                      : state?.networkStudy
                        ? 'No pending vertices in the worklist.'
                        : traversal || weighted
                          ? 'Empty'
                          : 'This trace exposes its state in the table below.'}
                  </div>
                  <h4>Procedure</h4>
                  <ol>
                    {lesson.pseudocode.map((line, i) => (
                      <li key={i} style={{ fontWeight: current?.pseudocodeLine === i ? 750 : 400 }}>
                        {line}
                      </li>
                    ))}
                  </ol>
                  {state?.table && (
                    <div className="ls-matrix-scroll">
                      <table>
                        <caption>Algorithm state</caption>
                        <tbody>
                          {state.table.map((row, i) => (
                            <tr key={i}>
                              {row.map((cell, j) => (
                                <td key={j}>{cell === null ? '∞' : String(cell)}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              )}
              <p className="ls-cost">{lesson.derivation}</p>
            </aside>
          </div>
          <div className="ls-edge-list" aria-label="Editable graph edges">
            {edges.map((edge, i) => (
              <button
                key={i}
                aria-label={`Remove edge ${edge.from} to ${edge.to} at position ${i}`}
                onClick={() => {
                  setInput({ ...input, edges: edges.filter((_, j) => j !== i) })
                  setPlaying(false)
                }}
              >
                {edge.from}
                {input.directed ? '→' : '↔'}
                {edge.to} · {edge.weight} ×
              </button>
            ))}
          </div>
          <div className="ls-playback">
            <button aria-label="Previous graph step" disabled={dirty || !cursor} onClick={() => navigate(cursor - 1)}>
              <SkipBack size={18} />
            </button>
            <button
              aria-label={playing && cursor < last ? 'Pause graph playback' : 'Play graph playback'}
              disabled={dirty || !steps.length || cursor === last}
              onClick={() => setPlaying((v) => !v)}
            >
              {playing && cursor < last ? 'Pause' : 'Play'}
            </button>
            <button aria-label="Next graph step" disabled={dirty || !steps.length || cursor === last} onClick={() => navigate(cursor + 1)}>
              <SkipForward size={18} />
            </button>
            <label>
              Timeline
              <input
                aria-label="Graph lab timeline"
                type="range"
                min="0"
                max={last}
                value={cursor}
                disabled={dirty || !steps.length}
                onChange={(e) => navigate(Number(e.target.value))}
              />
            </label>
            <label>
              Step delay
              <select value={speed} onChange={(e) => setSpeed(Number(e.target.value))}>
                <option value={1400}>Slow</option>
                <option value={700}>Normal</option>
                <option value={250}>Fast</option>
              </select>
            </label>
            <button onClick={() => navigate(0)} disabled={!steps.length || dirty}>
              Replay trace
            </button>
          </div>
          {!dirty && cursor < last && (
            <div className="ls-prediction">
              <h3>Predict the next decision</h3>
              <div>
                {[...new Set([steps[cursor + 1].description, current?.description ?? ''])].sort().map((description) => (
                  <button
                    key={description}
                    onClick={() => {
                      setGuess(description)
                      setPlaying(false)
                    }}
                  >
                    {description}
                  </button>
                ))}
              </div>
              {guess && (
                <p role="status">
                  {guess === steps[cursor + 1].description
                    ? 'Correct. Advance to verify it on the graph.'
                    : 'That describes this step. Review the frontier and the next pseudocode instruction.'}
                </p>
              )}
            </div>
          )}
          <div className="ls-representations">
            <article>
              <h3>Adjacency list</h3>
              <div className="ls-adjacency">
                {adjacency.map((neighbors, v) => (
                  <div key={v}>
                    <strong>{v}</strong> → {neighbors.map((n) => `${n.to} (${n.weight})`).join(', ') || '∅'}
                  </div>
                ))}
              </div>
            </article>
            <article>
              <h3>Weighted adjacency matrix</h3>
              <div className="ls-matrix-scroll">
                <table>
                  <caption>Row → column · ∅ means no edge · parallel weights listed</caption>
                  <thead>
                    <tr>
                      <th scope="col">From / to</th>
                      {adjacency.map((_, i) => (
                        <th scope="col" key={i}>
                          {i}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {adjacency.map((neighbors, i) => (
                      <tr key={i}>
                        <th scope="row">{i}</th>
                        {adjacency.map((_, j) => (
                          <td key={j}>
                            {neighbors
                              .filter((n) => n.to === j)
                              .map((n) => n.weight)
                              .join(', ') || '∅'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </article>
          </div>
          <div className="ls-challenge">
            <div>
              <Target size={20} />
              <h3>Construct a counterexample</h3>
              <p>{lesson.exercise.question}</p>
              <details>
                <summary>Reveal reasoning</summary>
                <p>{lesson.exercise.answer}</p>
              </details>
              <p>Try a disconnected graph, a cycle, or equal-weight alternatives. Explain which assumption affects the result before running.</p>
            </div>
            <div>
              <h3>Compare on the same graph</h3>
              <label>
                Second algorithm
                <select
                  aria-label="Comparison graph algorithm"
                  value={compareId}
                  onChange={(e) => {
                    setCompareId(e.target.value)
                    setComparison({})
                  }}
                >
                  <option value="">Choose an algorithm</option>
                  {alternatives.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.title}
                    </option>
                  ))}
                </select>
              </label>
              <button
                disabled={!compareId || dirty || !result.run}
                onClick={() => {
                  setComparison(safeRun(alternatives.find((l) => l.id === compareId)!, input))
                  setPlaying(false)
                }}
              >
                Compare graph results
              </button>
              <p>
                Both algorithms receive your exact edited graph. Check their assumptions: traversal, shortest paths, spanning trees and flow answer different
                questions.
              </p>
            </div>
          </div>
          {!dirty && comparison.error && (
            <p className="ls-error" role="alert">
              Comparison: {comparison.error}
            </p>
          )}
          {!dirty && comparison.run && (
            <div className="ls-comparison">
              <article>
                <h3>{lesson.title}</h3>
                <p>{steps.length} recorded teaching steps</p>
                <pre>{JSON.stringify(result.run?.result, null, 2)}</pre>
              </article>
              <article>
                <h3>{alternatives.find((l) => l.id === compareId)?.title}</h3>
                <p>{comparison.run.steps.length} recorded teaching steps</p>
                <pre>{JSON.stringify(comparison.run.result, null, 2)}</pre>
              </article>
              <p className="ls-cost">Teaching-step counts describe these traces; they are not a benchmark of runtime or asymptotic complexity.</p>
            </div>
          )}
        </>
      )}
    </section>
  )
}
