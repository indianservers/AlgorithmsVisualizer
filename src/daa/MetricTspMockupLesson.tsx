// @localized-render
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Bookmark, Check, Network, Info, Lightbulb, BarChart3, Trophy, Play, RotateCcw, Copy, Route, X } from 'lucide-react'
import { AccountControl } from '../account/AccountControl'
import { LanguageSelector } from '../i18n/LanguageSelector'
import { tx, useLocaleRender } from '../i18n/render'
import { persistentString, usePersistentState } from '../hooks/usePersistentState'
import { MockupTabs, type MockupPageProps, type MockupTab } from './MockupLessonChrome'
import { metricTspExample, parseMetricInput, runMetricTspLesson, type MetricInput } from './metricTspLessonModel'
import './metric-tsp-mockup.css'
const tr = (s: string) => tx(s, 'studios'),
  tabs: MockupTab[] = ['Learn', 'Visualization', 'Code', 'Practice', 'Experiments'],
  format = (n: number) => (Math.abs(n) >= 1e4 ? n.toExponential(1) : n.toFixed(1)),
  presets: Record<string, MetricInput> = {
    euclidean: metricTspExample,
    manhattan: { ...metricTspExample, mode: 'manhattan' },
    square: {
      mode: 'euclidean',
      source: 0,
      points: [
        [0, 0],
        [1, 0],
        [1, 1],
        [0, 1],
      ],
    },
    line: {
      mode: 'euclidean',
      source: 0,
      points: [
        [0, 0],
        [1, 0],
        [2, 0],
        [3, 0],
        [4, 0],
      ],
    },
    coincident: {
      mode: 'euclidean',
      source: 0,
      points: [
        [0, 0],
        [0, 0],
        [0, 0],
      ],
    },
  }
