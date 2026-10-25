// @localized-render
import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  BookOpen,
  Check,
  CheckCircle2,
  Clock3,
  FileText,
  GitFork,
  Lightbulb,
  LineChart,
  Maximize,
  Pencil,
  Scale,
  Settings,
  ShieldCheck,
  Target,
  Trophy,
  X,
} from 'lucide-react'
import { tx, useLocaleRender } from '../i18n/render'
import { usePersistentState, persistentString } from '../hooks/usePersistentState'
import { MockupLessonChrome, type MockupPageProps } from './MockupLessonChrome'
import { classifyMaster, masterGrowthLabel, masterPresets, masterTreeLevels, type MasterParameters } from './masterTheoremModel'
import './master-theorem-mockup.css'

const tr = (s: string) => tx(s, 'studios')
type Tab = 'Learn' | 'Visualize' | 'Practice' | 'Quiz' | 'Notes'
type FunctionChoice = 'one' | 'log' | 'n' | 'nlog' | 'square' | 'custom'
const tabs: Tab[] = ['Learn', 'Visualize', 'Practice', 'Quiz', 'Notes'],
  tabIcons = [BookOpen, LineChart, Pencil, Trophy, FileText]
const choices: { id: FunctionChoice; label: string; d: number; k: number }[] = [
  { id: 'one', label: '1', d: 0, k: 0 },
  { id: 'log', label: 'log n', d: 0, k: 1 },
  { id: 'n', label: 'n', d: 1, k: 0 },
  { id: 'nlog', label: 'n log n', d: 1, k: 1 },
  { id: 'square', label: 'n²', d: 2, k: 0 },
  { id: 'custom', label: 'nᵏ', d: 3, k: 0 },
]
const exceptions = [
  [
    'T(n) = T(n − 1) + n (decreases by 1, not n/b).',
    'The subproblem size drops by a constant, not a fixed factor. Expanding gives a chain with total work n + (n − 1) + ⋯ + 1 = Θ(n²). Use substitution or a recursion-tree sum.',
  ],
  [
    'Unequal splits (e.g., T(n) = T(n/3) + T(2n/3) + f(n)).',
    'The displayed theorem assumes a subproblems of the same size n/b. Unequal splits require a different analysis, such as a direct recursion-tree argument or a more general recurrence theorem.',
  ],
  [
    'Near-boundary functions without a polynomial gap.',
    'For T(n) = 2T(n/2) + n/log n, the polynomial exponent equals p = 1 but the logarithmic exponent is −1. The stated Case 2 requires k ≥ 0, and neither polynomial-gap case applies. A recursion-tree sum gives Θ(n log log n); that is an extension, not one of the three stated cases.',
  ],
  [
    'Case 3 without a verified regularity condition.',
    'A lower bound on f(n) alone is not enough for Case 3. For example f(n) = n²(2 − cos n) has a polynomial gap over n, but 2f(n/2)/f(n) = 3/2 along n = 2π(2m + 1), so the required eventual bound by c < 1 fails. Other methods can still analyze that recurrence.',
  ],
]
const number = (n: number) => (n !== 0 && (Math.abs(n) >= 1e6 || Math.abs(n) < 0.001) ? n.toExponential(3) : Number(n.toFixed(4)).toString())
function Growth({ d, k, variable = 'n' }: { d: number; k: number; variable?: string }) {
  return (
    <>
      {d === 0 && k === 0 ? (
        '1'
      ) : (
        <>
          {d !== 0 && (
            <>
              {variable}
              {d !== 1 && <sup>{d}</sup>}
            </>
          )}
          {d !== 0 && k !== 0 ? ' ' : ''}
          {k !== 0 && (
            <>
              {'log'}
              {k !== 1 && <sup>{k}</sup>} {variable}
            </>
          )}
        </>
      )}
    </>
  )
}
function Critical({ shift }: { shift?: '− ε' | '+ ε' }) {
  return (
    <>
      {'n'}
      <sup>
        {'log'}
        <sub>{'b'}</sub>
        {'a '}
        {shift}
      </sup>
    </>
  )
}
function Recurrence({ p }: { p: MasterParameters }) {
  return (
    <span className="mt-formula">
      {'T(n) = '}
      {p.a !== 1 ? p.a : ''}
      {`T(n/${p.b}) + `}
      <Growth d={p.d} k={p.k} />
    </span>
  )
}
function Panel({
  title,
  description,
  icon,
  children,
  className = '',
}: {
  title: string
  description?: string
  icon: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <section className={`mom-panel mt-panel ${className}`}>
      <header>
        <span className="mt-icon">{icon}</span>
        <div>
          <h2>{tr(title)}</h2>
          {description && <p>{tr(description)}</p>}
        </div>
      </header>
      {children}
    </section>
  )
}
function HeroArt() {
  return (
    <svg className="mt-hero-art" viewBox="0 0 270 137" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id="mt-wave" x2="0" y2="1">
          <stop stopColor="#68baff" stopOpacity=".55" />
          <stop offset="1" stopColor="#b9dfff" stopOpacity=".13" />
        </linearGradient>
      </defs>
      <path d="M0 137C35 116 38 70 53 38S80 116 111 78S155 46 181 77S235 15 270 27V137Z" fill="url(#mt-wave)" />
      <path d="M0 137C32 128 41 71 68 84S101 135 126 108S166 46 184 61S223 124 244 87S261 65 270 63V137Z" fill="url(#mt-wave)" />
      <path d="M0 137C32 128 41 71 68 84S101 135 126 108S166 46 184 61S223 124 244 87S261 65 270 63" fill="none" stroke="#157fff" strokeWidth="1.5" />
      <circle cx="177" cy="61" r="5.5" stroke="white" strokeWidth="2" fill="#007aff" />
      <rect x="172" y="13" width="51" height="34" rx="10" fill="#e4f2ff" />
      <text x="198" y="35" textAnchor="middle" fill="#0074ff" fontSize="16">
        {'T(n)'}
      </text>
    </svg>
  )
}
function HeroBars() {
  return (
    <svg viewBox="0 0 40 40" aria-hidden="true">
      <defs>
        <linearGradient id="mt-hero-bars" x2="0" y2="1">
          <stop stopColor="#2e9fff" />
          <stop offset="1" stopColor="#0067ff" />
        </linearGradient>
      </defs>
      {[13, 22, 30].map((h, i) => (
        <rect key={h} x={5 + i * 11} y={36 - h} width="8" height={h} rx="3" fill="url(#mt-hero-bars)" />
      ))}
    </svg>
  )
}
function Tree({
  parameters,
  depth,
  selectedLevel,
  onInspect,
}: {
  parameters: MasterParameters
  depth: number
  selectedLevel: number | null
  onInspect: (level: number) => void
}) {
  const treeId = useId().replace(/[^a-zA-Z0-9]/g, '')
  const classification = classifyMaster(parameters),
    tree = masterTreeLevels(parameters, depth),
    shown = tree.levels.slice(0, 3),
    positions = (count: number) => (count === 1 ? [180] : count === 2 ? [98, 262] : count === 3 ? [45, 180, 315] : [48, 132, 216, 300])
  const centers = shown.map((l) => positions(Math.min(4, l.nodes)))
  return (
    <svg
      className="mt-tree-svg"
      viewBox="0 0 490 213"
      preserveAspectRatio="none"
      role="group"
      aria-label={tr('Recurrence tree preview, at most four nodes per level')}
    >
      <defs>
        <linearGradient id={`mt-node-blue-${treeId}`} x2="0" y2="1">
          <stop stopColor="#d7edff" />
          <stop offset="1" stopColor="#b5d4ff" />
        </linearGradient>
        <linearGradient id={`mt-node-purple-${treeId}`} x2="0" y2="1">
          <stop stopColor="#f3eaff" />
          <stop offset="1" stopColor="#e1d0ff" />
        </linearGradient>
      </defs>
      {shown.slice(1).flatMap((_, row) =>
        centers[row + 1].map((x, i) => {
          const parent = Math.floor(i / parameters.a),
            parentX = centers[row][parent]
          return parentX === undefined ? null : (
            <path
              key={`${row}-${i}`}
              d={`M${parentX} ${38 + row * 69}L${x} ${79 + row * 69}`}
              stroke={row ? '#aa74ff' : '#1787ff'}
              fill="none"
              strokeWidth="1.2"
            />
          )
        }),
      )}
      {shown.map((level, row) => (
        <g key={level.level}>
          {centers[row].map((x, i) => {
            const width = row === 0 ? 90 : row === 1 ? 82 : 72,
              y = 6 + row * 69
            return (
              <g
                role="button"
                tabIndex={0}
                key={i}
                aria-label={tr(`Inspect recursion level ${level.level}, node ${i + 1}`)}
                onClick={() => onInspect(level.level)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    onInspect(level.level)
                  }
                }}
                className={selectedLevel === level.level ? 'selected' : ''}
              >
                <rect
                  x={x - width / 2}
                  y={y}
                  width={width}
                  height={32}
                  rx="18"
                  fill={`url(#mt-node-${row === 2 ? 'purple' : 'blue'}-${treeId})`}
                  stroke={row === 2 ? '#d5bbff' : '#91baff'}
                />
                <text x={x} y={y + 21} textAnchor="middle" className="mt-node-label">
                  {row === 0 ? 'T(n)' : `T(n/${parameters.b ** row})`}
                </text>
              </g>
            )
          })}
          <path d={`M${Math.max(...centers[row]) + 47} ${22 + row * 69}H367`} stroke="#e0ebfb" strokeDasharray="3 4" />
          <text x="378" y={23 + row * 69} className="mt-level-label">
            {level.leaf ? (
              <>
                <tspan x="378">{tr(`Level ${level.level}: leaves`)}</tspan>
                <tspan x="378" dy="15">
                  {tr('Base work = ')}
                  {number(level.work)}
                </tspan>
              </>
            ) : parameters.k === 0 && parameters.a === parameters.b ** parameters.d ? (
              <>
                {tr(`Level ${level.level}: work = `)}
                {masterGrowthLabel(parameters.d, 0)}
              </>
            ) : (
              <>
                <tspan x="378">{tr(`Level ${level.level}: work =`)}</tspan>
                <tspan x="378" dy="15">
                  {row === 0 ? 'f(n)' : `${parameters.a ** row} f(n/${parameters.b ** row})`}
                </tspan>
              </>
            )}
          </text>
          {level.nodes > 4 && (
            <text x="378" y={53 + row * 69} className="mt-hidden-nodes">
              {tr(`4 of ${level.nodes} nodes shown`)}
            </text>
          )}
        </g>
      ))}
      {depth > 2 &&
        centers.at(-1)!.map((x) => (
          <text key={x} x={x} y="196" textAnchor="middle" fill="#49337f" fontSize="18">
            ⋮
          </text>
        ))}
      <text x="375" y="203" className="mt-tree-total" style={{ fontSize: (classification.result?.length ?? 0) > 14 ? 10 : 12 }}>
        {tr('Total: ')}
        {classification.result ?? tr('not covered')}
      </text>
    </svg>
  )
}

