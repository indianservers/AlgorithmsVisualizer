// @localized-render
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  ArrowLeftRight,
  BarChart3,
  Bookmark,
  BookOpen,
  Check,
  Code2,
  FileText,
  Lightbulb,
  Moon,
  Pause,
  Play,
  RotateCcw,
  Search,
  Settings,
  Shield,
  ShieldCheck,
  SkipBack,
  SkipForward,
  Sun,
  TriangleAlert,
  UserRound,
  X,
} from 'lucide-react'
import { tx, useLocaleRender } from '../i18n/render'
import { allModules } from '../algorithms'
import { algorithmPath } from '../utils/routing'
import { AccountControl } from '../account/AccountControl'
import { usePersistentState, persistentString } from '../hooks/usePersistentState'
import { MockupTabs, type MockupPageProps, type MockupTab } from './MockupLessonChrome'
import { parseCertificateGraph, parseCertificateIds, type CertificateGraph } from './complexityClassesModel'
import { cliqueCoverInstance, cliqueCoverPresets, decodeCliqueCover, searchCliqueCover, toggleCliqueCoverEdge } from './cliqueCoverModel'
import './clique-cover-mockup.css'

const tr = (s: string) => tx(s, 'studios'),
  tabs: MockupTab[] = ['Learn', 'Visualization', 'Code', 'Practice', 'Experiments', 'Notes']
