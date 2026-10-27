// @localized-render
import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  AtSign,
  Bookmark,
  BookOpen,
  Check,
  CheckCircle2,
  Code2,
  FileText,
  FlaskConical,
  Info,
  Lightbulb,
  Moon,
  Network,
  Pencil,
  RotateCcw,
  Scale,
  Search,
  Settings,
  ShieldCheck,
  Star,
  Sun,
  Swords,
  TriangleAlert,
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
  buildComplexityReduction,
  certificateGraph,
  certificateMatrix,
  complexityProblems,
  complexityMapRegions,
  formatCnf,
  parseCertificateGraph,
  parseCertificateIds,
  parseCertificateMatrix,
  parseComplexityCnf,
  satVariableCount,
  searchComplexitySat,
  verifyComplexityClique,
  verifyComplexityCover,
  verifyComplexityFactor,
  verifyComplexitySat,
  verifyComplexityTour,
  workedThreeSat,
  type CertificateGraph,
  type ComplexityClass,
} from './complexityClassesModel'
import './complexity-classes-mockup.css'

const tr = (s: string) => tx(s, 'studios'),
  tabs: MockupTab[] = ['Learn', 'Visualization', 'Code', 'Practice', 'Experiments', 'Notes']
type Certificate = 'sat' | 'cover' | 'tour' | 'clique'
type Reduction = 'sat-clique' | 'clique-cover' | 'clique-tsp' | 'transitive'
const classDefinitions: Record<ComplexityClass, string> = {
  P: 'Decision languages decidable in polynomial time by a deterministic algorithm. P ⊆ NP; whether equality holds is open.',
  NP: 'Decision languages whose yes instances have polynomial-length certificates checked in polynomial time. NP means nondeterministic polynomial time, not “not polynomial”.',
  'NP-Hard':
    'For decision languages, every language in NP reduces to this problem in polynomial time. Hardness does not imply NP membership. Optimization tasks use the corresponding notion of computational hardness.',
  'NP-Complete':
    'The decision languages that are both in NP and NP-hard. An efficient solver for any one would imply P = NP. Their separation from P has not been proved.',
}
function Badge({ value }: { value: ComplexityClass }) {
  return <span className={`cx-badge cx-badge-${value.toLowerCase()}`}>{value}</span>
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
    <section className={`cx-panel ${className}`}>
      <header>
        <span className="cx-icon">{icon}</span>
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
    <label className="cx-switch">
      <input type="checkbox" aria-label={label} checked={value} onChange={(e) => onChange(e.target.checked)} />
      <i />
      {label}
    </label>
  )
}
function Truth({ value, label, onChange }: { value: boolean; label: string; onChange: () => void }) {
  return (
    <button className={`cx-truth ${value ? 'cx-true' : 'cx-false'}`} aria-label={label} aria-pressed={value} onClick={onChange}>
      {tr(value ? 'True' : 'False')}
    </button>
  )
}
function SmallGraph({ graph, chosen, cover = false }: { graph: CertificateGraph; chosen: number[]; cover?: boolean }) {
  const points = Array.from({ length: graph.n }, (_, i) => [70 + 52 * Math.sin((i * 2 * Math.PI) / graph.n), 48 - 35 * Math.cos((i * 2 * Math.PI) / graph.n)])
  return (
    <svg
      className="cx-small-graph"
      viewBox="0 0 140 96"
      aria-label={tr(`${graph.n} vertices, ${graph.edges.length} edges; selected vertices ${chosen.map((v) => v + 1).join(', ') || 'none'}`)}
    >
      {graph.edges.map(([a, b], i) => (
        <path
          key={i}
          d={`M${points[a][0]} ${points[a][1]}L${points[b][0]} ${points[b][1]}`}
          stroke={(cover ? chosen.includes(a) || chosen.includes(b) : chosen.includes(a) && chosen.includes(b)) ? '#0bb576' : '#c4d5eb'}
          strokeWidth="1.2"
        />
      ))}
      {points.map(([x, y], i) => (
        <g key={i}>
          <circle
            cx={x}
            cy={y}
            r={graph.n > 6 ? 8 : 10}
            fill={chosen.includes(i) ? '#bcf1d8' : '#e8f3ff'}
            stroke={chosen.includes(i) ? '#17b67c' : '#77a9e9'}
          />
          <text x={x} y={y + 3.5} textAnchor="middle" fontSize="10" fill="#15346b">
            {i + 1}
          </text>
        </g>
      ))}
    </svg>
  )
}
function ReductionArrow({ vertical = false }: { vertical?: boolean }) {
  return (
    <svg className={vertical ? 'cx-arrow-glyph cx-arrow-vertical' : 'cx-arrow-glyph'} viewBox="0 0 36 24" aria-hidden="true">
      <path d="M2 12H24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeDasharray="4 3" />
      <path d="M23 6 34 12 23 18Z" fill="currentColor" />
      {vertical && <circle cx="8" cy="12" r="2" fill="#122450" />}
    </svg>
  )
}
function ClassBars() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <rect x="2" y="11" width="4" height="10" rx="1.5" fillOpacity=".65" />
      <rect x="10" y="3" width="4" height="18" rx="1.5" fillOpacity=".8" />
      <rect x="18" y="7" width="4" height="14" rx="1.5" fillOpacity=".65" />
      <path d="M4 13V19M12 5V19M20 9V19" stroke="white" strokeWidth=".6" opacity=".7" />
    </svg>
  )
}
function ClassMap({
  examples,
  arrows,
  descriptions,
  onClass,
  onProblem,
  onExample,
}: {
  examples: boolean
  arrows: boolean
  descriptions: boolean
  onClass: (c: ComplexityClass) => void
  onProblem: (id: string) => void
  onExample: (name: string, text: string) => void
}) {
  const clip = useId()
  const hardMask = `${clip}-hard`,
    regions = complexityMapRegions
  const classButton = (name: ComplexityClass, x: number, y: number, w: number) => (
    <g
      role="button"
      tabIndex={0}
      aria-label={tr(`Explain class ${name}`)}
      onClick={() => onClass(name)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClass(name)
        }
      }}
    >
      <rect x={x - w / 2} y={y - 18} width={w} height="24" fill="transparent" pointerEvents="all" />
      <text
        x={x}
        y={y}
        textAnchor="middle"
        fontSize={name === 'NP-Complete' ? 15 : 18}
        fontWeight="700"
        fill={name === 'NP-Hard' ? '#9b001a' : name === 'NP-Complete' ? '#5a00a7' : name === 'P' ? '#00672d' : '#061f66'}
      >
        {name}
      </text>
    </g>
  )
  return (
    <div className="cx-map-scroll">
      <div className="cx-map-inner">
        <svg
          className="cx-class-map"
          viewBox="0 0 723 343"
          preserveAspectRatio="none"
          aria-label={tr('Schematic complexity class map; P versus NP remains open')}
          aria-describedby={`${clip}-note`}
        >
          <defs>
            <mask id={hardMask} maskUnits="userSpaceOnUse" x="0" y="0" width="723" height="343">
              <rect width="723" height="343" fill="black" />
              <ellipse {...regions.envelope} fill="white" />
              <ellipse {...regions.np} fill="black" />
              <ellipse {...regions.complete} fill="white" />
            </mask>
            <radialGradient id={`${clip}-pink`} gradientUnits="userSpaceOnUse" cx="315" cy="135" r="245">
              <stop stopColor="#fff5f8" />
              <stop offset=".45" stopColor="#ffdde5" />
              <stop offset="1" stopColor="#ffcfda" />
            </radialGradient>
            <radialGradient id={`${clip}-blue`} cx="50%" cy="50%" r="60%">
              <stop stopColor="#f4faff" />
              <stop offset=".6" stopColor="#deecfe" />
              <stop offset="1" stopColor="#bad3fe" />
            </radialGradient>
            <radialGradient id={`${clip}-purple`} cx="35%" cy="25%" r="80%">
              <stop stopColor="#f4dcfe" />
              <stop offset=".5" stopColor="#f4d2fe" />
              <stop offset="1" stopColor="#eebefe" />
            </radialGradient>
            <radialGradient id={`${clip}-green`} cx="50%" cy="35%" r="70%">
              <stop stopColor="#f2fff8" />
              <stop offset="1" stopColor="#c8f7df" />
            </radialGradient>
          </defs>
          <ellipse className="cx-hard-region" {...regions.envelope} fill={`url(#${clip}-pink)`} stroke="#ff718e" mask={`url(#${hardMask})`} />
          <ellipse className="cx-np-region" {...regions.np} fill={`url(#${clip}-blue)`} stroke="#287cff" />
          <ellipse className="cx-complete-region" {...regions.complete} fill={`url(#${clip}-purple)`} stroke="#ae5cff" strokeDasharray="5 3" />
          <ellipse {...regions.p} fill={`url(#${clip}-green)`} stroke="#66d794" />
          {classButton('P', 264, 199, 54)}
          {classButton('NP', 300, 112, 64)}
          {classButton('NP-Complete', 418, 180, 124)}
          {classButton('NP-Hard', 543, 162, 98)}
          {descriptions && (
            <g fill="#15376a" fontSize="12" textAnchor="middle" pointerEvents="none">
              <text x="300" y="132">
                <tspan x="300">{tr('Solutions verifiable')}</tspan>
                <tspan x="300" dy="15">
                  {tr('in polynomial time')}
                </tspan>
                <tspan x="300" dy="15">
                  {tr('(decision problems)')}
                </tspan>
              </text>
              <text x="264" y="217">
                <tspan x="264">{tr('Solvable in')}</tspan>
                <tspan x="264" dy="15">
                  {tr('polynomial time')}
                </tspan>
                <tspan x="264" dy="15">
                  {'P ⊆ NP'}
                </tspan>
              </text>
              <text x="418" y="196">
                <tspan x="418">{tr('In NP and')}</tspan>
                <tspan x="418" dy="15">
                  {'NP-Hard'}
                </tspan>
                <tspan x="418" dy="15">
                  {tr('(hardest problems')}
                </tspan>
                <tspan x="418" dy="15">
                  {tr('in NP)')}
                </tspan>
              </text>
              <text x="543" y="185" fontSize="10.5">
                <tspan x="543">{tr('At least as hard as every')}</tspan>
                <tspan x="543" dy="15">
                  {tr('problem in NP')}
                </tspan>
                <tspan x="543" dy="15">
                  {tr('(may not be in NP)')}
                </tspan>
              </text>
            </g>
          )}
          {examples && arrows && (
            <g strokeWidth="2">
              <path d="M139 98L226 188" stroke="#00b659" />
              <circle cx="226" cy="188" r="5" fill="#008d26" />
              <path d="M185 281L219 264" stroke="#005bff" />
              <circle cx="219" cy="264" r="5" fill="#005bff" />
              <path d="M537 76L433 152" stroke="#9000d6" />
              <circle cx="433" cy="152" r="5" fill="#9000d6" />
              <path d="M565 290L525 274" stroke="#c8162f" />
              <circle cx="525" cy="274" r="5" fill="#b20f24" />
            </g>
          )}
        </svg>
        <p id={`${clip}-note`} className="cx-map-note">
          {tr('NP: blue, green, purple. NP-hard: pink, purple. Schematic assumes P ≠ NP; equality remains open.')}
        </p>
        {examples && (
          <>
            <div className="cx-example-box cx-example-p">
              <b>{tr('Examples in P')}</b>
              <ul>
                <li>
                  <button onClick={() => onProblem('connectivity')}>{tr('Graph connectivity')}</button>
                </li>
                <li>
                  <button
                    onClick={() =>
                      onExample(
                        'Spanning-tree decision',
                        'Ask whether a spanning tree of total weight at most k exists. Compute an MST and compare its cost with k; disconnected graphs have no spanning tree. This decision language is in P and therefore also in NP.',
                      )
                    }
                  >
                    {tr('Minimum spanning tree')}
                  </button>
                </li>
                <li>
                  <button
                    onClick={() =>
                      onExample(
                        'Shortest-path decision',
                        'For non-negative edge weights, compute a shortest path with Dijkstra and compare its length with k. This decision formulation is in P. Specifying the problem domain matters.',
                      )
                    }
                  >
                    {tr('Shortest path (decision)')}
                  </button>
                </li>
              </ul>
            </div>
            <div className="cx-example-box cx-example-npc">
              <b>{tr('Examples in NP-Complete')}</b>
              <ul>
                {[
                  ['SAT / 3-SAT', 'sat'],
                  ['Clique (decision)', 'clique'],
                  ['Vertex Cover (decision)', 'vertex-cover'],
                  ['Hamiltonian Cycle', 'hamiltonian'],
                ].map(([name, id]) => (
                  <li key={id}>
                    <button
                      onClick={() =>
                        id === 'clique'
                          ? onExample(
                              'CLIQUE decision',
                              'Given G and k, ask whether G contains a clique of at least k vertices. A list of mutually adjacent distinct vertices verifies yes instances. 3-SAT reduces to CLIQUE.',
                            )
                          : id === 'hamiltonian'
                            ? onExample(
                                'Hamiltonian Cycle',
                                'Ask whether a graph has a cycle visiting every vertex exactly once. A vertex permutation is a short certificate. The general decision problem is NP-complete.',
                              )
                            : onProblem(id)
                      }
                    >
                      {tr(name)}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            <div className="cx-example-box cx-example-np">
              <b>
                {tr('Examples in NP')}
                <br />
                {tr('(not known in P)')}
              </b>
              <ul>
                <li>
                  <button onClick={() => onProblem('factor')}>{tr('Integer factoring (decision)')}</button>
                </li>
                <li>
                  <button
                    onClick={() =>
                      onExample(
                        'Graph Isomorphism',
                        'Ask whether a bijection between two graph vertex sets preserves adjacency. The bijection is a polynomial-size certificate. This is in NP; polynomial-time classical solvability and NP-completeness are not established here.',
                      )
                    }
                  >
                    {tr('Graph isomorphism')}
                  </button>
                </li>
                <li>
                  <button onClick={() => onProblem('tsp-decision')}>{tr('TSP (decision version)')}</button>
                </li>
              </ul>
            </div>
            <div className="cx-example-box cx-example-hard">
              <b>
                {tr('Examples in NP-Hard')}
                <br />
                {tr('(outside NP)')}
              </b>
              <ul>
                <li>
                  <button onClick={() => onProblem('tsp-optimization')}>{tr('TSP (optimization)')}</button>
                </li>
                <li>
                  <button
                    onClick={() =>
                      onExample(
                        'Halting problem',
                        'The halting decision problem is undecidable and hence is not in NP. It is NP-hard: map a SAT formula to a program that searches assignments and halts exactly if it finds a satisfying one. The program description is polynomial in the formula size; its runtime need not be.',
                      )
                    }
                  >
                    {tr('Halting problem')}
                  </button>
                </li>
                <li>
                  <button
                    onClick={() =>
                      onExample(
                        'Minimum Vertex Cover',
                        'Finding a smallest vertex cover is an NP-hard optimization task. An exact optimizer would answer the decision question by comparing the minimum size with k. Do not classify the optimization task itself as an NP decision language.',
                      )
                    }
                  >
                    {tr('Minimum cover (opt.)')}
                  </button>
                </li>
              </ul>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
const reductionDescriptions: Record<Reduction, string> = {
  'sat-clique':
    'Create one vertex for each literal occurrence. Connect compatible literals from different clauses. The formula is satisfiable iff the graph has a clique with one vertex per clause. The worked construction below displays an actual instance.',
  'clique-cover':
    'A k-clique in G is an independent set of size k in its complement. Its remaining n−k vertices form a cover of the complement. Preserve the threshold and both directions of the yes/no equivalence.',
  'clique-tsp':
    'A polynomial reduction exists because CLIQUE is in NP and TSP decision is NP-hard. This schematic arrow states existence; it is not an implemented direct graph transformation. The concrete construction here covers 3-SAT → CLIQUE → VERTEX COVER.',
  transitive:
    'Compose the 3-SAT → CLIQUE construction with graph complementation and the cover threshold n−k. Polynomial reductions compose, and each transformation must preserve yes/no answers in both directions.',
}
const verifierCode = `SAT: evaluate each literal under the proposed assignment; accept iff every clause is true.
VERTEX COVER: reject repeated/out-of-range IDs; require |C| ≤ k; check every edge meets C.
CLIQUE: reject repeated/out-of-range IDs; require |C| ≥ k; check every selected vertex pair.
TSP DECISION: verify a closed permutation of every city; add each traveled edge once; compare cost ≤ k.
FACTOR DECISION: verify 1 < d < N, d ≤ k and N mod d = 0 using exact integer arithmetic.

These procedures verify candidate yes certificates. A rejected candidate does not prove a no instance.
For NP-completeness, prove membership in NP and reduce a known NP-hard language TO the new language.
A polynomial solver for any NP-complete language would put every NP language in P.`

export function ComplexityClassesMockupLesson(props: MockupPageProps) {
  useLocaleRender()
  const navigate = useNavigate(),
    [tab, setTab] = useState<MockupTab>('Visualization'),
    [problem, setProblem] = useState('sat'),
    profile = complexityProblems.find((p) => p.id === problem)!,
    [examples, setExamples] = useState(true),
    [arrows, setArrows] = useState(true),
    [descriptions, setDescriptions] = useState(true),
    [certificate, setCertificate] = useState<Certificate>('sat'),
    [comparison, setComparison] = useState<'tsp' | 'cover'>('tsp')
  const [clauses, setClauses] = useState([
      [1, -2],
      [-1, 3],
    ]),
    [assignment, setAssignment] = useState([true, false, true]),
    [graph, setGraph] = useState(certificateGraph),
    [cover, setCover] = useState([0, 2]),
    [clique, setClique] = useState([0, 1, 2]),
    [coverK, setCoverK] = useState(2),
    [cliqueK, setCliqueK] = useState(3),
    [matrix, setMatrix] = useState(certificateMatrix),
    [tour, setTour] = useState([0, 1, 3, 2, 0]),
    [tourK, setTourK] = useState(80)
  const sat = verifyComplexitySat(clauses, assignment),
    coverResult = verifyComplexityCover(graph, cover, coverK),
    cliqueResult = verifyComplexityClique(graph, clique, cliqueK),
    tourResult = verifyComplexityTour(matrix, tour, tourK),
    resultValid =
      certificate === 'sat' ? sat.valid : certificate === 'cover' ? coverResult.valid : certificate === 'clique' ? cliqueResult.valid : tourResult.valid
  const [query, setQuery] = useState(''),
    search = useRef<HTMLInputElement>(null),
    [fallbackTheme, setFallbackTheme] = useState(() => localStorage.getItem('algodrishti-theme') ?? 'light'),
    theme = props.theme ?? fallbackTheme,
    [notes, setNotes] = usePersistentState('algodrishti-complexity-classes-notes', '', persistentString),
    [reviewed, setReviewed] = usePersistentState<number[]>('algodrishti-complexity-classes-reviewed', [], {
      deserialize: (value) => {
        try {
          const a: unknown = JSON.parse(value)
          return Array.isArray(a) ? [...new Set(a.filter((v): v is number => Number.isInteger(v) && v >= 0 && v < 6))] : []
        } catch {
          return []
        }
      },
    })
  const [modal, setModal] = useState<'class' | 'example' | 'certificate' | 'reduction' | 'worked' | 'factor' | null>(null),
    dialog = useRef<HTMLDialogElement>(null),
    [activeClass, setActiveClass] = useState<ComplexityClass>('NP'),
    [exampleDetail, setExampleDetail] = useState({ name: '', text: '' }),
    [reduction, setReduction] = useState<Reduction>('sat-clique'),
    [workedAssignment, setWorkedAssignment] = useState([true, false, true]),
    worked = buildComplexityReduction(workedThreeSat, workedAssignment)
  const [draft, setDraft] = useState(''),
    [draftN, setDraftN] = useState('4'),
    [draftWitness, setDraftWitness] = useState(''),
    [draftK, setDraftK] = useState('2'),
    [error, setError] = useState(''),
    [factorN, setFactorN] = useState('91'),
    [factorK, setFactorK] = useState('10'),
    [factorD, setFactorD] = useState('7'),
    [factorMessage, setFactorMessage] = useState(''),
    [searchMessage, setSearchMessage] = useState(''),
    [prediction, setPrediction] = useState(''),
    [predictionMessage, setPredictionMessage] = useState(''),
    [hardnessMessage, setHardnessMessage] = useState('')
  const matches = query.trim() ? allModules.filter((m) => `${m.name} ${m.summary}`.toLowerCase().includes(query.toLowerCase())).slice(0, 5) : [],
    studied = props.completed.includes(props.module.id)
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
  function classInfo(value: ComplexityClass) {
    setActiveClass(value)
    setModal('class')
  }
  function exampleInfo(name: string, text: string) {
    setExampleDetail({ name, text })
    setModal('example')
  }
  function reductionInfo(value: Reduction) {
    setReduction(value)
    setModal('reduction')
  }
  function reset() {
    setProblem('sat')
    setExamples(true)
    setArrows(true)
    setDescriptions(true)
    setCertificate('sat')
    setComparison('tsp')
    setClauses([
      [1, -2],
      [-1, 3],
    ])
    setAssignment([true, false, true])
    setGraph(certificateGraph)
    setCover([0, 2])
    setClique([0, 1, 2])
    setCoverK(2)
    setCliqueK(3)
    setMatrix(certificateMatrix)
    setTour([0, 1, 3, 2, 0])
    setTourK(80)
    setSearchMessage('')
  }
  function editCertificate() {
    setError('')
    if (certificate === 'sat') setDraft(clauses.map((row) => row.join(' ')).join('; '))
    else if (certificate === 'tour') {
      setDraft(matrix.map((row) => row.join(', ')).join('\n'))
      setDraftWitness(tour.map((v) => v + 1).join(', '))
      setDraftK(String(tourK))
    } else {
      setDraftN(String(graph.n))
      setDraft(graph.edges.map(([a, b]) => `${a + 1}-${b + 1}`).join(', '))
      setDraftWitness((certificate === 'cover' ? cover : clique).map((v) => v + 1).join(', '))
      setDraftK(String(certificate === 'cover' ? coverK : cliqueK))
    }
    setModal('certificate')
  }
  function applyCertificate() {
    try {
      if (certificate === 'sat') {
        const next = parseComplexityCnf(draft)
        setClauses(next)
        setAssignment(Array.from({ length: satVariableCount(next) }, (_, i) => assignment[i] ?? false))
      } else {
        const k = Number(draftK)
        if (!draftK.trim() || !Number.isInteger(k) || k < 0 || k > 9999) throw new Error('Use an integer threshold k from 0 to 9999.')
        const witness = parseCertificateIds(draftWitness)
        if (certificate === 'tour') {
          setMatrix(parseCertificateMatrix(draft))
          setTour(witness)
          setTourK(k)
        } else {
          setGraph(parseCertificateGraph(draftN, draft))
          if (certificate === 'cover') {
            setCover(witness)
            setCoverK(k)
          } else {
            setClique(witness)
            setCliqueK(k)
          }
        }
      }
      setError('')
      setSearchMessage('')
      setModal(null)
    } catch (e) {
      setError((e as Error).message)
    }
  }
  function findWitness() {
    const result = searchComplexitySat(clauses)
    if (result.found) setAssignment(result.assignment)
    setSearchMessage(
      result.found
        ? `Found a satisfying assignment after checking ${result.tried} of ${result.total} candidates. This bounded exhaustive search is not a general polynomial-time SAT algorithm.`
        : `All ${result.total} assignments were checked. This particular formula is unsatisfiable; rejecting just one certificate would not prove that.`,
    )
  }
  function checkFactor() {
    try {
      const r = verifyComplexityFactor(factorN, factorK, factorD)
      setFactorMessage(
        r.valid
          ? `Valid factor certificate: ${r.d} divides ${r.n}, 1 < d < N and d ≤ ${r.k}. N uses ${r.bits} bits.`
          : 'Rejected candidate: check 1 < d < N, d ≤ k and exact divisibility. This alone does not prove that no other qualifying factor exists.',
      )
    } catch (e) {
      setFactorMessage((e as Error).message)
    }
  }
  const map = (
    <section className="cx-panel cx-map-panel">
      <ClassMap examples={examples} arrows={arrows} descriptions={descriptions} onClass={classInfo} onProblem={setProblem} onExample={exampleInfo} />
    </section>
  )
  const classifier = (
    <Panel
      title={tr('Classify a Problem')}
      subtitle={tr('Select a problem to see its known class and details.')}
      icon={<FlaskConical />}
      className="cx-classifier"
    >
      <div role="radiogroup" aria-label={tr('Select a problem to classify')}>
        {complexityProblems.map((p) => (
          <button key={p.id} role="radio" aria-checked={problem === p.id} aria-label={tr(p.name)} title={tr(p.name)} onClick={() => setProblem(p.id)}>
            <i />
            <span>{tr(p.name)}</span>
            <Badge value={p.badge} />
          </button>
        ))}
      </div>
    </Panel>
  )
  const details = (
    <Panel title={tr(profile.name)} icon={<Swords />} className="cx-details" action={<Badge value={profile.badge} />}>
      <div className="cx-detail-fields">
        {[
          ['Description', profile.description, Info],
          ['Why in NP?', profile.membership, Check],
          ['Why NP-Hard?', profile.hardness, Star],
          ['Applications', profile.applications, Settings],
        ].map(([title, text, Icon]) => {
          const FieldIcon = Icon as typeof Info
          return (
            <section key={String(title)}>
              <FieldIcon />
              <div>
                <h3>{tr(String(title))}</h3>
                {descriptions && <p>{tr(String(text))}</p>}
              </div>
            </section>
          )
        })}
        {problem === 'factor' && (
          <button
            className="cx-primary"
            onClick={() => {
              setFactorMessage('')
              setModal('factor')
            }}
          >
            {tr('Check a factor')}
          </button>
        )}
      </div>
    </Panel>
  )
  const certificatePanel = (
    <Panel
      title={tr('Certificate Examples')}
      subtitle={tr('See what a polynomial-size certificate looks like for problems in NP.')}
      icon={<FileText />}
      className={`cx-certificates ${certificate === 'sat' && formatCnf(clauses).length > 50 ? 'cx-expanded-certificate' : ''}`}
      action={
        <button className="cx-edit" aria-label={tr('Edit certificate example')} onClick={editCertificate}>
          <Pencil size={14} />
        </button>
      }
    >
      <nav className="cx-certificate-tabs" aria-label={tr('Certificate examples')}>
        {(['sat', 'cover', 'tour', 'clique'] as Certificate[]).map((id) => (
          <button key={id} aria-pressed={certificate === id} onClick={() => setCertificate(id)}>
            {tr(id === 'sat' ? 'SAT' : id === 'cover' ? 'Vertex Cover' : id === 'tour' ? 'TSP (Decision)' : 'Clique')}
          </button>
        ))}
      </nav>
      <div className="cx-certificate-body">
        <h3>
          <AtSign size={18} />
          {tr(
            certificate === 'sat'
              ? sat.valid
                ? 'SAT certificate (yes-instance)'
                : 'SAT certificate (candidate assignment)'
              : certificate === 'cover'
                ? 'Vertex Cover certificate'
                : certificate === 'tour'
                  ? 'TSP decision certificate'
                  : 'Clique certificate',
          )}
        </h3>
        <div className="cx-certificate-content">
          {certificate === 'sat' ? (
            <dl>
              <dt>{tr('Input:')}</dt>
              <dd className="cx-formula">
                {'φ = '}
                {formatCnf(clauses)}
              </dd>
              <dt>{tr('Certificate:')}</dt>
              <dd className="cx-assignments">
                {assignment.map((value, i) => (
                  <span key={i}>
                    {`x${String(i + 1).replace(/[0-9]/g, (d) => '₀₁₂₃₄₅₆₇₈₉'[Number(d)])} = `}
                    <Truth
                      value={value}
                      label={tr(`Toggle SAT variable x${i + 1}`)}
                      onChange={() => setAssignment(assignment.map((old, j) => (j === i ? !old : old)))}
                    />
                  </span>
                ))}
              </dd>
              <dt>{tr('Verification:')}</dt>
              <dd>
                {tr(
                  sat.valid
                    ? 'Substitute the assignment into φ and check it satisfies all clauses in polynomial time (O(|φ|)).'
                    : `This assignment fails clause ${sat.checks.find((c) => !c.satisfied)!.index + 1}. It does not prove the formula unsatisfiable.`,
                )}
              </dd>
            </dl>
          ) : certificate === 'tour' ? (
            <dl>
              <dt>{tr('Input:')}</dt>
              <dd>{tr(`${matrix.length} cities, threshold k = ${tourK}`)}</dd>
              <dt>{tr('Certificate:')}</dt>
              <dd>{tour.map((v) => v + 1).join(' → ')}</dd>
              <dt>{tr('Verification:')}</dt>
              <dd>
                {tr(
                  !tourResult.wellFormed
                    ? 'Not a closed permutation of all cities.'
                    : `Tour cost ${tourResult.cost} ${tourResult.valid ? '≤' : '>'} ${tourK}; checking cost does not prove optimality.`,
                )}
              </dd>
            </dl>
          ) : (
            <div className="cx-graph-certificate">
              <SmallGraph graph={graph} chosen={certificate === 'cover' ? cover : clique} cover={certificate === 'cover'} />
              <div>
                <b>{tr(`k = ${certificate === 'cover' ? coverK : cliqueK}`)}</b>
                <p>{tr(`Certificate: {${(certificate === 'cover' ? cover : clique).map((v) => v + 1).join(', ')}}`)}</p>
                <p>
                  {tr(
                    certificate === 'cover'
                      ? coverResult.valid
                        ? 'Every edge is covered and the size limit holds.'
                        : `Rejected certificate; ${coverResult.uncovered.length} uncovered edges. Check size, distinctness and IDs.`
                      : cliqueResult.valid
                        ? 'Every selected pair is adjacent; the size requirement holds.'
                        : `Rejected certificate; ${cliqueResult.missing.length} missing pairs. Check size, distinctness and IDs.`,
                  )}
                </p>
              </div>
            </div>
          )}
        </div>
        <div className={`cx-certificate-result ${resultValid ? 'cx-valid' : 'cx-invalid'}`} role="status">
          {resultValid ? <Check /> : <X />}
          <b>{tr(resultValid ? 'Valid certificate' : 'Rejected certificate')}</b>
          <span>{tr('verifies in polynomial time')}</span>
        </div>
      </div>
    </Panel>
  )
  const reductions = (
    <Panel
      title={tr('Reductions Between Problems')}
      subtitle={tr('Many NP-complete problems reduce to each other in polynomial time.')}
      icon={<Network />}
      className="cx-reductions"
    >
      <div className="cx-reduction-map">
        <button className="cx-reduction-node cx-reduction-sat" onClick={() => reductionInfo('sat-clique')}>
          <b>{'3-SAT'}</b>
          <span>{'(NP-Complete)'}</span>
        </button>
        <button className="cx-reduction-node cx-reduction-clique" onClick={() => reductionInfo('clique-cover')}>
          <b>{tr('Clique')}</b>
          <span>{'(NP-Complete)'}</span>
        </button>
        <button className="cx-reduction-node cx-reduction-cover" onClick={() => reductionInfo('transitive')}>
          <b>{tr('Vertex Cover')}</b>
          <span>{'(NP-Complete)'}</span>
        </button>
        <button className="cx-reduction-node cx-reduction-tsp" onClick={() => reductionInfo('clique-tsp')}>
          <b>{tr('TSP (Decision)')}</b>
          <span>{'(NP-Complete)'}</span>
        </button>
        {arrows && (
          <>
            <button
              className="cx-reduction-arrow cx-arrow-one"
              aria-label={tr('Explain reduction from 3-SAT to Clique')}
              onClick={() => reductionInfo('sat-clique')}
            >
              <ReductionArrow />
            </button>
            <button
              className="cx-reduction-arrow cx-arrow-two"
              aria-label={tr('Explain reduction from Clique to Vertex Cover')}
              onClick={() => reductionInfo('clique-cover')}
            >
              <ReductionArrow />
            </button>
            <button
              className="cx-reduction-arrow cx-arrow-three"
              aria-label={tr('Explain reduction from Clique to TSP decision')}
              onClick={() => reductionInfo('clique-tsp')}
            >
              <ReductionArrow vertical />
            </button>
          </>
        )}
      </div>
      <div className="cx-reduction-legend">
        <span>
          <ReductionArrow />
        </span>
        {tr('Polynomial-time reduction (A ≤ₚ B)')}
        <span>
          <ReductionArrow />
        </span>
        {tr('Also reduces to (transitive)')}
      </div>
    </Panel>
  )
  const comparisonPanel = (
    <Panel
      title={tr('Decision vs Optimization')}
      subtitle={tr('Same problem, different versions can have different complexity.')}
      icon={<Scale />}
      className="cx-comparison"
    >
      <nav>
        <button aria-pressed={comparison === 'tsp'} onClick={() => setComparison('tsp')}>
          {tr('Traveling Salesman Problem (TSP)')}
        </button>
        <button aria-pressed={comparison === 'cover'} onClick={() => setComparison('cover')}>
          {tr('Vertex Cover')}
        </button>
      </nav>
      <div className="cx-version-grid">
        <article>
          <h3>{tr('Decision version (in NP)')}</h3>
          <dl>
            <dt>{tr('Input:')}</dt>
            <dd>{tr('Graph G, integer k')}</dd>
            <dt>{tr('Question:')}</dt>
            <dd>{tr(comparison === 'tsp' ? 'Is there a tour of cost ≤ k?' : 'Is there a cover of size ≤ k?')}</dd>
            <dt>{tr('Complexity:')}</dt>
            <dd>
              <Badge value="NP-Complete" />
            </dd>
            <dt>{tr('Certificate:')}</dt>
            <dd>{tr(comparison === 'tsp' ? 'A tour (permutation) verifiable in polynomial time' : 'At most k vertices covering every edge')}</dd>
          </dl>
        </article>
        <article>
          <h3>{tr('Optimization version')}</h3>
          <dl>
            <dt>{tr('Input:')}</dt>
            <dd>{tr(comparison === 'tsp' ? 'Weighted graph G' : 'Graph G')}</dd>
            <dt>{tr('Question:')}</dt>
            <dd>{tr(comparison === 'tsp' ? 'What is the minimum tour cost?' : 'What is the minimum cover size?')}</dd>
            <dt>{tr('Complexity:')}</dt>
            <dd>
              <Badge value="NP-Hard" />
            </dd>
            <dt>{tr('Certificate:')}</dt>
            <dd>{tr('Candidate check ≠ optimality proof.')}</dd>
          </dl>
        </article>
      </div>
    </Panel>
  )
  const footer = (
    <div className="cx-footer-grid">
      <Panel title={tr('Key Takeaways')} icon={<Lightbulb />} className="cx-takeaways">
        <ul>
          {[
            'P ⊆ NP: problems solvable in polynomial time are verifiable in polynomial time.',
            'NP-complete: in NP and NP-hard (hardest problems in NP).',
            'NP-hard: at least as hard as every problem in NP, may lie outside NP.',
            'Whether P = NP remains open.',
          ].map((s) => (
            <li key={s}>{tr(s)}</li>
          ))}
        </ul>
      </Panel>
      <Panel
        title={tr('Worked Example')}
        icon={<FileText />}
        className="cx-worked"
        action={
          <button className="cx-primary" onClick={() => setModal('worked')}>
            {tr('Try It')}
          </button>
        }
      >
        <b>{tr('Reduce 3-SAT to Vertex Cover')}</b>
        <ol>
          {[
            'Construct a graph G from a 3-CNF formula φ.',
            'Show φ is satisfiable ⇔ G has a vertex cover of size k.',
            'Prove the reduction runs in polynomial time.',
            'Conclude Vertex Cover is NP-complete (since 3-SAT is).',
          ].map((s, i) => (
            <li key={i}>
              <span>{i + 1}</span>
              {tr(s)}
            </li>
          ))}
        </ol>
      </Panel>
      <Panel title={tr('Definitions & Correctness')} icon={<ClassBars />} className="cx-definitions">
        <ul>
          {[
            'P: decision problems solvable in polynomial time.',
            'NP: decision problems with polynomial-time verifiable certificates.',
            'NP-hard: every problem in NP reduces to it.',
            'NP-complete: in NP and NP-hard.',
            'To prove NP-complete: membership plus a known hard problem reduced to the new problem.',
          ].map((s) => (
            <li key={s}>{tr(s)}</li>
          ))}
        </ul>
      </Panel>
      <Panel title={tr('Common Misconceptions')} icon={<TriangleAlert />} className="cx-misconceptions">
        <ul>
          {[
            'NP-hard problems are always in NP.',
            'NP means “not polynomial”.',
            'NP-complete problems are proved outside P.',
            'An arbitrary reduction alone proves hardness.',
            'A feasible candidate proves optimality.',
          ].map((s) => (
            <li key={s}>
              {tr(s)}
              <X size={11} />
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  )
  const reviewIndex = tabs.indexOf(tab),
    review = (
      <button
        className="cx-review"
        aria-pressed={reviewed.includes(reviewIndex)}
        onClick={() => setReviewed(reviewed.includes(reviewIndex) ? reviewed.filter((v) => v !== reviewIndex) : [...reviewed, reviewIndex])}
      >
        <CheckCircle2 size={16} />
        {tr(reviewed.includes(reviewIndex) ? `${tab} reviewed` : `Mark ${tab} reviewed`)}
      </button>
    )
  return (
    <div className="mom-page target-visual complexity-classes-page" data-target="23">
      <div className="mom-topbar cx-topbar">
        <button className="cx-back" aria-label={tr('Back to branch and bound method')} onClick={() => navigate('/branch-and-bound/branch-bound-method')}>
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
          <button className="cx-search-key" aria-label={tr('Focus topic search')} onClick={() => search.current?.focus()}>
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
      <header className="cx-lesson-header">
        <button className="cx-back" aria-label={tr('Open branch and bound method lesson')} onClick={() => navigate('/branch-and-bound/branch-bound-method')}>
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1>
            {tr('P, NP, NP-Hard and NP-Complete')}
            <span aria-hidden="true">{tr('Complexity Theory')}</span>
          </h1>
          <p>{tr('Use decision problems and certificates to classify computational difficulty.')}</p>
        </div>
        <div className="cx-section-progress" aria-label={tr(`${reviewed.length} of 6 sections reviewed`)}>
          <span>{tr(`${reviewed.length} of 6 sections`)}</span>
          <div>
            {tabs.map((s, i) => (
              <i key={s} className={reviewed.includes(i) ? 'cx-section-done' : ''} />
            ))}
          </div>
        </div>
        <button className="cx-primary cx-start" onClick={() => setTab('Learn')}>
          {tr('Start Learning')}
          <ArrowRight size={18} />
        </button>
      </header>
      <MockupTabs active={tab} onChange={setTab} tabs={tabs} />
      {tab === 'Visualization' ? (
        <>
          <section className="cx-visualization">
            <header className="cx-visual-heading">
              <ClassBars />
              <div>
                <h2>{tr('Interactive Visualization')}</h2>
                <p>{tr('Explore the relationships between P, NP, NP-Complete and NP-Hard, with examples and reductions.')}</p>
              </div>
              <div className="cx-visual-options">
                <Switch label={tr('Show example problems')} value={examples} onChange={setExamples} />
                <Switch label={tr('Show reduction arrows')} value={arrows} onChange={setArrows} />
                <Switch label={tr('Show descriptions')} value={descriptions} onChange={setDescriptions} />
                <button onClick={reset}>
                  <RotateCcw size={17} />
                  {tr('Reset')}
                </button>
              </div>
            </header>
            <div className="cx-top-grid">
              {map}
              {classifier}
              {details}
            </div>
            <div className="cx-middle-grid">
              {certificatePanel}
              {reductions}
              {comparisonPanel}
            </div>
          </section>
          {footer}
          {review}
        </>
      ) : tab === 'Learn' ? (
        <div className="cx-learning">
          <Panel title={tr('Solving, Verifying and Reducing')} icon={<BookOpen />}>
            <div className="cx-concept-grid">
              {(Object.keys(classDefinitions) as ComplexityClass[]).map((c) => (
                <article key={c}>
                  <Badge value={c} />
                  <p>{tr(classDefinitions[c])}</p>
                </article>
              ))}
            </div>
            <p>
              {tr(
                'Use the classical deterministic model and measure running time in the encoded input length. A tiny solved instance does not establish an efficient algorithm for the entire language.',
              )}
            </p>
            <p>
              {tr(
                'The diagram is a schematic drawn under the unproved assumption P ≠ NP. It does not prove that P and NP-complete are disjoint. Optimization tasks are shown as tasks, not incorrectly assigned membership in an NP decision language.',
              )}
            </p>
          </Panel>
          <Panel title={tr('Read a Reduction in the Correct Direction')} icon={<Network />}>
            <p>
              {tr(
                'A ≤ₚ B means a polynomial-time transformation preserves yes/no answers: x is in A iff f(x) is in B. A solver for B would solve A after this transformation. To prove B hard, reduce a known hard A to B and prove both directions.',
              )}
            </p>
            <button className="cx-primary" onClick={() => setModal('worked')}>
              {tr('Explore the actual 3-SAT → Clique → Cover construction')}
            </button>
          </Panel>
          <Panel title={tr('Authoritative Definitions and Open Status')} icon={<ShieldCheck />}>
            <p>{tr('P versus NP remains listed as unsolved by the Clay Mathematics Institute. A claimed separation in an illustration is not a theorem.')}</p>
            <ul>
              <li>
                <a href="https://www.claymath.org/millennium/p-vs-np/" target="_blank" rel="noreferrer">
                  {tr('Clay Mathematics Institute: P vs NP')}
                </a>
              </li>
              <li>
                <a href="https://www.claymath.org/wp-content/uploads/2022/06/pvsnp.pdf" target="_blank" rel="noreferrer">
                  {tr('Stephen Cook: formal problem statement')}
                </a>
              </li>
              <li>
                <a href="https://courses.cs.cornell.edu/cs4814/2020sp/lectures/goodcharacterization.pdf" target="_blank" rel="noreferrer">
                  {tr('Cornell: certificates, coNP and integer factoring')}
                </a>
              </li>
            </ul>
          </Panel>
          {review}
        </div>
      ) : tab === 'Code' ? (
        <Panel title={tr('Certificate Verification and Proof Contracts')} icon={<Code2 />} className="cx-code">
          <pre>
            <code>{verifierCode}</code>
          </pre>
          <p>
            {tr(
              'The interactive inputs are bounded for learning, but the verification methods scale polynomially with their encoded input and certificate sizes. The SAT search button deliberately enumerates assignments; verification and search are different algorithms.',
            )}
          </p>
          {review}
        </Panel>
      ) : tab === 'Practice' ? (
        <div className="cx-practice">
          <Panel title={tr('Does NP Mean Not Polynomial?')} icon={<Info />}>
            <p>{tr('A problem has a deterministic polynomial-time solver. Can it also belong to NP?')}</p>
            <button onClick={() => setPredictionMessage('Correct. P ⊆ NP: a verifier can ignore a certificate and run the polynomial-time solver.')}>
              {tr('Yes')}
            </button>
            <button onClick={() => setPredictionMessage('Reconsider: NP means nondeterministic polynomial time. Every P decision language is also in NP.')}>
              {tr('No')}
            </button>
            {predictionMessage && <p role="status">{tr(predictionMessage)}</p>}
          </Panel>
          <Panel title={tr('Choose the Reduction Direction')} icon={<Network />}>
            <p>{tr('Known NP-hard language A and a new decision language B: which reduction is needed to prove B NP-hard?')}</p>
            <label>
              {tr('Your reduction')}
              <select aria-label={tr('Predicted hardness reduction')} value={prediction} onChange={(e) => setPrediction(e.target.value)}>
                <option value="">{tr('Choose…')}</option>
                <option value="a-b">{'A ≤ₚ B'}</option>
                <option value="b-a">{'B ≤ₚ A'}</option>
              </select>
            </label>
            <button
              className="cx-primary"
              onClick={() =>
                setHardnessMessage(
                  prediction === 'a-b'
                    ? 'Correct: a fast B solver would solve the known hard A. Also show B is in NP to conclude NP-completeness.'
                    : 'Try again: hardness must flow from the known hard source A to the new target B.',
                )
              }
            >
              {tr('Check reduction')}
            </button>
            {hardnessMessage && <p role="status">{tr(hardnessMessage)}</p>}
          </Panel>
          <Panel title={tr('Rejecting a Certificate Is Not Solving the Problem')} icon={<FileText />}>
            <p>
              {tr(
                'Use the SAT certificate controls to produce a failing assignment, then find a different satisfying assignment. A failed witness does not prove a no instance.',
              )}
            </p>
            <button
              onClick={() => {
                setTab('Visualization')
                setCertificate('sat')
              }}
            >
              {tr('Try the SAT certificate')}
            </button>
          </Panel>
          {review}
        </div>
      ) : tab === 'Experiments' ? (
        <div className="cx-experiments">
          <Panel title={tr('Search vs Verification Laboratory')} icon={<FlaskConical />}>
            <p>
              {tr(
                'Edit a CNF with 1–8 variables and 1–12 clauses. Verifying one assignment examines its literals. Finding one here uses exhaustive enumeration of at most 256 assignments; no polynomial-time SAT solver is claimed.',
              )}
            </p>
            <button
              onClick={() => {
                setCertificate('sat')
                setError('')
                setDraft(clauses.map((row) => row.join(' ')).join('; '))
                setModal('certificate')
              }}
            >
              {tr('Edit SAT formula')}
            </button>
            <button className="cx-primary" onClick={findWitness}>
              {tr('Find SAT witness by enumeration')}
            </button>
            <p>
              {'φ = '}
              {formatCnf(clauses)}
            </p>
            <p>
              {tr(
                `Current assignment: ${assignment.map((v, i) => `x${i + 1}=${v}`).join(', ')}. ${sat.valid ? 'Accepted' : 'Rejected'}; ${sat.literals} literals per verification.`,
              )}
            </p>
            {searchMessage && <p role="status">{tr(searchMessage)}</p>}
            <button onClick={() => setModal('worked')}>{tr('Open concrete reduction')}</button>
          </Panel>
          <Panel title={tr('Classification Is About a Family of Inputs')} icon={<Info />}>
            <p>
              {tr(
                'A single easy SAT instance remains an instance of an NP-complete language. “Hard” does not mean every input is difficult. The table distinguishes known membership, hardness arguments and optimization tasks.',
              )}
            </p>
            {classifier}
          </Panel>
          {review}
        </div>
      ) : (
        <Panel title={tr('Your Complexity Theory Notes')} icon={<BookOpen />} className="cx-notes">
          <label>
            {tr('Explain the difference between verifying a candidate and finding one, then state the correct reduction direction.')}
            <textarea aria-label={tr('Complexity theory notes')} rows={8} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </label>
          <p>{tr('Notes and reviewed sections are saved automatically in this browser.')}</p>
          <LanguageSelector />
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
        className="cx-dialog"
        aria-label={tr(
          modal === 'certificate'
            ? 'Edit certificate example'
            : modal === 'worked'
              ? 'Concrete 3-SAT to Vertex Cover reduction'
              : modal === 'factor'
                ? 'Factor certificate checker'
                : 'Complexity class explanation',
        )}
        onCancel={() => setModal(null)}
        onClose={() => setModal(null)}
      >
        <button className="cx-close" aria-label={tr('Close complexity dialog')} onClick={() => setModal(null)}>
          <X />
        </button>
        {modal === 'class' ? (
          <>
            <h2>{tr(activeClass)}</h2>
            <p>{tr(classDefinitions[activeClass])}</p>
            <p>{tr('P versus NP is open. A schematic separation of regions is an illustration, not evidence of strict containment.')}</p>
          </>
        ) : modal === 'example' ? (
          <>
            <h2>{tr(exampleDetail.name)}</h2>
            <p>{tr(exampleDetail.text)}</p>
          </>
        ) : modal === 'reduction' ? (
          <>
            <h2>{tr('Polynomial-Time Reduction')}</h2>
            <p>{tr(reductionDescriptions[reduction])}</p>
            <p>
              {tr(
                'The arrow direction means a target solver could solve the source after a polynomial-time transformation. Both directions of yes-instance equivalence are required.',
              )}
            </p>
            <button className="cx-primary" onClick={() => setModal('worked')}>
              {tr('See the concrete construction')}
            </button>
          </>
        ) : modal === 'worked' ? (
          <>
            <h2>{tr('3-SAT → Clique → Vertex Cover')}</h2>
            <p>{formatCnf(workedThreeSat)}</p>
            <div className="cx-worked-assignment">
              {workedAssignment.map((v, i) => (
                <span key={i}>
                  {`x${i + 1} = `}
                  <Truth
                    value={v}
                    label={tr(`Toggle worked reduction variable x${i + 1}`)}
                    onChange={() => setWorkedAssignment(workedAssignment.map((old, j) => (j === i ? !old : old)))}
                  />
                </span>
              ))}
            </div>
            <p>
              {tr(
                `Create ${worked.graph.n} literal-occurrence vertices. There are ${worked.cliqueSize} clauses; require a clique of size ${worked.cliqueSize}. In the complement, the cover budget is ${worked.graph.n}−${worked.cliqueSize} = ${worked.coverBudget}.`,
              )}
            </p>
            <div className="cx-worked-graphs">
              <article>
                <h3>{tr('Compatibility graph G')}</h3>
                <SmallGraph graph={worked.graph} chosen={worked.chosen} />
                <p>{tr(`Chosen occurrence IDs: {${worked.chosen.map((v) => v + 1).join(', ')}}.`)}</p>
              </article>
              <article>
                <h3>{tr('Complement graph: Vertex Cover')}</h3>
                <SmallGraph graph={worked.coverGraph} chosen={worked.cover} cover />
                <p>{tr(`Cover occurrence IDs: {${worked.cover.map((v) => v + 1).join(', ')}}.`)}</p>
              </article>
            </div>
            <p className="cx-worked-result" role="status">
              {tr(
                worked.cliqueValid && worked.coverValid
                  ? 'Valid: one mutually compatible true literal per clause forms the clique; all remaining vertices cover every complement edge.'
                  : 'This assignment fails a clause, so this proposed clique/cover witness is rejected. A different assignment may still work.',
              )}
            </p>
            <ol>
              {worked.literals.map((item, i) => (
                <li key={i}>{tr(`Occurrence ${i + 1}: clause ${item.clause + 1}, literal ${item.literal < 0 ? '¬' : ''}x${Math.abs(item.literal)}.`)}</li>
              ))}
            </ol>
          </>
        ) : modal === 'factor' ? (
          <>
            <h2>{tr('Verify a Factor Certificate')}</h2>
            <p>
              {tr(
                'Decision question: does N have a nontrivial factor d ≤ k? Checking a supplied d is different from finding a factor. Inputs are exact decimal integers, up to 256 bits.',
              )}
            </p>
            <label>
              {'N'}
              <input aria-label={tr('Factor number N')} value={factorN} onChange={(e) => setFactorN(e.target.value)} />
            </label>
            <label>
              {'k'}
              <input aria-label={tr('Factor threshold k')} value={factorK} onChange={(e) => setFactorK(e.target.value)} />
            </label>
            <label>
              {'d'}
              <input aria-label={tr('Proposed factor d')} value={factorD} onChange={(e) => setFactorD(e.target.value)} />
            </label>
            <button className="cx-primary" onClick={checkFactor}>
              {tr('Verify factor')}
            </button>
            {factorMessage && <p role="status">{tr(factorMessage)}</p>}
          </>
        ) : (
          <>
            <h2>{tr('Edit Certificate Example')}</h2>
            <p>
              {tr(
                certificate === 'sat'
                  ? 'Write clauses using signed variable IDs 1–8; negative means NOT. Separate clauses with semicolons. Example: 1 -2; -1 3. Each clause has 1–8 literals.'
                  : certificate === 'tour'
                    ? 'Enter a symmetric matrix for 1–6 cities, distances 0–999 and diagonal 0. A certificate lists every city once and repeats its first city at the end.'
                    : 'Use 1–8 graph vertices and edges such as 1-2, 2-3. Candidate certificate IDs may be wrong: verification will reject invalid or repeated vertices.',
              )}
            </p>
            {certificate !== 'sat' && certificate !== 'tour' && (
              <label>
                {tr('Graph vertices')}
                <input aria-label={tr('Certificate graph vertex count')} value={draftN} onChange={(e) => setDraftN(e.target.value)} />
              </label>
            )}
            <label>
              {tr(certificate === 'sat' ? 'CNF clauses' : certificate === 'tour' ? 'Distance matrix' : 'Graph edges')}
              <textarea
                aria-label={tr('Certificate instance input')}
                rows={certificate === 'tour' ? 6 : 3}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
              />
            </label>
            {certificate !== 'sat' && (
              <>
                <label>
                  {tr('Candidate vertex IDs / tour')}
                  <input aria-label={tr('Candidate certificate IDs')} value={draftWitness} onChange={(e) => setDraftWitness(e.target.value)} />
                </label>
                <label>
                  {tr('Threshold k')}
                  <input aria-label={tr('Certificate threshold k')} value={draftK} onChange={(e) => setDraftK(e.target.value)} />
                </label>
              </>
            )}
            {error && <p role="alert">{tr(error)}</p>}
            <button className="cx-primary" onClick={applyCertificate}>
              {tr('Apply certificate example')}
            </button>
          </>
        )}
      </dialog>
    </div>
  )
}
