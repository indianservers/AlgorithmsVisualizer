// @localized-render
import { tx, useLocaleRender } from '../i18n/render'
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
  useLocaleRender()

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
      <svg viewBox={`0 0 ${w} ${h}`} role="img" aria-label={tx('Asymptotic growth comparison', 'studios')}>
        {tx(
          [0, 1, 2, 3, 4].map((i) => <line key={i} x1={pad} x2={w - pad} y1={pad + i * 53} y2={pad + i * 53} />),
          'studios',
        )}
        {tx(
          items.map(([name, color, f], i) => (
            <polyline className={i === Math.min(5, step + 1) ? 'active' : ''} key={name} points={points(f)} style={{ stroke: color }} />
          )),
          'studios',
        )}
        <text x={w / 2} y={h - 5}>
          {tx('n (input size 1…', 'studios')}
          {tx(n, 'studios')})
        </text>
      </svg>
      <div className="tuv-legend">
        {tx(
          items.map(([name, color]) => (
            <span key={name}>
              <i style={{ background: color }} />
              {tx(name, 'studios')}
            </span>
          )),
          'studios',
        )}
      </div>
    </div>
  )
}

function Tree({ lesson, step }: { lesson: Lesson; step: number }) {
  useLocaleRender()

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
    <svg className="tuv-tree" viewBox="0 0 720 300" role="img" aria-label={tx(bb ? 'Branch-and-bound search tree' : 'Recursion tree', 'studios')}>
      {tx(
        nodes.map(([x, y], i) => {
          const parent = i ? Math.floor((i - 1) / 2) : -1,
            p = nodes[parent],
            active = i <= step + 1,
            pruned = bb && (i === 4 || i === 6)
          return (
            <g key={i}>
              {tx(i > 0 && <line x1={p[0]} y1={p[1] + 22} x2={x} y2={y - 22} className={active ? 'active' : ''} />, 'studios')}
              <circle cx={x} cy={y} r="25" className={`${active ? 'active' : ''} ${pruned ? 'pruned' : ''}`} />
              <text x={x} y={y + 5}>
                {tx(bb ? (pruned ? 'prune' : `b=${12 - i}`) : i === 0 ? 'T(n)' : `T(n/${i < 3 ? '2' : '4'})`, 'studios')}
              </text>
            </g>
          )
        }),
        'studios',
      )}
      <text x="360" y="285">
        {tx(bb ? 'Prune only when the bound cannot beat the incumbent.' : 'Sum level costs; depth gives stack space.', 'studios')}
      </text>
    </svg>
  )
}

