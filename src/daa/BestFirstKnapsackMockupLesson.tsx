// @localized-render
import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import {
  BarChart3,
  BookOpen,
  BrainCog,
  CheckCircle2,
  ClipboardList,
  Clock3,
  Code2,
  Crown,
  FileText,
  GitFork,
  Layers3,
  Lightbulb,
  ListOrdered,
  Network,
  Pause,
  Pencil,
  Play,
  RotateCcw,
  Scissors,
  Trophy,
  Target,
  TrendingUp,
  X,
} from 'lucide-react'
import { tx, useLocaleRender } from '../i18n/render'
import { LanguageSelector } from '../i18n/LanguageSelector'
import { usePersistentState, persistentString } from '../hooks/usePersistentState'
import { MockupLessonChrome, MockupTabs, type MockupPageProps, type MockupTab } from './MockupLessonChrome'
import { advanceBest, bestCertified, createBest, defaultBest, type BestState } from './bestFirstKnapsackModel'
import { fifoDominated, formatFifoBound, parseFifoInput, type FifoNode } from './fifoKnapsackModel'
import './best-first-knapsack-mockup.css'

const tr = (s: string) => tx(s, 'studios'),
  tabs: MockupTab[] = ['Learn', 'Visualization', 'Code', 'Practice', 'Experiments']
const stages = [
    [
      'Branch',
      'Include or exclude the next item.',
      'Each level fixes one decision in decreasing density order. The include and exclude children partition every possible 0/1 completion. Positive weights allow a full-capacity node to terminate immediately.',
    ],
    [
      'Bound',
      'Use fractional knapsack for an upper bound.',
      'Keep earlier decisions fixed. Relax only the remaining items to fractions and fill by decreasing profit/weight. The relaxed feasible set contains all integral completions, so its optimal profit is an upper bound.',
    ],
    [
      'Best-First',
      'Expand node with highest bound (priority queue).',
      'Extract the largest exact upper bound. Equal bounds use the lower insertion ID first. Best-first is a node selection policy; it does not make the fractional solution a valid 0/1 answer.',
    ],
    [
      'Prune',
      'Discard nodes with bound ≤ incumbent.',
      'The incumbent is an actual feasible subset. If a node has upper bound at most this profit, none of its completions can be strictly better. Overweight nodes are infeasible and are discarded immediately.',
    ],
  ],
  stageIcons = [BranchIcon, Crown, TrendingUp, Scissors]
