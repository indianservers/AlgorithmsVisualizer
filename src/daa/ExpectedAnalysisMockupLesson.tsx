// @localized-render
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  Search,
  Bookmark,
  Check,
  Play,
  Pause,
  RotateCw,
  Box,
  ChartNoAxesColumnIncreasing,
  Sigma,
  Dices,
  Settings,
  Lightbulb,
  CheckCircle2,
  Hourglass,
  FileText,
  X,
} from 'lucide-react'
import { AccountControl } from '../account/AccountControl'
import { LanguageSelector } from '../i18n/LanguageSelector'
import { allModules } from '../algorithms'
import { algorithmPath } from '../utils/routing'
import { tx, useLocaleRender } from '../i18n/render'
import { persistentString, usePersistentState } from '../hooks/usePersistentState'
import { MockupTabs, type MockupTab, type MockupPageProps } from './MockupLessonChrome'
import {
  analysisExample,
  simulationExample,
  runAnalysisLesson,
  runAnalysisSimulation,
  parseAnalysisInput,
  parseAnalysisSimulation,
  indicatorProbability,
  type AnalysisArrayType,
} from './expectedAnalysisLessonModel'
import './expected-analysis-mockup.css'
const tr = (s: string) => tx(s, 'studios'),
  tabs: MockupTab[] = ['Learn', 'Visualization', 'Code', 'Practice', 'Experiments', 'Notes'],
  example = runAnalysisLesson(analysisExample),
  simulation = runAnalysisSimulation(simulationExample),
  phaseNames = ['Choose pivot', 'Partition into < pivot and > pivot', 'Recursively sort subarrays', 'Count comparisons'],
  phaseLabels = ['Choose pivot at random', 'Partition into < pivot and > pivot', 'Recursively sort subarrays', 'Count comparisons'],
  sizes = [1, 2, 4, 8, 16, 32, 50, 64, 128],
  trialOptions = [10, 100, 1000, 5000],
  f = (n: number) => n.toLocaleString('en-US'),
  one = (n: number) => n.toFixed(1)
