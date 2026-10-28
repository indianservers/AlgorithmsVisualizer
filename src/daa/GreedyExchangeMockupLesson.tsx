// @localized-render
import { useEffect, useId, useState, type ReactNode } from 'react'
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  BookOpen,
  Check,
  CheckCircle2,
  Clock3,
  FileText,
  Flag,
  FlaskConical,
  Lightbulb,
  LineChart,
  Pause,
  Pencil,
  Play,
  RotateCcw,
  Shuffle,
  Target,
  Trophy,
  X,
} from 'lucide-react'
import { LanguageSelector } from '../i18n/LanguageSelector'
import { tx, useLocaleRender } from '../i18n/render'
import { usePersistentState, persistentString } from '../hooks/usePersistentState'
import { MockupLessonChrome, type MockupPageProps } from './MockupLessonChrome'
import {
  activityTrace,
  coinCounterexample,
  exchangeActivities,
  exchangeFirst,
  fractionalExample,
  fractionalKnapsack,
  optimalActivitySchedule,
  parseActivities,
  type Activity,
  type ActivityStrategy,
  type FractionalItem,
} from './greedyExchangeModel'
import './greedy-exchange-mockup.css'

const tr = (s: string) => tx(s, 'studios')
type Tab = 'Learn' | 'Visualize' | 'Practice' | 'Quiz' | 'Notes'
const tabs: Tab[] = ['Learn', 'Visualize', 'Practice', 'Quiz', 'Notes'],
  tabIcons = [BookOpen, LineChart, Pencil, Trophy, FileText]
