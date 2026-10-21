import { ProblemInputPanel } from '../components/ProblemInputPanel'
import { MobileDisclosure } from '../components/MobileDisclosure'
import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, BarChart3, BookOpenCheck, ChevronLeft, ChevronRight, Gauge, Pause, Play, RotateCcw, Sparkles } from 'lucide-react'
import type { AlgorithmStep } from '../types'
import { StateView } from './DaaWorkspace'
import { ConceptStudio, RichLessonScene } from './TargetLessonScenes'
import { getTargetProfile } from './targetProfiles'
import { getTargetSample } from './targetSamples'
import { executeLesson, type DaaInput, type DaaRun, type LearningState, type Lesson } from './types'
import './target-lesson.css'

type TheoryStep = Pick<AlgorithmStep, 'id' | 'description' | 'pseudocodeLine'>
type RecordResult = Record<string, unknown>
const theorySteps = (lesson: Lesson): TheoryStep[] => [
  { id: 't0', description: `Define the model. ${lesson.summary}`, pseudocodeLine: 0 },
  { id: 't1', description: lesson.theory?.[0] ?? lesson.correctness, pseudocodeLine: 1 },
  { id: 't2', description: lesson.theory?.[1] ?? lesson.example, pseudocodeLine: 2 },
  { id: 't3', description: lesson.theory?.[2] ?? lesson.derivation, pseudocodeLine: 3 },
  { id: 't4', description: `Verify the worked example. ${lesson.example}`, pseudocodeLine: 4 },
]

function Growth({ n, step }: { n: number; step: number }) {
  const w = 760,
    h = 300,
    pad = 42,
    items = [
      ['O(1)', '#12b5cb', () => 1],
      ['O(log n)', '#1677ff', (x: number) => Math.log2(Math.max(1, x))],
      ['O(n)', '#15ad78', (x: number) => x],
      ['O(n log n)', '#f59e0b', (x: number) => x * Math.log2(Math.max(1, x))],
      ['O(n²)', '#ef4444', (x: number) => x * x],
      ['O(2ⁿ)', '#7c3aed', (x: number) => 2 ** Math.min(x, 18)],
    ] as const
  const max = Math.max(...items.map(([, , f]) => Math.log10(f(n) + 1)))
  const points = (f: (x: number) => number) =>
    Array.from({ length: 51 }, (_, i) => {
      const x = 1 + ((n - 1) * i) / 50
      return `${pad + (i / 50) * (w - pad * 2)},${h - pad - (Math.log10(f(x) + 1) / max) * (h - pad * 2)}`
    }).join(' ')
  return (
    <div className="tuv-growth">
      <svg viewBox={`0 0 ${w} ${h}`} role="img" aria-label="Asymptotic growth comparison">
        {[0, 1, 2, 3, 4].map((i) => (
          <line key={i} x1={pad} x2={w - pad} y1={pad + i * 53} y2={pad + i * 53} />
        ))}
        {items.map(([name, color, f], i) => (
          <polyline className={i === Math.min(5, step + 1) ? 'active' : ''} key={name} points={points(f)} style={{ stroke: color }} />
        ))}
        <text x={w / 2} y={h - 5}>
          n (input size 1…{n})
        </text>
      </svg>
      <div className="tuv-legend">
        {items.map(([name, color]) => (
          <span key={name}>
            <i style={{ background: color }} />
            {name}
          </span>
        ))}
      </div>
    </div>
  )
}

