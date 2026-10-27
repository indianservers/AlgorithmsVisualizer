// @localized-render
import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Bookmark,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Crown,
  FileText,
  GitFork,
  Lightbulb,
  ListOrdered,
  Moon,
  Pencil,
  Play,
  RotateCcw,
  Search,
  Settings,
  ShieldCheck,
  Sun,
  TriangleAlert,
  Undo2,
  X,
} from 'lucide-react'
import { tx, useLocaleRender } from '../i18n/render'
import { allModules } from '../algorithms'
import { algorithmPath } from '../utils/routing'
import { AccountControl } from '../account/AccountControl'
import { LanguageSelector } from '../i18n/LanguageSelector'
import { usePersistentState, persistentString } from '../hooks/usePersistentState'
import { MockupTabs, type MockupPageProps, type MockupTab } from './MockupLessonChrome'
import {
  advanceMethod,
  createMethod,
  defaultMethod,
  methodCertified,
  methodMax,
  methodMin,
  methodPrunable,
  parseMethodData,
  structuralMethodOrder,
  tightMethodBounds,
  unreachedReason,
  type MethodPolicy,
  type MethodState,
} from './branchBoundMethodModel'
import './branch-bound-method-mockup.css'

const tr = (s: string) => tx(s, 'studios'),
  tabs: MockupTab[] = ['Learn', 'Visualization', 'Code', 'Practice', 'Experiments', 'Notes']
