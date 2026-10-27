// @localized-render
import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  BookOpen,
  Check,
  CheckCircle2,
  ClipboardList,
  Code2,
  FileText,
  GitFork,
  Layers3,
  Lightbulb,
  MapPin,
  UserRound,
  Moon,
  Pause,
  Pencil,
  Play,
  RotateCcw,
  Search,
  ShieldCheck,
  Sigma,
  Sun,
  Table2,
  TriangleAlert,
  Trophy,
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
  createTsp,
  initialTspTimeline,
  parseTspMatrix,
  stepTspTimeline,
  tourLabel,
  tspCertified,
  tspFive,
  tspFour,
  type TspNode,
  type TspState,
} from './tspBranchModel'
import './tsp-branch-mockup.css'

const tr = (s: string) => tx(s, 'studios'),
  tabs: MockupTab[] = ['Learn', 'Visualization', 'Code', 'Practice', 'Experiments', 'Notes']
function TspBars() {
  return (
    <svg viewBox="0 0 26 26" fill="currentColor" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <rect x="3" y="13" width="4" height="11" rx="1.5" fillOpacity=".65" />
      <rect x="11" y="3" width="4" height="21" rx="1.5" fillOpacity=".8" />
      <rect x="19" y="8" width="4" height="16" rx="1.5" fillOpacity=".65" />
      <path d="M5 15V22M13 5V22M21 10V22" stroke="white" strokeWidth=".6" />
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
    <section className={`tp-panel ${className}`}>
      <header>
        <span className="tp-icon">{icon}</span>
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
function Switch({ label, value, onChange }: { label: string; value: boolean; onChange: (value: boolean) => void }) {
  return (
    <label className="tp-switch">
      <input type="checkbox" aria-label={label} checked={value} onChange={(e) => onChange(e.target.checked)} />
      <i />
      {label}
    </label>
  )
}
function Graph({
  state,
  node,
  weights,
  city,
  onCity,
}: {
  state: TspState
  node: TspNode
  weights: boolean
  city: number | null
  onCity: (city: number | null) => void
}) {
  const gradient = useId(),
    n = state.matrix.length,
    points =
      n === 5
        ? [
            [189, 36],
            [53, 109],
            [324, 109],
            [95, 239],
            [272, 239],
          ]
        : state.matrix.map((_, i) => [190 + 133 * Math.sin((i * 2 * Math.PI) / n), 139 - 110 * Math.cos((i * 2 * Math.PI) / n)])
  const chosen = (a: number, b: number) => node.path.slice(1).some((to, i) => (node.path[i] === a && to === b) || (node.path[i] === b && to === a))
  return (
    <div className="tp-graph-wrap">
      <svg className="tp-city-graph" viewBox="0 0 380 280" aria-label={tr(`Complete symmetric graph with ${n} cities`)}>
        <defs>
          <radialGradient id={`${gradient}-blue`} cx="35%" cy="30%" r="80%">
            <stop stopColor="#f9fdff" />
            <stop offset="1" stopColor="#c3e2ff" />
          </radialGradient>
          <radialGradient id={`${gradient}-gold`} cx="35%" cy="30%" r="80%">
            <stop stopColor="#fff1bd" />
            <stop offset="1" stopColor="#ffd45d" />
          </radialGradient>
        </defs>
        {points.flatMap(([x, y], a) =>
          points.slice(a + 1).map(([x2, y2], offset) => {
            const b = a + offset + 1
            return (
              <g key={`${a}-${b}`}>
                <path d={`M${x} ${y}L${x2} ${y2}`} fill="none" stroke={chosen(a, b) ? '#0d79ff' : '#7f9bc4'} strokeWidth={chosen(a, b) ? 2 : 1.2} />
                {weights && (
                  <g>
                    <rect x={(x + x2) / 2 - 13} y={(y + y2) / 2 - 11} width="26" height="22" rx="5" fill="#fff" stroke="#b0c9e9" />
                    <text x={(x + x2) / 2} y={(y + y2) / 2 + 5} textAnchor="middle" fontSize="13" fontWeight="600" fill="#183769">
                      {state.matrix[a][b]}
                    </text>
                  </g>
                )}
              </g>
            )
          }),
        )}
        {points.map(([x, y], v) => (
          <g
            key={v}
            role="button"
            tabIndex={0}
            aria-label={tr(`Inspect city ${v + 1} distances`)}
            aria-pressed={city === v}
            onClick={() => onCity(city === v ? null : v)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onCity(city === v ? null : v)
              }
            }}
          >
            <circle
              cx={x}
              cy={y}
              r="20"
              fill={`url(#${gradient}-${v === state.source ? 'gold' : 'blue'})`}
              stroke={v === state.source ? '#ffa20a' : city === v ? '#7e34ef' : '#438dff'}
              strokeWidth={city === v ? 3 : 1.2}
            />
            <text x={x} y={y + 6} textAnchor="middle" fontSize="18" fontWeight="650" fill="#152e53">
              {v + 1}
            </text>
          </g>
        ))}
      </svg>
      {city !== null && (
        <p className="tp-city-inspection" role="status">
          {tr(`City ${city + 1} distances: ${state.matrix[city].join(', ')}. Click again to close.`)}
        </p>
      )}
    </div>
  )
}
function Tree({ state, selected, onSelect }: { state: TspState; selected: number; onSelect: (id: number) => void }) {
  const marker = useId(),
    ids = new Set<number>([0, ...state.nodes.filter((n) => n.parent === 0).map((n) => n.id)])
  const addPath = (id: number) => {
    let node: TspNode | undefined = state.nodes[id]
    while (node) {
      ids.add(node.id)
      node = node.parent === undefined ? undefined : state.nodes[node.parent]
    }
  }
  addPath(selected)
  let focus = selected
  if (selected === 0 || (!state.nodes.some((n) => n.parent === selected) && state.nodes[selected].path.length <= 2)) focus = state.last ?? 0
  addPath(focus)
  state.nodes.filter((n) => n.parent === focus).forEach((n) => ids.add(n.id))
  const visible = state.nodes.filter((n) => ids.has(n.id)),
    children = new Map<number, TspNode[]>()
  visible.forEach((n) => {
    if (n.parent !== undefined) children.set(n.parent, [...(children.get(n.parent) ?? []), n])
  })
  const width = Math.max(560, ...[...children.values()].map((c) => c.length * 106)),
    height = Math.max(273, Math.max(...visible.map((n) => n.path.length - 1)) * 103 + 76),
    points = new Map<number, { x: number; y: number }>([[0, { x: width / 2, y: 7 }]])
  for (const parent of visible) {
    const c = children.get(parent.id) ?? [],
      p = points.get(parent.id)!
    const span = (c.length - 1) * 106,
      base = Math.max(53, Math.min(width - 53 - span, p.x - span / 2))
    c.forEach((n, i) => points.set(n.id, { x: parent.id === 0 ? ((i + 0.5) * width) / c.length : base + i * 106, y: 7 + (n.path.length - 1) * 103 }))
  }
  return (
    <div className="tp-tree-scroll">
      <svg className="tp-tree" viewBox={`0 0 ${width} ${height}`} style={{ width, height }} aria-label={tr('TSP branch and bound search tree')}>
        <defs>
          <marker id={marker} markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
            <path d="M0 0 7 3.5 0 7" fill="none" stroke="#4b79c5" strokeWidth="1.5" />
          </marker>
        </defs>
        {visible.map((n) => {
          const p = n.parent === undefined ? undefined : points.get(n.parent),
            point = points.get(n.id)!
          return (
            p && <path key={`e${n.id}`} d={`M${p.x} ${p.y + 69}L${point.x} ${point.y - 4}`} stroke="#5f8cf0" strokeWidth="1.4" markerEnd={`url(#${marker})`} />
          )
        })}
        {visible.map((n) => {
          const { x, y } = points.get(n.id)!,
            current = n.id === (state.last ?? 0),
            selectedNode = n.id === selected,
            pruned = n.status === 'pruned'
          return (
            <g
              key={n.id}
              role="button"
              tabIndex={0}
              aria-label={tr(`Inspect TSP node ${n.id}: ${tourLabel(n.path)}, lower bound ${n.lower.value}`)}
              aria-pressed={selectedNode}
              onClick={() => onSelect(n.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  onSelect(n.id)
                }
              }}
            >
              <title>{tourLabel(n.path)}</title>
              <rect
                x={x - 51}
                y={y}
                width="102"
                height={n.path.length > 2 ? 65 : 69}
                rx="12"
                fill={pruned ? '#fff2f5' : current ? '#fff7e7' : n.status === 'solution' ? '#e4fbef' : '#f3faff'}
                stroke={selectedNode ? '#0569ff' : pruned ? '#fa8093' : current ? '#ff9b00' : n.status === 'solution' ? '#19bb7b' : '#83aaff'}
                strokeWidth={selectedNode ? 2.3 : 1.3}
              />
              <text x={x} y={y + 20} textAnchor="middle" fontSize="13" fontWeight="650" fill="#133369">
                {n.path.length > 4 ? `${n.path[0] + 1} → … → ${n.path.at(-1)! + 1}` : tourLabel(n.path)}
              </text>
              <text x={x} y={y + 39} textAnchor="middle" fontSize="13" fill="#133369">
                {tr(`cost = ${n.lower.cost}`)}
              </text>
              <text x={x} y={y + 57} textAnchor="middle" fontSize="13" fill="#133369">{`LB = ${n.lower.value}`}</text>
            </g>
          )
        })}
      </svg>
      {visible.length < state.nodes.length && (
        <p className="tp-tree-caption">{tr(`Showing ${visible.length} of ${state.nodes.length} generated nodes. Inspect every node in Experiments.`)}</p>
      )}
    </div>
  )
}
const code = `best ← an optional feasible nearest-neighbor tour
frontier ← root path [start], ordered by smallest lower bound
while frontier is not empty:
    u ← extract_min(frontier)  // equal bounds: smaller insertion ID
    if a best tour exists and LB(u) ≥ best.cost: prune u
    else if u visits every city:
        close u with its return-to-start edge
        update best from this complete feasible tour
    else:
        for each unvisited city v:
            child ← u extended to v
            compute LB(child); enqueue only if LB(child) < best.cost

For unvisited set U and current endpoint last:
LB = path_cost + min(last → U)
              + sum over u in U of min(u → ((U without u) ∪ {start}))
If U is empty: LB = path_cost + distance(last, start).
Each required outgoing edge is counted once. Do not add return twice.`