export function MasterTheoremMockupLesson(props: MockupPageProps) {
  useLocaleRender()
  const [tab, setTab] = useState<Tab>('Learn'),
    [parameters, setParameters] = useState<MasterParameters>({ a: 2, b: 2, d: 1, k: 0 }),
    [choice, setChoice] = useState<FunctionChoice>('n'),
    [customD, setCustomD] = useState(3),
    [customK, setCustomK] = useState(0),
    [depth, setDepth] = useState(6),
    [selectedLevel, setSelectedLevel] = useState<number | null>(null),
    [playing, setPlaying] = useState(false),
    [error, setError] = useState(''),
    [modal, setModal] = useState<{ kind: 'tree' | 'case' | 'exception' | 'regularity'; index?: number } | null>(null),
    [prediction, setPrediction] = useState(''),
    [feedback, setFeedback] = useState(''),
    [quiz, setQuiz] = useState(''),
    [quizFeedback, setQuizFeedback] = useState(''),
    [challenge, setChallenge] = useState(-1),
    [done, setDone] = useState<string[]>([]),
    [notes, setNotes] = usePersistentState('master-theorem-notes', '', persistentString)
  const dialogRef = useRef<HTMLDialogElement>(null),
    classification = classifyMaster(parameters),
    tree = masterTreeLevels(parameters, depth),
    level = selectedLevel ?? 0,
    current = tree.levels[level]
  function mark(key: string) {
    setDone((old) => (old.includes(key) ? old : [...old, key]))
  }
  useEffect(() => {
    if (!playing || level >= depth) return
    const timer = window.setTimeout(() => {
      setSelectedLevel(level + 1)
      if (level + 1 === depth) {
        setPlaying(false)
        mark('tree')
      }
    }, 650)
    return () => clearTimeout(timer)
  }, [playing, level, depth])
  useEffect(() => {
    if (modal) {
      if (!dialogRef.current?.open) dialogRef.current?.showModal()
    } else dialogRef.current?.close()
  }, [modal])
  function open(next: Tab) {
    setTab(next)
    setPlaying(false)
    setFeedback('')
  }
  function update(next: MasterParameters) {
    try {
      classifyMaster(next)
      setParameters(next)
      setSelectedLevel(null)
      setPlaying(false)
      setError('')
      setFeedback('')
      mark('explore')
    } catch (e) {
      setError((e as Error).message)
    }
  }
  function changeNumber(key: 'a' | 'b' | 'd' | 'k', raw: string) {
    if (!raw.trim()) {
      setError('Enter an integer in the supported parameter range.')
      return
    }
    const next = { ...parameters, [key]: Number(raw) }
    try {
      classifyMaster(next)
      if (key === 'd') setCustomD(next.d)
      if (key === 'k') setCustomK(next.k)
      update(next)
    } catch (e) {
      setError((e as Error).message)
    }
  }
  function changeFunction(id: FunctionChoice) {
    const option = choices.find((c) => c.id === id)!
    setChoice(id)
    update({ ...parameters, d: id === 'custom' ? customD : option.d, k: id === 'custom' ? customK : option.k })
  }
  function load(p: MasterParameters, markExample = true) {
    setChoice(choices.find((c) => c.id !== 'custom' && c.d === p.d && c.k === p.k)?.id ?? 'custom')
    setCustomD(p.d)
    setCustomK(p.k)
    update({ ...p })
    if (markExample) mark('example')
  }
  function inspectCase(index: number) {
    setModal({ kind: 'case', index })
    mark('cases')
    setPlaying(false)
  }
  function pick(next: number) {
    setSelectedLevel(next)
    setPlaying(false)
    mark('tree')
  }
  function exportTrace() {
    const url = URL.createObjectURL(new Blob([JSON.stringify({ parameters, classification, tree, selectedLevel }, null, 2)], { type: 'application/json' })),
      a = document.createElement('a')
    a.href = url
    a.download = 'master-theorem-trace.json'
    a.click()
    URL.revokeObjectURL(url)
  }
  function predict() {
    const correct = prediction === String(classification.kind)
    setFeedback(
      correct
        ? `Correct. ${classification.kind === 'uncovered' ? 'The polynomial exponents tie, but the stated logarithmic Case 2 requires k ≥ 0.' : `Case ${classification.kind} applies; ${classification.result}.`}`
        : 'Not yet. Compare d with p = log_b(a); at equality, inspect the logarithmic exponent.',
    )
    if (correct) mark('challenge')
  }
  return (
    <div className="mom-page master-page target-visual" data-target="8">
      <MockupLessonChrome
        {...props}
        title={tr('Master Theorem')}
        description={
          'Compare combine work with the recursive leaf exponent. Explore all three cases\nwith interactive visualizations, examples and common pitfalls.'
        }
        heroIcon={<HeroBars />}
        decoration={<HeroArt />}
        progress={{ completed: done.length, total: 5 }}
        startLabel="Continue learning"
        searchPlaceholder="Search topics, examples, or practice problems..."
        onStart={() => open('Visualize')}
        badges={
          <>
            <span>
              <BarChart3 />
              {tr('Analysis & Correctness')}
            </span>
            <span>
              <BookOpen />
              {tr('Divide and Conquer Ideal')}
            </span>
            <span>
              <Clock3 />
              {tr('10–15 min')}
            </span>
            <span>
              <ShieldCheck />
              {tr('Beginner Friendly')}
            </span>
          </>
        }
      />
      <nav className="mom-tabs mt-tabs" aria-label={tr('Algorithm sections')}>
        {tabs.map((name, i) => {
          const Icon = tabIcons[i]
          return (
            <button key={name} aria-pressed={tab === name} onClick={() => open(name)}>
              <Icon size={19} />
              {tr(name)}
            </button>
          )
        })}
      </nav>
      {error && (
        <p className="mt-error" role="alert">
          {tr(error)}
        </p>
      )}
      {(tab === 'Learn' || tab === 'Visualize') && (
        <>
          {tab === 'Visualize' && (
            <Panel
              className="mt-lab"
              title={tr('Explore every recurrence level')}
              description="The numerical model uses n = b^depth, T(1) = 1, and base-2 logarithms. It counts full levels, including leaves."
              icon={<LineChart />}
            >
              <div className="mt-controls">
                <label>
                  {tr('Recursion depth')}
                  <input
                    aria-label={tr('Recursion depth')}
                    type="number"
                    min={0}
                    max={10}
                    value={depth}
                    onChange={(e) => {
                      const n = Number(e.target.value)
                      if (!e.target.value.trim() || !Number.isInteger(n) || n < 0 || n > 10) {
                        setError('Use a recursion depth from 0 to 10.')
                        return
                      }
                      setDepth(n)
                      setSelectedLevel(0)
                      setPlaying(false)
                      setError('')
                    }}
                  />
                </label>
                <button disabled={level === 0} onClick={() => pick(level - 1)}>
                  {tr('Previous level')}
                </button>
                <button disabled={level === depth} onClick={() => pick(level + 1)}>
                  {tr('Next level')}
                </button>
                <button
                  disabled={!depth}
                  onClick={() => {
                    if (level === depth) setSelectedLevel(0)
                    setPlaying(!playing)
                  }}
                >
                  {tr(playing ? 'Pause tree' : 'Play tree')}
                </button>
                <button
                  onClick={() => {
                    setSelectedLevel(0)
                    setPlaying(false)
                  }}
                >
                  {tr('Reset tree')}
                </button>
                <button onClick={exportTrace}>{tr('Export trace JSON')}</button>
              </div>
              <p className="mt-trace-status" role="status">
                {tr('Selected level: ')}
                {level}/{depth} · {tr('input n = ')}
                {number(tree.n)} · {tr('nodes: ')}
                {number(current.nodes)} · {tr('total level work: ')}
                {number(current.work)}
              </p>
              <input
                aria-label={tr('Selected recursion level')}
                type="range"
                min={0}
                max={depth}
                value={level}
                onChange={(e) => pick(Number(e.target.value))}
              />
              <p>
                {tr(
                  'The diagram previews the first three levels with at most four nodes per level. This table includes every node through its multiplicity; selecting a deeper level reveals its exact aggregate. Numerical work illustrates growth and does not prove an asymptotic bound.',
                )}
              </p>
              <LevelTable tree={tree} selected={level} onPick={pick} />
              <div className="mt-cost-totals">
                <span>
                  {tr('Combine work: ')}
                  {number(tree.combineWork)}
                </span>
                <span>
                  {tr('Leaf work: ')}
                  {number(tree.leafWork)}
                </span>
                <b>
                  {tr('Total modeled work: ')}
                  {number(tree.total)}
                </b>
              </div>
            </Panel>
          )}
          <div className="mt-layout">
            <div className="mt-main-column">
              <div className="mt-top-grid">
                <Panel
                  className={`mt-explorer ${choice === 'custom' ? 'custom' : ''}`}
                  title={tr('Interactive Master Theorem Explorer')}
                  description="Adjust parameters and see which case applies, and how the recurrence tree grows."
                  icon={<LineChart />}
                >
                  <div className="mt-input-panel">
                    <div className="mt-input-row">
                      <label>
                        {tr('a (subproblems)')}
                        <input
                          type="number"
                          min={1}
                          max={16}
                          step={1}
                          aria-label={tr('Number of subproblems a')}
                          value={parameters.a}
                          onChange={(e) => changeNumber('a', e.target.value)}
                        />
                      </label>
                      <label>
                        {tr('b (size reduction)')}
                        <input
                          type="number"
                          min={2}
                          max={16}
                          step={1}
                          aria-label={tr('Size reduction factor b')}
                          value={parameters.b}
                          onChange={(e) => changeNumber('b', e.target.value)}
                        />
                      </label>
                      <label>
                        {tr('f(n) (combine work)')}
                        <select aria-label={tr('Combine work function')} value={choice} onChange={(e) => changeFunction(e.target.value as FunctionChoice)}>
                          {choices.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.id === 'custom' ? tr('Custom powers') : c.label}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                    <div className="mt-common-choices">
                      <span>{tr('Common choices:')}</span>
                      {choices.map((c) => (
                        <button key={c.id} aria-label={tr(`Use combine work ${c.label}`)} aria-pressed={choice === c.id} onClick={() => changeFunction(c.id)}>
                          {c.label}
                        </button>
                      ))}
                    </div>
                    {choice === 'custom' && (
                      <div className="mt-custom-inputs">
                        <label>
                          {tr('Polynomial exponent d')}
                          <input
                            aria-label={tr('Polynomial exponent d')}
                            type="number"
                            min={0}
                            max={8}
                            step={1}
                            value={parameters.d}
                            onChange={(e) => changeNumber('d', e.target.value)}
                          />
                        </label>
                        <label>
                          {tr('Logarithmic exponent k')}
                          <input
                            aria-label={tr('Logarithmic exponent k')}
                            type="number"
                            min={-3}
                            max={5}
                            step={1}
                            value={parameters.k}
                            onChange={(e) => changeNumber('k', e.target.value)}
                          />
                        </label>
                      </div>
                    )}
                  </div>
                  <div className={`mt-classification case-${classification.kind}`}>
                    <span className="mt-classification-icon">{classification.kind === 'uncovered' ? <AlertTriangle /> : <CheckCircle2 />}</span>
                    <div>
                      <h3>
                        {tr('Identified case: ')}
                        <b>{classification.kind === 'uncovered' ? tr('Not covered') : tr(`Case ${classification.kind}`)}</b>
                      </h3>
                      <p className="mt-condition">
                        {classification.kind === 1 ? (
                          <>
                            {'f(n) = O('}
                            <Critical shift="− ε" />
                            {') for some ε > 0'}
                          </>
                        ) : classification.kind === 2 ? (
                          <>
                            {'f(n) = Θ('}
                            <Critical />
                            {' log'}
                            <sup>{'k'}</sup>
                            {' n), k ≥ 0'}
                          </>
                        ) : classification.kind === 3 ? (
                          <>
                            {'f(n) = Ω('}
                            <Critical shift="+ ε" />
                            {') and regularity holds'}
                          </>
                        ) : (
                          tr('No positive polynomial gap; the stated Case 2 needs k ≥ 0.')
                        )}
                      </p>
                      <p>
                        {tr('Here ')}
                        {`a = ${parameters.a}, b = ${parameters.b}, `}
                        {tr('so ')}
                        {'p = log'}
                        <sub>{parameters.b}</sub>
                        {parameters.a} = {number(classification.exponent)}.
                      </p>
                      <p>
                        {classification.kind === 'uncovered' ? (
                          tr('Use a recursion-tree sum or a suitable extension; no result is claimed by these three cases.')
                        ) : classification.kind === 2 ? (
                          <>
                            {tr('The polynomial exponents match: ')}
                            <Growth d={parameters.d} k={parameters.k} />
                            {'. '}
                            {tr('Therefore, ')}
                            <strong className="mt-result">
                              {'T(n) = '}
                              {classification.result}.
                            </strong>
                          </>
                        ) : (
                          <>
                            {tr(classification.kind === 1 ? 'Combine work is polynomially smaller. ' : 'Combine work is polynomially larger. ')}
                            {'ε = '}
                            {number(classification.epsilon!)}
                            {'. '}
                            {tr('Therefore, ')}
                            <strong className="mt-result">
                              {'T(n) = '}
                              {classification.result}.
                            </strong>
                          </>
                        )}
                      </p>
                      {classification.kind === 3 && (
                        <button
                          className="mt-regularity-link"
                          onClick={() => {
                            setModal({ kind: 'regularity' })
                            mark('cases')
                          }}
                        >
                          {tr('Inspect the regularity proof')}
                          <ArrowRight size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                </Panel>
                <Panel className="mt-tree" title={tr('Recurrence Tree Visualization')} icon={<GitFork />}>
                  <p className="mt-tree-recurrence">
                    <Recurrence p={parameters} />
                  </p>
                  <button
                    className="mt-fullscreen"
                    onClick={() => {
                      setModal({ kind: 'tree' })
                      setPlaying(false)
                      mark('tree')
                    }}
                  >
                    <Maximize />
                    {tr('Fullscreen')}
                  </button>
                  <Tree parameters={parameters} depth={depth} selectedLevel={selectedLevel} onInspect={pick} />
                  <div className="mt-tree-tip">
                    <Lightbulb />
                    <p>
                      {selectedLevel === null ? (
                        <>
                          {tr('Each level does a total of ')}
                          <i>{'aⁱ f(n/bⁱ)'}</i>
                          {tr(' work.')}
                          <br />
                          {tr('For this example: ')}
                          {`a = ${parameters.a}, b = ${parameters.b}, `}
                          <Growth d={parameters.d} k={parameters.k} />
                          {parameters.k === 0 && parameters.a === parameters.b ** parameters.d ? (
                            <>
                              {tr(' ⇒ each internal level = ')}
                              <Growth d={parameters.d} k={0} />.
                            </>
                          ) : (
                            tr('. Inspect a node to see its numerical level work.')
                          )}
                        </>
                      ) : (
                        <>
                          {tr('Level ')}
                          {level}: {number(current.nodes)} {tr(current.leaf ? 'leaves' : 'nodes')}, {tr('size ')}
                          {number(current.size)}
                          {tr(' each. ')}
                          {tr('Level work = ')}
                          {number(current.work)}
                          {current.leaf ? tr(' (base cost 1 per leaf).') : tr(' (all nodes included).')}
                        </>
                      )}
                    </p>
                  </div>
                </Panel>
              </div>
              <Panel
                className="mt-cases"
                title={tr('The Three Cases of Master Theorem')}
                description="Let T(n) = aT(n/b) + f(n), where a ≥ 1, b > 1 and f(n) is asymptotically positive."
                icon={<Scale />}
              >
                <div className="mt-table-scroll">
                  <table className="mt-case-table">
                    <thead>
                      <tr>
                        {['Case', 'Condition on f(n)', 'Result', 'Intuition'].map((s) => (
                          <th key={s}>{tr(s)}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {[1, 2, 3].map((caseNumber) => (
                        <tr key={caseNumber} className={classification.kind === caseNumber ? 'active' : ''}>
                          <td>
                            <button
                              className={`mt-case-pill case-${caseNumber}`}
                              onClick={() => inspectCase(caseNumber)}
                              aria-label={tr(`Inspect Case ${caseNumber}`)}
                            >
                              {tr(`Case ${caseNumber}`)}
                            </button>
                          </td>
                          <td>
                            {caseNumber === 1 ? (
                              <>
                                {'f(n) = O('}
                                <Critical shift="− ε" />
                                {') for some ε > 0'}
                              </>
                            ) : caseNumber === 2 ? (
                              <>
                                {'f(n) = Θ('}
                                <Critical />
                                {' log'}
                                <sup>{'k'}</sup>
                                {' n) for k ≥ 0'}
                              </>
                            ) : (
                              <>
                                {'f(n) = Ω('}
                                <Critical shift="+ ε" />
                                {') for some ε > 0'}
                                <br />
                                {'and a f(n/b) ≤ c f(n) for some c < 1'}
                              </>
                            )}
                          </td>
                          <td>
                            {caseNumber === 1 ? (
                              <>
                                {'T(n) = Θ('}
                                <Critical />
                                {')'}
                              </>
                            ) : caseNumber === 2 ? (
                              <>
                                {'T(n) = Θ('}
                                <Critical />
                                {' log'}
                                <sup>{'k + 1'}</sup>
                                {' n)'}
                              </>
                            ) : (
                              <>{'T(n) = Θ(f(n))'}</>
                            )}
                          </td>
                          <td>
                            {tr(
                              caseNumber === 1
                                ? 'Combine work is smaller than subproblem work.'
                                : caseNumber === 2
                                  ? 'Combine work matches subproblem work.'
                                  : 'Combine work dominates subproblem work.',
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Panel>
            </div>
            <aside className="mt-takeaways">
              <h2>
                <Lightbulb />
                {tr('Key Takeaways')}
              </h2>
              <ul>
                {[
                  <>
                    {tr('Compare f(n) with ')}
                    {'n'}
                    <sup>{'p'}</sup>
                    {tr(', where p = log_b(a).')}
                  </>,
                  <>
                    {tr('Case 1: lower power ⇒ ')}
                    {'Θ(n'}
                    <sup>{'p'}</sup>
                    {').'}
                  </>,
                  <>
                    {tr('Case 2: ')}
                    {'Θ(n'}
                    <sup>{'p'}</sup>
                    {' log'}
                    <sup>{'k+1'}</sup>
                    {' n), k ≥ 0.'}
                  </>,
                  tr('Case 3: higher power ⇒ Θ(f(n)), with regularity.'),
                  tr('Additive shrinkage, unequal splits and some boundaries need other methods.'),
                ].map((s, i) => (
                  <li key={i}>
                    <span>
                      <Check />
                    </span>
                    <p>{s}</p>
                  </li>
                ))}
              </ul>
              <div className="mt-pro-tip">
                <h3>
                  <button
                    aria-label={tr('Explain regularity condition')}
                    onClick={() => {
                      setModal({ kind: 'regularity' })
                      mark('cases')
                    }}
                  >
                    <Target />
                    {tr('Pro Tip')}
                  </button>
                </h3>
                <p>{tr('Carefully check the regularity condition for Case 3: a f(n/b) ≤ c f(n) for some c < 1.')}</p>
              </div>
            </aside>
          </div>
          <div className="mt-bottom-grid">
            <Panel
              className="mt-worked"
              title={tr('Worked Examples')}
              description="See how the Master Theorem applies to classic algorithms."
              icon={<Settings />}
            >
              <div className="mt-example-grid">
                {masterPresets.slice(0, 2).map((preset, i) => {
                  const result = classifyMaster(preset.parameters)
                  return (
                    <button key={preset.id} className="mt-example" aria-label={tr(`Load ${preset.name} example`)} onClick={() => load(preset.parameters)}>
                      <div className="mt-example-heading">
                        <b>{i + 1}</b>
                        <div>
                          <h3>{tr(preset.name)}</h3>
                          <Recurrence p={preset.parameters} />
                        </div>
                      </div>
                      <ul>
                        <li>
                          {'a = '}
                          {preset.parameters.a}
                          {', b = '}
                          {preset.parameters.b}
                          {', f(n) = '}
                          <Growth d={preset.parameters.d} k={preset.parameters.k} />
                        </li>
                        <li>
                          {'p = log'}
                          <sub>{preset.parameters.b}</sub>
                          {preset.parameters.a}
                          {' ≈ '}
                          {number(result.exponent)}
                        </li>
                        <li>
                          {tr(`Case ${result.kind}: `)}
                          {result.result}
                        </li>
                      </ul>
                      <span className="mt-load-caption">
                        {tr('Explore this recurrence')}
                        <ArrowRight size={13} />
                      </span>
                    </button>
                  )
                })}
              </div>
            </Panel>
            <Panel
              className="mt-exceptions"
              title={tr('Common Exceptions / Non-applicable Cases')}
              description="Situations where the Master Theorem does not directly apply."
              icon={<AlertTriangle />}
            >
              <ul>
                {exceptions.map(([text], i) => (
                  <li key={text}>
                    <X />
                    <button onClick={() => setModal({ kind: 'exception', index: i })}>{tr(text)}</button>
                  </li>
                ))}
              </ul>
            </Panel>
          </div>
          <details className="mt-theory">
            <summary>{tr('Theory, assumptions and the regularity proof')}</summary>
            <div className="mt-theory-grid">
              <article>
                <h2>{tr('Where the critical exponent comes from')}</h2>
                <p>
                  {tr(
                    'For T(n) = aT(n/b) + f(n), level i has a^i subproblems of size n/b^i. A balanced tree reaches constant-size leaves at height log_b n, with a^(log_b n) = n^(log_b a) leaves. This gives the critical exponent p = log_b a. Compare f(n) against n^p, using a polynomial gap for Cases 1 and 3. Merely being smaller or larger by a logarithm does not provide that gap.',
                  )}
                </p>
                <p>
                  {tr(
                    'Assume a ≥ 1 and b > 1 are fixed constants, f(n) is eventually positive, and the base cost is Θ(1). Floors and ceilings require the standard regularity assumptions for extending the asymptotic recurrence to integer inputs. The lab uses integer a from 1 to 16, b from 2 to 16, and f(n) = n^d log^k n with integer d from 0 to 8 and k from −3 to 5. These are bounded examples of the more general theorem; no arbitrary text is executed.',
                  )}
                </p>
              </article>
              <article>
                <h2>{tr('Why the three answers differ')}</h2>
                <p>
                  {tr(
                    'Case 1 has f(n) = O(n^(p − ε)) for some fixed ε > 0; leaf-scale work dominates and T(n) = Θ(n^p). In Case 2, f(n) = Θ(n^p log^k n) with k ≥ 0; summing logarithmic level costs gives Θ(n^p log^(k+1) n). Case 3 needs f(n) = Ω(n^(p + ε)) and an eventual geometric decrease a f(n/b) ≤ c f(n), c < 1; then the root-scale work dominates, giving Θ(f(n)).',
                  )}
                </p>
                <p>
                  {tr(
                    'For this lab’s family, a f(n/b)/f(n) = (a/b^d)(1 − log b / log n)^k. When d > p, its limit r = a/b^d is below 1. Choose c = (1 + r)/2. For nonnegative k the ratio is at most r once n > b; for negative k it approaches r from above and is at most c beyond a computed threshold. Thus the regularity assertion is an eventual argument, not a single numerical check.',
                  )}
                </p>
                <p>
                  {tr(
                    'The default a = b = 2 and f(n) = n is Case 2: its regularity ratio is exactly 1, so Case 3 does not apply. At n = 64 with T(1) = 1, six internal levels cost 64 each and 64 leaves cost 64 more, totaling 448. This numerical total is distinct from the asymptotic class Θ(n log n). Non-polynomial combine functions are not automatically excluded; they must be checked against the theorem’s actual conditions.',
                  )}
                </p>
              </article>
            </div>
          </details>
        </>
      )}
      {(tab === 'Practice' || tab === 'Quiz') && (
        <Panel
          className="mt-lab"
          title={tr('Predict the applicable Master Theorem case')}
          description="Identify p, compare polynomial exponents, and then check the logarithmic factor and regularity."
          icon={<Trophy />}
        >
          <p className="mt-practice-recurrence">
            <Recurrence p={parameters} />
          </p>
          <div className="mt-controls">
            <select
              aria-label={tr('Predicted Master Theorem case')}
              value={prediction}
              onChange={(e) => {
                setPrediction(e.target.value)
                setFeedback('')
              }}
            >
              <option value="">{tr('Choose a case')}</option>
              {[1, 2, 3].map((n) => (
                <option key={n} value={n}>
                  {tr(`Case ${n}`)}
                </option>
              ))}
              <option value="uncovered">{tr('Not covered by the stated cases')}</option>
            </select>
            <button disabled={!prediction} onClick={predict}>
              {tr('Check prediction')}
            </button>
            <button
              onClick={() => {
                const next = (challenge + 1) % masterPresets.length
                setChallenge(next)
                load(masterPresets[next].parameters, false)
                setPrediction('')
              }}
            >
              {tr('Next challenge')}
            </button>
          </div>
          {feedback && (
            <p className="mt-prediction-feedback" role="status">
              {tr(feedback)}
            </p>
          )}
          {tab === 'Quiz' && (
            <div className="mt-quiz">
              <h3>{tr('Why does n/log n not fit the stated Case 1 when p = 1?')}</h3>
              {[
                ['gap', 'It is smaller than n, but not by a fixed positive polynomial exponent.'],
                ['small', 'It always fits Case 1 because it is smaller than n.'],
                ['regularity', 'Regularity is the only condition in Case 1.'],
              ].map(([value, label]) => (
                <label key={value}>
                  <input type="radio" name="master-theorem-quiz" value={value} checked={quiz === value} onChange={(e) => setQuiz(e.target.value)} />
                  {tr(label)}
                </label>
              ))}
              <button
                onClick={() => {
                  setQuizFeedback(
                    quiz === 'gap'
                      ? 'Correct. A logarithmic separation is not the polynomial gap n^ε required by Case 1.'
                      : 'Not yet. Case 1 needs a fixed ε > 0, not merely a smaller function.',
                  )
                  if (quiz === 'gap') mark('challenge')
                }}
              >
                {tr('Check answer')}
              </button>
              {quizFeedback && (
                <p className="mt-quiz-feedback" role="status">
                  {tr(quizFeedback)}
                </p>
              )}
            </div>
          )}
        </Panel>
      )}
      {tab === 'Notes' && (
        <Panel className="mt-lab" title={tr('Your Master Theorem notes')} description="Saved automatically in this browser." icon={<FileText />}>
          <label>
            {tr('Record a, b, f(n), p, the case and all required conditions.')}
            <textarea rows={12} aria-label={tr('Master Theorem notes')} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </label>
        </Panel>
      )}
      <dialog
        className={`mt-dialog ${modal?.kind === 'tree' ? 'mt-expanded-tree' : ''}`}
        ref={dialogRef}
        aria-label={tr('Master Theorem detail')}
        onClose={() => setModal(null)}
      >
        <button className="mt-dialog-close" aria-label={tr('Close theorem detail')} onClick={() => setModal(null)}>
          <X />
        </button>
        {modal?.kind === 'tree' && (
          <>
            <h2>{tr('Recurrence tree: complete level accounting')}</h2>
            <p>
              <Recurrence p={parameters} />
              {' · n = '}
              {number(tree.n)}
              {', T(1) = 1'}
            </p>
            <Tree parameters={parameters} depth={depth} selectedLevel={selectedLevel} onInspect={pick} />
            <p>{tr('The drawing shows a bounded preview. The table accounts for every node, including all leaf costs.')}</p>
            <LevelTable tree={tree} selected={level} onPick={pick} />
            <p className="mt-expanded-total">
              {tr('Total modeled work = ')}
              {number(tree.total)}
            </p>
          </>
        )}
        {modal?.kind === 'case' && (
          <>
            <h2>
              {tr(`Case ${modal.index}`)}:{' '}
              {tr(modal.index === 1 ? 'leaf work dominates' : modal.index === 2 ? 'balanced polynomial exponents' : 'combine work dominates')}
            </h2>
            <p>
              {tr(
                modal.index === 1
                  ? 'Require a fixed ε > 0 with f(n) = O(n^(p − ε)). Summing costs toward the leaves gives Θ(n^p). Any fixed logarithmic power is absorbed by an appropriately chosen polynomial gap.'
                  : modal.index === 2
                    ? 'When f(n) = Θ(n^p log^k n), k ≥ 0, the level-cost sum adds one logarithmic power: Θ(n^p log^(k+1) n). For k = 0 this is Θ(n^p log n). This case is not a claim that the regularity ratio is below 1.'
                    : 'Require both f(n) = Ω(n^(p + ε)) for fixed ε > 0 and a f(n/b) ≤ c f(n) eventually, with c < 1. Geometric decrease across levels makes the total Θ(f(n)). A polynomial gap without regularity is insufficient.',
              )}
            </p>
            <button
              className="mt-primary"
              onClick={() => {
                load(modal.index === 1 ? { a: 2, b: 2, d: 0, k: 0 } : modal.index === 2 ? { a: 2, b: 2, d: 1, k: 0 } : { a: 2, b: 2, d: 2, k: 0 }, false)
                setModal(null)
              }}
            >
              {tr(`Load Case ${modal.index} example`)}
            </button>
          </>
        )}
        {modal?.kind === 'exception' && (
          <>
            <h2>{tr('Check applicability before choosing a case')}</h2>
            <h3>{tr(exceptions[modal.index!][0])}</h3>
            <p>{tr(exceptions[modal.index!][1])}</p>
            {modal.index === 2 && (
              <button
                onClick={() => {
                  load(masterPresets.find((p) => p.id === 'boundary')!.parameters, false)
                  setModal(null)
                }}
              >
                {tr('Explore n/log n boundary')}
              </button>
            )}
          </>
        )}
        {modal?.kind === 'regularity' && (
          <>
            <h2>{tr('The regularity condition is eventual')}</h2>
            <p className="mt-regularity-equation">{'a f(n/b) / f(n) = (a/b^d)(1 − log b / log n)^k'}</p>
            {classification.regularity ? (
              <>
                <p>
                  {tr('For the current function, ')}
                  {'r = a/b^d = '}
                  {number(classification.regularity.ratioLimit)}
                  {' < c = '}
                  {number(classification.regularity.c)}
                  {' < 1.'}
                </p>
                <p>
                  {tr(
                    parameters.k >= 0
                      ? 'With k ≥ 0 and n > b, the logarithmic factor in this ratio is at most 1, so the ratio is at most r < c.'
                      : 'With k < 0, the ratio approaches r from above. Solving the inequality gives the sufficient threshold below; it is not necessary to assert the inequality for small n.',
                  )}
                </p>
                <p className="mt-regularity-threshold">
                  {'log n ≥ '}
                  {number(classification.regularity.logThreshold)}
                  {tr(' is a sufficient eventual threshold (natural logarithm).')}
                </p>
              </>
            ) : (
              <p>
                {tr(
                  'Case 3 is not the applicable case for these parameters. In the balanced default a = b = 2, d = 1, k = 0, the ratio is exactly 1; no c < 1 satisfies the condition. Use Case 2 instead.',
                )}
              </p>
            )}
            <p>
              {tr(
                'The regularity condition prevents lower levels from repeatedly costing more than a fixed fraction of the parent-level combine work. It must hold for all sufficiently large n, not just for the sampled input.',
              )}
            </p>
          </>
        )}
      </dialog>
    </div>
  )
}
function LevelTable({ tree, selected, onPick }: { tree: ReturnType<typeof masterTreeLevels>; selected: number; onPick: (level: number) => void }) {
  return (
    <div className="mt-level-table-scroll">
      <table className="mt-level-table">
        <thead>
          <tr>
            {['Level', 'Nodes', 'Size per node', 'Cost per node', 'Level work'].map((s) => (
              <th key={s}>{tr(s)}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {tree.levels.map((row) => (
            <tr key={row.level} className={selected === row.level ? 'selected' : ''}>
              <td>
                <button aria-label={tr(`Inspect level ${row.level} accounting`)} onClick={() => onPick(row.level)}>
                  {row.level}
                  {row.leaf ? tr(' (leaf)') : ''}
                </button>
              </td>
              <td>{number(row.nodes)}</td>
              <td>{number(row.size)}</td>
              <td>{number(row.perNode)}</td>
              <td>{number(row.work)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
