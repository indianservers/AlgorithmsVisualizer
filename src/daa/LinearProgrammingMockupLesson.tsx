// @localized-render
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  Search,
  Bookmark,
  Check,
  RotateCw,
  ChartNoAxesColumnIncreasing,
  PencilLine,
  Crosshair,
  Trash2,
  Plus,
  Trophy,
  Lightbulb,
  Settings,
  Shield,
  FileText,
  X,
} from 'lucide-react'
import { AccountControl } from '../account/AccountControl'
import { LanguageSelector } from '../i18n/LanguageSelector'
import { allModules } from '../algorithms'
import { algorithmPath } from '../utils/routing'
import { tx, useLocaleRender } from '../i18n/render'
import { persistentString, usePersistentState } from '../hooks/usePersistentState'
import { MockupTabs, type MockupPageProps, type MockupTab } from './MockupLessonChrome'
import {
  lpExample,
  lpFractionalExample,
  runLPLesson,
  parseLPInput,
  lpValue,
  lpFeasible,
  clipLPLine,
  clipLPRegion,
  formatLPExpression,
  formatLPNumber,
  type LPInput,
  type LPConstraint,
  type LPPoint,
  type LPView,
} from './linearProgrammingLessonModel'
import './linear-programming-mockup.css'
type Run = ReturnType<typeof runLPLesson>
const tr = (s: string) => tx(s, 'studios'),
  tabs: MockupTab[] = ['Learn', 'Visualization', 'Code', 'Practice', 'Experiments', 'Notes'],
  example = runLPLesson(lpExample),
  palette = ['#087aff', '#ff8b00', '#8e32ed', '#009e6b', '#e95a9f', '#00a4bc', '#a77712', '#7966ee'],
  num = formatLPNumber,
  point = (p: LPPoint | null) => (p ? `(${num(p.x)}, ${num(p.y)})` : '—'),
  op = (s: LPConstraint['op']) => (s === '<=' ? '≤' : s === '>=' ? '≥' : '='),
  rowsOf = (input: LPInput) => input.constraints.map((c) => ({ expression: formatLPExpression(c), op: c.op, rhs: num(c.rhs) })),
  same = (a: LPPoint, b: LPPoint) => Math.abs(a.x - b.x) < 1e-7 && Math.abs(a.y - b.y) < 1e-7
