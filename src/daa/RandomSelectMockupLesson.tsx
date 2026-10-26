// @localized-render
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  BarChart3,
  Bookmark,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronsRight,
  CircleHelp,
  Code2,
  Dices,
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
  Target,
  X,
} from 'lucide-react'
import { AccountControl } from '../account/AccountControl'
import { LanguageSelector } from '../i18n/LanguageSelector'
import { tx, useLocaleRender } from '../i18n/render'
import { persistentString, usePersistentState } from '../hooks/usePersistentState'
import { MockupTabs, type MockupPageProps, type MockupTab } from './MockupLessonChrome'
import {
  parseSelectionRank,
  parseSelectionSeed,
  parseSelectionValues,
  randomSelectExample,
  runRandomSelection,
  shuffleSelectionValues,
  type SelectItem,
} from './randomSelectLessonModel'
import './random-select-mockup.css'
const tr = (s: string) => tx(s, 'studios'),
  tabs: MockupTab[] = ['Learn', 'Visualization', 'Code', 'Practice', 'Experiments'],
  compact = (n: number) =>
    Math.abs(n) >= 1e6
      ? `${n / 1e6}M`
      : Math.abs(n) >= 1000
        ? `${Number((n / 1000).toPrecision(2))}k`
        : n !== 0 && Math.abs(n) < 0.001
          ? n.toExponential(0)
          : Number(n.toPrecision(3)).toString()
