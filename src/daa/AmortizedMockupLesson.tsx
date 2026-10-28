// @localized-render
import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  BookOpen,
  CheckCircle2,
  ClipboardCheck,
  ClipboardList,
  CodeXml,
  Clock3,
  Database,
  FileText,
  Lightbulb,
  Pause,
  Play,
  PlusCircle,
  RotateCcw,
  Sparkles,
  Trash2,
  Trophy,
  Zap,
  XCircle,
} from 'lucide-react'
import { LanguageSelector } from '../i18n/LanguageSelector'
import { tx, useLocaleRender } from '../i18n/render'
import { usePersistentState, persistentString } from '../hooks/usePersistentState'
import { MockupLessonChrome, type MockupPageProps } from './MockupLessonChrome'
import { appendOperations, dynamicArrayTrace, stackCreditTrace, type ArrayTrace, type ArraySnapshot } from './amortizedModel'
import './amortized-mockup.css'
const tr = (s: string) => tx(s, 'studios')
type Tab = 'Learn' | 'Visualize' | 'Practice' | 'Quiz' | 'Notes'
const tabs: Tab[] = ['Learn', 'Visualize', 'Practice', 'Quiz', 'Notes'],
  icons = [BookOpen, Play, CodeXml, Trophy, FileText]
const worked = dynamicArrayTrace(appendOperations(8))
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
    <section className={`mom-panel am-panel ${className}`}>
      <header>
        <span className="am-icon">{icon}</span>
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
    <svg className="am-hero-art" viewBox="0 0 290 125" aria-hidden="true">
      <defs>
        <linearGradient id={`${id}-blue`} x2="0" y2="1">
          <stop stopColor="#a9e7ff" />
          <stop offset="1" stopColor="#8b64ff" />
        </linearGradient>
        <linearGradient id={`${id}-purple`} x2="0" y2="1">
          <stop stopColor="#a985ff" />
          <stop offset="1" stopColor="#5932ee" />
        </linearGradient>
      </defs>
      <path d="M-80 146C-20 65 30 148 104 87S196 14 299-8L303 58C207 74 218 109 194 124S63 135 28 159Z" fill="#dcecff" opacity=".38" />
      {[0, 1, 2, 3].map((i) => (
        <g key={i} transform={`translate(0,${-i * 18})`}>
          <path d="M59 84L100 61L141 84L100 108Z" fill={i === 3 ? '#ceefff' : '#b4a2ff'} stroke="#c3e8ff" />
          <path d="M59 84L100 108V122L59 99Z" fill={i === 3 ? `url(#${id}-blue)` : `url(#${id}-purple)`} />
          <path d="M100 108L141 84V99L100 122Z" fill={i === 3 ? '#86c5ff' : '#6743e9'} />
        </g>
      ))}
      <path d="M6 72L26 61L46 72V108L26 120L6 108Z" fill="#97dfff" opacity=".85" stroke="white" />
      <path d="M6 72L26 84L46 72M26 84V120M6 90L26 102L46 90" stroke="white" fill="none" />
      <path d="M166 116L181 97L194 116L208 83L224 93L242 64" fill="none" stroke="#b1bfff" strokeWidth="2" />
      {[
        [166, 116],
        [181, 97],
        [194, 116],
        [208, 83],
        [224, 93],
        [242, 64],
      ].map(([x, y]) => (
        <circle key={x} cx={x} cy={y} r="4.5" fill="#a198ff" />
      ))}
    </svg>
  )
}
function Coin({ count = 1 }: { count?: number }) {
  const id = useId()
  return (
    <span className="am-coins" aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <svg key={i} viewBox="0 0 30 30">
          <defs>
            <radialGradient id={`${id}-${i}`}>
              <stop stopColor="#fff7aa" />
              <stop offset="1" stopColor="#ffa700" />
            </radialGradient>
          </defs>
          <ellipse cx="15" cy="17" rx="12" ry="11" fill="#ed9700" />
          <circle cx="15" cy="14" r="12" fill={`url(#${id}-${i})`} stroke="#f3b222" />
          <circle cx="15" cy="14" r="8" fill="none" stroke="#ffe889" strokeWidth="1.6" />
          <path d="M17 8Q10 8 11 13Q11 16 17 16Q22 21 12 21M15 6V23" fill="none" stroke="#eaa521" strokeWidth="1.5" />
        </svg>
      ))}
    </span>
  )
}
function AmortizedBars() {
  return (
    <svg viewBox="0 0 28 28" fill="currentColor" aria-hidden="true">
      <rect x="3" y="15" width="5" height="11" rx="1.5" opacity=".6" />
      <rect x="10" y="8" width="5" height="18" rx="1.5" opacity=".85" />
      <rect x="17" y="2" width="5" height="24" rx="1.5" />
    </svg>
  )
}
function ArrayIcon() {
  return (
    <svg viewBox="0 0 28 28" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      {[18, 12, 6].map((y) => (
        <g key={y}>
          <path d={`M4 ${y}V${y + 3}C4 ${y + 9} 24 ${y + 9} 24 ${y + 3}V${y}`} fill="#81c1ff" />
          <ellipse cx="14" cy={y} rx="10" ry="4" fill="#60b2ff" />
        </g>
      ))}
    </svg>
  )
}
function Battery({ value, capacity }: { value: number; capacity: number }) {
  return (
    <svg className="am-battery" viewBox="0 0 112 40" role="img" aria-label={tr(`Potential ${value}, capacity ${capacity}`)}>
      <rect x="2" y="2" width="102" height="35" rx="6" fill="#f4f8fb" stroke="#8598b5" strokeWidth="2" />
      <rect x="105" y="12" width="5" height="15" rx="2" fill="#8495ad" />
      {Array.from({ length: 8 }, (_, i) => {
        const fill = Math.max(0, Math.min(1, (value / capacity) * 8 - i))
        return (
          <g key={i}>
            <rect x={7 + i * 11.5} y="6" width="10" height="27" rx="2" fill="#d6dfe5" />
            {fill > 0 && <rect x={7 + i * 11.5} y="6" width={10 * fill} height="27" rx="2" fill="#52bc69" />}
          </g>
        )
      })}
    </svg>
  )
}
function ArrayDisplay({ state }: { state: ArraySnapshot }) {
  const columns = Math.min(8, state.capacity)
  return (
    <div className="am-array-box">
      <h3>
        {tr('Array (size ')}
        {state.values.length}
        {tr(' / capacity ')}
        {state.capacity})
      </h3>
      <div className="am-array-area">
        <div className="am-slot-grid" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0,1fr))` }}>
          {Array.from({ length: state.capacity }, (_, i) => (
            <div className={`am-slot ${i < state.values.length ? 'filled' : ''}`} key={i}>
              <span>{i}</span>
              <strong title={i < state.values.length ? String(state.values[i]) : tr('Empty slot')}>{i < state.values.length ? state.values[i] : ''}</strong>
            </div>
          ))}
        </div>
        <div className="am-array-badges">
          <span>
            <Database size={13} />
            {tr('Capacity: ')}
            {state.capacity}
          </span>
          <span>
            <ClipboardList size={13} />
            {tr('Size: ')}
            {state.values.length}
          </span>
        </div>
      </div>
    </div>
  )
}
function AggregateChart({ run, cursor, onPick }: { run: ArrayTrace; cursor: number; onPick: (index: number) => void }) {
  const [hover, setHover] = useState<number>(),
    len = Math.max(10, run.operations.length),
    yStep = Math.max(10, Math.ceil((3 * len) / 40) * 10),
    maxY = Math.ceil((3 * len) / yStep) * yStep,
    top = 12,
    bottom = 105,
    left = 48,
    right = 305,
    x = (i: number) => left + (i / len) * (right - left),
    y = (c: number) => bottom - (c / maxY) * (bottom - top),
    mixed = run.operations.some((o) => o.kind === 'pop'),
    symbol = mixed ? 'm' : 'n'
  const xStep = len <= 10 ? 2 : Math.ceil(len / 5),
    ticks = Array.from({ length: Math.floor(len / xStep) + 1 }, (_, i) => i * xStep)
  if (ticks.at(-1) !== len) ticks.push(len)
  const yticks = Array.from({ length: maxY / yStep + 1 }, (_, i) => i * yStep)
  return (
    <div className="am-chart" onMouseLeave={() => setHover(undefined)}>
      <div className="am-chart-legend">
        <span>
          <i />
          {tr('Actual cumulative cost')}
        </span>
        <span>
          <i />
          {tr(`Amortized bound (3${symbol})`)}
        </span>
      </div>
      <svg viewBox="0 0 320 170" preserveAspectRatio="none" role="img" aria-label={tr('Cumulative actual work and a linear amortized upper bound')}>
        {yticks.map((v) => (
          <g key={v}>
            <path d={`M${left} ${y(v)}H${right}`} stroke="#e0e9f4" />
            <text x="39" y={y(v) + 4} textAnchor="end">
              {v}
            </text>
          </g>
        ))}
        {ticks.map((i) => (
          <g key={i}>
            <path d={`M${x(i)} ${top}V${bottom}`} stroke="#e6edf6" />
            <text x={x(i)} y="119" textAnchor="middle">
              {i}
            </text>
          </g>
        ))}
        <path d={`M${left} ${top}V${bottom}H${right}`} stroke="#98afcf" fill="none" />
        <polyline
          points={Array.from({ length: len + 1 }, (_, i) => `${x(i)},${y(i * 3)}`).join(' ')}
          fill="none"
          stroke="#fb465e"
          strokeWidth="1.4"
          strokeDasharray="5 4"
        />
        <polyline points={run.states.map((s) => `${x(s.step)},${y(s.totalCost)}`).join(' ')} fill="none" stroke="#0879ff" strokeWidth="1.8" />
        {ticks.map((i) => (
          <circle key={i} cx={x(i)} cy={y(i * 3)} r="2.4" fill="#fa4260" />
        ))}
        {run.states.map((s) => (
          <g
            key={s.step}
            role="button"
            tabIndex={0}
            aria-label={tr(`Inspect aggregate operation ${s.step}`)}
            onMouseEnter={() => setHover(s.step)}
            onFocus={() => setHover(s.step)}
            onClick={() => onPick(s.step)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onPick(s.step)
              }
            }}
          >
            <circle cx={x(s.step)} cy={y(s.totalCost)} r="8" fill="transparent" pointerEvents="all" />
            {cursor === s.step && <circle cx={x(s.step)} cy={y(s.totalCost)} r="5" fill="none" stroke="#98c6ff" />}
            <circle cx={x(s.step)} cy={y(s.totalCost)} r="2.8" fill="#087aff" />
            <title>{`${symbol}=${s.step}: actual ${s.totalCost}, bound ${3 * s.step}`}</title>
          </g>
        ))}
        <text x="176" y="145" textAnchor="middle">
          {tr(`Number of operations (${symbol})`)}
        </text>
        <text transform="translate(6 72) rotate(-90)" textAnchor="middle">
          {tr('Total cost')}
        </text>
      </svg>
      {hover !== undefined && run.states[hover] && (
        <output className="am-chart-tooltip">
          {symbol} = {hover} · {tr('actual: ')}
          {run.states[hover].totalCost} · {tr('bound: ')}
          {3 * hover}
        </output>
      )}
    </div>
  )
}
export function AmortizedMockupLesson(props: MockupPageProps) {
  useLocaleRender()
  const [tab, setTab] = useState<Tab>('Learn'),
    [run, setRun] = useState(() => dynamicArrayTrace(appendOperations(10))),
    [cursor, setCursor] = useState(5),
    [draft, setDraft] = useState('60'),
    [playing, setPlaying] = useState(false),
    [count, setCount] = useState('10'),
    [formulaTab, setFormulaTab] = useState('Key Formulas'),
    [error, setError] = useState(''),
    [notice, setNotice] = useState(''),
    [exampleStep, setExampleStep] = useState(-1),
    [stackOps, setStackOps] = useState<('push' | 'pop')[]>([]),
    [stackInteracted, setStackInteracted] = useState(false),
    [stackMessage, setStackMessage] = useState(''),
    [showCalculation, setShowCalculation] = useState(false),
    [prediction, setPrediction] = useState(''),
    [predictedAmortized, setPredictedAmortized] = useState(''),
    [feedback, setFeedback] = useState(''),
    [answer, setAnswer] = useState(''),
    [quizFeedback, setQuizFeedback] = useState('')
  const [notes, setNotes] = usePersistentState('amortized-analysis-notes', '', persistentString),
    timelineRef = useRef<HTMLDivElement>(null),
    state = run.states[cursor],
    previous = run.states[Math.max(0, cursor - 1)],
    stack = stackCreditTrace(stackOps).states.at(-1)!
  useEffect(() => {
    if (!playing) return
    const timer = window.setTimeout(() => {
      if (cursor >= run.operations.length) {
        setPlaying(false)
        return
      }
      setCursor(cursor + 1)
      if (cursor + 1 === run.operations.length) setPlaying(false)
    }, 550)
    return () => window.clearTimeout(timer)
  }, [playing, cursor, run.operations.length])
  useEffect(() => {
    const box = timelineRef.current,
      row = box?.querySelector<HTMLElement>(`[data-step="${cursor}"]`)
    if (!box || !row) return
    if (cursor <= 5) box.scrollTop = 0
    else if (row.offsetTop + row.offsetHeight > box.scrollTop + box.clientHeight) box.scrollTop = row.offsetTop + row.offsetHeight - box.clientHeight
    else if (row.offsetTop < box.scrollTop) box.scrollTop = row.offsetTop
  }, [cursor])
  function open(next: Tab) {
    setTab(next)
    setPlaying(false)
    setNotice('')
  }
  function pick(index: number) {
    setCursor(index)
    setPlaying(false)
    setDraft(String(Math.min(1e6, (run.states[index].values.at(-1) ?? 0) + 10)))
    setFeedback('')
  }
  function push() {
    try {
      if (!draft.trim()) throw new Error('Enter a finite value to append.')
      const value = Number(draft),
        next = dynamicArrayTrace([...run.operations.slice(0, cursor), { kind: 'push', value }])
      setRun(next)
      setCursor(next.operations.length)
      setPlaying(false)
      setDraft(String(Math.min(1e6, value + 10)))
      setError('')
      setNotice('')
      setFeedback('')
      setExampleStep(-1)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to append this value.')
    }
  }
  function pop() {
    try {
      const next = dynamicArrayTrace([...run.operations.slice(0, cursor), { kind: 'pop' }])
      setRun(next)
      setCursor(next.operations.length)
      setPlaying(false)
      setError('')
      setFeedback('')
      setNotice('')
      setExampleStep(-1)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to pop.')
    }
  }
  function reset() {
    setRun(dynamicArrayTrace([]))
    setCursor(0)
    setDraft('10')
    setPlaying(false)
    setError('')
    setNotice('')
    setExampleStep(-1)
    setFeedback('')
  }
  function load(n: number, selected = 0) {
    try {
      const next = dynamicArrayTrace(appendOperations(n))
      setRun(next)
      setCursor(Math.max(0, Math.min(selected, n)))
      setDraft(String(Math.min(1e6, (selected + 1) * 10)))
      setPlaying(false)
      setError('')
      setNotice('')
      setFeedback('')
      setExampleStep(-1)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Invalid append count.')
    }
  }
  function stackAction(op: 'push' | 'pop') {
    try {
      const next = [...stackOps, op]
      stackCreditTrace(next)
      setStackOps(next)
      setStackInteracted(true)
      setStackMessage('')
      setNotice('')
      setError('')
    } catch (e) {
      setStackMessage(e instanceof Error ? e.message : 'Invalid stack operation.')
    }
  }
  function exportRun() {
    const url = URL.createObjectURL(
      new Blob([JSON.stringify({ operations: run.operations, states: run.states, selectedStep: cursor }, null, 2)], { type: 'application/json' }),
    )
    const a = document.createElement('a')
    a.href = url
    a.download = 'amortized-array-trace.json'
    a.click()
    URL.revokeObjectURL(url)
  }
  function predict() {
    try {
      const next = dynamicArrayTrace([...run.operations.slice(0, cursor), { kind: 'push', value: 0 }]).states.at(-1)!
      setFeedback(
        prediction.trim() !== '' && predictedAmortized.trim() !== '' && Number(prediction) === next.cost && Number(predictedAmortized) === next.amortizedCost
          ? `Correct! Actual cost = ${next.cost}; amortized cost = ${next.amortizedCost}.`
          : `Not yet. Actual cost is one write plus any copied elements. Then add ΔΦ = ${next.potential - state.potential} to obtain the amortized cost.`,
      )
      setError('')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Reset or pop before predicting another append.')
    }
  }
  return (
    <div className={`mom-page amortized-page target-visual ${state.capacity > 8 ? 'am-large' : ''}`} data-target="11">
      <MockupLessonChrome
        {...props}
        showLanguage={false}
        title={tr('Amortized Analysis')}
        description={tr('Bound the total cost of a sequence without a probabilistic assumption.')}
        heroIcon={<LayersIcon />}
        decoration={<HeroArt />}
        onStart={() => open('Visualize')}
        badges={
          <>
            <span>
              <Clock3 />
              {tr('15–20 min')}
            </span>
            <span>
              <BarChart3 />
              {tr('Intermediate')}
            </span>
            <span>
              <ClipboardCheck />
              {tr('6 key concepts')}
            </span>
          </>
        }
      />
      <nav className="mom-tabs am-tabs" aria-label={tr('Algorithm sections')}>
        {tabs.map((name, i) => {
          const Icon = icons[i]
          return (
            <button key={name} aria-pressed={tab === name} onClick={() => open(name)}>
              <Icon size={18} />
              {tr(name)}
            </button>
          )
        })}
      </nav>
      {error && (
        <p className="am-error" role="alert">
          {tr(error)}
        </p>
      )}
      {(tab === 'Learn' || tab === 'Visualize') && (
        <>
          {tab === 'Visualize' && (
            <Panel
              className="am-trace-panel"
              title={tr('Explore each operation and its amortized charge')}
              description="Choose a timeline step or chart point to inspect a snapshot. Appending or popping replaces the future after that step."
              icon={<Play />}
            >
              <div className="am-toolbar">
                <button disabled={cursor === 0} onClick={() => pick(cursor - 1)}>
                  {tr('Step back')}
                </button>
                <button disabled={cursor === run.operations.length} onClick={() => pick(cursor + 1)}>
                  {tr('Step forward')}
                </button>
                <button
                  disabled={!run.operations.length}
                  onClick={() => {
                    if (cursor === run.operations.length) setCursor(0)
                    setPlaying(!playing)
                  }}
                >
                  {playing ? <Pause size={15} /> : <Play size={15} />} {tr(playing ? 'Pause' : 'Auto Run')}
                </button>
                <button onClick={() => load(10, 5)}>{tr('Reference example')}</button>
                <label>
                  {tr('Appends')}
                  <input type="number" min={0} max={32} aria-label={tr('Append example count')} value={count} onChange={(e) => setCount(e.target.value)} />
                </label>
                <button onClick={() => load(count.trim() ? Number(count) : NaN)}>{tr('Load append sequence')}</button>
                <button onClick={exportRun}>{tr('Export JSON')}</button>
                <button
                  onClick={() => {
                    setStackOps([])
                    setStackInteracted(false)
                    setStackMessage('')
                  }}
                >
                  {tr('Reset stack example')}
                </button>
              </div>
              <p className="am-trace-status" role="status">
                {tr('Step ')}
                {cursor}/{run.operations.length} · {tr('copies: ')}
                {state.copies} · {tr('ΔΦ = ')}
                {state.potential - previous.potential} · {tr('amortized cost = ')}
                {state.amortizedCost}
              </p>
              <input
                className="am-scrubber"
                type="range"
                aria-label={tr('Selected operation')}
                min={0}
                max={run.operations.length}
                value={cursor}
                onChange={(e) => pick(Number(e.target.value))}
              />
              <p className="am-trace-caption">
                {tr(
                  'Costs count writes, copies and valid pops as one unit each. Capacity never shrinks. The chart includes the whole planned trace; counters describe only the selected prefix.',
                )}
              </p>
            </Panel>
          )}
          <div className="am-overview-grid">
            <div className="am-main-column">
              <section className="mom-panel am-visualizer">
                <header>
                  <span className="am-icon">
                    <ArrayIcon />
                  </span>
                  <div>
                    <h2>{tr('Dynamic Array Resizing Visualizer')}</h2>
                    <p>{tr('Push elements to see capacity doubling and the cost of resizing.')}</p>
                  </div>
                  <div className="am-stats">
                    <div>
                      <span>{tr('Actual cost (this op)')}</span>
                      <b className="am-actual">{state.cost}</b>
                    </div>
                    <div>
                      <span>{tr('Total actual cost')}</span>
                      <b className="am-total">{state.totalCost}</b>
                    </div>
                    <div>
                      <span>{tr('Resize events')}</span>
                      <b className="am-resizes">{state.resizeCount}</b>
                    </div>
                  </div>
                </header>
                <div className="am-visualizer-body">
                  <div className="am-array-panel">
                    <ArrayDisplay state={state} />
                    <div className="am-array-controls">
                      <label>
                        <span>{tr('Enter a value')}</span>
                        <input aria-label={tr('Value to append')} type="number" step="any" value={draft} onChange={(e) => setDraft(e.target.value)} />
                      </label>
                      <button className="am-primary" onClick={push} disabled={cursor >= 64 || state.values.length >= 32}>
                        <PlusCircle size={16} />
                        {tr('Push (Append)')}
                      </button>
                      <button className="am-pop" onClick={pop} disabled={!state.values.length || cursor >= 64}>
                        <Trash2 size={16} />
                        {tr('Pop')}
                      </button>
                      <button onClick={reset}>
                        <RotateCcw size={16} />
                        {tr('Reset')}
                      </button>
                    </div>
                  </div>
                  <div className="am-timeline">
                    <h3>{tr('Operation Timeline')}</h3>
                    <div className="am-timeline-list" ref={timelineRef}>
                      {run.states.slice(1).map((s) => (
                        <button
                          key={s.step}
                          data-step={s.step}
                          className={`${s.step === cursor ? 'current' : ''} ${s.step > cursor ? 'future' : ''}`}
                          aria-label={tr(`Inspect operation ${s.step}`)}
                          onClick={() => pick(s.step)}
                        >
                          <b>{s.step}</b>
                          <span>{s.kind === 'push' ? `push(${s.value})` : 'pop()'}</span>
                          <span>
                            {tr('cost = ')}
                            {s.cost}
                          </span>
                          <span>
                            {tr('size = ')}
                            {s.values.length}
                          </span>
                        </button>
                      ))}
                      {!run.operations.length && <p>{tr('No operations yet. Push a value to begin.')}</p>}
                    </div>
                  </div>
                </div>
              </section>
              <div className="am-method-grid">
                <Panel
                  className="am-accounting"
                  title={tr('Accounting Method (Stack Example)')}
                  description="Charge 2 credits for push and 0 for pop. One credit pays for the future pop."
                  icon={<Coin />}
                >
                  <div className="am-stack-diagram">
                    <button onClick={() => stackAction('push')} aria-label={tr('Push a stack item')}>
                      <b>{tr('Push x')}</b>
                      <span>{tr('Pay 2 credits')}</span>
                      <Coin count={2} />
                    </button>
                    <ArrowRight />
                    <button onClick={() => stackAction('pop')} aria-label={tr('Pop a stack item')}>
                      <b>{tr('Pop')}</b>
                      <span>{tr('Use 1 credit')}</span>
                      <Coin />
                    </button>
                  </div>
                  <div className="am-method-note gold">
                    {stackMessage ? (
                      <p className="am-stack-feedback" role="status">
                        {tr(stackMessage)}
                      </p>
                    ) : stackInteracted ? (
                      <p className="am-stack-balance">
                        {tr('Saved credits: ')}
                        <b>{stack.credits}</b> · {tr('charged: ')}
                        {stack.totalCharged} · {tr('actual: ')}
                        {stack.totalActual}
                        <br />
                        {tr('Each remaining stack item carries one credit.')}
                      </p>
                    ) : (
                      <p>{tr('Each push stores one credit on the item. When that item is popped, we use the credit to pay.')}</p>
                    )}
                  </div>
                </Panel>
                <Panel
                  className="am-potential"
                  title={tr('Potential Method (Dynamic Array)')}
                  description="Use Φ = max(0, 2·size − capacity) as potential."
                  icon={<Zap />}
                >
                  <div className="am-potential-row">
                    <div>
                      <h3>{tr('Potential (Φ)')}</h3>
                      <Battery value={state.potential} capacity={state.capacity} />
                      <b className="am-phi">Φ = {state.potential}</b>
                    </div>
                    <button
                      className="am-potential-equation"
                      aria-label={tr('Inspect amortized cost calculation')}
                      aria-pressed={showCalculation}
                      onClick={() => setShowCalculation(!showCalculation)}
                    >
                      <b>{tr('Amortized cost')}</b>
                      <i>
                        {showCalculation ? `ĉ = ${state.cost} + ${state.potential} − ${previous.potential} = ${state.amortizedCost}` : 'ĉᵢ = cᵢ + Φᵢ − Φᵢ₋₁'}
                      </i>
                    </button>
                  </div>
                  <div className="am-method-note blue">
                    <p>{tr('Potential stores prepaid work. Copy-heavy growth can spend it; cheap appends rebuild it.')}</p>
                  </div>
                </Panel>
                <Panel
                  className="am-aggregate"
                  title={tr('Aggregate Analysis Chart')}
                  description="Total actual cost vs amortized bound for the planned sequence (with doubling)."
                  icon={<AmortizedBars />}
                >
                  <AggregateChart run={run} cursor={cursor} onPick={pick} />
                </Panel>
              </div>
            </div>
            <aside className="am-side-column">
              <article className="am-takeaways">
                <h2>
                  <Lightbulb />
                  {tr('Key Takeaways')}
                </h2>
                {[
                  ['Amortized analysis bounds the total cost', ' over a sequence of operations, not per operation.'],
                  ['Inexpensive operations pay for expensive ones', ' using credits or potential.'],
                  ['Common methods: aggregate, accounting,', ' and potential method.'],
                  ['Amortized bounds are deterministic', ' and not based on probability or average case.'],
                ].map(([lead, text]) => (
                  <p key={lead}>
                    <CheckCircle2 />
                    <span>
                      <b>{tr(lead)}</b>
                      {tr(text)}
                    </span>
                  </p>
                ))}
              </article>
              <article className="am-pitfalls">
                <h2>
                  <AlertTriangle />
                  {tr('Common Pitfalls')}
                </h2>
                {[
                  ['Confusing amortized with average-case', 'Amortized is worst-case over a sequence.'],
                  ['Not charging enough credits', 'Credits must cover future expensive work.'],
                  ['Forgetting the sequence model', 'Bounds apply to a sequence, not a single operation.'],
                  ['Misinterpreting the potential function', 'Potential must justify the total-cost bound.'],
                ].map(([lead, text]) => (
                  <p key={lead}>
                    <XCircle />
                    <span>
                      <b>{tr(lead)}</b>
                      <span>{tr(text)}</span>
                    </span>
                  </p>
                ))}
              </article>
              <article className="am-pro-tip">
                <Sparkles />
                <div>
                  <h2>{tr('Pro Tip')}</h2>
                  <p>
                    {tr(
                      'Think in terms of a bank account: save credits during cheap operations to pay for costly ones later. The total balance should never go negative.',
                    )}
                  </p>
                </div>
              </article>
            </aside>
          </div>
          <div className="am-bottom-grid">
            <Panel
              className="am-worked"
              title={tr('Worked Example: Dynamic Array Append')}
              description="Start with an empty array of capacity 1. Append 8 elements."
              icon={<ClipboardList />}
            >
              <div className="am-worked-body">
                <div className="am-table-scroll">
                  <table>
                    <tbody>
                      <tr>
                        <th>{'n ='}</th>
                        {worked.states.slice(1).map((s) => (
                          <td key={s.step}>
                            <button
                              aria-label={tr(`Inspect worked append ${s.step}`)}
                              aria-pressed={exampleStep === s.step}
                              onClick={() => {
                                setRun(worked)
                                pickWorked(s.step)
                              }}
                            >
                              {s.step}
                            </button>
                          </td>
                        ))}
                      </tr>
                      {[
                        ['Capacity:', (s: ArraySnapshot) => s.capacity],
                        ['Cost this op:', (s: ArraySnapshot) => s.cost],
                        ['Total cost:', (s: ArraySnapshot) => s.totalCost],
                      ].map(([label, read]) => (
                        <tr key={label as string}>
                          <th>{tr(label as string)}</th>
                          {worked.states.slice(1).map((s) => (
                            <td key={s.step}>{(read as (s: ArraySnapshot) => number)(s)}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="am-worked-analysis">
                  <h3>{tr('Analysis')}</h3>
                  <ul>
                    <li>{tr('Resizes at appends 2, 3 and 5, copying 1, 2 and 4 elements.')}</li>
                    <li>{tr('Total work = 1 + 2 + 3 + 1 + 5 + 1 + 1 + 1 = 15.')}</li>
                    <li>{tr('Amortized cost per append is O(1), since total work is O(n).')}</li>
                  </ul>
                </div>
              </div>
            </Panel>
            <Panel className="am-formulas" title={tr('Formulas, Assumptions and Interpretation')} icon={<BookOpen />}>
              <div className="am-formula-tabs">
                {['Key Formulas', 'Assumptions', 'Interpretation'].map((label) => (
                  <button key={label} aria-pressed={formulaTab === label} onClick={() => setFormulaTab(label)}>
                    {tr(label)}
                  </button>
                ))}
              </div>
              {formulaTab === 'Key Formulas' ? (
                <div className="am-formula-grid">
                  <div>
                    <b>{tr('Amortized cost formula')}</b>
                    <i>{'ĉᵢ = cᵢ + Φᵢ − Φᵢ₋₁'}</i>
                  </div>
                  <dl>
                    <dt>{'cᵢ'}</dt>
                    <dd>{tr('actual cost of operation i')}</dd>
                    <dt>ĉᵢ</dt>
                    <dd>{tr('amortized cost of operation i')}</dd>
                    <dt>Φᵢ</dt>
                    <dd>{tr('potential after operation i')}</dd>
                  </dl>
                </div>
              ) : (
                <div className="am-formula-detail">
                  {tr(
                    formulaTab === 'Assumptions'
                      ? 'Initial capacity is 1. A write, copied element or valid pop costs 1 unit. Capacity doubles when full and never shrinks. The demo allows 32 live elements and 64 operations.'
                      : 'With Φ = max(0, 2·size − capacity), Φ₀ = 0 and Φ stays nonnegative. Thus Σ actual ≤ Σ amortized ≤ 3m for m operations. An individual operation can still be expensive.',
                  )}
                </div>
              )}
            </Panel>
          </div>
          {notice && (
            <p className="am-notice" role="status">
              {tr(notice)}
              <button onClick={() => setNotice('')}>{tr('Close')}</button>
            </p>
          )}
          <details className="am-theory">
            <summary>{tr('Why doubling gives constant amortized cost')}</summary>
            <p>
              {tr(
                'Appending to spare capacity costs one write. Appending to a full array of capacity C copies C existing elements into capacity 2C, then writes the new element: actual cost C + 1. Copy costs form the geometric series 1 + 2 + 4 + … . For n appends from capacity 1, total work is n + final capacity − 1, which is less than 3n for n > 0.',
              )}
            </p>
            <p>
              {tr(
                'The bound 2n does not hold for every prefix: 9 appends cost 24, which exceeds 18. The 8-append example costs 15; it resizes at appends 2, 3 and 5. The potential Φ = max(0, 2n − C) is nonnegative and starts at zero. A cheap append increases it by at most 2. A full-array append has ΔΦ = 2 − C, so its amortized cost is (C + 1) + (2 − C) = 3. Pops retain capacity and have amortized cost at most 1, sometimes negative. Telescoping potentials proves the linear bound for mixed sequences too.',
              )}
            </p>
            <p>
              {tr(
                'The accounting diagram is a separate abstract stack with unit-cost pushes and pops. Charging 2 per push and 0 per pop leaves one credit on each stored item. It does not use that stack charge to pay for dynamic-array resizing. The chart previews every operation in the loaded trace; selecting a step changes the inspected prefix, and a new live push/pop replaces the planned future.',
              )}
            </p>
          </details>
        </>
      )}
      {(tab === 'Practice' || tab === 'Quiz') && (
        <Panel
          className="am-extra"
          title={tr('Predict the next append cost')}
          description="Cost depends on the selected size and capacity, not on the appended value."
          icon={<Trophy />}
        >
          <p>
            {tr('Current size: ')}
            {state.values.length} · {tr('Capacity: ')}
            {state.capacity} · Φ = {state.potential}
          </p>
          <div className="am-prediction-inputs">
            <label>
              {tr('Predicted actual cost')}
              <input
                type="number"
                step="any"
                aria-label={tr('Predicted actual append cost')}
                value={prediction}
                onChange={(e) => {
                  setPrediction(e.target.value)
                  setFeedback('')
                }}
              />
            </label>
            <label>
              {tr('Predicted amortized cost')}
              <input
                type="number"
                step="any"
                aria-label={tr('Predicted amortized append cost')}
                value={predictedAmortized}
                onChange={(e) => {
                  setPredictedAmortized(e.target.value)
                  setFeedback('')
                }}
              />
            </label>
          </div>
          <button onClick={predict} disabled={state.values.length >= 32 || cursor >= 64}>
            {tr('Check prediction')}
          </button>
          {feedback && (
            <p className="am-prediction-feedback" role="status">
              {tr(feedback)}
            </p>
          )}
          {tab === 'Quiz' && (
            <div className="am-concept-quiz">
              <h3>{tr('What makes amortized analysis different from average-case analysis?')}</h3>
              {[
                ['probability', 'It assumes a random distribution of inputs.'],
                ['sequence', 'It deterministically bounds total cost over a sequence.'],
                ['individual', 'It makes every individual operation constant-time.'],
              ].map(([value, label]) => (
                <label key={value}>
                  <input type="radio" name="amortized-quiz" value={value} checked={answer === value} onChange={(e) => setAnswer(e.target.value)} />
                  {tr(label)}
                </label>
              ))}
              <button
                onClick={() =>
                  setQuizFeedback(
                    answer === 'sequence'
                      ? 'Correct. No probability model is needed; expensive operations are paid for over the sequence.'
                      : 'Not yet. Amortized analysis bounds the whole sequence without averaging over random inputs.',
                  )
                }
              >
                {tr('Check answer')}
              </button>
              {quizFeedback && (
                <p className="am-quiz-feedback" role="status">
                  {tr(quizFeedback)}
                </p>
              )}
            </div>
          )}
        </Panel>
      )}
      {tab === 'Notes' && (
        <Panel className="am-extra" title={tr('Your amortized-analysis notes')} description="Saved automatically in this browser." icon={<FileText />}>
          <LanguageSelector />
          <label>
            {tr('Record the cost model, potential and why 3n is a valid bound.')}
            <textarea rows={12} aria-label={tr('Amortized-analysis notes')} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </label>
        </Panel>
      )}
    </div>
  )
  function pickWorked(step: number) {
    setCursor(step)
    setDraft(String((step + 1) * 10))
    setPlaying(false)
    setExampleStep(step)
    setError('')
    setNotice('')
    setFeedback('')
  }
}
function LayersIcon() {
  return (
    <svg viewBox="0 0 50 55" aria-hidden="true">
      <path d="M6 36L25 26L44 36V42L25 52L6 42Z" fill="#0872ed" stroke="#a2e2ff" strokeWidth="2" />
      <path d="M6 24L25 14L44 24V30L25 40L6 30Z" fill="#168dff" stroke="#d0f1ff" strokeWidth="2" />
      <path d="M6 12L25 2L44 12V18L25 28L6 18Z" fill="#64c8ff" stroke="#c1eeff" strokeWidth="2" />
    </svg>
  )
}
