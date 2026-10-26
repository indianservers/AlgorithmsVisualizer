// @localized-render
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  ArrowDown,
  ArrowRightLeft,
  Bookmark,
  Check,
  Play,
  Pause,
  RotateCw,
  FileText,
  ArrowDownUp,
  BarChart3,
  Lightbulb,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react'
import { AccountControl } from '../account/AccountControl'
import { LanguageSelector } from '../i18n/LanguageSelector'
import { tx, useLocaleRender } from '../i18n/render'
import { persistentString, usePersistentState } from '../hooks/usePersistentState'
import { MockupTabs, type MockupPageProps, type MockupTab } from './MockupLessonChrome'
import { compareSuffixes, runSuffixArrayLesson, searchSuffixArray, suffixArrayExample } from './suffixArrayLessonModel'
import './suffix-array-mockup.css'
const tr = (s: string) => tx(s, 'studios'),
  tabs: MockupTab[] = ['Learn', 'Visualization', 'Code', 'Practice', 'Experiments'],
  exampleRun = runSuffixArrayLesson(suffixArrayExample),
  colors = [
    ['#ffd0d8', '#9f1830'],
    ['#c5dfff', '#00469b'],
    ['#b0efcf', '#006347'],
    ['#ffdfad', '#92410e'],
    ['#dac9ff', '#3e1c9f'],
    ['#bcebf7', '#00566c'],
  ],
  tint = (i: number) => ({ '--sa-pill': colors[i % 6][0], '--sa-pill-ink': colors[i % 6][1] }) as CSSProperties,
  charLabel = (c: string | null) => (c === null ? tr('End') : c === ' ' ? tr('Space') : c),
  ordinal = (n: number) => `${n}${n % 100 >= 11 && n % 100 <= 13 ? 'th' : n % 10 === 1 ? 'st' : n % 10 === 2 ? 'nd' : n % 10 === 3 ? 'rd' : 'th'}`
