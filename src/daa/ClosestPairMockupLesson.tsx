// @localized-render
import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  BarChart3,
  Bookmark,
  BookOpen,
  Check,
  CheckCircle2,
  Code2,
  Info,
  Lightbulb,
  Moon,
  Network,
  Pause,
  Play,
  RotateCcw,
  Settings,
  SkipForward,
  Sun,
  Table2,
  Trophy,
  X,
} from 'lucide-react'
import { AccountControl } from '../account/AccountControl'
import { LanguageSelector } from '../i18n/LanguageSelector'
import { tx, useLocaleRender } from '../i18n/render'
import { persistentString, usePersistentState } from '../hooks/usePersistentState'
import { MockupTabs, type MockupPageProps, type MockupTab } from './MockupLessonChrome'
import {
  closestExample,
  parseClosestPoints,
  pointDistance,
  runClosestLesson,
  type ClosestFrame,
  type ClosestNode,
  type ClosestPoint,
  type ClosestRun,
} from './closestPairLessonModel'
import './closest-pair-mockup.css'
const tr = (s: string) => tx(s, 'studios'),
  tabs: MockupTab[] = ['Learn', 'Visualization', 'Code', 'Practice', 'Experiments'],
  d = (n: number) => (Number.isFinite(n) ? n.toFixed(2) : '∞'),
  coord = (n: number) => Number(n.toPrecision(7)).toString(),
  xy = (p: ClosestPoint) => `(${coord(p.x)}, ${coord(p.y)})`