function BranchIcon() {
  return (
    <svg viewBox="0 0 28 28" fill="none" aria-hidden="true">
      <path d="M14 10V17M14 15L5 22M14 15L23 22" stroke="currentColor" strokeWidth="2" />
      <circle cx="14" cy="7" r="6" fill="currentColor" />
      <circle cx="5" cy="23" r="4" fill="currentColor" />
      <circle cx="23" cy="23" r="4" fill="currentColor" />
    </svg>
  )
}
function InstanceIcon() {
  return (
    <svg viewBox="0 0 26 26" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M8 3V23M18 3V23" />
      <rect x="4" y="4" width="18" height="5" rx="1.5" />
      <rect x="4" y="11" width="18" height="5" rx="1.5" />
      <rect x="4" y="18" width="18" height="5" rx="1.5" />
      <path d="M8 6.5H17M8 13.5H17M8 20.5H17" strokeWidth="1" />
    </svg>
  )
}
function DifficultyIcon() {
  return (
    <svg viewBox="0 0 18 18" aria-hidden="true">
      <rect x="1" y="11" width="3" height="6" rx="1" fill="#29bfff" />
      <rect x="5" y="7" width="3" height="10" rx="1" fill="#078dff" />
      <rect x="9" y="3" width="3" height="14" rx="1" fill="#ffad1f" />
      <rect x="13" y="1" width="3" height="16" rx="1" fill="#ffcd5d" />
    </svg>
  )
}
function Panel({
  title,
  icon,
  children,
  className = '',
  action,
}: {
  title: string
  icon: ReactNode
  children: ReactNode
  className?: string
  action?: ReactNode
}) {
  return (
    <section className={`mom-panel bk-panel ${className}`}>
      <header>
        <span className="bk-icon">{icon}</span>
        <h2>{title}</h2>
        {action}
      </header>
      {children}
    </section>
  )
}
function Bag({ small = false }: { small?: boolean }) {
  const id = useId()
  return (
    <svg className={small ? 'bk-bag-icon' : 'bk-hero-art'} viewBox={small ? '70 0 110 126' : '0 0 300 126'} aria-hidden="true">
      <defs>
        <linearGradient id={id} x2="1" y2="1">
          <stop stopColor="#77d6ff" />
          <stop offset=".42" stopColor="#168cff" />
          <stop offset="1" stopColor="#0534c7" />
        </linearGradient>
        <linearGradient id={`${id}p`} x2=".3" y2="1">
          <stop stopColor="#7ccaff" />
          <stop offset="1" stopColor="#0752e9" />
        </linearGradient>
        <linearGradient id={`${id}c`} x2="1" y2="1">
          <stop stopColor="#fff7a4" />
          <stop offset=".5" stopColor="#ffd344" />
          <stop offset="1" stopColor="#ffad09" />
        </linearGradient>
      </defs>
      {!small && (
        <>
          <ellipse cx="129" cy="115" rx="65" ry="9" fill="#b6c6ff" opacity=".25" />
          {[
            [52, 44, 7],
            [67, 72, 5],
            [30, 98, 7],
            [185, 70, 9],
            [200, 40, 6],
          ].map(([x, y, r], i) => (
            <g key={i} transform={`rotate(20 ${x} ${y})`}>
              <ellipse cx={x} cy={y} rx={r} ry={r * 1.4} fill={`url(#${id}c)`} stroke="#ffb800" />
              <ellipse cx={x} cy={y} rx={r * 0.65} ry={r} fill="none" stroke="#fff3a4" />
            </g>
          ))}
          <g fill="#9fc9ff" stroke="#7faaff" opacity=".75">
            <rect x="225" y="79" width="18" height="27" rx="2" />
            <rect x="255" y="57" width="18" height="49" rx="2" />
            <rect x="284" y="33" width="18" height="73" rx="2" />
          </g>
          <g fill="#a4cfff" opacity=".2">
            <rect x="225" y="108" width="18" height="13" rx="2" />
            <rect x="255" y="108" width="18" height="10" rx="2" />
            <rect x="284" y="108" width="18" height="6" rx="2" />
          </g>
          <path d="M211 107H303" stroke="#fff" strokeWidth="2" />
          <path d="M205 88 217 100 232 96 247 105 269 100" fill="none" stroke="#bfc5ff" />
          <circle cx="217" cy="100" r="3" fill="#aaa6ff" />
          <ellipse cx="123" cy="35" rx="48" ry="28" fill="#fff4ba" opacity=".45" />
        </>
      )}
      {!small && (
        <>
          <path d="M127 35Q127 5 145 14Q163 22 171 99L157 104" fill="none" stroke="#073cce" strokeWidth="9" />
          <path d="M130 34Q129 9 143 17Q158 26 164 99" fill="none" stroke="#53aaff" strokeWidth="3" />
          <path d="M128 32Q151 26 160 54L165 106Q164 117 149 121L131 115Z" fill="#0735c7" stroke="#165de7" strokeWidth="2" />
          <path d="M154 84L165 81V106L154 111Z" fill="#0751ee" stroke="#2d8aff" />
        </>
      )}
      <g transform={small ? 'translate(7 0)' : undefined}>
        <path d="M100 32V24Q100 12 113 12Q126 12 126 28V31" fill="none" stroke="#0753d3" strokeWidth="6" />
        <path d="M104 29V25Q104 17 113 17Q122 17 122 29" fill="none" stroke="#54baff" strokeWidth="2" />
        <path
          d="M76 101L80 58Q82 31 109 31Q137 29 147 54L154 103Q157 119 139 121L93 120Q74 120 76 101Z"
          fill={`url(#${id})`}
          stroke="#0757e2"
          strokeWidth="2"
        />
        <path d="M84 54Q84 34 107 33Q131 31 140 52L139 64Q110 70 84 62Z" fill={`url(#${id}p)`} stroke="#64baff" strokeWidth="1.5" />
        <path d="M91 49Q112 42 132 51" fill="none" stroke="#a4dcff" strokeWidth="2" strokeLinecap="round" />
        <path d="M85 81Q86 72 96 72H129Q139 72 141 83L144 106Q144 114 134 115L95 114Q84 114 84 104Z" fill={`url(#${id}p)`} stroke="#3594ff" strokeWidth="2" />
        <path d="M91 86Q110 88 135 86" fill="none" stroke="#85c7ff" strokeWidth="2" />
        <path d="M99 87V93" stroke="#c7edff" strokeWidth="3" strokeLinecap="round" />
        <path d="M86 65L81 99M148 79L151 103" stroke="#56adff" strokeWidth="1.5" opacity=".7" />
        <path d="M126 113H132" stroke="#61a6ff" strokeWidth="2" strokeLinecap="round" />
      </g>
    </svg>
  )
}
const status = (node: FifoNode, state: BestState) =>
  node.id === state.best.node
    ? 'Solution'
    : node.status === 'queued'
      ? fifoDominated(node, state.best.profit)
        ? 'Pending prune'
        : 'Live'
      : node.status === 'expanded'
        ? 'Expanded'
        : node.status === 'pruned'
          ? 'Pruned'
          : 'Terminal'