const strategyLabels: Record<ActivityStrategy, string> = { finish: 'Earliest Finish (Greedy)', duration: 'Largest Duration', start: 'Earliest Start' }
const colors = ['#1185ff', '#ff8b18', '#ff707b', '#9b3dff', '#08a45d', '#009fa7']
const examples: Activity[][] = [
  exchangeActivities,
  [
    { id: 'A1', start: 0, finish: 8 },
    { id: 'A2', start: 1, finish: 3 },
    { id: 'A3', start: 3, finish: 5 },
    { id: 'A4', start: 5, finish: 7 },
    { id: 'A5', start: 8, finish: 10 },
  ],
  [
    { id: 'A1', start: 0, finish: 2 },
    { id: 'A2', start: 2, finish: 4 },
    { id: 'A3', start: 4, finish: 6 },
    { id: 'A4', start: 1, finish: 5 },
  ],
]
const asText = (a: Activity[]) => a.map((a) => `${a.id}, ${a.start}, ${a.finish}`).join('\n')
const fmt = (n: number) => (Number.isInteger(n) ? String(n) : Number(n.toFixed(3)).toString())
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
    <section className={`mom-panel ge-panel ${className}`}>
      <header>
        <span className="ge-icon">{icon}</span>
        <div>
          <h2>{tr(title)}</h2>
          {description && <p>{tr(description)}</p>}
        </div>
      </header>
      {children}
    </section>
  )
}
function BarsIcon() {
  const id = useId()
  return (
    <svg viewBox="0 0 40 40" aria-hidden="true">
      <defs>
        <linearGradient id={id} x2="0" y2="1">
          <stop stopColor="#39acff" />
          <stop offset="1" stopColor="#0064f7" />
        </linearGradient>
      </defs>
      {[13, 23, 32].map((h, i) => (
        <g key={h}>
          <rect x={4 + i * 11} y={36 - h} width="8" height={h} rx="3" fill={`url(#${id})`} />
          <path d={`M${9 + i * 11} ${37 - h}v${h - 3}`} stroke="#88d5ff" strokeWidth="1.4" opacity=".7" />
        </g>
      ))}
    </svg>
  )
}
function HeroArt() {
  const id = useId()
  return (
    <svg className="ge-hero-art" viewBox="0 0 270 138" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id={id} x2="0" y2="1">
          <stop stopColor="#55b2ff" stopOpacity=".5" />
          <stop offset="1" stopColor="#9ed9ff" stopOpacity=".1" />
        </linearGradient>
      </defs>
      <path d="M0 130C24 110 28 98 54 47S87 126 124 95S161 24 193 76S232 14 270 33V138H0Z" fill={`url(#${id})`} />
      <path d="M0 138C38 131 46 71 74 83S101 138 129 109S169 41 191 61S220 127 241 87S261 66 270 64V138Z" fill={`url(#${id})`} />
      <path d="M0 138C38 131 46 71 74 83S101 138 129 109S169 41 191 61S220 127 241 87S261 66 270 64" fill="none" stroke="#097bff" strokeWidth="1.5" />
      <circle cx="181" cy="59" r="5.5" fill="#007bff" stroke="white" strokeWidth="2" />
      <path d="M184 40V17M184 19Q191 14 196 20L204 19L198 26L204 30Q195 35 184 29" stroke="#007aff" strokeWidth="2" fill="#007aff" />
    </svg>
  )
}
function ScheduleChart({
  activities,
  selected,
  mini = false,
  intervalLabels = false,
  inspected,
  onInspect,
}: {
  activities: Activity[]
  selected?: string[]
  mini?: boolean
  intervalLabels?: boolean
  inspected?: string
  onInspect?: (id: string) => void
}) {
  const chartId = useId().replace(/[^a-zA-Z0-9]/g, '')
  const colorFor = (a: Activity, i: number) => colors[((Number(a.id.match(/\d+$/)?.[0]) || i + 1) - 1) % colors.length]
  const width = mini ? 260 : 480,
    height = mini ? 172 : 228,
    left = mini ? 6 : 70,
    right = width - 16,
    top = mini ? 26 : 32,
    bottom = height - 37,
    max = Math.max(10, ...activities.map((a) => a.finish)),
    rows = Math.max(1, activities.length),
    row = mini ? Math.min(28, (bottom - top) / rows) : (bottom - top) / rows,
    axisBottom = mini ? bottom : bottom - row / 2
  const x = (time: number) => left + ((right - left) * time) / max
  return (
    <svg
      className={`ge-schedule ${mini ? 'mini' : ''}`}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      role={onInspect ? 'group' : 'img'}
      aria-label={tr(mini ? 'Selected activity schedule' : 'Activity intervals on a time axis')}
    >
      <defs>
        {activities.map((a, i) => (
          <linearGradient key={a.id} id={`ge-${chartId}-${a.id}`} x2="0" y2="1">
            <stop stopColor={colorFor(a, i)} stopOpacity=".45" />
            <stop offset="1" stopColor={colorFor(a, i)} stopOpacity=".7" />
          </linearGradient>
        ))}
      </defs>
      {!mini && (
        <text x="2" y="10" className="ge-chart-heading">
          {tr('Activities')}
        </text>
      )}
      {Array.from({ length: 6 }, (_, i) => (i * max) / 5).map((t) => (
        <g key={t}>
          <line x1={x(t)} x2={x(t)} y1={top - 10} y2={axisBottom + 4} stroke="#dce7f8" strokeDasharray={mini ? undefined : '2 2'} />
          <text x={x(t)} y={axisBottom + 23} textAnchor="middle">
            {fmt(t)}
          </text>
        </g>
      ))}
      <path d={`M${left} ${top - 10}V${axisBottom + 4}H${right}`} fill="none" stroke="#b5c9e5" />
      {activities.map((a, i) => {
        const y = top + i * row,
          chosen = !selected || selected.includes(a.id),
          color = colorFor(a, i)
        return (
          <g
            key={a.id}
            role={onInspect ? 'button' : undefined}
            tabIndex={onInspect ? 0 : undefined}
            aria-label={onInspect ? tr(`Inspect activity ${a.id}`) : undefined}
            onClick={() => onInspect?.(a.id)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onInspect?.(a.id)
              }
            }}
            className={`${chosen ? '' : 'muted'} ${inspected === a.id ? 'inspected' : ''}`}
          >
            {!mini && (
              <>
                <text x="2" y={y + 8} className="ge-activity-id">
                  {a.id}
                </text>
                <text x="27" y={y + 8}>
                  [{a.start}, {a.finish}]
                </text>
                <line x1={left} x2={right} y1={y + 5} y2={y + 5} stroke="#edf2fa" strokeDasharray="2 2" />
              </>
            )}
            <rect
              x={x(a.start)}
              y={y - 3}
              width={Math.max(2, x(a.finish) - x(a.start))}
              height={mini ? 16 : 12}
              rx={mini ? 3 : 5}
              fill={`url(#ge-${chartId}-${a.id})`}
              stroke={color}
              strokeWidth={inspected === a.id ? 2.5 : 0.7}
            />
            {mini ? (
              <text x={(x(a.start) + x(a.finish)) / 2} y={y + 9} textAnchor="middle" fill={color} className="ge-mini-label">
                {intervalLabels ? `${a.id} [${a.start}, ${a.finish}]` : a.id}
              </text>
            ) : (
              <>
                <ellipse cx={x(a.start)} cy={y + 3} rx="3" ry="6" fill={color} />
                <ellipse cx={x(a.finish)} cy={y + 3} rx="3" ry="6" fill={color} />
              </>
            )}
          </g>
        )
      })}
      <text x={(left + right) / 2} y={mini ? height - 2 : axisBottom + 36} textAnchor="middle">
        {tr('Time')}
      </text>
    </svg>
  )
}