function Panel({ title, icon, children, className = '' }: { title: string; icon: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`cp-panel ${className}`}>
      <header>
        <span className="cp-icon">{icon}</span>
        <h2>{title}</h2>
      </header>
      {children}
    </section>
  )
}
function PointPlot({
  run,
  node,
  frame,
  strip,
  highlight,
  onPoint,
}: {
  run: ClosestRun
  node: ClosestNode
  frame: ClosestFrame
  strip: boolean
  highlight: boolean
  onPoint: (p: ClosestPoint) => void
}) {
  const id = useId(),
    xmin = Math.min(0, ...run.points.map((p) => p.x)),
    xmax = Math.max(100, ...run.points.map((p) => p.x)),
    ymin = Math.min(0, ...run.points.map((p) => p.y)),
    ymax = Math.max(100, ...run.points.map((p) => p.y)),
    x = (v: number) => 54 + ((v - xmin) / (xmax - xmin)) * 760,
    y = (v: number) => 326 - ((v - ymin) / (ymax - ymin)) * 282,
    radius = frame.delta,
    low = Math.max(xmin, node.middle - radius),
    high = Math.min(xmax, node.middle + radius),
    divider = x(node.middle),
    pair = frame.pair,
    labelX = pair ? Math.max(55, Math.min(752, (x(pair.a.x) + x(pair.b.x)) / 2 + 46)) : 0,
    labelY = pair ? Math.max(55, Math.min(263, (y(pair.a.y) + y(pair.b.y)) / 2 - 43)) : 0
  return (
    <div className="cp-plot-scroll" role="region" tabIndex={0} aria-label={tr('Scrollable closest-pair coordinate plot')}>
      <svg
        className="cp-plot"
        viewBox="0 0 857 358"
        preserveAspectRatio="none"
        aria-label={tr('Points, recursive divide line, midpoint strip and nearest pair')}
      >
        <defs>
          <clipPath id={`${id}-clip`}>
            <rect x="54" y="44" width="760" height="282" />
          </clipPath>
          <linearGradient id={`${id}-strip`}>
            <stop stopColor="#edf6ff" />
            <stop offset=".5" stopColor="#d4eaff" />
            <stop offset="1" stopColor="#edf6ff" />
          </linearGradient>
          <radialGradient id={`${id}-glow`}>
            <stop stopColor="#ff4762" stopOpacity=".5" />
            <stop offset="1" stopColor="#ff4762" stopOpacity="0" />
          </radialGradient>
        </defs>
        <g className="cp-grid">
          {Array.from({ length: 11 }, (_, i) => (
            <g key={i}>
              <path d={`M${54 + i * 76} 44V326M54 ${44 + i * 28.2}H814`} />
              <text x={54 + i * 76} y="347" textAnchor="middle">
                {coord(xmin + ((xmax - xmin) * i) / 10)}
              </text>
              <text x="38" y={48 + i * 28.2} textAnchor="end">
                {coord(ymax - ((ymax - ymin) * i) / 10)}
              </text>
            </g>
          ))}
        </g>
        <path className="cp-axes" d="M54 44V326H814" />
        {node.left && (
          <>
            <g clipPath={`url(#${id}-clip)`}>
              {strip && Number.isFinite(radius) && (
                <g className="cp-strip-band">
                  <rect x={x(low)} y="44" width={Math.max(0, x(high) - x(low))} height="282" fill={`url(#${id}-strip)`} />
                  <path d={`M${x(low)} 44V326M${x(high)} 44V326`} />
                </g>
              )}
              <path className="cp-divide-line" d={`M${divider} 38V326`} />
            </g>
            <g className="cp-divide-label" transform={`translate(${Math.max(55, Math.min(720, divider - 48))},0)`}>
              <rect width="96" height="35" rx="5" />
              <text x="48" y="14" textAnchor="middle">
                {tr('Divide line')}
              </text>
              <text x="48" y="31" textAnchor="middle">{`x = ${coord(node.middle)}`}</text>
            </g>
            {strip && Number.isFinite(radius) && (
              <g className="cp-strip-label" transform={`translate(${Math.min(680, x(high) + 30)},0)`}>
                <rect width="122" height="43" rx="6" />
                <text x="61" y="15" textAnchor="middle">
                  {tr('Strip (width 2δ)')}
                </text>
                <text x="61" y="33" textAnchor="middle">{`x ∈ [${coord(Number(low.toFixed(2)))}, ${coord(Number(high.toFixed(2)))}]`}</text>
              </g>
            )}
          </>
        )}
        {highlight && pair && (
          <g className="cp-pair-line">
            <path d={`M${x(pair.a.x)} ${y(pair.a.y)}L${x(pair.b.x)} ${y(pair.b.y)}`} />
          </g>
        )}
        {run.points.map((p) => {
          const best = highlight && pair && (pair.a.id === p.id || pair.b.id === p.id),
            compared = frame.compared && (frame.compared.a.id === p.id || frame.compared.b.id === p.id),
            inside = node.points.some((v) => v.id === p.id)
          return (
            <g
              key={p.id}
              className={`cp-point ${best ? 'cp-nearest-point' : ''} ${compared ? 'cp-compared-point' : ''} ${inside ? '' : 'cp-outside-point'}`}
              data-point-id={p.id}
              role="button"
              tabIndex={0}
              aria-label={tr(`Inspect point ${p.id}: ${xy(p)}`)}
              onClick={() => onPoint(p)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  onPoint(p)
                }
              }}
            >
              <rect x={x(p.x) - 10} y={y(p.y) - 10} width="20" height="20" fill="transparent" />
              {best && <circle cx={x(p.x)} cy={y(p.y)} r="15" fill={`url(#${id}-glow)`} />}
              <circle className="cp-dot" cx={x(p.x)} cy={y(p.y)} r={best ? 5.2 : 3.7} />
            </g>
          )
        })}
        {highlight && pair && (
          <g className="cp-distance-label" transform={`translate(${labelX},${labelY})`}>
            <rect width="95" height="51" rx="8" />
            <text x="47.5" y="20" textAnchor="middle">
              {tr('Closest pair')}
            </text>
            <text x="47.5" y="40" textAnchor="middle">{`d = ${d(pair.distance)}`}</text>
          </g>
        )}
      </svg>
    </div>
  )
}
function SplitTree({ run, selected, onSelect }: { run: ClosestRun; selected: string; onSelect: (n: ClosestNode) => void }) {
  const id = useId(),
    items = [
      { node: run.root, x: 195, y: 6, w: 118, h: 40, label: 'P' },
      ...(run.root.left
        ? [
            { node: run.root.left, x: 103, y: 76, w: 108, h: 57, label: 'Q' },
            { node: run.root.right!, x: 287, y: 76, w: 108, h: 57, label: 'R' },
          ]
        : []),
      ...[run.root.left?.left, run.root.left?.right, run.root.right?.left, run.root.right?.right].flatMap((n, i) =>
        n ? [{ node: n, x: [52, 144, 244, 336][i], y: 160, w: 80, h: 44, label: ['Q₁', 'Q₂', 'R₁', 'R₂'][i] }] : [],
      ),
    ]
  return (
    <svg className="cp-tree" viewBox="0 0 390 215" aria-label={tr('Recursive split tree with actual point counts')}>
      <title>{tr('Tree labels preview completed subproblem distances. Select a node to inspect its execution.')}</title>
      <defs>
        <marker id={`${id}-arrow`} markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <path d="M0 0L6 3L0 6Z" fill="#0875ff" />
        </marker>
      </defs>
      {items.flatMap((parent) =>
        items
          .filter((child) => child.node.id.slice(0, -1) === parent.node.id)
          .map((child) => (
            <path
              key={child.node.id}
              d={`M${parent.x + (child.x < parent.x ? -24 : 24)} ${parent.y + parent.h}L${child.x} ${child.y - 2}`}
              fill="none"
              stroke="#0875ff"
              strokeWidth="1.5"
              markerEnd={`url(#${id}-arrow)`}
            />
          )),
      )}
      {items.map(({ node, x, y, w, h, label }) => (
        <g
          key={node.id}
          role="button"
          tabIndex={0}
          aria-label={tr(`Inspect closest-pair subproblem ${node.id}`)}
          className={`cp-tree-node ${node.id === selected ? 'cp-tree-selected' : ''} ${node.id === 'PR' ? 'cp-tree-right' : ''}`}
          onClick={() => onSelect(node)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              onSelect(node)
            }
          }}
        >
          <rect x={x - w / 2} y={y} width={w} height={h} rx="8" />
          <text x={x} y={y + (h === 57 ? 23 : 27)} textAnchor="middle">{`${label} (${node.points.length})`}</text>
          {h === 57 && <text x={x} y={y + 44} textAnchor="middle">{`δ = ${node.pair ? d(node.pair.distance) : '—'}`}</text>}
        </g>
      ))}
    </svg>
  )
}
export function ClosestPairMockupLesson(props: MockupPageProps) {
  useLocaleRender()
  const navigate = useNavigate(),
    [tab, setTab] = useState<MockupTab>('Visualization'),
    [data, setData] = useState<[number, number][]>(closestExample)
  const run = useMemo(() => runClosestLesson(data), [data])
  const [cursor, setCursor] = useState(() => runClosestLesson(closestExample).defaultCursor),
    [strip, setStrip] = useState(true),
    [highlight, setHighlight] = useState(true),
    [example, setExample] = useState('default'),
    [playing, setPlaying] = useState(false),
    [speed, setSpeed] = useState(700),
    [preview, setPreview] = useState(true),
    [modal, setModal] = useState<'edit' | 'point' | 'check' | 'result' | null>(null),
    [draft, setDraft] = useState(''),
    [error, setError] = useState(''),
    [pointId, setPointId] = useState(0),
    [pointX, setPointX] = useState(''),
    [pointY, setPointY] = useState(''),
    [compareId, setCompareId] = useState<number | null>(null),
    [selectedCheck, setSelectedCheck] = useState(0),
    [prediction, setPrediction] = useState(''),
    [feedback, setFeedback] = useState(''),
    [localTheme, setLocalTheme] = useState(() => localStorage.getItem('algodrishti-theme') ?? 'light'),
    dialog = useRef<HTMLDialogElement>(null),
    editor = useRef<HTMLTextAreaElement>(null)
  const [notes, setNotes] = usePersistentState('algodrishti-closest-pair-notes', '', persistentString),
    frame = run.frames[cursor],
    node = run.nodes.find((n) => n.id === frame.node) ?? run.root,
    pair = frame.pair,
    rows = run.checks[node.id],
    currentPoint = run.points[pointId],
    other = compareId === null ? null : run.points[compareId],
    check = rows[selectedCheck],
    theme = props.theme ?? localTheme,
    studied = props.completed.includes(props.module.id)
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
    const timer = window.setTimeout(() => {
      if (cursor >= run.frames.length - 1) {
        setPlaying(false)
        return
      }
      setCursor(cursor + 1)
      if (cursor + 1 === run.frames.length - 1) setPlaying(false)
    }, speed)
    return () => window.clearTimeout(timer)
  }, [playing, cursor, run.frames.length, speed])
  function load(next: [number, number][], id = 'custom') {
    const r = runClosestLesson(next)
    setData(next.map((p) => [...p] as [number, number]))
    setCursor(r.defaultCursor)
    setPlaying(false)
    setPreview(true)
    setExample(id)
    setError('')
    setFeedback('')
    setCompareId(null)
  }
  function openEditor() {
    setDraft(JSON.stringify(data, null, 2))
    setError('')
    setPlaying(false)
    setModal('edit')
  }
  function selectExample(id: string) {
    if (id === 'custom') {
      openEditor()
      return
    }
    load(
      id === 'cross'
        ? [
            [0, 0],
            [2, 100],
            [4, 0],
            [5, 0],
            [7, 100],
            [9, 0],
          ]
        : id === 'duplicates'
          ? [
              [20, 30],
              [20, 30],
              [80, 80],
              [50, 10],
            ]
          : id === 'line'
            ? [
                [10, 40],
                [25, 40],
                [43, 40],
                [48, 40],
                [70, 40],
                [95, 40],
              ]
            : id === 'singleton'
              ? [[50, 50]]
              : closestExample,
      id,
    )
  }
  function inspectPoint(p: ClosestPoint) {
    setPointId(p.id)
    setPointX(String(p.x))
    setPointY(String(p.y))
    setError('')
    setPlaying(false)
    setModal('point')
  }
  function inspectNode(n: ClosestNode) {
    setCursor(run.frames.findIndex((f) => f.node === n.id && (f.stage === 'combine' || f.stage === 'base' || f.stage === 'complete')))
    setPlaying(false)
    setPreview(true)
  }
  function step() {
    setPlaying(false)
    setPreview(false)
    setCursor(cursor === run.frames.length - 1 ? 0 : cursor + 1)
  }
  function generate() {
    load(
      Array.from({ length: data.length }, () => [Math.floor(Math.random() * 99) + 1, Math.floor(Math.random() * 99) + 1]),
      'generated',
    )
  }
  function toggleTheme() {
    if (props.onToggleTheme) props.onToggleTheme()
    else setLocalTheme(theme === 'dark' ? 'light' : 'dark')
  }
  function changeTab(next: MockupTab) {
    setTab(next)
    setPlaying(false)
  }
  return (
    <div className="mom-page target-visual closest-page" data-target="34">
      <header className="cp-topbar">
        <button className="cp-back" aria-label={tr('Back to counting inversions')} onClick={() => navigate('/daa-extensions/counting-inversions')}>
          <ArrowLeft size={19} />
        </button>
        <div className="cp-title-row">
          <h1>{tr('Closest Pair of Points')}</h1>
          <p>{tr('Divide by x, then inspect a y-sorted midpoint strip.')}</p>
        </div>
        <button className="mom-study" aria-pressed={studied} onClick={() => props.toggleCompleted(props.module.id)}>
          {studied ? <Check size={16} /> : <Bookmark size={16} />} {tr(studied ? 'Studied' : 'Mark studied')}
        </button>
        <AccountControl showLanguage={false} />
      </header>
      <MockupTabs active={tab} onChange={changeTab} tabs={tabs} />
      {tab === 'Visualization' ? (
        <>
          <div className="cp-top-grid">
            <section className="cp-visualization">
              <header className="cp-visual-heading">
                <span className="cp-main-icon">
                  <svg viewBox="0 0 28 28" aria-hidden="true">
                    <path d="M6 10L14 20L22 8M14 20L22 19" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                    <path d="M2 10L6 6L10 10L6 14ZM10 20L14 16L18 20L14 24ZM18 8L22 4L26 8L22 12ZM19 19L22 16L25 19L22 22Z" fill="currentColor" />
                  </svg>
                </span>
                <div>
                  <h2>{tr('Interactive Visualization')}</h2>
                  <p>{tr('Visualize the divide and conquer process with the dividing line, midpoint strip and closest pair.')}</p>
                </div>
                <select aria-label={tr('Closest-pair example')} value={example} onChange={(e) => selectExample(e.target.value)}>
                  <option value="default">{tr('Default example')}</option>
                  <option value="cross">{tr('Cross-boundary closest pair')}</option>
                  <option value="line">{tr('Collinear points')}</option>
                  <option value="duplicates">{tr('Duplicate points')}</option>
                  <option value="singleton">{tr('Single point')}</option>
                  <option value="generated" disabled>
                    {tr('Generated points')}
                  </option>
                  <option value="custom">{tr('Custom points…')}</option>
                </select>
              </header>
              <div className="cp-graph-canvas">
                <PointPlot run={run} node={node} frame={frame} strip={strip} highlight={highlight} onPoint={inspectPoint} />
                <div className="cp-legend">
                  {[
                    ['point', 'Point'],
                    ['divide', 'Divide line'],
                    ['band', 'Midpoint strip'],
                    ['nearest', 'Closest pair'],
                    ['distance', 'Distance line'],
                  ].map(([cls, text]) => (
                    <span key={cls}>
                      <i className={`cp-${cls}-key`} />
                      {tr(text)}
                    </span>
                  ))}
                </div>
              </div>
              <div className="cp-controls">
                <button className="cp-primary cp-generate" onClick={generate}>
                  <Play size={17} fill="currentColor" />
                  {tr('Generate points')}
                </button>
                <button className="cp-step" onClick={step} disabled={run.frames.length < 2}>
                  <SkipForward size={18} />
                  {tr('Step divide')}
                </button>
                <button
                  className="cp-reset"
                  onClick={() => {
                    load(closestExample, 'default')
                    setStrip(true)
                    setHighlight(true)
                  }}
                >
                  <RotateCcw size={20} />
                  {tr('Reset')}
                </button>
                <label className="cp-switch">
                  <input type="checkbox" checked={strip} onChange={(e) => setStrip(e.target.checked)} aria-label={tr('Show midpoint strip')} />
                  <i />
                  {tr('Show midpoint strip')}
                </label>
                <label className="cp-switch">
                  <input type="checkbox" checked={highlight} onChange={(e) => setHighlight(e.target.checked)} aria-label={tr('Highlight closest pair')} />
                  <i />
                  {tr('Highlight closest pair')}
                </label>
              </div>
            </section>
            <div className="cp-explanation-column">
              <Panel title={tr('How it works')} icon={<Info />} className="cp-how">
                <ol>
                  {[
                    'Sort points by x-coordinate and divide into two halves at the midpoint.',
                    'Recursively find the closest pair in the left and right halves.',
                    'Build a strip of width 2δ around the midpoint, where δ is the smaller of the two distances.',
                    'Check only necessary points in the strip (in y-sorted order) and return the best pair.',
                  ].map((s, i) => (
                    <li key={s}>
                      <i>{i + 1}</i>
                      <p>{tr(s)}</p>
                    </li>
                  ))}
                </ol>
              </Panel>
              <Panel title={tr('Nearest pair (current)')} icon={<Trophy />} className="cp-nearest">
                <p>
                  <b>{tr('Point 1:')}</b> {pair ? xy(pair.a) : '—'}
                </p>
                <p>
                  <b>{tr('Point 2:')}</b> {pair ? xy(pair.b) : '—'}
                </p>
                <p>
                  <b>{tr('Distance:')}</b> <strong>{pair ? d(pair.distance) : tr('No pair')}</strong>
                </p>
              </Panel>
            </div>
          </div>
          <div className="cp-bottom-grid">
            <Panel title={tr('Recursive split (recursion tree)')} icon={<Network />} className="cp-recursion">
              <SplitTree run={run} selected={node.id} onSelect={inspectNode} />
            </Panel>
            <Panel title={tr('Strip check')} icon={<Table2 />} className="cp-strip-check">
              <p className="cp-strip-heading">{tr('Points in strip (sorted by y-coordinate)')}</p>
              <div className="cp-strip-scroll">
                <table>
                  <thead>
                    <tr>
                      {['Index', 'Point (x, y)', 'Check with', 'Distance'].map((s) => (
                        <th key={s}>{tr(s)}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r, i) => (
                      <tr key={`${r.a.id}:${r.b.id}`} className={r.event === cursor || (preview && i === 0) ? 'cp-current-check' : ''}>
                        <td>
                          <button
                            aria-label={tr(`Inspect strip check ${i}`)}
                            onClick={() => {
                              setSelectedCheck(i)
                              setPlaying(false)
                              setModal('check')
                            }}
                          >
                            {i}
                          </button>
                        </td>
                        <td>{xy(r.a)}</td>
                        <td>{xy(r.b)}</td>
                        <td title={tr(`Euclidean distance: ${d(r.distance)}. Y-gap: ${d(r.gap)}.`)}>
                          {!r.checked ? tr('Skip') : preview || (r.event !== null && r.event <= cursor) ? d(r.distance) : tr('Pending')}
                        </td>
                      </tr>
                    ))}
                    {!rows.length && (
                      <tr>
                        <td colSpan={4}>{tr(node.left ? 'No eligible strip comparisons.' : 'Base case: compare pairs directly.')}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <p className="cp-strip-caption">
                {tr('In the strip, each point checks at most 7 subsequent points in y-order. Stop when the y-gap reaches the current best distance.')}
                {preview && <span>{tr(' Computed checks are previewed.')}</span>}
              </p>
            </Panel>
            <Panel title={tr('Complexity')} icon={<BarChart3 />} className="cp-complexity">
              <strong>{tr('Time: O(n log² n)')}</strong>
              <strong>{tr('Auxiliary/output space: O(n)')}</strong>
              <p>
                {tr(
                  'Sorting each level gives O(n log² n); the recursive scan and strip check take linear time per level. Y-sorted lists avoid extra log factors.',
                )}
              </p>
              <button className="cp-example-insight" aria-label={tr('Inspect closest-pair result')} onClick={() => setModal('result')}>
                <CheckCircle2 />
                <span>
                  <b>{tr('Example insight')}</b>
                  <p>{tr(`In the current step, δ = ${d(frame.delta)}. Only points inside the strip and within the current best y-distance need checking.`)}</p>
                </span>
              </button>
            </Panel>
          </div>
        </>
      ) : tab === 'Learn' ? (
        <div className="cp-learning">
          <Panel title={tr('Why Split the Plane?')} icon={<BookOpen />}>
            <p>
              {tr(
                'The closest pair is the pair of distinct point IDs with the smallest Euclidean distance. Two different points may have identical coordinates; their distance is zero. A single point has no pair.',
              )}
            </p>
            <div className="cp-concepts">
              {[
                [
                  'Divide by x',
                  'Sort by x, then split the sorted sequence into balanced halves. Use point IDs to distinguish equal x-values and duplicate coordinates.',
                ],
                ['Solve both halves', 'Each recursive call returns its closest pair. Let δ be the smaller half distance. A better pair must cross the split.'],
                [
                  'Inspect a y-sorted strip',
                  'Any crossing pair closer than δ has both points within δ of the dividing line. Sort that strip by y and compare at most the next seven points, stopping sooner if the y-gap is already too large.',
                ],
              ].map(([title, text]) => (
                <article key={title}>
                  <h3>{tr(title)}</h3>
                  <p>{tr(text)}</p>
                </article>
              ))}
            </div>
          </Panel>
          <Panel title={tr('Worked Example: Distance √34')} icon={<Lightbulb />}>
            <p>
              {tr(
                'The default input has 20 actual points, split into 10 on each side of x = 50. The right half contains (52,48) and (57,51). Their distance is √((57−52)² + (51−48)²) = √34 ≈ 5.83. The left half is farther apart. The y-sorted strip finds no closer crossing pair, so this pair remains the answer.',
              )}
            </p>
            <button
              onClick={() => {
                load(closestExample, 'default')
                setTab('Visualization')
              }}
            >
              {tr('Explore worked example')}
            </button>
          </Panel>
          <Panel title={tr('When the Closest Pair Crosses the Divide')} icon={<CheckCircle2 />}>
            <p>
              {tr(
                'With [(0,0),(2,100),(4,0),(5,0),(7,100),(9,0)], each half has minimum distance 4. The crossing pair (4,0),(5,0) has distance 1. Solving the halves alone would miss the answer; the strip merge finds it.',
              )}
            </p>
            <button
              onClick={() => {
                selectExample('cross')
                setTab('Visualization')
              }}
            >
              {tr('Explore crossing pair')}
            </button>
            <p>
              {tr(
                'This implementation sorts each strip by y at each recursive level, giving O(n log² n). Maintaining y-sorted lists through the recursion improves it to O(n log n). The algorithm needs O(n) auxiliary space; this learning tool retains extra snapshots, tree nodes and check records for inspection.',
              )}
            </p>
          </Panel>
        </div>
      ) : tab === 'Code' ? (
        <Panel title={tr('Divide, Recurse, and Search the Strip')} icon={<Code2 />} className="cp-code">
          <pre>
            <code>{`closest(Px):
  if length(Px) <= 3: return bruteForce(Px)
  L, R = split Px into balanced halves
  best = minimum(closest(L), closest(R))
  delta = best.distance
  midX = midpoint between the two halves
  S = points with abs(x - midX) < delta
  sort S by y
  for i in 0 .. length(S)-1:
    for j in i+1 .. min(i+7, length(S)-1):
      if S[j].y - S[i].y >= best.distance: break
      best = minimum(best, distance(S[i], S[j]))
  return best`}</code>
          </pre>
          <p>
            {tr(
              'The strip uses the distance known after solving the halves. Later comparisons may reduce the best distance; the y-gap stopping condition uses that updated value. Equal-distance ties may return any optimal pair.',
            )}
          </p>
        </Panel>
      ) : tab === 'Practice' ? (
        <Panel title={tr('Predict the Distance')} icon={<Lightbulb />} className="cp-practice">
          <p>{tr('What is the distance between (52,48) and (57,51), rounded to two decimal places?')}</p>
          <input
            aria-label={tr('Predicted closest-pair distance')}
            value={prediction}
            onChange={(e) => {
              setPrediction(e.target.value)
              setFeedback('')
            }}
          />
          <button
            className="cp-primary"
            onClick={() =>
              setFeedback(
                prediction.trim() && Math.abs(Number(prediction) - Math.sqrt(34)) < 0.005
                  ? 'Correct! √(5² + 3²) = √34 ≈ 5.83.'
                  : 'Try again. Square the x-difference and y-difference, add them, then take the square root.',
              )
            }
          >
            {tr('Check prediction')}
          </button>
          {feedback && <p role="status">{tr(feedback)}</p>}
          <p>
            {tr(
              'If the vertical gap alone is at least the current best distance, the full Euclidean distance cannot improve it. Sorting by y makes it safe to stop for this point.',
            )}
          </p>
        </Panel>
      ) : (
        <div className="cp-experiments">
          <Panel title={tr('Point and Strip Laboratory')} icon={<Settings />}>
            <div className="cp-lab-actions">
              <button className="cp-primary" onClick={openEditor}>
                {tr('Edit point coordinates')}
              </button>
              <button
                onClick={() => {
                  setCursor(0)
                  setPreview(false)
                  setPlaying(false)
                }}
              >
                {tr('Jump to first comparison')}
              </button>
              <button
                onClick={() => {
                  setCursor(run.frames.length - 1)
                  setPlaying(false)
                  setPreview(false)
                }}
              >
                {tr('Jump to final pair')}
              </button>
              <button
                disabled={run.frames.length < 2}
                onClick={() => {
                  if (cursor === run.frames.length - 1) setCursor(0)
                  setPreview(false)
                  setPlaying(!playing)
                }}
              >
                {playing ? <Pause size={17} /> : <Play size={17} />} {tr(playing ? 'Pause playback' : 'Auto divide')}
              </button>
            </div>
            <label>
              {tr('Playback speed')}
              <select aria-label={tr('Closest-pair playback speed')} value={speed} onChange={(e) => setSpeed(Number(e.target.value))}>
                <option value={700}>{tr('Normal')}</option>
                <option value={100}>{tr('Fast')}</option>
                <option value={1400}>{tr('Slow')}</option>
              </select>
            </label>
            <label>
              <input type="checkbox" checked={preview} onChange={(e) => setPreview(e.target.checked)} />
              {tr('Preview computed strip checks')}
            </label>
            <p className="cp-run-summary" role="status">
              {tr(
                `Point count: ${run.points.length}. Subproblem ${node.id}: ${node.points.length} points. Event ${cursor + 1} / ${run.frames.length}. Current distance: ${pair ? d(pair.distance) : 'no pair'}.`,
              )}
            </p>
            <p>{tr(frame.message)}</p>
            <p>{tr(`Final closest distance: ${run.pair ? d(run.pair.distance) : 'no pair'}.`)}</p>
            <p>{tr(`Current strip IDs in y-order: ${frame.strip.map((p) => p.id).join(', ') || '(empty)'}.`)}</p>
            <div className="cp-lab-actions">
              {run.nodes.map((n) => (
                <button key={n.id} onClick={() => inspectNode(n)}>
                  {tr(`Inspect subproblem ${n.id} (${n.points.length})`)}
                </button>
              ))}
            </div>
            <div className="cp-point-buttons">
              {run.points.map((p) => (
                <button key={p.id} onClick={() => inspectPoint(p)}>
                  {tr(`Point ${p.id}: ${xy(p)}`)}
                </button>
              ))}
            </div>
            <button onClick={() => setTab('Visualization')}>{tr('Return to coordinate plot')}</button>
          </Panel>
          <Panel title={tr('Your Closest-Pair Notes')} icon={<BookOpen />}>
            <LanguageSelector />
            <label>
              {tr('Notes')}
              <textarea aria-label={tr('Closest-pair notes')} value={notes} onChange={(e) => setNotes(e.target.value)} />
            </label>
            <button aria-label={tr('Toggle color theme')} onClick={toggleTheme}>
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />} {tr('Toggle color theme')}
            </button>
          </Panel>
        </div>
      )}
      <dialog
        ref={dialog}
        className="cp-dialog"
        aria-label={tr(
          modal === 'edit'
            ? 'Edit closest-pair points'
            : modal === 'point'
              ? 'Inspect closest-pair point'
              : modal === 'check'
                ? 'Inspect strip distance check'
                : 'Closest-pair result',
        )}
        onCancel={() => setModal(null)}
      >
        <button className="cp-close" aria-label={tr('Close closest-pair dialog')} onClick={() => setModal(null)}>
          <X />
        </button>
        {modal === 'edit' ? (
          <>
            <h2>{tr('Edit Point Coordinates')}</h2>
            <p>
              {tr(
                'Enter a JSON array of 1–40 [x,y] pairs, with coordinates between −1000 and 1000. Negative coordinates and duplicate points are allowed. The axes expand to fit the data.',
              )}
            </p>
            <textarea ref={editor} aria-label={tr('Closest-pair point JSON')} value={draft} onChange={(e) => setDraft(e.target.value)} />
            {error && <p role="alert">{tr(error)}</p>}
            <button
              className="cp-primary"
              onClick={() => {
                try {
                  load(parseClosestPoints(draft))
                  setModal(null)
                } catch (e) {
                  setError((e as Error).message)
                }
              }}
            >
              {tr('Apply closest-pair points')}
            </button>
          </>
        ) : modal === 'point' && currentPoint ? (
          <>
            <h2>{tr(`Point ${currentPoint.id}: ${xy(currentPoint)}`)}</h2>
            <p>{tr('Point IDs distinguish coincident points. Two separate IDs at the same coordinates form a valid zero-distance pair.')}</p>
            {other && other.id !== currentPoint.id && (
              <p className="cp-measured-distance">{tr(`Distance from point ${other.id}: ${d(pointDistance(other, currentPoint).distance)}.`)}</p>
            )}
            <label>
              {tr('X coordinate')}
              <input type="number" aria-label={tr('Point x coordinate')} value={pointX} onChange={(e) => setPointX(e.target.value)} />
            </label>
            <label>
              {tr('Y coordinate')}
              <input type="number" aria-label={tr('Point y coordinate')} value={pointY} onChange={(e) => setPointY(e.target.value)} />
            </label>
            {error && <p role="alert">{tr(error)}</p>}
            <div className="cp-lab-actions">
              <button
                onClick={() => {
                  try {
                    if (!pointX.trim() || !pointY.trim()) throw new Error('Enter both coordinates.')
                    const next = data.map((p, id) => (id === pointId ? ([Number(pointX), Number(pointY)] as [number, number]) : p))
                    load(next)
                    setModal(null)
                  } catch (e) {
                    setError((e as Error).message)
                  }
                }}
              >
                {tr('Apply point change')}
              </button>
              <button
                onClick={() => {
                  setCompareId(pointId)
                  setModal(null)
                }}
              >
                {tr('Use as distance anchor')}
              </button>
              <button
                disabled={data.length <= 1}
                onClick={() => {
                  load(data.filter((_, id) => id !== pointId))
                  setModal(null)
                }}
              >
                {tr('Remove point')}
              </button>
            </div>
          </>
        ) : modal === 'check' && check ? (
          <>
            <h2>{tr('Strip Distance Check')}</h2>
            <p>{tr(`Point ${check.a.id} ${xy(check.a)} and point ${check.b.id} ${xy(check.b)}.`)}</p>
            <p>{tr(`Euclidean distance: ${d(check.distance)}. Vertical gap: ${d(check.gap)}.`)}</p>
            <p>
              {tr(
                check.checked
                  ? 'The y-gap permits a Euclidean distance comparison. The pair improves the answer only if its distance is strictly smaller.'
                  : 'The vertical gap reaches the current best distance. This pair and later y-sorted candidates can be skipped for this point.',
              )}
            </p>
            {check.event !== null && (
              <button
                onClick={() => {
                  setCursor(check.event!)
                  setPreview(false)
                  setModal(null)
                }}
              >
                {tr('Show this comparison')}
              </button>
            )}
          </>
        ) : (
          <>
            <h2>{tr('Closest-Pair Result')}</h2>
            <p>{tr(`Input points: ${run.points.length}.`)}</p>
            <p>
              {tr(
                run.pair
                  ? `Closest pair: ${xy(run.pair.a)} and ${xy(run.pair.b)}. Distance: ${d(run.pair.distance)}.`
                  : 'There is no pair in a singleton point set.',
              )}
            </p>
            <p>
              {tr(
                'The result includes base-case, within-half and cross-strip candidates. The recursive tree counts only actual input point IDs; no decorative points are added to the plot.',
              )}
            </p>
            <button
              onClick={() => {
                setCursor(0)
                setPreview(false)
                setModal(null)
                setTab('Visualization')
              }}
            >
              {tr('Replay closest-pair trace')}
            </button>
          </>
        )}
      </dialog>
    </div>
  )
}