function Tree({ lesson, step }: { lesson: Lesson; step: number }) {
  const bb = lesson.category === 'Branch and Bound',
    nodes = [
      [360, 40],
      [210, 120],
      [510, 120],
      [125, 215],
      [290, 215],
      [430, 215],
      [595, 215],
    ]
  return (
    <svg className="tuv-tree" viewBox="0 0 720 300" role="img" aria-label={bb ? 'Branch-and-bound search tree' : 'Recursion tree'}>
      {nodes.map(([x, y], i) => {
        const parent = i ? Math.floor((i - 1) / 2) : -1,
          p = nodes[parent],
          active = i <= step + 1,
          pruned = bb && (i === 4 || i === 6)
        return (
          <g key={i}>
            {i > 0 && <line x1={p[0]} y1={p[1] + 22} x2={x} y2={y - 22} className={active ? 'active' : ''} />}
            <circle cx={x} cy={y} r="25" className={`${active ? 'active' : ''} ${pruned ? 'pruned' : ''}`} />
            <text x={x} y={y + 5}>
              {bb ? (pruned ? 'prune' : `b=${12 - i}`) : i === 0 ? 'T(n)' : `T(n/${i < 3 ? '2' : '4'})`}
            </text>
          </g>
        )
      })}
      <text x="360" y="285">
        {bb ? 'Prune only when the bound cannot beat the incumbent.' : 'Sum level costs; depth gives stack space.'}
      </text>
    </svg>
  )
}

function Complexity({ lesson, step }: { lesson: Lesson; step: number }) {
  if (lesson.id === 'p-np-classes')
    return (
      <div className="tuv-complexity-scene">
        <svg className="tuv-venn" viewBox="0 0 720 300" role="img" aria-label="Complexity classes">
          <ellipse cx="325" cy="150" rx="260" ry="125" />
          <ellipse cx="250" cy="150" rx="155" ry="88" />
          <ellipse cx="210" cy="150" rx="72" ry="45" />
          <path d="M390 32 C565 46 655 105 625 258 C530 282 440 267 365 238" />
          <text x="210" y="155">
            P
          </text>
          <text x="292" y="105">
            NP
          </text>
          <text x="395" y="168">
            NP-complete
          </text>
          <text x="525" y="225">
            NP-hard
          </text>
        </svg>
        <div className="tuv-classify">
          <b>Classify a problem</b>
          {['Graph connectivity — P', 'Integer factorization — NP', 'SAT — NP-complete', 'TSP optimization — NP-hard'].map((x, i) => (
            <span className={i === step % 4 ? 'active' : ''} key={x}>
              {x}
            </span>
          ))}
        </div>
      </div>
    )
  if (lesson.id === 'cook-levin')
    return (
      <div className="tuv-tableau">
        {Array.from({ length: 6 }, (_, r) => (
          <div key={r}>
            {Array.from({ length: 10 }, (_, c) => (
              <span className={r <= step && c === Math.min(8, r + 2) ? 'head' : ''} key={c}>
                {c === Math.min(8, r + 2) ? `q${r}` : (r + c) % 4 ? '0' : '1'}
              </span>
            ))}
          </div>
        ))}
        <p>Local clauses enforce every legal computation transition.</p>
      </div>
    )
  if (lesson.id.includes('reduction') || lesson.id.includes('sat'))
    return (
      <div className="tuv-reduction">
        <div>
          <b>Source instance</b>
          <span>(x ∨ y ∨ z)</span>
          <span>(¬x ∨ y ∨ w)</span>
        </div>
        <strong>
          polynomial
          <br />
          transform →
        </strong>
        <svg viewBox="0 0 300 180">
          {[
            [55, 45],
            [150, 30],
            [245, 45],
            [55, 135],
            [150, 150],
            [245, 135],
          ].map(([x, y], i) => (
            <g key={i}>
              <circle cx={x} cy={y} r="22" className={i === 1 || i === 4 ? 'chosen' : ''} />
              <text x={x} y={y + 5}>
                {['x', 'y', 'z', '¬x', 'y', 'w'][i]}
              </text>
            </g>
          ))}
        </svg>
        <div>
          <b>Certificate</b>
          <span className="success">✓ accepted iff source is yes</span>
        </div>
      </div>
    )
  return (
    <div className="tuv-proof-flow">
      {['Decision problem', 'Certificate', 'Polynomial verifier', 'Reduction', 'Correctness'].map((x, i) => (
        <div className={i <= step ? 'active' : ''} key={x}>
          <span>{i + 1}</span>
          <b>{x}</b>
          <small>{i === 0 ? 'yes / no' : i === 1 ? 'compact witness' : i === 2 ? 'check, do not search' : i === 3 ? 'preserve iff' : 'both directions'}</small>
        </div>
      ))}
    </div>
  )
}

