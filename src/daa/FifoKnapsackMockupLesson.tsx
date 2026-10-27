// @localized-render
import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import {
  ArrowLeft,
  BarChart3,
  BookOpen,
  Calculator,
  CheckCircle2,
  CircleHelp,
  ClipboardList,
  Clock3,
  Code2,
  Database,
  FastForward,
  FlaskConical,
  Info,
  Lightbulb,
  ListOrdered,
  Pause,
  Play,
  RotateCcw,
  Settings,
  ShieldCheck,
  Trophy,
  WandSparkles,
  X,
} from 'lucide-react'
import { tx, useLocaleRender } from '../i18n/render'
import { LanguageSelector } from '../i18n/LanguageSelector'
import { usePersistentState, persistentString } from '../hooks/usePersistentState'
import { MockupLessonChrome, MockupTabs, type MockupPageProps, type MockupTab } from './MockupLessonChrome'
import {
  advanceFifo,
  createFifo,
  defaultFifo,
  fifoCertified,
  fifoDominated,
  fifoExample,
  formatFifoBound,
  parseFifoInput,
  type FifoNode,
  type FifoState,
} from './fifoKnapsackModel'
import './fifo-knapsack-mockup.css'

const tr = (s: string) => tx(s, 'studios')
const sections: MockupTab[] = ['Learn', 'Visualization', 'Code', 'Practice', 'Experiments']
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
    <section className={`mom-panel fk-panel ${className}`}>
      <header>
        <span className="fk-icon">{icon}</span>
        <h2>{tr(title)}</h2>
        {action}
      </header>
      {children}
    </section>
  )
}
function QueueIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="#eef7ff" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      {[3, 10, 17].map((y) => (
        <rect key={y} x="3" y={y} width="18" height="4" rx="1.2" />
      ))}
      <path d="M6 7V10M18 7V10M6 14V17M18 14V17" />
    </svg>
  )
}
function BackpackArt() {
  const id = useId()
  return (
    <svg className="fk-hero-art" viewBox="0 0 300 120" aria-hidden="true">
      <defs>
        <linearGradient id={id} x2=".8" y2="1">
          <stop stopColor="#77baff" />
          <stop offset=".5" stopColor="#6857ff" />
          <stop offset="1" stopColor="#4022d4" />
        </linearGradient>
        <linearGradient id={`${id}p`} x2=".8" y2="1">
          <stop stopColor="#a5b2ff" />
          <stop offset="1" stopColor="#6853ff" />
        </linearGradient>
      </defs>
      {[
        [10, 66],
        [31, 24],
        [52, 69],
      ].map(([x, y]) => (
        <g key={x} opacity=".65" transform={`translate(${x} ${y})`}>
          <path d="M0 8 22-3 44 8 22 20Z" fill="#9ce1ff" />
          <path d="M0 8 22 20V51L0 38Z" fill="#78cafa" />
          <path d="M22 20 44 8V38L22 51Z" fill="#b0e6ff" />
        </g>
      ))}
      <path d="M110 27Q110 12 127 12Q144 12 144 29" stroke="#6551ff" strokeWidth="5" fill="none" />
      <path d="M99 29Q88 21 84 47L80 93Q78 111 94 116" fill="none" stroke="#4f42e9" strokeWidth="9" />
      <path d="M85 107Q75 69 91 30Q103 15 128 18Q153 18 160 44L168 101Q165 117 151 118L101 117Z" fill={`url(#${id})`} stroke="#7367ff" strokeWidth="2" />
      <path d="M91 33Q76 59 82 100Q83 115 100 117L107 40Z" fill="#4434e4" />
      <path d="M110 41Q126 34 143 40" fill="none" stroke="#c4caff" strokeWidth="2" opacity=".6" />
      <circle cx="128" cy="45" r="2" fill="#a7b1ff" />
      <rect x="103" y="60" width="57" height="49" rx="10" fill={`url(#${id}p)`} stroke="#8686ff" />
      <path d="M108 74H155" stroke="#aca7ff" strokeWidth="3" />
      <path d="M116 75V84" stroke="#e1e2ff" strokeWidth="3" strokeLinecap="round" />
      <path d="M108 104H153" stroke="#8e89ff" strokeWidth="1.5" />
      <g transform="translate(10 6)" fill="none" stroke="#978cff" strokeWidth="2.6" opacity=".7">
        <path d="M235 29 210 51 188 88M210 51 223 78M235 29 261 51 275 87M261 51 250 78" />
        {[
          [235, 29],
          [210, 51],
          [188, 88],
          [223, 78],
          [261, 51],
          [275, 87],
          [250, 78],
        ].map(([x, y]) => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r="4" fill="#e7e5ff" />
        ))}
        <g stroke="#b7b4ff" strokeWidth="2" opacity=".7">
          <path d="M210 51L201 70M223 78L218 93M250 78L260 93M275 87L279 100" />
          {[
            [201, 70],
            [218, 93],
            [260, 93],
            [279, 100],
          ].map(([x, y]) => (
            <circle key={x} cx={x} cy={y} r="3" fill="#eeeaff" />
          ))}
        </g>
      </g>
    </svg>
  )
}
function nodeLabel(node: FifoNode) {
  return `(${node.level}, ${node.weight}, ${node.profit})`
}
function nodeStatus(node: FifoNode, state: FifoState) {
  if (node.id === state.best.node) return 'Best feasible'
  if (node.status === 'queued') return fifoDominated(node, state.best.profit) ? 'Pending prune' : 'In Queue'
  return node.status === 'expanded' ? 'Expanded' : node.status === 'pruned' ? 'Pruned' : 'Terminal'
}
function Tree({ state, selected, onSelect }: { state: FifoState; selected: number; onSelect: (id: number) => void }) {
  const id = useId(),
    path = new Set<number>()
  let ancestor: FifoNode | undefined = state.nodes[selected]
  while (ancestor) {
    path.add(ancestor.id)
    ancestor = ancestor.parent === undefined ? undefined : state.nodes[ancestor.parent]
  }
  const visible = state.nodes.filter((node) => node.level <= 2 || path.has(node.id) || node.parent === selected)
  const maxLevel = Math.max(2, ...visible.map((n) => n.level)),
    height = 235 + Math.max(0, maxLevel - 2) * 83
  const positions = new Map<number, { x: number; y: number }>()
  for (const node of visible) {
    let binary = 0,
      parent: FifoNode | undefined = node
    const choices: boolean[] = []
    while (parent?.parent !== undefined) {
      choices.unshift(Boolean(parent.take))
      parent = state.nodes[parent.parent]
    }
    choices.forEach((take) => {
      binary = binary * 2 + (take ? 0 : 1)
    })
    // Deep views focus on the selected ancestor path instead of shrinking labels to illegibility.
    const x = node.level <= 2 ? ((binary + 0.5) / 2 ** node.level) * 600 : path.has(node.id) ? 300 : node.take ? 170 : 430
    positions.set(node.id, { x, y: 5 + node.level * 77 })
  }
  return (
    <div className="fk-tree-scroll">
      <svg className="fk-tree" viewBox={`0 0 600 ${height}`} style={{ height }} aria-label={tr('FIFO branch and bound search tree')}>
        <defs>
          <marker id={id} viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6" markerHeight="6" orient="auto">
            <path d="M0 0 8 4 0 8Z" fill="#273b70" />
          </marker>
          <linearGradient id={`${id}blue`} x2="0" y2="1">
            <stop stopColor="#e4f4ff" />
            <stop offset="1" stopColor="#c9e7ff" />
          </linearGradient>
        </defs>
        {visible.map((node) => {
          const p = node.parent === undefined ? undefined : positions.get(node.parent),
            point = positions.get(node.id)!
          return (
            p && (
              <g key={`edge-${node.id}`}>
                <path d={`M${p.x} ${p.y + 46} L${point.x} ${point.y - 3}`} fill="none" stroke="#899bc3" strokeWidth="1.5" markerEnd={`url(#${id})`} />
                <text x={(p.x + point.x) / 2 + (node.take ? -14 : 14)} y={(p.y + point.y) / 2 + 13} textAnchor="middle" fontSize="11" fill="#122758">
                  {tr(node.take ? 'Take' : 'Skip')}
                </text>
              </g>
            )
          )
        })}
        {visible.map((node) => {
          const { x, y } = positions.get(node.id)!,
            best = node.id === state.best.node,
            pruned = node.status === 'pruned',
            fill = best ? '#fff3cf' : pruned ? '#e2f6e9' : node.status === 'expanded' ? `url(#${id}blue)` : '#edf6ff'
          return (
            <g
              key={node.id}
              role="button"
              tabIndex={0}
              aria-label={tr(`Inspect node ${node.id}: ${nodeLabel(node)}, upper bound ${formatFifoBound(node.bound)}`)}
              aria-pressed={node.id === selected}
              onClick={() => onSelect(node.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  onSelect(node.id)
                }
              }}
            >
              <rect
                x={x - 53}
                y={y}
                width="106"
                height="47"
                rx="6"
                fill={fill}
                stroke={best ? '#ffb500' : pruned ? '#8bd4a7' : node.status === 'expanded' ? '#1680ff' : '#badbff'}
                strokeWidth={node.id === selected ? 2 : 1.2}
              />
              {best && <Trophy x={x - 43} y={y + 12} width="19" height="19" fill="#ffce49" stroke="#eaa000" strokeWidth="1.6" />}
              <text x={x + (best ? 6 : 0)} y={y + 18} textAnchor="middle" fontSize="11" fontWeight="650" fill="#091c4e">
                {nodeLabel(node)}
              </text>
              <text x={x + (best ? 6 : 0)} y={y + 36} textAnchor="middle" fontSize="11" fill="#0b254f">
                {pruned ? tr('Pruned') : `UB = ${formatFifoBound(node.bound)}`}
              </text>
            </g>
          )
        })}
      </svg>
      {visible.length < state.nodes.length && (
        <p className="fk-tree-caption">{tr(`Showing ${visible.length} of ${state.nodes.length} generated nodes. Inspect every node in Experiments.`)}</p>
      )}
    </div>
  )
}
const pseudocode = `items ← sort by decreasing profit / weight (keep original IDs)
incumbent ← empty subset, profit 0
Q ← FIFO queue containing the root
while Q is not empty:
    u ← Q.pop_front()
    if u is overweight or fractional_bound(u) ≤ incumbent.profit:
        mark u pruned; continue
    if u.profit > incumbent.profit: incumbent ← u.chosen
    if all decisions fixed or capacity full: mark u terminal
    else:
        Q.push_back(child taking next item)
        Q.push_back(child skipping next item)
return incumbent

fractional_bound(u):
    value ← u.profit; remaining ← capacity − u.weight
    for item in undecided items, in density order:
        use ← min(remaining, item.weight)
        value ← value + item.profit × use / item.weight
        remaining ← remaining − use
        if remaining = 0: break
    return value  // exact rational; never round before pruning`