function Panel({ title, icon, children, className = '' }: { title: string; icon: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`rs-panel ${className}`}>
      <header>
        <span className="rs-icon">{icon}</span>
        <h2>{title}</h2>
      </header>
      {children}
    </section>
  )
}
export function RandomSelectMockupLesson(props: MockupPageProps) {
  useLocaleRender()
  const navigate = useNavigate(),
    [tab, setTab] = useState<MockupTab>('Visualization'),
    [run, setRun] = useState(() => runRandomSelection(randomSelectExample, 4, 42)),
    [cursor, setCursor] = useState(1),
    [arrayDraft, setArrayDraft] = useState(randomSelectExample.join(', ')),
    [kDraft, setKDraft] = useState('4'),
    [seedDraft, setSeedDraft] = useState('42'),
    [indices, setIndices] = useState(true),
    [zones, setZones] = useState(true),
    [auto, setAuto] = useState(false),
    [playing, setPlaying] = useState(false),
    [speed, setSpeed] = useState(1000),
    [preview, setPreview] = useState(true),
    [error, setError] = useState(''),
    [modal, setModal] = useState<'item' | 'rank' | 'seed' | 'result' | null>(null),
    [itemId, setItemId] = useState(0),
    [prediction, setPrediction] = useState(''),
    [feedback, setFeedback] = useState(''),
    [localTheme, setLocalTheme] = useState(() => localStorage.getItem('algodrishti-theme') ?? 'light'),
    dialog = useRef<HTMLDialogElement>(null),
    historyScroll = useRef<HTMLDivElement>(null)
  const [notes, setNotes] = usePersistentState('algodrishti-random-selection-notes', '', persistentString),
    frame = run.frames[cursor],
    theme = props.theme ?? localTheme,
    studied = props.completed.includes(props.module.id),
    pending = arrayDraft.trim() !== run.values.join(', ') || kDraft.trim() !== String(run.k) || seedDraft.trim() !== String(run.seed),
    item = frame.array.find((p) => p.id === itemId),
    history = preview ? run.steps : run.steps.filter((f) => run.frames.indexOf(f) <= cursor),
    n = run.values.length,
    cell = (822 - (n - 1) * 4) / n,
    step = cell + 4,
    pos = frame.position ?? frame.chosen,
    found = frame.branch === 'found',
    leftStart = 15 + frame.lo * step,
    leftEnd = 15 + pos * step - 4,
    rightStart = 15 + (pos + 1) * step,
    rightEnd = 15 + (frame.hi + 1) * step - 4,
    sortedReference = [...run.values].sort((a, b) => a - b)
  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem('algodrishti-theme', theme)
  }, [theme])
  useEffect(() => {
    if (modal) dialog.current?.showModal()
    else dialog.current?.close()
  }, [modal])
  useEffect(() => {
    const container = historyScroll.current,
      active = container?.querySelector('.rs-current-step')
    if (!container || !active) return
    const box = container.getBoundingClientRect(),
      row = active.getBoundingClientRect()
    if (row.bottom > box.bottom) container.scrollTop += row.bottom - box.bottom
    else if (row.top < box.top + 28) container.scrollTop += row.top - box.top - 28
  }, [cursor, tab, preview, run])
  useEffect(() => {
    if (!playing) return
    const timer = window.setTimeout(() => {
      if (cursor >= run.frames.length - 1) {
        setPlaying(false)
        setAuto(false)
        return
      }
      setCursor(cursor + 1)
      if (cursor + 1 === run.frames.length - 1) {
        setPlaying(false)
        setAuto(false)
      }
    }, speed)
    return () => window.clearTimeout(timer)
  }, [playing, cursor, run.frames.length, speed])
  function load(values: number[], k: number, seed: number, start = false) {
    const next = runRandomSelection(values, k, seed)
    setRun(next)
    setArrayDraft(values.join(', '))
    setKDraft(String(k))
    setSeedDraft(String(seed))
    setCursor(start ? 0 : next.defaultCursor)
    setPlaying(false)
    setAuto(false)
    setPreview(!start)
    setError('')
    setFeedback('')
    return next
  }
  function apply(start = false) {
    const values = parseSelectionValues(arrayDraft),
      k = parseSelectionRank(kDraft, values.length),
      seed = parseSelectionSeed(seedDraft)
    return load(values, k, seed, start)
  }
  function start() {
    if (playing) {
      setPlaying(false)
      setAuto(false)
      return
    }
    try {
      const next = apply(true)
      setPlaying(auto && next.frames.length > 1)
      setAuto(auto && next.frames.length > 1)
    } catch (e) {
      setError((e as Error).message)
    }
  }
  function next() {
    try {
      setPlaying(false)
      setAuto(false)
      if (pending) {
        apply()
        return
      }
      setError('')
      setPreview(false)
      setCursor(cursor === run.frames.length - 1 ? 0 : cursor + 1)
    } catch (e) {
      setError((e as Error).message)
    }
  }
  function shuffle() {
    try {
      const values = parseSelectionValues(arrayDraft),
        k = parseSelectionRank(kDraft, values.length),
        seed = parseSelectionSeed(seedDraft)
      load(shuffleSelectionValues(values, seed), k, seed)
    } catch (e) {
      setError((e as Error).message)
    }
  }
  function randomSeed() {
    try {
      const values = parseSelectionValues(arrayDraft),
        k = parseSelectionRank(kDraft, values.length),
        seed = crypto.getRandomValues(new Uint32Array(1))[0]
      load(values, k, seed)
    } catch (e) {
      setError((e as Error).message)
    }
  }
  function inspectItem(p: SelectItem) {
    setItemId(p.id)
    setPlaying(false)
    setAuto(false)
    setModal('item')
  }
  function changeTab(next: MockupTab) {
    setTab(next)
    setPlaying(false)
    setAuto(false)
  }
  function toggleAuto(on: boolean) {
    try {
      if (on && pending) {
        const next = apply(true)
        setPlaying(next.frames.length > 1)
      } else {
        if (on && cursor === run.frames.length - 1) setCursor(0)
        setPlaying(on && run.frames.length > 1)
      }
      setAuto(on)
      setError('')
    } catch (e) {
      setError((e as Error).message)
      setAuto(false)
      setPlaying(false)
    }
  }
  const description =
    frame.kind === 'choose'
      ? `Choose pivot ${frame.pivot.value} from index ${frame.chosen}. Partition the active range [${frame.lo}, ${frame.hi}] before deciding which side contains the target.`
      : found
        ? `The target rank in this subarray is ${frame.localK}, matching the pivot rank ${frame.rank}. The answer is ${frame.pivot.value}.`
        : `Pivot ${frame.pivot.value} is placed at its final position. Since k = ${frame.localK} ${frame.branch === 'left' ? '<' : '>'} r = ${frame.rank}, continue with the ${frame.branch} subarray${frame.branch === 'right' ? `, adjusted rank k = ${frame.nextK}` : ''}.`
  return (
    <div className="mom-page target-visual random-select-page" data-target="37">
      <header className="rs-topbar">
        <button className="rs-back" aria-label={tr('Back to randomized quicksort')} onClick={() => navigate('/daa-extensions/randomized-quicksort')}>
          <ArrowLeft size={19} />
        </button>
        <div className="rs-title-row">
          <h1>{tr('Randomized Selection')}</h1>
          <p>{tr('Visualize Quickselect with random pivots to find the k-th smallest element.')}</p>
        </div>
        <button className="mom-study" aria-pressed={studied} onClick={() => props.toggleCompleted(props.module.id)}>
          {studied ? <Check size={16} /> : <Bookmark size={16} />} {tr(studied ? 'Studied' : 'Mark studied')}
        </button>
        <AccountControl showLanguage={false} />
      </header>
      <MockupTabs active={tab} onChange={changeTab} tabs={tabs} />
      {tab === 'Visualization' ? (
        <>
          <div className="rs-top-grid">
            <section className="rs-visualization">
              <header className="rs-visual-heading">
                <span className="rs-main-icon">
                  <svg viewBox="0 0 28 28" aria-hidden="true">
                    <path d="M6 10L14 20L22 8M14 20L22 19" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                    <path d="M2 10L6 6L10 10L6 14ZM10 20L14 16L18 20L14 24ZM18 8L22 4L26 8L22 12ZM19 19L22 16L25 19L22 22Z" fill="currentColor" />
                  </svg>
                </span>
                <div>
                  <h2>{tr('Interactive Visualization')}</h2>
                  <p>
                    {tr(
                      'Run randomized Quickselect step by step. A random pivot is chosen, the array is partitioned, and only the relevant side containing the target rank is searched next.',
                    )}
                  </p>
                </div>
              </header>
              <div className="rs-input-panel">
                <div className="rs-array-input">
                  <label htmlFor="rs-array-input">{tr('Array (comma separated)')}</label>
                  <div>
                    <input
                      id="rs-array-input"
                      aria-label={tr('Quickselect array')}
                      value={arrayDraft}
                      onChange={(e) => {
                        setArrayDraft(e.target.value)
                        setPlaying(false)
                        setAuto(false)
                      }}
                    />
                    <button onClick={shuffle}>
                      <Shuffle size={16} />
                      {tr('Shuffle')}
                    </button>
                  </div>
                </div>
                <div className="rs-rank-input">
                  <div className="rs-input-label">
                    <label htmlFor="rs-rank-input">{tr('Target rank k')}</label>
                    <button
                      aria-label={tr('Explain target rank')}
                      onClick={() => {
                        setPlaying(false)
                        setModal('rank')
                      }}
                    >
                      <CircleHelp size={14} />
                    </button>
                  </div>
                  <input
                    id="rs-rank-input"
                    type="number"
                    min="1"
                    max={run.values.length}
                    step="1"
                    aria-label={tr('Quickselect target rank')}
                    value={kDraft}
                    onChange={(e) => {
                      setKDraft(e.target.value)
                      setPlaying(false)
                      setAuto(false)
                    }}
                  />
                  <small>
                    {tr(`Find ${kDraft || 'k'}-th smallest`)}
                    <br />
                    {tr('(1-indexed)')}
                  </small>
                </div>
                <div className="rs-seed-input">
                  <div className="rs-input-label">
                    <label htmlFor="rs-seed-input">{tr('Random seed')}</label>
                    <button
                      aria-label={tr('Explain quickselect seed')}
                      onClick={() => {
                        setPlaying(false)
                        setModal('seed')
                      }}
                    >
                      <CircleHelp size={14} />
                    </button>
                  </div>
                  <div>
                    <input
                      id="rs-seed-input"
                      type="number"
                      min="0"
                      max="4294967295"
                      step="1"
                      aria-label={tr('Quickselect random seed')}
                      value={seedDraft}
                      onChange={(e) => {
                        setSeedDraft(e.target.value)
                        setPlaying(false)
                        setAuto(false)
                      }}
                    />
                    <button onClick={randomSeed}>
                      <Dices size={23} />
                      {tr('Random')}
                    </button>
                  </div>
                </div>
              </div>
              {error && (
                <p className="rs-input-error" role="alert">
                  {tr(error)}
                </p>
              )}
              {pending && !error && (
                <p className="rs-input-notice" role="status">
                  {tr('Inputs changed. Start / Run or Step to apply them.')}
                </p>
              )}
              <div className="rs-diagram-scroll" role="region" tabIndex={0} aria-label={tr('Scrollable quickselect partition and rank diagram')}>
                <div className="rs-diagram">
                  <h3>
                    <b>{tr(`Step ${cursor + 1}: `)}</b>
                    {tr(
                      found
                        ? `Found ${frame.pivot.value}`
                        : frame.kind === 'choose'
                          ? `Choose random pivot ${frame.pivot.value}`
                          : `Partition around pivot ${frame.pivot.value}`,
                    )}
                  </h3>
                  <p>{tr(description)}</p>
                  <div className="rs-array-row" style={{ gridTemplateColumns: `repeat(${n},minmax(0,1fr))` }}>
                    {frame.array.map((p, i) => {
                      const active = i >= frame.lo && i <= frame.hi,
                        pivot = i === pos,
                        text = n > 12 || String(p.value).length > 8 ? compact(p.value) : String(p.value),
                        zone =
                          zones && frame.position !== null
                            ? pivot
                              ? found
                                ? 'rs-answer-cell'
                                : 'rs-pivot-cell'
                              : i < pos
                                ? 'rs-left-cell'
                                : 'rs-right-cell'
                            : pivot
                              ? 'rs-chosen-cell'
                              : ''
                      return (
                        <div key={p.id} className={`rs-item ${active ? '' : 'rs-inactive-item'}`}>
                          {indices && <span className="rs-index">{i}</span>}
                          <button
                            className={`rs-cell ${zone}`}
                            aria-label={tr(`Inspect selection value ${p.id}: ${p.value}`)}
                            title={String(p.value)}
                            onClick={() => inspectItem(p)}
                          >
                            <strong style={{ fontSize: Math.min(n > 12 ? 11 : 20, ((cell - 8) * 1.5) / text.length), whiteSpace: 'nowrap' }}>{text}</strong>
                          </button>
                        </div>
                      )
                    })}
                  </div>
                  {zones && frame.position !== null && (
                    <>
                      <svg className="rs-braces" viewBox="0 0 852 254" preserveAspectRatio="none" aria-hidden="true">
                        {frame.left > 0 && (
                          <path
                            className="rs-left-brace"
                            d={`M${leftStart} 158q0 9 15 9H${(leftStart + leftEnd) / 2 - 15}q15 0 15 10q0-10 15-10H${leftEnd - 15}q15 0 15-9`}
                          />
                        )}
                        <path className="rs-pivot-arrow" d={`M${15 + pos * step + cell / 2} 178v-17m-4 5 4-5 4 5`} />
                        {frame.right > 0 && (
                          <path
                            className="rs-right-brace"
                            d={`M${rightStart} 158q0 9 15 9H${(rightStart + rightEnd) / 2 - 15}q15 0 15 10q0-10 15-10H${rightEnd - 15}q15 0 15-9`}
                          />
                        )}
                      </svg>
                      {frame.left > 0 && (
                        <div
                          className="rs-zone-label rs-left-zone"
                          style={{ left: `${(leftStart / 852) * 100}%`, width: `${((leftEnd - leftStart) / 852) * 100}%` }}
                          title={tr(frame.branch === 'left' ? 'Search the left partition' : 'Discard the left partition')}
                        >
                          {leftEnd - leftStart < 120 ? '≤' : tr(`≤ pivot (${frame.branch === 'left' ? 'search here' : 'discard'})`)}
                        </div>
                      )}
                      <div className="rs-pivot-label" style={{ left: `${((15 + pos * step) / 852) * 100}%`, width: `${(cell / 852) * 100}%` }}>
                        <b>{tr(found ? 'Answer' : 'Pivot')}</b>
                        <strong title={String(frame.pivot.value)}>{String(frame.pivot.value)}</strong>
                        <small>{tr('(final position)')}</small>
                      </div>
                      {frame.right > 0 && (
                        <div
                          className="rs-zone-label rs-right-zone"
                          style={{ left: `${(rightStart / 852) * 100}%`, width: `${((rightEnd - rightStart) / 852) * 100}%` }}
                          title={tr(frame.branch === 'right' ? 'Search the right partition' : 'Discard the right partition')}
                        >
                          {rightEnd - rightStart < 120 ? '>' : tr(`> pivot (${frame.branch === 'right' ? 'search here' : 'discard'})`)}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
              <div className="rs-controls">
                <button className="rs-primary rs-start" onClick={start}>
                  {playing ? <Pause size={17} /> : <Play size={17} fill="currentColor" />}
                  {tr(playing ? 'Pause' : 'Start / Run')}
                </button>
                <button className="rs-step" onClick={next} disabled={run.frames.length === 1 && !pending}>
                  <ChevronsRight size={21} />
                  {tr('Step')}
                </button>
                <button
                  className="rs-reset"
                  onClick={() => {
                    load(randomSelectExample, 4, 42)
                    setIndices(true)
                    setZones(true)
                    setAuto(false)
                    setSpeed(1000)
                  }}
                >
                  <RotateCcw size={20} />
                  {tr('Reset')}
                </button>
                <label className="rs-switch">
                  <input type="checkbox" checked={indices} onChange={(e) => setIndices(e.target.checked)} aria-label={tr('Show indices')} />
                  <i />
                  {tr('Show indices')}
                </label>
                <label className="rs-switch">
                  <input type="checkbox" checked={zones} onChange={(e) => setZones(e.target.checked)} aria-label={tr('Show partition zones')} />
                  <i />
                  {tr('Show partition zones')}
                </label>
                <label className="rs-switch rs-auto-switch">
                  <input
                    type="checkbox"
                    disabled={run.frames.length === 1 && !pending}
                    checked={auto}
                    onChange={(e) => toggleAuto(e.target.checked)}
                    aria-label={tr('Quickselect auto play')}
                  />
                  <i />
                  {tr(`Auto play (${speed / 1000}s)`)}
                </label>
              </div>
            </section>
            <div className="rs-explanation-column">
              <Panel title={tr('How it works')} icon={<Info />} className="rs-how">
                <ol>
                  {[
                    'Choose a random pivot and partition the array into elements ≤ pivot and > pivot.',
                    'Let r be the rank (position) of the pivot in the sorted order.',
                    'If k = r, the pivot is the answer.',
                    'If k < r, recurse on the left subarray; otherwise recurse on the right subarray with adjusted rank.',
                  ].map((s, i) => (
                    <li key={s}>
                      <i>{i + 1}</i>
                      <p>{tr(s)}</p>
                    </li>
                  ))}
                </ol>
              </Panel>
              <Panel title={tr('Target rank')} icon={<Lightbulb />} className="rs-target">
                <p>
                  {tr(
                    `We find the k-th smallest element (1-indexed). For example, k = ${run.k} means the element that would appear at position ${run.k} in the sorted order.`,
                  )}
                </p>
              </Panel>
              <Panel title={tr('Current pivot')} icon={<Target />} className="rs-pivot-info">
                <dl>
                  <div>
                    <dt>{tr('Value:')}</dt>
                    <dd>{String(frame.pivot.value)}</dd>
                  </div>
                  <div>
                    <dt>{tr('Index:')}</dt>
                    <dd>{frame.position ?? frame.chosen}</dd>
                  </div>
                  <div>
                    <dt>{tr('Rank in subarray:')}</dt>
                    <dd>{frame.rank ?? '—'}</dd>
                  </div>
                  <div>
                    <dt>{tr('Left size:')}</dt>
                    <dd>{frame.position === null ? '—' : frame.left}</dd>
                    <dt>{tr('Right size:')}</dt>
                    <dd>{frame.position === null ? '—' : frame.right}</dd>
                  </div>
                </dl>
              </Panel>
            </div>
          </div>
          <div className="rs-bottom-grid">
            <Panel title={tr('Step-by-step state')} icon={<Network />} className="rs-history">
              <div ref={historyScroll} className="rs-history-scroll">
                <table aria-label={tr('Quickselect search path; future steps may be previewed')}>
                  <thead>
                    <tr>
                      {['Step', 'Subarray range [l, r]', 'Pivot (value)', 'Left size', 'Right size', 'Target rank k', 'Next subproblem'].map((s) => (
                        <th key={s}>{tr(s)}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {!history.length && (
                      <tr>
                        <td colSpan={7}>{tr('Partition the active subarray to record a search step.')}</td>
                      </tr>
                    )}
                    {history.map((f) => (
                      <tr key={f.step} className={f.step === frame.step ? 'rs-current-step' : ''}>
                        <td>
                          <button
                            aria-label={tr(`Show selection partition ${f.step}`)}
                            onClick={() => {
                              setCursor(run.frames.indexOf(f))
                              setPlaying(false)
                              setAuto(false)
                              setPreview(true)
                            }}
                          >
                            {f.step}
                          </button>
                        </td>
                        <td>
                          [{f.lo}, {f.hi}]
                        </td>
                        <td>{String(f.pivot.value)}</td>
                        <td>{f.left}</td>
                        <td>{f.right}</td>
                        <td>{f.localK}</td>
                        <td>
                          {tr(
                            f.branch === 'found'
                              ? `Found ${f.pivot.value}`
                              : `${f.branch === 'left' ? 'Left' : 'Right'} [${f.nextLo}, ${f.nextHi}]${f.branch === 'right' ? `, k=${f.nextK}` : ''}`,
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Panel>
            <Panel title={tr('Complexity')} icon={<BarChart3 />} className="rs-complexity">
              <strong>{tr('Time: Expected O(n); worst O(n²)')}</strong>
              <strong>{tr('Auxiliary/output space: O(1)')}</strong>
              <p>
                {tr(
                  'Distinct keys give expected linear time. Two-way partitions can be repeatedly unbalanced, including on duplicate-heavy input, leading to O(n²) time.',
                )}
              </p>
              <button
                className="rs-example-result"
                aria-label={tr('Inspect quickselect example result')}
                onClick={() => {
                  setPlaying(false)
                  setAuto(false)
                  setModal('result')
                }}
              >
                <CheckCircle2 />
                <span>
                  <b>{tr('Example result')}</b>
                  <p>{tr(`For the current input, the ${run.k}-th smallest element is ${run.result}. (Sorted order: ${sortedReference.join(', ')})`)}</p>
                </span>
              </button>
            </Panel>
          </div>
        </>
      ) : tab === 'Learn' ? (
        <div className="rs-learning">
          <Panel title={tr('Selection Searches One Side')} icon={<BookOpen />}>
            <p>
              {tr(
                'Quickselect finds the kth-smallest value without sorting the entire input. After partitioning, the pivot has rank r within the active subarray. If k = r, stop. If k < r, keep the left part. Otherwise keep the right part and subtract r from the local target rank.',
              )}
            </p>
            <div className="rs-concepts">
              {[
                [
                  'One-based rank',
                  'Rank 1 is the smallest value; rank n is the largest. The target card retains the global rank, while the history table shows the adjusted rank inside each active subarray.',
                ],
                [
                  'Lomuto partition',
                  'Move the chosen pivot to the active range end. Scan values ≤ pivot into the left block, then move the pivot into its final position. Values to its right are strictly greater.',
                ],
                [
                  'Constant-space loop',
                  'Update the two bounds and local rank instead of growing a recursion stack. The core selection loop uses O(1) auxiliary space; this visualizer retains extra arrays and snapshots for learning.',
                ],
              ].map(([title, text]) => (
                <article key={title}>
                  <h3>{tr(title)}</h3>
                  <p>{tr(text)}</p>
                </article>
              ))}
            </div>
          </Panel>
          <Panel title={tr('Worked Example: The Fourth-Smallest Is 4')} icon={<Lightbulb />}>
            <p>
              {tr(
                'For [8,3,12,5,2,9,1,7,4,6] with seed 42, the first pivot is 7. It finishes at index 6, so its rank is 7. The target rank 4 lies on the left. The algorithm continues only inside [0,5], adjusting the local rank whenever it takes a right branch, and eventually returns 4.',
              )}
            </p>
            <button
              onClick={() => {
                load(randomSelectExample, 4, 42)
                setTab('Visualization')
              }}
            >
              {tr('Explore worked example')}
            </button>
          </Panel>
          <Panel title={tr('Expected Time, Duplicates, and Exact Stopping')} icon={<CheckCircle2 />}>
            <p>
              {tr(
                'For distinct keys and uniform random pivots, a constant fraction of choices discard a constant fraction of candidates, giving expected O(n) time. The worst case is O(n²). This two-way Lomuto version may also become badly unbalanced on many equal values; a three-way version avoids repeatedly searching an equal block.',
              )}
            </p>
            <p>
              {tr(
                'When the local target rank equals the pivot rank, the answer is found immediately. A right branch uses k − r, not the original k. Equal values still occupy separate sorted positions; ranks refer to values with multiplicity.',
              )}
            </p>
            <p>
              {tr(
                'The reproducible generator updates a uint32 state as (1103515245·state + 12345) mod 2³², then divides by 2³². Inputs accept 1–20 finite numbers between −1000000 and 1000000. The sorted order shown in the result card is a verification reference; the selection algorithm does not need to produce it.',
              )}
            </p>
          </Panel>
        </div>
      ) : tab === 'Code' ? (
        <Panel title={tr('Iterative Randomized Quickselect')} icon={<Code2 />} className="rs-code">
          <pre>
            <code>{`select(A, k):                     // k is 1-indexed
  lo = 0; hi = length(A) - 1
  target = k - 1                 // fixed global index
  while lo <= hi:
    if lo == hi: return A[lo]
    chosen = lo + floor(nextRandom() * (hi - lo + 1))
    swap(A[chosen], A[hi])
    pivot = A[hi]; p = lo
    for j from lo to hi - 1:
      if A[j] <= pivot:
        swap(A[j], A[p]); p++
    swap(A[p], A[hi])
    if target == p: return A[p]
    if target < p: hi = p - 1
    else: lo = p + 1`}</code>
          </pre>
          <p>
            {tr(
              'The fixed global target index and the current lo bound encode the adjusted local rank as target − lo + 1. The implementation counts each ≤ pivot value comparison and each nontrivial swap.',
            )}
          </p>
        </Panel>
      ) : tab === 'Practice' ? (
        <Panel title={tr('Predict the Correct Search Direction')} icon={<Lightbulb />} className="rs-practice">
          <p>{tr('A partition has pivot rank r = 7 and target rank k = 4. Which action is correct?')}</p>
          <select
            aria-label={tr('Predicted quickselect direction')}
            value={prediction}
            onChange={(e) => {
              setPrediction(e.target.value)
              setFeedback('')
            }}
          >
            <option value="">{tr('Choose a direction')}</option>
            <option value="left">{tr('Search left with k = 4')}</option>
            <option value="right">{tr('Search right with k = 4')}</option>
            <option value="found">{tr('Return the pivot')}</option>
          </select>
          <button
            className="rs-primary"
            onClick={() =>
              setFeedback(
                prediction === 'left'
                  ? 'Correct! Since 4 < 7, keep the left subarray and the same local rank.'
                  : 'Try again. Compare k with r; equality returns the pivot, and only a right branch subtracts r.',
              )
            }
          >
            {tr('Check prediction')}
          </button>
          {feedback && <p role="status">{tr(feedback)}</p>}
          <p>{tr('If k = 9 and r = 7, the right subproblem seeks its second-smallest value. If k = 7, stop at the pivot.')}</p>
        </Panel>
      ) : (
        <div className="rs-experiments">
          <Panel title={tr('Rank and Seed Laboratory')} icon={<Settings />}>
            <div className="rs-lab-actions">
              {[
                ['Smallest', 1],
                ['Largest', run.values.length],
                ['Pivot rank', Math.min(7, run.values.length)],
              ].map(([label, k]) => (
                <button key={String(label)} onClick={() => load(run.values, Number(k), run.seed)}>
                  {tr(String(label))}
                </button>
              ))}
              <button onClick={() => load([5, 5, 5, 2, 2, 9], 4, 42)}>{tr('Duplicate values')}</button>
              <button onClick={() => load([42], 1, 0)}>{tr('Singleton')}</button>
            </div>
            <p>
              {tr('Original input: ')}[{run.values.join(', ')}]
            </p>
            <p>{tr(`Global target rank: ${run.k}. Current local rank: ${frame.localK}. Answer: ${run.result}.`)}</p>
            <p>{tr(`Comparisons: ${frame.comparisons} / ${run.comparisons}. Swaps: ${frame.swaps} / ${run.swaps}.`)}</p>
            <label>
              {tr('Playback speed')}
              <select aria-label={tr('Quickselect playback speed')} value={speed} onChange={(e) => setSpeed(Number(e.target.value))}>
                <option value={1000}>{tr('1 second')}</option>
                <option value={100}>{tr('Fast')}</option>
                <option value={2000}>{tr('2 seconds')}</option>
              </select>
            </label>
            <label>
              <input type="checkbox" checked={preview} onChange={(e) => setPreview(e.target.checked)} />
              {tr('Preview computed search path')}
            </label>
            <p className="rs-run-summary" role="status">
              {tr(`Event ${cursor + 1} / ${run.frames.length}. Subarray [${frame.lo}, ${frame.hi}]. Local k = ${frame.localK}. ${description}`)}
            </p>
            <div className="rs-lab-actions">
              <button
                onClick={() => {
                  setCursor(0)
                  setPreview(false)
                  setPlaying(false)
                  setAuto(false)
                }}
              >
                {tr('Jump to first pivot')}
              </button>
              <button
                disabled={cursor === 0}
                onClick={() => {
                  setCursor(cursor - 1)
                  setPlaying(false)
                  setAuto(false)
                }}
              >
                {tr('Previous selection event')}
              </button>
              <button
                onClick={() => {
                  setCursor(run.frames.length - 1)
                  setPlaying(false)
                  setAuto(false)
                }}
              >
                {tr('Jump to selected value')}
              </button>
              <button onClick={() => setTab('Visualization')}>{tr('Return to selection diagram')}</button>
            </div>
          </Panel>
          <Panel title={tr('Your Randomized-Selection Notes')} icon={<BookOpen />}>
            <LanguageSelector />
            <label>
              {tr('Notes')}
              <textarea aria-label={tr('Randomized selection notes')} value={notes} onChange={(e) => setNotes(e.target.value)} />
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
        className="rs-dialog"
        aria-label={tr(
          modal === 'item'
            ? 'Inspect selection value'
            : modal === 'rank'
              ? 'Quickselect rank help'
              : modal === 'seed'
                ? 'Quickselect seed help'
                : 'Quickselect result and rank',
        )}
        onCancel={() => setModal(null)}
      >
        <button className="rs-close" aria-label={tr('Close quickselect dialog')} onClick={() => setModal(null)}>
          <X />
        </button>
        {modal === 'item' && item ? (
          <>
            <h2>{tr(`Value ${item.value}, original ID ${item.id}`)}</h2>
            <p>{tr(`Current index: ${frame.array.findIndex((p) => p.id === item.id)}. Active subarray: [${frame.lo}, ${frame.hi}].`)}</p>
            <p>{tr(`Compared with pivot ${frame.pivot.value}: ${item.value <= frame.pivot.value ? '≤ pivot' : '> pivot'}.`)}</p>
            <p>{tr('Original IDs distinguish duplicate values. Partitioning swaps positions and does not preserve input order.')}</p>
          </>
        ) : modal === 'rank' ? (
          <>
            <h2>{tr('One-Based Rank and Local Rank')}</h2>
            <p>
              {tr(
                'Rank 1 means smallest, and rank n means largest. Duplicates occupy separate sorted positions. A right branch discards r positions, so the next local target rank is k − r. A left branch keeps k. Equality k = r returns the pivot.',
              )}
            </p>
            <p>{tr(`Current global rank: ${run.k}. Current local rank: ${frame.localK}.`)}</p>
          </>
        ) : modal === 'seed' ? (
          <>
            <h2>{tr('Reproducible Random Pivots')}</h2>
            <p>
              {tr(
                'The same array, target rank, and uint32 seed reproduce the same pivot choices and partition trace. Random picks a fresh seed. Changing k may change the later active ranges and pivot choices.',
              )}
            </p>
            <p>
              {tr(
                'Generator: state = (1103515245·state + 12345) mod 2³². Math.imul preserves the low 32 bits exactly. This is for learning, not cryptography.',
              )}
            </p>
          </>
        ) : (
          <>
            <h2>{tr('Selected Value')}</h2>
            <p>{tr(`The ${run.k}-th smallest value is ${run.result}.`)}</p>
            <p>
              {tr('Reference sorted order: ')}[{sortedReference.join(', ')}]
            </p>
            <p>
              {tr(
                `Partitions: ${run.frames.filter((f) => f.kind === 'partition').length}. Value comparisons: ${run.comparisons}. Nontrivial swaps: ${run.swaps}.`,
              )}
            </p>
            <p>
              {tr(
                'The algorithm stops as soon as the target index equals the final pivot index, or a single candidate remains. Other portions of the array need not be sorted.',
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
              {tr('Replay quickselect')}
            </button>
          </>
        )}
      </dialog>
    </div>
  )
}