export function TspBranchMockupLesson(props: MockupPageProps) {
  useLocaleRender()
  const navigate = useNavigate(),
    [tab, setTab] = useState<MockupTab>('Visualization'),
    [timeline, setTimeline] = useState(initialTspTimeline),
    state = timeline.state
  const [selected, setSelected] = useState(1),
    [city, setCity] = useState<number | null>(null),
    [weights, setWeights] = useState(true),
    [boundVisible, setBoundVisible] = useState(true),
    [playing, setPlaying] = useState(false),
    [speed, setSpeed] = useState(800),
    [budget, setBudget] = useState(4095),
    [nodePage, setNodePage] = useState(0),
    [frontPage, setFrontPage] = useState(0)
  const [query, setQuery] = useState(''),
    search = useRef<HTMLInputElement>(null),
    [fallbackTheme, setFallbackTheme] = useState(() => localStorage.getItem('algodrishti-theme') ?? 'light'),
    theme = props.theme ?? fallbackTheme
  const [reviewed, setReviewed] = usePersistentState<number[]>('algodrishti-tsp-branch-reviewed', [], {
    deserialize: (value) => {
      try {
        const parsed: unknown = JSON.parse(value)
        return Array.isArray(parsed) ? [...new Set(parsed.filter((v): v is number => Number.isInteger(v) && v >= 0 && v < 6))] : []
      } catch {
        return []
      }
    },
  })
  const [notes, setNotes] = usePersistentState('algodrishti-tsp-branch-notes', '', persistentString),
    [modal, setModal] = useState<'matrix' | 'proof' | null>(null),
    dialog = useRef<HTMLDialogElement>(null)
  const [matrixText, setMatrixText] = useState(''),
    [sourceText, setSourceText] = useState('1'),
    [error, setError] = useState(''),
    [guess, setGuess] = useState(''),
    [feedback, setFeedback] = useState(''),
    [tourGuess, setTourGuess] = useState(''),
    [tourFeedback, setTourFeedback] = useState(''),
    [proofFeedback, setProofFeedback] = useState('')
  const node = state.nodes[selected] ?? state.nodes[0],
    certified = tspCertified(state),
    matches = query.trim() ? allModules.filter((m) => `${m.name} ${m.summary}`.toLowerCase().includes(query.toLowerCase())).slice(0, 5) : [],
    studied = props.completed.includes(props.module.id)
  const frontMax = Math.max(0, Math.ceil(state.frontier.length / 3) - 1),
    frontCurrent = Math.min(frontPage, frontMax)
  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem('algodrishti-theme', theme)
  }, [theme])
  useEffect(() => {
    if (modal) dialog.current?.showModal()
    else dialog.current?.close()
  }, [modal])
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        search.current?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
  useEffect(() => {
    if (!playing || state.complete || state.paused) return
    const timer = window.setTimeout(() => setTimeline((t) => stepTspTimeline(t, budget)), speed)
    return () => window.clearTimeout(timer)
  }, [playing, state, speed, budget])
  function step() {
    setPlaying(false)
    setTimeline((t) => stepTspTimeline(t, budget))
  }
  function reset() {
    setPlaying(false)
    setTimeline({ state: createTsp(state.matrix, state.source, state.seeded), past: [] })
    setSelected(0)
    setNodePage(0)
    setFrontPage(0)
    setCity(null)
  }
  function back() {
    setPlaying(false)
    setTimeline((t) => (t.past.length ? { state: t.past.at(-1)!, past: t.past.slice(0, -1) } : t))
    setSelected(0)
    setNodePage(0)
    setFrontPage(0)
  }
  function load(matrix: number[][]) {
    setPlaying(false)
    setTimeline({ state: createTsp(matrix), past: [] })
    setSelected(0)
    setCity(null)
    setNodePage(0)
    setFrontPage(0)
  }
  function edit() {
    setPlaying(false)
    setMatrixText(state.matrix.map((row) => row.join(', ')).join('\n'))
    setSourceText(String(state.source + 1))
    setError('')
    setModal('matrix')
  }
  function apply() {
    try {
      const parsed = parseTspMatrix(matrixText, sourceText)
      setTimeline({ state: createTsp(parsed.matrix, parsed.source, state.seeded), past: [] })
      setSelected(0)
      setCity(null)
      setNodePage(0)
      setFrontPage(0)
      setError('')
      setModal(null)
    } catch (e) {
      setError((e as Error).message)
    }
  }
  const select = (id: number) => {
    setSelected(id)
    setCity(null)
  }
  const controls = (
    <Panel title={tr('Controls')} icon={<ShieldCheck />} className="tp-controls">
      <div>
        <button className="tp-primary" onClick={step} disabled={state.complete}>
          <Play size={15} />
          {tr('Expand Next Node')}
        </button>
        <button onClick={() => setPlaying(!playing)} disabled={state.complete || state.paused}>
          {playing && !state.complete ? <Pause size={16} /> : <Play size={16} />} {tr(playing && !state.complete ? 'Pause' : 'Auto Play')}
        </button>
        <button onClick={reset}>
          <RotateCcw size={17} />
          {tr('Reset')}
        </button>
        <button onClick={back} disabled={!timeline.past.length}>
          <Undo2 size={17} />
          {tr('Step Back')}
        </button>
      </div>
    </Panel>
  )
  const incumbent = (
    <Panel title={tr('Current Best Tour (Incumbent)')} icon={<Trophy />} className="tp-incumbent">
      <div className="tp-best-cost">
        <b>
          {tr('Cost:')} <output>{state.best?.cost ?? '—'}</output>
        </b>
        <span>{tr(state.best ? (state.best.seed ? 'Feasible seed tour' : `Updated at step ${state.best.step}`) : 'No complete tour yet')}</span>
      </div>
      <div className="tp-tour-cities">
        {state.best?.tour.map((v, i) => (
          <span key={i}>
            {i > 0 && <i>{'→'}</i>}
            <b>{v + 1}</b>
          </span>
        ))}
      </div>
      <p>
        {tr(
          state.best
            ? certified
              ? 'This complete tour is now certified optimal.'
              : 'This is a feasible tour; optimality is not yet proved.'
            : 'Extend a path to every city, then return to the start.',
        )}
      </p>
    </Panel>
  )
  const graph = (
    <Panel
      title={tr('City Graph (TSP Instance)')}
      subtitle={tr('Complete graph with symmetric distances')}
      icon={<UserRound />}
      className="tp-graph"
      action={<b className="tp-city-count">{`n = ${state.matrix.length}`}</b>}
    >
      <Graph state={state} node={node} weights={weights} city={city} onCity={setCity} />
    </Panel>
  )
  const tree = (
    <Panel
      title={tr('Branch and Bound Search Tree')}
      subtitle={tr('Nodes show partial tours with cost and lower bound (LB).')}
      icon={<GitFork />}
      className="tp-search-tree"
      action={
        <div className="tp-legend">
          {['Current node', 'Frontier node', 'Pruned node', 'Current best path'].map((s, i) => (
            <span key={s}>
              <i className={`tp-dot-${i}`} />
              {tr(s)}
            </span>
          ))}
        </div>
      }
    >
      <Tree state={state} selected={node.id} onSelect={select} />
    </Panel>
  )
  const matrix = (
    <Panel
      title={tr('Distance Matrix')}
      subtitle={tr(`Symmetric distance matrix for ${state.matrix.length} cities.`)}
      icon={<Table2 />}
      className="tp-matrix"
      action={
        <button className="tp-edit-matrix" aria-label={tr('Edit TSP distance matrix')} onClick={edit}>
          <Pencil size={13} />
        </button>
      }
    >
      <div className="tp-matrix-scroll">
        <table>
          <thead>
            <tr>
              <th />
              {state.matrix.map((_, v) => (
                <th key={v}>{v + 1}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {state.matrix.map((row, u) => (
              <tr key={u}>
                <th>{u + 1}</th>
                {row.map((distance, v) => (
                  <td key={v}>
                    {u === v ? (
                      '–'
                    ) : (
                      <button aria-label={tr(`Edit distance between cities ${u + 1} and ${v + 1}`)} onClick={edit}>
                        {distance}
                      </button>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  )
  const endpoint = node.lower.terms[0],
    otherTerms = node.lower.terms.slice(1),
    otherSum = otherTerms.reduce((sum, t) => sum + t.cost, 0),
    nodeOptions = state.nodes.slice(0, 200).some((n) => n.id === node.id) ? state.nodes.slice(0, 200) : [...state.nodes.slice(0, 200), node]
  const calculator = (
    <Panel
      title={tr('Lower Bound Calculator')}
      subtitle={tr('LB = current cost + endpoint minimum + minima for unvisited cities. Return-to-start is already an allowed destination.')}
      icon={<Sigma />}
      className="tp-calculator"
    >
      {boundVisible ? (
        <>
          <select aria-label={tr('Select TSP bound node')} value={node.id} onChange={(e) => select(Number(e.target.value))}>
            {nodeOptions.map((n) => (
              <option key={n.id} value={n.id}>
                {tr(`Node: ${tourLabel(n.path)}`)}
              </option>
            ))}
          </select>
          <table>
            <tbody>
              <tr>
                <td>{tr('Current cost')}</td>
                <td>{node.lower.cost}</td>
              </tr>
              <tr>
                <td>{tr('Unvisited cities')}</td>
                <td>{`{${node.lower.unvisited.map((v) => v + 1).join(', ')}}`}</td>
              </tr>
              <tr>
                <td>{tr(node.lower.unvisited.length ? 'Endpoint minimum' : 'Return-to-start edge')}</td>
                <td>{`${endpoint.from + 1} → ${endpoint.to + 1} = ${endpoint.cost}`}</td>
              </tr>
              <tr>
                <td>{tr('Unvisited minima')}</td>
                <td>{otherTerms.length ? `${otherTerms.map((t) => `min(${t.from + 1}) = ${t.cost}`).join(', ')}; Σ = ${otherSum}` : '0'}</td>
              </tr>
              <tr className="tp-lower-result">
                <td>{tr('Lower bound (LB)')}</td>
                <td>
                  <b>
                    {node.lower.cost} + {endpoint.cost} + {otherSum} = <output>{node.lower.value}</output>
                  </b>
                </td>
              </tr>
            </tbody>
          </table>
          {state.nodes.length > 200 && <p className="tp-preview-note">{tr('First 200 nodes shown here; inspect all generated nodes in Experiments.')}</p>}
        </>
      ) : (
        <p className="tp-bound-hidden">{tr('Bound computation hidden. Turn on Show bound computation to inspect the selected node.')}</p>
      )}
    </Panel>
  )
  const frontier = (
    <Panel title={tr('Frontier Nodes')} icon={<Layers3 />} className="tp-frontier" action={<b className="tp-frontier-count">{state.frontier.length}</b>}>
      <table>
        <thead>
          <tr>
            {['Partial tour', 'Cost', 'Lower bound'].map((s) => (
              <th key={s}>{tr(s)}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {state.frontier.slice(frontCurrent * 3, frontCurrent * 3 + 3).map((id) => (
            <tr key={id} className={node.id === id ? 'tp-selected-row' : ''}>
              <td>
                <button aria-label={tr(`Inspect frontier TSP node ${id}`)} onClick={() => select(id)}>
                  {tourLabel(state.nodes[id].path)}
                </button>
              </td>
              <td>{state.nodes[id].lower.cost}</td>
              <td>{state.nodes[id].lower.value}</td>
            </tr>
          ))}
          {!state.frontier.length && (
            <tr>
              <td colSpan={3}>{tr('Frontier empty: optimum proved.')}</td>
            </tr>
          )}
        </tbody>
      </table>
      {state.frontier.length > 3 && (
        <div className="tp-pagination">
          <button disabled={frontCurrent === 0} onClick={() => setFrontPage(frontCurrent - 1)}>
            {tr('Previous frontier')}
          </button>
          <span>
            {frontCurrent + 1}/{frontMax + 1}
          </span>
          <button disabled={frontCurrent === frontMax} onClick={() => setFrontPage(frontCurrent + 1)}>
            {tr('Next frontier')}
          </button>
        </div>
      )}
    </Panel>
  )
  const footer = (
    <div className="tp-footer-grid">
      <Panel title={tr('Key Takeaways')} icon={<Lightbulb />} className="tp-takeaways">
        <ul>
          {[
            'Use a lower bound on partial tours to prune branches that cannot beat the current best tour.',
            'Expand the most promising node (smallest LB).',
            'The incumbent must be an actual complete closed tour.',
            'A heuristic tour is an upper bound, not a proof.',
          ].map((s) => (
            <li key={s}>{tr(s)}</li>
          ))}
        </ul>
      </Panel>
      <Panel
        title={tr('Worked Example')}
        icon={<FileText />}
        className="tp-worked"
        action={
          <button
            className="tp-primary"
            onClick={() => {
              load(tspFive)
              setTab('Visualization')
            }}
          >
            {tr('Try It')}
          </button>
        }
      >
        <ol>
          {[
            'Start from city 1. Root LB = 8 + 9 + 7 + 6 + 6 = 36.',
            'Expand 1 → 3 (LB = 36); its child 1 → 3 → 5 has LB = 39.',
            'Inspect 1 → 2: cost 10, endpoint minimum 9, other minima 19; LB = 38.',
            'Tour 1 → 2 → 4 → 5 → 3 → 1 costs 40. Prune only when LB ≥ incumbent.',
          ].map((s, i) => (
            <li key={i}>
              <span>{i + 1}</span>
              {tr(s)}
            </li>
          ))}
        </ol>
      </Panel>
      <Panel title={tr('Correctness & Complexity')} icon={<TspBars />} className="tp-correctness">
        <ul>
          <li>
            <b>{tr('Correctness:')}</b>
            {tr(' Every required outgoing edge is bounded below, so the sum never exceeds a feasible completion cost.')}
          </li>
          <li>
            <b>{tr('Time:')}</b>
            {tr(' Worst-case factorial search, plus bound scans and frontier sorting.')}
          </li>
          <li>
            <b>{tr('Space:')}</b>
            {tr(' Retained partial paths and frontier can be O(n · n!).')}
          </li>
        </ul>
        <button onClick={() => setModal('proof')}>{tr('Read the proof')}</button>
      </Panel>
      <Panel title={tr('Common Pitfalls')} icon={<TriangleAlert />} className="tp-pitfalls">
        <ul>
          {[
            'Using an overestimating bound can prune an optimal solution.',
            'Forgetting the return-to-start edge gives an incomplete tour cost.',
            'Adding a separate return minimum can double-count an outgoing edge.',
            'Treating a heuristic incumbent as a certified optimum.',
          ].map((s) => (
            <li key={s}>{tr(s)}</li>
          ))}
        </ul>
      </Panel>
    </div>
  )
  const reviewIndex = tabs.indexOf(tab),
    reviewControl = (
      <button
        className="tp-review"
        aria-pressed={reviewed.includes(reviewIndex)}
        onClick={() => setReviewed(reviewed.includes(reviewIndex) ? reviewed.filter((v) => v !== reviewIndex) : [...reviewed, reviewIndex])}
      >
        <CheckCircle2 size={17} />
        {tr(reviewed.includes(reviewIndex) ? `${tab} reviewed` : `Mark ${tab} reviewed`)}
      </button>
    )
  return (
    <div className="mom-page target-visual tsp-branch-page" data-target="21">
      <div className="mom-topbar tp-topbar">
        <button className="tp-back" aria-label={tr('Back to branch and bound overview')} onClick={() => navigate('/branch-and-bound/branch-bound-method')}>
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
          <button className="tp-search-key" aria-label={tr('Focus topic search')} onClick={() => search.current?.focus()}>
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
      <header className="tp-lesson-header">
        <button className="tp-back" aria-label={tr('Open branch and bound concepts')} onClick={() => navigate('/branch-and-bound/branch-bound-method')}>
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1>{tr('TSP Branch and Bound')}</h1>
          <p>{tr('Explore partial tours by a safe outgoing-edge lower bound.')}</p>
        </div>
        <div className="tp-section-progress" aria-label={tr(`${reviewed.length} of 6 sections reviewed`)}>
          <span>{tr(`${reviewed.length} of 6 sections`)}</span>
          <div>
            {tabs.map((s, i) => (
              <i key={s} className={reviewed.includes(i) ? 'tp-section-done' : ''} />
            ))}
          </div>
        </div>
        <button
          className="tp-primary tp-start"
          onClick={() => {
            setPlaying(false)
            setTab('Learn')
          }}
        >
          {tr('Start Learning')}
          <ArrowRight size={19} />
        </button>
      </header>
      <MockupTabs
        active={tab}
        onChange={(next) => {
          setPlaying(false)
          setTab(next)
        }}
        tabs={tabs}
      />
      {tab === 'Visualization' ? (
        <section className="tp-visualization">
          <header className="tp-visual-heading">
            <TspBars />
            <div>
              <h2>{tr('Interactive Visualization')}</h2>
              <p>{tr('Explore the branch and bound search tree for the Traveling Salesman Problem using a lower bound on tours.')}</p>
            </div>
            <div className="tp-visual-options">
              <select
                aria-label={tr('TSP example')}
                value={
                  JSON.stringify(state.matrix) === JSON.stringify(tspFive)
                    ? 'five'
                    : JSON.stringify(state.matrix) === JSON.stringify(tspFour)
                      ? 'four'
                      : 'custom'
                }
                onChange={(e) => (e.target.value === 'custom' ? edit() : load(e.target.value === 'five' ? tspFive : tspFour))}
              >
                <option value="five">{tr('Example: 5 cities')}</option>
                <option value="four">{tr('Example: 4 cities')}</option>
                <option value="custom">{tr('Custom matrix…')}</option>
              </select>
              <Switch label={tr('Show edge weights')} value={weights} onChange={setWeights} />
              <Switch label={tr('Show bound computation')} value={boundVisible} onChange={setBoundVisible} />
              <button onClick={reset}>
                <RotateCcw size={18} />
                {tr('Reset')}
              </button>
            </div>
          </header>
          <div className="tp-main-grid">
            {graph}
            {tree}
            <aside>
              {controls}
              {incumbent}
            </aside>
          </div>
          <div className="tp-data-grid">
            {matrix}
            {calculator}
            {frontier}
          </div>
          {footer}
          <p className="tp-live-message" role="status">
            {tr(state.message)}
          </p>
          {state.paused && <p className="tp-pause-note">{tr('Increase the node budget in Experiments before resuming. A paused run is not complete.')}</p>}
          {reviewControl}
        </section>
      ) : tab === 'Learn' ? (
        <div className="tp-learning">
          <Panel title={tr('TSP: Visit Every City, Then Return Home')} icon={<MapPin />}>
            <p>
              {tr(
                'A tour starts at one city, visits every other city exactly once, and returns to the start. Minimize the sum of all traveled edge costs. A partial path is not yet a tour.',
              )}
            </p>
            <div className="tp-concept-grid">
              {[
                ['Branch', 'Extend the current endpoint to any unvisited city. The children partition all possible completions.'],
                ['Lower bound', 'Relax global tour constraints: choose each required outgoing edge independently at its cheapest allowed cost.'],
                ['Incumbent', 'A complete feasible tour supplies an upper bound. Nearest-neighbor is a quick seed, but need not be optimal.'],
                ['Prune', 'If LB ≥ incumbent cost, this branch cannot yield a strictly cheaper tour.'],
                ['Best-first', 'Expand the smallest LB; stable ties use the earlier insertion ID.'],
                ['Certify', 'If no frontier bound is below the feasible incumbent cost, the incumbent is optimal.'],
              ].map(([title, text]) => (
                <article key={title}>
                  <h3>{tr(title)}</h3>
                  <p>{tr(text)}</p>
                </article>
              ))}
            </div>
          </Panel>
          <Panel title={tr('A Worked Tour and Bound')} icon={<BookOpen />}>
            <p>
              {tr(
                'For the 5-city example, tour 1 → 2 → 4 → 5 → 3 → 1 costs 10 + 9 + 6 + 7 + 8 = 40. For partial path 1 → 2, the fixed cost is 10. The endpoint must leave city 2 toward {3,4,5}, at least 9. Unvisited cities contribute minima 7, 6, 6. Thus LB = 10 + 9 + 19 = 38 ≤ 40.',
              )}
            </p>
            <p>
              {tr(
                'A lower bound may reuse destinations or form subtours. That is allowed in the relaxation; it is not a valid tour. Include the final return edge exactly once.',
              )}
            </p>
            <button
              className="tp-primary"
              onClick={() => {
                load(tspFive)
                setTab('Visualization')
              }}
            >
              {tr('Trace the 5-city example')}
            </button>
            <button onClick={() => setModal('proof')}>{tr('Why the bound is safe')}</button>
          </Panel>
          {reviewControl}
        </div>
      ) : tab === 'Code' ? (
        <Panel title={tr('TSP Branch and Bound — Pseudocode')} icon={<Code2 />} className="tp-code">
          <p>
            {tr(
              'Distances are symmetric non-negative integers. The frontier sorts by increasing lower bound. A feasible nearest-neighbor seed is optional. Every child keeps all previously chosen path edges fixed.',
            )}
          </p>
          <pre>
            <code>{code}</code>
          </pre>
          <p>
            {tr(
              'This teaching model retains paths, bound terms and rewind snapshots. It sorts copied frontier arrays for inspection, adding browser overhead to the underlying factorial search. Runs pause at a visible node budget without losing unexplored work.',
            )}
          </p>
          {reviewControl}
        </Panel>
      ) : tab === 'Practice' ? (
        <div className="tp-practice">
          <Panel title={tr('Predict the Lower Bound')} icon={<Sigma />}>
            <p>
              {tr(
                'Default 5-city matrix: path 1 → 2 costs 10. Endpoint minimum is 9. The unvisited cities have outgoing minima 7, 6 and 6, with return-to-start already allowed. What is LB?',
              )}
            </p>
            <label>
              {tr('Your lower bound')}
              <input aria-label={tr('Predicted TSP lower bound')} value={guess} onChange={(e) => setGuess(e.target.value)} />
            </label>
            <button
              className="tp-primary"
              onClick={() =>
                setFeedback(
                  guess.trim() && Number(guess) === 38
                    ? 'Correct: 10 + 9 + 7 + 6 + 6 = 38. Do not add another return minimum.'
                    : 'Try again: include the endpoint edge and each unvisited outgoing edge once: 10 + 9 + 7 + 6 + 6.',
                )
              }
            >
              {tr('Check lower bound')}
            </button>
            {feedback && <p role="status">{tr(feedback)}</p>}
          </Panel>
          <Panel title={tr('Compute the Complete Tour Cost')} icon={<Trophy />}>
            <p>{tr('Tour 1 → 2 → 4 → 5 → 3 → 1 uses edges of cost 10, 9, 6, 7 and 8. What is its cost?')}</p>
            <label>
              {tr('Your tour cost')}
              <input aria-label={tr('Predicted TSP tour cost')} value={tourGuess} onChange={(e) => setTourGuess(e.target.value)} />
            </label>
            <button
              className="tp-primary"
              onClick={() =>
                setTourFeedback(
                  tourGuess.trim() && Number(tourGuess) === 40
                    ? 'Correct: 10 + 9 + 6 + 7 + 8 = 40. Symmetry does not mean doubling a closed tour cost.'
                    : 'Try again: add the five traveled edges once, including the return from city 3 to city 1.',
                )
              }
            >
              {tr('Check tour cost')}
            </button>
            {tourFeedback && <p role="status">{tr(tourFeedback)}</p>}
          </Panel>
          <Panel title={tr('Does a Heuristic Prove Optimality?')} icon={<ShieldCheck />}>
            <p>{tr('Nearest-neighbor finds a feasible tour of cost 40. Is that alone a proof of optimality?')}</p>
            <button
              onClick={() =>
                setProofFeedback('Reconsider: a heuristic may miss a cheaper tour. A valid lower-bound certificate or exhaustive safe pruning is still needed.')
              }
            >
              {tr('Yes')}
            </button>
            <button
              onClick={() =>
                setProofFeedback('Correct. A feasible tour is an upper bound. It becomes certified only when all remaining lower bounds are at least its cost.')
              }
            >
              {tr('No')}
            </button>
            {proofFeedback && <p role="status">{tr(proofFeedback)}</p>}
          </Panel>
          {reviewControl}
        </div>
      ) : tab === 'Experiments' ? (
        <div className="tp-experiments">
          <Panel title={tr('TSP Experiment Controls')} icon={<ClipboardList />}>
            <p>
              {tr(
                'Edit a complete symmetric matrix for 1–8 cities, including zero-cost edges. Try another start city or disable the heuristic seed. Step Back retains the last 100 processed states.',
              )}
            </p>
            <div className="tp-experiment-controls">
              <button onClick={edit}>
                <Pencil size={15} />
                {tr('Edit matrix')}
              </button>
              <button onClick={() => load(tspFive)}>{tr('Load 5-city example')}</button>
              <button onClick={() => load(tspFour)}>{tr('Load 4-city example')}</button>
              <label>
                {tr('Node budget')}
                <select aria-label={tr('TSP node budget')} value={budget} onChange={(e) => setBudget(Number(e.target.value))}>
                  <option value={4095}>4095</option>
                  <option value={16383}>16383</option>
                </select>
              </label>
              <label>
                {tr('Playback delay')}
                <input
                  aria-label={tr('TSP playback delay')}
                  type="range"
                  min="100"
                  max="1600"
                  step="100"
                  value={speed}
                  onChange={(e) => setSpeed(Number(e.target.value))}
                />
              </label>
              <Switch
                label={tr('Seed a nearest-neighbor tour')}
                value={state.seeded}
                onChange={(value) => {
                  setPlaying(false)
                  setTimeline({ state: createTsp(state.matrix, state.source, value), past: [] })
                  setSelected(0)
                  setNodePage(0)
                  setFrontPage(0)
                }}
              />
            </div>
            <div className="tp-experiment-playback">
              <button className="tp-primary" onClick={step} disabled={state.complete}>
                {tr(state.paused ? 'Resume next node' : 'Process next node')}
              </button>
              <button onClick={() => setPlaying(!playing)} disabled={state.complete || state.paused}>
                {tr(playing && !state.complete ? 'Pause search' : 'Play search')}
              </button>
              <button onClick={back} disabled={!timeline.past.length}>
                {tr('Step Back')}
              </button>
            </div>
            <p className="tp-live-message" role="status">
              {tr(state.message)}
            </p>
            <p className="tp-certificate">{tr(certified ? `Optimal tour cost ${state.best!.cost} is proved.` : 'Optimality is not yet proved.')}</p>
            <p>{tr(`Generated ${state.nodes.length}; expanded ${state.expanded}; pruned ${state.pruned}; processed ${state.explored}.`)}</p>
          </Panel>
          <Panel title={tr('All Generated Partial Tours')} icon={<GitFork />}>
            <p>
              {tr('Select any node to inspect its bound terms and ancestor path. The tree shows a focused preview; this table includes every generated node.')}
            </p>
            <div className="tp-all-nodes">
              <table>
                <thead>
                  <tr>
                    {['ID', 'Partial tour', 'Cost', 'Lower bound', 'Status'].map((s) => (
                      <th key={s}>{tr(s)}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {state.nodes.slice(nodePage * 25, nodePage * 25 + 25).map((n) => (
                    <tr key={n.id}>
                      <td>
                        <button
                          aria-label={tr(`Inspect generated TSP node ${n.id}`)}
                          onClick={() => {
                            select(n.id)
                            setTab('Visualization')
                          }}
                        >
                          {n.id}
                        </button>
                      </td>
                      <td>{tourLabel(n.path)}</td>
                      <td>{n.lower.cost}</td>
                      <td>{n.lower.value}</td>
                      <td>{tr(n.status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="tp-pagination">
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
          {reviewControl}
        </div>
      ) : (
        <Panel title={tr('Your TSP Learning Notes')} icon={<BookOpen />} className="tp-notes">
          <LanguageSelector />
          <label>
            {tr('Explain the difference between a partial path, an incumbent tour, and a lower-bound certificate.')}
            <textarea aria-label={tr('TSP learning notes')} rows={8} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </label>
          <p>{tr('Notes and section review progress are saved automatically in this browser.')}</p>
          <button
            aria-label={tr('Toggle color theme')}
            onClick={() => (props.onToggleTheme ? props.onToggleTheme() : setFallbackTheme(theme === 'dark' ? 'light' : 'dark'))}
          >
            {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />} {tr('Toggle color theme')}
          </button>
          {reviewControl}
        </Panel>
      )}
      <dialog
        ref={dialog}
        className="tp-dialog"
        aria-label={tr(modal === 'matrix' ? 'Edit TSP matrix' : 'TSP lower bound proof')}
        onCancel={() => setModal(null)}
        onClose={() => setModal(null)}
      >
        <button className="tp-close" aria-label={tr('Close TSP dialog')} onClick={() => setModal(null)}>
          <X />
        </button>
        {modal === 'matrix' ? (
          <>
            <h2>{tr('Edit TSP matrix')}</h2>
            <p>
              {tr(
                'Enter a square symmetric matrix, one row per line. Distances are integers 0–999, diagonal 0. All city pairs have an edge, including zero-cost edges. Support: 1–8 cities.',
              )}
            </p>
            <label>
              {tr('Distance matrix')}
              <textarea aria-label={tr('TSP distance matrix rows')} rows={8} value={matrixText} onChange={(e) => setMatrixText(e.target.value)} />
            </label>
            <label>
              {tr('Start city')}
              <input aria-label={tr('TSP start city')} type="number" min="1" max="8" value={sourceText} onChange={(e) => setSourceText(e.target.value)} />
            </label>
            {error && <p role="alert">{tr(error)}</p>}
            <button className="tp-primary" onClick={apply}>
              {tr('Apply matrix')}
            </button>
          </>
        ) : (
          <>
            <h2>{tr('Why the outgoing-edge bound is safe')}</h2>
            <p>
              {tr(
                'For a partial path with unvisited set U, every completion must leave the endpoint toward U. Each unvisited city must then leave toward another unvisited city or the start. Its actual outgoing edge costs at least the minimum among those allowed choices.',
              )}
            </p>
            <p>
              {tr(
                'Add those independent minima to the already fixed path cost. No required outgoing edge is omitted or counted twice. Relaxing destination consistency can create subtours, making this bound weaker, but never too large. If U is empty, add the single actual return edge.',
              )}
            </p>
            <p>{tr(`Selected node ${tourLabel(node.path)}: ${node.lower.cost} + ${node.lower.terms.map((t) => t.cost).join(' + ')} = ${node.lower.value}.`)}</p>
            <ul>
              {node.lower.terms.map((t) => (
                <li key={t.from}>
                  {tr(`From city ${t.from + 1}, allowed destinations {${t.allowed.map((v) => v + 1).join(', ')}}; minimum ${t.cost} at city ${t.to + 1}.`)}
                </li>
              ))}
            </ul>
            <p>
              {tr(
                'A complete feasible tour supplies an upper bound. When every frontier lower bound is at least that upper bound, the bounds meet and optimality is proved.',
              )}
            </p>
          </>
        )}
      </dialog>
    </div>
  )
}
