// @localized-render
import { useEffect, useId, useState, type ReactNode } from 'react'
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  BookOpen,
  Check,
  ChevronRight,
  Clock3,
  Code2,
  Database,
  FileText,
  LineChart,
  Pause,
  Pencil,
  Play,
  RotateCcw,
  Settings,
  Sigma,
  Trophy,
} from 'lucide-react'
import { tx, useLocaleRender } from '../i18n/render'
import { usePersistentState, persistentString } from '../hooks/usePersistentState'
import { MockupLessonChrome, type MockupPageProps } from './MockupLessonChrome'
import {
  growthPlot,
  growthSeries,
  growthValue,
  loopSummary,
  recursionTrace,
  type GrowthSeries,
  type LoopPattern,
  type RecursionFunction,
} from './loopRecursionModel'
import './loop-recursion-mockup.css'

const tr = (s: string) => tx(s, 'studios')
const tabs = ['Learn', 'Visualize', 'Practice', 'Quiz', 'Notes'] as const
const tabIcons = [BookOpen, LineChart, Pencil, Trophy, FileText]
function Panel({
  title,
  description,
  icon,
  children,
  className = '',
}: {
  title: string
  description?: string
  icon: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <section className={`mom-panel lr-panel ${className}`}>
      <header>
        <span className="lr-icon">{icon}</span>
        <div>
          <h2>{tr(title)}</h2>
          {description && <p>{tr(description)}</p>}
        </div>
      </header>
      {children}
    </section>
  )
}
function HeroArt() {
  const id = useId()
  return (
    <svg className="lr-hero-art" viewBox="0 0 260 137" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id={id} x2="0" y2="1">
          <stop stopColor="#8bbfff" />
          <stop offset="1" stopColor="#d5ecff" stopOpacity=".5" />
        </linearGradient>
      </defs>
      <path d="M0 137C26 101 30 4 56 57S106 33 134 65 195 5 222 33 247 24 260 32V137Z" fill={`url(#${id})`} />
      <path d="M0 137C43 73 42 87 66 118S120 60 165 69 216 146 260 80" fill="none" stroke="#0676ff" strokeWidth="1.6" />
      <circle cx="165" cy="69" r="6" fill="#087aff" stroke="white" strokeWidth="2" />
      <rect x="162" y="15" width="49" height="36" rx="9" fill="#e0efff" stroke="#cce3ff" />
      <text x="186" y="38" textAnchor="middle" fill="#0071ff" fontSize="16">
        {'T(n)'}
      </text>
    </svg>
  )
}
const patterns: { id: LoopPattern; label: string }[] = [
  { id: 'nested', label: 'Square nested loops' },
  { id: 'triangular', label: 'Triangular nested loops' },
  { id: 'doubling', label: 'Doubling loop' },
]
export function LoopRecursionMockupLesson(props: MockupPageProps) {
  useLocaleRender()
  const [tab, setTab] = useState<(typeof tabs)[number]>('Learn'),
    [n, setN] = useState(6),
    [pattern, setPattern] = useState<LoopPattern>('nested'),
    [loopStep, setLoopStep] = useState(0),
    [loopPlaying, setLoopPlaying] = useState(false),
    [scale, setScale] = useState<'linear' | 'log'>('log'),
    [maxN, setMaxN] = useState(1000),
    [enabled, setEnabled] = useState<GrowthSeries[]>(growthSeries.map((s) => s.id)),
    [inspected, setInspected] = useState<number | null>(null),
    [fn, setFn] = useState<RecursionFunction>('factorial'),
    [recursiveN, setRecursiveN] = useState(4),
    [stackStep, setStackStep] = useState(4),
    [stackPlaying, setStackPlaying] = useState(false),
    [expandedFrame, setExpandedFrame] = useState<number | null>(null),
    [more, setMore] = useState(false),
    [worked, setWorked] = useState<number | null>(null),
    [activities, setActivities] = useState<string[]>([]),
    [prediction, setPrediction] = useState(''),
    [feedback, setFeedback] = useState(''),
    [quiz, setQuiz] = useState('')
  const [notes, setNotes] = usePersistentState('loop-recursion-notes', '', persistentString)
  const loop = loopSummary(n, pattern),
    trace = recursionTrace(recursiveN, fn),
    snapshot = trace.snapshots[Math.min(stackStep, trace.snapshots.length - 1)],
    plot = growthPlot(maxN, scale, enabled),
    clip = useId()
  const mark = (key: string) => setActivities((previous) => (previous.includes(key) ? previous : [...previous, key]))
  useEffect(() => {
    if (!loopPlaying) return
    const timer = window.setInterval(() => setLoopStep((s) => Math.min(loop.count, s + 1)), 120)
    return () => window.clearInterval(timer)
  }, [loopPlaying, loop.count])
  useEffect(() => {
    if (loopPlaying && loopStep >= loop.count) {
      const timer = window.setTimeout(() => setLoopPlaying(false), 0)
      return () => window.clearTimeout(timer)
    }
  }, [loopPlaying, loopStep, loop.count])
  useEffect(() => {
    if (!stackPlaying) return
    const timer = window.setInterval(() => setStackStep((s) => Math.min(trace.snapshots.length - 1, s + 1)), 650)
    return () => window.clearInterval(timer)
  }, [stackPlaying, trace.snapshots.length])
  useEffect(() => {
    if (stackPlaying && stackStep >= trace.snapshots.length - 1) {
      const timer = window.setTimeout(() => setStackPlaying(false), 0)
      return () => window.clearTimeout(timer)
    }
  }, [stackStep, stackPlaying, trace.snapshots.length])
  function updateLoop(value: number, nextPattern = pattern) {
    if (!Number.isInteger(value) || value < 1 || value > 20) return
    setN(value)
    setPattern(nextPattern)
    setLoopStep(0)
    setLoopPlaying(false)
    mark('loop')
  }
  function updateRecursion(value: number, nextFn = fn) {
    if (!Number.isInteger(value) || value < 0 || value > 10) return
    setRecursiveN(value)
    setFn(nextFn)
    setStackStep(recursionTrace(value, nextFn).peak - 1)
    setExpandedFrame(null)
    setStackPlaying(false)
    mark('stack')
  }
  function playLoop() {
    setLoopPlaying((v) => !v)
    if (loopStep === loop.count) setLoopStep(0)
    mark('loop')
  }
  const activeIteration = loop.iterations[loopStep - 1]
  const loopPanel = (
    <Panel
      title={tr('Loop Iteration Visualizer')}
      description="See how nested loops multiply iteration counts. Adjust n and observe the iteration heatmap."
      icon={<Play />}
      className="lr-loops"
    >
      <div className="lr-loop-content">
        <div className="lr-code-column">
          <div className="lr-code">
            <pre aria-label={tr('Active loop pseudocode')}>
              <code>
                {pattern !== 'doubling' ? (
                  <>
                    <span className="lr-keyword">{'for'}</span>
                    {' i = 1 to n\n'}
                    {'    '}
                    <span className="lr-keyword">{'for'}</span>
                    {` j = 1 to ${pattern === 'triangular' ? 'i' : 'n'}\n        count++`}
                  </>
                ) : (
                  <>
                    {'i = 1\n'}
                    <span className="lr-keyword">{'while'}</span>
                    {' i ≤ n\n    count++\n    i = 2 × i'}
                  </>
                )}
              </code>
            </pre>
            <div className="lr-code-controls">
              <button aria-label={tr(loopPlaying ? 'Pause loop animation' : 'Play loop animation')} onClick={playLoop}>
                {loopPlaying ? <Pause size={14} /> : <Play size={14} />}
              </button>
              <button
                onClick={() => {
                  setLoopStep(0)
                  setLoopPlaying(false)
                }}
              >
                {tr('Reset')}
              </button>
            </div>
          </div>
          <label className="lr-n-control">
            <b>
              {'n = '}
              {n}
            </b>
            <input aria-label={tr('Loop size n')} type="range" min="1" max="20" value={n} onChange={(e) => updateLoop(Number(e.target.value))} />
            <span>{'1'}</span>
            <span>{'20'}</span>
          </label>
          <div className="lr-loop-result">
            <strong>
              {tr('Total iterations: ')}
              <output>{loop.formula}</output>
            </strong>
            <p>
              {tr('Time complexity: ')}
              <span>{loop.bound}</span>
            </p>
          </div>
        </div>
        <div className="lr-heat-column">
          <h3>{tr(`Iteration Heatmap (n = ${n})`)}</h3>
          <div className="lr-heat-layout">
            <div className="lr-grid-wrap" style={{ minWidth: 24 + (pattern === 'doubling' ? loop.count : n) * 23 }}>
              <div className="lr-col-indices" style={{ gridTemplateColumns: `24px repeat(${pattern === 'doubling' ? loop.count : n},minmax(0,1fr))` }}>
                <span>{pattern === 'doubling' ? 'i →' : 'j →'}</span>
                {Array.from({ length: pattern === 'doubling' ? loop.count : n }, (_, i) => (
                  <span key={i}>{pattern === 'doubling' ? loop.iterations[i].i : i + 1}</span>
                ))}
              </div>
              <div className="lr-heat-grid" style={{ gridTemplateColumns: `24px repeat(${pattern === 'doubling' ? loop.count : n},minmax(0,1fr))` }}>
                {(pattern === 'doubling' ? [1] : Array.from({ length: n }, (_, i) => i + 1)).map((i) => (
                  <div className="lr-heat-row" key={i}>
                    <span>{pattern === 'doubling' ? 'i' : i}</span>
                    {Array.from({ length: pattern === 'doubling' ? loop.count : n }, (_, j) => {
                      const iteration = pattern === 'doubling' ? loop.iterations[j] : loop.iterations.find((row) => row.i === i && row.j === j + 1)
                      return iteration ? (
                        <button
                          key={j}
                          aria-label={tr(`Inspect iteration ${iteration.ordinal}: i ${iteration.i}${iteration.j !== null ? `, j ${iteration.j}` : ''}`)}
                          aria-pressed={loopStep === iteration.ordinal}
                          onClick={() => {
                            setLoopStep(iteration.ordinal)
                            setLoopPlaying(false)
                            mark('loop')
                          }}
                          style={{
                            background: `hsl(212 100% ${94 - (iteration.ordinal / loop.count) * 52}%)`,
                            opacity: loopStep > 0 && iteration.ordinal > loopStep ? 0.35 : 1,
                          }}
                        />
                      ) : (
                        <span key={j} className="lr-unused" />
                      )
                    })}
                  </div>
                ))}
              </div>
            </div>
            <div className="lr-heat-legend">
              <b>{tr('Execution order')}</b>
              <div>
                <i />
                <span>{tr('1 (first)')}</span>
                <span>{tr(`${loop.count} (last)`)}</span>
              </div>
            </div>
          </div>
          {loopStep > 0 && (
            <p className="lr-loop-status" role="status">
              {tr(
                `Step ${loopStep}/${loop.count}: i = ${activeIteration.i}${activeIteration.j !== null ? `, j = ${activeIteration.j}` : ''}; count = ${loopStep}`,
              )}
            </p>
          )}
        </div>
      </div>
    </Panel>
  )
  const chart = (
    <Panel
      title={tr('Growth Rate Comparison')}
      description="Adjust n to compare common loop and recursion behaviors."
      icon={<BarChart3 />}
      className="lr-growth"
    >
      <div className="lr-chart-options">
        <span>{tr('Scale:')}</span>
        <div>
          <button
            aria-pressed={scale === 'linear'}
            onClick={() => {
              setScale('linear')
              mark('chart')
            }}
          >
            {tr('Linear')}
          </button>
          <button
            aria-pressed={scale === 'log'}
            onClick={() => {
              setScale('log')
              mark('chart')
            }}
          >
            {tr('Logarithmic')}
          </button>
        </div>
        <label>
          {tr('n range:')}
          <select
            aria-label={tr('Growth chart input range')}
            value={maxN}
            onChange={(e) => {
              setMaxN(Number(e.target.value))
              setInspected(null)
              mark('chart')
            }}
          >
            {[20, 100, 1000].map((value) => (
              <option key={value} value={value}>
                {tr(`1 to ${value.toLocaleString('en-US')}`)}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="lr-growth-body">
        <div className="lr-plot-area">
          <svg
            className="lr-plot"
            viewBox="0 0 420 205"
            aria-label={tr(`${scale === 'log' ? 'Logarithmic' : 'Linear'} growth rate chart`)}
            onPointerMove={(e) => {
              const box = e.currentTarget.getBoundingClientRect()
              const x = ((e.clientX - box.left) / box.width) * 420
              setInspected(Math.max(1, Math.min(maxN, Math.round(1 + ((x - 42) / 362) * (maxN - 1)))))
            }}
            onPointerLeave={() => setInspected(null)}
          >
            <desc>
              {tr(
                'The horizontal axis is input size. The selected vertical scale projects actual function values. On the logarithmic axis, log₂(1) = 0 is omitted because log of zero is undefined.',
              )}
            </desc>
            <defs>
              <clipPath id={clip}>
                <rect x="42" y="10" width="362" height="150" />
              </clipPath>
            </defs>
            {plot.ticks.map((value) => (
              <g key={value}>
                <line x1="42" x2="404" y1={10 + 150 * plot.project(value)} y2={10 + 150 * plot.project(value)} stroke="#dce9fb" strokeDasharray="3 3" />
                <text x="34" y={14 + 150 * plot.project(value)} textAnchor="end" fill="var(--mom-muted)" fontSize="10">
                  {scale === 'log' ? (
                    <>
                      {'10'}
                      <tspan dy="-4" fontSize="7">
                        {Math.log10(value)}
                      </tspan>
                    </>
                  ) : value >= 1000 ? (
                    `${value / 1000}k`
                  ) : (
                    value
                  )}
                </text>
              </g>
            ))}
            {Array.from({ length: 6 }, (_, i) => {
              const x = 42 + (i * 362) / 5
              return (
                <g key={i}>
                  <line x1={x} x2={x} y1="10" y2="166" stroke="#deebfb" strokeDasharray="3 3" />
                  <text x={x} y="184" textAnchor="middle" fontSize="11" fill="var(--mom-muted)">
                    {Math.round(1 + (i * (maxN - 1)) / 5).toLocaleString('en-US')}
                  </text>
                </g>
              )
            })}
            <path d="M42 10V160H404" fill="none" stroke="#6785b3" />
            <g clipPath={`url(#${clip})`}>
              {plot.series.map((series) => (
                <path
                  key={series.id}
                  data-series={series.id}
                  d={series.points
                    .filter((p) => scale !== 'log' || p.value > 0)
                    .map((p, i) => `${i === 0 ? 'M' : 'L'}${42 + p.x * 362},${10 + p.y * 150}`)
                    .join(' ')}
                  fill="none"
                  stroke={growthSeries.find((s) => s.id === series.id)!.color}
                  strokeWidth="2"
                />
              ))}
            </g>
            <text transform="translate(9 90) rotate(-90)" fontSize="11" fill="var(--mom-ink)">
              {'T(n)'}
            </text>
            <text x="220" y="203" textAnchor="middle" fontSize="10" fill="var(--mom-muted)">
              {tr('n (input size)')}
            </text>
          </svg>
          {inspected !== null && (
            <output className="lr-chart-inspection">
              {`n = ${inspected}: `}
              {enabled.map((key) => `${growthSeries.find((s) => s.id === key)!.formula} = ${Number(growthValue(key, inspected).toFixed(2))}`).join('; ')}
            </output>
          )}
        </div>
        <div className="lr-series">
          {growthSeries.map((series) => (
            <label key={series.id}>
              <input
                type="checkbox"
                checked={enabled.includes(series.id)}
                onChange={(e) => {
                  setEnabled((previous) => (e.target.checked ? [...previous, series.id] : previous.filter((id) => id !== series.id)))
                  mark('chart')
                }}
              />
              <i style={{ background: series.color }} />
              <b>{tr(series.label)}</b>
              <span>{series.formula}</span>
            </label>
          ))}
        </div>
      </div>
    </Panel>
  )
  const callStack = (
    <Panel
      title={tr('Recursion Call Stack Visualizer')}
      description={
        fn === 'factorial'
          ? 'Explore the recursive call stack for factorial. Expand frames to see parameters and returns.'
          : 'Search a sorted array for a missing target. Expand frames to inspect each interval.'
      }
      icon={<Database />}
      className="lr-stack"
    >
      <label className="lr-function">
        {tr('Function:')}
        <select aria-label={tr('Recursive function')} value={fn} onChange={(e) => updateRecursion(recursiveN, e.target.value as RecursionFunction)}>
          <option value="factorial">{tr('Factorial (n!)')}</option>
          <option value="binary">{tr('Binary search (missing target)')}</option>
        </select>
      </label>
      <div className="lr-stack-content">
        <div className="lr-chain-scroll">
          <svg
            className="lr-chain"
            viewBox={`0 0 ${Math.max(180 + trace.frames.length * 17, 150 + (trace.frames.length - 1) * 25)} ${trace.frames.length * 39}`}
            style={{ height: Math.max(190, trace.frames.length * 36) }}
            aria-label={tr('Recursive calls from oldest to newest')}
          >
            {trace.frames.map((frame, i) => (
              <g key={frame.id}>
                {i > 0 && <path d={`M${42 + (i - 1) * 25} ${i * 39 - 8}v27q0 7 7 7h10m-4-3 4 3-4 3`} fill="none" stroke="#91a9cc" />}
                <g
                  role="button"
                  tabIndex={0}
                  aria-label={tr(`Inspect call ${frame.label}`)}
                  onClick={() => {
                    setExpandedFrame(frame.id)
                    mark('stack')
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      setExpandedFrame(frame.id)
                      mark('stack')
                    }
                  }}
                >
                  <rect
                    x={42 + i * 25}
                    y={i * 39}
                    width="92"
                    height="32"
                    rx="6"
                    fill={frame.n === 0 ? '#e5f9ef' : snapshot.stack.some((s) => s.id === frame.id) ? '#ddecff' : '#f1f5fb'}
                    stroke={expandedFrame === frame.id ? '#006fff' : frame.n === 0 ? '#98e3c1' : '#b3d6ff'}
                  />
                  <text x={88 + i * 25} y={i * 39 + 20} textAnchor="middle" fill="#074b9c" fontSize={fn === 'factorial' ? 12 : 10}>
                    {frame.label}
                  </text>
                  {frame.n === 0 && (
                    <text x={88 + i * 25} y={i * 39 + 29} textAnchor="middle" fontSize="8" fill="#047c49">
                      {tr(`return ${fn === 'factorial' ? 1 : -1}`)}
                    </text>
                  )}
                </g>
              </g>
            ))}
          </svg>
        </div>
        <div className="lr-stack-table">
          <header>
            <b>{tr('Call Stack (oldest → newest)')}</b>
            <span>{tr(`${snapshot.stack.length} live frames; peak ${trace.peak}`)}</span>
          </header>
          <ol>
            {snapshot.stack.map((frame) => (
              <li key={frame.id}>
                <button
                  aria-expanded={expandedFrame === frame.id}
                  onClick={() => {
                    setExpandedFrame(expandedFrame === frame.id ? null : frame.id)
                    mark('stack')
                  }}
                  aria-label={tr(`Expand stack frame ${frame.label}`)}
                >
                  <span className={frame.n === 0 ? 'base' : ''}>{frame.id + 1}</span>
                  <strong>{frame.label}</strong>
                  <small>{frame.expression}</small>
                  <em className={frame.n === 0 ? 'base' : ''}>{tr(frame.n === 0 ? 'Base case' : 'Waiting for return')}</em>
                  <ChevronRight size={15} />
                </button>
                {expandedFrame === frame.id && (
                  <div className="lr-frame-detail">
                    {tr(
                      `Parameter size = ${frame.n}. ${fn === 'binary' ? `lo = ${frame.lo}, hi = ${frame.hi}, target = ${recursiveN + 1}. ` : ''}Eventual return value = ${frame.value}. ${frame.n === 0 ? 'This base call is ready to return.' : 'This frame is still waiting at the current step.'}`,
                    )}
                  </div>
                )}
              </li>
            ))}
          </ol>
          {snapshot.stack.length === 0 && <p className="lr-empty-stack">{tr(`All calls have returned. Result: ${trace.result}.`)}</p>}
        </div>
      </div>
    </Panel>
  )
  const recurrence = (
    <Panel
      title={tr('Recurrence Overview')}
      description="Common recurrences from divide-and-conquer and recursive algorithms."
      icon={<Sigma />}
      className="lr-recurrences"
    >
      <button
        className="lr-view-more"
        aria-expanded={more}
        onClick={() => {
          setMore((v) => !v)
          mark('worked')
        }}
      >
        {tr(more ? 'View less' : 'View more')}
        <ArrowRight size={14} />
      </button>
      <div className="lr-table-scroll">
        <table>
          <thead>
            <tr>
              {['Algorithm / Case', 'Recurrence', 'Solution (Time)', 'Stack space'].map((t) => (
                <th key={t}>{tr(t)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[
              ['Binary Search', 'T(n) = T(n/2) + Θ(1)', 'Θ(log n)', 'Θ(log n)'],
              ['Merge Sort', 'T(n) = 2T(n/2) + Θ(n)', 'Θ(n log n)', 'Θ(log n)'],
              ['Linear Recursion', 'T(n) = T(n − 1) + Θ(1)', 'Θ(n)', 'Θ(n)'],
              ['Divide by constant', 'T(n) = T(n/2) + Θ(n)', 'Θ(n)', 'Θ(log n)'],
            ].map((row) => (
              <tr key={row[0]}>
                {row.map((value, i) => (
                  <td key={i}>{i === 0 ? tr(value) : value}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {more && (
        <div className="lr-recurrence-details">
          <p>
            {tr(
              'These formulas assume constant base work, unit-cost operations, and exact power-of-two splits where applicable. Stack space measures the longest live call path, not all calls.',
            )}
          </p>
          <p>
            {tr('Standard merge sort additionally uses Θ(n) auxiliary array space. Its Θ(log n) call stack is only one part of its total auxiliary memory.')}
          </p>
          <p>{tr('Divide by constant: n + n/2 + n/4 + ⋯ < 2n, so time is Θ(n); there are Θ(log n) nested calls.')}</p>
        </div>
      )}
    </Panel>
  )
  const lab = (
    <Panel
      title={tr('Execution Laboratory')}
      description="Change the loop pattern, input sizes, and recursion function. Every step comes from the displayed program."
      icon={<Code2 />}
      className="lr-lab"
    >
      <div className="lr-lab-controls">
        <label>
          {tr('Loop pattern')}
          <select
            aria-label={tr('Loop pattern')}
            value={pattern}
            onChange={(e) => {
              updateLoop(n, e.target.value as LoopPattern)
              mark('pattern')
            }}
          >
            {patterns.map((p) => (
              <option key={p.id} value={p.id}>
                {tr(p.label)}
              </option>
            ))}
          </select>
        </label>
        <label>
          {tr('Loop n')}
          <input type="number" aria-label={tr('Editable loop n')} min="1" max="20" value={n} onChange={(e) => updateLoop(Number(e.target.value))} />
        </label>
        <button
          disabled={loopStep === 0}
          onClick={() => {
            setLoopStep((s) => s - 1)
            setLoopPlaying(false)
          }}
        >
          {tr('Previous iteration')}
        </button>
        <button
          disabled={loopStep === loop.count}
          onClick={() => {
            setLoopStep((s) => s + 1)
            setLoopPlaying(false)
            mark('loop')
          }}
        >
          {tr('Next iteration')}
        </button>
        <output>{tr(`${loopStep} of ${loop.count} iterations executed`)}</output>
      </div>
      {loopPanel}
      <div className="lr-loop-theory">
        <h3>{tr('Why this count is correct')}</h3>
        <p>
          {tr(
            pattern === 'nested'
              ? 'The outer loop runs n times. For each i, the inner loop runs n times independently: Σᵢ₌₁ⁿ Σⱼ₌₁ⁿ 1 = n². The counters use constant auxiliary space.'
              : pattern === 'triangular'
                ? 'For row i the inner loop runs i times, so 1 + 2 + ⋯ + n = n(n + 1)/2 = Θ(n²). The inner bound depends on i; it is not always n.'
                : 'The loop visits i = 1, 2, 4, … while i ≤ n. After k updates i = 2ᵏ, so there are ⌊log₂ n⌋ + 1 iterations. The final exit test is not counted as an executed body operation.',
          )}
        </p>
      </div>
      <div className="lr-lab-controls">
        <label>
          {tr('Recursion n')}
          <input
            type="number"
            aria-label={tr('Recursive input n')}
            min="0"
            max="10"
            value={recursiveN}
            onChange={(e) => updateRecursion(Number(e.target.value))}
          />
        </label>
        <button
          disabled={stackStep === 0}
          onClick={() => {
            setStackStep((s) => s - 1)
            setStackPlaying(false)
          }}
        >
          {tr('Previous call step')}
        </button>
        <button
          disabled={stackStep === trace.snapshots.length - 1}
          onClick={() => {
            setStackStep((s) => s + 1)
            setStackPlaying(false)
            mark('stack')
          }}
        >
          {tr('Next call step')}
        </button>
        <button
          onClick={() => {
            setStackPlaying((v) => !v)
            if (stackStep === trace.snapshots.length - 1) setStackStep(0)
            mark('stack')
          }}
        >
          {stackPlaying ? <Pause size={15} /> : <Play size={15} />} {tr(stackPlaying ? 'Pause calls' : 'Play calls')}
        </button>
        <button
          onClick={() => {
            setStackStep(0)
            setStackPlaying(false)
            setExpandedFrame(null)
          }}
        >
          <RotateCcw size={15} />
          {tr('Reset calls')}
        </button>
      </div>
      {callStack}
      <p className="lr-stack-message" role="status">
        {tr(snapshot.message)}
      </p>
      <p>
        {tr(
          fn === 'factorial'
            ? `fact(${recursiveN}) returns ${trace.result}. There are ${trace.peak} calls in total and at most ${trace.peak} simultaneously live frames. Under unit-cost multiplication, factorial takes Θ(n) time and Θ(n) call-stack space.`
            : `Search the sorted array [1, …, ${recursiveN}] for ${recursiveN + 1}. The lower midpoint sends the search right until the interval is empty. The result is −1, with ${trace.peak} calls. Time and recursive stack are Θ(log(n + 1)) for growing n.`,
        )}
      </p>
      {chart}
    </Panel>
  )
  return (
    <div className="mom-page loop-recursion-page target-visual" data-target="5">
      <MockupLessonChrome
        {...props}
        title={tr('Analyzing Loops and Recursion')}
        description="Turn control flow into sums and recurrences. Visualize how loops iterate, how recursion expands, and learn to derive tight time and space bounds."
        progress={{ completed: activities.length, total: 6, unit: 'subtopics' }}
        startLabel="Continue Learning"
        searchPlaceholder="Search topics, examples, or practice problems..."
        heroIcon={<Code2 />}
        onStart={() => setTab('Visualize')}
        decoration={<HeroArt />}
        badges={
          <>
            <span>
              <BarChart3 />
              {tr('Key Ideas')}
            </span>
            <span>
              <FileText />
              {tr('Worked Examples')}
            </span>
            <span>
              <Play />
              {tr('Interactive Visualizations')}
            </span>
            <span>
              <Clock3 />
              {tr('~ 15 min')}
            </span>
            <span className="lr-dots">{'●○○○○○'}</span>
          </>
        }
      />
      <nav className="mom-tabs lr-tabs" aria-label={tr('Algorithm sections')}>
        {tabs.map((name, i) => {
          const Icon = tabIcons[i]
          return (
            <button
              key={name}
              aria-pressed={tab === name}
              onClick={() => {
                setTab(name)
                setLoopPlaying(false)
                setStackPlaying(false)
              }}
            >
              <Icon size={19} />
              {tr(name)}
            </button>
          )
        })}
      </nav>
      {tab === 'Learn' && (
        <>
          <div className="lr-top-grid">
            {loopPanel}
            {chart}
          </div>
          <div className="lr-middle-grid">
            {callStack}
            {recurrence}
          </div>
          <div className="lr-footer-grid">
            <Panel title={tr('Worked Examples')} description="Step-by-step analysis with clear assumptions." icon={<Settings />} className="lr-worked">
              {['Recursive Factorial', 'Triangular Nested Loop', 'Binary Search'].map((name, i) => (
                <div className="lr-example" key={name}>
                  <button
                    aria-expanded={worked === i}
                    onClick={() => {
                      setWorked(worked === i ? null : i)
                      mark('worked')
                    }}
                  >
                    <b>{i + 1}</b>
                    <strong>{tr(name)}</strong>
                    <small>
                      {i === 0 ? 'T(n) = T(n − 1) + Θ(1) ⇒ Θ(n), stack Θ(n)' : i === 1 ? 'Σᵢ₌₁ⁿ i = n(n + 1)/2 ⇒ Θ(n²)' : 'T(n) = T(n/2) + Θ(1) ⇒ Θ(log n)'}
                    </small>
                    <ChevronRight size={16} />
                  </button>
                  {worked === i && (
                    <div>
                      <p>
                        {tr(
                          i === 0
                            ? 'Base: fact(0) = 1. Each larger call performs one multiplication after fact(n − 1) returns. There are n + 1 calls. For n = 4, returns unwind as 1, 1, 2, 6, 24; peak stack size is 5 frames.'
                            : i === 1
                              ? 'For n = 6, the rows execute 1, 2, 3, 4, 5, 6 times. Their sum is 21, not 36. The triangular sum is still Θ(n²), with constant counter space.'
                              : 'For a missing target above the array, each right search keeps ⌊n/2⌋ items using the lower midpoint. With n = 4, interval sizes are 4 → 2 → 1 → 0: four calls including the empty base case.',
                        )}
                      </p>
                      <button
                        onClick={() => {
                          if (i === 1) updateLoop(6, 'triangular')
                          else updateRecursion(4, i === 0 ? 'factorial' : 'binary')
                          setTab('Visualize')
                        }}
                      >
                        {tr('Explore this example')}
                        <ArrowRight size={15} />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </Panel>
            <Panel
              title={tr('Assumptions and Constraints')}
              description="Consider worst-case, best-case, or average case as stated."
              icon={<FileText />}
              className="lr-assumptions"
            >
              <ul>
                {[
                  'Mathematical bounds are for families of inputs (varying n).',
                  'Count only the dominant operations (e.g., comparisons).',
                  'Use unit-cost arithmetic; large integer costs need a separate analysis.',
                  'Auxiliary space includes the live call stack; input storage is excluded.',
                ].map((s) => (
                  <li key={s}>
                    <Check size={16} />
                    {tr(s)}
                  </li>
                ))}
              </ul>
            </Panel>
            <Panel title={tr('Common Mistakes')} icon={<AlertTriangle />} className="lr-mistakes">
              {[
                [
                  'Treating nested loops Θ(n) instead of Θ(n²).',
                  'Multiply independent iteration counts. If one bound depends on another loop variable, write a sum before simplifying.',
                ],
                [
                  'Ignoring loop bounds that depend on input size.',
                  'A triangular loop has 1 + 2 + ⋯ + n body executions. A doubling loop has only ⌊log₂ n⌋ + 1.',
                ],
                [
                  'Confusing number of recursive calls with total work.',
                  'Multiply calls by their local work or sum the work by level. Peak stack space follows the longest simultaneously live chain.',
                ],
              ].map(([title, text]) => (
                <details key={title}>
                  <summary>{tr(title)}</summary>
                  <p>{tr(text)}</p>
                </details>
              ))}
            </Panel>
          </div>
        </>
      )}
      {tab === 'Visualize' && lab}
      {tab === 'Practice' && (
        <Panel title={tr('Prediction Challenge')} icon={<Pencil />} className="lr-exercise">
          <p>{tr('A triangular loop executes count++ for j = 1 through i, with i = 1 through 6. Predict the total number of body executions.')}</p>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              if (!prediction.trim() || !Number.isFinite(Number(prediction))) {
                setFeedback('Enter a finite numeric answer.')
                return
              }
              setFeedback(
                Number(prediction) === 21
                  ? 'Correct: 1 + 2 + 3 + 4 + 5 + 6 = 21.'
                  : 'Try again: sum the row lengths 1 through 6. The result is 21; the order is still Θ(n²).',
              )
              mark('challenge')
            }}
          >
            <label>
              {tr('Predicted iteration count')}
              <input type="number" value={prediction} onChange={(e) => setPrediction(e.target.value)} />
            </label>
            <button>{tr('Check prediction')}</button>
          </form>
          {feedback && <p role="status">{tr(feedback)}</p>}
          <button
            onClick={() => {
              updateLoop(6, 'triangular')
              setTab('Visualize')
            }}
          >
            {tr('Inspect the triangular loop')}
          </button>
        </Panel>
      )}
      {tab === 'Quiz' && (
        <Panel title={tr('Check Your Understanding')} icon={<Trophy />} className="lr-exercise">
          <p>{tr('With the base fact(0) = 1, how many simultaneously live frames exist just before fact(4) starts returning?')}</p>
          {['4 frames; ignore the base case.', '5 frames: fact(4), fact(3), fact(2), fact(1), fact(0).', '24 frames because 4! = 24.'].map((answer, i) => (
            <button
              key={answer}
              aria-pressed={quiz === String(i)}
              onClick={() => {
                setQuiz(String(i))
                mark('challenge')
              }}
            >
              {tr(answer)}
            </button>
          ))}
          {quiz && (
            <p role="status">
              {tr(
                quiz === '1'
                  ? 'Correct. The base call is a frame too; return values do not count as frames.'
                  : 'Try again. Count the active calls including fact(0), rather than the numeric result.',
              )}
            </p>
          )}
        </Panel>
      )}
      {tab === 'Notes' && (
        <Panel title={tr('Your Analysis Notes')} icon={<FileText />} className="lr-exercise">
          <label htmlFor="lr-notes">{tr('Record the loop bounds, exact count, recurrence, and peak stack depth.')}</label>
          <textarea id="lr-notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={12} />
          <p>{tr('Saved in this browser.')}</p>
        </Panel>
      )}
    </div>
  )
}
