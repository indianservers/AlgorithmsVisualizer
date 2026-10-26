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
  FileText,
  Info,
  Lightbulb,
  List,
  Moon,
  Pause,
  Play,
  RotateCcw,
  Settings,
  Shuffle,
  Sun,
  X,
} from 'lucide-react'
import { tx, useLocaleRender } from '../i18n/render'
import { AccountControl } from '../account/AccountControl'
import { LanguageSelector } from '../i18n/LanguageSelector'
import { usePersistentState, persistentString } from '../hooks/usePersistentState'
import { MockupTabs, type MockupPageProps, type MockupTab } from './MockupLessonChrome'
import { inversionExample, parseInversionValues, runInversionLesson, type InversionFrame, type InversionItem, type InversionRun } from './inversionLessonModel'
import './inversions-mockup.css'
const tr = (s: string) => tx(s, 'studios'),
  tabs: MockupTab[] = ['Learn', 'Visualization', 'Code', 'Practice', 'Experiments'],
  number = (n: number) => Number(n.toPrecision(7)).toString()
const compact = (n: number) => (Math.abs(n) >= 1000 ? n.toExponential(0) : Number(n.toPrecision(3)).toString())
function Panel({ title, icon, children, className = '' }: { title: string; icon: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`iv-panel ${className}`}>
      <header>
        <span className="iv-icon">{icon}</span>
        <h2>{tr(title)}</h2>
      </header>
      {children}
    </section>
  )
}
function MergeDiagram({
  run,
  frame,
  showPairs,
  onItem,
  onCompare,
}: {
  run: InversionRun
  frame: InversionFrame | undefined
  showPairs: boolean
  onItem: (v: InversionItem) => void
  onCompare: () => void
}) {
  const id = useId(),
    left = frame?.left ?? run.root.sorted,
    right = frame?.right ?? [],
    i = frame?.i ?? 0,
    j = frame?.j ?? 0,
    output = frame?.output ?? run.root.sorted,
    hasComparison = !!frame && i < left.length && j < right.length,
    added = frame?.added.length ?? 0
  function cells(items: InversionItem[], x: number, y: number, width: number, active: number, tone: string) {
    const step = Math.min(82, width / Math.max(1, items.length)),
      start = x + (width - step * items.length) / 2
    return items.map((item, k) => (
      <g
        key={item.index}
        role="button"
        tabIndex={0}
        aria-label={tr(`Inspect input index ${item.index}: ${number(item.value)}`)}
        className={`iv-cell iv-${tone} ${k === active ? 'iv-selected' : ''}`}
        onClick={() => onItem(item)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onItem(item)
          }
        }}
      >
        <rect x={start + k * step} y={y} width={step - 6} height="43" rx="6" />
        <text x={start + k * step + (step - 6) / 2} y={y + 28} textAnchor="middle" style={{ fontSize: items.length > 6 ? 10 : 18 }}>
          {items.length > 6 ? compact(item.value) : number(item.value)}
        </text>
      </g>
    ))
  }
  return (
    <div className="iv-diagram-scroll" role="region" tabIndex={0} aria-label={tr('Scrollable merge-and-count diagram')}>
      <svg className="iv-diagram" viewBox="0 0 861 341" preserveAspectRatio="none" aria-label={tr('Sorted halves, current comparison and merged array')}>
        <defs>
          <linearGradient id={`${id}-blue`} x2="0" y2="1">
            <stop stopColor="#eef6fe" />
            <stop offset="1" stopColor="#ecf4fd" />
          </linearGradient>
          <linearGradient id={`${id}-red`} x2="0" y2="1">
            <stop stopColor="#fdf5f8" />
            <stop offset="1" stopColor="#fcf0f4" />
          </linearGradient>
          <linearGradient id={`${id}-active`} x2="0" y2="1">
            <stop stopColor="#2398ff" />
            <stop offset="1" stopColor="#0070e8" />
          </linearGradient>
          <marker id={`${id}-arrow`} markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
            <path d="M0 0L7 4L0 8" fill="none" stroke="#0875ff" />
          </marker>
          <marker id={`${id}-pink`} markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
            <path d="M0 0L7 4L0 8" fill="none" stroke="#ff315d" />
          </marker>
        </defs>
        <rect x="13" y="11" width="398" height="133" rx="12" fill={`url(#${id}-blue)`} />
        <rect x="447" y="11" width="398" height="133" rx="12" fill={`url(#${id}-red)`} />
        <text className="iv-half-title" x="47" y="33">
          {tr('Left half (sorted)')}
        </text>
        <text className="iv-half-title iv-red-text" x="491" y="33">
          {tr('Right half (sorted)')}
        </text>
        <text className="iv-list-glyph" x="29" y="33">
          ≡
        </text>
        <text className="iv-list-glyph iv-red-text" x="465" y="33">
          ≡
        </text>
        <g className="iv-left-cells">{cells(left, 50, 85, 326, i, 'blue')}</g>
        <g className="iv-right-cells">{cells(right, 520, 85, 308, j, 'red')}</g>
        {left.length > 0 && i < left.length && (
          <g className="iv-pointer iv-left-pointer">
            <text
              x={50 + (326 - Math.min(82, 326 / left.length) * left.length) / 2 + Math.min(82, 326 / left.length) * (i + 0.5) - 3}
              y="62"
              textAnchor="middle"
            >
              {`i = ${i}`}
            </text>
            <path d={`M${50 + (326 - Math.min(82, 326 / left.length) * left.length) / 2 + Math.min(82, 326 / left.length) * (i + 0.5) - 9} 69h12l-6 10Z`} />
          </g>
        )}
        {right.length > 0 && j < right.length && (
          <g className="iv-pointer iv-right-pointer">
            <text
              x={520 + (308 - Math.min(82, 308 / right.length) * right.length) / 2 + Math.min(82, 308 / right.length) * (j + 0.5) - 3}
              y="62"
              textAnchor="middle"
            >
              {`j = ${j}`}
            </text>
            <path d={`M${520 + (308 - Math.min(82, 308 / right.length) * right.length) / 2 + Math.min(82, 308 / right.length) * (j + 0.5) - 9} 69h12l-6 10Z`} />
          </g>
        )}
        <path d="M226 145Q218 180 349 193" fill="none" stroke="#0875ff" strokeWidth="1.8" markerEnd={`url(#${id}-arrow)`} />
        <path d="M540 145Q536 160 501 174" fill="none" stroke="#ff315d" strokeWidth="1.8" markerEnd={`url(#${id}-pink)`} />
        <g
          className="iv-compare"
          role="button"
          tabIndex={0}
          aria-label={tr('Inspect current comparison')}
          onClick={onCompare}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              onCompare()
            }
          }}
        >
          <rect x="364" y="159" width="133" height="61" rx="31" />
          <text x="430.5" y="183" textAnchor="middle">
            {tr(hasComparison ? 'Compare' : 'Merge')}
          </text>
          <text x="430.5" y="206" textAnchor="middle">
            {hasComparison ? `${number(left[i].value)} > ${number(right[j].value)} ?` : tr(frame ? 'Copy remainder' : 'Single value')}
          </text>
        </g>
        {showPairs && hasComparison && (
          <g
            className={`iv-addition ${added ? 'iv-adds' : 'iv-no-add'}`}
            role="button"
            tabIndex={0}
            aria-label={tr('Inspect newly added inversion pairs')}
            onClick={onCompare}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onCompare()
              }
            }}
          >
            <rect x="586" y="153" width="195" height="80" rx="10" />
            <text x="602" y="178">
              {tr(added ? `Yes! ${number(right[j].value)} is smaller.` : 'No new inversions.')}
            </text>
            <text x="602" y="200">
              {tr(`This adds ${added} inversions`)}
            </text>
            <text className="iv-pair-preview" x="602" y="222">
              {frame?.added
                .slice(0, 3)
                .map((p) => `(${number(p.left.value)},${number(p.right.value)})`)
                .join(', ')}
              {added > 3 ? ' …' : ''}
            </text>
            <path d="M586 192L513 195M520 187l-9 8 12 8" fill="none" stroke="#ff315d" strokeWidth="1.5" />
          </g>
        )}
        <rect x="21" y="230" width="817" height="98" rx="11" fill={`url(#${id}-blue)`} stroke="#dcecff" />
        <path d="M430 220V241m-5-6 5 6 5-6" stroke="#093777" fill="none" strokeWidth="2" />
        <text className="iv-output-title" x="46" y="253">
          {tr('Merged array (in progress)')}
        </text>
        <g className="iv-output-cells">
          {Array.from({ length: frame ? left.length + right.length : run.values.length }, (_, k) => {
            const count = frame ? left.length + right.length : run.values.length,
              w = Math.min(92, 750 / count),
              x = 55 + k * w,
              item = output[k]
            return (
              <g key={k} className={item && k === output.length - 1 && frame?.take === 'right' ? 'iv-latest-right' : ''}>
                <rect x={x} y="268" width={w - 8} height="47" rx="6" />
                <text x={x + (w - 8) / 2} y="299" textAnchor="middle" style={{ fontSize: count > 12 ? 9 : 19 }}>
                  {item ? (count > 12 ? compact(item.value) : number(item.value)) : ''}
                </text>
              </g>
            )
          })}
        </g>
      </svg>
    </div>
  )
}

