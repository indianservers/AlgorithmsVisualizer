// @localized-render
import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  ArrowLeftRight,
  BarChart3,
  Bookmark,
  BookOpen,
  Check,
  CheckCircle2,
  ClipboardList,
  Code2,
  FileText,
  Lightbulb,
  ListChecks,
  Moon,
  Network,
  Pause,
  Pencil,
  Play,
  RotateCcw,
  Search,
  Settings,
  ShieldCheck,
  Shield,
  Scale,
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
import { LanguageSelector } from '../i18n/LanguageSelector'
import { usePersistentState, persistentString } from '../hooks/usePersistentState'
import { MockupTabs, type MockupPageProps, type MockupTab } from './MockupLessonChrome'
import {
  formatCnf,
  parseCertificateGraph,
  parseCertificateIds,
  parseComplexityCnf,
  satVariableCount,
  searchComplexitySat,
  workedThreeSat,
  type CertificateGraph,
  type Cnf,
} from './complexityClassesModel'
import {
  buildReductionInstance,
  checkReductionCertificate,
  exampleReductionGraph,
  reductionBackMap,
  reductionExamples,
  remainingReductionVertices,
  smallReductionDecision,
  type CertificateCheck,
  type ReductionKind,
} from './certificatesReductionModel'
import './certificates-reduction-mockup.css'

const tr = (text: string) => tx(text, 'studios'),
  sections: MockupTab[] = ['Learn', 'Visualization', 'Code', 'Practice', 'Experiments', 'Notes']
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
    <section className={`rd-panel ${className}`}>
      <header>
        <span className="rd-icon">{icon}</span>
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
    <label className="rd-switch">
      <input type="checkbox" aria-label={label} checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <i />
      {label}
    </label>
  )
}
function SetLabel({ vertices }: { vertices: number[] }) {
  return <>{`{${vertices.map((v) => v + 1).join(', ')}}`}</>
}
function ReductionGraph({
  graph,
  selected,
  role,
  label,
  onSelect,
  labels,
}: {
  graph: CertificateGraph
  selected: number[]
  role: 'source' | 'target'
  label: string
  onSelect: (v: number) => void
  labels?: string[]
}) {
  const gradient = useId()
  const points =
    graph.n === 6
      ? role === 'source'
        ? [
            [110, 28],
            [52, 73],
            [170, 73],
            [38, 131],
            [110, 148],
            [184, 131],
          ]
        : [
            [111, 28],
            [53, 73],
            [172, 73],
            [46, 124],
            [111, 144],
            [176, 131],
          ]
      : Array.from({ length: graph.n }, (_, i) => [110 + 76 * Math.sin((i * 2 * Math.PI) / graph.n), 88 - 67 * Math.cos((i * 2 * Math.PI) / graph.n)])
  return (
    <svg className={`rd-graph rd-graph-${role}`} viewBox="0 0 220 172" aria-label={label}>
      <defs>
        <radialGradient id={`${gradient}-plain`} cx="35%" cy="25%">
          <stop stopColor="#fff" />
          <stop offset="1" stopColor="#e4edff" />
        </radialGradient>
        <radialGradient id={`${gradient}-selected`} cx="35%" cy="25%">
          <stop stopColor={role === 'source' ? '#fff0ba' : '#c6ffd9'} />
          <stop offset="1" stopColor={role === 'source' ? '#ffd36a' : '#61f18b'} />
        </radialGradient>
      </defs>
      {graph.edges.map(([a, b]) => (
        <line
          key={`${a}-${b}`}
          x1={points[a][0]}
          y1={points[a][1]}
          x2={points[b][0]}
          y2={points[b][1]}
          stroke={role === 'source' ? (selected.includes(a) && selected.includes(b) ? '#ff7a00' : '#8aaada') : '#637aff'}
          strokeWidth={selected.includes(a) && selected.includes(b) ? 2.5 : 1.6}
          strokeDasharray={role === 'target' ? '5 4' : undefined}
        />
      ))}
      {points.map(([x, y], i) => (
        <g
          key={i}
          role="button"
          tabIndex={0}
          aria-label={tr(`Toggle ${role} certificate vertex ${i + 1}`)}
          aria-pressed={selected.includes(i)}
          onClick={() => onSelect(i)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              onSelect(i)
            }
          }}
        >
          <circle
            cx={x}
            cy={y}
            r={graph.n > 6 ? 12 : 15}
            fill={`url(#${gradient}-${selected.includes(i) ? 'selected' : 'plain'})`}
            stroke={selected.includes(i) ? (role === 'source' ? '#ff8a16' : '#25bf70') : '#8eafed'}
            strokeWidth="1.2"
          />
          <text x={x} y={y + 4} textAnchor="middle" fontSize={graph.n > 6 ? 10 : 12} fill="#0c285d" fontWeight="600">
            {labels?.[i] ?? i + 1}
          </text>
        </g>
      ))}
    </svg>
  )
}
const reductionCode = `reduceCliqueToCover(G, k):
    n = number_of_vertices(G)
    H = graph_with_same_vertices_and_no_edges()
    for each unordered pair {u, v}, u ≠ v:
        if {u, v} is NOT an edge of G:
            add {u, v} to H
    return (H, n - k)

forward_certificate(S): return V minus S
backward_certificate(C): return V minus C

Correctness: S is a clique in G iff S is independent in H.
S is independent in H iff V minus S covers every edge of H.
Thus CLIQUE(G, k) = YES iff VERTEX-COVER(H, n-k) = YES.
Construction: O(n²) adjacency queries with a matrix/hash lookup.
Verification: O(k²) clique pairs, O(n+|E|) cover membership/edges.
Finding a witness by enumeration is exponential; it is separate from f.`
const lessonSteps = [
  'Read the source instance (G, k).',
  'Construct the complement graph G̅.',
  'Set the target threshold k′ = n − k.',
  'Map S to V ∖ S and verify the certificate.',
  'Prove both directions and bound the construction time.',
]