export function GreedyExchangeMockupLesson(props: MockupPageProps) {
  useLocaleRender()
  const [tab, setTab] = useState<Tab>('Learn'),
    [input, setInput] = useState<Activity[]>(() => exchangeActivities.map((a) => ({ ...a }))),
    [draft, setDraft] = useState(asText(exchangeActivities)),
    [example, setExample] = useState('0'),
    [cursor, setCursor] = useState(exchangeActivities.length),
    [playing, setPlaying] = useState(false),
    [strategy, setStrategy] = useState<ActivityStrategy>('finish'),
    [inspected, setInspected] = useState(''),
    [error, setError] = useState(''),
    [exchanged, setExchanged] = useState(true),
    [items, setItems] = useState<FractionalItem[]>(() => fractionalExample.map((a) => ({ ...a }))),
    [capacity, setCapacity] = useState(50),
    [coinDraft, setCoinDraft] = useState('1, 3, 4'),
    [amountDraft, setAmountDraft] = useState('6'),
    [coinInput, setCoinInput] = useState({ coins: [1, 3, 4], amount: 6 }),
    [prediction, setPrediction] = useState(''),
    [feedback, setFeedback] = useState(''),
    [quiz, setQuiz] = useState(''),
    [quizFeedback, setQuizFeedback] = useState(''),
    [done, setDone] = useState<string[]>([]),
    [notes, setNotes] = usePersistentState('greedy-exchange-notes', '', persistentString)
  const trace = activityTrace(input),
    selected = cursor ? trace.frames[cursor - 1].selected : [],
    comparison = activityTrace(input, strategy),
    packed = fractionalKnapsack(items, capacity),
    coin = coinCounterexample(coinInput.coins, coinInput.amount),
    proof = exchangeFirst(input, optimalActivitySchedule(input)),
    inspectedActivity = input.find((a) => a.id === inspected),
    accepted = trace.frames.flatMap((f, i) => (f.accepted ? [{ ...f, index: i }] : []))
  const progress = (key: string) => setDone((old) => (old.includes(key) ? old : [...old, key]))
  useEffect(() => {
    if (!playing) return
    if (cursor >= trace.frames.length) return
    const timer = window.setTimeout(() => {
      setCursor(cursor + 1)
      if (cursor + 1 === trace.frames.length) {
        setPlaying(false)
        progress('trace')
      }
    }, 650)
    return () => clearTimeout(timer)
  }, [playing, cursor, trace.frames.length])
  function open(next: Tab) {
    setTab(next)
    setPlaying(false)
  }
  function load(index: string) {
    setExample(index)
    setInput(examples[Number(index)].map((a) => ({ ...a })))
    setDraft(asText(examples[Number(index)]))
    setCursor(examples[Number(index)].length)
    setPlaying(false)
    setInspected('')
    setError('')
    setFeedback('')
    setExchanged(false)
  }
  function apply() {
    try {
      const value = parseActivities(draft)
      setExample('custom')
      setInput(value)
      setCursor(0)
      setPlaying(false)
      setInspected('')
      setError('')
      setFeedback('')
      setExchanged(false)
    } catch (e) {
      setError((e as Error).message)
    }
  }
  function updateItem(id: number, key: 'value' | 'weight', value: string) {
    const n = Number(value)
    if (!value.trim() || !Number.isFinite(n) || n < 0 || n > 10000 || (key === 'weight' && n === 0)) {
      setError('Use a finite nonnegative value and a positive weight, both up to 10000.')
      return
    }
    setItems(items.map((a) => (a.id === id ? { ...a, [key]: n } : a)))
    setError('')
    progress('knapsack')
  }
  function predict() {
    const next = trace.frames[cursor]
    if (!next) {
      setFeedback('Reset the trace before predicting its first decision.')
      return
    }
    const correct = prediction === (next.accepted ? 'accept' : 'skip')
    setFeedback(
      correct
        ? `Correct. ${next.activity.id} is ${next.accepted ? 'compatible with the selected schedule' : `in conflict with ${next.conflicts.join(', ')}`}.`
        : `Not yet. Compare [${next.activity.start}, ${next.activity.finish}] with the activities already selected.`,
    )
    if (correct) progress('prediction')
  }
  function updateCoins() {
    try {
      const coins = coinDraft
          .trim()
          .split(/[\s,]+/)
          .map(Number),
        amount = Number(amountDraft)
      if (!amountDraft.trim()) throw new Error('Enter an integer amount from 0 to 100.')
      coinCounterexample(coins, amount)
      setCoinInput({ coins, amount })
      setError('')
    } catch (e) {
      setError((e as Error).message)
    }
  }
  return (
    <div className="mom-page greedy-exchange-page target-visual" data-target="10">
      <MockupLessonChrome
        {...props}
        showLanguage={false}
        title={tr('Greedy Choice and Exchange Arguments')}
        description={
          'Show why a local choice can belong to an optimal solution using the exchange argument.\nLearn the technique, see examples, visualize, and understand its limitations.'
        }
        heroIcon={<BarsIcon />}
        decoration={<HeroArt />}
        progress={{ completed: done.length, total: 5 }}
        startLabel="Continue learning"
        searchPlaceholder="Search topics, examples, or practice problems..."
        onStart={() => open('Visualize')}
        badges={
          <>
            <span>
              <BarChart3 />
              {tr('Analysis & Correctness')}
            </span>
            <span>
              <BarChart3 />
              {tr('Intermediate')}
            </span>
            <span>
              <Clock3 />
              {tr('10–15 min')}
            </span>
            <span className="ge-hero-dots" aria-hidden="true">
              {Array.from({ length: 6 }, (_, i) => (
                <i key={i} className={!i ? 'active' : ''} />
              ))}
            </span>
          </>
        }
      />
      <nav className="mom-tabs ge-tabs" aria-label={tr('Algorithm sections')}>
        {tabs.map((name, i) => {
          const Icon = tabIcons[i]
          return (
            <button key={name} aria-pressed={tab === name} onClick={() => open(name)}>
              <Icon size={19} />
              {tr(name)}
            </button>
          )
        })}
      </nav>
      {error && (
        <p className="ge-error" role="alert">
          {tr(error)}
        </p>
      )}
      {(tab === 'Learn' || tab === 'Visualize') && (
        <>
          {tab === 'Visualize' && (
            <Panel
              className="ge-lab"
              title={tr('Explore the greedy decision')}
              description="Edit intervals, then inspect every accepted or skipped activity. Touching endpoints are allowed."
              icon={<LineChart />}
            >
              <div className="ge-lab-grid">
                <label>
                  {tr('Activities: name, start, finish')}
                  <textarea aria-label={tr('Activity intervals')} rows={6} value={draft} onChange={(e) => setDraft(e.target.value)} />
                </label>
                <div>
                  <button className="ge-primary" onClick={apply}>
                    {tr('Apply activities')}
                  </button>
                  <div className="ge-controls">
                    <button
                      disabled={!cursor}
                      onClick={() => {
                        setCursor(cursor - 1)
                        setPlaying(false)
                      }}
                    >
                      {tr('Step back')}
                    </button>
                    <button
                      disabled={cursor === trace.frames.length}
                      onClick={() => {
                        setCursor(cursor + 1)
                        setPlaying(false)
                        if (cursor + 1 === trace.frames.length) progress('trace')
                      }}
                    >
                      {tr('Step forward')}
                    </button>
                    <button
                      onClick={() => {
                        setCursor(0)
                        setPlaying(false)
                      }}
                    >
                      {tr('Reset trace')}
                    </button>
                  </div>
                  <p className="ge-trace-status" role="status">
                    {tr('Step ')}
                    {cursor}/{trace.frames.length} ·{' '}
                    {cursor
                      ? `${trace.frames[cursor - 1].activity.id}: ${tr(trace.frames[cursor - 1].accepted ? 'accept' : 'skip')}`
                      : tr('Ready to inspect the earliest finish.')}
                  </p>
                  <p>
                    {cursor && trace.frames[cursor - 1].conflicts.length
                      ? tr('Overlaps selected activities: ') + trace.frames[cursor - 1].conflicts.join(', ')
                      : tr('Accept only compatible activities; finish times determine the scan order.')}
                  </p>
                  <label>
                    {tr('Selected decision')}
                    <input
                      aria-label={tr('Selected activity decision')}
                      type="range"
                      min={0}
                      max={trace.frames.length}
                      value={cursor}
                      onChange={(e) => {
                        setCursor(Number(e.target.value))
                        setPlaying(false)
                      }}
                    />
                  </label>
                </div>
              </div>
              <div className="ge-decision-list">
                {trace.frames.map((f, i) => (
                  <button
                    key={f.activity.id}
                    aria-label={tr(`Inspect decision ${i + 1}`)}
                    aria-pressed={cursor === i + 1}
                    onClick={() => {
                      setCursor(i + 1)
                      setPlaying(false)
                    }}
                  >
                    {f.activity.id} [{f.activity.start}, {f.activity.finish}] · {tr(f.accepted ? 'accept' : 'skip')}
                  </button>
                ))}
              </div>
              {inspectedActivity && (
                <p className="ge-inspection" role="status">
                  {inspectedActivity.id}: [{inspectedActivity.start}, {inspectedActivity.finish}] · {tr('duration ')}
                  {fmt(inspectedActivity.finish - inspectedActivity.start)} · {tr('finish ')}
                  {inspectedActivity.finish}
                </p>
              )}
            </Panel>
          )}
          <div className="ge-top-grid">
            <Panel
              className="ge-activity"
              title={tr('Activity Selection Visualizer')}
              description="Choose activities by earliest finishing time. See how the greedy choice builds an optimal schedule."
              icon={<BarsIcon />}
            >
              <div className="ge-activity-actions">
                <button
                  className="ge-primary"
                  onClick={() => {
                    if (playing) {
                      setPlaying(false)
                      return
                    }
                    setCursor(0)
                    setPlaying(true)
                  }}
                >
                  {playing ? <Pause size={14} /> : <Play size={14} />} {tr(playing ? 'Pause' : 'Run Greedy')}
                </button>
                <button
                  onClick={() => {
                    setCursor(0)
                    setPlaying(false)
                    setInspected('')
                  }}
                >
                  <RotateCcw size={12} />
                  {tr('Reset')}
                </button>
                <select aria-label={tr('Activity example')} value={example} onChange={(e) => load(e.target.value)}>
                  {example === 'custom' && (
                    <option value="custom" disabled>
                      {tr('Custom intervals')}
                    </option>
                  )}
                  {examples.map((_, i) => (
                    <option key={i} value={i}>
                      {tr('Example ')}
                      {i + 1}
                    </option>
                  ))}
                </select>
              </div>
              <div className="ge-activity-body">
                <div className="ge-chart-scroll" tabIndex={0} role="region" aria-label={tr('Activity timeline, scroll horizontally on narrow screens')}>
                  <ScheduleChart
                    activities={input}
                    selected={selected.map((a) => a.id)}
                    inspected={inspected}
                    onInspect={(id) => {
                      setInspected(id)
                      if (tab === 'Learn') open('Visualize')
                    }}
                  />
                </div>
                <div className="ge-steps-column">
                  <h3>{tr('Greedy step-by-step')}</h3>
                  <div className="ge-steps">
                    {accepted.map((f, i) => (
                      <button
                        key={f.activity.id}
                        className={cursor >= f.index + 1 ? 'reached' : 'future'}
                        aria-label={tr(`Inspect greedy pick ${i + 1}`)}
                        onClick={() => {
                          setCursor(f.index + 1)
                          setPlaying(false)
                        }}
                      >
                        <b>{i + 1}</b>
                        <span>
                          <strong>
                            {tr('Pick ')}
                            {f.activity.id} [{f.activity.start}, {f.activity.finish}]
                          </strong>
                          <small>{i ? tr('Next compatible with start ≥ ') + accepted[i - 1].activity.finish + '.' : tr('Earliest finishing activity.')}</small>
                        </span>
                      </button>
                    ))}
                  </div>
                  <div className="ge-selected-summary">
                    <CheckCircle2 />
                    <div>
                      <b>
                        {tr('Selected activities: ')}
                        {'{' + selected.map((a) => a.id).join(', ') + '}'}
                      </b>
                      <span>
                        {tr('Total count: ')}
                        {selected.length} {cursor === trace.frames.length ? tr('(Optimal)') : tr('(in progress)')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </Panel>
            <Panel
              className="ge-comparison"
              title={tr('Local Choice vs Global Outcome')}
              description="See how the greedy rule compares to other choices."
              icon={<Target />}
            >
              <div className="ge-strategy-tabs" role="group" aria-label={tr('Activity selection rule')}>
                {(Object.keys(strategyLabels) as ActivityStrategy[]).map((key) => (
                  <button
                    key={key}
                    aria-pressed={strategy === key}
                    onClick={() => {
                      setStrategy(key)
                      progress('compare')
                    }}
                  >
                    {tr(strategyLabels[key])}
                  </button>
                ))}
              </div>
              <div className="ge-comparison-body">
                <div className="ge-selected-schedule">
                  <h3>{tr('Selected schedule')}</h3>
                  <ScheduleChart activities={comparison.selected} mini />
                </div>
                <div className="ge-comparison-result">
                  <h3>{tr('Result')}</h3>
                  <dl>
                    <div>
                      <dt>{tr('Activities')}</dt>
                      <dd className="ge-comparison-count">{comparison.selected.length}</dd>
                    </div>
                    <div>
                      <dt>{tr('Non-overlapping')}</dt>
                      <dd>
                        <Check />
                      </dd>
                    </div>
                    <div>
                      <dt>{tr('Optimal')}</dt>
                      <dd>{comparison.isOptimal ? <Check /> : <X />}</dd>
                    </div>
                  </dl>
                  <p>
                    <Trophy />
                    {tr(
                      comparison.isOptimal
                        ? strategy === 'finish'
                          ? 'Greedy (earliest finish) finds an optimal schedule for activity selection.'
                          : 'This rule ties the optimum on this input; that is not a general guarantee.'
                        : `This rule picks ${comparison.selected.length}; the optimum has ${comparison.optimal.length}. A local preference needs a proof.`,
                    )}
                  </p>
                </div>
              </div>
            </Panel>
          </div>
          <div className="ge-bottom-grid">
            <Panel
              className="ge-exchange"
              title={tr('Exchange Argument (Before → After)')}
              description="Transform an optimal solution to include the greedy choice without worsening the objective."
              icon={<Shuffle />}
            >
              <div className="ge-exchange-pair">
                <div className="ge-before">
                  <h3>
                    <Flag />
                    {tr('Optimal solution (before)')}
                  </h3>
                  <ScheduleChart activities={proof.before} mini intervalLabels />
                </div>
                <button
                  className="ge-exchange-action"
                  aria-label={tr(exchanged ? 'Reset exchange argument' : 'Apply greedy exchange')}
                  onClick={() => {
                    setExchanged(!exchanged)
                    progress('exchange')
                  }}
                >
                  <ArrowRight />
                </button>
                <div className={`ge-after ${exchanged ? 'exchanged' : ''}`}>
                  <h3>
                    <Pencil />
                    {tr('After exchange (include ')}
                    {proof.greedy.id})
                  </h3>
                  <ScheduleChart activities={exchanged ? proof.after : proof.before} mini intervalLabels />
                </div>
              </div>
              <div className="ge-exchange-note">
                <Lightbulb />
                <p>
                  {tr(
                    exchanged
                      ? `Replace ${proof.oldFirst.id} with ${proof.greedy.id} in an optimal schedule. Since ${proof.greedy.finish} ≤ ${proof.oldFirst.finish}, every later activity remains feasible, so the objective cannot decrease. Both schedules contain ${proof.after.length} activities. Repeating the exchange establishes an optimal schedule containing the greedy choice.`
                      : 'If an optimal schedule does not include the earliest-finishing activity, exchange its first activity with the greedy choice. The replacement ends no later, preserves feasibility and does not decrease the number of activities. Click the arrow to apply the exchange.',
                  )}
                </p>
              </div>
            </Panel>
            <Panel
              className="ge-knapsack"
              title={tr('Worked Example: Fractional Knapsack')}
              description="Greedy by value/weight ratio. Take items in decreasing ratio, possibly fractional."
              icon={<FlaskConical />}
            >
              <table className="ge-item-table">
                <thead>
                  <tr>
                    {['Item', 'Value (v)', 'Weight (w)', 'Ratio (v/w)', 'Take'].map((s) => (
                      <th key={s}>{tr(s)}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id}>
                      <td>{item.id}</td>
                      <td>
                        <input
                          type="number"
                          min={0}
                          max={10000}
                          aria-label={tr(`Item ${item.id} value`)}
                          value={item.value}
                          onChange={(e) => updateItem(item.id, 'value', e.target.value)}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          min={0.001}
                          max={10000}
                          step="any"
                          aria-label={tr(`Item ${item.id} weight`)}
                          value={item.weight}
                          onChange={(e) => updateItem(item.id, 'weight', e.target.value)}
                        />
                      </td>
                      <td>{(item.value / item.weight).toFixed(1)}</td>
                      <td>
                        <label>
                          <input
                            aria-label={tr(`Include item ${item.id}`)}
                            type="checkbox"
                            checked={item.included}
                            onChange={(e) => {
                              setItems(items.map((a) => (a.id === item.id ? { ...a, included: e.target.checked } : a)))
                              progress('knapsack')
                            }}
                          />
                          <span>{fmt(packed.fractions[item.id])}</span>
                        </label>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <label className="ge-capacity-label">
                {tr('Capacity = ')}
                <input
                  aria-label={tr('Knapsack capacity')}
                  type="number"
                  min={0}
                  max={10000}
                  step="any"
                  value={capacity}
                  onChange={(e) => {
                    const n = Number(e.target.value)
                    if (!e.target.value.trim() || !Number.isFinite(n) || n < 0 || n > 10000) {
                      setError('Capacity must be between 0 and 10000.')
                      return
                    }
                    setCapacity(n)
                    setError('')
                    progress('knapsack')
                  }}
                />
              </label>
              <div className="ge-capacity-meter">
                <progress max={Math.max(1, capacity)} value={packed.used} aria-label={tr('Used knapsack capacity')} />
                <span>
                  {fmt(packed.used)} / {fmt(capacity)}
                </span>
              </div>
              <div className="ge-knapsack-result">
                <Trophy />
                <div>
                  <b>
                    {tr('Maximum value = ')}
                    <output>{fmt(packed.value)}</output>
                  </b>
                  <p>
                    {tr('Take fractions: ')}
                    {items.map((a) => `${a.id}: ${fmt(packed.fractions[a.id])}`).join(' · ')}
                  </p>
                </div>
              </div>
            </Panel>
            <aside className="ge-side-column">
              <Panel
                className="ge-fails"
                title={tr('When Greedy Fails')}
                description="Optimal substructure alone does not justify greediness."
                icon={<AlertTriangle />}
              >
                <div className="ge-counterexample">
                  <h3>{tr('Counterexample (Coin Change)')}</h3>
                  <p>
                    {tr('Coins ')}
                    {'{' + coinInput.coins.join(', ') + '}'}
                    {tr(', amount = ')}
                    {coinInput.amount}
                  </p>
                  <div>
                    <X />
                    <p>
                      {tr('Greedy (largest coin first): ')}
                      {coin.greedy.length ? coin.greedy.join(' + ') : '∅'}
                      {coin.remaining ? tr(' · remainder ') + coin.remaining : ` → ${coin.greedy.length} ${tr('coins')}`}
                    </p>
                  </div>
                  <div>
                    <CheckCircle2 />
                    <p>
                      {tr('Optimal: ')}
                      {coin.optimal ? `${coin.optimal.join(' + ') || '∅'} → ${coin.optimal.length} ${tr('coins')}` : tr('No exact solution.')}
                    </p>
                  </div>
                  <p>{tr('A failed exchange argument suggests using DP or another method.')}</p>
                </div>
              </Panel>
              <Panel className="ge-takeaways" title={tr('Key Takeaways')} icon={<Lightbulb />}>
                <ul>
                  {[
                    'Start with an optimal solution and use an exchange argument.',
                    'The greedy choice does not worsen the objective and preserves feasibility.',
                    'Repeat the argument to get an optimal solution.',
                    'Greedy works for some problems (e.g., activity selection, fractional knapsack), but can fail for others (e.g., coin change).',
                  ].map((s) => (
                    <li key={s}>
                      <Check />
                      {tr(s)}
                    </li>
                  ))}
                </ul>
              </Panel>
            </aside>
          </div>
          <details className="ge-theory">
            <summary>{tr('Theory, proof assumptions and further experiments')}</summary>
            <div className="ge-theory-grid">
              <article>
                <h2>{tr('Why earliest finish is safe')}</h2>
                <p>
                  {tr(
                    'The objective is to maximize the number of pairwise non-overlapping intervals. Let g finish earliest and let o be the first interval in any optimal schedule. Since finish(g) ≤ finish(o), replacing o with g leaves every later interval feasible and preserves the schedule size. The remaining compatible intervals form the same problem. Repeat the argument; sorting costs O(n log n), and the scan costs O(n).',
                  )}
                </p>
                <p>
                  {tr(
                    'Intervals are half-open [start, finish); an activity ending at time t may be followed by one starting at t. Durations are positive. Ties in finish time are safe; this implementation breaks ties by start and name. The dynamic-programming optimum independently checks each strategy’s cardinality. Largest duration and earliest start have no universal guarantee.',
                  )}
                </p>
              </article>
              <article>
                <h2>{tr('Fractional exchange and its limits')}</h2>
                <p>
                  {tr(
                    'With nonnegative values, positive weights and divisible items, replacing some lower-ratio weight by the same weight of a higher-ratio item cannot decrease value. Continue until higher ratios are exhausted. At capacity 50, the example takes items 1 and 2 and 20/30 of item 3: 60 + 100 + 80 = 240. A half of item 3 gives value 220 but uses only 45 capacity. This exchange is not legal for indivisible 0/1 items.',
                  )}
                </p>
                <p>
                  {tr(
                    'Checkboxes determine which items are available. Fractions and maximum value are computed for those available items. Editing values or weights recomputes the ratio ordering; the display keeps the original item numbers.',
                  )}
                </p>
              </article>
            </div>
            <div className="ge-coin-editor">
              <h3>{tr('Explore a coin system')}</h3>
              <label>
                {tr('Coin denominations')}
                <input aria-label={tr('Coin denominations')} value={coinDraft} onChange={(e) => setCoinDraft(e.target.value)} />
              </label>
              <label>
                {tr('Amount')}
                <input aria-label={tr('Coin amount')} type="number" min={0} max={100} value={amountDraft} onChange={(e) => setAmountDraft(e.target.value)} />
              </label>
              <button onClick={updateCoins}>{tr('Compare coin solutions')}</button>
              <p>
                {tr(
                  'Largest-first is compared with exact dynamic programming. A remainder or an unreachable amount is reported instead of claiming a complete solution.',
                )}
              </p>
            </div>
            <div className="ge-related">
              <a href="/greedy/activity-selection">{tr('Activity Selection →')}</a>
              <a href="/greedy/fractional-knapsack">{tr('Fractional Knapsack →')}</a>
              <a href="/greedy/job-sequencing">{tr('Job Sequencing →')}</a>
              <a href="/greedy/huffman-coding">{tr('Huffman Coding →')}</a>
            </div>
          </details>
        </>
      )}
      {(tab === 'Practice' || tab === 'Quiz') && (
        <Panel
          className="ge-lab"
          title={tr('Predict the next greedy decision')}
          description="Use the selected schedule and the next interval to decide whether to accept or skip."
          icon={<Trophy />}
        >
          <p>
            {tr('Already selected: ')}
            {selected.map((a) => `${a.id} [${a.start}, ${a.finish}]`).join(', ') || '∅'}
          </p>
          <p>
            {cursor < trace.frames.length
              ? tr('Next activity: ') + `${trace.frames[cursor].activity.id} [${trace.frames[cursor].activity.start}, ${trace.frames[cursor].activity.finish}]`
              : tr('The trace is complete. Reset it to predict the first decision.')}
          </p>
          <div className="ge-controls">
            <button
              onClick={() => {
                setCursor(0)
                setFeedback('')
              }}
            >
              {tr('Reset prediction trace')}
            </button>
            <select
              aria-label={tr('Predicted activity decision')}
              value={prediction}
              onChange={(e) => {
                setPrediction(e.target.value)
                setFeedback('')
              }}
            >
              <option value="">{tr('Choose accept or skip')}</option>
              <option value="accept">{tr('Accept')}</option>
              <option value="skip">{tr('Skip')}</option>
            </select>
            <button disabled={cursor === trace.frames.length || !prediction} onClick={predict}>
              {tr('Check prediction')}
            </button>
            <button
              disabled={cursor === trace.frames.length}
              onClick={() => {
                setCursor(cursor + 1)
                setFeedback('')
                setPrediction('')
              }}
            >
              {tr('Reveal next decision')}
            </button>
          </div>
          {feedback && (
            <p className="ge-prediction-feedback" role="status">
              {tr(feedback)}
            </p>
          )}
          {tab === 'Quiz' && (
            <div className="ge-quiz">
              <h3>{tr('What makes the exchange safe?')}</h3>
              {[
                ['duration', 'The chosen activity has the longest duration.'],
                ['finish', 'The greedy activity ends no later than the first activity it replaces.'],
                ['example', 'The rule worked on one example.'],
              ].map(([value, label]) => (
                <label key={value}>
                  <input type="radio" name="exchange-proof" value={value} checked={quiz === value} onChange={(e) => setQuiz(e.target.value)} />
                  {tr(label)}
                </label>
              ))}
              <button
                onClick={() => {
                  setQuizFeedback(
                    quiz === 'finish'
                      ? 'Correct. The suffix remains feasible and the number of activities is unchanged.'
                      : 'Not yet. A safe exchange must preserve feasibility and the objective.',
                  )
                  if (quiz === 'finish') progress('prediction')
                }}
              >
                {tr('Check answer')}
              </button>
              {quizFeedback && (
                <p className="ge-quiz-feedback" role="status">
                  {tr(quizFeedback)}
                </p>
              )}
            </div>
          )}
        </Panel>
      )}
      {tab === 'Notes' && (
        <Panel className="ge-lab" title={tr('Your exchange-argument notes')} description="Saved automatically in this browser." icon={<FileText />}>
          <LanguageSelector />
          <label>
            {tr('Record the greedy choice, exchange, feasibility and objective.')}
            <textarea aria-label={tr('Greedy exchange notes')} rows={12} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </label>
        </Panel>
      )}
    </div>
  )
}