const steps = [
  ['Start with G', 'Given graph with n vertices'],
  ['Choose a clique', 'Select k mutually adjacent vertices'],
  ['Construct complement', 'Build H = G̅ on the same vertices'],
  ['Find independent set', 'The k vertices form an independent set in H'],
  ['Take vertex cover', 'V ∖ S has size n − k and covers all edges'],
  ['Conclude', 'Clique size ≥ k ↔ Vertex cover size ≤ n − k'],
]
const setLabel = (vertices: number[]) => `{${vertices.map((v) => v + 1).join(', ')}}`
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
    <section className={`cv-panel ${className}`}>
      <header>
        <span className="cv-icon">{icon}</span>
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
function Switch({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <label className="cv-switch">
      <input type="checkbox" aria-label={label} checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <i />
      {label}
    </label>
  )
}
function Graph({
  graph,
  side,
  selected,
  labels,
  paint = true,
  showEdges = true,
  visible = true,
  uncovered = [],
  onNode,
  onPair,
}: {
  graph: CertificateGraph
  side: 'source' | 'target'
  selected: number[]
  labels: boolean
  paint?: boolean
  showEdges?: boolean
  visible?: boolean
  uncovered?: [number, number][]
  onNode: (v: number) => void
  onPair: (a: number, b: number) => void
}) {
  const width = side === 'source' ? 385 : 332,
    points =
      graph.n === 6
        ? side === 'source'
          ? [
              [184, 24],
              [88, 92],
              [284, 92],
              [64, 185],
              [190, 205],
              [320, 170],
            ]
          : [
              [166, 30],
              [69, 90],
              [262, 90],
              [61, 178],
              [166, 203],
              [262, 176],
            ]
        : graph.n === 1
          ? [[width / 2, 118]]
          : Array.from({ length: graph.n }, (_, i) => [
              width / 2 + 91 * Math.sin((i * 2 * Math.PI) / graph.n),
              116 - 89 * Math.cos((i * 2 * Math.PI) / graph.n),
            ])
  return (
    <svg
      className={`cv-graph cv-graph-${side}`}
      viewBox={`0 0 ${width} 244`}
      preserveAspectRatio="xMidYMid meet"
      aria-label={tr(`${side === 'source' ? 'Original' : 'Complement'} graph: ${graph.n} vertices, ${graph.edges.length} edges`)}
    >
      {visible &&
        showEdges &&
        graph.edges.map(([a, b]) => {
          const picked = side === 'source' && paint && selected.includes(a) && selected.includes(b),
            bad = uncovered.some(([x, y]) => (x === a && y === b) || (x === b && y === a))
          return (
            <path
              key={`${a}-${b}`}
              data-graph-edge="true"
              className={bad ? 'cv-uncovered-edge' : picked ? 'cv-clique-edge' : side === 'source' ? 'cv-original-edge' : 'cv-complement-edge'}
              d={`M${points[a][0]} ${points[a][1]}L${points[b][0]} ${points[b][1]}`}
              fill="none"
              stroke={bad ? '#e72b4f' : picked ? '#ff7800' : side === 'source' ? '#859fcf' : '#12328e'}
              strokeWidth={picked ? 3 : 1.6}
              strokeDasharray={side === 'target' ? '5 4' : undefined}
              role="button"
              tabIndex={0}
              aria-label={tr(`Inspect ${side === 'source' ? 'original' : 'complement'} edge ${a + 1}, ${b + 1}`)}
              onClick={() => onPair(a, b)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  onPair(a, b)
                }
              }}
            />
          )
        })}
      {visible ? (
        points.map(([x, y], v) => {
          const picked = paint && selected.includes(v),
            gold = side === 'source'
          return (
            <g
              key={v}
              role="button"
              tabIndex={0}
              className="cv-vertex"
              aria-label={tr(side === 'source' ? `Toggle clique vertex ${v + 1} in graph` : `Inspect complement vertex ${v + 1}`)}
              aria-pressed={selected.includes(v)}
              onClick={() => onNode(v)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  onNode(v)
                }
              }}
            >
              <title>{tr(`Vertex ${v + 1}${selected.includes(v) ? '; selected' : ''}`)}</title>
              {picked && <circle cx={x} cy={y} r="27" fill={gold ? '#fff2d6' : '#e5fff0'} stroke={gold ? '#ffe5b7' : '#c8f4df'} strokeWidth="1" />}
              <circle
                cx={x}
                cy={y}
                r={picked ? 20 : 19}
                fill={picked ? (gold ? '#ffdf7d' : '#7df6a2') : '#edf5ff'}
                stroke={picked ? (gold ? '#ff8100' : '#18b45f') : '#819deb'}
                strokeWidth="1.5"
              />
              {labels && (
                <text x={x} y={y + 6} fontSize="16" textAnchor="middle" fontWeight="600" fill="#092451">
                  {v + 1}
                </text>
              )}
            </g>
          )
        })
      ) : (
        <text x={width / 2} y="118" textAnchor="middle" fill="#5273a4" fontSize="14">
          {tr('Construct H in step 3.')}
        </text>
      )}
    </svg>
  )
}
const code = `reduceCliqueToVertexCover(G, k):
    n = number_of_vertices(G)
    H = graph_with_same_vertices_and_no_edges()
    for each unordered pair {u, v}, u != v:
        if {u, v} is NOT an edge of G:
            add {u, v} to H
    return (H, n - k)

Forward witness: S clique in G -> C = V minus S covers H.
Backward witness: C covers H -> S = V minus C is a clique in G.
|S| >= k iff |C| <= n-k, since |S| + |C| = n.

Proof: a pair inside S is an edge in G iff it is NOT an edge in H.
No H edge lies entirely in S iff every H edge touches C.
Construction checks n(n-1)/2 distinct pairs: O(n²) with an adjacency lookup.
Verifying a cover checks its size, distinct IDs and all edges in H.
Finding either witness by exhaustive subset search is a separate exponential task.`
export function CliqueCoverMockupLesson(props: MockupPageProps) {
  useLocaleRender()
  const navigate = useNavigate(),
    [tab, setTab] = useState<MockupTab>('Visualization'),
    [graph, setGraph] = useState<CertificateGraph>(cliqueCoverPresets[0].graph),
    [k, setK] = useState(3),
    [selected, setSelected] = useState([0, 1, 2]),
    [example, setExample] = useState('reference'),
    [labels, setLabels] = useState(true),
    [showEdges, setShowEdges] = useState(true),
    [highlight, setHighlight] = useState(true),
    [stage, setStage] = useState(1),
    [replay, setReplay] = useState(false),
    [playing, setPlaying] = useState(false),
    [speed, setSpeed] = useState(850),
    model = cliqueCoverInstance(graph, k, selected)
  const [modal, setModal] = useState<'edit' | 'worked' | 'pair' | 'vertex' | 'proof' | null>(null),
    dialog = useRef<HTMLDialogElement>(null),
    edgeInput = useRef<HTMLTextAreaElement>(null),
    [draftN, setDraftN] = useState('6'),
    [draftK, setDraftK] = useState('3'),
    [draftEdges, setDraftEdges] = useState(''),
    [draftSelected, setDraftSelected] = useState('1, 2, 3'),
    [error, setError] = useState(''),
    [pair, setPair] = useState<[number, number]>([0, 1]),
    [vertex, setVertex] = useState(0),
    [message, setMessage] = useState(''),
    [prediction, setPrediction] = useState(''),
    [feedback, setFeedback] = useState(''),
    [reverseText, setReverseText] = useState('4, 5, 6'),
    [reverseIds, setReverseIds] = useState<number[] | null>(null),
    [reverseError, setReverseError] = useState('')
  const [query, setQuery] = useState(''),
    search = useRef<HTMLInputElement>(null),
    [fallbackTheme, setFallbackTheme] = useState(() => localStorage.getItem('algodrishti-theme') ?? 'light'),
    theme = props.theme ?? fallbackTheme,
    [notes, setNotes] = usePersistentState('algodrishti-clique-cover-notes', '', persistentString),
    [reviewed, setReviewed] = usePersistentState<number[]>('algodrishti-clique-cover-reviewed', [], {
      deserialize: (value) => {
        try {
          const p: unknown = JSON.parse(value)
          return Array.isArray(p) ? [...new Set(p.filter((v): v is number => Number.isInteger(v) && v >= 0 && v < 6))] : []
        } catch {
          return []
        }
      },
    })
  const matches = query.trim() ? allModules.filter((m) => `${m.name} ${m.summary}`.toLowerCase().includes(query.toLowerCase())).slice(0, 5) : [],
    studied = props.completed.includes(props.module.id),
    pairInG = graph.edges.some(([a, b]) => (a === pair[0] && b === pair[1]) || (a === pair[1] && b === pair[0])),
    reverse = reverseIds ? decodeCliqueCover(graph, k, reverseIds) : null,
    independentPhase = replay && stage === 4
  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem('algodrishti-theme', theme)
  }, [theme])
  useEffect(() => {
    if (modal) {
      dialog.current?.showModal()
      if (modal === 'edit') edgeInput.current?.focus()
    } else dialog.current?.close()
  }, [modal])
  useEffect(() => {
    if (!playing || stage >= 6) return
    const timer = setTimeout(() => {
      setStage(stage + 1)
      if (stage + 1 === 6) setPlaying(false)
    }, speed)
    return () => clearTimeout(timer)
  }, [playing, stage, speed])
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
  function stopReplay() {
    setPlaying(false)
    setReplay(false)
    setStage(1)
  }
  function load(id: string) {
    const next = cliqueCoverPresets.find((p) => p.id === id)!
    setGraph(next.graph)
    setK(next.k)
    setSelected(next.selected)
    setExample(id)
    setReverseText(setLabel(cliqueCoverInstance(next.graph, next.k, next.selected).cover).replace(/[{}]/g, ''))
    setReverseIds(null)
    setReverseError('')
    setMessage('')
    setFeedback('')
    stopReplay()
  }
  function reset() {
    load('reference')
    setLabels(true)
    setShowEdges(true)
    setHighlight(true)
  }
  function openEditor() {
    setDraftN(String(graph.n))
    setDraftK(String(k))
    setDraftEdges(graph.edges.map(([a, b]) => `${a + 1}-${b + 1}`).join(', '))
    setDraftSelected(selected.map((v) => v + 1).join(', '))
    setError('')
    setModal('edit')
  }
  function chooseExample(id: string) {
    if (id === 'custom') {
      setExample('custom')
      openEditor()
    } else load(id)
  }
  function applyEditor() {
    try {
      const next = parseCertificateGraph(draftN, draftEdges),
        threshold = Number(draftK),
        vertices = parseCertificateIds(draftSelected)
      if (!draftK.trim() || !Number.isInteger(threshold) || threshold < 0 || threshold > next.n) throw new Error('Use an integer k from 0 to n.')
      if (vertices.length > 8) throw new Error('Use at most 8 candidate vertex IDs.')
      cliqueCoverInstance(next, threshold, vertices)
      setGraph(next)
      setK(threshold)
      setSelected(vertices)
      setExample('custom')
      setReverseIds(null)
      setMessage('')
      stopReplay()
      setModal(null)
    } catch (e) {
      setError((e as Error).message)
    }
  }
  function toggleVertex(v: number) {
    setSelected((old) => (old.includes(v) ? old.filter((x) => x !== v) : [...old, v].sort((a, b) => a - b)))
    setMessage('')
  }
  function inspectPair(a: number, b: number) {
    setPair([a, b])
    setModal('pair')
  }
  function editPair() {
    setGraph(toggleCliqueCoverEdge(graph, pair[0], pair[1]))
    setExample('custom')
    setReverseIds(null)
    setMessage('')
    stopReplay()
  }
  function goToStep(next: number) {
    setStage(next)
    setReplay(true)
    setPlaying(false)
  }
  function animate() {
    setStage(1)
    setReplay(true)
    setPlaying(true)
  }
  function searchBoth() {
    const found = searchCliqueCover(graph, k)
    if (found.source.yes) setSelected(found.source.witness)
    if (found.target.yes) setReverseText(found.target.witness.map((v) => v + 1).join(', '))
    setMessage(
      `Source ${found.source.yes ? 'YES' : 'NO'} ⇔ Target ${found.target.yes ? 'YES' : 'NO'}. Checked ${found.source.tried} source subsets and ${found.target.tried} target subsets (at most ${found.total} each). This bounded search is separate from the O(n²) construction.`,
    )
  }
  function verifyReverse() {
    try {
      setReverseIds(parseCertificateIds(reverseText))
      setReverseError('')
    } catch (e) {
      setReverseIds(null)
      setReverseError((e as Error).message)
    }
  }
  function mapReverse() {
    if (!reverse?.valid) {
      setMessage('Supply a valid target cover before applying the reverse implication.')
      return
    }
    setSelected(reverse.selected)
    setTab('Visualization')
    setMessage('A valid target cover decoded to a clique of at least k vertices in G. This demonstrates the reverse implication.')
  }
  const reviewIndex = tabs.indexOf(tab),
    review = (
      <button
        className="cv-review"
        aria-pressed={reviewed.includes(reviewIndex)}
        onClick={() => setReviewed(reviewed.includes(reviewIndex) ? reviewed.filter((v) => v !== reviewIndex) : [...reviewed, reviewIndex])}
      >
        <Check size={15} />
        {tr(reviewed.includes(reviewIndex) ? 'Section reviewed' : 'Mark section reviewed')}
      </button>
    )
  const original = (
    <Panel
      title={tr('Graph G (original)')}
      subtitle={tr('Select a clique of size k')}
      icon={<UserRound />}
      className="cv-original-card"
      action={
        <div className="cv-badges">
          <span>{`n = ${graph.n}`}</span>
          <span>{`k = ${k}`}</span>
        </div>
      }
    >
      <Graph graph={graph} side="source" selected={selected} paint={!replay || stage >= 2} labels={labels} onNode={toggleVertex} onPair={inspectPair} />
      <div className="cv-original-legend">
        <span>
          <i className="cv-gold-dot" />
          {tr(
            model.clique.valid
              ? selected.length === k
                ? 'Selected clique vertex (size k)'
                : `Selected clique vertices (size ${selected.length})`
              : `Selected vertices (|S| = ${selected.length})`,
          )}
        </span>
        <span>
          <i className="cv-g-edge" />
          {tr('Edge in G')}
        </span>
        <span>
          <i className="cv-other-dot" />
          {tr('Other vertex')}
        </span>
      </div>
    </Panel>
  )
  const complement = (
    <Panel
      title={tr('Graph H (complement)')}
      subtitle={tr('Vertex cover of size ≤ n − k')}
      icon={<Shield />}
      className="cv-complement-card"
      action={<span className="cv-green-badge">{`n − k = ${model.targetK}`}</span>}
    >
      <Graph
        graph={model.complement}
        side="target"
        selected={independentPhase ? selected : model.cover}
        paint={independentPhase || (highlight && (!replay || stage >= 5))}
        visible={!replay || stage >= 3}
        labels={labels}
        showEdges={showEdges}
        uncovered={model.target.uncovered}
        onNode={(v) => {
          setVertex(v)
          setModal('vertex')
        }}
        onPair={inspectPair}
      />
      <div className="cv-target-legend">
        <span>
          <i className="cv-green-dot" />
          {tr(
            independentPhase
              ? `Selected independent-set candidate S = ${setLabel(selected)}`
              : model.target.valid
                ? model.cover.length === model.targetK
                  ? 'Selected vertex cover (size n − k)'
                  : `Selected vertex cover (size ${model.cover.length})`
                : `Candidate vertex cover (size ${model.cover.length})`,
          )}
        </span>
        <span>
          <i className="cv-h-edge" />
          {tr('Edge in H (complement)')}
        </span>
        <span>
          <i className="cv-other-dot" />
          {tr('Other vertex')}
        </span>
      </div>
    </Panel>
  )
  const reduction = (
    <section className="cv-reduction">
      <h2>{tr('Reduction: Take Complement')}</h2>
      <p>{tr('Construct H = G̅ on the same vertices')}</p>
      <ArrowRight />
      <div>
        <p>{tr('Add an edge in H iff it is not an edge in G.')}</p>
        <p>{tr('A clique of size k in G becomes an independent set of size k in H.')}</p>
      </div>
    </section>
  )
  const controls = (
    <Panel
      title={tr('Build and Explore')}
      subtitle={tr('Interact with the graphs to see the reduction.')}
      icon={
        <button className="cv-icon-button" aria-label={tr('Edit graph and threshold')} onClick={openEditor}>
          <Settings size={21} />
        </button>
      }
      className="cv-controls"
    >
      <h3>{tr(`Select clique vertices in G (k = ${k})`)}</h3>
      <div className="cv-selector">
        {Array.from({ length: graph.n }, (_, v) => (
          <button key={v} aria-label={tr(`Select clique vertex ${v + 1}`)} aria-pressed={selected.includes(v)} onClick={() => toggleVertex(v)}>
            {v + 1}
          </button>
        ))}
      </div>
      <h3 className="cv-options-title">{tr('Construction options')}</h3>
      <Switch label={tr('Show complement edges in H')} checked={showEdges} onChange={setShowEdges} />
      <Switch label={tr('Highlight vertex cover (V − S)')} checked={highlight} onChange={setHighlight} />
      <button className="cv-primary cv-animate" onClick={animate}>
        <Play size={15} />
        {tr('Animate Reduction Steps')}
      </button>
      {replay && (
        <div className="cv-playback">
          <div>
            <button aria-label={tr('Previous reduction step')} disabled={stage === 1} onClick={() => goToStep(stage - 1)}>
              <SkipBack size={14} />
            </button>
            <button
              aria-label={tr(playing ? 'Pause reduction' : 'Play reduction')}
              onClick={() => {
                if (stage === 6) setStage(1)
                setPlaying(!playing)
              }}
            >
              {playing ? <Pause size={14} /> : <Play size={14} />}
            </button>
            <button aria-label={tr('Next reduction step')} disabled={stage === 6} onClick={() => goToStep(stage + 1)}>
              <SkipForward size={14} />
            </button>
            <b>{`${stage}/6`}</b>
            <select aria-label={tr('Reduction playback speed')} value={speed} onChange={(e) => setSpeed(Number(e.target.value))}>
              <option value={850}>{tr('Normal')}</option>
              <option value={100}>{tr('Fast')}</option>
              <option value={1500}>{tr('Slow')}</option>
            </select>
          </div>
          <p role="status">{tr(`Step ${stage}: ${steps[stage - 1][0]}. ${steps[stage - 1][1]}`)}</p>
        </div>
      )}
    </Panel>
  )
  const sizeMapping = (
    <Panel title={tr('Size Mapping')} icon={<ArrowLeftRight />} className="cv-size-map">
      <div>
        <article>
          <b>{tr(model.clique.valid ? 'Clique in G' : 'Selected in G')}</b>
          <span>{tr(selected.length === k ? `size k = ${k}` : `size |S| = ${selected.length}`)}</span>
        </article>
        <ArrowRight />
        <article>
          <b>{tr(model.target.valid ? 'Vertex cover in H' : 'Candidate cover in H')}</b>
          <span>{tr(model.cover.length === model.targetK ? `size n − k = ${model.targetK}` : `size |V ∖ S| = ${model.cover.length}`)}</span>
        </article>
      </div>
    </Panel>
  )
  const validation = (
    <p className={`cv-validation ${model.clique.valid && model.target.valid ? 'cv-valid' : 'cv-invalid'}`} role="status">
      {tr(
        model.clique.valid && model.target.valid
          ? 'Valid clique and mapped cover: both certificates verify.'
          : !model.clique.wellFormed
            ? 'Rejected candidate: use distinct, in-range vertex IDs.'
            : selected.length < k
              ? `Only ${selected.length} vertices selected; k = ${k}. This does not prove the instance is NO.`
              : `Rejected clique: ${model.clique.missing.length} selected pairs lack an edge in G. Its complement contains ${model.target.uncovered.length} uncovered edges. A different selection may work.`,
      )}
    </p>
  )
  const footer = (
    <div className="cv-footer-grid">
      <Panel title={tr('Key Takeaways')} icon={<Lightbulb />} className="cv-takeaways">
        <ul>
          {[
            'Use the complement graph H = G̅.',
            'A clique in G is an independent set in H.',
            'Its remaining vertices cover every edge of H.',
            'The reduction takes O(n²) time.',
          ].map((s) => (
            <li key={s}>{tr(s)}</li>
          ))}
        </ul>
      </Panel>
      <Panel
        title={tr('Worked Example')}
        icon={<FileText />}
        className="cv-worked"
        action={
          <button
            className="cv-primary"
            onClick={() => {
              load('triangle')
              setModal('worked')
            }}
          >
            {tr('Try It')}
          </button>
        }
      >
        <p>{tr('For triangle G (n = 3, k = 3), H has no edges. The empty cover has size 0 = n − k.')}</p>
        <p>{tr('Try the triangle in the graph above.')}</p>
      </Panel>
      <Panel title={tr('Correctness & Complexity')} icon={<BarChart3 />} className="cv-correctness">
        <ul>
          {[
            'Clique S in G ⇒ V ∖ S covers H.',
            'Cover C in H, |C| ≤ n − k ⇒ a clique of ≥ k vertices in G.',
            'Reduction runs in O(n²) time.',
            'NP membership follows by checking a cover.',
          ].map((s) => (
            <li key={s}>{tr(s)}</li>
          ))}
        </ul>
      </Panel>
      <Panel title={tr('Common Pitfalls')} icon={<TriangleAlert />} className="cv-pitfalls">
        <ul>
          {[
            'Forgetting to use the complement graph.',
            'Confusing independent set with vertex cover.',
            'Incorrectly mapping sizes (use n − k).',
            'Assuming edges are preserved instead of complemented.',
          ].map((s) => (
            <li key={s}>{tr(s)}</li>
          ))}
        </ul>
      </Panel>
    </div>
  )
  const pairTable = (
    <div className="cv-pair-table">
      <table>
        <caption>{tr('Complement relation on every unordered pair')}</caption>
        <thead>
          <tr>
            <th>{tr('Pair')}</th>
            <th>{tr('Edge in G')}</th>
            <th>{tr('Edge in H')}</th>
            <th>{tr('H edge covered?')}</th>
          </tr>
        </thead>
        <tbody>
          {model.pairs.map((row) => (
            <tr key={`${row.a}-${row.b}`}>
              <th>
                <button
                  aria-label={tr(`Inspect pair ${row.a + 1}, ${row.b + 1}`)}
                  onClick={() => inspectPair(row.a, row.b)}
                >{`${row.a + 1}, ${row.b + 1}`}</button>
              </th>
              <td>{tr(row.inG ? 'Yes' : 'No')}</td>
              <td>{tr(row.inH ? 'Yes' : 'No')}</td>
              <td>{row.inH ? tr(row.covered ? 'Covered' : 'Uncovered') : '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
  return (
    <div className="mom-page target-visual clique-cover-page" data-target="26">
      <div className="mom-topbar cv-topbar">
        <button className="cv-back" aria-label={tr('Back to 3-SAT to Clique')} onClick={() => navigate('/complexity-theory/three-sat-clique-reduction')}>
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
          <button className="cv-search-key" aria-label={tr('Focus topic search')} onClick={() => search.current?.focus()}>
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
        <AccountControl />
      </div>
      <header className="cv-lesson-header">
        <button className="cv-back" aria-label={tr('Open 3-SAT to Clique lesson')} onClick={() => navigate('/complexity-theory/three-sat-clique-reduction')}>
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1>
            {tr('Worked Reduction: Clique → Vertex Cover')}
            <span aria-hidden="true">{tr('Complexity Theory')}</span>
          </h1>
          <p>{tr('Complement a graph and map a clique of size k to a vertex cover of size n − k.')}</p>
        </div>
        <div className="cv-progress" aria-label={tr(`${reviewed.length} of 6 sections reviewed`)}>
          <span>{tr(`${reviewed.length} of 6 sections`)}</span>
          <div>
            {tabs.map((s, i) => (
              <i key={s} className={reviewed.includes(i) ? 'cv-reviewed' : ''} />
            ))}
          </div>
        </div>
        <button className="cv-primary cv-start" onClick={() => setTab('Learn')}>
          {tr('Start Learning')}
          <ArrowRight size={18} />
        </button>
      </header>
      <MockupTabs active={tab} onChange={setTab} tabs={tabs} />
      {tab === 'Visualization' ? (
        <>
          <section className="cv-visualization">
            <header className="cv-visual-heading">
              <BarChart3 />
              <div>
                <h2>{tr('Interactive Visualization')}</h2>
                <p>{tr('Explore the reduction from CLIQUE in G to VERTEX COVER in the complement graph H.')}</p>
              </div>
              <div className="cv-visual-options">
                <select aria-label={tr('Clique to cover example')} value={example} onChange={(e) => chooseExample(e.target.value)}>
                  {cliqueCoverPresets.map((p) => (
                    <option key={p.id} value={p.id}>
                      {tr(p.name)}
                    </option>
                  ))}
                  <option value="custom">{tr('Custom graph…')}</option>
                </select>
                <Switch label={tr('Show vertex labels')} checked={labels} onChange={setLabels} />
                <Switch label={tr('Show complement edges')} checked={showEdges} onChange={setShowEdges} />
                <button onClick={reset}>
                  <RotateCcw size={16} />
                  {tr('Reset')}
                </button>
              </div>
            </header>
            <div className="cv-dashboard-grid">
              {original}
              {reduction}
              {complement}
              <div className="cv-right-stack">
                {controls}
                {sizeMapping}
                {validation}
              </div>
            </div>
          </section>
          <section className="cv-reduction-steps">
            <header>
              <FileText />
              <h2>{tr('Reduction Steps')}</h2>
              <p>{tr('Follow the construction from a clique in G to a vertex cover in H.')}</p>
            </header>
            <div className="cv-step-track">
              {steps.map(([title, description], i) => (
                <button key={title} aria-label={tr(`Reduction step ${i + 1}: ${title}`)} aria-pressed={stage === i + 1} onClick={() => goToStep(i + 1)}>
                  <i>{i + 1}</i>
                  <b>{tr(title)}</b>
                  <span>{tr(description)}</span>
                </button>
              ))}
            </div>
          </section>
          {message && (
            <p className="cv-message" role="status">
              {tr(message)}
            </p>
          )}
          {footer}
          {review}
        </>
      ) : tab === 'Learn' ? (
        <div className="cv-learning">
          <Panel title={tr('Clique → Independent Set → Vertex Cover')} icon={<BookOpen />}>
            <div className="cv-concept-grid">
              <article>
                <h3>{tr('Clique in G')}</h3>
                <p>{tr('A clique S contains mutually adjacent vertices. CLIQUE(G, k) asks whether a clique of at least k vertices exists.')}</p>
              </article>
              <article>
                <h3>{tr('Independent set in H')}</h3>
                <p>{tr('Complementation reverses adjacency for distinct vertices. A clique S in G has no internal edges in H = G̅.')}</p>
              </article>
              <article>
                <h3>{tr('Cover in H')}</h3>
                <p>{tr('Every H edge must touch V ∖ S, because no edge lies entirely inside the independent set S. Thus C = V ∖ S is a vertex cover.')}</p>
              </article>
            </div>
            <h3>{tr('Forward implication')}</h3>
            <p>
              {tr(
                'If G has a clique S with |S| ≥ k, H has no edge between two vertices of S. Every H edge therefore touches C = V ∖ S, and |C| = n − |S| ≤ n − k.',
              )}
            </p>
            <h3>{tr('Reverse implication')}</h3>
            <p>
              {tr(
                'If H has a cover C with |C| ≤ n − k, no H edge can have both endpoints outside C. Thus S = V ∖ C is independent in H, is a clique in G, and has at least k vertices.',
              )}
            </p>
            <button
              className="cv-primary"
              onClick={() => {
                setTab('Visualization')
                setModal('proof')
              }}
            >
              {tr('Explore both proof directions')}
            </button>
          </Panel>
          <Panel title={tr('Construction Time and Certificate Verification')} icon={<ShieldCheck />}>
            <p>
              {tr(
                `The current graph has ${graph.n} vertices, ${graph.edges.length} edges in G, and ${model.complement.edges.length} edges in H. Construction checks ${model.pairCount} distinct vertex pairs. It keeps the vertices and uses the threshold n − k = ${model.targetK}.`,
              )}
            </p>
            <p>
              {tr(
                'With a constant-time adjacency lookup, complement construction takes O(n²). Checking a supplied cover is polynomial, but finding one is a separate search problem. Combining this reduction from NP-complete CLIQUE with the cover verifier proves VERTEX COVER NP-complete.',
              )}
            </p>
            <button
              onClick={() => {
                load('triangle')
                setModal('worked')
              }}
            >
              {tr('Explore the empty-cover boundary case')}
            </button>
          </Panel>
          {review}
        </div>
      ) : tab === 'Code' ? (
        <Panel title={tr('Complement Construction and Witness Mapping')} icon={<Code2 />} className="cv-code">
          <pre>{code}</pre>
          <p>
            {tr(
              'The classroom editor supports 1–8 vertices and thresholds from 0 to n. The theorem applies to arbitrary finite simple undirected graphs; the UI bound keeps exhaustive verification manageable.',
            )}
          </p>
          {review}
        </Panel>
      ) : tab === 'Practice' ? (
        <div className="cv-practice">
          <Panel title={tr('Predict the Cover Threshold')} icon={<Lightbulb />}>
            <p>{tr(`For n = ${graph.n} and clique threshold k = ${k}, what target cover threshold must be used?`)}</p>
            <label>
              {tr('Predicted cover threshold')}
              <input aria-label={tr('Predicted cover threshold')} value={prediction} onChange={(e) => setPrediction(e.target.value)} />
            </label>
            <button
              className="cv-primary"
              onClick={() =>
                setFeedback(
                  prediction.trim() && Number(prediction) === model.targetK
                    ? 'Correct: the threshold is n − k. A larger clique maps to a smaller cover.'
                    : 'Try again: the cover uses vertices outside the clique, so the budget is n − k.',
                )
              }
            >
              {tr('Check prediction')}
            </button>
            {feedback && <p role="status">{tr(feedback)}</p>}
          </Panel>
          <Panel title={tr('Should an Original Edge Remain in H?')} icon={<ArrowLeftRight />}>
            <p>{tr('For two distinct vertices, G has an edge. What must happen in its complement H?')}</p>
            <button onClick={() => setFeedback('Correct: remove it. Exactly one of G and H contains each distinct vertex pair.')}>
              {tr('Do not include that edge in H')}
            </button>
            <button onClick={() => setFeedback('Reconsider: preserving original edges builds G again, not its complement.')}>
              {tr('Keep the original edge')}
            </button>
            <p>{tr(feedback)}</p>
          </Panel>
          <Panel title={tr('A Rejected Clique Is Not a NO Proof')} icon={<TriangleAlert />}>
            <p>
              {tr(
                'Try selecting a non-clique. Its mapped complement set leaves an H edge uncovered. This rejects that candidate, not every possible clique or cover.',
              )}
            </p>
            <button onClick={() => setTab('Visualization')}>{tr('Try a conflicting selection')}</button>
          </Panel>
          {review}
        </div>
      ) : tab === 'Experiments' ? (
        <div className="cv-experiments">
          <Panel title={tr('Graph and Certificate Laboratory')} icon={<Settings />}>
            <p>
              {tr(
                `G: ${graph.n} vertices, ${graph.edges.length} edges; H: ${model.complement.edges.length} edges. Selected S = ${setLabel(selected)}; mapped C = ${setLabel(model.cover)}.`,
              )}
            </p>
            <div className="cv-lab-actions">
              <button onClick={openEditor}>{tr('Edit graph and threshold')}</button>
              <button onClick={searchBoth}>{tr('Search both instances (bounded)')}</button>
              <button onClick={() => setTab('Visualization')}>{tr('Inspect the linked graphs')}</button>
            </div>
            <p>{tr(`Clique candidate ${model.clique.valid ? 'accepted' : 'rejected'}; mapped cover ${model.target.valid ? 'accepted' : 'rejected'}.`)}</p>
            {message && <p role="status">{tr(message)}</p>}
            {pairTable}
          </Panel>
          <Panel title={tr('Decode a Target Cover Back to a Clique')} icon={<ShieldCheck />}>
            <p>{tr(`Supply a cover C of H using at most ${model.targetK} vertices. The remaining vertices must form a clique of at least ${k} in G.`)}</p>
            <label>
              {tr('Target cover vertex IDs')}
              <input aria-label={tr('Target cover certificate IDs')} value={reverseText} onChange={(e) => setReverseText(e.target.value)} />
            </label>
            <button className="cv-primary" onClick={verifyReverse}>
              {tr('Verify target cover')}
            </button>
            {reverseError && <p role="alert">{tr(reverseError)}</p>}
            {reverse && (
              <p role="status">
                {tr(
                  reverse.valid
                    ? `Valid target cover; decoded source clique ${setLabel(reverse.selected)}.`
                    : 'Rejected target certificate. Check the size budget, distinct in-range IDs, and every H edge.',
                )}
              </p>
            )}
            {reverse?.valid && <button onClick={mapReverse}>{tr('Use decoded clique in G')}</button>}
          </Panel>
          {review}
        </div>
      ) : (
        <Panel title={tr('Your Clique-to-Cover Proof Notes')} icon={<BookOpen />} className="cv-notes">
          <label>
            {tr('State the complement rule, threshold mapping, both proof directions and construction time.')}
            <textarea aria-label={tr('Clique to cover proof notes')} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </label>
          <p>{tr('Notes and reviewed sections are saved automatically in this browser.')}</p>
          <button
            aria-label={tr('Toggle color theme')}
            onClick={() => (props.onToggleTheme ? props.onToggleTheme() : setFallbackTheme(theme === 'dark' ? 'light' : 'dark'))}
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />} {tr('Toggle color theme')}
          </button>
          {review}
        </Panel>
      )}
      <dialog
        ref={dialog}
        className="cv-dialog"
        aria-label={tr(
          modal === 'edit'
            ? 'Edit clique reduction graph'
            : modal === 'worked'
              ? 'Triangle reduction example'
              : modal === 'pair'
                ? 'Inspect complement pair'
                : modal === 'vertex'
                  ? 'Inspect complement vertex'
                  : 'Clique to cover proof',
        )}
        onCancel={() => setModal(null)}
      >
        <button className="cv-close" aria-label={tr('Close clique cover dialog')} onClick={() => setModal(null)}>
          <X size={18} />
        </button>
        {modal === 'edit' ? (
          <>
            <h2>{tr('Edit Graph and Threshold')}</h2>
            <p>
              {tr(
                'Use a simple undirected graph with 1–8 vertices. Write edges as 1-2, 2-3; empty input creates an edgeless graph. Set k from 0 to n. Candidate IDs may be invalid: the verifier will reject them.',
              )}
            </p>
            <label>
              {tr('Vertex count n')}
              <input aria-label={tr('Reduction graph vertex count')} value={draftN} onChange={(e) => setDraftN(e.target.value)} />
            </label>
            <label>
              {tr('Clique threshold k')}
              <input aria-label={tr('Reduction clique threshold')} value={draftK} onChange={(e) => setDraftK(e.target.value)} />
            </label>
            <label>
              {tr('Graph edges')}
              <textarea ref={edgeInput} aria-label={tr('Reduction graph edges')} value={draftEdges} onChange={(e) => setDraftEdges(e.target.value)} />
            </label>
            <label>
              {tr('Selected candidate IDs')}
              <input aria-label={tr('Selected clique candidate IDs')} value={draftSelected} onChange={(e) => setDraftSelected(e.target.value)} />
            </label>
            {error && <p role="alert">{tr(error)}</p>}
            <button className="cv-primary" onClick={applyEditor}>
              {tr('Apply graph and threshold')}
            </button>
          </>
        ) : modal === 'pair' ? (
          <>
            <h2>{tr(`Inspect Pair (${pair[0] + 1}, ${pair[1] + 1})`)}</h2>
            <p>
              {tr(`Edge in G: ${pairInG ? 'present' : 'absent'}. Edge in H: ${pairInG ? 'absent' : 'present'}. Exactly one graph contains this distinct pair.`)}
            </p>
            <p>{tr('Changing the original edge also changes its complement edge. If both endpoints lie in S, an H edge here would be uncovered by V ∖ S.')}</p>
            <button className="cv-primary" onClick={editPair}>
              {tr('Toggle this edge in G')}
            </button>
          </>
        ) : modal === 'vertex' ? (
          <>
            <h2>{tr(`Complement Vertex ${vertex + 1}`)}</h2>
            <p>{tr(`Vertex ${vertex + 1} belongs to ${model.cover.includes(vertex) ? 'the mapped cover C = V ∖ S' : 'the selected source set S'}.`)}</p>
            <p>{tr(`Neighbors in H: ${setLabel(model.complement.edges.flatMap(([a, b]) => (a === vertex ? [b] : b === vertex ? [a] : [])))}.`)}</p>
            <p>
              {tr(
                'Every complement edge must touch at least one cover vertex. Click the source graph or its numbered selectors to change S and its mapped cover together.',
              )}
            </p>
          </>
        ) : modal === 'worked' ? (
          <>
            <h2>{tr('Triangle: Every Vertex Is in the Clique')}</h2>
            <p>{tr(`n = ${graph.n}, k = ${k}; H has ${model.complement.edges.length} edges, and the mapped cover has ${model.cover.length} vertices.`)}</p>
            <p>
              {tr(
                'For the complete three-vertex graph, all distinct pairs are already original edges. H therefore has no edges. The empty set covers every edge vacuously, and its size is 0 = n − k.',
              )}
            </p>
            <button
              className="cv-primary"
              onClick={() => {
                setModal(null)
                setTab('Visualization')
                animate()
              }}
            >
              {tr('Walk through this example')}
            </button>
          </>
        ) : (
          <>
            <h2>{tr('Both Directions of the Reduction')}</h2>
            <p>{tr('Forward: a clique S has no internal edge in H, so V ∖ S touches every H edge. Its size is at most n − k whenever |S| ≥ k.')}</p>
            <p>
              {tr(
                'Backward: a cover C of H leaves no H edge entirely outside C. Thus every pair outside C is an original G edge; V ∖ C is a clique of at least k vertices.',
              )}
            </p>
            <p>
              {tr(
                'Keep the same vertices, complement each distinct pair, and use the threshold n − k. Constructing H does not require finding either certificate.',
              )}
            </p>
          </>
        )}
      </dialog>
    </div>
  )
}
