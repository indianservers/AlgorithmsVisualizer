// @localized-render
import { useEffect, useRef, useState, type ReactNode } from 'react'
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  BookOpen,
  Calculator,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
  FileText,
  FlaskConical,
  Lightbulb,
  LineChart,
  Pause,
  Pencil,
  Play,
  Settings,
  Trophy,
} from 'lucide-react'
import { tx, useLocaleRender } from '../i18n/render'
import { usePersistentState, persistentString } from '../hooks/usePersistentState'
import { MockupLessonChrome, type MockupPageProps } from './MockupLessonChrome'
import {
  boundLabels,
  exactSubstitutionCost,
  parseSubstitution,
  recommendedGuess,
  substitutionPresets,
  substitutionProof,
  substitutionSamples,
  type BoundGuess,
  type SubstitutionId,
} from './substitutionModel'
import './substitution-mockup.css'

const tr = (s: string) => tx(s, 'studios')
const tabs = ['Learn', 'Visualize', 'Practice', 'Quiz', 'Notes'] as const
const icons = [BookOpen, LineChart, Pencil, Trophy, FileText]
const stepTitles = ['Guess a bound', 'Inductive hypothesis', 'Substitution', 'Simplification', 'Base case']
const stepDescriptions = [
  'Propose a form for the solution, e.g., T(n) ≤ cn log n.',
  'Assume the bound for all smaller allowed inputs.',
  'Substitute the hypothesis into the recurrence.',
  'Algebraically simplify to get a bound in terms of n.',
  'Verify the initial cases and choose one constant.',
]
const fmt = (n: number) => Number(n.toFixed(4)).toString()
function MathText({ children }: { children: ReactNode }) {
  return <span className="sb-math">{children}</span>
}
function Bars() {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true">
      <rect x="2" y="20" width="8" height="12" rx="3" />
      <rect x="12" y="11" width="8" height="21" rx="3" />
      <rect x="22" y="3" width="8" height="29" rx="3" />
    </svg>
  )
}
function Panel({
  title,
  icon,
  children,
  className = '',
  description,
}: {
  title: string
  icon: ReactNode
  children: ReactNode
  className?: string
  description?: string
}) {
  return (
    <section className={`mom-panel sb-panel ${className}`}>
      <header>
        <span className="sb-icon">{icon}</span>
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
    <svg className="sb-hero-art" viewBox="0 0 260 130" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id="sb-wave" x2="0" y2="1">
          <stop stopColor="#87bdff" />
          <stop offset="1" stopColor="#d7edff" stopOpacity=".3" />
        </linearGradient>
      </defs>
      <path d="M0 130C27 99 30-12 62 52S110 9 145 55 196 0 222 37 250 25 260 30V130Z" fill="url(#sb-wave)" />
      <path d="M0 130C40 70 42 72 65 102S127 55 165 66 216 135 260 70" fill="none" stroke="#087aff" strokeWidth="1.6" />
      <circle cx="165" cy="66" r="6.5" fill="#087aff" stroke="white" strokeWidth="2" />
    </svg>
  )
}
function Tree({ id, selected, onSelect }: { id: SubstitutionId; selected: number; onSelect: (n: number) => void }) {
  const a = id === 'ternary' ? 3 : id === 'chain' ? 1 : 2
  const count = (level: number) => a ** level
  const visible = (level: number) => Math.min(4, count(level))
  const x = (level: number, index: number) => -5 + ((index + 0.5) * 266) / visible(level)
  const label = (l: number) => (l === 0 ? 'n' : id === 'chain' ? `n − ${l}` : `n/${2 ** l}`)
  return (
    <div className="sb-tree-scroll">
      <svg className="sb-tree-svg" viewBox="0 0 400 175" aria-label={tr('Recurrence tree preview; select a level')}>
        {[1, 2].flatMap((l) =>
          Array.from({ length: visible(l) }, (_, j) => (
            <path
              key={`${l}-${j}`}
              d={`M${x(l - 1, Math.min(visible(l - 1) - 1, Math.floor(j / a)))} ${28 + (l - 1) * 57}L${x(l, j)} ${54 + (l - 1) * 57}`}
              stroke="#91a7cc"
              strokeWidth="1.4"
              fill="none"
            />
          )),
        )}
        {[0, 1, 2].flatMap((l) =>
          Array.from({ length: visible(l) }, (_, j) => (
            <g
              key={`${l}-${j}`}
              role="button"
              tabIndex={0}
              aria-label={tr(`Inspect tree level ${l}, node ${j + 1}`)}
              aria-pressed={selected === l}
              onClick={() => onSelect(l)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  onSelect(l)
                }
              }}
            >
              <rect
                x={x(l, j) - 28}
                y={l * 57}
                width="56"
                height="32"
                rx="6"
                fill={l === selected ? '#c8e7ff' : '#e1efff'}
                stroke={l === selected ? '#69b5ff' : 'none'}
              />
              <text x={x(l, j)} y={21 + l * 57} textAnchor="middle" fill="#06215b" fontSize="16">
                {label(l)}
              </text>
              {l === 2 && (
                <text x={x(l, j)} y="165" textAnchor="middle" fill="#234476">
                  ⋮
                </text>
              )}
            </g>
          )),
        )}
        <path d="M290 0q6 0 6 8v60q0 7 5 8-5 1-5 8v57q0 8-6 8" fill="none" stroke="#12357d" />
        {[0, 1, 2].map((l) => (
          <text x="315" y={13 + l * 49} key={l} fontSize="12" fill="var(--mom-muted)">
            {`Level ${l}:  `}
            <tspan fontFamily="Georgia" fontStyle="italic">
              {id === 'merge'
                ? 'n'
                : id === 'ternary'
                  ? `${l === 0 ? '' : `${fmt((3 / 2) ** l)} × `}n`
                  : id === 'chain'
                    ? label(l)
                    : l === 0
                      ? 'n log₂ n'
                      : `n(log₂ n − ${l})`}
            </tspan>
          </text>
        ))}
        <text x="315" y="145" fontSize="12" fill="var(--mom-muted)">
          {tr('Total: ')}
          <tspan fontFamily="Georgia">{substitutionPresets.find((p) => p.id === id)!.bound}</tspan>
        </text>
      </svg>
      {id === 'ternary' && <small>{tr('Preview shows 4 of 9 nodes at level 2. Level costs include every node.')}</small>}
    </div>
  )
}
export function SubstitutionMockupLesson(props: MockupPageProps) {
  useLocaleRender()
  const [tab, setTab] = useState<(typeof tabs)[number]>('Learn'),
    [id, setId] = useState<SubstitutionId>('merge'),
    [draft, setDraft] = useState(substitutionPresets[0].recurrence),
    [guess, setGuess] = useState<BoundGuess>('nlog'),
    [c, setC] = useState(2),
    [step, setStep] = useState(0),
    [error, setError] = useState(''),
    [activities, setActivities] = useState<string[]>([]),
    [selectedLevel, setSelectedLevel] = useState(-1),
    [showDetails, setShowDetails] = useState(false),
    [playing, setPlaying] = useState(false),
    [prediction, setPrediction] = useState(''),
    [feedback, setFeedback] = useState(''),
    [quiz, setQuiz] = useState('')
  const [notes, setNotes] = usePersistentState('recurrence-substitution-notes', '', persistentString)
  const root = useRef<HTMLDivElement>(null),
    proof = substitutionProof(id, guess, c),
    samples = substitutionSamples(id, guess, c),
    preset = substitutionPresets.find((p) => p.id === id)!
  const mark = (key: string) => setActivities((previous) => (previous.includes(key) ? previous : [...previous, key]))
  useEffect(() => {
    if (!playing) return
    const timer = window.setInterval(
      () =>
        setStep((previous) => {
          if (previous >= 4) return previous
          return previous + 1
        }),
      900,
    )
    return () => window.clearInterval(timer)
  }, [playing])
  useEffect(() => {
    if (playing && step === 4) {
      const timer = window.setTimeout(() => setPlaying(false), 0)
      return () => window.clearTimeout(timer)
    }
  }, [step, playing])
  function load(next: SubstitutionId) {
    setId(next)
    setDraft(substitutionPresets.find((p) => p.id === next)!.recurrence)
    setGuess(recommendedGuess(next))
    setC(next === 'ternary' ? 3 : next === 'chain' ? 1 : 2)
    setStep(0)
    setSelectedLevel(-1)
    setError('')
    setFeedback('')
    setPrediction('')
    setPlaying(false)
    mark('recurrence')
  }
  function analyze() {
    try {
      load(parseSubstitution(draft))
    } catch (e) {
      setError((e as Error).message)
    }
  }
  const pickStep = (n: number) => {
    setStep(n)
    mark('proof')
  }
  function pickLevel(n: number) {
    setSelectedLevel(n)
    mark('tree')
  }
  const stageContent = [
    <>
      <label htmlFor="sb-bound">{tr('Your guess for T(n):')}</label>
      <select
        id="sb-bound"
        value={guess}
        onChange={(e) => {
          setGuess(e.target.value as BoundGuess)
          mark('guess')
        }}
      >
        {Object.entries(boundLabels).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
      <p>
        <Lightbulb size={22} />
        <span>{tr('Choose constants c > 0, and prove the inequality for all n ≥ n₀ using induction.')}</span>
      </p>
    </>,
    <>
      <MathText>
        {guess === 'strengthened' ? 'Assume T(k) ≤ ckᵖ − 2k, p = log₂ 3.' : boundLabels[guess].replaceAll('T(n)', 'T(k)').replaceAll('n', 'k')}
      </MathText>
      <p>
        {tr(
          id === 'chain'
            ? 'Assume this for every integer 1 ≤ k < n. In particular use k = n − 1.'
            : `Assume this for every power of 2 with ${proof.threshold} ≤ k < n. Check smaller base values separately.`,
        )}
      </p>
    </>,
    <>
      {proof.equations.slice(0, 2).map((eq, i) => (
        <div className="sb-equation" key={i}>
          <MathText>{eq}</MathText>
        </div>
      ))}
      {!proof.equations.length && <p>{tr('Choose the recommended bound to display a symbolic substitution certificate.')}</p>}
    </>,
    <>
      {proof.equations.slice(2).map((eq, i) => (
        <div className="sb-equation" key={i}>
          <MathText>{eq}</MathText>
        </div>
      ))}
      <p>{tr(proof.explanation)}</p>
    </>,
    <>
      <label htmlFor="sb-constant">{tr('Proof constant c')}</label>
      <input
        id="sb-constant"
        type="number"
        min="0.01"
        max="100"
        step="0.5"
        value={c}
        onChange={(e) => {
          const next = Number(e.target.value)
          if (Number.isFinite(next) && next > 0 && next <= 100) {
            setC(next)
            mark('proof')
          }
        }}
      />
      <p>{tr(proof.base)}</p>
      <strong className={proof.valid ? 'sb-ok' : 'sb-warn'}>{tr(proof.title)}</strong>
    </>,
  ]
  const proofBuilder = (
    <Panel title={tr('Proof Builder')} description="Follow the substitution method step by step." icon={<Settings />} className="sb-builder">
      <button className="sb-builder-back" aria-label={tr('Previous proof step')} disabled={step === 0} onClick={() => pickStep(step - 1)}>
        <ChevronLeft size={18} />
      </button>
      <ol className="sb-proof-steps">
        {stepTitles.map((title, i) => (
          <li key={title} className={step === i ? 'active' : ''}>
            <button className="sb-step-button" aria-expanded={step === i} onClick={() => pickStep(i)}>
              <b>{i + 1}</b>
              <span>
                <strong>{tr(title)}</strong>
                <small>{tr(i === 1 ? `Assume ${boundLabels[guess].replaceAll('n', 'k')} for smaller k.` : stepDescriptions[i])}</small>
              </span>
              <ChevronDown size={17} />
            </button>
            {step === i && <div className="sb-stage">{stageContent[i]}</div>}
          </li>
        ))}
      </ol>
    </Panel>
  )
  const worked = (
    <section className="sb-panel sb-worked" aria-label={tr('Worked substitution proof')}>
      <ol>
        {['Guess', 'Inductive hypothesis', 'Substitute', 'Simplify', 'Base case'].map((label, i) => (
          <li key={label} className={step === i ? 'active' : ''}>
            <button aria-label={tr(`Inspect worked step ${i + 1}: ${label}`)} onClick={() => pickStep(i)}>
              <b>{i + 1}</b>
              <strong>{tr(label)}</strong>
              <ChevronRight size={16} />
            </button>
            <div>
              {i === 0 ? (
                <p>
                  {tr('Guess ')}
                  <MathText>{boundLabels[guess]}</MathText>
                  {tr(' for some constant c > 0.')}
                </p>
              ) : i === 1 ? (
                <p>{tr(`Assume ${boundLabels[guess].replaceAll('n', 'k')} for all smaller allowed k.`)}</p>
              ) : i === 2 ? (
                <div className="sb-equations">
                  {proof.equations.slice(0, 2).map((eq, j) => (
                    <MathText key={j}>{eq}</MathText>
                  ))}
                </div>
              ) : i === 3 ? (
                <div className="sb-equations">
                  {proof.equations.slice(2).map((eq, j) => (
                    <MathText key={j}>{eq}</MathText>
                  ))}
                </div>
              ) : (
                <p>{tr(proof.base)}</p>
              )}
            </div>
          </li>
        ))}
      </ol>
      <div className={`sb-conclusion ${proof.valid ? '' : 'sb-failed'}`} role="status">
        <CheckCircle2 size={23} />
        <span>
          {proof.valid ? (
            <>
              {tr('Therefore, ')}
              <MathText>
                {guess === 'square' ? 'T(n) = O(n²).' : guess === 'nlog' ? 'T(n) = O(n log n).' : guess === 'nlog2' ? 'T(n) = O(n log² n).' : 'T(n) = O(nᵖ).'}
              </MathText>
            </>
          ) : (
            tr(proof.title)
          )}
        </span>
      </div>
    </section>
  )
  const takeaways = (
    <Panel title={tr('Key Takeaways')} icon={<Lightbulb />} className="sb-takeaways">
      <ul>
        {[
          'State a recurrence and a base threshold.',
          'Guess a bound and substitute the inductive hypothesis.',
          'Choose constants to make the inequality hold.',
          'Verify base cases separately.',
          'The method proves an upper bound; a matching lower bound requires a separate argument.',
        ].map((s) => (
          <li key={s}>
            <Check size={17} />
            <span>{tr(s)}</span>
          </li>
        ))}
      </ul>
    </Panel>
  )
  const tree = (
    <Panel
      title={tr('Recurrence Tree (Visualization)')}
      icon={<Bars />}
      className="sb-tree"
      description={
        id === 'merge'
          ? 'The same recurrence grows as Θ(n log n): each level of recursion does Θ(n) total work and there are log₂ n levels.'
          : `The active recurrence has total order ${preset.bound}. Inspect its first three levels.`
      }
    >
      <Tree id={id} selected={selectedLevel} onSelect={pickLevel} />
      {selectedLevel >= 0 && (
        <p className="sb-tree-selection" role="status">
          {tr(
            `Selected level ${selectedLevel}. ${id === 'chain' ? 'One recursive call per level.' : `${(id === 'ternary' ? 3 : 2) ** selectedLevel} recursive calls; size n/${2 ** selectedLevel} each.`}`,
          )}
        </p>
      )}
    </Panel>
  )
  const lab = (
    <Panel
      title={tr('Step-by-step substitution')}
      description="Inspect the algebra, then compare the candidate bound with exact recurrence values."
      icon={<LineChart />}
      className="sb-lab"
    >
      <div className="sb-controls">
        <button
          onClick={() => {
            setPlaying((v) => !v)
            if (step === 4) setStep(0)
          }}
        >
          {playing ? <Pause size={16} /> : <Play size={16} />} {tr(playing ? 'Pause' : 'Play proof')}
        </button>
        <button disabled={step === 0} onClick={() => pickStep(step - 1)}>
          {tr('Previous')}
        </button>
        <output>{tr(`Step ${step + 1} of 5: ${stepTitles[step]}`)}</output>
        <button disabled={step === 4} onClick={() => pickStep(step + 1)}>
          {tr('Next step')}
          <ArrowRight size={16} />
        </button>
        <button
          onClick={() => {
            setStep(0)
            setPlaying(false)
          }}
        >
          {tr('Reset')}
        </button>
      </div>
      <div className="sb-lab-grid">
        {proofBuilder}
        {tree}
      </div>
      <div className="sb-proof-detail">
        <h3>{tr(proof.title)}</h3>
        <p>{tr(proof.explanation)}</p>
        <p>{tr(proof.base)}</p>
      </div>
      <h3>{tr('Exact costs and your candidate bound')}</h3>
      <p>
        {tr(
          'These finite checks can refute a candidate at an input, but do not replace a general induction proof. Red rows below the proof threshold are outside the claim and must be recorded as separate base values.',
        )}
      </p>
      <div className="sb-table-scroll">
        <table>
          <thead>
            <tr>
              {['n', 'Exact T(n)', boundLabels[guess], 'Candidate holds?'].map((t) => (
                <th key={t}>{tr(t)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {samples.map((row) => (
              <tr key={row.n} className={row.holds ? '' : 'fails'}>
                <td>{row.n}</td>
                <td>{fmt(row.actual)}</td>
                <td>{fmt(row.bound)}</td>
                <td>{tr(row.holds ? 'Yes' : row.n < proof.threshold ? 'Outside bound domain' : 'No')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  )
  return (
    <div ref={root} className="mom-page substitution-page target-visual" data-target="6">
      <MockupLessonChrome
        {...props}
        title={tr('Recurrences: Substitution Method')}
        description="Guess a bound and prove it inductively, including base cases."
        heroIcon={<Bars />}
        progress={{ completed: activities.length, total: 5 }}
        startLabel="Continue Learning"
        searchPlaceholder="Search topics, examples, or practice problems..."
        onStart={() => {
          setTab('Visualize')
          setTimeout(() => root.current?.querySelector('.sb-lab')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0)
        }}
        decoration={<HeroArt />}
        badges={
          <>
            <span>
              <BarChart3 />
              {tr('Analysis & Correctness')}
            </span>
            <span>
              <BookOpen />
              {tr('Intermediate')}
            </span>
            <span>
              <Clock3 />
              {tr('10–15 min')}
            </span>
            <span className="sb-dots">●●○○○○</span>
          </>
        }
      />
      <nav className="mom-tabs sb-tabs" aria-label={tr('Algorithm sections')}>
        {tabs.map((name, i) => {
          const Icon = icons[i]
          return (
            <button
              key={name}
              aria-pressed={tab === name}
              onClick={() => {
                setTab(name)
                setPlaying(false)
              }}
            >
              <Icon size={20} />
              {tr(name)}
            </button>
          )
        })}
      </nav>
      {(tab === 'Learn' || tab === 'Visualize') && (
        <div className="sb-explorer sb-panel">
          <div className="sb-explorer-title">
            <span className="sb-icon">
              <Calculator />
            </span>
            <div>
              <h2>{tr('Recurrence Explorer')}</h2>
              <p>{tr('Enter a recurrence relation to explore the substitution method.')}</p>
            </div>
          </div>
          <button
            className="sb-worked-heading"
            onClick={() => {
              setShowDetails((v) => !v)
              mark('proof')
            }}
            aria-expanded={showDetails}
          >
            <span className="sb-icon">
              <FlaskConical />
            </span>
            <span>
              <strong>{tr('Worked Example')}</strong>
              <small>
                {tr('Show that T(n) has an upper bound using ')}
                <b>{tr('substitution.')}</b>
              </small>
            </span>
            <span className="sb-recurrence-chip">{preset.recurrence}</span>
            <ChevronRight size={19} />
          </button>
          <form
            className="sb-input-row"
            onSubmit={(e) => {
              e.preventDefault()
              analyze()
            }}
          >
            <input aria-label={tr('Recurrence relation')} value={draft} onChange={(e) => setDraft(e.target.value)} spellCheck={false} />
            <button type="submit">
              {tr('Analyze')}
              <ArrowRight size={19} />
            </button>
          </form>
          <div className="sb-examples">
            <span>{tr('Try examples:')}</span>
            {substitutionPresets.map((p) => (
              <button aria-pressed={id === p.id} key={p.id} onClick={() => load(p.id)}>
                {p.recurrence}
              </button>
            ))}
          </div>
          {error && <p role="alert">{tr(error)}</p>}
          {showDetails && (
            <div className="sb-expanded-proof">
              <h3>{tr('Proof domain and certificate')}</h3>
              <p>
                {tr(
                  'We set T(1) = 1. Divide-by-two recurrences use exact powers of 2; the chain recurrence uses all positive integers. Floors, ceilings, and arbitrary inputs need an explicit extension argument.',
                )}
              </p>
              <p>{tr(proof.explanation)}</p>
              <p>{tr(proof.base)}</p>
              <details>
                <summary>{tr('Exact solution and matching lower bound')}</summary>
                <p>
                  {tr(
                    id === 'merge'
                      ? 'Divide by n: S(n) = T(n)/n satisfies S(n) = S(n/2) + 1. With h = log₂ n and S(1) = 1, T(n) = n(h + 1). Thus T(n) ≥ n log₂ n and the proved upper bound is tight.'
                      : id === 'ternary'
                        ? 'Let p = log₂ 3. The exact identity T(n) = 3nᵖ − 2n has base T(1) = 1 and satisfies 3T(n/2) + n. Since nᵖ ≥ n, it gives T(n) ≥ nᵖ and T(n) ≤ 3nᵖ.'
                        : id === 'chain'
                          ? 'Expanding to the base gives T(n) = 1 + 2 + ⋯ + n = n(n + 1)/2. Hence n²/2 ≤ T(n) ≤ n² for every integer n ≥ 1.'
                          : 'Set h = log₂ n and divide by n. Each expansion adds h, h − 1, …, 1. Therefore T(n) = n[1 + h(h + 1)/2], between (1/2)nh² and 2nh² for h ≥ 1. This proves Θ(n log² n).',
                  )}
                </p>
              </details>
              <button
                onClick={() => {
                  setGuess(recommendedGuess(id))
                  setC(id === 'ternary' ? 3 : id === 'chain' ? 1 : 2)
                  mark('guess')
                }}
              >
                {tr('Use recommended bound')}
              </button>
            </div>
          )}
        </div>
      )}
      {tab === 'Learn' && (
        <>
          <div className="sb-learn-grid">
            <div className="sb-proof-grid">
              {proofBuilder}
              {worked}
            </div>
            <aside>
              {tree}
              {takeaways}
            </aside>
          </div>
          <div className="sb-footer-grid">
            <Panel title={tr('Concept Summary')} icon={<BookOpen />}>
              <p>
                {tr(
                  'State a recurrence T(n), guess a bound, then prove it for every allowed input using strong induction. One fixed constant must satisfy both the algebra and all base cases.',
                )}
              </p>
              <button onClick={() => setTab('Visualize')}>
                {tr('Explore the proof')}
                <ArrowRight size={15} />
              </button>
            </Panel>
            <Panel title={tr('Common Mistakes')} icon={<AlertTriangle />} className="sb-mistakes">
              {[
                [
                  'Guessing the wrong bound or missing a log factor.',
                  'Try cn for the default recurrence: substitution leaves cn + n, which cannot close the claimed inequality. The exact solution disproves a linear upper bound.',
                ],
                [
                  'Ignoring base cases or changing c with n.',
                  'Choose a single constant first. For the default cn log₂ n claim, start at n = 2 with c ≥ 2 and record T(1) separately.',
                ],
                [
                  'Treating a loose upper bound as a tight order.',
                  'O(n²) can be a valid upper bound even when the true order is Θ(n log n). Prove a matching lower bound before claiming Θ.',
                ],
              ].map(([a, b]) => (
                <details key={a}>
                  <summary>{tr(a)}</summary>
                  <p>{tr(b)}</p>
                </details>
              ))}
            </Panel>
            <Panel title={tr('Edge Cases & Tips')} icon={<Settings />}>
              <ul>
                <li>{tr('Handle floors/ceilings in recurrences carefully.')}</li>
                <li>{tr('Try a strengthened hypothesis when a lower-order term will not cancel.')}</li>
                <li>{tr('A recursion tree suggests a guess; induction proves it.')}</li>
              </ul>
              <details>
                <summary>{tr('Why the strengthened ternary bound works')}</summary>
                <p>
                  {tr('For 3T(n/2) + n, a pure cnᵖ guess leaves an unwanted +n. Using cnᵖ − 2n makes the linear terms cancel exactly, with c ≥ 3 at the base.')}
                </p>
              </details>
            </Panel>
          </div>
        </>
      )}
      {tab === 'Visualize' && lab}
      {tab === 'Practice' && (
        <Panel title={tr('Prediction Challenge')} icon={<Pencil />} className="sb-exercise">
          <h3>{preset.recurrence}</h3>
          <p>{tr('With T(1) = 1, predict the exact value of T(8). Expand the recurrence before checking your answer.')}</p>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              if (!prediction.trim() || !Number.isFinite(Number(prediction))) {
                setFeedback('Enter a finite numeric answer.')
                return
              }
              const actual = exactSubstitutionCost(id, 8)
              setFeedback(
                Number(prediction) === actual
                  ? `Correct. T(8) = ${actual}.`
                  : `Not yet. T(8) = ${actual}. Review the exact-cost table and try expanding each recursive call.`,
              )
              mark('challenge')
            }}
          >
            <label>
              {tr('Predicted T(8)')}
              <input type="number" value={prediction} onChange={(e) => setPrediction(e.target.value)} />
            </label>
            <button>{tr('Check prediction')}</button>
          </form>
          {feedback && <p role="status">{tr(feedback)}</p>}
          <button onClick={() => setTab('Visualize')}>{tr('Review exact costs')}</button>
        </Panel>
      )}
      {tab === 'Quiz' && (
        <Panel title={tr('Check Your Understanding')} icon={<Trophy />} className="sb-exercise">
          <p>{tr('For T(n) = 2T(n/2) + n with T(1) = 1, which cn log₂ n claim is justified?')}</p>
          {[
            'Use c = 1 and start at n = 1.',
            'Use c ≥ 2, prove the bound for powers of 2 with n ≥ 2, and record T(1) separately.',
            'Choose a different c for each input n.',
          ].map((answer, i) => (
            <button
              key={answer}
              aria-pressed={quiz === String(i)}
              onClick={() => {
                setQuiz(String(i))
                mark('challenge')
              }}
            >
              {tr(answer)}
            </button>
          ))}
          {quiz && (
            <p role="status">
              {tr(
                quiz === '1'
                  ? 'Correct. T(2) = 4 needs c ≥ 2; the general step then closes.'
                  : 'Try again. At n = 1, n log₂ n = 0; one fixed constant must also cover the base at n = 2.',
              )}
            </p>
          )}
        </Panel>
      )}
      {tab === 'Notes' && (
        <Panel title={tr('Your Substitution Notes')} icon={<FileText />} className="sb-exercise">
          <label htmlFor="sb-notes">{tr('Record the recurrence, guess, induction domain, constant, and base cases.')}</label>
          <textarea id="sb-notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={12} />
          <p>{tr('Saved in this browser.')}</p>
        </Panel>
      )}
    </div>
  )
}