function MaxSubarray({ input, result, state }: { input: DaaInput; result?: unknown; state?: LearningState }) {
  const values = state?.values?.filter((v): v is number => typeof v === 'number') ?? input.values ?? [],
    r = (result ?? {}) as RecordResult,
    start = Number(r.start ?? 0),
    end = Number(r.end ?? -1)
  return (
    <div className="tuv-subarray">
      <div className="tuv-array-row">
        {values.map((v, i) => (
          <div className={i >= start && i <= end ? 'chosen' : v < 0 ? 'negative' : ''} key={i}>
            <b>{v}</b>
            <small>{i}</small>
          </div>
        ))}
      </div>
      <div className="tuv-three-cases">
        <span>
          <b>Best left</b>solve 0…mid
        </span>
        <span>
          <b>Best crossing</b>suffix(left) + prefix(right)
        </span>
        <span className="success">
          <b>Chosen result</b>sum {String(r.sum ?? '—')} · range {start}…{end}
        </span>
      </div>
    </div>
  )
}
function Flow({ input, result, state }: { input: DaaInput; result?: unknown; state?: LearningState }) {
  const r = (result ?? {}) as RecordResult
  return (
    <div className="tuv-flow">
      <div className="tuv-flow-graphs">
        <section>
          <h4>
            Flow network <small>capacity graph</small>
          </h4>
          <StateView state={state?.graph ? { graph: state.graph } : undefined} />
        </section>
        <section>
          <h4>
            Residual graph <small>residual capacity</small>
          </h4>
          <StateView state={state?.table ? { table: state.table, rowLabels: Array.from({ length: input.vertices ?? 0 }, (_, i) => String(i)) } : undefined} />
        </section>
      </div>
      <div className="tuv-flow-result">
        <span>
          <small>Maximum flow</small>
          <b>{String(r.flow ?? '—')}</b>
        </span>
        <span>
          <small>Minimum cut</small>
          <b>{String(r.cutCapacity ?? '—')}</b>
        </span>
        <span>
          <small>Source side</small>
          <b>{JSON.stringify(r.sourceSide ?? [])}</b>
        </span>
      </div>
    </div>
  )
}
function Inversions({ input, result, state }: { input: DaaInput; result?: unknown; state?: LearningState }) {
  const a = input.values ?? [],
    m = Math.ceil(a.length / 2),
    left = [...a.slice(0, m)].sort((x, y) => x - y),
    right = [...a.slice(m)].sort((x, y) => x - y),
    r = (result ?? {}) as RecordResult,
    merged = state?.values ?? (r.sorted as unknown[]) ?? []
  return (
    <div className="tuv-inversions">
      <div className="tuv-halves">
        <section>
          <h4>Left half (sorted)</h4>
          <div>
            {left.map((v, i) => (
              <span key={i}>{v}</span>
            ))}
          </div>
        </section>
        <strong>merge + count</strong>
        <section className="right">
          <h4>Right half (sorted)</h4>
          <div>
            {right.map((v, i) => (
              <span key={i}>{v}</span>
            ))}
          </div>
        </section>
      </div>
      <div className="tuv-merge-row">
        <b>Merged state</b>
        {merged.map((v, i) => (
          <span key={i}>{String(v)}</span>
        ))}
        <em>{String(r.inversions ?? 0)} inversions</em>
      </div>
    </div>
  )
}
function Fft({ input, result }: { input: DaaInput; result?: unknown }) {
  const values = input.values ?? [],
    spectrum = (((result ?? {}) as RecordResult).spectrum ?? []) as number[][],
    w = 380,
    h = 170,
    point = (i: number, v: number) => ({ x: 25 + (i * (w - 50)) / Math.max(1, values.length - 1), y: h / 2 - v * 45 }),
    points = values
      .map((v, i) => {
        const q = point(i, v)
        return `${q.x},${q.y}`
      })
      .join(' ')
  return (
    <div className="tuv-fft">
      <section>
        <h4>Time-domain signal x[n]</h4>
        <svg viewBox={`0 0 ${w} ${h}`}>
          <line x1="20" x2={w - 15} y1={h / 2} y2={h / 2} />
          <polyline points={points} />
          {values.map((v, i) => {
            const q = point(i, v)
            return <circle key={i} cx={q.x} cy={q.y} r="5" />
          })}
        </svg>
      </section>
      <section>
        <h4>Frequency spectrum |X[k]|</h4>
        <svg viewBox={`0 0 ${w} ${h}`}>
          <line x1="20" x2={w - 15} y1={h - 24} y2={h - 24} />
          {spectrum.map(([re, im], i) => {
            const mag = Math.hypot(re, im),
              x = 25 + (i * (w - 50)) / Math.max(1, spectrum.length - 1),
              y = h - 24 - mag * 24
            return (
              <g key={i}>
                <line className="stem" x1={x} x2={x} y1={h - 24} y2={y} />
                <circle className="frequency" cx={x} cy={y} r="5" />
              </g>
            )
          })}
        </svg>
      </section>
      <div className="tuv-butterfly">
        <b>Radix-2 butterfly</b>
        {values.map((_, i) => (
          <span key={i}>
            x[{i}] → E/O → X[{i}]
          </span>
        ))}
      </div>
    </div>
  )
}
function Bins({ input, result }: { input: DaaInput; result?: unknown }) {
  const r = (result ?? {}) as RecordResult,
    bins = (r.bins ?? []) as number[][],
    cap = input.capacity ?? 1
  return (
    <div className="tuv-bins">
      <div className="tuv-sorted-items">
        <b>Items sorted decreasing</b>
        {[...(input.values ?? [])]
          .sort((a, b) => b - a)
          .map((v, i) => (
            <span key={i}>{v}</span>
          ))}
      </div>
      <div className="tuv-bin-grid">
        {bins.map((bin, i) => {
          const used = bin.reduce((s, v) => s + v, 0)
          return (
            <section key={i}>
              <h4>
                Bin {i + 1}
                <small>
                  {used}/{cap}
                </small>
              </h4>
              <div>
                {bin.map((v, j) => (
                  <span style={{ flex: v }} key={j}>
                    {v}
                  </span>
                ))}
              </div>
              <progress max={cap} value={used} />
            </section>
          )
        })}
      </div>
    </div>
  )
}
function Approx({ lesson, result, state }: { lesson: Lesson; result?: unknown; state?: LearningState }) {
  const r = (result ?? {}) as RecordResult,
    count = (r.cover as unknown[] | undefined)?.length ?? 6
  return (
    <div className="tuv-approx">
      <div>
        {state ? (
          <StateView state={state} />
        ) : (
          <div className="tuv-ratio">
            <span>Minimization</span>
            <b>ρ = ALG / OPT ≤ p</b>
            <span>Maximization</span>
            <b>ρ = OPT / ALG ≤ p</b>
          </div>
        )}
      </div>
      <section>
        <h4>Worst-case guarantee</h4>
        <div className="tuv-guarantee-bars">
          <span style={{ height: '45%' }}>OPT</span>
          <span style={{ height: `${Math.min(95, 45 + count * 5)}%` }}>ALG</span>
          <span style={{ height: '90%' }}>2 · OPT</span>
        </div>
        <p>
          {lesson.id === 'metric-tsp-approximation'
            ? 'Triangle inequality makes preorder shortcutting safe.'
            : 'A maximal matching lower-bounds OPT; both endpoints cost at most 2·OPT.'}
        </p>
      </section>
    </div>
  )
}
function Amortized({ n, step }: { n: number; step: number }) {
  const size = Math.min(8, 2 + step),
    cap = size <= 4 ? 4 : 8
  return (
    <div className="tuv-amortized">
      <section>
        <h4>
          Dynamic array · size {size} / capacity {cap}
        </h4>
        <div>
          {Array.from({ length: cap }, (_, i) => (
            <span className={i < size ? 'filled' : ''} key={i}>
              {i < size ? (i + 1) * 10 : ''}
            </span>
          ))}
        </div>
      </section>
      <div className="tuv-cost-chart">
        {Array.from({ length: Math.min(12, n / 2) }, (_, i) => {
          const cost = (i & (i + 1)) === 0 ? i + 2 : 1
          return (
            <span key={i} style={{ height: 12 + cost * 10 }}>
              <small>{cost}</small>
            </span>
          )
        })}
      </div>
      <p>Aggregate cost ≤ 2n; accounting and potential methods give O(1) amortized append.</p>
    </div>
  )
}

