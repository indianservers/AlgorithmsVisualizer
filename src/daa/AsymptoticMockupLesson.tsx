// @localized-render
import { useId, useRef, useState, type ReactNode } from 'react'
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock3,
  FileText,
  FlaskConical,
  Lightbulb,
  LineChart,
  Pencil,
  Settings,
  Target,
  Trophy,
  X,
} from 'lucide-react'
import { tx, useLocaleRender } from '../i18n/render'
import { usePersistentState, persistentString } from '../hooks/usePersistentState'
import { MockupLessonChrome, type MockupPageProps } from './MockupLessonChrome'
import {
  asymptoticFunctions,
  asymptoticPlot,
  asymptoticRelation,
  asymptoticValue,
  notationDefinitions,
  polynomialCertificate,
  polynomialValue,
  type AsymptoticNotation,
  type GrowthFunction,
  type Polynomial,
} from './asymptoticModel'
import './asymptotic-mockup.css'

const tr = (s: string) => tx(s, 'studios')
const tabs = ['Learn', 'Visualize', 'Practice', 'Quiz', 'Notes'] as const,
  tabIcons = [BookOpen, LineChart, Pencil, Trophy, FileText],
  notations: AsymptoticNotation[] = ['O', 'Ω', 'Θ', 'o', 'ω']
