// @localized-render
import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  BookOpen,
  Check,
  CircleHelp,
  Code2,
  FileText,
  Lightbulb,
  Moon,
  Network,
  Pause,
  Pencil,
  Play,
  RotateCcw,
  Search,
  Settings,
  ShieldCheck,
  SkipBack,
  SkipForward,
  Sun,
  TriangleAlert,
  X,
} from 'lucide-react'
import { tx, useLocaleRender } from '../i18n/render'
import { allModules } from '../algorithms'
import { algorithmPath } from '../utils/routing'
import { LanguageSelector } from '../i18n/LanguageSelector'
import { AccountControl } from '../account/AccountControl'
import { usePersistentState, persistentString } from '../hooks/usePersistentState'
import { MockupTabs, type MockupPageProps, type MockupTab } from './MockupLessonChrome'
import { parseCertificateIds, searchComplexitySat, verifyComplexitySat, type Cnf } from './complexityClassesModel'
import {
  buildThreeSatClique,
  findThreeSatClique,
  formatThreeSat,
  parseThreeSatFormula,
  threeSatChoicesToIds,
  threeSatClauseLabel,
  threeSatLiteralLabel,
  threeSatPresets,
  threeSatReference,
  verifyThreeSatClique,
  type ThreeSatPair,
} from './threeSatCliqueModel'
import './three-sat-clique-mockup.css'

const tr = (s: string) => tx(s, 'studios'),
  tabs: MockupTab[] = ['Learn', 'Visualization', 'Code', 'Practice', 'Experiments', 'Notes']