function Complexity({ lesson, step }: { lesson: Lesson; step: number }) {
  useLocaleRender()

  if (lesson.id === 'p-np-classes')
    return (
      <div className="tuv-complexity-scene">
        <svg className="tuv-venn" viewBox="0 0 720 300" role="img" aria-label={tx('Complexity classes', 'studios')}>
          <ellipse cx="325" cy="150" rx="260" ry="125" />
          <ellipse cx="250" cy="150" rx="155" ry="88" />
          <ellipse cx="210" cy="150" rx="72" ry="45" />
          <path d="M390 32 C565 46 655 105 625 258 C530 282 440 267 365 238" />
          <text x="210" y="155">
            {tx('P', 'studios')}
          </text>
          <text x="292" y="105">
            {tx('NP', 'studios')}
          </text>
          <text x="395" y="168">
            {tx('NP-complete', 'studios')}
          </text>
          <text x="525" y="225">
            {tx('NP-hard', 'studios')}
          </text>
        </svg>
        <div className="tuv-classify">
          <b>{tx('Classify a problem', 'studios')}</b>
          {tx(
            ['Graph connectivity — P', 'Integer factorization — NP', 'SAT — NP-complete', 'TSP optimization — NP-hard'].map((x, i) => (
              <span className={i === step % 4 ? 'active' : ''} key={x}>
                {x}
              </span>
            )),
            'studios',
          )}
        </div>
      </div>
    )
  if (lesson.id === 'cook-levin')
    return (
      <div className="tuv-tableau">
        {tx(
          Array.from({ length: 6 }, (_, r) => (
            <div key={r}>
              {tx(
                Array.from({ length: 10 }, (_, c) => (
                  <span className={r <= step && c === Math.min(8, r + 2) ? 'head' : ''} key={c}>
                    {tx(c === Math.min(8, r + 2) ? `q${r}` : (r + c) % 4 ? '0' : '1', 'studios')}
                  </span>
                )),
                'studios',
              )}
            </div>
          )),
          'studios',
        )}
        <p>{tx('Local clauses enforce every legal computation transition.', 'studios')}</p>
      </div>
    )
  if (lesson.id.includes('reduction') || lesson.id.includes('sat'))
    return (
      <div className="tuv-reduction">
        <div>
          <b>{tx('Source instance', 'studios')}</b>
          <span>{tx('(x ∨ y ∨ z)', 'studios')}</span>
          <span>{tx('(¬x ∨ y ∨ w)', 'studios')}</span>
        </div>
        <strong>
          {tx('polynomial', 'studios')}
          <br />
          {tx('transform →', 'studios')}
        </strong>
        <svg viewBox="0 0 300 180">
          {tx(
            [
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
                  {tx(['x', 'y', 'z', '¬x', 'y', 'w'][i], 'studios')}
                </text>
              </g>
            )),
            'studios',
          )}
        </svg>
        <div>
          <b>{tx('Certificate', 'studios')}</b>
          <span className="success">{tx('✓ accepted iff source is yes', 'studios')}</span>
        </div>
      </div>
    )
  return (
    <div className="tuv-proof-flow">
      {tx(
        ['Decision problem', 'Certificate', 'Polynomial verifier', 'Reduction', 'Correctness'].map((x, i) => (
          <div className={i <= step ? 'active' : ''} key={x}>
            <span>{tx(i + 1, 'studios')}</span>
            <b>{x}</b>
            <small>
              {tx(
                i === 0 ? 'yes / no' : i === 1 ? 'compact witness' : i === 2 ? 'check, do not search' : i === 3 ? 'preserve iff' : 'both directions',
                'studios',
              )}
            </small>
          </div>
        )),
        'studios',
      )}
    </div>
  )
}