export function CertificatesReductionMockupLesson(props: MockupPageProps) {
  useLocaleRender()
  const navigate = useNavigate(),
    [tab, setTab] = useState<MockupTab>('Visualization'),
    [kind, setKind] = useState<ReductionKind>('clique-cover'),
    [graph, setGraph] = useState<CertificateGraph>(() => exampleReductionGraph()),
    [k, setK] = useState(3),
    [sourceVertices, setSourceVertices] = useState([0, 1, 2]),
    [targetOverride, setTargetOverride] = useState<number[] | null>(null),
    [clauses, setClauses] = useState<Cnf>(workedThreeSat),
    [assignment, setAssignment] = useState([true, false, true]),
    [showCertificates, setShowCertificates] = useState(true),
    [showMapping, setShowMapping] = useState(false),
    [certificateSide, setCertificateSide] = useState<'source' | 'target'>('source'),
    [stage, setStage] = useState(5),
    [playback, setPlayback] = useState(false),
    [playing, setPlaying] = useState(false)
  const result = buildReductionInstance(kind, graph, k, sourceVertices, clauses, assignment),
    targetVertices = targetOverride ?? result.mappedVertices,
    targetType = result.example.target as 'CLIQUE' | 'VERTEX COVER',
    targetCheck = checkReductionCertificate(targetType, result.targetGraph, targetVertices, result.targetK),
    checks: CertificateCheck[] = certificateSide === 'source' ? result.sourceChecks : targetCheck.checks,
    certificateValid = certificateSide === 'source' ? result.sourceValid : targetCheck.valid,
    selectedVertices = certificateSide === 'source' ? sourceVertices : targetVertices
  const [query, setQuery] = useState(''),
    search = useRef<HTMLInputElement>(null),
    [fallbackTheme, setFallbackTheme] = useState(() => localStorage.getItem('algodrishti-theme') ?? 'light'),
    theme = props.theme ?? fallbackTheme,
    [notes, setNotes] = usePersistentState('algodrishti-certificates-reduction-notes', '', persistentString),
    [reviewed, setReviewed] = usePersistentState<number[]>('algodrishti-certificates-reduction-reviewed', [], {
      deserialize: (value) => {
        try {
          const parsed: unknown = JSON.parse(value)
          return Array.isArray(parsed) ? [...new Set(parsed.filter((v): v is number => Number.isInteger(v) && v >= 0 && v < 6))] : []
        } catch {
          return []
        }
      },
    }),
    [message, setMessage] = useState(''),
    [prediction, setPrediction] = useState(''),
    [practiceMessage, setPracticeMessage] = useState(''),
    [modal, setModal] = useState<'instance' | 'witness' | 'worked' | 'proof' | null>(null),
    dialog = useRef<HTMLDialogElement>(null),
    [draftN, setDraftN] = useState('6'),
    [draft, setDraft] = useState(''),
    [draftK, setDraftK] = useState('3'),
    [draftWitness, setDraftWitness] = useState(''),
    [error, setError] = useState('')
  const matches = query.trim() ? allModules.filter((m) => `${m.name} ${m.summary}`.toLowerCase().includes(query.toLowerCase())).slice(0, 5) : [],
    studied = props.completed.includes(props.module.id)
  const mapping = showMapping
    ? (() => {
        const source =
            kind === 'sat-clique'
              ? searchComplexitySat(clauses)
              : smallReductionDecision(result.example.source as 'CLIQUE' | 'VERTEX COVER' | 'INDEPENDENT SET', graph, k),
          target = smallReductionDecision(targetType, result.targetGraph, result.targetK)
        return {
          source: 'found' in source ? source.found : source.yes,
          target: target.yes,
          tried: source.tried + target.tried,
          total: source.total + target.total,
        }
      })()
    : null
  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem('algodrishti-theme', theme)
  }, [theme])
  useEffect(() => {
    if (modal) dialog.current?.showModal()
    else dialog.current?.close()
  }, [modal])
  useEffect(() => {
    if (!playing || stage >= 5) return
    const timer = setTimeout(() => {
      setStage(stage + 1)
      if (stage + 1 === 5) setPlaying(false)
    }, 900)
    return () => clearTimeout(timer)
  }, [playing, stage])
  useEffect(() => {
    const handle = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        search.current?.focus()
      }
    }
    window.addEventListener('keydown', handle)
    return () => window.removeEventListener('keydown', handle)
  }, [])
  const resetPlayback = () => {
    setPlaying(false)
    setStage(5)
    setPlayback(false)
  }
  function chooseKind(next: ReductionKind) {
    setKind(next)
    setTargetOverride(null)
    setCertificateSide('source')
    setMessage('')
    setSourceVertices(
      next === 'clique-cover'
        ? [0, 1, 2].filter((v) => v < graph.n)
        : next === 'cover-clique'
          ? remainingReductionVertices(graph.n, [0, 3, 5])
          : [0, 3, 5].filter((v) => v < graph.n),
    )
    resetPlayback()
  }
  function resize(n: number) {
    setGraph(exampleReductionGraph(n))
    setK(Math.min(k, n))
    setSourceVertices(
      kind === 'clique-cover'
        ? [0, 1, 2].filter((v) => v < n)
        : kind === 'cover-clique'
          ? remainingReductionVertices(n, [0, 3, 5])
          : [0, 3, 5].filter((v) => v < n),
    )
    setTargetOverride(null)
    setMessage('')
    resetPlayback()
  }
  function reset() {
    setKind('clique-cover')
    setGraph(exampleReductionGraph())
    setK(3)
    setSourceVertices([0, 1, 2])
    setTargetOverride(null)
    setClauses(workedThreeSat)
    setAssignment([true, false, true])
    setCertificateSide('source')
    setShowCertificates(true)
    setShowMapping(false)
    setMessage('')
    resetPlayback()
  }
  function selectVertex(side: 'source' | 'target', v: number) {
    if (side === 'source') {
      setSourceVertices((old) => (old.includes(v) ? old.filter((x) => x !== v) : [...old, v].sort((a, b) => a - b)))
      setTargetOverride(null)
    } else setTargetOverride(targetVertices.includes(v) ? targetVertices.filter((x) => x !== v) : [...targetVertices, v].sort((a, b) => a - b))
    setCertificateSide(side)
    setMessage('')
  }
  function openEditor(type: 'instance' | 'witness') {
    setError('')
    setDraftN(String(graph.n))
    setDraftK(String(k))
    setDraft(kind === 'sat-clique' ? clauses.map((row) => row.join(' ')).join('; ') : graph.edges.map(([a, b]) => `${a + 1}-${b + 1}`).join(', '))
    setDraftWitness(selectedVertices.map((v) => v + 1).join(', '))
    setModal(type)
  }
  function applyEditor() {
    try {
      if (modal === 'instance') {
        if (kind === 'sat-clique') {
          const next = parseComplexityCnf(draft)
          if (next.length > 3 || next.some((row) => row.length > 3)) throw new Error('Use 1–3 clauses, each with 1–3 literals; at most 9 occurrence vertices.')
          setClauses(next)
          setAssignment(Array.from({ length: satVariableCount(next) }, (_, i) => assignment[i] ?? false))
        } else {
          const next = parseCertificateGraph(draftN, draft),
            threshold = Number(draftK)
          if (!draftK.trim() || !Number.isInteger(threshold) || threshold < 0 || threshold > next.n) throw new Error('Use an integer k from 0 to n.')
          setGraph(next)
          setK(threshold)
          setSourceVertices(sourceVertices.filter((v) => v < next.n))
        }
        setTargetOverride(null)
        resetPlayback()
      } else {
        const vertices = parseCertificateIds(draftWitness)
        if (certificateSide === 'target') setTargetOverride(vertices)
        else setSourceVertices(vertices)
      }
      setMessage('')
      setModal(null)
    } catch (e) {
      setError((e as Error).message)
    }
  }
  function findCertificate() {
    if (certificateSide === 'source' && kind === 'sat-clique') {
      const found = searchComplexitySat(clauses)
      if (found.found) {
        setAssignment(found.assignment!)
        setTargetOverride(null)
      }
      setMessage(
        found.found
          ? `Found an assignment after ${found.tried} checks. This enumerative search is not the polynomial reduction.`
          : `Checked all ${found.total} assignments: this particular formula is unsatisfiable.`,
      )
    } else {
      const g = certificateSide === 'source' ? graph : result.targetGraph,
        t = certificateSide === 'source' ? result.example.source : targetType,
        threshold = certificateSide === 'source' ? result.sourceK : result.targetK,
        found = smallReductionDecision(t as 'CLIQUE' | 'VERTEX COVER' | 'INDEPENDENT SET', g, threshold)
      if (found.yes) {
        if (certificateSide === 'source') {
          setSourceVertices(found.witness)
          setTargetOverride(null)
        } else setTargetOverride(found.witness)
      }
      setMessage(
        found.yes
          ? `Found a certificate after ${found.tried} of at most ${found.total} subsets. Enumeration is separate from the polynomial reduction.`
          : `Exhausted all ${found.total} subsets: this particular instance is NO.`,
      )
    }
  }
  function mapBack() {
    if (!targetCheck.valid) {
      setMessage('The target certificate is rejected. Backward correctness applies to a valid target witness.')
      return
    }
    const back = reductionBackMap(kind, graph, targetVertices, clauses)
    if (kind === 'sat-clique') setAssignment(back.assignment)
    else setSourceVertices(back.vertices)
    setTargetOverride(null)
    setCertificateSide('source')
    setMessage('Mapped a valid target witness back to the source. This demonstrates the reverse implication.')
  }
  const startAnimation = () => {
    setStage(0)
    setPlaying(true)
    setPlayback(true)
  }
  const currentSteps =
    kind === 'sat-clique'
      ? [
          'Read the CNF formula and count its clauses.',
          'Create one vertex per literal occurrence.',
          'Connect compatible literals from different clauses; set k = m.',
          'Choose one true literal per clause to form the clique.',
          'Decode any m-clique to a satisfying assignment; construction is polynomial.',
        ]
      : kind === 'independent-clique'
        ? [
            'Read the independent-set instance (G, k).',
            'Construct the complement graph G̅.',
            'Keep the threshold k unchanged.',
            'Keep the same selected vertices; nonedges become edges.',
            'Prove both directions and bound construction by O(n²).',
          ]
        : lessonSteps
  const reviewIndex = sections.indexOf(tab),
    review = (
      <button
        className="rd-review"
        aria-pressed={reviewed.includes(reviewIndex)}
        onClick={() => setReviewed(reviewed.includes(reviewIndex) ? reviewed.filter((v) => v !== reviewIndex) : [...reviewed, reviewIndex])}
      >
        <Check size={15} />
        {tr(reviewed.includes(reviewIndex) ? 'Section reviewed' : 'Mark section reviewed')}
      </button>
    )
  const selectExample = (label: string, prefix = false) => (
    <select aria-label={label} value={kind} onChange={(e) => chooseKind(e.target.value as ReductionKind)}>
      {reductionExamples.map((e) => (
        <option key={e.id} value={e.id}>
          {tr(`${prefix ? 'Example: ' : ''}${e.label}`)}
        </option>
      ))}
    </select>
  )
  const construction = (
    <Panel
      title={tr('Many-One Reduction')}
      icon={<UserRound />}
      className="rd-construction"
      action={<span className="rd-relation">{'A ≤ₚ B'}</span>}
      subtitle={tr('Transform instances in polynomial time.')}
    >
      <div className="rd-transform">
        <div className={stage === 0 ? 'rd-step-active' : ''}>
          <b>
            {tr('Instance x')}
            <br />
            {tr('of A')}
          </b>
          <p>
            {kind === 'sat-clique' ? 'φ' : tr('e.g., graph G, k')}
            <br />
            {`(${result.example.source})`}
          </p>
        </div>
        <ArrowRight />
        <div className={stage === 1 ? 'rd-step-active' : ''}>
          <b>
            {tr('Polynomial-time')}
            <br />
            {tr('transformation')}
            <br />
            {'f(x)'}
          </b>
          <p>
            {tr('Compute f(x)')}
            <br />
            {tr('in polynomial time')}
          </p>
        </div>
        <ArrowRight />
        <div className={stage === 2 ? 'rd-step-active' : ''}>
          <b>
            {tr('Instance f(x)')}
            <br />
            {tr('of B')}
          </b>
          <p>
            {kind === 'sat-clique' ? 'Gφ, m' : `G̅, ${kind === 'independent-clique' ? 'k' : 'n − k'}`}
            <br />
            {`(${result.example.target})`}
          </p>
        </div>
      </div>
      <div className="rd-iff">
        <span>{'A ≤ₚ B'}</span>
        {tr(' if for all instances x:')}
        <p>
          <i>{'x ∈ A'}</i>
          <b>{'⇔'}</b>
          <i>{'f(x) ∈ B'}</i>
        </p>
      </div>
      {mapping && (
        <div className="rd-yesno" role="status">
          {tr(`Source ${mapping.source ? 'YES' : 'NO'} ⇔ Target ${mapping.target ? 'YES' : 'NO'}`)}
          <small>{tr(`Classroom enumeration: ${mapping.tried} checks; at most ${mapping.total}.`)}</small>
        </div>
      )}
    </Panel>
  )
  const graphExample = (
    <Panel
      title={tr(`Example: ${result.example.source} → ${result.example.target}`)}
      icon={<ClipboardList />}
      className="rd-example"
      subtitle={
        kind === 'clique-cover'
          ? tr('A clique of size k in G corresponds to a vertex cover of size n − k in the complement G̅.')
          : kind === 'cover-clique'
            ? tr('A cover of size k leaves a clique of size n − k in the complement.')
            : kind === 'sat-clique'
              ? tr('One compatible literal per clause gives a clique of size m.')
              : tr('An independent set becomes a clique of the same size in the complement.')
      }
      action={
        <button className="rd-edit" aria-label={tr('Edit reduction instance')} onClick={() => openEditor('instance')}>
          <Pencil size={13} />
        </button>
      }
    >
      <div className="rd-graph-pair">
        <article className="rd-source-card">
          <header>
            <FileText size={16} />
            <b>{kind === 'sat-clique' ? tr('Formula φ') : tr('Graph G (original)')}</b>
            <span>{result.example.source}</span>
          </header>
          {kind === 'sat-clique' ? (
            <div className="rd-formula-card">
              <p>{formatCnf(clauses)}</p>
              <div className="rd-assignment">
                {assignment.map((value, i) => (
                  <button
                    key={i}
                    aria-label={tr(`Toggle source assignment x${i + 1}`)}
                    aria-pressed={value}
                    onClick={() => {
                      setAssignment(assignment.map((old, j) => (i === j ? !old : old)))
                      setTargetOverride(null)
                    }}
                  >{`x${i + 1} = ${value ? 'True' : 'False'}`}</button>
                ))}
              </div>
            </div>
          ) : (
            <ReductionGraph
              graph={graph}
              selected={showCertificates ? sourceVertices : []}
              role="source"
              label={tr(`Original graph: ${graph.n} vertices and ${graph.edges.length} edges`)}
              onSelect={(v) => selectVertex('source', v)}
            />
          )}
          <footer>
            <b>
              {kind === 'sat-clique'
                ? tr(`${clauses.length} clauses; ${assignment.length} variables`)
                : tr(
                    `${result.example.source === 'CLIQUE' ? 'Clique' : result.example.source === 'VERTEX COVER' ? 'Cover' : 'Independent set'} threshold k = ${result.sourceK}`,
                  )}
            </b>
            {showCertificates && (
              <p>
                {kind === 'sat-clique' ? (
                  tr('Assignment is a candidate certificate.')
                ) : (
                  <>
                    {tr('Vertices ')}
                    <SetLabel vertices={sourceVertices} />
                  </>
                )}
              </p>
            )}
          </footer>
        </article>
        <div className="rd-complement-arrow">
          <b>
            {tr(kind === 'sat-clique' ? 'Construct' : 'Take')}
            <br />
            {tr(kind === 'sat-clique' ? 'literal graph' : 'complement G̅')}
          </b>
          <ArrowRight />
        </div>
        <article className="rd-target-card">
          <header>
            <b>{kind === 'sat-clique' ? tr('Graph Gφ') : tr('Graph G̅ (complement)')}</b>
            <span>{result.example.target}</span>
          </header>
          <ReductionGraph
            graph={result.targetGraph}
            selected={showCertificates ? targetVertices : []}
            role="target"
            label={tr(`Target graph: ${result.targetGraph.n} vertices and ${result.targetGraph.edges.length} edges`)}
            onSelect={(v) => selectVertex('target', v)}
          />
          <footer>
            <b>
              {tr(
                `${targetType === 'VERTEX COVER' ? 'Vertex cover' : 'Clique'} of ${kind === 'sat-clique' ? 'size m' : kind === 'independent-clique' ? 'size k' : 'size n − k'} = ${result.targetK}`,
              )}
            </b>
            {showCertificates && (
              <p>
                {tr('Vertices ')}
                <SetLabel vertices={targetVertices} />
              </p>
            )}
          </footer>
        </article>
      </div>
    </Panel>
  )
  const certificate = (
    <Panel
      title={tr('Certificate Verification')}
      icon={<ShieldCheck />}
      className="rd-certification"
      subtitle={tr('A certificate is checked efficiently, not necessarily found.')}
    >
      <nav aria-label={tr('Certificate side')}>
        <button aria-pressed={certificateSide === 'source'} onClick={() => setCertificateSide('source')}>
          {tr(`${result.example.source} Certificate`)}
        </button>
        <button aria-pressed={certificateSide === 'target'} onClick={() => setCertificateSide('target')}>
          {tr(`${result.example.target} Certificate`)}
        </button>
      </nav>
      {showCertificates ? (
        <>
          <div className="rd-certificate-card">
            <h3>
              <Shield size={18} />
              {tr(
                `Certificate for ${certificateSide === 'source' ? result.example.source : result.example.target}${kind !== 'sat-clique' && certificateSide === 'source' ? '(G, k)' : ''}`,
              )}
              <span>{`k = ${certificateSide === 'source' ? result.sourceK : result.targetK}`}</span>
              <button
                aria-label={tr('Edit selected certificate')}
                className="rd-edit"
                onClick={() => (kind === 'sat-clique' && certificateSide === 'source' ? openEditor('instance') : openEditor('witness'))}
              >
                <Pencil size={12} />
              </button>
            </h3>
            <p>
              <b>{tr('Certificate: ')}</b>
              {kind === 'sat-clique' && certificateSide === 'source' ? (
                tr('Boolean assignment above')
              ) : (
                <>
                  {tr('set of vertices ')}
                  <span className="rd-witness-set">
                    {'S = '}
                    <SetLabel vertices={selectedVertices} />
                  </span>
                </>
              )}
            </p>
            <div className="rd-checks" aria-label={tr('Certificate verification checks')}>
              {checks.map((check, i) => (
                <div className={check.valid ? 'rd-check-pass' : 'rd-check-fail'} key={i}>
                  {check.valid ? <CheckCircle2 /> : <X />}
                  <span className={i > 0 && check.label === checks[i - 1].label ? 'rd-repeated-check-label' : undefined}>{tr(check.label)}</span>
                  <b>{tr(check.detail)}</b>
                </div>
              ))}
            </div>
          </div>
          <div className={`rd-certificate-status ${certificateValid ? 'rd-valid' : 'rd-invalid'}`} role="status">
            {certificateValid ? <CheckCircle2 /> : <TriangleAlert />}
            <b>{tr(certificateValid ? 'Certificate is valid → instance is YES' : 'Certificate rejected ≠ instance is NO')}</b>
          </div>
        </>
      ) : (
        <p className="rd-hidden-certificates">{tr('Certificates are hidden. Enable “Show certificates” to inspect each verification check.')}</p>
      )}
    </Panel>
  )
  const versions = (
    <Panel title={tr('Decision vs Optimization')} subtitle={tr('Connected but distinct problems.')} icon={<Scale />} className="rd-versions">
      <div>
        <article>
          <h3>{tr('Decision Version')}</h3>
          <i>{tr('Is there a solution of size ≤ k?')}</i>
          <p>{tr('Output: YES or NO')}</p>
          <button
            onClick={() => {
              chooseKind('cover-clique')
              setMessage('CLIQUE asks for at least k mutually adjacent vertices; VERTEX COVER asks for at most k covering vertices.')
            }}
          >
            {tr('E.g., VERTEX COVER(G, k)')}
          </button>
        </article>
        <div>
          <ArrowLeftRight />
          <span>
            {tr('Related')}
            <br />
            {tr('but distinct')}
          </span>
        </div>
        <article>
          <h3>{tr('Optimization Version')}</h3>
          <i>{tr('What is the minimum size?')}</i>
          <p>{tr('Output: minimum value')}</p>
          <button
            onClick={() => {
              setModal('proof')
              setMessage('Minimum Vertex Cover asks for the smallest cover. The threshold decision asks only whether a cover of size at most k exists.')
            }}
          >
            {tr('E.g., Minimum Vertex Cover')}
          </button>
        </article>
      </div>
      <small>{tr('For CLIQUE use size ≥ k; for VERTEX COVER use size ≤ k.')}</small>
    </Panel>
  )
  const examplesPanel = (
    <Panel
      title={tr('Example Reductions')}
      subtitle={tr('Explore classic reductions and their instance mappings.')}
      icon={<BookOpen />}
      className="rd-examples-list"
      action={selectExample(tr('Select example reduction'))}
    >
      <div role="radiogroup" aria-label={tr('Example reductions')}>
        {reductionExamples.map((example, i) => (
          <button key={example.id} role="radio" aria-checked={kind === example.id} onClick={() => chooseKind(example.id)}>
            <i />
            <span>
              <b>{tr(example.label)}</b>
              <small>{example.mapping}</small>
            </span>
            <em className={`rd-hint-${i}`}>{tr(example.hint)}</em>
          </button>
        ))}
      </div>
    </Panel>
  )
  const controls = (
    <Panel title={tr('Build and Explore')} subtitle={tr('Interact with the example to see the reduction.')} icon={<Settings />} className="rd-controls">
      <div className="rd-parameter-grid">
        <fieldset>
          <legend>{tr(kind === 'sat-clique' ? 'Formula clauses m' : 'Select graph size n')}</legend>
          {kind === 'sat-clique' ? (
            <button onClick={() => openEditor('instance')}>{tr(`${clauses.length} clauses · edit`)}</button>
          ) : (
            [4, 5, 6, 7, 8].map((n) => (
              <button key={n} aria-label={tr(`Set graph size ${n}`)} aria-pressed={graph.n === n} onClick={() => resize(n)}>
                {n}
              </button>
            ))
          )}
        </fieldset>
        <fieldset>
          <legend>{tr(kind === 'sat-clique' ? 'Clique size m' : 'Select clique size k')}</legend>
          {kind === 'sat-clique' ? (
            <b>{clauses.length}</b>
          ) : (
            Array.from({ length: Math.min(5, graph.n) }, (_, i) => i + 1).map((value) => (
              <button
                key={value}
                aria-label={tr(`Set source threshold ${value}`)}
                aria-pressed={k === value}
                onClick={() => {
                  setK(value)
                  setTargetOverride(null)
                  resetPlayback()
                  setMessage('')
                }}
              >
                {value}
              </button>
            ))
          )}
        </fieldset>
      </div>
      <button className="rd-primary rd-animate" onClick={startAnimation}>
        <Play size={14} />
        {tr('Animate Reduction Steps')}
      </button>
      {playback && (
        <div className="rd-playback">
          <div>
            <button
              aria-label={tr('Previous reduction step')}
              disabled={stage === 0}
              onClick={() => {
                setPlaying(false)
                setStage(stage - 1)
              }}
            >
              <SkipBack size={15} />
            </button>
            <button
              aria-label={tr(playing ? 'Pause reduction' : 'Play reduction')}
              onClick={() => {
                if (stage === 5) setStage(0)
                setPlaying(!playing)
              }}
            >
              {playing ? <Pause size={15} /> : <Play size={15} />}
            </button>
            <button
              aria-label={tr('Next reduction step')}
              disabled={stage === 5}
              onClick={() => {
                setPlaying(false)
                setStage(stage + 1)
              }}
            >
              <SkipForward size={15} />
            </button>
            <b>{`${stage}/5`}</b>
          </div>
          <p role="status">{tr(stage === 0 ? 'Ready: read the source instance.' : currentSteps[stage - 1])}</p>
        </div>
      )}
    </Panel>
  )
  const footer = (
    <div className="rd-footer-grid">
      <Panel title={tr('Key Takeaways')} icon={<Lightbulb />} className="rd-takeaways">
        <ul>
          {[
            'A ≤ₚ B: polynomial-time f preserves yes/no answers for every input.',
            'Certificates are checked, not necessarily found.',
            'Decision and optimization are related but distinct.',
            'A k-clique in G maps to a cover of size n − k in G̅.',
          ].map((s) => (
            <li key={s}>{tr(s)}</li>
          ))}
        </ul>
      </Panel>
      <Panel
        title={tr('Worked Example')}
        icon={<FileText />}
        className="rd-worked"
        action={
          <button className="rd-primary" onClick={() => setModal('worked')}>
            {tr('Try It')}
          </button>
        }
      >
        <b>{tr(result.example.label)}</b>
        <ol>
          {currentSteps.map((s, i) => (
            <li key={s}>{tr(i === 4 ? 'Prove both directions; f is polynomial.' : s)}</li>
          ))}
        </ol>
      </Panel>
      <Panel title={tr('Reduction Workflow')} icon={<Settings />} className="rd-workflow">
        <ol>
          {[
            'Define source and target problems (A and B).',
            'Design polynomial-time transformation f.',
            'Prove correctness (yes/no preserved).',
            'Analyze complexity (f is polynomial time).',
            'Use in algorithm design or hardness proofs.',
          ].map((s, i) => (
            <li key={s}>
              <span>{i + 1}</span>
              {tr(s)}
            </li>
          ))}
        </ol>
      </Panel>
      <Panel title={tr('Correctness & Complexity')} icon={<BarChart3 />} className="rd-correctness">
        <ul>
          {[
            'Prove: x ∈ A ⇔ f(x) ∈ B.',
            'Show f is computable in polynomial time.',
            'Certificates verifiable in polynomial time.',
            'Reductions preserve yes/no answers.',
            'Used to transfer algorithms and hardness.',
          ].map((s) => (
            <li key={s}>
              <CheckCircle2 />
              {tr(s)}
            </li>
          ))}
        </ul>
      </Panel>
      <Panel title={tr('Common Pitfalls')} icon={<TriangleAlert />} className="rd-pitfalls">
        <ul>
          {[
            'Confusing decision and optimization versions.',
            'Not proving both directions of equivalence.',
            'Assuming a certificate can be found efficiently.',
            'Forgetting to analyze f’s running time.',
            'Mixing up original and complement edges.',
          ].map((s) => (
            <li key={s}>{tr(s)}</li>
          ))}
        </ul>
      </Panel>
    </div>
  )
  return (
    <div className="mom-page target-visual reductions-page" data-target="24">
      <div className="mom-topbar rd-topbar">
        <button className="rd-back" aria-label={tr('Back to complexity classes')} onClick={() => navigate('/complexity-theory/p-np-classes')}>
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
          <button className="rd-search-key" aria-label={tr('Focus topic search')} onClick={() => search.current?.focus()}>
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
      <header className="rd-lesson-header">
        <button className="rd-back" aria-label={tr('Open complexity classes lesson')} onClick={() => navigate('/complexity-theory/p-np-classes')}>
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1>
            {tr('Decision Problems, Certificates and Reductions')}
            <span aria-hidden="true">{tr('Complexity Theory')}</span>
          </h1>
          <p>{tr('Translate instances while preserving yes/no answers through polynomial-time reductions.')}</p>
        </div>
        <div className="rd-progress" aria-label={tr(`${reviewed.length} of 6 sections reviewed`)}>
          <span>{tr(`${reviewed.length} of 6 sections`)}</span>
          <div>
            {sections.map((s, i) => (
              <i key={s} className={reviewed.includes(i) ? 'rd-reviewed' : ''} />
            ))}
          </div>
        </div>
        <button className="rd-primary rd-start" onClick={() => setTab('Learn')}>
          {tr('Start Learning')}
          <ArrowRight size={18} />
        </button>
      </header>
      <MockupTabs active={tab} onChange={setTab} tabs={sections} />
      {tab === 'Visualization' ? (
        <>
          <section className="rd-visualization" data-step={playback ? stage : undefined}>
            <header className="rd-visual-heading">
              <BarChart3 />
              <div>
                <h2>{tr('Interactive Visualization')}</h2>
                <p>{tr('Explore many-one reductions, instance transformations, certificates and the relation between them.')}</p>
              </div>
              <div className="rd-visual-options">
                <label>{selectExample(tr('Visualization reduction example'), true)}</label>
                <Switch label={tr('Show certificates')} checked={showCertificates} onChange={setShowCertificates} />
                <Switch label={tr('Show yes/no mapping')} checked={showMapping} onChange={setShowMapping} />
                <button onClick={reset}>
                  <RotateCcw size={16} />
                  {tr('Reset')}
                </button>
              </div>
            </header>
            <div className="rd-top-grid">
              {construction}
              {graphExample}
              {certificate}
            </div>
            <div className="rd-bottom-grid">
              {versions}
              {examplesPanel}
              {controls}
            </div>
          </section>
          {footer}
          {message && (
            <p className="rd-message" role="status">
              {tr(message)}
            </p>
          )}
          {review}
        </>
      ) : tab === 'Learn' ? (
        <div className="rd-learning">
          <Panel title={tr('Decision, Certificate and Reduction')} icon={<BookOpen />}>
            <div className="rd-concept-grid">
              <article>
                <h3>{tr('Decision instance')}</h3>
                <p>{tr('A finite input with a yes/no question. A graph and k define CLIQUE; the graph alone does not fix the threshold question.')}</p>
              </article>
              <article>
                <h3>{tr('Certificate')}</h3>
                <p>{tr('Extra evidence for a YES answer. Verification checks the proposed evidence; a failed proposal does not prove NO.')}</p>
              </article>
              <article>
                <h3>{tr('Many-one reduction')}</h3>
                <p>
                  {tr('Compute one target instance f(x) in polynomial time and preserve x ∈ A iff f(x) ∈ B. Do not solve the source while constructing f.')}
                </p>
              </article>
            </div>
            <h3>{tr('Worked example: six vertices, k = 3')}</h3>
            <p>
              {tr(
                'Vertices {1, 2, 3} form a clique in the original graph. In its complement those three vertices have no internal edges, so all complement edges touch {4, 5, 6}. This is a cover of size 6 − 3 = 3.',
              )}
            </p>
            <button
              className="rd-primary"
              onClick={() => {
                reset()
                setTab('Visualization')
                setModal('worked')
              }}
            >
              {tr('Explore the worked construction')}
            </button>
            <h3>{tr('Why both directions matter')}</h3>
            <p>
              {tr(
                'Forward: a source witness yields a target witness. Backward: any valid target witness yields a source witness. Proving only YES → YES permits reductions that turn NO inputs into YES inputs, which is not enough.',
              )}
            </p>
          </Panel>
          <Panel title={tr('Reduction Direction and Running Time')} icon={<Network />}>
            <p>
              {tr(
                'A fast target solver B would give a fast source solver A after f. To prove a new B hard, reduce a known hard A to B, and show B belongs to NP separately when claiming NP-completeness.',
              )}
            </p>
            <p>
              {tr(
                'Complement construction checks n(n−1)/2 distinct pairs. With constant-time adjacency lookup this is O(n²), independent of finding a clique or a cover. Bounded exhaustive searches in this laboratory are labeled separately.',
              )}
            </p>
          </Panel>
          {review}
        </div>
      ) : tab === 'Code' ? (
        <Panel title={tr('Executable Reduction and Certificate Contracts')} icon={<Code2 />} className="rd-code">
          <pre>{reductionCode}</pre>
          <p>
            {tr(
              'The graph editor is bounded to 8 vertices; literal constructions to 9 vertices. These limits keep exhaustive classroom checks small, and do not turn exponential search into a polynomial algorithm.',
            )}
          </p>
          {review}
        </Panel>
      ) : tab === 'Practice' ? (
        <div className="rd-practice">
          <Panel title={tr('Predict the Target Threshold')} icon={<ListChecks />}>
            <p>{tr(`CLIQUE(G, k) with n = ${graph.n} and k = ${k}: what is the cover threshold in G̅?`)}</p>
            <label>
              {tr('Your predicted target k′')}
              <input aria-label={tr('Predicted target threshold')} value={prediction} onChange={(e) => setPrediction(e.target.value)} />
            </label>
            <button
              className="rd-primary"
              onClick={() =>
                setPracticeMessage(
                  prediction.trim() && Number(prediction) === graph.n - k
                    ? 'Correct: k′ = n − k. Take the complement of the selected vertex set.'
                    : 'Try again: the cover contains the vertices outside the clique, so k′ = n − k.',
                )
              }
            >
              {tr('Check prediction')}
            </button>
            {practiceMessage && <p role="status">{tr(practiceMessage)}</p>}
          </Panel>
          <Panel title={tr('Does a Rejected Certificate Prove NO?')} icon={<Shield />}>
            <button
              onClick={() =>
                setPracticeMessage('Correct: another certificate may work. Only an exhaustive bounded search here can certify this particular NO instance.')
              }
            >
              {tr('No, another witness may work')}
            </button>
            <button onClick={() => setPracticeMessage('Reconsider: rejecting one witness is not rejecting every possible witness.')}>
              {tr('Yes, one rejection is enough')}
            </button>
            <p>{tr(practiceMessage)}</p>
          </Panel>
          <Panel title={tr('Prove the Reverse Implication')} icon={<ArrowLeft />}>
            <p>{tr('Start from any cover C in G̅ with |C| ≤ n − k. Why must V ∖ C contain a clique of at least k in G?')}</p>
            <button
              onClick={() => {
                setMessage('An edge within V ∖ C in G̅ would be uncovered. Thus all pairs in V ∖ C are edges of G, and its size is at least k.')
                setModal('proof')
              }}
            >
              {tr('Reveal the proof')}
            </button>
          </Panel>
          {review}
        </div>
      ) : tab === 'Experiments' ? (
        <div className="rd-experiments">
          <Panel title={tr('Certificate and Instance Laboratory')} icon={<Settings />}>
            <p>
              {tr(
                'Edit the source graph or formula, inspect source and target certificates, and compare candidate verification with bounded exhaustive search.',
              )}
            </p>
            {selectExample(tr('Laboratory reduction example'))}
            <div className="rd-lab-buttons">
              <button onClick={() => openEditor('instance')}>{tr('Edit reduction instance')}</button>
              <button aria-pressed={certificateSide === 'source'} onClick={() => setCertificateSide('source')}>
                {tr('Source certificate')}
              </button>
              <button aria-pressed={certificateSide === 'target'} onClick={() => setCertificateSide('target')}>
                {tr('Target certificate')}
              </button>
              <button onClick={() => (kind === 'sat-clique' && certificateSide === 'source' ? openEditor('instance') : openEditor('witness'))}>
                {tr('Edit selected certificate')}
              </button>
              <button onClick={findCertificate}>{tr('Find witness by bounded enumeration')}</button>
              <button onClick={mapBack}>{tr('Map target certificate back')}</button>
            </div>
            <p>{tr(`Current ${certificateSide} certificate: ${certificateValid ? 'accepted' : 'rejected'}.`)}</p>
            {message && <p role="status">{tr(message)}</p>}
            <div className="rd-lab-checks">
              {checks.map((c, i) => (
                <p key={i}>
                  {c.valid ? '✓ ' : '✗ '}
                  {tr(c.label)}
                  {' · '}
                  {tr(c.detail)}
                </p>
              ))}
            </div>
          </Panel>
          {review}
        </div>
      ) : (
        <Panel title={tr('Your Reduction Proof Notes')} icon={<BookOpen />} className="rd-notes">
          <LanguageSelector />
          <label>
            {tr('State f, the target threshold, both proof directions and a running-time bound.')}
            <textarea aria-label={tr('Reduction proof notes')} value={notes} onChange={(e) => setNotes(e.target.value)} />
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
        className="rd-dialog"
        aria-label={tr(
          modal === 'instance'
            ? 'Edit reduction instance'
            : modal === 'witness'
              ? 'Edit reduction certificate'
              : modal === 'worked'
                ? 'Worked reduction construction'
                : 'Reduction proof explanation',
        )}
        onCancel={() => setModal(null)}
      >
        <button className="rd-close" aria-label={tr('Close reduction dialog')} onClick={() => setModal(null)}>
          <X size={18} />
        </button>
        {modal === 'instance' ? (
          <>
            <h2>{tr('Edit Reduction Instance')}</h2>
            <p>
              {tr(
                kind === 'sat-clique'
                  ? 'Use 1–3 clauses, with 1–3 signed variable IDs 1–8 each. Separate clauses with semicolons; − means NOT.'
                  : 'Use 1–8 vertices and undirected edges such as 1-2, 2-3. Empty edge input creates an edgeless graph. The threshold must be from 0 to n.',
              )}
            </p>
            {kind !== 'sat-clique' && (
              <>
                <label>
                  {tr('Graph vertices n')}
                  <input aria-label={tr('Source graph vertex count')} value={draftN} onChange={(e) => setDraftN(e.target.value)} />
                </label>
                <label>
                  {tr('Threshold k')}
                  <input aria-label={tr('Source threshold k')} value={draftK} onChange={(e) => setDraftK(e.target.value)} />
                </label>
              </>
            )}
            <label>
              {tr(kind === 'sat-clique' ? 'CNF clauses' : 'Graph edges')}
              <textarea aria-label={tr('Source reduction input')} value={draft} onChange={(e) => setDraft(e.target.value)} />
            </label>
            {error && <p role="alert">{tr(error)}</p>}
            <button className="rd-primary" onClick={applyEditor}>
              {tr('Apply reduction instance')}
            </button>
          </>
        ) : modal === 'witness' ? (
          <>
            <h2>{tr('Edit Candidate Certificate')}</h2>
            <p>
              {tr('Supply 1-based vertex IDs. Incorrect, repeated or out-of-range IDs are accepted as candidate text and explicitly rejected by the verifier.')}
            </p>
            <label>
              {tr('Candidate vertex IDs')}
              <input aria-label={tr('Candidate reduction certificate IDs')} value={draftWitness} onChange={(e) => setDraftWitness(e.target.value)} />
            </label>
            {error && <p role="alert">{tr(error)}</p>}
            <button className="rd-primary" onClick={applyEditor}>
              {tr('Apply candidate certificate')}
            </button>
          </>
        ) : modal === 'worked' ? (
          <>
            <h2>{tr(result.example.label)}</h2>
            <ol>
              {currentSteps.map((s) => (
                <li key={s}>{tr(s)}</li>
              ))}
            </ol>
            <p>
              {tr(
                `Source threshold ${result.sourceK}; target threshold ${result.targetK}. Source candidate ${result.sourceValid ? 'accepted' : 'rejected'}; target candidate ${targetCheck.valid ? 'accepted' : 'rejected'}.`,
              )}
            </p>
            <p>
              {tr(
                kind === 'sat-clique'
                  ? 'An m-clique contains one literal from every clause and no contradictory pair. Set those literals true and extend the assignment arbitrarily.'
                  : 'The complement reverses edge/nonedge relationships on distinct pairs. Complementing a cover’s vertex set gives an independent set; that independent set is a clique in the other graph.',
              )}
            </p>
            {kind === 'sat-clique' && (
              <ol>
                {result.literals.map((item, i) => (
                  <li key={i}>{tr(`Vertex ${i + 1}: clause ${item.clause + 1}, literal ${item.literal < 0 ? '¬' : ''}x${Math.abs(item.literal)}.`)}</li>
                ))}
              </ol>
            )}
            <button
              className="rd-primary"
              onClick={() => {
                setModal(null)
                setTab('Visualization')
                startAnimation()
              }}
            >
              {tr('Walk through the construction')}
            </button>
          </>
        ) : (
          <>
            <h2>{tr('Correctness Requires Both Directions')}</h2>
            <p>
              {tr(
                message ||
                  'A polynomial many-one reduction preserves YES and NO answers for every source input. A source YES witness maps forward; any target YES witness maps back. A failed proposed witness alone settles neither decision problem.',
              )}
            </p>
            <p>
              {tr(
                'When G has a clique of size at least k, V ∖ S covers G̅ with size at most n−k. Conversely, any cover C of G̅ of size at most n−k leaves at least k vertices with no complement edge between them, hence a clique in G.',
              )}
            </p>
          </>
        )}
      </dialog>
    </div>
  )
}
