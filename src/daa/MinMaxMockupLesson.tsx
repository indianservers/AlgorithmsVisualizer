// @localized-render
import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  ClipboardList,
  Code2,
  Layers3,
  Lightbulb,
  Network,
  Pause,
  Play,
  RotateCcw,
  Settings,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import { tx, useLocaleRender } from '../i18n/render'
import { MockupLessonChrome, MockupTabs, type MockupPageProps, type MockupTab } from './MockupLessonChrome'
import { minMaxTrace, minMaxExample, parseMinMaxValues, type MinMaxNode, type MinMaxRun } from './minMaxModel'
import source from './minMaxModel.ts?raw'
import './min-max-mockup.css'
const tr = (s: string) => tx(s, 'studios')
const f = (n: number) => Number(n.toPrecision(8)).toString()
const short = (n: number) => (Math.abs(n) >= 10000 ? n.toExponential(1) : f(n))
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
    <section className={`mom-panel mm-panel ${className}`}>
      <header>
        <span className="mm-icon">{icon}</span>
        <div>
          <h2>{tr(title)}</h2>
          {description && <p>{tr(description)}</p>}
        </div>
      </header>
      {children}
    </section>
  )
}
function MountainIcon() {
  return (
    <svg viewBox="0 0 60 55" aria-hidden="true">
      <defs>
        <linearGradient id="mm-mountain" x2="0" y2="1">
          <stop stopColor="#1561ff" />
          <stop offset="1" stopColor="#00b5ff" />
        </linearGradient>
      </defs>
      <path d="M5 45L20 15Q23 10 26 15L40 45ZM29 25L38 8Q41 3 44 9L59 45H44Z" fill="url(#mm-mountain)" stroke="#7cdeff" strokeWidth="2" />
    </svg>
  )
}
function HeroArt() {
  return (
    <svg className="mm-hero-art" viewBox="0 0 290 120" aria-hidden="true">
      <defs>
        <linearGradient id="mm-art-purple" x2="0" y2="1">
          <stop stopColor="#b8a4ff" />
          <stop offset="1" stopColor="#6431ed" />
        </linearGradient>
      </defs>
      {[0, 1, 2, 3].map((i) => (
        <g key={i} transform={`translate(0,${-i * 20})`}>
          <path d="M85 81L121 61L157 81L121 102Z" fill={i === 3 ? '#c0e7ff' : '#b39dff'} stroke="#cfedff" />
          <path d="M85 81L121 102V116L85 96Z" fill={i === 3 ? '#8bc8ff' : 'url(#mm-art-purple)'} />
          <path d="M121 102L157 81V96L121 116Z" fill={i === 3 ? '#7ab5ff' : '#7135ee'} />
        </g>
      ))}
      {[
        [31, 95],
        [38, 74],
      ].map(([x, y]) => (
        <g key={y}>
          <path d={`M${x - 17} ${y}l20 -11l20 11l-20 11Z`} fill="#b3efff" />
          <path d={`M${x - 17} ${y}l20 11v14l-20 -11Z`} fill="#82d9ff" />
          <path d={`M${x + 3} ${y + 11}l20 -11v14l-20 11Z`} fill="#60c9ff" />
        </g>
      ))}
      <path d="M179 116L195 102L210 111L225 76L245 97L254 60" stroke="#b2a6ff" strokeWidth="2" fill="none" />
      {[
        [179, 116],
        [195, 102],
        [210, 111],
        [225, 76],
        [245, 97],
        [254, 60],
      ].map(([x, y]) => (
        <circle key={x} cx={x} cy={y} r="4.7" fill="#8e83ff" />
      ))}
    </svg>
  )
}
function ArrayCells({ values, offset = 0, purple = false, split }: { values: number[]; offset?: number; purple?: boolean; split?: number }) {
  return (
    <div className={`mm-array-cells ${purple ? 'purple' : ''}`} dir="ltr">
      {values.map((v, i) => (
        <div key={i} className={split === offset + i ? 'split' : ''}>
          <span>{i + offset}</span>
          <strong>{f(v)}</strong>
        </div>
      ))}
    </div>
  )
}
function FlowDiagram({ run, selected, onSelect }: { run: MinMaxRun; selected: string; onSelect: (node: MinMaxNode) => void }) {
  const key = useId(),
    root = run.root
  function group(n: MinMaxNode, x: number, y: number, width: number, tone: string, result = false) {
    const count = n.hi - n.lo + 1,
      cw = Math.min(result ? 46 : 57, (width - 26) / count),
      start = x + (width - cw * count) / 2
    return (
      <g
        key={n.id}
        className={`mm-flow-group ${tone} ${selected === n.id && n !== root ? 'selected' : ''}`}
        role="button"
        tabIndex={0}
        aria-label={tr(`Inspect split range ${n.lo} to ${n.hi}`)}
        onClick={() => onSelect(n)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onSelect(n)
          }
        }}
      >
        <rect className="mm-flow-surface" x={x} y={y} width={width} height={result ? 88 : 100} rx="10" />
        {run.values.slice(n.lo, n.hi + 1).map((v, i) => (
          <g key={i}>
            <text className="mm-flow-index" x={start + (i + 0.5) * cw} y={y + 19} textAnchor="middle">
              {n.lo + i}
            </text>
            <rect className="mm-flow-cell" x={start + i * cw + 1} y={y + 27} width={cw - 2} height={result ? 31 : 39} rx="4" />
            <text
              className="mm-flow-value"
              style={{ fontSize: count > 8 ? 10 : undefined }}
              x={start + (i + 0.5) * cw}
              y={y + (result ? 48 : 52)}
              textAnchor="middle"
            >
              {short(v)}
            </text>
          </g>
        ))}
        <text className="mm-flow-result" x={x + width / 2} y={y + (result ? 75 : 85)} textAnchor="middle">
          {result ? `(min=${f(n.min)}, max=${f(n.max)})` : tr(`${tone === 'purple' ? 'Right' : 'Left'} half: [${n.lo}..${n.hi}]`)}
        </text>
      </g>
    )
  }
  return (
    <div className="mm-flow-scroll">
      <svg className="mm-flow" viewBox="0 0 610 320" role="img" aria-label={tr('Array split into halves and pair base cases')}>
        <defs>
          <marker id={`${key}-blue`} markerWidth="6" markerHeight="6" refX="4" refY="3" orient="auto">
            <path d="M0 0L6 3L0 6Z" fill="#0879ff" />
          </marker>
          <marker id={`${key}-purple`} markerWidth="6" markerHeight="6" refX="4" refY="3" orient="auto">
            <path d="M0 0L6 3L0 6Z" fill="#8b47ff" />
          </marker>
          <linearGradient id={`${key}-cell`} x2="0" y2="1">
            <stop stopColor="#d5eaff" />
            <stop offset="1" stopColor="#b3d7ff" />
          </linearGradient>
        </defs>
        <g
          className="mm-flow-root"
          role="button"
          tabIndex={0}
          aria-label={tr('Inspect full input array')}
          onClick={() => onSelect(root)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              onSelect(root)
            }
          }}
        >
          <rect x="92" y="0" width="476" height="65" fill="transparent" pointerEvents="all" />
          {run.values.map((v, i) => {
            const cw = 476 / run.values.length,
              x = 92 + i * cw
            return (
              <g key={i}>
                <text className="mm-flow-index" x={x + cw / 2} y="16" textAnchor="middle">
                  {i}
                </text>
                <rect x={x + 1} y="24" width={cw - 2} height="40" rx="4" fill={`url(#${key}-cell)`} />
                <text className="mm-flow-value" style={{ fontSize: run.values.length > 10 ? 10 : undefined }} x={x + cw / 2} y="50" textAnchor="middle">
                  {short(v)}
                </text>
              </g>
            )
          })}
        </g>
        {root.left && root.right ? (
          <>
            <path d="M330 71V79Q330 85 318 85H144Q137 85 137 95" className="mm-flow-link" markerEnd={`url(#${key}-blue)`} />
            <path d="M330 71V79Q330 85 342 85H472Q479 85 479 95" className="mm-flow-link purple" markerEnd={`url(#${key}-purple)`} />
            {group(root.left, 12, 102, 284, 'blue')}
            {group(root.right, 334, 102, 268, 'purple')}
            {root.left.left && root.left.right && (
              <>
                <path
                  d="M153 201Q153 208 143 208H80Q77 208 77 220M159 201Q159 208 171 208H228Q231 208 231 220"
                  className="mm-flow-link"
                  markerEnd={`url(#${key}-blue)`}
                />
                {group(root.left.left, 12, 226, 130, 'blue', true)}
                {group(root.left.right, 166, 226, 130, 'blue', true)}
              </>
            )}
            {root.right.left && root.right.right && (
              <>
                <path
                  d="M466 201Q466 208 454 208H400Q397 208 397 220M472 201Q472 208 484 208H540Q543 208 543 220"
                  className="mm-flow-link purple"
                  markerEnd={`url(#${key}-purple)`}
                />
                {group(root.right.left, 334, 226, 140, 'purple', true)}
                {group(root.right.right, 488, 226, 114, 'purple', true)}
              </>
            )}
          </>
        ) : (
          <g className="mm-flow-base">
            <text x="305" y="140" textAnchor="middle">
              {tr(root.lo === root.hi ? 'One value: return it as both minimum and maximum.' : 'Two values: one comparison determines both extrema.')}
            </text>
            <text x="305" y="180" textAnchor="middle">
              {tr('min = ')}
              {f(root.min)} · {tr('max = ')}
              {f(root.max)}
            </text>
          </g>
        )}
      </svg>
    </div>
  )
}
function TreeDiagram({ root, selected, onSelect, full = false }: { root: MinMaxNode; selected: string; onSelect: (node: MinMaxNode) => void; full?: boolean }) {
  const key = useId(),
    items: { node: MinMaxNode; x: number; y: number; depth: number; parent?: { x: number; y: number } }[] = []
  const treeDepth = (n: MinMaxNode): number => (n.left && n.right ? 1 + Math.max(treeDepth(n.left), treeDepth(n.right)) : 0)
  const width = full ? Math.max(400, 2 ** treeDepth(root) * 95) : 400
  function add(node: MinMaxNode, x: number, y: number, span: number, depth: number, parent?: { x: number; y: number }) {
    items.push({ node, x, y, depth, parent })
    if (full || depth < 2) {
      if (node.left) add(node.left, x - span, y + 57, span / 2, depth + 1, { x, y })
      if (node.right) add(node.right, x + span, y + 57, span / 2, depth + 1, { x, y })
    }
  }
  add(root, width / 2, 26, width / 4, 0)
  const height = Math.max(174, ...items.map((i) => i.y + 25))
  return (
    <div className="mm-tree-scroll">
      <svg
        className="mm-tree"
        viewBox={`0 0 ${width} ${height}`}
        style={{ minWidth: full ? width : undefined, height: full ? height : 174 }}
        role="img"
        aria-label={tr('Recursive min/max results by range')}
      >
        <defs>
          <marker id={`${key}-arrow`} markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto">
            <path d="M0 0L5 2.5L0 5Z" fill="#3974d6" />
          </marker>
        </defs>
        {items
          .filter((i) => i.parent)
          .map((i) => (
            <path
              key={`link${i.node.id}`}
              d={`M${i.parent!.x} ${i.parent!.y + 20}Q${i.parent!.x} ${i.parent!.y + 26} ${i.x} ${i.parent!.y + 26}Q${i.x} ${i.parent!.y + 26} ${i.x} ${i.y - 23}`}
              fill="none"
              stroke={i.node.lo > root.mid ? '#9044ff' : '#0576ff'}
              strokeWidth="1.2"
              markerEnd={`url(#${key}-arrow)`}
            />
          ))}
        {items.map(({ node, x, y, depth }) => (
          <g
            key={node.id}
            role="button"
            tabIndex={0}
            className={`mm-tree-node ${node.lo > root.mid ? 'purple' : ''} ${selected === node.id ? 'selected' : ''}`}
            aria-label={tr(`Inspect tree range ${node.lo} to ${node.hi}`)}
            onClick={() => onSelect(node)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onSelect(node)
              }
            }}
          >
            <rect x={x - (depth === 0 ? 72 : depth === 1 ? 60 : 42)} y={y - 21} width={depth === 0 ? 144 : depth === 1 ? 120 : 84} height="42" rx="5" />
            <text x={x} y={y - 5} textAnchor="middle">
              [{node.lo}..{node.hi}]
            </text>
            <text x={x} y={y + 13} textAnchor="middle">
              {depth < 2 ? `min=${f(node.min)}, max=${f(node.max)}` : `${f(node.min)}, ${f(node.max)}`}
            </text>
          </g>
        ))}
      </svg>
    </div>
  )
}
function Combine({ node }: { node: MinMaxNode }) {
  const paired = node.hi === node.lo + 1
  return (
    <div className="mm-combine">
      <header>
        <span className="mm-icon">
          <Layers3 />
        </span>
        <h2>{tr(node.left ? 'Combine Step' : paired ? 'Pair Base Case' : 'Singleton Base Case')}</h2>
        <span className="mm-current-badge">
          <CheckCircle2 />
          {tr('Current step')}
        </span>
      </header>
      <p>
        {tr(
          node.left
            ? 'Combine results from left and right halves.'
            : paired
              ? 'Compare the two values once; obtain both extrema.'
              : 'Return the same value as minimum and maximum.',
        )}
      </p>
      {node.left && node.right ? (
        <>
          <div className="mm-half-results">
            <div>
              <b>{tr('Left half result')}</b>
              <span>
                {tr('min = ')}
                <strong>{f(node.left.min)}</strong>
              </span>
              <span>
                {tr('max = ')}
                <strong>{f(node.left.max)}</strong>
              </span>
            </div>
            <div>
              <b>{tr('Right half result')}</b>
              <span>
                {tr('min = ')}
                <strong>{f(node.right.min)}</strong>
              </span>
              <span>
                {tr('max = ')}
                <strong>{f(node.right.max)}</strong>
              </span>
            </div>
          </div>
          <svg className="mm-combine-arrow" viewBox="0 0 200 37" aria-hidden="true">
            <path d="M24 2V10Q24 15 30 15H100M176 2V10Q176 15 170 15H100V30M96 25L100 30L104 25" fill="none" stroke="#067cff" strokeWidth="1.5" />
          </svg>
        </>
      ) : (
        <div className="mm-base-explanation">
          <strong>{tr(paired ? '1 value comparison' : '0 value comparisons')}</strong>
          <p>
            {tr(
              paired
                ? 'One comparison orders the pair. Comparing again for the maximum would duplicate work.'
                : 'A single element needs no comparison against another element.',
            )}
          </p>
        </div>
      )}
      <div className="mm-global-result">
        <h3>{tr('Global result (combine)')}</h3>
        <p>
          {tr('min = ')}
          {node.left ? `min(${f(node.left.min)}, ${f(node.right!.min)}) = ` : ''}
          <b>{f(node.min)}</b>
        </p>
        <p>
          {tr('max = ')}
          {node.left ? `max(${f(node.left.max)}, ${f(node.right!.max)}) = ` : ''}
          <b>{f(node.max)}</b>
        </p>
      </div>
    </div>
  )
}
const exampleSteps = ['Initial Split', 'Solve Left', 'Solve Right', 'Combine', 'Result']
const samples = [
  { name: 'Reference array', values: minMaxExample },
  { name: 'Ascending', values: [1, 2, 3, 4, 5, 6, 7, 8] },
  { name: 'Descending', values: [8, 7, 6, 5, 4, 3, 2, 1] },
  { name: 'All negative', values: [-7, -2, -9, -1] },
  { name: 'All equal', values: [5, 5, 5, 5] },
  { name: 'Singleton', values: [42] },
]
export function MinMaxMockupLesson(props: MockupPageProps) {
  useLocaleRender()
  const [run, setRun] = useState(() => minMaxTrace(minMaxExample)),
    [tab, setTab] = useState<MockupTab>('Learn'),
    [selected, setSelected] = useState('0:7'),
    [step, setStep] = useState(0),
    [cursor, setCursor] = useState(-1),
    [treeTab, setTreeTab] = useState<'tree' | 'stack'>('tree'),
    [draft, setDraft] = useState(minMaxExample.join(', ')),
    [customMode, setCustomMode] = useState(false),
    [playing, setPlaying] = useState(false),
    [speed, setSpeed] = useState(700),
    [error, setError] = useState(''),
    [notice, setNotice] = useState(''),
    [prediction, setPrediction] = useState(''),
    [feedback, setFeedback] = useState('')
  const node = run.nodes.find((n) => n.id === selected) ?? run.root,
    frame = cursor >= 0 ? run.frames[cursor] : undefined,
    root = run.root
  const arrayEditor = useRef<HTMLTextAreaElement>(null)
  function focusArrayEditor() {
    arrayEditor.current?.focus()
    arrayEditor.current?.select()
    arrayEditor.current?.scrollIntoView({ block: 'center' })
  }
  useEffect(() => {
    if (customMode && (tab === 'Learn' || tab === 'Visualization')) focusArrayEditor()
  }, [customMode, tab])
  useEffect(() => {
    if (!playing) return
    const timer = window.setTimeout(() => {
      const next = cursor + 1
      if (next >= run.frames.length) {
        setPlaying(false)
        return
      }
      const fr = run.frames[next]
      setCursor(next)
      setSelected(fr.nodeId)
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
      const next = minMaxTrace(values ?? parseMinMaxValues(draft))
      setRun(next)
      setSelected(next.root.id)
      setDraft(next.values.join(', '))
      setStep(next.values.length <= 2 ? 4 : 0)
      setCursor(-1)
      setPlaying(false)
      setError('')
      setNotice('')
      setFeedback('')
      return next
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Invalid array.')
      return undefined
    }
  }
  function pick(next: MinMaxNode) {
    setSelected(next.id)
    setPlaying(false)
    setNotice(`Range [${next.lo}..${next.hi}]: min = ${f(next.min)}, max = ${f(next.max)}, ${next.comparisons} value comparisons in this subtree.`)
  }
  function move(next: number, trace: MinMaxRun = run) {
    const i = Math.max(-1, Math.min(next, trace.frames.length - 1))
    setCursor(i)
    setSelected(trace.frames[i]?.nodeId ?? trace.root.id)
    setPlaying(false)
    setNotice('')
  }
  function stepForward() {
    try {
      const values = parseMinMaxValues(draft)
      if (JSON.stringify(values) !== JSON.stringify(run.values)) {
        const next = apply(values)
        if (next) move(0, next)
      } else {
        setError('')
        move(cursor + 1)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Invalid array.')
    }
  }
  function auto() {
    if (playing) {
      setPlaying(false)
      return
    }
    try {
      const values = parseMinMaxValues(draft)
      if (JSON.stringify(values) !== JSON.stringify(run.values)) {
        if (!apply(values)) return
      } else if (cursor === run.frames.length - 1) move(-1)
      setError('')
      setPlaying(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Invalid array.')
    }
  }
  const powerOfTwo = (run.values.length & (run.values.length - 1)) === 0,
    comparisonCount = tab === 'Visualization' ? (frame?.comparisons ?? 0) : run.comparisons
  const sampleIndex = samples.findIndex((s) => JSON.stringify(s.values) === JSON.stringify(run.values))
  const customArray = customMode || sampleIndex < 0
  const shown = step === 1 && root.left ? root.left : step === 2 && root.right ? root.right : root
  const workedTitle = !root.left
    ? root.lo === root.hi
      ? 'Base case: one element needs no comparison.'
      : 'Base case: one comparison orders the pair.'
    : step === 0
      ? 'Divide the array into two halves.'
      : step === 1
        ? 'Recursively find the left minimum and maximum.'
        : step === 2
          ? 'Recursively find the right minimum and maximum.'
          : step === 3
            ? 'Combine with two value comparisons.'
            : 'Return the global minimum and maximum.'
  const frameNode = run.nodes.find((n) => n.id === frame?.nodeId) ?? root
  const frameMessage = !frame
    ? 'Ready to divide the input array.'
    : frame.phase === 'split'
      ? `Split [${frameNode.lo}..${frameNode.hi}] at midpoint ${frameNode.mid}.`
      : frame.phase === 'singleton'
        ? 'Return the singleton without a value comparison.'
        : frame.phase === 'pair'
          ? `One comparison orders ${f(frame.operands![0])} and ${f(frame.operands![1])}.`
          : frame.phase === 'minimum'
            ? `Compare minima: min(${frame.operands!.map(f).join(', ')}) = ${f(frame.result!)}.`
            : frame.phase === 'maximum'
              ? `Compare maxima: max(${frame.operands!.map(f).join(', ')}) = ${f(frame.result!)}.`
              : `Return min = ${f(frameNode.min)}, max = ${f(frameNode.max)}.`
  function exportRun() {
    const url = URL.createObjectURL(new Blob([JSON.stringify(run, null, 2)], { type: 'application/json' }))
    const link = document.createElement('a')
    link.href = url
    link.download = 'divide-min-max-trace.json'
    link.click()
    URL.revokeObjectURL(url)
  }
  return (
    <div className={`mom-page minmax-page target-visual ${run.values.length > 8 ? 'mm-long' : ''}`} data-target="13">
      <MockupLessonChrome
        {...props}
        title={tr('Divide-and-Conquer Min/Max')}
        description={tr('Find minimum and maximum using divide and conquer with fewer comparisons.')}
        concepts={5}
        categoryBadge
        heroIcon={<MountainIcon />}
        decoration={<HeroArt />}
        onStart={() => open('Visualization')}
      />
      <MockupTabs
        active={tab}
        onChange={open}
        tabs={['Learn', 'Visualization', 'Code', 'Practice', 'Experiments']}
        iconOverrides={{ Code: <Settings size={18} />, Practice: <Code2 size={19} />, Experiments: <Sparkles size={19} /> }}
      />
      {error && (
        <p className="mm-error" role="alert">
          {tr(error)}
        </p>
      )}
      {(tab === 'Learn' || tab === 'Visualization') && (
        <>
          {(tab === 'Visualization' || customArray) && (
            <Panel
              className="mm-lab"
              title={tr('Interactive recursive min/max trace')}
              description="Edit the input and follow every value comparison and active call."
              icon={<Play />}
            >
              <label className="mm-input-label">
                {tr('Editable array')}
                <textarea ref={arrayEditor} rows={2} aria-label={tr('Min/max dataset')} value={draft} onChange={(e) => setDraft(e.target.value)} />
              </label>
              <div className="mm-toolbar">
                <button onClick={() => apply()}>{tr('Apply array')}</button>
                <button disabled={cursor < 0} onClick={() => move(cursor - 1)}>
                  {tr('Step back')}
                </button>
                <button disabled={cursor === run.frames.length - 1} onClick={stepForward}>
                  {tr('Step forward')}
                </button>
                <button onClick={auto}>
                  {playing ? <Pause size={15} /> : <Play size={15} />} {tr(playing ? 'Pause' : 'Auto Run')}
                </button>
                <label>
                  {tr('Speed')}
                  <select aria-label={tr('Min/max playback speed')} value={speed} onChange={(e) => setSpeed(Number(e.target.value))}>
                    <option value={700}>{tr('Normal')}</option>
                    <option value={100}>{tr('Fast')}</option>
                    <option value={1400}>{tr('Slow')}</option>
                  </select>
                </label>
                <button onClick={() => move(-1)}>{tr('Reset trace')}</button>
              </div>
              <p className="mm-frame-message" role="status">
                {tr('Step ')}
                {cursor + 1}/{run.frames.length} · {tr(frameMessage)}
              </p>
              <p className="mm-trace-caption">
                {tr('The diagrams preview computed results. The trace counter records only comparisons executed through the selected step.')}
              </p>
              <details>
                <summary>{tr('Full recursive tree')}</summary>
                <TreeDiagram root={root} selected={selected} onSelect={pick} full />
              </details>
            </Panel>
          )}
          <div className="mm-dashboard">
            <div className="mm-main-column">
              <section className="mom-panel mm-visualizer">
                <header>
                  <span className="mm-icon">
                    <Layers3 />
                  </span>
                  <div>
                    <h2>{tr('Array Split & Recursive Min/Max Visualizer')}</h2>
                    <p>{tr('See how the array is divided, solved recursively, and combined to find min and max.')}</p>
                  </div>
                  <label>
                    {tr('Sample Array')}
                    <select
                      aria-label={tr('Min/max sample array')}
                      value={customArray ? 'custom' : String(sampleIndex)}
                      onChange={(e) => {
                        if (e.target.value === 'custom') {
                          setCustomMode(true)
                          open('Visualization')
                          return
                        }
                        setCustomMode(false)
                        apply(samples[Number(e.target.value)].values)
                      }}
                    >
                      {samples.map((s, i) => (
                        <option key={s.name} value={i}>{`[ ${s.values.join(', ')} ]`}</option>
                      ))}
                      <option value="custom">{tr('Custom array…')}</option>
                    </select>
                  </label>
                  {customArray && <button onClick={focusArrayEditor}>{tr('Edit custom array')}</button>}
                  <button
                    onClick={() => {
                      setCustomMode(false)
                      apply(minMaxExample)
                    }}
                  >
                    <RotateCcw size={16} />
                    {tr('Reset')}
                  </button>
                </header>
                <div className="mm-visualizer-body">
                  <FlowDiagram run={run} selected={selected} onSelect={pick} />
                  <Combine node={node} />
                </div>
              </section>
              <div className="mm-bottom-grid">
                <Panel
                  className="mm-tree-panel"
                  title={tr('Recursion Tree & Call Stack')}
                  description="View the recursive calls and results at each step."
                  icon={<Network />}
                >
                  <div className="mm-tree-tabs">
                    <button aria-pressed={treeTab === 'tree'} onClick={() => setTreeTab('tree')}>
                      {tr('Recursion Tree')}
                    </button>
                    <button aria-pressed={treeTab === 'stack'} onClick={() => setTreeTab('stack')}>
                      {tr('Call Stack (Trace)')}
                    </button>
                  </div>
                  {treeTab === 'tree' ? (
                    <TreeDiagram root={root} selected={selected} onSelect={pick} />
                  ) : (
                    <ol className="mm-stack">
                      {(frame?.stack ?? [root.id]).map((id, i) => {
                        const n = run.nodes.find((n) => n.id === id)!
                        return (
                          <li key={id}>
                            <button onClick={() => pick(n)}>
                              <b>
                                {tr('Depth ')}
                                {i}
                              </b>
                              <span>
                                [{n.lo}..{n.hi}]
                              </span>
                              <span>
                                {tr('min = ')}
                                {f(n.min)} · {tr('max = ')}
                                {f(n.max)}
                              </span>
                            </button>
                          </li>
                        )
                      })}
                    </ol>
                  )}
                </Panel>
                <Panel className="mm-worked" title={tr('Worked Example')} description="Run through a complete example step by step." icon={<ClipboardList />}>
                  <div className="mm-example-tabs">
                    {exampleSteps.map((label, i) => (
                      <button
                        key={label}
                        aria-pressed={step === i}
                        disabled={run.values.length <= 2 && i !== 4}
                        onClick={() => {
                          setStep(i)
                          setPlaying(false)
                        }}
                      >
                        <b>{i + 1}</b>
                        {tr(label)}
                      </button>
                    ))}
                  </div>
                  <div className="mm-worked-stage">
                    <span className="mm-stage-icon">
                      <Lightbulb />
                    </span>
                    <div>
                      <h3>
                        {tr('Step ')}
                        {step + 1}: {tr(workedTitle)}
                      </h3>
                      <p>
                        {tr(
                          step === 0
                            ? 'Split the input at the middle into left and right halves.'
                            : step === 1 || step === 2
                              ? 'Solve this subproblem and return both extrema.'
                              : step === 3
                                ? 'Compare the two minima and the two maxima.'
                                : 'The full array result is ready.',
                        )}
                      </p>
                    </div>
                  </div>
                  <ArrayCells
                    values={run.values.slice(shown.lo, shown.hi + 1)}
                    offset={shown.lo}
                    purple={step === 2}
                    split={step === 0 ? root.mid : undefined}
                  />
                  {step === 0 && root.left && root.right ? (
                    <div className="mm-example-halves">
                      <b>
                        {tr('Left half: ')}[
                        {run.values
                          .slice(0, root.mid + 1)
                          .map(f)
                          .join(', ')}
                        ]
                      </b>
                      <b>
                        {tr('Right half: ')}[
                        {run.values
                          .slice(root.mid + 1)
                          .map(f)
                          .join(', ')}
                        ]
                      </b>
                    </div>
                  ) : (
                    <p className="mm-worked-result">
                      {tr('min = ')}
                      <b>{f(shown.min)}</b> · {tr('max = ')}
                      <b>{f(shown.max)}</b>
                      {step === 4 && (
                        <span>
                          {' '}
                          · {run.comparisons} {tr('comparisons')}
                        </span>
                      )}
                    </p>
                  )}
                  <div className="mm-example-nav">
                    <button disabled={step === 0 || run.values.length <= 2} onClick={() => setStep(step - 1)}>
                      <ArrowLeft size={15} />
                      {tr('Previous')}
                    </button>
                    <button className="mm-next" disabled={step === 4} onClick={() => setStep(step + 1)}>
                      {tr('Next Step')}
                      <ArrowRight size={16} />
                    </button>
                  </div>
                </Panel>
              </div>
            </div>
            <aside className="mm-side-column">
              <article className="mm-key-ideas">
                <h2>
                  <Lightbulb />
                  {tr('Key Ideas')}
                </h2>
                {[
                  'Divide the array into two halves.',
                  'Recursively find min and max in each half.',
                  'Combine the results with two comparisons.',
                  'Uses about 3n/2 comparisons for powers of two, better than 2n − 2 for the naive method.',
                  'Same divide-and-conquer pattern as merge sort, but with a different combine step.',
                ].map((s) => (
                  <p key={s}>
                    <CheckCircle2 />
                    <span>{tr(s)}</span>
                  </p>
                ))}
              </article>
              <article className="mm-comparisons">
                <h2>
                  <BarChart3 />
                  {tr('Comparisons & Complexity')}
                </h2>
                <div className="mm-count-grid">
                  <div>
                    <span>{tr('Total comparisons (current run)')}</span>
                    <b className="mm-comparison-count">{comparisonCount}</b>
                  </div>
                  <div>
                    <span>{tr('Theoretical bound')}</span>
                    <b>{powerOfTwo && run.values.length > 1 ? '≤ 3n/2' : '≤ 2n − 2'}</b>
                    <small>
                      {tr('For n = ')}
                      {run.values.length}, {powerOfTwo && run.values.length > 1 ? '3n/2' : '2n − 2'} ={' '}
                      {powerOfTwo && run.values.length > 1 ? run.values.length * 1.5 : 2 * run.values.length - 2}
                    </small>
                  </div>
                </div>
                <p>
                  <b>{tr('Time complexity: O(n)')}</b>
                  <span>|</span>
                  <b>{tr('Auxiliary space: O(log n)')}</b>
                </p>
                <small>{tr('Recurrence: T(n) = 2T(n/2) + 2 = O(n)')}</small>
              </article>
              <Panel className="mm-correctness" title={tr('Correctness')} icon={<ShieldCheck />}>
                <p>
                  {tr(
                    'Each half returns the true minimum and maximum by induction. The minimum of the two minima and maximum of the two maxima are exactly the whole range’s extrema.',
                  )}
                </p>
              </Panel>
              <Panel className="mm-constraints" title={tr('Assumptions and Constraints')} icon={<Settings />}>
                <ul>
                  <li>{tr('Array contains at most 20 values (for visualization).')}</li>
                  <li>{tr('Elements are comparable, finite numbers.')}</li>
                  <li>{tr('We count comparisons between array elements only.')}</li>
                  <li>{tr('Auxiliary space is O(log n) due to recursion stack.')}</li>
                </ul>
              </Panel>
              <article className="mm-pro-tip">
                <Sparkles />
                <div>
                  <h2>{tr('Pro Tip')}</h2>
                  <p>{tr('For powers of two, pair base cases use exactly 3n/2 − 2 comparisons. Separate min and max scans use 2n − 2 comparisons.')}</p>
                </div>
              </article>
            </aside>
          </div>
          {notice && (
            <p className="mm-notice" role="status">
              {tr(notice)}
              <button onClick={() => setNotice('')}>{tr('Close')}</button>
            </p>
          )}
          <details className="mm-theory">
            <summary>{tr('Why pair base cases save comparisons')}</summary>
            <p>
              {tr(
                'A single value is both the minimum and maximum, requiring zero value comparisons. For two values, one comparison determines both extrema. A larger segment is split into two nonempty halves. After solving both halves, compare their minima once and their maxima once. Induction proves the returned extrema are correct for the whole range.',
              )}
            </p>
            <p>
              {tr(
                'For a power-of-two input size n ≥ 2, there are n/2 pair leaves and n/2 − 1 combine nodes: n/2 + 2(n/2 − 1) = 3n/2 − 2 value comparisons. The reference input therefore needs 10 comparisons. For other sizes, the exact count follows C(n) = C(ceil(n/2)) + C(floor(n/2)) + 2, with C(1)=0 and C(2)=1. Halving six values takes 8 comparisons, so the power-of-two formula must not be applied universally.',
              )}
            </p>
            <p>
              {tr(
                'The O(log n) auxiliary-space bound describes the active recursion stack of the algorithm. This visualization also retains all result nodes and playback frames for inspection; its trace uses O(n log n) storage because each frame stores a call-stack snapshot. Inputs contain 1–20 finite numbers between −1000000 and 1000000. Equal values are valid and still use the same comparison schedule.',
              )}
            </p>
          </details>
        </>
      )}
      {tab === 'Code' && (
        <Panel title={tr('Recursive min/max implementation')} description="The diagrams execute this TypeScript model." icon={<Code2 />}>
          <pre className="mm-source">
            <code>{source}</code>
          </pre>
        </Panel>
      )}
      {tab === 'Practice' && (
        <Panel
          className="mm-extra"
          title={tr('Predict the value-comparison count')}
          description="Count one comparison per pair leaf and two per combine node."
          icon={<TargetIcon />}
        >
          <ArrayCells values={run.values} />
          <label>
            {tr('Your prediction')}
            <input
              aria-label={tr('Predicted min/max comparisons')}
              type="number"
              min={0}
              step={1}
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
                prediction.trim() !== '' && Number(prediction) === run.comparisons
                  ? `Correct! This input uses ${run.comparisons} value comparisons.`
                  : 'Not yet. A singleton costs 0, a pair costs 1, and combining two solved halves costs 2.',
              )
            }
          >
            {tr('Check prediction')}
          </button>
          {feedback && <p role="status">{tr(feedback)}</p>}
        </Panel>
      )}
      {tab === 'Experiments' && (
        <Panel
          className="mm-extra"
          title={tr('Compare input patterns')}
          description="The comparison schedule depends on input length, rather than its value order."
          icon={<BarChart3 />}
        >
          <div className="mm-toolbar">
            {samples.map((s) => (
              <button
                key={s.name}
                onClick={() => {
                  setCustomMode(false)
                  apply(s.values)
                  open('Learn')
                }}
              >
                {tr(s.name)}
              </button>
            ))}
            <button
              onClick={() => {
                localStorage.setItem('min-max-saved-experiment', JSON.stringify(run.values))
                setNotice('Experiment saved in this browser.')
              }}
            >
              {tr('Save experiment')}
            </button>
            <button
              onClick={() => {
                try {
                  const saved = localStorage.getItem('min-max-saved-experiment')
                  if (!saved) throw new Error()
                  apply(parseMinMaxValues(saved))
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
            {tr('Minimum: ')}
            {f(root.min)} · {tr('Maximum: ')}
            {f(root.max)} · {run.comparisons} {tr('comparisons')}
          </p>
          {notice && <p role="status">{tr(notice)}</p>}
        </Panel>
      )}
    </div>
  )
}
function TargetIcon() {
  return <CheckCircle2 />
}
