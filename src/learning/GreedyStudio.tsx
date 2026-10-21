import { MobileDisclosure } from '../components/MobileDisclosure'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { BookOpen, ChevronLeft, ChevronRight, Lightbulb, Play, RotateCcw, Sparkles, Target } from 'lucide-react'
import type { AlgorithmModule, LearningTab } from '../types'
import { daaLessons } from '../daa/catalog'
import { executeLesson, type DaaInput, type GreedyTree, type LearningState, type Lesson } from '../daa/types'
import designSource from '../daa/design.ts?raw'
import { CompactLessonHeader } from '../components/CompactLessonHeader'
import { AccountControl } from '../account/AccountControl'
import { LessonTabs } from '../components/LessonTabs'
import { greedyFields, greedyFieldsFor, greedyProfiles, matchesGreedyAnswer, nextGreedyPrediction, parseGreedyFields } from './greedyModel'
import './learning-studio.css'
import './greedy.css'

const lessons = daaLessons.filter((l) => l.category === 'Greedy' && l.run)
type GreedyState = NonNullable<LearningState['greedy']>
const fmt = (n: number) => (Number.isInteger(n) ? String(n) : Number(n.toFixed(4)).toString())
const symbol = (id: number) => `S${id}`

function HuffmanTree({ root }: { root: GreedyTree }) {
  type Node = { node: GreedyTree; x: number; y: number; code: string }
  const nodes: Node[] = [],
    edges: { from: Node; to: Node; bit: string }[] = []
  let leaf = 0,
    depth = 0
  function visit(node: GreedyTree, level: number, code: string): Node {
    depth = Math.max(depth, level)
    const current: Node = { node, x: 0, y: level * 82 + 30, code }
    if (node.id !== undefined) current.x = leaf++ * 70 + 40
    else {
      const left = visit(node.left!, level + 1, code + '0'),
        right = visit(node.right!, level + 1, code + '1')
      current.x = (left.x + right.x) / 2
      edges.push({ from: current, to: left, bit: '0' }, { from: current, to: right, bit: '1' })
    }
    nodes.push(current)
    return current
  }
  visit(root, 0, '')
  return (
    <svg
      style={{ minWidth: Math.max(80, leaf * 70 + 10), minHeight: depth * 82 + 80 }}
      viewBox={`0 0 ${Math.max(80, leaf * 70 + 10)} ${depth * 82 + 80}`}
      role="img"
      aria-label={`Huffman tree with weight ${root.weight}`}
    >
      {edges.map((e, i) => (
        <g key={i}>
          <line x1={e.from.x} y1={e.from.y + 17} x2={e.to.x} y2={e.to.y - 18} />
          <text className="gr-bit" x={(e.from.x + e.to.x) / 2 + 8} y={(e.from.y + e.to.y) / 2}>
            {e.bit}
          </text>
        </g>
      ))}
      {nodes.map((n, i) => (
        <g key={i} className={n.node.id !== undefined ? 'gr-leaf' : ''}>
          <title>{n.node.id === undefined ? 'Merged subtree' : `${symbol(n.node.id)} · code ${n.code || '0'}`}</title>
          <circle cx={n.x} cy={n.y} r="21" />
          <text x={n.x} y={n.y + 5}>
            {fmt(n.node.weight)}
          </text>
          {n.node.id !== undefined && (
            <text className="gr-symbol" x={n.x} y={n.y + 38}>
              {symbol(n.node.id)}
            </text>
          )}
        </g>
      ))}
    </svg>
  )
}

