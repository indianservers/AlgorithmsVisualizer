// @localized-render
import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  BookOpen,
  Check,
  ChevronLeft,
  ChevronRight,
  Code2,
  FileText,
  Lightbulb,
  Link2,
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
  Table2,
  Target,
  TriangleAlert,
  UserRound,
  X,
} from 'lucide-react'
import { tx, useLocaleRender } from '../i18n/render'
import { LanguageSelector } from '../i18n/LanguageSelector'
import { AccountControl } from '../account/AccountControl'
import { allModules } from '../algorithms'
import { algorithmPath } from '../utils/routing'
import { persistentString, usePersistentState } from '../hooks/usePersistentState'
import { MockupTabs, type MockupPageProps, type MockupTab } from './MockupLessonChrome'
import { bridgeComponents, bridgeExample, parseBridgeGraph, runBridgeLesson, type BridgeFrame, type BridgeGraph } from './bridgeLessonModel'
import './bridges-mockup.css'
const tr = (s: string) => tx(s, 'studios'),
  tabs: MockupTab[] = ['Learn', 'Visualization', 'Code', 'Practice', 'Experiments', 'Notes'],
  value = (v: number) => (v < 0 ? '—' : String(v))
function BridgeBars() {
  return (
    <svg viewBox="0 0 28 28" fill="currentColor" aria-hidden="true">
      <rect x="3" y="15" width="5" height="11" rx="1.5" opacity=".65" />
      <rect x="10" y="8" width="5" height="18" rx="1.5" opacity=".85" />
      <rect x="17" y="2" width="5" height="24" rx="1.5" />
    </svg>
  )
}
function DfsDocument() {
  return (
    <svg viewBox="0 0 28 28" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M6 2H17L24 9V24Q24 26 22 26H6Q4 26 4 24V4Q4 2 6 2Z" />
      <path d="M17 2V9H24" />
      <path d="M10 12L18 16L10 20Z" fill="#a9d4ff" />
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
    <section className={`br-panel ${className}`}>
      <header>
        <span className="br-icon">{icon}</span>
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
    <label className="br-switch">
      <input type="checkbox" aria-label={label} checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <i />
      {label}
    </label>
  )
}
function BridgeDiagram({
  graph,
  state,
  selected,
  labels,
  values,
  onVertex,
  onEdge,
}: {
  graph: BridgeGraph
  state: BridgeFrame
  selected: number
  labels: boolean
  values: boolean
  onVertex: (v: number) => void
  onEdge: (e: number) => void
}) {
  const id = useId().replace(/:/g, ''),
    point = (v: number) =>
      graph.vertices === 6
        ? [
            [206, 64],
            [128, 140],
            [300, 140],
            [123, 238],
            [300, 236],
            [437, 234],
          ][v - 1]
        : [
            260 + 185 * Math.cos(-Math.PI / 2 + ((v - 1) * 2 * Math.PI) / graph.vertices),
            147 + 105 * Math.sin(-Math.PI / 2 + ((v - 1) * 2 * Math.PI) / graph.vertices),
          ],
    radius = graph.vertices > 6 ? 19 : 22
  return (
    <div className="br-diagram-scroll" role="region" tabIndex={0} aria-label={tr('Scrollable DFS graph')}>
      <svg className="br-diagram" viewBox="0 0 520 300" preserveAspectRatio="none" aria-label={tr('Undirected graph with DFS and bridge classifications')}>
        <defs>
          {[
            ['node', '#ffffff', '#b7ddff'],
            ['gold', '#fff5ad', '#ffce63'],
            ['rose', '#fff9fb', '#ffdae4'],
          ].map(([name, light, dark]) => (
            <radialGradient key={name} id={`${id}-${name}`} cx="34%" cy="25%" r="80%">
              <stop stopColor={light} />
              <stop offset="1" stopColor={dark} />
            </radialGradient>
          ))}
        </defs>
        {graph.edges.map(([u, v], edge) => {
          const [a, b] = point(u),
            [c, d] = point(v),
            group = graph.edges.flatMap(([x, y], i) => ((x === u && y === v) || (x === v && y === u) ? [i] : [])),
            bend = (group.indexOf(edge) - (group.length - 1) / 2) * 24 * (u <= v ? 1 : -1),
            distance = Math.hypot(c - a, d - b) || 1,
            cx = (a + c) / 2 - ((d - b) / distance) * bend,
            cy = (b + d) / 2 + ((c - a) / distance) * bend,
            kind = state.bridges.includes(edge) ? 'bridge' : state.tree.includes(edge) ? 'tree' : state.back.includes(edge) ? 'back' : 'unvisited',
            path = u === v ? `M${a + 14} ${b - 12}C${a + 61} ${b - 65} ${a - 61} ${b - 65} ${a - 14} ${b - 12}` : `M${a} ${b}Q${cx} ${cy} ${c} ${d}`
          return (
            <g
              key={edge}
              className={`br-edge br-${kind}-edge`}
              data-bridge-edge={edge}
              role="button"
              tabIndex={0}
              aria-label={tr(`Inspect graph edge ${edge + 1}: ${u} to ${v}`)}
              onClick={() => onEdge(edge)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  onEdge(edge)
                }
              }}
            >
              <rect
                x={Math.min(a, c) - 7}
                y={Math.min(b, d) - 7 - (u === v ? 55 : Math.abs(bend))}
                width={Math.max(14, Math.abs(c - a) + 14)}
                height={Math.max(14, Math.abs(d - b) + 14 + (u === v ? 55 : Math.abs(bend) * 2))}
                fill="transparent"
                pointerEvents="none"
              />
              <path d={path} fill="none" stroke="transparent" strokeWidth="14" />
              <path d={path} fill="none" />
            </g>
          )
        })}
        {Array.from({ length: graph.vertices }, (_, i) => i + 1).map((v) => {
          const [x, y] = point(v),
            incident = state.bridges.some((e) => graph.edges[e].includes(v)),
            offset =
              graph.vertices === 6
                ? [
                    [-25, -61],
                    [-76, -35],
                    [24, -50],
                    [-72, 10],
                    [24, 11],
                    [24, -61],
                  ][v - 1]
                : [v % 2 ? 23 : -65, v % 2 ? -34 : 24]
          return (
            <g
              key={v}
              className={`br-vertex ${selected === v ? 'br-selected-vertex' : ''} ${incident && selected !== v ? 'br-bridge-vertex' : ''}`}
              role="button"
              tabIndex={0}
              aria-label={tr(`Inspect DFS vertex ${v}`)}
              onClick={() => onVertex(v)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  onVertex(v)
                }
              }}
            >
              <circle cx={x} cy={y} r={radius} style={{ fill: `url(#${id}-${selected === v ? 'gold' : incident ? 'rose' : 'node'})` }} />
              {labels && (
                <text className="br-vertex-label" x={x} y={y + 6} textAnchor="middle">
                  {v}
                </text>
              )}
              {values && (
                <g className="br-value-chip" transform={`translate(${x + offset[0]},${y + offset[1]})`}>
                  <rect width="49" height="36" rx="5" />
                  <text x="24.5" y="15" textAnchor="middle">{`tin=${value(state.tin[v])}`}</text>
                  <text x="24.5" y="29" textAnchor="middle">{`low=${value(state.low[v])}`}</text>
                </g>
              )}
            </g>
          )
        })}
      </svg>
    </div>
  )
}
const bridgeCode = `timer = 0
DFS(u, parentEdgeId):
  tin[u] = low[u] = timer++
  for (v, edgeId) in adjacency[u]:
    if edgeId == parentEdgeId: continue
    if tin[v] == -1:
      parent[v] = u
      DFS(v, edgeId)
      low[u] = min(low[u], low[v])
      if low[v] > tin[u]: edgeId is a BRIDGE
      if u is not a root and low[v] >= tin[u]: u is a cut vertex
    else:
      low[u] = min(low[u], tin[v])
  if u is a root and has >1 DFS children: u is a cut vertex
for each undiscovered u: DFS(u, no_parent_edge)`
export function BridgesMockupLesson(props: MockupPageProps) {
  useLocaleRender()
  const navigate = useNavigate(),
    [tab, setTab] = useState<MockupTab>('Visualization'),
    [graph, setGraph] = useState<BridgeGraph>(() => structuredClone(bridgeExample))
  const run = useMemo(() => runBridgeLesson(graph), [graph])
  const [cursor, setCursor] = useState(() => runBridgeLesson(bridgeExample).defaultCursor),
    [selected, setSelected] = useState(3),
    [example, setExample] = useState('default'),
    [playing, setPlaying] = useState(false),
    [speed, setSpeed] = useState(700),
    [finalValues, setFinalValues] = useState(true),
    [labels, setLabels] = useState(true),
    [values, setValues] = useState(true),
    [modal, setModal] = useState<'edit' | 'edge' | 'worked' | null>(null),
    dialog = useRef<HTMLDialogElement>(null),
    editor = useRef<HTMLTextAreaElement>(null),
    [draft, setDraft] = useState(''),
    [error, setError] = useState(''),
    [edge, setEdge] = useState(3),
    [prediction, setPrediction] = useState(''),
    [feedback, setFeedback] = useState(''),
    [query, setQuery] = useState(''),
    search = useRef<HTMLInputElement>(null),
    timeline = useRef<HTMLDivElement>(null),
    [localTheme, setLocalTheme] = useState(() => localStorage.getItem('algodrishti-theme') ?? 'light')
  const [notes, setNotes] = usePersistentState('algodrishti-bridges-notes', '', persistentString),
    [reviewed, setReviewed] = usePersistentState<number[]>('algodrishti-bridges-reviewed', [], {
      deserialize: (text) => {
        try {
          const a: unknown = JSON.parse(text)
          return Array.isArray(a) ? [...new Set(a.filter((v): v is number => Number.isInteger(v) && v >= 0 && v < 6))] : []
        } catch {
          return []
        }
      },
    })
  const frame = run.frames[cursor],
    shown = finalValues ? run.final : frame,
    theme = props.theme ?? localTheme,
    studied = props.completed.includes(props.module.id),
    matches = query.trim() ? allModules.filter((m) => `${m.name} ${m.summary}`.toLowerCase().includes(query.toLowerCase())).slice(0, 5) : [],
    chosenEdge = graph.edges[edge],
    removed = chosenEdge ? bridgeComponents(graph, edge) : [],
    incident = shown.bridges.filter((e) => graph.edges[e].includes(selected)),
    firstBridge = run.final.bridges[0],
    sampleEdge = firstBridge === undefined ? undefined : graph.edges[firstBridge],
    sampleChild = sampleEdge ? (run.final.parent[sampleEdge[0]] === sampleEdge[1] ? sampleEdge[0] : sampleEdge[1]) : undefined,
    sampleParent = sampleChild === undefined ? undefined : run.final.parent[sampleChild],
    edgeLabel = (e: number) => graph.edges[e].join(' — ')
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
      const next = cursor + 1
      setCursor(next)
      setSelected(run.frames[next].vertex)
      if (next === run.frames.length - 1) setPlaying(false)
    }, speed)
    return () => clearTimeout(timer)
  }, [playing, cursor, run, speed])
  useEffect(() => {
    if (!playing) return
    const el = timeline.current?.querySelector<HTMLElement>(`[data-step="${cursor}"]`),
      container = timeline.current
    if (el && container) {
      const top = el.offsetTop - container.offsetTop
      if (top < container.scrollTop) container.scrollTop = top
      else if (top + el.offsetHeight > container.scrollTop + container.clientHeight) container.scrollTop = top + el.offsetHeight - container.clientHeight
    }
  }, [cursor, playing])
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
  function load(next: BridgeGraph, id: string) {
    const calculated = runBridgeLesson(next)
    setGraph(structuredClone(next))
    setCursor(calculated.defaultCursor)
    setSelected(calculated.frames[calculated.defaultCursor].vertex)
    setPlaying(false)
    setFinalValues(true)
    setExample(id)
    setError('')
    setFeedback('')
    if (timeline.current) timeline.current.scrollTop = 0
  }
  function openEditor() {
    setDraft(JSON.stringify(graph, null, 2))
    setError('')
    setModal('edit')
    setPlaying(false)
  }
  function chooseExample(id: string) {
    if (id === 'custom') {
      setExample('custom')
      openEditor()
    } else if (id === 'chain')
      load(
        {
          vertices: 6,
          start: 1,
          edges: [
            [1, 2],
            [2, 3],
            [3, 4],
            [4, 5],
            [5, 6],
          ],
        },
        id,
      )
    else if (id === 'cycle')
      load(
        {
          vertices: 6,
          start: 1,
          edges: [
            [1, 2],
            [2, 3],
            [3, 4],
            [4, 5],
            [5, 6],
            [6, 1],
          ],
        },
        id,
      )
    else if (id === 'parallel')
      load(
        {
          vertices: 3,
          start: 1,
          edges: [
            [1, 2],
            [1, 2],
            [2, 3],
          ],
        },
        id,
      )
    else if (id === 'disconnected')
      load(
        {
          vertices: 6,
          start: 1,
          edges: [
            [1, 2],
            [2, 3],
            [3, 1],
            [4, 5],
          ],
        },
        id,
      )
    else load(bridgeExample, 'default')
  }
  function move(next: number) {
    setCursor(next)
    setSelected(run.frames[next].vertex)
    setPlaying(false)
    setFinalValues(false)
  }
  function togglePlay() {
    if (playing) {
      setPlaying(false)
      return
    }
    if (cursor === run.frames.length - 1) setCursor(0)
    setFinalValues(false)
    setPlaying(true)
  }
  function inspect(e: number) {
    setEdge(e)
    setModal('edge')
    setPlaying(false)
  }
  const reviewIndex = tabs.indexOf(tab),
    review = (
      <button
        className="br-review"
        aria-pressed={reviewed.includes(reviewIndex)}
        onClick={() => setReviewed(reviewed.includes(reviewIndex) ? reviewed.filter((v) => v !== reviewIndex) : [...reviewed, reviewIndex])}
      >
        <Check size={15} />
        {tr(reviewed.includes(reviewIndex) ? 'Section reviewed' : 'Mark section reviewed')}
      </button>
    )
  const footer = (
    <div className="br-footer-grid">
      <Panel title={tr('Key Takeaways')} icon={<Lightbulb />} className="br-takeaways">
        <ul>
          {[
            'An edge (u, v) is a bridge if there is no back edge from v’s subtree to u or an ancestor of u.',
            'Use DFS to compute discovery times tin[v] and low-link values low[v].',
            'If low[v] > tin[u] for a tree edge (u, v), then (u, v) is a bridge.',
            'Each edge is processed once in each direction.',
          ].map((s) => (
            <li key={s}>{tr(s)}</li>
          ))}
        </ul>
      </Panel>
      <Panel
        title={tr('Worked Example')}
        icon={<FileText />}
        className="br-worked"
        action={
          <button
            className="br-primary"
            onClick={() => {
              setModal('worked')
              setPlaying(false)
            }}
          >
            {tr('Try It')}
          </button>
        }
      >
        <p>{tr(sampleEdge ? `In the shown graph, edge ${sampleEdge.join(' — ')} is a bridge.` : 'This graph has no bridge edges.')}</p>
        <div>
          {sampleChild !== undefined && sampleParent !== undefined ? (
            <ul>
              <li>{tr(`DFS visits child ${sampleChild} from ${sampleParent}.`)}</li>
              <li>{tr(`Its subtree has no back edge to ${sampleParent} or an ancestor.`)}</li>
              <li>
                {tr(
                  `low[${sampleChild}] = ${run.final.low[sampleChild]} > tin[${sampleParent}] = ${run.final.tin[sampleParent]}; therefore this tree edge is a bridge.`,
                )}
              </li>
              <li>
                {tr(
                  `Removing it yields ${bridgeComponents(graph, firstBridge)
                    .map((c) => `{${c.join(', ')}}`)
                    .join(' and ')}.`,
                )}
              </li>
            </ul>
          ) : (
            <p>{tr('Every graph edge lies on a cycle, or there are no edges. Test removal to confirm the component count does not increase.')}</p>
          )}
        </div>
      </Panel>
      <Panel title={tr('Correctness & Complexity')} icon={<BridgeBars />} className="br-proof">
        <ul>
          <li>
            <b>{tr('Correctness:')}</b> {tr('low[v] is the earliest discovery time reachable from its DFS subtree using tree edges and at most one back edge.')}
          </li>
          <li>{tr('A tree edge (u, v) is a bridge iff low[v] > tin[u].')}</li>
          <li>
            <b>{tr('Time Complexity:')}</b> {'O(V + E)'}
          </li>
          <li>
            <b>{tr('Auxiliary Space:')}</b> {'O(V + E)'}
          </li>
          <li>{tr('Edge IDs distinguish the parent edge from parallel edges.')}</li>
        </ul>
      </Panel>
      <Panel title={tr('Common Mistakes')} icon={<TriangleAlert />} className="br-mistakes">
        <ul>
          {[
            'Forgetting to ignore the parent edge when processing neighbors.',
            'Not using low-link values correctly.',
            'Confusing bridges with articulation points (they are related but different).',
            'Not handling multiple edges/parallel edges properly.',
            'Assuming directed graph logic applies to undirected graphs.',
          ].map((s) => (
            <li key={s}>{tr(s)}</li>
          ))}
        </ul>
      </Panel>
    </div>
  )
  return (
    <div className="mom-page target-visual bridges-page" data-target="30">
      <div className="mom-topbar br-topbar">
        <button className="br-back" aria-label={tr('Back to bipartite matching')} onClick={() => navigate('/daa-extensions/bipartite-matching')}>
          <ArrowLeft size={18} />
        </button>
        <div className="mom-search">
          <Search size={17} />
          <input
            ref={search}
            aria-label={tr('Search topics')}
            placeholder={tr('Search topics, algorithms, or keywords…')}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button className="br-search-key" aria-label={tr('Focus topic search')} onClick={() => search.current?.focus()}>
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
      <header className="br-lesson-header">
        <button className="br-back" aria-label={tr('Open bipartite matching lesson')} onClick={() => navigate('/daa-extensions/bipartite-matching')}>
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1>{tr('Graph Bridges')}</h1>
          <p>{tr('Track DFS discovery times and lowlink values to find all bridge edges.')}</p>
        </div>
        <div className="br-progress" aria-label={tr(`${reviewed.length} of 6 sections reviewed`)}>
          <span>{tr(`${reviewed.length} of 6 sections`)}</span>
          <div>
            {tabs.map((s, i) => (
              <i key={s} className={reviewed.includes(i) ? 'br-reviewed' : ''} />
            ))}
          </div>
        </div>
        <button className="br-primary br-start" onClick={() => setTab('Learn')}>
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
          <section className="br-visualization">
            <header className="br-visual-heading">
              <BridgeBars />
              <div>
                <h2>{tr('Interactive Visualization')}</h2>
                <p>{tr('Run DFS to see discovery times tin[v], low[v] values and identify bridge edges.')}</p>
              </div>
              <div className="br-visual-options">
                <select aria-label={tr('Bridge graph example')} value={example} onChange={(e) => chooseExample(e.target.value)}>
                  <option value="default">{tr('Example: Default Graph')}</option>
                  <option value="chain">{tr('Chain: every edge is a bridge')}</option>
                  <option value="cycle">{tr('Cycle: no bridges')}</option>
                  <option value="parallel">{tr('Parallel parent edges')}</option>
                  <option value="disconnected">{tr('Disconnected graph')}</option>
                  <option value="custom">{tr('Custom graph…')}</option>
                </select>
                <Switch label={tr('Show vertex labels')} checked={labels} onChange={setLabels} />
                <Switch label={tr('Show values (tin/low)')} checked={values} onChange={setValues} />
                <button
                  onClick={() => {
                    load(bridgeExample, 'default')
                    setLabels(true)
                    setValues(true)
                  }}
                >
                  <RotateCcw size={17} />
                  {tr('Reset')}
                </button>
              </div>
            </header>
            <div className="br-dashboard-grid">
              <Panel
                title={tr('Graph G (original)')}
                subtitle={tr(`Undirected graph with ${graph.vertices} vertices`)}
                icon={<UserRound />}
                className="br-original-panel"
                action={
                  <div className="br-graph-badges">
                    <span>{`|V| = ${graph.vertices}`}</span>
                    <span>{`|E| = ${graph.edges.length}`}</span>
                  </div>
                }
              >
                <BridgeDiagram graph={graph} state={shown} selected={selected} labels={labels} values={values} onVertex={setSelected} onEdge={inspect} />
                <div className="br-graph-legend">
                  <span>
                    <i />
                    {tr('DFS tree edge')}
                  </span>
                  <span>
                    <i />
                    {tr('Back edge')}
                  </span>
                  <span>
                    <i />
                    {tr('Bridge edge')}
                  </span>
                  <span>
                    <i />
                    {tr('Unvisited edge')}
                  </span>
                </div>
              </Panel>
              <Panel title={tr('DFS Traversal Order')} icon={<DfsDocument />} className="br-traversal-panel">
                <div className="br-playback">
                  <button aria-label={tr('Previous DFS step')} disabled={cursor === 0} onClick={() => move(cursor - 1)}>
                    <SkipBack size={15} />
                  </button>
                  <button className="br-primary" aria-label={tr(playing ? 'Pause DFS playback' : 'Play DFS playback')} onClick={togglePlay}>
                    {playing ? <Pause size={15} /> : <Play size={15} />}
                  </button>
                  <button aria-label={tr('Next DFS step')} disabled={cursor === run.frames.length - 1} onClick={() => move(cursor + 1)}>
                    <SkipForward size={15} />
                  </button>
                  <span>{tr(`Step ${cursor + 1} / ${run.frames.length}`)}</span>
                </div>
                <div className="br-timeline" ref={timeline}>
                  {run.frames.map((f, i) => (
                    <button
                      key={i}
                      className={`br-trace-row ${f.bridge ? 'br-trace-bridge' : ''}`}
                      data-step={i}
                      aria-label={tr(`DFS step ${i + 1}: ${f.title}`)}
                      aria-pressed={cursor === i}
                      onClick={() => move(i)}
                    >
                      <i>{i + 1}</i>
                      <span>
                        <b>{tr(f.title)}</b>
                        <span>{tr(f.detail)}</span>
                        {f.bridge && (
                          <strong>
                            <Link2 size={15} />
                            {tr(`Edge ${edgeLabel(f.edge!)} is a BRIDGE`)}
                          </strong>
                        )}
                      </span>
                    </button>
                  ))}
                </div>
              </Panel>
              <Panel title={tr('Node Details')} icon={<Target />} className="br-details-panel">
                <div className="br-node-picker">
                  <button aria-label={tr('Previous DFS vertex')} disabled={selected === 1} onClick={() => setSelected(selected - 1)}>
                    <ChevronLeft size={18} />
                  </button>
                  <select aria-label={tr('DFS vertex details')} value={selected} onChange={(e) => setSelected(Number(e.target.value))}>
                    {Array.from({ length: graph.vertices }, (_, i) => i + 1).map((v) => (
                      <option key={v} value={v}>
                        {tr(`Vertex ${v}`)}
                      </option>
                    ))}
                  </select>
                  <button aria-label={tr('Next DFS vertex')} disabled={selected === graph.vertices} onClick={() => setSelected(selected + 1)}>
                    <ChevronRight size={18} />
                  </button>
                </div>
                <dl>
                  <div>
                    <dt>{tr('Vertex')}</dt>
                    <dd className="br-value-amber">{selected}</dd>
                  </div>
                  <div>
                    <dt>{tr(`Discovery time tin[${selected}]`)}</dt>
                    <dd className="br-value-blue">{value(shown.tin[selected])}</dd>
                  </div>
                  <div>
                    <dt>{tr(`Low-link value low[${selected}]`)}</dt>
                    <dd className="br-value-purple">{value(shown.low[selected])}</dd>
                  </div>
                  <div>
                    <dt>{tr('Parent in DFS tree')}</dt>
                    <dd className="br-value-blue">{value(shown.parent[selected])}</dd>
                  </div>
                  <div>
                    <dt>{tr('Children')}</dt>
                    <dd className="br-value-green">
                      {shown.children[selected].length
                        ? shown.children[selected].map((v) => (
                            <button key={v} aria-label={tr(`Inspect DFS child ${v}`)} onClick={() => setSelected(v)}>
                              {v}
                            </button>
                          ))
                        : '—'}
                    </dd>
                  </div>
                  <div>
                    <dt>{tr('Is articulation point?')}</dt>
                    <dd className={shown.articulation.includes(selected) ? 'br-value-green' : 'br-value-gray'}>
                      {tr(shown.articulation.includes(selected) ? 'Yes' : 'No')}
                    </dd>
                  </div>
                  <div>
                    <dt>{tr('Incident bridges')}</dt>
                    <dd className="br-value-red">
                      {incident.length
                        ? incident.map((e) => (
                            <button key={e} aria-label={tr(`Inspect incident bridge ${edgeLabel(e)}`)} onClick={() => inspect(e)}>
                              {edgeLabel(e)}
                            </button>
                          ))
                        : '—'}
                    </dd>
                  </div>
                </dl>
              </Panel>
              <div className="br-right-column">
                <Panel title={tr('Low-link Values Table')} icon={<Table2 />} className="br-table-panel">
                  <div className="br-values-table-scroll" role="region" aria-label={tr('Scrollable low-link values')} tabIndex={0}>
                    <table className="br-values-table">
                      <caption className="br-sr-only">{tr(finalValues ? 'Final DFS values preview' : 'DFS values at the selected step')}</caption>
                      <thead>
                        <tr>
                          {['v', 'tin[v]', 'low[v]', 'parent[v]'].map((h) => (
                            <th key={h}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {Array.from({ length: graph.vertices }, (_, i) => i + 1).map((v) => (
                          <tr
                            key={v}
                            className={`${selected === v ? 'br-selected-row' : ''} ${shown.bridges.some((e) => graph.edges[e].includes(v)) ? 'br-incident-row' : ''}`}
                            onClick={() => setSelected(v)}
                          >
                            <td>
                              <button aria-label={tr(`Inspect low-link vertex ${v}`)} onClick={() => setSelected(v)}>
                                {v}
                              </button>
                            </td>
                            <td>{value(shown.tin[v])}</td>
                            <td>{value(shown.low[v])}</td>
                            <td>{value(shown.parent[v])}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Panel>
                <Panel title={tr('Edges Classification')} icon={<Link2 />} className="br-classification-panel">
                  <div className="br-classifications">
                    {[
                      ['tree', 'Tree edges (DFS)', shown.tree],
                      ['back', 'Back edges', shown.back],
                      ['bridge', 'Bridge edges', shown.bridges],
                    ].map(([kind, title, ids]) => (
                      <div key={String(kind)} className={`br-class-${kind}`}>
                        <i />
                        <div>
                          <b>{tr(String(title))}</b>
                          <span>
                            {'{ '}
                            {(ids as number[]).map((e, i) => (
                              <span key={e}>
                                {i > 0 && ', '}
                                <button aria-label={tr(`Inspect ${kind} edge ${e + 1}`)} onClick={() => inspect(e)}>
                                  {edgeLabel(e)}
                                </button>
                              </span>
                            ))}
                            {' }'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </Panel>
              </div>
            </div>
          </section>
          {footer}
          <section className="br-relation">
            <Link2 />
            <b>{tr('Relation to Articulation Point')}</b>
            <span>
              {tr(
                'For a non-root vertex u, a child v with low[v] ≥ tin[u] makes u an articulation point. DFS roots need two children. Bridges concern edges; articulation points concern vertices.',
              )}
            </span>
            <button onClick={() => navigate('/daa-extensions/articulation-points')}>
              {tr('Explore articulation points')}
              <ArrowRight size={15} />
            </button>
          </section>
          {review}
        </>
      ) : tab === 'Learn' ? (
        <div className="br-learning">
          <Panel title={tr('A Bridge Has No Alternate Route')} icon={<BookOpen />}>
            <p>
              {tr(
                'A bridge is an undirected edge whose deletion increases the number of connected components. An edge on a cycle is not a bridge: the rest of that cycle gives an alternate route. Removing a bridge separates a DFS subtree from its ancestors.',
              )}
            </p>
            <div className="br-concept-grid">
              <article>
                <h3>{tr('Discovery time tin[v]')}</h3>
                <p>
                  {tr(
                    'Assign the next integer when DFS first visits v. These times describe the actual search order, not the vertex labels. Restart DFS at an unvisited vertex to cover every disconnected component.',
                  )}
                </p>
              </article>
              <article>
                <h3>{tr('Earliest reachable time low[v]')}</h3>
                <p>
                  {tr(
                    'Start with low[v] = tin[v]. A back edge to ancestor w can lower it to tin[w]. After a child finishes, propagate its low value upward. A subtree can thereby report whether it has an escape route.',
                  )}
                </p>
              </article>
              <article>
                <h3>{tr('The strict bridge test')}</h3>
                <p>
                  {tr(
                    'For tree edge u–v, low[v] > tin[u] means the child subtree cannot return to u or an earlier ancestor. That edge is a bridge. Equality allows a return to u, so it is not a bridge.',
                  )}
                </p>
              </article>
            </div>
            <a href="https://algs4.cs.princeton.edu/41graph/index.php" target="_blank" rel="noreferrer">
              {tr('Princeton Algorithms: bridges and articulation points')}
            </a>
            <button className="br-primary" onClick={() => setTab('Visualization')}>
              {tr('Explore DFS and low-link values')}
            </button>
          </Panel>
          <Panel title={tr('Parallel Edges and the DFS Root')} icon={<ShieldCheck />}>
            <p>
              {tr(
                'Skip the exact parent edge ID, rather than all edges leading to the parent vertex. A second parallel edge is an alternate return edge and prevents a false bridge. Self-loops are never bridges. A DFS root is an articulation point only if it has more than one DFS child.',
              )}
            </p>
            <button
              onClick={() => {
                chooseExample('parallel')
                setTab('Visualization')
              }}
            >
              {tr('Explore parallel parent edges')}
            </button>
          </Panel>
          {footer}
          {review}
        </div>
      ) : tab === 'Code' ? (
        <Panel title={tr('DFS with Edge IDs and Low-Link Propagation')} icon={<Code2 />} className="br-code">
          <pre>{bridgeCode}</pre>
          <p>
            {tr(
              'The solver builds adjacency lists and processes each undirected edge in both directions, giving O(V + E) time and space. The visualization also stores replay snapshots; that history is extra storage beyond the DFS workspace.',
            )}
          </p>
          <button onClick={() => setTab('Experiments')}>{tr('Test removal and change the starting vertex')}</button>
          {review}
        </Panel>
      ) : tab === 'Practice' ? (
        <div className="br-practice">
          <Panel title={tr('Predict the Bridge Test')} icon={<Lightbulb />}>
            <p>{tr('For a DFS tree edge u–v with tin[u] = 2 and low[v] = 3, is the edge a bridge? Type yes or no.')}</p>
            <input aria-label={tr('Bridge prediction')} value={prediction} onChange={(e) => setPrediction(e.target.value)} />
            <button
              className="br-primary"
              onClick={() =>
                setFeedback(
                  prediction.trim().toLowerCase() === 'yes'
                    ? 'Correct: 3 > 2, so this subtree has no alternate return to u or its ancestors.'
                    : 'Try again: compare low[v] strictly against tin[u].',
                )
              }
            >
              {tr('Check prediction')}
            </button>
            {feedback && <p role="status">{tr(feedback)}</p>}
          </Panel>
          <Panel title={tr('What If low[v] Equals tin[u]?')} icon={<Target />}>
            <button onClick={() => setFeedback('Correct: equality gives an alternate return to u; the edge is not a bridge.')}>{tr('Not a bridge')}</button>
            <button onClick={() => setFeedback('Reconsider: the bridge test is strict. Equality does not identify a bridge.')}>{tr('Still a bridge')}</button>
          </Panel>
          <Panel title={tr('Edges Versus Vertices')} icon={<Link2 />}>
            <p>
              {tr(
                'A graph can have articulation points without any bridges, such as two cycles sharing one vertex. Always distinguish deleting one edge from deleting a vertex and all of its incident edges.',
              )}
            </p>
          </Panel>
          {review}
        </div>
      ) : tab === 'Experiments' ? (
        <div className="br-experiments">
          <Panel title={tr('Bridge Removal and DFS Laboratory')} icon={<Settings />}>
            <div className="br-lab-actions">
              <button className="br-primary" onClick={openEditor}>
                {tr('Edit undirected graph JSON')}
              </button>
              <button onClick={() => move(0)}>{tr('Restart DFS trace')}</button>
              <button onClick={() => move(run.frames.length - 1)}>{tr('Jump to final DFS state')}</button>
            </div>
            <label>
              {tr('DFS starting vertex')}
              <select aria-label={tr('DFS starting vertex')} value={graph.start} onChange={(e) => load({ ...graph, start: Number(e.target.value) }, 'custom')}>
                {Array.from({ length: graph.vertices }, (_, i) => i + 1).map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </label>
            <Switch label={tr('Preview final values while reviewing')} checked={finalValues} onChange={setFinalValues} />
            <label>
              {tr('Playback speed')}
              <select aria-label={tr('DFS playback speed')} value={speed} onChange={(e) => setSpeed(Number(e.target.value))}>
                <option value={700}>{tr('Normal')}</option>
                <option value={100}>{tr('Fast')}</option>
                <option value={1400}>{tr('Slow')}</option>
              </select>
            </label>
            <p className="br-run-summary" role="status">
              {tr(
                `${run.components.length} connected component(s); ${run.final.bridges.length} bridge edge(s); ${run.final.articulation.length} articulation point(s).`,
              )}
            </p>
            <p>{tr(`DFS stack at this step: ${frame.stack.join(' → ') || '(empty)'}.`)}</p>
            <div className="br-removal-buttons">
              {graph.edges.map(([u, v], e) => (
                <button key={e} onClick={() => inspect(e)}>
                  {tr(`Test removal of edge ${e + 1}: ${u} — ${v}`)}
                </button>
              ))}
            </div>
            <p>
              {tr(
                'The low-link table initially previews the final DFS values. Manual stepping and playback switch to values at the selected event. You can restore the final preview with the switch above.',
              )}
            </p>
            <button onClick={() => setTab('Visualization')}>{tr('Return to DFS visualization')}</button>
          </Panel>
          {review}
        </div>
      ) : (
        <Panel title={tr('Your Graph Bridges Notes')} icon={<BookOpen />} className="br-notes">
          <LanguageSelector />
          <label>
            {tr('Explain tin, low, the strict bridge inequality and why parallel parent edges matter.')}
            <textarea aria-label={tr('Graph bridges notes')} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </label>
          <p>{tr('Your notes and reviewed sections are saved in this browser.')}</p>
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
        className="br-dialog"
        aria-label={tr(modal === 'edit' ? 'Edit bridge graph' : modal === 'edge' ? 'Inspect edge removal' : 'Worked bridge example')}
        onCancel={() => setModal(null)}
      >
        <button className="br-close" aria-label={tr('Close bridge dialog')} onClick={() => setModal(null)}>
          <X size={18} />
        </button>
        {modal === 'edit' ? (
          <>
            <h2>{tr('Edit Undirected Graph')}</h2>
            <p>
              {tr(
                'Use 1–8 vertices, a starting vertex from 1 to V, and at most 20 edge pairs. Repeated edges have different IDs and are supported; self-loops are supported too.',
              )}
            </p>
            <textarea ref={editor} aria-label={tr('Undirected bridge graph JSON')} value={draft} onChange={(e) => setDraft(e.target.value)} />
            {error && <p role="alert">{tr(error)}</p>}
            <button
              className="br-primary"
              onClick={() => {
                try {
                  load(parseBridgeGraph(draft), 'custom')
                  setModal(null)
                } catch (e) {
                  setError((e as Error).message)
                }
              }}
            >
              {tr('Apply bridge graph')}
            </button>
          </>
        ) : modal === 'edge' && chosenEdge ? (
          <>
            <h2>{tr(`Edge ${edge + 1}: ${chosenEdge.join(' — ')}`)}</h2>
            <p className="br-removal-summary" role="status">
              {tr(
                `Components before removal: ${run.components.length}. Components after removal: ${removed.length}. This edge ${removed.length > run.components.length ? 'is a bridge' : 'is not a bridge'}.`,
              )}
            </p>
            <p>{tr(`After removal: ${removed.map((c) => `{${c.join(', ')}}`).join(' | ')}.`)}</p>
            <p>{tr('Only this edge ID is removed. Other parallel edges remain, so the connectivity test handles them correctly.')}</p>
            <button
              className="br-primary"
              onClick={() => {
                load({ ...graph, edges: graph.edges.filter((_, i) => i !== edge) }, 'custom')
                setModal(null)
              }}
            >
              {tr('Remove edge and rerun DFS')}
            </button>
          </>
        ) : (
          <>
            <h2>{tr('Prove a Bridge by Removing It')}</h2>
            <p>
              {tr(
                sampleEdge
                  ? `Edge ${sampleEdge.join(' — ')} satisfies low[${sampleChild}] = ${run.final.low[sampleChild!]} > tin[${sampleParent}] = ${run.final.tin[sampleParent!]}.`
                  : 'This graph has no bridge edges.',
              )}
            </p>
            {sampleEdge && (
              <p>{tr(`Deleting that edge changes the component count from ${run.components.length} to ${bridgeComponents(graph, firstBridge).length}.`)}</p>
            )}
            <p>
              {tr(
                'The graph uses consistent computed DFS values. Parent links and edge classifications follow the actual adjacency order; changing the start may change tin/low while preserving the set of bridges.',
              )}
            </p>
            <button
              className="br-primary"
              onClick={() => {
                setModal(null)
                setTab('Visualization')
                move(run.defaultCursor)
              }}
            >
              {tr('Inspect the bridge discovery step')}
            </button>
          </>
        )}
      </dialog>
    </div>
  )
}
