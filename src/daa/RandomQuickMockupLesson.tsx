// @localized-render
import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
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
  Shuffle,
  Sun,
  X,
} from 'lucide-react'
import { AccountControl } from '../account/AccountControl'
import { LanguageSelector } from '../i18n/LanguageSelector'
import { tx, useLocaleRender } from '../i18n/render'
import { persistentString, usePersistentState } from '../hooks/usePersistentState'
import { MockupTabs, type MockupPageProps, type MockupTab } from './MockupLessonChrome'
import {
  parseQuickSeed,
  parseQuickValues,
  randomQuickExample,
  runRandomQuickLesson,
  shuffleQuickValues,
  type QuickItem,
  type QuickNode,
  type RandomQuickRun,
} from './randomQuickLessonModel'
import './random-quick-mockup.css'
const tr = (s: string) => tx(s, 'studios'),
  tabs: MockupTab[] = ['Learn', 'Visualization', 'Code', 'Practice', 'Experiments'],
  num = (n: number) => String(n),
  compact = (n: number) => (Math.abs(n) >= 1000 ? n.toExponential(0) : Number(n.toPrecision(3)).toString())
function Panel({ title, icon, children, className = '' }: { title: string; icon: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`rq-panel ${className}`}>
      <header>
        <span className="rq-icon">{icon}</span>
        <h2>{title}</h2>
      </header>
      {children}
    </section>
  )
}
function QuickTree({ run, active, onNode }: { run: RandomQuickRun; active: string; onNode: (n: QuickNode) => void }) {
  const id = useId(),
    leafCount = (n: QuickNode): number => (!n.left && !n.right ? 1 : (n.left ? leafCount(n.left) : 0) + (n.right ? leafCount(n.right) : 0)),
    width = Math.max(500, leafCount(run.root) * 112),
    items: { node: QuickNode; x: number; y: number; parent?: { x: number; y: number } }[] = []
  function add(node: QuickNode, left: number, right: number, depth: number, parent?: { x: number; y: number }) {
    const x = (left + right) / 2,
      y = 3 + depth * 62
    items.push({ node, x, y, parent })
    if (node.left) add(node.left, left, (left + right) / 2, depth + 1, { x, y })
    if (node.right) add(node.right, (left + right) / 2, right, depth + 1, { x, y })
  }
  add(run.root, 0, width, 0)
  const height = Math.max(233, ...items.map((i) => i.y + 53))
  return (
    <div className="rq-tree-scroll" role="region" tabIndex={0} aria-label={tr('Scrollable quicksort recursion tree')}>
      <svg
        className="rq-tree"
        viewBox={`0 0 ${width} ${height}`}
        style={{ width, minWidth: width, height }}
        aria-label={tr('Actual quicksort subarray ranges and pivots')}
      >
        <title>{tr('Labels preview the seeded call tree. Select a node to inspect its actual range and partition.')}</title>
        <defs>
          <marker id={`${id}-arrow`} markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
            <path d="M0 0L6 3L0 6Z" fill="#0875ff" />
          </marker>
        </defs>
        {items
          .filter((i) => i.parent)
          .map((i) => (
            <path
              key={i.node.id}
              d={`M${i.parent!.x} ${i.parent!.y + 48}L${i.x} ${i.y - 2}`}
              stroke="#0875ff"
              fill="none"
              strokeWidth="1.5"
              markerEnd={`url(#${id}-arrow)`}
            />
          ))}
        {items.map(({ node, x, y }) => (
          <g
            key={node.id}
            role="button"
            tabIndex={0}
            aria-label={tr(`Inspect quicksort node ${node.id}`)}
            className={`rq-tree-node ${node.id === active ? 'rq-tree-current' : ''} ${node.id.endsWith('R') ? 'rq-tree-right' : ''}`}
            onClick={() => onNode(node)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onNode(node)
              }
            }}
          >
            <rect x={x - 50} y={y} width="100" height="48" rx="8" />
            <text x={x} y={y + 20} textAnchor="middle">{`[${node.lo}, ${node.hi}]`}</text>
            <text x={x} y={y + 38} textAnchor="middle">
              {node.pivot ? `pivot = ${compact(node.pivot.value)}` : tr('size = 1')}
            </text>
          </g>
        ))}
      </svg>
    </div>
  )
}
export function RandomQuickMockupLesson(props: MockupPageProps) {
  useLocaleRender()
  const navigate = useNavigate(),
    [tab, setTab] = useState<MockupTab>('Visualization'),
    [run, setRun] = useState(() => runRandomQuickLesson(randomQuickExample, 42)),
    [cursor, setCursor] = useState(0),
    [seedDraft, setSeedDraft] = useState('42'),
    [speed, setSpeed] = useState(700),
    [playing, setPlaying] = useState(false),
    [view, setView] = useState('array'),
    [modal, setModal] = useState<'edit' | 'item' | 'group' | 'node' | 'result' | null>(null),
    [draft, setDraft] = useState(''),
    [error, setError] = useState(''),
    [itemId, setItemId] = useState(0),
    [groupId, setGroupId] = useState(0),
    [nodeId, setNodeId] = useState('P'),
    [prediction, setPrediction] = useState(''),
    [feedback, setFeedback] = useState(''),
    [localTheme, setLocalTheme] = useState(() => localStorage.getItem('algodrishti-theme') ?? 'light'),
    dialog = useRef<HTMLDialogElement>(null),
    editor = useRef<HTMLTextAreaElement>(null)
  const [notes, setNotes] = usePersistentState('algodrishti-random-quick-notes', '', persistentString),
    frame = run.frames[cursor],
    part = frame.array.slice(frame.lo, frame.hi + 1),
    groups = [frame.less, frame.equal, frame.greater],
    labels = ['Less than pivot', 'Equal to pivot', 'Greater than pivot'],
    theme = props.theme ?? localTheme,
    studied = props.completed.includes(props.module.id),
    selectedNode = run.nodes.find((n) => n.id === nodeId) ?? run.root,
    item = frame.array.find((p) => p.id === itemId),
    stageLabel =
      frame.kind === 'choose'
        ? 'Classification preview'
        : frame.kind === 'partition'
          ? 'In-place partition complete'
          : frame.kind === 'base'
            ? 'Singleton base case'
            : 'Subproblem sorted',
    pivotPosition = frame.pivot ? part.findIndex((p) => p.id === frame.pivot!.id) : -1,
    cellWidth = Math.min(70, (798 - (part.length - 1) * 6) / part.length),
    pivotX = 435 + (pivotPosition - (part.length - 1) / 2) * (cellWidth + 6)
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
      if (cursor === run.frames.length - 1) {
        setPlaying(false)
        return
      }
      setCursor(cursor + 1)
      if (cursor + 1 === run.frames.length - 1) setPlaying(false)
    }, speed)
    return () => window.clearTimeout(timer)
  }, [playing, cursor, run.frames.length, speed])
  function load(values: number[], seed = run.seed) {
    const next = runRandomQuickLesson(values, seed)
    setRun(next)
    setSeedDraft(String(seed))
    setCursor(0)
    setPlaying(false)
    setError('')
    setFeedback('')
    setNodeId('P')
    return next
  }
  function step() {
    try {
      const seed = parseQuickSeed(seedDraft)
      if (seed !== run.seed) {
        load(run.values, seed)
        return
      }
      setError('')
      setPlaying(false)
      setCursor(cursor === run.frames.length - 1 ? 0 : cursor + 1)
    } catch (e) {
      setError((e as Error).message)
    }
  }
  function auto() {
    try {
      const seed = parseQuickSeed(seedDraft)
      if (playing) {
        setPlaying(false)
        return
      }
      if (seed !== run.seed) load(run.values, seed)
      else if (cursor === run.frames.length - 1) setCursor(0)
      setError('')
      setPlaying(true)
    } catch (e) {
      setError((e as Error).message)
    }
  }
  function shuffle() {
    try {
      const seed = parseQuickSeed(seedDraft)
      load(shuffleQuickValues(run.values, seed), seed)
    } catch (e) {
      setError((e as Error).message)
    }
  }
  function openEditor() {
    setDraft(run.values.join(', '))
    setError('')
    setPlaying(false)
    setModal('edit')
  }
  function inspectItem(p: QuickItem) {
    setItemId(p.id)
    setPlaying(false)
    setModal('item')
  }
  function inspectGroup(i: number) {
    setGroupId(i)
    setPlaying(false)
    setModal('group')
  }
  function inspectNode(n: QuickNode) {
    setNodeId(n.id)
    setPlaying(false)
    setModal('node')
  }
  function changeTab(next: MockupTab) {
    setTab(next)
    setPlaying(false)
  }
  return (
    <div className="mom-page target-visual random-quick-page" data-target="36">
      <header className="rq-topbar">
        <button className="rq-back" aria-label={tr('Back to Karatsuba multiplication')} onClick={() => navigate('/daa-extensions/karatsuba')}>
          <ArrowLeft size={19} />
        </button>
        <div className="rq-title-row">
          <h1>{tr('Randomized Quicksort')}</h1>
          <p>{tr('Use reproducible pseudorandom pivots and three-way partitions.')}</p>
        </div>
        <button className="mom-study" aria-pressed={studied} onClick={() => props.toggleCompleted(props.module.id)}>
          {studied ? <Check size={16} /> : <Bookmark size={16} />} {tr(studied ? 'Studied' : 'Mark studied')}
        </button>
        <AccountControl showLanguage={false} />
      </header>
      <MockupTabs active={tab} onChange={changeTab} tabs={tabs} />
      {tab === 'Visualization' ? (
        <>
          <div className="rq-top-grid">
            <section className="rq-visualization">
              <header className="rq-visual-heading">
                <span className="rq-main-icon">
                  <svg viewBox="0 0 28 28" aria-hidden="true">
                    <path d="M6 10L14 20L22 8M14 20L22 19" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                    <path d="M2 10L6 6L10 10L6 14ZM10 20L14 16L18 20L14 24ZM18 8L22 4L26 8L22 12ZM19 19L22 16L25 19L22 22Z" fill="currentColor" />
                  </svg>
                </span>
                <div>
                  <h2>{tr('Interactive Visualization')}</h2>
                  <p>{tr('See how a random pivot is chosen, how the array is partitioned into three parts, and how recursion proceeds.')}</p>
                </div>
                <select
                  aria-label={tr('Quicksort visualization view')}
                  value={view}
                  onChange={(e) => {
                    if (e.target.value === 'custom') {
                      openEditor()
                      return
                    }
                    setView(e.target.value)
                  }}
                >
                  <option value="array">{tr('Array visualization')}</option>
                  <option value="bars">{tr('Bar visualization')}</option>
                  <option value="custom">{tr('Custom array…')}</option>
                </select>
              </header>
              <div className="rq-toolbar">
                <button className="rq-primary rq-shuffle" onClick={shuffle}>
                  <Shuffle size={16} />
                  {tr('Shuffle')}
                </button>
                <label className="rq-seed">
                  {tr('Seed:')}
                  <input
                    type="number"
                    min="0"
                    max="4294967295"
                    step="1"
                    aria-label={tr('Quicksort random seed')}
                    value={seedDraft}
                    onChange={(e) => {
                      setSeedDraft(e.target.value)
                      setPlaying(false)
                    }}
                  />
                </label>
                <i className="rq-divider" />
                <button className="rq-step" onClick={step} disabled={run.frames.length === 1 && seedDraft === String(run.seed)}>
                  <Play size={15} fill="currentColor" />
                  {tr('Step partition')}
                </button>
                <button className="rq-auto" onClick={auto} disabled={run.frames.length === 1 && seedDraft === String(run.seed)}>
                  {playing ? <Pause size={15} /> : <Play size={15} fill="currentColor" />}
                  {tr(playing ? 'Pause' : 'Auto play')}
                </button>
                <button
                  className="rq-reset"
                  onClick={() => {
                    load(randomQuickExample, 42)
                    setSpeed(700)
                    setView('array')
                  }}
                >
                  <RotateCcw size={18} />
                  {tr('Reset')}
                </button>
                <label className="rq-speed">
                  {tr('Speed:')}
                  <input
                    type="range"
                    min="100"
                    max="1500"
                    step="100"
                    aria-label={tr('Quicksort playback speed')}
                    value={speed}
                    onChange={(e) => setSpeed(Number(e.target.value))}
                  />
                  <small>{tr(speed <= 300 ? 'Fast' : speed <= 900 ? 'Normal' : 'Slow')}</small>
                </label>
              </div>
              {error && (
                <p className="rq-input-error" role="alert">
                  {tr(error)}
                </p>
              )}
              <div className="rq-diagram-scroll" role="region" tabIndex={0} aria-label={tr('Scrollable quicksort partition diagram')}>
                <div className="rq-diagram">
                  <h3>
                    {tr('Current subarray (indices ')}
                    <b>{frame.lo}</b>
                    {' … '}
                    {frame.hi}
                    {')'}
                  </h3>
                  <div
                    className={`rq-array-cells ${view === 'bars' ? 'rq-bars' : ''}`}
                    style={{ gridTemplateColumns: `repeat(${part.length},minmax(0,1fr))`, width: part.length * 70 + (part.length - 1) * 6 }}
                  >
                    {part.map((p, i) => (
                      <div key={p.id} className="rq-array-item">
                        <span className="rq-index">{frame.lo + i}</span>
                        <button
                          className={`rq-cell ${frame.pivot?.id === p.id ? 'rq-pivot-cell' : ''} ${frame.sorted.includes(frame.lo + i) ? 'rq-sorted-cell' : ''}`}
                          aria-label={tr(`Inspect quicksort value ${p.id}: ${num(p.value)}`)}
                          title={num(p.value)}
                          onClick={() => inspectItem(p)}
                          style={
                            view === 'bars'
                              ? {
                                  background: `linear-gradient(to top, ${frame.pivot?.id === p.id ? '#ffb5c7' : '#8dc6ff'} ${20 + (Math.abs(p.value) / Math.max(1, ...part.map((v) => Math.abs(v.value)))) * 80}%, #f5faff 0%)`,
                                }
                              : undefined
                          }
                        >
                          <strong style={{ fontSize: part.length > 12 ? 12 : undefined }}>{part.length > 12 ? compact(p.value) : num(p.value)}</strong>
                        </button>
                        {frame.pivot?.id === p.id && <span className="rq-pivot-tag">{tr(`Pivot (${num(p.value)})`)}</span>}
                      </div>
                    ))}
                  </div>
                  {frame.pivot && (
                    <svg className="rq-partition-arrows" viewBox="0 0 870 319" preserveAspectRatio="none" aria-hidden="true">
                      <defs>
                        {['blue', 'red', 'green'].map((name, i) => (
                          <marker key={name} id={`rq-arrow-${name}`} markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
                            <path d="M0 0L7 3.5L0 7Z" fill={['#0875ff', '#ff4565', '#309642'][i]} />
                          </marker>
                        ))}
                      </defs>
                      {[163, 411, 683].map((x, i) => (
                        <path
                          key={x}
                          d={`M${pivotX} 158L${x} 189`}
                          stroke={['#0875ff', '#ff4565', '#309642'][i]}
                          fill="none"
                          strokeWidth="1.6"
                          markerEnd={`url(#rq-arrow-${['blue', 'red', 'green'][i]})`}
                        />
                      ))}
                    </svg>
                  )}
                  <div className="rq-partition-groups">
                    {groups.map((items, i) => (
                      <div key={labels[i]} className={`rq-group rq-group-${i}`}>
                        <button className="rq-group-label" onClick={() => inspectGroup(i)}>
                          {tr(labels[i])}
                        </button>
                        <div className="rq-group-values">
                          {items.map((p) => (
                            <button
                              key={p.id}
                              aria-label={tr(`Inspect ${['less', 'equal', 'greater'][i]} value ${p.id}`)}
                              title={num(p.value)}
                              onClick={() => inspectItem(p)}
                            >
                              {items.length > 6 ? compact(p.value) : num(p.value)}
                            </button>
                          ))}
                          {!items.length && <span>{'∅'}</span>}
                        </div>
                        <small>{frame.pivot ? `(${['<', '=', '>'][i]} ${num(frame.pivot.value)})` : tr('No pivot')}</small>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>
            <div className="rq-explanation-column">
              <Panel title={tr('How it works')} icon={<Info />} className="rq-how">
                <ol>
                  {[
                    'Choose a random pivot from the current subarray.',
                    'Partition the subarray into three parts: < pivot, = pivot, and > pivot.',
                    'Recursively apply the same process to the left and right parts.',
                    'Base case: subarrays of size 0 or 1 are already sorted.',
                  ].map((s, i) => (
                    <li key={s}>
                      <i>{i + 1}</i>
                      <p>
                        {i === 1 ? (
                          <>
                            {tr('Partition the subarray into three parts:')}
                            <br />
                            {'< pivot, = pivot, and > pivot.'}
                          </>
                        ) : (
                          tr(s)
                        )}
                      </p>
                    </li>
                  ))}
                </ol>
              </Panel>
              <Panel title={tr('Pivot info')} icon={<Lightbulb />} className="rq-pivot-info">
                <p>
                  <b>{tr('Pivot value:')}</b> <strong>{frame.pivot ? num(frame.pivot.value) : '—'}</strong>
                </p>
                <p>
                  <b>{tr('Pivot index (in subarray):')}</b>{' '}
                  <strong title={tr('Index at pivot selection, before in-place swaps.')}>{frame.pivot ? frame.pivotIndex - frame.lo : '—'}</strong>
                </p>
                <p>
                  <b>{tr('Selection:')}</b> <strong>{tr(frame.pivot ? `Random (seed = ${run.seed})` : 'Not needed (base case)')}</strong>
                </p>
                <p className="rq-pivot-tip">{tr('A random pivot gives good expected performance by avoiding worst-case splits.')}</p>
              </Panel>
            </div>
          </div>
          <div className="rq-bottom-grid">
            <Panel title={tr('Recursion tree (subarray ranges)')} icon={<Network />} className="rq-recursion">
              <QuickTree run={run} active={frame.node} onNode={inspectNode} />
            </Panel>
            <Panel title={tr('Partition summary')} icon={<BarChart3 />} className="rq-summary">
              <div className="rq-summary-scroll">
                <table>
                  <thead>
                    <tr>
                      {['Group', 'Count', 'Values'].map((s) => (
                        <th key={s}>{tr(s)}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {groups.map((g, i) => (
                      <tr key={labels[i]}>
                        <td>
                          <button aria-label={tr(`Inspect partition group ${i}`)} onClick={() => inspectGroup(i)}>
                            <i className={`rq-dot rq-dot-${i}`} />
                            {tr(labels[i])}
                          </button>
                        </td>
                        <td>{g.length}</td>
                        <td title={`[${g.map((p) => num(p.value)).join(', ')}]`}>[{g.map((p) => num(p.value)).join(', ')}]</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="rq-duplicate-insight">
                <CheckCircle2 />
                <p>{tr('Three-way partition handles duplicate values efficiently by grouping equal elements together.')}</p>
              </div>
            </Panel>
            <Panel title={tr('Complexity')} icon={<BarChart3 />} className="rq-complexity">
              <p>
                <b>{tr('Time:')}</b> {tr('Expected O(n log n); worst O(n²)')}
              </p>
              <p>
                <b>{tr('Auxiliary space:')}</b> {tr('O(log n) expected (recursion)')}
              </p>
              <p>
                <b>{tr('In-place:')}</b> {tr('Yes (partitioning in place)')}
              </p>
              <button
                className="rq-example"
                aria-label={tr('Inspect randomized quicksort result')}
                onClick={() => {
                  setPlaying(false)
                  setModal('result')
                }}
              >
                <CheckCircle2 />
                <span>
                  <b>{tr('Example on this input')}</b>
                  <p>
                    {tr(
                      `With seed = ${run.seed}, the first pivot is ${run.root.pivot ? num(run.root.pivot.value) : 'not needed'}. The equal block is already final; recursion sorts the smaller and larger parts.`,
                    )}
                  </p>
                </span>
              </button>
            </Panel>
          </div>
        </>
      ) : tab === 'Learn' ? (
        <div className="rq-learning">
          <Panel title={tr('Why Randomize the Pivot?')} icon={<BookOpen />}>
            <p>
              {tr(
                'Quicksort sorts around a pivot, then solves only the values smaller and larger than it. A reproducible pseudorandom pivot reduces dependence on the input order. Randomization gives expected O(n log n) time; an unlucky pivot sequence can still take O(n²).',
              )}
            </p>
            <div className="rq-concepts">
              {[
                ['Less than pivot', 'These values precede the equal block after partitioning. Recursively sort only this range.'],
                [
                  'Equal to pivot',
                  'All values equal to the pivot are finalized together. They are excluded from further recursive calls, which is especially useful when duplicates are common.',
                ],
                [
                  'Greater than pivot',
                  'These values follow the equal block. Their original order need not be preserved, because this algorithm swaps elements in place and is not stable.',
                ],
              ].map(([title, text]) => (
                <article key={title}>
                  <h3>{tr(title)}</h3>
                  <p>{tr(text)}</p>
                </article>
              ))}
            </div>
          </Panel>
          <Panel title={tr('Worked Example: Seed 42')} icon={<Lightbulb />}>
            <p>
              {tr(
                'For [7,2,9,4,3,8,1,6,5], seed 42 selects index 4, whose value is 3. The initial classification preview shows [2,1], [3], and [7,9,4,8,6,5]. After in-place swaps, the order within a group can change. The recursive ranges are [0,1] and [3,8], while index 2 belongs to the finalized equal block.',
              )}
            </p>
            <button
              onClick={() => {
                load(randomQuickExample, 42)
                setTab('Visualization')
              }}
            >
              {tr('Explore worked example')}
            </button>
          </Panel>
          <Panel title={tr('The In-Place Three-Way Invariant')} icon={<CheckCircle2 />}>
            <p>
              {tr(
                'During partitioning, positions before lt are smaller than the pivot, [lt,i) equals it, (gt,hi] is greater, and [i,gt] is unclassified. Swap smaller values to lt and larger values to gt. When i passes gt, all three groups satisfy the invariant.',
              )}
            </p>
            <p>
              {tr(
                'The core partition uses constant extra space, and recursion needs O(log n) stack space in expectation, O(n) in the worst case. This visualizer additionally stores snapshots, classification lists and the full call tree. The preview groups retain the input order for explanation; executed partition frames show the actual in-place order.',
              )}
            </p>
            <p>
              {tr(
                'The generator is Mulberry32 with one initialization draw discarded. The seed and input together determine the trace. Seeds range from 0 to 4294967295. Inputs accept 1–20 finite numbers between −1000000 and 1000000.',
              )}
            </p>
          </Panel>
        </div>
      ) : tab === 'Code' ? (
        <Panel title={tr('Seeded In-Place Three-Way Quicksort')} icon={<Code2 />} className="rq-code">
          <pre>
            <code>{`sort(A, lo, hi):
  if lo >= hi: return
  chosen = lo + floor(nextRandom() * (hi - lo + 1))
  pivot = A[chosen].value
  lt = i = lo; gt = hi
  while i <= gt:
    if A[i].value < pivot:
      swap(A[i], A[lt]); i++; lt++
    else if A[i].value > pivot:
      swap(A[i], A[gt]); gt--
    else:
      i++
  sort(A, lo, lt - 1)
  sort(A, gt + 1, hi)`}</code>
          </pre>
          <p>
            {tr(
              'Save the pivot value before swapping its original array position. Rechecking an element swapped in from gt is essential: do not increment i in the greater-than branch.',
            )}
          </p>
        </Panel>
      ) : tab === 'Practice' ? (
        <Panel title={tr('Predict the Three Group Sizes')} icon={<Lightbulb />} className="rq-practice">
          <p>{tr('How many values in the current subarray are strictly smaller than its pivot? Equal values are a separate group.')}</p>
          <p>
            [{part.map((p) => num(p.value)).join(', ')}]{' · '}
            {tr(`Pivot: ${frame.pivot ? num(frame.pivot.value) : 'none'}`)}
          </p>
          <input
            aria-label={tr('Predicted quicksort less count')}
            type="number"
            min="0"
            value={prediction}
            onChange={(e) => {
              setPrediction(e.target.value)
              setFeedback('')
            }}
          />
          <button
            className="rq-primary"
            onClick={() =>
              setFeedback(
                prediction.trim() !== '' && Number(prediction) === frame.less.length
                  ? 'Correct! Only strictly smaller values belong in this group.'
                  : 'Try again. Compare every value with the pivot, excluding equal values.',
              )
            }
          >
            {tr('Check prediction')}
          </button>
          {feedback && <p role="status">{tr(feedback)}</p>}
        </Panel>
      ) : (
        <div className="rq-experiments">
          <Panel title={tr('Seed and Partition Laboratory')} icon={<Settings />}>
            <div className="rq-lab-actions">
              <button className="rq-primary" onClick={openEditor}>
                {tr('Edit custom quicksort array')}
              </button>
              {[
                ['Sorted', [1, 2, 3, 4, 5, 6, 7, 8, 9]],
                ['Reverse sorted', [9, 8, 7, 6, 5, 4, 3, 2, 1]],
                ['Duplicates', [5, 2, 5, 1, 5, 2, 5]],
                ['All equal', [7, 7, 7, 7, 7]],
                ['Singleton', [42]],
              ].map(([name, values]) => (
                <button key={String(name)} onClick={() => load(values as number[])}>
                  {tr(String(name))}
                </button>
              ))}
            </div>
            <p>
              {tr('Original input: ')}[{run.values.join(', ')}]
            </p>
            <p>
              {tr('Final sorted output: ')}[{run.sorted.join(', ')}]
            </p>
            <p>
              {tr(
                `Seed ${run.seed}. Comparisons executed: ${frame.comparisons} / ${run.comparisons}. Swaps executed: ${frame.swaps} / ${run.swaps}. Finalized positions: ${frame.sorted.length} / ${run.values.length}.`,
              )}
            </p>
            <p className="rq-run-summary" role="status">
              {tr(`Event ${cursor + 1} / ${run.frames.length}. Subarray [${frame.lo}, ${frame.hi}]. ${stageLabel}.`)}
            </p>
            <div className="rq-lab-actions">
              <button
                onClick={() => {
                  setCursor(0)
                  setPlaying(false)
                }}
              >
                {tr('Jump to first pivot')}
              </button>
              <button
                disabled={cursor === 0}
                onClick={() => {
                  setCursor(cursor - 1)
                  setPlaying(false)
                }}
              >
                {tr('Previous partition event')}
              </button>
              <button
                onClick={() => {
                  setCursor(run.frames.length - 1)
                  setPlaying(false)
                }}
              >
                {tr('Jump to sorted result')}
              </button>
              <button onClick={() => setTab('Visualization')}>{tr('Return to array visualization')}</button>
            </div>
            <div className="rq-node-buttons">
              {run.nodes.map((n) => (
                <button key={n.id} onClick={() => inspectNode(n)}>
                  {tr(`Node ${n.id}: [${n.lo}, ${n.hi}]`)}
                </button>
              ))}
            </div>
          </Panel>
          <Panel title={tr('Your Randomized-Quicksort Notes')} icon={<BookOpen />}>
            <LanguageSelector />
            <label>
              {tr('Notes')}
              <textarea aria-label={tr('Randomized quicksort notes')} value={notes} onChange={(e) => setNotes(e.target.value)} />
            </label>
            <button
              aria-label={tr('Toggle color theme')}
              onClick={() => {
                if (props.onToggleTheme) props.onToggleTheme()
                else setLocalTheme(theme === 'dark' ? 'light' : 'dark')
              }}
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />} {tr('Toggle color theme')}
            </button>
          </Panel>
        </div>
      )}
      <dialog
        ref={dialog}
        className="rq-dialog"
        aria-label={tr(
          modal === 'edit'
            ? 'Edit randomized quicksort input'
            : modal === 'item'
              ? 'Inspect quicksort value'
              : modal === 'group'
                ? 'Inspect quicksort partition group'
                : modal === 'node'
                  ? 'Inspect quicksort recursion node'
                  : 'Randomized quicksort result',
        )}
        onCancel={() => setModal(null)}
      >
        <button className="rq-close" aria-label={tr('Close quicksort dialog')} onClick={() => setModal(null)}>
          <X />
        </button>
        {modal === 'edit' ? (
          <>
            <h2>{tr('Edit Array and Seed')}</h2>
            <p>
              {tr(
                'Enter 1–20 finite numbers, including duplicates or negatives. Use commas, spaces, or a JSON array. The seed must be an integer from 0 to 4294967295.',
              )}
            </p>
            <textarea ref={editor} aria-label={tr('Randomized quicksort array input')} value={draft} onChange={(e) => setDraft(e.target.value)} />
            <label>
              {tr('Seed')}
              <input type="number" aria-label={tr('Custom quicksort seed')} value={seedDraft} onChange={(e) => setSeedDraft(e.target.value)} />
            </label>
            {error && <p role="alert">{tr(error)}</p>}
            <button
              className="rq-primary"
              onClick={() => {
                try {
                  load(parseQuickValues(draft), parseQuickSeed(seedDraft))
                  setModal(null)
                } catch (e) {
                  setError((e as Error).message)
                }
              }}
            >
              {tr('Apply quicksort input')}
            </button>
          </>
        ) : modal === 'item' && item ? (
          <>
            <h2>{tr(`Value ${num(item.value)}, original ID ${item.id}`)}</h2>
            <p>{tr(`Current array index: ${frame.array.findIndex((p) => p.id === item.id)}. Active range: [${frame.lo}, ${frame.hi}].`)}</p>
            <p>
              {tr(
                frame.pivot
                  ? `Compared with pivot ${frame.pivot.value}: ${item.value < frame.pivot.value ? 'less' : item.value > frame.pivot.value ? 'greater' : 'equal'}.`
                  : 'This is a singleton base case; no pivot is needed.',
              )}
            </p>
            <p>{tr('Original IDs distinguish equal values as they move through in-place swaps. The sort is not stable.')}</p>
            <button onClick={openEditor}>{tr('Edit array values')}</button>
          </>
        ) : modal === 'group' ? (
          <>
            <h2>{tr(labels[groupId])}</h2>
            <p>
              {tr(`Count: ${groups[groupId].length}.`)}
              {' ['}
              {groups[groupId].map((p) => num(p.value)).join(', ')}
              {']'}
            </p>
            <p>
              {tr(
                frame.kind === 'choose'
                  ? 'These groups preview classification before swaps. They preserve the original order for explanation.'
                  : 'These values reflect the current in-place array order.',
              )}
            </p>
            <p>
              {tr(
                `Ranges after partition: less [${frame.lo}, ${frame.lt - 1}], equal [${frame.lt}, ${frame.gt}], greater [${frame.gt + 1}, ${frame.hi}]. A range with lower bound above its upper bound is empty.`,
              )}
            </p>
          </>
        ) : modal === 'node' ? (
          <>
            <h2>{tr(`Quicksort Node ${selectedNode.id}`)}</h2>
            <p>{tr(`Subarray [${selectedNode.lo}, ${selectedNode.hi}], size ${selectedNode.hi - selectedNode.lo + 1}.`)}</p>
            <p>
              {tr(
                selectedNode.pivot
                  ? `Pivot ${selectedNode.pivot.value}, chosen at global index ${selectedNode.pivotIndex}. Final equal range [${selectedNode.lt}, ${selectedNode.gt}].`
                  : 'Singleton: no partition or recursive call is needed.',
              )}
            </p>
            <div className="rq-lab-actions">
              {[selectedNode.left, selectedNode.right].flatMap((n) =>
                n
                  ? [
                      <button key={n.id} onClick={() => inspectNode(n)}>
                        {tr(`Open node ${n.id}`)}
                      </button>,
                    ]
                  : [],
              )}
            </div>
            <button
              onClick={() => {
                setCursor(run.frames.findIndex((f) => f.node === selectedNode.id))
                setModal(null)
              }}
            >
              {tr('Show node pivot selection')}
            </button>
          </>
        ) : (
          <>
            <h2>{tr('Seeded Quicksort Result')}</h2>
            <p>{tr(`Seed: ${run.seed}.`)}</p>
            <p>
              {tr('Input: ')}[{run.values.join(', ')}]
            </p>
            <p>
              {tr('Sorted output: ')}[{run.sorted.join(', ')}]
            </p>
            <p>{tr(`Value comparisons: ${run.comparisons}. Nontrivial swaps: ${run.swaps}. Recursive subproblems: ${run.nodes.length}.`)}</p>
            <p>
              {tr(
                'The core partition swaps within the same working array. Visualization snapshots use additional storage, and the recursion stack can reach O(n) in the worst case.',
              )}
            </p>
            <button
              onClick={() => {
                setCursor(0)
                setPlaying(false)
                setModal(null)
                setTab('Visualization')
              }}
            >
              {tr('Replay seeded quicksort')}
            </button>
          </>
        )}
      </dialog>
    </div>
  )
}