function BoundBars() {
  return (
    <svg viewBox="0 0 26 26" fill="currentColor" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <rect x="3" y="13" width="4" height="11" rx="1.5" fillOpacity=".65" />
      <rect x="11" y="3" width="4" height="21" rx="1.5" fillOpacity=".8" />
      <rect x="19" y="8" width="4" height="16" rx="1.5" fillOpacity=".65" />
      <path d="M5 15V22M13 5V22M21 10V22" stroke="white" strokeWidth=".6" />
    </svg>
  )
}
function MethodIcon() {
  return (
    <svg viewBox="0 0 28 28" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" aria-hidden="true">
      <path d="M14 5L4 23H24Z" />
      <circle cx="14" cy="5" r="3.5" fill="white" />
      <circle cx="4" cy="23" r="3.5" fill="white" />
      <circle cx="24" cy="23" r="3.5" fill="white" />
    </svg>
  )
}
function Panel({
  title,
  subtitle,
  icon,
  children,
  className = '',
  action,
}: {
  title: string
  subtitle?: string
  icon: ReactNode
  children: ReactNode
  className?: string
  action?: ReactNode
}) {
  return (
    <section className={`bm-panel ${className}`}>
      <header>
        <span className="bm-icon">{icon}</span>
        <div>
          <h2>{title}</h2>
          {subtitle && <p>{subtitle}</p>}
        </div>
        {action}
      </header>
      {children}
    </section>
  )
}
function Switch({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="bm-switch">
      <input type="checkbox" aria-label={label} checked={value} onChange={(e) => onChange(e.target.checked)} />
      <i />
      {label}
    </label>
  )
}
function MethodTree({
  state,
  selected,
  select,
  bounds,
  decisions,
}: {
  state: MethodState
  selected: number
  select: (id: number) => void
  bounds: boolean
  decisions: boolean
}) {
  const gradient = useId(),
    positions = [
      [205, 38],
      [91, 130],
      [319, 130],
      [37, 232],
      [151, 232],
      [259, 232],
      [388, 232],
    ],
    label = state.data.sense === 'max' ? 'UB' : 'LB'
  return (
    <div className="bm-tree-scroll">
      <svg className="bm-tree-svg" viewBox="0 0 430 348" aria-label={tr('Branch and bound potential search tree')}>
        {positions.slice(1).map(([x, y], i) => {
          const parent = positions[Math.floor((i + 2) / 2) - 1]
          return (
            <path
              key={i}
              d={`M${parent[0]} ${parent[1] + 20}L${x} ${y - 21}`}
              fill="none"
              stroke={decisions && state.status[i + 1] === 'pruned' ? '#f39aac' : i === 2 ? '#1678ff' : '#afc2df'}
              strokeWidth="1.5"
            />
          )
        })}
        {positions.map(([x, y], i) => {
          const id = i + 1,
            status = state.status[i],
            best = state.best?.id === id,
            prunable = methodPrunable(state.data.sense, state.data.bounds[i], state.best?.value ?? null),
            color =
              selected === id
                ? '#ffaa00'
                : best
                  ? '#0bbd69'
                  : status === 'pruned' && decisions && id <= 3
                    ? '#f14665'
                    : status === 'expanded'
                      ? '#277cff'
                      : '#a7bddb',
            fill =
              selected === id
                ? '#ffe59a'
                : best
                  ? '#b6f3d0'
                  : status === 'pruned' && decisions && id <= 3
                    ? '#ffd8df'
                    : status === 'expanded'
                      ? '#cce8ff'
                      : '#eaf1f9',
            leaf = id >= 4,
            lx = leaf ? x - 37 : x + 33,
            ly = leaf ? y + 25 : y - 21
          return (
            <g
              key={id}
              role="button"
              tabIndex={0}
              aria-label={tr(`Inspect method node ${id}, value ${state.data.values[i]}, ${label} ${state.data.bounds[i]}`)}
              aria-pressed={id === selected}
              onClick={() => select(id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  select(id)
                }
              }}
            >
              <title>{tr(status === 'unreached' ? unreachedReason(state, id) : `Node ${id}: ${status}. ${best ? 'Known feasible incumbent.' : ''}`)}</title>
              <defs>
                <radialGradient id={`${gradient}-${id}`} cx="35%" cy="30%" r="75%">
                  <stop stopColor="#fff" stopOpacity=".85" />
                  <stop offset="1" stopColor={fill} />
                </radialGradient>
              </defs>
              <circle cx={x} cy={y} r="21" fill={`url(#${gradient}-${id})`} stroke={color} strokeWidth={selected === id ? 1.6 : 1.2} />
              <text x={x} y={y + 6} textAnchor="middle" fontSize="16" fontWeight="650" fill="#15315c">
                {id}
              </text>
              <rect
                x={lx}
                y={ly}
                width={leaf ? 75 : 80}
                height="41"
                rx="7"
                fill={best ? '#e0faed' : status === 'pruned' && decisions ? '#fff0f3' : id === 1 ? '#fff1e8' : '#edf2ff'}
              />
              <text
                x={lx + (leaf ? 37.5 : 40)}
                y={ly + 16}
                textAnchor="middle"
                fontSize="12"
                fill="#17356b"
                fontWeight="600"
              >{`v = ${state.data.values[i]}`}</text>
              {bounds && (
                <text
                  x={lx + (leaf ? 37.5 : 40)}
                  y={ly + 32}
                  textAnchor="middle"
                  fontSize="12"
                  fill="#17356b"
                  fontWeight="600"
                >{`${label} = ${state.data.bounds[i]}`}</text>
              )}
              {leaf && (best || (decisions && prunable)) && (
                <g>
                  <rect x={x - 42} y={y + 72} width="84" height={best ? 40 : 30} rx="8" fill={best ? '#d4f9e4' : '#ffe2e8'} />
                  <text x={x} y={y + 89} textAnchor="middle" fontSize="11" fontWeight="650" fill={best ? '#006c39' : '#e52a4f'}>
                    {tr(best ? 'Feasible' : status === 'unreached' ? 'Prunable' : 'Pruned')}
                  </text>
                  {best && (
                    <text x={x} y={y + 104} textAnchor="middle" fontSize="11" fill="#006c39" fontWeight="650">
                      {tr('(Incumbent)')}
                    </text>
                  )}
                </g>
              )}
            </g>
          )
        })}
      </svg>
    </div>
  )
}
function BoundChart({ state, selected, show, onExplain }: { state: MethodState; selected: number; show: boolean; onExplain: () => void }) {
  const id = useId(),
    bound = state.data.bounds[selected - 1],
    incumbent = state.best?.value ?? null,
    max = Math.max(1, bound, incumbent ?? 0),
    scale = 220 / (max * 1.25),
    base = 228,
    boundY = base - bound * scale,
    incY = incumbent === null ? base : base - incumbent * scale,
    maximizing = state.data.sense === 'max'
  return (
    <svg
      className="bm-bound-chart"
      viewBox="0 0 330 282"
      aria-label={tr(`${maximizing ? 'Upper' : 'Lower'} bound ${bound}; feasible incumbent ${incumbent ?? 'not found'}`)}
    >
      <defs>
        <linearGradient id={id} x2="0" y2="1">
          <stop stopColor="#84edbf" />
          <stop offset="1" stopColor="#4dcea1" />
        </linearGradient>
        <linearGradient id={`${id}blue`} x2="0" y2="1">
          <stop stopColor="#60a5ff" />
          <stop offset="1" stopColor="#4e9aff" />
        </linearGradient>
      </defs>
      <path d="M23 228H313" stroke="#c5d8ec" />
      <g
        role="button"
        tabIndex={0}
        aria-label={tr('Explain selected bound and incumbent')}
        onClick={onExplain}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onExplain()
          }
        }}
      >
        <rect x="23" y="0" width="290" height="228" fill="transparent" pointerEvents="all" />
        <rect x="57" y={boundY} width="59" height={bound * scale} rx="6" fill={`url(#${id})`} opacity={show ? 1 : 0.25} />
        {maximizing && incumbent !== null && bound > incumbent && (
          <rect
            x="57"
            y={boundY}
            width="59"
            height={(bound - incumbent) * scale}
            rx="6"
            fill="#d6fbe4"
            fillOpacity=".85"
            stroke="#48cd88"
            strokeDasharray="4 3"
          />
        )}
        <text x="86.5" y={boundY - 9} textAnchor="middle" fontSize="16" fontWeight="700" fill="#081c55">
          {show ? bound : '—'}
        </text>
        <rect x="211" y={incY} width="59" height={incumbent === null ? 1 : incumbent * scale} rx="6" fill={`url(#${id}blue)`} />
        <text x="240.5" y={incY - 9} textAnchor="middle" fontSize="16" fontWeight="700" fill="#081c55">
          {incumbent ?? '—'}
        </text>
        <text x="146" y="27" fontSize="12" fill="#47618f">
          {tr('Optimistic bound')}
        </text>
        <text x="155" y="43" fontSize="12" fill="#47618f">
          {tr(maximizing ? '(upper bound)' : '(lower bound)')}
        </text>
        <path d="M141 47Q136 64 120 69m5-6-5 6 8-1" fill="none" stroke="#4ccf8b" />
        <text x="230" y="164" fontSize="12" fill="#006dff" stroke="#e1f3ff" strokeWidth="4" paintOrder="stroke">
          {tr('Current incumbent')}
        </text>
        <path d="M296 147Q295 131 274 125m7-2-7 2 4 6" fill="none" stroke="#4e94ff" />
        <text x="240" y="180" fontSize="12" fill="#006dff" stroke="#e1f3ff" strokeWidth="4" paintOrder="stroke">
          {tr('(best feasible)')}
        </text>
      </g>
      <text x="86" y="249" textAnchor="middle" fontSize="12" fontWeight="650" fill="#112b60">
        {tr(maximizing ? 'Upper bound UB' : 'Lower bound LB')}
      </text>
      <text x="86" y="266" textAnchor="middle" fontSize="12" fill="#47618f">
        {tr('(from relaxation)')}
      </text>
      <text x="241" y="249" textAnchor="middle" fontSize="12" fontWeight="650" fill="#112b60">
        {tr('Incumbent value')}
      </text>
      <text x="241" y="266" textAnchor="middle" fontSize="12" fill="#47618f">
        {tr('(feasible solution)')}
      </text>
    </svg>
  )
}
const code = `incumbent ← an optional complete feasible solution
frontier ← {root}
while frontier is not empty:
    node ← FIFO pop or best-bound extraction
    if a feasible incumbent exists and the bound cannot improve it:
        prune node
    else if node is a complete feasible solution:
        update incumbent if its objective is better
    else:
        partition this node into child subproblems
        enqueue promising children using verified safe bounds

MAXIMIZATION: safe UB ≥ every feasible completion; prune if UB ≤ incumbent.
MINIMIZATION: safe LB ≤ every feasible completion; prune if LB ≥ incumbent.
FIFO: oldest live node first. Best-first: largest UB or smallest LB.
Equal bound ties in this laboratory use smaller node IDs.
An interrupted search is provisional unless every live bound is dominated.`
export function BranchBoundMethodMockupLesson(props: MockupPageProps) {
  useLocaleRender()
  const navigate = useNavigate(),
    [tab, setTab] = useState<MockupTab>('Visualization'),
    [state, setState] = useState(() => defaultMethod()),
    [past, setPast] = useState<MethodState[]>([]),
    [selected, setSelected] = useState(1),
    [showBounds, setShowBounds] = useState(true),
    [showDecisions, setShowDecisions] = useState(true)
  const [query, setQuery] = useState(''),
    search = useRef<HTMLInputElement>(null),
    [fallbackTheme, setFallbackTheme] = useState(() => localStorage.getItem('algodrishti-theme') ?? 'light'),
    theme = props.theme ?? fallbackTheme
  const [reviewed, setReviewed] = usePersistentState<number[]>('algodrishti-bound-method-reviewed', [], {
      deserialize: (value) => {
        try {
          const a: unknown = JSON.parse(value)
          return Array.isArray(a) ? [...new Set(a.filter((v): v is number => Number.isInteger(v) && v >= 0 && v < 6))] : []
        } catch {
          return []
        }
      },
    }),
    [notes, setNotes] = usePersistentState('algodrishti-bound-method-notes', '', persistentString)
  const [modal, setModal] = useState<'node' | 'edit' | 'order' | null>(null),
    dialog = useRef<HTMLDialogElement>(null),
    [orderPolicy, setOrderPolicy] = useState<MethodPolicy>('best'),
    [valuesText, setValuesText] = useState(''),
    [boundsText, setBoundsText] = useState(''),
    [draftSeed, setDraftSeed] = useState('4'),
    [error, setError] = useState(''),
    [repairNote, setRepairNote] = useState('')
  const [maxBound, setMaxBound] = useState('6'),
    [maxInc, setMaxInc] = useState('7'),
    [minBound, setMinBound] = useState('90'),
    [minInc, setMinInc] = useState('80'),
    [prediction, setPrediction] = useState(''),
    [predictionFeedback, setPredictionFeedback] = useState(''),
    [nextFeedback, setNextFeedback] = useState(''),
    [feasibleFeedback, setFeasibleFeedback] = useState('')
  const matches = query.trim() ? allModules.filter((m) => `${m.name} ${m.summary}`.toLowerCase().includes(query.toLowerCase())).slice(0, 5) : [],
    studied = props.completed.includes(props.module.id),
    maximizing = state.data.sense === 'max',
    bound = state.data.bounds[selected - 1],
    inc = state.best?.value ?? null,
    prunable = methodPrunable(state.data.sense, bound, inc)
  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem('algodrishti-theme', theme)
  }, [theme])
  useEffect(() => {
    if (modal) dialog.current?.showModal()
    else dialog.current?.close()
  }, [modal])
  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        search.current?.focus()
      }
    }
    window.addEventListener('keydown', handle)
    return () => window.removeEventListener('keydown', handle)
  }, [])
  function reset(data = state.data, policy = state.policy, seed = state.seed, pruning = state.pruning) {
    setState(createMethod(data, policy, seed, pruning))
    setPast([])
    setSelected(1)
  }
  function step() {
    if (state.complete) return
    setPast([...past, state])
    setState(advanceMethod(state))
  }
  function back() {
    if (!past.length) return
    setState(past.at(-1)!)
    setPast(past.slice(0, -1))
    setSelected(1)
  }
  function chooseSense(sense: 'max' | 'min') {
    setState(defaultMethod(sense === 'max' ? methodMax : methodMin))
    setPast([])
    setSelected(1)
  }
  function inspect(id: number) {
    setSelected(id)
    setModal('node')
  }
  function edit() {
    setValuesText(state.data.values.join(', '))
    setBoundsText(state.data.bounds.join(', '))
    setDraftSeed(state.seed === null ? 'none' : String(state.seed))
    setError('')
    setRepairNote('')
    setModal('edit')
  }
  function apply() {
    try {
      const data = parseMethodData(state.data.sense, valuesText, boundsText)
      reset(data, state.policy, draftSeed === 'none' ? null : Number(draftSeed))
      setError('')
      setModal(null)
    } catch (e) {
      setError((e as Error).message)
    }
  }
  function repair() {
    try {
      setBoundsText(tightMethodBounds(state.data.sense, valuesText).join(', '))
      setError('')
      setRepairNote(
        'Tight bounds were computed by enumerating the four known terminal solutions. This teaching oracle is not a cheap bound for a general optimization problem.',
      )
    } catch (e) {
      setError((e as Error).message)
    }
  }
  function ruleCard(sense: 'max' | 'min', boundText: string, setBoundText: (v: string) => void, incText: string, setIncText: (v: string) => void) {
    const valid = [boundText, incText].every((s) => s.trim() && Number.isInteger(Number(s)) && Number(s) >= 0 && Number(s) <= 999),
      b = Number(boundText),
      v = Number(incText),
      prune = valid && methodPrunable(sense, b, v),
      symbol = sense === 'max' ? (prune ? '≤' : '>') : prune ? '≥' : '<'
    return (
      <article className={`bm-rule-card bm-rule-${sense}`}>
        <h3>
          {sense === 'max' ? <ArrowUpRight /> : <ArrowDown />}
          {tr(sense === 'max' ? 'Maximization (e.g., Knapsack)' : 'Minimization (e.g., TSP)')}
        </h3>
        <div className="bm-rule-equation">
          <b>{tr('Prune if')}</b>
          <strong>{sense === 'max' ? 'UB ≤ incumbent' : 'LB ≥ incumbent'}</strong>
        </div>
        <p>
          <b>{tr('Example:')}</b>
          <br />
          {tr(sense === 'max' ? 'Node has UB = ' : 'Node has LB = ')}
          <input
            aria-label={tr(sense === 'max' ? 'Maximization upper bound' : 'Minimization lower bound')}
            inputMode="numeric"
            value={boundText}
            style={{ width: `${Math.max(1, Math.min(5, boundText.length))}ch` }}
            onChange={(e) => setBoundText(e.target.value)}
          />
          {tr(' and')}
          <br />
          {tr('current incumbent = ')}
          <input
            aria-label={tr(sense === 'max' ? 'Maximization feasible incumbent' : 'Minimization feasible incumbent')}
            inputMode="numeric"
            value={incText}
            style={{ width: `${Math.max(1, Math.min(5, incText.length))}ch` }}
            onChange={(e) => setIncText(e.target.value)}
          />
          {'.'}
          <br />
          {valid ? tr(`Since ${b} ${symbol} ${v}, ${prune ? 'prune this node' : 'keep this node'}`) : tr('Use integers from 0 to 999.')}
          {valid && (
            <>
              <br />
              {tr(prune ? '(it cannot improve the solution).' : '(the bound still allows improvement).')}
            </>
          )}
        </p>
      </article>
    )
  }
  const orderCard = (policy: MethodPolicy) => {
    const sequence = structuralMethodOrder(state.data, policy)
    return (
      <article className={`bm-order-card bm-order-${policy}`}>
        <h3>
          {policy === 'fifo' ? <ClipboardList /> : <Crown />}
          {tr(policy === 'fifo' ? 'FIFO (Breadth-First)' : 'Best-First')}
        </h3>
        <div className="bm-order-sequence">
          {sequence.slice(0, 5).map((id, i) => (
            <span key={id}>
              {i > 0 && <i>{'→'}</i>}
              <button
                aria-label={tr(`Inspect node ${id} from ${policy === 'fifo' ? 'FIFO' : 'best-first'} order`)}
                aria-pressed={selected === id}
                className={selected === id ? 'bm-order-current' : ''}
                onClick={() => setSelected(id)}
              >
                {id}
              </button>
            </span>
          ))}
          <button
            aria-label={tr(`Show complete ${policy === 'fifo' ? 'FIFO' : 'best-first'} order`)}
            className="bm-more-order"
            onClick={() => {
              setOrderPolicy(policy)
              setModal('order')
            }}
          >
            {'…'}
          </button>
        </div>
        <ul>
          {(policy === 'fifo'
            ? ['Uses a queue (FIFO)', 'Explores level by level', 'Simple, but may explore many nodes']
            : ['Chooses node with best bound', 'Explores most promising node first', 'May reduce work; depends on bounds']
          ).map((s) => (
            <li key={s}>{tr(s)}</li>
          ))}
        </ul>
      </article>
    )
  }
  const tree = (
    <Panel title={tr('Branching Search Tree')} subtitle={tr('Each node shows value, bound and status')} icon={<MethodIcon />} className="bm-tree-panel">
      <MethodTree state={state} selected={selected} select={setSelected} bounds={showBounds} decisions={showDecisions} />
      <div className="bm-tree-legend">
        {['Current node', 'Explored node', 'Pruned node', 'Feasible node'].map((s, i) => (
          <span key={s} title={i === 0 ? tr('Gold marks the node currently inspected in the chart.') : undefined}>
            <i className={`bm-dot-${i}`} />
            {tr(s)}
          </span>
        ))}
      </div>
    </Panel>
  )
  const chart = (
    <Panel
      title={tr('Incumbent vs Optimistic Bound')}
      subtitle={tr('Feasible solution (incumbent) vs optimistic bound at a node')}
      icon={<BoundBars />}
      className="bm-bound-panel"
    >
      <BoundChart state={state} selected={selected} show={showBounds} onExplain={() => setModal('node')} />
      <button className="bm-bound-tip" onClick={() => setModal('node')}>
        <Lightbulb />
        {tr(
          inc === null
            ? 'Find a complete feasible solution before pruning by an incumbent.'
            : maximizing
              ? 'If UB ≤ incumbent, this node cannot improve the solution and can be pruned.'
              : 'If LB ≥ incumbent, this node cannot improve the solution and can be pruned.',
        )}
      </button>
    </Panel>
  )
  const rules = (
    <Panel title={tr('Pruning Rule Examples')} subtitle={tr('When to prune based on bounds and incumbent')} icon={<Settings />} className="bm-rules-panel">
      <div className="bm-rule-grid">
        {ruleCard('max', maxBound, setMaxBound, maxInc, setMaxInc)}
        {ruleCard('min', minBound, setMinBound, minInc, setMinInc)}
      </div>
      <header className="bm-comparison-heading">
        <MethodIcon />
        <div>
          <h2>{tr('Search Order Comparison')}</h2>
          <p>{tr('Different selection strategies; structural preview with pruning off.')}</p>
        </div>
      </header>
      <div className="bm-order-grid">
        {orderCard('fifo')}
        {orderCard('best')}
      </div>
    </Panel>
  )
  const footer = (
    <div className="bm-footer-grid">
      <Panel title={tr('Key Takeaways')} icon={<Lightbulb />} className="bm-takeaways">
        <ul>
          {[
            'Branching partitions the feasible solutions into subproblems (partial states).',
            'A complete feasible solution is an incumbent.',
            'Bounds are optimistic: upper bound for maximization, lower bound for minimization.',
            'Prune when a node cannot beat the incumbent.',
            'Search order can change performance; safe bounds preserve correctness.',
          ].map((s) => (
            <li key={s}>{tr(s)}</li>
          ))}
        </ul>
      </Panel>
      <Panel
        title={tr('Worked Examples')}
        icon={<FileText />}
        className="bm-worked"
        action={
          <button
            className="bm-primary"
            onClick={() => {
              reset()
              setTab('Experiments')
            }}
          >
            {tr('Try It')}
          </button>
        }
      >
        <button onClick={() => navigate('/branch-and-bound/knapsack-fifo')}>
          <span>{'1'}</span>
          <div>
            <b>{tr('0/1 Knapsack (Maximization)')}</b>
            <p>{tr('Use fractional knapsack upper bounds, track incumbent and prune subtrees.')}</p>
          </div>
          <ChevronRight />
        </button>
        <button onClick={() => navigate('/branch-and-bound/tsp-branch-and-bound')}>
          <span>{'2'}</span>
          <div>
            <b>{tr('TSP (Minimization)')}</b>
            <p>{tr('Use independently minimizing outgoing edges for lower bounds and prune tours.')}</p>
          </div>
          <ChevronRight />
        </button>
      </Panel>
      <Panel title={tr('Correctness & Complexity')} icon={<BoundBars />} className="bm-correctness">
        <ul>
          {[
            'Correctness: never prune a node that can contain a strictly better solution.',
            'Optimality follows when every live bound is dominated by a feasible incumbent.',
            'Time can be exponential in the worst case (the number of nodes can be large).',
            'Space depends on the frontier and retained search states.',
          ].map((s) => (
            <li key={s}>{tr(s)}</li>
          ))}
        </ul>
      </Panel>
      <Panel title={tr('Common Pitfalls')} icon={<TriangleAlert />} className="bm-pitfalls">
        <ul>
          {[
            'Using non-optimistic (unsafe) bounds.',
            'Forgetting to update the incumbent.',
            'Pruning with the wrong inequality (≤ vs ≥).',
            'Confusing relaxed bounds with feasible solutions.',
            'Poor selection strategies may explore unnecessary nodes.',
          ].map((s) => (
            <li key={s}>{tr(s)}</li>
          ))}
        </ul>
      </Panel>
    </div>
  )
  const reviewIndex = tabs.indexOf(tab),
    review = (
      <button
        className="bm-review"
        aria-pressed={reviewed.includes(reviewIndex)}
        onClick={() => setReviewed(reviewed.includes(reviewIndex) ? reviewed.filter((v) => v !== reviewIndex) : [...reviewed, reviewIndex])}
      >
        <CheckCircle2 size={17} />
        {tr(reviewed.includes(reviewIndex) ? `${tab} reviewed` : `Mark ${tab} reviewed`)}
      </button>
    )
  return (
    <div className="mom-page target-visual bound-method-page" data-target="22">
      <div className="mom-topbar bm-topbar">
        <button className="bm-back" aria-label={tr('Back to TSP branch and bound')} onClick={() => navigate('/branch-and-bound/tsp-branch-and-bound')}>
          <ArrowLeft size={18} />
        </button>
        <div className="mom-search">
          <Search size={18} />
          <input
            ref={search}
            aria-label={tr('Search topics')}
            placeholder={tr('Search topics, algorithms, or keywords…')}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button className="bm-search-key" aria-label={tr('Focus topic search')} onClick={() => search.current?.focus()}>
            {'⌘ K'}
          </button>
          {query && (
            <div className="mom-search-results">
              {matches.length ? (
                matches.map((m) => (
                  <button key={m.id} onClick={() => navigate(algorithmPath(m))}>
                    {tx(m.name, 'algorithms')}
                  </button>
                ))
              ) : (
                <p>{tr('No matching topics.')}</p>
              )}
            </div>
          )}
        </div>
        <button className="mom-study" aria-pressed={studied} onClick={() => props.toggleCompleted(props.module.id)}>
          {studied ? <Check size={16} /> : <Bookmark size={16} />} {tr(studied ? 'Studied' : 'Mark studied')}
        </button>
        <AccountControl showLanguage={false} />
      </div>
      <header className="bm-lesson-header">
        <button className="bm-back" aria-label={tr('Open TSP worked example')} onClick={() => navigate('/branch-and-bound/tsp-branch-and-bound')}>
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1>
            {tr('Branch and Bound: Method and Bounds')}
            <span aria-hidden="true">{tr('Optimal Search')}</span>
          </h1>
          <p>{tr('Separate feasible incumbents from optimistic relaxation bounds')}</p>
        </div>
        <div className="bm-section-progress" aria-label={tr(`${reviewed.length} of 6 sections reviewed`)}>
          <span>{tr(`${reviewed.length} of 6 sections`)}</span>
          <div>
            {tabs.map((s, i) => (
              <i key={s} className={reviewed.includes(i) ? 'bm-section-done' : ''} />
            ))}
          </div>
        </div>
        <button className="bm-primary bm-start" onClick={() => setTab('Learn')}>
          {tr('Start Learning')}
          <ArrowRight size={19} />
        </button>
      </header>
      <MockupTabs active={tab} onChange={setTab} tabs={tabs} />
      {tab === 'Visualization' ? (
        <>
          <section className="bm-visualization">
            <header className="bm-visual-heading">
              <BoundBars />
              <div>
                <h2>{tr('Interactive Visualization')}</h2>
                <p>{tr('Explore how branch and bound uses bounds to prune the search and keep the best incumbent solution.')}</p>
              </div>
              <div className="bm-visual-options">
                <label>
                  {tr('Problem type:')}
                  <select
                    aria-label={tr('Branch and bound problem type')}
                    value={state.data.sense}
                    onChange={(e) => chooseSense(e.target.value as 'max' | 'min')}
                  >
                    <option value="max">{tr('Maximization (e.g., Knapsack)')}</option>
                    <option value="min">{tr('Minimization (e.g., TSP)')}</option>
                  </select>
                </label>
                <Switch label={tr('Show bounds')} value={showBounds} onChange={setShowBounds} />
                <Switch label={tr('Show prune decisions')} value={showDecisions} onChange={setShowDecisions} />
                <button
                  onClick={() => {
                    setState(defaultMethod(state.data))
                    setPast([])
                    setSelected(1)
                  }}
                >
                  <RotateCcw size={17} />
                  {tr('Reset')}
                </button>
              </div>
            </header>
            <div className="bm-dashboard-grid">
              {tree}
              {chart}
              {rules}
            </div>
          </section>
          {footer}
          <div className="bm-after-dashboard">{review}</div>
        </>
      ) : tab === 'Learn' ? (
        <div className="bm-learning">
          <Panel title={tr('Branch, Bound, Compare and Prune')} icon={<BookOpen />}>
            <p>
              {tr(
                'An incumbent is the objective of a complete feasible solution. A bound is an optimistic promise about every completion of one subproblem. They have different jobs: the incumbent is achievable; the bound may not be.',
              )}
            </p>
            <div className="bm-concept-grid">
              {[
                ['Branch', 'Partition all possible completions into child subproblems without losing candidates.'],
                ['Bound', 'Prove an upper bound for maximization or a lower bound for minimization.'],
                ['Compare', 'Use a feasible incumbent. A partial score or relaxed solution is not a certificate.'],
                ['Prune', 'Discard only a branch that cannot contain a strictly better solution.'],
              ].map(([title, text]) => (
                <article key={title}>
                  <h3>{tr(title)}</h3>
                  <p>{tr(text)}</p>
                </article>
              ))}
            </div>
          </Panel>
          <Panel title={tr('Understand This Seven-Node Example')} icon={<GitFork />}>
            <p>
              {tr(
                'Only terminal nodes 4–7 are complete feasible solutions. Internal v values are illustrative partial scores. The default maximization example starts from terminal node 4, objective 12; root UB = 16 and node 2 UB = 14 still require branching. Node 3 UB = 12 and node 5 UB = 11 cannot improve 12.',
              )}
            </p>
            <p>
              {tr(
                'Nodes 6 and 7 are potential descendants beneath pruned node 3; they were not generated by the search. Their displayed bounds are also prunable, but that does not mean they were processed. Gold identifies the node currently inspected in the chart.',
              )}
            </p>
            <p>
              {tr(
                'The chart shows one selected node’s stored bound. Global certification uses only the remaining live frontier; an already expanded root may keep its original loose bound even after the optimum is proved.',
              )}
            </p>
            <p>
              {tr(
                'The two rule cards are independent numeric scenarios whose incumbents are assumed feasible. The editable main search requires a known terminal witness.',
              )}
            </p>
            <button className="bm-primary" onClick={() => setTab('Visualization')}>
              {tr('Inspect the reference example')}
            </button>
          </Panel>
          <Panel title={tr('Why Search Order Affects Work')} icon={<ListOrdered />}>
            <p>
              {tr(
                'FIFO uses a queue and explores level by level. Best-first extracts the largest UB for maximization or smallest LB for minimization. Equal-bound ties here use smaller node IDs. Best-first can help find strong incumbents earlier, but is not always faster and does not make an unsafe bound correct.',
              )}
            </p>
            <p>
              {tr(
                'The dashboard order cards show the potential tree with pruning off. Replay a search in Experiments to see actual processed nodes and skipped subtrees.',
              )}
            </p>
          </Panel>
          {review}
        </div>
      ) : tab === 'Code' ? (
        <Panel title={tr('General Branch-and-Bound Pseudocode')} icon={<ClipboardList />} className="bm-code">
          <pre>
            <code>{code}</code>
          </pre>
          <p>
            {tr(
              'For this finite teaching tree, edited bounds are checked by enumerating its four known terminal solutions. Computing tight bounds this way would defeat the purpose of branch and bound on a large problem. Real problems need separately justified relaxations, such as fractional knapsack or independent outgoing-edge minima for TSP.',
            )}
          </p>
          {review}
        </Panel>
      ) : tab === 'Practice' ? (
        <div className="bm-practice">
          <Panel title={tr('Predict the Pruning Decision')} icon={<Settings />}>
            <p>{tr('Maximization: an upper bound is 11 and the feasible incumbent is 12. Choose prune or keep.')}</p>
            <div>
              <button onClick={() => setPredictionFeedback('Correct: 11 ≤ 12, so this node cannot contain a strictly better solution.')}>{tr('Prune')}</button>
              <button onClick={() => setPredictionFeedback('Reconsider: no completion exceeds the upper bound 11. It cannot improve a feasible profit of 12.')}>
                {tr('Keep')}
              </button>
            </div>
            {predictionFeedback && <p role="status">{tr(predictionFeedback)}</p>}
          </Panel>
          <Panel title={tr('Predict the Best-First Node')} icon={<Crown />}>
            <p>
              {tr('Minimization, pruning off: after root 1 and node 2 are expanded, live bounds are node 3: 85, node 4: 80, node 5: 90. Which node is next?')}
            </p>
            <label>
              {tr('Node ID')}
              <input aria-label={tr('Predicted best-first method node')} value={prediction} onChange={(e) => setPrediction(e.target.value)} />
            </label>
            <button
              className="bm-primary"
              onClick={() =>
                setNextFeedback(
                  prediction.trim() && Number(prediction) === 4
                    ? 'Correct: node 4 has the smallest lower bound, 80. FIFO would choose the older node 3.'
                    : 'Try again: best-first minimizes the lower bound here. Compare 85, 80 and 90.',
                )
              }
            >
              {tr('Check next node')}
            </button>
            {nextFeedback && <p role="status">{tr(nextFeedback)}</p>}
          </Panel>
          <Panel title={tr('Is a Relaxed Bound a Feasible Solution?')} icon={<ShieldCheck />}>
            <p>{tr('A knapsack relaxation allows fractional items. May its upper bound be used as the 0/1 incumbent?')}</p>
            <button onClick={() => setFeasibleFeedback('Reconsider: fractional items need not form a feasible 0/1 selection. A bound may be unattainable.')}>
              {tr('Yes')}
            </button>
            <button
              onClick={() =>
                setFeasibleFeedback('Correct. Only an actual feasible 0/1 subset may update the incumbent; the fractional result supplies an upper bound.')
              }
            >
              {tr('No')}
            </button>
            {feasibleFeedback && <p role="status">{tr(feasibleFeedback)}</p>}
          </Panel>
          {review}
        </div>
      ) : tab === 'Experiments' ? (
        <div className="bm-experiments">
          <Panel title={tr('Replay the Same Tree Under Different Policies')} icon={<Play />}>
            <p>
              {tr(
                'This laboratory has seven potential nodes and four complete terminal solutions. Unsafe edited bounds are rejected. Disabling pruning is useful for studying the structural order. Changing search settings restarts from the root.',
              )}
            </p>
            <div className="bm-experiment-controls">
              <button onClick={edit}>
                <Pencil size={14} />
                {tr('Edit values and bounds')}
              </button>
              <label>
                {tr('Search policy')}
                <select aria-label={tr('Method search policy')} value={state.policy} onChange={(e) => reset(state.data, e.target.value as MethodPolicy)}>
                  <option value="fifo">{tr('FIFO')}</option>
                  <option value="best">{tr('Best-First')}</option>
                </select>
              </label>
              <label>
                {tr('Feasible incumbent seed')}
                <select
                  aria-label={tr('Method feasible seed')}
                  value={state.seed ?? 'none'}
                  onChange={(e) => reset(state.data, state.policy, e.target.value === 'none' ? null : Number(e.target.value))}
                >
                  <option value="none">{tr('None')}</option>
                  {[4, 5, 6, 7].map((id) => (
                    <option key={id} value={id}>
                      {tr(`Terminal ${id}: ${state.data.values[id - 1]}`)}
                    </option>
                  ))}
                </select>
              </label>
              <Switch label={tr('Enable safe pruning')} value={state.pruning} onChange={(value) => reset(state.data, state.policy, state.seed, value)} />
            </div>
            <div className="bm-playback">
              <button className="bm-primary" onClick={step} disabled={state.complete}>
                {tr('Process next node')}
              </button>
              <button onClick={back} disabled={!past.length}>
                <Undo2 size={16} />
                {tr('Step Back')}
              </button>
              <button onClick={() => reset()}>
                <RotateCcw size={16} />
                {tr('Replay from root')}
              </button>
            </div>
            <p className="bm-live-message" role="status">
              {tr(state.message)}
            </p>
            <p className="bm-certificate">
              {tr(methodCertified(state) ? `Optimal terminal value ${state.best!.value} is certified.` : 'Optimality is not yet certified.')}
            </p>
            <p>{tr(`Processed: ${state.processed.join(' → ') || 'none'}. Expanded: ${state.expanded.length}. Pruned: ${state.pruned.length}.`)}</p>
          </Panel>
          <Panel title={tr('All Potential Nodes and Their Actual Search Status')} icon={<GitFork />}>
            <div className="bm-node-table">
              <table>
                <thead>
                  <tr>
                    {['Node', 'Partial / terminal value', 'Optimistic bound', 'Actual status', 'Action'].map((s) => (
                      <th key={s}>{tr(s)}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {state.data.values.map((value, i) => (
                    <tr key={i}>
                      <td>{i + 1}</td>
                      <td>{value}</td>
                      <td>{state.data.bounds[i]}</td>
                      <td>{tr(state.best?.id === i + 1 ? 'Feasible incumbent' : state.status[i])}</td>
                      <td>
                        <button aria-label={tr(`Inspect potential method node ${i + 1}`)} onClick={() => inspect(i + 1)}>
                          {tr('Inspect')}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p>{tr(`Live frontier: [${state.frontier.join(', ')}]. Potential nodes below a pruned ancestor remain unreached.`)}</p>
          </Panel>
          {review}
        </div>
      ) : (
        <Panel title={tr('Your Branch-and-Bound Notes')} icon={<BookOpen />} className="bm-notes">
          <LanguageSelector />
          <label>
            {tr('Explain why the inequality reverses between maximization and minimization.')}
            <textarea aria-label={tr('Branch and bound method notes')} rows={8} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </label>
          <p>{tr('Notes and reviewed sections are saved in this browser.')}</p>
          <button
            aria-label={tr('Toggle color theme')}
            onClick={() => (props.onToggleTheme ? props.onToggleTheme() : setFallbackTheme(theme === 'dark' ? 'light' : 'dark'))}
          >
            {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />} {tr('Toggle color theme')}
          </button>
          {review}
        </Panel>
      )}
      <dialog
        ref={dialog}
        className="bm-dialog"
        aria-label={tr(modal === 'edit' ? 'Edit method example' : modal === 'order' ? 'Complete structural search order' : 'Method node and bound details')}
        onCancel={() => setModal(null)}
        onClose={() => setModal(null)}
      >
        <button className="bm-close" aria-label={tr('Close method dialog')} onClick={() => setModal(null)}>
          <X />
        </button>
        {modal === 'edit' ? (
          <>
            <h2>{tr('Edit method example')}</h2>
            <p>
              {tr(
                'Enter 7 integer values and 7 bounds (0–999). Only terminal values 4–7 define complete solutions. Each bound is checked against the best terminal descendant in its subtree.',
              )}
            </p>
            <label>
              {tr('Node values 1–7')}
              <input aria-label={tr('Method node values')} value={valuesText} onChange={(e) => setValuesText(e.target.value)} />
            </label>
            <label>
              {tr('Node bounds 1–7')}
              <input aria-label={tr('Method node bounds')} value={boundsText} onChange={(e) => setBoundsText(e.target.value)} />
            </label>
            <label>
              {tr('Initial feasible witness')}
              <select aria-label={tr('Edited method feasible seed')} value={draftSeed} onChange={(e) => setDraftSeed(e.target.value)}>
                <option value="none">{tr('None')}</option>
                {[4, 5, 6, 7].map((id) => (
                  <option key={id} value={id}>
                    {tr(`Terminal node ${id}`)}
                  </option>
                ))}
              </select>
            </label>
            <button onClick={repair}>{tr('Use tight safe bounds')}</button>
            {repairNote && <p>{tr(repairNote)}</p>}
            {error && <p role="alert">{tr(error)}</p>}
            <button className="bm-primary" onClick={apply}>
              {tr('Apply verified example')}
            </button>
          </>
        ) : modal === 'order' ? (
          <>
            <h2>{tr(orderPolicy === 'fifo' ? 'FIFO structural order' : 'Best-first structural order')}</h2>
            <p className="bm-complete-order">{structuralMethodOrder(state.data, orderPolicy).join(' → ')}</p>
            <p>
              {tr(
                'This order deliberately has pruning off. Only generated live nodes can be processed in a real search. Equal bounds use smaller node IDs. Safe pruning may remove entire subtrees before these nodes are reached.',
              )}
            </p>
            <button
              onClick={() => {
                setModal(null)
                reset(state.data, orderPolicy, null, false)
                setTab('Experiments')
              }}
            >
              {tr('Replay this order')}
            </button>
          </>
        ) : (
          <>
            <h2>{tr(`Node ${selected}: Bound and Feasibility`)}</h2>
            <p>
              {tr(
                `Value ${state.data.values[selected - 1]} is ${selected >= 4 ? 'a complete terminal objective' : 'an illustrative partial score, not a complete solution'}. ${maximizing ? 'Upper' : 'Lower'} bound = ${bound}.`,
              )}
            </p>
            <p>
              {tr(
                inc === null
                  ? 'No feasible incumbent exists yet, so this bound cannot prune by comparison.'
                  : `${bound} ${maximizing ? (prunable ? '≤' : '>') : prunable ? '≥' : '<'} ${inc}: ${prunable ? 'the bound cannot beat the feasible incumbent' : 'the bound still permits a strictly better completion'}.`,
              )}
            </p>
            <p>{tr(state.status[selected - 1] === 'unreached' ? unreachedReason(state, selected) : `Actual search status: ${state.status[selected - 1]}.`)}</p>
            {state.best && <p>{tr(`The incumbent ${state.best.value} is witnessed by complete terminal node ${state.best.id}.`)}</p>}
            <p>
              {tr(
                'The bound is an optimistic promise, not necessarily an attainable value. Global certification depends on the surviving frontier, not on an already expanded node’s stored bound.',
              )}
            </p>
          </>
        )}
      </dialog>
    </div>
  )
}
