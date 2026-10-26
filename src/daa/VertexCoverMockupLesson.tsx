// @localized-render
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Bookmark, Check, CheckCircle2, ChevronsRight, Info, Lightbulb, LockKeyhole, Network, Play, RotateCcw, X, BarChart3 } from 'lucide-react'
import { AccountControl } from '../account/AccountControl'
import { LanguageSelector } from '../i18n/LanguageSelector'
import { tx, useLocaleRender } from '../i18n/render'
import { persistentString, usePersistentState } from '../hooks/usePersistentState'
import { MockupTabs, type MockupPageProps, type MockupTab } from './MockupLessonChrome'
import { coverExample, parseCoverGraph, runVertexCoverLesson, type CoverGraph } from './vertexCoverLessonModel'
import './vertex-cover-mockup.css'

const tr = (s: string) => tx(s, 'studios'),
  tabs: MockupTab[] = ['Learn', 'Visualization', 'Code', 'Practice', 'Experiments']
const presets: Record<string, CoverGraph> = {
  default: coverExample,
  star: {
    vertices: 6,
    edges: [
      [0, 1],
      [0, 2],
      [0, 3],
      [0, 4],
      [0, 5],
    ],
  },
  triangle: {
    vertices: 3,
    edges: [
      [0, 1],
      [1, 2],
      [2, 0],
    ],
  },
  path: {
    vertices: 6,
    edges: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      [4, 5],
    ],
  },
  disjoint: {
    vertices: 6,
    edges: [
      [0, 1],
      [2, 3],
      [4, 5],
    ],
  },
  empty: { vertices: 4, edges: [] },
}
function Panel({ title, icon, children, className = '' }: { title: string; icon: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`vc-panel ${className}`}>
      <header>
        <span className="vc-icon">{icon}</span>
        <h2>{title}</h2>
      </header>
      {children}
    </section>
  )
}
export function VertexCoverMockupLesson(props: MockupPageProps) {
  useLocaleRender()
  const navigate = useNavigate(),
    [tab, setTab] = useState<MockupTab>('Visualization'),
    [run, setRun] = useState(() => runVertexCoverLesson(coverExample)),
    [cursor, setCursor] = useState(2),
    [pending, setPending] = useState<number | null>(null),
    [matching, setMatching] = useState(true),
    [uncovered, setUncovered] = useState(false),
    [example, setExample] = useState('default'),
    [draft, setDraft] = useState(JSON.stringify(coverExample, null, 2)),
    [error, setError] = useState(''),
    [modal, setModal] = useState<'graph' | 'edge' | 'vertex' | null>(null),
    [inspect, setInspect] = useState(0),
    [playing, setPlaying] = useState(false),
    [speed, setSpeed] = useState(700),
    [prediction, setPrediction] = useState(''),
    [feedback, setFeedback] = useState(''),
    [localTheme, setLocalTheme] = useState(() => localStorage.getItem('algodrishti-theme') ?? 'light'),
    dialog = useRef<HTMLDialogElement>(null)
  const [notes, setNotes] = usePersistentState('algodrishti-vertex-cover-notes', '', persistentString),
    frame = run.frames[cursor],
    theme = props.theme ?? localTheme,
    studied = props.completed.includes(props.module.id),
    defaultGraph = run.graph.vertices === 6 && JSON.stringify(run.graph.edges) === JSON.stringify(coverExample.edges),
    points = Array.from({ length: run.graph.vertices }, (_, i) =>
      defaultGraph
        ? [
            [303, 93],
            [149, 160],
            [151, 280],
            [475, 160],
            [372, 292],
            [630, 229],
          ][i]
        : [
            410 + 230 * Math.cos(-Math.PI / 2 + (i * 2 * Math.PI) / run.graph.vertices),
            184 + 120 * Math.sin(-Math.PI / 2 + (i * 2 * Math.PI) / run.graph.vertices),
          ],
    ),
    chipPositions = [
      [255, 12],
      [17, 180],
      [99, 307],
      [445, 200],
      [409, 303],
      [665, 208],
    ]
  useEffect(() => {
    if (modal) dialog.current?.showModal()
    else dialog.current?.close()
  }, [modal])
  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])
  useEffect(() => {
    if (!playing) return
    const timer = window.setInterval(() => {
      setPending(null)
      setCursor((c) => {
        if (c >= run.frames.length - 1) {
          setPlaying(false)
          return c
        }
        return c + 1
      })
    }, speed)
    return () => window.clearInterval(timer)
  }, [playing, run, speed])
  function changeTab(next: MockupTab) {
    setPlaying(false)
    setTab(next)
  }
  function load(graph: CoverGraph, name = 'custom') {
    const next = runVertexCoverLesson(graph)
    setRun(next)
    setCursor(next.defaultCursor)
    setPending(null)
    setPlaying(false)
    setExample(name)
    setDraft(JSON.stringify(graph, null, 2))
    setError('')
    setModal(null)
  }
  function reset() {
    setCursor(0)
    setPending(null)
    setPlaying(false)
  }
  function choose(id: number) {
    if (frame.complete) setCursor(0)
    setPending(id)
    setPlaying(false)
    setModal(null)
  }
  function step() {
    setPlaying(false)
    if (pending !== null) {
      const prefix = frame.complete ? [] : frame.matching
      const next = runVertexCoverLesson(run.graph, [...prefix, pending])
      setRun(next)
      setCursor(prefix.length + 1)
      setPending(null)
    } else setCursor(frame.complete ? Math.min(1, run.frames.length - 1) : cursor + 1)
  }
  function inspectEdge(id: number) {
    setInspect(id)
    setModal('edge')
  }
  function inspectVertex(id: number) {
    setInspect(id)
    setModal('vertex')
  }
  function reorder(reverse: boolean) {
    const order = run.graph.edges.map((_, id) => id)
    if (reverse) order.reverse()
    const next = runVertexCoverLesson(run.graph, order)
    setRun(next)
    setCursor(next.defaultCursor)
    setPending(null)
    setPlaying(false)
  }
  const edge = run.graph.edges[inspect],
    incident = run.graph.edges.flatMap(([u, v], id) => (u === inspect || v === inspect ? [id] : []))
  return (
    <div className="mom-page target-visual vertex-cover-page" data-target="38">
      <header className="vc-topbar">
        <button className="vc-back" aria-label={tr('Back to randomized selection')} onClick={() => navigate('/daa-extensions/randomized-selection')}>
          <ArrowLeft size={19} />
        </button>
        <div className="vc-title-row">
          <h1>{tr('Vertex Cover 2-Approximation')}</h1>
          <p>{tr('Take both endpoints of each uncovered edge.')}</p>
        </div>
        <button className="mom-study" aria-pressed={studied} onClick={() => props.toggleCompleted(props.module.id)}>
          {studied ? <Check size={16} /> : <Bookmark size={16} />} {tr(studied ? 'Studied' : 'Mark studied')}
        </button>
        <AccountControl showLanguage={false} />
      </header>
      <MockupTabs active={tab} onChange={changeTab} tabs={tabs} />
      {tab === 'Visualization' ? (
        <>
          <div className="vc-top-grid">
            <section className="vc-visualization">
              <header className="vc-visual-heading">
                <span className="vc-main-icon">
                  <Network size={27} />
                </span>
                <div>
                  <h2>{tr('Interactive Visualization')}</h2>
                  <p>{tr('Build a vertex cover using the 2-approximation algorithm. Repeatedly pick an uncovered edge and add both endpoints.')}</p>
                </div>
                <select
                  aria-label={tr('Vertex cover graph example')}
                  value={example === 'custom' ? 'loaded-custom' : example}
                  onChange={(e) => {
                    if (e.target.value === 'custom') {
                      setModal('graph')
                      return
                    }
                    load(presets[e.target.value], e.target.value)
                  }}
                >
                  {example === 'custom' && <option value="loaded-custom">{tr('Custom graph')}</option>}
                  {Object.entries({
                    default: 'Default graph',
                    star: 'Star — tight bound',
                    triangle: 'Triangle',
                    path: 'Path',
                    disjoint: 'Disjoint edges',
                    empty: 'Edgeless graph',
                    custom: 'Custom graph…',
                  }).map(([v, s]) => (
                    <option key={v} value={v}>
                      {tr(s)}
                    </option>
                  ))}
                </select>
              </header>
              <div className="vc-canvas-scroll">
                <div className="vc-canvas">
                  <svg viewBox="0 0 860 364" role="group" aria-label={tr('Vertex cover graph')}>
                    <defs>
                      <radialGradient id="vc-regular">
                        <stop stopColor="#fff" />
                        <stop offset="1" stopColor="#bde3ff" />
                      </radialGradient>
                      <radialGradient id="vc-selected">
                        <stop stopColor="#fff" />
                        <stop offset="1" stopColor="#ffb5be" />
                      </radialGradient>
                      <filter id="vc-glow">
                        <feGaussianBlur stdDeviation="9" />
                      </filter>
                    </defs>
                    {run.graph.edges.map(([u, v], id) => {
                      if (uncovered && frame.covered[id]) return null
                      const [x1, y1] = points[u],
                        [x2, y2] = points[v],
                        isMatching = matching && frame.matching.includes(id),
                        active = pending === id,
                        color = active ? '#f0a000' : isMatching ? '#0067ff' : frame.covered[id] ? '#8a94a6' : '#ff4049'
                      return (
                        <g
                          key={id}
                          className={`vc-edge${isMatching ? ' vc-matching-edge' : ''}${!frame.covered[id] ? ' vc-uncovered-edge' : ''}`}
                          role="button"
                          tabIndex={0}
                          aria-label={tr(`Inspect edge ${u}–${v}`)}
                          onClick={() => inspectEdge(id)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault()
                              inspectEdge(id)
                            }
                          }}
                        >
                          <title>{tr(`Edge ${u}–${v}: ${frame.covered[id] ? 'covered' : 'uncovered'}${isMatching ? ', chosen matching edge' : ''}`)}</title>
                          <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="transparent" strokeWidth="18" />
                          <rect x={(x1 + x2) / 2 - 9} y={(y1 + y2) / 2 - 9} width="18" height="18" fill="transparent" />
                          <line
                            x1={x1}
                            y1={y1}
                            x2={x2}
                            y2={y2}
                            stroke={color}
                            strokeWidth={isMatching || active ? 4 : 2.3}
                            strokeDasharray={!frame.covered[id] && !active ? '11 6' : undefined}
                            pointerEvents="none"
                          />
                        </g>
                      )
                    })}
                    {points.map(([x, y], i) => {
                      const selected = frame.cover.includes(i),
                        [cx, cy] = defaultGraph ? chipPositions[i] : [x - 50, y > 245 ? y + 29 : y - 76]
                      return (
                        <g
                          key={i}
                          className={`vc-vertex${selected ? ' vc-in-cover' : ''}`}
                          role="button"
                          tabIndex={0}
                          aria-label={tr(`Inspect vertex ${i}`)}
                          onClick={() => inspectVertex(i)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault()
                              inspectVertex(i)
                            }
                          }}
                        >
                          <title>{tr(`Vertex ${i}: degree ${run.degree[i]}, ${selected ? 'in cover' : 'not in cover'}`)}</title>
                          <rect x={x - 30} y={y - 30} width="60" height="60" fill="transparent" />
                          {selected && <circle cx={x} cy={y} r="29" fill="#ff8e9f" opacity=".5" filter="url(#vc-glow)" />}
                          <circle cx={x} cy={y} r="25" fill={selected ? 'url(#vc-selected)' : 'url(#vc-regular)'} stroke={selected ? '#ff6172' : '#318eff'} />
                          <text x={x} y={y + 7} textAnchor="middle" className="vc-node-label">
                            {i}
                          </text>
                          <g className="vc-degree">
                            <rect x={cx} y={cy} width="104" height="48" rx="7" />
                            <text x={cx + 52} y={cy + 19} textAnchor="middle">
                              {tr(`deg: ${run.degree[i]}`)}
                            </text>
                            <text x={cx + 52} y={cy + 37} textAnchor="middle">
                              {tr('in cover: ')}
                              <tspan fill={selected ? '#e6324b' : '#0b2168'}>{tr(selected ? 'Yes' : 'No')}</tspan>
                            </text>
                          </g>
                        </g>
                      )
                    })}
                  </svg>
                  <div className="vc-legend">
                    <div>
                      <i className="vc-legend-uncovered" />
                      {tr('Uncovered edge')}
                    </div>
                    <div>
                      <i className="vc-legend-matching" />
                      {tr('Matching edge (chosen)')}
                    </div>
                    <div>
                      <i className="vc-legend-covered" />
                      {tr('Covered edge')}
                    </div>
                    <div>
                      <i className="vc-legend-selected" />
                      {tr('Selected vertex (in cover)')}
                    </div>
                    <div>
                      <i className="vc-legend-regular" />
                      {tr('Regular vertex')}
                    </div>
                  </div>
                  {uncovered && frame.complete && (
                    <div className="vc-no-edges" role="status">
                      {tr('All edges are covered; no uncovered edges to display.')}
                    </div>
                  )}
                  {pending !== null && (
                    <div className="vc-pending" role="status">
                      {tr(`Selected edge (${run.graph.edges[pending].join(', ')}). Step approximation to add both endpoints.`)}
                    </div>
                  )}
                </div>
              </div>
              <div className="vc-controls">
                <button
                  className="vc-primary"
                  onClick={() => choose((frame.complete ? run.frames[0] : frame).remaining[0])}
                  disabled={run.graph.edges.length === 0}
                >
                  <Play size={16} fill="currentColor" />
                  {tr('Select edge')}
                </button>
                <button onClick={step} disabled={run.graph.edges.length === 0}>
                  <ChevronsRight size={21} />
                  {tr('Step approximation')}
                </button>
                <button onClick={reset}>
                  <RotateCcw size={18} />
                  {tr('Reset')}
                </button>
                <span className="vc-control-divider" />
                <label className="vc-switch">
                  <input type="checkbox" checked={matching} onChange={(e) => setMatching(e.target.checked)} />
                  <span />
                  {tr('Show matching')}
                </label>
                <label className="vc-switch">
                  <input type="checkbox" checked={uncovered} onChange={(e) => setUncovered(e.target.checked)} />
                  <span />
                  {tr('Show uncovered only')}
                </label>
              </div>
            </section>
            <aside className="vc-explanation">
              <Panel className="vc-how" title={tr('How it works')} icon={<Info size={20} />}>
                <ol>
                  {[
                    'Select an arbitrary uncovered edge (u, v).',
                    'Add both endpoints u and v to the vertex cover.',
                    'Mark all edges incident to u or v as covered.',
                    'Repeat until all edges are covered. The selected vertices form a 2-approximation of the minimum vertex cover.',
                  ].map((s, i) => (
                    <li key={s}>
                      <b>{i + 1}</b>
                      <p>{tr(s)}</p>
                    </li>
                  ))}
                </ol>
              </Panel>
              <Panel className="vc-insight" title={tr('Key insight')} icon={<Lightbulb size={22} />}>
                <p>
                  {tr(
                    'The set of chosen edges forms a maximal matching. Taking both endpoints of each matching edge gives a vertex cover with size at most 2 × OPT.',
                  )}
                </p>
              </Panel>
            </aside>
          </div>
          <div className="vc-bottom-grid">
            <div className="vc-lower-left">
              <div className="vc-state-grid">
                <Panel className="vc-state" title={tr('Algorithm state')} icon={<Network size={19} />}>
                  <div className="vc-history-scroll">
                    <table>
                      <thead>
                        <tr>
                          {['Step', 'Chosen edge (u, v)', 'Added vertices', 'Cover size', 'Uncovered edges', 'Status'].map((s) => (
                            <th key={s}>{tr(s)}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {run.frames.map((f, i) => (
                          <tr key={i} className={cursor === i ? 'vc-current' : ''}>
                            <td>
                              <button
                                aria-label={tr(`Show cover step ${i}`)}
                                onClick={() => {
                                  setCursor(i)
                                  setPending(null)
                                  setPlaying(false)
                                }}
                              >
                                {i}
                              </button>
                            </td>
                            <td>{f.edge === null ? '–' : `(${run.graph.edges[f.edge].join(', ')})`}</td>
                            <td>{f.added.length ? `{${f.added.join(', ')}}` : '–'}</td>
                            <td>{f.cover.length}</td>
                            <td>{f.remaining.length}</td>
                            <td className={f.complete ? 'vc-complete-cell' : ''}>{tr(f.complete ? 'Complete' : 'In progress')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Panel>
                <Panel
                  className={`vc-chosen${frame.cover.length > 5 ? ' vc-many' : ''}`}
                  title={tr('Chosen vertices (vertex cover)')}
                  icon={<LockKeyhole size={18} />}
                >
                  <div className="vc-chips">
                    {frame.cover.length ? (
                      frame.cover.map((v) => (
                        <button key={v} aria-label={tr(`Inspect chosen vertex ${v}`)} onClick={() => inspectVertex(v)}>
                          {v}
                        </button>
                      ))
                    ) : (
                      <span>{tr('No vertices selected')}</span>
                    )}
                  </div>
                  <strong>{tr(`Cover size: ${frame.cover.length}`)}</strong>
                  <p>{tr('(2-approximation)')}</p>
                </Panel>
              </div>
              <div className={`vc-result${frame.complete ? ' vc-finished' : ''}`} role="status">
                <span>
                  <CheckCircle2 size={31} />
                </span>
                <div>
                  <h2>{tr(frame.complete ? 'All edges are covered!' : 'Build the vertex cover step by step')}</h2>
                  <p>
                    {tr(
                      frame.complete
                        ? `The selected vertices {${frame.cover.join(', ')}} form a vertex cover of size ${frame.cover.length}.`
                        : `${frame.remaining.length} uncovered edges remain. Select an uncovered edge, then add both endpoints.`,
                    )}
                  </p>
                  <p>
                    {tr(
                      frame.complete
                        ? 'This is a 2-approximation of the minimum vertex cover.'
                        : `Chosen matching edges: ${frame.matching.length}; selected endpoints: ${frame.cover.length}.`,
                    )}
                  </p>
                </div>
              </div>
            </div>
            <aside className="vc-summary-stack">
              <Panel className="vc-summary" title={tr('Coverage summary')} icon={<BarChart3 size={20} />}>
                <dl>
                  {[
                    [tr('Total vertices (|V|)'), run.graph.vertices],
                    [tr('Total edges (|E|)'), run.graph.edges.length],
                    [tr('Chosen edges (matching)'), frame.matching.length],
                    [tr('Uncovered edges'), frame.remaining.length],
                    [tr('Covered edges'), frame.covered.filter(Boolean).length],
                  ].map(([s, n]) => (
                    <div key={s}>
                      <dt>{s}</dt>
                      <dd>{n}</dd>
                    </div>
                  ))}
                </dl>
              </Panel>
              <Panel className="vc-complexity" title={tr('Complexity')} icon={<BarChart3 size={20} />}>
                <p>
                  <b>{tr('Time: O(V + E)')}</b>
                </p>
                <p>
                  <b>{tr('Auxiliary/output space: O(V)')}</b>
                </p>
                <p>{tr('Scan each edge once, testing membership in a set.')}</p>
              </Panel>
            </aside>
          </div>
        </>
      ) : tab === 'Learn' ? (
        <div className="vc-learning">
          <Panel title={tr('From maximal matching to a vertex cover')} icon={<Network />}>
            <p>
              {tr(
                'A vertex cover touches every edge. A matching consists of edges with no shared endpoints. Select any uncovered edge and put both its endpoints in the cover. Every later chosen edge has two new endpoints, so chosen edges form a matching.',
              )}
            </p>
            <p>
              {tr(
                'When no uncovered edge remains, the matching is maximal: no additional edge can be added. Maximal means no extension is possible; maximum means largest possible. This algorithm needs only maximality.',
              )}
            </p>
            <h3>{tr('Why the factor two holds')}</h3>
            <p>
              {tr(
                'Every vertex cover, including an optimum, must include at least one endpoint of every matching edge. These edges are disjoint, so OPT ≥ |M|. We choose exactly two endpoints per edge: |C| = 2|M| ≤ 2OPT. If an edge were left uncovered, both endpoints would be free and the matching could be extended, contradicting maximality.',
              )}
            </p>
          </Panel>
          <Panel title={tr('Worked example and a tight bound')} icon={<Lightbulb />}>
            <p>
              {tr(
                'On the default graph, first choose (0, 1). Four edges remain uncovered. Choose (3, 4) next: the cover {0, 1, 3, 4} touches all eight edges. A minimum cover has size three, so the ratio is 4/3.',
              )}
            </p>
            <p>
              {tr(
                'For a star, choosing one edge selects the center and a leaf: size two. The center alone is optimal: size one. The ratio is exactly two. Try Star in the visualization and compare the two certificates in Experiments.',
              )}
            </p>
            <button
              onClick={() => {
                load(presets.star, 'star')
                setTab('Visualization')
              }}
            >
              {tr('Explore the tight star example')}
            </button>
            <h3>{tr('Cost and assumptions')}</h3>
            <p>
              {tr(
                'This is the unweighted vertex-cover algorithm for simple undirected graphs. A one-pass implementation with constant-time membership uses O(V + E) time and O(V) space. This teaching tool also stores trace snapshots and exhaustively finds an optimum for graphs of at most eight vertices; those extra operations are not part of the approximation algorithm.',
              )}
            </p>
          </Panel>
        </div>
      ) : tab === 'Code' ? (
        <Panel className="vc-code" title={tr('One-pass maximal-matching algorithm')} icon={<Network />}>
          <pre>
            <code>{`function vertexCover(vertices, edges) {
  const cover = new Set();
  const matching = [];
  for (const [u, v] of edges) {
    if (cover.has(u) || cover.has(v)) continue;
    matching.push([u, v]);
    cover.add(u);
    cover.add(v);
  }
  return { cover: [...cover], matching };
}
// Edge order may change the cover, but |cover| <= 2 * OPT.
// Initialization/output O(V), edge scan O(E), storage O(V).`}</code>
          </pre>
          <p>{tr('Skip an edge as soon as either endpoint is selected. Choosing an already covered edge would break the disjoint-matching proof.')}</p>
        </Panel>
      ) : tab === 'Practice' ? (
        <Panel className="vc-practice" title={tr('Predict the cover on a star')} icon={<Lightbulb />}>
          <p>{tr('A star has center 0 and five leaves. After choosing edge (0, 1), how many vertices are selected, and what is the minimum cover size?')}</p>
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
              <option value="2,1">{tr('Selected: 2; minimum: 1')}</option>
              <option value="6,1">{tr('Selected: 6; minimum: 1')}</option>
              <option value="2,2">{tr('Selected: 2; minimum: 2')}</option>
            </select>
          </label>
          <button
            onClick={() =>
              setFeedback(
                prediction === '2,1'
                  ? 'Correct. The center covers every edge; the algorithm also chooses one leaf, so its ratio is exactly two.'
                  : 'Try again: choosing both endpoints of one edge includes the center, which covers every other edge.',
              )
            }
          >
            {tr('Check prediction')}
          </button>
          {feedback && <p role="status">{tr(feedback)}</p>}
        </Panel>
      ) : (
        <div className="vc-experiments">
          <Panel title={tr('Explore matching order and the approximation guarantee')} icon={<Network />}>
            <p>{tr('The exact optimum is computed by exhaustive search for this small teaching graph. The approximation never uses it to choose an edge.')}</p>
            <div className="vc-experiment-controls">
              <button
                onClick={() => {
                  setDraft(JSON.stringify(run.graph, null, 2))
                  setModal('graph')
                }}
              >
                {tr('Edit graph JSON')}
              </button>
              <button onClick={() => reorder(false)}>{tr('Natural edge order')}</button>
              <button onClick={() => reorder(true)}>{tr('Reverse edge order')}</button>
              <button
                onClick={() => {
                  if (frame.complete) setCursor(0)
                  setPlaying(!playing)
                }}
              >
                {tr(playing ? 'Pause playback' : 'Play from current step')}
              </button>
              <button onClick={reset}>{tr('Restart trace')}</button>
              <button
                onClick={() => {
                  setCursor(run.defaultCursor)
                  setPlaying(false)
                  setPending(null)
                }}
              >
                {tr('Jump to final cover')}
              </button>
              <label>
                {tr('Playback speed')}
                <select value={speed} onChange={(e) => setSpeed(Number(e.target.value))}>
                  <option value={1400}>{tr('Slow')}</option>
                  <option value={700}>{tr('Normal')}</option>
                  <option value={100}>{tr('Fast')}</option>
                </select>
              </label>
            </div>
            <div className="vc-certificate">
              <p>{tr(`Current step: ${cursor}; cover {${frame.cover.join(', ')}}; uncovered edges: ${frame.remaining.length}.`)}</p>
              <p>
                {tr(
                  `Final cover size ${run.final.cover.length}; matching lower bound ${run.final.matching.length}; minimum cover {${run.optimum.join(', ')}} of size ${run.optimum.length}.`,
                )}
              </p>
              <p>
                {tr(
                  run.ratio === null
                    ? 'Edgeless graph: OPT = 0 and the empty cover is optimal.'
                    : `Approximation ratio: ${run.ratio.toFixed(3)}. Certificate: ${run.final.cover.length} = 2 × ${run.final.matching.length} ≤ 2 × ${run.optimum.length}.`,
                )}
              </p>
            </div>
            <div className="vc-edge-list">
              {run.graph.edges.map(([u, v], id) => (
                <button key={id} onClick={() => inspectEdge(id)}>
                  {tr(`Edge ${id}: (${u}, ${v}) — ${frame.covered[id] ? 'covered' : 'uncovered'}`)}
                </button>
              ))}
            </div>
            <button onClick={() => setTab('Visualization')}>{tr('Return to cover graph')}</button>
          </Panel>
          <Panel title={tr('Notes and preferences')} icon={<Bookmark />}>
            <label>
              {tr('Vertex cover notes')}
              <textarea aria-label={tr('Vertex cover notes')} value={notes} onChange={(e) => setNotes(e.target.value)} />
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
      <dialog ref={dialog} className="vc-dialog" onCancel={() => setModal(null)}>
        <button className="vc-close" aria-label={tr('Close vertex cover dialog')} onClick={() => setModal(null)}>
          <X size={20} />
        </button>
        {modal === 'graph' ? (
          <>
            <h2>{tr('Edit a simple undirected graph')}</h2>
            <p>{tr('Use 1–8 vertices numbered 0 to V−1 and up to 20 distinct edges. Self-loops and duplicate edges are rejected.')}</p>
            <label>
              {tr('Graph JSON')}
              <textarea
                aria-label={tr('Graph JSON')}
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
                  load(parseCoverGraph(draft))
                } catch (e) {
                  setError((e as Error).message)
                }
              }}
            >
              {tr('Apply custom graph')}
            </button>
          </>
        ) : modal === 'edge' && edge ? (
          <>
            <h2>{tr(`Edge (${edge.join(', ')})`)}</h2>
            <p>
              {tr(`Status: ${frame.covered[inspect] ? 'covered' : 'uncovered'}. Chosen matching edge: ${frame.matching.includes(inspect) ? 'Yes' : 'No'}.`)}
            </p>
            <p>{tr(`Endpoint degrees: ${edge[0]} → ${run.degree[edge[0]]}, ${edge[1]} → ${run.degree[edge[1]]}.`)}</p>
            {!frame.covered[inspect] || frame.complete ? (
              <button onClick={() => choose(inspect)}>{tr(frame.complete ? 'Restart with this edge' : 'Choose this edge')}</button>
            ) : (
              <p>{tr('This edge already has a selected endpoint. Choose an uncovered edge to extend the matching.')}</p>
            )}
          </>
        ) : modal === 'vertex' ? (
          <>
            <h2>{tr(`Vertex ${inspect}`)}</h2>
            <p>{tr(`Degree: ${run.degree[inspect]}. In cover: ${frame.cover.includes(inspect) ? 'Yes' : 'No'}.`)}</p>
            <p>{tr(`Incident edges: ${incident.length}. Covered: ${incident.filter((id) => frame.covered[id]).length}.`)}</p>
            <div className="vc-edge-list">
              {incident.map((id) => (
                <button key={id} onClick={() => inspectEdge(id)}>
                  {tr(`Inspect edge ${run.graph.edges[id].join('–')}`)}
                </button>
              ))}
            </div>
          </>
        ) : null}
      </dialog>
    </div>
  )
}