const superscripts = ['⁰', '¹', '²', '³', '⁴', '⁵']
const compact = (n: number) => (Math.abs(n) >= 1e6 ? n.toExponential(3).replace('e+', 'e') : Number(n.toFixed(4)).toString())
const mistakes = [
  [
    'Thinking Big-O is the same as worst, best or average case.',
    'First choose a case or a probability model, obtaining a cost function. O, Ω and Θ then describe bounds on that function. Big-O alone does not name a case.',
  ],
  [
    'Ignoring the “eventually” part (bounds hold for all sufficiently large n).',
    'One finite graph cannot prove a bound. State constants and a threshold, and justify the inequality for every n above that threshold.',
  ],
  [
    'Changing the complexity class due to constants or lower-order terms.',
    'For a polynomial with a positive leading coefficient, its highest nonzero power gives the tight order. A constant factor changes numeric work but not the asymptotic class.',
  ],
  [
    'Confusing O(n²) with O(n) or assuming O(n²) is tight without a matching lower bound.',
    'n belongs to O(n²), but n² does not belong to O(n). An O(n²) upper bound alone does not prove Θ(n²); a matching Ω(n²) bound is required.',
  ],
]
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
    <section className={`mom-panel an-panel ${className}`}>
      <header>
        <span className="an-icon">{icon}</span>
        <div>
          <h2>{tr(title)}</h2>
          {description && <p>{tr(description)}</p>}
        </div>
      </header>
      {children}
    </section>
  )
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
function HeroArt() {
  const id = useId()
  return (
    <svg className="an-hero-art" viewBox="0 0 270 156" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id={id} x2="0" y2="1">
          <stop stopColor="#91c2ff" />
          <stop offset="1" stopColor="#d7edff" stopOpacity=".3" />
        </linearGradient>
      </defs>
      <path d="M0 156C30 119 35 4 65 62S120 23 150 76 201 8 231 42 258 22 270 32V156Z" fill={`url(#${id})`} />
      <path d="M0 156C46 81 47 79 73 116S133 57 174 70 228 151 270 80" fill="none" stroke="#0879ff" strokeWidth="1.6" />
      <circle cx="174" cy="70" r="6" fill="#0076ff" stroke="white" strokeWidth="2" />
      <rect x="169" y="16" width="50" height="35" rx="9" fill="#e1f0ff" stroke="#d0e5ff" />
      <text x="194" y="39" textAnchor="middle" fontSize="16" fill="#0071ff">
        {'f(n)'}
      </text>
    </svg>
  )
}
type Detail = 'concept' | 'worked' | 'mistakes' | AsymptoticNotation
export function AsymptoticMockupLesson(props: MockupPageProps) {
  useLocaleRender()
  const [tab, setTab] = useState<(typeof tabs)[number]>('Learn'),
    [scale, setScale] = useState<'linear' | 'log'>('log'),
    [maxN, setMaxN] = useState(1000),
    [enabled, setEnabled] = useState<GrowthFunction[]>(asymptoticFunctions.map((f) => f.id)),
    [ceiling, setCeiling] = useState(1e6),
    [inspected, setInspected] = useState<number | null>(null),
    [probeN, setProbeN] = useState(1),
    [f, setF] = useState<GrowthFunction>('linear'),
    [g, setG] = useState<GrowthFunction>('quadratic'),
    [poly, setPoly] = useState<Polynomial>({ a: 3, b: 5, d: 2, p: 3 }),
    [c, setC] = useState(10),
    [polyError, setPolyError] = useState(''),
    [detail, setDetail] = useState<Detail | null>(null),
    [activities, setActivities] = useState<string[]>([]),
    [prediction, setPrediction] = useState(''),
    [feedback, setFeedback] = useState(''),
    [quiz, setQuiz] = useState('')
  const [notes, setNotes] = usePersistentState('asymptotic-notation-notes', '', persistentString)
  const dialog = useRef<HTMLDialogElement>(null),
    clip = useId(),
    plot = asymptoticPlot(maxN, scale, enabled, ceiling),
    relation = asymptoticRelation(f, g),
    certificate = polynomialCertificate(poly, c),
    standardC = poly.a + poly.b + poly.d,
    polynomial = `${poly.a}n${superscripts[poly.p]}${poly.b ? ` + ${poly.b}n` : ''}${poly.d ? ` + ${poly.d}` : ''}`
  const mark = (key: string) => setActivities((previous) => (previous.includes(key) ? previous : [...previous, key]))
  function openDetail(value: Detail) {
    setDetail(value)
    dialog.current?.showModal()
    mark(value === 'worked' ? 'worked' : value === 'mistakes' ? 'mistakes' : 'notation')
  }
  function changeCoefficient(key: 'a' | 'b' | 'd', value: number) {
    if (!Number.isInteger(value) || value < (key === 'a' ? 1 : 0) || value > 20) {
      setPolyError('Use integer coefficients from 0 to 20; the leading coefficient must be positive.')
      return
    }
    setPoly((previous) => ({ ...previous, [key]: value }))
    setPolyError('')
    mark('worked')
  }
  const polynomialControls = (
    <div className="an-polynomial-controls">
      <label>
        {tr('Leading coefficient a')}
        <input
          aria-label={tr('Leading coefficient a')}
          type="number"
          min="1"
          max="20"
          value={poly.a}
          onChange={(e) => changeCoefficient('a', Number(e.target.value))}
        />
      </label>
      <label>
        {tr('Linear coefficient b')}
        <input
          aria-label={tr('Linear coefficient b')}
          type="number"
          min="0"
          max="20"
          value={poly.b}
          onChange={(e) => changeCoefficient('b', Number(e.target.value))}
        />
      </label>
      <label>
        {tr('Constant term d')}
        <input
          aria-label={tr('Constant term d')}
          type="number"
          min="0"
          max="20"
          value={poly.d}
          onChange={(e) => changeCoefficient('d', Number(e.target.value))}
        />
      </label>
      <label>
        {tr('Leading power p')}
        <select
          aria-label={tr('Leading power p')}
          value={poly.p}
          onChange={(e) => {
            setPoly((previous) => ({ ...previous, p: Number(e.target.value) }))
            mark('worked')
          }}
        >
          {[2, 3, 4, 5].map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
      </label>
      <label>
        {tr('Candidate bound constant c')}
        <input
          aria-label={tr('Candidate bound constant c')}
          type="number"
          min="0.01"
          max="100"
          step="0.01"
          value={c}
          onChange={(e) => {
            const value = Number(e.target.value)
            if (!Number.isFinite(value) || value <= 0 || value > 100 || Math.abs(value * 100 - Math.round(value * 100)) > 1e-8) {
              setPolyError('Use a positive c ≤ 100 with at most two decimal places.')
              return
            }
            setC(Math.round(value * 100) / 100)
            setPolyError('')
            mark('worked')
          }}
        />
      </label>
    </div>
  )
  const boundProof = (
    <div className="an-bound-proof">
      <h3>
        <span className="an-math">{`f(n) = ${polynomial}`}</span>
      </h3>
      {polynomialControls}
      {polyError && <p role="alert">{tr(polyError)}</p>}
      <div className={`an-certificate ${certificate.valid ? 'valid' : 'invalid'}`} role="status">
        <strong>
          {tr(
            certificate.valid ? `Verified upper-bound certificate: c = ${c}, n₀ = ${certificate.n0}` : 'This constant does not give an eventual upper bound.',
          )}
        </strong>
        <p>{tr(certificate.reason)}</p>
      </div>
      <p className="an-math">{`f(n)/n${superscripts[poly.p]} = ${poly.a} + ${poly.b}/n${superscripts[poly.p - 1]} + ${poly.d}/n${superscripts[poly.p]}`}</p>
      <p>
        {tr(
          `A simple certificate always uses c = ${standardC}, n₀ = 1: each lower-order term is bounded by its coefficient times n${superscripts[poly.p]} for n ≥ 1.`,
        )}
      </p>
      <p>
        {tr(
          `The matching lower bound is ${poly.a}n${superscripts[poly.p]} ≤ f(n), so f(n) ∈ Θ(n${superscripts[poly.p]}). This symbolic argument, rather than the finite table, proves the general order.`,
        )}
      </p>
      <div className="an-table-scroll">
        <table>
          <thead>
            <tr>
              {['n', 'f(n)', 'c · nᵖ', 'f(n)/nᵖ', 'Inequality holds?'].map((t) => (
                <th key={t}>{tr(t)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[1, 2, 5, 10, 100, 1000].map((n) => (
              <tr key={n}>
                <td>{n}</td>
                <td>{compact(polynomialValue(poly, n))}</td>
                <td>{compact(c * n ** poly.p)}</td>
                <td>{compact(certificate.ratio(n))}</td>
                <td>{tr(certificate.holds(n) ? 'Yes' : 'No')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p>{tr('Numeric values are rounded for display. Threshold checks use exact integer arithmetic for the chosen two-decimal constant.')}</p>
    </div>
  )
  const chart = (
    <Panel
      title={tr('Growth Rate Visualization')}
      description="Compare how common functions grow as n increases. Toggle functions on/off and explore different scales."
      icon={<LineChart />}
      className="an-chart"
    >
      <div className="an-chart-options">
        <span>{tr('Scale:')}</span>
        <div>
          <button
            aria-pressed={scale === 'linear'}
            onClick={() => {
              setScale('linear')
              mark('chart')
            }}
          >
            {tr('Linear')}
          </button>
          <button
            aria-pressed={scale === 'log'}
            onClick={() => {
              setScale('log')
              mark('chart')
            }}
          >
            {tr('Logarithmic')}
          </button>
        </div>
        <label>
          {tr('Range:')}
          <select
            aria-label={tr('Growth input range')}
            value={maxN}
            onChange={(e) => {
              setMaxN(Number(e.target.value))
              setInspected(null)
              setProbeN((previous) => Math.min(previous, Number(e.target.value)))
              mark('chart')
            }}
          >
            {[20, 100, 1000].map((value) => (
              <option key={value} value={value}>
                {tr(`n = 1 to ${value}`)}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="an-chart-body">
        <div className="an-plot-wrap">
          <svg
            className="an-plot"
            viewBox="0 0 720 246"
            aria-label={tr(`${scale === 'log' ? 'Logarithmic' : 'Linear'} asymptotic growth chart`)}
            onPointerMove={(e) => {
              const box = e.currentTarget.getBoundingClientRect(),
                x = ((e.clientX - box.left) * 720) / box.width
              setInspected(Math.max(1, Math.min(maxN, Math.round(1 + ((x - 64) / 640) * (maxN - 1)))))
            }}
            onPointerLeave={() => setInspected(null)}
          >
            <desc>
              {tr(
                'Curves plot actual representative functions on the stated axes. Values above the vertical ceiling are clipped. Zero values are omitted on a logarithmic vertical axis.',
              )}
            </desc>
            <defs>
              <clipPath id={clip}>
                <rect x="64" y="15" width="640" height="180" />
              </clipPath>
            </defs>
            {plot.ticks.map((value) => (
              <g key={value}>
                <line x1="64" x2="704" y1={15 + 180 * plot.project(value)} y2={15 + 180 * plot.project(value)} stroke="#dae8fa" strokeDasharray="3 3" />
                <text x="52" y={19 + 180 * plot.project(value)} textAnchor="end" fill="var(--mom-muted)" fontSize="12">
                  {scale === 'log' ? (
                    <>
                      {'10'}
                      <tspan dy="-5" fontSize="8">
                        {Math.log10(value)}
                      </tspan>
                    </>
                  ) : (
                    compact(value)
                  )}
                </text>
              </g>
            ))}
            {Array.from({ length: 6 }, (_, i) => {
              const x = 64 + i * 128
              return (
                <g key={i}>
                  <line x1={x} x2={x} y1="15" y2="201" stroke="#e1ebfa" strokeDasharray="3 3" />
                  <text x={x} y="220" fontSize="12" textAnchor="middle" fill="var(--mom-muted)">
                    {Math.round(1 + (i * (maxN - 1)) / 5).toLocaleString('en-US')}
                  </text>
                </g>
              )
            })}
            <path d="M64 15V195H704" fill="none" stroke="#627caa" strokeWidth="1.2" />
            <g clipPath={`url(#${clip})`}>
              {plot.series.map((series) => (
                <path
                  data-function={series.id}
                  key={series.id}
                  d={series.points.map((point, i) => `${i ? 'L' : 'M'}${64 + point.x * 640},${15 + point.y * 180}`).join(' ')}
                  fill="none"
                  stroke={asymptoticFunctions.find((f) => f.id === series.id)!.color}
                  strokeWidth="2.2"
                />
              ))}
            </g>
            <text transform="translate(15 113) rotate(-90)" fontSize="13" fill="var(--mom-muted)">
              {'f(n)'}
            </text>
            <text x="382" y="242" textAnchor="middle" fontSize="12" fill="var(--mom-muted)">
              {tr('n (input size)')}
            </text>
          </svg>
          {inspected !== null && (
            <output className="an-inspected-values">
              {`n = ${inspected}: `}
              {enabled.map((key) => `${asymptoticFunctions.find((f) => f.id === key)!.formula} = ${compact(asymptoticValue(key, inspected))}`).join('; ')}
            </output>
          )}
        </div>
        <div className="an-function-legend">
          {asymptoticFunctions.map((fn) => (
            <label key={fn.id}>
              <input
                type="checkbox"
                checked={enabled.includes(fn.id)}
                onChange={(e) => {
                  setEnabled((previous) => (e.target.checked ? [...previous, fn.id] : previous.filter((key) => key !== fn.id)))
                  mark('chart')
                }}
              />
              <i style={{ background: fn.color }} />
              <strong>{fn.label}</strong>
              <span>{`f(n) = ${fn.formula}`}</span>
            </label>
          ))}
        </div>
      </div>
      <p className="an-chart-domain-note">
        {enabled.length === 0
          ? tr('No curves selected. Enable a function to compare its values.')
          : tr(`Vertical ceiling: ${compact(ceiling)}. Curves above it are clipped; values remain available in the laboratory.`)}
      </p>
    </Panel>
  )
  const takeaways = (
    <Panel title={tr('Key Takeaways')} icon={<Lightbulb />} className="an-takeaways">
      <ul>
        {[
          'Understand Big-O, Big-Ω, Big-Θ and little-notation.',
          'Compare common growth classes and their relationships.',
          'Use asymptotic notation to describe time and space complexity.',
          'Positive factors and lower-order terms preserve polynomial growth.',
        ].map((s) => (
          <li key={s}>
            <Check />
            <span>{tr(s)}</span>
          </li>
        ))}
      </ul>
      <div className="an-pro-tip">
        <h3>
          <Target />
          {tr('Pro Tip')}
        </h3>
        <p>{tr('Logarithm bases differ by constant factors, so log₂ n and log₁₀ n are both Θ(log n). Use any fixed base greater than 1.')}</p>
      </div>
    </Panel>
  )
  const concept = (
    <Panel title={tr('Concept Summary')} icon={<BookOpen />} className="an-concept">
      <button className="an-panel-more" aria-label={tr('Open concept summary')} onClick={() => openDetail('concept')}>
        <ChevronRight size={17} />
      </button>
      <p>
        {tr(
          'For eventually nonnegative functions, f ∈ O(g) means there are constants c > 0 and n₀ with f(n) ≤ c g(n) for all n ≥ n₀. f ∈ Ω(g) reverses the inequality. Θ(g) = O(g) ∩ Ω(g). These are bounds, not synonyms for worst, best and average cases.',
        )}
      </p>
      <button className="an-learn-more" onClick={() => openDetail('concept')}>
        {tr('Learn more')}
        <ArrowRight size={15} />
      </button>
    </Panel>
  )
  const worked = (
    <Panel title={tr('Worked Example')} icon={<Settings />} className="an-worked">
      <button className="an-panel-more" aria-label={tr('Open worked bound example')} onClick={() => openDetail('worked')}>
        <ChevronRight size={17} />
      </button>
      <p>{tr(`For ${polynomial} and n ≥ 1, show it is O(n${superscripts[poly.p]}).`)}</p>
      <ol>
        <li>
          <b>{'1'}</b>
          <span>{tr(`For n ≥ 1, ${poly.b}n ≤ ${poly.b}n${superscripts[poly.p]} and ${poly.d} ≤ ${poly.d}n${superscripts[poly.p]}.`)}</span>
        </li>
        <li>
          <b>{'2'}</b>
          <span>{tr(`So ${polynomial} ≤ ${standardC}n${superscripts[poly.p]}.`)}</span>
        </li>
        <li>
          <b>{'3'}</b>
          <span>{tr(`Choose c = ${standardC} and n₀ = 1. Then f(n) ≤ c n${superscripts[poly.p]} for all n ≥ n₀, so f ∈ O(n${superscripts[poly.p]}).`)}</span>
        </li>
      </ol>
      <div className="an-worked-result">
        <CheckCircle2 />
        <span>{tr('Positive factors and lower-order terms preserve the leading growth class.')}</span>
      </div>
    </Panel>
  )
  const common = (
    <Panel title={tr('Common Mistakes')} icon={<AlertTriangle />} className="an-mistakes">
      <button className="an-panel-more" aria-label={tr('Open common mistakes')} onClick={() => openDetail('mistakes')}>
        <ChevronRight size={17} />
      </button>
      <ul>
        {mistakes.map(([title]) => (
          <li key={title}>
            <button onClick={() => openDetail('mistakes')}>
              <X />
              <span>{tr(title)}</span>
            </button>
          </li>
        ))}
      </ul>
      <button className="an-more-examples" onClick={() => openDetail('mistakes')}>
        {tr('See more examples')}
        <ArrowRight size={15} />
      </button>
    </Panel>
  )
  const definitions = (
    <section className="an-definitions">
      <h2>
        <span className="an-icon">
          <FlaskConical />
        </span>
        {tr('Key Definitions & Formulas')}
      </h2>
      {notations.map((symbol) => (
        <button key={symbol} onClick={() => openDetail(symbol)} aria-label={tr(`Open ${symbol} definition`)}>
          <strong>
            {symbol}
            {'(g): '}
            {symbol === 'O'
              ? 'f(n) ≤ c g(n)'
              : symbol === 'Ω'
                ? 'f(n) ≥ c g(n)'
                : symbol === 'Θ'
                  ? 'both O(g) and Ω(g)'
                  : symbol === 'o'
                    ? 'f(n)/g(n) → 0'
                    : 'f(n)/g(n) → ∞'}
          </strong>
          <small>{symbol === 'Θ' ? 'Θ(g) = O(g) ∩ Ω(g)' : tr(symbol === 'O' || symbol === 'Ω' ? 'for n ≥ n₀' : 'as n → ∞')}</small>
        </button>
      ))}
    </section>
  )
  const lab = (
    <Panel
      title={tr('Asymptotic Comparison Laboratory')}
      description="Compare representative functions, inspect actual values, and construct a general bound certificate."
      icon={<LineChart />}
      className="an-lab"
    >
      <div className="an-lab-controls">
        <label>
          {tr('Vertical ceiling')}
          <select
            aria-label={tr('Vertical chart ceiling')}
            value={ceiling}
            onChange={(e) => {
              setCeiling(Number(e.target.value))
              mark('chart')
            }}
          >
            {[1e3, 1e6, 1e12].map((value) => (
              <option key={value} value={value}>
                {compact(value)}
              </option>
            ))}
          </select>
        </label>
        <label>
          {tr('Inspect input n')}
          <input
            aria-label={tr('Inspect input n')}
            type="number"
            min="1"
            max={maxN}
            value={probeN}
            onChange={(e) => {
              const value = Number(e.target.value)
              if (Number.isInteger(value) && value >= 1 && value <= maxN) {
                setProbeN(value)
                mark('chart')
              }
            }}
          />
        </label>
      </div>
      {chart}
      <div className="an-value-table an-table-scroll">
        <table>
          <thead>
            <tr>
              <th>{'f(n)'}</th>
              <th>{tr(`Value at n = ${probeN}`)}</th>
            </tr>
          </thead>
          <tbody>
            {asymptoticFunctions.map((fn) => (
              <tr key={fn.id}>
                <td>{fn.formula}</td>
                <td>{compact(asymptoticValue(fn.id, probeN))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <h3>{tr('Which asymptotic relationships hold?')}</h3>
      <div className="an-lab-controls">
        <label>
          {'f(n)'}
          <select
            aria-label={tr('Comparison function f')}
            value={f}
            onChange={(e) => {
              setF(e.target.value as GrowthFunction)
              mark('notation')
            }}
          >
            {asymptoticFunctions.map((fn) => (
              <option key={fn.id} value={fn.id}>
                {fn.formula}
              </option>
            ))}
          </select>
        </label>
        <label>
          {'g(n)'}
          <select
            aria-label={tr('Comparison function g')}
            value={g}
            onChange={(e) => {
              setG(e.target.value as GrowthFunction)
              mark('notation')
            }}
          >
            {asymptoticFunctions.map((fn) => (
              <option key={fn.id} value={fn.id}>
                {fn.formula}
              </option>
            ))}
          </select>
        </label>
        <output className="an-limit">
          {tr('Limit f(n)/g(n): ')}
          {relation.limit}
        </output>
      </div>
      <div className="an-memberships">
        {notations.map((symbol) => (
          <button key={symbol} data-holds={relation.membership[symbol]} onClick={() => openDetail(symbol)}>
            {relation.membership[symbol] ? <Check /> : <X />}
            {`f ∈ ${symbol}(g)`}
          </button>
        ))}
      </div>
      <p>
        {tr(
          'These conclusions use the known asymptotic hierarchy of the selected representatives, with g(n) > 0 for n ≥ 2. Finite samples alone cannot prove the limits. Graph legends name growth classes; each curve plots its stated representative function.',
        )}
      </p>
      {boundProof}
    </Panel>
  )
  return (
    <div className="mom-page growth-page target-visual" data-target="3">
      <MockupLessonChrome
        {...props}
        title={tr('Asymptotic Notation and Growth')}
        description="Separate upper bounds, lower bounds, tight bounds and strict asymptotic notation. Compare the growth of common function classes and understand their relationships."
        progress={{ completed: activities.length, total: 5 }}
        startLabel="Continue Learning"
        searchPlaceholder="Search topics, examples, or practice problems..."
        heroIcon={<Bars />}
        decoration={<HeroArt />}
        onStart={() => setTab('Visualize')}
        badges={
          <>
            <span>
              <Bars />
              {tr('Analysis & Correctness')}
            </span>
            <span>
              <BookOpen />
              {tr('Beginner Friendly')}
            </span>
            <span>
              <Clock3 />
              {tr('~ 15 min')}
            </span>
            <span className="an-dots">{'●○○○○'}</span>
          </>
        }
      />
      <nav className="mom-tabs an-tabs" aria-label={tr('Algorithm sections')}>
        {tabs.map((name, i) => {
          const Icon = tabIcons[i]
          return (
            <button key={name} aria-pressed={tab === name} onClick={() => setTab(name)}>
              <Icon size={19} />
              {tr(name)}
            </button>
          )
        })}
      </nav>
      {tab === 'Learn' && (
        <>
          <div className="an-top-grid">
            {chart}
            {takeaways}
          </div>
          <div className="an-bottom-grid">
            {concept}
            {worked}
            {common}
          </div>
          {definitions}
        </>
      )}
      {tab === 'Visualize' && lab}
      {tab === 'Practice' && (
        <Panel title={tr('Prediction Challenge')} icon={<Pencil />} className="an-exercise">
          <p>{tr('For f(n) = 3n³ + 5n + 2 and c = 10, predict the smallest integer n₀ ≥ 1 such that f(n) ≤ 10n³ for every n ≥ n₀.')}</p>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              if (!prediction.trim() || !Number.isFinite(Number(prediction))) {
                setFeedback('Enter a finite numeric answer.')
                return
              }
              setFeedback(
                Number(prediction) === 1
                  ? 'Correct. For n ≥ 1, 5n ≤ 5n³ and 2 ≤ 2n³, so f(n) ≤ 10n³.'
                  : 'Try again. The inequality already holds at n = 1, and each lower-order term stays bounded by its cubic counterpart. Thus n₀ = 1.',
              )
              mark('challenge')
            }}
          >
            <label>
              {tr('Predicted threshold n₀')}
              <input type="number" value={prediction} onChange={(e) => setPrediction(e.target.value)} />
            </label>
            <button>{tr('Check prediction')}</button>
          </form>
          {feedback && <p role="status">{tr(feedback)}</p>}
        </Panel>
      )}
      {tab === 'Quiz' && (
        <Panel title={tr('Check Your Understanding')} icon={<Trophy />} className="an-exercise">
          <p>{tr('Which statement correctly describes f(n) = n and g(n) = n²?')}</p>
          {['f ∈ O(g) and f ∈ o(g), but f ∉ Θ(g).', 'f ∈ Θ(g), because O always means a tight bound.', 'f ∈ Ω(g), because the best case uses Ω.'].map(
            (answer, i) => (
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
            ),
          )}
          {quiz && (
            <p role="status">
              {tr(
                quiz === '0'
                  ? 'Correct. f(n)/g(n) = 1/n → 0, so the upper bound is strict.'
                  : 'Try again. The ratio 1/n tends to zero. Notation describes bounds, and does not choose a best or worst case.',
              )}
            </p>
          )}
        </Panel>
      )}
      {tab === 'Notes' && (
        <Panel title={tr('Your Asymptotic Notes')} icon={<FileText />} className="an-exercise">
          <label htmlFor="an-notes">{tr('Record the functions, bound constants, threshold, and strict or tight relationship.')}</label>
          <textarea id="an-notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={12} />
          <p>{tr('Saved in this browser.')}</p>
        </Panel>
      )}
      <dialog ref={dialog} className="an-dialog" aria-label={tr('Asymptotic notation details')} onClose={() => setDetail(null)}>
        <button className="an-dialog-close" aria-label={tr('Close notation details')} onClick={() => dialog.current?.close()}>
          <X size={20} />
        </button>
        {detail === 'worked' ? (
          <>
            <h2>{tr('Worked Bound Certificate')}</h2>
            {boundProof}
          </>
        ) : detail === 'mistakes' ? (
          <>
            <h2>{tr('Common Mistakes and Counterexamples')}</h2>
            {mistakes.map(([title, body]) => (
              <section key={title}>
                <h3>{tr(title)}</h3>
                <p>{tr(body)}</p>
              </section>
            ))}
          </>
        ) : detail === 'concept' ? (
          <>
            <h2>{tr('Asymptotic Bounds and Their Quantifiers')}</h2>
            <p>
              {tr(
                'Assume f and g are eventually nonnegative. Ratio statements additionally assume g is eventually positive. A bound must hold for all sufficiently large inputs, rather than a few measured samples.',
              )}
            </p>
            {notations.map((symbol) => (
              <section key={symbol}>
                <h3>{tr(notationDefinitions[symbol].name)}</h3>
                <p className="an-math">{tr(notationDefinitions[symbol].formula)}</p>
                <p>{tr(notationDefinitions[symbol].meaning)}</p>
                <p>{tr(notationDefinitions[symbol].example)}</p>
              </section>
            ))}
          </>
        ) : (
          detail && (
            <>
              <h2>{tr(notationDefinitions[detail].name)}</h2>
              <p className="an-math">{tr(notationDefinitions[detail].formula)}</p>
              <p>{tr(notationDefinitions[detail].meaning)}</p>
              <p>{tr(notationDefinitions[detail].example)}</p>
              <p>{tr('Functions are eventually nonnegative; ratio statements require an eventually positive denominator.')}</p>
            </>
          )
        )}
      </dialog>
    </div>
  )
}