function Panel({ title, icon, children, className = '' }: { title: string; icon: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`ea-panel ${className}`}>
      <header>
        <span className="ea-icon">{icon}</span>
        <h2>{title}</h2>
      </header>
      {children}
    </section>
  )
}
export function ExpectedAnalysisMockupLesson(props: MockupPageProps) {
  useLocaleRender()
  const navigate = useNavigate(),
    [tab, setTab] = useState<MockupTab>('Visualization'),
    [demo, setDemo] = useState(example),
    [cursor, setCursor] = useState(0),
    [playing, setPlaying] = useState(false),
    [speed, setSpeed] = useState(50),
    [sizeDraft, setSizeDraft] = useState('8'),
    [typeDraft, setTypeDraft] = useState<AnalysisArrayType>('random'),
    [customDraft, setCustomDraft] = useState(example.values.join(', ')),
    [demoError, setDemoError] = useState(''),
    [stats, setStats] = useState(simulation),
    [trialsDraft, setTrialsDraft] = useState('1000'),
    [simulationSize, setSimulationSize] = useState('50'),
    [seedDraft, setSeedDraft] = useState('42'),
    [animateOne, setAnimateOne] = useState(false),
    [simulationError, setSimulationError] = useState(''),
    [query, setQuery] = useState(''),
    [prediction, setPrediction] = useState(''),
    [feedback, setFeedback] = useState(''),
    [iDraft, setIDraft] = useState('1'),
    [jDraft, setJDraft] = useState('8'),
    [modal, setModal] = useState<{ type: 'bin' | 'stats' | 'indicator' | 'expectation' | 'node' | 'guarantees'; index: number } | null>(null),
    [notes, setNotes] = usePersistentState('algodrishti-expected-analysis-notes', '', persistentString),
    [practice, setPractice] = usePersistentState('algodrishti-expected-analysis-practice', '', persistentString),
    [localTheme, setLocalTheme] = useState(() => localStorage.getItem('algodrishti-theme') ?? 'light'),
    dialog = useRef<HTMLDialogElement>(null),
    search = useRef<HTMLInputElement>(null),
    diagram = useRef<HTMLDivElement>(null)
  const frame = demo.frames[cursor],
    node = demo.nodes[frame.node],
    theme = props.theme ?? localTheme,
    done = practice === 'complete',
    text = query.trim().toLowerCase(),
    score = (s: string) => (s.toLowerCase() === text ? 0 : s.toLowerCase().includes(text) ? 1 : 2),
    topics = text
      ? allModules
          .filter((m) => `${m.name} ${m.summary}`.toLowerCase().includes(text))
          .sort((a, b) => score(a.name) - score(b.name))
          .slice(0, 5)
      : [],
    array = frame.phase === 3 ? node.sorted : node.values,
    pivotIndex = node.pivot ? array.findIndex((k) => k.id === node.pivot!.id) : -1,
    less = frame.phase >= 2 ? [...node.less].sort((a, b) => a.value - b.value) : node.less,
    greater = frame.phase >= 2 ? [...node.greater].sort((a, b) => a.value - b.value) : node.greater,
    longest = Math.max(...node.values.map((k) => String(k.value).length)),
    cellWidth = Math.max(37, longest * 9 + 10),
    rightCellWidth = Math.max(40, longest * 9 + 8),
    leftCellWidth = Math.max(46, rightCellWidth),
    leftGap = leftCellWidth + 12,
    rightGap = rightCellWidth + 6,
    leftWidth = Math.max(208, less.length * leftGap + 24),
    rightWidth = Math.max(209, greater.length * rightGap + 24),
    arrayWidth = array.length * cellWidth,
    svgWidth = Math.max(590, arrayWidth + 150, leftWidth + rightWidth + 173),
    arrayX = 130,
    pivotX = pivotIndex >= 0 ? arrayX + pivotIndex * cellWidth + cellWidth / 2 : svgWidth / 2,
    pivotWidth = Math.max(39, String(node.pivot?.value ?? 0).length * 9 + 10),
    groupY = 117,
    centerX = leftWidth + 86,
    rightX = leftWidth + 149,
    histogram = stats.histogram,
    first = histogram[0].low,
    last = histogram.at(-1)!.high + 1,
    span = last - first,
    peak = Math.max(...histogram.map((b) => b.count)),
    unit = 10 ** Math.floor(Math.log10(Math.max(1, peak / 4))),
    yMax = Math.max(4, Math.ceil(peak / (4 * unit)) * 4 * unit),
    plotX = (v: number) => 50 + ((v - first) / span) * 265,
    plotY = (v: number) => 158 - (v / yMax) * 146,
    pairI = Number(iDraft),
    pairJ = Number(jDraft),
    pairValid = Number.isInteger(pairI) && Number.isInteger(pairJ) && pairI >= 1 && pairI < pairJ && pairJ <= demo.values.length,
    pairProbability = pairValid ? indicatorProbability(pairI, pairJ) : 0,
    bin = modal?.type === 'bin' ? histogram[modal.index] : null,
    selectedNode = modal?.type === 'node' ? demo.nodes[modal.index] : null,
    simulationPending = simulationSize !== String(stats.input.size) || trialsDraft !== String(stats.input.trials) || seedDraft !== String(stats.input.seed)
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
      reveal = () => {
        if (media.matches) {
          const nav = document.querySelector<HTMLElement>('.app-shell .global-sidebar .sidebar-navigation')
          if (nav) nav.scrollTop = 0
        }
      }
    reveal()
    media.addEventListener('change', reveal)
    return () => media.removeEventListener('change', reveal)
  }, [])
  useEffect(() => {
    if (!playing) return
    const timer = window.setInterval(
      () =>
        setCursor((c) => {
          if (c >= demo.frames.length - 2) {
            setPlaying(false)
            return demo.frames.length - 1
          }
          return c + 1
        }),
      1600 - speed * 14,
    )
    return () => window.clearInterval(timer)
  }, [playing, speed, demo])
  function changeTab(next: MockupTab) {
    setPlaying(false)
    setTab(next)
  }
  function loadDemo(size: string, type: AnalysisArrayType, seed: string, values = customDraft, animate = false) {
    const next = runAnalysisLesson(parseAnalysisInput(size, type, seed, values))
    setDemo(next)
    setSizeDraft(String(next.input.size))
    setTypeDraft(type)
    setCustomDraft(next.values.join(', '))
    setCursor(0)
    setPlaying(animate && next.frames.length > 1)
    setDemoError('')
    setIDraft('1')
    setJDraft(String(next.values.length))
    if (diagram.current) diagram.current.scrollLeft = 0
  }
  function editDemo(size: string, type: AnalysisArrayType) {
    setPlaying(false)
    setSizeDraft(size)
    setTypeDraft(type)
    try {
      loadDemo(size, type, String(stats.input.seed))
    } catch (e) {
      setDemoError((e as Error).message)
    }
  }
  function simulate(patch: Partial<{ size: string; trials: string; seed: string }> = {}) {
    setPlaying(false)
    try {
      const input = parseAnalysisSimulation(
          patch.size ?? simulationSize,
          patch.trials ?? trialsDraft,
          patch.seed ?? seedDraft,
          crypto.getRandomValues(new Uint32Array(1))[0],
        ),
        next = runAnalysisSimulation(input)
      setStats(next)
      setSimulationSize(String(input.size))
      setTrialsDraft(String(input.trials))
      setSeedDraft(String(input.seed))
      setSimulationError('')
      loadDemo(
        animateOne ? String(input.size) : String(demo.input.size),
        animateOne ? 'random' : demo.input.type,
        String(input.seed),
        demo.values.join(', '),
        animateOne,
      )
    } catch (e) {
      setSimulationError((e as Error).message)
    }
  }
  function reset() {
    setDemo(example)
    setCursor(0)
    setSizeDraft('8')
    setTypeDraft('random')
    setCustomDraft(example.values.join(', '))
    setStats(simulation)
    setTrialsDraft('1000')
    setSimulationSize('50')
    setSeedDraft('42')
    setAnimateOne(false)
    setPlaying(false)
    setDemoError('')
    setSimulationError('')
    setIDraft('1')
    setJDraft('8')
    if (diagram.current) diagram.current.scrollLeft = 0
  }
  function phase(index: number) {
    const at = demo.frames.findIndex((f) => f.node === node.id && f.phase === index)
    if (at >= 0) {
      setCursor(at)
      setPlaying(false)
    }
  }
  function inspect(type: NonNullable<typeof modal>['type'], index = 0) {
    setPlaying(false)
    setModal({ type, index })
  }
  function keyAction(e: React.KeyboardEvent, action: () => void) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      action()
    }
  }
  const code = `function randomizedQuickSort(A, randomIndex) {
  if (A.length < 2) return { sorted: A, comparisons: 0 };
  const p = randomIndex(A.length);
  const pivot = A[p], less = [], greater = [];
  for (let k = 0; k < A.length; k++) {
    if (k === p) continue;
    (A[k] < pivot ? less : greater).push(A[k]);
  }
  const L = randomizedQuickSort(less, randomIndex);
  const R = randomizedQuickSort(greater, randomIndex);
  return {
    sorted: [...L.sorted, pivot, ...R.sorted],
    comparisons: A.length - 1 + L.comparisons + R.comparisons
  };
} // Count one key comparison for each non-pivot key.`
  return (
    <div className="mom-page target-visual expected-analysis-page" data-target="45">
      <div className="ea-toolbar">
        <button className="ea-back" aria-label={tr('Return to bin packing')} onClick={() => navigate('/daa-extensions/bin-packing')}>
          <ArrowLeft size={17} />
        </button>
        <div className="ea-search">
          <Search size={18} />
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
            <div className="ea-search-results">
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
          {props.completed.includes(props.module.id) ? <Check size={16} /> : <Bookmark size={16} />}
          <span>{tr(props.completed.includes(props.module.id) ? 'Studied' : 'Mark studied')}</span>
        </button>
        <AccountControl showLanguage={false} />
      </div>
      <header className="ea-hero">
        <button className="ea-back" aria-label={tr('Back to DAA extensions')} onClick={() => navigate('/daa-extensions')}>
          <ArrowLeft size={21} />
        </button>
        <div className="ea-heading">
          <div>
            <h1>{tr('Expected and Randomized Analysis')}</h1>
            <span>{tr('DAA Extension')}</span>
          </div>
          <p>{tr('Analyze randomized algorithms using indicator variables, expectations and simulations.')}</p>
        </div>
        <div className="ea-progress" title={tr('Practice completion')}>
          <span>{tr(done ? '1 of 1 section' : '0 of 1 section')}</span>
          <div>
            <i style={{ width: done ? '100%' : '0%' }} />
            {tabs.slice(0, 5).map((s, i) => (
              <button
                key={s}
                className={done || i === 0 ? 'ea-seen' : ''}
                style={{ left: `${i === 0 ? 0 : 46.5 + (i - 1) * 16.7}%` }}
                aria-label={tr(`Open ${s} section`)}
                onClick={() => changeTab(s)}
              />
            ))}
          </div>
        </div>
        <button className="ea-primary ea-practice-start" onClick={() => changeTab('Practice')}>
          {tr('Start Practice')}
          <ArrowRight size={20} />
        </button>
      </header>
      <MockupTabs tabs={tabs} active={tab} onChange={changeTab} />
      {tab === 'Visualization' && (
        <>
          <div className="ea-top-grid">
            <Panel title={tr('Randomized Quicksort — Step by Step')} icon={<Box />} className={`ea-quick ${typeDraft === 'custom' ? 'ea-custom-quick' : ''}`}>
              <p className="ea-quick-caption">
                {tr('Choose a pivot uniformly at random and partition the array. Explore how randomness affects comparisons and running time.')}
              </p>
              <div className="ea-demo-controls">
                <label>
                  {tr('Array size (n)')}
                  <select aria-label={tr('Quicksort array size')} value={sizeDraft} onChange={(e) => editDemo(e.target.value, typeDraft)}>
                    {[...new Set([...sizes, Number(sizeDraft)])]
                      .sort((a, b) => a - b)
                      .map((n) => (
                        <option key={n}>{n}</option>
                      ))}
                  </select>
                </label>
                <label>
                  {tr('Array type')}
                  <select aria-label={tr('Quicksort array type')} value={typeDraft} onChange={(e) => editDemo(sizeDraft, e.target.value as AnalysisArrayType)}>
                    <option value="random">{tr('Random')}</option>
                    <option value="sorted">{tr('Sorted')}</option>
                    <option value="reverse">{tr('Reverse')}</option>
                    <option value="custom">{tr('Custom')}</option>
                  </select>
                </label>
                <label className="ea-speed">
                  {tr('Animation speed')}
                  <span>
                    {tr('Slow')}
                    <input
                      aria-label={tr('Quicksort animation speed')}
                      type="range"
                      min="0"
                      max="100"
                      value={speed}
                      onChange={(e) => setSpeed(Number(e.target.value))}
                    />
                    {tr('Fast')}
                  </span>
                </label>
              </div>
              <div className="ea-quick-body">
                <div ref={diagram} className="ea-diagram-scroll">
                  <svg width={svgWidth} height="184" viewBox={`0 0 ${svgWidth} 184`} role="img" aria-label={tr('Randomized quicksort partition diagram')}>
                    <defs>
                      {[
                        ['purple', '#8442ff'],
                        ['red', '#ff5263'],
                        ['green', '#16b779'],
                      ].map(([name, color]) => (
                        <marker key={name} id={`ea-arrow-${name}`} markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
                          <path d="M0,0 L7,3.5 L0,7" fill={color} />
                        </marker>
                      ))}
                    </defs>
                    {node.pivot && (
                      <>
                        <text className="ea-pivot-caption" x={pivotX} y="14" textAnchor="middle">
                          {tr('Pivot (randomly chosen)')}
                        </text>
                        <path d={`M${pivotX},20 V31`} stroke="#087cff" markerEnd="url(#ea-arrow-purple)" />
                      </>
                    )}
                    {array.map((key, i) => (
                      <g
                        role="button"
                        tabIndex={0}
                        className={`ea-array-key ${key.id === node.pivot?.id ? 'ea-pivot-key' : ''}`}
                        key={key.id}
                        aria-label={`${tr('Inspect key')} ${key.value}`}
                        onClick={() => inspect('node', node.id)}
                        onKeyDown={(e) => keyAction(e, () => inspect('node', node.id))}
                      >
                        <rect x={arrayX + i * cellWidth} y="37" width={cellWidth} height="37" rx="6" />
                        <text x={arrayX + i * cellWidth + cellWidth / 2} y="61" textAnchor="middle">
                          {key.value}
                        </text>
                      </g>
                    ))}
                    {node.pivot ? (
                      <>
                        <path
                          d={`M${pivotX - 23},77 Q${leftWidth},95 ${32 + leftWidth / 2},112`}
                          fill="none"
                          stroke="#8743ff"
                          strokeWidth="1.7"
                          markerEnd="url(#ea-arrow-purple)"
                        />
                        <path d={`M${pivotX},79 L${centerX},113`} fill="none" stroke="#ff5263" strokeWidth="1.7" markerEnd="url(#ea-arrow-red)" />
                        <path
                          d={`M${pivotX + 23},77 Q${rightX + 30},95 ${rightX + rightWidth / 2},112`}
                          fill="none"
                          stroke="#16b779"
                          strokeWidth="1.7"
                          markerEnd="url(#ea-arrow-green)"
                        />
                        <text className="ea-less-caption" x="80" y="112">
                          {tr('Elements <')} {node.pivot.value}
                        </text>
                        <text className="ea-greater-caption" x={rightX + 78} y="112">
                          {tr('Elements >')} {node.pivot.value}
                        </text>
                        <rect className="ea-less-box" x="32" y={groupY} width={leftWidth} height="51" rx="8" />
                        {less.length ? (
                          less.map((k, i) => (
                            <g key={k.id}>
                              <rect className="ea-less-key" x={54 + i * leftGap} y="123" width={leftCellWidth} height="38" rx="6" />
                              <text className="ea-less-value" x={54 + leftCellWidth / 2 + i * leftGap} y="148" textAnchor="middle">
                                {k.value}
                              </text>
                            </g>
                          ))
                        ) : (
                          <text className="ea-less-value" x={32 + leftWidth / 2} y="148" textAnchor="middle">
                            {'∅'}
                          </text>
                        )}
                        <rect className="ea-final-pivot" x={centerX - pivotWidth / 2} y="123" width={pivotWidth} height="38" rx="6" />
                        <text className="ea-final-pivot-value" x={centerX} y="148" textAnchor="middle">
                          {node.pivot.value}
                        </text>
                        <rect className="ea-greater-box" x={rightX} y={groupY} width={rightWidth} height="51" rx="8" />
                        {greater.length ? (
                          greater.map((k, i) => (
                            <g key={k.id}>
                              <rect className="ea-greater-key" x={rightX + 14 + i * rightGap} y="123" width={rightCellWidth} height="38" rx="6" />
                              <text className="ea-greater-value" x={rightX + 14 + rightCellWidth / 2 + i * rightGap} y="148" textAnchor="middle">
                                {k.value}
                              </text>
                            </g>
                          ))
                        ) : (
                          <text className="ea-greater-value" x={rightX + rightWidth / 2} y="148" textAnchor="middle">
                            {'∅'}
                          </text>
                        )}
                      </>
                    ) : (
                      <text className="ea-base-case" x="295" y="142" textAnchor="middle">
                        {tr('Base case: already sorted, zero comparisons.')}
                      </text>
                    )}
                  </svg>
                </div>
                <div className="ea-steps">
                  <h3>{tr(`Step ${frame.phase + 1}: ${phaseNames[frame.phase]}`)}</h3>
                  {phaseLabels.map((s, i) => (
                    <button key={s} aria-label={tr(s)} aria-pressed={frame.phase === i} disabled={!node.pivot && i !== 3} onClick={() => phase(i)}>
                      <span>{i + 1}</span>
                      {tr(s)}
                    </button>
                  ))}
                </div>
              </div>
              {typeDraft === 'custom' && (
                <label className="ea-custom-values">
                  {tr('Distinct custom keys')}
                  <input
                    aria-label={tr('Distinct custom keys')}
                    value={customDraft}
                    onChange={(e) => {
                      setCustomDraft(e.target.value)
                      setPlaying(false)
                    }}
                  />
                  <button
                    onClick={() => {
                      try {
                        loadDemo(sizeDraft, 'custom', String(stats.input.seed))
                      } catch (e) {
                        setDemoError((e as Error).message)
                      }
                    }}
                  >
                    {tr('Apply array')}
                  </button>
                </label>
              )}
              {demoError && (
                <p role="alert" className="ea-error">
                  {tr(demoError)}
                </p>
              )}
            </Panel>
            <Panel title={tr('Distribution of Comparisons (Monte Carlo)')} icon={<ChartNoAxesColumnIncreasing />} className="ea-distribution">
              <div className="ea-chart-controls">
                <label>
                  {tr('Trials')}
                  <select aria-label={tr('Histogram trials')} value={trialsDraft} onChange={(e) => simulate({ trials: e.target.value })}>
                    {[...new Set([...trialOptions, Number(trialsDraft)])].map((n) => (
                      <option key={n}>{n}</option>
                    ))}
                  </select>
                </label>
                <label>
                  {tr('Seed')}
                  <select aria-label={tr('Histogram seed')} value={seedDraft} onChange={(e) => simulate({ seed: e.target.value })}>
                    {[...new Set(['42', '7', '123', '2026', seedDraft])].map((s) => (
                      <option key={s} value={s}>
                        {s || tr('Auto')}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="ea-distribution-body">
                <svg viewBox="0 0 330 200" role="img" aria-label={tr('Histogram of seeded quicksort comparison counts')}>
                  {[0, 1, 2, 3, 4].map((t) => (
                    <g key={t}>
                      <line className="ea-grid" x1="50" x2="315" y1={plotY((t * yMax) / 4)} y2={plotY((t * yMax) / 4)} />
                      <text className="ea-tick" x="39" y={plotY((t * yMax) / 4) + 4} textAnchor="end">
                        {(t * yMax) / 4}
                      </text>
                    </g>
                  ))}
                  {[0, 1, 2, 3, 4, 5].map((t) => (
                    <g key={t}>
                      <line className="ea-grid" x1={50 + t * 53} x2={50 + t * 53} y1="12" y2="158" />
                      <text className="ea-tick" x={50 + t * 53} y="180" textAnchor="middle">
                        {Math.round(first + (span * t) / 5)}
                      </text>
                    </g>
                  ))}
                  {histogram.map((b, i) => (
                    <g
                      className="ea-histogram-bin"
                      key={b.low}
                      role="button"
                      tabIndex={0}
                      aria-label={`${tr('Inspect histogram interval')} ${b.low} ${b.high}`}
                      onClick={() => inspect('bin', i)}
                      onKeyDown={(e) => keyAction(e, () => inspect('bin', i))}
                    >
                      <title>{`${b.low}–${b.high}: ${b.count} ${tr('trials')}`}</title>
                      <rect x={plotX(b.low) + 0.6} y="12" width={Math.max(1, 265 / histogram.length - 1.2)} height="146" fill="transparent" />
                      <rect
                        className="ea-hist-bar"
                        x={plotX(b.low) + 0.6}
                        y={plotY(b.count)}
                        width={Math.max(1, 265 / histogram.length - 1.2)}
                        height={158 - plotY(b.count)}
                      />
                    </g>
                  ))}
                  <line className="ea-axis" x1="50" x2="315" y1="158" y2="158" />
                  <line className="ea-axis" x1="50" x2="50" y1="12" y2="158" />
                  <text className="ea-axis-label" x="186" y="198" textAnchor="middle">
                    {tr('Number of comparisons')}
                  </text>
                  <text className="ea-axis-label" transform="translate(12 85) rotate(-90)" textAnchor="middle">
                    {tr('Frequency')}
                  </text>
                </svg>
                <button className="ea-stats" aria-label={tr('Inspect simulation statistics')} onClick={() => inspect('stats')}>
                  <dl>
                    {[
                      [tr('Trials'), f(stats.input.trials)],
                      [tr('Mean'), one(stats.mean)],
                      [tr('Std. Dev.'), one(stats.stddev)],
                      [tr('Min'), String(stats.min)],
                      [tr('Max'), String(stats.max)],
                    ].map(([label, value]) => (
                      <div key={label}>
                        <dt>{label}</dt>
                        <dd>{value}</dd>
                      </div>
                    ))}
                  </dl>
                </button>
              </div>
            </Panel>
          </div>
          <div className="ea-middle-grid">
            <Panel title={tr('Indicator Variables and Expectation')} icon={<Sigma />} className="ea-indicator">
              <p>{tr('Let Xᵢⱼ be the indicator that elements i and j are compared (in randomized quicksort).')}</p>
              <div className="ea-equations">
                <button className="ea-indicator-card" aria-label={tr('Inspect indicator-variable probability')} onClick={() => inspect('indicator')}>
                  <b>
                    <Hourglass size={16} />
                    {tr('Indicator Variable')}
                  </b>
                  <div className="ea-indicator-definition">
                    <i>{'Xᵢⱼ = '}</i>
                    <span>{'{'}</span>
                    <div>
                      <p>
                        {'1  '}
                        {tr('if i and j are compared')}
                      </p>
                      <p>
                        {'0  '}
                        {tr('otherwise')}
                      </p>
                    </div>
                  </div>
                  <p>
                    {'E[Xᵢⱼ] = '}
                    {tr('P(i and j are compared)')}
                  </p>
                </button>
                <button className="ea-expectation-card" aria-label={tr('Inspect total expected comparisons')} onClick={() => inspect('expectation')}>
                  <b>
                    <Hourglass size={16} />
                    {tr('Total Expected Comparisons')}
                  </b>
                  <div>
                    {'E[C] = '}
                    <span className="ea-sum">{'∑'}</span>
                    {'E[Xᵢⱼ] = '}
                    <span className="ea-sum">{'∑'}</span>
                    <span className="ea-fraction">
                      <span>{'2'}</span>
                      <span>{'j − i + 1'}</span>
                    </span>
                  </div>
                  <small>{'i<j'}</small>
                  <p>{'= O(n log n)'}</p>
                </button>
              </div>
            </Panel>
            <Panel title={tr('Analysis Comparison')} icon={<ChartNoAxesColumnIncreasing />} className="ea-comparison">
              <p>{tr('Different ways to analyze randomized algorithms.')}</p>
              <div className="ea-comparison-scroll">
                <table>
                  <thead>
                    <tr>
                      {['Aspect', 'Randomized Analysis', 'Average-Case Analysis'].map((s) => (
                        <th key={s}>{tr(s)}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ['Focus', 'Fix input, average over random choices', 'Fix algorithm, average over input distribution'],
                      ['Example', 'Randomized quicksort', 'Deterministic quicksort'],
                      ['Result', 'Expected #comparisons E[C] = O(n log n)', 'Expected #comparisons E[C] = O(n log n) (under random input)'],
                      ['Probability over', 'Algorithm’s random bits', 'Input distribution'],
                      ['Guarantee', 'Bounded expectation', 'Depends on input model'],
                    ].map((row) => (
                      <tr key={row[0]}>
                        {row.map((s, i) =>
                          i === 0 ? (
                            <th key={s}>{tr(s)}</th>
                          ) : (
                            <td key={s}>
                              {row[0] === 'Result' ? (
                                <>
                                  {tr('Expected #comparisons')}
                                  <br />
                                  {tr(s.replace('Expected #comparisons ', ''))}
                                </>
                              ) : (
                                tr(s)
                              )}
                            </td>
                          ),
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Panel>
          </div>
          <div className="ea-third-grid">
            <Panel title={tr('Monte Carlo vs Las Vegas')} icon={<Dices />} className="ea-guarantees">
              <p>{tr('Two types of randomized algorithms with different guarantees.')}</p>
              <div className="ea-guarantee-cards">
                <button className="ea-monte" aria-label={tr('Inspect Monte Carlo guarantee')} onClick={() => inspect('guarantees', 0)}>
                  <Dices />
                  <div>
                    <b>{tr('Monte Carlo Algorithm')}</b>
                    <p>{tr('May have a bounded error probability. Gives an answer (possibly incorrect) with high probability.')}</p>
                    <strong>{'P(error) ≤ ε'}</strong>
                    <small>{tr('Example: randomized primality testing.')}</small>
                  </div>
                </button>
                <button className="ea-vegas" aria-label={tr('Inspect Las Vegas guarantee')} onClick={() => inspect('guarantees', 1)}>
                  <Settings />
                  <div>
                    <b>{tr('Las Vegas Algorithm')}</b>
                    <p>{tr('Always returns a correct answer but has random running time.')}</p>
                    <strong>{'P(correct) = 1'}</strong>
                    <small>{tr('Example: randomized quicksort, randomized selection.')}</small>
                  </div>
                </button>
              </div>
            </Panel>
            <Panel title={tr('Run Simulation')} icon={<Settings />} className="ea-simulation">
              <p>{tr('Run multiple trials to observe the distribution of comparisons.')}</p>
              <div className="ea-simulation-fields">
                <label>
                  {tr('Number of trials')}
                  <select aria-label={tr('Simulation number of trials')} value={trialsDraft} onChange={(e) => setTrialsDraft(e.target.value)}>
                    {[...new Set([...trialOptions, Number(trialsDraft)])].map((n) => (
                      <option key={n}>{n}</option>
                    ))}
                  </select>
                </label>
                <label>
                  {tr('Array size (n)')}
                  <select aria-label={tr('Simulation array size')} value={simulationSize} onChange={(e) => setSimulationSize(e.target.value)}>
                    {sizes.map((n) => (
                      <option key={n}>{n}</option>
                    ))}
                  </select>
                </label>
                <label>
                  {tr('Seed (optional)')}
                  <input aria-label={tr('Simulation seed')} value={seedDraft} onChange={(e) => setSeedDraft(e.target.value)} />
                </label>
              </div>
              <div className="ea-simulation-actions">
                <button className="ea-primary" onClick={() => simulate()}>
                  <Play size={18} fill="currentColor" />
                  {tr('Run Monte Carlo Simulation')}
                </button>
                <label>
                  <input type="checkbox" checked={animateOne} onChange={(e) => setAnimateOne(e.target.checked)} />
                  {tr('Animate one run')}
                </label>
                <button className="ea-reset" onClick={reset}>
                  <RotateCw size={18} />
                  {tr('Reset')}
                </button>
              </div>
              {simulationPending && !simulationError && (
                <p className="ea-pending" role="status">
                  {tr('Parameter changes are pending. Run the simulation to update the histogram and statistics.')}
                </p>
              )}
              {simulationError && (
                <p className="ea-error" role="alert">
                  {tr(simulationError)}
                </p>
              )}
            </Panel>
          </div>
          <div className="ea-bottom-grid">
            <Panel title={tr('Key Takeaways')} icon={<Lightbulb />} className="ea-takeaways">
              <ul>
                {[
                  'Use indicator variables to compute expected number of comparisons.',
                  'For randomized quicksort, E[C] = Σᵢ<ⱼ 2/(j − i + 1) = O(n log n).',
                  'Randomized analysis fixes the input and averages over random choices.',
                  'Monte Carlo may have bounded error; Las Vegas always correct.',
                  'Expected bounds are over a family of inputs, not a single run.',
                ].map((s, i) => (
                  <li key={s}>{tr(i === 4 ? 'Expected bounds average over random choices; a single run may be slower.' : s)}</li>
                ))}
              </ul>
            </Panel>
            <Panel title={tr('Correctness')} icon={<CheckCircle2 />} className="ea-correctness">
              <ul>
                {[
                  'Randomized quicksort produces the same partitioning logic as deterministic quicksort; hence it is always correct.',
                  'Correctness is independent of the randomness source.',
                  'Linearity requires no independence between comparison indicators.',
                ].map((s) => (
                  <li key={s}>{tr(s)}</li>
                ))}
              </ul>
            </Panel>
            <Panel title={tr('Time Complexity')} icon={<ChartNoAxesColumnIncreasing />} className="ea-complexity">
              <ul>
                {[
                  'Expected number of comparisons: O(n log n).',
                  'Same asymptotic bound as average-case analysis under random input.',
                  'Worst case remains O(n²); expectations are not per-run guarantees.',
                ].map((s) => (
                  <li key={s}>{tr(s)}</li>
                ))}
              </ul>
            </Panel>
          </div>
        </>
      )}
      {tab === 'Learn' && (
        <div className="ea-learning">
          <Panel title={tr('What is random in the analysis?')} icon={<Dices />}>
            <p>
              {tr(
                'Randomized analysis fixes one input and averages over the algorithm’s random choices. Average-case analysis fixes an algorithm and assumes a probability distribution over inputs. These are different sources of randomness. The simulator keeps a distinct-key array fixed while repeatedly choosing random pivots.',
              )}
            </p>
            <p>
              {tr(
                'Randomized quicksort is a Las Vegas algorithm: every pivot choice still sorts correctly, but its number of comparisons varies. The histogram is a Monte Carlo estimate of that running-cost distribution; it does not turn quicksort into a Monte Carlo algorithm.',
              )}
            </p>
            <p>
              {tr(
                'The default eight-key worked example is fixed. Other Random arrays use a reproducible fixed shuffle. The seed controls pivots, so changing the seed keeps the input fixed. Seeded pseudorandom trials are experiments, not a proof of the expectation formula.',
              )}
            </p>
          </Panel>
          <Panel title={tr('Worked example: pivot 5')} icon={<Box />}>
            <p>
              {tr(
                'The eight distinct keys [7,2,9,1,5,8,3,6] choose pivot 5 with seed 42. Seven non-pivot keys are compared once with 5. The less-than side is [2,1,3], and the greater-than side is [7,9,8,6]. Recursively sorting both sides yields [1,2,3,5,6,7,8,9].',
              )}
            </p>
            <p>
              {tr(
                'Counting comparisons means counting one key-versus-pivot comparison for each non-pivot element in each partition. It excludes swaps, loop tests and random-number generation. The lower groups are previews during the Choose pivot step; stages 2 and 3 reveal partitioning and sorted child results.',
              )}
            </p>
            <button
              className="ea-primary"
              onClick={() => {
                loadDemo('8', 'random', '42')
                changeTab('Visualization')
              }}
            >
              {tr('Explore the worked example')}
            </button>
          </Panel>
          <Panel title={tr('Derive the expected comparison count')} icon={<Sigma />}>
            <p>
              {tr(
                'Number keys by sorted rank, 1 through n. Define Xᵢⱼ = 1 when ranks i and j are compared and 0 otherwise. They are compared exactly when the first pivot selected from ranks i through j is one of the two endpoints. Thus P(Xᵢⱼ = 1) = 2/(j−i+1). This assumes distinct keys and uniform pivot selection.',
              )}
            </p>
            <p>
              {tr(
                'The total C equals Σᵢ<ⱼ Xᵢⱼ. Linearity gives E[C] = Σᵢ<ⱼ E[Xᵢⱼ], even though the indicators need not be independent. Summing gives 2(n+1)Hₙ − 4n, where Hₙ = 1 + 1/2 + … + 1/n. For n = 50 the exact expectation is about 258.919 comparisons.',
              )}
            </p>
            <p>
              {tr(
                'A trial mean fluctuates around the theoretical expectation. The displayed standard deviation describes variation between trials; standard error = standard deviation / √trials describes sampling uncertainty in the mean. A finite histogram or a fixed seed cannot prove a worst-case guarantee.',
              )}
            </p>
            <button onClick={() => inspect('indicator')}>{tr('Explore an indicator pair')}</button>
          </Panel>
        </div>
      )}
      {tab === 'Code' && (
        <Panel title={tr('Count comparisons in randomized quicksort')} icon={<FileText />} className="ea-code">
          <pre>
            <code>{code}</code>
          </pre>
          <p>
            {tr(
              'The trace and simulation use the same pivot sampler and comparison-count convention. Distinct custom keys are required so the indicator formula applies. Recursion in the trace visits the left child before the right child.',
            )}
          </p>
          <p>
            {tr('Current run comparisons:')} {demo.root.total}
            {' · '}
            {tr('Theoretical expectation:')} {demo.expected.toFixed(6)}
          </p>
        </Panel>
      )}
      {tab === 'Practice' && (
        <Panel title={tr('Predict an indicator probability')} icon={<Lightbulb />} className="ea-practice">
          <p>{tr('For four distinct keys, what is the probability that sorted ranks 1 and 4 are compared?')}</p>
          <div>
            {['1/4', '1/2', '1'].map((answer) => (
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
            className="ea-primary"
            onClick={() => {
              if (prediction === '1/2') setPractice('complete')
              setFeedback(
                !prediction
                  ? tr('Choose a prediction first.')
                  : prediction === '1/2'
                    ? tr(
                        'Correct. The first pivot among four ranks is equally likely to be any rank. Two endpoint choices compare ranks 1 and 4, so 2/4 = 1/2.',
                      )
                    : tr('Try again. Count the two endpoint pivots among four equally likely first pivots.'),
              )
            }}
          >
            {tr('Check prediction')}
          </button>
          <p role="status">{feedback}</p>
          <button
            onClick={() => {
              loadDemo('4', 'sorted', '42')
              setIDraft('1')
              setJDraft('4')
              inspect('indicator')
            }}
          >
            {tr('Inspect the four-key example')}
          </button>
        </Panel>
      )}
      {tab === 'Experiments' && (
        <div className="ea-experiments">
          <Panel title={tr('Quicksort trace laboratory')} icon={<Settings />}>
            <div className="ea-playback">
              <button
                className="ea-primary"
                onClick={() => {
                  if (cursor === demo.frames.length - 1) setCursor(0)
                  setPlaying(!playing && demo.frames.length > 1)
                }}
              >
                {playing ? <Pause size={17} /> : <Play size={17} />}
                {tr(playing ? 'Pause trace' : 'Play trace')}
              </button>
              <button
                disabled={cursor === 0}
                onClick={() => {
                  setCursor(cursor - 1)
                  setPlaying(false)
                }}
              >
                {tr('Previous event')}
              </button>
              <button
                disabled={cursor === demo.frames.length - 1}
                onClick={() => {
                  setCursor(cursor + 1)
                  setPlaying(false)
                }}
              >
                {tr('Next event')}
              </button>
              <button
                onClick={() => {
                  setCursor(0)
                  setPlaying(false)
                }}
              >
                {tr('Restart trace')}
              </button>
            </div>
            <label>
              {tr('Trace event')}
              <input
                type="range"
                aria-label={tr('Trace event')}
                min="0"
                max={demo.frames.length - 1}
                value={cursor}
                onChange={(e) => {
                  setCursor(Number(e.target.value))
                  setPlaying(false)
                }}
              />
            </label>
            <p>
              {tr('Event')} {cursor + 1}
              {' / '}
              {demo.frames.length}
              {' · '}
              {tr('Comparisons performed:')} {frame.performed}
              {' · '}
              {tr('Final count:')} {demo.root.total}
            </p>
            <p>
              {tr('Current subproblem depth:')} {node.depth}
              {' · '}
              {tr('Keys:')} {node.values.map((k) => k.value).join(', ')}
            </p>
            <div className="ea-node-list">
              {demo.nodes
                .filter((n) => n.pivot)
                .map((n) => (
                  <button key={n.id} onClick={() => inspect('node', n.id)}>
                    {tr('Pivot')} {n.pivot!.value}
                    {' · '}
                    {tr('depth')} {n.depth}
                  </button>
                ))}
            </div>
            <button
              onClick={() => {
                changeTab('Visualization')
              }}
            >
              {tr('Show current partition')}
            </button>
          </Panel>
          <Panel title={tr('Sampling & preferences')} icon={<ChartNoAxesColumnIncreasing />}>
            <p>
              {tr('Simulation array size:')} {stats.input.size}
              {' · '}
              {tr('Seed:')} {stats.input.seed}
              {' · '}
              {tr('Trials:')} {stats.input.trials}
            </p>
            <button onClick={() => inspect('stats')}>{tr('Inspect sampling uncertainty')}</button>
            <button
              onClick={() => {
                reset()
                changeTab('Visualization')
              }}
            >
              {tr('Restore defaults')}
            </button>
            <LanguageSelector />
            <button onClick={() => (props.onToggleTheme ? props.onToggleTheme() : setLocalTheme(theme === 'dark' ? 'light' : 'dark'))}>
              {tr('Toggle color theme')}
            </button>
          </Panel>
        </div>
      )}
      {tab === 'Notes' && (
        <Panel title={tr('Your randomized-analysis notes')} icon={<FileText />} className="ea-notes">
          <p>
            {tr(
              'Record a prediction, distinguish the two sources of randomness, or explain why one slow trial does not contradict an expected bound. Notes are saved in this browser.',
            )}
          </p>
          <textarea aria-label={tr('Your randomized-analysis notes')} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </Panel>
      )}
      <dialog
        ref={dialog}
        className="ea-dialog"
        onCancel={() => setModal(null)}
        onClick={(e) => {
          if (e.target === dialog.current) setModal(null)
        }}
      >
        <button className="ea-close" aria-label={tr('Close analysis inspector')} onClick={() => setModal(null)}>
          <X />
        </button>
        {bin && (
          <>
            <h2>
              {tr('Comparison-count interval')} {bin.low}
              {'–'}
              {bin.high}
            </h2>
            <p>
              {tr('Observed trials:')} {bin.count}
              {' / '}
              {stats.input.trials}
              {' · '}
              {tr('Empirical probability:')} {((bin.count / stats.input.trials) * 100).toFixed(2)}%
            </p>
            <p>
              {tr('Array size:')} {stats.input.size}
              {' · '}
              {tr('Seed:')} {stats.input.seed}
            </p>
          </>
        )}
        {modal?.type === 'stats' && (
          <>
            <h2>{tr('Simulation statistics')}</h2>
            <p>
              {tr('Array size:')} {stats.input.size}
              {' · '}
              {tr('Trials:')} {stats.input.trials}
              {' · '}
              {tr('Seed:')} {stats.input.seed}
            </p>
            <p>
              {tr('Empirical mean:')} {stats.mean.toFixed(6)}
              {' · '}
              {tr('Theoretical expectation:')} {stats.expected.toFixed(6)}
            </p>
            <p>
              {tr('Population standard deviation:')} {stats.stddev.toFixed(6)}
              {' · '}
              {tr('Standard error of mean:')} {stats.standardError.toFixed(6)}
            </p>
            <p>
              {tr('Minimum:')} {stats.min}
              {' · '}
              {tr('Maximum:')} {stats.max}
              {' · '}
              {tr('First trial comparisons:')} {stats.counts[0]}
            </p>
            <p>
              {tr(
                'These are seeded Monte Carlo estimates of a Las Vegas algorithm’s comparison cost. They are not error rates, measured wall-clock times or worst-case bounds.',
              )}
            </p>
          </>
        )}
        {modal?.type === 'indicator' && (
          <>
            <h2>{tr('Indicator-variable probability')}</h2>
            <p>{tr('Use sorted ranks, not literal key values. Distinct keys are required.')}</p>
            <div className="ea-pair-inputs">
              <label>
                {'i'}
                <input
                  aria-label={tr('First sorted rank')}
                  type="number"
                  min="1"
                  max={demo.values.length}
                  value={iDraft}
                  onChange={(e) => setIDraft(e.target.value)}
                />
              </label>
              <label>
                {'j'}
                <input
                  aria-label={tr('Second sorted rank')}
                  type="number"
                  min="1"
                  max={demo.values.length}
                  value={jDraft}
                  onChange={(e) => setJDraft(e.target.value)}
                />
              </label>
            </div>
            {pairValid ? (
              <>
                <p>{`P(X[${pairI},${pairJ}] = 1) = 2 / ${pairJ - pairI + 1} = ${pairProbability.toFixed(6)}`}</p>
                <p>
                  {tr('Indicator in this completed seeded run:')} {demo.comparedPairs.has(`${pairI}:${pairJ}`) ? 1 : 0}
                </p>
                <p>
                  {tr(
                    'Only an endpoint being the first pivot in this rank interval makes the pair compare. Other pivots separate them into different recursive subproblems.',
                  )}
                </p>
              </>
            ) : (
              <p role="alert">{tr('Choose sorted ranks with 1 ≤ i < j ≤ n. A one-key array has no comparison pairs.')}</p>
            )}
          </>
        )}
        {modal?.type === 'expectation' && (
          <>
            <h2>{tr('Exact expected comparisons')}</h2>
            <p>{'E[C] = Σᵢ<ⱼ 2/(j−i+1) = 2(n+1)Hₙ − 4n'}</p>
            <p>
              {tr('Demo array size:')} {demo.values.length}
              {' · '}
              {tr('Expectation:')} {demo.expected.toFixed(6)}
              {' · '}
              {tr('Realized comparisons:')} {demo.root.total}
            </p>
            <p>
              {tr('Simulation array size:')} {stats.input.size}
              {' · '}
              {tr('Expectation:')} {stats.expected.toFixed(6)}
            </p>
            <p>
              {tr(
                'Linearity of expectation does not require independent indicators. The formula assumes distinct keys and ideal uniform random pivot choices.',
              )}
            </p>
          </>
        )}
        {selectedNode && (
          <>
            <h2>{tr('Partition certificate')}</h2>
            <p>
              {tr('Depth:')} {selectedNode.depth}
              {' · '}
              {tr('Pivot:')} {selectedNode.pivot?.value ?? tr('Base case')}
            </p>
            <p>
              {tr('Input:')} {selectedNode.values.map((k) => k.value).join(', ')}
            </p>
            <p>
              {tr('Less:')} {selectedNode.less.map((k) => k.value).join(', ') || '∅'}
              {' · '}
              {tr('Greater:')} {selectedNode.greater.map((k) => k.value).join(', ') || '∅'}
            </p>
            <p>
              {tr('This partition comparisons:')} {selectedNode.comparisons}
              {' · '}
              {tr('Subtree comparisons:')} {selectedNode.total}
            </p>
            <p>
              {tr('Sorted result:')} {selectedNode.sorted.map((k) => k.value).join(', ')}
            </p>
            <p>
              {tr('Current visualization phase:')} {frame.phase + 1}
              {' · '}
              {tr('Lower groups preview the partition before it is performed. Sorted child groups preview recursion results at stage 3.')}
            </p>
            <button
              onClick={() => {
                const at = demo.frames.findIndex((f) => f.node === selectedNode.id)
                if (at >= 0) setCursor(at)
                setModal(null)
                changeTab('Visualization')
              }}
            >
              {tr('Go to this subproblem')}
            </button>
          </>
        )}
        {modal?.type === 'guarantees' && (
          <>
            <h2>{tr(modal.index === 0 ? 'Monte Carlo guarantee' : 'Las Vegas guarantee')}</h2>
            <p>
              {tr(
                modal.index === 0
                  ? 'A Monte Carlo algorithm may return an incorrect answer with a bounded probability. Repetition can reduce error when the algorithm’s assumptions hold. Randomized primality testing is one example.'
                  : 'A Las Vegas algorithm always returns a correct answer; randomness affects its running cost. Quicksort’s partition and recursion remain correct for every selected pivot.',
              )}
            </p>
            <p>{tr('The chart uses Monte Carlo sampling to estimate the cost of randomized quicksort, which itself is Las Vegas.')}</p>
          </>
        )}
      </dialog>
    </div>
  )
}