function Tree({ state, selected, onSelect, bounds }: { state: BestState; selected: number; onSelect: (id: number) => void; bounds: boolean }) {
  const id = useId(),
    path = new Set<number>()
  let ancestor: FifoNode | undefined = state.nodes[selected]
  while (ancestor) {
    path.add(ancestor.id)
    ancestor = ancestor.parent === undefined ? undefined : state.nodes[ancestor.parent]
  }
  const visible = state.nodes.filter((n) => n.level <= 3 || path.has(n.id) || n.parent === selected),
    children = new Map<number, FifoNode[]>()
  for (const node of visible) if (node.parent !== undefined) children.set(node.parent, [...(children.get(node.parent) ?? []), node])
  const leaves = visible.filter((n) => !children.has(n.id)),
    width = Math.max(620, leaves.length * 128),
    maxDepth = Math.max(3, ...visible.map((n) => n.level)),
    height = 218 + Math.max(0, maxDepth - 3) * 57
  const points = new Map<number, { x: number; y: number }>()
  let next = 0
  function layout(n: FifoNode): number {
    const c = children.get(n.id) ?? [],
      x = c.length ? c.reduce((sum, k) => sum + layout(k), 0) / c.length : ((++next - 0.5) * width) / leaves.length
    points.set(n.id, { x, y: 4 + n.level * 53 })
    return x
  }
  layout(visible[0])
  return (
    <div className="bk-tree-scroll">
      <svg className="bk-tree" viewBox={`0 0 ${width} ${height}`} style={{ width, height }} aria-label={tr('Best-first knapsack search tree')}>
        <defs>
          <marker id={id} viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6" markerHeight="6" orient="auto">
            <path d="M0 0 8 4 0 8Z" fill="#2d4380" />
          </marker>
          <linearGradient id={`${id}b`} x2="0" y2="1">
            <stop stopColor="#effaff" />
            <stop offset="1" stopColor="#dcedff" />
          </linearGradient>
        </defs>
        {visible.map((n) => {
          const p = n.parent === undefined ? undefined : points.get(n.parent),
            point = points.get(n.id)!
          return (
            p && (
              <g key={`e${n.id}`}>
                <path d={`M${p.x} ${p.y + 34}L${point.x} ${point.y - 2}`} stroke="#5679b5" fill="none" markerEnd={`url(#${id})`} />
                <text x={(point.x + p.x) / 2} y={(point.y + p.y) / 2 + 21} fontSize="10" textAnchor="middle" fill="#45608f">
                  {tr(`${n.take ? 'Include' : 'Exclude'} ${state.items[n.level - 1].id}`)}
                </text>
              </g>
            )
          )
        })}
        {visible.map((n) => {
          const p = points.get(n.id)!,
            s = status(n, state),
            fill = s === 'Solution' ? '#ddf8e9' : s === 'Pruned' ? '#edf0f7' : s === 'Expanded' ? '#fff3df' : `url(#${id}b)`
          return (
            <g
              key={n.id}
              role="button"
              tabIndex={0}
              aria-label={tr(`Inspect best-first node ${n.id}: weight ${n.weight}, profit ${n.profit}, bound ${formatFifoBound(n.bound)}`)}
              aria-pressed={n.id === selected}
              onClick={() => onSelect(n.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  onSelect(n.id)
                }
              }}
            >
              <rect
                x={p.x - 58}
                y={p.y}
                width="116"
                height="35"
                rx="6"
                fill={fill}
                stroke={s === 'Solution' ? '#09b568' : s === 'Pruned' ? '#a1abc1' : s === 'Expanded' ? '#efa31b' : '#368dff'}
                strokeWidth={n.id === selected ? 2 : 1}
              />
              <text x={p.x} y={p.y + 14} textAnchor="middle" fill="#10295d" fontSize="11">{`(${n.id}) w=${n.weight}, p=${n.profit}`}</text>
              {bounds && (
                <text x={p.x} y={p.y + 28} textAnchor="middle" fill="#10295d" fontSize="11">
                  {n.bound ? `b=${formatFifoBound(n.bound)}` : tr('Infeasible')}
                  {s === 'Solution' ? ' ✓' : s === 'Pruned' ? ' ×' : ''}
                </text>
              )}
            </g>
          )
        })}
      </svg>
      {visible.length < state.nodes.length && (
        <p className="bk-tree-caption">{tr(`Showing ${visible.length} of ${state.nodes.length} generated nodes; use Experiments to inspect every node.`)}</p>
      )}
    </div>
  )
}
const code = `items ← sort by decreasing profit / weight; preserve original IDs
best ← empty feasible subset (profit 0)
frontier ← {root}, ordered by largest exact fractional upper bound
while frontier is not empty:
    u ← extract_max_bound(frontier)  // ties: smaller insertion ID
    if bound(u) ≤ best.profit: prune u; continue
    for child in [include next item, exclude next item]:
        if child.weight > capacity: prune child; continue
        if child.profit > best.profit: best ← child.chosen
        if bound(child) > best.profit: insert child into frontier
        else: retire child (keep a best feasible witness)
return best

bound(u): keep all earlier decisions fixed
    fill remaining capacity by decreasing profit / weight
    allow a fraction only for the final remaining item
    return fixed profit + fractional remaining profit
Compare rational bounds exactly; rounded labels never decide pruning.`

