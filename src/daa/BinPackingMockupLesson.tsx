// @localized-render
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  Search,
  Bookmark,
  Check,
  Settings,
  ArrowDownUp,
  Database,
  Trophy,
  Boxes,
  Play,
  Pause,
  RotateCw,
  PlusCircle,
  MoreHorizontal,
  Lightbulb,
  ChartNoAxesColumnIncreasing,
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
import { packingExample, runPackingLesson, parsePacking, type PackingInput } from './binPackingLessonModel'
import './bin-packing-mockup.css'
const tr = (s: string) => tx(s, 'studios'),
  tabs: MockupTab[] = ['Learn', 'Visualization', 'Code', 'Practice', 'Experiments', 'Notes'],
  example = runPackingLesson(packingExample),
  colors = ['#ff6269', '#ff9b28', '#ffd43f', '#28c58a', '#2791ff', '#368fff', '#9c5bff', '#f356bc', '#ff6682', '#ff9e2f', '#ffd23e', '#24c789'],
  tint = (rank: number) => ({ '--bp-color': colors[(rank - 1) % colors.length] }) as CSSProperties
function Panel({ title, icon, children, className = '' }: { title: string; icon: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`bp-panel ${className}`}>
      <header>
        <span className="bp-icon">{icon}</span>
        <h2>{title}</h2>
      </header>
      {children}
    </section>
  )
}
export function BinPackingMockupLesson(props: MockupPageProps) {
  useLocaleRender()
  const navigate = useNavigate(),
    [tab, setTab] = useState<MockupTab>('Visualization'),
    [run, setRun] = useState(example),
    [capacity, setCapacity] = useState('10'),
    [itemsDraft, setItemsDraft] = useState(packingExample.values.join(', ')),
    [cursor, setCursor] = useState(example.defaultCursor),
    [playing, setPlaying] = useState(false),
    [speed, setSpeed] = useState(90),
    [timelinePage, setTimelinePage] = useState(0),
    [error, setError] = useState(''),
    [query, setQuery] = useState(''),
    [prediction, setPrediction] = useState(''),
    [feedback, setFeedback] = useState(''),
    [localTheme, setLocalTheme] = useState(() => localStorage.getItem('algodrishti-theme') ?? 'light'),
    [modal, setModal] = useState<{ type: 'item' | 'bin' | 'quality' | 'placement'; index: number } | null>(null),
    [notes, setNotes] = usePersistentState('algodrishti-bin-packing-notes', '', persistentString),
    [reviewed, setReviewed] = usePersistentState('algodrishti-bin-packing-sections', '', persistentString),
    dialog = useRef<HTMLDialogElement>(null),
    search = useRef<HTMLInputElement>(null),
    binsRef = useRef<HTMLDivElement>(null)
  const frame = run.frames[cursor],
    complete = cursor === run.defaultCursor,
    theme = props.theme ?? localTheme,
    visited = [...new Set(reviewed.split('|').filter((s) => tabs.includes(s as MockupTab)))],
    queryText = query.trim().toLowerCase(),
    score = (name: string) => (name.toLowerCase() === queryText ? 0 : name.toLowerCase().includes(queryText) ? 1 : 2),
    topics = queryText
      ? allModules
          .filter((m) => `${m.name} ${m.summary}`.toLowerCase().includes(queryText))
          .sort((a, b) => score(a.name) - score(b.name))
          .slice(0, 5)
      : [],
    currentBins = frame.bins,
    available = Math.max(4, currentBins.length),
    timelineFrames = run.frames.slice(1 + timelinePage * 6, 7 + timelinePage * 6),
    pageCount = Math.max(1, Math.ceil(run.items.length / 6)),
    selectedItem = modal?.type === 'item' ? run.items[modal.index] : null,
    selectedBin = modal?.type === 'bin' ? currentBins[modal.index] : null,
    placement = modal?.type === 'placement' ? run.frames[modal.index] : null,
    destinations = run.frames.slice(1),
    pending = capacity !== String(run.input.capacity) || itemsDraft !== run.input.values.join(', ')
  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])
  useEffect(() => {
    const desktop = window.matchMedia('(min-width: 1500px)')
    function revealNavigation() {
      if (desktop.matches) {
        const navigation = document.querySelector<HTMLElement>('.app-shell .global-sidebar .sidebar-navigation')
        if (navigation) navigation.scrollTop = 0
      }
    }
    revealNavigation()
    desktop.addEventListener('change', revealNavigation)
    return () => desktop.removeEventListener('change', revealNavigation)
  }, [])
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
    if (!playing) return
    const timer = window.setInterval(
      () =>
        setCursor((c) => {
          const next = Math.min(c + 1, run.defaultCursor)
          setTimelinePage(Math.max(0, Math.floor((next - 1) / 6)))
          if (next === run.defaultCursor) setPlaying(false)
          return next
        }),
      1700 - speed * 15,
    )
    return () => window.clearInterval(timer)
  }, [playing, speed, run])
  useEffect(() => {
    if (frame.destination !== null && binsRef.current) {
      const container = binsRef.current,
        target = container.children[frame.destination] as HTMLElement | undefined
      if (target) {
        const right = target.offsetLeft + target.offsetWidth
        if (right > container.scrollLeft + container.clientWidth) container.scrollLeft = right - container.clientWidth
        else if (target.offsetLeft < container.scrollLeft) container.scrollLeft = target.offsetLeft
      }
    }
  }, [cursor, playing, frame.destination])
  function changeTab(next: MockupTab) {
    setPlaying(false)
    setTab(next)
    setReviewed([...new Set([...visited, next])].join('|'))
  }
  function load(input: PackingInput, animate = false) {
    const next = runPackingLesson(input)
    setRun(next)
    setCapacity(String(input.capacity))
    setItemsDraft(input.values.join(', '))
    setCursor(animate ? 0 : next.defaultCursor)
    setTimelinePage(0)
    setPlaying(animate && next.items.length > 0)
    setError('')
    setModal(null)
    if (binsRef.current) binsRef.current.scrollLeft = 0
  }
  function pack() {
    try {
      load(parsePacking(capacity, itemsDraft))
    } catch (e) {
      setError((e as Error).message)
      setPlaying(false)
    }
  }
  function animate() {
    if (playing) {
      setPlaying(false)
      return
    }
    try {
      const input = parsePacking(capacity, itemsDraft)
      if (pending) load(input, true)
      else {
        if (complete) {
          setCursor(0)
          setTimelinePage(0)
          if (binsRef.current) binsRef.current.scrollLeft = 0
        }
        setPlaying(run.items.length > 0)
      }
      setError('')
    } catch (e) {
      setError((e as Error).message)
    }
  }
  function seek(next: number) {
    setCursor(next)
    setTimelinePage(Math.max(0, Math.floor((next - 1) / 6)))
    setPlaying(false)
  }
  function reset() {
    setCapacity(String(run.input.capacity))
    setItemsDraft(run.input.values.join(', '))
    seek(0)
    setError('')
    if (binsRef.current) binsRef.current.scrollLeft = 0
  }
  function inspect(type: NonNullable<typeof modal>['type'], index = 0) {
    setPlaying(false)
    setModal({ type, index })
  }
  const code = `function firstFitDecreasing(items, capacity) {
  const sorted = [...items].sort((a, b) => b - a);
  const bins = [];
  for (const size of sorted) {
    let j = bins.findIndex(bin => bin.remaining >= size);
    if (j < 0) {
      j = bins.length;
      bins.push({ items: [], remaining: capacity });
    }
    bins[j].items.push(size);
    bins[j].remaining -= size;
  }
  return bins;
}`
  return (
    <div className="mom-page target-visual bin-packing-page" data-target="44">
      <div className="bp-toolbar">
        <button className="bp-back" aria-label={tr('Return to FFT lesson')} onClick={() => navigate('/daa-extensions/fft')}>
          <ArrowLeft size={19} />
        </button>
        <div className="bp-search">
          <Search size={19} />
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
            <div className="bp-search-results">
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
          {tr(props.completed.includes(props.module.id) ? 'Studied' : 'Mark studied')}
        </button>
        <AccountControl showLanguage={false} />
      </div>
      <header className="bp-hero">
        <button className="bp-back" aria-label={tr('Back to DAA extensions')} onClick={() => navigate('/daa-extensions')}>
          <ArrowLeft size={23} />
        </button>
        <div className="bp-heading">
          <div>
            <h1>{tr('Bin Packing: First Fit Decreasing')}</h1>
            <span>{tr('DAA Extension')}</span>
          </div>
          <p>{tr('Pack descending-size items into the first feasible bin.')}</p>
        </div>
        <div className="bp-progress">
          <span>{tr(`${visited.length} of 6 sections`)}</span>
          <div>
            <i style={{ width: `${(visited.length / 6) * 100}%` }} />
            {tabs.slice(2).map((s, i) => (
              <button
                key={s}
                className={visited.includes(s) ? 'bp-seen' : ''}
                style={{ left: `${46.5 + i * 16.7}%` }}
                aria-label={tr(`Open ${s} section`)}
                onClick={() => changeTab(s)}
              />
            ))}
          </div>
        </div>
        <button className="bp-primary bp-start" onClick={() => changeTab(visited.length ? tabs[(tabs.indexOf(tab) + 1) % 6] : 'Learn')}>
          {tr(visited.length ? 'Continue Learning' : 'Start Learning')}
          <ArrowRight size={20} />
        </button>
      </header>
      <MockupTabs active={tab} onChange={changeTab} tabs={tabs} />
      {tab === 'Visualization' && (
        <>
          <div className="bp-top-grid">
            <Panel title={tr('Input & Controls')} icon={<Settings />} className="bp-input">
              <div className="bp-input-body">
                <label className="bp-capacity-label">
                  {tr('Bin capacity')}
                  <input
                    aria-label={tr('Bin capacity')}
                    type="number"
                    min="1"
                    max="100"
                    value={capacity}
                    onChange={(e) => {
                      setCapacity(e.target.value)
                      setPlaying(false)
                      setError('')
                    }}
                  />
                </label>
                <label className="bp-items-label">
                  {tr('Items (comma separated)')}
                  <input
                    aria-label={tr('Packing item sizes')}
                    value={itemsDraft}
                    onChange={(e) => {
                      setItemsDraft(e.target.value)
                      setPlaying(false)
                      setError('')
                    }}
                  />
                </label>
                <small>{tr('Example: 9, 8, 7, 6, 5, 4, 4, 3, 3, 2, 2, 1')}</small>
                <button className="bp-primary bp-auto" onClick={pack}>
                  <Play size={22} fill="currentColor" />
                  {tr('Auto Pack')}
                </button>
                <div className="bp-run-controls">
                  <button onClick={animate}>
                    {playing ? <Pause size={18} /> : <Play size={18} fill="currentColor" />}
                    {tr(playing ? 'Pause' : cursor > 0 && !complete ? 'Resume' : 'Animate Step')}
                  </button>
                  <button onClick={reset}>
                    <RotateCw size={20} />
                    {tr('Reset')}
                  </button>
                </div>
                <label className="bp-speed-label">
                  {tr('Animation speed')}
                  <span>
                    {tr('Slow')}
                    <input aria-label={tr('Animation speed')} type="range" min="0" max="100" value={speed} onChange={(e) => setSpeed(Number(e.target.value))} />
                    {tr('Fast')}
                  </span>
                </label>
                {error && (
                  <p role="alert" className="bp-error">
                    {tr(error)}
                  </p>
                )}
              </div>
            </Panel>
            <Panel title={tr('Items (sorted decreasing)')} icon={<ArrowDownUp />} className="bp-items">
              <div className="bp-item-list">
                {run.items.map((item, i) => (
                  <button
                    key={item.id}
                    className={`bp-item-row ${frame.item?.id === item.id && !complete ? 'bp-current-item' : ''}`}
                    style={tint(item.rank)}
                    aria-label={`${tr('Inspect sorted item')} ${item.rank}`}
                    onClick={() => inspect('item', i)}
                  >
                    <span className="bp-rank">{item.rank}</span>
                    <span className="bp-item-chip" style={{ width: item.size >= 100 ? 70 : item.size >= 10 ? 61 : 51 }}>
                      <i />
                      {item.size}
                    </span>
                    <span className="bp-item-bar">
                      <i style={{ width: `${(item.size / run.input.capacity) * 100}%` }} />
                    </span>
                  </button>
                ))}
                {!run.items.length && <p>{tr('No items to pack.')}</p>}
              </div>
            </Panel>
            <Panel title={tr('Bins (First Fit Decreasing in action)')} icon={<Database />} className="bp-bins">
              <p className="bp-bin-caption">{tr('Items are placed into the first bin that can accommodate them.')}</p>
              <div className="bp-legend">
                <span>
                  <i />
                  {tr('Remaining capacity')}
                </span>
                <span>
                  <i />
                  {tr('Used capacity')}
                </span>
              </div>
              <div ref={binsRef} className="bp-bins-scroll">
                {Array.from({ length: available }, (_, i) => {
                  const bin = currentBins[i]
                  return (
                    <button
                      className={`bp-bin ${bin ? 'bp-bin-used' : 'bp-bin-empty'} ${!complete && frame.destination === i ? 'bp-active-bin' : ''}`}
                      key={i}
                      aria-label={`${tr('Inspect bin')} ${i + 1}`}
                      onClick={() => inspect('bin', i)}
                    >
                      <div className="bp-bin-title">
                        <b>
                          {tr('Bin')} {i + 1}
                        </b>
                        <span>
                          {'('}
                          {bin?.used ?? 0}
                          {' / '}
                          {run.input.capacity}
                          {')'}
                        </span>
                      </div>
                      {bin ? (
                        <div className="bp-bin-stack">
                          {bin.items.map((item, j) => (
                            <span
                              key={item.id}
                              className="bp-packed-item"
                              title={`${tr('Item')} ${item.id}: ${item.size}`}
                              style={{
                                ...tint(item.rank),
                                height: `calc(${(item.size / run.input.capacity) * 100}% - 2px)`,
                                bottom: `${(bin.items.slice(0, j).reduce((a, b) => a + b.size, 0) / run.input.capacity) * 100}%`,
                              }}
                            >
                              <span>{item.size}</span>
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="bp-empty-hint">
                          <PlusCircle size={20} />
                          <span>
                            {tr('Add more')}
                            <br />
                            {tr('bins if needed')}
                          </span>
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            </Panel>
            <Panel title={tr('Result Summary')} icon={<Trophy />} className="bp-summary">
              <button className="bp-stat bp-stat-bins" onClick={() => inspect('quality')}>
                <span className="bp-stat-icon">
                  <Database />
                </span>
                <span>
                  <b>{tr('Bins used')}</b>
                  <strong>{currentBins.length}</strong>
                  <small>{tr(`out of ${available} available`)}</small>
                </span>
              </button>
              <button className="bp-stat bp-stat-items" onClick={() => inspect('quality')}>
                <span className="bp-stat-icon">
                  <Boxes />
                </span>
                <span>
                  <b>{tr('Total items')}</b>
                  <strong>{run.items.length}</strong>
                  <small>
                    {tr(complete ? (run.items.length ? 'All items packed!' : 'Empty input: no bins needed.') : `${cursor} of ${run.items.length} packed`)}
                  </small>
                </span>
              </button>
              <h3>{tr('Bin utilization')}</h3>
              <div className="bp-utilization">
                {currentBins.map((bin, i) => (
                  <button key={i} onClick={() => inspect('bin', i)}>
                    <b>
                      {tr('Bin')} {i + 1}
                    </b>
                    <strong>
                      {bin.used} / {run.input.capacity}
                    </strong>
                    <span>
                      <i style={{ width: `${(bin.used / run.input.capacity) * 100}%` }} />
                    </span>
                    <small>{Math.round((bin.used / run.input.capacity) * 100)}%</small>
                  </button>
                ))}
                {!currentBins.length && <p>{tr('No bins used yet.')}</p>}
              </div>
            </Panel>
          </div>
          <Panel title={tr('Step-by-Step Placement Timeline')} icon={<Play fill="currentColor" />} className="bp-timeline">
            <p>{tr('Watch how each item is placed using the First Fit strategy.')}</p>
            {timelinePage > 0 && (
              <button
                className="bp-timeline-back"
                onClick={() => {
                  setTimelinePage(timelinePage - 1)
                  setPlaying(false)
                }}
              >
                <ArrowLeft size={17} />
                {tr('Earlier items')}
              </button>
            )}
            <div className="bp-timeline-row">
              {timelineFrames.map((f) => (
                <div className="bp-timeline-piece" key={f.count}>
                  <button
                    className={`bp-placement-card ${cursor === f.count ? 'bp-selected-placement' : ''} ${f.probes.length >= 2 ? 'bp-many-probes' : ''}`}
                    aria-label={`${tr('Show placement')} ${f.count}`}
                    aria-pressed={cursor === f.count}
                    style={tint(f.item!.rank)}
                    onClick={() => seek(f.count)}
                  >
                    <span className="bp-placement-number">{f.count}</span>
                    <h3>
                      {tr('Place item')} <em>{f.item!.size}</em>
                    </h3>
                    <div className="bp-placement-detail">
                      {tr('First bin that fits:')}
                      <b>
                        {f.opened ? tr('Open Bin') : tr('Bin')} {f.destination! + 1}
                      </b>
                      {f.probes.length > 0 && (
                        <small>
                          {tr('Checked bins:')} {f.probes.map((p) => `${p.bin + 1}${p.fits ? ' ✓' : ' ×'}`).join(', ')}
                        </small>
                      )}
                    </div>
                    <span className="bp-placement-result">
                      {tr('Bin')} {f.destination! + 1}
                      {': ['}
                      {f.bins[f.destination!].items.map((item) => item.size).join(', ')}
                      {']'}
                    </span>
                    <span className="bp-placement-remaining">
                      {tr('Remaining:')} {f.bins[f.destination!].remaining}
                    </span>
                  </button>
                  <ArrowRight className="bp-placement-arrow" size={18} />
                </div>
              ))}
              {!timelineFrames.length && (
                <div className="bp-empty-timeline">{tr('Add items and choose Auto Pack or Animate Step to build a placement timeline.')}</div>
              )}
              <button
                className="bp-more-card"
                disabled={pageCount === 1 && timelinePage === 0}
                onClick={() => {
                  const next = (timelinePage + 1) % pageCount
                  seek(Math.min(run.defaultCursor, next * 6 + 1))
                }}
              >
                <span>
                  <MoreHorizontal />
                </span>
                {tr(pageCount === 1 ? 'All items shown' : timelinePage + 1 < pageCount ? 'Continue for remaining items' : 'Return to first items')}
                {timelinePage + 1 < pageCount && (
                  <small>
                    {'('}
                    {run.items
                      .slice((timelinePage + 1) * 6)
                      .map((i) => i.size)
                      .join(', ')}
                    {')'}
                  </small>
                )}
              </button>
            </div>
          </Panel>
          <div className="bp-bottom-grid">
            <Panel title={tr('Correctness')} icon={<Check />} className="bp-correctness">
              <p>
                {tr(
                  'Every placed item fits by the capacity check, so the result is feasible. The method is a heuristic; feasibility does not prove minimal bin count.',
                )}
              </p>
            </Panel>
            <Panel title={tr('Heuristic Insight')} icon={<Lightbulb />} className="bp-insight">
              <p>
                {tr(
                  'First Fit Decreasing sorts items in non-increasing order and places each item into the first bin that can accommodate it. This tends to produce good packings and is widely used in practice.',
                )}
              </p>
            </Panel>
            <Panel title={tr('Complexity')} icon={<ChartNoAxesColumnIncreasing />} className="bp-complexity">
              <b>
                {tr('Time: O(n² + n log n)')} {' · '}
                {tr('Auxiliary space: O(n)')}
              </b>
              <p>{tr('Sort once, then scan prior bins and their contents; the total stored items per insertion is O(n).')}</p>
            </Panel>
          </div>
        </>
      )}
      {tab === 'Learn' && (
        <div className="bp-learning">
          <Panel title={tr('Pack by decreasing size, then first fit')} icon={<Boxes />}>
            <p>
              {tr(
                'Bin packing assigns every item to a bin of fixed capacity while trying to use as few bins as possible. First Fit Decreasing (FFD) sorts the items from largest to smallest. For each item, scan existing bins in creation order and use the first bin with enough remaining space. Open a new bin only if every current bin rejects it.',
              )}
            </p>
            <p>
              {tr(
                'The capacity check preserves feasibility. Sorting places large, hard-to-fit items early, but this greedy rule can still miss the minimum number of bins. Duplicate sizes remain distinct items, and equal sizes retain their original order.',
              )}
            </p>
          </Panel>
          <Panel title={tr('Worked example: 54 units in capacity-10 bins')} icon={<Database />}>
            <p>
              {tr(
                'The twelve default items sum to 54. Every feasible packing therefore needs at least ceil(54/10) = 6 bins. FFD obtains [9,1], [8,2], [7,3], [6,4], [5,4], [3,2]. The loads are 10,10,10,10,9,5, so this particular result is optimal and uses 90% of its total capacity.',
              )}
            </p>
            <p>
              {tr(
                'The first six placements open bins for 9, 8, 7, 6 and 5, then place the first 4 into bin 4 because its remaining capacity is 4. Later, the item 1 fills the one-unit gap in bin 1.',
              )}
            </p>
            <button
              className="bp-primary"
              onClick={() => {
                load(packingExample)
                changeTab('Visualization')
              }}
            >
              {tr('Explore the worked example')}
            </button>
          </Panel>
          <Panel title={tr('A counterexample to optimality')} icon={<Lightbulb />}>
            <p>
              {tr(
                'With capacity 10 and items [6,5,3,2,2,2], FFD makes [6,3], [5,2,2], [2]: three bins. Yet [6,2,2] and [5,3,2] fit in two bins. Feasibility alone does not establish optimality.',
              )}
            </p>
            <p>
              {tr(
                'The volume lower bound ceil(total size / capacity) helps assess quality. When FFD meets that lower bound it is optimal. For up to twelve items this lesson also runs an exact search to show a verified optimal packing; larger examples show the lower bound without claiming an exact optimum.',
              )}
            </p>
            <button
              onClick={() => {
                load({ capacity: 10, values: [6, 5, 3, 2, 2, 2] })
                changeTab('Visualization')
              }}
            >
              {tr('Try the counterexample')}
            </button>
          </Panel>
        </div>
      )}
      {tab === 'Code' && (
        <Panel title={tr('First Fit Decreasing pseudocode')} icon={<FileText />} className="bp-code">
          <p>
            {tr(
              'This implementation maintains each bin’s remaining capacity. A linear scan selects the earliest feasible bin. Sorting costs O(n log n), placement costs O(n²) in the worst case, and the bins store O(n) items. The teaching timeline stores additional snapshots and uses O(n²) storage.',
            )}
          </p>
          <pre>
            <code>{code}</code>
          </pre>
          <p>
            {tr('Current sorted input:')} {run.items.map((i) => i.size).join(', ')}
          </p>
          <p>
            {tr('Final bin loads:')} {run.bins.map((b) => b.used).join(', ')}
          </p>
        </Panel>
      )}
      {tab === 'Practice' && (
        <Panel title={tr('Predict the first feasible bin')} icon={<Lightbulb />} className="bp-practice">
          <p>
            {tr('Capacity is 10. Bin 1 contains [9], bin 2 contains [8], bin 3 contains [7], and bin 4 contains [6]. Where does the next item of size 4 go?')}
          </p>
          <div>
            {['Bin 1', 'Bin 2', 'Bin 3', 'Bin 4', 'New bin'].map((answer) => (
              <button
                key={answer}
                aria-pressed={prediction === answer}
                onClick={() => {
                  setPrediction(answer)
                  setFeedback('')
                }}
              >
                {tr(answer)}
              </button>
            ))}
          </div>
          <button
            className="bp-primary"
            onClick={() =>
              setFeedback(
                !prediction
                  ? tr('Choose a prediction first.')
                  : prediction === 'Bin 4'
                    ? tr('Correct. The remaining spaces are 1,2,3,4. The first three bins reject 4; bin 4 accepts it and becomes full.')
                    : tr('Try again. Scan the remaining spaces 1,2,3,4 in creation order. Stop at the first capacity that is at least 4.'),
              )
            }
          >
            {tr('Check prediction')}
          </button>
          <p role="status">{feedback}</p>
          <button
            onClick={() => {
              load(packingExample)
              seek(6)
              changeTab('Visualization')
            }}
          >
            {tr('Visualize this placement')}
          </button>
        </Panel>
      )}
      {tab === 'Experiments' && (
        <div className="bp-experiments">
          <Panel title={tr('Packing laboratory')} icon={<Settings />}>
            <p>
              {tr(
                'Compare a tight packing, a greedy counterexample, empty input and the maximum supported item count. Inspect the capacity certificate and every rejected bin.',
              )}
            </p>
            <div className="bp-presets">
              {[
                [tr('Default example'), packingExample],
                [tr('Greedy counterexample'), { capacity: 10, values: [6, 5, 3, 2, 2, 2] }],
                [tr('Exact fits'), { capacity: 10, values: [10, 10, 10, 10] }],
                [tr('Duplicate items'), { capacity: 10, values: [4, 4, 4, 4, 4, 4] }],
                [tr('Empty input'), { capacity: 10, values: [] }],
                [tr('Maximum: 24 full bins'), { capacity: 100, values: Array(24).fill(100) }],
              ].map(([label, input]) => (
                <button
                  key={String(label)}
                  onClick={() => {
                    load(input as PackingInput)
                    changeTab('Visualization')
                  }}
                >
                  {String(label)}
                </button>
              ))}
            </div>
            <label>
              {tr('Placement count')}
              <input
                aria-label={tr('Placement count')}
                type="range"
                min="0"
                max={run.defaultCursor}
                value={cursor}
                onChange={(e) => seek(Number(e.target.value))}
              />
            </label>
            <p>
              {tr('Packed volume:')} {frame.packedSize}
              {' / '}
              {run.total}
              {' · '}
              {tr('Lower bound on bins:')} {run.lowerBound}
            </p>
            <button onClick={() => inspect('quality')}>{tr('Inspect packing quality')}</button>
            <div className="bp-placement-table">
              <table>
                <thead>
                  <tr>
                    <th>{tr('Step')}</th>
                    <th>{tr('Item')}</th>
                    <th>{tr('Destination')}</th>
                    <th>{tr('Remaining')}</th>
                  </tr>
                </thead>
                <tbody>
                  {run.frames.slice(1).map((f) => (
                    <tr key={f.count}>
                      <th>
                        <button
                          onClick={() => {
                            seek(f.count)
                            inspect('placement', f.count)
                          }}
                        >
                          {f.count}
                        </button>
                      </th>
                      <td>{f.item!.size}</td>
                      <td>
                        {tr('Bin')} {f.destination! + 1}
                      </td>
                      <td>{f.bins[f.destination!].remaining}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
          <Panel title={tr('Display preferences')} icon={<Settings />}>
            <LanguageSelector />
            <button onClick={() => (props.onToggleTheme ? props.onToggleTheme() : setLocalTheme(theme === 'dark' ? 'light' : 'dark'))}>
              {tr('Toggle color theme')}
            </button>
          </Panel>
        </div>
      )}
      {tab === 'Notes' && (
        <Panel title={tr('Your bin-packing notes')} icon={<FileText />} className="bp-notes">
          <p>
            {tr('Record a prediction, explain a rejected bin, or compare the greedy result with an optimal packing. Your notes are saved in this browser.')}
          </p>
          <textarea aria-label={tr('Your bin-packing notes')} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </Panel>
      )}
      <dialog
        ref={dialog}
        className="bp-dialog"
        onCancel={() => setModal(null)}
        onClick={(e) => {
          if (e.target === dialog.current) setModal(null)
        }}
      >
        <button className="bp-close" aria-label={tr('Close packing inspector')} onClick={() => setModal(null)}>
          <X />
        </button>
        {selectedItem && (
          <>
            <h2>
              {tr('Sorted item')} {selectedItem.rank}
            </h2>
            <p>
              {tr('Size:')} {selectedItem.size}
              {' · '}
              {tr('Original item identity:')} {selectedItem.id}
            </p>
            <p>
              {tr('Final destination:')} {tr('Bin')} {destinations[modal!.index].destination! + 1}
            </p>
            <p>
              {selectedItem.rank <= cursor
                ? tr('This item has been placed in the current snapshot.')
                : tr('This destination previews a later placement; the item is not packed in the current snapshot.')}
            </p>
            <button
              onClick={() => {
                seek(selectedItem.rank)
                setModal(null)
              }}
            >
              {tr('Show this placement')}
            </button>
          </>
        )}
        {modal?.type === 'bin' && (
          <>
            <h2>
              {tr('Bin')} {modal.index + 1} {tr('capacity audit')}
            </h2>
            {selectedBin ? (
              <>
                <p>
                  {tr('Items:')} {'['}
                  {selectedBin.items.map((i) => i.size).join(', ')}
                  {']'}
                </p>
                <p>
                  {tr('Used:')} {selectedBin.used}
                  {' / '}
                  {run.input.capacity}
                  {' · '}
                  {tr('Remaining:')} {selectedBin.remaining}
                </p>
                <p>
                  {tr('Capacity check:')} {selectedBin.used}
                  {' ≤ '}
                  {run.input.capacity}
                  {' ✓'}
                </p>
                <p>
                  {tr('Distinct original item identities:')} {selectedBin.items.map((i) => i.id).join(', ')}
                </p>
              </>
            ) : (
              <p>{tr('This is an available placeholder. It is not counted as a used bin until an item is placed in it.')}</p>
            )}
          </>
        )}
        {modal?.type === 'quality' && (
          <>
            <h2>{tr('Packing quality certificate')}</h2>
            <p>
              {tr('Current snapshot:')} {cursor}
              {' / '}
              {run.items.length}
              {' · '}
              {tr('Packed volume:')} {frame.packedSize}
              {' · '}
              {tr('Bins used:')} {currentBins.length}
            </p>
            <p>
              {tr('Complete input volume:')} {run.total}
              {' · '}
              {tr('Capacity:')} {run.input.capacity}
              {' · '}
              {tr('Volume lower bound:')} {run.lowerBound}
            </p>
            <p>
              {tr('Final FFD bin count:')} {run.bins.length}
              {' · '}
              {tr('Final utilization:')} {Math.round(run.utilization * 100)}%
            </p>
            {run.optimum ? (
              <>
                <p>
                  {tr('Exact optimum:')} {run.optimum.count}
                  {' · '}
                  {tr('Optimal packing:')} {run.optimum.bins.map((b) => `[${b.map((i) => i.size).join(',')}]`).join(' ')}
                </p>
                <p>
                  {tr(
                    run.optimum.count === run.bins.length
                      ? 'FFD is optimal for this input. This does not prove it is optimal for every input.'
                      : 'FFD is feasible but uses more bins than the verified optimum for this input.',
                  )}
                </p>
              </>
            ) : (
              <p>
                {tr(
                  run.bins.length === run.lowerBound
                    ? 'FFD meets the volume lower bound, so this input is optimally packed.'
                    : 'Exact search is limited to twelve items. The lower bound is not an exact optimum certificate for this input.',
                )}
              </p>
            )}
            <p>{tr('All used bins satisfy their capacity limit, and each item appears exactly once in the completed packing.')}</p>
          </>
        )}
        {placement && (
          <>
            <h2>
              {tr('Placement certificate')} {placement.count}
            </h2>
            <p>
              {tr('Place item')} {placement.item!.size}
              {' → '}
              {tr('Bin')} {placement.destination! + 1}
            </p>
            <ul>
              {placement.probes.map((p) => (
                <li key={p.bin}>
                  {tr('Bin')} {p.bin + 1}
                  {': '}
                  {tr('remaining')} {p.remaining} {p.fits ? '≥' : '<'} {placement.item!.size}
                  {' · '}
                  {tr(p.fits ? 'fits' : 'rejected')}
                </li>
              ))}
            </ul>
            <p>
              {tr(placement.opened ? 'Every existing bin rejects this item; open a new bin.' : 'Stop at the first feasible bin; later bins are not examined.')}
            </p>
            <p>
              {tr('Remaining after placement:')} {placement.bins[placement.destination!].remaining}
            </p>
          </>
        )}
      </dialog>
    </div>
  )
}