function Panel({ title, icon, children, className = '' }: { title: string; icon: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`sa-panel ${className}`}>
      <header>
        <span className="sa-icon">{icon}</span>
        <div>
          <h2>{title}</h2>
        </div>
      </header>
      {children}
    </section>
  )
}
export function SuffixArrayMockupLesson(props: MockupPageProps) {
  useLocaleRender()
  const navigate = useNavigate(),
    [tab, setTab] = useState<MockupTab>('Visualization'),
    [run, setRun] = useState(exampleRun),
    [draft, setDraft] = useState(suffixArrayExample),
    [cursor, setCursor] = useState(exampleRun.defaultCursor),
    [step, setStep] = useState(0),
    [playing, setPlaying] = useState(false),
    [speed, setSpeed] = useState(700),
    [error, setError] = useState(''),
    [modal, setModal] = useState<'suffix' | 'compare' | 'lcp' | null>(null),
    [inspect, setInspect] = useState(5),
    [left, setLeft] = useState(5),
    [right, setRight] = useState(3),
    [probe, setProbe] = useState(0),
    [queryDraft, setQueryDraft] = useState(''),
    [query, setQuery] = useState(''),
    [queryError, setQueryError] = useState(''),
    [prediction, setPrediction] = useState(''),
    [feedback, setFeedback] = useState(''),
    [localTheme, setLocalTheme] = useState(() => localStorage.getItem('algodrishti-theme') ?? 'light'),
    dialog = useRef<HTMLDialogElement>(null),
    track = useRef<HTMLDivElement>(null)
  const [notes, setNotes] = usePersistentState('algodrishti-suffix-array-notes', '', persistentString),
    frame = run.frames[cursor],
    complete = frame.phase === 'complete',
    n = run.chars.length,
    pending = draft !== run.text,
    theme = props.theme ?? localTheme,
    studied = props.completed.includes(props.module.id),
    selected = run.sa[step],
    alternatives = run.sa.slice(step + 1, step + 3),
    queryResult = searchSuffixArray(run, query),
    comparison = n && left < n && right < n ? compareSuffixes(run.chars, left, right) : null,
    visibleProbe = comparison?.probes[Math.min(probe, comparison.probes.length - 1)],
    inspected = run.suffixes[inspect],
    selectedNext = selected === undefined || !alternatives.length ? null : compareSuffixes(run.chars, selected, alternatives[0]),
    detail =
      step === 0 && run.text === 'banana'
        ? 'The suffix starting at index 5 is "a", which is lexicographically smallest because it starts with \'a\' and has no more characters.'
        : selected === undefined
          ? 'Enter a string to generate its non-empty suffixes.'
          : `The suffix at index ${selected} is ${ordinal(step + 1)} in lexicographic order. ${step ? `It shares ${run.lcp[step]} leading characters with its predecessor.` : 'Compare its first differing character, or choose the shorter suffix when one is a prefix.'}`
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
        setCursor((c) => {
          if (c >= run.frames.length - 1) {
            setPlaying(false)
            return c
          }
          return c + 1
        }),
      speed,
    )
    return () => window.clearInterval(timer)
  }, [playing, run, speed])
  useEffect(() => {
    const selectedButton = track.current?.querySelector<HTMLButtonElement>(`[data-step="${step}"]`)
    if (track.current && selectedButton && track.current.scrollWidth > track.current.clientWidth)
      track.current.scrollLeft = selectedButton.offsetLeft - track.current.offsetLeft - track.current.clientWidth / 2
  }, [step, tab, n])
  function changeTab(next: MockupTab) {
    setPlaying(false)
    setTab(next)
  }
  function load(text: string) {
    const next = runSuffixArrayLesson(text)
    setRun(next)
    setCursor(next.defaultCursor)
    setDraft(text)
    setStep(0)
    setPlaying(false)
    setError('')
    setQuery('')
    setQueryDraft('')
    setQueryError('')
    setModal(null)
    return next
  }
  function animate() {
    if (playing) {
      setPlaying(false)
      return
    }
    try {
      if (pending) {
        load(draft)
        setCursor(0)
        setStep(0)
      } else if (complete) {
        setCursor(0)
        setStep(0)
      }
      setPlaying(true)
    } catch (e) {
      setError((e as Error).message)
    }
  }
  function reset() {
    setCursor(run.defaultCursor)
    setStep(0)
    setPlaying(false)
    setDraft(run.text)
    setError('')
    setQuery('')
    setQueryDraft('')
    setQueryError('')
  }
  function openComparison(a: number, b: number) {
    setLeft(a)
    setRight(b)
    setProbe(0)
    setModal('compare')
  }
  function compareInput() {
    try {
      const current = pending ? load(draft) : run
      if (!current.sa.length) {
        setError('Enter at least one character to compare suffixes.')
        return
      }
      openComparison(current.sa[0], current.sa[1] ?? current.sa[0])
    } catch (e) {
      setError((e as Error).message)
    }
  }
  function inspectSuffix(index: number) {
    setInspect(index)
    setModal('suffix')
  }
  function inspectLcp(rank: number) {
    setInspect(rank)
    setModal('lcp')
  }
  function suffix(start: number, prefix = 0) {
    return (
      <>
        <mark>{run.chars.slice(start, start + prefix).join('')}</mark>
        {run.chars.slice(start + prefix).join('')}
      </>
    )
  }
  function reason(start: number) {
    const c = compareSuffixes(run.chars, selected, start)
    return c.reason === 'prefix'
      ? `Starts with '${run.suffixes[selected].suffix}', but longer`
      : `At offset ${c.lcp}: '${charLabel(c.probes.at(-1)!.left)}' < '${charLabel(c.probes.at(-1)!.right)}'`
  }
  return (
    <div className="mom-page target-visual suffix-array-page" data-target="41">
      <header className="sa-topbar">
        <button className="sa-back" aria-label={tr('Back to Boyer–Moore')} onClick={() => navigate('/daa-extensions/boyer-moore')}>
          <ArrowLeft size={19} />
        </button>
        <div className="sa-title-row">
          <h1>{tr('Suffix Array')}</h1>
          <p>{tr('Sort suffix starts lexicographically.')}</p>
        </div>
        <button className="mom-study" aria-pressed={studied} onClick={() => props.toggleCompleted(props.module.id)}>
          {studied ? <Check size={16} /> : <Bookmark size={16} />} {tr(studied ? 'Studied' : 'Mark studied')}
        </button>
        <AccountControl showLanguage={false} />
      </header>
      <MockupTabs active={tab} onChange={changeTab} tabs={tabs} />
      {tab === 'Visualization' ? (
        <>
          <section className={`sa-input-panel${pending || error ? ' sa-feedback' : ''}`}>
            <div className="sa-input-left">
              <header>
                <span className="sa-main-icon">
                  <FileText size={26} />
                </span>
                <div>
                  <h2>{tr('Input String')}</h2>
                  <p>{tr('Enter a string to build its suffix array. Try the example or type your own.')}</p>
                </div>
              </header>
              <div className="sa-input-row">
                <input
                  aria-label={tr('Suffix array input string')}
                  value={draft}
                  onChange={(e) => {
                    setDraft(e.target.value)
                    setPlaying(false)
                    setError('')
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      try {
                        load(draft)
                      } catch (err) {
                        setError((err as Error).message)
                      }
                    }
                  }}
                />
                <button onClick={() => load(suffixArrayExample)}>
                  <Sparkles size={16} />
                  {tr('Use example: banana')}
                </button>
              </div>
              <p className="sa-length-note">
                {tr(
                  Array.from(draft).length
                    ? `Length: ${Array.from(draft).length} characters (indices 0 to ${Array.from(draft).length - 1})`
                    : 'Length: 0 characters (no non-empty suffixes)',
                )}
                {pending && <span>{tr(' — Unapplied changes; animate or compare to apply.')}</span>}
              </p>
              {error && (
                <p className="sa-error" role="alert">
                  {tr(error)}
                </p>
              )}
            </div>
            <div className="sa-actions">
              <button className="sa-primary" onClick={animate}>
                {playing ? <Pause size={20} /> : <Play size={20} fill="currentColor" />}
                {tr(playing ? 'Pause Build' : pending || complete ? 'Animate Build' : 'Resume Build')}
              </button>
              <button onClick={compareInput} disabled={!pending && !n}>
                <ArrowRightLeft size={21} />
                {tr('Compare')}
              </button>
              <button onClick={reset}>
                <RotateCw size={21} />
                {tr('Reset')}
              </button>
            </div>
          </section>
          <div className="sa-main-grid">
            <Panel className="sa-all" title={tr('All Suffixes')} icon={<FileText size={26} />}>
              <p className="sa-subtitle">{tr('Suffixes starting at each index of the string.')}</p>
              <div className="sa-table-scroll sa-all-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>{tr('Index (i)')}</th>
                      <th>{tr('Suffix s[i…]')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {run.suffixes.slice(0, frame.generated).map((s) => (
                      <tr key={s.index}>
                        <td>
                          <button
                            className="sa-pill"
                            style={tint(s.index)}
                            aria-label={tr(`Inspect unsorted suffix ${s.index}`)}
                            onClick={() => inspectSuffix(s.index)}
                          >
                            {s.index}
                          </button>
                        </td>
                        <td>
                          <button
                            className="sa-suffix-text"
                            title={s.suffix}
                            aria-label={tr(`Read suffix starting at ${s.index}`)}
                            onClick={() => inspectSuffix(s.index)}
                          >
                            {s.suffix}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {!frame.generated && <p className="sa-empty">{tr(n ? 'Generate the suffixes to begin.' : 'No non-empty suffixes.')}</p>}
              </div>
            </Panel>
            <Panel className="sa-sorted" title={tr('Sorted Suffixes (Suffix Array)')} icon={<ArrowDownUp size={27} />}>
              <p className="sa-subtitle">
                {tr(
                  complete
                    ? 'Sort suffixes lexicographically and record their starting indices.'
                    : frame.phase === 'sort'
                      ? 'Merging sorted groups; this order is not final.'
                      : 'Generate suffixes before sorting.',
                )}
              </p>
              <div className="sa-table-scroll sa-sorted-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>{tr('SA order')}</th>
                      <th>{tr('Index')}</th>
                      <th>{tr('Suffix')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {frame.order.map((start, i) => (
                      <tr key={start} className={complete && query && queryResult.positions.includes(start) ? 'sa-query-match' : ''}>
                        <td>
                          <button aria-label={tr(`Show suffix order ${i + 1}`)} disabled={!complete} onClick={() => setStep(i)}>
                            {i + 1}
                          </button>
                        </td>
                        <td>
                          <button
                            className="sa-pill"
                            style={tint(start)}
                            aria-label={tr(`Inspect sorted suffix ${start}`)}
                            onClick={() => inspectSuffix(start)}
                          >
                            {start}
                          </button>
                        </td>
                        <td>
                          <button
                            className="sa-suffix-text"
                            title={run.suffixes[start].suffix}
                            onClick={() => {
                              if (complete) setStep(i)
                            }}
                          >
                            {run.suffixes[start].suffix}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {!frame.order.length && <p className="sa-empty">{tr(n ? 'The sorted order will appear here.' : 'Suffix array is empty.')}</p>}
              </div>
              <div className="sa-array-banner">
                <strong>{tr(complete ? 'Suffix Array (SA):' : 'Working order:')}</strong>
                <span>{'['}</span>
                {frame.order.map((start, i) => (
                  <span className="sa-array-entry" key={start}>
                    <button className="sa-pill" style={tint(start)} aria-label={tr(`Inspect suffix array entry ${i + 1}`)} onClick={() => inspectSuffix(start)}>
                      {start}
                    </button>
                    {i < frame.order.length - 1 ? ',' : ''}
                  </span>
                ))}
                <span>{']'}</span>
              </div>
            </Panel>
            <Panel className="sa-comparison" title={tr('Step-by-Step Lexicographic Comparison')} icon={<BarChart3 size={27} />}>
              <p className="sa-subtitle">{tr('See how suffixes are ordered by comparing characters.')}</p>
              <div className="sa-step-scroll" ref={track}>
                <div className="sa-step-track" style={{ minWidth: Math.max(0, n * 73 - 30) }}>
                  {run.sa.map((_, i) => (
                    <button
                      key={i}
                      data-step={i}
                      aria-label={tr(`Compare suffix order ${i + 1}`)}
                      aria-pressed={step === i}
                      disabled={!complete}
                      onClick={() => setStep(i)}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
              </div>
              <div className="sa-step-detail">
                <span>
                  <ShieldCheck size={28} />
                </span>
                <div>
                  <h3>
                    {tr(
                      !complete
                        ? 'Build in progress'
                        : !n
                          ? 'No suffixes yet'
                          : `Step ${step + 1}: ${step === 0 ? 'Smallest suffix' : step === n - 1 ? 'Last suffix' : 'Next suffix'}`,
                    )}
                  </h3>
                  <p>
                    {tr(
                      complete
                        ? detail
                        : `${frame.generated} of ${n} suffixes generated. ${frame.phase === 'sort' ? 'Sorted groups are being merged.' : 'Each suffix starts at one text position.'}`,
                    )}
                  </p>
                </div>
              </div>
              {complete && selected !== undefined ? (
                <>
                  <button
                    className="sa-winner"
                    style={tint(selected)}
                    aria-label={tr(`Inspect winning suffix ${selected}`)}
                    onClick={() => inspectSuffix(selected)}
                  >
                    <span className="sa-index-box">
                      <b className="sa-pill">{selected}</b>
                    </span>
                    <span className="sa-compare-suffix">{suffix(selected, selectedNext?.lcp ?? 0)}</span>
                    <span className="sa-smallest">
                      {tr(step === 0 ? 'Smallest' : `Rank ${step + 1}`)}
                      <Check size={15} />
                    </span>
                  </button>
                  {alternatives.length ? (
                    <>
                      <div className="sa-vs">{tr('vs.')}</div>
                      <div className="sa-alternatives">
                        {alternatives.map((start) => (
                          <button
                            key={start}
                            style={tint(start)}
                            aria-label={tr(`Compare suffix ${selected} with ${start}`)}
                            onClick={() => openComparison(selected, start)}
                          >
                            <span className="sa-index-box">
                              <b className="sa-pill">{start}</b>
                            </span>
                            <span className="sa-compare-suffix">{suffix(start, compareSuffixes(run.chars, selected, start).lcp)}</span>
                            <small>{tr(reason(start))}</small>
                          </button>
                        ))}
                      </div>
                    </>
                  ) : (
                    <p className="sa-last-note">{tr(n === 1 ? 'There is only one non-empty suffix.' : 'No larger suffix remains; the order is complete.')}</p>
                  )}
                </>
              ) : (
                <p className="sa-empty">{tr(n ? 'Finish the build to compare sorted suffixes.' : 'Enter a non-empty string to compare suffixes.')}</p>
              )}
            </Panel>
          </div>
          <div className="sa-bottom-grid">
            <section className="sa-panel sa-lcp-panel">
              <div className="sa-lcp-left">
                <header>
                  <span className="sa-insight-icon">
                    <Lightbulb size={29} />
                  </span>
                  <div>
                    <h2>{tr('LCP Array and Rank Insight')}</h2>
                    <p>
                      {tr(
                        'LCP[i] is the length of the longest common prefix between adjacent suffixes in the sorted order. Rank[i] gives position of suffix starting at i in SA.',
                      )}
                    </p>
                  </div>
                </header>
                {complete ? (
                  <div className="sa-lcp-scroll">
                    <table style={{ minWidth: Math.max(450, n * 50 + 86) }}>
                      <tbody>
                        <tr>
                          <th>{tr('i (SA order)')}</th>
                          {run.sa.map((_, i) => (
                            <th key={i}>{i + 1}</th>
                          ))}
                        </tr>
                        <tr>
                          <th>{tr('SA[i]')}</th>
                          {run.sa.map((start, i) => (
                            <td key={start}>
                              <button
                                className="sa-pill"
                                style={tint(start)}
                                aria-label={tr(`Inspect LCP suffix ${i + 1}`)}
                                onClick={() => inspectSuffix(start)}
                              >
                                {start}
                              </button>
                            </td>
                          ))}
                        </tr>
                        <tr>
                          <th>{tr('Suffix')}</th>
                          {run.sa.map((start) => (
                            <td key={start} title={run.suffixes[start].suffix}>
                              {run.suffixes[start].suffix}
                            </td>
                          ))}
                        </tr>
                        <tr>
                          <th>{tr('LCP[i]')}</th>
                          {run.lcp.map((value, i) => (
                            <td key={i}>
                              <button aria-label={tr(`Explain LCP at order ${i + 1}`)} onClick={() => inspectLcp(i)}>
                                {value}
                              </button>
                            </td>
                          ))}
                        </tr>
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="sa-empty">{tr('LCP and inverse ranks appear after sorting is complete.')}</p>
                )}
              </div>
              <aside className="sa-rank">
                <h3>
                  {tr('Rank Array')} <small>{tr('(position of each index in SA)')}</small>
                </h3>
                <div className="sa-rank-scroll">
                  <table>
                    <thead>
                      <tr>
                        <th>{tr('Index')}</th>
                        <th>{tr('Rank[i]')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {complete &&
                        run.rank.map((value, i) => (
                          <tr key={i}>
                            <td>
                              <button className="sa-pill" style={tint(i)} aria-label={tr(`Inspect rank of index ${i}`)} onClick={() => inspectSuffix(i)}>
                                {i}
                              </button>
                            </td>
                            <td>{value}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </aside>
            </section>
            <Panel className="sa-order" title={tr('Visualization: Sorted Order')} icon={<BarChart3 size={25} />}>
              <p className="sa-subtitle">{tr('Suffixes in lexicographic order (arrows show increasing order).')}</p>
              <div className="sa-order-scroll">
                {frame.order.map((start, i) => (
                  <button
                    className="sa-order-row"
                    key={start}
                    style={tint(start)}
                    aria-label={tr(`View sorted order ${i + 1}`)}
                    disabled={!complete}
                    onClick={() => setStep(i)}
                  >
                    <span className="sa-ordinal">{tr(ordinal(i + 1))}</span>
                    <ArrowDown size={20} />
                    <span className="sa-order-city">{start}</span>
                    <ArrowRight size={22} />
                    <span className="sa-order-suffix" title={run.suffixes[start].suffix}>
                      {run.suffixes[start].suffix}
                    </span>
                  </button>
                ))}
              </div>
            </Panel>
            <aside className="sa-proof-stack">
              <Panel className="sa-correctness" title={tr('Correctness')} icon={<CheckCircle2 size={27} />}>
                <p>
                  {tr(
                    complete
                      ? 'Sorting all suffixes lexicographically and recording their starting indices produces the correct suffix array.'
                      : 'Generate all suffixes, then merge them in lexicographic order.',
                  )}
                </p>
              </Panel>
              <Panel className="sa-complexity" title={tr('Complexity')} icon={<BarChart3 size={27} />}>
                <p>
                  <b>{tr('Time: O(n² log n)')}</b>
                </p>
                <small>{tr('(comparison-based sorting)')}</small>
                <p>
                  <b>{tr('Space: O(n²)')}</b>
                </p>
                <small>{tr('(for storing all suffixes; O(n) additional)')}</small>
              </Panel>
            </aside>
          </div>
        </>
      ) : tab === 'Learn' ? (
        <div className="sa-learning">
          <Panel title={tr('A suffix array stores starts, not whole strings')} icon={<FileText />}>
            <p>
              {tr(
                'A suffix is the substring from some index to the end. A string of n code points has n non-empty suffixes, starting at indices 0 through n − 1. Sort those suffixes lexicographically; the suffix array records only their starting indices. This lesson materializes the strings so every step is visible.',
              )}
            </p>
            <h3>{tr('Lexicographic comparison')}</h3>
            <p>
              {tr(
                'Compare characters from left to right. The first differing code point decides the order. If all compared characters agree and one suffix ends, the shorter suffix comes first. Equal suffixes occur only when comparing a suffix with itself. This lesson uses Unicode code-point order rather than language-specific collation and preserves case and spaces.',
              )}
            </p>
          </Panel>
          <Panel title={tr('Worked example: banana')} icon={<Lightbulb />}>
            <p>
              {tr(
                'The sorted suffixes are a, ana, anana, banana, na, nana. Their starting positions give SA = [5, 3, 1, 0, 4, 2]. The first comparison a versus ana shares a, then a ends, so a is smaller.',
              )}
            </p>
            <p>
              {tr(
                'LCP stores the common-prefix length of each suffix with its predecessor: [0, 1, 3, 0, 0, 2]. The first value is defined as zero. Rank is the inverse order; this page displays ranks starting at 1, so rank[0] = 4 and rank[5] = 1. String indices remain zero-based.',
              )}
            </p>
            <h3>{tr('Build and search')}</h3>
            <p>
              {tr(
                'The animation first generates each suffix, then uses deterministic merge sort. Sorting makes O(n log n) comparisons, each potentially scanning O(n) characters, for O(n² log n) time. Materialized suffixes require O(n²) space; working arrays require O(n) additional space. Recorded teaching traces have extra storage costs. Binary search finds the contiguous range of suffixes that begin with a non-empty query; every start in that range is an occurrence, including overlapping ones.',
              )}
            </p>
            <button
              onClick={() => {
                load(suffixArrayExample)
                setTab('Experiments')
                setQueryDraft('ana')
              }}
            >
              {tr('Search banana for ana')}
            </button>
          </Panel>
        </div>
      ) : tab === 'Code' ? (
        <Panel className="sa-code" title={tr('Sort suffix starts and compute adjacent LCP')} icon={<FileText />}>
          <pre>
            <code>{`function compareSuffix(T, i, j) {
  let k = 0;
  while (i + k < T.length && j + k < T.length) {
    const d = T[i + k].codePointAt(0) - T[j + k].codePointAt(0);
    if (d) return Math.sign(d);
    k++;
  }
  return Math.sign((T.length - i) - (T.length - j));
}
const T = Array.from(text);
const SA = mergeSort(T.map((_, i) => i), (i, j) => compareSuffix(T, i, j));
const rank = Array(T.length);
SA.forEach((start, i) => rank[start] = i + 1); // displayed one-based ranks
const LCP = SA.map((start, i) => i ? commonPrefix(T, SA[i-1], start) : 0);`}</code>
          </pre>
        </Panel>
      ) : tab === 'Practice' ? (
        <Panel className="sa-practice" title={tr('Predict the prefix ordering')} icon={<Lightbulb />}>
          <p>{tr('Which suffix is smaller: ana at index 3 or anana at index 1 in banana?')}</p>
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
              <option value="3">{tr('ana at index 3')}</option>
              <option value="1">{tr('anana at index 1')}</option>
              <option value="equal">{tr('They are equal')}</option>
            </select>
          </label>
          <button
            onClick={() =>
              setFeedback(
                prediction === '3'
                  ? 'Correct. Both share ana, but the suffix at index 3 ends first. Their common-prefix length is 3.'
                  : 'Try again: compare all shared characters, then check which suffix ends first.',
              )
            }
          >
            {tr('Check prediction')}
          </button>
          {feedback && <p role="status">{tr(feedback)}</p>}
        </Panel>
      ) : (
        <div className="sa-experiments">
          <Panel title={tr('Construction trace and prefix search')} icon={<ArrowDownUp />}>
            <div className="sa-experiment-controls">
              <button
                onClick={() => {
                  try {
                    if (pending) load(draft)
                    setCursor(0)
                    setPlaying(false)
                  } catch (e) {
                    setError((e as Error).message)
                  }
                }}
              >
                {tr('Restart construction')}
              </button>
              <button
                onClick={() => {
                  setCursor(Math.min(run.frames.length - 1, cursor + 1))
                  setPlaying(false)
                }}
              >
                {tr('Next build event')}
              </button>
              <button
                onClick={() => {
                  setCursor(run.defaultCursor)
                  setPlaying(false)
                }}
              >
                {tr('Show completed suffix array')}
              </button>
              <label>
                {tr('Build speed')}
                <select aria-label={tr('Build speed')} value={speed} onChange={(e) => setSpeed(Number(e.target.value))}>
                  <option value={1400}>{tr('Slow')}</option>
                  <option value={700}>{tr('Normal')}</option>
                  <option value={100}>{tr('Fast')}</option>
                </select>
              </label>
            </div>
            <label className="sa-build-range">
              {tr(`Build event ${cursor} / ${run.frames.length - 1}`)}
              <input
                type="range"
                aria-label={tr('Suffix build event')}
                min="0"
                max={run.frames.length - 1}
                value={cursor}
                onChange={(e) => {
                  setCursor(Number(e.target.value))
                  setPlaying(false)
                }}
              />
            </label>
            <p className="sa-build-status">
              {tr(`Phase: ${frame.phase}; generated suffixes: ${frame.generated}/${n}; recorded lexicographic comparisons: ${run.comparisons.length}.`)}
            </p>
            <label>
              {tr('Prefix query')}
              <input
                aria-label={tr('Suffix prefix query')}
                value={queryDraft}
                onChange={(e) => {
                  setQueryDraft(e.target.value)
                  setQueryError('')
                }}
              />
            </label>
            <button
              onClick={() => {
                try {
                  searchSuffixArray(run, queryDraft)
                  setQuery(queryDraft)
                  setQueryError('')
                } catch (e) {
                  setQueryError((e as Error).message)
                }
              }}
            >
              {tr('Search suffixes')}
            </button>
            {queryError && <p role="alert">{tr(queryError)}</p>}
            <p className="sa-query-result">
              {tr(
                query
                  ? queryResult.positions.length
                    ? `Matches at text indices ${queryResult.positions.join(', ')}. Contiguous SA ranks ${queryResult.lo + 1}–${queryResult.hi}; ${queryResult.comparisons} character probes.`
                    : 'No suffix begins with this query.'
                  : 'Enter a non-empty query. Empty queries are not searched in this view.',
              )}
            </p>
            <p>{tr(`Computed final SA: [${run.sa.join(', ')}]. LCP: [${run.lcp.join(', ')}].`)}</p>
            <button onClick={() => setTab('Visualization')}>{tr('Return to suffix workspace')}</button>
          </Panel>
          <Panel title={tr('Notes and preferences')} icon={<Bookmark />}>
            <label>
              {tr('Suffix array notes')}
              <textarea aria-label={tr('Suffix array notes')} value={notes} onChange={(e) => setNotes(e.target.value)} />
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
      <dialog ref={dialog} className="sa-dialog" onCancel={() => setModal(null)}>
        <button className="sa-close" aria-label={tr('Close suffix array dialog')} onClick={() => setModal(null)}>
          <X size={20} />
        </button>
        {modal === 'suffix' && inspected ? (
          <>
            <h2>{tr(`Suffix starting at index ${inspect}`)}</h2>
            <p className="sa-full-suffix">{inspected.suffix}</p>
            <p>
              {tr(
                `Length: ${n - inspect} code points. Sorted rank: ${run.rank[inspect]} (one-based). LCP with predecessor: ${run.lcp[run.rank[inspect] - 1]}.`,
              )}
            </p>
            {run.rank[inspect] > 1 ? (
              <button onClick={() => openComparison(inspect, run.sa[run.rank[inspect] - 2])}>{tr('Compare with predecessor')}</button>
            ) : (
              <p>{tr('There is no predecessor: this is the first suffix in the sorted order.')}</p>
            )}
          </>
        ) : modal === 'lcp' ? (
          <>
            <h2>{tr(`LCP at SA order ${inspect + 1}`)}</h2>
            <p>
              {tr(
                inspect === 0
                  ? 'The first suffix has no predecessor; its LCP entry is defined as 0.'
                  : `Compare suffix ${run.sa[inspect - 1]} with suffix ${run.sa[inspect]}. Shared prefix "${run.chars.slice(run.sa[inspect], run.sa[inspect] + run.lcp[inspect]).join('')}" has length ${run.lcp[inspect]}.`,
              )}
            </p>
            {inspect > 0 && <button onClick={() => openComparison(run.sa[inspect - 1], run.sa[inspect])}>{tr('Inspect this character comparison')}</button>}
          </>
        ) : modal === 'compare' && comparison ? (
          <>
            <h2>{tr('Compare two suffixes')}</h2>
            <div className="sa-compare-inputs">
              <label>
                {tr('Left suffix')}
                <select
                  aria-label={tr('Left suffix')}
                  value={left}
                  onChange={(e) => {
                    setLeft(Number(e.target.value))
                    setProbe(0)
                  }}
                >
                  {run.suffixes.map((s) => (
                    <option key={s.index} value={s.index}>{`${s.index}: ${s.suffix}`}</option>
                  ))}
                </select>
              </label>
              <label>
                {tr('Right suffix')}
                <select
                  aria-label={tr('Right suffix')}
                  value={right}
                  onChange={(e) => {
                    setRight(Number(e.target.value))
                    setProbe(0)
                  }}
                >
                  {run.suffixes.map((s) => (
                    <option key={s.index} value={s.index}>{`${s.index}: ${s.suffix}`}</option>
                  ))}
                </select>
              </label>
            </div>
            <p className="sa-probe">
              {tr(
                `Offset ${visibleProbe?.offset}: ${charLabel(visibleProbe?.left ?? null)} ${visibleProbe?.result === 0 ? '=' : visibleProbe?.result === -1 ? '<' : '>'} ${charLabel(visibleProbe?.right ?? null)}`,
              )}
            </p>
            <button disabled={probe >= comparison.probes.length - 1} onClick={() => setProbe((p) => Math.min(comparison.probes.length - 1, p + 1))}>
              {tr('Compare next character')}
            </button>
            <button onClick={() => setProbe(0)}>{tr('Restart comparison')}</button>
            <p>
              {tr(
                probe >= comparison.probes.length - 1
                  ? comparison.reason === 'equal'
                    ? 'The suffixes are equal.'
                    : comparison.reason === 'prefix'
                      ? `One suffix ends after ${comparison.lcp} shared characters. The shorter suffix is smaller.`
                      : `The first differing code point is at offset ${comparison.lcp}; it decides the order.`
                  : 'The current characters agree. Continue to find a difference or the end of a suffix.',
              )}
            </p>
            <p>
              {tr(
                `Longest common prefix: ${comparison.lcp}. Final order: suffix ${left} ${comparison.result === 0 ? '=' : comparison.result === -1 ? '<' : '>'} suffix ${right}.`,
              )}
            </p>
          </>
        ) : null}
      </dialog>
    </div>
  )
}