function MaxSubarray({ input, result, state }: { input: DaaInput; result?: unknown; state?: LearningState }) {
  useLocaleRender()

  const values = state?.values?.filter((v): v is number => typeof v === 'number') ?? input.values ?? [],
    r = (result ?? {}) as RecordResult,
    start = Number(r.start ?? 0),
    end = Number(r.end ?? -1)
  return (
    <div className="tuv-subarray">
      <div className="tuv-array-row">
        {tx(
          values.map((v, i) => (
            <div className={i >= start && i <= end ? 'chosen' : v < 0 ? 'negative' : ''} key={i}>
              <b>{tx(v, 'studios')}</b>
              <small>{tx(i, 'studios')}</small>
            </div>
          )),
          'studios',
        )}
      </div>
      <div className="tuv-three-cases">
        <span>
          <b>{tx('Best left', 'studios')}</b>
          {tx('solve 0…mid', 'studios')}
        </span>
        <span>
          <b>{tx('Best crossing', 'studios')}</b>
          {tx('suffix(left) + prefix(right)', 'studios')}
        </span>
        <span className="success">
          <b>{tx('Chosen result', 'studios')}</b>
          {tx('sum ', 'studios')}
          {tx(String(r.sum ?? '—'), 'studios')}
          {tx(' · range ', 'studios')}
          {tx(start, 'studios')}…{tx(end, 'studios')}
        </span>
      </div>
    </div>
  )
}
function Flow({ input, result, state }: { input: DaaInput; result?: unknown; state?: LearningState }) {
  useLocaleRender()

  const r = (result ?? {}) as RecordResult
  return (
    <div className="tuv-flow">
      <div className="tuv-flow-graphs">
        <section>
          <h4>
            {tx('Flow network ', 'studios')}
            <small>{tx('capacity graph', 'studios')}</small>
          </h4>
          <StateView state={state?.graph ? { graph: state.graph } : undefined} />
        </section>
        <section>
          <h4>
            {tx('Residual graph ', 'studios')}
            <small>{tx('residual capacity', 'studios')}</small>
          </h4>
          <StateView state={state?.table ? { table: state.table, rowLabels: Array.from({ length: input.vertices ?? 0 }, (_, i) => String(i)) } : undefined} />
        </section>
      </div>
      <div className="tuv-flow-result">
        <span>
          <small>{tx('Maximum flow', 'studios')}</small>
          <b>{tx(String(r.flow ?? '—'), 'studios')}</b>
        </span>
        <span>
          <small>{tx('Minimum cut', 'studios')}</small>
          <b>{tx(String(r.cutCapacity ?? '—'), 'studios')}</b>
        </span>
        <span>
          <small>{tx('Source side', 'studios')}</small>
          <b>{tx(JSON.stringify(r.sourceSide ?? []), 'studios')}</b>
        </span>
      </div>
    </div>
  )
}
function Inversions({ input, result, state }: { input: DaaInput; result?: unknown; state?: LearningState }) {
  useLocaleRender()

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
          <h4>{tx('Left half (sorted)', 'studios')}</h4>
          <div>
            {tx(
              left.map((v, i) => <span key={i}>{tx(v, 'studios')}</span>),
              'studios',
            )}
          </div>
        </section>
        <strong>{tx('merge + count', 'studios')}</strong>
        <section className="right">
          <h4>{tx('Right half (sorted)', 'studios')}</h4>
          <div>
            {tx(
              right.map((v, i) => <span key={i}>{tx(v, 'studios')}</span>),
              'studios',
            )}
          </div>
        </section>
      </div>
      <div className="tuv-merge-row">
        <b>{tx('Merged state', 'studios')}</b>
        {tx(
          merged.map((v, i) => <span key={i}>{tx(String(v), 'studios')}</span>),
          'studios',
        )}
        <em>
          {tx(String(r.inversions ?? 0), 'studios')}
          {tx(' inversions', 'studios')}
        </em>
      </div>
    </div>
  )
}
function Fft({ input, result }: { input: DaaInput; result?: unknown }) {
  useLocaleRender()

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
        <h4>{tx('Time-domain signal x[n]', 'studios')}</h4>
        <svg viewBox={`0 0 ${w} ${h}`}>
          <line x1="20" x2={w - 15} y1={h / 2} y2={h / 2} />
          <polyline points={points} />
          {tx(
            values.map((v, i) => {
              const q = point(i, v)
              return <circle key={i} cx={q.x} cy={q.y} r="5" />
            }),
            'studios',
          )}
        </svg>
      </section>
      <section>
        <h4>{tx('Frequency spectrum |X[k]|', 'studios')}</h4>
        <svg viewBox={`0 0 ${w} ${h}`}>
          <line x1="20" x2={w - 15} y1={h - 24} y2={h - 24} />
          {tx(
            spectrum.map(([re, im], i) => {
              const mag = Math.hypot(re, im),
                x = 25 + (i * (w - 50)) / Math.max(1, spectrum.length - 1),
                y = h - 24 - mag * 24
              return (
                <g key={i}>
                  <line className="stem" x1={x} x2={x} y1={h - 24} y2={y} />
                  <circle className="frequency" cx={x} cy={y} r="5" />
                </g>
              )
            }),
            'studios',
          )}
        </svg>
      </section>
      <div className="tuv-butterfly">
        <b>{tx('Radix-2 butterfly', 'studios')}</b>
        {tx(
          values.map((_, i) => (
            <span key={i}>
              {tx('x[', 'studios')}
              {tx(i, 'studios')}
              {tx('] → E/O → X[', 'studios')}
              {tx(i, 'studios')}]
            </span>
          )),
          'studios',
        )}
      </div>
    </div>
  )
}
function Bins({ input, result }: { input: DaaInput; result?: unknown }) {
  useLocaleRender()

  const r = (result ?? {}) as RecordResult,
    bins = (r.bins ?? []) as number[][],
    cap = input.capacity ?? 1
  return (
    <div className="tuv-bins">
      <div className="tuv-sorted-items">
        <b>{tx('Items sorted decreasing', 'studios')}</b>
        {tx(
          [...(input.values ?? [])].sort((a, b) => b - a).map((v, i) => <span key={i}>{tx(v, 'studios')}</span>),
          'studios',
        )}
      </div>
      <div className="tuv-bin-grid">
        {tx(
          bins.map((bin, i) => {
            const used = bin.reduce((s, v) => s + v, 0)
            return (
              <section key={i}>
                <h4>
                  {tx('Bin ', 'studios')}
                  {tx(i + 1, 'studios')}
                  <small>
                    {tx(used, 'studios')}/{tx(cap, 'studios')}
                  </small>
                </h4>
                <div>
                  {tx(
                    bin.map((v, j) => (
                      <span style={{ flex: v }} key={j}>
                        {tx(v, 'studios')}
                      </span>
                    )),
                    'studios',
                  )}
                </div>
                <progress max={cap} value={used} />
              </section>
            )
          }),
          'studios',
        )}
      </div>
    </div>
  )
}
function Approx({ lesson, result, state }: { lesson: Lesson; result?: unknown; state?: LearningState }) {
  useLocaleRender()

  const r = (result ?? {}) as RecordResult,
    count = (r.cover as unknown[] | undefined)?.length ?? 6
  return (
    <div className="tuv-approx">
      <div>
        {tx(
          state ? (
            <StateView state={state} />
          ) : (
            <div className="tuv-ratio">
              <span>{tx('Minimization', 'studios')}</span>
              <b>{tx('ρ = ALG / OPT ≤ p', 'studios')}</b>
              <span>{tx('Maximization', 'studios')}</span>
              <b>{tx('ρ = OPT / ALG ≤ p', 'studios')}</b>
            </div>
          ),
          'studios',
        )}
      </div>
      <section>
        <h4>{tx('Worst-case guarantee', 'studios')}</h4>
        <div className="tuv-guarantee-bars">
          <span style={{ height: '45%' }}>{tx('OPT', 'studios')}</span>
          <span style={{ height: `${Math.min(95, 45 + count * 5)}%` }}>{tx('ALG', 'studios')}</span>
          <span style={{ height: '90%' }}>{tx('2 · OPT', 'studios')}</span>
        </div>
        <p>
          {tx(
            lesson.id === 'metric-tsp-approximation'
              ? 'Triangle inequality makes preorder shortcutting safe.'
              : 'A maximal matching lower-bounds OPT; both endpoints cost at most 2·OPT.',
            'studios',
          )}
        </p>
      </section>
    </div>
  )
}
function Amortized({ n, step }: { n: number; step: number }) {
  useLocaleRender()

  const size = Math.min(8, 2 + step),
    cap = size <= 4 ? 4 : 8
  return (
    <div className="tuv-amortized">
      <section>
        <h4>
          {tx('Dynamic array · size ', 'studios')}
          {tx(size, 'studios')}
          {tx(' / capacity ', 'studios')}
          {tx(cap, 'studios')}
        </h4>
        <div>
          {tx(
            Array.from({ length: cap }, (_, i) => (
              <span className={i < size ? 'filled' : ''} key={i}>
                {tx(i < size ? (i + 1) * 10 : '', 'studios')}
              </span>
            )),
            'studios',
          )}
        </div>
      </section>
      <div className="tuv-cost-chart">
        {tx(
          Array.from({ length: Math.min(12, n / 2) }, (_, i) => {
            const cost = (i & (i + 1)) === 0 ? i + 2 : 1
            return (
              <span key={i} style={{ height: 12 + cost * 10 }}>
                <small>{tx(cost, 'studios')}</small>
              </span>
            )
          }),
          'studios',
        )}
      </div>
      <p>{tx('Aggregate cost ≤ 2n; accounting and potential methods give O(1) amortized append.', 'studios')}</p>
    </div>
  )
}