export function InversionsMockupLesson(props: MockupPageProps) {
  useLocaleRender()
  const navigate = useNavigate(),
    [tab, setTab] = useState<MockupTab>('Visualization'),
    [values, setValues] = useState(inversionExample)
  const run = useMemo(() => runInversionLesson(values), [values])
  const [cursor, setCursor] = useState(() => runInversionLesson(inversionExample).defaultCursor),
    [mode, setMode] = useState('merge'),
    [showPairs, setShowPairs] = useState(true),
    [playing, setPlaying] = useState(false),
    [speed, setSpeed] = useState(700),
    [modal, setModal] = useState<'edit' | 'compare' | 'item' | 'result' | null>(null),
    [draft, setDraft] = useState(''),
    [error, setError] = useState(''),
    [selectedItem, setSelectedItem] = useState<InversionItem>({ value: 1, index: 0 }),
    [prediction, setPrediction] = useState(''),
    [feedback, setFeedback] = useState(''),
    [localTheme, setLocalTheme] = useState(() => localStorage.getItem('algodrishti-theme') ?? 'light'),
    dialog = useRef<HTMLDialogElement>(null),
    editor = useRef<HTMLTextAreaElement>(null)
  const [notes, setNotes] = usePersistentState('algodrishti-inversion-notes', '', persistentString)
  const frame = run.frames[cursor],
    theme = props.theme ?? localTheme,
    node = run.nodes.find((n) => n.id === frame?.node) ?? run.root,
    positions = mode === 'recursive' ? run.frames.map((_, i) => i) : run.rootFrames,
    step = frame?.output.length ?? run.values.length,
    mergeLength = frame ? frame.left.length + frame.right.length : run.values.length,
    currentCount = frame?.count ?? 0,
    comparison = frame?.comparison ?? 'Single value',
    added = frame?.added.length ?? 0,
    ledger = frame?.ledger ?? [],
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
      const next = positions.find((i) => i > cursor)
      if (next === undefined) {
        setPlaying(false)
        return
      }
      setCursor(next)
      if (next === positions.at(-1)) setPlaying(false)
    }, speed)
    return () => window.clearTimeout(timer)
  }, [playing, positions, cursor, speed])
  function load(next: number[], fromStart = false) {
    const r = runInversionLesson(next)
    setValues([...next])
    setCursor(fromStart ? (mode === 'recursive' ? 0 : (r.rootFrames[0] ?? -1)) : r.defaultCursor)
    setPlaying(false)
    setFeedback('')
    setError('')
  }
  function openEditor() {
    setDraft(values.join(', '))
    setError('')
    setPlaying(false)
    setModal('edit')
  }
  function advance() {
    setPlaying(false)
    setCursor(positions.find((i) => i > cursor) ?? positions[0] ?? -1)
  }
  function view(next: string) {
    if (next === 'custom') {
      openEditor()
      return
    }
    setMode(next)
    setPlaying(false)
    setCursor(next === 'recursive' ? 0 : run.defaultCursor)
  }
  function inspectItem(item: InversionItem) {
    setSelectedItem(item)
    setPlaying(false)
    setModal('item')
  }
  function compare() {
    setPlaying(false)
    setModal('compare')
  }
  function changeTab(next: MockupTab) {
    setTab(next)
    setPlaying(false)
  }
  function shuffle() {
    const shuffled = [...values]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    if (shuffled.length > 1 && shuffled.every((v, i) => v === values[i])) shuffled.push(shuffled.shift()!)
    load(shuffled)
  }
  return (
    <div className="mom-page target-visual inversions-page" data-target="33">
      <header className="iv-topbar">
        <button className="iv-back" aria-label={tr('Back to Eulerian trail')} onClick={() => navigate('/daa-extensions/eulerian-trail')}>
          <ArrowLeft size={19} />
        </button>
        <div className="iv-title-row">
          <h1>{tr('Counting Inversions')}</h1>
          <p>{tr('Count cross inversions while merging sorted halves.')}</p>
        </div>
        <button className="mom-study" aria-pressed={studied} onClick={() => props.toggleCompleted(props.module.id)}>
          {studied ? <Check size={16} /> : <Bookmark size={16} />} {tr(studied ? 'Studied' : 'Mark studied')}
        </button>
        <AccountControl showLanguage={false} />
      </header>
      <MockupTabs active={tab} onChange={changeTab} tabs={tabs} />
      {tab === 'Visualization' ? (
        <>
          <div className="iv-top-grid">
            <section className="iv-visualization">
              <header className="iv-visual-heading">
                <span className="iv-main-icon">
                  <svg viewBox="0 0 28 28" aria-hidden="true">
                    <path d="M6 10L14 20L22 8M14 20L22 19" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                    <path d="M2 10L6 6L10 10L6 14ZM10 20L14 16L18 20L14 24ZM18 8L22 4L26 8L22 12ZM19 19L22 16L25 19L22 22Z" fill="currentColor" />
                  </svg>
                </span>
                <div>
                  <h2>{tr('Interactive Visualization')}</h2>
                  <p>{tr('See how merge sort counts cross inversions while merging two sorted halves.')}</p>
                </div>
                <select aria-label={tr('Inversion visualization view')} value={mode} onChange={(e) => view(e.target.value)}>
                  <option value="merge">{tr('Merge sort view')}</option>
                  <option value="recursive">{tr('Recursive merge trace')}</option>
                  <option value="custom">{tr('Custom array…')}</option>
                </select>
              </header>
              <div className="iv-graph-canvas">
                <MergeDiagram run={run} frame={frame} showPairs={showPairs} onItem={inspectItem} onCompare={compare} />
              </div>
              <div className="iv-controls">
                <button className="iv-primary iv-step" onClick={advance} disabled={!positions.length}>
                  <Play size={18} fill="currentColor" />
                  {tr('Step merge')}
                </button>
                <button className="iv-shuffle" onClick={shuffle}>
                  <Shuffle size={19} />
                  {tr('Shuffle array')}
                </button>
                <button
                  className="iv-reset"
                  onClick={() => {
                    setMode('merge')
                    load(inversionExample)
                    setShowPairs(true)
                  }}
                >
                  <RotateCcw size={20} />
                  {tr('Reset')}
                </button>
                <i className="iv-divider" />
                <label className="iv-size">
                  {tr('Array size:')}
                  <select
                    aria-label={tr('Inversion array size')}
                    value={values.length}
                    onChange={(e) => load(Array.from({ length: Number(e.target.value) }, (_, i) => Number(e.target.value) - i))}
                  >
                    {[...new Set([1, 2, 4, 6, 8, 10, 12, 16, 20, values.length])]
                      .sort((a, b) => a - b)
                      .map((n) => (
                        <option key={n} value={n}>
                          {n}
                        </option>
                      ))}
                  </select>
                </label>
                <label className="iv-switch">
                  <input type="checkbox" checked={showPairs} onChange={(e) => setShowPairs(e.target.checked)} aria-label={tr('Show inversion pairs')} />
                  <i />
                  {tr('Show inversion pairs')}
                </label>
              </div>
            </section>
            <div className="iv-explanation-column">
              <Panel title={tr('How it works')} icon={<Info />} className="iv-how">
                <ol>
                  {[
                    'Recursively split the array into two halves until subarrays of size 1.',
                    'Merge the two sorted halves. When an element from the right half is smaller than the current element from the left half, count inversions.',
                    'If right[j] < left[i], then all remaining elements left[i…end] form inversions with right[j]. Add (nLeft − i) to the count.',
                    'Continue merging until the array is sorted. The total count is the number of inversions.',
                  ].map((s, i) => (
                    <li key={s}>
                      <i>{i + 1}</i>
                      <p>{tr(s)}</p>
                    </li>
                  ))}
                </ol>
              </Panel>
              <Panel title={tr('Key insight')} icon={<Lightbulb />} className="iv-insight">
                <p>
                  {tr(
                    'When right[j] < left[i], it forms inversions with all remaining elements in the left half, because both halves are sorted. This is why we can count multiple inversions at once.',
                  )}
                </p>
              </Panel>
            </div>
          </div>
          <div className="iv-bottom-grid">
            <Panel title={tr('Current state')} icon={<BarChart3 />} className="iv-state">
              <dl>
                <div>
                  <dt>{tr('Inversion count')}</dt>
                  <dd className="iv-count">{currentCount}</dd>
                </div>
                <div>
                  <dt>{tr('Current comparison')}</dt>
                  <dd className="iv-comparison">{comparison}</dd>
                </div>
                <div>
                  <dt>{tr('Inversions added')}</dt>
                  <dd className="iv-added">{added}</dd>
                </div>
                <div>
                  <dt>{tr('Merge step')}</dt>
                  <dd className="iv-merge-step">
                    {step} / {mergeLength}
                  </dd>
                </div>
              </dl>
            </Panel>
            <Panel title={tr('Current inversions')} icon={<List />} className="iv-inversions">
              <div className="iv-ledger-scroll">
                <table className="iv-ledger">
                  <thead>
                    <tr>
                      {['#', 'Pair (i, j)', 'Values', 'When added'].map((h) => (
                        <th key={h}>{tr(h)}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {showPairs ? (
                      ledger.map((p, k) => (
                        <tr key={`${p.left.index}:${p.right.index}`} className={frame?.added[0] === p ? 'iv-new-pair' : ''}>
                          <td>{k + 1}</td>
                          <td>
                            <button
                              aria-label={tr(`Inspect inversion pair ${p.left.index}, ${p.right.index}`)}
                              onClick={() => {
                                setCursor(p.event)
                                compare()
                              }}
                            >
                              ({p.left.index}, {p.right.index})
                            </button>
                          </td>
                          <td>
                            ({number(p.left.value)}, {number(p.right.value)})
                          </td>
                          <td>{tr(`Step ${p.mergeStep}`)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4}>{tr('Inversion pairs hidden')}</td>
                      </tr>
                    )}
                    {showPairs && !ledger.length && (
                      <tr>
                        <td colSpan={4}>{tr('No inversions counted yet')}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Panel>
            <Panel title={tr('Merge state')} icon={<FileText />} className="iv-merge-state">
              <dl>
                {[
                  ['Left index (i)', frame?.i ?? 0],
                  ['Right index (j)', frame?.j ?? 0],
                  ['Elements remaining in left', frame ? frame.left.length - frame.i : 0],
                  ['Elements remaining in right', frame ? frame.right.length - frame.j : 0],
                ].map(([label, value], k) => (
                  <div key={label}>
                    <dt>{tr(String(label))}</dt>
                    <dd className={`iv-state-${k}`}>{value}</dd>
                  </div>
                ))}
              </dl>
            </Panel>
          </div>
          <section className="iv-complexity">
            <span className="iv-icon">
              <BarChart3 />
            </span>
            <div>
              <h2>{tr('Complexity')}</h2>
              <strong>{tr('Time: O(n log n) • Auxiliary/output space: O(n)')}</strong>
              <p>{tr('Merge-sort recurrence with linear combining and geometric active copied arrays.')}</p>
            </div>
            <button className="iv-example-result" aria-label={tr('Inspect inversion example result')} onClick={() => setModal('result')}>
              <CheckCircle2 />
              <span>
                <b>{tr('Example result')}</b>
                <p>{tr(`For the current array, the total number of inversions is ${run.count}.`)}</p>
                <small>{tr('The array will be sorted after completing all merge steps.')}</small>
              </span>
            </button>
          </section>
        </>
      ) : tab === 'Learn' ? (
        <div className="iv-learning">
          <Panel title={tr('What Is an Inversion?')} icon={<BookOpen />}>
            <p>
              {tr(
                'An inversion is a pair of original positions (i, j) with i < j and A[i] > A[j]. It measures how far the array is from ascending order. Equal values are not inversions.',
              )}
            </p>
            <div className="iv-concepts">
              <article>
                <h3>{tr('Split')}</h3>
                <p>{tr('Divide positions into left and right ranges. Every inversion belongs entirely to one half or crosses from left to right.')}</p>
              </article>
              <article>
                <h3>{tr('Count in each half')}</h3>
                <p>
                  {tr(
                    'Recursively sort the halves and count inversions inside them. Original positions travel with each value, so duplicate values stay distinguishable.',
                  )}
                </p>
              </article>
              <article>
                <h3>{tr('Merge and count across halves')}</h3>
                <p>
                  {tr(
                    'If right[j] is smaller than left[i], it is smaller than every unmerged value in the sorted left half. Add left.length − i, then take right[j]. Otherwise take left[i]; ties go left.',
                  )}
                </p>
              </article>
            </div>
          </Panel>
          <Panel title={tr('Worked Example: Three New Pairs, Seven Total')} icon={<Lightbulb />}>
            <p>
              {tr(
                'For [1,3,5,8,2,4,6,7], the sorted halves are [1,3,5,8] and [2,4,6,7]. Take 1 with no inversion. Comparing 3 and 2 adds (3,2), (5,2), and (8,2): three pairs. Taking 4 adds (5,4) and (8,4): two more. Taking 6 and 7 each adds one pair with 8. Total: 3 + 2 + 1 + 1 = 7.',
              )}
            </p>
            <button
              onClick={() => {
                setMode('merge')
                load(inversionExample)
                setTab('Visualization')
              }}
            >
              {tr('Explore worked example')}
            </button>
          </Panel>
          <Panel title={tr('Why It Is Correct')} icon={<CheckCircle2 />}>
            <p>
              {tr(
                'Every cross inversion is counted exactly once when its right-hand value is copied. No remaining left value can be smaller than left[i], and earlier copied left values are not greater than the chosen right value. Adding the left, right, and cross counts covers every inversion without overlap.',
              )}
            </p>
            <p>
              {tr(
                'A sorted array has 0 inversions. A reverse-sorted array of distinct values has n(n−1)/2. The algorithm needs O(n) auxiliary space when arrays are reused or copied only along the active recursion path. This learning tool additionally retains snapshots and up to O(n²) pair records for inspection.',
              )}
            </p>
          </Panel>
        </div>
      ) : tab === 'Code' ? (
        <Panel title={tr('Stable Merge-and-Count Pseudocode')} icon={<Code2 />} className="iv-code">
          <pre>
            <code>{`countSort(A):
  if length(A) <= 1: return (A, 0)
  L, leftCount = countSort(left half of A)
  R, rightCount = countSort(right half of A)
  i = j = crossCount = 0
  merged = []
  while i < length(L) and j < length(R):
    if L[i] <= R[j]:       // ties are NOT inversions
      merged.push(L[i]); i++
    else:
      crossCount += length(L) - i
      merged.push(R[j]); j++
  append unconsumed L and R to merged
  return (merged, leftCount + rightCount + crossCount)`}</code>
          </pre>
          <p>{tr('Indices shown in the pair ledger are zero-based positions in the original input, rather than positions in the sorted temporary halves.')}</p>
        </Panel>
      ) : tab === 'Practice' ? (
        <Panel title={tr('Predict the Inversion Count')} icon={<Lightbulb />} className="iv-practice">
          <p>{tr('How many inversions are in this input? Count original index pairs, not just adjacent swaps in a single pass.')}</p>
          <p className="iv-practice-array">[{values.map(number).join(', ')}]</p>
          <input
            type="number"
            min="0"
            aria-label={tr('Predicted inversion count')}
            value={prediction}
            onChange={(e) => {
              setPrediction(e.target.value)
              setFeedback('')
            }}
          />
          <button
            className="iv-primary"
            onClick={() =>
              setFeedback(
                prediction.trim() !== '' && Number(prediction) === run.count
                  ? `Correct! There are ${run.count} inversions.`
                  : 'Try again. Include every pair i < j with A[i] > A[j]; equal values do not count.',
              )
            }
          >
            {tr('Check prediction')}
          </button>
          {feedback && <p role="status">{tr(feedback)}</p>}
          <p>
            {tr(
              'For a reverse-sorted array of n distinct values, every pair is inverted: n(n−1)/2. For equal values the strict comparison prevents false pairs.',
            )}
          </p>
        </Panel>
      ) : (
        <div className="iv-experiments">
          <Panel title={tr('Editable Array and Merge Laboratory')} icon={<Settings />}>
            <div className="iv-lab-actions">
              <button className="iv-primary" onClick={openEditor}>
                {tr('Edit custom array')}
              </button>
              {[
                ['Sorted', [1, 2, 3, 4, 5, 6, 7, 8]],
                ['Reverse sorted', [8, 7, 6, 5, 4, 3, 2, 1]],
                ['Duplicates', [3, 1, 3, 1]],
                ['Negative values', [-1, -5, -3, 0]],
                ['Singleton', [42]],
              ].map(([name, input]) => (
                <button key={String(name)} onClick={() => load(input as number[])}>
                  {tr(String(name))}
                </button>
              ))}
            </div>
            <p>
              {tr('Current input: ')}[{values.map(number).join(', ')}]
            </p>
            <label>
              {tr('Trace view')}
              <select aria-label={tr('Inversion experiment trace view')} value={mode} onChange={(e) => view(e.target.value)}>
                <option value="merge">{tr('Root merge')}</option>
                <option value="recursive">{tr('All recursive merges')}</option>
              </select>
            </label>
            <label>
              {tr('Playback speed')}
              <select aria-label={tr('Inversion playback speed')} value={speed} onChange={(e) => setSpeed(Number(e.target.value))}>
                <option value={700}>{tr('Normal')}</option>
                <option value={100}>{tr('Fast')}</option>
                <option value={1400}>{tr('Slow')}</option>
              </select>
            </label>
            <div className="iv-lab-actions">
              <button
                onClick={() => {
                  setCursor(positions[0] ?? -1)
                  setPlaying(false)
                }}
              >
                {tr('Jump to first merge')}
              </button>
              <button
                onClick={() => {
                  setCursor(positions.at(-1) ?? -1)
                  setPlaying(false)
                }}
              >
                {tr('Jump to final result')}
              </button>
              <button
                disabled={!positions.length}
                onClick={() => {
                  if (cursor === positions.at(-1)) setCursor(positions[0])
                  setPlaying(!playing)
                }}
              >
                {playing ? <Pause size={17} /> : <Play size={17} />} {tr(playing ? 'Pause playback' : 'Auto merge')}
              </button>
              <button onClick={() => setTab('Visualization')}>{tr('Return to merge visualization')}</button>
            </div>
            <p className="iv-run-summary" role="status">
              {tr(`Merge range [${node.lo}…${node.hi}]. Trace event ${cursor + 1} / ${run.frames.length}. Counted ${currentCount} of ${run.count} inversions.`)}
            </p>
            <p>
              {tr('Sorted result: ')}[{run.sorted.map(number).join(', ')}]
            </p>
            <div className="iv-merge-nodes">
              {run.nodes
                .filter((n) => n.left)
                .map((n) => (
                  <button
                    key={n.id}
                    onClick={() => {
                      setMode('recursive')
                      setCursor(run.frames.findIndex((f) => f.node === n.id))
                      setPlaying(false)
                    }}
                  >
                    {tr(`Inspect merge [${n.lo}…${n.hi}]`)}
                  </button>
                ))}
            </div>
          </Panel>
          <Panel title={tr('Your Inversion Notes')} icon={<BookOpen />}>
            <LanguageSelector />
            <label>
              {tr('Notes')}
              <textarea aria-label={tr('Inversion notes')} value={notes} onChange={(e) => setNotes(e.target.value)} />
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
        className="iv-dialog"
        aria-label={tr(
          modal === 'edit'
            ? 'Edit inversion array'
            : modal === 'item'
              ? 'Inspect inversion input value'
              : modal === 'compare'
                ? 'Inspect inversion comparison'
                : 'Inversion example result',
        )}
        onCancel={() => setModal(null)}
      >
        <button className="iv-close" aria-label={tr('Close inversion dialog')} onClick={() => setModal(null)}>
          <X />
        </button>
        {modal === 'edit' ? (
          <>
            <h2>{tr('Edit Custom Array')}</h2>
            <p>
              {tr(
                'Enter 1–20 finite numbers between −1000000 and 1000000, separated by commas or spaces, or use a JSON array. Duplicate and negative values are supported.',
              )}
            </p>
            <textarea ref={editor} aria-label={tr('Inversion array input')} value={draft} onChange={(e) => setDraft(e.target.value)} />
            {error && <p role="alert">{tr(error)}</p>}
            <button
              className="iv-primary"
              onClick={() => {
                try {
                  load(parseInversionValues(draft))
                  setModal(null)
                } catch (e) {
                  setError((e as Error).message)
                }
              }}
            >
              {tr('Apply inversion array')}
            </button>
          </>
        ) : modal === 'item' ? (
          <>
            <h2>{tr(`Original index ${selectedItem.index}: ${number(selectedItem.value)}`)}</h2>
            <p>{tr('An inversion requires the left original index to be smaller and its value strictly greater. Equal values do not count.')}</p>
            <ul>
              {run.pairs
                .filter((p) => p.left.index === selectedItem.index || p.right.index === selectedItem.index)
                .map((p) => (
                  <li key={`${p.left.index}:${p.right.index}`}>
                    {tr(`Indices (${p.left.index}, ${p.right.index}): ${number(p.left.value)} > ${number(p.right.value)}`)}
                  </li>
                ))}
            </ul>
            <button onClick={openEditor}>{tr('Edit input values')}</button>
          </>
        ) : modal === 'compare' ? (
          <>
            <h2>{tr('Current Merge Comparison')}</h2>
            <p>{tr(`Range [${node.lo}…${node.hi}], merge step ${step} / ${mergeLength}.`)}</p>
            <p>{tr(comparison)}</p>
            <p>{tr(`New inversions: ${added}. Total counted so far: ${currentCount}.`)}</p>
            {frame && (
              <p>
                {tr(
                  frame.added.length
                    ? `The remaining ${frame.left.length - frame.i} sorted left values exceed the right value. Each contributes exactly one pair.`
                    : 'Taking from the left, breaking a tie to the left, or copying a remainder adds no cross inversions.',
                )}
              </p>
            )}
            <ul>
              {frame?.added.map((p) => (
                <li key={p.left.index}>{tr(`Original indices (${p.left.index}, ${p.right.index}): ${number(p.left.value)} > ${number(p.right.value)}`)}</li>
              ))}
            </ul>
            <button
              onClick={() => {
                setModal(null)
                advance()
              }}
              disabled={!positions.length}
            >
              {tr('Next merge step')}
            </button>
          </>
        ) : (
          <>
            <h2>{tr('Inversion Example Result')}</h2>
            <p>{tr(`Total inversions: ${run.count}.`)}</p>
            <p>
              {tr('Input: ')}[{values.map(number).join(', ')}]
            </p>
            <p>
              {tr('Sorted result: ')}[{run.sorted.map(number).join(', ')}]
            </p>
            <p>{tr('The total includes inversions inside both halves plus all cross inversions. Pair indices always refer to the original input.')}</p>
            <button
              onClick={() => {
                setModal(null)
                setCursor(positions[0] ?? -1)
                setPlaying(false)
                setTab('Visualization')
              }}
            >
              {tr('Replay merge')}
            </button>
          </>
        )}
      </dialog>
    </div>
  )
}