export function BestFirstKnapsackMockupLesson(props: MockupPageProps) {
  useLocaleRender()
  const [tab, setTab] = useState<MockupTab>('Learn'),
    [state, setState] = useState(defaultBest),
    [selected, setSelected] = useState(0),
    [showBounds, setShowBounds] = useState(true),
    [playing, setPlaying] = useState(false),
    [speed, setSpeed] = useState(800),
    [budget, setBudget] = useState(4095),
    [nodePage, setNodePage] = useState(0)
  const [modal, setModal] = useState<'input' | 'stage' | null>(null),
    [stage, setStage] = useState(0),
    dialog = useRef<HTMLDialogElement>(null)
  const [weights, setWeights] = useState('2, 3, 4, 5'),
    [profits, setProfits] = useState('6, 5, 8, 6'),
    [capacity, setCapacity] = useState('5'),
    [error, setError] = useState('')
  const [guess, setGuess] = useState(''),
    [feedback, setFeedback] = useState(''),
    [choice, setChoice] = useState(''),
    [prune, setPrune] = useState('')
  const [notes, setNotes] = usePersistentState('algodrishti-best-first-knapsack-notes', '', persistentString)
  const certified = bestCertified(state),
    node = state.nodes[selected] ?? state.nodes[0],
    rootBound = state.nodes[0].bound?.value ?? 0
  useEffect(() => {
    if (modal) dialog.current?.showModal()
    else dialog.current?.close()
  }, [modal])
  useEffect(() => {
    if (!playing || state.complete || state.paused) return
    const timer = window.setTimeout(() => setState((p) => advanceBest(p, budget)), speed)
    return () => window.clearTimeout(timer)
  }, [playing, state, speed, budget])
  function step() {
    setPlaying(false)
    setState((p) => advanceBest(p, budget))
  }
  function reset() {
    setPlaying(false)
    setState(createBest(state.input))
    setSelected(0)
    setNodePage(0)
  }
  function restore() {
    setPlaying(false)
    setState(defaultBest())
    setSelected(0)
    setNodePage(0)
  }
  function edit() {
    setPlaying(false)
    setWeights(state.input.weights.join(', '))
    setProfits(state.input.profits.join(', '))
    setCapacity(String(state.input.capacity))
    setError('')
    setModal('input')
  }
  function apply() {
    try {
      const input = parseFifoInput(weights, profits, capacity)
      setState(createBest(input))
      setPlaying(false)
      setSelected(0)
      setNodePage(0)
      setError('')
      setModal(null)
    } catch (e) {
      setError((e as Error).message)
    }
  }
  const toolbar = (
    <div className="bk-toolbar">
      <button className="bk-primary" onClick={step} disabled={state.complete}>
        {tr('Next Step')}
      </button>
      <button onClick={() => setPlaying(!playing)} disabled={state.complete || state.paused}>
        {playing && !state.complete ? <Pause size={16} /> : <Play size={16} />} {tr(playing && !state.complete ? 'Pause' : 'Auto Play')}
      </button>
      <button onClick={reset}>
        <RotateCcw size={16} />
        {tr('Reset')}
      </button>
      <label>
        {tr('Speed')}
        <input
          aria-label={tr('Best-first playback delay')}
          type="range"
          min="100"
          max="1600"
          step="100"
          value={speed}
          onChange={(e) => setSpeed(Number(e.target.value))}
        />
      </label>
    </div>
  )
  const overview = (
    <Panel title={tr('Algorithm Overview')} icon={<Layers3 />} className="bk-overview">
      <p>
        <b>{tr('Best-First Branch and Bound')}</b>
        {tr(' explores the most promising node first, using a fractional-knapsack upper bound to prune subtrees.')}
      </p>
      <div className="bk-stages">
        {stages.map(([label, description], i) => {
          const Icon = stageIcons[i]
          return (
            <button
              key={label}
              className={`bk-stage bk-stage-${i}`}
              aria-label={tr(`Explore ${label} principle`)}
              onClick={() => {
                setStage(i)
                setModal('stage')
              }}
            >
              <span>
                <Icon />
              </span>
              <b>{tr(label)}</b>
              <p>{tr(description)}</p>
            </button>
          )
        })}
      </div>
    </Panel>
  )
  const instance = (
    <Panel
      title={tr('Problem Instance')}
      icon={<InstanceIcon />}
      className="bk-instance"
      action={
        <button className="bk-edit" onClick={edit}>
          <Pencil size={13} />
          {tr('Edit')}
        </button>
      }
    >
      <table>
        <thead>
          <tr>
            {['Item (i)', 'Weight wᵢ', 'Profit pᵢ', 'Ratio pᵢ/wᵢ'].map((t) => (
              <th key={t}>{tr(t)}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {state.input.weights.map((w, i) => (
            <tr key={i}>
              <td>{i + 1}</td>
              <td>{w}</td>
              <td>{state.input.profits[i]}</td>
              <td>{(state.input.profits[i] / w).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <button className="bk-capacity" aria-label={tr('Edit knapsack capacity and items')} onClick={edit}>
        <b>{tr('Knapsack capacity (W)')}</b>
        <output>{state.input.capacity}</output>
      </button>
    </Panel>
  )
  const incumbent = (
    <Panel title={tr('Current Best Solution (Incumbent)')} icon={<Trophy />} className="bk-incumbent">
      <div className="bk-solution-stats">
        <div>
          <span>{tr('Total profit')}</span>
          <output>{state.best.profit}</output>
        </div>
        <div>
          <span>{tr('Total weight')}</span>
          <b>
            {state.best.weight} / {state.input.capacity}
          </b>
        </div>
        <div>
          <span>{tr('Items taken')}</span>
          <b>[{state.best.chosen.join(', ')}]</b>
        </div>
      </div>
      <p className="bk-incumbent-tip">
        <CheckCircle2 />
        {tr(`This is the best feasible solution found so far. Nodes with bound ≤ ${state.best.profit} will be pruned.`)}
      </p>
    </Panel>
  )
  const tree = (
    <Panel
      title={tr('Search Tree Explorer')}
      icon={<Network />}
      className="bk-tree-panel"
      action={
        <div className="bk-tree-options">
          <div className="bk-legend">
            {['Live node', 'Expanded', 'Pruned', 'Solution'].map((s, i) => (
              <span key={s}>
                <i className={`bk-dot-${i}`} />
                {tr(s)}
              </span>
            ))}
          </div>
          <label className="bk-bound-switch">
            <input type="checkbox" aria-label={tr('Show tree bounds')} checked={showBounds} onChange={(e) => setShowBounds(e.target.checked)} />
            <span />
            {tr('Show bounds')}
          </label>
        </div>
      }
    >
      <Tree state={state} selected={node.id} onSelect={setSelected} bounds={showBounds} />
    </Panel>
  )
  const retired = state.nodes.filter((n) => n.status === 'pruned').slice(-4),
    frontierRows = [...state.frontier.map((id) => state.nodes[id]), ...retired].slice(0, 5)
  const frontier = (
    <Panel
      title={tr('Priority Frontier (Best-First Order)')}
      icon={<ListOrdered />}
      className="bk-frontier"
      action={
        <span className="bk-frontier-count">
          <b>{state.frontier.length}</b>
          {tr('nodes')}
        </span>
      }
    >
      <div className="bk-table-scroll">
        <table>
          <thead>
            <tr>
              {['#', 'Node (level, w, p)', 'Bound', 'Status', 'Action'].map((t) => (
                <th key={t}>{tr(t)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {frontierRows.map((n, i) => (
              <tr key={n.id}>
                <td>{i + 1}</td>
                <td>
                  <button
                    className="bk-inspect-node"
                    aria-label={tr(`Inspect frontier node ${n.id}`)}
                    onClick={() => setSelected(n.id)}
                  >{`(${n.level}, ${n.weight}, ${n.profit})`}</button>
                </td>
                <td className="bk-bound-value">{formatFifoBound(n.bound)}</td>
                <td>
                  <span className={`bk-node-status ${n.status === 'pruned' ? 'bk-pruned' : ''}`}>{tr(status(n, state))}</span>
                </td>
                <td>
                  {n.status === 'queued' ? (
                    <button
                      className="bk-process"
                      disabled={state.frontier[0] !== n.id}
                      title={tr('Only the highest-bound frontier node can be processed next.')}
                      onClick={step}
                    >
                      {tr(fifoDominated(n, state.best.profit) ? 'Prune' : 'Expand')}
                    </button>
                  ) : (
                    '—'
                  )}
                </td>
              </tr>
            ))}
            {!frontierRows.length && (
              <tr>
                <td colSpan={5}>{tr(state.complete ? 'Frontier empty. Optimal solution proved.' : 'Root is ready.')}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="bk-frontier-note">{tr('Pruned rows are history; only queued nodes belong to the frontier.')}</p>
    </Panel>
  )
  const upperBound = (
    <Panel title={tr('Fractional Knapsack Upper Bound')} icon={<BarChart3 />} className="bk-upper-bound">
      <p>{tr('Compute an upper bound using fractional remaining items, sorted by value/weight. Earlier decisions stay fixed.')}</p>
      <div className="bk-table-scroll">
        <table>
          <thead>
            <tr>
              {['Item', 'wᵢ', 'pᵢ', 'Ratio', 'Take'].map((t) => (
                <th key={t}>{tr(t)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {state.items.map((item, index) => {
              const fill = node.bound?.fills.find((f) => f.item === item.id),
                fixed = index < node.level,
                take = fixed
                  ? node.chosen.includes(item.id)
                    ? 'Fixed: taken'
                    : 'Fixed: skipped'
                  : fill
                    ? fill.numerator === fill.denominator
                      ? '1 (full)'
                      : `${fill.numerator}/${fill.denominator} (fraction)`
                    : '0 (no capacity)'
              return (
                <tr key={item.id}>
                  <td>{item.id}</td>
                  <td>{item.weight}</td>
                  <td>{item.profit}</td>
                  <td>{(item.profit / item.weight).toFixed(2)}</td>
                  <td>
                    <span className={fill ? 'bk-fill-taken' : 'bk-fill-empty'}>{tr(take)}</span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <div className="bk-bound-result">
        {node.bound ? (
          <>
            <b>
              {tr('Upper bound = ')}
              {node.profit > 0 ? node.profit : null}
              {node.bound.fills.map((f, i) => (
                <span key={i}>
                  {node.profit > 0 || i > 0 ? ' + ' : ''}
                  {f.numerator === f.denominator ? f.profit : `(${f.numerator}/${f.denominator}) × ${f.profit}`}
                </span>
              ))}
              {node.profit === 0 && node.bound.fills.length === 0 ? '0' : ''}
              {' = '}
              {formatFifoBound(node.bound)}
            </b>
            <span>{tr(`(for node ${node.id}, remaining capacity ${state.input.capacity - node.weight})`)}</span>
          </>
        ) : (
          <b>{tr('Infeasible: weight exceeds capacity')}</b>
        )}
      </div>
    </Panel>
  )
  const worked = (
    <Panel title={tr('Worked Example: Tracing the Best-First Search')} icon={<FileText />} className="bk-worked">
      <p>{tr(`For capacity ${state.input.capacity}, explore nodes by decreasing exact upper bound.`)}</p>
      <div className="bk-table-scroll">
        <table>
          <thead>
            <tr>
              {['Step', 'Operation', 'Node (w, p)', 'Bound', 'Frontier after operation', 'Note'].map((t) => (
                <th key={t}>{tr(t)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {state.history.slice(-5).map((event) => (
              <tr key={event.step} className={event.incumbent === state.best.profit && event.step > 0 ? 'bk-history-best' : ''}>
                <td>{event.step}</td>
                <td>{tr(event.action)}</td>
                <td>{`(${event.weight}, ${event.profit})`}</td>
                <td>{event.bound}</td>
                <td>{`[${event.frontier.join(', ')}]`}</td>
                <td>{tr(event.note)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  )
  const progress = (
    <Panel title={tr('Capacity and Profit Progress')} icon={<Target />} className="bk-progress">
      <div className="bk-progress-line">
        <span>{tr('Knapsack capacity')}</span>
        <div>
          <progress aria-label={tr('Capacity used')} max={Math.max(1, state.input.capacity)} value={state.best.weight} />
          <b>
            {state.best.weight} / {state.input.capacity}
          </b>
        </div>
      </div>
      <div className="bk-progress-line bk-profit-line">
        <span>{tr('Current best profit')}</span>
        <div>
          <progress aria-label={tr('Profit versus root upper bound')} max={Math.max(1, rootBound)} value={state.best.profit} />
          <b>
            {state.best.profit} / {formatFifoBound(state.nodes[0].bound)}
          </b>
        </div>
        <small>{tr(certified ? `Optimal profit for this instance: ${state.best.profit}` : 'Optimal profit for this instance: not yet certified')}</small>
      </div>
      <div className="bk-search-stats">
        {[
          ['Total nodes', state.nodes.length],
          ['Expanded', state.expanded],
          ['Pruned', state.pruned],
          ['Solution', 1],
        ].map(([label, value]) => (
          <div key={label}>
            <b>{value}</b>
            <span>{tr(String(label))}</span>
          </div>
        ))}
      </div>
    </Panel>
  )
  const takeaways = (
    <Panel title={tr('Key Takeaways')} icon={<Lightbulb />} className="bk-takeaways">
      <ul>
        {[
          'Use fractional knapsack to compute an upper bound.',
          'Expand the node with the highest bound (best-first).',
          'Prune nodes with bound ≤ incumbent.',
          'Returns an optimal integral solution after certification.',
        ].map((s) => (
          <li key={s}>
            <CheckCircle2 />
            {tr(s)}
          </li>
        ))}
      </ul>
    </Panel>
  )
  const correctness = (
    <Panel title={tr('Complexity and Correctness')} icon={<BarChart3 />} className="bk-correctness">
      <p>
        <b>{tr('Time:')}</b>
        {tr(' O(n · 2ⁿ) with a heap. ')}
        <b>{tr('Space:')}</b>
        {tr(' O(n · 2ⁿ) with decisions.')}
        <br />
        <b>{tr('Correctness:')}</b>
        {tr(' Fractional relaxation is an upper bound; safe pruning cannot remove a better solution.')}
      </p>
    </Panel>
  )
  return (
    <div className="mom-page target-visual best-knapsack-page" data-target="20">
      <MockupLessonChrome
        {...props}
        showLanguage={false}
        title={tr('0/1 Knapsack: Best-First Branch and Bound')}
        description={tr('Use a fractional-knapsack upper bound to prune the search tree and explore the most promising node first.')}
        concepts={5}
        heroIcon={<Bag small />}
        decoration={<Bag />}
        badges={
          <>
            <span>
              <Clock3 />
              {tr('15–20 min')}
            </span>
            <span>
              <DifficultyIcon />
              {tr('Intermediate')}
            </span>
            <span>
              <BrainCog />
              {tr('5 key concepts')}
            </span>
          </>
        }
        onStart={() => {
          reset()
          setTab('Visualization')
        }}
      />
      <MockupTabs
        iconOverrides={{ Practice: <Code2 />, Experiments: <FileText /> }}
        active={tab}
        onChange={(next) => {
          setPlaying(false)
          setTab(next)
        }}
        tabs={tabs}
      />
      {tab === 'Learn' ? (
        <>
          <div className="bk-top-grid">
            {overview}
            {instance}
            {incumbent}
          </div>
          <div className="bk-middle-grid">
            {tree}
            {frontier}
            {upperBound}
          </div>
          <div className="bk-bottom-grid">
            {worked}
            {progress}
            <aside>
              {takeaways}
              {correctness}
            </aside>
          </div>
        </>
      ) : tab === 'Visualization' ? (
        <div className="bk-studio">
          <Panel
            title={tr('Best-First Search Laboratory')}
            icon={<ListOrdered />}
            action={
              <button onClick={edit}>
                <Pencil size={14} />
                {tr('Edit input')}
              </button>
            }
          >
            <p>
              {tr(
                'Process the largest bound first. Feasible children update the incumbent on generation. Existing live nodes are checked against the latest incumbent when removed.',
              )}
            </p>
            {toolbar}
            <p className="bk-live-message" role="status">
              {tr(state.message)}
            </p>
            <p className="bk-certificate">
              {tr(
                certified
                  ? `Optimal profit ${state.best.profit} is proved: no remaining frontier bound exceeds the incumbent.`
                  : 'The incumbent is feasible. Optimality is not yet proved.',
              )}
            </p>
          </Panel>
          <div className="bk-lab-grid">
            {tree}
            {frontier}
            {upperBound}
          </div>
          <div className="bk-lab-summary">
            {incumbent}
            {progress}
            <Panel title={tr('Selected Node Details')} icon={<ClipboardList />}>
              <dl>
                <dt>{tr('Node')}</dt>
                <dd>{node.id}</dd>
                <dt>{tr('Level / weight / profit')}</dt>
                <dd>
                  {node.level} / {node.weight} / {node.profit}
                </dd>
                <dt>{tr('Bound')}</dt>
                <dd>{formatFifoBound(node.bound)}</dd>
                <dt>{tr('Status')}</dt>
                <dd>{tr(status(node, state))}</dd>
                <dt>{tr('Chosen original IDs')}</dt>
                <dd>{`{${node.chosen.join(', ')}}`}</dd>
              </dl>
              <p>{tr(node.reason)}</p>
            </Panel>
          </div>
          {worked}
        </div>
      ) : tab === 'Code' ? (
        <Panel title={tr('Best-First Branch and Bound — Pseudocode')} icon={<Code2 />} className="bk-code">
          <p>
            {tr(
              'A priority queue chooses the next subproblem; the fractional solution supplies only an optimistic bound. The incumbent always comes from a feasible integral subset.',
            )}
          </p>
          <pre>
            <code>{code}</code>
          </pre>
          <h3>{tr('Tie-breaking and exact comparisons')}</h3>
          <p>
            {tr(
              'Compare rational bounds by cross multiplication. Equal bounds use smaller insertion IDs first. Decimal labels are rounded for readability and never drive queue ordering or pruning.',
            )}
          </p>
          <h3>{tr('Proof of optimality')}</h3>
          <p>
            {tr(
              'The two child decisions cover every completion. A fractional relaxation includes every integral completion. Every discarded branch is either infeasible or bounded above by a known feasible incumbent. When no frontier bound can beat that incumbent, the optimum is certified.',
            )}
          </p>
          <h3>{tr('Complexity of this teaching view')}</h3>
          <p>
            {tr(
              'A heap-based search can use O(n · 2ⁿ) worst-case time with O(n) bound scans and logarithmic queue operations. This browser model retains decisions and copies/sorts frontier snapshots for inspection; rendering and snapshot overhead are additional costs. A node budget pauses a run without declaring it complete.',
            )}
          </p>
        </Panel>
      ) : tab === 'Practice' ? (
        <div className="bk-practice">
          <Panel title={tr('Predict the Root Upper Bound')} icon={<BarChart3 />}>
            <p>
              {tr(
                'Example: capacity 5, weights [2, 3, 4, 5], profits [6, 5, 8, 6]. Sort by density: items 1, 3, 2, 4. Take item 1 and fill the remaining 3 units with a fraction of item 3. What is the bound?',
              )}
            </p>
            <label>
              {tr('Your bound')}
              <input aria-label={tr('Predicted best-first root bound')} value={guess} onChange={(e) => setGuess(e.target.value)} />
            </label>
            <button
              className="bk-primary"
              onClick={() =>
                setFeedback(
                  guess.trim() && Number(guess) === 12
                    ? 'Correct: 6 + (3/4) × 8 = 12. The best integral solution is 11, so the fractional bound is optimistic.'
                    : 'Try again: remaining capacity is 3; item 3 has weight 4 and profit 8. Add 6 + (3/4) × 8.',
                )
              }
            >
              {tr('Check bound')}
            </button>
            {feedback && <p role="status">{tr(feedback)}</p>}
          </Panel>
          <Panel title={tr('Which Node Is Next?')} icon={<ListOrdered />}>
            <p>{tr('After expanding the root and its include-item-1 child, node 2 has bound 29/3 ≈ 9.667 and node 4 has bound 11. Choose the next node.')}</p>
            <button onClick={() => setChoice('Reconsider: best-first chooses the highest bound, even if a lower-bound node was inserted earlier.')}>
              {tr('Node 2: oldest')}
            </button>
            <button onClick={() => setChoice('Correct: node 4 has bound 11 > 29/3. FIFO would remove the older node 2 first.')}>
              {tr('Node 4: highest bound')}
            </button>
            {choice && <p role="status">{tr(choice)}</p>}
          </Panel>
          <Panel title={tr('Pruning Challenge')} icon={<Scissors />}>
            <p>{tr('The incumbent is 11. A remaining node has bound 9.6. Should it be expanded?')}</p>
            <button onClick={() => setPrune('Correct: prune it. No completion can beat 9.6, so none improves the feasible profit of 11.')}>
              {tr('Prune')}
            </button>
            <button onClick={() => setPrune('Try again: upper bound 9.6 ≤ incumbent 11. Expanding this branch cannot improve the solution.')}>
              {tr('Expand')}
            </button>
            {prune && <p role="status">{tr(prune)}</p>}
          </Panel>
          <Panel title={tr('Trace the Worked Example')} icon={<BookOpen />}>
            <p>
              {tr(
                'The default run has generated 7 nodes, expanded 3, and found items {1, 2} with total weight 5 and profit 11. The last pending frontier node can be pruned.',
              )}
            </p>
            <button
              onClick={() => {
                restore()
                setTab('Visualization')
              }}
            >
              {tr('Load worked trace')}
            </button>
          </Panel>
        </div>
      ) : (
        <div className="bk-experiments">
          <LanguageSelector />
          <Panel title={tr('Experiment Controls')} icon={<TrendingUp />}>
            <p>
              {tr(
                'Edit up to 20 items, try zero capacity, and inspect the exact priority order. Original IDs remain tied to input positions after density sorting. A paused search is not a completed search.',
              )}
            </p>
            <div className="bk-experiment-controls">
              <button onClick={edit}>{tr('Edit input')}</button>
              <button onClick={restore}>{tr('Restore worked example')}</button>
              <button
                onClick={() => {
                  setPlaying(false)
                  setState(createBest({ ...state.input, capacity: 0 }))
                  setSelected(0)
                  setNodePage(0)
                }}
              >
                {tr('Try zero capacity')}
              </button>
              <label>
                {tr('Node budget')}
                <select aria-label={tr('Best-first node budget')} value={budget} onChange={(e) => setBudget(Number(e.target.value))}>
                  <option value={4095}>4095</option>
                  <option value={16383}>16383</option>
                  <option value={65535}>65535</option>
                </select>
              </label>
            </div>
            {toolbar}
            <p className="bk-live-message" role="status">
              {tr(state.message)}
            </p>
            <p>{tr(certified ? `Optimal profit ${state.best.profit} certified.` : 'Optimality remains unproved.')}</p>
          </Panel>
          <Panel title={tr('All Generated Nodes')} icon={<GitFork />}>
            <p>{tr('Select any row to inspect that node and its ancestor path. Priority frontier order is separate from generation order.')}</p>
            <div className="bk-table-scroll">
              <table>
                <thead>
                  <tr>
                    {['ID', 'Parent', 'Level', 'Weight', 'Profit', 'Upper Bound', 'Status'].map((t) => (
                      <th key={t}>{tr(t)}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {state.nodes.slice(nodePage * 25, nodePage * 25 + 25).map((n) => (
                    <tr key={n.id}>
                      <td>
                        <button
                          aria-label={tr(`Inspect generated best-first node ${n.id}`)}
                          onClick={() => {
                            setSelected(n.id)
                            setTab('Visualization')
                          }}
                        >
                          {n.id}
                        </button>
                      </td>
                      <td>{n.parent ?? '—'}</td>
                      <td>{n.level}</td>
                      <td>{n.weight}</td>
                      <td>{n.profit}</td>
                      <td>{formatFifoBound(n.bound)}</td>
                      <td>{tr(status(n, state))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="bk-pagination">
              <button disabled={nodePage === 0} onClick={() => setNodePage(nodePage - 1)}>
                {tr('Previous nodes')}
              </button>
              <span>
                {nodePage + 1}/{Math.ceil(state.nodes.length / 25)}
              </span>
              <button disabled={(nodePage + 1) * 25 >= state.nodes.length} onClick={() => setNodePage(nodePage + 1)}>
                {tr('Next nodes')}
              </button>
            </div>
          </Panel>
          <Panel title={tr('Learning Notes')} icon={<BookOpen />}>
            <label>
              {tr('Explain why best-first ordering and a valid bound are different ideas.')}
              <textarea aria-label={tr('Best-first knapsack notes')} rows={5} value={notes} onChange={(e) => setNotes(e.target.value)} />
            </label>
            <p>{tr('Saved automatically in this browser.')}</p>
          </Panel>
        </div>
      )}
      <dialog
        ref={dialog}
        className="bk-dialog"
        aria-label={tr(modal === 'input' ? 'Edit best-first knapsack input' : 'Best-first principle explanation')}
        onCancel={() => setModal(null)}
        onClose={() => setModal(null)}
      >
        <button className="bk-close" aria-label={tr('Close best-first dialog')} onClick={() => setModal(null)}>
          <X />
        </button>
        {modal === 'input' ? (
          <>
            <h2>{tr('Edit best-first knapsack input')}</h2>
            <p>{tr('1–20 items. Weights 1–100; profits 0–100; capacity 0–200. Integers only. Enter matching lists; IDs follow original positions.')}</p>
            <label>
              {tr('Weights')}
              <input aria-label={tr('Best-first item weights')} value={weights} onChange={(e) => setWeights(e.target.value)} />
            </label>
            <label>
              {tr('Profits')}
              <input aria-label={tr('Best-first item profits')} value={profits} onChange={(e) => setProfits(e.target.value)} />
            </label>
            <label>
              {tr('Capacity')}
              <input aria-label={tr('Best-first capacity')} type="number" min="0" max="200" value={capacity} onChange={(e) => setCapacity(e.target.value)} />
            </label>
            {error && <p role="alert">{tr(error)}</p>}
            <button className="bk-primary" onClick={apply}>
              {tr('Apply input')}
            </button>
          </>
        ) : (
          <>
            <h2>{tr(stages[stage][0])}</h2>
            <p>{tr(stages[stage][2])}</p>
            <p>{tr('For the default instance, density order is 1, 3, 2, 4; root bound is 12. The optimal integral subset is {1, 2}, weight 5, profit 11.')}</p>
            <button
              onClick={() => {
                setModal(null)
                setTab(stage === 1 ? 'Code' : 'Visualization')
              }}
            >
              {tr(stage === 1 ? 'Read bound proof' : 'Explore the search')}
            </button>
          </>
        )}
      </dialog>
    </div>
  )
}
