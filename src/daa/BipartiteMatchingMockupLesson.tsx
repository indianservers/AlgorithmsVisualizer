// @localized-render
import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  BookOpen,
  Bookmark,
  Check,
  Code2,
  FileText,
  Heart,
  Info,
  Lightbulb,
  Moon,
  Pause,
  Play,
  RotateCcw,
  Search,
  Settings,
  ShieldCheck,
  SkipBack,
  SkipForward,
  Sun,
  TriangleAlert,
  UserRound,
  X,
} from 'lucide-react'
import { tx, useLocaleRender } from '../i18n/render'
import { AccountControl } from '../account/AccountControl'
import { LanguageSelector } from '../i18n/LanguageSelector'
import { allModules } from '../algorithms'
import { algorithmPath } from '../utils/routing'
import { persistentString, usePersistentState } from '../hooks/usePersistentState'
import { MockupTabs, type MockupPageProps, type MockupTab } from './MockupLessonChrome'
import {
  flipMatchingPath,
  matchingGraph,
  matchingPath,
  matchingStart,
  parseMatchingInput,
  reroutingGraph,
  solveBipartiteMatching,
  validateMatching,
  type MatchingGraph,
  type MatchingPair,
} from './bipartiteMatchingModel'
import './bipartite-matching-mockup.css'
const tr = (s: string) => tx(s, 'studios'),
  tabs: MockupTab[] = ['Learn', 'Visualization', 'Code', 'Practice', 'Experiments', 'Notes']
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
    <section className={`bp-panel ${className}`}>
      <header>
        <span className="bp-icon">{icon}</span>
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
function Switch({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="bp-switch">
      <input type="checkbox" aria-label={label} checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <i />
      {label}
    </label>
  )
}
function MatchingDiagram({
  graph,
  matching,
  path,
  after,
  labels,
  highlight,
  stage,
  onEdge,
  onVertex,
}: {
  graph: MatchingGraph
  matching: MatchingPair[]
  path: number[]
  after: boolean
  labels: boolean
  highlight: boolean
  stage: number
  onEdge: (pair: MatchingPair) => void
  onVertex: (v: number) => void
}) {
  const id = useId().replace(/:/g, ''),
    radius = (v: number) => Math.min(after ? 21 : 23, (after ? 151 : 173) / Math.max(1, (v <= graph.left ? graph.left : graph.right) - 1) / 2 - 3),
    point = (v: number) =>
      v <= graph.left
        ? [after ? 118 : 112, graph.left === 1 ? 130 : (after ? 53 : 57) + ((v - 1) * (after ? 151 : 173)) / (graph.left - 1)]
        : [after ? 338 : 351, graph.right === 1 ? 130 : (after ? 53 : 57) + ((v - graph.left - 1) * (after ? 151 : 173)) / (graph.right - 1)],
    matched = new Set(matching.map((p) => p.join(':')))
  return (
    <div className="bp-diagram-scroll" role="region" aria-label={tr(after ? 'Scrollable result graph' : 'Scrollable original graph')} tabIndex={0}>
      <svg
        className={`bp-diagram ${after ? 'bp-after-diagram' : 'bp-before-diagram'}`}
        viewBox={after ? '0 0 460 230' : '0 0 460 260'}
        preserveAspectRatio="none"
        aria-label={tr(after ? 'Bipartite graph after the selected augmentation' : 'Original bipartite graph')}
      >
        <defs>
          <radialGradient id={`${id}-left`} cx="35%" cy="30%" r="75%">
            <stop stopColor="#f6fbff" />
            <stop offset="1" stopColor="#b6dbff" />
          </radialGradient>
          <radialGradient id={`${id}-right`} cx="35%" cy="30%" r="75%">
            <stop stopColor="#fff8fb" />
            <stop offset="1" stopColor="#ffbed9" />
          </radialGradient>
          <marker id={`${id}-green`} markerUnits="userSpaceOnUse" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto">
            <path d="M0 0L9 5L0 10L3 5Z" fill="#00a348" />
          </marker>
          <marker id={`${id}-orange`} markerUnits="userSpaceOnUse" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto">
            <path d="M0 0L9 5L0 10L3 5Z" fill="#ff5c16" />
          </marker>
        </defs>
        <text className="bp-partition-label bp-left-label" x="58" y={after ? 10 : 15}>
          {tr('U (Left Partition)')}
        </text>
        <text className="bp-partition-label bp-right-label" x="296" y={after ? 10 : 15}>
          {tr('V (Right Partition)')}
        </text>
        {graph.edges.map((pair) => {
          const [x1, y1] = point(pair[0]),
            [x2, y2] = point(pair[1]),
            isMatched = matched.has(pair.join(':')),
            isPath =
              !after &&
              highlight &&
              path.some((v, i) => i < path.length - 1 && ((v === pair[0] && path[i + 1] === pair[1]) || (v === pair[1] && path[i + 1] === pair[0]))),
            angle = Math.atan2(y2 - y1, x2 - x1),
            r = Math.min(radius(pair[0]), radius(pair[1]))
          return (
            <g
              key={pair.join(':')}
              className={`bp-graph-edge ${isMatched ? 'bp-matched-edge' : ''} ${isPath ? 'bp-path-edge' : ''} ${after && stage >= 2 ? 'bp-flipped-edge' : ''}`}
              data-matching-edge={pair.join('-')}
              role="button"
              tabIndex={0}
              aria-label={tr(`Inspect ${after ? 'result' : 'original'} edge ${pair[0]} to ${pair[1]}`)}
              onClick={() => onEdge(pair)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  onEdge(pair)
                }
              }}
            >
              <rect
                x={Math.min(x1, x2)}
                y={Math.min(y1, y2) - 7}
                width={Math.abs(x2 - x1)}
                height={Math.abs(y2 - y1) + 14}
                fill="transparent"
                pointerEvents="none"
              />
              <path
                d={`M${x1 + r * Math.cos(angle)} ${y1 + r * Math.sin(angle)}L${x2 - r * Math.cos(angle)} ${y2 - r * Math.sin(angle)}`}
                stroke="transparent"
                strokeWidth="14"
              />
              <path
                d={`M${x1 + r * Math.cos(angle)} ${y1 + r * Math.sin(angle)}L${x2 - r * Math.cos(angle)} ${y2 - r * Math.sin(angle)}`}
                stroke={isPath ? '#ff5c16' : isMatched ? '#00a348' : '#9baec5'}
                strokeWidth={isMatched || isPath ? 4.5 : 1.5}
                strokeDasharray={isPath ? '10 5' : undefined}
                markerEnd={isPath || isMatched ? `url(#${id}-${isPath ? 'orange' : 'green'})` : undefined}
              />
            </g>
          )
        })}
        {Array.from({ length: graph.left + graph.right }, (_, i) => i + 1).map((v) => {
          const [x, y] = point(v)
          return (
            <g
              key={v}
              className={`bp-vertex ${v <= graph.left ? 'bp-u-vertex' : 'bp-v-vertex'}`}
              role="button"
              tabIndex={0}
              aria-label={tr(`Inspect ${after ? 'result' : 'original'} vertex ${v}`)}
              onClick={() => onVertex(v)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  onVertex(v)
                }
              }}
            >
              <circle cx={x} cy={y} r={radius(v)} fill={`url(#${id}-${v <= graph.left ? 'left' : 'right'})`} />
              {labels && (
                <text x={x} y={y + 7} textAnchor="middle">
                  {v}
                </text>
              )}
            </g>
          )
        })}
      </svg>
    </div>
  )
}
const matchingCode = `M = initial valid matching
for each free vertex u in U:
  BFS alternating graph from u:
    U → V uses edges outside M
    V → U uses edges inside M
  if a free v in V is reached:
    path = reconstruct BFS parents
    M = M symmetric_difference path.edges
return M

Certificate: alternate from every free U vertex.
If Z is the set reached, (U \\ Z) ∪ (V ∩ Z)
is a vertex cover of size |M| after termination.`
export function BipartiteMatchingMockupLesson(props: MockupPageProps) {
  useLocaleRender()
  const navigate = useNavigate(),
    [tab, setTab] = useState<MockupTab>('Visualization'),
    [graph, setGraph] = useState<MatchingGraph>(() => structuredClone(matchingGraph)),
    [base, setBase] = useState<MatchingPair[]>(() => structuredClone(matchingStart)),
    [start, setStart] = useState(2)
  const searchPlan = useMemo(() => matchingPath(graph, base, start), [graph, base, start])
  const after = useMemo(() => (searchPlan.path.length ? flipMatchingPath(graph, base, searchPlan.path) : base), [graph, base, searchPlan])
  const maximum = useMemo(() => solveBipartiteMatching(graph, base), [graph, base])
  const [stage, setStage] = useState(0),
    [playing, setPlaying] = useState(false),
    [speed, setSpeed] = useState(700),
    [labels, setLabels] = useState(true),
    [showPath, setShowPath] = useState(true),
    [example, setExample] = useState('small'),
    [modal, setModal] = useState<'edit' | 'edge' | 'vertex' | 'worked' | null>(null),
    dialog = useRef<HTMLDialogElement>(null),
    editor = useRef<HTMLTextAreaElement>(null),
    [draft, setDraft] = useState(''),
    [error, setError] = useState(''),
    [pair, setPair] = useState<MatchingPair>([1, 4]),
    [vertex, setVertex] = useState(1),
    [notice, setNotice] = useState(''),
    [prediction, setPrediction] = useState(''),
    [feedback, setFeedback] = useState(''),
    [query, setQuery] = useState(''),
    searchRef = useRef<HTMLInputElement>(null),
    [localTheme, setLocalTheme] = useState(() => localStorage.getItem('algodrishti-theme') ?? 'light')
  const [notes, setNotes] = usePersistentState('algodrishti-bipartite-notes', '', persistentString),
    [reviewed, setReviewed] = usePersistentState<number[]>('algodrishti-bipartite-reviewed', [], {
      deserialize: (value) => {
        try {
          const a: unknown = JSON.parse(value)
          return Array.isArray(a) ? [...new Set(a.filter((v): v is number => Number.isInteger(v) && v >= 0 && v < 6))] : []
        } catch {
          return []
        }
      },
    })
  const theme = props.theme ?? localTheme,
    studied = props.completed.includes(props.module.id),
    limit = Math.min(graph.left, graph.right),
    perfect = graph.left === graph.right && after.length === graph.left,
    current = stage >= 2 ? after : base,
    matches = query.trim() ? allModules.filter((m) => `${m.name} ${m.summary}`.toLowerCase().includes(query.toLowerCase())).slice(0, 5) : []
  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem('algodrishti-theme', theme)
  }, [theme])
  useEffect(() => {
    if (modal) {
      dialog.current?.showModal()
      if (modal === 'edit') editor.current?.focus()
    } else dialog.current?.close()
  }, [modal])
  useEffect(() => {
    if (!playing) return
    const timer = setTimeout(() => {
      setStage(stage + 1)
      if (stage + 1 === 3) setPlaying(false)
    }, speed)
    return () => clearTimeout(timer)
  }, [playing, stage, speed])
  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        searchRef.current?.focus()
      }
    }
    window.addEventListener('keydown', handle)
    return () => window.removeEventListener('keydown', handle)
  }, [])
  function load(next: MatchingGraph, matching: MatchingPair[], id: string) {
    validateMatching(next, matching)
    matchingPath(next, matching, 1)
    setGraph(structuredClone(next))
    setBase(structuredClone(matching))
    setStart(Array.from({ length: next.left }, (_, i) => i + 1).find((u) => !matching.some((p) => p[0] === u)) ?? 1)
    setStage(0)
    setPlaying(false)
    setExample(id)
    setError('')
    setNotice('')
    setFeedback('')
  }
  function openEditor() {
    setDraft(JSON.stringify({ ...graph, matching: current }, null, 2))
    setError('')
    setPlaying(false)
    setModal('edit')
  }
  function selectExample(id: string) {
    if (id === 'custom') {
      setExample('custom')
      openEditor()
    } else if (id === 'reroute') load(reroutingGraph, matchingStart, id)
    else if (id === 'empty') load(matchingGraph, [], id)
    else if (id === 'unbalanced')
      load(
        {
          left: 2,
          right: 3,
          edges: [
            [1, 3],
            [1, 4],
            [2, 3],
          ],
        },
        [],
        id,
      )
    else if (id === 'blocked') load({ left: 2, right: 2, edges: [[2, 4]] }, [], id)
    else load(matchingGraph, matchingStart, 'small')
  }
  function move(next: number) {
    setStage(next)
    setPlaying(false)
  }
  function togglePlay() {
    if (!searchPlan.path.length) return
    if (playing) {
      setPlaying(false)
      return
    }
    if (stage === 3) setStage(0)
    setPlaying(true)
  }
  function chooseStart(u: number) {
    setStart(u)
    setStage(0)
    setPlaying(false)
    setNotice('')
  }
  function nextAugmentation() {
    const free = Array.from({ length: graph.left }, (_, i) => i + 1).filter((u) => !current.some((p) => p[0] === u)),
      next = free.find((u) => matchingPath(graph, current, u).path.length)
    setBase(structuredClone(current))
    setStart(next ?? free[0] ?? 1)
    setStage(0)
    setPlaying(false)
    setNotice(next ? 'Next augmenting path found.' : 'No free U vertex has an augmenting path. The matching is maximum.')
  }
  function inspectEdge(edge: MatchingPair) {
    setPair(edge)
    setError('')
    setModal('edge')
    setPlaying(false)
  }
  function toggleEdge() {
    try {
      const exists = base.some((p) => p[0] === pair[0] && p[1] === pair[1]),
        next = exists ? base.filter((p) => p[0] !== pair[0] || p[1] !== pair[1]) : [...base, pair]
      validateMatching(graph, next)
      load(graph, next, 'custom')
      setModal(null)
    } catch (e) {
      setError((e as Error).message)
    }
  }
  const reviewIndex = tabs.indexOf(tab),
    review = (
      <button
        className="bp-review"
        aria-pressed={reviewed.includes(reviewIndex)}
        onClick={() => setReviewed(reviewed.includes(reviewIndex) ? reviewed.filter((v) => v !== reviewIndex) : [...reviewed, reviewIndex])}
      >
        <Check size={15} />
        {tr(reviewed.includes(reviewIndex) ? 'Section reviewed' : 'Mark section reviewed')}
      </button>
    )
  const steps = [
    ['Start from free vertex', 'Choose an unmatched vertex u ∈ U.'],
    ['Find augmenting path', 'Use BFS to find an alternating path to a free vertex in V.'],
    ['Flip edges', 'Add unmatched edges to M and remove matched edges on the path.'],
    ['Increase matching', 'Matching size increases by 1.'],
  ]
  const footer = (
    <div className="bp-footer-grid">
      <Panel title={tr('Key Takeaways')} icon={<Lightbulb />} className="bp-takeaways">
        <ul>
          {[
            'Bipartite matching finds a maximum set of disjoint edges between two partitions.',
            'An augmenting path alternates between unmatched and matched edges.',
            'Flipping an augmenting path increases the matching size by exactly 1.',
            'Repeat until no augmenting path exists from any free vertex in U.',
          ].map((s) => (
            <li key={s}>{tr(s)}</li>
          ))}
        </ul>
      </Panel>
      <Panel
        title={tr('Worked Example')}
        icon={<FileText />}
        className="bp-worked"
        action={
          <button className="bp-primary" onClick={() => setModal('worked')}>
            {tr('Try It')}
          </button>
        }
      >
        <p>
          {tr(
            `U = {${Array.from({ length: graph.left }, (_, i) => i + 1).join(', ')}}, V = {${Array.from({ length: graph.right }, (_, i) => graph.left + i + 1).join(', ')}}.`,
          )}
        </p>
        <p>{tr(`E = {${graph.edges.map((p) => `(${p.join(', ')})`).join(', ')}}.`)}</p>
        <p>{tr(`Start with M = {${base.map((p) => `(${p.join(', ')})`).join(', ')}}. Start vertex: ${start}.`)}</p>
        <p>{tr(`Path: ${searchPlan.path.join(' → ') || 'none'}. Flip its edges to obtain ${after.length} matching edges.`)}</p>
        <p>{tr('A rerouting example demonstrates why a greedy choice may need to be undone.')}</p>
      </Panel>
      <Panel title={tr('Correctness & Complexity')} icon={<BarChart3 />} className="bp-proof">
        <ul>
          <li>
            <b>{tr('Correctness:')}</b>{' '}
            {tr('Flipping an augmenting path increases size by 1. By Berge’s lemma, a matching is maximum iff no augmenting path exists.')}
          </li>
          <li>
            <b>{tr('Time Complexity:')}</b> {'O(V(V + E))'} {tr('for repeated BFS; often written O(VE) after discarding isolated vertices.')}
          </li>
          <li>
            <b>{tr('Auxiliary Space:')}</b> {'O(V + E).'}
          </li>
        </ul>
      </Panel>
      <Panel title={tr('Common Pitfalls')} icon={<TriangleAlert />} className="bp-pitfalls">
        <ul>
          {[
            'Forgetting to alternate between unmatched and matched edges.',
            'Not checking if the ending vertex in V is free.',
            'Incorrectly updating the matching when flipping the path.',
            'Assuming a greedy local choice gives maximum matching.',
          ].map((s) => (
            <li key={s}>{tr(s)}</li>
          ))}
        </ul>
      </Panel>
    </div>
  )
  return (
    <div className={`mom-page target-visual bipartite-matching-page ${after.length > 3 ? 'bp-long-matching' : ''}`} data-target="29" data-stage={stage}>
      <div className="mom-topbar bp-topbar">
        <button className="bp-back" aria-label={tr('Back to maximum flow')} onClick={() => navigate('/daa-extensions/edmonds-karp')}>
          <ArrowLeft size={18} />
        </button>
        <div className="mom-search">
          <Search size={17} />
          <input
            ref={searchRef}
            aria-label={tr('Search topics')}
            placeholder={tr('Search topics, algorithms, or keywords…')}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button className="bp-search-key" aria-label={tr('Focus topic search')} onClick={() => searchRef.current?.focus()}>
            {'⌘ K'}
          </button>
          {matches.length > 0 && (
            <div className="mom-search-results">
              {matches.map((m) => (
                <button key={m.id} onClick={() => navigate(algorithmPath(m))}>
                  {m.name}
                </button>
              ))}
            </div>
          )}
        </div>
        <button className="mom-study" aria-pressed={studied} onClick={() => props.toggleCompleted(props.module.id)}>
          {studied ? <Check size={16} /> : <Bookmark size={16} />} {tr(studied ? 'Studied' : 'Mark studied')}
        </button>
        <AccountControl showLanguage={false} />
      </div>
      <header className="bp-lesson-header">
        <button className="bp-back" aria-label={tr('Open maximum-flow lesson')} onClick={() => navigate('/daa-extensions/edmonds-karp')}>
          <ArrowLeft size={20} />
        </button>
        <div className="bp-title-row">
          <h1>{tr('Bipartite Matching')}</h1>
          <p>{tr('Increase a matching through augmenting paths.')}</p>
          <span aria-hidden="true">{tr('DAA Extensions')}</span>
        </div>
        <div className="bp-progress" aria-label={tr(`${reviewed.length} of 6 sections reviewed`)}>
          <span>{tr(`${reviewed.length} of 6 sections`)}</span>
          <div>
            {tabs.map((s, i) => (
              <i key={s} className={reviewed.includes(i) ? 'bp-reviewed' : ''} />
            ))}
          </div>
        </div>
        <button className="bp-primary bp-start" onClick={() => setTab('Learn')}>
          {tr('Start Learning')}
          <ArrowRight size={18} />
        </button>
      </header>
      <MockupTabs
        tabs={tabs}
        active={tab}
        onChange={(t) => {
          setTab(t)
          setPlaying(false)
        }}
      />
      {tab === 'Visualization' ? (
        <>
          <section className="bp-visualization">
            <header className="bp-visual-heading">
              <BarChart3 />
              <div>
                <h2>{tr('Interactive Visualization')}</h2>
                <p>{tr('Explore bipartite matching augmenting paths. Select a starting unmatched vertex and find a path.')}</p>
              </div>
              <div className="bp-visual-options">
                <label>
                  {tr('Example:')}
                  <select aria-label={tr('Bipartite graph example')} value={example} onChange={(e) => selectExample(e.target.value)}>
                    <option value="small">{tr('1. Small Graph (6 vertices)')}</option>
                    <option value="reroute">{tr('2. Rerouting an existing match')}</option>
                    <option value="empty">{tr('3. Empty matching')}</option>
                    <option value="unbalanced">{tr('4. Unequal partitions')}</option>
                    <option value="blocked">{tr('5. One blocked starting vertex')}</option>
                    <option value="custom">{tr('Custom graph and matching…')}</option>
                  </select>
                </label>
                <Switch label={tr('Show vertex labels')} checked={labels} onChange={setLabels} />
                <Switch label={tr('Show alternating path')} checked={showPath} onChange={setShowPath} />
                <button
                  onClick={() => {
                    load(matchingGraph, matchingStart, 'small')
                    setLabels(true)
                    setShowPath(true)
                  }}
                >
                  <RotateCcw size={16} />
                  {tr('Reset')}
                </button>
              </div>
            </header>
            <div className="bp-workspace-grid">
              <div className="bp-left-workspace">
                <div className="bp-graph-and-animation">
                  <Panel
                    title={tr('Bipartite Graph (original)')}
                    subtitle={tr('Two partitions U and V with edges E.')}
                    icon={<UserRound />}
                    className="bp-original-panel"
                    action={
                      <div className="bp-partition-badges">
                        <span>{`|U| = ${graph.left}`}</span>
                        <span>{`|V| = ${graph.right}`}</span>
                      </div>
                    }
                  >
                    <MatchingDiagram
                      graph={graph}
                      matching={base}
                      path={searchPlan.path}
                      after={false}
                      labels={labels}
                      highlight={showPath}
                      stage={stage}
                      onEdge={inspectEdge}
                      onVertex={(v) => {
                        setVertex(v)
                        setModal('vertex')
                        setPlaying(false)
                      }}
                    />
                    <div className="bp-graph-legend">
                      <span>
                        <i />
                        {tr('Matched edge (in M)')}
                      </span>
                      <span>
                        <i />
                        {tr('Augmenting path')}
                      </span>
                      <span>
                        <i />
                        {tr('Other edge')}
                      </span>
                    </div>
                  </Panel>
                  <Panel
                    title={tr('Augmenting Path Animation')}
                    subtitle={tr('Select an unmatched vertex in U and find an augmenting path to increase the matching.')}
                    icon={<Play />}
                    className="bp-animation-panel"
                  >
                    <div className="bp-instruction">
                      <i>{'1'}</i>
                      <div>
                        <h3>{tr('Choose starting unmatched vertex (in U)')}</h3>
                        <div className="bp-starting-vertices">
                          {Array.from({ length: graph.left }, (_, i) => i + 1).map((u) => (
                            <button
                              key={u}
                              aria-label={tr(`Start from vertex ${u}`)}
                              aria-pressed={u === start}
                              title={base.some((p) => p[0] === u) ? tr('Already matched; choose a free starting vertex.') : tr('Free starting vertex')}
                              onClick={() => chooseStart(u)}
                            >
                              {u}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="bp-instruction">
                      <i>{'2'}</i>
                      <div>
                        <h3>{tr('Animate augmenting path')}</h3>
                        <button className="bp-primary bp-animate" disabled={!searchPlan.path.length} onClick={togglePlay}>
                          {playing ? <Pause size={16} /> : <Play size={16} />} {tr(playing ? 'Pause Augmenting Path' : 'Animate Augmenting Path')}
                        </button>
                      </div>
                    </div>
                    <div className="bp-path-explanation" role={!searchPlan.path.length ? 'status' : undefined}>
                      <Info size={18} />
                      <p>
                        {tr(
                          searchPlan.path.length
                            ? 'An augmenting path starts at a free vertex in U, alternates between unmatched and matched edges, and ends at a free vertex in V. Flipping the path increases the matching size by 1.'
                            : searchPlan.reason,
                        )}
                      </p>
                    </div>
                  </Panel>
                </div>
                <Panel title={tr('Augmentation Steps')} icon={<FileText />} className="bp-steps-panel">
                  <div className="bp-stage-track">
                    {steps.map(([title, description], i) => (
                      <button
                        key={title}
                        aria-label={tr(`Matching stage ${i + 1}`)}
                        aria-pressed={stage === i}
                        disabled={!searchPlan.path.length && i >= 2}
                        onClick={() => move(i)}
                      >
                        <i>{i + 1}</i>
                        <b>{tr(title)}</b>
                        <span>{tr(description)}</span>
                      </button>
                    ))}
                  </div>
                </Panel>
              </div>
              <div className="bp-right-workspace">
                <Panel
                  title={tr('Graph after Augmentation')}
                  subtitle={tr('Preview matching after flipping the selected path.')}
                  icon={<Heart />}
                  className="bp-result-panel"
                  action={
                    <div className="bp-size-badge">
                      <span>{tr('Matching size')}</span>
                      <strong>
                        {after.length}
                        {' / '}
                        {limit}
                      </strong>
                    </div>
                  }
                >
                  <MatchingDiagram
                    graph={graph}
                    matching={after}
                    path={[]}
                    after
                    labels={labels}
                    highlight={false}
                    stage={stage}
                    onEdge={inspectEdge}
                    onVertex={(v) => {
                      setVertex(v)
                      setModal('vertex')
                      setPlaying(false)
                    }}
                  />
                </Panel>
                <Panel
                  title={tr('Current Matching')}
                  subtitle={tr(stage >= 2 ? 'Edges in matching M after the flip:' : 'Preview edges after the selected flip:')}
                  icon={<RotateCcw />}
                  className="bp-current-panel"
                >
                  <pre>{after.map((p) => `(${p.join(', ')})`).join('\n') || '∅'}</pre>
                  <div className="bp-current-size">
                    <span>{tr('Matching size')}</span>
                    <strong>
                      {after.length}
                      {' / '}
                      {limit}
                    </strong>
                  </div>
                  <div className={`bp-result-status ${perfect ? 'bp-perfect' : ''}`}>
                    <Check size={17} />
                    {tr(perfect ? 'Perfect matching found!' : after.length === maximum.size ? 'Maximum matching found.' : 'Further augmentations possible.')}
                  </div>
                </Panel>
                <Panel title={tr('Animation Controls')} icon={<Settings />} className="bp-controls">
                  <div className="bp-control-buttons">
                    <button disabled={stage === 0} onClick={() => move(stage - 1)}>
                      <SkipBack size={16} />
                      {tr('Step Back')}
                    </button>
                    <button disabled={!searchPlan.path.length} onClick={togglePlay}>
                      {playing ? <Pause size={16} /> : <Play size={16} />} {tr(playing ? 'Pause' : 'Play')}
                    </button>
                    <button disabled={stage === 3 || (!searchPlan.path.length && stage >= 1)} onClick={() => move(stage + 1)}>
                      <SkipForward size={16} />
                      {tr('Step Forward')}
                    </button>
                  </div>
                  <label className="bp-speed">
                    {tr('Animation speed')}
                    <input
                      aria-label={tr('Matching animation speed')}
                      type="range"
                      min="100"
                      max="1400"
                      step="100"
                      value={1500 - speed}
                      onChange={(e) => setSpeed(1500 - Number(e.target.value))}
                    />
                    <select
                      aria-label={tr('Matching speed preset')}
                      value={speed === 100 ? 'fast' : speed === 1400 ? 'slow' : 'normal'}
                      onChange={(e) => setSpeed(e.target.value === 'fast' ? 100 : e.target.value === 'slow' ? 1400 : 700)}
                    >
                      <option value="normal">{tr('Normal')}</option>
                      <option value="fast">{tr('Fast')}</option>
                      <option value="slow">{tr('Slow')}</option>
                    </select>
                  </label>
                </Panel>
              </div>
            </div>
          </section>
          {footer}
          {review}
        </>
      ) : tab === 'Learn' ? (
        <div className="bp-learning">
          <Panel title={tr('Match Vertices Without Sharing Endpoints')} icon={<BookOpen />}>
            <p>
              {tr(
                'A bipartite graph separates vertices into U and V; every edge crosses between the two. A matching is a set of edges that share no endpoint. Maximum means greatest possible cardinality. A maximal matching merely has no immediately addable edge, and can still be smaller.',
              )}
            </p>
            <div className="bp-concept-grid">
              <article>
                <h3>{tr('Start free')}</h3>
                <p>
                  {tr(
                    'Pick an unmatched vertex in U. In the alternating graph, travel from U to V only on edges outside M; travel from V back to U only on edges inside M.',
                  )}
                </p>
              </article>
              <article>
                <h3>{tr('Reroute when needed')}</h3>
                <p>
                  {tr(
                    'If a right vertex already has a mate, follow that matching edge backward. Continue until reaching a free right vertex. This allows an earlier local choice to be undone.',
                  )}
                </p>
              </article>
              <article>
                <h3>{tr('Flip the entire path')}</h3>
                <p>
                  {tr(
                    'The free-to-free path has one more unmatched edge than matched edge. Symmetric difference adds its unmatched edges and removes its matched edges, so the size grows by exactly one.',
                  )}
                </p>
              </article>
            </div>
            <p>
              {tr(
                'Search every free U vertex before concluding that there is no augmenting path. At termination, alternating reachability yields a vertex cover whose size equals the matching. That equal-size certificate proves optimality.',
              )}
            </p>
            <a href="https://algs4.cs.princeton.edu/code/javadoc/edu/princeton/cs/algs4/BipartiteMatching.html" target="_blank" rel="noreferrer">
              {tr('Princeton Algorithms: bipartite matching and vertex cover')}
            </a>
            <button className="bp-primary" onClick={() => setTab('Visualization')}>
              {tr('Explore the matching')}
            </button>
          </Panel>
          <Panel title={tr('Worked Rerouting Example')} icon={<RotateCcw />}>
            <p>
              {tr(
                'With M = {(1,4),(3,6)}, vertex 2 is free. In the rerouting preset, its only neighbor 4 is already matched. The valid path 2 → 4 → 1 → 5 removes (1,4) and adds (2,4),(1,5), increasing the size from 2 to 3.',
              )}
            </p>
            <button
              onClick={() => {
                load(reroutingGraph, matchingStart, 'reroute')
                setTab('Visualization')
              }}
            >
              {tr('Load the rerouting example')}
            </button>
          </Panel>
          {footer}
          {review}
        </div>
      ) : tab === 'Code' ? (
        <Panel title={tr('Alternating BFS and Symmetric Difference')} icon={<Code2 />} className="bp-code">
          <pre>{matchingCode}</pre>
          <p>
            {tr(
              'The BFS builds adjacency lists and visits each vertex once. Repeating it for at most |U| free starting vertices gives O(|U|(V+E)) time and O(V+E) auxiliary space. Isolated vertices explain the explicit V term.',
            )}
          </p>
          <button onClick={() => setTab('Experiments')}>{tr('Inspect the certificate and BFS parents')}</button>
          {review}
        </Panel>
      ) : tab === 'Practice' ? (
        <div className="bp-practice">
          <Panel title={tr('Predict the Matching Size After the Flip')} icon={<Lightbulb />}>
            <p>{tr(`Before the flip, |M| = ${base.length}. The selected path is ${searchPlan.path.join(' → ') || 'absent'}. What matching size results?`)}</p>
            <input aria-label={tr('Predicted matching size')} value={prediction} onChange={(e) => setPrediction(e.target.value)} />
            <button
              className="bp-primary"
              onClick={() =>
                setFeedback(
                  prediction.trim() && Number(prediction) === after.length
                    ? 'Correct: a valid augmenting path increases size by exactly one; without a path nothing is flipped.'
                    : 'Try again: count added unmatched edges and removed matched edges.',
                )
              }
            >
              {tr('Check prediction')}
            </button>
            {feedback && <p role="status">{tr(feedback)}</p>}
          </Panel>
          <Panel title={tr('Does One Failed Starting Vertex Prove Maximum?')} icon={<ShieldCheck />}>
            <button onClick={() => setFeedback('Correct: another free vertex may still have an augmenting path.')}>
              {tr('Search every free vertex in U')}
            </button>
            <button onClick={() => setFeedback('Reconsider: absence of a path from one free vertex does not rule out paths from other free vertices.')}>
              {tr('Stop after the first failed search')}
            </button>
          </Panel>
          <Panel title={tr('Perfect or Just Maximum?')} icon={<Heart />}>
            <p>
              {tr(
                'A perfect matching covers every vertex in both partitions. Unequal partition sizes make perfection impossible, even when a maximum matching saturates the smaller partition.',
              )}
            </p>
          </Panel>
          {review}
        </div>
      ) : tab === 'Experiments' ? (
        <div className="bp-experiments">
          <Panel title={tr('Graph and Matching Laboratory')} icon={<Settings />}>
            <div className="bp-lab-actions">
              <button className="bp-primary" onClick={openEditor}>
                {tr('Edit graph and matching JSON')}
              </button>
              <button onClick={() => load(graph, [], 'custom')}>{tr('Clear matching')}</button>
              <button onClick={nextAugmentation}>{tr('Find next augmentation')}</button>
              <button
                onClick={() => {
                  load(graph, maximum.matching, 'custom')
                  setNotice('Loaded a maximum matching certified by an equal-size vertex cover.')
                }}
              >
                {tr('Find maximum matching')}
              </button>
            </div>
            <p className="bp-current-status" role="status">
              {tr(`Current matching size: ${current.length}. Selected path: ${searchPlan.path.join(' → ') || 'none'}. Maximum size: ${maximum.size}.`)}
            </p>
            {notice && <p>{tr(notice)}</p>}
            <p>
              {tr(
                `Minimum vertex cover: {${maximum.cover.join(', ')}}. It covers every graph edge and has ${maximum.cover.length} vertices, equal to the maximum matching size.`,
              )}
            </p>
            <table className="bp-bfs-table">
              <caption>{tr('Selected alternating BFS')}</caption>
              <thead>
                <tr>
                  <th>{tr('Vertex')}</th>
                  <th>{tr('Parent')}</th>
                  <th>{tr('Reached')}</th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: graph.left + graph.right }, (_, i) => i + 1).map((v) => (
                  <tr key={v}>
                    <td>{v}</td>
                    <td>{searchPlan.parent[v] ?? '—'}</td>
                    <td>{tr(searchPlan.order.includes(v) ? 'Yes' : 'No')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p>{tr(searchPlan.reason)}</p>
            <p>{tr('Click graph edges to inspect them and add or remove them from the initial matching. Conflicting endpoints are rejected.')}</p>
            <button onClick={() => setTab('Visualization')}>{tr('Return to graph visualization')}</button>
          </Panel>
          {review}
        </div>
      ) : (
        <Panel title={tr('Your Bipartite Matching Notes')} icon={<BookOpen />} className="bp-notes">
          <LanguageSelector />
          <label>
            {tr('Explain alternation, free endpoints, symmetric difference and the optimality certificate.')}
            <textarea aria-label={tr('Bipartite matching notes')} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </label>
          <p>{tr('Notes and reviewed sections are saved automatically in this browser.')}</p>
          <button
            aria-label={tr('Toggle color theme')}
            onClick={() => (props.onToggleTheme ? props.onToggleTheme() : setLocalTheme(theme === 'dark' ? 'light' : 'dark'))}
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />} {tr('Toggle color theme')}
          </button>
          {review}
        </Panel>
      )}
      <dialog
        ref={dialog}
        className="bp-dialog"
        aria-label={tr(
          modal === 'edit'
            ? 'Edit bipartite graph'
            : modal === 'edge'
              ? 'Inspect matching edge'
              : modal === 'vertex'
                ? 'Inspect matching vertex'
                : 'Worked bipartite matching example',
        )}
        onCancel={() => setModal(null)}
      >
        <button className="bp-close" aria-label={tr('Close matching dialog')} onClick={() => setModal(null)}>
          <X size={18} />
        </button>
        {modal === 'edit' ? (
          <>
            <h2>{tr('Edit Graph and Initial Matching')}</h2>
            <p>
              {tr(
                'Use 1–5 vertices per partition. U is numbered 1…left; V is numbered left+1…left+right. Every edge must cross partitions. Matching edges must exist and have disjoint endpoints.',
              )}
            </p>
            <textarea ref={editor} aria-label={tr('Bipartite graph JSON')} value={draft} onChange={(e) => setDraft(e.target.value)} />
            {error && <p role="alert">{tr(error)}</p>}
            <button
              className="bp-primary"
              onClick={() => {
                try {
                  const next = parseMatchingInput(draft)
                  load(next.graph, next.matching, 'custom')
                  setModal(null)
                } catch (e) {
                  setError((e as Error).message)
                }
              }}
            >
              {tr('Apply bipartite graph')}
            </button>
          </>
        ) : modal === 'edge' ? (
          <>
            <h2>{tr(`Graph edge (${pair.join(', ')})`)}</h2>
            <p>
              {tr(
                `In original matching: ${base.some((p) => p[0] === pair[0] && p[1] === pair[1]) ? 'yes' : 'no'}. In result matching: ${after.some((p) => p[0] === pair[0] && p[1] === pair[1]) ? 'yes' : 'no'}.`,
              )}
            </p>
            <p>{tr('Edits change the initial matching and restart the selected augmentation.')}</p>
            {error && <p role="alert">{tr(error)}</p>}
            <button className="bp-primary" onClick={toggleEdge}>
              {tr(base.some((p) => p[0] === pair[0] && p[1] === pair[1]) ? 'Remove edge from matching' : 'Add edge to matching')}
            </button>
          </>
        ) : modal === 'vertex' ? (
          <>
            <h2>{tr(`Vertex ${vertex} in partition ${vertex <= graph.left ? 'U' : 'V'}`)}</h2>
            <p>
              {tr(
                `Original mate: ${base.find((p) => p.includes(vertex))?.find((v) => v !== vertex) ?? 'free'}. Result mate: ${after.find((p) => p.includes(vertex))?.find((v) => v !== vertex) ?? 'free'}.`,
              )}
            </p>
            {vertex <= graph.left && (
              <button
                onClick={() => {
                  chooseStart(vertex)
                  setModal(null)
                }}
              >
                {tr('Use as starting vertex')}
              </button>
            )}
          </>
        ) : (
          <>
            <h2>{tr('One Augmentation, Exactly One More Edge')}</h2>
            <p>{tr(`Before: {${base.map((p) => `(${p.join(', ')})`).join(', ')}}. Path: ${searchPlan.path.join(' → ') || 'none'}.`)}</p>
            <p>{tr(`After: {${after.map((p) => `(${p.join(', ')})`).join(', ')}}. Size ${base.length} → ${after.length}.`)}</p>
            <p>
              {tr(
                'Preview panels show the result of this selected path. The original panel remains the before snapshot; the playback controls replay the four steps.',
              )}
            </p>
            <button
              className="bp-primary"
              disabled={!searchPlan.path.length}
              onClick={() => {
                setModal(null)
                setTab('Visualization')
                setStage(0)
                setPlaying(true)
              }}
            >
              {tr('Play this augmentation')}
            </button>
          </>
        )}
      </dialog>
    </div>
  )
}