const steps = [
  ['Start with 3-CNF', 'Formula with m clauses, 3 literals each.'],
  ['Create vertices', 'Add three literal-occurrence vertices per clause.'],
  ['Add edges', 'Connect different clauses only when literals are not contradictory.'],
  ['Find m-clique', 'Choose one compatible literal from each clause.'],
  ['Correspond to assignment', 'Set the selected literals true; extend the remaining variables.'],
  ['Conclude', '3-SAT ≤ₚ CLIQUE. Graph has 3m vertices and O(m²) candidate edges.'],
]
const referenceChoices = [0, 1, 2]
function ReductionBars() {
  return (
    <svg viewBox="0 0 26 26" fill="currentColor" aria-hidden="true">
      <rect x="3" y="12" width="5" height="12" rx="2" opacity=".65" />
      <rect x="10" y="3" width="5" height="21" rx="2" />
      <rect x="17" y="8" width="5" height="16" rx="2" opacity=".75" />
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
    <section className={`st-panel ${className}`}>
      <header>
        <span className="st-icon">{icon}</span>
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
function Switch({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <label className="st-switch">
      <input type="checkbox" aria-label={label} checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <i />
      {label}
    </label>
  )
}
const encodeAssignment = (assignment: boolean[]) => assignment.map((value, i) => `${threeSatLiteralLabel(i + 1)} = ${value ? 'True' : 'False'}`).join(', ')
const code = `reduce3SatToClique(φ):
    m = number_of_clauses(φ)
    create one vertex v[i,j] for each literal occurrence
    for each unordered pair of vertices u, v:
        if clause(u) != clause(v) and literal(u) != NOT literal(v):
            add edge {u, v}
    return (G, k = m)

verifyClique(G, S):
    require m distinct, in-range occurrence IDs
    require an edge for every pair in S
    decode each selected literal as true
    extend unmentioned variables arbitrarily
    verify φ under that assignment

Forward: a satisfying assignment has a true literal in every clause.
Their occurrence vertices form an m-clique.
Backward: an m-clique takes one vertex from every clause; no pair
contradicts. Its literals therefore extend to a satisfying assignment.

|V| = 3m. Each pair of different clauses has at most 9 edges.
|E| ≤ 9m(m−1)/2, so construction uses O(m²) pair checks.
Searching for a clique is separate from constructing the graph.`

export function ThreeSatCliqueMockupLesson(props: MockupPageProps) {
  useLocaleRender()
  const graphId = useId(),
    navigate = useNavigate(),
    [tab, setTab] = useState<MockupTab>('Visualization'),
    [clauses, setClauses] = useState<Cnf>(threeSatReference),
    [example, setExample] = useState('reference'),
    [choices, setChoices] = useState<(number | null)[]>(referenceChoices),
    [labels, setLabels] = useState(true),
    [blocked, setBlocked] = useState(false),
    [highlight, setHighlight] = useState(true),
    [stage, setStage] = useState(1),
    [stepMode, setStepMode] = useState(false),
    [edgeCount, setEdgeCount] = useState<number | null>(null),
    [playing, setPlaying] = useState(false),
    [speed, setSpeed] = useState(220),
    built = buildThreeSatClique(clauses),
    selected = threeSatChoicesToIds(choices),
    certificate = verifyThreeSatClique(clauses, selected),
    [assignment, setAssignment] = useState([true, true, false, true]),
    assignmentCheck = verifyComplexitySat(clauses, assignment)
  const [modal, setModal] = useState<'formula' | 'worked' | 'edge' | null>(null),
    dialog = useRef<HTMLDialogElement>(null),
    formulaInput = useRef<HTMLTextAreaElement>(null),
    [draft, setDraft] = useState(formatThreeSat(threeSatReference)),
    [error, setError] = useState(''),
    [inspectedPair, setInspectedPair] = useState<ThreeSatPair | null>(null),
    [message, setMessage] = useState(''),
    [prediction, setPrediction] = useState(''),
    [predictionMessage, setPredictionMessage] = useState(''),
    [edgePrediction, setEdgePrediction] = useState(''),
    [candidateText, setCandidateText] = useState('1, 5, 9'),
    [candidateIds, setCandidateIds] = useState<number[] | null>(null),
    [candidateError, setCandidateError] = useState('')
  const [query, setQuery] = useState(''),
    search = useRef<HTMLInputElement>(null),
    [fallbackTheme, setFallbackTheme] = useState(() => localStorage.getItem('algodrishti-theme') ?? 'light'),
    theme = props.theme ?? fallbackTheme,
    [notes, setNotes] = usePersistentState('algodrishti-three-sat-clique-notes', '', persistentString),
    [reviewed, setReviewed] = usePersistentState<number[]>('algodrishti-three-sat-clique-reviewed', [], {
      deserialize: (value) => {
        try {
          const v: unknown = JSON.parse(value)
          return Array.isArray(v) ? [...new Set(v.filter((n): n is number => Number.isInteger(n) && n >= 0 && n < 6))] : []
        } catch {
          return []
        }
      },
    })
  const matches = query.trim() ? allModules.filter((m) => `${m.name} ${m.summary}`.toLowerCase().includes(query.toLowerCase())).slice(0, 5) : [],
    studied = props.completed.includes(props.module.id),
    candidate = candidateIds ? verifyThreeSatClique(clauses, candidateIds) : null,
    practicePair = built.pairs.find((pair) => pair.reason === 'contradictory') ?? built.pairs[0]
  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem('algodrishti-theme', theme)
  }, [theme])
  useEffect(() => {
    if (modal) {
      dialog.current?.showModal()
      if (modal === 'formula') formulaInput.current?.focus()
    } else dialog.current?.close()
  }, [modal])
  useEffect(() => {
    if (!playing || edgeCount === null) return
    const timer = setTimeout(() => {
      const next = Math.min(edgeCount + 1, built.graph.edges.length)
      setEdgeCount(next)
      if (next === built.graph.edges.length) setPlaying(false)
    }, speed)
    return () => clearTimeout(timer)
  }, [playing, edgeCount, built.graph.edges.length, speed])
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
  function stopReplay() {
    setPlaying(false)
    setEdgeCount(null)
    setStage(1)
    setStepMode(false)
  }
  function load(next: Cnf, id: string) {
    const model = buildThreeSatClique(next)
    setClauses(next)
    setExample(id)
    setChoices(id === 'reference' ? referenceChoices : next.map(() => 0))
    setAssignment(Array.from({ length: model.variables }, (_, i) => (id === 'reference' ? [true, true, false, true][i] : false)))
    setCandidateText('')
    setCandidateIds(null)
    setCandidateError('')
    setMessage('')
    setPredictionMessage('')
    stopReplay()
  }
  function reset() {
    load(threeSatReference, 'reference')
    setLabels(true)
    setBlocked(false)
    setHighlight(true)
  }
  function openFormula() {
    setDraft(formatThreeSat(clauses))
    setError('')
    setModal('formula')
  }
  function chooseExample(value: string) {
    if (value === 'custom') {
      setExample('custom')
      openFormula()
    } else load(threeSatPresets.find((p) => p.id === value)!.clauses, value)
  }
  function applyFormula() {
    try {
      load(parseThreeSatFormula(draft), 'custom')
      setModal(null)
    } catch (e) {
      setError((e as Error).message)
    }
  }
  function pick(clause: number, index: number) {
    setChoices((old) => old.map((value, i) => (i === clause ? (value === index ? null : index) : value)))
    setMessage('')
  }
  function applyCliqueIds(ids: number[]) {
    setChoices(
      clauses.map((_, clause) => {
        const id = ids.find((value) => Math.floor(value / 3) === clause)
        return id === undefined ? null : id % 3
      }),
    )
    const checked = verifyThreeSatClique(clauses, ids)
    if (checked.assignment) setAssignment(checked.assignment)
  }
  function applyAssignment() {
    const ids = clauses.flatMap((clause, i) => {
      const index = clause.findIndex((lit) => (lit > 0 ? assignment[lit - 1] : !assignment[-lit - 1]))
      return index < 0 ? [] : [i * 3 + index]
    })
    applyCliqueIds(ids)
    setMessage(
      assignmentCheck.valid
        ? 'One true literal from each clause forms a valid clique.'
        : 'This assignment fails a clause; it cannot supply one true literal from every clause. A different assignment may still work.',
    )
  }
  function searchSat() {
    const found = searchComplexitySat(clauses)
    if (found.found) {
      setAssignment(found.assignment!)
      applyCliqueIds(clauses.map((clause, i) => i * 3 + clause.findIndex((lit) => (lit > 0 ? found.assignment![lit - 1] : !found.assignment![-lit - 1]))))
    }
    setMessage(
      found.found
        ? `Found a satisfying assignment after ${found.tried} checks. This enumerative search is separate from the polynomial construction.`
        : `Checked all ${found.total} assignments: this particular formula is unsatisfiable.`,
    )
  }
  function searchClique() {
    const found = findThreeSatClique(clauses)
    if (found.found) applyCliqueIds(found.selected)
    setMessage(
      found.found
        ? `Found an m-clique after ${found.tried} candidate choices. Its decoded assignment satisfies the formula.`
        : `Exhausted the clause-choice search (${found.tried} candidate choices): no m-clique exists for this formula. This is bounded exponential search.`,
    )
  }
  function animateEdges() {
    setStepMode(false)
    setStage(3)
    setEdgeCount(0)
    setPlaying(built.graph.edges.length > 0)
  }
  function goToStep(value: number) {
    setStage(value)
    setStepMode(true)
    setPlaying(false)
    setEdgeCount(null)
  }
  const canShowVertices = !stepMode || stage >= 2,
    shownEdges = stepMode && stage < 3 ? [] : built.graph.edges.slice(0, edgeCount ?? built.graph.edges.length),
    showSelected = highlight && (!stepMode || stage >= 4),
    graphWidth = clauses.length * 178 + 14,
    points = built.occurrences.map((o) => ({ x: 97 + 178 * o.clause, y: 62 + 88 * o.index })),
    reviewIndex = tabs.indexOf(tab)
  function edgePath(a: number, b: number) {
    const first = points[a],
      last = points[b],
      gap = built.occurrences[b].clause - built.occurrences[a].clause
    if (gap < 2) return `M${first.x} ${first.y}L${last.x} ${last.y}`
    const yAt = (t: number, offset: number) => first.y * (1 - t) + last.y * t + 2 * t * (1 - t) * offset
    const candidates = [0, 88, -88, 132, -132].map((offset) => {
      if (Array.from({ length: 21 }, (_, i) => yAt(i / 20, offset)).some((y) => y < 32 || y > 268)) return { offset, clearance: -1 }
      const clearance = Math.min(...Array.from({ length: gap - 1 }, (_, i) => Math.min(...[62, 150, 238].map((y) => Math.abs(y - yAt((i + 1) / gap, offset))))))
      return { offset, clearance }
    })
    const offset = candidates.reduce((best, next) => (next.clearance > best.clearance ? next : best)).offset
    return offset === 0
      ? `M${first.x} ${first.y}L${last.x} ${last.y}`
      : `M${first.x} ${first.y}Q${(first.x + last.x) / 2} ${(first.y + last.y) / 2 + offset} ${last.x} ${last.y}`
  }
  const review = (
    <button
      className="st-review"
      aria-pressed={reviewed.includes(reviewIndex)}
      onClick={() => setReviewed(reviewed.includes(reviewIndex) ? reviewed.filter((v) => v !== reviewIndex) : [...reviewed, reviewIndex])}
    >
      <Check size={15} />
      {tr(reviewed.includes(reviewIndex) ? 'Section reviewed' : 'Mark section reviewed')}
    </button>
  )
  const formulaPanel = (
    <Panel
      title={tr('3-CNF Formula and Clauses')}
      icon={<FileText />}
      className="st-formula-panel"
      action={
        <button className="st-edit" aria-label={tr('Edit 3-CNF formula')} onClick={openFormula}>
          <Pencil size={13} />
        </button>
      }
    >
      <button className="st-formula" aria-label={tr('Edit displayed formula')} onClick={openFormula}>
        {formatThreeSat(clauses)}
      </button>
      <div className="st-clause-list">
        {clauses.map((clause, i) => (
          <article key={i} className={`st-clause st-color-${i % 3}`}>
            <div>
              <h3>{tr(`Clause C${String(i + 1).replace(/\d/g, (d) => '₀₁₂₃₄₅₆₇₈₉'[Number(d)])}`)}</h3>
              <p>{threeSatClauseLabel(clause)}</p>
            </div>
            {clause.map((literal, index) => (
              <div className="st-occurrence" key={index}>
                <button
                  aria-label={tr(`Choose ${threeSatLiteralLabel(literal)} from clause ${i + 1} in formula`)}
                  aria-pressed={choices[i] === index}
                  onClick={() => pick(i, index)}
                >
                  {threeSatLiteralLabel(literal)}
                </button>
                <small>{built.occurrences[i * 3 + index].occurrence}</small>
              </div>
            ))}
          </article>
        ))}
      </div>
    </Panel>
  )
  const graphPanel = (
    <Panel
      title={tr('Graph G')}
      subtitle={tr('(candidate vertices and edges)')}
      icon={<Network />}
      className="st-graph-panel"
      action={<span className="st-m-badge">{`m = ${built.m}`}</span>}
    >
      <div className="st-graph-scroll">
        <svg
          className="st-graph"
          viewBox={`0 0 ${graphWidth} 298`}
          style={{ minWidth: graphWidth }}
          preserveAspectRatio="none"
          aria-label={tr(`Literal occurrence graph: ${built.graph.n} vertices, ${built.graph.edges.length} compatible edges, target clique size ${built.m}`)}
        >
          <defs>
            <radialGradient id={`${graphId}-blue`} cx="38%" cy="28%" r="75%">
              <stop stopColor="#ffffff" />
              <stop offset=".5" stopColor="#edf9ff" />
              <stop offset="1" stopColor="#c9e8ff" />
            </radialGradient>
            <radialGradient id={`${graphId}-gold`} cx="38%" cy="28%" r="75%">
              <stop stopColor="#fff49c" />
              <stop offset=".55" stopColor="#ffe475" />
              <stop offset="1" stopColor="#ffca55" />
            </radialGradient>
            {[0, 1, 2].map((i) => (
              <linearGradient key={i} id={`${graphId}-group-${i}`} x2="1" y2="1">
                <stop stopColor={['#fff7fb', '#f1f9ff', '#f1fff7'][i]} />
                <stop offset="1" stopColor={['#fbeef8', '#e8f4ff', '#e8fcf1'][i]} />
              </linearGradient>
            ))}
          </defs>
          {clauses.map((_, i) => (
            <g key={i}>
              <rect x={28 + 178 * i} y="0" width="135" height="298" rx="14" fill={`url(#${graphId}-group-${i % 3})`} />
              <text
                x={97 + 178 * i}
                y="22"
                textAnchor="middle"
                fontSize="18"
                fontWeight="600"
                fill={['#ef1247', '#0062ff', '#00aa5a'][i % 3]}
              >{`C${String(i + 1).replace(/\d/g, (d) => '₀₁₂₃₄₅₆₇₈₉'[Number(d)])}`}</text>
            </g>
          ))}
          {canShowVertices &&
            shownEdges.map(([a, b]) => {
              const chosen = showSelected && selected.includes(a) && selected.includes(b)
              return (
                <path
                  key={`${a}-${b}`}
                  d={edgePath(a, b)}
                  fill="none"
                  data-graph-edge="true"
                  stroke={chosen ? '#ff7900' : '#728fc7'}
                  strokeWidth={chosen ? 3 : 1.2}
                  className={chosen ? 'st-selected-edge' : 'st-compatible-edge'}
                  role="button"
                  tabIndex={0}
                  aria-label={tr(`Inspect compatible pair ${a + 1}, ${b + 1}`)}
                  onClick={() => {
                    setInspectedPair({ a, b, reason: 'compatible' })
                    setModal('edge')
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      setInspectedPair({ a, b, reason: 'compatible' })
                      setModal('edge')
                    }
                  }}
                />
              )
            })}
          {canShowVertices &&
            blocked &&
            built.pairs
              .filter((pair) => pair.reason === 'contradictory')
              .map((pair) => (
                <line
                  key={`blocked-${pair.a}-${pair.b}`}
                  x1={points[pair.a].x}
                  y1={points[pair.a].y}
                  x2={points[pair.b].x}
                  y2={points[pair.b].y}
                  className="st-forbidden-link"
                  stroke="#e94266"
                  strokeWidth="1.5"
                  strokeDasharray="5 5"
                  pointerEvents="none"
                />
              ))}
          {canShowVertices ? (
            built.occurrences.map((o) => {
              const point = points[o.id],
                chosen = showSelected && selected.includes(o.id)
              return (
                <g
                  key={o.id}
                  className="st-vertex"
                  role="button"
                  tabIndex={0}
                  aria-label={tr(`Choose ${o.label} from clause ${o.clause + 1} in graph`)}
                  aria-pressed={choices[o.clause] === o.index}
                  onClick={() => pick(o.clause, o.index)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      pick(o.clause, o.index)
                    }
                  }}
                >
                  <title>{`${o.occurrence}: ${o.label}`}</title>
                  {chosen && <circle cx={point.x} cy={point.y} r="28" fill="none" stroke="#ffe8a4" strokeWidth="2" />}
                  <circle
                    cx={point.x}
                    cy={point.y}
                    r="25"
                    fill={`url(#${graphId}-${chosen ? 'gold' : 'blue'})`}
                    stroke={chosen ? '#ff7e00' : '#6b83ff'}
                    strokeWidth={chosen ? 1.7 : 1.2}
                  />
                  {labels && (
                    <>
                      <text x={point.x} y={point.y + 7} textAnchor="middle" fontSize="23" fontWeight="600" fill="#072460">
                        {o.label}
                      </text>
                      <text
                        x={o.clause === 0 ? point.x - 36 : o.clause === clauses.length - 1 ? point.x + 36 : point.x}
                        y={o.clause === 0 || o.clause === clauses.length - 1 ? point.y + 7 : point.y + 44}
                        textAnchor={o.clause === 0 ? 'end' : o.clause === clauses.length - 1 ? 'start' : 'middle'}
                        fontSize="12"
                        fill="#4265a1"
                      >
                        {o.occurrence}
                      </text>
                    </>
                  )}
                </g>
              )
            })
          ) : (
            <text x={graphWidth / 2} y="150" textAnchor="middle" fontSize="15" fill="#466794">
              {tr('Start from the formula. Create its vertices in step 2.')}
            </text>
          )}
        </svg>
      </div>
      <div className="st-graph-legend">
        <span>
          <i className="st-legend-selected" />
          {tr(`Selected clique vertices (size ${selected.length})`)}
        </span>
        <span>
          <i className="st-legend-edge" />
          {tr('Edge (compatible literals)')}
        </span>
        <span>
          <i className="st-legend-forbidden" />
          {tr('No edge: same clause or contradiction')}
        </span>
        <span>
          <i className="st-legend-other" />
          {tr('Other vertex')}
        </span>
      </div>
      <p className={`st-selection-status ${certificate.valid ? 'st-valid' : 'st-invalid'}`} role="status">
        {tr(
          certificate.valid
            ? `Valid ${built.m}-clique; the decoded assignment satisfies φ.`
            : selected.length < built.m
              ? 'Choose one literal from every clause. A missing choice is not proof of unsatisfiability.'
              : 'Rejected clique: selected literals contradict or lack an edge. A different selection may work.',
        )}
      </p>
      {edgeCount !== null && (
        <div className="st-edge-playback">
          <span role="status">{tr(`${edgeCount} of ${built.graph.edges.length} compatible edges constructed.`)}</span>
          <button
            aria-label={tr(playing ? 'Pause edge construction' : 'Resume edge construction')}
            disabled={edgeCount === built.graph.edges.length}
            onClick={() => setPlaying(!playing)}
          >
            {playing ? <Pause size={14} /> : <Play size={14} />}
          </button>
          <label>
            {tr('Speed')}
            <select aria-label={tr('Edge construction speed')} value={speed} onChange={(e) => setSpeed(Number(e.target.value))}>
              <option value={220}>{tr('Normal')}</option>
              <option value={50}>{tr('Fast')}</option>
              <option value={700}>{tr('Slow')}</option>
            </select>
          </label>
        </div>
      )}
    </Panel>
  )
  const controls = (
    <Panel
      title={tr('Build and Explore')}
      subtitle={tr('Interact with the graph to see the reduction in action.')}
      icon={<Settings />}
      className="st-build-panel"
    >
      <h3>{tr('Select one literal from each clause (build a clique):')}</h3>
      <div className="st-choice-rows">
        {clauses.map((clause, i) => (
          <div key={i} className={`st-choice-row st-color-${i % 3}`}>
            <span>
              <b>{`C${String(i + 1).replace(/\d/g, (d) => '₀₁₂₃₄₅₆₇₈₉'[Number(d)])}:`}</b>
              {threeSatClauseLabel(clause)}
            </span>
            <div>
              {clause.map((literal, index) => (
                <button
                  key={index}
                  aria-label={tr(`Select ${threeSatLiteralLabel(literal)} in clause ${i + 1}`)}
                  aria-pressed={choices[i] === index}
                  onClick={() => pick(i, index)}
                >
                  {threeSatLiteralLabel(literal)}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
      <h3 className="st-animation-title">{tr('Animation controls')}</h3>
      <button className="st-primary st-animate" onClick={animateEdges}>
        <Play size={15} />
        {tr('Animate Edge Construction')}
      </button>
      <button className="st-through" onClick={() => goToStep(stage === 6 ? 1 : stage + 1)}>
        <SkipForward size={14} />
        {tr('Step Through Reduction')}
      </button>
      <h3 className="st-options-title">{tr('View options')}</h3>
      <div className="st-option-help">
        <Switch label={tr('Show forbidden links (x and ¬x)')} checked={blocked} onChange={setBlocked} />
        <button
          aria-label={tr('Explain edge construction rules')}
          onClick={() => {
            setInspectedPair(null)
            setModal('edge')
          }}
        >
          <CircleHelp size={17} />
        </button>
      </div>
      <Switch label={tr('Highlight selected clique')} checked={highlight} onChange={setHighlight} />
    </Panel>
  )
  const footer = (
    <div className="st-footer-grid">
      <Panel title={tr('Key Takeaways')} icon={<Lightbulb />} className="st-takeaways">
        <ul>
          {[
            'Create one vertex per literal occurrence (3m vertices).',
            'Add edges between non-contradictory literals from different clauses.',
            'A clique of size m picks one true literal per clause.',
            'The reduction runs in polynomial time.',
          ].map((s) => (
            <li key={s}>{tr(s)}</li>
          ))}
        </ul>
      </Panel>
      <Panel
        title={tr('Worked Example')}
        icon={<FileText />}
        className="st-worked"
        action={
          <button className="st-primary" onClick={() => setModal('worked')}>
            {tr('Try It')}
          </button>
        }
      >
        <p>{tr('Choose compatible literal occurrences from the clauses.')}</p>
        <ul>
          <li>{tr(`Selected IDs: {${selected.map((id) => id + 1).join(', ')}}.`)}</li>
          <li>
            {tr(
              certificate.assignment
                ? `Assignment: ${encodeAssignment(certificate.assignment)}. Unmentioned variables may be chosen arbitrarily.`
                : 'No assignment is decoded from this rejected certificate.',
            )}
          </li>
        </ul>
      </Panel>
      <Panel title={tr('Correctness & Complexity')} icon={<ReductionBars />} className="st-correctness">
        <ul>
          {[
            'Forward: a satisfying assignment gives an m-clique with one vertex per clause.',
            'Backward: an m-clique chooses one literal per clause without contradictions.',
            'Graph has 3m vertices and O(m²) candidate edges.',
            'Construction is separate from finding a clique.',
          ].map((s) => (
            <li key={s}>{tr(s)}</li>
          ))}
        </ul>
      </Panel>
      <Panel title={tr('Common Pitfalls')} icon={<TriangleAlert />} className="st-pitfalls">
        <ul>
          {[
            'Connecting vertices from the same clause.',
            'Adding an edge between x and ¬x.',
            'Treating repeated literal occurrences as one vertex.',
            'Assuming a rejected selection proves UNSAT.',
            'Confusing the construction with the clique search.',
          ].map((s) => (
            <li key={s}>{tr(s)}</li>
          ))}
        </ul>
      </Panel>
    </div>
  )
  const candidateSummary = candidate
    ? candidate.valid
      ? `Accepted m-clique. Decoded assignment: ${encodeAssignment(candidate.assignment!)}. All clauses are true.`
      : 'Rejected certificate. Check its size, distinct IDs, clause coverage and all pairwise edges. This does not prove UNSAT.'
    : ''
  return (
    <div className="mom-page target-visual three-sat-page" data-target="25">
      <div className="mom-topbar st-topbar">
        <button
          className="st-back"
          aria-label={tr('Back to certificates and reductions')}
          onClick={() => navigate('/complexity-theory/certificates-reductions')}
        >
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
          <button className="st-search-key" aria-label={tr('Focus topic search')} onClick={() => search.current?.focus()}>
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
      <header className="st-lesson-header">
        <button
          className="st-back"
          aria-label={tr('Open certificates and reductions lesson')}
          onClick={() => navigate('/complexity-theory/certificates-reductions')}
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1>
            {tr('Worked Reduction: 3-SAT → Clique')}
            <span aria-hidden="true">{tr('Complexity Theory')}</span>
          </h1>
          <p>{tr('Construct one candidate literal vertex per clause occurrence.')}</p>
        </div>
        <div className="st-progress" aria-label={tr(`${reviewed.length} of 6 sections reviewed`)}>
          <span>{tr(`${reviewed.length} of 6 sections`)}</span>
          <div>
            {tabs.map((s, i) => (
              <i key={s} className={reviewed.includes(i) ? 'st-reviewed' : ''} />
            ))}
          </div>
        </div>
        <button className="st-primary st-start" onClick={() => setTab('Learn')}>
          {tr('Start Learning')}
          <ArrowRight size={18} />
        </button>
      </header>
      <MockupTabs active={tab} onChange={setTab} tabs={tabs} />
      {tab === 'Visualization' ? (
        <>
          <section className="st-visualization">
            <header className="st-visual-heading">
              <ReductionBars />
              <div>
                <h2>{tr('Interactive Visualization')}</h2>
                <p>
                  {tr(
                    'Explore the reduction from a 3-CNF formula to a CLIQUE instance. Each clause contributes three literal-occurrence vertices; edges connect compatible literals from different clauses.',
                  )}
                </p>
              </div>
              <div className="st-visual-options">
                <select aria-label={tr('3-SAT example formula')} value={example} onChange={(e) => chooseExample(e.target.value)}>
                  {threeSatPresets.map((p) => (
                    <option key={p.id} value={p.id}>{`${tr('Example: ')}${formatThreeSat(p.clauses)}`}</option>
                  ))}
                  <option value="custom">{tr('Custom formula…')}</option>
                </select>
                <Switch label={tr('Show vertex labels')} checked={labels} onChange={setLabels} />
                <Switch label={tr('Show contradictory edges')} checked={blocked} onChange={setBlocked} />
                <button onClick={reset}>
                  <RotateCcw size={16} />
                  {tr('Reset')}
                </button>
              </div>
            </header>
            <div className="st-dashboard-grid">
              {formulaPanel}
              {graphPanel}
              {controls}
            </div>
          </section>
          <section className="st-reduction-steps">
            <header>
              <FileText />
              <h2>{tr('Reduction Steps')}</h2>
              <p>{tr('Follow the construction from a 3-CNF formula to a clique instance.')}</p>
            </header>
            <div className="st-step-track">
              {steps.map(([title, description], i) => (
                <button key={title} aria-label={tr(`Reduction step ${i + 1}: ${title}`)} aria-pressed={stage === i + 1} onClick={() => goToStep(i + 1)}>
                  <i>{i + 1}</i>
                  <b>{tr(title)}</b>
                  <span>{tr(description)}</span>
                </button>
              ))}
            </div>
          </section>
          {stepMode && (
            <div className="st-step-explanation">
              <p role="status">{tr(`Step ${stage}: ${steps[stage - 1][0]}. ${steps[stage - 1][1]}`)}</p>
              {stage === 5 && (
                <p>
                  {tr(
                    certificate.assignment
                      ? `Decoded assignment: ${encodeAssignment(certificate.assignment)}. Every clause is true.`
                      : 'Select a valid m-clique before decoding an assignment.',
                  )}
                </p>
              )}
              <button disabled={stage === 1} onClick={() => goToStep(stage - 1)}>
                <SkipBack size={14} />
                {tr('Previous reduction step')}
              </button>
              <button disabled={stage === 6} onClick={() => goToStep(stage + 1)}>
                {tr('Next reduction step')}
                <SkipForward size={14} />
              </button>
            </div>
          )}
          {footer}
          {review}
        </>
      ) : tab === 'Learn' ? (
        <div className="st-learning">
          <Panel title={tr('From Clauses to a Clique')} icon={<BookOpen />}>
            <p>
              {tr(
                'CLIQUE asks whether a graph contains at least k mutually adjacent vertices. For a 3-CNF formula with m clauses, construct three distinct literal-occurrence vertices per clause and set k = m.',
              )}
            </p>
            <div className="st-concept-grid">
              <article>
                <h3>{tr('Occurrence, not just variable')}</h3>
                <p>
                  {tr(
                    'The y in clause 1 and the y in clause 2 are different vertices. Their identical literal values are compatible; their clause positions remain distinct.',
                  )}
                </p>
              </article>
              <article>
                <h3>{tr('Compatible pair')}</h3>
                <p>
                  {tr(
                    'Add an edge exactly when two vertices belong to different clauses and are not x versus ¬x. Same-sign repeated literals in different clauses can share an edge.',
                  )}
                </p>
              </article>
              <article>
                <h3>{tr('Clique size m')}</h3>
                <p>
                  {tr(
                    'No within-clause edges exist, so any clique contains at most one vertex from each clause. Reaching m therefore requires exactly one from every clause.',
                  )}
                </p>
              </article>
            </div>
            <h3>{tr('Forward: assignment → clique')}</h3>
            <p>
              {tr(
                'A satisfying assignment makes at least one literal true in each clause. Choose one such occurrence per clause. All chosen literals can be true together, so no pair contradicts; all cross-clause pairs are edges.',
              )}
            </p>
            <h3>{tr('Backward: clique → assignment')}</h3>
            <p>
              {tr(
                'An m-clique contains one literal per clause with no contradictory pair. Make each selected literal true, assign unmentioned variables freely, and every clause has a true literal.',
              )}
            </p>
            <button
              className="st-primary"
              onClick={() => {
                setTab('Visualization')
                setModal('worked')
              }}
            >
              {tr('Explore the worked example')}
            </button>
          </Panel>
          <Panel title={tr('Polynomial Construction, Separate Search')} icon={<ShieldCheck />}>
            <p>
              {tr(
                `The current formula has m = ${built.m}: ${built.graph.n} vertices, ${built.graph.edges.length} compatible edges and ${built.pairs.filter((p) => p.reason === 'contradictory').length} contradictory cross-clause pairs. At most 9 edges can join any pair of clauses, giving at most 9m(m−1)/2 edges.`,
              )}
            </p>
            <p>
              {tr(
                'Creating and checking vertex pairs takes O(m²). Finding a satisfying assignment or an m-clique is a separate task. The laboratory uses explicitly bounded exhaustive searches, not a claimed polynomial SAT solver.',
              )}
            </p>
          </Panel>
          {review}
        </div>
      ) : tab === 'Code' ? (
        <Panel title={tr('Construct and Verify the Reduction')} icon={<Code2 />} className="st-code">
          <pre>{code}</pre>
          <p>
            {tr(
              'The editor accepts up to 6 clauses and 8 variables for a readable classroom graph. Repeated literals remain separate occurrence vertices. These input limits do not change the asymptotic proof.',
            )}
          </p>
          {review}
        </Panel>
      ) : tab === 'Practice' ? (
        <div className="st-practice">
          <Panel title={tr('Predict the Clique Size')} icon={<Lightbulb />}>
            <p>{tr(`The formula has ${built.m} clauses. What target k preserves satisfiability?`)}</p>
            <label>
              {tr('Predicted clique size')}
              <input aria-label={tr('Predicted clique size')} value={prediction} onChange={(e) => setPrediction(e.target.value)} />
            </label>
            <button
              className="st-primary"
              onClick={() =>
                setPredictionMessage(
                  prediction.trim() && Number(prediction) === built.m
                    ? 'Correct: k = m. The clique must choose one occurrence from each clause.'
                    : 'Try again: k equals the number of clauses, not the number of variables or vertices.',
                )
              }
            >
              {tr('Check prediction')}
            </button>
            {predictionMessage && <p role="status">{tr(predictionMessage)}</p>}
          </Panel>
          <Panel title={tr('Predict an Edge')} icon={<Network />}>
            <p>
              {tr(
                `Should ${built.occurrences[practicePair.a].occurrence} (${built.occurrences[practicePair.a].label}) and ${built.occurrences[practicePair.b].occurrence} (${built.occurrences[practicePair.b].label}) share an edge?`,
              )}
            </p>
            <button onClick={() => setEdgePrediction('Reconsider: this pair is in the same clause or contains a literal and its negation. No edge is added.')}>
              {tr('Add an edge')}
            </button>
            <button onClick={() => setEdgePrediction('Correct: no edge. Both the different-clause rule and non-contradiction rule must hold.')}>
              {tr('Do not add an edge')}
            </button>
            {edgePrediction && <p role="status">{tr(edgePrediction)}</p>}
          </Panel>
          <Panel title={tr('A Failed Selection Does Not Prove UNSAT')} icon={<TriangleAlert />}>
            <p>
              {tr(
                'Change the selected x in the first clause to a literal that contradicts another choice. That proposed clique fails. The same formula may still have a different valid clique.',
              )}
            </p>
            <button onClick={() => setTab('Visualization')}>{tr('Try a conflicting selection')}</button>
          </Panel>
          {review}
        </div>
      ) : tab === 'Experiments' ? (
        <div className="st-experiments">
          <Panel title={tr('Assignment and Clique Laboratory')} icon={<Settings />}>
            <p>{formatThreeSat(clauses)}</p>
            <button onClick={openFormula}>{tr('Edit 3-CNF formula')}</button>
            <div className="st-assignment-buttons">
              {assignment.map((value, i) => (
                <button
                  key={i}
                  aria-label={tr(`Toggle laboratory variable ${threeSatLiteralLabel(i + 1)}`)}
                  aria-pressed={value}
                  onClick={() => setAssignment(assignment.map((old, j) => (i === j ? !old : old)))}
                >{`${threeSatLiteralLabel(i + 1)} = ${value ? 'True' : 'False'}`}</button>
              ))}
            </div>
            <p>
              {tr(
                assignmentCheck.valid ? 'This assignment satisfies every clause.' : 'This assignment fails at least one clause; another assignment may work.',
              )}
            </p>
            <div className="st-lab-actions">
              <button onClick={applyAssignment}>{tr('Choose true literals from assignment')}</button>
              <button onClick={searchSat}>{tr('Find assignment by bounded enumeration')}</button>
              <button onClick={searchClique}>{tr('Find clique by bounded search')}</button>
            </div>
            {message && <p role="status">{tr(message)}</p>}
          </Panel>
          <Panel title={tr('Verify Any Proposed Clique')} icon={<ShieldCheck />}>
            <p>
              {tr(
                'Use 1-based occurrence IDs. A certificate must contain m distinct vertices and every selected pair must be an edge. Rejected certificates do not prove the formula unsatisfiable.',
              )}
            </p>
            <label>
              {tr('Candidate occurrence IDs')}
              <input aria-label={tr('Candidate clique IDs')} value={candidateText} onChange={(e) => setCandidateText(e.target.value)} />
            </label>
            <button
              className="st-primary"
              onClick={() => {
                try {
                  setCandidateIds(parseCertificateIds(candidateText))
                  setCandidateError('')
                } catch (e) {
                  setCandidateIds(null)
                  setCandidateError((e as Error).message)
                }
              }}
            >
              {tr('Verify candidate clique')}
            </button>
            {candidateError && <p role="alert">{tr(candidateError)}</p>}
            {candidate && <p role="status">{tr(candidateSummary)}</p>}
            {candidate?.valid && (
              <button
                onClick={() => {
                  applyCliqueIds(candidateIds!)
                  setTab('Visualization')
                }}
              >
                {tr('Use this clique in the graph')}
              </button>
            )}
          </Panel>
          {review}
        </div>
      ) : (
        <Panel title={tr('Your 3-SAT Reduction Notes')} icon={<BookOpen />} className="st-notes">
          <LanguageSelector />
          <label>
            {tr('Explain both proof directions and why contradictory literals cannot both be selected.')}
            <textarea aria-label={tr('3-SAT reduction notes')} value={notes} onChange={(e) => setNotes(e.target.value)} />
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
        className="st-dialog"
        aria-label={tr(modal === 'formula' ? 'Edit 3-CNF formula' : modal === 'worked' ? 'Worked 3-SAT to Clique example' : 'Literal edge rule explanation')}
        onCancel={() => setModal(null)}
      >
        <button className="st-close" aria-label={tr('Close 3-SAT dialog')} onClick={() => setModal(null)}>
          <X size={18} />
        </button>
        {modal === 'formula' ? (
          <>
            <h2>{tr('Edit 3-CNF Formula')}</h2>
            <p>
              {tr(
                'Use 1–6 clauses with exactly 3 literals each. Write x, y, z, w or variable IDs 1–8; ¬, !, ~ or − means NOT. Separate clauses with ∧, AND, semicolons or newlines. Repeated literals are allowed.',
              )}
            </p>
            <label>
              {tr('Formula')}
              <textarea ref={formulaInput} aria-label={tr('3-CNF formula input')} value={draft} onChange={(e) => setDraft(e.target.value)} />
            </label>
            {error && <p role="alert">{tr(error)}</p>}
            <button className="st-primary" onClick={applyFormula}>
              {tr('Apply formula')}
            </button>
          </>
        ) : modal === 'worked' ? (
          <>
            <h2>{tr('Worked Example: 3-SAT → Clique')}</h2>
            <p>{formatThreeSat(clauses)}</p>
            <p>{tr(`m = ${built.m}; |V| = ${built.graph.n}; |E| = ${built.graph.edges.length}; target k = ${built.m}.`)}</p>
            <p>
              {tr(
                certificate.assignment
                  ? `Selected occurrence IDs {${selected.map((id) => id + 1).join(', ')}} form a clique. Decoded assignment: ${encodeAssignment(certificate.assignment)}. Every clause is true.`
                  : 'The current candidate is rejected. Choose one compatible literal from every clause; a different candidate may succeed.',
              )}
            </p>
            <ol>
              {built.occurrences.map((o) => (
                <li key={o.id}>{tr(`ID ${o.id + 1}: ${o.occurrence}, literal ${o.label}, clause ${o.clause + 1}.`)}</li>
              ))}
            </ol>
            <button
              className="st-primary"
              onClick={() => {
                setModal(null)
                goToStep(1)
              }}
            >
              {tr('Walk through all six steps')}
            </button>
          </>
        ) : (
          <>
            <h2>{tr('Which Pairs Become Edges?')}</h2>
            {inspectedPair && (
              <p>
                {tr(
                  `${built.occurrences[inspectedPair.a].occurrence} (${built.occurrences[inspectedPair.a].label}) and ${built.occurrences[inspectedPair.b].occurrence} (${built.occurrences[inspectedPair.b].label}): ${inspectedPair.reason === 'compatible' ? 'compatible, so an edge exists.' : 'no graph edge.'}`,
                )}
              </p>
            )}
            <p>
              {tr(
                'Add a graph edge exactly when two literal occurrences belong to different clauses and are not a variable and its negation. Identical literals in different clauses are compatible.',
              )}
            </p>
            <p>
              {tr(
                'The dashed red helper links mark forbidden contradictory pairs. They are not graph edges. Vertices in one clause also have no edges between them, which forces one choice per clause in an m-clique.',
              )}
            </p>
            <p>
              {tr(
                `Current graph: ${built.graph.edges.length} compatible edges; ${built.pairs.filter((p) => p.reason === 'contradictory').length} contradictory cross-clause pairs; ${built.pairs.filter((p) => p.reason === 'same-clause').length} within-clause pairs.`,
              )}
            </p>
          </>
        )}
      </dialog>
    </div>
  )
}