function Scene({ lesson, input, run, state, n, step }: { lesson: Lesson; input: DaaInput; run?: DaaRun; state?: LearningState; n: number; step: number }) {
  const kind = getTargetProfile(lesson.id).scene
  const rich = RichLessonScene({ lesson, input, state, result: run?.result, step })
  if (rich) return rich
  if (kind === 'growth') return <Growth n={n} step={step} />
  if (kind === 'tree') return <Tree lesson={lesson} step={step} />
  if (kind === 'complexity') return <Complexity lesson={lesson} step={step} />
  if (kind === 'maximum-subarray') return <MaxSubarray input={input} result={run?.result} state={state} />
  if (kind === 'flow') return <Flow input={input} result={run?.result} state={state} />
  if (kind === 'inversions') return <Inversions input={input} result={run?.result} state={state} />
  if (kind === 'fft') return <Fft input={input} result={run?.result} />
  if (kind === 'bin-packing') return <Bins input={input} result={run?.result} />
  if (kind === 'approximation') return <Approx lesson={lesson} result={run?.result} state={state} />
  if (kind === 'amortized') return <Amortized n={n} step={step} />
  if (kind === 'linear-programming')
    return (
      <svg className="tuv-lp" viewBox="0 0 720 300" role="img" aria-label="Linear programming feasible region">
        <path d="M70 260 L70 60 L300 60 L510 260 Z" />
        <line x1="70" y1="260" x2="650" y2="260" />
        <line x1="70" y1="280" x2="70" y2="25" />
        <line x1="145" y1="260" x2="560" y2="55" />
        <circle cx="300" cy="160" r="9" />
        <text x="315" y="155">
          optimal corner (2, 2): z = 10
        </text>
      </svg>
    )
  if (run) return <StateView state={state} />
  return <ConceptStudio lesson={lesson} step={step} />
}
function Result({ value }: { value: unknown }) {
  const s = JSON.stringify(value, null, 2)
  return <pre>{s?.length > 420 ? `${s.slice(0, 420)}…` : s}</pre>
}