export function FifoKnapsackMockupLesson(props: MockupPageProps) {
  useLocaleRender()
  const [tab, setTab] = useState<MockupTab>('Learn'),
    [state, setState] = useState(defaultFifo),
    [selected, setSelected] = useState(1),
    [playing, setPlaying] = useState(false),
    [speed, setSpeed] = useState(800),
    [budget, setBudget] = useState(4095),
    [boundTab, setBoundTab] = useState(false),
    [queuePage, setQueuePage] = useState(0),
    [nodePage, setNodePage] = useState(0)
  const [modal, setModal] = useState<'input' | 'bound' | null>(null),
    dialog = useRef<HTMLDialogElement>(null)
  const [weights, setWeights] = useState('2, 3, 4, 5'),
    [profits, setProfits] = useState('3, 4, 5, 6'),
    [capacity, setCapacity] = useState('5'),
    [error, setError] = useState('')
  const [guess, setGuess] = useState(''),
    [answer, setAnswer] = useState(''),
    [pruneAnswer, setPruneAnswer] = useState('')
  const [notes, setNotes] = usePersistentState('algodrishti-fifo-knapsack-notes', '', persistentString)
  const node = state.nodes[selected] ?? state.nodes[0],
    certified = fifoCertified(state),
    queueMaxPage = Math.max(0, Math.ceil(state.queue.length / 3) - 1),
    actualQueuePage = Math.min(queuePage, queueMaxPage)
  useEffect(() => {
    if (modal) dialog.current?.showModal()
    else dialog.current?.close()
  }, [modal])
  useEffect(() => {
    if (!playing || state.complete || state.paused) return
    const timer = window.setTimeout(() => setState((previous) => advanceFifo(previous, budget)), speed)
    return () => window.clearTimeout(timer)
  }, [playing, state, budget, speed])
  function step() {
    setPlaying(false)
    setState((previous) => advanceFifo(previous, budget))
  }
  function reset() {
    setPlaying(false)
    setState(createFifo(state.input))
    setSelected(0)
    setQueuePage(0)
    setNodePage(0)
  }
  function applyInput() {
    try {
      const input = parseFifoInput(weights, profits, capacity)
      setPlaying(false)
      setState(createFifo(input))
      setSelected(0)
      setQueuePage(0)
      setNodePage(0)
      setError('')
      setModal(null)
    } catch (e) {
      setError((e as Error).message)
    }
  }
  function openInput() {
    setPlaying(false)
    setWeights(state.input.weights.join(', '))
    setProfits(state.input.profits.join(', '))
    setCapacity(String(state.input.capacity))
    setError('')
    setModal('input')
  }
  function sample() {
    setPlaying(false)
    setState(defaultFifo())
    setSelected(1)
    setQueuePage(0)
    setNodePage(0)
  }
  const controls = (
    <div className="fk-controls">
      <button className="fk-primary" onClick={step} disabled={state.complete}>
        <Play size={16} />
        {tr('Step Forward')}
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
          aria-label={tr('FIFO playback delay')}
          type="range"
          min="100"
          max="1600"
          step="100"
          value={speed}
          onChange={(e) => setSpeed(Number(e.target.value))}
        />
        <span>{tr(speed < 500 ? 'Fast' : speed > 1100 ? 'Slow' : 'Normal')}</span>
      </label>
    </div>
  )
  const treePanel = (
    <Panel title={tr('Branch and Bound Tree Explorer')} icon={<Calculator />} className="fk-tree-panel">
      <div className="fk-legend">
        <span>
          <i className="expanded" />
          {tr('Expanded')}
        </span>
        <span>
          <i className="queued" />
          {tr('In Queue')}
        </span>
        <span>
          <i className="pruned" />
          {tr('Pruned (bound ≤ incumbent)')}
        </span>
        <span>
          <i className="best" />
          {tr(certified ? 'Optimal' : 'Best feasible')}
        </span>
      </div>
      <Tree state={state} selected={node.id} onSelect={setSelected} />
      {controls}
    </Panel>
  )
  const queuePanel = (
    <Panel
      title={tr('FIFO Queue (Frontier Order)')}
      icon={<QueueIcon />}
      className="fk-queue"
      action={
        <span className="fk-count">
          {tr('Current size:')} <b>{state.queue.length}</b>
        </span>
      }
    >
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>{tr('Node (level, weight, profit)')}</th>
            <th>{tr('Upper Bound')}</th>
            <th>{tr('Status')}</th>
          </tr>
        </thead>
        <tbody>
          {state.queue.slice(actualQueuePage * 3, actualQueuePage * 3 + 3).map((id, i) => (
            <tr key={id} className={node.id === id ? 'fk-selected' : ''}>
              <td>{actualQueuePage * 3 + i + 1}</td>
              <td>
                <button onClick={() => setSelected(id)} aria-label={tr(`Inspect queued node ${id}`)}>
                  {nodeLabel(state.nodes[id])}
                </button>
              </td>
              <td>{formatFifoBound(state.nodes[id].bound)}</td>
              <td>
                <span className="fk-queue-status">{tr(nodeStatus(state.nodes[id], state))}</span>
              </td>
            </tr>
          ))}
          {!state.queue.length && (
            <tr>
              <td colSpan={4}>{tr('Queue empty. Optimal solution proved.')}</td>
            </tr>
          )}
        </tbody>
      </table>
      {state.queue.length > 3 && (
        <div className="fk-pagination">
          <button disabled={actualQueuePage === 0} onClick={() => setQueuePage(actualQueuePage - 1)}>
            {tr('Previous')}
          </button>
          <span>
            {actualQueuePage + 1}/{queueMaxPage + 1}
          </span>
          <button disabled={actualQueuePage === queueMaxPage} onClick={() => setQueuePage(actualQueuePage + 1)}>
            {tr('Next')}
          </button>
        </div>
      )}
    </Panel>
  )
  const boundPanel = (
    <Panel
      title={tr('Upper Bound Calculator')}
      icon={<Calculator />}
      className="fk-bound"
      action={
        <button className="fk-help" aria-label={tr('Explain fractional upper bound')} onClick={() => setModal('bound')}>
          <CircleHelp size={18} />
        </button>
      }
    >
      <div className="fk-bound-tabs">
        <button aria-pressed={!boundTab} onClick={() => setBoundTab(false)}>
          {tr('Fractional Relaxation')}
        </button>
        <button aria-pressed={boundTab} onClick={() => setBoundTab(true)}>
          {tr('Computation Steps')}
        </button>
      </div>
      <p className="fk-bound-node">
        <b>{tr('Node:')}</b> {tr(`(level = ${node.level}, weight = ${node.weight}, profit = ${node.profit})`)}
      </p>
      {!boundTab ? (
        <>
          <div className="fk-equation">
            {node.bound ? (
              <>
                <i>{'UB'}</i>
                <span>
                  {' = '}
                  {node.profit}
                  {node.bound?.fills.map((fill, i) => (
                    <span key={i}>
                      {' + '}
                      {fill.numerator === fill.denominator ? (
                        fill.profit
                      ) : (
                        <>
                          <span className="fk-fraction">
                            <sup>{fill.numerator}</sup>
                            <sub>{fill.denominator}</sub>
                          </span>
                          {' · '}
                          {fill.profit}
                        </>
                      )}
                    </span>
                  ))}
                  {' = '}
                  {formatFifoBound(node.bound)}
                </span>
              </>
            ) : (
              <strong>{tr('Infeasible: weight > capacity')}</strong>
            )}
          </div>
          <p className="fk-bound-tip">
            {tr(
              node.bound
                ? `Fill remaining capacity (${state.input.capacity - node.weight}) using undecided items in decreasing profit-to-weight ratio. At most one final item is fractional.`
                : 'Weight exceeds capacity. This branch is infeasible and will be pruned when dequeued.',
            )}
          </p>
        </>
      ) : (
        <div className="fk-computation">
          <p>{tr(`Start with profit ${node.profit}; remaining capacity ${Math.max(0, state.input.capacity - node.weight)}.`)}</p>
          {node.bound?.fills.map((fill, i) => (
            <p key={i}>{tr(`Item ${fill.item}: use ${fill.numerator}/${fill.denominator} × profit ${fill.profit}.`)}</p>
          ))}
          <b>{tr(`Upper bound: ${formatFifoBound(node.bound)}. Compare exact fractions to incumbent ${state.best.profit}.`)}</b>
        </div>
      )}
    </Panel>
  )
  const incumbentPanel = (
    <Panel title={tr('Incumbent (Best Profit)')} icon={<Trophy />} className="fk-incumbent">
      <div>
        <b>{tr('Current Best Profit')}</b>
        <output>{state.best.profit}</output>
        <p>
          {tr(`Achieved by items: {${state.best.chosen.join(', ')}}`)}
          <br />
          {tr(`Total weight = ${state.best.weight}`)}
        </p>
      </div>
    </Panel>
  )
  const detailsPanel = (
    <Panel title={tr('Node Details')} icon={<Info />} className="fk-details">
      <dl>
        <dt>{tr('Node:')}</dt>
        <dd>{tr(`(level = ${node.level}, weight = ${node.weight}, profit = ${node.profit})`)}</dd>
        <dt>{tr('Upper bound:')}</dt>
        <dd>{formatFifoBound(node.bound)}</dd>
        <dt>{tr('Decision:')}</dt>
        <dd>{tr(node.parent === undefined ? 'Root' : `${node.take ? 'Took' : 'Skipped'} item ${state.items[node.level - 1].id}`)}</dd>
        <dt>{tr('Feasible:')}</dt>
        <dd>{tr(node.weight <= state.input.capacity ? `Yes (weight ≤ ${state.input.capacity})` : 'No (overweight)')}</dd>
        <dt>{tr('Status:')}</dt>
        <dd>
          <span className="fk-status-pill">{tr(nodeStatus(node, state))}</span>
        </dd>
      </dl>
    </Panel>
  )
  const workedPanel = (
    <Panel title={`Worked Example (Capacity ${fifoExample.capacity})`} icon={<ClipboardList />} className="fk-worked">
      <ol>
        {[
          'Start at root (0, 0, 0), UB = 7. Enqueue it.',
          'Expand root; enqueue take 1, then skip 1.',
          'Dequeue take 1 (1, 2, 3), UB = 7. Enqueue children.',
          'Dequeue skip 1; UB = 6.5 > incumbent 3.',
          'Dequeue take 1 + 2. Incumbent becomes 7.',
          'Remaining bounds ≤ 7: optimal items {1, 2}.',
        ].map((text, i) => (
          <li key={i}>
            <span>{i + 1}</span>
            {tr(text)}
          </li>
        ))}
      </ol>
    </Panel>
  )
  const takeaways = (
    <Panel title={tr('Key Takeaways')} icon={<Lightbulb />} className="fk-takeaways">
      <ul>
        {[
          'Use fractional knapsack upper bound for pruning.',
          'FIFO queue explores nodes in breadth-first order.',
          'Prune nodes whose upper bound ≤ incumbent.',
          'Fractional relaxation gives a valid upper bound.',
          'FIFO and best-first can both find an optimal solution; their exploration order differs.',
        ].map((text, i) => (
          <li key={i}>
            <CheckCircle2 size={18} />
            {tr(text)}
          </li>
        ))}
      </ul>
    </Panel>
  )
  return (
    <div className="mom-page target-visual fifo-knapsack-page" data-target="19">
      <MockupLessonChrome
        {...props}
        showLanguage={false}
        title={tr('0/1 Knapsack: FIFO Branch and Bound')}
        description="Use a fractional-knapsack upper bound to prune exact 0/1 knapsack search with a FIFO queue."
        concepts={6}
        heroIcon={<ArrowLeft />}
        decoration={<BackpackArt />}
        badges={
          <>
            <span>
              <Clock3 />
              {tr('15–25 min')}
            </span>
            <span>
              <BarChart3 />
              {tr('Intermediate')}
            </span>
            <span>
              <ClipboardList />
              {tr('6 key concepts')}
            </span>
          </>
        }
        onStart={() => {
          setTab('Visualization')
          reset()
        }}
      />
      <MockupTabs
        iconOverrides={{ Visualization: <FastForward />, Practice: <Code2 />, Experiments: <WandSparkles /> }}
        active={tab}
        onChange={(next) => {
          setPlaying(false)
          setTab(next)
        }}
        tabs={sections}
      />
      {tab === 'Learn' ? (
        <>
          <div className="fk-dashboard">
            <div className="fk-left">
              <Panel title={tr('Problem Overview')} icon={<BookOpen />} className="fk-overview">
                <p>
                  {tr(
                    'Given n items with weight wᵢ and profit pᵢ, select a subset with total weight ≤ W that maximizes total profit. We use branch and bound with a FIFO queue and a fractional knapsack upper bound to prune the search space.',
                  )}
                </p>
                <div className="fk-stats">
                  {[
                    ['Items (n)', state.items.length],
                    ['Capacity (W)', state.input.capacity],
                    ['Optimal Profit', certified ? state.best.profit : '—'],
                    ['Nodes Explored', state.explored],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <span>{tr(String(label))}</span>
                      <b>{value}</b>
                    </div>
                  ))}
                </div>
              </Panel>
              <div className="fk-middle">
                <Panel
                  title={tr('Items (Example Input)')}
                  icon={<Database />}
                  className="fk-items"
                  action={
                    <button aria-label={tr('Edit knapsack input')} className="fk-edit" onClick={openInput}>
                      <Settings size={14} />
                    </button>
                  }
                >
                  <table>
                    <thead>
                      <tr>
                        <th>{tr('Item')}</th>
                        <th>{tr('Weight (wᵢ)')}</th>
                        <th>{tr('Profit (pᵢ)')}</th>
                        <th>{tr('Ratio (pᵢ/wᵢ)')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {state.items.map((item) => (
                        <tr key={item.id}>
                          <td>{item.id}</td>
                          <td>{item.weight}</td>
                          <td>{item.profit}</td>
                          <td>{(item.profit / item.weight).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Panel>
                {treePanel}
              </div>
              <div className="fk-summary">
                {incumbentPanel}
                {detailsPanel}
                {workedPanel}
              </div>
            </div>
            <aside className="fk-right">
              {queuePanel}
              {boundPanel}
              {takeaways}
            </aside>
          </div>
          <div className="fk-footers">
            <Panel title={tr('Correctness')} icon={<ShieldCheck />}>
              <p>
                {tr(
                  'Fractional relaxation includes every feasible integral solution, so its optimum is an upper bound. Pruning a node with bound ≤ incumbent cannot remove a strictly better solution.',
                )}
              </p>
            </Panel>
            <Panel title={tr('Complexity Analysis')} icon={<BarChart3 />}>
              <p>
                <b>{tr('Time:')}</b>
                {tr(' O(n · 2ⁿ) worst case with a linear bound scan.')}
                <br />
                <b>{tr('Space:')}</b>
                {tr(' O(n · 2ⁿ) for stored decisions and frontier.')}
                <br />
                {tr('Browser rendering and immutable snapshots add overhead.')}
              </p>
            </Panel>
            <Panel title={tr('Assumptions and Constraints')} icon={<Settings />}>
              <ul>
                <li>{tr('Use the editable fields in the input card.')}</li>
                <li>{tr('At most 20 items; positive integer weights.')}</li>
                <li>{tr('Non-negative integer profits; capacity 0–200.')}</li>
                <li>{tr('Bounded runs pause with unexplored work preserved.')}</li>
              </ul>
            </Panel>
          </div>
        </>
      ) : tab === 'Visualization' ? (
        <div className="fk-studio">
          <Panel title={tr('FIFO Search Laboratory')} icon={<ListOrdered />} action={<button onClick={openInput}>{tr('Edit input')}</button>}>
            <p>
              {tr(
                'Each step removes the front node. An expanded node appends its take and skip children at the back. Queued nodes are checked against the latest incumbent only when dequeued.',
              )}
            </p>
            <div className="fk-live-message" role="status">
              {tr(state.message)}
            </div>
            <p className="fk-certificate">
              {tr(
                certified
                  ? `Optimal profit ${state.best.profit} is proved: every queued upper bound is at most the incumbent.`
                  : 'Incumbent is feasible; optimality is not yet proved.',
              )}
            </p>
          </Panel>
          <div className="fk-lab-grid">
            {treePanel}
            <div>
              {queuePanel}
              {boundPanel}
            </div>
          </div>
          <div className="fk-lab-summary">
            {incumbentPanel}
            {detailsPanel}
            <Panel title={tr('Selected Node Explanation')} icon={<Info />}>
              <p>{tr(node.reason)}</p>
              <p>{tr(`Generated ${state.nodes.length} nodes; dequeued ${state.explored}; expanded ${state.expanded}; pruned ${state.pruned}.`)}</p>
              {node.status === 'queued' && fifoDominated(node, state.best.profit) && (
                <p>{tr('This node is still in the FIFO queue. Its bound now cannot improve the incumbent; it will be pruned when it reaches the front.')}</p>
              )}
            </Panel>
          </div>
        </div>
      ) : tab === 'Code' ? (
        <Panel title={tr('FIFO Branch and Bound — Pseudocode')} icon={<Code2 />} className="fk-code">
          <p>
            {tr(
              'Incumbents are updated only from feasible nodes when they are dequeued. A full-capacity node is terminal because all remaining weights are positive. Equal-profit alternatives can be pruned when only one optimum is needed.',
            )}
          </p>
          <pre>
            <code>{pseudocode}</code>
          </pre>
          <h3>{tr('Why the bound is safe')}</h3>
          <p>
            {tr(
              'The remaining 0/1 choices are contained in the relaxed fractional choices. Taking remaining items by decreasing profit/weight maximizes the fractional profit. Therefore UB is at least every feasible completion. Keep decisions fixed: excluded items cannot return to the bound calculation.',
            )}
          </p>
          <h3>{tr('FIFO is not a profit priority')}</h3>
          <p>
            {tr(
              'FIFO removes the oldest queued node, so depths are nondecreasing. Best-first instead selects the largest upper bound. Both are exact if their bounds are valid and every unpruned branch is eventually processed.',
            )}
          </p>
        </Panel>
      ) : tab === 'Practice' ? (
        <div className="fk-practice">
          <Panel title={tr('Prediction Challenge: Fractional Bound')} icon={<Calculator />}>
            <p>
              {tr(
                'For the example capacity 5, skip item 1. Take item 2 (weight 3, profit 4), then fill the remaining 2 units fractionally from item 3 (weight 4, profit 5). What is the upper bound?',
              )}
            </p>
            <label>
              {tr('Your upper bound')}
              <input aria-label={tr('Predicted upper bound')} inputMode="decimal" value={guess} onChange={(e) => setGuess(e.target.value)} />
            </label>
            <button
              className="fk-primary"
              onClick={() =>
                setAnswer(
                  guess.trim() && Number(guess) === 6.5
                    ? 'Correct: UB = 4 + (2/4) × 5 = 6.5. A bound may be fractional even though solutions must be integral.'
                    : 'Try again: item 2 adds 4, and half of item 3 adds 2.5. Sum them.',
                )
              }
            >
              {tr('Check prediction')}
            </button>
            {answer && <p role="status">{tr(answer)}</p>}
          </Panel>
          <Panel title={tr('Prediction Challenge: Prune or Expand?')} icon={<FlaskConical />}>
            <p>{tr('A queued feasible node has upper bound 6.5. The incumbent is 7. What happens when this node is dequeued?')}</p>
            <div className="fk-choice">
              <button onClick={() => setPruneAnswer('Correct. Prune: no completion can earn more than 6.5, so none improves the feasible incumbent of 7.')}>
                {tr('Prune')}
              </button>
              <button onClick={() => setPruneAnswer('Reconsider: 6.5 ≤ 7. Exploring children cannot improve the incumbent; prune this branch.')}>
                {tr('Expand')}
              </button>
            </div>
            {pruneAnswer && <p role="status">{tr(pruneAnswer)}</p>}
          </Panel>
          <Panel title={tr('Worked Example, Step by Step')} icon={<ClipboardList />}>
            <p>
              {tr(
                'Trace the default items through the FIFO queue and compare each upper bound with the incumbent. A queued node can become dominated before it reaches the front.',
              )}
            </p>
            <button
              onClick={() => {
                sample()
                setTab('Visualization')
              }}
            >
              {tr('Load worked example')}
            </button>
          </Panel>
        </div>
      ) : (
        <div className="fk-experiments">
          <Panel title={tr('Experiment Controls')} icon={<FlaskConical />}>
            <p>
              {tr(
                'Try reordering items, zero capacity, or tied densities. Original item IDs survive sorting. Runs stop before consuming a node if the node budget would be exceeded.',
              )}
            </p>
            <div className="fk-experiment-controls">
              <button onClick={openInput}>{tr('Edit input')}</button>
              <button onClick={sample}>{tr('Restore worked example')}</button>
              <button
                onClick={() => {
                  setPlaying(false)
                  setState(createFifo({ ...state.input, capacity: 0 }))
                  setSelected(0)
                  setQueuePage(0)
                  setNodePage(0)
                }}
              >
                {tr('Try zero capacity')}
              </button>
              <label>
                {tr('Node budget')}
                <select aria-label={tr('FIFO node budget')} value={budget} onChange={(e) => setBudget(Number(e.target.value))}>
                  <option value={4095}>4095</option>
                  <option value={16383}>16383</option>
                  <option value={65535}>65535</option>
                </select>
              </label>
              <button onClick={step} disabled={state.complete}>
                {tr(state.paused ? 'Resume one step' : 'Process next node')}
              </button>
            </div>
            <p className="fk-live-message" role="status">
              {tr(state.message)}
            </p>
            <p>{tr(certified ? `Optimal profit ${state.best.profit} proved.` : 'Optimality remains unproved; do not treat a paused run as complete.')}</p>
          </Panel>
          <Panel title={tr('All Generated Nodes')} icon={<ListOrdered />}>
            <p>{tr('Select a node to inspect its actual bound calculation. The tree focuses on the first three levels and the selected ancestor path.')}</p>
            <div className="fk-node-table">
              <table>
                <thead>
                  <tr>
                    {['ID', 'Parent', 'Level', 'Weight', 'Profit', 'Upper Bound', 'Status'].map((s) => (
                      <th key={s}>{tr(s)}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {state.nodes.slice(nodePage * 25, nodePage * 25 + 25).map((n) => (
                    <tr key={n.id}>
                      <td>
                        <button
                          onClick={() => {
                            setSelected(n.id)
                            setTab('Visualization')
                          }}
                          aria-label={tr(`Inspect generated node ${n.id}`)}
                        >
                          {n.id}
                        </button>
                      </td>
                      <td>{n.parent ?? '—'}</td>
                      <td>{n.level}</td>
                      <td>{n.weight}</td>
                      <td>{n.profit}</td>
                      <td>{formatFifoBound(n.bound)}</td>
                      <td>{tr(nodeStatus(n, state))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="fk-pagination">
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
          <Panel title={tr('Your Knapsack Notes')} icon={<BookOpen />}>
            <LanguageSelector />
            <label>
              {tr('Explain in your own words why the relaxation is an upper bound.')}
              <textarea aria-label={tr('Knapsack learning notes')} rows={5} value={notes} onChange={(e) => setNotes(e.target.value)} />
            </label>
            <p>{tr('Notes are saved automatically in this browser.')}</p>
          </Panel>
        </div>
      )}
      <dialog
        ref={dialog}
        className="fk-dialog"
        aria-label={tr(modal === 'input' ? 'Edit knapsack input' : 'Fractional bound explanation')}
        onCancel={() => setModal(null)}
        onClose={() => setModal(null)}
      >
        <button className="fk-close" aria-label={tr('Close knapsack dialog')} onClick={() => setModal(null)}>
          <X />
        </button>
        {modal === 'input' ? (
          <>
            <h2>{tr('Edit knapsack input')}</h2>
            <p>{tr('Enter matching lists. IDs follow the original input positions; the search sorts by decreasing density.')}</p>
            <label>
              {tr('Weights')}
              <input aria-label={tr('Item weights')} value={weights} onChange={(e) => setWeights(e.target.value)} />
            </label>
            <label>
              {tr('Profits')}
              <input aria-label={tr('Item profits')} value={profits} onChange={(e) => setProfits(e.target.value)} />
            </label>
            <label>
              {tr('Capacity')}
              <input aria-label={tr('Knapsack capacity')} type="number" min="0" max="200" value={capacity} onChange={(e) => setCapacity(e.target.value)} />
            </label>
            <p>{tr('1–20 items. Weights 1–100; profits 0–100; capacity 0–200. Integers only.')}</p>
            {error && <p role="alert">{tr(error)}</p>}
            <button className="fk-primary" onClick={applyInput}>
              {tr('Apply input')}
            </button>
          </>
        ) : (
          <>
            <h2>{tr('Why fractional relaxation bounds 0/1 knapsack')}</h2>
            <p>
              {tr(
                'Fix the decisions already made. Ignore integrality only for the undecided items, so a fraction of the last item may fit. Every remaining 0/1 choice is also allowed by this relaxation; therefore its optimum cannot be smaller.',
              )}
            </p>
            <p>
              {tr(
                'Sort remaining items by density. Fill whole items, then one fraction if needed. Root example: capacity 5 fits item 1 (2, 3) and item 2 (3, 4) exactly, so UB = 3 + 4 = 7. After skipping item 1, UB = 4 + (2/4) × 5 = 6.5.',
              )}
            </p>
            <p>
              {tr(
                'A queued node with UB ≤ incumbent cannot give a strictly better solution. It remains visible until FIFO dequeues and prunes it. Bounds are compared as exact rational numbers; rounded labels never decide pruning.',
              )}
            </p>
          </>
        )}
      </dialog>
    </div>
  )
}