function GreedyPicture({ lesson, input, state, onInspect }: { lesson: Lesson; input: DaaInput; state: GreedyState; onInspect: (id: number) => void }) {
  const status = (id: number) =>
    state.current === id ? 'current' : state.selected.includes(id) ? 'accepted' : state.rejected.includes(id) ? 'rejected' : 'pending'
  if (input.intervals) {
    const min = Math.min(...input.intervals.map((r) => r[0])),
      max = Math.max(...input.intervals.map((r) => r[1])),
      span = max - min || 1
    return (
      <div className="gr-timeline" aria-label="Activity timeline">
        <div className="gr-scale">
          <span>Start {min}</span>
          <span>Finish {max}</span>
        </div>
        {state.order.map((id) => {
          const [start, end] = input.intervals![id]
          return (
            <button key={id} className="gr-activity" data-status={status(id)} onClick={() => onInspect(id)} aria-label={`Inspect activity ${id}`}>
              <span>
                A{id}
                <small>
                  {start} → {end}
                </small>
              </span>
              <span className="gr-track">
                <span style={{ left: `${((start - min) / span) * 100}%`, width: `${((end - start) / span) * 100}%` }}>{end - start}</span>
                {Number.isFinite(state.boundary) && <i style={{ left: `${((state.boundary! - min) / span) * 100}%` }} />}
              </span>
              <small>{state.selected.includes(id) ? 'Chosen' : state.rejected.includes(id) ? 'Overlap' : 'Waiting'}</small>
            </button>
          )
        })}
        <p>Rows follow finish-time order. Bars show duration; the vertical marker is the last chosen finish. Click a row to inspect it.</p>
      </div>
    )
  }
  if (input.weights)
    return (
      <div className="gr-knapsack">
        <h3>
          Capacity vessel · {fmt(input.capacity! - (state.remaining ?? input.capacity!))} / {input.capacity} weight
        </h3>
        <div className="gr-vessel" aria-label="Used knapsack capacity">
          {input.weights.map((w, id) => (
            <span
              key={id}
              title={`Item ${id}: ${fmt((state.fractions?.[id] ?? 0) * w)} weight`}
              style={{
                width: `${input.capacity ? (((state.fractions?.[id] ?? 0) * w) / input.capacity) * 100 : 0}%`,
                background: `hsl(${180 + id * 27} 60% 40%)`,
              }}
            >
              {(state.fractions?.[id] ?? 0) > 0 ? `I${id}` : ''}
            </span>
          ))}
        </div>
        <div className="gr-item-grid">
          {state.order.map((id) => (
            <button key={id} data-status={status(id)} onClick={() => onInspect(id)} aria-label={`Inspect item ${id}`}>
              <small>ITEM {id}</small>
              <strong>{fmt(input.profits![id] / input.weights![id])}</strong>
              <span>profit / weight</span>
              <small>
                {input.profits![id]} / {input.weights![id]}
              </small>
              <div className="gr-fraction">
                <i style={{ width: `${(state.fractions?.[id] ?? 0) * 100}%` }} />
              </div>
              <b>{fmt((state.fractions?.[id] ?? 0) * 100)}% taken</b>
            </button>
          ))}
        </div>
        <p>Cards are ranked by value density. A partial fill means only that fraction of the item is taken.</p>
      </div>
    )
  if (input.deadlines)
    return (
      <div className="gr-schedule">
        <h3>Schedule · each slot takes one time unit</h3>
        <div className="gr-slots">
          {state.slots?.length ? (
            state.slots.map((id, i) => (
              <div key={i} data-status={id >= 0 ? 'accepted' : 'pending'}>
                <small>
                  Slot {i + 1} · [{i},{i + 1}]
                </small>
                <strong>{id < 0 ? 'Free' : `J${id}`}</strong>
                <span>{id < 0 ? 'No job' : `profit ${input.profits![id]}`}</span>
              </div>
            ))
          ) : (
            <p>No slots: every deadline is zero.</p>
          )}
        </div>
        <div className="gr-item-grid">
          {state.order.map((id) => (
            <button key={id} data-status={status(id)} onClick={() => onInspect(id)} aria-label={`Inspect job ${id}`}>
              <small>JOB {id}</small>
              <strong>{input.profits![id]}</strong>
              <span>profit · deadline {input.deadlines![id]}</span>
              <b>{state.selected.includes(id) ? 'Scheduled' : state.rejected.includes(id) ? 'Rejected' : 'Waiting'}</b>
            </button>
          ))}
        </div>
        <p>Highest-profit jobs are considered first. A job may only occupy a slot ending at or before its deadline.</p>
      </div>
    )
  return (
    <div className="gr-huffman">
      <h3>{state.phase === 'codes' ? 'Prefix-code tree' : 'Minimum-weight forest'}</h3>
      <p>Each circle shows total frequency. Edges encode left = 0, right = 1. Scroll inside a large tree to explore every branch.</p>
      <div className="gr-forest">
        {state.forest?.map((root, i) => (
          <div className="gr-tree" key={i}>
            <HuffmanTree root={root} />
          </div>
        ))}
      </div>
      {state.codes && (
        <div className="gr-table-scroll">
          <table>
            <caption>Codebook · weighted length = Σ frequency × code length</caption>
            <thead>
              <tr>
                <th>Symbol</th>
                <th>Frequency</th>
                <th>Code</th>
                <th>Weighted bits</th>
              </tr>
            </thead>
            <tbody>
              {input.frequencies!.map((f, id) => (
                <tr key={id}>
                  <th>{symbol(id)}</th>
                  <td>{f}</td>
                  <td>
                    <code>{state.codes![id]}</code>
                  </td>
                  <td>{fmt(f * state.codes![id].length)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p>{lesson.id === 'huffman-coding' ? 'The two lightest roots are merged at each step. Tree weights stay visible throughout construction.' : ''}</p>
    </div>
  )
}

function GreedyLab({ lesson, tab, onTab }: { lesson: Lesson; tab: LearningTab; onTab: (tab: LearningTab) => void }) {
  const defaults = lesson.defaultInput!,
    profile = greedyProfiles[lesson.id]
  const [input, setInput] = useState<DaaInput>(() => structuredClone(defaults)),
    [fields, setFields] = useState(() => greedyFieldsFor(defaults)),
    [run, setRun] = useState(() => executeLesson(lesson, defaults)),
    [cursor, setCursor] = useState(0),
    [playing, setPlaying] = useState(false),
    [speed, setSpeed] = useState(900),
    [error, setError] = useState(''),
    [answer, setAnswer] = useState(''),
    [feedback, setFeedback] = useState(''),
    [inspected, setInspected] = useState<number>(),
    [revealed, setRevealed] = useState(false),
    [notice, setNotice] = useState('')
  const [saved, setSaved] = useState<{ input: DaaInput }[]>(() => {
    try {
      const value = JSON.parse(localStorage.getItem(`algodrishti-greedy-${lesson.id}`) ?? '[]')
      return Array.isArray(value) ? value.filter((item) => item && typeof item === 'object' && item.input && typeof item.input === 'object').slice(0, 5) : []
    } catch {
      return []
    }
  })
  const step = run.steps[cursor],
    state = (tab === 'Learn' ? run.steps.at(-1) : step)!.state!.greedy!,
    prediction = nextGreedyPrediction(run.steps, cursor),
    interactive = ['Visualization', 'Practice', 'Experiments'].includes(tab)
  const changed = JSON.stringify(fields) !== JSON.stringify(greedyFieldsFor(input))
  const source = useMemo(() => {
    const name = {
      'activity-selection': 'activitySelection',
      'fractional-knapsack': 'fractionalKnapsack',
      'job-sequencing': 'jobSequencing',
      'huffman-coding': 'huffman',
    }[lesson.id]!
    const start = designSource.indexOf(`export function ${name}(`),
      end = designSource.indexOf('\nexport function ', start + 1)
    return designSource.slice(start, end < 0 ? undefined : end)
  }, [lesson.id])
  function go(index: number) {
    setCursor(index)
    setPlaying(false)
    setFeedback('')
    setAnswer('')
    setInspected(undefined)
    setRevealed(false)
  }
  useEffect(() => {
    if (!playing || !interactive || cursor >= run.steps.length - 1) return
    const timer = window.setTimeout(() => {
      setCursor((c) => c + 1)
      if (cursor + 1 >= run.steps.length - 1) setPlaying(false)
      setFeedback('')
      setAnswer('')
      setRevealed(false)
    }, speed)
    return () => window.clearTimeout(timer)
  }, [playing, cursor, run.steps.length, speed, interactive])
  function compute(next: DaaInput) {
    try {
      const result = executeLesson(lesson, next)
      setInput(structuredClone(next))
      setFields(greedyFieldsFor(next))
      setRun(result)
      go(0)
      setError('')
      setNotice('')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Check inputs.')
      setPlaying(false)
    }
  }
  function save() {
    try {
      const next = [{ input }, ...saved].slice(0, 5)
      localStorage.setItem(`algodrishti-greedy-${lesson.id}`, JSON.stringify(next))
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
  return (
    <section className="learning-studio greedy-studio" aria-label={`${lesson.title} greedy studio`}>
      <header className="gr-heading">
        <div>
          <span className="ls-eyebrow">
            <Sparkles size={16} /> THE GREEDY DECISION LAB
          </span>
          <h2>{lesson.title}</h2>
          <p>{lesson.summary}</p>
        </div>
        <span className="ls-chip">
          {lesson.time} time · {lesson.space} space
        </span>
      </header>
      <div className="gr-recipe">
        {[
          ['01 · LOCAL CHOICE', profile.rule],
          ['02 · STAY FEASIBLE', profile.feasibility],
          ['03 · PRESERVE OPTIMALITY', profile.invariant],
        ].map(([title, text]) => (
          <article key={title}>
            <small>{title}</small>
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
              <p>{profile.rule} Unlike dynamic programming, this algorithm commits to one safe choice instead of evaluating every alternative.</p>
              <h4>Why this choice is safe</h4>
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
              <button
                onClick={() => {
                  compute(defaults)
                  onTab('Visualization')
                }}
              >
                Replay this worked example
              </button>
            </article>
            <article>
              <Lightbulb size={20} />
              <h3>Common mistake</h3>
              <p>{profile.pitfall}</p>
              <h4>Implementation tradeoff</h4>
              <p>{profile.tradeoff}</p>
            </article>
          </div>
          <h3>Current example, solved</h3>
          <p>This diagram reflects the last successful input. Open Visualization to edit and replay it.</p>
          <GreedyPicture lesson={lesson} input={input} state={state} onInspect={setInspected} />
          <div className="gr-result">
            <span>{lesson.id === 'activity-selection' ? 'Maximum count' : lesson.id === 'huffman-coding' ? 'Weighted code length' : 'Maximum profit'}</span>
            <strong>{fmt(state.objective)}</strong>
          </div>
          <button className="ls-primary" onClick={() => onTab('Visualization')}>
            <Play size={16} /> Explore this example
          </button>
        </>
      )}
      {interactive && (
        <>
          <section className="problem-input-panel learning-input-panel">
            <div className="gr-input-heading">
              <h3>Problem Input</h3>
              <label>
                Load a worked example
                <select
                  aria-label="Greedy example preset"
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
            <div className="gr-fields">
              {Object.entries(defaults).map(([key, value]) => (
                <label key={key}>
                  {greedyFields[key]}
                  {Array.isArray(value) ? (
                    <textarea
                      rows={5}
                      aria-label={`Greedy ${greedyFields[key]}`}
                      value={fields[key]}
                      onChange={(e) => {
                        setFields({ ...fields, [key]: e.target.value })
                        setPlaying(false)
                      }}
                    />
                  ) : (
                    <input
                      aria-label={`Greedy ${greedyFields[key]}`}
                      type={typeof value === 'number' ? 'number' : 'text'}
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
            <p className="gr-help">
              {
                {
                  'activity-selection': 'Enter 1–16 activities, each with start < finish. Touching endpoints are compatible.',
                  'fractional-knapsack':
                    'Enter 1–20 matching weights and profits. Weights must be positive integers; profits non-negative. Capacity: integer 0–100.',
                  'job-sequencing':
                    'Enter 1–20 matching profits and deadlines. Profits must be non-negative; deadlines: integers 0–20. Each job takes one time unit.',
                  'huffman-coding': 'Enter 1–20 positive frequencies, each at most 1,000,000.',
                }[lesson.id]
              }{' '}
              {lesson.id === 'huffman-coding'
                ? 'All frequencies must be positive. Symbols are labeled S0, S1, … in input order.'
                : 'Lists use commas or spaces. Original item IDs start at 0.'}
            </p>
            <div className="ls-operations">
              <button
                className="ls-primary"
                onClick={() => {
                  try {
                    compute(parseGreedyFields(fields, defaults))
                  } catch (e) {
                    setError(e instanceof Error ? e.message : 'Check inputs.')
                    setPlaying(false)
                  }
                }}
              >
                <Play size={16} />
                Run greedy example
              </button>
              <button onClick={() => compute(structuredClone(defaults))}>
                <RotateCcw size={16} />
                Reset default
              </button>
              <button onClick={save}>Save greedy example</button>
              <button onClick={exportTrace}>Export greedy trace</button>
            </div>
            {changed && <p role="status">Inputs edited. Run greedy example to apply changes; the diagram still shows the last successful run.</p>}
            {error && (
              <p className="ls-error" role="alert">
                {error}
              </p>
            )}
            {notice && <p role="status">{notice}</p>}
          </section>
          <div className="gr-workbench">
            <div>
              <div className="gr-legend">
                <span data-status="current">Current</span>
                <span data-status="accepted">Accepted</span>
                <span data-status="rejected">Rejected</span>
                <span>Waiting</span>
              </div>
              <GreedyPicture lesson={lesson} input={input} state={state} onInspect={setInspected} />
            </div>
            <aside className="gr-decision">
              <span className="ls-eyebrow">ONE SAFE CHOICE AT A TIME</span>
              <h3>
                Step {cursor + 1} of {run.steps.length}
              </h3>
              <p aria-live="polite">
                {step.type === 'complete' ? 'All choices are complete. Inspect the final solution below or replay the decisions.' : step.description}
              </p>
              <div className="gr-reason">{state.reason}</div>
              <div className="gr-result">
                <span>{lesson.id === 'activity-selection' ? 'Chosen count' : lesson.id === 'huffman-coding' ? 'Weighted bits so far' : 'Profit so far'}</span>
                <strong>{fmt(state.objective)}</strong>
              </div>
              <p>Phase: {step.type === 'complete' ? 'complete' : state.phase}</p>
              <h4>Proof checkpoint</h4>
              <p>{profile.invariant}</p>
            </aside>
          </div>
          <div className="gr-controls">
            <button aria-label="Replay greedy trace" onClick={() => go(0)}>
              <RotateCcw size={16} />
            </button>
            <button aria-label="Previous greedy step" disabled={cursor === 0} onClick={() => go(cursor - 1)}>
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
            <button aria-label="Next greedy step" disabled={cursor === run.steps.length - 1} onClick={() => go(cursor + 1)}>
              <ChevronRight size={16} />
            </button>
            <input type="range" aria-label="Greedy timeline" min={0} max={run.steps.length - 1} value={cursor} onChange={(e) => go(Number(e.target.value))} />
            <label>
              Speed
              <select aria-label="Greedy playback speed" value={speed} onChange={(e) => setSpeed(Number(e.target.value))}>
                <option value={1600}>Slow</option>
                <option value={900}>Normal</option>
                <option value={350}>Fast</option>
              </select>
            </label>
            <button onClick={() => go(run.steps.length - 1)}>Jump to solution</button>
          </div>
          <section className="gr-prediction">
            <Target size={22} />
            <div>
              <span className="ls-eyebrow">PREDICT BEFORE REVEALING</span>
              <h3>{prediction?.question ?? 'All decisions explored'}</h3>
              {prediction ? (
                <>
                  <p>Use the visible state and the greedy rule. Numeric answers accept decimals (tolerance 0.001%).</p>
                  <div className="ls-operations">
                    <label>
                      Your prediction
                      <input aria-label="Greedy prediction" value={answer} onChange={(e) => setAnswer(e.target.value)} />
                    </label>
                    <button
                      onClick={() => {
                        setPlaying(false)
                        setFeedback(
                          matchesGreedyAnswer(answer, prediction.answer)
                            ? `Correct. ${prediction.explanation}`
                            : 'Not yet. Check the ordering rule and remaining feasible choices, then try again.',
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
          {cursor === run.steps.length - 1 && (
            <div className="gr-final">
              <h3>Final solution</h3>
              <p>{state.reason}</p>
              {input.intervals && (
                <p>
                  Chosen activities: {state.selected.map((id) => `A${id}`).join(' → ')}. Maximum compatible count: <strong>{state.objective}</strong>.
                </p>
              )}
              {input.weights && (
                <p>
                  Take {state.fractions?.map((fraction, id) => `item ${id}: ${fmt(fraction * 100)}%`).join(' · ')}. Total profit:{' '}
                  <strong>{fmt(state.objective)}</strong>; used weight: {fmt(input.capacity! - (state.remaining ?? 0))}.
                </p>
              )}
              {input.deadlines && (
                <p>
                  Schedule: {state.slots?.map((id, i) => `slot ${i + 1}: ${id < 0 ? 'free' : `job ${id}`}`).join(' · ') || 'no feasible slots'}. Total profit:{' '}
                  <strong>{state.objective}</strong>.
                </p>
              )}
              {input.frequencies && (
                <p>
                  The codebook above uses <strong>{fmt(state.objective)} weighted bits</strong>, compared with{' '}
                  {fmt(input.frequencies.reduce((a, b) => a + b, 0) * Math.max(1, Math.ceil(Math.log2(input.frequencies.length))))} for a fixed-length binary
                  code ({Math.max(1, Math.ceil(Math.log2(input.frequencies.length)))} bits per symbol). Average length:{' '}
                  {fmt(state.objective / input.frequencies.reduce((a, b) => a + b, 0))} bits per symbol. Frequencies are counts, not percentages.
                </p>
              )}
            </div>
          )}
        </>
      )}
      {inspected !== undefined && ['Learn', 'Visualization', 'Practice', 'Experiments'].includes(tab) && (
        <MobileDisclosure className="ls-inspector" title="Inspect current state">
          <strong>Inspect #{inspected}</strong>
          <p>
            {input.intervals
              ? `Activity [${input.intervals[inspected].join(', ')}]`
              : input.weights
                ? `Weight ${input.weights[inspected]}, profit ${input.profits![inspected]}, ratio ${fmt(input.profits![inspected] / input.weights[inspected])}`
                : `Profit ${input.profits![inspected]}, deadline ${input.deadlines![inspected]}`}
          </p>
          <p>{state.selected.includes(inspected) ? 'Accepted' : state.rejected.includes(inspected) ? 'Rejected' : 'Not considered yet'}</p>
        </MobileDisclosure>
      )}
      {tab === 'Practice' && (
        <div className="gr-proof">
          <h3>Explain the boundary of the rule</h3>
          <p>{lesson.exercise.question}</p>
          <button onClick={() => setRevealed(!revealed)}>{revealed ? 'Hide reasoning' : 'Reveal reasoning'}</button>
          {revealed && <p>{lesson.exercise.answer}</p>}
          <h4>Proof checklist</h4>
          <ol>
            <li>Identify the greedy choice.</li>
            <li>Exchange it into an optimal solution without losing feasibility or value.</li>
            <li>Apply the same reasoning to the remaining subproblem.</li>
          </ol>
        </div>
      )}
      {tab === 'Code' && (
        <div className="gr-code">
          <h3>Algorithm recipe</h3>
          <ol>
            {lesson.pseudocode.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ol>
          <h3>Actual TypeScript implementation</h3>
          <p>This is the implementation generating the trace, including educational state snapshots.</p>
          <pre>
            <code>{source}</code>
          </pre>
          <h3>Complexity derivation</h3>
          <p>{lesson.derivation}</p>
        </div>
      )}
      {tab === 'Experiments' && (
        <div className="ls-experiments">
          <h3>Saved greedy examples</h3>
          {!saved.length && <p>No examples saved yet. Save the current successful input above, then compare a preset.</p>}
          {saved.map((s, i) => (
            <article key={i}>
              <code>{JSON.stringify(s.input)}</code>
              <button
                onClick={() => {
                  compute(s.input)
                  onTab('Visualization')
                }}
              >
                Load greedy example {i + 1}
              </button>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}

export function GreedySuiteLearning({ module, tab, onTab }: { module: AlgorithmModule; tab: LearningTab; onTab: (tab: LearningTab) => void }) {
  const [selected, setSelected] = useState('activity-selection')
  return (
    <div className="gr-suite">
      <section className="learning-studio gr-suite-intro">
        <span className="ls-eyebrow">CHOOSE · JUSTIFY · REPEAT</span>
        <h2>{module.name}</h2>
        <p>{module.summary}</p>
        {module.id === 'greedy-exchange' && (
          <div className="gr-exchange">
            <h3>The exchange argument</h3>
            <p>
              Start from an optimal solution. Replace its first choice with the greedy choice. Show that this replacement preserves feasibility and does not
              worsen the objective. Solve the smaller remaining problem in the same way.
            </p>
            <h4>Counterexample: optimal substructure is not enough</h4>
            <p>For coins [1,3,4], amount 6: largest-first chooses 4+1+1 (3 coins), but 3+3 uses 2. A local rule needs a proof, not just successful examples.</p>
            <p>
              Compare the safe exchange used in each of the four labs below. Fractional exchanges are legal in fractional knapsack, but not in 0/1 knapsack.
            </p>
          </div>
        )}
        <label>
          Choose a greedy concept
          <select aria-label="Greedy suite concept" value={selected} onChange={(e) => setSelected(e.target.value)}>
            {lessons.map((l) => (
              <option key={l.id} value={l.id}>
                {l.title}
              </option>
            ))}
          </select>
        </label>
        <nav className="gr-related" aria-label="Full greedy lessons">
          {lessons.map((l) => (
            <Link key={l.id} to={`/greedy/${l.id}`}>
              {l.title} →
            </Link>
          ))}
        </nav>
      </section>
      <GreedyLab key={selected} lesson={lessons.find((l) => l.id === selected)!} tab={tab} onTab={onTab} />
    </div>
  )
}
export function GreedyLessonPage({
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
    <div className="lesson-surface greedy-page daa-workspace compact-daa" data-learning-tab={tab}>
      <CompactLessonHeader
        title={module.name}
        description={module.summary}
        studied={completed.includes(module.id)}
        onStudy={() => toggleCompleted(module.id)}
        account={<AccountControl />}
      />
      <LessonTabs active={tab} onChange={setTab} />
      {lesson ? <GreedyLab lesson={lesson} tab={tab} onTab={setTab} /> : <GreedySuiteLearning module={module} tab={tab} onTab={setTab} />}
    </div>
  )
}