export function TargetLessonVisualization({ lesson }: { lesson: Lesson }) {
  const profile = getTargetProfile(lesson.id),
    sample = getTargetSample(lesson.id, lesson.defaultInput),
    initial = useMemo(() => (lesson.run && lesson.defaultInput ? executeLesson(lesson, getTargetSample(lesson.id, lesson.defaultInput)) : undefined), [lesson])
  const [draft, setDraft] = useState(() => JSON.stringify(sample, null, 2)),
    [input, setInput] = useState<DaaInput>(() => structuredClone(sample)),
    [run, setRun] = useState(initial)
  const [index, setIndex] = useState(0),
    [playing, setPlaying] = useState(false),
    [speed, setSpeed] = useState(700),
    [error, setError] = useState(''),
    [n, setN] = useState(32),
    [showAnswer, setShowAnswer] = useState(false),
    [inputVersion, setInputVersion] = useState(0)
  const synthetic = useMemo(() => theorySteps(lesson), [lesson]),
    steps = run?.steps ?? synthetic,
    step = steps[Math.min(index, steps.length - 1)],
    algorithmStep = run?.steps[Math.min(index, run.steps.length - 1)],
    last = steps.length - 1
  useEffect(() => {
    if (!playing || index >= last) return
    const timer = window.setTimeout(() => {
      setIndex((v) => Math.min(last, v + 1))
      if (index + 1 >= last) setPlaying(false)
    }, speed)
    return () => window.clearTimeout(timer)
  }, [playing, index, last, speed])
  const execute = () => {
    if (!lesson.run) {
      setIndex(0)
      setPlaying(true)
      setError('')
      return
    }
    try {
      const next = JSON.parse(draft) as DaaInput
      const nextRun = executeLesson(lesson, next)
      setInput(next)
      setRun(nextRun)
      setIndex(0)
      setPlaying(true)
      setError('')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Invalid input')
      setPlaying(false)
    }
  }
  const reset = () => {
    const original = structuredClone(sample)
    setInputVersion((v) => v + 1)
    setDraft(JSON.stringify(original, null, 2))
    setInput(original)
    setRun(initial)
    setIndex(0)
    setPlaying(false)
    setError('')
    setShowAnswer(false)
  }
  const procedure = lesson.pseudocode.length
    ? lesson.pseudocode
    : ['Define assumptions', 'Build the mathematical model', 'Advance one valid state', 'Check the invariant', 'Conclude from the example']
  return (
    <section className="target-visual" data-target={profile.number} aria-label={`${lesson.title} interactive visualization`}>
      <header className="tuv-title">
        <div>
          <span>
            <BarChart3 /> {profile.eyebrow}
          </span>
          <h2>{lesson.title}</h2>
          <p>{lesson.summary}</p>
        </div>
        <div className="tuv-progress">
          <b>
            {index + 1}/{steps.length}
          </b>
          <span>computed states</span>
        </div>
      </header>
      <ProblemInputPanel
        key={inputVersion}
        draft={lesson.run ? draft : undefined}
        onChange={(next) => {
          setDraft(next)
          setPlaying(false)
          setError('')
        }}
        onRun={execute}
        onReset={reset}
        error={error}
        changed={!!lesson.run && draft !== JSON.stringify(input, null, 2)}
      >
        <label className="problem-example-size">
          Example size n
          <input
            aria-label="Example size"
            type="range"
            min="8"
            max="64"
            step="4"
            value={n}
            onChange={(e) => {
              setN(Number(e.target.value))
              setPlaying(false)
            }}
          />
          <output>{n}</output>
        </label>
      </ProblemInputPanel>
      <div className="tuv-controls">
        <button onClick={() => setIndex((v) => Math.max(0, v - 1))} aria-label="Step back">
          <ChevronLeft />
        </button>
        <button onClick={() => setPlaying((v) => !v)} aria-label={playing ? 'Pause' : 'Play'}>
          {playing ? <Pause /> : <Play />}
        </button>
        <button onClick={() => setIndex((v) => Math.min(last, v + 1))} aria-label="Step forward">
          <ChevronRight />
        </button>
        <button onClick={reset} aria-label="Reset">
          <RotateCcw /> Reset
        </button>
        <label>
          Speed
          <input
            aria-label="Animation speed"
            type="range"
            min="180"
            max="1400"
            value={1580 - speed}
            onChange={(e) => setSpeed(1580 - Number(e.target.value))}
          />
        </label>
      </div>
      {error && (
        <p className="tuv-error" role="alert">
          <AlertTriangle /> {error}
        </p>
      )}
      <div className="tuv-main">
        <article className="tuv-canvas">
          <div className="tuv-card-head">
            <div>
              <Sparkles />
              <b>{profile.panels[0]}</b>
            </div>
            <span>Step {index + 1}</span>
          </div>
          <div className="tuv-stage">
            <Scene lesson={lesson} input={input} run={run} state={algorithmStep?.state} n={n} step={index} />
          </div>
          <p className="tuv-narration" aria-live="polite">
            {step?.description}
          </p>
        </article>
        <MobileDisclosure className="tuv-inspector" title="Step details">
          <h3>
            <Gauge /> {profile.panels[1]}
          </h3>
          <div className="tuv-timeline">
            {steps.map((_, i) => (
              <button
                aria-label={`Go to step ${i + 1}`}
                className={i === index ? 'active' : i < index ? 'done' : ''}
                onClick={() => {
                  setPlaying(false)
                  setIndex(i)
                }}
                key={i}
              >
                {i + 1}
              </button>
            ))}
          </div>
          <h3>Procedure</h3>
          <ol>
            {procedure.map((line, i) => (
              <li className={step?.pseudocodeLine === i ? 'active' : ''} key={i}>
                {line}
              </li>
            ))}
          </ol>
        </MobileDisclosure>
      </div>
      <div className="tuv-summary">
        <article>
          <h3>
            <BookOpenCheck /> {profile.panels[2]}
          </h3>
          {run ? <Result value={run.result} /> : <p>{lesson.example}</p>}
        </article>
        <article>
          <h3>Correctness</h3>
          <p>{lesson.correctness}</p>
        </article>
        <article>
          <h3>Complexity</h3>
          <div className="tuv-complexity">
            <span>
              <b>{lesson.time}</b>Time
            </span>
            <span>
              <b>{lesson.space}</b>Space
            </span>
          </div>
          <p>{lesson.derivation}</p>
        </article>
        <article className="warning">
          <h3>Key insight & pitfalls</h3>
          <p>{lesson.constraints}</p>
          <p>
            <b>Check yourself:</b> {lesson.exercise.question}
          </p>
        </article>
      </div>
      <MobileDisclosure className="tuv-learning-deck" title="Learning guide">
        <article>
          <span className="tuv-deck-kicker">01 · Understand</span>
          <h3>Theory in plain language</h3>
          <p>{lesson.summary}</p>
          <ul>
            {(lesson.theory?.length ? lesson.theory : [lesson.correctness, lesson.derivation]).slice(0, 3).map((point, i) => (
              <li key={i}>{point}</li>
            ))}
          </ul>
        </article>
        <article>
          <span className="tuv-deck-kicker">02 · Follow</span>
          <h3>Worked example</h3>
          <p>{lesson.example}</p>
          <ol>
            {procedure.slice(0, 4).map((line, i) => (
              <li key={i}>
                <b>{i + 1}</b>
                {line}
              </li>
            ))}
          </ol>
        </article>
        <article>
          <span className="tuv-deck-kicker">03 · Prove</span>
          <h3>Invariant and guarantee</h3>
          <p>{lesson.correctness}</p>
          <div className="tuv-proof-badge">
            <b>{lesson.time}</b> time <span>·</span> <b>{lesson.space}</b> space
          </div>
        </article>
        <article className="tuv-practice-card">
          <span className="tuv-deck-kicker">04 · Try</span>
          <h3>Check your understanding</h3>
          <p>{lesson.exercise.question}</p>
          <button onClick={() => setShowAnswer((value) => !value)}>{showAnswer ? 'Hide answer' : 'Reveal answer'}</button>
          {showAnswer && (
            <p className="tuv-answer" role="status">
              {lesson.exercise.answer}
            </p>
          )}
        </article>
      </MobileDisclosure>
    </section>
  )
}