function Panel({ title, icon, children, className = '' }: { title: string; icon: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`mt-panel ${className}`}>
      <header>
        <span className="mt-icon">{icon}</span>
        <h2>{title}</h2>
      </header>
      {children}
    </section>
  )
}
export function MetricTspMockupLesson(props: MockupPageProps) {
  useLocaleRender()
  const navigate = useNavigate(),
    [tab, setTab] = useState<MockupTab>('Visualization'),
    [run, setRun] = useState(() => runMetricTspLesson(metricTspExample)),
    [stage, setStage] = useState(3),
    [mstCursor, setMstCursor] = useState(6),
    [walkCursor, setWalkCursor] = useState(12),
    [preset, setPreset] = useState('euclidean'),
    [draft, setDraft] = useState(JSON.stringify(metricTspExample, null, 2)),
    [modal, setModal] = useState<'graph' | 'edge' | 'city' | null>(null),
    [inspect, setInspect] = useState(0),
    [error, setError] = useState(''),
    [allEdges, setAllEdges] = useState(true),
    [showMst, setShowMst] = useState(true),
    [showWalk, setShowWalk] = useState(true),
    [showTour, setShowTour] = useState(true),
    [details, setDetails] = useState<'mst' | 'walk' | 'tour' | 'metric'>('mst'),
    [playing, setPlaying] = useState(false),
    [speed, setSpeed] = useState(900),
    [seed, setSeed] = useState(39),
    [prediction, setPrediction] = useState(''),
    [feedback, setFeedback] = useState(''),
    [localTheme, setLocalTheme] = useState(() => localStorage.getItem('algodrishti-theme') ?? 'light'),
    dialog = useRef<HTMLDialogElement>(null)
  const [notes, setNotes] = usePersistentState('algodrishti-metric-tsp-notes', '', persistentString),
    theme = props.theme ?? localTheme,
    studied = props.completed.includes(props.module.id),
    n = run.graph.points.length,
    defaultGraph = JSON.stringify(run.graph.points) === JSON.stringify(metricTspExample.points),
    mst = stage === 0 ? [] : stage === 1 ? run.mst.slice(0, mstCursor) : run.mst,
    walk = stage < 2 ? [] : stage === 2 ? run.traversals.slice(0, walkCursor) : run.traversals,
    mstReady = stage >= 1 && mst.length === run.mst.length,
    walkReady = stage >= 2 && walk.length === run.traversals.length,
    forestCost = mst.reduce((s, e) => s + e.weight, 0),
    edge = run.edges[inspect],
    hasDuplicate = new Set(run.graph.points.map((p) => p.join(','))).size < n,
    xs = run.graph.points.map((p) => p[0]),
    ys = run.graph.points.map((p) => p[1]),
    scale = Math.min(530 / Math.max(1, Math.max(...xs) - Math.min(...xs)), 240 / Math.max(1, Math.max(...ys) - Math.min(...ys))),
    points = run.graph.points.map(([x, y], i) =>
      defaultGraph
        ? [
            [394, 72],
            [183, 183],
            [288, 325],
            [459, 209],
            [715, 89],
            [763, 208],
            [651, 347],
          ][i]
        : run.graph.mode === 'matrix' || hasDuplicate
          ? [470 + 220 * Math.cos(-Math.PI / 2 + (i * 2 * Math.PI) / n), 184 + 110 * Math.sin(-Math.PI / 2 + (i * 2 * Math.PI) / n)]
          : [260 + (x - Math.min(...xs)) * scale, 65 + (y - Math.min(...ys)) * scale],
    ),
    chips = [
      [370, 6],
      [91, 166],
      [202, 326],
      [476, 215],
      [746, 66],
      [792, 186],
      [685, 326],
    ],
    rows =
      details === 'metric' || stage === 0
        ? run.edges.map((e) => ({ from: e.u, to: e.v, weight: e.weight, type: 'Metric edge' }))
        : details === 'walk'
          ? walk.map((e) => ({ ...e, type: 'Doubled walk' }))
          : details === 'tour' && stage === 3
            ? run.shortcuts.map((e) => ({ ...e, weight: e.direct, type: e.via.length > 2 ? 'Shortcut' : 'Tree edge in tour' }))
            : [...mst].sort((a, b) => a.id - b.id).map((e) => ({ from: e.u, to: e.v, weight: e.weight, type: stage >= 2 ? 'MST + doubled' : 'MST' }))
  useEffect(() => {
    if (modal) dialog.current?.showModal()
    else dialog.current?.close()
  }, [modal])
  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])
  useEffect(() => {
    if (!playing) return
    const timer = window.setInterval(
      () =>
        setStage((s) => {
          if (s >= 3) {
            setPlaying(false)
            return s
          }
          return s + 1
        }),
      speed,
    )
    return () => window.clearInterval(timer)
  }, [playing, speed])
  function changeTab(next: MockupTab) {
    setTab(next)
    setPlaying(false)
  }
  function load(input: MetricInput, name = 'custom', initial = 3) {
    const next = runMetricTspLesson(input)
    setRun(next)
    setStage(initial)
    setMstCursor(next.mst.length)
    setWalkCursor(next.traversals.length)
    setPreset(name)
    setDraft(JSON.stringify(input, null, 2))
    setError('')
    setPlaying(false)
    setModal(null)
    setDetails('mst')
  }
  function reset() {
    setStage(0)
    setPlaying(false)
    setMstCursor(run.mst.length)
    setWalkCursor(run.traversals.length)
  }
  function inspectEdge(id: number) {
    setInspect(id)
    setModal('edge')
  }
  function inspectCity(id: number) {
    setInspect(id)
    setModal('city')
  }
  function generate() {
    let state = seed >>> 0
    const random = () => {
      state = (Math.imul(state, 1664525) + 1013904223) >>> 0
      return state
    }
    const points = Array.from(
      { length: 7 },
      () => [Number(((random() % 800) / 100 - 4).toFixed(2)), Number(((random() % 600) / 100 - 2).toFixed(2))] as [number, number],
    )
    load({ mode: run.graph.mode === 'manhattan' ? 'manhattan' : 'euclidean', points, source: 0 }, 'custom', 0)
    setSeed((seed + 1) >>> 0)
  }
  function edgeId(u: number, v: number) {
    return run.edges.find((e) => e.u === Math.min(u, v) && e.v === Math.max(u, v))!.id
  }
  function curve(u: number, v: number, offset: number) {
    const [x, y] = points[u],
      [a, b] = points[v],
      length = Math.hypot(a - x, b - y) || 1
    return `M${x},${y}Q${(x + a) / 2 - ((b - y) * offset) / length},${(y + b) / 2 + ((a - x) * offset) / length} ${a},${b}`
  }
  function showEdge(u: number, v: number, label: string) {
    return (
      <>
        <title>{tr(`${label}: ${u}–${v}, distance ${run.distances[u][v]}`)}</title>
      </>
    )
  }
  return (
    <div className="mom-page target-visual metric-tsp-page" data-target="39">
      <header className="mt-topbar">
        <button className="mt-back" aria-label={tr('Back to vertex cover')} onClick={() => navigate('/daa-extensions/vertex-cover-approximation')}>
          <ArrowLeft size={19} />
        </button>
        <div className="mt-title-row">
          <h1>{tr('Metric TSP 2-Approximation')}</h1>
          <p>{tr('Explore the 2-approximation algorithm using MST, double tree and shortcutting.')}</p>
        </div>
        <button className="mom-study" aria-pressed={studied} onClick={() => props.toggleCompleted(props.module.id)}>
          {studied ? <Check size={16} /> : <Bookmark size={16} />} {tr(studied ? 'Studied' : 'Mark studied')}
        </button>
        <AccountControl showLanguage={false} />
      </header>
      <MockupTabs active={tab} onChange={changeTab} tabs={tabs} />
      {tab === 'Visualization' ? (
        <div className="mt-layout">
          <main className="mt-left">
            <section className="mt-visualization">
              <header className="mt-visual-heading">
                <span className="mt-main-icon">
                  <Network size={28} />
                </span>
                <div>
                  <h2>{tr('Interactive Visualization')}</h2>
                  <p>{tr('Generate a metric TSP instance, build MST, double the tree and shortcut to get a tour.')}</p>
                </div>
                <select
                  aria-label={tr('Metric TSP example')}
                  value={preset === 'custom' ? 'loaded-custom' : preset}
                  onChange={(e) => {
                    if (e.target.value === 'custom') {
                      setDraft(JSON.stringify(run.graph, null, 2))
                      setModal('graph')
                    } else load(presets[e.target.value], e.target.value)
                  }}
                >
                  {preset === 'custom' && <option value="loaded-custom">{tr('Custom metric')}</option>}
                  {Object.entries({
                    euclidean: 'Euclidean (points in 2D)',
                    manhattan: 'Manhattan (points in 2D)',
                    square: 'Unit square',
                    line: 'Collinear cities',
                    coincident: 'Coincident cities',
                    custom: 'Custom metric JSON…',
                  }).map(([v, s]) => (
                    <option key={v} value={v}>
                      {tr(s)}
                    </option>
                  ))}
                </select>
              </header>
              <div className="mt-canvas-scroll">
                <div className="mt-canvas">
                  <svg viewBox="0 0 858 384" role="group" aria-label={tr('Metric TSP city graph')}>
                    <defs>
                      <radialGradient id="mt-city-fill">
                        <stop stopColor="#fff" />
                        <stop offset="1" stopColor="#bde4ff" />
                      </radialGradient>
                      <marker id="mt-arrow" markerWidth="5" markerHeight="5" refX="9" refY="2.5" orient="auto">
                        <path d="M0 0L5 2.5L0 5" fill="#ff9e00" />
                      </marker>
                    </defs>
                    {run.edges.map((e) => {
                      const [x, y] = points[e.u],
                        [a, b] = points[e.v],
                        chosen = mst.some((m) => m.id === e.id)
                      return (
                        <g
                          key={e.id}
                          className="mt-metric-edge"
                          role="button"
                          tabIndex={0}
                          aria-label={tr(`Inspect metric edge ${e.u}–${e.v}`)}
                          onClick={() => inspectEdge(e.id)}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter' || event.key === ' ') {
                              event.preventDefault()
                              inspectEdge(e.id)
                            }
                          }}
                        >
                          <rect x={(x + a) / 2 - 8} y={(y + b) / 2 - 8} width="16" height="16" fill="transparent" />
                          <line x1={x} y1={y} x2={a} y2={b} stroke="transparent" strokeWidth="12" />
                          {showEdge(e.u, e.v, 'Metric edge')}
                          {allEdges && (
                            <>
                              <line x1={x} y1={y} x2={a} y2={b} className="mt-faint-edge" pointerEvents="none" />
                              {!chosen && n <= 7 && (
                                <text x={(x + a) / 2} y={(y + b) / 2 - 6} className="mt-faint-weight" textAnchor="middle">
                                  {format(e.weight)}
                                </text>
                              )}
                            </>
                          )}
                        </g>
                      )
                    })}
                    {showWalk &&
                      walk.map((e, i) => (
                        <path key={i} className="mt-walk-edge" d={curve(e.from, e.to, 10)} markerEnd="url(#mt-arrow)" pointerEvents="none">
                          {showEdge(e.from, e.to, 'Doubled walk')}
                        </path>
                      ))}
                    {showMst &&
                      mst.map((e) => {
                        const [x, y] = points[e.u],
                          [a, b] = points[e.v]
                        return (
                          <g key={e.id} className="mt-mst-edge" pointerEvents="none">
                            <line x1={x} y1={y} x2={a} y2={b} />
                            <text x={(x + a) / 2 + 8} y={(y + b) / 2 - 9}>
                              {format(e.weight)}
                            </text>
                          </g>
                        )
                      })}
                    {stage === 3 &&
                      showTour &&
                      run.shortcuts.map((e, i) => {
                        const [x, y] = points[e.from],
                          [a, b] = points[e.to]
                        return (
                          <g key={i} className="mt-tour-edge" pointerEvents="none">
                            <path d={curve(e.from, e.to, -7)} />
                            {!mst.some((m) => m.id === edgeId(e.from, e.to)) && (
                              <text x={(x + a) / 2 - 9} y={(y + b) / 2 + 17}>
                                {format(e.direct)}
                              </text>
                            )}
                          </g>
                        )
                      })}
                    {points.map(([x, y], i) => {
                      const [cx, cy] = defaultGraph ? chips[i] : [Math.min(750, Math.max(5, x - 49)), y + 28],
                        chipWidth = defaultGraph ? (i === 1 ? 60 : 54) : 98
                      return (
                        <g
                          key={i}
                          className="mt-city"
                          role="button"
                          tabIndex={0}
                          aria-label={tr(`Inspect city ${i}`)}
                          onClick={() => inspectCity(i)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault()
                              inspectCity(i)
                            }
                          }}
                        >
                          <title>{tr(`City ${i}: (${run.graph.points[i].join(', ')})${i === run.graph.source ? ', start city' : ''}`)}</title>
                          <rect x={x - 28} y={y - 28} width="56" height="56" fill="transparent" />
                          <circle cx={x} cy={y} r="22" />
                          <text x={x} y={y + 7} textAnchor="middle" className="mt-city-number">
                            {i}
                          </text>
                          {(!defaultGraph || i !== 3) && (
                            <g className="mt-coordinates">
                              <rect x={cx} y={cy} rx="7" width={chipWidth} height="46" />
                              <text x={cx + chipWidth / 2} y={cy + 18} textAnchor="middle">
                                {i}
                              </text>
                              <text
                                x={cx + chipWidth / 2}
                                y={cy + 36}
                                textAnchor="middle"
                              >{`(${run.graph.points[i].map((v) => Number(v.toFixed(2))).join(', ')})`}</text>
                            </g>
                          )}
                        </g>
                      )
                    })}
                  </svg>
                  <div className="mt-legend">
                    {[
                      ['All edges (metric)', allEdges, setAllEdges, 'metric'],
                      ['MST edges', showMst, setShowMst, 'mst'],
                      ['Doubled walk (DFS)', showWalk, setShowWalk, 'walk'],
                      ['Shortcut tour (TSP)', showTour, setShowTour, 'tour'],
                    ].map(([s, on, set, key]) => (
                      <button key={key as string} aria-pressed={on as boolean} onClick={() => (set as (v: boolean) => void)(!on)}>
                        <i className={`mt-legend-${key}`} />
                        {tr(s as string)}
                      </button>
                    ))}
                    <div>
                      <i className="mt-legend-city" />
                      {tr('Vertex (city)')}
                    </div>
                  </div>
                  {stage < 3 && (
                    <div className="mt-stage-note" role="status">
                      {tr(
                        stage === 0
                          ? 'Metric ready. Build the minimum spanning tree.'
                          : stage === 1
                            ? `MST edges accepted: ${mst.length}/${run.mst.length}.`
                            : `DFS traversals: ${walk.length}/${run.traversals.length}.`,
                      )}
                    </div>
                  )}
                </div>
              </div>
              <div className="mt-controls">
                <button className="mt-primary" onClick={generate}>
                  <Play size={17} fill="currentColor" />
                  {tr('Generate metric')}
                </button>
                <button
                  onClick={() => {
                    setStage(1)
                    setMstCursor(run.mst.length)
                    setPlaying(false)
                  }}
                >
                  <Network size={21} />
                  {tr('Build MST')}
                </button>
                <button
                  disabled={!mstReady}
                  onClick={() => {
                    setStage(2)
                    setWalkCursor(run.traversals.length)
                    setPlaying(false)
                    setDetails('mst')
                  }}
                >
                  <Copy size={20} />
                  {tr('Double tree')}
                </button>
                <button
                  disabled={!walkReady}
                  onClick={() => {
                    setStage(3)
                    setPlaying(false)
                    setDetails('mst')
                  }}
                >
                  <Route size={21} />
                  {tr('Shortcut tour')}
                </button>
                <button onClick={reset}>
                  <RotateCcw size={19} />
                  {tr('Reset')}
                </button>
              </div>
            </section>
            <div className="mt-bottom-grid">
              <Panel className="mt-details" title={tr('Current state details')} icon={<BarChart3 size={20} />}>
                <div className="mt-table-scroll">
                  <table>
                    <thead>
                      <tr>
                        {['Edge / Step', 'From', 'To', 'Weight', 'Type'].map((s) => (
                          <th key={s}>{tr(s)}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((e, i) => (
                        <tr key={i}>
                          <td>
                            <button
                              aria-label={tr(`Inspect detail edge ${e.from}–${e.to} at row ${i + 1}`)}
                              onClick={() => inspectEdge(edgeId(e.from, e.to))}
                            >{`${e.from} – ${e.to}`}</button>
                          </td>
                          <td>{e.from}</td>
                          <td>{e.to}</td>
                          <td title={String(e.weight ?? run.distances[e.from][e.to])}>{format(e.weight ?? run.distances[e.from][e.to])}</td>
                          <td>{tr(e.type)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Panel>
              <div className="mt-bound-stack">
                <Panel className="mt-lower-bound" title={tr('MST lower bound')} icon={<Network size={23} />}>
                  <div>
                    <b>{tr(mstReady ? 'MST cost (lower bound)' : 'Accepted forest cost')}</b>
                    <strong>{stage > 0 ? format(forestCost) : '–'}</strong>
                  </div>
                  <p>
                    {tr(
                      mstReady
                        ? `Since MST ≤ OPT, we have OPT ≥ ${format(run.mstCost)} and algorithm cost ≤ 2 × MST = ${format(2 * run.mstCost)}.`
                        : 'Build the MST to obtain the lower bound. An unfinished forest is not the complete MST.',
                    )}
                  </p>
                </Panel>
                <Panel className="mt-ratio" title={tr('Approximation ratio')} icon={<Trophy size={21} />}>
                  <p>{tr('Tour cost / MST cost')}</p>
                  <div>
                    <strong>{stage === 3 && run.ratio !== null ? run.ratio.toFixed(2) : '–'}</strong>
                    <span>{tr(stage === 3 && run.ratio === null ? 'Zero-cost metric: both costs are 0' : '≤ 2 (theoretical guarantee)')}</span>
                  </div>
                </Panel>
              </div>
            </div>
          </main>
          <aside className="mt-right">
            <Panel className="mt-how" title={tr('How it works')} icon={<Info size={19} />}>
              <ol>
                {[
                  'Generate a complete metric graph (e.g., points in 2D with Euclidean distances).',
                  'Compute an MST of the graph.',
                  'Double every edge of the MST and take a DFS walk to get an Eulerian tour.',
                  'Shortcut repeated vertices using the triangle inequality to obtain a Hamiltonian tour (TSP tour).',
                ].map((s, i) => (
                  <li key={s}>
                    <b>{i + 1}</b>
                    <p>{tr(s)}</p>
                  </li>
                ))}
              </ol>
            </Panel>
            <Panel className="mt-insight" title={tr('Key insight')} icon={<Lightbulb size={23} />}>
              <p>
                {tr(
                  'The tour obtained by shortcutting the doubled MST has cost at most 2 × OPT. This follows because the doubled tree has cost 2 · MST ≤ 2 · OPT, and shortcutting never increases the cost due to the triangle inequality.',
                )}
              </p>
            </Panel>
            <Panel className="mt-tour-cost" title={tr('Tour cost')} icon={<Route size={23} />}>
              <div>
                <div>
                  <b>{tr('Tour cost (shortcut)')}</b>
                  <strong>{stage === 3 ? format(run.cost) : '–'}</strong>
                </div>
                <div>
                  <b>{tr('Tour (order)')}</b>
                  <button
                    disabled={stage < 3}
                    onClick={() => {
                      setDetails('tour')
                      setTab('Experiments')
                    }}
                  >
                    {stage === 3 ? run.tour.join(' → ') : tr('Pending shortcut')}
                  </button>
                </div>
              </div>
            </Panel>
            <Panel className="mt-complexity" title={tr('Complexity')} icon={<BarChart3 size={23} />}>
              <p>
                <b>{tr('Time: O(V³ + E log E)')}</b>
              </p>
              <p>
                <b>{tr('Auxiliary/output space: O(V² + E)')}</b>
              </p>
              <p>{tr('Validate all triangle inequalities in O(V³), construct an MST and walk it, then shortcut the tour.')}</p>
            </Panel>
          </aside>
        </div>
      ) : tab === 'Learn' ? (
        <div className="mt-learning">
          <Panel title={tr('Three transformations, one guarantee')} icon={<Network />}>
            <p>
              {tr(
                'Metric TSP asks for the shortest closed tour visiting each city exactly once. Distances must be finite, non-negative and symmetric, with zero diagonal and the triangle inequality d(a,c) ≤ d(a,b) + d(b,c). Euclidean and Manhattan distances satisfy these conditions.',
              )}
            </p>
            <h3>{tr('1. A spanning tree gives a lower bound')}</h3>
            <p>
              {tr(
                'Remove one edge from any optimal tour. The remaining path spans all cities, so an MST cannot cost more: MST ≤ OPT. Kruskal’s algorithm sorts all edges and accepts an edge only when it joins two different components.',
              )}
            </p>
            <h3>{tr('2. Double the tree and walk it')}</h3>
            <p>
              {tr(
                'Traverse every tree edge once in each direction with DFS, returning to the root. The doubled graph has an Eulerian circuit and the walk costs exactly 2 × MST. Cities may appear several times in this walk.',
              )}
            </p>
            <h3>{tr('3. Shortcut every repeat')}</h3>
            <p>
              {tr(
                'Keep the first visit to each city, then return to the start. Replace every subwalk through already visited cities by a direct metric edge. Repeated triangle inequalities show that each replacement costs no more than the removed subwalk. The result visits every city exactly once and costs at most 2 × MST ≤ 2 × OPT.',
              )}
            </p>
          </Panel>
          <Panel title={tr('Worked example with exact distances')} icon={<Lightbulb />}>
            <p>
              {tr(
                `The default seven-city Euclidean graph has MST cost ${format(runMetricTspLesson(metricTspExample).mstCost)}. Its doubled walk costs ${format(2 * runMetricTspLesson(metricTspExample).mstCost)}, and shortcutting produces a seven-city tour costing ${format(runMetricTspLesson(metricTspExample).cost)}. Displayed labels round to one decimal; all calculations use full precision.`,
              )}
            </p>
            <p>
              {tr(
                'The ratio shown in the mockup is tour cost / MST cost, a bound certificate. The actual approximation ratio is tour cost / OPT; Experiments computes OPT exactly for this small teaching instance so you can compare both.',
              )}
            </p>
            <button
              onClick={() => {
                load(presets.square, 'square')
                setTab('Visualization')
              }}
            >
              {tr('Explore a unit square')}
            </button>
            <h3>{tr('Limits and implementation cost')}</h3>
            <p>
              {tr(
                'The guarantee applies to complete undirected metric graphs. Without the triangle inequality, a shortcut may be more expensive than the entire removed walk. We validate every triple in O(V³), sort E edges for Kruskal in O(E log E), and store the matrix and graph in O(V² + E) space. The optional exact Held–Karp comparison uses O(V² 2^V) time and O(V 2^V) space and is not part of the approximation algorithm.',
              )}
            </p>
          </Panel>
        </div>
      ) : tab === 'Code' ? (
        <Panel className="mt-code" title={tr('Metric double-tree algorithm')} icon={<Network />}>
          <pre>
            <code>{`function approximateMetricTSP(distance, source) {
  validateCompleteSymmetricMetric(distance);
  const mst = kruskal(completeEdges(distance));
  const walk = [];
  function dfs(u, parent = -1) {
    walk.push(u);
    for (const v of sortedTreeNeighbors(mst, u)) {
      if (v === parent) continue;
      dfs(v, u);
      walk.push(u);
    }
  }
  dfs(source); // each MST edge is traversed twice
  const tour = [...new Set(walk)]; // first visits only
  if (tour.length > 1) tour.push(source);
  return { mst, walk, tour, cost: tourCost(tour, distance) };
}
// cost(tour) <= cost(walk) = 2 * cost(mst) <= 2 * OPT`}</code>
          </pre>
        </Panel>
      ) : tab === 'Practice' ? (
        <Panel className="mt-practice" title={tr('Predict the shortcut guarantee')} icon={<Lightbulb />}>
          <p>{tr('A complete metric graph has an MST of cost 12. A doubled DFS walk costs 24. What can you guarantee about the shortcut tour?')}</p>
          <label>
            {tr('Your prediction')}
            <select
              value={prediction}
              onChange={(e) => {
                setPrediction(e.target.value)
                setFeedback('')
              }}
            >
              <option value="">{tr('Choose an answer')}</option>
              <option value="bound">{tr('Its cost is at most 24 and at most 2 × OPT')}</option>
              <option value="opt">{tr('It must be optimal')}</option>
              <option value="equal">{tr('Its cost is always exactly 24')}</option>
            </select>
          </label>
          <button
            onClick={() =>
              setFeedback(
                prediction === 'bound'
                  ? 'Correct. Triangle inequality prevents shortcutting from increasing the cost, and MST ≤ OPT.'
                  : 'Try again: shortcutting may reduce the cost; the proof gives an upper bound, not exact optimality.',
              )
            }
          >
            {tr('Check prediction')}
          </button>
          {feedback && <p role="status">{tr(feedback)}</p>}
        </Panel>
      ) : (
        <div className="mt-experiments">
          <Panel title={tr('Inspect every stage and its certificate')} icon={<Network />}>
            <div className="mt-experiment-controls">
              <button
                onClick={() => {
                  setDraft(JSON.stringify(run.graph, null, 2))
                  setModal('graph')
                }}
              >
                {tr('Edit metric JSON')}
              </button>
              <label>
                {tr('Starting city')}
                <select
                  aria-label={tr('Starting city')}
                  value={run.graph.source}
                  onChange={(e) => {
                    const next = runMetricTspLesson({ ...run.graph, source: Number(e.target.value) }, run.reverse)
                    setRun(next)
                    setStage(3)
                    setPlaying(false)
                  }}
                >
                  {run.graph.points.map((_, i) => (
                    <option key={i} value={i}>
                      {i}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={run.reverse}
                  onChange={(e) => {
                    setRun(runMetricTspLesson(run.graph, e.target.checked))
                    setStage(3)
                    setPlaying(false)
                  }}
                />
                {tr('Reverse DFS neighbor order')}
              </label>
              <button
                onClick={() => {
                  if (stage === 3) setStage(0)
                  setMstCursor(run.mst.length)
                  setWalkCursor(run.traversals.length)
                  setPlaying(!playing)
                }}
              >
                {tr(playing ? 'Pause playback' : 'Play stages')}
              </button>
              <label>
                {tr('Playback speed')}
                <select value={speed} onChange={(e) => setSpeed(Number(e.target.value))}>
                  <option value={1600}>{tr('Slow')}</option>
                  <option value={900}>{tr('Normal')}</option>
                  <option value={100}>{tr('Fast')}</option>
                </select>
              </label>
              <button onClick={reset}>{tr('Restart stages')}</button>
              <button
                onClick={() => {
                  setStage(3)
                  setMstCursor(run.mst.length)
                  setWalkCursor(run.traversals.length)
                  setPlaying(false)
                }}
              >
                {tr('Show final tour')}
              </button>
            </div>
            <label className="mt-range">
              {tr(`MST edge step: ${stage === 0 ? 0 : mst.length} / ${run.mst.length}`)}
              <input
                type="range"
                aria-label={tr('MST edge step')}
                min="0"
                max={run.mst.length}
                value={stage === 0 ? 0 : mst.length}
                onChange={(e) => {
                  setMstCursor(Number(e.target.value))
                  setStage(1)
                  setPlaying(false)
                }}
              />
            </label>
            <label className="mt-range">
              {tr(`DFS walk step: ${walk.length} / ${run.traversals.length}`)}
              <input
                type="range"
                aria-label={tr('DFS walk step')}
                min="0"
                max={run.traversals.length}
                value={walk.length}
                onChange={(e) => {
                  setMstCursor(run.mst.length)
                  setWalkCursor(Number(e.target.value))
                  setStage(2)
                  setPlaying(false)
                }}
              />
            </label>
            <div className="mt-certificate">
              <p>{tr(`Stage: ${stage}. Accepted tree edges: ${mst.length}; DFS traversals: ${walk.length}; tour ${stage === 3 ? 'complete' : 'pending'}.`)}</p>
              <p>
                {tr(
                  `MST ${format(run.mstCost)} ≤ OPT ${format(run.optimum.cost)}. Doubled walk ${format(run.doubledCost)}; shortcut tour ${format(run.cost)}.`,
                )}
              </p>
              <p>{tr(`Exact optimum tour: ${run.optimum.tour.join(' → ')}.`)}</p>
              <p>
                {tr(
                  run.approximationRatio === null
                    ? 'Zero-cost metric: the computed tour and optimum both cost zero.'
                    : `Tour / OPT = ${run.approximationRatio.toFixed(3)}; tour / MST = ${run.ratio!.toFixed(3)} ≤ 2.`,
                )}
              </p>
            </div>
            <label>
              {tr('Detail table')}
              <select aria-label={tr('Detail table')} value={details} onChange={(e) => setDetails(e.target.value as typeof details)}>
                <option value="mst">{tr('MST edges')}</option>
                <option value="walk">{tr('Doubled walk')}</option>
                <option value="tour">{tr('Shortcut proof')}</option>
                <option value="metric">{tr('Complete metric')}</option>
              </select>
            </label>
            {details === 'tour' ? (
              <div className="mt-shortcut-list">
                {run.shortcuts.map((s, i) => (
                  <button key={i} onClick={() => inspectEdge(edgeId(s.from, s.to))}>
                    {tr(`${s.from} → ${s.to}: ${format(s.direct)} ≤ ${format(s.walkCost)} via ${s.via.join(' → ')}`)}
                  </button>
                ))}
              </div>
            ) : (
              <p>
                {tr(
                  `Recorded ${details === 'mst' ? mst.length : details === 'walk' ? walk.length : run.edges.length} rows. Return to the graph to inspect the selected detail table.`,
                )}
              </p>
            )}
            <button onClick={() => setTab('Visualization')}>{tr('Return to metric graph')}</button>
          </Panel>
          <Panel title={tr('Notes and preferences')} icon={<Bookmark />}>
            <label>
              {tr('Metric TSP notes')}
              <textarea aria-label={tr('Metric TSP notes')} value={notes} onChange={(e) => setNotes(e.target.value)} />
            </label>
            <LanguageSelector />
            <button
              onClick={() => {
                if (props.onToggleTheme) props.onToggleTheme()
                else {
                  const next = theme === 'dark' ? 'light' : 'dark'
                  setLocalTheme(next)
                  localStorage.setItem('algodrishti-theme', next)
                }
              }}
            >
              {tr(theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme')}
            </button>
          </Panel>
        </div>
      )}
      <dialog ref={dialog} className="mt-dialog" onCancel={() => setModal(null)}>
        <button className="mt-close" aria-label={tr('Close metric TSP dialog')} onClick={() => setModal(null)}>
          <X size={20} />
        </button>
        {modal === 'graph' ? (
          <>
            <h2>{tr('Edit a complete metric instance')}</h2>
            <p>
              {tr(
                'Use mode euclidean or manhattan with 1–9 points and a source city. Matrix mode also requires a square symmetric non-negative matrix with zero diagonal and triangle inequality. Coordinates must be between −1000 and 1000.',
              )}
            </p>
            <label>
              {tr('Metric JSON')}
              <textarea
                aria-label={tr('Metric JSON')}
                value={draft}
                onChange={(e) => {
                  setDraft(e.target.value)
                  setError('')
                }}
              />
            </label>
            {error && <p role="alert">{tr(error)}</p>}
            <button
              onClick={() => {
                try {
                  load(parseMetricInput(draft))
                } catch (e) {
                  setError((e as Error).message)
                }
              }}
            >
              {tr('Apply custom metric')}
            </button>
          </>
        ) : modal === 'edge' && edge ? (
          <>
            <h2>{tr(`Metric edge ${edge.u}–${edge.v}`)}</h2>
            <p>{tr(`Exact distance: ${edge.weight}. In current MST: ${mst.some((e) => e.id === edge.id) ? 'Yes' : 'No'}.`)}</p>
            <p>
              {tr(
                `Doubled traversals shown: ${walk.filter((e) => (e.from === edge.u && e.to === edge.v) || (e.from === edge.v && e.to === edge.u)).length}. In shortcut tour: ${stage === 3 && run.shortcuts.some((e) => edgeId(e.from, e.to) === edge.id) ? 'Yes' : 'No'}.`,
              )}
            </p>
            <p>{tr(`Coordinates: city ${edge.u} (${run.graph.points[edge.u].join(', ')}), city ${edge.v} (${run.graph.points[edge.v].join(', ')}).`)}</p>
          </>
        ) : modal === 'city' ? (
          <>
            <h2>{tr(`City ${inspect}`)}</h2>
            <p>{tr(`Coordinates: (${run.graph.points[inspect].join(', ')}). Start city: ${inspect === run.graph.source ? 'Yes' : 'No'}.`)}</p>
            <p>{tr(`Degree in complete graph: ${n - 1}; current MST degree: ${mst.filter((e) => e.u === inspect || e.v === inspect).length}.`)}</p>
            <div className="mt-shortcut-list">
              {run.edges
                .filter((e) => e.u === inspect || e.v === inspect)
                .map((e) => (
                  <button key={e.id} onClick={() => inspectEdge(e.id)}>
                    {tr(`Inspect metric edge ${e.u}–${e.v}`)}
                  </button>
                ))}
            </div>
          </>
        ) : null}
      </dialog>
    </div>
  )
}