function Scene({ lesson, input, run, state, n, step }: { lesson: Lesson; input: DaaInput; run?: DaaRun; state?: LearningState; n: number; step: number }) {
  useLocaleRender()

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
      <svg className="tuv-lp" viewBox="0 0 720 300" role="img" aria-label={tx('Linear programming feasible region', 'studios')}>
        <path d="M70 260 L70 60 L300 60 L510 260 Z" />
        <line x1="70" y1="260" x2="650" y2="260" />
        <line x1="70" y1="280" x2="70" y2="25" />
        <line x1="145" y1="260" x2="560" y2="55" />
        <circle cx="300" cy="160" r="9" />
        <text x="315" y="155">
          {tx('optimal corner (2, 2): z = 10', 'studios')}
        </text>
      </svg>
    )
  if (run) return <StateView state={state} />
  return <ConceptStudio lesson={lesson} step={step} />
}
function Result({ value }: { value: unknown }) {
  useLocaleRender()

  const s = JSON.stringify(value, null, 2)
  return <pre>{s?.length > 420 ? `${s.slice(0, 420)}…` : s}</pre>
}

export function TargetLessonVisualization({ lesson }: { lesson: Lesson }) {
  useLocaleRender()

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
    <section className="target-visual" data-target={profile.number} aria-label={tx(`${lesson.title} interactive visualization`, 'studios')}>
      <header className="tuv-title">
        <div>
          <span>
            <BarChart3 /> {tx(profile.eyebrow, 'studios')}
          </span>
          <h2>{tx(lesson.title, 'studios')}</h2>
          <p>{tx(lesson.summary, 'studios')}</p>
        </div>
        <div className="tuv-progress">
          <b>
            {tx(index + 1, 'studios')}/{tx(steps.length, 'studios')}
          </b>
          <span>{tx('computed states', 'studios')}</span>
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
          {tx('Example size n', 'studios')}
          <input
            aria-label={tx('Example size', 'studios')}
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
          <output>{tx(n, 'studios')}</output>
        </label>
      </ProblemInputPanel>
      <div className="tuv-controls">
        <button onClick={() => setIndex((v) => Math.max(0, v - 1))} aria-label={tx('Step back', 'studios')}>
          <ChevronLeft />
        </button>
        <button onClick={() => setPlaying((v) => !v)} aria-label={tx(playing ? 'Pause' : 'Play', 'studios')}>
          {tx(playing ? <Pause /> : <Play />, 'studios')}
        </button>
        <button onClick={() => setIndex((v) => Math.min(last, v + 1))} aria-label={tx('Step forward', 'studios')}>
          <ChevronRight />
        </button>
        <button onClick={reset} aria-label={tx('Reset', 'studios')}>
          <RotateCcw />
          {tx(' Reset', 'studios')}
        </button>
        <label>
          {tx('Speed', 'studios')}
          <input
            aria-label={tx('Animation speed', 'studios')}
            type="range"
            min="180"
            max="1400"
            value={1580 - speed}
            onChange={(e) => setSpeed(1580 - Number(e.target.value))}
          />
        </label>
      </div>
      {tx(
        error && (
          <p className="tuv-error" role="alert">
            <AlertTriangle /> {tx(error, 'studios')}
          </p>
        ),
        'studios',
      )}
      <div className="tuv-main">
        <article className="tuv-canvas">
          <div className="tuv-card-head">
            <div>
              <Sparkles />
              <b>{tx(profile.panels[0], 'studios')}</b>
            </div>
            <span>
              {tx('Step ', 'studios')}
              {tx(index + 1, 'studios')}
            </span>
          </div>
          <div className="tuv-stage">
            <Scene lesson={lesson} input={input} run={run} state={algorithmStep?.state} n={n} step={index} />
          </div>
          <p className="tuv-narration" aria-live="polite">
            {tx(step?.description, 'studios')}
          </p>
        </article>
        <MobileDisclosure className="tuv-inspector" title={tx('Step details', 'studios')}>
          <h3>
            <Gauge /> {tx(profile.panels[1], 'studios')}
          </h3>
          <div className="tuv-timeline">
            {tx(
              steps.map((_, i) => (
                <button
                  aria-label={tx(`Go to step ${i + 1}`, 'studios')}
                  className={i === index ? 'active' : i < index ? 'done' : ''}
                  onClick={() => {
                    setPlaying(false)
                    setIndex(i)
                  }}
                  key={i}
                >
                  {tx(i + 1, 'studios')}
                </button>
              )),
              'studios',
            )}
          </div>
          <h3>{tx('Procedure', 'studios')}</h3>
          <ol>
            {tx(
              procedure.map((line, i) => (
                <li className={step?.pseudocodeLine === i ? 'active' : ''} key={i}>
                  {tx(line, 'studios')}
                </li>
              )),
              'studios',
            )}
          </ol>
        </MobileDisclosure>
      </div>
      <div className="tuv-summary">
        <article>
          <h3>
            <BookOpenCheck /> {tx(profile.panels[2], 'studios')}
          </h3>
          {tx(run ? <Result value={run.result} /> : <p>{tx(lesson.example, 'studios')}</p>, 'studios')}
        </article>
        <article>
          <h3>{tx('Correctness', 'studios')}</h3>
          <p>{tx(lesson.correctness, 'studios')}</p>
        </article>
        <article>
          <h3>{tx('Complexity', 'studios')}</h3>
          <div className="tuv-complexity">
            <span>
              <b>{tx(lesson.time, 'studios')}</b>
              {tx('Time', 'studios')}
            </span>
            <span>
              <b>{tx(lesson.space, 'studios')}</b>
              {tx('Space', 'studios')}
            </span>
          </div>
          <p>{tx(lesson.derivation, 'studios')}</p>
        </article>
        <article className="warning">
          <h3>{tx('Key insight & pitfalls', 'studios')}</h3>
          <p>{tx(lesson.constraints, 'studios')}</p>
          <p>
            <b>{tx('Check yourself:', 'studios')}</b> {tx(lesson.exercise.question, 'studios')}
          </p>
        </article>
      </div>
      <MobileDisclosure className="tuv-learning-deck" title={tx('Learning guide', 'studios')}>
        <article>
          <span className="tuv-deck-kicker">{tx('01 · Understand', 'studios')}</span>
          <h3>{tx('Theory in plain language', 'studios')}</h3>
          <p>{tx(lesson.summary, 'studios')}</p>
          <ul>
            {tx(
              (lesson.theory?.length ? lesson.theory : [lesson.correctness, lesson.derivation])
                .slice(0, 3)
                .map((point, i) => <li key={i}>{tx(point, 'studios')}</li>),
              'studios',
            )}
          </ul>
        </article>
        <article>
          <span className="tuv-deck-kicker">{tx('02 · Follow', 'studios')}</span>
          <h3>{tx('Worked example', 'studios')}</h3>
          <p>{tx(lesson.example, 'studios')}</p>
          <ol>
            {tx(
              procedure.slice(0, 4).map((line, i) => (
                <li key={i}>
                  <b>{tx(i + 1, 'studios')}</b>
                  {tx(line, 'studios')}
                </li>
              )),
              'studios',
            )}
          </ol>
        </article>
        <article>
          <span className="tuv-deck-kicker">{tx('03 · Prove', 'studios')}</span>
          <h3>{tx('Invariant and guarantee', 'studios')}</h3>
          <p>{tx(lesson.correctness, 'studios')}</p>
          <div className="tuv-proof-badge">
            <b>{tx(lesson.time, 'studios')}</b>
            {tx(' time ', 'studios')}
            <span>·</span> <b>{tx(lesson.space, 'studios')}</b>
            {tx(' space', 'studios')}
          </div>
        </article>
        <article className="tuv-practice-card">
          <span className="tuv-deck-kicker">{tx('04 · Try', 'studios')}</span>
          <h3>{tx('Check your understanding', 'studios')}</h3>
          <p>{tx(lesson.exercise.question, 'studios')}</p>
          <button onClick={() => setShowAnswer((value) => !value)}>{tx(showAnswer ? 'Hide answer' : 'Reveal answer', 'studios')}</button>
          {tx(
            showAnswer && (
              <p className="tuv-answer" role="status">
                {tx(lesson.exercise.answer, 'studios')}
              </p>
            ),
            'studios',
          )}
        </article>
      </MobileDisclosure>
    </section>
  )
}