function Panel({ title, icon, children, className = '' }: { title: string; icon: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`lp-panel ${className}`}>
      <header>
        <span className="lp-icon">{icon}</span>
        <h2>{title}</h2>
      </header>
      {children}
    </section>
  )
}
function Plot({
  run,
  mini = false,
  region,
  contours = false,
  zoom = 1,
  active,
  onPoint,
  onConstraint,
}: {
  run: Run
  mini?: boolean
  region: boolean
  contours?: boolean
  zoom?: number
  active?: LPPoint | null
  onPoint: (p: LPPoint, integer?: boolean) => void
  onConstraint?: (i: number) => void
}) {
  const raw = run.view,
    view: LPView = {
      xmin: raw.xmin,
      xmax: raw.xmin + ((raw.xmax - raw.xmin) / zoom) * (mini ? 6.2 / 7.6 : 1),
      ymin: raw.ymin,
      ymax: raw.ymin + ((raw.ymax - raw.ymin) / zoom) * (mini ? 5.5 / 5.2 : 1),
    },
    left = mini ? 35 : 55,
    bottom = mini ? 177 : 318,
    width = mini ? 215 : 543,
    height = mini ? 146 : 295,
    x = (v: number) => left + ((v - view.xmin) / (view.xmax - view.xmin)) * width,
    y = (v: number) => bottom - ((v - view.ymin) / (view.ymax - view.ymin)) * height,
    axisX = view.xmin <= 0 && view.xmax >= 0 ? x(0) : left,
    axisY = view.ymin <= 0 && view.ymax >= 0 ? y(0) : bottom,
    polygon = clipLPRegion(run.input, view),
    clip = mini ? 'lp-mini-clip' : 'lp-main-clip',
    spanX = view.xmax - view.xmin,
    spanY = view.ymax - view.ymin,
    tick = (span: number) => {
      const unit = 10 ** Math.floor(Math.log10(span / 6))
      return Math.ceil(span / 6 / unit) * unit
    },
    stepX = tick(spanX),
    stepY = tick(spanY),
    ticksX = Array.from({ length: Math.min(12, Math.ceil(spanX / stepX) + 1) }, (_, i) => Math.ceil(view.xmin / stepX) * stepX + i * stepX).filter(
      (v) => v <= view.xmax,
    ),
    ticksY = Array.from({ length: Math.min(12, Math.ceil(spanY / stepY) + 1) }, (_, i) => Math.ceil(view.ymin / stepY) * stepY + i * stepY).filter(
      (v) => v <= view.ymax,
    ),
    defaultTicks =
      run.input.constraints.length === 4 && run.view.xmin === 0 && Math.abs(run.view.xmax - 7.6) < 1e-7 && Math.abs(run.view.ymax - 5.2) < 1e-7 && zoom === 1,
    xt = defaultTicks ? Array.from({ length: mini ? 7 : 8 }, (_, i) => i) : ticksX,
    yt = defaultTicks ? Array.from({ length: 6 }, (_, i) => i) : ticksY,
    objective = run.input.objective,
    increment = Math.max(1, (Math.abs(objective.a) + Math.abs(objective.b)) * 0.8),
    levels = [-1, 0, 1].map((i) => (run.value ?? 0) + i * increment),
    shownInteger = run.integer.points.filter((_, i) => i % Math.max(1, Math.ceil(run.integer.points.length / 250)) === 0),
    keyboard = (e: React.KeyboardEvent, fn: () => void) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        fn()
      }
    },
    callout = run.best ? { x: Math.min(mini ? 150 : 480, x(run.best.x) + 143), y: Math.max(12, y(run.best.y) - 93) } : null
  return (
    <svg
      className={mini ? 'lp-mini-svg' : 'lp-main-svg'}
      viewBox={mini ? '0 0 276 208' : '0 0 621 354'}
      width={mini ? 276 : 621}
      height={mini ? 208 : 354}
      role="img"
      aria-label={tr(mini ? 'Integer points and continuous relaxation' : 'Feasible region, constraint boundaries and objective contours')}
    >
      <defs>
        <clipPath id={clip}>
          <rect x={left - 12} y={bottom - height - 12} width={width + 24} height={height + 24} />
        </clipPath>
        <marker id={`${clip}-arrow`} markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
          <path d="M0,0 L7,3.5 L0,7" fill="#111b43" />
        </marker>
      </defs>
      {xt.map((v) => (
        <g key={`x${v}`}>
          <line className="lp-grid" x1={x(v)} x2={x(v)} y1={bottom - height} y2={bottom} />
          <line className="lp-tick-mark" x1={x(v)} x2={x(v)} y1={axisY} y2={axisY + 6} />
          <text className="lp-tick" x={x(v)} y={axisY + 26} textAnchor="middle">
            {num(v)}
          </text>
        </g>
      ))}
      {yt.map((v) => (
        <g key={`y${v}`}>
          <line className="lp-grid" x1={left} x2={left + width} y1={y(v)} y2={y(v)} />
          <line className="lp-tick-mark" x1={axisX - 5} x2={axisX} y1={y(v)} y2={y(v)} />
          <text className="lp-tick" x={axisX - 17} y={y(v) + 4} textAnchor="middle">
            {num(v)}
          </text>
        </g>
      ))}
      <path className="lp-axis" d={`M${left},${axisY}H${left + width + 4}`} markerEnd={`url(#${clip}-arrow)`} />
      <path className="lp-axis" d={`M${axisX},${bottom}V${bottom - height + 3}`} markerEnd={`url(#${clip}-arrow)`} />
      <text className="lp-axis-name" x={left + width + (mini ? 12 : 14)} y={axisY + 5}>
        {'x'}
      </text>
      <text className="lp-axis-name" x={axisX - 18} y={bottom - height - 4}>
        {'y'}
      </text>
      <g clipPath={`url(#${clip})`}>
        {region && polygon.length > 1 && <polygon className="lp-region" points={polygon.map((p) => `${x(p.x)},${y(p.y)}`).join(' ')} />}
        {run.input.constraints.map((row, i) => {
          const line = clipLPLine(row.a, row.b, row.rhs, view)
          return line.length === 2 ? (
            <g
              key={i}
              role={mini ? undefined : 'button'}
              tabIndex={mini ? undefined : 0}
              aria-label={mini ? undefined : `${tr('Inspect constraint')} ${i + 1}`}
              onClick={() => onConstraint?.(i)}
              onKeyDown={(e) => keyboard(e, () => onConstraint?.(i))}
            >
              <line x1={x(line[0].x)} x2={x(line[1].x)} y1={y(line[0].y)} y2={y(line[1].y)} stroke="transparent" strokeWidth="12" />
              <line
                className="lp-constraint-line"
                x1={x(line[0].x)}
                x2={x(line[1].x)}
                y1={y(line[0].y)}
                y2={y(line[1].y)}
                stroke={palette[i % palette.length]}
                strokeWidth={mini ? 1.5 : 2.4}
              />
            </g>
          ) : null
        })}
        {contours &&
          (objective.a !== 0 || objective.b !== 0) &&
          levels.map((level, i) => {
            const line = clipLPLine(objective.a, objective.b, level, view)
            return line.length === 2 ? <line className="lp-contour" key={i} x1={x(line[0].x)} x2={x(line[1].x)} y1={y(line[0].y)} y2={y(line[1].y)} /> : null
          })}
        {mini
          ? shownInteger.map((p, i) => (
              <g
                key={i}
                className="lp-integer-dot"
                role="button"
                tabIndex={0}
                aria-label={`${tr('Inspect integer point')} ${point(p)}`}
                onClick={() => onPoint(p, true)}
                onKeyDown={(e) => keyboard(e, () => onPoint(p, true))}
              >
                <title>{point(p)}</title>
                <circle cx={x(p.x)} cy={y(p.y)} r="8" fill="transparent" />
                <circle cx={x(p.x)} cy={y(p.y)} r="4.7" fill="#93a6c5" />
              </g>
            ))
          : run.vertices.map((p, i) => (
              <g
                className="lp-vertex"
                role="button"
                tabIndex={0}
                key={i}
                aria-label={`${tr('Inspect vertex')} ${point(p)}`}
                onClick={() => onPoint(p)}
                onKeyDown={(e) => keyboard(e, () => onPoint(p))}
              >
                <circle cx={x(p.x)} cy={y(p.y)} r="11" fill="transparent" />
                <circle
                  cx={x(p.x)}
                  cy={y(p.y)}
                  r={run.best && same(p, run.best) ? 8 : 4.5}
                  fill={run.best && same(p, run.best) ? '#ff3456' : Math.abs(p.y) < 1e-9 ? '#081b48' : '#087dff'}
                  stroke="#fff"
                  strokeWidth={run.best && same(p, run.best) ? 2 : 0}
                />
              </g>
            ))}
        {!mini && run.best && !run.vertices.some((p) => same(p, run.best!)) && (
          <g
            role="button"
            tabIndex={0}
            aria-label={tr('Inspect optimal point')}
            onClick={() => onPoint(run.best!)}
            onKeyDown={(e) => keyboard(e, () => onPoint(run.best!))}
          >
            <circle cx={x(run.best.x)} cy={y(run.best.y)} r="11" fill="transparent" />
            <circle cx={x(run.best.x)} cy={y(run.best.y)} r="8" fill="#ff3456" stroke="white" strokeWidth="2" />
          </g>
        )}
        {mini && run.best && (
          <g
            role="button"
            tabIndex={0}
            aria-label={tr('Inspect continuous optimum')}
            onClick={() => onPoint(run.best!)}
            onKeyDown={(e) => keyboard(e, () => onPoint(run.best!))}
          >
            <circle cx={x(run.best.x)} cy={y(run.best.y)} r="11" fill="transparent" />
            <circle cx={x(run.best.x)} cy={y(run.best.y)} r="5.5" fill="#006bff" stroke="white" strokeWidth="1.5" />
          </g>
        )}
        {mini && run.integer.best && (
          <g
            role="button"
            tabIndex={0}
            aria-label={tr('Inspect integer optimum')}
            onClick={() => onPoint(run.integer.best!, true)}
            onKeyDown={(e) => keyboard(e, () => onPoint(run.integer.best!, true))}
          >
            <circle cx={x(run.integer.best.x)} cy={y(run.integer.best.y)} r="10" fill="transparent" />
            <circle
              cx={x(run.integer.best.x)}
              cy={y(run.integer.best.y)}
              r={run.best && same(run.best, run.integer.best) ? 8 : 5.5}
              fill={run.best && same(run.best, run.integer.best) ? 'none' : '#0bbb7d'}
              stroke={run.best && same(run.best, run.integer.best) ? '#0bbb7d' : 'white'}
              strokeWidth="2"
            />
          </g>
        )}
        {!mini && active && <circle className="lp-active-point" cx={x(active.x)} cy={y(active.y)} r="11" />}
      </g>
      {!mini &&
        run.vertices.map((p, i) => (
          <text className="lp-point-label" key={i} x={x(p.x) + 10} y={y(p.y) + (run.best && same(p, run.best) ? 5 : Math.abs(p.x) < 1e-9 && p.y > 0 ? 15 : -9)}>
            {point(p)}
          </text>
        ))}
      {!mini &&
        run.input.constraints.map((c, i) => {
          if ((c.a === 0) === (c.b === 0)) return null
          const vertical = c.b === 0,
            value = c.rhs / (vertical ? c.a : c.b),
            relation = (vertical ? c.a : c.b) < 0 ? (c.op === '<=' ? '>=' : c.op === '>=' ? '<=' : '=') : c.op,
            label = `${vertical ? 'x' : 'y'} ${op(relation)} ${num(value)}`,
            labelWidth = Math.max(49, label.length * 6.5 + 14),
            px = vertical ? x(value) + 8 : left + width * 0.53,
            py = vertical ? (value === 0 ? bottom - height + 31 : bottom - height + 10) : y(value) - 35
          if (px < left || px > left + width - 55 || py < 0 || py > bottom) return null
          return (
            <g key={i} className="lp-bound-label">
              <rect x={px} y={py} width={labelWidth} height="28" rx="4" fill={`${palette[i % 8]}16`} stroke={`${palette[i % 8]}55`} />
              <text x={px + 8} y={py + 18} fill={palette[i % 8]}>
                {label}
              </text>
            </g>
          )
        })}
      {!mini &&
        contours &&
        (objective.a !== 0 || objective.b !== 0) &&
        levels.map((level, i) => {
          const line = clipLPLine(objective.a, objective.b, level, view),
            px = left + width - 148,
            py = bottom - 43 - i * 40
          return (
            <g key={i} className="lp-contour-label">
              {line.length === 2 && (
                <path
                  d={`M${px},${py + 13} L${x(line[0].x) * 0.25 + x(line[1].x) * 0.75},${y(line[0].y) * 0.25 + y(line[1].y) * 0.75}`}
                  stroke="#ff5d76"
                  strokeWidth=".7"
                  strokeDasharray="3 3"
                  fill="none"
                />
              )}
              <rect x={px} y={py} width="104" height="28" rx="5" />
              <text x={px + 9} y={py + 19}>{`${formatLPExpression(objective)} = ${num(level)}`}</text>
            </g>
          )
        })}
      {!mini && run.best && callout && (
        <g className="lp-optimal-callout">
          <path d={`M${callout.x},${callout.y + 32} L${x(run.best.x) + 10},${y(run.best.y) - 5}`} stroke="#ff3456" strokeWidth="1.1" />
          <rect x={callout.x} y={callout.y} width="124" height="52" rx="7" />
          <text x={callout.x + 15} y={callout.y + 21}>
            {tr('Optimal:')} {point(run.best)}
          </text>
          <text x={callout.x + 15} y={callout.y + 41}>
            {'z = '}
            {num(run.value!)}
          </text>
        </g>
      )}
      {mini && run.best && (
        <text className="lp-mini-point-label" x={x(run.best.x) + 10} y={y(run.best.y) - 8} fill="#004ad2">
          {point(run.best)}
        </text>
      )}
      {mini && run.integer.best && (!run.best || !same(run.best, run.integer.best)) && (
        <text className="lp-mini-point-label" x={x(run.integer.best.x) + 9} y={y(run.integer.best.y) + 16} fill="#008453">
          {point(run.integer.best)}
        </text>
      )}
    </svg>
  )
}
export function LinearProgrammingMockupLesson(props: MockupPageProps) {
  useLocaleRender()
  const navigate = useNavigate(),
    [tab, setTab] = useState<MockupTab>('Visualization'),
    [run, setRun] = useState(example),
    [sense, setSense] = useState<LPInput['sense']>('max'),
    [objective, setObjective] = useState(formatLPExpression(lpExample.objective)),
    [rows, setRows] = useState(rowsOf(lpExample)),
    [region, setRegion] = useState(true),
    [contours, setContours] = useState(true),
    [animate, setAnimate] = useState(true),
    [playing, setPlaying] = useState(false),
    [cursor, setCursor] = useState(3),
    [speed, setSpeed] = useState(700),
    [zoom, setZoom] = useState(1),
    [allIntersections, setAllIntersections] = useState(false),
    [error, setError] = useState(''),
    [query, setQuery] = useState(''),
    [prediction, setPrediction] = useState(''),
    [feedback, setFeedback] = useState(''),
    [modal, setModal] = useState<{
      type: 'point' | 'constraint' | 'certificate' | 'integer' | 'application'
      index: number
      p?: LPPoint
      integer?: boolean
    } | null>(null),
    [notes, setNotes] = usePersistentState('algodrishti-linear-programming-notes', '', persistentString),
    [localTheme, setLocalTheme] = useState(() => localStorage.getItem('algodrishti-theme') ?? 'light'),
    dialog = useRef<HTMLDialogElement>(null),
    search = useRef<HTMLInputElement>(null)
  const theme = props.theme ?? localTheme,
    data = allIntersections ? run.allIntersections : run.vertices,
    active = data[cursor] ?? null,
    complete = !playing && cursor >= data.length - 1,
    expression = formatLPExpression(run.input.objective),
    text = query.trim().toLowerCase(),
    score = (s: string) => (s.toLowerCase() === text ? 0 : s.toLowerCase().includes(text) ? 1 : 2),
    topics = text
      ? allModules
          .filter((m) => `${m.name} ${m.summary}`.toLowerCase().includes(text))
          .sort((a, b) => score(a.name) - score(b.name))
          .slice(0, 5)
      : [],
    pending = sense !== run.input.sense || objective !== formatLPExpression(run.input.objective) || JSON.stringify(rows) !== JSON.stringify(rowsOf(run.input)),
    editedConstraint = modal?.type === 'constraint' ? run.input.constraints[modal.index] : null
  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])
  useEffect(() => {
    if (modal) dialog.current?.showModal()
    else dialog.current?.close()
  }, [modal])
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        search.current?.focus()
      }
    }
    window.addEventListener('keydown', key)
    return () => window.removeEventListener('keydown', key)
  }, [])
  useEffect(() => {
    const media = window.matchMedia('(min-width:1500px)'),
      show = () => {
        if (media.matches) {
          const nav = document.querySelector<HTMLElement>('.app-shell .global-sidebar .sidebar-navigation')
          if (nav) nav.scrollTop = 0
        }
      }
    show()
    media.addEventListener('change', show)
    return () => media.removeEventListener('change', show)
  }, [])
  useEffect(() => {
    if (!playing) return
    const timer = window.setInterval(
      () =>
        setCursor((c) => {
          if (c >= data.length - 2) {
            setPlaying(false)
            return Math.max(0, data.length - 1)
          }
          return c + 1
        }),
      speed,
    )
    return () => window.clearInterval(timer)
  }, [playing, data, speed])
  function changeTab(next: MockupTab) {
    setPlaying(false)
    setTab(next)
  }
  function load(input: LPInput, play = false) {
    const next = runLPLesson(input)
    setRun(next)
    setSense(input.sense)
    setObjective(formatLPExpression(input.objective))
    setRows(rowsOf(input))
    setCursor(play ? 0 : Math.max(0, next.vertices.length - 1))
    setPlaying(play && next.vertices.length > 1)
    setAllIntersections(false)
    setError('')
    setZoom(1)
    setModal(null)
  }
  function solve() {
    try {
      load(parseLPInput(sense, objective, rows), animate)
    } catch (e) {
      setError((e as Error).message)
      setPlaying(false)
    }
  }
  function reset() {
    load(lpExample)
    setRegion(true)
    setContours(true)
    setAnimate(true)
  }
  function editRow(index: number, patch: Partial<(typeof rows)[number]>) {
    setRows((r) => r.map((row, i) => (i === index ? { ...row, ...patch } : row)))
    setPlaying(false)
    setError('')
  }
  function inspect(type: NonNullable<typeof modal>['type'], index = 0, p?: LPPoint, integer = false) {
    setPlaying(false)
    setModal({ type, index, p, integer })
  }
  function seek(i: number) {
    setCursor(i)
    setPlaying(false)
  }
  const applications = [
      'Resource allocation (production planning, workforce planning)',
      'Scheduling and logistics',
      'Network flow formulations',
      'Portfolio optimization and finance',
    ],
    applicationDetails = [
      'Choose production quantities to maximize total contribution while respecting resource and staffing limits. The coefficients and limits must match the real decision model.',
      'Choose feasible schedules or shipment quantities under capacity, balance and demand constraints. A linear objective can minimize a modeled cost.',
      'Flow-conservation and edge-capacity inequalities define a linear feasible set. A linear objective can maximize throughput or minimize cost.',
      'Linear models can allocate limited resources under specified budget and exposure constraints. This lesson illustrates the modeling structure, not a real investment decision.',
    ],
    code = `// Two variables, at most eight constraints.
normalize every row to a*x + b*y <= rhs
intersections = intersect every pair of nonparallel boundaries
vertices = intersections satisfying every inequality
find a feasible anchor (origin, boundary projection or vertex)
if no feasible anchor: INFEASIBLE
find recession directions d with A*d <= 0
if an improving direction exists: UNBOUNDED
otherwise evaluate the linear objective at feasible candidates
verify a nonnegative combination of active bounds equals the objective
for a bounded region: enumerate its integer bounding box
// Integer grid search is limited to 40,000 candidates.`
  return (
    <div className="mom-page target-visual linear-programming-page" data-target="46">
      <header className="lp-page-header">
        <button className="lp-back" aria-label={tr('Return to randomized analysis')} onClick={() => navigate('/daa-extensions/expected-analysis')}>
          <ArrowLeft size={19} />
        </button>
        <div className="lp-heading">
          <h1>{tr('Linear Programming Introduction')}</h1>
          <p>{tr('Model a linear objective and linear constraints: explore the feasible region, optimal solution, and relaxations.')}</p>
        </div>
        <div className="lp-search">
          <Search size={17} />
          <input
            ref={search}
            aria-label={tr('Search algorithm topics')}
            placeholder={tr('Search topics, algorithms, or keywords...')}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') setQuery('')
              if (e.key === 'Enter' && topics[0]) navigate(algorithmPath(topics[0]))
            }}
          />
          <kbd>{'⌘ K'}</kbd>
          {query && (
            <div className="lp-search-results">
              {topics.length ? (
                topics.map((m) => (
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
        <button className="mom-study" aria-pressed={props.completed.includes(props.module.id)} onClick={() => props.toggleCompleted(props.module.id)}>
          {props.completed.includes(props.module.id) ? <Check size={15} /> : <Bookmark size={15} />}
          <span>{tr(props.completed.includes(props.module.id) ? 'Studied' : 'Mark studied')}</span>
        </button>
        <AccountControl showLanguage={false} />
      </header>
      <MockupTabs active={tab} tabs={tabs} onChange={changeTab} />
      {tab === 'Visualization' && (
        <>
          <section className={`lp-panel lp-main ${pending || error ? 'lp-has-feedback' : ''}`}>
            <header>
              <span className="lp-icon">
                <ChartNoAxesColumnIncreasing />
              </span>
              <div>
                <h2>{tr('2D Linear Programming Visualization')}</h2>
                <p>{tr('Feasible region, constraint lines, objective contours, and optimal solution.')}</p>
              </div>
            </header>
            <div className="lp-main-controls">
              <label>
                <input type="checkbox" checked={region} onChange={(e) => setRegion(e.target.checked)} />
                {tr('Show Feasible Region')}
              </label>
              <label>
                <input type="checkbox" checked={contours} onChange={(e) => setContours(e.target.checked)} />
                {tr('Show Objective Contours')}
              </label>
              <button
                className="lp-animate-toggle"
                role="switch"
                aria-checked={animate}
                onClick={() => {
                  setAnimate(!animate)
                  setPlaying(false)
                }}
              >
                <span />
                {tr('Animate Vertices')}
              </button>
              <button className="lp-primary lp-solve" onClick={solve}>
                {tr('Solve Example')}
                <ArrowRight size={20} />
              </button>
              <button className="lp-reset" onClick={reset}>
                <RotateCw size={18} />
                {tr('Reset')}
              </button>
            </div>
            <div className="lp-main-grid">
              <div className="lp-plot-card">
                <Plot
                  run={run}
                  region={region}
                  contours={contours}
                  zoom={zoom}
                  active={!complete ? active : null}
                  onPoint={(p, integer) => inspect('point', 0, p, integer)}
                  onConstraint={(i) => inspect('constraint', i)}
                />
              </div>
              <Panel title={tr('Linear Program')} icon={<PencilLine />} className="lp-program">
                <button className="lp-reset-example" onClick={reset}>
                  {tr('Reset to example')}
                </button>
                <div className="lp-program-body">
                  <div className="lp-objective-line">
                    <select
                      aria-label={tr('Objective direction')}
                      value={sense}
                      onChange={(e) => {
                        setSense(e.target.value as LPInput['sense'])
                        setPlaying(false)
                      }}
                    >
                      <option value="max">{tr('Maximize')}</option>
                      <option value="min">{tr('Minimize')}</option>
                    </select>
                    <i>{'z = '}</i>
                    <input
                      aria-label={tr('Objective expression')}
                      value={objective}
                      onChange={(e) => {
                        setObjective(e.target.value)
                        setPlaying(false)
                        setError('')
                      }}
                    />
                  </div>
                  <h3>{tr('Subject to:')}</h3>
                  <div className="lp-constraint-list">
                    {rows.map((row, i) => (
                      <div className="lp-constraint-row" key={i}>
                        <input
                          aria-label={`${tr('Constraint')} ${i + 1} ${tr('expression')}`}
                          value={row.expression}
                          onChange={(e) => editRow(i, { expression: e.target.value })}
                        />
                        <select
                          aria-label={`${tr('Constraint')} ${i + 1} ${tr('relation')}`}
                          value={row.op}
                          onChange={(e) => editRow(i, { op: e.target.value as LPConstraint['op'] })}
                        >
                          <option value="<=">{'≤'}</option>
                          <option value=">=">{'≥'}</option>
                          <option value="=">{'='}</option>
                        </select>
                        <input
                          aria-label={`${tr('Constraint')} ${i + 1} ${tr('right-hand side')}`}
                          value={row.rhs}
                          onChange={(e) => editRow(i, { rhs: e.target.value })}
                        />
                        <button
                          className="lp-delete-row"
                          aria-label={`${tr('Remove constraint')} ${i + 1}`}
                          onClick={() => {
                            setRows((r) => r.filter((_, j) => i !== j))
                            setPlaying(false)
                            setError('')
                          }}
                        >
                          <Trash2 size={17} />
                        </button>
                      </div>
                    ))}
                  </div>
                  <button
                    className="lp-add-row"
                    disabled={rows.length >= 8}
                    onClick={() => {
                      setRows((r) => [...r, { expression: 'x + y', op: '<=', rhs: '4' }])
                      setPlaying(false)
                    }}
                  >
                    <Plus size={19} />
                    {tr('Add constraint')}
                  </button>
                </div>
              </Panel>
              <Panel title={tr('Vertex Evaluation (Simplex Idea)')} icon={<Crosshair />} className="lp-evaluation">
                <div className="lp-vertex-table">
                  <table>
                    <thead>
                      <tr>
                        <th>{tr('Vertex (x, y)')}</th>
                        <th>{tr('Feasible')}</th>
                        <th>
                          {'z = '}
                          {expression}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.map((p, i) => (
                        <tr key={i} className={run.best && same(p, run.best) ? 'lp-optimal-row' : cursor === i ? 'lp-current-row' : ''}>
                          <td>
                            <button aria-label={`${tr('Evaluate vertex')} ${point(p)}`} onClick={() => seek(i)}>
                              {point(p)}
                            </button>
                          </td>
                          <td>
                            {playing && i > cursor ? (
                              '·'
                            ) : lpFeasible(run.input, p) ? (
                              <Check size={22} aria-label={tr('Feasible')} />
                            ) : (
                              <X size={20} aria-label={tr('Infeasible')} />
                            )}
                          </td>
                          <td>{playing && i > cursor ? '·' : num(lpValue(run.input, p))}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {!data.length && <p>{tr(run.status === 'infeasible' ? 'No feasible vertices.' : 'No corner vertices in this region.')}</p>}
                </div>
                <button className="lp-optimum-banner" onClick={() => inspect('certificate')}>
                  <Trophy />
                  <span>
                    <b>
                      {tr(
                        run.status === 'infeasible'
                          ? 'Infeasible program'
                          : run.status === 'unbounded'
                            ? 'Unbounded objective'
                            : playing
                              ? 'Evaluating vertex:'
                              : run.vertices.some((p) => run.best && same(p, run.best))
                                ? 'Optimal vertex:'
                                : 'Optimal point:',
                      )}{' '}
                      {run.status === 'optimal' ? point(playing ? active : run.best) : ''}
                    </b>
                    <small>
                      {run.status === 'optimal'
                        ? `${tr(playing ? 'Current value:' : run.input.sense === 'max' ? 'Maximum value:' : 'Minimum value:')} z = ${num(playing && active ? lpValue(run.input, active) : run.value!)}`
                        : tr(run.status === 'infeasible' ? 'No point satisfies all constraints.' : 'A feasible direction improves z without a finite bound.')}
                    </small>
                  </span>
                </button>
              </Panel>
            </div>
            <div className="lp-legend">
              {run.input.constraints.map((c, i) => (
                <button key={i} onClick={() => inspect('constraint', i)}>
                  <i style={{ background: palette[i % 8] }} />
                  {formatLPExpression(c)} {op(c.op)} {num(c.rhs)}
                </button>
              ))}
              <span>
                <i className="lp-region-swatch" />
                {tr('Feasible region')}
              </span>
              <button onClick={() => inspect('certificate')}>
                <i className="lp-optimal-swatch" />
                {tr('Optimal solution')}
              </button>
              <button onClick={() => setContours(!contours)}>
                <i className="lp-contour-swatch" />
                {tr('Objective contours')}
              </button>
            </div>
            {error ? (
              <p role="alert" className="lp-error">
                {tr(error)}
              </p>
            ) : pending ? (
              <p role="status" className="lp-pending">
                {tr('Changes are pending. Choose Solve Example to apply the objective and constraints.')}
              </p>
            ) : null}
          </section>
          <div className="lp-lower-grid">
            <Panel title={tr('Linear Relaxation vs Integer Solution')} icon={<ChartNoAxesColumnIncreasing />} className="lp-relaxation">
              <p>
                {tr(
                  run.input.sense === 'max'
                    ? 'Relaxing integrality enlarges the feasible region. The LP optimum upper-bounds the integer optimum.'
                    : 'Relaxing integrality enlarges the feasible region. The LP optimum lower-bounds the integer optimum for minimization.',
                )}
              </p>
              <table className="lp-relaxation-table">
                <thead>
                  <tr>
                    {['Model', 'Optimal Solution (x, y)', 'Objective Value z', 'Visualization'].map((s) => (
                      <th key={s}>{tr(s)}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <th>{tr('Linear relaxation')}</th>
                    <td>{point(run.best)}</td>
                    <td>{run.value === null ? '—' : num(run.value)}</td>
                    <td>
                      <span className="lp-dot lp-blue" />
                      {tr('Continuous optimum')}
                    </td>
                  </tr>
                  <tr>
                    <th>
                      {tr('Integer solution')}
                      <small>{'(x, y ∈ ℤ)'}</small>
                    </th>
                    <td>{point(run.integer.best)}</td>
                    <td>{run.integer.value === null ? '—' : num(run.integer.value)}</td>
                    <td>
                      <span className="lp-dot lp-green" />
                      {tr(
                        run.integer.status === 'optimal'
                          ? 'Best integer point'
                          : run.integer.status === 'infeasible'
                            ? 'No integer solution'
                            : run.integer.status === 'search-limit'
                              ? 'Grid exceeds search limit'
                              : 'Unbounded region: not enumerated',
                      )}
                    </td>
                  </tr>
                  <tr>
                    <th>{tr('Integrality gap')}</th>
                    <td>{'—'}</td>
                    <td>{run.gap === null ? '—' : num(run.gap)}</td>
                    <td>
                      {run.gap === null
                        ? tr('No finite comparison')
                        : run.input.sense === 'max'
                          ? `LP − Integer = ${num(run.gap)}`
                          : `Integer − LP = ${num(run.gap)}`}
                    </td>
                  </tr>
                </tbody>
              </table>
              <div className="lp-mini-card">
                <h3>{tr('Integer points in feasible region')}</h3>
                <Plot mini run={run} region={region} onPoint={(p, integer) => inspect('point', 0, p, integer)} />
                <div className="lp-mini-legend">
                  <button onClick={() => inspect('certificate')}>
                    <span className="lp-dot lp-blue" />
                    {tr('LP optimum')} {point(run.best)}
                  </button>
                  <button onClick={() => inspect('integer')}>
                    <span className="lp-dot lp-green" />
                    {tr('Best integer')} {point(run.integer.best)}
                  </button>
                  <span>
                    <i className="lp-dot lp-gray" />
                    {tr('Other integer points')}
                  </span>
                </div>
              </div>
            </Panel>
            <aside className="lp-insight-stack">
              <Panel title={tr('Key Takeaways')} icon={<Lightbulb />} className="lp-takeaways">
                <ul>
                  {[
                    'The feasible region is a convex polyhedron (a polygon in 2D).',
                    'A finite optimum of a nonempty bounded region occurs at a vertex.',
                    'Relaxing integrality provides an upper (max) or lower (min) bound.',
                    'This principle motivates branch-and-bound and approximation algorithms.',
                  ].map((s) => (
                    <li key={s}>{tr(s)}</li>
                  ))}
                </ul>
              </Panel>
              <Panel title={tr('Applications')} icon={<Settings />} className="lp-applications">
                <ul>
                  {applications.map((s, i) => (
                    <li key={s}>
                      <button onClick={() => inspect('application', i)}>{tr(s)}</button>
                    </li>
                  ))}
                </ul>
              </Panel>
              <div className="lp-proof-grid">
                <Panel title={tr('Correctness')} icon={<Shield />} className="lp-correctness">
                  <ul>
                    <li>{tr('A bounded feasible region is convex; a linear optimum occurs at a vertex.')}</li>
                    <li>{tr('The active-bound certificate verifies the objective bound at an optimum.')}</li>
                  </ul>
                </Panel>
                <Panel title={tr('Complexity')} icon={<ChartNoAxesColumnIncreasing />} className="lp-complexity">
                  <ul>
                    <li>{tr('This 2D explorer checks O(m²) intersections against m constraints: O(m³).')}</li>
                    <li>{tr('General LP has polynomial-time algorithms; integer programming is NP-hard in variable dimension.')}</li>
                  </ul>
                </Panel>
              </div>
            </aside>
          </div>
        </>
      )}
      {tab === 'Learn' && (
        <div className="lp-learning">
          <Panel title={tr('What makes a program linear?')} icon={<PencilLine />}>
            <p>
              {tr(
                'A linear program optimizes a weighted sum, such as z = 3x + 2y, subject to linear equalities and inequalities. A boundary such as x + y = 4 is a line; x + y ≤ 4 selects a half-plane. The feasible region is their intersection. Nonnegativity is a constraint, not an automatic assumption: removing x ≥ 0 or y ≥ 0 can change the answer.',
              )}
            </p>
            <p>
              {tr(
                'For a nonempty bounded polygon, a linear objective reaches an optimum at a corner. An edge may contain multiple optimal points. An infeasible program has no common feasible point. An unbounded objective has a feasible direction that improves its value without limit. An unbounded region can still have a finite optimal value.',
              )}
            </p>
          </Panel>
          <Panel title={tr('Worked example: the integer optimum is also (2,2)')} icon={<Crosshair />}>
            <p>
              {tr(
                'Maximize 3x + 2y subject to x + y ≤ 4, x ≤ 2, x ≥ 0 and y ≥ 0. The feasible vertices are (0,0), (2,0), (0,4) and (2,2), with values 0, 6, 8 and 10. The maximum is 10 at (2,2). That point is also integer feasible, so the integer maximum is 10 and the integrality gap is 0.',
              )}
            </p>
            <p>
              {tr(
                'A short certificate proves this optimum: multiply x + y ≤ 4 by 2 and x ≤ 2 by 1, then add. This gives 3x + 2y ≤ 10. Since (2,2) attains 10, no feasible point can improve it.',
              )}
            </p>
            <button
              className="lp-primary"
              onClick={() => {
                load(lpExample)
                changeTab('Visualization')
              }}
            >
              {tr('Explore the worked example')}
            </button>
          </Panel>
          <Panel title={tr('A genuine fractional relaxation gap')} icon={<ChartNoAxesColumnIncreasing />}>
            <p>
              {tr(
                'Change the first bound to x + y ≤ 3.5. The continuous maximum is 9 at (2,1.5), while the best integer point is (2,1), with value 8. The additive gap is 1. Relaxation gives an upper bound for maximization and a lower bound for minimization.',
              )}
            </p>
            <p>
              {tr(
                'This explorer supports up to eight constraints with coefficients between −20 and 20, right-hand sides between −100 and 100, and at most two decimal places. Integer optimization is exhaustive only for a bounded region whose integer bounding box has at most 40,000 candidates. Other cases are reported explicitly rather than claiming an integer optimum.',
              )}
            </p>
            <button
              onClick={() => {
                load(lpFractionalExample)
                changeTab('Visualization')
              }}
            >
              {tr('Try a fractional optimum')}
            </button>
          </Panel>
        </div>
      )}
      {tab === 'Code' && (
        <Panel title={tr('Two-dimensional LP and integer enumeration')} icon={<FileText />} className="lp-code">
          <pre>
            <code>{code}</code>
          </pre>
          <p>
            {tr(
              'The plot is clipped to a viewport; clipping never creates a solver vertex or an optimization bound. Infeasible intersections are discarded for the LP optimum. Recession directions distinguish a finite objective from an unbounded one.',
            )}
          </p>
          <button onClick={() => inspect('certificate')}>{tr('Inspect the active-bound certificate')}</button>
        </Panel>
      )}
      {tab === 'Practice' && (
        <Panel title={tr('Predict the integrality gap')} icon={<Lightbulb />} className="lp-practice">
          <p>{tr('For the default constraints, the LP optimum is (2,2) with value 10. What is the best integer objective value?')}</p>
          <div>
            {['8', '9', '10'].map((answer) => (
              <button
                key={answer}
                aria-pressed={prediction === answer}
                onClick={() => {
                  setPrediction(answer)
                  setFeedback('')
                }}
              >
                {answer}
              </button>
            ))}
          </div>
          <button
            className="lp-primary"
            onClick={() =>
              setFeedback(
                !prediction
                  ? tr('Choose a prediction first.')
                  : prediction === '10'
                    ? tr(
                        'Correct. The LP optimum (2,2) has integer coordinates and satisfies every constraint. Integer value 10 is attainable, so the gap is 0.',
                      )
                    : tr('Try again. Check whether (2,2) itself is integer feasible before discarding it.'),
              )
            }
          >
            {tr('Check prediction')}
          </button>
          <p role="status">{feedback}</p>
          <button
            onClick={() => {
              load(lpExample)
              changeTab('Visualization')
            }}
          >
            {tr('Verify on the plot')}
          </button>
        </Panel>
      )}
      {tab === 'Experiments' && (
        <div className="lp-experiments">
          <Panel title={tr('Constraint laboratory')} icon={<Settings />}>
            <div className="lp-presets">
              {[
                [tr('Default example'), lpExample],
                [tr('Fractional gap'), lpFractionalExample],
                [tr('Alternate optima'), { ...lpExample, objective: { a: 1, b: 1 } }],
                [
                  tr('Negative coordinates'),
                  {
                    ...lpExample,
                    constraints: [
                      { a: -1, b: 0, op: '<=', rhs: 3 },
                      { a: 1, b: 0, op: '<=', rhs: 2 },
                      { a: 0, b: -1, op: '<=', rhs: 2 },
                      { a: 0, b: 1, op: '<=', rhs: 4 },
                    ],
                  },
                ],
                [
                  tr('Infeasible'),
                  {
                    ...lpExample,
                    constraints: [
                      { a: 1, b: 0, op: '>=', rhs: 2 },
                      { a: 1, b: 0, op: '<=', rhs: 1 },
                    ],
                  },
                ],
                [tr('Unbounded objective'), { ...lpExample, constraints: lpExample.constraints.slice(2) }],
                [tr('Bounded objective, unbounded region'), { sense: 'max', objective: { a: 1, b: 0 }, constraints: [{ a: 1, b: 0, op: '<=', rhs: 4 }] }],
                [
                  tr('No integer point'),
                  {
                    sense: 'max',
                    objective: { a: 1, b: 1 },
                    constraints: [
                      { a: 1, b: 0, op: '=', rhs: 0.5 },
                      { a: 0, b: 1, op: '=', rhs: 0.5 },
                    ],
                  },
                ],
                [
                  tr('Large integer search'),
                  {
                    sense: 'max',
                    objective: { a: 1, b: 1 },
                    constraints: [{ a: 0.01, b: 0, op: '<=', rhs: 100 }, { a: 0, b: 0.01, op: '<=', rhs: 100 }, ...lpExample.constraints.slice(2)],
                  },
                ],
              ].map(([label, input]) => (
                <button
                  key={String(label)}
                  onClick={() => {
                    load(input as LPInput)
                    changeTab('Visualization')
                  }}
                >
                  {String(label)}
                </button>
              ))}
            </div>
            <label>
              {tr('Evaluation speed')}
              <select
                aria-label={tr('Vertex evaluation speed')}
                value={speed}
                onChange={(e) => {
                  setSpeed(Number(e.target.value))
                  setPlaying(false)
                }}
              >
                <option value="1200">{tr('Slow')}</option>
                <option value="700">{tr('Normal')}</option>
                <option value="200">{tr('Fast')}</option>
              </select>
            </label>
            <label>
              {tr('Plot zoom')}
              <input aria-label={tr('Plot zoom')} type="range" min="0.5" max="2" step="0.1" value={zoom} onChange={(e) => setZoom(Number(e.target.value))} />
            </label>
            <label>
              <input
                type="checkbox"
                checked={allIntersections}
                onChange={(e) => {
                  setAllIntersections(e.target.checked)
                  seek(0)
                }}
              />
              {tr('Include infeasible intersections')}
            </label>
            <button onClick={() => changeTab('Visualization')}>{tr('Inspect the current plot')}</button>
          </Panel>
          <Panel title={tr('Notes & preferences')} icon={<FileText />}>
            <p>
              {tr(
                'Every feasible point is checked against every original constraint. A clipped drawing or a finite grid sample is not proof of boundedness or integer optimality.',
              )}
            </p>
            <button onClick={() => inspect('integer')}>{tr('Inspect integer enumeration')}</button>
            <LanguageSelector />
            <button onClick={() => (props.onToggleTheme ? props.onToggleTheme() : setLocalTheme(theme === 'dark' ? 'light' : 'dark'))}>
              {tr('Toggle color theme')}
            </button>
          </Panel>
        </div>
      )}
      {tab === 'Notes' && (
        <Panel title={tr('Your linear-programming notes')} icon={<FileText />} className="lp-notes">
          <p>{tr('Record a binding constraint, a corner calculation or an integrality-gap explanation. Your notes are saved in this browser.')}</p>
          <textarea aria-label={tr('Your linear-programming notes')} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </Panel>
      )}
      <dialog
        ref={dialog}
        className="lp-dialog"
        onCancel={() => setModal(null)}
        onClick={(e) => {
          if (e.target === dialog.current) setModal(null)
        }}
      >
        <button className="lp-close" aria-label={tr('Close LP inspector')} onClick={() => setModal(null)}>
          <X />
        </button>
        {modal?.type === 'point' && modal.p && (
          <>
            <h2>
              {tr(modal.integer ? 'Integer-point certificate' : 'Point feasibility certificate')} {point(modal.p)}
            </h2>
            <p>
              {tr('Objective value:')} {num(lpValue(run.input, modal.p))}
              {' · '}
              {tr(lpFeasible(run.input, modal.p) ? 'Feasible' : 'Infeasible')}
            </p>
            <ul>
              {run.input.constraints.map((c, i) => {
                const lhs = c.a * modal.p!.x + c.b * modal.p!.y,
                  feasible = lpFeasible({ ...run.input, constraints: [c] }, modal.p!)
                return (
                  <li key={i}>
                    {formatLPExpression(c)}
                    {' = '}
                    {num(lhs)} {op(c.op)} {num(c.rhs)} {feasible ? '✓' : '✕'}
                  </li>
                )
              })}
            </ul>
          </>
        )}
        {editedConstraint && (
          <>
            <h2>
              {tr('Constraint')} {modal!.index + 1}
            </h2>
            <p>
              {formatLPExpression(editedConstraint)} {op(editedConstraint.op)} {num(editedConstraint.rhs)}
            </p>
            <p>
              {tr(
                'The equality boundary is drawn as a line; the inequality selects its feasible side. All constraints are intersected, so a point must satisfy every row.',
              )}
            </p>
            <p>
              {run.best
                ? `${tr('Slack at the optimum:')} ${num(editedConstraint.op === '>=' ? editedConstraint.a * run.best.x + editedConstraint.b * run.best.y - editedConstraint.rhs : editedConstraint.rhs - editedConstraint.a * run.best.x - editedConstraint.b * run.best.y)}`
                : tr('There is no finite optimal point for this program.')}
            </p>
          </>
        )}
        {modal?.type === 'certificate' && (
          <>
            <h2>{tr('Linear-program certificate')}</h2>
            <p>
              {tr('Status:')} {tr(run.status)}
              {' · '}
              {tr('Point:')} {point(run.best)}
              {' · z = '}
              {run.value === null ? '—' : num(run.value)}
            </p>
            {run.status === 'optimal' && (
              <>
                <p>{tr('Active-bound certificate:')}</p>
                {run.dual?.map((h, i) => (
                  <p key={i}>
                    {num(h.weight)}
                    {' × ('}
                    {formatLPExpression(h)}
                    {' ≤ '}
                    {num(h.c)}
                    {')'}
                  </p>
                ))}
                <p>
                  {tr('Weighted bound:')} {run.dual ? num(run.dual.reduce((a, h) => a + h.weight * h.c, 0)) : '—'}
                  {' · '}
                  {tr('Objective reached:')} {num((run.input.sense === 'max' ? 1 : -1) * run.value!)}
                </p>
                <p>
                  {tr(
                    run.dual !== null
                      ? 'All multipliers are nonnegative. Adding valid inequalities gives a bound that the displayed feasible point reaches. Minimization uses the negated objective.'
                      : 'A numerical active-bound certificate is unavailable for these coefficients. Inspect the constraints and consider rescaling them.',
                  )}
                </p>
                {run.optimalVertices.length > 1 && <p>{tr('Multiple optimal vertices lie on the same optimal edge.')}</p>}
              </>
            )}
            {run.status === 'unbounded' && (
              <>
                <p>
                  {tr('Feasible anchor:')} {point(run.anchor)}
                  {' · '}
                  {tr('Improving direction:')} {point(run.improvingRay)}
                </p>
                <p>{tr('Moving any nonnegative distance along this ray preserves all inequalities and improves the objective.')}</p>
              </>
            )}
            {run.status === 'infeasible' && <p>{tr('No feasible anchor or boundary intersection satisfies every constraint. The feasible set is empty.')}</p>}
          </>
        )}
        {modal?.type === 'integer' && (
          <>
            <h2>{tr('Integer-enumeration certificate')}</h2>
            <p>
              {tr('Status:')}{' '}
              {tr(
                run.integer.status === 'optimal'
                  ? 'Optimal integer solution'
                  : run.integer.status === 'infeasible'
                    ? 'No feasible integer point'
                    : run.integer.status === 'search-limit'
                      ? 'Grid exceeds the 40,000-candidate search limit'
                      : 'Region is unbounded; integer enumeration is not performed',
              )}
              {' · '}
              {tr('Grid candidates:')} {run.integer.gridSize}
              {' · '}
              {tr('Feasible integer points:')}{' '}
              {run.integer.status === 'optimal' || run.integer.status === 'infeasible' ? run.integer.points.length : tr('Not enumerated')}
            </p>
            <p>
              {tr('Best integer point:')} {point(run.integer.best)}
              {' · z = '}
              {run.integer.value === null ? '—' : num(run.integer.value)}
              {' · '}
              {tr('Additive integrality gap:')} {run.gap === null ? '—' : num(run.gap)}
            </p>
            <p>
              {tr(
                'At most 250 integer markers are sampled for readability; the reported integer optimum uses every candidate in the enumerated bounded grid. Unbounded regions and grids larger than 40,000 are explicitly not enumerated.',
              )}
            </p>
          </>
        )}
        {modal?.type === 'application' && (
          <>
            <h2>{tr(applications[modal.index])}</h2>
            <p>{tr(applicationDetails[modal.index])}</p>
          </>
        )}
      </dialog>
    </div>
  )
}
