// @localized-render
import { useEffect, useId, useState, type ReactNode } from 'react'
import {
  Activity,
  BarChart3,
  CheckCircle2,
  ClipboardList,
  Clock3,
  Code2,
  Database,
  Lightbulb,
  Network,
  Pause,
  Play,
  RotateCcw,
  ShieldCheck,
  Target,
  Timer,
} from 'lucide-react'
import { tx, useLocaleRender } from '../i18n/render'
import { MockupLessonChrome, MockupTabs, type MockupPageProps, type MockupTab } from './MockupLessonChrome'
import { maximumSubarrayTrace, maximumExample, parseMaximumValues, type MaximumNode, type MaximumRun, type Subarray } from './maximumSubarrayModel'
import source from './maximumSubarrayModel.ts?raw'
import './maximum-subarray-mockup.css'

const tr = (s: string) => tx(s, 'studios')
const f = (n: number) => Number(n.toPrecision(8)).toString()
const range = (a: Subarray) => `[${a.start}, ${a.end}]`
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
    <section className={`mom-panel mx-panel ${className}`}>
      <header>
        <span className="mx-icon">{icon}</span>
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
  return (
    <svg className="mx-hero-art" viewBox="0 0 300 120" aria-hidden="true">
      <defs>
        <linearGradient id="mx-bar-blue" x2="0" y2="1">
          <stop stopColor="#6dd3ff" />
          <stop offset="1" stopColor="#0870ff" />
        </linearGradient>
        <linearGradient id="mx-bar-pink" x2="0" y2="1">
          <stop stopColor="#ffb3d6" />
          <stop offset="1" stopColor="#ff438a" />
        </linearGradient>
      </defs>
      <path d="M0 113C67 139 89 27 158 43S196 -9 237 15S268 29 294 16" fill="none" stroke="#a4cdff" strokeWidth="5" />
      {[18, 55, 24, 59, 94, 44, 22, 58].map((h, i) => (
        <g key={i}>
          <path d={`M${8 + i * 31} ${110 - h}l9 -6h22l-9 6Z`} fill={i === 2 || i === 3 || i === 5 ? '#ffc0dc' : '#b0eaff'} />
          <path
            d={`M${8 + i * 31} ${110 - h}h22v${h}h-22Z`}
            fill={i === 2 || i === 3 || i === 5 ? 'url(#mx-bar-pink)' : 'url(#mx-bar-blue)'}
            stroke="#a8d6ff"
          />
          <path d={`M${30 + i * 31} ${110 - h}l9 -6v${h}l-9 6Z`} fill={i === 2 || i === 3 || i === 5 ? '#ff83b8' : '#65b4ff'} opacity=".7" />
        </g>
      ))}
    </svg>
  )
}
function Bars({
  values,
  offset = 0,
  mid,
  highlight,
  onInspect,
  mini = false,
  compact = false,
}: {
  values: number[]
  offset?: number
  mid?: number
  highlight?: Subarray
  onInspect?: (index: number) => void
  mini?: boolean
  compact?: boolean
}) {
  const gradientId = useId()
  const width = Math.max(320, values.length * (compact ? 40 : 72)),
    pad = 14,
    cell = (width - pad * 2) / values.length,
    scale = 36 / Math.max(1, ...values.map(Math.abs)),
    baseline = compact ? 53 : mini ? 60 : 53
  return (
    <div className={`mx-bars ${mini ? 'mini' : ''}`}>
      <svg
        viewBox={`0 0 ${width} 110`}
        preserveAspectRatio="none"
        role="img"
        aria-label={tr('Array values above and below zero')}
        style={{ minWidth: values.length > 16 ? values.length * 28 : undefined }}
      >
        <defs>
          <linearGradient id={`${gradientId}-positive`} x2="0" y2="1">
            <stop stopColor="#a4d8ff" />
            <stop offset="1" stopColor="#68a7ff" />
          </linearGradient>
          <linearGradient id={`${gradientId}-negative`} x2="0" y2="1">
            <stop stopColor="#ffd5e3" />
            <stop offset="1" stopColor="#ff9abb" />
          </linearGradient>
        </defs>
        {highlight && (
          <rect
            className="mx-highlight"
            x={pad + Math.max(0, highlight.start - offset) * cell - 4}
            y="4"
            width={Math.min(values.length, highlight.end - offset + 1) * cell - Math.max(0, highlight.start - offset) * cell + 8}
            height="82"
            rx="7"
          />
        )}
        <path d={`M3 ${baseline}H${width - 3}`} stroke="#d6e3f4" />
        {mid !== undefined && mid >= offset && mid < offset + values.length - 1 && (
          <path d={`M${pad + (mid - offset + 1) * cell} 0V99`} stroke="#dd5897" strokeWidth="1.4" strokeDasharray="4 3" />
        )}
        {values.map((v, i) => {
          const h = Math.abs(v) * scale,
            x = pad + i * cell + cell * 0.14,
            y = v >= 0 ? baseline - h : baseline
          return (
            <g
              key={i}
              className="mx-bar"
              role={onInspect ? 'button' : undefined}
              tabIndex={onInspect ? 0 : undefined}
              aria-label={onInspect ? tr(`Inspect array index ${offset + i}, value ${f(v)}`) : undefined}
              onClick={() => onInspect?.(offset + i)}
              onKeyDown={(e) => {
                if (onInspect && (e.key === 'Enter' || e.key === ' ')) {
                  e.preventDefault()
                  onInspect(offset + i)
                }
              }}
            >
              <rect x={x - 3} y="0" width={cell * 0.72 + 6} height="103" fill="transparent" />
              <rect
                x={x}
                y={y}
                width={cell * 0.72}
                height={Math.max(v === 0 ? 1 : 2, h)}
                fill={`url(#${gradientId}-${v >= 0 ? 'positive' : 'negative'})`}
                stroke={v >= 0 ? '#6ba8ff' : '#ff96b3'}
                strokeWidth=".7"
              />
              <text className={v < 0 ? 'negative' : ''} x={x + cell * 0.36} y={v >= 0 ? y - 5 : y + h > 78 ? y + h - 4 : y + h + 12} textAnchor="middle">
                {f(v)}
              </text>
              {!compact && (
                <text className="mx-index" x={x + cell * 0.36} y="104" textAnchor="middle">
                  {i + offset}
                </text>
              )}
            </g>
          )
        })}
      </svg>
    </div>
  )
}
function RecursionTree({ root, selected, onSelect }: { root: MaximumNode; selected: string; onSelect: (node: MaximumNode) => void }) {
  const items: { node: MaximumNode; x: number; y: number; parent?: { x: number; y: number } }[] = []
  function add(node: MaximumNode, x: number, y: number, span: number, depth: number, parent?: { x: number; y: number }) {
    items.push({ node, x, y, parent })
    if (depth < 2) {
      if (node.left) add(node.left, x - span, y + 67, span / 2, depth + 1, { x, y })
      if (node.right) add(node.right, x + span, y + 67, span / 2, depth + 1, { x, y })
    }
  }
  add(root, 180, 29, 88, 0)
  return (
    <svg className="mx-tree" viewBox="0 0 360 192" role="img" aria-label={tr('Recursion tree with computed maximum sums')}>
      <defs>
        <marker id="mx-tree-arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <path d="M0 0L6 3L0 6" fill="none" stroke="#132859" strokeWidth="1.5" />
        </marker>
      </defs>
      {items
        .filter((i) => i.parent)
        .map((i) => (
          <path
            key={`e${i.node.id}`}
            d={`M${i.parent!.x + (i.x > i.parent!.x ? 14 : -14)} ${i.parent!.y + 23}L${i.x} ${i.y - 25}`}
            stroke="#112954"
            strokeWidth="1.5"
            fill="none"
            markerEnd="url(#mx-tree-arrow)"
          />
        ))}
      {items.map(({ node, x, y }) => (
        <g
          key={node.id}
          className={`mx-tree-node ${node.lo > root.mid ? 'right' : ''}`}
          role="button"
          tabIndex={0}
          aria-label={tr(`Inspect recursion range ${node.lo} to ${node.hi}`)}
          aria-pressed={selected === node.id}
          onClick={() => onSelect(node)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              onSelect(node)
            }
          }}
        >
          <rect x={x - (node === root ? 53 : 44)} y={y - 24} width={node === root ? 106 : 88} height="47" rx="14" />
          <text x={x} y={y - 7} textAnchor="middle">
            {node.lo} … {node.hi}
          </text>
          <text x={x} y={y + 13} textAnchor="middle">
            {tr('sum = ')}
            {f(node.best.sum)}
          </text>
        </g>
      ))}
    </svg>
  )
}
function ScanColumn({
  node,
  side,
  values,
  active,
  onPick,
}: {
  node: MaximumNode
  side: 'suffix' | 'prefix'
  values: number[]
  active?: number
  onPick: (index: number) => void
}) {
  const scans = node.scans.map((s, i) => ({ ...s, index: i })).filter((s) => s.side === side),
    best = scans.at(-1)?.best
  return (
    <div className={`mx-scan-column ${side}`}>
      <h3>{tr(side === 'suffix' ? `Best suffix ending at mid (index ${node.mid})` : `Best prefix starting at mid+1 (index ${node.mid + 1})`)}</h3>
      <div>
        {scans.map((s) => (
          <button
            key={s.index}
            className={active === s.index ? 'active' : ''}
            aria-label={tr(`Inspect ${side} scan ${s.index + 1}`)}
            onClick={() => onPick(s.index)}
          >
            <span>
              {values
                .slice(s.start, s.end + 1)
                .map(f)
                .join(', ')}
            </span>
            <span>→</span>
            <b>{f(s.sum)}</b>
          </button>
        ))}
      </div>
      {best && (
        <footer>
          <b>
            {tr(side === 'suffix' ? 'Best left suffix sum = ' : 'Best right prefix sum = ')}
            {f(best.sum)}
          </b>
          <span>
            {tr('from index ')}
            {best.start} {tr('to ')}
            {best.end}
          </span>
        </footer>
      )}
    </div>
  )
}
export function MaximumSubarrayMockupLesson(props: MockupPageProps) {
  useLocaleRender()
  const [tab, setTab] = useState<MockupTab>('Learn'),
    [run, setRun] = useState(() => maximumSubarrayTrace(maximumExample)),
    [draft, setDraft] = useState(`[ ${maximumExample.join(', ')} ]`)
  const [cursor, setCursor] = useState(-1),
    [selected, setSelected] = useState('0:7'),
    [playing, setPlaying] = useState(false),
    [speed, setSpeed] = useState(700),
    [error, setError] = useState(''),
    [notice, setNotice] = useState('')
  const [candidate, setCandidate] = useState<'best' | 'left' | 'right' | 'crossing'>('best'),
    [scan, setScan] = useState<number>(),
    [prediction, setPrediction] = useState(''),
    [feedback, setFeedback] = useState('')
  const node = run.nodes.find((n) => n.id === selected) ?? run.root,
    currentFrame = cursor >= 0 ? run.frames[cursor] : undefined,
    frame = currentFrame?.nodeId === node.id ? currentFrame : undefined
  const chosen = candidate === 'left' ? node.left?.best : candidate === 'right' ? node.right?.best : candidate === 'crossing' ? node.crossing : node.best
  useEffect(() => {
    if (!playing) return
    const timer = window.setTimeout(() => {
      const next = cursor + 1
      if (next >= run.frames.length) {
        setPlaying(false)
        return
      }
      const frame = run.frames[next]
      setCursor(next)
      setSelected(frame.nodeId)
      setScan(frame.scan)
      setCandidate('best')
      if (next === run.frames.length - 1) setPlaying(false)
    }, speed)
    return () => window.clearTimeout(timer)
  }, [playing, cursor, run.frames, speed])
  function open(next: MockupTab) {
    setTab(next)
    setPlaying(false)
    setNotice('')
  }
  function apply(values?: number[]) {
    try {
      const next = maximumSubarrayTrace(values ?? parseMaximumValues(draft))
      setRun(next)
      setDraft(`[ ${next.values.join(', ')} ]`)
      setCursor(-1)
      setSelected(next.root.id)
      setPlaying(false)
      setCandidate('best')
      setScan(undefined)
      setError('')
      setFeedback('')
      setNotice('')
      return next
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Invalid input.')
      return undefined
    }
  }
  function pick(n: MaximumNode) {
    setSelected(n.id)
    setScan(undefined)
    setPlaying(false)
    setCandidate('best')
    setNotice(`Range ${n.lo} … ${n.hi}: maximum sum ${f(n.best.sum)}, chosen indices ${range(n.best)}.`)
  }
  function move(index: number, trace: MaximumRun = run) {
    const next = Math.max(-1, Math.min(index, trace.frames.length - 1))
    setCursor(next)
    const fr = trace.frames[next]
    setSelected(fr?.nodeId ?? trace.root.id)
    setScan(fr?.scan)
    setCandidate('best')
    setPlaying(false)
    setNotice('')
  }
  function start() {
    let next: MaximumRun | undefined
    try {
      if (JSON.stringify(parseMaximumValues(draft)) !== JSON.stringify(run.values)) next = apply()
    } catch {
      apply()
      return
    }
    if (next) move(0, next)
    else {
      setError('')
      move(cursor + 1)
    }
    setTab('Visualization')
  }
  function togglePlayback() {
    if (playing) {
      setPlaying(false)
      return
    }
    try {
      const values = parseMaximumValues(draft)
      if (JSON.stringify(values) !== JSON.stringify(run.values)) {
        if (!apply(values)) return
      } else if (cursor === run.frames.length - 1) move(-1)
      setError('')
      setPlaying(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Invalid input.')
    }
  }
  const candidates = [
    {
      key: 'left' as const,
      title: 'Best Left Subarray',
      note: `Maximum subarray entirely in left half (indices ${node.lo} … ${node.mid}).`,
      result: node.left?.best,
      lo: node.lo,
      hi: node.mid,
    },
    {
      key: 'right' as const,
      title: 'Best Right Subarray',
      note: `Maximum subarray entirely in right half (indices ${node.mid + 1} … ${node.hi}).`,
      result: node.right?.best,
      lo: node.mid + 1,
      hi: node.hi,
    },
    {
      key: 'crossing' as const,
      title: 'Best Crossing Subarray',
      note: 'Maximum subarray crossing the midpoint (best left suffix + best right prefix).',
      result: node.crossing,
      lo: node.crossing?.start ?? node.lo,
      hi: node.crossing?.end ?? node.hi,
    },
  ]
  const frameMessage = !frame
    ? `Explore the candidate cases for indices ${node.lo} … ${node.hi}.`
    : frame.phase === 'base'
      ? 'A single element is the nonempty base-case answer.'
      : frame.phase === 'split'
        ? `Split indices ${node.lo} … ${node.hi} at midpoint ${node.mid}.`
        : frame.phase === 'combine'
          ? `Choose the greatest of left, right and crossing sums: ${f(node.best.sum)}.`
          : `Extend the ${frame.phase} scan and keep the largest sum seen so far.`
  function exportRun() {
    const url = URL.createObjectURL(new Blob([JSON.stringify(run, null, 2)], { type: 'application/json' }))
    const link = document.createElement('a')
    link.href = url
    link.download = 'maximum-subarray-trace.json'
    link.click()
    URL.revokeObjectURL(url)
  }
  return (
    <div className={`mom-page maximum-page target-visual ${run.values.length > 8 ? 'mx-long' : ''}`} data-target="14">
      <MockupLessonChrome
        {...props}
        title={tr('Maximum Subarray')}
        description={tr('Find the contiguous subarray with the maximum sum using divide and conquer.')}
        concepts={5}
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
              <Lightbulb />
              {tr('5 key concepts')}
            </span>
          </>
        }
        decoration={<HeroArt />}
        onStart={() => open('Visualization')}
      />
      <MockupTabs active={tab} onChange={open} tabs={['Learn', 'Visualization', 'Code', 'Practice', 'Experiments']} />
      {error && (
        <p className="mx-error" role="alert">
          {tr(error)}
        </p>
      )}
      {(tab === 'Learn' || tab === 'Visualization') && (
        <>
          {tab === 'Visualization' && (
            <Panel
              className="mx-lab"
              title={tr('Step-by-step maximum subarray')}
              description="Follow the recursive calls, midpoint scans and three-way comparisons."
              icon={<Play />}
            >
              <label className="mx-dataset-label">
                {tr('Editable array')}
                <textarea aria-label={tr('Maximum subarray dataset')} rows={2} value={draft} onChange={(e) => setDraft(e.target.value)} />
              </label>
              <div className="mx-toolbar">
                <button onClick={() => apply()}>{tr('Apply array')}</button>
                <button onClick={() => move(cursor - 1)} disabled={cursor < 0}>
                  {tr('Step back')}
                </button>
                <button onClick={start} disabled={cursor === run.frames.length - 1}>
                  {tr('Step forward')}
                </button>
                <button onClick={togglePlayback}>
                  {playing ? <Pause size={15} /> : <Play size={15} />} {tr(playing ? 'Pause' : 'Auto Run')}
                </button>
                <label>
                  {tr('Speed')}
                  <select aria-label={tr('Maximum subarray playback speed')} value={speed} onChange={(e) => setSpeed(Number(e.target.value))}>
                    <option value={700}>{tr('Normal')}</option>
                    <option value={100}>{tr('Fast')}</option>
                    <option value={1400}>{tr('Slow')}</option>
                  </select>
                </label>
                <button onClick={() => move(-1)}>{tr('Reset steps')}</button>
              </div>
              <p className="mx-frame-message" role="status">
                {tr('Step ')}
                {cursor + 1}/{run.frames.length} · {tr(frameMessage)}
              </p>
              <details className="mx-all-calls">
                <summary>{tr('Inspect every recursive call')}</summary>
                <div>
                  {[...run.nodes]
                    .sort((a, b) => a.lo - b.lo || b.hi - a.hi)
                    .map((n) => (
                      <button key={n.id} onClick={() => pick(n)}>
                        {n.lo} … {n.hi} · {tr('sum ')}
                        {f(n.best.sum)}
                      </button>
                    ))}
                </div>
              </details>
            </Panel>
          )}
          <div className="mx-top-row">
            <section className="mom-panel mx-overview">
              <div className="mx-overview-main">
                <header>
                  <span className="mx-icon">
                    <Target />
                  </span>
                  <div>
                    <h2>{tr('Problem Overview')}</h2>
                    <p>
                      {tr(
                        'Given an array of integers (positive, negative, or zero), find the contiguous subarray with the maximum possible sum using the divide and conquer approach.',
                      )}
                    </p>
                  </div>
                </header>
                <div className="mx-array-heading">
                  <span className="mx-icon">
                    <Activity />
                  </span>
                  <h3>{tr('Array Visualization')}</h3>
                </div>
                <div className="mx-overview-plot">
                  <Bars
                    values={run.values}
                    mid={run.root.mid}
                    onInspect={(i) => setNotice(`Index ${i}: value ${f(run.values[i])}. A subarray must use consecutive indices.`)}
                  />
                  <div className="mx-halves">
                    <button onClick={() => run.root.left && pick(run.root.left)}>{tr(`Left half (${run.root.lo} … ${run.root.mid})`)}</button>
                    <button disabled={!run.root.right} onClick={() => run.root.right && pick(run.root.right)}>
                      {tr(`Right half (${run.root.mid + 1} … ${run.root.hi})`)}
                    </button>
                  </div>
                </div>
              </div>
              <div className="mx-current">
                <header>
                  <span className="mx-icon">
                    <Code2 />
                  </span>
                  <h2>{tr('Current Example')}</h2>
                </header>
                <h3>
                  {tr('Array (n = ')}
                  {run.values.length})
                </h3>
                <input aria-label={tr('Current example array')} value={draft} onChange={(e) => setDraft(e.target.value)} />
                <div className="mx-example-actions">
                  <button className="mx-primary" onClick={start}>
                    <Play size={16} />
                    {tr('Run Step by Step')}
                  </button>
                  <button onClick={() => apply(maximumExample)}>
                    <RotateCcw size={16} />
                    {tr('Reset')}
                  </button>
                </div>
              </div>
            </section>
            <aside className="mx-takeaways">
              <h2>
                <Lightbulb />
                {tr('Key Takeaways')}
              </h2>
              {[
                'Divide the array into two halves and solve recursively.',
                'Consider three cases: best left, best right, and crossing subarray.',
                'The crossing subarray includes the best suffix from left and best prefix from right.',
                'Time complexity is O(n log n) with O(log n) extra space.',
                'Works with positive, negative and mixed values.',
              ].map((text) => (
                <p key={text}>
                  <CheckCircle2 />
                  <span>{tr(text)}</span>
                </p>
              ))}
            </aside>
          </div>
          {notice && (
            <p className="mx-notice" role="status">
              {tr(notice)}
              <button onClick={() => setNotice('')}>{tr('Close')}</button>
            </p>
          )}
          <div className="mx-middle-row">
            <Panel
              className="mx-comparison"
              title={tr('Compare the Three Cases at Each Step')}
              description="For a given segment, the maximum subarray is the best of left half, right half, and crossing subarray."
              icon={<BarChart3 />}
            >
              {node.left ? (
                <div className="mx-candidates">
                  {candidates.map((c) => (
                    <button
                      key={c.key}
                      className={`mx-candidate ${c.key}`}
                      aria-label={tr(`Inspect ${c.title}`)}
                      aria-pressed={candidate === c.key}
                      onClick={() => {
                        setCandidate(c.key)
                        setPlaying(false)
                      }}
                    >
                      <h3>
                        <CheckCircle2 />
                        {tr(c.title)}
                      </h3>
                      <p>{tr(c.note)}</p>
                      <Bars values={run.values.slice(c.lo, c.hi + 1)} offset={c.lo} mini compact />
                      <footer>
                        <b>
                          {tr('Best sum: ')}
                          {f(c.result!.sum)}
                        </b>
                        <span>
                          {tr('Range: ')}
                          {range(c.result!)} → [
                          {run.values
                            .slice(c.result!.start, c.result!.end + 1)
                            .map(f)
                            .join(', ')}
                          ]
                        </span>
                      </footer>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="mx-base-case">
                  <b>{tr('Base case: one element')}</b>
                  <p>{tr('No split or crossing scan is needed. The only nonempty subarray is the answer.')}</p>
                  <Bars values={[run.values[node.lo]]} offset={node.lo} mini />
                </div>
              )}
            </Panel>
            <Panel className="mx-recursion" title={tr('Recursion Tree (Divide and Conquer)')} icon={<Network />}>
              <div className="mx-tree-layout">
                <RecursionTree root={run.root} selected={node.id} onSelect={pick} />
                <ol>
                  {['Divide into two halves', 'Solve recursively', 'Find best crossing subarray', 'Combine the three results'].map((s) => (
                    <li key={s}>
                      <span>{tr(s)}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </Panel>
          </div>
          <div className="mx-bottom-row">
            <Panel
              className="mx-worked"
              title={tr('Worked Example')}
              description={`For the array [${run.values.map(f).join(', ')}], the selected subarray is shown below.`}
              icon={<ClipboardList />}
            >
              <Bars values={run.values} highlight={chosen ?? node.best} onInspect={(i) => setNotice(`Index ${i}: value ${f(run.values[i])}.`)} mini />
              <div className="mx-answer">
                <b>
                  {tr(candidate === 'best' ? 'Maximum subarray sum: ' : 'Selected candidate sum: ')}
                  {f((chosen ?? node.best).sum)}
                </b>
                <span>
                  {tr('Range: ')}
                  {range(chosen ?? node.best)}{' '}
                  <span>
                    {tr('Subarray: ')}[
                    {run.values
                      .slice((chosen ?? node.best).start, (chosen ?? node.best).end + 1)
                      .map(f)
                      .join(', ')}
                    ]
                  </span>
                </span>
              </div>
            </Panel>
            <Panel className="mx-complexity" title={tr('Complexity & Correctness')} icon={<BarChart3 />}>
              <div className="mx-complexity-body">
                <div>
                  <Timer />
                  <b>{tr('Time Complexity')}</b>
                  <p>
                    <strong>{tr('O(n log n)')}</strong>
                    <span>{tr('Two recursive calls and a linear crossing subarray step: T(n) = 2T(n/2) + O(n).')}</span>
                  </p>
                </div>
                <div>
                  <Database />
                  <b>{tr('Space Complexity')}</b>
                  <p>
                    <strong>{tr('O(log n)')}</strong>
                    <span>{tr('Recursion stack.')}</span>
                  </p>
                </div>
                <div>
                  <ShieldCheck />
                  <b>{tr('Correctness')}</b>
                  <p>
                    {tr(
                      'The optimal subarray is either in the left half, right half, or crosses the midpoint. We compute all three and take the best, covering all cases.',
                    )}
                  </p>
                </div>
              </div>
            </Panel>
            <Panel
              className="mx-crossing"
              title={tr('Midpoint Crossing Computation')}
              description="Find the best suffix on the left and best prefix on the right."
              icon={<Activity />}
            >
              {node.crossing ? (
                <div className="mx-scans">
                  <ScanColumn
                    node={node}
                    side="suffix"
                    values={run.values}
                    active={scan}
                    onPick={(i) => {
                      setPlaying(false)
                      setScan(i)
                      setCandidate('crossing')
                      setNotice(`Suffix scan sum ${f(node.scans[i].sum)}; best so far ${f(node.scans[i].best.sum)}.`)
                    }}
                  />
                  <b>+</b>
                  <ScanColumn
                    node={node}
                    side="prefix"
                    values={run.values}
                    active={scan}
                    onPick={(i) => {
                      setPlaying(false)
                      setScan(i)
                      setCandidate('crossing')
                      setNotice(`Prefix scan sum ${f(node.scans[i].sum)}; best so far ${f(node.scans[i].best.sum)}.`)
                    }}
                  />
                </div>
              ) : (
                <p>{tr('A singleton has no midpoint crossing. Return its value directly.')}</p>
              )}
            </Panel>
          </div>
          <details className="mx-theory">
            <summary>{tr('Why the crossing method works, and how ties are resolved')}</summary>
            <p>
              {tr(
                'A contiguous subarray crossing the split must end its left portion at mid and start its right portion at mid + 1. Scan leftward to find the greatest suffix sum, and rightward to find the greatest prefix sum. Their sum is the best crossing candidate. Recursion computes the best entirely-left and entirely-right candidates. Every nonempty subarray belongs to exactly one of these three cases.',
              )}
            </p>
            <p>
              {tr(
                'For the reference input, left suffix sums are −4, −1, −2, 0 and right prefix sums are 5, 4, 6, 5. The crossing candidate has sum 6 over [0, 6]. The entirely-right candidate also has sum 6 over [4, 6]; this lab resolves equal sums by choosing the shorter subarray, then the earlier starting index. All-negative arrays return their greatest single element, never an empty subarray.',
              )}
            </p>
            <p>
              {tr(
                'The O(log n) auxiliary-space bound applies to the recursive algorithm when temporary scans are released. This learning model additionally retains every node, scan and playback frame, using O(n log n) trace storage. Inputs contain 1–32 finite numbers from −1000000 to 1000000; floating-point sums may have rounding error.',
              )}
            </p>
          </details>
        </>
      )}
      {tab === 'Code' && (
        <Panel title={tr('Maximum subarray implementation')} description="This is the TypeScript model used by the interactive diagrams." icon={<Code2 />}>
          <pre className="mx-source">
            <code>{source}</code>
          </pre>
        </Panel>
      )}
      {tab === 'Practice' && (
        <Panel
          className="mx-extra"
          title={tr('Predict the best crossing sum')}
          description="Compute the largest suffix of the left half plus the largest prefix of the right half."
          icon={<Target />}
        >
          <Bars values={run.values} mid={run.root.mid} />
          {run.root.crossing ? (
            <>
              <label>
                {tr('Your prediction')}
                <input
                  type="number"
                  step="any"
                  aria-label={tr('Predicted crossing sum')}
                  value={prediction}
                  onChange={(e) => {
                    setPrediction(e.target.value)
                    setFeedback('')
                  }}
                />
              </label>
              <button
                onClick={() =>
                  setFeedback(
                    prediction.trim() !== '' && Math.abs(Number(prediction) - run.root.crossing!.sum) < 1e-8
                      ? `Correct! Crossing sum = ${f(run.root.crossing!.sum)}. Its range is ${range(run.root.crossing!)}.`
                      : 'Not yet. The crossing candidate must include both mid and mid + 1. Scan a left suffix and a right prefix separately.',
                  )
                }
              >
                {tr('Check prediction')}
              </button>
              {feedback && <p role="status">{tr(feedback)}</p>}
            </>
          ) : (
            <p>{tr('Load an array with at least two elements to practice a crossing computation.')}</p>
          )}
        </Panel>
      )}
      {tab === 'Experiments' && (
        <Panel
          className="mx-extra"
          title={tr('Explore input patterns')}
          description="Try negative-only, all-positive and tied optima, then inspect the computed recursion trace."
          icon={<BarChart3 />}
        >
          <div className="mx-toolbar">
            {[
              { label: 'All negative', values: [-8, -3, -7, -2, -6] },
              { label: 'All positive', values: [1, 2, 3, 4, 5, 6] },
              { label: 'Tied optima', values: [2, -2, 2, -2] },
              { label: 'Single element', values: [-5] },
            ].map((p) => (
              <button
                key={p.label}
                onClick={() => {
                  apply(p.values)
                  open('Learn')
                }}
              >
                {tr(p.label)}
              </button>
            ))}
            <button
              onClick={() => {
                localStorage.setItem('maximum-subarray-experiment', JSON.stringify(run.values))
                setNotice('Experiment saved in this browser.')
              }}
            >
              {tr('Save experiment')}
            </button>
            <button
              onClick={() => {
                try {
                  const saved = localStorage.getItem('maximum-subarray-experiment')
                  if (!saved) throw new Error()
                  const values = parseMaximumValues(saved)
                  apply(values)
                  setNotice('Saved experiment loaded.')
                } catch {
                  setError('No valid saved experiment is available.')
                }
              }}
            >
              {tr('Load experiment')}
            </button>
            <button onClick={exportRun}>{tr('Export JSON')}</button>
          </div>
          <p>
            {tr('Maximum sum: ')}
            {f(run.root.best.sum)} · {tr('Range: ')}
            {range(run.root.best)}
          </p>
          {notice && <p role="status">{tr(notice)}</p>}
        </Panel>
      )}
    </div>
  )
}
